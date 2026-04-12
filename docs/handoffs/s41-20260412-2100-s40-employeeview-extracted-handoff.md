# Handoff — RAINBOW Scheduling

Session 41. `CLAUDE.md` auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md` at session start.

## Session Greeting

S40 shipped three commits:

- **S40.1** (`3227f81`): EmployeeView → `src/views/EmployeeView.jsx` (+ EmployeeViewRow, EmployeeScheduleCell). App.jsx **4597 → 3664 (−933)**. Three new App.jsx exports: `CURRENT_PERIOD_INDEX`, `Logo`, `TaskStarTooltip`.
- **S40.2** (`7c005fb`): restored `callerEmail` to ChangePasswordModal + AdminSettingsModal payloads. Found during browser verify — backend `changePassword` at Code.gs:531 reads `callerEmail` straight from payload (never got `verifyAuth(token)` wrapper during S36). Lesson added.
- **S40.3** (`2f27662`): hotfix — `ROLES` was trimmed from the '../App' import in EV during unused-symbol cleanup, but it IS used at L414/L730 inside function bodies. Vite didn't catch it (lessons.md #30 strikes again). Prod white-screened for ~10 min between `9a052c0` push and hotfix push.

Demo is **2026-04-14 (2 days)**. App.jsx is the smallest it's been since the project started.

## State

- Build: PASS (`2f27662`)
- Branch: `main`, pushed
- App.jsx: **3664 lines**
- Last commit: `2f27662` S40.3 hotfix: restore ROLES import
- Live: https://rainbow-scheduling.vercel.app (pushed, deploying — hard-refresh to pick up new bundle)
- Apps Script live: v2.14 (local v2.15, deploy deferred)

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/views/EmployeeView.jsx` | Yes (new, 959L) | Final extraction target. Under-verified — desktop schedule confirmed, mobile NOT yet (JR hit limit before confirming post-hotfix) |
| 2 | `src/modals/ChangePasswordModal.jsx` | Yes (+ callerEmail) | S37 regression fix |
| 3 | `src/modals/AdminSettingsModal.jsx` | Yes (+ callerEmail) | Same fix, admin self-change path |
| 4 | `src/App.jsx` | Yes (extensive) | 3664 lines. 3 new exports for EV closure surface |
| 5 | `backend/Code.gs` | No | v2.14 live, v2.15 local. `changePassword`@L531 still reads payload.callerEmail directly — audit other handlers for the same gap |

## Anti-Patterns (Don't Retry)

- **Trimming "unused" imports via a hand-typed loop without re-scanning the final file.** S40.3 root cause: I wrote `for s in STORE_HOURS TYPE ...` missing `ROLES`, so my "unused" scan silently missed ROLES's presence, I dropped it from the import, and the bug only surfaced when JR opened the request-type modal. Fix pattern next time: scan the file for every App-export identifier programmatically, not from a typed list.
- **Listing post-demo deferrals in next-task options** (since S38) — 2 days to meeting, drop deferred items.
- **Extracting view components by pattern-matching the modal recipe without a closure audit** — EV was doable but required 3 new exports. Future extractions (MobileAdminView when unblocked) need the same upfront audit.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs v2.15 deploy | JR manual | Harmless; S37 back-compat means not strictly required |
| Email sender upgrade | JR providing sender | Pre-existing |
| S35 browser verify | JR / Chrome-ext Claude | CLI has no browser |
| First-login bypass via token-refresh | Known quirk, post-demo | Token-restore path skips `login`, so password-change prompt is skippable by refresh. Not a security issue (token was already valid) but cosmetic. |

## Key Context

- **S40.2 fix scope is possibly incomplete.** I only patched the two change-password modals. Other frontend→backend calls that S37 stripped `callerEmail` from may be similarly broken if their Code.gs handler doesn't use `verifyAuth(payload)`. Audit path: `grep -n 'const.*callerEmail.*payload' backend/Code.gs` and cross-check each against `apiCall(...)` call sites.
- **EV mobile branch under-verified post-hotfix.** JR saw desktop schedule OK pre-hotfix and "mobile white screen" post-ROLES-crash. After S40.3 the ROLES ReferenceError is gone but he hit limit before re-verifying mobile. First thing next session: have JR hard-refresh mobile + click through bottom-nav tabs (Schedule, Requests, Comms).
- **Extraction recipe needs an amendment** (see anti-pattern 1). Don't trust hand-written "unused symbol" lists. After extraction, run a programmatic check: for every symbol in the App.jsx export list, grep the new file; anything with refs must be in the import. A ready-to-paste version:

  ```bash
  EXPORTS=$(grep -oE '^export (const|function) [A-Za-z_][A-Za-z0-9_]*|^export \{[^}]+\}' src/App.jsx | grep -oE '\b[A-Za-z_][A-Za-z0-9_]+\b' | grep -v -E '^(export|const|function)$' | sort -u)
  IMPORTS=$(awk '/from .\.\.\/App.;?$/{exit} /from .\.\.\/App.;?$/' src/views/EmployeeView.jsx  # use sed '3,11p' or similar)
  # for each in EXPORTS: if grep finds refs in EV AND not in IMPORTS → MISSING
  ```

## Verify On Start

- [ ] `git status` clean on main, not ahead of origin
- [ ] `git log --oneline -1` top is `2f27662`
- [ ] `wc -l src/App.jsx` → 3664
- [ ] `wc -l src/views/EmployeeView.jsx` → 959
- [ ] `npm run build` passes
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` → 200
- [ ] `grep -n "ROLES," src/views/EmployeeView.jsx` → line 4 (THEME, ROLES, ROLES_BY_ID,)
- [ ] `AskUserQuestion` to confirm: mobile re-verify post-hotfix, OR audit other callerEmail-stripped sites, OR pivot to demo polish?

## Session stopping point

S40.3 hotfix pushed at `2f27662`. JR hit context limit while I was running the exhaustive cross-check sweep (script was broken, false positives — the actual file is fine). Mobile has not been re-verified since the ROLES hotfix landed. Prod should be healthy now but JR hasn't confirmed.
