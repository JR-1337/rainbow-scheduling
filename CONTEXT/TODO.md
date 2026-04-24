<!-- SCHEMA: TODO.md
Version: 1
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
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

- Item 2 (Floor Supervisor role) -- queued in backlog
- Item 3 (Admin tier 2 + job title) -- queued in backlog
- JR to delete `Employees_backup_20260424_1343` tab from Sheet once satisfied with widen result -- optional cleanup
- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test save/delete failure paths on phone; edit-modal must stay on "Edit" (not "Add"), state must revert on failure (post-commit 7a13cab LIVE)
- Adversarial audit Phase E -- next: pause or pick a concrete motivation. Cuts 1-15 shipped across two sessions; App.jsx 3044 -> 2526 (-518, -17%). Latest session added `utils/requests.js` helpers (matchesOfferId/matchesSwapId/errorMsg DRY across 26 sites) and `components/ScheduleStateButton.jsx` (unified mobile + desktop three-state Save/GoLive/Edit). JR said "good on code and bug fixes" -- further cuts should wait on a feature motivation. Sub-area 6 (Context provider) still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Sheet inspection 2026-04-24 found zero PK rows with 10-10 times; may be stale/fixed. getPKDefaultTimes only returns Sat 10:00-10:45 or 18:00-20:00. Ask JR which employee + which day if it resurfaces.
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Email + distribution overhaul -- next: JR creates dedicated Gmail (e.g. rainbow-scheduling@gmail.com) to replace his personal account as sender; then revisit sender identity across MailApp calls, schedule PDF distribution, announcement emails, welcome email on new-employee create (emp-XXX default pw), Sarvi admin notifications, and any other external comms. Scope: audit every send site, standardize from-address, subject conventions, and deliverability (SPF/DKIM if custom domain later)
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- move Fill Wk / Clear Wk controls into each employee's "Staff" cell on the schedule; add a dropdown of all staff so admin can bulk-book or clear an entire week for one picked employee from that menu. Also investigate current Fill Wk / Clear Wk behavior -- JR wants full-fill to cover everyone. Raised 2026-04-18, explore later, do not ask

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS at HEAD `1bdde4e` pushed to origin/main; modern bundle 472.88 kB, legacy 490.05 kB + polyfills emitted
- Last validated: 12/12 `createShiftFromAvailability` unit cases PASS via Playwright browser `import('/src/utils/scheduleOps.js')` (FT wide/tight/unavailable/clamp-degenerate, PT keeps availability-width, per-employee `defaultShift` override still wins)
- Last validated: favicon assets favicon.png (48x48) + apple-touch-icon.png (180x180) + favicon.svg all 200 in dev; link tags wired in index.html; zero console errors on login
- Last validated: 4-bucket sort + dividers PASS localhost Playwright at 1280px (admin grid, 2 dividers), 768px (same), 390px (mobile admin); PDF fixture shows 3 transitions x 2 weeks = 6 dividers
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Last validated: 3 decouple smokes PASS on prod 2026-04-19 (Auto-Fill defaultShift precedence, PK Select-eligible 19/24, mobile 502x800 form render)
- Missing validation: FT Auto-Fill + cell-click prefill not interactively smoked on prod with live 24-employee data (unit tests cover the logic; await Sarvi test)
- Missing validation: favicon not yet confirmed on prod (rainbow-scheduling.vercel.app) after Vercel redeploy; dev-only verification
- Missing validation: cut 8 (applyShiftMutation) + cut 10 (shift transfer/swap helpers) live admin-action paths not exercised -- offer/swap approve/revoke need live-test
- Missing validation: cut 13 (errorMsg/matchesOfferId/matchesSwapId across offer+swap handlers) live admin-action paths not exercised
- Missing validation: Sarvi iPad white-screen fixes not retested (theme.js localStorage guard + plugin-legacy)
- Missing validation: Backup Cash live shift + ShiftEditorModal picker + PDF glyph B on live shift not yet exercised end-to-end (defaultSection picker confirmed, PDF legend B confirmed)
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad
- Last validated: Sarvi-batch items 1/2/5/6/7/8/9/10 PASS prod Playwright 2026-04-24 (autofill toast, PK Sat 10:00/10:45, defaultSection round-trip, PDF B&W role glyphs, hidden-staff badge, Hidden collapsible, Dan/Scott hidden, Reactivate button tonal green). Items 3/4/11 SKIP per plan.
- Last validated: PK/MTG badge relocation PASS prod Playwright 2026-04-24 at HEAD `a6200cc` (Alex Fowler Sun 2026-04-19 cell: role top-left, PK badge top-right, time+hours row clear below, zero console errors). Employee viewport not smoked (testguy inactive); structurally identical code path.
- Last validated: Employee tooltip trim PASS prod 2026-04-24 at HEAD `06ef00c` (name + mailto email only; delayed-hide on card; shrink-to-fit font; target=_blank) -- JR hand-confirmed.
- Last validated: defaults unification shipped 2026-04-24 at HEAD `06f0027`. `npm run build` PASS at each step. Grep `FT_DEFAULT_SHIFT` in src/ = zero code hits. Commits c7cd101 (rename + PT unify + meeting lock), 4bd9310 (availability 06-22), 06f0027 (formatTimeShort minute fix).
- Last validated: `widenAvailabilityToMaxHoursLive` ran 2026-04-24 13:43 -- 26/26 rows widened, day-off flags preserved (Sarvi Sun off; Lauren/Christina Sun-only; Matt/Emily/Nancy weekends-only; etc.). Backup tab `Employees_backup_20260424_1343` created.
- Last validated: sick-mark feature shipped 2026-04-24 across 5 commits (HEAD `f41537e`). localhost Playwright smoke PASS: admin clicked Sarvi Mon 04-20 work cell (None 10a-8p 10h, 57h weekly), added `+ Sick` tab with reason "flu", saved; cell now renders amber `SICK 10a` badge + tooltip "Sick 10a-8p — flu"; Sarvi weekly total dropped 57.0h -> 47.0h; Mon headcount dropped 12 -> 11; work row preserved. No console errors.
- Missing validation: prod smoke of sick-mark end-to-end (admin save + hours/headcount/streak/PDF/email intact) -- pending push + Vercel redeploy.
- Deferred: `backfillShiftStartsDryRun`/`Live` never run -- JR determined redundant given clear+autofill flow (autofill skips PT; Sarvi rebooks PT manually with new 10:00/10:30 prefill from `c7cd101`).
- Missing validation: prod smoke of PT click-to-book prefill (should be 10:00 or 10:30 per day, was 11:00) -- shipped `c7cd101` on Vercel, hand-confirm pending.
- Missing validation: prod smoke of meeting prefill (should be 14:00-16:00, was "next full hour") -- shipped `c7cd101`.
- Missing validation: prod smoke of schedule-grid time labels (10:30-19:00 shifts should read "10:30a-7p", not "10-7") -- shipped `06f0027`.
- Missing validation: no automated test suite; manual Playwright smoke only

## Completed

- [2026-04-24] Sick shift type shipped end-to-end (5 commits: `ec184df` -> `f41537e`). EVENT_TYPES registry + amber theme tokens (sickBg #FEF3EC / sickText #9A3412 / sickBorder #F59E0B). `computeDayUnionHours` short-circuits to 0 on any sick entry; `getEmpHours` fast-path skips sick days; `computeConsecutiveWorkDayStreak` takes optional sickLookup (wired at both App.jsx call sites); `getScheduledCount` + PDF headcount reducer both drop sick-day employees. `getSickDefaultTimes` mirrors existing work shift. ShiftEditorModal gains admin-gated `+ Sick` tab via `currentUser.isAdmin`; sick seeds from work-shift times; hours card displays `SICK 0h`; projectedTotal sick branch subtracts the work shift's hours; note placeholder "e.g. flu, called in at 9am". `applyShiftMutation` toast label gains "Sick day". Backend unchanged (generic type handling confirmed). Build PASS at each phase commit. localhost Playwright smoke validated hours + headcount + badge.
- [2026-04-24] Widen existing employees' availability to 06-22 (day-off preserved). Added `widenAvailabilityToMaxHoursDryRun`/`Live` to `backend/Code.gs` (`7d64893`), ran live at 13:43 (26/26 rows widened, backup tab `Employees_backup_20260424_1343` created). Then removed all four backfill code blocks from Code.gs to keep the file clean (`0d2c2bd`, -273 lines). File back to 2381 lines; JR re-pasted. Replaces the initially-shipped `backfillAvailabilityDryRun`/`Live` which matched zero rows because Sarvi had customized every row.
- [2026-04-24] formatTimeShort minute rendering fix (`06f0027`). `src/utils/date.js:30` previously dropped minutes, rendering 10:30-19:00 as "10-7" on the schedule grid. Now returns "10:30a-7p" for half-hour times and keeps compact "10a-7p" for on-the-hour. All 35 call sites (ScheduleCell, MobileAdminView, MobileEmployeeView, etc.) pick up the fix via shared util. Build PASS.
- [2026-04-24] Defaults unification: workday prefill + meeting lock (`c7cd101`). Renamed `FT_DEFAULT_SHIFT` -> `DEFAULT_SHIFT` in `src/utils/storeHours.js`. `ShiftEditorModal.getDefaultBookingTimes` now always returns `DEFAULT_SHIFT[day]` for FT + PT (dropped storeHours fallback + `employee` param). `createShiftFromAvailability` fallback also uses `DEFAULT_SHIFT` for PT (dropped `STORE_HOURS` import in scheduleOps). New `MEETING_DEFAULT_TIMES = { start: '14:00', end: '16:00' }` in `src/utils/eventDefaults.js`; `getDefaultEventTimes` meeting branch returns the constant (dropped "next full hour" dynamic logic). `npm run build` PASS, grep `FT_DEFAULT_SHIFT` in src/ = zero hits. Prod smoke pending.
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
