import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, X, Check, ArrowRight } from 'lucide-react';
import { THEME } from '../theme';
import { parseLocalDate } from '../utils/format';
import { AdminRequestModal } from '../modals/AdminRequestModal';
import { OFFER_STATUS_COLORS, OFFER_STATUS_LABELS } from '../constants';
import { getDayNameShort, formatDate, formatTimeDisplay } from '../utils/date';
import { getRoleName } from '../utils/roleFormat';

export const AdminShiftOffersPanel = ({ offers, onApprove, onReject, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('awaiting_admin');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const openRejectModal = (offer) => {
    setSelectedOffer(offer);
    setAdminNotes('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (selectedOffer) {
      onReject(selectedOffer.offerId, adminNotes);
      setRejectModalOpen(false);
      setSelectedOffer(null);
      setAdminNotes('');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredOffers = offers.filter(o => {
    if (filter === 'all') return true;
    if (filter === 'awaiting_admin') return o.status === 'awaiting_admin';
    if (filter === 'awaiting_recipient') return o.status === 'awaiting_recipient';
    if (filter === 'settled') return ['approved', 'rejected', 'cancelled', 'expired', 'recipient_rejected', 'revoked'].includes(o.status);
    return o.status === filter;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    if (a.status === 'approved' && b.status !== 'approved') return -1;
    if (b.status === 'approved' && a.status !== 'approved') return 1;
    const da = new Date(a.createdTimestamp), db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const pendingAdminCount = offers.filter(o => o.status === 'awaiting_admin').length;
  const pendingRecipientCount = offers.filter(o => o.status === 'awaiting_recipient').length;

  return (
    <div className="space-y-3">
      {/* Filter tabs + sort toggle */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { id: 'awaiting_admin', label: 'Pending', count: pendingAdminCount },
          { id: 'awaiting_recipient', label: 'Awaiting Reply', count: pendingRecipientCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.pink + '20' : THEME.bg.tertiary,
              color: filter === f.id ? THEME.accent.pink : THEME.text.secondary,
              border: `1px solid ${filter === f.id ? THEME.accent.pink + '50' : THEME.border.subtle}`
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1 rounded text-xs" style={{ backgroundColor: THEME.accent.pink, color: 'white' }}>{f.count}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="ml-auto px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5"
          style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted, border: `1px solid ${THEME.border.subtle}` }}
          title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
        >
          <Clock size={9} />
          {sortDir === 'desc' ? <ChevronDown size={9} /> : <ChevronUp size={9} />}
        </button>
      </div>

      {/* Offers list */}
      {sortedOffers.length === 0 ? (
        <div className="p-4 text-center rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
          <p className="text-xs" style={{ color: THEME.text.muted }}>
            {filter === 'awaiting_admin' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedOffers.map(offer => {
            const shiftDate = parseLocalDate(offer.shiftDate);
            const canApprove = offer.status === 'awaiting_admin';
            const canRevoke = offer.status === 'approved' && shiftDate >= today;

            return (
              <div key={offer.offerId} className="p-3 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Offer summary */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{offer.offererName}</span>
                      <ArrowRight size={10} style={{ color: THEME.text.muted }} />
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{offer.recipientName}</span>
                    </div>

                    {/* Shift details */}
                    <div className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
                      {getDayNameShort(shiftDate)}, {formatDate(shiftDate)} • {formatTimeDisplay(offer.shiftStart)} – {formatTimeDisplay(offer.shiftEnd)} • {getRoleName(offer.shiftRole)}
                    </div>

                    {/* Status and notes */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: OFFER_STATUS_COLORS[offer.status] + '20', color: OFFER_STATUS_COLORS[offer.status] }}>
                        {OFFER_STATUS_LABELS[offer.status]}
                      </span>
                      {offer.recipientNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>"{offer.recipientNote}"</span>
                      )}
                      {offer.adminNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>Admin: "{offer.adminNote}"</span>
                      )}
                      {offer.status === 'revoked' && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>
                          Revoked {offer.revokedTimestamp ? new Date(offer.revokedTimestamp).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      Submitted {new Date(offer.createdTimestamp).toLocaleDateString()}
                      {offer.recipientRespondedTimestamp && ` • Accepted ${new Date(offer.recipientRespondedTimestamp).toLocaleDateString()}`}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => openRejectModal(offer)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.error, color: 'white' }}
                        >
                          <X size={10} /> Reject
                        </button>
                        <button
                          onClick={() => onApprove(offer.offerId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.success, color: 'white' }}
                        >
                          <Check size={10} /> Approve
                        </button>
                      </>
                    )}
                    {canRevoke && onRevoke && (
                      <button
                        onClick={() => onRevoke(offer.offerId)}
                        className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: '#F97316', color: 'white' }}
                      >
                        <X size={10} /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminRequestModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Shift Offer">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
          Rejecting shift offer from <strong>{selectedOffer?.offererName}</strong> to <strong>{selectedOffer?.recipientName}</strong>
        </p>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          placeholder="Reason for rejection (optional but recommended)"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, minHeight: 60 }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={() => setRejectModalOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>Cancel</button>
          <button onClick={handleReject} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.status.error, color: 'white' }}>Reject Offer</button>
        </div>
      </AdminRequestModal>
    </div>
  );
};
