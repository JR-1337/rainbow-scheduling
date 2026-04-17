<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.

Rules:
- Filename: YYYY-MM-DD-{short-slug}.md
- Required sections defined in HANDOFF_PROMPT.md.
- Do not duplicate full TODO.md or DECISIONS.md content; reference them.
- Do not restate adapter content. Do not become another adapter layer.
- ASCII operators only.
-->

# Handoff -- 2026-04-17 -- CONTEXT system migration

## Session Greeting

Project memory was just migrated from legacy `docs/*` into `CONTEXT/*` with thin Claude + Cursor adapters. Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, and `CONTEXT/LESSONS.md` before anything else. Then resume from `State` below and the `Next Step Prompt`.

First reply: 1-2 short sentences, a `Pass-forward:` line with only essential carryover, and exactly 1 direct question about how to proceed.

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `ee1e542` == origin/main
- Working tree: dirty (migration not yet committed). 12 tracked changes + 2 untracked dirs (`.cursor/`, `CONTEXT/`).
- Build state: PASS at `0dc60b5` (pre-migration). Migration touched only docs + adapters; source code untouched.
- Apps Script: v2.21.0 live.
- Demo occurred 2026-04-15; outcome not yet captured here.
- Active focus per TODO: post-demo capture, then CF Worker stale-while-revalidate cache.

## This Session

- Migrated `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, `.claude/rules/conventions.md` into `CONTEXT/TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `LESSONS.md` (schema headers + ASCII-only telegraphic style).
- Rewrote `CLAUDE.md` 4.3K -> 114 lines as thin adapter. Created `.cursor/rules/context-system.mdc` (92 lines).
- Relocated S65 handoff; archived `s42-functional-test.md` to `CONTEXT/archive/`; deleted 4 superseded handoffs (s61-s64).
- Updated `.gitignore` to cover `.context-migration/` and `.migration-recovery/`.
- Recovery backup at `.migration-recovery/2026-04-17-0043/` (gitignored). Pre-rewrite `CLAUDE.md` lives in git at `ee1e542`.
- Added DECISIONS entry 2026-04-17 for the migration itself (H confidence).
- Staging workspace `.context-migration/` deleted after verified closeout.
- Audit: clean. Both adapters under 150, no code style or live state in adapters, all canonical files ASCII-only (verified with Python unicodedata), DECISIONS entries all carry H/M/L, LESSONS scoped [PROJECT] with Affirmations: 0.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `CONTEXT/TODO.md` | Active worklist; top item is next step |
| 2 | `CONTEXT/DECISIONS.md` | Read before proposing direction changes |
| 3 | `CONTEXT/ARCHITECTURE.md` | Snapshot of current components + flows |
| 4 | `CLAUDE.md` + `.cursor/rules/context-system.mdc` | Thin adapters; do not edit during routine work |
| 5 | `src/App.jsx` | CF Worker flip point at top (`API_URL`) |
| 6 | `backend/Code.gs` | Review `getAllData` payload shape before designing CF cache key |

## Anti-Patterns (Don't Retry)

- Do not re-create `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, or any file under `docs/handoffs/` / `docs/audits/`. Canonical memory lives in `CONTEXT/*` only.
- Do not thicken `CLAUDE.md` or the Cursor adapter with architecture, file paths, role colors, or deploy commands; those belong in `ARCHITECTURE.md` or `LESSONS.md`.
- Do not reopen the Meetings+PK feature (Stages 1-9 shipped). See DECISIONS 2026-04-14 entries.
- Do not chase "jsPDF font subset" language in any old planning text; the PDF path is HTML + window.open + browser print, not jsPDF.
- Do not use `rm -rf` in this sandbox; it is permission-denied. Delete files individually plus `rmdir` for empty dirs.
- Do not use `git add -A` or `git add .` when committing the migration; add explicit paths.

## Blocked

See `CONTEXT/TODO.md` Blocked section. Summary: CF Worker (JR green-light + Cloudflare hands-on), S62 settings split (JR green-light), consecutive-days warning (Sarvi answers), post-demo Sarvi items (capture), email upgrade (sender email), payroll aggregator path 1 (demo go-ahead + Sarvi discovery).

## Key Context

- Demo was 2026-04-15; now 2026-04-17. No Sarvi-reported items captured in TODO yet; that capture is the top Active task.
- Post-demo Active queue after capture: CF Worker cache -> welcome email on new-employee create -> schedule-change notifications to Sarvi.
- Sibling project `~/APPS/RAINBOW-PITCH/` is outside this adapter's scope. Pitch-related lessons retained in LESSONS.md for any future pitch work.
- Global auto-memory at `~/.claude/projects/-home-.../memory/` is outside `{PROJECT_ROOT}` and was not touched; some entries there may duplicate CONTEXT/LESSONS.md content.

## Verify On Start

- `git status` -- dirty with migration changes; confirm before operating
- `git log --oneline -1` -- should show `ee1e542` until migration is committed
- Confirm `CONTEXT/` has 4 canonical files + `handoffs/` (this file only) + `archive/`
- Confirm `CLAUDE.md` under 150 lines + `.cursor/rules/context-system.mdc` exists
- `npm run build` if any source change is planned
- If next task is CF Worker: re-read `backend/Code.gs` `getAllData` payload before designing cache key

## Next Step Prompt

Commit the migration with explicit paths (no `git add -A`). Suggested message:

```
CONTEXT system migration: docs/* -> CONTEXT/*, thin adapters
```

Then: ask JR whether to capture 2026-04-15 demo outcomes into `CONTEXT/TODO.md`, or jump straight into the CF Worker stale-while-revalidate cache design.
