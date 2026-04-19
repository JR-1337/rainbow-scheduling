import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, X, Check, ArrowRightLeft } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { AdminRequestModal } from '../modals/AdminRequestModal';
import { SWAP_STATUS_COLORS, SWAP_STATUS_LABELS } from '../constants';
import { getDayNameShort, formatDate, formatTimeDisplay } from '../utils/date';

export const AdminShiftSwapsPanel = ({ swaps, onApprove, onReject, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('awaiting_admin');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const openRejectModal = (swap) => {
    setSelectedSwap(swap);
    setAdminNotes('');
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (selectedSwap) {
      onReject(selectedSwap.swapId, adminNotes);
      setRejectModalOpen(false);
      setSelectedSwap(null);
      setAdminNotes('');
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredSwaps = swaps.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'awaiting_admin') return s.status === 'awaiting_admin';
    if (filter === 'awaiting_partner') return s.status === 'awaiting_partner';
    if (filter === 'settled') return ['approved', 'rejected', 'cancelled', 'expired', 'partner_rejected', 'revoked'].includes(s.status);
    return s.status === filter;
  });

  const sortedSwaps = [...filteredSwaps].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    if (a.status === 'approved' && b.status !== 'approved') return -1;
    if (b.status === 'approved' && a.status !== 'approved') return 1;
    const da = new Date(a.createdTimestamp), db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const pendingAdminCount = swaps.filter(s => s.status === 'awaiting_admin').length;
  const pendingPartnerCount = swaps.filter(s => s.status === 'awaiting_partner').length;

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.name : '—';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.text.muted;
  };

  return (
    <div className="space-y-3">
      {/* Filter tabs + sort toggle */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          { id: 'awaiting_admin', label: 'Pending', count: pendingAdminCount },
          { id: 'awaiting_partner', label: 'Awaiting Reply', count: pendingPartnerCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.purple : THEME.bg.tertiary,
              color: filter === f.id ? 'white' : THEME.text.muted
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: THEME.status.warning, color: '#000' }}>
                {f.count}
              </span>
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

      {/* Swaps list */}
      {sortedSwaps.length === 0 ? (
        <div className="p-4 text-center rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
          <p className="text-xs" style={{ color: THEME.text.muted }}>
            {filter === 'awaiting_admin' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSwaps.map(swap => {
            const initiatorShiftDate = parseLocalDate(swap.initiatorShiftDate);
            const partnerShiftDate = parseLocalDate(swap.partnerShiftDate);
            const canApprove = swap.status === 'awaiting_admin';
            const bothFuture = initiatorShiftDate >= today && partnerShiftDate >= today;
            const canRevoke = swap.status === 'approved' && bothFuture;

            return (
              <div key={swap.swapId} className="p-3 rounded-lg" style={{
                backgroundColor: canApprove ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${canApprove ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{swap.initiatorName}</span>
                      <ArrowRightLeft size={10} style={{ color: THEME.text.muted }} />
                      <span className="text-xs font-medium" style={{ color: THEME.text.primary }}>{swap.partnerName}</span>
                    </div>

                    <div className="text-xs mb-2 space-y-1">
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>{swap.initiatorName}'s shift: </span>
                        {getDayNameShort(initiatorShiftDate)}, {formatDate(initiatorShiftDate)} • {formatTimeDisplay(swap.initiatorShiftStart)} – {formatTimeDisplay(swap.initiatorShiftEnd)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '30', color: getRoleColor(swap.initiatorShiftRole) }}>
                          {getRoleName(swap.initiatorShiftRole)}
                        </span>
                      </div>
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>{swap.partnerName}'s shift: </span>
                        {getDayNameShort(partnerShiftDate)}, {formatDate(partnerShiftDate)} • {formatTimeDisplay(swap.partnerShiftStart)} – {formatTimeDisplay(swap.partnerShiftEnd)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '30', color: getRoleColor(swap.partnerShiftRole) }}>
                          {getRoleName(swap.partnerShiftRole)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20', color: SWAP_STATUS_COLORS[swap.status] }}>
                        {SWAP_STATUS_LABELS[swap.status]}
                      </span>
                      {swap.partnerNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>"{swap.partnerNote}"</span>
                      )}
                      {swap.adminNote && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>Admin: "{swap.adminNote}"</span>
                      )}
                      {swap.status === 'revoked' && (
                        <span className="text-xs italic" style={{ color: THEME.text.muted }}>
                          Revoked {swap.revokedTimestamp ? new Date(swap.revokedTimestamp).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>

                    <div className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      Submitted {new Date(swap.createdTimestamp).toLocaleDateString()}
                      {swap.partnerRespondedTimestamp && ` • Accepted ${new Date(swap.partnerRespondedTimestamp).toLocaleDateString()}`}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => openRejectModal(swap)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.error, color: 'white' }}
                        >
                          <X size={10} /> Reject
                        </button>
                        <button
                          onClick={() => onApprove(swap.swapId)}
                          className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 hover:opacity-80"
                          style={{ backgroundColor: THEME.status.success, color: 'white' }}
                        >
                          <Check size={10} /> Approve
                        </button>
                      </>
                    )}
                    {canRevoke && onRevoke && (
                      <button
                        onClick={() => onRevoke(swap.swapId)}
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

      <AdminRequestModal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Swap Request">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
          Rejecting swap between <strong>{selectedSwap?.initiatorName}</strong> and <strong>{selectedSwap?.partnerName}</strong>
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
          <button onClick={handleReject} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.status.error, color: 'white' }}>Reject Swap</button>
        </div>
      </AdminRequestModal>
    </div>
  );
};
