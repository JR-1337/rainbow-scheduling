# s044 -- 2026-04-30 -- bulkCreatePKEvent kill + AWS SES + pricing framing

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: kintsugi instanton -- Migration research COMPLETE; vendor + pricing decisions locked (AWS SES, no PITR, migration not itemized); orphan handler killed. Tree clean. Ready for Phase 0 ship window when JR sets it.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `6534cbb` on `main` (synced with origin); working tree dirty with this s044 handoff's writes (`CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/handoffs/s044-...md`).
- **Apps Script live deployment:** repo `backend/Code.gs` is ~91 lines smaller than live (s044 kill of `bulkCreatePKEvent`); live not yet pasted-in. Optional cleanup; full decommission at cutover Phase 6 makes the drift moot.
- **Active focus end-of-session:** Supabase migration is research-complete + vendor-decisions-locked. No execution date set. Phase 0 entry point per `09 §3` is unchanged.
- **Skills used this session:** `/handoff` (s043 earlier today, s044 now).

## This Session

**Continuation of s043 same calendar day; small follow-up work after the s043 handoff was already shipped.**

**Code shipped:**

- `a8ccaa8` -- killed `bulkCreatePKEvent` orphan handler in `backend/Code.gs`. ~91 lines removed: dispatch entry at L302, function body at L1910-1996, lock-guard site, 2 stale comment refs at L75-77 + L1825. Build PASS; frontend bundle unchanged (backend-only). Zero frontend callers per `04-apicall-callsite-map.md` -- confirmed dead. **Live Apps Script not yet updated** -- repo source diverges from live; either paste-in next time JR opens `script.google.com/home`, or leave until cutover decommissions everything.

**Decisions locked (s044 entry in DECISIONS.md):**

- **AWS SES pinned for Phase 4 password-reset blast SMTP** -- ca-residency aligns with PIPEDA framing; ~$0.10 per 1k emails, free at OTR scale. Resend + Mailgun rejected for residency.
- **PITR add-on dropped from Phase 0** -- $100/mo equals baseline Pro plan; daily 7-day backups suffice. Revisit only if customer compliance ask demands it.
- **Migration not itemized to OTR** -- table stakes for Ontario / PIPEDA compliance, bundled into existing $497/mo + $125/hr arrangement. Customer #2 inherits a migrated platform; the $11-19k of dev hours OTR underwrites amortizes across future deals. Future pricing implication for `project_pricing_locked` once a second customer is in motion.

**Pre-cutover gates added to TODO (top of Active):**

- `sendBrandedScheduleEmail` auth-gate bug confirm/fix (load-bearing for Phase 4 password-reset blast).
- AWS SES SMTP setup (verify SPF/DKIM during Phase 1).

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `scumble holography` -> `kintsugi instanton`. New top-Active items for `sendBrandedScheduleEmail` smoke + AWS SES SMTP pin.
- `CONTEXT/DECISIONS.md`: NEW entry `2026-04-30 (s044) -- Migration vendor + pricing framing locked` at top. Confidence H. 19,498 chars / 25k OK.
- `CONTEXT/LESSONS.md`: untouched (still 68,794/25k carried).
- `CONTEXT/ARCHITECTURE.md`: untouched.

**Decanting:**

- **Working assumptions:** the migration cost estimate ($11-19k at JR's rate; $25-35k at agency rates) was framed as "table stakes amortized across customers." That framing is durable and now in DECISIONS; no further capture needed.
- **Near-misses:** considered offering Resend or Mailgun as the SMTP pick for "easier setup." Caught back to AWS SES once the ca-residency framing was made explicit. Recorded in DECISIONS rejected-alternatives.
- **Naive next move:** "deploy the bulkCreatePKEvent kill to live Apps Script via clasp." Wrong -- JR's workflow is paste-into-the-editor manually (per memory `reference_apps_script_topology`); CLI deploy isn't wired. Left as a manual-when-convenient task.

**Audit (Step 3):**

- Schema-level: clean. TODO + DECISIONS schema headers present.
- Char ceilings: TODO 18,854 / 25k OK; DECISIONS 19,498 / 25k OK; LESSONS 68,794 / 25k STILL OVER (carried); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; DECISIONS MD041/MD032/MD012 carried; em-dash drift in archived entries carried.
- Adapter files: not modified.

`Audit: clean (LESSONS 68,794/25,000 char ceiling carried; MD041 + MD032 + MD034 + MD012 style soft-warns carried)`

## Hot Files

- `CONTEXT/DECISIONS.md` -- top entry is s044 vendor+pricing; second is s043 schema-design lock.
- `CONTEXT/TODO.md` -- top Active items are pre-cutover gates (`sendBrandedScheduleEmail` smoke; AWS SES SMTP) + the migration research-complete pointer.
- `docs/migration/09-cutover-and-rollback.md` -- 7-phase plan; Phase 0 entry point per `§3` is unchanged.
- `backend/Code.gs` -- ~91 lines shorter than live; sync drift to be resolved manually or at cutover.

## Anti-Patterns (Don't Retry)

- **Don't use `clasp` or any CLI to push Apps Script changes.** JR's workflow is paste-into-the-editor; the project doesn't have clasp wired and adding it isn't worth the setup cost when the whole script gets decommissioned at cutover.
- **Don't re-litigate the SMTP vendor pick.** AWS SES is locked for ca-residency. If deliverability falters in Phase 1 smoke, the fix is SES configuration, not vendor swap.
- **Don't itemize the migration as a separate line to OTR.** Pricing framing is locked: table stakes, not a feature.
- **Don't carry forward the bulkCreatePKEvent kill as "deploy to live."** It's optional cleanup. Cutover decommissions it; if JR opens the editor for another reason, paste it in then.

## Blocked

- Same set as s043. No changes:
  - iPad print preview side-by-side -- since 2026-04-26
  - 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test
  - s028-s041 commits with deferred phone-smoke
  - s034 backend live smoke (now flagged as Phase 0 pre-condition in `09 §1`; same item)
  - 2 architectural audit items (color-only state markers; MobileAdminView consolidation)
  - S62 2-tab settings split + retroactive-default fix
  - CF Worker SWR cache (superseded in priority by migration)
  - Consecutive-days 6+ warning
  - Payroll aggregator path 1
  - Amy ADP rounding rule discovery
  - S39.4 mobile admin extraction
  - Natalie Sirkin Week 18 manual re-entry

## Key Context

- Migration is research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier ($25/mo, no PITR), apply DDL from `02 §1-§5`, install 14 RLS policies from `05 §3-4`, seed `store_config`. Per `09 §3`.
- Pre-cutover gate before Phase 0 starts: `sendBrandedScheduleEmail` smoke (s034 carry) -- if broken, fix in Apps Script before ramp.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Set up + verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`. Latest bundle hashes from s041: `index-Dby6BZOj.js` / `index-Df2GvNEw.js` / `index-CcXHDOkr.js` (s044 backend-only kill did not change bundle).
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. Repo source ~91 lines ahead of live.
- AGENTS.md is canonical post v5.2 bootstrap.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `kintsugi instanton`. Top Active is the 2 pre-cutover gates + the research-complete migration pointer.
2. `git log --oneline -3` should show this s044 handoff commit on top of `6534cbb` (s043 handoff append).
3. `git status -s` should be clean after Step 7 commit.
4. `grep -n "bulkCreatePKEvent" backend/Code.gs` should return zero matches (verifies the kill survived any merge).
5. testguy account currently **Active** (carried from s038).
6. Adapter files: AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `bulkCreatePKEvent` kill build PASS but no Playwright smoke needed (backend-only; zero frontend callers; bundle unchanged). No outstanding verify owed.
- (b) External gates: `sendBrandedScheduleEmail` smoke (s034 carry) is now formally a Phase 0 pre-condition. Doing it any time before ship date closes the gate.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **`sendBrandedScheduleEmail` smoke.** Send a real schedule email from prod, confirm it lands. If the auth-gate bug bites, fix in Apps Script. ~20-30 min focused work.
2. **JR sets a Phase 0 ship window.** Then a fresh session executes `09 §3`.
3. **Real feature work** unrelated to migration (EmailModal v2 PDF, Bug 4 PK, deferred audit items).
4. **AWS SES account setup.** Could pre-stage during Phase 1 prep -- create AWS account, request production access (SES sandbox -> production takes 24-48h), verify domain.
5. **Stop for the day.** s044 closes out the day with tree clean and decisions locked.

Open with: ask JR which of (1)/(2)/(3)/(4)/(5) to start.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
