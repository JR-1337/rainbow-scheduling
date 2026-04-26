import { getDayName, toDateKey, calculateHours } from './date';
import { DEFAULT_SHIFT } from './storeHours';

export function collectPeriodShiftsForSave(dates, employees, shiftsObj, eventsObj) {
  const periodShifts = [];
  const periodDates = [];
  dates.forEach(date => {
    const dateStr = toDateKey(date);
    periodDates.push(dateStr);
    employees.forEach(emp => {
      const key = `${emp.id}-${dateStr}`;
      const dayEvents = eventsObj[key] || [];
      const hasSick = dayEvents.some(e => e.type === 'sick');
      const workShift = shiftsObj[key];
      // Sick means not working that day — do not persist a work row alongside it
      // (cleans Sheet + backend consumers that only read type=work rows).
      if (workShift && !hasSick) {
        periodShifts.push({
          id: workShift.id || `shift-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email,
          date: dateStr,
          startTime: workShift.startTime,
          endTime: workShift.endTime,
          role: workShift.role || 'none',
          task: workShift.task || '',
          type: 'work',
          note: ''
        });
      }
      dayEvents.forEach(ev => {
        periodShifts.push({
          id: ev.id || `${(ev.type || 'evt').toUpperCase()}-${emp.id}-${dateStr}`,
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email,
          date: dateStr,
          startTime: ev.startTime,
          endTime: ev.endTime,
          role: ev.role || 'none',
          task: '',
          type: ev.type || 'meeting',
          note: ev.note || '',
          hours: typeof ev.hours === 'number' ? ev.hours : calculateHours(ev.startTime, ev.endTime)
        });
      });
    });
  });
  return { periodShifts, periodDates };
}

export function transferShiftBetweenEmployees(shiftsObj, fromEmp, toEmp, dateStr) {
  const fromKey = `${fromEmp.id}-${dateStr}`;
  const sourceShift = shiftsObj[fromKey];
  if (!sourceShift) return shiftsObj;
  const next = { ...shiftsObj };
  delete next[fromKey];
  next[`${toEmp.id}-${dateStr}`] = { ...sourceShift, employeeId: toEmp.id, employeeName: toEmp.name };
  return next;
}

export function swapShiftsBetweenEmployees(shiftsObj, empA, empB, dateA, dateB) {
  const keyA = `${empA.id}-${dateA}`;
  const keyB = `${empB.id}-${dateB}`;
  const shiftA = shiftsObj[keyA];
  const shiftB = shiftsObj[keyB];
  const next = { ...shiftsObj };
  delete next[keyA];
  delete next[keyB];
  if (shiftA) next[`${empB.id}-${dateA}`] = { ...shiftA, employeeId: empB.id, employeeName: empB.name };
  if (shiftB) next[`${empA.id}-${dateB}`] = { ...shiftB, employeeId: empA.id, employeeName: empA.name };
  return next;
}

// Meeting allows N per (empId, date) — keyed by row id (matches backend keyOf
// at Code.gs:1801). PK and sick remain singular: the type-replace branch
// preserves the prior invariant that one PK / one sick mark exists per day.
// Work stays in shiftsObj (scalar). Mutation contract: caller passes `s.id`
// for meeting; an id-less meeting (legacy or modal bug) appends a fresh row
// rather than colliding with an existing one.
const MULTI_TYPES = new Set(['meeting']);

export function applyShiftMutation(shiftsObj, eventsObj, s) {
  const k = `${s.employeeId}-${s.date}`;
  const type = s.type || 'work';
  const label = type === 'meeting' ? 'Meeting'
    : type === 'pk' ? 'PK event'
    : type === 'sick' ? 'Sick day'
    : 'Shift';
  const touched = type === 'work' ? 'shifts' : 'events';
  let nextShifts = shiftsObj;
  let nextEvents = eventsObj;

  if (type === 'work') {
    nextShifts = { ...shiftsObj };
    if (s.deleted) delete nextShifts[k];
    else nextShifts[k] = s;
  } else if (MULTI_TYPES.has(type)) {
    nextEvents = { ...eventsObj };
    const arr = (nextEvents[k] || []).slice();
    const matchIdx = s.id != null
      ? arr.findIndex(e => String(e.id) === String(s.id))
      : -1;
    if (s.deleted) {
      if (matchIdx >= 0) arr.splice(matchIdx, 1);
      if (arr.length > 0) nextEvents[k] = arr; else delete nextEvents[k];
    } else if (matchIdx >= 0) {
      arr[matchIdx] = { ...arr[matchIdx], ...s };
      nextEvents[k] = arr;
    } else {
      arr.push(s);
      nextEvents[k] = arr;
    }
  } else {
    // pk, sick — singular per (empId, date, type). Type-replace branch.
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

  let fbStart, fbEnd;
  if (ds && ds.start && ds.end) {
    fbStart = ds.start;
    fbEnd = ds.end;
  } else {
    fbStart = DEFAULT_SHIFT[dayName].start;
    fbEnd = DEFAULT_SHIFT[dayName].end;
  }

  const startTime = avail.start && avail.start > fbStart ? avail.start : fbStart;
  const endTime = avail.end && avail.end < fbEnd ? avail.end : fbEnd;

  if (startTime >= endTime) return null;

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
