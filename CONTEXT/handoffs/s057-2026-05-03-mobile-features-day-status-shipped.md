# s057 -- 2026-05-03 -- Mobile triangle + long-press + Day Status admin override + v2.30.2 refactor

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

marquetry. attractor dynamics.

Pass-forward: 4 commits shipped (3 frontend auto-deployed, 1 backend pending paste); v2.30.2 refactor needs JR paste-deploy.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `23ad13b` on `main`, will be `s057 handoff` after Step 7. 4 session commits beyond s056: `33438e6` (mobile violations triangle fix), `9ae5ed8` (mobile long-press detail sheet), `e53768e` (Day Status segmented control), `23ad13b` (v2.30.2 batchSaveShifts refactor).
- **Apps Script live deployment:** `7abe364` v2.30.1 (NOT YET v2.30.2). JR has not paste-deployed `23ad13b` yet. Behavior unchanged in v2.30.2 -- pure refactor (single source of truth for the document lock timeout). Safe to defer paste; functional state is identical.
- **Active focus end-of-session:** all four picked items shipped. Pick next from `CONTEXT/TODO.md` Active list.
- **Working assumption (corrected mid-session):** the `Mine tab missing shifts` bug raised in s055 is a non-bug -- JR was checking Sarvi's view while logged in as JR himself; JR is `isOwner` so his Mine tab is empty by design. Confirmed in s057 by smoking with a freshly-created Test Admin fixture: lookup `shifts[\`${currentUser.id}-${dateStr}\`]` works correctly when the actual employee logs in. Memory entry written: `feedback_view_as_actual_user.md`.
- **Skills used this session:** `/coding-plan` (NOT used -- 4 features shipped via direct Plan Mode + execution), `EnterPlanMode` x2, `ExitPlanMode` x2, `/handoff` (s057 now). 1 Explore subagent run for the Day Status mapping (mobile cell renderers + sick toggle pattern + EVENT_TYPES schema).

## This Session

**Continuation theme: cleared the s056 backlog (mobile triangle button bug, mobile long-press feature, Mine tab investigation, Day Status admin override) and shipped the parked v2.30.2 backend refactor.**

**Commits shipped:**

- `33438e6` fix(mobile): violations panel now opens from mobile admin triangle button.
  - Root cause: the `AdaptiveModal` render block (App.jsx:2579-2620 pre-fix) lived only inside the desktop admin return; the mobile admin return at line 2107 exited before reaching it. `setViolationsPanelOpen(true)` updated state but no panel ever mounted on mobile.
  - Hoisted the JSX into a shared `violationsPanelEl` const next to `pkModalEl` (line ~1601), rendered it in both mobile and desktop returns. Same pattern as `pkModalEl`.
  - Frontend-only, Vercel auto-deploy. Smoked locally @ 390x844: triangle opens dialog with Nicole Seeley + Owen Bradbury violations rendered, 0 console errors.

- `9ae5ed8` feat(mobile): long-press multi-event cells opens event detail sheet.
  - 3 new files: `src/hooks/useLongPress.js` (~30 lines, 500ms timer + 10px move-cancel + click-suppression via `firedRef`), `src/components/EventDetailSheet.jsx` (~40 lines wrapping the existing `MobileBottomSheet`), `src/components/LongPressCell.jsx` (per-cell wrapper so `useLongPress` can be used inside a `.map()` loop -- handles click suppression).
  - Wired into 2 mobile renderers: `MobileAdminScheduleGrid` (admin mobile, td cells) and `MobileScheduleGrid` (employee mobile, div inside td). `MobileMySchedule` skipped -- it already inlines per-event detail per row, no aggregation problem.
  - Existing tap behavior preserved: admin tap still opens `ShiftEditorModal`; long-press suppresses the click.
  - Smoke @ 390x844: added Meeting + PK to Sarvi Mon Jun 15, 500ms touch-hold opened sheet showing both events with type pills + times; tap on same cell still opened `ShiftEditorModal`; cleanup removed both events; 0 console errors.

- `e53768e` feat(admin): Day Status segmented control -- Working/Sick/Unavailable.
  - New event type `unavailable` joins `meeting | pk | sick` in `EVENT_TYPES` (`src/constants.js`).
  - `ShiftEditorModal` refactored: standalone "Mark as sick" Thermometer toggle replaced with a 3-state `[Working | Sick | Unavailable]` radiogroup at the top of the editor body. Sick keeps note input; Unavailable has no note. Selecting non-Working states mutes Work/Meeting/PK pills + time pickers (existing pattern). New `dayStatus` state + `setStatus` handler unifies the 3 transitions; `saveSick` + new `saveUnavailable` handle persistence; `commitSickNote` preserved.
  - 4 cell renderers (`ScheduleCell`, `EmployeeScheduleCell`, mobile `MobileScheduleGrid`, mobile `MobileAdminView` inline) detect admin-set unavailable + route to existing `isFullyUnavailable` render branch (same grey "Unavailable" pill).
  - **`unavailable` is filtered out of `visibleEvents`** -- it's a status marker, not a displayable event. Caught during smoke when EventGlyphPill rendered "OFF" alongside the "Unavailable" pill.
  - `App.jsx autoPopulateWeek` skips marked days. `App.jsx saveShift` blocks work-shift saves on admin-unavailable days with toast (defense-in-depth).
  - Hours computation (`getEmpHours` + `computeWeekHoursFor`) treats unavailable as 0h (same exclusion as sick) -- caught when Sarvi showed "8.0h" from the unavailable event's default 11AM-7PM times being summed.
  - **No backend changes** -- type is free string with `(emp, date, type)` uniqueness on the Shifts sheet.
  - Smoke @ 1280x800: Day Status renders, Unavailable saves + reverts, Sick path 100% preserved (note input + "Reason (optional) -- e.g. flu" placeholder unchanged), Sarvi 0.0h hours preserved through unavailable mark, cleanup verified.

- `23ad13b` refactor(backend): batchSaveShifts uses withDocumentLock_ helper (v2.30.2).
  - Replaces the inline `LockService.getDocumentLock() + tryLock(10000) + try/finally releaseLock` pattern in `batchSaveShifts` with the existing `withDocumentLock_` helper.
  - Single source of truth for lock instance, 10s timeout, CONCURRENT_EDIT response shape.
  - Behavior unchanged: same instance, same 10s timeout, same clean error on contention. CONCURRENT_EDIT message changes from "Another admin is saving the schedule. Please wait a moment and try again." to "Another action is in progress (saving the schedule). Please wait a moment and try again." -- the `errorContext` arg preserves intent.
  - **REQUIRES paste-deploy.** Live = v2.30.1 until JR pastes Code.gs into the Apps Script editor.

**Smoke results:**

- Triangle button (`33438e6`): 1/1 PASS @ 390x844 prod -- panel opens with both violations rendered, 0 console errors.
- Long-press (`9ae5ed8`): 1/1 PASS @ 390x844 localhost -- multi-event cell long-press opens sheet; tap-after-long-press still opens `ShiftEditorModal`; 0 console errors.
- Mine tab investigation (closed as non-bug): created Test Admin fixture (`emp-1777826090926` / `johnrichmond007+testadmin@gmail.com`), added shift to Jun 15, logged in as Test Admin, Mine tab rendered correctly. JR's "missing shifts" was JR-as-Owner Mine being empty by design.
- Day Status (`e53768e`): 5/5 PASS @ 1280x800 localhost -- Day Status renders, Unavailable saves + cell shows grey "Unavailable" pill, revert works, Sick mutex enforced (note input appears with original placeholder), Sarvi 0.0h preserved through unavailable mark, cleanup verified.
- v2.30.2 refactor: build PASS only. No live smoke (paste-deploy pending).

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `cinnabar. instanton.` -> `marquetry. attractor dynamics.`. Active: struck "Mobile long-press" line. Verification: extended Apps Script live block to flag `23ad13b` PENDING paste. Completed: prepended v2.30.2 refactor + Day Status + long-press + triangle (4 newest); trimmed 4 oldest (v2.30.1 hotfix + Batch 3 + v2.29.1 hotfix + Batch 2) into trim comment.
- `CONTEXT/DECISIONS.md`: not touched. The Day Status data model + the v2.30.2 refactor invariant are sufficiently captured in the inline comments at `EVENT_TYPES.unavailable` and `withDocumentLock_`.
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carries from prior sessions; nothing this session graduated).
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; the `LongPressCell` + `useLongPress` are local additions that follow the existing hook + component pattern).
- Auto-memory writes (this session):
  - `reference_smoke_logins.md`: added Test Admin entry (`johnrichmond007+testadmin@gmail.com / TestA7`, id `emp-1777826090926`, currently Inactive + Staff role).
  - `feedback_view_as_actual_user.md`: NEW entry (per-user view bugs require logging in as that user; JR is isOwner so his Mine is empty by design).

**Audit (Step 3 of HANDOFF):**

`Audit: clean (LESSONS 68,794/25k carries from prior sessions; nothing this session graduated; pre-existing TODO MD041 + MD034 soft-warns)`

**Decanting:**

- **Working assumptions:**
  - React fiber state injection via `state.queue.dispatch` was assumed safe for a targeted setter -- turned out my heuristic (`memoizedState === null`) matched 9 setters across the app, and broadcasting a `{events, dateLabel}` object to all of them broke `loadError` state with "Objects are not valid as a React child". Reload recovered. Use Playwright clicks via `data-test-target` attributes instead of fiber-walking for state mutation.
  - `EnterPlanMode` was assumed to use a single fixed plan-file path. Actually allocates a random `~/.claude/plans/{adjective-verb-noun}.md` per call; `ExitPlanMode` reads from THAT path. I lost an approval round when I wrote to a custom-named file (`admin-unavailable-override.md`) and the harness echoed back the stale long-press plan. Workaround: copy custom-named plan to the harness-allocated path before calling ExitPlanMode, OR write to the harness-allocated path directly.
- **Near-misses:**
  - Bundling the v2.30.2 refactor into the Day Status commit. Rejected -- pure organization vs new behavior; isolated rollback bisection > fewer commits.
  - Making `unavailable` coexist visually with a shift (like sick's struck-through overlay). Rejected -- JR's spec is "behave like default-unavailable" which replaces the cell entirely.
  - Adding a sibling toggle next to "Mark as sick" instead of refactoring into a 3-state segmented control. Rejected -- segmented control surfaces the mutex visually + scales for future day-statuses (vacation, training).
- **Naive next move:**
  - Adding `unavailable` to `EVENT_TYPES` + the cell renderers without also filtering it out of `visibleEvents`. Smoke caught it: cell rendered "Unavailable" pill PLUS "OFF" event glyph (because `EventGlyphPill` renders any `EVENT_TYPES` entry). General principle: when adding a status-only event type, also exclude it from the displayable-events filter at every render site.

## Hot Files

- `backend/Code.gs` -- v2.30.2 in source (commit `23ad13b`), live still v2.30.1. PASTE-DEPLOY NEEDED. Refactor at `batchSaveShifts` (~line 2206) wraps body in `withDocumentLock_(() => { ... }, 'saving the schedule')` instead of inline `LockService.getDocumentLock() + tryLock`. Helper `withDocumentLock_` definition unchanged at line 627. Version comment block at line 5.
- `src/constants.js` -- new `EVENT_TYPES.unavailable` entry at ~line 44. Mirror of `sick` shape with muted theme tokens.
- `src/modals/ShiftEditorModal.jsx` -- 3-state Day Status segmented control replacing the standalone Mark-as-sick toggle (~lines 525-575). New `dayStatus` state, `setStatus(next)` handler, `saveUnavailable(active)` handler, `Ban` icon import. `sickActive` removed entirely; all references migrated to `isSick` / `isOffDay` derived booleans.
- `src/components/ScheduleCell.jsx` (desktop), `src/views/EmployeeView.jsx` (`EmployeeScheduleCell`, mobile employee), `src/MobileEmployeeView.jsx` (`MobileScheduleGrid`, mobile employee schedule grid), `src/MobileAdminView.jsx` (admin mobile schedule grid inline cell) -- all 4 detect `unavailable` event + route to existing `isFullyUnavailable` render branch. `unavailable` filtered out of `visibleEvents` at each site.
- `src/App.jsx` -- `getEmpHours` (line ~577) + `computeWeekHoursFor` (line ~598) treat `unavailable` as 0h. `autoPopulateWeek` (line ~700) skips days with unavailable event. `saveShift` (line ~964) blocks work-shift saves on admin-unavailable days with toast.
- `src/hooks/useLongPress.js` -- new touch-timing hook (500ms default, 10px move-cancel threshold).
- `src/components/EventDetailSheet.jsx` -- wraps `MobileBottomSheet` for the long-press detail surface.
- `src/components/LongPressCell.jsx` -- per-cell wrapper component handling per-instance hook + click-suppression.
- `~/.claude/plans/admin-unavailable-override.md` + `woolly-coalescing-anchor.md` -- the Day Status plan (final approved version). Same content in both files due to the harness path mismatch -- harness reads `woolly-coalescing-anchor.md`.
- `~/.claude/plans/audit-fixes-2026-05-02.md` -- the s056-retired 4-batch plan. Kept on disk for reference. RETIRED.

## Anti-Patterns (Don't Retry)

- **Don't broadcast a state object to all matching React fiber setters when probing UI state.** My heuristic (`memoizedState === null` matches eventSheetData) also matched 9 unrelated setters; broadcasting `{events, dateLabel}` to all of them broke `loadError` with the "Objects are not valid as a React child" error. Use a `data-test-target` attribute + Playwright click instead of fiber-walking when you need to drive state. (s057 working assumption.)
- **Don't write a plan file to a custom path and expect ExitPlanMode to find it.** `EnterPlanMode` allocates a random harness path (`~/.claude/plans/{adj-verb-noun}.md`); `ExitPlanMode` reads from THAT path. Write to the harness-allocated path directly, or copy your custom-named file there before calling ExitPlanMode. (s057 working assumption.)
- **Don't add a status-only event type without filtering it out of the displayable-events filter at every cell renderer.** EventGlyphPill renders any EVENT_TYPES entry by default; an `unavailable` event would render as "OFF" glyph alongside the "Unavailable" pill if not filtered. (s057 naive-next-move.)
- **Don't bundle hotfixes into batch paste-deploys when isolated rollback matters more than fewer paste cycles.** (Carry s056.)
- **Don't pattern-match smoker findings as authoritative when they cross a backend invariant.** (Carry s056.)
- **Don't skip the plan after AskUserQuestion answers come back.** AskUserQuestion locks decisions; a plan documents file-level strategy. 2+ files OR 3+ concerns -> plan + approval before Edit. (Carry s055.)
- **Don't ask jargon-laden questions.** Define terms inline; assume beginner with dev terms unless used in-session. (Carry s055.)
- **Don't normalize-on-save what you can solve at read time.** When the user behavior is "case shouldn't matter," compare lowercased everywhere. (Carry s055.)
- **Don't add server-side email allowlists for what's actually a Claude-discipline rule.** The pre-launch staff-email rule applies to ME, not to the backend. (Carry s055.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carry s053. ~60% false-positive rate at re-rank.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carry s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carry s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist `{Sarvi, JR, john@johnrichmond.ca}`. (Carry s050.)
- **Don't hedge on tradeoffs without measurement.** (Carry s049.)
- **Don't call pre-launch dormant code "dead code".** (Carry s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carry s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carry s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carry s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carry s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carry s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carry s045.)

## Blocked

- **Apps Script v2.30.2 paste-deploy** -- `23ad13b` committed + pushed; live still v2.30.1 until JR pastes Code.gs. Behavior unchanged so safe to defer; functional state identical. Since 2026-05-03.
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration) -- since 2026-05-03
- iPad print preview side-by-side -- since 2026-04-26
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- **All 4 s057 features were Plan-Mode + manual execution, not `/coding-plan`.** The mobile triangle bug was 1-file simple. The other 3 were multi-file but well-scoped enough for direct execution after Plan approval. `/coding-plan` would have been overhead.
- **Day Status data model is event-based.** `unavailable` joins `meeting | pk | sick` in `EVENT_TYPES`. The cell render path treats it identically to default-unavailability (grey pill, blocks edits) but storage is per-(emp, date) -- the employee's recurring availability is never touched. The status is bidirectional: select Working in the Day Status control to revert.
- **Day Status mutex.** Sick and Unavailable are mutually exclusive. The 3-state segmented control surfaces this visually -- you can't be both. Selecting either Sick or Unavailable mutes the Work/Meeting/PK pills below.
- **Long-press hook + LongPressCell pattern.** The `useLongPress` hook is generic; the `LongPressCell` wrapper exists because hooks can't be called inside a `.map()` loop. Future per-cell touch-timing features should reuse this wrapper.
- **`unavailable` is excluded from `visibleEvents` at every cell render site.** It's a status, not a displayable event. EventGlyphPill renders any EVENT_TYPES entry -- without the filter, the "Unavailable" pill would render alongside an "OFF" glyph. When adding any future status-only event type, mirror this filter pattern.
- **Hours computation now skips `unavailable` AND `sick`.** `getEmpHours` and `computeWeekHoursFor` (App.jsx) both check `e.type === 'sick' || e.type === 'unavailable'`. The `unavailable` event is saved with default 11AM-7PM start/end times (so the underlying record is well-formed) but contributes 0h.
- **`withDocumentLock_` is the single source of truth for the doc lock + 10s timeout** (post v2.30.2 paste). All state-mutating handlers + batchSaveShifts use the same helper. Never call it from inside an already-locked function (non-reentrant).
- **Mine tab works correctly when checked as the actual employee.** JR is `isOwner` so his Mine is empty by design (Owner-exclusion). The s055 "Mine tab missing shifts" bug was JR viewing his own empty Mine while testing for Sarvi. Per-user view bugs require logging in as that user (or capturing their session state).
- **Test Admin fixture exists for future smokes.** `johnrichmond007+testadmin@gmail.com / TestA7`, id `emp-1777826090926`, currently Inactive + Staff role. Reactivate + re-promote to Admin via the JR admin Edit form when needed. Plus-addressing routes to JR's primary inbox so future email features stay within the pre-launch staff-email allowlist. Documented in `reference_smoke_logins.md`.
- **Migration is research-complete + vendor-locked.** Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED.
- **AWS SES = SMTP for password-reset blast at Phase 4 T+1:10.**
- **Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line.** Per s044 DECISIONS.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **AGENTS.md is canonical post v5.2 bootstrap.**
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `marquetry. attractor dynamics.`.
2. `git log --oneline -8` should show `s057 handoff`, then `23ad13b`, `e53768e`, `9ae5ed8`, `33438e6`, `2ef5aa7` (s056 handoff), `39c55e0`, `4a227d0`, `7abe364`.
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 1 commit awaiting paste. Live = `7abe364` v2.30.1. Source HEAD has `23ad13b` v2.30.2 (refactor only, behavior unchanged).
5. `grep -nE "withDocumentLock_\(\(\) => {" backend/Code.gs` should hit 7 sites: helper definition + 16 wrap call sites + the new `batchSaveShifts` wrap (post v2.30.2). `grep -nE "tryLock\(10000\)" backend/Code.gs` should hit 1 site only -- inside `withDocumentLock_` (the inline `tryLock` in batchSaveShifts is removed).
6. `grep -nE "EVENT_TYPES.*unavailable|type === 'unavailable'" src/` should match `src/constants.js` (definition), 4 cell renderers (detection + filter), `src/App.jsx` (hours + autofill + saveShift), `src/modals/ShiftEditorModal.jsx` (state seed + saveUnavailable).
7. Test Admin: `johnrichmond007+testadmin@gmail.com / TestA7`, id `emp-1777826090926`, Active=false, isAdmin=false (Staff). Reactivate + re-promote when needed; never log in as Test Admin while Inactive (login will fail).
8. AGENTS.md is canonical; shims rarely need repair.
9. Plan files for this session: `~/.claude/plans/admin-unavailable-override.md` (Day Status), `~/.claude/plans/woolly-coalescing-anchor.md` (same content; harness-allocated path).

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `23ad13b` v2.30.2 -- behavior unchanged, paste-deploy pending. Optional smoke after JR pastes (open ShiftEditorModal, save a shift, confirm CONCURRENT_EDIT message format if a contention is forced).
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: pick from the Active list.

Natural continuations:

1. **JR pastes v2.30.2 to Apps Script**, then optional smoke -- open a cell editor, save a shift, confirm normal flow (CONCURRENT_EDIT only fires under concurrent saves, hard to force; trust the refactor since behavior unchanged).
2. **Onboarding email on new-employee creation** -- raised earlier, still in TODO. Should ride with the FirstnameL default-password reveal in the welcome body. Frontend: `saveEmployee` insert path triggers a one-time email; backend: new action `sendOnboardingEmail`. Bundle with the existing onboarding-email TODO.
3. **BCC otr.scheduler@gmail.com on schedule distribution emails** -- ~5 lines backend + 1 line frontend, single commit. Easy small win.
4. **Migration Phase 0** when JR sets ship decision -- Supabase project + DDL + RLS + `store_config` seed.
5. **EmailModal v2 + PDF attach** -- bigger lift, parked.

Open with: ack the 4 features shipped + ask which Active item to pick first. Default if not specified is **(2) onboarding email** since it's been parked across multiple sessions and JR has flagged it as a real launch-blocker.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
