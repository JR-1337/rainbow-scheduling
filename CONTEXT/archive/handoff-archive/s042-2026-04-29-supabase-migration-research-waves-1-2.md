# s042 -- 2026-04-29 -- Supabase migration research waves 1+2

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: yugen baryogenesis -- Apps Script -> Supabase migration shape locked (DB-canonical, Sheet = read-only mirror, UI is edit surface); 7 of 10 research docs landed in `docs/migration/`; Wave 3 synthesis (schema-proposed, sheet-mirror, cutover-rollback) is the next session's job in fresh context.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `be04d32` on `main` (synced with origin); working tree dirty with this handoff's writes (`CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/archive/decisions-archive.md`, `docs/migration/`, `CONTEXT/handoffs/s042-...md`)
- **Sibling repo `~/APPS/RAINBOW-PITCH/`:** untouched (read-only investigation only)
- **Apps Script live deployment:** unchanged
- **Active focus end-of-session:** Apps Script + Sheets -> Supabase Postgres migration is in research/scoping mode. **No execution date set.** No code touched.
- **Skills used this session:** /handoff (this); spawned 7 research subagents (3 Wave 1 Explore + 4 Wave 2 general-purpose, all background-async).

## This Session

**No code changes. Research-only session.**

**Memory writes:**

- `CONTEXT/DECISIONS.md`: NEW entry at top -- `2026-04-29 (s042) -- Migration shape: DB-canonical, Sheet = read-only mirror; admin UI is the edit surface`. Confidence H. Supersedes `2026-04-26 -- Migration off Sheets must preserve Sarvi's direct-edit workflow`.
- `CONTEXT/DECISIONS.md`: 7 older entries archived to `CONTEXT/archive/decisions-archive.md` (forced by 25k ceiling crossing after the new entry). Moved: 2026-04-26 Migration must-preserve-direct-edit (superseded with link); Apps Script floor; Pitch pricing $1,500+$497; Pitch chatbot v4; Pitch deck evidence-thread; Spec.jsx §6 ADP-claim retirement; Post-trial month-to-month. Active file dropped from 25,392 chars to 15,593 chars; 5 active decisions remain (top 5 newest + Supabase ca-central kept active because today's decision references it).
- `CONTEXT/TODO.md`: anchor `aurora plenum` -> `yugen baryogenesis`; new top Active item `Apps Script + Sheets -> Supabase migration: research/scoping (no execution date set)`.
- `CONTEXT/LESSONS.md`: untouched (49,901/25k carried over from s037+).
- `CONTEXT/ARCHITECTURE.md`: untouched (research only, no structural changes).

**New planning folder created:** `docs/migration/` -- 7 of 10 deliverables landed this session, 3 deferred to Wave 3.

- `docs/migration/README.md` -- index of 10 docs across 3 waves; status table; ground rules (research-only, facts-only, source-class flags).
- **Wave 1 (codebase inventory, 3 parallel Explore subagents):**
  - `docs/migration/01-schema-current.md` -- 5 tabs / 104 columns: Employees (24 cols), Shifts (11), Settings (key-value 2), Announcements (5), ShiftChanges (35); top quirk: booleans stored as 'TRUE'/'FALSE' strings; v2.26 additions (adminTier/title) unverified vs live Sheet.
  - `docs/migration/03-appscript-inventory.md` -- 92 top-level functions in `backend/Code.gs`; 22 direct-supabase / 8 edge-function / 8 auth / 24 email-vendor / 8 removed; 1 ScriptProperty secret (HMAC_SECRET); 2 lock sites (`batchSaveShifts`, `bulkCreatePKEvent`).
  - `docs/migration/04-apicall-callsite-map.md` -- 38 callsites / 31 unique actions; 12 missing-revert optimistic-update sites; orphan handler `bulkCreatePKEvent` in dispatch table with zero frontend callers.
- **Wave 2 (mixed codebase + vendor docs, 4 parallel general-purpose subagents):**
  - `docs/migration/05-auth-migration.md` -- current hash is `base64url(SHA-256(uuid_salt + password))` single-round; **Supabase Auth only imports bcrypt or Argon2**, so SHA-256 cannot be imported. One-time first-login reset for all 35 staff is unavoidable. 14 RLS policies across 5 tables; 4 effective tiers (employee / admin2 / admin1 / owner) driven by 3 orthogonal flags (`isAdmin`, `isOwner`, `adminTier`).
  - `docs/migration/06-email-migration.md` -- 21 distinct email types; ~125-200/mo at OTR scale (modeled, not measured); free tier on Resend/Mailgun/AWS SES all cover OTR forever; AWS SES is the only ca-residency option. **Critical flag: `sendBrandedScheduleEmail` may be silent no-op due to auth-gate bug** (auth check shape mismatch flagged by 03 + 06; pairs with the s034-backend-smoke-still-owed item).
  - `docs/migration/07-pdf-migration.md` -- no real PDFs today (browser print-preview only via `src/pdf/generate.js`; backend Code.gs has zero PDF generation despite the brief saying "8 pdf-vendor functions"). Six libraries compared; only Chromium-based renderers (Puppeteer/Playwright on Vercel via `@sparticuz/chromium`) preserve current HTML layout. iPad Safari LESSONS rules (UTF-8, no em-dash, sync popup before await) bind any replacement.
  - `docs/migration/10-supabase-due-diligence.md` -- ca-central confirmed for DB+Auth+Storage; Realtime + logs residency inferred not contractually confirmed. Pro tier $25/mo covers OTR forever; SOC 2 report access requires Team tier $599/mo (forcing-function for prospect compliance asks). Series E $5B Oct 2025 + Apache 2.0 self-host fallback => low rugpull risk; the prior research doc's "Series C, free-tier rugpull risk" framing is stale.

**Cross-doc findings worth surfacing (not yet acted on):**

- `bulkCreatePKEvent` is dead code in production -- handler in dispatch + lock guard + zero frontend callers (per 03 + 04). Either kill or wire up.
- `sendTimeOffCancelledEmail` defined but never invoked (per 03).
- `sendBrandedScheduleEmail` likely silent no-op due to `authResult.success` vs `{authorized}` shape bug (per 03 + 06). Pairs with the long-deferred s034 backend smoke -- worth confirming whether EmailModal works in prod at all before treating that path as load-bearing in cutover plans.
- Test-harness backdoor: hardcoded Sarvi-email bypass per 03.
- adminTier vs isAdmin live side-by-side -- two role models; auth-migration doc proposes resolving in Supabase via app_metadata or `profiles.admin_tier` column; either path requires deciding which flag is canonical.
- "PIPEDA-compliant" framing in pitch deck/Spec.jsx is over-stated per 10; correct claim is "ca-central-1 residency under SOC 2 Type II controls." Pitch sweep needed when migration ships.

**Decanting:**

- **Working assumptions:** my Wave 2 PDF subagent brief said "8 pdf-vendor functions" but Wave 1 inventory had recorded 0 PDF functions in Code.gs -- confused with email-vendor 24 or removed 8. Brief-authoring error; the Wave 2 doc caught and corrected it. Lesson: when chaining waves, re-verify counts/categories from the prior wave's output rather than from my own summary memory.
- **Near-misses:** at the migration-shape decision fork, I almost surfaced Shape A2 (LLM-as-edit-surface from day 1) as a top-tier option after JR mentioned "sarvi can prompt the llm to get rid of whatever she wants." Caught it back to A1 (UI is edit surface, LLM Phase 2) by flagging the cutover-couples-to-unbuilt-agent risk before it landed. Recorded in DECISIONS rejected-alternatives.
- **Naive next move:** "spawn Wave 3 in this session immediately after Wave 2 lands." Wrong -- Wave 3 requires reading all 7 prior docs (each several hundred lines) and synthesizing. Doing it on top of an already-loaded session burns budget for worse synthesis. JR caught this himself by asking about context budget. Right move: handoff -> fresh session reads the 7 docs clean.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active+Blocked+Verification+Completed. DECISIONS schema header present. LESSONS schema header present.
- Char ceilings: TODO 17,890 / 25k OK; **DECISIONS 15,593 / 25k OK (post-archive trim from 25,392 to 15,593 -- forced move per schema, 7 entries relocated)**; LESSONS 48,901 / 25k STILL OVER (carried from s037+, not new this session); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; DECISIONS MD041/MD032 carried (HTML schema header before first heading); em-dashes used liberally in archived entries (project drift, not new).
- Adapter files: not modified.

`Audit: clean (DECISIONS forced-archive trim 25,392 -> 15,593 per schema; LESSONS 48,901/25,000 char ceiling carried; em-dash + MD041 style soft-warns carried)`

## Hot Files

- `docs/migration/README.md` -- index of all 10 planned docs + status table + source-class legend (C / VD / VM / IM / S). Read first when picking up Wave 3.
- `docs/migration/01-schema-current.md` -- needed for Wave 3 doc 02 schema-proposed.
- `docs/migration/03-appscript-inventory.md` -- needed for Wave 3 doc 09 cutover (replacement-class table drives sequencing).
- `docs/migration/04-apicall-callsite-map.md` -- needed for Wave 3 doc 09 cutover (callsite count drives adapter scope).
- `docs/migration/05-auth-migration.md` -- needed for Wave 3 doc 09 cutover (password-reset blast is a load-bearing cutover step).
- `docs/migration/06-email-migration.md` + `07-pdf-migration.md` + `10-supabase-due-diligence.md` -- vendor + library decisions referenced by Wave 3 docs 02/08/09.
- `CONTEXT/DECISIONS.md` -- top entry is the migration shape (load-bearing for Wave 3).
- `CONTEXT/archive/decisions-archive.md` -- received 7 entries this session; reference if a future session needs to re-litigate any of the 2026-04-26 pricing/chatbot/evidence decisions.

## Anti-Patterns (Don't Retry)

- **Don't summarize one wave's output in your own words for use as the next wave's brief.** I lossy-compressed Wave 1's "0 pdf-vendor functions" into "8 pdf-vendor functions" in the Wave 2 PDF brief. The subagent caught it because I asked for source-class flags. Without the flag-out culture, the error would have propagated. Future-self: when chaining research waves, paste relevant facts verbatim from prior docs into the next brief, don't paraphrase.
- **Don't spawn Wave 3 synthesis subagents.** Wave 3 docs (02 schema-proposed, 08 sheet-mirror, 09 cutover-rollback) are decisions, not facts. Per the global subagent-delegation rule, recommendations belong in the parent session. Synthesis docs are main-session work.
- **Don't re-do Wave 1+2 in the next session "for context."** Read the docs in `docs/migration/` -- they are the context. Time-spent rebuilding inventory is time not spent on synthesis.
- **Don't treat `sendBrandedScheduleEmail` as live functionality without confirming the auth-gate bug doesn't make it a no-op.** The s034 backend smoke + EmailModal v2 work both depend on this; verify before treating it as a load-bearing cutover step.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028 through s041 commits with deferred phone-smoke -- carried (no new code commits in s042)
- s034 backend live smoke -- still owed (`sendBrandedScheduleEmail` + duplicate-email mirror check); now flagged as possibly silent-broken per 03 + 06 -- worth a focused smoke when next email-format session happens
- 2 architectural audit items -- since 2026-04-29 (color-only state markers; MobileAdminView<->ColumnHeaderCell column-header consolidation -- needs admin state -> context provider refactor first)
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14 (note: superseded in priority by Supabase migration; if migration ships first the CF Worker becomes moot)
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)

## Key Context

- Supabase migration is **research-only**. No execution date set. No code touched. The folder `docs/migration/` is a planning artifact; the decision to ship is separate from research completeness.
- Migration shape: DB-canonical, Sheet = read-only mirror, admin UI is the edit surface. LLM-driven editing is Phase 2, not cutover. Captured in `CONTEXT/DECISIONS.md` top entry.
- The `docs/research/scaling-migration-options-2026-04-26.md` survey doc remains valid for vendor-matrix context but is now superseded on Supabase specifics by `docs/migration/10-supabase-due-diligence.md`.
- Pitch deck restructure was confirmed already-shipped this session via read-only inspection of `~/APPS/RAINBOW-PITCH/` git log -- 20+ commits since 2026-04-26 covering pricing alignment, AskRainbow chatbot, ESA cap, evidence-thread, slide rewrites, em-dash sweep. Memory pointer `project_pitch_restructure_plan.md` is stale (plan executed, not pending).
- Production URL: `https://rainbow-scheduling.vercel.app`. Bundle hashes from s041: `index-Dby6BZOj.js` / `index-Df2GvNEw.js` / `index-CcXHDOkr.js`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- AGENTS.md is canonical post v5.1 bootstrap; shims rarely need repair.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `yugen baryogenesis`. Top Active is "Apps Script + Sheets -> Supabase migration: research/scoping (no execution date set)".
2. Read `docs/migration/README.md` for the doc index + status table.
3. `git log --oneline -3` should show this handoff commit on top of `be04d32` (s041 handoff).
4. `git status -s` should be clean after this handoff is committed.
5. testguy account currently **Active** (carried from s038).
6. Adapter files: AGENTS.md is canonical post v5.1 bootstrap; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: nothing new this session (research only; no code).
- (b) External gates: same as s041 (s034 backend smoke deferred; phone-smoke for s028-s041 carried).
- (c) Top active TODO: continue Supabase migration research -- Wave 3 synthesis (3 docs).

Natural continuations:

1. **Wave 3 Phase 1: `docs/migration/02-schema-proposed.md`** -- Postgres tables/FKs/indexes/JSONB-vs-column choices derived from `01-schema-current.md`. Main-session synthesis (NOT subagent). Probably 30-60 min in fresh context. Output is the schema design draft Wave 3 docs 08 + 09 build on.
2. **Wave 3 Phase 2: `docs/migration/08-sheet-mirror-design.md`** -- one-way DB->Sheet sync architecture. Depends on 02. Trigger model (Edge Function on row change vs cron) + denormalize rules + accidental-Sarvi-edit handling. Open question: DB webhook retry semantics (per doc 10).
3. **Wave 3 Phase 3: `docs/migration/09-cutover-and-rollback.md`** -- phased sequence + rollback triggers + procedure. Password-reset blast for 35 staff is the load-bearing irreversible step. Depends on all prior docs.
4. **Alternative: real feature work** -- EmailModal v2 PDF, Bug 4 PK 10am-10am, architectural deferred items. Migration research can pause and resume any time; no clock running.

Open with: ask JR which of (1)/(2)/(3) Wave 3 phase to start, OR pivot to (4) feature work.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
