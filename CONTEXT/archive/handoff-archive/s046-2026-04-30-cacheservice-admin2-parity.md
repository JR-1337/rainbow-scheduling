# s046 -- 2026-04-30 -- CacheService bridge + admin2 parity

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: gamboge instanton -- s046 shipped 2 commits (admin2 showOnSchedule parity + Apps Script CacheService bridge); JR redeployed live Apps Script for the cache layer; tree clean post-handoff write.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `49b1053` on `main` (synced with origin; +2 commits this session). Working tree clean before this handoff write.
- **Apps Script live deployment:** in sync with repo for the s046 CacheService layer -- JR pasted + redeployed mid-session. The s044 `bulkCreatePKEvent` kill (`a8ccaa8`) still drifts on live; cosmetic, cutover decommissions.
- **Active focus end-of-session:** opportunistic bug + perf-bridge work shipped. Migration is still research-complete + vendor-locked, awaiting JR's Phase 0 ship window. `Bug 4 PK 10am-10am` retired from Active TODO (JR confirmed fixed).
- **Skills used this session:** `/coding-plan` (CacheService plan + executor + handoff), `/handoff` (s046 now).

## This Session

**Continuation of s045 same calendar day. Started as feature/bug work; cascaded into the Apps Script perf bridge once JR asked about non-Supabase speedup levers.**

**Commits shipped (2):**

- `db7d6d1` -- fix(admin2) showOnSchedule parity with admin1:
  - **`EmployeeFormModal.jsx`**: gate widened from `formData.isAdmin && !formData.isOwner` to `(formData.isAdmin || formData.adminTier === 'admin2') && !formData.isOwner` so the "Show on schedule grid?" toggle now renders for admin2 employees too.
  - **`utils/employees.js` `filterSchedulableEmployees`**: predicate `!e.isAdmin || e.showOnSchedule` -> `(!e.isAdmin && e.adminTier !== 'admin2') || e.showOnSchedule`. admin2 with Show=No now hides from the schedule grid.
  - **`modals/EmailModal.jsx` + `panels/CommunicationsPanel.jsx`**: same predicate widened for emailable list + scheduledCount.
  - **`App.jsx` `hiddenStaff`**: `(e.isAdmin && !e.showOnSchedule)` -> `((e.isAdmin || e.adminTier === 'admin2') && !e.showOnSchedule)`.
  - **PDF unchanged**: admin2 (`isAdmin=false`) keeps appearing on staff pages 1-2, not on admin page 3 (page-split was already isAdmin-keyed and that's the right semantic).
  - **Sheet-side prerequisite**: JR added `adminTier` (col W) + `title` (col X) headers to the live Employees tab manually mid-session. Without those headers, `updateRow` was silently dropping the field and admin2 selections reverted to Staff on save. Diagnosis from `backend/Code.gs:395-411` (header-driven write helper). `parseEmployeesFromApi` at `src/utils/apiTransforms.js:38` already normalizes missing string to `''`, so no inbound changes needed. Build PASS.

- `49b1053` -- perf(backend) CacheService caching for getAllData reads (planned via `/coding-plan` skill; plan at `~/.claude/plans/jazzy-baking-sutherland.md`):
  - **Cache layer added in `backend/Code.gs` (~L429-526)**: `cacheGet_` / `cachePut_` / `bustSheetCache_` / `getCachedSheetData_` helpers. Constants `CACHE_VERSION_='v1'`, `CACHE_TTL_SEC_=600`, `CACHE_CHUNK_BYTES_=90*1024`. Auto-chunks payloads >90KB across `<key>_0`/`<key>_1`/... with a `<key>_meta` chunk-count index; reassembles via `getAll`.
  - **Writer wraps**: `updateRow` (L395-411), `updateCell` (L386-393), `appendRow` (L413-427) each call `bustSheetCache_(tabName)` after a successful write. Automatically covers every existing AND future write path -- no per-function patches needed for saveEmployee, saveLivePeriods, batchSaveShifts, all 16 shift-change mutations, etc.
  - **Direct-delete bust calls**: 2 sites bypass the helpers -- `saveShift` at L1654 (`getSheet(SHIFTS).deleteRow(...)`) and `deleteAnnouncement` at L1950 (`getSheet(ANNOUNCEMENTS).deleteRow(...)`). Inline `bustSheetCache_(...)` added immediately after each.
  - **`getAllData` reads flipped**: 5 `getSheetData(CONFIG.TABS.*)` calls at L1568-1572 now use `getCachedSheetData_`. Other reads (`getEmployees`, `getShifts`, `getAdminQueue`, `getEmployeeRequests`, `getIncoming*`) intentionally stay uncached.
  - **Failure path**: every cache helper try/catches and falls through to live `getSheetData()`. Cache is opt-in, never required for correctness.
  - **JR pasted + redeployed live Apps Script** mid-session post-`49b1053`. First post-deploy login JR measured ~7000ms total; cache HIT timing on second `/exec` not yet verified by JR (deferred -- cache MISS on first call is expected, MISS path is unchanged from pre-cache).

**Sheet scrub (JR-side, manual, mid-session):**

- Added `adminTier` (col W) + `title` (col X) headers to live Employees tab. v2.26.0 backend code shipped 2026-04-24 (`28cf429`) had this as a one-time manual step that wasn't completed at the time; bug surfaced when JR tried to save admin2 today.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `cinnabar twistor` -> `gamboge instanton`. Removed `Bug 4 PK default 10am-10am for some people` from Active (JR: "10-am to 10pm seems to be fixed. get rid of that one."). Added s046 admin2 + CacheService entries to Completed.
- `CONTEXT/DECISIONS.md`: added `2026-04-30 (s046) -- Pre-migration getAllData perf bridge = Apps Script CacheService (not CF Worker / Vercel Edge)` with rejected alternatives table. Confidence H.
- `CONTEXT/LESSONS.md`: untouched (still 68,794/25k carried).
- `CONTEXT/ARCHITECTURE.md`: untouched (no flow changes -- cache is orthogonal additive layer).

**Decanting:**

- **Working assumptions**: header-driven writes (`updateRow`/`appendRow`) silently drop fields when the live Sheet is missing the header. This is the v2.26.0 admin2 bug's mechanism + a recurring class -- any future schema column addition requires both code (`createEmployeesTab` headers list) AND a manual header write to the live Sheet. The `Logger.log('updateRow DROPPED fields ...')` line at `Code.gs:408` is the only diagnostic; it doesn't surface to the frontend. Worth flagging to ARCHITECTURE.md if a third instance occurs; deferred for now to avoid bloat.
- **Near-misses**: Considered Cloudflare Worker + KV (and later Vercel Edge Function + KV) as the perf-bridge layer. Both rejected for the pre-migration window; recorded in DECISIONS.md so the next "let's add an edge worker" reach lands on the simpler in-codebase option first. Also considered payload trim to 6 pay periods + on-demand range fetch -- 4-6h frontend work for marginal gain on top of CacheService; deferred to migration.
- **Naive next move**: "extend caching to login + getEmployees + getAdminQueue endpoints." Tempting but explicitly out of scope per plan Decision 7. Login is rare (1-2x/admin/day); other reads are infrequent enough that the cache eviction risk + invalidation surface area outweighs the win. Don't extend without measurement.

**Audit (Step 3):**

- Schema-level: clean. TODO + DECISIONS schema headers present.
- Char ceilings: TODO 20,200 / 25k OK; DECISIONS 23,742 / 25k OK; LESSONS 68,794 / 25k STILL OVER (carried); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; DECISIONS MD041/MD032/MD012 carried; em-dash drift in archived entries carried.
- Adapter files: not modified.

`Audit: clean (LESSONS 68,794/25,000 char ceiling carried; MD041 + MD032 + MD034 + MD012 style soft-warns carried)`

## Hot Files

- `backend/Code.gs` -- new CACHE LAYER section ~L429-526; writer wraps in `updateCell`/`updateRow`/`appendRow`; direct-delete busts at L1654 + L1950; `getAllData` reads cached at L1568-1572. Live deploy in sync with repo for the cache layer; `bulkPK` kill (s044 `a8ccaa8`) still drifts on live.
- `src/modals/EmployeeFormModal.jsx` (~L252) -- showOnSchedule toggle gate widened. If a future role tier (admin3, etc) is added, mirror the gate pattern there.
- `src/utils/employees.js` (`filterSchedulableEmployees` ~L47) -- the canonical schedulable-on-grid predicate. 4 sites mirror it inline (EmailModal, CommunicationsPanel, App.jsx hiddenStaff). When changing the predicate, change all 5.
- `src/App.jsx` (`hiddenStaff` ~L562) -- mirror predicate.
- `src/modals/EmailModal.jsx` (~L14) + `src/panels/CommunicationsPanel.jsx` (~L20) -- mirror predicate.

## Anti-Patterns (Don't Retry)

- **Don't add a new column to the Employees / Shifts / Settings / Announcements / ShiftChanges sheet without a deploy + manual-header-write checklist.** `updateRow`/`appendRow` are header-driven and silently drop unmatched fields (see `Code.gs:408`). Bug surfaced twice now (`defaultSection` v2.22, `adminTier`/`title` v2.26). Future column adds: (a) edit `createEmployeesTab` headers list, (b) JR manually adds the header to the live Sheet, (c) verify with a test save before declaring shipped. Don't trust "the code shipped".
- **Don't extend CacheService to login / getEmployees / other reads without measurement.** Plan Decision 7 explicitly scoped to `getAllData`. Adding more cached endpoints multiplies invalidation surface area without proportional win. Measure first.
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** Vercel Edge Function + Vercel KV is the same primitives, one fewer vendor. CF Worker is appropriate when you're not already on Vercel.
- **Don't iterate `Object.values(events)` to summarize events for display** (carried s045). Filter through active employees first.
- **Don't shrink the desktop schedule name column below 160px** (carried s045).
- **Don't paste-then-deploy Apps Script changes silently** (carried s045). Surface the redeploy step explicitly when `backend/Code.gs` is touched.

## Blocked

Same set as s045:

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker cache -- retired (DECISIONS s046 supersedes; pre-migration bridge = Apps Script CacheService instead). Vercel Edge remains the right external option if CacheService proves insufficient post-deploy.
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is still research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier ($25/mo, no PITR), apply DDL from `02 §1-§5`, install 14 RLS policies from `05 §3-4`, seed `store_config`. Per `09 §3`. Pre-cutover gates remain CLOSED.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Set up + verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`. Latest bundle hash post-`db7d6d1`: `index-BCxBGeyO.js`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. Repo + live in sync for the s046 cache layer; ~91-line `bulkPK` kill still drifts (cosmetic; cutover Phase 6 decommissions).
- Bridge cache code at `Code.gs` ~L429-526 retires at migration cutover (Phase 6 decommissions Apps Script entirely). Don't invest in chunk-tuning, multi-region replication, or fancy SWR semantics.
- AGENTS.md is canonical post v5.2 bootstrap.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `gamboge instanton`. Top Active is migration research-complete + AWS SES Phase 1 setup.
2. `git log --oneline -3` should show this s046 handoff commit on top of `49b1053` (CacheService).
3. `git status -s` should be clean after Step 7 commit.
4. `grep -n "getCachedSheetData_(CONFIG.TABS" backend/Code.gs` should return 5 matches, all between L1564-1611 (verifies cache wiring survived).
5. `grep -n "bustSheetCache_" backend/Code.gs` should return >= 7 matches (definition + writer wraps + delete-site busts + direct caller in `getCachedSheetData_`).
6. `grep -n "(formData.isAdmin || formData.adminTier === 'admin2')" src/modals/EmployeeFormModal.jsx` should return 1 match at the showOnSchedule toggle gate.
7. testguy account currently **Active** post-smoke -- if s046 ended without a smoke (it did; cache layer doesn't smoke per plan anti-pattern #5), state likely unchanged from carrying-forward s045. Verify before next smoke run; deactivate after if flipped.
8. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `49b1053` CacheService cache HIT timing on second `/exec` call not yet verified by JR (first call ~7000ms is the expected MISS). Reload prod and check Network tab for the second `getAllData` call -- should be ~2-3s. Apps Script Executions log should show `cache MISS tab=Employees` then `cache HIT tab=Employees` on consecutive runs. `db7d6d1` admin2 toggle visual not yet smoked (JR confirmed visually post-deploy that admin2 saves; toggle visibility for admin2 not visually verified).
- (b) External gates: AWS SES account setup is the most actionable Phase 0 prep (sandbox -> production access takes 24-48h). Sarvi-asks-Amy on ADP rounding rule still open.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **Verify CacheService HIT timing.** ~30s of network-tab + executions-log inspection. Confirms the work shipped today actually delivers the win (or surfaces an issue while it's fresh).
2. **JR sets a Phase 0 ship window.** All pre-conditions closed; fresh session executes `09 §3`.
3. **EmailModal v2 PDF attachment.** Real feature work, ~2-3hr. Backend produces PDF blob via `Utilities.newBlob().getAs('application/pdf')`, attaches to MailApp.
4. **AWS SES account setup.** Pre-stage Phase 1.
5. **Stop for the day.** s046 closes a productive day; tree clean, two real wins shipped.

Open with: ask JR which of (1)/(2)/(3)/(4)/(5) to start.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
