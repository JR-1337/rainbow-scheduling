import { useState, useMemo, useEffect } from 'react';
import { Zap, Trash2, Users, Crown, Briefcase, Clock } from 'lucide-react';
import { AdaptiveModal } from '../components/AdaptiveModal';
import { THEME } from '../theme';
import { sortBySarviAdminsFTPT, computeDividerIndices, employeeBucket } from '../utils/employeeSort';

// Unified auto-fill / auto-clear modal (replaces the two desktop dropdowns and the
// mobile two-level Fill/Clear sheet branches).
// Pure presentational + selection-state. Delegates work to onConfirm({ mode, empIds }).
export const AutofillClearModal = ({
  isOpen,
  onClose,
  schedulableEmployees,      // already filtered list (showOnSchedule + active)
  weekDates,                 // current visible week
  employeeHasShiftsInWeek,   // existing helper
  onConfirm,                 // ({ mode, empIds }) => void
}) => {
  const [mode, setMode] = useState('fill');
  const [selected, setSelected] = useState(new Set());

  // On open: reset mode to 'fill' and seed checkboxes from current grid state.
  useEffect(() => {
    if (!isOpen) return;
    setMode('fill');
    setSelected(new Set(
      schedulableEmployees
        .filter(e => employeeHasShiftsInWeek(e, weekDates))
        .map(e => e.id)
    ));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => sortBySarviAdminsFTPT(schedulableEmployees), [schedulableEmployees]);
  const dividers = useMemo(() => computeDividerIndices(sorted), [sorted]);

  const bucketIds = (bucketName) => {
    if (bucketName === 'all') return sorted.map(e => e.id);
    if (bucketName === 'admin') return sorted.filter(e => employeeBucket(e) <= 2).map(e => e.id);
    if (bucketName === 'ft') return sorted.filter(e => employeeBucket(e) === 3).map(e => e.id);
    if (bucketName === 'pt') return sorted.filter(e => employeeBucket(e) === 4).map(e => e.id);
    return [];
  };

  const bucketAllSelected = (name) => {
    const ids = bucketIds(name);
    if (ids.length === 0) return false;
    return ids.every(id => selected.has(id));
  };

  const toggleBucket = (name) => {
    const ids = bucketIds(name);
    if (ids.length === 0) return;
    const allOn = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allOn) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleEmployee = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm({ mode, empIds: Array.from(selected) });
    onClose();
  };

  const PRESETS = [
    { name: 'all',   label: 'All',       Icon: Users },
    { name: 'admin', label: 'Admin',     Icon: Crown },
    { name: 'ft',    label: 'Full-time', Icon: Briefcase },
    { name: 'pt',    label: 'Part-time', Icon: Clock },
  ];

  const isFill = mode === 'fill';
  const confirmBg = isFill ? THEME.status.success : THEME.status.error;

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-Fill / Auto-Clear"
    >
      <div className="flex flex-col gap-3" style={{ minWidth: 280 }}>

        {/* Mode toggle — segmented pill control */}
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${THEME.border.default}` }}>
          <button
            type="button"
            onClick={() => setMode('fill')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: isFill ? THEME.status.success + '30' : THEME.bg.elevated,
              color: isFill ? THEME.status.success : THEME.text.muted,
              borderRight: `1px solid ${THEME.border.default}`,
            }}
            aria-pressed={isFill}
          >
            <Zap size={13} />
            FILL
          </button>
          <button
            type="button"
            onClick={() => setMode('clear')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: !isFill ? THEME.status.error + '20' : THEME.bg.elevated,
              color: !isFill ? THEME.status.error : THEME.text.muted,
            }}
            aria-pressed={!isFill}
          >
            <Trash2 size={13} />
            CLEAR
          </button>
        </div>

        {/* Preset row — additive bucket toggles */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: THEME.text.muted }}>
            Preset
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(({ name, label, Icon }) => {
              const active = bucketAllSelected(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleBucket(name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? THEME.accent.blue + '25' : THEME.bg.elevated,
                    color: active ? THEME.accent.blue : THEME.text.secondary,
                    border: `1px solid ${active ? THEME.accent.blue + '80' : THEME.border.default}`,
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Employee list with dividers */}
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: THEME.text.muted }}>
            Employees ({selected.size} selected)
          </p>
          <div
            className="overflow-y-auto rounded-lg"
            style={{
              maxHeight: 280,
              border: `1px solid ${THEME.border.default}`,
              backgroundColor: THEME.bg.elevated,
            }}
          >
            {sorted.map((emp, idx) => (
              <div key={emp.id}>
                {dividers.has(idx) && (
                  <div style={{ height: 1, margin: '4px 0', backgroundColor: THEME.border.subtle }} />
                )}
                <label
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:opacity-80"
                  style={{ color: THEME.text.primary }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    className="rounded"
                    style={{ accentColor: THEME.accent.blue, width: 14, height: 14 }}
                  />
                  <span className="text-sm flex-1">{emp.name}</span>
                  {emp.isAdmin && (
                    <span className="text-[10px]" style={{ color: THEME.text.muted }}>Admin</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: confirmBg,
            color: '#FFFFFF',
            opacity: selected.size === 0 ? 0.4 : 1,
          }}
        >
          {isFill
            ? `Auto-Fill ${selected.size} employee${selected.size === 1 ? '' : 's'}`
            : `Clear ${selected.size} employee${selected.size === 1 ? '' : 's'}`}
        </button>

      </div>
    </AdaptiveModal>
  );
};
