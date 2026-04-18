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
