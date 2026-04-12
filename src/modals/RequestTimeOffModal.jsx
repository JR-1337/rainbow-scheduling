import React from 'react';
import { Calendar, Users, User, X } from 'lucide-react';
import { THEME, TYPE } from '../theme';

export const RequestTimeOffModal = ({ isOpen, onClose, onSelectType, currentUser }) => {
  if (!isOpen) return null;

  const isAdmin = currentUser?.isAdmin || false;

  const requestTypes = [
    {
      id: 'days-off',
      name: 'Days Off',
      description: 'Request specific days or a block of time off',
      icon: Calendar,
      available: true,
      color: THEME.accent.cyan,
      adminOnly: false
    },
    {
      id: 'shift-swap',
      name: 'Shift Swap',
      description: isAdmin ? 'Not available for admins' : 'Trade a shift with another employee',
      icon: Users,
      available: !isAdmin,
      color: THEME.accent.purple,
      adminOnly: false
    },
    {
      id: 'shift-offer',
      name: 'Take My Shift',
      description: isAdmin ? 'Not available for admins' : 'Give away your shift to someone else',
      icon: User,
      available: !isAdmin,
      color: THEME.accent.pink,
      adminOnly: false
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal="true" aria-label="Shift Changes" onClick={onClose}>
      <div className="max-w-sm w-full rounded-xl overflow-hidden shadow-2xl modal-content active" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: THEME.text.primary, fontSize: TYPE.title }}>
            <Calendar size={16} style={{ color: THEME.accent.cyan }} />
            Shift Changes
          </h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-2 rounded-lg hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs mb-3" style={{ color: THEME.text.muted }}>What type of request would you like to make?</p>
          {requestTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => type.available && onSelectType(type.id)}
                disabled={!type.available}
                className="w-full p-3 rounded-lg text-left transition-all flex items-start gap-3"
                style={{
                  backgroundColor: type.available ? THEME.bg.tertiary : THEME.bg.elevated,
                  border: `1px solid ${type.available ? type.color + '30' : THEME.border.subtle}`,
                  opacity: type.available ? 1 : 0.5,
                  cursor: type.available ? 'pointer' : 'not-allowed'
                }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: type.color + '20' }}>
                  <Icon size={16} style={{ color: type.available ? type.color : THEME.text.muted }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-2" style={{ color: type.available ? THEME.text.primary : THEME.text.muted }}>
                    {type.name}
                    {!type.available && isAdmin && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>Employees Only</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>{type.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
