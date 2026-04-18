import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Check, Shield, Loader, Send } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { toDateKey, formatDate, formatDateLong, formatTimeDisplay, getDayNameShort } from '../App';
import { AdaptiveModal } from '../components/AdaptiveModal';

export const OfferShiftModal = ({ isOpen, onClose, onSubmit, currentUser, employees, shifts, shiftOffers, timeOffRequests = [], shiftSwaps = [] }) => {
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedShift(null);
      setSelectedRecipient(null);
      setIsSubmitting(false);
      setError('');
    }
  }, [isOpen]);

  const safeShifts = shifts || {};
  const safeShiftOffers = shiftOffers || [];
  const safeEmployees = employees || [];
  const safeTimeOffRequests = timeOffRequests || [];
  const safeShiftSwaps = shiftSwaps || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const hasPendingTimeOff = safeTimeOffRequests.some(req =>
    req.email === currentUser?.email &&
    req.status === 'pending'
  );
  const hasPendingOfferCheck = safeShiftOffers.some(offer =>
    offer.offererEmail === currentUser?.email &&
    ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
  );
  const hasPendingSwap = safeShiftSwaps.some(swap =>
    swap.initiatorEmail === currentUser?.email &&
    ['awaiting_partner', 'awaiting_admin'].includes(swap.status)
  );
  const hasPendingOffer = hasPendingTimeOff || hasPendingOfferCheck || hasPendingSwap;

  const pendingRequestType = hasPendingTimeOff ? 'time-off request' :
                             hasPendingOfferCheck ? 'Take My Shift request' :
                             hasPendingSwap ? 'shift swap request' : null;

  const myFutureShifts = Object.entries(safeShifts)
    .filter(([key, shift]) => {
      if (!shift) return false;
      // S64 Stage 6 — defensive: only work shifts are offerable (backend also enforces).
      if ((shift.type || 'work') !== 'work') return false;
      if (key.length < 11) return false;
      const dateStr = key.slice(-10);
      const empId = key.slice(0, -11);
      if (String(empId) !== String(currentUser?.id)) return false;
      const shiftDate = parseLocalDate(dateStr);
      return shiftDate >= tomorrow;
    })
    .map(([key, shift]) => {
      const dateStr = key.slice(-10);
      return { key, dateStr, ...shift };
    })
    .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

  const isShiftAlreadyOffered = (dateStr) => {
    return safeShiftOffers.some(offer =>
      offer.offererEmail === currentUser?.email &&
      offer.shiftDate === dateStr &&
      ['awaiting_recipient', 'awaiting_admin'].includes(offer.status)
    );
  };

  const eligibleRecipients = safeEmployees.filter(emp =>
    emp.active &&
    !emp.deleted &&
    emp.email !== currentUser?.email &&
    !emp.isOwner &&
    !emp.isAdmin
  );

  const recipientWorksOnDate = (recipientId, dateStr) => {
    // S64 Stage 6 — a recipient with only a meeting/PK that day is NOT "already working."
    const existing = safeShifts[`${recipientId}-${dateStr}`];
    return !!existing && (existing.type || 'work') === 'work';
  };

  const handleSelectRecipient = (emp) => {
    if (!selectedShift) return;

    if (recipientWorksOnDate(emp.id, selectedShift.dateStr)) {
      setError(`${emp.name} is already working on ${formatDateLong(new Date(selectedShift.dateStr))}.`);
      setSelectedRecipient(null);
    } else {
      setError('');
      setSelectedRecipient(emp);
    }
  };

  const handleSubmit = async () => {
    if (!selectedShift || !selectedRecipient) return;

    setIsSubmitting(true);

    const dateStr = toDateKey(new Date()).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const offerId = `OFFER-${dateStr}-${randomSuffix}`;

    const newOffer = {
      offerId,
      offererName: currentUser.name,
      offererEmail: currentUser.email,
      recipientName: selectedRecipient.name,
      recipientEmail: selectedRecipient.email,
      shiftDate: selectedShift.dateStr,
      shiftStart: selectedShift.startTime,
      shiftEnd: selectedShift.endTime,
      shiftRole: selectedShift.role || 'none',
      status: 'awaiting_recipient',
      recipientNote: '',
      adminNote: '',
      createdTimestamp: new Date().toISOString(),
      recipientRespondedTimestamp: '',
      adminDecidedTimestamp: '',
      adminDecidedBy: '',
      cancelledTimestamp: '',
    };

    await new Promise(resolve => setTimeout(resolve, 300));

    onSubmit(newOffer);
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

  const footer = (
    <div className="flex justify-end gap-2">
      <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!selectedShift || !selectedRecipient || isSubmitting}
        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
        style={{
          background: selectedShift && selectedRecipient ? `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})` : THEME.bg.elevated,
          color: selectedShift && selectedRecipient ? 'white' : THEME.text.muted,
          opacity: (!selectedShift || !selectedRecipient || isSubmitting) ? 0.5 : 1
        }}
      >
        {isSubmitting ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
        Send Offer
      </button>
    </div>
  );

  return (
    <AdaptiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Take My Shift"
      icon={User}
      iconColor={THEME.accent.pink}
      headerGradient={`linear-gradient(135deg, ${THEME.accent.pink}20, ${THEME.bg.secondary})`}
      ariaLabel="Take My Shift"
      bodyClassName="space-y-4"
      footer={footer}
    >
      {hasPendingOffer ? (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: THEME.status.warning + '15', border: `1px solid ${THEME.status.warning}30` }}>
              <AlertCircle size={24} style={{ color: THEME.status.warning, margin: '0 auto 8px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: THEME.status.warning }}>One request at a time</p>
              <p className="text-xs" style={{ color: THEME.text.secondary }}>You already have a pending {pendingRequestType}. Please wait for it to be resolved before making another request.</p>
            </div>
          ) : (
          <>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>1. Select your shift to give away</p>
            {myFutureShifts.length === 0 ? (
              <div className="p-3 rounded-lg text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
                <p className="text-xs" style={{ color: THEME.text.muted }}>You have no upcoming shifts to offer.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {myFutureShifts.map(shift => {
                  const isOffered = isShiftAlreadyOffered(shift.dateStr);
                  const isSelected = selectedShift?.key === shift.key;
                  const shiftDate = parseLocalDate(shift.dateStr);

                  return (
                    <button
                      key={shift.key}
                      onClick={() => !isOffered && setSelectedShift(shift)}
                      disabled={isOffered}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? THEME.accent.pink + '20' : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.pink : THEME.border.subtle}`,
                        opacity: isOffered ? 0.5 : 1,
                        cursor: isOffered ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center w-10">
                          <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
                        </div>
                        <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
                        <div>
                          <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                            {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
                          </div>
                          <div className="text-xs flex items-center gap-1" style={{ color: getRoleColor(shift.role) }}>
                            {getRoleName(shift.role)}
                          </div>
                        </div>
                      </div>
                      {isOffered && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
                          Pending
                        </span>
                      )}
                      {isSelected && !isOffered && (
                        <Check size={14} style={{ color: THEME.accent.pink }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedShift && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>2. Who will take this shift?</p>
              {error && (
                <div className="mb-2 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: THEME.status.error + '20', border: `1px solid ${THEME.status.error}30` }}>
                  <AlertCircle size={14} style={{ color: THEME.status.error }} />
                  <span className="text-xs" style={{ color: THEME.status.error }}>{error}</span>
                </div>
              )}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {eligibleRecipients.map(emp => {
                  const isSelected = selectedRecipient?.id === emp.id;
                  const alreadyWorks = recipientWorksOnDate(emp.id, selectedShift.dateStr);

                  return (
                    <button
                      key={emp.id}
                      onClick={() => !alreadyWorks && handleSelectRecipient(emp)}
                      disabled={alreadyWorks}
                      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
                      style={{
                        backgroundColor: isSelected ? THEME.accent.pink + '20' : alreadyWorks ? THEME.bg.elevated : THEME.bg.tertiary,
                        border: `1px solid ${isSelected ? THEME.accent.pink : THEME.border.subtle}`,
                        opacity: alreadyWorks ? 0.5 : 1,
                        cursor: alreadyWorks ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                          background: alreadyWorks ? THEME.bg.tertiary : `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
                          color: alreadyWorks ? THEME.text.muted : 'white'
                        }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: alreadyWorks ? THEME.text.muted : THEME.text.primary }}>
                            {emp.name}
                            {emp.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                          </div>
                          <div className="text-xs" style={{ color: THEME.text.muted }}>{emp.email}</div>
                        </div>
                      </div>
                      {alreadyWorks && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>
                          Already Working
                        </span>
                      )}
                      {isSelected && !alreadyWorks && (
                        <Check size={14} style={{ color: THEME.accent.pink }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </>
          )}
    </AdaptiveModal>
  );
};
