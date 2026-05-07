# s066 -- 2026-05-06 -- saveEmployee v2.32.5 admin1 tier persistence + frontend strip fix

caesura. baryogenesis.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Backend v2.32.5 is paste-deployed and `d6010f4` is on `main`; production still owes Vercel pickup plus admin1/admin2 tier smokes so reload matches the Sheet.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`.
- **Git:** `main` at `d6010f4` (`saveEmployee v2.32.5: admin1 tier writes...`), clean for tracked sources; handoff commit pending Step 7. Untracked `backend/pdf-probe.gs` (Phase 0 probe) -- do not commit with handoff unless JR asks.
- **Active focus:** confirm hosted frontend matches `d6010f4` and run tier smokes from `CONTEXT/TODO.md` Active top item.
- **Working assumption:** co-owner row fixes in the Sheet require matching `isOwner` in the Employees tab **and** re-login so JWT matches; client strip fix is still required for every admin1 who is not an `isOwner` row in the Sheet.

## This Session

**Shipped-but-unverified:**
- Tier persistence stack: `backend/Code.gs` v2.32.5 + `src/App.jsx` + `src/modals/EmployeeFormModal.jsx` in `d6010f4`. JR confirmed Apps Script paste-deploy labeled v2.32.5. Owe: Vercel deploy parity + non-owner admin1 edit -> reload persists; owner row blocked; admin2 grey toggles + tooltip; self-tier blocked.

**External ops:**
- JR paste-deploy Google Apps Script `backend/Code.gs` header v2.32.5 (explicit `saveEmployee` matrix replacing v2.32.1 owner-only silent strip server-side pattern).

**Audit:** clean (1 style soft-warn: `CONTEXT/LESSONS.md` has orphan `## Workflow and process` divider between entries; fix on next LESSONS touch).

**Memory writes:** `CONTEXT/TODO.md` (Completed + Verification lines already carried); `CONTEXT/DECISIONS.md` (2026-05-06 saveEmployee matrix); `CONTEXT/ARCHITECTURE.md` (flows + Code.gs line count + v2.32.5); `CONTEXT/LESSONS.md` (+1 entry tier payload strip); `lessons_pre=23 lessons_post=24`, no cadence archive trigger.

**Prune:** Anti-Patterns: 0 dropped, 0 graduated, 4 kept from s065, 2 net-new s066; Hot Files: 0 dropped, 3 added s066, 4 kept (pitch deck triad + `DECISIONS` from s065 carry, compressed).

**Graduation audit:** 0 finalized -> targets, 1 deferred, 0 dropped (JR deferred `Follow approved plan verbatim` `Graduation: due 2026-05-13`).

## Hot Files

- `backend/Code.gs` + `src/App.jsx` + `src/modals/EmployeeFormModal.jsx` -- tier save authority: server gates v2.32.5; client strip uses same admin1 predicate as backend; admin2 UX disables Staff/Admin/Admin2 toggles. Touch on any employee-privilege follow-on. (origin: s066)
- `~/APPS/RAINBOW-PITCH/src/slides/AskRainbow.jsx` + `Proposal.jsx` + `Alternatives.jsx` -- pitch chatbot + deferred VC-flaggedProposal items; only if JR reopens deck work. (origin: s064/s065)
- `CONTEXT/DECISIONS.md` -- archive cycle may trigger in 1-2 sessions when next entry pushes past 25k ceiling. (re-hot s064)

## Anti-Patterns (Don't Retry)

- **Don't spawn ad-hoc triage subagents when an installed skill already defines the workflow.** Use the skill stage. (origin: s065)
- **Don't override JR's "good enough" calibration with model-driven completionism on deferred deck items.** (origin: s064)
- **Don't pivot a deck argument's spine without verifying the load-bearing factual claim first.** (origin: s063)
- **Don't write handoffs that narrate process instead of orienting the next session.** (origin: s063)
- **Don't fix tier persistence by Sheet `isOwner` edits alone while `App.jsx` still strips `isAdmin`/`adminTier` for every non-owner.** Silent UI success + Sheet skip still hits every admin1 without owner row. (origin: s066)
- **Don't treat optimistic UI as proof of persistence** before the `saveEmployee` payload still includes tier fields for admin1 callers. (origin: s066)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked (unchanged this session: pitch Proposal micro-fixes, H3 migration, iPad print, phone smokes, payroll path, etc.).

## Key Context

- **Admin1 tier** means `isOwner` or (`isAdmin` and `adminTier` neq `admin2`). **Admin2** cannot edit tiers in UI (disabled + tooltip) and backend rejects tier deltas for non-admin1 callers.
- **Owner rows** (`isOwner` on target): no in-app tier, `isOwner`, or deactivate-down edits. **Self:** no `isAdmin` / `adminTier` self edits.
- Frontend live URL: `https://rainbow-scheduling.vercel.app` -- confirm bundle includes `d6010f4`.
- EmailModal v2 PDF path + Phase 4 smoke still listed in `CONTEXT/TODO.md` Active (separate thread from tier save).

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `caesura. baryogenesis.`; top Active item is tier smoke + optional `pdf-probe` deletion.
2. `cd ~/APPS/RAINBOW\ Scheduling\ APP && git log --oneline -5` -- expect `d6010f4` then handoff commit after Step 7.
3. `git status -s` -- expect only intentional CONTEXT edits; `backend/pdf-probe.gs` stays untracked unless JR chooses to track or delete.
4. If debugging tier saves: Network tab `saveEmployee` payload must include `isAdmin` / `adminTier` when caller is admin1 tier; Sheet row must update on success.

## Next Step Prompt

Default (a) -> (b) -> (c):

- (a) **Shipped-but-unverified:** confirm Vercel deployed `d6010f4`; smoke non-owner admin1 tier change -> reload; owner row mutation -> error; admin2 grey toggles; self-tier blocked.
- (b) **External:** Sarvi feedback from live app; long-press phone-smoke; pitch deck items stay deferred unless JR flags.
- (c) **TODO:** EmailModal v2 Phase 4 PDF send smoke + delete `pdf-probe` artifacts when convenient.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical -- shims rarely need repair.
