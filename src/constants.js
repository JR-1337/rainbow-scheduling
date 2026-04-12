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
