import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      authApi.setToken(token);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    authApi.setToken(response.token);
    setUser({ email: response.email, role: response.role, id: response.id });
    return response;
  };

  const register = async (data) => {
    const response = await authApi.register(data);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    authApi.setToken(response.token);
    setUser({ email: response.email, role: response.role, id: response.id });
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    authApi.setToken(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};



