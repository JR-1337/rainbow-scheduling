import { useState, useEffect } from 'react';
import { Zap, Trash2, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { AdaptiveModal } from './AdaptiveModal';
import { THEME } from '../theme';

// Two-level mobile action sheet replacing the three small Fill/Clear/PK buttons.
// Level root: pick a category; Level 2: pick "All" or an individual employee.
export const MobileScheduleActionSheet = ({
  isOpen,
  onClose,
  activeWeek,
  week1,
  week2,
  fullTimeEmployees,
  employeeHasShiftsInWeek,
  autoPopulateWeek,
  setAutoPopulateConfirm,
  showToast,
  handleAutofillPKWeek,
  onOpenPKModal,
}) => {
  const [level, setLevel] = useState('root');

  useEffect(() => { if (isOpen) setLevel('root'); }, [isOpen]);

  const weekDates = activeWeek === 1 ? week1 : week2;
  const close = () => { setLevel('root'); onClose(); };

  const fire = (fn) => { fn(); close(); };

  const titles = {
    root: 'Actions',
    fill: `Auto-Fill Week ${activeWeek}`,
    clear: `Clear Week ${activeWeek}`,
    pk: `PK Week ${activeWeek}`,
  };

  const Row = ({ onClick, icon, label, accent, destructive, subtle, trailing }) => (
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
      {subtle && <span className="text-xs" style={{ color: THEME.text.muted }}>{subtle}</span>}
      {trailing}
    </button>
  );

  const headerExtra = level !== 'root' ? (
    <button
      onClick={() => setLevel('root')}
      className="flex items-center gap-1 px-4 py-2 text-xs font-medium"
      style={{ color: THEME.accent.blue, backgroundColor: THEME.bg.tertiary }}
    >
      <ChevronLeft size={14} /> Back
    </button>
  ) : null;

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={close}
      title={titles[level]}
      headerExtra={headerExtra}
      bodyClassName="p-0"
    >
      {level === 'root' && (
        <div>
          <Row
            icon={<Zap size={18} style={{ color: THEME.accent.blue }} />}
            label={`Auto-Fill Week ${activeWeek}`}
            accent={THEME.accent.blue}
            onClick={() => setLevel('fill')}
            trailing={<ChevronRight size={16} style={{ color: THEME.text.muted }} />}
          />
          <Row
            icon={<Trash2 size={18} style={{ color: THEME.status.error }} />}
            label={`Clear Week ${activeWeek}`}
            destructive
            onClick={() => setLevel('clear')}
            trailing={<ChevronRight size={16} style={{ color: THEME.text.muted }} />}
          />
          <Row
            icon={<BookOpen size={18} style={{ color: THEME.event.pkText }} />}
            label={`PK Week ${activeWeek}`}
            accent={THEME.event.pkText}
            onClick={() => setLevel('pk')}
            trailing={<ChevronRight size={16} style={{ color: THEME.text.muted }} />}
          />
        </div>
      )}

      {level === 'fill' && (
        <div>
          <Row
            icon={<Zap size={18} style={{ color: THEME.accent.blue }} />}
            label="All Full-Timers"
            accent={THEME.accent.blue}
            onClick={() => fire(() => {
              const hasExisting = fullTimeEmployees.some(e => employeeHasShiftsInWeek(e, weekDates));
              if (hasExisting) {
                setAutoPopulateConfirm({ type: 'populate-all', week: activeWeek });
              } else {
                const count = autoPopulateWeek(weekDates);
                if (count > 0) showToast('success', `Added ${count} shifts for full-time employees`);
                else showToast('warning', 'No shifts added — check availability');
              }
            })}
          />
          {fullTimeEmployees.map(emp => (
            <Row
              key={emp.id}
              icon={<span className="w-[18px]" />}
              label={emp.name}
              onClick={() => fire(() => {
                if (employeeHasShiftsInWeek(emp, weekDates)) {
                  setAutoPopulateConfirm({ type: 'populate-week', employee: emp, week: activeWeek });
                } else {
                  const count = autoPopulateWeek(weekDates, [emp]);
                  if (count > 0) showToast('success', `Added ${count} shifts for ${emp.name}`);
                  else showToast('warning', `No shifts added — ${emp.name} may not have availability set for this week`);
                }
              })}
            />
          ))}
        </div>
      )}

      {level === 'clear' && (
        <div>
          <Row
            icon={<Trash2 size={18} style={{ color: THEME.status.error }} />}
            label="All Full-Timers"
            destructive
            onClick={() => fire(() => setAutoPopulateConfirm({ type: 'clear-all', week: activeWeek }))}
          />
          {fullTimeEmployees.filter(emp => employeeHasShiftsInWeek(emp, weekDates)).map(emp => (
            <Row
              key={emp.id}
              icon={<span className="w-[18px]" />}
              label={emp.name}
              onClick={() => fire(() => setAutoPopulateConfirm({ type: 'clear-week', employee: emp, week: activeWeek }))}
            />
          ))}
        </div>
      )}

      {level === 'pk' && (
        <div>
          <Row
            icon={<BookOpen size={18} style={{ color: THEME.event.pkText }} />}
            label="Schedule a PK..."
            accent={THEME.event.pkText}
            onClick={() => fire(onOpenPKModal)}
          />
          <Row
            icon={<Zap size={18} style={{ color: THEME.event.pkText }} />}
            label="Autofill all eligible (week)"
            accent={THEME.event.pkText}
            onClick={() => fire(() => setAutoPopulateConfirm({ type: 'autofill-pk-week', week: activeWeek }))}
          />
        </div>
      )}
    </AdaptiveModal>
  );
};
