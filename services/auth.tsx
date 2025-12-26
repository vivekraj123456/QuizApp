
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: UserRole, name: string, password?: string) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('quiz_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, role: UserRole, name: string, password?: string) => {
    // Simulated auth delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const usersJson = localStorage.getItem('quiz_users_db') || '[]';
    const users: any[] = JSON.parse(usersJson);
    
    let existingUser = users.find(u => u.email === email);
    
    if (!existingUser) {
      existingUser = { 
        id: Math.random().toString(36).substr(2, 9), 
        email, 
        role, 
        name,
        password: password || 'default_pass' // In real life, hash this
      };
      users.push(existingUser);
      localStorage.setItem('quiz_users_db', JSON.stringify(users));
    }

    setUser(existingUser);
    localStorage.setItem('quiz_user', JSON.stringify(existingUser));
  };

  const loginWithGoogle = async (role: UserRole) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const googleEmail = "google_user@gmail.com";
    const googleName = "Google Learner";
    
    await login(googleEmail, role, googleName);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Reset email sent to ${email}`);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('quiz_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, resetPassword, logout }}>
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
