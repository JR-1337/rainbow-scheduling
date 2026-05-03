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

cinnabar. instanton.

- **Audit-fix plan complete -- 4 batches + 2 hotfixes shipped, paste-deployed, smoked clean.** Plan retired at `~/.claude/plans/audit-fixes-2026-05-02.md` (kept for reference, not active). H3 deferred to migration (see Blocked). Pick next from this Active list.

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 §3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **EmailModal v2 + email-format pass + post-redeploy smoke.** When picking up email-format work next: (a) verify s033-redeploy live behavior — send a schedule email, confirm branded HTML body lands; try saving a duplicate-email employee, confirm backend `DUPLICATE_EMAIL` rejects; (b) PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **Onboarding email on new-employee creation.** When Sarvi adds a new employee via the admin form, fire a one-time welcome email to the new hire covering app usage (login, where the schedule lives, time-off + offer/swap mechanics), the sick/late/coverage policy, and any other staff orientation info. Trigger lives in `saveEmployee` backend action (insert path only, not edit). Content + send timing + opt-out behavior to be formalized when picked up.
- **BCC otr.scheduler@gmail.com on schedule distribution emails.** Frontend `EmailModal.jsx:57` currently passes `{ to, subject, htmlBody, plaintextBody }`; backend `Code.gs:2156` calls `MailApp.sendEmail` with no `bcc`. Add `bcc: 'otr.scheduler@gmail.com'` so JR has a silent archive of every schedule send in the otr.scheduler inbox. Scope = schedule distribution only (`sendBrandedScheduleEmail`); decide later whether to extend to the 20 background notification emails (time-off / offer / swap / schedule-edit). Small (~5 lines backend + 1 line frontend, single commit).
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).

- **Mobile long-press on multi-event schedule cells -> bottom-sheet detail.** Raised s054 2026-05-02. Cells today show "3 events" pill with no detail on what each meeting/PK is. Keep the visual signal (star pattern + count pill) AS-IS so the at-a-glance read doesn't change. Add a long-press gesture (~500ms touch hold) on mobile schedule cells that opens a `MobileBottomSheet` listing each event clean: type pill, time range, note. Reuse the existing `MobileBottomSheet` primitive. Desktop employee view: cell `title` tooltip is enough -- space exists. Discoverability: trust pattern familiarity (iOS users know long-press); only add an "i" affordance icon if Sarvi reports confusion at smoke. Scope = mobile cell tap handler in EmployeeScheduleCell + sibling on admin grid; new EventDetailSheet component (~30 lines). Don't change the cell's existing tap behavior (admin tap = open ShiftEditorModal, employee tap = nothing currently).
- **Onboarding email -- include the computed default password in the welcome body** (folded in from the s055 first-login decision). Bundle with the onboarding-email TODO above when that ships.
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
- **Apps Script live = `7abe364` (v2.30.1 paste-deployed 2026-05-03).** All audit-fix backend stack live: Batch 1 (v2.28) + Batch 2 (v2.29) + v2.29.1 hotfix + Batch 3 (v2.30) + v2.30.1 hotfix. Prior email-formatting backend stack (`306bd6f` notification wrapper + `3b5c02a` stale-request error msgs + `c155ed4` Sarvi's 5 askType+CTA+emojis + `a314e1e` BCC otr.scheduler backend half + `7cc37dc` Sarvi's 5 body copy tightening) bundled into same Code.gs file before paste. No drift.

- **Last validated: s056 bundled end-of-plan smoke at HEAD `39c55e0` 2026-05-03.** 5/5 PASS on prod (`https://rainbow-scheduling.vercel.app`): (1) v2.29.1 changePassword case-fold -- Test Guy completed Set-Your-Password modal `TestG` -> `TestG7`, then re-login no modal; (2) Batch 3 TOCTOU happy-path -- shift edit + save clean, no false CONCURRENT_EDIT, 0 console errors; (3) v2.30.1 lock-timeout symmetry -- both `withDocumentLock_` + `batchSaveShifts` at `tryLock(10000)`; (4) Batch 4 M8 -- corrupted `otr-auth-token`, redirect fired, banner "Your session ended. Please sign in again." rendered correctly (executor's race-condition flag was a non-issue); (5) Batch 4 M10 + M11 -- schedule + request panel render clean, 0 errors. Test Guy returned to Inactive + password reset to FirstnameL default `TestG` (`passwordChanged=false` preserved by Batch 1 allowlist drop).
- **Audit Stage 3 triage deferred:** `/audit` v5 inventory captured at `.claude/skills/audit/output/inventory.md` (~25 findings across D/E/F/H/I/J/L). Stage 3 Sonnet triage NOT run; B1 ship-list NOT generated. Next session can resume from triage by re-running `/audit` (the cached map + inventory will be reused) OR by spawning a triage-only Sonnet agent reading `inventory.md`. Stage 6 dated report NOT written.
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-05-03] **Mobile violations triangle button now opens panel (commit `33438e6`)** — root cause: the AdaptiveModal render block (App.jsx:2579-2620 pre-fix) lived only inside the desktop admin return; the mobile admin return at line 2107 exited before reaching it, so `setViolationsPanelOpen(true)` updated state but no panel ever mounted on mobile. Hoisted the JSX into a shared `violationsPanelEl` const next to `pkModalEl`, rendered it in both mobile and desktop returns. Same pattern as `pkModalEl` already uses. Frontend-only, Vercel auto-deploy. Smoked locally @ 390×844: triangle opens dialog with both Nicole Seeley + Owen Bradbury violations rendered, 0 console errors. The "Mine tab missing shifts" item raised in s055 closed as **non-bug** s057 — JR was checking Sarvi's view while logged in as JR himself; JR is `isOwner` so Mine is empty by design. Mine tab works correctly when logged in as the actual employee (verified in s057 with new Test Admin fixture, see `reference_smoke_logins.md`).

- [2026-05-03] **Audit fixes Batch 4: frontend session integrity + defensive guards (commits `4a227d0` + `39c55e0`)** — Three M-priority frontend fixes shipped, Vercel auto-deployed. M8: `src/auth.js` `handleAuthError` calls `clearAuth(reason)` on AUTH_REQUIRED (`account_inactive`) / AUTH_EXPIRED / AUTH_INVALID (`session_ended`); `LoginScreen.jsx` reads `rainbow_auth_clear_reason` from localStorage on mount and renders an amber banner "Your session ended. Please sign in again." M10: `partitionShiftsAndEvents` filters out shift rows with falsy `employeeId` (no ghost rows in schedule grid). M11: `(typeof req.datesRequested === 'string' ? req.datesRequested : '').split(',').filter(Boolean)` guard at all 4 `.split(',')` sites in App.jsx + EmployeeView.jsx (executor patched a 4th site beyond the plan's 3 to satisfy the success-check zero-grep-hits rule). H3 Blocked entry added (chunkedBatchSave concurrent-saves clobber risk, deferred to migration). Build PASS. Smoke 5/5 PASS in s056 bundled smoke.

- [2026-05-03] **Audit fix v2.30.1 hotfix: lock-timeout symmetry (commit `7abe364`, backend Code.gs v2.30.1)** — Surfaced by Batch 3 executor's double-check. `withDocumentLock_` used `tryLock(5000)` while `batchSaveShifts` uses `tryLock(10000)`. Both grab `LockService.getDocumentLock()` (same instance), so asymmetric budgets meant a 5-10s bulk save would always starve a concurrent approve. Bumped helper to 10000ms. One-line semantic change. Build PASS. Paste-deployed by JR 2026-05-03. Smoked code-verified in s056.

- [2026-05-03] **Audit fixes Batch 3: TOCTOU concurrency hardening (commit `04f6912`, backend Code.gs v2.30.0)** — New `withDocumentLock_(fn, errorContext)` helper wraps a function in `LockService.getDocumentLock().tryLock(10000)` with clean `CONCURRENT_EDIT` on contention. 16 state-mutating request handlers wrapped: 4 time-off (cancel/approve/deny/revoke), 6 shift-offer (accept/decline/cancel/approve/reject/revoke), 6 swap (accept/decline/cancel/approve/reject/revoke). `verifyAuth` stays outside the wrapper (read-only); `getSheetData(SHIFT_CHANGES)` re-fetch moves inside the lock so two admins clicking decide-on-same-request serialize cleanly. `batchSaveShifts` left untouched (already locks directly; same lock instance, so it serializes against the new helper). 3 `submit*` handlers not wrapped (create-only, no read-then-check-then-write). Build PASS. Paste-deployed by JR 2026-05-03. Smoke 1/1 PASS happy-path in s056.

- [2026-05-03] **Audit fix v2.29.1 hotfix: changePassword case-fold for default-pw users (commit `1164c53`, backend Code.gs v2.29.1)** — Surfaced by Batch 2 smoke. `resetPassword` line 965 stores `hashPassword_(salt, newPassword.toLowerCase())` so login's case-folded match works on first sign-in -- but `changePassword` self-path hashed `currentPassword` cased, so the Set-Your-Password modal blocked every first-login (typing `TestG` hashed to a value that never matched the stored hash of `testg`). Mirrored login's `candidates = [lowercased, original]` array when `passwordChanged === false`. Strict once they've changed their own pw. Build PASS. Paste-deployed by JR 2026-05-03. Smoke 1/1 PASS in s056 (Test Guy completed `TestG` -> `TestG7`).

- [2026-05-03] **Audit fixes Batch 2: type filter + cache bust + reorder + email lowercase (commit `31f1c23`, backend Code.gs v2.29.0)** — H4: `(s.type || 'work') === 'work'` filter added to shift lookups in `approveShiftOffer` / `revokeShiftOffer` / `approveSwapRequest` / `revokeSwapRequest` (5 sites total) so meeting/PK rows can never be picked up as work shifts during transfers. H5: `bustSheetCache_(SHIFTS)` called at end of `batchSaveShifts` -- closes stale-cache window between bulk save and concurrent admin re-read. M7: `approveShiftOffer` validates recipient + shift BEFORE writing approved status (no half-applied state). M12: read-side lowercase email compare in `login` / `getEmployeeByEmail` / `changePassword` / `resetPassword` (8 sites) -- storage stays case-as-typed, phone autocorrect on first-time logins no longer locks people out. Build PASS. Paste-deployed by JR 2026-05-03. Smoke 4/4 PASS in s056 (H5 + M12 live-verified, H4 + M7 code-verified at correct sites).
<!-- Older Completed entries trimmed per schema ">=5 most recent". Full history in git log. Recent trims: s056 trim (d18e72a Batch 1 audit fixes + adversarial-audit-plan-written + 6a17dcc violations panel + 8ab6a05 FirstnameL + 47a4ef4 eye-toggle); s055 trim (9376c7b mobile staff parity + Sheet boolean normalization, 3093c60 admin1 protection, f1efc38 self-lockout + owner-deactivation guard, 1a492ef 12h TimePicker, 576e50e EmailModal filter useMemo); s054 trim (da8f89a a11y Escape on 4 modals, 07ad44f desktop period-nav a11y parity, ec0e962 audit B1 sickEvent + a11y, d13bc14 MobileAlertsSheet white-screen fix); s053 trim (8647947 sickEvent extraction across 3 paths, 0ff2c7d+0f396c3 audit Stage 3-7 full-sweep triage). -->

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
