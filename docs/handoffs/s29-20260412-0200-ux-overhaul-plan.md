# Handoff - RAINBOW Scheduling

Session 29. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting
Execution session. 10-phase UX overhaul ready to go. Plan is at `~/.claude/plans/unified-soaring-gray.md` - read it first, it has every detail: code snippets, line numbers, file locations. Tuesday demo (2026-04-14) is the deadline. Start Phase 1 (CSS foundation in index.css).

## State
- Build: PASS
- Tests: NONE
- Branch: main
- Last commit: `0fda41f` S28: finalize handoff + update lessons.md
- Live: https://rainbow-scheduling.vercel.app

## This Session
- Thorough UI/UX research (NNGroup, Material Design 3, Apple HIG, Laws of UX, Refactoring UI, Baymard, 2025-2026 trends)
- Deep codebase audit mapping every UI pattern, all 13 modals, 35+ icon buttons, font sizes, spacing values
- Identified 9 problems: typography (12px body), color contrast (green accent), touch targets (24px), no mobile bottom nav, no focus rings, no skeleton loading, no modal transitions, accessibility gaps, spacing inconsistency
- 16 improvement proposals created, 12 approved for implementation, 4 deferred
- Full implementation plan: 10 phases, specific line numbers, code snippets, verification steps
- Research files saved to `docs/research/` (4 files)

## Hot Files

| Priority | File | What to do |
|----------|------|-----------|
| 1 | `~/.claude/plans/unified-soaring-gray.md` | READ FIRST - full plan with code snippets |
| 2 | `src/index.css` | Phase 1: CSS foundation (~80 lines added) |
| 3 | `src/App.jsx` | Phases 2-3, 6-9: THEME + sweep + mobile integration |
| 4 | `src/MobileEmployeeView.jsx` | Phase 4: bottom nav + bottom sheet + typography |
| 5 | `src/MobileAdminView.jsx` | Phase 5: bottom nav + bottom sheet + typography |
| 6 | `docs/research/` | Reference: 4 research files for UX decisions |

## Anti-Patterns (Don't Retry)
- **Light mode with OTR terracotta accent** (since S28) - JR rejected
- **Gradient background blobs** (since S28) - Cards looked pasted on
- **Transparent accent-tinted card backgrounds** (since S28) - Invisible on dark
- **Changing OTR accent colors** (since S29) - IMMUTABLE brand colors: Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378. Other colors can change to compensate.
- **"Too many colors" complaints for Rainbow brand** (since S29) - The brand IS multiple colors. Don't apply generic SaaS "5-7 hues max" advice.
- **Muting/desaturating role colors** (since S29) - Role colors are brand colors. Only functional status indicators (success/warning/error) get desaturated.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs deploy | JR manual action | Edit Code.gs in Apps Script -> Deploy -> Manage -> Edit active |
| Email upgrade | JR providing sender email | PDF auto-attached via MailApp |

## Key Context
- `THEME.bg.primary` = dark navy `#0D0E22`. NEVER use for inner UI elements. Use `bg.tertiary` instead.
- `THEME.accent.blue` = rotating accent (not actually blue). Set from `OTR_ACCENT.primary` at module load.
- Accent cycling: localStorage key `otr-accent`, increments 0-4 on each app load.
- Tuesday 2026-04-14 demo: Sarvi presenting to store owner + ops manager.
- Plan file has complete code snippets for every phase. Don't redesign - execute.
- Phase 3 is the biggest (~80 edits in 8800-line file). Work top-to-bottom. Re-read before each edit.
- Research files at `docs/research/` for reference: `ui-ux-first-principles.md`, `dark-mode-guidelines.md`, `scheduling-app-ux.md`, `2025-trends.md`
- Audit report at `docs/research/app-audit-report.md` has the full findings + remaining proposals for JR to review post-implementation.

## Verify On Start
- [ ] Build passes (`npm run build`)
- [ ] Plan file exists and is readable (`~/.claude/plans/unified-soaring-gray.md`)
- [ ] `docs/todo.md` shows UX overhaul in progress
- [ ] `src/index.css` has NOT been modified yet (Phase 1 is first)
