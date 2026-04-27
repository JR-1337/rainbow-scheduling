# s030 -- 2026-04-27 -- schedule consolidation shipped + email migration stuck on deployment-binding gotcha

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Email migration is half-shipped on prod -- frontend points at new otr.scheduler-owned `/exec` URL but backend still sends as John because Apps Script versioned deployments bind to original deployer's identity, not current script-project owner; full investigation at `docs/email-migration-investigation.md` with Path A fix steps.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `8b64f4e` on `main`. Four commits this session pushed: `f55174d`, `4e1eb3e`, `af87ff9`, `8b64f4e`. Working tree carries: `CONTEXT/TODO.md` + `CONTEXT/LESSONS.md` (this handoff's writes), `docs/email-migration-walkthrough.md` + `docs/email-migration-investigation.md` (uncommitted from earlier turn), 2 long-untracked cursor rules.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched this session.
- Active focus: email-sender migration is mid-execution on prod. Frontend is on new bundle and new URL; backend deployment is bound to John's identity, so emails still come from John. Documented fix path ready for next session.
- New OTR Gmail in use: `otr.scheduler@gmail.com`. Sheet + Apps Script ownership transferred. Deployment exists at `AKfycbznGQ...` URL, but it executes under John's auth (the gotcha).

**Working assumption:** the "Execute as: Me (otr.scheduler@gmail.com)" label in Apps Script's Manage Deployments panel is viewer-contextual UI, not authoritative for actual execution identity. Whoever the panel shows depends on who's looking. The actual binding is to the user that DEPLOYED the version -- in this case John, because the deployment row pre-dated ownership transfer (or otr's deploy attempt fell back on John's existing OAuth scopes when the auth popup errored).

## This Session

**Commits shipped (4):**

- `f55174d` -- CLEAN bucket consolidation. F2 SickStripeOverlay extracted (4 inline divs collapsed to one component). F4 inline `hasApprovedTimeOff` predicates replaced with canonical `hasApprovedTimeOffForDate` from `src/utils/requests.js` at 3 sites. F5 added `filterSchedulableEmployees` to `src/utils/employees.js` + wired through App.jsx (kept memo) + EmployeeView.jsx (added memo) + pdf/generate.js. F8 today-detection swept from `.toDateString()` to `toDateKey(date) === todayStr` at 3 sites.
- `4e1eb3e` -- PARAMETERIZABLE bucket. F1 `computeCellStyles` in `src/utils/scheduleCellStyles.js` collapses 4 cell-style ternary chains. `useOverlayForTimeOff: true` for ScheduleCell, `false` for the 3 mobile/employee paths. F3 `<EventOnlyCell size="sm|md"/>` collapses 4 eventOnly blocks. F6 `<MobileBottomNavShell/>` shared between admin + employee mobile nav. F7 `<MobileDrawerShell/>` shared shell for hamburger drawers.
- `af87ff9` -- F10 BUG fix. Stabilized week2 mobile `getEmpHours` via `useCallback` + `week2DateStrs`. Interpretation 2 confirmed by executor (both weeks sum `shift.hours` only; the audit's union-hours claim was wrong). Fix is perf/memo, not behavioral.
- `8b64f4e` -- email migration Part 5. Swapped `src/utils/api.js:6` from John's old `/exec` URL to otr.scheduler's new one. Frontend on prod confirmed pointing at new URL via curl + grep on live bundle.

**Net bundle delta (consolidation):** -4.45kB across f55174d/4e1eb3e/af87ff9 vs baseline.

**Smoke results:**

- Mobile admin (390x844, johnrichmond007@gmail.com): F6 nav 4 tabs swap correctly; F7 drawer header shows avatar + Owner pill; admin Quick Actions list rendered. Schedule grid loaded, no white-screens.
- Mobile employee (testguy@testing.com): SKIPPED -- testguy is now inactive on prod ("Account is inactive. Please contact your administrator."). JR can phone-test or reactivate.
- Desktop admin (1280x800): grid renders with 318 cells, 43 Unavailable labels (F1 + F8 working), 2 Time Off labels (F1 folded-bg + F4 canonical helper working), 0 sick (none in current period).
- Console: 0 errors, 0 warnings on every flow.
- F2 sick + F10 week2 hours: cannot visually verify on prod (no sick events in current period, no shifts populated). Code parity already confirmed via diff comparison.

**Email migration progress (Parts 1-6):**

- Parts 1-3: ownership transferred, verified via Drive file details + Apps Script dashboard owner column reading "Over the Rainbow".
- Part 4: deployment created. URL `AKfycbznGQ-pC1r48r1VDscs7Oqs0_jMZN3X3eB7h_L9ZsIXS8sYNSLEj0lUK8s1PtG5So5XoA`. Auth popup errored mid-deploy ("unable to open the file"). Deployment was published anyway.
- Part 5: `src/utils/api.js:6` swapped, build PASS, pushed at `8b64f4e`. Vercel deployed `index-C7ld0zvI.js`. Live bundle confirmed contains new `/exec` URL.
- Part 6: SMOKE FAIL. Test email at 2:05 PM (well after bundle deploy at 1:45 PM) still has `From:` reading `johnrichmond007@gmail.com`.

**4-loop investigation (per JR direction):**

- Loop 1 -- code-level: NULL. `backend/Code.gs` single `sendEmail` function with no `from:`, no dynamic sender. JR confirmed deployed code matches repo verbatim.
- Loop 2 -- Apps Script execution model: CONFIRMED. Google docs explicitly state "You cannot transfer ownership of versioned deployments. If you transfer ownership of a script project, the owner of the existing versioned deployments doesn't change." Deployment retains original deployer identity post-transfer.
- Loop 3 -- UI lying / OAuth state: CONFIRMS Loop 2. "Execute as: Me" of a shared-drive-deployed (or post-transfer) Web App "causes the web app to execute under the authority of the user that deployed it (since there is no script owner)." The Manage Deployments panel label is viewer-contextual.
- Loop 4 -- external Gmail / alias / DKIM: NULL. No external rewriting mechanism could explain the symptom. `Return-Path:` + `Received: from` headers would let JR confirm whose mailbox processed the send (diagnostic only, not a separate cause).

**Memory writes:**

- `LESSONS.md`: 1 new entry "Apps Script versioned deployments bind to original deployer, not current script owner" (582 -> 590 lines). Confidence: H -- Google docs + observed prod behavior. Captures the gotcha plus the fix-path summary plus pointers to the investigation + walkthrough docs.
- `TODO.md`: Active item #2 (email migration) status updated from "blocked on JR ownership transfer" to "IN PROGRESS, partial state on prod" with full root-cause + fix-path summary inline. Did NOT move to Completed because emails still send as John.
- `DECISIONS.md`: untouched. The migration approach is unchanged; the gotcha is a discovered constraint, captured in LESSONS not DECISIONS.
- `ARCHITECTURE.md`: untouched.
- `docs/email-migration-walkthrough.md`: shipped earlier this session (Parts 1-7 non-technical). Used during the actual migration attempt.
- `docs/email-migration-investigation.md`: shipped this session. Captures all 4 loops + working hypothesis + Path A fix + Path B fallback + diagnostic checks + revert instructions.

**Decanting:**

- Working assumptions: "Execute as: Me" panel is viewer-contextual, captured above and in handoff State.
- Near-misses: editing the existing deployment via Manage Deployments -> pencil -> bump version was the natural reflex but DOES NOT TRANSFER IDENTITY. It just bumps a version on John's deployment. Captured in Anti-Patterns.
- Naive next move: re-attempt deploy without archiving old + without manually running a function from script editor first. Will reproduce the same OAuth fall-back bug. Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed. DECISIONS + LESSONS + ARCHITECTURE all have headers.
- DECISIONS.md: 153 lines. Under 200 hard ceiling. No archival needed.
- LESSONS.md: 590 lines (was 582, +8 for new entry). Over 200 ceiling. RISK carried forward (multi-session graduation effort, not a single archival).
- Style soft-warns: pre-existing MD022/MD031/MD032/MD034/MD041 noise across docs/ and CONTEXT/; none introduced this session.
- Adapter files: untouched.

`Audit: 1 new LESSONS entry added (Apps Script versioned-deployment binding); LESSONS 590/200 ceiling carried; pre-existing style soft-warns persist`.

## Hot Files

- `docs/email-migration-investigation.md` -- READ FIRST when picking up email migration. 4-loop findings + Path A fix + Path B fallback + diagnostic checks.
- `docs/email-migration-walkthrough.md` -- non-technical Parts 1-7. Reference for re-running Part 4 (Deploy New) and Part 6 (smoke test).
- `src/utils/api.js:6` -- currently `AKfycbznGQ...` (otr's URL but bound to John). Will need swap again to next-session's fresh deployment URL.
- `backend/Code.gs:2059` -- `sendEmail` function. If Path B fallback chosen, change `MailApp.sendEmail({...})` to `GmailApp.sendEmail(to, subject, body, { from: 'otr.scheduler@gmail.com', name: 'OTR Scheduling' })`. Requires alias setup on owning account.
- `src/utils/scheduleCellStyles.js` (NEW), `src/components/{SickStripeOverlay,EventOnlyCell,MobileBottomNav,MobileDrawerShell}.jsx` (NEW), `src/utils/employees.js` (added `filterSchedulableEmployees`).
- `src/views/EmployeeView.jsx` -- F10 stabilization commit + biggest consolidation footprint (also took F1 + F2 + F3 + F4 + F5 + F8).
- `CONTEXT/LESSONS.md` lines for "Apps Script versioned deployments bind to original deployer" -- consult before any future Apps Script ownership transfer.

## Anti-Patterns (Don't Retry)

- Do NOT use Manage Deployments -> pencil -> bump version to "transfer" a deployment to a new owner. That's John's deployment with a new version of John's code. Identity does NOT transfer. The only path to switch identity is to ARCHIVE old + DEPLOY NEW after re-grant.
- Do NOT trust the "Execute as: Me (otr.scheduler@gmail.com)" label in Apps Script Manage Deployments. The label is viewer-contextual; the binding is to whoever created the deployment, not whoever's currently looking at it. Use the email's `From:` header (not the script editor UI) as the authoritative test.
- Do NOT click Deploy without first running a function manually from the script editor as the new owner. The function-run is what triggers the OAuth popup. If you skip that and just click Deploy, the deployment falls back on whatever scopes were already granted to the script (John's), and the new deployment runs under John's auth.
- Do NOT redeploy from a tab where multiple Google accounts are signed in. Use incognito with the target account ONLY. The multi-account session bug routes the OAuth popup to the wrong account and produces "unable to open the file" errors -- after which Apps Script proceeds without proper auth.
- Do NOT assume the audit description is correct -- the audit's F10 description claimed week1 used `computeDayUnionHours` and week2 didn't. Direct inspection showed both weeks just sum `shift.hours`. Executor caught this. Always read the actual code before fixing.
- Carry-forwards from prior sessions: do NOT delete the OLD `/exec` URL deployment for ~7 days; staff bookmarks. Do NOT chase LESSONS.md ceiling by mass-archive (s028 carry). Do NOT trust that `Agent(...)` rejection killed subagent. Do NOT use `git add -A`. Do NOT skip hooks.

## Blocked

- **Email migration completion** -- blocked on next-session execution of Path A (archive existing deployment + force fresh OAuth + redeploy) per `docs/email-migration-investigation.md`. Will produce a new `/exec` URL requiring another `api.js` swap + push. Or fall back to Path B (one-line `GmailApp.sendEmail({from:})` change in `Code.gs`).
- A-7 dead `callerEmail` branches in `Code.gs` -- still bundled to land with email-sender Apps Script redeploy.
- Email upgrade (PDF auto-attached via MailApp) -- waits on sender migration above.
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- testguy account on prod is currently inactive (blocked smoke this session). JR may want to reactivate before next employee-side smoke.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- s028 + s029 + s030 commits all need JR phone-smoke (sick parity, Unavailable, meeting reorder, mobile shift-detail role, schedule consolidation, F10 week2 stabilization) -- carried.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14.
- CF Worker SWR cache -- since 2026-04-14.
- Consecutive-days 6+ warning -- since 2026-04-14.
- Payroll aggregator path 1 -- since 2026-04-12.
- Amy ADP rounding rule discovery -- since 2026-04-26.
- Mobile eyebrow visual verify -- needs an employee with `emp.title` populated.

## Key Context

- Three commits in the consolidation pass + one URL swap in this session. Net bundle -4.45kB; 9 of 12 audit findings shipped (F9 RISKY skipped). Plan path at `~/.claude/plans/elegant-crunching-manatee.md`.
- Investigation doc captures the email-migration gotcha in detail. The 4-loop format JR requested produced the documented Google constraint quickly: versioned deployments don't transfer ownership.
- Pricing locked s026: $1,500 implementation + $497/mo + applicable HST; 3-month fitting trial; month-to-month after trial; new features fixed-price; OTR pays all hosting providers directly.
- Sarvi is the scheduling admin and gets all request notifications. Currently those notifications are still being sent FROM John's personal Gmail (the symptom this session attempted to fix).
- Push to scheduling-app `main` is hook-gated. JR's per-task "yes" responses authorize per-commit push.
- New facts learned this session: Apps Script "Execute as: Me" panel is viewer-contextual UI, not the actual binding (Loop 3 finding); `Return-Path:` + `Received: from` headers would authoritatively confirm which mailbox sent any given email (Loop 4 diagnostic).

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is Email migration -- IN PROGRESS, partial state. Includes full root-cause + fix-path summary inline.
2. Read `docs/email-migration-investigation.md` if continuing email work -- 4-loop findings + Path A + Path B + diagnostics.
3. Read `docs/email-migration-walkthrough.md` for the click-by-click steps -- Part 4 (Deploy New) is the section to re-execute.
4. Read `CONTEXT/LESSONS.md` if preferences may affect approach -- new top entry on Apps Script versioned-deployment binding (line ~104).
5. Check git: `git log --oneline -5` shows 4 fix commits this session. Working tree carries new docs + the s029 + s030 handoffs + the 2 untracked cursor rules; commit Step 7 of this handoff will land the canonical-memory writes.
6. If JR confirms "let's try the fix path" -> execute `docs/email-migration-investigation.md` Path A: archive existing deployment, incognito as otr.scheduler, run any function from script editor (auth popup MUST appear), then Deploy -> New deployment. Send new URL back. Then update `src/utils/api.js:6` + build + push. Then re-run Part 6 smoke (trigger fresh email, check `From:` AND `Return-Path:` to confirm).
7. If Path A also fails -> switch to Path B in `Code.gs:2059`: change `MailApp.sendEmail({...})` to `GmailApp.sendEmail(to, subject, body, { from: 'otr.scheduler@gmail.com', name: 'OTR Scheduling' })`. Requires `otr.scheduler@gmail.com` set up as verified "Send mail as" alias on whichever Google account owns the deployment.
8. If switching harnesses, read shared `CONTEXT/*` first; AGENTS.md is canonical -- shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 4 commits this session need JR phone-smoke (consolidation pass + F10 stabilization). Less urgent than the active blocker.
- (b) External gates: email migration is mid-flight on prod with documented fix path. JR direct involvement required (Apps Script editor + browser auth flow).
- (c) Top active TODO: email migration completion.

(a), (b), (c) all converge on the same thing: finish the email migration. Most natural next move: ask JR (1) ready to attempt Path A on the deployment? If yes, walk through `docs/email-migration-investigation.md` Path A: incognito as otr.scheduler -> Manage Deployments -> archive existing -> editor code area -> select `sendEmail` -> Run button -> auth popup MUST appear -> Allow all scopes -> Deploy New -> send new URL. Then I swap `api.js`, push, monitor Vercel, retest with `From:` + `Return-Path:` check. If Path A also fails (auth popup still doesn't appear, or sender still wrong), pivot to Path B (one-line `GmailApp.sendEmail({from:})` change in `Code.gs`).

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
