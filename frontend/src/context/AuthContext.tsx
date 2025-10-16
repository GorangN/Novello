import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get backend URL from environment or use appropriate default
const getBaseURL = () => {
  // For native apps (iOS/Android)
  if (Platform.OS !== 'web') {
    // Use environment variable if available
    const backendUrl = Constants.expoConfig?.extra?.backendUrl || 
                      process.env.EXPO_PUBLIC_BACKEND_URL;
    
    if (backendUrl) {
      return backendUrl;
    }
    
    // Fallback: Use the tunnel URL for Expo Go
    const manifest = Constants.expoConfig;
    if (manifest?.hostUri) {
      const parts = manifest.hostUri.split(':');
      const host = parts[0];
      return `https://${host}`;
    }
    
    // Last resort fallback
    return 'http://localhost:8001';
  }
  
  // For web
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return '';
};

const API_URL = getBaseURL();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      { email, password, name },
      { withCredentials: true }
    );
    setUser(response.data);
  };

  const logout = async () => {
    await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const loginWithGoogle = () => {
    if (Platform.OS === 'web') {
      // For now, show message that Google login will be enabled soon
      alert('Google login is coming soon! Please use email/password registration for now.');
    } else {
      // On mobile, we can implement later
      alert('Google login is coming soon! Please use email/password registration for now.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
