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
- **Chatbot FACT 6 retainer + hosting drift** (NEW, found during s027 sweep). FACT 6 still says "$497/month is an open retainer" + "Hosting infrastructure (Supabase ca-central) is passed through at cost" -- both contradicted by s026 DECISIONS (retainer banned in customer-facing copy; OTR pays all hosting providers directly). Rewrite FACT 6 to operational-care list framing per Spec.jsx §9 + Price.jsx Monthly fee row.
- **Wire up chatbot query capture (Apps Script -> Google Sheet).** Append each `/api/ask-rainbow` POST as a row (timestamp, truncated IP, question, answer length, latency, provider). ~15 lines added to `api/ask-rainbow.js` + ~10 lines Apps Script. Fire-and-forget sink. Deferred since s024.
- **Cornell ILR (2021) provenance check.** Audit s026 found the "21-35% within 7 months" stat is on Ripple slide + chatbot, but couldn't be source-verified inside `pitchdeck/pitchDeckResearch4OTR.md`. Originates from outside the audited research set. Find URL/citation before family Googles it; or replace with Bergman & Song M&SOM 2023 (in research doc, similar shape).
- Desktop name column (240px, splitNameForSchedule) on Vercel -- next: JR prod-smoke grid alignment, long/short names, hover full name
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
