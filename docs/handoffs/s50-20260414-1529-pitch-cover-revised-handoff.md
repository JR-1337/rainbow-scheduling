# Handoff - RAINBOW Scheduling App

Session 50. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

**Authoritative build plan: `pitchdeck/build-plan.md` — read end-to-end. S50 revisions inline (Slide 1 cover spec + Build Order §2/§2.5).**

## Session Greeting

S50 was triage + replan: a demo-critical white-screen bug surfaced trying to capture the cover video, JR ruled out video entirely, and the cover slide spec was rewritten. Greet with: "Picking up the rebuild after the cover-spec change. Verifying the `7f3021c` deploy is live, then capturing the before/after photos and resuming the RAINBOW-PITCH scaffold." Demo is **today (2026-04-14)** — JR may be in/near the meeting.

## State

- Build (RAINBOW app): PASS, last verified at `7f3021c`
- Branch: main, pushed clean
- Last commit: `d8eb916` S50 plan + persistence sync
- Demo-critical fix `7f3021c`: pushed; Vercel auto-deploy in flight at session-end (verify it actually landed before any capture)
- RAINBOW-PITCH: scaffold STARTED, abandoned mid-step. `~/APPS/RAINBOW-PITCH/` exists from `npm create vite@latest --template react`, but `npm install` was NEVER RUN, no Tailwind, no theme.js copy, no slides. Treat it as a bare vite skeleton.
- Apps Script: v2.20.1, unchanged
- pitchdeck/capture/cover-loop.mjs: graveyard reference. Don't re-run.

## This Session

- Diagnosed `TypeError: Cannot read properties of undefined (reading 'available')` from synthetic employees with empty availability strings; fixed with `ensureFullWeek()` defensive parser at App.jsx data-load layer (commit `7f3021c`)
- Cover slide spec rewritten: video loop DROPPED (Chromebook RAM/Wayland kept disconnecting headed Playwright; JR rejected manual screen recording); replaced with welcome-sweep CSS + wordmark + before/after static screenshots + thesis line
- Scaffolded `~/APPS/RAINBOW-PITCH/` via vite create (no install/configure yet)

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `pitchdeck/build-plan.md` | Yes (S50 cover spec + Build Order §2/§2.5) | THE plan. Read first. |
| 2 | `src/App.jsx` (lines ~1228–1258) | Yes (`7f3021c`) | `ensureFullWeek` pattern; reference if other availability-shape bugs surface |
| 3 | `~/APPS/RAINBOW-PITCH/` | Yes (vite skeleton) | Scaffold to resume: `npm install` → install Tailwind → copy `theme.js` from RAINBOW → `src/slides/Cover.jsx` |
| 4 | `pitchdeck/assets/` | Yes (debug artifacts only) | Will hold `cover-empty.png`, `cover-full.png`, `slide3-*.png`, plus `hero.jpg` (denim wall) |
| 5 | `pitchdeck/pitchDeckResearch4OTR.md` | No | Source for OTR hero photo URLs (download to `~/APPS/RAINBOW-PITCH/public/hero.jpg`) |

## Anti-Patterns (Don't Retry)

- **Headed Node Playwright video recording on Chromebook** (S50) — graduated to `docs/lessons.md`. Browser disconnects from RAM/Wayland strain. Use MCP playwright for static screenshots only.
- **Asking JR to manually screen-record the app** (S50) — explicit "I don't want to make the vid." Photos or in-meeting hands-on demo only.
- **CSS-animated mock cover** (S50) — JR rejected as losing "real proof" feel for Scott. Don't re-propose.
- **Re-asking questions whose answers are explicit in the plan** (since S48) — already in `docs/lessons.md`.
- **Recording user-stated facts to memory without echo-back** (since S48) — already in `docs/lessons.md`.
- **Sarvi-narrated deck framing** (since S48) — superseded. Deck self-narrates.
- **Predicting savings on slide 2** (since S47) — cost-of-doing-nothing only.
- **Stacking Phase 2 savings into current ROI** (since S47).
- **Cheesy / SaaS-hero copy** (since S47).
- **Treating "scheduling time" as just grid-writing** (since S47).

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 (payroll bridge) build | Sarvi discovery answers | Pitch proceeds without — Phase 2 = slide 5 roadmap |
| Static photo capture | `7f3021c` Vercel deploy landing live | Pre-deploy the live app white-screens; capture won't work until deploy lands |

## Key Context

- **Demo TODAY 2026-04-14** — possibly in flight or imminent when next session starts. Check with JR.
- **Sarvi creds (runtime only, NOT to commit):** `sarvi@rainbowjeans.com` / `admin1`. Other admins: `dan@rainbowjeans.com`/`daniel`, `scott@rainbowjeans.com`/`scott` (both off-grid). Synthetic employees: `emp.001@example.com` … `emp.020@example.com`, default passwords `emp-001` … `emp-020` (`passwordChanged=FALSE` → first-login prompt).
- **Cover slide centerpiece is now a before/after still pair**, not a video. Two photos needed: empty next-period grid + same grid post-Auto-Fill. Current pay period has shifts; next period is intentionally empty for this capture. After photo-capture: navigate to next period, GO EDIT, click "Auto-Fill All FT Week 1" then switch to Week 2 tab and click "Auto-Fill All FT Week 2".
- **MCP playwright is fine for screenshots** (one tab, no video overhead). Last session's "lag" was Apps Script latency (7-8s floor on getAllData), unavoidable.
- **Per-slide review gate vs batch-all:** plan default is per-slide. JR was asked but didn't answer before crash — re-ask before slide-building work begins.
- **Build Investment Fee + price wording:** S48-locked, in `pitchdeck/build-plan.md` "Pricing Structure" table. Use exact wording for `/price` route.

## Verify On Start

- [ ] `git log --oneline -3` — confirm `d8eb916` HEAD with `7f3021c` two commits down
- [ ] `curl -sI https://rainbow-scheduling.vercel.app | head -5` — confirm 200 OK and Vercel served the latest deploy (compare `x-vercel-id` or `etag` change)
- [ ] Open the live app in MCP playwright + take a screenshot of the post-login admin grid → confirm renders WITHOUT white-screen (proves `7f3021c` landed)
- [ ] Read `pitchdeck/build-plan.md` end-to-end (Slide 1 spec + Build Order §2/§2.5 are the S50-revised sections)
- [ ] Read newest 2 entries in `docs/lessons.md` and newest 2 in `docs/decisions.md`
- [ ] Confirm with JR: ready to capture before/after photos and resume scaffold (step 2.5 → step 3), or different direction first?
- [ ] Confirm with JR: per-slide review gate or batch-build all 6 then review?
