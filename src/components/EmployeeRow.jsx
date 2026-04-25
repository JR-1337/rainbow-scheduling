import React, { useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { THEME } from '../theme';
import { toDateKey, getDayName } from '../utils/date';
import { getStoreHoursForDate } from '../utils/storeHoursOverrides';
import { hasApprovedTimeOffForDate } from '../utils/requests';
import { AnimatedNumber } from './uiKit';
import { ScheduleCell } from './ScheduleCell';

const EMPTY_EVENTS = Object.freeze([]);

export const EmployeeRow = React.memo(({ employee, dates, shifts, events = {}, onCellClick, getEmployeeHours, onEdit, isDeleted = false, onShowTooltip, onHideTooltip, timeOffRequests = [], isLocked = false }) => {
  const rowRef = useRef(null);
  const hours = getEmployeeHours(employee.id);

  const handleMouseEnter = () => {
    if (rowRef.current && onShowTooltip) {
      onShowTooltip(employee, hours, rowRef, isDeleted);
    }
  };

  const handleMouseLeave = () => {
    if (onHideTooltip) onHideTooltip();
  };

  return (
    <div className="grid gap-px schedule-row" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle, opacity: isDeleted ? 0.5 : 1 }}>
      <div ref={rowRef} className="p-1.5" style={{ backgroundColor: THEME.bg.secondary }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: isDeleted ? THEME.text.muted : 'white' }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs truncate" style={{ color: isDeleted ? THEME.text.muted : THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs font-semibold" style={{ color: isDeleted ? THEME.text.muted : hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={hours} decimals={1} suffix="h" /></p>
          </div>
          {!isDeleted && <button onClick={e => { e.stopPropagation(); onEdit(employee); }} className="p-0.5 rounded hover:scale-110 flex-shrink-0" style={{ backgroundColor: THEME.bg.elevated }}><Edit3 size={10} style={{ color: THEME.accent.purple }} /></button>}
        </div>
      </div>

      {dates.map((date, i) => {
        const dayName = getDayName(date);
        const av = employee.availability[dayName];
        const storeHrs = getStoreHoursForDate(date);
        const shift = shifts[`${employee.id}-${toDateKey(date)}`];
        const dateStr = toDateKey(date);
        const cellEvents = events[`${employee.id}-${dateStr}`] || EMPTY_EVENTS;
        const approvedTimeOff = hasApprovedTimeOffForDate(employee.email, dateStr, timeOffRequests);
        return (
          <div key={dateStr} className="p-0.5" style={{ backgroundColor: THEME.bg.secondary }}>
            <ScheduleCell shift={shift} events={cellEvents} date={date} availability={av} storeHours={storeHrs} onCellClick={onCellClick} isDeleted={isDeleted} hasApprovedTimeOff={approvedTimeOff} isLocked={isLocked} employee={employee} />
          </div>
        );
      })}
    </div>
  );
});
