import React, { useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { DESKTOP_SCHEDULE_GRID_TEMPLATE } from '../constants';
import { THEME } from '../theme';
import { splitNameForSchedule } from '../utils/employeeRender';
import { toDateKey, getDayName } from '../utils/date';
import { getStoreHoursForDate } from '../utils/storeHoursOverrides';
import { hasApprovedTimeOffForDate } from '../utils/requests';
import { AnimatedNumber } from './uiKit';
import { ScheduleCell } from './ScheduleCell';

const EMPTY_EVENTS = Object.freeze([]);

export const EmployeeRow = React.memo(({ employee, dates, shifts, events = {}, onCellClick, getEmployeeHours, onEdit, isDeleted = false, onShowTooltip, onHideTooltip, timeOffRequests = [], isLocked = false }) => {
  const rowRef = useRef(null);
  const hours = getEmployeeHours(employee.id);
  const { first: nameFirst, rest: nameRest } = splitNameForSchedule(employee.name);

  const handleMouseEnter = () => {
    if (rowRef.current && onShowTooltip) {
      onShowTooltip(employee, hours, rowRef, isDeleted);
    }
  };

  const handleMouseLeave = () => {
    if (onHideTooltip) onHideTooltip();
  };

  return (
    <div className="grid gap-px schedule-row" style={{ gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, backgroundColor: THEME.border.subtle, opacity: isDeleted ? 0.5 : 1 }}>
      <div ref={rowRef} className="p-1.5 h-full" style={{ backgroundColor: THEME.bg.secondary }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex w-full min-h-[3rem] items-center gap-1.5">
          <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: isDeleted ? THEME.text.muted : 'white' }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5" title={employee.name}>
            <p className="truncate text-xs font-semibold leading-tight" style={{ color: isDeleted ? THEME.text.muted : THEME.text.primary }}>{nameFirst}</p>
            {nameRest ? (
              <p className="truncate text-[10px] leading-tight" style={{ color: THEME.text.muted }}>{nameRest}</p>
            ) : null}
            <p className="shrink-0 text-xs font-semibold leading-tight" style={{ color: isDeleted ? THEME.text.muted : hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={hours} decimals={1} suffix="h" /></p>
          </div>
          {!isDeleted && <button onClick={e => { e.stopPropagation(); onEdit(employee); }} className="flex shrink-0 self-center rounded p-0.5 hover:scale-110" style={{ backgroundColor: THEME.bg.elevated }}><Edit3 size={10} style={{ color: THEME.accent.purple }} /></button>}
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
