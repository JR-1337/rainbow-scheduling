import React from 'react';
import { EVENT_TYPES } from '../constants';
import { formatTimeShort } from '../utils/date';

// Inline pill for cell-level event indication. Replaces direct-mapping of events
// in ScheduleCell, MobileAdminView, EmployeeView, MobileEmployeeView.
//
// Behavior:
//   N=0  -> returns null
//   N=1  -> full pill with shortLabel
//   N>=2 same type    -> "<shortLabel>×<N>"
//   N>=2 mixed types  -> "<firstShortLabel> +<N-1>"
//
// Always uses the FIRST visible event's bg/text/border tokens.
// `title` attr carries full event list for hover/long-press.
//
// Props:
//   events: array of event objects; caller passes the already-filtered list
//           (i.e. [...].filter(ev => EVENT_TYPES[ev.type]))
//   size: 'sm' (mobile, 8px font) | 'md' (desktop, 9px font); default 'md'
export const EventGlyphPill = React.memo(({ events, size = 'md' }) => {
  if (!events || events.length === 0) return null;
  const first = events[0];
  const firstType = EVENT_TYPES[first.type];
  if (!firstType) return null;

  const allSameType = events.every(ev => ev.type === first.type);
  const label =
    events.length === 1 ? firstType.shortLabel
    : allSameType         ? `${firstType.shortLabel}×${events.length}`
    :                       `${firstType.shortLabel} +${events.length - 1}`;

  const titleText = events.map(ev => {
    const et = EVENT_TYPES[ev.type];
    return `${et?.label || ev.type} ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` — ${ev.note}` : ''}`;
  }).join('\n');

  const fontSize = size === 'sm' ? '8px' : '9px';
  const padding = size === 'sm' ? '0 2px' : '0 3px';

  return (
    <span
      title={titleText}
      className="rounded font-semibold leading-tight shrink-0 whitespace-nowrap"
      style={{
        backgroundColor: firstType.bg,
        color: firstType.text,
        border: `1px solid ${firstType.border}`,
        fontSize,
        padding,
      }}
    >
      {label}
    </span>
  );
});

EventGlyphPill.displayName = 'EventGlyphPill';
