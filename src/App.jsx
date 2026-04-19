import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useIsMobile, MobileMySchedule, MobileBottomSheet } from './MobileEmployeeView';
import { MobileAdminDrawer, MobileAdminScheduleGrid, MobileAnnouncementPanel, MobileEmployeeQuickView, MobileAdminBottomNav } from './MobileAdminView';
import { parseLocalDate, escapeHtml } from './utils/format';
import { toDateKey, getDayName, getDayNameShort, formatDate, formatDateLong, formatMonthWord, getWeekNumber, formatTimeDisplay, formatTimeShort, calculateHours, parseTime } from './utils/date';
import { STAT_HOLIDAY_HOURS, STORE_HOURS, isStatHoliday } from './utils/storeHours';
import { Modal, GradientButton } from './components/primitives';
import { haptic, AnimatedNumber, ScheduleSkeleton, TaskStarTooltip, GradientBackground } from './components/uiKit';
import { CURRENT_PERIOD_INDEX, getPayPeriodDates } from './utils/payPeriod';
import { hasApprovedTimeOffForDate } from './utils/requests';
import { CollapsibleSection } from './components/CollapsibleSection';
import { computeDayUnionHours, computeConsecutiveWorkDayStreak, availabilityCoversWindow } from './utils/timemath';
import { getPKDefaultTimes } from './utils/eventDefaults';
import { generateSchedulePDF } from './pdf/generate';
import { getAuthToken, setAuthToken, clearAuth, getCachedUser, setCachedUser, setOnAuthFailure, handleAuthError } from './auth';
import { OTR, THEME, TYPE } from './theme';
import { ROLES, ROLES_BY_ID, EVENT_TYPES } from './constants';
import { AdminTimeOffPanel } from './panels/AdminTimeOffPanel';
import { AdminMyTimeOffPanel } from './panels/AdminMyTimeOffPanel';
import { AdminShiftOffersPanel } from './panels/AdminShiftOffersPanel';
import { AdminShiftSwapsPanel } from './panels/AdminShiftSwapsPanel';
import { MyShiftOffersPanel } from './panels/MyShiftOffersPanel';
import { MySwapsPanel } from './panels/MySwapsPanel';
import { MyRequestsPanel } from './panels/MyRequestsPanel';
import { InactiveEmployeesPanel } from './panels/InactiveEmployeesPanel';
import { MobileStaffPanel } from './panels/MobileStaffPanel';
import { ShiftEditorModal } from './modals/ShiftEditorModal';
import { PKEventModal } from './modals/PKEventModal';
import { RequestTimeOffModal } from './modals/RequestTimeOffModal';
import { CommunicationsPanel } from './panels/CommunicationsPanel';
import { AdminSettingsModal } from './modals/AdminSettingsModal';
import { ChangePasswordModal } from './modals/ChangePasswordModal';
import { EmployeeFormModal } from './modals/EmployeeFormModal';
import { RequestDaysOffModal } from './modals/RequestDaysOffModal';
import { EmailModal } from './modals/EmailModal';
import { EmployeeView } from './views/EmployeeView';
export { parseLocalDate, escapeHtml, THEME, TYPE, ROLES, ROLES_BY_ID };
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Mail, Save, Send, FileText, X,
  User, Users, Phone, Calendar, Check, AlertCircle, Star, Edit3, Trash2, UserX, UserCheck, Eye, EyeOff, LogOut, Shield, Settings, Key, MessageSquare, Loader, ClipboardList, ArrowRightLeft, ArrowRight, Bell, Zap, Clock, Menu, BookOpen
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// UX UTILITIES - Phase 3 (focus trap, haptic, kinetic numbers, staffing bar, skeleton)
// ═══════════════════════════════════════════════════════════════════════════════

// Fix 8b - Focus trap hook for modals
// useFocusTrap moved to src/hooks/useFocusTrap.js

// haptic, AnimatedNumber, StaffingBar, ScheduleSkeleton moved to src/components/uiKit.jsx

// ═══════════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycbxSDWA1uOnemfu2N33y3za7a2hreJIUddgCgQi4X32ObbWKeXHyQms7wxy2NyGw7gWbXA/exec';

/**
 * Make API call to Google Apps Script backend
 * Uses GET with URL parameters (workaround for POST issues with Apps Script)
 * @param {string} action - The action name (e.g., 'login', 'submitTimeOffRequest')
 * @param {object} payload - The data to send
 * @returns {Promise<{success: boolean, data?: any, error?: {code: string, message: string}}>}
 */
export const apiCall = async (action, payload = {}, onProgress) => {
  // S37: auto-attach session token (if present) to every payload so no caller
  // has to pass `callerEmail`. Login/public endpoints are unaffected because
  // the backend only reads `token` when verifyAuth is invoked.
  const token = getAuthToken();
  const authedPayload = token ? { ...payload, token } : payload;
  try {
    const payloadJson = JSON.stringify(authedPayload);
    // Encode payload as JSON in URL parameter
    const params = new URLSearchParams({ action, payload: payloadJson });
    const url = `${API_URL}?${params.toString()}`;

    let result = null;

    // Check URL length - browsers/servers typically limit to ~8000 chars
    // If too long, try POST first, fall back to chunked GET
    if (url.length > 6000) {
      try {
        // Apps Script POST: use text/plain to avoid CORS preflight
        const postResponse = await fetch(API_URL, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action, payload: authedPayload })
        });
        const postText = await postResponse.text();
        try {
          const parsed = JSON.parse(postText);
          if (parsed.success !== undefined) result = parsed;
        } catch (e) { /* POST failed or returned HTML redirect, fall through */ }
      } catch (e) { /* POST failed, fall through to chunked GET */ }

      // Fallback: chunk the shifts array into smaller batches
      if (!result && action === 'batchSaveShifts' && authedPayload.shifts?.length > 10) {
        result = await chunkedBatchSave(authedPayload, onProgress);
      }
    }

    if (!result) {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
      const text = await response.text();
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        result = {
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Invalid response from server' }
        };
      }
    }

    // S37: centralized auth-failure handling. If the backend reports expired
    // or invalid token, wipe state and let the registered callback bounce the
    // user back to login.
    if (result && result.success === false && result.error?.code) {
      handleAuthError(result.error.code);
    }
    return result;
  } catch (error) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server. Please try again.' }
    };
  }
};

// Chunk large batchSaveShifts into multiple smaller GET requests
const chunkedBatchSave = async (payload, onProgress) => {
  // S37: `token` is already injected into `payload` by apiCall before it
  // delegates here. `callerEmail` is retained for back-compat with the legacy
  // fallback path in backend verifyAuth; it will be undefined on post-S37
  // payloads and the backend will resolve auth from the token instead.
  const { shifts, periodDates, callerEmail, token } = payload;
  const CHUNK_SIZE = 15; // 15 shifts per request stays under URL limits (~4500 chars)
  let totalSaved = 0;
  let lastError = null;
  let failedChunks = 0;
  const totalChunks = Math.ceil(shifts.length / CHUNK_SIZE);
  
  // Build all shift keys for the full period (needed for delete logic on last chunk)
  // S61 — 3-tuple form `${empId}-${date}-${type}` matches backend `keyOf`. Missing/empty
  // type defaults to 'work' to stay bit-identical to existing data (backend also defaults).
  const allShiftKeys = shifts.map(s => `${s.employeeId}-${s.date}-${s.type || 'work'}`);
  
  for (let i = 0; i < shifts.length; i += CHUNK_SIZE) {
    const chunk = shifts.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const isLastChunk = (i + CHUNK_SIZE) >= shifts.length;
    
    // Report progress
    if (onProgress) onProgress(i + chunk.length, shifts.length, chunkNum, totalChunks);
    
    const chunkPayload = {
      ...(token ? { token } : {}),
      ...(callerEmail ? { callerEmail } : {}),
      shifts: chunk,
      // Only send periodDates on last chunk (triggers cleanup of deleted shifts)
      // Also send allShiftKeys so backend knows which shifts to keep
      periodDates: isLastChunk ? periodDates : [],
      ...(isLastChunk ? { allShiftKeys } : {})
    };
    
    const params = new URLSearchParams({
      action: 'batchSaveShifts',
      payload: JSON.stringify(chunkPayload)
    });
    
    try {
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        redirect: 'follow'
      });
      const text = await response.text();
      const result = JSON.parse(text);
      
      if (result.success) {
        totalSaved += result.data?.savedCount || chunk.length;
      } else {
        lastError = result.error;
        failedChunks += 1;
      }
    } catch (err) {
      lastError = { code: 'NETWORK_ERROR', message: err.message };
      failedChunks += 1;
    }
  }

  if (lastError) {
    // Any chunk failure = partial/total save failure. Callers must retain unsaved state.
    return {
      success: false,
      error: lastError,
      data: { savedCount: totalSaved, totalChunks, failedChunks }
    };
  }

  return {
    success: true,
    data: { savedCount: totalSaved, totalChunks, failedChunks: 0 }
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
// STORE_HOURS, STAT_HOLIDAY_HOURS, STAT_HOLIDAYS_2026 moved to src/utils/storeHours.js

// Daily staffing targets - defaults (overridden by Settings tab if configured)
const DEFAULT_STAFFING_TARGETS = {
  sunday: 15, monday: 8, tuesday: 8, wednesday: 8,
  thursday: 10, friday: 10, saturday: 20
};

// toDateKey moved to src/utils/date.js

// PAY_PERIOD_START, CURRENT_PERIOD_INDEX, getPayPeriodDates moved to src/utils/payPeriod.js

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF REQUEST - Status constants and sample data
// ═══════════════════════════════════════════════════════════════════════════════
const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
  REVOKED: 'revoked'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT OFFER (Give Away) - Status constants and sample data
// ═══════════════════════════════════════════════════════════════════════════════
const OFFER_STATUS = {
  AWAITING_RECIPIENT: 'awaiting_recipient',  // Waiting for Employee B to respond
  RECIPIENT_REJECTED: 'recipient_rejected',  // B declined (terminal)
  AWAITING_ADMIN: 'awaiting_admin',          // B accepted, admin reviewing
  APPROVED: 'approved',                       // Admin approved, shift reassigned (terminal)
  REJECTED: 'rejected',                       // Admin rejected transfer (terminal)
  CANCELLED: 'cancelled',                     // A cancelled before resolution (terminal)
  EXPIRED: 'expired',                         // Shift date passed while pending (terminal)
  REVOKED: 'revoked',                         // Admin revoked after approval (terminal)
};

// OFFER_STATUS_COLORS / LABELS, SWAP_STATUS_COLORS / LABELS moved to src/constants.js
// Unused SWAP_STATUS enum dropped (was internal-only, no references).

// ═══════════════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════════════
// Pure date/time helpers moved to src/utils/date.js
// isStatHoliday moved to src/utils/storeHours.js

// Module-level override refs (synced from component state via useEffect)
// This avoids threading overrides as props through every child component
let _storeHoursOverrides = {}; // { "2026-02-14": { open: "10:00", close: "21:00" } }
let _staffingTargetOverrides = {}; // { "2026-02-14": 12 }

export const getStoreHoursForDate = (date) => {
  const dateStr = toDateKey(date);
  // Per-date override takes priority
  if (_storeHoursOverrides[dateStr]) return _storeHoursOverrides[dateStr];
  // Then stat holiday defaults
  if (isStatHoliday(date)) return STAT_HOLIDAY_HOURS;
  // Then weekly defaults
  return STORE_HOURS[getDayName(date)];
};
// getPayPeriodDates moved to src/utils/payPeriod.js
// parseTime, formatTimeDisplay, formatTimeShort, calculateHours moved to src/utils/date.js

const getAvailabilityShading = (avail, storeHours) => {
  if (!avail.available) return { top: 100, bottom: 0 };
  const storeStart = parseTime(storeHours.open), storeEnd = parseTime(storeHours.close);
  const storeDuration = storeEnd - storeStart;
  const availStart = parseTime(avail.start), availEnd = parseTime(avail.end);
  return {
    top: Math.max(0, Math.min(100, ((availStart - storeStart) / storeDuration) * 100)),
    bottom: Math.max(0, Math.min(100, ((storeEnd - availEnd) / storeDuration) * 100))
  };
};


// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS - Smaller/Compact
// ═══════════════════════════════════════════════════════════════════════════════
// GradientButton, Modal, Input, Checkbox, TimePicker moved to src/components/primitives.jsx

// TaskStarTooltip moved to src/components/uiKit.jsx

// Button with tooltip
const TooltipButton = ({ children, onClick, variant = 'secondary', disabled = false, tooltip }) => {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  
  useEffect(() => {
    if (show && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
    }
  }, [show]);
  
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button ref={btnRef} onClick={onClick} disabled={disabled}
        className="px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
        style={{
          background: variant === 'primary' ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated,
          border: variant === 'secondary' ? `1px solid ${THEME.border.default}` : 'none',
          color: variant === 'primary' ? '#FFFFFF' : THEME.text.primary
        }}>
        {children}
      </button>
      {show && tooltip && (
        <div className="fixed px-2 py-1 rounded text-xs whitespace-nowrap" style={{ 
          top: pos.top, 
          left: pos.left, 
          transform: 'translateX(-50%)',
          backgroundColor: THEME.tooltip.bg, 
          border: `1px solid ${THEME.tooltip.border}`, 
          color: THEME.text.primary,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};





// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULE CELL
// ═══════════════════════════════════════════════════════════════════════════════
// Check if employee has approved time off for a specific date
// hasApprovedTimeOffForDate moved to src/utils/requests.js

const ScheduleCell = React.memo(({ shift, events = [], date, onClick, availability, storeHours, isDeleted = false, hasApprovedTimeOff = false, isLocked = false }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES_BY_ID[shift.role] : null;
  // S61 — "event-only" cells render as neutral cards replacing the role stripe; work cells
  // get small type-pills overlaid so the work card stays the primary read.
  // Defensive: drop events whose `type` isn't in EVENT_TYPES so a malformed Sheet row
  // (e.g. typo'd 'meting') can't crash the grid.
  const visibleEvents = (events || []).filter(ev => EVENT_TYPES[ev.type]);
  const hasEvents = visibleEvents.length > 0;
  const eventOnly = !shift && hasEvents;
  const firstEvent = hasEvents ? visibleEvents[0] : null;
  const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
  const isHoliday = isStatHoliday(date);
  const shading = getAvailabilityShading(availability, storeHours);
  const isFullyUnavailable = !availability.available;
  const hasPartial = availability.available && (shading.top > 5 || shading.bottom > 5);
  
  // Determine if cell is clickable (locked cells can still show tooltips, just can't edit)
  const isClickable = !isDeleted && !isLocked;
  
  return (
    <>
      <div onClick={isClickable ? onClick : undefined} className={`h-14 rounded-lg transition-all relative overflow-hidden ${isClickable ? 'cursor-pointer group' : isLocked && (shift || hasEvents) ? 'cursor-default' : isLocked ? 'cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: shift ? role?.color + '25' : eventOnly ? firstEventType.bg : THEME.bg.tertiary,
          border: `1px solid ${shift ? role?.color + '50' : eventOnly ? firstEventType.border : THEME.border.default}`
        }}>
        
        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}
        
        {isFullyUnavailable && !shift && !isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '9px' }}>Unavailable</span>
          </div>
        )}

        {hasApprovedTimeOff && !shift && !isDeleted && (
          <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${THEME.accent.cyan}AA 3px, ${THEME.accent.cyan}AA 6px)` }} />
        )}
        
        {hasPartial && shading.top > 5 && !shift && !isDeleted && (
          <div className="absolute top-0 left-0 right-0" style={{ height: `${shading.top}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)` }} />
        )}
        
        {hasPartial && shading.bottom > 5 && !shift && !isDeleted && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: `${shading.bottom}%`, background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)` }} />
        )}
        
        {shift ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative">
            {shift.task && (
              <div ref={starRef} className="absolute top-1 right-1 cursor-pointer" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                <Star size={10} fill={THEME.task} color={THEME.task} />
              </div>
            )}
            <span className="text-xs font-semibold truncate pr-3" style={{ color: role?.color }}>{role?.name}</span>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: THEME.text.secondary }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
              <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>{shift.hours}h</span>
            </div>
            {/* S61 — event pill(s): small neutral chip in bottom-right when a work shift
                also has a meeting/pk the same day. Native title carries the note. */}
            {hasEvents && (
              <div className="absolute bottom-0 right-0 flex gap-0.5 p-0.5">
                {visibleEvents.map((ev, i) => {
                  const et = EVENT_TYPES[ev.type];
                  if (!et) return null;
                  return (
                    <span key={i}
                      title={`${et.label} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`}
                      className="rounded px-1 text-[9px] font-semibold leading-tight"
                      style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}` }}>
                      {et.shortLabel}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ) : eventOnly ? (
          <div className="p-1.5 h-full flex flex-col justify-between relative"
            title={visibleEvents.map(ev => {
              const et = EVENT_TYPES[ev.type];
              return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
            }).join('\n')}>
            <span className="text-xs font-semibold truncate" style={{ color: firstEventType.text }}>
              {visibleEvents.length === 1 ? firstEventType.shortLabel : `${visibleEvents.length} events`}
            </span>
            <span className="text-xs" style={{ color: firstEventType.text, opacity: 0.8 }}>
              {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
            </span>
          </div>
        ) : (
          !isDeleted && !isLocked && (
            <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} style={{ color: THEME.text.muted }} />
            </div>
          )
        )}
        {isClickable && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg" style={{ border: `2px solid ${THEME.accent.purple}` }} />}
      </div>
      <TaskStarTooltip task={shift?.task} show={showTask} triggerRef={starRef} />
    </>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE ROW
// ═══════════════════════════════════════════════════════════════════════════════
const EmployeeRow = React.memo(({ employee, dates, shifts, events = {}, onCellClick, getEmployeeHours, onEdit, isDeleted = false, onShowTooltip, onHideTooltip, timeOffRequests = [], isLocked = false }) => {
  const rowRef = useRef(null);
  const hours = getEmployeeHours(employee.id);

  const handleMouseEnter = () => {
    if (rowRef.current && onShowTooltip) {
      onShowTooltip(employee, hours, rowRef, isDeleted);
    }
  };
  
  const handleMouseLeave = () => {
    if (onHideTooltip) onHideTooltip();
  };

  return (
    <div className="grid gap-px schedule-row" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle, opacity: isDeleted ? 0.5 : 1 }}>
      <div ref={rowRef} className="p-1.5" style={{ backgroundColor: THEME.bg.secondary }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: isDeleted ? THEME.text.muted : 'white' }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs truncate" style={{ color: isDeleted ? THEME.text.muted : THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs font-semibold" style={{ color: isDeleted ? THEME.text.muted : hours >= 40 ? THEME.status.error : hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={hours} decimals={1} suffix="h" /></p>
          </div>
          {!isDeleted && <button onClick={e => { e.stopPropagation(); onEdit(employee); }} className="p-0.5 rounded hover:scale-110 flex-shrink-0" style={{ backgroundColor: THEME.bg.elevated }}><Edit3 size={10} style={{ color: THEME.accent.purple }} /></button>}
        </div>
      </div>
      
      {dates.map((date, i) => {
        const dayName = getDayName(date);
        const av = employee.availability[dayName];
        const storeHrs = getStoreHoursForDate(date);
        const shift = shifts[`${employee.id}-${toDateKey(date)}`];
        const dateStr = toDateKey(date);
        const cellEvents = events[`${employee.id}-${dateStr}`] || [];
        const approvedTimeOff = hasApprovedTimeOffForDate(employee.email, dateStr, timeOffRequests);
        return (
          <div key={dateStr} className="p-0.5" style={{ backgroundColor: THEME.bg.secondary }}>
            <ScheduleCell shift={shift} events={cellEvents} date={date} availability={av} storeHours={storeHrs} onClick={() => !isDeleted && !isLocked && onCellClick(employee, date, shift)} isDeleted={isDeleted} hasApprovedTimeOff={approvedTimeOff} isLocked={isLocked} />
          </div>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// GradientBackground, Logo moved to src/components/uiKit.jsx

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN - Staff: email only, Admin: email + password
// ═══════════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ onLogin, onLoadingComplete }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // First-login password change state
  const [pendingUser, setPendingUser] = useState(null); // Employee data waiting for password change
  const [showFirstLoginPassword, setShowFirstLoginPassword] = useState(false);
  const [pendingDefaultPassword, setPendingDefaultPassword] = useState('');
  
  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await apiCall('login', { 
      email: email.toLowerCase().trim(), 
      password 
    });
    
    setLoading(false);
    
    if (result.success) {
      // S37: persist session token + cached user before any protected call fires.
      if (result.data.token) setAuthToken(result.data.token);
      setCachedUser(result.data.employee);
      // Check if using default password — force password change before proceeding
      if (result.data.usingDefaultPassword) {
        setPendingUser(result.data.employee);
        setPendingDefaultPassword(result.data.defaultPassword || '');
        setShowFirstLoginPassword(true);
      } else {
        onLogin(result.data.employee);
      }
    } else {
      setError(result.error?.message || 'Login failed. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
      <div className="w-full max-w-sm p-6 rounded-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.card }}>
        <div className="text-center mb-6">
          <div style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            <p className="text-xs tracking-widest" style={{ color: THEME.text.muted }}>OVER THE</p>
            <h1 className="text-2xl font-semibold tracking-wider" style={{ color: THEME.text.primary }}>RAINBOW</h1>
          </div>
          <p className="text-sm mt-2" style={{ color: THEME.accent.purple }}>Staff Scheduling</p>
        </div>

        <div className="mb-4">
          <label className="login-label block text-xs font-medium mb-1">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('login-password')?.focus()}
            placeholder="your.email@example.com"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
        </div>

        <div className="mb-4">
          <label className="login-label block text-xs font-medium mb-1">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg outline-none text-sm"
            style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          />
          <p className="login-hint text-xs mt-1">First time? Use your employee ID as password</p>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: THEME.status.error }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
          style={{
            background: loading ? THEME.bg.tertiary : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
            color: loading ? THEME.text.muted : THEME.accent.text,
            opacity: loading ? 0.7 : 1
          }}>
          {loading ? <><div className="rainbow-spinner" /> Signing in...</> : 'Sign In'}
        </button>
      </div>
      
      {/* First-login forced password change modal */}
      {pendingUser && (
        <ChangePasswordModal
          isOpen={showFirstLoginPassword}
          onClose={() => {}}
          currentUser={pendingUser}
          isFirstLogin={true}
          defaultPassword={pendingDefaultPassword}
          onSuccess={() => {
            // Password changed successfully — proceed with login
            onLogin(pendingUser);
          }}
        />
      )}
    </div>
  );
};





// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION - Reusable wrapper for collapsible content
// ═══════════════════════════════════════════════════════════════════════════════
// CollapsibleSection moved to src/components/CollapsibleSection.jsx














// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN HEADER EDITOR - Click to edit store hours and staffing target per date
// ═══════════════════════════════════════════════════════════════════════════════
const ColumnHeaderEditor = ({ date, storeHours, target, storeHoursOverrides, staffingTargetOverrides, onSave, onClose }) => {
  const isMobile = useIsMobile();
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
    await onSave(dateStr, null, null); // null = remove override
    setSaving(false);
    onClose();
  };
  
  const body = (
    <>
        {!isMobile && (
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold" style={{ color: THEME.text.primary }}>{dayLabel}</h3>
            <button onClick={onClose} className="p-0.5 rounded hover:opacity-70"><X size={14} style={{ color: THEME.text.muted }} /></button>
          </div>
        )}

        {isPast ? (
          <p className="text-xs py-2" style={{ color: THEME.text.muted }}>Past dates cannot be edited.</p>
        ) : (
          <>
            {/* Store Hours */}
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Store Hours
                {hasHoursOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                  className="flex-1 px-1.5 py-1 rounded-lg outline-none text-sm"
                  style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
                <span className="text-xs" style={{ color: THEME.text.muted }}>to</span>
                <input 
                  type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                  className="flex-1 px-1.5 py-1 rounded-lg outline-none text-sm"
                  style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
                />
              </div>
            </div>
            
            {/* Staffing Target */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
                Staffing Target
                {hasTargetOverride && <span className="ml-1 px-1 rounded" style={{ backgroundColor: THEME.accent.cyan + '20', color: THEME.accent.cyan, fontSize: '9px' }}>OVERRIDE</span>}
              </label>
              <input 
                type="number" min="0" max="99" value={editTarget} onChange={e => setEditTarget(parseInt(e.target.value, 10) || 0)}
                className="w-20 px-1.5 py-1 rounded-lg outline-none text-sm text-center"
                style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
              />
            </div>
            
            {/* Actions */}
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
        className="rounded-xl shadow-2xl p-3 w-64"
        style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.bright}` }}
        onClick={e => e.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  // S37: if a session token + cached user survived the page refresh, start signed in.
  // First protected apiCall will expire-bounce the user to login if the token is stale.
  const [currentUser, setCurrentUser] = useState(() => {
    return getAuthToken() ? getCachedUser() : null;
  });
  const isMobileAdmin = useIsMobile();
  const [employees, setEmployees] = useState([]);
  const [periodIndex, setPeriodIndex] = useState(CURRENT_PERIOD_INDEX);
  const [shifts, setShifts] = useState({});
  // S61 — Meeting/PK overlay entries, keyed identically to `shifts`. Values are arrays
  // (a cell can hold both a meeting and a pk). Work shifts stay in `shifts`; this map
  // exists alongside so the 25+ existing `shifts[key]` access sites keep working.
  const [events, setEvents] = useState({});
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [unsaved, setUnsaved] = useState(false);
  const [published, setPublished] = useState(false);

  // Warn before refresh/close when there are unsaved schedule changes
  useEffect(() => {
    if (!unsaved) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsaved]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'comms', or 'requests'
  
  // Loading state for initial data fetch
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  // Toast notification state for save operations
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  
  // Helper to show toast with auto-dismiss
  const showToast = (type, message, duration = 3000) => {
    setToast({ type, message });
    const announcer = typeof document !== 'undefined' && document.getElementById('status-announcer');
    if (announcer) announcer.textContent = message;
    setTimeout(() => setToast(null), duration);
  };
  
  // Edit Mode: Per-period tracking - each pay period can be independently LIVE or in Edit Mode
  // Key = periodIndex, Value = true (edit mode) or false (live/locked)
  // New periods default to edit mode (true)
  const [editModeByPeriod, setEditModeByPeriod] = useState({});
  const [publishedShifts, setPublishedShifts] = useState({});
  const [publishedEvents, setPublishedEvents] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState(false); // True while batch saving shifts
  const [staffingTargets, setStaffingTargets] = useState(DEFAULT_STAFFING_TARGETS);
  const [storeHoursOverrides, setStoreHoursOverrides] = useState({}); // { "2026-02-14": { open: "10:00", close: "21:00" } }
  const [staffingTargetOverrides, setStaffingTargetOverrides] = useState({}); // { "2026-02-14": 12 }
  const [editingColumnDate, setEditingColumnDate] = useState(null); // Date object for column header popover
  
  // Sync overrides to module-level refs (so getStoreHoursForDate works outside component)
  useEffect(() => { _storeHoursOverrides = storeHoursOverrides; }, [storeHoursOverrides]);
  useEffect(() => { _staffingTargetOverrides = staffingTargetOverrides; }, [staffingTargetOverrides]);
  
  // Helper to check if current period is in edit mode (defaults to true for new periods)
  const isCurrentPeriodEditMode = editModeByPeriod[periodIndex] ?? true;
  const [announcements, setAnnouncements] = useState({}); // Keyed by periodStartDate (YYYY-MM-DD)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  
  // Get periodStartDate string for current period (must be calculated inline since startDate isn't available yet)
  const getCurrentPeriodStartDate = () => {
    const sd = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (periodIndex * 14));
    return toDateKey(sd);
  };
  
  // Get/set announcement for current period using startDate as key
  const currentPeriodStartDate = getCurrentPeriodStartDate();
  const currentAnnouncement = announcements[currentPeriodStartDate] || { subject: '', message: '' };
  const setCurrentAnnouncement = (ann) => setAnnouncements(prev => ({ ...prev, [currentPeriodStartDate]: ann }));
  
  // Save announcement to backend
  const saveAnnouncement = async (announcement) => {
    if (!currentUser?.email) return;
    
    const periodStartDate = getCurrentPeriodStartDate();
    // If both subject and message are empty, delete instead of save
    if (!announcement.subject && !announcement.message) {
      await clearAnnouncement();
      return;
    }
    
    setSavingAnnouncement(true);
    const result = await apiCall('saveAnnouncement', {
      periodStartDate: periodStartDate,
      subject: announcement.subject,
      message: announcement.message
    });
    
    if (result.success) {
      // Update local state with the saved announcement (includes id and updatedAt)
      setAnnouncements(prev => ({
        ...prev,
        [periodStartDate]: result.data.announcement
      }));
    } else {
      alert('Failed to save announcement: ' + (result.error?.message || 'Unknown error'));
    }
    setSavingAnnouncement(false);
  };
  
  // Clear/delete announcement from backend
  const clearAnnouncement = async () => {
    if (!currentUser?.email) return;
    
    const periodStartDate = getCurrentPeriodStartDate();
    // Always try to delete - backend will handle if not found
    setSavingAnnouncement(true);
    const result = await apiCall('deleteAnnouncement', {
      periodStartDate: periodStartDate
    });
    
    if (!result.success) {
      // NOT_FOUND is fine - means there was nothing to delete
    }
    setSavingAnnouncement(false);
    
    // Clear local state
    setAnnouncements(prev => ({
      ...prev,
      [periodStartDate]: { subject: '', message: '' }
    }));
  };
  
  const [inactivePanelOpen, setInactivePanelOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [shiftOffers, setShiftOffers] = useState([]);
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [adminRequestModalOpen, setAdminRequestModalOpen] = useState(false);
  const [welcomeSweep, setWelcomeSweep] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);
  useEffect(() => {
    if (!adminMenuOpen) return;
    const onDoc = (e) => { if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) setAdminMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setAdminMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [adminMenuOpen]);
  const [adminDaysOffModalOpen, setAdminDaysOffModalOpen] = useState(false);
  const [pkModalOpen, setPkModalOpen] = useState(false);
  const [autoPopulateConfirm, setAutoPopulateConfirm] = useState(null); // { type: 'populate-all' | 'populate-week' | 'clear-week' | 'clear-all', employee?: obj, week?: 1|2 }
  
  // Mobile admin state
  const [mobileAdminDrawerOpen, setMobileAdminDrawerOpen] = useState(false);
  const [mobileStaffPanelOpen, setMobileStaffPanelOpen] = useState(false);
  // When the Edit/Add form is opened from the Staff bottom-sheet we hide the
  // sheet so the form can stack above the z-200 drawer. On form close, reopen
  // the sheet so the user lands back where they started. A ref (not state)
  // avoids any render-timing races between onClose and the reopen effect.
  const reopenStaffAfterFormRef = useRef(false);
  useEffect(() => {
    if (!empFormOpen && reopenStaffAfterFormRef.current) {
      reopenStaffAfterFormRef.current = false;
      setMobileStaffPanelOpen(true);
    }
  }, [empFormOpen]);
  const [mobileAdminTab, setMobileAdminTab] = useState('schedule'); // 'schedule' | 'requests' | 'comms'
  const [mobileAdminChangePasswordOpen, setMobileAdminChangePasswordOpen] = useState(false);
  const [quickViewEmployee, setQuickViewEmployee] = useState(null);
  
  // Admin handler for selecting request type
  const handleAdminSelectRequestType = (type) => {
    setAdminRequestModalOpen(false);
    if (type === 'days-off') {
      setAdminDaysOffModalOpen(true);
    }
  };
  
  // Reset pay period to current when user changes
  useEffect(() => {
    setPeriodIndex(CURRENT_PERIOD_INDEX);
  }, [currentUser?.id]);

  // S37: auto-bounce to login on AUTH_EXPIRED / AUTH_INVALID from any apiCall.
  useEffect(() => {
    setOnAuthFailure(() => {
      setCurrentUser(null);
      showToast('warning', 'Session expired. Please log in again.', 4000);
    });
    return () => setOnAuthFailure(null);
  }, []);

  // S37: if we restored a user from localStorage on mount, fire the normal data-load.
  // If the token is stale, loadDataFromBackend will surface AUTH_EXPIRED and the
  // callback above will bounce us to the login screen.
  const didBootstrapRef = useRef(false);
  // S41.2: guard against double-submit on admin approve/deny/revoke/cancel actions.
  // Apps Script round-trip is 2-3s; impatient users click twice, second click hits
  // backend after status already moved and gets a misleading red error toast.
  const actionBusyRef = useRef(false);
  const guardedMutation = async (label, fn) => {
    if (actionBusyRef.current) return; // silent: second click while first is in-flight
    actionBusyRef.current = true;
    showToast('saving', `${label}…`, 30000); // stays until fn's own showToast replaces it
    try {
      await fn();
    } finally {
      actionBusyRef.current = false;
    }
  };

  // Autofill PK across a whole week: loop days, per-day default times (Sat 10:00-10:45,
  // others 18:00-20:00), eligible full-timers by availability window. Sequential apiCalls
  // because Apps Script write-lock contention on parallel bulkCreatePKEvent is likely.
  const handleAutofillPKWeek = async (weekDates, weekNum) => {
    await guardedMutation('Autofilling PK week', async () => {
      const byDay = weekDates.map(d => {
        const dateStr = toDateKey(d);
        const { start, end } = getPKDefaultTimes(dateStr);
        const eligibleIds = fullTimeEmployees
          .filter(emp => availabilityCoversWindow(emp.availability, dateStr, start, end).eligible)
          .map(emp => emp.id);
        return { dateStr, start, end, eligibleIds };
      });
      let createdTotal = 0;
      let skippedDays = 0;
      for (let i = 0; i < byDay.length; i++) {
        const { dateStr, start, end, eligibleIds } = byDay[i];
        if (eligibleIds.length === 0) { skippedDays++; continue; }
        showToast('saving', `PK day ${i + 1} of ${byDay.length}...`, 30000);
        const result = await apiCall('bulkCreatePKEvent', {
          date: dateStr, startTime: start, endTime: end, note: '', employeeIds: eligibleIds,
        });
        if (result.success) {
          createdTotal += (result.data?.created?.length || 0);
        }
      }
      const msg = skippedDays > 0
        ? `PK autofilled: ${createdTotal} shifts, ${skippedDays} day(s) skipped (no eligible)`
        : `PK autofilled: ${createdTotal} shifts across week ${weekNum}`;
      showToast('success', msg);
      if (currentUser?.email) await loadDataFromBackend(currentUser.email);
    });
  };

  // S62 — Bulk PK: one modal, one save. Backend createPKEvent is already in Code.gs (v2.21.0).
  const handleBulkPK = async (payload) => {
    await guardedMutation('Scheduling PK', async () => {
      const result = await apiCall('bulkCreatePKEvent', payload);
      if (!result.success) {
        showToast('error', result.error?.message || 'Failed to schedule PK');
        return;
      }
      const { created = [], skipped = [] } = result.data || {};
      let msg = `PK scheduled for ${created.length}`;
      if (skipped.length) msg += ` (${skipped.length} skipped)`;
      showToast('success', msg);
      setPkModalOpen(false);
      if (currentUser?.email) await loadDataFromBackend(currentUser.email);
    });
  };
  useEffect(() => {
    if (didBootstrapRef.current) return;
    if (currentUser?.email && getAuthToken()) {
      didBootstrapRef.current = true;
      loadDataFromBackend(currentUser.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load all data from backend after login
  const loadDataFromBackend = async (userEmail) => {
    setIsLoadingData(true);
    setLoadError(null);
    
    const result = await apiCall('getAllData', {});
    
    if (result.success) {
      const { employees: empData, shifts: shiftData, requests } = result.data;
      
      // Set employees - parse availability JSON string to object. Any fallback path
      // MUST return a fully-populated week so `employee.availability[dayName].available`
      // never reads off undefined (crashes ScheduleCell + blanks the app).
      const DEFAULT_AVAILABILITY = {
        sunday: { available: true, start: '11:00', end: '18:00' },
        monday: { available: true, start: '11:00', end: '18:00' },
        tuesday: { available: true, start: '11:00', end: '18:00' },
        wednesday: { available: true, start: '11:00', end: '18:00' },
        thursday: { available: true, start: '11:00', end: '19:00' },
        friday: { available: true, start: '11:00', end: '19:00' },
        saturday: { available: true, start: '11:00', end: '19:00' }
      };
      const ensureFullWeek = (av) => {
        if (!av || typeof av !== 'object') return { ...DEFAULT_AVAILABILITY };
        const out = { ...DEFAULT_AVAILABILITY };
        for (const day of Object.keys(DEFAULT_AVAILABILITY)) {
          if (av[day] && typeof av[day] === 'object') out[day] = av[day];
        }
        return out;
      };
      const parsedEmployees = (empData || []).map(emp => ({
        ...emp,
        availability: ensureFullWeek(
          typeof emp.availability === 'string'
            ? (() => { try { return JSON.parse(emp.availability); } catch { return null; } })()
            : emp.availability
        )
      }));
      setEmployees(parsedEmployees);
      
      // Convert shifts array to keyed object { "empId-date": shiftData }
      // Also fix date/time formats from Google Sheets
      // S61 — Partition by `type`: work entries land in `shiftsObj`,
      // meeting/pk entries land in `eventsObj` (array per cell).
      const shiftsObj = {};
      const eventsObj = {};
      (shiftData || []).forEach(shift => {
        // Fix date format - Sheets returns ISO timestamp, we need YYYY-MM-DD
        let dateStr = shift.date;
        if (dateStr && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        // Fix time format - Sheets returns weird Excel dates like "1899-12-30T15:00:00.000Z"
        // We need just "HH:MM"
        let startTime = shift.startTime;
        let endTime = shift.endTime;
        
        if (startTime && startTime.includes('T')) {
          // Extract time portion from ISO string
          const timePart = startTime.split('T')[1];
          if (timePart) {
            startTime = timePart.substring(0, 5); // "15:00:00.000Z" -> "15:00"
          }
        }
        
        if (endTime && endTime.includes('T')) {
          const timePart = endTime.split('T')[1];
          if (timePart) {
            endTime = timePart.substring(0, 5);
          }
        }
        
        const fixedShift = {
          ...shift,
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          hours: calculateHours(startTime, endTime) // Calculate hours from times
        };
        
        const key = `${fixedShift.employeeId}-${dateStr}`;
        const shiftType = fixedShift.type || 'work';
        if (shiftType === 'work') {
          shiftsObj[key] = fixedShift;
        } else {
          (eventsObj[key] = eventsObj[key] || []).push(fixedShift);
        }
      });
      setShifts(shiftsObj);
      setEvents(eventsObj);
      
      // Load live periods from backend BEFORE filtering published shifts
      const { livePeriods: loadedLivePeriods } = result.data;
      const editModeObj = {};
      if (loadedLivePeriods && Array.isArray(loadedLivePeriods)) {
        loadedLivePeriods.forEach(pIndex => {
          editModeObj[pIndex] = false; // LIVE = not in edit mode
        });
        setEditModeByPeriod(editModeObj);
      }
      
      // Build publishedShifts: ONLY include shifts from LIVE periods
      // Non-live periods are drafts that employees should not see
      const publishedObj = {};
      const publishedEventsObj = {};
      if (loadedLivePeriods && loadedLivePeriods.length > 0) {
        // Build a Set of all dates that belong to LIVE periods
        const liveDates = new Set();
        loadedLivePeriods.forEach(pIndex => {
          const pStart = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (pIndex * 14));
          for (let d = 0; d < 14; d++) {
            const dt = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate() + d);
            liveDates.add(toDateKey(dt));
          }
        });
        // Only copy shifts whose date falls within a live period
        Object.entries(shiftsObj).forEach(([key, shift]) => {
          const shiftDate = key.split('-').slice(-3).join('-'); // emp-id-YYYY-MM-DD → YYYY-MM-DD
          // More robust: use the shift's date field
          const dateStr = shift.date || shiftDate;
          if (liveDates.has(dateStr)) {
            publishedObj[key] = shift;
          }
        });
        // S61 — mirror for meeting/pk overlay entries
        Object.entries(eventsObj).forEach(([key, arr]) => {
          const firstDate = (arr && arr[0] && arr[0].date) || key.split('-').slice(-3).join('-');
          if (liveDates.has(firstDate)) {
            publishedEventsObj[key] = arr;
          }
        });
      }
      setPublishedShifts(publishedObj);
      setPublishedEvents(publishedEventsObj);
      
      // Process requests into the 3 types with field mapping
      // Backend uses employeeName/employeeEmail/requestId, frontend uses different names
      const timeOff = (requests || []).filter(r => r.requestType === 'time_off').map(r => ({
        ...r,
        name: r.employeeName || r.name,
        email: r.employeeEmail || r.email
      }));
      
      const offers = (requests || []).filter(r => r.requestType === 'shift_offer').map(o => ({
        ...o,
        offerId: o.requestId || o.offerId,
        offererName: o.employeeName || o.offererName,
        offererEmail: o.employeeEmail || o.offererEmail
      }));
      
      const swaps = (requests || []).filter(r => r.requestType === 'shift_swap').map(s => ({
        ...s,
        swapId: s.requestId || s.swapId,
        initiatorName: s.employeeName || s.initiatorName,
        initiatorEmail: s.employeeEmail || s.initiatorEmail
      }));
      
      setTimeOffRequests(timeOff);
      setShiftOffers(offers);
      setShiftSwaps(swaps);
      
      // Load announcements from backend
      const { announcements: loadedAnnouncements } = result.data;
      if (loadedAnnouncements && Array.isArray(loadedAnnouncements)) {
        // Convert array to object keyed by periodStartDate (YYYY-MM-DD)
        const announcementsObj = {};
        loadedAnnouncements.forEach(ann => {
          // Normalize the date to YYYY-MM-DD
          const dateKey = ann.periodStartDate ? String(ann.periodStartDate).split('T')[0] : null;
          if (dateKey) {
            announcementsObj[dateKey] = {
              id: ann.id,
              periodStartDate: dateKey,
              subject: ann.subject || '',
              message: ann.message || '',
              updatedAt: ann.updatedAt
            };
          }
        });
        setAnnouncements(announcementsObj);
      }
      
      // Load staffing targets from backend (falls back to DEFAULT_STAFFING_TARGETS)
      const { staffingTargets: loadedTargets, storeHoursOverrides: loadedHoursOverrides, staffingTargetOverrides: loadedTargetOverrides } = result.data;
      if (loadedTargets && typeof loadedTargets === 'object') {
        setStaffingTargets({ ...DEFAULT_STAFFING_TARGETS, ...loadedTargets });
      }
      if (loadedHoursOverrides && typeof loadedHoursOverrides === 'object') {
        setStoreHoursOverrides(loadedHoursOverrides);
      }
      if (loadedTargetOverrides && typeof loadedTargetOverrides === 'object') {
        setStaffingTargetOverrides(loadedTargetOverrides);
      }
      
      setIsLoadingData(false);
      return true;
    } else {
      setLoadError(result.error?.message || 'Failed to load data');
      setIsLoadingData(false);
      return false;
    }
  };
  
  // Handle login - set user and load data (min 1s loading display)
  const handleLogin = async (user) => {
    // S52: defensive parse — login response carries availability as raw Sheet
    // value (often empty string). JSON.parse('') throws and silently drops the
    // user back to login. ensureFullWeek in getAllData covers data-load; this
    // covers the login path. Same root cause class as S50 white-screen bug.
    let parsedAvailability = user.availability;
    if (typeof parsedAvailability === 'string') {
      try {
        parsedAvailability = parsedAvailability ? JSON.parse(parsedAvailability) : {};
      } catch {
        parsedAvailability = {};
      }
    }
    const parsedUser = { ...user, availability: parsedAvailability };
    setCurrentUser(parsedUser);
    setWelcomeSweep(true);
    await loadDataFromBackend(parsedUser.email);
  };
  
  const { startDate, endDate, dates } = useMemo(() => getPayPeriodDates(periodIndex), [periodIndex]);
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);
  const currentDates = activeWeek === 1 ? week1 : week2;
  
  // Toggle between Edit Mode and LIVE for the CURRENT pay period
  // When going LIVE: batch save shifts + persist LIVE status to backend
  // MUST be defined after `dates` is available
  const toggleEditMode = async () => {
    if (scheduleSaving) return; // Prevent double-clicks during save
    haptic();
    const currentlyEditing = editModeByPeriod[periodIndex] ?? true;
    
    if (currentlyEditing) {
      if (!window.confirm('Publish this schedule? Employees will see the published shifts.')) return;
      setScheduleSaving(true);
      // Going from Edit Mode → LIVE: batch save shifts and mark as LIVE
      
      // Collect all shifts for this period (work + meeting + pk)
      const periodShifts = [];
      const periodDates = [];
      dates.forEach(date => {
        const dateStr = toDateKey(date);
        periodDates.push(dateStr);
        employees.forEach(emp => {
          const key = `${emp.id}-${dateStr}`;
          if (shifts[key]) {
            // Build full shift object for API
            periodShifts.push({
              id: shifts[key].id || `shift-${emp.id}-${dateStr}`,
              employeeId: emp.id,
              employeeName: emp.name,
              employeeEmail: emp.email,
              date: dateStr,
              startTime: shifts[key].startTime,
              endTime: shifts[key].endTime,
              role: shifts[key].role || 'none',
              task: shifts[key].task || '',
              type: 'work',
              note: ''
            });
          }
          // S61 — meeting/pk overlay entries live alongside the work shift and
          // also need to reach the Sheet when the period is saved.
          (events[key] || []).forEach(ev => {
            periodShifts.push({
              id: ev.id || `${(ev.type || 'evt').toUpperCase()}-${emp.id}-${dateStr}`,
              employeeId: emp.id,
              employeeName: emp.name,
              employeeEmail: emp.email,
              date: dateStr,
              startTime: ev.startTime,
              endTime: ev.endTime,
              role: ev.role || 'none',
              task: '',
              type: ev.type || 'meeting',
              note: ev.note || '',
              hours: typeof ev.hours === 'number' ? ev.hours : calculateHours(ev.startTime, ev.endTime)
            });
          });
        });
      });

      // Batch save shifts to backend
      setToast({ type: 'saving', message: `Saving ${periodShifts.length} shifts...` });
      const saveResult = await apiCall('batchSaveShifts', {
          shifts: periodShifts,
        periodDates: periodDates
      }, (saved, total, chunk, totalChunks) => {
        setToast({ type: 'saving', message: `Saving shifts... ${saved}/${total}` });
      });
      
      if (!saveResult.success) {
        const d = saveResult.data;
        const partial = d && d.totalChunks > 1 && d.failedChunks < d.totalChunks;
        const msg = partial
          ? `NOT PUBLISHED — ${d.totalChunks - d.failedChunks} of ${d.totalChunks} batches saved. Click Publish again to retry.`
          : (saveResult.error?.message || 'Failed to save schedule — schedule is NOT published');
        showToast('error', msg);
        setScheduleSaving(false);
        return;
      }
      
      // Update local published shifts
      const newPublished = { ...publishedShifts };
      dates.forEach(date => {
        const dateStr = toDateKey(date);
        employees.forEach(emp => {
          const key = `${emp.id}-${dateStr}`;
          if (shifts[key]) {
            newPublished[key] = { ...shifts[key] };
          } else {
            delete newPublished[key];
          }
        });
      });
      setPublishedShifts(newPublished);
      
      // Calculate new live periods array and save to backend
      const newEditMode = { ...editModeByPeriod, [periodIndex]: false };
      setEditModeByPeriod(newEditMode);
      
      // Get all period indexes that are LIVE (editMode = false)
      const livePeriodIndexes = Object.entries(newEditMode)
        .filter(([_, isEditing]) => !isEditing)
        .map(([idx, _]) => parseInt(idx, 10));
      
      const liveResult = await apiCall('saveLivePeriods', {
          livePeriods: livePeriodIndexes
      });
      if (!liveResult.success) {
        showToast('error', 'Failed to publish schedule. Please try again.');
        setScheduleSaving(false);
        return;
      }

      showToast('success', `Schedule is now LIVE! Saved ${saveResult.data?.savedCount || 0} shifts.`);
      setScheduleSaving(false);
      setUnsaved(false);
      
    } else {
      // Going from LIVE → Edit Mode: just update local state and save to backend
      const newEditMode = { ...editModeByPeriod, [periodIndex]: true };
      setEditModeByPeriod(newEditMode);
      
      // Get all period indexes that are LIVE
      const livePeriodIndexes = Object.entries(newEditMode)
        .filter(([_, isEditing]) => !isEditing)
        .map(([idx, _]) => parseInt(idx, 10));
      
      const editResult = await apiCall('saveLivePeriods', {
          livePeriods: livePeriodIndexes
      });
      if (!editResult.success) {
        showToast('error', 'Failed to update schedule mode. Please try again.');
        return;
      }

      showToast('success', 'Switched to Edit Mode');
    }
  };
  
  // Save schedule without going LIVE (batch save shifts to Sheets, stay in Edit Mode)
  const saveSchedule = async () => {
    if (scheduleSaving) return;
    haptic();
    setScheduleSaving(true);
    // Collect all shifts for this period (work + meeting + pk)
    const periodShifts = [];
    const periodDates = [];
    dates.forEach(date => {
      const dateStr = toDateKey(date);
      periodDates.push(dateStr);
      employees.forEach(emp => {
        const key = `${emp.id}-${dateStr}`;
        if (shifts[key]) {
          periodShifts.push({
            id: shifts[key].id || `shift-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeName: emp.name,
            employeeEmail: emp.email,
            date: dateStr,
            startTime: shifts[key].startTime,
            endTime: shifts[key].endTime,
            role: shifts[key].role || 'none',
            task: shifts[key].task || '',
            type: 'work',
            note: ''
          });
        }
        // S61 — event entries (meeting/pk) ride along on the same batch save.
        (events[key] || []).forEach(ev => {
          periodShifts.push({
            id: ev.id || `${(ev.type || 'evt').toUpperCase()}-${emp.id}-${dateStr}`,
            employeeId: emp.id,
            employeeName: emp.name,
            employeeEmail: emp.email,
            date: dateStr,
            startTime: ev.startTime,
            endTime: ev.endTime,
            role: ev.role || 'none',
            task: '',
            type: ev.type || 'meeting',
            note: ev.note || '',
            hours: typeof ev.hours === 'number' ? ev.hours : calculateHours(ev.startTime, ev.endTime)
          });
        });
      });
    });
    
    setToast({ type: 'saving', message: `Saving ${periodShifts.length} shifts...` });
    const saveResult = await apiCall('batchSaveShifts', {
      shifts: periodShifts,
      periodDates: periodDates
    }, (saved, total, chunk, totalChunks) => {
      setToast({ type: 'saving', message: `Saving shifts... ${saved}/${total}` });
    });
    
    if (saveResult.success) {
      setUnsaved(false);
      showToast('success', `Saved ${saveResult.data?.savedCount || 0} shifts`);
    } else {
      const d = saveResult.data;
      const msg = (d && d.totalChunks > 1 && d.failedChunks < d.totalChunks)
        ? `Schedule save incomplete: ${d.totalChunks - d.failedChunks} of ${d.totalChunks} batches saved. Please retry.`
        : (saveResult.error?.message || 'Failed to save');
      showToast('error', msg);
      // unsaved flag intentionally NOT cleared — user can retry
    }
    setScheduleSaving(false);
  };
  
  // Save per-date store hours and/or staffing target override
  // Pass null for hours/target to remove that override
  const saveColumnOverrides = async (dateStr, hours, targetVal) => {
    // Update store hours overrides
    const newHoursOverrides = { ...storeHoursOverrides };
    if (hours === null) {
      delete newHoursOverrides[dateStr];
    } else if (hours) {
      newHoursOverrides[dateStr] = hours;
    }
    setStoreHoursOverrides(newHoursOverrides);
    
    // Update staffing target overrides
    const newTargetOverrides = { ...staffingTargetOverrides };
    if (targetVal === null) {
      delete newTargetOverrides[dateStr];
    } else if (targetVal !== undefined) {
      newTargetOverrides[dateStr] = targetVal;
    }
    setStaffingTargetOverrides(newTargetOverrides);
    
    // Save both to backend in parallel
    const [hoursResult, targetResult] = await Promise.all([
      apiCall('saveSetting', {
          key: 'storeHoursOverrides',
        value: newHoursOverrides
      }),
      apiCall('saveSetting', {
          key: 'staffingTargetOverrides',
        value: newTargetOverrides
      })
    ]);
    
    if (hoursResult.success && targetResult.success) {
      showToast('success', 'Day settings saved');
    } else {
      showToast('error', 'Failed to save day settings');
    }
  };
  
  // Active employees for scheduling (exclude owner, exclude admins unless showOnSchedule)
  // Sort: Sarvi first (if schedulable), then full-time (alpha), then part-time (alpha)
  const schedulableEmployees = useMemo(() => [...employees]
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule)
    .sort((a, b) => {
      // Sarvi always first (check by name, case-insensitive)
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
    }), [employees]);
  
  // Full-time employees only (for auto-populate feature)
  const fullTimeEmployees = useMemo(() => schedulableEmployees.filter(e => e.employmentType === 'full-time'), [schedulableEmployees]);
  
  // Admin contacts (admins who are not owner, for display purposes)
  const adminContacts = useMemo(() => employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted), [employees]);
  
  // All active employees including admins (for employee management)
  const allActiveEmployees = useMemo(() => [...employees].filter(e => e.active && !e.deleted && !e.isOwner).sort((a, b) => a.name.localeCompare(b.name)), [employees]);
  
  // Count inactive/deleted for badge (exclude owner from count)
  const inactiveCount = employees.filter(e => (!e.active || e.deleted) && !e.isOwner).length;
  
  // Hidden staff: inactive employees + admins not on schedule (for management section below legend)
  const hiddenStaff = useMemo(() => {
    return employees
      .filter(e => !e.isOwner && !e.deleted) // Not owner, not deleted
      .filter(e => !e.active || (e.isAdmin && !e.showOnSchedule)) // Inactive OR admin hidden from schedule
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  // Perf: pre-compute dateKey strings for the current period once per render
  const currentDateStrs = useMemo(() => currentDates.map(toDateKey), [currentDates]);
  const todayStr = useMemo(() => toDateKey(new Date()), []);

  // S61 — hours count work + meeting + pk, but overlaps are union-counted.
  // Fast path: day has only a work shift (no events). Slow path: events present,
  // merge all intervals for the day and sum the union.
  const getEmpHours = useCallback((id) => {
    let t = 0;
    for (let i = 0; i < currentDateStrs.length; i++) {
      const key = `${id}-${currentDateStrs[i]}`;
      const work = shifts[key];
      const evs = events[key];
      if (!evs || evs.length === 0) {
        if (work) t += work.hours || 0;
      } else {
        const all = work ? [work, ...evs] : evs;
        t += computeDayUnionHours(all);
      }
    }
    return t;
  }, [currentDateStrs, shifts, events]);

  // Count scheduled employees for a given date
  const getScheduledCount = useCallback((date) => {
    const dateStr = toDateKey(date);
    return schedulableEmployees.filter(emp => shifts[`${emp.id}-${dateStr}`]).length;
  }, [schedulableEmployees, shifts]);
  
  // Get staffing target for a given date (per-date override → weekly default → fallback)
  const getStaffingTarget = (date) => {
    const dateStr = toDateKey(date);
    if (staffingTargetOverrides[dateStr] !== undefined) return staffingTargetOverrides[dateStr];
    const dayName = getDayName(date).toLowerCase();
    return staffingTargets[dayName] || DEFAULT_STAFFING_TARGETS[dayName] || 8;
  };
  
  // Auto-populate shift for an employee on a date based on their availability
  const createShiftFromAvailability = (employee, date) => {
    const dayName = getDayName(date).toLowerCase();
    const avail = employee.availability?.[dayName];
    
    // If not available on this day, skip
    if (!avail || !avail.available) return null;
    
    const dateStr = toDateKey(date);
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      date: dateStr,
      startTime: avail.start || STORE_HOURS[dayName].open,
      endTime: avail.end || STORE_HOURS[dayName].close,
      role: employee.defaultSection || 'none',
      task: '',
      // S61 — explicit so `allShiftKeys` and the backend key both agree on 'work'
      type: 'work',
      note: '',
      hours: calculateHours(avail.start || STORE_HOURS[dayName].open, avail.end || STORE_HOURS[dayName].close)
    };
  };
  
  // Check if employee has shifts in a week
  const employeeHasShiftsInWeek = (employee, weekDates) => {
    return weekDates.some(date => {
      const dateStr = toDateKey(date);
      return shifts[`${employee.id}-${dateStr}`];
    });
  };
  
  // Auto-populate all full-time employees for a specific week
  const autoPopulateWeek = (weekDates, targetEmployees = null) => {
    const emps = targetEmployees || fullTimeEmployees;
    const newShifts = { ...shifts };
    let addedCount = 0;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    emps.forEach(emp => {
      weekDates.forEach(date => {
        if (date < todayStart) return;
        const dateStr = toDateKey(date);
        const key = `${emp.id}-${dateStr}`;

        if (!newShifts[key]) {
          const shift = createShiftFromAvailability(emp, date);
          if (shift) {
            newShifts[key] = shift;
            addedCount++;
          }
        }
      });
    });
    
    if (addedCount > 0) {
      setShifts(newShifts);
      setUnsaved(true);
    }
    
    return addedCount;
  };
  
  // Clear all shifts for specific employees in a week
  const clearWeekShifts = (weekDates, targetEmployees = null) => {
    const emps = targetEmployees || fullTimeEmployees;
    const empIds = new Set(emps.map(e => e.id));
    const newShifts = { ...shifts };
    let removedCount = 0;
    
    weekDates.forEach(date => {
      const dateStr = toDateKey(date);
      empIds.forEach(empId => {
        const key = `${empId}-${dateStr}`;
        if (newShifts[key]) {
          delete newShifts[key];
          removedCount++;
        }
      });
    });
    
    if (removedCount > 0) {
      setShifts(newShifts);
      setUnsaved(true);
    }
    
    return removedCount;
  };
  
  // Handle auto-populate confirmation
  const handleAutoPopulateConfirm = () => {
    if (!autoPopulateConfirm) return;
    
    const { type, employee, week } = autoPopulateConfirm;
    const weekDates = week === 1 ? week1 : week2;
    
    if (type === 'populate-all') {
      let total;
      if (week) {
        total = autoPopulateWeek(weekDates);
      } else {
        total = autoPopulateWeek(week1) + autoPopulateWeek(week2);
      }
      const weekLabel = week ? `Week ${week}` : 'this period';
      if (total > 0) showToast('success', `Added ${total} shifts to ${weekLabel} — click SAVE to persist`);
      else showToast('warning', `No shifts added to ${weekLabel} — check that full-time employees have availability set`);
    } else if (type === 'populate-week' && employee) {
      const count = autoPopulateWeek(weekDates, [employee]);
      if (count > 0) showToast('success', `Added ${count} shifts for ${employee.name} (Week ${week}) — click SAVE to persist`);
      else showToast('warning', `No shifts added — ${employee.name} may not have availability set for Week ${week}`);
    } else if (type === 'clear-week' && employee) {
      const count = clearWeekShifts(weekDates, [employee]);
      showToast('success', `Removed ${count} shifts for ${employee.name}`);
    } else if (type === 'clear-all') {
      const count = clearWeekShifts(weekDates);
      showToast('success', `Removed ${count} shifts for full-time employees`);
    } else if (type === 'autofill-pk-week') {
      setAutoPopulateConfirm(null);
      handleAutofillPKWeek(weekDates, week);
      return;
    }

    setAutoPopulateConfirm(null);
  };
  
  const saveEmployee = async (e) => { 
    // Check for future shifts if setting to inactive
    if (editingEmp && !e.active && editingEmp.active) {
      const today = toDateKey(new Date());
      const futureShifts = Object.entries(shifts)
        .filter(([key, shift]) => shift.employeeId === e.id && shift.date > today)
        .map(([key, shift]) => shift.date);
      
      if (futureShifts.length > 0) {
        const sortedDates = futureShifts.sort();
        const formattedDates = sortedDates.slice(0, 5).map(d => {
          const date = parseLocalDate(d);
          return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }).join(', ');
        const moreText = sortedDates.length > 5 ? ` and ${sortedDates.length - 5} more` : '';
        
        showToast('error', `Cannot deactivate: ${e.name} has ${futureShifts.length} future shift(s): ${formattedDates}${moreText}. Remove or reassign shifts first.`, 8000);
        return false; // Return false to indicate failure
      }
    }
    
    // Optimistic update — capture prev so we can revert on API failure.
    // Do NOT clear editingEmp here: if the save fails the modal stays open
    // and must still read as "Edit Employee" (not flip to "Add Employee").
    const prevEmployees = employees;
    const wasEditing = !!editingEmp;
    if (editingEmp) setEmployees(employees.map(x => x.id === e.id ? e : x));
    else setEmployees([...employees, { ...e, active: true }]);

    // Stringify availability for storage
    const employeeForApi = {
      ...e,
      availability: typeof e.availability === 'object' ? JSON.stringify(e.availability) : e.availability,
      ...(e.password ? { password: e.password } : {})
    };

    // Call API to persist
    const result = await apiCall('saveEmployee', {
      employee: employeeForApi
    });

    if (result.success) {
      setEditingEmp(null);
      showToast('success', wasEditing ? `${e.name} updated` : `${e.name} added`);
      return true;
    } else {
      // Revert so the UI matches the server's rejection; keep editingEmp
      // so modal stays labelled "Edit Employee" while user retries.
      setEmployees(prevEmployees);
      showToast('error', result.error?.message || 'Failed to save employee');
      return false;
    }
  };
  
  // Mark as deleted instead of removing - preserves shift history
  const deleteEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return false;
    
    // Check for future shifts
    const today = toDateKey(new Date());
    const futureShifts = Object.entries(shifts)
      .filter(([key, shift]) => shift.employeeId === id && shift.date > today)
      .map(([key, shift]) => shift.date);
    
    if (futureShifts.length > 0) {
      const sortedDates = futureShifts.sort();
      const formattedDates = sortedDates.slice(0, 5).map(d => {
        const date = parseLocalDate(d);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }).join(', ');
      const moreText = sortedDates.length > 5 ? ` and ${sortedDates.length - 5} more` : '';
      
      showToast('error', `Cannot remove: ${emp.name} has ${futureShifts.length} future shift(s): ${formattedDates}${moreText}. Remove or reassign shifts first.`, 8000);
      return false; // Return false to indicate failure
    }
    
    // Optimistic update — capture prev so we can revert on API failure
    const prevEmployees = employees;
    setEmployees(employees.map(e => e.id === id ? { ...e, deleted: true, active: false } : e));

    // Stringify availability for storage
    const employeeForApi = {
      ...emp,
      deleted: true,
      active: false,
      availability: typeof emp.availability === 'object' ? JSON.stringify(emp.availability) : emp.availability
    };

    // Call API to persist
    const result = await apiCall('saveEmployee', {
      employee: employeeForApi
    });

    if (result.success) {
      showToast('success', `${emp.name} removed`);
      return true;
    } else {
      setEmployees(prevEmployees);
      showToast('error', result.error?.message || 'Failed to remove employee');
      return false;
    }
  };
  
  // Reactivate brings back inactive or deleted employees
  const reactivateEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    // Optimistic update — capture prev so we can revert on API failure
    const prevEmployees = employees;
    setEmployees(employees.map(e => e.id === id ? { ...e, active: true, deleted: false } : e));

    // Stringify availability for storage
    const employeeForApi = {
      ...emp,
      active: true,
      deleted: false,
      availability: typeof emp.availability === 'object' ? JSON.stringify(emp.availability) : emp.availability
    };

    // Call API to persist
    const result = await apiCall('saveEmployee', {
      employee: employeeForApi
    });

    if (result.success) {
      showToast('success', `${emp.name} reactivated`);
      return true;
    } else {
      setEmployees(prevEmployees);
      showToast('error', result.error?.message || 'Failed to reactivate employee');
      return false;
    }
  };
  
  // S61 — route by type. Work shifts live in `shifts[k]` (scalar). Meeting/PK
  // entries live in `events[k]` (array; one entry per type). Delete is type-aware
  // and only wipes the matching entry.
  const saveShift = (s) => {
    const k = `${s.employeeId}-${s.date}`;
    const type = s.type || 'work';
    const label = type === 'meeting' ? 'Meeting' : type === 'pk' ? 'PK event' : 'Shift';
    if (s.deleted) {
      if (type === 'work') {
        const n = { ...shifts };
        delete n[k];
        setShifts(n);
      } else {
        const n = { ...events };
        const arr = (n[k] || []).filter(e => (e.type || 'work') !== type);
        if (arr.length > 0) n[k] = arr; else delete n[k];
        setEvents(n);
      }
      showToast('success', `${label} removed — click SAVE to keep changes`);
    } else {
      if (type === 'work') {
        setShifts({ ...shifts, [k]: s });
      } else {
        const n = { ...events };
        const arr = (n[k] || []).filter(e => (e.type || 'work') !== type);
        arr.push(s);
        n[k] = arr;
        setEvents(n);
      }
      showToast('success', `${label} updated — click SAVE to keep changes`);
    }
    setUnsaved(true);
    setPublished(false);
  };
  
  // Cancel a time off request (employee action on their own pending request)
  const cancelTimeOffRequest = async (requestId) => {
    await guardedMutation('Cancelling request', async () => {
    const result = await apiCall('cancelTimeOffRequest', {
      requestId: requestId
    });
    
    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'cancelled', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Request cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel request');
    }
    });
  };

  // Submit a new time off request (employee or admin action)
  const submitTimeOffRequest = async (request) => {
    await guardedMutation('Submitting request', async () => {
    const result = await apiCall('submitTimeOffRequest', {
      dates: request.datesRequested.split(','),
      reason: request.reason || ''
    });

    if (result.success) {
      const serverRequest = {
        ...request,
        requestId: result.data.requestId,
        requestType: 'time_off',
        name: request.name,
        email: request.email,
        employeeName: request.name,
        employeeEmail: request.email,
        createdTimestamp: result.data.createdTimestamp
      };
      setTimeOffRequests(prev => [...prev, serverRequest]);
      showToast('success', 'Request sent — Sarvi has been notified');
    } else {
      showToast('error', result.error?.message || 'Failed to submit request');
    }
    });
  };
  
  // Submit a shift offer (employee action)
  const submitShiftOffer = async (offer) => {
    await guardedMutation('Submitting offer', async () => {
    const result = await apiCall('submitShiftOffer', {
      recipientEmail: offer.recipientEmail,
      shiftDate: offer.shiftDate,
      shiftStart: offer.shiftStart,
      shiftEnd: offer.shiftEnd,
      shiftRole: offer.shiftRole
    });

    if (result.success) {
      const serverOffer = {
        ...offer,
        offerId: result.data.requestId,
        requestId: result.data.requestId,
        requestType: 'shift_offer',
        employeeName: offer.offererName,
        employeeEmail: offer.offererEmail,
        createdTimestamp: result.data.createdTimestamp
      };
      setShiftOffers(prev => [...prev, serverOffer]);
      showToast('success', 'Offer sent — waiting for recipient response');
    } else {
      showToast('error', result.error?.message || 'Failed to submit offer');
    }
    });
  };
  
  // Cancel a shift offer (offerer action)
  const cancelShiftOffer = async (offerId) => {
    await guardedMutation('Cancelling offer', async () => {
    const result = await apiCall('cancelShiftOffer', {
      requestId: offerId
    });

    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)) {
          return { ...offer, status: 'cancelled', cancelledTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel offer');
    }
    });
  };

  // Accept a shift offer (recipient action)
  const acceptShiftOffer = async (offerId) => {
    await guardedMutation('Accepting offer', async () => {
    const result = await apiCall('acceptShiftOffer', {
      requestId: offerId
    });

    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'awaiting_admin', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer accepted - awaiting admin approval');
    } else {
      showToast('error', result.error?.message || 'Failed to accept offer');
    }
    });
  };

  // Reject a shift offer (recipient action)
  const rejectShiftOffer = async (offerId, note) => {
    await guardedMutation('Declining offer', async () => {
    const result = await apiCall('declineShiftOffer', {
      requestId: offerId,
      note: note || ''
    });

    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'recipient_rejected', recipientNote: note || '', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer declined');
    } else {
      showToast('error', result.error?.message || 'Failed to decline offer');
    }
    });
  };

  // Approve a shift offer (admin action) - reassign the shift
  const approveShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (o.offerId === offerId || o.requestId === offerId) && o.status === 'awaiting_admin');
    if (!offer) return;
    await guardedMutation('Approving offer', async () => {
    const result = await apiCall('approveShiftOffer', {
      requestId: offerId
    });
    
    if (result.success) {
      const offerer = employees.find(e => e.email === (offer.offererEmail || offer.employeeEmail));
      const recipient = employees.find(e => e.email === offer.recipientEmail);
      if (offerer && recipient) {
        const shiftKey = `${offerer.id}-${offer.shiftDate}`;
        const oldShift = shifts[shiftKey];
        if (oldShift) {
          setShifts(prevShifts => {
            const newShifts = { ...prevShifts };
            delete newShifts[shiftKey];
            newShifts[`${recipient.id}-${offer.shiftDate}`] = { ...oldShift, employeeId: recipient.id, employeeName: recipient.name };
            return newShifts;
          });
        }
      }
      setShiftOffers(prev => prev.map(o => {
        if (o.offerId === offerId || o.requestId === offerId) {
          return { ...o, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Offer approved — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to approve offer');
    }
    });
  };

  // Reject a shift offer (admin action)
  const adminRejectShiftOffer = async (offerId, note) => {
    await guardedMutation('Rejecting offer', async () => {
    const result = await apiCall('rejectShiftOffer', {
      requestId: offerId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftOffers(prev => prev.map(offer => {
        if ((offer.offerId === offerId || offer.requestId === offerId) && offer.status === 'awaiting_admin') {
          return { ...offer, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return offer;
      }));
      showToast('success', 'Offer rejected — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to reject offer');
    }
    });
  };

  // Revoke an approved shift offer (admin action) - reverts the shift back to original owner
  const revokeShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (o.offerId === offerId || o.requestId === offerId) && o.status === 'approved');
    if (!offer) return;

    const shiftDate = parseLocalDate(offer.shiftDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (shiftDate < today) {
      showToast('error', 'Cannot revoke a shift offer for a past date.');
      return;
    }

    await guardedMutation('Revoking offer', async () => {
    const result = await apiCall('revokeShiftOffer', {
      requestId: offerId
    });
    
    if (result.success) {
      const offerer = employees.find(e => e.email === (offer.offererEmail || offer.employeeEmail));
      const recipient = employees.find(e => e.email === offer.recipientEmail);
      if (offerer && recipient) {
        const recipientShiftKey = `${recipient.id}-${offer.shiftDate}`;
        const currentShift = shifts[recipientShiftKey];
        if (currentShift) {
          setShifts(prevShifts => {
            const newShifts = { ...prevShifts };
            delete newShifts[recipientShiftKey];
            newShifts[`${offerer.id}-${offer.shiftDate}`] = { ...currentShift, employeeId: offerer.id, employeeName: offerer.name };
            return newShifts;
          });
        }
      }
      setShiftOffers(prev => prev.map(o => {
        if (o.offerId === offerId || o.requestId === offerId) {
          return { ...o, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Offer approval revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke offer');
    }
    });
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // SHIFT SWAP HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Submit a new swap request (employee action)
  const submitSwapRequest = async (swap) => {
    await guardedMutation('Submitting swap', async () => {
    const result = await apiCall('submitSwapRequest', {
      partnerEmail: swap.partnerEmail,
      initiatorShift: {
        date: swap.initiatorShiftDate,
        start: swap.initiatorShiftStart,
        end: swap.initiatorShiftEnd,
        role: swap.initiatorShiftRole
      },
      partnerShift: {
        date: swap.partnerShiftDate,
        start: swap.partnerShiftStart,
        end: swap.partnerShiftEnd,
        role: swap.partnerShiftRole
      }
    });

    if (result.success) {
      const serverSwap = {
        ...swap,
        swapId: result.data.requestId,
        requestId: result.data.requestId,
        requestType: 'shift_swap',
        employeeName: swap.initiatorName,
        employeeEmail: swap.initiatorEmail,
        createdTimestamp: result.data.createdTimestamp
      };
      setShiftSwaps(prev => [...prev, serverSwap]);
      showToast('success', `Swap sent to ${swap.partnerName} — waiting for response`);
    } else {
      showToast('error', result.error?.message || 'Failed to submit swap request');
    }
    });
  };
  
  // Cancel a swap request (initiator action)
  const cancelSwapRequest = async (swapId) => {
    await guardedMutation('Cancelling swap', async () => {
    const result = await apiCall('cancelSwapRequest', {
      requestId: swapId
    });

    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && ['awaiting_partner', 'awaiting_admin'].includes(swap.status)) {
          return { ...swap, status: 'cancelled' };
        }
        return swap;
      }));
      showToast('success', 'Swap request cancelled');
    } else {
      showToast('error', result.error?.message || 'Failed to cancel swap');
    }
    });
  };

  // Accept a swap request (partner action)
  const acceptSwapRequest = async (swapId) => {
    await guardedMutation('Accepting swap', async () => {
    const result = await apiCall('acceptSwapRequest', {
      requestId: swapId
    });

    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'awaiting_admin', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap accepted - awaiting admin approval');
    } else {
      showToast('error', result.error?.message || 'Failed to accept swap');
    }
    });
  };

  // Reject a swap request (partner action)
  const rejectSwapRequest = async (swapId, note) => {
    await guardedMutation('Declining swap', async () => {
    const result = await apiCall('declineSwapRequest', {
      requestId: swapId,
      note: note || ''
    });

    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'partner_rejected', partnerNote: note || '', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap request declined');
    } else {
      showToast('error', result.error?.message || 'Failed to decline swap');
    }
    });
  };

  // Approve a swap request (admin action) - swap both shifts
  const approveSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (s.swapId === swapId || s.requestId === swapId) && s.status === 'awaiting_admin');
    if (!swap) return;
    await guardedMutation('Approving swap', async () => {
    const result = await apiCall('approveSwapRequest', {
      requestId: swapId
    });
    
    if (result.success) {
      const initiator = employees.find(e => e.email === (swap.initiatorEmail || swap.employeeEmail));
      const partner = employees.find(e => e.email === swap.partnerEmail);
      
      if (initiator && partner) {
        const initiatorShiftKey = `${initiator.id}-${swap.initiatorShiftDate}`;
        const partnerShiftKey = `${partner.id}-${swap.partnerShiftDate}`;
        const initiatorShift = shifts[initiatorShiftKey];
        const partnerShift = shifts[partnerShiftKey];
        
        setShifts(prevShifts => {
          const newShifts = { ...prevShifts };
          delete newShifts[initiatorShiftKey];
          delete newShifts[partnerShiftKey];
          if (initiatorShift) {
            newShifts[`${partner.id}-${swap.initiatorShiftDate}`] = { ...initiatorShift, employeeId: partner.id, employeeName: partner.name };
          }
          if (partnerShift) {
            newShifts[`${initiator.id}-${swap.partnerShiftDate}`] = { ...partnerShift, employeeId: initiator.id, employeeName: initiator.name };
          }
          return newShifts;
        });
      }
      
      setShiftSwaps(prev => prev.map(s => {
        if (s.swapId === swapId || s.requestId === swapId) {
          return { ...s, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap approved — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to approve swap');
    }
    });
  };

  // Reject a swap request (admin action)
  const adminRejectSwapRequest = async (swapId, note) => {
    await guardedMutation('Rejecting swap', async () => {
    const result = await apiCall('rejectSwapRequest', {
      requestId: swapId,
      note: note || ''
    });
    
    if (result.success) {
      setShiftSwaps(prev => prev.map(swap => {
        if ((swap.swapId === swapId || swap.requestId === swapId) && swap.status === 'awaiting_admin') {
          return { ...swap, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return swap;
      }));
      showToast('success', 'Swap rejected — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to reject swap');
    }
    });
  };

  // Revoke an approved swap request (admin action) - swap shifts back
  const revokeSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (s.swapId === swapId || s.requestId === swapId) && s.status === 'approved');
    if (!swap) return;

    const initiatorDate = parseLocalDate(swap.initiatorShiftDate);
    const partnerDate = parseLocalDate(swap.partnerShiftDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (initiatorDate < today || partnerDate < today) {
      showToast('error', 'Cannot revoke a swap where one or both shifts are in the past.');
      return;
    }

    await guardedMutation('Revoking swap', async () => {
    const result = await apiCall('revokeSwapRequest', {
      requestId: swapId
    });
    
    if (result.success) {
      const initiator = employees.find(e => e.email === (swap.initiatorEmail || swap.employeeEmail));
      const partner = employees.find(e => e.email === swap.partnerEmail);
      
      if (initiator && partner) {
        const partnerOnInitiatorDateKey = `${partner.id}-${swap.initiatorShiftDate}`;
        const initiatorOnPartnerDateKey = `${initiator.id}-${swap.partnerShiftDate}`;
        const partnerOnInitiatorDateShift = shifts[partnerOnInitiatorDateKey];
        const initiatorOnPartnerDateShift = shifts[initiatorOnPartnerDateKey];
        
        setShifts(prevShifts => {
          const newShifts = { ...prevShifts };
          delete newShifts[partnerOnInitiatorDateKey];
          delete newShifts[initiatorOnPartnerDateKey];
          if (partnerOnInitiatorDateShift) {
            newShifts[`${initiator.id}-${swap.initiatorShiftDate}`] = { ...partnerOnInitiatorDateShift, employeeId: initiator.id, employeeName: initiator.name };
          }
          if (initiatorOnPartnerDateShift) {
            newShifts[`${partner.id}-${swap.partnerShiftDate}`] = { ...initiatorOnPartnerDateShift, employeeId: partner.id, employeeName: partner.name };
          }
          return newShifts;
        });
      }
      
      setShiftSwaps(prev => prev.map(s => {
        if (s.swapId === swapId || s.requestId === swapId) {
          return { ...s, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap approval revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke swap');
    }
    });
  };

  // Approve a time off request (admin action)
  const approveTimeOffRequest = async (requestId, notes) => {
    await guardedMutation('Approving', async () => {
    const result = await apiCall('approveTimeOffRequest', {
      requestId: requestId,
      note: notes || ''
    });

    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'approved', reason: notes || '', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Approved — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to approve request');
    }
    });
  };

  // Deny a time off request (admin action)
  const denyTimeOffRequest = async (requestId, notes) => {
    await guardedMutation('Denying', async () => {
    const result = await apiCall('denyTimeOffRequest', {
      requestId: requestId,
      reason: notes || ''
    });

    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'pending') {
          return { ...req, status: 'denied', reason: notes || '', decidedTimestamp: new Date().toISOString(), decidedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Denied — moved to Settled history');
    } else {
      showToast('error', result.error?.message || 'Failed to deny request');
    }
    });
  };
  
  // Revoke an approved time off request (admin action, future dates only)
  const revokeTimeOffRequest = async (requestId, notes) => {
    const request = timeOffRequests.find(r => r.requestId === requestId && r.status === 'approved');
    if (!request) return;
    
    // Check if request has any future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = request.datesRequested.split(',');
    const hasFutureDates = dates.some(d => parseLocalDate(d) >= today);
    
    if (!hasFutureDates) {
      showToast('error', 'Cannot revoke time off for dates that are all in the past.');
      return;
    }
    
    await guardedMutation('Revoking', async () => {
    const result = await apiCall('revokeTimeOffRequest', {
      requestId: requestId,
      note: notes || ''
    });

    if (result.success) {
      setTimeOffRequests(prev => prev.map(req => {
        if (req.requestId === requestId && req.status === 'approved') {
          return { ...req, status: 'revoked', reason: notes || req.reason, revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return req;
      }));
      showToast('success', 'Approval revoked');
    } else {
      showToast('error', result.error?.message || 'Failed to revoke request');
    }
    });
  };
  
  // Count pending requests for badge (all three types that need admin action)
  const pendingTimeOffCount = timeOffRequests.filter(r => r.status === 'pending').length;
  const pendingOffersCount = shiftOffers.filter(o => o.status === 'awaiting_admin').length;
  const pendingSwapsCount = shiftSwaps.filter(s => s.status === 'awaiting_admin').length;
  const pendingRequestCount = pendingTimeOffCount + pendingOffersCount + pendingSwapsCount;
  
  // Tooltip handlers — useCallback so EmployeeRow memoization holds across parent re-renders
  const handleShowTooltip = useCallback((employee, hours, triggerRef, isDeleted) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.right + 8;
      if (left + 240 > window.innerWidth - 20) left = rect.left - 248;
      let top = rect.top;
      if (top < 10) top = 10;
      if (top + 250 > window.innerHeight) top = window.innerHeight - 260;
      setTooltipData({ employee, hours, isDeleted, pos: { top, left } });
    }
  }, []);

  const handleHideTooltip = useCallback(() => setTooltipData(null), []);

  // Grid cell click handler — stable ref keeps EmployeeRow memo effective
  const handleCellClick = useCallback((emp, d, s) => {
    setEditingShift({ employee: emp, date: d, shift: s });
  }, []);

  // Edit employee handler — stable ref keeps EmployeeRow memo effective
  const handleEditEmployee = useCallback((emp) => {
    setEditingEmp(emp);
    setEmpFormOpen(true);
  }, []);
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Show login screen if not logged in
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Post-login overlay: plays on login success, survives loading->main transition
  // (kept as child 0 of the returned fragment so React reconciles it as the same DOM node across branches)
  const sweepOverlay = welcomeSweep && (
    <div className="welcome-sweep" aria-hidden="true" onAnimationEnd={() => setWelcomeSweep(false)}>
      {OTR.accents.map((a, i) => <div key={i} style={{ backgroundColor: a.primary }} />)}
    </div>
  );

  // Show loading screen while fetching data (skeleton + persistent reassurance overlay)
  if (isLoadingData) {
    return (
      <>
        {sweepOverlay}
        <div className="min-h-screen relative" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }} role="status" aria-live="polite" aria-label="Loading schedule">
          <div className="pt-8" style={{ backgroundColor: THEME.bg.secondary }}>
            <ScheduleSkeleton />
          </div>
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 150 }}>
            <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.card }}>
              <div className="rainbow-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <p className="text-sm font-medium" style={{ color: THEME.text.primary }}>Loading your schedule…</p>
              <p className="text-xs italic" style={{ color: THEME.text.muted }}>This can take a moment on first sign-in.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Show error if data load failed
  if (loadError) {
    return (
      <>
        {sweepOverlay}
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: THEME.bg.primary }}>
        <div className="text-center max-w-md">
          <AlertCircle size={32} className="mx-auto mb-4" style={{ color: THEME.status.error }} />
          <p className="mb-4" style={{ color: '#FFFFFF' }}>{loadError}</p>
          <button 
            onClick={() => loadDataFromBackend(currentUser.email)}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.accent.purple, color: '#fff' }}
          >
            Try Again
          </button>
          <button 
            onClick={() => { clearAuth(); setCurrentUser(null); setLoadError(null); }}
            className="ml-2 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}
          >
            Logout
          </button>
        </div>
      </div>
      </>
    );
  }

  // Show employee view if not admin
  if (!currentUser.isAdmin) {
    return (<>{sweepOverlay}<EmployeeView employees={employees} shifts={publishedShifts} events={publishedEvents} dates={dates} periodInfo={{ startDate, endDate }} currentUser={currentUser} onLogout={() => { clearAuth(); setCurrentUser(null); }} timeOffRequests={timeOffRequests} onCancelRequest={cancelTimeOffRequest} onSubmitRequest={submitTimeOffRequest} shiftOffers={shiftOffers} onSubmitOffer={submitShiftOffer} onCancelOffer={cancelShiftOffer} onAcceptOffer={acceptShiftOffer} onRejectOffer={rejectShiftOffer} shiftSwaps={shiftSwaps} onSubmitSwap={submitSwapRequest} onCancelSwap={cancelSwapRequest} onAcceptSwap={acceptSwapRequest} onRejectSwap={rejectSwapRequest} periodIndex={periodIndex} onPeriodChange={setPeriodIndex} isEditMode={isCurrentPeriodEditMode} announcement={currentAnnouncement} /></>);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE ADMIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobileAdmin) {
    const mobileCurrentDates = activeWeek === 1 ? week1 : week2;

    return (<>{sweepOverlay}
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
        <GradientBackground />
        
        {/* Mobile Admin Header */}
        <header className="sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: 'none', zIndex: 100 }}>
          {/* Row 1: Centered RAINBOW logo (hamburger removed - bottom nav "More" owns the drawer) */}
          <div className="flex items-center justify-center px-3 pt-3 pb-2" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: THEME.text.muted, fontSize: '8px', letterSpacing: '0.2em' }}>OVER THE</p>
              <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '16px', letterSpacing: '0.12em', lineHeight: 1 }}>RAINBOW</p>
            </div>
          </div>

          {/* Row 2: Period nav centered */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPeriodIndex(periodIndex - 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '13px' }}>{formatDate(startDate)} – {formatDate(endDate)}</p>
                {periodIndex === CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.cyan, fontSize: '10px', marginTop: 1 }}>Current Period</p>}
                {periodIndex > CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.purple, fontSize: '10px', marginTop: 1 }}>Future</p>}
                {periodIndex < CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.text.muted, fontSize: '10px', marginTop: 1 }}>Past</p>}
              </div>
              <button onClick={() => setPeriodIndex(periodIndex + 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 3: Action buttons right-aligned — schedule-context only */}
          {(mobileAdminTab === 'schedule' || mobileAdminTab === 'mine') && (
          <div className="flex items-center justify-end px-3 pb-2 gap-1.5">
            {isCurrentPeriodEditMode ? (
              unsaved ? (
                <button
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="px-2.5 py-1 rounded-md font-bold flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: '#fff',
                    boxShadow: `0 0 8px ${THEME.accent.blue}40`
                  }}
                >
                  {scheduleSaving ? <><Loader size={10} className="animate-spin" /> Saving</> : <><Save size={10} /> Save</>}
                </button>
              ) : (
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    backgroundColor: THEME.status.success + '20',
                    color: THEME.status.success,
                    border: `1px solid ${THEME.status.success}40`
                  }}
                >
                  {scheduleSaving ? <><Loader size={10} className="animate-spin" /> Live</> : <><Eye size={10} /> Go Live</>}
                </button>
              )
            ) : (
              <>
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-2 py-0.5 rounded-md font-medium flex items-center gap-1 disabled:opacity-50"
                  style={{
                    fontSize: '10px',
                    backgroundColor: THEME.status.warning + '20',
                    color: THEME.status.warning,
                    border: `1px solid ${THEME.status.warning}40`
                  }}
                >
                  <Edit3 size={10} /> Edit
                </button>
                <button
                  onClick={() => setEmailOpen(true)}
                  className="px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                  style={{
                    fontSize: '10px',
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: '#fff'
                  }}
                >
                  <Mail size={10} /> Publish
                </button>
              </>
            )}
          </div>
          )}

          {/* Row 4: Status banner — schedule-context only */}
          {(mobileAdminTab === 'schedule' || mobileAdminTab === 'mine') && (
          <div className="px-3 pb-2">
            {!isCurrentPeriodEditMode ? (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.success + '15', border: `1px solid ${THEME.status.success}30` }}>
                <Eye size={12} style={{ color: THEME.status.success }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE — visible to staff</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2 flex-wrap" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
                <Edit3 size={12} style={{ color: THEME.status.warning, flexShrink: 0 }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.warning }}>Edit Mode</span>
                {fullTimeEmployees.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => {
                        const weekDates = activeWeek === 1 ? week1 : week2;
                        const hasExisting = fullTimeEmployees.some(e => employeeHasShiftsInWeek(e, weekDates));
                        if (hasExisting) {
                          setAutoPopulateConfirm({ type: 'populate-all', week: activeWeek });
                        } else {
                          const count = autoPopulateWeek(weekDates);
                          if (count > 0) showToast('success', `Added ${count} shifts for full-time employees`);
                          else showToast('warning', 'No shifts added — check availability');
                        }
                      }}
                      className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                      style={{ backgroundColor: THEME.accent.blue, color: 'white' }}
                    >
                      <Zap size={9} />
                      Fill Wk {activeWeek}
                    </button>
                    <button
                      onClick={() => setAutoPopulateConfirm({ type: 'clear-all', week: activeWeek })}
                      className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                    >
                      <Trash2 size={9} />
                      Clear Wk {activeWeek}
                    </button>
                    <button
                      onClick={() => {
                        const weekDates = activeWeek === 1 ? week1 : week2;
                        handleAutofillPKWeek(weekDates, activeWeek);
                      }}
                      className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
                      style={{ backgroundColor: THEME.event.pkBg, color: THEME.event.pkText, border: `1px solid ${THEME.event.pkBorder}` }}
                    >
                      <BookOpen size={9} />
                      PK Wk {activeWeek}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Row 5: Raised Filing Tabs (schedule sub-nav only - hidden when on Requests/Comms destinations) */}
          {(mobileAdminTab === 'schedule' || mobileAdminTab === 'mine') && (
          <div className="flex items-end px-2 gap-1" style={{ marginBottom: -1 }}>
            {[
              { id: 'wk1', label: `Wk ${weekNum1}`, tab: 'schedule', week: 1, color: THEME.accent.cyan, icon: null },
              { id: 'wk2', label: `Wk ${weekNum2}`, tab: 'schedule', week: 2, color: THEME.accent.cyan, icon: null },
              { id: 'mine', label: 'Mine', tab: 'mine', color: THEME.accent.purple, icon: <User size={10} /> },
            ].map(t => {
              const isActive = t.tab === 'schedule'
                ? mobileAdminTab === 'schedule' && activeWeek === t.week
                : mobileAdminTab === t.tab;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setMobileAdminTab(t.tab);
                    if (t.week) setActiveWeek(t.week);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium relative flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: isActive ? THEME.bg.secondary : THEME.bg.tertiary,
                    color: isActive ? t.color : THEME.text.muted,
                    borderRadius: '8px 8px 0 0',
                    borderTop: `2px solid ${isActive ? t.color : THEME.border.subtle}`,
                    borderLeft: `1px solid ${isActive ? THEME.border.default : THEME.border.subtle}`,
                    borderRight: `1px solid ${isActive ? THEME.border.default : THEME.border.subtle}`,
                    borderBottom: isActive ? 'none' : `1px solid ${THEME.border.default}`,
                    zIndex: isActive ? 10 : 1,
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  {t.icon}
                  {t.label}
                  {t.badge > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center"
                      style={{ backgroundColor: t.color, color: '#000', fontSize: '9px' }}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          )}
        </header>

        {/* Content */}
        <main className="p-2 pb-20">
          {mobileAdminTab === 'schedule' ? (
            <>
              {/* Schedule Grid */}
              <MobileAdminScheduleGrid
                employees={schedulableEmployees}
                shifts={shifts}
                events={events}
                dates={mobileCurrentDates}
                loggedInUser={currentUser}
                getEmployeeHours={getEmpHours}
                timeOffRequests={timeOffRequests}
                getScheduledCount={getScheduledCount}
                getStaffingTarget={getStaffingTarget}
                staffingTargetOverrides={staffingTargetOverrides}
                storeHoursOverrides={storeHoursOverrides}
                isEditMode={isCurrentPeriodEditMode}
                onCellClick={(emp, date, shift) => {
                  if (isCurrentPeriodEditMode) {
                    setEditingShift({ employee: emp, date, shift });
                  }
                }}
                onNameClick={(emp) => setQuickViewEmployee(emp)}
                onHeaderClick={(date) => setEditingColumnDate(date)}
              />

              {hiddenStaff.length > 0 && (
                <div className="mt-3">
                  <CollapsibleSection
                    title="Hidden from Schedule"
                    icon={UserX}
                    iconColor={THEME.text.muted}
                    badge={hiddenStaff.length}
                    badgeColor={THEME.text.muted}
                    defaultOpen={false}
                  >
                    <div className="flex flex-wrap gap-2">
                      {hiddenStaff.map(emp => (
                        <div key={emp.id} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: emp.isAdmin ? THEME.accent.purple + '30' : THEME.bg.elevated, color: emp.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                              {emp.name}
                              {emp.isAdmin && <Shield size={8} style={{ color: THEME.accent.purple }} />}
                            </span>
                            <span className="text-xs" style={{ color: THEME.text.muted }}>
                              {!emp.active ? 'Inactive' : 'Hidden Admin'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </div>
              )}
            </>
          ) : mobileAdminTab === 'requests' ? (
            <div className="space-y-3">
              {/* Admin's own requests (collapsed by default) */}
              <CollapsibleSection
                title="My Requests"
                icon={User}
                iconColor={THEME.accent.cyan}
                badge={(
                  timeOffRequests.filter(r => r.email === currentUser?.email && r.status === 'pending').length
                  + shiftOffers.filter(o => o.offererEmail === currentUser?.email && ['awaiting_recipient', 'awaiting_admin'].includes(o.status)).length
                  + shiftSwaps.filter(s => s.initiatorEmail === currentUser?.email && ['awaiting_partner', 'awaiting_admin'].includes(s.status)).length
                ) || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Time Off</h4>
                    <MyRequestsPanel
                      requests={timeOffRequests}
                      currentUserEmail={currentUser.email}
                      onCancel={cancelTimeOffRequest}
                    />
                  </div>
                  {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Take My Shift</h4>
                      <MyShiftOffersPanel
                        offers={shiftOffers}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelShiftOffer}
                      />
                    </div>
                  )}
                  {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Shift Swaps</h4>
                      <MySwapsPanel
                        swaps={shiftSwaps}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelSwapRequest}
                      />
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Time Off */}
              <CollapsibleSection
                title="Time Off Requests" icon={Calendar} iconColor={THEME.accent.cyan}
                badge={timeOffRequests.filter(r => r.status === 'pending').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={timeOffRequests.filter(r => r.status === 'pending').length > 0}
              >
                <AdminTimeOffPanel requests={timeOffRequests} onApprove={approveTimeOffRequest} onDeny={denyTimeOffRequest} onRevoke={revokeTimeOffRequest} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
              
              {/* Take My Shift */}
              <CollapsibleSection 
                title="Take My Shift" icon={ArrowRight} iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftOffers.filter(o => o.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftOffersPanel offers={shiftOffers} onApprove={approveShiftOffer} onReject={adminRejectShiftOffer} onRevoke={revokeShiftOffer} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
              
              {/* Shift Swaps */}
              <CollapsibleSection 
                title="Shift Swaps" icon={ArrowRightLeft} iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftSwaps.filter(s => s.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftSwapsPanel swaps={shiftSwaps} onApprove={approveSwapRequest} onReject={adminRejectSwapRequest} onRevoke={revokeSwapRequest} currentAdminEmail={currentUser?.email} />
              </CollapsibleSection>
            </div>
          ) : mobileAdminTab === 'mine' ? (
            /* Admin's own schedule */
            <MobileMySchedule
              currentUser={currentUser}
              shifts={shifts}
              events={events}
              dates={dates}
              timeOffRequests={timeOffRequests}
            />
          ) : mobileAdminTab === 'comms' ? (
            /* Announcements */
            <MobileAnnouncementPanel
              announcement={currentAnnouncement}
              onAnnouncementChange={setCurrentAnnouncement}
              onSave={saveAnnouncement}
              onClear={clearAnnouncement}
              isEditMode={isCurrentPeriodEditMode}
              isSaving={savingAnnouncement}
            />
          ) : null}
        </main>
        
        {/* Admin Drawer */}
        <MobileAdminDrawer
          isOpen={mobileAdminDrawerOpen}
          onClose={() => setMobileAdminDrawerOpen(false)}
          currentUser={currentUser}
          onLogout={() => { setMobileAdminDrawerOpen(false); clearAuth(); setCurrentUser(null); }}
          onOpenChangePassword={() => { setMobileAdminDrawerOpen(false); setMobileAdminChangePasswordOpen(true); }}
          onOpenSettings={() => { setMobileAdminDrawerOpen(false); setSettingsOpen(true); }}
          onOpenOwnRequests={() => { setMobileAdminDrawerOpen(false); setAdminRequestModalOpen(true); }}
          onOpenPK={() => { setMobileAdminDrawerOpen(false); setPkModalOpen(true); }}
          onExportPDF={() => { setMobileAdminDrawerOpen(false); generateSchedulePDF(employees, shifts, dates, { startDate, endDate }, currentAnnouncement, timeOffRequests, events); }}
          onOpenStaff={() => { setMobileAdminDrawerOpen(false); setMobileStaffPanelOpen(true); }}
          pendingRequestCount={pendingRequestCount}
        />

        <MobileStaffPanel
          isOpen={mobileStaffPanelOpen}
          onClose={() => setMobileStaffPanelOpen(false)}
          employees={employees}
          onEdit={(emp) => { reopenStaffAfterFormRef.current = true; setMobileStaffPanelOpen(false); setEditingEmp(emp); setEmpFormOpen(true); }}
          onAdd={() => { reopenStaffAfterFormRef.current = true; setMobileStaffPanelOpen(false); setEditingEmp(null); setEmpFormOpen(true); }}
          onReactivate={reactivateEmployee}
          onDelete={deleteEmployee}
        />

        {/* Bottom Tab Bar (Phase 6) */}
        <MobileAdminBottomNav
          activeTab={mobileAdminDrawerOpen ? 'more' : (mobileAdminTab === 'mine' ? 'schedule' : mobileAdminTab)}
          pendingCount={pendingRequestCount}
          onTabChange={(tab) => {
            if (tab === 'more') {
              setMobileAdminDrawerOpen(true);
            } else {
              setMobileAdminDrawerOpen(false);
              setMobileAdminTab(tab);
            }
          }}
        />
        
        {/* Shift Editor Modal (reused from desktop) */}
        {editingShift && (() => {
          const prior = new Date(editingShift.date); prior.setDate(prior.getDate() - 1);
          const priorStreak = computeConsecutiveWorkDayStreak((id, k) => !!shifts[`${id}-${k}`], editingShift.employee.id, toDateKey(prior));
          return (
            <ShiftEditorModal
              isOpen
              onClose={() => setEditingShift(null)}
              onSave={saveShift}
              employee={editingShift.employee}
              date={editingShift.date}
              existingShift={editingShift.shift}
              existingEvents={events[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`] || []}
              totalPeriodHours={getEmpHours(editingShift.employee.id)}
              availability={editingShift.employee.availability?.[getDayName(editingShift.date)]}
              hasApprovedTimeOff={hasApprovedTimeOffForDate(editingShift.employee.email, toDateKey(editingShift.date), timeOffRequests)}
              priorWorkStreak={priorStreak}
            />
          );
        })()}
        
        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={mobileAdminChangePasswordOpen}
          onClose={() => setMobileAdminChangePasswordOpen(false)}
          currentUser={currentUser}
        />

        {/* Admin Settings Modal */}
        <AdminSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} currentUser={currentUser} staffingTargets={staffingTargets} onStaffingTargetsChange={setStaffingTargets} showToast={showToast} />

        {/* Employee Quick View - tap name to see contact info */}
        <MobileEmployeeQuickView
          isOpen={!!quickViewEmployee}
          onClose={() => setQuickViewEmployee(null)}
          employee={quickViewEmployee}
        />
        
        {/* Admin's own request modals */}
        <RequestTimeOffModal 
          isOpen={adminRequestModalOpen} 
          onClose={() => setAdminRequestModalOpen(false)} 
          onSelectType={handleAdminSelectRequestType}
          currentUser={currentUser}
        />
        <RequestDaysOffModal 
          isOpen={adminDaysOffModalOpen} 
          onClose={() => setAdminDaysOffModalOpen(false)} 
          onSubmit={submitTimeOffRequest}
          currentUser={currentUser}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
          shiftSwaps={shiftSwaps}
          shifts={shifts}
        />
        
        {/* Email Publish Modal */}
        <EmailModal
          isOpen={emailOpen}
          onClose={() => setEmailOpen(false)}
          employees={employees}
          shifts={shifts}
          dates={dates}
          periodInfo={{ startDate, endDate }}
          announcement={currentAnnouncement}
          onComplete={() => { setPublished(true); setUnsaved(false); }}
        />

        {/* S62 — Bulk PK modal (mobile admin) */}
        <PKEventModal
          isOpen={pkModalOpen}
          onClose={() => setPkModalOpen(false)}
          onSchedule={handleBulkPK}
          employees={employees}
        />

        {/* Employee Form Modal (mobile admin: reached via MobileStaffPanel) */}
        <EmployeeFormModal
          isOpen={empFormOpen}
          onClose={() => { setEmpFormOpen(false); setEditingEmp(null); }}
          onSave={saveEmployee}
          onDelete={deleteEmployee}
          employee={editingEmp}
          currentUser={currentUser}
          showToast={showToast}
          suggestedPassword={editingEmp ? undefined : `emp-${String(employees.length + 1).padStart(3, '0')}`}
        />

        {/* Column Header Editor (mobile admin: tap day header in Edit Mode) */}
        {editingColumnDate && (
          <ColumnHeaderEditor
            date={editingColumnDate}
            storeHours={getStoreHoursForDate(editingColumnDate)}
            target={getStaffingTarget(editingColumnDate)}
            storeHoursOverrides={storeHoursOverrides}
            staffingTargetOverrides={staffingTargetOverrides}
            onSave={saveColumnOverrides}
            onClose={() => setEditingColumnDate(null)}
          />
        )}

        {/* Auto-populate confirmation modal */}
        {autoPopulateConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} role="dialog" aria-modal="true" aria-label="Confirm Auto-Populate" onClick={() => setAutoPopulateConfirm(null)}>
            <div className="max-w-xs w-full rounded-xl overflow-hidden shadow-2xl modal-content active" style={{ backgroundColor: THEME.bg.secondary }} onClick={e => e.stopPropagation()}>
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: autoPopulateConfirm.type.includes('clear') ? THEME.status.error + '20' : THEME.accent.blue + '20' }}>
                  {autoPopulateConfirm.type.includes('clear')
                    ? <Trash2 size={24} style={{ color: THEME.status.error }} />
                    : <Zap size={24} style={{ color: THEME.accent.blue }} />
                  }
                </div>
                <p className="text-sm font-medium mb-2" style={{ color: THEME.text.primary }}>
                  {autoPopulateConfirm.type === 'populate-all' && (autoPopulateConfirm.week ? `Auto-Fill Full-Time for Week ${autoPopulateConfirm.week}?` : 'Auto-Fill All Full-Time Employees?')}
                  {autoPopulateConfirm.type === 'clear-all' && `Clear All Full-Time Shifts for Week ${autoPopulateConfirm.week}?`}
                </p>
                <p className="text-xs mb-4" style={{ color: THEME.text.secondary }}>
                  {autoPopulateConfirm.type.includes('populate')
                    ? 'Some shifts already exist and will be preserved. Only empty days will be filled based on availability.'
                    : 'This will remove the selected shifts. You can undo by not saving changes.'
                  }
                </p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setAutoPopulateConfirm(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary, border: `1px solid ${THEME.border.default}` }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAutoPopulateConfirm}
                    className="px-4 py-2 rounded-lg text-xs font-medium"
                    style={{
                      backgroundColor: autoPopulateConfirm.type.includes('clear') ? THEME.status.error : THEME.accent.blue,
                      color: 'white'
                    }}
                  >
                    {autoPopulateConfirm.type.includes('clear') ? 'Clear Shifts' : 'Auto-Fill'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
            style={{
              backgroundColor: toast.type === 'success' ? THEME.status.success : toast.type === 'warning' ? THEME.status.warning : toast.type === 'saving' ? '#FFFFFF' : THEME.status.error,
              color: toast.type === 'saving' ? THEME.accent.blue : '#fff', minWidth: 200, textAlign: 'center', zIndex: 100001,
              border: toast.type === 'saving' ? `2px solid ${THEME.accent.blue}` : 'none',
              boxShadow: THEME.shadow.cardSm
            }}>
            {toast.type === 'saving' ? <Loader size={16} className="animate-spin" /> : toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.message}</span>
            {toast.type !== 'saving' && <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>}
          </div>
        )}
      </div>
      </>
    );
  }

  // Admin DESKTOP view below
  return (
    <>
    {sweepOverlay}
    <div className="min-h-screen relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <GradientBackground />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');
      `}</style>

      {/* Skip to content for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg focus:shadow-lg" style={{ color: THEME.text.primary }}>
        Skip to schedule
      </a>
      {/* aria-live region for status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="status-announcer" />

      {/* Header */}
      <header className={`px-4 py-2 sticky top-0 ${pendingRequestCount > 0 ? 'ambient-pending' : ''}`} style={{ backgroundColor: THEME.bg.secondary, borderBottom: `1px solid ${THEME.border.default}`, zIndex: 100, boxShadow: THEME.shadow.cardSm }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setPeriodIndex(periodIndex - 1)} aria-label="Previous pay period" className="p-2 rounded-lg hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronLeft size={14} /></button>
              <div className="text-center min-w-[100px]"><p className="font-medium" style={{ color: THEME.text.primary, fontSize: TYPE.body }}>{formatDate(startDate)} – {formatDate(endDate)}</p></div>
              <button onClick={() => setPeriodIndex(periodIndex + 1)} aria-label="Next pay period" className="p-2 rounded-lg hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronRight size={14} /></button>
            </div>
            
            {/* Save / Go Live / Edit - Three-state button */}
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            {isCurrentPeriodEditMode ? (
              unsaved ? (
                /* Unsaved changes → Save button — bright and prominent */
                <button
                  onClick={saveSchedule}
                  disabled={scheduleSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                    color: THEME.accent.text,
                    boxShadow: `0 0 12px ${THEME.accent.blue}50`
                  }}
                  title="Save changes (schedule stays hidden from employees)"
                >
                  {scheduleSaving ? <><div className="rainbow-spinner" style={{width:12,height:12,borderWidth:2}} /><span>SAVING...</span></> : <><Save size={12} /><span>SAVE</span></>}
                </button>
              ) : (
                /* Saved / clean → Go Live button */
                <button
                  onClick={toggleEditMode}
                  disabled={scheduleSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: THEME.status.success + '20',
                    color: THEME.status.success,
                    border: `1px solid ${THEME.status.success}50`
                  }}
                  title="Publish schedule — employees will see it"
                >
                  {scheduleSaving ? <><Loader size={12} className="animate-spin" /><span>GOING LIVE...</span></> : <><Eye size={12} /><span>GO LIVE</span></>}
                </button>
              )
            ) : (
              /* Currently LIVE → Edit button */
              <button
                onClick={toggleEditMode}
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
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {published && !unsaved && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}><Check size={10} />Published</span>}

            {/* Primary operations: Export + Publish */}
            <div className="relative">
              <TooltipButton tooltip={currentAnnouncement?.message ? "Export PDF (includes announcement)" : "Export PDF"} onClick={() => generateSchedulePDF(employees, shifts, dates, { startDate, endDate }, currentAnnouncement, timeOffRequests, events)}><FileText size={12} /></TooltipButton>
              {currentAnnouncement?.message && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </div>
            <div className="relative">
              <TooltipButton tooltip={currentAnnouncement?.message ? "Email Schedules (includes announcement)" : "Email Schedules"} variant="primary" onClick={() => { haptic(); setEmailOpen(true); }}><Mail size={12} />Publish</TooltipButton>
              {currentAnnouncement?.message && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </div>

            {/* Admin's own time off request */}
            <button
              onClick={() => setAdminRequestModalOpen(true)}
              className="px-2 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
              title="Submit your own shift change request"
            >
              <Calendar size={12} />
              My Requests
            </button>

            {/* Account / admin menu — collapses Add Employee, Manage Staff, Settings, Sign Out */}
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={() => setAdminMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg transition-colors"
                style={{ backgroundColor: adminMenuOpen ? THEME.bg.tertiary : 'transparent' }}
                aria-haspopup="menu"
                aria-expanded={adminMenuOpen}
                title="Account menu"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: `var(--accent-color, ${THEME.accent.purple})`, color: '#fff' }}>
                  {(currentUser.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="text-right leading-tight">
                  <p className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                    <Shield size={10} style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.accent.purple }} />
                    {currentUser.name}
                  </p>
                  <p className="text-xs" style={{ color: currentUser.isOwner ? THEME.accent.cyan : THEME.text.muted }}>
                    {currentUser.isOwner ? 'Owner' : 'Admin'}
                  </p>
                </div>
              </button>
              {adminMenuOpen && (
                <div role="menu" className="absolute right-0 mt-1 w-56 rounded-xl overflow-hidden z-50" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.card }}>
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); setEditingEmp(null); setEmpFormOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.text.primary }}>
                    <User size={14} style={{ color: THEME.text.secondary }} />
                    Add Employee
                  </button>
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); setInactivePanelOpen(true); }} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.text.primary }}>
                    <span className="flex items-center gap-2"><Users size={14} style={{ color: THEME.text.secondary }} />Manage Staff</span>
                    {inactiveCount > 0 && <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '10px' }}>{inactiveCount} inactive</span>}
                  </button>
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); setSettingsOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.text.primary }}>
                    <Settings size={14} style={{ color: THEME.text.secondary }} />
                    Admin Settings
                  </button>
                  <div className="h-px mx-2" style={{ backgroundColor: THEME.border.subtle }} />
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); clearAuth(); setCurrentUser(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.status.error }}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-3 pt-2 relative" style={{ zIndex: 1 }}>
        <div className="max-w-[1400px] mx-auto">
          {/* Tabs - Week 1, Week 2, Announcements */}
          <div className="flex items-end">
            {[{ w: 1, n: weekNum1, d: week1 }, { w: 2, n: weekNum2, d: week2 }].map(({ w, n, d }) => (
              <button key={w} onClick={() => { setActiveWeek(w); setActiveTab('schedule'); }} className="px-3 py-1.5 font-medium text-xs relative transition-all"
                style={{ backgroundColor: activeTab === 'schedule' && activeWeek === w ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'schedule' && activeWeek === w ? THEME.text.primary : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'schedule' && activeWeek === w ? 10 : 1, borderTop: `2px solid ${activeTab === 'schedule' && activeWeek === w ? THEME.accent.purple : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'schedule' && activeWeek === w ? -1 : 0 }}>
                <span className="font-semibold">Week {n}</span><span className="ml-1.5 opacity-60">{formatDate(d[0])}–{formatDate(d[6])}</span>
              </button>
            ))}
            <button onClick={() => setActiveTab('comms')} className="px-3 py-1.5 font-medium text-xs relative transition-all flex items-center gap-1.5"
              style={{ backgroundColor: activeTab === 'comms' ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'comms' ? THEME.accent.cyan : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'comms' ? 10 : 1, borderTop: `2px solid ${activeTab === 'comms' ? THEME.accent.cyan : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'comms' ? -1 : 0 }}>
              <MessageSquare size={12} />
              <span className="font-semibold">Announcements</span>
              {currentAnnouncement?.message && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accent.blue }} />}
            </button>
            <button onClick={() => setActiveTab('requests')} className="px-3 py-1.5 font-medium text-xs relative transition-all flex items-center gap-1.5"
              style={{ backgroundColor: activeTab === 'requests' ? THEME.bg.secondary : THEME.bg.tertiary, color: activeTab === 'requests' ? THEME.accent.pink : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeTab === 'requests' ? 10 : 1, borderTop: `2px solid ${activeTab === 'requests' ? THEME.accent.pink : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeTab === 'requests' ? -1 : 0 }}>
              <ClipboardList size={12} />
              <span className="font-semibold">Shift Changes</span>
              {pendingRequestCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: THEME.status.warning, color: '#000' }}>{pendingRequestCount}</span>}
            </button>
            <div className="flex-1 h-px" style={{ backgroundColor: THEME.border.default }} />
          </div>
          
          {activeTab === 'schedule' ? (
            <>
              {/* Locked schedule indicator */}
              {!isCurrentPeriodEditMode && (
                <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderLeft: `3px solid ${THEME.status.success}`, boxShadow: THEME.shadow.cardSm }}>
                  <Eye size={14} style={{ color: THEME.status.success }} />
                  <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE</span>
                  <span className="text-xs" style={{ color: THEME.text.secondary }}>— Click "GO EDIT" to make changes</span>
                </div>
              )}
              
              {/* Auto-populate toolbar - only in Edit Mode */}
              {isCurrentPeriodEditMode && fullTimeEmployees.length > 0 && (
                <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2 flex-wrap" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderLeft: `3px solid ${THEME.accent.blue}`, boxShadow: THEME.shadow.cardSm }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: THEME.accent.blue }} />
                    <span className="text-xs font-medium" style={{ color: THEME.accent.blue }}>Full-Time ({fullTimeEmployees.length})</span>
                  </div>
                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />

                  {/* S62 — Auto-Fill dropdown (collapsed: top option = All FT, rest = individual employees) */}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      e.target.value = '';
                      if (!val) return;
                      const weekDates = activeWeek === 1 ? week1 : week2;
                      if (val === '__all__') {
                        const hasExisting = fullTimeEmployees.some(x => employeeHasShiftsInWeek(x, weekDates));
                        if (hasExisting) {
                          setAutoPopulateConfirm({ type: 'populate-all', week: activeWeek });
                        } else {
                          const count = autoPopulateWeek(weekDates);
                          if (count > 0) showToast('success', `Added ${count} shifts for full-time employees`);
                          else showToast('warning', 'No shifts added — check that full-time employees have availability set');
                        }
                      } else {
                        const emp = fullTimeEmployees.find(x => x.id === val);
                        if (!emp) return;
                        if (employeeHasShiftsInWeek(emp, weekDates)) {
                          setAutoPopulateConfirm({ type: 'populate-week', employee: emp, week: activeWeek });
                        } else {
                          const count = autoPopulateWeek(weekDates, [emp]);
                          if (count > 0) showToast('success', `Added ${count} shifts for ${emp.name}`);
                          else showToast('warning', `No shifts added — ${emp.name} may not have availability set for this week`);
                        }
                      }
                    }}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary, border: `1px solid ${THEME.border.default}` }}
                    aria-label={`Auto-fill week ${activeWeek}`}
                  >
                    <option value="">⚡ Auto-Fill Week {activeWeek}...</option>
                    <option value="__all__" style={{ fontWeight: 700 }}>All Full-Timers</option>
                    <optgroup label="— or pick one —">
                      {fullTimeEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </optgroup>
                  </select>

                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />

                  {/* S62 — Clear dropdown (collapsed the same way) */}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      e.target.value = '';
                      if (!val) return;
                      if (val === '__all__') {
                        setAutoPopulateConfirm({ type: 'clear-all', week: activeWeek });
                      } else {
                        const emp = fullTimeEmployees.find(x => x.id === val);
                        if (emp) setAutoPopulateConfirm({ type: 'clear-week', employee: emp, week: activeWeek });
                      }
                    }}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted, border: `1px solid ${THEME.border.default}` }}
                    aria-label={`Clear week ${activeWeek}`}
                  >
                    <option value="">🗑 Clear Week {activeWeek}...</option>
                    <option value="__all__" style={{ fontWeight: 700, color: THEME.status.error }}>All Full-Timers</option>
                    <optgroup label="— or pick one —">
                      {fullTimeEmployees.filter(emp => employeeHasShiftsInWeek(emp, activeWeek === 1 ? week1 : week2)).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </optgroup>
                  </select>

                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />

                  {/* S62 — Schedule PK (bulk). Neutral palette per Stage 3 rule (events != accent colors). */}
                  <button
                    onClick={() => setPkModalOpen(true)}
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                    style={{ backgroundColor: THEME.event.pkBg, color: THEME.event.pkText, border: `1px solid ${THEME.event.pkBorder}` }}
                  >
                    <BookOpen size={10} />
                    Schedule PK
                  </button>

                  {/* Bulk PK autofill for the active week. Secondary (outline) variant keeps
                      it one notch below the primary "Schedule PK" per button-hierarchy rule. */}
                  <button
                    onClick={() => setAutoPopulateConfirm({ type: 'autofill-pk-week', week: activeWeek })}
                    className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                    style={{ backgroundColor: 'transparent', color: THEME.event.pkText, border: `1px solid ${THEME.event.pkBorder}` }}
                    aria-label={`Autofill PK for week ${activeWeek}`}
                  >
                    <BookOpen size={10} />
                    Autofill Wk {activeWeek}
                  </button>
                </div>
              )}
              
              {/* Period Announcement - show if exists */}
              {currentAnnouncement?.message && (
                <div className="mb-2 p-3 rounded-lg flex items-start gap-3" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderLeft: `3px solid ${THEME.accent.blue}`, boxShadow: THEME.shadow.cardSm }}>
                  <Bell size={16} style={{ color: THEME.accent.blue, marginTop: 2 }} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: THEME.accent.blue }}>
                      📢 {currentAnnouncement.subject || 'Announcement'}
                    </p>
                    <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: THEME.text.primary }}>
                      {currentAnnouncement.message}
                    </p>
                  </div>
                  {!isCurrentPeriodEditMode && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}>
                      Visible to staff
                    </span>
                  )}
                </div>
              )}
              
              {/* Schedule grid */}
              <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderTop: 'none', zIndex: 1, boxShadow: THEME.shadow.card }}>
                <div className="grid gap-px" style={{ gridTemplateColumns: '140px repeat(7, 1fr)', backgroundColor: THEME.border.subtle }}>
                  <div className="p-1.5" style={{ backgroundColor: THEME.bg.tertiary }}><span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>Employee</span></div>
                  {currentDates.map((date, i) => {
                    const sh = getStoreHoursForDate(date);
                    const today = date.toDateString() === new Date().toDateString();
                    const hol = isStatHoliday(date);
                    const scheduled = getScheduledCount(date);
                    const target = getStaffingTarget(date);
                    const atTarget = scheduled >= target;
                    const overTarget = scheduled > target;
                    const dateStr = toDateKey(date);
                    const hasOverride = !!storeHoursOverrides[dateStr] || staffingTargetOverrides[dateStr] !== undefined;
                    const isPast = dateStr < toDateKey(new Date());
                    const canEdit = isCurrentPeriodEditMode && !isPast;
                    return (
                      <div 
                        key={dateStr}
                        className={`p-1 text-center ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
                        style={{ backgroundColor: today ? THEME.accent.purple + '20' : hol ? THEME.status.warning + '15' : THEME.bg.tertiary, borderBottom: today ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : 'none' }}
                        onClick={() => canEdit && setEditingColumnDate(date)}
                        title={canEdit ? 'Click to edit hours & target' : isPast ? 'Past dates cannot be edited' : 'Switch to Edit Mode to change'}
                      >
                        <p className="font-semibold text-xs" style={{ color: today ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary }}>{getDayName(date).slice(0, 3)}</p>
                        <p className="text-sm font-bold" style={{ color: THEME.text.primary }}>{date.getDate()}</p>
                        <p className="text-xs" style={{ color: hasOverride ? THEME.accent.cyan + 'CC' : THEME.text.muted }}>{formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}</p>
                        <p className="text-xs mt-0.5">
                          <AnimatedNumber value={scheduled} overtimeThreshold={Infinity} style={{ color: overTarget ? THEME.status.error + 'AA' : atTarget ? THEME.status.success + '99' : THEME.text.muted }} />
                          <span style={{ color: hasOverride ? THEME.accent.cyan + '99' : THEME.text.muted }}>/{target}</span>
                        </p>
                        {target > 0 && (
                          <div className="px-1"><StaffingBar scheduled={scheduled} target={target} /></div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>{schedulableEmployees.map((e, i) => {
                  const isFirstPT = i > 0 && e.employmentType !== 'full-time' && e.name.toLowerCase() !== 'sarvi' && 
                    (schedulableEmployees[i-1].employmentType === 'full-time' || schedulableEmployees[i-1].name.toLowerCase() === 'sarvi');
                  return (
                    <React.Fragment key={e.id}>
                      {isFirstPT && <div style={{ height: 1, margin: '3px 8px', backgroundColor: THEME.border.default }} />}
                      <EmployeeRow employee={e} dates={currentDates} shifts={shifts} events={events} onCellClick={handleCellClick} getEmployeeHours={getEmpHours} onEdit={handleEditEmployee} onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} timeOffRequests={timeOffRequests} isLocked={!isCurrentPeriodEditMode} />
                    </React.Fragment>
                  );
                })}</div>
                
                {/* Former Staff (deleted employees with shifts) removed from the
                    main grid per Sarvi (2026-04-18). Records + shift data are
                    preserved in the backend; restore via Manage Staff if needed. */}
              </div>
              
              {/* Legend */}
              <div className="mt-2 p-1.5 rounded-lg flex items-center gap-2 flex-wrap text-xs" style={{ backgroundColor: THEME.bg.secondary, zIndex: 1 }}>
                {ROLES.filter(r => r.id !== 'none').map(r => <div key={r.id} className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ backgroundColor: r.color }} /><span style={{ color: THEME.text.secondary }}>{r.fullName}</span></div>)}
                <div className="flex items-center gap-1 ml-auto"><Star size={10} fill={THEME.task} color={THEME.task} /><span style={{ color: THEME.text.secondary }}>Task</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm flex items-center justify-center" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}` }} /><span style={{ color: THEME.text.secondary }}>Unavailable</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm" style={{ background: `repeating-linear-gradient(-45deg, transparent, transparent 2px, ${THEME.accent.cyan}40 2px, ${THEME.accent.cyan}40 4px)` }} /><span style={{ color: THEME.text.secondary }}>Time Off</span></div>
                {adminContacts.length > 0 && (
                  <>
                    <div className="w-px h-3 mx-1" style={{ backgroundColor: THEME.border.default }} />
                    <span style={{ color: THEME.text.muted }}>Contact:</span>
                    {adminContacts.map(a => (
                      <span key={a.id} className="flex items-center gap-1">
                        <Shield size={10} style={{ color: THEME.accent.purple }} />
                        <span style={{ color: THEME.accent.cyan }}>{a.email}</span>
                      </span>
                    ))}
                  </>
                )}
              </div>
              
              {/* Hidden Staff Section - Inactive employees and hidden admins.
                  Collapsed by default per plan Item 8 (progressive disclosure --
                  tertiary info shouldn't compete with the primary grid). */}
              {hiddenStaff.length > 0 && (
                <div className="mt-2">
                  <CollapsibleSection
                    title="Hidden from Schedule"
                    icon={UserX}
                    iconColor={THEME.text.muted}
                    badge={hiddenStaff.length}
                    badgeColor={THEME.text.muted}
                    defaultOpen={false}
                  >
                    <div className="flex flex-wrap gap-2">
                      {hiddenStaff.map(emp => (
                        <div key={emp.id} className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: emp.isAdmin ? THEME.accent.purple + '30' : THEME.bg.elevated, color: emp.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                            {emp.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                              {emp.name}
                              {emp.isAdmin && <Shield size={8} style={{ color: THEME.accent.purple }} />}
                            </span>
                            <span className="text-xs" style={{ color: THEME.text.muted }}>
                              {!emp.active ? 'Inactive' : 'Hidden Admin'}
                            </span>
                          </div>
                          <button
                            onClick={() => { setEditingEmp(emp); setEmpFormOpen(true); }}
                            className="p-1 rounded hover:opacity-80"
                            style={{ backgroundColor: THEME.bg.elevated }}
                            title="Edit Employee"
                          >
                            <Edit3 size={10} style={{ color: THEME.text.muted }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </div>
              )}
              
              {/* Admin's own Time Off Requests - below schedule for consistency with employee view */}
              <div className="mt-3">
                <AdminMyTimeOffPanel 
                  requests={timeOffRequests}
                  currentUserEmail={currentUser?.email}
                  onCancel={cancelTimeOffRequest}
                />
              </div>
            </>
          ) : activeTab === 'comms' ? (
            /* Announcements Panel */
            <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ borderTop: 'none', zIndex: 1 }}>
              <CommunicationsPanel 
                employees={employees} 
                shifts={shifts} 
                dates={dates} 
                periodInfo={{ startDate, endDate, label: `Week ${weekNum1} & ${weekNum2} • ${formatMonthWord(startDate)} ${startDate.getDate()} – ${formatMonthWord(endDate)} ${endDate.getDate()}, ${startDate.getFullYear()}` }}
                adminContacts={adminContacts}
                announcement={currentAnnouncement}
                onAnnouncementChange={setCurrentAnnouncement}
                onSave={saveAnnouncement}
                onClear={clearAnnouncement}
                isEditMode={isCurrentPeriodEditMode}
                isSaving={savingAnnouncement}
              />
            </div>
          ) : (
            /* Shift Changes Panel */
            <div className="rounded-b-xl rounded-tr-xl overflow-visible relative space-y-3" style={{ borderTop: 'none', zIndex: 1 }}>
              {/* Time Off Requests Section */}
              <CollapsibleSection 
                title="Time Off Requests" 
                icon={Calendar} 
                iconColor={THEME.accent.cyan}
                badge={timeOffRequests.filter(r => r.status === 'pending').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={timeOffRequests.filter(r => r.status === 'pending').length > 0}
              >
                <AdminTimeOffPanel
                  requests={timeOffRequests}
                  onApprove={approveTimeOffRequest}
                  onDeny={denyTimeOffRequest}
                  onRevoke={revokeTimeOffRequest}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Take My Shift Section */}
              <CollapsibleSection 
                title="Take My Shift Requests" 
                icon={ArrowRight} 
                iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftOffers.filter(o => o.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftOffersPanel
                  offers={shiftOffers}
                  onApprove={approveShiftOffer}
                  onReject={adminRejectShiftOffer}
                  onRevoke={revokeShiftOffer}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Shift Swaps Section */}
              <CollapsibleSection 
                title="Shift Swaps" 
                icon={ArrowRightLeft} 
                iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.status === 'awaiting_admin').length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={shiftSwaps.filter(s => s.status === 'awaiting_admin').length > 0}
              >
                <AdminShiftSwapsPanel
                  swaps={shiftSwaps}
                  onApprove={approveSwapRequest}
                  onReject={adminRejectSwapRequest}
                  onRevoke={revokeSwapRequest}
                  currentAdminEmail={currentUser?.email}
                />
              </CollapsibleSection>
              
              {/* Admin's own requests */}
              <CollapsibleSection 
                title="My Requests" 
                icon={User} 
                iconColor={THEME.accent.cyan}
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Time Off</h4>
                    <MyRequestsPanel 
                      requests={timeOffRequests} 
                      currentUserEmail={currentUser.email} 
                      onCancel={cancelTimeOffRequest} 
                    />
                  </div>
                  {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Take My Shift</h4>
                      <MyShiftOffersPanel 
                        offers={shiftOffers}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelShiftOffer}
                      />
                    </div>
                  )}
                  {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
                    <div>
                      <h4 className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Shift Swaps</h4>
                      <MySwapsPanel 
                        swaps={shiftSwaps}
                        currentUserEmail={currentUser.email}
                        onCancel={cancelSwapRequest}
                      />
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>
      </main>
      
      <EmployeeFormModal isOpen={empFormOpen} onClose={() => { setEmpFormOpen(false); setEditingEmp(null); }} onSave={saveEmployee} onDelete={deleteEmployee} employee={editingEmp} currentUser={currentUser} showToast={showToast} suggestedPassword={editingEmp ? undefined : `emp-${String(employees.length + 1).padStart(3, '0')}`} />
      {editingShift && (() => {
        const prior = new Date(editingShift.date); prior.setDate(prior.getDate() - 1);
        const priorStreak = computeConsecutiveWorkDayStreak((id, k) => !!shifts[`${id}-${k}`], editingShift.employee.id, toDateKey(prior));
        return <ShiftEditorModal isOpen onClose={() => setEditingShift(null)} onSave={saveShift} employee={editingShift.employee} date={editingShift.date} existingShift={editingShift.shift} existingEvents={events[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`] || []} totalPeriodHours={getEmpHours(editingShift.employee.id)} availability={editingShift.employee.availability?.[getDayName(editingShift.date)]} hasApprovedTimeOff={hasApprovedTimeOffForDate(editingShift.employee.email, toDateKey(editingShift.date), timeOffRequests)} priorWorkStreak={priorStreak} />;
      })()}
      <EmailModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} employees={employees} shifts={shifts} events={events} dates={dates} periodInfo={{ startDate, endDate }} announcement={currentAnnouncement} onComplete={() => { setPublished(true); setUnsaved(false); }} />
      <InactiveEmployeesPanel isOpen={inactivePanelOpen} onClose={() => setInactivePanelOpen(false)} employees={employees} onReactivate={reactivateEmployee} onDelete={deleteEmployee} />
      <AdminSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} currentUser={currentUser} staffingTargets={staffingTargets} onStaffingTargetsChange={setStaffingTargets} showToast={showToast} />
      <PKEventModal
        isOpen={pkModalOpen}
        onClose={() => setPkModalOpen(false)}
        onSchedule={handleBulkPK}
        employees={employees}
      />
      {editingColumnDate && (
        <ColumnHeaderEditor
          date={editingColumnDate}
          storeHours={getStoreHoursForDate(editingColumnDate)}
          target={getStaffingTarget(editingColumnDate)}
          storeHoursOverrides={storeHoursOverrides}
          staffingTargetOverrides={staffingTargetOverrides}
          onSave={saveColumnOverrides}
          onClose={() => setEditingColumnDate(null)}
        />
      )}
      
      {/* Admin's own time off request modals */}
      <RequestTimeOffModal 
        isOpen={adminRequestModalOpen} 
        onClose={() => setAdminRequestModalOpen(false)} 
        onSelectType={handleAdminSelectRequestType}
        currentUser={currentUser}
      />
      <RequestDaysOffModal 
        isOpen={adminDaysOffModalOpen} 
        onClose={() => setAdminDaysOffModalOpen(false)} 
        onSubmit={submitTimeOffRequest}
        currentUser={currentUser}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
        shiftSwaps={shiftSwaps}
        shifts={shifts}
      />
      
      {/* Auto-populate confirmation modal */}
      {autoPopulateConfirm && (
        <Modal isOpen onClose={() => setAutoPopulateConfirm(null)} title="Confirm Action" size="sm">
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" 
              style={{ backgroundColor: autoPopulateConfirm.type.includes('clear') ? THEME.status.error + '20' : THEME.accent.blue + '20' }}>
              {autoPopulateConfirm.type.includes('clear') 
                ? <Trash2 size={24} style={{ color: THEME.status.error }} />
                : <Zap size={24} style={{ color: THEME.accent.blue }} />
              }
            </div>
            
            <p className="text-sm font-medium mb-2" style={{ color: THEME.text.primary }}>
              {autoPopulateConfirm.type === 'populate-all' && `Auto-Fill All Full-Time for Week ${autoPopulateConfirm.week}?`}
              {autoPopulateConfirm.type === 'populate-week' && `Auto-Fill Week ${autoPopulateConfirm.week} for ${autoPopulateConfirm.employee?.name}?`}
              {autoPopulateConfirm.type === 'clear-week' && `Clear Week ${autoPopulateConfirm.week} for ${autoPopulateConfirm.employee?.name}?`}
              {autoPopulateConfirm.type === 'clear-all' && `Clear All Full-Time Shifts for Week ${autoPopulateConfirm.week}?`}
              {autoPopulateConfirm.type === 'autofill-pk-week' && `Autofill PK for Week ${autoPopulateConfirm.week}?`}
            </p>

            <p className="text-xs mb-4" style={{ color: THEME.text.secondary }}>
              {autoPopulateConfirm.type === 'autofill-pk-week'
                ? 'Saturday uses 10:00-10:45 (pre-open). Other days use 18:00-20:00 (post-close). Eligible full-timers only. Days that already have PK are preserved.'
                : autoPopulateConfirm.type.includes('populate')
                  ? 'Some shifts already exist and will be preserved. Only empty days will be filled based on availability.'
                  : 'This will remove the selected shifts. You can undo by not saving changes.'
              }
            </p>

            <div className="flex justify-center gap-2">
              <GradientButton variant="secondary" small onClick={() => setAutoPopulateConfirm(null)}>
                Cancel
              </GradientButton>
              <GradientButton
                small
                danger={autoPopulateConfirm.type.includes('clear')}
                onClick={handleAutoPopulateConfirm}
              >
                {autoPopulateConfirm.type.includes('clear') ? 'Clear Shifts' : autoPopulateConfirm.type === 'autofill-pk-week' ? 'Autofill PK' : 'Auto-Fill'}
              </GradientButton>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Toast Notification - fixed position at top center, ABOVE modals */}
      {toast && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-xl flex items-center gap-2"
          style={{ 
            backgroundColor: toast.type === 'success' ? THEME.status.success
              : toast.type === 'warning' ? THEME.status.warning
              : toast.type === 'saving' ? '#FFFFFF'
              : THEME.status.error,
            color: toast.type === 'saving' ? THEME.accent.blue : '#fff',
            border: toast.type === 'saving' ? `2px solid ${THEME.accent.blue}` : 'none',
            minWidth: 200,
            textAlign: 'center',
            zIndex: 100001,
            boxShadow: THEME.shadow.cardSm
          }}
        >
          {toast.type === 'saving' ? <Loader size={16} className="animate-spin" /> 
            : toast.type === 'success' ? <Check size={16} /> 
            : <AlertCircle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
          {toast.type !== 'saving' && (
            <button 
              onClick={() => setToast(null)} 
              className="ml-2 hover:opacity-70"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      
      {/* Employee Tooltip - rendered at top level to escape stacking contexts */}
      {tooltipData && (
        <div className="fixed p-2.5 rounded-lg shadow-2xl" style={{ top: tooltipData.pos.top, left: tooltipData.pos.left, width: 240, backgroundColor: THEME.tooltip.bg, border: `1px solid ${THEME.tooltip.border}`, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)', zIndex: 99999 }}>
          <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: tooltipData.isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: tooltipData.isDeleted ? THEME.text.muted : 'white' }}>{tooltipData.employee.name.charAt(0)}</div>
            <div className="flex-1">
              <p className="font-semibold text-xs flex items-center gap-1" style={{ color: THEME.text.primary }}>
                {tooltipData.employee.name} 
                {tooltipData.employee.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                {tooltipData.isDeleted && <span style={{ color: THEME.text.muted }}>(Former)</span>}
              </p>
              <p className="text-xs font-bold" style={{ color: tooltipData.hours >= 40 ? THEME.status.error : tooltipData.hours >= 35 ? THEME.status.warning : THEME.accent.cyan }}>{tooltipData.hours.toFixed(1)}h</p>
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex items-center gap-1" style={{ color: THEME.text.secondary }}><Mail size={10} />{tooltipData.employee.email}</div>
            {tooltipData.employee.phone && <div className="flex items-center gap-1" style={{ color: THEME.text.secondary }}><Phone size={10} />{tooltipData.employee.phone}</div>}
            {tooltipData.employee.isAdmin && <div className="flex items-center gap-1" style={{ color: THEME.accent.purple }}><Shield size={10} />Admin Access</div>}
          </div>
          {!tooltipData.isDeleted && (
            <div className="pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: THEME.text.muted }}>AVAILABILITY</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0">
                {days.map(d => {
                  const av = tooltipData.employee.availability[d];
                  return <div key={d} className="flex justify-between text-xs"><span style={{ color: av.available ? THEME.text.primary : THEME.text.muted }}>{d.slice(0,3)}</span>{av.available ? <span style={{ color: THEME.accent.cyan }}>{formatTimeShort(av.start)}-{formatTimeShort(av.end)}</span> : <span style={{ color: THEME.text.muted }}>—</span>}</div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
