# Handoff - RAINBOW Scheduling

Session 32. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S31 push + Phase 10 admin-modal extension landed and pushed. Demo is Tuesday 2026-04-14 (~48hrs). Next task: walk the Verify On Start checklist in a browser. JR mentioned the Chrome extension Claude can drive the browser — he may want to run that from this session, OR paste screenshots in and have you eyeball them.

## State

- Build: PASS (commit `2638c36`)
- Tests: NONE
- Branch: main, clean, pushed
- Last commit: `2638c36` S31: Phase 10 ext - admin reject modals use bottom sheet on mobile
- Live: https://rainbow-scheduling.vercel.app (now on S31 + Phase 10 ext)

## This Session

- Pushed S31 (6 commits) -> Vercel rebuilt live URL
- Phase 10 ext: `AdminRequestModal` helper (`src/App.jsx:2843`) renders `MobileBottomSheet` on mobile, centered modal on desktop. 6 reject-flow modals migrated (time-off deny/revoke, offer reject, take-my-shift decline, swap decline, swap reject). Bundle -4.3KB.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes | `AdminRequestModal` at line 2843; 6 modal sites converted |
| 2 | `src/MobileEmployeeView.jsx` | No | `MobileBottomSheet` consumed by helper |
| 3 | `docs/handoffs/s31-*` | No | Prior session's Verify On Start checklist still valid; re-use for browser verify |

## Key Context

- **Browser tool not in this CLI harness**. JR's Chrome-extension Claude is a separate instance. From this session you can't drive a browser directly — either JR runs the checklist himself, pastes screenshots, or runs the checklist from the Chrome extension.
- **`AdminRequestModal` is the new convention**: any future admin approve/deny/confirm flow should use it, not re-roll a `fixed inset-0 modal-backdrop` div. The helper lives at the top of `src/App.jsx` just above `AdminTimeOffPanel`.
- **Helper footer is not separator-bordered**: the old modals at lines 3840/4061 had a footer with a top border and its own bg. Helper places Cancel/Submit inline at the bottom of the body. Visually tighter, no separator line. If JR eyeballs and wants the separator back, add `borderTop` to the button row div.
- **Verify on mobile specifically**: the reject modals previously centered on screen regardless of device. Now on mobile they slide up as bottom sheets. Desktop unchanged. Core verify: open admin view in mobile viewport, deny a time-off request, confirm the bottom sheet appears.

## Anti-Patterns (Don't Retry)

- **"Too many colors" complaints for Rainbow brand** (since S29) — the brand IS multiple colors
- **Stopping mid-execution to ask direction** (since S30) — plan approved + build green = keep going (also in auto-memory)
- **Inline `fixed inset-0 z-[100] modal-backdrop` for admin request modals** (since S32) — use `AdminRequestModal` helper for mobile/desktop responsiveness

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Browser verify | JR or Chrome-extension Claude | This CLI session has no browser tool |
| Code.gs deploy | JR manual action | Edit Code.gs in Apps Script → Deploy → Manage → Edit active |
| Email upgrade | JR providing sender email | PDF auto-attached via MailApp |

## Verify On Start

- [ ] `git status` — should be clean, on main, up to date with origin
- [ ] `npm run build` passes
- [ ] **Mobile admin: deny a time-off request** — bottom sheet slides up from bottom, not centered modal
- [ ] **Mobile admin: reject an offer / swap** — bottom sheet (same pattern)
- [ ] **Desktop admin: same flows** — centered modal appears as before (no regression)
- [ ] All S31 checklist items (see `docs/handoffs/s31-*`) — perf, bottom navs, density toggle, accent rotation, focus trap
