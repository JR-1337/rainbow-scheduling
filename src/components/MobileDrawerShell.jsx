import React, { useRef } from 'react';
import { THEME } from '../theme';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Shared shell for mobile hamburger drawers. Backdrop + left-drawer container.
 * Header (user identity) and body (quick actions / content) come in as slots.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {ReactNode} header - user-identity section
 * @param {ReactNode} children - body content
 */
const MobileDrawerShell = ({ open, onClose, header, children }) => {
  const drawerRef = useRef(null);
  useFocusTrap(drawerRef, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div
        ref={drawerRef}
        className="absolute top-0 left-0 h-full w-64 sm:w-72 overflow-y-auto"
        style={{ backgroundColor: THEME.bg.secondary, borderRight: `1px solid ${THEME.border.default}` }}
        onClick={e => e.stopPropagation()}
      >
        <button data-close onClick={onClose} className="sr-only">Close drawer</button>
        {header}
        {children}
      </div>
    </div>
  );
};

export default MobileDrawerShell;
