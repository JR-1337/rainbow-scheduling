# Scaling + Migration Options -- RAINBOW Scheduling

Date: 2026-04-26
Status: Research only. No decision pending.
Audience: JR -- solo dev considering a future migration off Sheets + Apps Script.

## What you're actually deciding

The TODO line ("future-proofing audit, getAllData reads whole Shifts tab, year 2-3 UX cliff") conflates two axes:

1. **Data layer**: Sheets denormalized tabs -> Postgres (or SQLite via D1)
2. **Backend layer**: Apps Script web app with ~7-8s call floor -> Vercel Functions / Workers / etc

The 7-8s floor is in **Apps Script**, not the data layer. Swapping Sheets for Postgres without leaving Apps Script does not fix the core latency users feel. Most migration value comes from leaving Apps Script; the DB choice is secondary.

Migration is a 2-step decision tree:

- Decision A: keep Apps Script or replace it?
- Decision B (if A = replace): which DB?

A and B can ship together or staged.

## Current state snapshot

Codebase audit at HEAD `6197443` (2026-04-26).

### Read pattern

- Primary read is `getAllData` (`src/utils/api.js:8`; `backend/Code.gs:1553`).
- Five sequential `getDataRange().getValues()` calls: Employees, Shifts, Settings, Announcements, ShiftChanges.
- No server-side filtering or projection; client receives whole tabs as JSON.
- Per-render reads are rare; getAllData fires at boot or explicit refresh.
- Estimated payload at current scale: ~20-50 KB total.

### Write pattern

- Primary write is `batchSaveShifts` (`Code.gs:1772`).
- Reads entire Shifts tab into memory, computes 3-tuple dedupe key (`empId-date-type`), filters survivors, overlays provided shifts, rewrites in one `Sheets.Spreadsheets.Values.update` call.
- Document-level lock serializes concurrent writes.
- ~7-8s fixed overhead per call regardless of payload size (`Code.gs:85` v2.20.1 changelog; `CONTEXT/LESSONS.md` line 99).

### Auth posture

- HMAC SHA-256 token, 12h TTL.
- Secret in Apps Script Project Properties (no external vault).
- Payload: email, exp, isAdmin, isOwner, adminTier.
- Constant-time signature comparison; AUTH_INVALID / AUTH_EXPIRED close failure modes.
- Rotation via `rotateHmacSecret()` Apps Script menu invalidates all sessions on demand.

### Sheet ACLs + PII

- Spreadsheet is JR-owned; Sarvi has edit access.
- No public read-only link; direct Sheets link visibility is owner-only.
- PII on Employees tab: name, email, phone, address, DOB, passwordHash, passwordSalt. Plaintext password column was zeroed after the v2.23 hash migration.
- No encryption at rest. Sheet data is visible to anyone with Sheet edit access.

### Row counts (current + linear projection)

| Tab | Year 1 | Year 3 | Year 5 | Cliff |
|---|---|---|---|---|
| Employees | 34 | 40-50 | 60+ | None observable |
| Shifts | ~1.2k | ~3.6k | ~6k | **Year 3** -- getAllData payload + Apps Script floor compound to perceptible lag |
| Announcements | 26 | 78 | 130 | None (O(1) by period) |
| ShiftChanges | ~180 | ~540 | ~900 | Year 3+ -- request handlers iterate full tab per action |

Source: codebase counts + Sarvi-confirmed 34 staff + 26 pay periods/year.

## DB option matrix

Scale baseline: 34 users, ~15k row writes/year (~41/day), ~1 GB storage, ~100k req/day.

| Option | Cost/mo at OTR scale | Auth | RLS | Toronto/CA latency | Lock-in exit | Operational burden |
|---|---|---|---|---|---|---|
| **Supabase** | $25 flat (Pro) | Built-in JWT, custom JWT secret supported | Native Postgres RLS, turnkey | `ca-central-1` Montreal, ~10-30ms warm (not vendor-published) | pg_dump portable; auth tables add work | Fully managed; daily PITR, 7d retention |
| **Neon (Launch)** | ~$1-7 (pay-per-use) | BYOA | Native Postgres RLS, manual `SET LOCAL` setup | `aws-us-east-1` only, ~20-50ms warm + ~300-500ms cold-start | pg_dump portable | Fully managed; scale-to-zero; PITR |
| **Vercel Postgres** | n/a | n/a | n/a | n/a | n/a | **DEAD** -- shut down Dec 2024, migrated to Neon Marketplace |
| **Cloudflare D1** | $0 free or $5 Workers Paid | BYOA in Workers | NO native RLS (SQLite); enforce in app code | `enam` US-East with read replicas, ~10-50ms warm | SQLite dialect; exit to Postgres = dialect translation | Fully managed; "Time Travel" 30-day PITR |
| **Self-hosted Postgres (Fly.io yyz / DO Toronto)** | $2-15 | BYOA | Native Postgres RLS | Fly `yyz` Toronto, ~20-30ms; DO Toronto similar | Standard pg_dump, zero lock-in | Manual: backups, patches, on-call (Fly); managed (DO) |

Pricing pages cross-checked against independent secondary sources (saaspricepulse.com, dev.to writeups). Vendor latency claims flagged where the number is from marketing copy vs technical docs.

### Auth/RLS split is the main differentiator

- **Supabase** is the only option with built-in auth + turnkey RLS. Others support RLS as a Postgres feature but require manual `SET LOCAL` + policy plumbing.
- **D1** has neither built-in auth nor RLS (SQLite limitation). Authorization moves entirely to app code. Real security surface delta for an app that distinguishes employee-visible vs admin-visible data.
- **Neon** and **self-hosted** keep your existing HMAC token model intact; you run a thin API layer (Vercel Function) that validates the token then queries the DB.

### Migration effort estimates

| Option | Estimated hours (5 denormalized tabs) |
|---|---|
| Supabase | 4-7 |
| Neon | 4-7 |
| Self-hosted Postgres | 4-7 |
| Cloudflare D1 | 6-11 (SQLite dialect overhead) |

From vendor migration tooling docs, not benchmarks. Actual time depends on data quality + denormalization depth.

## Cross-cutting notes

### Canadian data residency

- **Supabase `ca-central-1`** (Montreal) -- only managed Postgres option in Canada.
- **Fly.io `yyz`** (Toronto) -- self-hosted Postgres-on-Fly.
- **DigitalOcean Toronto** -- managed Postgres claimed available; verify at console.
- **Neon, Cloudflare D1, Hetzner** -- no Canadian region.

PIPEDA / data-in-Canada policy: Supabase, Fly, and DO Toronto are the candidates.

### Free-tier rugpull risk

- Neon (Series B), Supabase (Series C) -- VC-backed; free tiers may tighten as monetization pressure grows.
- Cloudflare D1 -- embedded in core Workers product ($1.9B revenue company); lowest rugpull risk of the managed options.
- Self-hosted -- no rugpull by definition.

### Apps Script floor is the highest-impact lever

The 7-8s call floor dwarfs DB choice. Replacing Apps Script with Vercel Functions collapses per-call latency to ~50-200ms regardless of DB. This is the largest user-perceived improvement available.

### CF Worker SWR cache (already in TODO Blocked)

The TODO Blocked list already names a CF Worker SWR cache in front of getAllData. Estimated effort 1-2 days. It sidesteps Apps Script latency on the read path **without a full migration**. Defers the database decision entirely while solving the perceived-lag problem.

## Decision axes

The right path depends on the motivation.

### If primary motivation is "buy time before the cliff with minimum change"

- Ship CF Worker SWR cache (already in TODO Blocked).
- Effort: 1-2 days.
- Buys ~1-2 years before re-evaluating.
- Reversible; no migration risk.

### If primary motivation is "professional security posture for the pitch"

- Supabase `ca-central-1` migration paired with Apps Script replacement.
- Built-in auth + native RLS + Canadian residency in one move.
- Effort: ~4-7 hrs DB import + auth reconciliation work + Apps Script handler rewrite.
- Cost: $25/mo flat.

### If primary motivation is "lowest cost + zero lock-in"

- Neon (via Vercel Marketplace) + HMAC validation in Vercel Functions.
- Effort: ~4-7 hrs DB import + Vercel Function thin API layer.
- Cost: ~$1-7/mo.
- Existing HMAC token model carries over unchanged.

### If primary motivation is "edge-distributed reads"

- Cloudflare D1 with read replicas via Workers.
- Effort: ~6-11 hrs (SQLite dialect translation).
- Cost: $0-5/mo.
- Tradeoff: app-layer authorization instead of DB-enforced RLS.

## Risks + open questions

- **Sarvi's workflow**: direct Sheet edits by Sarvi (employee tweaks, backfills) are part of current ops. Any migration off Sheets removes that escape hatch. Either build a replacement admin row-edit UI or keep Sheets as a read-side mirror.
- **Backup**: today the Sheet IS the backup. Post-migration: who backs up Postgres? PITR covers DB recovery; periodic CSV exports cover off-vendor portability.
- **PII at rest**: passwordHash + passwordSalt remain on the Employees tab. Postgres should encrypt at rest (most managed options do by default; verify per vendor).
- **Demo timing**: scheduling pitch + payroll aggregator are separate workstreams. A migration mid-pitch-prep risks spillover. Defer migration until post-demo unless cliff symptoms surface earlier.
- **Apps Script daily quotas**: not currently checked in code. At year 5 projected scale, daily-quota limits may surface before the cliff. Worth measuring mid-2027.

## Sources

- Codebase audit at HEAD `6197443` (Explore subagent, 2026-04-26).
- Vendor docs (Supabase, Neon, Cloudflare D1, Fly.io, DigitalOcean, Hetzner) -- primary for pricing + technical claims.
- Independent secondary sources (saaspricepulse.com, dev.to writeups, Cloudflare Community threads) -- corroboration on vendor claims, flagged when commercial.
- `CONTEXT/LESSONS.md` line 99 (Apps Script 7-8s floor).
- `CONTEXT/TODO.md` (Active "Future-proofing audit", Active "Perf + professional-app audit (b)", Blocked "CF Worker SWR cache").

## Status

Research only. No recommendation. Decision waits on motivation -- which is what should drive option selection per the decision-axes section above.

A clear next step is to ship the CF Worker cache (already approved in concept on TODO Blocked) before any DB migration is scoped. That alone closes the year 2-3 cliff for the read path and buys time to reach the migration decision when business posture is clearer.
