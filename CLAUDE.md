# RAINBOW Scheduling App -- Claude Code Adapter

<!-- LOOP_ACCESS_RULES_V1 -->
<!-- ADAPTER_SCHEMA_V1 -->

## Purpose

Retail scheduling platform for Over The Rainbow / Rainbow Jeans (Ontario apparel store). Employees view shifts and submit requests. Admins build schedules, manage requests, publish announcements. Live at <https://rainbow-scheduling.vercel.app>. Stakeholders: JR (dev), Sarvi (scheduling admin, gets all request notifications).

Thin routing layer for Claude Code. Canonical mutable memory lives in `CONTEXT/*`. This file is intentionally stable; update only when routing, ownership, or read/write behavior changes.

## Canonical Memory

All durable project state lives under `CONTEXT/`:
- `CONTEXT/TODO.md` -- current worklist, blockers, verification, recent completions
- `CONTEXT/DECISIONS.md` -- durable decisions with confidence and rationale
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, pitfalls, corrections
- `CONTEXT/handoffs/*.md` -- last 3 handoffs retained; older move to `CONTEXT/archive/handoff-archive/` (see `~/context-system/HANDOFF.md` Step 6)
- `CONTEXT/archive/` -- historical material with learning value (e.g., S42 audit)

Cross-project lessons live in `~/.context-system/CONTEXT/LESSONS.md` and are read only when `[GLOBAL]`-scoped context is relevant.

Optional loop data plane: `DATA/catalog.md` lists fixtures under `DATA/`. Read `DATA/*` only for LOOP work, `DATA_CAPTURE_BOOTSTRAP.md`, or explicit `CONTEXT/TODO`.

## Ownership

Non-overlapping by design. If you catch yourself writing rationale in TODO, stop and move it to DECISIONS. If you catch yourself writing task state in ARCHITECTURE, stop and move it to TODO. If you catch yourself writing preferences in DECISIONS, stop and move them to LESSONS.

## Read And Write Rules

At session start: read `TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`. Read `LESSONS.md` when preferences may affect approach. Read the current handoff only when resuming continuity.

Re-read any memory file when it changed, when scope shifts, when a contradiction surfaces, or before edits that depend on current plan/decisions/architecture.

Write `CONTEXT/*` during normal work. Update `TODO.md` on status change. Update `DECISIONS.md` on durable direction change. Update `ARCHITECTURE.md` on structural change. Update `LESSONS.md` on durable preference or repeated pitfall. Write handoffs only on end-of-session request, atomically (`.tmp` then `mv`).

Confidence format on DECISIONS and inferred LESSONS entries:
`Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD` or `Confidence: M` or `Confidence: L -- <what would verify>`.

## Module Adapters

None currently. Create `{module-name}/CLAUDE.md` only when the subtree has distinct runtime, conventions, or an external integration. Keep module adapters under 100 lines. Module adapters own local purpose, key files, conventions, boundaries -- nothing project-wide.

Candidate boundaries if growth warrants: `backend/` (Apps Script), `src/pdf/` + `src/email/` (output layer), future payroll-aggregator module.

## Boundaries

In scope: scheduling grid, requests (time-off / offer / swap), announcements, PDF + email, auth, admin employee management.

Out of scope:
- Punch clock / timekeeping
- Payroll processing (lives in ADP)
- Inventory, POS, any Counterpoint replacement

## Immutable Constraints

Do not change these without explicit JR approval:
- Google Sheets column headers (`docs/schemas/sheets-schema.md`)
- Draft shifts stay private: `publishedShifts` / `publishedEvents` gate employee visibility to LIVE periods only
- Ontario ESA 44-hour overtime threshold surfaces as amber/red visual flag (not publish-blocker)
- OTR 5 brand accent colors immutable: Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378

## Reference Material (non-canonical)

Live outside `CONTEXT/*`; static or slow-changing:
- `docs/schemas/sheets-schema.md` -- canonical Sheets column headers
- `docs/schemas/TEMPLATE-schema.md` -- schema doc template
- `docs/DEPLOY-S36-AUTH.md` -- one-time auth deploy notes
- `docs/research/*.md` -- UX research references

## Sibling Project

`~/APPS/RAINBOW-PITCH/` -- separate repo, separate Vercel deploy at <https://rainbow-pitch.vercel.app>. Pitch slides and print routes. Reuses a copy of `src/theme.js`. Not governed by this adapter.

## Cross-Harness

Cursor uses `.cursor/rules/context-system.mdc`. Kimi uses `KIMI.md`. All three adapters point to the same `CONTEXT/*`. During normal work this adapter ignores the siblings. Only read a sibling adapter during adapter repair or suspected drift; if one adapter is repaired, repair all three in the same task.

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Do not hand-edit `program.md` during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Do not hand-edit `results.tsv`, `jobs/*`, or task files during experiments.
