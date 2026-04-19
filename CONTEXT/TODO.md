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
- Adversarial audit Phase E -- next: continue cracking open App() body. Cuts 18-21 shipped (useToast, useAnnouncements, useGuardedMutation, useTooltip). App.jsx 3120 -> 3070 lines after this session's bug fixes. Sub-area 6 still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Could not reproduce via Playwright; getPKDefaultTimes only returns Sat 10:00-10:45 or 18:00-20:00; suspect old PK rows in spreadsheet OR ShiftEditor seed for cell-click PK. Ask JR which employee + which day.
- Bug 5 (top-nav PK saves to sheet but doesn't show in UI) -- next: handleBulkPK calls loadDataFromBackend on success; events flow through eventsObj keyed `${employeeId}-${dateStr}`. Need JR repro: which week was active, which employees, did they appear after page hard-refresh?
- Tablet white screen -- fix shipped (theme.js localStorage guard + @vitejs/plugin-legacy for iOS 11+), awaiting Sarvi retest on old iPad
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Welcome email on new-employee create -- trigger in saveEmployee (Code.gs), send default emp-XXX password on create
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- move Fill Wk / Clear Wk / PK-week controls into each employee's "Staff" cell on the schedule; add a dropdown of all staff so admin can bulk-book or clear an entire week for one picked employee from that menu. Also investigate current Fill Wk / Clear Wk behavior -- JR wants full-fill to cover everyone. Raised 2026-04-18, explore later, do not ask

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS at HEAD `e7bc416` pushed to origin/main; modern bundle 477 kB, legacy bundle + polyfills emitted for old Safari
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Last validated: 3 decouple smokes PASS on prod 2026-04-19 (Auto-Fill defaultShift precedence, PK Select-eligible 19/24, mobile 502x800 form render)
- Missing validation: Sarvi iPad white-screen fixes not retested yet (theme.js localStorage guard + plugin-legacy)
- Missing validation: new Backup Cash role not smoked on prod (ShiftEditorModal picker, EmployeeFormModal defaultSection, PDF legend glyph 'B')
- Missing validation: PDF employee-facing hours removal not smoked on prod (generate + print a test PDF)
- Missing validation: Sarvi-batch 10 items not yet hands-on tested by JR + Sarvi
- Missing validation: no automated test suite; manual Playwright smoke only

## Completed

- [2026-04-19] PDF hours + OT asterisks removed from employee-facing printout (`e7bc416`). Left-column row now shows employee name only; `calcWeekHours` + `computeDayUnionHours` import + legend `* / **` entry all dropped. ESA OT surface lives in admin web UI, not the employee PDF.
- [2026-04-19] iPad white-screen fixes shipped (`35288f5`, `2362575`). Fix 1: `theme.js` localStorage.getItem wrapped in try/catch (was unguarded at module-init; Safari Private Browsing SecurityError crashed the bundle before React mounted). Fix 2: added `@vitejs/plugin-legacy@5` with `targets: ['ios >= 11', 'safari >= 11']` + `modernPolyfills: true` — modern bundle unchanged (477 kB), legacy bundle (495 kB) + polyfills (83 kB) lazy-loaded via nomodule on old Safari. Pending Sarvi retest.
- [2026-04-19] EmployeeFormModal mobile overlapping rows fixed (`8a517bf`). Three rows (Employment Type, Active/Inactive pill, Admin pill) switched from `flex items-center justify-between` to `flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0`. Active + Admin pair also stacks vertically at <640px instead of splitting narrow row in half.
- [2026-04-19] New `Backup Cash` role shipped + existing `backupCashier` display renamed to `Cashier 2` (`b0c5704`). constants.js adds `{ id: 'backupCash', name: 'Backup', fullName: 'Backup Cash' }`; theme.js roles.backupCash `#D08BC3` (cash-family purple, lighter than existing); pdf/generate.js glyph `backupCashier` 'B' -> '2', new `backupCash: 'B'` + dotted 3px border; Code.gs defaultSection enum comment updated. All pickers data-driven off ROLES so ShiftEditorModal, EmployeeFormModal defaultSection, and PDF legend flow through.
- [2026-04-19] Schedule-change notifications to Sarvi shipped (backend v2.25.0). New `sendScheduleChangeNotification_(caller, summary)` called at success tail of `saveShift` and `batchSaveShifts`. Short-circuits when caller.email matches CONFIG.ADMIN_EMAIL (Sarvi) OR caller.isOwner === true (JR), so their own edits stay silent. PK bulk + announcement + live-periods + staffing-targets edits intentionally NOT notified per scope decision (shift writes only). One email per action (no batching). JR must redeploy Apps Script to v2.25.0 for this to go live. Playwright smoke of 3 handoff items (Auto-Fill defaultShift precedence, PK Select-eligible 19 of 24, mobile 502x800 form render) all PASS — decouple plan fully verified on prod.
- [2026-04-19] Per-day defaults decouple + availability widening shipped (`3460c69` + 7 predecessors). Employees col N `defaultShift` (JSON per-day `{start,end}`); Auto-Fill prefers defaultShift, falls back to availability; `availability.available` stays the gate. Apps Script v2.24.0 deployed.

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
