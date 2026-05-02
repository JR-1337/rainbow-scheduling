import { useState, useEffect } from 'react';
import { Calendar, X, AlertCircle, ChevronLeft, ChevronRight, Loader, Check } from 'lucide-react';
import { THEME, TYPE } from '../theme';
import { parseLocalDate } from '../utils/format';
import { toDateKey } from '../utils/date';
import { useEscapeKey } from '../hooks/useEscapeKey';

export const RequestDaysOffModal = ({ isOpen, onClose, onSubmit, currentUser, timeOffRequests = [], shiftOffers = [], shiftSwaps = [], shifts = {} }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedDates([]);
      setViewMonth(new Date());
      setIsSubmitting(false);
      setReason('');
    }
  }, [isOpen]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const hasPendingTimeOff = timeOffRequests.some(req =>
    req.email === currentUser?.email &&
    req.status === 'pending'
  );
  const hasPendingOffer = shiftOffers.some(offer =>
    offer.offererEmail === currentUser?.email &&
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwap = shiftSwaps.some(swap =>
    swap.initiatorEmail === currentUser?.email &&
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingRequest = hasPendingTimeOff || hasPendingOffer || hasPendingSwap;

  const pendingRequestType = hasPendingTimeOff ? 'time-off request' :
                             hasPendingOffer ? 'Take My Shift request' :
                             hasPendingSwap ? 'shift swap request' : null;

  const isScheduledToWork = (dateStr) => {
    if (!currentUser?.id) return false;
    const shiftKey = `${currentUser.id}-${dateStr}`;
    return !!shifts[shiftKey];
  };

  // S41.5: block re-requesting days the user already has approved time off for
  const hasApprovedTimeOffForDate = (dateStr) => {
    if (!currentUser?.email) return false;
    return timeOffRequests.some(r =>
      (r.email === currentUser.email || r.employeeEmail === currentUser.email) &&
      r.status === 'approved' &&
      (r.datesRequested || '').split(',').includes(dateStr)
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];
  for (let i = 0; i < startPad; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const toggleDate = (date) => {
    if (!date || date < today) return;
    const dateStr = toDateKey(date);
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr].sort()
    );
  };

  const isSelected = (date) => {
    if (!date) return false;
    return selectedDates.includes(toDateKey(date));
  };

  const isPast = (date) => {
    if (!date) return false;
    return date < today;
  };

  const handleSubmit = () => {
    if (selectedDates.length === 0) return;
    setIsSubmitting(true);

    const request = {
      requestId: `TOR-${toDateKey(new Date()).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      name: currentUser.name,
      email: currentUser.email,
      datesRequested: selectedDates.join(','),
      status: 'pending',
      reason: reason.trim(),
      createdTimestamp: new Date().toISOString(),
      decidedTimestamp: '',
      decidedBy: '',
      revokedTimestamp: '',
      revokedBy: ''
    };

    onSubmit(request);
    onClose();
  };

  const formatSelectedSummary = () => {
    if (selectedDates.length === 0) return 'No dates selected';
    if (selectedDates.length === 1) {
      const d = parseLocalDate(selectedDates[0]);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const dates = [...selectedDates].sort();
    const groups = [];
    let start = dates[0], end = dates[0];
    for (let i = 1; i < dates.length; i++) {
      const prev = parseLocalDate(end);
      const curr = parseLocalDate(dates[i]);
      if ((curr - prev) / 86400000 === 1) { end = dates[i]; }
      else { groups.push({ start, end }); start = dates[i]; end = dates[i]; }
    }
    groups.push({ start, end });
    const fmt = (g) => {
      const s = parseLocalDate(g.start), e = parseLocalDate(g.end);
      if (g.start === g.end) return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (s.getMonth() === e.getMonth()) return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${e.getDate()}`;
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };
    return `${groups.map(fmt).join(', ')} (${dates.length} days)`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop active" style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 1rem)' }} role="dialog" aria-modal="true" aria-label="Request Days Off" onClick={onClose}>
      <div className="max-w-sm w-full rounded-xl shadow-2xl modal-content active flex flex-col" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}`, maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${THEME.border.subtle}`, background: `linear-gradient(135deg, ${THEME.bg.tertiary}, ${THEME.bg.secondary})` }}>
          <h2 className="font-semibold flex items-center gap-2" style={{ color: THEME.text.primary, fontSize: TYPE.title }}>
            <Calendar size={16} style={{ color: THEME.accent.cyan }} />
            Request Days Off
          </h2>
          <button onClick={onClose} aria-label="Close dialog" className="p-2 rounded-lg hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center" style={{ color: THEME.text.secondary }}><X size={16} /></button>
        </div>

        <div className="p-4 overflow-y-auto">
          {hasPendingRequest ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One request at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              aria-label="Previous month"
              className="p-2 rounded hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: THEME.text.secondary }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold" style={{ color: THEME.text.primary, fontSize: TYPE.subtitle }}>
              {monthNames[month]} {year}
            </span>
            <button
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="p-2 rounded hover:bg-black/5 min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{ color: THEME.text.secondary }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium py-1" style={{ color: THEME.text.muted }}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, i) => {
              const dateStr = date ? toDateKey(date) : '';
              const scheduled = date && isScheduledToWork(dateStr);
              const alreadyOff = date && hasApprovedTimeOffForDate(dateStr);
              const isDisabled = !date || isPast(date) || scheduled || alreadyOff;

              return (
                <button
                  key={dateStr || `pad-${i}`}
                  onClick={() => !scheduled && !alreadyOff && toggleDate(date)}
                  disabled={isDisabled}
                  className="aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center relative"
                  style={{
                    backgroundColor: isSelected(date) ? THEME.accent.cyan : alreadyOff ? THEME.status.success + '25' : scheduled ? THEME.bg.elevated : date ? THEME.bg.tertiary : 'transparent',
                    color: isSelected(date) ? '#000' : isDisabled ? THEME.text.muted + '50' : date ? THEME.text.primary : 'transparent',
                    cursor: !isDisabled ? 'pointer' : 'not-allowed',
                    border: date?.toDateString() === new Date().toDateString() ? `2px solid ${THEME.accent.purple}` : alreadyOff ? `2px solid ${THEME.status.success}80` : scheduled ? `2px solid ${THEME.status.error}40` : '2px solid transparent'
                  }}
                  title={alreadyOff ? 'You already have approved time off for this date' : scheduled ? 'You are scheduled to work – use Take My Shift or Swap instead' : isPast(date) ? 'Past dates cannot be selected' : ''}
                >
                  {date?.getDate()}
                  {alreadyOff && <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME.status.success }} />}
                  {scheduled && !alreadyOff && <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THEME.status.error }} />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 p-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
            <AlertCircle size={14} style={{ color: THEME.text.muted, flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: THEME.text.muted }}>
              Days scheduled to work (<span style={{ color: THEME.status.error }}>●</span>) — use <strong>Take My Shift</strong> or <strong>Swap</strong>. Days already off (<span style={{ color: THEME.status.success }}>●</span>) can't be re-requested.
            </p>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
            <p className="text-xs" style={{ color: THEME.text.muted }}>Selected:</p>
            <p className="text-sm font-medium" style={{ color: selectedDates.length > 0 ? THEME.accent.cyan : THEME.text.muted }}>
              {formatSelectedSummary()}
            </p>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
              Reason <span style={{ color: THEME.text.muted }}>(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Family vacation, medical appointment..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg resize-none"
              style={{
                backgroundColor: THEME.bg.tertiary,
                border: `1px solid ${THEME.border.default}`,
                color: THEME.text.primary,
                outline: 'none'
              }}
              maxLength={200}
            />
            <p className="text-xs mt-1 text-right" style={{ color: THEME.text.muted }}>
              {reason.length}/200
            </p>
          </div>

          <p className="text-xs mt-3" style={{ color: THEME.text.muted }}>
            💡 Tip: Click dates to select/deselect. You can select multiple individual days or a continuous block.
          </p>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg"
              style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedDates.length === 0 || isSubmitting}
              className="flex-1 px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}
            >
              {isSubmitting ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
              Submit Request
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
};
