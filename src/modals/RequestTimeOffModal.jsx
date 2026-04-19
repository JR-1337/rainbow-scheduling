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
      color: THEME.accent.cyan,
    },
    !isAdmin && {
      id: 'shift-swap',
      name: 'Shift Swap',
      description: 'Trade a shift with another employee',
      icon: Users,
      color: THEME.modal.swap.accent,
    },
    !isAdmin && {
      id: 'shift-offer',
      name: 'Take My Shift',
      description: 'Give away your shift to someone else',
      icon: User,
      color: THEME.modal.offer.accent,
    },
  ].filter(Boolean);

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
              onClick={() => onSelectType(type.id)}
              className="w-full p-3 rounded-lg text-left transition-all flex items-start gap-3"
              style={{
                backgroundColor: THEME.bg.tertiary,
                border: `1px solid ${type.color}30`,
                cursor: 'pointer'
              }}
            >
              <div className="p-2 rounded-lg" style={{ backgroundColor: type.color + '20' }}>
                <Icon size={16} style={{ color: type.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: THEME.text.primary }}>{type.name}</p>
                <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </AdaptiveModal>
  );
};
