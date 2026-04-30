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

## 2026-04-29 -- DATA plane scaffolded with gold-sources inventory

Decision: RAINBOW adopts the kit's DATA/ scaffold per `DATA_CAPTURE_BOOTSTRAP.md` v5.2. Catalog at `DATA/catalog.md`; validator at `scripts/validate-data-catalog.sh`. Single first entry: `rubrics/gold-sources-inventory.md` -- forward-looking map covering Apps Script API surface, Sheets schema, frontend constants/theme, brand palette, PDF generator + layout registry, statutory citation discipline. PII boundary called out explicitly (live Sheets data is cloud-only, never in repo).
Rationale: Live employee/shift/request data is PII in the production Google Sheet; duplication into `DATA/fixtures/` is forbidden. In-tree gold (Apps Script source, constants, theme, schema doc, PDF code, ontario.ca citations) is canonical -- mirroring would create sync drift. Future capture targets (Apps Script response samples, PDF render exemplars, Playwright screenshots) require a synthesizing pipeline before promotion.
First-loop candidates: Apps Script API regression OR PDF render regression (both have concrete failure modes documented in LESSONS).
Confidence: M

## 2026-04-29 -- Kit BOOTSTRAP v5.1 -> v5.2 + LESSONS reshape

Decision: Schemas marched 5.1 -> 5.2 across TODO/DECISIONS/ARCHITECTURE/LESSONS via header+template refresh; bodies byte-identical for TODO/DECISIONS/ARCHITECTURE. LESSONS reshape (Step 10e): 90 v3 entries -> 94 v5.2 entries (2 compound splits: PDF UTF-8 -> 3 children, Apps Script ownership -> 3 children). 1 pre-existing v5.2 entry (OTR brand colors) preserved. 10 organizational section headings (## Apps Script and Sheets platform, ## CSS theme and rendering, etc.) preserved verbatim as project-specific extensions.
Rationale: 5.1 -> 5.2 is a minor patch with no schema-field changes; cap raised 25 -> 35 mid-session for batch 1 of consumer sweep, then RAINBOW used 3 parallel subagent batches of 30 to clear all 90 deferred LESSONS in one session per JR direction.
Provenance residue: most reshaped entries carry `<unknown commit>` Provenance because subagent git-log windows were 50-100 commits, shallower than RAINBOW's deeper history. A targeted provenance-recovery pass could backfill many; deferred to a follow-up if needed.
Confidence: H -- driven from kit chat per `feedback_bootstrap_runs_from_kit_chat.md`.

## 2026-04-29 (s042) -- Migration shape: DB-canonical, Sheet = read-only mirror; admin UI is the edit surface

Decision: Apps Script + Sheets-as-source-of-truth retired. Supabase Postgres ca-central becomes the source of truth; the existing Google Sheet is repurposed as a read-only downstream mirror written by a background sync job (Supabase Edge Function on row change OR scheduled cron). Frontend reads/writes Supabase directly via `@supabase/supabase-js`; Apps Script `/exec` is decommissioned after a ~2-week dormancy window. Sarvi's edit surface at cutover is the existing admin UI in the app (today's grid + employee panel + modals), not the Sheet. Sheet edits made by Sarvi after cutover are NOT synced back -- the sync is one-way DB → Sheet. LLM-driven edit interface ("Sarvi prompts the bot to remove/modify rows") is an explicit Phase 2 follow-on, not a cutover requirement.
Rationale: JR direction 2026-04-29 -- chose Shape A (DB-canonical, read-only Sheet mirror) over two-way sync (B) and admin-UI-replaces-Sheets-entirely (C); the website doesn't wait on Apps Script's 7-8s floor, and Sarvi keeps a familiar viewing surface even though edits move to the app. Two-way sync rejected for race-condition + duplicate-event risk on a solo-dev codebase. Admin-UI-only (no Sheet at all) rejected because the read-only mirror is a cheap insurance + audit artifact at near-zero ongoing cost. LLM-as-edit-surface deferred because coupling cutover to an unbuilt agent doubles the risk window.
Confidence: H -- direct user direction 2026-04-29.
Supersedes: 2026-04-26 -- Migration off Sheets must preserve Sarvi's direct-edit workflow. The "must preserve direct-edit IN SHEETS" constraint is retired; replacement is "Sarvi edits in the app's admin UI; Sheet is view-only mirror." The Phase 1 deliverable + ca-central + auth-during-fitting framing in the 2026-04-26 Supabase entry above remain valid.
Rejected alternatives:
- Two-way Sheet ↔ DB sync (Shape B) -- rejected: race conditions + conflict resolution + duplicate-event risk too high for solo dev.
- Admin UI replaces Sheet entirely, no mirror (Shape C) -- rejected: cheap insurance + Sarvi viewing comfort lost for no real upside.
- LLM chatbot as primary edit surface from day one (Shape A2) -- rejected: couples migration cutover to an unbuilt agent; deferred to Phase 2.

## 2026-04-29 (s039) -- /audit project-skill: single-mode (cheap), no specialists, no flags

Decision: Project-local skill at `.claude/skills/audit/` is the durable mechanism for finding regressions and surfacing tech-debt items. Pipeline = Bash codebase map (cached) + static analysis (knip + jscpd via npx) + one Sonnet 4.6 generalist inventorying all 12 categories + Sonnet 4.6 triage producing Bucket 1 / Bucket 2 / Non-findings + dated report at `docs/audit-YYYY-MM-DD-<slug>.md`. Two invocations only: `/audit` (full src/, ~80 files) and `/audit session` (files changed since most recent `sNN handoff:` commit + working tree). Token budgets: 50k inventory cap (75k hard), 30k triage cap (50k hard). K-exclusion list explicitly documents the Apps Script `/exec` URL in `src/utils/api.js:6` as not-a-secret (auth lives in payload token). The skill files live under `.claude/` (gitignored); only the evolution log + per-run audit reports are tracked. Specialist modes (5 parallel Opus tracks) and hybrid modes (Opus only on correctness) were considered + rejected.
Rationale: JR direction 2026-04-29 -- "keep this simple. one audit skill and thats it. cheap, works well. done." Phase D measurement showed v4-cheap landed ~50k tokens for 22 findings vs v3 specialists at ~347k tokens for 25 findings; v4-cheap missed ~3 correctness bugs v3 caught but added 3 v3 missed. Trade accepted: ~30% missed-correctness-bug rate vs ~5x cost reduction. Diff-vs-prior surfaces persistent bugs across runs so most missed I findings are caught on subsequent sweeps. Auto-memory `feedback_simple_skills` captures the underlying preference for one-mode tooling over multi-mode flag-rich designs; future internal tooling should respect it.
Confidence: H -- direct user direction 2026-04-29 + 4 audit-pass measurements over the same scope (`docs/audit-skill-evolution.md`).
Rejected alternatives:
- 5-Opus parallel specialists (full mode) -- rejected: 5x token cost for ~30% better correctness coverage; missed-bug class doesn't cost enough at OTR scale.
- /audit --hybrid (Opus only on correctness, Sonnet on others) -- rejected with the same simplicity argument; pay measurement evidence first if correctness misses bite in production.
- Subdirectory scoping (/audit src/views) -- rejected: leaky abstraction; JR shouldn't need to know src/ tree topology to invoke the audit. Map handles routing internally.

## 2026-04-27 (s027) -- Mobile schedule name column tightened to 60px + card restructured to title-eyebrow / first / last / hours across all 4 schedule render paths

Decision: NAME_COL_WIDTH lowered from 72 to 60 in `MobileAdminView.jsx` and `MobileEmployeeView.jsx`. `tableLayout: 'fixed'` added to the schedule `<table>` so width declarations enforce against unbreakable strings (e.g. TEST-ADMIN1-SMOKE was expanding the column to 117px on 390px viewports because table-layout:auto fits the longest token). `maxWidth: NAME_COL_WIDTH` added to the sticky `<td>` as a hard cap. Card layout reordered across all 4 schedule render paths (mobile admin/employee + desktop EmployeeRow + desktop EmployeeView): title eyebrow on top (small caps, muted, 9px mobile / 9px desktop, +0.4px tracking), first name as focal point (12px font-semibold mobile / text-xs desktop), last name underneath (9px / 10px desktop muted), hours line at bottom (admin paths only). All `<p>` use `truncate` so first-name overflow clips with ellipsis.
Rationale: JR caught mobile staff list rendering at ~30% of viewport ("takes up half the screen") because table auto-layout was breaking the 72px declaration. Three-part fix layers: tighten the declared width, switch to fixed table-layout so the declaration enforces, and add a maxWidth so even fixed layout cannot grow beyond the cap. Card restructure follows JR's spec (title above first, first above last, clip on overflow) and the visual-hierarchy / typography research read this session (Creative-Partner `L0-06`, `L0-07`, `L1-07`, `applied-app-ui.md`): squint test passes via 12px focal + ALL-CAPS muted eyebrow + 9px tertiary; condensed cell tolerates the weak 12:9 size ratio because tracking + uppercase + muted color push the eyebrow back visually. All 4 paths in one commit per mobile-desktop parity rule.
Confidence: H -- verified 2026-04-27 build PASS at `41844d6` then `8978161` (eyebrow bump 7px -> 9px); Playwright prod smoke at bundle `index-DbbdHU0t.js` confirmed cell width = 60px (was 117px), TEST-ADMIN1-SMOKE clipped to "TEST-..." with ellipsis, console errors 0; eyebrow visual not yet verified because no employee in current Sheet has `emp.title` populated.

## 2026-04-27 (s027) -- Cornell ILR (2021) provenance source-verified to ILR Review (2022, Choper/Schneider/Harknett, "Uncertain Time", Shift Project)

Decision: The "21-35% / 7-month" turnover stat carried in chatbot FACT 2 + Ripple.jsx Card 4 is now cited as ILR Review (2022, Choper/Schneider/Harknett, "Uncertain Time: Precarious Schedules and Job Turnover in the U.S. Service Sector"), Shift Project panel of 1,827 hourly retail and food-service workers. Year corrected from 2021 to 2022 (working paper appeared 2019; journal publication January 2022). 21% on-call + 35% short-notice + 7-month follow-up window all confirmed via web search of the SAGE journal page + Equitable Growth working-paper PDF + Harvard Shift Project page. Provenance check that was open since s026 audit is closed.
Rationale: s026 anti-pattern flagged the stat as not source-verified inside `pitchdeck/pitchDeckResearch4OTR.md`; the rule was either resolve URL or replace with Bergman/Song M&SOM 2023. Resolve path won because the citation is real and well-anchored, just had wrong year + missing paper title. Family Googling now lands on the actual paper.
Confidence: H -- verified via web search 2026-04-27, three-source convergence (SAGE doi 10.1177/00197939211048484 + Equitable Growth + Harvard Shift Project) + chatbot FACT 2 + Ripple.jsx Card 4 updated at HEAD `fc48565` on RAINBOW-PITCH prod.

## 2026-04-26 (s026) -- Recurring fee scope reframed as operational care, no retainer language; OTR pays all hosting providers directly

Decision: $497/month is described in Spec.jsx §9 and Price.jsx Monthly fee row as covering operational care of the system: monitoring and uptime, automated backups, dependency and security patching, schema migrations as Sarvi's needs evolve, small fitting adjustments after the trial, and onboarding new staff to the admin tools. Bug fixes in shipped features always included. New scope or major feature work quoted fixed-price separately. Hosting reframed: OTR pays all hosting providers directly at cost (Supabase ca-central named for Canadian work-data compliance); Rainbow handles setup and ongoing management. No "retainer" word anywhere in customer-facing artifacts.
Rationale: JR direction 2026-04-26 -- "i don't wanna say development retainer even though it kinda is the reason id stick around after selling it." The retainer framing reads as developer-revenue-protection; the operational-care list reads as work-the-customer-actually-gets and lets the items justify the fee on their own merits. Hosting passthrough was creating contradictions across artifacts (some said Rainbow includes hosting, some said OTR pays); resolving to OTR-pays-everything cleans the story and forces Rainbow to justify the monthly via operational care alone.
Confidence: H -- direct user direction 2026-04-26 + verified across Spec.jsx `0de39e8` and Price.jsx `370b612`.
Supersedes: 2026-04-26 -- $497/mo recurring is an open retainer; hosting passed through; 12-mo continuity contract on offer (entry below in this file). The 12-month continuity contract on offer remains valid (Spec.jsx §12 unchanged); the open-retainer + hosting-passthrough framings are the parts retired.

## 2026-04-26 -- Supabase Postgres ca-central is a Phase 1 fitting deliverable, not Phase 2

Decision: Pitch deck + Spec sheet + chatbot system prompt all commit to Supabase Postgres in the Canada Central region as the data plane post-fitting. Migration off Apps Script + Google Sheets happens during the 3-month fitting trial; OTR's data is in Supabase before any 9-month commitment starts. Auth model (login type, role-access boundaries, password policy, MFA / magic-link options) chosen during fitting per OTR preference. Sarvi's direct-edit workflow preserved either via admin-grid affordances OR mirrored Sheets export -- decided during fitting per the Sheets-direct-edit constraint decision (below).
Rationale: PIPEDA + SOC 2 compliance posture needed an answer in the pitch; "still on Sheets" reads weak in a sales context. Committing to Supabase ca-central makes the data-ownership story concrete and removes the Apps Script 7-8s perceived-latency floor. Customer-visible promise; JR carries the migration cost during fitting.
Confidence: H -- direct user direction 2026-04-26 (selected "Phase 1 fitting deliverable" out of 3 alternatives).
Rejected alternatives:
- Available if compliance/scale demands -- rejected: weaker pitch, defers commitment.
- Phase 2 hardening track -- rejected: leaves fitting on Sheets, postpones the auth + compliance answer.

<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md across multiple sessions: 2026-04-26 (s022), 2026-04-26 (s024 -- desktop name col, sick day events, PDF print registry), 2026-04-27 (s028 -- 3 PK entries: PKDetailsPanel sibling, bulk-clear PK by day, PKEventModal dual-mode), and 2026-04-29 (s042 -- Migration must-preserve-direct-edit superseded; Apps Script floor; Pitch pricing $1500+$497; Pitch chatbot v4; Pitch deck evidence-thread; Spec.jsx §6 ADP claim retirement; Post-trial month-to-month). -->


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
