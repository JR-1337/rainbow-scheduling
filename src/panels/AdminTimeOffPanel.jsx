import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { THEME } from '../theme';
import { REQUEST_STATUS_COLORS } from '../constants';
import { parseLocalDate } from '../utils/format';
import { AdminRequestModal } from '../modals/AdminRequestModal';

export const AdminTimeOffPanel = ({ requests, onApprove, onDeny, onRevoke, currentAdminEmail }) => {
  const [filter, setFilter] = useState('pending');
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'settled') return ['approved', 'denied', 'cancelled', 'revoked'].includes(r.status);
    return r.status === filter;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const da = new Date(a.decidedTimestamp || a.createdTimestamp);
    const db = new Date(b.decidedTimestamp || b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const formatRequestDates = (datesStr) => {
    const dates = datesStr.split(',').sort();
    if (dates.length === 1) {
      const d = parseLocalDate(dates[0]);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
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

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getStatusLabel = (status) => {
    const labels = { pending: 'Pending', approved: 'Approved', denied: 'Denied', cancelled: 'Cancelled', revoked: 'Revoked' };
    return labels[status] || status;
  };

  const hasFutureDates = (datesStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = datesStr.split(',');
    return dates.some(d => parseLocalDate(d) >= today);
  };

  const handleApprove = (request) => {
    onApprove(request.requestId, '');
  };

  const openDenyModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setDenyModalOpen(true);
  };

  const handleDeny = () => {
    if (selectedRequest) {
      onDeny(selectedRequest.requestId, adminNotes);
      setDenyModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };

  const openRevokeModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setRevokeModalOpen(true);
  };

  const handleRevoke = () => {
    if (selectedRequest) {
      onRevoke(selectedRequest.requestId, adminNotes);
      setRevokeModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap items-center mb-4">
        {[
          { id: 'pending', label: 'Pending', count: pendingCount },
          { id: 'settled', label: 'Settled' },
          { id: 'all', label: 'All' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              backgroundColor: filter === f.id ? THEME.accent.purple + '20' : THEME.bg.tertiary,
              color: filter === f.id ? THEME.accent.purple : THEME.text.secondary,
              border: `1px solid ${filter === f.id ? THEME.accent.purple + '50' : THEME.border.subtle}`
            }}
          >
            {f.label}
            {f.count > 0 && (
              <span className="px-1 rounded text-xs" style={{ backgroundColor: THEME.accent.purple, color: 'white' }}>{f.count}</span>
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

      {sortedRequests.length === 0 ? (
        <div className="text-center py-3">
          <p className="text-xs" style={{ color: THEME.text.muted }}>
            {filter === 'pending' ? 'No pending requests' : 'No requests found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRequests.map(request => (
            <div
              key={request.requestId}
              className="p-3 rounded-lg"
              style={{
                backgroundColor: request.status === 'pending' ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${request.status === 'pending' ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: THEME.text.primary }}>
                    {request.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.accent.cyan }}>
                    {formatRequestDates(request.datesRequested)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                    Submitted {formatTimestamp(request.createdTimestamp)}
                  </p>
                  {request.reason && request.status === 'pending' && (
                    <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Reason: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                  {request.reason && request.status !== 'pending' && (
                    <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Employee's reason: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                  {request.status !== 'pending' && request.decidedTimestamp && (
                    <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
                      {request.status === 'cancelled' ? 'Cancelled' : `Decided`} {formatTimestamp(request.decidedTimestamp)}
                      {request.decidedBy && request.status !== 'cancelled' && ` by ${request.decidedBy.split('@')[0]}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: REQUEST_STATUS_COLORS[request.status] + '20',
                      color: REQUEST_STATUS_COLORS[request.status]
                    }}
                  >
                    {getStatusLabel(request.status)}
                  </span>

                  {request.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: THEME.status.success, color: 'white' }}
                      >
                        <Check size={10} />
                        Approve
                      </button>
                      <button
                        onClick={() => openDenyModal(request)}
                        className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                        style={{ backgroundColor: THEME.status.error, color: 'white' }}
                      >
                        <X size={10} />
                        Deny
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && hasFutureDates(request.datesRequested) && (
                    <button
                      onClick={() => openRevokeModal(request)}
                      className="px-2 py-1 text-xs font-medium rounded flex items-center gap-1 hover:opacity-80"
                      style={{ backgroundColor: '#F97316', color: 'white' }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminRequestModal isOpen={denyModalOpen} onClose={() => setDenyModalOpen(false)} title="Deny Request">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
          Denying time off for <strong>{selectedRequest?.name}</strong>: {selectedRequest && formatRequestDates(selectedRequest.datesRequested)}
        </p>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          placeholder="Reason for denial (optional but recommended)"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, minHeight: 60 }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={() => setDenyModalOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>Cancel</button>
          <button onClick={handleDeny} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.status.error, color: 'white' }}>Deny Request</button>
        </div>
      </AdminRequestModal>

      <AdminRequestModal isOpen={revokeModalOpen} onClose={() => setRevokeModalOpen(false)} title="Revoke Approved Time Off">
        <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>
          Revoking approved time off for <strong>{selectedRequest?.name}</strong>: {selectedRequest && formatRequestDates(selectedRequest.datesRequested)}
        </p>
        <p className="text-xs mb-2 p-2 rounded" style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
          ⚠️ The employee will be notified that their approved time off has been revoked.
        </p>
        <textarea
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          placeholder="Reason for revoking (recommended)"
          className="w-full px-2 py-1.5 rounded-lg outline-none text-xs resize-none"
          style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, minHeight: 60 }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={() => setRevokeModalOpen(false)} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.muted }}>Cancel</button>
          <button onClick={handleRevoke} className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: '#F97316', color: 'white' }}>Revoke Time Off</button>
        </div>
      </AdminRequestModal>
    </div>
  );
};
