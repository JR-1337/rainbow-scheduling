// Meeting default locked to 14:00-16:00 across all days.
export const MEETING_DEFAULT_TIMES = { start: '14:00', end: '16:00' };

// PK defaults: Saturday is a pre-open briefing (10:00-10:45); other days are
// post-close training blocks (18:00-20:00). Accept either a Date or YYYY-MM-DD
// string; parse as local wall-clock so ISO dates don't drift across timezones.
export const getPKDefaultTimes = (dateInput) => {
  let day;
  if (dateInput instanceof Date) {
    day = dateInput.getDay();
  } else if (typeof dateInput === 'string' && dateInput.length >= 10) {
    const [y, m, d] = dateInput.slice(0, 10).split('-').map(Number);
    day = new Date(y, m - 1, d).getDay();
  } else {
    day = new Date().getDay();
  }
  if (day === 6) return { start: '10:00', end: '10:45' };
  return { start: '18:00', end: '20:00' };
};

// Sick defaults mirror the employee's work shift on the same date (99% case:
// admin marks sick on a day the employee was already scheduled). Returns null
// when no existing shift — the caller falls back to its own weekday default.
export const getSickDefaultTimes = (_dateInput, existingShift = null) => {
  if (existingShift?.startTime && existingShift?.endTime) {
    return { start: existingShift.startTime, end: existingShift.endTime };
  }
  return null;
};
