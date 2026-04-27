# Codebase Audit 2026-04-27 (s028) -- Deferred Items

Sonnet 4.6 ran a read-only audit across `src/`, `src/views/`, `src/utils/`, and partial `backend/Code.gs`. 17 findings total. 9 were fixed autonomously this session (commit `<TBD>`); 8 are deferred here for JR review because they require visual confirmation, backend deploy, or refactor scope decisions.

## Fixed autonomously (in commit)

- **A-1, A-2, A-3** -- removed unused imports from `src/App.jsx`: `Modal`, `GradientButton`, `getDayNameShort`, `formatDateLong`, `calculateHours`, `STAT_HOLIDAY_HOURS`, `STORE_HOURS`. None were re-exported.
- **A-4, A-5** -- removed 8 unused lucide icons + `TYPE` + `ROLES` array from `src/MobileAdminView.jsx`.
- **A-6** -- removed unused `ArrowRight` from `src/MobileEmployeeView.jsx`.
- **B-5** -- removed `.toLowerCase()` no-op in `src/MobileAdminView.jsx:349` (`getDayName` already returns lowercase).
- **B-4** -- `myShiftsCount` in `src/views/EmployeeView.jsx:331` now reuses the memoized `allDateStrs` array instead of recomputing `toDateKey` per render.
- **C-1** -- added optional chaining to `req.datesRequested?.split(',')` in `src/views/EmployeeView.jsx:145`. Three of four request-render paths already had it; this was the outlier.

Build PASS at modern bundle `index-Yad6cQe5.js` (488.41 kB / 123.34 kB gzip). No console regressions.

## Deferred -- backend + needs manual deploy

### A-7 -- Dead `callerEmail` branches in `backend/Code.gs:434-451` and `:64-83`

Sonnet confirmed the comment-marked dead branches are still present. The frontend stopped sending `callerEmail` in payloads after S37, so `chunkedBatchSave` line 64 destructure of `callerEmail` is always undefined and line 83's `...(callerEmail ? { callerEmail } : {})` is always the empty branch.

Why deferred: any `Code.gs` change requires manual Apps Script deploy + re-auth + smoke send. Out of scope for an autonomous overnight pass. Touch only when JR is wiring the new account anyway (Path A of `docs/email-sender-migration.md`) -- the redeploy moment is a natural inclusion point.

### C-2 -- `allShiftKeys` vs backend `keyOf` format mismatch for meeting rows

Real bug. Frontend `src/utils/api.js:72` builds keys as `${empId}-${date}-${type || 'work'}` for every shift. Backend `keyOf` at `backend/Code.gs:1806-1810` returns `String(s.id)` for non-singular types when `s.id` exists -- meetings have ids like `MTG-{empId}-{date}-{random8}`, which never matches the frontend key.

Effect on chunked saves (>15 shifts; routine with 35 staff): existing meeting rows get dropped from `survivors` (their real id is not in `keepKeys`), then re-appended at the end of the Shifts tab via the incoming `updates` map. Meetings get relocated to the bottom of the sheet on every chunked save. Not data loss; sort order disruption + downstream tooling that reads row order may break.

Sonnet flag-out caveat: only bites when the Sheet has meetings with `MTG-*` real ids (i.e., created via ShiftEditorModal after the newMeetingId path landed). Worth checking the actual Shifts tab to see if any `MTG-*` ids exist before treating this as urgent.

Why deferred: backend fix + needs Sheet-level test to confirm scope. Two paths -- (a) make backend `keyOf` use the synthetic `${type}-${empId}-${date}` format for non-singular types when a `keepKeys` lookup is in play, or (b) make frontend `allShiftKeys` use the real id for meetings. Either way, needs JR to confirm intended semantics first.

## Deferred -- React refactor scope

### B-1 -- Inline arrow function for week2 `getEmployeeHours` in `src/views/EmployeeView.jsx:468-472`

When `mobileActiveTab === 'week2'`, an inline arrow runs `toDateKey` over week2's 7 dates per employee per render. The week1 path uses a stable `useCallback`. Fix is a parallel `getEmpHoursWeek2` `useCallback` with `mobileWeek2Strs` memo. Touches dep arrays of downstream consumers; defer for an explicit pass.

### B-2 -- `hasApprovedTimeOff` in `EmployeeViewRow` (`src/views/EmployeeView.jsx:141-147`)

A `.some()` scan over `timeOffRequests` fires per cell per render; with 35 employees x 7 dates that is 245 scans per render. The clean fix hoists this to a `useMemo`'d Set of `${email}-${dateStr}` keys at the parent level, passed down to the row. Touches the memo'd row component's prop surface; defer.

### B-3 -- 6 unmemoized `.filter()` calls in `src/views/EmployeeView.jsx:262-289`

`myTimeOffRequests`, `myOffers`, `offersIAccepted`, `mySwaps`, `swapsIAccepted` and their unseen-id arrays recompute on every render. Sonnet's own non-finding noted the inner `seenRequestIds.has(...)` is O(1) so the cost is bounded by the array size. With OTR's request volume this is probably noise. Defer; revisit only if an actual hover-induced lag surfaces.

## Deferred -- behavior changes that need visual confirmation

### C-4 -- `hasTitle(currentUser)` vs `hasTitle(mobileShiftDetail.employee)` in shift-detail bottom sheet

`src/views/EmployeeView.jsx:633-635`. The bottom sheet checks if the LOGGED-IN viewer is titled, then renders the TAPPED employee's shift role. For an admin viewing another employee's shift, the role pill shows the admin's own title instead of the actual role (or other employee's title). The grid cell uses `hasTitle(employee)` correctly.

Sonnet's logic looks right but the fix changes user-visible behavior on the mobile employee view shift-detail sheet. Wants JR to eyeball the current behavior on prod before I touch it -- low risk it has been discussed already and the current behavior is intentional for a reason that was not captured in code or comments.

### D-1 -- Sick-day rendering missing on paths 2 (desktop employee) + 4 (mobile employee)

Paths 1 (desktop admin ScheduleCell) and 3 (mobile admin grid) handle `hasSick` with cross-hatch overlay + strikethrough. Paths 2 (`EmployeeScheduleCell` in `EmployeeView.jsx`) and 4 (`MobileScheduleGrid`) have no `hasSick` branch -- a sick event renders only via `EventGlyphPill` (the badge), no cell-level styling.

Sonnet's flag-out caveat: only matters if employees can see sick events for themselves or others in their period view. If sick is admin-only data and never reaches the employee-facing payload, this is invisible. Verify the `getAllData` response composition before adding render branches to 2 paths.

If the audit confirms sick events do appear in employee data, the fix needs the parity rule: patch all 4 paths (or confirm 1+3 stay as-is and 2+4 get the same treatment) in one commit. Defer.

### D-2 -- Hours/star differences between admin paths

Desktop admin (`EmployeeRow`) renders hours with `AnimatedNumber` + OT color coding. Mobile admin (`MobileAdminScheduleGrid`) shows `weekHours.toFixed(1)h` + `★` for admins. Different implementation, possibly intentional. Defer; needs JR to say whether parity is desired.

### D-3 -- "N/A" vs "Unavailable" copy divergence

Mobile admin grid says "N/A" (line 402); the other 3 paths say "Unavailable". User-visible copy. Per the carried lesson "Do NOT replace customer-facing copy that wasn't approved" -- defer even though it is a one-line fix. Ask JR which label he prefers before touching.

## Non-findings confirmed

- `parseLocalDate`, `escapeHtml` re-exported from `src/App.jsx:59` -- intentional even though `App.jsx` body does not call them.
- Card structure (title eyebrow / first / last) is correctly parallel across all 4 schedule paths after s027. No drift.

## Audit scope skipped

- `src/modals/` and `src/panels/` (time-box). Sonnet flagged `AdminShiftOffersPanel.jsx` and `AdminShiftSwapsPanel.jsx` as the most likely candidates for stale inline helpers from pre-extraction.
- Full `backend/Code.gs` function-coverage sweep (only auth + allShiftKeys + dead-callerEmail areas were checked).

Worth running a follow-up Sonnet pass scoped to these areas in a future session.

## Suggested follow-up sequence

1. JR confirms email-sender migration ownership transfer (`docs/email-sender-migration.md`).
2. While Apps Script is being redeployed, also ship A-7 (delete dead `callerEmail` branches) -- one bundled backend change.
3. Eyeball C-4 + D-1 + D-3 on prod, decide intent for each.
4. Run a targeted Sonnet pass over `src/modals/` + `src/panels/` for the same dead-code categories.
5. Schedule the B-1 + B-2 perf refactor as its own task -- needs careful dep-array review.
