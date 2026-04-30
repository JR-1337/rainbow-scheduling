import { THEME } from './theme';

export const ROLES = [
  { id: 'cashier', name: 'Cash', fullName: 'Cashier', color: THEME.roles.cashier },
  { id: 'backupCashier', name: 'Cash2', fullName: 'Cashier 2', color: THEME.roles.backupCashier },
  { id: 'backupCash', name: 'Backup', fullName: 'Backup Cash', color: THEME.roles.backupCash },
  { id: 'mens', name: "Men's", fullName: "Men's Section", color: THEME.roles.mens },
  { id: 'womens', name: "Women's", fullName: "Women's Section", color: THEME.roles.womens },
  { id: 'floorSupervisor', name: 'Supervisor', fullName: 'Floor Supervisor', color: THEME.roles.floorSupervisor },
  { id: 'floorMonitor', name: 'Monitor', fullName: 'Floor Monitor', color: THEME.roles.floorMonitor },
  { id: 'none', name: 'None', fullName: 'No Role', color: THEME.roles.none },
];

export const ROLES_BY_ID = Object.fromEntries(ROLES.map(r => [r.id, r]));

// S61 — Orthogonal shift types. Not a role entry; a shift row carries `type` + `role`
// independently. Meeting/PK/Sick entries set role='none' and render with the neutral palette.
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
  sick: {
    id: 'sick',
    label: 'Sick',
    shortLabel: 'SICK',
    bg: THEME.event.sickBg,
    text: THEME.event.sickText,
    border: THEME.event.sickBorder,
  },
};

// Primary store contact rendered on the PDF printout. Matches backend CONFIG.ADMIN_EMAIL.
export const PRIMARY_CONTACT_EMAIL = 'sarvi@rainbowjeans.com';

export const REQUEST_STATUS_COLORS = {
  pending: THEME.status.warning,
  approved: THEME.status.success,
  denied: THEME.status.error,
  cancelled: THEME.text.muted,
  revoked: '#F97316',
};

export const OFFER_STATUS_COLORS = {
  awaiting_recipient: '#8B5CF6',
  recipient_rejected: THEME.text.muted,
  awaiting_admin: THEME.status.warning,
  approved: THEME.status.success,
  rejected: THEME.status.error,
  cancelled: THEME.text.muted,
  expired: THEME.text.muted,
  revoked: '#F97316',
};

export const OFFER_STATUS_LABELS = {
  awaiting_recipient: 'Awaiting Reply',
  recipient_rejected: 'Declined by Recipient',
  awaiting_admin: 'Awaiting Admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  revoked: 'Revoked',
};

export const SWAP_STATUS_COLORS = {
  awaiting_partner: '#8B5CF6',
  partner_rejected: THEME.text.muted,
  awaiting_admin: THEME.status.warning,
  approved: THEME.status.success,
  rejected: THEME.status.error,
  cancelled: THEME.text.muted,
  expired: THEME.text.muted,
  revoked: '#F97316',
};

export const SWAP_STATUS_LABELS = {
  awaiting_partner: 'Awaiting Reply',
  partner_rejected: 'Declined by Partner',
  awaiting_admin: 'Awaiting Admin',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
  revoked: 'Revoked',
};

// Desktop: header grid + one grid per body row -- first column track must be identical (fixed px
// width; no max-content on col 1 or day columns drift). Name column matches mobile: first name line +
// rest on second line (splitNameForSchedule) + truncate; full name on hover via title=.
const DESKTOP_SCHEDULE_NAME_COL_PX = 160;
export const DESKTOP_SCHEDULE_GRID_TEMPLATE = `${DESKTOP_SCHEDULE_NAME_COL_PX}px repeat(7, 1fr)`;
