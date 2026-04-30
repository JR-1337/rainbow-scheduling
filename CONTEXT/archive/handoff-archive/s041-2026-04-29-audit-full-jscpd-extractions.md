# s041 -- 2026-04-29 -- /audit full sweep + B2 fixes + jscpd extractions

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: aurora plenum -- 8 commits cleared the s042 audit (full sweep + B2 + 6 jscpd clusters); J2 + J3 are observation-only; mechanical audit backlog effectively empty.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `944c996` on `main` (synced with origin); working tree dirty only with this handoff's pending writes (`CONTEXT/TODO.md` Completed-trim + new handoff)
- **Sibling repo `~/APPS/RAINBOW-PITCH/`:** untouched
- **Apps Script live deployment:** unchanged from s037; s034 backend features still untested live
- **Active focus end-of-session:** mechanical audit backlog cleared (s042 full audit shipped + B2 sweep + jscpd extractions). Real feature work next (EmailModal v2 PDF, payroll aggregator, etc).
- **Skills used this session:** /audit (full mode, 1 run), /coding-plan x1 (Opus plan + Sonnet executor + Sonnet+Playwright smoker for jscpd extractions), /handoff (this).
- **Naming reconciliation:** commits this session tagged "s042" but the filename-sequence index is s041 (next after `s040-2026-04-29-audit-double-sweep.md`). The "s042" tag is a label, not authoritative. Future sessions should index from filenames.

## This Session

**Commits shipped (8 total, from s040 HEAD `29e2c20` to s041 HEAD `944c996`):**

- `cce033a` -- `audit s042 (full): 5 B1 fixes` -- dead `parseLocalDate`/`escapeHtml` re-exports dropped from App.jsx:60; `target="_blank"` on mailto removed (App.jsx:2731); aria-labels added on mobile + desktop violations buttons (App.jsx:1700 + 2194); dropped `export` keyword on `DESKTOP_SCHEDULE_NAME_COL_PX` (still used internally constants.js:104).
- `4779db1` -- TODO log B1.
- `2254b25` -- `audit s042 B2 sweep: I+E+L+J fixes (5 items)` -- I1 ShiftEditorModal `employee?.id` added to draft-reset useEffect deps; I2 PKModal eslint-disable narrowed; **E1 App.jsx allViolations 5x perf hoist** (computeWeekHoursFor moved out of inner date loop, 35x5x14=2450 to 35x14=490 iterations per recompute); L1 PKModal REMOVE-mode date-expand row keyboard a11y (role=button + tabIndex + aria-expanded + aria-label + onKeyDown); J1 App.jsx:67-148 dead migration-comment block deleted (~80 lines, preserved DEFAULT_STAFFING_TARGETS + MAIN APP banner).
- `6443c0d` -- TODO log B2 sweep.
- `01b79bd` -- `refactor(modals): extract ShiftCard component (audit J7)` -- new `src/components/ShiftCard.jsx` replaces shift-button blocks in OfferShiftModal + SwapShiftModal.
- `04f51d3` -- `refactor(modals): extract PasswordFormFields component (audit J8)` -- new `src/components/PasswordFormFields.jsx` replaces 3-input password forms in AdminSettingsModal + ChangePasswordModal.
- `25ae4e3` -- `refactor(panels): extract request/role format helpers to utils (audit J4 J5 J6 J9)` -- new `src/utils/requestFormat.js` (formatRequestDates + formatTimestamp + getStatusLabel) + `src/utils/roleFormat.js` (getRoleName + getRoleNameShort + getRoleColor). Touched 12 panels (5 beyond plan's named 8 per "5+ rule").
- `944c996` -- TODO log jscpd sweep.

**Plans + reports written:**

- `~/.claude/plans/quizzical-plotting-karp.md` (jscpd extraction plan -- 3 phases A/B/C, conservative variant rejecting `RequestListBase` pattern)
- `docs/audit-2026-04-29-full-s042.md` (full /audit report -- verdict Needs Attention, 5 B1 + 12 B2 + 7 non-findings)

**Playwright smoke runs (3 batches, 11 flows total, 0 console errors across all):**

- s042 B1 smoke (3 flows, HEAD `cce033a`): desktop tooltip mailto link no `_blank`, 240px name col still wired, desktop + mobile violations aria-labels live-verified (74 violations).
- s042 B2 smoke (4 flows, HEAD `2254b25`): app loads post J1 ~80-line comment delete, violations count parity 74, ShiftEditorModal Sarvi->Dan Carman swap live-verified (employee dep now in array), PKModal REMOVE keyboard code-verified (no PK bookings on Wk17 to live-test).
- jscpd smoke (4 flows, HEAD `25ae4e3`, bundle `index-CcXHDOkr.js`): ChangePasswordModal + AdminSettingsModal Password tab live-rendered with all 3 inputs, ShiftCard call sites code-verified (testguy 0 future shifts), admin main-view rendered with role legend colors intact.

**Audit-skill bug fixes (this session, durable):**

- `.claude/skills/audit/scripts/static-pass.sh` patched twice: knip exits non-zero when findings exist (was treated as failure -- now uses `|| true` + content-check); jscpd was getting `$SCOPE` (mode = "full") as path arg (now hardcoded to `src`). Without these patches Stage 1 had been silently producing empty static-pass.json all along.

**`/audit` full sweep findings:**

- 5 B1 shipped in `cce033a`.
- 12 B2 with fix prompts -- 10 closed by end of session (5 in `2254b25` + 5 jscpd extractions absorbing J7+J8 components and J4+J5+J6+J9 helpers).
- 2 B2 still deferred: J2 `computeWeekHoursFor` -> `utils/timemath.js` migration (observation), J3 inline-arrow note on App.jsx:1822 (observation, no React.memo boundary today).
- Triage caught 1 B1 false positive: knip flagged `DESKTOP_SCHEDULE_NAME_COL_PX` export as dead, but symbol is used at constants.js:104 -- main-session verify corrected B1 to drop `export` keyword instead of full delete.

**jscpd extraction divergence handled:**

- Phase C found `getRoleName` had two semantics across panels: offer-context uses `role.fullName / 'No Role'`, swap-context uses `role.name / '—'`. Resolved by exporting BOTH from `roleFormat.js` (`getRoleName` for offer, `getRoleNameShort` for swap). Each call site preserved.
- `ShiftCard.jsx` keeps its own inline `getRoleName`/`getRoleColor` (8 lines) because the unknown-role color fallback differs: ShiftCard falls back to `THEME.roles.none` (#64748B), `roleFormat.js` falls back to `THEME.text.muted`. Practically dead path (only triggers on corrupted role IDs) but the explicit "No Role" color choice is preserved.

**Memory writes:**

- `TODO.md`: anchor `cinnabar instanton` -> `aurora plenum`; new Verification "Last validated" lines covering all 3 smoke batches; 3 Completed entries (s042 B1, B2 sweep, jscpd extractions). Completed trimmed to 5 most recent per schema (TODO was 30k, now 17k; older entries -- s039 through s029 -- live in git log).
- `DECISIONS.md`: untouched. No new product/architecture decisions; jscpd extraction shape (conservative, helpers-only for divergent panels) is captured in the plan file.
- `ARCHITECTURE.md`: untouched.
- `LESSONS.md`: untouched.

**Decanting:**

- **Working assumptions:** the `/audit` skill's static-pass.sh was producing empty JSON for an unknown number of prior runs (knip non-zero exit on findings + jscpd path-arg conflation). Fixed in-session. Future audits get real static-pass data. No memory write -- the bug + fix is in the script's git history.
- **Near-misses:** smoker suggested importing `getRoleColor` from `roleFormat.js` into `ShiftCard.jsx` (it had an inline copy). Caught the semantic divergence (`THEME.roles.none` vs `THEME.text.muted` fallback) before shipping. The duplication is intentional. Captured in This Session above.
- **Naive next move:** run `/audit session` against the s042 sweep now that 8 commits shipped, to surface any new findings the sweep introduced. Wrong -- session-mode against the s042 commits would mostly re-surface jscpd patterns we just decided not to extract (the divergent panels in J4/J5/J6/J9). Right move: real feature work or wrap.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed sections.
- Char ceilings: TODO 17,324 / 25k OK (post-trim); DECISIONS 23,051 / 25k OK; LESSONS 48,901 / 25k STILL OVER (carried from s037+); ARCHITECTURE 9,615 OK.
- Style soft-warns: pre-existing TODO MD034/MD041 carried; em-dashes used liberally in Completed entries (project drift, not new this session).
- Adapter files: not modified.

`Audit: clean (TODO trimmed to 17k from 30k via Completed pruning per schema; LESSONS 48,901/25,000 char ceiling carried; em-dash style soft-warns carried)`

## Hot Files

- `src/components/ShiftCard.jsx` -- new shift-button card. Used in OfferShiftModal + SwapShiftModal. Has its own inline `getRoleName`/`getRoleColor` (intentional, fallback semantics differ from `roleFormat.js`).
- `src/components/PasswordFormFields.jsx` -- new 3-input password form. Used in AdminSettingsModal + ChangePasswordModal. `showCurrent` prop hides Current Password on first-login flows; `onSubmitEnter` optional.
- `src/utils/requestFormat.js` -- new helpers: `formatRequestDates`, `formatTimestamp`, `getStatusLabel`. Imported by 4+ panels.
- `src/utils/roleFormat.js` -- new helpers: `getRoleName` (offer-context, returns `role.fullName / 'No Role'`), `getRoleNameShort` (swap-context, returns `role.name / '—'`), `getRoleColor`. Imported by 8+ panels.
- `src/App.jsx:709-734` -- allViolations useMemo with hoisted `computeWeekHoursFor` (E1 fix). Per-employee hoist; if you add nested logic that depends on the inner date, keep the hoist.
- `src/modals/PKModal.jsx:478-485` -- REMOVE-mode date-expand row, keyboard-accessible.
- `src/modals/ShiftEditorModal.jsx:113-121` -- draft-reset useEffect now includes `employee?.id` dep.
- `.claude/skills/audit/scripts/static-pass.sh` -- two patches landed in-session. If a future run shows `available: false` for both knip + jscpd despite tools being installed, check the patch shapes.
- `~/.claude/plans/quizzical-plotting-karp.md` -- jscpd extraction plan with conservative-vs-full-component reasoning.
- `docs/audit-2026-04-29-full-s042.md` -- full /audit report. Next session-mode audit will diff against this file.

## Anti-Patterns (Don't Retry)

- **Don't trust knip "dead export" claims without checking internal use.** B1 verification this session caught `DESKTOP_SCHEDULE_NAME_COL_PX` -- knip flagged the export as dead (true), but the symbol is read internally at constants.js:104. Fix is "drop `export` keyword", not "delete line".
- **Don't re-extract panels just because jscpd flags them.** Panel JSX bodies often diverge in copy/conditional/wrapping shape; forcing a shared component couples them. Helpers-only extraction is safer for code that needs to evolve independently.
- **Don't blindly accept smoker's de-duplication suggestions.** Two functions named the same can have different fallback semantics (THEME.roles.none vs THEME.text.muted). Verify before consolidating.
- **Don't re-run `/audit session` immediately after `/audit` full sweep.** Session-mode against fresh full-sweep commits surfaces the same patterns the full sweep just decided. Use session-mode after small commit batches, full mode for periodic clean sweeps.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028 through s041 commits with deferred phone-smoke -- carried (s041 adds 8 fix/refactor commits with web-smoke only; phone-smoke owed)
- s034 backend live smoke -- still owed (`sendBrandedScheduleEmail` + duplicate-email mirror check)
- 2 architectural audit items -- since 2026-04-29 (color-only state markers; MobileAdminView<->ColumnHeaderCell column-header consolidation -- needs admin state -> context provider refactor first)
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)

## Key Context

- The /audit + /coding-plan pipeline shipped 8 commits cleanly this session: full audit report, B1 fixes, B2 sweep with 5x perf hoist + 80-line dead-comment delete, then 3-phase jscpd extraction via Opus plan + Sonnet executor + Sonnet+Playwright smoker.
- Production URL confirmed: `https://rainbow-scheduling.vercel.app`. Bundle hashes verified per smoke: `index-Dby6BZOj.js` (B1), `index-Df2GvNEw.js` (B2), `index-CcXHDOkr.js` (jscpd).
- `/audit` skill's static-pass.sh now produces real output. Knip + jscpd results land at `.claude/skills/audit/output/.knip.json` + `.jscpd/jscpd-report.json` (gitignored, regenerated each run).
- `/audit session` baseline now rests at `docs/audit-2026-04-29-full-s042.md`. Next session-mode audit's diff-vs-prior compares against this file.
- Apps Script editor link: `script.google.com/home` -- requires being signed in to `otr.scheduler@gmail.com`. Deploy via top-right Deploy -> Manage deployments -> pencil-edit existing -> New version (NOT New deployment).
- Adapter files: AGENTS.md is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- Anchor is `aurora plenum`. Top Active is "JR manual cleanup -- Natalie Sirkin Week 18".
2. `git log --oneline -10` should show: this handoff commit, `944c996` (TODO log jscpd), `25ae4e3` (Phase C helpers), `04f51d3` (Phase B PasswordFormFields), `01b79bd` (Phase A ShiftCard), `6443c0d` (TODO log B2), `2254b25` (B2 sweep), `4779db1` (TODO log B1), `cce033a` (B1 fixes), `29e2c20` (s040 handoff).
3. `git status -s` should be clean after this handoff is committed.
4. testguy account is currently **Active** (carried from s038 smoker restore + confirmed in 3 smokes this session).
5. Adapter files: AGENTS.md is canonical post v5.1 bootstrap upgrade.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 8 commits (`cce033a` through `944c996`) all build-PASS + Playwright web-smoke PASS. Phone-smoke deferred per JR pattern.
- (b) External gates: same as s040 (s034 backend smoke deferred to JR's next email-format session with Sarvi; phone-smoke for s028-s041 carried).
- (c) Top active TODO: mechanical audit backlog cleared; real feature work next.

Natural continuations:

1. **EmailModal v2 PDF attachment** -- biggest unblocked feature on Active TODO. Backend `Utilities.newBlob().getAs('application/pdf')` + new action; frontend POSTs the existing print-preview HTML doc. Pairs naturally with the s034 backend redeploy smoke (still owed).
2. **Bug 4 PK 10am-10am repro** -- needs JR repro steps + Sheet inspection.
3. **Architectural deferred items** -- color-only state markers (product call) or MobileAdminView<->ColumnHeaderCell consolidation (needs admin state -> context provider refactor first).
4. **Pitch deck restructure plan** -- ~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md ready for Sonnet 4.6 subagent execution; covers pricing $1500+$497/mo, ESA single-mention, Phase 2 narrative, AskRainbow chatbot.

Open with: ask JR which of (1)-(4) he wants next.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
