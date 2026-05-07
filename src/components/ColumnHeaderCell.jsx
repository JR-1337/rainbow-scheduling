import React from 'react';
import { THEME } from '../theme';
import { getDayName, formatTimeShort } from '../utils/date';
import { StaffingBar } from './uiKit';

const ColumnHeaderCell = React.memo(function ColumnHeaderCell({
  date,
  isToday,
  isHoliday,
  storeOpen,
  storeClose,
  scheduled,
  target,
  hasOverride,
  canEdit,
  isPast,
  onClick,
}) {
  const atTarget = scheduled >= target;
  const overTarget = scheduled > target;
  return (
    <div
      className={`p-1 text-center ${canEdit ? 'cursor-pointer hover:opacity-80' : ''}`}
      style={{
        background: isToday
          ? `linear-gradient(${THEME.accent.purple}20, ${THEME.accent.purple}20), ${THEME.bg.tertiary}`
          : isHoliday
            ? `linear-gradient(${THEME.status.warning}15, ${THEME.status.warning}15), ${THEME.bg.tertiary}`
            : THEME.bg.tertiary,
        borderBottom: isToday
          ? `2px solid ${THEME.accent.purple}`
          : isHoliday
            ? `2px solid ${THEME.status.warning}`
            : 'none',
      }}
      onClick={canEdit ? () => onClick(date) : undefined}
      {...(canEdit ? {
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(date); } },
        'aria-label': `Edit ${getDayName(date)} ${date.getDate()} hours and target`,
      } : {})}
      title={
        canEdit
          ? 'Click to edit hours & target'
          : isPast
            ? 'Past dates cannot be edited'
            : 'Switch to Edit Mode to change'
      }
    >
      <p className="font-semibold text-xs" style={{ color: isToday ? THEME.accent.purple : isHoliday ? THEME.status.warning : THEME.text.primary }}>
        {getDayName(date).slice(0, 3)}
      </p>
      <p className="text-sm font-bold" style={{ color: THEME.text.primary }}>{date.getDate()}</p>
      <p className="text-xs" style={{ color: hasOverride ? THEME.accent.cyan + 'CC' : THEME.text.muted }}>
        {formatTimeShort(storeOpen)}-{formatTimeShort(storeClose)}
      </p>
      <p className="text-xs mt-0.5">
        <span style={{ color: overTarget ? THEME.status.error + 'AA' : atTarget ? THEME.status.success + '99' : THEME.text.muted }}>{scheduled}</span>
        <span style={{ color: hasOverride ? THEME.accent.cyan + '99' : THEME.text.muted }}>/{target}</span>
      </p>
      {target > 0 && <div className="px-1"><StaffingBar scheduled={scheduled} target={target} /></div>}
    </div>
  );
});

export default ColumnHeaderCell;
