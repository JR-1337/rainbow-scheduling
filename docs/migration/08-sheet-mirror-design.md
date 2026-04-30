# 08 -- Sheet Mirror Design (one-way DB → Sheet sync)

Last refreshed: 2026-04-29

Source-class legend: **C** codebase (path:line), **VD** vendor docs (URL), **S** synthesis on cited prior facts.

This doc specs the one-way Postgres → Google Sheet sync that keeps the existing 5-tab Sheet alive as a read-only mirror of Supabase data after migration. Sarvi continues to see the same Sheet she has today; edits no longer round-trip back to the app.

Built on `02-schema-proposed.md` (target Postgres schema), `01-schema-current.md` (target Sheet shape -- unchanged), and `10-supabase-due-diligence.md` §6 (webhook + Realtime constraints).

---

## 1. Goals + non-goals

**Goals:**
- Sheet contents stay byte-comparable to today's shape: same 5 tabs, same column headers, same row formats. Any Sarvi script, formula, or Apps Script add-on that reads from these tabs keeps working.
- Sync latency < 60 seconds for the common case (admin edits a shift, Sarvi sees it).
- Sync is at-least-once with idempotent writes -- duplicate webhook delivery cannot corrupt the Sheet.
- Sheet edits made by Sarvi (mistakenly or otherwise) do not propagate back to the DB and are auto-corrected on the next sync.
- Failure to write to the Sheet does not block the DB write or the user-facing UI.

**Non-goals:**
- Two-way sync. Explicitly rejected per `CONTEXT/DECISIONS.md` 2026-04-29.
- Sub-second latency. The Sheet is a backup viewing surface, not a live dashboard.
- Sheet history/versioning. Google Sheets' native version history is sufficient.
- Selective row-level access on the Sheet. Read access on the Sheet is governed by Drive sharing, not by app RLS. Anyone with the Sheet link sees everything in it.

---

## 2. Architecture

**Recommended:** Database Webhook → Edge Function → Sheets API, with a nightly cron full-refresh as the catchup safety net.

```
┌─────────────┐    pg trigger    ┌──────────────┐    HTTPS POST    ┌─────────────────┐
│  Postgres   │ ──────────────── │   pg_net     │ ──────────────── │  Edge Function  │
│  (Supabase) │   on INS/UPD/DEL │ (webhook)    │  signed payload  │ "sync-to-sheet" │
└─────────────┘                  └──────────────┘                  └────────┬────────┘
                                                                            │
                                                                            │ Sheets API v4
                                                                            │ values.update
                                                                            ▼
                                                                    ┌──────────────┐
                                                                    │ Google Sheet │
                                                                    │ (otr.scheduler-owned) │
                                                                    └──────────────┘

┌─────────────────┐  cron 02:00 ET nightly  ┌──────────────────────┐
│ Supabase cron   │ ─────────────────────── │ "full-refresh" Edge  │
│ (pg_cron)       │                         │ Function rebuilds 5  │
└─────────────────┘                         │ tabs from DB queries │
                                            └──────────────────────┘
```

**Rationale for this shape vs alternatives:**

| Alternative | Why not |
|---|---|
| Realtime listener in long-running Edge Function | Edge Functions are request-scoped; no persistent listener model. Would require an external worker. |
| Sheets API written directly from Apps Script polling Postgres | Reverses the topology -- Apps Script becomes load-bearing again. Defeats the migration. |
| Cron-only (no webhook) | Latency floor is the cron interval. <1-min cadence wastes Sheets API quota; >5-min cadence is a UX regression vs current Apps Script. |
| Webhook-only (no nightly cron) | Webhooks are not guaranteed-delivery (10:195). One missed webhook = drift forever. Nightly catchup heals drift. |

**S** ref 10:191-195, 10:23.

---

## 3. Edge Function: `sync-to-sheet`

### 3.1 Inputs

Database Webhook payload **VD** https://supabase.com/docs/guides/database/webhooks:

```json
{
  "type": "INSERT" | "UPDATE" | "DELETE",
  "table": "shifts",
  "schema": "public",
  "record": { ...new row... },
  "old_record": { ...prior row, on UPDATE/DELETE... }
}
```

Plus signed `X-Supabase-Event-Signature` header verified against `SUPABASE_DB_WEBHOOK_SECRET`. **S** ref 10:193.

### 3.2 Auth to Google Sheets

Service account JSON key stored in Supabase Vault (Phase 1) or as Edge Function env var. Service account is added as Editor on the target Sheet via Drive sharing (one-time setup).

Sheet ownership stays at `otr.scheduler@gmail.com` per `MEMORY.md` reference_apps_script_topology. Service account is granted Editor access only on this single Sheet, not Drive-wide.

### 3.3 Idempotent write strategy

For each table, the function maintains a row-key → row-number cache (in-memory per invocation; rebuilt by reading column A of the target tab on cold start). On each event:

- **INSERT / UPDATE:** locate the row by `legacy_id` (or composite key for `shifts`). If found, `values.update` overwrites. If not found, append.
- **DELETE:** locate row by key, blank-out the row range (do not actually delete to avoid row-shift; mark all cells empty). The next nightly full-refresh will compact.

Idempotency: the same payload arriving twice produces the same final cell state. **S** ref 10:195 -- at-least-once delivery requires this property.

### 3.4 Mapping table (table → tab + denormalize logic)

| Postgres table | Sheet tab | Denormalize logic |
|---|---|---|
| `profiles` | Employees | Direct column mapping (§4); auth columns (D, S, T, U) blanked. |
| `shifts` | Shifts | Direct column mapping (§5). |
| `store_config` | Settings | Single row exploded back to N key-value rows (§6). |
| `announcements` | Announcements | Direct (§7). |
| `shift_change_requests` + `time_off_requests` + `shift_offers` + `shift_swaps` | ShiftChanges | LEFT JOIN parent + 3 children, flatten to 35-col row (§8). |

---

## 4. `profiles` → Employees tab

Webhook fires on `profiles` INSERT/UPDATE/DELETE. Lookup by `legacy_id` matches the existing Sheet row.

| Sheet col | Header | Source |
|---|---|---|
| A | id | `profiles.legacy_id` |
| B | name | `profiles.name` |
| C | email | `profiles.email` (CITEXT renders as TEXT) |
| D | password | **always blank** -- auth moved to Supabase Auth |
| E | phone | `profiles.phone` |
| F | address | `profiles.address` |
| G | dob | `profiles.dob` (DATE → 'yyyy-MM-dd') |
| H | active | `profiles.active` (BOOL → 'TRUE' / 'FALSE') |
| I | isAdmin | `profiles.is_admin` (BOOL → string) |
| J | isOwner | `profiles.is_owner` (BOOL → string) |
| K | showOnSchedule | `profiles.show_on_schedule` (BOOL → string) |
| L | deleted | `profiles.deleted` (BOOL → string) |
| M | availability | `profiles.availability` (JSONB → JSON.stringify) |
| N | defaultShift | `profiles.default_shift` (JSONB → JSON.stringify or '') |
| O | counterPointId | `profiles.counter_point_id` |
| P | adpNumber | `profiles.adp_number` |
| Q | rateOfPay | `profiles.rate_of_pay` (NUMERIC → string) |
| R | employmentType | `profiles.employment_type` |
| S | passwordHash | **always blank** |
| T | passwordSalt | **always blank** |
| U | passwordChanged | **always blank** |
| V | defaultSection | `profiles.default_section` |
| W | adminTier | `profiles.admin_tier` |
| X | title | `profiles.title` |

Cols D / S / T / U stay in the Sheet header for shape parity but always render empty. They could also be dropped; keeping them avoids any external script breaking on header-row changes. **S** ref 01:27, 01:43-45.

---

## 5. `shifts` → Shifts tab

Webhook fires on `shifts` INSERT/UPDATE/DELETE.

| Sheet col | Header | Source |
|---|---|---|
| A | id | `shifts.legacy_id` (synthetic `shift-{empId}-{date}` if NULL) |
| B | employeeId | `profiles.legacy_id` via JOIN on `shifts.employee_id` |
| C | employeeName | `shifts.employee_name_snapshot` |
| D | employeeEmail | `shifts.employee_email_snapshot` |
| E | date | `shifts.date` (DATE → 'yyyy-MM-dd') |
| F | startTime | `shifts.start_time` (TIME → 'HH:mm') |
| G | endTime | `shifts.end_time` (TIME → 'HH:mm') |
| H | role | `shifts.role` |
| I | task | `shifts.task` (NULL → '') |
| J | type | `shifts.type` |
| K | note | `shifts.note` |

JOIN cost: one lookup against the in-memory profiles cache (rebuilt at cold start). At 35 staff the cache is trivial.

---

## 6. `store_config` → Settings tab (KV explode)

The Settings tab is key-value. The proposed schema flattens to a single `store_config` row. The mirror has to re-explode.

Webhook fires on `store_config` UPDATE only (singleton row, no inserts/deletes after seed).

For each known field, the Edge Function ensures one Settings row exists:

| Settings key | Source field | Format conversion |
|---|---|---|
| storeName | `store_name` | TEXT |
| storeEmail | `store_email` | CITEXT → TEXT |
| storeAddress | `store_address` | TEXT |
| storePhone | `store_phone` | TEXT |
| livePeriods | `live_periods` (DATE[]) | `array_to_string(value, ',')` -- CSV per 01:148 |
| staffingTargets | `staffing_targets` (JSONB) | JSON.stringify |
| storeHoursOverrides | `store_hours_overrides` | JSON.stringify |
| staffingTargetOverrides | `staffing_target_overrides` | JSON.stringify |

The `adminPassword=1337` row from the legacy Sheet is **not** mirrored (decision: dropped from migration per `02-schema-proposed.md` §3.1).

Lookup-by-key + upsert: read column A, find matching key, write to column B. If key absent, append a new row.

---

## 7. `announcements` → Announcements tab

Direct mapping. Webhook on INSERT/UPDATE/DELETE. Lookup by `legacy_id`.

| Sheet col | Header | Source |
|---|---|---|
| A | id | `announcements.legacy_id` |
| B | periodStartDate | `announcements.period_start_date` (DATE → 'yyyy-MM-dd') |
| C | subject | `announcements.subject` |
| D | message | `announcements.message` |
| E | updatedAt | `announcements.updated_at` (TIMESTAMPTZ → ISO 8601 ms) |

---

## 8. Split tables → ShiftChanges tab (denormalize JOIN)

The 4-table split (parent + time_off + offers + swaps) flattens back to the 35-col Sheet row.

Webhook fires on the parent `shift_change_requests` plus on each child table. The handler always reads the full joined view to write a complete row -- subscribing to children alone could write a row before the parent row exists.

### 8.1 Per-event handling

- **INSERT on parent:** wait briefly (200ms) then read the joined view; if the matching child row exists, write the full ShiftChanges row. If not yet (race), the child INSERT will trigger a follow-up write that completes it.
- **INSERT on child:** read the joined view (parent must exist by FK); write/overwrite the row.
- **UPDATE on parent or child:** re-read joined view; overwrite row.
- **DELETE on parent:** blank the row.

### 8.2 Joined view definition

```sql
CREATE VIEW v_shift_changes_mirror AS
SELECT
  r.legacy_id        AS request_id,
  r.request_type,
  r.employee_name_snapshot   AS employee_name,
  r.employee_email_snapshot  AS employee_email,
  r.status,
  r.created_at,
  r.decided_at,
  r.decided_by_email,
  r.revoked_at,
  r.revoked_by_email,
  -- Time-off
  CASE WHEN r.request_type = 'time_off'
       THEN array_to_string(t.dates_requested, ',') END AS dates_requested,
  t.reason,
  -- Offers
  o.recipient_name_snapshot   AS recipient_name,
  o.recipient_email_snapshot  AS recipient_email,
  o.shift_date,
  o.shift_start, o.shift_end, o.shift_role,
  o.recipient_note,
  o.recipient_responded_at,
  r.admin_note               AS admin_note,
  o.cancelled_at,
  -- Swaps
  s.partner_name_snapshot    AS partner_name,
  s.partner_email_snapshot   AS partner_email,
  s.initiator_shift_date,
  s.initiator_shift_start, s.initiator_shift_end, s.initiator_shift_role,
  s.partner_shift_date,
  s.partner_shift_start, s.partner_shift_end, s.partner_shift_role,
  s.partner_note,
  s.partner_responded_at,
  r.admin_note               AS swap_admin_note   -- mirrors col AI
FROM shift_change_requests r
LEFT JOIN time_off_requests t ON t.id = r.id
LEFT JOIN shift_offers      o ON o.id = r.id
LEFT JOIN shift_swaps       s ON s.id = r.id;
```

The view materializes the 35-column shape per `01-schema-current.md` §Tab 5.

### 8.3 Note on `admin_note` collision

Sheet col U (`adminNote`) and col AI (`swapAdminNote`) both come from the unified `shift_change_requests.admin_note` column post-merge. The mirror writes the same value into both Sheet columns when present, blank otherwise. This is a small loss of fidelity: in the legacy Sheet, theoretically a user could have had distinct adminNote and swapAdminNote on the same row, but the data model never used that. Confirmed via `01-schema-current.md` 01:233, 01:247 -- they're populated in mutually exclusive code paths.

---

## 9. Format conversion catalog

Inverse of the migration value-transforms in `02-schema-proposed.md` §7. Postgres → Sheet direction.

| Postgres type | Sheet format | Conversion |
|---|---|---|
| BOOLEAN | 'TRUE' / 'FALSE' string | `value ? 'TRUE' : 'FALSE'` |
| DATE | 'yyyy-MM-dd' | `format(value, 'yyyy-MM-dd')` |
| TIME | 'HH:mm' | `format(value, 'HH:mm')` |
| TIMESTAMPTZ | ISO 8601 with ms | `value.toISOString()` |
| JSONB | JSON-string | `JSON.stringify(value)` |
| DATE[] | CSV | `value.join(',')` |
| CITEXT | TEXT | identity |
| NULL | '' | empty string (Sheets has no null cells) |
| NUMERIC | string | `value.toString()` |

---

## 10. Sheets API quotas + batching

**Quotas (verified 2026-04-29 from Sheets API docs):**

- **300 read requests / minute / project**
- **300 write requests / minute / project**
- **60 read or write / minute / user**
- No per-day cap on Workspace plans.

**Source:** https://developers.google.com/sheets/api/limits (VD).

**OTR-scale write rate estimate:**

- Schedule edits during a busy admin session: ~50 shifts saved in 5 minutes = ~10 writes/min
- Typical idle hour: <1 write/min
- Worst-case batch save (`batchSaveShifts` for full week): ~50 rows in one click → 50 webhooks → 50 writes within seconds

**Batching strategy:** the Edge Function debounces by waiting 500ms after a webhook arrives, collecting any additional webhooks for the same tab in that window, and writing as one `values.batchUpdate` call. This collapses bursts into single API calls. **VD** https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/batchUpdate.

50 row-edits in one click = 1 API call instead of 50. Stays well below the 60 writes/min/user ceiling.

**Headroom:** at observed OTR pace, the worst-case sustained write rate is <5 calls/min after debouncing. ~12% of the per-user quota.

---

## 11. Failure modes + recovery

| Failure | Detection | Recovery |
|---|---|---|
| Webhook delivery failure (network, Edge Function 5xx) | Postgres `net._http_response` row with non-2xx status. **S** ref 10:195. | Nightly full-refresh cron rebuilds the affected tab from DB ground truth. |
| Edge Function exception during write | Function logs (Supabase dashboard) | Same -- nightly catchup. Plus a Slack/email alert if more than N exceptions in 1hr (Phase 2 observability). |
| Sheets API quota exhausted (429) | Sheets API response | Edge Function retries with exponential backoff (1s, 2s, 4s, 8s, 16s, fail). At fail, log + nightly catchup. |
| Service account loses access to Sheet (Sarvi accidentally removes) | First write returns 403 | Function logs, alert; mirror stays stale until access restored. |
| DB row inserted before webhook installed (during cutover) | Compare DB row count to Sheet row count | Nightly full-refresh closes the gap. |
| Stale row in Sheet that DB no longer has (DELETE missed) | Same diff | Nightly full-refresh blanks/removes. |
| Schema drift (new column added to DB, mirror not updated) | Manual / code review | Mirror writes ignore unknown source columns; new Sheet column requires a code change. Phase 2 observability could alert. |

**Nightly full-refresh procedure (cron 02:00 ET):**
1. For each of the 5 tabs: read all rows from DB.
2. Build the full Sheet representation in memory (header + N rows).
3. Single `values.update` per tab covering header + all rows (5 API calls total).
4. Log row counts for the audit trail.

Worst case: 5000 rows × 5 tabs × ~50 cells/row = ~1.2M cells written in a few minutes. Under the per-minute write quota when batched per-tab.

---

## 12. Accidental Sarvi-edit handling

The Sheet is downstream-only: edits Sarvi makes there do not reach the DB. Three layers of handling:

1. **Visual cue:** the first row of each tab gets a banner row above the headers: `READ-ONLY MIRROR -- edits here do not reach the app. Edit in Rainbow.` via a sheet-level note or row 1 frozen.
2. **Live overwrite:** any DB change to the same row triggers a webhook that overwrites whatever Sarvi typed.
3. **Nightly full-refresh:** at 02:00 ET, every tab is rebuilt from DB. Any drift introduced during the day is wiped.

**What this does NOT do:** prevent Sarvi from editing in the moment. Google Sheets has range-protection that blocks edits, but turning it on for the entire content area is a heavy-handed UX (every Sheet open shows a "you don't have edit access" warning even on tabs Sarvi is allowed to view). The combination of banner + overwrite + nightly catchup handles the realistic cases without a protection wall.

**S** -- nightly catchup is the load-bearing safety net; the banner is informational; the live overwrite is opportunistic.

---

## 13. Cutover hooks (preview for doc 09)

The mirror is part of the cutover sequence in `09-cutover-and-rollback.md`:

1. Pre-cutover: deploy the Edge Function, install the webhook triggers, but route them to a no-op (mirror disabled). Verify logs.
2. Cutover step N: enable the mirror; verify nightly full-refresh produces a Sheet that byte-matches a hand-exported snapshot.
3. Post-cutover soak (~2 weeks): mirror runs alongside Apps Script writes (which are still touching the same Sheet); diff the two outputs.
4. End of soak: decommission Apps Script; mirror is the sole writer to the Sheet.

The dual-writer phase (3) is the riskiest. Specifically: if Apps Script writes to row N at the same time the mirror writes to row N, the second writer wins by clock-skew. Doc 09 will spec the soak procedure to minimize this -- likely Apps Script gets disabled before mirror is enabled, with a hand-export snapshot covering the gap.

---

## 14. Open questions for main session

1. **Banner row vs cell-note for the read-only warning?** Banner row (row 1) is visible always but shifts row indexing (Sarvi's bookmarks/scripts that read row N now read row N+1). Cell-note (hover-only) is invisible at a glance. Tradeoff: visibility vs row-index parity.
2. **Should col D / S / T / U on Employees tab be dropped from the header (since they're always blank), or kept for shape parity?** Kept = any external script/formula reading those headers keeps working. Dropped = cleaner Sheet, breaks any consumer of those columns. Default proposal: keep.
3. **Service account Sheet access:** scoped to the single Sheet (recommended) or Drive-wide? Drive-wide is simpler to set up but blast radius on credential leak is the entire Drive. Default proposal: single-Sheet scope.
4. **Nightly cron time:** 02:00 ET assumes OTR is closed. Confirm with JR -- if Sarvi sometimes works late or weekends differ, the window shifts.
5. **Phase 2 observability (Slack/email alerts on N exceptions/hr):** ship at cutover or defer? Cutover-deferred default; visible function logs in dashboard suffice for solo-dev.

---

## 15. Files this doc depends on

- `02-schema-proposed.md` -- target Postgres schema; format conversions are inverse of §7.
- `01-schema-current.md` -- target Sheet shape (unchanged from today).
- `10-supabase-due-diligence.md` -- webhook delivery + retry semantics (§6).

## 16. Files that depend on this doc

- `09-cutover-and-rollback.md` -- mirror deployment is a cutover phase; soak + dual-writer logic (§13).
