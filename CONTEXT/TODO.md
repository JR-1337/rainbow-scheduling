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

- Desktop name column (240px, splitNameForSchedule) on Vercel -- next: JR prod-smoke grid alignment, long/short names, hover full name
- JR to manually delete `TEST-ADMIN1-SMOKE` employee from Employees tab -- Playwright smoke test data left on prod when smoke hung at cleanup step
- Future-proofing audit -- research doc shipped 2026-04-26 at `docs/research/scaling-migration-options-2026-04-26.md`. Decision-axes captured (CF Worker SWR / Supabase ca-central-1 / Neon / D1 / self-hosted). Apps Script 7-8s floor identified as the highest-impact lever, not DB choice. Next: JR picks motivation OR ships CF Worker cache (already in Blocked) to defer the cliff
- Perf + professional-app audit -- (a) wave 1 shipped 2026-04-25: ScheduleCell memo at parent callsite (`feb094b`) + PDF lazy-load (`3cf6b09`); wave 2 shipped 2026-04-25: ColumnHeaderCell extract + scheduledByDate lookup (`1d0ccb1`) -- HIGH ColumnHeader + MED getScheduledCount both closed; MED EmployeeFormModal CLOSED 2026-04-25 by Playwright measurement (no refactor warranted); 2 LOWs stale (handled inside ColumnHeaderCell); audit doc at `docs/perf-audit-app-jsx-2026-04-25.md`; next: prod phone-smoke wave 1+2; (b) evaluate database + hosting upgrades beyond Sheets+AppsScript (Supabase/Postgres, Neon, Vercel Postgres) for professional security posture + auth + performance if OTR decides to buy the app
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

- Last validated: `npm run build` PASS at HEAD `0d3220e` 2026-04-25 (sick event wipe, PDF sync-tab open, title form, PDF event legend)
- Last validated: EmployeeFormModal MED finding closed 2026-04-25 by direct Playwright measurement on localhost dev (1400x900, Alex Fowler edit). Day-toggle click->paint median 45.8ms (range 23-69ms); time-select change->paint median 33.4ms (range 33.1-33.5ms). Vite dev mode is 2-5x slower than prod build; projected prod-on-iPad ~14-35ms / ~11-25ms -- under 50ms perception threshold. Audit's own verdict ("only optimize if UX reports slowness") matches measurement; refactor not warranted. No commit; TODO Active updated.
- Last validated: admin1-title (HEAD `303e4c5`) + showOnSchedule preservation (`5fece50`) phone-smoke PASS prod 2026-04-25 -- form picker / cell render / PDF / tooltip / modal all clean per JR
- Last validated: `npm run build` PASS at HEAD `1d0ccb1`; modern 472.57 kB / gzip 118.64 kB (+0.27 raw / +0.18 gzip vs `3cf6b09`); legacy 493.15 / gzip 120.09 (+0.31 raw / +0.14 gzip) -- expected delta for new memoized component file
- Last validated: `npm run build` PASS at HEAD `3cf6b09`; modern 472.30 kB / gzip 118.46 kB (-10.33 raw / -2.70 gzip vs `66dae73` baseline); legacy 492.84 / gzip 119.95 (-7.43 raw / -2.81 gzip); new `generate-*.js` chunk 11.77 kB modern / 10.12 kB legacy emitted (PDF lazy)
- Last validated: ColumnHeaderCell extract + scheduledByDate lookup (`1d0ccb1`) localhost Playwright PASS 2026-04-25 -- desktop 1400x900: column header click on Sat Apr 25 in Edit Mode opened ColumnDayEditModal with correct context (Saturday, Apr 25 / Store Hours 11:00-19:00 / Staffing Target 20); past dates rendered with "Past dates cannot be edited" tooltip + no cursor=pointer; wave 1 ScheduleCell click-to-edit still opens "Edit Shift" dialog (no regression). Mobile 390x844: MobileAdminView column headers render correct scheduled/target via O(1) lookup; tap on mon-4 opens "Monday, May 4" dialog. Console: 0 errors, 0 warnings across full session.
- Last validated: ScheduleCell memo restore (`feb094b`) localhost Playwright PASS 2026-04-25 at 1400px desktop -- cell click in row 0 + row 2 (Alex Fowler Thursday Apr 23) opened ShiftEditorModal with correct (employee, date, shift) tuple; modal escape closed cleanly; zero console errors/warnings
- Last validated: PDF lazy-load (`3cf6b09`) localhost Playwright PASS 2026-04-25 -- initial admin boot did NOT fetch `pdf/generate.js` (network confirmed); explicit dynamic import resolved with `generateSchedulePDF` export; mobile drawer (390x844) "Export Schedule PDF" generated real PDF blob "Rainbow Schedule - Week 17 & 18"
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
- Last validated: sick-mark feature + ShiftEditorModal redesign shipped 2026-04-24 across 13 commits (HEAD `c012e1d`). localhost Playwright smoke PASS at each stage: initial sick-as-tab (Sarvi Mon 57h->47h, Mon headcount 12->11), then tap-to-toggle (tap Meeting unlit books MTG 2p, tap again unbooks, Work same), then stale-prop fix (Work now toggles symmetrically), then diagonal red stripe + unified warning box (with `unavailable` + `Nth consecutive` bolded in the multi-reason case). No console errors at any step.
- Missing validation: prod smoke of sick-mark end-to-end (admin toggle + cell renders amber bg + red diagonal stripe + struck work row + PERIOD drops + headcount drops, PDF/email week totals reflect 0 for sick day) -- pending JR phone-smoke after Vercel redeploys latest HEAD `c012e1d`.
- Missing validation: prod smoke of Floor Supervisor role (Default Role label in Employee form, Floor Supervisor in dropdown, Supervisor cell renders OTR green rgb(0,168,77), PDF FS glyph + 2px ink border) -- pending JR phone-smoke after Vercel redeploys HEAD `39c2d62`.
- Missing validation: prod smoke of sick-flow polish (`4504990`) -- Save button enabled when sick is active; typing reason without blurring then tapping Save persists; cell renders italic muted reason replacing struck time/hours; falls back to struck time/hours when reason empty.
- Missing validation: prod smoke of opaque day-header (`daa4bbb`) -- mobile-admin sticky header with today/holiday cells no longer shows scrolling body through; desktop admin + employee headers also use the same `linear-gradient + bg.tertiary` pattern for parity.
- Missing validation: prod smoke of part-time Clear (`d678948`) -- desktop dropdown lists All Part-Timers + PT individuals with shifts; mobile Actions sheet has same; clear-all-pt confirm copy.
- Missing validation: prod smoke of unified warning (book Gary on his Sunday → one amber box with "marked unavailable on Sundays"; if also 5+ streak, both reasons as bullets with bolded key parts).
- Missing validation: prod smoke of logo-as-home-button (tap OVER THE RAINBOW logo from any admin view → returns to Schedule tab, current period, week 1, scrolled top; same on employee views).
- Missing validation: prod phone-smoke of ScheduleCell memo (`feb094b`) + PDF lazy (`3cf6b09`) + ColumnHeaderCell extract / scheduledByDate (`1d0ccb1`) -- pending JR phone-test after Vercel redeploys all three. Watch: cells still tap to open editor; mobile drawer Export PDF still generates schedule (first click stalls ~200ms while chunk loads); column header taps still open day-edit modal in Edit Mode and show locked tooltip outside Edit Mode.
- Last validated: N meetings per day modal + render + backend (`089adaa` + Apps Script v2.3) localhost Playwright PASS 2026-04-25 desktop 1400x900 + mobile 390x844. Steps A/B/5/F/E + round-trip + cleanup + 0 console errors. Pending: prod phone-smoke after Vercel redeploys frontend.
- Missing validation: prod phone-smoke of N meetings per day + multi-event eventOnly render (`089adaa` + `651712d`) -- pending JR phone-test after Vercel redeploys frontend. Watch: tap cell -> Meeting tab -> first meeting card with NO X -> save; tap cell again -> "+ Add another meeting" -> 2nd card WITH X -> save; cell renders two stacked `[MTG][time]` mini-rows; add 3rd meeting -> cell collapses to "3 events" + first time; cell tap-toggle of Meeting (lit) removes LAST.
- Deferred: `backfillShiftStartsDryRun`/`Live` never run -- JR determined redundant given clear+autofill flow (autofill skips PT; Sarvi rebooks PT manually with new 10:00/10:30 prefill from `c7cd101`).
- Missing validation: prod smoke of PT click-to-book prefill (should be 10:00 or 10:30 per day, was 11:00) -- shipped `c7cd101` on Vercel, hand-confirm pending.
- Missing validation: prod smoke of meeting prefill (should be 14:00-16:00, was "next full hour") -- shipped `c7cd101`.
- Missing validation: prod smoke of schedule-grid time labels (10:30-19:00 shifts should read "10:30a-7p", not "10-7") -- shipped `06f0027`.
- Missing validation: no automated test suite; manual Playwright smoke only
- Missing validation: desktop name column (fixed width, first/rest, header vs body same template) on prod after `a07ab98` -- JR phone-smoke
- Missing validation: prod smoke sick day clears meetings/PK in grid + sheet save (`e9772c8`); PDF Export opens tab + print preview (`8affd22`); title field clear + space warning (`dd1a7c2`); PDF legend shows MTG/PK/SICK (`0d3220e`)
- Missing validation: prod phone-smoke `5f5f16f` -- shift+events cells render `[role][MTG×N]` Row 1 + time/hours Row 2 with no overlap or clip across desktop admin/employee + mobile admin/employee; task star renders inline Row 2 right (not corner); 3+ mixed types render as `MTG +N` rollup pill.
- Missing validation: prod phone-smoke `78f02d7` -- PKEventModal edit mode (open with existing PK booked -> currently-booked are checked; Save reads `Save (+N -M)` and enables on any add OR remove; Save persists adds + removes atomically via batchSaveShifts). Saturday quick-pick shows filled brand-accent + glowing ring + checkmark when active; tap again reverts to today's default day + default times.
- Missing validation: prod phone-smoke `63420ce` -- bulk-clear PK from outside modal: desktop Clear dropdown gains "PK by day" optgroup listing dates with PK; mobile clear sheet shows same per-day rows; tap -> AutoPopulateConfirmModal "Clear all N PK booking(s) on Day Mon DD?" -> confirms -> events removed (UNSAVED, admin clicks SAVE on schedule to persist).
- Missing validation: prod phone-smoke `1d26daf` -- PDF logo-to-schedule gap reduced ~20-27px between OTR wordmark and first table row; visually compare prior export vs new on iPad print preview.
- Missing validation: prod phone-smoke `0fe138c` -- PKDetailsPanel renders below announcement on desktop admin grid + mobile admin comms tab + desktop employee grid + mobile employee alerts sheet when PK is booked in period; shows day/time/booked-count + names + note; returns null when no PK in period.

## Completed

- [2026-04-26] PK details near announcements panel (commit `0fe138c`). New shared `<PKDetailsPanel>` at `src/components/PKDetailsPanel.jsx` aggregates PK events across all employees into unique `{date, startTime, endTime}` slots within the period; per-slot displays day label, time range, booked count, employee names (first 3 + `+N more`), optional note in italic muted. Returns null when no PK in period (non-invasive guarantee). Mounted as a sibling AFTER the announcement panel on 4 paths: desktop admin grid (App.jsx ~L2376), mobile admin comms tab (App.jsx ~L1888), desktop employee grid (EmployeeView.jsx ~L860), mobile employee alerts sheet (MobileEmployeeView.jsx ~L767). All 4 scoped to full pay period to match announcement scope. Build PASS at `0fe138c`. Bundle delta vs `1d26daf`: modern +2.46 kB raw / +0.56 kB gzip (488.13 / 123.25); legacy +2.42 raw / +0.49 gzip (508.75 / 124.83). Smoke skipped per JR direction; prod smoke pending JR.
- [2026-04-26] PDF logo-to-schedule gap tightened (commit `1d26daf`). `src/pdf/generate.js`: header div margin-bottom 25->12 + padding-bottom 15->8; inner Josefin div margin-bottom 5->3; Staff Schedule p margin-top 8->4; announcement wrapper margin 15->8. Saves ~20-27px between OTR wordmark and first table row. No structural changes; row-height behavior unchanged (still wraps + grows via tallest cell). Append to `CONTEXT/pdf-print-layout.md` "tried" list. Build PASS. Smoke skipped per JR direction; prod smoke pending JR.
- [2026-04-26] Bulk-clear PK by day from outside the modal (commit `63420ce`). New helper `daysWithPKInWeek(weekDates)` (App.jsx ~L621) returns `{dateStr, date, count}[]` for dates with >=1 PK in the week. New helper `clearPKForDate(dateStr)` (App.jsx ~L788) mutates `events`, marks unsaved (matches `clearWeekShifts` pattern; admin clicks SAVE to persist via `batchSaveShifts`). Desktop Clear `<select>` gains a "PK by day" optgroup (App.jsx ~L2325) listing each date with `Wed Apr 29 — 5 PK` style label, scoped to the active week. Mobile `MobileScheduleActionSheet` clear level gains same per-day rows under a "PK by day" subheader. New `clear-pk-day` branch in `handleAutoPopulateConfirm` + `AutoPopulateConfirmModal` copy variant `Clear all N PK booking(s) on <Day, Month DD>?`. Build PASS. Smoke skipped per JR direction; prod smoke pending JR.
- [2026-04-26] PKEventModal edit mode + distinct Saturday toggle (commit `78f02d7`). Modal becomes aware of existing PK bookings via new `events` prop; `existingPKBookedIds` keyed by date+startTime+endTime drives initial checked state in edit mode (was-already-booked = checked). Save dirty-state computes adds + removes diff; Save enables on any change; label reads `Save (+N -M)`. Closes the bug where deselecting a booked person left Save greyed. handleBulkPK rewritten: drops `bulkCreatePKEvent` API call in favor of unified period-save path -- adds synthesize PK rows client-side, removes drop matching entries, both persist atomically via existing `batchSaveShifts`. Reverts state on failure. Saturday quick-pick: filled brand-accent (today's rotating purple) + 2px glowing ring + `✓` glyph when active; tap again reverts date to today + times to defaults. Build PASS at `78f02d7`. Bundle delta vs `5f5f16f`: modern +1.77 kB raw / +0.74 kB gzip (483.74 / 122.01). Localhost Playwright smoke 2026-04-26 PASS desktop 1400x900: full round-trip booked Alex Fowler PK on Sat May 2 -> reopened modal -> Alex showed `aria-checked=true` (edit mode) + Save read `Save ()` disabled -> deselected Alex -> Save read `Save (-1)` enabled (THE BUG IS FIXED) -> clicked Save -> modal closed cleanly -> reopened -> back to create mode (no bookings). 0 console errors. Direct execution (no /coding-plan) per JR's iteration tempo + 2-file scope. Backend `bulkCreatePKEvent` stays in `Code.gs` as legacy (no harm).
- [2026-04-26] Schedule cell density unification (commit `5f5f16f`, plan `~/.claude/plans/wild-mixing-sparkle.md`). New shared `<EventGlyphPill>` at `src/components/EventGlyphPill.jsx` drives event rendering across all 4 cell paths: N=1 full pill, N>=2 same-type `shortLabel×N`, N>=2 mixed `shortLabel +N-1`. ScheduleCell + MobileAdminView replace inline event-mapping with the shared pill. EmployeeView eliminates `absolute bottom-0 right-0` events block + `absolute top-1 right-1` task star — both move inline to a 2-row layout. MobileEmployeeView collapses 3-row layout to 2-row. Build PASS at `5f5f16f`. Bundle delta vs `adcc0aa`: modern -1.05 kB raw / +0.04 kB gzip; legacy -0.97 kB raw / -0.01 kB gzip. Localhost Playwright smoke 2026-04-26 PASS desktop 1400x900 + mobile 390x844. Prod phone-smoke pending JR.
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
