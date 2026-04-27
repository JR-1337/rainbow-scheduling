# s027 -- 2026-04-27 -- Mobile name col fix + chatbot FACT 6 reframe + Cornell ILR provenance verified

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: pitch artifacts cleaned of retainer/hosting drift + Cornell ILR sourced; mobile name col compressed 117px -> 60px across all 4 schedule render paths; next-session priority is wiring JR's new OTR-dedicated Gmail in place of personal account for schedule distribution.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `8978161` (mobile eyebrow 7px -> 9px). 3 commits this session pushed to `main`: `57ee39f` envelope sweep CONTEXT sync, `41844d6` mobile name col tighten + 4-path card restructure, `8978161` eyebrow bump.
- Working tree: `M CONTEXT/TODO.md` (mid-handoff write), `D CONTEXT/handoffs/s023-...md` (stale archive deletion left in working tree), `?? .cursor/rules/blast-radius.mdc` + `?? .cursor/rules/ui-ux-design.mdc` (long-untracked, JR confirmed leave-alone in s022).
- Sibling repo `~/APPS/RAINBOW-PITCH/`: HEAD `fc48565` deployed to prod 2026-04-27 (auto-deploy). 2 commits this session: `db4843e` envelope FACT 3 rewrite, `fc48565` FACT 6 operational-care reframe + Cornell ILR year/title fix on Ripple.jsx + chatbot FACT 2.
- Active focus: pitch artifacts now drift-free vs s026 DECISIONS; mobile schedule grid usable on 390px viewports (4 day-cells visible vs prior 3); ready to tackle email distribution next session.

## This Session

**Commits shipped (scheduling-app):**
- `57ee39f` -- envelope-jargon sweep CONTEXT sync (LESSONS L364-365 retitled "Schedule work = full admin scope" with advisory line; auto-memory `project_otr_facts.md` rephrased; TODO Active sweep item -> Completed).
- `41844d6` -- mobile name col tighten: NAME_COL_WIDTH 72 -> 60 in `MobileAdminView.jsx` + `MobileEmployeeView.jsx`; `tableLayout: 'fixed'` on schedule `<table>`; `maxWidth: NAME_COL_WIDTH` on sticky `<td>`; card restructure across all 4 schedule render paths (mobile admin/employee + `components/EmployeeRow.jsx` + `views/EmployeeView.jsx`) to title-eyebrow / first / last / hours; `MobileEmployeeView` adopts `splitNameForSchedule` + `hasTitle` helpers (was using inline split).
- `8978161` -- mobile title eyebrow 7px -> 9px for legibility (parity with desktop 9px).

**Commits shipped (RAINBOW-PITCH):**
- `db4843e` -- chatbot FACT 3 envelope-jargon rewrite ("scheduling envelope" -> "the schedule and everything that runs around it - swaps, sick calls, time-off, after-hours coverage").
- `fc48565` -- FACT 6 operational-care reframe (drops banned "open retainer" + "hosting passed through at cost"; adds operational-care list + 3-tier dev pricing + Supabase ca-central + Vercel paid-by-OTR-direct framing); FACT 2 Cornell year corrected 2021 -> 2022 + paper title added; Ripple.jsx Card 4 same correction.

**Cornell ILR provenance verified:**
- Web search confirmed paper: Choper, Schneider & Harknett, "Uncertain Time: Precarious Schedules and Job Turnover in the U.S. Service Sector," ILR Review, January 2022 (working paper Equitable Growth 2019).
- 21% on-call + 35% short-notice + 7-month follow-up all source-confirmed via three convergent sources: SAGE doi `10.1177/00197939211048484`, Equitable Growth working-paper PDF, Harvard Shift Project page.
- Year was wrong (2021 -> 2022), paper title was missing -- both fixed.

**Smokes:**
- Desktop split-name schedule prod-smoke PASS at HEAD `0fe138c` (Employee column 240px canonical; name `<p>` 186px after avatar/edit/padding; Alex/Fowler, Gellert/Boloni, Natalie/Sirkin, Nicole/Seeley, Nona/Kashi, Rafeena/Santsarran longest, Rebecca/Oteba all split cleanly; hover full-name working via parent `<div title>`; 0 console errors).
- Mobile name-col fix prod-smoke PASS at bundle `index-DbbdHU0t.js` (cell width 117px -> 60px verified via DOM measurement; TEST-ADMIN1-SMOKE clipped to "TEST-..." with ellipsis; 0 console errors).
- Eyebrow visual NOT verified -- no employee in current Sheet data has `emp.title` populated; code path wired and ready.

**Memory writes:**
- DECISIONS.md: 2 new s027 entries added at top (mobile name col + Cornell ILR provenance). 2 superseded entries moved to `archive/decisions-archive.md` ($497/mo open retainer, Pitch chatbot Haiku architecture). Active file 187 -> 183 lines.
- LESSONS.md: untouched this session (still 580 lines, well over 150 ceiling -- flagged below).
- TODO.md: 3 new Completed entries (envelope sweep, FACT 6 + Cornell, mobile col fix); Active list pruned (stale Cornell ILR + FACT 6 items removed; new "email distribution" priority surfaced); chatbot query capture moved AFTER email work per JR direction.
- ARCHITECTURE.md: untouched.
- Auto-memory: `project_otr_facts.md` rephrased to drop "envelope" jargon (s027 sweep).

**Decanting:**
- Working assumptions: chatbot system prompt drift detection is not codified -- FACT 6 sat out-of-sync with s026 DECISIONS for one session before being caught during the envelope sweep audit. Email distribution sender hard-codes JR's personal Gmail in current code; new OTR Gmail unblocks the 2026-02-10 email upgrade item.
- Near-misses: Mobile eyebrow shipped at 7px first; below the 14pt label-readability floor per `applied-app-ui.md`. JR confirmed bump to 9px on second pass. Don't ship `<8px` text on mobile cells in future even when budget feels tight.
- Naive next move: Jumping straight to chatbot query-capture wiring next session would skip JR's stated priority -- email distribution wiring with the new OTR Gmail goes first. JR explicitly reordered ("first we should figure out this email logic and test it for schedule distribution").

**Audit (Step 3):**
- Audit ran (CONTEXT/* written before Step 2 + DECISIONS edited).
- Schema-level: clean (all required sections present in TODO/DECISIONS/LESSONS).
- DECISIONS.md: 187 -> 183 lines after archiving 2 superseded entries. STILL OVER 150 ceiling; cut not deep enough to hit 60% target (90 lines). Acceptable for this handoff (two near-immediate s026 DECISIONS were promoted to top and the truly retired entries got archived); deeper cut deferred as a future opportunistic move.
- LESSONS.md: 580 lines, far above 150 ceiling. RISK: ceiling violation. Deferring deep archival -- not session work, would consume the entire handoff budget. Recommend a dedicated maintenance pass.
- Adapter files: untouched.
- Style soft-warns: pre-existing MD041/MD022/MD032/MD033 noise in CONTEXT/* -- none introduced this session.

`Audit: 2 DECISIONS entries archived (Superseded by: links resolved); LESSONS.md 580/150 ceiling deferred (flag); pre-existing style soft-warns persist`.

## Hot Files

- `~/APPS/RAINBOW Scheduling APP/src/MobileAdminView.jsx` -- name col tighten + card restructure. Lines 179 (NAME_COL_WIDTH=60), 200 (tableLayout:'fixed'), 298-329 (sticky `<td>` with maxWidth + restructured card).
- `~/APPS/RAINBOW Scheduling APP/src/MobileEmployeeView.jsx` -- same pattern. Lines 25 (splitNameForSchedule + hasTitle import), 171 (NAME_COL_WIDTH=60), 200 (`.mobile-grid-table { table-layout: fixed }` CSS rule), 252-282 (restructured card).
- `~/APPS/RAINBOW Scheduling APP/src/components/EmployeeRow.jsx` -- desktop admin grid card reordered; line 38-46 (title eyebrow now first).
- `~/APPS/RAINBOW Scheduling APP/src/views/EmployeeView.jsx` -- desktop employee self-view card reordered; lines 155-167.
- `~/APPS/RAINBOW Scheduling APP/src/utils/employeeRender.js` -- `splitNameForSchedule` + `hasTitle` helpers. Single source of truth for both.
- `~/APPS/RAINBOW-PITCH/api/ask-rainbow.js` -- chatbot system prompt. FACT 2 (Cornell year + title corrected), FACT 3 (envelope jargon swept), FACT 6 (operational-care reframe). Read before chatbot query-capture wiring.
- `~/APPS/RAINBOW-PITCH/src/slides/Ripple.jsx` -- Card 4 Cornell year + title corrected.
- Email-distribution targets (next session): grep for `MailApp` + `GmailApp` + `johnrichmond007@gmail` + `from:` across `backend/Code.gs` and `src/email/build.js`. Sender email value still pending from JR.

## Anti-Patterns (Don't Retry)

- Do NOT ship sub-9px text on mobile cells, even when vertical budget feels tight. 7px eyebrow this session was below the readability floor; bumped to 9px per JR feedback.
- Do NOT use `table-layout: auto` (CSS default) for fixed-width sticky columns when the column carries unbreakable strings. The auto-layout fits the longest token regardless of declared width. Always pair fixed declared width with `tableLayout: 'fixed'` AND a `maxWidth` cap.
- Do NOT cite "Cornell ILR (2021)" with no paper title -- the s026 unverified citation. Real cite is ILR Review 2022, "Uncertain Time," Choper/Schneider/Harknett, Shift Project panel.
- Do NOT use the word "retainer" or "hosting passed through at cost" in chatbot FACTS even though they were in the original FACT 6 -- both contradicted by s026 DECISIONS (operational-care reframe + OTR-pays-providers-direct hosting model). Audit chatbot FACTS against active DECISIONS.md whenever DECISIONS changes.
- Do NOT skip the chatbot system prompt audit when DECISIONS changes. FACT 6 drift went undetected for one session because the prompt wasn't checked after s026 reframed the recurring-fee model. (Process gap; see Working Assumptions.)
- Do NOT jump to chatbot query-capture wiring next session. JR explicitly sequenced email-distribution wiring first.
- Do NOT trust that an `Agent(...)` rejection killed the subagent (carried lesson, still active).
- Do NOT replace customer-facing copy that wasn't approved (carried s026 lesson, still active).

## Blocked

- Email + distribution overhaul -- JR's new OTR-dedicated Gmail is ready; sender email value still pending from JR -- since 2026-02-10. **NEAR-UNBLOCK**: only the literal email-address string is missing now.
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25 (still on prod, expanded mobile col before this session's fix).
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- still waiting on Sarvi-asks-Amy. Not pitch-blocking. Since 2026-04-26.
- Mobile eyebrow visual verify -- needs an employee with `emp.title` populated (none in Sheet today).

## Key Context

- Pitch artifacts (deck + spec + price + chatbot) are now drift-free vs s026 DECISIONS after s027 sweep. Retainer language eliminated; hosting model is OTR-pays-providers-direct everywhere; Cornell ILR cited correctly.
- Mobile schedule grid usable for the first time on 390px viewports without column expansion. Day cells visible jumped from ~3 to ~4+partial.
- All 4 schedule render paths (mobile admin/employee + desktop EmployeeRow/EmployeeView) carry the same card structure: title eyebrow (caps, muted) -> first name (focal) -> last name (under) -> hours (admin only). Squint test: first name dominates regardless of title presence.
- Carman family demo date still not set. Pitch demo gates many parked items (S62 / consecutive-days / aggregator path 1 / mobile admin context provider).
- Pricing locked s026: $1,500 implementation + $497/mo + applicable HST; 3-month fitting trial; month-to-month after trial with 30-day notice; $125/hr small post-trial tweaks; new features fixed-price; OTR pays all hosting providers directly.
- OTR canonical numbers: 35 staff, 14 hr/wk Sarvi (no longer "envelope" -- now "scheduling work" / "the schedule and everything that runs around it"), $30,452/yr, $91,356 over 3 years, ~$41.83 implied GM rate.
- Family tree (canonical): Joel (owner+father), Amy (his daughter, payroll review/submit Tuesday), Dan (his son, helps run), Scott (ops manager). Sarvi is GM (NOT family).
- Naming rule: "John" only in Spec.jsx body continuity + Spec/Price footer + chatbot prompt. Everywhere else -> "Rainbow" or "the developer."
- Push to scheduling-app `main` is hook-gated (denies direct push without explicit user authorization). JR authorizes per-session with "push yes" or equivalent.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is **email logic + schedule distribution wiring** (next-session priority). Wiring sender email config to JR's new OTR-dedicated Gmail. Sender email value still pending from JR; ask in first reply.
2. Read `CONTEXT/DECISIONS.md` -- 183 lines. Top 2 entries are s027 (mobile name col + Cornell ILR provenance). Next 5 are s026. Active file is over 150 ceiling; deeper archival cut deferred.
3. Read `CONTEXT/LESSONS.md` if pitch-copy framing or mobile UI is in scope -- 580 lines, way over ceiling. RISK flagged. Lawyer-voice lesson Affirmations 2 -- should have graduated last session, still local. Naming-rule Affirmations 1.
4. Auto-memory: `project_otr_facts.md` updated 2026-04-27 (s027) to plain-language phrasing. `MEMORY.md` index unchanged.
5. Check git on this repo: `git log --oneline -3` should show `8978161`, `41844d6`, `57ee39f` (all pushed). Working tree carries `M CONTEXT/TODO.md` (this handoff write), `D CONTEXT/handoffs/s023-...md` (stale archive deletion), 2 untracked cursor rules (leave-alone).
6. Check git on sibling: `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` should show `fc48565`, `db4843e`, `0de39e8`. Auto-deploy verified across both pushes; new bundle was `index-DDbSRbYN.js` (FACT 3 rewrite) then `index-CrxQH100.js` (FACT 6 + Cornell). Working tree clean.
7. If picking up email work: grep `backend/Code.gs` + `src/email/build.js` for `MailApp.sendEmail` / `GmailApp.sendEmail` / `johnrichmond007@gmail` to inventory current sender call-sites.
8. If switching harnesses: read shared `CONTEXT/*` first; AGENTS.md is canonical -- shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: Mobile eyebrow visual not verified at 9px because no employee in Sheet has `emp.title` set. JR may eyeball when he assigns himself "Owner" or Sarvi "GM" via employee modal. Optional.
- (b) External gates: JR-stated next move is **email distribution wiring**. Blocker is the literal sender email address value (JR has the new OTR Gmail account; just needs to share the address).
- (c) Top active TODO: email logic + schedule distribution wiring.

Most natural next move: ask JR for the new OTR Gmail address, then audit sender call-sites in `backend/Code.gs` (`MailApp` / `GmailApp` calls) and `src/email/build.js` (`from:` headers, MailApp options). Surface a swap plan: replace personal-account references with the new account, update the Apps Script `Setup` / config sheet if sender lives there, smoke-send a test schedule to JR's personal email to verify routing. Once email is wired and tested, slot chatbot query-capture next.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
