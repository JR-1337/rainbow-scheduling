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

Anchor: cinnabar twistor

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 §3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **EmailModal v2 + email-format pass + post-redeploy smoke.** When picking up email-format work next: (a) verify s033-redeploy live behavior — send a schedule email, confirm branded HTML body lands; try saving a duplicate-email employee, confirm backend `DUPLICATE_EMAIL` rejects; (b) PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).
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
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-04-30] **s045 polish + ghost-PK cleanup (7 commits)** — `95249d0` fix(events) bundle: (a) `sendBrandedScheduleEmail` auth-shape fix in `backend/Code.gs` -- `authResult.success`/`.data` -> `auth.authorized`/`.employee`; folded manual `isAdmin` check into `verifyAuth(payload, true)`. JR pasted+redeployed live Apps Script (deployment `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu...`) mid-session, prod schedule-email smoke PASS -- closes the s042-flagged Phase 4 pre-condition; (b) `EmailModal.jsx` `adminContacts` filtered to `PRIMARY_CONTACT_EMAIL` only (Sarvi); (c) PDF `generate.js` shift-cell fill always `G.fillZebra` (was admin-only); (d) `PKDetailsPanel` rewrite: iterate active employees x dates only, resolve names from live `emp.name` (was stale `ev.employeeName` text) -- fixed ghost "PK booked" rows for soft-deleted employees on May 9 banner; (e) `deleteEmployee` + `saveEmployee` deactivate path now block on future events (PK / meeting / sick) parallel to existing future-shifts block via new `getFutureEventDates` helper -- prevents new orphans. `4bbd012` PK panel name-list dropped (date/time/count only -- staff scan their own row in grid below). `2921c8d -> 6d32586` desktop schedule name col 240->160 final (round-trip 240->160->80->160; 80 was too narrow). EmployeeRow last-name 10px->11px. `477bdb3` violations consecutive-days threshold 5->6 (Sarvi answered the long-blocked question). `b120241 -> 12fe831` PDF `@page` A4 -> letter -> legal portrait (8.5x14 = JR's actual paper). All commits build PASS. JR scrubbed Sheet residue manually: hard-deleted Employees rows TEST-ADMIN1-SMOKE / Test Manager / Smoke Duplicate Test / Test Collision Check + their orphan `pk` rows in Shifts tab. Banner clean post-deploy. **Residual:** real soft-deleted employees still keep their event rows in the sheet by design (no FK cascade); the new block prevents new orphans but historic ones await the planned EmployeesArchive feature. Live Apps Script in sync with repo for auth fix; bulkPK kill (s044 a8ccaa8) still drift on live (cosmetic; cutover decommissions). No Playwright smoke this session -- prod schedule-email send was the only validation needed; UI changes (name col, last-name size, PDF size) are visual-tweak; PK ghost fix was load-bearing on data-cleanup which JR confirmed visually post-deploy.

- [2026-04-29] **jscpd duplication cleanup s042 (3 commits, J4-J9 closed)** — Plan at `~/.claude/plans/quizzical-plotting-karp.md`. Conservative variant of audit fix prompts: 2 component extractions + 1 helper-pair (rejected `RequestListBase` pattern because panel JSX bodies diverge in copy/conditionals/wrapping). `01b79bd` Phase A: extracted `<ShiftCard>` to src/components/ — replaced shift-button blocks in OfferShiftModal + SwapShiftModal (J7). `04f51d3` Phase B: extracted `<PasswordFormFields>` — replaced 3-input password forms in AdminSettingsModal + ChangePasswordModal (J8); LoginScreen first-login path uses single password input, left untouched. `25ae4e3` Phase C: extracted `formatRequestDates` + `formatTimestamp` + `getStatusLabel` to src/utils/requestFormat.js + `getRoleName` + `getRoleNameShort` + `getRoleColor` to src/utils/roleFormat.js — touched 12 panels (5 beyond plan's named 8 per "5+ rule"). Divergence resolved: getRoleName had two shapes (`role.fullName/'No Role'` for offer-context vs `role.name/'—'` for swap-context); exported as separate functions (`getRoleName` + `getRoleNameShort`) preserving each call site's behavior. Build PASS all 3 commits. Bundle delta -0.8 KB gzipped. Playwright smoke 4/4 PASS at HEAD `25ae4e3` (bundle `index-CcXHDOkr.js`): ChangePasswordModal + AdminSettingsModal Password tab live-rendered with all 3 inputs; ShiftCard call sites code-verified (testguy has 0 future shifts so no live shift cards, but ShiftCard wired correctly in both modals); admin main-view rendered with role legend colors intact. 0 console errors. **Residual:** ShiftCard.jsx keeps its own inline getRoleName/getRoleColor (8 lines) because fallback semantics differ from roleFormat.js — ShiftCard falls back to `THEME.roles.none` (#64748B) while roleFormat falls back to `THEME.text.muted`. Practically dead path (only triggers on corrupted role IDs) but worth preserving the explicit "No Role" color choice.

- [2026-04-29] **/audit s042 B2 sweep (1 commit, 5 of 12 B2 items)** — `2254b25` shipped: **I1** ShiftEditorModal employee?.id added to draft-reset useEffect deps (admin same-date employee swap now re-seeds correctly); **I2** PKModal eslint-disable narrowed with explanatory comment (one-shot prefill behavior preserved); **E1** App.jsx allViolations 5x perf hoist — computeWeekHoursFor moved out of inner date loop (35×5×14=2450 → 35×14=490 iterations per recompute); **L1** PKModal REMOVE-mode date-expand row gained role=button + tabIndex=0 + aria-expanded + aria-label + onKeyDown(Enter|Space); **J1** App.jsx:67-148 dead migration-comment block deleted (~80 lines, preserved DEFAULT_STAFFING_TARGETS + MAIN APP banner). Build PASS. Bundle delta -1KB. Playwright smoke 4/4 PASS (Sarvi→Dan Carman ShiftEditorModal swap live-verified, violations count 74 matches pre-fix, PK keyboard code-verified). 0 console errors. **Remaining 7 B2 items deferred:** J2 computeWeekHoursFor → utils/timemath.js (observation); J3 inline-arrow note (observation); J4-J9 6 jscpd duplication clusters (panel/modal extractions, need /coding-plan).

- [2026-04-29] **Full /audit sweep s042 (1 commit, 5 B1 fixes)** — Report at `docs/audit-2026-04-29-full-s042.md`. Verdict Needs Attention. Pipeline: Bash map (81 files, 7 hot, 18 markers) + static-pass (knip 3 dead exports + jscpd 101 clones) + 1 Sonnet generalist inventory (~124k tokens, 14 files Read) + Sonnet triage (~52k tokens). `cce033a` shipped 5 B1 one-line edits: drop dead `parseLocalDate`/`escapeHtml` re-exports from App.jsx:60; remove `target="_blank"` on mailto (App.jsx:2731); aria-label adds on mobile + desktop violations buttons (App.jsx:1700 + 2194); drop `export` keyword on `DESKTOP_SCHEDULE_NAME_COL_PX` (still used internally constants.js:104). Build PASS. 12 B2 items deferred with fix prompts: **E1** allViolations 5x perf hoist (35×5×14=2450 → 35×14=490 iterations), **L1** PKModal REMOVE date-expand row keyboard a11y, **I1** ShiftEditorModal `employee` dep missing, **I2** PKModal blanket eslint-disable, **J1** App.jsx:67-158 dead migration-comment block (~80 lines), **J4-J9** 6 jscpd duplication clusters (panel/modal pairs). Triage caught one B1 false positive: knip flagged constants.js export as dead but symbol is used at line 104 — main-session verify corrected B1 to drop export keyword instead of full delete. Static-pass.sh required two patches (knip non-zero exit on findings; jscpd path-arg conflated with mode).

- [2026-04-29] **Audit-session findings sweep s041 (2 commits + mobile Playwright smoke)** — `/audit session` against the s040 sweep surfaced 5 findings. Plan at `~/.claude/plans/silver-ringing-canyon.md`; report at `docs/audit-2026-04-29-session-139b056.md`. `77ca174` fix(mobile-grid): MobileScheduleGrid now derives `isTitled = hasTitle(emp)` per row (was hardcoded `isTitled: false`), wires into computeCellStyles + conditionally renders role-name span — fixes titled-admin (Sarvi) role-name leak in employee mobile grid. Same commit adds `role=button` + `tabIndex=0` + `onKeyDown(Enter/Space)` + `aria-label` to MobileAdminScheduleGrid day-cell `<td>` (missed by s040 `f1934d4`). `4d0cf50` chore(employee-view): drop dead `week2DateStrs` useMemo (audit J). Audit's J1 finding (`App.jsx published` state as write-only) was invalidated by parent-side verification — read site at App.jsx:2200 renders the "Published" badge. Mobile Playwright smoke 3/3 PASS at HEAD `4d0cf50`: day-cell Tab→Enter→Escape, Sarvi row no role-name, non-titled regression code-verified (no published shifts to screenshot). 0 console errors.

<!-- Older Completed entries (s040 audit-deferred sweep, s039 audit-deferred bug sweep, s038 perf+dead-code, s037 admin-tier silent-drop, s036 PK modal, s035 auto-fill modal, s034 hour-color ladder, s033 unpaid-break, s032 PDF portrait + multiple s032 fixes, s031 email migration, s029 schedule consolidation) trimmed per schema "≤5 most recent". Full history in git log. -->

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
