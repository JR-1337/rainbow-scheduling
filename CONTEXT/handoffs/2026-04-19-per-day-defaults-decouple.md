<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-19 -- Per-day defaults decouple + availability widening (plan approved, execute in a new chat)

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, then this file, then **read the approved plan at `~/.claude/plans/per-day-defaults-are-humming-quokka.md` end-to-end before writing any code**. Plan-time line numbers are anchored to `src/App.jsx` at 3027 lines and `backend/Code.gs` at 2338 lines. Run the Verify-On-Start checks below before editing.

This session: shipped the 5-fix mobile parity plan, then a second round of PK-flow cleanup -- collapsed the PK dropdown into a single Schedule PK button, added a Saturday quick-pick inside the modal, fixed the silent "Select eligible" button with an (N) count, and fixed the mobile date/time mash. JR then scoped a structural decouple of default booked hours from availability. That plan is approved; it goes in a fresh chat.

First reply: short sentence + 1 direct question. Default next step = open the plan file, run Verify-On-Start, then start with Step 1 per the plan.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `4fdb4da` == origin/main (handoff commit will follow)
- Working tree: handoff ceremony writes only
- Prod: LIVE; bundle hash `index-D0HRNA-4.js` matches HEAD build. PK redesign + mobile fixes all deployed and confirmed via Playwright this session.
- Apps Script: v2.23.0 LIVE. The approved plan bumps to v2.24.0 and is JR-manual to deploy.
- Build: `npm run build` PASS at HEAD (~466.55 kB).
- `src/App.jsx`: 3027 lines.
- `backend/Code.gs`: 2338 lines.
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) still parked.
- Prior plan `~/.claude/plans/crispy-inventing-octopus.md` (mobile parity) -- all 5 fixes shipped and documented in DECISIONS would be excess; it lives in TODO Completed.
- **NEW**: `~/.claude/plans/per-day-defaults-are-humming-quokka.md` -- the plan to execute next session. Already approved.

## This Session

1. **Boot**: prior-handoff Verify-On-Start green. JR approved the 5-fix mobile parity plan.
2. **Fixes 1-5 shipped** (commits `13eac1b`, `eac7221`, `58be6fe`, `b2ce3e3`, `5ee7e74`):
   - Fix 1: auto-populate confirm `<Modal>` extracted to a shared const rendered from both mobile and desktop branch returns (previously desktop-only; mobile Clear/Fill/PK-confirms never mounted).
   - Fix 2: `clearWeekShifts` now also deletes matching keys from `events` so PKs/meetings clear alongside shifts.
   - Fix 3: `handleAutofillPKWeek` error toast names the resolved time window (e.g. "No eligible staff for PK (18:00-20:00, 10:00-10:45)...").
   - Fix 4: `MobileAdminView` cell event badges stack vertically up to 2 and aggregate to "N events" at 3+.
   - Fix 5: new `src/components/MobileScheduleActionSheet.jsx` -- two-level AdaptiveModal bottom-sheet, root = Auto-Fill / Clear / PK -> per-employee picker. Replaced the three tight mobile buttons with a single Actions button.
3. **CONTEXT syncs** (`f1ef5db`): TODO.md Completed entry; LESSONS.md new entry "Render shared overlays at App root, not inside branch returns"; ARCHITECTURE.md list updated with MobileScheduleActionSheet.
4. **Desktop regression smoke + prod smoke via Playwright** as JR admin. Mobile Fix 1 validated (confirm modal mounts), Fix 3 validated (toast text names time window), Fix 2 validated (18 PKs scheduled desktop-side then Clear Week via mobile sheet wiped all full-timer PKs; Anasstasia retained hers correctly as part-timer). Fix 4 stack path untested in prod -- only 1 PK persisted per (emp, day) so the 2+ cell case didn't materialize. Logic intact; JR to eyeball if/when it happens organically.
5. **Test employee created** for future smokes: `testguy@testing.com` / `test007`. Creds saved to memory.
6. **JR reported follow-up bugs on PK flow**: "dropdown to schedule a pk doesn't do anything on the schedule"; "autofill all eligible does nothing"; "select eligible does nothing"; "date and time picker mashed on mobile". JR asked to redesign PK: single Schedule PK entry; remove dropdown + autofill-week; fold into the popup; add a Saturday quick-pick button.
7. **PK redesign shipped** (`1b78bd2`):
   - Desktop: `App.jsx` PK `<select>` removed at old L2683-2698, replaced with a single `<button>` "📚 Schedule PK" that calls `setPkModalOpen(true)`.
   - Mobile: `MobileScheduleActionSheet.jsx` PK level-2 eliminated; root "PK Week N" row now calls `fire(onOpenPKModal)` directly.
   - `handleAutofillPKWeek` function + its dispatch + the `autofill-pk-week` branches in the shared confirmModal all deleted.
   - `PKEventModal` accepts new `activeWeek`, `week1`, `week2` props. A "📅 Saturday (MM-DD) · 10:00-10:45" quick-pick button renders under the date/time row, sets Date + snaps times.
   - Both `<PKEventModal>` call sites in App.jsx (mobile branch + desktop return) now pass the new props.
8. **Stray Playwright YAMLs cleanup** (`9cce775`) -- five scratch snapshot YAMLs accidentally committed in step 7, removed in a follow-up.
9. **PK modal polish** (`4fdb4da`):
   - Select eligible: button now reads "Select eligible (N)" and disables with a tooltip when N=0. Root cause of "does nothing": on weekdays the default 18:00-20:00 window matches zero OTR availabilities, so the function had no rows to tick. Feedback fix only; logic unchanged.
   - Mobile date/time row: switched `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` so the 6 controls don't pile on top of each other at ~500px.
10. **Plan written + approved**: `~/.claude/plans/per-day-defaults-are-humming-quokka.md`. JR locked four answers via AskUserQuestion:
    - Widening scope: Sat start ->10:00; Mon-Fri end ->20:00; Sunday untouched; only `available === true` days.
    - PK block rules: none added. Post-widening, `availabilityCoversWindow` naturally blocks the right people. Manual override checkbox stays.
    - `defaultShift` shape: `{start, end}` per day. Absence = fall back to availability.
    - Deploy order: bundle with feature flag (frontend tolerates missing column).
11. **Decanting check**:
    - Working assumption: "select eligible is broken." Wrong. It does exactly what it's specified to do -- tick every `eligible: true` candidate -- but when the current time window fits zero OTR availability windows, there's nothing to tick. Caught by tracing the function body, not by reproducing the UI. Now surfaced via the (N) count.
    - Working assumption: "scheduling a PK doesn't land in the grid." Wrong, disproven by Playwright: 18 PKs rendered on Monday cells at 1400x900. JR's perception came from the silent-click + the weekday default window producing no visible result on the first click.
    - Working assumption: "availability and booked hours are the same concept because Auto-Fill reads availability." That's the surface behavior, not the user's model. JR carries three distinct concepts (store hours, availability, default booked hours). The plan encodes this separation.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `~/.claude/plans/per-day-defaults-are-humming-quokka.md` | The approved plan. Load-bearing facts, step order, anti-patterns, verify-on-execute checklist. Read end-to-end BEFORE editing. |
| 2 | `backend/Code.gs` | 2338 lines. Step 2 touches: version header (top), Employees tab headers (~L2201), `saveEmployee` (~L1630-1660), `bulkCreatePKEvent` (~L1831-1917; DO NOT add validation), plus a new editor-only `widenAvailabilityForPK_()`. |
| 3 | `src/App.jsx` | 3027 lines. Step 3 touches the employee-parse block (~L336-343) and `saveEmployee` (~L1050 area). Step 4 touches `createShiftFromAvailability` (~L862-883). |
| 4 | `src/modals/EmployeeFormModal.jsx` | Step 5. Current availability UI at L191-217. Default Shift section goes below. `updateTime` helper at L40 is the mirror target. |
| 5 | `docs/schemas/sheets-schema.md` | Step 1. New column N after M; renumber `defaultSection`. |
| 6 | `CONTEXT/TODO.md` | Top Active: add "Per-day defaults decouple + availability widening -- next: execute approved plan" entry. |

## Anti-Patterns (Don't Retry)

- **Do NOT trust plan-time line numbers blindly.** Captured at `src/App.jsx` 3027 and `backend/Code.gs` 2338. If `wc -l` returns anything different, re-read the file region before applying any edit. The plan's "Verify-on-Execute" section is explicit about this.
- **Do NOT add backend validation** that defaultShift fits availability. JR wants UI hints, not backend rejects. `saveEmployee` stays permissive. `bulkCreatePKEvent` stays as-is (permissive by design).
- **Do NOT widen Sunday.** JR's answer was "Sat + M-F." Sunday explicitly untouched in the widening script.
- **Do NOT turn `available === false` days on.** Widening only touches already-available days.
- **Do NOT register `widenAvailabilityForPK_()` in `handleRequest()`.** Editor-only, same pattern as `backfillPasswordHashes` and `purgeTestEmployees`. Delete it in a follow-up commit after JR runs it.
- **Do NOT delete or rename the `availability` column.** PK eligibility still reads it. Only *add* `defaultShift`.
- **Do NOT batch the six steps into one commit.** Ship-merge-verify per step, per project convention. Each commit gets its own build PASS.
- **Do NOT smoke desktop-only.** Fix 5's new employee form section must render at 502x384 (Playwright) and on JR's phone.
- **Do NOT trust `npm run build` PASS as runtime-safe.** Vite treats undefined idents as global lookups; saved as `lesson_vite_silent_undefined.md`.
- **Do NOT roll back recent cuts on assumption when a deploy goes white.** First move = devtools console. Saved as `feedback_check_console_before_revert.md`.
- **Do NOT force-push to main.**
- **Do NOT rename `availability` keys from lowercase-fullname (`monday`, `tuesday`, ...) to anything else.** Day-key shape is load-bearing across the code.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- JR+Sarvi smoke scheduled
- Bug 4 (PK 10am-10am for some people) -- waiting on JR repro (employee, day, where). May become moot after widening.
- Bug 5 (top-nav PK saves but UI doesn't show) -- waiting on JR repro (which week active, hard-refresh test). May become moot after widening.
- Sarvi discovery for per-day `defaultShift` values -- JR will ask when she wakes; that unblocks populating real defaults in the form.
- Payroll aggregator path 1 -- waiting on Sarvi Counterpoint / ADP discovery.
- Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) -- own dedicated branch.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light "Friday".
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on.
- Consecutive-days 6+ warning -- waiting on Sarvi answers.
- Backup-cash role -- waiting on Sarvi confirmation.

## Key Context

- The plan is the source of truth for next session. Don't re-research; the Explore + AskUserQuestion work already happened. Open the plan, run Verify-On-Execute, ship Step 1, smoke, commit, push, repeat.
- JR's three-concept model is locked in: Store hours vs Employee availability vs Default booked hours. The fuckup JR is trying to avoid: widening availability for PK eligibility also widens what Auto-Fill produces, because today they're the same field. The plan decouples them.
- Widening script is a one-shot. JR runs from Apps Script editor post-v2.24.0-deploy; output via `Logger.log`. Follow-up commit deletes the function per hygiene.
- Apps Script v2.23 LIVE. v2.24.0 is JR-manual to paste + redeploy. Frontend feature-flags around it so nothing blocks on deploy order.
- Global rules from prior sessions still in force.
- Current test employee for Playwright smokes: `testguy@testing.com` / `test007`. JR admin: `johnrichmond007@gmail.com` / `admin1` (saved to memory).

## Verify On Start

- `git status` -- expect clean (handoff write may be in flight).
- `git log --oneline -10` -- top should be the new handoff commit, then `4fdb4da`, `9cce775`, `1b78bd2`, `f1ef5db`, `5ee7e74`, `b2ce3e3`, `58be6fe`, `eac7221`, `13eac1b`.
- `git rev-list --left-right --count origin/main...HEAD` -- expect `0 0`.
- `npm run build` -- should PASS (~466.55 kB).
- `wc -l src/App.jsx` -- expect **3027** lines (load-bearing for plan's App.jsx line numbers).
- `wc -l backend/Code.gs` -- expect **2338** lines (load-bearing for plan's Code.gs line numbers).
- `grep -n "availability" backend/Code.gs | head -20` -- re-confirm column index + `saveEmployee` pattern before touching.
- `ls docs/schemas/sheets-schema.md` -- must exist.
- `ls ~/.claude/plans/per-day-defaults-are-humming-quokka.md` -- the plan must exist.
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect bundle hash matching local HEAD build.
- Ask JR: ready to execute the approved plan? Any new observations since this session? Did Sarvi share per-day default booked hours yet?

## Next Step Prompt

**Plan execution mode.** The plan at `~/.claude/plans/per-day-defaults-are-humming-quokka.md` was written and approved at the end of last session. Read it end-to-end before writing any code. Run the Verify-on-Execute checklist in the plan. Then ship in step order:

1. **Step 1** -- `docs/schemas/sheets-schema.md`: add column N `defaultShift` after M, bump `defaultSection` index. Commit + push.
2. **Step 2** -- `backend/Code.gs`: version bump to v2.24.0; Employees headers append; `saveEmployee` pass-through; editor-only `widenAvailabilityForPK_()`. Commit + push. JR pastes + redeploys Apps Script.
3. **Step 3** -- `src/App.jsx` parse + save payload. Build + commit + push.
4. **Step 4** -- `src/App.jsx` `createShiftFromAvailability` reads `defaultShift` first, falls back to availability. Build + Playwright smoke Auto-Fill at 1400x900 + 502x800 + commit + push.
5. **Step 5** -- `src/modals/EmployeeFormModal.jsx`: new Default Shift section under Availability; state + helpers + save wiring. Build + Playwright smoke form round-trip + commit + push.
6. **Step 6** -- JR runs `widenAvailabilityForPK_()` from Apps Script editor. Verify via Drive MCP read of Employees sheet. Follow-up commit deletes the function per hygiene (mirror of `purgeTestEmployees` removal pattern).
7. **Step 7** -- full verification per plan Step 7: build PASS, browser round-trip on both viewports, Drive MCP confirms widened availability for at least Sarvi + Sadie.

After all steps ship: update `CONTEXT/TODO.md` Completed entry; `CONTEXT/DECISIONS.md` gets an entry for the decouple (rationale: three-concept model, PK eligibility vs Auto-Fill hours separation, feature-flag deploy); `CONTEXT/ARCHITECTURE.md` gets `defaultShift` column under Employees schema.

If JR opens a new topic instead, follow him.
