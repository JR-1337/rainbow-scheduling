# s029 -- 2026-04-27 -- s028 audit follow-through: 4 fixes shipped + 9-item cleanup + 2 LESSONS

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Sonnet codebase audit shipped 5 commits this session (cleanup + sick parity + meeting-reorder + Unavailable copy + mobile title pill); next priority remains email-sender migration once JR completes Google account ownership transfer to `otr.scheduler@gmail.com`.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `0c44907` (C-4 mobile shift-detail role pill). Five commits this session pushed to `main`: `910278b`, `cf86f14`, `4621f7a`, `45b6abd`, `0c44907`. Working tree clean except 2 untracked cursor rules (long-untracked, leave-alone per s022).
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched this session.
- Active focus: closed 4 of 8 deferred audit items + 9-item cleanup; pitch artifacts and mobile schedule grid stable; email-sender migration is the next-session priority and stays blocked on JR's Google account ownership move.
- New OTR Gmail captured (carried from s028): `otr.scheduler@gmail.com`. Migration plan at `docs/email-sender-migration.md` ready to execute Path A once JR transfers Sheet + Apps Script ownership.

## This Session

**Audit kickoff (s028 carry-over):**

- Sonnet 4.6 read-only codebase audit ran in background, returned 17 findings across 4 categories (dead code, perf, bugs, 4-path schedule drift).
- Triage applied a blast-radius gate per finding: single-file narrow fix → ship; backend / shared util / behavior change → defer.
- 9 fixes bundled in cleanup commit `910278b` (autonomous overnight). Build PASS verified before push.
- 4 more fixes shipped this morning after JR clarifications.

**Commits shipped (5 total):**

- `910278b` -- 9-item cleanup: drop unused imports from `src/App.jsx` (Modal, GradientButton, getDayNameShort, formatDateLong, calculateHours, STAT_HOLIDAY_HOURS, STORE_HOURS), `src/MobileAdminView.jsx` (8 lucide icons + TYPE + ROLES), `src/MobileEmployeeView.jsx` (ArrowRight); kill `.toLowerCase()` no-op in MobileAdminView; rewrite `myShiftsCount` in EmployeeView to reuse memoized `allDateStrs`; add optional chaining to `req.datesRequested?.split(',')` parity in EmployeeView.
- `cf86f14` -- D-1 sick rendering on both employee-facing schedule paths (`src/views/EmployeeView.jsx` EmployeeScheduleCell + `src/MobileEmployeeView.jsx` MobileScheduleGrid). Canonical pattern from ScheduleCell + MobileAdminScheduleGrid: red diagonal stripe overlay + EVENT_TYPES.sick.bg cell + muted/strikethrough role+time + sick-note fallback + EventGlyphPill suppressed when hasSick. JR confirmed Sarvi wants all staff to see sick (not just admins).
- `4621f7a` -- doc-only update marking D-1 shipped + D-2 confirmed intentional (admin1 = real admins, admin2 = view-only management).
- `45b6abd` -- C-2 mirror backend `keyOf` in `src/utils/api.js` chunkedBatchSave. Frontend was sending 3-tuple synthetic keys for every shift type; backend uses real ID for non-singular types (meetings) so existing meeting rows got dropped from survivors and re-appended at the end of Shifts tab on every >15-shift save. Fix: singular types (work/sick/pk) keep synthetic, non-singular use real ID when present. + D-3 'N/A' replaced with 'Unavailable' in MobileAdminView (matches other 3 paths; fits 60px cell at 8px font).
- `0c44907` -- C-4 mobile shift-detail bottom sheet role pill: was using `hasTitle(currentUser)` (the viewer), fixed to `hasTitle(mobileShiftDetail.employee)` (the tapped employee's owner). Sarvi tapping Joel's shift now shows Joel's "Owner" title not Sarvi's "GM"; Sarvi tapping a cashier's shift shows the cashier's role not "GM".

**Memory writes:**

- `LESSONS.md`: 2 new entries (570 -> 582 lines).
  - "Admin1 vs admin2 access tiers are intentional, not drift" -- captured JR's clarification ("admin1 are the real admins and admin2 are management that we don't want touching anything"). Future audits should not flag hours/star/edit-affordance divergence as drift.
  - "Titled employees show their title; untitled show their role" -- titled-vs-role pill must derive `hasTitle()` from the shift owner, never the viewer.
- `TODO.md`: new s028 Completed entry with full commit list; in-app bug fix Active item updated to reference `docs/audit-2026-04-27-deferred.md`.
- `DECISIONS.md`: untouched (no new decisions this session, all work was bug-fix execution per JR direction).
- `ARCHITECTURE.md`: untouched.
- `docs/audit-2026-04-27-deferred.md`: D-1 marked SHIPPED, D-2 confirmed INTENTIONAL.
- Auto-memory: untouched.

**Smokes:**

- Build PASS at every commit (`910278b` 488.41 KB, `cf86f14` 490.57 KB, `45b6abd` 490.72 KB, `0c44907` 490.76 KB modern bundles). Vercel auto-deploy fired on each push.
- No Playwright smoke this session -- code changes were render-path additions and synthesizing key changes; build catches structural breakage but visual smoke would catch sick-overlay layering or label overflow. Defer to JR phone-test.

**Decanting:**

- Working assumptions: Sonnet's 4-path parity audit framing is now first-class. Future audits can use the 4-path schedule drift category as a template -- check ScheduleCell + MobileAdminScheduleGrid + EmployeeScheduleCell + MobileScheduleGrid for any schedule-cell behavior change.
- Near-misses: I almost left D-1 deferred indefinitely behind Sonnet's flag-out caveat ("only if employees can see sick events"). The right move was asking JR before deferring; he confirmed Sarvi's intent in one short message and the fix shipped. Lesson: when an audit finding's blast-radius hinges on user intent, ask the user, do not assume the conservative path.
- Naive next move: jumping to chatbot query capture next session would skip JR's stated email-distribution priority (carried since s027). Same warning as s028.

**Audit (Step 3):**

- Audit ran (touched `LESSONS.md` + `TODO.md` + `docs/audit-2026-04-27-deferred.md` before Step 2).
- Schema-level: clean. All required sections present in TODO/DECISIONS/LESSONS.
- DECISIONS.md: 153 lines (unchanged). Three lines over 150 ceiling; carried-acceptable position from s027.
- LESSONS.md: 582 lines (was 570). Added 12 lines for 2 new entries; ceiling violation persists. RISK still flagged. The dedicated maintenance pass is a multi-session graduation effort, not a single archival.
- Adapter files: untouched.
- Style soft-warns: pre-existing MD041/MD022/MD032/MD033 noise persists; none introduced this session.

`Audit: 2 new LESSONS entries added (admin tiers + titled employee title source); LESSONS 582/150 ceiling carried; pre-existing style soft-warns persist`.

## Hot Files

- `docs/audit-2026-04-27-deferred.md` -- READ FIRST when picking up audit work. 4 of 8 items now closed. Open: A-7, B-1, B-2, B-3.
- `docs/email-sender-migration.md` -- READ FIRST when email work resumes. Path A vs B fully spec'd.
- `src/utils/api.js:62-79` -- chunkedBatchSave keyOf now mirrors backend exactly. If backend `keyOf` in `Code.gs:1806` ever changes, mirror the change here.
- `backend/Code.gs:434-451` + `:64-83` -- A-7 dead `callerEmail` branches still present. Touch on email-sender Apps Script redeploy.
- `src/views/EmployeeView.jsx` + `src/MobileEmployeeView.jsx` -- both now have sick rendering on employee schedule paths. If sick visual behaviour changes for admins (paths 1 + 3), apply the matching change here for parity.
- `CONTEXT/LESSONS.md` lines for "Admin1 vs admin2 access tiers" + "Titled employees show their title" -- consult before any audit flag-or-fix call.

## Anti-Patterns (Don't Retry)

- Do NOT flag admin1-vs-admin2 capability divergence as drift in future audits. Admin1 (Sarvi/Joel) edit; admin2 (Amy/Dan/Scott) view only. Hours/star/affordance differences flow from this access model.
- Do NOT use `hasTitle(currentUser)` in any title-or-role render. Always `hasTitle(theShiftOwner)` -- the employee whose shift is being displayed. Grid cells already do this correctly; copy their pattern.
- Do NOT defer an audit finding when its blast-radius hinges on user intent. Ask JR with one clear question; he answered D-1 + C-4 in single sentences.
- Do NOT rewrite `chunkedBatchSave` allShiftKeys to use 3-tuple form for all types again. Backend `keyOf` distinguishes singular vs non-singular; frontend must mirror it.
- Do NOT chase the LESSONS.md 150-line ceiling by mass-archiving (carried from s028). File is densely load-bearing.
- Do NOT replace the literal `johnrichmond007@gmail.com` at `Code.gs:2280` expecting it to swap senders (carried). Seed data, not a sender.
- Do NOT trust that an `Agent(...)` rejection killed the subagent (carried lesson, still active).
- Do NOT replace customer-facing copy that wasn't approved (carried; D-3 was an exception because JR explicitly chose 'Unavailable').
- Do NOT ship sub-9px text on mobile cells (carried from s027).
- Do NOT use `table-layout: auto` for fixed-width sticky columns with unbreakable strings (carried from s027).

## Blocked

- Email + distribution overhaul -- migration plan at `docs/email-sender-migration.md`; new Gmail captured (`otr.scheduler@gmail.com`); blocked on JR Google account ownership transfer (Sheet + Apps Script project) -- since 2026-02-10. **NEAR-UNBLOCK on next JR action.**
- Email upgrade (PDF auto-attached via MailApp) -- waits on sender migration above.
- A-7 dead `callerEmail` branches -- intentionally bundled with email-sender Apps Script redeploy. Will land in same backend deploy moment.
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- s028 5-commit run needs JR phone-smoke (sick parity on employee paths + Unavailable label + meeting-row order on chunked saves + mobile shift-detail role pill) -- new this session.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Not pitch-blocking. Since 2026-04-26.
- Mobile eyebrow visual verify -- needs an employee with `emp.title` populated.

## Key Context

- Sonnet codebase audit was the second autonomous overnight task this week. Pattern works: Sonnet returns 17 facts with file:line + evidence + source class; Opus triages through blast-radius gate; safe items ship in one cleanup commit; behavior changes wait for JR's morning reads. ~12 minutes of JR time turned 17 audit findings into 5 commits + 2 LESSONS + 4 closed items.
- C-2 fix is the highest-impact ship of the session. Meeting-row reorder on every >15-shift chunked save was disrupting sort order silently. Sarvi may notice rows are stable now after the next big publish.
- D-1 sick parity unblocks a real Sarvi workflow request -- staff can see when a coworker is out without an admin telling them.
- C-4 fix is most likely to be visually confirmed by JR on his own phone since he'd be the one tapping admin shifts in the mobile employee view.
- Pricing locked s026: $1,500 implementation + $497/mo + applicable HST; 3-month fitting trial; month-to-month after trial; new features fixed-price; OTR pays all hosting providers directly.
- Push to scheduling-app `main` is hook-gated. JR's "yes commit" + "sure" responses authorize per-task push.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is email logic + schedule distribution wiring (carried). New Completed entry summarizes s028 5-commit run.
2. Read `docs/audit-2026-04-27-deferred.md` if audit work resumes -- 4 of 8 items now closed. A-7 + B-1 + B-2 + B-3 remain.
3. Read `docs/email-sender-migration.md` if email work resumes.
4. Read `CONTEXT/LESSONS.md` if pitch-copy or audit framing in scope -- 582 lines (was 570). 2 new s028 entries at the top of the React-conventions section.
5. Read `CONTEXT/DECISIONS.md` -- 153 lines (unchanged). No new decisions s028.
6. Auto-memory: untouched this session.
7. Check git: `git log --oneline -8` shows 5 fix commits this session at top + s028 handoff + s027 handoff + s027 mobile eyebrow. Working tree carries only the 2 untracked cursor rules.
8. If JR confirms email-sender ownership transfer: open `docs/email-sender-migration.md`, follow Path A steps 4-8. ALSO bundle A-7 dead `callerEmail` branch removal into the same Apps Script deploy.
9. If switching harnesses: read shared `CONTEXT/*` first; AGENTS.md is canonical -- shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 4 audit fixes + 9-item cleanup all built green but not phone-smoked. JR may want to eyeball sick rendering on his employee view and tap admin shifts to verify mobile shift-detail role pill.
- (b) External gates: JR-stated next move is email-distribution wiring. Blocked on JR completing Google account ownership transfer for `otr.scheduler@gmail.com`.
- (c) Top active TODO: email logic + schedule distribution wiring.

Most natural next move: ask JR (1) is the Sheet + Apps Script ownership transfer to `otr.scheduler@gmail.com` complete? If yes, execute `docs/email-sender-migration.md` Path A steps 4-8 (re-deploy Web App as new account, copy new `/exec` URL, update `src/utils/api.js:6`, build + push, smoke a test send), AND bundle A-7 dead `callerEmail` branch removal into the same backend deploy. (2) If transfer not yet done, surface this session's commit list early so JR can phone-smoke the 4 audit fixes while we wait.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
