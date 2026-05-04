import { PAY_PERIOD_START, getPayPeriodDates, CURRENT_PERIOD_INDEX } from './payPeriod';

/**
 * v2.32.0: Mirror of backend canEditShiftDate_. Returns boolean.
 * Owner bypasses; everyone else gated by their pastPeriodGraceDays field.
 * Past period = period whose end date is before today.
 */
export function canEditShiftDate(currentUser, shiftDate, today = new Date()) {
  if (!currentUser || !shiftDate) return false;
  if (currentUser.isOwner === true) return true;

  const sd = shiftDate instanceof Date ? shiftDate : new Date(shiftDate);
  const td = today instanceof Date ? today : new Date(today);
  td.setHours(0, 0, 0, 0);
  sd.setHours(0, 0, 0, 0);

  const { startDate: currentStart } = getPayPeriodDates(CURRENT_PERIOD_INDEX);
  if (sd >= currentStart) return true;

  const grace = Number(currentUser.pastPeriodGraceDays) || 0;
  if (grace <= 0) return false;

  // Find the period the shift falls in, get its end, measure days.
  const msPerDay = 24 * 60 * 60 * 1000;
  const shiftDays = Math.floor((sd - PAY_PERIOD_START) / msPerDay);
  const shiftPeriodIndex = Math.floor(shiftDays / 14);
  const { endDate: shiftPeriodEnd } = getPayPeriodDates(shiftPeriodIndex);
  const daysSinceEnd = Math.floor((td - shiftPeriodEnd) / msPerDay);
  return daysSinceEnd <= grace;
}
