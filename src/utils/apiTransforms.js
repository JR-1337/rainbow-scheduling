import { toDateKey, calculateHours } from './date';

const DEFAULT_AVAILABILITY = {
  sunday:    { available: true, start: '06:00', end: '22:00' },
  monday:    { available: true, start: '06:00', end: '22:00' },
  tuesday:   { available: true, start: '06:00', end: '22:00' },
  wednesday: { available: true, start: '06:00', end: '22:00' },
  thursday:  { available: true, start: '06:00', end: '22:00' },
  friday:    { available: true, start: '06:00', end: '22:00' },
  saturday:  { available: true, start: '06:00', end: '22:00' }
};

function ensureFullWeek(av) {
  if (!av || typeof av !== 'object') return { ...DEFAULT_AVAILABILITY };
  const out = { ...DEFAULT_AVAILABILITY };
  for (const day of Object.keys(DEFAULT_AVAILABILITY)) {
    if (av[day] && typeof av[day] === 'object') out[day] = av[day];
  }
  return out;
}

function safeJsonParse(val) {
  if (typeof val !== 'string' || !val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

// Sheet boolean cells return native true/false when typed as a checkbox,
// but plain-text "TRUE"/"FALSE" cells leak through as strings. JS treats any
// non-empty string as truthy, so an isOwner cell typed as "FALSE" would read
// as truthy and bypass owner-exclusion filters. Normalize at the boundary.
const BOOL_FIELDS = ['active', 'isAdmin', 'isOwner', 'showOnSchedule', 'deleted', 'passwordChanged'];
const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return !!v;
};

export function parseEmployeesFromApi(empData) {
  return (empData || []).map(emp => {
    const normalized = { ...emp };
    BOOL_FIELDS.forEach(f => { normalized[f] = toBool(emp[f]); });
    return {
      ...normalized,
      availability: ensureFullWeek(
        typeof emp.availability === 'string' ? safeJsonParse(emp.availability) : emp.availability
      ),
      defaultShift: typeof emp.defaultShift === 'string' && emp.defaultShift
        ? safeJsonParse(emp.defaultShift)
        : (emp.defaultShift && typeof emp.defaultShift === 'object' ? emp.defaultShift : null),
      adminTier: typeof emp.adminTier === 'string' ? emp.adminTier : '',
      title: typeof emp.title === 'string' ? emp.title : ''
    };
  });
}

function stripIsoDate(str) {
  return (str && typeof str === 'string' && str.includes('T')) ? str.split('T')[0] : str;
}

function stripIsoTime(str) {
  if (!str || typeof str !== 'string' || !str.includes('T')) return str;
  const timePart = str.split('T')[1];
  return timePart ? timePart.substring(0, 5) : str;
}

export function partitionShiftsAndEvents(shiftData) {
  const shiftsObj = {};
  const eventsObj = {};
  (shiftData || []).forEach(shift => {
    const dateStr = stripIsoDate(shift.date);
    const startTime = stripIsoTime(shift.startTime);
    const endTime = stripIsoTime(shift.endTime);
    const fixedShift = {
      ...shift,
      date: dateStr,
      startTime,
      endTime,
      hours: calculateHours(startTime, endTime)
    };
    const key = `${fixedShift.employeeId}-${dateStr}`;
    const shiftType = fixedShift.type || 'work';
    if (shiftType === 'work') {
      shiftsObj[key] = fixedShift;
    } else {
      (eventsObj[key] = eventsObj[key] || []).push(fixedShift);
    }
  });
  return { shiftsObj, eventsObj };
}

export function filterToLivePeriods(shiftsObj, eventsObj, livePeriods, payPeriodStart) {
  const editModeObj = {};
  const publishedShifts = {};
  const publishedEvents = {};
  if (!livePeriods || !Array.isArray(livePeriods) || livePeriods.length === 0) {
    return { publishedShifts, publishedEvents, editModeObj };
  }
  const liveDates = new Set();
  livePeriods.forEach(pIndex => {
    editModeObj[pIndex] = false;
    const pStart = new Date(payPeriodStart.getFullYear(), payPeriodStart.getMonth(), payPeriodStart.getDate() + (pIndex * 14));
    for (let d = 0; d < 14; d++) {
      const dt = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate() + d);
      liveDates.add(toDateKey(dt));
    }
  });
  Object.entries(shiftsObj).forEach(([key, shift]) => {
    const dateStr = shift.date || key.split('-').slice(-3).join('-');
    if (liveDates.has(dateStr)) publishedShifts[key] = shift;
  });
  Object.entries(eventsObj).forEach(([key, arr]) => {
    const firstDate = (arr && arr[0] && arr[0].date) || key.split('-').slice(-3).join('-');
    if (liveDates.has(firstDate)) publishedEvents[key] = arr;
  });
  return { publishedShifts, publishedEvents, editModeObj };
}

export function partitionRequests(requests) {
  const list = requests || [];
  const timeOff = list.filter(r => r.requestType === 'time_off').map(r => ({
    ...r,
    name: r.employeeName || r.name,
    email: r.employeeEmail || r.email
  }));
  const offers = list.filter(r => r.requestType === 'shift_offer').map(o => ({
    ...o,
    offerId: o.requestId || o.offerId,
    offererName: o.employeeName || o.offererName,
    offererEmail: o.employeeEmail || o.offererEmail
  }));
  const swaps = list.filter(r => r.requestType === 'shift_swap').map(s => ({
    ...s,
    swapId: s.requestId || s.swapId,
    initiatorName: s.employeeName || s.initiatorName,
    initiatorEmail: s.employeeEmail || s.initiatorEmail
  }));
  return { timeOff, offers, swaps };
}

export function normalizeAnnouncements(loaded) {
  const out = {};
  if (!loaded || !Array.isArray(loaded)) return out;
  loaded.forEach(ann => {
    const dateKey = ann.periodStartDate ? String(ann.periodStartDate).split('T')[0] : null;
    if (dateKey) {
      out[dateKey] = {
        id: ann.id,
        periodStartDate: dateKey,
        subject: ann.subject || '',
        message: ann.message || '',
        updatedAt: ann.updatedAt
      };
    }
  });
  return out;
}
