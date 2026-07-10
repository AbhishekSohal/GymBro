import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, BarChart2, LogOut } from 'lucide-react';
import { api } from './utils/api';
import './App.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ActiveSession from './pages/ActiveSession';
import History from './pages/History';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // login, dashboard, session, history
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionName, setActiveSessionName] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if user has an active session cookie on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await api.checkSession();
        if (data.user) {
          setUser(data.user);
          // If user was in the middle of a session, we resume it if the backend returns it
          if (data.activeSession) {
            setActiveSessionId(data.activeSession.id);
            setActiveSessionName(data.activeSession.workout_day_name);
            setCurrentView('session');
          } else {
            setCurrentView('dashboard');
          }
        } else {
          setCurrentView('login');
        }
      } catch (err) {
        setCurrentView('login');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setActiveSessionId(null);
    setCurrentView('login');
  };

  const handleStartSession = (sessionId, dayName) => {
    setActiveSessionId(sessionId);
    setActiveSessionName(dayName);
    setCurrentView('session');
  };

  const handleCancelSession = () => {
    if (window.confirm('Are you sure you want to cancel? This session logs will be deleted.')) {
      // Typically the backend has a DELETE session endpoint, but to keep it simple, we just discard and return
      setActiveSessionId(null);
      setCurrentView('dashboard');
    }
  };

  const handleFinishSession = () => {
    setActiveSessionId(null);
    setCurrentView('history'); // Take them to history to see their newly logged entries!
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--color-text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <Dumbbell className="logo-icon animate-pulse" size={48} style={{ animation: 'pulse 1.5s infinite', margin: '0 auto 16px auto', color: 'var(--color-primary)' }} />
          <p style={{ fontFamily: "'Outfit', sans-serif" }}>GymBro is loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="root">
      {user && currentView !== 'session' && (
        <header className="app-header">
          <div className="header-container">
            <div className="logo" onClick={() => setCurrentView('dashboard')} style={{ cursor: 'pointer' }}>
              <Dumbbell className="logo-icon" size={22} />
              <span>GymBro</span>
            </div>
            
            <nav className="nav-links">
              <button 
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <Calendar size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Dashboard
              </button>
              <button 
                className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
                onClick={() => setCurrentView('history')}
              >
                <BarChart2 size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> History
              </button>
              <button className="nav-btn" onClick={handleLogout} style={{ color: '#ef4444' }}>
                <LogOut size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      <main style={{ flex: 1 }}>
        {currentView === 'login' && <Login onAuthSuccess={handleAuthSuccess} />}
        {currentView === 'dashboard' && <Dashboard user={user} onStartSession={handleStartSession} />}
        {currentView === 'session' && (
          <ActiveSession 
            sessionId={activeSessionId} 
            workoutDayName={activeSessionName} 
            onCancel={handleCancelSession}
            onFinish={handleFinishSession}
          />
        )}
        {currentView === 'history' && <History />}
      </main>
    </div>
  );
}
