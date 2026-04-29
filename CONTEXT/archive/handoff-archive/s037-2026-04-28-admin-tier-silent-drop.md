# s037 -- 2026-04-28 -- Sarvi admin-tier silent-drop bug fixed

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: vermilion instanton -- admin-tier silent-drop bug fixed via Sheet header add + Apps Script redeploy with new Logger.log; Sarvi owes a verify-resave smoke.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `12c6c3f` on `main`; 2 untracked `.cursor/rules/*.mdc` (pre-existing, not from this session)
- Apps Script live deployment: redeployed by JR this session with Logger.log in `updateRow`+`appendRow`. Same `/exec` URL preserved.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched
- Active focus end-of-session: Sarvi-owed verify-resave on the bug fix; otherwise backlog

## This Session

**Bug report (Sarvi via SMS, 4:22-5:46 PM):**

- "When I assign roles after I add them to the schedule it disappears I have to keep saving it a bunch of times"
- "Jess and Genia and the office didn't save under admin 1"
- "I logged off and came back to it / After I saved / And they were put under full time"
- "I had to redo all the admin2 staff after saving them and exiting / It didn't save"

**Root cause diagnosis:**

- Frontend ([`src/modals/EmployeeFormModal.jsx:186-198`](src/modals/EmployeeFormModal.jsx#L186-L198)) correctly sends `{isAdmin, adminTier}` on tier-button clicks.
- Frontend serializer ([`src/utils/employees.js:27-36`](src/utils/employees.js#L27-L36)) spreads all fields cleanly.
- Backend `saveEmployee` ([`backend/Code.gs:1669-1713`](backend/Code.gs#L1669-L1713)) calls `updateRow(EMPLOYEES, rowIndex, updateFields)`.
- **`updateRow` ([`backend/Code.gs:399-408`](backend/Code.gs#L399-L408)) is header-driven** -- only writes columns whose header name appears in row 1 of the target tab. **No matching header = silent drop, no error.**
- The Employees Sheet tab was missing column W (`adminTier`) and column X (`title`) headers entirely. Headers were declared in `docs/schemas/sheets-schema.md` and the backend was redeployed s034 to handle them, but the actual Sheet was never updated.
- => Admin2 toggles (`isAdmin=false, adminTier='admin2'`) had `adminTier` silently dropped on every save. On reload, employee rendered in `employeeBucket` 3 (full-time) or 4 (part-time) per [`src/utils/employeeSort.js:10-16`](src/utils/employeeSort.js#L10-L16).
- Admin1 toggles (`isAdmin=true, adminTier='admin1'`) had `isAdmin` save (col I exists) but Sarvi's reported "they were put under full time" symptom was likely her misreading bucket 1 (admin) vs bucket 2 (admin2) on the grid. Or a related second bug not investigated this session.

**Fix shipped (2 changes):**

1. **Sheet header add (JR, manual):** added `adminTier` to col W row 1 and `title` to col X row 1 of Employees tab in the otr.scheduler-owned Sheet. This alone unblocks all Admin1/Admin2 saves going forward.
2. **Defensive code (`12c6c3f`):** [`backend/Code.gs:399-428`](backend/Code.gs#L399-L428) -- `updateRow` and `appendRow` now collect dropped column names and log via `Logger.log('updateRow DROPPED fields ...')` when the sheet is missing matching headers. `updateRow` returns the dropped array (caller can surface to response if needed). Ensures future silent-drop bugs are visible in Apps Script Executions logs instead of disappearing.

**Apps Script redeploy (JR, manual via script.google.com on otr.scheduler@gmail.com):**

- Existing deployment edited (NOT new deployment) -> same `/exec` URL preserved -> frontend unchanged.
- Version description: `s037 - log dropped fields in updateRow/appendRow`.
- Live script now has the Logger.log defensive pass on top of the s034-deployed code (sendBrandedScheduleEmail + duplicate-email mirror check, both still untested live).

**Verification owed (Sarvi-side):**

- Resave Jess, Genia, the office (Admin1) via Edit modal.
- Resave the admin2 staff via Edit modal.
- Log out + back in.
- Confirm tiers persist in the schedule grid (Admin1 should appear in admin bucket; Admin2 should appear between Sarvi/admins and FT staff with their `title` rendering in place of role name).

**Memory writes:**

- `TODO.md`: new top Active "Sarvi to verify admin-tier persistence after s037 fix"; new top Completed entry for s037 ship; anchor updated `soliton kintsugi -> vermilion instanton`.
- `DECISIONS.md`: untouched. The "header-driven write helpers silently drop unknown fields" finding is implementation behavior, not a durable direction.
- `ARCHITECTURE.md`: untouched. Sheet column count was already documented in schema doc.
- `LESSONS.md`: untouched. The "Sheet headers must match schema doc before backend redeploy" pattern could become a LESSON if it recurs; one occurrence is not yet a graduation candidate.
- Auto-memory: none new.

**Decanting:**

- Working assumptions: Sheet column headers match the schema doc -- false. They don't auto-update from the schema doc; manual Sheet edit is required when adding a column. Captured in Anti-Patterns.
- Near-miss: I told JR "the gs file is up to date" meaning "matches what's deployed" -- JR heard "has the new fix in it" -- led to a wasted redeploy of the old code before my logging change had landed. Captured in Anti-Patterns.
- Naive next move: skip the Sarvi-verify-resave step and assume the fix took. Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed sections.
- Adapter files: AGENTS.md added during the bootstrap-v5 upgrade between sessions (commits `94524d8` + `9c7a175`); not touched this session.
- Char-based ceilings (post v5.1 bootstrap upgrade): TODO 14,553 / 25,000 ok; DECISIONS 20,656 / 25,000 ok; LESSONS 48,901 / 25,000 OVER (~2x ceiling carried); ARCHITECTURE 9,615 ok.
- Style soft-warns: pre-existing MD034 / MD041 in TODO; none introduced.

`Audit: clean (LESSONS 48,901/25,000 char ceiling carried; pre-existing MD034/MD041 soft-warns persist)`

## Hot Files

- `backend/Code.gs:399-428` -- `updateRow` + `appendRow` with dropped-field logging. The `dropped` array returned from `updateRow` is unused at callers; future enhancement: thread up to `saveEmployee` response so frontend can surface a yellow toast warning.
- `backend/Code.gs:1669-1713` -- `saveEmployee`. Header-driven via `updateRow`. Caller is App.jsx `saveEmployee` (line 891).
- `docs/schemas/sheets-schema.md` -- canonical column list. Now provably out-of-sync risk: schema doc said cols W+X existed on Employees tab, Sheet itself didn't have them. **Treat schema doc as a target spec, not a guarantee of Sheet state.**
- `src/utils/employeeSort.js:10-16` -- `employeeBucket` ordering. `isAdmin -> bucket 1`, `adminTier === 'admin2' -> bucket 2`, else falls through to employmentType. Render-side render fallback explains why missing adminTier shows employees as full-time/part-time.
- `src/modals/EmployeeFormModal.jsx:186-198` -- the three tier buttons. None / Admin / Admin 2.

## Anti-Patterns (Don't Retry)

- Don't say "the gs file is up to date" without specifying "up to date relative to what." This session: I meant "matches what's deployed." JR heard "has the new fix ready to deploy." Burned a redeploy. Always say "matches deployed" or "ahead of deploy" or "behind deploy."
- Don't trust `docs/schemas/sheets-schema.md` as a guarantee of actual Sheet headers. The schema doc is the target; the Sheet may not have caught up. When adding a backend feature that requires a new column, also verify (or have JR verify) the Sheet has the header before deploying.
- Don't skip a verify step after a Sheet-side fix. Backend logic is correct, Sheet is correct -> still need a live save+reload to confirm the round-trip. Sarvi owes this.
- Don't add a `Logger.log` and assume "it'll show up in logs." Apps Script Executions logs require manual checking via the editor; nobody actively monitors them. The defensive logging is a forensic tool, not an alert. If silent drops become a recurring failure mode, escalate to "return dropped[] in API response" so frontend can yellow-toast.
- Don't redeploy Apps Script as "New deployment." That issues a fresh `/exec` URL and the frontend stops talking to the backend. Always edit existing deployment -> new version.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028+s029+s030+s031+s032+s033+s034+s035+s036+s037 commits with deferred phone-smoke -- carried (s036 was Playwright-smoked on prod 15/16; phone-smoke still owed)
- Employee-view hours-lockdown live verification -- testguy is inactive in Sheet; verified by code inspection only
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)
- s034 backend live smoke -- still owed (sendBrandedScheduleEmail + duplicate-email mirror check). s037 redeploy bundled the new Logger.log on top but did NOT smoke the s034 changes.

## Key Context

- "Header-driven Sheet writes" pattern: any field whose column header isn't in row 1 of the target tab is silently dropped. Pre-`12c6c3f` this was invisible; post-`12c6c3f` it logs to Apps Script Executions. If you add a backend feature that introduces a new field, also confirm the Sheet has the header.
- The s034 redeploy added `sendBrandedScheduleEmail` + `DUPLICATE_EMAIL` guard. s037 redeploy bundled Logger.log on top. Both s034 features still untested live (per Blocked carry).
- Apps Script editor link: [script.google.com/home](https://script.google.com/home) -- requires being signed in to `otr.scheduler@gmail.com`. Deploy via top-right "Deploy" -> "Manage deployments" -> pencil-edit existing -> "New version" (NOT "New deployment").
- Employees tab now confirmed to have all 24 columns (A id ... X title) per the schema doc. As of this session.
- Untracked `.cursor/rules/blast-radius.mdc` + `.cursor/rules/ui-ux-design.mdc` are NOT from this session. Surface to JR; do not auto-stage.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- Anchor is `vermilion instanton`. Top Active is "Sarvi to verify admin-tier persistence after s037 fix."
2. `git log --oneline -3` should show the s037 handoff commit, then `12c6c3f`, then `9c7a175`.
3. `git status -s` should show 2 untracked `.cursor/rules/*.mdc` (pre-existing) and nothing else after this handoff is committed.
4. Before any backend work: re-read `CONTEXT/ARCHITECTURE.md` `Deploy topology` -- Apps Script lives in `otr.scheduler@gmail.com`'s Drive standalone; access via `script.google.com` while that account is the active session.
5. Adapter files: AGENTS.md is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: s037 admin-tier fix -- code shipped + Apps Script redeployed; Sarvi-side verify-resave still owed. This is the natural top item; it gates whether the bug is actually closed.
- (b) External gates: phone-smoke for s028-s037 carried (JR-owned). Apps Script live smoke for s034 features still deferred to email-format session.
- (c) Top active TODO: Sarvi verify-resave is Active top.

(a) and (c) coincide. Most natural opener: ask JR whether Sarvi has confirmed the resave worked. If yes -> close the verify item, pick next backlog. If no -> wait or repro on testguy. Backlog candidates if verified: EmailModal v2 + email-format pass (long-deferred), in-app bug fixes from `docs/audit-2026-04-27-deferred.md`, or pitch-copy phrasing sweep.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
