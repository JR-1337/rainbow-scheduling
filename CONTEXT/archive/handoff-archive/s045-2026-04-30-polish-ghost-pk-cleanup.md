# s045 -- 2026-04-30 -- polish + ghost-PK cleanup

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: cinnabar twistor -- s045 polish wave shipped (auth fix verified prod, ghost PK rows fixed, PDF -> legal, name col tuning done); tree clean, Phase 0 entry still awaits JR's ship window.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `12fe831` on `main` (synced with origin; 7 fix commits this session); working tree clean before this handoff write.
- **Apps Script live deployment:** in sync with repo for the s045 auth fix (`sendBrandedScheduleEmail`) -- JR pasted + redeployed mid-session, prod smoke PASS. The s044 `bulkCreatePKEvent` kill (`a8ccaa8`) still drifts on live; cosmetic, cutover decommissions.
- **Active focus end-of-session:** ad-hoc bug + UX polish wave done. Migration is still research-complete + vendor-locked, awaiting JR's Phase 0 ship window. Phase 4 password-reset blast pre-condition (`sendBrandedScheduleEmail`) is now closed.
- **Skills used this session:** `/handoff` (s045 now).

## This Session

**Continuation of s043/s044 same calendar day. Started as `sendBrandedScheduleEmail` smoke (Phase 0 pre-condition closure); cascaded into a polish wave once JR surfaced UX + data-hygiene asks.**

**Commits shipped (7):**

- `95249d0` -- fix(events) bundle (5 distinct fixes folded for cohesion):
  - **Auth-shape fix in `backend/Code.gs`**: `sendBrandedScheduleEmail` was reading `authResult.success` / `.data` against `verifyAuth`'s actual `{authorized, employee}` return shape -- silent no-op in prod. Replaced with `auth = verifyAuth(payload, true)` + `if (!auth.authorized) return { success: false, error: auth.error };` (canonical pattern from sibling sites). Folded the manual `isAdmin` gate into `verifyAuth(payload, true)`. **Smoke verified in prod after JR pasted + redeployed live Apps Script** (deployment ID `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu...`). Closes the s042-flagged Phase 4 cutover pre-condition.
  - **`EmailModal.jsx` contact filter**: `adminContacts` now filters to `PRIMARY_CONTACT_EMAIL` (Sarvi) instead of every non-Owner admin.
  - **PDF all-shift greying**: `src/pdf/generate.js:153` -- `shiftCellFill = G.fillZebra` always (was admin/titled-only).
  - **`PKDetailsPanel` rewrite**: was the only surface iterating raw `Object.values(events)` without active-employee filtering -- surfaced ghost "PK booked" rows for soft-deleted employees on the May 9 banner. Rewrote to mirror `PKModal` REMOVE: iterate active employees x period dates, read `events[empId-dateKey]`, resolve names from live `emp.name` (no longer trust stale `ev.employeeName` text). Threaded `employees` prop through 4 callsites (App.jsx desktop admin x2, EmployeeView desktop emp, MobileEmployeeView mobile emp via `MobileMySchedule`).
  - **`deleteEmployee` + `saveEmployee` deactivate cascade**: new `getFutureEventDates` / `formatFutureEventsBlockMessage` helpers in `utils/employees.js`; both deletion paths now block when active employee has future events (PK/meeting/sick), parallel to the existing future-shifts block. **Stops new orphans from being created.**

- `4bbd012` -- PK panel: dropped names list, kept `date . time . N booked` only. Names were truncated to 3 + "+N more" anyway -- not actionable; staff scan their own grid row for the indicator.

- `2921c8d -> 6d32586` -- desktop schedule name col round-trip 240 -> 160 -> 80 -> 160. 80 was too narrow (last name wraps awkwardly + name truncates). Settled at 160. Same `2921c8d` also bumped `EmployeeRow` last-name from `text-[10px]` to `text-[11px]` (kept smaller than first name, but readable).

- `477bdb3` -- `violations.js` consecutive-days warning threshold 5 -> 6. Sarvi answered the long-deferred question (was Blocked since 2026-04-14).

- `b120241 -> 12fe831` -- PDF `@page` A4 -> letter -> legal portrait. Confused middle step: JR initially answered "yes" to letter when asked "letter or other?" but clarified "paper is 8.5 x 14" = legal. Final state: legal portrait with 5mm margins (~77mm more vertical room than A4).

**Sheet scrub (JR-side, manual, mid-session):**

- Hard-deleted from `Employees` tab: TEST-ADMIN1-SMOKE, Test Manager, Smoke Duplicate Test, Test Collision Check (s032 + earlier smoke residue; soft-deleted long ago, never erased).
- Hard-deleted matching orphan `pk` rows from `Shifts` tab (May 9 ghosts + any other rows tied to those 4 deleted IDs).
- Confirmed visually post-deploy + hard refresh: `PKDetailsPanel` no longer surfaces the ghost row.
- Closes the long-standing `JR to manually delete TEST-ADMIN1-SMOKE...` Active TODO line.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `kintsugi instanton` -> `cinnabar twistor`. Removed `sendBrandedScheduleEmail` Active item (resolved). Removed `JR to manually delete TEST-ADMIN1-SMOKE` Active item (done). Removed `Consecutive-days 6+ warning -- waiting on Sarvi` Blocked item (delivered). Added s045 to Completed; trimmed s040 entry (now in `<!-- Older Completed -->` index marker).
- `CONTEXT/DECISIONS.md`: untouched (this session was tactical, no durable architectural pivots).
- `CONTEXT/LESSONS.md`: untouched (still 68,794/25k carried).
- `CONTEXT/ARCHITECTURE.md`: untouched.

**Decanting:**

- **Working assumptions**: events live in the `Shifts` tab keyed by `${employeeId}-${date}` with a `type` column (`work`/`pk`/`meeting`/`sick`). No FK cascade in Sheets -- soft-deleted employees keep their event rows by design. The `getFutureEventDates` helper added this session encodes the access pattern, but the underlying "Sheet has no cascade" assumption is durable architectural knowledge -- if a future session adds another delete-style action, this trap re-emerges. (Did not promote to ARCHITECTURE.md to avoid bloat; the helper + future-event block pattern is now in code.)
- **Near-misses**: 80px desktop name col (2921c8d). Looked clean in build output, was visually too narrow once deployed -- last name line wraps badly when name is multi-syllable. Reverted. Don't try going below 160px on the desktop schedule name column.
- **Naive next move**: "paste latest `backend/Code.gs` into live Apps Script editor". Not needed -- the only backend change this session was the auth fix, and that was pasted + redeployed mid-session. Repo + live are in sync for everything except the s044 `bulkPK` kill (cosmetic).

**Audit (Step 3):**

- Schema-level: clean. TODO + DECISIONS schema headers present.
- Char ceilings: TODO 17,952 / 25k OK (after edits); DECISIONS 21,364 / 25k OK; LESSONS 68,794 / 25k STILL OVER (carried); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; DECISIONS MD041/MD032/MD012 carried; em-dash drift in archived entries carried.
- Adapter files: not modified.

`Audit: clean (LESSONS 68,794/25,000 char ceiling carried; MD041 + MD032 + MD034 + MD012 style soft-warns carried)`

## Hot Files

- `src/components/PKDetailsPanel.jsx` -- now requires `employees` prop; iterates active x dates only; resolves names from live `emp.name`. If a future surface needs PK summarization, copy this filter pattern (do not iterate `Object.values(events)` blind).
- `src/utils/employees.js` -- new `getFutureEventDates` / `formatFutureEventsBlockMessage` exports; pair them with `getFutureShiftDates` whenever blocking employee deletion / deactivation.
- `src/App.jsx` (`deleteEmployee` ~L864 + `saveEmployee` ~L826) -- both deletion paths now block on future events. Mirror the pattern in any new admin-side deletion flow.
- `src/constants.js` -- `DESKTOP_SCHEDULE_NAME_COL_PX = 160`. Don't drop below 160; 80 was too narrow.
- `src/pdf/generate.js` -- `@page legal portrait`, `shiftCellFill = G.fillZebra` (uniform). Layout assumes 8.5 x 14.
- `backend/Code.gs` -- `sendBrandedScheduleEmail` now uses canonical `auth = verifyAuth(payload, true) + auth.authorized` shape. Live Apps Script in sync.

## Anti-Patterns (Don't Retry)

- **Don't iterate `Object.values(events)` to summarize events for display.** Filter through active employees first (`for (emp in active) { events[empId-dateKey] }`). The blind iteration surfaces ghost rows tied to soft-deleted employees -- this exact bug just shipped on `PKDetailsPanel` and was the root cause of the May 9 banner lying.
- **Don't shrink the desktop schedule name column below 160px.** 80px was tested visually -- last name wraps badly, name truncates. 160 is the floor.
- **Don't paste-then-deploy Apps Script changes silently.** When `backend/Code.gs` is touched, JR pastes into the live editor + redeploys. Without redeploy the `/exec` URL serves the frozen prior version, producing "fixed but not fixed" confusion. Surface the redeploy step explicitly.
- **Don't auto-purge orphan event rows from the sheet.** Per `feedback_no_silent_removal`. Surface the residue, let JR scrub manually (or write an explicit admin-UI action).
- **Don't trust handoff continuations to mean live = repo.** Repo can have backend deltas (e.g., the s044 `bulkPK` kill) that haven't been pasted into Apps Script. Always re-check before relying on a backend change being deployed.

## Blocked

Same set as s044 minus the resolved `Consecutive-days 6+` item:

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker cache -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is still research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier ($25/mo, no PITR), apply DDL from `02 §1-§5`, install 14 RLS policies from `05 §3-4`, seed `store_config`. Per `09 §3`. Pre-cutover gates now CLOSED (`sendBrandedScheduleEmail` smoke = PASS this session).
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Set up + verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`. Latest bundle hash post-`12fe831`: `index-Xy89UnHQ.js` + `generate-DDHWGyfY.js` (PDF chunk).
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. Repo + live in sync for the auth fix; ~91-line `bulkPK` kill still drifts (cosmetic; cutover Phase 6 decommissions).
- AGENTS.md is canonical post v5.2 bootstrap.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `cinnabar twistor`. Top Active is the AWS SES Phase 1 setup + the migration research-complete pointer (no longer the auth-fix gate -- closed).
2. `git log --oneline -3` should show this s045 handoff commit on top of `12fe831` (PDF legal portrait).
3. `git status -s` should be clean after Step 7 commit.
4. `grep -n "authResult\.success" backend/Code.gs` should return zero matches (verifies the auth fix survived any merge).
5. `grep -n "Object\.values(events)" src/components/PKDetailsPanel.jsx` should return zero matches (verifies the panel rewrite survived).
6. testguy account currently **Active** (carried from s038).
7. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 6 frontend commits (`95249d0` through `12fe831`) had build PASS but no Playwright smoke this session. JR confirmed visually post-deploy ("looks good"). The PDF legal-paper switch awaits a real paper-print test on Sarvi's printer (kitchen-door legibility). Outstanding verify owed: prod paper-print of legal-portrait PDF.
- (b) External gates: AWS SES account setup is now the most actionable Phase 0 prep (sandbox -> production access takes 24-48h; pre-stage during Phase 1 prep window). Sarvi-asks-Amy on ADP rounding rule still open.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **JR sets a Phase 0 ship window.** All pre-conditions now closed; fresh session executes `09 §3`.
2. **Sarvi paper-print test of new legal-portrait PDF.** Confirms layout looks good on actual kitchen-door paper.
3. **AWS SES account setup.** Pre-stage Phase 1 -- create AWS account, request production access, verify domain SPF/DKIM.
4. **Real feature work** unrelated to migration (EmailModal v2 PDF attachment, Bug 4 PK 10-10am repro, deferred audit items).
5. **Stop for the day.** s045 closes a productive day; tree clean, all UX requests addressed.

Open with: ask JR which of (1)/(2)/(3)/(4)/(5) to start.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
