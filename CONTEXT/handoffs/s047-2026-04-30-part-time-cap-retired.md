# s047 -- 2026-04-30 -- Part-time 24h cap retired + CacheService verified on prod

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: kintsugi predictive coding -- s047 verified s046 CacheService on prod (7s baseline -> 2.8s second-load HIT) and retired the 24h part-time weekly cap violation rule per JR; tree clean post-handoff write.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `e887881` on `main` synced with origin pre-handoff (+2 commits this session: `450c239` TODO verification note + `e887881` part-time cap removal). Working tree clean before this handoff write.
- **Apps Script live deployment:** unchanged from s046 -- in sync with repo for the CacheService layer; `bulkCreatePKEvent` kill (s044 `a8ccaa8`) still drifts on live. No backend touches this session.
- **Active focus end-of-session:** opportunistic policy + verification work. Migration still research-complete + vendor-locked, awaiting JR's Phase 0 ship window.
- **Skills used this session:** `/handoff` (s047 now). Direct edits only this session, no `/coding-plan`.

## This Session

**Continuation of s046 same calendar day. Picked up the s046 "verify CacheService HIT timing" thread, then JR added an opportunistic policy change.**

**Verification shipped:**

- **CacheService HIT confirmed on prod.** JR ran the prod /exec smoke per s046 Verify-On-Start. DevTools network filter `exec` + Fetch/XHR -> first warm load `/exec` 3.9s, second consecutive load 2.8s. ~7s baseline -> 2.8s on hit, matches `49b1053` plan's 7-8s -> 2-3s expected. Apps Script Executions log only showed `doGet` rows (frontend uses GET, not POST -- normal); recent doGet runtimes 2-5s consistent with cache HIT path. `cache HIT/MISS` Logger.log lines did not surface in the Executions UI for the Rainbow project (likely Stackdriver not enabled); network-timing evidence was sufficient. Recorded validation in `CONTEXT/TODO.md` Completed entry.

**Commits shipped (2):**

- `450c239` -- docs(todo): one-line update to the s046 CacheService Completed entry marking it VERIFIED s047 with the 7s -> 2.8s evidence.

- `e887881` -- fix(violations): retire 24h part-time weekly cap rule:
  - **`src/utils/violations.js`**: dropped the `partTimeCap` branch from `computeViolations` (was: `if (employee.employmentType === 'part-time' && weekHours > PART_TIME_WEEKLY_CAP)`). Removed the now-unused `PART_TIME_WEEKLY_CAP` import.
  - **`src/utils/timemath.js`**: deleted the unused `export const PART_TIME_WEEKLY_CAP = 24` constant. No remaining consumers (verified via grep across `src/` and `backend/`).
  - **Other rules untouched**: consecutive 6+ days, weekly 40h CAP / 44h OVER_RED ESA, approvedTimeOff, unavailable all still fire.
  - **Backend / Sheet schema**: zero impact -- violations are computed client-side from the schedule grid.
  - JR's reason: "Sarvi schedules part-timers above 24h regularly and isn't going to respect the warning anyway." The rule fired constantly without changing scheduler behavior, polluting the violations panel and burying actionable rules.
  - Build PASS; bundle delta -1 line (108 bytes gzipped).

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `gamboge instanton` -> `kintsugi predictive coding`. Added part-time cap retirement to Completed (top); CacheService Completed entry marked VERIFIED.
- `CONTEXT/DECISIONS.md`: prepended `2026-04-30 (s047) -- Retire 24h part-time weekly cap violation rule`. Confidence H -- JR-stated.
- `CONTEXT/LESSONS.md`: untouched.
- `CONTEXT/ARCHITECTURE.md`: untouched (violations engine shape unchanged; only one rule deleted).

**Decanting:**

- **Working assumptions:** none new. The violations engine is a pure synchronous evaluator (`src/utils/violations.js`) returning a flat `{ rule, severity, detail }` array; rules are independently composable. Already implicit in the code shape.
- **Near-misses:** considered raising the 24h threshold (e.g. to 32h or 36h) rather than removing the rule. Rejected because JR's stated cause is "Sarvi won't respect it" -- non-compliance, not mis-calibrated threshold. A higher threshold would reproduce the same noise pattern at lower volume.
- **Naive next move:** "add an admin setting to toggle the rule on/off so other tenants can opt back in." Wrong now -- this is a single-tenant app for OTR, JR has declared the rule dead, and adding config surface around dead behavior accumulates technical debt that the migration would carry forward. If multi-tenancy ever returns, restore the rule from git history.

**Audit (Step 3):**

- Schema-level: clean. TODO + DECISIONS schema headers present, all required sections in place.
- Char ceilings: TODO 20,238 / 25k OK; DECISIONS ~24,400 / 25k OK (close to ceiling -- next decanting may trigger archival); LESSONS 68,794 / 25k STILL OVER (carried); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD041/MD034 carried; DECISIONS MD041 carried. No new drift.
- Adapter files: not modified.

`Audit: clean (LESSONS 68,794/25,000 char ceiling carried; MD041 + MD034 style soft-warns carried; DECISIONS approaching 25k ceiling)`

## Hot Files

- `src/utils/violations.js` (~L25-30) -- if a future tenant or JR change-of-mind reintroduces a part-time cap, this is the spot. Pattern from the deleted block: `if (employee.employmentType === 'part-time' && weekHours > THRESHOLD)`. Don't reach for git history blindly -- the constant lived in `timemath.js` separately.
- `src/utils/timemath.js` -- `OVERTIME_THRESHOLDS = { CAP: 40, OVER_RED: 44 }` (ESA 44h is hard rule, do not touch). Break rules + pure shift math.
- `backend/Code.gs` -- CACHE LAYER section ~L429-526; cache verified live this session. No changes.
- `src/modals/EmployeeFormModal.jsx` (~L252) -- s046 admin2 showOnSchedule gate; carries forward.
- `src/utils/employees.js` (`filterSchedulableEmployees` ~L47) + 4 mirror sites (App.jsx hiddenStaff, EmailModal, CommunicationsPanel) -- carries forward from s046; change all 5 together.

## Anti-Patterns (Don't Retry)

- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** JR retired this rule in s047 because it fires without changing scheduler behavior. Raising the threshold reproduces the same noise pattern. If multi-tenant support ever returns and another tenant wants the rule, gate it on tenant config, not bring back as default. (s047 near-miss.)
- **Don't add an admin setting to toggle individual violation rules on/off.** Single-tenant app; config surface for dead behavior is debt the migration would inherit. (s047 naive-next-move.)
- **Don't add a new column to the Employees / Shifts / Settings / Announcements / ShiftChanges sheet without a deploy + manual-header-write checklist** (carried s046). `updateRow`/`appendRow` are header-driven and silently drop unmatched fields.
- **Don't extend CacheService to login / getEmployees / other reads without measurement** (carried s046). Cache HIT verified s047 on `getAllData` only -- 7s -> 2.8s. Other endpoints out of scope per plan Decision 7.
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app** (carried s046).
- **Don't iterate `Object.values(events)` to summarize events for display** (carried s045). Filter through active employees first.
- **Don't shrink the desktop schedule name column below 160px** (carried s045).
- **Don't paste-then-deploy Apps Script changes silently** (carried s045). Surface the redeploy step explicitly when `backend/Code.gs` is touched.

## Blocked

Same set as s046:

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker cache -- retired (DECISIONS s046 supersedes; pre-migration bridge = Apps Script CacheService, now verified s047). Vercel Edge remains the right external option if CacheService proves insufficient post-deploy.
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier ($25/mo, no PITR), apply DDL from `02 §1-§5`, install 14 RLS policies from `05 §3-4`, seed `store_config`. Per `09 §3`. Pre-cutover gates remain CLOSED.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Set up + verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`. Latest bundle hash post-`e887881` will be assigned by Vercel auto-deploy.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. CacheService layer in sync repo<->live; `bulkPK` kill (s044 `a8ccaa8`) still drifts on live (cosmetic; cutover Phase 6 decommissions).
- Bridge cache code at `Code.gs` ~L429-526 retires at migration cutover. Don't invest in chunk-tuning, multi-region replication, or fancy SWR semantics. Cache HIT verified working s047.
- AGENTS.md is canonical post v5.2 bootstrap.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `kintsugi predictive coding`. Top Active is migration research-complete + AWS SES Phase 1 setup.
2. `git log --oneline -5` should show this s047 handoff commit on top of `e887881` (part-time cap), `450c239` (TODO verification), `8294950` (s046 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. `grep -n "partTimeCap\|PART_TIME_WEEKLY_CAP" src/ backend/ -r` should return zero matches (verifies removal stuck).
5. `grep -n "OVERTIME_THRESHOLDS" src/utils/timemath.js` should return 1 match (verifies sibling constants intact).
6. testguy account currently **Active** post-s045-smoke -- if s047 ended without a smoke (it did; this session was code-only + prod network-timing inspection), state likely unchanged from carrying-forward s045/s046. Verify before next smoke run; deactivate after if flipped.
7. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `e887881` part-time cap removal not visually smoked -- the violations panel should show fewer warnings on weeks where part-timers exceed 24h. Could verify on prod by loading a week with a part-timer >24h and confirming no `partTimeCap` warning appears. Low-stakes; logic-only change with build PASS, no auth/data path. Defer to opportunistic.
- (b) External gates: AWS SES account setup is the most actionable Phase 0 prep (sandbox -> production access takes 24-48h). Sarvi-asks-Amy on ADP rounding rule still open.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **JR sets a Phase 0 ship window.** All pre-conditions closed; fresh session executes `09 §3`.
2. **EmailModal v2 PDF attachment.** Real feature work, ~2-3hr. Backend produces PDF blob via `Utilities.newBlob().getAs('application/pdf')`, attaches to MailApp.
3. **AWS SES account setup.** Pre-stage Phase 1.
4. **Visual smoke of part-time cap removal on prod.** ~30s. Confirms s047 ships clean.
5. **Stop / pick up an opportunistic bug.**

Open with: ask JR which of (1)/(2)/(3)/(4)/(5) to start.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
