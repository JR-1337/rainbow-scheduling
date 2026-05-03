import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useIsMobile, MobileMySchedule, MobileBottomSheet } from './MobileEmployeeView';
import { MobileAdminDrawer, MobileAdminScheduleGrid, MobileAnnouncementPanel, MobileEmployeeQuickView, MobileAdminBottomNav } from './MobileAdminView';
import { parseLocalDate, escapeHtml } from './utils/format';
import { toDateKey, getDayName, formatDate, formatMonthWord, getWeekNumber, formatTimeDisplay, formatTimeShort, parseTime } from './utils/date';
import { isStatHoliday } from './utils/storeHours';
import { TooltipButton, Modal } from './components/primitives';
import { AdaptiveModal } from './components/AdaptiveModal';
import { haptic, AnimatedNumber, ScheduleSkeleton, TaskStarTooltip, GradientBackground, Logo, StaffingBar } from './components/uiKit';
import { PAY_PERIOD_START, CURRENT_PERIOD_INDEX, getPayPeriodDates } from './utils/payPeriod';
import { matchesOfferId, matchesSwapId, errorMsg } from './utils/requests';
import { CollapsibleSection } from './components/CollapsibleSection';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen, ErrorScreen } from './components/LoadingScreen';
import ScheduleStateButton from './components/ScheduleStateButton';
import { ColumnHeaderEditor } from './components/ColumnHeaderEditor';
import { useUnsavedWarning } from './hooks/useUnsavedWarning';
import { useDismissOnOutside } from './hooks/useDismissOnOutside';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useAnnouncements } from './hooks/useAnnouncements';
import { useGuardedMutation } from './hooks/useGuardedMutation';
import { useTooltip } from './hooks/useTooltip';
import { EmployeeRow } from './components/EmployeeRow';
import ColumnHeaderCell from './components/ColumnHeaderCell';
import { MobileScheduleActionSheet } from './components/MobileScheduleActionSheet';
import { PKDetailsPanel } from './components/PKDetailsPanel';
import { getStoreHoursForDate, setStoreHoursOverrides as syncStoreHoursOverrides, setStaffingTargetOverrides as syncStaffingTargetOverrides } from './utils/storeHoursOverrides';
import { apiCall } from './utils/api';
import { normalizeAnnouncements, partitionRequests, parseEmployeesFromApi, partitionShiftsAndEvents, filterToLivePeriods } from './utils/apiTransforms';
import { getFutureShiftDates, formatFutureShiftsBlockMessage, getFutureEventDates, formatFutureEventsBlockMessage, serializeEmployeeForApi, filterSchedulableEmployees } from './utils/employees';
import { createShiftFromAvailability, applyShiftMutation, collectPeriodShiftsForSave, transferShiftBetweenEmployees, swapShiftsBetweenEmployees } from './utils/scheduleOps';
import { computeDayUnionHours, computeNetHoursForShift, computeConsecutiveWorkDayStreak, availabilityCoversWindow } from './utils/timemath';
import { computeViolations } from './utils/violations';
import { getPKDefaultTimes } from './utils/eventDefaults';
import { sortBySarviAdminsFTPT, employeeBucket } from './utils/employeeSort';
import { hasTitle } from './utils/employeeRender';
import { getAuthToken, setAuthToken, clearAuth, setCachedUser, handleAuthError } from './auth';
import { OTR, THEME, TYPE } from './theme';
import { ROLES, ROLES_BY_ID, EVENT_TYPES, DESKTOP_SCHEDULE_GRID_TEMPLATE } from './constants';
import { AdminTimeOffPanel } from './panels/AdminTimeOffPanel';
import { AdminMyTimeOffPanel } from './panels/AdminMyTimeOffPanel';
import { AdminShiftOffersPanel } from './panels/AdminShiftOffersPanel';
import { AdminShiftSwapsPanel } from './panels/AdminShiftSwapsPanel';
import { MyShiftOffersPanel } from './panels/MyShiftOffersPanel';
import { MySwapsPanel } from './panels/MySwapsPanel';
import { MyRequestsPanel } from './panels/MyRequestsPanel';
import { EmployeesPanel } from './panels/EmployeesPanel';
import { MobileStaffPanel } from './panels/MobileStaffPanel';
import { ShiftEditorModal } from './modals/ShiftEditorModal';
import { PKModal } from './modals/PKModal';
import { RequestTimeOffModal } from './modals/RequestTimeOffModal';
import { CommunicationsPanel } from './panels/CommunicationsPanel';
import { AdminSettingsModal } from './modals/AdminSettingsModal';
import { ChangePasswordModal } from './modals/ChangePasswordModal';
import { EmployeeFormModal } from './modals/EmployeeFormModal';
import { RequestDaysOffModal } from './modals/RequestDaysOffModal';
import { EmailModal } from './modals/EmailModal';
import { AutofillClearModal } from './modals/AutofillClearModal';
import { EmployeeView } from './views/EmployeeView';
export { THEME, TYPE, ROLES, ROLES_BY_ID };
export { getStoreHoursForDate } from './utils/storeHoursOverrides';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Mail, Save, Send, FileText, X,
  User, Users, Calendar, Check, AlertCircle, Star, Edit3, Trash2, UserX, UserCheck, Eye, EyeOff, LogOut, Shield, Settings, Key, MessageSquare, Loader, ClipboardList, ArrowRightLeft, ArrowRight, Bell, Zap, Clock, Menu, BookOpen, AlertTriangle
} from 'lucide-react';

// Daily staffing targets - defaults (overridden by Settings tab if configured)
const DEFAULT_STAFFING_TARGETS = {
  sunday: 15, monday: 8, tuesday: 8, wednesday: 8,
  thursday: 10, friday: 10, saturday: 20
};


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION - Reusable wrapper for collapsible content
// ═══════════════════════════════════════════════════════════════════════════════
// CollapsibleSection moved to src/components/CollapsibleSection.jsx














// ColumnHeaderEditor moved to src/components/ColumnHeaderEditor.jsx

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
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

  useUnsavedWarning(unsaved);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule', 'comms', or 'requests'
  
  // Loading state for initial data fetch
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const { toast, setToast, showToast } = useToast();

  // S37: persisted session restore + AUTH_EXPIRED auto-bounce to login.
  const [currentUser, setCurrentUser] = useAuth(showToast);
  
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
  useEffect(() => { syncStoreHoursOverrides(storeHoursOverrides); }, [storeHoursOverrides]);
  useEffect(() => { syncStaffingTargetOverrides(staffingTargetOverrides); }, [staffingTargetOverrides]);
  
  // Helper to check if current period is in edit mode (defaults to true for new periods)
  const isCurrentPeriodEditMode = editModeByPeriod[periodIndex] ?? true;

  const currentPeriodStartDate = (() => {
    const sd = new Date(PAY_PERIOD_START.getFullYear(), PAY_PERIOD_START.getMonth(), PAY_PERIOD_START.getDate() + (periodIndex * 14));
    return toDateKey(sd);
  })();
  const {
    currentAnnouncement, setCurrentAnnouncement,
    saveAnnouncement, clearAnnouncement, savingAnnouncement,
    setAnnouncements,
  } = useAnnouncements({ periodStartDate: currentPeriodStartDate, userEmail: currentUser?.email });
  
  const [inactivePanelOpen, setInactivePanelOpen] = useState(false);
  // tooltipData + handleShowTooltip + handleHideTooltip moved to hooks/useTooltip.js
  const { tooltipData, handleShowTooltip, handleHideTooltip, handleTooltipEnter, handleTooltipLeave } = useTooltip();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  // O(1) approved-time-off lookup keyed by `${email}-${dateStr}`. Hoisted from
  // per-cell .some() scans across every schedule render path (admin grid,
  // mobile admin grid, mobile employee grid, autopopulate scoring).
  const approvedTimeOffSet = useMemo(() => {
    const set = new Set();
    for (const req of timeOffRequests) {
      if (req.status !== 'approved' || !req.email || !req.datesRequested) continue;
      for (const d of req.datesRequested.split(',')) set.add(`${req.email}-${d}`);
    }
    return set;
  }, [timeOffRequests]);
  const [shiftOffers, setShiftOffers] = useState([]);
  const [shiftSwaps, setShiftSwaps] = useState([]);
  const [adminRequestModalOpen, setAdminRequestModalOpen] = useState(false);
  const [welcomeSweep, setWelcomeSweep] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef(null);
  useDismissOnOutside(adminMenuRef, adminMenuOpen, () => setAdminMenuOpen(false));
  const [adminDaysOffModalOpen, setAdminDaysOffModalOpen] = useState(false);
  const [pkModalOpen, setPkModalOpen] = useState(false);
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false);
  const [autofillClearOpen, setAutofillClearOpen] = useState(false);
  
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
  const [violationsPanelOpen, setViolationsPanelOpen] = useState(false);

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

  // S37: if we restored a user from localStorage on mount, fire the normal data-load.
  // If the token is stale, loadDataFromBackend will surface AUTH_EXPIRED and the
  // callback above will bounce us to the login screen.
  const didBootstrapRef = useRef(false);
  const guardedMutation = useGuardedMutation(showToast);

  // PK editor: unified handler for PKModal (CREATE + REMOVE modes).
  // CREATE: addIds (new bookings) + removeBookings (single-slot removals from diff).
  // REMOVE: removeBookings array of per-booking tuples across the visible week.
  // Persistence: batchSaveShifts path rewrites the period — atomic with any other unsaved edits.
  const handlePKConfirm = async ({ mode, date, startTime, endTime, note, addIds = [], removeBookings = [] }) => {
    if (addIds.length === 0 && removeBookings.length === 0) return;
    await guardedMutation(mode === 'create' ? 'Updating PK' : 'Removing PK', async () => {
      const prevEvents = events;
      const nextEvents = { ...events };

      // Apply removals — each tuple targets a specific (empId, date, startTime, endTime) booking
      removeBookings.forEach(({ empId, date: bDate, startTime: bStart, endTime: bEnd }) => {
        const key = `${empId}-${bDate}`;
        const list = nextEvents[key] || [];
        const filtered = list.filter(ev =>
          !(ev.type === 'pk' && ev.startTime === bStart && ev.endTime === bEnd)
        );
        if (filtered.length === 0) delete nextEvents[key];
        else nextEvents[key] = filtered;
      });

      // Apply adds (CREATE mode only — single date/start/end slot)
      if (mode === 'create') {
        addIds.forEach(empId => {
          const emp = employees.find(e => String(e.id) === String(empId));
          if (!emp) return;
          const key = `${empId}-${date}`;
          const newEvent = {
            id: `PK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            employeeId: empId,
            employeeName: emp.name,
            employeeEmail: emp.email,
            date,
            startTime,
            endTime,
            role: 'none',
            task: '',
            type: 'pk',
            note: note || '',
          };
          nextEvents[key] = [...(nextEvents[key] || []), newEvent];
        });
      }

      setEvents(nextEvents);

      const { periodShifts, periodDates } = collectPeriodShiftsForSave(dates, employees, shifts, nextEvents);
      const saveResult = await apiCall('batchSaveShifts', { shifts: periodShifts, periodDates });

      if (!saveResult.success) {
        setEvents(prevEvents);
        showToast('error', errorMsg(saveResult, 'Failed to save PK changes'));
        return;
      }

      const bits = [];
      if (addIds.length > 0) bits.push(`+${addIds.length}`);
      if (removeBookings.length > 0) bits.push(`-${removeBookings.length}`);
      showToast('success', `PK updated (${bits.join(' / ')})`);
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
      
      setEmployees(parseEmployeesFromApi(empData));
      
      const { shiftsObj, eventsObj } = partitionShiftsAndEvents(shiftData);
      setShifts(shiftsObj);
      setEvents(eventsObj);
      
      const { livePeriods: loadedLivePeriods } = result.data;
      const { publishedShifts: publishedObj, publishedEvents: publishedEventsObj, editModeObj } =
        filterToLivePeriods(shiftsObj, eventsObj, loadedLivePeriods, PAY_PERIOD_START);
      if (loadedLivePeriods && Array.isArray(loadedLivePeriods)) {
        setEditModeByPeriod(editModeObj);
      }
      setPublishedShifts(publishedObj);
      setPublishedEvents(publishedEventsObj);
      
      const { timeOff, offers, swaps } = partitionRequests(requests);
      setTimeOffRequests(timeOff);
      setShiftOffers(offers);
      setShiftSwaps(swaps);
      
      const { announcements: loadedAnnouncements } = result.data;
      if (loadedAnnouncements && Array.isArray(loadedAnnouncements)) {
        setAnnouncements(normalizeAnnouncements(loadedAnnouncements));
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
      setLoadError(errorMsg(result, 'Failed to load data'));
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
      const { periodShifts, periodDates } = collectPeriodShiftsForSave(dates, employees, shifts, events);

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
          : (errorMsg(saveResult, 'Failed to save schedule — schedule is NOT published'));
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
    const { periodShifts, periodDates } = collectPeriodShiftsForSave(dates, employees, shifts, events);

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
        : (errorMsg(saveResult, 'Failed to save'));
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
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const schedulableEmployees = useMemo(() => sortBySarviAdminsFTPT(filterSchedulableEmployees(employees)), [employees]);
  
  // Full-time employees only (for auto-populate feature)
  const fullTimeEmployees = useMemo(() => schedulableEmployees.filter(e => e.employmentType === 'full-time'), [schedulableEmployees]);

  // Part-time employees (Clear dropdown can target them; Auto-Fill stays FT-only by design)
  const partTimeEmployees = useMemo(() => schedulableEmployees.filter(e => e.employmentType === 'part-time'), [schedulableEmployees]);
  
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
      .filter(e => !e.active || ((e.isAdmin || e.adminTier === 'admin2') && !e.showOnSchedule)) // Inactive OR admin/admin2 hidden from schedule
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  // Perf: pre-compute dateKey strings for the current period once per render
  const currentDateStrs = useMemo(() => currentDates.map(toDateKey), [currentDates]);
  const todayStr = useMemo(() => toDateKey(new Date()), []);

  // S61 — hours count work + meeting + pk, but overlaps are union-counted.
  // Fast path: day has only a work shift (no events). Slow path: events present,
  // merge all intervals for the day and sum the union. Sick days short-circuit
  // to 0 regardless of the underlying work shift — the employee wasn't there.
  const getEmpHours = useCallback((id) => {
    let t = 0;
    for (let i = 0; i < currentDateStrs.length; i++) {
      const key = `${id}-${currentDateStrs[i]}`;
      const work = shifts[key];
      const evs = events[key];
      const hasSick = evs && evs.some(e => e.type === 'sick');
      if (hasSick) continue;
      if (!evs || evs.length === 0) {
        if (work) t += computeNetHoursForShift(work);
      } else {
        const all = work ? [work, ...evs] : evs;
        t += computeDayUnionHours(all);
      }
    }
    return t;
  }, [currentDateStrs, shifts, events]);

  // Compute weekly hours for an employee from explicit shift + event maps.
  // Used in autoPopulateWeek + global violations — cannot close over component
  // state because those callers need hours on a just-set newShifts map.
  const computeWeekHoursFor = (empId, dates, shiftMap, eventMap) => {
    let t = 0;
    for (const d of dates) {
      const k = `${empId}-${toDateKey(d)}`;
      const work = shiftMap[k];
      const evs = eventMap[k];
      if (evs && evs.some(e => e.type === 'sick')) continue;
      if (!evs || evs.length === 0) {
        if (work) t += computeNetHoursForShift(work);
      } else {
        t += computeDayUnionHours(work ? [work, ...evs] : evs);
      }
    }
    return t;
  };

  // Pre-compute per-date scheduled headcounts once per relevant state change.
  // O(n_emp * n_dates) cost paid once here instead of per-render per-date.
  const scheduledByDate = useMemo(() => {
    const counts = {};
    for (const dateStr of currentDateStrs) {
      let n = 0;
      for (const emp of schedulableEmployees) {
        const key = `${emp.id}-${dateStr}`;
        if (!shifts[key]) continue;
        const evs = events[key];
        if (evs && evs.some(e => e.type === 'sick')) continue;
        n++;
      }
      counts[dateStr] = n;
    }
    return counts;
  }, [currentDateStrs, schedulableEmployees, shifts, events]);

  // Global violations across all schedulable employees × active period dates.
  // Pure derived state — no Sheets persistence. Hidden when count = 0.
  const allViolations = useMemo(() => {
    const out = [];
    for (const emp of schedulableEmployees) {
      const wkHours = computeWeekHoursFor(emp.id, dates, shifts, events);
      for (const date of dates) {
        const dateStr = toDateKey(date);
        const key = `${emp.id}-${dateStr}`;
        const hasShift = !!shifts[key] || !!(events[key] || []).length;
        if (!hasShift) continue;
        const prior = new Date(date); prior.setDate(prior.getDate() - 1);
        const priorStreak = computeConsecutiveWorkDayStreak(
          (id, k) => !!shifts[`${id}-${k}`],
          emp.id, toDateKey(prior),
          (id, k) => (events[`${id}-${k}`] || []).some(e => e.type === 'sick'),
        );
        const v = computeViolations({
          employee: emp, dateStr, weekHours: wkHours,
          currentStreak: priorStreak + 1,
          hasApprovedTimeOff: approvedTimeOffSet.has(`${emp.email}-${dateStr}`),
          availability: emp.availability?.[getDayName(date).toLowerCase()],
        });
        if (v.length > 0) out.push({ emp, dateStr, violations: v });
      }
    }
    return out;
  }, [schedulableEmployees, dates, shifts, events, approvedTimeOffSet]);

  // Count scheduled employees for a given date. Sick days drop out of the
  // headcount — the employee isn't actually there, even though the work row
  // stays in the sheet for audit.
  const getScheduledCount = useCallback(
    (date) => scheduledByDate[toDateKey(date)] || 0,
    [scheduledByDate]
  );
  
  // Get staffing target for a given date (per-date override → weekly default → fallback)
  const getStaffingTarget = (date) => {
    const dateStr = toDateKey(date);
    if (staffingTargetOverrides[dateStr] !== undefined) return staffingTargetOverrides[dateStr];
    const dayName = getDayName(date).toLowerCase();
    return staffingTargets[dayName] || DEFAULT_STAFFING_TARGETS[dayName] || 8;
  };
  
  // Auto-populate shift for an employee on a date.
  // v2.24.0: prefer per-day defaultShift; fall back to availability window.
  // availability.available stays the gate — never books a day the employee is off.
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

    emps.forEach(emp => {
      weekDates.forEach(date => {
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
      // Compute violations on the just-booked shifts for the summary toast.
      const violationsList = [];
      emps.forEach(emp => {
        weekDates.forEach(date => {
          const dateStr = toDateKey(date);
          const key = `${emp.id}-${dateStr}`;
          if (!newShifts[key]) return;
          const wkHours = computeWeekHoursFor(emp.id, weekDates, newShifts, events);
          const prior = new Date(date); prior.setDate(prior.getDate() - 1);
          const priorStreak = computeConsecutiveWorkDayStreak(
            (id, k) => !!newShifts[`${id}-${k}`],
            emp.id, toDateKey(prior),
            (id, k) => (events[`${id}-${k}`] || []).some(e => e.type === 'sick'),
          );
          const v = computeViolations({
            employee: emp, dateStr, weekHours: wkHours,
            currentStreak: priorStreak + 1,
            hasApprovedTimeOff: approvedTimeOffSet.has(`${emp.email}-${dateStr}`),
            availability: emp.availability?.[getDayName(date).toLowerCase()],
          });
          if (v.length > 0) violationsList.push({ emp, dateStr, violations: v });
        });
      });
      if (violationsList.length === 0) {
        showToast('success', `Auto-populated ${addedCount} shifts`);
      } else {
        const summary = violationsList.slice(0, 3).map(({ emp, dateStr, violations }) =>
          `${emp.name} ${dateStr}: ${violations.map(x => x.rule).join(', ')}`).join(' | ');
        const more = violationsList.length > 3 ? ` (+${violationsList.length - 3} more)` : '';
        showToast('warning', `Booked ${addedCount}. ${violationsList.length} violations: ${summary}${more}`);
      }
    }

    return addedCount;
  };
  
  // Clear all shifts AND events (PK/meetings) for specific employees in a week
  const clearWeekShifts = (weekDates, targetEmployees = null) => {
    const emps = targetEmployees || fullTimeEmployees;
    const empIds = new Set(emps.map(e => e.id));
    const newShifts = { ...shifts };
    const newEvents = { ...events };
    let removedCount = 0;

    weekDates.forEach(date => {
      const dateStr = toDateKey(date);
      empIds.forEach(empId => {
        const key = `${empId}-${dateStr}`;
        if (newShifts[key]) {
          delete newShifts[key];
          removedCount++;
        }
        const list = newEvents[key] || [];
        const survivors = list.filter(ev => ev.type === 'sick');
        const removedFromList = list.length - survivors.length;
        if (removedFromList > 0) {
          removedCount += removedFromList;
          if (survivors.length === 0) delete newEvents[key];
          else newEvents[key] = survivors;
        }
      });
    });

    if (removedCount > 0) {
      setShifts(newShifts);
      setEvents(newEvents);
      setUnsaved(true);
    }

    return removedCount;
  };
  
  // Clear all PK events on a specific date across all employees. Mirrors clearWeekShifts
  // pattern: mutates events state, marks unsaved, returns count. Admin clicks SAVE on
  // schedule to persist via existing batchSaveShifts path.
  const clearPKForDate = (dateStr) => {
    const newEvents = { ...events };
    let removedCount = 0;
    schedulableEmployees.forEach(emp => {
      const key = `${emp.id}-${dateStr}`;
      const list = newEvents[key] || [];
      const filtered = list.filter(ev => ev.type !== 'pk');
      if (filtered.length !== list.length) {
        removedCount += list.length - filtered.length;
        if (filtered.length === 0) delete newEvents[key];
        else newEvents[key] = filtered;
      }
    });
    if (removedCount > 0) {
      setEvents(newEvents);
      setUnsaved(true);
    }
    return removedCount;
  };


  // Unified handler for the new AutofillClearModal.
  const handleAutofillClearConfirm = ({ mode, empIds }) => {
    const weekDates = activeWeek === 1 ? week1 : week2;
    const targetEmployees = empIds.map(id => schedulableEmployees.find(e => e.id === id)).filter(Boolean);
    if (targetEmployees.length === 0) return;
    if (mode === 'fill') {
      autoPopulateWeek(weekDates, targetEmployees);
      // autoPopulateWeek shows its own toast (success or warning w/ violation summary).
    } else {
      const count = clearWeekShifts(weekDates, targetEmployees);
      if (count > 0) {
        showToast('success', `Removed ${count} shift${count === 1 ? '' : 's'}/event${count === 1 ? '' : 's'} for ${targetEmployees.length} employee${targetEmployees.length === 1 ? '' : 's'}`);
      } else {
        showToast('warning', 'Nothing to clear in this week');
      }
    }
  };

  const saveEmployee = async (e) => {
    if (editingEmp && !e.active && editingEmp.active) {
      if (currentUser && e.email === currentUser.email) {
        showToast('error', 'You cannot deactivate your own account.', 6000);
        return false;
      }
      if (editingEmp.isOwner) {
        showToast('error', 'The owner account cannot be deactivated.', 6000);
        return false;
      }
      if (editingEmp.isAdmin) {
        showToast('error', 'Admin accounts cannot be deactivated. Demote to Staff first.', 6000);
        return false;
      }
      const futureShifts = getFutureShiftDates(e.id, shifts);
      if (futureShifts.length > 0) {
        showToast('error', formatFutureShiftsBlockMessage('deactivate', e.name, futureShifts), 8000);
        return false;
      }
      const futureEvents = getFutureEventDates(e.id, events);
      if (futureEvents.length > 0) {
        showToast('error', formatFutureEventsBlockMessage('deactivate', e.name, futureEvents), 8000);
        return false;
      }
    }

    // Do NOT clear editingEmp: if save fails modal stays open and labelled "Edit".
    const prevEmployees = employees;
    const wasEditing = !!editingEmp;
    if (editingEmp) setEmployees(employees.map(x => x.id === e.id ? e : x));
    else setEmployees([...employees, { ...e, active: true }]);

    const employeeForApi = {
      ...serializeEmployeeForApi(e),
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
      showToast('error', errorMsg(result, 'Failed to save employee'));
      return false;
    }
  };
  
  const deleteEmployee = async (id) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return false;

    if (currentUser && emp.email === currentUser.email) {
      showToast('error', 'You cannot remove your own account.', 6000);
      return false;
    }
    if (emp.isOwner) {
      showToast('error', 'The owner account cannot be removed.', 6000);
      return false;
    }
    if (emp.isAdmin) {
      showToast('error', 'Admin accounts cannot be removed. Demote to Staff first.', 6000);
      return false;
    }

    const futureShifts = getFutureShiftDates(id, shifts);
    if (futureShifts.length > 0) {
      showToast('error', formatFutureShiftsBlockMessage('remove', emp.name, futureShifts), 8000);
      return false;
    }
    const futureEvents = getFutureEventDates(id, events);
    if (futureEvents.length > 0) {
      showToast('error', formatFutureEventsBlockMessage('remove', emp.name, futureEvents), 8000);
      return false;
    }

    const prevEmployees = employees;
    setEmployees(employees.map(e => e.id === id ? { ...e, deleted: true, active: false } : e));

    const employeeForApi = serializeEmployeeForApi(emp, { deleted: true, active: false });

    // Call API to persist
    const result = await apiCall('saveEmployee', {
      employee: employeeForApi
    });

    if (result.success) {
      showToast('success', `${emp.name} removed`);
      return true;
    } else {
      setEmployees(prevEmployees);
      showToast('error', errorMsg(result, 'Failed to remove employee'));
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

    const employeeForApi = serializeEmployeeForApi(emp, { active: true, deleted: false });

    // Call API to persist
    const result = await apiCall('saveEmployee', {
      employee: employeeForApi
    });

    if (result.success) {
      showToast('success', `${emp.name} reactivated`);
      return true;
    } else {
      setEmployees(prevEmployees);
      showToast('error', errorMsg(result, 'Failed to reactivate employee'));
      return false;
    }
  };
  
  // S61 — route by type. Work shifts live in `shifts[k]` (scalar). Meeting/PK
  // entries live in `events[k]` (array; one entry per type). Delete is type-aware
  // and only wipes the matching entry.
  // Functional updates: multiple onSave calls in one tick (modal Save, clear day)
  // must chain on previous state; a plain setEvents(next) would drop all but the last.
  const saveShift = (s, meta = {}) => {
    const quiet = meta.quiet === true;
    const type = s.type || 'work';
    if (type === 'work') {
      setShifts((prevShifts) => applyShiftMutation(prevShifts, events, s).nextShifts);
    } else {
      setEvents((prevEvents) => applyShiftMutation(shifts, prevEvents, s).nextEvents);
    }
    if (!quiet) {
      const label = type === 'meeting' ? 'Meeting'
        : type === 'pk' ? 'PK event'
        : type === 'sick' ? 'Sick day'
        : 'Shift';
      showToast('success', `${label} ${s.deleted ? 'removed' : 'updated'} — click SAVE to keep changes`);
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
      showToast('error', errorMsg(result, 'Failed to cancel request'));
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
      showToast('error', errorMsg(result, 'Failed to submit request'));
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
      showToast('error', errorMsg(result, 'Failed to submit offer'));
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
        if ((matchesOfferId(offer, offerId)) && ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)) {
          return { ...offer, status: 'cancelled', cancelledTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer cancelled');
    } else {
      showToast('error', errorMsg(result, 'Failed to cancel offer'));
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
        if ((matchesOfferId(offer, offerId)) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'awaiting_admin', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer accepted - awaiting admin approval');
    } else {
      showToast('error', errorMsg(result, 'Failed to accept offer'));
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
        if ((matchesOfferId(offer, offerId)) && offer.status === 'awaiting_recipient') {
          return { ...offer, status: 'recipient_rejected', recipientNote: note || '', recipientRespondedTimestamp: new Date().toISOString() };
        }
        return offer;
      }));
      showToast('success', 'Offer declined');
    } else {
      showToast('error', errorMsg(result, 'Failed to decline offer'));
    }
    });
  };

  // Approve a shift offer (admin action) - reassign the shift
  const approveShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (matchesOfferId(o, offerId)) && o.status === 'awaiting_admin');
    if (!offer) return;
    await guardedMutation('Approving offer', async () => {
    const result = await apiCall('approveShiftOffer', {
      requestId: offerId
    });
    
    if (result.success) {
      const offerer = employees.find(e => e.email === (offer.offererEmail || offer.employeeEmail));
      const recipient = employees.find(e => e.email === offer.recipientEmail);
      if (offerer && recipient) {
        setShifts(prev => transferShiftBetweenEmployees(prev, offerer, recipient, offer.shiftDate));
      }
      setShiftOffers(prev => prev.map(o => {
        if (matchesOfferId(o, offerId)) {
          return { ...o, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Offer approved — moved to Settled history');
    } else {
      showToast('error', errorMsg(result, 'Failed to approve offer'));
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
        if ((matchesOfferId(offer, offerId)) && offer.status === 'awaiting_admin') {
          return { ...offer, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return offer;
      }));
      showToast('success', 'Offer rejected — moved to Settled history');
    } else {
      showToast('error', errorMsg(result, 'Failed to reject offer'));
    }
    });
  };

  // Revoke an approved shift offer (admin action) - reverts the shift back to original owner
  const revokeShiftOffer = async (offerId) => {
    const offer = shiftOffers.find(o => (matchesOfferId(o, offerId)) && o.status === 'approved');
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
        setShifts(prev => transferShiftBetweenEmployees(prev, recipient, offerer, offer.shiftDate));
      }
      setShiftOffers(prev => prev.map(o => {
        if (matchesOfferId(o, offerId)) {
          return { ...o, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return o;
      }));
      showToast('success', 'Offer approval revoked');
    } else {
      showToast('error', errorMsg(result, 'Failed to revoke offer'));
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
      showToast('error', errorMsg(result, 'Failed to submit swap request'));
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
        if ((matchesSwapId(swap, swapId)) && ['awaiting_partner', 'awaiting_admin'].includes(swap.status)) {
          return { ...swap, status: 'cancelled' };
        }
        return swap;
      }));
      showToast('success', 'Swap request cancelled');
    } else {
      showToast('error', errorMsg(result, 'Failed to cancel swap'));
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
        if ((matchesSwapId(swap, swapId)) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'awaiting_admin', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap accepted - awaiting admin approval');
    } else {
      showToast('error', errorMsg(result, 'Failed to accept swap'));
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
        if ((matchesSwapId(swap, swapId)) && swap.status === 'awaiting_partner') {
          return { ...swap, status: 'partner_rejected', partnerNote: note || '', partnerRespondedTimestamp: new Date().toISOString() };
        }
        return swap;
      }));
      showToast('success', 'Swap request declined');
    } else {
      showToast('error', errorMsg(result, 'Failed to decline swap'));
    }
    });
  };

  // Approve a swap request (admin action) - swap both shifts
  const approveSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (matchesSwapId(s, swapId)) && s.status === 'awaiting_admin');
    if (!swap) return;
    await guardedMutation('Approving swap', async () => {
    const result = await apiCall('approveSwapRequest', {
      requestId: swapId
    });
    
    if (result.success) {
      const initiator = employees.find(e => e.email === (swap.initiatorEmail || swap.employeeEmail));
      const partner = employees.find(e => e.email === swap.partnerEmail);
      if (initiator && partner) {
        setShifts(prev => swapShiftsBetweenEmployees(prev, initiator, partner, swap.initiatorShiftDate, swap.partnerShiftDate));
      }
      
      setShiftSwaps(prev => prev.map(s => {
        if (matchesSwapId(s, swapId)) {
          return { ...s, status: 'approved', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap approved — moved to Settled history');
    } else {
      showToast('error', errorMsg(result, 'Failed to approve swap'));
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
        if ((matchesSwapId(swap, swapId)) && swap.status === 'awaiting_admin') {
          return { ...swap, status: 'rejected', adminNote: note || '', adminDecidedTimestamp: new Date().toISOString(), adminDecidedBy: currentUser?.email || '' };
        }
        return swap;
      }));
      showToast('success', 'Swap rejected — moved to Settled history');
    } else {
      showToast('error', errorMsg(result, 'Failed to reject swap'));
    }
    });
  };

  // Revoke an approved swap request (admin action) - swap shifts back
  const revokeSwapRequest = async (swapId) => {
    const swap = shiftSwaps.find(s => (matchesSwapId(s, swapId)) && s.status === 'approved');
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
        if (matchesSwapId(s, swapId)) {
          return { ...s, status: 'revoked', revokedTimestamp: new Date().toISOString(), revokedBy: currentUser?.email || '' };
        }
        return s;
      }));
      showToast('success', 'Swap approval revoked');
    } else {
      showToast('error', errorMsg(result, 'Failed to revoke swap'));
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
      showToast('error', errorMsg(result, 'Failed to approve request'));
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
      showToast('error', errorMsg(result, 'Failed to deny request'));
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
      showToast('error', errorMsg(result, 'Failed to revoke request'));
    }
    });
  };
  
  // Count pending requests for badge (all three types that need admin action)
  const pendingTimeOffCount = timeOffRequests.filter(r => r.status === 'pending').length;
  const pendingOffersCount = shiftOffers.filter(o => o.status === 'awaiting_admin').length;
  const pendingSwapsCount = shiftSwaps.filter(s => s.status === 'awaiting_admin').length;
  const pendingRequestCount = pendingTimeOffCount + pendingOffersCount + pendingSwapsCount;
  
  // Grid cell click handler — stable ref keeps EmployeeRow memo effective
  const handleCellClick = useCallback((emp, d, s) => {
    setEditingShift({ employee: emp, date: d, shift: s });
  }, []);

  // Column header click handler — stable ref keeps ColumnHeaderCell memo effective
  const handleColumnHeaderClick = useCallback((date) => setEditingColumnDate(date), []);

  // Edit employee handler — stable ref keeps EmployeeRow memo effective
  const handleEditEmployee = useCallback((emp) => {
    setEditingEmp(emp);
    setEmpFormOpen(true);
  }, []);

  // Open the tab synchronously on click; dynamic import runs after await and
  // would make window.open() non-user-gesture -> popup blocked in Chrome/Safari.
  const handleExportPDF = useCallback(() => {
    const printWindow = window.open('about:blank', '_blank', 'width=1100,height=750');
    if (!printWindow) {
      showToast('error', 'Could not open print window. Allow popups for this site.');
      return;
    }
    try {
      printWindow.opener = null;
    } catch (_) { /* noop */ }
    (async () => {
      try {
        const { generateSchedulePDF } = await import('./pdf/generate');
        generateSchedulePDF(employees, shifts, dates, { startDate, endDate }, currentAnnouncement, timeOffRequests, events, printWindow);
      } catch (e) {
        console.error(e);
        try {
          printWindow.close();
        } catch (_) { /* noop */ }
        showToast('error', e?.message || 'Could not build print view.');
      }
    })();
  }, [employees, shifts, dates, startDate, endDate, currentAnnouncement, timeOffRequests, events, showToast]);

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

  if (isLoadingData) return <LoadingScreen overlay={sweepOverlay} />;

  if (loadError) {
    return (
      <ErrorScreen
        overlay={sweepOverlay}
        message={loadError}
        onRetry={() => loadDataFromBackend(currentUser.email)}
        onLogout={() => { clearAuth(); setCurrentUser(null); setLoadError(null); }}
      />
    );
  }

  // Show employee view if not admin
  if (!currentUser.isAdmin) {
    return (<>{sweepOverlay}<EmployeeView employees={employees} shifts={publishedShifts} events={publishedEvents} dates={dates} periodInfo={{ startDate, endDate }} currentUser={currentUser} onLogout={() => { clearAuth(); setCurrentUser(null); }} timeOffRequests={timeOffRequests} onCancelRequest={cancelTimeOffRequest} onSubmitRequest={submitTimeOffRequest} shiftOffers={shiftOffers} onSubmitOffer={submitShiftOffer} onCancelOffer={cancelShiftOffer} onAcceptOffer={acceptShiftOffer} onRejectOffer={rejectShiftOffer} shiftSwaps={shiftSwaps} onSubmitSwap={submitSwapRequest} onCancelSwap={cancelSwapRequest} onAcceptSwap={acceptSwapRequest} onRejectSwap={rejectSwapRequest} periodIndex={periodIndex} onPeriodChange={setPeriodIndex} isEditMode={isCurrentPeriodEditMode} announcement={currentAnnouncement} /></>);
  }

  const autofillClearModal = (
    <AutofillClearModal
      isOpen={autofillClearOpen}
      onClose={() => setAutofillClearOpen(false)}
      schedulableEmployees={schedulableEmployees}
      weekDates={activeWeek === 1 ? week1 : week2}
      employeeHasShiftsInWeek={employeeHasShiftsInWeek}
      onConfirm={handleAutofillClearConfirm}
    />
  );

  const pkModalEl = (
    <PKModal
      isOpen={pkModalOpen}
      onClose={() => setPkModalOpen(false)}
      onConfirm={handlePKConfirm}
      employees={employees}
      events={events}
      activeWeek={activeWeek}
      week1={week1}
      week2={week2}
    />
  );

  // Logo click returns admin to "home": schedule tab, current pay period, week 1,
  // scrolled to top. Stateful (not a full reload) so unsaved drafts/modals the
  // admin may have in flight don't get wiped.
  const goHome = () => {
    setActiveTab('schedule');
    setMobileAdminTab('schedule');
    setActiveWeek(1);
    setPeriodIndex(CURRENT_PERIOD_INDEX);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            <button type="button" onClick={goHome} aria-label="Home" style={{ textAlign: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <p style={{ color: THEME.text.muted, fontSize: '8px', letterSpacing: '0.2em' }}>OVER THE</p>
              <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '16px', letterSpacing: '0.12em', lineHeight: 1 }}>RAINBOW</p>
            </button>
          </div>

          {/* Row 2: Period nav centered */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <button aria-label="Previous pay period" onClick={() => setPeriodIndex(periodIndex - 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '13px' }}>{formatDate(startDate)} – {formatDate(endDate)}</p>
                {periodIndex === CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.cyan, fontSize: '10px', marginTop: 1 }}>Current Period</p>}
                {periodIndex > CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.purple, fontSize: '10px', marginTop: 1 }}>Future</p>}
                {periodIndex < CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.text.muted, fontSize: '10px', marginTop: 1 }}>Past</p>}
              </div>
              <button aria-label="Next pay period" onClick={() => setPeriodIndex(periodIndex + 1)} className="p-1 rounded" style={{ color: THEME.text.secondary }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 3: Action buttons right-aligned — schedule-context only */}
          {(mobileAdminTab === 'schedule' || mobileAdminTab === 'mine') && (
          <div className="flex items-center justify-end px-3 pb-2 gap-1.5 flex-wrap">
            {allViolations.length > 0 && (
              <button
                onClick={() => setViolationsPanelOpen(true)}
                className="relative flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ backgroundColor: THEME.bg.elevated, color: THEME.status.warning, border: `1px solid ${THEME.status.warning}40` }}
                title={`${allViolations.length} schedule violation${allViolations.length === 1 ? '' : 's'}`}
                aria-label={`${allViolations.length} schedule violation${allViolations.length === 1 ? '' : 's'}`}
              >
                <AlertTriangle size={12} />
                <span className="text-xs font-semibold">{allViolations.length}</span>
              </button>
            )}
            <ScheduleStateButton
              isEditMode={isCurrentPeriodEditMode}
              unsaved={unsaved}
              scheduleSaving={scheduleSaving}
              onSave={saveSchedule}
              onToggleEdit={toggleEditMode}
            />
            {!isCurrentPeriodEditMode && (
              <button
                onClick={() => setEmailOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                style={{
                  background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                  color: '#fff'
                }}
              >
                <Mail size={11} /> Publish
              </button>
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
                  <div className="flex items-center ml-auto">
                    <button
                      onClick={() => setMobileActionSheetOpen(true)}
                      className="px-3 rounded text-xs font-semibold flex items-center gap-1"
                      style={{ minHeight: 32, backgroundColor: THEME.accent.blue, color: 'white' }}
                      aria-label={`Schedule actions for week ${activeWeek}`}
                    >
                      <Zap size={11} />
                      Actions
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
                approvedTimeOffSet={approvedTimeOffSet}
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
              employees={employees}
            />
          ) : mobileAdminTab === 'comms' ? (
            /* Announcements */
            <>
              <MobileAnnouncementPanel
                announcement={currentAnnouncement}
                onAnnouncementChange={setCurrentAnnouncement}
                onSave={saveAnnouncement}
                onClear={clearAnnouncement}
                isEditMode={isCurrentPeriodEditMode}
                isSaving={savingAnnouncement}
              />
              <div className="mt-3 px-4">
                <PKDetailsPanel events={events} dates={dates} employees={employees} />
              </div>
            </>
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
          onExportPDF={() => { setMobileAdminDrawerOpen(false); handleExportPDF(); }}
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
          const priorStreak = computeConsecutiveWorkDayStreak(
            (id, k) => !!shifts[`${id}-${k}`],
            editingShift.employee.id,
            toDateKey(prior),
            (id, k) => (events[`${id}-${k}`] || []).some(e => e.type === 'sick')
          );
          return (
            <ShiftEditorModal
              isOpen
              onClose={() => setEditingShift(null)}
              onSave={saveShift}
              showToast={showToast}
              employee={editingShift.employee}
              date={editingShift.date}
              existingShift={shifts[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`]}
              existingEvents={events[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`] || []}
              totalPeriodHours={getEmpHours(editingShift.employee.id)}
              weekHours={getEmpHours(editingShift.employee.id)}
              availability={editingShift.employee.availability?.[getDayName(editingShift.date)]}
              hasApprovedTimeOff={approvedTimeOffSet.has(`${editingShift.employee.email}-${toDateKey(editingShift.date)}`)}
              priorWorkStreak={priorStreak}
              currentUser={currentUser}
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

        {/* S36 — Unified PK modal (mobile admin) */}
        {pkModalEl}

        {/* Employee Form Modal (mobile admin: reached via MobileStaffPanel) */}
        <EmployeeFormModal
          isOpen={empFormOpen}
          onClose={() => { setEmpFormOpen(false); setEditingEmp(null); }}
          onSave={saveEmployee}
          onDelete={deleteEmployee}
          employee={editingEmp}
          currentUser={currentUser}
          showToast={showToast}
          employees={employees}
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

        {autofillClearModal}

        {/* Mobile schedule Actions sheet (single-level: Auto-Fill/Clear + PK) */}
        <MobileScheduleActionSheet
          isOpen={mobileActionSheetOpen}
          onClose={() => setMobileActionSheetOpen(false)}
          onOpenAutofillClear={() => setAutofillClearOpen(true)}
          onOpenPKModal={() => setPkModalOpen(true)}
        />

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
            <button type="button" onClick={goHome} aria-label="Home" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}><Logo /></button>
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <div className="flex items-center gap-2">
              <button onClick={() => setPeriodIndex(periodIndex - 1)} aria-label="Previous pay period" className="p-2 rounded-lg hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronLeft size={14} /></button>
              <div className="text-center min-w-[100px]"><p className="font-medium" style={{ color: THEME.text.primary, fontSize: TYPE.body }}>{formatDate(startDate)} – {formatDate(endDate)}</p></div>
              <button onClick={() => setPeriodIndex(periodIndex + 1)} aria-label="Next pay period" className="p-2 rounded-lg hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.secondary }}><ChevronRight size={14} /></button>
            </div>
            
            {/* Save / Go Live / Edit - Three-state button */}
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <ScheduleStateButton
              isEditMode={isCurrentPeriodEditMode}
              unsaved={unsaved}
              scheduleSaving={scheduleSaving}
              onSave={saveSchedule}
              onToggleEdit={toggleEditMode}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {allViolations.length > 0 && currentUser?.isAdmin && (
              <button
                onClick={() => setViolationsPanelOpen(true)}
                className="relative flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ backgroundColor: THEME.bg.elevated, color: THEME.status.warning, border: `1px solid ${THEME.status.warning}40` }}
                title={`${allViolations.length} schedule violation${allViolations.length === 1 ? '' : 's'}`}
                aria-label={`${allViolations.length} schedule violation${allViolations.length === 1 ? '' : 's'}`}
              >
                <AlertTriangle size={14} />
                <span className="text-xs font-semibold">{allViolations.length}</span>
              </button>
            )}
            {published && !unsaved && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}><Check size={10} />Published</span>}

            {/* Primary operations: Export + Publish */}
            <div className="relative">
              <TooltipButton tooltip={currentAnnouncement?.message ? "Export PDF (includes announcement)" : "Export PDF"} onClick={handleExportPDF}><FileText size={12} /></TooltipButton>
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

            {/* Account / admin menu — collapses Add Employee, Employees, Settings, Sign Out */}
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
                    <span className="flex items-center gap-2"><Users size={14} style={{ color: THEME.text.secondary }} />Employees</span>
                    {inactiveCount > 0 && <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '10px' }}>{inactiveCount} inactive</span>}
                  </button>
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); setSettingsOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.text.primary }}>
                    <Settings size={14} style={{ color: THEME.text.secondary }} />
                    Admin Settings
                  </button>
                  <button role="menuitem" onClick={() => { setAdminMenuOpen(false); setMobileAdminChangePasswordOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-black/5" style={{ color: THEME.text.primary }}>
                    <Key size={14} style={{ color: THEME.text.secondary }} />
                    Change Password
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
              {isCurrentPeriodEditMode && schedulableEmployees.length > 0 && (
                <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2 flex-wrap" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderLeft: `3px solid ${THEME.accent.blue}`, boxShadow: THEME.shadow.cardSm }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: THEME.accent.blue }} />
                    <span className="text-xs font-medium" style={{ color: THEME.accent.blue }}>Schedule ({schedulableEmployees.length} staff)</span>
                  </div>
                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />

                  {/* Unified Auto-Fill / Auto-Clear button — opens AutofillClearModal */}
                  <button
                    type="button"
                    onClick={() => setAutofillClearOpen(true)}
                    className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 hover:opacity-80"
                    style={{
                      backgroundColor: THEME.bg.elevated,
                      color: THEME.accent.blue,
                      border: `1px solid ${THEME.border.default}`,
                    }}
                    aria-label={`Auto-Fill / Auto-Clear week ${activeWeek}`}
                  >
                    <Zap size={12} /> Auto-Fill / <Trash2 size={12} /> Auto-Clear
                  </button>

                  <div className="w-px h-4" style={{ backgroundColor: THEME.border.default }} />

                  {/* Single PK entry — always opens the modal; Saturday quick-pick lives inside. */}
                  <button
                    type="button"
                    onClick={() => setPkModalOpen(true)}
                    className="px-2 py-1 rounded text-xs font-medium hover:opacity-80"
                    style={{ backgroundColor: THEME.event.pkBg, color: THEME.event.pkText, border: `1px solid ${THEME.event.pkBorder}` }}
                    aria-label={`Schedule PK`}
                  >
                    📚 Schedule PK
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

              {/* PK details for this period — sibling of announcement */}
              <div className="mb-2">
                <PKDetailsPanel events={events} dates={dates} employees={employees} />
              </div>

              {/* Schedule grid */}
              <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderTop: 'none', zIndex: 1, boxShadow: THEME.shadow.card }}>
                <div className="grid gap-px" style={{ gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, backgroundColor: THEME.border.subtle }}>
                  <div className="p-1.5" style={{ backgroundColor: THEME.bg.tertiary }}><span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>Employee</span></div>
                  {currentDates.map((date) => {
                    const sh = getStoreHoursForDate(date);
                    const dateStr = toDateKey(date);
                    const isPast = dateStr < todayStr;
                    return (
                      <ColumnHeaderCell
                        key={dateStr}
                        date={date}
                        isToday={dateStr === todayStr}
                        isHoliday={isStatHoliday(date)}
                        storeOpen={sh.open}
                        storeClose={sh.close}
                        scheduled={scheduledByDate[dateStr] || 0}
                        target={getStaffingTarget(date)}
                        hasOverride={!!storeHoursOverrides[dateStr] || staffingTargetOverrides[dateStr] !== undefined}
                        canEdit={isCurrentPeriodEditMode && !isPast}
                        isPast={isPast}
                        onClick={handleColumnHeaderClick}
                      />
                    );
                  })}
                </div>
                <div>{schedulableEmployees.map((e, i) => {
                  const showDivider = i > 0 && employeeBucket(e) !== employeeBucket(schedulableEmployees[i-1]);
                  return (
                    <React.Fragment key={e.id}>
                      {showDivider && <div style={{ height: 1, margin: '3px 8px', backgroundColor: THEME.border.default }} />}
                      <EmployeeRow employee={e} dates={currentDates} shifts={shifts} events={events} onCellClick={handleCellClick} getEmployeeHours={getEmpHours} onEdit={handleEditEmployee} onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip} approvedTimeOffSet={approvedTimeOffSet} isLocked={!isCurrentPeriodEditMode} isAdmin={!!currentUser?.isAdmin} />
                    </React.Fragment>
                  );
                })}</div>
                
                {/* Former Staff (deleted employees with shifts) removed from the
                    main grid per Sarvi (2026-04-18). Records + shift data are
                    preserved in the backend; restore via Employees if needed. */}
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
      
      <EmployeeFormModal isOpen={empFormOpen} onClose={() => { setEmpFormOpen(false); setEditingEmp(null); }} onSave={saveEmployee} onDelete={deleteEmployee} employee={editingEmp} currentUser={currentUser} showToast={showToast} employees={employees} />
      {editingShift && (() => {
        const prior = new Date(editingShift.date); prior.setDate(prior.getDate() - 1);
        const priorStreak = computeConsecutiveWorkDayStreak(
          (id, k) => !!shifts[`${id}-${k}`],
          editingShift.employee.id,
          toDateKey(prior),
          (id, k) => (events[`${id}-${k}`] || []).some(e => e.type === 'sick')
        );
        return <ShiftEditorModal isOpen onClose={() => setEditingShift(null)} onSave={saveShift} showToast={showToast} employee={editingShift.employee} date={editingShift.date} existingShift={shifts[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`]} existingEvents={events[`${editingShift.employee.id}-${toDateKey(editingShift.date)}`] || []} totalPeriodHours={getEmpHours(editingShift.employee.id)} weekHours={getEmpHours(editingShift.employee.id)} availability={editingShift.employee.availability?.[getDayName(editingShift.date)]} hasApprovedTimeOff={approvedTimeOffSet.has(`${editingShift.employee.email}-${toDateKey(editingShift.date)}`)} priorWorkStreak={priorStreak} currentUser={currentUser} />;
      })()}
      {violationsPanelOpen && (
        <AdaptiveModal isOpen onClose={() => setViolationsPanelOpen(false)} title={`${allViolations.length} schedule violation${allViolations.length === 1 ? '' : 's'}`}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {!isCurrentPeriodEditMode && (
              <p className="text-xs px-2 py-1.5 rounded" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>
                Edit Mode is off for this period. Toggle Edit Mode on to fix violations.
              </p>
            )}
            {allViolations.map(({ emp, dateStr, violations }) => {
              const rowStyle = { backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.subtle}` };
              const body = (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>{emp.name}</span>
                    <span className="text-[10px]" style={{ color: THEME.text.muted }}>{dateStr}</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5" style={{ color: THEME.text.secondary }}>
                    {violations.map(v => <li key={v.rule}>• {v.detail}</li>)}
                  </ul>
                </>
              );
              return isCurrentPeriodEditMode ? (
                <button
                  key={`${emp.id}-${dateStr}`}
                  onClick={() => {
                    setViolationsPanelOpen(false);
                    setEditingShift({ employee: emp, date: new Date(dateStr + 'T12:00:00') });
                  }}
                  className="w-full text-left p-2 rounded-lg hover:opacity-80"
                  style={rowStyle}
                >
                  {body}
                </button>
              ) : (
                <div key={`${emp.id}-${dateStr}`} className="w-full text-left p-2 rounded-lg" style={{ ...rowStyle, opacity: 0.65, cursor: 'not-allowed' }}>
                  {body}
                </div>
              );
            })}
          </div>
        </AdaptiveModal>
      )}
      <EmailModal isOpen={emailOpen} onClose={() => setEmailOpen(false)} employees={employees} shifts={shifts} events={events} dates={dates} periodInfo={{ startDate, endDate }} announcement={currentAnnouncement} onComplete={() => { setPublished(true); setUnsaved(false); }} />
      <EmployeesPanel isOpen={inactivePanelOpen} onClose={() => setInactivePanelOpen(false)} employees={employees} onEdit={(emp) => { setInactivePanelOpen(false); setEditingEmp(emp); setEmpFormOpen(true); }} onReactivate={reactivateEmployee} onDelete={deleteEmployee} />
      <AdminSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} currentUser={currentUser} staffingTargets={staffingTargets} onStaffingTargetsChange={setStaffingTargets} showToast={showToast} />
      <ChangePasswordModal isOpen={mobileAdminChangePasswordOpen} onClose={() => setMobileAdminChangePasswordOpen(false)} currentUser={currentUser} />
      {pkModalEl}
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
      
      {autofillClearModal}

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
        <div
          className="fixed p-2.5 rounded-lg shadow-2xl"
          style={{ top: tooltipData.pos.top, left: tooltipData.pos.left, width: 240, backgroundColor: THEME.tooltip.bg, border: `1px solid ${THEME.tooltip.border}`, boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)', zIndex: 99999 }}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        >
          <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: `1px solid ${THEME.border.subtle}` }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: tooltipData.isDeleted ? THEME.bg.elevated : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: tooltipData.isDeleted ? THEME.text.muted : 'white' }}>{tooltipData.employee.name.charAt(0)}</div>
            <p className="font-semibold text-xs flex items-center gap-1 flex-1" style={{ color: THEME.text.primary }}>
              {tooltipData.employee.name}
              {hasTitle(tooltipData.employee) && (
                <Shield size={10} style={{ color: tooltipData.employee.adminTier === 'admin2' ? THEME.accent.blue : THEME.accent.purple }} />
              )}
              {tooltipData.isDeleted && <span style={{ color: THEME.text.muted }}>(Former)</span>}
            </p>
          </div>
          <a
            href={`mailto:${tooltipData.employee.email}`}
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline"
            style={{
              color: THEME.text.secondary,
              fontSize: tooltipData.employee.email.length > 32 ? `${Math.max(9, 12 - Math.ceil((tooltipData.employee.email.length - 32) / 3))}px` : '12px',
              whiteSpace: 'nowrap'
            }}
          >
            <Mail size={10} className="flex-shrink-0" />
            {tooltipData.employee.email}
          </a>
          {hasTitle(tooltipData.employee) && tooltipData.employee.title && (
            <div className="flex items-center gap-1 mt-1" style={{ color: THEME.text.secondary, fontSize: '11px' }}>
              <span style={{ color: THEME.text.muted }}>Title:</span>
              <span style={{ color: THEME.text.primary, fontWeight: 600 }}>{tooltipData.employee.title}</span>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
