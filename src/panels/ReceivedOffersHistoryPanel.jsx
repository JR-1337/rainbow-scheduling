import { useState } from 'react';
import { ArrowRight, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { CollapsibleSection } from '../App';
import { OFFER_STATUS_COLORS, OFFER_STATUS_LABELS } from '../constants';
import { getDayNameShort, formatDate, formatTimeDisplay } from '../utils/date';

export const ReceivedOffersHistoryPanel = ({ offers, currentUserEmail, notificationCount, onOpen }) => {
  const [sortDir, setSortDir] = useState('desc');

  const historyOffers = offers.filter(o =>
    o.recipientEmail === currentUserEmail &&
    o.status !== 'awaiting_recipient'
  );

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.fullName : 'No Role';
  };

  const sortedOffers = [...historyOffers].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    const da = new Date(a.createdTimestamp);
    const db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  if (sortedOffers.length === 0) {
    return null;
  }

  const activeCount = sortedOffers.filter(o => o.status === 'awaiting_admin').length;

  return (
    <CollapsibleSection
      title="Take My Shift History (Received)"
      icon={ArrowRight}
      iconColor={THEME.accent.pink}
      badge={activeCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      notificationCount={notificationCount}
      onOpen={onOpen}
    >
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
            const isActive = offer.status === 'awaiting_admin';

            return (
              <div key={offer.offerId} className="p-2 rounded-lg" style={{
                backgroundColor: isActive ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${isActive ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                      From {offer.offererName}
                    </div>
                    <div className="text-xs" style={{ color: THEME.text.secondary }}>
                      {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)}
                    </div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20',
                    color: OFFER_STATUS_COLORS[offer.status]
                  }}>
                    {OFFER_STATUS_LABELS[offer.status]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </>
    </CollapsibleSection>
  );
};
