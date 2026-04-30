# 09 -- Cutover + Rollback Plan

Last refreshed: 2026-04-29

Source-class legend: **C** codebase (path:line), **VD** vendor docs (URL), **S** synthesis on cited prior facts.

This is the phased sequence to migrate from Apps Script + Google Sheets to Supabase Postgres + admin-UI, plus the rollback procedure at each phase. Built on docs 01-08 + 10.

**Status: research only.** No execution date. The dates and durations below are working assumptions to size the plan, not commitments.

---

## 1. Pre-conditions before cutover begins

These must be true before Phase 0 starts. Anything missing blocks the plan.

| Pre-condition | Source | How to verify |
|---|---|---|
| Wave 3 docs (02, 08, 09) reviewed by JR | -- | this doc done; 02 + 08 already landed |
| `sendBrandedScheduleEmail` auth-gate bug confirmed/fixed | 03 + 06 cross-flag | smoke s034 backend live (still owed) |
| `bulkCreatePKEvent` decision: kill or wire up | 03 + 04 | one commit either way; not load-bearing |
| OTR not in a busy retail period (December, sales weeks) | -- | pick a quiet Mon-Wed window |
| Sarvi notified ~7 days ahead | -- | one email + verbal |
| Apps Script `HMAC_SECRET` value privately recorded | LESSONS:178 | so legacy rollback is one ScriptProperty restore |
| Hand-export Sheet snapshot taken to Drive folder | -- | covers worst-case data-loss scenario |
| Production Vercel rollback target known | -- | Vercel dashboard: prior deploy URL pinned |
| Domain DNS: no DNS changes ride along with cutover | -- | reduce blast radius |

---

## 2. Phase model overview

| Phase | Days | What ships | Reversible? |
|---|---|---|---|
| 0 | -14 to -7 | Supabase project, schema DDL, RLS, seed | trivially -- delete project |
| 1 | -7 to -3 | Edge Functions, webhook handler (no-op), email service | trivially -- nothing wired to prod |
| 2 | -3 to -1 | ETL Sheet -> Postgres (one-shot bulk load) + diff | trivially -- delete data, no prod impact |
| 3 | -1 | Supabase Auth users created for 35 staff (password_reset_required=TRUE) | trivially -- delete auth users |
| 4 | day 0 (~2hr window) | Frontend cutover; Sheet mirror enabled; password-reset blast | hard -- Sarvi staff have new auth state |
| 5 | day 0 to day 14 | Soak; Apps Script read-only; mirror primary writer | progressively harder |
| 6 | day 14+ | Apps Script decommissioned; mirror permanent | irreversible |

**Cutover window (Phase 4) is the only user-visible event.** Everything before is dark prep. Everything after is observation.

---

## 3. Phase 0 -- Foundations (-14 to -7)

### 3.1 Supabase project create

- Region: ca-central-1. **S** ref 10:21.
- Plan: Pro ($25/mo). PITR add-on deferred to post-soak. **S** ref 10:39, 10:220.
- Project name: `rainbow-scheduling-prod`.
- Enable JWT Signing Keys (asymmetric) for future rotation flexibility. **S** ref 05:228.

### 3.2 Schema DDL

- Apply DDL from `02-schema-proposed.md` §1-§5. CITEXT extension required.
- Apply triggers: `updated_at` autoset on every domain table; `profiles → auth.users.raw_app_meta_data` sync trigger (§1.3).
- Apply enums: `shift_change_status`.
- Apply views: `v_shift_changes_mirror` (per `08-sheet-mirror-design.md` §8.2).

### 3.3 RLS policies (14)

Per `05-auth-migration.md` §3-4. Apply policies before any data lands so no row is ever readable to the wrong principal.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | self OR admin | admin | self (limited fields) OR admin | admin (soft only) |
| shifts | self OR admin | admin | admin | admin |
| store_config | all auth | -- | admin | -- |
| announcements | all auth | admin | admin | admin |
| shift_change_requests | self/recipient/partner OR admin | self OR admin | self (transitions) OR admin | admin |

Policies on the 3 child request tables inherit by joining parent. **S** ref 05:198-205.

### 3.4 Seed minimum data

- `store_config` singleton row from current Settings tab values.
- No employees yet -- those flow in Phase 2.

### 3.5 Verification gate before Phase 1

- DDL applies clean from a fresh DB.
- RLS policies tested with synthetic JWTs (anon, employee, admin1, admin2, owner) -- 5 SELECT/INSERT/UPDATE/DELETE matrix against each table.
- `select * from public.profiles` as the anon role returns 0 rows or RLS-deny error.

---

## 4. Phase 1 -- Backend parallel build (-7 to -3)

### 4.1 Edge Functions (8)

Per `03-appscript-inventory.md` "edge-function" class. These cannot be replaced by raw `supabase.from(...).insert(...)` from the frontend because they need transactional logic spanning multiple tables (status transitions, lock acquisition, cross-row consistency).

| Edge Function | Replaces | Notes |
|---|---|---|
| `batch-save-shifts` | `batchSaveShifts` (Code.gs:1800) | One transaction; partial-unique idempotency; Realtime publishes per-row at commit. **S** ref 03:16. |
| `submit-shift-offer` | `submitShiftOffer` | Validates offerer owns the shift; resolves recipient_id from email. |
| `accept-shift-offer` | `acceptShiftOffer` | Status transition + email send; runs inside a transaction. |
| `approve-shift-offer` | `approveShiftOffer` | Status transition + shift row mutation atomically. |
| `submit-swap-request` | `submitSwapRequest` | Validates both parties own respective shifts; resolves partner_id. |
| `accept-swap-request` / `approve-swap-request` | analogous | Same shape as offers. |
| `bulk-create-pk-event` | `bulkCreatePKEvent` (if kept) | Or remove entirely per orphan-handler decision. |
| `check-expired-requests` | `checkExpiredRequests` | Cron-driven (pg_cron) hourly. |

The other 22 "direct-supabase" backend functions become raw `supabase-js` calls from the frontend. **S** ref 03:8-22.

### 4.2 Sheet mirror Edge Function (`sync-to-sheet`)

Per `08-sheet-mirror-design.md`. Deploy in Phase 1 but **do not install the Postgres webhook triggers yet** -- those route on Phase 4. Test by manually invoking with a fake payload.

### 4.3 Email service

Per `06-email-migration.md` -- pick AWS SES (ca-residency) or Resend (free tier, easier setup). Phase 1 ships the email-sending Edge Function with all 21 email templates rebuilt. **S** ref 06.

### 4.4 Verification gate before Phase 2

- All 8 Edge Functions deploy and respond on test invocations.
- Sheet mirror function writes to a **scratch Sheet** (not the production one) without errors.
- Email service can send a test email to `johnrichmond007@gmail.com`.

---

## 5. Phase 2 -- ETL: Sheets -> Postgres (-3 to -1)

### 5.1 ETL script (one-shot, idempotent)

Run from a local Node script with a service-role Supabase key. Reads from Apps Script via existing `getAllData` action. Writes to Postgres with the value-transforms from `02-schema-proposed.md` §7.

Order matters because of FKs:
1. `profiles` (no FK dependencies on other domain tables)
2. `store_config` (independent)
3. `announcements` (independent)
4. `shifts` (FK -> profiles)
5. `shift_change_requests` (FK -> profiles)
6. `time_off_requests` / `shift_offers` / `shift_swaps` (FK -> parent)

Idempotency: every insert uses `ON CONFLICT (legacy_id) DO UPDATE`. Re-running the ETL reconciles.

### 5.2 Diff verification

After ETL completes, run a diff:
- Row counts per table match the Sheet tab row counts (excluding header).
- Spot-check 10 random rows per table by full-row equality (with format conversions applied).
- Total shift count for the current pay period matches.
- Total active employee count matches.

Any mismatch blocks Phase 3.

### 5.3 Sheet snapshot

Hand-export the Sheet to Drive (`Backup-pre-cutover-YYYY-MM-DD.xlsx`). This is the disaster-recovery floor.

### 5.4 Verification gate before Phase 3

- ETL diff is clean.
- Sheet snapshot captured.
- JR has spot-checked at least one full employee record end-to-end.

---

## 6. Phase 3 -- Auth migration (-1)

### 6.1 Create auth users

For each row in `profiles`, call `supabase.auth.admin.createUser({ email, password: random32, email_confirm: true, app_metadata: { is_admin, is_owner, admin_tier, employee_id }, user_metadata: {}, password_reset_required: true })`. **VD** https://supabase.com/docs/reference/javascript/auth-admin-createuser.

- Random password: 32 bytes base64 -- never displayed, never used. The reset-required flag forces a reset before login completes.
- `email_confirm: true` skips the confirmation email; staff don't need to verify their address (Sarvi already vetted them).
- `app_metadata` claims hand-mapped from the `profiles` row at creation time.

### 6.2 Backfill `profiles.id` from `auth.users.id`

After creation, update each `profiles.id` to match the new `auth.users.id` (1:1 link). Or, if the FK was set up the other direction, no backfill needed.

### 6.3 Verification gate before Phase 4

- All 35 staff have an `auth.users` row with `password_reset_required = true`.
- `profiles.id` matches `auth.users.id` for every row.
- Smoke a synthetic login with one test user (e.g. testguy account): try login → reset prompt appears → set new password → login completes → JWT contains expected `app_metadata`.

---

## 7. Phase 4 -- Cutover Day (day 0, ~2 hour window)

The only user-visible event. Pick a Tuesday morning at 09:00 ET (OTR opens at 11:00, so 2 hours of slack). Sarvi notified.

### 7.1 Sequence

| T+ | Action | Who |
|---|---|---|
| 0:00 | Disable Apps Script `/exec` writes by deploying a sentinel `Code.gs` that returns `MIGRATION_IN_PROGRESS` for all mutating actions; reads still work. | JR |
| 0:05 | Run final delta ETL (catch any Sheet writes between Phase 2 and now). | JR |
| 0:15 | Deploy frontend bundle that uses Supabase. Vercel deploy + verify bundle hash. | JR |
| 0:25 | Smoke: log in as testguy. Reset password. View schedule. Make a test shift edit. Verify it lands in Postgres + mirrors to Sheet within 60s. | JR |
| 0:40 | Install Postgres webhook triggers -> `sync-to-sheet` Edge Function (mirror goes live). | JR |
| 0:50 | Run `sync-to-sheet` full-refresh once to baseline the Sheet. | JR |
| 0:55 | Diff the mirrored Sheet vs the hand-export snapshot. Acceptable: same rows; differences only in the auth columns (D/S/T/U) which are now blank. | JR |
| 1:10 | Send password-reset blast email to all 35 staff with instructions: "Visit app, click forgot password, follow the email." | JR |
| 1:20 | Apps Script `/exec` switched to fully read-only (returns `READ_ONLY_MIRROR_MODE` for all actions including reads, OR is left as-is for emergency rollback). Recommendation: leave reads working as a sanity check. | JR |
| 1:30 | Active monitoring window starts (see §8). | JR |

### 7.2 Password-reset blast (load-bearing irreversible step)

Email body: clear, branded, links to `https://rainbow-scheduling.vercel.app/login`. Instructs staff to use "Forgot password?" with their work email. Mentions one-time inconvenience. Not chatty.

Failure modes:
- **Email goes to spam:** mitigated by sending from the same address Sarvi already uses; SPF/DKIM verified during Phase 1.
- **Staff don't reset within X days:** the account stays in `password_reset_required` state until they do; they cannot log in. Sarvi will receive in-person help requests. This is fine -- expected drag, not a blocker.
- **Staff use an old saved password from a password manager:** Supabase rejects with "password reset required"; manager prompts for new one. Smooth.

### 7.3 Cutover-day verification gate

- testguy round-trips an edit successfully.
- Sheet mirror reflects the edit within 60s.
- 0 Edge Function exceptions in the dashboard logs.
- 0 `auth.signin` errors in the auth logs (other than expected `password_reset_required` prompts).
- Password-reset blast email lands in JR's inbox (sentinel test for deliverability).

---

## 8. Phase 5 -- Soak (day 0 to day 14)

### 8.1 What's happening

- Frontend writes to Postgres only. Apps Script `/exec` is decommissioned for writes.
- Sheet mirror runs continuously: webhook on every `profiles`/`shifts`/`store_config`/`announcements`/`shift_change_requests` change.
- Nightly full-refresh cron at 02:00 ET rebuilds all 5 tabs from DB.

### 8.2 Active observation (daily for 14 days)

| Check | Where | What's normal |
|---|---|---|
| Edge Function exception count | Supabase dashboard logs | 0-2/day; investigate any pattern |
| Webhook delivery success | `net._http_response` table | > 99% 2xx |
| Sheet diff vs DB | manual spot-check or a small diff script | identical |
| Auth signin failures | Supabase auth logs | trending down as staff complete reset |
| Password-reset completions | auth.users.password_reset_required = false | should reach 35 within 7 days; chase stragglers |

### 8.3 Rollback decision points during soak

See §10. The first 72 hours are the highest-risk window. After day 7 with all 35 staff successfully reset, rollback becomes prohibitively expensive (DB and Sheet have diverged from the pre-cutover Sheet snapshot).

---

## 9. Phase 6 -- Decommission (day 14+)

If soak is clean:

1. Apps Script `/exec` deployment archived (not deleted -- archived URL kept for emergency reference).
2. The bound script's triggers (if any) disabled.
3. `HMAC_SECRET` ScriptProperty rotated one final time (so the recorded value can't be re-used; a hostile actor with the old secret can't forge tokens against a now-dead endpoint, but defense in depth).
4. Apps Script editor pinned-tab in browser closed.
5. `CONTEXT/DECISIONS.md` entry: "Apps Script + Sheets backend decommissioned YYYY-MM-DD; Supabase ca-central is sole source of truth."

The Sheet itself stays alive forever as the read-only mirror. Sarvi keeps her viewing surface.

---

## 10. Rollback procedures

Rollback is reversible-up-to-a-point. The point is the password-reset blast in Phase 4. Before that, rollback is a deploy revert. After, it's an active recovery operation.

### 10.1 Rollback triggers

Roll back if any of:

| Trigger | Severity | Phase where it can fire |
|---|---|---|
| Schema DDL fails to apply cleanly on a fresh DB | hard-block | 0 |
| RLS policy lets anon role read profiles | hard-block | 0 |
| Edge Function 5xx rate > 10% on smoke | hard-block | 1 |
| ETL diff finds > 0.5% row mismatches | hard-block | 2 |
| Auth user creation fails for ≥ 1 staff member | hard-block | 3 |
| Cutover smoke fails (testguy can't log in or shift doesn't mirror) | hard-block | 4 (≤ T+1:30) |
| Password-reset blast email fails to deliver to ≥ 5% of staff | hard-block | 4 (≤ T+1:30) |
| Persistent Edge Function exceptions during first 72h soak | soft-rollback (case-by-case) | 5 |
| Sheet mirror systematically corrupted | soft-rollback | 5 |
| ≥ 3 staff lose access for > 24h | soft-rollback | 5 |

### 10.2 Rollback procedures by phase

**Phase 0-3 (pre-cutover):** trivial. Delete the Supabase project. Apps Script + Sheets are untouched. Frontend untouched. Zero user impact.

**Phase 4 -- before T+1:00 (before password-reset blast):**
1. Revert frontend Vercel deploy to the prior bundle (one click in dashboard).
2. Re-deploy original Apps Script `Code.gs` (remove the `MIGRATION_IN_PROGRESS` sentinel).
3. Verify with a real shift edit by Sarvi.
4. Send Sarvi a "we hit an issue, rolled back, all good" email.
5. The Supabase data sits there idle; new edits go to Sheet only. Diff at next attempt.

User impact: minutes of downtime; no data loss.

**Phase 4 -- after T+1:10 (after password-reset blast):** This is the tough case. Staff have reset passwords in Supabase Auth. Apps Script auth doesn't know about that. Two paths:

- **Path A (forward-fix):** debug the issue without rolling back. Most cutover problems are fixable in-place (Edge Function bug, RLS policy off-by-one, mirror drift). Fix in production with JR active monitoring.
- **Path B (hard rollback):** restore Apps Script as the source of truth. Requires:
  1. Frontend revert.
  2. Apps Script `Code.gs` redeploy.
  3. **Manual reconciliation:** any shift edits made via Supabase between cutover and rollback must be hand-typed back into the Sheet. ETL the new DB rows back to Sheet.
  4. **Auth fallout:** staff who reset their password in Supabase still have the OLD plaintext-emp-XXX password in the Sheet (column D was never wiped). They can re-log-in to Apps Script auth with the original default password OR an admin can reset them via the legacy admin tool.
  5. Communicate clearly: "we rolled back, please use your default password again."

Path A is preferred unless the Edge Function failure mode is fundamental.

**Phase 5 (soak):** rollback complexity grows linearly with day count. By day 7, the DB has potentially thousands of edits the Sheet doesn't have (since Apps Script writes are disabled). Rollback requires a custom DB → Sheet replay (the same `sync-to-sheet` mirror, but a one-shot full export) plus restoring Apps Script writes plus telling staff to use default passwords again.

**Phase 6 (decommission):** rollback is no longer a procedure -- it's a project. Apps Script can be undeleted, but the operational gap is too long for staff to remember the legacy auth flow. Treat as one-way at this point.

### 10.3 Disaster recovery (independent of rollback)

If both the DB and the Sheet are lost (catastrophic):

1. Restore DB from Supabase daily backup (last 7 days). **S** ref 10:219.
2. Run mirror full-refresh from restored DB to a new Sheet.
3. If the daily backup is also corrupt, restore the hand-export Sheet snapshot from Phase 2.5 to a new Apps Script project; staff log in with default passwords.

Disaster recovery is not the same as rollback -- it's the floor below all of this.

---

## 11. Communication plan

### 11.1 Pre-cutover (T-7 days)

Email to Sarvi + JR: "Migration starts Tuesday at 09:00. Nothing changes for you until Tuesday morning, when you'll be asked to reset your password once. The Sheet stays where it is, but it becomes view-only -- edits happen in the app from now on. The app is the same app you use today, no UI change."

### 11.2 Cutover-morning (T+1:10)

Email blast to all 35 staff (template draft, not in this doc): instructions to reset password. Plain language. One-step instruction. Link.

### 11.3 Soak-week (day 1, day 7)

Status update to Sarvi: "Day 1 looks clean. Mirror is keeping up. X of 35 staff have reset their passwords. No issues to report." Day 7: "Soak halfway. Y of 35 reset. Z minor issues, all resolved."

### 11.4 Decommission (day 14)

Internal note to JR: migration complete, Apps Script archived, DECISIONS.md entry written.

---

## 12. Open items not specified here

Items deferred from prior docs that the cutover plan touches but doesn't resolve:

1. **Sick-day storage finality:** §11 of `02-schema-proposed.md` Q1 resolved as `type='sick'` row in `shifts`; verify against `src/utils/scheduleOps.js` before Phase 0 DDL.
2. **`recipient_id`/`partner_id` lookup at insert (Q4):** ETL script and Edge Functions both need the email→profile lookup wired. Spec'd in §5 of 02; implementation lives in Edge Function code.
3. **`rotateHmacSecret` analog:** Phase 6 step 3 mentions rotating the legacy secret one last time. Supabase JWT signing key rotation is the analog if needed post-decommission. **S** ref 05:222-228.
4. **PITR add-on decision:** §3.1 defers PITR to post-soak. Cost-benefit: $100/mo for 7-day PITR vs daily backups already included. JR call once OTR is signed.
5. **Custom SMTP for password-reset emails:** Supabase default SMTP can hit spam filters. Phase 1 §4.3 mentions ses/resend; the password-reset emails specifically might want a dedicated transactional sender. Verify deliverability in Phase 1 smoke.
6. **`adminTier=admin2` edge cases at cutover:** the 5 view-only staff. Verify their app_metadata flows correctly; per `05-auth-migration.md` §6 risk row, this needs explicit confirmation.

---

## 13. Files this doc depends on

- `01-schema-current.md` -- ETL source shape.
- `02-schema-proposed.md` -- ETL target shape, RLS surface.
- `03-appscript-inventory.md` -- replacement-class table, sequencing of Edge Function builds.
- `04-apicall-callsite-map.md` -- frontend cutover scope (47 callsites).
- `05-auth-migration.md` -- password-reset blast, JWT TTL, RLS policies, cutover-risk table.
- `06-email-migration.md` -- email service Phase 1.
- `07-pdf-migration.md` -- not load-bearing for cutover; PDF stays browser-print today.
- `08-sheet-mirror-design.md` -- mirror architecture; cutover hooks in §13.
- `10-supabase-due-diligence.md` -- region, plan, backup, webhook delivery semantics.

## 14. Wave 3 status

With this doc landed, all 10 migration research deliverables are complete. The decision to ship is separate from research completeness; this plan sits ready until JR sets a cutover date.
