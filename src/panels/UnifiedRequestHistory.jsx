import { useState, useMemo } from 'react';
import { Clock, ChevronDown, ChevronUp, X, Calendar, ArrowRight, ArrowRightLeft, ClipboardList } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { CollapsibleSection, OFFER_STATUS_COLORS, OFFER_STATUS_LABELS, SWAP_STATUS_COLORS, SWAP_STATUS_LABELS } from '../App';
import { formatTimeDisplay } from '../utils/date';

export const UnifiedRequestHistory = ({
  timeOffRequests, shiftOffers, shiftSwaps, currentUserEmail,
  onCancelTimeOff, onCancelOffer, onCancelSwap,
  onOpen
}) => {
  const [sortDir, setSortDir] = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.name : '—';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.text.muted;
  };

  const formatShortDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const items = useMemo(() => {
    const unified = [];

    timeOffRequests
      .filter(r => r.email === currentUserEmail)
      .forEach(r => {
        unified.push({
          id: 'to-' + r.requestId,
          type: 'timeOff',
          direction: 'sent',
          timestamp: r.createdTimestamp,
          status: r.status,
          statusColor: r.status === 'pending' ? THEME.status.warning : r.status === 'approved' ? THEME.status.success : r.status === 'denied' ? THEME.status.error : THEME.text.muted,
          statusLabel: { pending: 'Pending', approved: 'Approved', denied: 'Denied', cancelled: 'Cancelled', revoked: 'Revoked' }[r.status] || r.status,
          canCancel: r.status === 'pending',
          onCancel: () => onCancelTimeOff(r.requestId),
          data: r
        });
      });

    shiftOffers
      .filter(o => o.offererEmail === currentUserEmail)
      .forEach(o => {
        unified.push({
          id: 'os-' + o.offerId,
          type: 'offer',
          direction: 'sent',
          timestamp: o.createdTimestamp,
          status: o.status,
          statusColor: OFFER_STATUS_COLORS[o.status],
          statusLabel: OFFER_STATUS_LABELS[o.status],
          canCancel: ['awaiting_recipient', 'awaiting_admin'].includes(o.status),
          onCancel: () => onCancelOffer(o.offerId),
          data: o
        });
      });

    shiftOffers
      .filter(o => o.recipientEmail === currentUserEmail && o.status !== 'awaiting_recipient')
      .forEach(o => {
        unified.push({
          id: 'or-' + o.offerId,
          type: 'offer',
          direction: 'received',
          timestamp: o.createdTimestamp,
          status: o.status,
          statusColor: OFFER_STATUS_COLORS[o.status],
          statusLabel: OFFER_STATUS_LABELS[o.status],
          canCancel: false,
          data: o
        });
      });

    shiftSwaps
      .filter(s => s.initiatorEmail === currentUserEmail)
      .forEach(s => {
        unified.push({
          id: 'ss-' + s.swapId,
          type: 'swap',
          direction: 'sent',
          timestamp: s.createdTimestamp,
          status: s.status,
          statusColor: SWAP_STATUS_COLORS[s.status],
          statusLabel: SWAP_STATUS_LABELS[s.status],
          canCancel: ['awaiting_partner', 'awaiting_admin'].includes(s.status),
          onCancel: () => onCancelSwap(s.swapId),
          data: s
        });
      });

    shiftSwaps
      .filter(s => s.partnerEmail === currentUserEmail && s.status !== 'awaiting_partner')
      .forEach(s => {
        unified.push({
          id: 'sr-' + s.swapId,
          type: 'swap',
          direction: 'received',
          timestamp: s.createdTimestamp,
          status: s.status,
          statusColor: SWAP_STATUS_COLORS[s.status],
          statusLabel: SWAP_STATUS_LABELS[s.status],
          canCancel: false,
          data: s
        });
      });

    return unified;
  }, [timeOffRequests, shiftOffers, shiftSwaps, currentUserEmail, onCancelTimeOff, onCancelOffer, onCancelSwap]);

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.canCancel && !b.canCancel) return -1;
    if (!a.canCancel && b.canCancel) return 1;
    const da = new Date(a.timestamp), db = new Date(b.timestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  const typeCounts = {
    all: items.length,
    timeOff: items.filter(i => i.type === 'timeOff').length,
    offer: items.filter(i => i.type === 'offer').length,
    swap: items.filter(i => i.type === 'swap').length,
  };

  const activeCount = items.filter(i => i.canCancel).length;

  const TYPE_CONFIG = {
    timeOff: { label: 'Time Off', shortLabel: 'Off', color: THEME.accent.cyan, icon: <Calendar size={9} /> },
    offer: { label: 'Offer', shortLabel: 'Offer', color: THEME.accent.pink, icon: <ArrowRight size={9} /> },
    swap: { label: 'Swap', shortLabel: 'Swap', color: THEME.accent.purple, icon: <ArrowRightLeft size={9} /> },
  };

  if (items.length === 0) return null;

  return (
    <CollapsibleSection
      title="Requests History"
      icon={ClipboardList}
      iconColor={THEME.accent.cyan}
      badge={activeCount || undefined}
      badgeColor={THEME.status.warning}
      defaultOpen={false}
      onOpen={onOpen}
    >
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {[
          { key: 'all', label: 'All', color: THEME.text.secondary },
          { key: 'timeOff', label: 'Time Off', color: THEME.accent.cyan },
          { key: 'offer', label: 'Offers', color: THEME.accent.pink },
          { key: 'swap', label: 'Swaps', color: THEME.accent.purple },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
            style={{
              backgroundColor: typeFilter === f.key ? f.color + '25' : THEME.bg.tertiary,
              color: typeFilter === f.key ? f.color : THEME.text.muted,
              border: `1px solid ${typeFilter === f.key ? f.color + '50' : THEME.border.subtle}`,
              fontWeight: typeFilter === f.key ? 600 : 400,
              fontSize: '10px'
            }}
          >
            {f.label}
            {typeCounts[f.key] > 0 && <span style={{ opacity: 0.7 }}>{typeCounts[f.key]}</span>}
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

      <div className="space-y-1.5">
        {sorted.length === 0 ? (
          <p className="text-xs text-center py-2" style={{ color: THEME.text.muted }}>No {typeFilter === 'all' ? '' : TYPE_CONFIG[typeFilter]?.label.toLowerCase() + ' '}requests</p>
        ) : sorted.map(item => {
          const tc = TYPE_CONFIG[item.type];
          const isActive = item.canCancel;
          return (
            <div key={item.id} className="p-2 rounded-lg" style={{
              backgroundColor: isActive ? THEME.status.warning + '08' : THEME.bg.tertiary,
              border: `1px solid ${isActive ? THEME.status.warning + '25' : THEME.border.subtle}`
            }}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5" style={{
                    backgroundColor: tc.color + '20', color: tc.color, fontSize: '9px', fontWeight: 600
                  }}>
                    {tc.icon} {tc.shortLabel}
                  </span>
                  {item.direction === 'received' && (
                    <span className="text-xs" style={{ color: THEME.text.muted, fontSize: '9px' }}>received</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: item.statusColor + '20', color: item.statusColor, fontSize: '9px'
                  }}>
                    {item.statusLabel}
                  </span>
                  {item.canCancel && (
                    <button
                      onClick={item.onCancel}
                      className="text-xs px-1 py-0.5 rounded flex items-center gap-0.5"
                      style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted, fontSize: '9px' }}
                    >
                      <X size={8} /> Cancel
                    </button>
                  )}
                </div>
              </div>

              {item.type === 'timeOff' && (
                <div>
                  <p className="text-xs" style={{ color: THEME.text.primary }}>
                    {item.data.datesRequested?.split(',').map(d => formatShortDate(d)).join(', ')}
                  </p>
                  {item.data.reason && <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>"{item.data.reason}"</p>}
                </div>
              )}

              {item.type === 'offer' && (
                <div>
                  <p className="text-xs" style={{ color: THEME.text.primary }}>
                    {item.direction === 'sent' ? `To ${item.data.recipientName}` : `From ${item.data.offererName}`}
                  </p>
                  <p className="text-xs" style={{ color: THEME.text.secondary }}>
                    {formatShortDate(item.data.shiftDate)} • {formatTimeDisplay(item.data.shiftStart)}–{formatTimeDisplay(item.data.shiftEnd)}
                  </p>
                </div>
              )}

              {item.type === 'swap' && (
                <div>
                  <p className="text-xs" style={{ color: THEME.text.primary }}>
                    {item.direction === 'sent' ? `With ${item.data.partnerName}` : `From ${item.data.initiatorName}`}
                  </p>
                  <div className="text-xs space-y-0.5 mt-0.5">
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>{item.direction === 'sent' ? 'You: ' : 'Their: '}</span>
                      {formatShortDate(item.direction === 'sent' ? item.data.initiatorShiftDate : item.data.initiatorShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded" style={{ backgroundColor: getRoleColor(item.direction === 'sent' ? item.data.initiatorShiftRole : item.data.initiatorShiftRole) + '20', color: getRoleColor(item.direction === 'sent' ? item.data.initiatorShiftRole : item.data.initiatorShiftRole), fontSize: '9px' }}>
                        {getRoleName(item.direction === 'sent' ? item.data.initiatorShiftRole : item.data.initiatorShiftRole)}
                      </span>
                    </div>
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>{item.direction === 'sent' ? 'Them: ' : 'Your: '}</span>
                      {formatShortDate(item.direction === 'sent' ? item.data.partnerShiftDate : item.data.partnerShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded" style={{ backgroundColor: getRoleColor(item.direction === 'sent' ? item.data.partnerShiftRole : item.data.partnerShiftRole) + '20', color: getRoleColor(item.direction === 'sent' ? item.data.partnerShiftRole : item.data.partnerShiftRole), fontSize: '9px' }}>
                        {getRoleName(item.direction === 'sent' ? item.data.partnerShiftRole : item.data.partnerShiftRole)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs mt-1" style={{ color: THEME.text.muted, fontSize: '8px' }}>
                {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
};
