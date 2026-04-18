import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Check, Users } from 'lucide-react';
import { Modal, TimePicker, GradientButton, toDateKey } from '../App';
import { THEME } from '../theme';
import { availabilityCoversWindow } from '../utils/timemath';
import { getPKDefaultTimes } from '../utils/eventDefaults';

export const PKEventModal = ({ isOpen, onClose, onSchedule, employees }) => {
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
      const defaultChecked = check.eligible;
      const checked = overrides[e.id] !== undefined ? overrides[e.id] : defaultChecked;
      return { ...e, eligible: check.eligible, reason: check.reason, checked };
    }).sort((a, b) => {
      const aFt = a.type === 'full' ? 0 : 1;
      const bFt = b.type === 'full' ? 0 : 1;
      if (aFt !== bFt) return aFt - bFt;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [employees, date, start, end, overrides]);

  const fullTimers = candidates.filter(c => c.type === 'full');
  const partTimers = candidates.filter(c => c.type !== 'full');
  const checkedCount = candidates.filter(c => c.checked).length;

  const toggle = (id, nextChecked) => {
    setOverrides(prev => ({ ...prev, [id]: nextChecked }));
  };

  const selectAllEligible = () => {
    const next = {};
    candidates.forEach(c => { next[c.id] = c.eligible; });
    setOverrides(next);
  };

  const clearAll = () => {
    const next = {};
    candidates.forEach(c => { next[c.id] = false; });
    setOverrides(next);
  };

  const handleSchedule = () => {
    const employeeIds = candidates.filter(c => c.checked).map(c => c.id);
    if (employeeIds.length === 0) return;
    onSchedule({ date, startTime: start, endTime: end, note: note.trim(), employeeIds });
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
      {/* Date + time row */}
      <div className="grid grid-cols-3 gap-2 mb-2">
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
            className="px-2 py-0.5 rounded text-xs hover:opacity-80"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          >
            Select eligible
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
        <GradientButton onClick={handleSchedule} disabled={checkedCount === 0}>
          <BookOpen size={14} />
          Schedule for {checkedCount}
        </GradientButton>
      </div>
    </Modal>
  );
};
