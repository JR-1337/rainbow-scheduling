import { useState, useEffect, useMemo } from 'react';
import { Star, Trash2, Check, AlertTriangle, Plus } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES, EVENT_TYPES } from '../constants';
import { getPKDefaultTimes } from '../utils/eventDefaults';
import { getStoreHoursForDate, AnimatedNumber } from '../App';
import { Modal, TimePicker, GradientButton } from '../components/primitives';
import { toDateKey, formatDateLong, calculateHours } from '../utils/date';
import { isStatHoliday } from '../utils/storeHours';

const getDefaultBookingTimes = (date) => {
  const storeHours = getStoreHoursForDate(date);
  return { start: storeHours.open, end: storeHours.close };
};

// PK defaults branch on day-of-week via getPKDefaultTimes (Saturday pre-open).
// Meeting defaults to the next full hour from now (or 14:00 if that's already past).
const getDefaultEventTimes = (type = 'meeting', date = null) => {
  if (type === 'pk') return getPKDefaultTimes(date || new Date());
  const now = new Date();
  let hour = now.getHours() + 1;
  if (hour < 10 || hour > 17) hour = 14;
  const pad = (n) => String(n).padStart(2, '0');
  const start = `${pad(hour)}:00`;
  const end = `${pad(hour + 2)}:00`;
  return { start, end };
};

// S61 — Tabbed editor. Admins land on the tab that already has data (work first,
// then meeting, then pk). "+ Add" adds a tab for a type not yet present. Save/
// Delete act on the active tab only so you can't accidentally wipe a meeting
// while editing a work shift.
export const ShiftEditorModal = ({
  isOpen,
  onClose,
  onSave,
  employee,
  date,
  existingShift,            // work shift (or undefined)
  existingEvents = [],      // array of meeting/pk entries (may be empty)
  totalPeriodHours,
  availability,
  hasApprovedTimeOff = false,
  priorWorkStreak = 0,
}) => {
  const storeHours = getStoreHoursForDate(date);
  const isHoliday = isStatHoliday(date);
  const defaultTimes = getDefaultBookingTimes(date);

  // Derive which tabs to show and which is active.
  const presentTypes = useMemo(() => {
    const set = new Set();
    if (existingShift) set.add('work');
    existingEvents.forEach(e => { if (e.type) set.add(e.type); });
    if (set.size === 0) set.add('work'); // empty cell defaults to new work shift
    return set;
  }, [existingShift, existingEvents]);

  const firstTab = presentTypes.has('work') ? 'work' : presentTypes.has('meeting') ? 'meeting' : 'pk';
  const [activeType, setActiveType] = useState(firstTab);
  const [openTabs, setOpenTabs] = useState(presentTypes);

  useEffect(() => {
    setActiveType(firstTab);
    setOpenTabs(new Set(presentTypes));
  }, [existingShift, existingEvents, firstTab, presentTypes]);

  // Per-tab local draft state. Separate drafts so switching tabs doesn't
  // cross-contaminate.
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

  useEffect(() => {
    setWorkDraft(seedFor('work'));
    setMeetingDraft(seedFor('meeting'));
    setPkDraft(seedFor('pk'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingShift, existingEvents, date]);

  const draft = activeType === 'work' ? workDraft : activeType === 'meeting' ? meetingDraft : pkDraft;
  const setDraft = activeType === 'work' ? setWorkDraft : activeType === 'meeting' ? setMeetingDraft : setPkDraft;

  const shiftHours = calculateHours(draft.startTime, draft.endTime);
  const existingThisType = activeType === 'work' ? existingShift : existingEvents.find(e => e.type === activeType);
  // Period-hours projection is only meaningful for the work tab — meeting/pk
  // union with work so we don't have a clean per-entry delta.
  const projectedTotal = activeType === 'work'
    ? totalPeriodHours - (existingShift?.hours || 0) + shiftHours
    : totalPeriodHours;

  const showAvailabilityWarning = activeType === 'work' && (hasApprovedTimeOff || (availability && availability.available === false));
  // S64 Stage 8.2 — advisory banner on 5th+ consecutive work day. Informational only,
  // does not block save. Only shown on work tab (meeting/pk don't count toward streak).
  const resultingStreak = activeType === 'work' ? priorWorkStreak + 1 : 0;
  const showStreakWarning = activeType === 'work' && resultingStreak >= 5;

  const handleSave = () => {
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

  const handleDelete = () => {
    onSave({ employeeId: employee.id, date: toDateKey(date), type: activeType, deleted: true });
    onClose();
  };

  const addTab = (type) => {
    setOpenTabs(prev => { const n = new Set(prev); n.add(type); return n; });
    setActiveType(type);
  };

  const addableTypes = ['work', 'meeting', 'pk'].filter(t => !openTabs.has(t));

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

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {[...openTabs].map(type => {
          const active = type === activeType;
          const tabStyle = type === 'work'
            ? { bg: active ? THEME.accent.blue : THEME.bg.elevated, text: active ? 'white' : THEME.text.primary, border: active ? THEME.accent.blue : THEME.border.default, label: 'Work' }
            : { bg: active ? (EVENT_TYPES[type].text) : EVENT_TYPES[type].bg, text: active ? 'white' : EVENT_TYPES[type].text, border: EVENT_TYPES[type].border, label: EVENT_TYPES[type].label };
          return (
            <button key={type} onClick={() => setActiveType(type)}
              className="px-2 py-1 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: tabStyle.bg, color: tabStyle.text, border: `1px solid ${tabStyle.border}` }}>
              {tabStyle.label}
            </button>
          );
        })}
        {addableTypes.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs" style={{ color: THEME.text.muted }}>+</span>
            {addableTypes.map(type => (
              <button key={type} onClick={() => addTab(type)}
                className="px-1.5 py-1 rounded text-xs flex items-center gap-0.5"
                style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary, border: `1px dashed ${THEME.border.default}` }}>
                <Plus size={10} />{type === 'work' ? 'Work' : EVENT_TYPES[type].label}
              </button>
            ))}
          </div>
        )}
      </div>

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

      <div className="p-2 rounded-lg mb-3 grid grid-cols-2 gap-2 text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>{activeType === 'work' ? 'SHIFT' : activeType === 'meeting' ? 'MEETING' : 'PK'}</span><p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}><AnimatedNumber value={shiftHours} decimals={1} suffix="h" /></p></div>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>PERIOD</span><p className="text-lg font-bold" style={{ color: projectedTotal >= 44 ? THEME.status.error : projectedTotal >= 40 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={projectedTotal} decimals={1} suffix="h" /></p></div>
      </div>

      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {existingThisType && <GradientButton danger small onClick={handleDelete} ariaLabel={`Remove ${activeType}`}><Trash2 size={10} /></GradientButton>}
        <div className="flex gap-2 ml-auto">
          <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
          <GradientButton small onClick={handleSave}><Check size={12} />Save</GradientButton>
        </div>
      </div>
    </Modal>
  );
};
