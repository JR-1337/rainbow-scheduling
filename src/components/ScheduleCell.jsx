import React, { useState, useRef } from 'react';
import { Star, Plus } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID, EVENT_TYPES } from '../constants';
import { isStatHoliday } from '../utils/storeHours';
import { parseTime, formatTimeShort } from '../utils/date';
import { TaskStarTooltip } from './uiKit';

const getAvailabilityShading = (avail, storeHours) => {
  if (!avail.available) return { top: 100, bottom: 0 };
  const storeStart = parseTime(storeHours.open), storeEnd = parseTime(storeHours.close);
  const storeDuration = storeEnd - storeStart;
  const availStart = parseTime(avail.start), availEnd = parseTime(avail.end);
  return {
    top: Math.max(0, Math.min(100, ((availStart - storeStart) / storeDuration) * 100)),
    bottom: Math.max(0, Math.min(100, ((storeEnd - availEnd) / storeDuration) * 100))
  };
};

export const ScheduleCell = React.memo(({ shift, events = [], date, onClick, availability, storeHours, isDeleted = false, hasApprovedTimeOff = false, isLocked = false }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES_BY_ID[shift.role] : null;
  const visibleEvents = (events || []).filter(ev => EVENT_TYPES[ev.type]);
  const hasEvents = visibleEvents.length > 0;
  const eventOnly = !shift && hasEvents;
  const firstEvent = hasEvents ? visibleEvents[0] : null;
  const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
  const isHoliday = isStatHoliday(date);
  const shading = getAvailabilityShading(availability, storeHours);
  const isFullyUnavailable = !availability.available;
  const hasPartial = availability.available && (shading.top > 5 || shading.bottom > 5);

  const isClickable = !isDeleted && !isLocked;

  return (
    <>
      <div onClick={isClickable ? onClick : undefined} className={`h-14 rounded-lg transition-all relative overflow-hidden ${isClickable ? 'cursor-pointer group' : isLocked && (shift || hasEvents) ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: shift ? role?.color + '25' : eventOnly ? firstEventType.bg : THEME.bg.tertiary,
          border: `1px solid ${shift ? role?.color + '50' : eventOnly ? firstEventType.border : THEME.border.default}`
        }}>

        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}

        {isFullyUnavailable && !shift && !isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '9px' }}>Unavailable</span>
          </div>
        )}

        {hasApprovedTimeOff && !shift && !isDeleted && (
          <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${THEME.accent.cyan}AA 3px, ${THEME.accent.cyan}AA 6px)` }} />
        )}

        {hasPartial && shading.top > 5 && !shift && !isDeleted && (
          <div className="absolute top-0 left-0 right-0" style={{ height: `${shading.top}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)` }} />
        )}

        {hasPartial && shading.bottom > 5 && !shift && !isDeleted && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: `${shading.bottom}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)` }} />
        )}

        {shift ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative">
            {shift.task && (
              <div ref={starRef} className="absolute top-1 right-1 cursor-pointer" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                <Star size={10} fill={THEME.task} color={THEME.task} />
              </div>
            )}
            <span className="text-xs font-semibold truncate pr-3" style={{ color: role?.color }}>{role?.name}</span>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
              <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>{shift.hours}h</span>
            </div>
            {hasEvents && (
              <div className="absolute bottom-0 right-0 flex gap-0.5 p-0.5">
                {visibleEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type];
                  if (!et) return null;
                  return (
                    <span key={i}
                      title={`${et.label} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`}
                      className="rounded px-1 text-[9px] font-semibold leading-tight"
                      style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}` }}>
                      {et.shortLabel}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : eventOnly ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative"
            title={visibleEvents.map(ev => {
              const et = EVENT_TYPES[ev.type];
              return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
            }).join('\n')}>
            <span className="text-xs font-semibold truncate" style={{ color: firstEventType.text }}>
              {visibleEvents.length === 1 ? firstEventType.shortLabel : `${visibleEvents.length} events`}
            </span>
            <span className="text-xs" style={{ color: firstEventType.text, opacity: 0.8 }}>
              {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
            </span>
          </div>
        ) : (
          !isDeleted && !isLocked && (
            <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} style={{ color: THEME.text.muted }} />
            </div>
          )
        )}
        {isClickable && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" style={{ border: `2px solid ${THEME.accent.purple}` }} />}
      </div>
      <TaskStarTooltip task={shift?.task} show={showTask} triggerRef={starRef} />
    </>
  );
});
