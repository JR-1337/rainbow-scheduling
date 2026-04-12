import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES_BY_ID } from '../constants';
import { parseLocalDate } from '../utils/format';
import { SWAP_STATUS_COLORS, SWAP_STATUS_LABELS, getDayNameShort, formatDate } from '../App';

export const MySwapsPanel = ({ swaps, currentUserEmail, onCancel }) => {
  const [sortDir, setSortDir] = useState('desc');
  const mySwaps = swaps.filter(s => s.initiatorEmail === currentUserEmail);

  const getRoleName = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.name : '—';
  };

  const getRoleColor = (roleId) => {
    const role = ROLES_BY_ID[roleId];
    return role ? role.color : THEME.text.muted;
  };

  const sortedSwaps = [...mySwaps].sort((a, b) => {
    const aActive = ['awaiting_partner', 'awaiting_admin'].includes(a.status);
    const bActive = ['awaiting_partner', 'awaiting_admin'].includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    const da = new Date(a.createdTimestamp);
    const db = new Date(b.createdTimestamp);
    return sortDir === 'desc' ? db - da : da - db;
  });

  if (sortedSwaps.length === 0) {
    return (
      <div className="text-center py-2">
        <p className="text-xs" style={{ color: THEME.text.muted }}>No swap requests sent</p>
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
        {sortedSwaps.map(swap => {
          const myShiftDate = parseLocalDate(swap.initiatorShiftDate);
          const theirShiftDate = parseLocalDate(swap.partnerShiftDate);
          const canCancel = ['awaiting_partner', 'awaiting_admin'].includes(swap.status);

          return (
            <div key={swap.swapId} className="p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-0.5" style={{ color: THEME.text.primary }}>
                    Swap with {swap.partnerName}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>You: </span>
                      {getDayNameShort(myShiftDate)}, {formatDate(myShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.initiatorShiftRole) + '20', color: getRoleColor(swap.initiatorShiftRole) }}>
                        {getRoleName(swap.initiatorShiftRole)}
                      </span>
                    </div>
                    <div style={{ color: THEME.text.secondary }}>
                      <span style={{ color: THEME.text.muted }}>Them: </span>
                      {getDayNameShort(theirShiftDate)}, {formatDate(theirShiftDate)}
                      <span className="ml-1 px-1 py-0.5 rounded text-xs" style={{ backgroundColor: getRoleColor(swap.partnerShiftRole) + '20', color: getRoleColor(swap.partnerShiftRole) }}>
                        {getRoleName(swap.partnerShiftRole)}
                      </span>
                    </div>
                  </div>
                  {swap.partnerNote && (
                    <div className="text-xs italic mt-1" style={{ color: THEME.text.muted }}>Note: "{swap.partnerNote}"</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: SWAP_STATUS_COLORS[swap.status] + '20', color: SWAP_STATUS_COLORS[swap.status] }}>
                    {SWAP_STATUS_LABELS[swap.status]}
                  </span>
                  {canCancel && (
                    <button
                      onClick={() => onCancel(swap.swapId)}
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
