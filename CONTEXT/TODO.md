<!-- SCHEMA: TODO.md
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- Do not store rationale (use DECISIONS.md), architecture (use ARCHITECTURE.md),
  or preferences (use LESSONS.md).
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test save/delete failure paths on phone; edit-modal must stay on "Edit" (not "Add"), state must revert on failure (post-commit 7a13cab LIVE)
- Mobile admin parity + PK clarity -- next: execute approved plan `~/.claude/plans/crispy-inventing-octopus.md` in a fresh chat. 5 fixes (move auto-populate Modal out of desktop branch; clearWeekShifts deletes events too; PK autofill error toast names time window; mobile cell badges stack vertically + aggregate at 3+; mobile fill/clear/PK collapse to single Actions button -> AdaptiveModal two-level action sheet). Approved 2026-04-19 after Playwright + JR phone smoke surfaced 5 mobile bugs.
- Adversarial audit Phase E -- next: continue cracking open App() body. Cuts 18-21 shipped (useToast, useAnnouncements, useGuardedMutation, useTooltip). App.jsx 3120 -> 3070 lines after this session's bug fixes. Sub-area 6 still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Could not reproduce via Playwright; getPKDefaultTimes only returns Sat 10:00-10:45 or 18:00-20:00; suspect old PK rows in spreadsheet OR ShiftEditor seed for cell-click PK. Ask JR which employee + which day.
- Bug 5 (top-nav PK saves to sheet but doesn't show in UI) -- next: handleBulkPK calls loadDataFromBackend on success; events flow through eventsObj keyed `${employeeId}-${dateStr}`. Need JR repro: which week was active, which employees, did they appear after page hard-refresh?
- Backup-cash role clarification -- next: JR asks Sarvi whether she wants a NEW role vs existing `backupCashier`
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Welcome email on new-employee create -- trigger in EmployeeFormModal create flow, send default emp-XXX password
- Schedule-change notifications to Sarvi -- notify when non-Sarvi-or-JR edits schedule; hook after each Code.gs write handler
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- move Fill Wk / Clear Wk / PK-week controls into each employee's "Staff" cell on the schedule; add a dropdown of all staff so admin can bulk-book or clear an entire week for one picked employee from that menu. Also investigate current Fill Wk / Clear Wk behavior -- JR wants full-fill to cover everyone. Raised 2026-04-18, explore later, do not ask

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Backup-cash role -- waiting on Sarvi confirmation of intent (new role vs existing) -- since 2026-04-18
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS on b0851f8 (2026-04-18)
- Last validated: HEAD `b0851f8` pushed to origin/main; Rainbow prod LIVE at https://rainbow-scheduling.vercel.app (bundle index-pisXMHns.js confirmed via curl)
- Last validated: Phase D shipped (Button.jsx primitive, AdaptiveModal primitive, icon scale); Playwright smoked admin drawer + Staff sheet + RequestTimeOff/Offer/Swap on both mobile and desktop viewports; reactivate/save roundtrips PASS
- Last validated: Phase D follow-ups shipped (b0851f8); re-verified: admin-blocked request types hidden, Sign Out destructiveOutline variant, pink+violet fixed modal accents survive OTR rotation
- Last validated: Phase A+B+C shipped; JR phone-confirmed: #1 badge increments, #4 reactivate, Staff bottom-sheet renders, 44px targets, safe-area, #8 column-header pencil, Edit-form stacking above drawer, Staff-reopen on form close (ref+effect 7a13cab)
- Last validated: pitch deck "two weeks" fix live at https://rainbow-pitch.vercel.app (2026-04-18)
- Last validated: Apps Script v2.22 deployed + Employees column U `defaultSection` added to live Sheet (2026-04-18 per JR)
- Missing validation: Sarvi-batch 10 items not yet hands-on tested by JR + Sarvi
- Missing validation: no automated test suite; manual Playwright smoke only
- RISK: `defaultSection` column on live Sheet must be added before fresh employee saves lose the field (fallback to `'none'` is safe, so backward-compatible)
- RISK: Apps Script v2.21.x still live; new `defaultSection` writes ignored until new deployment published

## Completed

- [2026-04-19] Bug-list batch shipped (`6e0f234`, `2545aec`, `f63285e`, `f260d6e`). PDF flipped to pure grayscale (no hue; OT marked **, near-OT *, role glyphs + border-style key in legend); PKEventModal "Select eligible" no longer wipes manual picks (only adds eligible=true, leaves overrides intact); duplicate auto-populate confirm modal removed (the inline z-100 one had no titles for `populate-week`/`clear-week` and silently swallowed per-employee actions); Schedule PK + Autofill PK collapsed into a single "📚 PK Week N..." dropdown mirroring the Auto-Fill / Clear shape; `autoPopulateWeek` past-date silent skip removed (was the actual root cause of "per-employee autofill doesn't work" on the current LIVE period because Week 1 was already past). Build PASS at HEAD `f260d6e` (~464.34 kB). Bugs 4 (PK default 10am-10am for some people) + 5 (top-nav PK saves but UI doesn't show) NOT shipped — could not reproduce via Playwright; need JR repro steps.
- [2026-04-18] Phase E sub-area 4 cuts 18-21 shipped (`1d608f4`, `fcaf155`, `3e99b8d`, `ce0a870`, `c959852`). New hooks: `useToast`, `useAnnouncements`, `useGuardedMutation`, `useTooltip`. One latent orphan caught by post-cut sweep: `setToast` used at 4 bulk-save progress call sites but useToast only returned `{toast, showToast}`; fix exposed `setToast`. App.jsx 3207 -> 3120 (-87). Build PASS at HEAD `c959852`. NOT smoked yet -- JR to verify desktop+mobile next session; if white, console-read first per `feedback_check_console_before_revert.md`.
- [2026-04-18] Phase E sub-area 4 cuts 15-17 shipped (`e6319ad`, `48fa047`, `d075d2e`) -- new hooks: `useUnsavedWarning`, `useDismissOnOutside(ref, isOpen, onDismiss)`, `useAuth(showToast)` (bundles currentUser state + AUTH_EXPIRED auto-bounce; showToast captured via ref so deps stay []). App.jsx 3228 -> 3207 (-21). Three latent missing-import bugs from prior cuts surfaced + fixed (`abea80a` PAY_PERIOD_START, `584ed95` Logo, `5c8272a` StaffingBar) -- Vite never caught any of them; only PAY_PERIOD_START fired everywhere, Logo + StaffingBar were desktop-only render paths. Mobile + desktop both confirmed working at HEAD `5c8272a`. Cuts 18-19 (useToast + useAnnouncements) attempted then reverted -- mid-attempt the latent PAY_PERIOD_START bug surfaced and I incorrectly assumed my cuts caused the white screen.
- [2026-04-18] Phase E sub-area 4 cuts 8-14 shipped + merged + pushed to main (`4c15ca3`, `286d5fe`, `e4ffb33`, `d109608`, `08f455d`, `90fc5c4`, `6c2f562`). New components: `LoginScreen`, `ColumnHeaderEditor`, `ScheduleCell` (with private `getAvailabilityShading`), `EmployeeRow`. `TooltipButton` appended to `primitives.jsx`. New util: `src/utils/storeHoursOverrides.js` owns the parked module-level mutable refs + setters + `getStoreHoursForDate` (re-exported from App.jsx for legacy importers). Dead `REQUEST_STATUS` + `OFFER_STATUS` enums dropped (zero refs). App.jsx 3702 -> 3228 lines (-474, -13%). Bundle byte-identical 464.79 kB through cuts 8-12; +1 byte to 464.80 kB after cut 13's re-export. Ship-merge-verify per cut continued.
- [2026-04-18] Phase E sub-area 4 cuts 1-7 shipped + merged + pushed to main (`44dcc72`, `720e815`, `1a85e70`, `54e1d15`, `21c5f62`, `654c1ae`, `eba776f`). New modules: `src/utils/{storeHours,payPeriod,requests,api}.js`, `src/components/{primitives,uiKit,CollapsibleSection}.jsx`, `src/hooks/useFocusTrap.js`. Status color/label maps moved into existing `src/constants.js`. App.jsx 4147 -> 3702 lines (-445, -11%). Bundle 465.06 -> 464.79 kB. Each cut shipped per ship-merge-verify cadence; JR live-smoked cuts 1+2 (clean). Cuts 3-7 functionally low-risk (import-path moves only).
- [2026-04-18] Phase E sub-area 3 (date-utils extraction): created `src/utils/date.js` with 11 pure date/time helpers (toDateKey, getDayName, getDayNameShort, formatDate, formatDateLong, formatMonthWord, getWeekNumber, formatTimeDisplay, formatTimeShort, calculateHours, parseTime). Migrated 21 import sites off `./App` onto `./utils/date`. App.jsx no longer re-exports any date helpers. `isStatHoliday` + `getStoreHoursForDate` intentionally LEFT in App.jsx (entangled with module-level mutable refs — separate parked refactor). Build green, bundle byte-identical (465.08 kB).
- [2026-04-18] Phase E sub-area 5 (plaintext password removal, v2.23.0): pre-audit found 19/24 active rows lacked `passwordHash` (never logged in, login auto-migrates on first login). Wrote one-time editor-only `backfillPasswordHashes` (since deleted), JR ran it, all 24 rows now have hash + salt. Then removed plaintext fallback from login + changePassword; resetPassword and saveEmployee now write hash + salt directly. Plaintext column kept for admin "default password" display only; auth path never reads it. JR must redeploy backend/Code.gs to live Apps Script as v2.23.
- [2026-04-18] Test-employee scrub executed: live Sheet purged via editor-only `purgeTestEmployees` (20 employees + 50 shifts removed). Verified via Drive MCP read: 24 employees, 79 shifts, 0 @example.com rows remain. Purge functions + seed-demo-data.gs + 5 legacy Emma/Liam/Olivia/Noah/Ava rows in createEmployeesTab deleted from repo. Stale Alex Kim smoke-pattern lesson removed from LESSONS.md.
- [2026-04-18] Phase E sub-area 3 verified: PDF XSS escape sweep. Audited every `${...}` in src/pdf/generate.js. All 7 user-writable interpolations (announcement.subject/message, ev.note, shift.task, emp.name, r.fullName, a.name, a.email) already wrapped in cleanText / escapeHtml. Role color has regex hex whitelist at L131. email/build.js is plain-text mail, not HTML. No code change needed; LESSONS note "5 sites" was stale.
- [2026-04-18] Phase E sub-area 1: unused-import sweep -- 27 stray `import React` (Vite auto-JSX-runtime makes them dead) + 15 dead named imports in App.jsx (features migrated to `src/views/EmployeeView.jsx` + panel files; App.jsx retained stale imports). 28 files, bundle byte-identical (465.06 kB) confirming prior tree-shaking. Programmatic cross-check via `/tmp/unused-imports.mjs`; manual per-import verification against App.jsx body and codebase references.
- [2026-04-18] Phase D follow-ups shipped (`b0851f8`) -- THEME.modal.{swap,offer} fixed non-rotating accent tokens; Offer/Swap switched off rotating accents; shift filter `>= today` not `>= tomorrow`; RequestTimeOffModal hides admin-blocked types (no longer disabled with Employees Only badge); Button.jsx destructiveOutline variant; Sign Out button migrated to new variant. Playwright re-verified on prod bundle index-pisXMHns.js.
- [2026-04-18] Adversarial audit Phase D shipped (`ab1cb58`, `e64838b`, `41f2f28`) -- new src/components/Button.jsx (5 variants x 3 sizes), 13 migrations in MobileStaffPanel + MobileAdminDrawer; new src/components/AdaptiveModal.jsx (mobile bottom-sheet / desktop centered card, headerGradient + footer + headerExtra slots), 3 modal migrations (RequestTimeOff, OfferShift, SwapShift); icon scale sweep to 12/14/16/20 in MobileAdminView. Playwright smoked on prod bundle index-BAi60peB.js.
- [2026-04-18] Adversarial audit Phase A+B+C shipped (`2914ec7`, `f1a5397`, `da944be`, `e01c2e5`, `ec93666`, `3a161cb`, `4ee85d0`, `ea4b81c`, `7a13cab`) -- badge field, save/delete/reactivate return+revert, MobileStaffPanel as bottom-sheet, 44px touch targets, safe-area padding, column-header pencil + mobile editor bottom-sheet, tokenize recoverable color, drawer auto-close on action, tap-to-close pill, employee form reopens staff sheet on close
- [2026-04-18] Sarvi batch 10 items shipped (plan `so-sarvi-gave-me-quizzical-perlis.md`) -- pitch deck 3-wk typo fix (LIVE), PK Saturday 10-10:45 default, bulk Autofill PK Week button, employee defaultSection field, PDF greyscale redundant encoding (glyph + border style + bold/asterisk), Restore button tonal-blue fix, Hidden-from-Schedule collapsed by default, Former Staff removed from grid, autofill toast enhanced with week context
- [2026-04-17] CONTEXT migration committed (`1f073d7`) -- docs/* -> CONTEXT/*, thin Claude + Cursor adapters
- [2026-04-14] S65 PDF Contact Admin filter (`4477325`) -- verified in generate.js; PRIMARY_CONTACT_EMAIL in src/constants.js
- [2026-04-14] S64 Meetings+PK Stages 6-8 (`4996c5b`, `fc65095`, `4406ae0`) -- offer/swap filters, PDF/email union hours, mobile my-schedule events
- [2026-04-14] S63 Meetings+PK Stage 5 -- PKEventModal bulk create + autofill toolbar 4->3 controls; verified round-trip

<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
