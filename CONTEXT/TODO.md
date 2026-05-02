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

sfumato. predictive coding.

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 §3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **EmailModal v2 + email-format pass + post-redeploy smoke.** When picking up email-format work next: (a) verify s033-redeploy live behavior — send a schedule email, confirm branded HTML body lands; try saving a duplicate-email employee, confirm backend `DUPLICATE_EMAIL` rejects; (b) PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **Onboarding email on new-employee creation.** When Sarvi adds a new employee via the admin form, fire a one-time welcome email to the new hire covering app usage (login, where the schedule lives, time-off + offer/swap mechanics), the sick/late/coverage policy, and any other staff orientation info. Trigger lives in `saveEmployee` backend action (insert path only, not edit). Content + send timing + opt-out behavior to be formalized when picked up.
- **BCC otr.scheduler@gmail.com on schedule distribution emails.** Frontend `EmailModal.jsx:57` currently passes `{ to, subject, htmlBody, plaintextBody }`; backend `Code.gs:2156` calls `MailApp.sendEmail` with no `bcc`. Add `bcc: 'otr.scheduler@gmail.com'` so JR has a silent archive of every schedule send in the otr.scheduler inbox. Scope = schedule distribution only (`sendBrandedScheduleEmail`); decide later whether to extend to the 20 background notification emails (time-off / offer / swap / schedule-edit). Small (~5 lines backend + 1 line frontend, single commit).
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).
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
- **Apps Script live drifts from repo (pending paste-deploy):** stack of 5 backend commits awaits paste -- `306bd6f` (notification wrapper banner align) + `3b5c02a` (stale-request error msgs) + `c155ed4` (Sarvi's 5 askType+CTA+emojis) + `a314e1e` (BCC otr.scheduler backend half) + `7cc37dc` (Sarvi's 5 body copy tightening). Live deployment still serves old single-line "RAINBOW" banner + verbose body copy + no askType label + no CTA button + no BCC archive. Paste flow: open `backend/Code.gs` from repo -> copy whole file -> script.google.com under `otr.scheduler@gmail.com` -> paste over Code.gs -> Deploy -> Manage Deployments -> Edit (pencil) -> Version: New version -> Deploy.
- **Audit Stage 3 triage deferred:** `/audit` v5 inventory captured at `.claude/skills/audit/output/inventory.md` (~25 findings across D/E/F/H/I/J/L). Stage 3 Sonnet triage NOT run; B1 ship-list NOT generated. Next session can resume from triage by re-running `/audit` (the cached map + inventory will be reused) OR by spawning a triage-only Sonnet agent reading `inventory.md`. Stage 6 dated report NOT written.
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-05-02] **Audit session B1 ship: EmployeeScheduleCell sickEvent parity miss + 4 a11y additions (commit `ec0e962`)** — `/audit session` (FIRST_RUN slug `session-d13bc14`, ~50k tokens) caught the parity miss in 8647947: sickEvent extraction landed in 3 of 4 schedule render paths but EmployeeScheduleCell (EmployeeView.jsx:36-114) was skipped. 6 inline `.find()` calls remained including 2 unguarded `.note` accesses (lines 68, 91) -- latent throw if event list mutates between outer `?.note` check and inner attribute eval. Bundled with mechanical a11y: aria-label + type="button" on EmployeeView period-nav + 2 mobile X close buttons + 2 announcement-panel buttons. Verdict: **Needs Attention** (driven by parity miss). B1 = 11, B2 = 0. Report: `docs/audit-2026-05-02-session-d13bc14.md`. All 4 schedule render paths now have exactly 1 sickEvent `.find()` call -- true parity per memory rule `feedback_mobile_desktop_parity`.
- [2026-05-02] **MobileAlertsSheet white-screen regression fix (commit `d13bc14`)** — Pre-existing bug surfaced during s051 testguy mobile smoke: MobileAlertsSheet at MobileEmployeeView.jsx:666 referenced `employees` at line 693 inside PKDetailsPanel but never destructured the prop -- `ReferenceError: employees is not defined` white-screened the entire non-admin mobile flow. Fix: destructure `employees = []` in callee, pass `employees={schedulableEmployees}` from EmployeeView.jsx:613 call site. Verified end-to-end on prod (Playwright PASS: testguy mobile login renders, Alerts dialog opens + closes with 0 console errors).
- [2026-05-02] **Audit B2 I-A + D1 + D2 + D3 sickEvent extraction (commit `8647947`)** — ScheduleCell.jsx + MobileAdminView.jsx + MobileEmployeeView.jsx each walked cellEvents 2-3 times per cell via `.some()` + `.find()` to surface sick state and note text. At OTR scale (35×14 desktop = 490 cells, 35×7 mobile × 2 surfaces = 490 cells) compounded into ~980 redundant array walks per render. Each file now extracts `sickEvent` once and derives `hasSick = !!sickEvent`. Latent throw on bare `.note` in ScheduleCell:115 (I-A) goes away by construction. Per parity rule, all 3 paths shipped in one commit. NB: 4th path (EmployeeScheduleCell) was missed -- caught + fixed by ec0e962.
- [2026-05-02] **Audit Stage 3-7: full sweep triage + B1 ship (commits `0ff2c7d` + `0f396c3`)** — Triage of s049 inventory.md (~25 findings) at `.claude/skills/audit/output/triage.md`: Verdict **Needs Attention** driven by D1 sick-event triple-find (490 cells/render desktop + 245/245 mobile) and L4/L5 backdrop keyboard-gap. B1 shipped 4/5 mechanical fixes: stale comment delete + 3 aria-labels. 5th B1 skipped per no-redundant-comments rule. B2 deferred = 15. Stage 6 dated report at `docs/audit-2026-05-01-full.md`. K=0.
- [2026-05-02] **Email banner subtitle contrast fix (commit `f1425e7`)** — Period label (`buildBrandedHtml.js:195`) and "OTR Scheduling" subtitle (`backend/Code.gs:2140`) rendered in `${accent}` on `${navy}` failed contrast when accent = brand blue. Switched both to `rgba(255,255,255,0.85)`. Backend pasted + redeployed.

<!-- Older Completed entries trimmed per schema "≤5 most recent". Full history in git log. Recent trims: s051 trim (s050 paste-deploy verify, s050 audit Stage 3-7 was kept as the audit pipeline ref but content compressed; s049 audit skill v5, s049 notification body copy tightening); s050 trim (s045 BCC otr.scheduler, s045 OTR wordmark banner, s045 policy disclaimer); s049 trim (s047 part-time cap, s047 CacheService verified, s048 admin2 showOnSchedule parity, s045 polish + ghost-PK, s042 jscpd cleanup, s042 B2 sweep, s042 full audit, s041 audit-session). -->

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
