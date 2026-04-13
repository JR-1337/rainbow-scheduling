# Handoff - RAINBOW Scheduling App

Session 47. `CLAUDE.md` is auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md` at session start. **Pitch-deck context is in `pitchdeck/pitch-deck-working-context.md` — read this before any pitch work.**

## Session Greeting

Demo is tomorrow (2026-04-14). S46 was a context-only session: ingested all five `pitchdeck/` source files into reference memory, updated the product reference doc to current built state + future development roadmap, and proposed a 7-slide deck shape JR liked but parked for revisit. **Next session = formal plan + final clarity round on the 7-slide proposal, then draft deck + price sheet + tech spec sheet.** No code touched this session. App is unchanged from S45 demo-ready state.

Greet JR with: "Picking up the pitch deck — proposed 7-slide plan is in working context, ready to formalize and run a final clarity round before drafting copy."

## State

- Build: PASS (`a2d7713` is HEAD, demo-ready, unchanged from S45)
- Tests: NONE
- Branch: main (clean)
- Apps Script: v2.20.1 deployed
- App: live, demo-ready, no work touched this session
- New files this session (in `pitchdeck/`):
  - `Competitive Scheduling App Analysis.md` — converted from .txt
  - `pitch-deck-working-context.md` — living context doc, primary reading
  - `rainbow app product reference.md` — fully refreshed (drift-corrected, future-dev section added, sections 12-14 consolidated)

## This Session

Context-only. No deck or sheet copy drafted yet — that's S47's job.

- Synthesized 5 pitchdeck files + Sarvi feedback into reference memory (5 new memory files, see MEMORY.md)
- Refreshed `rainbow app product reference.md`: removed stale items (density toggle, rainbow sphere loader, chunked-save lang); added shipped post-authoring items (welcome sweep, admin toolbar collapse to 4-button + avatar, Alerts bottom sheet, `passwordChanged` flag, guardedMutation, My Requests rename, CURRENT_PERIOD_INDEX, token-derived caller); merged duplicate sections 12/13/14; added new "Planned / future development" section covering Phase 2 payroll bridge (CSV-not-API), consecutive-days warning, meetings+PK shift types, welcome email, concurrent-admin edit, pro sender email, CF Worker perf path
- Locked 3 decisions in `docs/decisions.md`: pricing shape (simple flat monthly, no formalization fee, cost out of deck), tech spec sheet for Scott (8 sections + optional hardening tier), deck length (7 slides provisional)
- Proposed 7-slide deck shape (cover / pain / what / business case / why alternatives fail / Phase 2 / proposal+handoff). JR liked, wants formal plan + clarity round before drafting

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `pitchdeck/pitch-deck-working-context.md` | **Primary deck-build doc.** Audience, framing, 7-slide proposed plan, settled decisions, JR's prior thinking snapshot, all open questions |
| 2 | `pitchdeck/rainbow app product reference.md` | Source-of-truth for what's built today + Phase 2 roadmap. Use when drafting deck slides 3 + 6 |
| 3 | `pitchdeck/Competitive Scheduling App Analysis.md` | ADP/NCR teardown. Source for slide 5 + tech spec sheet integration section |
| 4 | `pitchdeck/competitorAnalysis.md` | 7shifts/WIW/Deputy teardown. Source for slide 5 SaaS column + price sheet alternatives table |
| 5 | `pitchdeck/pitchDeckResearch4OTR.md` | Sourced stats (Mercer 25.9%, Gap +7%, ESA fines, OTR photo URLs). Source for slide 4 + photo selection |
| 6 | `pitchdeck/rainbow-scheduling-pricing-proposal.md` | Prior price-sheet attempt with $349 anchor + 90-day out clause. Light reference for new price sheet |
| 7 | `pitchdeck/pitch deck context.md` | Raw Sarvi feedback (already synthesized; reference if double-checking framing) |

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Phase 2 (payroll bridge) build | Discovery answers from Sarvi | Counterpoint export format, ADP Workforce Now upload schema, employee ID consistency, bonus formula confirmation. JR is emailing Sarvi. **Pitch can proceed without these — Phase 2 is shown as roadmap only, not promised.** |

## Key Context

- **Demo timing:** 2026-04-14. Pitch must be ready for Sarvi. App itself is demo-ready (S45 finished hardening).
- **Sarvi's revised framing is load-bearing:** Today = Sarvi's tool. Phase 2 = future development. Never pitch Phase 2 as Phase 1, never pitch Rainbow as removing Amy from payroll.
- **Audience split:** Dan (owner, in room, price-first, slow) gets the price sheet at end. Scott (ops mgr, in room, technical) gets the tech spec sheet at end. Sarvi narrates the deck. Amy (not in room, payroll veto) is the silent third stakeholder — every framing decision must protect her control of ADP.
- **Pricing decision (locked, see decisions.md 2026-04-13):** Simple flat monthly. No tiers. $5K formalization fee absorbed. No cost in pitch — sheet handoff at end. Specific number TBD when ROI math forces an anchor during deck drafting.
- **JR's prior pitch-thinking snapshot is in working-context doc** — trial-based pricing (3 months @ $349, included tweaks, $100/hr post-trial, phased rollout). Worth weighing for merit, NOT a rule. Strongest ideas in there: trial framing as risk reversal + phased rollout + tone-of-honesty.
- **Data privacy → tech spec for Scott**, not in deck (frees a slide; settled).
- **Open questions for next session clarity round:**
  1. 7 vs 8 slides — does Scott's "ADP/Counterpoint already have scheduling" objection warrant splitting slide 5 (one slide for ADP/NCR, one for SaaS Deputy/7shifts/WIW)?
  2. JR's trial-pricing structure (3-mo trial framing) — adopt as the deck's "proposal" slide framing, or use a different shape?
  3. Specific monthly $ number for the price sheet — calibrate during deck drafting based on ROI claim weight
  4. Hero photo final pick — blogTO Hector Vasquez denim wall is the strongest candidate; alternates in research doc §1
  5. Should slide 2 ("the cost of how scheduling works today") quantify in dollars or stay qualitative? Family is price-first so dollar pain may help, but JR's tone-of-honesty preference may push qualitative
- **5 memory files added this session** (see MEMORY.md): reference_pitch_deck_research, reference_competitive_analysis, reference_competitor_analysis_saas, reference_pricing_proposal_draft, project_carman_family_profile. Plus updated project_payroll_aggregator with concrete payroll-workflow numbers.

## Anti-Patterns

- **Don't pitch Phase 2 as a deliverable.** Always "future development / roadmap." Build only after Sarvi confirms discovery answers.
- **Don't break Sarvi's framing.** She's positioned this as her personal tool. Reframing it as "the system that takes payroll over" kills Amy's buy-in.
- **Don't drown the deck in stats.** 1-2 anchor stats per slide max. The research file has hundreds; using more than ~10 across the whole deck makes it a research dump.
- **Don't add data-privacy content back to the deck.** It moved to Scott's spec sheet for a reason.
- **Don't reopen the pricing-shape decision** unless the trial-pricing draft forces it. Settled is settled (see decisions.md 2026-04-13).

## Verify On Start

- [ ] `git log --oneline -3` — confirm `a2d7713` is HEAD (no code changes since S45)
- [ ] Read `pitchdeck/pitch-deck-working-context.md` end-to-end before any pitch work — it's the operative source
- [ ] Confirm with JR: ready to formalize the 7-slide plan + run the clarity round, or different direction first?
- [ ] If proceeding with deck draft: confirm the 5 open questions above (split competitor slide y/n, trial-pricing framing y/n, $ anchor, hero photo, dollar-or-qualitative pain)

## Stopping Point

Mid-context-build, pre-drafting. Next session resumes by reading working-context doc, confirming the proposal shape with JR, running the open-question clarity round, then drafting deck slide-by-slide → price sheet → tech spec sheet (in that order, per the build-order decision).
