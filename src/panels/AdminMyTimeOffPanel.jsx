import { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { THEME } from '../theme';
import { REQUEST_STATUS_COLORS } from '../constants';
import { parseLocalDate } from '../utils/format';
import { CollapsibleSection } from '../components/CollapsibleSection';

export const AdminMyTimeOffPanel = ({ requests, currentUserEmail, onCancel }) => {
  const [sortDir, setSortDir] = useState('desc');
  const myRequests = requests.filter(r => r.email === currentUserEmail);

  const sortedRequests = [...myRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    const da = new Date(a.createdTimestamp), db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

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
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied',
      cancelled: 'Cancelled',
      revoked: 'Revoked'
    };
    return labels[status] || status;
  };

  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  return (
    <CollapsibleSection
      title="My Time Off Requests"
      icon={Calendar}
      iconColor={THEME.accent.cyan}
      badge={pendingCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
    >
      {myRequests.length === 0 ? (
        <div className="text-center py-3">
          <Calendar size={20} style={{ color: THEME.text.muted, margin: '0 auto 8px' }} />
          <p className="text-xs" style={{ color: THEME.text.muted }}>No time off requests yet</p>
          <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>Use "Shift Changes" button to request time off</p>
        </div>
      ) : (
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
          {sortedRequests.map(request => (
            <div key={request.requestId} className="p-2 rounded-lg" style={{
              backgroundColor: request.status === 'pending' ? THEME.status.warning + '10' : THEME.bg.tertiary,
              border: `1px solid ${request.status === 'pending' ? THEME.status.warning + '30' : THEME.border.subtle}`
            }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {formatRequestDates(request.datesRequested)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                    Submitted {formatTimestamp(request.createdTimestamp)}
                  </p>
                  {request.status !== 'pending' && request.decidedBy && (
                    <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>
                      {request.status === 'approved' ? 'Approved' : request.status === 'denied' ? 'Denied' : 'Decided'} by {request.decidedBy === currentUserEmail ? 'you' : request.decidedBy.split('@')[0]}
                    </p>
                  )}
                  {request.reason && request.status !== 'pending' && (
                    <div className="mt-1 p-1.5 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                      <span style={{ color: THEME.text.muted }}>Note: </span>
                      <span style={{ color: THEME.text.secondary }}>{request.reason}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: REQUEST_STATUS_COLORS[request.status] + '20',
                      color: REQUEST_STATUS_COLORS[request.status]
                    }}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => onCancel(request.requestId)}
                      className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 hover:opacity-80"
                      style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}
                    >
                      <X size={8} />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </CollapsibleSection>
  );
};
