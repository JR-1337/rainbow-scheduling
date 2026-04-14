// S61 — Time interval math for Meetings + PK overlap-aware hours.
// Pure functions, no React/state deps. Times are "HH:MM" 24h strings.

export function parseHM(t) {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Merge an array of [{start, end}] (minute integers) into non-overlapping intervals.
export function mergeIntervals(intervals) {
  if (!intervals || intervals.length === 0) return [];
  const sorted = intervals
    .filter(iv => iv && iv.end > iv.start)
    .slice()
    .sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return [];
  const out = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

// Given a set of shift-like entries (each with startTime/endTime as "HH:MM"),
// return the union duration in decimal hours. Used so a 9-5 work + 3-5 pk = 8h, not 10h.
// Entries with unparseable start/end (missing, inverted, equal) fall back to their stored
// `hours` value and are summed in — preserves agreement with the no-events fast path for
// any stale row that only has pre-computed hours.
export function computeDayUnionHours(entries) {
  if (!entries || entries.length === 0) return 0;
  const good = [];
  let fallbackHours = 0;
  entries.forEach(e => {
    const start = parseHM(e.startTime);
    const end = parseHM(e.endTime);
    if (end > start) {
      good.push({ start, end });
    } else if (typeof e.hours === 'number' && e.hours > 0) {
      fallbackHours += e.hours;
    }
  });
  const merged = mergeIntervals(good);
  const totalMin = merged.reduce((sum, iv) => sum + (iv.end - iv.start), 0);
  return totalMin / 60 + fallbackHours;
}

// S62 — Does an employee's availability for the weekday of `dateStr` cover the
// [startHHMM, endHHMM] window? Used by the PK bulk modal to auto-check attendees.
// Returns { covers: bool, reason?: string }. Reasons are short human strings for
// the greyed-out row UI.
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export function availabilityCoversWindow(availability, dateStr, startHHMM, endHHMM) {
  if (!dateStr) return { covers: false, reason: 'no date' };
  const day = DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];
  const a = availability?.[day];
  if (!a || a.available === false) return { covers: false, reason: `unavailable ${day.slice(0,3)}` };
  if (!a.start || !a.end) return { covers: true };
  const aStart = parseHM(a.start);
  const aEnd = parseHM(a.end);
  const wStart = parseHM(startHHMM);
  const wEnd = parseHM(endHHMM);
  if (aStart <= wStart && aEnd >= wEnd) return { covers: true };
  return { covers: false, reason: `avail ${a.start}-${a.end} only` };
}

// Walk backward from `uptoDateStr` (YYYY-MM-DD) counting consecutive prior days
// (inclusive of uptoDate) on which the employee has a work-type shift. Used by
// the ShiftEditor consecutive-days advisory. ESA isn't enforced — informational only.
// `workShiftLookup(empId, dateStr)` should return truthy when a work shift exists.
export function computeConsecutiveWorkDayStreak(workShiftLookup, empId, uptoDateStr) {
  if (!uptoDateStr) return 0;
  let streak = 0;
  const cur = new Date(uptoDateStr + 'T12:00:00');
  for (let i = 0; i < 14; i++) { // cap at 14 to bound work
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    if (workShiftLookup(empId, key)) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
