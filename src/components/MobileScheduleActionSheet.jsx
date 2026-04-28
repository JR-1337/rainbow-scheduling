import { Zap, BookOpen } from 'lucide-react';
import { AdaptiveModal } from './AdaptiveModal';
import { THEME } from '../theme';

// Single-level mobile action sheet. Two rows:
//   1. "Auto-Fill / Auto-Clear" — opens the unified AutofillClearModal (via onOpenAutofillClear).
//   2. "Schedule PK"             — opens the PK modal (unchanged, via onOpenPKModal).
// Fill/Clear branching removed; the modal handles all employee selection and mode toggling.
export const MobileScheduleActionSheet = ({
  isOpen,
  onClose,
  onOpenAutofillClear,
  onOpenPKModal,
}) => {
  const close = () => onClose();
  const fire = (fn) => { fn(); close(); };

  const Row = ({ onClick, icon, label, accent, destructive }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
      style={{
        minHeight: 56,
        color: destructive ? THEME.status.error : accent || THEME.text.primary,
        backgroundColor: 'transparent',
        borderBottom: `1px solid ${THEME.border.subtle}`,
      }}
    >
      {icon}
      <span className="flex-1 text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={close}
      title="Actions"
      bodyClassName="p-0"
    >
      <div>
        <Row
          icon={<Zap size={18} style={{ color: THEME.accent.blue }} />}
          label="Auto-Fill / Auto-Clear"
          accent={THEME.accent.blue}
          onClick={() => fire(onOpenAutofillClear)}
        />
        <Row
          icon={<BookOpen size={18} style={{ color: THEME.event.pkText }} />}
          label="Schedule PK"
          accent={THEME.event.pkText}
          onClick={() => fire(onOpenPKModal)}
        />
      </div>
    </AdaptiveModal>
  );
};
