// Sheets dates are YYYY-MM-DD; `new Date(str)` interprets as UTC, shifting to previous day in Ontario.
export const parseLocalDate = (str) => new Date(str + 'T12:00:00');

// Escape user-supplied strings before interpolating into HTML (PDF template).
export const escapeHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
