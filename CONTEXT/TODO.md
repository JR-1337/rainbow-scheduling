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

- **Optional: sweep "Sarvi's confirmed 14 hrs/wk" -> "Sarvi's reported"** across chatbot prompt, DECISIONS L102, LESSONS L291/L340, auto-memory project_otr_facts. JR offered + deferred 2026-04-26 s026. Cover demoted off 14hr; Proposal sensitivity-bracket added; verbal "confirmed" still echoes elsewhere. Pick up if pitch-copy review reopens.
- **Email migration -- NEXT SESSION: nuke-and-pave Option A** -- JR chose Option A 2026-04-27 s030 close: ditch the existing transferred Sheet + script (versioned deployment is permanently bound to John, not worth fighting). Instead: otr.scheduler does Drive `File -> Make a copy` of the current Rainbow Sheet -> creates a brand-new otr-owned Sheet + bound script from inception, no ownership-transfer ghost. JR + Sarvi only users; passwords carry over with copied data; no staff impact. Steps: (1) otr in Drive, Make a copy of shared Rainbow Sheet. (2) Open new sheet's bound script. (3) RUN any function from editor as otr to force fresh OAuth grant -- auth popup MUST appear. (4) Deploy -> New deployment, Execute as Me, Anyone, Deploy. (5) Copy new `/exec` URL, send to next-session model. (6) Swap `src/utils/api.js:6` to new URL, build, push. (7) Smoke test: trigger email, Show original, verify `From:` reads `otr.scheduler@gmail.com`. (8) If emails STILL come from John -> OAuth metadata followed the copy, fall back to Option B (truly fresh from scratch -- create blank sheet, recreate 5 tabs per `docs/schemas/sheets-schema.md`, paste-special values, paste full Code.gs into fresh script). Background context: prior attempt this session did ownership-transfer + redeploy and emails STILL came from John because Apps Script versioned deployments don't transfer ownership ([Google docs](https://developers.google.com/apps-script/concepts/deployments)). Full investigation at `docs/email-migration-investigation.md` (4 loops). Walkthrough at `docs/email-migration-walkthrough.md` (Parts 1-7).
- **In-app bug fixes (JR to enumerate next session if any)** -- s028 shipped 4 audit-driven fixes (sick parity D-1, meeting-row reorder C-2, Unavailable copy D-3, mobile shift-detail title C-4) + 9-item cleanup. Open audit items at `docs/audit-2026-04-27-deferred.md`: A-7 (dead `callerEmail` branches in `Code.gs`, bundle with email redeploy) + B-1/B-2/B-3 perf refactors (deferred -- low ROI at OTR scale).
- **Email upgrade (PDF auto-attached via MailApp)** -- unblocked once sender migration above lands; ~2-day-old design question still open: generate PDF in Apps Script vs accept frontend base64 blob. Surface for JR after sender swap verified.
- **Wire up chatbot query capture (Apps Script -> Google Sheet).** Append each `/api/ask-rainbow` POST as a row (timestamp, truncated IP, question, answer length, latency, provider). ~15 lines added to `api/ask-rainbow.js` + ~10 lines Apps Script. Fire-and-forget sink. Deferred since s024. Slot AFTER email-distribution work next session per JR direction 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` employee from Employees tab -- Playwright smoke test data left on prod when smoke hung at cleanup step
- Future-proofing audit -- research doc shipped 2026-04-26 at `docs/research/scaling-migration-options-2026-04-26.md`. Decision-axes captured (CF Worker SWR / Supabase ca-central-1 / Neon / D1 / self-hosted). Apps Script 7-8s floor identified as the highest-impact lever, not DB choice. Next: JR picks motivation OR ships CF Worker cache (already in Blocked) to defer the cliff
- Perf + professional-app audit -- (a) wave 1 shipped 2026-04-25: ScheduleCell memo at parent callsite (`feb094b`) + PDF lazy-load (`3cf6b09`); wave 2 shipped 2026-04-25: ColumnHeaderCell extract + scheduledByDate lookup (`1d0ccb1`); audit doc at `docs/perf-audit-app-jsx-2026-04-25.md`; next: prod phone-smoke wave 1+2; (b) evaluate database + hosting upgrades beyond Sheets+AppsScript for professional security posture if OTR decides to buy the app
- JR to delete `Employees_backup_20260424_1343` tab from Sheet once satisfied with widen result -- optional cleanup
- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test save/delete failure paths on phone; edit-modal must stay on "Edit" (not "Add"), state must revert on failure (post-commit 7a13cab LIVE)
- Adversarial audit Phase E -- pause or pick concrete motivation. Cuts 1-15 shipped; App.jsx 3044 -> 2526 (-518, -17%). Sub-area 6 (Context provider) still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Sheet inspection 2026-04-24 found zero PK rows with 10-10 times.
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Email + distribution overhaul -- next: JR creates dedicated Gmail to replace personal account as sender
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- raised 2026-04-18, explore later, do not ask

## Blocked

- iPad print preview side-by-side -- JR compares prior PDF export vs new at HEAD `1d26daf` to confirm ~20-27px logo-to-table gap reduction -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke; require live mutation -- since 2026-04-25
- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Pre-requisite for Phase 2 Counterpoint replacement bridge but JR has now removed all rounding language from pitch artifacts -- not blocking pitch demo. Since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: RAINBOW-PITCH prod Playwright smoke PASS at HEAD `7a7f561` 2026-04-26 (s026). Cover thesis C (no 14hr / "by hand" accent / "Rainbow scheduling app gives that time back" secondary). Cost.jsx 5th card "lost-sales evidence" (Mani/Kesavan POM 2015, 6.15% / 5.74%) renders full-width. Ripple 4 cards each carry named external citations (MIT Sloan 4%-per-1%, HBS 28M time-cards 37%/16%, Cornell ILR 2021 named, Mercer 2024 25.9% / 2.2x Canadian). Proposal sensitivity-bracket + Mani/Kesavan corroboration line above chart. Chatbot guardrails LIVE: feature question -> 0 FACT-13 hits; generalizability question -> exactly 1 FACT-13 stat (HBS 28M time-cards), anchored to OTR. Console 0 errors. Mobile (390x844) Cover renders no overflow. Auto-deploy reconnect verified -- new bundles land on prod within seconds of `git push` (no manual `vercel deploy` needed).
- Missing validation: Spec.jsx HEAD `0de39e8` shipped 2026-04-26 s026; print-preview not visually smoked (alignment changes only, no layout edits). JR optional eyeball.
- Last validated: RAINBOW-PITCH prod Playwright smoke PASS at HEAD `2c7cfb7` 2026-04-26 (s025). 8-slide desktop walk (Cover thesis role-reversal, Cost Card 4 Tuesday-payroll fix, Ripple "Cost of forgetting", Today kitchen-door, Alternatives 4 vendor rewrites, Proposal subhead + naming rule, AskRainbow live round-trip pulling FACT #12, Phase2 footer fix). Console 0 errors, deck-body John refs = 0, banned phrases = 0, ESA mentions = 1 (Today only). Cover + Today mobile (390x844) renders correctly.
- Last validated: AskRainbow live API on prod returned multi-evidence answer pulling FACT #12 (TIMEKEEPING CATCH-SYSTEM): Counterpoint + paper sheet + Sarvi reconstruction + Monday close + Amy Tuesday review + Phase 2 distinction. Provider=anthropic, no preamble, lawyer voice. 2026-04-26 s025 against bundle `index-B-0MzfeS.js`.
- Last validated: 35/14/$30,452/$91,356-3yr is canonical across deck + chatbot + spec + price + CONTEXT/* + auto-memory after s025 drift sweep.
- Missing validation: Spec.jsx new sections (Recurring fee scope / Compliance posture / Continuity / Roadmap) not visually smoked at full print size (only Read-time review in s024). JR may want to print preview during Spec voice pass.
- Missing validation: prod phone-smoke of N meetings per day + multi-event eventOnly render (`089adaa` + `651712d`) -- pending JR phone-test
- Missing validation: prod smoke of sick-mark end-to-end / Floor Supervisor role / sick-flow polish / opaque day-header / part-time Clear / unified warning / logo-as-home-button -- all pending JR phone-smoke
- Missing validation: favicon prod confirmation; FT Auto-Fill cell-click prefill prod smoke; cuts 8/10/13 live admin-action paths; Sarvi iPad white-screen retest
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Missing validation: no automated test suite; manual Playwright smoke only
- Partial validation: PDF logo gap `1d26daf` -- structural fix verified live; ~20-27px iPad-render delta still needs JR side-by-side eyeball
- Last validated: PKDetailsPanel + bulk-clear PK + PKEventModal + PDF Export + cell density + ColumnHeaderCell -- s023 prod Playwright PASS 2026-04-26.

## Completed

- [2026-04-27] **Schedule render path consolidation -- 9 of 12 audit findings shipped** (s029, plan `~/.claude/plans/elegant-crunching-manatee.md`) -- 3 commits: `f55174d` CLEAN bucket (F2 SickStripeOverlay + F4 hasApprovedTimeOffForDate canonical helper + F5 filterSchedulableEmployees + EmployeeView useMemo + F8 today-detection), `4e1eb3e` PARAMETERIZABLE bucket (F1 computeCellStyles + F3 EventOnlyCell + F6 MobileBottomNavShell + F7 MobileDrawerShell), `af87ff9` F10 week2 mobile getEmpHours stabilized via useCallback (interpretation 2 confirmed: both weeks sum shift.hours; fix was perf/memo, not union-hours). Net bundle delta -4.45kB. Skipped F9 RISKY. New helpers in src/utils/scheduleCellStyles.js, src/utils/employees.js (filterSchedulableEmployees added), src/components/{SickStripeOverlay,EventOnlyCell,MobileBottomNav,MobileDrawerShell}.jsx. Build PASS at every commit. Smoke deferred to JR phone-test.
- [2026-04-27] **Sonnet 4.6 codebase audit + 5 fix commits shipped** (s028) -- audit at `docs/audit-2026-04-27-deferred.md` (17 findings). Shipped: `910278b` cleanup (9 unused imports + EmployeeView hot-path math), `cf86f14` D-1 sick rendering on employee paths (Sarvi wants all staff to see sick), `45b6abd` C-2 chunkedBatchSave keyOf parity (no more meeting-row reorder on >15-shift saves) + D-3 'Unavailable' copy parity, `0c44907` C-4 mobile shift-detail role pill uses tapped employee's title (not viewer's). 2 new LESSONS entries: admin1/admin2 tiers intentional + titled employee title source rule. Deferred: A-7 (bundle with email redeploy), B-1/B-2/B-3 perf refactors (low ROI at OTR scale).
- [2026-04-27] **LESSONS + DECISIONS archive maintenance pass** (s028) -- DECISIONS.md 183 -> 153 (3 PK product entries archived: PKDetailsPanel sibling, bulk-clear PK by day, PKEventModal dual-mode). LESSONS.md 580 -> 570 (2 entries archived: trailing-underscore Apps Script + AdaptiveModal hot-resize positive observation; 3 verbose pitch entries tightened: lawyer voice, JR-naming, Carman family backfill). New `CONTEXT/archive/lessons-archive.md` created from schema. LESSONS still well over 150 ceiling but file is mostly load-bearing patterns; aggressive archival would lose signal.
- [2026-04-27] **Email sender migration prep doc shipped** (s028) -- `docs/email-sender-migration.md` covers Path A (re-own Apps Script + Sheet under `otr.scheduler@gmail.com`, re-deploy Web App, swap `API_URL` in `src/utils/api.js`) and Path B (`GmailApp.sendEmail` with verified "Send mail as" alias). Key finding: there is no hard-coded sender in `backend/Code.gs`; `MailApp.sendEmail` always sends from the script-owning account. Only literal `johnrichmond007@gmail.com` is at `Code.gs:2280` -- seed data for `emp-owner` row, NOT a sender.
- [2026-04-26] **Desktop split-name schedule prod-smoke PASS** (s027) -- Playwright at HEAD `0fe138c` on prod. Employee column = 240px canonical; name `<p>` = 186px (after avatar/edit/padding). splitNameForSchedule renders 2 lines cleanly across Alex/Fowler, Gellert/Boloni, Natalie/Sirkin, Nicole/Seeley, Nona/Kashi, Rafeena/Santsarran (longest), Rebecca/Oteba. Hover full-name working: parent `<div>` carries `title="<First Last>"`. Sarvi (single-name) renders as one line. Console errors 0.
- [2026-04-26] **Chatbot FACT 6 + Cornell ILR provenance fixed** (s027, RAINBOW-PITCH `fc48565`) -- FACT 6 rewritten to operational-care list per s026 DECISIONS (drops banned "open retainer" + "hosting passed through at cost"; lists monitoring, backups, dependency/security patches, schema migrations, fitting adjustments, staff onboarding; bug fixes always included; small tweaks $125/hr; new features fixed-price; Supabase ca-central + Vercel paid by OTR directly). Cornell ILR (2021) source-verified via web search: paper is Choper, Schneider & Harknett, "Uncertain Time: Precarious Schedules and Job Turnover in the U.S. Service Sector," ILR Review 2022 (not 2021); Shift Project panel data; 21% on-call + 35% short-notice + 7-month follow-up window all confirmed. Year + paper title corrected on chatbot FACT 2 + Ripple.jsx Card 4.
- [2026-04-26] **"Scheduling envelope" jargon swept** (s027) -- chatbot `api/ask-rainbow.js` FACT 3 rewritten to plain language ("14 hours of her week spent on the schedule and everything that runs around it - swaps, sick calls, time-off, after-hours coverage. Hours that come out of the sales floor."); LESSONS L364-365 retitled "Schedule work = full admin scope" with advisory line banning "envelope" in customer-facing copy; auto-memory `project_otr_facts.md` rephrased to "scheduling work" + plain-language note. DECISIONS.md never carried the word (handoff pointer to L102 was inaccurate). FACT 6 retainer + hosting drift surfaced as side-effect, parked as new Active TODO.
- [2026-04-26] **Spec.jsx alignment pass shipped** (`0de39e8`) -- §1 dual-state Sheets/Supabase honest framing (Sheets-today, Supabase-post-fitting); §3 drops aspirational "mirrored Sheets export" optionality; §6 Outputs ADP-paste-in overclaim removed (today's PDF = hours+role totals; ADP handoff is Phase 2 needs Amy walkthrough); §9 Recurring fee scope drops "open retainer" + Price.jsx-aligned operational-care list (monitoring, backups, dependency/security patches, schema migrations, post-trial fitting adjustments, staff onboarding); §11 Performance both numbers framed post-fitting; header "April 2026"; footer NCR softened to "scheduling apps in NCR's marketplace."
- [2026-04-26] **Pitch deck external-evidence weave shipped** (`7a7f561`) -- 6 stat insertions across Cost / Ripple / Proposal: Cost gains 5th card "Lost-sales evidence" (Mani, Kesavan & Swaminathan POM 2015, 6.15% / 5.74%) full-width + sharpens Gap card (5.1% productivity, $6.20/labor-hr); Ripple weaves MIT Sloan 4%-per-1%-payroll into Card 1, HBS 28M time-cards 37%/16% replaces vague "research is consistent" in Card 3, Cornell ILR (2021) named + Mercer 2024 25.9% Canadian floor in Card 4; Proposal new sensitivity-bracket + Mani/Kesavan corroboration line above chart de-risks Sarvi-self-report load-bearing concern. Cover.jsx thesis demoted off 14hr to option C ("Retail scheduling is one of the most under-priced costs in the industry. OTR pays it every week, by hand"). Auto-deploy fired correctly.
- [2026-04-26] **Chatbot FACT 13 corroborator block + guardrails baked in** (`7a7f561`) -- FACT 1 attribution corrected (Kesavan/Lambert/Williams/Pendem, *Management Science* 2022 primary; HBR 2018 practitioner version) + adds 5.1% productivity + $6.20/labor-hr. New FACT 13 (DRAW SPARINGLY): Mani/Kesavan POM 2015, Mercer 2024 Canadian 25.9%, Bergman/Song M&SOM 2023 20% quit lift, HBS 28M time-cards, MIT Sloan/HBR 4%-per-1%, Gallup 18K workers. New HARD RULE #6 enforces sparing use. Live verified on prod: feature question pulls 0 FACT-13 stats; generalizability question pulls exactly 1 (HBS), anchored to OTR.
- [2026-04-26] **Price.jsx voice + structure pass shipped** (`370b612`) -- Monthly fee bullet operational-care list (no retainer, no chatbot mention); post-trial dropped from 9-month lock to month-to-month (header "Three months. Then decide." now literally true); Discretionary post-trial dev -> Ongoing development with explicit 3-tier pricing; Hosting reframed to OTR-pays-providers-directly (Supabase ca-central named for Canadian compliance); numbers block redesigned per `D` data-viz pattern (paired blocks + delta line; replaces 3-equal-column anti-pattern).
- [2026-04-26] **RAINBOW-PITCH GitHub -> Vercel auto-deploy reconnected.** s024-s025 carried blocker resolved 2026-04-26 by JR. Verified across `370b612`, `7a7f561`, `0de39e8` -- new bundles land on prod within seconds of `git push`; no manual `vercel deploy` required.
- [2026-04-26] **Pitch deck voice pass complete** -- 7 slide commits on RAINBOW-PITCH (`f1fbcd1` Ripple, `a059458` Today, `98c40ae` Alternatives, `342cf4c` Proposal, `6eb0a06` Phase2, `2a2f628` Cost, `2c7cfb7` Cover). Lawyer-with-charm voice applied across all prose-heavy slides. JR drove voice picks per card. Multiple factual fixes shipped in same pass: Cover envelope-framing role-reversal, Cost + Ripple Tuesday-payroll error removal (replaced with OTR's actual cadence: Counterpoint + paper sheet + Sarvi reconstruction; payroll Monday by accounting + Amy Tuesday review), Today kitchen-door correction (was whiteboard / breakroom wall), Alternatives TimeForge no-contract claim removal (was a fabrication risk). Naming rule scoped + applied: deck slides use "Rainbow" / "the developer" not "John"; spec body + footer attributions + chatbot prompt exempt.
- [2026-04-26] **Smoke PASS on RAINBOW-PITCH prod at `2c7cfb7`** -- Playwright walk, AskRainbow live round-trip pulling new FACT #12 cleanly, console 0 errors, deck-body John refs = 0, banned phrases = 0, ESA mentions = 1 (Today only). Mobile pass clean.
- [2026-04-26] **OTR fact corrections + drift cleanup shipped** -- New auto-memory: project_otr_timekeeping (Counterpoint + paper sheet + Sarvi reconstruction; payroll cadence), project_otr_schedule_posting (kitchen door), feedback_no_personal_naming_in_deck (naming rule scope). Stale 24/16/$29,120 + 34/14/$25,480 numbers swept across CONTEXT/DECISIONS L102 + LESSONS L291/L340 + 2 auto-memory files + MEMORY.md index. Committed as `3e49ed1`.
- [2026-04-26] **AskRainbow chatbot v4 shipped + iterated heavily (s024)** -- 14 follow-up commits across s024 driving from Haiku 4.5 default to Sonnet 4.6 + extended thinking. New FACTS #9 OPERATIONAL BAND, #10 COMPLIANCE+DATA, #11 CONTINUITY GUARANTEE, #8 PAPER TRAIL (s024); FACT #12 TIMEKEEPING CATCH-SYSTEM added in s025.
- [2026-04-26] **RAINBOW-PITCH restructure original plan complete (s024)** -- 4 phase-commits shipped under the original plan (`088c223` pricing rewrite, `c8f2bd7` ESA + Cornell + Gap stats + parity grid, `1fd951a` Phase2 narrative, `54597ea` AskRainbow chatbot slide + serverless function). Bundle delta: +11.87 KB raw / +2.89 KB gzip. ESA grep returns exactly 1 (Today Safety net body, as planned).

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
