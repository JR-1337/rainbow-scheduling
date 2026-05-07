<!-- SCHEMA: TODO.md
Version: 6.4
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Concision via shape, not word count -- match the example structure.
- ASCII operators only (see Operator Legend in the Telegraphic Memory Style section of specs/BOOTSTRAP_REFERENCE.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

cinnabar. predictive coding.

- **New-user UX audit shipped 2026-05-07 -- findings doc at `docs/audit/new-user-experience-2026-05-07.md`.** Section 5 lists 9 ranked R1-R9 fixes; high-impact-low-effort starter pack is **R1** (add app URL + default-password line to welcome email), **R2** (soften unconditional FirstnameL hint at `LoginScreen.jsx:130`), **R3** (4-char min hint in `ChangePasswordModal`), **R4** (update stale ARCHITECTURE.md emp-XXX -> FirstnameL). Section 6 outlines New-User Guide mini-project (6 topics, 3 format options, screenshot inventory). JR review pending; pick fix bundle + guide format -> separate /coding-plan each.
- **Admin Edit Employee form has 4 surfaced bugs (s071 fixture-rename surfaced).** Add to next audit-fix bundle: (1) **Save button silent no-op** -- on certain field combinations (admin demote + active flip in same submit), Save fires no fetch + no error, modal stays open. (2) **Toast hides behind modal** -- "Admin accounts cannot be deactivated. Demote to Staff first." renders at lower z-index than open dialog so user sees stuck Save with no feedback. (3) **`editingEmp.isAdmin` is a stale closure** at `App.jsx:891` -- guard checks original row not in-form pending state; demote-then-deactivate requires 2 separate saves. (4) **No clean admin1 resting-Inactive state** -- system requires demote-to-Staff before deactivate; resting state must be Inactive+Staff with promote step at start of each test session.
- **Test fixtures renamed and Inactive 2026-05-07.** Final live state: `john@johnrichmond.ca` -> Test Employee1 (Staff, password `TestE`); `johnrichmond007+onboarding-smoke@gmail.com` -> Test Employee2 (Staff, password `TestE2`); `johnrichmond007+testadmin@gmail.com` -> Test Admin (Staff at rest, password `TestA`). For shift-switch testing 3 months out, use weeks of Aug 3-9 / 10-16 / 17-23 / 24-30 (clear of Sarvi's typical view). To exercise admin tier: Reactivate -> set Admin tier -> save -> test -> demote to Staff -> set Inactive -> save.

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 section 3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **App-usage instructions in welcome content (partially addressed by audit R1).** Login URL, schedule location, default-password reveal, time-off / swap mechanics, sick/late/coverage policy. R1 in audit-fix bundle covers URL + password line; full app-usage walkthrough is the New-User Guide mini-project (Section 6 of audit doc).
- **[s060 raised by JR] In-app bug-report button + AI investigator pipeline.** New per-user "Report a bug" button that emails JR (or a dedicated label-routed mailbox); AI agent monitors that label, investigates each report, returns to JR a triage report (problem reproduction, code-level findings, proposed fix) for approve / amend / reject. Scope: (1) frontend report button + form (description, optional screenshot, current-page state capture, user agent), (2) backend `submitBugReport` action -> emails JR with structured payload, (3) external pipeline: cron-fired AI agent reads label, opens repo, drafts findings + proposed patch, lands as a draft PR or a triage doc for JR. Kept post-launch (not pre-launch) because staff-email allowlist gate doesn't apply to JR-as-recipient. Defer pricing/AI-runtime decision to scoping pass.
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
- Pre-launch test-employee hard scrub -- raised s032. s071 standardized fixture identities (Test Employee1/2/Admin); when launch nears, decide whether to archive or purge via the Erase action (admin1 tier; trail through `EmployeesArchive`) or via Sheet UI.
- [PARKED, do not surface] Staff-cell action menu -- raised 2026-04-18.
- [PARKED, do not surface] In-app accept/decline notification for Sarvi on shift switches -- raised s032; discuss after EmailModal conversion ships.

## Blocked

- **Pitch deck Proposal slide micro-fixes -- deferred per ship-over-patch (DECISIONS s064).** (1) Chart caption "pays for itself before it begins" is mathematically false at month 0 (Rainbow $1,500 implementation, status quo $0; status quo catches up at ~month 0.6). (2) Walk-away cap floor/ceiling ambiguity ($2,991 ceiling, $1,500-$2,494 floor depending on walk-month). Drafted A1/B1 wording in s064 conversation if needed. Revisit only if Joel/family flag in person. -- since 2026-05-04
- **H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration)** -- when two admins both run a >15-shift save concurrently, each chunk acquires its own document lock, so the final chunk's `allShiftKeys` purge can delete the other admin's already-landed shifts. At OTR with one admin1, hit-rate is low. Real fix requires a server-side session ID coordinating across chunks; too invasive for Apps Script. Defer to migration. -- since 2026-05-03
- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor.

## Verification

- Last validated: s042 B2 sweep (1 commit `2254b25`) at HEAD `2254b25` 2026-04-29. Build PASS. Playwright smoke 4/4 PASS on prod (bundle `index-Df2GvNEw.js`): app loads clean post J1 ~80-line comment delete; violations count parity (74 violations same as cce033a); ShiftEditorModal correctly re-seeds when admin swaps employees on same date (Sarvi  ->  Dan Carman live-verified); PKModal REMOVE keyboard a11y code-verified (role/tabIndex/aria-expanded/aria-label/onKeyDown all shipped at PKModal.jsx:480-487; live keyboard test needs PK bookings, none on Wk17). 0 console errors/warnings across all flows. Smoker flagged: pre-existing "Mark as sick" pink-state for some employees (data, not regression); mobile violations panel doesn't open at 390px (pre-existing limitation).
- Last validated: s042 (full /audit, 1 commit `cce033a`) at HEAD `cce033a` 2026-04-29. Build PASS. Playwright smoke 3/3 PASS on prod (bundle `index-Dby6BZOj.js`): desktop name-cell tooltip mailto link no longer opens new tab (target=_blank removed); 240px name column still wired (DESKTOP_SCHEDULE_NAME_COL_PX internal use intact); desktop + mobile violations buttons both expose `aria-label="74 schedule violations"`. 0 console errors. Plural branch exercised; singular `"1 schedule violation"` branch not exercised (74 pre-existing violations)  --  low-risk template-literal correctness, build PASS.
- Last validated: s040 (audit-deferred sweep, 4 commits a042352 -> 139b056) + s041 (audit-session sweep, 2 commits 77ca174 -> 4d0cf50) at HEAD `4d0cf50` 2026-04-29. Build PASS all 6 commits. Playwright smokes: s040 desktop+mobile 5/5 PASS at HEAD `139b056` (Tab+Enter+Escape on schedule cells, column-header popover trap, native Checkbox toggle, mobile drawer Tab trap, mobile shift sheet); s041 mobile 3/3 PASS at HEAD `4d0cf50` (day-cell role/keyboard, Sarvi titled-row no role-name, non-titled regression code-verified  --  no published shifts to screenshot). 0 console errors across both smokes. Production URL confirmed `https://rainbow-scheduling.vercel.app` (the `otr-rainbow-scheduling` prefix is a 404).
- Last validated: s039 multi-commit bug sweep  --  build PASS at HEAD `c7e3aed` 2026-04-29 across 4 fix commits (`b220f5c` utils chore, `849c4cf` request-history, `c979b32` correctness, `c7e3aed` a11y). No Playwright smoke run; all changes are dead-code removal, optional-chain guards, aria-label adds, or behavior-equivalent memo refactors. Defer phone-smoke to JR.
- Last validated: s038 perf refactor Playwright smoke on prod at HEAD `c1cb083` 2026-04-28 -- desktop 1280x800 + mobile 390x844 schedule grid renders, 0 console errors, `approvedTimeOffSet` prop wired clean. Bottom-sheet shift-cell click NOT exercised (no published Wk17/Wk18 schedule on prod); approved-time-off red/striped rendering NOT visually confirmed (testguy has no approved time-off rows). Logic-side confirmed via no-errors only.
- Last validated: PDF portrait redesign Playwright smoke at HEAD `bdd838b` 2026-04-28 s032 -- export opens, 3-page layout works, Notes box renders. Subsequent UI tweaks (5e8bb9d ... d28a1d8) build-PASS only; no further visual smoke this session.
- Last validated: Phone-smoke batch via Playwright @ 390x844 mobile viewport 2026-04-27 s032 (HEAD `4e32a35`) -- schedule consolidation, F10 wk2, mobile shift-detail role pill, mobile eyebrow *, Unavailable copy, Mine view, Employees panel chip filter all PASS. 0 console errors.
- Last validated: Duplicate-email frontend guard Playwright PASS at HEAD `4e32a35` -- "gary.scott434@gmail.com" collision blocked with inline error "already used by Gary".
- Last validated: PDF Export prod-smoke at HEAD `62f419b` -- print preview opens, no console errors, Week 1 closes header gap.
- **Last validated: s066 EmailModal v2 PDF end-to-end 2026-05-05..06 (JR).** Phase 0: HTML->PDF fidelity via probe + eyeball vs print preview OK. Phase 4 prod smoke: group send to `johnrichmond007@gmail.com` + individual to Test Guy `john@johnrichmond.ca` -- inline body unchanged, PDF attached, filename `OTR-Schedule-Wk{n1}-{n2}-{Mon}{D}.pdf`; Test Guy returned Inactive. Stack: frontend `1ac1052` + backend v2.32.4. Repo `backend/pdf-probe.gs` deleted post-smoke. Optional: confirm no stray `pdf-probe` script remains in Apps Script project editor.

- **Apps Script live = v2.32.5 (2026-05-06):** `saveEmployee` privilege matrix -- admin1 tier (`isOwner` or (`isAdmin` and `adminTier` neq `admin2`)) may set `isAdmin`/`adminTier` on non-owner targets; owner rows immutable for tier/owner flag/deactivate; no self `isAdmin`/`adminTier` change; only owners may change `isOwner` on a row. Frontend `d6010f4`: same predicate for payload strip; admin2 tier toggles greyed in `EmployeeFormModal`. Prior: v2.32.4 PDF email attach, v2.32.1 audit fixes, v2.32.0 archive, v2.31.x onboarding.

- **Last validated: schedule UI co-owner + hidden strip 2026-05-06 (JR).** Commit `74f78fc`: Sarvi visible on grid as co-owner with Show on schedule. Commit `7606c66`: JR omitted from hidden-staff strip via `SCHEDULE_UI_NEVER_LIST_EMAILS`; match list to Employees login email if needed.

- **Last validated: s067 `saveEmployee` matrix prod smokes 2026-05-06 (JR).** admin1 -> lower another admin ok; self tier change blocked; owner row tier/deactivate blocked; admin2 tier change error + UI grey/disabled. Plan verify-matrix closed.

- **Last validated: schedule PDF + grid UX pass 2026-05-06 (JR session-close).** Hierarchy row order + `SCHEDULE_ROW_FIRST_NAME_ORDER`; PDF brand lockup only on announcements/legend sheet; Staff Week 1 print top inset (5mm); wider desktop/mobile/PDF name columns + PDF first-name nowrap. Git range `db3e893`..`3ba199a`. Optional: fresh legal paper proof when next at printer.

- **Last validated: schedule grid sort 4-bucket restoration 2026-05-06 (s068, agent-browser localhost).** Commits `f58670d` + `b1c8ae0`: scheduleBucket = Sarvi(0)/Admin(1)/FT(2)/PT(3); admin block uses `SCHEDULE_FIRST_NAME_RANK` then alpha; FT and PT pure alpha. Live grid order verified: Sarvi -> Joel, Dan, Genia, Scott, Jess, Domenica, Axl, Isha, Patrisha, Anejli, Ella, Feng (admins) -> FT alpha (Alex F, Gary, Gellert, Natalie, Nicole, Nona, Rafeena, Rebecca, Savannah, Terry, William) -> PT alpha (Christina, Eli, Emily, Lauren, Matt, Molly, Nancy, Owen). Mobile and PDF surfaces inherit via shared bucket helpers; not separately smoked.
- **Last validated: PDF Export chunk-load self-heal 2026-05-06 (Sarvi prod).** `3b5380e` + `d4a1bf7` shipped; Sarvi hard-refreshed on her desktop and Export PDF works. Chunk-load auto-reload + persistent error modal both in place for future stale-bundle states.

- **Last validated: new-user UX audit + test-fixture rename 2026-05-07 (s071, agent-browser localhost).** Reset Test Guy `john@johnrichmond.ca` to default password `TestG`, walked the employee first-login journey end-to-end (login screen, Set Your Password modal, success flash, post-login schedule view, profile menu, second login no-modal); 7 screenshots in `~/.claude/scratch/audit-onboarding-2026-05-07/`. Renamed Test Guy -> Test Employee1, Onboard Smoke -> Test Employee2, retained Test Admin name; all three Inactive at session end (final counts Active 35 / Inactive 5 / Archive 2). Welcome email body code-read at `Code.gs:404-476`. Findings doc at `docs/audit/new-user-experience-2026-05-07.md` (10 ranked gaps G1-G10, 9 recommended fixes R1-R9, New-User Guide outline).

- **Last validated: cumulative iPhone 12 perf 2026-05-07 (Sarvi natural-use, s070).** 8-commit range `c386cb9`..`ffeafd6` (A1+A2+A3, A4, A5+B2+C3, autofill holiday-skip, long-press scroll fix, A6 mobile grid + cell memoization) cured Sarvi's "freeze sometimes" + scroll-freeze symptoms on iPhone 12. Sarvi reports natural use is great. Save-time freeze symptom did not recur. Per s069 handoff caution, B1 (lazy-load 14 modals) NOT pursued; cumulative work was sufficient.

- **Last validated: EmailModal v2 residuals 2026-05-07 (s070 code-verification).** Branded HTML at `src/email/buildBrandedHtml.js` audited line-by-line against the file's own email-safe ruleset and the LESSONS UTF-8 + em-dash rules: pass on all 7 rules + charset declaration + ASCII hyphens in subject + HTML-escape on user-injected content. Duplicate-email path: frontend `EmployeeFormModal.jsx:58-69` and backend `Code.gs:2368-2378` symmetric (both normalize, exclude self + deleted, return collision name). No code shipped.

- **Last validated: s056 bundled end-of-plan smoke at HEAD `39c55e0` 2026-05-03.** 5/5 PASS on prod (`https://rainbow-scheduling.vercel.app`): (1) v2.29.1 changePassword case-fold -- Test Guy completed Set-Your-Password modal `TestG` -> `TestG7`, then re-login no modal; (2) Batch 3 TOCTOU happy-path -- shift edit + save clean, no false CONCURRENT_EDIT, 0 console errors; (3) v2.30.1 lock-timeout symmetry -- both `withDocumentLock_` + `batchSaveShifts` at `tryLock(10000)`; (4) Batch 4 M8 -- corrupted `otr-auth-token`, redirect fired, banner "Your session ended. Please sign in again." rendered correctly (executor's race-condition flag was a non-issue); (5) Batch 4 M10 + M11 -- schedule + request panel render clean, 0 errors. Test Guy returned to Inactive + password reset to FirstnameL default `TestG` (`passwordChanged=false` preserved by Batch 1 allowlist drop).
- Missing validation: prod **legal paper** print of current PDF (kitchen-door legibility: grids + info sheet with enlarged lockup).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-05-06] **A6 mobile grid + cell memoization (`ffeafd6`).** Wrapped `MobileAdminScheduleGrid` + `MobileScheduleGrid` in `React.memo` and extracted memoized `MobileAdminScheduleCell` + `MobileScheduleCell` per-cell components mirroring the desktop `EmployeeRow` + `ScheduleCell` pattern. Per-cell derived computation (cellEvents filter, firstEvent, eventOnly, hasSick, isUnavailable, role, labelText, canDayDetail) and long-press payload construction moved inside the memoized cells. Pre-flight stabilized parent-side handlers (`getStaffingTarget`, mobile `onCellClick` / `onNameClick` / `onShiftClick`) via useCallback so the new memo wrappers actually hold. 490-cell mobile admin grid + 245-cell mobile employee grid no longer walk full cell trees on unrelated App re-renders. Plan: `~/.claude/plans/jazzy-singing-cupcake.md`. Build PASS, no Playwright smoke per plan; verification rests on Sarvi's experiential feedback.

- [2026-05-06] **Long-press scroll-freeze fix + s059 long-press regression closed.** `useLongPress` was attaching a non-passive `touchmove` listener to every mounted `LongPressCell` via `setTouchRef` + `useLayoutEffect`. With 490 cells on the mobile admin grid, every iOS Safari touch event had to walk 490 synchronous handlers before scroll could engage -- canonical iOS scroll-perf cliff. Dropped the native listener entirely; React `onTouchMove` + 28px coarse-pointer threshold still cancels the long-press timer on movement so long-press behavior is unchanged (Sarvi confirmed long-press works). Behavior change: scroll engages instantly on touch instead of being locked for up to 500ms. Also retires the s058->s059 long-press regression entry from Active.

- [2026-05-06] **Autofill skips stat holidays.** `autoPopulateWeek` (`src/App.jsx:730`) now returns early on `isStatHoliday(date)` after the existing `unavailable` event guard, so Auto-Fill week never books shifts on Ontario stat holidays (10 dates listed in `src/utils/storeHours.js`). Manual shift creation on holidays still allowed; clear-week behavior unchanged. Behavior gate matches Sarvi's request: "autofill is not to book on holidays."

- [2026-05-06] **s068 -- schedule grid sort 4-bucket restoration + PDF chunk-load resilience (`f58670d`..`d4a1bf7`).** Schedule sort: rebuilt `sortSchedulableByHierarchy` + `scheduleDisplayDividerGroup` around shared internal `scheduleBucket` (0=Sarvi, 1=Admin = `isAdmin or adminTier eq 'admin2' or isOwner`, 2=FT, 3=PT); admin bucket applies `SCHEDULE_FIRST_NAME_RANK` then alpha, FT and PT pure alpha; `employeeBucket` (Autofill) left at 5 values. `SCHEDULE_ROW_FIRST_NAME_ORDER` aligned to Sheet first names: `Daniel`->`Dan`, `Jessica`->`Jess`, `Anjali`->`Anejli`. PDF Export resilience: persistent error modal + Copy-to-clipboard button replace the auto-dismiss toast (`3b5380e`); chunk-load family (`Failed to fetch dynamically imported module` etc.) triggers `window.location.reload()` to self-heal stale-bundle state across deploys (`d4a1bf7`). Localhost agent-browser smoke confirmed grid order. Sarvi confirmed PDF chunk-load self-heal working post hard-refresh 2026-05-06.

- [2026-05-06] **Schedule PDF + grid UX -- hierarchy sort, brand-on-info-sheet, name widths, Week 1 print inset (`db3e893`..`3ba199a`).** `sortSchedulableByHierarchy` + `SCHEDULE_ROW_FIRST_NAME_ORDER`; PDF lockup moved/enlarged; mobile/desktop name columns; PDF Week 1 top padding matches Week 2.

<!-- Older Completed entries trimmed per schema ">=5 most recent". Full history in git log. Recent trims: 2026-05-06 A6-memoize trim (drop s066 EmailModal v2 PDF `1ac1052` + v2.32.4 + pitch `0a289d2` -- shipped clean, prod-smoked); 2026-05-06 long-press-scroll trim (drop Schedule UI co-owner + never-list `74f78fc`/`7606c66` -- shipped clean, rationale in DECISIONS 2026-05-06); 2026-05-06 autofill-skips-holidays trim (drop saveEmployee privilege matrix v2.32.5 + frontend `d6010f4` -- shipped clean s067, durable rationale in DECISIONS s067); s068 trim (drop 2026-05-06 Employees UI Deleted tab + Archive chip / `fbb8568` -- shipped clean and not load-bearing for next session); 2026-05-06 (drop 2026-05-05 s066 long ship-only bullet -> merged into 2026-05-06 s066 end-to-end); 2026-05-06 context (drop s065 audit/AskRainbow); 2026-05-06 s066 handoff trim (drop s064 pitch-deck shipped bullet); 2026-05-06 trim (drop hardcoded BCC + mobile onboarding z-index entries); s066 trim (Onboarding 6-attachments closed-not-a-bug 2026-05-04); s065 trim (Sadie cleanup s060 carry path 2 + 1c2f34c drop legacy deleteEmployee + 91b2976/a02f7c4/4e73a26/5c0d99c employee lifecycle redesign + 7fb3417/6850ca3/4f2cabf/8f6d204 past-period edit lock + Employees archive + Erase + aac976d/d86e949/dcfe87f/0c81705/535da13/ec62e8f desktop My Schedule modal + Mine migration + long-press instrumentation + c726379 desktop period-nav parity + e3090e4 Day Status renamed to Available + 48db3c4 login default-password hint); s060 trim (bcb12fd + 062bb22 + c817f07 + eb89e92 onboarding email modal + welcome PDF rebrand v2.31.0->v2.31.1 + state-refresh fix); s059 trim (23ad13b v2.30.2 batchSaveShifts uses withDocumentLock_; e53768e admin Day Status [Working/Sick/Unavailable] segmented control; 9ae5ed8 mobile long-press on multi-event cells opens EventDetailSheet; 33438e6 mobile violations triangle now opens panel); s058 trim (4a227d0 + 39c55e0 Audit fixes Batch 4 frontend session integrity + defensive guards); s057 trim (7abe364 v2.30.1 lock-timeout symmetry + 04f6912 Batch 3 TOCTOU + 1164c53 v2.29.1 changePassword case-fold + 31f1c23 Batch 2 type filter/cache bust/email lowercase); s056 trim (d18e72a Batch 1 audit fixes + adversarial-audit-plan-written + 6a17dcc violations panel + 8ab6a05 FirstnameL + 47a4ef4 eye-toggle); s055 trim (9376c7b mobile staff parity + Sheet boolean normalization, 3093c60 admin1 protection, f1efc38 self-lockout + owner-deactivation guard, 1a492ef 12h TimePicker, 576e50e EmailModal filter useMemo). -->

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
