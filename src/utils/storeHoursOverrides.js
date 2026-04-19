import { toDateKey, getDayName } from './date';
import { STAT_HOLIDAY_HOURS, STORE_HOURS, isStatHoliday } from './storeHours';

// Module-level override refs (synced from App component state via setters).
// This avoids threading overrides as props through every child component.
// Parked sub-area 6: replace with Context-based provider.
let _storeHoursOverrides = {};
let _staffingTargetOverrides = {};

export const setStoreHoursOverrides = (next) => { _storeHoursOverrides = next || {}; };
export const setStaffingTargetOverrides = (next) => { _staffingTargetOverrides = next || {}; };
export const getStaffingTargetOverrides = () => _staffingTargetOverrides;

export const getStoreHoursForDate = (date) => {
  const dateStr = toDateKey(date);
  if (_storeHoursOverrides[dateStr]) return _storeHoursOverrides[dateStr];
  if (isStatHoliday(date)) return STAT_HOLIDAY_HOURS;
  return STORE_HOURS[getDayName(date)];
};
