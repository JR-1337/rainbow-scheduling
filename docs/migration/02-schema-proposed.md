# 02 -- Proposed Postgres Schema (Supabase)

Last refreshed: 2026-04-29

Source-class legend: **C** codebase (path:line), **VD** vendor docs (URL), **S** synthesis on cited prior facts, **L** LESSONS / DECISIONS.

This doc proposes the Postgres + Supabase Auth schema that replaces the current 5-tab Google Sheet. It is built on `01-schema-current.md` (column inventory), `03-appscript-inventory.md` (backend functions), `04-apicall-callsite-map.md` (frontend callsites), and `05-auth-migration.md` (auth model).

**This is research. No DDL is being executed.** Naming, types, and indexes here are proposals. Open questions are flagged at the bottom.

---

## 0. Naming + style conventions

- Tables: `snake_case`, plural (`employees`, `shifts`).
- Columns: `snake_case`. Camel-cased Sheet headers (`employeeId`, `passwordChanged`) translate to `employee_id`, `password_changed`. Frontend serialization layer maps between.
- All tables include `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` plus a Supabase trigger that bumps `updated_at` on UPDATE. Sheet had no such columns; they are added unconditionally for audit + Realtime ordering.
- Surrogate UUID primary keys (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`) on every domain table; the existing string IDs (`emp-001`, `shift-emp-001-2026-02-10`, `TOR-abc12345`) move to a `legacy_id TEXT UNIQUE` column for backwards-compat during dual-write + cutover, then can be dropped post-cutover. **S** ref 01:25, 01:86, 01:210.
- All boolean Sheet columns ('TRUE'/'FALSE' strings) become Postgres `BOOLEAN`. Migration value-transform: `lower(value) = 'true'`. **S** ref 01:296-300.
- Email columns use `CITEXT` (case-insensitive text) extension to mirror the `.toLowerCase()` comparison the codebase relies on. **S** ref 01:355-358.

---

## 1. Auth surface: Supabase Auth + `profiles` mirror

Per `05-auth-migration.md`, password hashes (single-round SHA-256) are not importable into Supabase Auth (bcrypt/Argon2 only). Existing 35 staff hit a one-time first-login reset.

### 1.1 `auth.users` (managed by Supabase)

Owned by Supabase. Holds `id UUID`, `email`, `encrypted_password` (bcrypt), `email_confirmed_at`, `last_sign_in_at`, plus `raw_app_meta_data JSONB` and `raw_user_meta_data JSONB`. We do not write directly to this table.

`raw_app_meta_data` carries claims that go into the JWT: `{ "is_owner": true, "admin_tier": "admin1", "employee_id": "emp-001" }`. RLS reads them via `auth.jwt() -> 'app_metadata'`. **VD** https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook.

### 1.2 `public.profiles`

One row per `auth.users` row. Holds non-auth employee fields. The 1:1 link is `profiles.id = auth.users.id` (FK with ON DELETE RESTRICT -- soft-delete only, no cascade).

| Column | Type | Nullable | Source mapping |
|---|---|---|---|
| `id` | UUID PK | NO | = `auth.users.id` |
| `legacy_id` | TEXT UNIQUE | NO | Sheet `id` col A (`emp-001`) |
| `name` | TEXT | NO | Sheet `name` col B |
| `email` | CITEXT UNIQUE | NO | Sheet `email` col C; mirrors `auth.users.email` (kept denormalized for joins; trigger keeps in sync) |
| `phone` | TEXT | YES | Sheet `phone` col E |
| `address` | TEXT | YES | Sheet `address` col F |
| `dob` | DATE | YES | Sheet `dob` col G |
| `active` | BOOLEAN | NO DEFAULT TRUE | Sheet `active` col H |
| `is_admin` | BOOLEAN | NO DEFAULT FALSE | Sheet `isAdmin` col I; mirrored to `auth.users.app_metadata` for JWT |
| `is_owner` | BOOLEAN | NO DEFAULT FALSE | Sheet `isOwner` col J; mirrored to JWT |
| `show_on_schedule` | BOOLEAN | NO DEFAULT TRUE | Sheet `showOnSchedule` col K |
| `deleted` | BOOLEAN | NO DEFAULT FALSE | Sheet `deleted` col L (soft-delete preserved) |
| `availability` | JSONB | NO DEFAULT `'{}'` | Sheet `availability` col M (currently JSON-string-on-Sheets) |
| `default_shift` | JSONB | YES | Sheet `defaultShift` col N |
| `counter_point_id` | TEXT | YES | Sheet `counterPointId` col O |
| `adp_number` | TEXT | YES | Sheet `adpNumber` col P |
| `rate_of_pay` | NUMERIC(8,2) | YES | Sheet `rateOfPay` col Q (was string-or-number in Sheets) |
| `employment_type` | TEXT | YES | Sheet `employmentType` col R; soft enum check: IN ('full-time','part-time','') |
| `default_section` | TEXT | NO DEFAULT 'none' | Sheet `defaultSection` col V; soft enum from `src/constants.js` ROLES |
| `admin_tier` | TEXT | NO DEFAULT '' | Sheet `adminTier` col W; check IN ('','admin1','admin2'); mirrored to JWT |
| `title` | TEXT | YES | Sheet `title` col X |

**Removed columns:** `password` (col D), `passwordHash` (col S), `passwordSalt` (col T), `passwordChanged` (col U). Auth state moves entirely into `auth.users`. The "default password / has-changed" UX becomes a Supabase Auth `password_reset_required` flag on the user (settable via the admin API), or an opaque `app_metadata.default_password = true` claim that the frontend reads to show the "you're on a default password" banner. **S** ref 05 §1.1.

**Indexes:**
- PK on `id`.
- UNIQUE on `email` (CITEXT covers case).
- UNIQUE on `legacy_id`.
- Partial index `WHERE deleted = FALSE AND active = TRUE` on `(name)` -- the schedule grid filters to non-deleted active employees on every render.
- B-tree on `admin_tier` for the `WHERE admin_tier = 'admin2'` admin grid query.

### 1.3 `app_metadata` sync trigger

A `BEFORE UPDATE` trigger on `profiles` mirrors `is_admin`, `is_owner`, `admin_tier`, `legacy_id` into `auth.users.raw_app_meta_data` so JWTs reissued at next refresh carry the latest claims without a manual SQL re-issue. **VD** https://supabase.com/docs/guides/auth/managing-user-data.

---

## 2. `shifts`

| Column | Type | Nullable | Source mapping |
|---|---|---|---|
| `id` | UUID PK | NO | new |
| `legacy_id` | TEXT UNIQUE | YES | Sheet `id` col A (synthetic `shift-{empId}-{date}` or `MTG-...`); nullable because legacy rows may lack it |
| `employee_id` | UUID NOT NULL | NO | FK -> `profiles.id` ON DELETE RESTRICT |
| `employee_name_snapshot` | TEXT | NO | Sheet `employeeName` col C -- denormalized at insert; never updated. **S** ref 01:332-335 |
| `employee_email_snapshot` | CITEXT | NO | Sheet `employeeEmail` col D -- same |
| `date` | DATE | NO | Sheet `date` col E |
| `start_time` | TIME | NO | Sheet `startTime` col F (`HH:mm` -> TIME) |
| `end_time` | TIME | NO | Sheet `endTime` col G |
| `role` | TEXT | NO DEFAULT 'none' | Sheet `role` col H; soft enum from constants.js ROLES |
| `task` | TEXT | YES | Sheet `task` col I |
| `type` | TEXT | NO DEFAULT 'work' | Sheet `type` col J; check IN ('work','meeting','pk','sick'); migration backfills NULL/'' -> 'work' |
| `note` | TEXT | NO DEFAULT '' | Sheet `note` col K |

**Constraints:**
- PK on `id`.
- `UNIQUE (employee_id, date, type) WHERE type IN ('work','pk','sick')` -- partial unique index, mirrors the Sheet uniqueness key for singular-per-day types. Meetings are exempt (N per day allowed). **S** ref 01:121-126.
- FK `employee_id -> profiles.id` ON DELETE RESTRICT (employees soft-delete; never hard-deleted).

**Indexes:**
- B-tree on `(date, employee_id)` -- primary access pattern is "all shifts in week W" and "all shifts for employee E in date range".
- B-tree on `(employee_id, date)` -- inverse access pattern.
- Partial index on `(date) WHERE type = 'meeting'` -- meeting overlay rendering.

**Note on PK choice:** Sheet has no real PK; the synthetic `legacy_id` is reconstructable but not authoritative. UUID PK + the partial unique index gives us ON CONFLICT clarity for `batch_save_shifts` and a stable row id for Realtime subscriptions. **S** ref 01:337-343.

**Sick-day note:** `01-schema-current.md:126` says sick day entries are "stored in Settings tab as a computed flag, or inferred from events[key] filter" -- that wording is ambiguous. The frontend treats `type = 'sick'` as a regular Shifts row (per `src/utils/scheduleOps.js`), and the backend writes it as such. Proposed schema standardizes on `type = 'sick'` rows in `shifts`. **Open question 1.**

---

## 3. `store_config` (replaces typed Settings keys)

The current Settings tab is a 2-column key-value store with a known set of keys. The proposal splits it: typed singleton fields go into a 1-row `store_config` table; truly dynamic keys stay in a small `settings_kv` table for forward-compatibility.

### 3.1 `store_config` (singleton row)

| Column | Type | Source mapping |
|---|---|---|
| `id` | INT PK CHECK (id = 1) | enforces single row |
| `store_name` | TEXT NOT NULL | Settings key `storeName` |
| `store_email` | CITEXT | Settings key `storeEmail` |
| `store_address` | TEXT | Settings key `storeAddress` |
| `store_phone` | TEXT | Settings key `storePhone` |
| `live_periods` | DATE[] NOT NULL DEFAULT '{}' | Settings key `livePeriods` (CSV string -> DATE[]) |
| `staffing_targets` | JSONB NOT NULL DEFAULT '{}' | Settings key `staffingTargets` |
| `store_hours_overrides` | JSONB NOT NULL DEFAULT '{}' | Settings key `storeHoursOverrides` |
| `staffing_target_overrides` | JSONB NOT NULL DEFAULT '{}' | Settings key `staffingTargetOverrides` |

**Migration value-transforms:**
- `livePeriods` CSV string -> `DATE[]` via `string_to_array(value, ',')::DATE[]`. **S** ref 01:148.
- The other three keys are already JSON strings on Sheets -> JSONB via `value::jsonb`. **S** ref 01:149-151.

**Removed key:** `adminPassword` (Sheet Settings key). It's hardcoded `1337`, never used by the app. Dropped, not migrated. **S** ref 01:143.

### 3.2 No generic KV table

Decision (Q2 resolved 2026-04-29): typed `store_config` only. Any new setting requires a schema migration. Strict typing wins; a forward-compat KV hedge is not needed at OTR scale.

---

## 4. `announcements`

| Column | Type | Nullable | Source mapping |
|---|---|---|---|
| `id` | UUID PK | NO | new |
| `legacy_id` | TEXT UNIQUE | YES | Sheet `id` col A (`ANN-...`) |
| `period_start_date` | DATE UNIQUE | NO | Sheet `periodStartDate` col B (uniqueness mirrored from Sheet) |
| `subject` | TEXT | YES | Sheet `subject` col C |
| `message` | TEXT | YES | Sheet `message` col D |
| `updated_at` | TIMESTAMPTZ | NO DEFAULT now() | Sheet `updatedAt` col E |

**Indexes:** UNIQUE on `period_start_date` doubles as the lookup index. **S** ref 01:181, 01:198.

---

## 5. `shift_changes` -- table-per-request-type split

The current `ShiftChanges` tab is 35 columns sparsely populated by `requestType`. Cols K-L only used for time_off, M-V only for offers, W-AI only for swaps. Cols A-J shared.

**Proposal: split into three tables sharing a parent.** Tradeoff discussion below.

### 5.1 `shift_change_requests` (parent / common columns)

| Column | Type | Source mapping |
|---|---|---|
| `id` | UUID PK | new |
| `legacy_id` | TEXT UNIQUE | Sheet `requestId` (`TOR-`/`OFFER-`/`SWAP-` prefix) |
| `request_type` | TEXT NOT NULL | check IN ('time_off','shift_offer','shift_swap') |
| `employee_id` | UUID NOT NULL | FK -> profiles.id ON DELETE RESTRICT |
| `employee_name_snapshot` | TEXT NOT NULL | Sheet col C |
| `employee_email_snapshot` | CITEXT NOT NULL | Sheet col D |
| `status` | TEXT NOT NULL | check against the 14-value enum from 01:214; enum DDL below |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT now() | Sheet `createdTimestamp` col F |
| `decided_at` | TIMESTAMPTZ | Sheet `decidedTimestamp` col G |
| `decided_by_email` | CITEXT | Sheet `decidedBy` col H |
| `revoked_at` | TIMESTAMPTZ | Sheet `revokedTimestamp` col I |
| `revoked_by_email` | CITEXT | Sheet `revokedBy` col J |
| `admin_note` | TEXT | unified field; merges Sheet `adminNote` (col U for offers) and `swapAdminNote` (col AI for swaps); for time-off it stays NULL |

### 5.2 `time_off_requests` (one-to-one with parent where request_type='time_off')

| Column | Type | Source mapping |
|---|---|---|
| `id` | UUID PK | = `shift_change_requests.id` (1:1 FK) |
| `dates_requested` | DATE[] NOT NULL | Sheet `datesRequested` col K (CSV -> DATE[]) |
| `reason` | TEXT | Sheet `reason` col L |

### 5.3 `shift_offers`

| Column | Type | Source mapping |
|---|---|---|
| `id` | UUID PK | = parent.id |
| `recipient_id` | UUID NOT NULL | FK -> profiles.id; populated at insert via email-snapshot lookup (Q4 resolved 2026-04-29) |
| `recipient_name_snapshot` | TEXT NOT NULL | Sheet col M |
| `recipient_email_snapshot` | CITEXT NOT NULL | Sheet col N |
| `shift_date` | DATE NOT NULL | Sheet col O |
| `shift_start` | TIME NOT NULL | Sheet col P |
| `shift_end` | TIME NOT NULL | Sheet col Q |
| `shift_role` | TEXT NOT NULL | Sheet col R |
| `recipient_note` | TEXT | Sheet col S |
| `recipient_responded_at` | TIMESTAMPTZ | Sheet col T |
| `cancelled_at` | TIMESTAMPTZ | Sheet col V |

(`adminNote` -> parent.admin_note.)

### 5.4 `shift_swaps`

| Column | Type | Source mapping |
|---|---|---|
| `id` | UUID PK | = parent.id |
| `partner_id` | UUID NOT NULL | FK -> profiles.id; populated at insert via email-snapshot lookup (Q4 resolved 2026-04-29) |
| `partner_name_snapshot` | TEXT NOT NULL | Sheet col W |
| `partner_email_snapshot` | CITEXT NOT NULL | Sheet col X |
| `initiator_shift_date` | DATE NOT NULL | Sheet col Y |
| `initiator_shift_start` | TIME NOT NULL | Sheet col Z |
| `initiator_shift_end` | TIME NOT NULL | Sheet col AA |
| `initiator_shift_role` | TEXT NOT NULL | Sheet col AB |
| `partner_shift_date` | DATE NOT NULL | Sheet col AC |
| `partner_shift_start` | TIME NOT NULL | Sheet col AD |
| `partner_shift_end` | TIME NOT NULL | Sheet col AE |
| `partner_shift_role` | TEXT NOT NULL | Sheet col AF |
| `partner_note` | TEXT | Sheet col AG |
| `partner_responded_at` | TIMESTAMPTZ | Sheet col AH |

(`swapAdminNote` -> parent.admin_note.)

### 5.5 Tradeoff: split-three vs single-wide-table

**Pros of split:**
- NOT NULL constraints on type-specific columns (e.g. `dates_requested` on time-off rows) catch bugs at insert time. Single-wide table can't enforce this without per-type CHECK constraints, which get unwieldy.
- Smaller row sizes; index bloat lower on hot queries (admin pending-list).
- Adding a new request type (e.g. `availability_change`) doesn't widen the parent.

**Cons of split:**
- Every read for "all pending requests for this employee" requires a JOIN or 3 UNIONs. Today's frontend reads all 35 cols in one shot via `getAllData()` and filters client-side; the split forces backend to assemble.
- Two phases of insert (parent + child) need a transaction. Supabase + PostgREST handles this cleanly via RPC functions, but it's one more place to wire up.

**Decision (Q3 resolved 2026-04-29): split.** Parent `shift_change_requests` + child `time_off_requests` / `shift_offers` / `shift_swaps`. NOT NULL constraints on type-specific columns earn their keep; JOIN cost is irrelevant at 35 staff.

### 5.6 Status enum DDL

```sql
CREATE TYPE shift_change_status AS ENUM (
  'pending', 'approved', 'denied', 'cancelled', 'revoked',
  'accepted', 'declined', 'rejected',
  'awaiting_recipient', 'awaiting_admin', 'awaiting_partner',
  'partner_rejected', 'recipient_rejected', 'expired'
);
```

Used by `shift_change_requests.status`. **S** ref 01:214.

---

## 6. JSONB shape contracts (for app-side validation)

Postgres can't enforce nested-object shape on JSONB; the frontend already JSON.parses these and trusts the shape. We keep that contract but document it here for migration:

### 6.1 `profiles.availability`

```json
{
  "sunday":    { "available": true, "start": "06:00", "end": "22:00" },
  "monday":    { "available": false, "start": "00:00", "end": "00:00" },
  "tuesday":   { "available": true, "start": "10:00", "end": "18:00" },
  "wednesday": { "available": true, "start": "10:00", "end": "18:00" },
  "thursday":  { "available": true, "start": "10:00", "end": "18:00" },
  "friday":    { "available": true, "start": "10:00", "end": "20:00" },
  "saturday":  { "available": true, "start": "10:00", "end": "20:00" }
}
```

**S** ref 01:37. Day keys lowercase; times `HH:mm`. Migration value-transform: `availability::jsonb` from the Sheet's JSON-string column.

### 6.2 `profiles.default_shift`

```json
{
  "monday": { "start": "12:00", "end": "18:00" },
  "tuesday": { "start": "10:30", "end": "19:00" }
}
```

**S** ref 01:38. Sparse: missing day key means "fall back to availability". Don't backfill missing days.

### 6.3 `store_config.staffing_targets`

```json
{ "sunday": 15, "monday": 8, "tuesday": 8, "wednesday": 8, "thursday": 8, "friday": 10, "saturday": 15 }
```

**S** ref 01:149.

### 6.4 `store_config.store_hours_overrides`

```json
{ "2026-02-14": { "open": "10:00", "close": "21:00" } }
```

**S** ref 01:150. Keys are ISO date strings.

### 6.5 `store_config.staffing_target_overrides`

```json
{ "2026-02-14": 12 }
```

**S** ref 01:151.

---

## 7. Migration value-transforms summary

For the migration script (Apps Script -> Postgres dual-write or one-shot ETL):

| Source | Source format | Target | Transform |
|---|---|---|---|
| Sheet boolean cols | `'TRUE'` / `'FALSE'` strings | BOOLEAN | `lower(value) = 'true'` |
| Sheet date cols | Date object -> `'yyyy-MM-dd'` string (post `parseSheetValues_`) | DATE | `value::DATE` |
| Sheet time cols | 1899-epoch Date -> `'HH:mm'` string (post `parseSheetValues_`) | TIME | `value::TIME` |
| Sheet timestamp cols | ISO 8601 string with ms | TIMESTAMPTZ | `value::TIMESTAMPTZ` |
| Sheet JSON-string cols | `'{...}'` text | JSONB | `value::JSONB` |
| `livePeriods` CSV | `'2026-01-26,2026-02-09'` | DATE[] | `string_to_array(value, ',')::DATE[]` |
| `datesRequested` CSV | `'2026-02-09,2026-02-10'` | DATE[] | same |
| Empty string | `''` | NULL (selectively) | `NULLIF(value, '')` for nullable cols; keep `''` only where code relies on falsy-string |
| Sheet `password` col D | TEXT (or numeric coerced) | dropped | not migrated; auth moves to Supabase Auth |
| Sheet `passwordHash`/`passwordSalt`/`passwordChanged` | TEXT | dropped | not migrated; one-time first-login reset |
| Sheet `adminPassword` (Settings) | hardcoded `1337` | dropped | unused |
| Shifts col J `type` empty/missing | `''` or absent | TEXT 'work' | `COALESCE(NULLIF(value, ''), 'work')` |
| Shifts col K `note` empty/missing | `''` or absent | TEXT '' | `COALESCE(value, '')` |
| Email cols | TEXT | CITEXT | `value::CITEXT` |

---

## 8. Indexes catalog (consolidated)

| Table | Index | Reason |
|---|---|---|
| profiles | PK(id) | -- |
| profiles | UNIQUE(email) | login + dup-check |
| profiles | UNIQUE(legacy_id) | dual-write cutover |
| profiles | btree(admin_tier) WHERE admin_tier='admin2' | grid title-row query |
| profiles | btree(name) WHERE deleted=FALSE AND active=TRUE | grid main query |
| shifts | PK(id) | -- |
| shifts | UNIQUE(employee_id, date, type) WHERE type IN ('work','pk','sick') | uniqueness key parity |
| shifts | btree(date, employee_id) | week-window read |
| shifts | btree(employee_id, date) | per-employee read |
| shifts | btree(date) WHERE type='meeting' | meeting overlay |
| store_config | PK(id) singleton | -- |
| announcements | PK(id) + UNIQUE(period_start_date) | one-per-period lookup |
| shift_change_requests | PK(id) | -- |
| shift_change_requests | btree(employee_id, status) | "my pending requests" |
| shift_change_requests | btree(status, created_at) WHERE status IN ('pending','awaiting_admin','awaiting_recipient','awaiting_partner') | admin pending-list |
| shift_change_requests | UNIQUE(legacy_id) | dual-write cutover |
| time_off_requests | PK(id) FK to parent | -- |
| shift_offers | PK(id) FK to parent + btree(recipient_id) WHERE status='awaiting_recipient' | "my incoming offers" |
| shift_swaps | PK(id) FK to parent + btree(partner_id) WHERE status='awaiting_partner' | "my incoming swaps" |

---

## 9. RLS sketch (deferred to 09-cutover)

RLS policies are inventoried in `05-auth-migration.md` §3 (14 policies across 5 tables). They hang off these tables but are not designed in this doc -- the cutover doc 09 will codify which policies ship at cutover vs which are added Phase 2 (e.g. self-write on `profiles.availability` only). **S** ref 05.

---

## 10. Sheet mirror impact (preview for doc 08)

The mirror (one-way DB -> Sheet) needs to flatten the split request tables back into the 35-column ShiftChanges shape so Sarvi sees the same view. Doc 08 will spec the denormalize logic. The split here doesn't block the mirror; it just shifts the join from the frontend to the sync function.

The other 4 tabs map 1:1 to their Postgres tables, with `profiles` -> Employees losing the auth columns (D, S, T, U) -- those four cells in the mirror just stay blank or get dropped. **S** ref 01:23-48.

---

## 11. Resolved decisions (2026-04-29)

All 8 open questions resolved by JR. Locked into the schema above.

| # | Topic | Decision | Effect |
|---|---|---|---|
| 1 | Sick-day storage | Row in `shifts` with `type='sick'` | Uniform shifts model; one render path; one Realtime subscription. Verify against `src/utils/scheduleOps.js` at DDL time. |
| 2 | Forward-compat KV | Dropped. `store_config` only. | New settings require a schema migration. Strict typing; no KV escape hatch. |
| 3 | ShiftChanges shape | 4-table split (parent + 3 children) | NOT NULL on type-specific cols enforced at insert; admin pending-list reads via JOIN or RPC. |
| 4 | Recipient/partner FKs | NOT NULL FK populated at insert via email-snapshot lookup | Enables fast "incoming offers/swaps for employee E" queries; unlocks parked in-app notification feature without Phase 2 schema change. Failure mode: insert-time email lookup must succeed; if not, request submission fails (vs today's silent snapshot). |
| 5 | `legacy_id` retention | Keep forever | ~24 bytes/row cost is free; durable audit link to Sheet era. |
| 6 | Default-password UX | Supabase `password_reset_required` flag (Path A) | Native Supabase; least code. **UX shift:** default password becomes a hard gate at login (must reset before proceeding), not a soft warning banner. Removes the current `passwordChanged` column entirely. |
| 7 | `employmentType` shape | Soft TEXT with CHECK constraint | Adding values is a one-line constraint swap; no `ALTER TYPE` footguns. |
| 8 | Realtime publications | `shifts` + `shift_change_requests` (parent only) + `announcements`. Skip `profiles` and `store_config`. | Live grid + live request notifications + live announcement updates. `profiles` and `store_config` change rarely; clients refresh on next render. Phase 2 can add targeted publications. |

**Implementation note for Q6:** `auth.users.password_reset_required` is set TRUE on initial admin-create (and on admin-reset). User cannot complete login flow without resetting. The frontend's "you're on default password" banner code can be removed; Supabase's hosted flow takes over. Default-password display in admin UI (e.g. "emp-001") moves from a column on `profiles` to a one-time toast on admin-create -- the password isn't stored anywhere queryable after creation.

**Implementation note for Q8:** Realtime publication is configured per-table in Supabase via `ALTER PUBLICATION supabase_realtime ADD TABLE ...`. Only the parent `shift_change_requests` publishes; child rows are fetched via a follow-up query when the parent row arrives.

---

## 12. Files this doc depends on

- `01-schema-current.md` -- column inventory, types, quirks.
- `03-appscript-inventory.md` -- backend function map for migration value-transforms.
- `04-apicall-callsite-map.md` -- frontend payload shapes (informs serialization layer).
- `05-auth-migration.md` -- auth model + RLS inventory.

## 13. Files that depend on this doc

- `08-sheet-mirror-design.md` -- denormalize from split tables back to 35-col ShiftChanges row.
- `09-cutover-and-rollback.md` -- DDL + ETL sequence, RLS rollout, password-reset blast.
