# Handoff - RAINBOW Scheduling App

Session 46. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

Demo is today (2026-04-14). S45 finished demo prep: R1/R2/R3/R4 fixed, v2.20.1 deployed, frontend login polish shipped, post-demo perf roadmap logged (CF Worker proxy path 1, Supabase path 2). Greet JR with a demo-readiness check and ask what he wants to do next — likely demo dry-run, watch for issues, or start post-demo planning.

## State

- Build: PASS (`2576b73`, 2026-04-13)
- Tests: NONE (Playwright MCP verified R2/R3/R4 + measured save perf in browser; no test suite)
- Branch: main (clean, pushed)
- Apps Script: v2.20.1 deployed
- Last commit: `2576b73 S45 v2.20.1: revert v2.20 fast-path; Apps Script overhead dominates`

## This Session

- Fixed R1 (Swap/Offer modal Escape) + R2 (Trash aria-label) + R3 (mobile fill past-date guard) from S44 audit; discovered + fixed R4 (Shift Changes picker Escape) during Playwright verify.
- Perf pass: batchUpdate in batchSaveShifts (big-save 20s → ~7-8s), frontend login polish (preconnect + immutable cache + sweep refactor + minDelay removed). Three backend attempts (v2.19 / v2.19.1 / v2.20) reverted; v2.20.1 is the clean end state.
- Playwright measured Apps Script per-request floor at ~7-8s — documented as the structural bottleneck; CF Worker proxy logged as post-demo path 1.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `docs/todo.md` | Yes | Post-demo perf paths (CF Worker, Supabase) + S45 Done entries |
| 2 | `docs/decisions.md` | Yes | 4 new entries: batchUpdate-only, CF Worker next, sweep overlay, PROJECT-ROUTING retire |
| 3 | `docs/lessons.md` | Yes | 4 new entries: measure before claiming, batchGet trap, Apps Script floor, sweep branch-transition |
| 4 | `backend/Code.gs` | No (v2.20.1 live) | Reference if touching save path |
| 5 | `src/App.jsx` | No | Sweep overlay refactor + autoPopulateWeek past-date guard already in |

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| R1 employee-account browser verify | No non-admin test account ready | Code-mechanically correct; mechanically identical pattern to R4 which IS verified in browser. Low demo risk. |
| CF Worker proxy | Post-demo go-ahead | Cloudflare account + DNS CNAME (or keep default workers.dev URL); ~1 day work; see `docs/todo.md` Post-demo perf |

## Key Context

- **Apps Script per-request floor ~7-8s** — measured via no-op save `{shifts:[], periodDates:[]}`. Don't re-attempt in-stack save optimizations; they all lose to the floor. The structural answer is CF Worker proxy for reads, full migration for writes.
- **v2.19 / v2.19.1 / v2.20 batchGet + fast-path attempts all reverted** — see decisions.md 2026-04-13 for why. Don't re-attempt without reading that entry first.
- **Welcome sweep is a fragment-child-0 overlay across 5 post-login return branches** — if adding a new post-login branch, put `{sweepOverlay}` as the first child or the animation will restart.
- **JR strong preference: no-tradeoff solutions over fast compromises** — see memory `feedback_no_tradeoffs_preferred.md`. When the first fix has flavor of workaround (hardcoded lists, locale assumptions, size heuristics), step back and research the clean answer instead of shipping a second compromise.
- **Demo timing:** 12hr HMAC TTL means Sarvi should log in fresh ~30 min before demo if she logged in the night before.
- **1 cleanup dropped:** `.playwright-mcp/` dir (~2.4M of test artifacts) — JR denied `rm -rf` earlier. Safe to delete manually whenever.

## Verify On Start

- [ ] `git log --oneline -3` — confirm `2576b73` is HEAD
- [ ] Open live app, hard-refresh, confirm Sarvi login works + schedule renders + Escape closes Shift Changes picker (R4)
- [ ] Ask JR what's next: demo dry-run, live demo watch, or post-demo planning
