# s016 -- 2026-04-25 -- /coding-plan global skill shipped

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md`, then resume from `State` and `Next Step Prompt` below. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `85a31f9` clean, branch main up to date with origin. No new commits this session (work was in `~/.claude/skills/`).
- Active focus: global `/coding-plan` skill shipped at `~/.claude/skills/coding-plan/SKILL.md` (273 lines, 13.3K). Plan record at `~/.claude/plans/zippy-greeting-bentley.md`. JR can hand-edit at the real path. First real invocation pending in next chat. Wave 1+2 perf prod phone-smoke from s015 still pending.
- Sibling repo: `~/APPS/RAINBOW-PITCH` -- no changes this session.

## This Session

One thread, plus three resolution beats.

**Thread 1 -- /coding-plan skill creation**

JR triaged from s015's three options and picked planning-skill build. Read `~/.claude/skill-drafts/coding-plan-skill-spec.md` (drafted by Opus 4.7 on 2026-04-25 as a hand-off from the s011-s015 admin1-title work). Walked through 7 open spec questions one at a time per JR's "go slow" ask:

| Q | Decision |
|---|---|
| Q1 | Skill name `/coding-plan`, global at `~/.claude/skills/coding-plan/SKILL.md` |
| Q2 | UI/UX research auto-triggers from file-path heuristics; 2 targeted AskUserQuestion rounds (design concern + research lanes); WebSearch/WebFetch with current-year queries |
| Q3 | Phase 7 Playwright smoke auto-spawns with 60s abort window; Sonnet 4.6 model; triple watchdog |
| Q4 | MOOT (skills only run inside active session) |
| Q5 | Predecessor scan with composite scoring (project + IDF-weighted file overlap + recency decay + keyword + chain) |
| Q6 | Per-phase token actuals as plain log lines, no thresholds |
| Q7 | Memory write SKIP; append only to current project's CONTEXT/TODO.md Completed |

**Thread 2 -- Verbiage research before drafting**

Per JR's ask "do research to this end before proposing edits," spawned two agents in parallel: claude-code-guide (Anthropic skill mechanics) and general-purpose with WebSearch (long-context attention literature). Both returned ~500-word syntheses. Key findings folded into draft:

- Trigger decision is pure LLM reasoning over `description` + `when_to_use` (no embedding retrieval); 1,536-char shared cap.
- Opus 4.5+ now over-triggers on ALL CAPS / "DO NOT" -- dial back, reserve for 2-3 truly load-bearing.
- Adherence collapses past ~5-7 active rules per section (RECAST arXiv:2505.19030).
- Primacy + recency both architecturally guaranteed (arXiv:2603.10123) -- restate critical rules at top AND bottom.
- Anthropic guidance: instructions at BOTTOM of long context, not top.
- LLMLingua-strippable filler: "please", "as you know", hedges, transitional connectives.
- XML tags carry attention weight when names are semantically meaningful (`<executor_brief>`, not `<x>`).
- Skills load full body only AFTER trigger; before trigger only frontmatter visible.

**Thread 3 -- Three review issues resolved before final draft**

1. **Watchdog (Tradeoff #4):** Wall-clock-only misses token spirals. Resolved with triple defense: kill on ANY of 15-min wall clock OR 5-min step-progress stall OR hard tool-call cap (50 smoke / 100 execute). Subagent brief mandates `[step N/M started]` heartbeats so parent's Monitor can detect liveness.

2. **Cost model (Q from JR):** "I thought running the subagent in sonnet would cost less tokens" -- gave honest numbers (Opus 4.7 = 5x Sonnet 4.6, current run cost ~$1.50-2.50 with 80% in Opus planning). JR confirmed keeping Opus-plans / Sonnet-executes per his existing LESSONS entry from 2026-04-23. Bumped Affirmations 0 -> 1 on that entry.

3. **Iteration cleanup (Tradeoff #6):** Resolved with new Phase 9 (Iteration Archive). Skill records every plan file path it wrote during a run; at end, moves all but the final approved plan to `~/.claude/plans/archive/<YYYY-MM-DD>-<slug>/`. Iterations visible during run, directory clean after. Matches global "Complete the Operation" rule.

**Thread 4 -- Plan-mode workflow correction mid-session**

Initially staged the SKILL.md draft content INSIDE the plan file `~/.claude/plans/zippy-greeting-bentley.md` as a workaround for plan-mode's "edit only the plan file" constraint. JR called it: "whats going on here? its written two places? write the plan in the plan mode normal way." Reset to normal flow: rewrote plan file as a normal high-level plan describing what SKILL.md would contain; ExitPlanMode for approval; then Write the actual SKILL.md to its real path. Lesson logged as new [GLOBAL] entry in LESSONS.md.

**Writes to canonical memory this session**

- `LESSONS.md`: bumped existing "Opus 4.7 plans, Sonnet 4.6 executes" Affirmations 0 -> 1 (JR reaffirmed today). Added 3 new [GLOBAL] entries: (1) plan file holds the plan, not the artifact; (2) long-context instruction files need top + bottom anchors with rule-cap at 5-7 per section; (3) subagent watchdog needs triple defense not wall-clock alone.
- `TODO.md`: no change. Skill creation is global, not RAINBOW work; doesn't fit Completed pattern.
- `DECISIONS.md`: no change. No durable RAINBOW direction.
- `ARCHITECTURE.md`: no change. Skill is global, not part of RAINBOW structure.

Decanting: clean (working assumption -> Anti-Patterns; near-miss -> Anti-Patterns; naive next move -> Anti-Patterns).

Audit: skipped (no adapter or pre-Step-2 CONTEXT writes).

## Hot Files

- `~/.claude/skills/coding-plan/SKILL.md` -- the new global skill, 273 lines, 13.3K. JR will hand-edit here.
- `~/.claude/plans/zippy-greeting-bentley.md` -- the plan record (kept per traceability convention; not yet archived because no iterations, but will demonstrate the new Phase 9 archive pattern next time the skill runs).
- `~/.claude/skill-drafts/coding-plan-skill-spec.md` -- the original spec draft; can be deleted now that the skill ships, or kept as design history.
- `CONTEXT/LESSONS.md` -- 4 changes this session (1 bump + 3 new entries near bottom).
- `~/context-system/HANDOFF.md` -- followed today; no changes.

## Anti-Patterns (Don't Retry)

- Do NOT stage artifact content inside a plan file as a workaround for plan-mode edit constraints. The plan file is for the plan; artifacts go to their real path post-ExitPlanMode. JR called this out today.
- Do NOT propose wall-clock-only watchdogs for autonomous subagents. Triple defense (wall + step-progress + tool-call cap) is the floor; wall-clock alone misses fast loops.
- Do NOT auto-invoke `/coding-plan` in this same session to test it. Recursion + plan-mode-in-plan-mode is undefined behavior. Test in next chat.
- Do NOT write LESSONS.md for skill internals (RAINBOW LESSONS already has the framework rules; skill-specific patterns belong in the skill body itself). The 3 new [GLOBAL] entries this session are deliberately principle-level, not skill-implementation-level.
- Do NOT spawn a Sonnet executor to implement the skill. Restated from s012/s013/s014/s015 -- still binding. Skill draft was Opus 4.7 + one Write call.
- Do NOT delete `TEST-ADMIN1-SMOKE` programmatically. JR's manual job. Restated from s012/s013/s014/s015.

## Blocked

- JR to phone-smoke perf wave 1 + wave 2 on prod (`feb094b`, `3cf6b09`, `1d0ccb1`) after Vercel redeploy -- since 2026-04-25 (carried from s015)
- JR to manually delete `TEST-ADMIN1-SMOKE` employee from Employees sheet -- since 2026-04-25 (carried from s015)
- First real `/coding-plan` invocation in a future session to validate the 9-phase flow against a live RAINBOW task -- since 2026-04-25
- JR to triage perf wave 3 (MED EmployeeFormModal) if motivation arises -- since 2026-04-25 (carried from s015)
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12

## Key Context

- The new skill auto-loads in any project (global `~/.claude/skills/`). It will appear in available-skills as `coding-plan` with the description + when_to_use concatenated. JR can invoke via `/coding-plan <task>` or by describing a non-trivial task in natural language (auto-trigger from description heuristics).
- The skill's first real invocation is the validation step. If it fails to fire from natural language alone, the description field needs tweaking -- easy edit at `~/.claude/skills/coding-plan/SKILL.md`.
- Verbiage research findings are durable [GLOBAL] lessons, not skill-specific. Apply them when authoring any long instruction file (CLAUDE.md adapters, future skills, system prompts in other tools).
- The plan template embedded in SKILL.md (Phase 5 section) is frozen at the version derived from `pure-rolling-fiddle.md` + `linked-weaving-crab.md`. If those validated plans evolve, revisit the skill body.
- Today's date: 2026-04-25.

## Verify On Start

1. Read `CONTEXT/TODO.md` (no changes from s015), `CONTEXT/DECISIONS.md` (no changes), `CONTEXT/LESSONS.md` (4 changes -- 1 bump + 3 new [GLOBAL] entries near bottom).
2. Check git: `git log --oneline -5` should show `85a31f9`, `e258207`, `1d0ccb1`, `562209e`, `7940284`. `git status` should be clean.
3. Confirm `/coding-plan` is registered: open a fresh chat or check the available-skills list for `coding-plan` (description starts "Orchestrates a multi-phase coding workflow...").
4. If JR wants to dogfood the skill: pick a real RAINBOW task from TODO.md Active and invoke `/coding-plan <task description>`. Watch for the 9-phase flow.
5. If JR confirms prod phone-smoke PASS for perf wave 1+2: move "Missing validation: prod phone-smoke of ScheduleCell memo + PDF lazy + ColumnHeaderCell" entry from Verification to Last-validated.
6. Reminder JR if not yet done: delete `TEST-ADMIN1-SMOKE` from Employees sheet.

## Next Step Prompt

Default per HANDOFF check order: (a) shipped-but-unverified work needs validation. The new `/coding-plan` skill ships unvalidated (first real invocation pending). Perf wave 1+2 prod phone-smoke also pending. Both qualify; JR's choice on order.

Three natural next moves:

- (a) **Dogfood `/coding-plan` on a real task** -- pick a small Active item from TODO.md (e.g. "JR to delete `Employees_backup_20260424_1343` tab" doesn't qualify since it's manual, but something like a small UI tweak or bug fix would). Invoke `/coding-plan <task>`. Validate the 9-phase flow end-to-end. On any phase that misbehaves, surgical Edit on `~/.claude/skills/coding-plan/SKILL.md`.
- (b) **Confirm prod phone-smoke of perf wave 1 + wave 2** (carried from s015) -- one combined check. JR taps a cell on phone, taps a column header in Edit Mode, taps Export PDF from More drawer. On PASS: update TODO Verification, close the loop.
- (c) **Perf wave 3 -- MED EmployeeFormModal** (only unclosed audit finding worth surface) -- defer unless Sarvi reports modal slowness. If yes: read `docs/perf-audit-app-jsx-2026-04-25.md` MED 3 + verify cited file:line BEFORE scoping. Could be the first `/coding-plan` invocation if JR wants to test the skill on real work.

Pass-forward: /coding-plan global skill shipped to ~/.claude/skills/coding-plan/SKILL.md; next session can dogfood it on a real RAINBOW task or wait for perf-prod smoke.
