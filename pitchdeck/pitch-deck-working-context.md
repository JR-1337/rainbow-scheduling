# Pitch Deck — Working Context

Living doc. Synthesis of all pitch-relevant intel as we build the deck + leave-behind. Updated as new info lands.

---

## The Audience

| Role | Name | Stance | Notes |
|---|---|---|---|
| Owner / decision maker | Dan Carman | Unknown; Sarvi presenting to him | Amy's brother, Joel's child |
| Operations manager | (in room) | Manages computer systems | Will weigh technical fit |
| Skeptic (expected) | Scott | "ADP + Counterpoint already have scheduling" | Pre-empt with competitive analysis |
| Payroll owner | Amy Carman | Not in room. Will veto anything that threatens ADP control | Dan's sister. Does ADP herself. Delegates Counterpoint tallying + bonus entry to Dominica (assistant) or the accountant. Distrusts automation for payroll. |
| Parent/owner | Joel | Not confirmed in room | |

**Family decision pattern (Sarvi's read):** slow to action, defer indefinitely, rarely resolve. **Price above quality.** Will reject premium pricing with "we'd rather spend money on something that works with payroll + Counterpoint."

---

## Sarvi's Revised Framing (load-bearing)

> "This scheduling app is a temporary solution solely for my benefit so I don't have to spend hours scheduling, and it makes day-to-day communication easy — sick calls, late, swaps. The long-term goal is an app that integrates with ADP + Counterpoint. I'll bring this up Tuesday."

**Translation for the deck:**
- **Today** = Sarvi's scheduling + communication tool. Kills her 8hrs/week. Does NOT touch payroll.
- **Future development** = the bridging layer (Counterpoint → Rainbow → ADP, bonus entry in-app). Shown as roadmap, NOT sold as Phase 1.
- This protects Amy's control. Removes the #1 reason she'd veto.

---

## The Real Pain (use as the Phase 2 hook)

Current workflow, every 2 weeks:

1. Counterpoint = clock-in/out + hour tracking.
2. Someone (Dominica or accountant) prints the Counterpoint timecard sheet → **manually enters hours into ADP Workforce Now**. **~Half a day.**
3. Bonus program: **$10 per $750 pre-tax transaction**. Printed receipts go in a **box**. Someone manually tallies by employee initials → enters into ADP as adjustments. **~2 hours.**
4. Amy owns the ADP step personally.

**Total:** ~6–8 person-hours per pay period + a literal box of paper receipts.

**Rainbow Phase 2 pitch:** in-app bonus entry (kills the box + 2hrs), scheduled-vs-actual reconciliation (Rainbow already knows schedule + hours), CSV export matched to ADP Workforce Now schema. **Amy still clicks "Import" in ADP — she keeps control.**

---

## Pre-empt These Objections

| Objection (who) | Counter |
|---|---|
| "ADP + Counterpoint already have scheduling" (Scott) | Competitive Scheduling App Analysis.md — Counterpoint Time-Card is a punch clock, not a scheduler; ADP scheduling is configured for unions/global rules, fails Ontario ESA without paid custom config. NCR Pulse + ADP Mobile = 1-star apps. |
| "Rather spend on payroll integration" (Carmans collectively) | That IS Phase 2. Today solves Sarvi's pain + proves the product. Bridging layer is the natural next increment, not a separate purchase. |
| "$X/month is too expensive" | Reframe: manual scheduling costs $12,480/yr in GM hours. Rainbow Standard tier = $5,964/yr. Add turnover-reduction + Phase 2 payroll hrs saved → 2.7–3.0x ROI. Competitive stack (7shifts/Deputy/When-I-Work + ADP API tax $2.50 PEPM) hits similar or higher. |
| "We'd lose control of payroll" (Amy, via proxy) | Rainbow exports. Amy imports. Amy approves every pay period. No system replaces her. |

---

## JR Thinking Snapshot — Prior Pitch Attempt (NOT a rule, light reference only)

JR's notes from a previous deck draft, captured 2026-04-13. Worth weighing for merit; explicitly not a constraint on the new direction.

**Core proposal he was considering:**
- 3-month trial at $349/mo. During trial, JR fits the app to OTR's system specs for free.
- Post-trial: same monthly. New features quoted at fixed base cost. Tweaks at $100/hr, 1hr minimum.
- Scope honesty: the app does what it does NOW. Phase 2 / further development costs extra.

**Phased rollout he was considering:**
1. Sarvi solo uses app to build schedules + export PDFs
2. Full-time staff added as adjacent-system trial (stress-test, validate)
3. Each step gates on feedback + tweaks
4. End of 3 months → solid working product integrated into ops; expansion to ADP/Counterpoint/payroll/tax/accounting becomes the next conversation

**Tone he wanted to set:** Realistic + honest, not "bold confident pitch pretending it's a full working product." Acknowledge spreadsheets-for-DB + personal-email-for-distribution reality. Frame as "even if Sarvi only uses it to export PDFs to the staff room wall, it still beats pen and paper by a mile."

**Strongest ideas in here for the new plan to consider:**
- The **trial framing** is the best risk-reversal device available — $1,047 max-risk over 3 months is structurally easier for a defer-prone family to say yes to than a 12-month commit.
- The **phased rollout** gives the family an off-ramp at every stage, which paradoxically makes them more likely to commit.
- The **tone of honesty** about scope ("does what it does today; integrations cost more") could be more credible than a polished pitch that overpromises — but trades against the technical-rigor positioning the spec sheet establishes for Scott.
- The **trial-includes-fitting work** gives away dev hours but builds buy-in.

**What's worth questioning in the new plan:**
- $100/hr for tweaks is fair but feels transactional for a relationship sale. Could absorb minor tweaks into the monthly and only price-meter feature work.
- "I'll work on fitting it to your system specs for free" — what spec is this fitting to? If it means Phase 2 integration discovery work, scope it tighter so it doesn't become unbounded.
- Rollout phases above might compress to 2 or expand to 4. Worth scoping by demo date, not by abstract milestones.

---

## Proposed 7-Slide Plan (S46 — UNDER CONSIDERATION, not finalized)

JR liked the shape. Saving for next-session revisit + formal plan + final clarity round before drafting copy.

1. **Cover** — OTR hero photo (blogTO Hector Vasquez denim wall is the strongest candidate), app name, Sarvi presents
2. **The cost of how scheduling works today** — Sarvi narrates her Wednesday in first person (8hr/wk) + the every-2-week payroll dance (Counterpoint printout, receipt box, manual ADP entry by Dominica/accountant + Amy)
3. **What Rainbow is** — screenshots: schedule grid with role colors, ESA traffic lights, mobile bottom-nav, PDF for the back room. Show, don't tell
4. **Why scheduling done right matters for the business** — Mercer 25.9% Canadian retail turnover; Gap stable-scheduling study +7% median sales. Reframes Rainbow from "Sarvi's helper" to "retention + sales lever" so the family sees it as a business decision
5. **Why the obvious alternatives fail you** — single slide, three columns: Counterpoint Time-Card (punch clock, not scheduler), ADP scheduling (union/global, fails Ontario ESA), Deputy/7shifts/WIW (no ADP Canada, no 11hr rest, restaurant or US-centric). Pre-empts Scott's objection
6. **Where this goes next — Phase 2** — the CSV bridge story: Rainbow reconciles Counterpoint actuals → emits ADP-ready export → in-app bonus entry replaces the receipt box. **Amy still clicks Import.** Shown as roadmap, not promised
7. **The proposal + handoff** — phased trial framing (months 1-3 with Sarvi, scope honesty, included tweaks). Closes with: *"Sarvi has detailed information for each of you — pricing for Dan, technical specifications for Scott."*

**Creative choice flagged:** Sarvi narrates slide 2 in first person. She's already in the family's trust circle — her voice carries weight stats cannot.

**What's deliberately NOT in the deck:**
- Cost / pricing → Dan's leave-behind (price sheet)
- Data privacy / security / hosting / auth → Scott's tech spec sheet
- Long competitor pricing tables → Dan's price sheet has the comparison
- Detailed Phase 2 spec → product reference doc has it; deck only signposts

**Open question parked for next session:** does slide 5 (single combined competitor slide) land hard enough, or does Scott's likely "ADP and Counterpoint already have scheduling" warrant breaking into two slides — one for ADP/NCR native gap, one for SaaS alternatives (Deputy/7shifts/WIW)? Tradeoff: 8 slides instead of 7.

---

## Settled Decisions (JR, 2026-04-13)

**Pricing shape:** Simple flat monthly. No tiers. No $5K formalization fee — absorbed into the monthly. Lump-sum alternatives considered but dropped — harder to justify + harder to close with a family that reads price-first and defers.

**Tech spec sheet:** Produce as a separate 1–2 page leave-behind aimed at Scott (Operations Manager). Contents:
1. Architecture at a glance (stack, deployment, server model)
2. Authentication & access control (HMAC tokens, hashing, server-side enforcement)
3. Data ownership & hosting flexibility (CSV/JSON export, perpetual license, source access, OTR-owned or managed)
4. Ontario ESA compliance engine (44hr threshold, amber/red, PDF flags, audit trail)
5. Integration approach — CSV flat-file interchange with ADP Workforce Now + Counterpoint (matches their native utilities, deliberately not API-based)
6. Production readiness posture (CD pipeline, staging, backups, monitoring, SSL)
7. What's explicitly out of scope (timekeeping/punch-clock, payroll processing stays in ADP)
8. Roadmap pointer (Phase 2 payroll bridge one-liner)
9. **Optional hardening tier** — ways the system can be hardened further if they require enterprise-grade robustness (multi-region backups, HA database replication, paged 24/7 monitoring, annual penetration testing, higher SLA commitments, audit-grade logging, dedicated staging). Priced as add-ons on top of the baseline monthly if they opt in.

Build order: deck + price sheet first, tech spec last (absorbs any late changes).

---

## Leave-Behind: 1-Page Price Sheet — Goals

Sarvi said: **price better AND offer better service AND show that clearly.** Both axes must be on the page.

- Single-page, branded (OTR accent colors), desktop + mobile readable if viewed digitally.
- Side-by-side comparison: Rainbow vs. (generic scheduling SaaS + ADP scheduling add-on) — dollar figures, not marketing adjectives.
- Include Phase 2 roadmap as a line item with a "coming soon / included in tier X" note so deferred decisions still have Rainbow in the frame.
- "What you're actually buying" section: the concierge engineering angle (bypass 1-800, direct developer access) — family values price but Sarvi can use this as the quality defender.

---

## Deck — Proposed Shape (refined against research)

Research file `pitchDeckResearch4OTR.md` keyed several slides explicitly (2, 7, 8, 9). Incorporating:

1. **Cover / the OTR moment** — hero photo (blogTO Hector Vasquez or Retail Insider Craig Patterson), OTR accent rotation, "A scheduling app built for Over the Rainbow."
2. **The cost of the status quo** — 8hrs/wk GM scheduling + 6–8hrs/pay-period payroll dance + receipt box. Dollarize with sourced stats: **$227K–$248K/yr** scheduling exposure (40-person store model); managers lose 20% of working time to scheduling.
3. **What Rainbow does today** — scheduling, ESA compliance engine (44hr red / 40hr amber), shift swaps/offers, mobile-first staff app, PDF back-office export. Screenshots.
4. **The people side** — retention + staff experience. Key stats: **39% vs 24%** 6mo turnover (<72hr vs 2wk notice, Shift Project); **25.9% Canadian retail turnover** (Mercer, 2× national avg); **83%** of hourly staff prefer mobile access; Gap stable-scheduling study **+7% median sales**. Positions Rainbow as retention tool, not just admin tool.
5. **Why ADP + Counterpoint don't fill this gap** — Counterpoint Time-Card = punch clock not scheduler; ADP scheduling built for unions/global, fails Ontario ESA without paid config; NCR Pulse + ADP Mobile = 1-star apps; user quotes. Pre-empts Scott's objection.
6. **Why not SaaS (Deputy / When I Work / 7shifts)** — Deputy auto-scheduler admits it ignores availability; When I Work has no ISO 27001/SOC-2; 7shifts is restaurant-not-retail; SaaS prices +11.4% in 2025; UKG consolidation cautionary tale.
7. **Ontario ESA compliance — the legal shield** — $5K/employee per contravention (O. Reg. 189/24, May 2024); $562,500 largest single 2024 fine; prosecutions **tripled** to 111 in 2024–25; retail is a targeted sector. Rainbow's traffic-light engine is the mitigation.
8. **Data privacy + sovereignty** — Kronos/UKG Dec 2021 breach (8M employees, $9.6M settlements); 67% Canadian SaaS CLOUD Act-exposed; Ontario employee-data regulatory gap tightening; upcoming federal bill (~C$25M/5% global revenue penalty). Rainbow = Canadian-hosted, no CLOUD Act exposure, data export in open formats.
9. **Phase 2 — the bridging layer (future development)** — Counterpoint actuals → Rainbow reconciliation → ADP Workforce Now export + in-app bonus entry (kills the receipt box). Amy still clicks "Import" in ADP. Shown as roadmap, not sold hard.
10. **The math / ROI** — manual cost vs. Rainbow Standard tier. 5-yr TCO vs. Deputy/WIW/7shifts (use research appendix table). No per-user fees, no AI-bundle hikes, no auto-renewal lock-in.
11. **What makes us different** — concierge engineering (direct developer access, bypass 1-800), bespoke OTR fit, data sovereignty, no API tax, source code + data owned by OTR.
12. **Pricing + next step** — the tiers, mirrors the leave-behind. Contract shape (12mo commit then 30-day month-to-month) + $5K formalization fee framed against the $68K–$115K market replacement cost.

Deck target length: probably 10–12 slides. Family defers — every slide has to earn its keep. Cut slides 4/6/8 down to 1-slider "receipts" pages if we need to hit <10 total.

## Killer Stats — Top of Mind (from appendix)

| Section | Headline | Supporting |
|---|---|---|
| Cost of status quo | $227K–$248K/yr scheduling exposure | 8hr/wk GM time; 39% vs 24% turnover on notice |
| ESA shield | $562,500 single 2024 fine | 111 prosecutions (3×); retail targeted; $5K/employee |
| Privacy | 8M employees disrupted (UKG 2021) | C$25M / 5% revenue expected penalty; 67% CLOUD Act-exposed |
| Custom vs SaaS | +11.4% SaaS inflation 2025 | Deputy can't check availability; 7shifts is restaurant-only |
| Retention | 25.9% Canadian retail turnover | +7% sales from stable scheduling (Gap study) |

## Photo Assets Available

- **Hero options:** blogTO Hector Vasquez 13-photo set (denim wall, Joel Carman portrait, store interior) — direct URLs in research doc §1.
- **Editorial:** Retail Insider (Craig Patterson), Toronto Life (24-karat gold sewing machine), FASHION Magazine, MR Magazine (Joel + Jinni Carman portrait).
- **Official:** rainbowjeans.com logo PNG, two video assets on Shopify CDN, historical collage.
- **Attribution:** non-public deck likely fair use but credit in footer.

---


---

## Source Files in `pitchdeck/`

- `Competitive Scheduling App Analysis.md` — full competitive analysis with pricing + user sentiment (ADP API Central, NCR VAR dealer tollbooth, CSV alternative)
- `competitorAnalysis.md` — earlier competitor notes
- `pitch deck context.md` — raw Sarvi feedback + pain point dump (source for audience/framing sections of this doc)
- `pitchDeckResearch4OTR.md` — **research feed with sourced stats** (ESA fines, SaaS inflation, UKG breach, Mercer turnover, Gap stable-scheduling study, OTR photo URLs). All slide claims should be traceable to this file.
- `rainbow app product reference.md` — product spec
- `rainbow-scheduling-pricing-proposal.md` — tier pricing + ROI framing
