<!-- SCHEMA: DECISIONS.md
Version: 5.2
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
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until char count is at or
  below 60 percent of ceiling (15,000 chars for the 25,000-char ceiling). Cut
  deep on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see decisions-archive.md header below) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
-->

## 2026-05-01 (s049) -- /audit skill v5: caps raised + augmented marker_index + Read Discipline

Decision: Stage 2 inventory caps raised 50k/75k -> 100k/150k and triage caps 30k/50k -> 40k/60k. `build-map.sh` augments `marker_index` to carry `{ path, line, context }` per hit (3-line context, 200 chars cap, 5 hits per marker per file -- map size 161 KB -> 523 KB). Stage 2 Operating rules add Read Discipline as binding: no full-file Reads (Reads must use offset+limit anchored to a marker line); 30 Reads max per pass; 1 Read per file max; demote-to-J when evidence requires Read budget unavailable; self-throttle (`[budget: Nk used, M reads]` per category checkpoint, finalize at 80% of soft cap); parent slices `marker_index` per-category via `jq` before invoking the agent (agent never reads the full ~500 KB map).
Rationale: v4 (50k/75k caps) breached at 127k on the 86-file codebase because the agent treated marker-routed file lists as a Read list rather than a routing hint -- 27 file Reads at ~2-3k tokens each. Codebase grew (~75 -> 86 files) but caps didn't. v5 verified 2026-05-01 at 70k tokens with ~25 findings written to disk -- strict improvement on cost (-45%), recall (+150%), persistence (now writes to `inventory.md`). The win comes from focused looking + map-data-first evidence, not just from raised caps; the Read Discipline rules force commit-or-demote behavior that today's wandering-the-codebase pattern lacked.
Confidence: H -- direct measurement (s048 attempt 127k -> s049 retest 70k), evolution log v5 verdict at `docs/audit-skill-evolution.md`.
Evidence: commits `1527442` (v5 entry in evolution log), `1cd615d` (v5 verified). Skill files at `.claude/skills/audit/SKILL.md` and `.claude/skills/audit/scripts/build-map.sh` (gitignored, local only).

## 2026-05-01 (s048) -- Email design system aligned across all surfaces

Decision: One visual identity for every app-originated email. Both wrappers (frontend `buildBrandedHtml.js` for schedule distribution + backend `BRANDED_EMAIL_WRAPPER_HTML_` for the 19 lifecycle notifications) share the OVER THE / RAINBOW two-line CSS wordmark banner with 32/28 padding (Arial fallback; email clients strip Josefin Sans). Schedule distribution emails carry a static sick-day / late / coverage / time-off policy disclaimer at the bottom in 11px fine-print styling, and the schedule table is now framed by empty navy bars above and below (no column headers -- table is self-evident). Sarvi's 5 admin-bound notifications carry an `askType` label (bold accent uppercase) at the top of the body and an "Open in App" CTA button at the bottom; subjects tightened with leading emoji per type. The 14 staff lifecycle notifications use the aligned banner but no askType/CTA yet (staff are off-limits to email pre-launch per memory rule).
Rationale: One visual identity = instant email-source recognition; admin emails get extra triage signals because Sarvi processes high volume; staff lifecycle minimal until explicitly tweaked. JR explicitly chose static disclaimer (no admin Settings surface) and disclaimer-styling (not policy-block styling).
Confidence: H -- JR-stated + Sarvi reviewed schedule emails 2026-05-01, verified 2026-05-01
Evidence: commits `1dfa218` (disclaimer), `2f42623` (schedule banner + framing), `306bd6f` (notification wrapper align), `3b5c02a` (stale-request error msg), `c155ed4` (subjects + askType + CTA on Sarvi's 5). Backend changes (`306bd6f`, `3b5c02a`, `c155ed4`) drift on live until paste-deploy in otr.scheduler Apps Script editor.

## 2026-04-30 (s047) -- Retire 24h part-time weekly cap violation rule

Decision: `partTimeCap` violation (warn when employmentType=part-time and weekHours > 24) removed from `computeViolations`; constant `PART_TIME_WEEKLY_CAP` deleted.
Rationale: JR confirmed Sarvi schedules part-timers above 24h regularly; the warning fires constantly without changing scheduler behavior, polluting the violations panel with noise that hides actionable rules (consecutive-days, ESA 44h overage). Kept the 40h CAP / 44h ESA OVER_RED, consecutive 6+ days, approved-time-off, and unavailable rules unchanged.
Confidence: H -- JR-stated, verified 2026-04-30
Evidence: commit `e887881`; `src/utils/violations.js`, `src/utils/timemath.js`.

## 2026-04-30 (s046) -- Pre-migration getAllData perf bridge = Apps Script CacheService (not CF Worker / Vercel Edge)

Decision: For the pre-migration window, `getAllData` uses Apps Script's built-in `CacheService.getScriptCache()` to absorb concurrent reads. 600s TTL, ~90KB chunked keys per tab, automatic invalidation via writer wrappers in `updateRow`/`updateCell`/`appendRow` plus 2 inline busts at the direct-delete sites. Cache miss = unchanged 7-8s; cache hit ~2-3s (skips 5 sheet reads, still pays Apps Script cold start + JSON serialize). External edge layers (Cloudflare Worker + KV; Vercel Edge Function + Vercel KV) were considered + rejected for this window. Migration retires the layer at cutover; Supabase RLS reads land sub-200ms regardless.
Rationale: JR direction 2026-04-30 -- "this won't matter anyway after the supabase migration so im thinking we do the inside appscript version of the fix." Bridge code economics: 1-2 hours of Apps Script wrapping > 4-6 hours of edge worker + KV setup + deploy + monitoring, when the entire layer dies in weeks. Vercel Edge would have been preferred over CF Worker if an edge layer were chosen (already on Vercel; one fewer vendor); recorded so the next time someone reaches for "let's add CF Worker" the simpler in-codebase option lands first.
Confidence: H -- direct user direction 2026-04-30 + shipped commit `49b1053` build PASS, Apps Script live deployment redeployed by JR same session.
Rejected alternatives:
- Cloudflare Worker + KV in front of `/exec` -- rejected: another vendor account, edge cache wins (~150ms) overkill for 1-2 concurrent admins at OTR scale; Vercel Edge is the cleaner equivalent if external caching is later needed.
- Vercel Edge Function + Vercel KV -- noted as the right external choice if cache miss times prove insufficient post-deploy; not built this session because Apps Script CacheService is enough at OTR's 1-2 concurrent admin profile.
- Trim `getAllData` payload to 6 pay periods + on-demand range fetch -- rejected: 4-6 hours frontend work (in-memory period cache, direction-aware prefetch, debounce, cancel-prior-fetch) for a marginal incremental win on top of CacheService; deferred to migration which obviates the question.
- Service Worker cache in the browser -- rejected: only helps repeat visits by the same user; CacheService helps every admin sharing the deployment.

## 2026-04-30 (s044) -- Migration vendor + pricing framing locked

Decision: Three Phase 0/4 cutover decisions resolved post-Wave-3. (1) **Custom SMTP for password-reset blast = AWS SES** (ca-central residency aligns with PIPEDA framing; ~$0.10 per 1k emails, free at OTR scale; SPF/DKIM verified during Phase 1). Resend + Mailgun both rejected -- AWS SES wins on residency. (2) **PITR add-on ($100/mo) dropped from Phase 0**; daily 7-day backups (included in Pro $25/mo) are the recovery floor. Revisit only if a customer compliance ask demands it. (3) **Migration is not itemized to OTR** -- treated as table stakes for PIPEDA / Ontario data-residency compliance, not a feature line. Bundled into the existing $497/mo + $125/hr post-trial arrangement. Customer #2 inherits a migrated platform from day one, so the ~$11-19k of dev hours OTR underwrites amortizes across future deals.
Rationale: JR direction 2026-04-30 -- "don't want to spend $100/month" (PITR), "AWS SES sounds good" (SMTP), "shouldn't charge for it because it's a requirement for Ontario security compliance and so if I don't do it they can't use the app at all which defeats the whole purpose" (pricing). The pricing framing is durable: any future customer in Ontario or under similar privacy regimes inherits the same logic, so this is a pricing-philosophy fact, not a one-customer concession.
Confidence: H -- direct user direction 2026-04-30.
Rejected alternatives:
- Resend / Mailgun for SMTP -- rejected: ca-residency story weaker; AWS SES is the only ca-central option among the 3.
- PITR included from Phase 0 -- rejected: $100/mo equals the baseline Pro plan; defer until a customer compliance ask demands it.
- Itemize migration as a separate $11-19k line -- rejected: defeats the offer's coherence (compliant scheduling app is what's being sold; migration is the cost of selling it).

## 2026-04-30 (s043) -- Supabase migration schema design locked (Wave 3 synthesis complete)

Decision: All 10 migration research docs landed. The Postgres schema in `docs/migration/02-schema-proposed.md` becomes the binding design for eventual cutover. Eight design questions resolved by JR: (1) sick days = `type='sick'` row in `shifts`; (2) no forward-compat KV table -- typed `store_config` only; (3) ShiftChanges splits into 4 tables (parent + time_off + offers + swaps); (4) `recipient_id`/`partner_id` are NOT NULL FK populated at insert via email lookup; (5) `legacy_id` columns kept forever for audit; (6) default-password UX uses Supabase `password_reset_required` flag (hard gate at login, replaces today's soft banner); (7) `employmentType` stays soft TEXT with CHECK constraint, not native ENUM; (8) Realtime publishes `shifts` + `shift_change_requests` (parent only) + `announcements`; `profiles` and `store_config` are not published. Cutover plan in `09-cutover-and-rollback.md` -- 7 phases, password-reset blast for 35 staff is the load-bearing irreversible step at Phase 4 T+1:10.
Rationale: Wave 3 synthesis produced a coherent, internally-consistent schema; all 8 open questions had a clear winner once tradeoffs were spelled out (e.g. solo dev + 35-staff scale tilts every "strict vs flexible" call toward simpler/stricter, not toward optionality). The plan sits ready; ship decision is separate from research completeness.
Confidence: H -- direct user direction 2026-04-30 across all 8 Qs; verified by re-reading 02-schema-proposed.md §11 against the 8 letter-answers.

<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md across multiple sessions: 2026-04-26 (s022), 2026-04-26 (s024 -- desktop name col, sick day events, PDF print registry), 2026-04-27 (s028 -- 3 PK entries: PKDetailsPanel sibling, bulk-clear PK by day, PKEventModal dual-mode), 2026-04-29 (s042 -- Migration must-preserve-direct-edit superseded; Apps Script floor; Pitch pricing $1500+$497; Pitch chatbot v4; Pitch deck evidence-thread; Spec.jsx §6 ADP claim retirement; Post-trial month-to-month), and 2026-05-01 (s048 -- ceiling-driven cut: DATA plane scaffolded; Kit BOOTSTRAP v5.1->v5.2; Migration shape DB-canonical Sheet read-only; /audit project-skill single-mode; Mobile schedule name col 60px; Cornell ILR provenance; Recurring fee = operational care; Supabase ca-central Phase 1). -->


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
