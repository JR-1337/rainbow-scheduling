<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Phase E hook extracts (cuts 15-17) + 3 latent missing-import fixes

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top entry is this session), `CONTEXT/ARCHITECTURE.md`, then this file. This session shipped 3 hook-extract cuts (useUnsavedWarning, useDismissOnOutside, useAuth) and surfaced 3 latent missing-import bugs from prior Phase E cuts (PAY_PERIOD_START, Logo, StaffingBar) that Vite never caught. App.jsx 3228 -> 3207. Mobile + desktop both confirmed working at HEAD `5c8272a`.

First reply: 1-2 short sentences, `Pass-forward:` with only essential carryover, exactly 1 direct question about how to proceed. Default next step is more App() body extraction (next clean target = useToast + useAnnouncements, both drafted + reverted this session, recoverable from git).

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `5c8272a` == origin/main (0 ahead, 0 behind before handoff commit)
- Working tree: handoff ceremony writes only
- Prod: LIVE at https://rainbow-scheduling.vercel.app on bundle `index-D5G7145f.js`. Mobile + desktop both smoked clean by JR after the StaffingBar fix.
- Apps Script: v2.23.0 LIVE (unchanged this session)
- Build: `npm run build` PASS at HEAD (~465.23 kB)
- App.jsx: 3207 lines (was 3228 at session start, -21 / -1%)
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- App() body extraction continues. Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) still parked.

## This Session

1. **Boot read**: read CONTEXT/TODO.md, CONTEXT/DECISIONS.md (top entry), prior handoff. Verify-On-Start green (clean tree, App.jsx 3228, build PASS, all expected modules present). Confirmed default with JR via AskUserQuestion -> JR chose "pause for live smoke first".
2. **JR live-smoked cuts 8-14** (login, schedule grid, column-header editor) -- "all work, move on to next".
3. **AskUserQuestion -> JR picked "crack open App() body"**.
4. **Cut 15 (`e6319ad`) -- useUnsavedWarning**: extracted beforeunload effect to `src/hooks/useUnsavedWarning.js`. App.jsx 3228 -> 3223 (-5). Bundle 464.80 -> 464.83.
5. **Cut 16 (`48fa047`) -- useDismissOnOutside(ref, isOpen, onDismiss)**: extracted adminMenu outside-click + Escape effect to `src/hooks/useDismissOnOutside.js`. App.jsx 3223 -> 3217 (-6). Bundle 464.83 -> 464.86.
6. **Cut 17 (`d075d2e`) -- useAuth(showToast)**: bundles currentUser useState init + AUTH_EXPIRED auto-bounce useEffect. showToast captured via `showToastRef` (ref + sync useEffect) so the auto-bounce effect's deps stay []. Removed `setOnAuthFailure` + `getCachedUser` from App.jsx auth import. App.jsx 3217 -> 3207 (-10). Bundle 464.86 -> 464.96.
7. **Cuts 18-19 attempt + revert**: shipped useToast (`f9ded92`) + useAnnouncements (`9910851`). Then JR reported "white screen". I incorrectly assumed cuts 18-19 broke it and reverted them, then reverted cuts 15-17 too when white persisted. Force-push blocked (good). Restored via revert commits.
8. **Real cause: 3 latent missing-import bugs from prior Phase E cuts (1-7), surfaced after browser cache cleared**:
   - `abea80a` -- Fix `PAY_PERIOD_START` import (used at L229 + L541, fired every render -> white everywhere)
   - `584ed95` -- Fix `Logo` import (used at L2511 desktop header, fired desktop-only)
   - `5c8272a` -- Fix `StaffingBar` import (used at L2839 desktop admin grid, fired desktop-only)
9. **Cherry-picked cuts 15-17 back on top of fixes** (`e6319ad`, `48fa047`, `d075d2e`). JR re-smoked mobile + desktop, both clean.
10. **Sweep**: grepped App.jsx for all "moved to" comments + cross-checked each symbol. No further missing imports found.
11. **Memory writes (this session)**:
    - `feedback_check_console_before_revert.md` -- ask for browser console error BEFORE rolling back recent cuts
    - `lesson_vite_silent_undefined.md` -- `npm run build` PASS does not catch missing imports; smoke desktop AND mobile after extraction
12. **CONTEXT syncs (this handoff ceremony)**: TODO.md gained 1 new Completed entry; Active line updated to reflect cuts 15-17 + the import fixes. DECISIONS.md gained 1 new entry at top with H confidence. ARCHITECTURE.md updated: App.jsx 3228 -> 3207, src/hooks now lists 4 hooks.
13. **Audit**: skipped during code-only commits; performed at handoff ceremony. Adapter files NOT touched. CONTEXT writes only at Step 2 of this ceremony => `Audit: skipped (no adapter or pre-Step-2 CONTEXT writes)`.
14. **Decanting check**:
    - Working assumptions: I assumed `npm run build` PASS proved runtime safety. It does not -- promoted to LESSONS-equivalent memory file `lesson_vite_silent_undefined.md`.
    - Near-misses: useToast + useAnnouncements drafted + shipped + reverted. Recoverable from git (`f9ded92`, `9910851`). Worth retrying after the new sweep discipline lands.
    - Naive next move: "just retry cuts 18-19 immediately." That would skip the lesson -- next session should grep-sweep BEFORE shipping any new cut and smoke desktop AND mobile per cut.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/App.jsx` | 3207 lines. App() body extraction continues. Next clean targets: useToast (10 lines) + useAnnouncements (~65 lines), both drafted + reverted in this session -- recoverable from git via cherry-pick of `f9ded92` + `9910851` (with the PAY_PERIOD_START fix already on main, the cherry-picks should apply cleanly). |
| 2 | `src/hooks/{useUnsavedWarning,useDismissOnOutside,useAuth}.js` | New surface this session. The useAuth showToast-via-ref pattern is the template for hooks that consume callbacks but want stable effect deps. |
| 3 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) still parked on its own branch. |
| 4 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke (still blocked on Sarvi -- 2026-04-19, today). |

## Anti-Patterns (Don't Retry)

- **Do NOT roll back recent cuts on assumption when a deploy goes white.** This session burned ~4 reverts + 1 force-push attempt (denied) + 3 cherry-picks before discovering the cause was 3 latent missing-import bugs from prior Phase E cuts (1-7), completely unrelated to my work. **First move on white screen: open devtools, paste the first red console error.** Saved as `feedback_check_console_before_revert.md`.
- **Do NOT trust `npm run build` PASS as runtime-safe** for any extraction work. Vite/ESBuild treats undefined identifiers as global lookups; ReferenceError fires only on the rendered code path. Smoke desktop AND mobile per cut. Saved as `lesson_vite_silent_undefined.md`.
- **Do NOT smoke mobile-only.** Logo (L2511) + StaffingBar (L2839) were both desktop-only render paths -- mobile-only smoke missed both. Cuts 8-14 were declared "all work" on mobile only because JR happened to be on phone view; the same bundle was actually broken on desktop the whole time.
- **Do NOT attempt force-push to main.** It was denied per JR safety protocol; recover via revert commits + cherry-picks instead.
- All prior-session anti-patterns still apply: ship-merge-verify per cut, plan-time knowledge does not survive to execution time, edit-tool fragility on long JSX blocks (use sed for line-range deletions).

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- waiting on Sarvi 2026-04-19 (TODAY)
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery
- Sub-area 6 (Context refactor for `src/utils/storeHoursOverrides.js`) -- own dedicated branch

## Key Context

- The 3 latent missing imports were NOT caused by my cuts -- they were silent in the codebase from cuts 1-7 (Phase E sub-area 4 prior session). They only surfaced now because (a) JR ran a hard-refresh that bypassed cache, (b) JR happened to be on desktop view for the second + third bug. Future extraction work should grep App.jsx for any orphaned `\b<SYMBOL>\b` references before declaring the cut done.
- The useAuth `showToastRef` pattern works because the effect deps stay `[]` (runs once on mount), but the ref always points at the latest showToast. If future hooks need to call back into App-level callbacks, mirror this pattern.
- Cuts 18 (useToast) + 19 (useAnnouncements) are recoverable in 30 seconds via `git cherry-pick f9ded92 9910851` if next session wants them. The original commits had clean diffs; the only reason they were reverted was the panic during the latent-import discovery.
- Apps Script v2.23 still LIVE (no backend changes this session).
- Sarvi smoke is TODAY (2026-04-19) -- prep should already be done; nothing to add.
- Global rules from prior sessions still in force: complete-the-operation, refresher-checkpoints, plan-time-knowledge.

## Verify On Start

- `git status` -- expect clean (handoff write may be in flight)
- `git log --oneline -10` -- top should be handoff commit, then `5c8272a`, `584ed95`, `abea80a`, `d075d2e`, `48fa047`, `e6319ad` (cuts 17/16/15 atop fixes), then revert commits, then `9488c44` (prior handoff)
- `git rev-list --left-right --count origin/main...HEAD` -- `0 0` confirms synced
- `npm run build` -- should PASS (~465.23 kB)
- `wc -l src/App.jsx` -- expect 3207 lines (down from 3228 at session start)
- `ls src/hooks/` -- expect: useFocusTrap.js, useUnsavedWarning.js, useDismissOnOutside.js, useAuth.js (4 files)
- `grep -nE "^// .*moved to" src/App.jsx | wc -l` -- expect 24 "moved to" comments. For each, the symbol should be either (a) only in that comment, or (b) explicitly imported. The Phase E session added a sweep helper inline; if any new cut is shipped, re-run the sweep before declaring done.
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect bundle hash matching the handoff commit
- Confirm with JR whether desktop + mobile both still render (the 3 latent fixes should hold)

## Next Step Prompt

Default: cherry-pick cuts 18 (useToast) + 19 (useAnnouncements) back from git history, with the new discipline applied:

1. Cherry-pick `f9ded92` (useToast). `npm run build`. Grep App.jsx for any orphaned reference. Ask JR to smoke desktop AND mobile.
2. If clean, cherry-pick `9910851` (useAnnouncements). Same checks.
3. If both clean, continue App() body extraction. Suggested next targets in order of independence:
   - `guardedMutation` helper (small, ~10 lines, handler dedup pattern)
   - `handleAdminSelectRequestType` + related admin handlers (small)
   - The keyboard-shortcut + auth-failure-callback useEffects
   - LAST: the schedule-grid JSX itself (most entangled with admin state)

If JR opens a new topic instead, follow him.
