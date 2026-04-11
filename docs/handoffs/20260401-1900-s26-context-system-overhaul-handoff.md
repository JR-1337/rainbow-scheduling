# Handoff - RAINBOW Scheduling

Session 26. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting
Staff user testing is still in progress (Sarvi's team). Resume with whatever task JR brings - the context system overhaul is complete. If JR has testing feedback, work through fixes. Otherwise check `docs/todo.md` Up Next.

## State
- Build: PASS (Vercel auto-deployed on push)
- Tests: NONE
- Branch: main
- Last commit: `1faf334` Context system overhaul: telegraphic style, split persistence files

## This Session
- Full context system overhaul via project-setup-v3: CLAUDE.md condensed 253→40 lines, PLAN.md retired and split into docs/todo.md + docs/decisions.md + docs/lessons.md, Google Sheets schema extracted to docs/schemas/sheets-schema.md
- Established telegraphic writing style for all context files (rule in `~/.claude/rules/context-hygiene.md`, compression step in project-setup-v3)
- All 5 MCPs disabled (Canva, PubMed, Gmail, Google Calendar, Vercel) → re-enable on demand. MCP awareness rule added to global CLAUDE.md.
- Registered RAINBOW in BridgingFiles (ROUTING-MASTER.md, CLAUDE.md Access Matrix, Integration Points)
- Created portable prompt at `~/APPS/BridgingFiles/docs/prompts/compress-context-files.md` for other projects

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `CLAUDE.md` | Yes | Completely rewritten - telegraphic, 40 lines. Verify it captures everything needed. |
| 2 | `docs/todo.md` | Yes | Phase 6 tasks populated from old PLAN.md |
| 3 | `docs/lessons.md` | Yes | 8 production bug patterns extracted from old CLAUDE.md |
| 4 | `.claude/rules/conventions.md` | Yes | Domain conventions (React, data, backend, auth, display) |
| 5 | `docs/schemas/sheets-schema.md` | Yes | Full 5-tab schema - conditional pointer from CLAUDE.md |

## Key Context
- BridgingFiles has unstaged deletions from a prior session: `.claude/rules/` (5 stale protocol duplicates), `docs/prompts/create-project-routing.md`, `docs/prompts/project-setup.md`. These are stale per-project files that should be global only. Not committed this session - handle in a BridgingFiles session.
- `~/.claude/rules/context-hygiene.md` now has "Writing Style for Context Files" section → enforces telegraphic style globally on all persistence file writes.
- `~/APPS/BridgingFiles/docs/prompts/project-setup-v3.md` updated with: writing style philosophy, conventions.md template (without per-project writing style rule), Step 7.5e compression pass, Step 0d context-hygiene.md content check.
- `.claude/settings.json` created (deny rules only). `.claude/settings.local.json` and `.claude/MODULE-CLAUDE-TEMPLATE.md` deleted (stale artifacts).

## Verify On Start
- [ ] Build passes (push triggered Vercel deploy)
- [ ] `CLAUDE.md` reads correctly at 40 lines with all sections intact
- [ ] `docs/lessons.md` has 8 entries covering known production bugs
