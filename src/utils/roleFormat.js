import { ROLES_BY_ID } from '../constants';
import { THEME } from '../theme';

/**
 * getRoleName — returns the full display name for a role ID.
 * Used by offer-context panels (AdminShiftOffersPanel, MyShiftOffersPanel,
 * IncomingOffersPanel, ReceivedOffersHistoryPanel).
 * e.g. 'cashier' → 'Cashier', unknown → 'No Role'
 */
export const getRoleName = (roleId) => {
  const role = ROLES_BY_ID[roleId];
  return role ? role.fullName : 'No Role';
};

/**
 * getRoleNameShort — returns the abbreviated display name for a role ID.
 * Used by swap-context panels (AdminShiftSwapsPanel, MySwapsPanel,
 * IncomingSwapsPanel, ReceivedSwapsHistoryPanel, UnifiedRequestHistory).
 * e.g. 'cashier' → 'Cash', unknown → '—'
 */
export const getRoleNameShort = (roleId) => {
  const role = ROLES_BY_ID[roleId];
  return role ? role.name : '—';
};

/**
 * getRoleColor — returns the theme color for a role ID.
 * Falls back to THEME.text.muted for unknown roles.
 */
export const getRoleColor = (roleId) => {
  const role = ROLES_BY_ID[roleId];
  return role ? role.color : THEME.text.muted;
};
