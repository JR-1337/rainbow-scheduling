# s033 -- 2026-04-28 -- Unpaid-break logic + net-hours display + employee-hours lockdown

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: unpaid-break math + net hours shipped (s033 0b8f1b4); JR's next ask is the hour-color rework (drop the amber "approaching 40" warning -- 40 is normal, only over should alarm).

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `0b8f1b4` on `main`; clean against upstream after handoff push.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched.
- Active focus end-of-session: **hour-color rework** (drop the 35h amber warning; new ladder safe < 40, "at-cap" exactly 40, amber over, red further over). JR raised after smoke PASS. Top of TODO Active.
- Two backend changes still queued in `backend/Code.gs` waiting on a single manual Apps Script redeploy (`sendBrandedScheduleEmail` + duplicate-email mirror check). No new backend changes this session.

**Working assumption:** `ScheduleCell` renders ONLY inside `EmployeeRow` (admin desktop path). EmployeeView, MobileEmployeeView, and MobileAdminView all use their own cell components. The "4 render paths" assumption from the s033 plan was wrong; the actual gating surface is just `EmployeeRow` -> `ScheduleCell`. Verified during Phase 6 execution by the executor agent.

## This Session

**Commits shipped (1):** `0b8f1b4` -- `feat(hours): unpaid breaks subtracted from admin-facing totals + employee-hours lockdown`. 9 files, +119/-44 lines.

**Coding-plan workflow** (`/coding-plan` skill, plan at `~/.claude/plans/sleepy-floating-peach.md`):

- Phase 1 investigate: `Explore` subagent mapped 25 hits across 9 files (3 helpers, 4 admin totals, 4 employee surfaces, 2 thresholds).
- Phase 5 plan: 5 phases A-E; Opus 4.7 author, Sonnet 4.6 executor + smoker.
- Phase 6 execute (Sonnet 4.6 via `coding-plan-executor`): all 5 phases PASS with 1 deliberate deviation (see below). Build PASS at every gate.
- Phase 7 smoke (Sonnet 4.6 via `coding-plan-smoker` + Playwright): live verification of 4h/5h/6h/8h break math, sick toggle, PERIOD net total, EmployeeRow weekly net, mobile admin view at 390x844. Console clean, 0 errors. Screenshots saved at project root (`step1-admin-desktop.png` ... `step9-pdf-export.png`).

**Break rule shipped (auto by shift length, all unpaid)** -- encoded in `src/utils/timemath.js` as `BREAK_RULES`:

- 0:00 - 4:00 -> 0 min
- 4:01 - 5:00 -> 20 min
- 5:01 - 6:00 -> 30 min
- 6:01+ -> 45 min

**Display surface (admin-only):**

- ShiftEditorModal footer TODAY: `{gross}h - {break}m = {net}h` inline, AnimatedNumber on the net value. Always shows the math, even when break == 0.
- ShiftEditorModal footer PERIOD: NET total only via AnimatedNumber. Color thresholds unchanged (44 red / 40 amber).
- Desktop EmployeeRow weekly total: NET via upgraded `getEmpHours` in App.jsx. Thresholds unchanged (40 red / 35 amber). [JR flagged thresholds for follow-up; see top of TODO Active.]
- MobileAdminView weekHours: rides `getEmpHours`, no separate edit needed.

**Visibility lockdown (employees never see hours):**

- `src/views/EmployeeView.jsx`: top-right `myTotalHours` removed from header. Helpers stubbed to `() => 0` (executor deviation: plan called for full deletion; harmless since nothing renders the values to employees).
- `src/views/MobileEmployeeView.jsx`: w1 + w2 + period totals deleted; helpers gone.
- `src/email/build.js` + `src/email/buildBrandedHtml.js`: `Total Hours: X.Xh` line + per-shift `Xh` token both removed from schedule emails.
- `src/components/ScheduleCell.jsx`: per-day `Xh` badge gated behind new `isAdmin` prop (default false); threaded from `EmployeeRow` via `App.jsx` passing `isAdmin={!!currentUser?.isAdmin}`.

**JR raised post-ship (captured in TODO Active):**

- **Hour-color rework.** Drop "approaching 40" amber. Staff routinely sit at/near 40 by design. New ladder: safe < 40, "at-cap" exactly 40 (visually distinct, not alarming), amber when over, red further over. Same logic for per-employee `maxHours` part-time caps. Pick concrete colors that work against dark theme + don't collide with the 5 immutable OTR accents.
- **Persistent violation flag on day-click.** Sarvi reported autofill bypassed the consecutive-days advisory. Idea: when admin clicks a scheduled day and the employee is in any ESA-style violation (consecutive 6+, weekly OT, part-time cap), surface a sticky flag in ShiftEditorModal that persists until resolved. Audit `createShiftFromAvailability` -- does it skip `computeConsecutiveWorkDayStreak`?

**Memory writes:**

- `TODO.md`: prepended hour-color rework + persistent violation flag entries to Active. Collapsed the (now-shipped) unpaid-break entry. Added Completed line for `0b8f1b4`.
- `DECISIONS.md`: untouched. Break rule numbers are implementation, not durable direction.
- `ARCHITECTURE.md`: untouched. Working assumption (ScheduleCell single-path) captured in handoff State; not yet durable.
- `LESSONS.md`: untouched. No new corrections this session; existing parity-rule reaffirmed by the smoker's check.

**Decanting:**

- Working assumption: `ScheduleCell` renders only via `EmployeeRow` (admin desktop). Captured in `State`. Not promoted -- might change with future render-path consolidation.
- Near-miss: plan assumed 4 ScheduleCell render paths; actual is 1. Executor caught it. Captured in Anti-Patterns.
- Naive next move: after net-hours ships, naive is to jump straight to color rework. But the persistent-violation-flag idea is intertwined (color is a visual flag of a violation). Worth scoping both together rather than shipping color first then rebuilding the threshold logic for the flag. Captured in Anti-Patterns.

**Audit (Step 3):**

- TODO.md was written before Step 2 sync (during coding-plan Phase 8). Audit must run.
- Schema-level: clean. TODO has Active + Blocked + Verification + Completed.
- LESSONS: 588 lines, RISK over 200 ceiling carried (multi-session graduation effort).
- DECISIONS: 153 lines, under ceiling.
- TODO: ~95 lines, under ceiling.
- ARCHITECTURE: 160 lines, under ceiling.
- Style soft-warns: pre-existing MD034/MD041 noise; none introduced this session.
- Adapter files: untouched.

`Audit: clean (LESSONS 588/200 ceiling carried; pre-existing style soft-warns persist)`.

## Hot Files

- `src/utils/timemath.js` -- `BREAK_RULES` constant + `computeBreakMinutes(grossHours)` + `computeNetHoursForShift(shift)` + upgraded `computeDayUnionHours` (subtracts break per work entry from end of window before union merge). All pure. Sick-zero + fallback-hours paths preserved. If color rework needs the threshold values in code, this is the right neighbor module for an `OVERTIME_THRESHOLDS` constant.
- `src/modals/ShiftEditorModal.jsx:128-134, 604-615` -- footer TODAY/PERIOD math + render. PERIOD threshold ternary at line ~612 (`projectedTotal >= 44 ? error : projectedTotal >= 40 ? warning : cyan`).
- `src/components/EmployeeRow.jsx:45` -- desktop grid weekly total threshold ternary (`hours >= 40 ? error : hours >= 35 ? warning : cyan`). NOTE: this is the file JR's color rework will most touch.
- `src/components/uiKit.jsx:9, 28-29` -- `AnimatedNumber` has its own `overtimeThreshold = 44` default that drives a golden glow, separate from the color ternary. Worth folding into the new threshold constant.
- `src/components/ScheduleCell.jsx` -- `isAdmin` prop gates the per-day `Xh` badge; default false.
- `src/App.jsx:659-675` -- `getEmpHours` callback now uses `computeNetHoursForShift(work)` for the bare-shift fast path; `computeDayUnionHours` slow-path returns net automatically.
- `src/views/EmployeeView.jsx:284-285` -- `getEmpHours` + `getEmpHoursWeek2` stubbed `() => 0`. Plan called for full deletion. Cosmetic deviation; safe.
- `src/utils/timemath.js:83-101` -- `computeConsecutiveWorkDayStreak`. Audit autofill path against this for the persistent-violation-flag work.
- `src/utils/scheduleOps.js:173` -- `createShiftFromAvailability` (autofill path). Check whether it consults consecutive-days streak.
- `backend/Code.gs` -- TWO changes still staged for next Apps Script redeploy: `sendBrandedScheduleEmail` action + `saveEmployee` duplicate-email mirror check. Manual deploy gate. No s033 backend additions.

## Anti-Patterns (Don't Retry)

- Don't assume `ScheduleCell` renders in 4 paths. It renders only via `EmployeeRow` on the admin desktop. EmployeeView/MobileEmployeeView/MobileAdminView each have their own cell components. If a future plan mentions threading a prop through "all 4 ScheduleCell render sites", check the actual call graph first -- the parity rule still applies but the surface is smaller than memory suggests.
- Don't ship color rework before scoping the persistent-violation-flag together. The two are intertwined (color is the visual surface of a violation flag); shipping colors first means rebuilding the threshold logic when the flag work lands. Scope both, decide whether to bundle or sequence, then commit.
- Don't restore "approaching 40" amber. JR explicit: at-or-near-40 is normal operations. Only over-40 warrants alarm.
- Don't bring back PDF per-cell `Nh` line or weekly total in name cell (s032 anti-pattern, still active).
- Don't change the existing 44/40 thresholds in ShiftEditorModal during the color rework without confirming with JR -- the modal sits at PERIOD (full pay period, not weekly), so the threshold semantics differ from EmployeeRow's weekly total.
- Don't auto-pace formatting helpers through individual callsites. Edit the helper module, propagate by import.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028+s029+s030+s031+s032+s033 commits with deferred phone-smoke -- carried.
- Employee-view hours-lockdown live verification -- testguy is inactive in Sheet; verified by code inspection only. Reactivate test account or have Sarvi confirm in person.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14 (touches the s033 persistent-violation-flag idea)
- Payroll aggregator path 1 -- since 2026-04-12 (the deferred backend payroll roll-up endpoint feeds this)
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- **Apps Script redeploy gate** -- TWO backend changes (EmailModal `sendBrandedScheduleEmail` + duplicate-email `saveEmployee` mirror check) still dormant since s032.

## Key Context

- Break math is "taken from end of window" in the union-merge path. Edge case: 9-5 work + 3-5 meeting unions as 9-5 net = 8h instead of strict 7.25h. Documented tradeoff in plan; revisit if Sarvi sees an anomaly.
- Color rework is a UX/density question on the dark theme. The 5 OTR brand accents are immutable; pick safe + at-cap colors that don't collide.
- ESA 44hr is on the immutable list (CLAUDE.md). The 35h amber in EmployeeRow is NOT ESA-mandated; it's an ad-hoc "approaching" warning JR now wants gone.
- Smoke verified the math at 4h/5h/6h/8h ShiftEditorModal cases. Did not verify combined work + meeting same-day net (the union-merge edge case). Worth a manual Sarvi walk-through if she sees suspicious numbers.
- The deferred backend payroll roll-up endpoint will be the next major piece after color/violation work. JR plans a separate payroll printout against the NET hours math.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is the hour-color rework + persistent-violation-flag pair.
2. `git log --oneline -3` should show `0b8f1b4` on top.
3. Read `src/components/EmployeeRow.jsx:45` and `src/modals/ShiftEditorModal.jsx:612` -- the two existing threshold ternaries that the color rework will touch. They use different scales (40/35 weekly vs 44/40 period); confirm with JR which the new ladder applies to.
4. Read `src/utils/timemath.js:83-101` (`computeConsecutiveWorkDayStreak`) and `src/utils/scheduleOps.js:173` (`createShiftFromAvailability`) before scoping the persistent-violation-flag -- check whether autofill consults the streak.
5. If the Apps Script redeploy happened while we were away: smoke EmailModal v1 + duplicate-email backend mirror as a batch.
6. Adapter files: not touched s033. Skip unless harness-switch context arises.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: employee-view hours lockdown (testguy inactive; code-review only). Low risk -- the gates are inspection-clean and admins verified live. Sarvi or a reactivated test account would close it. Not a blocker for the next step.
- (b) External gates: Apps Script redeploy still gated on JR; PDF kitchen-door paper-print legibility still on JR's home action. Neither blocks next session work.
- (c) Top active TODO: **hour-color rework + persistent-violation-flag.** JR raised both post-ship and put them at the top of Active.

(c) is the natural continuation. JR's framing on the violation flag was exploratory ("maybe... idonno"). Don't ship colors first then rebuild thresholds for the flag -- scope both together, then propose either a single bundled ship or a sequence. Most natural opener: read the two threshold ternaries (`EmployeeRow.jsx:45`, `ShiftEditorModal.jsx:612`) + the autofill path (`scheduleOps.js:173`) cold, then ask JR to pick concrete colors for the new ladder (safe / at-cap / over / way-over) AND confirm whether the violation flag scope this round includes consecutive-days, weekly-OT, and part-time-cap (or just one).

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
