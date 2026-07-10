import React, { useState } from 'react';
import { Dumbbell, Mail, Lock, User as UserIcon, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password, name);
      }
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Authentication failed. Check your database settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container container animate-fade-in">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'var(--color-primary-glow)', padding: '12px', borderRadius: '50%' }}>
              <Dumbbell className="logo-icon" size={32} />
            </div>
          </div>
          <h1 className="auth-title">GymBro</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Log in to track your progression' : 'Create an account to start leveling up'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--color-text-muted)' }} size={18} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--color-text-muted)' }} size={18} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--color-text-muted)' }} size={18} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button className="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
