# s024 -- 2026-04-26 -- AskRainbow chatbot shipped + deck-copy iteration in flight

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: pitch deck restructure shipped + heavily iterated (19 commits on RAINBOW-PITCH this session); next decision is the side-by-side tone-style sample on 1 slide before applying lawyer-with-charm voice across the whole deck.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `e33707f` (s023 handoff). Working tree dirty: 3 modified (`CONTEXT/DECISIONS.md` -- restructured + 3 new entries + 3 archived in this s024 session; `CONTEXT/LESSONS.md` -- 3 new [PROJECT] entries; `CONTEXT/TODO.md` -- restructured for s024 state). 1 deleted (`CONTEXT/handoffs/s020-...md` -- pre-existing leftover from s023 archival, unchanged this session). 2 untracked cursor rules (JR confirmed leave alone in s022). The s024 handoff commit at end of this session captures everything atomically.
- Active focus: RAINBOW-PITCH deck-copy iteration. Original plan complete through Phase F3 (JR review gate). 19 follow-up commits since the executor finished, all driven by JR's live review of deployed prod.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: HEAD `8eca952` deployed to prod 2026-04-26 end of s024 (JR ran `vercel deploy --prod --yes`). Working tree clean. Bundle `index-CMymmZof.js` (or later if Vercel rebuilt; need to confirm prod hash).

## This Session

**Two threads, both in RAINBOW-PITCH (sibling repo).**

**Thread 1 -- Original plan execution (Phase A-F3) by Sonnet 4.6 subagent.** Spawned at session start against `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md` (v2). Executor shipped 4 phase-commits: `088c223` pricing rewrite ($1,500 + $497/mo, 3-yr strip $91,356/$19,392/$71,964, cumulative-cost SVG), `c8f2bd7` ESA single-mention + Cornell ILR turnover + Gap stable-scheduling stat + 6-row feature parity grid, `1fd951a` Phase2 narrative restructure, `54597ea` AskRainbow chatbot slide + Vercel serverless function + Anthropic SDK dep. Phase E memory + DECISIONS edits left in this project's working tree; committed in this s024 handoff. Bundle delta: +11.87 KB raw / +2.89 KB gzip. ESA grep returns exactly 1 (Today.jsx Safety net body, as planned). Phase F4 formal post-deploy smoke (full prod walk + console capture + ESA grep on prod) was scoped to a smoker subagent we never spawned -- piecemeal Playwright smokes happened instead.

**Thread 2 -- Live JR review at F3 gate triggered 14 follow-up commits.** Iteration was driven by JR testing the bot on prod and surfacing problems. Sequence:

1. `b6f646f` -- system prompt v2 (restored JR's original "trial lawyer" template skeleton from `docs/research/reactPitchDeckGemini.md`; removed Sarvi initially per JR's instruction; preserved verbatim TONE block).
2. `93f36a4` -- restored Sarvi (JR changed mind), swapped model `claude-haiku-4-5-20251001` -> `claude-sonnet-4-6`, enabled extended thinking (`budget_tokens: 2048, max_tokens: 4096`).
3. `95b58a7` -- added "WHAT THE $1,500 IMPLEMENTATION FEE COVERS" context block (12 bullets: fitting, process tweaks, staff training, management training, feedback rounds, fine-tuning, data setup, branding, account provisioning, backend setup, priority support, risk absorption).
4. `41a0910` -- broadened the fee-context block scope: renamed to "WHAT FITTING ACTUALLY MEANS" + updated intro to apply to fee/trial/training/customization/risk/ownership/support/data setup/branding/accountability questions (JR caught the over-narrow framing).
5. `114f4cf` -- Deck.jsx keyboard nav ignores INPUT/TEXTAREA/SELECT focus (spacebar was advancing slides while typing in chatbot textarea).
6. `09648f6` -- Phase 2 leak fix in chatbot answers + spec sheet alignment. Bot was claiming tailor-shop and promo as current capabilities. Added explicit WHAT THE APP DOES NOT DO TODAY block. Spec sheet §3 + §9-12 + new §13 aligned to current truth (Supabase ca-central post-fitting, $497 open retainer, PIPEDA posture, 5+ yr retention, continuity contract option).
7. `2ace9a2` -- 35-staff canonical (was 24/34 across files), SOP/KB Phase 2 entry added to bot + spec, 60 em-dashes swept across 10 files (JR style preference), AskRainbow mobile UI overhaul (uniform 56px buttons, full-width on mobile, centered Ask button text, 12px radius unified). Plus Proposal.jsx 5-point grid 5th card spans 2 cols (no empty hole).
8. JR ran `vercel deploy --prod --yes` (after `2ace9a2`). Confirmed "yes works great" on mobile UI.
9. JR's iteration 3 directives -- new FACTS #9 OPERATIONAL BAND ($7,464 / $19,392 / $71,964 + comparator pricing Deputy ~$210/mo, 7shifts ~$1,400/mo, ADP WFN ~$805-1,050/mo at 35 staff), #10 COMPLIANCE+DATA (Supabase ca-central from day 1, PIPEDA, SOC 2, 5+ yr retention), #11 CONTINUITY GUARANTEE (12-mo service contract on offer + source-code escrow + multi-location pricing not 1:1), #8 PAPER TRAIL (already added earlier). Plus 14-hour defense paragraph (Sarvi's count + academic backstop + math-still-works-at-10hrs + trial-risk-zero closer).
10. `60f4095` -- Ripple slide first card replaced. The original "GM's week / 14 hrs" duplicated Cost slide's first card. JR rejected "family backfills" framing (false). Replaced with "THE INVISIBLE BILL / OTR pays the cost without ever seeing the cause" -- lands cost on the business itself.
11. `851c793` -- deck-copy fixes round 1: Today.jsx mobile lightbox removed (popup didn't render well on phones), wrong "Same colors as the wall" annotation fixed (wall is B&W; replaced with "Color-coded by role"), Phase2.jsx rounding sweep + Amy reference removed (JR: "STOP SAYING ROUNDING") + SOP/KB 5th direction added, Deck.jsx swipe disabled (was hijacking horizontal scroll inside parity grid + chart) + nav buttons enlarged to 52x52 + pill backdrop + nowrap counter, Ripple footer rewritten lawyer-with-charm voice ("The pen-and-paper schedule was never free. Sarvi has been quietly picking up the tab. Rainbow settles it -- week after week, without ever sending an invoice.").
12. `8eca952` -- Today.jsx Paper trail card added as 5th feature (research-backed placement decision per Creative-Partner reference docs: applied-content-strategy + applied-copywriting + visual-hierarchy). Grid pivots 4-up -> 3-up; 5th card spans 2 cols at md+; mobile stacks 5 cards single-column. Lawyer-with-charm voice: "Every change has a receipt." Direct quoted excuses ("I didn't take a photo." "I had an old version saved.") + Sarvi credibility marker + "The record is the answer."
13. JR ran `vercel deploy --prod --yes` (final, end of session). Prod is at HEAD `8eca952` plus the 3 commits between last deploy (`09648f6`, `60f4095`, `851c793`, `8eca952`).

GitHub -> Vercel auto-deploy is NOT firing for `rainbow-pitch` repo. Every push needs a manual `vercel deploy --prod --yes`. Last automatic deploy was 50 min before s024 started (the API-key redeploy from s023). Logged as a Blocked item; permanent fix is reconnecting the GitHub integration on Vercel rainbow-pitch project. JR also flagged that I need to be able to run the deploy directly -- requires a Bash permission rule in `~/APPS/RAINBOW-PITCH/.claude/settings.local.json` (`"Bash(vercel deploy:*)"`). Captured as top Active TODO.

Three research subagents (Supabase compliance + competitor pricing + retail manager scheduling-time) all hit the org's monthly token limit before delivering. Backfilled via WebSearch in-session. Net: Supabase ca-central confirmed PIPEDA-defensible (vendor docs say ca-central data stays in Canada, SOC 2 Type II attested). Comparator pricing scraped from Capterra/G2. The "Deloitte 6-8 hrs/wk on retail scheduling" claim that surfaced is vendor-blog laundered (no traceable primary source) -- intentionally NOT cited as a fabrication risk; bot's 14-hour defense relies on Sarvi's count + academic-research framing + math-still-works-at-10hrs fallback.

JR explicitly parked items mid-session for next session: side-by-side tone-style sample of 1 page (before applying voice everywhere), Price.jsx update (Spec.jsx already aligned), price sheet layout redesign (deferred until tone-style sample reviewed), chatbot query capture wireup. Plus he wants me to be able to run `vercel deploy` directly -- one-time permission rule.

**Memory updates this session:**

- DECISIONS gained 3 new entries at top: chatbot v4 (Sonnet 4.6 + extended thinking + revised system prompt), Supabase ca-central as Phase 1 fitting deliverable, $497/mo open retainer + 12-mo continuity contract option. Marked 2026-04-26 Haiku entry as `Superseded by:` the v4 entry. Archived 3 oldest 2026-04-25 entries (sick day events, PDF print registry, desktop name col) to `decisions-archive.md`. File now at 161 lines (still 11 lines over 150 ceiling -- flagged below).
- LESSONS gained 3 new [PROJECT] entries: lawyer-with-charm pitch voice + no preamble, family-doesnt-backfill-Sarvi sales reality, no-"rounding"-language sweep ban.
- Auto-memory: `feedback_park_during_plan.md` (NEW) -- JR's mid-session workflow rule that new asks during plan execution get parked unless he explicitly says "do it now". MEMORY.md index updated.

**Decanting:**

- Working assumptions:
  - GitHub -> Vercel auto-deploy is broken for rainbow-pitch. Manual CLI required every push. Surface in Blocked.
  - Supabase migration is now a ship-by-trial-end commitment in BOTH the deck and the spec. JR carries the migration cost during fitting. Prior Sheets-as-data-plane assumption is now retired for pitch artifacts.
  - The Carman family does NOT backfill Sarvi. Sarvi absorbs all scheduling-related crisis recovery. Saved as a [PROJECT] LESSON.
  - JR's "lawyer-with-charm" voice is the canonical pitch-copy register. Saved as a [PROJECT] LESSON.
- Near-misses:
  - I drafted "the family carries the cost" for Ripple first card; JR forced reframe (factually wrong).
  - I shipped a system prompt with 8 mentions of Sarvi; JR forced reframe.
  - I duplicated the 14-hour anchor across Cost + Ripple slides; JR caught it.
  - I narrowly labeled the fitting-context block "WHAT THE $1,500 FEE COVERS"; JR pointed out the bullets apply broadly. Renamed.
  - I wrote "Rainbow surfaces every cost"; JR pointed out Rainbow doesn't surface costs (they were always invisible) -- it eliminates them quietly. Reframed.
- Naive next move:
  - Apply lawyer-with-charm tone style to all slides without doing JR's requested side-by-side sample first. JR explicitly said: "im gonna want to see a side by side sampe of 1 page before we apply it everywhere."

**Audit (Step 3) ran (CONTEXT/* writes happened pre-Step-2: executor's Phase E DECISIONS edits at session start in working tree).** Findings:

- DECISIONS at 161 lines after my edits -- 11 lines over the 150 ceiling. Top 5 newest are all dated 2026-04-26 and protected; movable entries are also all 2026-04-26 (oldest-first by date is undefined). Opportunistic-stale rule didn't trigger (none of the entries are clearly stale). Carrying the overage into next session for organic resolution as decisions age.
- LESSONS at 567 lines (was 544 from s023; +23 from new entries). Schema header still does not define Archive behavior; HANDOFF.md ARCHIVE rule references a schema feature that doesn't exist on this project's LESSONS.md. Defer until LESSONS schema gains an archive section. Surface as opportunistic next-session work.
- TODO at ~110 lines (no ceiling, fine).
- ARCHITECTURE untouched this session.
- Style soft-warns: pre-existing MD041/MD022/MD032 patterns across CONTEXT/* files; not introduced this session.

Audit result: DECISIONS over-ceiling flagged (defer); LESSONS over-ceiling flagged with schema-gap caveat; everything else clean.

## Hot Files

- `~/APPS/RAINBOW-PITCH/api/ask-rainbow.js` -- system prompt v4 with 11 FACTS + WHAT FITTING block + WHAT-DOES-NOT-DO block + 14-hr defense + verbatim TONE bottom. Read first if iterating bot.
- `~/APPS/RAINBOW-PITCH/src/slides/AskRainbow.jsx` -- chatbot UI; mobile UI overhauled in s024.
- `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` -- 5 features now (Auto-fill / Safety net / Self-serve / Distribution / Paper trail). Grid 3-up + 5th col-span-2 at md+. Mobile lightbox removed.
- `~/APPS/RAINBOW-PITCH/src/slides/Ripple.jsx` -- first card "THE INVISIBLE BILL"; footer rewritten lawyer-with-charm.
- `~/APPS/RAINBOW-PITCH/src/slides/Phase2.jsx` -- 5 directions (Counterpoint -> ADP / native punch clock / tailor-shop / reorder drafting / SOP+KB). All "rounding" language removed.
- `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` -- aligned to current truth (Supabase ca-central post-fitting, $497 open retainer, PIPEDA, 5+ yr retention, NEW §12 Continuity, §13 Roadmap). 35 seats.
- `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` -- NOT yet aligned. Top Active TODO for next session.
- `~/APPS/RAINBOW-PITCH/src/Deck.jsx` -- swipe disabled, nav buttons 52x52 with pill backdrop.
- `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md` -- the original plan; Phase A-F3 complete, F4 (formal smoker) never run.
- `docs/research/pitchDeck-StrategicPrompt.md` / `pitchDeckStrategy.md` / `reactPitchDeckGemini.md` -- JR's source docs (still untracked in this project; commit candidates).
- `~/APPS/Creative-Partner/reference/layer-1/applied-content-strategy.md` + `applied-copywriting.md` + `~/APPS/Creative-Partner/reference/layer-0/visual-hierarchy.md` -- the 3 research files I picked for the paper-trail placement decision in s024. Reusable for any future deck-copy decision.

## Anti-Patterns (Don't Retry)

- Do NOT apply lawyer-with-charm tone-style across the deck before doing the side-by-side sample on 1 slide. JR explicitly asked for the comparison: "im gonna want to see a side by side sampe of 1 page before we apply it everywhere."
- Do NOT frame any pitch copy as "the family backfills Sarvi" or "the cost spreads to the family." Family does NOT cover for missing staff in reality. Cost lands on Sarvi (concentrated), the business (invisibly), the floor (visibly), or the single-point-of-failure risk (latent).
- Do NOT use "rounding", "rounding rule", "rounding ambiguity" in any pitch artifact. JR sweep-banned. Counterpoint replacement reasons must use other angles (modern phone-first punch flow, real-time dashboard, ADP-formatted handoff, automated promo commission tracking).
- Do NOT lead chatbot answers with "That's a fair question" / "Great question" / "And the honest answer is" / any softening preamble. Hard rule in system prompt.
- Do NOT mention Amy by name in pitch artifacts re: rounding or anything else operationally-fragile. Family tree is fine; specific operational claims about Amy are not.
- Do NOT trust the "Deloitte 6-8 hrs/wk on retail scheduling" stat. It surfaces in vendor blogs but has no traceable primary source. The 14-hour defense uses Sarvi's count + academic framing + math-still-works-at-10hrs + trial-risk-zero.
- Do NOT push to RAINBOW-PITCH main without expecting Vercel to auto-deploy. GitHub integration is broken; manual `vercel deploy --prod --yes` required after each push. JR is currently the one running it; capture the permission rule first if you need to ship a deploy yourself.
- Do NOT trust an `Agent(...)` rejection as proof a subagent stopped (carried lesson, still active).
- Do NOT spawn the smoker subagent for the original plan's Phase F4 -- we have manual coverage now and the plan is heavily diverged from the post-F3 state.
- Do NOT mention "ESA" / "Employment Standards Act" in any pitch artifact unless the user explicitly types those words first. Single allowed mention is in Today.jsx Safety net body.

## Blocked

- RAINBOW-PITCH GitHub -> Vercel auto-deploy not firing -- since 2026-04-26 (s024). Manual `vercel deploy --prod --yes` after every push. Permanent fix: reconnect GitHub integration on Vercel rainbow-pitch project. Workaround: JR runs the CLI; for me to run it requires a Bash permission rule in `~/APPS/RAINBOW-PITCH/.claude/settings.local.json` (`"Bash(vercel deploy:*)"`).
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- still waiting on Sarvi-asks-Amy. Now lower priority since JR removed all rounding language from pitch artifacts; not blocking demo. Since 2026-04-26.

## Key Context

- This session was 100% RAINBOW-PITCH (sibling repo) work. The scheduling-app code did not change. CONTEXT/* files were updated to reflect pitch-deck decisions because pitch architecture flows through the scheduling-app project's CONTEXT (the only context-system in play).
- Pitch deck is now production-deployed at HEAD `8eca952` post-deploy by JR end of s024. Prod URL: https://rainbow-pitch.vercel.app/. Chatbot URL: same domain `/api/ask-rainbow`.
- ANTHROPIC_API_KEY is live in Vercel rainbow-pitch project (Production scope). GOOGLE_AI_API_KEY intentionally not set; Gemini fallback dormant.
- Family tree is corrected and stable in the system prompt + spec + auto-memory: Joel (owner+father), Amy (his daughter, payroll), Dan (his son, helps run), Scott (ops manager). Sarvi is GM (NOT family). Saved 2026-04-26 in s023.
- The pitch demo with the Carman family is the gating event for many parked items (S62 / consecutive-days / aggregator path 1 / mobile admin context provider). Date is not yet set per memory.
- JR's tempo on iteration is fast and feedback-driven. He gives short, direct corrections; expect course correction every 2-3 commits during pitch-deck work.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top 4 Active items are all RAINBOW-PITCH (permission rule + tone-style sample + Price.jsx alignment + chatbot query capture). Top item is JR-action (permission rule); next-after that is the tone-style sample.
2. Read `CONTEXT/DECISIONS.md` -- top 4 entries are this-session: chatbot v4 + Supabase Phase 1 + $497 open retainer + Pricing $1,500. Pitch chatbot Haiku entry is Superseded but kept for traceability.
3. Read `CONTEXT/LESSONS.md` only if pitch-copy framing is in scope -- 3 new [PROJECT] entries near bottom: lawyer-with-charm voice, family-doesnt-backfill, no-"rounding" sweep ban.
4. Check git on this repo: `git log --oneline -3` should show `e33707f`, `bfd78b1`, `36a9187`. `git status` should show 1 deleted (s020 archive leftover) + 2 untracked cursor rules + 0 modified UNTIL the s024 handoff commit lands.
5. Check git on sibling: `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` should show `8eca952`, `851c793`, `60f4095`. Working tree should be clean. Bundle `index-CMymmZof.js` (or later if Vercel rebuilt overnight) on prod.
6. If picking up the pitch-deck tone-style work: read `~/APPS/Creative-Partner/reference/layer-1/applied-copywriting.md` first for voice principles. Then pick a single slide (suggest Cost.jsx or Ripple.jsx -- both are about pain framing where lawyer-tone has the most leverage), draft a side-by-side sample (current vs lawyer-tone), surface to JR before applying anywhere else.
7. If picking up Price.jsx alignment: read it first; mirror the structure of Spec.jsx §9 (open retainer scope) + §10 (compliance) + §12 (continuity); 35 staff; no rounding language; no Amy reference; mention Supabase ca-central where appropriate.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: prod is at HEAD `8eca952` post-deploy. Formal F4 smoke (full prod walk + ESA grep + console capture + AskRainbow round-trip) was scoped to a smoker subagent we never spawned. Could run a quick Playwright pass on the deployed deck to verify the post-`2ace9a2` commits (Ripple first card, Today paper trail, Deck nav buttons) are visually correct on prod. Low effort but optional -- piecemeal smokes happened during iteration.
- (b) External gates: JR adding the Bash permission rule for `vercel deploy:*` (top Active item; one-time setup); other carried gates from prior sessions still pending.
- (c) Top active TODO after JR's permission action: **RAINBOW-PITCH side-by-side tone-style sample (1 page).** Pick one slide, draft current-copy vs lawyer-with-charm-copy side-by-side, surface to JR before applying voice across the whole deck. JR explicitly asked for this gate before mass application.

Most natural next move: ask JR which slide to use as the tone-style sample (Cost.jsx and Ripple.jsx are the strongest candidates for pain-framing slides where lawyer-tone has leverage; Today.jsx is feature-driven and tone-tone differential will be subtler). Once JR picks the slide, draft both versions and present side-by-side, then iterate to JR-approval before applying to other slides.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
