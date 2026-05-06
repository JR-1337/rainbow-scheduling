import { SCHEDULE_ROW_FIRST_NAME_ORDER } from '../constants';
import { splitNameForSchedule } from './employeeRender';

/**
 * Schedule row order + divider groups (desktop admin/employee, mobile, PDF):
 * - Sort: Sarvi (first name) pinned, then SCHEDULE_ROW_FIRST_NAME_ORDER, then full-name A–Z.
 * - Dividers: transitions between display groups 0=Sarvi, 1=list names, 2=everyone else.
 *
 * employeeBucket is only for semantic presets (e.g. AutofillClearModal admin/FT/PT).
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

/** 0 Sarvi, 1 listed first names, 2 tail (alphabetical after list). */
export const scheduleDisplayDividerGroup = (e) => {
  if (isScheduleSarviPin(e)) return 0;
  const first = (splitNameForSchedule(e.name).first || '').toLowerCase();
  if (SCHEDULE_FIRST_NAME_RANK.has(first)) return 1;
  return 2;
};

export const sortSchedulableByHierarchy = (employees) =>
  [...employees].sort((a, b) => {
    const sa = isScheduleSarviPin(a);
    const sb = isScheduleSarviPin(b);
    if (sa !== sb) return sa ? -1 : 1;

    const fa = (splitNameForSchedule(a.name).first || '').toLowerCase();
    const fb = (splitNameForSchedule(b.name).first || '').toLowerCase();
    const ia = SCHEDULE_FIRST_NAME_RANK.get(fa);
    const ib = SCHEDULE_FIRST_NAME_RANK.get(fb);
    const listedA = ia !== undefined;
    const listedB = ib !== undefined;
    if (listedA !== listedB) return listedA ? -1 : 1;
    if (listedA && listedB && ia !== ib) return ia - ib;
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
