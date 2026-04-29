import { THEME } from '../theme';

/**
 * PasswordFormFields — 3-input password form used in AdminSettingsModal and ChangePasswordModal.
 *
 * Props:
 *   showCurrent        boolean — show the "Current Password" input (false on first-login flows)
 *   currentPassword    string — controlled value
 *   newPassword        string — controlled value
 *   confirmPassword    string — controlled value
 *   onChangeCurrent    function(e) — onChange for currentPassword input
 *   onChangeNew        function(e) — onChange for newPassword input
 *   onChangeConfirm    function(e) — onChange for confirmPassword input
 *   onSubmitEnter      function | undefined — Enter-key handler on confirm input only
 */
export const PasswordFormFields = ({
  showCurrent,
  currentPassword,
  newPassword,
  confirmPassword,
  onChangeCurrent,
  onChangeNew,
  onChangeConfirm,
  onSubmitEnter,
}) => {
  const inputStyle = {
    backgroundColor: THEME.bg.elevated,
    border: `1px solid ${THEME.border.default}`,
    color: THEME.text.primary,
  };

  return (
    <div className="space-y-2">
      {showCurrent && (
        <div>
          <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={onChangeCurrent}
            placeholder="Enter current password"
            className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
            style={inputStyle}
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={onChangeNew}
          placeholder="Enter new password"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={onChangeConfirm}
          placeholder="Confirm new password"
          onKeyDown={onSubmitEnter ? (e => e.key === 'Enter' && onSubmitEnter()) : undefined}
          className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
          style={inputStyle}
        />
      </div>
    </div>
  );
};
