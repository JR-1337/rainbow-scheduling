// Admins (Tier 1) and Admin 2 render their freeform `title` in place of a
// defaultSection role across cells, PDFs, modal pickers, tooltips, and the
// employee self-view. Single source of truth so render branches stay aligned.
export const hasTitle = (emp) => !!emp && (emp.isAdmin || emp.adminTier === 'admin2');

/** First word + remaining words; same split as mobile frozen name column (2-line layout). */
export const splitNameForSchedule = (name) => {
  const s = (name || '').trim();
  if (!s) return { first: '', rest: '' };
  const parts = s.split(/\s+/);
  return { first: parts[0], rest: parts.slice(1).join(' ') };
};
