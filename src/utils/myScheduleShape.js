// Shared per-day shape builder for My Schedule surfaces (desktop modal + mobile Mine view).
// Returns plain objects only — no JSX. Each surface renders its own JSX from the shape.
// Keeping shape and presentation separate prevents the helper from creeping into a generic
// component that pleases neither view.
import { EVENT_TYPES, ROLES_BY_ID } from '../constants';
import { toDateKey, formatTimeShort } from './date';

/**
 * Returns a per-day shape for the given user across the given dates.
 * Each entry: { date, dateStr, dayName, shift, events, role, isTimeOff, isToday, summary }
 * summary — short string for the collapsed row label in the accordion header.
 *
 * @param {object} params
 * @param {object} params.user            - currentUser with .id and .email
 * @param {Date[]} params.dates           - ordered array of Date objects (14-day period)
 * @param {object} params.shifts          - keyed `${empId}-${dateStr}`
 * @param {object} params.events          - keyed `${empId}-${dateStr}`, value is array
 * @param {object[]} params.timeOffRequests - array of time-off request objects
 * @param {string}  params.todayStr       - YYYY-MM-DD string for today (for isToday flag)
 */
export function buildMyScheduleShape({ user, dates, shifts, events, timeOffRequests, todayStr }) {
  const myTimeOffDates = new Set();
  (timeOffRequests || [])
    .filter(r => r.email === user.email && r.status === 'approved')
    .forEach(r => (r.datesRequested || '').split(',').forEach(d => d && myTimeOffDates.add(d.trim())));

  return dates.map(date => {
    const dateStr = toDateKey(date);
    const k = `${user.id}-${dateStr}`;
    const shift = shifts[k] || null;
    const dayEvents = (events[k] || []).filter(ev => EVENT_TYPES[ev.type]);
    const role = shift ? ROLES_BY_ID[shift.role] : null;
    const isTimeOff = myTimeOffDates.has(dateStr);
    const isToday = dateStr === todayStr;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const summary = computeSummary({ shift, dayEvents, isTimeOff });
    return { date, dateStr, dayName, shift, events: dayEvents, role, isTimeOff, isToday, summary };
  });
}

function computeSummary({ shift, dayEvents, isTimeOff }) {
  if (isTimeOff) return 'Off';

  const sickEv = dayEvents.find(e => e.type === 'sick');
  const unavailEv = dayEvents.find(e => e.type === 'unavailable');
  if (sickEv) return 'Sick';
  if (unavailEv) return 'Unavailable';

  const otherEvents = dayEvents.filter(e => e.type !== 'sick' && e.type !== 'unavailable');

  if (shift && otherEvents.length === 0) {
    return `Work ${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}`;
  }
  if (shift && otherEvents.length === 1) {
    const evLabel = EVENT_TYPES[otherEvents[0].type].label.toLowerCase();
    return `Work ${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)} + 1 ${evLabel}`;
  }
  if (shift && otherEvents.length > 1) {
    return `Work ${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)} + ${otherEvents.length} events`;
  }
  if (!shift && otherEvents.length === 1) {
    const t = EVENT_TYPES[otherEvents[0].type];
    return `${t.label} ${formatTimeShort(otherEvents[0].startTime)}-${formatTimeShort(otherEvents[0].endTime)}`;
  }
  if (!shift && otherEvents.length > 1) {
    return `${otherEvents.length} events`;
  }
  return '—'; // em dash — nothing scheduled
}
