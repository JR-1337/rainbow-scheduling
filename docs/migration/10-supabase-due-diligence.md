# Supabase ca-central-1 -- Vendor Due Diligence

**Last refreshed: 2026-04-29**

Status: Research only. No decision pending. The Supabase ca-central-1 commitment was already locked per `CONTEXT/DECISIONS.md` 2026-04-26 ("Supabase Postgres ca-central is a Phase 1 fitting deliverable") and 2026-04-29 ("Migration shape: DB-canonical, Sheet = read-only mirror"). This document deepens the vendor-specific facts that the prior survey (`docs/research/scaling-migration-options-2026-04-26.md`) collected at survey depth.

## Source-class legend

- **VD** = vendor docs (supabase.com/docs, supabase.com pricing page, supabase/supabase GitHub repo)
- **VM** = vendor marketing (supabase.com landing pages, blog posts -- flagged because positioning, not contractual)
- **IM** = independent measurement / community report / 3rd-party teardown (TechCrunch, Sacra, simplebackups, designrevision, etc.)

When VD and IM diverge, both are noted with the divergence flagged.

---

## 1. ca-central-1 Region Claims

| Service | ca-central-1 status | Source |
|---|---|---|
| Project Postgres database | Available; selectable at project creation. Note: Supabase deploys to "an available AWS region within that area based on current infrastructure capacity" -- specific AZ not user-controlled. | VD: https://supabase.com/docs/guides/platform/regions |
| Auth schema (`auth.users` etc.) | Co-located with the project's primary database region. The `auth` schema lives inside the same Postgres instance as the rest of the project; if project = ca-central, `auth.users` = ca-central. | VD: https://supabase.com/docs/guides/auth/architecture ; https://supabase.com/docs/guides/auth/managing-user-data |
| Edge Functions | Globally distributed by default via the API Gateway (routes to nearest edge). Regional invocation is supported via the `x-region` header to pin execution; ca-central-1 is on the supported list. | VD: https://supabase.com/docs/guides/functions/regional-invocation ; VD: https://supabase.com/docs/guides/functions/architecture |
| Storage | Storage buckets sit on top of S3-compatible storage in the same region as the project database (ca-central-1). | VD: https://supabase.com/docs/guides/storage |
| Realtime hub | The Realtime Postgres CDC subscribes to the project's primary database WAL; Realtime servers are deployed regionally and the hub serving a project lives in the project's region. Vendor docs do not explicitly enumerate "Realtime in ca-central-1"; inferred from the Realtime architecture page (Realtime nodes connect to the project's Postgres). | VD-inferred: https://supabase.com/docs/guides/realtime ; VD: https://supabase.com/docs/guides/realtime/architecture -- **undetermined as an explicit ca-central guarantee; require sales-channel confirmation for a contractual residency claim.** |
| Logs / observability backend | Where Supabase ships request logs, function logs, and DB audit logs to is not documented as ca-central-resident; logs flow through Supabase's logging pipeline (Logflare-derived) and are likely cross-region. | **Undetermined; require sales-channel confirmation if log residency is a customer-facing claim.** |

**PIPEDA implication:** primary data plane (DB + Auth + Storage) sits in ca-central-1 by VD-confirmed configuration. Telemetry/logging residency is the open question, plus the AZ-3 (third Montreal AZ opened June 2024 per AWS) availability is a Supabase-internal capacity decision, not user-selectable. Sources: https://aws.amazon.com/blogs/aws/now-open-third-availability-zone-in-the-aws-canada-central-region/ (IM, AWS), https://supabase.com/docs/guides/troubleshooting/change-project-region-eWJo5Z (VD).

---

## 2. Pricing + Tier Limits

### Plan structure (verified 2026-04-29)

| Plan | Base price | Included DB | Included MAU | Included storage | Included egress | Included compute | Source |
|---|---|---|---|---|---|---|---|
| Free | $0 | 500 MB | 50,000 | 1 GB | 5 GB | Nano (shared) | VD: https://supabase.com/pricing |
| Pro | $25/mo | 8 GB | 100,000 | 100 GB | 250 GB | 1x Micro (included) | VD: https://supabase.com/pricing ; IM: https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance |
| Team | $599/mo | Pro + per-project | Pro + per-project | Pro + per-project | Pro + per-project | Pro + per-project | VD: https://supabase.com/pricing ; IM: https://costbench.com/software/database-as-service/supabase/ |
| Enterprise | Custom | Negotiated | Negotiated | Negotiated | Negotiated | Negotiated | VD: https://supabase.com/pricing |

### Overage rates on Pro (verified)

- MAU: $0.00325 per MAU above 100k (VD pricing; IM metacto.com)
- DB storage: $0.125/GB/mo above 8 GB (VD pricing)
- Storage (file): $0.021/GB/mo above 100 GB (VD pricing)
- Egress: $0.09/GB above 250 GB (VD pricing) -- **note: search result quoted $0.021/GB; the vendor pricing page shows $0.09/GB as of 2026 -- divergence flagged, vendor pricing page wins**
- Edge Function invocations: 2M included on Pro, $2 per additional 1M (VD: https://supabase.com/docs/guides/functions/pricing)
- Realtime messages: 5M included on Pro; overages metered (VD: https://supabase.com/docs/guides/realtime/pricing)

### OTR-scale projection

Scale baseline (Phase 1 single-tenant OTR, per `docs/research/scaling-migration-options-2026-04-26.md`): 35 users, ~6k shifts/year, ~1 GB storage.

- MAU: 35 (0.035% of Pro allowance)
- DB size: well under 8 GB
- Edge Function invocations: under 100k/month even with aggressive admin usage; 2M allowance is comfortable
- Bandwidth: 35 users hitting `getAllData` payload (~50 KB) on schedule loads -- nowhere near 250 GB

Pro plan ($25/mo) is not stressed at OTR scale on any axis. The first overage candidate is PITR (a separate add-on, see §8), not core resources.

### Phase 2 multi-tenant projection (5 OTR-sized customers)

5 x 35 = 175 MAU. Still trivially Pro. The trigger to leave Pro is not user count -- it's **SOC 2 report access** (Team plan required) once a prospect demands proof, OR **read replicas / 14-day backup retention** for compliance posture in regulated verticals. Per IM: https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance and VD: https://supabase.com/docs/guides/security/soc-2-compliance ("must be at least on a Team plan to get access to the SOC2 Report").

### Add-on costs

- PITR (Pro tier): ~$100/mo for 7-day retention, requires Small compute upgrade. IM: https://github.com/orgs/supabase/discussions/38084 (community-confirmed); VD: https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery
- Custom domain: included on Pro; configuration via dashboard (VD: https://supabase.com/docs/guides/platform/custom-domains)
- Larger compute: Small $15/mo, Medium $60/mo, Large $110/mo, XL $210/mo (VD pricing; numbers re-verified 2026-04 via IM costbench.com)
- Read replicas: Team plan required + per-replica compute charge (VD pricing)

---

## 3. Auth Feature Inventory

| Feature | Status | Source |
|---|---|---|
| Email + password sign-up / sign-in / reset / change | GA | VD: https://supabase.com/docs/guides/auth/passwords |
| Magic link (OTP via email) | GA | VD: https://supabase.com/docs/reference/javascript/auth-signinwithotp |
| MFA (TOTP) | GA, free on all plans, up to 10 factors per user | VD: https://supabase.com/docs/guides/auth/auth-mfa/totp |
| MFA (SMS / phone) | GA; SMS provider charged separately (Twilio etc.) | VD: https://supabase.com/docs/guides/auth/auth-mfa/phone |
| Recovery codes | NOT supported; user must enroll multiple factors as workaround | VD: https://supabase.com/docs/guides/auth/auth-mfa |
| Session management (refresh tokens, expiry control) | GA; configurable JWT expiry, refresh-token rotation, revocation via admin API | VD: https://supabase.com/docs/guides/auth/sessions |
| Custom JWT secret | GA; project-level JWT secret rotatable in dashboard. Important: rotating invalidates ALL sessions (matches the existing HMAC rotation behavior in `Code.gs`). | VD: https://supabase.com/docs/guides/auth/jwts |
| Password import (preserve existing hashes) | Bcrypt-hash import supported via service-role admin API; modular crypt format `$2a$10$[salt][hash]`. **Mismatch risk:** the current app uses a custom HMAC-SHA-256 password-hash scheme (`Code.gs` v2.23 migration), NOT bcrypt. A direct hash-port is impossible; users must re-set password OR a transparent migration shim that captures the plaintext on next login and writes a bcrypt hash via admin API is required. | VD: https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 ; IM: https://github.com/supabase/auth/issues/1750 (Firebase scrypt -> Supabase bcrypt has the same mismatch) |
| Audit log (auth events) | Auth events written to project logs; queryable in dashboard. Log retention 1 day on Free, 7 days on Pro, 28 days on Team. | VD: https://supabase.com/docs/guides/platform/logs ; IM: https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance |
| Social OAuth (Google, GitHub, etc.) | GA; not relevant to OTR but available | VD: https://supabase.com/docs/guides/auth/social-login |
| SSO (SAML) | Team plan and above only | VD: https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml |

Cross-reference: when `docs/migration/05-auth-migration.md` is drafted, the password-hash-format mismatch (existing HMAC-SHA-256 vs. Supabase bcrypt) is the load-bearing decision point. The "transparent shim" pattern (validate against legacy hash on first login post-cutover, then call `supabase.auth.admin.createUser({password})` to write a bcrypt hash) is the standard migration pattern -- IM: https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0.

---

## 4. RLS + Postgres Feature Inventory

### Postgres version

Currently supported on Supabase Cloud: **Postgres 15** (default for older projects), **Postgres 17** (default for new projects as of mid-2026), and **OrioleDB-17** (experimental). PG 16 is **not** offered (Supabase skipped the 16 line on cloud; 17 is the upgrade target). VD: https://supabase.com/docs/guides/self-hosting/postgres-upgrade-17 ; IM: https://github.com/orgs/supabase/discussions/35851

PG 17 bundle on Supabase no longer includes: `timescaledb`, `plv8`, `plls`, `plcoffee`, `pgjwt`. (None of these are in current RAINBOW use; flagged for future awareness.)

### Extension catalog (relevant subset)

| Extension | Status on Supabase | Notes |
|---|---|---|
| pgcrypto | GA, enableable from dashboard | VD: https://supabase.com/docs/guides/database/extensions |
| pg_jsonschema | GA | Useful for validating the JSON-stringified columns identified in `01-schema-current.md` (`availability`, `defaultShift`, `staffingTargets`, `storeHoursOverrides`) post-migration. VD same. |
| pg_cron | GA. Caveat: `cron.job_run_details` does not auto-prune; manual cleanup required. | VD: https://supabase.com/docs/guides/database/extensions/pg_cron |
| pgsodium | GA but **pending deprecation** -- Supabase explicitly recommends NO new usage. The successor for at-rest column encryption is "Vault" (Supabase Vault), still in active development. | VD: https://supabase.com/docs/guides/database/extensions/pgsodium |
| pg_stat_statements | GA, enabled by default for query performance analysis | VD: https://supabase.com/docs/guides/database/extensions |
| pgvector | GA -- not RAINBOW-relevant today, noted for future AskRainbow embeddings work | VD same |

### RLS performance at OTR row counts

OTR-scale row counts (Year 5 projection: ~6k shifts, ~50 employees, ~900 shift-changes) are well below any RLS performance cliff. Documented best practices that matter:

- B-tree index on every column referenced in an RLS policy (e.g., `employee_id`, `tenant_id` if Phase 2). Vendor doc claims >100x speedup with index. VD: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Wrap function calls in `(select fn())` rather than `fn()` to enable initPlan caching by the query optimizer. VD same.
- Avoid correlated subqueries in policies; rewrite as `IN (select ...)` from the join table side. VD same.

These are micro-optimizations at OTR row count -- noted for Phase 2 multi-tenant where row count grows linearly with customers.

### Connection pooling (Supavisor)

- Supavisor 1.0 (released 2024) is the default pooler. Replaced PgBouncer for the shared-pooler role; PgBouncer remains available as a "Dedicated Pooler" add-on on paying plans, co-located with the DB.
- Two ports: 5432 (session mode), 6543 (transaction mode).
- **Critical gotcha**: transaction mode (6543) does **not** support prepared statements. Prisma, asyncpg, and other drivers that auto-prepare statements break in transaction mode. Use session mode OR direct connection for ORMs that prepare. VD: https://supabase.com/docs/guides/database/connecting-to-postgres ; IM: https://github.com/supabase/supabase/issues/39227
- Pool sizing: shared 30 connections per project on Pro tier (split between session + transaction modes). VD: https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI

For RAINBOW post-migration: the frontend uses `@supabase/supabase-js` over PostgREST, which doesn't hit the pooler directly -- it uses the project's REST API. Pooler concerns only matter if Edge Functions (or external clients) connect to Postgres directly via `pg`/`postgres-js`.

Sources: https://supabase.com/blog/supavisor-postgres-connection-pooler (VM, blog), https://supabase.com/docs/guides/database/connecting-to-postgres (VD)

---

## 5. Edge Functions Detail

| Spec | Value | Source |
|---|---|---|
| Runtime | Deno (Supabase Edge Runtime, Deno-compatible) | VD: https://supabase.com/docs/guides/functions |
| Deno version | 2.1-compatible across all regions as of 2025 | VD: https://github.com/orgs/supabase/discussions/37941 |
| Cold start | 0-5ms typical for ESZip-packaged code; up to 200ms in less-used regions | VM: https://supabase.com/features/deno-edge-functions (vendor blog measurement) |
| Max CPU time | 2 seconds per request (CPU only, async I/O excluded) | VD: https://supabase.com/docs/guides/functions/limits |
| Max wall-clock time | 400 seconds (worker active duration) | VD same |
| Request idle timeout | 150 seconds (504 if no response sent) | VD same |
| Memory limit | 256 MB per invocation on cloud (self-hosted default 150 MB; Deno Deploy underlying engine is 512 MB but Supabase caps lower) | VD: https://supabase.com/docs/guides/functions/limits ; IM: https://github.com/orgs/supabase/discussions/6834 |
| Function size | 20 MB after CLI bundle | VD: https://supabase.com/docs/guides/functions/limits |
| Secrets / env vars | Stored as project secrets; injected as env vars at runtime. Managed via `supabase secrets set` CLI or dashboard. | VD: https://supabase.com/docs/guides/functions/secrets |
| Region binding | Default: nearest-edge routing via API Gateway. Override: `x-region` header pins to a specific region (ca-central-1 supported). | VD: https://supabase.com/docs/guides/functions/regional-invocation |
| Local dev | `supabase functions serve` -- runs the function locally with `.env.local` injection. Works with `supabase start` to spin up the full local stack (Postgres, Auth, Storage, Functions) via Docker. | VD: https://supabase.com/docs/guides/functions/development-environment |

For RAINBOW Phase 1: the DB-canonical model with one-way DB → Sheet sync per the 2026-04-29 decision needs an Edge Function on row-change webhook OR a scheduled cron. Both fit easily within the Pro tier limits (one webhook firing on shifts/employees changes, payload <10KB, runtime <2s for the Sheet write).

---

## 6. Storage + Realtime

### Storage

| Spec | Value | Source |
|---|---|---|
| Standard upload max | 5 GB per file (server-side limit) | VD: https://supabase.com/docs/guides/troubleshooting/upload-file-size-restrictions-Y4wQLT |
| Resumable (TUS) upload max | 50 GB per file | VD: https://supabase.com/blog/storage-v3-resumable-uploads (VM, blog) ; VD: https://supabase.com/docs/guides/storage/uploads/resumable-uploads |
| TUS chunk size | Hard-coded 6 MB | VD same |
| TUS upload session validity | 24 hours from session creation | VD same |
| Public bucket | URL access without auth; cacheable by CDN | VD: https://supabase.com/docs/guides/storage/buckets/fundamentals |
| Signed URL bucket | Per-object signed URLs with TTL (default 60s; configurable up to "very large" -- vendor docs say arbitrary; community reports use up to 1 year successfully) | VD: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl |
| Region | Same as project DB (ca-central-1 for an OTR project) | VD-inferred from regional architecture |

PDF/photo upload patterns for RAINBOW are not yet specified -- payroll-PDF and shift-photo are Phase 2 features per `CONTEXT/TODO.md`. Storage spec sufficient for those flows when they materialize.

### Realtime

| Spec | Value (Pro tier) | Source |
|---|---|---|
| Concurrent peak connections | 500 | VD: https://supabase.com/docs/guides/realtime/limits |
| Max channels per client | 100 | VD same |
| Max joins per second | 500 | VD same |
| Max messages/sec broadcast (per channel) | Throttled by overall plan limit; client auto-reconnects with exponential backoff | VD same ; VD: https://supabase.com/docs/guides/troubleshooting/realtime-concurrent-peak-connections-quota-jdDqcp |
| Max subscribers per channel | 200 (default `SUBSCRIBER_LIMIT`) | VD: https://supabase.com/docs/guides/realtime/settings |
| Reconnection | supabase-js auto-reconnect, exponential backoff 1s -> 2s -> 4s -> ... cap ~30s | VD: https://supabase.com/docs/guides/realtime |

OTR-scale: 35 users -> 35 concurrent connections worst case. 7% of the 500-connection ceiling. Phase 2 multi-tenant at 5 customers = 175 connections, still 35% utilization.

### Database Webhooks

| Spec | Value | Source |
|---|---|---|
| Triggering events | INSERT, UPDATE, DELETE (post-row-change) | VD: https://supabase.com/docs/guides/database/webhooks |
| Payload | JSON POST: `{type, table, schema, record, old_record}` | VD same |
| Signing | Each payload signed with `X-Supabase-Event-Signature` HMAC header, verified against `SUPABASE_DB_WEBHOOK_SECRET` env var | VD same |
| Underlying mechanism | Postgres triggers calling `pg_net` (HTTP from Postgres) | VD same |
| Retry semantics | **Documented vaguely**: pg_net allows tracking failed requests; explicit retry/backoff policy is NOT specified in vendor docs. Independent reports suggest no automatic retry -- failures are visible in `net._http_response` table and require app-level retry logic. | VD: https://supabase.com/docs/guides/database/webhooks ; IM: https://supabase.com/docs/guides/troubleshooting/webhook-debugging-guide-M8sk47 -- **flag: retry semantics undetermined; the DB → Sheet sync pattern in `CONTEXT/DECISIONS.md` 2026-04-29 needs an at-least-once or idempotent handler, since Supabase webhooks are NOT guaranteed-delivery.** |

---

## 7. Compliance + Security

| Topic | Status | Source |
|---|---|---|
| SOC 2 Type II | GA. Annual audit; report available **only on Team plan ($599/mo) and above** via https://forms.supabase.com/soc2 | VD: https://supabase.com/docs/guides/security/soc-2-compliance ; VD: https://supabase.com/security |
| HIPAA | GA. BAA available; PHI storage permitted under shared responsibility model. HIPAA controls audited alongside SOC 2. | VD: https://supabase.com/docs/guides/security/hipaa-compliance ; VD: https://supabase.com/blog/supabase-soc2-hipaa (VM, blog announcement 2024-04) |
| ISO 27001 | NOT certified as of 2026-04. Active discussion thread; no ETA published. | IM: https://github.com/orgs/supabase/discussions/17659 |
| PIPEDA | **No vendor-published certification or attestation.** PIPEDA is a Canadian privacy law without a formal certification scheme; compliance posture relies on (a) data residency in ca-central-1 + (b) the SOC 2 controls + (c) the customer's own documented practices. **Undetermined as a formal claim; require legal/sales-channel positioning if used in pitch material.** | No VD source on PIPEDA specifically |
| GDPR | DPA available on request (Pro+); SCCs for EU data transfers. | VD: https://supabase.com/legal |
| Encryption at rest | AES-256, AWS-managed keys (since the underlying storage is AWS RDS / EBS / S3). | VD: https://supabase.com/docs/guides/security ; IM: implicit from AWS underlying infra |
| Encryption in transit | TLS 1.2+ on all endpoints | VD same |
| Customer-managed keys (CMK / BYOK) | **NOT documented as available** on Supabase Cloud. CMK is supported by AWS RDS at the infrastructure layer but Supabase does not expose this as a customer configuration. Self-hosted Supabase + customer-controlled AWS RDS gives BYOK control but loses managed benefits. | **Undetermined; require sales-channel confirmation if BYOK is a customer requirement.** |
| Pen test / disclosure program | Vulnerability disclosure program at https://supabase.com/.well-known/security.txt and security@supabase.com. Bug bounty (HackerOne) per VD security page. | VD: https://supabase.com/security |

---

## 8. Backup + Disaster Recovery

| Mechanism | Pro tier | Team tier | Enterprise | Source |
|---|---|---|---|---|
| Daily backups | Last 7 days | Last 14 days | Up to 30 days | VD: https://supabase.com/docs/guides/platform/backups |
| PITR (point-in-time) | Add-on, 7-day retention default, ~$100/mo + Small compute requirement | Add-on, 14-day available | Add-on, configurable up to 28 days | VD: https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery ; IM: https://github.com/orgs/supabase/discussions/38084 |
| PITR restore granularity | Down to seconds | Same | Same | VD: https://supabase.com/docs/guides/troubleshooting/how-long-does-it-take-to-restore-a-database-from-a-point-in-time-backup-pitr-qO8gOG |
| Restore procedure | Self-serve via dashboard; restore creates a NEW project (does not overwrite source). Restore time depends on DB size; community reports 5-30 min for <10GB. | Same | Same | VD same |
| Manual export | `pg_dump` via direct connection; full-DB export. CSV per-table export available in dashboard. | Same | Same | VD: https://supabase.com/docs/guides/platform/backups#download-a-backup |
| Cross-region replication | NOT available on Pro. Read replicas (Team+) can be in a different region from the primary; full active-active cross-region is not offered (managed by Supabase ops at Enterprise tier per case-by-case). | Team plan adds read replicas | Enterprise: per-contract | VD: https://supabase.com/docs/guides/platform/read-replicas |

For RAINBOW Phase 1 (single OTR tenant): default daily backups (7 days) cover the cliff-recovery scenario. PITR add-on is justified for a paying customer's data but $100/mo is roughly equal to baseline Pro -- the cost-benefit changes once SOC 2 access is needed (Team tier $599/mo includes 14-day daily backups but PITR is still extra).

---

## 9. Operational Tooling

### CLI (`supabase`)

- Installable via npm / Homebrew / scoop (VD: https://supabase.com/docs/reference/cli/introduction)
- Commands: `supabase start` (local stack), `supabase link`, `supabase db push`, `supabase db pull`, `supabase migration new`, `supabase functions deploy`, `supabase secrets set`, `supabase gen types typescript`
- Type generation from DB schema -> TypeScript is the headline DX feature

### Migration workflow

Two patterns supported, both documented as GA:

1. **Migration history** (numbered SQL files): each change = a new file in `supabase/migrations/`. `supabase db push` applies pending migrations to the linked remote. Standard for evolving schemas with team collaboration.
2. **Declarative schemas** (newer, GA as of 2024): SQL files in `supabase/schemas/` describe the desired end state; CLI diffs against current and generates a migration. VD: https://supabase.com/docs/guides/local-development/declarative-database-schemas

For RAINBOW (solo dev): either pattern works. Declarative is closer to ORM-style DX; migration history is more familiar to anyone who's used Rails / Django / Alembic.

### Branching / preview environments

GA. A "branch" is an ephemeral project spun up off the main project. Use cases:

- PR previews: GitHub integration auto-creates a branch per PR, deletes on merge/close
- Schema experimentation: try a destructive migration without affecting prod
- Branches inherit schema; data must be seeded separately

VD: https://supabase.com/docs/guides/deployment/branching ; VD: https://supabase.com/blog/supabase-local-dev (VM, blog)

Branches **cost compute hours** while running (priced per branch lifetime). Solo-dev workflow can live on the main project without branches if cost-sensitive.

### Monitoring + alerting

Native dashboard provides:
- Query performance (top slow queries, via pg_stat_statements)
- Resource usage (CPU, RAM, disk, connections)
- Edge Function invocations + errors
- Auth events
- API request volume

Alerting: native dashboard does NOT have alert-rules-with-notifications as a GA feature. Independent measurement: most production users wire up external alerting (Grafana + the Supabase Prometheus endpoint, OR Logflare-derived tools, OR Better Uptime polling the project's REST API). VD: https://supabase.com/docs/guides/platform/metrics ; IM: community-reported pattern.

### Role-based dashboard access (team members)

Team plan and above support multiple seats with role-based access (Owner, Admin, Developer, Read-Only). Pro plan = single seat (project owner only). For RAINBOW, Sarvi-as-ops-co-admin requires Team plan upgrade ($599/mo) **OR** Sarvi works through the app's admin UI (which is the 2026-04-29 cutover plan anyway -- Sarvi does not need direct DB dashboard access for ops tasks).

VD: https://supabase.com/docs/guides/platform/access-control

---

## 10. Vendor Business Posture

| Dimension | Latest fact | Source |
|---|---|---|
| Latest funding | Series E, **$100M at $5B valuation, October 2025**. Co-led by Accel and Peak XV; Figma Ventures + returning investors. | IM: https://www.prnewswire.com/news-releases/supabase-raises-100m-at-5b-valuation-co-led-by-accel-and-peak-xv-302573153.html ; IM: https://techcrunch.com/2025/10/03/supabase-nabs-5b-valuation-four-months-after-hitting-2b/ |
| Funding total | ~$500M raised cumulative (Seed + A + B + C $80M 2024 + D $200M @ $2B June 2025 + E $100M @ $5B Oct 2025) | IM: https://sacra.com/c/supabase/ ; IM: TechCrunch coverage above |
| ARR | $70M ARR in 2025, up from $30M end-of-2024 (250% YoY) | IM: https://taptwicedigital.com/stats/supabase ; IM: Sacra |
| Runway estimate | At ~$70M ARR + $500M cumulative raised + recent fresh $100M, runway is multi-year even at heavy burn. Not a near-term shutdown risk. | IM-derived from above |
| Pricing-change history | Pro plan stable at $25/mo since 2021. Sept 2023 introduced Team ($599) and restructured billing -- some users saw cost reductions. **No price-increase events affecting existing customers documented.** | IM: https://www.saaspricepulse.com/blog/supabase-pricing-history |
| Free-tier rugpull risk | Low historically; vendor positions free-tier stability as brand identity. VC-backed, so monetization pressure exists, but no precedent of cuts. | IM: same as pricing-history; **VM caveat: vendor self-positioning, not a contractual guarantee.** |
| Open-source posture | Apache 2.0 license; full self-host path documented at https://supabase.com/docs/guides/self-hosting. Self-hosted retains DB + Auth + Storage + Edge Functions (Edge Functions self-hosted via Deno containers). **Critical exit-route insurance:** if Supabase Cloud disappears or pricing becomes hostile, the app can be ported to self-hosted Postgres + supabase-js still works. | VD: https://supabase.com/docs/guides/self-hosting ; VD: https://github.com/supabase/supabase (Apache 2.0) |
| Acquisition / shutdown risk | Series E at $5B valuation + IPO-track signals (Forge pre-IPO listing per https://forgeglobal.com/supabase_ipo/) suggest IPO trajectory, not acquisition setup. **Vercel Postgres precedent (shutdown Dec 2024, migrated to Neon)** is a different risk class -- Vercel Postgres was a thin product wrapper; Supabase is the company itself. Shutdown would require business failure, not a product-line discontinuation. | IM: https://forgeglobal.com/supabase_ipo/ |

---

## 11. Risks + Open Questions

### Documented gaps

1. **Realtime ca-central residency**: vendor docs do not enumerate Realtime servers per region. Inferred from architecture but **not contractually claimed in writing.** Action: sales-channel confirmation if the pitch needs to make an explicit Realtime-in-Canada claim.
2. **Logs / observability residency**: where Supabase ships request logs and function logs (Logflare-derived pipeline) is not documented as ca-central-resident. **Likely cross-region.** Action: confirm before any pitch claim that "all customer data stays in Canada."
3. **Database webhook retry semantics**: vendor docs are vague on retry behavior. The 2026-04-29 DB → Sheet sync pattern requires either idempotent handlers OR an at-least-once retry layer in app code. Action: build the Edge Function handler to be idempotent (upsert, not insert).
4. **Customer-managed encryption keys (BYOK)**: not documented as available on Cloud. AWS RDS supports it under the hood; Supabase does not expose it. Action: undetermined; require sales-channel confirmation if a future enterprise customer asks.
5. **PIPEDA explicit attestation**: PIPEDA has no formal certification scheme. Posture relies on residency + SOC 2 + customer documentation. Action: pitch language should say "data resides in Canada (Supabase ca-central-1)" not "PIPEDA-certified" -- the latter is undefined.
6. **Egress overage rate divergence**: one secondary source quoted $0.021/GB for bandwidth; vendor pricing page indicates $0.09/GB. Vendor wins; flagging because pricing-summary blog posts can drift from the live pricing page.
7. **Password-hash format mismatch**: existing app uses HMAC-SHA-256; Supabase uses bcrypt. Direct hash port is impossible. Migration requires either (a) force password reset for all users on cutover, OR (b) transparent shim that captures plaintext on first post-cutover login and writes a bcrypt hash via admin API. This is the load-bearing decision in `05-auth-migration.md` (when drafted).
8. **Single-seat dashboard on Pro**: Sarvi cannot have direct dashboard access on Pro plan. Per 2026-04-29 decision, Sarvi's edit surface is the app's admin UI, not the Sheet OR the Supabase dashboard, so this is a non-issue at cutover; flagging because it affects future ops tooling decisions.

### Vendor-claim divergences

- **Edge Function memory**: vendor docs say 256 MB cap; underlying Deno Deploy is 512 MB. The Supabase docs page on limits is authoritative; community discussion mentions "150 MB self-hosted default" which is a different deployment type.
- **Cold-start claims**: 0-5ms is a vendor blog measurement (VM-flagged). Independent measurement at the app layer (TTFB from a real user) will be 30-100ms+ depending on geography even with a hot function -- the 0-5ms figure is the function-engine cold start only, not perceived latency.

### OTR-scale and Phase 2 multi-tenant risks

- OTR scale (Phase 1): no resource axis is stressed on Pro tier; the Apps Script latency floor (the actual current pain point per `CONTEXT/DECISIONS.md` 2026-04-26) is the win, not Postgres scale.
- Phase 2 multi-tenant (5 OTR-sized customers): also fits Pro on resource axes. **The forcing function to Team tier ($599/mo) is SOC 2 report access for prospects who demand it**, not user count or DB size.
- Phase 3 (10+ tenants OR a regulated-vertical prospect): Team tier or Enterprise. PITR add-on becomes more strongly justified.

---

## Flag-Out (items the main session should double-check)

1. **Realtime + logs ca-central residency** is INFERRED, not vendor-doc-confirmed. If pitch language commits to "all customer data stays in Canada," sales-channel confirmation is required for both surfaces. The 2026-04-29 migration shape (DB-canonical, one-way Sheet mirror) does not strictly require Realtime, so this can be deferred unless Realtime is wired into Phase 1.
2. **Database webhook retry behavior** is not contractually specified. The DB → Sheet sync per 2026-04-29 must be designed for at-least-once delivery with an idempotent handler, OR the app must accept that some Sheet rows may lag/duplicate without an external retry layer. Either way, the spec for `06-sync-architecture.md` (when drafted) needs to call this out explicitly.
3. **Password-hash format mismatch** (HMAC-SHA-256 → bcrypt) is the load-bearing migration cost in `05-auth-migration.md` (when drafted). The transparent-shim pattern is industry-standard but adds a deployment-dependency: the auth handler must keep the legacy HMAC validator alive in code for as long as any unmigrated user exists, then can be retired. Document this as a TODO when 05 is drafted.
4. **Egress price divergence** ($0.021/GB in a 3rd-party summary vs. $0.09/GB on the vendor pricing page): the vendor page is canonical; the divergence flags that 3rd-party pricing summaries (designrevision.com, metacto.com, etc.) can drift. **Re-verify pricing directly against https://supabase.com/pricing whenever a pitch number is cited.**
5. **The 2026-04-26 prior survey** (`docs/research/scaling-migration-options-2026-04-26.md`) cited Supabase as Series C. That fact is now stale -- Supabase closed Series E at $5B valuation October 2025. The prior survey's "free-tier rugpull risk" framing should be re-evaluated given Series E + $70M ARR posture: rugpull risk is materially lower than at Series C. If any TODO entries quote the Series C posture, they need a stale-fact flag.
6. **SOC 2 report access requires Team plan ($599/mo).** If a prospect asks "show us your SOC 2 report" during pitch and OTR is on Pro tier, the answer is "we'd upgrade if you sign" -- which is a legitimate answer but should be pre-decided rather than ad-libbed.
7. **PIPEDA framing**: PIPEDA is a privacy law without a formal certification scheme. Pitch language using "PIPEDA-compliant" should be replaced with "data resides in Canada (Supabase ca-central-1) under SOC 2 Type II controls" -- the precise true statement.
