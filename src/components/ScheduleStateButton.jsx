import React from 'react';
import { Save, Eye, Loader, Edit3 } from 'lucide-react';
import { THEME } from '../theme';

// Unified three-state schedule button (mobile + desktop):
//   isEditMode && unsaved -> Save  (brand gradient, pulses to save)
//   isEditMode && !unsaved -> Go Live  (success tonal)
//   !isEditMode -> Go Edit  (warning tonal)
// Single sizing reads cleanly at mobile (390px) and desktop.
export default function ScheduleStateButton({
  isEditMode,
  unsaved,
  scheduleSaving,
  onSave,
  onToggleEdit
}) {
  const base = 'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

  if (isEditMode && unsaved) {
    return (
      <button
        onClick={onSave}
        disabled={scheduleSaving}
        className={base + ' font-bold'}
        style={{
          background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
          color: THEME.accent.text,
          boxShadow: `0 0 10px ${THEME.accent.blue}50`
        }}
        title="Save changes (schedule stays hidden from employees)"
      >
        {scheduleSaving
          ? <><div className="rainbow-spinner" style={{ width: 11, height: 11, borderWidth: 2 }} /><span>Saving...</span></>
          : <><Save size={11} /><span>Save</span></>}
      </button>
    );
  }

  if (isEditMode) {
    return (
      <button
        onClick={onToggleEdit}
        disabled={scheduleSaving}
        className={base}
        style={{
          backgroundColor: THEME.status.success + '20',
          color: THEME.status.success,
          border: `1px solid ${THEME.status.success}50`
        }}
        title="Publish schedule — employees will see it"
      >
        {scheduleSaving
          ? <><Loader size={11} className="animate-spin" /><span>Going Live...</span></>
          : <><Eye size={11} /><span>Go Live</span></>}
      </button>
    );
  }

  return (
    <button
      onClick={onToggleEdit}
      disabled={scheduleSaving}
      className={base}
      style={{
        backgroundColor: THEME.status.warning + '20',
        color: THEME.status.warning,
        border: `1px solid ${THEME.status.warning}50`
      }}
      title="Go to edit mode (employees won't see changes)"
    >
      <Edit3 size={11} />
      <span>Go Edit</span>
    </button>
  );
}
