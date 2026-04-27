import React, { useState, useRef } from 'react';
import { Star, Plus } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID, EVENT_TYPES } from '../constants';
import { isStatHoliday } from '../utils/storeHours';
import { parseTime, formatTimeShort } from '../utils/date';
import { TaskStarTooltip } from './uiKit';
import { hasTitle } from '../utils/employeeRender';
import { EventGlyphPill } from './EventGlyphPill';
import SickStripeOverlay from './SickStripeOverlay';

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

export const ScheduleCell = React.memo(({ shift, events = [], date, onCellClick, availability, storeHours, isDeleted = false, hasApprovedTimeOff = false, isLocked = false, employee = null }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES_BY_ID[shift.role] : null;
  // Titled admins: job title lives in the name column only; cell shows time/hours (+ events).
  const isTitledShift = !!shift && hasTitle(employee);
  const labelText = isTitledShift ? '' : (role?.name || '');
  const labelColor = role?.color;
  const visibleEvents = (events || []).filter(ev => EVENT_TYPES[ev.type]);
  const hasEvents = visibleEvents.length > 0;
  const eventOnly = !shift && hasEvents;
  const firstEvent = hasEvents ? visibleEvents[0] : null;
  const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
  // Sick overrides the day: cell reads as "not here", work row is struck through
  // but still visible for audit.
  const hasSick = visibleEvents.some(ev => ev.type === 'sick');
  const isHoliday = isStatHoliday(date);
  const shading = getAvailabilityShading(availability, storeHours);
  const isFullyUnavailable = !availability.available;
  const hasPartial = availability.available && (shading.top > 5 || shading.bottom > 5);

  const isClickable = !isDeleted && !isLocked;

  return (
    <>
      <div onClick={isClickable ? () => onCellClick(employee, date, shift) : undefined} className={`h-[4.5rem] rounded-lg transition-all relative overflow-hidden ${isClickable ? 'cursor-pointer group' : isLocked && (shift || hasEvents) ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: hasSick ? EVENT_TYPES.sick.bg : shift && isTitledShift ? THEME.titledEmployee.shiftFill : shift ? role?.color + '25' : eventOnly ? firstEventType.bg : THEME.bg.tertiary,
          border: `1px solid ${hasSick ? EVENT_TYPES.sick.border : shift && isTitledShift ? THEME.titledEmployee.shiftBorder : shift ? role?.color + '50' : eventOnly ? firstEventType.border : THEME.border.default}`
        }}>

        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}

        {/* Sick: thin red diagonal stripe across the cell (bottom-left to top-
            right). Additive to the amber bg + struck work text — makes the
            "not here" state unmistakable even in a glance at a dense grid.
            Not OTR brand red (#EC3228); uses red-600 (#DC2626). */}
        {hasSick && <SickStripeOverlay />}

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
          <div className="p-1.5 h-full flex flex-col justify-between relative min-h-0 min-w-0">
            <div className="flex items-start gap-0.5 w-full min-w-0 shrink-0">
              <div className="min-w-0 flex-1">
                {(labelText || hasEvents) ? (
                  <div className="flex items-start justify-between gap-1 min-w-0">
                    {labelText ? (
                      <span className="text-xs font-semibold truncate min-w-0" style={{ color: hasSick ? THEME.text.muted : labelColor, textDecoration: hasSick ? 'line-through' : 'none' }}>{labelText}</span>
                    ) : <span className="min-w-0 flex-1" />}
                    {hasEvents && !hasSick && <EventGlyphPill events={visibleEvents} size="md" />}
                  </div>
                ) : null}
              </div>
              {shift.task && (
                <div ref={starRef} className="shrink-0 cursor-pointer self-start pt-px" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                  <Star size={10} fill={THEME.task} color={THEME.task} />
                </div>
              )}
            </div>
            {hasSick && visibleEvents.find(ev => ev.type === 'sick')?.note ? (
              <span className="text-xs italic truncate block" style={{ color: THEME.text.muted }} title={visibleEvents.find(ev => ev.type === 'sick').note}>
                {visibleEvents.find(ev => ev.type === 'sick').note}
              </span>
            ) : (
              <div className={`flex w-full min-w-0 items-center justify-between ${!(labelText || hasEvents) ? 'mt-auto' : ''}`}>
                <span className="text-xs min-w-0 truncate pr-1" style={{ color: THEME.text.muted, textDecoration: hasSick ? 'line-through' : 'none' }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                <span className="shrink-0 text-xs font-medium" style={{ color: THEME.text.muted, textDecoration: hasSick ? 'line-through' : 'none' }}>{hasSick ? '0' : shift.hours}h</span>
              </div>
            )}
          </div>
        ) : eventOnly ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative"
            title={visibleEvents.map(ev => {
              const et = EVENT_TYPES[ev.type];
              return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
            }).join('\n')}>
            {visibleEvents.length === 2 ? (
              <div className="flex flex-col gap-0.5">
                {visibleEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type] || firstEventType;
                  return (
                    <div key={i} className="flex items-center gap-0.5">
                      <span className="rounded font-semibold leading-tight" style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}`, fontSize: '10px', padding: '0 2px' }}>{et.shortLabel}</span>
                      <span style={{ color: et.text, opacity: 0.8, fontSize: '9px' }}>{formatTimeShort(ev.startTime)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <span className="text-xs font-semibold truncate" style={{ color: firstEventType.text }}>
                  {visibleEvents.length === 1 ? firstEventType.shortLabel : `${visibleEvents.length} events`}
                </span>
                <span className="text-xs" style={{ color: firstEventType.text, opacity: 0.8 }}>
                  {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
                </span>
              </>
            )}
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
