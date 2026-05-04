import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Star } from 'lucide-react';
import { THEME } from '../theme';
import { EVENT_TYPES, ROLES_BY_ID } from '../constants';
import { toDateKey, formatDate, formatTimeShort, getWeekNumber } from '../utils/date';
import { buildMyScheduleShape } from '../utils/myScheduleShape';
import { hasTitle } from '../utils/employeeRender';

/**
 * Desktop My Schedule modal — accordion of 14 day rows for the active period.
 * Read-only: click to expand each day, multi-open (expanding day N does not
 * collapse day M), all collapsed by default.
 *
 * Props:
 *   isOpen          — controls visibility
 *   onClose         — called by ×, Esc, click-outside
 *   currentUser     — { id, email, name, role, title }
 *   shifts          — keyed `${empId}-${dateStr}`
 *   events          — keyed `${empId}-${dateStr}`, value is array
 *   dates           — ordered Date[] for the active 14-day period
 *   timeOffRequests — array of time-off request objects
 */
export function MyScheduleModal({ isOpen, onClose, currentUser, shifts, events, dates, timeOffRequests }) {
  // Set of dateStr keys for expanded day rows — default empty (all collapsed).
  const [expandedDates, setExpandedDates] = useState(new Set());

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Reset expansion state when modal opens
  useEffect(() => {
    if (isOpen) setExpandedDates(new Set());
  }, [isOpen]);

  const toggleDay = useCallback((dateStr) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) { next.delete(dateStr); } else { next.add(dateStr); }
      return next;
    });
  }, []);

  if (!isOpen || !currentUser || !dates || dates.length === 0) return null;

  const todayStr = toDateKey(new Date());
  const dayShapes = buildMyScheduleShape({
    user: currentUser,
    dates,
    shifts,
    events,
    timeOffRequests,
    todayStr,
  });

  // Group into two weeks
  const week1Shapes = dayShapes.slice(0, 7);
  const week2Shapes = dayShapes.slice(7, 14);
  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);

  const periodLabel = dates.length >= 14
    ? `${formatDate(dates[0])} – ${formatDate(dates[13])}`
    : '';

  const hasAnything = dayShapes.some(d => d.shift || d.events.length > 0 || d.isTimeOff);

  const isSelfTitled = hasTitle(currentUser);

  const renderDayRow = (shape) => {
    const { date, dateStr, dayName, shift, events: dayEvents, role, isTimeOff, isToday, summary } = shape;
    const isEmpty = !shift && dayEvents.length === 0 && !isTimeOff;
    const isExpanded = expandedDates.has(dateStr);

    const borderColor = shift
      ? (isSelfTitled ? THEME.accent.cyan : (role?.color || THEME.text.muted))
      : dayEvents.length > 0
        ? EVENT_TYPES[dayEvents[0].type].border
        : isTimeOff
          ? THEME.text.muted
          : 'transparent';

    const rowBg = isToday ? THEME.accent.purple + '15' : THEME.bg.tertiary;
    const rowBorder = isToday ? `1px solid ${THEME.accent.purple}40` : `1px solid transparent`;

    if (isEmpty) {
      return (
        <div
          key={dateStr}
          className="flex items-center gap-3 px-3 py-2 rounded-lg"
          style={{ backgroundColor: rowBg, border: rowBorder, borderLeft: `3px solid transparent`, opacity: 0.5 }}
        >
          <div className="w-14 flex-shrink-0">
            <p className="text-xs font-bold" style={{ color: THEME.text.muted }}>{dayName}</p>
            <p style={{ color: THEME.text.muted, fontSize: '10px' }}>{date.getDate()}/{date.getMonth() + 1}</p>
          </div>
          <span className="text-xs" style={{ color: THEME.text.muted }}>—</span>
        </div>
      );
    }

    return (
      <div key={dateStr}>
        {/* Collapsed / header row — always visible */}
        <button
          onClick={() => toggleDay(dateStr)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:opacity-90"
          style={{
            backgroundColor: rowBg,
            border: rowBorder,
            borderLeft: `3px solid ${borderColor}`,
          }}
        >
          <div className="w-14 flex-shrink-0">
            <p className="text-xs font-bold" style={{ color: isToday ? THEME.accent.purple : THEME.text.primary }}>{dayName}</p>
            <p style={{ color: THEME.text.muted, fontSize: '10px' }}>{date.getDate()}/{date.getMonth() + 1}</p>
          </div>
          <p className="flex-1 text-xs truncate" style={{ color: THEME.text.secondary }}>{summary}</p>
          {/* Chevron rotates 90deg when expanded */}
          <ChevronRight
            size={14}
            style={{
              color: THEME.text.muted,
              flexShrink: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {/* Expanded body */}
        {isExpanded && (
          <div
            className="mx-3 mb-1 px-3 py-2 rounded-b-lg space-y-2"
            style={{ backgroundColor: THEME.bg.secondary, borderLeft: `3px solid ${borderColor}`, borderRight: `1px solid ${THEME.border.subtle}`, borderBottom: `1px solid ${THEME.border.subtle}` }}
          >
            {/* Work shift detail */}
            {shift && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Role / title pill */}
                {isSelfTitled ? (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.primary }}>{currentUser.title || 'Staff'}</span>
                ) : role ? (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: role.color + '25', color: role.color }}>{role.name}</span>
                ) : null}
                <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)}</span>
                {shift.task && (
                  <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.task + '20', color: THEME.task }}>
                    <Star size={8} fill={THEME.task} color={THEME.task} />{shift.task}
                  </span>
                )}
              </div>
            )}

            {/* Time off */}
            {isTimeOff && !shift && (
              <p className="text-xs" style={{ color: THEME.text.muted }}>Time Off (Approved)</p>
            )}

            {/* Events — full label, no truncation (desktop modal has vertical space) */}
            {dayEvents.map((ev, j) => {
              const et = EVENT_TYPES[ev.type];
              return (
                <div key={j} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Full label (intentional: desktop has room; Mine uses shortLabel for tight space) */}
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}` }}>{et.label}</span>
                    <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(ev.startTime)} – {formatTimeShort(ev.endTime)}</span>
                  </div>
                  {/* Note — wrapped, not truncated (intentional: Mine truncates for tight row; modal expanded body has vertical space) */}
                  {ev.note && (
                    <p className="text-xs leading-relaxed" style={{ color: THEME.text.muted }}>{ev.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderWeek = (shapes, weekNum) => (
    <div className="mb-3">
      <p className="text-xs font-semibold mb-1.5 px-1" style={{ color: THEME.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Week {weekNum}
      </p>
      <div className="space-y-1">
        {shapes.map(renderDayRow)}
      </div>
    </div>
  );

  return (
    /* Backdrop — click outside closes */
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          backgroundColor: THEME.bg.secondary,
          border: `1px solid ${THEME.border.default}`,
          boxShadow: THEME.shadow.card,
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>My Schedule</h2>
            {periodLabel && (
              <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>{periodLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: THEME.text.muted, backgroundColor: THEME.bg.tertiary }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-3">
          {!hasAnything ? (
            <p className="text-sm text-center py-8" style={{ color: THEME.text.muted }}>Nothing scheduled this period</p>
          ) : (
            <>
              {renderWeek(week1Shapes, weekNum1)}
              {renderWeek(week2Shapes, weekNum2)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyScheduleModal;
