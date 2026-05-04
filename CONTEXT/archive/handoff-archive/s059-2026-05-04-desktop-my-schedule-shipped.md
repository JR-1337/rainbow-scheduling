# s059 -- 2026-05-04 -- Desktop My Schedule modal + 3 quick-fixes + smoker rewrite + longpress instr

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

vermilion. attractor dynamics.

Pass-forward: long-press regression awaits JR's phone-smoke against multi-event cells; everything else shipped + smoke-verified at production.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `7c0bf9f` on `main`, will be `s059 handoff` after Step 7. 11 session commits beyond s058 handoff `d768566`:
  - `48db3c4` login default-pw hint copy fix
  - `fb3861d` TODO log for login fix
  - `e3090e4` Day Status `Working` -> `Available` rename
  - `c1a6aee` TODO log for Day Status rename
  - `c726379` desktop period-nav Future/Past/Current label parity
  - `961422f` TODO log for period-nav parity
  - `aac976d` longpress lpDebug instrumentation (Phase A)
  - `d86e949` MyScheduleModal + myScheduleShape helper (Phase B)
  - `dcfe87f` admin account-menu wiring (Phase C)
  - `0c81705` employee header refactor to dropdown (Phase D, +56 net)
  - `535da13` MobileMySchedule consumes shared helper (Phase E)
  - `ec62e8f` empty-state copy hotfix (mobile parity)
  - `7c0bf9f` TODO log for s059 work
- **Apps Script live deployment:** `c817f07` v2.31.1 (paste-deployed 2026-05-03 by JR; confirmed live this session). All onboarding email backend stack intact. No backend changes this session.
- **Active focus end-of-session:** desktop My Schedule shipped + smoke-verified; longpress regression ball is in JR's court (phone-smoke against deployed `lpDebug` instrumentation). Pick next from `CONTEXT/TODO.md` Active list; "Past pay-period edit lock -- design discussion" is the natural next pickup.
- **Skills used this session:** `/coding-plan` (full Phase 0-9 walk; Phase 7 auto-spawn worked because the smoker agent was rewritten earlier this session), `EnterPlanMode` x1, `ExitPlanMode` x1, `/handoff` (s059 now). 0 Explore subagent runs; direct Read/Grep covered the surface.
- **Tooling work:** rewrote `~/.claude/agents/coding-plan-smoker.md` to drop 19 Playwright MCP tools and use Bash + agent-browser CLI (with the s058 `scrollintoview` guard baked in). Restores `/coding-plan` Phase 7 auto-smoke. JR confirmed file-only edit was sufficient (no git repo at `~/.claude/`).

## This Session

**Continuation theme: 3 small quick-wins from the s058-raised TODO list, then a meticulous /coding-plan run for desktop My Schedule + Mine helper extraction + longpress instrumentation. First Phase-7 auto-smoke since the agent-browser swap. 6 plan commits + 1 hotfix + 4 standalone commits = 13 git commits net.**

**Quick-wins shipped (in order):**

- `48db3c4` login default-password hint copy fix at `src/components/LoginScreen.jsx:130`
  - Old: "First time? Use your employee ID as password" (wrong since v2.27.0 FirstnameL switch)
  - New: "First time? Your default password is your first name and last initial with no space, e.g. JohnR"
  - Single-line frontend-only edit; build PASS; Vercel auto-deploy
- `e3090e4` Day Status segmented control rename at `src/modals/ShiftEditorModal.jsx:602`
  - Visible label `Working` -> `Available` to match the semantic of `Sick` / `Unavailable` (state, not action) and avoid the redundancy with the underlying `work` cell
  - Internal token `dayStatus === 'working'` unchanged so no downstream call sites break
- `c726379` desktop period-nav label parity at `src/App.jsx:2204`
  - Mirrored the mobile `Current Period` / `Future` / `Past` sublabel onto desktop admin header period-nav
  - 10px font, cyan/purple/muted color tokens matching mobile

**Smoker agent rewrite (earlier this session):**

- Edited `~/.claude/agents/coding-plan-smoker.md` to drop all 19 `mcp__playwright__browser_*` tools from frontmatter, keep `Read, Bash`, and rewrite the body to map each old MCP call to its agent-browser CLI equivalent
- Baked in the s058 `scrollintoview @eN` guard rule (silent miss if target below modal viewport scroll-fold)
- File-only edit -- no git repo at `~/.claude/`; JR-confirmed option 1 (leave it global by virtue of location)
- This unblocked the `/coding-plan` Phase 7 auto-smoke later in the session

**`/coding-plan` run (plan: `~/.claude/plans/jazzy-foraging-riddle.md`):**

- 5 phases shipped + 1 hotfix:
  - Phase A `aac976d` -- `lpDebug` helper + 5 instrumentation calls in `src/hooks/useLongPress.js` (touchstart, cancel, move-cancel, fire, fire-complete), gated on `localStorage.getItem('lp_debug') === '1'`. Production users see no console noise.
  - Phase B `d86e949` -- new `src/utils/myScheduleShape.js` helper (~80 lines, plain objects only, no JSX) + new `src/modals/MyScheduleModal.jsx` (~200 lines, click-to-expand accordion, multi-open default-collapsed, Esc/click-outside/X close)
  - Phase C `dcfe87f` -- admin account-menu wiring at `App.jsx:2284` (new `Calendar` icon item at top of dropdown above `Add Employee`)
  - Phase D `0c81705` -- `views/EmployeeView.jsx` desktop header refactored from inline button row to avatar-button-opens-dropdown matching admin pattern. Net +56 lines (within +90 budget). 3 menu items: My Schedule, Change Password, Sign Out.
  - Phase E `535da13` -- `MobileMySchedule` migrated to consume `buildMyScheduleShape`. Old inline `getWeekShifts` + `myTimeOffDates` blocks deleted. Intentional divergences (mobile shortLabel vs modal label; mobile truncate vs modal wrap) commented in code.
- Hotfix `ec62e8f` -- mobile empty-state copy fix. Phase E broadened the empty-condition logic from "no shifts" to "no shifts AND no events AND no time-off" but the string itself didn't follow ("No shifts scheduled this period" stayed). Synced to "Nothing scheduled this period" matching the modal's matching empty-state.

**Smoke results (Phase 7 auto-spawn, agent-browser CLI):**

- F1 desktop admin My Schedule: PASS. Avatar dropdown shows new `My Schedule` item at top; modal opens with `Apr 20 - May 3` period header; empty state "Nothing scheduled this period" confirmed (hotfix copy live); X / backdrop / Esc all close cleanly. 0 console errors.
- F2 desktop employee My Schedule: PASS. Refactored header is now an avatar dropdown (no separate Change Password / Logout buttons); 3 items in correct order (My Schedule, Change Password, Sign Out); modal opens scoped to Test Guy. 0 console errors.
- F3 mobile Mine regression: PASS. Migrated MobileMySchedule renders identically to pre-refactor; empty-state copy now reads "Nothing scheduled this period" (was "No shifts scheduled this period" pre-hotfix). 0 console errors.
- F4 longpress instrumentation: INDETERMINATE (not FAIL). Source confirmed deployed in production (`grep` against `/assets/index-*.js` would surface `lpDebug`). `LongPressCell` only attaches touch listeners when `enabled={cellEvents.length >= 2}`; current Apr 20 - May 3 period has zero multi-event cells, so no instrumentation can fire. JR's phone test against real multi-event days (any staff member with meeting+PK on same day) will surface the `[useLongPress]` log lines.
- F5 cleanup: PASS. Test Guy back to Inactive. `lp_debug` flag left in browser localStorage per plan.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor refreshed `gamboge. predictive coding.` -> `vermilion. attractor dynamics.`. Active list struck 4 items shipped (login pw hint, Day Status rename, desktop period-nav parity, the s058 long-press+Mine combined entry). New slim long-press-only entry replaces the combined one with diagnosis decision tree for JR's phone-smoke. Completed prepended 4 entries (s059 desktop My Schedule + 3 quick-wins). Trim block updated to absorb 4 oldest 2026-05-03 entries (v2.30.2 refactor, Day Status segmented, mobile long-press s057, mobile violations triangle). Verification block updated: Apps Script live now `c817f07` v2.31.1 paste-deployed; v2.31.1 PENDING line removed.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/reference_smoke_logins.md`: Test Guy password rotated `TestG` -> `TestG2` during F2 smoke (Set-Your-Password modal mandatory on every reactivation). History line extended to note s059 rotation.
- `CONTEXT/DECISIONS.md`: not touched. Desktop My Schedule placement / interaction pattern is plan-locked but not a durable cross-session principle worth a DECISIONS entry.
- `CONTEXT/LESSONS.md`: not touched (still over ceiling 68,794/25k from prior sessions; nothing this session graduated).
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; new modal follows existing modal pattern; helper extraction is local).
- `~/.claude/agents/coding-plan-smoker.md`: rewritten in place (file-only edit; no git repo there).

**Audit (Step 3 of HANDOFF):**

`Audit: clean (LESSONS over-ceiling 68,794/25k carry from prior sessions; nothing this session graduated; pre-existing TODO MD041 + MD034 + LESSONS atomicity 61-hit soft-warns carry from s058. Session-introduced em-dashes + Unicode right-arrows fixed in 2 spots on TODO.md.)`

**Decanting:**

- **Working assumptions:** none session-novel. The smoke-driver assumption (agent-browser via Bash) carries from s058 and was reinforced by the smoker rewrite this session.
- **Near-misses:** none would re-tempt next session. All plan alternates are documented under Tradeoffs in `~/.claude/plans/jazzy-foraging-riddle.md` (bolt-on vs refactor employee header; bundle longpress+My Schedule; mobile-shaped fallback for desktop modal; period-nav inside modal). The plan locked each.
- **Naive next move:** "Long-press doesn't fire because the lpDebug instrumentation didn't deploy." Wrong. Smoker verified instrumentation IS deployed. The actual gate is data: `LongPressCell` only attaches touch listeners when `enabled={cellEvents.length >= 2}`, and the current Apr 20 - May 3 period has zero multi-event cells. JR's phone-smoke must target a real multi-event day (any real staff with meeting+PK on same day) for the instrumentation to fire. If the next session reads "lp_debug doesn't work" they should NOT touch the hook -- they should look for multi-event cells in the data first.

## Hot Files

- `src/modals/MyScheduleModal.jsx` -- new file (~200 lines). Click-to-expand day rows with chevron, multi-open, default all collapsed, today row tinted purple. Consumes `buildMyScheduleShape`. Mounted in `App.jsx` (admin) and `views/EmployeeView.jsx` (employee desktop).
- `src/utils/myScheduleShape.js` -- new helper (~80 lines). Returns plain-object per-day shape. Consumed by both `MobileMySchedule` and `MyScheduleModal`. Future event-type adds land here once.
- `src/MobileEmployeeView.jsx` -- `MobileMySchedule` migrated (commits `535da13` + `ec62e8f`). Empty-state copy now "Nothing scheduled this period". Inline shape-building deleted.
- `src/views/EmployeeView.jsx` -- desktop header refactored to avatar-dropdown pattern (commit `0c81705`, +56 net). 3 dropdown items: My Schedule, Change Password, Sign Out. Click-outside handler via `useEffect` + `useRef`.
- `src/App.jsx` -- admin account dropdown extended with `My Schedule` item at top (commit `dcfe87f`); `myScheduleOpen` state + modal mount near other modals. Period-nav parity at `:2204` (commit `c726379`) shows Current/Future/Past sublabel matching mobile.
- `src/hooks/useLongPress.js` -- `lpDebug` helper + 5 instrumentation calls gated on `localStorage 'lp_debug'='1'`. Source comment block documents the flag for future maintainers. JR phone-smoke is the next step.
- `src/components/LoginScreen.jsx` -- default-password hint at `:130` updated to FirstnameL pattern (commit `48db3c4`).
- `src/modals/ShiftEditorModal.jsx` -- Day Status `Working` label renamed to `Available` at `:602` (commit `e3090e4`); internal `dayStatus === 'working'` token unchanged.
- `~/.claude/agents/coding-plan-smoker.md` -- rewritten to use Bash + agent-browser. No more Playwright MCP tools. `scrollintoview` guard documented.
- `~/.claude/plans/jazzy-foraging-riddle.md` -- the approved plan. Phase A through E executed; Phase F smoke completed.
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/reference_smoke_logins.md` -- Test Guy password current value `TestG2`. Rotates on every smoke that reactivates the row.

## Anti-Patterns (Don't Retry)

- **Don't assume `lpDebug` instrumentation isn't deployed when no logs surface on phone.** The instrumentation is in production. The actual gate is `LongPressCell enabled={cellEvents.length >= 2}` -- if the current period has no multi-event cells, no listener attaches and no log fires. Diagnose data first; touch the hook last. (s059 naive-next-move.)
- **Don't smoke a per-user feature against JR's account expecting per-user data.** JR is `isOwner` so his Mine + My Schedule are empty by design. Use Test Admin or Test Guy for per-user smokes. (Carry s057 `feedback_view_as_actual_user.md`; reinforced this session when F1 modal expand/collapse couldn't be exercised.)
- **Don't reactivate Test Guy without budgeting for password rotation.** Set-Your-Password modal is mandatory on every reactivation; the credential drifts every smoke session. Update `reference_smoke_logins.md` post-smoke with the new value. (s059 observation.)
- **Don't `click @eN` on agent-browser refs without `scrollintoview` first when the target is below the modal viewport.** (Carry s058.)
- **Don't assume `coding-plan-smoker` works after a smoke-driver swap.** (Carry s058 -- now resolved by this session's rewrite, but the pattern of "check the agent definition's tool list before assuming portability" stays.)
- **Don't assume `THEME.accent.green` exists.** (Carry s058.)
- **Don't assume `escHtml` exists in `backend/Code.gs`.** (Carry s058.)
- **Don't bisect a "UI indicator stale after action" bug by assuming backend silent-fail.** (Carry s058.)
- **Don't broadcast a state object to all matching React fiber setters when probing UI state.** (Carry s057.)
- **Don't write a plan file to a custom path and expect ExitPlanMode to find it.** (Carry s057.)
- **Don't add a status-only event type without filtering it out of the displayable-events filter at every cell renderer.** (Carry s057.)
- **Don't bundle hotfixes into batch paste-deploys when isolated rollback matters more than fewer paste cycles.** (Carry s056.)
- **Don't pattern-match smoker findings as authoritative when they cross a backend invariant.** (Carry s056.)
- **Don't skip the plan after AskUserQuestion answers come back.** (Carry s055.)
- **Don't ask jargon-laden questions.** (Carry s055.)
- **Don't normalize-on-save what you can solve at read time.** (Carry s055.)
- **Don't add server-side email allowlists for what's actually a Claude-discipline rule.** (Carry s055.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carry s053.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carry s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carry s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** (Carry s050.)
- **Don't hedge on tradeoffs without measurement.** (Carry s049.)
- **Don't call pre-launch dormant code "dead code".** (Carry s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carry s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carry s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carry s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carry s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carry s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carry s045.)

## Blocked

- **Long-press regression on multi-event mobile cells -- awaiting JR phone-smoke** -- instrumentation `aac976d` deployed; needs JR to set `localStorage 'lp_debug'='1'` on phone, reload, long-press a real multi-event cell (any staff member with meeting+PK on same day), copy `[useLongPress]` log lines back. Diagnosis decision tree in TODO.md Active. Since 2026-05-04.
- **Apps Script v2.31.1 paste-deploy** -- RESOLVED 2026-05-03 (paste-deployed by JR earlier this session).
- **`coding-plan-smoker` agent uses Playwright MCP** -- RESOLVED 2026-05-04 (rewritten to use Bash + agent-browser).
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration) -- since 2026-05-03.
- iPad print preview side-by-side -- since 2026-04-26.
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check.
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14.
- Payroll aggregator path 1 -- since 2026-04-12.
- Amy ADP rounding rule discovery -- since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor.

## Key Context

- **Desktop My Schedule lives in the account menu, NOT as a tab.** JR-confirmed both desktop admin (3-tab nav: schedule | comms | requests) and desktop employee (2-week-tab nav) keep their existing tab structures. The modal is a focused per-user view, accessed via the avatar dropdown on either side.
- **Single shared component (`MyScheduleModal`) consumed twice.** Same props shape on admin + employee mounts. Same dates window. The component is read-only -- no save/skip pair, just X/Esc/click-outside close.
- **Single shared shaping helper (`buildMyScheduleShape`).** Mobile + desktop derive per-day shape from one source. Future event-type additions land in one file. Intentional rendering divergences (mobile shortLabel vs modal label; mobile truncate vs modal wrap) are commented in the migrated MobileMySchedule code.
- **Long-press instrumentation is data-gated.** Logs only fire when a user touches a `LongPressCell` that's `enabled={cellEvents.length >= 2}`. JR's smoke needs a real multi-event cell -- the demo data on Apr 20 - May 3 doesn't have any. Sarvi's typical roster has meetings + PK on overlapping days; pick a day with both for the smoke.
- **agent-browser CLI is the canonical smoke driver across all 3 harnesses.** Skill at `~/.claude/skills/agent-browser/`. `coding-plan-smoker` rewritten to consume it. Console + network + ref-snapshot all supported. `scrollintoview @eN` is required before `click @eN` for off-screen targets.
- **Test Guy password rotates every smoke.** Current value `TestG2`; check `reference_smoke_logins.md` before guessing. The Set-Your-Password modal is mandatory on every reactivation -- can't be dismissed.
- **Migration is research-complete + vendor-locked.** Phase 0 = Supabase project ca-central-1 Pro tier + DDL + RLS + `store_config` seed. Pre-cutover gates remain CLOSED.
- **AWS SES = SMTP for password-reset blast at Phase 4 T+1:10.**
- **Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line.** Per s044 DECISIONS.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **AGENTS.md is canonical post v5.2 bootstrap.**
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `vermilion. attractor dynamics.`.
2. `git log --oneline -14` should show `s059 handoff`, then `7c0bf9f`, `ec62e8f`, `535da13`, `0c81705`, `dcfe87f`, `d86e949`, `aac976d`, `961422f`, `c726379`, `c1a6aee`, `e3090e4`, `fb3861d`, `48db3c4`, `d768566` (s058 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. Apps Script live = `c817f07` v2.31.1 paste-deployed 2026-05-03. No backend pending.
5. `grep -nE "MyScheduleModal|myScheduleOpen" src/App.jsx` should match the state, mount, and admin-menu wiring (4+ hits).
6. `grep -nE "buildMyScheduleShape" src/utils/myScheduleShape.js src/modals/MyScheduleModal.jsx src/MobileEmployeeView.jsx` should hit one export site + 2 import/call sites.
7. `grep -c "lpDebug" src/hooks/useLongPress.js` should be >= 6 (helper + 5 call sites).
8. `agent-browser --version` should report 0.26.x. `claude mcp list | grep -i playwright` should return nothing.
9. `grep -c 'mcp__playwright' ~/.claude/agents/coding-plan-smoker.md` should return 0 (smoker uses Bash + agent-browser).
10. Plan file for this session: `~/.claude/plans/jazzy-foraging-riddle.md`.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: longpress `lpDebug` instrumentation deployed but data-gated -- needs JR phone-smoke against a real multi-event cell to fire log lines.
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: "Past pay-period edit lock -- design discussion" (s058-raised) -- 3 design flavors to weigh (Owner-only / Admin1-tier / Time-window grace) before live cutover; touches the same backend gate as the orphan-shift defensive filter and the soft-delete archive feature.

Natural continuations:

1. **JR phone-smoke the longpress instrumentation.** On phone, DevTools console -> `localStorage.setItem('lp_debug', '1')` -> reload -> long-press a cell that has 2+ events on it (any staff member with meeting+PK on same day). Copy `[useLongPress]` log lines back. Diagnosis decision tree in TODO.md Active line for the longpress regression. ~5 min on JR's side; next session diagnoses from logs.
2. **Past pay-period edit lock design discussion.** s058-raised; 3 flavors documented in TODO.md. Owner-only is simplest but Sarvi loses retroactive-fix authority; Time-window grace is most common in payroll-grade software. Decide before live cutover. Bundle with orphan-shift defensive filter and soft-delete archive design conversation.
3. **Sadie orphan-shift cleanup.** s058-raised; immediate fix is delete her future shifts from the Sheet UI; broader design question is whether to add a defensive filter (skip shifts whose `employeeId` isn't in active employees array) or surface admin-side warning before any hard-delete.
4. **BCC otr.scheduler@gmail.com on schedule distribution emails.** Easy small win (~5 lines backend + 1 line frontend, single commit).
5. **Migration Phase 0** when JR sets ship decision -- Supabase project + DDL + RLS + `store_config` seed.

Open with: ack the desktop My Schedule shipped + JR-confirmed via smoke, ask whether JR has done the longpress phone-smoke yet OR which Active item to pick first. Default if not specified is **(2) past-period edit lock design** since it's the largest blocker for live cutover. Long-press is JR's-court action; don't pull next session forward unless logs are in hand.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
