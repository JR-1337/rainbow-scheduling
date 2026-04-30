import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { THEME } from '../theme';
import { toDateKey, formatTimeShort } from '../utils/date';
import { parseLocalDate } from '../utils/format';

// Aggregate PK events into unique {date, startTime, endTime} slots within the
// given period. Iterates active employees × period dates and reads events keyed
// to their IDs — mirrors PKModal REMOVE so the panel can't surface PK rows
// keyed under deleted employees (which was producing ghost "booked" entries).
// Names come from the live employee record, not the stored employeeName string,
// so renames take effect immediately.
const buildPKSlots = (events, dates, employees) => {
  if (!events || !dates?.length || !employees?.length) return [];
  const slotMap = new Map();
  for (const emp of employees) {
    if (!emp.active || emp.deleted || emp.isOwner) continue;
    for (const d of dates) {
      const dateKey = toDateKey(d);
      const list = events[`${emp.id}-${dateKey}`] || [];
      for (const ev of list) {
        if (ev.type !== 'pk') continue;
        const key = `${dateKey}|${ev.startTime}|${ev.endTime}`;
        if (!slotMap.has(key)) {
          slotMap.set(key, { date: dateKey, startTime: ev.startTime, endTime: ev.endTime, names: [], note: ev.note || '' });
        }
        const slot = slotMap.get(key);
        slot.names.push(emp.name);
        if (!slot.note && ev.note) slot.note = ev.note;
      }
    }
  }
  return Array.from(slotMap.values())
    .map(s => ({ ...s, names: Array.from(new Set(s.names)).sort() }))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return a.startTime.localeCompare(b.startTime);
    });
};

// Compact panel listing PK slots booked in the current period. Renders next to
// (below) the announcement panel on every view that surfaces announcements.
// Returns null when no PK is booked in the period (non-invasive default).
export const PKDetailsPanel = ({ events = {}, dates = [], employees = [], className = '' }) => {
  const slots = useMemo(() => buildPKSlots(events, dates, employees), [events, dates, employees]);
  if (slots.length === 0) return null;

  return (
    <div className={`p-3 rounded-lg ${className}`} style={{
      backgroundColor: THEME.event.pkBg,
      border: `1px solid ${THEME.event.pkBorder}`,
      borderLeft: `3px solid ${THEME.event.pkText}`,
    }}>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} style={{ color: THEME.event.pkText }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: THEME.event.pkText }}>
          PK This Period
        </span>
      </div>
      <ul className="space-y-1.5">
        {slots.map(slot => {
          const dateObj = parseLocalDate(slot.date);
          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <li key={`${slot.date}|${slot.startTime}|${slot.endTime}`} className="text-xs leading-snug" style={{ color: THEME.text.primary }}>
              <span className="font-semibold">{dayLabel}</span>
              <span style={{ color: THEME.text.muted }}> · </span>
              <span>{formatTimeShort(slot.startTime)}-{formatTimeShort(slot.endTime)}</span>
              <span style={{ color: THEME.text.muted }}> · </span>
              <span style={{ color: THEME.text.secondary }}>{slot.names.length} booked</span>
              {slot.note && (
                <span className="block mt-0.5 italic" style={{ color: THEME.text.muted }}>
                  {slot.note}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
