import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'organizer' | 'admin';
  phone_number?: string;
  profile_picture_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      // You could verify the token here and get user info
      // For now, we'll set a default user based on token
      const defaultUser: User = {
        id: 1,
        name: 'Current User',
        email: 'user@evanda.com',
        role: 'customer'
      };
      setUser(defaultUser);
    }
  }, []);


  const login = async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.data.token) {
        setToken(response.data.token);
        
        // Create user object from response
        const userData: User = {
          id: response.data.user_id,
          name: response.data.name || 'Current User',
          email: email,
          role: response.data.role
        };
        setUser(userData);
        
        return { success: true, role: response.data.role };
      }
      
      return { success: false };
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiService.register({
        name,
        email,
        password,
        phone_number: phone
      });
      
      if (response.data.token) {
        setToken(response.data.token);
        
        const userData: User = {
          id: response.data.user_id,
          name: name,
          email: email,
          role: response.data.role || 'customer'
        };
        setUser(userData);
        
        toast.success('Registration successful!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};