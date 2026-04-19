import { useState } from 'react';
import { ArrowRightLeft, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { CollapsibleSection } from '../App';
import { SWAP_STATUS_COLORS, SWAP_STATUS_LABELS } from '../constants';
import { getDayNameShort, formatDate } from '../utils/date';

export const ReceivedSwapsHistoryPanel = ({ swaps, currentUserEmail, notificationCount, onOpen }) => {
  const [sortDir, setSortDir] = useState('desc');

  const historySwaps = swaps.filter(s =>
    s.partnerEmail === currentUserEmail &&
    s.status !== 'awaiting_partner'
  );

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.name : '—';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.text.muted;
  };

  const sortedSwaps = [...historySwaps].sort((a, b) => {
    if (a.status === 'awaiting_admin' && b.status !== 'awaiting_admin') return -1;
    if (b.status === 'awaiting_admin' && a.status !== 'awaiting_admin') return 1;
    const da = new Date(a.createdTimestamp);
    const db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  if (sortedSwaps.length === 0) {
    return null;
  }

  const activeCount = sortedSwaps.filter(s => s.status === 'awaiting_admin').length;

  return (
    <CollapsibleSection
      title="Swap History (Received)"
      icon={ArrowRightLeft}
      iconColor={THEME.accent.purple}
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
          {sortedSwaps.map(swap => {
            const theirShiftDate = parseLocalDate(swap.initiatorShiftDate);
            const myShiftDate = parseLocalDate(swap.partnerShiftDate);
            const isActive = swap.status === 'awaiting_admin';

            return (
              <div key={swap.swapId} className="p-2 rounded-lg" style={{
                backgroundColor: isActive ? THEME.status.warning + '10' : THEME.bg.tertiary,
                border: `1px solid ${isActive ? THEME.status.warning + '30' : THEME.border.subtle}`
              }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                      From {swap.initiatorName}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>Their: </span>
                        {getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '20', color: getRoleColor(swap.initiatorShiftRole) }}>
                          {getRoleName(swap.initiatorShiftRole)}
                        </span>
                      </div>
                      <div style={{ color: THEME.text.secondary }}>
                        <span style={{ color: THEME.text.muted }}>Your: </span>
                        {getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)}
                        <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '20', color: getRoleColor(swap.partnerShiftRole) }}>
                          {getRoleName(swap.partnerShiftRole)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{
                    backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20',
                    color: SWAP_STATUS_COLORS[swap.status]
                  }}>
                    {SWAP_STATUS_LABELS[swap.status]}
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
