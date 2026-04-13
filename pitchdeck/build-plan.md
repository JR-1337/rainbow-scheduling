# Pitch Deck + Leave-Behinds — Build Plan

## Context

Demo is 2026-04-14 (today). Sarvi hosts the meeting with Dan Carman (owner, price-first, slow-decider), Scott (ops manager, technical skeptic), with Amy (payroll-veto sister, not in room) as the silent third stakeholder. The app itself is demo-ready (S45). What's missing is a self-narrating deck + two paper leave-behinds (price sheet for Dan, tech spec for Scott). **S48 premise shift:** Sarvi is NOT a narrator — the deck must stand alone. See "Slide Deck Shape (S48-revised)" section below for the authoritative shape; earlier slide sections below that reference Sarvi-narration are LEGACY / SUPERSEDED.

S46 ingested all pitchdeck source material into context and proposed a 7-slide deck shape JR liked. S47 ran the clarity round and locked four sub-decisions:
1. **Slide 5** (alternatives): single combined slide, three columns
2. **Proposal slide**: 3-month trial framing as risk reversal (now reframed as a "fitting trial")
3. **Slide 2** (cost of today): hybrid — Sarvi narrates first-person, single dollar anchor at end
4. **Pricing**: NOT in the deck — handed off via Dan's price sheet at meeting end

Two corrections from JR after my first analysis pass forced the plan to be tighter:
- **Slide 2 numbers must reflect the app AS IT STANDS TODAY**, not Phase 2 projections. The $4–6K payroll-dance savings I included is a future benefit (depends on the payroll bridge being built), not a current-state ROI claim. Future savings can appear separately as roadmap value, not stacked into the headline number.
- **Pricing must respect JR's actual labor**, not just "win the close." $349/mo with infinite absorbed tweaks bleeds JR at ~$10/hr year 1. New anchor: $497/mo with structural protections against feature-creep bleed.

This plan locks the content, pricing, and build order so the deck/sheets can be drafted slide-by-slide without re-litigation.

---

## Slide Deck Shape (S48-revised — self-narrating, 6 slides)

**Premise shift (S48):** Sarvi is NOT a reliable narrator. The deck must do all the work. Every slide stands alone — readable in ~30 seconds, no performer needed. Anything Sarvi adds is bonus. Load-bearing content goes ON THE SLIDE, not in a script.

| # | Slide | Core job |
|---|---|---|
| 1 | **Cover (working)** | Prove the brand + plant the thesis + show the product is real — in 10 seconds, without a word spoken |
| 2 | **Cost of today** | Headline $25,480/yr. Three beats: building / juggling / reconciling. Minimal legal-exposure footer. |
| 3 | **What Rainbow does today** | App screenshots with OTR's actual roles + pay-period + floor positions. Screenshots carry the slide. |
| 4 | **Why alternatives fail** | 3-column: Counterpoint (doesn't schedule) / ADP (not built for Ontario retail) / SaaS (wrong industry, no ADP Canada) |
| 5 | **Phase 2 roadmap** | Receipt box → ADP bridge + consecutive-days warning + meetings/PK shift types. Future value, not stacked into current ROI. |
| 6 | **Proposal** | Fitting trial shape + "price sheet in hand at meeting end" — the actual number lands on Dan's paper, not on the screen |

**Dropped from earlier 7-slide shape:** standalone "business case" slide. When the deck is self-narrating, slide 2 already does that job.

### Slide 1 — Cover (spec)

- **Background:** OTR hero photo (blogTO denim wall, `public/hero.jpg`) with dark navy overlay so foreground reads
- **Center:** "Rainbow" wordmark rendered in the same rotating accent gradient the live app uses (imports `OTR_ACCENT` from copied `theme.js`) — brand system proves itself on first slide
- **Animation on slide entry:** welcome-sweep (900ms rainbow wash, lifted from the app's login sequence) — literally shows the product's visual signature before any explanation
- **Cover video loop (centerpiece):** auto-populating a full empty week. Empty schedule grid → 40+ shifts fill in under 2 seconds. Loops seamlessly. Mounted inside a device frame (laptop or phone mockup) on the slide. This is the "holy shit it just did that" beat.
- **Thesis sub-line (on slide, not spoken):** *"A scheduling app built for OTR. Not a template. Not a subscription. Not for anyone else."*
- **Fallback:** if video fails on meeting-room wifi, the first frame is served as a static poster so the slide never renders blank

### Slide 2 — Cost of today (S48-locked copy)

- **Headline:** *"Scheduling costs OTR $25,480 a year right now"*
- **Sub-line:** *"14 hours a week of Sarvi's time. Every week. $35/hr × 52 weeks. The math is the math."*
- **Three beats (icon + one-line each):**
  - **Building** — schedules + re-schedules when staff call off
  - **Juggling** — time-off asks, swap requests, coverage texts at 11pm
  - **Reconciling** — pay period payroll translation from Counterpoint into ADP
- **Minimized legal footer (one line, small, bottom of slide):** *"Scheduling errors also carry legal exposure under Ontario's May 2024 regulation. Rainbow prevents the schedule that would trigger it."*

---

## Messaging Throughlines (must appear consistently across deck + price sheet + spec)

These are the load-bearing claims. Each must be phrased identically (or near-identically) everywhere it appears. Drafting any of the three artifacts without checking this list = drift risk.

| # | Throughline | Appears on |
|---|---|---|
| 1 | **"Custom-built for OTR. Not a template. Not a subscription."** | Cover slide, slide 3 caption, tech spec §5 (Integration approach), price sheet header |
| 2 | **Cost-of-doing-nothing framing** ($25,480/yr envelope, no predicted savings) | Slide 2 only. NEVER on price sheet (no savings claims on paper — trial measures them). |
| 3 | **Fitting trial = risk reversal AND measurement window** (earns its 3 months) | Slide 6 (Proposal), price sheet "3-month fitting trial" bullet |
| 4 | **$2K Build Investment Fee exact wording** (see Pricing Structure table below — locked S48) | Slide 6 (brief mention), price sheet (full locked paragraph) |
| 5 | **$497/mo + $125/hr + hosting pass-through** (all three disclosed, nothing hidden) | Slide 6 (brief), price sheet (full) |
| 6 | **Counterpoint has NO native scheduler** (NCR partners with TimeForge + 7shifts — their own admission) | Slide 4 column 1, tech spec §5 (Integration approach) |
| 7 | **Bug fixes always included, indefinitely** | Slide 6, price sheet, tech spec §6 (Production readiness) |
| 8 | **Ontario ESA compliance engine is live on the demo** (amber ≥40h, red ≥44h, 3-hour rule, 11-hr rest) | Slide 3 caption if visible on screenshot, tech spec §4 |

**Drafting order enforcement:** when step 3 (scaffold) + step 4 (slides) lands, do a fast throughline-audit against this table before step 5 (price sheet) + step 6 (tech spec) begin. Any throughline that shifted during slide drafting → update this table first, then draft the sheets from the updated table. Don't let the sheets re-invent phrasing.

---

## Pricing Structure (LOCKED per JR S47)

| Element | Spec |
|---|---|
| **Monthly fee** | **$497 CAD / month**, all-in |
| **Hosting pass-through** | **Locked S48 wording for price sheet:** "Hosting costs: currently $0. The app runs on free-tier infrastructure today. If future features require paid hosting (larger data volumes, real-time sync, etc.), OTR pays the hosting provider directly at actual cost — no markup from Rainbow. Estimated ceiling at current scale: under $50/mo. You'll see the bill before any change goes live." |
| **3-month fitting trial** | Months 1–3 are the "fitting period" — JR adapts the app to OTR's specific workflow. **Fitting tweaks free during these 3 months. Feature additions during trial are NOT free — billed at $125/hr** (clarified S48). Terminable any time during trial = max OTR risk $1,491 + any feature-add hours approved in writing. |
| **Bug fixes + service issues** | **Always included in monthly**, indefinitely. JR is selling a working app and stands by it. |
| **Post-trial work** | After month 3, any new work (tweaks OR features — line is too blurry to split by framing) billed hourly. **No pre-included monthly hours pool** — JR will not work for free post-fitting. |
| **Hourly rate post-trial (small work / tweaks)** | **$125/hr CAD, 1hr minimum.** Concierge-engineering positioning makes this defensible. Below the $100–$170 Toronto custom-dev band cited in research, but anchored at the upper-fair end. |
| **Feature work post-trial** | Larger asks aren't billed hourly — JR scopes the requirements after looking into them and quotes a **fixed-price project**, approved by OTR before any work starts. Protects both sides: OTR knows the cost upfront, JR doesn't underestimate a big build at hourly rates. |
| **$2K Build Investment Fee** | Charged at end of month 3 (not at signing). **Locked S48 wording for price sheet:** "Build Investment Fee — $2,000 CAD, end of month 3. Recoups a portion of the custom development invested in OTR's specific workflow. Collected only after the fitting trial proves the app fits — not at signing. Includes transfer of source code, system documentation for handover, production-grade hardening, and activation of the 12-month commitment term." **Flexibility built in (internal, not on sheet):** if Dan flinches, JR can lower, move upfront with a discount, or drop entirely. |
| **Data ownership** | OTR owns all data, perpetual licence, source code access. Standard. |
| **Commitment** | 12 months from end of trial, then month-to-month with 30-day notice. (12mo starts month 4, not month 1 — the trial is genuinely a trial.) |

**Why this works for both sides:**
- OTR's max risk in months 1–3 = $1,491. Easy yes for a defer-prone family.
- JR's effective rate year 1 (assuming 400hr build base): ~$15/hr. Year 2+ amortizes the build cost; rate climbs naturally. Past month 3, all NEW work is paid hourly — no resentment vector.
- Bug fixes always included = JR stands by the product = credibility.
- $2K landing at month 3 = collected when value is proven, not when trust is unproven.

---

## Slide 2 — Current-State ROI (audited, JR-corrected)

**Operating numbers (Sarvi-confirmed, S48-corrected):** OTR is **34 employees** today. Sarvi spends **14 hrs/wk** on the full schedule envelope (building + management talks + time-off + swaps + sick-call coverage + schedule push + off-hours). Sarvi rate $35/hr (conservative for a GM in Toronto retail). Rainbow-side hours are not predicted — the trial measures them.

### The honest frame: cost of doing nothing (not predicted savings)

**Framing correction per JR S47:** Slide 2 must NOT claim "Rainbow cuts Sarvi from 16 to X hr/wk" — that's a prediction with no measurement behind it, exactly the research-paper-style inflation we're cutting. The only numbers we actually own are (a) what the current envelope costs OTR today and (b) what Rainbow costs. The trial is the measurement window for savings; the deck doesn't pretend to know them in advance.

**The full schedule envelope** = building schedules + talking them through with management + handling time-off requests + mediating swaps + fielding off-hours sick calls + finding coverage + pushing updates to staff + every tedious adjacent task. Not just grid-writing. Sarvi's 14 hr/wk number captures the whole envelope.

| Claim | Math | Source |
|---|---|---|
| **Sarvi: 14 hrs/wk on the full schedule envelope today** | Sarvi-reported | Direct input via JR S48 |
| **Annual cost of the envelope at $35/hr** | 14 × $35 × 52 = **$25,480/yr** | Pure arithmetic on Sarvi-confirmed input |
| **Rainbow @ $497/mo annual cost** | $5,964/yr | Locked price |
| **The claim on slide 2** | Scheduling eats $25,480/yr of Sarvi's time right now. Rainbow costs $5,964. The app's job is to take the biggest bite out of the $25,480 it can. The 3-month fitting trial is when that bite is measured on OTR's actual floor — not predicted from outside. | Honest, non-salesy, matches JR's tone preference |

**Why this framing is structurally stronger:**
1. The $25,480 is undeniable — Sarvi's own number × a conservative GM rate × 52. Dan cannot argue with it without arguing with Sarvi.
2. No predicted savings = nothing to shoot at. The family can't say "we don't believe you'll save us $20K" because we didn't claim that.
3. The trial is reframed from "risk reversal" alone to "risk reversal AND measurement window" — it earns its 3-month length.
4. When Phase 2 becomes real (slide 6), its savings are additive on top of a measured current-state number, not a second speculative claim.

### ESA exposure (risk mitigation, not "savings" — separate frame)

- $5,000 per affected employee × 34 staff = **$170,000 single-fine exposure** under O. Reg. 189/24 (May 2024) for a third contravention. Sourced government regulation, not extrapolation.
- Ontario prosecutions tripled to 111 in 2024–25; retail explicitly named as targeted sector.
- Rainbow's amber/red traffic-light engine is the live mitigation — visible on the demo.
- **Frame as:** "the scheduling-error legal exposure isn't theoretical; the app actively prevents the schedule that would trigger it."

### Future / roadmap value (Phase 2 — NOT current ROI)

Shown on slide 6 as future development, NOT on slide 2 and NOT in the headline ROI:
- Payroll dance recapture: ~6–8 person-hrs × 26 pay periods × $25/hr = **~$4,000–$5,000/yr**
- Receipt box elimination: ~$1,500–$2,500/yr in Dominica/accountant time + bonus accuracy
- These get added projected savings of **~$5,500–$7,500/yr on top of current ROI** when Phase 2 ships.

### What gets CUT from the working-context doc

- The $227K–$248K/yr "scheduling exposure" headline — paper-research extrapolation for a 40-person, $2M-revenue store using hypothetical 4%-of-revenue understaffing losses. Won't survive incredulity.
- The "$96,000/yr turnover cost" — uses 60% US industry turnover assumption, not OTR's actual rate.
- Anything that depends on Phase 2 functioning to claim current ROI.

### Slide 2 narrative shape (LEGACY — SUPERSEDED by S48 self-narrating spec in "Slide Deck Shape (S48-revised)" section above. Retained for audit trail only.)

~~1. Sarvi narrates her Wednesday in first person — the 8 hours, the texts at 11pm, the printed schedule on the back-room corkboard.~~
~~2. Sarvi narrates the every-2-week payroll dance — Counterpoint printout, receipt box, Dominica typing into ADP.~~
~~3. Closing dollar anchor narrated by Sarvi.~~
~~4. ESA exposure as a footer/sidebar callout.~~

**Use the S48-revised Slide 2 copy block at the top of this plan — headline + sub-line + three-beat icons + minimized legal footer — NOT this legacy narrative shape.**

---

## Slide 5 — Why the Obvious Alternatives Fail You (single slide, 3 columns)

JR's specific concern: I'd missed Counterpoint scheduling. **Verified:** NCR Counterpoint has NO native employee scheduler. The "Time-Card" module is a punch clock only. NCR's own ecosystem partners with **TimeForge** and **7shifts** to fill the scheduling gap (sourced from `pitchdeck/Competitive Scheduling App Analysis.md` lines 55–61, 298–300). This is a *killer* fact for Scott because it comes from NCR's own integration partnerships — not Rainbow's marketing.

### Three columns, equal weight (slight ADP/Counterpoint lean since that's Scott's actual objection)

| Column | Headline | Evidence (one-liner each) |
|---|---|---|
| **Counterpoint** | "Counterpoint doesn't schedule. It clocks." | Time-Card module is a punch clock. NCR partners with TimeForge + 7shifts to provide scheduling — NCR's own admission via integration partnerships. |
| **ADP scheduling** | "Built for unions and global enterprises. Ontario ESA is an afterthought." | $560–$1,040+/mo add-on. ESA 44hr threshold + 3-hour rule require paid backend config by ADP implementation specialist. ADP Mobile app: 1-star rating, Reddit-quoted. |
| **SaaS (Deputy / 7shifts / WIW)** | "Cheap, but no Ontario ESA, no ADP Canada, wrong industry." | 7shifts ADP Canada explicitly unsupported (per their own docs); Deputy compliance built for Australian awards; WIW defaults to 40hr OT, no 11hr rest rule. Per-user pricing punishes part-time-heavy retail. |

**Bottom strip / closing line:** "Every alternative either doesn't schedule, doesn't know Ontario, or wasn't built for retail. Rainbow is the one tool that's all three."

---

## Custom-Fit Positioning (load-bearing across deck)

Per JR S47: the whole deck pushes Rainbow as **custom-built, tuned to OTR's specific needs and workflow, fitted to their systems as they are now, refined over time.** This is the throughline that justifies the price and the trial structure simultaneously.

- **Slide 3 (What Rainbow does today):** screenshots show OTR's actual role colours, OTR's pay-period structure, OTR's floor positions (Cashier/Backup/Mens/Womens/Floor Monitor) hard-coded — not configured-from-template.
- **Slide 7 (Proposal):** the 3-month trial IS the fitting period. Frame: "First three months are about making this app fit OTR exactly — not about deciding whether the app works. The fit work is included."
- **Tech spec sheet (Scott):** "Integration approach" section reframes from "we have an API" to "we shape to your existing systems — CSV interchange to ADP and Counterpoint exactly because that's what their native utilities accept, by design."

---

## Format & Delivery (locked S47)

**Pitch deck — React app on Vercel.**
- New project at `~/APPS/RAINBOW-PITCH/` (sibling to RAINBOW Scheduling, separate repo, separate Vercel deploy).
- Vite + React 18 + Tailwind. Reuses Rainbow's `THEME`/`OTR_ACCENT`/`TYPE` from a copied `src/theme.js` so brand identity matches the demo app exactly (rotating accent, same fonts, same dark navy + white card aesthetic).
- 6 slides (S48-revised count) as discrete components in `src/slides/`. Top-level `App.jsx` handles slide navigation (keyboard arrows + swipe on mobile + click zones).
- Mobile-first responsive: Sarvi can pull it up on her phone, hand the phone to someone, or project from a laptop. Same layout adapts.
- Hero photo asset (blogTO denim wall) downloaded to `public/` so the deck works offline if the meeting room WiFi drops.
- Auto-deploy to Vercel on push. Final URL pinned in handoff.

**Price sheet + tech spec sheet — print-ready PDFs.**
- Source: HTML pages within the same React app (routes `/price` and `/spec`), styled with print CSS (`@media print { ... }` for letter-page sizing, page breaks, font scaling).
- Export: browser print → save as PDF. Sarvi prints the PDFs and physically hands them to Dan + Scott at meeting end.
- Same OTR accent branding so the leave-behinds match the deck visually.

## Build Order (S48-revised)

1. **Demo-data reset (RUN FIRST)** — wipes the live test data before any capture or scaffolding. Write `backend/seed-demo-data.gs` as a standalone Apps Script file JR pastes into the Apps Script project and runs once. Function behaviour:
   - **Clears** Employees, Shifts, ShiftChanges, Announcements tabs (keeps header rows). **Preserves** Settings tab (pay-period anchor, store info, etc.).
   - **Seeds** Employees tab with:
     - **JR** — `johnrichmond007@gmail.com`, admin, owner, `showOnSchedule=FALSE`, password hashed
     - **Sarvi** — `sarvi@rainbowjeans.com` / `admin1`, admin, `showOnSchedule=TRUE` (stays on the grid because she's the real scheduling admin), password hashed + `passwordChanged=TRUE`
     - **Dan Carman** — `dan@rainbowjeans.com` / `daniel`, admin, `showOnSchedule=FALSE`, password hashed + `passwordChanged=TRUE` (no change-prompt friction during meeting)
     - **Scott** — `scott@rainbowjeans.com` / `scott`, admin, `showOnSchedule=FALSE`, password hashed + `passwordChanged=TRUE`
     - **20 synthetic employees** — emails `emp.001@example.com` … `emp.020@example.com` (RFC 2606 reserved domain → guaranteed non-deliverable, zero email-leak risk during testing). Mix of roles (cashier, backup cashier, mens, womens, floor monitor) and employment types (full-time + part-time). Default passwords `emp-001` … `emp-020`, plaintext in column D, `passwordChanged=FALSE` → realistic first-login flow if Dan/Scott want to see it.
   - **Seeds shifts** for the 20 synthetic employees across the **current pay period only** (Sarvi-visible and demo-loaded). **Next pay period stays empty** so the Playwright cover-loop capture has a fresh empty grid to auto-populate.
   - **Does NOT add** Dan/Scott/JR to any shifts.
2. **Playwright cover-loop capture** — after demo-data reset is confirmed.
   - **Target:** `https://rainbow-scheduling.vercel.app`
   - **Login:** `sarvi@rainbowjeans.com` / `admin1` (creds passed at runtime, NOT committed to any file)
   - **Flow:** login → wait for welcome-sweep to settle → navigate to the **next pay period** (the empty one; current has seeded shifts per demo-reset design) → enter edit mode → trigger **Auto-Fill Week** on W1 then W2 → record the fill animation with one clean pause at the end → exit
   - **Capture:** Playwright `context({ recordVideo: { dir, size: { width: 1920, height: 1080 } } })` → webm
   - **Post-process via ffmpeg:** trim to a seamless 3–4s loop, re-encode to mp4 (H.264 + AAC for max browser compat), extract first frame as jpg for poster fallback
   - **Output paths (staged in RAINBOW Scheduling APP repo until pitch app exists):** `pitchdeck/assets/cover-loop.mp4` + `pitchdeck/assets/cover-poster.jpg`. Moved to `~/APPS/RAINBOW-PITCH/public/` during step 3 (scaffold).
   - **Script location:** `pitchdeck/capture/cover-loop.mjs` (node + playwright, standalone — not part of the main app's test suite)
   - **Runs headed** so JR can watch and abort if anything looks wrong. Re-runnable; each run overwrites the asset.
   - **Sibling captures in the same Playwright session** (slide 3 screenshots, per Cluster 4 answers): admin desktop grid full view, employee mobile schedule (viewport-emulated phone), admin requests panel, PDF export preview. Saved as `pitchdeck/assets/slide3-*.png`. Batched into the same script to avoid relogging in.
3. **Project scaffold** — `npm create vite@latest` at `~/APPS/RAINBOW-PITCH/`, copy `theme.js` from Rainbow, install + configure Tailwind, base layout component, slide-navigation shell. **Then**: download blogTO Hector Vasquez denim wall hero photo to `public/hero.jpg`. **Then**: move step-2 capture assets from `pitchdeck/assets/` → `~/APPS/RAINBOW-PITCH/public/` (cover-loop.mp4, cover-poster.jpg, slide3-*.png).
4. **Deck slides 1–6** built as components in `src/slides/`, drafted in order. Each paused for JR review before next. Cover (slide 1) needs the assets from step 3 in place; slide 3 needs the slide3-*.png screenshots.
5. **Throughline audit checkpoint** — re-read the "Messaging Throughlines" section above against the drafted slides. Any phrasing that drifted during slide work → update the throughline table FIRST, then proceed. Do not let the price sheet/spec re-invent claims that the deck has already locked.
6. **Price sheet** route (`/price`) — Dan's leave-behind, single printable letter page. Pulls from the locked Pricing Structure section (S48 wording for $2K Build Investment Fee, $125/hr, hosting pass-through, fitting trial). Cross-checks throughlines #1, #3, #4, #5, #7.
7. **Tech spec sheet** route (`/spec`) — Scott's leave-behind, 1–2 printable letter pages, 9-section structure per locked decisions.md 2026-04-13. Cross-checks throughlines #1, #6, #7, #8.
8. **Vercel deploy** + final URL captured + browser-tested on laptop + phone (and on the mobile experience Sarvi will project from if needed).

Each artifact paused for JR review before moving to the next.

---

## Critical Files

- `pitchdeck/pitch-deck-working-context.md` — the operative source; will be updated with any decisions that supersede it
- `pitchdeck/rainbow app product reference.md` — source for slide 3 (what Rainbow does today) and tech spec
- `pitchdeck/Competitive Scheduling App Analysis.md` — source for slide 5 + tech spec integration section
- `pitchdeck/competitorAnalysis.md` — source for slide 5 SaaS column
- `pitchdeck/pitchDeckResearch4OTR.md` — source for ESA fines, photo URLs
- `pitchdeck/rainbow-scheduling-pricing-proposal.md` — prior $349/mo + $5K format-fee draft, light reference (now superseded by this plan's pricing structure)
- `docs/decisions.md` — pricing-shape decision (2026-04-13) needs an update to reflect the $497 + post-trial-$2K + fitting-trial structure (new entry, not edit; the prior decision was at the abstract-shape level and the specifics now exist)
- `docs/todo.md` — current "pitch deck + leave-behinds" task entry stays as the In-Progress umbrella

---

## Verification

- **Numbers audit:** every dollar figure on slide 2 must trace to (a) Sarvi-confirmed input, (b) sourced government regulation, or (c) pure arithmetic on (a)/(b). No paper-research extrapolations from other-store models.
- **Counterpoint claim:** "no native scheduler" cite must reference NCR's own integration partnerships (TimeForge, 7shifts) — making it self-evidently true rather than Rainbow's word against theirs.
- **Pricing math sanity check:** Year-1 OTR cost = $5,964 + $2K formalization (paid month 3) = $7,964. Year-1 cost-of-doing-nothing baseline = $25,480; actual recapture measured during trial. JR effective hourly at ~400hr build base = ~$15/hr year 1.
- **Trial walk math:** OTR walks at end of month 1 = paid $497. End of month 2 = $994. End of month 3 (just before formalization) = $1,491. Max trial-period risk for OTR = under $1,500.
- **Read-aloud test:** Sarvi must be able to read every slide aloud without pausing to translate jargon. If a stat needs a footnote, it doesn't belong in the deck — it belongs in the spec sheet or on the slide notes.
- **Print test:** both leave-behinds must print cleanly on a single sheet (price sheet) or 1–2 sheets (tech spec) on standard letter paper, brand-consistent.

---

## Pending Inputs (gather before finalizing copy)

- ~~Exact OTR headcount today~~ — RESOLVED S48: **34 staff**.
- ~~Sarvi's actual hours/wk on scheduling~~ — RESOLVED S48: **14 hr/wk full envelope**. Rainbow-side hours NOT predicted — trial measures them.
- ~~Receipt-box photo~~ — RESOLVED S48: **not available**. Slide 2 uses generic graphic.
