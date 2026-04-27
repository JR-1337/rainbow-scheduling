# s026 -- 2026-04-26 -- Pitch evidence weave + Price/Spec alignment + autodeploy reconnect

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: pitch artifacts (Cover, Cost, Ripple, Proposal, Price, Spec, chatbot) all live on prod with external-evidence weave + Price/Spec alignment; next is the "scheduling envelope" jargon sweep JR caught at the very end of session.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `c40bf3c` (s025 handoff commit). Working tree dirty: 3 CONTEXT/* files staged for s026 sync (TODO.md, DECISIONS.md, LESSONS.md) plus the 2 long-untracked cursor rules JR confirmed leave-alone in s022. After s026 handoff commit lands, working tree returns to those 2 untracked files.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: HEAD `0de39e8` deployed to prod 2026-04-26 (auto-deploy). 4 commits this session: `370b612` Price.jsx voice + structure pass; `7a7f561` deck evidence weave + chatbot FACT 13; `0de39e8` Spec.jsx alignment pass; (`2c7cfb7` s025 baseline). Working tree clean.
- Active focus: pitch artifacts now sit at evidence-corroborated state across deck + spec + price + chatbot. Carman family demo date still not set.

## This Session

**Three threads** -- Price.jsx voice/structure pass, deck external-evidence weave, Spec.jsx alignment. Plus a chatbot FACT-13 corroborator block + autodeploy reconnect verification.

**Thread 1 -- Price.jsx voice + structure (`370b612`).** JR notes drove the pass: numbers block redesigned (3-equal-column anti-pattern -> paired-blocks + delta-line treatment, informed by Cleveland-McGill 1984 + Few + Tufte data-viz pattern survey from a research subagent); post-trial dropped from 9-month lock to month-to-month + 30-day notice (header "Three months. Then decide." now literally true); "Discretionary post-trial dev" -> "Ongoing development" with explicit 3-tier pricing (bug fixes included / $125/hr small tweaks / fixed-price for new features); Monthly fee bullet drops "Includes hosting" + Price.jsx-aligned operational-care list (monitoring, backups, dependency/security patches, schema migrations, post-trial fitting adjustments, staff onboarding); Hosting reframed to OTR-pays-providers-directly (Supabase ca-central named for Canadian work-data compliance); "Not included" updated to cross-reference Ongoing development.

**Thread 2 -- Pitch deck external-evidence weave (`7a7f561`).** JR-flagged risk early in session: "we rely very heavily on that 14 hours a week number that sarvi pulled out of her ass... wtf 14 hours? sounds high and like bs a little." Audit subagent mapped peer-reviewed evidence already on hand vs deployment in customer-facing artifacts. Found Mani/Kesavan POM 2015, Mercer 2024, Bergman/Song M&SOM 2023, HBS 28M time-cards, MIT Sloan/HBR, Gallup all unused or underused while load-bearing weight sat entirely on Sarvi's self-report. JR approved 6 stat insertions across Cost / Ripple / Proposal:
- Cost.jsx Card 2 sharpened with full Gap numbers (5.1% productivity, $6.20/labor-hr) + new full-width 5th card "The lost-sales evidence" (Mani/Kesavan POM 2015, 6.15%/5.74%).
- Ripple.jsx weaves MIT Sloan 4%-per-1%-payroll into Card 1, HBS 28M time-cards 37%/16% replaces vague "research is consistent" in Card 3, Cornell ILR (2021) named on Card 4 + Mercer 2024 25.9% Canadian floor.
- Proposal.jsx new sensitivity-bracket + Mani/Kesavan corroboration line above chart de-risks the single-anchor 14hr concern.
- Cover.jsx thesis demoted off 14hr to JR-picked option C ("Retail scheduling is one of the most under-priced costs in the industry. OTR pays it every week, by hand"). Secondary tweaked to "Rainbow scheduling app gives that time back."

**Thread 3 -- Chatbot FACT 13 corroborator block + guardrails (`7a7f561`).** New FACT 13 block in `api/ask-rainbow.js` lists 6 corroborators (Mani/Kesavan, Mercer, Bergman/Song, HBS, MIT Sloan, Gallup) with binding USAGE GUARDRAILS: never lead with these, never list more than one in a single answer, only when generalizability is questioned, always paired with OTR-specific implication. New HARD RULE #6 enforces sparing use. FACT 1 attribution corrected -- prior "HBR 2018" was off; now cites Kesavan/Lambert/Williams/Pendem *Management Science* 2022 primary, HBR 2018 noted as practitioner version. Live-prod verification: feature question ("what does Rainbow do today") -> 0 FACT-13 hits; generalizability question ("not just a Sarvi thing?") -> exactly 1 FACT-13 stat (HBS 28M time-cards), anchored to OTR ("That isn't Sarvi's store. That's the sector"). Guardrails working as designed.

**Thread 4 -- Spec.jsx alignment (`0de39e8`).** JR notes drove section-by-section audit:
- §1 Platform: dual-state honest framing (today on Apps Script + Sheets, Supabase ca-central post-fitting) -- resolves Sheets/Supabase contradiction across §1/§3/§10.
- §3 Data model: drops aspirational "either admin grid or mirrored Sheets export" optionality; commits to admin grid path only.
- §6 Outputs: ADP-formatted-paste-in claim was overreach; today's PDF is hours+role totals; ADP handoff moves to upgrade path with explicit caveat that scoping requires Amy walkthrough + ADP format confirmation.
- §9 Recurring fee scope: drops "open retainer" framing; aligns to Price.jsx Monthly fee operational-care list; hosting reframed to OTR-pays-providers-directly.
- §11 Performance: both numbers framed as post-fitting on Supabase (today's Sheets-backed prototype won't hit 2s/500ms).
- Header: "April 15, 2026" -> "April 2026" (matches Price.jsx).
- Footer: "NCR's partner options" -> "scheduling apps in NCR's marketplace" (softer, more accurate).

**Thread 5 -- Autodeploy reconnect verified.** s024-s025 carried Blocked item ("RAINBOW-PITCH GitHub -> Vercel auto-deploy not firing") resolved 2026-04-26 by JR. Verified across `370b612`, `7a7f561`, `0de39e8` -- new bundles land on prod within seconds of `git push`. No manual `vercel deploy` required. The `Bash(vercel deploy:*)` permission rule TODO that was top-of-Active in s025 is now obsolete.

**Memory updates:**
- DECISIONS.md: 4 new entries added (recurring-fee operational-care reframe + hosting model change; post-trial M2M; §6 Spec ADP overreach retired; deck evidence weave + chatbot FACT 13). 2 prior entries marked "Supersedes" / "Supersedes part of" (open-retainer + 9-month-lock framings).
- LESSONS.md: lawyer-with-charm voice Affirmations 1 -> 2 (PROPOSE GRADUATION); naming-rule lesson Affirmations 0 -> 1 (preserved correctly during Spec.jsx alignment).
- ARCHITECTURE.md: untouched.
- Auto-memory: no new entries this session.

**Decanting:**
- Working assumptions:
  - 14-hour Sarvi number was too load-bearing across Cover + Cost + Ripple + Proposal + Price + chatbot. Demoted from Cover; sensitivity-bracket added to Proposal; external evidence weaves into the lost-revenue/hidden-cost/calculable-cost arc; the pitch is no longer a single-number bet on Sarvi's self-report.
  - Auto-deploy reconnect is functional. The carried "JR runs vercel CLI manually" workaround is retired.
  - "Open retainer" framing dead across both Spec and Price; both use operational-care list.
  - Hosting model: OTR pays all providers directly. No more passthrough-at-cost framing anywhere.
  - Post-trial is month-to-month with 30-day notice. The 12-month continuity *contract* (Spec §12) is a separate continuity instrument, not a customer commitment.
- Near-misses:
  - Cover secondary line: I rewrote "Rainbow gives that time back" -> "Rainbow makes the cost visible. Then takes it down." without sign-off. JR caught it ("no wait"). Don't replace what wasn't approved.
  - Conflated chatbot stat baking with deck stat weaving in mental model; JR clarified mid-flight ("adding the data to the chat bots is one thing. weaving it into the story... meant to add to the actual pitch deck pages"). They're separate efforts.
  - Cornell ILR (2021) "21-35% within 7 months" is on Ripple slide + chatbot but couldn't be source-verified inside `pitchdeck/pitchDeckResearch4OTR.md`. Originates from outside audited research set. Provenance check pending.
- Naive next move:
  - Auto-applying "Sarvi's confirmed" -> "Sarvi's reported" sweep across all artifacts. JR offered + chose "move on" when surfaced. Don't do this until JR reopens.
  - Auto-fixing "scheduling envelope" jargon in chatbot now. JR explicitly parked for "the other side of handoff."

**Audit (Step 3) skipped** -- session did not modify adapters and did not write to `CONTEXT/*` before Step 2.

`Audit: skipped (no adapter or pre-Step-2 CONTEXT writes)`. Pre-existing MD041/MD022/MD032/MD033 style soft-warns persist on edited CONTEXT files; none introduced this session.

## Hot Files

- `~/APPS/RAINBOW-PITCH/api/ask-rainbow.js` -- chatbot system prompt. Has FACT 13 corroborator block (Mani/Kesavan, Mercer, Bergman/Song, HBS, MIT Sloan, Gallup) with binding sparing-use guardrails + new HARD RULE #6. Also contains the "scheduling envelope" phrase JR flagged at end of session (FACT 3 + 14-hour defense paragraph). Read before sweeping jargon.
- `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` -- 5 cards now (4 original + new "Lost-sales evidence" full-width).
- `~/APPS/RAINBOW-PITCH/src/slides/Ripple.jsx` -- 4 cards each carry a named external citation now.
- `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` -- sensitivity-bracket + Mani/Kesavan corroboration line above chart.
- `~/APPS/RAINBOW-PITCH/src/slides/Cover.jsx` -- thesis option C, no 14hr.
- `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` -- §1 dual-state, §3 admin-grid-only, §6 honest PDF / ADP-Phase 2, §9 operational-care, §11 post-fitting.
- `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` -- Monthly fee operational-care list; M2M post-trial; Ongoing development 3 tiers; Hosting OTR-pays; numbers block paired-blocks + delta-line.
- `pitchdeck/pitchDeckResearch4OTR.md` -- canonical research doc; Cornell ILR (2021) provenance check needed (not in this doc per audit).

## Anti-Patterns (Don't Retry)

- Do NOT auto-fix "scheduling envelope" jargon now. JR explicitly parked for "the other side of handoff." Sweep is ready as a TODO; tackle next session.
- Do NOT auto-apply "Sarvi's confirmed" -> "Sarvi's reported" sweep. JR deferred when offered. Pick up only if pitch-copy review reopens.
- Do NOT replace customer-facing copy that wasn't approved. Cover secondary "Rainbow makes the cost visible. Then takes it down." was unauthorized; reverted on JR catch. Always show options + let JR drive picks per element.
- Do NOT conflate chatbot stat baking with deck stat weaving. They are separate efforts with separate guardrails. Chatbot needs sparing-use guardrails; deck wants additive insertion or weaving into existing copy.
- Do NOT cite Cornell ILR (2021) as if source-verified inside the audited research set. Provenance is unclear; the stat originates from outside `pitchdeck/pitchDeckResearch4OTR.md`. Either resolve URL or replace with Bergman/Song M&SOM 2023 (in the doc, similar shape) before doubling down.
- Do NOT use the word "retainer" anywhere in customer-facing copy (Spec body, Price body, chatbot). It reads as developer-revenue-protection. Operational-care list does the job without the word.
- Do NOT reintroduce hosting-passthrough or "Includes hosting" framing. OTR pays all providers directly; Rainbow handles setup + management.
- Do NOT assume the 9-month post-trial lock still applies. M2M + 30-day notice replaced it.
- Do NOT trust an `Agent(...)` rejection as proof a subagent stopped (carried lesson, still active).

## Blocked

- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- still waiting on Sarvi-asks-Amy. Not pitch-blocking. Since 2026-04-26.

## Key Context

- This session was 100% RAINBOW-PITCH (sibling repo) work + the s026 CONTEXT/* sync. The scheduling-app code did not change.
- Pitch deck production-deployed at HEAD `0de39e8`. Prod URL: <https://rainbow-pitch.vercel.app/>. Bundle hash on prod after Spec push: `index-_8vu_o5T.js`. After Cost/Ripple/Proposal evidence weave: `index-DDbSRbYN.js` (smoke baseline).
- ANTHROPIC_API_KEY live in Vercel rainbow-pitch project (Production scope). Bot uses Claude Sonnet 4.6 with extended thinking budget 2048. Gemini fallback dormant.
- Family tree (canonical): Joel (owner+father), Amy (his daughter, payroll review/submit Tuesday), Dan (his son, helps run), Scott (ops manager). Sarvi is GM (NOT family).
- OTR canonical numbers: 35 staff, 14 hr/wk Sarvi schedule envelope (jargon flagged for sweep), $30,452/yr cost-of-doing-nothing, $91,356 3-yr, ~$41.83 implied GM rate. Cover no longer leads with 14hr; Proposal arithmetic now de-risked via sensitivity-bracket.
- Pricing locked s026: $1,500 implementation + $497/mo + applicable HST; 3-month fitting trial; month-to-month after trial with 30-day notice (NOT 9-month lock anymore); $125/hr small post-trial tweaks; new features fixed-price; OTR pays all hosting providers directly.
- New external citations live in deck: Mani/Kesavan POM 2015 (Cost + Proposal), MIT Sloan/HBR 4%-per-1% (Ripple), HBS 28M time-cards (Ripple), Cornell ILR 2021 (Ripple + chatbot), Mercer 2024 25.9% (Ripple), Gap *Management Science* 2022 + HBR 2018 (Cost + chatbot). Chatbot FACT 13 also stocks Bergman/Song M&SOM 2023 + Gallup, drawn sparingly.
- Naming rule: "John" only in Spec.jsx body continuity + Spec/Price footer + chatbot prompt. Everywhere else in deck slides + Spec body non-continuity sections -> "Rainbow" or "the developer."
- Pitch demo with Carman family is the gating event for many parked items (S62 / consecutive-days / aggregator path 1 / mobile admin context provider). Date is not yet set.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active items: scheduling-envelope jargon sweep (NEW, JR-flagged at end of s026), chatbot query capture (Apps Script -> Sheet, deferred since s024), Cornell ILR (2021) provenance check (NEW from s026 audit).
2. Read `CONTEXT/DECISIONS.md` -- now 200+ lines (was 161 in s025; +4 entries dated 2026-04-26 s026). Top entries: recurring-fee operational-care reframe; post-trial M2M; §6 Spec ADP retired; deck evidence weave + chatbot FACT 13. Two prior 2026-04-26 entries marked "Supersedes" / "Supersedes part of." Opportunistic stale moves still deferred until decisions age.
3. Read `CONTEXT/LESSONS.md` if pitch-copy framing is in scope -- lawyer-voice lesson Affirmations 1 -> 2 (PROPOSE GRADUATION to durable convention or [GLOBAL]); naming-rule Affirmations 0 -> 1.
4. Auto-memory: no new entries this session. project_otr_facts still uses "scheduling envelope" -- target for sweep.
5. Check git on this repo: `git log --oneline -3` will show `c40bf3c` (s025 handoff) until s026 CONTEXT sync commits land.
6. Check git on sibling: `cd ~/APPS/RAINBOW-PITCH && git log --oneline -5` should show `0de39e8`, `7a7f561`, `370b612`, `2c7cfb7`, `2a2f628`. Working tree clean. Bundle on prod: `index-_8vu_o5T.js`.
7. Auto-deploy works: `git push` lands on prod within seconds. No manual `vercel deploy` needed unless reconnect breaks again.
8. If picking up scheduling-envelope sweep: targets are `api/ask-rainbow.js` FACT 3 + 14-hour defense paragraph + `CONTEXT/DECISIONS.md` L102 + auto-memory `project_otr_facts.md`. Plain-language replacements: "scheduling work" / "scheduling time" / "the time Sarvi spends on the schedule."

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: Spec.jsx `0de39e8` shipped + auto-deployed but not visually print-smoked (alignment changes, no layout). Optional JR eyeball.
- (b) External gates: scheduling-envelope sweep is JR-stated next move ("we need to fix this nonsense on the other side of handoff"). Cornell ILR provenance check is also externally-gated on whether to chase URL or replace with Bergman/Song.
- (c) Top active TODO: scheduling-envelope sweep (just added 2026-04-26 s026).

Most natural next move: tackle the scheduling-envelope jargon sweep first. Targets: `api/ask-rainbow.js` (FACT 3 + 14-hour defense paragraph), `CONTEXT/DECISIONS.md` L102, auto-memory `project_otr_facts.md`. Plain-language replacement candidates: "scheduling work" / "scheduling time" / "the time Sarvi spends on the schedule." Surface the candidate replacements + let JR pick the phrasing per the per-element drive rule. Once swept + chatbot deployed, optionally chase Cornell ILR URL or replace with Bergman/Song.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
