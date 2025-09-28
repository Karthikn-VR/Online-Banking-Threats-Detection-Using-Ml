from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import errorcode
import bcrypt
import uuid
from datetime import datetime, timedelta
import pandas as pd
import pickle
import os
from joblib import load as joblib_load
import numpy as np

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@Karthiknvr2004',
    'database': 'bank'
}

# Configurable transaction limits (override via env vars)
MAX_TXNS_PER_DAY = int(os.getenv('MAX_TXNS_PER_DAY', '7'))
MAX_TXN_AMOUNT = float(os.getenv('MAX_TXN_AMOUNT', '60000'))

# Load fraud detection model components
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

def try_load_model(path: str):
    try:
        return joblib_load(path)
    except Exception as e1:
        try:
            with open(path, 'rb') as f:
                return pickle.load(f)
        except Exception as e2:
            print(f"Failed to load {os.path.basename(path)} via joblib ({e1}) and pickle ({e2})")
            return None

fraud_model = try_load_model(os.path.join(MODEL_DIR, 'fraud_model.pkl'))
encoders = try_load_model(os.path.join(MODEL_DIR, 'encoders.pkl'))
scaler = try_load_model(os.path.join(MODEL_DIR, 'scaler.pkl'))

if fraud_model and encoders and scaler:
    print("Fraud model components loaded successfully.")
else:
    print("Error loading fraud model components: one or more artifacts failed to load.")

last_db_error = None

def ensure_database_exists():
    try:
        temp_config = {k: v for k, v in db_config.items() if k != 'database'}
        conn = mysql.connector.connect(**temp_config)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config['database']}")
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except mysql.connector.Error as err:
        print(f"Error ensuring database exists: {err}")
        return False

def get_db_connection():
    global last_db_error
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        last_db_error = str(err)
        # Attempt to create database if missing
        if getattr(err, 'errno', None) == errorcode.ER_BAD_DB_ERROR:
            created = ensure_database_exists()
            if created:
                try:
                    conn = mysql.connector.connect(**db_config)
                    return conn
                except mysql.connector.Error as err2:
                    last_db_error = str(err2)
        print(f"Error connecting to database: {err}")
        return None

# Ensure required tables exist
def ensure_users_table(conn):
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(36) PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                account_number VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL
            )
            """
        )
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error ensuring users table exists: {err}")
        raise
    finally:
        try:
            cursor.close()
        except Exception:
            pass

# Ensure transactions table and required columns exist
def ensure_transactions_table(conn):
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                txn_id VARCHAR(36) PRIMARY KEY,
                sender_user_id VARCHAR(36) NOT NULL,
                receiver_account_number VARCHAR(50) NOT NULL,
                receiver_name VARCHAR(255),
                amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                description TEXT,
                channel VARCHAR(50),
                authorization_method VARCHAR(50),
                is_international TINYINT(1),
                timestamp DATETIME NOT NULL,
                txn_hour INT,
                txn_day_of_week INT,
                ip_address VARCHAR(45),
                device_fingerprint VARCHAR(255),
                is_new_payee TINYINT(1),
                txn_count_last_24h INT,
                sum_amount_last_24h DECIMAL(15,2),
                is_fraud TINYINT(1),
                status VARCHAR(20)
            )
            """
        )
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Error ensuring transactions table exists: {err}")
        raise
    finally:
        try:
            cursor.close()
        except Exception:
            pass

def ensure_transactions_schema(conn):
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT COLUMN_NAME FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'transactions'
            """,
            (db_config['database'],)
        )
        existing = {row[0] for row in cursor.fetchall()}

        expected_defs = {
            'txn_id': 'VARCHAR(36)',
            'sender_user_id': 'VARCHAR(36)',
            'receiver_account_number': 'VARCHAR(50)',
            'receiver_name': 'VARCHAR(255)',
            'amount': 'DECIMAL(15,2)',
            'currency': 'VARCHAR(10)',
            'description': 'TEXT',
            'channel': 'VARCHAR(50)',
            'authorization_method': 'VARCHAR(50)',
            'is_international': 'TINYINT(1)',
            'timestamp': 'DATETIME',
            'txn_hour': 'INT',
            'txn_day_of_week': 'INT',
            'ip_address': 'VARCHAR(45)',
            'device_fingerprint': 'VARCHAR(255)',
            'is_new_payee': 'TINYINT(1)',
            'txn_count_last_24h': 'INT',
            'sum_amount_last_24h': 'DECIMAL(15,2)',
            'is_fraud': 'TINYINT(1)',
            'status': 'VARCHAR(20)'
        }

        missing = [(name, dtype) for name, dtype in expected_defs.items() if name not in existing]
        if missing:
            alter_stmt = "ALTER TABLE transactions " + ", ".join([f"ADD COLUMN {name} {dtype}" for name, dtype in missing])
            cursor.execute(alter_stmt)
            conn.commit()
    except mysql.connector.Error as err:
        print(f"Error ensuring transactions schema: {err}")
        raise
    finally:
        try:
            cursor.close()
        except Exception:
            pass

# Helper function to generate derived fields and perform validations
def generate_derived_fields_and_validate(user_id, receiver_account_number, amount, currency, ip_address, device_fingerprint, conn):
    current_time = datetime.now()
    txn_id = str(uuid.uuid4())

    # Fetch sender's account number from DB using user_id
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT account_number FROM users WHERE user_id = %s", (user_id,))
    sender_info = cursor.fetchone()
    if not sender_info:
        return {'error': 'Sender not found.'}, 404
    sender_account_number = sender_info['account_number']

    # Check for new payee
    is_new_payee = False
    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM transactions WHERE sender_user_id = %s AND receiver_account_number = %s",
        (user_id, receiver_account_number)
    )
    row = cursor.fetchone()
    if (row.get('cnt') if row else 0) == 0:
        is_new_payee = True

    # Check if international transaction (simplified: if currency is not USD, assume international)
    is_international = (currency.upper() != 'USD') # This is a simplification; a more robust check would involve country codes or receiver bank location

    # Transaction count and sum in last 24 hours
    last_24h_threshold = current_time - timedelta(hours=24)
    cursor.execute(
        "SELECT COUNT(*) AS cnt, SUM(amount) AS total_amount FROM transactions WHERE sender_user_id = %s AND timestamp >= %s AND status = 'Success'",
        (user_id, last_24h_threshold)
    )
    txn_data_24h = cursor.fetchone() or {}
    txn_count_last_24h = (txn_data_24h.get('cnt') or 0)
    sum_amount_last_24h = float(txn_data_24h.get('total_amount') or 0.0)

    # Apply constraints (configurable)
    if txn_count_last_24h >= MAX_TXNS_PER_DAY:
        return {'error': f'Transaction limit exceeded: Max {MAX_TXNS_PER_DAY} transactions per day.'}, 403
    if amount > MAX_TXN_AMOUNT:
        return {'error': f'Transaction amount limit exceeded: Max {int(MAX_TXN_AMOUNT):,}.'}, 403

    derived_fields = {
        'txn_id': txn_id,
        'timestamp': current_time,
        'txn_hour': current_time.hour,
        'txn_day_of_week': current_time.weekday(), # Monday is 0, Sunday is 6
        'ip_address': ip_address, # Placeholder, in a real app this would come from request headers
        'device_fingerprint': device_fingerprint, # Placeholder
        'is_new_payee': is_new_payee,
        'is_international': is_international,
        'txn_count_last_24h': txn_count_last_24h,
        'sum_amount_last_24h': sum_amount_last_24h,
        'sender_account_number': sender_account_number
    }
    return derived_fields, 200

@app.route('/')
def home():
    return "Fraud Detection Banking Backend"

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    full_name = data.get('full_name')
    account_number = data.get('account_number')
    email = data.get('email')
    password = data.get('password')

    if not all([full_name, account_number, email, password]):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': 'Database connection error', 'details': last_db_error}), 500
    cursor = conn.cursor()

    try:
        # Make sure the users table exists before querying/insert
        ensure_users_table(conn)

        # Check if email or account number already exists
        cursor.execute("SELECT * FROM users WHERE email = %s OR account_number = %s", (email, account_number))
        if cursor.fetchone():
            return jsonify({'message': 'Email or account number already exists'}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        # Generate UUID and ensure it's properly formatted as a string
        user_id = str(uuid.uuid4())
        
        # Print for debugging
        print(f"Generated user_id: {user_id}, length: {len(user_id)}")

        cursor.execute(
            "INSERT INTO users (user_id, full_name, account_number, email, password_hash) VALUES (%s, %s, %s, %s, %s)",
            (user_id, full_name, account_number, email, hashed_password)
        )
        conn.commit()
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Error during registration: {err}")
        return jsonify({'message': f'Database error: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'message': 'Missing email or password'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': 'Database connection error'}), 500
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT user_id, password_hash, full_name, account_number, email FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        def safe_check_password(plain: str, hashed: str) -> bool:
            try:
                return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
            except (ValueError, TypeError):
                return False

        if user and safe_check_password(password, user['password_hash']):
            # In a real application, you'd generate a JWT here
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'user_id': user['user_id'],
                    'full_name': user['full_name'],
                    'account_number': user['account_number'],
                    'email': user['email']
                }
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except mysql.connector.Error as err:
        print(f"Error during login: {err}")
        return jsonify({'message': f'Database error: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.get_json()
    
    sender_user_id = data.get('user_id')
    receiver_account_number = data.get('receiver_account_number')
    receiver_name = data.get('receiver_name')
    amount = data.get('amount')
    currency = data.get('currency')
    description = data.get('description')
    channel = data.get('send_via') # Renamed from send_via to channel as per DB schema
    authorization_method = data.get('authorization_method')

    if not all([sender_user_id, receiver_account_number, amount, currency, channel, authorization_method]):
        return jsonify({'message': 'Missing required transaction fields'}), 400

    # Placeholder for IP address and device fingerprint - in a real app, these would be extracted from the request
    ip_address = request.remote_addr if request.remote_addr else "127.0.0.1"
    device_fingerprint = request.headers.get('X-Device-Fingerprint', str(uuid.uuid4()))

    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': 'Database connection error'}), 500
    # Ensure table and schema are present before using
    try:
        ensure_transactions_table(conn)
        ensure_transactions_schema(conn)
    except Exception as e:
        return jsonify({'message': f'Database schema error: {e}'}), 500

    derived_fields, status_code = generate_derived_fields_and_validate(
        sender_user_id, receiver_account_number, amount, currency, ip_address, device_fingerprint, conn
    )

    if status_code != 200:
        conn.close()
        return jsonify(derived_fields), status_code # derived_fields here contains the error message

    txn_id = derived_fields['txn_id']
    timestamp = derived_fields['timestamp']
    txn_hour = derived_fields['txn_hour']
    txn_day_of_week = derived_fields['txn_day_of_week']
    ip_address = derived_fields['ip_address']
    device_fingerprint = derived_fields['device_fingerprint']
    is_new_payee = derived_fields['is_new_payee']
    is_international = derived_fields['is_international']
    txn_count_last_24h = derived_fields['txn_count_last_24h']
    sum_amount_last_24h = derived_fields['sum_amount_last_24h']

    is_fraud = False # Default to not fraud
    transaction_status = 'Success' # Default status
    fraud_prediction_message = "Transaction successful."

    try:
        if fraud_model and encoders and scaler:
            # Prepare base features for the fraud model (ensure correct types)
            base = {
                'amount': float(amount),
                'currency': str(currency),
                'channel': str(channel),
                'authorization_method': str(authorization_method),
                'txn_hour': int(txn_hour),
                'txn_day_of_week': int(txn_day_of_week),
                'is_new_payee': int(bool(is_new_payee)),
                'is_international': int(bool(is_international)),
                'txn_count_last_24h': int(txn_count_last_24h),
                'sum_amount_last_24h': float(sum_amount_last_24h or 0)
            }

            features = pd.DataFrame([base])

            # Apply encoders with type-aware handling only for categorical inputs
            categorical_cols = {'currency', 'channel', 'authorization_method'}
            for column, encoder in encoders.items():
                if column not in features.columns or column not in categorical_cols:
                    continue

                # Handle unseen labels by mapping to first known category/class
                safe_series = features[column].astype(str)
                if hasattr(encoder, 'categories_'):
                    # OneHotEncoder path
                    cats = [str(c) for c in encoder.categories_[0]]
                    safe_series = safe_series.apply(lambda x: x if x in cats else cats[0])
                    encoded = encoder.transform(safe_series.values.reshape(-1, 1))
                    encoded = encoded.toarray() if hasattr(encoded, 'toarray') else np.asarray(encoded)
                    col_names = [f"{column}_{cat}" for cat in cats]
                    encoded_df = pd.DataFrame(encoded, columns=col_names)
                    features = pd.concat([features.drop(columns=[column]), encoded_df], axis=1)
                elif hasattr(encoder, 'classes_'):
                    # LabelEncoder path (expects 1D array)
                    classes = [str(c) for c in encoder.classes_]
                    safe_series = safe_series.apply(lambda x: x if x in classes else classes[0])
                    encoded = encoder.transform(safe_series.values)
                    features[f"{column}_label"] = encoded
                    features = features.drop(columns=[column])
                else:
                    # Unknown encoder type, skip transformation
                    pass

            # Scale features according to scaler's fitted feature names
            scale_cols = list(getattr(scaler, 'feature_names_in_', []))
            if scale_cols:
                # Ensure all expected scaler columns exist; fill missing with 0
                for col in scale_cols:
                    if col not in features.columns:
                        features[col] = 0
                scaled_values = scaler.transform(features[scale_cols])
                features[scale_cols] = scaled_values
            else:
                # Fallback: scale known numeric columns including time-based ones
                numerical_cols = [c for c in ['amount', 'txn_count_last_24h', 'sum_amount_last_24h', 'txn_hour', 'txn_day_of_week'] if c in features.columns]
                if numerical_cols:
                    features[numerical_cols] = scaler.transform(features[numerical_cols])

            # Align columns to model expectations when available
            expected_cols = getattr(fraud_model, 'feature_names_in_', None)
            if expected_cols is not None:
                aligned = pd.DataFrame(columns=expected_cols)
                for col in expected_cols:
                    aligned[col] = features[col] if col in features.columns else 0
                features = aligned

            # Debug logging of feature alignment and values
            try:
                print("Model feature_names_in_:", getattr(fraud_model, 'feature_names_in_', None))
                print("Prediction features columns:", list(features.columns))
                print("Prediction features row:", features.to_dict(orient='records')[0])
            except Exception as dbg_e:
                print("Failed to print prediction debug info:", dbg_e)

            prediction = fraud_model.predict(features)[0]

            if prediction == 1:  # Assuming 1 means fraud
                is_fraud = True
                transaction_status = 'Failed'
                fraud_prediction_message = "Transaction flagged as fraud and blocked."
            else:
                is_fraud = False
                transaction_status = 'Success'
                fraud_prediction_message = "Transaction successful."

            # Log final outcome to server console
            try:
                print(f"Fraud prediction outcome: {'FRAUD' if is_fraud else 'LEGIT'}; status={transaction_status}; txn_id={txn_id}")
            except Exception:
                pass
        else:
            print("Fraud model components not loaded. Skipping fraud prediction.")
            fraud_prediction_message = "Transaction processed without fraud prediction (model not loaded)."
            
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO transactions (txn_id, sender_user_id, receiver_account_number, receiver_name, amount, currency, description, channel, authorization_method, is_international, timestamp, txn_hour, txn_day_of_week, ip_address, device_fingerprint, is_new_payee, txn_count_last_24h, sum_amount_last_24h, is_fraud, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                txn_id, sender_user_id, receiver_account_number, receiver_name, amount, currency, description, channel,
                authorization_method, is_international, timestamp, txn_hour, txn_day_of_week, ip_address,
                device_fingerprint, is_new_payee, txn_count_last_24h, sum_amount_last_24h, is_fraud, transaction_status
            )
        )
        conn.commit()
        return jsonify({'message': fraud_prediction_message, 'txn_id': txn_id, 'is_fraud': is_fraud, 'status': transaction_status}), 200

    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Error during transaction creation: {err}")
        return jsonify({'message': f'Database error: {err}'}), 500
    except Exception as e:
        conn.rollback()
        print(f"Error during fraud prediction or transaction processing: {e}")
        return jsonify({'message': f'Transaction processing error: {e}'}), 500
    finally:
        conn.close()

@app.route('/api/transactions/<string:user_id>', methods=['GET'])
def get_transactions(user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': 'Database connection error'}), 500
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT txn_id, receiver_account_number, receiver_name, amount, currency, description, channel, authorization_method, is_international, timestamp, is_fraud, status FROM transactions WHERE sender_user_id = %s ORDER BY timestamp DESC",
            (user_id,)
        )
        transactions = cursor.fetchall()
        return jsonify(transactions), 200
    except mysql.connector.Error as err:
        print(f"Error fetching transactions: {err}")
        return jsonify({'message': f'Database error: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
