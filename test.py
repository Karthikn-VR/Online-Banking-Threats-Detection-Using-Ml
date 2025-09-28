from flask import Flask
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@Karthiknvr2004',
    'database': 'bank'
}

def create_connection():
    """Create a database connection"""
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("Connected to MySQL database")
            return connection
    except Error as e:
        print(f"Error: {e}")
        return None

@app.route('/')
def home():
    conn = create_connection()
    if conn:
        conn.close()
        return "Database connection successful!"
    else:
        return "Failed to connect to database."

if __name__ == '__main__':
    app.run(debug=True)
