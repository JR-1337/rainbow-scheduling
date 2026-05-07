# s067 -- 2026-05-06 -- tier matrix smokes verified + LESSONS graduation to AGENTS

grisaille. melisma.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Tier-save verification is closed at JR; next load-bearing ops are EmailModal Phase 4 PDF send smoke and removing `pdf-probe` artifacts.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`.
- **Git:** `main` at `b4e46f8` (s066 handoff) until this run's Step 7 commit; only untracked `backend/pdf-probe.gs` besides handoff residue.
- **Active focus:** pick up EmailModal v2 PDF Phase 4 from `CONTEXT/TODO.md` Active; optional prod bundle parity check for `d6010f4`.

## This Session

**Shipped-but-unverified:** none (verification-only plus docs).

**External ops:** Cursor plan `sarvi_admin_tier_persistence_a795dbd4` -- `verify-matrix` marked completed after JR confirmed smokes.

**Audit:** clean (pre-existing orphan `## Workflow and process` in `LESSONS.md` soft-warn unchanged).

**Memory writes:** `CONTEXT/TODO.md` (new anchor + Active shrink + Verification line); `CONTEXT/LESSONS.md` (Follow approved plan -> `Graduated: 2026-05-06 to AGENTS.md`); `AGENTS.md` (**Approved plans** under Read And Write Rules); `lessons_pre=24 lessons_post=24`, no cadence trigger.

**Prune:** Anti-Patterns: 0 dropped, 0 graduated, 6 kept from s066, 0 net-new; Hot Files: 0 dropped, 0 added, 3 kept (compressed list unchanged).

**Graduation audit:** 1 finalized -> `AGENTS.md`, 0 deferred, 0 dropped (`Follow approved plan verbatim`).

Decanting: clean

## Hot Files

- `backend/Code.gs` + `src/App.jsx` + `src/modals/EmployeeFormModal.jsx` -- tier authority stack at v2.32.5 / `d6010f4`. (origin: s066)
- `~/APPS/RAINBOW-PITCH/src/slides/AskRainbow.jsx` + `Proposal.jsx` + `Alternatives.jsx` -- deck surfaces if JR reopens pitch work. (origin: s064/s065)
- `CONTEXT/DECISIONS.md` -- approaching archive cycle when next entry crosses 25k chars. (re-hot s064)

## Anti-Patterns (Don't Retry)

- **Don't spawn ad-hoc triage subagents when an installed skill already defines the workflow.** (origin: s065)
- **Don't override JR's "good enough" calibration with model-driven completionism on deferred deck items.** (origin: s064)
- **Don't pivot a deck argument's spine without verifying the load-bearing factual claim first.** (origin: s063)
- **Don't write handoffs that narrate process instead of orienting the next session.** (origin: s063)
- **Don't fix tier persistence by Sheet `isOwner` edits alone while `App.jsx` still strips `isAdmin`/`adminTier` for every non-owner.** (origin: s066)
- **Don't treat optimistic UI as proof of persistence** before `saveEmployee` payload still carries tier fields for admin1 callers. (origin: s066)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked.

## Key Context

- **Admin1 tier** = `isOwner` or (`isAdmin` and `adminTier` neq `admin2`). Owner rows immutable for privilege and deactivate-down in-app; no self tier edits.
- **Root adapter** now states: after plan sign-off, re-read plan instead of re-asking JR (`AGENTS.md` Read And Write Rules).

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `grisaille. melisma.`; tier line is verified; PDF email smoke is next.
2. `git log --oneline -3` -- expect s067 handoff commit after this run.
3. `git status -s` -- `backend/pdf-probe.gs` untracked unless JR deleted it.

## Next Step Prompt

Default (a) -> (b) -> (c):

- (a) **EmailModal v2 Phase 4:** group send + individual send + Test Guy cleanup per `CONTEXT/TODO.md` second Active bullet; delete `pdf-probe` when done.
- (b) **External:** long-press phone-smoke; Sarvi app feedback.
- (c) **Optional:** confirm Vercel serving `d6010f4` if bundle parity ever in doubt.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical.
