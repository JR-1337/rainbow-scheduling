<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-19 -- Phase E hook extracts (cuts 18-21) + 1 latent orphan caught

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top entry still 2026-04-18 cuts 15-17), `CONTEXT/ARCHITECTURE.md`, then this file. This session shipped 4 hook-extract cuts (useToast, useAnnouncements, useGuardedMutation, useTooltip) autonomously per JR directive "do as many as you can on your own". One latent orphan caught by the new post-cut grep sweep discipline: cut 18 extracted useToast but `setToast` was still used at 4 bulk-save progress call sites; fix exposed setToast from the hook. App.jsx 3207 -> 3120 (-87, -2.7%). JR confirmed prod renders clean 2026-04-19.

First reply: short sentence + 1 direct question. Default next step = handler-factory cut to collapse the 22 guardedMutation call sites (see Next Step Prompt below).

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `c959852` == origin/main (0 ahead, 0 behind before handoff commit)
- Working tree: handoff ceremony writes only
- Prod: LIVE and smoke-confirmed by JR 2026-04-19 (no white screen, mobile + desktop render clean at HEAD).
- Apps Script: v2.23.0 LIVE (unchanged this session)
- Build: `npm run build` PASS at HEAD (~465.74 kB; 465.06 -> 465.74 across cuts 18-21)
- App.jsx: 3120 lines (was 3207 at session start, -87 / -2.7%)
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- App() body extraction continues. Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) still parked.

## This Session

1. **Boot**: Verify-On-Start green (clean tree, App.jsx 3207, build PASS, 4 hooks present, 0/0 vs origin). Confirmed default with JR -> JR chose autonomous mode: "do as many as you can on your own".
2. **Wrote scratchpad** at `~/.claude/scratch/rainbow-phase-e-cuts.md` with the post-cut discipline checklist (grep orphans, smoke desktop+mobile, don't roll back on assumption, etc.).
3. **Cut 18 (`1d608f4`) -- useToast**: cherry-picked from git history (`f9ded92`). Build PASS.
4. **Orphan sweep caught `setToast` at L690/695/816/821** (bulk-save progress). useToast only returned `{toast, showToast}`. Fix (`fcaf155`): expose setToast from hook + destructure in App.jsx. This is the exact latent-bug class the previous session shipped blindly.
5. **Cut 19 (`3e99b8d`) -- useAnnouncements**: cherry-picked (`9910851`). Bundles announcements state + saveAnnouncement/clearAnnouncement/setCurrentAnnouncement/savingAnnouncement. Orphan sweep clean.
6. **Cut 20 (`ce0a870`) -- useGuardedMutation(showToast)**: net-new. Bundles `actionBusyRef` + `guardedMutation` double-submit guard. 22 call sites unchanged. Orphan sweep clean.
7. **Cut 21 (`c959852`) -- useTooltip**: net-new. Bundles `tooltipData` state + `handleShowTooltip` (with viewport-safe positioning) + `handleHideTooltip`. Orphan sweep clean.
8. **Stopped extraction**: remaining targets in App.jsx are either too trivial (1-line effect wrappers saving <5 lines) or too entangled (loadDataFromBackend = ~200 lines closing over 15+ setters; handleLogin/handleAutofillPKWeek depend on many cross-cutting deps).
9. **CONTEXT syncs**: TODO.md -- Active line updated to reflect 3207 -> 3120; new Completed entry added at top. ARCHITECTURE.md -- App.jsx line count + hooks list updated.
10. **Audit**: skipped during code-only commits. CONTEXT writes at Step 2 of this ceremony => `Audit: skipped (no adapter or pre-Step-2 CONTEXT writes)`.
11. **Decanting check**:
    - Working assumption: "cherry-picked diff is safe because it already shipped once before". Turned out false -- useToast diff dropped setToast from the API, and cut 18 had been reverted before JR (or I) noticed the setToast callers. The grep-sweep discipline from last session is what caught it. That discipline is now validated, not just theoretical.
    - Near-miss: no other orphans found in cuts 19-21 after sweeps. Orphan sweep for symbols `setTooltipData`, `actionBusyRef`, `setAnnouncements`, `getCurrentPeriodStartDate` all returned 0 residual references (setAnnouncements = 2 but both are legit: 1 hook destructure, 1 load-flow call site).
    - Naive next move: "just keep extracting forever." Remaining targets cross a complexity threshold -- the next cut should wait for JR smoke validation of 18-21 first.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/App.jsx` | 3120 lines. Next extraction candidates (all require more care): the two store-hours sync effects (L208-209, combine into useSyncOverrides saves 2 lines, low value), the reopen-staff-panel effect at L248-254 (6 lines, tightly scoped), handleCellClick + handleEditEmployee (8 lines, already useCallback). Bigger targets (loadDataFromBackend, handleLogin, handleAutofillPKWeek, handleBulkPK, the 22 guardedMutation handlers at L1193-1745) all close over cross-cutting state and need a prop/context strategy, not a hook wrapper. |
| 2 | `src/hooks/{useToast,useAnnouncements,useGuardedMutation,useTooltip}.js` | New surface. useToast exposes `{toast, setToast, showToast}` -- setToast is there specifically for the bulk-save progress-counter pattern; don't drop it. |
| 3 | `~/.claude/scratch/rainbow-phase-e-cuts.md` | Discipline checklist. Read BEFORE shipping any new cut next session. |
| 4 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) still parked on its own branch. |
| 5 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke (scheduled for JR+Sarvi smoke). |

## Anti-Patterns (Don't Retry)

- **Do NOT trust a cherry-pick because it shipped once before.** Cut 18's original diff had the setToast orphan baked in; the previous session's reverts masked it. Re-run the orphan sweep on EVERY cut regardless of provenance.
- **Do NOT roll back recent cuts on assumption when a deploy goes white.** First move = devtools console. Saved as `feedback_check_console_before_revert.md`.
- **Do NOT trust `npm run build` PASS as runtime-safe.** Vite/ESBuild treats undefined idents as global lookups. Saved as `lesson_vite_silent_undefined.md`.
- **Do NOT smoke mobile-only.** Both Logo + StaffingBar latent bugs were desktop-only render paths.
- **Do NOT force-push to main.**
- **Do NOT chase the marginal extract when the easy ones are done.** The next extract requires either (a) a prop/context decision (loadDataFromBackend, handlers) or (b) a judgment that 2-line savings aren't worth the noise. Let the cut wait for fresh context.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- JR+Sarvi smoke scheduled
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery
- Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) -- own dedicated branch

## Key Context

- The setToast-orphan catch is the direct validation of the discipline saved last session. Worth keeping the sweep as a default; it earned its keep on the first cut.
- Cuts 18-21 went in without JR smoke. JR explicitly said "if i wake up tomorrow and it doesnt work ill run the console for clues". So next-session smoke = JR opens prod, if white he pastes first red console error, do NOT preemptively revert.
- useGuardedMutation preserves the exact actionBusyRef semantics -- double-submit guard is per-hook-instance, same as when it was inline.
- useTooltip positioning logic is unchanged from inline version (viewport-safe left/top math lives in the hook).
- useToast change: API is now `{toast, setToast, showToast}`. setToast is needed for bulk-save progress-counter pattern where showToast's setTimeout would race with the next update.
- Apps Script v2.23 still LIVE (no backend changes this session).
- Global rules from prior sessions still in force.

## Verify On Start

- `git status` -- expect clean (handoff write may be in flight)
- `git log --oneline -10` -- top should be handoff commit, then `c959852`, `ce0a870`, `3e99b8d`, `fcaf155`, `1d608f4`, `53f0064` (prior handoff)
- `git rev-list --left-right --count origin/main...HEAD` -- `0 0` confirms synced
- `npm run build` -- should PASS (~465.74 kB)
- `wc -l src/App.jsx` -- expect 3120 lines
- `ls src/hooks/` -- expect 8 files: useAnnouncements, useAuth, useDismissOnOutside, useFocusTrap, useGuardedMutation, useToast, useTooltip, useUnsavedWarning
- `grep -nE "^  // .*moved to" src/App.jsx` -- expect 2 (tooltip + guardedMutation from this session)
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect bundle hash matching HEAD build (will have rotated from `index-B202b1aE.js` after Vercel processes cuts 19-21)
- Ask JR: did desktop + mobile render cleanly on first hard-refresh? If white, paste first red console error BEFORE any revert.

## Next Step Prompt

Prod confirmed clean at HEAD. Three real candidates, in order of value:

1. **Handler-factory cut (biggest win, ~100 lines)**: the 22 `guardedMutation('X', async () => { apiCall(...); if (success) showToast('success', ...); else showToast('error', ...); ... })` blocks at L1193-1745 share a shape. A `makeStatusMutationHandler({ label, action, payload, onSuccess, successMsg, errorMsg })` factory could collapse most of them. Needs JR alignment on the abstraction shape BEFORE writing -- some handlers do post-success state updates that don't all fit one pattern.
2. **Small hook cleanups (low value, safe)**: combine L208-209 sync effects; extract L248-254 reopen-staff-panel effect; extract L327-334 bootstrap effect. Each saves 2-6 lines. Only worth it if JR wants App.jsx line count below 3100 for psychological reasons.
3. **Sub-area 6 (parked)**: replace `src/utils/storeHoursOverrides.js` module-level refs with a Context provider. Own branch. Higher risk, biggest architectural cleanup.

Non-extraction work queued in TODO.md Active: backup-cash role clarification (Sarvi), welcome email on new-employee create, schedule-change notifications to Sarvi, CF Worker SWR cache (blocked on JR green-light), payroll aggregator path 1 (blocked on Sarvi discovery).

If JR opens a new topic instead, follow him.
