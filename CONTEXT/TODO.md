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

- **Hour-total color rework.** JR raised post-unpaid-break ship: drop the amber "approaching 40" warning. Staff routinely sit at/near 40 by design, so amber there cries wolf. New ladder: safe color < 40, "at-cap" color exactly at 40 (visually distinct but not alarming -- "fine, you hit the line"), amber when over 40, red further over. Same logic for part-time hour caps (per-employee `maxHours` if present). Touches: `EmployeeRow.jsx:45` (currently 40 red / 35 amber), `ShiftEditorModal.jsx:612` (currently 44 red / 40 amber), any mobile mirror. Pick concrete colors that work against the dark theme + don't collide with the 5 immutable OTR accents.
- **Persistent violation flag on day-click.** Sarvi reported no warning when she autofilled across consecutive-days threshold. Maybe autofill bypasses the advisory. Idea: when an admin clicks a scheduled day for any employee in any kind of ESA-style violation (consecutive-days 6+, weekly-hours overage, part-time cap overage), surface a sticky flag in the ShiftEditorModal that stays until the violation is resolved. Audit autofill path -- does `createShiftFromAvailability` skip the consecutive-days check `computeConsecutiveWorkDayStreak`?
- **JR manual: redeploy Code.gs to Apps Script.** Three changes queued in `backend/Code.gs` waiting on a single redeploy: (1) `sendBrandedScheduleEmail` action + Sarvi-notification HTML wrapper from s032 6e94cfc, (2) duplicate-email mirror check from s032 26068d9, (3) anything else stacked since last redeploy. Open otr-owned Apps Script editor -> paste -> Deploy -> Manage deployments -> Edit -> New version -> Deploy. Same /exec URL preserved. Frontend smoke confirms graceful failure UX while backend dormant.
- **PDF attachment for EmailModal v2 (Apps Script HTML -> PDF).** v1 shipped s032 with branded HTML body inline. v2: produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **Wire up chatbot query capture (Apps Script -> Google Sheet).** Append each `/api/ask-rainbow` POST as a row (timestamp, truncated IP, question, answer length, latency, provider). ~15 lines added to `api/ask-rainbow.js` + ~10 lines Apps Script. Fire-and-forget sink. Deferred since s024.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).
- JR to manually delete `TEST-ADMIN1-SMOKE` employee + s032 smoke residue (`Smoke Duplicate Test`, `Test Collision Check`) from Employees tab -- soft-deleted, not erased.
- Future-proofing audit -- research doc shipped 2026-04-26 at `docs/research/scaling-migration-options-2026-04-26.md`. Apps Script 7-8s floor identified as the highest-impact lever, not DB choice. Next: JR picks motivation OR ships CF Worker cache to defer the cliff.
- Perf + professional-app audit -- waves 1+2 shipped 2026-04-25; audit doc at `docs/perf-audit-app-jsx-2026-04-25.md`; next: prod phone-smoke wave 1+2.
- JR to delete `Employees_backup_20260424_1343` tab from Sheet once satisfied with widen result.
- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification (frontend + Apps Script v2.22 LIVE).
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test on phone (post-7a13cab).
- Adversarial audit Phase E -- pause or pick concrete motivation. App.jsx 3044 -> 2526 (-518, -17%). Sub-area 6 (Context provider) parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps. Sheet 2026-04-24 found zero PK rows with 10-10.
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip API_URL.
- Payroll aggregator path 1 -- blocked by demo go-ahead.
- Employees archive sheet w/ 5-year retention (Ontario ESA) -- raised s032. New EmployeesArchive tab + deletedAt + 5-yr auto-purge + owner-only Erase action. Schedule history snapshots emp name+id at delete time so render needs no archive lookup.
- Pre-launch test-employee hard scrub -- raised s032. Interim: JR deletes test rows in the Sheet directly. Durable: ride along with archive-feature Erase action above.
- [PARKED, do not surface] Staff-cell action menu -- raised 2026-04-18.
- [PARKED, do not surface] In-app accept/decline notification for Sarvi on shift switches -- raised s032; discuss after EmailModal conversion ships.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor.

## Verification

- Last validated: PDF portrait redesign Playwright smoke at HEAD `bdd838b` 2026-04-28 s032 -- export opens, 3-page layout works, Notes box renders. Subsequent UI tweaks (5e8bb9d ... d28a1d8) build-PASS only; no further visual smoke this session.
- Last validated: Phone-smoke batch via Playwright @ 390x844 mobile viewport 2026-04-27 s032 (HEAD `4e32a35`) -- schedule consolidation, F10 wk2, mobile shift-detail role pill, mobile eyebrow ★, Unavailable copy, Mine view, Employees panel chip filter all PASS. 0 console errors.
- Last validated: Duplicate-email frontend guard Playwright PASS at HEAD `4e32a35` -- "gary.scott434@gmail.com" collision blocked with inline error "already used by Gary".
- Last validated: PDF Export prod-smoke at HEAD `62f419b` -- print preview opens, no console errors, Week 1 closes header gap.
- Missing validation: Apps Script backend redeploy gate -- `sendBrandedScheduleEmail` + duplicate-email mirror check both dormant.
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-04-28] **Unpaid-break logic + net-hours display + employee-hours lockdown shipped (s033)** (`0b8f1b4`). Auto-by-length break rule (0/20/30/45min). ShiftEditorModal TODAY footer now shows `{gross}h - {break}m = {net}h` inline. PERIOD total + EmployeeRow weekly + MobileAdminView weekHours all NET. ESA flag fires on net (thresholds unchanged per JR). Employee surfaces (EmployeeView, MobileEmployeeView, schedule emails, ScheduleCell badge) no longer expose hours. Plan at `~/.claude/plans/sleepy-floating-peach.md`. Playwright PASS on 4h/5h/6h/8h cases + admin grid totals; employee-view lockdown verified by code review only (testguy inactive). Backend payroll roll-up endpoint deferred.
- [2026-04-28] **PDF portrait redesign + density rework shipped (s032)** (`5c3c02b` initial + `ccb23ad` `5e8bb9d` `bc2ff2b` `881c23e` `0a7556c` `d4a178a` `6a562f2` `bdd838b` followups). A4 portrait + glyph-only roles + fixed 8.5mm cell height + uniform cells on screen and print + bigger work-shift time + 3-page layout (Pages 1-2 staff weeks; Page 3 admin weeks if any + Announcements 3x + Legend + Sarvi contact line + Print date). Header drops "Staff Schedule" + period dates. Week banner inline. Name col 22mm fits 10 chars. FM glyph fixes overlap. Page 2 has 5mm top breather. Plan at `~/.claude/plans/jaunty-twirling-swing.md`.
- [2026-04-28] **Schedule defaultSection bug fixed for manual booking (s032)** (`cfca6b2` + `bb44b19`). ShiftEditorModal `seedFor('work')` AND `toggleTab('work')` now both apply `employee.defaultSection` when booking a new shift. Eli (defaultSection: womens) now books with W instead of None. Parity with full-time autofill path.
- [2026-04-28] **Time format dropped a/p suffix (s032)** (`3314aec`). All 30 `formatTimeShort` callsites now render "10-6" instead of "10a-6p" -- daytime retail context, no AM/PM ambiguity. Saves horizontal space everywhere.
- [2026-04-28] **Desktop Auto-Fill + Clear-Week selects width-locked (s032)** (`d28a1d8`). Native `<select>` was auto-fitting widest option, jumping size on Wk1/Wk2 toggle. Both selects locked to width:150px.
- [2026-04-28] **Duplicate-email guard shipped (s032)** (`4e32a35`). EmployeeFormModal blocks save when email collides with active or inactive (non-deleted) row. Inline error + own-row-id-skip on edit + blank-email skip. Backend `saveEmployee` mirror check staged in `Code.gs` (rides next Apps Script redeploy). Smoke PASS on prod.
- [2026-04-28] **Employees panel rename + chip filter parity (s032)** (`be98eb9` + `3f66c89` + `a1cb3dc` + `8c69343`). `InactiveEmployeesPanel` -> `EmployeesPanel`. Active/Inactive/Deleted chips on desktop matching mobile MobileStaffPanel. "Manage Staff" trigger -> "Employees". Deletion goes through Edit -> Remove (the existing EmployeeFormModal:80 confirm flow). Mobile confirm dialog moved to inline-swap pattern matching desktop.
- [2026-04-28] **PDF Notes box always renders + gap fix (s032)** (`62f419b` CSS-only + `2961ca7` Notes box re-add). Earlier 3c65819 broke Export PDF for Sarvi; reverted as `d4ca5a0`. CSS-only retry shipped working. Empty announcements box now renders as "Announcements" placeholder for Sarvi handwriting.
- [2026-04-27] **EmailModal mailto: -> backend POST + branded HTML body shipped (v1, no PDF)** (`6e94cfc`, s031). New `src/email/buildBrandedHtml.js`. New backend action `sendBrandedScheduleEmail`. Sarvi-notification 4th arg `{ html: true }` opts into branded wrapper. Modal stays open with progressive ✓/✗ list.
- [2026-04-27] **Email sender migration COMPLETE -- nuke-and-pave Option A** (`33afa4b`, s031) -- otr.scheduler Drive Make-a-copy + fresh OAuth + new deploy. From: header now `otr.scheduler@gmail.com`.
- [2026-04-27] **Schedule render path consolidation -- 9 of 12 audit findings shipped** (s029, plan `elegant-crunching-manatee.md`) -- 3 commits, App.jsx -518 lines net.

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
