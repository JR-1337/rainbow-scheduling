<!-- SCHEMA: ARCHITECTURE.md
Version: 5.1
Purpose: current structure, boundaries, flows, and integrations.
Write mode: overwrite the snapshot. Do not append history.

Rules:
- Snapshot of the system as it is now. Not a log of how it got here.
- Concise enough to rescan quickly. Long details belong in reference docs.
- Describe components, flows, integrations, and boundaries.
- If you catch yourself writing task state, move it to TODO.md. Rationale
  history belongs in DECISIONS.md; preferences belong in LESSONS.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.
- Update on structural change, not on routine progress.
-->

## Overview

- Retail scheduling platform for Over The Rainbow / Rainbow Jeans (Ontario apparel store).
- Employees view shifts, submit time-off/offer/swap requests.
- Admins build schedules, manage requests, publish announcements.
- Live: https://rainbow-scheduling.vercel.app

## Components

- Frontend -- React 18 + Vite + Tailwind + Lucide -- `src/`
- Backend -- Google Apps Script -- `backend/Code.gs` (~2503 lines, v2.26.0 live as of s034 redeploy)
- Data -- Google Sheets (5 tabs) -- schema in `docs/schemas/sheets-schema.md`
- Deploy -- Vercel auto on push (frontend) + Apps Script manual (backend)
- Email -- MailApp as "OTR Scheduling"

## Deploy topology

- Sheet `RAINBOW SCHEDULING DATABASE` owner == `otr.scheduler@gmail.com` (file id `1LlhhT9f6ewEfWqdoe0-j5hnVNKiA1pSfEFBAzSo3v8A`)
- Apps Script project lives in `otr.scheduler@gmail.com` Drive as STANDALONE (not container-bound to the Sheet)
- Live `/exec` deploy fingerprint: `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu9UbXvSXddI0xy-5hQl8kkfpSSQ` (in `src/utils/api.js:6`)
- Access: script.google.com directly while otr.scheduler is the active session. Extensions -> Apps Script from the Sheet returns "can't be found" because no binding exists
- s031 nuke-and-pave (commit `33afa4b`) moved Sheet + Script + Deploy + email-sender identity to otr.scheduler in one Make-a-copy

## Key Files

- `src/App.jsx` (~2512) -- main App component, state, shared exports
- `src/views/EmployeeView.jsx` -- extracted employee desktop/mobile view
- `src/MobileEmployeeView.jsx` -- mobile components: MobileAlertsSheet, MobileBottomNav, MobileBottomSheet
- `src/MobileAdminView.jsx` -- admin mobile view
- `src/theme.js` -- THEME / TYPE / OTR accent palette
- `src/constants.js` -- ROLES / ROLES_BY_ID / `DESKTOP_SCHEDULE_GRID_TEMPLATE` (240px + 7fr) / REQUEST_STATUS_COLORS / OFFER/SWAP / EVENT_TYPES / PRIMARY_CONTACT_EMAIL
- `src/components/` -- LoginScreen, ColumnHeaderEditor, ScheduleCell, EmployeeRow, CollapsibleSection, primitives (Modal/GradientButton/Input/Checkbox/TimePicker/TooltipButton), uiKit (haptic/AnimatedNumber/StaffingBar/ScheduleSkeleton/TaskStarTooltip/GradientBackground/Logo), Button, AdaptiveModal, MobileScheduleActionSheet
- `src/hooks/` -- useFocusTrap, useUnsavedWarning, useDismissOnOutside, useAuth, useToast, useAnnouncements, useGuardedMutation, useTooltip
- `src/panels/` -- admin + employee list panels
- `src/modals/` -- request/offer/swap/settings/password/shift-editor modals
- `src/auth.js` -- stateless HMAC session token + cached user + auth-failure callback
- `src/pdf/generate.js` -- PDF via HTML + window.open + browser print; layout tradeoffs in `CONTEXT/pdf-print-layout.md`
- `src/email/build.js` -- plaintext email body builder
- `src/utils/format.js` -- parseLocalDate, formatDate, escapeHtml, stripEmoji
- `src/utils/date.js` -- pure date/time helpers (toDateKey, parseTime, formatTimeShort, ...)
- `src/utils/storeHours.js` -- STAT_HOLIDAYS_2026 / STORE_HOURS / DEFAULT_SHIFT (FT+PT unified) / isStatHoliday (pure)
- `src/utils/eventDefaults.js` -- getPKDefaultTimes (Sat 10:00-10:45 else 18:00-20:00) / MEETING_DEFAULT_TIMES (14:00-16:00 locked) / getSickDefaultTimes (mirrors existing work shift)
- `src/utils/storeHoursOverrides.js` -- module-level override refs + getStoreHoursForDate (re-exported from App.jsx for legacy importers; parked sub-area-6 Context refactor will replace)
- `src/utils/payPeriod.js` / `src/utils/requests.js` / `src/utils/api.js` / `src/utils/eventDefaults.js`
- `src/utils/employeeSort.js` -- five-bucket display order (Sarvi, admin1, admin2, FT, PT) + bucket-transition dividers; single source of truth for admin/employee/mobile/PDF rendering
- `src/utils/employeeRender.js` -- `hasTitle(emp)`; `splitNameForSchedule(name)` for desktop+mobile name column; title branches in 8 files + desktop name cells
- `src/utils/timemath.js` -- interval-union hours, availabilityCoversWindow
- `backend/Code.gs` -- paste into Apps Script editor after edits

## Four Views

- Admin Desktop: full grid, inline edit, auto-populate, employee mgmt, PDF, email
- Admin Mobile: `if (isMobileAdmin)` branch in App.jsx (30+ state, avoids prop drilling)
- Employee Desktop: read-only grid + request sidebar
- Employee Mobile: separate EmployeeView (only needs published data)

## Flows

- Auth: login -> HMAC token (12h TTL) -> token auto-attached by apiCall
- Request: submit -> recipient accepts (offers/swaps) -> admin approve/deny -> email
- Cancel pending; revoke approved (future only)
- Save button cycle: SAVE (blue) -> GO LIVE (green) -> EDIT (yellow)
- Publish: publishedShifts + publishedEvents = LIVE periods only; employees never see drafts
- Non-work entries (meeting, pk) blocked from offer/swap via `INVALID_SHIFT_TYPE`

## Employee Shape

- `availability.{day} = {available, start, end}` -- PK eligibility gate + always clamps Auto-Fill output
- `defaultShift.{day} = {start, end}` (v2.24.0, col N) -- per-day Auto-Fill override when set
- `employmentType` == 'full-time' -- enables `FT_DEFAULT_SHIFT` fallback (Mon-Wed 10-18, Thu-Sat 10:30-19, Sun 10:30-18); PT falls back to availability.start/end
- `defaultSection` (col V) -- role seed for Auto-Fill
- Decouple: widening availability for PK eligibility does not widen booked hours (FT clamps to store pattern, PT clamps to availability window)

## Shift State

- `shifts[${empId}-${date}]` = work shift object (scalar)
- `events[${empId}-${date}]` = array of meeting/pk/sick entries
- `publishedShifts` / `publishedEvents` = LIVE-gated copies for employee view
- Union hours via `computeDayUnionHours` (overlap counts once; sick entry short-circuits day to 0)
- Sick day intercepts (2026-04-24): `getEmpHours` fast-path skips, `getScheduledCount` drops the employee, `computeConsecutiveWorkDayStreak` sickLookup breaks the run, PDF headcount reducer filters sick
- Backend key `${empId}-${date}-${type}` keeps work/meeting/pk/sick distinct rows

## Data Model

- Shift keys: `${employeeId}-${dateStr}` -> O(1) lookup
- Always store `employeeName` alongside `employeeId` (audit trail)
- Pay periods: 14-day blocks from `PAY_PERIOD_START` = 2026-01-26
- `editModeByPeriod[periodIndex]` -- each period tracked independently
- Inactive employees excluded from all views/scheduling

## Auth + Password

- Stateless HMAC session tokens (12h TTL) via `HMAC_SECRET` Script Property
- Passwords: salted SHA-256, columns R (`passwordHash`) + S (`passwordSalt`)
- Column T `passwordChanged` is authoritative for default-password detection
- Fallback regex `emp-XXX` only when column T blank (back-compat)
- Default password: `emp-XXX` sequential by Sheets row (row 2 = emp-001)
- Self-change writes `passwordChanged=TRUE`; admin reset writes `FALSE` + clears hash

## Roles

- `cashier` `#932378` | `backupCashier` `#B44D9A` | `backupCash` `#D08BC3` | `mens` `#0453A3` | `womens` `#EC3228` | `floorSupervisor` `#00A84D` | `floorMonitor` `#F57F20` | `none` `#64748B`
- PDF glyph + family map (`src/pdf/generate.js`): cashier=C1/cash | backupCashier=C2/cash | backupCash=B/cash | mens=M/section | womens=W/section | floorSupervisor=FS/monitor | floorMonitor=F/monitor | none=blank
- Supervisory roles (floorMonitor + floorSupervisor) get a 2px ink cell border in PDF

## Integrations

- Google Sheets -- read/write via `Sheets.Spreadsheets.Values.*` -- ours (Sarvi's sheet)
- Apps Script web app -- GET `?action=NAME&payload=JSON` -- ours (manual deploy)
- Vercel -- frontend hosting -- ours (auto on push to main)
- MailApp (Gmail) -- sender "OTR Scheduling" -- ours

## Boundaries

- In scope: scheduling grid, requests (time-off/offer/swap), announcements, PDF + email, auth
- Out of scope: punch clock / timekeeping, payroll processing (stays in ADP), inventory, POS
- Post-demo roadmap: CF Worker cache, Supabase migration, payroll aggregator (Counterpoint -> ADP bridge)

## Config

- `API_URL` at top of `src/App.jsx`
- `SPREADSHEET_ID` in `backend/Code.gs`
- `ADMIN_EMAIL` in `backend/Code.gs` = sarvi@rainbowjeans.com
- `PRIMARY_CONTACT_EMAIL` in `src/constants.js` mirrors backend ADMIN_EMAIL
- `PAY_PERIOD_START` at top of `src/App.jsx` = 2026-01-26
- Fallback deploy: `vercel link --scope johnrichmonds-projects-7f62ccc5 --project rainbow-scheduling --yes && vercel --prod --yes`

## Sibling Project

- `~/APPS/RAINBOW-PITCH/` -- separate git repo, separate Vercel deploy
- Live at https://rainbow-pitch.vercel.app
- Reuses `src/theme.js` from this repo (copied, not symlinked)
- Pitch assets staged in `pitchdeck/assets/` of this repo

<!-- TEMPLATE
## Overview
- [one line stating what this system is]

## Components
- [component] -- [purpose] -- [key files or dirs]
- [component] -- [purpose] -- [key files or dirs]

## Flows
- [flow name]: [start] -> [middle] -> [end]

## Integrations
- [external system] -- [how we talk to it] -- [owned by us or them]

## Boundaries
- In scope: [what this system owns]
- Out of scope: [what it does not]
-->
