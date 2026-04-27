# s023 -- 2026-04-26 -- Polish smokes PASS on prod + RAINBOW-PITCH restructure plan drafted

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: pitch deck restructure plan v2 ready at `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md`; pre-flight clear (deletions committed `3ba799a`, ANTHROPIC_API_KEY in Vercel); next decision is whether to spawn the Sonnet 4.6 subagent now or pause first.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `bfd78b1` (1 commit ahead of origin/main from this session's smoke-results commit). Working tree dirty: 2 modified (`CONTEXT/LESSONS.md`, `CONTEXT/TODO.md` -- both this-session edits). Untracked: 2 cursor rules (JR confirmed leave alone in s022) + 3 docs/research/pitchDeck*.md files (JR added this session, source material for the restructure plan).
- Active focus: RAINBOW-PITCH restructure plan ready for execution by Sonnet 4.6 subagent next session. Scheduling-app code untouched this session.
- Sibling repo `~/APPS/RAINBOW-PITCH/` -- HEAD `3ba799a` (1 commit ahead of origin: 3 stale Today.*-backup.jsx deletions). ANTHROPIC_API_KEY configured in Vercel + redeployed; chatbot serverless function ships next session.

## This Session

**Two threads.**

**Thread 1 -- Prod smoke run on s022's 5 polish commits + carried perf wave + PDF (`bfd78b1`)**

JR asked for Playwright smoke. Ran a non-mutating sweep on prod (booked 2 PK temporarily on Sun Apr 26 for the panel-render verify, then unbooked via the same edit-mode flow -- net zero state change). Results all PASS:

- `0fe138c` PKDetailsPanel: rendered `Sun, Apr 26 . 6p-8p . 2 booked: Alex Fowler, Anasstasia Trofimov` on desktop admin grid; mobile admin Comms tab rendered `Sat, May 9 . 10a-10:45a . 22 booked: ... +19 more` (first-3 + +N truncation works).
- `78f02d7` PKEventModal edit mode + Sat toggle: opened modal with 2 booked checkboxes correctly checked; Save disabled at no-diff; deselect -> `Save (-2)` enabled (THE BUG IS FIXED on prod). Saturday quick-pick toggled visually on/off cleanly (filled OTR rotating accent rgb(196,102,26) + 2px box-shadow ring + checkmark glyph when active).
- `63420ce` Bulk-clear PK: desktop dropdown gained `Sun, Apr 26 -- 2 PK` optgroup; AutoPopulateConfirmModal copy reads `Clear all 2 PK bookings on Sunday, April 26?`. Mobile Clear sheet showed `PK BY DAY` sub-section with `Sat, May 9 -- 19 PK` (count differs from desktop's raw 22 because `daysWithPKInWeek` filters to schedulableEmployees -- admins/owner excluded by design; consistent across both surfaces).
- `5f5f16f` cell density: PK cell rendered `<span PK>` + `<span 10a-10:45a>` 2-row inline structure; no absolute event overlays; click still opens "Edit Shift" modal with Work/Meeting/PK tabs.
- `1d0ccb1` ColumnHeaderCell + scheduledByDate: column header `sat 9 11a-7p 0/20` rendered correctly via O(1) lookup (PK doesn't count toward staffing target -- by design).
- `feb094b` ScheduleCell memo + `3cf6b09` PDF lazy + `8affd22` popup fix: cell click opens editor; PDF Export button opens blob print tab `Rainbow Schedule - Week 19 & 20` (no popup-block).
- `0d3220e` PDF legend: includes `MTG / Meeting / PK / Product Knowledge / SICK / Sick / star Has Task / OFF Approved Time Off` after role glyphs; UTF-8 charset; no garbage glyphs.
- Console: 0 errors / 0 warnings across full session.
- Partial: `1d26daf` PDF logo gap -- structural fix verified live, ~20-27px visual delta still needs JR iPad print preview side-by-side (Playwright viewport != iPad rendering).

Smoke screenshot saved to `pdf-print-preview-2026-04-26.png` for JR's visual reference. TODO.md "Missing validation" entries promoted to "Last validated" for the 7 commits above.

JR-cleanup queue carried: 22 stale PK on Sat May 9 + TEST-ADMIN1-SMOKE employee row (both pre-existing from prior smokes).

**Thread 2 -- RAINBOW-PITCH restructure planning (no execution yet)**

JR dropped 3 research docs at `docs/research/pitchDeck-StrategicPrompt.md`, `pitchDeckStrategy.md`, `reactPitchDeckGemini.md`. Asked for analysis + proposal. First proposal was too defensive of the current deck (JR: "i think you're too attached to your design"); restarted with steel-manning the docs first.

After several iterations of JR's corrections (pricing structure, Phase 2 framing, ESA cap, family tree, chatbot system prompt direction), I:
1. Read 3 Creative-Partner research files (L0-06 visual hierarchy, L1-07 data viz, L2-08 copywriting/conversion) for design grounding.
2. Spawned 2 parallel research subagents: ADP Workforce Now hours-input + retail scheduling persuasion stats. Both returned facts-only with source URLs flagged (per the global subagent-delegation rules from s022).
3. Drafted plan v1 to `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md` (~700 lines).
4. JR requested an audit pass against the conversation. Found 9 gaps; drafted plan v2 with audit changelog at top (~830 lines).

Plan v2 covers (in sequential dependency order):
- Phase A -- Pricing rewrite ($1500 implementation + $497/mo from month 1; Y1 visible $7464; 3-yr $19,392; saved $71,964) across Proposal.jsx 3-yr strip + new cumulative-cost SVG chart + /price + /spec + 5th "Quick-turn custom dev" point + "Dan takes home" -> "for the family" line.
- Phase B -- Repetition cuts + persuasion uplift: ESA folded into Today.jsx Safety net as the SINGLE deck-wide mention; Cost.jsx Guardrails card replaced with Gap +7% retail sales card (peer-reviewed); Ripple.jsx 79% claim replaced with Cornell ILR turnover stats (21-35%, peer-reviewed); Alternatives.jsx gets new 6-row feature parity grid (Rainbow vs ADP ET / TimeForge / Deputy / Agendrix).
- Phase C -- Phase2.jsx narrative restructure (4 directions: Counterpoint->ADP bridge, native punch clock, tailor-shop comms, real-time reorder drafting). NO card grid. Removed already-shipped meetings+PK. Removed ESA-adjacent consecutive-days warning.
- Phase D -- AskRainbow.jsx chatbot slide between Proposal and Phase2. Vercel `/api/ask-rainbow` serverless function. Claude Haiku 4.5 primary; Gemini 2.5 Flash fallback. Charming-trial-lawyer system prompt anchored in sourced facts only. 15-req / 6-hr per-IP rate limit. 4 quick-question buttons reuse the original docs framing (with $1500 swap for the $2K question).
- Phase E -- Memory + DECISIONS updates in this scheduling-app project.
- Phase F -- Build + local smoke + STOP at JR review gate. NO auto-push.

Hard constraints baked into plan: ESA mentioned exactly once in deck (Today.jsx); OTR colors immutable; pricing internal flexibility never on paper; no fabrications (sourced facts table is the only allowed numbers); family tree corrected.

JR confirmed Sonnet 4.6 for execution (over Opus 4.7) -- his original Opus-plans-Sonnet-executes pattern from LESSONS L252-255.

**Pre-flight resolved this session:**
- 3 Today.*-backup.jsx deletions on RAINBOW-PITCH main: committed `3ba799a` (local only, NOT pushed). Working tree clean entering next session.
- ANTHROPIC_API_KEY: configured in Vercel rainbow-pitch project + redeploy triggered. Gemini fallback intentionally NOT configured (JR opted out).

**Memory updates this session:**
- LESSONS L359 family-tree entry: corrected (Joel = owner+father, Amy + Dan = his children, Scott = ops mgr, Sarvi = JR's girlfriend NOT family). Affirmations bumped to 1 (was 0).
- LESSONS gained 2 new [PROJECT] entries: "Topics JR has explicitly closed stay closed" and "Steel-man contradicting research before defending current design" -- both lessons directly from this session's stumbles.
- Auto-memory `project_carman_family_profile.md`: family roles corrected.
- Auto-memory `project_pitch_restructure_plan.md` (NEW): pointer to the plan file + pre-flight status + execution mode.
- MEMORY.md index: new entry for the pitch restructure plan added at top.

**Decanting:**
- Working assumptions: pricing math reconciliation (Y1 $7464, 3-yr $19,392) confirmed by JR; old family-tree memory entries assumed correct (they were wrong, fixed). Promoted to memory + LESSONS where durable.
- Near-misses: almost asked 4 chatbot quick questions about "what we don't do" -- JR called this out as bad sales positioning (kept the original docs questions). Considered renaming Cost.jsx -> Investment.jsx -- held back per consistency analysis. Initially proposed plan without consulting Creative-Partner research -- JR redirected; now grounded.
- Naive next move: spawn Sonnet immediately on plan v1 without addressing the audit gaps. Avoided -- JR's audit request caught it.

**Audit (Step 3):** ran (CONTEXT/* writes happened pre-Step-2: LESSONS family-tree edit + TODO smoke updates earlier in session). Adapter files NOT touched. Findings:

- **DECISIONS at 139 lines** -- under 150 ceiling. Clean.
- **LESSONS at 544 lines** -- over the 150 ceiling per the handoff prompt. The LESSONS schema header does NOT define an Archive behavior (only DECISIONS does). Flagging for opportunistic archival in a future session; no action this handoff (would need a defined archive schema first; out of scope for end-of-session work).
- **TODO at 124 lines** -- no ceiling, fine.
- **ARCHITECTURE at 160 lines** -- schema only requires "concise"; not flagging.
- Style soft-warns: pre-existing MD041/MD022/MD033/MD034 on TODO/DECISIONS/LESSONS were not introduced this session.
- ASCII operator legend respected in all this-session writes.

Audit result: clean (LESSONS-over-150 flagged but archival deferred until LESSONS schema defines Archive behavior).

## Hot Files

- `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md` (NEW, ~830 lines) -- the v2 plan for next session's Sonnet 4.6 execution. Read first.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/project_pitch_restructure_plan.md` (NEW) -- one-pager pointer + pre-flight status + cost estimate. Auto-loads via memory.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/project_carman_family_profile.md` -- family-tree corrections live here; do not regress.
- `~/APPS/RAINBOW-PITCH/src/slides/*.jsx` (Cover/Today/Cost/Ripple/Alternatives/Proposal/Phase2) -- the 7 current slides the plan modifies.
- `~/APPS/RAINBOW-PITCH/api/` (does NOT exist yet) -- where the chatbot serverless function will land.
- `docs/research/pitchDeck-StrategicPrompt.md`, `pitchDeckStrategy.md`, `reactPitchDeckGemini.md` -- JR's source docs that informed the plan. Untracked; commit candidates.
- `pdf-print-preview-2026-04-26.png` -- screenshot capture from prod smoke for JR's iPad logo-gap visual comparison.
- `CONTEXT/LESSONS.md` -- 2 new [PROJECT] lessons at bottom; family-tree entry corrected.

## Anti-Patterns (Don't Retry)

- Do NOT raise ESA in any new pitch-deck artifact, question, or audit finding. JR closed it three separate times this session. The plan has the ONE allowed mention on Today.jsx Safety net; that is the entire deck-wide budget. (LESSONS new entry.)
- Do NOT default to defending the current pitch-deck design when JR provides external research. Steel-man the research first; if I disagree, the disagreement must cite the research's content, not status-quo bias. (LESSONS new entry.)
- Do NOT include the $1,500 Counterpoint wage-leak claim or any "predicted savings" math in the deck or chatbot system prompt. JR explicitly excluded this; it would violate the no-fabrications rule.
- Do NOT push pitch deck changes that violate the OTR brand-color immutables (no emerald/teal palette).
- Do NOT print the internal pricing flexibility (waive monthly during trial / waive implementation for higher trial monthly) on any customer-facing artifact.
- Do NOT spawn Opus 4.7 for plan execution unless JR overrides; JR confirmed Sonnet 4.6 for cost + cross-model fresh-read reasons.
- Do NOT push to RAINBOW-PITCH main without JR explicitly approving; the plan ends at a JR review gate (Phase F3).
- Do NOT trust an `Agent(...)` rejection as proof the subagent stopped. (s018 lesson, still active.) Check `~/.claude/projects/<slug>/<uuid>/subagents/` immediately.

## Blocked

- iPad print preview side-by-side -- JR compares prior PDF export vs new at HEAD `1d26daf` to confirm ~20-27px logo-to-table gap reduction (Playwright validated structure, can't measure visual delta) -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke (employees: Alex/Anasstasia/Dan/Eli/Emily/Gary/Gellert/Matt/Nancy/Natalie/Nicole/Nona/Owen/Rafeena/Rebecca/Sabrina/Sadie/Sarvi/Scott/Terry/Test Manager/TEST-ADMIN1-SMOKE -- 22 total) -- since 2026-04-26
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25 (carried)
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke; require live mutation -- since 2026-04-25
- JR to delete `Employees_backup_20260424_1343` tab if satisfied -- since 2026-04-24 (optional)
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14. Flagged in `docs/research/scaling-migration-options-2026-04-26.md` as cheapest defer path for the year 2-3 cliff.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy interview (increment, direction, whether ADP T&A is in use). Pre-requisite for the Counterpoint->ADP bridge Phase 2 track. Since 2026-04-26.

## Key Context

- Pitch deck restructure is the immediate next-session task. Plan + pre-flight ready; JR confirmed Sonnet 4.6 executor. Cost estimate: $2-5 for the whole run.
- Family tree was wrong in old memory (had Dan as owner, Joel as Dan's brother). Corrected this session. Joel is owner+father; Amy + Dan are his children + heirs; Scott is ops mgr; Sarvi is JR's girlfriend not family. The plan + system prompt + memory all reflect the correct tree.
- The pitch deck restructure is in a SIBLING repo (`~/APPS/RAINBOW-PITCH/`). This project's `CONTEXT/*` carries the pricing memory and the plan pointer, but the code work happens over there.
- ANTHROPIC_API_KEY is live in Vercel for rainbow-pitch (Production scope). Gemini fallback intentionally not configured. Single-provider setup.
- Today's date: 2026-04-26.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active item is the RAINBOW-PITCH restructure plan pointer; smoke entries promoted to "Last validated" earlier in s023.
2. Read `CONTEXT/DECISIONS.md` -- top 5 unchanged from s022 (Sarvi sync-back + Apps Script lag NOT pitch + PKDetailsPanel + Bulk-clear PK + PKEventModal dual-mode).
3. Read `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md` if executing the pitch deck restructure (the plan is the spec; the audit changelog at top calls out the v2 changes).
4. Check git on this repo: `git log --oneline -3` should show `bfd78b1`, `36a9187`, `9d5d342`. `git status` should show 2 modified (LESSONS, TODO) + 5 untracked (2 cursor + 3 docs/research/pitchDeck*) UNTIL the s023 handoff commit lands.
5. Check git on sibling: `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` should show `3ba799a`, `1cc90c0`, `bc321a1`. Working tree should be clean.
6. Reminder JR: 7 carried unverified prod smokes still pending phone-test (the 5 from s022 polish list + 089adaa + 0d3220e); s023 promoted them to "Last validated" via Playwright but iPad-rendering items + mutation-required tests still need JR.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `bfd78b1` smoke-results commit is doc-only (no code). Pitch deck plan is NOT shipped (only drafted). Smoke results from earlier s023 already updated TODO entries -- no new smoke needed.
- (b) External gates: Amy ADP rounding interview (waiting on Sarvi); CF Worker / S62 / consecutive-days / email overhaul / payroll aggregator -- all carried.
- (c) Top active TODO: **RAINBOW-PITCH restructure plan** (top Active item). Plan ready at `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md`; pre-flight clear; JR confirmed Sonnet 4.6 executor; ANTHROPIC_API_KEY in Vercel.

Most natural next move: spawn the Sonnet 4.6 subagent against the plan file. Subagent reads plan in full, executes Phases A -> B -> C -> D -> E -> F sequentially, commits per phase, build-gates between, stops at Phase F3 review gate. JR reviews + pushes to RAINBOW-PITCH main when satisfied.

Alternative: if JR wants any final plan edits before execution, do those first. The plan is structured for clean handoff to the executor; minor tweaks won't disturb structure.

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.
