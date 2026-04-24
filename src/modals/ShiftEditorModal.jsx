import { useState, useEffect } from 'react';
import { Star, Trash2, Check, AlertTriangle, Thermometer } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES, EVENT_TYPES } from '../constants';
import { getPKDefaultTimes, MEETING_DEFAULT_TIMES } from '../utils/eventDefaults';
import { getStoreHoursForDate } from '../App';
import { Modal, TimePicker, GradientButton } from '../components/primitives';
import { AnimatedNumber } from '../components/uiKit';
import { toDateKey, formatDateLong, calculateHours } from '../utils/date';
import { isStatHoliday, DEFAULT_SHIFT } from '../utils/storeHours';
import { getDayName } from '../utils/date';

const getDefaultBookingTimes = (date) => {
  const dayName = getDayName(date).toLowerCase();
  const d = DEFAULT_SHIFT[dayName];
  return { start: d.start, end: d.end };
};

// PK defaults branch on day-of-week; meeting is locked 14:00-16:00.
const getDefaultEventTimes = (type = 'meeting', date = null) => {
  if (type === 'pk') return getPKDefaultTimes(date || new Date());
  return MEETING_DEFAULT_TIMES;
};

// The three scheduled-activity types form one gestalt group — they answer
// "what is this employee doing?". Sick is categorically different (an absence
// override) and lives in its own Absence section, not in this group.
const ACTIVITY_TYPES = ['work', 'meeting', 'pk'];

// Modal for editing a single day: one Absence toggle (sick) + three activity
// toggles (work / meeting / pk). Tap an unlit tab to book with defaults (saves
// immediately). Tap the lit active tab again to unbook. Tap a lit non-active
// tab to focus it for editing. Footer trash clears the whole day in one shot.
export const ShiftEditorModal = ({
  isOpen,
  onClose,
  onSave,
  employee,
  date,
  existingShift,
  existingEvents = [],
  totalPeriodHours,
  availability,
  hasApprovedTimeOff = false,
  priorWorkStreak = 0,
  currentUser = null,
}) => {
  const storeHours = getStoreHoursForDate(date);
  const isHoliday = isStatHoliday(date);

  const hasType = (type) => type === 'work'
    ? !!existingShift
    : !!existingEvents.find(e => e.type === type);

  // Default active tab: the first booked activity (reading order), else work.
  // Initialized once per modal open — do NOT reset when data changes, because
  // tap-to-toggle mutates data and the effect would clobber the user's intent
  // (tapping Meeting books it → effect sees work first → activeType resets to
  // 'work' → second tap focuses instead of unbooks). The modal is re-mounted
  // when editingShift changes in App.jsx, so initial useState covers reopens.
  const [activeType, setActiveType] = useState(() => ACTIVITY_TYPES.find(hasType) || 'work');

  const seedFor = (type) => {
    if (type === 'work') {
      const t = getDefaultBookingTimes(date);
      return {
        startTime: existingShift?.startTime || t.start,
        endTime: existingShift?.endTime || t.end,
        role: existingShift?.role || 'none',
        task: existingShift?.task || '',
      };
    }
    const ev = existingEvents.find(e => e.type === type);
    const t = getDefaultEventTimes(type, date);
    return {
      startTime: ev?.startTime || t.start,
      endTime: ev?.endTime || t.end,
      note: ev?.note || '',
    };
  };

  const [workDraft, setWorkDraft] = useState(seedFor('work'));
  const [meetingDraft, setMeetingDraft] = useState(seedFor('meeting'));
  const [pkDraft, setPkDraft] = useState(seedFor('pk'));

  // Sick (absence) state — separate category, immediate-save toggle.
  const existingSick = existingEvents.find(e => e.type === 'sick');
  const [sickActive, setSickActive] = useState(!!existingSick);
  const [sickNote, setSickNote] = useState(existingSick?.note || '');

  useEffect(() => {
    setWorkDraft(seedFor('work'));
    setMeetingDraft(seedFor('meeting'));
    setPkDraft(seedFor('pk'));
    setSickActive(!!existingSick);
    setSickNote(existingSick?.note || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingShift, existingEvents, date]);

  const draft = activeType === 'work' ? workDraft
    : activeType === 'meeting' ? meetingDraft
    : pkDraft;
  const setDraft = activeType === 'work' ? setWorkDraft
    : activeType === 'meeting' ? setMeetingDraft
    : setPkDraft;

  const shiftHours = calculateHours(draft.startTime, draft.endTime);
  // Period projection. Sick: day is 0 regardless of draft. Work tab: add delta.
  // Meeting/pk: no clean per-entry delta (union-counted), show current total.
  const projectedTotal = sickActive ? totalPeriodHours
    : activeType === 'work' ? totalPeriodHours - (existingShift?.hours || 0) + shiftHours
    : totalPeriodHours;

  const showAvailabilityWarning = !sickActive && activeType === 'work' && (hasApprovedTimeOff || (availability && availability.available === false));
  const resultingStreak = !sickActive && activeType === 'work' ? priorWorkStreak + 1 : 0;
  const showStreakWarning = !sickActive && activeType === 'work' && resultingStreak >= 5;

  const handleSave = () => {
    // Save only mutates the currently-focused activity tab. First-book happens
    // via toggleTab (immediate save with defaults); Save persists edits.
    if (activeType === 'work') {
      onSave({
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: workDraft.startTime,
        endTime: workDraft.endTime,
        role: workDraft.role,
        task: workDraft.task,
        type: 'work',
        note: '',
        hours: shiftHours,
      });
    } else {
      onSave({
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: draft.startTime,
        endTime: draft.endTime,
        role: 'none',
        task: '',
        type: activeType,
        note: draft.note,
        hours: shiftHours,
      });
    }
    onClose();
  };

  // Tap-to-toggle on an activity tab. Tri-state:
  //   unlit (not booked) → book with defaults + focus
  //   lit, not active    → focus for editing (no mutation)
  //   lit, active        → unbook (destructive)
  const toggleTab = (type) => {
    const booked = hasType(type);
    if (!booked) {
      const t = type === 'work' ? getDefaultBookingTimes(date) : getDefaultEventTimes(type, date);
      onSave({
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: t.start,
        endTime: t.end,
        role: type === 'work' ? 'none' : 'none',
        task: '',
        type,
        note: '',
        hours: calculateHours(t.start, t.end),
      });
      setActiveType(type);
    } else if (type !== activeType) {
      setActiveType(type);
    } else {
      onSave({ employeeId: employee.id, date: toDateKey(date), type, deleted: true });
      const remaining = ACTIVITY_TYPES.filter(t => t !== type && hasType(t));
      setActiveType(remaining[0] || 'work');
    }
  };

  // Clear the whole day — every activity + any sick mark. Single destructive
  // action for "remove everything here."
  const clearDay = () => {
    const k = toDateKey(date);
    if (existingShift) onSave({ employeeId: employee.id, date: k, type: 'work', deleted: true });
    existingEvents.forEach(ev => {
      onSave({ employeeId: employee.id, date: k, type: ev.type, deleted: true });
    });
    onClose();
  };

  const hasAnyData = !!existingShift || existingEvents.length > 0;

  // Sick toggle persists immediately — decisive state change, not a draft.
  const saveSick = (nextActive, noteValue) => {
    if (nextActive) {
      const t = existingShift?.startTime && existingShift?.endTime
        ? { start: existingShift.startTime, end: existingShift.endTime }
        : getDefaultBookingTimes(date);
      onSave({
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: t.start,
        endTime: t.end,
        role: 'none',
        task: '',
        type: 'sick',
        note: noteValue || '',
        hours: calculateHours(t.start, t.end),
      });
    } else {
      onSave({ employeeId: employee.id, date: toDateKey(date), type: 'sick', deleted: true });
    }
  };

  const toggleSick = () => {
    const next = !sickActive;
    setSickActive(next);
    if (!next) setSickNote('');
    saveSick(next, next ? sickNote : '');
  };

  const commitSickNote = () => {
    if (sickActive && sickNote !== (existingSick?.note || '')) {
      saveSick(true, sickNote);
    }
  };

  const isAdmin = !!currentUser?.isAdmin;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Shift" size="sm">
      {showStreakWarning && (
        <div className="p-2 rounded-lg mb-2 flex items-start gap-2" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}60` }}>
          <AlertTriangle size={14} style={{ color: THEME.status.warning, marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: THEME.text.primary }}>
            <strong>{employee.name}</strong> would be on their {resultingStreak === 5 ? '5th' : `${resultingStreak}th`} consecutive work day.
            <span style={{ color: THEME.text.secondary }}> OK to save; just a heads-up.</span>
          </p>
        </div>
      )}
      {showAvailabilityWarning && (
        <div className="p-2 rounded-lg mb-2 flex items-start gap-2" style={{ backgroundColor: THEME.status.warning + '20', border: `1px solid ${THEME.status.warning}` }}>
          <AlertTriangle size={14} style={{ color: THEME.status.warning, marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: THEME.text.primary }}>
            {hasApprovedTimeOff
              ? <><strong>{employee.name}</strong> has approved time off for this date.</>
              : <><strong>{employee.name}</strong> is marked unavailable on {formatDateLong(date).split(',')[0]}s.</>}
            <span style={{ color: THEME.text.secondary }}> You can still schedule them, but double-check first.</span>
          </p>
        </div>
      )}

      <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}>{employee.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs" style={{ color: THEME.text.secondary }}>{formatDateLong(date)} {isHoliday && <span style={{ color: THEME.status.warning }}>• Hol</span>}</p>
          </div>
        </div>
      </div>

      {/* ABSENCE — sick answers "is the employee here?". Visually distinct
          from the scheduled-activity toggles below: amber palette, its own
          container, its own label. Pattern-interrupt by design (research:
          L0-05 common region + L0-06 reading order). */}
      {isAdmin && (
        <div className="p-2 rounded-lg mb-2"
          style={{
            backgroundColor: sickActive ? EVENT_TYPES.sick.bg : THEME.bg.tertiary,
            border: `1px solid ${sickActive ? EVENT_TYPES.sick.border : THEME.border.default}`,
          }}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Thermometer size={14} style={{ color: sickActive ? EVENT_TYPES.sick.text : THEME.text.secondary }} />
              <span className="text-xs font-medium" style={{ color: sickActive ? EVENT_TYPES.sick.text : THEME.text.primary }}>
                {sickActive ? 'Called in sick' : 'Mark as sick'}
              </span>
            </div>
            <button type="button" onClick={toggleSick}
              role="switch"
              aria-checked={sickActive}
              aria-label={sickActive ? 'Unmark sick' : 'Mark sick'}
              className="relative h-5 w-9 rounded-full transition-colors shrink-0"
              style={{ backgroundColor: sickActive ? EVENT_TYPES.sick.border : THEME.border.default }}>
              <span className="absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform"
                style={{ transform: sickActive ? 'translateX(18px)' : 'translateX(2px)' }} />
            </button>
          </div>
          {sickActive && (
            <input
              value={sickNote}
              onChange={e => setSickNote(e.target.value)}
              onBlur={commitSickNote}
              placeholder="Reason (optional) — e.g. flu"
              className="w-full px-2 py-1 mt-2 rounded outline-none text-xs"
              style={{ backgroundColor: 'white', border: `1px solid ${EVENT_TYPES.sick.border}`, color: EVENT_TYPES.sick.text }} />
          )}
        </div>
      )}

      {/* SCHEDULED — three peer toggles with unified visual language (gestalt
          similarity). Lit = booked (saved data). Unlit = not booked. Tap to
          book/focus/unbook. Muted when sick is active (activity is moot). */}
      <div className="mb-2" style={{ opacity: sickActive ? 0.5 : 1, pointerEvents: sickActive ? 'none' : 'auto' }}>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.text.muted }}>Scheduled</p>
        <div className="flex items-center gap-1 flex-wrap">
          {ACTIVITY_TYPES.map(type => {
            const booked = hasType(type);
            const active = type === activeType;
            const label = type === 'work' ? 'Work' : EVENT_TYPES[type].label;
            // Unified palette: one accent for "booked." Active booked gets
            // full fill; inactive booked gets a muted fill; unbooked is a
            // dashed outlined placeholder.
            const litColor = THEME.accent.blue;
            const style = booked && active
              ? { bg: litColor, color: 'white', border: litColor, dashed: false }
              : booked
                ? { bg: litColor + '1A', color: litColor, border: litColor + '60', dashed: false }
                : { bg: 'transparent', color: THEME.text.muted, border: THEME.border.default, dashed: true };
            return (
              <button key={type} type="button"
                onClick={() => toggleTab(type)}
                aria-pressed={booked}
                title={booked ? (active ? `Tap again to remove ${label}` : `Tap to edit ${label}`) : `Tap to book ${label}`}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: style.bg,
                  color: style.color,
                  border: `1px ${style.dashed ? 'dashed' : 'solid'} ${style.border}`,
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ opacity: sickActive ? 0.5 : 1, pointerEvents: sickActive ? 'none' : 'auto' }}>
        <div className="grid grid-cols-2 gap-2">
          <TimePicker label="Start" value={draft.startTime} onChange={t => setDraft({ ...draft, startTime: t })} />
          <TimePicker label="End" value={draft.endTime} onChange={t => setDraft({ ...draft, endTime: t })} />
        </div>

        {activeType === 'work' ? (
          <>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Role</label>
              <div className="grid grid-cols-3 gap-1">
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => setWorkDraft({ ...workDraft, role: r.id })}
                    className="px-1.5 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: workDraft.role === r.id ? r.color : THEME.bg.elevated, color: workDraft.role === r.id ? 'white' : THEME.text.primary, border: `1px solid ${workDraft.role === r.id ? r.color : THEME.border.default}` }}>
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Task <Star size={8} fill={THEME.task} color={THEME.task} className="inline" /></label>
              <input value={workDraft.task} onChange={e => setWorkDraft({ ...workDraft, task: e.target.value })} placeholder="Optional..." className="w-full px-2 py-1.5 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
            </div>
          </>
        ) : (
          <div className="mb-2">
            <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>
              {activeType === 'meeting' ? 'What is this meeting about?' : 'What product knowledge is being covered?'}
            </label>
            <input value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
              placeholder={activeType === 'meeting' ? 'e.g. 1:1 review' : 'e.g. Spring denim line'}
              className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
              style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
          </div>
        )}
      </div>

      <div className="p-2 rounded-lg mb-3 grid grid-cols-2 gap-2 text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>{activeType === 'work' ? 'SHIFT' : activeType === 'meeting' ? 'MEETING' : 'PK'}</span><p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}><AnimatedNumber value={sickActive ? 0 : shiftHours} decimals={1} suffix="h" /></p></div>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>PERIOD</span><p className="text-lg font-bold" style={{ color: projectedTotal >= 44 ? THEME.status.error : projectedTotal >= 40 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={projectedTotal} decimals={1} suffix="h" /></p></div>
      </div>

      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {hasAnyData && <GradientButton danger small onClick={clearDay} ariaLabel="Clear all bookings for this day"><Trash2 size={10} /></GradientButton>}
        <div className="flex gap-2 ml-auto">
          <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
          <GradientButton small onClick={handleSave} disabled={sickActive}><Check size={12} />Save</GradientButton>
        </div>
      </div>
    </Modal>
  );
};
