import { EVENT_TYPES } from '../constants';
import { THEME } from '../theme';

/**
 * Compute backgroundColor + border + opacity for a schedule cell.
 *
 * @param {object} flags
 * @param {boolean} flags.hasSick
 * @param {boolean} flags.isTimeOff       - approved time-off for this date
 * @param {boolean} flags.isUnavailable   - employee marked unavailable on day
 * @param {boolean} flags.isTitled        - shift owner has emp.title
 * @param {boolean} flags.hasShift
 * @param {boolean} flags.hasEvents
 * @param {object|null} flags.role        - {color: string} or null
 * @param {boolean} flags.eventOnly       - !shift && hasEvents
 * @param {object|null} flags.firstEventType - EVENT_TYPES[firstEvent.type] or null
 * @param {boolean} flags.useOverlayForTimeOff
 *   true  -> desktop admin (ScheduleCell): time-off rendered as a separate
 *            cyan diagonal overlay div in the parent; bg ternary skips isTimeOff
 *            and partial-availability shading is also rendered as overlay divs.
 *   false -> mobile + desktop employee: time-off folded into bg + opacity;
 *            no overlay div in parent.
 * @returns {{backgroundColor: string, border: string, opacity: number}}
 */
export function computeCellStyles({
  hasSick, isTimeOff, isUnavailable, isTitled, hasShift, hasEvents,
  role, eventOnly, firstEventType, useOverlayForTimeOff
}) {
  const bg = hasSick ? EVENT_TYPES.sick.bg
    : !useOverlayForTimeOff && isTimeOff ? THEME.text.muted + '15'
    : !useOverlayForTimeOff && isUnavailable && !hasShift && !hasEvents ? THEME.bg.tertiary
    : hasShift && isTitled ? THEME.titledEmployee.shiftFill
    : hasShift ? role?.color + '25'
    : eventOnly ? firstEventType.bg
    : THEME.bg.tertiary;

  const borderColor = hasSick ? EVENT_TYPES.sick.border
    : !useOverlayForTimeOff && isTimeOff ? THEME.text.muted + '30'
    : !useOverlayForTimeOff && isUnavailable && !hasShift && !hasEvents ? THEME.border.subtle
    : hasShift && isTitled ? THEME.titledEmployee.shiftBorder
    : hasShift ? role?.color + '50'
    : eventOnly ? firstEventType.border
    : THEME.border.default;

  const opacity = useOverlayForTimeOff ? 1
    : !hasSick && isTimeOff ? 0.7
    : !hasSick && isUnavailable && !hasShift && !hasEvents ? 0.5
    : 1;

  return { backgroundColor: bg, border: `1px solid ${borderColor}`, opacity };
}
