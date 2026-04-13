# Handoff - RAINBOW Scheduling App

Session 51. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start (six new entries this session).

## Session Greeting

S51 scaffolded, built, deployed, and iterated the RAINBOW-PITCH deck. Live at https://rainbow-pitch.vercel.app. JR's final directive: **next session starts slide-by-slide with fresh context, one slide per chat**. Greet with: "Which slide do you want to go deep on first?" Don't try to review the whole deck at once — JR explicitly asked for per-slide focus.

## State

- Build (RAINBOW app): PASS, unchanged since `7f3021c`
- Build (RAINBOW-PITCH): PASS, last deploy `8657ee7`
- Branch: main (both repos). RAINBOW-PITCH has NO git remote (deploys via `vercel --prod --yes` from local repo)
- Last RAINBOW commit: `882d15e` S51 sync
- Last PITCH commit: `8657ee7` Slide 2 card 1 comms tweak
- Apps Script: v2.20.1, unchanged

## This Session

- Scaffolded `~/APPS/RAINBOW-PITCH/` (Vite + React 18 + Tailwind + react-router + Josefin Sans + Inter), deployed to Vercel at https://rainbow-pitch.vercel.app
- Captured `cover-empty.png` + `cover-full.png` + `slide3-admin-wide.png` + `slide3-admin-mobile.png` + `slide3-requests.png` from live app via MCP playwright
- Built and iterated 5-slide deck + `/price` + `/spec` print routes through multiple JR-driven content passes (see decisions.md 2026-04-14 entries)

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Cover.jsx` | Yes | Slide 1. Title-card only. JR review: slide-by-slide review starting here likely. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` | Yes | Slide 2. Three cards (envelope / $170K legal / 476 decisions). |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | Yes | Slide 3. 4 features + screenshots (admin desktop + mobile). |
| 4 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | Yes | Slide 4. 3-col Counterpoint/ADP/SaaS. |
| 5 | `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` | Yes | Slide 5 (was 6). Risk-reversal hero + 4 principles + Phase 2 strip. |
| 6 | `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` + `Spec.jsx` | Yes | Print routes. Dollar figures live here, not on deck. |
| 7 | `~/APPS/RAINBOW-PITCH/src/index.css` | Yes | Full design token system. `.card`, `.display`, `.h2/h3`, `.body`, `.label`, `.stat`, tonal elevation. |
| 8 | `pitchdeck/build-plan.md` | No | Authoritative plan. RE-READ before any slide change. |
| 9 | `pitchdeck/assets/_v2-slide*.png` | Yes | Visual provenance of the redeployed design. |

## Anti-Patterns (Don't Retry)

- **Rainbow-gradient-on-type for "Rainbow" wordmark** (S51) - graduated to `docs/lessons.md`. Use app's Logo component shape (stacked "OVER THE RAINBOW" solid white Josefin Sans) exactly.
- **Fabricating stats to sound concrete** (S51) - graduated to `docs/lessons.md`. Only Sarvi-confirmed, statutory, or pure arithmetic numbers on the deck. `7-10 decisions per person` was invented and caught.
- **Framing Sarvi as single-point-of-failure in pitch copy** (S51) - graduated. Amy distrusts automation; "Sarvi or nothing" reads as turnover warning for family audience.
- **Shallow / generic feature labels** (S51) - graduated. Every slide-3 feature needs a specific operational detail proving authorship.
- **Iterating on deck copy without re-reading the plan** (S51) - graduated. `pitchdeck/build-plan.md` is the contract.
- **Family-relationship assumptions in OTR copy** (S51) - graduated. Amy is Dan's SISTER (payroll). Joel is Dan's BROTHER (co-owner). Scott is ops manager. Sarvi is NOT family.
- **Headed Playwright video recording on Chromebook** (since S50) - in `docs/lessons.md`.
- **Asking JR to manually screen-record** (since S50) - explicit rejection. Use static photos only.
- **CSS-animated mock cover** (since S50) - loses "real proof" feel.
- **Re-asking plan-answered questions** (since S48) - in `docs/lessons.md`.
- **Recording user-stated facts without echo-back** (since S48) - in `docs/lessons.md`.
- **Cheesy / SaaS-hero copy** (since S47) - in `docs/lessons.md`.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 build | Sarvi discovery | Receipt-box → ADP bridge, etc. Post-demo. |
| Schedule data re-seed | JR call: (a) Apps Script JR runs / (b) manual Sheet edit / (c) skip | Needed if JR wants varied auto-fill patterns in cover screenshots. Deferred per JR. |
| JR login to live Rainbow app | Unknown — password rejection | Recovery path: Sarvi (admin1) → Manage Staff → reset JR → default emp-NNN → JR logs in → set new. Demo runs from Sarvi so not blocking 2026-04-14 meeting. |

## Key Context

- **RAINBOW-PITCH is a separate git repo with no remote.** Deploys via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`. Commits stay local.
- **Per-slide review protocol (JR directive):** next session works ONE slide at a time with fresh context. If a slide change affects another, bring the other into scope explicitly — otherwise stay scoped.
- **Playwright MCP permissions:** `mcp__playwright__*` wildcard added to `.claude/settings.json` allow list. Future sessions should not see per-call prompts for playwright tools.
- **Deck is 5 slides now, not 6.** Phase 2 folded into Proposal as "After the trial" continuity strip.
- **Demo date:** 2026-04-14 (today). Sarvi's creds (`sarvi@rainbowjeans.com` / `admin1`) are the demo account. JR login recovery is convenience-only.
- **Schedule data looks uniform in captures** because every synthetic employee has the same full availability string. Auto-fill produces homogeneous patterns. JR flagged this; fix deferred.
- **Fonts loaded from Google Fonts CDN** (Inter + Josefin Sans) via `<link>` in `~/APPS/RAINBOW-PITCH/index.html`. No offline fallback — if meeting WiFi drops and browser cache empty, fonts degrade to system.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW repo confirms `882d15e` HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` confirms `8657ee7` HEAD
- [ ] Open https://rainbow-pitch.vercel.app in browser — cover renders "OVER THE RAINBOW" in white Josefin Sans, no rainbow gradient on type
- [ ] Keyboard arrow through all 5 slides — no console errors, images load
- [ ] Open `/price` and `/spec` routes — white print cards render correctly
- [ ] Re-read `pitchdeck/build-plan.md` end-to-end (locked throughlines + pricing table)
- [ ] Read last 6 entries in `docs/lessons.md` (S51 additions)
- [ ] Confirm with JR: which slide first for per-slide deep review?
