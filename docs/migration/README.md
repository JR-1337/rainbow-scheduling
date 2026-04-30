# Apps Script + Sheets → Supabase Migration: Planning Folder

**Status: research/scoping only. No implementation. No date set.**

This folder collects the data needed to plan a meticulous migration from the current Apps Script + Google Sheets backend to a Supabase Postgres + admin-UI architecture, with the existing Sheet repurposed as a one-way read-only mirror.

The shape was decided 2026-04-29 (see `CONTEXT/DECISIONS.md` -- "Migration shape: DB-canonical, Sheet = read-only mirror; admin UI is the edit surface").

## Working ground rules

- **Research only.** No code changes triggered by docs in this folder.
- **Facts only, no recommendations.** Subagent outputs flag source class (codebase / vendor docs / vendor marketing / independent measurement) on every claim.
- **Cite paths.** Every codebase claim references `file:line` or `file` exact path.
- **Living docs.** Re-runnable as the codebase evolves; each doc dates its last refresh.
- **No execution date.** Decision to ship is separate from research completeness.

## Deliverables

| # | Doc | Wave | Source | Scope |
|---|---|---|---|---|
| 1 | `01-schema-current.md` | 1 | Codebase + live Sheet read (read-only) | Every tab -> every column -> type / nullable / format / current consumers (FE + BE). |
| 2 | `02-schema-proposed.md` | 3 | Synthesis on top of #1 | Postgres tables, FKs, indexes, JSONB-vs-column choices, migration value-transforms. |
| 3 | `03-appscript-inventory.md` | 1 | Codebase (`backend/Code.gs`) | Every exported function: signature, callers, what it does, Supabase equivalent class. |
| 4 | `04-apicall-callsite-map.md` | 1 | Codebase (`src/`) | Every `apiCall(action, payload)` site: action, payload shape, response shape, optimistic-update + error path. |
| 5 | `05-auth-migration.md` | 2 | Codebase + Supabase docs | Current HMAC + hash format -> Supabase Auth; password-import vs first-login-reset; admin-tier -> RLS mapping. |
| 6 | `06-email-migration.md` | 2 | Codebase + vendor docs | Current `sendBrandedScheduleEmail`; Resend/SendGrid options; DKIM/SPF; ca-residency. |
| 7 | `07-pdf-migration.md` | 2 | Codebase + library docs | Current Apps Script PDF + planned EmailModal v2 PDF; jsPDF / pdf-lib / Puppeteer-on-Vercel; Sarvi-iPad parity. |
| 8 | `08-sheet-mirror-design.md` | 3 | Synthesis on top of #2 | One-way DB->Sheet sync: trigger vs cron, denormalize rules, accidental-edit handling. |
| 9 | `09-cutover-and-rollback.md` | 3 | Synthesis on top of #1-8 | Phased sequence + rollback triggers + procedure at each phase. |
| 10 | `10-supabase-due-diligence.md` | 2 | Vendor docs + secondary | ca-central PITR, encryption-at-rest, SOC2/PIPEDA, Auth compat, tier limits at OTR scale + Phase 2. |

## Wave sequencing

- **Wave 1** (codebase inventory, parallel): #1, #3, #4
- **Wave 2** (mixed vendor + codebase, parallel): #5, #6, #7, #10
- **Wave 3** (synthesis, sequential): #2, #8, #9

## Source-class legend (used inside every doc)

- **C** = Codebase. Path + line cited.
- **VD** = Vendor docs (technical). URL cited.
- **VM** = Vendor marketing copy. URL cited; flagged as marketing-grade claim.
- **IM** = Independent measurement / third-party benchmark. URL or doc cited.
- **S** = Synthesis from cited prior facts. References the source-class items it builds on.

## Status

| Wave | Doc | State | Last refresh |
|---|---|---|---|
| 1 | 01-schema-current.md | landed | 2026-04-29 |
| 1 | 03-appscript-inventory.md | landed | 2026-04-29 |
| 1 | 04-apicall-callsite-map.md | landed | 2026-04-29 |
| 2 | 05-auth-migration.md | landed | 2026-04-29 |
| 2 | 06-email-migration.md | landed | 2026-04-29 |
| 2 | 07-pdf-migration.md | landed | 2026-04-29 |
| 2 | 10-supabase-due-diligence.md | landed | 2026-04-29 |
| 3 | 02-schema-proposed.md | landed | 2026-04-29 |
| 3 | 08-sheet-mirror-design.md | landed | 2026-04-29 |
| 3 | 09-cutover-and-rollback.md | landed | 2026-04-29 |
