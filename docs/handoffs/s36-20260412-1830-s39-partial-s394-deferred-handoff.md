# Handoff — RAINBOW Scheduling

Session 36. `CLAUDE.md` auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, and plan file `~/.claude/plans/lovely-launching-marble.md` at session start.

## Session Greeting

S39 partial: extractions 39.1 / 39.2 / 39.3a shipped. Plan's S39.4 (isMobileAdmin branch → own file) was **deferred** mid-session because it conflicts with decisions.md 2026-02-10 "Mobile Admin as If-Branch" — JR agreed to tie it off and revisit later. Remaining work (S39.3b/c/d) sits post-demo. Demo is **2026-04-14 (2 days)**.

Next up: either finish **S39.3b/c/d** (AdminMyTimeOffPanel, AdminShiftOffersPanel, AdminShiftSwapsPanel → `src/panels/`) or do **S35 browser verify** pre-demo. Ask JR which — this IS grounding, not the banned "which plan step?" ask. Do not attempt S39.4 without a state-context refactor landing first.

## State

- Build: PASS (`429a5b4`, Vercel auto-deploys)
- Tests: NONE
- Branch: `main`, pushed
- Last commit: `429a5b4` docs: sync todo + log S39.4 deferral decision
- Live: https://rainbow-scheduling.vercel.app
- Apps Script live = **v2.14** (unchanged; local Code.gs = v2.15; deploy still deferred by JR)
- `git status`: clean on main; 3 untracked (`Photos/`, `dist/`, `package-lock.json`) as before

## This Session

- S39.1 (`74e6382`): OTR/THEME/TYPE → `src/theme.js`; ROLES/ROLES_BY_ID → `src/constants.js`. App.jsx re-exports for back-compat with mobile views + pdf/email builders.
- S39.2 (`c506811`): `AdminRequestModal` → `src/modals/AdminRequestModal.jsx`.
- S39.3a (`77236a9`): `AdminTimeOffPanel` → `src/panels/AdminTimeOffPanel.jsx`. `REQUEST_STATUS_COLORS` moved to `src/constants.js`. Carries deny + revoke reject modals.
- `23327a1`: lessons.md entry for `git add -A` mistake I caught + fixed this session.
- `429a5b4`: decisions.md entry recording S39.4 deferral + todo.md sync.
- App.jsx: 8839 → **8436** (-403 lines).

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes | Remaining panels still inline here; `CollapsibleSection` still local (needs export for S39.3b) |
| 2 | `src/panels/AdminTimeOffPanel.jsx` | Yes (new) | Template for S39.3b/c/d |
| 3 | `src/theme.js` | Yes (new) | OTR + THEME + TYPE + module-init side effects live here now |
| 4 | `src/constants.js` | Yes (new) | ROLES, ROLES_BY_ID, REQUEST_STATUS_COLORS |
| 5 | `src/modals/AdminRequestModal.jsx` | Yes (new) | Used by S39.3a panel; S39.3c/d panels will also import |
| 6 | `~/.claude/plans/lovely-launching-marble.md` | No | S39.4 step supersedes prior decision — do not execute as written |

## Anti-Patterns (Don't Retry)

- **`git add -A` / `git add .` during commits** (since S36) — swept `Photos/` + `dist/` + `package-lock.json` into an S39.3a staged commit. Soft-reset + explicit re-add fixed it. Now in `docs/lessons.md`. Always `git add <explicit paths>`.
- **Executing S39.4 per the plan file** (since S36) — conflicts with decisions.md 2026-02-10. `isMobileAdmin` branch reads 30+ App-scope state vars via closure. Extracting forces either 30+ prop drilling or a Context refactor. Decision is still valid; revisit only after state refactor.
- **Asking JR "which plan step next?"** (since S35) — still binding. The plan is the answer. Exception: flagging a genuine decisions.md conflict (as happened with S39.4).
- **Trusting `result.success` from `chunkedBatchSave`** (since S34) — callers must read `data.{totalChunks, failedChunks}` on `success: false`.
- **Top-level use of imported symbols in `src/pdf/generate.js` / `src/email/build.js`** (since S34) — circular imports with `../App` safe only inside function bodies. Same applies to new `src/panels/*.jsx` files that import `CollapsibleSection` etc. from App.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs v2.15 deploy | JR manual | Harmless but open. |
| Email sender upgrade | JR providing sender email | Pre-existing. |
| S35 browser verify | JR / Chrome-ext Claude | CLI has no browser tool. |
| S39.4 mobile admin extract | Admin state → Context refactor | See 2026-04-12 decision entry. |

## Key Context

- **Extraction pattern for S39.3b/c/d** (use AdminTimeOffPanel as template):
  1. Panels that call `<CollapsibleSection>` (e.g. AdminMyTimeOffPanel) — export `CollapsibleSection` from App.jsx first, then panel imports it.
  2. Panels that use `AdminRequestModal` — just `import { AdminRequestModal } from '../modals/AdminRequestModal'`.
  3. Always: `THEME`/`TYPE` from `../theme`, `REQUEST_STATUS_COLORS`/`ROLES_BY_ID` from `../constants`, `parseLocalDate` from `../utils/format`, lucide icons direct, reject modals carry with the panel.
  4. Grep-sweep old `const AdminXPanel =` returns 0 hits in App.jsx after each cut. Build + vite preview curl 200 before committing.
- **Current panel line numbers in App.jsx** (post-S39.3a):
  - `AdminMyTimeOffPanel` — line 2714, ~155 lines, no reject modals, uses CollapsibleSection
  - `AdminShiftOffersPanel` — line 2870, ~204 lines, has 2 reject modals
  - `AdminShiftSwapsPanel` — line 3983, ~323 lines, has 2 reject modals
- **Plan file drift:** `~/.claude/plans/lovely-launching-marble.md` wasn't updated with the S39.4 deferral. The plan as written is stale on that line only. Trust `docs/decisions.md` over the plan.

## Verify On Start

- [ ] `git status` clean on main, 3 untracked (`Photos/`, `dist/`, `package-lock.json`)
- [ ] `git log --oneline -1` top is `429a5b4`
- [ ] `npm run build` passes
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` → 200
- [ ] `grep -n "const AdminTimeOffPanel" src/App.jsx` returns 0 hits
- [ ] `grep -n "const AdminRequestModal" src/App.jsx` returns 0 hits
- [ ] `AskUserQuestion` to confirm pre-demo (S35 browser verify) vs post-demo (S39.3b/c/d) work — grounding only, not a plan-step re-ask
