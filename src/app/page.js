'use client';

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Dashboard from '@/components/Dashboard';

function AppContent() {
  const { user, loading, login, register, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'rider' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Loading RideShare...</p>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password, formData.phone, formData.role);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fillDemo = (role) => {
    if (role === 'rider') {
      setFormData({ ...formData, email: 'vivek@rideshare.com', password: 'password123' });
    } else if (role === 'driver') {
      setFormData({ ...formData, email: 'utkarsh@rideshare.com', password: 'password123' });
    } else {
      setFormData({ ...formData, email: 'admin@rideshare.com', password: 'admin123' });
    }
    setIsLogin(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🚗</div>
          <h1 className="auth-logo-title">RideShare</h1>
          <p className="auth-logo-subtitle">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder={isLogin ? 'Enter your password' : 'Min 6 characters'}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  name="phone"
                  placeholder="+91-9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">I want to</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn ${formData.role === 'rider' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'rider' }))}
                  >
                    🧑 Ride
                  </button>
                  <button
                    type="button"
                    className={`btn ${formData.role === 'driver' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'driver' }))}
                  >
                    🚗 Drive
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={submitting}>
            {submitting ? (
              <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Please wait...</>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setIsLogin(false); setError(''); }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setIsLogin(true); setError(''); }}>Sign in</button>
            </>
          )}
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>Quick Demo Login</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => fillDemo('rider')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px' }}>
              🧑 Rider
            </button>
            <button onClick={() => fillDemo('driver')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px' }}>
              🚗 Driver
            </button>
            <button onClick={() => fillDemo('admin')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '12px' }}>
              👑 Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
