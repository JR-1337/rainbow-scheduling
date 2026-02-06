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
  Check, ClipboardList, MessageSquare, User, Save, Mail, AlertCircle, Edit3
} from 'lucide-react';

import { 
  THEME, ROLES, formatDate, formatTimeShort, getDayName, getWeekNumber, 
  getStoreHoursForDate, isStatHoliday, GradientBackground 
} from './App';

import { MobileScheduleGrid } from './MobileEmployeeView';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN MOBILE HAMBURGER DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAdminDrawer = ({ 
  isOpen, onClose, currentUser, onLogout, 
  onOpenChangePassword, onOpenSettings, onOpenOwnRequests,
  pendingRequestCount = 0
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />
      
      <div 
        className="absolute top-0 left-0 h-full w-72 overflow-y-auto"
        style={{ backgroundColor: THEME.bg.secondary, borderRight: `1px solid ${THEME.border.default}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* User Header */}
        <div className="p-4" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" 
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: '#fff' }}>
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
          <button
            onClick={() => { onOpenOwnRequests(); onClose(); }}
            className="w-full px-4 py-3 text-sm font-medium rounded-lg flex items-center gap-3 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
          >
            <Calendar size={16} />
            My Shift Changes
          </button>
        </div>
        
        {/* Info */}
        <div className="p-3" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
          <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: THEME.text.muted }}>MOBILE VIEW</p>
            <p className="text-xs" style={{ color: THEME.text.secondary, lineHeight: 1.5 }}>
              Schedule editing, employee management, and settings are available on desktop.
            </p>
          </div>
        </div>
        
        {/* Change Password + Logout */}
        <div className="p-3 space-y-2">
          {onOpenChangePassword && (
            <button
              onClick={() => { onOpenChangePassword(); onClose(); }}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center gap-3"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary, border: `1px solid ${THEME.border.default}` }}
            >
              <Key size={16} />
              Change Password
            </button>
          )}
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full px-4 py-3 text-sm font-medium rounded-lg flex items-center gap-3"
            style={{ backgroundColor: THEME.bg.tertiary, color: THEME.status.error, border: `1px solid ${THEME.status.error}30` }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
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
  employees, shifts, dates, loggedInUser, getEmployeeHours, 
  timeOffRequests = [], getScheduledCount, getStaffingTarget,
  staffingTargetOverrides = {}, storeHoursOverrides = {},
  isEditMode = false, onCellClick
}) => {
  const scrollContainerRef = React.useRef(null);
  const NAME_COL_WIDTH = 90;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 56;
  const HEADER_HEIGHT = 68; // Taller to fit staffing counter
  
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      if (a.isAdmin && a.showOnSchedule && !(b.isAdmin && b.showOnSchedule)) return -1;
      if (b.isAdmin && b.showOnSchedule && !(a.isAdmin && a.showOnSchedule)) return 1;
      if (a.id === loggedInUser.id && !(b.isAdmin && b.showOnSchedule)) return -1;
      if (b.id === loggedInUser.id && !(a.isAdmin && a.showOnSchedule)) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [employees, loggedInUser.id]);

  const totalWidth = NAME_COL_WIDTH + (dates.length * CELL_WIDTH);
  const todayStr = new Date().toISOString().split('T')[0];

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
                const dateStr = date.toISOString().split('T')[0];
                const isToday = dateStr === todayStr;
                const hol = isStatHoliday(date);
                const sh = getStoreHoursForDate(date);
                const isPast = dateStr < todayStr;
                const scheduled = getScheduledCount ? getScheduledCount(date) : 0;
                const target = getStaffingTarget ? getStaffingTarget(date) : 0;
                const atTarget = scheduled >= target;
                const overTarget = scheduled > target;
                const hasOverride = !!storeHoursOverrides[dateStr] || staffingTargetOverrides[dateStr] !== undefined;
                
                return (
                  <th key={i} style={{ 
                    position: 'sticky', top: 0, zIndex: 20,
                    width: CELL_WIDTH, minWidth: CELL_WIDTH, height: HEADER_HEIGHT,
                    backgroundColor: isToday ? THEME.accent.purple + '20' : hol ? THEME.status.warning + '15' : THEME.bg.tertiary,
                    borderBottom: isToday ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : `1px solid ${THEME.border.default}`,
                    padding: '2px', textAlign: 'center'
                  }}>
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
            {sortedEmployees.map((emp) => {
              const isLoggedIn = emp.id === loggedInUser.id;
              const weekHours = getEmployeeHours(emp.id);
              
              return (
                <tr key={emp.id} style={isLoggedIn ? { outline: `2px solid ${THEME.accent.purple}40`, outlineOffset: -1, borderRadius: 4 } : {}}>
                  {/* Frozen name column */}
                  <td style={{ 
                    position: 'sticky', left: 0, zIndex: 10,
                    width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, height: CELL_HEIGHT,
                    backgroundColor: THEME.bg.secondary,
                    borderBottom: `1px solid ${THEME.border.subtle}`,
                    borderRight: `1px solid ${THEME.border.default}`,
                    padding: '4px'
                  }}>
                    <p className="font-semibold truncate" style={{ color: THEME.text.primary, fontSize: '11px' }}>{emp.name}</p>
                    <p style={{ color: THEME.accent.cyan, fontSize: '9px' }}>{weekHours.toFixed(1)}h</p>
                    {emp.isAdmin && <Shield size={8} style={{ color: THEME.accent.purple, marginTop: 1 }} />}
                  </td>
                  
                  {/* Day cells */}
                  {dates.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const shift = shifts[`${emp.id}-${dateStr}`];
                    
                    const approvedTimeOff = timeOffRequests.some(r => 
                      r.email === emp.email && r.status === 'approved' && 
                      r.datesRequested?.split(',').includes(dateStr)
                    );
                    
                    const dayName = getDayName(date).toLowerCase();
                    const avail = emp.availability?.[dayName];
                    const isUnavailable = avail && !avail.available;
                    const role = shift ? ROLES.find(r => r.id === shift.role) : null;
                    
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
                          backgroundColor: approvedTimeOff ? THEME.text.muted + '15' 
                            : isUnavailable && !shift ? THEME.bg.primary 
                            : shift ? role?.color + '25' : THEME.bg.tertiary,
                          border: `1px solid ${approvedTimeOff ? THEME.text.muted + '30' 
                            : isUnavailable && !shift ? THEME.border.subtle 
                            : shift ? role?.color + '50' : THEME.border.default}`,
                          opacity: approvedTimeOff ? 0.7 : isUnavailable && !shift ? 0.5 : 1,
                          height: CELL_HEIGHT - 4
                        }}>
                          {approvedTimeOff && !shift ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '9px' }}>Time Off</span>
                            </div>
                          ) : isUnavailable && !shift ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '8px' }}>N/A</span>
                            </div>
                          ) : shift ? (
                            <div className="p-1 h-full flex flex-col justify-between">
                              <span className="font-semibold truncate" style={{ color: role?.color, fontSize: '10px' }}>{role?.name}</span>
                              <div>
                                <span style={{ color: THEME.text.secondary, fontSize: '9px' }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-medium" style={{ color: THEME.text.muted, fontSize: '9px' }}>{shift.hours}h</span>
                                {shift.task && (
                                  <Star size={8} fill={THEME.task} color={THEME.task} />
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
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
          style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
        >
          {isSaving ? <><Loader size={10} className="animate-spin" /> Saving...</> : <><Save size={10} /> Save</>}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EMPLOYEE QUICK VIEW - Tap employee name to see hours + contact
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileEmployeeQuickView = ({ isOpen, onClose, employee, periodHours, weekHours }) => {
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
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: '#fff' }}>
              {employee.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{employee.name}</p>
              {employee.isAdmin && <span className="text-xs" style={{ color: THEME.accent.purple }}>Admin</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Hours */}
          <div className="flex gap-3">
            <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
              <p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}>{weekHours?.toFixed(1) || '0.0'}</p>
              <p className="text-xs" style={{ color: THEME.text.muted }}>This week</p>
            </div>
            <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
              <p className="text-lg font-bold" style={{ color: THEME.accent.purple }}>{periodHours?.toFixed(1) || '0.0'}</p>
              <p className="text-xs" style={{ color: THEME.text.muted }}>Period total</p>
            </div>
          </div>
          
          {/* Contact */}
          <div className="space-y-1.5">
            {employee.email && (
              <a href={`mailto:${employee.email}`} className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.accent.cyan }}>
                <Mail size={12} /> {employee.email}
              </a>
            )}
            {employee.phone && (
              <a href={`tel:${employee.phone}`} className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.accent.cyan }}>
                <User size={12} /> {employee.phone}
              </a>
            )}
          </div>
          
          {/* Employment type */}
          <div className="text-xs" style={{ color: THEME.text.muted }}>
            {employee.employmentType === 'full-time' ? 'Full-Time' : 'Part-Time'}
          </div>
        </div>
      </div>
    </div>
  );
};
