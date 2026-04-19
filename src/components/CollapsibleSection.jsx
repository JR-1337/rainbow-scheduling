import { useState } from 'react';
import { ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { THEME } from '../theme';

export const CollapsibleSection = ({ title, icon: Icon, iconColor, badge, badgeColor, children, defaultOpen = true, notificationCount, onOpen }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const ChevronIcon = isOpen ? ChevronDown : ChevronRight;

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && onOpen) {
      onOpen();
    }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:opacity-90 transition-opacity"
        style={{ backgroundColor: THEME.bg.tertiary }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} style={{ color: iconColor || THEME.accent.cyan }} />}
          <span className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: (badgeColor || THEME.accent.cyan) + '20', color: badgeColor || THEME.accent.cyan }}>
              {badge}
            </span>
          )}
          {notificationCount > 0 && !isOpen && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1" style={{ backgroundColor: THEME.accent.pink, color: 'white' }}>
              <Bell size={10} />
              {notificationCount} new
            </span>
          )}
        </div>
        <ChevronIcon size={16} style={{ color: THEME.text.muted }} />
      </button>
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};
