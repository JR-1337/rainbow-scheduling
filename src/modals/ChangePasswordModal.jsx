import { useState, useEffect } from 'react';
import { Key, Loader, Check } from 'lucide-react';
import { THEME } from '../theme';
import { Modal, GradientButton, apiCall } from '../App';

export const ChangePasswordModal = ({ isOpen, onClose, currentUser, isFirstLogin = false, onSuccess, defaultPassword = '' }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!isFirstLogin && !currentPassword) { setError('Please enter your current password.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');

    const payload = {
      newPassword,
      callerEmail: currentUser.email
    };
    if (!isFirstLogin) {
      payload.currentPassword = currentPassword;
    } else {
      payload.currentPassword = defaultPassword || currentUser.id;
    }

    const result = await apiCall('changePassword', payload);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } else {
      setError(result.error?.message || 'Failed to change password');
    }
  };

  const handleClose = isFirstLogin ? undefined : onClose;

  return (
    <Modal isOpen={isOpen} onClose={handleClose || (() => {})} title={isFirstLogin ? 'Set Your Password' : 'Change Password'} size="sm">
      {isFirstLogin && (
        <style>{`.fixed.inset-0.z-\\[100\\] { pointer-events: auto; }`}</style>
      )}

      {success ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
            <Check size={20} style={{ color: THEME.status.success }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Password Updated!</h3>
          {isFirstLogin && (
            <>
              <p className="text-xs mt-1.5 font-mono font-semibold" style={{ color: THEME.text.primary }}>{newPassword}</p>
              <p className="text-xs mt-1" style={{ color: THEME.text.secondary }}>Remember this — logging you in...</p>
            </>
          )}
        </div>
      ) : (
        <>
          {isFirstLogin && (
            <div className="mb-3 p-2.5 rounded-lg" style={{ backgroundColor: THEME.accent.blue + '15', border: `1px solid ${THEME.accent.blue}30` }}>
              <p className="text-xs" style={{ color: THEME.accent.blue }}>
                Welcome! Please set a personal password before continuing.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {!isFirstLogin && (
              <div>
                <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                  placeholder="Enter current password"
                  className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                placeholder="Enter new password (min 4 characters)"
                className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm new password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
          </div>

          {error && <p className="text-xs mt-2" style={{ color: THEME.status.error }}>{error}</p>}

          {loading && (
            <div className="flex items-center gap-2 mt-3 px-2.5 py-2 rounded-lg" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.subtle}` }}>
              <div className="rainbow-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <p className="text-xs italic" style={{ color: THEME.text.secondary }}>Saving your password — this can take a moment.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            {!isFirstLogin && (
              <GradientButton variant="secondary" small onClick={onClose} disabled={loading}>Cancel</GradientButton>
            )}
            <GradientButton small onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader size={10} className="animate-spin" /> Updating...</> : <><Key size={10} /> {isFirstLogin ? 'Set Password' : 'Update Password'}</>}
            </GradientButton>
          </div>
        </>
      )}
    </Modal>
  );
};
