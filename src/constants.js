import { THEME } from './theme';

export const ROLES = [
  { id: 'cashier', name: 'Cash', fullName: 'Cashier', color: THEME.roles.cashier },
  { id: 'backupCashier', name: 'Cash2', fullName: 'Backup Cashier', color: THEME.roles.backupCashier },
  { id: 'mens', name: "Men's", fullName: "Men's Section", color: THEME.roles.mens },
  { id: 'womens', name: "Women's", fullName: "Women's Section", color: THEME.roles.womens },
  { id: 'floorMonitor', name: 'Monitor', fullName: 'Floor Monitor', color: THEME.roles.floorMonitor },
  { id: 'none', name: 'None', fullName: 'No Role', color: THEME.roles.none },
];

export const ROLES_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r]));

// S61 — Orthogonal shift types. Not a role entry; a shift row carries `type` + `role`
// independently. Meeting/PK entries set role='none' and render with the neutral palette.
export const EVENT_TYPES = {
  meeting: {
    id: 'meeting',
    label: 'Meeting',
    shortLabel: 'MTG',
    bg: THEME.event.meetingBg,
    text: THEME.event.meetingText,
    border: THEME.event.meetingBorder,
  },
  pk: {
    id: 'pk',
    label: 'Product Knowledge',
    shortLabel: 'PK',
    bg: THEME.event.pkBg,
    text: THEME.event.pkText,
    border: THEME.event.pkBorder,
  },
};

export const REQUEST_STATUS_COLORS = {
  pending: THEME.status.warning,
  approved: THEME.status.success,
  denied: THEME.status.error,
  cancelled: THEME.text.muted,
  revoked: '#F97316',
};
