# 05 -- Auth Migration: Apps Script HMAC -> Supabase Auth

Last refreshed: 2026-04-29

Source-class legend: **C** codebase (path:line), **VD** vendor docs (URL), **VM** vendor marketing (flagged), **L** LESSONS.md / DECISIONS.md.

---

## 1. Current auth model (factual snapshot)

### 1.1 Password hashing

- Algorithm: **plain SHA-256(salt + password)**, single round, no work factor, no key-stretching. **C** `backend/Code.gs:568-573`.
  ```
  function hashPassword_(salt, password) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, String(salt) + String(password)
    );
    return base64UrlEncodeBytes_(bytes);
  }
  ```
- Salt: `Utilities.getUuid()` -- random RFC-4122 UUID v4 string (36 chars incl. hyphens). **C** `backend/Code.gs:564-566`.
- Storage: hash and salt are stored in two adjacent columns on the Employees tab -- `passwordHash` (col S) base64url, `passwordSalt` (col T) UUID string. **C** `docs/migration/01-schema-current.md:43-44`.
- Comparison: constant-time string equality on the base64url-encoded digest. **C** `backend/Code.gs:519-524, 636-639`.
- Verification path on login: `constantTimeEq_(hashPassword_(employee.passwordSalt, password), employee.passwordHash)`. **C** `backend/Code.gs:636-639`.
- Plaintext-fallback path was removed in S67 (2026-04-18 backfill); rows missing `passwordHash`/`passwordSalt` now fail login outright. **C** `backend/Code.gs:627-634`.
- Default password generation when admin (re)sets: `emp-XXX` zero-padded by Employees row, plaintext kept in column D for admin display, hash + salt written to S/T, `passwordChanged=FALSE`. **C** `docs/migration/03-appscript-inventory.md:289-296`. **L** `MEMORY.md` reference_default_passwords.

### 1.2 Token format

- Format: `base64url(JSON payload) + "." + base64url(HMAC-SHA-256(secret, payloadB64))`. **C** `backend/Code.gs:526-537`.
- This is **not** a standard JWT -- it has only two parts (no header), and the algorithm is implicit. **C** `backend/Code.gs:540-547`.
- Payload claims (one-letter keys to keep URL short):
  - `e` -- employee email (subject)
  - `exp` -- absolute ms-epoch expiry (`Date.now() + TOKEN_TTL_MS`)
  - `a` -- `isAdmin` boolean
  - `o` -- `isOwner` boolean
  - `t` -- `adminTier` string (`''` | `'admin1'` | `'admin2'`)
  - **C** `backend/Code.gs:526-533`.
- Signature scheme: HMAC-SHA-256, output base64url, no padding. **C** `backend/Code.gs:511-517`.
- TTL: 12 hours hard expiry, no sliding renewal, no refresh token. **C** `backend/Code.gs:488` (`TOKEN_TTL_MS = 12*60*60*1000`).
- Verify: signature recomputed with same secret, constant-time compared, `exp` checked against `Date.now()`. No `nbf`, no `iat`, no `jti`. **C** `backend/Code.gs:539-562`.

### 1.3 Secret storage

- Single key: `HMAC_SECRET` ScriptProperty on the Apps-Script-bound project, base64-encoded 32 random bytes. **C** `backend/Code.gs:490-496`.
- Hard-required at boot of any token op -- throws if absent. **C** `backend/Code.gs:492-494`.
- The Sheet is owned by `otr.scheduler@gmail.com`; the bound script and its ScriptProperties live there too -- **L** `MEMORY.md` reference_apps_script_topology.

### 1.4 Session model

- 12 hour hard expiry. No sliding window. No refresh token. **C** `backend/Code.gs:488, 558-560`.
- Client storage: `localStorage["otr-auth-token"]` (token) and `localStorage["otr-auth-user"]` (cached user envelope). **C** `src/auth.js:5-6, 22-24, 35-49`.
- Renewal path: none -- on `AUTH_EXPIRED` or `AUTH_INVALID` from any backend response, the client clears localStorage and triggers `_onAuthFailure` which kicks the user back to LoginScreen. **C** `src/auth.js:53-60`, `src/utils/api.js:58-61`.
- Token is the only credential -- there is no separate session row in any tab; the token itself is self-contained.

### 1.5 Admin tier model

Three flags exist on each Employees row, two of them orthogonal:

| Flag | Type | Source | Gates today |
|---|---|---|---|
| `isOwner` | boolean | Employees col J | Single owner (JR). Short-circuits permission checks; appears as cyan Shield icon. **C** `backend/Code.gs:444, 477, 2175`; `src/App.jsx:2165-2169` |
| `isAdmin` | boolean | Employees col I | Backend write authority. `verifyAuth(payload, true)` requires this OR `isOwner`. **C** `backend/Code.gs:477, 709, 1008, 2148`; `src/App.jsx:1539` |
| `adminTier` | enum `''`/`'admin1'`/`'admin2'` | Employees col W | View-only viewing tier overlay. **admin1** = `isAdmin=TRUE` real admin. **admin2** = `isAdmin=FALSE` view-only management seat. **C** `backend/Code.gs` lines 8-15 (file header), 530-532; `src/utils/employeeSort.js:13`; `src/utils/employeeRender.js:4`; `src/modals/EmployeeFormModal.jsx:178-201` |

Behavior gating today:

- **employee** (default): `isAdmin=FALSE`, `adminTier=''`. Sees own shifts, can request changes. Backend handlers gate via `request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)` -- meaning: **client trust** plus a server email-equality check on each mutating endpoint. **C** `backend/Code.gs:884, 1116, 1374`.
- **admin2** (`isAdmin=FALSE`, `adminTier='admin2'`): backend treats them as a regular employee for write paths (`verifyAuth(_, true)` rejects them); frontend renders them on the schedule grid with a distinct color and `title` column instead of a role. **C** `src/App.jsx:2651`; `docs/migration/01-schema-current.md:33`. **L** LESSONS.md:587-590 -- "two admin tiers exist by design, don't 'fix' them".
- **admin1** (`isAdmin=TRUE`, `adminTier='admin1'` or `''`): full write authority on all admin endpoints (`verifyAuth(_, true)` admits). **C** `backend/Code.gs:477`.
- **owner** (`isOwner=TRUE`): same as admin1, plus short-circuits in destructive flows (e.g. `rotateHmacSecret` UI path is owner-driven via the spreadsheet menu). **C** `backend/Code.gs:444, 580-603, 2175`.

### 1.6 Login flow

1. Frontend `LoginScreen.jsx` calls `apiCall('login', { email, password })`. **C** `docs/migration/03-appscript-inventory.md:276`.
2. Backend `login(payload)` looks up employee by email, rejects if missing or `!active`. **C** `backend/Code.gs:609-625`.
3. Hashes the supplied password with the row's stored salt; constant-time compares to stored hash. **C** `backend/Code.gs:636-643`.
4. Issues a fresh token (`createToken_`) and returns `{ employee (sans password fields), token, expiresAt, usingDefaultPassword, defaultPassword? }`. **C** `backend/Code.gs:645-670`.
5. Client stores token in `localStorage["otr-auth-token"]` (`setAuthToken`), caches the safe-employee envelope in `localStorage["otr-auth-user"]`. **C** `src/auth.js:19-49`.
6. Every subsequent `apiCall` auto-attaches `{ token }` to the payload; the backend's `verifyAuth` reads `payload.token` first, falls back to legacy `callerEmail` (S36/S37 transitional, still live). **C** `src/utils/api.js:8-13`; `backend/Code.gs:451-466`. **L** LESSONS.md:563-564.
7. The "Sheets stores numeric-looking passwords as numbers" trap -- comparison wraps both sides in `String()`. **C** `backend/Code.gs:630, 637-638`. **L** LESSONS.md:141-143.

---

## 2. Supabase Auth target model

### 2.1 Provider strategy

- Email + password is the primary method (no SSO, no social login required). **VD** https://supabase.com/docs/guides/auth/passwords
- Magic-link is available as a no-password fallback / first-login bootstrap if needed. **VD** https://supabase.com/docs/guides/auth/passwords
- Password reset uses the built-in `supabase.auth.resetPasswordForEmail()` -> recovery deep-link flow. **VD** https://supabase.com/docs/guides/auth/passwords

### 2.2 Schema shape

- `auth.users` is Supabase-managed. Custom fields (`isAdmin`, `isOwner`, `adminTier`, `defaultSection`, `title`, `employmentType`, `counterPointId`, `adpNumber`, `rateOfPay`, etc.) live in a `public.profiles` (or `public.employees`) table keyed by `auth.users.id` (UUID FK with `ON DELETE CASCADE`). **VD** https://supabase.com/docs/guides/database/postgres/row-level-security
- `auth.users.email` is the join key for email-based lookups during migration; post-migration use the UUID.
- `passwordHash` and `passwordSalt` columns disappear from the profiles table -- they live in `auth.users.encrypted_password`. **VD** https://github.com/supabase/auth/issues/1750

### 2.3 JWT shape

- Supabase issues a standard 3-part JWT (header.payload.signature). Default claims: `sub` (UUID), `email`, `aud`, `exp`, `iat`, `role`, `app_metadata`, `user_metadata`. **VD** https://supabase.com/docs/guides/auth/jwts
- `auth.uid()` (PostgREST helper) resolves to `sub` in any RLS policy. **VD** https://supabase.com/docs/guides/database/postgres/row-level-security
- `auth.jwt()` returns the full claim set as JSONB; access via `auth.jwt() -> 'app_metadata' ->> 'admin_tier'`. **VD** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

### 2.4 Custom claims options for `adminTier`/`isAdmin`/`isOwner`

Two paths, both documented:

- **Path A -- `app_metadata` claim:** writeable only via service-role API, readable by RLS via `auth.jwt() -> 'app_metadata' ->> 'admin_tier'`. Travels in the JWT, no DB round-trip on policy check. Cannot be modified by the user. **VD** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- **Path B -- `profiles.admin_tier` column:** RLS policies do `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND admin_tier = 'admin1')`. One join per check, but the source of truth is a single mutable row. **VD** https://github.com/orgs/supabase/discussions/13091
- A custom Auth Hook (`hook_custom_access_token`) can copy `profiles.admin_tier` into `app_metadata` at JWT-mint time -- gives both worlds. **VD** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac

### 2.5 Password import feasibility

- Supabase Auth's `encrypted_password` column accepts **bcrypt** and **Argon2** hashes (admin API `auth.admin.createUser({ password_hash })` or direct insert into `auth.users.encrypted_password`). **VD** https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0; https://github.com/orgs/supabase/discussions/36664
- Supabase Auth does **NOT** accept raw SHA-256 hashes, PBKDF2, scrypt (Firebase variant), or custom-format hashes via the import endpoint. **VD** https://github.com/supabase/auth/issues/1750 (Firebase scrypt explicitly fails); **VD** https://github.com/orgs/supabase/discussions/13130 (Argon2id was added 2024, no SHA-256 path).
- Current Rainbow hashes are `base64url(SHA-256(uuid_salt + password))` -- this format is **not importable** into Supabase Auth as-is.

---

## 3. Migration paths (factual options, no recommendation)

### Option A -- Bulk import passwordHash + salt directly

Status: **Not feasible without re-hashing.**

- Prerequisite: hash format must be one of bcrypt or Argon2. Current hashes are SHA-256 (single round, no work factor). **C** `backend/Code.gs:568-573`; **VD** https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0.
- Cost: zero engineering on the user side (transparent), but requires upstream re-hashing which is impossible without the plaintext.
- Failure mode: blocked entirely -- Supabase rejects the import or accepts but every login fails because gotrue cannot verify a SHA-256 hash with bcrypt verifier. **VD** https://github.com/supabase/auth/issues/1750 documents this exact failure for the analogous Firebase-scrypt -> Supabase-bcrypt case.

### Option B -- One-time first-login reset for all 35 staff

Status: feasible.

- Sub-option B1 -- magic-link: admin script seeds `auth.users` with email only (no password). Each user clicks `resetPasswordForEmail` link in an emailed welcome message; sets new password.
  - Prerequisite: SMTP configured in Supabase (built-in for Pro tier, or custom SMTP). **VD** https://supabase.com/docs/guides/auth/passwords.
  - User friction: every user must check email (incl. spam) and click within link's TTL (default 1h, configurable).
  - Failure mode: 35 staff have varied tech literacy (Carman family low-trust on automation per `MEMORY.md` project_carman_family_profile); admin handholding required.
- Sub-option B2 -- temporary password: admin script generates `emp-XXX` plaintext per staff (matching today's default-password pattern), creates user via `auth.admin.createUser({ password: 'emp-XXX' })` (Supabase hashes it), sets `app_metadata.password_changed = false`. First login shows the same first-login-modal flow already in the app.
  - Prerequisite: maintain the `usingDefaultPassword` UX in the React app post-migration; current flag mechanism keys on Employees row's `passwordChanged` field which moves to `profiles.password_changed` or `app_metadata.password_changed`. **C** `backend/Code.gs:649-658`.
  - User friction: identical to current first-login experience -- zero additional friction for staff.
  - Failure mode: temp passwords are predictable (`emp-XXX`); window between cutover and each user's first reset is a vulnerability surface.
- Eng hours, both sub-options: ~3-6 hours seed script + ~1-2 hours QA on dev project.

### Option C -- Dual-stack auth window

Status: feasible, costliest.

- Both auth backends live for N days. Frontend tries Supabase first; on failure or if user is flagged "legacy", falls back to current Apps-Script `login` endpoint. Profile sync runs nightly.
- Prerequisite: keep Apps Script web app `/exec` URL alive during the window; build a routing layer in `src/utils/api.js` that decides per-call which backend to hit; build a profile-sync script.
- Cost: ~15-25 eng hours (routing layer, profile sync, two-system observability) + ~2x QA surface during the window.
- Failure modes: split-brain on Employees table edits during window; HMAC token and Supabase JWT have different shapes so `verifyAuth` callers and `apiCall` headers diverge; rollback complexity if one side regresses.

---

## 4. RLS policy mapping

### 4.1 Current effective access (per tier)

| Tier | Tables read | Tables write | Row scope | Enforcement today |
|---|---|---|---|---|
| employee | Employees (filtered to active+!deleted; passwordHash/Salt stripped server-side), Shifts, Settings, Announcements, ShiftChanges | ShiftChanges (only own + own-as-recipient + own-as-partner) | Self only on mutating shift-change endpoints | Server: `request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)` short-circuit. **C** `backend/Code.gs:884, 1116, 1374`. Read-side filters happen in handlers (e.g. `getMyRequests`). Frontend trust is partial -- a malicious client could `apiCall` with another user's email but the server check rejects. |
| admin2 | Same as employee (no extra read) | Same as employee (no extra write) | Self only | Server: `verifyAuth(_, true)` rejects them since `isAdmin=FALSE`. View-only is enforced server-side; the differentiated UI is purely cosmetic. **C** `backend/Code.gs:477`. |
| admin1 | All tables, all rows including soft-deleted | Employees (full CRUD), Shifts (full), Settings, Announcements, ShiftChanges (any) | Global | Server: `verifyAuth(_, true)` passes; `isAdminUser(email)` true. **C** `backend/Code.gs:442-444, 477`. |
| owner | Same as admin1 plus rotateHmacSecret menu, plus short-circuits in `assertOwnerCanXxx` checks | Same as admin1 | Global | Server: `isOwner === true` short-circuit. **C** `backend/Code.gs:2175, 580-603`. |

Behavior currently enforced in handler logic (NOT in Sheets / data layer) that must move to RLS or Edge Functions:

- "Employees only see / mutate their own ShiftChanges" -- enforced in handlers `acceptShiftChange`, `proposeShiftChange`, `cancelShiftChange` etc. via the `request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)` pattern. **C** `backend/Code.gs:884, 1116, 1374`. Today this is server-side **but is per-handler, not per-row** -- the read endpoints (`getMyRequests`) filter by email server-side as well.
- "Password fields are stripped before return" -- happens in `login` and any handler returning Employee rows. **C** `backend/Code.gs:647`. Under Supabase, password fields are in `auth.users` (not in `profiles`), so the strip is structural rather than runtime.
- "Soft-deleted employees are filtered" -- handler-level filter. Under Supabase, an RLS policy `WHERE deleted = false` for non-admins replaces it.
- "12h token hard expiry" -- handler-level via `verifyToken_`. Under Supabase, controlled by `JWT_EXPIRY` project setting.

### 4.2 Supabase RLS pseudocode (translation, not finished SQL)

Helper function (one-time):
```sql
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  ) OR COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'is_owner')::boolean,
    false
  );
$$;
```
(Pattern from **VD** https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac.)

Policies (count: 14 across 5 tables):

1. `profiles` SELECT -- everyone reads own row + admins read all.
2. `profiles` UPDATE -- admins only.
3. `profiles` INSERT/DELETE -- admins only (soft-delete via `deleted=true` UPDATE).
4. `shifts` SELECT -- all authenticated (schedule is shared visibility).
5. `shifts` INSERT/UPDATE/DELETE -- admins only.
6. `settings` SELECT -- all authenticated.
7. `settings` INSERT/UPDATE/DELETE -- admins only.
8. `announcements` SELECT -- all authenticated.
9. `announcements` INSERT/UPDATE/DELETE -- admins only.
10. `shift_changes` SELECT -- self (employee_email = JWT email) OR self-as-recipient OR self-as-partner OR admin.
11. `shift_changes` INSERT -- self only (employee_email must equal JWT email) OR admin (any).
12. `shift_changes` UPDATE -- self if status transitions are allowed for self; admin always.
13. `shift_changes` DELETE -- admin only.
14. `auth.users` is Supabase-managed; no custom RLS needed beyond defaults.

Where admin2 fits: admin2 has `is_admin = false` in app_metadata, so RLS treats them identically to a regular employee. The "view-only management" affordance lives entirely in the React UI -- no RLS surface needed.

---

## 5. Session and token rotation

### 5.1 Current `rotateHmacSecret()` flow

- Owner-only spreadsheet menu action. **C** `backend/Code.gs:580-603`.
- Generates 3 UUIDs, SHA-256s the concatenation, base64-encodes, stores as new `HMAC_SECRET` ScriptProperty.
- Net effect: every signed-in user's token becomes invalid on their next request. Frontend gets `AUTH_INVALID` -> `clearAuth()` -> LoginScreen. **C** `src/auth.js:53-60`.
- Cost to user: one re-login per active session.

### 5.2 Supabase equivalent

Two analogous primitives, both documented:

- **Per-user revoke:** `supabase.auth.admin.signOut(jwt)` revokes that user's refresh token, forcing them to log in again at access-token expiry (configurable; default 1h). **VD** https://supabase.com/docs/reference/javascript/auth-refreshsession; https://supabase.com/docs/guides/auth/sessions
- **Global key rotation:** Project Settings -> JWT Signing Keys -> Rotate Keys -> wait >= access-token-expiry -> Revoke previous key. After revocation, every JWT signed with the old key is rejected. **VD** https://supabase.com/docs/guides/auth/signing-keys
  - Caveat: Supabase recommends waiting at least 1h 15min between rotation and revocation if access tokens last 1h, to avoid mid-request invalidation. The current Apps Script flow has no such grace period -- everyone bounces immediately.
  - Asymmetric signing keys (the rotation feature) require enabling JWT Signing Keys in the project. **VD** https://supabase.com/features/jwt-signing-keys (vendor marketing; **VM**).

---

## 6. Cutover risks

| Risk | Impact | Mitigation surface |
|---|---|---|
| 35-staff lost-session window | Every active user gets logged out once. Same as a `rotateHmacSecret` event today. | Communicate timing; do cutover off-peak. |
| Token format change in `apiCall` | Today payload carries `{ token: "<b64>.<sig>" }`. Supabase JWT travels in `Authorization: Bearer <jwt>` header instead of payload body. `apiCall` rewrite required. **C** `src/utils/api.js:12-13, 28`. | One-time refactor of `apiCall`; remove `authedPayload = { ...payload, token }` in favor of `headers: { Authorization: 'Bearer ' + session.access_token }`. |
| Backend handlers expecting `payload.token` | Currently `verifyAuth(payload)` reads `payload.token` first then `payload.callerEmail`. Under Supabase, JWT is verified by Postgres / PostgREST automatically; the handler-level token check disappears. **C** `backend/Code.gs:451-466`. **L** LESSONS.md:324-325 (sweep all readers). | Every Apps Script handler that runs `verifyAuth` becomes a Supabase RLS check + maybe Edge Function. Per `03-appscript-inventory.md`, 8 functions are `auth-replaced-by-supabase-auth`; the other ~80 endpoints lose their `verifyAuth` call but inherit RLS. |
| 12 missing-revert apiCall sites | `04-apicall-callsite-map.md` flags multiple sites with optimistic UI updates that never revert. Supabase responses have a different error envelope (`{ error: { message } }`) than current `{ success: false, error: { code, message } }`. **C** `docs/migration/04-apicall-callsite-map.md:131, 154, 184, 211, 279, 877, 910-911`. | `apiCall` wrapper must normalize Supabase errors to the existing `{ success, error: { code, message } }` shape, or every error-consuming site must be touched. |
| `passwordHash` field must NOT be in any post-cutover GET response | Today it's stripped at handler boundary. Under Supabase, it lives in `auth.users.encrypted_password` which is never returned by PostgREST queries against `public.profiles`. Structural protection. | None needed if `profiles` table is built correctly -- but a regression could expose it if someone accidentally selects from `auth.users`. |
| Sheets-stores-numeric-passwords trap | LESSONS.md:141-143 -- column D plaintext can become a number. During the migration script that reads Sheet -> writes Supabase Auth, the Apps-Script reader path returns a number type for `'001'`. **L** LESSONS.md:141-143. | Migration script must `String(row.password)` before passing to `auth.admin.createUser({ password })` (Option B2). |
| `usingDefaultPassword` flag continuity | Frontend's first-login modal keys on `usingDefaultPassword` from login response. **C** `backend/Code.gs:660-669`. | Move flag to `app_metadata.password_changed = false` and have a frontend `useSession()` consumer derive `usingDefaultPassword` from the JWT. |
| `adminTier='admin2'` view-only seat | 5 people use this seat (Amy, Dan, Scott + 2). Today it's enforced by `verifyAuth` rejecting writes (since `isAdmin=FALSE`) and tolerated by frontend rendering. Under RLS, same flag check applies. | Confirm `app_metadata.admin_tier='admin2'` flows into JWT and that no frontend hides admin-write affordances based on `app_metadata.is_admin` alone. |
| 12h hard expiry vs Supabase default | Supabase default access-token TTL is 1h with 1-week refresh; current model has no refresh -- 12h then forced re-login. | Configure `JWT_EXPIRY=43200` (12h) OR adopt Supabase's refresh-token model (lower friction). Either works; behavior change is observable. |
| HMAC_SECRET ScriptProperty does not survive Sheet copy | LESSONS.md:178 -- copying the bound script doesn't carry properties. Not a Supabase-cutover risk per se, but the rollback plan that involves "fall back to legacy Apps Script" depends on the HMAC_SECRET still being set on the legacy project. **L** LESSONS.md:178. | Document the legacy `HMAC_SECRET` value privately before cutover so rollback is one ScriptProperty restore away. |

---

## 7. Flag-out (items the main session should double-check)

1. **Hash format finality.** This doc states current hashes are non-importable. If anyone has implemented a Supabase `pgcrypto` SHA-256 verifier extension or a pre-flight middleware that re-hashes on first login, that path could keep existing passwords alive. None found in this codebase, but worth confirming Supabase has not added this since 2024.
2. **JWT TTL choice is not specified by the spec.** Picking 1h-with-refresh vs 12h-hard-expiry is a UX call the parent session should make explicitly -- both are equally feasible and the cutover risk language in section 6 covers both.
3. **`app_metadata` vs `profiles.admin_tier` split for RLS.** Section 2.4 lists both paths. The decision between them affects how many Edge Functions vs raw RLS the migration needs. Not making the call here.
4. **Edge Function vs RLS for ShiftChanges.** The cross-employee fields (recipientEmail, partnerEmail) plus status-transition rules in `acceptShiftChange`/`proposeShiftChange` are richer than a single RLS expression. `03-appscript-inventory.md` flags some of these as "edge-function" candidates; the policy count of 14 in section 4.2 assumes simple per-row RLS, which may understate the work if status transitions need to live in stored procedures.
5. **Default-password UX continuity.** `emp-XXX` plaintext is currently kept in Employees column D for admin display. Under Supabase, the plaintext cannot be read back from `auth.users` (encrypted_password is one-way). If admins still need to see the temp password, a separate `admin_default_passwords` table or in-memory display at reset time is required. Spec did not address this; flagging.
6. **Magic link domain restrictions.** OTR's email domain practices weren't audited here. If staff use personal Gmail/Yahoo and Supabase's default SMTP gets flagged as spam, magic links and password resets break. Consider custom SMTP needed for production.
7. **Missing `adminTier` to `app_metadata` sync.** Today `adminTier` is changed by editing the Employees row. After migration, changes must propagate to `auth.users.raw_app_meta_data` -- requires either a Postgres trigger from `profiles` to `auth.users` or all admin edits going through `supabase.auth.admin.updateUserById`. Not in spec.
8. **The 8 `auth-replaced-by-supabase-auth` functions in `03-appscript-inventory.md`** -- spec said "the 8" but inventory section header (line 267) says 8 while only 6 are detailed in the snippets viewed (`login`, `changePassword`, `resetPasswordToDefault`, `createToken_`, `verifyToken_`, `hashPassword_`). The full list should include `getHmacSecret_` and `rotateHmacSecret` based on Code.gs structure -- worth confirming the inventory's count matches its enumerated list.
9. **`callerEmail` legacy back-compat is still live in `verifyAuth`.** If migration removes `verifyAuth` entirely (replaced by RLS), any frontend site still passing `callerEmail` instead of relying on auto-attached token is silently fine today but may break against Supabase. `04-apicall-callsite-map.md` should be cross-checked for surviving `callerEmail` callsites before cutover.

---

Sources cited:
- Codebase: `backend/Code.gs`, `src/auth.js`, `src/utils/api.js`, `src/App.jsx`, `src/utils/employeeSort.js`, `src/utils/employeeRender.js`, `src/utils/apiTransforms.js`, `src/modals/EmployeeFormModal.jsx`.
- Project docs: `docs/migration/01-schema-current.md`, `docs/migration/03-appscript-inventory.md`, `docs/migration/04-apicall-callsite-map.md`, `CONTEXT/LESSONS.md`, `~/.claude/projects/.../memory/MEMORY.md`.
- Supabase docs (VD): https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/auth/jwts ; https://supabase.com/docs/guides/auth/signing-keys ; https://supabase.com/docs/guides/auth/sessions ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac ; https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 ; https://supabase.com/docs/reference/javascript/admin-api ; https://supabase.com/docs/reference/javascript/auth-refreshsession.
- Supabase GitHub (VD): https://github.com/supabase/auth/issues/1750 ; https://github.com/orgs/supabase/discussions/36664 ; https://github.com/orgs/supabase/discussions/13130 ; https://github.com/orgs/supabase/discussions/13091.
- Supabase marketing (VM, flagged): https://supabase.com/features/jwt-signing-keys.
