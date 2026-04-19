import React from 'react';
import { Save, Eye, Loader, Edit3 } from 'lucide-react';
import { THEME } from '../theme';

// Desktop three-state schedule button: Save (unsaved edits) -> Go Live (saved)
// -> Go Edit (live). Pure presentational; parent owns handlers + state flags.
export default function ScheduleStateButton({
  isEditMode,
  unsaved,
  scheduleSaving,
  onSave,
  onToggleEdit
}) {
  if (isEditMode && unsaved) {
    return (
      <button
        onClick={onSave}
        disabled={scheduleSaving}
        className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
          color: THEME.accent.text,
          boxShadow: `0 0 12px ${THEME.accent.blue}50`
        }}
        title="Save changes (schedule stays hidden from employees)"
      >
        {scheduleSaving
          ? <><div className="rainbow-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /><span>SAVING...</span></>
          : <><Save size={12} /><span>SAVE</span></>}
      </button>
    );
  }

  if (isEditMode) {
    return (
      <button
        onClick={onToggleEdit}
        disabled={scheduleSaving}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          backgroundColor: THEME.status.success + '20',
          color: THEME.status.success,
          border: `1px solid ${THEME.status.success}50`
        }}
        title="Publish schedule — employees will see it"
      >
        {scheduleSaving
          ? <><Loader size={12} className="animate-spin" /><span>GOING LIVE...</span></>
          : <><Eye size={12} /><span>GO LIVE</span></>}
      </button>
    );
  }

  return (
    <button
      onClick={onToggleEdit}
      disabled={scheduleSaving}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        backgroundColor: THEME.status.warning + '20',
        color: THEME.status.warning,
        border: `1px solid ${THEME.status.warning}50`
      }}
      title="Go to edit mode (employees won't see changes)"
    >
      <Edit3 size={12} />
      <span>GO EDIT</span>
    </button>
  );
}
