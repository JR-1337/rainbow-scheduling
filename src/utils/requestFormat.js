import { parseLocalDate } from './format';

/**
 * formatRequestDates — formats a comma-separated date string into a human-readable range.
 * e.g. "2026-04-27" → "Mon, Apr 27"
 * e.g. "2026-04-27,2026-04-28,2026-04-29" → "Apr 27–29 (3 days)"
 */
export const formatRequestDates = (datesStr) => {
  const dates = datesStr.split(',').sort();
  if (dates.length === 1) {
    const d = parseLocalDate(dates[0]);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const groups = [];
  let start = dates[0], end = dates[0];
  for (let i = 1; i < dates.length; i++) {
    const prev = parseLocalDate(end);
    const curr = parseLocalDate(dates[i]);
    if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
    else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
  }
  groups.push({ start, end });
  const fmt = (g) => {
    const s = parseLocalDate(g.start), e = parseLocalDate(g.end);
    if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };
  return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
};

/**
 * formatTimestamp — formats an ISO timestamp to a short locale string.
 * e.g. "2026-04-27T14:30:00Z" → "Apr 27, 2:30 PM"
 */
export const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

/**
 * getStatusLabel — maps a request status key to a display label.
 */
export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    denied: 'Denied',
    cancelled: 'Cancelled',
    revoked: 'Revoked'
  };
  return labels[status] || status;
};
