# Rainbow Scheduling App - Development Plan

## Current Status: Phase 6 (Polish & Infrastructure) 🔄 IN PROGRESS
**Last Updated:** 2026-02-10
**Current Version:** Code.gs v2.10, App.jsx ~8500 lines + MobileEmployeeView.jsx ~450 lines + MobileAdminView.jsx ~430 lines
**Chat:** RS-21-P6-UIPolish

---

## Completed Phases

### Phase 1: Core UI ✅
- Schedule builder with drag/drop
- Employee management
- Pay period navigation
- PDF export
- Dark theme UI

### Phase 2: Request System UI ✅
- Time-off requests (employee submit, admin approve/deny/revoke)
- Shift offers / give away (employee submit, recipient accept/decline, admin approve)
- Shift swaps (employee submit, partner accept/decline, admin approve)
- All 20 core tests passed (2026-02-01)

### Phase 3: Backend API Integration ✅ COMPLETE (2026-02-03)

#### Key Fixes:
1. **Field mapping** - Backend uses `employeeName/employeeEmail/requestId`, frontend uses type-specific names
2. **Date normalization** - Code.gs `getSheetData()` converts Date objects to `YYYY-MM-DD` strings
3. **Time normalization** - Code.gs converts time Date objects (year 1899) to `HH:mm` strings
4. **Safety checks** - `formatTimeDisplay`, `parseTime`, `formatTimeShort` handle undefined values

#### All 19 Request Functions Wired to API ✅

### Phase 3.5: Announcements Feature ✅ COMPLETE (2026-02-04)

- Admin can create/edit/delete announcements per pay period
- Announcements display in Admin schedule view (Week 1 & Week 2 tabs)
- Announcements display in Employee view (when period is LIVE)
- Included in PDF export and email publish
- Persists to Google Sheets Announcements tab

### Phase 3.6: Dead Code Cleanup ✅ COMPLETE (2026-02-05)

- Removed 72 lines from App.jsx (unused constants, components, imports)
- Removed 41 lines from Code.gs (duplicate functions, unused helpers)
- Total: 113 lines removed

### Phase 4: Staffing & Settings Features ✅ COMPLETE (2026-02-06)

#### RS-15 Session (2026-02-05):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Daily Staffing Targets | ✅ DONE | `DEFAULT_STAFFING_TARGETS` constant added |
| 2 | Daily Booking Counter | ✅ DONE | Column headers show `X/Y` with color coding |
| 3 | Default Shift Times Fix | ✅ DONE | New shifts default to store hours |
| 4 | Full-Time/Part-Time Toggle | ✅ DONE | Added to Employee Form modal |
| 5 | Schedule Sorting | ✅ DONE | Sarvi → Full-time (alpha) → Part-time (alpha) |
| 6 | Auto-Populate Toolbar | ✅ DONE | Shows in Edit Mode with 4 actions |
| 7 | Confirmation Modal | ✅ DONE | Warns before overwriting/clearing shifts |

#### RS-16 Session (2026-02-05):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 8 | Chunked Batch Save | ✅ DONE | Splits 80+ shifts into chunks of 15 to stay under URL length limits |
| 9 | Save Progress Feedback | ✅ DONE | Blue "saving" toast with live counter (15/80, 30/80...) |
| 10 | Go Live Button State Fix | ✅ DONE | Save button properly disables after Go Live |
| 11 | Auto-Fill Zero Shifts Warning | ✅ DONE | Shows warning toast instead of confusing "Added 0 shifts" |
| 12 | Staffing Counter Visual Tuning | ✅ DONE | Toned down counter colors - muted by default, subtle tints |

#### RS-17 Session (2026-02-05):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 13 | Staffing Targets in Admin Settings | ✅ DONE | Settings modal expanded with Targets + Password tabs |
| 14 | Staffing Targets Persist to Backend | ✅ DONE | `saveStaffingTargets` API, loads from Settings tab on login |
| 15 | Generic `saveSetting` API Endpoint | ✅ DONE | Stores any key-value pair in Settings tab |
| 16 | Clickable Column Headers | ✅ DONE | Click date header → edit store hours & target for that date |
| 17 | Per-Date Store Hours Overrides | ✅ DONE | Override open/close for specific dates, persists to backend |
| 18 | Per-Date Staffing Target Overrides | ✅ DONE | Override target for specific dates, persists to backend |
| 19 | Past Date Protection | ✅ DONE | Column headers read-only for past dates |
| 20 | Override Visual Indicators | ✅ DONE | Overridden dates show cyan-tinted hours/target text |
| 21 | Draft Shift Privacy Fix | ✅ DONE | Employees only see shifts for LIVE periods (not drafts) |
| 22 | Employee View: Availability Always Visible | ✅ DONE | Grid shows "Unavailable" and "Time Off" labels for all periods |
| 23 | Employee View: Unpublished Banner | ✅ DONE | Info banner when period isn't live yet |

#### RS-18 Session (2026-02-06):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 24 | RS-17 Test Checklist | ✅ ALL 9 PASS | Full test pass on all RS-17 features |
| 25 | Past Date Staffing Counter Fix | ✅ DONE | Past dates show headcount only (no target fraction or color coding) |
| 26 | Email Subject Update | ✅ DONE | "New Schedule Published 🌈 Wk X, Y \| Date - Date" |
| 27 | Professional Sender Name | ✅ DONE | Code.gs sends all emails as "OTR Scheduling" |
| 28 | Output File Naming | ✅ DONE | Artifact files named App.jsx to match GitHub repo |

#### Schema Changes (Phase 4):
**Employees tab - Column Q:** `employmentType` (full-time / part-time)
**Settings tab - New key-value rows:**
- `staffingTargets` → JSON: `{"sunday":15,"monday":8,...}`
- `storeHoursOverrides` → JSON: `{"2026-02-14":{"open":"10:00","close":"21:00"},...}`
- `staffingTargetOverrides` → JSON: `{"2026-02-14":12,...}`

---

### Phase 5: Mobile-Responsive Employee Views ✅ COMPLETE (2026-02-06)

#### RS-19 Session (2026-02-06):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Mobile detection hook | ✅ DONE | `useIsMobile()` — 768px breakpoint, updates on resize |
| 2 | Frozen spreadsheet grid | ✅ DONE | CSS `position: sticky` for frozen name column + day headers |
| 3 | Hamburger menu drawer | ✅ DONE | User info, Shift Changes, all request panels, admin contacts, logout |
| 4 | Announcement popup | ✅ DONE | Bell icon in header, modal popup for announcement text |
| 5 | My Schedule tab | ✅ DONE | Card-based list divided by week, subtotals, task visibility |
| 6 | Raised filing tabs | ✅ DONE | Wk N / Wk N / Mine — selected tab blends into content below |
| 7 | Logo banner header | ✅ DONE | Centered RAINBOW logo, LIVE/Pending badge right-aligned |
| 8 | Period navigation | ✅ DONE | ← date range → in controls row |
| 9 | Logged-in user highlight | ✅ DONE | Subtle purple outline on row, no purple name or "(You)" label |
| 10 | Task privacy | ✅ DONE | Grid: star on own shifts only. Mine tab: task name visible. Others: hidden |
| 11 | File split | ✅ DONE | Mobile components extracted to MobileEmployeeView.jsx (438 lines) |
| 12 | Shared exports | ✅ DONE | THEME, ROLES, helpers exported from App.jsx for cross-file import |

---

### Phase 5.5: Password Management + Mobile Admin View ✅ COMPLETE (2026-02-06)

#### RS-19 Password Management (2026-02-06):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | ChangePasswordModal component | ✅ DONE | Reusable modal: current → new → confirm, first-login mode |
| 2 | Desktop employee change password | ✅ DONE | Key icon in header, opens ChangePasswordModal |
| 3 | Mobile employee change password | ✅ DONE | "Change Password" in hamburger drawer |
| 4 | Admin reset employee password | ✅ DONE | "Reset to Default" button in EmployeeFormModal |
| 5 | First-login forced password change | ✅ DONE | Intercepts usingDefaultPassword, blocks access until changed |
| 6 | Code.gs type coercion fix | ✅ DONE | String() on all password comparisons/storage (numeric passwords) |

#### RS-20 Mobile Admin View (2026-02-06):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 7 | MobileAdminView.jsx | ✅ DONE | New file: MobileAdminDrawer, MobileAdminScheduleGrid, MobileAnnouncementPanel |
| 8 | Mobile admin schedule grid | ✅ DONE | Read-only grid with staffing counters (X/target), tappable cells in edit mode |
| 9 | Mobile admin schedule editing | ✅ DONE | Tap cell → ShiftEditorModal → set role/hours/task → save |
| 10 | Mobile admin request review | ✅ DONE | Requests tab with all 3 request type panels (approve/deny/revoke) |
| 11 | Mobile admin announcements | ✅ DONE | View/edit/save/clear announcements panel |
| 12 | Mobile admin drawer | ✅ DONE | User info, own shift changes, change password, desktop-only note, sign out |
| 13 | Three-state Save/GoLive/Edit button | ✅ DONE | Unsaved→SAVE, Clean→GO LIVE, Live→EDIT (mobile + desktop) |
| 14 | Desktop toolbar consolidation | ✅ DONE | Replaced separate Save + Edit/Live buttons with unified three-state button |

#### Key Architecture:
- Mobile admin uses `if (isMobileAdmin)` branch inside main App component (not a separate component like EmployeeView)
- Direct access to all admin state/handlers without prop drilling
- Reuses existing ShiftEditorModal, CollapsibleSection, Admin*Panel components

#### NOT in mobile admin scope (desktop only):
- Employee management (add/edit/delete)
- Auto-populate toolbar
- Admin settings (staffing targets, store hours overrides)
- PDF export
- Inactive employees panel

---

### Phase 6: Polish & Infrastructure 🔄 IN PROGRESS (2026-02-07)

#### RS-21 Session (2026-02-07):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | Git + GitHub CLI setup | ✅ DONE | `gh` installed, authenticated as JR-1337, repo connected. Claude pushes to main, Vercel auto-deploys |
| 2 | CLAUDE.md created & refined | ✅ DONE | Architecture reference for Claude Code sessions, tracked in GitHub |
| 3 | PLAN.md moved to repo root | ✅ DONE | Alongside CLAUDE.md, tracked in GitHub |
| 4 | MobileEmployeeQuickView verified | ✅ ALREADY DONE | Was already wired up — removed from to-do |
| 5 | Mobile admin email publish verified | ✅ ALREADY DONE | Was already wired up — removed from to-do |
| 6 | Announcement bell popup tested | ✅ PASS | Tested on mobile, working |
| 7 | Accept/decline offers/swaps tested | ✅ PASS | Tested on mobile hamburger drawer, working |
| 8 | Stacked names in mobile grids | ✅ DONE | First/last stacked vertically, NAME_COL_WIDTH 90→72px in both admin and employee grids |
| 9 | Mobile header redesign (both views) | ✅ DONE | Logo row → date picker centered (13px) → buttons right-aligned → status banner → tabs. Proper spacing between rows |
| 10 | Status banner repositioned | ✅ DONE | Moved above tabs (was below), directly connected to schedule content |
| 11 | Tab color differentiation | ✅ DONE | Each tab has unique active color + icon: cyan (weeks), purple/user (Mine), orange/doc (Requests), blue/mail (Comms) |
| 12 | Button visual hierarchy | ✅ DONE | Save most prominent, Go Live/Edit/Publish as subtle compact pills, right-aligned under date picker |
| 13 | Real device testing (round 1) | ✅ DONE | Tested on phone — header layout good, found cell text clipping and tab bleed issues |
| 14 | Fix clipped cell text | ✅ DONE | CELL_HEIGHT 56→66px in both mobile grids, role name no longer cut off at top of shift cells |
| 15 | Fix tab spacing/bleed | ✅ DONE | Added gap-1 between tabs, removed negative margin overlap, inactive tabs show subtle borders |
| 16 | Reorder employee drawer | ✅ DONE | Panels grouped logically: action items → my requests → history (was interleaved) |
| 17 | Unified Requests History | ✅ DONE | Replaced 5 separate panels with one sortable list — filter pills (All/Time Off/Offers/Swaps), date sort toggle, type badges, cancel buttons on pending items |
| 18 | Staff user testing | 🔄 IN PROGRESS | JR's GF to test with a few staff members — awaiting feedback |

#### RS-23 Session (2026-02-10):

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 19 | Admin rejection reason modal (swaps) | ✅ DONE | Reject button opens modal with optional reason textarea, passes adminNote to backend, displays on settled items |
| 20 | Admin rejection reason modal (offers) | ✅ DONE | Same pattern as swaps — modal with reason field on reject |
| 21 | Sort toggles on all history panels | ✅ DONE | Clock+chevron toggle (newest/oldest) added to all 10 shift change history panels across admin & employee views |
| 22 | Uniform tab labels | ✅ DONE | "Needs Approval" → "Pending" on offers & swaps admin panels (matches time-off) |
| 23 | Uniform empty state messages | ✅ DONE | All three admin panels: "No pending requests" / "No requests found" |
| 24 | Compact empty state styling | ✅ DONE | Removed oversized icons and double padding from time-off & swaps empty states |
| 25 | Remove AdminTimeOffPanel double border | ✅ DONE | Stripped redundant card wrapper — panel is always inside CollapsibleSection |
| 26 | Mobile admin auto-populate | ✅ DONE | Auto-Fill and Clear buttons in edit mode banner, per-week (matches active tab), confirmation modal for overwrites/clears |
| 27 | Desktop auto-fill changed to per-week | ✅ DONE | "Auto-Fill All FT" now fills only active week tab (was both weeks), consistent with mobile and clear behavior |

#### Key Infrastructure Change:
- **Old workflow:** JR manually uploads files to GitHub
- **New workflow:** Claude edits `src/` files, commits, pushes. Vercel auto-deploys. No manual uploads.
- **Old folder structure:** Current Version / Past Version 1-3 (rolling backup) — retired
- **New folder structure:** Standard git repo with `src/`, version history in git

---

## Future Items / Phase 6+ Candidates

- [ ] Staff user testing feedback and fixes
- [ ] Shared utils refactor (extract THEME, ROLES, helpers, BaseComponents into separate files)
- [ ] Professional sender email (dedicated Google Workspace account)
- [ ] Further mobile UI polish based on user testing feedback
- [ ] Additional Sarvi feature requests (TBD)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-06 | Three-state button for Save/GoLive/Edit | Clearer workflow: Save persists without publishing, Go Live publishes, Edit re-enters editing. Applied to both mobile and desktop |
| 2026-02-06 | Mobile admin view as if-branch in App component | Direct access to all admin state without passing 30+ props to a separate component |
| 2026-02-06 | MobileAdminScheduleGrid with tappable cells | Admin can tap cells in edit mode to open ShiftEditorModal, same UX as desktop click |
| 2026-02-06 | String() coercion on all password operations | Google Sheets stores numeric-looking strings as numbers, breaking strict equality |
| 2026-02-06 | First-login forced password change intercepts login response | usingDefaultPassword flag from API, modal not dismissible until password changed |
| 2026-02-06 | Admin "Reset to Default" hidden for self/owner | Prevents accidental self-lockout |
| 2026-02-06 | Defer shared utils refactor to dedicated session | All 3 consumer files (App, MobileEmployeeView, MobileAdminView) now exist; refactor after Phase 5.5 |
| 2026-02-06 | Extract mobile components to MobileEmployeeView.jsx | Keeps App.jsx manageable, clean separation of concerns |
| 2026-02-06 | Export shared constants (THEME, ROLES, helpers) from App.jsx | Enables cross-file imports without circular dependencies |
| 2026-02-06 | 768px mobile breakpoint | Standard tablet/phone boundary, matches common device widths |
| 2026-02-06 | Logged-in user indicated by row outline only | Subtle, clean — no purple name or "(You)" label cluttering the grid |
| 2026-02-06 | Tasks: star-only in grid (own shifts), full text in Mine tab | Employees see their own tasks; others' tasks stay private |
| 2026-02-06 | Past date staffing counters show count only, no target | Past schedules are done; target comparison only useful for current/future |
| 2026-02-06 | Email sender name "OTR Scheduling" via MailApp name param | Quick win — no account changes needed, professional appearance |
| 2026-02-05 | Staffing targets stored as Settings key-value pair | Reuses existing Settings tab pattern, no new tabs needed |
| 2026-02-05 | Per-date overrides for hours & targets | Holidays, special events need one-off changes without changing weekly defaults |
| 2026-02-05 | Generic `saveSetting` endpoint | One API for any key-value pair, avoids creating per-setting endpoints |
| 2026-02-05 | Draft shifts hidden from employees | publishedShifts only includes shifts from LIVE periods on data load |
| 2026-02-07 | Retire Current Version / Past Version folders | Git tracks full history; rolling backup folders replaced by git commits |
| 2026-02-07 | Claude pushes directly to GitHub | gh CLI authenticated, edits in src/, push to main triggers Vercel deploy |
| 2026-02-07 | Compact pill buttons in mobile admin header | Buttons sized by importance — Save prominent, Edit/Publish subtle pills |
| 2026-02-07 | Stacked first/last names in mobile grids | NAME_COL_WIDTH reduced 90→72px, more room for schedule cells |
| 2026-02-07 | Header layout: logo → date → buttons → banner → tabs | Each element on its own row with breathing room; status banner above tabs connects to schedule |
| 2026-02-07 | Color-coded tabs with icons | Each tab has unique active color (cyan/purple/orange/blue) and icon so they're visually distinct |
| 2026-02-07 | CELL_HEIGHT 56→66px in mobile grids | Role name text was clipped at top of shift cells on real device |
| 2026-02-07 | Gap between tabs, subtle inactive borders | Tabs bled into each other (especially Requests/Comms) due to negative margin overlap |
| 2026-02-07 | Unified Requests History in employee drawer | 5 separate collapsible panels replaced with one sortable/filterable list — cleaner UX, less scrolling |
| 2026-02-05 | Chunked batch save for large shift payloads | GET URL has ~8KB limit; 80 shifts = ~15KB encoded, so split into chunks of 15 |

---

## Deployment Info

- **Live URL:** https://rainbow-scheduling.vercel.app
- **Backend API:** Google Apps Script Web App (v2.10)
- **GitHub:** Auto-deploys to Vercel on commit

---

## File Inventory

| File | Location | Purpose | Lines |
|------|----------|---------|-------|
| App.jsx | src/ | Main React app | ~8500 |
| MobileEmployeeView.jsx | src/ | Mobile employee components | ~438 |
| MobileAdminView.jsx | src/ | Mobile admin components | ~427 |
| Code.gs | Apps Script | Google Apps Script backend | ~2631 |
| PLAN.md | Project | Development plan | — |

---

## Spreadsheet Tab Structure

| Tab | Purpose | Key Columns |
|-----|---------|-------------|
| Employees | Staff records | id, name, email, ..., employmentType (Col Q) |
| Shifts | Scheduled shifts | id, employeeId, date, startTime, endTime, role, task |
| Settings | App config | key, value (livePeriods, staffingTargets, storeHoursOverrides, staffingTargetOverrides) |
| Announcements | Period announcements | id, periodStartDate, subject, message, updatedAt |
| ShiftChanges | All requests | requestId, requestType, status, employeeId, etc. |

---

## Progress Log

| Chat | Date | Summary |
|------|------|---------|
| RS-01 to RS-14 | Jan-Feb 2026 | Phases 1-3.6: Core UI, Request System, Backend Integration, Announcements, Cleanup |
| RS-15-P4-StaffingFeatures | 2026-02-05 | Staffing targets, counters, auto-populate, employment type, sorting |
| RS-16-P4-SaveProgressUX | 2026-02-05 | Chunked batch save, progress feedback, button state fixes |
| RS-17-P4-SettingsOverrides | 2026-02-05 | Admin settings UI, per-date overrides, draft shift privacy, employee availability visibility |
| RS-18-P4-TestingCleanup | 2026-02-06 | All 9 RS-17 tests passed, past date counter fix, email subject/sender updates |
| RS-19-P5-MobileEmployeeView | 2026-02-06 | Mobile employee view, password management, Code.gs type coercion fix |
| RS-20-P5-MobileAdminView | 2026-02-06 | Mobile admin view: schedule editing, request review, announcements, three-state Save/GoLive/Edit |
| RS-21-P6-UIPolish | 2026-02-07 | Git/GitHub setup, verified mobile features, header redesign, stacked names, tab colors |
| RS-22-P6-PhoneTesting | 2026-02-07 | Real device testing, cell height fix, tab spacing fix, unified Requests History, staff user testing prep |
| RS-23-P6-RequestPolish | 2026-02-10 | Rejection modals, sort toggles, uniform tabs/empty states, mobile auto-populate, per-week auto-fill on desktop |
