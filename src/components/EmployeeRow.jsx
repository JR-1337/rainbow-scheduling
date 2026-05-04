import React, { useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { DESKTOP_SCHEDULE_GRID_TEMPLATE } from '../constants';
import { THEME } from '../theme';
import { hasTitle, splitNameForSchedule } from '../utils/employeeRender';
import { toDateKey, getDayName } from '../utils/date';
import { getStoreHoursForDate } from '../utils/storeHoursOverrides';
import { OVERTIME_THRESHOLDS } from '../utils/timemath';
import { AnimatedNumber } from './uiKit';
import { ScheduleCell } from './ScheduleCell';
import { canEditShiftDate } from '../utils/canEditShiftDate';

const EMPTY_EVENTS = Object.freeze([]);

export const EmployeeRow = React.memo(({ employee, dates, shifts, events = {}, onCellClick, getEmployeeHours, onEdit, isDeleted = false, onShowTooltip, onHideTooltip, approvedTimeOffSet, isLocked = false, isAdmin = false, currentUser = null }) => {
  const rowRef = useRef(null);
  const hours = getEmployeeHours(employee.id);
  const { first: nameFirst, rest: nameRest } = splitNameForSchedule(employee.name);
  const showTitleLine = !isDeleted && hasTitle(employee) && (employee.title || '').trim();

  const handleMouseEnter = () => {
    if (rowRef.current && onShowTooltip) {
      onShowTooltip(employee, hours, rowRef, isDeleted);
    }
  };

  const handleMouseLeave = () => {
    if (onHideTooltip) onHideTooltip();
  };

  // Fixed row strip: 4.5rem cell + p-0.5 vertical (0.25rem) so grid row height cannot grow from name stack min-content.
  const rowStrip = 'p-0.5 h-[calc(4.5rem+0.25rem)] max-h-[calc(4.5rem+0.25rem)] min-h-0 overflow-hidden box-border';
  return (
    <div className="grid gap-px schedule-row" style={{ gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, backgroundColor: THEME.border.subtle, opacity: isDeleted ? 0.5 : 1 }}>
      <div ref={rowRef} className={rowStrip} style={{ backgroundColor: THEME.bg.secondary }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex h-full min-h-0 w-full items-center gap-1.5 overflow-hidden">
          <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: isDeleted ? THEME.text.muted : 'white' }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-h-0 min-w-0 flex-1 flex flex-col justify-center gap-0.5 overflow-hidden" title={employee.name}>
            {showTitleLine ? (
              <p className="truncate text-[9px] uppercase tracking-wide leading-none" style={{ color: THEME.text.muted }} title={employee.title}>{employee.title}</p>
            ) : null}
            <p className="truncate text-xs font-semibold leading-tight" style={{ color: isDeleted ? THEME.text.muted : THEME.text.primary }}>{nameFirst}</p>
            {nameRest ? (
              <p className="truncate text-[11px] leading-tight" style={{ color: THEME.text.muted }}>{nameRest}</p>
            ) : null}
            <p className="shrink-0 truncate text-xs font-semibold leading-tight" style={{ color: isDeleted ? THEME.text.muted
                : hours >= OVERTIME_THRESHOLDS.OVER_RED ? THEME.status.error
                : hours > OVERTIME_THRESHOLDS.CAP ? THEME.status.warning
                : hours === OVERTIME_THRESHOLDS.CAP ? THEME.status.atCap
                : THEME.accent.cyan }}><AnimatedNumber value={hours} decimals={1} suffix="h" /></p>
          </div>
          {!isDeleted && <button aria-label={`Edit ${employee.name || 'employee'}`} onClick={e => { e.stopPropagation(); onEdit(employee); }} className="flex shrink-0 self-center rounded p-0.5 hover:scale-110" style={{ backgroundColor: THEME.bg.elevated }}><Edit3 size={10} style={{ color: THEME.accent.purple }} /></button>}
        </div>
      </div>

      {dates.map((date, i) => {
        const dayName = getDayName(date);
        const av = employee.availability?.[dayName];
        const storeHrs = getStoreHoursForDate(date);
        const shift = shifts[`${employee.id}-${toDateKey(date)}`];
        const dateStr = toDateKey(date);
        const cellEvents = events[`${employee.id}-${dateStr}`] || EMPTY_EVENTS;
        const approvedTimeOff = approvedTimeOffSet?.has(`${employee.email}-${dateStr}`) || false;
        // v2.32.0: cell is locked if edit-mode lock OR past-period lock applies.
        const pastLocked = currentUser ? !canEditShiftDate(currentUser, date, new Date()) : false;
        const cellIsLocked = isLocked || pastLocked;
        return (
          <div key={dateStr} className={rowStrip} style={{ backgroundColor: THEME.bg.secondary }}>
            <ScheduleCell shift={shift} events={cellEvents} date={date} availability={av} storeHours={storeHrs} onCellClick={onCellClick} isDeleted={isDeleted} hasApprovedTimeOff={approvedTimeOff} isLocked={cellIsLocked} employee={employee} isAdmin={isAdmin} />
          </div>
        );
      })}
    </div>
  );
});
