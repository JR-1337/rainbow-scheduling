# s022 -- 2026-04-26 -- Polish list closed + scaling research + rules update

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: 5-item polish list fully shipped (3 of 3 today: bulk-clear PK / PDF logo gap / PK details panel). 4 commits stacked unverified on prod. Future-proofing scaling research deferred on JR motivation; CF Worker SWR cache flagged as cheapest defer.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `9d5d342` clean, 0 ahead / 0 behind origin/main. Two untracked `.cursor/rules/{blast-radius,ui-ux-design}.mdc` left alone (Cursor-specific, JR confirmed).
- Active focus: 5-item polish list fully closed across s021 + s022. TODO Active now mostly JR-action / smoke-pending / speculative. No obvious code task left in queue.
- Sibling repo `~/APPS/RAINBOW-PITCH/` -- no changes this session.

## This Session

**Four threads.**

**Thread 1 -- Polish items 3-5 of 5 (3 separate commits, no bundling)**

JR's 5-item polish list closed today. s021 shipped items 1+2 (cell density + PK edit mode). This session shipped items 3-5:

- `63420ce` feat(pk): bulk-clear PK by day from outside the modal. New helper `daysWithPKInWeek(weekDates)` (App.jsx ~L621, useCallback for prop identity). New helper `clearPKForDate(dateStr)` (App.jsx ~L788, mutates events + setUnsaved, mirrors `clearWeekShifts`). Desktop Clear `<select>` gains "PK by day" optgroup (App.jsx ~L2325) listing dates with PK count, scoped to active week. Mobile `MobileScheduleActionSheet` gains same per-day rows. New `clear-pk-day` branch in `handleAutoPopulateConfirm` + `AutoPopulateConfirmModal` copy variant.
- `1d26daf` fix(pdf): tighten OTR header-to-schedule vertical gap. `src/pdf/generate.js`: header div margin-bottom 25->12 + padding-bottom 15->8; inner Josefin margin-bottom 5->3; Staff Schedule p margin-top 8->4; announcement wrapper margin 15->8. Saves ~20-27px between RAINBOW wordmark and first table row. Registry `CONTEXT/pdf-print-layout.md` gained one bullet under "tried."
- `0fe138c` feat(pk): surface PK details near announcements panel. New shared `<PKDetailsPanel>` at `src/components/PKDetailsPanel.jsx` aggregates PK events into unique `{date, startTime, endTime}` slots. Returns null when no PK in period (non-invasive). Mounted at 4 sites (desktop admin grid, mobile admin comms, desktop employee grid, mobile employee alerts sheet); all 4 scoped to full pay period (`dates`, not `currentDates`) to match announcement scope.

Subagent strategy: parallel Sonnet executors for items 1+2 (disjoint files), sequential for item 3 (App.jsx overlap). Build PASS at every step. Bundle delta vs `78f02d7`: modern +4.39 kB raw / +1.24 kB gzip; legacy +4.25 / +1.13. Smoke SKIPPED per JR direction ("skip smoke test fix the things"). Subagent on item 3 flagged scope mismatch (Site A period vs Site C week scope) -- caught by main session, normalized to period scope across all 4 sites. Affirmed the new global doublecheck-flag rule.

**Thread 2 -- Scaling/migration research doc**

JR picked "future-proofing/scaling research" from TODO Active after polish list closed. Spawned 2 parallel research subagents: codebase audit (Explore, very thorough) + DB option survey (general-purpose with WebFetch). Synthesized into `docs/research/scaling-migration-options-2026-04-26.md` (commit `9e0b292`). Net findings:

- Apps Script 7-8s call floor is dominant user-perceived latency, not DB capacity. Replacing Sheets without leaving Apps Script does NOT fix the cliff.
- CF Worker SWR cache (already in TODO Blocked) is cheapest defer path (1-2 days dev, ~$5/mo, 1-2 years buy). Recommended consideration for status-quo path.
- Supabase `ca-central-1` is only managed Postgres option with built-in auth + native RLS + Canadian data residency in one move.
- Vercel Postgres is DEAD (Dec 2024, migrated to Neon Marketplace). Logged as a project LESSONS external-vendor fact.
- Doc framed by decision-axes (cost / security / defer / edge), no single recommendation. Establishes new project lesson (decision-axes for vendor research).

**Thread 3 -- Rules update bundle (`9d5d342`)**

JR ratified 3 rules from session reflection + asked for project conflict audit:

- `[PROJECT]` decision-axes framing (vendor / option research outputs decision axes, not recommendations) -- LESSONS L307. Affirmations: 1.
- `[PROJECT]` Vercel Postgres deprecated -- LESSONS L114. Affirmations: 0.
- `[GLOBAL]` Research subagent contract (facts only, flag marketing-vs-technical) -- LESSONS bottom. Affirmations: 1.
- `[GLOBAL]` Every Agent prompt ends with "flag anything to double-check" -- LESSONS bottom. Affirmations: 1.
- New global rules file `~/.claude/rules/subagent-delegation.md` covering both [GLOBAL] rules for Claude Code globally.
- DECISIONS gained 2 top entries: Sarvi direct-edit must survive any Sheets migration (sync layer OR admin UI; pre-design constraint); Apps Script 7-8s floor is internal motivation only, NOT pitch material.
- Graduated 2 oldest active DECISIONS (Perf-fix wave 2 + Type-aware shift dedupe key) to `decisions-archive.md` to stay under 150-line ceiling. Active DECISIONS now 139 lines.

Conflict audit: clean. The existing "different axes" lesson at LESSONS L320 is pitch-detractor framing -- different domain, complementary not conflicting. No removals.

**Thread 4 -- Context-system future work captured**

Saved drafted prompt at `~/.claude/scratch/context-system-todo-schema-prompt-2026-04-26.md` for future TODO schema enhancement (BUILD/DECIDE/VERIFY/OPS/PARKED categorization). JR will bring to context-system project. JR also stated preferred design pattern for future cross-harness rules: a single global rules file all harnesses read from -- not implemented this session, captured as design direction.

**Decanting:**
- Working assumptions: Apps Script 7-8s floor is internal-only (NOT pitch material) -- decanted to DECISIONS top entry. Sarvi direct-edit-or-sync must survive any migration -- decanted to DECISIONS top entry. Decision-axes framing for vendor research -- decanted to LESSONS.
- Near-misses: schema-modding `~/.context-system/CONTEXT/LESSONS.md` to allow `Source: human-declared` for direct-written global rules. JR rejected this path. Captured in Anti-Patterns.
- Naive next move: bundling polish items 3-5 into one commit -- contradicts don't-bundle rule. Running `/coding-plan` ceremony for doc-only rules update -- the skill description itself says skip for doc-only. Captured in Anti-Patterns.

**Audit (Step 3):** adapter files NOT touched this session. CONTEXT/* writes happened multiple times pre-Step-2 (TODO updates after each polish item, DECISIONS + LESSONS this final batch). Audit ran. Result: clean. DECISIONS at 139 (under 150 ceiling). All adapters untouched (CLAUDE.md, KIMI.md, .cursor/rules/* sizes unchanged from s021). Pre-existing markdown lint warnings (MD041/MD032/MD022/MD034) on TODO/DECISIONS/LESSONS were not introduced this session.

## Hot Files

- `src/components/PKDetailsPanel.jsx` (new at `0fe138c`) -- shared PK aggregator + render component, mounted on 4 paths.
- `src/App.jsx` -- bulk-clear PK helpers `daysWithPKInWeek` (~L621) + `clearPKForDate` (~L788) + Clear `<select>` "PK by day" optgroup (~L2325) + 4 PKDetailsPanel mount sites (~L1888 mobile-admin, ~L2376 desktop-admin) + new prop wired to MobileScheduleActionSheet.
- `src/pdf/generate.js` -- header tightening (lines 89, 300, 301, 305).
- `src/components/MobileScheduleActionSheet.jsx` -- gained `daysWithPKInWeek` prop + per-day PK clear rows in clear sheet.
- `src/modals/AutoPopulateConfirmModal.jsx` -- new `clear-pk-day` copy variant.
- `docs/research/scaling-migration-options-2026-04-26.md` (new) -- 5-option DB comparison + Apps Script lever framing + decision-axes-by-motivation. Read before any migration scoping.
- `~/.claude/rules/subagent-delegation.md` (new) -- 2 [GLOBAL] subagent rules for Claude Code globally.
- `~/.claude/scratch/context-system-todo-schema-prompt-2026-04-26.md` (drafted) -- ready for context-system project work.
- `CONTEXT/DECISIONS.md` -- top 2 entries (Sarvi sync-back + Apps Script lag NOT pitch) shape any future migration discussion.
- `CONTEXT/archive/decisions-archive.md` -- 2 entries graduated this session.

## Anti-Patterns (Don't Retry)

- Do NOT bundle multiple polish items into one commit. Each surface ships separately. JR's repeated rule.
- Do NOT update `~/.context-system/CONTEXT/LESSONS.md` schema to allow `Source: human-declared` for direct-written global rules. JR rejected this path 2026-04-26. Right answer per JR is "unified global rules file all harnesses read from" (not implemented; design direction only).
- Do NOT add global rules directly to `~/.context-system/CONTEXT/LESSONS.md`. The schema says graduated-from-project only (2+ cross-project affirmations). Direct write conflicts with schema.
- Do NOT run `/coding-plan` ceremony for doc-only changes. The skill description itself says skip for doc-only.
- Do NOT include the Apps Script 7-8s call floor number in pitch / customer-facing copy / family-demo material. It is internal migration motivation, not pitch fact. (DECISIONS 2026-04-26 top entry.)
- Do NOT scope migration design without preserving Sarvi's direct-edit workflow. Sync layer OR admin UI is mandatory; loss of the Sheets escape hatch is a hard adoption blocker. (DECISIONS 2026-04-26 top entry.)
- Do NOT mark `63420ce` / `1d26daf` / `0fe138c` verified until JR phone-smokes prod. Smoke was skipped per JR direction this session; localhost smokes also skipped.
- Do NOT trust an `Agent(...)` rejection error as proof the subagent stopped. (s018 lesson, still active.) Check `~/.claude/projects/<slug>/<uuid>/subagents/` immediately.

## Blocked

- JR to phone-smoke `63420ce` (bulk-clear PK from outside) on prod -- since 2026-04-26
- JR to phone-smoke `1d26daf` (PDF logo gap) on prod -- since 2026-04-26
- JR to phone-smoke `0fe138c` (PK details panel) on prod -- since 2026-04-26
- JR to phone-smoke `5f5f16f` (cell density) on prod -- since 2026-04-26 (carried)
- JR to phone-smoke `78f02d7` (PK edit mode + Saturday toggle) on prod -- since 2026-04-26 (carried)
- JR to phone-smoke `089adaa` (N meetings), `0d3220e` (sick wipe + PDF popup + title + legend), perf wave 1+2 + ColumnHeaderCell -- since 2026-04-25 (carried)
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25
- JR to delete `Employees_backup_20260424_1343` tab if satisfied -- since 2026-04-24 (optional)
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14. Now flagged in `docs/research/scaling-migration-options-2026-04-26.md` as cheapest defer path for the year 2-3 cliff (~1-2 days dev, ~$5/mo, buys 1-2 years).
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12

## Key Context

- 5-item polish list fully closed across s021 (items 1-2: cell density + PK edit mode) + s022 (items 3-5: bulk-clear PK / PDF logo gap / PK details panel). JR's original list is done.
- Future-proofing/scaling research is RESEARCH-ONLY (no recommendation). Decision waits on JR motivation; CF Worker defer path is the cheapest pre-migration play. Doc establishes the project precedent for decision-axes-framed vendor research.
- 2 new [GLOBAL] subagent delegation rules came out of this session (research-subagent-contract + agent-prompt-doublecheck-flag). Both at Affirmations: 1 -- next cross-project affirmation graduates them to `~/.context-system/CONTEXT/LESSONS.md` per the standard graduation flow.
- Cross-harness coverage limitation: `~/.claude/rules/subagent-delegation.md` only auto-loads in Claude Code. The same rules are mirrored as `[GLOBAL]` entries in this project's `CONTEXT/LESSONS.md` so Cursor + Kimi see them when working in THIS project. JR's stated preferred long-term design (recorded as suggestion, not implemented): a unified global rules file all harnesses point to.
- Today's date: 2026-04-26.
- Bundle baseline at session end: modern 488.13 kB / gzip 123.25 kB; legacy 508.75 kB / gzip 124.83 kB (post-`0fe138c`).

## Verify On Start

1. Read `CONTEXT/TODO.md` (3 polish items shipped + 4 missing-validation lines added today; future-proofing audit closed with research doc pointer; remaining Active items mostly JR-action / smoke-pending / speculative).
2. Read `CONTEXT/DECISIONS.md` (top 5: Sarvi sync-back + Apps Script lag NOT pitch + PKDetailsPanel + Bulk-clear PK + PKEventModal dual-mode). Active file at 139 lines (under 150 ceiling).
3. Check git: `git log --oneline -8` should show `9d5d342`, `9e0b292`, `6197443`, `0fe138c`, `1d26daf`, `63420ce`, `577ee4d`, `78f02d7`. `git status` clean except `.cursor/rules/{blast-radius,ui-ux-design}.mdc` untracked.
4. Check prod liveness: `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[a-zA-Z0-9_]+\.js'` -- expect a hash newer than `index-BlCxQkoG.js` (last seen at s022 start) after Vercel redeploys 4 commits since.
5. Reminder JR: 7 unverified prod smokes pending (3 from this session + 4 carried).

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 3 commits this session (`63420ce`, `1d26daf`, `0fe138c`); 1 doc-only commit (`9e0b292`) needs no smoke; 1 chore-context (`9d5d342`) needs no smoke. JR-only phone-smoke action; cannot be automated.
- (b) External gates: payroll aggregator (Sarvi), email overhaul (JR Gmail), CF Worker (JR green-light, now strongly flagged in research doc), consecutive-days warning (Sarvi), S62 settings split (JR green-light) -- all carried.
- (c) Top active TODO: Desktop name column on Vercel (JR-only smoke). Bug 4 PK 10am-10am (needs JR repro). Adversarial Phase E (JR said wait for motivation). Future-proofing audit (closed with research doc, awaits JR motivation pick).

Most natural next move: JR phone-smokes the 3 polish commits, picks a path on the migration research (CF Worker defer / Supabase upgrade / status quo / wait on demo), and either (1) shipping CF Worker SWR cache as the cheapest defer or (2) queueing post-demo migration scoping. Genuinely no obvious code task otherwise unless JR adds a new polish item or motivation surfaces for a parked item.

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.
