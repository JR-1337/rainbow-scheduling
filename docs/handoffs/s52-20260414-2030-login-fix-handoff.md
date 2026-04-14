# Handoff - RAINBOW Scheduling App

Session 52. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start (three new entries this session, eight more from S51).

## Session Greeting

S52 was a single demo-eve fire: JR couldn't log in to the live app on his phone. Diagnosed and shipped a one-line-class fix (`ff54544`). Verified live as Sarvi/admin1. JR's plan was already locked from S51: **next session starts slide-by-slide with fresh context, one slide per chat**. Greet with: "Which slide do you want to go deep on first?"

## State

- Build (RAINBOW app): PASS, last verified `ff54544` (post-fix)
- Build (RAINBOW-PITCH): PASS, last deploy `8657ee7` (unchanged)
- Branch: main (both repos). RAINBOW-PITCH has NO git remote.
- Last RAINBOW commit: `ff54544` S52 login fix
- Last PITCH commit: `8657ee7` Slide 2 card 1 comms tweak (unchanged)
- Apps Script: v2.20.1, unchanged. Confirmed healthy via direct curl + browser-console fetch.

## This Session

- Diagnosed login spinner-no-app symptom: NOT a backend issue (curl + browser fetch both returned valid 531-byte JSON). Real cause was `App.jsx:1408` parent `handleLogin` calling `JSON.parse('')` on Sarvi's empty-string availability field, throwing before `setCurrentUser` could fire.
- Shipped fix `ff54544`: defensive parse with try/catch + empty-string short-circuit. Same root cause class as S50 white-screen (`ensureFullWeek`); login path was uncovered.
- Live verified via fresh playwright login as Sarvi/admin1 — landed on schedule grid with zero console errors.

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/*` | No (S51) | Per-slide deep review starts here. `Cover.jsx`, `Cost.jsx`, `Today.jsx`, `Alternatives.jsx`, `Proposal.jsx`. |
| 2 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. RE-READ before any slide change. |
| 3 | `src/App.jsx:1408-1424` | Yes (`ff54544`) | New defensive parse pattern; reference if any other login-flow regressions surface. |
| 4 | `pitchdeck/assets/_v2-slide*.png` | No (S51) | Visual provenance of the deployed deck. |

## Anti-Patterns (Don't Retry)

- **Speculating about backend cause when frontend is producing the visible error** (S52) - graduated to `docs/lessons.md`. Network diagnostics first (curl + browser-console fetch), then narrow.
- **Single-site fix when a parser is shared across paths** (S52) - graduated. Sweep ALL parse sites for a Sheet field after adding the first defensive guard.
- **Rainbow-gradient-on-type for "Rainbow" wordmark** (S51) - in `docs/lessons.md`.
- **Fabricating stats** (S51) - in `docs/lessons.md`. Only Sarvi-confirmed, statutory, or pure arithmetic numbers on the deck.
- **Single-point-of-failure framing for Sarvi** (S51) - in `docs/lessons.md`.
- **Shallow / generic feature labels** (S51) - in `docs/lessons.md`.
- **Iterating on deck copy without re-reading the plan** (S51) - in `docs/lessons.md`.
- **Family-relationship assumptions in OTR copy** (S51) - in `docs/lessons.md`. Amy=sister(payroll), Joel=brother(co-owner), Scott=ops, Sarvi=NOT family.
- **Headed Playwright video recording on Chromebook** (S50) - in `docs/lessons.md`.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 build | Sarvi discovery | Receipt-box → ADP bridge, etc. Post-demo. |
| Schedule data re-seed | JR call: (a) Apps Script JR runs / (b) manual Sheet edit / (c) skip | Needed if JR wants varied auto-fill patterns in cover screenshots. Deferred per JR S51. |

## Key Context

- **JR is on remote control** as of S52 end. Demo is today (2026-04-14). Once Sarvi/admin1 works on his phone after hard-refresh, the login blocker is fully closed.
- **Triple-fire on login** (separate, low priority): playwright network panel showed the login GET firing 3x for a single click. Each call returned valid JSON, no functional impact, just API quota. Likely the click handler being invoked multiple times during the throw → re-render → click loop. Worth a 10-min look in a future non-demo session — the S52 fix masks it because every call now succeeds.
- **Per-slide review protocol (JR directive from S51):** next session works ONE slide at a time with fresh context. If a slide change affects another, bring the other into scope explicitly.
- **Playwright MCP permissions:** `mcp__playwright__*` wildcard added to `.claude/settings.json` allow list (S51). Future sessions don't see per-call prompts for playwright tools.
- **Pitch deck is 5 slides at https://rainbow-pitch.vercel.app** (Cover / Cost / Today / Alternatives / Proposal). Phase 2 folded into Proposal continuity strip. No pricing on deck. `/price` and `/spec` print routes carry numbers + tech detail.

## Verify On Start

- [ ] `git log --oneline -3` confirms `ff54544` HEAD
- [ ] Hard-refresh https://rainbow-scheduling.vercel.app on phone, log in as Sarvi/admin1, confirm schedule grid loads
- [ ] If JR's own login (`johnrichmond007@gmail.com`) still fails: same root cause was masking it. Try fresh now; if still failing, his row's `availability` may have a different malformed value worth inspecting in the Sheet.
- [ ] Read newest 3 entries in `docs/lessons.md` (S52 additions)
- [ ] Read S52 entry at top of `docs/decisions.md`
- [ ] Confirm with JR: which deck slide first for per-slide deep review?
