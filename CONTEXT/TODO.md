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

vermilion. chunking.

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

- [2026-05-02] **Audit Stage 3-7: full sweep triage + B1 ship (commits `0ff2c7d` + `0f396c3`)** — Triage of s049 inventory.md (~25 findings) at `.claude/skills/audit/output/triage.md`: Verdict **Needs Attention** driven by D1 sick-event triple-find (490 cells/render desktop + 245/245 mobile) and L4/L5 backdrop keyboard-gap. B1 shipped 4/5 mechanical fixes: stale comment delete + 3 aria-labels (period-nav prev/next + announcement subject input). 5th B1 (clarifying useEffect comment) skipped per no-redundant-comments rule. B2 deferred = 15: top severity I-A `ScheduleCell.jsx` `.find().note` inconsistency (collapses D1 in same edit) + I-B App.jsx `didBootstrapRef` async race. Stage 6 dated report at `docs/audit-2026-05-01-full.md`. K=0. Triage cost: ~34k tokens / 19 reads (well under 40k soft cap). FIRST_RUN for slug `full` so no diff baseline.
- [2026-05-02] **Email banner subtitle contrast fix (commit `f1425e7`)** — Period label (schedule emails, `src/email/buildBrandedHtml.js:195`) and "OTR Scheduling" subtitle (notification emails, `backend/Code.gs:2140`) rendered in `${accent}` on `${navy}` failed contrast when accent = brand blue. Switched both to `rgba(255,255,255,0.85)`; accent stays on top border + body. Backend half pasted + redeployed. Frontend live via Vercel.
- [2026-05-02] **Paste-deploy + smoke verification of 5-commit backend stack (now 6 with banner fix)** — JR pasted `backend/Code.gs` + redeployed. Playwright smokes PASS: (1) schedule email to Test Guy (john@johnrichmond.ca) with BCC otr.scheduler delivered + new wrapper banner; (2) Time-off request from Test Guy → Sarvi got tightened body + askType label + CTA. testguy flipped Active → Inactive at end. JR confirmed "its working." Allowlist updated: pre-launch staff-email allowlist now {Sarvi, JR, testguy@john@johnrichmond.ca} per memory `feedback_no_staff_emails_pre_launch`.
- [2026-05-01] **/audit skill v5: caps raised + augmented marker_index + Read Discipline (commits `1527442` + `1cd615d`)** — Stage 2 inventory cap raised 50k/75k -> 100k/150k; triage cap 30k/50k -> 40k/60k. `build-map.sh` augments `marker_index` with `{path, line, context}` per hit (3-line context, 200 chars cap, 5 hits per marker per file). Stage 2 Operating rules add Read Discipline (no full-file Reads; offset+limit anchored to marker line; 30-Read cap per pass; 1-Read-per-file max; demote-to-J when uncertain; self-throttle reporting after each category). Parent slices marker_index per-category via `jq` before invoking the agent. **Verified** 2026-05-01: re-test on same 86-file scope landed at 70k tokens (vs 127k v4 breach), ~25 findings written to `inventory.md` (vs ~10 visible from v4), agent self-throttled correctly. Strict improvement on cost (-45%), recall (+150%), persistence (now writes to disk). Skill files at `.claude/skills/audit/` are gitignored; only `docs/audit-skill-evolution.md` tracked.

- [2026-05-01] **Notification email body copy tightened on Sarvi's 5 (commit `7cc37dc`)** — askType label now carries the topic; bodies drop redundant prose intros. Schedule edit: "${caller} edited the schedule." + summary. Time-off req: field block (From/Dates/Reason). Time-off cxl: "${employee} withdrew their pending request for ${dates}." + "No action needed." Shift transfer: field block (From/To/Date/Time/Role). Shift swap: two-line shift comparison. Awaits paste-deploy.

- [2026-05-01] **BCC otr.scheduler on schedule distribution emails (commit `a314e1e`)** — Frontend `EmailModal.jsx` passes `bcc: 'otr.scheduler@gmail.com'` on both Group + Individual `apiCall` payloads. Backend `sendBrandedScheduleEmail` accepts `payload.bcc` and forwards to `MailApp.sendEmail` when present. JR's otr.scheduler inbox gets a silent archive of every schedule blast. Scope: schedule distribution only (not the 19 background notification emails). Frontend live via Vercel auto-deploy; backend half awaits paste-deploy (no-op until then since backend ignores unknown payload fields).

- [2026-05-01] **OTR wordmark banner + framing rules in schedule emails (commit `2f42623`)** — Replaced the single-line "RAINBOW" navy header with the in-app two-line "OVER THE / RAINBOW" wordmark (CSS only, no image asset; Arial fallback for Josefin Sans which email clients strip). Centered, padded 32/28 top/bottom, period dates 18px below the wordmark. Schedule table now framed by empty navy bars above and below the date/content rows (former "YOUR SHIFTS" bar emptied; matching footer added). No column headers per JR — table is self-evident. `src/email/buildBrandedHtml.js` only; backend untouched. Build PASS. Playwright preview to Sarvi (Group + Individual) PASS — Individual on Wk 19+20 (May 4-17) showed banner + framing + 37.3h Sarvi schedule + Mother's Day announcement + disclaimer. Sarvi reviewed and approved.

- [2026-05-01] **Static policy disclaimer at bottom of schedule emails (commit `1dfa218`)** — Permanent sick-day / late-arrival / shift-coverage / time-off policy block now appended to every schedule distribution email (Group + Individual modes, HTML + plaintext mirrors). New `src/email/policyDisclaimer.js` exports `POLICY_DISCLAIMER_TEXT` + `POLICY_DISCLAIMER_HTML` as the single source of truth; `src/email/build.js` (individual mode plaintext) and `src/email/buildBrandedHtml.js` (HTML row + group-mode plaintext stub) import from it. Disclaimer styling: 11px muted #8B8580 body / #5C5C5C titles, top border, positioned between admin-contact row and footer. Backend + EmailModal.jsx untouched. Plan at `~/.claude/plans/cryptic-swimming-russell.md`. Build PASS. Playwright smoke 4/4 paths PASS at `https://rainbow-scheduling.vercel.app` — Group + Individual sends both returned "Sent to 1 person", 0 console errors, code structure verified against spec (Gmail-inbox visual rendering not Playwright-reachable due to OAuth; recommend JR confirm visual once on first real send to Sarvi). **State change flag:** smoke toggled the schedule from Edit Mode → LIVE to expose the Publish button — flip back if Week 17 should remain in Edit.

<!-- Older Completed entries trimmed per schema "≤5 most recent". Full history in git log. Recent trims: s049 trim (s047 part-time cap, s047 CacheService verified, s048 admin2 showOnSchedule parity, s045 polish + ghost-PK, s042 jscpd cleanup, s042 B2 sweep, s042 full audit, s041 audit-session); s048 trim (s040 audit-deferred, s039 bug sweep, s038 perf+dead-code, s037 admin-tier silent-drop, s036 PK modal, s035 auto-fill modal, s034 hour-color ladder, s033 unpaid-break, s032 PDF portrait + multiple s032 fixes, s031 email migration, s029 schedule consolidation). -->

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
