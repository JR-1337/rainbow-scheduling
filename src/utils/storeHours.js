// Store hours + statutory holiday constants and the pure isStatHoliday helper.
// Extracted from src/App.jsx as part of Phase E sub-area 4 (App.jsx extraction).
//
// Note: getStoreHoursForDate intentionally stays in App.jsx for now -- it
// closes over the module-level _storeHoursOverrides ref (audit item 6, parked
// refactor). When that gets a Context-based fix, getStoreHoursForDate moves here.

import { toDateKey } from './date';

export const STORE_HOURS = {
  sunday: { open: '11:00', close: '18:00' },
  monday: { open: '11:00', close: '18:00' },
  tuesday: { open: '11:00', close: '18:00' },
  wednesday: { open: '11:00', close: '18:00' },
  thursday: { open: '11:00', close: '19:00' },
  friday: { open: '11:00', close: '19:00' },
  saturday: { open: '11:00', close: '19:00' },
};

export const STAT_HOLIDAY_HOURS = { open: '12:00', close: '17:00' };

export const STAT_HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-16', '2026-04-03', '2026-05-18', '2026-07-01',
  '2026-08-03', '2026-09-07', '2026-10-12', '2026-12-25', '2026-12-26',
];

export const isStatHoliday = (date) => STAT_HOLIDAYS_2026.includes(toDateKey(date));
