import React, { useState } from 'react';
import { THEME } from '../theme';
import { apiCall } from '../utils/api';
import { setAuthToken, setCachedUser } from '../auth';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';

export const LoginScreen = ({ onLogin, onLoadingComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [pendingUser, setPendingUser] = useState(null);
  const [showFirstLoginPassword, setShowFirstLoginPassword] = useState(false);
  const [pendingDefaultPassword, setPendingDefaultPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await apiCall('login', {
      email: email.toLowerCase().trim(),
      password
    });

    setLoading(false);

    if (result.success) {
      if (result.data.token) setAuthToken(result.data.token);
      setCachedUser(result.data.employee);
      if (result.data.usingDefaultPassword) {
        setPendingUser(result.data.employee);
        setPendingDefaultPassword(result.data.defaultPassword || '');
        setShowFirstLoginPassword(true);
      } else {
        onLogin(result.data.employee);
      }
    } else {
      setError(result.error?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.card }}>
        <div className="text-center mb-6">
          <div style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            <p className="text-xs tracking-widest" style={{ color: THEME.text.muted }}>OVER THE</p>
            <h1 className="text-2xl font-semibold tracking-wider" style={{ color: THEME.text.primary }}>RAINBOW</h1>
          </div>
          <p className="text-sm mt-2" style={{ color: THEME.accent.purple }}>Staff Scheduling</p>
        </div>

        <div className="mb-4">
          <label htmlFor="login-email" className="login-label block text-xs font-medium mb-1">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('login-password')?.focus()}
            placeholder="your.email@example.com"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="login-password" className="login-label block text-xs font-medium mb-1">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
          <p className="login-hint text-xs mt-1">First time? Use your employee ID as password</p>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: THEME.status.error }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          style={{
            background: loading ? THEME.bg.tertiary : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
            color: loading ? THEME.text.muted : THEME.accent.text,
            opacity: loading ? 0.7 : 1
          }}>
          {loading ? <><div className="rainbow-spinner" /> Signing in...</> : 'Sign In'}
        </button>
      </div>

      {pendingUser && (
        <ChangePasswordModal
          isOpen={showFirstLoginPassword}
          onClose={() => {}}
          currentUser={pendingUser}
          isFirstLogin={true}
          defaultPassword={pendingDefaultPassword}
          onSuccess={() => {
            onLogin(pendingUser);
          }}
        />
      )}
    </div>
  );
};
