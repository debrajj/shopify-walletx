import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { config } from '../config/env';

interface User {
  id: string;
  name: string;
  email: string;
  storeName: string;
  storeUrl?: string; // Add storeUrl to user interface
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; storeName: string; storeUrl: string; shopifyAccessToken: string; shopifyApiKey: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem(config.storage.userKey);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem(config.storage.userKey);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    const userData = response.user;
    
    // Persist session
    localStorage.setItem(config.storage.userKey, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const signup = async (data: { name: string; email: string; password: string; storeName: string; storeUrl: string; shopifyAccessToken: string; shopifyApiKey: string }) => {
    const response = await api.auth.signup(data);
    const userData = response.user;
    
    // Persist session
    localStorage.setItem(config.storage.userKey, JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(config.storage.userKey);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout, isLoading }}>
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