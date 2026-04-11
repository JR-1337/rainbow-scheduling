# Handoff - RAINBOW Scheduling

Session 27. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting
JR mentioned "new news" at session end. Ask what's new and proceed from there. If no specific task, check `docs/todo.md` Up Next. Staff user testing is still in progress (Sarvi's team).

## State
- Build: PASS (Vercel auto-deployed)
- Tests: NONE
- Branch: main
- Last commit: `a6a21be` Commit session 26 leftovers: Pattern B handoff, schema template, remove old handoff.md

## This Session
- Full project-setup-v3 re-audit: all checklist items PASS, no remediation needed
- Committed session 26 leftovers (deleted old `handoff.md`, added `docs/handoffs/`, `docs/schemas/.gitkeep`, `docs/schemas/TEMPLATE-schema.md`)

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | No | Main app file for any feature work |
| 2 | `backend/Code.gs` | No | Backend for any API changes |
| 3 | `docs/todo.md` | No | Phase 6 tasks - check for next work item |

## Key Context
- `Photos/` directory exists untracked (2 binary files ~1.2MB each: `code.gs.docx`, `favicon.svg`). Not committed - consider adding to `.gitignore` or removing.
- Instruction budget per formula: ~178 instructions vs ~100 slots available. Functioning fine with 0 MCPs. If adherence degrades, `~/.claude/rules/handoffs.md` (107 lines) is the first condensation candidate.
- `docs/lessons.md` entries are from session 26 - not yet at 3-session graduation threshold.

## Verify On Start
- [ ] Build passes (Vercel auto-deploy on push)
- [ ] `docs/todo.md` reflects current task state
