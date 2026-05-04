<!-- SCHEMA: TODO.md
Version: 5.2
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Concision via shape, not word count -- match the example structure.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

gamboge. predictive coding.

- **Audit-fix plan complete -- 4 batches + 2 hotfixes shipped, paste-deployed, smoked clean.** Plan retired at `~/.claude/plans/audit-fixes-2026-05-02.md` (kept for reference, not active). H3 deferred to migration (see Blocked). Pick next from this Active list.

- **[s058 raised by JR] Login screen default-password copy is wrong.** Page currently says use your employee id as password. After the v2.27.0 FirstnameL switch, the default is FirstnameL (e.g. "JohnR" -- first name + last initial, no space, case-insensitive at first login). Update `LoginScreen.jsx` (or wherever the help copy lives) to "Your default password is your first name and last initial with no space, e.g. JohnR." Frontend-only, single file, single commit.

- **[s058 raised by JR] Day Status segmented control: rename "Working" -> "Available".** The current `[Working | Sick | Unavailable]` triple in `ShiftEditorModal` (s057 commit `e53768e`) reads as confusing because the cell underneath says "work" too. "Available" matches the semantic of the other two states (Sick / Unavailable describe day-state, not action). Rename in the segmented-control labels only; the `dayStatus` state values stay unchanged (`'working'` internal token is fine). Single file (`ShiftEditorModal.jsx`), single commit.

- **[s058 raised by JR] Desktop period-nav missing the Future / Past / Current Period label.** Mobile period-nav at the top of the schedule view shows a label distinguishing whether the active period is in the future, past, or current. Desktop version doesn't. Parity ask. Locate the label render in the mobile period-nav component, mirror onto the desktop period-nav (likely a sibling render in `App.jsx` or a shared period-nav primitive). Mobile + desktop parity rule applies.

- **[s058 raised by JR] Long press still isn't working.** s057 commit `9ae5ed8` shipped long-press detection on multi-event mobile cells (500ms timer + 10px move-cancel + click suppression via `useLongPress` hook + `LongPressCell` wrapper + `EventDetailSheet`). JR reports it still doesn't fire on his phone. Likely candidates: (a) touch-event handlers not registering in the `LongPressCell` wrapper after some recent regression; (b) the click-suppression `firedRef` getting stale across renders; (c) a CSS `touch-action: pan-x` or `manipulation` somewhere intercepting the long press; (d) iOS-specific event-firing differences. First step: instrument the hook with a console log on touchstart / move / end / fire and have JR phone-smoke. Files to inspect: `src/hooks/useLongPress.js`, `src/components/LongPressCell.jsx`, `src/components/EventDetailSheet.jsx`, the wiring in `MobileAdminScheduleGrid` and `MobileScheduleGrid`.

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 §3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **EmailModal v2 + email-format pass + post-redeploy smoke.** When picking up email-format work next: (a) verify s033-redeploy live behavior — send a schedule email, confirm branded HTML body lands; try saving a duplicate-email employee, confirm backend `DUPLICATE_EMAIL` rejects; (b) PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **App-usage instructions in welcome content (deferred -- JR will figure out approach).** Login URL, schedule location, default-password reveal, time-off / swap mechanics, sick/late/coverage policy. Currently Sarvi types these into the modal body per send. Not in scope of the shipped onboarding feature.
- **BCC otr.scheduler@gmail.com on schedule distribution emails.** Frontend `EmailModal.jsx:57` currently passes `{ to, subject, htmlBody, plaintextBody }`; backend `Code.gs:2156` calls `MailApp.sendEmail` with no `bcc`. Add `bcc: 'otr.scheduler@gmail.com'` so JR has a silent archive of every schedule send in the otr.scheduler inbox. Scope = schedule distribution only (`sendBrandedScheduleEmail`); decide later whether to extend to the 20 background notification emails (time-off / offer / swap / schedule-edit). Small (~5 lines backend + 1 line frontend, single commit).
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).

- **Default-password reveal in onboarding email body (deferred with the app-usage block above).** When app-usage instructions land in the welcome content, include the computed FirstnameL default password.
- Future-proofing audit -- research doc shipped 2026-04-26 at `docs/research/scaling-migration-options-2026-04-26.md`. Apps Script 7-8s floor identified as the highest-impact lever, not DB choice. Next: JR picks motivation OR ships CF Worker cache to defer the cliff.
- Perf + professional-app audit -- waves 1+2 shipped 2026-04-25; audit doc at `docs/perf-audit-app-jsx-2026-04-25.md`; next: prod phone-smoke wave 1+2.
- JR to delete `Employees_backup_20260424_1343` tab from Sheet once satisfied with widen result.
- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification (frontend + Apps Script v2.22 LIVE).
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test on phone (post-7a13cab).
- Adversarial audit Phase E -- pause or pick concrete motivation. App.jsx 3044 -> 2526 (-518, -17%). Sub-area 6 (Context provider) parked.
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip API_URL.
- Payroll aggregator path 1 -- blocked by demo go-ahead.
- Employees archive sheet w/ 5-year retention (Ontario ESA) -- raised s032. New EmployeesArchive tab + deletedAt + 5-yr auto-purge + owner-only Erase action. Schedule history snapshots emp name+id at delete time so render needs no archive lookup.
- Pre-launch test-employee hard scrub -- raised s032. Interim: JR deletes test rows in the Sheet directly. Durable: ride along with archive-feature Erase action above.
- [PARKED, do not surface] Staff-cell action menu -- raised 2026-04-18.
- [PARKED, do not surface] In-app accept/decline notification for Sarvi on shift switches -- raised s032; discuss after EmailModal conversion ships.

## Blocked

- **H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration)** -- when two admins both run a >15-shift save concurrently, each chunk acquires its own document lock, so the final chunk's `allShiftKeys` purge can delete the other admin's already-landed shifts. At OTR with one admin1, hit-rate is low. Real fix requires a server-side session ID coordinating across chunks; too invasive for Apps Script. Defer to migration. -- since 2026-05-03
- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor.

## Verification

- Last validated: s042 B2 sweep (1 commit `2254b25`) at HEAD `2254b25` 2026-04-29. Build PASS. Playwright smoke 4/4 PASS on prod (bundle `index-Df2GvNEw.js`): app loads clean post J1 ~80-line comment delete; violations count parity (74 violations same as cce033a); ShiftEditorModal correctly re-seeds when admin swaps employees on same date (Sarvi → Dan Carman live-verified); PKModal REMOVE keyboard a11y code-verified (role/tabIndex/aria-expanded/aria-label/onKeyDown all shipped at PKModal.jsx:480-487; live keyboard test needs PK bookings, none on Wk17). 0 console errors/warnings across all flows. Smoker flagged: pre-existing "Mark as sick" pink-state for some employees (data, not regression); mobile violations panel doesn't open at 390px (pre-existing limitation).
- Last validated: s042 (full /audit, 1 commit `cce033a`) at HEAD `cce033a` 2026-04-29. Build PASS. Playwright smoke 3/3 PASS on prod (bundle `index-Dby6BZOj.js`): desktop name-cell tooltip mailto link no longer opens new tab (target=_blank removed); 240px name column still wired (DESKTOP_SCHEDULE_NAME_COL_PX internal use intact); desktop + mobile violations buttons both expose `aria-label="74 schedule violations"`. 0 console errors. Plural branch exercised; singular `"1 schedule violation"` branch not exercised (74 pre-existing violations) — low-risk template-literal correctness, build PASS.
- Last validated: s040 (audit-deferred sweep, 4 commits a042352→139b056) + s041 (audit-session sweep, 2 commits 77ca174→4d0cf50) at HEAD `4d0cf50` 2026-04-29. Build PASS all 6 commits. Playwright smokes: s040 desktop+mobile 5/5 PASS at HEAD `139b056` (Tab+Enter+Escape on schedule cells, column-header popover trap, native Checkbox toggle, mobile drawer Tab trap, mobile shift sheet); s041 mobile 3/3 PASS at HEAD `4d0cf50` (day-cell role/keyboard, Sarvi titled-row no role-name, non-titled regression code-verified — no published shifts to screenshot). 0 console errors across both smokes. Production URL confirmed `https://rainbow-scheduling.vercel.app` (the `otr-rainbow-scheduling` prefix is a 404).
- Last validated: s039 multi-commit bug sweep — build PASS at HEAD `c7e3aed` 2026-04-29 across 4 fix commits (`b220f5c` utils chore, `849c4cf` request-history, `c979b32` correctness, `c7e3aed` a11y). No Playwright smoke run; all changes are dead-code removal, optional-chain guards, aria-label adds, or behavior-equivalent memo refactors. Defer phone-smoke to JR.
- Last validated: s038 perf refactor Playwright smoke on prod at HEAD `c1cb083` 2026-04-28 -- desktop 1280x800 + mobile 390x844 schedule grid renders, 0 console errors, `approvedTimeOffSet` prop wired clean. Bottom-sheet shift-cell click NOT exercised (no published Wk17/Wk18 schedule on prod); approved-time-off red/striped rendering NOT visually confirmed (testguy has no approved time-off rows). Logic-side confirmed via no-errors only.
- Last validated: PDF portrait redesign Playwright smoke at HEAD `bdd838b` 2026-04-28 s032 -- export opens, 3-page layout works, Notes box renders. Subsequent UI tweaks (5e8bb9d ... d28a1d8) build-PASS only; no further visual smoke this session.
- Last validated: Phone-smoke batch via Playwright @ 390x844 mobile viewport 2026-04-27 s032 (HEAD `4e32a35`) -- schedule consolidation, F10 wk2, mobile shift-detail role pill, mobile eyebrow ★, Unavailable copy, Mine view, Employees panel chip filter all PASS. 0 console errors.
- Last validated: Duplicate-email frontend guard Playwright PASS at HEAD `4e32a35` -- "gary.scott434@gmail.com" collision blocked with inline error "already used by Gary".
- Last validated: PDF Export prod-smoke at HEAD `62f419b` -- print preview opens, no console errors, Week 1 closes header gap.
- Missing validation: Apps Script backend redeploy gate -- `sendBrandedScheduleEmail` + duplicate-email mirror check both dormant.
- **Apps Script live = `bcb12fd` (v2.31.0 paste-deployed 2026-05-03).** Onboarding email backend stack live: `sendOnboardingEmail` action + `backfillOnboardingDates` one-shot (ran, N=36 active employees marked) + `WELCOME_TEMPLATE_HTML_` + `LAUNCH_LIVE_=false` recipient gate + 6 brand/onboarding constants. v2.30.2 refactor (commit `23ad13b`) shipped same day before v2.31.0. All prior audit-fix backend stack still live. **PENDING paste:** commit `c817f07` v2.31.1 (wraps typed body in `BRANDED_EMAIL_WRAPPER_HTML_` so email body matches schedule-distribution branding). Behavior change is visual only on bodies that have content; empty bodies unchanged.

- **Last validated: s056 bundled end-of-plan smoke at HEAD `39c55e0` 2026-05-03.** 5/5 PASS on prod (`https://rainbow-scheduling.vercel.app`): (1) v2.29.1 changePassword case-fold -- Test Guy completed Set-Your-Password modal `TestG` -> `TestG7`, then re-login no modal; (2) Batch 3 TOCTOU happy-path -- shift edit + save clean, no false CONCURRENT_EDIT, 0 console errors; (3) v2.30.1 lock-timeout symmetry -- both `withDocumentLock_` + `batchSaveShifts` at `tryLock(10000)`; (4) Batch 4 M8 -- corrupted `otr-auth-token`, redirect fired, banner "Your session ended. Please sign in again." rendered correctly (executor's race-condition flag was a non-issue); (5) Batch 4 M10 + M11 -- schedule + request panel render clean, 0 errors. Test Guy returned to Inactive + password reset to FirstnameL default `TestG` (`passwordChanged=false` preserved by Batch 1 allowlist drop).
- **Audit Stage 3 triage deferred:** `/audit` v5 inventory captured at `.claude/skills/audit/output/inventory.md` (~25 findings across D/E/F/H/I/J/L). Stage 3 Sonnet triage NOT run; B1 ship-list NOT generated. Next session can resume from triage by re-running `/audit` (the cached map + inventory will be reused) OR by spawning a triage-only Sonnet agent reading `inventory.md`. Stage 6 dated report NOT written.
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-05-03] **Onboarding email modal + welcome PDF rebrand (commits `bcb12fd` backend v2.31.0 + `062bb22` frontend + `c817f07` v2.31.1 body-wrap hotfix + `eb89e92` state-refresh)** -- Saving a new employee auto-opens an `OnboardingEmailModal` (free-form plaintext body editor, 3 pre-filled attachments: per-recipient branded welcome PDF + 2 static TD1 PDFs read from Drive at runtime, functional `+ Add file` for one-off uploads with 10 MB / 25 MB caps). Envelope indicator inside `EmployeeFormModal` (edit mode only) shows `welcomeSentAt` state -- filled green = sent (with date), outline grey = blank -- and re-opens the modal in resend mode (amber banner "Already sent on YYYY-MM-DD. Original timestamp preserved."). New Employees-sheet column `welcomeSentAt` (col Y, ISO timestamp); backfill ran for N=36 active rows on deploy. Backend `sendOnboardingEmail` action: server-templated welcome HTML -> `Utilities.newBlob(html,'text/html').getAs('application/pdf')` -> MailApp with 3 attachments + BCC `otr.scheduler@gmail.com`; v2.31.1 wraps the typed body in `BRANDED_EMAIL_WRAPPER_HTML_` so the email body matches schedule-distribution branding. Pre-launch recipient-rewrite gate (`LAUNCH_LIVE_=false`) forces every send to `johnrichmond007@gmail.com` until launch flip. Idempotent welcomeSentAt -- first send sets, resend preserves original. Frontend state-refresh fix (`eb89e92`) wires `onSendSuccess` callback so envelope flips green immediately without page reload. Verified end-to-end via direct API + agent-browser modal-driven smoke (`success:true, sentTo:johnrichmond007@gmail.com, welcomeSentAtUpdated:true, rewrittenForLaunch:true`); JR confirmed receipt of branded emails with 3 PDF attachments. Test row `Onboard Smoke` deactivated post-smoke. Plan: `~/.claude/plans/wild-puzzling-lighthouse.md`.

- [2026-05-03] **v2.30.2 refactor: batchSaveShifts uses withDocumentLock_ helper (commit `23ad13b`, backend Code.gs v2.30.2)** — Parked from s056 v2.30.1 decision. Replaces inline `LockService.getDocumentLock() + tryLock(10000) + try/finally releaseLock` pattern in batchSaveShifts with the existing `withDocumentLock_` helper. Single source of truth for lock instance, 10s timeout, CONCURRENT_EDIT response shape. Behavior unchanged. CONCURRENT_EDIT message changes from "Another admin is saving the schedule" to "Another action is in progress (saving the schedule)" via the helper's errorContext arg. **PENDING paste-deploy** -- live still v2.30.1.

- [2026-05-03] **Admin Day Status segmented control: Working/Sick/Unavailable (commit `e53768e`)** — Sarvi can now mark any single day as unavailable for any employee without editing recurring default availability or filing a time-off request. New `unavailable` event type joins the existing `meeting | pk | sick` set in `EVENT_TYPES`. ShiftEditorModal refactored: replaces the standalone "Mark as sick" Thermometer toggle with a 3-state radiogroup `[Working | Sick | Unavailable]` at the top of the editor. Sick keeps its note input; Unavailable has no note. Selecting non-Working states mutes Work/Meeting/PK pills + time pickers (existing pattern). 4 cell renderers (ScheduleCell, EmployeeScheduleCell, MobileScheduleGrid, MobileAdminView inline) detect admin-set unavailable and route to existing isFullyUnavailable render branch (same grey "Unavailable" pill). `unavailable` is filtered out of visibleEvents -- it's a status marker, not a displayable event. autoPopulateWeek skips marked days. saveShift blocks work-shift saves on admin-unavailable days with toast. Hours computation (getEmpHours + computeWeekHoursFor) treats unavailable as 0h (same exclusion as sick). No backend changes -- type is free string with (emp, date, type) uniqueness. Smoke @ 1280x800: Day Status renders, Unavailable saves + reverts, Sick path 100% preserved (note input + placeholder), Sarvi 0.0h hours preserved through unavailable mark, 0 console errors, cleanup verified.

- [2026-05-03] **Mobile long-press on multi-event schedule cells opens detail sheet (commit `9ae5ed8`)** — New `useLongPress` hook (`src/hooks/useLongPress.js`, ~30 lines, 500ms timer + 10px move-cancel threshold + click-suppression via `firedRef`). New `EventDetailSheet` component (`src/components/EventDetailSheet.jsx`, ~40 lines) wrapping the existing `MobileBottomSheet` primitive. New `LongPressCell` wrapper (`src/components/LongPressCell.jsx`) handles per-cell hook instance + click suppression so `useLongPress` can be used inside a `.map()` loop. Wired into `MobileAdminScheduleGrid` (admin mobile schedule, td cells) and `MobileScheduleGrid` (employee mobile schedule, div inside td); `MobileMySchedule` skipped because it already inlines per-event detail per row. Existing tap behavior preserved -- admin tap still opens ShiftEditorModal; long-press suppresses the click. Smoke @ 390x844: Sarvi Mon Jun 15 with Meeting+PK -> long-press opens sheet showing both events with type pills + times; tap on same cell still opens ShiftEditorModal; 0 console errors.

- [2026-05-03] **Mobile violations triangle button now opens panel (commit `33438e6`)** — root cause: the AdaptiveModal render block (App.jsx:2579-2620 pre-fix) lived only inside the desktop admin return; the mobile admin return at line 2107 exited before reaching it, so `setViolationsPanelOpen(true)` updated state but no panel ever mounted on mobile. Hoisted the JSX into a shared `violationsPanelEl` const next to `pkModalEl`, rendered it in both mobile and desktop returns. Same pattern as `pkModalEl` already uses. Frontend-only, Vercel auto-deploy. Smoked locally @ 390×844: triangle opens dialog with both Nicole Seeley + Owen Bradbury violations rendered, 0 console errors. The "Mine tab missing shifts" item raised in s055 closed as **non-bug** s057 — JR was checking Sarvi's view while logged in as JR himself; JR is `isOwner` so Mine is empty by design. Mine tab works correctly when logged in as the actual employee (verified in s057 with new Test Admin fixture, see `reference_smoke_logins.md`).

<!-- Older Completed entries trimmed per schema ">=5 most recent". Full history in git log. Recent trims: s058 trim (4a227d0 + 39c55e0 Audit fixes Batch 4 frontend session integrity + defensive guards); s057 trim (7abe364 v2.30.1 lock-timeout symmetry + 04f6912 Batch 3 TOCTOU + 1164c53 v2.29.1 changePassword case-fold + 31f1c23 Batch 2 type filter/cache bust/email lowercase); s056 trim (d18e72a Batch 1 audit fixes + adversarial-audit-plan-written + 6a17dcc violations panel + 8ab6a05 FirstnameL + 47a4ef4 eye-toggle); s055 trim (9376c7b mobile staff parity + Sheet boolean normalization, 3093c60 admin1 protection, f1efc38 self-lockout + owner-deactivation guard, 1a492ef 12h TimePicker, 576e50e EmailModal filter useMemo). -->

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
