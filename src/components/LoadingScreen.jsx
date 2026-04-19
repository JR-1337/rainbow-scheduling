import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ScheduleSkeleton } from './uiKit';
import { THEME } from '../theme';

export function LoadingScreen({ overlay }) {
  return (
    <>
      {overlay}
      <div className="min-h-screen relative" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }} role="status" aria-live="polite" aria-label="Loading schedule">
        <div className="pt-8" style={{ backgroundColor: THEME.bg.secondary }}>
          <ScheduleSkeleton />
        </div>
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 150 }}>
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.card }}>
            <div className="rainbow-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p className="text-sm font-medium" style={{ color: THEME.text.primary }}>Loading your schedule…</p>
            <p className="text-xs italic" style={{ color: THEME.text.muted }}>This can take a moment on first sign-in.</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function ErrorScreen({ overlay, message, onRetry, onLogout }) {
  return (
    <>
      {overlay}
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary }}>
        <div className="text-center max-w-md">
          <AlertCircle size={32} className="mx-auto mb-4" style={{ color: THEME.status.error }} />
          <p className="mb-4" style={{ color: '#FFFFFF' }}>{message}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.accent.purple, color: '#fff' }}
          >
            Try Again
          </button>
          <button
            onClick={onLogout}
            className="ml-2 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
