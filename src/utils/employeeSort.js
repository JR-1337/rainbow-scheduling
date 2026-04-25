// Five-bucket display order for schedule renders (desktop admin grid,
// desktop employee view, mobile admin, mobile employee, PDF):
//   0 = Sarvi (pinned top)
//   1 = other admin1s (isAdmin && !isOwner && not Sarvi)
//   2 = admin2s (view-only, rendered with title instead of role)
//   3 = full-time non-admins
//   4 = part-time non-admins (rest)
// Alphabetical within each bucket. Dividers render on bucket transitions.

export const employeeBucket = (e) => {
  if ((e.name || '').toLowerCase() === 'sarvi') return 0;
  if (e.isAdmin) return 1;
  if (e.adminTier === 'admin2') return 2;
  if (e.employmentType === 'full-time') return 3;
  return 4;
};

export const sortBySarviAdminsFTPT = (employees) =>
  [...employees].sort((a, b) => {
    const ab = employeeBucket(a);
    const bb = employeeBucket(b);
    if (ab !== bb) return ab - bb;
    return a.name.localeCompare(b.name);
  });

// Set of indices where a divider should render (i.e. this row starts a new
// bucket and i > 0). Empty when no bucket change occurs across the list.
export const computeDividerIndices = (sortedEmployees) => {
  const set = new Set();
  for (let i = 1; i < sortedEmployees.length; i++) {
    if (employeeBucket(sortedEmployees[i]) !== employeeBucket(sortedEmployees[i - 1])) {
      set.add(i);
    }
  }
  return set;
};
