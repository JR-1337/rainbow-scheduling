import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { THEME } from '../theme';
import { toDateKey, formatTimeShort } from '../utils/date';
import { parseLocalDate } from '../utils/format';

// Aggregate PK events into unique {date, startTime, endTime} slots within the
// given period. Returns [] when no PK booked in the period — caller can render
// nothing when empty (the panel itself returns null).
const buildPKSlots = (events, dates) => {
  if (!events || !dates?.length) return [];
  const dateStrs = new Set(dates.map(d => toDateKey(d)));
  const slotMap = new Map();
  Object.values(events).forEach(arr => {
    (arr || []).forEach(ev => {
      if (ev.type !== 'pk') return;
      if (!dateStrs.has(ev.date)) return;
      const key = `${ev.date}|${ev.startTime}|${ev.endTime}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, { date: ev.date, startTime: ev.startTime, endTime: ev.endTime, names: [], note: ev.note || '' });
      }
      const slot = slotMap.get(key);
      if (ev.employeeName) slot.names.push(ev.employeeName);
      if (!slot.note && ev.note) slot.note = ev.note;
    });
  });
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
export const PKDetailsPanel = ({ events = {}, dates = [], className = '' }) => {
  const slots = useMemo(() => buildPKSlots(events, dates), [events, dates]);
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
          const namesPreview = slot.names.length <= 3
            ? slot.names.join(', ')
            : `${slot.names.slice(0, 3).join(', ')} +${slot.names.length - 3} more`;
          return (
            <li key={`${slot.date}|${slot.startTime}|${slot.endTime}`} className="text-xs leading-snug" style={{ color: THEME.text.primary }}>
              <span className="font-semibold">{dayLabel}</span>
              <span style={{ color: THEME.text.muted }}> · </span>
              <span>{formatTimeShort(slot.startTime)}-{formatTimeShort(slot.endTime)}</span>
              <span style={{ color: THEME.text.muted }}> · </span>
              <span style={{ color: THEME.text.secondary }}>{slot.names.length} booked</span>
              {slot.names.length > 0 && (
                <span style={{ color: THEME.text.muted }}>: {namesPreview}</span>
              )}
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
