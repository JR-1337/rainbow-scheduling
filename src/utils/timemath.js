// S61 — Time interval math for Meetings + PK overlap-aware hours.
// Pure functions, no React/state deps. Times are "HH:MM" 24h strings.

// Unpaid break rule keyed on gross shift length (all thresholds JR-confirmed):
//   0:00 – 4:00 → 0 min
//   4:01 – 5:00 → 20 min
//   5:01 – 6:00 → 30 min
//   6:01+       → 45 min
export const OVERTIME_THRESHOLDS = { CAP: 40, OVER_RED: 44 };

const BREAK_RULES = [
  { maxHours: 4.0,       breakMinutes: 0 },
  { maxHours: 5.0,       breakMinutes: 20 },
  { maxHours: 6.0,       breakMinutes: 30 },
  { maxHours: Infinity,  breakMinutes: 45 },
];

export function computeBreakMinutes(grossHours) {
  for (const rule of BREAK_RULES) {
    if (grossHours <= rule.maxHours) return rule.breakMinutes;
  }
  return 45;
}

// Returns net decimal hours for a single shift entry. Work shifts (type 'work'
// or undefined) have the unpaid break subtracted. Meetings, PK, sick, and other
// types return gross unchanged (short events, not "shifts" in the labour sense).
export function computeNetHoursForShift(shift) {
  if (!shift) return 0;
  const type = shift.type;
  // Only work shifts get break deducted; meetings, pk, sick, etc. pass through.
  if (type && type !== 'work') return shift.hours || 0;
  // Compute gross from times if available; fall back to stored .hours.
  let gross = 0;
  const start = parseHM(shift.startTime);
  const end = parseHM(shift.endTime);
  if (end > start) {
    gross = (end - start) / 60;
  } else if (typeof shift.hours === 'number' && shift.hours > 0) {
    gross = shift.hours;
  } else {
    return 0;
  }
  const breakMin = computeBreakMinutes(gross);
  return Math.max(0, gross - breakMin / 60);
}

function parseHM(t) {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Merge an array of [{start, end}] (minute integers) into non-overlapping intervals.
function mergeIntervals(intervals) {
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
  // Sick overrides the day: any sick entry zeros the total so rollups reflect
  // time actually worked. Work rows are removed when sick is saved; legacy
  // rows still zero out here until the next schedule save.
  if (entries.some(e => e && e.type === 'sick')) return 0;
  const good = [];
  let fallbackHours = 0;
  entries.forEach(e => {
    const start = parseHM(e.startTime);
    const end = parseHM(e.endTime);
    const isWorkEntry = !e.type || e.type === 'work';
    if (end > start) {
      // For work entries: shrink the window from the end by break minutes before
      // the union merge. This keeps the interval semantics intact for overlapping
      // meetings while deducting break from the work time.
      if (isWorkEntry) {
        const grossHours = (end - start) / 60;
        const breakMin = computeBreakMinutes(grossHours);
        const netEnd = Math.max(start, end - breakMin);
        good.push({ start, end: netEnd });
      } else {
        good.push({ start, end });
      }
    } else if (typeof e.hours === 'number' && e.hours > 0) {
      // Fallback path: no parseable times — subtract break for work entries.
      if (isWorkEntry) {
        const breakMin = computeBreakMinutes(e.hours);
        fallbackHours += Math.max(0, e.hours - breakMin / 60);
      } else {
        fallbackHours += e.hours;
      }
    }
  });
  const merged = mergeIntervals(good);
  const totalMin = merged.reduce((sum, iv) => sum + (iv.end - iv.start), 0);
  return totalMin / 60 + fallbackHours;
}

// S62 — Does an employee's availability for the weekday of `dateStr` cover the
// [startHHMM, endHHMM] window? Used by the PK bulk modal to auto-check attendees.
// JR clarified S62 2026-04-14: availability.<day>.start/end ARE real free/busy
// times for the staffer (overriding an earlier convention that called them
// "default work times" — that convention came from a Sarvi misunderstanding).
// Returns { eligible: bool, reason?: string } for the greyed-out row UI.
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export function availabilityCoversWindow(availability, dateStr, startHHMM, endHHMM) {
  if (!dateStr) return { eligible: false, reason: 'no date' };
  const day = DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];
  const a = availability?.[day];
  if (!a || a.available === false) return { eligible: false, reason: `unavailable ${day.slice(0,3)}` };
  if (!a.start || !a.end) return { eligible: true };
  const aStart = parseHM(a.start);
  const aEnd = parseHM(a.end);
  const wStart = parseHM(startHHMM);
  const wEnd = parseHM(endHHMM);
  if (aStart <= wStart && aEnd >= wEnd) return { eligible: true };
  return { eligible: false, reason: `avail ${a.start}-${a.end} only` };
}

// Walk backward from `uptoDateStr` (YYYY-MM-DD) counting consecutive prior days
// (inclusive of uptoDate) on which the employee has a work-type shift. Used by
// the ShiftEditor consecutive-days advisory. ESA isn't enforced — informational only.
// `workShiftLookup(empId, dateStr)` should return truthy when a work shift exists.
// Optional `sickLookup(empId, dateStr)` breaks the streak on a sick day — the
// employee wasn't actually at work, so the run resets.
export function computeConsecutiveWorkDayStreak(workShiftLookup, empId, uptoDateStr, sickLookup = null) {
  if (!uptoDateStr) return 0;
  let streak = 0;
  const cur = new Date(uptoDateStr + 'T12:00:00');
  for (let i = 0; i < 14; i++) { // cap at 14 to bound work
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    if (sickLookup && sickLookup(empId, key)) break;
    if (workShiftLookup(empId, key)) {
      streak += 1;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
