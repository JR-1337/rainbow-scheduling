// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EMPLOYEE VIEW - Components for mobile-responsive employee interface
// 
// Imported by App.jsx EmployeeView component.
// All shared constants (THEME, ROLES, helpers) imported from App.jsx.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, X, Calendar, Star, Eye, LogOut, Shield,
  Loader, ArrowRightLeft, ArrowRight, Bell, Menu, Key, Check, MessageSquare, Ban
} from 'lucide-react';

import {
  THEME, TYPE, ROLES, ROLES_BY_ID,
  getStoreHoursForDate, GradientBackground, haptic
} from './App';
import { toDateKey, formatDate, formatTimeShort, getDayName, getWeekNumber } from './utils/date';
import { isStatHoliday } from './utils/storeHours';
import { useFocusTrap } from './hooks/useFocusTrap';
import { EVENT_TYPES } from './constants';
import { computeDayUnionHours } from './utils/timemath';

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
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      
      {/* Drawer */}
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
            style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: THEME.accent.text }}
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
          <button onClick={onClose} className="p-2 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
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
export const MobileScheduleGrid = ({ employees, shifts, events = {}, dates, loggedInUser, getEmployeeHours, timeOffRequests = [], onShiftClick }) => {
  const scrollContainerRef = useRef(null);
  const NAME_COL_WIDTH = 72;
  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 66;
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
                  <tr>
                  {/* Name cell - frozen left */}
                  <td style={{
                    width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH,
                    backgroundColor: isMe ? THEME.accent.purple + '20' : THEME.bg.secondary,
                    borderRight: `1px solid ${THEME.border.default}`,
                    borderBottom: `1px solid ${THEME.border.subtle}`,
                    borderLeft: isMe ? `3px solid ${THEME.accent.purple}` : 'none',
                    padding: '4px', verticalAlign: 'middle'
                  }}>
                    <p className="font-medium truncate flex items-center gap-1" style={{
                      color: isMe ? THEME.accent.purple : THEME.text.primary,
                      fontSize: '12px', lineHeight: 1.2
                    }}>
                      {emp.name.split(' ')[0]}
                      {isMe && <span style={{ color: THEME.accent.cyan, fontSize: '9px' }}>(You)</span>}
                    </p>
                    <p className="truncate" style={{
                      color: THEME.text.muted,
                      fontSize: '10px', lineHeight: 1.2
                    }}>
                      {emp.name.split(' ').slice(1).join(' ')}
                    </p>
                  </td>
                  
                  {/* Shift cells */}
                  {dates.map((date, i) => {
                    const dateStr = toDateKey(date);
                    const shift = shifts[`${emp.id}-${dateStr}`];
                    // Defensive: unknown event types are silently hidden.
                    const cellEvents = (events[`${emp.id}-${dateStr}`] || []).filter(ev => EVENT_TYPES[ev.type]);
                    const hasEvents = cellEvents.length > 0;
                    const firstEvent = hasEvents ? cellEvents[0] : null;
                    const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
                    const eventOnly = !shift && hasEvents;
                    const isTimeOff = hasApprovedTimeOff(emp, dateStr);
                    const dayName = getDayName(date);
                    const avail = emp.availability?.[dayName];
                    const isUnavailable = avail && !avail.available;
                    const role = shift ? ROLES_BY_ID[shift.role] : null;
                    const isOwnShift = emp.id === loggedInUser.id;

                    return (
                      <td key={i} style={{
                        width: CELL_WIDTH, minWidth: CELL_WIDTH, height: CELL_HEIGHT,
                        backgroundColor: isMe ? THEME.accent.purple + '10' : THEME.bg.secondary,
                        borderBottom: `1px solid ${THEME.border.subtle}`,
                        padding: '2px'
                      }}>
                        <div
                          className="h-full rounded-md relative overflow-hidden"
                          onClick={(shift || hasEvents) && onShiftClick ? () => onShiftClick({ employee: emp, date, dateStr, shift, role, events: cellEvents }) : undefined}
                          style={{
                            cursor: (shift || hasEvents) && onShiftClick ? 'pointer' : 'default',
                            backgroundColor: isTimeOff ? THEME.text.muted + '15'
                              : isUnavailable && !shift && !hasEvents ? THEME.bg.tertiary
                              : shift ? role?.color + '25'
                              : eventOnly ? firstEventType.bg
                              : THEME.bg.tertiary,
                            border: `1px solid ${isTimeOff ? THEME.text.muted + '30'
                              : isUnavailable && !shift && !hasEvents ? THEME.border.subtle
                              : shift ? role?.color + '50'
                              : eventOnly ? firstEventType.border
                              : THEME.border.default}`,
                            opacity: isTimeOff ? 0.7 : isUnavailable && !shift && !hasEvents ? 0.5 : 1,
                            height: CELL_HEIGHT - 4
                          }}
                        >
                          {isTimeOff && !shift && !hasEvents ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '9px' }}>Time Off</span>
                            </div>
                          ) : isUnavailable && !shift && !hasEvents ? (
                            <div className="flex items-center justify-center h-full">
                              <span style={{ color: THEME.text.muted, fontSize: '8px' }}>Unavailable</span>
                            </div>
                          ) : shift ? (
                            <div className="p-1 h-full flex flex-col justify-between relative">
                              <span className="font-semibold truncate" style={{ color: role?.color, fontSize: '10px' }}>{role?.name}</span>
                              <div>
                                <span style={{ color: THEME.text.secondary, fontSize: '9px' }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                              </div>
                              {isOwnShift && shift.task && (
                                <div className="flex items-center justify-end">
                                  <Star size={8} fill={THEME.task} color={THEME.task} />
                                </div>
                              )}
                              {hasEvents && (
                                <div className="absolute bottom-0 right-0 flex gap-0.5 p-0.5">
                                  {cellEvents.map((ev, j) => {
                                    const et = EVENT_TYPES[ev.type];
                                    if (!et) return null;
                                    return (
                                      <span key={j}
                                        title={`${et.label} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`}
                                        className="rounded font-semibold leading-tight"
                                        style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}`, fontSize: '8px', padding: '0 2px' }}>
                                        {et.shortLabel}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ) : eventOnly ? (
                            <div className="p-1 h-full flex flex-col justify-between"
                              title={cellEvents.map(ev => {
                                const et = EVENT_TYPES[ev.type];
                                return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
                              }).join('\n')}>
                              <span className="font-semibold truncate" style={{ color: firstEventType.text, fontSize: '10px' }}>
                                {cellEvents.length === 1 ? firstEventType.shortLabel : `${cellEvents.length} events`}
                              </span>
                              <span style={{ color: firstEventType.text, opacity: 0.8, fontSize: '9px' }}>
                                {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
                              </span>
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
export const MobileMySchedule = ({ currentUser, shifts, events = {}, dates, timeOffRequests = [] }) => {
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);

  // S64 Stage 8.1 — union-count work+events so a 9-5 work + 3-5 PK = 8h, not 10h.
  // Shift count stays work-only (matches S60 semantics).
  const getWeekShifts = (weekDates) => {
    let totalHours = 0;
    const shiftList = [];
    weekDates.forEach(date => {
      const dateStr = toDateKey(date);
      const k = `${currentUser.id}-${dateStr}`;
      const shift = shifts[k];
      const dayEvents = events[k] || [];
      const combined = [shift, ...dayEvents].filter(Boolean);
      if (combined.length > 0) {
        totalHours += computeDayUnionHours(combined);
      }
      if (shift) {
        const role = ROLES_BY_ID[shift.role];
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
        <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>{weekData.shiftList.length} shift{weekData.shiftList.length === 1 ? '' : 's'}</span>
      </div>
      
      <div className="space-y-1.5">
        {weekDates.map((date, i) => {
          const dateStr = toDateKey(date);
          const shift = shifts[`${currentUser.id}-${dateStr}`];
          const dayEvents = (events[`${currentUser.id}-${dateStr}`] || []).filter(ev => EVENT_TYPES[ev.type]);
          const role = shift ? ROLES_BY_ID[shift.role] : null;
          const isTimeOff = myTimeOffDates.has(dateStr);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const today = date.toDateString() === new Date().toDateString();

          return (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg" style={{
              backgroundColor: today ? THEME.accent.purple + '15' : THEME.bg.tertiary,
              borderLeft: `3px solid ${shift ? role?.color : dayEvents.length > 0 ? EVENT_TYPES[dayEvents[0].type].border : isTimeOff ? THEME.text.muted : 'transparent'}`,
              border: today ? `1px solid ${THEME.accent.purple}40` : undefined
            }}>
              <div className="w-12 flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: today ? THEME.accent.purple : THEME.text.primary }}>{dayName}</p>
                <p style={{ color: THEME.text.muted, fontSize: '10px' }}>{date.getDate()}/{date.getMonth() + 1}</p>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                {shift ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: role?.color + '25', color: role?.color }}>{role?.name}</span>
                    <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)} – {formatTimeShort(shift.endTime)}</span>
                    {shift.task && (
                      <span className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.task + '20', color: THEME.task }}>
                        <Star size={8} fill={THEME.task} color={THEME.task} />{shift.task}
                      </span>
                    )}
                  </div>
                ) : isTimeOff ? (
                  <span className="text-xs" style={{ color: THEME.text.muted }}>Time Off (Approved)</span>
                ) : dayEvents.length === 0 ? (
                  <span className="text-xs" style={{ color: THEME.text.muted }}>—</span>
                ) : null}

                {dayEvents.map((ev, j) => {
                  const et = EVENT_TYPES[ev.type];
                  return (
                    <div key={j} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}` }}>{et.shortLabel}</span>
                      <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(ev.startTime)} – {formatTimeShort(ev.endTime)}</span>
                      {ev.note && <span className="text-xs truncate" style={{ color: THEME.text.muted }}>{ev.note}</span>}
                    </div>
                  );
                })}
              </div>
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
      </div>
      
      {renderWeek(week1, w1, weekNum1)}
      {renderWeek(week2, w2, weekNum2)}
      
      {w1.shiftList.length === 0 && w2.shiftList.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: THEME.text.muted }}>No shifts scheduled this period</p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BOTTOM TAB BAR (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileBottomNav = ({ activeTab, onTabChange, hasNotifications = false }) => {
  const tabs = [
    { key: 'schedule', icon: Calendar, label: 'Schedule' },
    { key: 'requests', icon: ArrowRightLeft, label: 'Requests' },
    { key: 'alerts', icon: Bell, label: 'Alerts', badge: hasNotifications },
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
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className="relative">
                <Icon size={20} />
                {tab.badge && (
                  <div
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#F87171' }}
                  />
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

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BOTTOM SHEET (Phase 4 / Phase 10)
// ═══════════════════════════════════════════════════════════════════════════════
export const MobileBottomSheet = ({ isOpen, onClose, title, children }) => {
  // S38: focus trap + Escape-to-close. useFocusTrap already handles both
  // (Tab cycle + Escape triggers `[data-close]`). The hook + ref must be
  // declared before the early return so hook order stays stable.
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen);
  if (!isOpen) return null;
  return (
    <div
      ref={dialogRef}
      className={`fixed inset-0 z-[150] bottom-sheet-backdrop ${isOpen ? 'active' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Details'}
    >
      <div
        className={`fixed bottom-0 left-0 right-0 bottom-sheet ${isOpen ? 'active' : ''}`}
        style={{
          backgroundColor: THEME.bg.secondary,
          paddingBottom: 'env(safe-area-inset-bottom)',
          borderTop: `1px solid ${THEME.border.default}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="block mx-auto mt-2 mb-3 rounded-full"
          style={{
            width: 48,
            height: 20,
            padding: 0,
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 40,
              height: 4,
              borderRadius: 9999,
              backgroundColor: THEME.text.muted + '66',
            }}
          />
        </button>
        {title && (
          <div
            className="px-4 pb-2 font-semibold flex items-center justify-between"
            style={{ fontSize: TYPE.title, color: THEME.text.primary }}
          >
            <span>{title}</span>
            <button
              onClick={onClose}
              data-close
              aria-label="Close dialog"
              className="rounded-lg flex items-center justify-center"
              style={{ minWidth: 44, minHeight: 44, color: THEME.text.muted }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// S41.4 — ALERTS BOTTOM SHEET (announcement + recent activity)
// Collects terminal status changes on the employee's own requests from the last
// 14 days and renders them as a feed. Opening marks the feed as seen.
// ═══════════════════════════════════════════════════════════════════════════════
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export const computeAlertItems = (currentUser, timeOffRequests = [], shiftOffers = [], shiftSwaps = []) => {
  if (!currentUser?.email) return [];
  const me = currentUser.email;
  const now = Date.now();
  const withinWindow = (t) => t && (now - new Date(t).getTime() <= FOURTEEN_DAYS_MS);
  const out = [];

  timeOffRequests.forEach(r => {
    if (r.employeeEmail !== me) return;
    if (!['approved', 'denied', 'revoked'].includes(r.status)) return;
    const t = r.revokedTimestamp || r.decidedTimestamp;
    if (!withinWindow(t)) return;
    out.push({ t, kind: 'time-off', status: r.status, id: r.requestId, datesRequested: r.datesRequested, reason: r.reason });
  });

  shiftOffers.forEach(o => {
    const isMine = o.employeeEmail === me || o.offererEmail === me;
    const toMe = o.recipientEmail === me;
    if (!isMine && !toMe) return;
    if (!['approved', 'rejected', 'revoked', 'recipient_rejected', 'cancelled'].includes(o.status)) return;
    const t = o.revokedTimestamp || o.adminDecidedTimestamp || o.decidedTimestamp || o.recipientRespondedTimestamp || o.cancelledTimestamp;
    if (!withinWindow(t)) return;
    out.push({ t, kind: 'offer', status: o.status, id: o.requestId || o.offerId, direction: isMine ? 'sent' : 'received', shiftDate: o.shiftDate, otherName: isMine ? o.recipientName : (o.employeeName || o.offererName) });
  });

  shiftSwaps.forEach(s => {
    const isMine = s.employeeEmail === me || s.initiatorEmail === me;
    const toMe = s.partnerEmail === me;
    if (!isMine && !toMe) return;
    if (!['approved', 'rejected', 'revoked', 'partner_rejected', 'cancelled'].includes(s.status)) return;
    const t = s.revokedTimestamp || s.adminDecidedTimestamp || s.decidedTimestamp || s.partnerRespondedTimestamp;
    if (!withinWindow(t)) return;
    out.push({ t, kind: 'swap', status: s.status, id: s.requestId || s.swapId, direction: isMine ? 'sent' : 'received', otherName: isMine ? s.partnerName : (s.employeeName || s.initiatorName) });
  });

  return out.sort((a, b) => new Date(b.t) - new Date(a.t));
};

const statusCopy = (item) => {
  if (item.kind === 'time-off') {
    const dates = (item.datesRequested || '').split(',').filter(Boolean);
    const dateStr = dates.length === 1 ? dates[0] : `${dates.length} days`;
    if (item.status === 'approved') return { title: `Time off approved`, detail: dateStr, color: THEME.status.success, Icon: Check };
    if (item.status === 'denied') return { title: `Time off denied`, detail: dateStr, color: THEME.status.error, Icon: X };
    if (item.status === 'revoked') return { title: `Time off approval revoked`, detail: dateStr, color: THEME.status.warning, Icon: Ban };
  }
  if (item.kind === 'offer') {
    const who = item.otherName || 'someone';
    if (item.status === 'approved') return { title: `Shift transfer approved`, detail: item.direction === 'sent' ? `To ${who} — ${item.shiftDate || ''}` : `From ${who} — ${item.shiftDate || ''}`, color: THEME.status.success, Icon: Check };
    if (item.status === 'rejected') return { title: `Shift transfer rejected by admin`, detail: item.direction === 'sent' ? `To ${who}` : `From ${who}`, color: THEME.status.error, Icon: X };
    if (item.status === 'recipient_rejected') return { title: item.direction === 'sent' ? `${who} declined your offer` : `You declined this offer`, detail: item.shiftDate || '', color: THEME.status.error, Icon: X };
    if (item.status === 'revoked') return { title: `Shift transfer revoked`, detail: item.direction === 'sent' ? `To ${who}` : `From ${who}`, color: THEME.status.warning, Icon: Ban };
    if (item.status === 'cancelled') return { title: `Offer cancelled`, detail: item.direction === 'sent' ? `To ${who}` : `From ${who}`, color: THEME.text.muted, Icon: X };
  }
  if (item.kind === 'swap') {
    const who = item.otherName || 'someone';
    if (item.status === 'approved') return { title: `Shift swap approved`, detail: `With ${who}`, color: THEME.status.success, Icon: Check };
    if (item.status === 'rejected') return { title: `Shift swap rejected by admin`, detail: `With ${who}`, color: THEME.status.error, Icon: X };
    if (item.status === 'partner_rejected') return { title: item.direction === 'sent' ? `${who} declined your swap` : `You declined this swap`, detail: '', color: THEME.status.error, Icon: X };
    if (item.status === 'revoked') return { title: `Shift swap revoked`, detail: `With ${who}`, color: THEME.status.warning, Icon: Ban };
    if (item.status === 'cancelled') return { title: `Swap cancelled`, detail: `With ${who}`, color: THEME.text.muted, Icon: X };
  }
  return { title: 'Update', detail: '', color: THEME.text.muted, Icon: Bell };
};

const relativeTime = (t) => {
  const diff = Date.now() - new Date(t).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const MobileAlertsSheet = ({ isOpen, onClose, currentUser, announcement, timeOffRequests = [], shiftOffers = [], shiftSwaps = [], onOpened }) => {
  const items = useMemo(
    () => computeAlertItems(currentUser, timeOffRequests, shiftOffers, shiftSwaps),
    [currentUser, timeOffRequests, shiftOffers, shiftSwaps]
  );
  const hasAnnouncement = !!(announcement && announcement.message);

  useEffect(() => {
    if (isOpen && onOpened) onOpened();
  }, [isOpen, onOpened]);

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} title="Alerts">
      {hasAnnouncement && (
        <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: THEME.accent.blue + '10', border: `1px solid ${THEME.accent.blue}40` }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} style={{ color: THEME.accent.blue }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: THEME.accent.blue }}>Announcement</span>
          </div>
          {announcement.subject && (
            <p className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>{announcement.subject}</p>
          )}
          <p className="text-xs whitespace-pre-wrap" style={{ color: THEME.text.secondary }}>{announcement.message}</p>
        </div>
      )}

      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: THEME.text.muted }}>
        Recent updates
      </div>
      {items.length === 0 ? (
        <div className="py-6 text-center" style={{ color: THEME.text.muted }}>
          <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p className="text-sm">You're all caught up</p>
          <p className="text-xs mt-1">Status changes on your requests will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(item => {
            const { title, detail, color, Icon } = statusCopy(item);
            return (
              <li
                key={`${item.kind}-${item.id}-${item.t}`}
                className="p-3 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${color}30` }}
              >
                <div className="p-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color + '20' }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: THEME.text.primary }}>{title}</p>
                  {detail && <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>{detail}</p>}
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: THEME.text.muted }}>{relativeTime(item.t)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </MobileBottomSheet>
  );
};
