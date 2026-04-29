import { Check } from 'lucide-react';
import { THEME } from '../theme';
import { parseLocalDate } from '../utils/format';
import { formatDate, formatTimeDisplay, getDayNameShort } from '../utils/date';
import { ROLES_BY_ID } from '../constants';

const getRoleName = (roleId) => {
  const role = ROLES_BY_ID[roleId];
  return role ? role.fullName : 'No Role';
};

const getRoleColor = (roleId) => {
  const role = ROLES_BY_ID[roleId];
  return role ? role.color : THEME.roles.none;
};

/**
 * ShiftCard — shift-button card used in OfferShiftModal and SwapShiftModal.
 *
 * Props:
 *   shift        { key, dateStr, startTime, endTime, role }
 *   isSelected   boolean — selected style override
 *   isDisabled   boolean — opacity 0.5 + cursor not-allowed
 *   disabledLabel  string | undefined — chip label when disabled (e.g. "Pending")
 *   accent       string — color for selected border/bg/check icon
 *   onClick      function
 */
export const ShiftCard = ({ shift, isSelected, isDisabled, disabledLabel, accent, onClick }) => {
  const shiftDate = parseLocalDate(shift.dateStr);

  return (
    <button
      onClick={() => !isDisabled && onClick && onClick(shift)}
      disabled={isDisabled}
      className="w-full p-2 rounded-lg text-left transition-all flex items-center justify-between"
      style={{
        backgroundColor: isSelected ? accent + '20' : THEME.bg.tertiary,
        border: `1px solid ${isSelected ? accent : THEME.border.subtle}`,
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="text-center w-10">
          <div className="text-xs font-bold" style={{ color: THEME.text.primary }}>{getDayNameShort(shiftDate)}</div>
          <div className="text-xs" style={{ color: THEME.text.muted }}>{formatDate(shiftDate)}</div>
        </div>
        <div className="h-8 w-px" style={{ backgroundColor: THEME.border.default }} />
        <div>
          <div className="text-xs font-medium" style={{ color: THEME.text.primary }}>
            {formatTimeDisplay(shift.startTime)} – {formatTimeDisplay(shift.endTime)}
          </div>
          <div className="text-xs" style={{ color: getRoleColor(shift.role) }}>
            {getRoleName(shift.role)}
          </div>
        </div>
      </div>
      {isDisabled && disabledLabel && (
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
          {disabledLabel}
        </span>
      )}
      {isSelected && !isDisabled && (
        <Check size={14} style={{ color: accent }} />
      )}
    </button>
  );
};
