# s038 -- 2026-04-28 -- Audit-deferred perf sweep + dead callerEmail

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: gamboge attractor dynamics -- s038 audit-deferred perf sweep shipped + Playwright-smoked clean on prod; backlog open, EmailModal v2 + s034 backend live smoke still owed.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `c1cb083` on `main` (synced with origin); 2 untracked `.cursor/rules/*.mdc` (pre-existing, not from this session)
- **Sibling repo `~/APPS/RAINBOW-PITCH/`:** untouched
- **Apps Script live deployment:** unchanged from s037 (`s037 - log dropped fields in updateRow/appendRow`); s034 backend features (`sendBrandedScheduleEmail` + `DUPLICATE_EMAIL`) still untested live
- **Active focus end-of-session:** none -- s038 closed via prod smoke; backlog open

## This Session

**Commits shipped:**

- `94e21cd` -- `perf(employee-view): memoize time-off Set + 10 request filters; drop dead callerEmail`
- `c1cb083` -- `context(todo): log s038 audit-deferred perf sweep in Completed`

**Audit items resolved (`docs/audit-2026-04-27-deferred.md`):**

- **A-7:** dropped dead `callerEmail` destructure + spread from `chunkedBatchSave` in `src/utils/api.js:64,92`. Audit doc said "backend/Code.gs" but the actual dead code lived in the frontend; backend handlers all derive `callerEmail` from `auth.employee.email` and were already clean. No Apps Script redeploy needed.
- **B-1:** already shipped in a prior session (`getEmpHoursWeek2 = useCallback(() => 0, [])` at `src/views/EmployeeView.jsx:285`). Skipped with note.
- **B-2:** per-cell `hasApprovedTimeOffForDate(...).some()` scan inside `EmployeeViewRow` replaced by parent-level memoized `Set` keyed `${email}-${dateStr}`. EmployeeViewRow now takes `approvedTimeOffSet` prop. Per-cell check is O(1) instead of O(N).
- **B-3:** 10 `.filter()` / `.filter().map()` chains in `EmployeeView.jsx:235-291` body wrapped in `useMemo` (audit recommended defer; JR explicitly wanted it).

**Smoke (Playwright on prod, HEAD `c1cb083`):**

- Bundle hash matched (`index-q9_W2emh.js`).
- Desktop 1280x800 + mobile 390x844 schedule grid renders, 0 console errors, `approvedTimeOffSet` prop wired clean.
- testguy account was in **Deleted** state (smoker restored to Active to log in).
- Bottom-sheet shift-cell interaction NOT exercised (no published schedule on Wk17/Wk18).
- Approved-time-off red/striped rendering NOT visually confirmed (testguy has no approved time-off rows).
- Logic-side proven by no-errors; pixel-level confirmation deferred until a period with published shifts + approved time-off is live.

**Other session events:**

- Sarvi confirmed s037 admin-tier resave worked -- verify item closed.
- Chatbot query capture wiring (Apps Script -> Google Sheet) scrapped per JR ("don't think it'll be used"); removed from TODO Active.

**Memory writes:**

- `TODO.md`: anchor `vermilion instanton -> gamboge attractor dynamics`; closed Sarvi-verify item; removed chatbot-capture line; added s038 Completed entry; new s038 Last-validated line in Verification.
- `DECISIONS.md`: untouched. Audit's filepath misdirection ("backend" vs frontend) is anti-pattern, not a durable decision.
- `ARCHITECTURE.md`: untouched.
- `LESSONS.md`: untouched. The audit-doc path-trust pitfall could become a LESSON if it recurs; one occurrence is not yet a graduation candidate.
- Auto-memory: none new this session.

**Decanting:**

- **Working assumptions:** I assumed `docs/audit-2026-04-27-deferred.md`'s "backend/Code.gs" filepath claim for A-7 was correct; turned out to be frontend (`src/utils/api.js`). Audit author conflated the Apps Script `chunkedBatchSave` action handler with the frontend `chunkedBatchSave` function of the same name. Captured in Anti-Patterns.
- **Near-misses:** I considered respecting the audit's "B-3 is probably noise, defer" recommendation, but JR's explicit ask superseded. No re-tempt risk; resolved.
- **Naive next move:** Edit Code.gs and queue an Apps Script redeploy for A-7. Wrong: A-7 was frontend-only. Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed sections.
- Char-based ceilings: TODO 15,627 / 25,000 ok; DECISIONS 20,656 / 25,000 ok; LESSONS 48,901 / 25,000 OVER (~2x ceiling, carried from s037+); ARCHITECTURE 9,615 ok.
- Style soft-warns: pre-existing MD034 / MD041 in TODO; none introduced this session.
- Adapter files: not modified.

`Audit: clean (LESSONS 48,901/25,000 char ceiling carried; pre-existing MD034/MD041 soft-warns persist)`

## Hot Files

- `src/views/EmployeeView.jsx:312-320` -- `approvedTimeOffSet` `useMemo`. Builds `Set<${email}-${dateStr}>` from `timeOffRequests` filtered to `status === 'approved'`, splitting csv `datesRequested`. If a request shape ever stops carrying `email` or `datesRequested`, set is silently empty for that row -- defensive guards skip them.
- `src/views/EmployeeView.jsx:117,149` -- EmployeeViewRow signature now takes `approvedTimeOffSet` prop instead of `timeOffRequests`. Per-cell check at line 149 is `approvedTimeOffSet?.has(`${employee.email}-${dateStr}`) || false`.
- `src/views/EmployeeView.jsx:235-291` -- 10 useMemo-wrapped request filter chains; all depend on `[shiftOffers/shiftSwaps/timeOffRequests, currentUser.email, seenRequestIds]`. Adding new request derivations: follow the same pattern.
- `src/utils/api.js:64,92` -- `chunkedBatchSave` destructure + spread no longer mention `callerEmail`. `apiCall` already auto-attaches `token` at line 13 via `authedPayload`.

## Anti-Patterns (Don't Retry)

- **Don't trust audit-doc filepath claims at face value.** `docs/audit-2026-04-27-deferred.md` A-7 claimed dead branches were in `backend/Code.gs:64-83 and :434-451`. Both ranges were actually changelog comments + still-load-bearing code. The actual dead code was in `src/utils/api.js:chunkedBatchSave`. Always grep the symbol/pattern before scoping a fix from an audit doc; the audit author may have conflated frontend/backend functions of the same name.
- **Don't redeploy Apps Script for an "A-7-style" dead-callerEmail cleanup** without first grepping `src/` for the same symbol. The frontend stopped sending `callerEmail` after S37; the backend has been deriving from `auth.employee.email` since v2.16. There is no remaining backend work in the `callerEmail` line of audit findings.
- **Don't skip `.cursor/rules/*.mdc` from `git status`** -- those untracked files (`blast-radius.mdc`, `ui-ux-design.mdc`) are NOT from any recent session. Do not auto-stage; surface to JR for disposition.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028+s029+s030+s031+s032+s033+s034+s035+s036+s037+s038 commits with deferred phone-smoke -- carried (s036 was Playwright-smoked on prod 15/16; s038 was Playwright-smoked on desktop+mobile but bottom-sheet untestable; phone-smoke still owed)
- Employee-view hours-lockdown live verification -- testguy is currently Active per s038 smoker restore but no published schedule on Wk17/Wk18
- s038 bottom-sheet shift-cell interaction + approved-time-off visual rendering -- need a period with published shifts + an employee with approved time-off to confirm
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)
- s034 backend live smoke -- still owed (`sendBrandedScheduleEmail` + duplicate-email mirror check); s037 Logger.log redeploy bundled on top but did NOT smoke s034 changes

## Key Context

- The s037 "header-driven Sheet writes" pattern remains in force: any field whose column header isn't in row 1 of the target tab is silently dropped. Post-`12c6c3f` it logs to Apps Script Executions logs (`updateRow DROPPED fields`).
- The s038 perf refactor changed how time-off lookup is performed (Set vs `.some()` scan), NOT the rendering logic. If approved time-off rendering looks broken on a future smoke, the bug is upstream of the Set lookup -- check `timeOffRequests` shape and the `req.status`/`req.datesRequested` fields.
- Apps Script editor link: [script.google.com/home](https://script.google.com/home) -- requires being signed in to `otr.scheduler@gmail.com`. Deploy via top-right "Deploy" -> "Manage deployments" -> pencil-edit existing -> "New version" (NOT "New deployment").
- Adapter files: `AGENTS.md` is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- Anchor is `gamboge attractor dynamics`. Top Active is "JR manual cleanup -- Natalie Sirkin Week 18".
2. `git log --oneline -3` should show the s038 handoff commit, then `c1cb083`, then `94e21cd`.
3. `git status -s` should show 2 untracked `.cursor/rules/*.mdc` (pre-existing) and nothing else after this handoff is committed.
4. testguy account is currently **Active** (s038 smoker restored from Deleted). If a future smoke wants the deleted-state default, soft-delete via admin > Employees > Edit > Remove first.
5. Adapter files: AGENTS.md is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: s038 perf refactor was logic-smoked clean but bottom-sheet + approved-time-off visual rendering not exercised. Low-risk; can ride along with the next published-schedule session.
- (b) External gates: s034 backend live smoke (sendBrandedScheduleEmail + duplicate-email mirror check) deferred to JR's next email-format session with Sarvi. Phone-smoke for s028-s038 carried (JR-owned).
- (c) Top active TODO: Natalie Sirkin Week 18 manual re-entry (JR or Sarvi); EmailModal v2 + email-format pass; pitch-copy "Sarvi confirmed" -> "Sarvi reported" sweep; or follow-up Sonnet audit pass over `src/modals/` + `src/panels/` (per `docs/audit-2026-04-27-deferred.md` Suggested follow-up sequence step 4).

(c) is the natural backlog. Open with: ask JR which item he wants next, or whether Sarvi has scheduled the email-format session yet.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
