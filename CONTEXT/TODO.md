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

vermilion. soliton.

- **Audit-fix plan in flight (Batch 1 shipped, Batch 2-4 queued).** Plan: `~/.claude/plans/audit-fixes-2026-05-02.md`. Batch 1 commit `d18e72a` paste-deployed. Next session: run Batch 1 Playwright smoke (non-admin getAllData strip; admin saveEmployee allowlist refusal; admin1 cannot reset owner). Then spawn the executor for Batch 2 (H4 type filter + H5 cache bust + M7 reorder + M12 read-side lowercase). Then Batch 3 (H6 TOCTOU lock-wrap on 16 handlers). Then Batch 4 (frontend M8/M10/M11). Each backend batch is one Apps Script paste-deploy.

- **Pre-cutover gate (decision): custom SMTP for Phase 4 password-reset blast = AWS SES** (ca-residency aligns with PIPEDA; ~$0.10 per 1k emails, free at OTR scale). Confirmed s043 2026-04-30. Verify domain SPF/DKIM in Phase 1 build; deliverability smoke before Phase 4.
- **Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set.** Shape A locked 2026-04-29 (DB-canonical, Sheet = read-only mirror, admin UI is edit surface). Planning folder at `docs/migration/`; index in `docs/migration/README.md`. All 10 research docs landed across s042 (Wave 1+2) and s043 (Wave 3 synthesis 2026-04-30): 01-schema-current, 02-schema-proposed (8 open Qs all resolved by JR), 03-appscript-inventory, 04-apicall-callsite-map, 05-auth-migration, 06-email-migration, 07-pdf-migration, 08-sheet-mirror-design, 09-cutover-and-rollback, 10-supabase-due-diligence. Next: JR sets ship decision when ready -- Phase 0 (Supabase project + DDL + RLS) is the entry point per 09 §3. No code changes triggered by this work.
- **JR manual cleanup -- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during s033 smoke.** Original total ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker cleared during autofill test (step 9), autofill data discarded on reload but the clear was saved to Sheets. JR/Sarvi to re-enter manually.
- **EmailModal v2 + email-format pass + post-redeploy smoke.** When picking up email-format work next: (a) verify s033-redeploy live behavior — send a schedule email, confirm branded HTML body lands; try saving a duplicate-email employee, confirm backend `DUPLICATE_EMAIL` rejects; (b) PDF attachment for EmailModal v2 — produce PDF blob server-side via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, attach to MailApp send. Frontend POSTs the print-preview HTML doc (already exists) to a new action. No new frontend deps.
- **Onboarding email on new-employee creation.** When Sarvi adds a new employee via the admin form, fire a one-time welcome email to the new hire covering app usage (login, where the schedule lives, time-off + offer/swap mechanics), the sick/late/coverage policy, and any other staff orientation info. Trigger lives in `saveEmployee` backend action (insert path only, not edit). Content + send timing + opt-out behavior to be formalized when picked up.
- **BCC otr.scheduler@gmail.com on schedule distribution emails.** Frontend `EmailModal.jsx:57` currently passes `{ to, subject, htmlBody, plaintextBody }`; backend `Code.gs:2156` calls `MailApp.sendEmail` with no `bcc`. Add `bcc: 'otr.scheduler@gmail.com'` so JR has a silent archive of every schedule send in the otr.scheduler inbox. Scope = schedule distribution only (`sendBrandedScheduleEmail`); decide later whether to extend to the 20 background notification emails (time-off / offer / swap / schedule-edit). Small (~5 lines backend + 1 line frontend, single commit).
- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Pick up if pitch-copy review reopens.
- **In-app bug fixes** -- s028 shipped 4 audit-driven fixes + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred, low ROI at OTR scale).
- **Mobile violations triangle still not clickable** (post-`6a17dcc`). Raised 2026-05-02 s055. Desktop triangle now opens the panel correctly with edit-mode gating + jump-to-fix, but the mobile triangle button itself doesn't fire `setViolationsPanelOpen(true)` -- s042 smoke flagged this as pre-existing and the AdaptiveModal swap was supposed to fix the panel rendering, not the button. Investigate: `App.jsx:1654-1665` (mobile admin tab-strip triangle button); check tap-target size, z-index occlusion (mobile bottom nav?), and whether the button's parent flex row eats the click. Verify on real device, not just Playwright @ 390x844.

- **Mine tab missing shifts on live schedule** (raised 2026-05-02 s055). Sarvi's shifts are not appearing in her "Mine" tab on a live (published) period. JR wonders if it's universal or per-employee. Investigate: `App.jsx` mobileAdminTab='mine' rendering path + which `shifts` source it uses (live `shifts` vs `publishedShifts`?). Check whether owner/admin filtering accidentally excludes Sarvi specifically. Cross-check non-admin "Mine" view in EmployeeView for the same bug. Likely related to the live-vs-edit-mode shift dataset selection -- the "Mine" tab may be reading from `publishedShifts` while the live schedule renders from `shifts`, so freshly-saved-but-not-republished shifts vanish from Mine.

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
- **Apps Script live = `d18e72a` (audit Batch 1 paste-deployed 2026-05-03).** Backend changes from this session (FirstnameL default password v2.27 in `8ab6a05`, audit Batch 1 v2.28 in `d18e72a`) are live. Older email-formatting backend stack (`306bd6f` notification wrapper + `3b5c02a` stale-request error msgs + `c155ed4` Sarvi's 5 askType+CTA+emojis + `a314e1e` BCC otr.scheduler backend half + `7cc37dc` Sarvi's 5 body copy tightening) was bundled into the same Code.gs file before paste -- treat that stack as live too. Next paste-deploys: Batch 2 (v2.29), Batch 3 (v2.30).

- **Audit fix Batch 1 smoke pending (`d18e72a`).** Live but not Playwright-smoked. Smoke matrix: (a) log in as Testguy -> confirm `getAllData` response missing passwordHash/passwordSalt/phone/etc.; (b) log in as JR -> confirm those fields ARE present; (c) attempt `resetPassword({targetEmail: 'johnrichmond007@gmail.com'})` as a non-owner admin -> expect AUTH_FORBIDDEN; (d) edit a non-admin employee as JR -> save works. Soft-cleanup: deactivate test rows after.
- **Deferred smoke -- v2.29.1 changePassword case-fold hotfix (`1164c53`).** Will run as part of bundled end-of-plan smoke pass after all batches are paste-deployed. Single check: log in as Test Guy (`john@johnrichmond.ca / TestG`, passwordChanged=false), the Set-Your-Password modal should now accept the cased default and let the user pick a new password. Pre-hotfix: AUTH_FAILED on every cased input.
- **Audit Stage 3 triage deferred:** `/audit` v5 inventory captured at `.claude/skills/audit/output/inventory.md` (~25 findings across D/E/F/H/I/J/L). Stage 3 Sonnet triage NOT run; B1 ship-list NOT generated. Next session can resume from triage by re-running `/audit` (the cached map + inventory will be reused) OR by spawning a triage-only Sonnet agent reading `inventory.md`. Stage 6 dated report NOT written.
- Missing validation: prod paper-print of new portrait PDF (Sarvi kitchen-door legibility test).
- Missing validation: prod phone-smoke of 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear -- pending live mutation on JR's phone.
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad.
- Missing validation: no automated test suite; manual Playwright smoke only.

## Completed

- [2026-05-03] **Audit fixes Batch 1: data exposure + privilege escalation (commit `d18e72a`, backend Code.gs v2.28.0)** — Three CRITICAL/HIGH-severity backend gaps closed in one commit. New `safeEmployeeForCaller_` helper makes `getAllData` + `getEmployees` return per-caller-role employee shapes: non-admins no longer see `passwordHash` / `passwordSalt` / plaintext default-password column or PII (phone/address/dob/rateOfPay/adpNumber/counterPointId). Explicit `SAVE_EMPLOYEE_FIELDS_` allowlist on `saveEmployee` plus `SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_` (isAdmin/isOwner/adminTier) gated by `auth.employee.isOwner` -- admin1 can no longer promote herself or rewrite the owner's row. `resetPassword` refuses to reset the owner or any admin1 unless caller is owner -- closes the "admin1 resets JR to default + logs in as owner" path. DECISIONS.md entry captures the threat-model rationale. Build PASS. **Paste-deployed by JR 2026-05-03**; Playwright smoke pending next session.

- [2026-05-02] **Adversarial audit + plan written** — Background subagent task `abc43136c61d5e215` returned 15 ranked findings (CRITICAL/HIGH/MEDIUM/LOW) plus 8 noted-but-lower priority. Triage to 8 ship-worthy + 5 deferred + 2 false positives + 1 dropped (M9 reframed as Claude-discipline, not a backend bug). Plan written to `~/.claude/plans/audit-fixes-2026-05-02.md`: 4 batches, ~1100 lines, file:line citations + before/after blocks + paste-deploy gates. Email case-handling collapsed to read-side-only at JR's call (no normalize-on-save, no migration function).

- [2026-05-02] **Violations panel: edit-mode gating + drop dismiss-X + mobile bottom-sheet (commit `6a17dcc`)** — Three issues fixed in one commit. (1) Panel row click bypassed the `isCurrentPeriodEditMode` gate that cell-click already respected; rows now render as plain divs (cursor:not-allowed, muted) with banner when locked. (2) X-to-dismiss on violations inside ShiftEditorModal was per-modal-session only (no persist) but the affordance suggested an "I acknowledge" override; removed entirely so violations stay informational. (3) Mobile violations modal was using desktop-only Modal primitive; swapped to AdaptiveModal so it renders MobileBottomSheet on mobile, centered Modal on desktop. **Note:** mobile triangle button STILL not clickable post-`6a17dcc` -- separate bug, parked in Active.

- [2026-05-02] **First-login workflow: FirstnameL default + case-insensitive defaults (commit `8ab6a05`, backend Code.gs v2.27)** — Default password switches from `emp-XXX` (row-indexed) to `FirstnameL` (first name + last initial). Single-word names use whole word; hyphenated last names take first segment's initial; collisions append digit (`JohnR2`); empty names fall back to `emp-XXX`. Login lowercases input before hash when `passwordChanged=false` so phone autocorrect doesn't lock employees out day one; user-chosen passwords stay strict. Helper duplicated frontend (preview) + backend (authoritative). Build PASS. JR confirmed working live.

- [2026-05-02] **Login eye-toggle on all 3 password inputs (commit `47a4ef4`)** — Lucide `Eye`/`EyeOff` toggle inside LoginScreen password input + PasswordFormFields (used by ChangePasswordModal + AdminSettingsModal). Stateful per input, default hidden, `tabIndex=-1` on toggle so Tab order skips it. PasswordField helper hoisted outside the parent component to keep input focus stable across renders.
<!-- Older Completed entries trimmed per schema ">=5 most recent". Full history in git log. Recent trims: s055 trim (9376c7b mobile staff parity + Sheet boolean normalization, 3093c60 admin1 protection, f1efc38 self-lockout + owner-deactivation guard, 1a492ef 12h TimePicker, 576e50e EmailModal filter useMemo); s054 trim (da8f89a a11y Escape on 4 modals, 07ad44f desktop period-nav a11y parity, ec0e962 audit B1 sickEvent + a11y, d13bc14 MobileAlertsSheet white-screen fix); s053 trim (8647947 sickEvent extraction across 3 paths, 0ff2c7d+0f396c3 audit Stage 3-7 full-sweep triage). -->

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
