import { useState, useEffect } from 'react';
import { Star, Trash2, Check, AlertTriangle, Thermometer, X, Plus } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES, EVENT_TYPES } from '../constants';
import { getPKDefaultTimes, MEETING_DEFAULT_TIMES } from '../utils/eventDefaults';
import { getStoreHoursForDate } from '../App';
import { Modal, TimePicker, GradientButton } from '../components/primitives';
import { AnimatedNumber } from '../components/uiKit';
import { toDateKey, formatDateLong, calculateHours } from '../utils/date';
import { isStatHoliday, DEFAULT_SHIFT } from '../utils/storeHours';
import { getDayName } from '../utils/date';
import { hasTitle } from '../utils/employeeRender';

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

// Three peer scheduled-activity types. They answer "what is the employee doing?".
// Sick is a separate category (absence override) and lives in its own section.
const ACTIVITY_TYPES = ['work', 'meeting', 'pk'];

// Modal for editing a single day:
//   - Absence section (sick toggle) — categorically separate, amber palette.
//   - Scheduled toggles (Work / Meeting / PK) — unified blue palette; tap is
//     ALWAYS a decisive toggle: unlit tap books with defaults, lit tap unbooks.
//     No intermediate "focus" step — JR's feedback: "the first press acts as
//     a selector and only once selected it acts as a toggle."
//   - Each booked type renders its own inline edit form (stacked). This
//     removes the single-focus concept so users can edit any booked type
//     without fear of unbooking the one they want to edit.
//   - Footer trash = clear-whole-day (wipes every activity + any sick mark).
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
    : type === 'meeting'
      ? meetingDrafts.length > 0
      : !!existingEvents.find(e => e.type === type);

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

  // Stable id for a new meeting row. Backend keyOf uses this to allow N meetings
  // per (empId, date). 8 chars of base36 randomness + emp/date prefix gives a
  // sub-trillion collision probability per emp-date, which is overkill for a
  // schedule grid but cheap.
  const newMeetingId = (empId, d) =>
    `MTG-${empId}-${toDateKey(d)}-${Math.random().toString(36).slice(2, 10)}`;

  // Seed the meetingDrafts array from existingEvents. Each existing meeting
  // preserves its row id (so saves overwrite the right backend row). Ordered by
  // startTime so the cell renders in chronological order.
  const seedMeetings = () => {
    const existing = existingEvents
      .filter(e => e.type === 'meeting')
      .slice()
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    return existing.map(ev => ({
      id: ev.id || `MEETING-${employee.id}-${toDateKey(date)}`,
      startTime: ev.startTime,
      endTime: ev.endTime,
      note: ev.note || '',
    }));
  };

  const [workDraft, setWorkDraft] = useState(seedFor('work'));
  const [meetingDrafts, setMeetingDrafts] = useState(() => seedMeetings());
  const [pkDraft, setPkDraft] = useState(seedFor('pk'));

  // Sick (absence) state — immediate-save toggle, separate category.
  const existingSick = existingEvents.find(e => e.type === 'sick');
  const [sickActive, setSickActive] = useState(!!existingSick);
  const [sickNote, setSickNote] = useState(existingSick?.note || '');

  useEffect(() => {
    setWorkDraft(seedFor('work'));
    setMeetingDrafts(seedMeetings());
    setPkDraft(seedFor('pk'));
    setSickActive(!!existingSick);
    setSickNote(existingSick?.note || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingShift, existingEvents, date]);

  const workHours = calculateHours(workDraft.startTime, workDraft.endTime);
  // Period projection: when sick, day contributes 0; otherwise reflect the
  // current work draft's delta.
  const projectedTotal = sickActive ? totalPeriodHours
    : hasType('work')
      ? totalPeriodHours - (existingShift?.hours || 0) + workHours
      : totalPeriodHours;

  // Availability warning fires for ANY scheduled activity (work / meeting / pk)
  // on a day the employee is off or has approved time off. The streak warning
  // is work-specific (consecutive-work-day rule).
  const hasAnyActivity = ACTIVITY_TYPES.some(hasType);
  const showAvailabilityWarning = !sickActive && hasAnyActivity && (hasApprovedTimeOff || (availability && availability.available === false));
  const resultingStreak = !sickActive && hasType('work') ? priorWorkStreak + 1 : 0;
  const showStreakWarning = !sickActive && hasType('work') && resultingStreak >= 5;

  // Save persists the CURRENT drafts for every booked type. Booking happens on
  // tap (immediate save of defaults); Save captures edits the user made after
  // the initial book. When sick is active the reason input commits on blur,
  // so we also flush any pending reason here in case the user tapped Save
  // without first blurring the field.
  const handleSave = () => {
    if (sickActive && sickNote !== (existingSick?.note || '')) {
      saveSick(true, sickNote);
    }
    if (hasType('work')) {
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
        hours: calculateHours(workDraft.startTime, workDraft.endTime),
      });
    }
    // Meetings: iterate drafts; each one carries its own id so the backend write
    // path replaces the matching row or appends a new one.
    meetingDrafts.forEach(draft => {
      onSave({
        id: draft.id,
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: draft.startTime,
        endTime: draft.endTime,
        role: 'none',
        task: '',
        type: 'meeting',
        note: draft.note,
        hours: calculateHours(draft.startTime, draft.endTime),
      });
    });
    // PK still singular.
    if (hasType('pk')) {
      onSave({
        employeeId: employee.id,
        employeeName: employee.name,
        date: toDateKey(date),
        startTime: pkDraft.startTime,
        endTime: pkDraft.endTime,
        role: 'none',
        task: '',
        type: 'pk',
        note: pkDraft.note,
        hours: calculateHours(pkDraft.startTime, pkDraft.endTime),
      });
    }
    onClose();
  };

  // Tap-to-toggle. No focus step, no "first press selects" surprise.
  // Unlit → book with defaults (immediate save). Lit → unbook (immediate save).
  const toggleTab = (type) => {
    if (type === 'meeting') {
      if (meetingDrafts.length === 0) {
        // Unlit + tap → add first meeting with defaults; immediate save.
        const t = getDefaultEventTimes('meeting', date);
        const id = newMeetingId(employee.id, date);
        const draft = { id, startTime: t.start, endTime: t.end, note: '' };
        setMeetingDrafts([draft]);
        onSave({
          id, employeeId: employee.id, employeeName: employee.name,
          date: toDateKey(date),
          startTime: t.start, endTime: t.end,
          role: 'none', task: '', type: 'meeting', note: '',
          hours: calculateHours(t.start, t.end),
        });
      } else {
        // Lit + tap → remove LAST meeting. Per JR: symmetry-preserving for N=1
        // (existing behavior — removes the only one); for N>=2 removes the
        // most-recently-added.
        const last = meetingDrafts[meetingDrafts.length - 1];
        setMeetingDrafts(meetingDrafts.slice(0, -1));
        onSave({
          id: last.id, employeeId: employee.id,
          date: toDateKey(date), type: 'meeting', deleted: true,
        });
      }
      return;
    }
    // work / pk — existing behavior.
    if (hasType(type)) {
      onSave({ employeeId: employee.id, date: toDateKey(date), type, deleted: true });
      return;
    }
    const t = type === 'work' ? getDefaultBookingTimes(date) : getDefaultEventTimes(type, date);
    onSave({
      employeeId: employee.id,
      employeeName: employee.name,
      date: toDateKey(date),
      startTime: t.start,
      endTime: t.end,
      role: 'none',
      task: '',
      type,
      note: '',
      hours: calculateHours(t.start, t.end),
    });
  };

  const clearDay = () => {
    const k = toDateKey(date);
    if (existingShift) onSave({ employeeId: employee.id, date: k, type: 'work', deleted: true });
    existingEvents.forEach(ev => {
      onSave({ id: ev.id, employeeId: employee.id, date: k, type: ev.type, deleted: true });
    });
    onClose();
  };

  const hasAnyData = !!existingShift || existingEvents.length > 0;

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
  const isTitledTarget = hasTitle(employee);

  // Render helper: the edit form for one booked activity type (work and pk only).
  // Meeting is handled via renderMeetingsSection below.
  const renderActivityForm = (type) => {
    if (type === 'work') {
      return (
        <div key="work" className="mb-2 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.accent.blue }}>Work</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <TimePicker label="Start" value={workDraft.startTime} onChange={t => setWorkDraft({ ...workDraft, startTime: t })} />
            <TimePicker label="End" value={workDraft.endTime} onChange={t => setWorkDraft({ ...workDraft, endTime: t })} />
          </div>
          {!isTitledTarget ? (
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
          ) : null}
          <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Task <Star size={8} fill={THEME.task} color={THEME.task} className="inline" /></label>
          <input value={workDraft.task} onChange={e => setWorkDraft({ ...workDraft, task: e.target.value })} placeholder="Optional..." className="w-full px-2 py-1.5 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
        </div>
      );
    }
    // pk only — meeting handled via renderMeetingsSection
    return (
      <div key="pk" className="mb-2 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.accent.blue }}>{EVENT_TYPES.pk.label}</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <TimePicker label="Start" value={pkDraft.startTime} onChange={t => setPkDraft({ ...pkDraft, startTime: t })} />
          <TimePicker label="End" value={pkDraft.endTime} onChange={t => setPkDraft({ ...pkDraft, endTime: t })} />
        </div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>What product knowledge is being covered?</label>
        <input value={pkDraft.note} onChange={e => setPkDraft({ ...pkDraft, note: e.target.value })}
          placeholder="e.g. Spring denim line"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
      </div>
    );
  };

  // Per-meeting card. First meeting (idx=0) has no X — tab-toggle is its removal
  // control. Meetings 2+ show a small X for surgical per-row delete.
  const renderMeetingRow = (draft, idx) => {
    const showDelete = idx > 0;
    const setDraft = (next) => {
      const arr = meetingDrafts.slice();
      arr[idx] = next;
      setMeetingDrafts(arr);
    };
    const deleteThis = () => {
      const removed = meetingDrafts[idx];
      setMeetingDrafts(meetingDrafts.filter((_, i) => i !== idx));
      onSave({
        id: removed.id, employeeId: employee.id,
        date: toDateKey(date), type: 'meeting', deleted: true,
      });
    };
    return (
      <div key={draft.id} className="mb-2 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: THEME.accent.blue }}>
            {EVENT_TYPES.meeting.label}{meetingDrafts.length > 1 ? ` ${idx + 1}` : ''}
          </p>
          {showDelete && (
            <button type="button" onClick={deleteThis}
              aria-label={`Remove meeting ${idx + 1}`}
              className="p-0.5 rounded hover:opacity-70"
              style={{ color: THEME.text.muted }}>
              <X size={12} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <TimePicker label="Start" value={draft.startTime} onChange={t => setDraft({ ...draft, startTime: t })} />
          <TimePicker label="End" value={draft.endTime} onChange={t => setDraft({ ...draft, endTime: t })} />
        </div>
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>What is this meeting about?</label>
        <input value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
          placeholder="e.g. 1:1 review"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-sm"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
      </div>
    );
  };

  const addMeeting = () => {
    const t = getDefaultEventTimes('meeting', date);
    const id = newMeetingId(employee.id, date);
    const draft = { id, startTime: t.start, endTime: t.end, note: '' };
    setMeetingDrafts([...meetingDrafts, draft]);
    onSave({
      id, employeeId: employee.id, employeeName: employee.name,
      date: toDateKey(date),
      startTime: t.start, endTime: t.end,
      role: 'none', task: '', type: 'meeting', note: '',
      hours: calculateHours(t.start, t.end),
    });
  };

  const renderMeetingsSection = () => (
    <>
      {meetingDrafts.map(renderMeetingRow)}
      <button type="button" onClick={addMeeting}
        className="w-full mb-2 px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
        style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary, border: `1px dashed ${THEME.border.default}` }}>
        <Plus size={12} />
        Add another meeting
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Shift" size="sm">
      {(showAvailabilityWarning || showStreakWarning) && (() => {
        const reasons = [];
        if (showAvailabilityWarning) {
          reasons.push(hasApprovedTimeOff
            ? <>has <strong>approved time off</strong> for this date</>
            : <>is marked <strong>unavailable</strong> on <strong>{formatDateLong(date).split(',')[0]}s</strong></>);
        }
        if (showStreakWarning) {
          const ord = resultingStreak === 5 ? '5th' : `${resultingStreak}th`;
          reasons.push(<>would be on their <strong>{ord} consecutive</strong> work day</>);
        }
        return (
          <div className="p-2 rounded-lg mb-2 flex items-start gap-2" style={{ backgroundColor: THEME.status.warning + '20', border: `1px solid ${THEME.status.warning}` }}>
            <AlertTriangle size={14} style={{ color: THEME.status.warning, marginTop: 1, flexShrink: 0 }} />
            <div className="text-xs" style={{ color: THEME.text.primary }}>
              {reasons.length === 1 ? (
                <p><strong>{employee.name}</strong> {reasons[0]}.<span style={{ color: THEME.text.secondary }}> OK to save; just a heads-up.</span></p>
              ) : (
                <>
                  <p className="mb-0.5"><strong>{employee.name}</strong> — heads-up:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <p className="mt-0.5" style={{ color: THEME.text.secondary }}>OK to save; just flagging.</p>
                </>
              )}
            </div>
          </div>
        );
      })()}

      <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}>{employee.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{employee.name}</p>
            {isTitledTarget && (employee.title || '').trim() ? (
              <p className="text-[10px] leading-snug truncate" style={{ color: THEME.text.muted }} title={employee.title}>{employee.title}</p>
            ) : null}
            <p className="text-xs" style={{ color: THEME.text.secondary }}>{formatDateLong(date)} {isHoliday && <span style={{ color: THEME.status.warning }}>• Hol</span>}</p>
          </div>
        </div>
      </div>

      {/* ABSENCE — own container, amber palette, pattern-interrupt vs activities. */}
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

      {/* SCHEDULED — three peer toggles, unified palette. Tap = toggle (book or
          unbook immediately). No focus state. Muted when sick is active. */}
      <div className="mb-2" style={{ opacity: sickActive ? 0.5 : 1, pointerEvents: sickActive ? 'none' : 'auto' }}>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: THEME.text.muted }}>Scheduled</p>
        <div className="flex items-center gap-1 flex-wrap">
          {ACTIVITY_TYPES.map(type => {
            const booked = hasType(type);
            const label = type === 'work' ? 'Work' : EVENT_TYPES[type].label;
            const litColor = THEME.accent.blue;
            const style = booked
              ? { bg: litColor, color: 'white', border: litColor, dashed: false }
              : { bg: 'transparent', color: THEME.text.muted, border: THEME.border.default, dashed: true };
            return (
              <button key={type} type="button"
                onClick={() => toggleTab(type)}
                aria-pressed={booked}
                title={booked ? `Tap to remove ${label}` : `Tap to book ${label}`}
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

      {/* Per-type edit forms — stacked, shown only for booked types. */}
      <div style={{ opacity: sickActive ? 0.5 : 1, pointerEvents: sickActive ? 'none' : 'auto' }}>
        {hasType('work') && renderActivityForm('work')}
        {hasType('meeting') && renderMeetingsSection()}
        {hasType('pk') && renderActivityForm('pk')}
      </div>

      <div className="p-2 rounded-lg mb-3 grid grid-cols-2 gap-2 text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div>
          <span className="text-xs" style={{ color: THEME.text.muted }}>TODAY</span>
          <p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}>
            <AnimatedNumber value={sickActive ? 0 : (hasType('work') ? workHours : 0)} decimals={1} suffix="h" />
          </p>
        </div>
        <div>
          <span className="text-xs" style={{ color: THEME.text.muted }}>PERIOD</span>
          <p className="text-lg font-bold" style={{ color: projectedTotal >= 44 ? THEME.status.error : projectedTotal >= 40 ? THEME.status.warning : THEME.accent.cyan }}>
            <AnimatedNumber value={projectedTotal} decimals={1} suffix="h" />
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {hasAnyData && <GradientButton danger small onClick={clearDay} ariaLabel="Clear all bookings for this day"><Trash2 size={10} /></GradientButton>}
        <div className="flex gap-2 ml-auto">
          <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
          <GradientButton small onClick={handleSave}><Check size={12} />Save</GradientButton>
        </div>
      </div>
    </Modal>
  );
};
