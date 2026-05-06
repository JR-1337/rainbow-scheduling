import React, { useMemo } from 'react';
import { Briefcase, CalendarDays, Star, Ban, Palmtree } from 'lucide-react';
import { MobileBottomSheet } from '../MobileEmployeeView';
import { EVENT_TYPES } from '../constants';
import { THEME } from '../theme';
import { formatTimeShort, calculateHours } from '../utils/date';
import { computeNetHoursForShift } from '../utils/timemath';

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon ? <Icon size={14} style={{ color: THEME.accent.cyan, flexShrink: 0 }} aria-hidden /> : null}
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: THEME.text.muted }}
      >
        {children}
      </span>
    </div>
  );
}

/** Day detail bottom sheet. Set `showWorkHourTotals={false}` for staff (start/end only on work). */
export default function EventDetailSheet({
  isOpen,
  onClose,
  dateLabel = '',
  employeeName = '',
  shift = null,
  roleDisplay = '',
  roleColor = THEME.text.secondary,
  events = [],
  approvedTimeOff = false,
  unavailable = false,
  showWorkHourTotals = true,
}) {
  const { sickRows, meetingPkRows } = useMemo(() => {
    const known = (events || []).filter((ev) => EVENT_TYPES[ev.type]);
    return {
      sickRows: known.filter((ev) => ev.type === 'sick'),
      meetingPkRows: known
        .filter((ev) => ev.type === 'meeting' || ev.type === 'pk')
        .slice()
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    };
  }, [events]);

  const hasSick = sickRows.length > 0;
  const workNetHours = showWorkHourTotals && shift ? computeNetHoursForShift(shift) : null;
  const workGrossHours = showWorkHourTotals && shift?.startTime && shift?.endTime
    ? calculateHours(shift.startTime, shift.endTime)
    : null;

  const showWork = !!shift;
  const showStatuses = approvedTimeOff || unavailable;
  const showActivities = meetingPkRows.length > 0;
  const showSickStrip = hasSick && !showWork;

  const sheetTitle = employeeName ? employeeName : 'Day detail';

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} title={sheetTitle}>
      <div className="space-y-4">
        <p className="text-xs leading-snug -mt-1" style={{ color: THEME.text.muted }}>
          {dateLabel}
        </p>

        {/* Status banners */}
        {showStatuses && (
          <div className="flex flex-wrap gap-2">
            {approvedTimeOff && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: THEME.bg.elevated,
                  border: `1px solid ${THEME.border.default}`,
                  color: THEME.text.secondary,
                }}
              >
                <Palmtree size={14} style={{ color: THEME.accent.cyan }} aria-hidden />
                Approved time off
              </div>
            )}
            {unavailable && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: THEME.bg.elevated,
                  border: `1px solid ${THEME.border.subtle}`,
                  color: THEME.text.muted,
                }}
              >
                <Ban size={14} aria-hidden />
                Unavailable
              </div>
            )}
          </div>
        )}

        {/* Work shift */}
        {showWork && (
          <section>
            <SectionLabel icon={Briefcase}>Work</SectionLabel>
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                backgroundColor: THEME.bg.elevated,
                border: `1px solid ${THEME.border.default}`,
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-bold tabular-nums" style={{ color: THEME.text.primary }}>
                  {formatTimeShort(shift.startTime)}
                  <span style={{ color: THEME.text.muted, fontWeight: 600 }}> – </span>
                  {formatTimeShort(shift.endTime)}
                </span>
                {showWorkHourTotals && workNetHours != null && (
                  <span
                    className="text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: THEME.accent.cyan + '22',
                      color: THEME.accent.cyan,
                    }}
                  >
                    {hasSick ? '0' : workNetHours.toFixed(1)}h net
                    {!hasSick && workGrossHours != null && Math.abs(workGrossHours - workNetHours) > 0.05 && (
                      <span className="text-[10px] font-normal ml-1 opacity-85">
                        ({workGrossHours.toFixed(1)}h gross)
                      </span>
                    )}
                  </span>
                )}
              </div>
              {roleDisplay ? (
                <p className="text-xs font-semibold" style={{ color: hasSick ? THEME.text.muted : roleColor }}>
                  {roleDisplay}
                  {hasSick ? <span style={{ color: THEME.text.muted }}> · sick day</span> : null}
                </p>
              ) : null}
              {shift.task && String(shift.task).trim() ? (
                <div
                  className="flex items-start gap-2 pt-1 mt-1"
                  style={{ borderTop: `1px solid ${THEME.border.subtle}` }}
                >
                  <Star size={14} fill={THEME.task} color={THEME.task} className="shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: THEME.text.muted }}>
                      Task
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: THEME.text.primary }}>
                      {String(shift.task).trim()}
                    </p>
                  </div>
                </div>
              ) : null}
              {hasSick && sickRows[0]?.note ? (
                <p className="text-xs italic" style={{ color: THEME.text.secondary }}>
                  Sick note: {sickRows[0].note}
                </p>
              ) : null}
            </div>
          </section>
        )}

        {/* Sick-only (no work row saved) */}
        {showSickStrip && (
          <section>
            <SectionLabel icon={CalendarDays}>Absence</SectionLabel>
            <ul className="space-y-2">
              {sickRows.map((ev, i) => {
                const type = EVENT_TYPES.sick;
                return (
                  <li
                    key={i}
                    className="rounded-xl p-3"
                    style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${type.border}55` }}
                  >
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: type.bg, color: type.text }}
                    >
                      {type.label}
                    </span>
                    {(ev.startTime || ev.endTime) && (
                      <p className="text-xs font-medium mt-2" style={{ color: THEME.text.primary }}>
                        {formatTimeShort(ev.startTime)}
                        {ev.endTime ? `–${formatTimeShort(ev.endTime)}` : ''}
                      </p>
                    )}
                    {ev.note ? (
                      <p className="text-xs mt-1 italic" style={{ color: THEME.text.secondary }}>
                        {ev.note}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Meetings & PK */}
        {showActivities && (
          <section>
            <SectionLabel icon={CalendarDays}>Meetings & training</SectionLabel>
            <ul className="space-y-2">
              {meetingPkRows.map((ev, i) => {
                const type = EVENT_TYPES[ev.type];
                const hasTime = ev.startTime || ev.endTime;
                return (
                  <li
                    key={`${ev.type}-${i}-${ev.startTime || ''}`}
                    className="rounded-xl p-3"
                    style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${type.border}55` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: type.bg, color: type.text }}
                      >
                        {type.label}
                      </span>
                      {hasTime && (
                        <span className="text-xs font-semibold tabular-nums text-right" style={{ color: THEME.text.primary }}>
                          {formatTimeShort(ev.startTime)}
                          {ev.endTime ? `–${formatTimeShort(ev.endTime)}` : ''}
                        </span>
                      )}
                    </div>
                    {ev.note && String(ev.note).trim() ? (
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: THEME.text.secondary }}>
                        <span className="font-medium" style={{ color: THEME.text.muted }}>
                          Details:{' '}
                        </span>
                        {String(ev.note).trim()}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Empty-ish day: only statuses, no work, no activities */}
        {!showWork && !showActivities && !showSickStrip && !showStatuses && (
          <p className="text-xs text-center py-4" style={{ color: THEME.text.muted }}>
            Nothing scheduled for this day.
          </p>
        )}

        {showStatuses && !showWork && !showActivities && !showSickStrip && (
          <p className="text-xs" style={{ color: THEME.text.secondary }}>
            No shift or other activities on this date.
          </p>
        )}
      </div>
    </MobileBottomSheet>
  );
}
