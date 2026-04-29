import React, { useState, useRef } from 'react';
import { X, Loader, Check } from 'lucide-react';
import { THEME } from '../theme';
import { toDateKey } from '../utils/date';
import { useIsMobile, MobileBottomSheet } from '../MobileEmployeeView';
import { GradientButton } from './primitives';
import { useFocusTrap } from '../hooks/useFocusTrap';

const TimeInput = ({ ariaLabel, value, onChange }) => (
  <input
    aria-label={ariaLabel}
    type="time" value={value} onChange={e => onChange(e.target.value)}
    className="flex-1 px-1.5 py-1 rounded-lg outline-none text-sm"
    style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
  />
);

export const ColumnHeaderEditor = ({ date, storeHours, target, storeHoursOverrides, staffingTargetOverrides, onSave, onClose }) => {
  const isMobile = useIsMobile();
  const popoverRef = useRef(null);
  useFocusTrap(popoverRef, !isMobile);
  const dateStr = toDateKey(date);
  const today = toDateKey(new Date());
  const isPast = dateStr < today;
  const dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const hasHoursOverride = !!storeHoursOverrides[dateStr];
  const hasTargetOverride = staffingTargetOverrides[dateStr] !== undefined;

  const [openTime, setOpenTime] = useState(storeHours.open);
  const [closeTime, setCloseTime] = useState(storeHours.close);
  const [editTarget, setEditTarget] = useState(target);
  const [saving, setSaving] = useState(false);

  const hoursChanged = openTime !== storeHours.open || closeTime !== storeHours.close;
  const targetChanged = editTarget !== target;
  const hasChanges = hoursChanged || targetChanged;

  const handleSave = async () => {
    setSaving(true);
    await onSave(dateStr, { open: openTime, close: closeTime }, editTarget);
    setSaving(false);
    onClose();
  };

  const handleReset = async () => {
    setSaving(true);
    await onSave(dateStr, null, null);
    setSaving(false);
    onClose();
  };

  const body = (
    <>
        {!isMobile && (
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold" style={{ color: THEME.text.primary }}>{dayLabel}</h3>
            <button data-close aria-label="Close" onClick={onClose} className="p-0.5 rounded hover:opacity-70"><X size={14} style={{ color: THEME.text.muted }} /></button>
          </div>
        )}

        {isPast ? (
          <p className="text-xs py-2" style={{ color: THEME.text.muted }}>Past dates cannot be edited.</p>
        ) : (
          <>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Store Hours
                {hasHoursOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <div className="flex items-center gap-1.5">
                <TimeInput ariaLabel="Store open time" value={openTime} onChange={setOpenTime} />
                <span className="text-xs" style={{ color: THEME.text.muted }}>to</span>
                <TimeInput ariaLabel="Store close time" value={closeTime} onChange={setCloseTime} />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Staffing Target
                {hasTargetOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <input
                aria-label="Staffing target"
                type="number" min="0" max="99" value={editTarget} onChange={e => setEditTarget(parseInt(e.target.value, 10) || 0)}
                className="w-20 px-1.5 py-1 rounded-lg outline-none text-sm text-center"
                style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>

            <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
              {(hasHoursOverride || hasTargetOverride) ? (
                <button onClick={handleReset} disabled={saving} className="text-xs px-2 py-1 rounded hover:opacity-80" style={{ color: THEME.status.warning }}>
                  Reset to Default
                </button>
              ) : <div />}
              <div className="flex gap-1.5">
                <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
                <GradientButton small onClick={handleSave} disabled={!hasChanges || saving}>
                  {saving ? <Loader size={10} className="animate-spin" /> : <Check size={10} />}
                  {saving ? 'Saving...' : 'Save'}
                </GradientButton>
              </div>
            </div>
          </>
        )}
    </>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet isOpen={true} onClose={onClose} title={dayLabel}>
        {body}
      </MobileBottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 flex items-start justify-center pt-24" style={{ zIndex: 100000 }} onClick={onClose}>
      <div
        ref={popoverRef}
        className="rounded-xl shadow-2xl p-3 w-64"
        style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.bright}` }}
        onClick={e => e.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
};
