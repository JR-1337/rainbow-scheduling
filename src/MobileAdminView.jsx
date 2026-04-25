// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE ADMIN VIEW - Components for mobile-responsive admin interface
// 
// Imported by App.jsx main admin render.
// All shared constants (THEME, ROLES, helpers) imported from App.jsx.
// Reuses MobileScheduleGrid from MobileEmployeeView for the read-only grid.
// Heavy editing (drag/drop, cell editing, auto-populate, settings) stays desktop-only.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, X, Calendar, Star, Eye, LogOut, Shield,
  Loader, ArrowRightLeft, ArrowRight, Bell, Menu, Key, Settings,
  Check, ClipboardList, MessageSquare, User, Save, Mail, AlertCircle, Edit3, BookOpen, FileText, Users
} from 'lucide-react';

import {
  THEME, TYPE, ROLES, ROLES_BY_ID,
  getStoreHoursForDate
} from './App';
import { GradientBackground, haptic } from './components/uiKit';
import { toDateKey, formatDate, formatTimeShort, getDayName, getWeekNumber } from './utils/date';
import { isStatHoliday } from './utils/storeHours';
import { sortBySarviAdminsFTPT, computeDividerIndices } from './utils/employeeSort';

import { MobileScheduleGrid } from './MobileEmployeeView';
import { EVENT_TYPES } from './constants';
import { Button } from './components/Button';
import { hasTitle } from './utils/employeeRender';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MOBILE HAMBURGER DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAdminDrawer = ({
  isOpen, onClose, currentUser, onLogout,
  onOpenChangePassword, onOpenSettings, onOpenOwnRequests, onOpenPK, onExportPDF, onOpenStaff,
  pendingRequestCount = 0
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      
      <div 
        className="absolute top-0 left-0 h-full w-64 sm:w-72 overflow-y-auto"
        style={{ backgroundColor: THEME.bg.secondary, borderRight: `1px solid ${THEME.border.default}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* User Header */}
        <div className="p-4" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" 
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: THEME.accent.text }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: THEME.text.primary }}>
                <Shield size={12} style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.accent.purple }} />
                {currentUser.name}
              </p>
              <p className="text-xs" style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.text.muted }}>
                {currentUser.isOwner ? 'Owner' : 'Admin'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
          {/* Own Shift Changes */}
          <Button
            variant="primary"
            size="md"
            leftIcon={Calendar}
            fullWidth
            onClick={() => { onOpenOwnRequests(); onClose(); }}
            className="hover:opacity-90"
            style={{ justifyContent: 'flex-start', gap: 12 }}
          >
            My Shift Changes
          </Button>
          {/* Schedule PK (bulk) */}
          {onOpenPK && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={BookOpen}
              fullWidth
              onClick={() => { onOpenPK(); onClose(); }}
              style={{ backgroundColor: THEME.event.pkBg, color: THEME.event.pkText, border: `1px solid ${THEME.event.pkBorder}`, justifyContent: 'flex-start', gap: 12 }}
            >
              Schedule PK
            </Button>
          )}
          {/* Staff */}
          {onOpenStaff && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={Users}
              fullWidth
              onClick={() => { onOpenStaff(); onClose(); }}
              style={{ justifyContent: 'flex-start', gap: 12 }}
            >
              Staff
            </Button>
          )}
          {/* Admin Settings */}
          {onOpenSettings && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={Settings}
              fullWidth
              onClick={() => { onOpenSettings(); onClose(); }}
              style={{ justifyContent: 'flex-start', gap: 12 }}
            >
              Admin Settings
            </Button>
          )}
          {/* Export Schedule PDF */}
          {onExportPDF && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={FileText}
              fullWidth
              onClick={() => { onExportPDF(); onClose(); }}
              style={{ justifyContent: 'flex-start', gap: 12 }}
            >
              Export Schedule PDF
            </Button>
          )}
        </div>

        {/* Change Password + Logout */}
        <div className="p-3 space-y-2">
          {onOpenChangePassword && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={Key}
              fullWidth
              onClick={() => { onOpenChangePassword(); onClose(); }}
              style={{ justifyContent: 'flex-start', gap: 12 }}
            >
              Change Password
            </Button>
          )}
          <Button
            variant="destructiveOutline"
            size="md"
            leftIcon={LogOut}
            fullWidth
            onClick={() => { onLogout(); onClose(); }}
            style={{ justifyContent: 'flex-start', gap: 12 }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MOBILE SCHEDULE GRID - Read-only with staffing counters
// Extends the employee grid pattern with staffing target info in headers
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAdminScheduleGrid = ({
  employees, shifts, events = {}, dates, loggedInUser, getEmployeeHours,
  timeOffRequests = [], getScheduledCount, getStaffingTarget,
  staffingTargetOverrides = {}, storeHoursOverrides = {},
  isEditMode = false, onCellClick, onNameClick, onHeaderClick
}) => {
  const scrollContainerRef = React.useRef(null);
  const NAME_COL_WIDTH = 72;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 66;
  const HEADER_HEIGHT = 68; // Taller to fit staffing counter
  
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const sortedEmployees = useMemo(() => sortBySarviAdminsFTPT(employees), [employees]);

  // Indices where a divider should render (bucket transition, skips empty buckets).
  const dividerIndices = useMemo(() => computeDividerIndices(sortedEmployees), [sortedEmployees]);

  const totalWidth = NAME_COL_WIDTH + (dates.length * CELL_WIDTH);
  const todayStr = toDateKey(new Date());

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <div 
        ref={scrollContainerRef}
        className="overflow-auto"
        style={{ maxHeight: 'calc(100vh - 200px)', WebkitOverflowScrolling: 'touch' }}
      >
        <table style={{ width: totalWidth, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {/* Frozen corner */}
              <th style={{ 
                position: 'sticky', left: 0, top: 0, zIndex: 30,
                width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, height: HEADER_HEIGHT,
                backgroundColor: THEME.bg.tertiary, borderBottom: `1px solid ${THEME.border.default}`,
                borderRight: `1px solid ${THEME.border.default}`, padding: '4px'
              }}>
                <span className="text-xs font-semibold" style={{ color: THEME.text.primary }}>Staff</span>
              </th>
              
              {/* Day headers with staffing counters */}
              {dates.map((date, i) => {
                const dateStr = toDateKey(date);
                const isToday = dateStr === todayStr;
                const hol = isStatHoliday(date);
                const sh = getStoreHoursForDate(date);
                const isPast = dateStr < todayStr;
                const scheduled = getScheduledCount ? getScheduledCount(date) : 0;
                const target = getStaffingTarget ? getStaffingTarget(date) : 0;
                const atTarget = scheduled >= target;
                const overTarget = scheduled > target;
                const hasOverride = !!storeHoursOverrides[dateStr] || staffingTargetOverrides[dateStr] !== undefined;
                
                const canEditHeader = isEditMode && !isPast && typeof onHeaderClick === 'function';
                return (
                  <th key={i}
                    onClick={canEditHeader ? () => onHeaderClick(date) : undefined}
                    aria-label={canEditHeader ? `Edit ${dateStr} hours and target` : undefined}
                    style={{
                      position: 'sticky', top: 0, zIndex: 20,
                      width: CELL_WIDTH, minWidth: CELL_WIDTH, height: HEADER_HEIGHT,
                      background: isToday
                        ? `linear-gradient(${THEME.accent.purple}20, ${THEME.accent.purple}20), ${THEME.bg.tertiary}`
                        : hol
                          ? `linear-gradient(${THEME.status.warning}15, ${THEME.status.warning}15), ${THEME.bg.tertiary}`
                          : THEME.bg.tertiary,
                      borderBottom: isToday ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : `1px solid ${THEME.border.default}`,
                      padding: '2px', textAlign: 'center',
                      cursor: canEditHeader ? 'pointer' : 'default',
                    }}>
                    {canEditHeader && (
                      <Edit3
                        size={9}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          color: THEME.accent.cyan,
                          opacity: 0.7,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <p className="font-semibold" style={{ color: isToday ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary, fontSize: '10px' }}>
                      {getDayName(date).slice(0, 3)}
                    </p>
                    <p className="font-bold" style={{ color: THEME.text.primary, fontSize: '13px' }}>{date.getDate()}</p>
                    <p style={{ color: hasOverride ? THEME.accent.cyan + 'CC' : THEME.text.muted, fontSize: '8px' }}>
                      {formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}
                    </p>
                    <p style={{ fontSize: '9px', marginTop: '1px' }}>
                      {isPast ? (
                        <span style={{ color: THEME.text.muted }}>{scheduled}</span>
                      ) : (
                        <>
                          <span style={{ color: overTarget ? THEME.status.error + 'AA' : atTarget ? THEME.status.success + '99' : THEME.text.muted }}>{scheduled}</span>
                          <span style={{ color: hasOverride ? THEME.accent.cyan + '99' : THEME.text.muted }}>/{target}</span>
                        </>
                      )}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((emp, empIndex) => {
              const isLoggedIn = emp.id === loggedInUser.id;
              const weekHours = getEmployeeHours(emp.id);
              const showDivider = dividerIndices.has(empIndex);
              
              return (
                <React.Fragment key={emp.id}>
                  {showDivider && (
                    <tr>
                      <td colSpan={dates.length + 1} style={{ height: 6, padding: 0 }}>
                        <div style={{ height: 1, margin: '2px 8px', backgroundColor: THEME.border.default }} />
                      </td>
                    </tr>
                  )}
                  <tr style={isLoggedIn ? { outline: `2px solid ${THEME.accent.purple}40`, outlineOffset: -1, borderRadius: 4 } : {}}>
                  {/* Frozen name column */}
                  <td 
                    onClick={() => onNameClick && onNameClick(emp)}
                    style={{ 
                    position: 'sticky', left: 0, zIndex: 10,
                    width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, height: CELL_HEIGHT,
                    backgroundColor: THEME.bg.secondary,
                    borderBottom: `1px solid ${THEME.border.subtle}`,
                    borderRight: `1px solid ${THEME.border.default}`,
                    padding: '4px',
                    cursor: onNameClick ? 'pointer' : 'default'
                  }}>
                    <p className="font-semibold truncate" style={{ color: onNameClick ? THEME.accent.cyan : THEME.text.primary, fontSize: '10px', lineHeight: 1.2 }}>{emp.name.split(' ')[0]}</p>
                    <p className="truncate" style={{ color: THEME.text.muted, fontSize: '9px', lineHeight: 1.2 }}>{emp.name.split(' ').slice(1).join(' ')}</p>
                    <p style={{ color: THEME.accent.cyan, fontSize: '9px', lineHeight: 1.2 }}>{weekHours.toFixed(1)}h{emp.isAdmin ? ' ★' : ''}</p>
                  </td>
                  
                  {/* Day cells */}
                  {dates.map((date, i) => {
                    const dateStr = toDateKey(date);
                    const shift = shifts[`${emp.id}-${dateStr}`];
                    // Defensive: unknown event types are silently hidden so a malformed
                    // Sheet row can't crash the grid.
                    const cellEvents = (events[`${emp.id}-${dateStr}`] || []).filter(ev => EVENT_TYPES[ev.type]);
                    const hasEvents = cellEvents.length > 0;
                    const firstEvent = hasEvents ? cellEvents[0] : null;
                    const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
                    const eventOnly = !shift && hasEvents;
                    const hasSick = cellEvents.some(ev => ev.type === 'sick');

                    const approvedTimeOff = timeOffRequests.some(r =>
                      r.email === emp.email && r.status === 'approved' &&
                      r.datesRequested?.split(',').includes(dateStr)
                    );

                    const dayName = getDayName(date).toLowerCase();
                    const avail = emp.availability?.[dayName];
                    const isUnavailable = avail && !avail.available;
                    const role = shift ? ROLES_BY_ID[shift.role] : null;
                    const isTitled = hasTitle(emp);
                    const titleLabel = isTitled ? (emp.title || '') : '';
                    const labelText = shift ? (isTitled ? titleLabel : role?.name) : '';
                    const labelColor = shift ? (isTitled ? THEME.text.primary : role?.color) : THEME.text.muted;

                    return (
                      <td key={i}
                        onClick={() => isEditMode && onCellClick && onCellClick(emp, date, shift || null)}
                        style={{
                          width: CELL_WIDTH, minWidth: CELL_WIDTH, height: CELL_HEIGHT,
                          backgroundColor: THEME.bg.secondary,
                          borderBottom: `1px solid ${THEME.border.subtle}`,
                          padding: '2px',
                          cursor: isEditMode ? 'pointer' : 'default'
                        }}>
                        <div className="h-full rounded-md relative overflow-hidden" style={{
                          backgroundColor: hasSick ? EVENT_TYPES.sick.bg
                            : approvedTimeOff ? THEME.text.muted + '15'
                            : isUnavailable && !shift && !hasEvents ? THEME.bg.tertiary
                            : shift && isTitled ? THEME.bg.tertiary
                            : shift ? role?.color + '25'
                            : eventOnly ? firstEventType.bg
                            : THEME.bg.tertiary,
                          border: `1px solid ${hasSick ? EVENT_TYPES.sick.border
                            : approvedTimeOff ? THEME.text.muted + '30'
                            : isUnavailable && !shift && !hasEvents ? THEME.border.subtle
                            : shift && isTitled ? THEME.border.default
                            : shift ? role?.color + '50'
                            : eventOnly ? firstEventType.border
                            : THEME.border.default}`,
                          opacity: approvedTimeOff ? 0.7 : isUnavailable && !shift && !hasEvents ? 0.5 : 1,
                          height: CELL_HEIGHT - 4
                        }}>
                          {hasSick && (
                            <div aria-hidden="true"
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: 'linear-gradient(to top right, transparent calc(50% - 1px), #DC2626 calc(50% - 1px), #DC2626 calc(50% + 1px), transparent calc(50% + 1px))',
                              }} />
                          )}
                          {approvedTimeOff && !shift && !hasEvents ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '9px' }}>Time Off</span>
                            </div>
                          ) : isUnavailable && !shift && !hasEvents ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '8px' }}>N/A</span>
                            </div>
                          ) : shift ? (
                            <div className="p-1 h-full flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-semibold truncate" style={{ color: hasSick ? THEME.text.muted : labelColor, textDecoration: hasSick ? 'line-through' : 'none', fontSize: '10px' }}>{labelText}</span>
                                {hasEvents && (
                                  <div className="flex gap-0.5 shrink-0">
                                    {cellEvents.length >= 3 ? (
                                      <span
                                        title={cellEvents.map(ev => {
                                          const et = EVENT_TYPES[ev.type];
                                          return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
                                        }).join('\n')}
                                        className="rounded font-semibold leading-tight"
                                        style={{ backgroundColor: firstEventType.bg, color: firstEventType.text, border: `1px solid ${firstEventType.border}`, fontSize: '8px', padding: '0 2px' }}>
                                        {cellEvents.length} events
                                      </span>
                                    ) : (
                                      cellEvents.map((ev, j) => {
                                        const et = EVENT_TYPES[ev.type];
                                        if (!et) return null;
                                        return (
                                          <span key={j}
                                            title={`${et.label} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`}
                                            className="rounded font-semibold leading-tight"
                                            style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}`, fontSize: '8px', padding: '0 2px' }}>
                                            {et.shortLabel} {formatTimeShort(ev.startTime)}
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                              {hasSick && cellEvents.find(ev => ev.type === 'sick')?.note ? (
                                <span className="italic truncate block" style={{ color: THEME.text.muted, fontSize: '9px' }} title={cellEvents.find(ev => ev.type === 'sick').note}>
                                  {cellEvents.find(ev => ev.type === 'sick').note}
                                </span>
                              ) : (
                                <>
                                  <div>
                                    <span style={{ color: THEME.text.muted, textDecoration: hasSick ? 'line-through' : 'none', fontSize: '9px' }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium" style={{ color: THEME.text.muted, textDecoration: hasSick ? 'line-through' : 'none', fontSize: '9px' }}>{hasSick ? '0' : shift.hours}h</span>
                                    {shift.task && (
                                      <Star size={8} fill={THEME.task} color={THEME.task} />
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : eventOnly ? (
                            <div className="p-1 h-full flex flex-col justify-between"
                              title={cellEvents.map(ev => {
                                const et = EVENT_TYPES[ev.type];
                                return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
                              }).join('\n')}>
                              {cellEvents.length === 2 ? (
                                <div className="flex flex-col gap-0.5">
                                  {cellEvents.map((ev, i) => {
                                    const et = EVENT_TYPES[ev.type] || firstEventType;
                                    return (
                                      <div key={i} className="flex items-center gap-0.5">
                                        <span className="rounded font-semibold leading-tight" style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}`, fontSize: '8px', padding: '0 2px' }}>{et.shortLabel}</span>
                                        <span style={{ color: et.text, opacity: 0.8, fontSize: '7px' }}>{formatTimeShort(ev.startTime)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <>
                                  <span className="font-semibold truncate" style={{ color: firstEventType.text, fontSize: '10px' }}>
                                    {cellEvents.length === 1 ? firstEventType.shortLabel : `${cellEvents.length} events`}
                                  </span>
                                  <span style={{ color: firstEventType.text, opacity: 0.8, fontSize: '9px' }}>
                                    {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE ANNOUNCEMENT VIEWER/EDITOR
// Simplified: view current announcement, edit subject/message
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAnnouncementPanel = ({ 
  announcement, onAnnouncementChange, onSave, onClear, isEditMode, isSaving 
}) => {
  const [localAnn, setLocalAnn] = useState(announcement);
  const hasChanges = localAnn.subject !== announcement.subject || localAnn.message !== announcement.message;
  
  React.useEffect(() => {
    setLocalAnn(announcement);
  }, [announcement.subject, announcement.message]);
  
  // Read-only when schedule is LIVE (not in edit mode)
  if (!isEditMode) {
    return (
      <div className="rounded-xl p-3" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.accent.cyan }}>
            <MessageSquare size={14} />
            Announcement
          </h3>
          {announcement.message && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.accent.blue + '20', color: THEME.accent.blue }}>Active</span>
          )}
        </div>
        {announcement.message ? (
          <div className="space-y-1.5">
            {announcement.subject && <p className="text-xs font-semibold" style={{ color: THEME.text.primary }}>{announcement.subject}</p>}
            <p className="text-xs" style={{ color: THEME.text.secondary, lineHeight: 1.5 }}>{announcement.message}</p>
          </div>
        ) : (
          <p className="text-xs" style={{ color: THEME.text.muted }}>No announcement for this period.</p>
        )}
        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
          <p className="text-xs flex items-center gap-1.5" style={{ color: THEME.text.muted }}>
            <Edit3 size={12} /> Enter Edit Mode to modify announcements
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.accent.cyan }}>
          <MessageSquare size={14} />
          Announcement
        </h3>
        {localAnn.message && !hasChanges && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.accent.blue + '20', color: THEME.accent.blue }}>Active</span>
        )}
      </div>
      
      <div className="space-y-2">
        <input
          type="text"
          value={localAnn.subject}
          onChange={e => setLocalAnn({ ...localAnn, subject: e.target.value })}
          placeholder="Subject (optional)"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-xs"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
        />
        <textarea
          value={localAnn.message}
          onChange={e => setLocalAnn({ ...localAnn, message: e.target.value })}
          placeholder="Write an announcement for this pay period..."
          rows={3}
          className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, lineHeight: 1.5 }}
        />
      </div>
      
      <div className="flex justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {localAnn.message ? (
          <button 
            onClick={() => { setLocalAnn({ subject: '', message: '' }); onClear(); }}
            className="text-xs px-2 py-1 rounded"
            style={{ color: THEME.status.error }}
            disabled={isSaving}
          >
            Clear
          </button>
        ) : <div />}
        <button
          onClick={() => { onAnnouncementChange(localAnn); onSave(localAnn); }}
          disabled={!hasChanges || isSaving}
          className="text-xs px-3 py-1 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: THEME.accent.text }}
        >
          {isSaving ? <><Loader size={12} className="animate-spin" /> Saving...</> : <><Save size={12} /> Save</>}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EMPLOYEE QUICK VIEW - Tap employee name to see contact info
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileEmployeeQuickView = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;
  
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div 
        className="relative w-full max-w-sm rounded-t-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" 
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: THEME.accent.text }}>
              {employee.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{employee.name}</p>
              <p className="text-xs" style={{ color: employee.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                {employee.isAdmin ? 'Admin' : ''}{employee.isAdmin && ' · '}{employee.employmentType === 'full-time' ? 'Full-Time' : 'Part-Time'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>
        </div>
        
        <div className="p-4 space-y-1.5">
          {employee.email && (
            <a href={`mailto:${employee.email}`} className="flex items-center gap-2 text-xs p-2.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.accent.cyan }}>
              <Mail size={14} /> {employee.email}
            </a>
          )}
          {employee.phone && (
            <a href={`tel:${employee.phone}`} className="flex items-center gap-2 text-xs p-2.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.accent.cyan }}>
              <User size={14} /> {employee.phone}
            </a>
          )}
          {!employee.email && !employee.phone && (
            <p className="text-xs py-2" style={{ color: THEME.text.muted }}>No contact info on file</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE ADMIN BOTTOM TAB BAR (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAdminBottomNav = ({ activeTab, onTabChange, pendingCount = 0 }) => {
  const tabs = [
    { key: 'schedule', icon: Calendar, label: 'Schedule' },
    { key: 'requests', icon: ClipboardList, label: 'Requests', badge: pendingCount > 0, badgeCount: pendingCount },
    { key: 'comms', icon: MessageSquare, label: 'Comms' },
    { key: 'more', icon: Menu, label: 'More' },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t"
      style={{
        backgroundColor: THEME.bg.secondary,
        borderColor: THEME.border.subtle,
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      aria-label="Primary"
    >
      <div className="flex justify-around items-stretch h-14">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { haptic(); onTabChange(tab.key); }}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[44px]"
              style={{ color: active ? THEME.accent.blue : THEME.text.muted }}
              aria-label={tab.badgeCount ? `${tab.label} (${tab.badgeCount} pending)` : tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.badge && (
                  <div
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#F87171', fontSize: '9px', fontWeight: 700, color: '#FFFFFF' }}
                  >
                    {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
                  </div>
                )}
              </div>
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
