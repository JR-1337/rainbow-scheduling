# Handoff - RAINBOW Scheduling App

Session 56. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S56 shipped `/spec` full review (9 → 12 sections + upgrade paths) and `/price` full review (green total box, HST, IP retention, one-time Build Investment Fee, 9-month post-trial commitment, prepared-by contact). Slide 5 continuity strip also added CF Worker. JR dropped a new research file `pitchdeck/Retail Scheduling App Alternatives Analysis.md` for the outstanding Slide 4 Col 3 rewrite. Greet with: "Reading `Retail Scheduling App Alternatives Analysis.md` before drafting Slide 4 Col 3 — want me to summarise the shortlist first or do you already know which apps to feature?"

## State

- Build (RAINBOW app): PASS, HEAD unchanged since S55 wrap (`0dd8b13`)
- Build (RAINBOW-PITCH): PASS, HEAD `eb121d7` (local-only, no git remote)
- Branch: main (both repos)
- Pitch live: https://rainbow-pitch.vercel.app (/price and /spec both verified live this session)
- Apps Script: v2.20.1 — live status still unclear, re-verify before demo
- Demo: Wed 2026-04-15 13:00 (tomorrow)

## This Session

- **`/spec` full review:** expanded 9 → 12 sections. Added §4 Publishing model (draft vs live), §5 Request lifecycle, §6 Outputs (PDF/email/announcements). Folded four-view architecture into §1, role system + pay-period into §3. Fixed §7 ESA (dropped 11hr fabrication, enforced → surfaced/flagged). Dropped "Australian labour awards"-type phrasing everywhere. Added italic "Upgrade path" lines on 9 of 12 sections (OTR blue accent). §12 Phase 2 list dropped meetings/PK and consecutive-days (ship with v1), added CF Worker. Footer rewrote off ESA to Counterpoint/NCR contrast. Prepared-by line added.
- **`/price` full review:** Monthly fee "+ applicable HST". Fitting-trial row tightened; tweaks-vs-features distinction made explicit (never uses "base cost"). New "Not included" row. Data-ownership row rebuilt as "Data & IP" with IP retention, non-transferable licence, customisations-not-resold guardrail. Post-trial hourly reframed to "lower half of the $100-$170 Toronto band" (math fix: $125 is below midpoint, not upper). Commitment changed to 9 months post-trial (12 total). Build Investment Fee labelled "One-time" + "Paid once, never recurs". Green total box ($7,964 CAD, OTR green) with arithmetic + downside case. Footer humanised to "pen-and-paper approach leaks time and money across everyone the process touches" — names Sarvi, Amy, Dominica. Prepared-by line added. Red accent → green (alarm → go/safe tone).
- **Slide 5 (Proposal.jsx):** CF Worker read-cache added as 5th Phase 2 item in continuity strip.
- **New project memory updates:** `project_pricing_locked.md` refined with S56 structure (HST, IP split, one-time fee, 9-month commitment, contact).
- **New research file noted:** `pitchdeck/Retail Scheduling App Alternatives Analysis.md` (54K, untracked in git) — for Slide 4 Col 3 rewrite.

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `pitchdeck/Retail Scheduling App Alternatives Analysis.md` | New | **S57 target.** Research source for Slide 4 Col 3 rewrite + "Australian labour awards" rephrase. READ FIRST before drafting. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | No | Destination for Col 3 rewrite. |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | No (still stale) | Slide 3 body still cites "11-hour rest" — ESA is 8hr. JR wants whole-card review, not just fix. Priority pre-demo. |
| 4 | `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` | Yes | Reference for final pricing structure; don't re-open structural decisions. |
| 5 | `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` | Yes | Reference for 12-section structure + upgrade-path pattern. |
| 6 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. RE-READ before any slide change. |

## Anti-Patterns (Don't Retry)

- **Over-leading with ESA on every slide/doc** (since S54) — capped at one mention per surface, never headline. S56 dropped all residual ESA from /spec footer. Monitor any new copy for drift.
- **Proposing copy and not shipping until a second sign-off** (since S53) — edit + build + deploy in one move when JR directs.
- **Mis-interpreting OTR domain terms** (since S55) — "promo" = commissions, not sale-period staffing. When an OTR word has a retail-general meaning AND an OTR-specific meaning: ask, don't assume.
- **Framing pricing claims that don't survive math** (since S56) — $125/hr is NOT "upper end" of $100-170 band, it's below midpoint. Don't pad with flattering framings that a customer can compute and catch. When quoting a band, do the arithmetic yourself first.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Slide 3 body 11hr→8hr + whole-card review | JR wants whole card reviewed | MUST land before demo if Slide 3 stays. Ontario ESA = 8hr (ontario.ca). |
| Slide 4 Col 3 rewrite + "labour awards" rephrase | None (research file landed this session) | **S57 target.** Read `pitchdeck/Retail Scheduling App Alternatives Analysis.md` first. Real candidates likely Homebase, Sling, Connecteam, TimeForge per prior handoff. |
| Apps Script v2.20.1 live-deploy verification | JR paste → Apps Script → Deploy | Re-verify before demo. |
| Phase 2 build | Sarvi discovery | Post-demo. |
| Demo outcome capture | 2026-04-15 13:00 meeting | Log in decisions.md after demo. |

## Key Context

- **Pre-demo runway is effectively the remaining day + Wed morning.** Demo Wed 13:00.
- **S57 priority order per current state:** (1) Slide 4 Col 3 rewrite using new research file, (2) Slide 3 full-card review (11hr→8hr + whole card), (3) Apps Script verify.
- **IP retention decision** — JR owns copyright in source code, OTR gets perpetual non-transferable licence + source access. Rainbow may reuse generic components in future work but OTR-specific customisations are not resold. Recorded in `docs/decisions.md` + `project_pricing_locked.md`.
- **Build Investment Fee is a negotiation lever.** On-the-table: split across months 4-6 ($700/mo), drop to $1,500 for on-the-spot sign, or roll into monthly (+$167/mo). JR wanted it visible specifically to create room to negotiate without hurting himself.
- **"Can JR actually code?" talk-track worked through this session** — honest AI-assisted dev framing, not denial, not bluff. The app itself is the proof.
- **RAINBOW-PITCH has no git remote.** All commits local-only. Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **OTR green is `#00A84D` / `#00863E` dark** (4th of 5 accents in `theme.js`). Used on /price total box.
- **JR contact:** John Richmond · john@johnrichmond.ca. Now on both /price and /spec prepared-by lines.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app shows S56 handoff commit at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` shows `eb121d7` S56 commit at HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app/price — verify green $7,964 total box, HST on Monthly fee row, "Not included" row, "Data & IP" row with IP-retention clause, 9 months commitment, prepared-by line
- [ ] Hard-refresh https://rainbow-pitch.vercel.app/spec — verify 12 sections, upgrade-path lines (italic, blue accent), footer rewritten off ESA, prepared-by line
- [ ] Hard-refresh https://rainbow-pitch.vercel.app/ Slide 5 continuity strip shows 5 Phase 2 items including Cloudflare Worker
- [ ] Read `pitchdeck/Retail Scheduling App Alternatives Analysis.md` before drafting Slide 4 Col 3
- [ ] Confirm with JR: Slide 4 Col 3 is the S57 target, or has priority shifted to Slide 3?
