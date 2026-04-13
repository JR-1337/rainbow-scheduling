# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

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
**Decided:** Pitch deck slide 2 leads with the *current cost of the schedule envelope*, not predicted Rainbow savings. Sarvi-confirmed: 16 hr/wk on the full envelope (building schedules + management talks + time-off + swaps + sick-call coverage + schedule push + off-hours, NOT just grid-writing). At $35/hr (conservative GM rate) × 52 weeks = **$29,120/yr**. Slide 2 cites this as the cost OTR pays today. Rainbow's annual cost ($5,964) is the comparison anchor. The actual savings number gets MEASURED during the 3-month fitting trial — the deck does not predict it.
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
