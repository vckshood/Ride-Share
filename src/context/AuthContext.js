'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('rs_token');
    const savedUser = localStorage.getItem('rs_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(
        res.status === 502 || res.status === 504
          ? 'The server is currently waking up on Render. Please wait ~30 seconds and try again.'
          : `Server communication error (${res.status} ${res.statusText || 'Internal Error'}). Please check server logs.`
      );
    }

    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('rs_token', data.token);
    localStorage.setItem('rs_user', JSON.stringify(data.user));
    return data;
  };

  const register = async (name, email, password, phone, role) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, role }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(
        res.status === 502 || res.status === 504
          ? 'The server is currently waking up on Render. Please wait ~30 seconds and try again.'
          : `Server communication error (${res.status} ${res.statusText || 'Internal Error'}). Please check server logs.`
      );
    }

    if (!res.ok) throw new Error(data.error || 'Registration failed');
    
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('rs_token', data.token);
    localStorage.setItem('rs_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rs_token');
    localStorage.removeItem('rs_user');
  };

  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
