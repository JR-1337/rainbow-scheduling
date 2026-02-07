# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAINBOW Scheduling App — a two-sided retail scheduling platform for OTR/Rainbow Jeans (Ontario, Canada). Employees view shifts and submit time-off/swap/offer requests; admins build schedules, manage requests, and publish announcements. Live at https://rainbow-scheduling.vercel.app.

**Stakeholders:** JR (owner/developer), Sarvi (scheduling admin — receives all request notifications).

## Tech Stack

- **Frontend:** React 18+ (functional components, hooks), Tailwind CSS, Lucide React icons
- **Backend:** Google Apps Script (Code.gs v2.10), Google Sheets as database (5 tabs)
- **Deployment:** Vercel (frontend, auto-deploys on GitHub commit), Google Apps Script Web App (backend, manual deploy)
- **Email:** Apps Script MailApp, sender name "OTR Scheduling"
- **Compliance:** Ontario Employment Standards Act (44hr/week overtime threshold)

## Repository Structure

**Start here:** Read `PLAN.md` (repo root) for current roadmap, session history, and what's in progress. It complements this file — CLAUDE.md covers architecture/conventions, PLAN.md covers project direction and progress.

**Git workflow:** Code lives in `src/`. Claude edits files in `src/`, commits, and pushes. Vercel auto-deploys from GitHub on push to `main`. `Code.gs` is maintained separately (copy into Google Apps Script editor manually).

All active code lives in `src/`:

| File | Lines | Purpose |
|------|-------|---------|
| `src/App.jsx` | ~8,200 | Main React app — login, admin desktop view, mobile admin if-branch, employee desktop view, all modals, state management, shared exports |
| `src/MobileEmployeeView.jsx` | ~440 | Mobile employee components: frozen grid, hamburger drawer, My Schedule tab, announcement popup |
| `src/MobileAdminView.jsx` | ~430 | Mobile admin components: schedule grid, request review panels, announcement panel, employee quick-view |
| `src/main.jsx` | — | Vite entry point |
| `src/index.css` | — | Tailwind CSS imports |

## Architecture

### Frontend Rendering Model

The app conditionally renders based on two axes — **role** (admin vs employee) and **device** (mobile vs desktop via `useIsMobile()` hook at 768px breakpoint):

- **Admin + Desktop:** Full schedule grid with inline editing, auto-populate toolbar, employee management, admin settings, PDF export, email publish
- **Admin + Mobile:** `if (isMobileAdmin)` branch inside main App component (direct state access, no prop drilling) — tab-based view (Schedule/Requests/Mine/Comms) with tap-to-edit cells
- **Employee + Desktop:** Read-only schedule grid with request submission panels in sidebar
- **Employee + Mobile:** Separate `EmployeeView` component — card-based "My Schedule" with hamburger drawer for shift changes

**Why mobile admin is an if-branch, not a separate component:** The admin view needs access to 30+ pieces of state (shifts, employees, requests, edit mode, period data). An if-branch in App avoids massive prop drilling. Mobile employee is a separate component because it only needs published data.

### Shared Code Pattern

`App.jsx` exports `THEME`, `ROLES`, `formatDate`, `formatTimeDisplay`, `parseTime`, `formatTimeShort`. Both mobile files import from `./App` — single source of truth, no circular dependencies.

### State Architecture

Key state lives in the main `App` component:
- `shifts` keyed as `${employeeId}-${dateStr}` for O(1) lookup
- `editModeByPeriod[periodIndex]` — each 14-day pay period tracked independently
- `publishedShifts` — only shifts from LIVE periods, shown to employees (draft shifts hidden)
- Request state split by type: `timeOffRequests`, `shiftOffers`, `shiftSwaps`
- `unsavedChanges` — tracks whether current edits need saving before publish

### Three-State Save Button

The admin save/publish button (both mobile and desktop) has three states:
1. **SAVE** (blue) — unsaved changes exist → persists shifts to backend, stays in edit mode
2. **GO LIVE** (green) — no unsaved changes + in edit mode → locks schedule, publishes to employees, emails all scheduled staff
3. **EDIT** (yellow) — period is LIVE → re-enters edit mode for modifications

### Chunked Batch Save

Google Apps Script GET URL limit (~8KB) forces splitting large saves into 15-shift chunks. Progress toast shows live counter (15/80, 30/80...). Last chunk triggers cleanup of deleted shifts. If URL exceeds 6KB, tries POST first (text/plain to avoid CORS preflight), falls back to chunked GET.

### API Communication

All frontend→backend communication goes through `apiCall(action, payload)` using GET with URL params: `?action=NAME&payload=JSON`. Backend `doGet()` dispatches on the `action` parameter.

### Date/Time Handling

- Frontend uses ISO `YYYY-MM-DD` for dates, `HH:mm` for times
- Google Sheets returns Date objects; times use 1899 epoch
- `Code.gs` `getSheetData()` normalizes all dates/times before returning data
- Pay periods are 14-day blocks starting from `PAY_PERIOD_START` (2026-01-26, Monday)
- `formatTimeDisplay`, `parseTime`, `formatTimeShort` all handle undefined values safely (added after production bugs)

### Per-Date Override Pattern

Weekly defaults (staffing targets, store hours) can be overridden per date. Overrides stored as JSON in the Settings tab (`storeHoursOverrides`, `staffingTargetOverrides`). Overridden dates show cyan-tinted text. Past dates show headcount only (no target comparison or color coding).

## Google Sheets Schema (5 Tabs)

**CRITICAL: These column headers are exact. Do not rename, reorder, or omit fields.**

### Employees Tab (17 columns, A-Q)
```
id | name | email | password | phone | address | dob | active | isAdmin | isOwner | showOnSchedule | deleted | availability | counterPointId | adpNumber | rateOfPay | employmentType
```
- `availability`: JSON string — `{ "sunday": { "available": true, "start": "11:00", "end": "18:00" }, ... }`
- `employmentType`: `"full-time"` | `"part-time"` | `""`
- `counterPointId`, `adpNumber`: Reserved for future POS/payroll integration — exist in schema, HIDDEN from UI, do not remove
- `password`: Default = employee ID. Sheets may store as number — always use `String()` for comparisons

### Shifts Tab (9 columns, A-I)
```
id | employeeId | employeeName | employeeEmail | date | startTime | endTime | role | task
```
- Always store `employeeName` alongside `employeeId` (audit trail)
- `role`: One of `cashier`, `backupCashier`, `mens`, `womens`, `floorMonitor`, `none`
- `task`: Optional free-text task description

### Settings Tab (2 columns: key, value)
```
key | value
```
Known keys:
- `adminPassword` — admin login password
- `storeName` — "Over the Rainbow"
- `storeEmail`, `storeAddress`, `storePhone`
- `livePeriods` — JSON array of period start dates that are published
- `staffingTargets` — JSON: `{"sunday":15,"monday":8,...}`
- `storeHoursOverrides` — JSON: `{"2026-02-14":{"open":"10:00","close":"21:00"},...}`
- `staffingTargetOverrides` — JSON: `{"2026-02-14":12,...}`

### Announcements Tab (5 columns, A-E)
```
id | periodStartDate | subject | message | updatedAt
```

### ShiftChanges Tab (35 columns, A-AI)
```
Common (A-J):     requestId | requestType | employeeName | employeeEmail | status | createdTimestamp | decidedTimestamp | decidedBy | revokedTimestamp | revokedBy
Time Off (K-L):   datesRequested | reason
Offers (M-V):     recipientName | recipientEmail | shiftDate | shiftStart | shiftEnd | shiftRole | recipientNote | recipientRespondedTimestamp | adminNote | cancelledTimestamp
Swaps (W-AI):     partnerName | partnerEmail | initiatorShiftDate | initiatorShiftStart | initiatorShiftEnd | initiatorShiftRole | partnerShiftDate | partnerShiftStart | partnerShiftEnd | partnerShiftRole | partnerNote | partnerRespondedTimestamp | swapAdminNote
```
- `requestType`: `"timeOff"` | `"offer"` | `"swap"`
- `status`: `"pending"` | `"approved"` | `"denied"` | `"cancelled"` | `"revoked"` | `"accepted"` | `"declined"` | `"rejected"`

## API Endpoints (all via `doGet` action parameter)

### Auth
`login`, `changePassword`, `resetPassword`

### Data Retrieval
`getAllData`, `getEmployees`, `getShifts`, `getEmployeeRequests`, `getAdminQueue`, `getIncomingOffers`, `getIncomingSwaps`

### Shifts & Config
`saveShift`, `batchSaveShifts`, `saveEmployee`, `saveLivePeriods`, `saveStaffingTargets`, `saveSetting`

### Announcements
`saveAnnouncement`, `deleteAnnouncement`

### Time Off (5)
`submitTimeOffRequest`, `cancelTimeOffRequest`, `approveTimeOffRequest`, `denyTimeOffRequest`, `revokeTimeOffRequest`

### Shift Offers (7)
`submitShiftOffer`, `acceptShiftOffer`, `declineShiftOffer`, `cancelShiftOffer`, `approveShiftOffer`, `rejectShiftOffer`, `revokeShiftOffer`

### Shift Swaps (7)
`submitSwapRequest`, `acceptSwapRequest`, `declineSwapRequest`, `cancelSwapRequest`, `approveSwapRequest`, `rejectSwapRequest`, `revokeSwapRequest`

## Request Workflow

All three request types follow a similar pattern:
1. Employee submits → system emails Sarvi
2. For offers/swaps: recipient must accept/decline first
3. Admin approves/denies (or rejects after acceptance)
4. System emails result to all parties
5. Employee can cancel own PENDING requests
6. Admin can revoke APPROVED requests for FUTURE dates only

## Roles & Colors

| ID | Short | Full Name | Color |
|----|-------|-----------|-------|
| `cashier` | Cash | Cashier | `#8B5CF6` |
| `backupCashier` | Cash2 | Backup Cashier | `#A78BFA` |
| `mens` | Men's | Men's Section | `#3B82F6` |
| `womens` | Women's | Women's Section | `#F472B6` |
| `floorMonitor` | Monitor | Floor Monitor | `#F59E0B` |
| `none` | None | No Role | `#475569` |

## Deployment

### Frontend (Vercel)
Push to GitHub triggers auto-deploy. No build configuration files in repo — Vercel handles build.

### Backend (Google Apps Script)
1. Update `Code.gs` in the Apps Script editor
2. Deploy > Manage deployments > Edit active deployment
3. Execute as: "Me", Access: "Anyone with Google Account"
4. Update `API_URL` in `App.jsx` if deployment URL changes

### Configuration Constants
- `API_URL` in `App.jsx` — active Apps Script deployment URL
- `CONFIG.SPREADSHEET_ID` in `Code.gs` — target Google Sheets ID (empty = uses active spreadsheet)
- `CONFIG.ADMIN_EMAIL` in `Code.gs` — Sarvi's email for notifications
- `PAY_PERIOD_START` in `App.jsx` — anchor date for pay period math (2026-01-26)

## Known Gotchas & Bug History

These caused real production bugs — do not reintroduce:

1. **Password type coercion:** Google Sheets stores `"emp-1"` as a string but `"12345"` as a number. All password comparisons in Code.gs MUST use `String()` on both sides.
2. **Date objects from Sheets:** `getSheetData()` normalizes Date objects — times (1899 epoch) to `HH:mm`, dates to `YYYY-MM-DD`. Without this, frontend date matching silently fails.
3. **GET URL length limit:** Batch saving 80+ shifts exceeds ~8KB URL limit. The chunked save system splits into groups of 15. Don't bypass this.
4. **Time helper null safety:** `formatTimeDisplay`, `parseTime`, `formatTimeShort` must handle undefined/null — shifts can have empty times during creation.
5. **Draft shift privacy:** `publishedShifts` filter only includes shifts from LIVE periods. Employees must never see draft/unpublished shifts.
6. **Apps Script POST unreliability:** POST to Apps Script web apps often returns HTML redirect instead of JSON. The GET-with-params approach is the reliable workaround.

## Important Conventions

- **Audit trail:** Always store `employeeName` alongside `employeeId` in any record (shifts, requests). Never store only the ID.
- **Admin verification:** Server-side `verifyAuth(email, requiredAdmin)` on all protected endpoints.
- **Inactive employees:** Excluded from all employee-facing views and scheduling grid.
- **Request conflict detection:** Prevents overlapping time-off requests for the same dates.
- **Schedule sorting order:** Sarvi first → full-time (alphabetical) → part-time (alphabetical).
- **File naming:** Output files as `App.jsx` (not `scheduling-app.jsx`) to match GitHub repo structure.

## Desktop-Only Features (Not on Mobile)

These are intentionally excluded from mobile admin:
- Employee management (add/edit/delete)
- Auto-populate toolbar
- Admin settings (staffing targets, store hours overrides)
- PDF export

## Current Status

Phase 5.5 complete. Phase 6 candidates:
- Shared utils refactor (extract THEME, ROLES, helpers into dedicated files)
- Real device testing (all testing so far is Chrome DevTools)
- Professional sender email (dedicated Google Workspace account vs personal Gmail)
