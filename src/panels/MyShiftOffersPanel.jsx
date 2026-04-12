import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { OFFER_STATUS_COLORS, OFFER_STATUS_LABELS, getDayNameShort, formatDate, formatTimeDisplay } from '../App';

export const MyShiftOffersPanel = ({ offers, currentUserEmail, onCancel }) => {
  const [sortDir, setSortDir] = useState('desc');
  const myOffers = offers.filter(o => o.offererEmail === currentUserEmail);

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.fullName : 'No Role';
  };

  const sortedOffers = [...myOffers].sort((a, b) => {
    const aActive = ['awaiting_recipient', 'awaiting_admin'].includes(a.status);
    const bActive = ['awaiting_recipient', 'awaiting_admin'].includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    const da = new Date(b.createdTimestamp);
    const db = new Date(a.createdTimestamp);
    return sortDir === 'desc' ? da - db : db - da;
  });

  if (sortedOffers.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-xs" style={{ color: THEME.text.muted }}>No Take My Shift requests sent</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5"
          style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted, border: `1px solid ${THEME.border.subtle}` }}
          title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          <Clock size={9} />
          {sortDir === 'desc' ? <ChevronDown size={9} /> : <ChevronUp size={9} />}
        </button>
      </div>
      <div className="space-y-2">
        {sortedOffers.map(offer => {
          const shiftDate = parseLocalDate(offer.shiftDate);
          const canCancel = ['awaiting_recipient', 'awaiting_admin'].includes(offer.status);

          return (
            <div key={offer.offerId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                    Offered to {offer.recipientName}
                  </div>
                  <div className="text-xs" style={{ color: THEME.text.secondary }}>
                    {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)}
                  </div>
                  {offer.recipientNote && (
                    <div className="text-xs italic mt-1" style={{ color: THEME.text.muted }}>Note: "{offer.recipientNote}"</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20', color: OFFER_STATUS_COLORS[offer.status] }}>
                    {OFFER_STATUS_LABELS[offer.status]}
                  </span>
                  {canCancel && (
                    <button
                      onClick={() => onCancel(offer.offerId)}
                      className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                    >
                      <X size={8} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
