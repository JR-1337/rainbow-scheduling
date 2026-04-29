import { useState, useEffect } from 'react';
import { Users, Key, Save, Loader, Check } from 'lucide-react';
import { THEME } from '../theme';
import { apiCall } from '../utils/api';
import { Modal, GradientButton } from '../components/primitives';
import { PasswordFormFields } from '../components/PasswordFormFields';

export const AdminSettingsModal = ({ isOpen, onClose, currentUser, staffingTargets, onStaffingTargetsChange, showToast }) => {
  const [activeTab, setActiveTab] = useState('targets');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editTargets, setEditTargets] = useState({});
  const [targetsSaving, setTargetsSaving] = useState(false);
  const [targetsChanged, setTargetsChanged] = useState(false);

  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const DAY_LABELS = { sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat' };

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setEditTargets({ ...staffingTargets });
      setTargetsChanged(false);
    }
  }, [isOpen, staffingTargets]);

  const handleTargetChange = (day, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    const updated = { ...editTargets, [day]: num };
    setEditTargets(updated);
    const keys = Object.keys(updated);
    const changed = keys.length !== Object.keys(staffingTargets).length
      || keys.some(k => updated[k] !== staffingTargets[k]);
    setTargetsChanged(changed);
  };

  const handleSaveTargets = async () => {
    setTargetsSaving(true);
    const result = await apiCall('saveStaffingTargets', {
      staffingTargets: editTargets
    });
    setTargetsSaving(false);

    if (result.success) {
      onStaffingTargetsChange(editTargets);
      setTargetsChanged(false);
      showToast('success', 'Staffing targets updated');
    } else {
      showToast('error', result.error?.message || 'Failed to save targets');
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) { setError('Please enter your current password.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 4) { setError('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const result = await apiCall('changePassword', {
      currentPassword,
      newPassword,
      callerEmail: currentUser.email
    });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => { setActiveTab('targets'); setSuccess(false); }, 1500);
    } else {
      setError(result.error?.message || 'Failed to change password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Settings" size="sm">
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
        {[
          { id: 'targets', label: 'Staffing Targets', icon: <Users size={12} /> },
          { id: 'password', label: 'Password', icon: <Key size={12} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? THEME.bg.elevated : 'transparent',
              color: activeTab === tab.id ? THEME.text.primary : THEME.text.muted
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'targets' && (
        <div>
          <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
            Set the target number of staff for each day. These appear as counters on the schedule grid.
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map(day => (
              <div key={day} className="text-center">
                <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>{DAY_LABELS[day]}</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={editTargets[day] || 0}
                  onChange={e => handleTargetChange(day, e.target.value)}
                  className="w-full px-1 py-1.5 rounded-lg outline-none text-center text-sm font-medium"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={onClose}>Close</GradientButton>
            <GradientButton small onClick={handleSaveTargets} disabled={!targetsChanged || targetsSaving}>
              {targetsSaving ? <><Loader size={10} className="animate-spin" /> Saving...</> : <><Save size={10} /> Save Targets</>}
            </GradientButton>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <>
          {success ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
                <Check size={20} style={{ color: THEME.status.success }} />
              </div>
              <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>Password Updated!</h3>
            </div>
          ) : (
            <>
              <PasswordFormFields
                showCurrent={true}
                currentPassword={currentPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                onChangeCurrent={e => { setCurrentPassword(e.target.value); setError(''); }}
                onChangeNew={e => { setNewPassword(e.target.value); setError(''); }}
                onChangeConfirm={e => { setConfirmPassword(e.target.value); setError(''); }}
              />

              {error && <p className="text-xs mt-2" style={{ color: THEME.status.error }}>{error}</p>}

              <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
                <GradientButton variant="secondary" small onClick={onClose} disabled={loading}>Cancel</GradientButton>
                <GradientButton small onClick={handleSavePassword} disabled={loading}>
                  {loading ? <><Loader size={10} className="animate-spin" /> Updating...</> : <><Key size={10} />Update Password</>}
                </GradientButton>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};
