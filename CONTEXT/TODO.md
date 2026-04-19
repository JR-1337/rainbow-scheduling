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
- Adversarial audit Phase E -- next: pause or pick a concrete motivation. Cuts 1-15 shipped across two sessions; App.jsx 3044 -> 2526 (-518, -17%). Latest session added `utils/requests.js` helpers (matchesOfferId/matchesSwapId/errorMsg DRY across 26 sites) and `components/ScheduleStateButton.jsx` (unified mobile + desktop three-state Save/GoLive/Edit). JR said "good on code and bug fixes" -- further cuts should wait on a feature motivation. Sub-area 6 (Context provider) still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Could not reproduce via Playwright; getPKDefaultTimes only returns Sat 10:00-10:45 or 18:00-20:00; suspect old PK rows in spreadsheet OR ShiftEditor seed for cell-click PK. Ask JR which employee + which day.
- Bug 5 (top-nav PK saves to sheet but doesn't show in UI) -- next: handleBulkPK calls loadDataFromBackend on success; events flow through eventsObj keyed `${employeeId}-${dateStr}`. Need JR repro: which week was active, which employees, did they appear after page hard-refresh?
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Email + distribution overhaul -- next: JR creates dedicated Gmail (e.g. rainbow-scheduling@gmail.com) to replace his personal account as sender; then revisit sender identity across MailApp calls, schedule PDF distribution, announcement emails, welcome email on new-employee create (emp-XXX default pw), Sarvi admin notifications, and any other external comms. Scope: audit every send site, standardize from-address, subject conventions, and deliverability (SPF/DKIM if custom domain later)
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

- Last validated: `npm run build` PASS at HEAD `9f8ada2` pushed to origin/main; modern bundle 477 kB, legacy bundle + polyfills emitted for old Safari
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Last validated: 3 decouple smokes PASS on prod 2026-04-19 (Auto-Fill defaultShift precedence, PK Select-eligible 19/24, mobile 502x800 form render)
- Last validated: Phase E cuts 1-12 each smoke-green on localhost Playwright (login + schedule render + zero console errors) before commit-and-push; 12 commits pushed to origin/main 2026-04-19
- Last validated: Phase E cuts 13-15 localhost Playwright smoke PASS on 1280px AND 390px viewports; 3 commits `d9c5377`, `d6e8811`, `3d271a3` pushed 2026-04-19
- Missing validation: cut 8 (applyShiftMutation) + cut 10 (shift transfer/swap helpers) live admin-action paths not exercised by render-smoke -- offer approve/revoke and swap approve need live-test before prod trust
- Missing validation: cut 13 (errorMsg/matchesOfferId/matchesSwapId touched all admin offer+swap handlers) live admin-action paths not exercised -- offer + swap approve/revoke/reject paths need live-test before prod trust
- Missing validation: Sarvi iPad white-screen fixes not retested yet (theme.js localStorage guard + plugin-legacy)
- Missing validation: new Backup Cash role not smoked on prod (ShiftEditorModal picker, EmployeeFormModal defaultSection, PDF legend glyph 'B')
- Missing validation: PDF employee-facing hours removal not smoked on prod (generate + print a test PDF)
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad (shipped `c002046`)
- Missing validation: PDF role-encoding system (monogram glyph + family typography + Floor Monitor 2px ink perimeter) not smoked on prod (shipped `d2414eb`)
- Missing validation: Sarvi-batch 10 items not yet hands-on tested by JR + Sarvi
- Missing validation: no automated test suite; manual Playwright smoke only

## Completed

- [2026-04-19] Phase E cuts 13-15 shipped (App.jsx 2606 -> 2526, -80). Cut 13 `d9c5377` added `matchesOfferId`, `matchesSwapId`, `errorMsg` to `src/utils/requests.js` and DRY'd 26 sites across request/offer/swap handlers (no line change; DRY-correctness win). Cut 14 `d6e8811` extracted desktop Save/GoLive/Edit three-state button into `src/components/ScheduleStateButton.jsx`. Cut 15 `3d271a3` unified mobile + desktop onto one ScheduleStateButton with middle-ground sizing (px-2.5 py-1, text-xs, icon 11, title-case labels); mobile Publish stays inline as sibling with flex-wrap. Playwright smoke PASS at 1280px + 390px, zero console errors.
- [2026-04-19] Default store hours Mon/Tue/Wed open 10:00 -> 11:00 (`9f8ada2`). Close stays 18:00, Thu-Sat and Sun unchanged. Safe to change now that Auto-Fill reads per-employee `defaultShift` (fallback availability) rather than store hours; Mon/Tue/Wed store-open no longer affects booked hours.
- [2026-04-19] PDF role-encoding redesign shipped (`b189db5` -> `3e735d9` -> `2480a61` -> `d2414eb`). Iterated three systems with JR. Settled on: uniform 1px grey grid; monogram glyph (C1 / C2 / B / M / W / F) anchored top-left of each cell via absolute-position span; role name styled by family (cash = BOLD UPPERCASE letter-spaced, section = medium title case, monitor = italic); Floor Monitor is the ONLY role with a 2px ink perimeter — thicker border wins under `border-collapse` so monitor visibly owns its cell edges. Legend chip mirrors the cell treatment.
- [2026-04-19] PDF encoding + iOS Safari export fixes shipped (`c002046`). (a) Added `<meta charset="utf-8">` + `text/html;charset=utf-8` Blob MIME; without charset declared, old Safari fell back to Latin-1 and rendered em-dashes as garbage glyphs (the "ae" symbol Sarvi reported). (b) Swept all `—` out of `src/pdf/generate.js` -> ASCII `-`. (c) Popup-blocked fallback: was `<a download="...html">.click()` which iOS Safari ignored and saved as `*.blob`; now navigates current tab to the blob URL (HTML has its own in-page Print button).
- [2026-04-19] PDF hours + OT asterisks removed from employee-facing printout (`e7bc416`). Left-column row now shows employee name only; `calcWeekHours` + `computeDayUnionHours` import + legend `* / **` entry all dropped. ESA OT surface lives in admin web UI, not the employee PDF.
- [2026-04-19] iPad white-screen fixes shipped (`35288f5`, `2362575`). Fix 1: `theme.js` localStorage.getItem wrapped in try/catch (was unguarded at module-init; Safari Private Browsing SecurityError crashed the bundle before React mounted). Fix 2: added `@vitejs/plugin-legacy@5` with `targets: ['ios >= 11', 'safari >= 11']` + `modernPolyfills: true` — modern bundle unchanged (477 kB), legacy bundle (495 kB) + polyfills (83 kB) lazy-loaded via nomodule on old Safari. Pending Sarvi retest.
- [2026-04-19] EmployeeFormModal mobile overlapping rows fixed (`8a517bf`). Three rows (Employment Type, Active/Inactive pill, Admin pill) switched from `flex items-center justify-between` to `flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0`. Active + Admin pair also stacks vertically at <640px instead of splitting narrow row in half.
- [2026-04-19] New `Backup Cash` role shipped + existing `backupCashier` display renamed to `Cashier 2` (`b0c5704`). constants.js adds `{ id: 'backupCash', name: 'Backup', fullName: 'Backup Cash' }`; theme.js roles.backupCash `#D08BC3` (cash-family purple, lighter than existing); pdf/generate.js glyph `backupCashier` 'B' -> '2', new `backupCash: 'B'` + dotted 3px border; Code.gs defaultSection enum comment updated. All pickers data-driven off ROLES so ShiftEditorModal, EmployeeFormModal defaultSection, and PDF legend flow through.

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
