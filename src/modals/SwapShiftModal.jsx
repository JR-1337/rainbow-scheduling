import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertCircle, ChevronRight, ChevronLeft, Check, Loader } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { toDateKey, formatDate, formatTimeDisplay, getDayNameShort } from '../App';
import { AdaptiveModal } from '../components/AdaptiveModal';

export const SwapShiftModal = ({ isOpen, onClose, onSubmit, currentUser, employees, shifts, shiftSwaps, timeOffRequests = [], shiftOffers = [] }) => {
  const [step, setStep] = useState(1);
  const [selectedMyShift, setSelectedMyShift] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [selectedTheirShift, setSelectedTheirShift] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedMyShift(null);
      setSelectedPartner(null);
      setSelectedTheirShift(null);
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  const safeShifts = shifts || {};
  const safeShiftSwaps = shiftSwaps || [];
  const safeEmployees = employees || [];
  const safeTimeOffRequests = timeOffRequests || [];
  const safeShiftOffers = shiftOffers || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const hasPendingTimeOff = safeTimeOffRequests.some(req =>
    req.email === currentUser?.email &&
    req.status === 'pending'
  );
  const hasPendingOffer = safeShiftOffers.some(offer =>
    offer.offererEmail === currentUser?.email &&
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwapCheck = safeShiftSwaps.some(swap =>
    swap.initiatorEmail === currentUser?.email &&
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingSwap = hasPendingTimeOff || hasPendingOffer || hasPendingSwapCheck;

  const pendingRequestType = hasPendingTimeOff ? 'time-off request' :
                             hasPendingOffer ? 'Take My Shift request' :
                             hasPendingSwapCheck ? 'shift swap request' : null;

  const getFutureShifts = (empId) => {
    return Object.entries(safeShifts)
      .filter(([key, shift]) => {
        if (!shift) return false;
        // S64 Stage 6 — defensive: only work shifts are swappable (backend also enforces).
        if ((shift.type || 'work') !== 'work') return false;
        if (key.length < 11) return false;
        const dateStr = key.slice(-10);
        const keyEmpId = key.slice(0, -11);
        if (String(keyEmpId) !== String(empId)) return false;
        const shiftDate = parseLocalDate(dateStr);
        return shiftDate >= tomorrow;
      })
      .map(([key, shift]) => {
        const dateStr = key.slice(-10);
        return { key, dateStr, ...shift };
      })
      .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
  };

  const myFutureShifts = getFutureShifts(currentUser?.id);

  const isSwapAlreadyPending = (myShiftDate, theirShiftDate, partnerEmail) => {
    return safeShiftSwaps.some(swap => {
      if (!['awaiting_partner', 'awaiting_admin'].includes(swap.status)) return false;
      const matchForward = swap.initiatorEmail === currentUser?.email &&
                          swap.initiatorShiftDate === myShiftDate &&
                          swap.partnerEmail === partnerEmail &&
                          swap.partnerShiftDate === theirShiftDate;
      const matchReverse = swap.partnerEmail === currentUser?.email &&
                          swap.partnerShiftDate === myShiftDate &&
                          swap.initiatorEmail === partnerEmail &&
                          swap.initiatorShiftDate === theirShiftDate;
      return matchForward || matchReverse;
    });
  };

  const eligiblePartners = safeEmployees.filter(emp =>
    emp.active &&
    !emp.deleted &&
    emp.email !== currentUser?.email &&
    !emp.isOwner &&
    !emp.isAdmin
  );

  const partnerFutureShifts = selectedPartner ? getFutureShifts(selectedPartner.id) : [];

  const handleSelectPartner = (emp) => {
    setSelectedPartner(emp);
    setSelectedTheirShift(null);
    setError('');
    setStep(3);
  };

  const handleSelectTheirShift = (shift) => {
    if (isSwapAlreadyPending(selectedMyShift.dateStr, shift.dateStr, selectedPartner.email)) {
      setError('There is already a pending swap request involving these shifts.');
      return;
    }
    setSelectedTheirShift(shift);
    setError('');
  };

  const handleSubmit = async () => {
    if (!selectedMyShift || !selectedPartner || !selectedTheirShift) return;

    setIsSubmitting(true);

    const dateStr = toDateKey(new Date()).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const swapId = `SWAP-${dateStr}-${randomSuffix}`;

    const newSwap = {
      swapId,
      initiatorName: currentUser.name,
      initiatorEmail: currentUser.email,
      initiatorShiftDate: selectedMyShift.dateStr,
      initiatorShiftStart: selectedMyShift.startTime,
      initiatorShiftEnd: selectedMyShift.endTime,
      initiatorShiftRole: selectedMyShift.role || 'none',
      partnerName: selectedPartner.name,
      partnerEmail: selectedPartner.email,
      partnerShiftDate: selectedTheirShift.dateStr,
      partnerShiftStart: selectedTheirShift.startTime,
      partnerShiftEnd: selectedTheirShift.endTime,
      partnerShiftRole: selectedTheirShift.role || 'none',
      status: 'awaiting_partner',
      partnerNote: '',
      adminNote: '',
      createdTimestamp: new Date().toISOString(),
      partnerRespondedTimestamp: '',
      adminDecidedTimestamp: '',
      adminDecidedBy: '',
      revokedTimestamp: '',
      revokedBy: '',
    };

    await new Promise(resolve => setTimeout(resolve, 300));

    onSubmit(newSwap);
    setIsSubmitting(false);
    onClose();
  };

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.fullName : 'No Role';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.roles.none;
  };

  const footer = !hasPendingSwap ? (
    <div className="flex justify-end gap-2">
      <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!selectedMyShift || !selectedPartner || !selectedTheirShift || isSubmitting}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
        style={{
          background: selectedMyShift && selectedPartner && selectedTheirShift ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated,
          color: selectedMyShift && selectedPartner && selectedTheirShift ? 'white' : THEME.text.muted,
          opacity: (!selectedMyShift || !selectedPartner || !selectedTheirShift || isSubmitting) ? 0.5 : 1
        }}
      >
        {isSubmitting ? <Loader size={12} className="animate-spin" /> : <ArrowRightLeft size={12} />}
        Request Swap
      </button>
    </div>
  ) : null;

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Swap Shifts"
      icon={ArrowRightLeft}
      iconColor={THEME.accent.purple}
      headerGradient={`linear-gradient(135deg, ${THEME.accent.purple}20, ${THEME.bg.secondary})`}
      ariaLabel="Swap Shifts"
      bodyClassName="space-y-4"
      footer={footer}
    >
      {hasPendingSwap ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One swap at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: step >= s ? THEME.accent.purple : THEME.bg.tertiary,
                    color: step >= s ? 'white' : THEME.text.muted
                  }}
                >
                  {s}
                </div>
                {s < 3 && <div className="w-6 h-px" style={{ backgroundColor: step > s ? THEME.accent.purple : THEME.border.default }} />}
              </div>
            ))}
          </div>
          <div className="text-center text-xs mb-3" style={{ color: THEME.text.muted }}>
            {step === 1 && 'Select your shift to swap'}
            {step === 2 && 'Select who to swap with'}
            {step === 3 && 'Select their shift you want'}
          </div>

          {step === 1 && (
            <div>
              {myFutureShifts.length === 0 ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>You have no upcoming shifts to swap.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {myFutureShifts.map(shift => {
                    const isSelected = selectedMyShift?.key === shift.key;
                    const shiftDate = parseLocalDate(shift.dateStr);

                    return (
                      <button
                        key={shift.key}
                        onClick={() => { setSelectedMyShift(shift); setStep(2); }}
                        className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: isSelected ? THEME.accent.purple + '20' : THEME.bg.tertiary,
                          border: `1px solid ${isSelected ? THEME.accent.purple : THEME.border.subtle}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-center w-12">
                            <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                            <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                          </div>
                          <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                          <div>
                            <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                              {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                            </div>
                            <div className="text-xs" style={{ color: getRoleColor(shift.role) }}>
                              {getRoleName(shift.role)}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={14} style={{ color: THEME.accent.purple }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              {selectedMyShift && (
                <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: THEME.accent.purple + '10', border: `1px solid ${THEME.accent.purple}30` }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>Your shift:</p>
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {getDayNameShort(parseLocalDate(selectedMyShift.dateStr))}, {formatDate(parseLocalDate(selectedMyShift.dateStr))} • {formatTimeDisplay(selectedMyShift.startTime)} – {formatTimeDisplay(selectedMyShift.endTime)}
                  </p>
                </div>
              )}

              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Who do you want to swap with?</p>
              {eligiblePartners.length === 0 ? (
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>No eligible employees to swap with.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {eligiblePartners.map(emp => {
                    const theirShifts = getFutureShifts(emp.id);
                    const hasShifts = theirShifts.length > 0;

                    return (
                      <button
                        key={emp.id}
                        onClick={() => hasShifts && handleSelectPartner(emp)}
                        disabled={!hasShifts}
                        className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: THEME.bg.tertiary,
                          border: `1px solid ${THEME.border.subtle}`,
                          opacity: hasShifts ? 1 : 0.5,
                          cursor: hasShifts ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                            background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                            color: 'white'
                          }}>
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>{emp.name}</div>
                            <div className="text-xs" style={{ color: THEME.text.muted }}>
                              {hasShifts ? `${theirShifts.length} upcoming shift${theirShifts.length > 1 ? 's' : ''}` : 'No upcoming shifts'}
                            </div>
                          </div>
                        </div>
                        {hasShifts && <ChevronRight size={14} style={{ color: THEME.text.muted }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                className="mt-3 text-xs flex items-center gap-1"
                style={{ color: THEME.text.muted }}
              >
                <ChevronLeft size={12} /> Back to your shifts
              </button>
            </div>
          )}

          {step === 3 && selectedPartner && (
            <div>
              {selectedMyShift && (
                <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: THEME.accent.purple + '10', border: `1px solid ${THEME.accent.purple}30` }}>
                  <p className="text-xs" style={{ color: THEME.text.muted }}>Your shift:</p>
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {getDayNameShort(parseLocalDate(selectedMyShift.dateStr))}, {formatDate(parseLocalDate(selectedMyShift.dateStr))} • {formatTimeDisplay(selectedMyShift.startTime)} – {formatTimeDisplay(selectedMyShift.endTime)}
                  </p>
                </div>
              )}

              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Select {selectedPartner.name}'s shift you want:</p>

              {error && (
                <div className="mb-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.error + '20', border: `1px solid ${THEME.status.error}30` }}>
                  <AlertCircle size={14} style={{ color: THEME.status.error }} />
                  <span className="text-xs" style={{ color: THEME.status.error }}>{error}</span>
                </div>
              )}

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {partnerFutureShifts.map(shift => {
                  const isSelected = selectedTheirShift?.key === shift.key;
                  const shiftDate = parseLocalDate(shift.dateStr);

                  return (
                    <button
                      key={shift.key}
                      onClick={() => handleSelectTheirShift(shift)}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? THEME.accent.purple + '20' : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.purple : THEME.border.subtle}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center w-12">
                          <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                            {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                          </div>
                          <div className="text-xs" style={{ color: getRoleColor(shift.role) }}>
                            {getRoleName(shift.role)}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} style={{ color: THEME.accent.purple }} />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => { setStep(2); setSelectedTheirShift(null); }}
                className="mt-3 text-xs flex items-center gap-1"
                style={{ color: THEME.text.muted }}
              >
                <ChevronLeft size={12} /> Back to partner selection
              </button>
            </div>
          )}
          </>
          )}
    </AdaptiveModal>
  );
};
