# s055 -- 2026-05-03 -- Audit-fix plan in flight; Batch 1 paste-deployed

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

vermilion. soliton.

Pass-forward: 4-batch audit-fix plan in flight; Batch 1 paste-deployed but un-smoked, executor + smoker resume from there.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `d18e72a` on `main`, will be `s055 handoff` after Step 7. Six session commits beyond s054: `1a492ef` and the s054 commits already shipped pre-session; this session shipped `47a4ef4` (eye-toggle), `8ab6a05` (FirstnameL default password), `6a17dcc` (violations panel gate + drop X + mobile bottom-sheet), `d18e72a` (audit Batch 1 -- data exposure + privilege escalation hardening, backend Code.gs v2.28).
- **Apps Script live deployment:** in sync with `d18e72a` -- both `8ab6a05` (v2.27) and `d18e72a` (v2.28) backend changes paste-deployed by JR 2026-05-03. No drift.
- **Active focus end-of-session:** audit Batch 1 paste-deployed but un-smoked. Batches 2-4 queued per plan at `~/.claude/plans/audit-fixes-2026-05-02.md`. Each backend batch is one Apps Script paste-deploy.
- **Skills used this session:** `/coding-plan` (full Phase 0-6, Batch 1 only), `/handoff` (s055 now). Adversarial subagent audit task `abc43136c61d5e215` returned 15 ranked findings.

## This Session

**Continuation theme: started with three quick UI/auth fixes, pivoted to a full adversarial audit + 4-batch fix plan, shipped Batch 1.**

**Commits shipped (4 total):**

- `47a4ef4` feat(auth): show/hide eye toggle on password inputs.
  - Lucide `Eye` / `EyeOff` icon inside `LoginScreen` password input + `PasswordFormFields` (used by `ChangePasswordModal` + `AdminSettingsModal`).
  - Stateful per input, default hidden, `tabIndex=-1` so Tab order skips the toggle button.
  - `PasswordField` helper hoisted outside the parent component to keep input focus stable across renders (defining inline would remount on every keystroke).
  - Build PASS. JR confirmed working live.

- `8ab6a05` feat(auth): default password = FirstnameL, case-insensitive at first login (backend Code.gs v2.27.0).
  - Default switches from `emp-XXX` (zero-padded `_rowIndex - 1`) to `FirstnameL` (first name + last initial). Single-word names use whole word; hyphenated last names take first segment's initial; collisions append digit (`JohnR`, `JohnR2`); empty/garbage names fall back to `emp-XXX`.
  - Login lowercases input before hash when `passwordChanged === false` so phone autocorrect doesn't lock employees out day one. User-chosen passwords stay strict.
  - Helper duplicated frontend (`computeDefaultPassword` in `src/utils/employees.js` for live preview) + backend (`computeDefaultPassword_` authoritative). Modal previews from typed name with `pwTouched` state to stop overwriting once admin manually edits.
  - JR live-confirmed by paste-deploying + smoke-testing.

- `6a17dcc` fix(violations): gate panel rows by edit mode, drop dismiss X, mobile bottom-sheet.
  - Three issues in one commit. (1) Panel row click bypassed `isCurrentPeriodEditMode` gate that cell-click already respected; rows now render as plain divs (cursor:not-allowed, muted) with banner when locked. (2) X-to-dismiss on violations inside `ShiftEditorModal` was per-modal-session only (no persist) but the affordance suggested an "I acknowledge" override; removed entirely so violations stay informational. (3) Mobile violations modal was using desktop-only `Modal` primitive; swapped to `AdaptiveModal` so it renders `MobileBottomSheet` on mobile, centered Modal on desktop.
  - Note: mobile triangle BUTTON itself still not clickable post-`6a17dcc` -- JR raised this immediately after smoke. Separate bug, parked in TODO Active.

- `d18e72a` fix(audit): batch 1 -- data exposure + privilege escalation hardening (backend Code.gs v2.28.0).
  - **C2 (CRITICAL):** new `safeEmployeeForCaller_(employee, callerIsAdmin)` helper makes `getAllData` + `getEmployees` return per-caller-role employee shapes. Non-admins no longer see `passwordHash` / `passwordSalt` / plaintext default-password column or PII (phone, address, dob, rateOfPay, adpNumber, counterPointId). Admins still get the full safe shape.
  - **C1 (CRITICAL):** explicit `SAVE_EMPLOYEE_FIELDS_` allowlist on `saveEmployee` plus `SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_` (`isAdmin`, `isOwner`, `adminTier`) gated by `auth.employee.isOwner`. Sarvi (admin1) can no longer promote herself to owner or rewrite the owner's row. `password` / `passwordHash` / `passwordSalt` / `passwordChanged` silently dropped from incoming payloads (they have dedicated handlers).
  - **L13 (LOW reranked HIGH after C1+C2):** `resetPassword` refuses to reset the owner or any admin1 unless caller is owner. Closes "admin1 resets JR to default + logs in as owner" path that was trivial under v2.27's case-insensitive default-password login.
  - DECISIONS.md entry written by executor at top: "Audit-fix scope: internal-trust waiver covers deactivation, NOT auth/data-exposure."
  - Build PASS. **Paste-deployed by JR 2026-05-03**; Playwright smoke pending next session.

**Adversarial audit task (subagent `abc43136c61d5e215`):**

- Read-only background agent. Returned 15 ranked findings (CRITICAL/HIGH/MEDIUM/LOW) plus 8 noted-but-lower priority. Triage: 8 ship-worthy + 5 deferred + 2 false positives + 1 dropped (M9 sendBrandedScheduleEmail allowlist reframed by JR as Claude-discipline, not a backend bug).
- Plan written: `~/.claude/plans/audit-fixes-2026-05-02.md` (~1100 lines). 4 batches with file:line citations + before/after blocks + paste-deploy gates + per-batch rollback.
- Email case handling collapsed at JR's call: read-side compare lowercased everywhere; storage never normalized; no migration function. Less code, identical user behavior.

**Plan execution status (audit-fixes plan):**

- Batch 1 (C2 + C1 + L13): SHIPPED + PASTE-DEPLOYED. Smoke pending.
- Batch 2 (H4 type-filter + H5 cache-bust + M7 reorder + M12 read-side lowercase): not yet started.
- Batch 3 (H6 TOCTOU lock-wrap on 16 handlers via new `withDocumentLock_`): not yet started.
- Batch 4 (frontend M8 AUTH_REQUIRED clear + M10 empty-employeeId filter + M11 datesRequested.split guard): not yet started.
- H3 (chunkedBatchSave concurrent saves) -- explicitly deferred to migration; Batch 4 step 4.6 adds a TODO Blocked entry.

**Design discussion this session:**

- **Plan-vs-clarify rule miss.** When JR locked decisions via 3 AskUserQuestions on the violations panel work and I went straight to Edit, JR called it out: "you didnt even write a plan?" Right -- AskUserQuestion locks decisions; a plan documents file-level strategy. Memory `feedback_plan_before_multifile_implementation.md` written and indexed.
- **Accessible-questions rule miss (twice).** My first M9/M12 clarify burned questions on jargon ("M9 allowlist scope", "uppercase-bearing rows"). JR called: "I don't know what you mean by any of this" then "don't we have a rule about clarity?" Re-asked in plain language; got clean answers. Existing global rule `~/.claude/rules/accessible-questions.md` already covers this. Self-correction logged in handoff Anti-Patterns; no new memory needed.
- **Mobile triangle button still broken** post-`6a17dcc`. AdaptiveModal swap was supposed to fix the panel rendering, not the button. Real bug, parked.
- **Mine tab missing shifts on live schedule** raised by JR. Sarvi's shifts not appearing in her Mine tab on a live period. Likely related to `publishedShifts` vs `shifts` dataset selection. Parked.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `kintsugi. spinor.` -> `vermilion. soliton.`. Added 2 Active items (mobile triangle bug, Mine tab bug, plus the audit-fix plan tracker). Added 4 Completed entries (`d18e72a`, audit-plan, `6a17dcc`, FirstnameL/`8ab6a05`, eye-toggle/`47a4ef4`). Trimmed older Completed (`9376c7b`, `3093c60`, `f1efc38`, `1a492ef`, `576e50e`) to comment line. Updated Verification: live Apps Script now `d18e72a`; Batch 1 smoke pending.
- `CONTEXT/DECISIONS.md`: one entry written by Batch 1 executor: "Audit-fix scope: internal-trust waiver covers deactivation, NOT auth/data-exposure." (Plus the FirstnameL entry from earlier `8ab6a05`.)
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carries; audit pattern observations might graduate later).
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; new helpers are local additions).
- Auto-memory: `feedback_plan_before_multifile_implementation.md` written and indexed in MEMORY.md.

**Audit (Step 3 of HANDOFF):**

`Audit: clean (LESSONS 68,794/25k carries from prior sessions; pre-existing TODO MD041 + MD034 soft-warns)`

**Decanting:**

- **Working assumptions:**
  - Assumed `getAllData` was admin-only at first read; it's actually called on app startup for every logged-in user (verified at App.jsx:304). Now baked into `safeEmployeeForCaller_` per-caller-role logic.
- **Near-misses:**
  - Nearly shipped M9 (sendBrandedScheduleEmail server-side allowlist) before JR's correction reframed it as Claude-discipline, not a backend gap. Plan dropped it cleanly.
  - Nearly shipped saveEmployee write-side email lowercase + a one-shot `lowercaseAllEmails_()` migration function before JR's "make it easier -- just compare lowercased everywhere" collapsed the design to read-side-only.
- **Naive next move:**
  - Spawning the Batch 2 executor right now. Wrong because Batch 1 needs Playwright smoke before Batch 2 ships on top of it. Plan-stated gate.

## Hot Files

- `~/.claude/plans/audit-fixes-2026-05-02.md` -- the 4-batch plan. Read this first when resuming. File:line + before/after blocks + paste-deploy gates + per-batch rollback paths.
- `backend/Code.gs` -- v2.28.0 live. New `safeEmployeeForCaller_` helper (around line 396), `SAVE_EMPLOYEE_FIELDS_` + `SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_` constants (around line 212), `saveEmployee` filter loop (around line 1832), `resetPassword` owner-and-admin1 gate (around line 884). Batch 2 will touch `approveShiftOffer` (~1308), `approveSwapRequest` (~1564), `revokeShiftOffer` + `revokeSwapRequest` shift lookups, `batchSaveShifts` cache-bust (~2042), `login` lowercase compare (~715), `getEmployeeByEmail` (~540), `changePassword` (~800), `resetPassword` (~884).
- `src/auth.js` -- Batch 4 will add AUTH_REQUIRED to `handleAuthError` (line 53) and add `reason` arg to `clearAuth`.
- `src/utils/apiTransforms.js` -- Batch 4 will add empty-employeeId filter to `partitionShiftsAndEvents` (~line 80).
- `src/App.jsx` -- Batch 4 will guard `req.datesRequested.split` at lines 1004 + 1472. Mobile triangle button parked bug at lines 1654-1665.
- `src/views/EmployeeView.jsx` -- Batch 4 will guard `req.datesRequested.split` at line 318.
- `src/components/LoginScreen.jsx` -- Batch 4 will add the AUTH_REQUIRED banner state.
- `CONTEXT/DECISIONS.md` -- s055 audit-fix-scope entry + s055 FirstnameL entry already at top.

## Anti-Patterns (Don't Retry)

- **Don't skip the plan after AskUserQuestion answers come back.** AskUserQuestion locks decisions; a plan documents file-level strategy. 2+ files OR 3+ concerns -> plan + approval before Edit. (s055 violations panel work: I shipped without a plan, JR called it out. Memory `feedback_plan_before_multifile_implementation.md`.)
- **Don't ask jargon-laden questions.** When asking the user anything, define terms inline; assume beginner with dev terms unless used in-session. Lead with plain language. (s055: burned 2 clarify rounds on "M9 allowlist scope" and "uppercase-bearing rows" before re-asking in plain English. Existing rule `~/.claude/rules/accessible-questions.md`.)
- **Don't normalize-on-save what you can solve at read time.** When the user behavior is "case shouldn't matter," compare lowercased everywhere; don't add a write-side normalize + migration function. (s055 plan: nearly shipped that whole ceremony before JR's "make it easier for everyone" collapsed it to read-side-only.)
- **Don't add server-side email allowlists for what's actually a Claude-discipline rule.** The pre-launch staff-email rule applies to ME (don't trigger sends to staff during smokes), not to the backend. (s055: nearly shipped M9 before JR's correction.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carried s053. ~60% false-positive rate at re-rank.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carried s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carried s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist `{Sarvi, JR, testguy@john@johnrichmond.ca}`. (Carried s050.)
- **Don't hedge on tradeoffs without measurement.** (Carried s049.)
- **Don't call pre-launch dormant code "dead code".** (Carried s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carried s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carried s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carried s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carried s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carried s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carried s045.)

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration) -- since 2026-05-03

## Key Context

- **Audit-fix plan is the master document for the next 3-4 sessions of work.** `~/.claude/plans/audit-fixes-2026-05-02.md`. Each batch is one commit + one paste-deploy + one Playwright smoke.
- **Internal-trust waiver scope clarified durably.** s055 DECISIONS entry: deactivation guards (self/owner/admin1) get the "we trust Sarvi" pass and stay frontend-only; auth-bypass / data-exposure / privilege-escalation gaps do NOT.
- **Default password pattern is `FirstnameL`** (case-insensitive at first login when `passwordChanged=false`). Existing `emp-XXX` rows still work until next admin reset, which writes the new form.
- **Apps Script live = `d18e72a`** (Batch 1). Future paste-deploys: Batch 2 (v2.29), Batch 3 (v2.30).
- **Migration is research-complete + vendor-locked.** Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED.
- **AWS SES = SMTP for password-reset blast at Phase 4 T+1:10.**
- **Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line.** Per s044 DECISIONS.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **AGENTS.md is canonical post v5.2 bootstrap.**
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, testguy@john@johnrichmond.ca}` exactly until launch. This is a Claude-discipline rule, not a backend gap (per s055 audit triage).
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`. Owner-exclusion filters keep him hidden from schedule + staff lists.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `vermilion. soliton.`. Top Active items: audit-fix plan tracker, mobile triangle button broken, Mine tab missing shifts.
2. `git log --oneline -8` should show `d18e72a` (Batch 1 audit fixes), `6a17dcc` (violations panel), `8ab6a05` (FirstnameL), `47a4ef4` (eye-toggle), `6b4df5f` (s054 handoff), then the s054 commits.
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 0 commits awaiting paste. Live = `d18e72a` (v2.28).
5. `grep -nE "safeEmployeeForCaller_|SAVE_EMPLOYEE_FIELDS_|SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_" backend/Code.gs` should match the helper definition + 2 constants + at least 3 usage sites.
6. `grep -nE "function getAllData|function getEmployees|function saveEmployee|function resetPassword" backend/Code.gs` should still hit those handlers (line numbers may have drifted slightly from plan-time; Batch 2 pre-flight will re-verify).
7. testguy account: still Inactive (s053-end state); email `john@johnrichmond.ca`; password `test007`.
8. AGENTS.md is canonical; shims rarely need repair.
9. Plan file: `~/.claude/plans/audit-fixes-2026-05-02.md` -- the executor reads this; do not edit it without re-planning.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `d18e72a` Batch 1 paste-deployed but un-smoked. Highest priority.
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: audit-fix plan tracker.

JR's stated direction at end of session: "consider this redeployed. let's continue after a /handoff" -- meaning Batch 1 is paste-deployed live, smoke + Batch 2 spawn happens next session.

Natural continuations:

1. **Run the Batch 1 Playwright smoke** (Phase 7 of `/coding-plan`). Smoke matrix in plan + TODO Verification. Login as Testguy, confirm `getAllData` strip; login as JR, confirm full shape; resetPassword-as-non-owner-admin attempt expects AUTH_FORBIDDEN. Soft-cleanup test rows after.
2. **Spawn the Batch 2 executor** once Batch 1 smoke passes. Plan path: `~/.claude/plans/audit-fixes-2026-05-02.md` Batch 2 only. Do NOT proceed to Batch 3 in same spawn -- per-batch paste-deploy gate.
3. **Mobile triangle button bug + Mine tab bug** are TODO items but they're not on the audit-fix critical path. Investigate after Batches 2-4 ship.

Open with: ack the paste-deploy + run the Batch 1 smoke first. Default if not specified is **(1) Batch 1 smoke**.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
