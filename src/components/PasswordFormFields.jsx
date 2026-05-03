import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { THEME } from '../theme';

const inputStyle = {
  backgroundColor: THEME.bg.elevated,
  border: `1px solid ${THEME.border.default}`,
  color: THEME.text.primary,
};

const PasswordField = ({ visible, onToggle, value, onChange, placeholder, onKeyDown }) => (
  <div className="relative">
    <input
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className="w-full pl-2 pr-9 py-1.5 rounded-lg outline-none text-sm"
      style={inputStyle}
    />
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded"
      style={{ color: THEME.text.muted, background: 'transparent' }}
    >
      {visible ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  </div>
);

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
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [showC, setShowC] = useState(false);

  return (
    <div className="space-y-2">
      {showCurrent && (
        <div>
          <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Current Password</label>
          <PasswordField
            visible={showA}
            onToggle={() => setShowA(v => !v)}
            value={currentPassword}
            onChange={onChangeCurrent}
            placeholder="Enter current password"
          />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>New Password</label>
        <PasswordField
          visible={showB}
          onToggle={() => setShowB(v => !v)}
          value={newPassword}
          onChange={onChangeNew}
          placeholder="Enter new password"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Confirm Password</label>
        <PasswordField
          visible={showC}
          onToggle={() => setShowC(v => !v)}
          value={confirmPassword}
          onChange={onChangeConfirm}
          placeholder="Confirm new password"
          onKeyDown={onSubmitEnter ? (e => e.key === 'Enter' && onSubmitEnter()) : undefined}
        />
      </div>
    </div>
  );
};
