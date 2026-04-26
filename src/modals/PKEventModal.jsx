import { useState, useMemo, useEffect } from 'react';
import { BookOpen, Check, Users } from 'lucide-react';
import { Modal, TimePicker, GradientButton } from '../components/primitives';
import { toDateKey } from '../utils/date';
import { THEME } from '../theme';
import { availabilityCoversWindow } from '../utils/timemath';
import { getPKDefaultTimes } from '../utils/eventDefaults';

export const PKEventModal = ({ isOpen, onClose, onSchedule, employees, events = {}, activeWeek, week1, week2 }) => {
  const today = toDateKey(new Date());
  const initialPK = getPKDefaultTimes(today);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState(initialPK.start);
  const [end, setEnd] = useState(initialPK.end);
  const [note, setNote] = useState('');
  const [overrides, setOverrides] = useState({});
  const [timesUserSet, setTimesUserSet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const d = toDateKey(new Date());
      const def = getPKDefaultTimes(d);
      setDate(d);
      setStart(def.start);
      setEnd(def.end);
      setNote('');
      setOverrides({});
      setTimesUserSet(false);
    }
  }, [isOpen]);

  // Currently-booked PK ids for the selected date+start+end window. Drives:
  // (1) initial check state in edit mode (already-booked = checked)
  // (2) dirty-state computation so Save enables on add OR remove
  // (3) note prefill in edit mode
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

  // Edit mode = at least one PK already booked at this slot. In edit mode the
  // initial check state mirrors the booked set; toggling becomes add/remove.
  // In create mode (zero booked) we keep the historical "auto-check eligible" UX.
  const isEditMode = existingPKBookedIds.ids.size > 0;

  // Prefill note from existing PK in edit mode (one-shot per date/time change)
  useEffect(() => {
    if (isEditMode && existingPKBookedIds.note && !note) setNote(existingPKBookedIds.note);
  }, [isEditMode, existingPKBookedIds.note]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply day-of-week PK default when date changes, unless user has manually
  // set the times (avoids stomping intentional overrides).
  useEffect(() => {
    if (!timesUserSet) {
      const def = getPKDefaultTimes(date);
      setStart(def.start);
      setEnd(def.end);
    }
  }, [date, timesUserSet]);

  useEffect(() => { setOverrides({}); }, [date, start, end]);

  const candidates = useMemo(() => {
    const active = (employees || []).filter(e => e.active && !e.deleted && !e.isOwner);
    return active.map(e => {
      const check = availabilityCoversWindow(e.availability, date, start, end);
      const wasBooked = existingPKBookedIds.ids.has(String(e.id));
      // Edit mode: initial check = currently-booked. Create mode: initial = eligibility.
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
  // Add/remove diff vs the existing booked set. Save enables on either > 0.
  const addIds = candidates.filter(c => c.checked && !c.wasBooked).map(c => c.id);
  const removeIds = candidates.filter(c => !c.checked && c.wasBooked).map(c => c.id);
  const isDirty = addIds.length > 0 || removeIds.length > 0;

  const toggle = (id, nextChecked) => {
    setOverrides(prev => ({ ...prev, [id]: nextChecked }));
  };

  // Check every eligible candidate without disturbing manual selections on
  // ineligible rows. Old behavior set ineligibles to false explicitly, which
  // surprised users who had manually opted someone in — they read it as a
  // deselect. This only ever adds checks.
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

  // Quick-pick: jump to this week's Saturday at the 10:00-10:45 pre-open window.
  // Uses the currently-viewed week (activeWeek from the schedule tabs).
  const weekDates = activeWeek === 1 ? week1 : activeWeek === 2 ? week2 : null;
  const saturdayDate = weekDates?.find(d => d instanceof Date && d.getDay() === 6);
  const saturdayKey = saturdayDate ? toDateKey(saturdayDate) : null;
  const isSaturdayActive = !!saturdayKey && date === saturdayKey && start === '10:00' && end === '10:45';
  const handleSaturdayQuickPick = () => {
    if (!saturdayDate) return;
    if (isSaturdayActive) {
      // Toggle off: revert to today's default day + default times
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

  const handleSchedule = () => {
    if (!isDirty) return;
    onSchedule({ date, startTime: start, endTime: end, note: note.trim(), addIds, removeIds });
  };

  const renderGroup = (label, group) => group.length === 0 ? null : (
    <div className="mb-2">
      <div className="text-xs font-semibold mb-1 px-1" style={{ color: THEME.text.secondary }}>{label} ({group.length})</div>
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
                backgroundColor: c.checked ? THEME.accent.purple : THEME.bg.elevated,
                border: `2px solid ${c.checked ? THEME.accent.purple : THEME.border.default}`,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Product Knowledge" size="lg">
      {/* Date + time row — stacks on mobile so the two time pickers (each 2 selects wide) aren't squeezed */}
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

      {saturdayDate && (
        <div className="mb-2">
          <button
            type="button"
            onClick={handleSaturdayQuickPick}
            className="px-2.5 py-1 rounded text-xs font-medium transition-all hover:opacity-90"
            style={{
              // Active = filled brand-purple with white text + check glyph;
              // tap again reverts to default day + default times.
              backgroundColor: isSaturdayActive ? THEME.accent.purple : THEME.event.pkBg,
              color: isSaturdayActive ? '#FFFFFF' : THEME.event.pkText,
              border: `1px solid ${isSaturdayActive ? THEME.accent.purple : THEME.event.pkBorder}`,
              boxShadow: isSaturdayActive ? `0 0 0 2px ${THEME.accent.purple}33` : 'none',
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
      <div className="mb-2">
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

      {renderGroup('Full-Time', fullTimers)}
      {renderGroup('Part-Time', partTimers)}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 mt-1" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        <GradientButton onClick={onClose} variant="secondary">Cancel</GradientButton>
        <GradientButton onClick={handleSchedule} disabled={!isDirty}>
          <BookOpen size={14} />
          {isEditMode
            ? (isDirty
                ? `Save (${addIds.length > 0 ? `+${addIds.length}` : ''}${addIds.length > 0 && removeIds.length > 0 ? ' ' : ''}${removeIds.length > 0 ? `-${removeIds.length}` : ''})`
                : 'Save')
            : `Schedule for ${checkedCount}`}
        </GradientButton>
      </div>
    </Modal>
  );
};
