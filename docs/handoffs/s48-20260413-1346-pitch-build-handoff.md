# Handoff - RAINBOW Scheduling App

Session 48. `CLAUDE.md` is auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md` at session start.

**Approved build plan: `~/.claude/plans/hidden-baking-papert.md` — read end-to-end FIRST.**

## Session Greeting

Demo is **today** (2026-04-14). S47 was an extended planning session ending with an approved build plan. JR's explicit instruction for this session: **double-check the plan + run a final Q&A round with JR before any execution.** Do NOT scaffold on first turn.

Greet JR with: "Pitch build session — re-read the plan and ready to run the final Q&A round before scaffolding. What's first?"

## State

- Build (RAINBOW app): PASS, untouched since S45
- Tests: NONE
- Branch: main (S47 doc/handoff/memory commits expected at session start)
- Apps Script: v2.20.1 deployed
- Last commit: `a2d7713` (S45 demo-ready) + S47 commit (this session's persistence sync)

## This Session

- Approved build plan locked at `~/.claude/plans/hidden-baking-papert.md`
- 3 new decisions appended to top of `docs/decisions.md` (React-on-Vercel format, $497 pricing specifics, slide-2 cost-of-doing-nothing framing)
- 5 new lessons appended to `docs/lessons.md` (last 5 bullets: Phase-2-not-stacked, predicted-savings ban, envelope framing, cheesy-copy ban, labor-respecting pricing)
- 4 memory files added (see MEMORY.md): `project_otr_facts`, `project_pricing_locked`, `feedback_no_cheesy_copy`, `feedback_cost_of_doing_nothing`

## Hot Files

| Priority | File | Why |
|---|---|---|
| 1 | `~/.claude/plans/hidden-baking-papert.md` | THE plan. Pricing structure + slide-2 framing + slide-5 breakdown + build order + format spec + verification + pending inputs |
| 2 | `pitchdeck/pitch-deck-working-context.md` | Operative context. PARTIALLY SUPERSEDED by plan — when they disagree, plan wins (esp. slide-2 numbers + pricing) |
| 3 | `pitchdeck/Competitive Scheduling App Analysis.md` | Slide 5 + tech spec source. Counterpoint-no-native-scheduler citation lines 55–61 |
| 4 | `pitchdeck/rainbow app product reference.md` | Slide 3 + tech spec source |
| 5 | `pitchdeck/competitorAnalysis.md` | Slide 5 SaaS column source |
| 6 | `pitchdeck/pitchDeckResearch4OTR.md` | ESA fines + photo URLs. Use sparingly (1–2 stats/slide max) |
| — | `pitchdeck/rainbow-scheduling-pricing-proposal.md` | LEGACY $349 + $5K draft. Reference only — superseded by plan |

## Anti-Patterns (Don't Retry)

- **Scaffolding on first turn** (since S48) — JR locked entry ritual = re-read plan + final Q&A round + explicit go-ahead before building
- **Reopening pricing structure** (since S47) — $497 + fitting trial + post-trial $2K + $125/hr is locked. Levers documented in decisions.md if Dan flinches in the room
- **Predicting savings on slide 2** (since S47) — lead with cost-of-doing-nothing only ($29,120/yr envelope). Trial measures actual savings. See `feedback_cost_of_doing_nothing.md`
- **Stacking Phase 2 savings into current ROI** (since S47) — Phase 2 = roadmap-only on slide 6
- **Cheesy / SaaS-hero copy** (since S47) — "let's prove it together" was killed explicitly. See `feedback_no_cheesy_copy.md`
- **Treating "scheduling time" as just grid-writing** (since S47) — full envelope: building + management talks + time-off + swaps + sick-call + push + off-hours

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 (payroll bridge) build | Sarvi discovery answers | JR emailing Sarvi. Pitch proceeds without — Phase 2 = roadmap on slide 6 |
| Receipt-box photo (slide 2 visual) | Sarvi to grab one | Optional; fallback = generic graphic |

## Key Context

- Demo TODAY 2026-04-14. Time-critical build window
- Sarvi-confirmed numbers (per `project_otr_facts.md`): **24 staff, 16 hr/wk schedule envelope, $35/hr → $29,120/yr cost-of-doing-nothing**
- Locked pricing (per `project_pricing_locked.md`): **$497/mo + 3-mo fitting trial + post-trial $2K + $125/hr small work + fixed-price feature scoping + bug fixes always included + hosting pass-through**
- Format: React/Vite/Tailwind app at `~/APPS/RAINBOW-PITCH/` (sibling repo, separate Vercel deploy). Reuse `theme.js` from RAINBOW. Price sheet + tech spec = routes within same app, print-CSS, browser-print to PDF
- Counterpoint has NO native scheduler — sourced from NCR's own integration partnerships with TimeForge + 7shifts (killer fact for Scott)
- Audience split: Dan (price sheet), Scott (tech spec), Sarvi narrates, Amy (silent payroll-veto, not in room — protect her ADP control)

## Verify On Start

- [ ] `git log --oneline -3` — confirm S47 commit + `a2d7713` HEAD
- [ ] Read `~/.claude/plans/hidden-baking-papert.md` end-to-end
- [ ] Read top 3 entries (2026-04-13) in `docs/decisions.md`
- [ ] Read last 5 bullets in `docs/lessons.md`
- [ ] Confirm with JR: ready for final Q&A round, or different direction first?
- [ ] Receipt-box photo status from Sarvi (optional input)
