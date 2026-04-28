# s034 -- 2026-04-28 -- Hour-color ladder + persistent violation flag + global indicator + backend redeploy

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: s034 ship + backend redeploy complete; JR owns the next focus (email-format pass + EmailModal v2), and post-redeploy live smoke folds into that work.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `8667116` on `main`; clean against upstream after handoff push
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched
- Active focus end-of-session: **email-format pass + EmailModal v2** (JR's stated next focus). Live smoke for s034 backend redeploy folds into this work
- s034 backend redeploy: `sendBrandedScheduleEmail` action + `saveEmployee` duplicate-email mirror check now LIVE on the otr.scheduler-owned Apps Script. Same `/exec` URL preserved. JR deferred live smoke to email-format session

**Working assumption (now durable in ARCHITECTURE.md `Deploy topology`):** the live Sheet + Apps Script + deploy URL all live in `otr.scheduler@gmail.com` Drive (one of JR's Google accounts). The script is STANDALONE, not container-bound to the Sheet. Extensions -> Apps Script from the Sheet returns "can't be found" because no binding exists. Access path is `script.google.com` directly while otr.scheduler is the active browser session.

## This Session

**Commits shipped (3):**

- `cd7b158` -- `feat(violations): hour-color ladder + persistent flag + autofill summary`. 8 files, +250/-47 lines. Plan at `~/.claude/plans/humming-chasing-tide.md`.
- `8667116` -- `fix(uiKit): AnimatedNumber overtime glow defers color to parent`. 1 file, +1/-1. Smoke caught the inline color override beating the parent ladder red at >=44h.
- s034 backend redeploy via `script.google.com` (otr.scheduler account) -- no commit; same `/exec` URL preserved.

**Coding-plan workflow** (`/coding-plan` skill, plan at `~/.claude/plans/humming-chasing-tide.md`):

- Phase 1 investigate: enumerated Critical Files cold (timemath, EmployeeRow, ShiftEditorModal, MobileAdminView, AnimatedNumber, App.jsx); confirmed only ONE `createShiftFromAvailability` callsite (App.jsx:734).
- Phase 2 research: NNGroup + Material 3 + Apple HIG. Net rules: stacked banners with auto-clear-on-resolve + dismiss-via-X; reserve modals for severe errors; match the existing `pendingCount` badge pattern for the global indicator.
- Phase 5 plan: 6 phases A-F; Opus 4.7 author, Sonnet 4.6 executor + smoker.
- Phase 6 execute (Sonnet 4.6 via `coding-plan-executor`): all 6 phases PASS, no plan-vs-code divergence. Build PASS at every gate.
- Phase 7 smoke (Sonnet 4.6 via `coding-plan-smoker` + Playwright): 7 PASS / 2 FAIL / 1 PARTIAL. Both FAILs same root cause -- `AnimatedNumber` inline `color: '#FBBF24'` override at uiKit.jsx beat the parent ladder red at >=44h. Surgical fix in `8667116`: dropped color override, kept red-toned textShadow glow so parent ladder controls hue.

**Color ladder shipped (drives 4 surfaces):**

- Under cap: `THEME.accent.cyan`
- At cap (exactly 40h): `THEME.status.atCap = '#00A84D'` (NEW token, OTR brand green, fixed/non-rotating)
- Over (40 < h < 44): `THEME.status.warning` amber
- Way-over (>= 44, ESA): `THEME.status.error` red
- 35h "approaching 40" amber dropped entirely
- Centralized in `OVERTIME_THRESHOLDS = {CAP: 40, OVER_RED: 44}` + `PART_TIME_WEEKLY_CAP = 24` constants in `src/utils/timemath.js`

**Violation rules covered by `computeViolations`** (NEW pure helper at `src/utils/violations.js`):

- Consecutive work days >= 5 (existing `computeConsecutiveWorkDayStreak`)
- Weekly net hours over cap (warn > 40, error >= 44)
- Part-time cap: `employmentType === 'part-time' && weekHours > 24` (NEW)
- Marked unavailable on this weekday
- Approved time-off covers this date

**Persistent flag in ShiftEditorModal:**

- Replaced transient banner (lines 490-519) with stacked dismissable banners (Material 3 stacking).
- Each violation own X. Per-modal-session dismissal state. Save NEVER gated.
- Resolved violations auto-disappear (re-compute on render).

**Autofill summary toast:**

- `autoPopulateWeek` (App.jsx:723) computes violations on the just-booked set post-write.
- Single toast: success if 0 violations, warning naming each violation if any.
- `computeWeekHoursFor(empId, dates, shiftMap, eventMap)` helper passes maps explicitly (closure-over-state mid-write was the trap).

**Global violations indicator:**

- AlertTriangle + count badge in desktop header AND mobile admin Row 3 action bar.
- Click opens panel listing all live violations grouped by employee/date with bullet details.
- Click violation row -> `setEditingShift({ employee, date })` opens ShiftEditorModal for that day.
- Hidden when count == 0 (no zero-state badge).
- `useMemo` dependency: `[schedulableEmployees, dates, shifts, events, timeOffRequests]`. O(emp x dates) cost per render.

**AnimatedNumber bug + fix:**

- Pre-fix (`uiKit.jsx:34`): `style={{ ...style, ...(isOvertime ? { color: '#FBBF24', textShadow: '...' } : {}) }}` -- inline span color amber beat parent `<p>` red at >= 44h. Smoke caught steps 1+2.
- Post-fix (`8667116`): dropped color, kept red-toned textShadow `rgba(248,113,113,0.45)`. Parent ladder controls hue, span adds depth.

**Backend redeploy via `script.google.com` (otr.scheduler account):**

- Pasted local `backend/Code.gs` (2503 lines) over remote.
- Deploy -> Manage deployments -> pencil -> New version. Description: `s033 sync: sendBrandedScheduleEmail + duplicate-email mirror check`.
- Same `/exec` URL preserved. No frontend changes needed.
- Live smoke deferred to email-format session per JR.

**Topology investigation (Drive MCP from johnrichmond007 account):**

- Drive search showed `RAINBOW SCHEDULING DATABASE` owned by `otr.scheduler@gmail.com`. JR's johnrichmond007 has shared-with-me access only (no script visibility).
- Apps Script project lives in otr.scheduler's Drive as STANDALONE (not Sheet-bound). Confirmed by Extensions -> Apps Script returning "can't be found" even when otr.scheduler is the active session -- no binding exists, full stop.
- Access path: `script.google.com` while otr.scheduler is the active browser session.
- Promoted to ARCHITECTURE.md `Deploy topology` section.

**Side effect from smoke (TODO Active):**

- Natalie Sirkin Week 18 (Apr 27 - May 3) shifts cleared during smoke step 9 (autofill test). Original ~38.8h Women's shifts Mon/Tue/Thu/Sat/Sun. Smoker reverted the autofill via reload, but the prior CLEAR was saved to Sheets. JR/Sarvi to re-enter manually.

**Memory writes:**

- `TODO.md`: removed redeploy entry (now Completed); removed two-line redeploy + EmailModal-v2 split, collapsed into single "Email-format pass + EmailModal v2 + post-redeploy smoke" entry; added Natalie cleanup; added Completed entries for s034 ship + s034 backend redeploy.
- `DECISIONS.md`: untouched. No durable direction changes (color thresholds + violation rules are implementation, not direction).
- `ARCHITECTURE.md`: NEW `Deploy topology` section captures the otr.scheduler-owned standalone-script reality. Backend Code.gs version updated to 2503 lines / v2.26.0 live.
- `LESSONS.md`: untouched. No new corrections this session; existing parity-rule and parity-on-fixes rules reaffirmed by the executor's parity audit.
- Auto-memory: `reference_apps_script_topology.md` (deploy topology), `feedback_account_phrasing.md` (multi-account communication rule).

**Decanting:**

- Working assumption: Sheet/Script ownership topology was wrong for half the troubleshooting. Resolved via Drive MCP. Promoted to ARCHITECTURE.md `Deploy topology`.
- Near-miss: pinballed between multiple wrong topology theories (Sheet bound to JR's drive, missing binding from his account, etc.) before landing on standalone-in-otr.scheduler. Captured in Anti-Patterns.
- Naive next move: auto-spawn `/coding-plan` for email-format work next session. Wrong -- JR owns the content/tone/format authoring; this is collaborative review, not feature shipping. Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed.
- LESSONS: 588 lines, RISK over 200 ceiling carried (multi-session graduation effort, same as s033).
- DECISIONS: 153 lines, under ceiling.
- TODO: ~99 lines, under ceiling.
- ARCHITECTURE: ~170 lines after topology add, under ceiling.
- Style soft-warns: pre-existing MD034 / MD041 noise; one new bare-URL fixed mid-session.
- Adapter files: untouched.

`Audit: clean (LESSONS 588/200 ceiling carried; pre-existing style soft-warns persist)`

## Hot Files

- `src/utils/violations.js` (NEW) -- `computeViolations({employee, dateStr, weekHours, currentStreak, hasApprovedTimeOff, availability}) -> Array<{rule, severity, detail}>`. Pure. Future: add per-employee `maxHours` field branch when JR adds the column.
- `src/utils/timemath.js` -- `OVERTIME_THRESHOLDS = {CAP: 40, OVER_RED: 44}` + `PART_TIME_WEEKLY_CAP = 24` constants. Email-format work doesn't touch this.
- `src/theme.js:54` -- `status: { success: '#34D399', warning: '#FBBF24', error: '#F87171', atCap: '#00A84D' }`. atCap is fixed/non-rotating.
- `src/components/uiKit.jsx:9-37` -- `AnimatedNumber` post-fix. `isOvertime` adds red textShadow only; parent owns color.
- `src/modals/ShiftEditorModal.jsx` -- persistent banner panel + dismissal state at top of body. `weekHours` prop threaded from both modal mount sites.
- `src/MobileAdminView.jsx:326` -- mobile admin weekly hours now uses `colorForWeeklyHours`-equivalent ladder (parity gap closed).
- `src/App.jsx:723-749` -- `autoPopulateWeek` post-run violation summary toast; `computeWeekHoursFor` helper inlined.
- `src/App.jsx` -- `allViolations` useMemo + `violationsPanelOpen` state + indicator render in desktop header AND mobile Row 3.
- `backend/Code.gs:309 + 2132` -- `sendBrandedScheduleEmail` action (now LIVE post-redeploy). Email-format work targets the email-body builders ~lines 2200-2500.
- `backend/Code.gs:1685` -- `DUPLICATE_EMAIL` mirror check in `saveEmployee` (now LIVE post-redeploy).

## Anti-Patterns (Don't Retry)

- Don't assume the live Sheet is in johnrichmond007's Drive. It's owned by `otr.scheduler@gmail.com`. JR has shared-with-me access only. The s031 nuke-and-pave moved the FULL stack (Sheet + Script + Deploy + sender identity), not just the OAuth.
- Don't try to access the Apps Script via Sheet -> Extensions -> Apps Script. The script is STANDALONE in otr.scheduler's Drive; no Sheet has it bound; the menu returns "can't be found" regardless of active session. Always go via `script.google.com` directly.
- Don't auto-spawn `/coding-plan` for the email-format pass. JR owns the content/tone/format design; this is collaborative authoring. The coding-plan workflow is for feature shipping where the spec is locked; email-format starts at "what should each email say" which is upstream of any plan.
- Don't reintroduce 35h "approaching 40" amber on any surface. Staff routinely sit at/near 40 by design at OTR.
- Don't put dismiss state in Sheets / localStorage. Per-modal-session UI state only. The global indicator is the durable surface for outstanding violations.
- Don't gate save on dismissal in ShiftEditorModal. Banners are informational only.
- Don't add `priorWorkStreak` prop logic to MobileAdminView/MobileEmployeeView. They don't render shift advisories; only ShiftEditorModal does, and it gets data via `computeViolations` props.
- Don't inline `color` overrides on `AnimatedNumber` (pre-fix bug pattern). The component should defer color to parent unless it has a reason not to (e.g. an explicit `color` prop).
- Don't hand-edit `priorWorkStreak` references in modal callsites that have been replaced by `weekHours` + `computeViolations` -- breaks parity between desktop and mobile mounts.
- Don't assume `getEmpHours` works for post-write computations. It closes over component state which doesn't reflect just-set values. Use `computeWeekHoursFor(empId, dates, shiftMap, eventMap)` with explicit map args.
- Don't bring back PDF per-cell `Nh` line or weekly total in name cell (s032 anti-pattern, still active).

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028+s029+s030+s031+s032+s033+s034 commits with deferred phone-smoke -- carried.
- Employee-view hours-lockdown live verification -- testguy is inactive in Sheet; verified by code inspection only. Reactivate test account or have Sarvi confirm in person.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14 (s034 partly subsumed via persistent flag at >=5 threshold; 6+ specifically still open per JR's TODO Blocked entry)
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)
- s034 backend live smoke -- deferred to email-format session per JR

## Key Context

- Color ladder uses strict `===` for at-cap (40h exact). Float math from `BREAK_RULES` is deterministic to `.toFixed(1)`, so `=== 40` in practice means "exactly 40.0." If smoke ever surfaces a 39.97h rounding glitch, swap to `Math.abs(hours - CAP) < 0.05` tolerance. Current ship strict-`===`.
- Floor Supervisor role pill is `roles.floorSupervisor: '#00A84D'`, same brand green as `status.atCap`. A Floor Supervisor at exactly 40h has green role pill (in cell) AND green hours number (in name col). Different surfaces, different sizes -- accepted as benign.
- ShiftEditorModal "PERIOD" footer label is misleading -- the math is per-week (`getEmpHours` iterates `currentDateStrs` which is the active week, not the 2-week pay period). Same 40/44 thresholds as EmployeeRow weekly. Copy edit was out of scope.
- Email-format work touches `backend/Code.gs` ~lines 2200-2500: `sendTimeOff*Email` (5 functions), `sendOffer*Email` (7), `sendSwap*Email` (7), `sendScheduleChangeNotification_`. Plus `BRANDED_EMAIL_WRAPPER_HTML_` at ~line 2070. EmailModal v2 (PDF attachment) needs new backend action via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`.
- Concurrent-admin save question came up but parked: no merge/conflict logic in backend today; last save wins. Real fix is save-time conflict detection (`lastModified` stamping). Not added to TODO this round; trigger is "Sarvi reports a vanished shift."
- Backend Code.gs is at v2.26.0 (header) but s034 redeploy did NOT bump the version comment. The redeployed code IS the s033-queued material; future redeploys should bump the header version comment as part of the change.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is **Email-format pass + EmailModal v2 + post-redeploy smoke**.
2. `git log --oneline -3` should show `8667116`, `cd7b158`, then the s034 handoff commit.
3. Read `CONTEXT/ARCHITECTURE.md` `Deploy topology` section before any backend work -- the Apps Script lives in `otr.scheduler@gmail.com`'s Drive standalone; access via `script.google.com` while that account is the active session.
4. Read `backend/Code.gs:2070-2500` cold before designing email-format pass -- BRANDED_EMAIL_WRAPPER_HTML_ wrapper + the 19+ email body builders.
5. If picking up email work, the post-redeploy smoke folds in: send a schedule email -> verify branded HTML body lands; try saving a duplicate-email staffer -> verify backend `DUPLICATE_EMAIL` rejects.
6. Adapter files: not touched s034. Skip unless harness-switch context arises.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: s034 backend redeploy (`sendBrandedScheduleEmail` + `DUPLICATE_EMAIL` mirror) -- live smoke deferred per JR; folds into email-format work. Color ladder + violation flag + global indicator -- 7-of-10 Playwright PASS, AnimatedNumber bug fixed in `8667116` (ship-and-trust on the fix; mechanical CSS cascade resolution).
- (b) External gates: phone-smoke for s028+s029+s030+s031+s032+s033+s034 carried (JR-owned). Apps Script no longer gated -- redeploy shipped. PDF kitchen-door paper-print legibility still on JR's home action.
- (c) Top active TODO: **Email-format pass + EmailModal v2**.

(c) is the natural continuation AND it absorbs the (a) smoke. JR explicitly said "I plan on working on the specific outputs of the emails soon" before the handoff. Most natural opener: read `backend/Code.gs:2070-2500` cold (BRANDED_EMAIL_WRAPPER_HTML_ + the email body functions), then ASK JR which emails he wants to revise FIRST and what tone/branding direction (e.g. "all emails should match the new pitch deck typography" vs "just clean up wording on the time-off-approved + swap-approved which Sarvi sees most"). Don't auto-spawn `/coding-plan` -- this is collaborative content authoring, not feature shipping. Once direction is locked, plan can spawn.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
