# s070 -- 2026-05-07 -- Sarvi-confirmed iPhone 12 perf cure + EmailModal residuals closed

gamboge. holography.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: iPhone 12 cumulative perf Sarvi-confirmed cured the freeze (s069 work); no perf follow-on planned; pick next from non-blocked Active TODO.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`. No cross-repo touches this session.
- **Git:** `main` clean, up-to-date with `origin/main`. This run's handoff commit ships on top of `7788ac8` (kit upgrade BOOTSTRAP v6.2 -> v6.4) + `db23608` (s069 handoff).
- **Active focus end-of-session:** light-residue session. No code shipped. TODO bookkeeping (graduate iPhone 12 + s068 from Active to Verification), auto-memory phrasing sweep, EmailModal residual code-verification, auto-memory write.
- **Working assumption (Sarvi-confirmed operationally):** s069's WebKit Jetsam JS-heap pressure-band hypothesis (iPhone 12 in 400-450 MB band, eviction-and-recompile of compiled JS) was operationally correct. The cumulative 8-commit perf work cured Sarvi's "freeze sometimes" + scroll-freeze symptoms per natural use. Do not re-litigate the diagnosis; do not pursue B1 (lazy-load 14 modals) preemptively -- B1 has a real cold-load tradeoff and is unnecessary now.

## This Session

**Shipped-but-unverified:** none (no code shipped).

**External ops:** none.

**Audit:** clean (11 LESSONS atomicity soft-warns, all carried from prior sessions; 0 new LESSONS entries this session).

**Memory writes:** `CONTEXT/TODO.md` (anchor swap to `gamboge. holography.`, iPhone 12 + s068 entries dropped from Active, EmailModal residuals line slimmed to reflect closure, Sarvi-confirmed sweep marked partial-done, +2 Verification lines for cumulative iPhone 12 perf and EmailModal residuals); auto-memory `project_otr_facts.md` + `MEMORY.md` index pointer ("Sarvi-confirmed" -> "Sarvi-reported", 3 sites). `lessons_pre=27 lessons_post=27`, no cadence trigger.

**Prune:** Anti-Patterns: 2 dropped (s065 ad-hoc triage subagents -- 5+ behind, did not recur; s066 tier-persistence-by-Sheet-edits-alone -- covered by LESSONS "Employee tier saves: client strip must match admin1-tier backend gates" rule), 0 graduated, 3 kept, 0 net-new s070. Hot Files: 0 dropped, 1 added s070 (`buildBrandedHtml.js`), 6 kept.

## Hot Files

- `src/MobileAdminView.jsx` + `src/MobileEmployeeView.jsx` -- mobile grids with extracted memoized `MobileAdminScheduleCell` + `MobileScheduleCell` (per s069 A6). Future cell behavior changes thread through the cell component prop API. (origin: s069)
- `src/components/EmployeeRow.jsx` + `src/components/ColumnHeaderCell.jsx` -- desktop perf hot path; A4 dropped `AnimatedNumber` here. Modal `AnimatedNumber` preserved at `ShiftEditorModal.jsx:687,693,703`. (origin: s069)
- `src/App.jsx` -- perf cluster: `useDeferredValue` on shifts/events at line ~700; mobile-admin `useCallback`'d handlers near line ~2000; `getStaffingTarget` `useCallback` at line 717. (origin: s069)
- `src/hooks/useLongPress.js` -- simplified after non-passive listener removal (`62d992c`). If scroll regresses on iPhone 12, this is the suspect. (origin: s069)
- `src/utils/employeeSort.js` + `src/constants.js` -- 4-bucket schedule sort + name-rank constant. If a new admin's first name isn't in `SCHEDULE_ROW_FIRST_NAME_ORDER` they alpha-tail. (origin: s068)
- `CONTEXT/DECISIONS.md` -- 22.6KB, archive cycle expected when next entry crosses 25KB. (re-hot s064)
- `src/email/buildBrandedHtml.js` -- branded schedule email template (individual + group modes, plaintext fallback, 600px content card with mobile-fluid clamp, all inline styles, charset UTF-8 declared). If EmailModal is touched again, this is the live template surface. Nano-cleanup candidate: line 109 hardcodes `#D97706` -- equals `OTR.task` from theme but loses single-source-of-truth. Not shipped this session. (origin: s070)

## Anti-Patterns (Don't Retry)

- **Don't add `useCallback` wraps to inline handlers passed into a child unless the child is already wrapped in `React.memo`.** Premature optimization: the desktop branch was fully `useCallback`'d when audited s069, and mobile inline handlers are no-op until a memo wrapper exists on the receiving component. Verify the consumer's memo state before chasing handler stability. (origin: s069)
- **Don't dispatch a research subagent when the user-reported symptom matches a known frontend pattern.** Sarvi's "long-ass error that disappears" was the Vite chunk-load family; the agent's run found "no code bug" because the bug class was environmental (stale chunk hash). (origin: s068)
- **Don't treat optimistic UI as proof of persistence** before `saveEmployee` payload still carries tier fields for admin1 callers. (origin: s066)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked.

## Key Context

- **iPhone 12 cumulative perf Sarvi-confirmed cured 2026-05-07.** 8 commits (`c386cb9`..`ffeafd6`) shipped s069 cured Sarvi's "freeze sometimes" + scroll-freeze symptoms per natural use. Do NOT chase B1 (lazy-load 14 modals); it has a cold-load tradeoff and is unnecessary now.
- **EmailModal v2 residuals closed s070 (code-verification).** Branded HTML at `src/email/buildBrandedHtml.js` audited line-by-line clean against the file's own email-safe ruleset and LESSONS UTF-8 + em-dash rules. Duplicate-email frontend guard at `EmployeeFormModal.jsx:58-69` symmetric with backend `Code.gs:2368-2378` (both normalize, exclude self + deleted, return collision name).
- **"Sarvi-confirmed" -> "Sarvi-reported" sweep partial.** Auto-memory `project_otr_facts.md` + `MEMORY.md` index pointer swept (3 sites). Active CONTEXT files don't carry the phrase (already swept in a prior session). Remaining: chatbot prompt in `~/APPS/RAINBOW-PITCH/` repo (cross-repo, defer to next session in that repo). Frozen historical docs (`pitchdeck/build-plan.md`, `docs/research/scaling-migration-options-2026-04-26.md`) deliberately untouched.
- **Apps Script live = v2.32.5** (paste-deployed s066). No backend writes this session.
- **Kit upgrade landed mid-session via separate commit** (`7788ac8`): BOOTSTRAP v6.2 -> v6.4, schemas-march, .claude/kit/ install, drift-check trigger body rewritten to local-read. JR confirmed those CONTEXT/* + AGENTS.md edits at session start were intentional (kit-side).
- **Comm-shape correction this session:** I introduced "CF Worker", "SWR", "KV cache" without inline glosses to JR; he flagged it sharply. The rule is `~/.claude/rules/comm-shape.md`'s "Convert project-internal compressions to prose; define established terms inline." Logged to `~/.claude/scratch/clarification-log.md` (acronym-no-gloss + undefined-term).

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `gamboge. holography.`; iPhone 12 + s068 entries no longer in Active (graduated to Verification).
2. `git log --oneline -10` -- expect this run's handoff commit on top, then `7788ac8` (kit upgrade), `db23608` (s069 handoff), `0703fbf`, `ffeafd6`, `62d992c`, `c7c3406`, `137c909`, `1c1b0f4`, `c83c1fe`.
3. `git status -s` -- clean.
4. If JR signals continued mobile slowness from Sarvi: B1 (lazy-load 14 modals) is the next candidate; A6 + B2 already addressed parse-time and render-time costs. But default is to NOT pursue B1 -- Sarvi's natural-use confirmation cured the freeze.

## Next Step Prompt

Default falls (a) -> (b) -> (c):

- (a) **Shipped-but-unverified:** none gating. Holiday-autofill behavior on Victoria Day 2026-05-18 will verify naturally during routine schedule work.
- (b) **External gates:** none active. iPhone 12 perf is Sarvi-confirmed cured.
- (c) **Top non-blocked Active TODOs:** scope the s060 in-app bug-report button + AI investigator pipeline (substantial new feature, scoping pass first); or sweep "Sarvi-confirmed" phrasing in `~/APPS/RAINBOW-PITCH/` chatbot prompt next time that repo is open. Migration to Supabase is research-complete but awaits JR ship decision.

**Caution (naive next move):** picking "CF Worker SWR cache" from the Active list because the Future-proofing audit ranks it as the highest-impact perf lever. Do NOT do this without (1) glossing the term in plain English to JR -- he doesn't use this jargon, and surfacing it without definition is exactly the comm-shape failure flagged this session -- and (2) confirming JR is ready for the Cloudflare-hands-on portion. The line is Blocked per `## Blocked` -- waiting on JR green-light. Pick a non-blocked, well-glossed item or wrap.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical -- shims rarely need repair.
