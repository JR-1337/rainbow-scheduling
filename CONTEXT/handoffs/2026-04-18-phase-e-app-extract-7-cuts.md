<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Phase E sub-area 4: 7 App.jsx pure-extract cuts shipped

## Session Greeting

This session shipped 7 App.jsx pure-extract cuts (`44dcc72`, `720e815`, `1a85e70`, `54e1d15`, `21c5f62`, `654c1ae`, `eba776f`), each commit-merge-push individually per a new ship-merge-verify rhythm JR named mid-session. Hash-only auth v2.23 was deployed and live-smoked clean. App.jsx 4147 -> 3702 lines. Three new global rules saved to `~/.claude/rules/` (`complete-the-operation`, `refresher-checkpoints`, `plan-time-knowledge`). Read in this order: `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top entry is this session), this file.

First reply: 1-2 short sentences, `Pass-forward:` with only essential carryover, exactly 1 direct question about how to proceed. Default next step is the LoginScreen carve-out (~400 lines, wired into auth flow -- biggest single component in App.jsx after the schedule grid).

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `eba776f` == origin/main (0 ahead, 0 behind)
- Working tree: handoff ceremony writes only
- Prod: LIVE at https://rainbow-scheduling.vercel.app on a post-cut-7 bundle (Vercel auto-rebuild after each push). JR live-smoked cuts 1 + 2 (clean). Cuts 3-7 are import-path-only moves that rollup catches at build time, so functional risk is low.
- Apps Script: v2.23.0 LIVE (JR pasted + new-version-deployed mid-session). Hash-only auth working: live login probe returned proper AUTH_FAILED on bad password.
- Build: `npm run build` PASS at HEAD (~464.79 kB; bundle DROPPED from pre-extract 465.06 kB through tree-shaking improvements)
- App.jsx: 3702 lines (was 4147 at session start, -445 / -11%)
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- pure-extract phase of sub-area 4 essentially exhausted; remaining sub-area-4 work is real component carve-outs. Sub-area 6 (ref-elimination Context refactor) still parked.

## This Session

1. **Cut 0 (residue cleanup, `eb146dd`)**: Removed `backfillPasswordHashes` from `backend/Code.gs` per the new Complete-the-Operation rule. Function had run successfully in the prior session and JR had deleted it from the live editor; the repo copy was orphaned residue.
2. **Cut 0.5 (white-page fix, `019c51c`)**: The prior-session date-utils extract (`23ab319`) removed `parseTime` as a private helper, but App.jsx still referenced it internally at lines 422/424. Vite build PASSED (no static check on undefined globals); React crashed at runtime -> white page on Vercel. Fixed by exporting `parseTime` from `src/utils/date.js` and re-importing in App.jsx. **Lesson**: when extracting helpers, grep the source for ALL references including private ones. Saved the lesson as the `plan-time-knowledge.md` global rule.
3. **Hash-only auth v2.23 deployed**: JR pasted `backend/Code.gs` into the live Apps Script editor and ran "Deploy -> Manage deployments -> New version". Verified live via curl POST: bad password returns AUTH_FAILED, indicating the hash-only path is wired (would have errored differently on v2.22). JR also smoke-confirmed his own real login works.
4. **Cut 1 (`44dcc72`)**: Extracted `src/utils/storeHours.js` with `STAT_HOLIDAYS_2026`, `STAT_HOLIDAY_HOURS`, `STORE_HOURS`, `isStatHoliday`. Migrated 7 import sites. Pure-only -- left `getStoreHoursForDate` in App.jsx because it closes over `_storeHoursOverrides` module-level mutable ref (audit item 6 parked refactor).
5. **Cut 2 (`720e815`)**: Moved `OFFER_STATUS_COLORS`, `OFFER_STATUS_LABELS`, `SWAP_STATUS_COLORS`, `SWAP_STATUS_LABELS` into existing `src/constants.js` (alongside `REQUEST_STATUS_COLORS`). Dropped unused internal `SWAP_STATUS` enum. Migrated 7 panel imports.
6. **Process correction mid-session**: After cuts 1+2 sat unmerged on `phase-e-app-extract` branch, JR asked "if we do too many cuts before we do the merges thats when you risk forgetting right?" Yes. Adopted ship-merge-verify per cut. Merged cut 1, JR live-smoked clean, merged cut 2. Branch deleted. Cuts 3-7 went directly on main with the new rhythm.
7. **Cut 3 (`1a85e70`)**: New `src/components/primitives.jsx` (`GradientButton`, `Modal`, `Input`, `Checkbox`, `TimePicker`) and `src/hooks/useFocusTrap.js`. Migrated 8 import sites. App.jsx still uses Modal + GradientButton internally (auto-populate confirm dialog) so re-imports them. Initial build broke -- `InactiveEmployeesPanel.jsx` was a third file the original grep missed; fixed and re-built.
8. **Cut 4 (`54e1d15`)**: New `src/components/uiKit.jsx` for `haptic`, `AnimatedNumber`, `StaffingBar`, `ScheduleSkeleton`, `TaskStarTooltip`, `GradientBackground`, `Logo`. Migrated MobileEmployeeView, MobileAdminView, EmployeeView, ShiftEditorModal.
9. **Cut 5 (`21c5f62`)**: Two small extracts -- `src/utils/payPeriod.js` (`PAY_PERIOD_START`, `CURRENT_PERIOD_INDEX`, `getPayPeriodDates`) and `src/utils/requests.js` (`hasApprovedTimeOffForDate`).
10. **Cut 6 (`654c1ae`)**: New `src/components/CollapsibleSection.jsx`. Migrated 8 import sites (7 panels + EmployeeView). App.jsx no longer needs to re-import (doesn't use it internally).
11. **Cut 7 (`eba776f`)**: New `src/utils/api.js` for `apiCall` + `chunkedBatchSave` + `API_URL`. Migrated 3 modals. App.jsx imports apiCall back since it's used extensively for data fetching.
12. **Three new global rules saved to `~/.claude/rules/`**:
    - `complete-the-operation.md` -- "Finish what you start: residue cleanup is part of the action."
    - `refresher-checkpoints.md` -- "Inline reminders for small context, scratch files for large; delete scratch after verify."
    - `plan-time-knowledge.md` -- "Plan-time knowledge does not survive to execution time."
    JR's framing: model has known failure modes, name them so they can be invoked. The seed sentence works because it self-locates the gap (plan-time vs execution-time you).
13. **CONTEXT syncs**: TODO.md gained 1 new Completed entry summarizing all 7 cuts; Active line updated. DECISIONS.md gained 1 new entry at top capturing the ship-merge-verify rhythm decision.
14. **Audit**: skipped (no adapter writes; CONTEXT not written before Step 2 of this handoff ceremony -- code-only commits all session).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/App.jsx` | 3702 lines. Next carve-out targets: LoginScreen (~lines 612-940 area, ~400 lines), ColumnHeaderEditor (~mid-file), the giant main App component below. |
| 2 | `~/.claude/rules/{complete-the-operation,refresher-checkpoints,plan-time-knowledge}.md` | New global rules; binding across all projects per JR's Rule Supremacy. |
| 3 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Sub-area 4 still has real component carve-out work; sub-area 6 (Context refactor for `_storeHoursOverrides`) still parked. |
| 4 | `src/components/`, `src/utils/`, `src/hooks/` | New module surface created this session; future cuts should follow the same naming. |
| 5 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke (still blocked on Sarvi Monday). |

## Anti-Patterns (Don't Retry)

- Do NOT stack unmerged cuts on a feature branch for an extraction refactor. Each unmerged cut widens the gap between repo state and prod; a regression in cut N becomes ambiguous across cuts 1..N. Ship-merge-verify per cut.
- Do NOT trust Vite's build pass as evidence that all references resolve. Vite does not statically check undefined globals. Rollup catches missing imports between modules (caught the InactiveEmployeesPanel miss in cut 3) but cannot catch a name used in one file and silently deleted from the same file (white-page bug from `parseTime`).
- Do NOT batch-extract pure helpers with entangled helpers. `getStoreHoursForDate` reads module-level mutable refs; moving it without addressing the refs hides the smell. Pure-only extracts kept this clean across all 7 cuts.
- Do NOT trust your own grep when 4+ files share the same import name. Cut 3's missed `InactiveEmployeesPanel` and cut 6's "files modified by linter mid-edit" loops both came from re-running greps without verifying every match got handled. The pre-commit grep checklist in the plan-mode plan caught it before the commit.
- Do NOT rely on memory of "what I planned" while in execution mode. Plan-time knowledge does not survive. Write breadcrumbs.
- Prior session anti-patterns still in force -- see DECISIONS.md 2026-04-18 entries.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- waiting on Sarvi Monday 2026-04-19
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery
- Sub-area 6 (Context refactor for `_storeHoursOverrides` + `_staffingTargetOverrides`) -- own dedicated branch, blocks `getStoreHoursForDate` extraction

## Key Context

- Pure-extract phase of App.jsx is essentially done. What's left in App.jsx is real component code: `LoginScreen` (~400 lines, wired into auth flow), `ColumnHeaderEditor` (depends on store-hours overrides via the parked Context refactor), and the giant main App component with the admin schedule grid + staffing dashboard + drag-and-drop.
- Ship-merge-verify rhythm: commit -> merge to main fast-forward -> push -> JR (or me via curl/bundle hash) verifies live -> next cut. Branch optional for single-cut work; mandatory only when iterating before publishing.
- Apps Script deploy workflow on this project: paste `backend/Code.gs` into the live editor, save, then "Deploy -> Manage deployments -> Edit -> New version". No clasp setup; manual paste is the established pattern.
- "Promo" at OTR == commission payments tracked in a physical receipt box (NOT promotional staffing).
- `passwordChanged` flag (S41.3) is the source of truth for "is this user still on the default password." Hash-only auth doesn't change that logic.
- New global rules apply across ALL projects: complete-the-operation, refresher-checkpoints, plan-time-knowledge.
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

- `git status` -- expect clean (handoff write may be in flight)
- `git log --oneline -10` -- top should be handoff commit, then `eba776f`, `654c1ae`, `21c5f62`, `54e1d15`, `1a85e70`, `720e815`, `44dcc72`, `019c51c`, `eb146dd`
- `git rev-list --left-right --count origin/main...HEAD` -- `0 0` confirms synced
- `npm run build` -- should PASS (~464.79 kB)
- `wc -l src/App.jsx` -- expect 3702 lines (down from 4147 at session start)
- `ls src/components src/hooks src/utils` -- new files: components/{primitives,uiKit,CollapsibleSection}.jsx, hooks/useFocusTrap.js, utils/{storeHours,payPeriod,requests,api}.js
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- some post-cut-7 bundle hash
- Confirm with JR whether anything in the live UI looks off after the 7 cuts (cuts 3-7 are import-path-only so risk is low; only cut 1 and cut 2 were live-smoked explicitly)

## Next Step Prompt

Default: LoginScreen carve-out.

- Pre-flight: read `src/App.jsx` lines ~612-940 to scope LoginScreen + its helpers. Identify deps (state, callbacks, themed styles, password-default-prompt logic).
- Suggested target: `src/components/LoginScreen.jsx` (or `src/views/LoginScreen.jsx` if it grows beyond presentation).
- Proceed with the same cadence: plan first if non-trivial, refresher-checkpoints in plan, ship-merge-verify per cut.
- After LoginScreen, candidates: ColumnHeaderEditor (entangled with store-hours overrides -- might wait for Context refactor), or the schedule-grid section (large, multi-session).

If JR opens a new topic instead, follow him. Possible next thread directions: sub-area 6 Context refactor (closes audit item 6 + unblocks `getStoreHoursForDate` extraction), Welcome email on new-employee create, Schedule-change notifications to Sarvi, hold for Sarvi Monday smoke, or pause Phase E and pick up a different audit item.
