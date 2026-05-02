import { X } from 'lucide-react';
import { useIsMobile, MobileBottomSheet } from '../MobileEmployeeView';
import { THEME, TYPE } from '../theme';
import { useEscapeKey } from '../hooks/useEscapeKey';

// Bottom sheet on mobile, centered modal on desktop. Used by every admin
// reject/deny/revoke flow so styling + a11y + 44px touch targets stay uniform.
export const AdminRequestModal = ({ isOpen, onClose, title, children }) => {
  const isMobile = useIsMobile();
  useEscapeKey(onClose, isOpen && !isMobile);
  if (!isOpen) return null;
  if (isMobile) {
    return <MobileBottomSheet isOpen={isOpen} onClose={onClose} title={title}>{children}</MobileBottomSheet>;
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl modal-content active" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="font-semibold" style={{ color: THEME.text.primary, fontSize: TYPE.title }}>{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-2 rounded-lg hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
};
