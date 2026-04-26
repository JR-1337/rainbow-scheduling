<!-- SCHEMA: DECISIONS.md
Version: 1
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` (optionally with `Superseded by: <link>`); do not erase. See Archive behavior below for move semantics.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 150 lines. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until under ceiling.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see TEMPLATES.md `decisions-archive.md` header) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
-->

## 2026-04-26 -- Pitch chatbot v4: Sonnet 4.6 + extended thinking + heavily-revised system prompt

Decision: AskRainbow.jsx posts to `/api/ask-rainbow` which calls Anthropic Claude Sonnet 4.6 with extended thinking enabled (budget_tokens 2048, max_tokens 4096). Gemini 2.5 Flash fallback path stays in code dormant (no key configured). System prompt restored from JR's original "trial lawyer for John Richmond" template with verbatim TONE block at the bottom, NO PREAMBLE rule (banned "That's a fair question" and similar softening intros). 11 FACTS IN EVIDENCE blocks plus a WHAT FITTING ACTUALLY MEANS context bank (12 bullets, applies broadly to fee, trial, training, customization, risk, ownership, support, data setup, branding, accountability questions) plus a WHAT THE APP DOES NOT DO TODAY block (Phase 2 leak fix). 14-hour defense paragraph supplies fall-back arguments if Sarvi's hour count is challenged. Rate limit 15 req per IP per 6 hours, in-memory bucket. Per-IP query capture to Apps Script -> Sheet still parked.
Rationale: Haiku's first-shipped answers leaned on the "Sarvi 14 hours" anchor every time and led with "That's a fair question" preambles. JR forced reframe toward varied evidence, no preamble, lawyer-with-charm voice. Sonnet 4.6 + extended thinking improves multi-fact synthesis quality. The fitting-context bank gives the bot operational vocabulary applicable to many objection types, not just fee-justification.
Confidence: H -- direct user direction 2026-04-26 + live-prod verification HEAD `8eca952` returning multi-evidence answers with no preamble.
Supersedes: 2026-04-26 -- Pitch chatbot architecture: Claude Haiku 4.5 primary + Gemini fallback via Vercel serverless (entry below in this file).

## 2026-04-26 -- Supabase Postgres ca-central is a Phase 1 fitting deliverable, not Phase 2

Decision: Pitch deck + Spec sheet + chatbot system prompt all commit to Supabase Postgres in the Canada Central region as the data plane post-fitting. Migration off Apps Script + Google Sheets happens during the 3-month fitting trial; OTR's data is in Supabase before any 9-month commitment starts. Auth model (login type, role-access boundaries, password policy, MFA / magic-link options) chosen during fitting per OTR preference. Sarvi's direct-edit workflow preserved either via admin-grid affordances OR mirrored Sheets export -- decided during fitting per the Sheets-direct-edit constraint decision (below).
Rationale: PIPEDA + SOC 2 compliance posture needed an answer in the pitch; "still on Sheets" reads weak in a sales context. Committing to Supabase ca-central makes the data-ownership story concrete and removes the Apps Script 7-8s perceived-latency floor. Customer-visible promise; JR carries the migration cost during fitting.
Confidence: H -- direct user direction 2026-04-26 (selected "Phase 1 fitting deliverable" out of 3 alternatives).
Rejected alternatives:
- Available if compliance/scale demands -- rejected: weaker pitch, defers commitment.
- Phase 2 hardening track -- rejected: leaves fitting on Sheets, postpones the auth + compliance answer.

## 2026-04-26 -- $497/mo recurring is an open retainer; hosting passed through; 12-mo continuity contract on offer

Decision: The $497/month recurring fee is framed as an open retainer covering bug fixes, support response within hours, ongoing minor dev work, and security patches -- no hour cap. Hosting infrastructure (Supabase ca-central) is passed through to OTR at cost, not absorbed into the monthly. New scope or major feature work is quoted fixed-price separately at $125/hr. Bug fixes are always included for as long as OTR runs the app. Continuity guarantee: 12-month service contract on offer + source-code escrow at trial-end so OTR holds the keys regardless of John's availability.
Rationale: Hour-capped retainer creates "watch the clock" friction with the customer that undercuts the trust pitch. JR will not work on the system without payment so the open retainer is sustainable for him; the trade-off is hosting passthrough so OTR carries variable infrastructure cost. Continuity contract preempts the "what if you disappear" objection without raising it unprompted.
Confidence: H -- direct user direction 2026-04-26 (selected "Open retainer (always-available)" out of 3 alternatives).
Rejected alternatives:
- Capped retainer (X hrs/month included) -- rejected: clean expectation but creates clock-watching friction.
- Tier-based (bug fixes always, features quoted) -- rejected: under-promises on the developer-relationship value JR conveys.

## 2026-04-26 -- Pitch pricing restructured: $1,500 implementation + $497/mo from month 1

Decision: The pitch deck and price sheet present the offering as a one-time $1,500 implementation fee plus $497/mo starting month 1, structured as a 3-month fitting trial followed by a 9-month commitment. Year 1 visible $7,464; 3-year total $19,392; net to OTR $71,964 over 3 years. Implementation fee covers fitting Rainbow to OTR's workflow, Sarvi's process tweaks, staff training, and feedback rounds. Internal lever (waive monthly during trial OR waive implementation fee for higher trial monthly) is JR's only and never printed.
Rationale: The prior $2K-post-trial structure put a large back-loaded ask between the customer and the commitment moment. Front-loading the implementation as work-product justification (training, fitting, feedback) removes the "what am I paying for after the trial?" objection and makes the monthly look smaller relative to the visible Year 1 total. Supersedes the S47 pricing decision.
Confidence: H -- direct user direction 2026-04-26.
Rejected alternatives:
- Keep $2K post-trial activation -- rejected: the back-loaded large ask reads as a hidden fee at the worst possible moment.
- $1500 paid in 3-month installments during fitting -- rejected: less clean than a single upfront line; smooths cash but blurs what the fee is FOR.
- $1500 due at month 3 (post-fitting) -- rejected: removes the early-commitment signal the upfront ask provides.

## 2026-04-26 -- Pitch chatbot architecture: Claude Haiku 4.5 primary + Gemini fallback via Vercel serverless (Superseded)

Decision: Pitch deck gains a new slide AskRainbow.jsx between Proposal and Phase2. Interactive Q&A backed by a Vercel serverless function (`/api/ask-rainbow`) that calls Anthropic Claude Haiku 4.5 by default, falling back to Google Gemini 2.5 Flash if `ANTHROPIC_API_KEY` is unset. Per-IP rate limit: 15 requests / 6 hours, in-memory bucket. System prompt anchored in sourced facts only (Gap stable-scheduling, Cornell ILR turnover, CAP replacement cost, Springer family-firms) with hard-banned ESA mentions unless user asks first. Charming-trial-lawyer voice; never escalates.
Rationale: JR's family will think objections faster than the deck can answer them. The chatbot turns the room from "presentation" into "demonstration" without changing the deck's measured tone. Vercel function keeps the API key server-side. Claude Haiku is cheap (~$0.001/answer) and matches JR's existing tooling; Gemini fallback preserves optionality.
Confidence: H -- direct user direction 2026-04-26 + sourced research 2026-04-26.
Superseded by: 2026-04-26 -- Pitch chatbot v4: Sonnet 4.6 + extended thinking + heavily-revised system prompt (top of this file).

## 2026-04-26 -- Migration off Sheets must preserve Sarvi's direct-edit workflow

Decision: Any migration off Google Sheets (to Postgres / Supabase / Neon / D1 / self-hosted) must include EITHER (a) an admin UI that lets Sarvi edit DB rows directly with the same affordances she has in Sheets today (sort, filter, paste a column, tweak a single cell), OR (b) a sync layer that mirrors DB writes back to a Sheets copy so Sarvi's existing Sheets-based workflow keeps working and her edits feed back into the DB. Locked as a pre-design constraint, not an open question. Loss of the Sheets escape hatch is a hard adoption blocker, not a tradeoff.
Rationale: Sarvi performs manual employee-row tweaks, backfills, and exception fixes directly on the spreadsheet today. The sibling project pitch positions Sarvi as the scheduling admin; her current direct-edit ability is part of how she runs ops. A migration that removes this without replacement would either (1) push that work back onto JR or (2) erode Sarvi's confidence in the platform. Either failure mode kills adoption.
Confidence: H -- direct user direction 2026-04-26 ("we could create a system that syncs it to the spreadsheet or create a UI for the database that allows sarvi to directly edit in the same way she can edit these sheets. her edits get fed back into the database").

## 2026-04-26 -- Apps Script 7-8s call floor is internal migration motivation only, not pitch material

Decision: The Apps Script web-app ~7-8s call floor (documented in `CONTEXT/LESSONS.md` and `backend/Code.gs:85`) is the dominant user-perceived latency in the current stack and the strongest reason to migrate off Apps Script. It does NOT appear in pitch decks, customer-facing copy, or family-facing demo material. Migration urgency is captured internally; current performance number is not surfaced.
Rationale: JR direction 2026-04-26 -- "I don't want the 8 second lag times in the pitch. appscript is our current system. it's enough to know that I should migrate away from it asap." Pitch math leads with confirmed customer cost-of-doing-nothing (Sarvi 14 hrs/wk, $25,480/yr) and product cost; current-stack lag is not a pitch claim. Internal: confirms migration sequencing -- Apps Script departure is the highest-impact move; DB choice is secondary (per `docs/research/scaling-migration-options-2026-04-26.md`).
Confidence: H -- direct user direction 2026-04-26.

## 2026-04-26 -- PK details surfaced near announcements as a shared sibling panel

Decision: New shared component `src/components/PKDetailsPanel.jsx` aggregates PK events across all employees into unique `{date, startTime, endTime}` slots within the active period. Per slot it shows day label, time range, booked count, employee names (first 3 + `+N more`), and optional note. Returns null when no PK in period (non-invasive guarantee). Mounted as a sibling AFTER the announcement panel on 4 paths: desktop admin grid (`src/App.jsx` ~L2376), mobile admin comms tab (`src/App.jsx` ~L1888), desktop employee grid (`src/views/EmployeeView.jsx` ~L860), mobile employee alerts sheet (`src/MobileEmployeeView.jsx` ~L767). All 4 scoped to full pay period (`dates`, not `currentDates`) to match announcement scope.
Rationale: JR's polish list item — "PK details visible near announcements when PK is booked." Single shared component prevents drift across 4 surfaces (mobile/desktop x admin/employee). Sibling-not-nested keeps announcement components untouched, satisfying "non-invasive." Period-scope (vs week-scope) matches announcement scope so the PK panel always shows what the admin/employee should know about for the period they are viewing.
Confidence: H -- verified 2026-04-26 build PASS at `0fe138c` (modern 488.13 kB / 123.25 kB gzip, +2.46 raw / +0.56 gzip vs `1d26daf`; legacy 508.75 / 124.83). Smoke skipped per JR direction; prod phone-smoke pending.
Rejected alternatives:
- Embed PK summary INSIDE the announcement panel components -- rejected, requires modifying 4 announcement components, breaks the non-invasive rule, couples PK rendering to announcement state.
- Week-scope (`currentDates`) on employee paths -- rejected, would split the source-of-truth between admin (period) and employee (week); employees viewing the schedule for the period should see all PK they may need to attend, not only this-week PK.
- Show only future PK or hide past PK -- rejected, period view is calendar-aligned not now-aligned; PK already booked in earlier-week shows correct context for the whole period.

## 2026-04-26 -- Bulk-clear PK by day from outside the modal (unsaved-mutation pattern)

Decision: New per-day PK clear affordance lives on the Schedule Clear dropdown (desktop) and Clear sheet (mobile). Per-day rows appear ONLY when >=1 PK booking exists on that date in the active week. Tap opens `AutoPopulateConfirmModal` with new `clear-pk-day` variant ("Clear all N PK booking(s) on Day, Month DD?"); confirm fires `clearPKForDate(dateStr)` which mutates `events` state + sets unsaved (matches `clearWeekShifts` pattern). Admin clicks SAVE on schedule to persist via existing `batchSaveShifts` path. New helper `daysWithPKInWeek(weekDates)` (App.jsx, useCallback-wrapped for prop identity stability) is shared between the desktop dropdown and the mobile sheet via prop.
Rationale: JR's polish list item — needed an affordance to clear all PK on a chosen day in one move without opening PKEventModal. Per-day granularity (not all-PK-in-week) gives precise control. Unsaved-mutation pattern matches `clearWeekShifts` semantics so admin can review + undo by not saving (different from inside-modal Save which fires immediate `batchSaveShifts`). This split is intentional: outside-modal = unsaved-with-undo, inside-modal = immediate-save-with-revert-on-failure.
Confidence: H -- verified 2026-04-26 build PASS at `63420ce` (modern 485.67 kB / 122.69 kB gzip, +1.93 raw / +0.68 gzip vs `78f02d7`; legacy 506.33 / 124.34). Smoke skipped per JR direction; prod phone-smoke pending.
Rejected alternatives:
- Always-visible "Clear All PK This Week" entry (no per-day granularity) -- rejected, too coarse; admin often wants to clear one specific day.
- Persist immediately like the modal -- rejected, breaks UX symmetry with `clearWeekShifts` (admin expects unsaved + SAVE step on Schedule grid mutations).
- Backend `bulkDeletePKByDate` handler -- rejected, client-side mutate + existing `batchSaveShifts` is sufficient and avoids manual-deploy friction (same rationale as the 2026-04-26 PKEventModal dual-mode decision).

## 2026-04-26 -- PKEventModal dual-mode (create + edit) via existing-events derivation

Decision: `src/modals/PKEventModal.jsx` accepts a new `events` prop. The modal computes `existingPKBookedIds` for the selected `{date, startTime, endTime}` window. When the set is non-empty (`isEditMode = true`), initial check state mirrors the booked set instead of availability eligibility; Save dirty-state covers adds AND removes (`isDirty = addIds.length + removeIds.length > 0`); Save label reads `Save (+N -M)`. When empty (create mode), the historical eligibility-default UX is preserved. `handleBulkPK` in `src/App.jsx` drops the `bulkCreatePKEvent` API call in favor of the unified period-save path: adds synthesize PK event rows client-side, removes drop matching entries from `events[empId-date]`, both persist atomically via existing `apiCall('batchSaveShifts')`. Reverts state on failure. Saturday quick-pick button gains an active-state visual (filled brand accent + 2px glowing ring + `✓` glyph) and toggle-back behavior (tap-again reverts date + times to today's defaults).
Rationale: Bug JR hit -- deselecting a booked person left Save greyed, modal couldn't edit existing PK. Old modal was create-only; this unifies create + edit on one surface so admin doesn't need a separate "delete PK" path. Single period-save also makes adds + removes atomic from the user's perspective. Saturday button visual: prior outline-only style was insufficient feedback that "save will book on Saturday" -- explicit JR instruction ("more distinct"); toggle-back is the natural inverse.
Confidence: H -- verified 2026-04-26 build PASS at `78f02d7` (modern 483.74 kB / 122.01 kB gzip, +1.77 raw / +0.74 gzip vs `5f5f16f`); localhost Playwright full round-trip PASS (book on Sat May 2 -> reopen edit mode -> deselect -> Save (-1) enabled -> save -> back to create mode), 0 console errors. Prod phone-smoke pending.
Rejected alternatives:
- Add backend `bulkDeletePKEvent` handler symmetric with `bulkCreatePKEvent` -- rejected, requires JR manual deploy + new auth + new audit; client-side mutate plus existing `batchSaveShifts` is sufficient and avoids deploy friction.
- Keep `bulkCreatePKEvent` for adds + add only `bulkDeletePKEvent` for removes -- rejected, splits the save path into two API calls, breaks atomicity from user's perspective.
- Modal `clearWeekShifts`-style pattern (mutate + setUnsaved + admin clicks schedule Save later) -- rejected, modal Save should persist immediately like the prior bulkCreatePKEvent UX did.
- Initial checks default to UNION of `wasBooked or eligible` in edit mode -- rejected, would auto-add eligible-but-unbooked people on every reopen which surprises admins.

<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md on 2026-04-26 (s022) and 2026-04-26 (s024 -- desktop name col, sick day events, PDF print registry) -->

<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
