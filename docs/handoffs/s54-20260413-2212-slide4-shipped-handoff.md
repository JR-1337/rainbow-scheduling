# Handoff - RAINBOW Scheduling App

Session 54. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S54 skipped Slide 3 on JR's call, shipped Slide 4 (Alternatives) full review, refined Slide 3 header accent. Per /handoff arg "slide 5 on the other side," next session opens Slide 5 (Proposal) for per-slide review. Greet with: "Opening Slide 5 (Proposal) for per-slide review — what's the first thing you want to interrogate?"

## State

- Build (RAINBOW app): PASS, HEAD unchanged since S53 (`113db55`) until S54 handoff commit
- Build (RAINBOW-PITCH): PASS, last deploy `46a3d9c` (local-only; no git remote)
- Branch: main (both repos)
- Pitch live: https://rainbow-pitch.vercel.app — Slide 4 now carries 3 bullets per column + italic footer; Slide 3 accent narrowed to "Custom"
- Apps Script: v2.20.1, unchanged
- Demo: still upcoming (2026-04-14). Today is 2026-04-13.

## This Session

- Slide 4 (Alternatives): grew from 2→3 bullets per column. Counterpoint +"No employee view." ADP compliance bullet reworked with 8hr-rest correction + framed ESA as "not native, each rule a manual config"; added customer-sentiment 3rd bullet grounded in `pitchdeck/competitorAnalysis.md` + `Competitive Scheduling App Analysis.md`. SaaS bullet 2 fixed (Australian labour awards + WIW defaults to US 40hr OT, no 8hr rest); +3rd on restaurants/hospitality origin + no retail floor-coverage model. Italic footer: "Concierge customer service. Staff and management training, free."
- Slide 3 (Today): accent span narrowed to "Custom" only (was full "Custom-built"). Body copy NOT reviewed this session — still cites "11-hour daily rest rule" (ESA is 8hr). Slide 3 review deferred per JR.
- Research-grounded claims: ADP customer-sentiment bullet pulled from documented patterns (outsourced call centers, ticketing loops, "black-box" account mgmt). SaaS restaurant-industry framing defensible: 7shifts explicitly restaurant-only, Deputy Australian-origin, WIW multi-industry but weighted hospitality.
- **Slide 4 Column 3 revisit pending:** late in session JR flagged he doesn't believe 7shifts/Deputy/WIW are the apps OTR actually evaluated. He's running a discovery research prompt in Gemini (real shortlist for a family-run Ontario clothing retailer with Counterpoint+ADP Canada). Column 3 will be rewritten when findings land — likely candidates include Homebase, Sling, Connecteam, TimeForge (NCR partner). Prompt text is in S54 chat transcript.
- **"Australian labour awards" rephrase pending:** technically correct (Australian awards = statutory industry pay/conditions agreements) but reads as typo to North American audience. Rephrase to "built for Australian labour law" or similar when Column 3 is reworked.
- **ESA over-reliance across the deck (S54 feedback):** JR flagged that I've been over-leading with Ontario ESA in every slide, comparison, and research prompt. New rule in auto-memory (`feedback_esa_not_a_selling_point.md`): ESA is a real feature but cap it at one mention per slide, never headline, never the argument. **Existing slides that over-lean on ESA and should be revisited:** Slide 2 Card 2 ("Guardrails / Compliance built into the schedule.") — entire card argument is ESA; and Slide 4 Column 2 bullet 2 (ADP "Ontario ESA isn't native..."). Both should be reframed around something other than ESA when deck editing resumes.

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` | No | S55 target. Not yet opened this session — read current state before drafting. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | Yes | Reference for voice/pattern (3-bullet-per-column + italic footer). |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | Yes (accent only) | Slide 3 body still has "11-hour rest" to correct when that slide comes up. |
| 4 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. RE-READ before any slide change. |
| 5 | `pitchdeck/competitorAnalysis.md` + `Competitive Scheduling App Analysis.md` | No | Research sources for any competitive/pricing claim that lands on a slide. |

## Anti-Patterns (Don't Retry)

- **Proposing copy for a slide then never shipping it** (S53, observed again S54) — when JR directs "choose" or gives a specific change, edit + build + deploy in the same move. Don't wait for a second sign-off.
- **Editing slide card copy without grepping the whole file for stale references** (S53) — in `docs/lessons.md`.
- **Building without deploying when JR expects ship** (S53) — in `docs/lessons.md`.
- **Fabricated statutory claims on the deck** (S53) — in `docs/lessons.md`. Slide 3 body still has the outstanding 11hr→8hr correction.
- **Arbitrary derived numbers as persuasion** (S53) — in `docs/lessons.md`.
- **Overclaiming app verbs ("enforced" when the app only flags)** (S53) — in `docs/lessons.md`.
- **Unverifiable deck copy** (S53) — in `docs/lessons.md`.
- **Single-site fix when a parser is shared across paths** (S52) — in `docs/lessons.md`.
- **Rainbow-gradient-on-type for "Rainbow" wordmark** (S51) — in `docs/lessons.md`.
- **Family-relationship assumptions in OTR copy** (S51) — in `docs/lessons.md`. Amy=sister(payroll), Joel=brother(co-owner), Scott=ops, Sarvi=NOT family.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Slide 3 body-copy review + 11hr→8hr fix | Deferred by JR in S54 | Must be addressed before demo if Slide 3 stays in deck. Ontario ESA correct figure is 8hr per ontario.ca/document/your-guide-employment-standards-act-0/hours-work. |
| Slide 4 Column 3 rewrite + "labour awards" rephrase | JR's Gemini research on actual Ontario-retail-SMB scheduling app shortlist | Current named apps (7shifts/Deputy/WIW) may be shadow-boxing. Real candidates likely include Homebase, Sling, Connecteam, TimeForge. Rephrase Deputy bullet from "Australian labour awards" → "Australian labour law" at the same time. |
| Phase 2 build | Sarvi discovery | Post-demo. |
| Demo outcome capture | 2026-04-14 meeting | Will need to be logged in decisions.md after demo. |

## Key Context

- **Per /handoff arg, next session target is Slide 5 (Proposal), not Slide 3.** Slide 3 is still outstanding but JR's scheduled per-slide order is now: ~~1~~ → ~~2~~ → ~~4~~ → 5 → 3.
- **Slide 4 pattern established this session:** 3 bullets per column, italic footer below existing prose footer, accent-word-per-header. Slide 5 review may follow the same shape — confirm with JR when opening.
- **The italic-footer pattern now has three instances** (Slides 1, 2, 4). Voice varies per slide; no repeated tag.
- **RAINBOW-PITCH commits are local-only** (no git remote). Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **Research files are the source of truth for competitive claims.** Before making any new claim about ADP, Counterpoint, 7shifts/Deputy/WIW on the deck, grep `pitchdeck/*Analysis.md` first. Don't invent.
- **Ontario ESA verified figures:** 8hr rest between shifts (not 11), 44hr/wk OT threshold, 3-hour rule, 48hr weekly max. Sources in S53 handoff's Key Context section.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app confirms S54 handoff commit at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` confirms `46a3d9c` at HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app — verify Slide 4 has 3 bullets per column + italic "Concierge customer service..." footer, Slide 3 accent is just "Custom"
- [ ] Read Slide 5 source at `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` before any drafting
- [ ] Confirm with JR: how did the 2026-04-14 demo go, and is Slide 5 still the target?
