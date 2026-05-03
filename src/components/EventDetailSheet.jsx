import React from 'react';
import { MobileBottomSheet } from '../MobileEmployeeView';
import { EVENT_TYPES } from '../constants';
import { THEME } from '../theme';
import { formatTimeShort } from '../utils/date';

export default function EventDetailSheet({ isOpen, onClose, events = [], dateLabel = '' }) {
  const rows = (events || []).filter(ev => EVENT_TYPES[ev.type]);
  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} title={dateLabel ? `Events · ${dateLabel}` : 'Events'}>
      <ul className="space-y-2">
        {rows.map((ev, i) => {
          const type = EVENT_TYPES[ev.type];
          const hasTime = ev.startTime || ev.endTime;
          return (
            <li
              key={i}
              className="flex items-start gap-2 p-2 rounded"
              style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${type.border}40` }}
            >
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: type.bg, color: type.text }}
              >
                {type.label}
              </span>
              <div className="flex-1 min-w-0">
                {hasTime && (
                  <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
                    {formatTimeShort(ev.startTime)}{ev.endTime ? `-${formatTimeShort(ev.endTime)}` : ''}
                  </div>
                )}
                {ev.note && (
                  <div className="text-xs italic mt-0.5" style={{ color: THEME.text.secondary }}>{ev.note}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </MobileBottomSheet>
  );
}
