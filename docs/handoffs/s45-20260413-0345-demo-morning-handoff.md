# Handoff - RAINBOW Scheduling App

Session 45. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

Demo is today (2026-04-14). JR needs to rule on 3 rough findings from the overnight functional test — R1/R2/R3 below — and decide which (if any) ship before the 9am demo. Start by presenting the triage table and asking which to fix.

## State

- Build: PASS (last commit `8fe12f1`, 2026-04-13)
- Tests: NONE
- Branch: main (clean, pushed)
- Last commit: `8fe12f1 S44 functional test complete: 46/52 PASS, 3 rough, 0 broken`

## This Session

- Executed full 86-check functional test sweep against live deploy via Playwright MCP
- Wrote complete audit to `docs/audits/s42-functional-test.md` (Groups A–J, summary, works list, cleanup log)
- Cleaned all test state: Demo Test employee removed, May 4–17 draft cleared, Apr 21 request settled-revoked, `.claude/settings.local.json` deleted

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `docs/audits/s42-functional-test.md` | Yes | Full audit results — JR reads this for demo triage |
| 2 | `src/modals/SwapShiftModal.jsx` | No | R1 fix target: add Escape handler |
| 3 | `src/modals/OfferShiftModal.jsx` | No | R1 fix target: add Escape handler |
| 4 | `src/modals/ShiftEditorModal.jsx` | No | R2 fix target: add `aria-label="Remove shift"` to delete button |

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| R1/R2/R3 fixes | JR decision | Rule on each before any edit; all 3 are pre-demo optional |
| B21 EmailModal checkbox verify | Sarvi (manual) | Must open Publish in real browser, deselect all but john@+sarvi@, test-send |
| E42 Mobile Publish | Sarvi (manual) | Same email-safe verify on 390px viewport before demo |

## Key Context

- **R1** (S): Escape does not close SwapShiftModal or OfferShiftModal when opened from Shift Changes picker. Close button works. Affects G53. Fix: find onKeyDown/onKeyUp Escape handler in those modals, ensure it calls onClose. Check modal backdrop or dialog element.
- **R2** (XS): Delete icon in ShiftEditorModal has no `aria-label` or `title`. Fix: `aria-label="Remove shift"` on the button. Confirmed no aria-label in live DOM.
- **R3** (S): Mobile Auto-Fill (Fill Wk1/Wk2) does not block past dates. Desktop fill handler checks past dates before inserting. Mobile bypasses it. Filled Apr 7–11 during E41 test.
- **Sarvi self-submit (C23):** Sarvi has a Pending Days Off request in her own list from test C23. Harmless — she can dismiss; not a cleanup blocker.
- **May 4–17 period:** In GO LIVE state with 0 shifts (not published). This is fine — Sarvi will work that period later.
- **Playwright MCP quirk:** Grid cells not in a11y tree — use `page.mouse.click()` at `getBoundingClientRect()` coords or React fiber `element[__reactProps${suffix}].onClick(...)` for cell interactions.
- **React controlled inputs:** Number spinbutton inputs reject `fill()`. Use `nativeInputValueSetter` + `dispatchEvent` approach to set values.

## Verify On Start

- [ ] `git log --oneline -3` — confirm `8fe12f1` is HEAD
- [ ] Read `docs/audits/s42-functional-test.md` Summary section — confirm 0 BROKEN
- [ ] Ask JR: fix R1 / R2 / R3 before demo, or defer all?
