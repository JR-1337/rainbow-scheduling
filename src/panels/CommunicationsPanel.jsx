import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Eye, AlertCircle, Check, Loader, Save } from 'lucide-react';
import { THEME } from '../theme';
import { getWeekNumber, toDateKey } from '../App';

export const CommunicationsPanel = ({ employees, shifts, dates, periodInfo, adminContacts, announcement, onAnnouncementChange, onSave, onClear, isEditMode, isSaving }) => {
  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);

  const [localAnnouncement, setLocalAnnouncement] = useState(announcement);
  const hasUnsavedChanges = localAnnouncement.subject !== announcement.subject || localAnnouncement.message !== announcement.message;

  useEffect(() => {
    setLocalAnnouncement(announcement);
  }, [announcement.subject, announcement.message]);

  const scheduledCount = useMemo(() => {
    return employees
      .filter(e => e.active && !e.deleted && !e.isOwner)
      .filter(e => !e.isAdmin || e.showOnSchedule)
      .filter(emp => dates.some(d => shifts[`${emp.id}-${toDateKey(d)}`]))
      .length;
  }, [employees, shifts, dates]);

  const handleLocalChange = (newAnn) => {
    setLocalAnnouncement(newAnn);
  };

  const handleSave = () => {
    onAnnouncementChange(localAnnouncement);
    onSave(localAnnouncement);
  };

  const handleClear = () => {
    setLocalAnnouncement({ subject: '', message: '' });
  };

  const handleDiscard = () => {
    setLocalAnnouncement(announcement);
  };

  const isLocked = !isEditMode;
  const hasContent = localAnnouncement.subject || localAnnouncement.message;
  const savedHasContent = announcement.subject || announcement.message;

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: THEME.text.primary }}>
            <MessageSquare size={20} style={{ color: THEME.accent.cyan }} />
            Period Announcement
          </h2>
          <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
            Week {weekNum1} & {weekNum2} • {scheduledCount} staff scheduled
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.error + '20' }}>
              <Eye size={12} style={{ color: THEME.status.error }} />
              <span className="text-xs" style={{ color: THEME.status.error }}>LIVE</span>
            </div>
          )}
          {!isLocked && hasUnsavedChanges && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.warning + '20' }}>
              <AlertCircle size={12} style={{ color: THEME.status.warning }} />
              <span className="text-xs" style={{ color: THEME.status.warning }}>Unsaved</span>
            </div>
          )}
          {!isLocked && !hasUnsavedChanges && savedHasContent && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.status.success + '20' }}>
              <Check size={12} style={{ color: THEME.status.success }} />
              <span className="text-xs" style={{ color: THEME.status.success }}>Saved</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 p-2 rounded-lg text-xs" style={{ backgroundColor: THEME.accent.blue + '10', border: `1px solid ${THEME.accent.blue}30` }}>
        <p style={{ color: THEME.accent.blue }}>
          💡 Appears in <strong>PDF</strong>, <strong>emails</strong>, and <strong>employee dashboard</strong> when period is LIVE.
        </p>
      </div>

      {isLocked && (
        <p className="text-xs mb-3" style={{ color: THEME.text.muted }}>
          📌 Period is LIVE. Switch to Edit Mode to modify.
        </p>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Announcement Title</label>
        <input
          type="text"
          value={localAnnouncement.subject}
          onChange={e => handleLocalChange({ ...localAnnouncement, subject: e.target.value })}
          placeholder="e.g. Staff Meeting This Friday"
          className="w-full px-3 py-2 rounded-lg outline-none text-sm"
          style={{
            backgroundColor: isLocked ? THEME.bg.tertiary : THEME.bg.elevated,
            border: `1px solid ${THEME.border.default}`,
            color: THEME.text.primary,
            opacity: isLocked ? 0.6 : 1,
            cursor: isLocked ? 'not-allowed' : 'text'
          }}
          disabled={isLocked}
        />
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Message</label>
        <textarea
          value={localAnnouncement.message}
          onChange={e => handleLocalChange({ ...localAnnouncement, message: e.target.value })}
          placeholder="Hi team! Just a quick note about..."
          rows={5}
          className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none"
          style={{
            backgroundColor: isLocked ? THEME.bg.tertiary : THEME.bg.elevated,
            border: `1px solid ${THEME.border.default}`,
            color: THEME.text.primary,
            opacity: isLocked ? 0.6 : 1,
            cursor: isLocked ? 'not-allowed' : 'text'
          }}
          disabled={isLocked}
        />
        <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
          {localAnnouncement.message.length} characters
        </p>
      </div>

      {!isLocked && (
        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}
              disabled={!hasContent}
            >
              Clear
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ backgroundColor: THEME.bg.tertiary, color: THEME.status.warning }}
              >
                Discard
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: hasUnsavedChanges ? THEME.accent.blue : THEME.bg.tertiary,
              color: hasUnsavedChanges ? 'white' : THEME.text.muted,
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? (
              <>
                <Loader size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
