// Pure date and time helpers. No external state, no closures over module refs.

export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDayName = (date) => date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
export const getDayNameShort = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
export const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const formatDateLong = (date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
export const formatMonthWord = (date) => date.toLocaleDateString('en-US', { month: 'long' });

export const getWeekNumber = (date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.ceil((diff / 604800000) + 1);
};

export const parseTime = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export const formatTimeDisplay = (t) => { if (!t) return '--:--'; const [h, m] = t.split(':').map(Number); return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2, '0')}${h >= 12 ? 'PM' : 'AM'}`; };
export const formatTimeShort = (t) => { if (!t) return '--'; const [h, m] = t.split(':').map(Number); const hr = h > 12 ? h - 12 : h || 12; const mins = m ? `:${m.toString().padStart(2, '0')}` : ''; return `${hr}${mins}`; };
export const calculateHours = (s, e) => (parseTime(e) - parseTime(s)) / 60;
