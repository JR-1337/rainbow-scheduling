import { OVERTIME_THRESHOLDS, PART_TIME_WEEKLY_CAP } from './timemath';

// Pure violation evaluator for a single (employee, date) pair.
// Caller passes pre-computed weekHours + currentStreak so this stays pure.
// Returns array of { rule, severity, detail } — empty when clean.
export function computeViolations({ employee, dateStr, weekHours, currentStreak, hasApprovedTimeOff, availability }) {
  const out = [];
  if (currentStreak >= 6) {
    out.push({
      rule: 'consecutive',
      severity: 'warn',
      detail: `${employee.name} on ${currentStreak === 6 ? '6th' : currentStreak + 'th'} consecutive work day`,
    });
  }
  if (weekHours >= OVERTIME_THRESHOLDS.OVER_RED) {
    out.push({
      rule: 'weeklyOver',
      severity: 'error',
      detail: `Weekly net ${weekHours.toFixed(1)}h exceeds ESA 44h`,
    });
  } else if (weekHours > OVERTIME_THRESHOLDS.CAP) {
    out.push({
      rule: 'weeklyOver',
      severity: 'warn',
      detail: `Weekly net ${weekHours.toFixed(1)}h over 40h cap`,
    });
  }
  if (employee.employmentType === 'part-time' && weekHours > PART_TIME_WEEKLY_CAP) {
    out.push({
      rule: 'partTimeCap',
      severity: 'warn',
      detail: `Part-time weekly ${weekHours.toFixed(1)}h over ${PART_TIME_WEEKLY_CAP}h cap`,
    });
  }
  if (hasApprovedTimeOff) {
    out.push({
      rule: 'approvedTimeOff',
      severity: 'warn',
      detail: 'Has approved time off for this date',
    });
  }
  if (availability && availability.available === false) {
    out.push({
      rule: 'unavailable',
      severity: 'warn',
      detail: 'Marked unavailable on this weekday',
    });
  }
  return out;
}
