import { getDayName, toDateKey, calculateHours } from './date';
import { STORE_HOURS } from './storeHours';

export function applyShiftMutation(shiftsObj, eventsObj, s) {
  const k = `${s.employeeId}-${s.date}`;
  const type = s.type || 'work';
  const label = type === 'meeting' ? 'Meeting' : type === 'pk' ? 'PK event' : 'Shift';
  const touched = type === 'work' ? 'shifts' : 'events';
  let nextShifts = shiftsObj;
  let nextEvents = eventsObj;

  if (type === 'work') {
    nextShifts = { ...shiftsObj };
    if (s.deleted) delete nextShifts[k];
    else nextShifts[k] = s;
  } else {
    nextEvents = { ...eventsObj };
    const arr = (nextEvents[k] || []).filter(e => (e.type || 'work') !== type);
    if (s.deleted) {
      if (arr.length > 0) nextEvents[k] = arr; else delete nextEvents[k];
    } else {
      arr.push(s);
      nextEvents[k] = arr;
    }
  }
  return { nextShifts, nextEvents, label, deleted: !!s.deleted, touched };
}

export function createShiftFromAvailability(employee, date) {
  const dayName = getDayName(date).toLowerCase();
  const avail = employee.availability?.[dayName];
  if (!avail || !avail.available) return null;

  const ds = employee.defaultShift?.[dayName];
  const dsStart = ds && ds.start ? ds.start : null;
  const dsEnd = ds && ds.end ? ds.end : null;

  const startTime = dsStart || avail.start || STORE_HOURS[dayName].open;
  const endTime = dsEnd || avail.end || STORE_HOURS[dayName].close;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    date: toDateKey(date),
    startTime,
    endTime,
    role: employee.defaultSection || 'none',
    task: '',
    type: 'work',
    note: '',
    hours: calculateHours(startTime, endTime)
  };
}
