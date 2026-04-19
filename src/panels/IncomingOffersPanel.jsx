import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { AdminRequestModal } from '../modals/AdminRequestModal';
import { CollapsibleSection } from '../App';
import { getDayNameShort, formatDate, formatTimeDisplay } from '../utils/date';

export const IncomingOffersPanel = ({ offers, currentUserEmail, onAccept, onReject }) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const incomingOffers = offers.filter(o => o.recipientEmail === currentUserEmail && o.status === 'awaiting_recipient');

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.fullName : 'No Role';
  };

  const handleRejectClick = (offer) => {
    setSelectedOffer(offer);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedOffer) {
      onReject(selectedOffer.offerId, rejectNote);
    }
    setRejectModalOpen(false);
    setSelectedOffer(null);
  };

  if (incomingOffers.length === 0) {
    return null;
  }

  return (
    <>
      <CollapsibleSection
        title={`Incoming Take My Shift (${incomingOffers.length})`}
        icon={ArrowRight}
        iconColor={THEME.accent.pink}
        badge={incomingOffers.length}
        badgeColor={THEME.status.warning}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {incomingOffers.map(offer => {
            const shiftDate = parseLocalDate(offer.shiftDate);

            return (
              <div key={offer.offerId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                      {offer.offererName} wants you to take their shift
                    </div>
                    <div className="text-xs" style={{ color: THEME.text.secondary }}>
                      {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)} • {getRoleName(offer.shiftRole)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRejectClick(offer)}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => onAccept(offer.offerId)}
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

      <AdminRequestModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Take My Shift Request">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Add a note (optional):</p>
        <textarea
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
          placeholder="e.g., Sorry, I have another commitment that day"
          className="w-full px-3 py-2 rounded-lg text-xs resize-none"
          style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }}
          rows={2}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setRejectModalOpen(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary }}>
            Cancel
          </button>
          <button onClick={handleConfirmReject} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: THEME.status.error, color: 'white' }}>
            Decline Offer
          </button>
        </div>
      </AdminRequestModal>
    </>
  );
};
