# Rainbow Scheduling App - Current Google Sheets Schema Inventory

**Last refreshed: 2026-04-29**

---

## Executive Summary

The Rainbow Scheduling App uses a 5-tab Google Sheets database (Employees, Shifts, Settings, Announcements, ShiftChanges). This document provides a complete inventory of every column, its purpose, data type, read/write locations, and migration-relevant quirks for the planned Supabase Postgres migration.

**Key dimensions:**
- 5 tabs total
- 104 distinct columns across all tabs
- Primary data shape: employees (24 cols) + shifts (11 cols) + settings (key-value) + announcements (5 cols) + shift_changes (35 cols)
- Major quirk: boolean and date values stored as strings in Sheets; JSON fields (availability, defaultShift, staffingTargets, storeHoursOverrides, etc.) stored as string-serialized JSON; time values stored as HH:mm or 1899-epoch

---

## Tab 1: Employees

**Purpose:** Employee master data, authentication, availability, and default work patterns.

| Column Letter | Header Name | Type | Nullable? | Example Value | Notes |
|---|---|---|---|---|---|
| A | id | string | NO | emp-001, emp-owner | Unique; immutable identifier. emp-XXX format assigned sequentially by row (row 2 = emp-001); used in shift rows and JWT tokens. **C** Code.gs:2376 |
| B | name | string | NO | John Smith | Full display name. Used in Shifts tab (`employeeName`) for audit trail. **C** Code.gs:2376 |
| C | email | string | NO | john@example.com | Unique (per backend saveEmployee DUPLICATE_EMAIL check). Lowercase on match. **C** Code.gs:1707 |
| D | password | string | YES | emp-001 | Legacy plaintext column. Kept for admin display of default password; never read by auth path after v2.23 migration to hash-only. Stores number internally (use String() coercion). Admin reset writes here; user password change clears it. **C** Code.gs:2376, **D** ARCHITECTURE.md § Auth + Password |
| E | phone | string | YES | 416-555-0123 | Optional contact field. **C** Code.gs:2376 |
| F | address | string | YES | 123 Main St, Toronto | Optional billing/mailing address. **C** Code.gs:2376 |
| G | dob | ISO date (yyyy-MM-dd) or empty | YES | 1990-05-15 | Optional date of birth. Stored/retrieved as date object; parseSheetValues_ converts to yyyy-MM-dd string. **C** Code.gs:379 |
| H | active | boolean-as-string | NO | TRUE, FALSE | Stored as 'TRUE'/'FALSE' strings. READ: getSheetData() returns string; frontend and backend consume `employee.active` as truthy/falsy string comparison. Inactive employees excluded from UI views/scheduling. **C** Code.gs:1715 |
| I | isAdmin | boolean-as-string | NO | TRUE, FALSE | Stored as 'TRUE'/'FALSE' strings. Admin/owner gate; orthogonal to adminTier. **C** Code.gs:1717, **D** ARCHITECTURE.md § Auth + Password |
| J | isOwner | boolean-as-string | NO | TRUE, FALSE | Stored as 'TRUE'/'FALSE' strings. Single owner (JR). **C** Code.gs:1717 |
| K | showOnSchedule | boolean-as-string | NO | FALSE | Stored as 'TRUE'/'FALSE' strings. Toggles visibility on PDF/mobile/admin grid. **C** Code.gs:2376 |
| L | deleted | boolean-as-string | NO | FALSE | Stored as 'TRUE'/'FALSE' strings. Soft-delete flag. Employees marked deleted remain in Sheets but hidden from views. **C** Code.gs:1715 |
| M | availability | JSON string | NO | `{"sunday":{"available":true,"start":"06:00","end":"22:00"},...}` | JSON object keyed by day name (sunday-saturday), each day has {available, start, end}. time values are HH:mm strings. START: PK eligibility gate + Auto-Fill fallback. JSON.parse'd by frontend. **C** Code.gs:2376, **C** src/utils/employees.js:28 |
| N | defaultShift | JSON string or empty | YES | `{"monday":{"start":"12:00","end":"18:00"},...}` | (v2.24.0+) Per-day {start,end} override for Auto-Fill. If day missing, falls back to availability for that day. Decoupled from availability so widening availability for PK eligibility does not change Auto-Fill output. JSON.parse'd by frontend. **C** Code.gs:2376, **C** ARCHITECTURE.md § Employee Shape |
| O | counterPointId | string | YES | CP12345 | Reserved for Counterpoint POS integration; hidden from UI; do not remove. **C** Code.gs:2376 |
| P | adpNumber | string | YES | ADP-999 | Reserved for ADP payroll integration; hidden from UI; do not remove. **C** Code.gs:2376 |
| Q | rateOfPay | string or number | YES | 18.50 | Optional hourly rate. Stored as-is (may be number). **C** Code.gs:2376 |
| R | employmentType | string | YES | full-time, part-time, '' | Seed for Auto-Fill: full-time uses FT_DEFAULT_SHIFT (Mon-Wed 10-18, Thu-Sat 10:30-19, Sun 10:30-18); part-time falls back to availability. Empty = part-time. **C** ARCHITECTURE.md § Employee Shape |
| S | passwordHash | base64url string | YES | (SHA-256 hash) | (v2.23+) Base64url-encoded SHA-256(salt + password). Empty until first post-S36 login or password change. Never written by frontend. **C** Code.gs:1719, **D** DEPLOY-S36-AUTH.md |
| T | passwordSalt | UUID string | YES | 550e8400-e29b-41d4-a716-446655440000 | (v2.23+) Per-user UUID salt for hash. Empty until first login or password change. **C** Code.gs:1719 |
| U | passwordChanged | boolean-as-string | YES | TRUE, FALSE, or empty | (v2.23+) TRUE = user has changed their password; FALSE or empty = on default (admin can reset). Authoritative for password-age detection. **C** Code.gs:1719, **D** ARCHITECTURE.md § Auth + Password |
| V | defaultSection | string | YES | mens, womens, cashier, backupCashier, backupCash, floorSupervisor, floorMonitor, none | (v2.22.0+) Role seed for Auto-Fill. Defaults to 'none' on read. **C** Code.gs:2376 |
| W | adminTier | string | YES | '', admin1, admin2 | (v2.26.0+) Orthogonal to isAdmin: admin1 = `isAdmin=TRUE` + pure admin; admin2 = `isAdmin=FALSE` + view-only, rendered on grid with title column. Legacy rows read as ''. **C** Code.gs:2376, **D** ARCHITECTURE.md § Auth + Password |
| X | title | string | YES | Manager, Buyer, VM | (v2.26.0+) Freeform one-word label for admin2 employees. Renders in place of role name on grid/PDF/mobile. Max ~20 chars. **C** Code.gs:2376 |

**Backend readers/writers:**
- `createEmployeesTab()` — writes headers + 2 seed rows (JR, Sarvi) **C** Code.gs:2372
- `getSheetData(CONFIG.TABS.EMPLOYEES)` — reads all rows **C** Code.gs:387
- `saveEmployee()` — writes new employee (with hashed password) or updates existing (never overwrites password column) **C** Code.gs:1681
- `getAllData()` — reads all employees, filters to exclude deleted/inactive **C** Code.gs:1574
- `getEmployees()` — public read endpoint **C** Code.gs:1621
- `verifyAuth()` — looks up employee by email for JWT validation **C** Code.gs:616
- `submitTimeOffRequest()` / `submitShiftOffer()` / `submitSwapRequest()` — read employee names, emails, roles **C** Code.gs:825, 990, 1249
- `login()` — reads password/hash/salt columns **C** Code.gs:688
- `changePassword()` / `resetPassword()` — write hash/salt/passwordChanged columns **C** Code.gs:727, 757

**Frontend consumers:**
- `App.jsx:loadAllData()` — destructures employees array from getAllData response **C** src/App.jsx:304
- `EmployeeFormModal` — reads/writes: id, name, email, phone, address, dob, active, isAdmin, isOwner, showOnSchedule, deleted, availability, defaultShift, employmentType, defaultSection, adminTier, title **C** src/App.jsx:2533
- `serializeEmployeeForApi()` — converts availability and defaultShift from objects to JSON strings before POST **C** src/utils/employees.js:27
- `employeeSort.js` — reads isAdmin, isOwner, employmentType, adminTier for display-order bucketing **C** src/utils/employeeSort.js
- `employeeRender.js:hasTitle()` — reads title column to conditionally render admin2 label **C** src/utils/employeeRender.js
- `ScheduleCell` — renders employee name, role, or title depending on adminTier **C** src/components/ScheduleCell.jsx

**Quirks:**
- Boolean columns (active, isAdmin, isOwner, showOnSchedule, deleted, passwordChanged) stored as 'TRUE'/'FALSE' strings; frontend and backend treat as truthy/falsy in boolean context but are technically strings. **L** LESSONS.md (type-coercion)
- `availability` is JSON string on Sheets but object in memory; requires JSON.parse on read, JSON.stringify on write. **L** LESSONS.md (data-shape)
- `password` column may store number (Sheets auto-coerces); always use String() for safe comparisons. **D** sheets-schema.md
- `defaultShift` per-day {start,end} — missing day key = use availability for that day. Not a blanket fallback; if the day exists, use it. **D** ARCHITECTURE.md § Employee Shape
- `passwordHash`, `passwordSalt`, `passwordChanged` empty for accounts created before S36 migration (2026-04-18); first login populates them. **D** DEPLOY-S36-AUTH.md
- `adminTier` column added v2.26.0 as cols W; for rows created before that, column reads as empty string (not 'admin1' or 'admin2'). **C** Code.gs:2376
- `title` column added v2.26.0 as col X; blank for rows with adminTier != 'admin2'. **C** Code.gs:2376

---

## Tab 2: Shifts

**Purpose:** Work schedule entries: work shifts, meetings, and Product Knowledge (PK) events.

| Column Letter | Header Name | Type | Nullable? | Example Value | Notes |
|---|---|---|---|---|---|
| A | id | string | YES | shift-emp-001-2026-02-10, MTG-emp-001-2026-02-10 | Unique row identifier. For work shifts: synthetic `shift-${employeeId}-${date}` format. For meetings/pk: either provided or generated from type + empId + date. Legacy rows may lack id; on save, missing id is derived from uniqueness key. **C** Code.gs:1801, **C** src/utils/scheduleOps.js:5 |
| B | employeeId | string | NO | emp-001 | Foreign key to Employees.id. **C** Code.gs:2403 |
| C | employeeName | string | NO | John Smith | Denormalized for audit trail; always mirrors current Employees.name. **C** Code.gs:2403 |
| D | employeeEmail | string | NO | john@example.com | Denormalized for audit trail; always mirrors current Employees.email. **C** Code.gs:2403 |
| E | date | ISO date (yyyy-MM-dd) | NO | 2026-02-10 | Shift date. parseSheetValues_ converts date objects to yyyy-MM-dd strings. **C** Code.gs:379 |
| F | startTime | HH:mm string | NO | 10:00 | Start time. 1899-epoch date object on Sheets; parseSheetValues_ converts to HH:mm string. **C** Code.gs:379 |
| G | endTime | HH:mm string | NO | 18:00 | End time. 1899-epoch date object on Sheets; parseSheetValues_ converts to HH:mm string. **C** Code.gs:379 |
| H | role | string | NO | cashier, mens, womens, floorSupervisor, floorMonitor, none, backupCashier, backupCash | Role assignment. Determines cell color on grid/PDF. Soft defaults to 'none'. **C** Code.gs:2403 |
| I | task | string | YES | Restock mens denim | Optional task description (work shifts only). **C** Code.gs:2403 |
| J | type | string (enum) | YES | work, meeting, pk | (v2.21.0+) Shift type. Empty cells normalize to 'work' on read. Uniqueness key is (employeeId, date, type) for singular types (work, pk, sick); meetings allow N per (empId, date) and are keyed by row id. **C** Code.gs:2403, **C** Code.gs:1801 |
| K | note | string | YES | Spring denim line review | (v2.21.0+) Meeting/PK subject line. Blank for work shifts. **C** Code.gs:2403 |

**Backend readers/writers:**
- `createShiftsTab()` — writes header row **C** Code.gs:2401
- `getSheetData(CONFIG.TABS.SHIFTS)` — reads all rows **C** Code.gs:387
- `getAllData()` — reads shifts, normalizes missing `type` → 'work', missing `note` → '' **C** Code.gs:1606
- `getShifts()` — public read endpoint **C** Code.gs:1627
- `saveShift()` — upsert single shift; checks uniqueness key (empId, date, type); handles deletion **C** Code.gs:1634
- `batchSaveShifts()` — bulk upsert/delete via Sheets.Spreadsheets.Values.update(); one API call for N rows **C** Code.gs:1800
- `bulkCreatePKEvent()` — bulk-insert PK rows for multiple employees; dupe-skips on (empId, date) **C** Code.gs:1908
- `submitShiftOffer()` — reads offerer's work shift to validate transferability **C** Code.gs:1010
- `submitSwapRequest()` — reads both parties' work shifts to validate swappability **C** Code.gs:1269
- `checkExpiredRequests()` — reads all shift dates to mark stale requests **C** Code.gs:2055

**Frontend consumers:**
- `App.jsx:loadAllData()` — destructures shifts array from getAllData, partitions into shiftsObj (work) and eventsObj (meeting/pk/sick) **C** src/App.jsx:311
- `collectPeriodShiftsForSave()` — reads shiftsObj[key] and eventsObj[key] to serialize rows for batchSaveShifts **C** src/utils/scheduleOps.js:5
- `applyShiftMutation()` — updates local shifts/events state before API call **C** src/utils/scheduleOps.js:66
- `ScheduleCell` — renders shift role color, time, duration **C** src/components/ScheduleCell.jsx
- `EmployeeRow` — aggregates daily shifts/events and renders; calls saveShift on change **C** src/components/EmployeeRow.jsx
- `ShiftEditorModal` — reads/writes individual shift: date, startTime, endTime, role, task, type, note **C** src/modals/ShiftEditorModal.jsx
- `collectPeriodShiftsForSave()` — ensures work + meeting + pk each get their own row with correct type **C** src/utils/scheduleOps.js:5

**Quirks:**
- `type` column (v2.21.0+) added as col J; older rows may lack this column entirely in live Sheets. On read, missing type defaults to 'work'. **C** Code.gs:1606
- `note` column (v2.21.0+) added as col K; on read, missing note defaults to ''. **C** Code.gs:1606
- Date objects in Sheets (col E) are parsed to 'yyyy-MM-dd' ISO strings. Time objects (cols F-G) are parsed to 'HH:mm' strings (1899 epoch format on Sheets). **C** Code.gs:379
- Uniqueness key is (employeeId, date, type) for work/pk/sick (singular per day); meetings allow N per (empId, date) and are keyed by row id. Back-compat: legacy rows pre-meeting without id are assigned synthetic id on batchSaveShifts. **C** Code.gs:1801
- A single employee can have up to 1 work + 1 pk + N meetings + 1 sick entry per day. Work and sick are mutually exclusive (sick intercepts and zeros the day's hours). **D** ARCHITECTURE.md § Shift State
- Only work shifts are transferable (offer/swap); meetings and PK events cannot be offered/swapped. **C** Code.gs:1015, 1274
- Sick day entries stored in `events` array on frontend; do not appear as rows in Shifts tab (stored in Settings tab as a computed flag, or inferred from events[key] filter). **D** ARCHITECTURE.md § Shift State

---

## Tab 3: Settings

**Purpose:** Key-value configuration store for store info, staffing targets, live periods, store hours overrides, and admin password.

| Column Letter | Header Name | Type | Nullable? | Example Value | Notes |
|---|---|---|---|---|---|
| A | key | string | NO | adminPassword, storeName, storeEmail, storeAddress, storePhone, livePeriods, staffingTargets, storeHoursOverrides, staffingTargetOverrides, etc. | Lookup key. Each row is a unique key. **C** Code.gs:2414 |
| B | value | string | YES | 1337, Over the Rainbow, [2026-01-26, 2026-02-09, ...], {...}, etc. | Value stored as string (or JSON string for objects). Varies by key. **C** Code.gs:2414 |

**Settings schema (known keys):**

| Key | Value Type | Purpose | Example / Notes |
|---|---|---|---|
| adminPassword | string | Hardcoded admin panel password (legacy; not used by app) | 1337 |
| storeName | string | Store display name | Over the Rainbow |
| storeEmail | string | Store contact email for admin | sarvi@rainbowjeans.com |
| storeAddress | string | Store physical address | (optional) |
| storePhone | string | Store phone number | (optional) |
| livePeriods | CSV-formatted string of ISO dates | Pay periods currently visible to employees | `2026-01-26,2026-02-09,2026-02-23` (comma-separated ISO dates; NOT JSON) **C** Code.gs:1577 |
| staffingTargets | JSON string | Staffing headcount targets per day of week | `{"sunday":15,"monday":8,"tuesday":8,"wednesday":8,"thursday":8,"friday":10,"saturday":15}` **C** Code.gs:1582 |
| storeHoursOverrides | JSON string | Store open/close hours for specific dates (holidays, special hours) | `{"2026-02-14":{"open":"10:00","close":"21:00"}}` **C** Code.gs:1589 |
| staffingTargetOverrides | JSON string | Staffing target overrides for specific dates | `{"2026-02-14":12}` (override to 12 staff on Valentine's Day) **C** Code.gs:1597 |

**Backend readers/writers:**
- `createSettingsTab()` — writes headers + seed rows (adminPassword, storeName, storeEmail, storeAddress, storePhone) **C** Code.gs:2413
- `getSheetData(CONFIG.TABS.SETTINGS)` — reads all key-value pairs **C** Code.gs:387
- `getAllData()` — reads and parses livePeriods (CSV → array), staffingTargets (JSON), storeHoursOverrides (JSON), staffingTargetOverrides (JSON) **C** Code.gs:1576
- `saveLivePeriods()` — writes CSV string to livePeriods key **C** Code.gs:1727
- `saveStaffingTargets()` — writes JSON string to staffingTargets key **C** Code.gs:1746
- `saveSetting()` — generic write to any key (if exists, update cell; else append row) **C** Code.gs:1769

**Frontend consumers:**
- `App.jsx:loadAllData()` — destructures settings, livePeriods, staffingTargets, storeHoursOverrides, staffingTargetOverrides from response **C** src/App.jsx:310
- `App.jsx` — uses livePeriods to filter visible pay periods **C** src/App.jsx:317
- `storeHoursOverrides.js` — merges override hours with STORE_HOURS base; used for availability checks **C** src/utils/storeHoursOverrides.js
- Schedule grid rendering — uses staffingTargets to set staffing bar targets **C** src/components/StaffingBar.jsx

**Quirks:**
- `livePeriods` is NOT JSON; it's a comma-separated string of ISO dates. Backend splits on ',' and filters empty. **C** Code.gs:1577
- `staffingTargets`, `storeHoursOverrides`, `staffingTargetOverrides` are JSON strings on Sheets; code uses try-catch JSON.parse and falls back to null on parse error. **C** Code.gs:1582, 1589, 1597
- Any key can be added dynamically via `saveSetting()` without schema change. Old keys persist if not overwritten.

---

## Tab 4: Announcements

**Purpose:** Admin-published notices for each pay period (displayed on employee schedule view and mobile).

| Column Letter | Header Name | Type | Nullable? | Example Value | Notes |
|---|---|---|---|---|---|
| A | id | string | NO | ANN-a1b2c3d4 | Unique ID; generated as 'ANN-' + 8-char UUID substring. **C** Code.gs:2026 |
| B | periodStartDate | ISO date (yyyy-MM-dd) | NO | 2026-02-09 | Pay period start date; used as lookup key (one announcement per period). **C** Code.gs:2002 |
| C | subject | string | YES | Schedule Update | Announcement title/subject line. **C** Code.gs:2002 |
| D | message | string | YES | Please note the schedule changes for next week. | Announcement body (plaintext or markdown; rendered as-is). **C** Code.gs:2002 |
| E | updatedAt | ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ) | NO | 2026-02-09T14:30:45.123Z | Last update timestamp. **C** Code.gs:2024 |

**Backend readers/writers:**
- `createAnnouncementsTab()` — writes header row **C** Code.gs:2432
- `getSheetData(CONFIG.TABS.ANNOUNCEMENTS)` — reads all rows **C** Code.gs:387
- `getAllData()` — reads all announcements **C** Code.gs:1576
- `saveAnnouncement()` — upsert by periodStartDate; if exists, updates subject/message/updatedAt; else inserts new row **C** Code.gs:2002
- `deleteAnnouncement()` — deletes row by periodStartDate **C** Code.gs:2030

**Frontend consumers:**
- `App.jsx:loadAllData()` — destructures announcements array from getAllData **C** src/App.jsx:310
- `EmployeeView` — reads current announcement for display banner **C** src/views/EmployeeView.jsx
- `AdminAnnouncementsPanel` — reads/writes announcements **C** src/panels/AdminAnnouncementsPanel.jsx

**Quirks:**
- One announcement per pay period (unique on periodStartDate). Updates replace subject/message/updatedAt; deletes remove the row entirely. **C** Code.gs:2002

---

## Tab 5: ShiftChanges

**Purpose:** Audit log for all shift request workflows: time-off, shift offers, and shift swaps. Tracks status transitions, decision timestamps, and participant notes.

| Column Letter | Header Name | Type | Nullable? | Example Value | Notes |
|---|---|---|---|---|---|
| **Common (A-J)** |
| A | requestId | string | NO | TOR-abc12345, OFFER-abc12345, SWAP-abc12345 | Unique ID; generated per request type. Format: `${TYPE}-${Utilities.getUuid().substring(0, 8)}`. **C** Code.gs:841, 1034, 1287 |
| B | requestType | string (enum) | NO | time_off, shift_offer, shift_swap | Type of request. **C** Code.gs:2450 |
| C | employeeName | string | NO | John Smith | Requester name; denormalized from Employees.name. **C** Code.gs:854, 1041, 1294 |
| D | employeeEmail | string | NO | john@example.com | Requester email; denormalized from Employees.email. **C** Code.gs:854, 1041, 1294 |
| E | status | string (enum) | NO | pending, approved, denied, cancelled, revoked, accepted, declined, rejected, awaiting_recipient, awaiting_admin, awaiting_partner, partner_rejected, recipient_rejected, expired | Request status. Semantics vary by requestType. **C** Code.gs:2450 |
| F | createdTimestamp | ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ) | NO | 2026-02-09T14:30:45.123Z | Request submission timestamp. **C** Code.gs:841, 1034, 1287 |
| G | decidedTimestamp | ISO timestamp or empty | YES | 2026-02-10T09:15:30.000Z | Timestamp when admin approved/denied/rejected. Empty if still pending. **C** Code.gs:893, 918 |
| H | decidedBy | email string or empty | YES | sarvi@rainbowjeans.com | Email of admin who decided. Empty if still pending. **C** Code.gs:893, 918 |
| I | revokedTimestamp | ISO timestamp or empty | YES | 2026-03-01T10:00:00.000Z | Timestamp if approved request was later revoked. **C** Code.gs:974 |
| J | revokedBy | email string or empty | YES | sarvi@rainbowjeans.com | Email of admin who revoked. **C** Code.gs:974 |
| **Time Off (K-L)** |
| K | datesRequested | CSV date string | YES | 2026-02-09,2026-02-10,2026-02-11 | Comma-separated ISO dates requested off. Only populated for requestType='time_off'. **C** Code.gs:862 |
| L | reason | string | YES | Family emergency | Reason for time-off request. **C** Code.gs:862 |
| **Shift Offers (M-V)** |
| M | recipientName | string | YES | Jane Doe | Recipient name; denormalized from Employees.name. **C** Code.gs:1047 |
| N | recipientEmail | string | YES | jane@example.com | Recipient email; denormalized from Employees.email. **C** Code.gs:1047 |
| O | shiftDate | ISO date (yyyy-MM-dd) | YES | 2026-02-09 | Shift date being offered. **C** Code.gs:1047 |
| P | shiftStart | HH:mm string | YES | 10:00 | Shift start time. **C** Code.gs:1047 |
| Q | shiftEnd | HH:mm string | YES | 18:00 | Shift end time. **C** Code.gs:1047 |
| R | shiftRole | string | YES | cashier, mens, etc. | Shift role/assignment. **C** Code.gs:1047 |
| S | recipientNote | string | YES | I can work this shift | Note from recipient when accepting/declining. **C** Code.gs:1076, 1104 |
| T | recipientRespondedTimestamp | ISO timestamp or empty | YES | 2026-02-09T16:00:00.000Z | When recipient accepted/declined. **C** Code.gs:1076, 1104 |
| U | adminNote | string | YES | Approved - no conflicts | Admin note when approving/rejecting. **C** Code.gs:1167 |
| V | cancelledTimestamp | ISO timestamp or empty | YES | 2026-02-10T09:00:00.000Z | When offerer cancelled. **C** Code.gs:1123 |
| **Shift Swaps (W-AI)** |
| W | partnerName | string | YES | Jane Doe | Partner name; denormalized. **C** Code.gs:1300 |
| X | partnerEmail | string | YES | jane@example.com | Partner email; denormalized. **C** Code.gs:1300 |
| Y | initiatorShiftDate | ISO date (yyyy-MM-dd) | YES | 2026-02-09 | Initiator's shift date. **C** Code.gs:1300 |
| Z | initiatorShiftStart | HH:mm string | YES | 10:00 | Initiator's shift start. **C** Code.gs:1300 |
| AA | initiatorShiftEnd | HH:mm string | YES | 18:00 | Initiator's shift end. **C** Code.gs:1300 |
| AB | initiatorShiftRole | string | YES | mens | Initiator's shift role. **C** Code.gs:1300 |
| AC | partnerShiftDate | ISO date (yyyy-MM-dd) | YES | 2026-02-10 | Partner's shift date. **C** Code.gs:1300 |
| AD | partnerShiftStart | HH:mm string | YES | 14:00 | Partner's shift start. **C** Code.gs:1300 |
| AE | partnerShiftEnd | HH:mm string | YES | 22:00 | Partner's shift end. **C** Code.gs:1300 |
| AF | partnerShiftRole | string | YES | cashier | Partner's shift role. **C** Code.gs:1300 |
| AG | partnerNote | string | YES | Sounds good | Note from partner when accepting/declining. **C** Code.gs:1329, 1357 |
| AH | partnerRespondedTimestamp | ISO timestamp or empty | YES | 2026-02-09T17:00:00.000Z | When partner accepted/declined. **C** Code.gs:1329, 1357 |
| AI | swapAdminNote | string | YES | Approved | Admin note when approving/rejecting. **C** Code.gs:1429 |

**Backend readers/writers:**
- `createShiftChangesTab()` — writes header row (auto-created on first request if missing) **C** Code.gs:2444
- `getSheetData(CONFIG.TABS.SHIFT_CHANGES)` — reads all rows **C** Code.gs:387
- `getAllData()` — reads all requests **C** Code.gs:1576
- `submitTimeOffRequest()` — writes time_off row **C** Code.gs:825
- `cancelTimeOffRequest()` — updates status → cancelled, sets decidedTimestamp/decidedBy **C** Code.gs:879
- `approveTimeOffRequest()` — updates status → approved, sets decidedTimestamp/decidedBy **C** Code.gs:904
- `denyTimeOffRequest()` — updates status → denied, sets decidedTimestamp/decidedBy, adminNote **C** Code.gs:936
- `revokeTimeOffRequest()` — updates status → revoked, sets revokedTimestamp/revokedBy **C** Code.gs:962
- `submitShiftOffer()` — writes shift_offer row **C** Code.gs:990
- `acceptShiftOffer()` — updates status → awaiting_admin, sets recipientNote/recipientRespondedTimestamp **C** Code.gs:1061
- `declineShiftOffer()` — updates status → recipient_rejected, sets recipientNote/recipientRespondedTimestamp **C** Code.gs:1085
- `cancelShiftOffer()` — updates status → cancelled, sets cancelledTimestamp **C** Code.gs:1103
- `approveShiftOffer()` — updates status → approved, sets decidedTimestamp/decidedBy, adminNote **C** Code.gs:1137
- `rejectShiftOffer()` — updates status → rejected, sets decidedTimestamp/decidedBy, adminNote **C** Code.gs:1192
- `revokeShiftOffer()` — updates status → revoked, sets revokedTimestamp/revokedBy **C** Code.gs:1216
- `submitSwapRequest()` — writes shift_swap row **C** Code.gs:1249
- `acceptSwapRequest()` — updates status → awaiting_admin, sets partnerNote/partnerRespondedTimestamp **C** Code.gs:1309
- `declineSwapRequest()` — updates status → partner_rejected, sets partnerNote/partnerRespondedTimestamp **C** Code.gs:1341
- `cancelSwapRequest()` — updates status → cancelled **C** Code.gs:1369
- `approveSwapRequest()` — updates status → approved, sets decidedTimestamp/decidedBy, swapAdminNote **C** Code.gs:1393
- `rejectSwapRequest()` — updates status → rejected, sets decidedTimestamp/decidedBy, swapAdminNote **C** Code.gs:1453
- `revokeSwapRequest()` — updates status → revoked, sets revokedTimestamp/revokedBy **C** Code.gs:1485
- `checkExpiredRequests()` — updates status → expired for stale pending requests **C** Code.gs:2055

**Frontend consumers:**
- `App.jsx:loadAllData()` — destructures requests array from getAllData; partitions into timeOff, offers, swaps **C** src/App.jsx:324
- `AdminRequestPanel` — displays all pending requests for admin approval **C** src/panels/AdminRequestPanel.jsx
- `RequestTimeOffModal` — frontend form for time-off submission **C** src/modals/RequestTimeOffModal.jsx
- `RequestOfferModal` — frontend form for shift offer **C** src/modals/RequestOfferModal.jsx
- `RequestSwapModal` — frontend form for shift swap **C** src/modals/RequestSwapModal.jsx
- `EmployeeView` — displays incoming requests (offers, swaps) for employee action **C** src/views/EmployeeView.jsx

**Quirks:**
- ShiftChanges tab is created on first request submission if missing (not by setupSpreadsheet). **C** Code.gs:351
- `requestId` is unique; query by requestId, not row index. **C** Code.gs:841, 1034, 1287
- Status transitions are directed graphs: pending → approved/denied; awaiting_recipient → recipient_rejected/awaiting_admin; awaiting_admin → approved/rejected. Approved can then be revoked. **C** Code.gs:2450
- Time-off requests can have multiple dates (comma-separated); offers/swaps have single date pairs. **C** Code.gs:862, 1047, 1300
- Recipient/partner names and emails are denormalized snapshots taken at request creation; they do NOT update if the employee's email/name changes later. **C** Code.gs:854, 1041, 1294
- Fields are sparsely populated by request type: time-off uses columns K-L; offers use M-V; swaps use W-AI. Columns for other types are left empty. **C** Code.gs:2450
- `decidedTimestamp` and `revokedTimestamp` are ISO 8601 timestamps (with milliseconds). **C** Code.gs:893, 918, 974
- No explicit "archived" or "deleted" flag; old requests remain in the tab indefinitely.

---

## Data Shape Quirks & Migration Considerations

### 1. Boolean-as-String in Sheets
**Employees columns H-L, all boolean fields:** stored as 'TRUE' / 'FALSE' strings (not JSON booleans, not 1/0).
- **Implication for migration:** Postgres should use BOOLEAN type, but backend/frontend must explicitly coerce. Code currently relies on truthy/falsy in boolean context (e.g., `if (employee.active)` reads the string 'TRUE' as truthy). **L** LESSONS.md (type-coercion)
- **Risk:** Post-migration, explicit boolean checks (e.g., `=== true` or `!== false`) may break if conversion is not rigorous.

### 2. JSON Fields Stored as Strings
**Employees:** `availability`, `defaultShift`
**Settings:** `livePeriods` (CSV, not JSON), `staffingTargets`, `storeHoursOverrides`, `staffingTargetOverrides`
- **Implication:** Sheets stores these as text; backend reads them as strings, frontend JSON.parse's on consumption.
- **Migration path:** Move to JSONB columns in Postgres. Backend code currently calls JSON.parse inline; keep that pattern initially, or migrate to native JSON columns and adjust serialization layer.

### 3. Date Objects → ISO Strings
**Employees columns G, Shifts columns E, Announcements column B, ShiftChanges date columns:** All date-typed cells in Sheets become Date objects on getDataRange().getValues(); parseSheetValues_ reformats to 'yyyy-MM-dd' ISO strings.
- **Implication:** Dates are normalized to strings in the data layer; frontend and backend consume ISO strings, never Date objects from the backend API.
- **Migration path:** Postgres DATE type. Ensure serialization layer continues to emit 'yyyy-MM-dd' strings (or switch to ISO 8601 full timestamps).

### 4. Time Objects → HH:mm Strings (1899 Epoch)
**Shifts columns F-G (startTime, endTime), ShiftChanges columns P, Q, Z, AA, AD, AE:** Time-typed cells in Sheets are 1899-epoch Date objects; parseSheetValues_ reformats to 'HH:mm' strings.
- **Implication:** Times are 24-hour HH:mm strings; backend never touches time math (duration computed on frontend).
- **Migration path:** Postgres TIME type or varchar(5). Ensure serialization continues to emit 'HH:mm' format for frontend compatibility.

### 5. Empty String ≠ Null
**All columns:** Sheets stores empty cells as empty strings ''; backend/frontend treat empty string as falsy but not null.
- **Implication:** Queries like `if (employee.phone)` work but `if (employee.phone === null)` will fail.
- **Migration path:** Postgres allows NULL; decide per column whether to normalize empty strings to NULL or keep empty string convention. Code likely relies on `|| ''` fallbacks; keep consistent.

### 6. Numeric Coercion
**Employees column D (password):** Sheets may auto-store numeric-looking values (e.g., '001') as numbers. Code always wraps with `String()` for safe comparison.
- **Implication:** Backend auth compares via `String(plaintextPw)`.
- **Migration path:** Store as TEXT in Postgres; coercion is safer.

### 7. Soft Deletes
**Employees column L (deleted):** Soft-delete flag; deleted employees remain in Sheets, never physically removed. Frontend/backend filters them out via `!e.deleted` checks.
- **Implication:** No cascade deletes; cleanup is logical, not physical.
- **Migration path:** Keep the `deleted` boolean column. Consider adding cascade policy or partition strategy if needed.

### 8. Denormalized Audit Fields
**Shifts columns C-D (employeeName, employeeEmail), ShiftChanges columns C-D, M-N, W-X:** Denormalized snapshots of employee identity at row creation.
- **Implication:** If an employee's name/email changes, existing shift/request rows are NOT updated; they carry the old snapshot.
- **Migration path:** Accept denormalization as intentional for audit trail immutability. Do not add foreign key constraints; these columns are snapshots.

### 9. Uniqueness Keys (Not Primary Keys)
**Shifts:** Uniqueness is (employeeId, date, type); no explicit primary key column in Sheets (id is synthetic/optional).
**Announcements:** Uniqueness is periodStartDate; one announcement per period.
**ShiftChanges:** requestId is unique; no other uniqueness constraint.
**Employees:** id is primary key; email is unique (enforced in saveEmployee via DUPLICATE_EMAIL check).
- **Implication:** Backend enforces uniqueness in code (e.g., `batchSaveShifts` deduplicates by key). Sheets has no constraints.
- **Migration path:** Add explicit PRIMARY KEY and UNIQUE constraints in Postgres.

### 10. Missing Columns on Older Rows
**Shifts columns J-K (type, note):** v2.21.0 addition. Older rows created before this version may lack these columns entirely. On read, code defaults missing `type` → 'work' and missing `note` → ''.
- **Implication:** Backend handles nulls gracefully. Frontend assumes `type` and `note` are always present.
- **Migration path:** During migration, backfill NULL values to 'work' and '' respectively. Verify frontend code doesn't break on null.

### 11. No Explicit Timestamp Types
**All timestamps (createdTimestamp, decidedTimestamp, etc.):** Stored as ISO 8601 strings (with milliseconds), not as date objects.
- **Implication:** String comparison works (e.g., `'2026-02-09T14:30:45.123Z' > '2026-02-09T10:00:00.000Z'`); but no database-level temporal indexing.
- **Migration path:** Use Postgres TIMESTAMP WITH TIME ZONE for temporal queries. Serialization layer can continue emitting ISO 8601 strings.

### 12. Case Sensitivity in Email Lookups
**Login, saveEmployee, all request endpoints:** Email comparisons use `.toLowerCase()` for case-insensitive matching. Sheets stores original case.
- **Implication:** `john@example.com` and `JOHN@EXAMPLE.COM` are treated as the same user.
- **Migration path:** Add UNIQUE constraint on LOWER(email) or use a collation-aware index in Postgres.

---

## Not Found in Code (Hypothesis)

**Roles Tab:** The task description mentioned discovering a "Roles" tab, but no reference to a `Roles` sheet exists in Code.gs. The 8 role IDs (cashier, mens, womens, etc.) are hardcoded in `src/constants.js:ROLES` and `src/theme.js`. No separate Sheets tab for roles configuration was found.
- **Verification:** Search `createRolesTab` and `CONFIG.TABS.ROLES` — no matches. **L** hypothesis falsified by code search.

---

## Summary Table: Tabs & Column Count

| Tab Name | Primary Purpose | Column Count | Header Columns |
|---|---|---|---|
| Employees | Employee master + auth + availability | 24 | A-X |
| Shifts | Work shifts + meetings + PK events | 11 | A-K |
| Settings | Key-value config (store info, targets, overrides) | 2 | key, value (N rows) |
| Announcements | Period-scoped admin notices | 5 | A-E |
| ShiftChanges | Request audit log (time-off, offers, swaps) | 35 | A-AI |
| **Total** | | **104** | |

---

## Flags for Main Session Review

1. **Email Uniqueness Case-Insensitive:** Code uses `.toLowerCase()` for email comparisons. Postgres UNIQUE constraint on email should also be case-insensitive (use COLLATE or LOWER() function). Verify that email column migration respects this.

2. **Boolean Coercion Risk:** Sheets stores booleans as 'TRUE'/'FALSE' strings. Post-migration, any code that checks `=== true` instead of truthy/falsy will fail. Audit all boolean comparisons in src/ and backend/ before migration.

3. **Date/Time Format Stability:** Serialization layer currently emits 'yyyy-MM-dd' for dates and 'HH:mm' for times. Postgres types (DATE, TIME) are flexible; verify frontend code doesn't assume string format or break on NULL.

4. **Missing Columns on Older Rows:** Shifts columns J (type) and K (note) were added v2.21.0. Live Sheets may have rows without these columns. Migration SQL should back-fill missing type → 'work' and missing note → '' for historical continuity.

5. **Denormalized Snapshots Not Updated:** employeeName/employeeEmail in Shifts and ShiftChanges are immutable snapshots. Do not add foreign key constraints to Employees; treat as audit trail fields. Ensure migration retains this semantics.

6. **adminTier and title v2.26.0 Additions:** Employees columns W (adminTier) and X (title) were added recently. Live Sheets may have rows with empty values. Migration should preserve empty strings (not NULL) for columns added after initial row creation.

7. **No Primary Key on Shifts:** Shifts tab has no explicit id field used as primary key in Sheets. The id field (col A) is synthetic/optional (missing on legacy rows). Postgres migration should add an explicit PK (auto-increment integer) or composite (employeeId, date, type).

8. **Settings Tab is Sparse:** Settings has only 2 columns (key, value); known keys are hardcoded in backend code (livePeriods, staffingTargets, etc.). Migration should preserve the key-value pattern or denormalize to columns; either way, ensure no new code assumes a fixed schema (allow dynamic key insertion).

9. **No Cascade Delete:** Employees are soft-deleted (deleted=TRUE); no physical row removal. Shifts and Requests remain even after an employee is deleted. Clarify post-migration whether to implement cascade logic or keep soft-delete model.

10. **requestId Uniqueness:** ShiftChanges uses requestId (TOR-xxx, OFFER-xxx, SWAP-xxx) as unique identifier, not row number. Ensure migration preserves uniqueness constraint and backend code continues to query by requestId.

---

