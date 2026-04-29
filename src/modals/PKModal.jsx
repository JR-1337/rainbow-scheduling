import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Trash2, Check, Users, ChevronRight } from 'lucide-react';
import { AdaptiveModal } from '../components/AdaptiveModal';
import { TimePicker } from '../components/primitives';
import { toDateKey, formatTimeShort } from '../utils/date';
import { THEME } from '../theme';
import { availabilityCoversWindow } from '../utils/timemath';
import { getPKDefaultTimes } from '../utils/eventDefaults';

// OTR brand purple — fixed PK identity color. THEME.accent.purple is the daily
// rotating accent's dark variant, not the brand purple, so it cannot be used here.
const PK_PURPLE = '#932378';

// Unified PK modal — CREATE and REMOVE modes in AutofillClearModal design language.
// CREATE: port of PKEventModal (date+time pickers, FT/PT grouped employee list).
// REMOVE: per-day-expand over visible week with day-level + per-booking checkboxes.
// onConfirm({ mode, date, startTime, endTime, note, addIds, removeBookings }) => void
export const PKModal = ({
  isOpen,
  onClose,
  onConfirm,
  employees,
  events = {},
  activeWeek,
  week1,
  week2,
}) => {
  const today = toDateKey(new Date());

  // ── Shared state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('create');

  // ── CREATE state ──────────────────────────────────────────────────────────
  const [date, setDate] = useState(today);
  const [start, setStart] = useState(() => getPKDefaultTimes(today).start);
  const [end, setEnd] = useState(() => getPKDefaultTimes(today).end);
  const [note, setNote] = useState('');
  const [overrides, setOverrides] = useState({});
  const [timesUserSet, setTimesUserSet] = useState(false);

  // ── REMOVE state ──────────────────────────────────────────────────────────
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [removeBookings, setRemoveBookings] = useState(new Set());

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    // Reset mode
    setMode('create');
    // Reset CREATE
    const d = toDateKey(new Date());
    const def = getPKDefaultTimes(d);
    setDate(d);
    setStart(def.start);
    setEnd(def.end);
    setNote('');
    setOverrides({});
    setTimesUserSet(false);
    // Reset REMOVE
    setExpandedDates(new Set());
    setRemoveBookings(new Set());
  }, [isOpen]);

  // ── CREATE: day-of-week default on date change (unless user set times) ────
  useEffect(() => {
    if (!timesUserSet) {
      const def = getPKDefaultTimes(date);
      setStart(def.start);
      setEnd(def.end);
    }
  }, [date, timesUserSet]);

  // Reset overrides when date/time changes (port PKEventModal:70)
  useEffect(() => { setOverrides({}); }, [date, start, end]);

  // ── CREATE: existing PK bookings at selected slot ─────────────────────────
  const existingPKBookedIds = useMemo(() => {
    const set = new Set();
    let existingNote = null;
    Object.values(events || {}).forEach(arr => {
      (arr || []).forEach(ev => {
        if (ev.type === 'pk' && ev.date === date && ev.startTime === start && ev.endTime === end) {
          set.add(String(ev.employeeId));
          if (existingNote === null && ev.note) existingNote = ev.note;
        }
      });
    });
    return { ids: set, note: existingNote };
  }, [events, date, start, end]);

  const isEditMode = existingPKBookedIds.ids.size > 0;

  // Prefill note in edit mode (one-shot per slot change). `note` intentionally
  // excluded from deps via the !note guard — including it would re-fire on every keystroke.
  useEffect(() => {
    if (isEditMode && existingPKBookedIds.note && !note) setNote(existingPKBookedIds.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingPKBookedIds.note]);

  // ── CREATE: candidates list ───────────────────────────────────────────────
  const candidates = useMemo(() => {
    const active = (employees || []).filter(e => e.active && !e.deleted && !e.isOwner);
    return active.map(e => {
      const check = availabilityCoversWindow(e.availability, date, start, end);
      const wasBooked = existingPKBookedIds.ids.has(String(e.id));
      const defaultChecked = isEditMode ? wasBooked : check.eligible;
      const checked = overrides[e.id] !== undefined ? overrides[e.id] : defaultChecked;
      return { ...e, eligible: check.eligible, reason: check.reason, checked, wasBooked };
    }).sort((a, b) => {
      const aFt = a.type === 'full' ? 0 : 1;
      const bFt = b.type === 'full' ? 0 : 1;
      if (aFt !== bFt) return aFt - bFt;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [employees, date, start, end, overrides, isEditMode, existingPKBookedIds.ids]);

  const fullTimers = candidates.filter(c => c.type === 'full');
  const partTimers = candidates.filter(c => c.type !== 'full');
  const checkedCount = candidates.filter(c => c.checked).length;
  const eligibleCount = candidates.filter(c => c.eligible).length;
  const addIds = candidates.filter(c => c.checked && !c.wasBooked).map(c => c.id);
  const removeIds = candidates.filter(c => !c.checked && c.wasBooked).map(c => c.id);
  const isDirty = addIds.length > 0 || removeIds.length > 0;

  const toggle = (id, nextChecked) => setOverrides(prev => ({ ...prev, [id]: nextChecked }));

  const selectAllEligible = () => {
    setOverrides(prev => {
      const next = { ...prev };
      candidates.forEach(c => { if (c.eligible) next[c.id] = true; });
      return next;
    });
  };

  const clearAll = () => {
    const next = {};
    candidates.forEach(c => { next[c.id] = false; });
    setOverrides(next);
  };

  // Saturday quick-pick
  const weekDates = activeWeek === 1 ? week1 : activeWeek === 2 ? week2 : null;
  const saturdayDate = weekDates?.find(d => d instanceof Date && d.getDay() === 6);
  const saturdayKey = saturdayDate ? toDateKey(saturdayDate) : null;
  const isSaturdayActive = !!saturdayKey && date === saturdayKey && start === '10:00' && end === '10:45';

  const handleSaturdayQuickPick = () => {
    if (!saturdayDate) return;
    if (isSaturdayActive) {
      const t = toDateKey(new Date());
      const def = getPKDefaultTimes(t);
      setDate(t);
      setStart(def.start);
      setEnd(def.end);
      setTimesUserSet(false);
    } else {
      setDate(saturdayKey);
      setStart('10:00');
      setEnd('10:45');
      setTimesUserSet(false);
    }
  };

  // ── REMOVE: compute PK bookings per date in visible week ─────────────────
  const weekPKByDate = useMemo(() => {
    if (!weekDates) return [];
    const result = [];
    for (const d of weekDates) {
      const dateKey = toDateKey(d);
      const bookings = [];
      for (const emp of (employees || [])) {
        if (!emp.active || emp.deleted) continue;
        const list = events[`${emp.id}-${dateKey}`] || [];
        for (const ev of list) {
          if (ev.type === 'pk') {
            bookings.push({
              empId: String(ev.employeeId),
              empName: emp.name || ev.employeeName || String(ev.employeeId),
              startTime: ev.startTime,
              endTime: ev.endTime,
              note: ev.note || '',
            });
          }
        }
      }
      if (bookings.length === 0) continue;
      // Sort: time ascending then name
      bookings.sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
        return (a.empName || '').localeCompare(b.empName || '');
      });
      // Format date label e.g. "Sat May 9"
      const label = d instanceof Date
        ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : dateKey;
      result.push({ dateKey, dateLabel: label, bookings });
    }
    return result;
  }, [events, weekDates, employees]);

  // REMOVE: toggle expand for a date
  const toggleExpand = (dateKey) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  // REMOVE: build key for a booking
  const bookingKey = (empId, dk, startTime, endTime) => `${empId}|${dk}|${startTime}|${endTime}`;

  // REMOVE: toggle all bookings under a date
  const toggleDateBookings = (dateKey, bookings) => {
    setRemoveBookings(prev => {
      const next = new Set(prev);
      const allKeys = bookings.map(b => bookingKey(b.empId, dateKey, b.startTime, b.endTime));
      const allOn = allKeys.every(k => next.has(k));
      if (allOn) allKeys.forEach(k => next.delete(k));
      else allKeys.forEach(k => next.add(k));
      return next;
    });
  };

  // REMOVE: toggle single booking
  const toggleBooking = (empId, dateKey, startTime, endTime) => {
    const k = bookingKey(empId, dateKey, startTime, endTime);
    setRemoveBookings(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  // ── Confirm handlers ──────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (mode === 'create') {
      if (!isDirty) return;
      onConfirm({
        mode: 'create',
        date,
        startTime: start,
        endTime: end,
        note: note.trim(),
        addIds,
        removeBookings: removeIds.map(empId => ({ empId, date, startTime: start, endTime: end })),
      });
    } else {
      if (removeBookings.size === 0) return;
      onConfirm({
        mode: 'remove',
        removeBookings: Array.from(removeBookings).map(key => {
          const [empId, bDate, startTime, endTime] = key.split('|');
          return { empId, date: bDate, startTime, endTime };
        }),
      });
    }
  };

  // ── Derived UI vars ───────────────────────────────────────────────────────
  const isCreate = mode === 'create';
  const confirmBg = isCreate ? THEME.accent.purple : THEME.status.error;

  const createConfirmDisabled = !isDirty;
  const removeConfirmDisabled = removeBookings.size === 0;
  const confirmDisabled = isCreate ? createConfirmDisabled : removeConfirmDisabled;

  const removeCount = removeBookings.size;
  const confirmLabel = isCreate
    ? (isEditMode
        ? (isDirty
            ? `Save (${addIds.length > 0 ? `+${addIds.length}` : ''}${addIds.length > 0 && removeIds.length > 0 ? ' ' : ''}${removeIds.length > 0 ? `-${removeIds.length}` : ''})`
            : 'Save')
        : `Schedule for ${checkedCount}`)
    : `Remove ${removeCount} booking${removeCount === 1 ? '' : 's'}`;

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderGroup = (label, group) => group.length === 0 ? null : (
    <div className="mb-2">
      <div className="text-xs font-semibold mb-1 px-1" style={{ color: THEME.text.secondary }}>
        {label} ({group.length})
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${THEME.border.default}` }}>
        {group.map((c, idx) => (
          <div
            key={c.id}
            role="checkbox"
            aria-checked={c.checked}
            tabIndex={0}
            onClick={() => toggle(c.id, !c.checked)}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(c.id, !c.checked); } }}
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs select-none"
            style={{
              backgroundColor: idx % 2 === 0 ? THEME.bg.elevated : THEME.bg.secondary,
              borderTop: idx === 0 ? 'none' : `1px solid ${THEME.border.subtle}`,
              opacity: c.eligible ? 1 : 0.55,
            }}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: c.checked ? PK_PURPLE : THEME.bg.elevated,
                border: `2px solid ${c.checked ? PK_PURPLE : THEME.border.default}`,
              }}
            >
              {c.checked && <Check size={10} color="white" />}
            </div>
            <span className="flex-1 truncate" style={{ color: THEME.text.primary }}>{c.name}</span>
            {!c.eligible && (
              <span className="text-xs italic flex-shrink-0" style={{ color: THEME.text.muted }}>{c.reason}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Product Knowledge"
    >
      <div className="flex flex-col gap-3" style={{ minWidth: 280 }}>

        {/* Mode toggle — segmented pill control */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${THEME.border.default}` }}>
          <button
            type="button"
            onClick={() => setMode('create')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: isCreate ? PK_PURPLE + '30' : THEME.bg.elevated,
              color: isCreate ? PK_PURPLE : THEME.text.muted,
              borderRight: `1px solid ${THEME.border.default}`,
            }}
            aria-pressed={isCreate}
          >
            <Calendar size={13} />
            CREATE
          </button>
          <button
            type="button"
            onClick={() => setMode('remove')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: !isCreate ? THEME.status.error + '20' : THEME.bg.elevated,
              color: !isCreate ? THEME.status.error : THEME.text.muted,
            }}
            aria-pressed={!isCreate}
          >
            <Trash2 size={13} />
            REMOVE
          </button>
        </div>

        {/* ── CREATE mode body ─────────────────────────────────────────────── */}
        {isCreate && (
          <>
            {/* Date + time row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-1">
              <div>
                <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Date</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
              <TimePicker value={start} onChange={(v) => { setStart(v); setTimesUserSet(true); }} label="Start" />
              <TimePicker value={end} onChange={(v) => { setEnd(v); setTimesUserSet(true); }} label="End" />
            </div>

            {/* Saturday quick-pick */}
            {saturdayDate && (
              <div className="mb-1">
                <button
                  type="button"
                  onClick={handleSaturdayQuickPick}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-all hover:opacity-90"
                  style={{
                    backgroundColor: isSaturdayActive ? PK_PURPLE : THEME.event.pkBg,
                    color: isSaturdayActive ? '#FFFFFF' : THEME.event.pkText,
                    border: `1px solid ${isSaturdayActive ? PK_PURPLE : THEME.event.pkBorder}`,
                    boxShadow: isSaturdayActive ? `0 0 0 2px ${PK_PURPLE}33` : 'none',
                  }}
                  title={isSaturdayActive
                    ? 'Saturday selected — tap to revert to default day'
                    : "Jump to this week's Saturday at the 10:00-10:45 pre-open window"}
                >
                  {isSaturdayActive ? '✓' : '📅'} Saturday ({toDateKey(saturdayDate).slice(5)}) · 10:00–10:45
                </button>
              </div>
            )}

            {/* Note */}
            <div className="mb-1">
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Spring denim line"
                className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
                style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>

            {/* Attendee controls */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: THEME.text.secondary }}>
                <Users size={12} />
                <span>{checkedCount} of {candidates.length} attending</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={selectAllEligible}
                  disabled={eligibleCount === 0}
                  title={eligibleCount === 0 ? 'No one is eligible for this date/time — check each person manually or widen the window' : undefined}
                  className="px-2 py-0.5 rounded text-xs hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                >
                  Select eligible ({eligibleCount})
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-2 py-0.5 rounded text-xs hover:opacity-80"
                  style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* FT / PT grouped employee list */}
            {renderGroup('Full-Time', fullTimers)}
            {renderGroup('Part-Time', partTimers)}
          </>
        )}

        {/* ── REMOVE mode body ─────────────────────────────────────────────── */}
        {!isCreate && (
          <>
            {!weekDates ? (
              <div className="text-sm text-center py-6" style={{ color: THEME.text.muted }}>
                No week loaded
              </div>
            ) : weekPKByDate.length === 0 ? (
              <div className="text-sm text-center py-6" style={{ color: THEME.text.muted }}>
                No PK bookings in this week
              </div>
            ) : (
              <div
                className="overflow-y-auto rounded-lg"
                style={{
                  maxHeight: 320,
                  border: `1px solid ${THEME.border.default}`,
                  backgroundColor: THEME.bg.elevated,
                }}
              >
                {weekPKByDate.map(({ dateKey, dateLabel, bookings }) => {
                  const expanded = expandedDates.has(dateKey);
                  const allKeys = bookings.map(b => bookingKey(b.empId, dateKey, b.startTime, b.endTime));
                  const checkedKeys = allKeys.filter(k => removeBookings.has(k));
                  const allChecked = checkedKeys.length === allKeys.length;
                  const noneChecked = checkedKeys.length === 0;
                  // indeterminate = mixed (some but not all)
                  const indeterminate = !allChecked && !noneChecked;

                  return (
                    <div key={dateKey} style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
                      {/* Date row */}
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        aria-label={`${dateLabel}, ${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none hover:opacity-80"
                        onClick={() => toggleExpand(dateKey)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(dateKey); } }}
                        style={{ backgroundColor: THEME.bg.elevated }}
                      >
                        <ChevronRight
                          size={14}
                          style={{
                            color: THEME.text.secondary,
                            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 150ms',
                            flexShrink: 0,
                          }}
                        />
                        <span className="flex-1 text-xs font-medium" style={{ color: THEME.text.primary }}>{dateLabel}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: THEME.bg.secondary, color: THEME.text.muted }}
                        >
                          {bookings.length} booking{bookings.length === 1 ? '' : 's'}
                        </span>
                        {/* Day-level checkbox — stops propagation so row expand doesn't double-fire */}
                        <DayCheckbox
                          allChecked={allChecked}
                          indeterminate={indeterminate}
                          onClick={(e) => { e.stopPropagation(); toggleDateBookings(dateKey, bookings); }}
                        />
                      </div>

                      {/* Expanded booking rows */}
                      {expanded && bookings.map((b, idx) => {
                        const k = bookingKey(b.empId, dateKey, b.startTime, b.endTime);
                        const checked = removeBookings.has(k);
                        return (
                          <div
                            key={k}
                            className="flex items-center gap-2 pl-8 pr-3 py-1.5 cursor-pointer select-none hover:opacity-80"
                            style={{
                              backgroundColor: idx % 2 === 0 ? THEME.bg.secondary : THEME.bg.elevated,
                              borderTop: `1px solid ${THEME.border.subtle}`,
                            }}
                            onClick={() => toggleBooking(b.empId, dateKey, b.startTime, b.endTime)}
                          >
                            <div
                              className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: checked ? THEME.status.error : THEME.bg.elevated,
                                border: `2px solid ${checked ? THEME.status.error : THEME.border.default}`,
                              }}
                            >
                              {checked && <Check size={9} color="white" />}
                            </div>
                            <span className="flex-1 text-xs truncate" style={{ color: THEME.text.primary }}>{b.empName}</span>
                            <span className="text-xs flex-shrink-0" style={{ color: THEME.text.secondary }}>
                              {formatTimeShort(b.startTime)}-{formatTimeShort(b.endTime)}
                            </span>
                            {b.note && (
                              <span
                                className="text-[10px] italic flex-shrink-0 max-w-[80px] truncate"
                                style={{ color: THEME.text.muted }}
                                title={b.note}
                              >
                                {b.note}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmDisabled}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: confirmBg,
            color: '#FFFFFF',
            opacity: confirmDisabled ? 0.4 : 1,
          }}
        >
          {confirmLabel}
        </button>

      </div>
    </AdaptiveModal>
  );
};

// Indeterminate checkbox via callback ref (native indeterminate prop).
// Accessible + matches platform conventions per plan decisions.
const DayCheckbox = ({ allChecked, indeterminate, onClick }) => {
  const cbRef = useRef(null);
  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={cbRef}
      type="checkbox"
      checked={allChecked}
      onChange={() => {}} // controlled via onClick on parent
      onClick={onClick}
      className="cursor-pointer"
      style={{ accentColor: THEME.status.error, width: 14, height: 14 }}
    />
  );
};
