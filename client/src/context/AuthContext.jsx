import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapStatus, setBootstrapStatus] = useState({ isLocked: true });

  const checkBootstrap = async () => {
    try {
      const status = await api.getBootstrapStatus();
      setBootstrapStatus(status);
    } catch {
      // ignore
    }
  };

  const loadUserProfile = async () => {
    const token = localStorage.getItem('bv_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      checkBootstrap();
      return;
    }

    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem('bv_token');
      setUser(null);
    } finally {
      setLoading(false);
      checkBootstrap();
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('bv_token', data.token);
    setUser(data.user);
    await checkBootstrap();
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem('bv_token', data.token);
    setUser(data.user);
    await checkBootstrap();
    return data;
  };

  const bootstrapAdmin = async (payload) => {
    const data = await api.bootstrapAdmin(payload);
    localStorage.setItem('bv_token', data.token);
    setUser(data.user);
    await checkBootstrap();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('bv_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        bootstrapStatus,
        checkBootstrap,
        login,
        register,
        bootstrapAdmin,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isAuditor: user?.role === 'AUDITOR' || user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
