import { toDateKey } from './date';
import { parseLocalDate } from './format';

export function getFutureShiftDates(employeeId, shiftsObj) {
  const today = toDateKey(new Date());
  return Object.values(shiftsObj)
    .filter(shift => shift.employeeId === employeeId && shift.date > today)
    .map(shift => shift.date)
    .sort();
}

// Future events keyed `${empId}-${date}` carry the empId in the key. Iterate
// the events store directly rather than each event row so an event without an
// `employeeId` field on the row (older shape) still gets caught.
export function getFutureEventDates(employeeId, eventsObj) {
  const today = toDateKey(new Date());
  const dates = new Set();
  const prefix = `${employeeId}-`;
  for (const key of Object.keys(eventsObj || {})) {
    if (!key.startsWith(prefix)) continue;
    const list = eventsObj[key];
    if (!list || list.length === 0) continue;
    const date = key.slice(prefix.length);
    if (date > today) dates.add(date);
  }
  return Array.from(dates).sort();
}

export function formatFutureEventsBlockMessage(verb, name, futureDates) {
  const formatted = futureDates.slice(0, 5).map(d => {
    const date = parseLocalDate(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }).join(', ');
  const moreText = futureDates.length > 5 ? ` and ${futureDates.length - 5} more` : '';
  return `Cannot ${verb}: ${name} has ${futureDates.length} future event(s) (PK / meeting / sick / etc.): ${formatted}${moreText}. Clear those events first.`;
}

export function formatFutureShiftsBlockMessage(verb, name, futureDates) {
  const formatted = futureDates.slice(0, 5).map(d => {
    const date = parseLocalDate(d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }).join(', ');
  const moreText = futureDates.length > 5 ? ` and ${futureDates.length - 5} more` : '';
  return `Cannot ${verb}: ${name} has ${futureDates.length} future shift(s): ${formatted}${moreText}. Remove or reassign shifts first.`;
}

// Mirrors backend computeDefaultPassword_ in backend/Code.gs. Pure preview;
// backend is authoritative on save. Pattern: FirstnameL with collision digits.
// Single-word: whole word. Hyphenated last: first segment's initial. Empty: emp-XXX.
export function computeDefaultPassword(name, employees, excludeId) {
  const cleaned = String(name || '').trim();
  if (!cleaned) {
    const seq = (employees ? employees.length + 1 : 1);
    return `emp-${String(seq).padStart(3, '0')}`;
  }
  const words = cleaned.split(/\s+/);
  let base;
  if (words.length === 1) {
    base = words[0];
  } else {
    const first = words[0];
    const last = words[words.length - 1];
    const lastInitial = last.split('-')[0].charAt(0);
    base = first + lastInitial;
  }
  const taken = (employees || [])
    .filter(e => !e.deleted && e.id !== excludeId)
    .map(e => String(e.password || '').toLowerCase());
  if (!taken.includes(base.toLowerCase())) return base;
  let i = 2;
  while (taken.includes(`${base}${i}`.toLowerCase())) i++;
  return `${base}${i}`;
}

export function filterSchedulableEmployees(employees) {
  return employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => (!e.isAdmin && e.adminTier !== 'admin2') || e.showOnSchedule);
}

export function serializeEmployeeForApi(emp, overrides = {}) {
  const merged = { ...emp, ...overrides };
  return {
    ...merged,
    availability: typeof merged.availability === 'object' ? JSON.stringify(merged.availability) : merged.availability,
    defaultShift: merged.defaultShift && typeof merged.defaultShift === 'object'
      ? JSON.stringify(merged.defaultShift)
      : (merged.defaultShift || '')
  };
}
