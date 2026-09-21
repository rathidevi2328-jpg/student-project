import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { authService } from '../services/authService';
import { INITIAL_USERS } from '../services/seedService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session or default to Admin demo user on first load
    const saved = localStorage.getItem('smartattend_active_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        setUser(INITIAL_USERS[0]); // default to Admin
      }
    } else {
      // Default to Admin demo for immediate ease of inspection
      setUser(INITIAL_USERS[0]);
      localStorage.setItem('smartattend_active_session', JSON.stringify(INITIAL_USERS[0]));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await authService.login(email, pass);
      setUser(profile);
      localStorage.setItem('smartattend_active_session', JSON.stringify(profile));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    const matched = INITIAL_USERS.find((u) => u.role === newRole) || {
      uid: `demo-${newRole}`,
      name: newRole === 'admin' ? 'Dr. Administrator' : newRole === 'faculty' ? 'Dr. Rajesh Sharma' : 'Alex Rivera',
      email: `${newRole}@smartattend.edu`,
      role: newRole,
      studentId: newRole === 'student' ? 'student-1' : undefined,
      facultyId: newRole === 'faculty' ? 'faculty-1' : undefined,
      departmentId: 'dept-cse',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    setUser(matched);
    localStorage.setItem('smartattend_active_session', JSON.stringify(matched));
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        login,
        logout,
        switchRole,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
