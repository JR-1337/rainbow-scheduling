# s043 -- 2026-04-30 -- Supabase migration research wave 3 (synthesis complete)

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: scumble holography -- All 10 Supabase migration research docs landed; schema design + sheet-mirror + cutover-rollback locked in `docs/migration/`. No execution date set. Plan sits ready until JR sets a ship window.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `d983066` on `main` (synced with origin); working tree dirty with this handoff's writes (`CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `docs/migration/02-schema-proposed.md` + `08-sheet-mirror-design.md` + `09-cutover-and-rollback.md` + README, `CONTEXT/handoffs/s043-...md`).
- **Apps Script live deployment:** unchanged.
- **Active focus end-of-session:** Supabase migration is in **research-COMPLETE/scoping** mode. All 10 docs landed; ship decision separate from research. Phase 0 entry point per `09 §3` is "Supabase project + DDL + RLS"; safe to start any time.
- **Skills used this session:** none (main-session synthesis only); `/handoff` invoked at session end.

## This Session

**No code changes. Research-only synthesis session.**

**Wave 3 docs landed (3 of 10, completing the set):**

- `docs/migration/02-schema-proposed.md` -- Postgres schema. Auth via Supabase Auth + `profiles` mirror; `shifts` table with partial-unique on `(employee_id, date, type) WHERE type IN ('work','pk','sick')`; `store_config` singleton replacing typed Settings keys; 4-table split for ShiftChanges (parent + time_off + offers + swaps); JSONB shape contracts; full migration value-transform table (Sheet -> Postgres); indexes catalog. **All 8 open questions resolved by JR mid-session** (folded into doc §11 as resolved-decisions table).
- `docs/migration/08-sheet-mirror-design.md` -- one-way DB -> Sheet sync. Architecture: Database Webhook -> Edge Function `sync-to-sheet` -> Sheets API, with nightly cron (02:00 ET) full-refresh as catchup safety net. Per-table denormalize logic; 35-col ShiftChanges row reassembled via `v_shift_changes_mirror` view. Format conversions (BOOL -> 'TRUE'/'FALSE', JSONB -> JSON-stringify, etc.). Sheets API quota analysis (60 writes/min/user with 500ms debounce keeps OTR <12% utilized). Accidental-Sarvi-edit handling = banner + live overwrite + nightly catchup (no protection wall). 5 open questions for Phase 1 build, none load-bearing for synthesis.
- `docs/migration/09-cutover-and-rollback.md` -- 7-phase plan. **Phase 0** Foundations (Supabase project, DDL, RLS, seed). **Phase 1** Backend parallel build (8 Edge Functions per `03` replacement-class table; mirror function deployed but webhook triggers not installed). **Phase 2** ETL Sheets -> Postgres with diff verification. **Phase 3** Auth migration (35 staff `auth.users` rows with `password_reset_required=true`). **Phase 4** Cutover Day (~2hr window): frontend Vercel deploy + mirror enabled + password-reset blast email at T+1:10 -- the **load-bearing irreversible step**. **Phase 5** 14-day soak. **Phase 6** decommission. Rollback procedures phase-by-phase: trivial pre-Phase-4, hard-but-possible during Phase 4 before reset blast, increasingly expensive through Phase 5 (linear in day count), one-way after Phase 6.

**8 schema-design Qs resolved by JR (locked in 02-schema-proposed.md §11 + DECISIONS.md):**

| # | Topic | Pick |
|---|---|---|
| 1 | Sick-day storage | row in `shifts` with `type='sick'` |
| 2 | Forward-compat KV | dropped; typed `store_config` only |
| 3 | ShiftChanges shape | 4-table split |
| 4 | Recipient/partner FKs | NOT NULL FK populated at insert via email lookup |
| 5 | `legacy_id` retention | keep forever |
| 6 | Default-password UX | Supabase `password_reset_required` (hard gate, not soft banner) |
| 7 | `employmentType` shape | soft TEXT with CHECK |
| 8 | Realtime publications | `shifts` + `shift_change_requests` parent + `announcements` only |

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `yugen baryogenesis` -> `scumble holography`. Top Active item updated from "research/scoping" to "research/scoping COMPLETE" with all 10 doc names listed and Phase 0 entry point called out.
- `CONTEXT/DECISIONS.md`: NEW entry at top -- `2026-04-30 (s043) -- Supabase migration schema design locked (Wave 3 synthesis complete)`. Confidence H. Records the 8 resolved Qs in one tight entry. Active file 17,907 chars / 25k OK.
- `CONTEXT/LESSONS.md`: untouched (still 68,794/25k carried from s037+).
- `CONTEXT/ARCHITECTURE.md`: untouched (research only, no structural changes; Supabase architecture is research-stage, not yet in ARCHITECTURE.md).

**Decanting:**

- **Working assumptions:** mid-session question framing for the 8 schema Qs followed JR's `feedback_simple_skills` pattern -- give one strong recommendation per Q with effects spelled out, not multi-option menus. JR confirmed all 8 picks matched my suggestion. The framing approach is durable -- record-worthy as method for future research-Q sessions but not as a one-off lesson.
- **Near-misses:** considered offering a hybrid "Realtime-listener-in-Edge-Function" architecture for the sheet mirror in 08, then rejected because Edge Functions are request-scoped (no persistent listener). Kept the rejection in 08's "alternatives" table so future-self doesn't re-tempt it.
- **Naive next move:** "spawn subagents for the 3 Wave 3 docs in parallel." Wrong -- the s042 anti-pattern explicitly says Wave 3 is decisions, not facts; main-session synthesis only. Followed the rule; each doc was sequential main-session work building on the prior.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active+Blocked+Verification+Completed. DECISIONS schema header present.
- Char ceilings: TODO 18,093 / 25k OK; DECISIONS 17,907 / 25k OK; **LESSONS 68,794 / 25k STILL OVER (carried from s037+, not new this session)**; ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; DECISIONS MD041/MD032 carried; em-dash drift in archived entries carried.
- Adapter files: not modified.

`Audit: clean (LESSONS 68,794/25,000 char ceiling carried; MD041 + MD032 + MD034 style soft-warns carried)`

## Hot Files

- `docs/migration/README.md` -- index; status table now shows all 10 docs landed.
- `docs/migration/02-schema-proposed.md` -- Postgres schema; binding for eventual DDL. §11 resolved-decisions table is the load-bearing summary.
- `docs/migration/08-sheet-mirror-design.md` -- mirror architecture; Phase 1 of cutover builds against this.
- `docs/migration/09-cutover-and-rollback.md` -- 7-phase plan; Phase 0 = Supabase project + DDL + RLS is the entry point when JR sets ship date.
- `docs/migration/01-schema-current.md` + `03-appscript-inventory.md` + `04-apicall-callsite-map.md` + `05-auth-migration.md` -- all referenced extensively by the new Wave 3 docs; load if Phase 0 work begins.
- `CONTEXT/DECISIONS.md` -- top entry is the schema-locked record (s043). Second entry (s042) is the migration shape. Third+fourth entries (s042) are kit BOOTSTRAP v5.2 + DATA plane scaffolding.
- `CONTEXT/TODO.md` -- top Active item is the migration with all 10 docs listed.

## Anti-Patterns (Don't Retry)

- **Don't re-do the 8 schema Qs.** They are answered, locked in `02-schema-proposed.md §11`, and recorded in `DECISIONS.md`. If implementation surfaces a 9th question, write a NEW Q against the schema doc; don't reopen the 8 closed ones.
- **Don't subagent-out Wave 3 work.** It is decisions, not facts. Per s042 anti-pattern + global subagent-delegation rule, recommendations belong in main-session. The doc set is now complete; this no longer applies prospectively, but if a Phase 0 plan needs splitting, same rule.
- **Don't treat the mirror as bidirectional.** It is one-way DB -> Sheet by `DECISIONS.md` 2026-04-29. Sarvi edits in Sheet do NOT propagate. Mirror nightly cron overwrites them. If a future request says "sync edits from Sheet back" -- that is Shape B, explicitly rejected.
- **Don't promise low-latency mirror.** 60-second target is the goal; Sheets API quotas + webhook-no-retry semantics make sub-second unrealistic. Don't over-spec.
- **Don't skip the password-reset blast smoke before Phase 4.** It is the irreversible step. JR's inbox should receive a sentinel test email during Phase 4 §7.3 verification gate; if it doesn't, hard-block before T+1:10.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028 through s041 commits with deferred phone-smoke -- carried (no new code commits in s043)
- s034 backend live smoke -- still owed (`sendBrandedScheduleEmail` + duplicate-email mirror check); flagged in `09 §1` as a pre-condition for cutover Phase 0
- 2 architectural audit items -- since 2026-04-29 (color-only state markers; MobileAdminView<->ColumnHeaderCell consolidation needs admin state -> context provider refactor first)
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14 (note: superseded in priority by Supabase migration; if migration ships first the CF Worker becomes moot)
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)

## Key Context

- Supabase migration is **research COMPLETE, no execution date**. Folder `docs/migration/` is a planning artifact; ship decision is independent of doc-set completeness.
- Migration shape: DB-canonical, Sheet = one-way read-only mirror, admin UI is edit surface. LLM-driven editing is Phase 2, not cutover. Captured in `CONTEXT/DECISIONS.md` 2026-04-29.
- Phase 0 entry point per `09 §3`: Supabase project (ca-central-1, Pro $25/mo) + schema DDL from `02 §1-§5` + 14 RLS policies from `05 §3-4` + seed `store_config` from current Settings.
- Pre-cutover blocker per `09 §1`: confirm `sendBrandedScheduleEmail` auth-gate bug status (still owed s034 backend smoke); fix or document before Phase 0.
- Production URL: `https://rainbow-scheduling.vercel.app`. Latest bundle hashes from s041: `index-Dby6BZOj.js` / `index-Df2GvNEw.js` / `index-CcXHDOkr.js`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- AGENTS.md is canonical post v5.2 bootstrap; shims rarely need repair.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `scumble holography`. Top Active is "Apps Script + Sheets -> Supabase migration: research/scoping COMPLETE; no execution date set."
2. Read `docs/migration/README.md` -- status table should show all 10 docs landed (state column = "landed", date column = 2026-04-29 or 2026-04-30).
3. `git log --oneline -3` should show this s043 handoff commit on top of `d983066`.
4. `git status -s` should be clean after Step 7 commit.
5. testguy account currently **Active** (carried from s038).
6. Adapter files: AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: nothing new this session (research only; no code).
- (b) External gates: same as s042 (s034 backend smoke deferred; phone-smoke for s028-s041 carried).
- (c) Top active TODO: Supabase migration is research-complete; ship is now JR's call. No further research session is needed unless JR asks.

Natural continuations:

1. **JR sets a Phase 0 ship window.** Then a fresh session executes `09 §3`: create Supabase project, apply DDL from `02`, install RLS policies from `05 §3-4`, seed `store_config`, verify gate per `09 §3.5`. Probably 2-3 hours focused work; reversible (delete project) if anything goes wrong.
2. **Real feature work.** EmailModal v2 PDF, Bug 4 PK 10am-10am, architectural deferred items (color-only state markers; MobileAdminView consolidation pending context provider). Migration is paused, not blocked.
3. **Backend smoke owed.** `sendBrandedScheduleEmail` auth-gate verify (s034 carry) -- worth doing before any Phase 0 ramp because it's a `09 §1` pre-condition.
4. **Pitch / customer work.** None scheduled this session, but the deck restructure shipped 2026-04-26 in `~/APPS/RAINBOW-PITCH/`; if a customer ask comes in, route there.

Open with: ask JR which of (1)/(2)/(3)/(4) to start.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
