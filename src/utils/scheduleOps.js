import { getDayName, toDateKey, calculateHours } from './date';
import { STORE_HOURS } from './storeHours';

export function collectPeriodShiftsForSave(dates, employees, shiftsObj, eventsObj) {
  const periodShifts = [];
  const periodDates = [];
  dates.forEach(date => {
    const dateStr = toDateKey(date);
    periodDates.push(dateStr);
    employees.forEach(emp => {
      const key = `${emp.id}-${dateStr}`;
      const workShift = shiftsObj[key];
      if (workShift) {
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
      (eventsObj[key] || []).forEach(ev => {
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
