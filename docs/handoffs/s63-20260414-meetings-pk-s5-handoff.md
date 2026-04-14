# Handoff - RAINBOW Scheduling App

Session 63. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S63 shipped Meetings+PK Stages 4 (browser verify) and 5 (bulk PK modal + autofill toolbar refactor). All 4 commits pushed to main; Vercel auto-deployed. No active task queued. Next session: confirm with JR whether to continue the Meetings+PK feature into Stage 6 (offer/swap guards — small, frontend-only) OR Stage 7 (PDF + email — bigger, touches generate.js + build.js) OR Stage 8 (mobile My Shifts union-hours + consecutive-days banner), OR switch tracks entirely to the deferred 2-tab settings split / retroactive-default bug from S62, OR pick up any new Sarvi-reported item. Open with: "S63 Stage 5 shipped + verified live. Want to keep going on Meetings+PK (Stages 6/7/8 remain) or tackle something else?"

## State

- Build: PASS at `b0371c1`. Vercel auto-deployed.
- Apps Script: v2.21.0 live (unchanged from S61). `bulkCreatePKEvent` handler is what the new modal hits.
- Branch: main (clean, pushed)
- Tests: none
- Last commit: `b0371c1` — "S62 Stage 5: restore time-window eligibility check for PK attendees"

## This Session

- **Stage 4 verify** via Playwright using Alex Kim (temp reactivated, re-inactivated after): tabbed editor + same-day Work+MTG+PK stacking + union hours (full-overlap 0 extra, 1h partial overlap = 1h extra) + backend round-trip clean.
- **Stage 5 ship** — 4 commits: `2283387` (modal+toolbar refactor), `43f295d` (full-row click target), `4d5bcc2` then `b0371c1` (eligibility-check waffle-and-restore — see Anti-Patterns).
- Browser-verified full round-trip live: PK 6-8p scheduled for Alex Fowler on 2026-12-09, landed as "PK 6p-8p"/2.0h, cleanly deleted after.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/modals/PKEventModal.jsx` | NEW | Whole modal. Stage 6/7/8 will pull attendee data / union-hours / mobile render from adjacent code paths. |
| 2 | `src/App.jsx` | Yes | `pkModalOpen` state, `handleBulkPK` handler, autofill toolbar refactor at L3428-3507, modal mount x2 (desktop L3790, mobile L3167). Touch here for any bulk-modal prop tweaks. |
| 3 | `src/utils/timemath.js` | Yes | `availabilityCoversWindow` lives here. Any Stage 6 offer/swap guard that needs the same semantics should reuse this helper, not duplicate. |
| 4 | `src/modals/OfferShiftModal.jsx` / `src/modals/SwapShiftModal.jsx` | No | Stage 6 scope — filter `myFutureShifts` to work-only via `getWorkShift(shifts, ...)`, surface backend `INVALID_SHIFT_TYPE` as toast. |
| 5 | `src/pdf/generate.js` / `src/email/build.js` | No | Stage 7 scope — `calcWeekHours` → `{workHours, totalHours}` using `computeDayUnionHours`, add event bullets. |
| 6 | `src/MobileEmployeeView.jsx` MobileMySchedule | No | Stage 8 scope — work-only shift count per week, union-hours period footer. |
| 7 | `src/modals/ShiftEditorModal.jsx` | Yes | `getDefaultEventTimes(type)` now type-aware (PK → 18:00-20:00). Stage 8 adds the consecutive-days info banner on work-tab save. |
| 8 | `src/MobileAdminView.jsx` | Yes | `MobileAdminDrawer` has new `onOpenPK` prop. Any future mobile-admin bulk actions should mirror the pattern. |

## Anti-Patterns (Don't Retry)

- **Treating a prior handoff's "Key Context" note as a binding rule** (since S63) — the S62 handoff said the `availability` field was "default autofill work times, not personal availability." Used that to revert my time-window check mid-session (commit `4d5bcc2`). JR overruled: "whatever i said recently goes over whatever claude says. im the truth. that might have been a convention from a misunderstanding because sarvi told me the wrong thing." Had to re-revert (`b0371c1`). Rule: when live observation conflicts with a stale handoff note, ASK JR before changing behavior. See `feedback_handoff_notes_not_binding.md` in auto-memory.
- **Editing `STORE_HOURS` constant alone to "fix" full-timer autofill times** (since S62) — constant only drives autofill when `avail.start`/`avail.end` is blank; full-timers with explicit availability ignore it.
- **Bundling Sarvi's "store hours wrong" + "autofill wrong" as one concept** (since S62) — separate settings, conflated in code; Friday's 2-tab split is the right answer.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Stage 6/7/8 | JR green-light | ~4-8hr each depending on scope. Spec fully in todo.md + plan file `~/.claude/plans/tranquil-booping-porcupine.md`. |
| 2-tab settings split + retroactive-default fix | JR green-light ("on Friday") | ~4-day scope from S62 backlog. |
| Sarvi-notify-on-other-admin-edits | Scope-to-define discussion with JR | Backlog entry in todo.md "Schedule-change notifications (S61, new)". |

## Key Context

- **`availability.<day>.start/end` ARE real availability times** (free/busy), not default work times. JR clarified S63 after the waffle. Any future feature that reads availability should assume this.
- **Autofill toolbar refactored** — if a future change needs to restore the standalone "Auto-Fill All FT" or "Clear All FT" buttons, they're gone from the DOM; the behavior lives in the dropdown top-option (`__all__` sentinel value). See `src/App.jsx:3428-3507`.
- **PK backend writes** return `{ created: [empId...], skipped: [{id, reason}...], date }`. Duplicates skipped with `reason: 'already_has_pk'`; inactive with `reason: 'not_active'`. Frontend surfaces `PK scheduled for N (M skipped)` toast.
- **PKEventModal overrides reset on date/start/end change** — intentional, so re-selecting a date restores the default attendee computation. A mid-edit admin loses their custom checkboxes when they fiddle with date/time; if that's painful, the useEffect at `src/modals/PKEventModal.jsx:25` is the lever.

## Verify On Start

- [ ] `git log --oneline -5` shows `b0371c1` at HEAD
- [ ] `npm run build` passes
- [ ] If next task continues Meetings+PK: re-read plan file `~/.claude/plans/tranquil-booping-porcupine.md` Stages 6-9, decision entries for split-maps + offer-block + union-hours + 5-day-streak.
- [ ] If next task touches PKEventModal: availability semantics = real free/busy. Do NOT revert to "day-flag-only" eligibility.
