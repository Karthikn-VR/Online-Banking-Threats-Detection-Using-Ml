import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  account_number: string;
}

export interface Transaction {
  txn_id: string;
  sender_user_id: string;
  receiver_account_number: string;
  receiver_name?: string;
  amount: number;
  currency: string;
  description: string;
  channel: string;
  authorization_method: string;
  is_international: boolean;
  timestamp: string;
  txn_hour: number;
  txn_day_of_week: number;
  ip_address: string;
  device_fingerprint: string;
  is_new_payee: boolean;
  txn_count_last_24h: number;
  sum_amount_last_24h: number;
  is_fraud: boolean;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  transfersToday: number;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_TRANSFERS_TODAY'; payload: number };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  transfersToday: 0,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false };
    case 'LOGOUT':
      return initialState;
    case 'UPDATE_TRANSFERS_TODAY':
      return { ...state, transfersToday: action.payload };
    default:
      return state;
  }
};

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateTransfersToday: (count: number) => void;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  account_number: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Removed useEffect as user data will be fetched from DB on login

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Assuming the backend returns a user object and a token
      const user: User = {
        id: data.user.user_id,
        email: data.user.email,
        full_name: data.user.full_name,
        account_number: data.user.account_number,
      };
      const token = data.token || 'mock-jwt-token-' + Date.now(); // Backend doesn't return a token yet, so using mock

      // We are not storing sensitive user data in local storage as per requirements
      // if (rememberMe) {
      //   localStorage.setItem('banking_token', data.token);
      //   localStorage.setItem('banking_user', JSON.stringify(data.user));
      // }

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: userData.full_name,
          email: userData.email,
          password: userData.password,
          account_number: userData.account_number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // After successful registration, you might want to automatically log in the user
      // For now, we'll just return success and let the user manually log in.
      // Optionally, you could dispatch a LOGIN_SUCCESS here if the backend returns user data and a token.
      // const user: User = {
      //   id: data.user_id,
      //   email: userData.email,
      //   full_name: userData.full_name,
      //   account_number: userData.account_number,
      // };
      // const token = 'mock-jwt-token-' + Date.now();
      // dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

      // For now, just indicate success without logging in automatically
      dispatch({ type: 'LOGIN_FAILURE' }); // This will stop loading state, but not log in

      alert(data.message || "Registration successful. Please log in.");
      
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('banking_token');
    localStorage.removeItem('banking_user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateTransfersToday = (count: number) => {
    dispatch({ type: 'UPDATE_TRANSFERS_TODAY', payload: count });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, register, updateTransfersToday }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};