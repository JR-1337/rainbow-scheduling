import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { THEME, TYPE } from '../theme';
import { MobileBottomSheet, useIsMobile } from '../MobileEmployeeView';

// Mobile: renders as MobileBottomSheet (z-150, pill tap-to-close, 70vh scroll).
// Desktop: centered overlay card with gradient header, scrollable body, sticky footer.
// Props:
//   isOpen, onClose, children                  — required
//   title                                      — header text
//   icon                                       — lucide component in header (optional)
//   iconColor                                  — color for icon (default accent.cyan)
//   headerGradient                             — CSS background value for header; defaults to tertiary->secondary
//   maxWidth                                   — desktop width class (default 'max-w-md')
//   headerExtra                                — slot rendered under title row (e.g. step indicator)
//   footer                                     — sticky footer slot (renders at bottom, non-scrolling on desktop)
//   ariaLabel                                  — a11y label, defaults to title
//   bodyClassName                              — extra classes for body wrapper

export const AdaptiveModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconColor,
  headerGradient,
  maxWidth = 'max-w-md',
  headerExtra,
  footer,
  ariaLabel,
  bodyClassName = '',
  children,
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, isMobile]);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <MobileBottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {headerExtra && <div className="pb-3">{headerExtra}</div>}
        <div className={bodyClassName}>{children}</div>
        {footer && (
          <div className="sticky bottom-0 -mx-4 px-4 pt-3 mt-3" style={{ backgroundColor: THEME.bg.secondary, borderTop: `1px solid ${THEME.border.subtle}` }}>
            {footer}
          </div>
        )}
      </MobileBottomSheet>
    );
  }

  const headerBg = headerGradient || `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || 'Dialog'}
      onClick={onClose}
    >
      <div
        className={`${maxWidth} w-full rounded-xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col modal-content active`}
        style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: headerBg }}
        >
          <h2 className="font-semibold flex items-center gap-2" style={{ color: THEME.text.primary, fontSize: TYPE.title }}>
            {Icon && <Icon size={16} style={{ color: iconColor || THEME.accent.cyan }} />}
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-lg hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: THEME.text.secondary }}
          >
            <X size={16} />
          </button>
        </div>
        {headerExtra && (
          <div className="flex-shrink-0" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>{headerExtra}</div>
        )}
        <div className={`p-4 overflow-y-auto flex-1 ${bodyClassName}`}>{children}</div>
        {footer && (
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${THEME.border.subtle}`, backgroundColor: THEME.bg.tertiary }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
