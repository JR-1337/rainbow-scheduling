import React from 'react';
import { Calendar, Users, User } from 'lucide-react';
import { THEME } from '../theme';
import { AdaptiveModal } from '../components/AdaptiveModal';

export const RequestTimeOffModal = ({ isOpen, onClose, onSelectType, currentUser }) => {
  const isAdmin = currentUser?.isAdmin || false;

  const requestTypes = [
    {
      id: 'days-off',
      name: 'Days Off',
      description: 'Request specific days or a block of time off',
      icon: Calendar,
      available: true,
      color: THEME.accent.cyan,
    },
    {
      id: 'shift-swap',
      name: 'Shift Swap',
      description: isAdmin ? 'Not available for admins' : 'Trade a shift with another employee',
      icon: Users,
      available: !isAdmin,
      color: THEME.accent.purple,
    },
    {
      id: 'shift-offer',
      name: 'Take My Shift',
      description: isAdmin ? 'Not available for admins' : 'Give away your shift to someone else',
      icon: User,
      available: !isAdmin,
      color: THEME.accent.pink,
    },
  ];

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Shift Changes"
      icon={Calendar}
      iconColor={THEME.accent.cyan}
      maxWidth="max-w-sm"
    >
      <div className="space-y-2">
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
    </AdaptiveModal>
  );
};
