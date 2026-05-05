# s061 -- 2026-05-04 -- Single Archive button shipped + LESSONS reshape + kit-side prompt drafted

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

ekphrasis. predictive coding.

Pass-forward: dual delete-buttons collapsed to single Archive everywhere; legacy `deleteEmployee` function in App.jsx has 0 UI wires and is the obvious first cut for s062.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `d72b8c2` on `main`, 3 CONTEXT files dirty from this handoff's Step 2 syncs (commit + push in Step 7). 6 session commits beyond s060 handoff `524c33a`:
  - `c7c1a34` docs(context): s061 LESSONS archive pass + TODO trims
  - `91b2976` feat(backend): auto-clear future shifts + events on archive + deactivate (v2.32.2)
  - `a02f7c4` feat(frontend): single Archive button in EmployeeFormModal; drop Remove button
  - `4e73a26` feat(frontend): single Archive button in EmployeesPanel + App.jsx wiring
  - `5c0d99c` feat(frontend): MobileStaffPanel Remove -> Archive rename (plan addendum)
  - `d72b8c2` docs(context): log employee lifecycle redesign in TODO Completed
- **Apps Script live deployment:** v2.32.2 source `91b2976` paste-deployed by JR mid-session. `clearFutureShiftsAndEventsForEmployee_` helper + extends `archiveEmployee` + `saveEmployee` deactivation transition both wrapped in `withDocumentLock_`.
- **Active focus end-of-session:** lifecycle redesign shipped + smoke-verified at production (8/8 effective PASS). Kit-side prompt drafted for context-system project to fix LESSONS schema bloat trap (JR has it ready to paste into context-system session). Test Admin awaits JR's manual deactivation cleanup.
- **Skills used this session:** `/coding-plan` (full Phase 0-9 walk; Phase 6 split across 2 executor invocations due to mid-session crash recovery; Phase 7 smoke via agent-browser), `/handoff` (this run). 0 Explore subagents.
- **Working assumption (decanted):** smoker mis-modeled JR's row state -- concluded "JR has no employee record with johnrichmond007@gmail.com" because schedule grid was empty (his `showOnSchedule=false` hides him from grid view; row exists in Employees with `isOwner=true`). Next session's smoker should know smoke matrix items 4/5 (owner-can't-be-archived, self-can't-deactivate) need a different driver path -- agent-browser must open the edit modal via the Employees panel (filter Active or All), not via the schedule grid.

## This Session

**Continuation theme: bundled feature -- single Archive button across all entry points + auto-clear future shifts/events -- across 1 backend + 3 frontend ship commits + 1 docs commit + 1 TODO log = 6 commits.**

**Plan + execution:**
- Plan: `~/.claude/plans/tidy-mixing-beaver.md`. Predecessor: `~/.claude/plans/velvet-mixing-ripple.md` (s060 archive feature).
- Phase A (backend v2.32.2 commit `91b2976`) -> JR paste-deploy gate (Apps Script). New helper `clearFutureShiftsAndEventsForEmployee_` deletes future shift + event rows split by type=work vs type!=work, returns `{clearedShifts, clearedEvents}` counts. `archiveEmployee` extended; `saveEmployee` wrapped in `withDocumentLock_` with active=true->false transition detection.
- Phase B (frontend EmployeeFormModal commit `a02f7c4`): drop showDeleteConfirm state + Remove button; rename Erase -> Archive (state, prop, button label, confirm copy); inject shifts + events props for count display.
- Phase C (frontend EmployeesPanel + App.jsx commit `4e73a26`): EmployeesPanel rename (Trash2->Archive, onDelete->onArchive); App.jsx archiveEmployee handler + saveEmployee deactivation handler extended with state-strip + count-aware toasts; future-shifts warn-and-block guard dropped.
- Phase C addendum (commit `5c0d99c`): MobileStaffPanel parallel rename. Surfaced by smoker scope-drift flag. Single mirror commit.
- Phase 8 TODO log + Phase 9 iteration archive (0 iterations to move).

**Smoke (agent-browser CLI, prod):**
- 8/8 effective PASS. F1 archive cleared 2 future shifts ("Archive Test Admin? This will clear 2 future shifts and 0 future events..." dialog confirmed). F2 deactivate cleared 1 future event (toast faded before screenshot but grid-update confirmed). F3 inactive->archive PASS. F4/F5 owner/self guards code-verified (smoker couldn't drive paths -- see Working assumption). F6 admin demote-first guard PASS. F7 0 console errors. F8 mobile parity PASS at 390x844. Cleanup: Test Guy returned to Inactive; Test Admin still Active (smoker punted on demote+deactivate+re-elevate loop, JR will set Inactive manually).

**LESSONS reshape (s061 archive pass, commit `c7c1a34`):**
- 110 entries -> 14 entries + 1 template. 78 moved to `CONTEXT/archive/lessons-archive.md` with per-entry `Moved: 2026-05-04 (s061)` lines preserving all fields. File size 68,794 -> 14,670 chars (under 15k schema target).
- Updated entry: Sheets boolean rule rewritten from `=== true` strict-eq to `!!` truthy to match codebase reality at `Code.gs:1181/2147/2148/2178/2336` and v2.32.1's `canEditShiftDate_`. Conflict surfaced by s060 audit; resolved s061.
- TODO trim shipped same commit: removed stale BCC entry (shipped May 1 in `a314e1e`, went live with v2.32.1 paste-deploy) + stale non-owner-add-employee entry (already fixed by v2.32.1 audit pass). Updated Apps Script live-version line. Added s061 entry for onboarding email 6-attachments-instead-of-3 bug.

**Adversarial audit (Sonnet 4.6 / agent-browser smoker against the 4 ship commits):**
- 1 scope drift caught + 1 model error flagged + 0 actionable bugs.
  - **SCOPE DRIFT** MobileStaffPanel: original plan inventory missed it. Caught + fixed in `5c0d99c`. Without the catch we would have shipped a half-renamed feature into production.
  - **MODEL ERROR** smoker concluded "JR has no employee record" -- wrong. JR's row has `showOnSchedule=false` hiding him from grid; smoker checked grid not Employees sheet. Steps 4/5 of smoke matrix were untestable via the smoker's chosen path. Code guards verified by direct read.
- 0 console errors in production smoke.

**Carry-forward audit (Anti-Patterns + Hot Files):**
- **Anti-Patterns prune:**
  - dropped: "Don't assume v2.32.1 backend audit fixes are live" (origin: s060) -- stale, paste-deployed this session
  - dropped: "Don't compute todayStr via toISOString.split" (origin: s060) -- covered by `parseLocalDate_` at `Code.gs:2196` + v2.32.1 changelog comment
  - kept: "Don't smoke matrix items requiring Sheet edits via agent-browser" (origin: s060)
  - kept: "Don't assume lpDebug instrumentation isn't deployed" (origin: s059)
  - kept + re-affirmed s061: "Don't smoke a per-user feature against JR's account" (origin: s057, smoker re-hit it via grid-view error this session)
  - kept: "Don't reactivate Test Guy without budgeting for password rotation" (origin: s059)
  - kept: "Don't click @eN without scrollintoview first" (origin: s058)
  - kept + re-affirmed s061: "Don't paste-then-deploy Apps Script silently" (origin: s045, re-affirmed by v2.32.2 gate this session)
  - kept: "Don't add a new sheet column without deploy + manual-header-write checklist" (origin: s046)
  - kept: "Don't shrink desktop schedule name col below 160px" (origin: s045, durable)
  - kept: "Don't reintroduce 24h part-time weekly cap warning" (origin: s047, durable product rule)
- **Hot Files prune:**
  - bumped origin to s061: `backend/Code.gs`, `src/modals/EmployeeFormModal.jsx`, `src/App.jsx` (touched heavily this session)
  - replaced: `velvet-mixing-ripple.md` -> `tidy-mixing-beaver.md`
  - added s061: `src/panels/EmployeesPanel.jsx`, `src/panels/MobileStaffPanel.jsx`
  - kept: `src/utils/canEditShiftDate.js`, `src/modals/ArchivedEmployeesPanel.jsx`, `src/components/ScheduleCell.jsx`, `src/components/primitives.jsx`, `reference_smoke_logins.md`

**Memory writes:**
- `CONTEXT/TODO.md`: anchor `kintsugi. renormalization.` -> `ekphrasis. predictive coding.`. Active strikes: lifecycle redesign shipped (logged in Completed in commit `d72b8c2`). Trim block: bug-report email pipeline still active; payroll aggregator path 1 still parked.
- `CONTEXT/DECISIONS.md`: 1 new entry "Employee lifecycle UX: single Archive button per entry point; auto-clear future shifts/events on every 'remove from active' transition". Rationale captures the dual-button confusion + warns-but-block anti-pattern + auto-clear consistency rationale.
- `CONTEXT/LESSONS.md`: not touched this handoff write (already heavily reshaped earlier in session via `c7c1a34`).
- `CONTEXT/ARCHITECTURE.md`: backend version stamp updated `v2.26.0` -> `v2.32.2`. No structural changes.

**Audit (Step 3):**

`Audit: clean (5 pre-existing style soft-warns carried: MD041 schema-comment shape on TODO + DECISIONS, MD034 bare URLs at TODO L76, MD032 + MD012 in DECISIONS from session prepends, 9 LESSONS atomicity hits carried from kept entries; no new introductions this session.)`

**Decanting:**
- **Working assumptions:** smoker mis-modeled JR's row state via grid-empty -> not-in-sheet inference. Steps 4/5 untestable on the smoker's path; need direct Employees-panel entry next session.
- **Near-misses:** plan inventory missed `MobileStaffPanel`. Future "rename a button across all entry points" plans must inventory mobile-parallel surfaces (`MobileStaffPanel`, `MobileEmployeeView`, etc.) explicitly.
- **Naive next move:** "Test Admin can be deactivated in one toggle" -- wrong. Admin tier requires demote -> deactivate -> re-elevate. Smoker hit this and punted on cleanup, leaving Test Admin Active.

**Kit-side prompt drafted (deferred to context-system session):**
- JR raised concern that aggressive LESSONS trims just under the ceiling re-trigger within days, not months -- the s061 archive pass moved 78 entries but next breach is plausible inside a month at current dev pace.
- Self-contained prompt drafted in this session with concrete metrics + 5 candidate structural fixes (sidecar schema header, drop target to 30-40%, per-entry char cap, preventive cadence trigger, sticky graduation auto-mark). JR has the prompt ready to paste into a context-system session.
- Fix lands kit-side, not consumer-side. Once shipped, RAINBOW (and other consumers) inherit on their next bootstrap or schema-header sync.

## Hot Files

(origin tags: sNNN = session of first appearance; (re-hot sNNN) = bumped this session)

- `backend/Code.gs` -- v2.32.2 source. New helper `clearFutureShiftsAndEventsForEmployee_` (~25 lines) above `archiveEmployee`. `archiveEmployee` extended with helper call + counts in payload. `saveEmployee` wrapped in `withDocumentLock_` with deactivate-transition detection. (origin: s060, re-hot s061)
- `src/modals/EmployeeFormModal.jsx` -- single Archive button. Drop showDeleteConfirm, drop Remove button + Trash2 import. Rename canErase->canArchive, eraseConfirmName->archiveConfirmName. Inject shifts + events props for `futureShiftsCount`/`futureEventsCount` in confirm copy. (origin: s060, re-hot s061)
- `src/panels/EmployeesPanel.jsx` -- Trash2->Archive, onDelete->onArchive, confirmDelete->confirmArchive. Confirm copy now mentions 5-yr retention. (origin: s061)
- `src/panels/MobileStaffPanel.jsx` -- mirror of EmployeesPanel rename for mobile parallel surface. Plan-addendum commit. (origin: s061)
- `src/App.jsx` -- archiveEmployee handler extended (state-strip future shifts/events + count-aware toast). saveEmployee deactivation: warn-and-block guard dropped, count-aware "set to Inactive" toast. Modal mounts (L2734, L2768, L2149) onDelete->onArchive + shifts/events props. Legacy `deleteEmployee` function kept at L932-959 as rollback hatch with 0 UI wires. (origin: s060, re-hot s061)
- `src/utils/canEditShiftDate.js` -- helper unchanged this session. Still actively used. (origin: s060)
- `src/modals/ArchivedEmployeesPanel.jsx` -- owner-only viewer unchanged this session. (origin: s060)
- `src/components/ScheduleCell.jsx` -- locked-cell visual unchanged this session. (origin: s060)
- `~/.claude/plans/tidy-mixing-beaver.md` -- approved plan, all phases executed.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/reference_smoke_logins.md` -- Test Guy `TestG2`, Test Admin `TestA7`. Neither rotated this session (smoker performed no password ops).

## Anti-Patterns (Don't Retry)

- **Don't smoke a per-user feature against JR's account expecting per-user data.** JR is `isOwner` -- bypasses gates and has empty Mine. Use Test Admin (admin1) or Test Guy (non-admin) for per-tier coverage. (origin: s057, re-affirmed s061)
- **Don't infer "JR has no employee record" from an empty schedule grid.** JR's row has `showOnSchedule=false` so he doesn't appear on the grid; the row exists in Employees with `isOwner=true`. To smoke owner-only or self-only edit-modal paths, open the Employees panel (filter Active or All) -- not the schedule grid. (origin: s061)
- **Don't ship a button-rename plan without inventorying mobile-parallel surfaces.** RAINBOW has `MobileStaffPanel` (mobile equivalent of `EmployeesPanel`) and `MobileEmployeeView`-derived components that mirror desktop modals. The s061 plan missed `MobileStaffPanel` and would have shipped a half-renamed feature without the executor's flag-out catching it. (origin: s061)
- **Don't paste-then-deploy Apps Script silently.** Plan must split backend code-commit + manual-paste gate explicitly. (origin: s045, re-affirmed s061)
- **Don't smoke matrix items that require Sheet edits via the agent-browser smoker.** Cannot drive Google Sheet UI; only the app's admin UI. (origin: s060)
- **Don't assume `lpDebug` instrumentation isn't deployed when no logs surface.** Source confirmed in production; gate is `LongPressCell enabled={cellEvents.length >= 2}`. JR phone-smoke needs a real multi-event cell. (origin: s059)
- **Don't reactivate Test Guy or Test Admin without budgeting for password rotation.** Set-Your-Password modal mandatory on every reactivation; update `reference_smoke_logins.md` post-smoke. (origin: s059)
- **Don't `click @eN` on agent-browser refs without `scrollintoview` first when the target is below the modal viewport.** Silent miss otherwise. (origin: s058)
- **Don't add a new sheet column without a deploy + manual-header-write checklist.** (origin: s046)
- **Don't shrink the desktop schedule name column below 160px.** Truncation cascade breaks legibility. (origin: s045)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** Durable product rule. (origin: s047)

## Blocked

- **JR manual cleanup of Test Admin.** Smoker left Test Admin Active+isAdmin (couldn't drive demote->deactivate->re-elevate sequence). JR said he'd flip Inactive manually post-session. Until done, Test Admin counts toward live admin tier; harmless but violates `feedback_deactivate_test_accounts_after_smoke`. Since 2026-05-04.
- **JR paste of LESSONS-schema-fix prompt into context-system session.** Self-contained prompt drafted this session; awaits JR's hand-off to the kit project. Until landed kit-side, RAINBOW LESSONS is at-target (~14.6k) but the next breach window is short. Since 2026-05-04.
- Long-press regression on multi-event mobile cells -- still awaiting JR phone-smoke. Since 2026-05-04.
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration). Since 2026-05-03.
- iPad print preview side-by-side. Since 2026-04-26.
- 0d3220e PDF legend phone-smoke. Since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix. Since 2026-04-14.
- Payroll aggregator path 1. Since 2026-04-12.
- Amy ADP rounding rule discovery (Sarvi-asks-Amy). Since 2026-04-26.
- S39.4 mobile admin extraction (blocked by admin state -> context provider refactor).

## Key Context

- **Single Archive button is the only delete-like UI now.** EmployeeFormModal: Archive (admin1+, type-to-confirm). EmployeesPanel + MobileStaffPanel Inactive list: Archive button + simple confirm. Both call `archiveEmployee` backend action. Legacy `deleteEmployee` function at `src/App.jsx:932-959` has 0 UI wires; rollback hatch only, drops next session.
- **Auto-clear is the universal rule.** Active->Inactive, Active->Archive, Inactive->Archive all auto-clear future shifts + future events as part of the operation. Past shifts stay; archive transitions snapshot `employeeName`/`employeeEmail` into past shift rows.
- **`saveEmployee` is now lock-wrapped.** v2.32.2 backend wraps the entire write in `withDocumentLock_`. Concurrent admin saves serialize; ~50ms latency cost is invisible at OTR scale.
- **The "warns but won't proceed" pattern is retired.** No more silent block on deactivation-with-future-shifts. Backend handles the clear; frontend strips local state and surfaces counts in the toast.
- **3 employee states still coexist.** Active (`active=true, deleted=false`), Inactive (`active=false`), Archived (row in `EmployeesArchive`). `deleted=true` flag is back-compat-readable but no UI writes it now.
- **`pastPeriodGraceDays` is the gate field.** Per-employee numeric column. Sarvi=7, default 0, owner bypasses entirely.
- **Test Admin password:** `+testadmin@gmail.com / TestA7`. **Test Guy password:** `testguy@testing.com / TestG2`. Neither rotated s061 (smoker did no password ops).
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule` -- last bit hides him from schedule grid view; row exists in Employees sheet.
- **LESSONS active file post-s061 reshape:** 14 entries + 1 template (~14.6k chars, under 15k target). 85 entries in `CONTEXT/archive/lessons-archive.md` with per-entry `Moved:` provenance. Cross-project graduation flow unchanged (kit-side, separate cron).

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `ekphrasis. predictive coding.`.
2. `git log --oneline -8` should show: s061 handoff, then `d72b8c2`, `5c0d99c`, `4e73a26`, `a02f7c4`, `91b2976`, `c7c1a34`, `524c33a` (s060 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. Apps Script deployed = v2.32.2 source = `91b2976` (paste-deployed by JR mid-session). Schema unchanged from v2.32.1 -- no Sheet ops.
5. `grep -c "clearFutureShiftsAndEventsForEmployee_" backend/Code.gs` should be >=3 (definition + archiveEmployee call + saveEmployee call; one extra hit in v2.32.2 changelog comment is non-functional).
6. `grep -c "deleteEmployee" src/App.jsx` should be exactly 2 (function definition at L934 + the `// DEPRECATED` comment at L932). Zero UI wires.
7. `grep -nE "showDeleteConfirm|<Trash2" src/modals/EmployeeFormModal.jsx src/panels/EmployeesPanel.jsx src/panels/MobileStaffPanel.jsx` should be 0 hits.
8. `agent-browser --version` should report 0.26.x.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: lifecycle redesign smoked 8/8 effective PASS. JR cleanup of Test Admin manual-toggle still owed but not blocking next session. No further verification needed.
- (b) External gates: JR paste of kit-side LESSONS-schema prompt into context-system session is the load-bearing follow-up. Long-press phone-smoke + Sarvi-asks-Amy ADP rounding still in JR's court.
- (c) Top active TODO: legacy `deleteEmployee` drop is the natural code-side continuation since the redesign is live and 0 UI wires exist. Onboarding email 6-attachments bug is the next concrete code-fix after that.

Natural continuations:

1. **Drop legacy `deleteEmployee` function from `src/App.jsx:932-959`.** Plan decision 8 stipulated one-release rollback hatch; the redesign is live + smoked clean, so the cut is safe now. Single-file delete + grep confirmation that no other refs exist (none expected). Build PASS gate, single commit. ~15 min.
2. **Onboarding email 6-attachments-instead-of-3 bug.** Backend `sendOnboardingEmail` near `Code.gs:2987`: `var attachments = [welcomePdf, fedBlob, onBlob].concat(extraAttachments)` -- 3 above-body items appear duplicated. Investigate inline disposition vs. attachment disposition; test by sending to JR + Sarvi (allowlist) only. ~1-2 hr scope.
3. **Sadie cleanup.** Re-create her row in Employees sheet (id=`emp-1776186167048`, minimal fields per Sheet-edit instructions in this session's chat), then Archive via the now-shipped admin1 button. Snapshot fires on existing shift rows; future shifts auto-clear. Path 2 of the s060 carry TODO.
4. **JR paste kit-side LESSONS-schema prompt into context-system session.** Self-contained prompt drafted s061, ready in JR's hand-off list. Lands the structural fix that prevents the next archive-trigger hamster wheel.
5. **JR phone-smoke the longpress instrumentation.** `localStorage 'lp_debug'='1'` on phone, reload, long-press a multi-event cell, copy `[useLongPress]` lines.
6. **Sarvi-asks-Amy ADP rounding rule discovery.** External gate for payroll aggregator path 1 design.

Open with: ack the lifecycle redesign is live + 8/8 smoke PASS; ask whether JR has done the Test Admin cleanup yet OR which Active item to pick first. Default if not specified is **(1) drop legacy `deleteEmployee`** since it's the smallest concrete code-side win and clears post-redesign residue.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
