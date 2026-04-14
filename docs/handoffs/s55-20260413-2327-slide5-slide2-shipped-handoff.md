# Handoff - RAINBOW Scheduling App

Session 55. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S55 shipped Slide 5 full rework + Slide 4 Col 2 headline off-ESA + Slide 2 fourth "safety net" card (2x2 grid). Per JR's handoff arg, S56 opens the `/spec` print route for Scott. Meeting moved from Tue 2026-04-14 to **Wed 2026-04-15 13:00** — one extra day of prep recovered. Greet with: "Opening `/spec` (Scott's tech-spec leave-behind) for review — want me to read its current state first or do you already know what you want changed?"

## State

- Build (RAINBOW app): PASS, HEAD `81efa5d` (unchanged since S54 wrap)
- Build (RAINBOW-PITCH): PASS, last deploy `4c7eb93` (local-only, no git remote)
- Branch: main (both repos)
- Pitch live: https://rainbow-pitch.vercel.app
- Apps Script: v2.20.1, unchanged
- Demo: **Wed 2026-04-15 13:00** (moved from 2026-04-14 — one extra day)

## This Session

- **Slide 4 Col 2 (ADP):** headline swapped off ESA → "Payroll-first. Scheduling bolted on. Support outsourced." Bullets reordered: pricing → support-is-broken (fleshed out from old bullet 3) → ESA demoted to single mention per slide. Per-slide ESA cap now holds on Slide 4.
- **Slide 4 layout:** subheader ("Every alternative either doesn't schedule…") moved from below columns to under h2 where it belongs; italic footer centered.
- **Slide 5 (Proposal): full rework.**
  - Header: `Three months to <accent>change</accent> your mind.`
  - Sub: "Only pay for the months you used. Rainbow earns your trust by making the app fit OTR's current infrastructure."
  - Card 2 replaced: "Sarvi's workflow, not a template" / "The whole app is modeled on how she already schedules, developed to order. No retraining. Agile feature addition or expansion as needed." (replaces the "measurement window" card that was just card-1 padding)
  - Continuity strip relabeled "Already in planning" (not "discussed"). Body: ADP payroll bridge, native punch clock (could replace Counterpoint Time-Card), promo payment tracking (no more promo box), payroll+tax integration. Each scoped fixed-price. Meetings+PK and 5-day rule DROPPED — those ship with v1 app, not Phase 2.
  - Bottom: buttons restructured into 2-column layout, each sentence stacked directly above its button. Was flex-between with buttons visually orphaned from the text.
  - Fixed `\u2192` literal escape bug in continuity strip JSX.
- **Slide 2 (Cost): fourth card added — "The safety net."** Grid changed `md:grid-cols-3` → `md:grid-cols-2` for 2x2 layout. Card body: coverage gaps, forgotten time-off, target headcount undershoot — mistakes caught while schedule is still a draft. Lands without ESA or fines; frames as recurring operational cost (lost sales / cover OT / payroll disputes). Addresses ESA-over-reliance concern by diluting the Guardrails card rather than replacing it.
- **New memory saved:** `project_promo_meaning.md` — at OTR, "promo" = commission payments to staff for hitting sales targets (tracked in a physical receipt box today). NOT sale-period staffing. I got this wrong initially, JR corrected, saved so future sessions don't repeat.

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `pitchdeck/` print routes (rendered at `/price` + `/spec` via RAINBOW-PITCH) | No | **S56 target.** `/spec` first per JR. Read source before drafting. Source paths in `~/APPS/RAINBOW-PITCH/src/routes/` or `src/pages/`. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` | Yes | Reference the Slide 5 buttons pointing to `/price` + `/spec` — those are what S56/57 review. |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | No (still stale) | Slide 3 body STILL cites "11-hour rest" — ESA is 8hr. Full-card review deferred by JR. |
| 4 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | Yes | Col 3 still pending Gemini findings; "Australian labour awards" still reads as typo. |
| 5 | `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` | Yes | Reference for 4-card 2x2 pattern if Slide 5 needs restructuring. |
| 6 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. RE-READ before any slide change. |

## Anti-Patterns (Don't Retry)

- **Proposing copy and not shipping until a second sign-off** (S53, S54) — when JR directs "change X to Y" or picks an option, edit + build + deploy in one move. Don't wait for "ship it."
- **Fabricated statutory claims on the deck** (S53) — in `docs/lessons.md`. Slide 3 body still has the outstanding 11hr→8hr correction.
- **Over-leading with Ontario ESA on every slide/comparison** (S54) — feedback memory `feedback_esa_not_a_selling_point.md`. Cap at one mention per slide, never headline. S55 shipped this for Slide 4 Col 2; Slide 2 now has 4 cards (ESA is one of four, not the only compliance argument). Monitor on any new copy.
- **Mis-interpreting OTR domain terms** (S55) — "promo" = commissions, not sale-period staffing. Memory saved. Any OTR-vocabulary word that could have a retail-general meaning AND an OTR-specific meaning: ask, don't assume.
- **Arbitrary derived numbers as persuasion** (S53) — in `docs/lessons.md`.
- **Overclaiming app verbs ("enforced" when the app only flags)** (S53) — in `docs/lessons.md`.
- **Unverifiable deck copy** (S53) — in `docs/lessons.md`.
- **Single-site fix when a parser is shared across paths** (S52) — in `docs/lessons.md`.
- **Family-relationship assumptions in OTR copy** (S51) — in `docs/lessons.md`. Amy=sister(payroll), Joel=brother(co-owner), Scott=ops, Sarvi=NOT family.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Slide 3 body 11hr→8hr + whole-card review | JR wants to review whole card, not just the fix | MUST land before demo if Slide 3 stays. Ontario ESA = 8hr rest (ontario.ca). |
| Slide 4 Col 3 rewrite + "labour awards" rephrase | JR's Gemini research on actual Ontario-retail-SMB scheduling app shortlist | Real candidates likely Homebase, Sling, Connecteam, TimeForge. Rephrase Deputy bullet from "Australian labour awards" → "Australian labour law" at the same time. |
| Apps Script v2.16+ manual deploy | JR paste → Apps Script → Deploy | `docs/todo.md` Done section flags live is v2.14; v2.16 fixes `callerEmail` bug; v2.20.1 shipped but live status unclear. Re-verify before demo. |
| Phase 2 build | Sarvi discovery | Post-demo. |
| Demo outcome capture | 2026-04-15 meeting | Log in decisions.md after demo. |

## Key Context

- **Pre-demo runway is 2 days** (Mon 2026-04-13 evening + Tue 2026-04-14 full day + Wed 2026-04-15 morning). Demo at 13:00 Wednesday.
- **S56 target per JR: `/spec` (Scott's tech-spec leave-behind).** Then `/price` (Dan's price sheet). Then Slide 3 full-card review. Slide 4 Col 3 parks until Gemini findings land.
- **RAINBOW-PITCH has no git remote.** All commits local-only. Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **Deck assembly order is now:** Slide 1 (Cover) → 2 (Cost, 4 cards 2x2) → 3 (Today, UNREVIEWED in deck-review pass) → 4 (Alternatives, Col 3 still speculative) → 5 (Proposal, fully reworked this session) → `/price` + `/spec` routes accessible from Slide 5 buttons.
- **OTR "promo"** = commissions for sales targets, tracked in a physical receipt box Sarvi/Amy has to reconcile manually. This is what the "promo payment tracking" Phase 2 item on Slide 5 replaces.
- **Ontario ESA verified figures** (do NOT re-guess): 8hr rest between shifts (NOT 11), 44hr/wk OT threshold, 3-hour rule, 48hr weekly max. Sources in S53 handoff.
- **Meeting move flagged by JR mid-handoff** — moved from Tue to Wed. Memory updated (`project_tuesday_demo.md` — filename retained, content now 2026-04-15); docs/todo.md updated; this handoff captures the new date.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app confirms S55 handoff commit at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` confirms `4c7eb93` at HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app — verify Slide 2 has 4 cards in 2x2, Slide 4 Col 2 headline is "Payroll-first…", Slide 5 header reads "Three months to change your mind." with accent on "change", continuity strip shows 4 items, buttons stack with their sentences
- [ ] Identify `/spec` route source file in `~/APPS/RAINBOW-PITCH/` before any drafting (likely `src/routes/Spec.jsx` or `src/pages/Spec.jsx`)
- [ ] Confirm with JR: is `/spec` still the S56 target, or has the extra-day buffer changed priorities?
