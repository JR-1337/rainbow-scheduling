# s039 -- 2026-04-29 -- /audit skill v4 shipped + audit-deferred bug sweep

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md`; read `CONTEXT/LESSONS.md` only if preferences may affect approach. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: scumble baryogenesis -- /audit project-skill v4 shipped (single-mode cheap, codebase map + static + 1 Sonnet generalist + Sonnet triage); 4 fix commits landed audit-deferred bugs from prior s028+s038 specialist runs; ~8 architectural items still on the backlog awaiting design decisions.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `c7e3aed` on `main` (synced with origin); working tree clean
- **Sibling repo `~/APPS/RAINBOW-PITCH/`:** untouched
- **Apps Script live deployment:** unchanged from s037 (`s037 - log dropped fields in updateRow/appendRow`); s034 backend features still untested live
- **Active focus end-of-session:** paused mid-backlog -- 3 audit-deferred commits shipped + the session-mode UnifiedRequestHistory fix; 8 architectural items deferred for design decisions
- **New project skill installed:** `.claude/skills/audit/` (gitignored; SKILL.md + 4 scripts)

## This Session

**`/audit` skill design + ship:**

- Iterated through 4 versions over the session: v1 mono-Opus + Hercule Poirot persona, v2 two-pass (Opus inventory -> Sonnet triage), v3 5-Opus specialist tracks, v4-cheap (final): codebase map + static analysis + 1 Sonnet generalist + Sonnet triage
- Single mode locked per JR direction ("keep it simple, one audit skill"); no `--full`, no `--hybrid` opt-ins
- Two invocations: `/audit` (full `src/`), `/audit session` (files since last `sNN handoff:` commit + working tree)
- Token budgets: 50k inventory cap (75k hard), 30k triage cap (50k hard)
- Skill files live at `.claude/skills/audit/` (gitignored). Scripts: `build-map.sh`, `scope-resolver.sh`, `static-pass.sh`, `diff-prior.sh`. Output cache at `output/` (gitignored)
- Codebase map fingerprint = `git-head | scope-content-hash | dirty-tree-hash`; cached 7d
- Static-pass uses `npx --yes knip` + `npx --yes jscpd` -- tolerant of missing tools, no eslint config required
- Evolution log shipped at `docs/audit-skill-evolution.md` (`8597029`) -- records the 4 versions + reasoning
- K-exclusion list explicitly documents the Apps Script `/exec` URL in `src/utils/api.js:6` as not-a-secret per JR direction (auth lives in payload token)
- Auto-memory `feedback_simple_skills` captures the simple-over-feature-rich preference

**`/audit session` first run:**

- Audited 1 file (`src/panels/UnifiedRequestHistory.jsx`, the `cdc07f1` change)
- Verdict: Needs Attention (real silent-crash bug at line 236)
- Cost: ~48k tokens, ~2 min wall-clock
- Report: `docs/audit-2026-04-29-session-40cf842.md` (commit `af46bde`)
- Bucket 1: 0 (no one-line edits per the strict spec); Bucket 2: 7; Non-findings: 2

**Commits shipped:**

- `cdc07f1` -- `perf(request-history): memoize sorted list; drop degenerate ternaries in swap render` (pre-audit ad-hoc cleanup; the change that triggered session-mode audit)
- `c137f47` -- `context(todo): log s039 modals/panels follow-up audit pass`
- `8597029` -- `context(audit): ship /audit skill v4 evolution log`
- `af46bde` -- `context(audit): /audit session first run -- UnifiedRequestHistory`
- `849c4cf` -- `fix(request-history): silent crash + memo busting + a11y from /audit session` (5 fixes from session report)
- `b220f5c` -- `chore(utils): drop dead exports + stale comments (audit J + H)` (5 dead exports, 2 stale comment blocks)
- `c979b32` -- `fix(correctness): silent failures + missing optional chains (audit I + C)` (6 correctness bugs from prior /audit; ALSO inadvertently swept in 2 pre-existing untracked `.cursor/rules/*.mdc` files via `git add -A`; surfaced to JR who chose to keep them tracked)
- `c7e3aed` -- `fix(a11y): aria-labels + label associations + aria-expanded (audit L)` (5 components)

**Bug fixes shipped (prior /audit findings):**

- I `api.js:37` silent 414 fall-through -> explicit URL_TOO_LONG error
- I `api.js:105` `||` swallowed savedCount=0 -> `??` preserves zero
- I `requests.js:21` datesRequested.split crash -> `?.` guard
- I `EmployeeRow.jsx:58` availability undefined crash -> `?.` guard
- I `scheduleCellStyles.js:34,42` firstEventType null crash -> conditional guard
- C `scheduleOps.js:109` unreachable conditional -> removed (with explanatory comment)
- I `EventOnlyCell.jsx:30` array-index key -> `ev.id || ${ev.type}-${ev.startTime}-${i}` stable key
- I `UnifiedRequestHistory.jsx:236` datesRequested chained .map crash -> `?? ''` fallback + `.filter(Boolean)`
- I `UnifiedRequestHistory.jsx:120` cancel callbacks busting items memo -> exhaustive-deps disable + reasoned comment
- E `UnifiedRequestHistory.jsx:132-139` 5 separate `.filter` scans -> single `useMemo([items])` walking once
- L `UnifiedRequestHistory.jsx:182` sort button -> aria-label
- L `UnifiedRequestHistory.jsx:222` cancel button -> contextual aria-label per request type
- L `EmployeeRow.jsx:52` Edit3 icon-button -> aria-label `Edit ${employee.name}`
- L `ColumnHeaderEditor.jsx:46` X close icon-button -> aria-label `Close`
- L `ColumnHeaderEditor.jsx` 3 inputs (open, close, target) -> aria-label each
- L `LoginScreen.jsx:65,80` Email + Password labels -> htmlFor pairing with existing input ids
- L `primitives.jsx Input` -> wrapped input in `<label>` (sibling-label htmlFor was missing)
- L `primitives.jsx TimePicker` -> aria-label on hour + minute selects
- L `CollapsibleSection.jsx:19` toggle button -> aria-expanded={isOpen}
- J 5 dead exports demoted to internal: `parseHM`, `mergeIntervals` (timemath.js), `STAT_HOLIDAYS_2026` (storeHours.js), `getStaffingTargetOverrides` (storeHoursOverrides.js, function removed), `getSickDefaultTimes` (eventDefaults.js, function removed)
- H 2 stale comment blocks removed: `date.js` Phase E extraction note, `storeHours.js` "stays in App.jsx" note (extractions shipped long ago)

**Architectural items deferred (need design decisions, not safe-now mechanical edits):**

- D `EmployeeRow.jsx:63` admin-grid time-off Set propagation -- 245 cells x 50 items = 12,250 evals/render on Sarvi's surface; s038 fix is in EmployeeView only; full fix requires App.jsx Set + new EmployeeRow prop
- F `ScheduleCell.jsx:50` inline arrow on memo'd cell -- 245 fresh closures/render; lift to parent useCallback in App.jsx + EmployeeView + MobileAdminView
- L `AdaptiveModal.jsx`, `MobileDrawerShell.jsx`, `ColumnHeaderEditor.jsx` modal focus traps + Escape handlers -- 3-modal pattern retrofit
- L `ScheduleCell.jsx`, `ColumnHeaderCell.jsx` clickable `<div>` need role="button" + tabIndex + onKeyDown for Enter/Space -- mobile+desktop parity required
- L `primitives.jsx Checkbox` div -> `<input type="checkbox">` -- affects every consumer; visual styling needs check
- J `ColumnHeaderEditor.jsx:46-57` 32-line internal duplicate (two `<input type="time">`) -- TimeInput sub-component extraction
- J `MobileAdminView.jsx:263 <-> ColumnHeaderCell.jsx:55` 23-line cross-file duplicate -- column-header consolidation
- L color-only state markers (overtime hours, scheduled-vs-target, MobileBottomNav red dot) -- need icon/text companion; product call

**Memory writes:**

- `TODO.md`: anchor `gamboge attractor dynamics` -> `scumble baryogenesis`; new Verification "Last validated" line for the s039 multi-commit sweep; 3 Completed entries (audit-deferred bug sweep, /audit skill ship, /audit session first run); existing s039 modals/panels entry retained as-is
- `DECISIONS.md`: prepended `2026-04-29 (s039) /audit project-skill: single-mode (cheap), no specialists, no flags` with H confidence (direct user direction + 4-pass measurement evidence)
- `ARCHITECTURE.md`: untouched (no structural changes to the app)
- `LESSONS.md`: untouched (the simple-skills preference graduated to auto-memory, not LESSONS)
- Auto-memory: added `feedback_simple_skills.md` (one-mode tooling preference, derived from audit-skill design discussion)

**Decanting:**

- **Working assumptions:** I assumed `git add -A` after a multi-file edit pass would only stage what I'd touched in the session. Wrong -- `.cursor/rules/blast-radius.mdc` and `ui-ux-design.mdc` were pre-existing untracked since at least s038 (per the s038 anti-pattern explicitly flagging them) and got swept into commit `c979b32`. Captured in Anti-Patterns. JR direction 2026-04-29: keep them tracked (option 1).
- **Near-misses:** I considered force-pushing to remove the .mdc files post-commit. Correctly stopped -- force-push to main is destructive and was not authorized; surfaced to JR for disposition instead.
- **Naive next move:** Run `/audit` (full mode) to surface the rest of the app's bugs. Wrong -- JR explicitly redirected: "we ran it before with opus, take that list and investigate and fix those." The naive move would have re-burned tokens to re-discover the backlog already inventoried in this session's specialist runs. Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed sections.
- Char-based ceilings: TODO ~17.5k / 25k OK; DECISIONS ~22.5k / 25k OK after my add; LESSONS 48,901 / 25k OVER (carried from s037+); ARCHITECTURE ~9.6k OK.
- Style soft-warns: pre-existing MD034/MD041 in TODO carried; 2 new MD034 in TODO Completed entries (commit-hash bare paths) and 1 new MD012/MD032 in DECISIONS (rejected-alternatives list spacing). All cosmetic; no relocation needed.
- Adapter files: not modified.

`Audit: clean (LESSONS 48,901/25,000 char ceiling carried; pre-existing TODO MD034/MD041 + 3 new style soft-warns this session)`

## Hot Files

- `src/utils/api.js:37,53,105` -- chunkedBatchSave error path now explicit `URL_TOO_LONG` instead of silent fall-through to GET on too-long URL; savedCount uses `??` to preserve a legitimate zero. Future audit may want to verify the URL_TOO_LONG branch is reachable from a real save flow (today fires only on non-batchSaveShifts long-payload actions, which may be rare in practice).
- `src/panels/UnifiedRequestHistory.jsx:120` -- items memo no longer includes cancel callbacks in deps. Has an `eslint-disable-next-line` with reason comment. If the cancel callbacks ever start capturing changing closures (today they only dispatch API calls), the eslint-disable becomes load-bearing -- re-evaluate then.
- `src/components/EmployeeRow.jsx:63` -- admin grid still calls per-cell `hasApprovedTimeOffForDate`. The s038 Set fix is in EmployeeView only. Real perf win lives behind a multi-file refactor (App.jsx Set hoist + new EmployeeRow prop).
- `.claude/skills/audit/` -- skill infrastructure. SKILL.md + 4 scripts (build-map, scope-resolver, static-pass, diff-prior). Map cache: `output/codebase-map.json` (7d fingerprint cache). Static-pass: `output/static-pass.json`.
- `.cursor/rules/blast-radius.mdc` and `ui-ux-design.mdc` -- now in git history per `c979b32`. JR chose to keep tracked. Treat as canonical Cursor rules going forward.

## Anti-Patterns (Don't Retry)

- **Don't use `git add -A` after a multi-file edit pass.** Pre-existing untracked artifacts (e.g. `.cursor/rules/*.mdc`, the s038 anti-pattern flagged them specifically) get swept in. Always stage by name. I forgot this mid-flow today and committed the .mdc files alongside intended source-file fixes; JR chose to keep them but the pollution is real.
- **Don't re-run `/audit` when prior audit findings are still actionable.** JR's pattern: "we ran it before with opus, take that list and investigate and fix those." Burning tokens to re-discover the same backlog is wasteful. The skill's diff-vs-prior surface exists for this reason.
- **Don't run full-mode (5 specialist) audit by default.** Single-mode v4-cheap is the only mode in the skill per JR direction. If a specialist run feels needed, surface it as a hypothesis to test, not an autonomous escalation.

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- pending JR phone-test -- since 2026-04-25
- s028+s029+s030+s031+s032+s033+s034+s035+s036+s037+s038+s039 commits with deferred phone-smoke -- carried (s039 adds 4 build-PASS-only fix commits with no Playwright smoke)
- s034 backend live smoke -- still owed (`sendBrandedScheduleEmail` + duplicate-email mirror check)
- Audit deferred items (8 architectural) -- since 2026-04-29 (this session)
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker SWR cache -- since 2026-04-14
- Consecutive-days 6+ warning -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor
- Natalie Sirkin Week 18 manual re-entry -- since s034 smoke (2026-04-28)

## Key Context

- The `/audit` skill is now the durable mechanism for finding regressions and tech-debt items. `/audit session` runs after each session to vet the change; `/audit` runs occasionally for a full sweep. Diff-vs-prior tracks regressed/fixed/persisting findings across runs.
- The s039 fix sweep landed audit-deferred items that had been carrying since s028 (initial audit). Many of those findings predate this session entirely; the audit reports surfaced them, this session executed them.
- Apps Script editor link: `script.google.com/home` -- requires being signed in to `otr.scheduler@gmail.com`. Deploy via top-right Deploy -> Manage deployments -> pencil-edit existing -> New version (NOT New deployment).
- Adapter files: `AGENTS.md` is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.
- `feedback_simple_skills` auto-memory: JR's preference for one-mode skills/tools over multi-mode flag-rich designs. Future internal tooling should respect it.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- Anchor is `scumble baryogenesis`. Top Active is "JR manual cleanup -- Natalie Sirkin Week 18".
2. `git log --oneline -8` should show: handoff commit (this), `c7e3aed` (a11y), `c979b32` (correctness + .mdc), `b220f5c` (utils chore), `849c4cf` (request-history), `af46bde` (audit session report), `8597029` (audit skill evolution), `c137f47` (s039 todo), `cdc07f1` (request-history pre-audit cleanup).
3. `git status -s` should be clean after this handoff is committed.
4. testguy account is currently **Active** (carried from s038 smoker restore).
5. Adapter files: AGENTS.md is canonical post v5.1 bootstrap upgrade. Don't repair shims unless harness-switch context arises.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 4 fix commits (`b220f5c`, `849c4cf`, `c979b32`, `c7e3aed`) all build-PASS but no Playwright smoke. Low-risk -- most are dead-code removal, optional-chain guards, aria-label adds, and behavior-equivalent memo refactors. Phone-smoke owed.
- (b) External gates: same as s038 (s034 backend smoke deferred to JR's next email-format session with Sarvi; phone-smoke for s028-s039 carried).
- (c) Top active TODO: continue audit-deferred backlog -- 8 architectural items remaining.

Natural continuation: pick up the audit-deferred backlog. Recommended order:

1. **D `EmployeeRow.jsx:63`** -- Sarvi-impacting perf bug; propagate the s038 Set fix to the desktop admin grid (touches App.jsx).
2. **L modal focus-trap + Escape suite** -- AdaptiveModal + MobileDrawerShell + ColumnHeaderEditor as a consistent retrofit (3 modals, one pattern).
3. **L clickable-div role/keyboard handlers** -- ScheduleCell + ColumnHeaderCell. Mobile+desktop parity required.
4. Remaining 5 items as smaller commits.

Open with: ask JR which item he wants next.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
