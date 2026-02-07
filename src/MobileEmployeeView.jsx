// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EMPLOYEE VIEW - Components for mobile-responsive employee interface
// 
// Imported by App.jsx EmployeeView component.
// All shared constants (THEME, ROLES, helpers) imported from App.jsx.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, X, Calendar, Star, Eye, LogOut, Shield, 
  Loader, ArrowRightLeft, ArrowRight, Bell, Menu, Key 
} from 'lucide-react';

import { 
  THEME, ROLES, formatDate, formatTimeShort, getDayName, getWeekNumber, 
  getStoreHoursForDate, isStatHoliday, GradientBackground 
} from './App';

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE DETECTION HOOK
// ═══════════════════════════════════════════════════════════════════════════════
const MOBILE_BREAKPOINT = 768;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HAMBURGER MENU DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileMenuDrawer = ({ isOpen, onClose, currentUser, onLogout, onOpenShiftChanges, onOpenChangePassword, adminContacts = [], children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} />
      
      {/* Drawer */}
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
              <p className="text-sm font-semibold" style={{ color: THEME.text.primary }}>{currentUser.name}</p>
              <p className="text-xs" style={{ color: THEME.text.muted }}>{currentUser.email}</p>
            </div>
          </div>
        </div>
        
        {/* Shift Changes Button */}
        <div className="p-3" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
          <button
            onClick={() => { onOpenShiftChanges(); onClose(); }}
            className="w-full px-4 py-3 text-sm font-medium rounded-lg flex items-center gap-3 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
          >
            <Calendar size={16} />
            Shift Changes
          </button>
        </div>
        
        {/* Request Panels */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
          {children}
        </div>
        
        {/* Admin Contacts */}
        {adminContacts.length > 0 && (
          <div className="p-3" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: THEME.text.muted }}>CONTACT ADMIN</p>
            {adminContacts.map(admin => (
              <div key={admin.id} className="flex items-center gap-2 text-xs py-1">
                <Shield size={10} style={{ color: THEME.accent.purple }} />
                <span style={{ color: THEME.text.primary }}>{admin.name}</span>
                <a href={`mailto:${admin.email}`} className="truncate" style={{ color: THEME.accent.cyan, fontSize: '10px' }}>{admin.email}</a>
              </div>
            ))}
          </div>
        )}
        
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
// ANNOUNCEMENT POPUP
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileAnnouncementPopup = ({ isOpen, onClose, announcement }) => {
  if (!isOpen || !announcement?.message) return null;
  
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      <div 
        className="relative w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.accent.blue}40` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.accent.blue}20, ${THEME.bg.secondary})` }}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: THEME.accent.blue }}>
            📢 {announcement.subject || 'Announcement'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>
        </div>
        <div className="p-4">
          <div className="text-sm whitespace-pre-wrap" style={{ color: THEME.text.primary, lineHeight: 1.6 }}>
            {announcement.message}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FROZEN SPREADSHEET GRID
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileScheduleGrid = ({ employees, shifts, dates, loggedInUser, getEmployeeHours, timeOffRequests = [] }) => {
  const scrollContainerRef = useRef(null);
  const NAME_COL_WIDTH = 72;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 56;
  const HEADER_HEIGHT = 52;
  
  // Sort: Sarvi first, then logged-in user, then alphabetical
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      // Sarvi always first
      const aIsSarvi = a.name.toLowerCase() === 'sarvi';
      const bIsSarvi = b.name.toLowerCase() === 'sarvi';
      if (aIsSarvi && !bIsSarvi) return -1;
      if (bIsSarvi && !aIsSarvi) return 1;
      
      // Full-time before part-time
      const aFT = a.employmentType === 'full-time';
      const bFT = b.employmentType === 'full-time';
      if (aFT && !bFT) return -1;
      if (bFT && !aFT) return 1;
      
      // Alphabetical within same type
      return a.name.localeCompare(b.name);
    });
  }, [employees]);
  
  // Find index where part-time starts (for divider)
  const ptStartIndex = useMemo(() => {
    const idx = sortedEmployees.findIndex(e => e.employmentType !== 'full-time' && e.name.toLowerCase() !== 'sarvi');
    const hasFT = sortedEmployees.some(e => e.employmentType === 'full-time' || e.name.toLowerCase() === 'sarvi');
    const hasPT = sortedEmployees.some(e => e.employmentType !== 'full-time' && e.name.toLowerCase() !== 'sarvi');
    return hasFT && hasPT ? idx : -1;
  }, [sortedEmployees]);
  
  const hasApprovedTimeOff = (emp, dateStr) => {
    return timeOffRequests.some(req => 
      req.email === emp.email && 
      req.status === 'approved' &&
      req.datesRequested?.split(',').includes(dateStr)
    );
  };
  
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      {/* CSS for frozen columns/rows */}
      <style>{`
        .mobile-grid-scroll {
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: calc(100vh - 180px);
        }
        .mobile-grid-scroll::-webkit-scrollbar { display: none; }
        .mobile-grid-table { border-collapse: separate; border-spacing: 0; }
        .mobile-grid-table th, .mobile-grid-table td { white-space: nowrap; }
        .mobile-grid-table thead th { position: sticky; top: 0; z-index: 20; }
        .mobile-grid-table tbody td:first-child, .mobile-grid-table thead th:first-child { 
          position: sticky; left: 0; z-index: 10; 
        }
        .mobile-grid-table thead th:first-child { z-index: 30; }
      `}</style>
      
      <div className="mobile-grid-scroll" ref={scrollContainerRef}>
        <table className="mobile-grid-table" style={{ minWidth: NAME_COL_WIDTH + (dates.length * CELL_WIDTH) }}>
          <thead>
            <tr>
              {/* Corner cell - frozen both ways */}
              <th style={{ 
                width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH, 
                backgroundColor: THEME.bg.tertiary, 
                padding: '4px 6px', height: HEADER_HEIGHT,
                borderRight: `1px solid ${THEME.border.default}`,
                borderBottom: `1px solid ${THEME.border.default}`
              }}>
                <span className="text-xs font-semibold" style={{ color: THEME.text.muted }}>Staff</span>
              </th>
              
              {/* Day headers - frozen top */}
              {dates.map((date, i) => {
                const sh = getStoreHoursForDate(date);
                const today = date.toDateString() === new Date().toDateString();
                const hol = isStatHoliday(date);
                return (
                  <th key={i} style={{ 
                    width: CELL_WIDTH, minWidth: CELL_WIDTH, height: HEADER_HEIGHT,
                    backgroundColor: today ? THEME.accent.purple + '20' : hol ? THEME.status.warning + '15' : THEME.bg.tertiary,
                    borderBottom: today ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : `1px solid ${THEME.border.default}`,
                    padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle'
                  }}>
                    <p className="font-semibold" style={{ color: today ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary, fontSize: '10px' }}>
                      {getDayName(date).slice(0, 3)}
                    </p>
                    <p className="font-bold" style={{ color: THEME.text.primary, fontSize: '13px' }}>{date.getDate()}</p>
                    <p style={{ color: THEME.text.muted, fontSize: '9px' }}>{formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}</p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((emp, empIndex) => {
              const hours = getEmployeeHours(emp.id);
              const isMe = emp.id === loggedInUser.id;
              const showDivider = empIndex === ptStartIndex;
              return (
                <React.Fragment key={emp.id}>
                  {showDivider && (
                    <tr>
                      <td colSpan={dates.length + 1} style={{ height: 6, padding: 0 }}>
                        <div style={{ height: 1, margin: '2px 8px', backgroundColor: THEME.border.default }} />
                      </td>
                    </tr>
                  )}
                  <tr style={isMe ? { outline: `1.5px solid ${THEME.accent.purple}60`, outlineOffset: '-1px', borderRadius: '4px' } : undefined}>
                  {/* Name cell - frozen left */}
                  <td style={{
                    width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH,
                    backgroundColor: THEME.bg.secondary,
                    borderRight: `1px solid ${THEME.border.default}`,
                    borderBottom: `1px solid ${THEME.border.subtle}`,
                    padding: '4px', verticalAlign: 'middle'
                  }}>
                    <p className="font-medium truncate" style={{
                      color: THEME.text.primary,
                      fontSize: '10px', lineHeight: 1.2
                    }}>
                      {emp.name.split(' ')[0]}
                    </p>
                    <p className="truncate" style={{
                      color: THEME.text.muted,
                      fontSize: '9px', lineHeight: 1.2
                    }}>
                      {emp.name.split(' ').slice(1).join(' ')}
                    </p>
                    <p className="font-semibold" style={{
                      color: hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan,
                      fontSize: '9px', lineHeight: 1.2
                    }}>{hours.toFixed(1)}h</p>
                  </td>
                  
                  {/* Shift cells */}
                  {dates.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const shift = shifts[`${emp.id}-${dateStr}`];
                    const isTimeOff = hasApprovedTimeOff(emp, dateStr);
                    const dayName = getDayName(date);
                    const avail = emp.availability?.[dayName];
                    const isUnavailable = avail && !avail.available;
                    const role = shift ? ROLES.find(r => r.id === shift.role) : null;
                    const isOwnShift = emp.id === loggedInUser.id;
                    
                    return (
                      <td key={i} style={{ 
                        width: CELL_WIDTH, minWidth: CELL_WIDTH, height: CELL_HEIGHT,
                        backgroundColor: THEME.bg.secondary,
                        borderBottom: `1px solid ${THEME.border.subtle}`,
                        padding: '2px'
                      }}>
                        <div className="h-full rounded-md relative overflow-hidden" style={{ 
                          backgroundColor: isTimeOff ? THEME.text.muted + '15' 
                            : isUnavailable && !shift ? THEME.bg.primary 
                            : shift ? role?.color + '25' : THEME.bg.tertiary,
                          border: `1px solid ${isTimeOff ? THEME.text.muted + '30' 
                            : isUnavailable && !shift ? THEME.border.subtle 
                            : shift ? role?.color + '50' : THEME.border.default}`,
                          opacity: isTimeOff ? 0.7 : isUnavailable && !shift ? 0.5 : 1,
                          height: CELL_HEIGHT - 4
                        }}>
                          {isTimeOff && !shift ? (
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
                                {isOwnShift && shift.task && (
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
// MY SCHEDULE SUMMARY TAB
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileMySchedule = ({ currentUser, shifts, dates, timeOffRequests = [] }) => {
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);
  
  const getWeekShifts = (weekDates) => {
    let totalHours = 0;
    const shiftList = [];
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const shift = shifts[`${currentUser.id}-${dateStr}`];
      if (shift) {
        totalHours += shift.hours || 0;
        const role = ROLES.find(r => r.id === shift.role);
        shiftList.push({ date, dateStr, shift, role });
      }
    });
    return { shiftList, totalHours };
  };
  
  const w1 = getWeekShifts(week1);
  const w2 = getWeekShifts(week2);
  const periodTotal = w1.totalHours + w2.totalHours;
  
  // Approved time-off dates for this period
  const myTimeOffDates = useMemo(() => {
    const toDates = new Set();
    timeOffRequests
      .filter(r => r.email === currentUser.email && r.status === 'approved')
      .forEach(r => r.datesRequested?.split(',').forEach(d => toDates.add(d)));
    return toDates;
  }, [timeOffRequests, currentUser.email]);
  
  const renderWeek = (weekDates, weekData, weekNum) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-xs font-semibold" style={{ color: THEME.text.muted }}>WEEK {weekNum}</h4>
        <span className="text-xs font-bold" style={{ color: THEME.accent.cyan }}>{weekData.totalHours.toFixed(1)}h</span>
      </div>
      
      <div className="space-y-1.5">
        {weekDates.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const shift = shifts[`${currentUser.id}-${dateStr}`];
          const role = shift ? ROLES.find(r => r.id === shift.role) : null;
          const isTimeOff = myTimeOffDates.has(dateStr);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const today = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ 
              backgroundColor: today ? THEME.accent.purple + '15' : THEME.bg.tertiary,
              borderLeft: `3px solid ${shift ? role?.color : isTimeOff ? THEME.text.muted : 'transparent'}`,
              border: today ? `1px solid ${THEME.accent.purple}40` : undefined
            }}>
              <div className="w-12 flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: today ? THEME.accent.purple : THEME.text.primary }}>{dayName}</p>
                <p style={{ color: THEME.text.muted, fontSize: '10px' }}>{date.getDate()}/{date.getMonth() + 1}</p>
              </div>
              
              {shift ? (
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: role?.color + '25', color: role?.color }}>{role?.name}</span>
                  <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)}</span>
                  <span className="text-xs font-medium" style={{ color: THEME.accent.cyan }}>{shift.hours}h</span>
                  {shift.task && (
                    <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.task + '20', color: THEME.task }}>
                      <Star size={8} fill={THEME.task} color={THEME.task} />{shift.task}
                    </span>
                  )}
                </div>
              ) : isTimeOff ? (
                <span className="text-xs" style={{ color: THEME.text.muted }}>Time Off (Approved)</span>
              ) : (
                <span className="text-xs" style={{ color: THEME.text.muted }}>—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
  
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }}>
      {/* Period Summary Header */}
      <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
        <h3 className="text-sm font-semibold" style={{ color: THEME.text.primary }}>My Schedule</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: THEME.text.muted }}>{w1.shiftList.length + w2.shiftList.length} shifts</span>
          <span className="text-sm font-bold" style={{ color: THEME.accent.cyan }}>{periodTotal.toFixed(1)}h</span>
        </div>
      </div>
      
      {renderWeek(week1, w1, weekNum1)}
      {renderWeek(week2, w2, weekNum2)}
      
      {w1.shiftList.length === 0 && w2.shiftList.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: THEME.text.muted }}>No shifts scheduled this period</p>
      )}
    </div>
  );
};
