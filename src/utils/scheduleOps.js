import { getDayName, toDateKey, calculateHours } from './date';
import { STORE_HOURS } from './storeHours';

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
