# s062 -- 2026-05-04 -- Mobile onboarding modal mount + Modal z-index + BCC drop + deleteEmployee retired

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

scumble. attractor dynamics.

Pass-forward: RAINBOW code-side has no shipped-but-unverified work; JR is moving to RAINBOW-PITCH next session for pitch deck work.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `dba4b78` on `main` pre-handoff; 3 CONTEXT files dirty from Step 2 syncs (commit + push in Step 7). 7 session commits beyond s061 handoff `021b724`:
  - `1c2f34c` chore(frontend): drop legacy deleteEmployee + orphaned formatters
  - `7ede9a9` docs(context): log Sadie cleanup + legacy deleteEmployee drop
  - `173d949` fix(frontend): mount OnboardingEmailModal in mobile admin branch
  - `b0a6bd8` fix(frontend): bump Modal z-index above mobile bottom nav
  - `0df2165` feat(backend): drop hardcoded BCC otr.scheduler from onboarding email (v2.32.3)
  - `184ec7d` feat(frontend): drop bcc payload from sendBrandedScheduleEmail call
  - `dba4b78` docs(context): log mobile onboarding fixes + BCC drop + 6-attachments closed
  - Plus 2 commits from JR's mid-session context-system update (`a81dc07` /bootstrap upgrade v5.2->v6.2 + `2e3e0a8` /data-capture cold-start) -- these landed before my session started writing.
- **Apps Script live deployment:** v2.32.3 source `0df2165` paste-deployed by JR mid-session. Drops the hardcoded `bcc: 'otr.scheduler@gmail.com'` from `sendOnboardingEmail`; capability preserved as optional `payload.bcc` (mirrors existing `sendBrandedScheduleEmail` pattern).
- **JR-confirmed manual ops this session:**
  - Sadie cleanup path 2: re-created her row in Employees sheet (id `emp-1776186167048`), then Archived via the v2.32.2 admin1 button. Snapshot backfill on existing shift rows; future shifts auto-cleared. Closes the s058 hard-delete artifact.
  - v2.32.3 paste-deploy.
  - JR cleared to delete `seed-demo-data.gs` from the Apps Script editor (verified safe: 0 references from Code.gs to its 4 functions; no doGet/doPost; only invoked via manual editor Run button). Whether the deletion has actually happened is JR's call -- not in repo, can't verify from here.
- **Active focus end-of-session:** RAINBOW code-side closeout. JR is moving to RAINBOW-PITCH for pitch deck work next session. Sarvi is using the app today; her feedback will surface follow-up TODOs but is not gating.
- **Skills used this session:** `/handoff` (this run). 0 plan files written, 0 Explore subagents spawned -- all work was small surgical edits driven by direct evidence.
- **Working assumption (decanted):** assumed onboarding email worked on mobile because the desktop modal worked, and never inventoried the mobile branch's modal mounts. Same root cause as the s061 MobileStaffPanel scope drift -- second incident in same window prompted the LESSONS graduation this session.

## This Session

**Continuation theme: clean up s060/s061 follow-ups + JR-driven onboarding email investigation that surfaced two real bugs and one phantom -- 7 commits across 1 backend (v2.32.3) + 4 frontend ship + 2 docs.**

**Commits shipped (chronological):**

- `1c2f34c` -- legacy `deleteEmployee` retired (47-line function in `src/App.jsx:932-980` + 2 orphaned formatter helpers in `src/utils/employees.js` + unused `parseLocalDate` import). Rollback hatch from s060 plan decision 8 dropped after s061 redesign smoked clean.
- `7ede9a9` -- TODO log: Sadie cleanup + deleteEmployee drop both moved to Completed.
- `173d949` -- fix: mount `OnboardingEmailModal` in mobile admin branch. Was only mounted at App.jsx:2731 (desktop tree); mobile tap on the onboarding pill closed the form modal and rendered nothing.
- `b0a6bd8` -- fix: bump shared `Modal` primitive + `AdminRequestModal` local div from `z-[100]` to `z-[200]` to clear the mobile bottom nav (also `z-[100]`). Modal action buttons were obscured at the lower edge. Followed the precedent already set in `MyScheduleModal`.
- `0df2165` -- backend v2.32.3: drop hardcoded BCC otr.scheduler from `sendOnboardingEmail`. Refactored inline `MailApp.sendEmail({...})` to mailParams var with conditional `if (payload.bcc) mailParams.bcc = payload.bcc;` pattern -- mirrors `sendBrandedScheduleEmail` precedent. Prose comments at L65 + L361 updated to drop the "BCC otr.scheduler always" claim. Version stamp + new changelog block added at the top.
- `184ec7d` -- frontend: drop the hardcoded `bcc: 'otr.scheduler@gmail.com'` payload from `EmailModal.jsx:100`'s `sendBrandedScheduleEmail` call. Backend already conditioned on bcc presence so omitting the field skips it; capability preserved at the API boundary for future UI wiring.
- `dba4b78` -- TODO log: mobile onboarding fixes + BCC drop + 6-attachments report closed (JR retracted -- not a real bug).

**Design discussion:**

- **JR realized otr.scheduler-as-script-owner makes the BCC redundant.** Apps Script runs as the script owner (otr.scheduler per topology memory). MailApp.sendEmail files the sent copy in otr.scheduler's Sent folder automatically. BCC otr.scheduler was duplicating into otr.scheduler's Inbox. JR also confirmed johnrichmond007 was getting hit only via the pre-launch `LAUNCH_LIVE_=false` TO rewrite, not via a BCC -- self-disables when JR flips `LAUNCH_LIVE_ = true` at launch.
- **6-attachments report retracted.** JR's initial report (3 phantom inlines above body, 3 attachments below) was based on a state observed before the mobile mount + z-index fixes shipped. After fixes, JR confirmed not a real bug. Closed without code changes. Naive-next-move flag for next session: if JR says "I might be wrong, give me a sec" -- wait, do not pre-investigate.
- **seed-demo-data.gs cleared for deletion.** JR pasted the file source mid-session. It defines `seedDemoData` (entry point) + 3 helpers (`buildRoster_`, `employeeToRow_`, `buildDemoShifts_`); seeds 4 admins (incl. hardcoded passwords for Dan Carman 'daniel' and Scott 'scott') + 20 synthetic employees. Grep confirmed 0 references from Code.gs to any of its 4 function names. No `doGet`/`doPost` defined. Only invoked via manual editor Run. Triggers panel still needs JR's eyeball before deletion (anything bound to `seedDemoData` would orphan), but if clean, file is pure dead weight.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `ekphrasis. predictive coding.` -> `scumble. attractor dynamics.`. Active strikes: removed [s061] 6-attachments line (closed not-a-bug); removed [s060 carry] Sadie cleanup line (path 2 done by JR). Completed gains: BCC drop + mobile onboarding fixes + 6-attachments closed + Sadie cleanup + deleteEmployee drop entries.
- `CONTEXT/DECISIONS.md`: no new entry this session. The BCC drop is mechanic-level (captured in v2.32.3 changelog); no strategic direction change.
- `CONTEXT/LESSONS.md`: 1 new entry "Inventory mobile-parallel render surfaces in every plan touching admin UI" -- graduated from Anti-Patterns after dual s061+s062 incident. lessons_pre=23 -> lessons_post=24, delta=1, no cadence trigger.
- `CONTEXT/ARCHITECTURE.md`: backend version stamp `v2.32.2` -> `v2.32.3`. No structural changes.

**Audit (Step 3):**

`Audit: clean (5 pre-existing style soft-warns carried from s061; +1 new this session: mobile-parallel-surfaces LESSONS entry exceeds 500c per-entry cap at ~1075c -- accepted in favor of clarity over atomicity. LESSONS delta +1 < 3, no cadence trigger. DECISIONS 23.2k under 25k ceiling.)`

**Anti-Patterns prune:**

- graduated: "Don't ship a button-rename plan without inventorying mobile-parallel surfaces" (origin: s061) -> `CONTEXT/LESSONS.md` `## [PROJECT] -- Inventory mobile-parallel render surfaces in every plan touching admin UI`. Dual incident s061 + s062.
- dropped: "Don't smoke a per-user feature against JR's account" (origin: s057) -- covered by `feedback_view_as_actual_user.md` per MEMORY.md.
- dropped: "Don't add a new sheet column without deploy + manual-header-write checklist" (origin: s046) -- 5+ sessions outside window, no recurrence; re-record if next sheet column add hits.
- dropped: "Don't shrink desktop schedule name col below 160px" (origin: s045) -- 5+ sessions outside window, no recurrence; durable but not at risk under current grid stability.
- dropped: "Don't reintroduce 24h part-time weekly cap warning" (origin: s047) -- 5+ sessions outside window, no recurrence; durable product rule but not at risk of being re-added.
- kept + re-affirmed s062: "Don't paste-then-deploy Apps Script silently" (origin bumped s045 -> s062 via v2.32.3 paste this session).
- kept + re-affirmed s062: "Don't infer 'JR has no employee record' from an empty schedule grid" (origin: s061; smoker still mis-modeled this session before it was caught).
- kept: "Don't smoke matrix items requiring Sheet edits via agent-browser" (origin: s060).
- kept: "Don't assume `lpDebug` instrumentation isn't deployed" (origin: s059).
- kept: "Don't reactivate Test Guy or Test Admin without budgeting for password rotation" (origin: s059).
- kept: "Don't `click @eN` without `scrollintoview` first" (origin: s058).
- new s062: "Don't pre-investigate a bug JR flagged uncertainty about ('I might be wrong, give me a sec') -- wait for confirmation."

**Hot Files prune:**

- bumped origin to s062: `backend/Code.gs` (v2.32.3 BCC drop), `src/App.jsx` (deleteEmployee drop + mobile OnboardingEmailModal mount).
- dropped: `~/.claude/plans/tidy-mixing-beaver.md` -- s061 plan executed; no longer load-bearing.
- added s062: `src/components/primitives.jsx` (Modal z-index bump), `src/modals/OnboardingEmailModal.jsx` (mobile mount in scope), `src/modals/EmailModal.jsx` (BCC drop, may revisit for PDF v2 thread).
- kept: `src/modals/EmployeeFormModal.jsx`, `src/panels/EmployeesPanel.jsx`, `src/panels/MobileStaffPanel.jsx`, `src/utils/canEditShiftDate.js`, `src/modals/ArchivedEmployeesPanel.jsx`, `src/components/ScheduleCell.jsx`, `reference_smoke_logins.md`.

**Decanting:**

- **Working assumption:** assumed onboarding email worked on mobile because the desktop modal worked; never inventoried the mobile branch's modal mounts. Root cause of the OnboardingEmailModal-not-mounted bug. Same shape as s061 MobileStaffPanel miss; second incident in window triggered the LESSONS graduation.
- **Near-miss:** dropping legacy `deleteEmployee` would have left `formatFutureShiftsBlockMessage` and `formatFutureEventsBlockMessage` (in `src/utils/employees.js`) as orphaned dead code. Caught by grep pre-edit; included in same commit. Future "drop a function" plans should auto-grep for callers BEFORE the cut and include any helper-only-callers in the same commit. Recorded as Anti-Pattern below.
- **Naive next move:** investigating the 6-attachments bug as if real. JR's initial report was driven by misperception of the modal-not-mounted + z-index issues -- after those shipped, the report was retracted. Pattern: when JR says "I might be wrong about X, give me a sec," wait for his confirmation before pre-investigating. Recorded as Anti-Pattern below.

## Hot Files

(origin tags: sNNN = session of first appearance; (re-hot sNNN) = bumped this session)

- `backend/Code.gs` -- v2.32.3 source. `sendOnboardingEmail` (~L3060) now uses var mailParams + conditional `if (payload.bcc) mailParams.bcc = payload.bcc;` pattern. Header changelog + L65/L361 prose comments updated. (origin: s060, re-hot s062)
- `src/App.jsx` -- deleteEmployee function gone (was at L932-980); imports trimmed (formatFutureShiftsBlockMessage + formatFutureEventsBlockMessage dropped). Mobile admin branch (returns ~L2252) now mounts `OnboardingEmailModal` after the `EmployeeFormModal` mount. (origin: s060, re-hot s062)
- `src/components/primitives.jsx` -- shared `Modal` primitive `z-[100]` -> `z-[200]` to clear mobile bottom nav. All consumer modals (`PKModal`, `AdminSettingsModal`, `ChangePasswordModal`, `EmailModal`, `OnboardingEmailModal`, `ShiftEditorModal`, `ArchivedEmployeesPanel`, `EmployeeFormModal`, `EmployeesPanel`) now sit above bottom nav on mobile. (origin: s062)
- `src/modals/OnboardingEmailModal.jsx` -- mobile mount fixed; uses shared Modal primitive (z-[200]). Future iteration may add per-attachment disposition control if a real bug surfaces. (origin: s062)
- `src/modals/EmailModal.jsx` -- BCC payload dropped from `sendBrandedScheduleEmail` call. Backend still accepts payload.bcc; capability available for future UI wiring (e.g., per-recipient BCC list). (origin: s062)
- `src/modals/AdminRequestModal.jsx` -- one-off local modal div bumped z-[100] -> z-[200] for parity with primitive. (origin: s062, low-hot)
- `src/modals/EmployeeFormModal.jsx` -- single Archive button still load-bearing; receives shifts/events for count display. (origin: s060)
- `src/panels/EmployeesPanel.jsx` -- Inactive list Archive button. (origin: s061)
- `src/panels/MobileStaffPanel.jsx` -- mirror of EmployeesPanel for mobile. (origin: s061)
- `src/utils/canEditShiftDate.js` -- past-period edit gate helper. (origin: s060)
- `src/modals/ArchivedEmployeesPanel.jsx` -- owner-only viewer. (origin: s060)
- `src/components/ScheduleCell.jsx` -- locked-cell visual. (origin: s060)
- `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/reference_smoke_logins.md` -- Test Guy `TestG2`, Test Admin `TestA7`. Neither rotated this session.

## Anti-Patterns (Don't Retry)

- **Don't pre-investigate a bug JR flagged uncertainty about.** When JR says "I might be wrong about X, give me a sec" or similar, wait for his confirmation before opening the file. The 6-attachments report this session was retracted after the mobile mount + z-index fixes shipped -- the original report was misperception driven by the prior bugs, not a real attachment-handling issue. (origin: s062)
- **Don't drop a function without grepping for callers AND helpers-with-only-that-caller first.** Removing `deleteEmployee` would have orphaned `formatFutureShiftsBlockMessage` + `formatFutureEventsBlockMessage`. Auto-grep both directions before the cut so the orphan-helper drop bundles into the same commit. (origin: s062)
- **Don't infer "JR has no employee record" from an empty schedule grid.** JR's row has `showOnSchedule=false` so he doesn't appear on the grid; the row exists in Employees with `isOwner=true`. To smoke owner-only or self-only edit-modal paths, open the Employees panel (filter Active or All) -- not the schedule grid. (origin: s061, re-affirmed s062)
- **Don't paste-then-deploy Apps Script silently.** Plan or session must split backend code-commit + manual-paste gate explicitly. (origin: s045, re-affirmed s062 via v2.32.3 paste)
- **Don't smoke matrix items that require Sheet edits via the agent-browser smoker.** Cannot drive Google Sheet UI; only the app's admin UI. (origin: s060)
- **Don't assume `lpDebug` instrumentation isn't deployed when no logs surface.** Source confirmed in production; gate is `LongPressCell enabled={cellEvents.length >= 2}`. JR phone-smoke needs a real multi-event cell. (origin: s059)
- **Don't reactivate Test Guy or Test Admin without budgeting for password rotation.** Set-Your-Password modal mandatory on every reactivation; update `reference_smoke_logins.md` post-smoke. (origin: s059)
- **Don't `click @eN` on agent-browser refs without `scrollintoview` first when the target is below the modal viewport.** Silent miss otherwise. (origin: s058)

## Blocked

- **Sarvi using the app today; her feedback will surface follow-up TODOs.** External gate -- not blocking next session, but will likely shape next-next priorities. Since 2026-05-04.
- **JR phone-smoke of long-press regression on multi-event mobile cells.** Still owed since 2026-05-04.
- **JR Test Admin manual cleanup (s061 carry).** Smoker left Test Admin Active+isAdmin from s061; JR said he'd flip Inactive manually. Still uncleaned at end of s062 unless done off-session. Not blocking.
- **JR paste of LESSONS-schema-fix prompt into context-system session (s061 carry).** Self-contained prompt drafted s061; awaits JR's hand-off. Until landed kit-side, RAINBOW LESSONS is at-target (~13.2k post-s062 entry add) but the next breach window is still short.
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration). Since 2026-05-03.
- iPad print preview side-by-side. Since 2026-04-26.
- 0d3220e PDF legend phone-smoke. Since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix. Since 2026-04-14.
- Payroll aggregator path 1. Since 2026-04-12.
- Amy ADP rounding rule discovery (Sarvi-asks-Amy). Since 2026-04-26.
- S39.4 mobile admin extraction (blocked by admin state -> context provider refactor).

## Key Context

- **`Modal` primitive sits at z-[200] now.** All modals using `src/components/primitives.jsx` Modal (8 callers + EmployeeFormModal + EmployeesPanel) clear the mobile bottom nav (z-[100]). `MyScheduleModal` precedent set this pattern; s062 brings the primitive in line. `MobileDrawerShell` is also z-[200]; tied modals over drawers stack by DOM order (modal mounts later, wins).
- **OnboardingEmailModal is now mounted in BOTH branches.** Mobile admin branch has its own mount at App.jsx ~L2213 (mirrors desktop mount at ~L2731 with identical props). Future modal additions touching the admin tree must inventory both branches per the new LESSONS rule.
- **BCC otr.scheduler is dropped everywhere; capability preserved.** Backend `sendOnboardingEmail` and `sendBrandedScheduleEmail` both accept optional `payload.bcc`. Frontend currently sends none. To add per-recipient BCC later, wire it through the modal payload.
- **Pre-launch `LAUNCH_LIVE_=false` rewrites onboarding TO -> johnrichmond007.** Self-disables when JR sets `LAUNCH_LIVE_ = true` at launch (`backend/Code.gs:362`). No code change needed at flip time -- just paste-deploy.
- **`seed-demo-data.gs` is JR-cleared for deletion.** Pure dead weight (0 references from Code.gs, no doGet/doPost, only manual Run invocation). Triggers panel still needs JR's eyeball before delete.
- **Single Archive button is still the only delete-like UI.** EmployeeFormModal (admin1+, type-to-confirm) + EmployeesPanel + MobileStaffPanel Inactive list. Auto-clear universal: every Active->Inactive, Active->Archive, Inactive->Archive transition clears future shifts + events.
- **3 employee states still coexist.** Active (`active=true, deleted=false`), Inactive (`active=false`), Archived (row in `EmployeesArchive`). `deleted=true` flag is back-compat-readable; no UI writes it now (legacy `deleteEmployee` retired this session).
- **`pastPeriodGraceDays` is the gate field.** Per-employee numeric column. Sarvi=7, default 0, owner bypasses entirely.
- **Test Admin password:** `+testadmin@gmail.com / TestA7`. **Test Guy password:** `testguy@testing.com / TestG2`. Neither rotated s062.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule` -- last bit hides him from schedule grid view; row exists in Employees sheet.
- **LESSONS active file post-s062 add:** 24 entries + 1 template (~13.2k chars, under 15k target). 78 entries in `CONTEXT/archive/lessons-archive.md` from s061 archive pass.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `scumble. attractor dynamics.`.
2. `git log --oneline -10` should show: s062 handoff, then `dba4b78`, `184ec7d`, `0df2165`, `b0a6bd8`, `173d949`, `7ede9a9`, `1c2f34c`, `2e3e0a8`, `a81dc07`.
3. `git status -s` should be clean after Step 7 commit (untracked `.claude/skills/` carries from JR's mid-session context-system update; out of handoff scope).
4. Apps Script deployed = v2.32.3 source = `0df2165` (paste-deployed by JR mid-session). Schema unchanged from v2.32.0 -- no Sheet ops.
5. `grep -n "if (payload.bcc)" backend/Code.gs` should show >=2 hits (`sendBrandedScheduleEmail` existing pattern + new `sendOnboardingEmail` mirror).
6. `grep -c "deleteEmployee" src/App.jsx` should be 0 (function fully removed).
7. `grep -nE "z-\[200\]" src/components/primitives.jsx src/modals/AdminRequestModal.jsx` should show 1 hit each.
8. `grep -nE "OnboardingEmailModal" src/App.jsx` should show 4 hits (1 import + 1 desktop mount + 1 mobile mount + 1 callback wire).

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: nothing. Mobile onboarding fixes + BCC drop + deleteEmployee retirement all confirmed by JR mid-session. Sadie cleanup confirmed done.
- (b) External gates: Sarvi uses the app today -- her feedback will arrive but is not gating; JR phone-smoke of long-press still owed; JR Test Admin manual cleanup still owed; JR paste of kit-side LESSONS-schema prompt still owed.
- (c) Top active TODO: in-app bug-report button + AI investigator pipeline (raised s060), or EmailModal v2 PDF attachment (long-deferred), or app-usage instructions in welcome content. None scheduled urgent.

**JR explicitly redirects: next session is on RAINBOW-PITCH (pitch deck work), not RAINBOW code.** Open `~/APPS/RAINBOW-PITCH/` (or wherever the pitch project root lives) and read its CONTEXT/TODO.md + CONTEXT/handoffs/ for state. Carry forward from here: pitching context unchanged from s061 anchor work (pricing $497/mo + $2K post-trial + bug fixes always included; ESA single-mention; OTR cost-of-doing-nothing $30,452/yr Sarvi-confirmed; competitor analysis + pitch deck research references in auto-memory).

If the user is back on RAINBOW code, natural continuations:

1. **In-app bug-report button + AI investigator pipeline** -- per-user "Report a bug" button -> backend `submitBugReport` -> emails JR with structured payload + state capture. ~half-day for the in-app side.
2. **EmailModal v2 PDF attachment** -- generate PDF blob server-side from print-preview HTML, attach to MailApp send.
3. **App-usage instructions in welcome content** -- login URL, schedule location, default-password reveal, time-off / swap mechanics, sick/late/coverage policy.
4. **JR phone-smoke long-press instrumentation** -- `localStorage 'lp_debug'='1'` on phone, multi-event cell, copy `[useLongPress]` lines.

Default if unspecified: **(1) bug-report button** since it's the freshest concrete TODO and pairs naturally with Sarvi-feedback-arriving (her bug reports become the AI investigator's first inputs).

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
