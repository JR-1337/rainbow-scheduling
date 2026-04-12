# Handoff - RAINBOW Scheduling

Session 30. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting
Execution continues. Phases 1-2 + Phase 3 core are done and pushed. Resume at Phase 3 deferred items first (haptic wire-up, row hover, aria-live handler wiring, broader typography sweep), then Phases 4-10. Plan still at `~/.claude/plans/unified-soaring-gray.md`. Tuesday 2026-04-14 demo is 2 days out.

## State
- Build: PASS (last: local `npm run build` pre-commit)
- Tests: NONE
- Branch: main (pushed, clean)
- Last commit: `ae5fc18` S30: UX overhaul Phases 1-3 core
- Live: https://rainbow-scheduling.vercel.app (Vercel auto-deploys on push)

## This Session
- Phase 1 CSS foundation landed in `src/index.css`
- Phase 2 THEME updates: WCAG contrast calc, desaturated status, color temperature, CSS vars, TYPE scale
- Phase 3 core: utilities (`useFocusTrap`, `haptic`, `AnimatedNumber`, `StaffingBar`, `ScheduleSkeleton`), 12 modals with ARIA + transitions + 44px touch targets, skeleton loader, skip link, aria-live region, ambient-pending on admin header

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `~/.claude/plans/unified-soaring-gray.md` | No | Plan for remaining phases |
| 2 | `src/App.jsx` | Yes | Phase 3 deferred + Phases 6-10 all land here |
| 3 | `src/MobileEmployeeView.jsx` | No | Phase 4: export MobileBottomNav + MobileBottomSheet |
| 4 | `src/MobileAdminView.jsx` | No | Phase 5: export MobileAdminBottomNav |
| 5 | `src/index.css` | Yes | Reference; all Phase 1 classes are defined |

## Key Context
- `TYPE` constant exported from App.jsx — import in mobile views for typography bumps
- `useFocusTrap`, `haptic`, `AnimatedNumber`, `StaffingBar`, `ScheduleSkeleton` all exported from App.jsx already
- `--accent-color` + `--accent-color-40` CSS vars set at module load → consumed by `*:focus-visible` and `.ambient-pending`
- Modal pattern applied: add `modal-backdrop active` to outer div + `role="dialog" aria-modal="true" aria-label="..."`; add `modal-content active` to inner div; close button needs `data-close aria-label="Close dialog"` + 44px min box
- Status colors now desaturated (`#34D399`, `#FBBF24`, `#F87171`) — originally sized for dark bg, but mostly render on white cards. If any look washed out visually, consider reverting status on a case-by-case basis rather than the whole palette
- Phase 3 deferred items to finish next:
  - Haptic on `onClick` of Save, Go Live, Publish button handlers
  - Row hover on `EmployeeRow` (line ~1371) + `EmployeeViewRow` (around line ~4760 pre-edit)
  - aria-live: update `showToast` to also write to `document.getElementById('status-announcer').textContent = message`
  - Typography sweep on `FormInput`, badges, grid cell text (use `TYPE.body`/`TYPE.caption`)
  - Spacing normalization (only obvious inline-style cases: `gap: '3px'`→`'4px'`, `padding: '6px'`→`'8px'`, etc.)
- Phase 6 wiring specifics in the plan file under "Phase 6: App.jsx Mobile Layout Integration" — remove Week1/Week2/Mine header tabs, add `<MobileBottomNav>` at bottom, `pb-16` on main content

## Anti-Patterns (Don't Retry)
- **Light mode with OTR terracotta accent** (since S28) - JR rejected
- **Gradient background blobs** (since S28) - Cards looked pasted on
- **Transparent accent-tinted card backgrounds** (since S28) - Invisible on dark
- **Changing OTR accent colors** (since S29) - IMMUTABLE: Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378
- **"Too many colors" complaints for Rainbow brand** (since S29) - The brand IS multiple colors
- **Muting/desaturating role colors** (since S29) - Role colors stay saturated; only functional status indicators get desaturated
- **Stopping mid-execution to ask direction** (since S30) - Plan was approved, build was green; JR called out the unnecessary pause

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs deploy | JR manual action | Edit Code.gs in Apps Script → Deploy → Manage → Edit active |
| Email upgrade | JR providing sender email | PDF auto-attached via MailApp |

## Verify On Start
- [ ] Build passes (`npm run build`)
- [ ] Plan file exists (`~/.claude/plans/unified-soaring-gray.md`)
- [ ] Live site loads + skeleton shows during data fetch (rainbow sphere now login-only)
- [ ] Tab through a modal → focus ring visible, focus trapped, Escape closes
- [ ] Keyboard-focus any button → accent-colored outline ring appears
