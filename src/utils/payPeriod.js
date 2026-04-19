// Pay period anchor and derived helpers. Two-week (14-day) cadence anchored at
// 2026-01-26 (Monday). Local timezone deliberate — no UTC math here.

export const PAY_PERIOD_START = new Date(2026, 0, 26);

export const CURRENT_PERIOD_INDEX = (() => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate());
  return Math.max(0, Math.floor((today - start) / (14 * 24 * 60 * 60 * 1000)));
})();

export const getPayPeriodDates = (periodIndex) => {
  const startDate = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (periodIndex * 14));
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 13);
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    dates.push(d);
  }
  return { startDate, endDate, dates };
};
