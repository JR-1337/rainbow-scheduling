import { SCHEDULE_ROW_FIRST_NAME_ORDER } from '../constants';
import { splitNameForSchedule } from './employeeRender';

/**
 * Schedule row order + divider groups (desktop admin/employee, mobile, PDF).
 *
 * Three visual buckets, two dividers:
 *   0 Sarvi (pinned)
 *   1 Admin: isAdmin OR adminTier='admin2' OR isOwner. employmentType is ignored.
 *   2 Employee: everyone else schedulable, alphabetical.
 *
 * Inside the admin bucket, rows sort by SCHEDULE_ROW_FIRST_NAME_ORDER index, then
 * full-name A–Z (any admin not in the list lands at the alpha tail of the bucket).
 * The employee bucket is pure A–Z.
 *
 * employeeBucket below is a separate concern — it powers AutofillClearModal's
 * preset selection and keeps its current 5-value Sarvi/admin1/admin2/FT/PT shape.
 */

const SCHEDULE_FIRST_NAME_RANK = new Map(
  SCHEDULE_ROW_FIRST_NAME_ORDER.map((name, i) => [name.toLowerCase(), i]),
);

/** Semantic buckets for Autofill presets — admin vs FT vs PT — not used for schedule row order. */
export const employeeBucket = (e) => {
  if ((e.name || '').toLowerCase() === 'sarvi') return 0;
  if (e.isAdmin) return 1;
  if (e.adminTier === 'admin2') return 2;
  if (e.employmentType === 'full-time') return 3;
  return 4;
};

export const isScheduleSarviPin = (e) =>
  (splitNameForSchedule(e.name).first || '').toLowerCase() === 'sarvi';

/** Schedule sort + divider bucket. 0=Sarvi, 1=Admin, 2=Employee. */
const scheduleBucket = (e) => {
  if (isScheduleSarviPin(e)) return 0;
  if (e.isAdmin || e.adminTier === 'admin2' || e.isOwner) return 1;
  return 2;
};

export const scheduleDisplayDividerGroup = scheduleBucket;

export const sortSchedulableByHierarchy = (employees) =>
  [...employees].sort((a, b) => {
    const ba = scheduleBucket(a);
    const bb = scheduleBucket(b);
    if (ba !== bb) return ba - bb;
    if (ba === 1) {
      const fa = (splitNameForSchedule(a.name).first || '').toLowerCase();
      const fb = (splitNameForSchedule(b.name).first || '').toLowerCase();
      const ra = SCHEDULE_FIRST_NAME_RANK.get(fa) ?? Infinity;
      const rb = SCHEDULE_FIRST_NAME_RANK.get(fb) ?? Infinity;
      if (ra !== rb) return ra - rb;
    }
    return a.name.localeCompare(b.name);
  });

/** Indices where a divider should render before this row (i > 0). */
export const computeScheduleDividerIndices = (sortedEmployees) => {
  const set = new Set();
  for (let i = 1; i < sortedEmployees.length; i++) {
    if (scheduleDisplayDividerGroup(sortedEmployees[i]) !== scheduleDisplayDividerGroup(sortedEmployees[i - 1])) {
      set.add(i);
    }
  }
  return set;
};

export const countScheduleDisplayDividers = (list) => {
  let n = 0;
  for (let i = 1; i < list.length; i++) {
    if (scheduleDisplayDividerGroup(list[i]) !== scheduleDisplayDividerGroup(list[i - 1])) n++;
  }
  return n;
};
