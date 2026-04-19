import { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { AdminRequestModal } from '../modals/AdminRequestModal';
import { CollapsibleSection, getDayNameShort, formatDate, formatTimeDisplay } from '../App';

export const IncomingSwapsPanel = ({ swaps, currentUserEmail, onAccept, onReject }) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const incomingSwaps = swaps.filter(s => s.partnerEmail === currentUserEmail && s.status === 'awaiting_partner');

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.name : '—';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.text.muted;
  };

  const handleRejectClick = (swap) => {
    setSelectedSwap(swap);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedSwap) {
      onReject(selectedSwap.swapId, rejectNote);
    }
    setRejectModalOpen(false);
    setSelectedSwap(null);
  };

  if (incomingSwaps.length === 0) {
    return null;
  }

  return (
    <>
      <CollapsibleSection
        title={`Incoming Swap Requests (${incomingSwaps.length})`}
        icon={ArrowRightLeft}
        iconColor={THEME.accent.purple}
        badge={incomingSwaps.length}
        badgeColor={THEME.status.warning}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {incomingSwaps.map(swap => {
            const theirShiftDate = parseLocalDate(swap.initiatorShiftDate);
            const myShiftDate = parseLocalDate(swap.partnerShiftDate);

            return (
              <div key={swap.swapId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-1" style={{ color: THEME.text.primary }}>
                      {swap.initiatorName} wants to swap shifts with you
                    </div>
                    <div className="text-xs mb-1 p-1.5 rounded" style={{ backgroundColor: THEME.accent.purple + '10' }}>
                      <span style={{ color: THEME.text.muted }}>They give: </span>
                      <span style={{ color: THEME.text.primary }}>{getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)} • {formatTimeDisplay(swap.initiatorShiftStart)} – {formatTimeDisplay(swap.initiatorShiftEnd)}</span>
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '30', color: getRoleColor(swap.initiatorShiftRole) }}>
                        {getRoleName(swap.initiatorShiftRole)}
                      </span>
                    </div>
                    <div className="text-xs p-1.5 rounded" style={{ backgroundColor: THEME.accent.cyan + '10' }}>
                      <span style={{ color: THEME.text.muted }}>You give: </span>
                      <span style={{ color: THEME.text.primary }}>{getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)} • {formatTimeDisplay(swap.partnerShiftStart)} – {formatTimeDisplay(swap.partnerShiftEnd)}</span>
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '30', color: getRoleColor(swap.partnerShiftRole) }}>
                        {getRoleName(swap.partnerShiftRole)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleRejectClick(swap)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(swap.swapId)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      <AdminRequestModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Swap Request">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Add a note (optional):</p>
        <textarea
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
          placeholder="e.g., Sorry, that shift doesn't work for me"
          className="w-full px-3 py-2 rounded-lg text-xs resize-none"
          style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          rows={2}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setRejectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
            Cancel
          </button>
          <button onClick={handleConfirmReject} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.status.error, color: 'white' }}>
            Decline Swap
          </button>
        </div>
      </AdminRequestModal>
    </>
  );
};
