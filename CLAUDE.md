# RAINBOW Scheduling App -- Claude Code Adapter

## Purpose

Retail scheduling platform for Over The Rainbow / Rainbow Jeans (Ontario apparel store). Employees view shifts and submit requests. Admins build schedules, manage requests, publish announcements. Live at <https://rainbow-scheduling.vercel.app>. Stakeholders: JR (dev), Sarvi (scheduling admin, gets all request notifications).

This file is the Claude adapter. It points to canonical memory, defines ownership, and stays thin. Normal work reads and writes `CONTEXT/*`, not this file.

## Canonical Memory

All mutable project memory lives in `CONTEXT/`:

- `CONTEXT/TODO.md` -- Active worklist, Blocked, Verification, Completed
- `CONTEXT/DECISIONS.md` -- Durable product, architecture, and workflow decisions (reverse chronological, with H/M/L confidence)
- `CONTEXT/ARCHITECTURE.md` -- Current structure, components, flows, integrations
- `CONTEXT/LESSONS.md` -- Preferences, repeated pitfalls, workflow corrections
- `CONTEXT/handoffs/` -- One current session handoff
- `CONTEXT/archive/` -- Historical material with learning value (S42 audit)

## Ownership

Non-overlapping. Never duplicate content across files.

- Task state and next step -> TODO.md only
- Rationale and trade-offs -> DECISIONS.md only
- System shape, boundaries, file paths -> ARCHITECTURE.md only
- Preferences, corrections, repeated pitfalls -> LESSONS.md only
- Session continuity -> one handoff in `CONTEXT/handoffs/` only

## Read And Write Rules

### Boot read

At session start, read in this order:

1. Current handoff in `CONTEXT/handoffs/` (if resuming continuity)
2. `CONTEXT/TODO.md`
3. `CONTEXT/DECISIONS.md`
4. `CONTEXT/ARCHITECTURE.md`
5. `CONTEXT/LESSONS.md` (when approach could be shaped by user preferences or past corrections)

### Mid-chat re-read

Re-read a memory file when:

- It was just written by you or the user
- Scope shifts to a different component
- A contradiction between stated intent and memory appears
- You are about to make a decision that depends on current plan, settled direction, or structure

### Write triggers

- TODO.md -- when task status, order, blockers, next steps, or verification state changes
- DECISIONS.md -- when a durable direction is chosen or proven by implementation
- ARCHITECTURE.md -- when structure, boundaries, flows, or integrations change
- LESSONS.md -- when a durable preference, correction, or repeated pitfall emerges
- Handoff -- only on explicit end-of-session or handoff request, after syncing the main files

### End-of-task sync

Before claiming a task done: verify TODO.md reflects new status, DECISIONS.md captures any durable choice made, ARCHITECTURE.md reflects any structural change, LESSONS.md captures any correction worth keeping.

### Do not write

- Do not update this adapter for routine task progress. Update adapters only when routing, ownership rules, or read/write behavior changes.
- Do not write to the Cursor adapter from Claude. That file is ignored during normal work except for adapter repair.

## Module Adapters

None currently. Create a module adapter when:

- A subtree gets its own runtime, service, or deployment surface
- A subtree owns an external integration or cross-boundary contract
- A subtree appears repeatedly in active work, handoffs, or repeated mistakes

Candidate boundaries if that grows: `backend/` (Apps Script), `src/pdf/` + `src/email/` (output layer), or a future payroll-aggregator module.

## Boundaries

### In scope

Scheduling grid, requests (time-off / offer / swap), announcements, PDF + email, auth, admin employee management.

### Out of scope

- Punch clock / timekeeping
- Payroll processing (lives in ADP)
- Inventory, POS, any Counterpoint replacement

### Immutable constraints

Do not change these without explicit JR approval:

- Google Sheets column headers (`docs/schemas/sheets-schema.md`)
- Draft shifts stay private: `publishedShifts` / `publishedEvents` gate employee visibility to LIVE periods only
- Ontario ESA 44-hour overtime threshold surfaces as amber/red visual flag (not publish-blocker)
- OTR 5 brand accent colors immutable: Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378

### Reference material (non-canonical)

These live outside `CONTEXT/*` and hold static or slow-changing material:

- `docs/schemas/sheets-schema.md` -- canonical Sheets column headers
- `docs/schemas/TEMPLATE-schema.md` -- schema doc template
- `docs/DEPLOY-S36-AUTH.md` -- one-time auth deploy notes
- `docs/research/*.md` -- UX research references

### Sibling project

`~/APPS/RAINBOW-PITCH/` -- separate repo, separate Vercel deploy at <https://rainbow-pitch.vercel.app>. Pitch slides and print routes. Reuses a copy of `src/theme.js`. Not governed by this adapter.

## Cross-Harness

Cursor uses its own adapter at `.cursor/rules/context-system.mdc`. Both adapters point to the same `CONTEXT/*`. During normal work this adapter ignores the Cursor one. Only read the Cursor adapter during adapter repair or suspected drift; if one adapter is repaired for drift, repair the other in the same task.
