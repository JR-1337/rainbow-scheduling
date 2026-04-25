// Admins (Tier 1) and Admin 2 render their freeform `title` in place of a
// defaultSection role across cells, PDFs, modal pickers, tooltips, and the
// employee self-view. Single source of truth so render branches stay aligned.
export const hasTitle = (emp) => !!emp && (emp.isAdmin || emp.adminTier === 'admin2');
