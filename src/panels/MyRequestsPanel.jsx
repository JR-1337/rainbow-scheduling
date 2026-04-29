import { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { THEME } from '../theme';
import { REQUEST_STATUS_COLORS } from '../constants';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { formatRequestDates, formatTimestamp, getStatusLabel } from '../utils/requestFormat';

export const MyRequestsPanel = ({ requests, currentUserEmail, onCancel, notificationCount, onOpen }) => {
  const [sortDir, setSortDir] = useState('desc');
  const myRequests = requests.filter(r => r.email === currentUserEmail);

  const sortedRequests = [...myRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    const da = new Date(a.createdTimestamp), db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const pendingCount = myRequests.filter(r => r.status === 'pending').length;

  if (myRequests.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="My Time Off Requests"
      icon={Calendar}
      iconColor={THEME.accent.cyan}
      badge={pendingCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      notificationCount={notificationCount}
      onOpen={onOpen}
    >
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
                {request.reason && (
                  <div className="mt-1 p-1.5 rounded text-xs" style={{ backgroundColor: THEME.bg.elevated }}>
                    <span style={{ color: THEME.text.muted }}>My reason: </span>
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
    </CollapsibleSection>
  );
};
