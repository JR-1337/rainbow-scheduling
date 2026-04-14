# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

## 2026-04-14 - Meetings + PK feature: split-maps over nested-array (S61)
**Decided:** Frontend shift state keeps `shifts[key]` work-only (current shape, unchanged). New parallel `events[key]` map holds arrays of meeting/pk entries. One partition point on `loadDataFromBackend` splits the flat backend payload into the two maps. `publishedShifts` gets a parallel `publishedEvents` for employee-view LIVE gating. Backend Sheet rows stay flat with a new orthogonal `type` column ('work'|'meeting'|'pk') + `note` column. Backend `saveShift` + `batchSaveShifts` use 3-tuple key `${empId}-${date}-${type}` so work + meeting + pk coexist on the same day.
**Alternatives:** (a) Nested array `shifts[key] = [entries]` (original plan) — rejected mid-Stage-2 after grep showed 25+ call sites assuming `shifts[key]` returns a single work-shift object. Nested would invasively break every `shifts[key].hours`, `shifts[key].role`, `if (shifts[key])` site + add a `.find(s => s.type === 'work')` to every hot-path cell render. (b) Composite-key `${empId}-${date}-${type}` at all frontend sites — rejected for identical reasons to nested.
**Rationale:** 25+ existing sites treat `shifts[key]` as scalar work shift; zero touched by split-maps. O(1) lookup on hot path preserved. Mental model matches how the store thinks: "the schedule" = work, "events" = overlays. Nested-array would only pay off if 4+ orthogonal entry types were planned; exactly 2 are (meeting, pk).
**Revisit if:** A 3rd or 4th orthogonal entry type is proposed (then merging to a nested array or composite key buys back uniformity).

## 2026-04-14 - Offers + swaps blocked for non-work shift types (S61)
**Decided:** Only `type='work'` entries are transferable. Frontend offer/swap modals filter their shift lists to work-only (Stage 6 not yet shipped — filter lives in backend now). Backend `submitShiftOffer` + `submitSwapRequest` reject non-work attempts with error code `INVALID_SHIFT_TYPE` and message "Only work shifts can be offered/swapped."
**Alternatives:** (a) Allow all types to be offered/swapped with admin approval gating — rejected. Swapping a mandatory meeting or PK training is conceptually nonsensical; Sarvi would always reject. (b) Silent drop of non-work from the picker only — rejected; explicit backend rejection plus the same error toast on the client creates a clear audit trail and defensive-in-depth.
**Rationale:** Meetings and PK events are admin-scheduled mandatory commitments. Employees cannot delegate them. Backend rejection + frontend filter = two layers.
**Revisit if:** A future non-work type is introduced that IS delegatable (e.g., "optional training").

## 2026-04-14 - Hours: union-count overlaps across work + meeting + pk (S61)
**Decided:** When a day has multiple entries (work + meeting + pk), weekly/period hours count the **union** of all intervals, not the sum. A 9-5 work + 3-5 pk = 8h for that day, not 10h. Fast-path (no events): existing `shift.hours` sum stays unchanged. Slow-path (events present): `computeDayUnionHours([work, ...events])` via `src/utils/timemath.js` merges intervals then sums. Unparseable entries fall back to their stored `hours` field so fast/slow paths agree on stale data.
**Alternatives:** (a) Sum all entries (double-count overlap) — rejected. Misrepresents actual paid time and would trigger false OT red-flags at 40/44hr. (b) Ignore meeting/pk in totals — rejected. They are paid time and count toward ESA 40/44hr thresholds per Ontario rules.
**Rationale:** ESA overtime threshold is 44hr "worked" — paid-but-concurrent time shouldn't double-count. Employees can't be in two places simultaneously. Mirrors how payroll treats overlapping timecard punches.
**Revisit if:** Sarvi reports discrepancies between displayed hours and ADP-exported hours.

## 2026-04-14 - Meeting + PK skip the 5-consecutive-days streak (S61)
**Decided:** The consecutive-days warning (informational, added in Stage 8) counts only `type='work'` days. A meeting on Day 5 of a 4-work-day streak does not extend the streak to 5.
**Alternatives:** (a) Any scheduled entry extends streak — rejected. A 2-hr meeting on a planned off-day is not a full workday and penalises Sarvi for scheduling training. (b) Soft inclusion (meeting counts half) — rejected as arbitrary and opaque to the user.
**Rationale:** Ontario ESA consecutive-days logic is about fatigue from sustained shop-floor work. Meetings/training don't carry the same load.
**Revisit if:** An employee reports fatigue complaints driven by back-to-back training + work days.

## 2026-04-14 - Pitch deck typography baseline for 10ft / 50" TV viewing (S60)
**Decided:** Global typography clamp ladder enforces visual hierarchy at every viewport from laptop to 1920+ TV: `.display` 40-96px, `.body` 16-26px, `.h3` 18-24px, `.label` 12-18px, `.stat` 32-60px, `.h2` 24-44px. `.slide-content` max-width 1180 → `min(1500px, 94vw)`. `.slide` side padding clamp upper bound 80 → 56. Every inline `fontSize` in slides converted to clamp respecting the ladder (subhead 26 max > card title 22-24 max > card body 19-20 max > eyebrow 17-18 max > footer 17 max). Backups in `~/APPS/RAINBOW-PITCH/.backup-s60-typography/`.
**Alternatives:** (a) Slide-3-only bump — rejected by JR; problem affects whole deck. (b) Bump globals only without sweeping inline overrides — rejected; cards keep their fixed sizes and break hierarchy ("now we have card fonts bigger than the subheader"). (c) Switch to a CSS variable scale (--font-body) referenced everywhere — overkill for a 5-slide deck; clamp inline is enough.
**Rationale:** Demo target is a 50" TV at ~10ft viewing distance. Visual angle math says body text needs ~24px+ on screen; old fixed 12-14px was illegible. Ladder maintains hierarchy at every viewport via proportional clamps so laptop view stays usable while TV view scales up.
**Revisit if:** Demo audience is closer than 10ft (text becomes oversized) or further (need another bump).

## 2026-04-14 - Slide 3 photo system: independent cards + lightbox + annotations (S60)
**Decided:** Slide 3 photo treatment is now: 3 independent `.card` surfaces (one per photo) with accent top border matching Slide 2/4/5 pattern. Hero schedule (full width, flank annotations on desktop) + 2 phone cards 2-up below (annotations beside photo, centered as a flex unit). Each photo wrapped in a `<button>` that opens a fullscreen lightbox modal on click. Mobile: each card has an "i" toggle that reveals a numbered annotation list inline (the two phone cards' toggles are paired so opening one expands both). Photos: 1px light-gray (#E0E0E0) border, no device frames, no browser chrome, `saturate(0.92)` filter. Tinted-well container removed in favor of per-photo cards.
**Alternatives:** (a) Single tinted-well container with all 3 photos — rejected after S58 burned 6 iterations; well never framed cleanly. (b) Annotations as overlay dots ON the photos with hover/tap tooltips — rejected; dots-on-photo less elegant than flank labels. (c) Skip annotations on mobile — rejected; JR wanted the same data accessible per-photo. (d) Skip mobile lightbox — rejected; JR explicitly asked for click-to-zoom.
**Rationale:** Each photo gets its own surface = visual hierarchy + matches established slide-card pattern across deck. Lightbox covers any "too small to read" concern uniformly. Annotation pattern (numbered circle + label + sub) reads as ad-agency teardown style and fills the dead space on desktop where the hero photo doesn't span the slide content width.
**Revisit if:** A 4th screenshot becomes essential (would break the 2-up phone row on mobile).

## 2026-04-14 - Swap/Offer cutoff is "tomorrow midnight" (S60)
**Decided:** SwapShiftModal + OfferShiftModal both filter shifts as eligible only when `shiftDate >= tomorrow` (midnight of the next day). Today's shifts are excluded (in-progress / done). Any future-day shift counts.
**Alternatives:** (a) Original "tomorrow noon" cutoff — rejected; arbitrary noon threshold excluded tomorrow's morning shifts and was confusing. (b) "At least 24 hours away" sliding window — rejected; clock-based windows surprise users when a Saturday shift becomes ineligible at 6:01pm Friday. (c) No cutoff, allow same-day swaps — rejected; same-day swap requests have no operational benefit, Sarvi can't approve in time.
**Rationale:** Midnight cutoff matches user mental model of "tomorrow." Sarvi gates short-notice approvals on the admin side; client-side just needs to be permissive enough to surface intent, not enforce policy.
**Revisit if:** Sarvi reports being spammed by short-notice requests she has to deny.

## 2026-04-14 - Slide 4 Restructured as 4-Card + Sweep Strip (S57)
**Decided:** Slide 4 ("Why the alternatives don't fit") restructured from 3 columns (Counterpoint / ADP / SaaS-grab-bag) to **4 equal cards** + a horizontal sweep strip. The 4 cards are the research-recommended strategic foils: **ADP Essential Time** (incumbent threat), **TimeForge** (NCR's partner), **Deputy** (global standard), **Agendrix** (Canadian small-business default). The sweep strip below categorises the rest of the market by why they don't fit: punch-clocks (Counterpoint Time-Card, Jibble, ClockShark), hospitality apps (7shifts, Toast, Square Team, Jolt), enterprise platforms (UKG, Legion, WorkJam), digital whiteboards OTR outgrew (Homebase, Sling, WIW, Connecteam, MakeShift). No closing one-liner.
**Alternatives:** (a) Keep 3 cols, rewrite Col 3 with a combined Deputy+Agendrix card — rejected by JR. Reason: dilutes both as foils and keeps the lazy "SaaS" grab-bag framing. (b) Keep 3 cols, swap Col 3 to TimeForge or Agendrix only — rejected. Reason: loses the strategic breadth that 4 distinct audiences gives the slide. (c) 3 majors + 1 also-ran column with Counterpoint in it — JR's initial instinct, rejected after seeing the 4-card research shortlist. Reason: Counterpoint is architecturally a POS, not a scheduler, and belongs in the "track hours don't schedule" sweep.
**Rationale:** The research (`pitchdeck/Retail Scheduling App Alternatives Analysis.md`) explicitly recommends the ADP / TimeForge / Deputy / Agendrix shortlist as the four strategic foils — each neutralises a different discovery channel (ADP sales rep, NCR partner push, organic Google search, Canadian small-business advice). Sweep strip handles the long tail without cluttering the cards. Each card's bullet 3 implicitly carries a different Rainbow wedge: ADP→concierge support, TimeForge→Sarvi's judgment preserved not replaced, Deputy→adapts-to-Sarvi, Agendrix→direct-line-to-developer. Role-system / apparel-floor angle is reserved for Agendrix only (duplicated bullets in TimeForge and Deputy were scrubbed). Ontario / ESA / compliance framing is FORBIDDEN on Slide 4 per JR (logged as lesson).
**Revisit if:** Demo feedback shows Dan/Scott don't recognise any of the four named competitors — swap in whichever named app Sarvi/Amy say they actually evaluated.

## 2026-04-14 - IP Retention + Perpetual Non-Transferable Licence for OTR (S56)
**Decided:** Price sheet `/price` "Data & IP" row states: OTR owns all business data; Rainbow retains IP and copyright in the source code; OTR receives a perpetual, non-transferable licence to use it, with full source code access for maintenance. Rainbow may reuse generic components and patterns in future work; OTR-specific customisations are not resold.
**Alternatives:** (a) Assign IP to OTR — rejected. Reason: blocks JR from ever reusing build patterns/components in future client work, turns every future project into a rebuild. (b) Non-exclusive licence only, no reuse clause — rejected as unclear; ambiguous whether Rainbow could build for another clothing retailer using overlapping code. (c) Silent on IP (original "perpetual licence, source code access" phrasing) — rejected. Reason: ambiguity could become a fight later if OTR opens a second store or asks "can you also build for our friend's shop."
**Rationale:** Standard custom-dev split. Protects JR's ability to monetise learnings in future work while giving OTR everything they need to keep running and modifying the app. Non-transferable clause prevents OTR from sublicensing/selling the app to another business (franchise risk). "Customisations not resold" is the honest guardrail: reusable patterns are fair game for Rainbow, but OTR's specific workflow won't show up in a competitor's app.
**Revisit if:** OTR requests IP assignment as a deal-breaker. Counter-offer: higher upfront fee (materially higher than current $2K Build Investment Fee) or royalty-style licensing.

## 2026-04-14 - Build Investment Fee Structure: One-Time, End of Month 3, $2K (S56)
**Decided:** Build Investment Fee is a one-time $2,000 CAD payment collected at end of month 3 if the fitting trial converts. Never recurs. Activates the commitment term. Covers source code transfer, system documentation, production-grade hardening. If trial does not convert, fee is never charged (max OTR spend in that case: $1,491 = 3 × $497).
**Alternatives:** (a) Upfront signing fee — rejected. Reason: undermines the risk-reversal proposition ("no cost to try"). (b) Rolled into monthly ($167/mo uplift for year 1) — rejected as default, kept as negotiation lever. (c) Larger fee to compensate build hours at market rate — rejected. Reason: deal breaks at higher number for a family business; effective $10-15/hr on build is a conscious subsidy JR accepts to win the relationship.
**Rationale:** Dual purpose: (1) recoups a fraction of the custom-build hours so JR isn't giving away ~200 hours of work for the price of a template, (2) serves as the commit moment that activates the 12-month term. Structured post-trial so OTR only pays after the app has proven it fits. "Paid once, never recurs" language on the row prevents Amy from misreading Year-1 total as recurring yearly.
**Revisit if:** Amy pushes back in the meeting. Negotiation room: split across months 4-6 ($700/mo), or drop to $1,500 if they sign the 12-month on the spot, or roll into monthly.

## 2026-04-14 - Commitment Reframed as 9 Months Post-Trial (12 Total) (S56)
**Decided:** Commitment row on `/price` reads: "9 months from end of trial (12 months total including the 3-month trial). Month-to-month thereafter with 30-day notice either way." Year-1 math unchanged ($7,964 = 3 × $497 trial + 9 × $497 committed + $2,000 fee).
**Alternatives:** (a) Keep original "12 months from end of trial" (= 15 months total) — rejected. Reason: reads as a longer lock than Dan would expect from a "12-month relationship" mental model. (b) 6 months from end of trial — rejected. Reason: too little runway to realise product value and doesn't protect JR's build investment.
**Rationale:** Framing the commitment as "12 months total" matches the mental model Dan naturally holds and closes the ambiguity that would have emerged if Amy counted up 3 + 12 = 15. Math identical; tone friendlier.
**Revisit if:** OTR asks for shorter commitment. 6 months post-trial is acceptable if paired with a larger Build Investment Fee.

## 2026-04-14 - Slide 2 Card 3 Pivots from "476 Decisions" to Comms Load (S53)
**Decided:** Slide 2 Card 3 drops the "476 decisions every pay period" math-derived framing. New card is "The back-and-forth" / "Every request, routed — not relayed." — describes the daily communication load (texts, calls, emails, group chats to Sarvi's personal phone for every time-off request, offer, and swap) and Rainbow's answer (structured forms validated against availability + role coverage, single-pane accept/reject, timestamped decisions with logged reasons). Availability and role coverage stay as Card 3's scope; overtime/ESA stay on Card 2. Card-to-card rule: expand, do not duplicate.
**Alternatives:** (a) Keep "476 decisions" as the scale argument — rejected by JR. Reason: 34×14=476 is arbitrary derived math that reads like sales-math padding and undermines the slide's credibility. (b) Card 3 = the rework ("schedules break on contact with reality") — rejected. Reason: would require Sarvi-confirmed testimony on rework volume; no such confirmation exists. (c) Card 3 = illegibility / single-point-of-failure — rejected. Reason: the SPOF framing for Sarvi is a graduated anti-pattern (S51 lesson).
**Rationale:** The comms load is a real, verifiable pain today (group chats, after-hours calls, no audit trail) and Rainbow's answer is a shipped feature (employee self-serve modals + validation + admin approve/reject + logged reasons). Argument-first, language-second — not number-first.
**Revisit if:** Sarvi reports during the trial that the comms framing undersells the depth of what Rainbow replaced, and a new, truthful card is possible.

## 2026-04-14 - Slide 2 Card 2 Drops $170K Fine-Ceiling Claim (S53)
**Decided:** Slide 2 Card 2 removes the "$170,000 single-fine ceiling" framing. New card is "Guardrails" / "Compliance built into the schedule." — body: "Rainbow watches the Ontario ESA ruleset as the grid is built — the 44-hour overtime cap, the 8-hour rest between shifts, and the consecutive-days-off limit. A breach is surfaced on the grid before publish, not three weeks into payroll." Rules are stated as product capability; 44hr OT is live today, rest + consecutive-days ship during the fitting trial.
**Alternatives:** (a) Keep $170K ceiling as the stakes anchor — rejected by JR ("unlikely, inappropriate"). Reason: O. Reg. 189/24 only applies the $5K × employees multiplier to a 3rd+ contravention in a 3-year period, not a single incident; the "one bad week = $170K" framing overstates and reads as fear-selling. (b) Cite fines at all as a secondary note — rejected. Reason: JR wants the card to argue for the product's capability, not the consequence of its absence. (c) State only rules currently live (44hr OT alone) — rejected by JR. Reason: JR committed to shipping the full suite during the trial; the card states product capability, not today's exact feature set.
**Rationale:** The compliance headline survives; the $170K number doesn't. Rules as product capability reads as competence; fine-multiplier math reads as sales pressure. Also corrects S50/S51-era factual error: the deck previously cited "11-hour daily rest" which is not Ontario ESA (the correct figure is 8 hours, verified against ontario.ca/document/your-guide-employment-standards-act-0/hours-work).
**Revisit if:** The fitting trial produces a real ESA near-miss that becomes a credible stakes anchor for Card 2. Or if Dan specifically asks what the downside of non-compliance looks like during the meeting.

## 2026-04-14 - Slide Footers Added; Varied Voice, No Repeated Tag (S53)
**Decided:** Every slide gets one italic footer line below the main content. Phrasing varies per slide — no repeated tag like "With Rainbow" across all five. Each footer is a one-line hook that closes the slide's argument. Shipped so far: Slide 1 ("Rainbow Scheduling app: built to order by the one who does the work. Sarvi knows best.") and Slide 2 ("What it takes, today, just to open on time."). Slides 3-5 footers drafted but not yet shipped, pending per-slide review.
**Alternatives:** (a) Fixed "With Rainbow:" tag on every slide — rejected by JR. Reason: repetitive, feels template-y. (b) No footers at all — rejected. Reason: each slide benefits from a final hook that ties the argument back to the product or the store. (c) Footer only on slides that "need" one — rejected. Reason: consistency across the deck matters; all or none.
**Rationale:** Footers give each slide a clean exit line without repeating a tag. The voice varies (declarative, observational, inviting) per slide topic. Elegance over structure.
**Revisit if:** In JR's review of the assembled deck, one slide's footer doesn't land and a different voice would fit better.

## 2026-04-14 - Defensive Availability Parse Added to Login Handler (S52)
**Decided:** `App.jsx` parent `handleLogin` (line 1408) wraps the `user.availability` JSON parse in try/catch with empty-string short-circuit. Empty/malformed values resolve to `{}`; `getAllData`'s `ensureFullWeek` then normalizes to a full 7-day shape on the next data refresh. Shipped as `ff54544` (S52). Live verified via fresh playwright login as Sarvi/admin1.
**Alternatives:** (a) Move `ensureFullWeek` to a shared util and call from both parse sites — rejected for this fix (more files, larger diff for an urgent demo-eve bug). Future refactor candidate. (b) Filter availability out of the login response server-side — rejected: backend should not lose information based on consumer fragility. (c) Server-side seed write to populate every employee's availability with a default JSON — rejected: doesn't fix the class of bug, just hides this instance.
**Rationale:** Same root cause class as S50 white-screen bug — empty Sheet field → `JSON.parse('')` throws → app stuck. S50 fixed the `getAllData` path; the login path was uncovered. Inline defensive parse is the smallest possible change that solves the visible bug; canonicalizing into a shared helper is a cleanup task for a non-demo session.
**Revisit if:** Any other Sheet-sourced JSON field (storeHours, requests blobs, settings) starts producing the same throw class. Sweep all parse sites and consider extracting a single `safeParseJSON(raw, fallback)` util.

## 2026-04-14 - Deck Drops to 5 Slides; Phase 2 Folds into Proposal
**Decided:** Drop standalone Phase 2 slide. Fold it into the Proposal slide as a one-line "After the trial" continuity strip naming the three tracks (Counterpoint→ADP bridge, consecutive-days warning, meetings/PK shift types) with "scoped fixed-price after the trial" wording. Deck count drops 6 → 5. Risk-reversal hero line ("Walk any time in the first 90 days. The only cost is the weeks you used.") becomes Proposal's display headline.
**Alternatives:** (a) Keep Phase 2 as slide 5 per plan — rejected by JR: risks reading as pre-close upsell to a price-first Dan. (b) Move Phase 2 between slides 2 and 3 — rejected: disrupts cost → proof → disqualify-alternatives arc. (c) Drop Phase 2 entirely — rejected: roadmap value needs to land, just not as its own slide.
**Rationale:** For Dan (price-first, slow decider), showing three more future builds immediately before the money conversation primes "how much will ALL this cost" anxiety. Folded, the same info reads as continuity commitment ("these are already scoped") rather than upsell. Proposal becomes the emotional close with the risk-reversal line doing more heavy lifting.
**Revisit if:** Phase 2 discovery answers from Sarvi make a specific track demo-ready enough that it deserves its own slide again (receipt-box kill with sample reconciliation view, most likely).

## 2026-04-14 - Cover Stays Title Card; Before/After Photo Pair Dropped
**Decided:** Slide 1 (cover) is stacked "OVER THE RAINBOW" wordmark in solid white Josefin Sans (matches app `Logo` component exactly) + single accent bar + thesis line. No before/after auto-fill screenshot pair on the cover.
**Alternatives:** (a) Plan's S50-spec before/after pair on cover — JR rejected. Reason: cover should be a clean brand moment; proof of auto-fill can live on slide 3 where "custom-built for OTR" has room for screenshots. (b) Rainbow-gradient-on-type for "Rainbow" — rejected: reads SaaS-hero, fights brand.
**Rationale:** Cover's job is welcome + thesis. The app's own Logo component is two-line stacked text in solid color — matching it makes the deck feel like a direct extension of the product. Auto-fill screenshots still appear on slide 3 (What Rainbow does today) where they support the "custom-built" claim.
**Revisit if:** Slide 3 review shows screenshots don't land the auto-fill beat clearly and the cover needs to do that job instead.

## 2026-04-14 - Cover Slide Drops Video Loop; Replaces with Before/After Static Screenshots + Welcome-Sweep
**Decided:** Slide 1 (cover) keeps welcome-sweep CSS animation + Rainbow wordmark + hero photo bg + thesis sub-line. Drops the auto-fill video loop centerpiece. Replaces it with a **before/after split**: empty next-period grid screenshot ↔ same grid populated, with a center caption ("One click. 40+ shifts." or similar). Live wow-moment happens in the meeting itself when Sarvi/JR hand the phone to Dan/Scott to run Auto-Fill themselves.
**Alternatives:** (a) Headed Playwright video recording — failed: Chromebook RAM/Wayland kept disconnecting the browser process. (b) JR manually screen-records on Chromebook — JR rejected: "I don't want to make the vid." (c) CSS-animated mock cover — JR rejected: loses "real proof" feel for Scott. (d) Single hero screenshot — rejected: doesn't carry the auto-fill beat. (e) ffmpeg cross-fade between two stills as inline mp4 — viable but adds complexity for marginal gain over a clean side-by-side still.
**Rationale:** Static before/after carries the same "look what it just did" beat in a single readable frame; works on print + projector + phone with no playback. Welcome-sweep on entry preserves brand-signature motion. Live demo on Dan/Scott's phones replaces the recorded wow with a participatory wow — stronger anchoring for a deciding stakeholder.
**Revisit if:** Post-demo, JR wants a recorded version for follow-up email or v2 deck, and we have access to a non-Chromebook recording environment. Or if the before/after still doesn't read clearly during JR's review of the assembled deck.

## 2026-04-14 - Defensive `ensureFullWeek()` for Availability Parsing in App.jsx getAllData
**Decided:** App.jsx data-load layer wraps every employee's availability in `ensureFullWeek()`, which always returns a fully-populated 7-day object overlaying any parsed-row data on top of `DEFAULT_AVAILABILITY`. Empty strings, malformed JSON, missing days, and `null` all resolve to a complete shape. Shipped as `7f3021c` (S50).
**Alternatives:** (a) Defensive read-side: change ScheduleCell to `availability?.available ?? false` — rejected: would mask the data shape problem and propagate optional-chaining throughout every consumer. (b) Backend-side fix: re-run seedDemoData with proper availability JSON in every row — rejected: brittle (any future seed/manual edit could re-introduce the crash) and slower than the frontend fix. (c) Throw on bad availability so the issue is loud — rejected: catastrophic UX (white screen on a single bad row).
**Rationale:** Data shape is enforced at one boundary (the parse step in getAllData), so every downstream reader can trust `employee.availability[day].available` exists. Demo-critical: pre-fix, every login (Sarvi/Dan/Scott/employee) crashed during data load with 148 console errors and a blank screen. Synthetic employees seeded by S48 had empty-string availability → JSON.parse failed → `{}` → undefined day lookup → crash. Post-fix, the live app renders for every login regardless of source-row data quality.
**Revisit if:** Any other data field starts exhibiting the same "fallback to empty object then read deep into it" pattern (e.g., `storeHours`, `requests`); same defensive shape-completion treatment should apply.

## 2026-04-13 - Pitch Deck = React App on Vercel; Leave-Behinds = Print-Ready PDFs
**Decided:** The pitch deck is built as a Vite/React/Tailwind app at `~/APPS/RAINBOW-PITCH/` (sibling to RAINBOW Scheduling, separate repo, separate Vercel deploy). Reuses Rainbow's `THEME`/`OTR_ACCENT`/`TYPE` from a copied `src/theme.js` so brand identity matches the live demo app exactly. 7 slides as components in `src/slides/`, top-level navigation handles keyboard arrows + mobile swipe + click zones. Mobile-first responsive. Hero photo in `public/` so it works offline if meeting WiFi drops. Price sheet and tech spec are routes (`/price`, `/spec`) within the same app, styled with print CSS for letter-page sizing — exported to PDF via browser print, then physically handed to Dan and Scott.
**Alternatives:** Markdown drafts → JR converts to Google Slides/Keynote/PDF (rejected — loses brand consistency, more manual handoff work). Markdown → PDF (rejected — not interactive, doesn't match Rainbow's UI feel). Sheets as separate Google Docs (rejected — visual disconnect from the deck/app brand). Same React deck for sheets (chosen specifically so leave-behinds match deck aesthetic).
**Rationale:** Sarvi will project this on a laptop or hand it around on her phone. The medium IS part of the message — a React app demonstrates the same craft as Rainbow itself, so the deck and the product reinforce each other. Reusing `theme.js` means rotating-accent identity carries through. Print-CSS for the leave-behinds means we maintain one source-of-truth (the React app) and Sarvi prints what she needs.
**Revisit if:** Vercel deploy fails close to demo time and we need a fallback (markdown → PDF emergency path), or if Sarvi feedback says digital format distracts from her narration.

## 2026-04-13 - Pitch Pricing Specifics: $497/mo + Fitting Trial + Post-Trial $2K + $125/hr
**Decided (supersedes the abstract pricing-shape decision earlier today):** Locked structure for OTR pitch:
- **$497/mo CAD** flat monthly, all-in.
- **3-month fitting trial** (months 1–3): all tweaks/changes free — JR adapts the app to OTR's specific workflow during this window. Terminable any time during trial; max OTR risk $1,491.
- **Bug fixes + service issues:** always included in monthly, indefinitely. JR sells a working app and stands by it.
- **Post-trial small work / tweaks:** $125/hr CAD, 1hr minimum. Below the $100–$170 Toronto custom-dev band but anchored at upper-fair end (concierge-engineering positioning).
- **Post-trial feature work:** JR scopes after looking into requirements, quotes fixed-price project approved before any work starts. Not billed hourly.
- **$2K formalization fee:** charged at end of month 3 (not at signing). Frames as "production hardening + handover documentation + lock-in." Show the value first, then collect. Flexibility built in: lower / move upfront with discount / drop entirely if Dan flinches in the room.
- **Hosting pass-through:** if a future data migration requires paid hosting (CF Worker / Supabase / etc.), passed through at cost. Disclosed in price sheet so it's not a surprise.
- **Commitment:** 12 months from end of trial, then month-to-month with 30-day notice. (12mo starts month 4, not month 1 — the trial is genuinely a trial.)
- **Data ownership:** OTR owns all data, perpetual licence, source code access.
**Alternatives:** $349/mo flat with infinite absorbed tweaks (rejected — bleeds JR at ~$10/hr year 1; resentment-fuel for a 12+ month relationship). 3-tier Basic/Standard/Premium ($349/$497/$797) (rejected per earlier decision today). $5K formalization at signing (rejected — two numbers feels like upsell theater; landing $2K post-trial collects when value is proven). Pre-included monthly hours pool (rejected — JR explicitly does not want to work for free past the fitting period; blurs tweak-vs-feature line by framing). $100/hr post-trial rate (rejected — undersells the concierge positioning). $150–$175/hr post-trial (rejected — risks giving Dan ammo to defer; $125 is upper-fair without crossing into "expensive").
**Rationale:** JR's labor must be respected for him not to resent the work — explicit pushback from JR S47. $497/mo lands at year-1 effective rate ~$15/hr (assuming 400hr build base), climbing year 2+. Bug-fix-forever-included = product credibility. Tweaks-free-during-trial = both customer risk reversal AND the fitting-period-as-measurement-window framing for slide 2. Post-trial $125/hr + fixed-price feature scoping = no future bleed. $2K at month 3 = collected when trust is proven, refundable in negotiation if it kills the close.
**Revisit if:** OTR walks during the trial (then no $2K collected, structure proves itself). Dan flinches on $2K specifically (then JR moves it to upfront with a discount, lowers, or drops it). Sarvi reports the family needs a lower entry number to even start the conversation (then trial-period price could drop, post-trial standard stays $497).

## 2026-04-13 - Slide 2 Frames Cost-of-Doing-Nothing, NOT Predicted Savings
**Decided:** Pitch deck slide 2 leads with the *current cost of the schedule envelope*, not predicted Rainbow savings. Sarvi-confirmed (S48-corrected 2026-04-14): **34 staff, 14 hr/wk** on the full envelope (building schedules + management talks + time-off + swaps + sick-call coverage + schedule push + off-hours, NOT just grid-writing). At $35/hr (conservative GM rate) × 52 weeks = **$25,480/yr**. ESA single-fine ceiling = $5,000 × 34 = **$170,000**. Slide 2 cites the $25,480 as the cost OTR pays today. Rainbow's annual cost ($5,964) is the comparison anchor. The actual savings number gets MEASURED during the 3-month fitting trial — the deck does not predict it.
**Alternatives:** Claim "Rainbow cuts Sarvi from 16 to 4 hr/wk = $21,840/yr saved" (rejected — pure prediction, no measurement behind it; family can shoot at the predicted savings and there's no defence). Stack research-paper "$227K–$248K scheduling exposure" (rejected — extrapolated from a 40-person, $2M-revenue model with hypothetical 4%-of-revenue understaffing losses; won't survive owner incredulity). Lead with ESA fine ceiling (rejected as headline — fear-anchor reads as sales pressure; better as a sidebar callout after the cost-of-today number lands).
**Rationale:** $29,120 is undeniable — Sarvi's own number × conservative wage × 52. Dan can't argue with it without arguing with Sarvi. No predicted savings = nothing to shoot at. The trial earns its 3-month length by being the measurement window; deck and pricing structure reinforce each other. Phase 2 future savings (slide 6) become additive on top of a measured current-state number, not a second speculative claim.
**Revisit if:** Sarvi reports the family wants a savings claim to anchor on (then add a "ranges historically observed in similar deployments" sidebar with sourced figures — but never as the headline). Or if measurement during the trial produces a real savings number worth retroactively adding to the deck for future pitches.

## 2026-04-13 - Pitch Deck Pricing Shape: Simple Flat Monthly, Cost Out of Deck

**Decided:** Pitch leave-behind uses a simple flat monthly price (no tiers). $5K formalization fee absorbed into the monthly. Cost is NOT discussed in the pitch deck itself — Sarvi hands the price sheet to Dan at the end of the session, tech spec sheet to Scott. Specific monthly number TBD when deck drafting forces an ROI anchor.
**Alternatives:** 3-tier model (Basic/Standard/Premium $349/$497/$797) — rejected for being too complex for a price-first family that defers; the higher anchor risks killing the close even though it makes Standard look cheaper. Lump-sum buyout — rejected, JR sees it as harder to justify and harder to land. Discussing price live in the pitch — rejected, family is price-first and will derail to fixate on the number; better to anchor value first then hand the price sheet so the number lands in the context of value just delivered. Keeping the formalization fee separate — rejected, two numbers feels like upsell; one number is honest and clean.
**Rationale:** Family decision pattern (per Sarvi 2026-04-13): slow to decide, defer indefinitely, value price above quality. Simple flat monthly is the only shape that survives that pattern. Sarvi physically handing the price sheet (rather than projecting the number) gives Dan a private moment to evaluate without the room watching him react.
**Revisit if:** A pre-meeting signal arrives that the family wants tier optionality, or if the pitch deck draft makes one-number framing impossible (e.g., the trial-pricing structure JR is considering needs to show two numbers — trial + post-trial).

## 2026-04-13 - Tech Spec Sheet for Scott (Operations Manager)

**Decided:** Produce a 1–2 page leave-behind aimed at Scott specifically. Sections: (1) architecture at a glance, (2) authentication & access control, (3) data ownership & hosting flexibility, (4) Ontario ESA compliance engine, (5) integration approach (CSV flat-file with ADP Workforce Now + Counterpoint, deliberately not API-based), (6) production readiness posture, (7) explicit out-of-scope (timekeeping/punch-clock, payroll processing stays in ADP), (8) Phase 2 roadmap pointer, (9) optional hardening tier (multi-region backups, HA DB, 24/7 paged monitoring, pen-testing, higher SLA, audit-grade logging, dedicated staging — priced as add-ons on top of baseline monthly if they opt in). **Data privacy content also lives here** — frees a slide in the main deck.
**Alternatives:** No spec sheet (rejected — Scott is the technical gatekeeper, his concerns will land via email post-meeting if not pre-empted with a take-home artifact). Embed the technical content in the deck itself (rejected — bloats deck for Dan, who doesn't care; better to give Scott his own document). Pure marketing-tone tech sheet (rejected — Scott will see through it; this should read like real engineering documentation in fact-sheet density).
**Rationale:** The pitch is split between two stakeholders with different concerns. Dan reads the price sheet; Scott reads the spec sheet. Producing both lets each take home what they actually need without the deck having to serve two audiences at once. Build last (after deck + price sheet settle) so it absorbs late changes.
**Revisit if:** Scott confirms (via Sarvi) he doesn't want a written artifact, or if the pitch session goes into deep technical discussion that obviates the need.

## 2026-04-13 - Pitch Deck Length: 7 Slides (Proposed, Under Consideration)

**Decided (provisional, S46):** Pitch deck targets ~7 slides. Cover / pain / what it is / business case for scheduling done right / why alternatives fail / Phase 2 roadmap / proposal+handoff. Final shape gets formal plan + clarity round next session before drafting copy.
**Alternatives:** 4–5 slides — rejected, strips out either pain establishment or business-case framing; under-pitches a complex sale to a skeptical family. 10–12 slides — rejected, family defers, long decks invite "we'll think about it"; every slide must earn its keep. 8 slides with split competitor coverage (one for ADP/NCR, one for SaaS) — flagged as open option for next session.
**Rationale:** 7 slides at ~90 sec each = ~10-min pitch. Right size for a working session with a price-first family that loses focus on long pitches. Each slide carries one load-bearing idea; nothing is decoration.
**Revisit if:** Next-session clarity round changes the proposal structure (e.g., dropping the business-case slide if Sarvi feels it overstates), or if Scott's objection requires the split competitor treatment.

## 2026-04-13 - Save Path: batchUpdate-only; adaptive fast path rejected

**Decided:** `batchSaveShifts` uses a single `Sheets.Spreadsheets.Values.update` call that rewrites the whole Shifts data area, regardless of payload size. No per-row fast path. `valueInputOption: USER_ENTERED`, `LockService.tryLock(10000)` with a `CONCURRENT_EDIT` error code on collision.
**Alternatives:** v2.20 adaptive fast path that branched on `actualChangeCount <= 10` to per-row `updateRow`/`appendRow`/`deleteRow` (rejected — Playwright measurement showed Apps Script web-app calls have a ~7-8s fixed overhead per request, so saving ~1s of actual Sheet work via per-row ops is drowned out; no measurable win and added code complexity). Revert to chunked sequential GET writes from v2.18 (rejected — that's where the 20s big-save came from). `Sheets.Spreadsheets.Values.batchGet` for reads on getAllData (tried v2.19/v2.19.1, rejected — FORMATTED_VALUE returns booleans as "TRUE"/"FALSE" strings, FORMATTED_STRING is locale-dependent for date cells, SERIAL_NUMBER needs a column-name list to convert back — every fix added maintenance debt).
**Rationale:** Tonight's Playwright run measured a no-op save (`shifts:[]`, `periodDates:[]`) at 7-8s and a single-shift save at 9s. Per-call Apps Script overhead dwarfs the per-row vs bulk distinction. Bulk is simpler, same perceived perf, wins cleanly on big saves. Getting sub-5s saves requires leaving Apps Script entirely (CF Worker proxy for reads is planned post-demo; writes stay bound until migration).
**Revisit if:** Migrated off Apps Script web-app (Cloud Run, direct Sheets API with OAuth, or Supabase). At that point the per-call floor drops and per-row strategies regain relevance.

## 2026-04-13 - CF Worker Proxy as Next Structural Step (post-demo)

**Decided:** Post-demo path 1 is a Cloudflare Worker that proxies frontend → Apps Script with stale-while-revalidate caching on `getAllData` (60s TTL in Workers KV). Writes pass through uncached. Login reads become ~300ms edge-cached globally; Apps Script stays as source of truth; Sarvi's Sheet view preserved; fully reversible by flipping API_URL back.
**Alternatives:** Tonight-shippable login wins (`loginWithData` combined endpoint + `CacheService` on getAllData payload + pre-warm `ping` on login screen mount) — rejected for tonight because they stack inside Apps Script's overhead floor and become redundant the moment CF Worker ships. Supabase migration (deferred — planned path 2, only when real-time push or audit log becomes a hard requirement, likely with the payroll aggregator initiative). Direct Sheets API from frontend with OAuth-per-user (rejected — loses HMAC session model, loses server-side write validation, and requires every employee to Google-sign-in).
**Rationale:** Free tier covers 100k req/day (we'd use ~5k). Same pattern as Vercel ISR / Next.js `revalidate`. The measurement that forced this decision: Apps Script web-app floor ~7-8s per call, measured with no-op save. No amount of in-stack optimization can push login under ~10s cold; proxy caching is the only way.
**Revisit if:** Real-time push or audit log becomes a hard requirement → jump to Supabase (path 2). Or if CF Worker free tier limits bite (extremely unlikely at this scale).

## 2026-04-13 - Welcome Sweep as Top-Level Overlay (Survives Branch Transition)

**Decided:** The welcome sweep `<div className="welcome-sweep">` is rendered as the first child of each post-login return fragment (4 places: isLoadingData, loadError, EmployeeView, isMobileAdmin, main admin desktop). React reconciles it as the same DOM node across branches because it's consistently at child index 0, so the CSS animation continues smoothly across the loading→main transition. The 1000ms artificial `minDelay` in `handleLogin` is removed — data load now resolves as fast as possible, and the sweep overlay plays its full 900ms independently via `position: fixed; inset: 0; z-index: 200` regardless of which branch is mounted underneath.
**Alternatives:** Keep the sweep only inside the `isLoadingData` branch with the 1000ms minDelay (rejected — min-delay is a hard floor on login even when data arrives faster). Render sweep via `createPortal` to `document.body` (rejected — portals remount if their render position changes across branches). Trigger sweep AFTER dataLoad resolves (rejected — adds 900ms to the critical path). Use a single wrapper component above the branch logic (rejected — the main admin return is 700+ lines; restructuring away from early-returns is invasive).
**Rationale:** The 2026-04-12 decision calling the sweep "inside the existing 1s min-delay — does not add wait time" was wrong in one direction: the min-delay was the floor, not the ceiling. This refactor preserves the brand moment while removing the floor. Fragment-child-0 positioning gives React enough stability to keep the DOM node across the branch swap; empirically verified in browser that the sweep plays smoothly.
**Revisit if:** Login path changes shape (e.g., a loginWithData endpoint lands and there's only one post-login branch).

## 2026-04-13 - PROJECT-ROUTING Retired for RAINBOW Only

**Decided:** This project no longer uses `docs/PROJECT-ROUTING.md` or the `~/APPS/BridgingFiles/ROUTING-MASTER.md` cross-project index. File deleted; RAINBOW row dropped from the master. `~/.claude/commands/handoff.md` Step 3c was condition-gated ("only if this file already exists in the project … absence means the project has opted out. Do NOT create one.") so future Sonnet sessions won't recreate it.
**Alternatives:** Keep PROJECT-ROUTING + update on every session (rejected — RAINBOW is its own island, no cross-project flow with the ATHLETICA/Creative-Partner/Website triangle, so the index was dead weight being dutifully maintained). Strip global handoff rules entirely (rejected — ATHLETICA-STUDIO / Creative-Partner / Website still use routing; can't break them).
**Rationale:** Absence-of-file is a cleaner opt-out signal than a RAINBOW-specific carve-out in global rules. Other projects unaffected.
**Revisit if:** RAINBOW ever needs to reference resources in another project (e.g., payroll aggregator pulling from ATHLETICA-STUDIO exercise DB — unlikely).

## 2026-04-12 - Admin Desktop Header: 4 Visible Actions + Avatar Dropdown

**Decided:** S42 collapsed the admin-desktop right-side toolbar from 7 icon-buttons to 4 surfaces. Visible: Export PDF, Publish, My Requests, avatar dropdown. The avatar button opens a menu containing Add Employee, Manage Staff (with subtle "N inactive" muted-text count, not a yellow badge), Admin Settings, Sign Out. Account menu uses click-outside + Escape to close.
**Alternatives:** Keep all 7 visible (rejected — research in `docs/research/ui-ux-first-principles.md` cites Hick's Law + proximity + progressive disclosure; 7 buttons = cognitive wall). Collapse more aggressively into a 3-button row (rejected — Export + Publish + My Requests are Sarvi's daily actions, burying any of them costs a tap she'd take dozens of times per week). Keep the yellow notification badge on the avatar for inactive count (rejected — state isn't news; badges imply unread/new, inactive employees are just a state).
**Rationale:** Sarvi's daily primary actions stay one click away. Low-frequency account/admin actions go behind a dropdown where discovery still works but visual noise drops. Preserves the OTR rotating-accent identity on the avatar ring and keeps the brand daily-color moment without pinning it to a static icon sprawl.
**Revisit if:** Sarvi reports missing a menu-buried action regularly, or a new primary action needs to land in the header (then promote by frequency, don't just add another icon to the visible row).

## 2026-04-12 - Welcome Sweep on Login (Full-Screen 5-Stripe Rainbow)

**Decided:** On successful login (handleLogin), `welcomeSweep` state flips true. The loading-screen branch (`isLoadingData`) renders a full-screen fixed overlay with 5 horizontal colored stripes (OTR.accents map: red, blue, orange, green, purple). Overlay animates translateX(-100% → 0 → +100%) over 900ms cubic-bezier(0.7, 0, 0.3, 1), then onAnimationEnd fires setWelcomeSweep(false) to unmount. Respects `prefers-reduced-motion` (animation-duration: 1ms). Sits inside the existing 1s min-delay — does not add wait time.
**Alternatives:** Fancier morph / rainbow-sphere revive (rejected — UX Phase 3 deliberately replaced the sphere with ScheduleSkeleton for faster perceived load; adding it back to loading screen undoes that). Short accent-color flash instead of full stripe sweep (rejected — loses the "Rainbow moment" brand hit and reads as a UI blink). Play the sweep only on first login ever (rejected — the moment is cheap, it's the signature welcome, every login is fine).
**Rationale:** The store is literally named "Over the Rainbow." A once-per-login color sweep is the brand door chime. Cost is negligible (50 LOC CSS + state; fits in existing loading window; GPU-accelerated transform). Sarvi reviewed and loved it.
**Revisit if:** Demo feedback says it's excessive, or future mobile/low-end device perf telemetry shows jank.

## 2026-04-12 - Publish Button: Hardcoded White Text (Not THEME.accent.text Auto-Contrast)

**Decided:** TooltipButton `variant="primary"` (used by the admin-desktop Publish button) uses hardcoded `color: '#FFFFFF'` over the rotating accent gradient. Background is still `linear-gradient(135deg, THEME.accent.blue, THEME.accent.purple)` where the two THEME slots are actually `OTR_ACCENT.primary` + `.dark` (rotating). So the gradient changes daily; the text stays white.
**Alternatives:** `THEME.accent.text` (auto-picks white/navy for WCAG) — rejected, JR chose visual consistency over WCAG compliance on one accent rotation (green). Fixed brand blue→purple gradient (rejected — JR wants the daily color-rotation moment preserved on the Publish button; fixed gradient kills it). Rotate text color instead of background (rejected — inconsistent).
**Rationale:** On 4/5 accent rotations (red/blue/orange/purple) white on primary passes or is near-passing WCAG. On green rotation, white-on-green gets ~3.1:1 which fails AA but reads fine for short labels. JR valued brand-moment consistency over strict AA compliance here. Documented trade-off, not an oversight.
**Revisit if:** Accessibility audit flags it, or if Sarvi reports the button being hard to read on green-accent days.

## 2026-04-12 - callerEmail Regression Fixed Backend-Side (Not Frontend Shim)

**Decided:** S41.1 rewrites every protected Code.gs handler to derive `callerEmail` from `auth.employee.email` after `verifyAuth(payload)` instead of destructuring from the payload. Code.gs bumped to v2.16. Frontend unchanged.
**Alternatives:** Frontend shim auto-injecting `callerEmail: getCachedUser()?.email` in `apiCall` (rejected — perpetuates trust-the-client, and the token is already the authoritative identity; shim would paper over the real S37 gap). Keep S40.2's per-site back-compat pattern (rejected — ~30 sites, fragile, next regression would hit the same class again).
**Rationale:** Token is authoritative. Handlers that read `callerEmail` off the payload were reading attacker-controlled data post-S37 anyway (payload could be spoofed; the token can't). Deriving from `auth.employee.email` aligns with the S36 token-first model and closes the whole class. Requires one Apps Script deploy; no frontend ship needed.
**Revisit if:** A future handler needs to act on behalf of a different user (e.g. admin impersonation flow) — then `targetEmail` stays in the payload explicitly, but `callerEmail` (the actor) always comes from auth.

## 2026-04-12 - Payroll Aggregator = Path 1 (Rainbow as Bridge, Not Replacement)

**Decided:** Post-demo, build Rainbow into the aggregator between Counterpoint (clock-in actuals) and ADP (payroll). Rainbow ingests Counterpoint actuals, shows scheduled-vs-actual reconciliation + PTO + OT flags, admin enters bonuses in-app, Rainbow emits an ADP-ready export file. Counterpoint + ADP stay as-is. Pending demo go-ahead + discovery answers from Sarvi (Counterpoint export format, ADP upload format, employee ID consistency, bonus logic).
**Alternatives:** Replace Counterpoint clock with Rainbow punch-in/out (rejected for v1 — fights Counterpoint's POS-register tie-in, higher risk). Full API↔API orchestration with Rainbow middle (rejected for v1 — depends on both vendors' APIs existing and being usable; discover later).
**Rationale:** Owner's pain is re-typing between 3 systems every 2 weeks plus separate bonus workflow. Path 1 is additive (nothing existing breaks), reuses what Rainbow already knows (employees, schedule, PTO, ESA OT), and the bonus-entry UI is a small standalone feature. Full replacement or full API is a v2 conversation after the aggregator proves value.
**Revisit if:** Discovery reveals Counterpoint has no usable export (printed PDF only) — then path 1 is blocked and path 2 becomes cheaper by comparison. Or if owner prefers a full replacement after seeing the aggregator working.

## 2026-04-12 - S39.4 Mobile Admin Extraction Deferred (Honors Prior Decision)

**Decided:** The `if (isMobileAdmin) { return (...) }` branch in App.jsx stays inline. Plan file `lovely-launching-marble.md` listed S39.4 as "extract to `src/MobileAdminView/index.jsx`" but that directly conflicts with the 2026-02-10 "Mobile Admin as If-Branch" decision below. No architectural precondition (state context provider or state library) has been met, so the original rationale still holds. S39.3b/c/d (remaining admin panels) are also deferred post-demo to keep the demo window safe — those extractions are low-risk and can land in a future session.
**Alternatives:** Execute S39.4 anyway via prop drilling (rejected — revives the exact pattern 2026-02-10 rejected, introduces a 30+ prop maintenance burden). Refactor admin state into a context provider first, then extract (rejected for this window — days of work, well outside S39 scope, 2 days from demo).
**Rationale:** Plan was written without cross-checking decisions.md. Following the plan verbatim would have silently overridden a prior decision. Flagging + deferring is the correct move per global rule "Hits something immutable → flag conflict with stakes."
**Revisit if:** Admin state is refactored into a React Context or state library (same revisit condition as the 2026-02-10 decision). At that point S39.4 becomes cheap.

## 2026-04-12 - S36 HMAC Session Tokens + SHA-256 Password Hashing (Stateless)

**Decided:** Login issues `base64url(payload).base64url(HMAC_SHA_256(payload, HMAC_SECRET))` tokens with 12h TTL. Payload = `{e: email, exp: ms, a: isAdmin, o: isOwner}`. `verifyToken_` uses constant-time comparison. Passwords stored as `base64url(SHA_256(uuidSalt + password))` in new `passwordHash`/`passwordSalt` columns. Dual-check on login: hash first, plaintext fallback, migrate plaintext → hash on successful fallback. Admin `resetPassword` writes plaintext so admin UI can display the default; next login re-migrates. `verifyAuth(authArg)` accepts payload object (prefers token, falls back to `callerEmail`) or bare string for legacy callers — unblocks S37 migration without breaking deployed frontend.
**Alternatives:** Stateful session table with rotation + revocation (rejected for pre-demo window — larger sheet surface + extra round trip; revisit after owner meeting). Bcrypt (rejected — no native Apps Script primitive, polyfill overhead). Clear plaintext column immediately on migration (rejected — plan defers removal to S40 after monitoring window confirms migration completion).
**Rationale:** HMAC tokens eliminate trust-the-client. Stateless means no sheet write per request. SHA-256 with per-user salt is native to Apps Script (`Utilities.computeDigest`). Dual-check is non-breaking for users who haven't logged in since deploy. Rotating `HMAC_SECRET` = force-logout-all (documented as the ops path).
**Revisit if:** Owner meeting surfaces a need for revocation/rotation (then add stateful token table). MFA becomes a requirement. Or if S40 confirms migration complete and plaintext fallback can be removed.

## 2026-04-12 - Email Body Not HTML-Escaped (Plaintext Via MailApp)

**Decided:** `buildEmailContent` returns a plaintext body. `MailApp.sendEmail({ to, subject, body, name })` in `backend/Code.gs:1516` sends as plaintext (no `htmlBody`). S34.2 XSS escape applied to the 5 PDF HTML interpolation sites only, not the email builder's 7 candidate sites.
**Alternatives:** Escape email body anyway for defence-in-depth (rejected — would render `&amp;` as literal characters to recipients, breaking legible content). Upgrade email to HTML with `htmlBody` then escape (rejected — out of S34 scope, pre-existing "professional sender email" blocker would also need resolution first).
**Rationale:** HTML escaping only protects HTML contexts. Plaintext email is not an HTML XSS vector. Escaping user-controlled strings there actively harms readability.
**Revisit if:** Email delivery is upgraded to `htmlBody` (then every interpolation in `src/email/build.js` needs `escapeHtml` applied in the same pass).

## 2026-04-12 - PDF + Email Builders Extracted, Circular ESM Imports

**Decided:** `generateSchedulePDF` → `src/pdf/generate.js`, `buildEmailContent` → `src/email/build.js`, `parseLocalDate` + `escapeHtml` → `src/utils/format.js`. New modules import constants (`ROLES`, `ROLES_BY_ID`, `isStatHoliday`, `formatTimeShort`, etc.) directly from `../App`, while `App.jsx` imports the functions back. Relies on ESM live bindings — references inside function bodies resolve at call-time, not at module-eval.
**Alternatives:** Move all shared constants to `src/theme.js` + `src/constants.js` first to break the circle (rejected — much larger diff, pre-demo). Pass constants as function arguments (rejected — noisy call sites, defeats the point of extraction).
**Rationale:** App.jsx shrank -262 lines with surgical risk. Build + smoke-served clean. Circular imports between App.jsx and these extracted modules work because every use of imported symbols happens inside function bodies invoked after module-graph evaluation completes.
**Revisit if:** Module-eval-time use of these constants is ever introduced in the new files (would break circle). Or if S39 extraction moves constants out of App.jsx and eliminates the cycle naturally.

## 2026-04-12 - Chunked-Save Partial Failure = Hard Failure

**Decided:** `chunkedBatchSave` returns `{ success: false, error, data: { savedCount, totalChunks, failedChunks } }` whenever any chunk fails (even if others succeeded). Previously returned `success: true` with a `warning` field, which callers never read.
**Alternatives:** Keep `success: true` with stronger warning plumbing (rejected — two success tiers is a footgun; every caller needs per-caller reasoning about when warning matters). Succeed only if every chunk saved (same behavior, different framing).
**Rationale:** The only safe default is "any lost write = retry required." Callers retain unsaved flag so the user can hit Save again. Matches how users actually understand save operations.
**Revisit if:** A specific caller legitimately wants partial-success semantics (then define an explicit second API, don't overload `chunkedBatchSave`).

## 2026-04-12 - Schedule-Context Toolbar Hides on Non-Schedule Destinations

**Decided:** Mobile admin Row-3 action buttons (Edit/Save/Go Live/Publish) and Row-4 status banner (Edit Mode + Fill/Clear Wk) only render when `mobileAdminTab === 'schedule' || 'mine'`. Hidden entirely on requests/comms.
**Alternatives:** Grey them out / disable them (rejected - greying implies "unavailable right now" but the action isn't unavailable, it's irrelevant to the current destination; teaches users to ignore the toolbar). Keep visible (rejected - clutter, nonsensical context like "Clear Week 1" while reading announcements).
**Rationale:** Same pattern already established for Wk1/Wk2/Mine filing tabs (Row 5). Toolbar items belong to their destination. Reclaims vertical space on mobile.
**Revisit if:** User feedback wants a persistent "Edit" shortcut from any destination (unlikely — bottom nav + tap into schedule is 2 taps).

## 2026-04-12 - Perf: ROLES_BY_ID + toDateKey + React.memo on Grid Cells

**Decided:** Introduced `ROLES_BY_ID` (O(1) lookup map), `toDateKey(date)` (no ISO allocation, no regex split), `React.memo` on `ScheduleCell`/`EmployeeRow`/`EmployeeViewRow`/`EmployeeScheduleCell`, `useCallback` on all handlers passed to grid rows, and `useMemo` for `currentDateStrs`/`allDateStrs`/`todayStr`.
**Alternatives:** Virtualize the grid with react-window (rejected - 14×20 = 280 cells is small enough that memo is sufficient; virtualization adds complexity). Move schedule state to Zustand/Redux to avoid prop drilling (rejected - larger refactor, scope not justified pre-demo).
**Rationale:** The grid was re-rendering all 280 cells on every state change because handlers were inline arrow functions (new ref every render, memo useless). With stable refs + memo, only cells whose inputs actually change re-render. `ROLES.find()` happened in 4-5 hot paths × 280 cells = ~1400 O(n) scans per full render. Date ISO allocations happened ~700 times per render.
**Revisit if:** Schedule grows to 40+ employees or 4+ weeks (280 cells → 1120+, virtualization may win). Or if React Compiler lands and makes manual memoization redundant.

## 2026-04-12 - Card Shadows Use Accent-Color Halos, Not Dark Drop-Shadows

**Decided:** `THEME.shadow.card`/`cardSm` are pure rotating-accent halos around white cards on the dark navy page. Removed the dark `rgba(0,0,0,0.6)` drop-shadow component.
**Alternatives:** Tonal elevation via lighter surface colors (rejected - cards are already maximum-light white). Heavier border (already at 50% accent opacity, can't push further without losing card edge cleanliness). Stronger backdrop blur on cards (rejected - blur is reserved for modals to keep visual hierarchy).
**Rationale:** Per `docs/research/dark-mode-guidelines.md`, dark drop-shadows are nearly invisible on dark backgrounds. Accent-color halos read clearly against navy and reinforce the OTR rotating-accent identity (each session's accent color radiates from cards).
**Revisit if:** Sarvi/owner say cards "float too much" in demo, or if a particular accent (orange/green) reads as too garish.

## 2026-04-12 - Mobile Bottom Nav Active State Derived From Modal/Drawer State

**Decided:** Bottom-nav `activeTab` is computed from which modal/drawer is open (e.g. `mobileMenuOpen ? 'more' : ...`) rather than its own state field.
**Alternatives:** Separate `mobileBottomNavTab` state synced to modal opens via effects (rejected - two sources of truth, easy to drift).
**Rationale:** No new state to keep in sync; tapping a tab just opens the relevant existing modal, and the active highlight follows naturally. Closing the modal automatically returns active to 'schedule'.
**Revisit if:** Bottom nav grows tabs that don't map to a modal (then a real state field is justified).

## 2026-04-12 - AnimatedNumber Supports Decimal Precision

**Decided:** `AnimatedNumber` accepts `decimals`, `suffix`, and `overtimeThreshold` props. Hours display as `12.5h` not rounded `13`.
**Alternatives:** Wrap the int-only version with a parent that splits whole vs fractional parts (rejected - more code, worse animation).
**Rationale:** Hours in this app are .5-precision. Rounding broke the display. The factor-based rounding inside the rAF loop preserves smooth easing at the chosen precision.
**Revisit if:** A consumer needs scientific notation or thousands separators (would need bigger refactor).

## 2026-04-12 - UX Overhaul: 10-Phase Plan

**Decided:** 9 fix categories + 12 improvement proposals executed across 10 phases. CSS foundation first, then THEME, then App.jsx sweep, then mobile views, then integration phases. 4 proposals deferred (smart defaults, container queries, view transitions, OKLCH).
**Alternatives:** Cherry-pick only the quick wins before demo (rejected - JR wants the full overhaul). Separate sessions per phase (rejected - plan is detailed enough to execute sequentially).
**Rationale:** Tuesday demo needs polish. The plan has specific line numbers and code snippets for every change. Execution is mostly mechanical with this level of detail.
**Revisit if:** Demo feedback contradicts any changes (especially bottom nav, glassmorphism, or density toggle). Deferred proposals revisit after demo.

## 2026-04-12 - OTR Accent Colors Are Immutable

**Decided:** The 5 OTR accent colors (Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378) cannot be changed. Other colors (status indicators, text colors, backgrounds) can adapt around them.
**Alternatives:** Darkening green for contrast (rejected - brand color). Shifting cashier purple (rejected - mapped to brand purple intentionally). Desaturating role colors (rejected - Rainbow brand IS vibrant colors).
**Rationale:** These are literal brand colors from OTR's bags/tags/store signage. The app embodies the brand, not the other way around.
**Revisit if:** OTR rebrands or adds new brand colors.

## 2026-04-12 - WCAG Contrast via Proper Calculation (Not Simple Luminance)

**Decided:** Replace simple luminance formula (`0.299*r + 0.587*g + 0.114*b`) with proper WCAG relative luminance + contrast ratio calculation. Compare white vs navy contrast against each accent, pick higher.
**Alternatives:** Lower luminance threshold (rejected - Red 0.410 and Green 0.421 too close, threshold can't split them). Per-color override map (rejected - fragile, breaks if new colors added).
**Rationale:** Green accent gets navy text (6.1:1) instead of white (3.1:1 - fails WCAG AA). All other accents unchanged. Mathematically correct, adapts automatically to any future accent colors.
**Revisit if:** New accent colors added to rotation.

## 2026-04-11 - OTR Dark Navy + Rotating Rainbow Accents

**Decided:** Dark navy `#0D0E22` page background with white `#FFFFFF` content cards. 5 OTR brand colors (red/blue/orange/green/purple) cycle as accent on each app load via localStorage index. Role colors mapped to OTR palette permanently (not rotating).
**Alternatives:** Light mode with terracotta accent (tried first - didn't feel like Rainbow). Full white with rotating accents (tried - gradient background didn't work, cards looked pasted on).
**Rationale:** Dark background matches OTR's actual store aesthetic (stone/copper/wood). Rotating accents literally embody "Over the Rainbow." White cards float on dark with accent-colored glow shadows and borders.
**Revisit if:** Sarvi/owner feedback from Tuesday demo says it's too dark, or if accent rotation confuses users (consider letting user pick their color).

## 2026-04-11 - Luminance-Based Button Text Color

**Decided:** Auto-detect white vs dark navy text on accent-colored buttons using luminance threshold (0.55). Orange gets dark text, all others get white.
**Alternatives:** Always white text (failed WCAG on orange/green), always dark text (bad on blue/purple).
**Rationale:** Only orange accent exceeds luminance threshold. Ensures readability across all 5 accent rotations without manual per-color overrides.
**Revisit if:** New accent colors added to rotation.

## 2026-02-10 - Mobile Admin as If-Branch

**Decided:** `if(isMobileAdmin)` branch in App.jsx | **Over:** separate component (rejected - 30+ state pieces need prop drilling or state library) | **Revisit:** state management library adopted or admin state refactored into context provider

## 2026-02-10 - Desktop-Only Features Exclusion

**Decided:** Employee mgmt, per-employee auto-populate, PDF export excluded from mobile admin | **Over:** full mobile parity (rejected - infrequent tasks, complexity unjustified) | **Revisit:** Sarvi requests on mobile or mobile becomes primary admin device

## 2026-02-10 - GET-with-Params Over POST

**Decided:** All API via GET `?action=NAME&payload=JSON` | **Over:** POST (rejected - Apps Script returns HTML redirect, CORS/parsing failures) | **Revisit:** Google fixes Apps Script POST or backend migrates off Apps Script

## 2026-02-10 - Chunked Batch Save (15-Shift Groups)

**Decided:** Large saves split into 15-shift chunks | **Over:** single request (fails ~8KB URL limit), larger chunks (risk with long names) | **Revisit:** backend migrates off Apps Script GET or POST becomes reliable
