<!-- SCHEMA: DECISIONS.md
Version: 5
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 200 lines. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until line count is at or
  below 60 percent of ceiling (120 lines for the 200-line ceiling). Cut
  deep on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see decisions-archive.md header below) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
-->

## 2026-04-27 (s027) -- Mobile schedule name column tightened to 60px + card restructured to title-eyebrow / first / last / hours across all 4 schedule render paths

Decision: NAME_COL_WIDTH lowered from 72 to 60 in `MobileAdminView.jsx` and `MobileEmployeeView.jsx`. `tableLayout: 'fixed'` added to the schedule `<table>` so width declarations enforce against unbreakable strings (e.g. TEST-ADMIN1-SMOKE was expanding the column to 117px on 390px viewports because table-layout:auto fits the longest token). `maxWidth: NAME_COL_WIDTH` added to the sticky `<td>` as a hard cap. Card layout reordered across all 4 schedule render paths (mobile admin/employee + desktop EmployeeRow + desktop EmployeeView): title eyebrow on top (small caps, muted, 9px mobile / 9px desktop, +0.4px tracking), first name as focal point (12px font-semibold mobile / text-xs desktop), last name underneath (9px / 10px desktop muted), hours line at bottom (admin paths only). All `<p>` use `truncate` so first-name overflow clips with ellipsis.
Rationale: JR caught mobile staff list rendering at ~30% of viewport ("takes up half the screen") because table auto-layout was breaking the 72px declaration. Three-part fix layers: tighten the declared width, switch to fixed table-layout so the declaration enforces, and add a maxWidth so even fixed layout cannot grow beyond the cap. Card restructure follows JR's spec (title above first, first above last, clip on overflow) and the visual-hierarchy / typography research read this session (Creative-Partner `L0-06`, `L0-07`, `L1-07`, `applied-app-ui.md`): squint test passes via 12px focal + ALL-CAPS muted eyebrow + 9px tertiary; condensed cell tolerates the weak 12:9 size ratio because tracking + uppercase + muted color push the eyebrow back visually. All 4 paths in one commit per mobile-desktop parity rule.
Confidence: H -- verified 2026-04-27 build PASS at `41844d6` then `8978161` (eyebrow bump 7px -> 9px); Playwright prod smoke at bundle `index-DbbdHU0t.js` confirmed cell width = 60px (was 117px), TEST-ADMIN1-SMOKE clipped to "TEST-..." with ellipsis, console errors 0; eyebrow visual not yet verified because no employee in current Sheet has `emp.title` populated.

## 2026-04-27 (s027) -- Cornell ILR (2021) provenance source-verified to ILR Review (2022, Choper/Schneider/Harknett, "Uncertain Time", Shift Project)

Decision: The "21-35% / 7-month" turnover stat carried in chatbot FACT 2 + Ripple.jsx Card 4 is now cited as ILR Review (2022, Choper/Schneider/Harknett, "Uncertain Time: Precarious Schedules and Job Turnover in the U.S. Service Sector"), Shift Project panel of 1,827 hourly retail and food-service workers. Year corrected from 2021 to 2022 (working paper appeared 2019; journal publication January 2022). 21% on-call + 35% short-notice + 7-month follow-up window all confirmed via web search of the SAGE journal page + Equitable Growth working-paper PDF + Harvard Shift Project page. Provenance check that was open since s026 audit is closed.
Rationale: s026 anti-pattern flagged the stat as not source-verified inside `pitchdeck/pitchDeckResearch4OTR.md`; the rule was either resolve URL or replace with Bergman/Song M&SOM 2023. Resolve path won because the citation is real and well-anchored, just had wrong year + missing paper title. Family Googling now lands on the actual paper.
Confidence: H -- verified via web search 2026-04-27, three-source convergence (SAGE doi 10.1177/00197939211048484 + Equitable Growth + Harvard Shift Project) + chatbot FACT 2 + Ripple.jsx Card 4 updated at HEAD `fc48565` on RAINBOW-PITCH prod.

## 2026-04-26 (s026) -- Recurring fee scope reframed as operational care, no retainer language; OTR pays all hosting providers directly

Decision: $497/month is described in Spec.jsx §9 and Price.jsx Monthly fee row as covering operational care of the system: monitoring and uptime, automated backups, dependency and security patching, schema migrations as Sarvi's needs evolve, small fitting adjustments after the trial, and onboarding new staff to the admin tools. Bug fixes in shipped features always included. New scope or major feature work quoted fixed-price separately. Hosting reframed: OTR pays all hosting providers directly at cost (Supabase ca-central named for Canadian work-data compliance); Rainbow handles setup and ongoing management. No "retainer" word anywhere in customer-facing artifacts.
Rationale: JR direction 2026-04-26 -- "i don't wanna say development retainer even though it kinda is the reason id stick around after selling it." The retainer framing reads as developer-revenue-protection; the operational-care list reads as work-the-customer-actually-gets and lets the items justify the fee on their own merits. Hosting passthrough was creating contradictions across artifacts (some said Rainbow includes hosting, some said OTR pays); resolving to OTR-pays-everything cleans the story and forces Rainbow to justify the monthly via operational care alone.
Confidence: H -- direct user direction 2026-04-26 + verified across Spec.jsx `0de39e8` and Price.jsx `370b612`.
Supersedes: 2026-04-26 -- $497/mo recurring is an open retainer; hosting passed through; 12-mo continuity contract on offer (entry below in this file). The 12-month continuity contract on offer remains valid (Spec.jsx §12 unchanged); the open-retainer + hosting-passthrough framings are the parts retired.

## 2026-04-26 (s026) -- Post-trial commitment dropped from 9-month lock to month-to-month + 30-day notice

Decision: Price.jsx "Post-trial commitment" row renamed "After the trial": month-to-month at $497/mo + HST after the 3-month fitting trial, 30-day notice either way, no long-term contract. Header "Three months. Then decide." is now literally true. The 12-month continuity contract on offer (Spec.jsx §12) is a separate continuity instrument with source-code escrow, not a customer commitment.
Rationale: JR direction 2026-04-26 -- chose option (b) "drop to month-to-month after trial" when surfaced. The prior 9-month lock conflicted with the deck thesis ("Three months. Then decide.") and made the trial less risk-reversed than the copy promised. Revenue certainty traded for honest framing; trial-conversion-risk borne by Rainbow not customer.
Confidence: H -- direct user direction 2026-04-26 + verified Price.jsx `370b612`.
Supersedes part of: 2026-04-26 -- Pitch pricing restructured: $1,500 implementation + $497/mo from month 1 (the "9-month commitment" portion is retired; pricing structure $1,500 + $497/mo from month 1 is unchanged).

## 2026-04-26 (s026) -- Spec.jsx §6 Outputs: ADP-formatted-paste-in claim retired; ADP handoff is Phase 2 requiring Amy walkthrough

Decision: Spec.jsx §6 describes today's PDF output as "Per-pay-period PDF with hours and role totals, suitable for printing or for attaching to payroll review" -- not "formatted for ADP paste-in." ADP-formatted payroll handoff lives in §6 upgrade path with explicit caveat: scoped after walking OTR's payroll workflow with Amy and confirming ADP's expected paste/import format. Remains a Phase 2 fixed-price project per §13.
Rationale: JR direction 2026-04-26 -- "the app as it is now doesn't print a properly formatted ADP read out. I'd build it if they wanted though. but I'm not familiar with the format or their workflow to optimize the pipeline." The prior copy overclaimed a feature that requires Amy-discovery and ADP-format research before scoping. Honest framing protects against demo-time challenge ("show us the ADP file").
Confidence: H -- direct user direction 2026-04-26 + verified Spec.jsx `0de39e8`.

## 2026-04-26 (s026) -- Pitch deck threads external evidence; Cover thesis demoted off 14-hr Sarvi anchor; chatbot FACT 13 corroborator block with binding sparing-use guardrails

Decision: Cover.jsx thesis rewritten to option C ("Retail scheduling is one of the most under-priced costs in the industry. OTR pays it every week, by hand") -- 14-hour Sarvi number no longer leads the deck. Cost.jsx, Ripple.jsx, Proposal.jsx weave 6 named external citations (Mani/Kesavan POM 2015 6.15%/5.74% as new full-width Cost card; Gap study sharpened with 5.1%/$6.20; MIT Sloan/HBR 4%-per-1% on Ripple; HBS 28M time-cards 37%/16% replacing vague "research is consistent"; Cornell ILR 2021 named on retention card with Mercer 2024 25.9% Canadian floor; Proposal sensitivity-bracket + Mani/Kesavan corroboration line above chart). Chatbot system prompt gains FACT 13 corroborator block (Mani/Kesavan, Mercer, Bergman/Song, HBS, MIT Sloan, Gallup) with binding USAGE GUARDRAILS: never lead with these, never list more than one in a single answer, only when generalizability is questioned, always paired with OTR-specific implication. New HARD RULE #6 enforces sparing use. FACT 1 attribution corrected to Kesavan/Lambert/Williams/Pendem *Management Science* 2022 primary (HBR 2018 noted as practitioner version).
Rationale: JR-flagged risk 2026-04-26 -- "we rely very heavily on that 14 hours a week number that sarvi pulled out of her ass. i get a little voice in the back of my head saying wtf 14 hours? that sounds high and like bs a little." Audit found peer-reviewed evidence we already had on hand (Mani/Kesavan, Mercer, Bergman/Song, HBS, MIT Sloan) was unused or under-used while load-bearing weight sat entirely on Sarvi's self-report. Threading external evidence into the deck and de-risking Proposal arithmetic with a sensitivity-bracket converts the pitch from a single-number bet into a corroborated case. Chatbot guardrails verified live on prod (feature question -> 0 FACT-13 hits; generalizability question -> exactly 1 FACT-13 stat anchored to OTR).
Confidence: H -- direct user direction 2026-04-26 + Playwright smoke PASS at HEAD `7a7f561` + chatbot guardrail verification via 2-question API probe.

## 2026-04-26 -- Pitch chatbot v4: Sonnet 4.6 + extended thinking + heavily-revised system prompt

Decision: AskRainbow.jsx posts to `/api/ask-rainbow` which calls Anthropic Claude Sonnet 4.6 with extended thinking enabled (budget_tokens 2048, max_tokens 4096). Gemini 2.5 Flash fallback path stays in code dormant (no key configured). System prompt restored from JR's original "trial lawyer for John Richmond" template with verbatim TONE block at the bottom, NO PREAMBLE rule (banned "That's a fair question" and similar softening intros). 11 FACTS IN EVIDENCE blocks plus a WHAT FITTING ACTUALLY MEANS context bank (12 bullets, applies broadly to fee, trial, training, customization, risk, ownership, support, data setup, branding, accountability questions) plus a WHAT THE APP DOES NOT DO TODAY block (Phase 2 leak fix). 14-hour defense paragraph supplies fall-back arguments if Sarvi's hour count is challenged. Rate limit 15 req per IP per 6 hours, in-memory bucket. Per-IP query capture to Apps Script -> Sheet still parked.
Rationale: Haiku's first-shipped answers leaned on the "Sarvi 14 hours" anchor every time and led with "That's a fair question" preambles. JR forced reframe toward varied evidence, no preamble, lawyer-with-charm voice. Sonnet 4.6 + extended thinking improves multi-fact synthesis quality. The fitting-context bank gives the bot operational vocabulary applicable to many objection types, not just fee-justification.
Confidence: H -- direct user direction 2026-04-26 + live-prod verification HEAD `8eca952` returning multi-evidence answers with no preamble.
Supersedes: 2026-04-26 -- Pitch chatbot architecture: Claude Haiku 4.5 primary + Gemini fallback via Vercel serverless (entry below in this file).

## 2026-04-26 -- Supabase Postgres ca-central is a Phase 1 fitting deliverable, not Phase 2

Decision: Pitch deck + Spec sheet + chatbot system prompt all commit to Supabase Postgres in the Canada Central region as the data plane post-fitting. Migration off Apps Script + Google Sheets happens during the 3-month fitting trial; OTR's data is in Supabase before any 9-month commitment starts. Auth model (login type, role-access boundaries, password policy, MFA / magic-link options) chosen during fitting per OTR preference. Sarvi's direct-edit workflow preserved either via admin-grid affordances OR mirrored Sheets export -- decided during fitting per the Sheets-direct-edit constraint decision (below).
Rationale: PIPEDA + SOC 2 compliance posture needed an answer in the pitch; "still on Sheets" reads weak in a sales context. Committing to Supabase ca-central makes the data-ownership story concrete and removes the Apps Script 7-8s perceived-latency floor. Customer-visible promise; JR carries the migration cost during fitting.
Confidence: H -- direct user direction 2026-04-26 (selected "Phase 1 fitting deliverable" out of 3 alternatives).
Rejected alternatives:
- Available if compliance/scale demands -- rejected: weaker pitch, defers commitment.
- Phase 2 hardening track -- rejected: leaves fitting on Sheets, postpones the auth + compliance answer.

## 2026-04-26 -- Pitch pricing restructured: $1,500 implementation + $497/mo from month 1

Decision: The pitch deck and price sheet present the offering as a one-time $1,500 implementation fee plus $497/mo starting month 1, structured as a 3-month fitting trial followed by a 9-month commitment. Year 1 visible $7,464; 3-year total $19,392; net to OTR $71,964 over 3 years. Implementation fee covers fitting Rainbow to OTR's workflow, Sarvi's process tweaks, staff training, and feedback rounds. Internal lever (waive monthly during trial OR waive implementation fee for higher trial monthly) is JR's only and never printed.
Rationale: The prior $2K-post-trial structure put a large back-loaded ask between the customer and the commitment moment. Front-loading the implementation as work-product justification (training, fitting, feedback) removes the "what am I paying for after the trial?" objection and makes the monthly look smaller relative to the visible Year 1 total. Supersedes the S47 pricing decision.
Confidence: H -- direct user direction 2026-04-26.
Rejected alternatives:
- Keep $2K post-trial activation -- rejected: the back-loaded large ask reads as a hidden fee at the worst possible moment.
- $1500 paid in 3-month installments during fitting -- rejected: less clean than a single upfront line; smooths cash but blurs what the fee is FOR.
- $1500 due at month 3 (post-fitting) -- rejected: removes the early-commitment signal the upfront ask provides.

## 2026-04-26 -- Migration off Sheets must preserve Sarvi's direct-edit workflow

Decision: Any migration off Google Sheets (to Postgres / Supabase / Neon / D1 / self-hosted) must include EITHER (a) an admin UI that lets Sarvi edit DB rows directly with the same affordances she has in Sheets today (sort, filter, paste a column, tweak a single cell), OR (b) a sync layer that mirrors DB writes back to a Sheets copy so Sarvi's existing Sheets-based workflow keeps working and her edits feed back into the DB. Locked as a pre-design constraint, not an open question. Loss of the Sheets escape hatch is a hard adoption blocker, not a tradeoff.
Rationale: Sarvi performs manual employee-row tweaks, backfills, and exception fixes directly on the spreadsheet today. The sibling project pitch positions Sarvi as the scheduling admin; her current direct-edit ability is part of how she runs ops. A migration that removes this without replacement would either (1) push that work back onto JR or (2) erode Sarvi's confidence in the platform. Either failure mode kills adoption.
Confidence: H -- direct user direction 2026-04-26 ("we could create a system that syncs it to the spreadsheet or create a UI for the database that allows sarvi to directly edit in the same way she can edit these sheets. her edits get fed back into the database").

## 2026-04-26 -- Apps Script 7-8s call floor is internal migration motivation only, not pitch material

Decision: The Apps Script web-app ~7-8s call floor (documented in `CONTEXT/LESSONS.md` and `backend/Code.gs:85`) is the dominant user-perceived latency in the current stack and the strongest reason to migrate off Apps Script. It does NOT appear in pitch decks, customer-facing copy, or family-facing demo material. Migration urgency is captured internally; current performance number is not surfaced.
Rationale: JR direction 2026-04-26 -- "I don't want the 8 second lag times in the pitch. appscript is our current system. it's enough to know that I should migrate away from it asap." Pitch math leads with confirmed customer cost-of-doing-nothing (Sarvi 14 hrs/wk, $30,452/yr; $91,356 over 3 yr) and product cost; current-stack lag is not a pitch claim. Internal: confirms migration sequencing -- Apps Script departure is the highest-impact move; DB choice is secondary (per `docs/research/scaling-migration-options-2026-04-26.md`).
Confidence: H -- direct user direction 2026-04-26.

<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md on 2026-04-26 (s022), 2026-04-26 (s024 -- desktop name col, sick day events, PDF print registry), and 2026-04-27 (s028 -- 3 PK entries: PKDetailsPanel sibling, bulk-clear PK by day, PKEventModal dual-mode). -->


<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
