import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { THEME, TYPE } from '../theme';
import { useFocusTrap } from '../hooks/useFocusTrap';

export const GradientButton = ({ children, onClick, variant = 'primary', disabled = false, small = false, danger = false, ariaLabel }) => (
  <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} title={ariaLabel}
    className={`${small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90`}
    style={{
      background: danger ? THEME.status.error : variant === 'primary' ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated,
      border: variant === 'secondary' ? `1px solid ${THEME.border.default}` : 'none',
      color: (variant === 'primary' || danger) ? THEME.accent.text : THEME.text.primary
    }}>
    {children}
  </button>
);

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen);
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-xs', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true" aria-label={title || 'Dialog'} onClick={onClose}>
      <div ref={dialogRef} className={`${sizes[size]} w-full rounded-xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col modal-content active`} style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-3 py-2 flex items-center justify-between flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="font-semibold" style={{ color: THEME.text.primary, fontSize: TYPE.title }}>{title}</h2>
          <button onClick={onClose} data-close aria-label="Close dialog" className="p-2 rounded-lg hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        <div className="p-3 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Input = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div className="mb-2">
    <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>{label} {required && <span style={{ color: THEME.status.error }}>*</span>}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-2 py-1.5 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
  </div>
);

export const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
    <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: checked ? THEME.accent.purple : THEME.bg.elevated, border: `2px solid ${checked ? THEME.accent.purple : THEME.border.default}` }} onClick={() => onChange(!checked)}>
      {checked && <Check size={10} color="white" />}
    </div>
    <span style={{ color: THEME.text.primary }}>{label}</span>
  </label>
);

export const TimePicker = ({ value, onChange, label }) => {
  const hours = Array.from({ length: 18 }, (_, i) => (i + 6).toString().padStart(2, '0'));
  const [h, m] = (value || '11:00').split(':');
  return (
    <div className="mb-2">
      {label && <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>{label}</label>}
      <div className="flex gap-1">
        <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)} className="flex-1 px-1.5 py-1 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}>
          {hours.map(hr => <option key={hr} value={hr}>{parseInt(hr) > 12 ? parseInt(hr) - 12 : hr} {parseInt(hr) >= 12 ? 'PM' : 'AM'}</option>)}
        </select>
        <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)} className="w-14 px-1.5 py-1 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}>
          {['00', '15', '30', '45'].map(min => <option key={min} value={min}>:{min}</option>)}
        </select>
      </div>
    </div>
  );
};

export const TooltipButton = ({ children, onClick, variant = 'secondary', disabled = false, tooltip }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
  }, [show]);

  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button ref={btnRef} onClick={onClick} disabled={disabled}
        className="px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{
          background: variant === 'primary' ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated,
          border: variant === 'secondary' ? `1px solid ${THEME.border.default}` : 'none',
          color: variant === 'primary' ? '#FFFFFF' : THEME.text.primary
        }}>
        {children}
      </button>
      {show && tooltip && (
        <div className="fixed px-2 py-1 rounded text-xs whitespace-nowrap" style={{
          top: pos.top,
          left: pos.left,
          transform: 'translateX(-50%)',
          backgroundColor: THEME.tooltip.bg,
          border: `1px solid ${THEME.tooltip.border}`,
          color: THEME.text.primary,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};
