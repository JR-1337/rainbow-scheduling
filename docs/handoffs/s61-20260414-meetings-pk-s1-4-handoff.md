# Handoff - RAINBOW Scheduling App

Session 61. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S61 shipped Meetings + PK stages 1-4 of `~/.claude/plans/tranquil-booping-porcupine.md` — backend v2.21.0 live, split-maps state, tabbed editor, event pills in all 4 grids. Two adversarial audits caught three criticals that were fixed before commit. Feature is **code-in-good-shape but unverified in a browser**. Next tasks are either (a) Sarvi-reported issue from a messages photo JR is about to share — JR said he's having trouble articulating it and will paste the screenshot, (b) eyes-on verification of the Meetings+PK feature in the live app, (c) continue the plan (Stage 5 PK bulk modal). Open with: "S61 stages 1-4 shipped. Want me to look at Sarvi's messages screenshot first, verify the meetings feature in the browser, or keep rolling on Stage 5 (PK bulk modal)?"

## State

- Build: PASS, HEAD `0530998`, pushed. Auto-deployed to https://rainbow-scheduling.vercel.app
- Apps Script: v2.21.0 live (S36 Auth Rebuild version 29, deployed 2026-04-14 by JR). Shifts sheet headers `type` (J) + `note` (K) added.
- Branch: main (pushed)
- Tests: none in repo; verification is Playwright + manual

## This Session

- **Apps Script v2.20.1 verification carried from S58 → resolved.** Manage Deployments shows version 28 @ 2026-04-13 was already current.
- **Planned + shipped S61 stages 1-4 of Meetings+PK feature** (plan at `~/.claude/plans/tranquil-booping-porcupine.md`). Split-maps data model, tabbed editor, event pills rendering. Architectural pivot mid-Stage-2 from nested-array → split-maps based on 25+ call sites found on grep.
- **Two red-team audits** surfaced + fixed three criticals (allShiftKeys 3-tuple mismatch, firstEventType null-deref, missing `hours` in event payload). `getCellEntries`/`getWorkShift`/`getEventShifts` exports removed as dead code.
- **Backlog adds:** PDF Sarvi-only contact + emoji rendering fix (logged from JR), Sarvi-notifies-on-other-admin-edits feature (logged from JR).

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `backend/Code.gs` v2.21.0 | Yes | Schema + offer/swap guards + bulkCreatePKEvent. Still needs `SHEET_NOT_MIGRATED` guard REDEPLOY (not urgent — live Sheet is migrated) |
| 2 | `src/App.jsx` | Yes | `events`/`publishedEvents` state, partition loop, `saveShift` routing, batch collectors include events, `getEmpHours` union-aware |
| 3 | `src/modals/ShiftEditorModal.jsx` | Yes | Rewritten tabbed (Work/Meeting/PK), per-tab drafts, `+` chips for absent types |
| 4 | `src/utils/timemath.js` | New | `mergeIntervals`, `computeDayUnionHours`, `computeConsecutiveWorkDayStreak` |
| 5 | `src/views/EmployeeView.jsx` + `src/MobileEmployeeView.jsx` + `src/MobileAdminView.jsx` | Yes | Event pill rendering in all 4 grid cells; `events`/`publishedEvents` threaded through props |
| 6 | `src/constants.js` + `src/theme.js` | Yes | `EVENT_TYPES` + `THEME.event` neutral palette |
| 7 | `docs/schemas/sheets-schema.md` | Yes | Shifts tab now 11 cols A-K (type + note) |

## Anti-Patterns (Don't Retry)

- **Nested-array shift state (`shifts[key] = [entries]`)** (since S61) — pivoted to split-maps after grep surfaced 25+ call sites treating `shifts[key]` as scalar work shift. Nested would require migrating every site AND add `.find(s => s.type === 'work')` overhead to hot-path renders. Split-maps (parallel `events[key]` map) keeps existing sites untouched and matches the mental model (schedule vs overlay).
- **Writing event data to backend without `hours`** (since S61) — `batchSaveShifts` payload must include `hours: calculateHours(...)` on event entries. Frontend can recompute via `computeDayUnionHours`, but Sheet column stays blank otherwise, breaking future payroll exports / audits. Already in lessons.md.
- **Backend key-format change without grepping frontend** (since S61) — the 3-tuple switch (`${empId}-${date}-${type}`) would have catastrophically wiped existing work shifts on period save if `allShiftKeys` on the frontend hadn't been updated too. Adversarial redpill caught it. Already in lessons.md.
- **Unguarded `EVENT_TYPES[ev.type]` at render sites** (since S61) — filter malformed rows at ingress (`.filter(ev => EVENT_TYPES[ev.type])`) so a typo'd Sheet cell can't crash 4 different grid components. Already in lessons.md.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Browser verification of Meetings+PK | JR click-through | Create a meeting via tabbed editor, hit SAVE, reload, confirm pill renders on admin grid + employee view |
| Apps Script redeploy (SHEET_NOT_MIGRATED guard) | JR paste + redeploy | Non-urgent — live Sheet IS migrated. Guard only matters if bulkCreatePKEvent is ever called against an unmigrated sheet |
| Stage 5: PK bulk modal | Stage 4 verified first | Meeting tab in editor works; PK bulk "Schedule for everyone" button is next |
| Sarvi-reported issue | JR photo upload | JR said screenshot incoming; transcribe + identify the reported issue before diagnosing |

## Key Context

- **Split-maps contract:** `shifts[key]` = single work-shift object (unchanged shape, zero regression risk on existing 25+ sites). `events[key]` = array of meeting/pk entries (may be empty/undefined). `publishedShifts`/`publishedEvents` are LIVE-gated copies for employee view. Helpers were removed as dead code; direct `shifts[key]` / `events[key] || []` is the pattern.
- **Backend key is 3-tuple `${empId}-${date}-${type}`** — frontend `allShiftKeys` must match. Change one side without the other and period saves wipe all survivors.
- **Union-hours fallback** — `computeDayUnionHours` falls back to stored `hours` when times are unparseable. Keeps fast-path (no events → sum hours) and slow-path (events → union) in agreement on stale rows.
- **Event visibility** — admin views `events` directly; employee views see `publishedEvents` (LIVE-period gated same as `publishedShifts`). Creating a PK event outside a LIVE period → hidden from employees until that period goes live.
- **Offer/swap guard lives in backend** (Stage 6 frontend filter not yet shipped). Employee trying to offer a meeting via modal currently succeeds client-side, then sees `INVALID_SHIFT_TYPE` toast on backend rejection. Not dangerous, just slightly clumsy UX until Stage 6.
- **Tabbed editor entry points** — Admin clicks a schedule cell; modal opens with Work tab focused if work exists, else Meeting tab, else PK tab. `+` chips add a tab for types not present. Each tab has its own draft state; save emits single-entry with explicit `type`.
- **JR's multitrack tendencies** — JR asked to add Sarvi-notify-on-other-admin-edits mid-session (logged to todo Up Next), and mentioned PDF bugs (Sarvi-only contact + emoji rendering) also logged. Don't try to bundle these into current Meetings+PK work.

## Verify On Start

- [ ] `git log --oneline -3` shows `0530998` at HEAD
- [ ] `npm run build` passes
- [ ] If JR wants browser verification: log in as Sarvi admin → click a cell on a future date → Modal shows Work tab focused. Click `+ Meeting` → note field appears. Save. Cell now shows work card with MTG pill bottom-right. Hover/tap shows "Meeting HH:MM-HH:MM — [note]".
- [ ] Click SAVE on the period → verify Shifts sheet has two rows for that `empId-date` pair (one type='work', one type='meeting', distinct rows).
- [ ] Reload → meeting still renders. Log in as an employee in the same period (if LIVE) → employee sees the meeting pill too.
- [ ] Read `docs/decisions.md` entries 2026-04-14 S61 (split-maps, offer/swap guard, union hours, 5-day streak skip) before any Meetings+PK changes.
- [ ] Read `docs/lessons.md` entries 71-74 (the 4 S61 lessons) before touching shift state, batch save, or render-site enum lookups.
