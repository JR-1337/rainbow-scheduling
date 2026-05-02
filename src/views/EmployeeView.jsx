import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bell, Calendar, Eye, Key, Loader, LogOut, Shield, Star, User, ArrowRight, ArrowRightLeft } from 'lucide-react';
import {
  THEME, ROLES, ROLES_BY_ID,
  getStoreHoursForDate,
} from '../App';
import { GradientBackground, AnimatedNumber, haptic, Logo, TaskStarTooltip } from '../components/uiKit';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { CURRENT_PERIOD_INDEX } from '../utils/payPeriod';
import { toDateKey, getWeekNumber, formatDate, formatTimeDisplay, formatTimeShort, getDayName } from '../utils/date';
import { isStatHoliday } from '../utils/storeHours';
import { sortBySarviAdminsFTPT, employeeBucket } from '../utils/employeeSort';
import { filterSchedulableEmployees } from '../utils/employees';
import { useIsMobile, MobileMenuDrawer, MobileAnnouncementPopup, MobileScheduleGrid, MobileMySchedule, MobileBottomNav, MobileBottomSheet, MobileAlertsSheet, computeAlertItems } from '../MobileEmployeeView';
import { EVENT_TYPES, DESKTOP_SCHEDULE_GRID_TEMPLATE } from '../constants';
import { MyShiftOffersPanel } from '../panels/MyShiftOffersPanel';
import { MySwapsPanel } from '../panels/MySwapsPanel';
import { MyRequestsPanel } from '../panels/MyRequestsPanel';
import { IncomingOffersPanel } from '../panels/IncomingOffersPanel';
import { ReceivedOffersHistoryPanel } from '../panels/ReceivedOffersHistoryPanel';
import { IncomingSwapsPanel } from '../panels/IncomingSwapsPanel';
import { ReceivedSwapsHistoryPanel } from '../panels/ReceivedSwapsHistoryPanel';
import { UnifiedRequestHistory } from '../panels/UnifiedRequestHistory';
import { RequestTimeOffModal } from '../modals/RequestTimeOffModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { RequestDaysOffModal } from '../modals/RequestDaysOffModal';
import { OfferShiftModal } from '../modals/OfferShiftModal';
import { SwapShiftModal } from '../modals/SwapShiftModal';
import { hasTitle, splitNameForSchedule } from '../utils/employeeRender';
import { EventGlyphPill } from '../components/EventGlyphPill';
import { PKDetailsPanel } from '../components/PKDetailsPanel';
import SickStripeOverlay from '../components/SickStripeOverlay';
import { computeCellStyles } from '../utils/scheduleCellStyles';
import EventOnlyCell from '../components/EventOnlyCell';

const EmployeeScheduleCell = React.memo(({ shift, events = [], date, loggedInEmpId, storeHours, employee = null, isTimeOff = false, isUnavailable = false }) => {
  const [showTask, setShowTask] = useState(false);
  const starRef = useRef(null);
  const role = shift ? ROLES_BY_ID[shift.role] : null;
  const isHoliday = isStatHoliday(date);
  const isOwnShift = shift?.employeeId === loggedInEmpId;
  const showTaskStar = shift?.task && isOwnShift;
  const isTitledShift = !!shift && employee && hasTitle(employee);
  // Defensive: drop events with unknown type so malformed Sheet rows don't crash.
  const visibleEvents = (events || []).filter(ev => EVENT_TYPES[ev.type]);
  const hasEvents = visibleEvents.length > 0;
  const eventOnly = !shift && hasEvents;
  const firstEvent = hasEvents ? visibleEvents[0] : null;
  const firstEventType = firstEvent && EVENT_TYPES[firstEvent.type];
  // Sick overrides the day: cell reads as "not here", work row is struck through
  // but still visible. Parity with ScheduleCell + MobileAdminScheduleGrid.
  const sickEvent = visibleEvents.find(ev => ev.type === 'sick');
  const hasSick = !!sickEvent;

  return (
    <>
      <div className="h-[4.5rem] rounded-lg relative overflow-hidden"
        style={computeCellStyles({ hasSick, isTimeOff, isUnavailable, isTitled: isTitledShift, hasShift: !!shift, hasEvents, role, eventOnly, firstEventType, useOverlayForTimeOff: false })}>

        {isHoliday && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: THEME.status.warning }} />}

        {hasSick && <SickStripeOverlay />}

        {hasSick && !shift ? (
          <div className="p-1.5 h-full flex flex-col items-center justify-center">
            <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>Sick</span>
            {sickEvent?.note && (
              <span className="italic truncate block mt-0.5" style={{ color: THEME.text.muted, fontSize: '9px' }} title={sickEvent?.note}>
                {sickEvent?.note}
              </span>
            )}
          </div>
        ) : isTimeOff && !shift && !hasEvents ? (
          <div className="p-1.5 h-full flex flex-col items-center justify-center">
            <span className="text-xs font-medium" style={{ color: THEME.text.muted }}>Time Off</span>
          </div>
        ) : isUnavailable && !shift && !hasEvents ? (
          <div className="p-1.5 h-full flex flex-col items-center justify-center">
            <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '9px' }}>Unavailable</span>
          </div>
        ) : shift ? (
          <div className="p-1.5 h-full flex flex-col justify-between min-h-0 min-w-0">
            {/* Row 1: role label + events pill */}
            <div className="flex items-start justify-between gap-1 min-w-0">
              {!isTitledShift ? (
                <span className="text-xs font-semibold truncate min-w-0" style={{ color: hasSick ? THEME.text.muted : role?.color, textDecoration: hasSick ? 'line-through' : 'none' }}>{role?.name}</span>
              ) : <span className="min-w-0 flex-1" />}
              {hasEvents && !hasSick && <EventGlyphPill events={visibleEvents} size="md" />}
            </div>
            {hasSick && sickEvent?.note ? (
              <span className="text-xs italic truncate block" style={{ color: THEME.text.muted }} title={sickEvent?.note}>
                {sickEvent?.note}
              </span>
            ) : (
              /* Row 2: time + (task star if own shift) */
              <div className="flex w-full min-w-0 items-center justify-between">
                <span className="text-xs min-w-0 truncate" style={{ color: hasSick ? THEME.text.muted : THEME.text.secondary, textDecoration: hasSick ? 'line-through' : 'none' }}>
                  {formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}
                </span>
                {showTaskStar && (
                  <span ref={starRef} className="shrink-0 cursor-pointer pl-1" onMouseEnter={() => setShowTask(true)} onMouseLeave={() => setShowTask(false)}>
                    <Star size={10} fill={THEME.task} color={THEME.task} />
                  </span>
                )}
              </div>
            )}
          </div>
        ) : eventOnly ? (
          <EventOnlyCell events={visibleEvents} firstEventType={firstEventType} firstEvent={firstEvent} size="md" />
        ) : null}
      </div>
      {showTaskStar && <TaskStarTooltip task={shift?.task} show={showTask} triggerRef={starRef} />}
    </>
  );
});

const EmployeeViewRow = React.memo(({ employee, dates, shifts, events = {}, loggedInEmpId, approvedTimeOffSet }) => {
  const isMe = employee.id === loggedInEmpId;
  const { first: nameFirst, rest: nameRest } = splitNameForSchedule(employee.name);
  const titledRow = hasTitle(employee);
  const nameCellBg = isMe ? THEME.accent.purple + '15' : THEME.bg.secondary;
  const dayGutterBg = isMe ? THEME.accent.purple + '10' : THEME.bg.secondary;
  
  const rowStrip = 'p-0.5 h-[calc(4.5rem+0.25rem)] max-h-[calc(4.5rem+0.25rem)] min-h-0 overflow-hidden box-border';
  return (
    <div className="grid gap-px schedule-row" style={{ gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, backgroundColor: THEME.border.subtle }}>
      <div className={rowStrip} style={{ backgroundColor: nameCellBg }} title={employee.name}>
        <div className="flex h-full min-h-0 w-full items-center gap-1.5 overflow-hidden">
          <div className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: isMe ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated, color: isMe ? 'white' : THEME.text.muted }}>{employee.name.split(' ').map(n => n[0]).join('')}</div>
          <div className="min-h-0 min-w-0 flex-1 flex flex-col justify-center gap-0.5 overflow-hidden">
            {titledRow && (employee.title || '').trim() ? (
              <p className="truncate text-[9px] uppercase tracking-wide leading-none" style={{ color: THEME.text.muted }} title={employee.title}>{employee.title}</p>
            ) : null}
            <p className="flex min-w-0 items-center gap-1 text-xs font-medium leading-tight" style={{ color: isMe ? THEME.accent.purple : THEME.text.primary }}>
              <span className="min-w-0 truncate">{nameFirst}</span>
              {isMe && <span className="shrink-0" style={{ color: THEME.accent.cyan, fontSize: '9px' }}>(You)</span>}
            </p>
            {nameRest ? (
              <p className="truncate text-[10px] leading-tight" style={{ color: THEME.text.muted }}>{nameRest}</p>
            ) : null}
          </div>
        </div>
      </div>
      
      {dates.map((date, i) => {
        const storeHrs = getStoreHoursForDate(date);
        const dateStr = toDateKey(date);
        const shift = shifts[`${employee.id}-${dateStr}`];
        const cellEvents = events[`${employee.id}-${dateStr}`] || [];
        const isTimeOff = approvedTimeOffSet?.has(`${employee.email}-${dateStr}`) || false;
        const dayName = getDayName(date);
        const avail = employee.availability?.[dayName];
        const isUnavailable = avail && !avail.available;
        return (
          <div key={dateStr} className={rowStrip} style={{ backgroundColor: dayGutterBg }}>
            <EmployeeScheduleCell shift={shift ? { ...shift, employeeId: employee.id } : null} events={cellEvents} date={date} loggedInEmpId={loggedInEmpId} storeHours={storeHrs} employee={employee} isTimeOff={isTimeOff} isUnavailable={isUnavailable} />
          </div>
        );
      })}
    </div>
  );
});

const EmployeeView = ({ employees, shifts, events = {}, dates, periodInfo, currentUser, onLogout, timeOffRequests, onCancelRequest, onSubmitRequest, shiftOffers, onSubmitOffer, onCancelOffer, onAcceptOffer, onRejectOffer, shiftSwaps, onSubmitSwap, onCancelSwap, onAcceptSwap, onRejectSwap, periodIndex = 0, onPeriodChange, isEditMode = false, announcement }) => {
  const [activeWeek, setActiveWeek] = useState(1);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [daysOffModalOpen, setDaysOffModalOpen] = useState(false);
  const [offerShiftModalOpen, setOfferShiftModalOpen] = useState(false);
  const [swapShiftModalOpen, setSwapShiftModalOpen] = useState(false);
  
  // Mobile-specific state
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAnnouncementOpen, setMobileAnnouncementOpen] = useState(false);
  const [mobileAlertsOpen, setMobileAlertsOpen] = useState(false);
  // S41.4: track when the user last opened the alerts sheet so we can badge new items
  const ALERTS_SEEN_KEY = `otr-alerts-last-seen-${currentUser?.email || 'anon'}`;
  const [alertsLastSeenAt, setAlertsLastSeenAt] = useState(() => {
    try { return Number(localStorage.getItem(ALERTS_SEEN_KEY) || 0); } catch { return 0; }
  });
  const markAlertsSeen = useCallback(() => {
    const now = Date.now();
    setAlertsLastSeenAt(now);
    try { localStorage.setItem(ALERTS_SEEN_KEY, String(now)); } catch {}
  }, [ALERTS_SEEN_KEY]);
  const [mobileActiveTab, setMobileActiveTab] = useState('week1'); // 'week1' | 'week2' | 'my-schedule'
  const [mobileShiftDetail, setMobileShiftDetail] = useState(null); // Phase 10: shift detail bottom sheet
  
  // Change password modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Track which resolved requests the user has seen (to show notifications)
  // Initialize with ALL currently resolved items so only NEW resolutions during session show notifications
  const [seenRequestIds, setSeenRequestIds] = useState(() => {
    const initialSeen = new Set();
    
    // Mark all currently resolved time-off requests as seen
    timeOffRequests
      .filter(r => r.email === currentUser.email && ['approved', 'denied', 'revoked'].includes(r.status))
      .forEach(r => initialSeen.add(r.requestId));
    
    // Mark all currently resolved offers (as offerer) as seen
    shiftOffers
      .filter(o => o.offererEmail === currentUser.email && ['approved', 'rejected'].includes(o.status))
      .forEach(o => initialSeen.add(o.offerId));
    
    // Mark all currently resolved offers (as recipient) as seen
    shiftOffers
      .filter(o => o.recipientEmail === currentUser.email && ['approved', 'rejected'].includes(o.status))
      .forEach(o => initialSeen.add(`recv-${o.offerId}`));
    
    // Mark all currently resolved swaps (as initiator) as seen
    shiftSwaps
      .filter(s => s.initiatorEmail === currentUser.email && ['approved', 'rejected'].includes(s.status))
      .forEach(s => initialSeen.add(s.swapId));
    
    // Mark all currently resolved swaps (as partner) as seen  
    shiftSwaps
      .filter(s => s.partnerEmail === currentUser.email && ['approved', 'rejected'].includes(s.status))
      .forEach(s => initialSeen.add(`recv-${s.swapId}`));
    
    return initialSeen;
  });
  
  // Helper to mark requests as seen
  const markAsSeen = (ids) => {
    if (ids.length === 0) return;
    setSeenRequestIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => newSet.add(id));
      return newSet;
    });
  };
  
  // Calculate unseen resolved requests for notifications
  // Only items resolved AFTER page load will show as unseen (notifications)
  const myTimeOffRequests = useMemo(
    () => timeOffRequests.filter(r => r.email === currentUser.email),
    [timeOffRequests, currentUser.email]
  );
  const unseenTimeOffIds = useMemo(
    () => myTimeOffRequests
      .filter(r => ['approved', 'denied', 'revoked'].includes(r.status) && !seenRequestIds.has(r.requestId))
      .map(r => r.requestId),
    [myTimeOffRequests, seenRequestIds]
  );

  // Shift Offers (as offerer): approved/rejected by admin
  const myOffers = useMemo(
    () => shiftOffers.filter(o => o.offererEmail === currentUser.email),
    [shiftOffers, currentUser.email]
  );
  const unseenOfferIds = useMemo(
    () => myOffers
      .filter(o => ['approved', 'rejected'].includes(o.status) && !seenRequestIds.has(o.offerId))
      .map(o => o.offerId),
    [myOffers, seenRequestIds]
  );

  // Shift Offers (as recipient): approved/rejected by admin on offers I accepted
  const offersIAccepted = useMemo(
    () => shiftOffers.filter(o => o.recipientEmail === currentUser.email && ['approved', 'rejected'].includes(o.status)),
    [shiftOffers, currentUser.email]
  );
  const unseenReceivedOfferIds = useMemo(
    () => offersIAccepted
      .filter(o => !seenRequestIds.has(`recv-${o.offerId}`))
      .map(o => `recv-${o.offerId}`),
    [offersIAccepted, seenRequestIds]
  );

  // Shift Swaps (as initiator): approved/rejected by admin
  const mySwaps = useMemo(
    () => shiftSwaps.filter(s => s.initiatorEmail === currentUser.email),
    [shiftSwaps, currentUser.email]
  );
  const unseenSwapIds = useMemo(
    () => mySwaps
      .filter(s => ['approved', 'rejected'].includes(s.status) && !seenRequestIds.has(s.swapId))
      .map(s => s.swapId),
    [mySwaps, seenRequestIds]
  );

  // Shift Swaps (as partner): approved/rejected by admin on swaps I accepted
  const swapsIAccepted = useMemo(
    () => shiftSwaps.filter(s => s.partnerEmail === currentUser.email && ['approved', 'rejected'].includes(s.status)),
    [shiftSwaps, currentUser.email]
  );
  const unseenReceivedSwapIds = useMemo(
    () => swapsIAccepted
      .filter(s => !seenRequestIds.has(`recv-${s.swapId}`))
      .map(s => `recv-${s.swapId}`),
    [swapsIAccepted, seenRequestIds]
  );
  
  const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]), weekNum2 = getWeekNumber(week2[0]);
  const currentDates = activeWeek === 1 ? week1 : week2;
  
  // Schedulable employees (exclude owner, exclude admins unless showOnSchedule).
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const schedulableEmployees = useMemo(() => sortBySarviAdminsFTPT(filterSchedulableEmployees(employees)), [employees]);
  
  // Admin contacts for employee-facing display: Sarvi only (other admins hidden per JR)
  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted && e.name?.toLowerCase() === 'sarvi');
  
  // Perf: memoize date-key arrays so inner loops are O(N) strings, not O(N) ISO allocations
  const currentDateStrs = useMemo(() => currentDates.map(toDateKey), [currentDates]);
  const allDateStrs = useMemo(() => dates.map(toDateKey), [dates]);
  const todayStr = useMemo(() => toDateKey(new Date()), []);

  // Perf: O(1) approved-time-off lookup keyed by `${email}-${dateStr}`. Replaces
  // a per-cell .some() scan over timeOffRequests inside EmployeeViewRow.
  const approvedTimeOffSet = useMemo(() => {
    const set = new Set();
    for (const req of timeOffRequests) {
      if (req.status !== 'approved' || !req.email || !req.datesRequested) continue;
      for (const d of req.datesRequested.split(',')) set.add(`${req.email}-${d}`);
    }
    return set;
  }, [timeOffRequests]);

  // Employees never see hours — stub returns 0 for the MobileScheduleGrid name column.
  const getEmpHours = useCallback(() => 0, []);
  const getEmpHoursWeek2 = useCallback(() => 0, []);

  const myShiftsCount = allDateStrs.reduce((n, ds) => shifts[`${currentUser.id}-${ds}`] ? n + 1 : n, 0);
  
  const handleSelectRequestType = (type) => {
    setRequestModalOpen(false);
    if (type === 'days-off') {
      setDaysOffModalOpen(true);
    } else if (type === 'shift-offer') {
      setOfferShiftModalOpen(true);
    } else if (type === 'shift-swap') {
      setSwapShiftModalOpen(true);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    const hasAnnouncement = !isEditMode && announcement?.message;
    const mobileWeek1 = dates.slice(0, 7), mobileWeek2 = dates.slice(7, 14);
    const mobileWeekNum1 = getWeekNumber(mobileWeek1[0]), mobileWeekNum2 = getWeekNumber(mobileWeek2[0]);
    
    // Total notification count for hamburger badge
    const totalNotifications = unseenTimeOffIds.length + unseenOfferIds.length + unseenReceivedOfferIds.length + unseenSwapIds.length + unseenReceivedSwapIds.length;

    // S41.4: alerts-tab badge — true if announcement present, OR any alert item
    // arrived after the user last opened the alerts sheet.
    const alertItemsForBadge = computeAlertItems(currentUser, timeOffRequests, shiftOffers, shiftSwaps);
    const hasUnseenAlerts = alertItemsForBadge.some(item => new Date(item.t).getTime() > alertsLastSeenAt);
    const alertsBadge = hasAnnouncement || hasUnseenAlerts;
    
    return (
      <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
        <GradientBackground />
        
        {/* Mobile Header - Sticky */}
        <header className="sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: 'none', zIndex: 100 }}>
          {/* Row 1: Centered RAINBOW logo — tap to return to current period. */}
          <div className="flex items-center justify-center px-3 pt-3 pb-2" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
            <button type="button"
              onClick={() => { onPeriodChange(CURRENT_PERIOD_INDEX); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              aria-label="Home"
              style={{ textAlign: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <p style={{ color: THEME.text.muted, fontSize: '8px', letterSpacing: '0.2em' }}>OVER THE</p>
              <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '16px', letterSpacing: '0.12em', lineHeight: 1 }}>RAINBOW</p>
            </button>
          </div>

          {/* Row 2: Period nav centered, bigger */}
          <div className="flex items-center justify-center px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous period"
                onClick={() => onPeriodChange && onPeriodChange(periodIndex - 1)}
                className="p-1 rounded"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '13px' }}>
                  {formatDate(periodInfo.startDate)} – {formatDate(periodInfo.endDate)}
                </p>
                {periodIndex === CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.cyan, fontSize: '10px', marginTop: 1 }}>Current Period</p>}
                {periodIndex > CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.accent.purple, fontSize: '10px', marginTop: 1 }}>Future</p>}
                {periodIndex < CURRENT_PERIOD_INDEX && <p className="font-medium" style={{ color: THEME.text.muted, fontSize: '10px', marginTop: 1 }}>Past</p>}
              </div>
              <button
                type="button"
                aria-label="Next period"
                onClick={() => onPeriodChange && onPeriodChange(periodIndex + 1)}
                className="p-1 rounded"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 3: Status banner */}
          <div className="px-3 pb-2">
            {isEditMode ? (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
                <Loader size={12} className="animate-pulse" style={{ color: THEME.status.warning }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.warning }}>Schedule pending — not yet published</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.success + '15', border: `1px solid ${THEME.status.success}30` }}>
                <Eye size={12} style={{ color: THEME.status.success }} />
                <span className="text-xs font-medium" style={{ color: THEME.status.success }}>Schedule is LIVE</span>
              </div>
            )}
          </div>

          {/* Row 4: Raised Filing Tabs */}
          <div className="flex items-end px-2 gap-1" style={{ marginBottom: -1 }}>
            {[
              { id: 'week1', label: `Wk ${mobileWeekNum1}`, color: THEME.accent.cyan, icon: null },
              { id: 'week2', label: `Wk ${mobileWeekNum2}`, color: THEME.accent.cyan, icon: null },
              { id: 'my-schedule', label: 'Mine', color: THEME.accent.purple, icon: <User size={10} /> }
            ].map(tab => {
              const isActive = mobileActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobileActiveTab(tab.id)}
                  className="px-4 py-2 text-xs relative flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: isActive ? THEME.bg.secondary : THEME.bg.tertiary,
                    color: isActive ? tab.color : THEME.text.muted,
                    borderRadius: '8px 8px 0 0',
                    borderTop: `2px solid ${isActive ? tab.color : THEME.border.subtle}`,
                    borderLeft: `1px solid ${isActive ? THEME.border.default : THEME.border.subtle}`,
                    borderRight: `1px solid ${isActive ? THEME.border.default : THEME.border.subtle}`,
                    borderBottom: isActive ? 'none' : `1px solid ${THEME.border.default}`,
                    zIndex: isActive ? 10 : 1,
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: isActive ? `0 -2px 8px ${tab.color}15` : 'none',
                    fontSize: isActive ? '12px' : '11px'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content */}
        <main className="p-2 pb-20">

          {/* Week 1 / Week 2 Grid */}
          {(mobileActiveTab === 'week1' || mobileActiveTab === 'week2') && (
            <MobileScheduleGrid
              employees={schedulableEmployees}
              shifts={shifts}
              events={events}
              dates={mobileActiveTab === 'week1' ? mobileWeek1 : mobileWeek2}
              loggedInUser={currentUser}
              getEmployeeHours={mobileActiveTab === 'week1' ? getEmpHours : getEmpHoursWeek2}
              approvedTimeOffSet={approvedTimeOffSet}
              onShiftClick={(info) => { haptic(); setMobileShiftDetail(info); }}
            />
          )}
          
          {/* My Schedule Tab */}
          {mobileActiveTab === 'my-schedule' && (
            <MobileMySchedule
              currentUser={currentUser}
              shifts={shifts}
              events={events}
              dates={dates}
              timeOffRequests={timeOffRequests}
              employees={employees}
            />
          )}
          
          {/* Role Legend - compact for mobile */}
          {(mobileActiveTab === 'week1' || mobileActiveTab === 'week2') && (
            <div className="mt-2 p-2 rounded-lg flex items-center gap-1.5 flex-wrap" style={{ backgroundColor: THEME.bg.secondary }}>
              {ROLES.filter(r => r.id !== 'none').map(r => (
                <div key={r.id} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: r.color }} />
                  <span style={{ color: THEME.text.secondary, fontSize: '9px' }}>{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </main>
        
        {/* Mobile Hamburger Drawer */}
        <MobileMenuDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
          onLogout={onLogout}
          onOpenShiftChanges={() => setRequestModalOpen(true)}
          onOpenChangePassword={() => setChangePasswordOpen(true)}
          adminContacts={adminContacts}
        >
          {/* ── ACTION ITEMS (need your response) ── */}
          <IncomingOffersPanel
            offers={shiftOffers}
            currentUserEmail={currentUser.email}
            onAccept={onAcceptOffer}
            onReject={onRejectOffer}
          />
          <IncomingSwapsPanel
            swaps={shiftSwaps}
            currentUserEmail={currentUser.email}
            onAccept={onAcceptSwap}
            onReject={onRejectSwap}
          />

          {/* ── UNIFIED REQUESTS HISTORY ── */}
          <UnifiedRequestHistory
            timeOffRequests={timeOffRequests}
            shiftOffers={shiftOffers}
            shiftSwaps={shiftSwaps}
            currentUserEmail={currentUser.email}
            onCancelTimeOff={onCancelRequest}
            onCancelOffer={onCancelOffer}
            onCancelSwap={onCancelSwap}
            onOpen={() => markAsSeen([...unseenTimeOffIds, ...unseenOfferIds, ...unseenSwapIds, ...unseenReceivedOfferIds, ...unseenReceivedSwapIds])}
          />
        </MobileMenuDrawer>
        
        {/* Mobile Announcement Popup */}
        <MobileAnnouncementPopup
          isOpen={mobileAnnouncementOpen}
          onClose={() => setMobileAnnouncementOpen(false)}
          announcement={announcement}
        />
        
        {/* Request Modals (shared with desktop) */}
        <RequestTimeOffModal 
          isOpen={requestModalOpen} 
          onClose={() => setRequestModalOpen(false)} 
          onSelectType={handleSelectRequestType}
          currentUser={currentUser}
        />
        <RequestDaysOffModal 
          isOpen={daysOffModalOpen} 
          onClose={() => setDaysOffModalOpen(false)} 
          onSubmit={onSubmitRequest}
          currentUser={currentUser}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
          shiftSwaps={shiftSwaps}
          shifts={shifts}
        />
        <OfferShiftModal
          isOpen={offerShiftModalOpen}
          onClose={() => setOfferShiftModalOpen(false)}
          onSubmit={onSubmitOffer}
          currentUser={currentUser}
          employees={employees}
          shifts={shifts}
          shiftOffers={shiftOffers}
          timeOffRequests={timeOffRequests}
          shiftSwaps={shiftSwaps}
        />
        <SwapShiftModal
          isOpen={swapShiftModalOpen}
          onClose={() => setSwapShiftModalOpen(false)}
          onSubmit={onSubmitSwap}
          currentUser={currentUser}
          employees={employees}
          shifts={shifts}
          shiftSwaps={shiftSwaps}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
        />
        <ChangePasswordModal
          isOpen={changePasswordOpen}
          onClose={() => setChangePasswordOpen(false)}
          currentUser={currentUser}
        />

        {/* Bottom Tab Bar (Phase 6) */}
        <MobileBottomNav
          activeTab={mobileMenuOpen ? 'more' : mobileAlertsOpen ? 'alerts' : requestModalOpen ? 'requests' : 'schedule'}
          hasNotifications={alertsBadge || totalNotifications > 0}
          onTabChange={(tab) => {
            if (tab === 'schedule') {
              setMobileMenuOpen(false);
              setMobileAlertsOpen(false);
              setRequestModalOpen(false);
            } else if (tab === 'requests') {
              setRequestModalOpen(true);
            } else if (tab === 'alerts') {
              setMobileAlertsOpen(true);
            } else if (tab === 'more') {
              setMobileMenuOpen(true);
            }
          }}
        />

        {/* S41.4: Alerts bottom sheet — replaces the old announcement-only popup path */}
        <MobileAlertsSheet
          isOpen={mobileAlertsOpen}
          onClose={() => setMobileAlertsOpen(false)}
          currentUser={currentUser}
          announcement={hasAnnouncement ? announcement : null}
          events={events}
          dates={dates}
          timeOffRequests={timeOffRequests}
          shiftOffers={shiftOffers}
          shiftSwaps={shiftSwaps}
          employees={schedulableEmployees}
          onOpened={markAlertsSeen}
        />

        {/* Shift Detail Bottom Sheet (Phase 10) */}
        <MobileBottomSheet
          isOpen={!!mobileShiftDetail}
          onClose={() => setMobileShiftDetail(null)}
          title={mobileShiftDetail ? `${mobileShiftDetail.employee.name.split(' ')[0]} — ${mobileShiftDetail.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}` : ''}
        >
          {mobileShiftDetail && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hasTitle(mobileShiftDetail.employee) ? THEME.text.primary : mobileShiftDetail.role?.color }} />
                <span className="font-semibold" style={{ color: hasTitle(mobileShiftDetail.employee) ? THEME.text.primary : mobileShiftDetail.role?.color, fontSize: '15px' }}>
                  {hasTitle(mobileShiftDetail.employee) ? (mobileShiftDetail.employee.title || '') : mobileShiftDetail.role?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs font-medium mb-1" style={{ color: THEME.text.muted }}>TIME</p>
                  <p className="font-semibold" style={{ color: THEME.text.primary, fontSize: '14px' }}>
                    {formatTimeDisplay(mobileShiftDetail.shift.startTime)} – {formatTimeDisplay(mobileShiftDetail.shift.endTime)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs font-medium mb-1" style={{ color: THEME.text.muted }}>HOURS</p>
                  <p className="font-bold" style={{ color: THEME.accent.cyan, fontSize: '16px' }}>
                    {mobileShiftDetail.shift.hours}h
                  </p>
                </div>
              </div>
              {mobileShiftDetail.shift.task && (
                <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: THEME.task + '15', border: `1px solid ${THEME.task}40` }}>
                  <Star size={14} fill={THEME.task} color={THEME.task} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: THEME.task }}>TASK</p>
                    <p style={{ color: THEME.text.primary, fontSize: '13px' }}>{mobileShiftDetail.shift.task}</p>
                  </div>
                </div>
              )}
              {mobileShiftDetail.employee.id === currentUser.id && (
                <div className="pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
                  <p className="text-xs text-center" style={{ color: THEME.text.muted }}>
                    Need to swap or offer this shift? Tap Requests in the bottom bar.
                  </p>
                </div>
              )}
            </div>
          )}
        </MobileBottomSheet>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DESKTOP RENDER (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ backgroundColor: THEME.bg.primary, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');`}</style>
      <GradientBackground />
      
      {/* Header */}
      <header className="px-4 py-2 sticky top-0" style={{ backgroundColor: THEME.bg.secondary, borderBottom: `1px solid ${THEME.border.default}`, zIndex: 100, boxShadow: THEME.shadow.cardSm }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button"
              onClick={() => { onPeriodChange(CURRENT_PERIOD_INDEX); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              aria-label="Home"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Logo />
            </button>
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />

            {/* Period Navigation */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onPeriodChange && onPeriodChange(periodIndex - 1)}
                className="p-1 rounded hover:bg-black/5"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-center min-w-[140px]">
                <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{formatDate(periodInfo.startDate)} – {formatDate(periodInfo.endDate)}</p>
                {periodIndex === CURRENT_PERIOD_INDEX && <p className="text-xs" style={{ color: THEME.accent.cyan }}>Current Period</p>}
                {periodIndex > CURRENT_PERIOD_INDEX && <p className="text-xs" style={{ color: THEME.accent.purple }}>Future Period</p>}
                {periodIndex < CURRENT_PERIOD_INDEX && <p className="text-xs" style={{ color: THEME.text.muted }}>Past Period</p>}
              </div>
              <button 
                onClick={() => onPeriodChange && onPeriodChange(periodIndex + 1)}
                className="p-1 rounded hover:bg-black/5"
                style={{ color: THEME.text.secondary }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            
            {/* Schedule Status Indicator */}
            <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
            <div 
              className="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: isEditMode ? THEME.status.warning + '15' : THEME.status.success + '15',
                color: isEditMode ? THEME.status.warning : THEME.status.success,
                border: `1px solid ${isEditMode ? THEME.status.warning + '30' : THEME.status.success + '30'}`
              }}
              title={isEditMode ? 'Admin is updating the schedule - changes pending' : 'You are viewing the published schedule'}
            >
              {isEditMode ? (
                <>
                  <Loader size={10} className="animate-pulse" />
                  <span>Updates Pending</span>
                </>
              ) : (
                <>
                  <Eye size={10} />
                  <span>LIVE</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Shift Changes button */}
            <button
              onClick={() => setRequestModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:opacity-90 relative"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
            >
              <Calendar size={12} />
              Shift Changes
              {(unseenTimeOffIds.length + unseenOfferIds.length + unseenReceivedOfferIds.length + unseenSwapIds.length + unseenReceivedSwapIds.length) > 0 && (
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: THEME.status.error, fontSize: '9px', color: 'white', fontWeight: 700 }}>
                  {(unseenTimeOffIds.length + unseenOfferIds.length + unseenReceivedOfferIds.length + unseenSwapIds.length + unseenReceivedSwapIds.length) > 9 ? '9+' : (unseenTimeOffIds.length + unseenOfferIds.length + unseenReceivedOfferIds.length + unseenSwapIds.length + unseenReceivedSwapIds.length)}
                </div>
              )}
            </button>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{currentUser.name}</p>
              <p className="text-xs" style={{ color: THEME.accent.cyan }}>{myShiftsCount} shifts</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: '#fff' }}>
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <button onClick={() => setChangePasswordOpen(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }} title="Change Password">
              <Key size={14} />
            </button>
            <button onClick={onLogout} className="p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="p-3 pt-2">
        <div className="max-w-[1400px] mx-auto">
          {/* Week tabs */}
          <div className="flex items-end">
            {[{ w: 1, n: weekNum1, d: week1 }, { w: 2, n: weekNum2, d: week2 }].map(({ w, n, d }) => (
              <button key={w} onClick={() => setActiveWeek(w)} className="px-3 py-1.5 font-medium text-xs relative transition-all"
                style={{ backgroundColor: activeWeek === w ? THEME.bg.secondary : THEME.bg.tertiary, color: activeWeek === w ? THEME.text.primary : THEME.text.muted, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginRight: -1, zIndex: activeWeek === w ? 10 : 1, borderTop: `2px solid ${activeWeek === w ? THEME.accent.purple : 'transparent'}`, borderLeft: `1px solid ${THEME.border.default}`, borderRight: `1px solid ${THEME.border.default}`, marginBottom: activeWeek === w ? -1 : 0 }}>
                <span className="font-semibold">Week {n}</span><span className="ml-1.5 opacity-60">{formatDate(d[0])}–{formatDate(d[6])}</span>
              </button>
            ))}
          </div>
          
          {/* Schedule grid */}
          {isEditMode && (
            <div className="mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderLeft: `3px solid ${THEME.status.warning}`, boxShadow: THEME.shadow.cardSm }}>
              <Loader size={12} className="animate-pulse" style={{ color: THEME.status.warning }} />
              <p className="text-xs" style={{ color: THEME.status.warning }}>Shift assignments for this period haven't been published yet. Availability and time off are shown below.</p>
            </div>
          )}
          <div className="rounded-b-xl rounded-tr-xl overflow-visible relative" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, borderTop: 'none', zIndex: 1, boxShadow: THEME.shadow.card }}>
            <div className="grid gap-px" style={{ gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, backgroundColor: THEME.border.subtle }}>
              <div className="p-1.5" style={{ backgroundColor: THEME.bg.tertiary }}><span className="font-semibold text-xs" style={{ color: THEME.text.primary }}>Employee</span></div>
              {currentDates.map((date, i) => {
                const sh = getStoreHoursForDate(date);
                const today = toDateKey(date) === todayStr;
                const hol = isStatHoliday(date);
                return (
                  <div key={toDateKey(date)} className="p-1 text-center" style={{ background: today ? `linear-gradient(${THEME.accent.purple}20, ${THEME.accent.purple}20), ${THEME.bg.tertiary}` : hol ? `linear-gradient(${THEME.status.warning}15, ${THEME.status.warning}15), ${THEME.bg.tertiary}` : THEME.bg.tertiary, borderBottom: today ? `2px solid ${THEME.accent.purple}` : hol ? `2px solid ${THEME.status.warning}` : 'none' }}>
                    <p className="font-semibold text-xs" style={{ color: today ? THEME.accent.purple : hol ? THEME.status.warning : THEME.text.primary }}>{getDayName(date).slice(0, 3)}</p>
                    <p className="text-sm font-bold" style={{ color: THEME.text.primary }}>{date.getDate()}</p>
                    <p className="text-xs" style={{ color: THEME.text.muted }}>{formatTimeShort(sh.open)}-{formatTimeShort(sh.close)}</p>
                  </div>
                );
              })}
            </div>
            <div>{schedulableEmployees.map((e, i) => {
              const showDivider = i > 0 && employeeBucket(e) !== employeeBucket(schedulableEmployees[i-1]);
              return (
                <React.Fragment key={e.id}>
                  {showDivider && <div style={{ height: 1, margin: '3px 8px', backgroundColor: THEME.border.default }} />}
                  <EmployeeViewRow employee={e} dates={currentDates} shifts={shifts} events={events} loggedInEmpId={currentUser.id} approvedTimeOffSet={approvedTimeOffSet} />
                </React.Fragment>
              );
            })}</div>
          </div>
          
          {/* Legend */}
          <div className="mt-2 p-1.5 rounded-lg flex items-center gap-2 flex-wrap text-xs" style={{ backgroundColor: THEME.bg.secondary, zIndex: 1 }}>
            <span style={{ color: THEME.text.muted }}>Roles:</span>
            {ROLES.filter(r => r.id !== 'none').map(r => (
              <div key={r.id} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: r.color }} />
                <span style={{ color: THEME.text.secondary }}>{r.name}</span>
              </div>
            ))}
            <span className="ml-2" style={{ color: THEME.text.muted }}>|</span>
            <div className="flex items-center gap-1"><Star size={10} fill={THEME.task} color={THEME.task} /><span style={{ color: THEME.task }}>Your Task</span></div>
          </div>
          
          {/* Period Announcement - Only show when period is LIVE and has content */}
          {!isEditMode && announcement?.message && (
            <div className="mt-3 p-4 rounded-xl" style={{
              backgroundColor: THEME.bg.secondary,
              border: `1px solid ${THEME.border.default}`,
              borderLeft: `3px solid ${THEME.accent.blue}`,
              boxShadow: THEME.shadow.cardSm
            }}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: THEME.accent.blue + '20' }}>
                  <Bell size={20} style={{ color: THEME.accent.blue }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: THEME.accent.blue }}>
                    📢 {announcement.subject || 'Announcement'}
                  </h3>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: THEME.text.primary, lineHeight: 1.6 }}>
                    {announcement.message}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* PK details for this period — sibling of announcement */}
          <div className="mt-3">
            <PKDetailsPanel events={events} dates={dates} employees={employees} />
          </div>

          {/* My Schedule Summary */}
          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.cardSm }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: THEME.text.primary }}>Your Schedule This Period</h3>
            <div className="space-y-1">
              {dates.map((date, i) => {
                const shift = shifts[`${currentUser.id}-${toDateKey(date)}`];
                if (!shift) return null;
                const role = ROLES_BY_ID[shift.role];
                const isSelfTitled = hasTitle(currentUser);
                const labelText = isSelfTitled ? (currentUser.title || '') : (role?.name || '');
                const labelColor = isSelfTitled ? THEME.text.primary : role?.color;
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={toDateKey(date)} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, borderLeft: `3px solid ${labelColor}` }}>
                    <div className="w-16">
                      <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{dayName} {date.getDate()}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: labelColor }}>{labelText}</span>
                      <span className="text-xs" style={{ color: THEME.text.muted }}>{formatTimeShort(shift.startTime)}-{formatTimeShort(shift.endTime)}</span>
                      <span className="text-xs" style={{ color: THEME.accent.cyan }}>{shift.hours}h</span>
                    </div>
                    {shift.task && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: THEME.task + '20' }}>
                        <Star size={10} fill={THEME.task} color={THEME.task} />
                        <span className="text-xs" style={{ color: THEME.task }}>{shift.task}</span>
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)}
              {dates.filter(d => shifts[`${currentUser.id}-${toDateKey(d)}`]).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: THEME.text.muted }}>No shifts scheduled this period</p>
              )}
            </div>
          </div>
          
          {/* Admin Contacts */}
          {adminContacts.length > 0 && (
            <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, boxShadow: THEME.shadow.cardSm }}>
              <p className="text-xs font-semibold mb-2" style={{ color: THEME.text.muted }}>CONTACT ADMIN</p>
              <div className="space-y-1">
                {adminContacts.map(admin => (
                  <div key={admin.id} className="flex items-center gap-2 text-sm">
                    <Shield size={12} style={{ color: THEME.accent.purple }} />
                    <span style={{ color: THEME.text.primary }}>{admin.name}:</span>
                    <a href={`mailto:${admin.email}`} style={{ color: THEME.accent.cyan }}>{admin.email}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Incoming Take My Shift Requests - needs response */}
          <div className="mt-3">
            <IncomingOffersPanel 
              offers={shiftOffers}
              currentUserEmail={currentUser.email}
              onAccept={onAcceptOffer}
              onReject={onRejectOffer}
            />
          </div>
          
          {/* Incoming Swap Requests - needs response */}
          <div className="mt-3">
            <IncomingSwapsPanel 
              swaps={shiftSwaps}
              currentUserEmail={currentUser.email}
              onAccept={onAcceptSwap}
              onReject={onRejectSwap}
            />
          </div>
          
          {/* Offers I've received (history - after I responded) */}
          <div className="mt-3">
            <ReceivedOffersHistoryPanel 
              offers={shiftOffers}
              currentUserEmail={currentUser.email}
              notificationCount={unseenReceivedOfferIds.length}
              onOpen={() => markAsSeen(unseenReceivedOfferIds)}
            />
          </div>
          
          {/* Swaps I've received (history - after I responded) */}
          <div className="mt-3">
            <ReceivedSwapsHistoryPanel 
              swaps={shiftSwaps}
              currentUserEmail={currentUser.email}
              notificationCount={unseenReceivedSwapIds.length}
              onOpen={() => markAsSeen(unseenReceivedSwapIds)}
            />
          </div>
          
          {/* My Time Off Requests */}
          <div className="mt-3">
            <MyRequestsPanel 
              requests={timeOffRequests} 
              currentUserEmail={currentUser.email} 
              onCancel={onCancelRequest}
              notificationCount={unseenTimeOffIds.length}
              onOpen={() => markAsSeen(unseenTimeOffIds)}
            />
          </div>
          
          {/* My Take My Shift Requests */}
          {shiftOffers.some(o => o.offererEmail === currentUser.email) && (
            <div className="mt-3">
              <CollapsibleSection 
                title="My Take My Shift Requests"
                icon={ArrowRight}
                iconColor={THEME.accent.pink}
                badge={shiftOffers.filter(o => o.offererEmail === currentUser.email && ['awaiting_recipient', 'awaiting_admin'].includes(o.status)).length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={false}
                notificationCount={unseenOfferIds.length}
                onOpen={() => markAsSeen(unseenOfferIds)}
              >
                <MyShiftOffersPanel 
                  offers={shiftOffers}
                  currentUserEmail={currentUser.email}
                  onCancel={onCancelOffer}
                />
              </CollapsibleSection>
            </div>
          )}
          
          {/* My Swap Requests */}
          {shiftSwaps.some(s => s.initiatorEmail === currentUser.email) && (
            <div className="mt-3">
              <CollapsibleSection 
                title="My Swap Requests"
                icon={ArrowRightLeft}
                iconColor={THEME.accent.purple}
                badge={shiftSwaps.filter(s => s.initiatorEmail === currentUser.email && ['awaiting_partner', 'awaiting_admin'].includes(s.status)).length || undefined}
                badgeColor={THEME.status.warning}
                defaultOpen={false}
                notificationCount={unseenSwapIds.length}
                onOpen={() => markAsSeen(unseenSwapIds)}
              >
                <MySwapsPanel 
                  swaps={shiftSwaps}
                  currentUserEmail={currentUser.email}
                  onCancel={onCancelSwap}
                />
              </CollapsibleSection>
            </div>
          )}
        </div>
      </main>
      
      {/* Request Modals */}
      <RequestTimeOffModal 
        isOpen={requestModalOpen} 
        onClose={() => setRequestModalOpen(false)} 
        onSelectType={handleSelectRequestType}
        currentUser={currentUser}
      />
      <RequestDaysOffModal 
        isOpen={daysOffModalOpen} 
        onClose={() => setDaysOffModalOpen(false)} 
        onSubmit={onSubmitRequest}
        currentUser={currentUser}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
        shiftSwaps={shiftSwaps}
        shifts={shifts}
      />
      <OfferShiftModal
        isOpen={offerShiftModalOpen}
        onClose={() => setOfferShiftModalOpen(false)}
        onSubmit={onSubmitOffer}
        currentUser={currentUser}
        employees={employees}
        shifts={shifts}
        shiftOffers={shiftOffers}
        timeOffRequests={timeOffRequests}
        shiftSwaps={shiftSwaps}
      />
      <SwapShiftModal
        isOpen={swapShiftModalOpen}
        onClose={() => setSwapShiftModalOpen(false)}
        onSubmit={onSubmitSwap}
        currentUser={currentUser}
        employees={employees}
        shifts={shifts}
        shiftSwaps={shiftSwaps}
        timeOffRequests={timeOffRequests}
        shiftOffers={shiftOffers}
      />
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export { EmployeeView };
