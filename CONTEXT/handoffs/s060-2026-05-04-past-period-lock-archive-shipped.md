# s060 -- 2026-05-04 -- Past-period edit lock + Employees archive shipped + audit fixes pushed

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

kintsugi. renormalization.

Pass-forward: backend v2.32.1 audit fixes pushed locally as `59d25c1` but awaiting JR paste-deploy; frontend audit fixes are live in production.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `942481d` on `main`, clean except CONTEXT/TODO + DECISIONS modified by this handoff write (commit + push in Step 7). 7 session commits beyond s059 handoff `48d50a6`:
  - `7fb3417` backend v2.32.0 (gate + 3 archive actions + new sheet)
  - `6850ca3` frontend canEditShiftDate helper + cell mirror + modal guard
  - `4f2cabf` Erase action UI in EmployeeFormModal
  - `8f6d204` Archived Employees viewer panel (owner-only)
  - `f7e8c4a` TODO log
  - `59d25c1` backend audit fixes v2.32.1 (timezone, idempotency, truthy isOwner, silent strip)
  - `942481d` frontend audit fixes (cursor + tooltip + autoFocus + payload strip)
- **Apps Script live deployment:** v2.33 = source `7fb3417` (v2.32.0). **v2.32.1 (`59d25c1`) is committed but NOT paste-deployed.** Live backend has the CRITICAL timezone bug at period boundaries (false-blocks non-owner edits at local midnight to ~4am the first day of every period) until JR pastes.
- **Active focus end-of-session:** all v2.32 work shipped + smoke-verified at production for the v2.32.0-deployed surface; v2.32.1 audit fixes await paste-deploy. Pick next from `CONTEXT/TODO.md` Active list; "JR paste-deploys backend audit fixes (v2.32.1)" is the natural next pickup.
- **Skills used this session:** `/coding-plan` (full Phase 0-9 walk; Phase 7 auto-smoke via agent-browser), 1 background `general-purpose` Sonnet adversarial audit, `/handoff` (this run). 0 Explore subagents.
- **Working assumption (decanted):** agent-browser smoke driver cannot drive Google Sheet UI, so smoke matrix items 2/3 (Sarvi-tier simulation requiring `pastPeriodGraceDays=7` Sheet edit on test admin's row) were deferred. Sarvi's actual production behavior is verified by JR + Sarvi after live cutover, not by automated smoke.

## This Session

**Continuation theme: bundled feature -- past-period edit lock + Employees archive + Erase action -- across 4 ship commits + 2 audit-fix commits + 1 TODO log = 7 commits.**

**Plan + execution:**
- Plan: `~/.claude/plans/velvet-mixing-ripple.md`. Predecessor: none (zero file-overlap matches in `~/.claude/plans/`).
- Phase A (backend v2.32.0 commit `7fb3417`) -> JR paste-deploy gate (Apps Script v2.33 + Employees `pastPeriodGraceDays` column + Sarvi=7 + new EmployeesArchive tab with 27-col schema).
- Phase B (frontend mirror commit `6850ca3`): new `src/utils/canEditShiftDate.js`; `handleCellClick` guard (desktop + mobile); ShiftEditorModal read-only banner + disabled Save.
- Phase C (Erase action UI commit `4f2cabf`): admin1-tier Erase button + type-to-confirm modal in `EmployeeFormModal`.
- Phase D (Archived Employees viewer commit `8f6d204`): owner-only "Archive..." menu item + `ArchivedEmployeesPanel` with restore + purge-eligible badge.
- Phase E push: 4 commits to origin/main.

**Smoke (agent-browser CLI, prod):**
- 7/7 PASS. F1 cell lock visible (cursor + tooltip + no modal on click). F2 ShiftEditorModal banner code-verified. F3 Test Admin no-grace blocked. F4 Erase button visible to admin1. F5 Erase confirm + archive flow + bonus archive panel verified. F6 Test Guy non-admin sees no Erase. F7 0 console errors. Cleanup: Test Admin + Test Guy back to Inactive; Erase Test 1 archived (no longer in Active list).

**Adversarial audit (Sonnet 4.6 background subagent against the 4 ship commits):**
- 1 CRITICAL + 2 HIGH + 1 MED + 3 LOW + 1 pre-existing-bug-surfaced. All 7 actionable findings shipped:
  - **CRITICAL** `canEditShiftDate_` timezone mismatch (UTC parse vs local-midnight `PAY_PERIOD_START`) -> new `parseLocalDate_` helper + `Utilities.formatDate(.., scriptTimeZone)` for `todayStr`. Without fix, non-owner edits at local-midnight to ~4am on every period-start day were false-blocked.
  - **HIGH** `archiveEmployee` + `unarchiveEmployee` not atomic -> idempotency check on destination sheet before re-append; `try/catch` around `deleteRow` with `deleteWarning` surfaced in response.
  - **HIGH** `isOwner === true` strict-eq could fail if Sheet column stored text -> switched to `!!` truthy. (Tradeoff flagged below; matches existing codebase pattern at lines 1181/2147/2148/2178/2336.)
  - **MED** non-owner `saveEmployee` AUTH_FORBIDDEN on no-op owner-only field submit (pre-existing) -> backend silent-drops on no-op; frontend pre-strips owner-only fields when caller isn't owner (defense in depth).
  - **LOW** `cursor: 'auto'` on locked-with-shift cells -> `cursor: not-allowed` for all locked states.
  - **LOW** missing `title="Past period locked"` tooltip on locked cells.
  - **LOW** no `autoFocus` on Erase + hard-delete confirm inputs -> Input primitive extended; `autoFocus` added at both call sites.
- 2 documentation flags (skipped): plan-vs-code drift on owner OR-branch (no bug); `batchSaveShifts` redundant `periodDates` iteration (no bug, future-safe).

**Carry-forward audit (Anti-Patterns):**
Prior s059 handoff carried 27 anti-patterns; new driver v6.1 rule (1500-char cap, 5-session window, `(origin: sNNN)` tagging). Decisions:
- **Anti-Patterns prune:**
  - graduated: none (LESSONS over ceiling 68,794/25k; deferred until LESSONS archive)
  - dropped (origin >= 5 sessions back, didn't surface, covered by code/memory): "coding-plan-smoker after driver swap" (s058, baked in by smoker rewrite); "skip plan after AskUserQuestion" (s055, covered by /coding-plan workflow); "jargon-laden questions" (s055, covered by global comm-shape rule); "server-side allowlist for Claude-discipline" (s055, covered by `feedback_no_staff_emails_pre_launch`); "audit B2 findings" (s053, stale); "audit mobile-only scope" (s052, stale); "conflate desktop and mobile smokes" (s051, stale); "email non-allowlisted pre-launch" (s050, covered by memory); "hedge tradeoffs without measurement" (s049, covered by `feedback_no_tradeoffs_preferred`); "pre-launch dormant code is dead code" (s048, covered by `feedback_prelaunch_dormant_code`); "Cloudflare Worker as default edge" (s046, stale); "iterate Object.values events to summarize" (s045, stale); "bundle hotfixes" (s056, internalized into /coding-plan commit-isolation discipline)
  - kept: "lpDebug instrumentation deployed but data-gated" (origin s059), "smoke per-user as JR's account" (origin s057, re-affirmed -> bumped to s060), "Test Guy reactivation rotates password" (origin s059, re-affirmed -> bumped to s060), "scrollintoview before click off-screen" (origin s058), "THEME.accent.green doesn't exist" (origin s058), "escHtml doesn't exist in Code.gs" (origin s058), "bisect UI stale by assuming backend silent-fail" (origin s058), "broadcast state via React fiber setters" (origin s057), "status-only event type without filtering" (origin s057), "pattern-match smoker findings against backend invariant" (origin s056), "normalize-on-save what read can solve" (origin s055), "24h part-time weekly cap warning" (origin s047, durable product rule), "paste-then-deploy silently" (origin s045 re-affirmed -> s060), "new sheet column without manual-header-write" (origin s046 re-affirmed -> s060), "shrink desktop schedule name col below 160px" (origin s045)
- **Hot Files prune:** s059 had 10 entries. Dropped any not touched this session. Kept files this session actually edited or that remain hot for next session.

**Memory writes:**
- `CONTEXT/TODO.md`: anchor `vermilion. attractor dynamics.` -> `kintsugi. renormalization.`. Active strikes: past-period edit lock + Employees archive items shipped. Sadie active reframed (archive supersedes defensive filter). New: bug-report email pipeline (s060 raised by JR; deferred); non-owner add-employee silent-failure (now fixed by 942481d). Verification: Apps Script live updated to `7fb3417` v2.32.0 / deployment v2.33; v2.32.1 PENDING paste-deploy. Trim block absorbed onboarding entry (2026-05-03).
- `CONTEXT/DECISIONS.md`: 1 new entry "Past-period edit lock: identity-keyed grace, not tier-keyed; 3-state employee lifecycle with archive sheet". Rationale captures the 3 flavors weighed in-session and why time-window grace + identity-keyed beat the alternatives.
- `CONTEXT/LESSONS.md`: not touched (over ceiling carry; would compound bloat). Conflict surfaced: line 187 rule says `=== true` strict-eq required; codebase reality is `!!` widespread. Next session decides retire vs update.
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; new actions follow existing action-map pattern; new helper file is local).

**Audit (Step 3):**

`Audit: clean (4 pre-existing soft-warns: MD041 schema-comment shape on TODO + DECISIONS; MD034 bare URLs at TODO L39/L77; LESSONS over ceiling 68,794/25k carry from s059; LESSONS atomicity 61-hit soft-warn carry from s059. New this session: LESSONS L187 rule contradicts codebase pattern -- flagged for next-session retire/update.)`

**Decanting:**
- **Working assumptions:** smoker can't drive Google Sheet UI (only the app's own admin UI). Caused matrix items 2/3 to defer. Worth surfacing because the next "verify Sarvi tier behavior" task will hit the same wall.
- **Near-misses:** orphan-shift defensive client-side filter -- considered as the alternative to archive's snapshot path; permanently retired this session by Decision 7 in the plan. Will not re-tempt.
- **Naive next move:** "v2.32.1 backend audit fixes are live in production." Wrong. Backend audit fixes are committed + pushed (`59d25c1`) but await JR's paste-deploy. The deployed Apps Script (v2.33) is `7fb3417` = v2.32.0 source = bugs still live for non-owner users at period boundaries. JR's awakes-time paste-deploy is the gate.

## Hot Files

(origin tags: sNNN = session of first appearance; (re-hot sNNN) = bumped this session)

- `backend/Code.gs` -- v2.32.0 + v2.32.1 source. Gate helper `canEditShiftDate_` + `parseLocalDate_` (above `saveShift`). 3 new actions `archiveEmployee` / `unarchiveEmployee` / `hardDeleteArchivedEmployee` (after `saveEmployee`). Action-map wiring at line 493. v2.32.1 in header. (origin: s060)
- `src/utils/canEditShiftDate.js` -- new helper, 30 lines, mirrors backend gate. Used by `handleCellClick` + `ShiftEditorModal` + `ScheduleCell`. (origin: s060)
- `src/modals/ArchivedEmployeesPanel.jsx` -- new owner-only viewer, ~130 lines. Restore + purge-eligible badge. (origin: s060)
- `src/modals/EmployeeFormModal.jsx` -- Erase button + type-to-confirm modal added. autoFocus on confirm input. (origin: s060)
- `src/components/ScheduleCell.jsx` -- locked-cell visual: `cursor: not-allowed` + `title="Past period locked"`. (origin: s060)
- `src/components/primitives.jsx` -- Input primitive extended to forward `autoFocus` + `className`. (origin: s060)
- `src/App.jsx` -- 3 archive API call wires; archive panel state + mount; owner-only Archive menu item; serializeEmployeeForApi pre-strip when not owner; deleteEmployee deprecation comment. (origin: s060)
- `~/.claude/plans/velvet-mixing-ripple.md` -- approved plan, all phases executed.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/reference_smoke_logins.md` -- Test Guy `TestG2`, Test Admin `TestA7`. Neither rotated this session.

## Anti-Patterns (Don't Retry)

- **Don't assume v2.32.1 backend audit fixes are live -- they're committed but not paste-deployed.** Apps Script deployment is v2.33 = `7fb3417` source = v2.32.0; the timezone bug + idempotency gap + saveEmployee silent-strip are still bugs in production until JR pastes. (origin: s060)
- **Don't compute `todayStr` via `new Date().toISOString().split('T')[0]` when comparing to local-time `PAY_PERIOD_START`.** UTC vs local-midnight mismatch causes off-by-one at period boundaries. Use `Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')` instead. The audit's CRITICAL-1 finding fixed this; carry the rule. (origin: s060)
- **Don't smoke matrix items that require Sheet edits via the agent-browser smoker.** It can drive the app's admin UI but not the bound Google Sheet UI. Sarvi-tier simulation requiring `pastPeriodGraceDays=7` cell edit is a JR-manual or Sheet-via-API path. (origin: s060)
- **Don't assume `lpDebug` instrumentation isn't deployed when no logs surface.** Source confirmed in production; gate is `LongPressCell enabled={cellEvents.length >= 2}`. JR phone-smoke needs a real multi-event cell. (origin: s059)
- **Don't smoke a per-user feature against JR's account expecting per-user data.** JR is `isOwner` -- bypasses gates and has empty Mine. Use Test Admin (admin1) or Test Guy (non-admin) for per-tier coverage. (origin: s057, re-affirmed s060)
- **Don't reactivate Test Guy without budgeting for password rotation.** Set-Your-Password modal mandatory on every reactivation; update `reference_smoke_logins.md` post-smoke. (origin: s059)
- **Don't `click @eN` on agent-browser refs without `scrollintoview` first when the target is below the modal viewport.** Silent miss otherwise. (origin: s058)
- **Don't paste-then-deploy Apps Script changes silently.** Plan must split backend code-commit + manual-paste gate explicitly. (origin: s045, re-affirmed s060)
- **Don't add a new sheet column without a deploy + manual-header-write checklist.** EmployeesArchive sheet creation this session followed the rule. (origin: s046, re-affirmed s060)
- **Don't shrink the desktop schedule name column below 160px.** Truncation cascade breaks legibility. (origin: s045)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** Durable product rule. (origin: s047)

## Blocked

- **JR paste-deploy of v2.32.1 backend audit fixes.** Source `59d25c1` pushed; Apps Script deployment still v2.33 = v2.32.0. Per the Phase A.gate pattern: paste `backend/Code.gs` over the editor's `Code.gs`, save, Deploy -> Manage deployments -> Edit pencil -> New version -> Deploy. No sheet ops needed (schema unchanged from v2.32.0).
- Long-press regression on multi-event mobile cells -- still awaiting JR phone-smoke. Since 2026-05-04.
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration). Since 2026-05-03.
- iPad print preview side-by-side. Since 2026-04-26.
- 0d3220e PDF legend phone-smoke. Since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix. Since 2026-04-14.
- Payroll aggregator path 1. Since 2026-04-12.
- Amy ADP rounding rule discovery (Sarvi-asks-Amy). Since 2026-04-26.
- S39.4 mobile admin extraction (blocked by admin state -> context provider refactor).

## Key Context

- **3 employee states now coexist.** Active (`active=true, deleted=false`), Inactive (`active=false`), Archived (row in `EmployeesArchive`). The legacy `deleted=true` flag is deprecated for new flows but readable for back-compat.
- **`pastPeriodGraceDays` is the gate field.** Per-employee numeric column in Employees tab. Sarvi=7, default 0, owner bypasses entirely. Granted via Sheet edit, no code change.
- **Erase = admin1 tier. Restore + Hard-delete = owner only.** Hard-delete additionally gated on 5-yr `archivedAt` retention + name match.
- **No auto-purge.** Archived rows past 5 yr surface "Purge eligible" badge in owner-only Archived Employees panel. JR clicks to manually hard-delete.
- **Snapshot-on-archive supersedes the orphan-shift defensive filter.** Backend backfills `employeeName`/`employeeEmail` into shift rows missing them at archive time. Schedule history renders without an archive lookup. The s058 defensive filter idea is permanently retired.
- **agent-browser CLI is the canonical smoke driver.** Skill at `~/.claude/skills/agent-browser/`. `coding-plan-smoker` consumes it. Console + network + ref-snapshot all supported. `scrollintoview @eN` is required before `click @eN` for off-screen targets. Cannot drive Google Sheet UI.
- **Test Admin password:** `+testadmin@gmail.com / TestA7`. **Test Guy password:** `testguy@testing.com / TestG2`. Neither rotated this session.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `kintsugi. renormalization.`.
2. `git log --oneline -9` should show `s060 handoff`, then `942481d`, `59d25c1`, `f7e8c4a`, `8f6d204`, `4f2cabf`, `6850ca3`, `7fb3417`, `48d50a6` (s059 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. Apps Script deployed = v2.33 = `7fb3417` source = v2.32.0. Source has v2.32.1 (`59d25c1`); paste-deploy needed for the audit fixes to go live.
5. `grep -c "canEditShiftDate_\|parseLocalDate_\|archiveEmployee\|unarchiveEmployee\|hardDeleteArchivedEmployee" backend/Code.gs` should be >= 25 (helper + gate + 3 actions + action-map wires).
6. `grep -nE "canEditShiftDate" src/utils/canEditShiftDate.js` should hit one export.
7. `agent-browser --version` should report 0.26.x.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: v2.32.1 backend audit fixes pushed but not paste-deployed. JR's awakes-time paste-deploy is the gate. After paste-deploy, smoke #1 is the timezone fix at a period-boundary date (Apr 20 2026 was the smoker's missed boundary; pick a current period-boundary day).
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open; long-press phone-smoke still in JR's court.
- (c) Top active TODO: "Past pay-period edit lock + Employees archive" item -- now in Completed. Next active is "BCC otr.scheduler on schedule sends" (small) or "Sadie cleanup" (small).

Natural continuations:

1. **JR paste-deploy v2.32.1 backend.** Open Apps Script editor with otr.scheduler account, paste `backend/Code.gs`, Deploy -> Manage deployments -> Edit -> New version -> Deploy. No sheet ops needed (schema unchanged). After deploy, JR can smoke the timezone fix on a current period-boundary date.
2. **Sadie cleanup.** Re-create Sadie's row in Employees, then Erase via the new admin1 Erase action. Snapshot fires on her existing shift rows.
3. **BCC otr.scheduler on schedule distribution emails.** Small (~5 lines backend + 1 line frontend). Backend update can ride along with the v2.32.1 paste-deploy if bundled.
4. **JR phone-smoke the longpress instrumentation.** Set `localStorage 'lp_debug'='1'` on phone, reload, long-press a multi-event cell, copy `[useLongPress]` lines.
5. **LESSONS archive pass.** Move oldest entries to `CONTEXT/archive/lessons-archive.md` to bring file under 60% of 25k ceiling. Multi-step; defer until JR has bandwidth. Carry from s059.
6. **LESSONS L187 rule retire/update.** Existing rule says `=== true` strict-eq; codebase reality at lines 1181/2147/2148/2178/2336 is `!!` widespread. Either retire the rule or update with the codebase's actual storage assumption (boolean checkbox cells, not text).

Open with: ack the v2.32.1 fixes await paste-deploy; ask whether JR has paste-deployed yet OR which Active item to pick first. Default if not specified is **(1) JR paste-deploy** since it's the immediate ship-residue blocker.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
