import React from 'react';
import { EVENT_TYPES } from '../constants';
import { formatTimeShort } from '../utils/date';

/**
 * The inner content of a cell when eventOnly === true. Used by all 4 schedule
 * render paths.
 *
 * @param {Array} events           - visibleEvents (already filtered)
 * @param {object} firstEventType  - EVENT_TYPES[firstEvent.type]
 * @param {object} firstEvent
 * @param {'sm'|'md'} size         - sm = mobile (8/7px), md = desktop (10/9px)
 */
const EventOnlyCell = ({ events, firstEventType, firstEvent, size = 'md' }) => {
  const labelSize = size === 'sm' ? '8px' : '10px';
  const timeSize  = size === 'sm' ? '7px' : '9px';
  const padding = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className={`${padding} h-full flex flex-col justify-between relative`}
      title={events.map(ev => {
        const et = EVENT_TYPES[ev.type];
        return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
      }).join('\n')}>
      {events.length === 2 ? (
        <div className="flex flex-col gap-0.5">
          {events.map((ev, i) => {
            const et = EVENT_TYPES[ev.type] || firstEventType;
            return (
              <div key={i} className="flex items-center gap-0.5">
                <span className="rounded font-semibold leading-tight" style={{ backgroundColor: et.bg, color: et.text, border: `1px solid ${et.border}`, fontSize: labelSize, padding: '0 2px' }}>{et.shortLabel}</span>
                <span style={{ color: et.text, opacity: 0.8, fontSize: timeSize }}>{formatTimeShort(ev.startTime)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <span className={size === 'md' ? 'text-xs font-semibold truncate' : 'font-semibold truncate'} style={{ color: firstEventType.text, ...(size === 'sm' ? { fontSize: '10px' } : {}) }}>
            {events.length === 1 ? firstEventType.shortLabel : `${events.length} events`}
          </span>
          <span className={size === 'md' ? 'text-xs' : ''} style={{ color: firstEventType.text, opacity: 0.8, ...(size === 'sm' ? { fontSize: '9px' } : {}) }}>
            {formatTimeShort(firstEvent.startTime)}-{formatTimeShort(firstEvent.endTime)}
          </span>
        </>
      )}
    </div>
  );
};

export default EventOnlyCell;
