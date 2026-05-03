# s056 -- 2026-05-03 -- Audit-fix plan complete; 4 batches + 2 hotfixes shipped

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

cinnabar. instanton.

Pass-forward: Audit-fix plan complete -- 4 batches + 2 hotfixes shipped, paste-deployed, smoked clean.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `39c55e0` on `main`, will be `s056 handoff` after Step 7. Seven session commits beyond s055 handoff: `31f1c23` (Batch 2), `1164c53` (v2.29.1 hotfix), `3cd7e26` (chore: pre-Batch-3 rollback marker), `04f6912` (Batch 3), `7abe364` (v2.30.1 hotfix), `4a227d0` (Batch 4), `39c55e0` (chore: H3 Blocked entry).
- **Apps Script live deployment:** in sync with `7abe364` (v2.30.1). All audit-fix backend stack live. JR paste-deployed Batch 2 (v2.29) + v2.29.1 + Batch 3 (v2.30) + v2.30.1 across the session.
- **Active focus end-of-session:** plan retired. Audit-fix execution closed. Pick next from `CONTEXT/TODO.md` Active list -- top candidates are mobile triangle button + Mine tab missing shifts (both raised s055).
- **Working assumption (ratified mid-session):** Batch 1's `SAVE_EMPLOYEE_FIELDS_` allowlist excludes `passwordChanged`, so `saveEmployee` silently drops it from frontend payloads. Confirmed by code read after the s056 bundled smoker mistakenly flagged a possible overwrite. The allowlist is exactly Batch 1's protective intent.
- **Skills used this session:** `/coding-plan` (Phase 6 + 7 across 4 batches + 2 hotfixes), `/handoff` (s056 now). Six subagent runs total: 2 executors + 4 smokers (Batch 1 smoke + Batch 2 smoke + bundled end-of-plan smoke + Batch 2 executor + Batch 3 executor + Batch 4 executor).

## This Session

**Continuation theme: resumed from paste-deployed-but-un-smoked Batch 1; ran the remaining 3 batches + 2 discovered-mid-flight hotfixes + 4 smokes; closed the plan.**

**Commits shipped (5 fix commits + 2 chore commits):**

- `31f1c23` fix(audit): batch 2 -- type filter + cache bust + reorder + email lowercase (Code.gs v2.29.0).
  - H4: `(s.type || 'work') === 'work'` filter on shift lookups in `approveShiftOffer` / `revokeShiftOffer` / `approveSwapRequest` / `revokeSwapRequest` (5 sites). Meeting/PK rows can no longer be picked up as work shifts during transfers.
  - H5: `bustSheetCache_(SHIFTS)` at end of `batchSaveShifts`. Stale-cache window between bulk save and concurrent admin re-read closed.
  - M7: `approveShiftOffer` validates recipient + shift BEFORE writing `status: 'approved'`. No half-applied state.
  - M12: read-side lowercase email compare in `login` / `getEmployeeByEmail` / `changePassword` / `resetPassword` (8 sites). Storage stays case-as-typed.
  - Note: Batch 2 executor was killed mid-step-11 (build gate) before commit. Picked up: ran build, committed, pushed.

- `1164c53` fix(auth): changePassword case-fold for default-pw users (Code.gs v2.29.1).
  - Discovered by Batch 2 smoker. `resetPassword` line 965 stores `hashPassword_(salt, default.toLowerCase())`. `changePassword` self-path was hashing `currentPassword` cased -- so `TestG` typed at the Set-Your-Password modal hashed to a value that never matched the stored hash of `testg`. Every first-login was stuck.
  - Mirrored login's `candidates = [lowercased, original]` array gated on `passwordChanged === false`. Strict once they've set their own.
  - Shipped own commit + own paste-deploy (rejected the alternative of bundling into Batch 3 -- isolated rollback bisection > fewer paste cycles).

- `3cd7e26` chore(state): pre-Batch-3 rollback marker. TODO.md deferred-smoke entry + s052 handoff trim. Clean working tree before TOCTOU wrap shipped.

- `04f6912` fix(audit): batch 3 -- TOCTOU concurrency hardening (Code.gs v2.30.0).
  - New `withDocumentLock_(fn, errorContext)` helper at Code.gs ~line 607. `LockService.getDocumentLock().tryLock(10000)` + `finally lock.releaseLock()` + clean `CONCURRENT_EDIT` on contention.
  - 16 state-mutating handlers wrapped: 4 time-off (cancel / approve / deny / revoke) + 6 shift-offer (accept / decline / cancel / approve / reject / revoke) + 6 swap (accept / decline / cancel / approve / reject / revoke).
  - `verifyAuth` stays outside the wrapper (read-only, no need to extend lock-hold time). `getSheetData(SHIFT_CHANGES)` re-fetch moves inside the lock so two admins racing on the same request serialize cleanly.
  - `batchSaveShifts` left untouched (already locks directly). Same `LockService.getDocumentLock()` instance, so it serializes against the new helper.
  - 3 `submit*` handlers not wrapped (create-only, no read-then-check-then-write TOCTOU pattern).

- `7abe364` fix(audit): align withDocumentLock_ timeout with batchSaveShifts -- 10s.
  - Surfaced by Batch 3 executor's double-check. Helper used `tryLock(5000)` while `batchSaveShifts` uses `tryLock(10000)`. Same lock instance. Asymmetric budgets meant a 5-10s bulk save would always starve a concurrent approve.
  - One-line semantic change. Helper bumped to 10000ms. Symmetric.

- `4a227d0` fix(audit): batch 4 -- frontend session integrity + defensive guards.
  - M8: `src/auth.js` `clearAuth(reason)` writes to `localStorage.rainbow_auth_clear_reason`. `handleAuthError` calls with `'session_ended'` (AUTH_EXPIRED / AUTH_INVALID) or `'account_inactive'` (AUTH_REQUIRED). `LoginScreen.jsx` `useEffect` reads + clears the reason on mount, renders amber banner "Your session ended. Please sign in again." or "Your account is no longer active. Please contact your administrator."
  - M10: `src/utils/apiTransforms.js` `partitionShiftsAndEvents` early-returns when `fixedShift.employeeId` is falsy (executor used `return` not `continue` -- correct, the loop is `forEach`). No ghost rows in the schedule grid.
  - M11: `(typeof req.datesRequested === 'string' ? req.datesRequested : '').split(',').filter(Boolean)` guard at all 4 `.split(',')` sites: App.jsx lines 173 + 1004 + 1472 + EmployeeView.jsx line 318. Plan listed 3 sites; executor patched a 4th to satisfy the success-check zero-grep-hits rule.
  - Drift on `handleAuthError` signature: plan showed `error` (object); actual code takes `errorCode` (string). Adapted to the actual signature.

- `39c55e0` chore(todo): add H3 chunkedBatchSave Blocked entry. Plan step 4.6 deliverable.

**Smoke results:**

- Batch 1 smoke (`d18e72a` v2.28): 4/4 PASS. C2 strip, C1 allowlist, L13 reset gate all verified live. Memory `reference_smoke_logins.md` updated mid-smoke (test guy email `john@johnrichmond.ca`, not `testguy@testing.com`; password rotated to `TestG` not `test007`). Plan-wording quibble: plan said admins should still see `passwordHash`/`passwordSalt`; code intentionally strips for everyone (frontend never needs raw hashes). Security invariant holds.

- Batch 2 smoke (`31f1c23` v2.29): 4/4 PASS (2 hard + 2 conditional code-verified). H5 cache bust + M12 lowercase email login live-verified. H4 type filter + M7 reorder code-verified at 5 correct sites; UI flow blocked by changePassword case-fold bug -- which surfaced the v2.29.1 hotfix.

- Bundled end-of-plan smoke at HEAD `39c55e0` 2026-05-03: 5/5 PASS. (1) v2.29.1 changePassword -- Test Guy completed Set-Your-Password modal `TestG` -> `TestG7`, then re-login no modal; (2) Batch 3 TOCTOU happy-path -- shift edit + save clean, no false `CONCURRENT_EDIT`, 0 console errors; (3) v2.30.1 lock symmetry -- both wrappers at `tryLock(10000)`; (4) Batch 4 M8 -- corrupted `otr-auth-token` in localStorage, redirect fired, banner rendered correctly (executor's race-condition double-check turned out to be a non-issue); (5) Batch 4 M10 + M11 -- schedule + request panel render clean. Test Guy returned to Inactive + password reset to FirstnameL default `TestG`; `passwordChanged=false` preserved (Batch 1 allowlist drops the field on saveEmployee).

**Subagent flag-out worth correcting:** the bundled smoker worried that a later `saveEmployee` call may have overwritten `passwordChanged` back to `true`. It didn't -- `SAVE_EMPLOYEE_FIELDS_` (Batch 1) explicitly excludes `passwordChanged` along with `password` / `passwordHash` / `passwordSalt`. Smoker did not internalize the allowlist's protective intent. Test Guy's actual end state is `TestG / passwordChanged=false`. Verified by code read.

**Lock-timeout decision:** v2.30.1 picked the surgical bump (helper 5s -> 10s) over the cleaner refactor (move `batchSaveShifts` to use `withDocumentLock_`). Refactor would have been a single source of truth but adds regression surface to a load-bearing handler mid-deploy. Take the cleanup as a parked candidate; right call to ship the bump now.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `vermilion. soliton.` -> `cinnabar. instanton.`. Active: replaced "Audit-fix plan in flight..." with one line marking the plan retired. Verification: replaced "Apps Script live = d18e72a" with v2.30.1 status; replaced "Audit fix Batch 1 smoke pending" + "Deferred smoke -- v2.29.1" with the s056 bundled-smoke validated entry. Completed: prepended Batch 2 / v2.29.1 / Batch 3 / v2.30.1 / Batch 4 (5 newest). Trim comment extended for s056 (Batch 1 + audit-plan-written + violations-panel + FirstnameL + eye-toggle).
- `CONTEXT/DECISIONS.md`: not touched. The lock-timeout-symmetry invariant is sufficiently captured in the code comment at v2.30.1; a DECISIONS entry would duplicate.
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carries; nothing this session graduated).
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; helper is local addition).
- Auto-memory: `reference_smoke_logins.md` updated mid-session (test guy email correction + `TestG` rotation + passwordChanged note).

**Audit (Step 3 of HANDOFF):**

`Audit: clean (LESSONS 68,794/25k carries from prior sessions; pre-existing TODO MD041 + MD034 soft-warns)`

**Decanting:**

- **Working assumptions:**
  - Assumed Batch 1's `SAVE_EMPLOYEE_FIELDS_` allowlist drops `passwordChanged` from saveEmployee payloads. Confirmed by code read after s056 bundled smoker flagged a possible overwrite. Allowlist works as designed.
- **Near-misses:**
  - Bundling v2.29.1 hotfix into Batch 3 paste-deploy. Rejected -- isolated rollback bisection beats fewer paste cycles, and v2.29.1 was discovered mid-Batch-2-smoke (different failure mode than the TOCTOU wrap).
  - Refactoring `batchSaveShifts` to use `withDocumentLock_` for v2.30.1. Rejected -- single source of truth would be cleaner but adds regression surface to a load-bearing handler mid-deploy. Parked.
  - Letting the 5s/10s asymmetry ride. Rejected at JR's call -- "fix the discrepancy" was explicit.
- **Naive next move:**
  - Spawning Batch 3 executor before JR paste-deployed v2.29.1. Wrong because plan-stated per-batch paste-deploy gate. Held.

## Hot Files

- `~/.claude/plans/audit-fixes-2026-05-02.md` -- the 4-batch plan. RETIRED. Kept on disk for reference. Do not re-execute steps; the file is now historical.
- `backend/Code.gs` -- v2.30.1 live. New `withDocumentLock_` helper at line 607. 16 wrapped handlers from line 1144 onward (`cancelTimeOffRequest`, `approveTimeOffRequest`, `denyTimeOffRequest`, `revokeTimeOffRequest`, then the 6 shift-offer + 6 swap decision handlers). v2.29.1 changePassword case-fold at lines ~875-895. v2.30.1 lock-timeout 10s at line 609 + 2223. `safeEmployeeForCaller_` line 420. `SAVE_EMPLOYEE_FIELDS_` line 226. `batchSaveShifts` ~line 2210 with own `tryLock(10000)`.
- `src/auth.js` -- Batch 4 M8: `clearAuth(reason)` writes to `localStorage.rainbow_auth_clear_reason`; `handleAuthError` calls with `'session_ended'` or `'account_inactive'`.
- `src/components/LoginScreen.jsx` -- Batch 4 M8: `useEffect` reads + clears `rainbow_auth_clear_reason` on mount, renders amber banner.
- `src/utils/apiTransforms.js` -- Batch 4 M10: `partitionShiftsAndEvents` early-returns on falsy `employeeId`.
- `src/App.jsx` lines 173 + 1004 + 1472 + `src/views/EmployeeView.jsx` line 318 -- Batch 4 M11: `datesRequested.split` guards. Mobile triangle button parked bug at `App.jsx:1654-1665`.
- `CONTEXT/DECISIONS.md` -- s055 audit-fix-scope + FirstnameL entries at top; nothing new from s056.

## Anti-Patterns (Don't Retry)

- **Don't bundle hotfixes into batch paste-deploys when isolated rollback matters more than fewer paste cycles.** v2.29.1 surfaced mid-Batch-2-smoke; v2.30.1 surfaced from Batch 3 executor's flag. Each got its own commit + own paste so a regression on the TOCTOU wrap could be reverted without losing the auth fixes. (s056: rejected the bundle-with-Batch-3 alternative twice.)
- **Don't pattern-match smoker findings as authoritative when they cross a backend invariant.** Verify against code before agreeing or escalating. (s056: bundled smoker said `saveEmployee` would overwrite `passwordChanged`; the Batch 1 `SAVE_EMPLOYEE_FIELDS_` allowlist drops it. Memory verification beat smoker assumption.)
- **Don't skip the plan after AskUserQuestion answers come back.** AskUserQuestion locks decisions; a plan documents file-level strategy. 2+ files OR 3+ concerns -> plan + approval before Edit. (Carry s055.)
- **Don't ask jargon-laden questions.** Define terms inline; assume beginner with dev terms unless used in-session. (Carry s055.)
- **Don't normalize-on-save what you can solve at read time.** When the user behavior is "case shouldn't matter," compare lowercased everywhere; don't add a write-side normalize + migration function. (Carry s055.)
- **Don't add server-side email allowlists for what's actually a Claude-discipline rule.** The pre-launch staff-email rule applies to ME (don't trigger sends to staff during smokes), not to the backend. (Carry s055.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carry s053. ~60% false-positive rate at re-rank.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carry s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carry s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist `{Sarvi, JR, john@johnrichmond.ca}`. (Carry s050.)
- **Don't hedge on tradeoffs without measurement.** (Carry s049.)
- **Don't call pre-launch dormant code "dead code".** (Carry s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carry s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carry s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carry s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carry s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carry s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carry s045.)

## Blocked

- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration) -- since 2026-05-03
- iPad print preview side-by-side -- since 2026-04-26
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- **Audit-fix plan is closed.** All findings either shipped + smoked, deferred (H3 to migration), or reframed (M9 as Claude-discipline). Next sessions pick from the regular Active list, not from the plan.
- **`withDocumentLock_` and `batchSaveShifts` share `LockService.getDocumentLock()`.** Both at `tryLock(10000)`. Any future handler that takes a doc lock must use the same instance and the same timeout, or document the asymmetry deliberately. The non-reentrant warning in the helper comment is load-bearing -- never call `withDocumentLock_` from inside an already-locked function.
- **Batch 1 allowlist (`SAVE_EMPLOYEE_FIELDS_`) is the contract for what admin form payloads can write.** Adding a new Employees column does NOT auto-make it admin-writable. Owner-only fields (`isAdmin`, `isOwner`, `adminTier`) require `auth.employee.isOwner` and live in `SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_`. Credential fields (`password` / `passwordHash` / `passwordSalt` / `passwordChanged`) are silently dropped because they have dedicated handlers.
- **Default password pattern is `FirstnameL`** (case-insensitive at first login when `passwordChanged=false`). v2.29.1 ensures `changePassword` self-path also accepts the cased default at the Set-Your-Password modal. Existing `emp-XXX` rows still work until next admin reset.
- **Apps Script live = `7abe364` v2.30.1.** Future paste-deploys: none queued.
- **Migration is research-complete + vendor-locked.** Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED.
- **AWS SES = SMTP for password-reset blast at Phase 4 T+1:10.**
- **Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line.** Per s044 DECISIONS.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **AGENTS.md is canonical post v5.2 bootstrap.**
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch. Claude-discipline rule, not a backend gap (per s055 audit triage).
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`. Owner-exclusion filters keep him hidden from schedule + staff lists.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `cinnabar. instanton.`. Active list now starts with the plan-retired note; pick next from below.
2. `git log --oneline -10` should show `s056 handoff`, then `39c55e0`, `4a227d0`, `7abe364`, `04f6912`, `3cd7e26`, `1164c53`, `31f1c23`, `ec5e8db` (s055 handoff), `d18e72a`.
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 0 commits awaiting paste. Live = `7abe364` (v2.30.1).
5. `grep -nE "withDocumentLock_|tryLock\(10000\)" backend/Code.gs` should hit the helper definition (~line 607) + 2 `tryLock(10000)` sites + 16 wrap call sites + the function-definition comment.
6. `grep -nE "rainbow_auth_clear_reason" src/` should match `src/auth.js` (write side, 2-3 hits) + `src/components/LoginScreen.jsx` (read side, 1-2 hits).
7. Test Guy: `john@johnrichmond.ca / TestG`, Active=false (s056 cleanup), `passwordChanged=false` (preserved by Batch 1 allowlist drop). Set-Your-Password modal will appear on next login.
8. AGENTS.md is canonical; shims rarely need repair.
9. Plan file `~/.claude/plans/audit-fixes-2026-05-02.md` is RETIRED. Kept for reference; do not re-execute.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: none. Audit-fix plan fully smoked.
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: pick from the Active list.

Natural continuations:

1. **Mobile triangle button still not clickable** (post-`6a17dcc`). Parked bug at `App.jsx:1654-1665`. AdaptiveModal swap from s055 fixed the panel rendering, not the button. Check tap-target size, z-index occlusion (mobile bottom nav?), parent flex eating the click. Verify on real device, not just Playwright @ 390x844.
2. **Mine tab missing shifts on live schedule** (raised s055). `App.jsx` mobileAdminTab='mine' rendering path. Likely `publishedShifts` vs `shifts` dataset mismatch -- the Mine tab may read from `publishedShifts` while the live schedule renders from `shifts`, so freshly-saved-but-not-republished shifts vanish.
3. **Mobile long-press on multi-event schedule cells -> bottom-sheet detail** (raised s054). Reuse `MobileBottomSheet`; ~30 lines of new component.
4. **Refactor `batchSaveShifts` to use `withDocumentLock_`** (parked from s056 v2.30.1 decision). Single source of truth for the lock + timeout. Lower-priority cleanup.
5. **Migration Phase 0** when JR sets ship decision -- Supabase project + DDL + RLS + `store_config` seed.

Open with: ack the plan completion + ask which of the Active items to pick first. Default if not specified is **(1) mobile triangle button** since it's a real bug raised by JR mid-s055 and still open.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
