# Handoff — RAINBOW Scheduling

Session 37. `CLAUDE.md` auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md` at session start.

## Session Greeting

S39.3b landed clean. Three post-demo feature specs logged this session from Sarvi feedback: payroll aggregator (path 1), consecutive-days warning, Meetings+PK shift types. All three have project-memory files so they'll auto-load next session. Demo is **2026-04-14 (2 days)**.

Next up on the plan: **S39.3c** (AdminShiftOffersPanel → `src/panels/`, ~204 lines, carries 2 reject modals). Template is S39.3a. Ask JR whether to continue S39.3c/d pre-demo or switch to S35 browser verify — grounding, not a plan-step re-ask.

## State

- Build: PASS (`437c76a`, pushed, Vercel auto-deploys)
- Tests: NONE
- Branch: `main`, up-to-date with origin
- Last commit: `437c76a` docs: log Meetings + PK shift types feature
- Live: https://rainbow-scheduling.vercel.app
- Apps Script live = **v2.14** (unchanged; local Code.gs = v2.15; deploy deferred by JR)
- `git status`: clean on main; 3 untracked (`Photos/`, `dist/`, `package-lock.json`)

## This Session

- S39.3b (`63fb688`): `AdminMyTimeOffPanel` → `src/panels/AdminMyTimeOffPanel.jsx`. Exported `CollapsibleSection` from App.jsx so panels can import it (circular-safe: referenced inside function body only). App.jsx 8436 → **8282** (-154).
- Logged 3 post-demo feature specs: payroll aggregator (`cde9cd7`), consecutive-days warning (`1a1ca67`), Meetings+PK shift types (`437c76a`). Project memory files created for payroll + meetings so future sessions load the specs automatically.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes (S39.3b) | AdminShiftOffersPanel + AdminShiftSwapsPanel still inline; post-S39.3b line numbers have shifted (grep to find) |
| 2 | `src/panels/AdminMyTimeOffPanel.jsx` | Yes (new) | Template for S39.3c + S39.3d (3c carries 2 reject modals) |
| 3 | `src/panels/AdminTimeOffPanel.jsx` | No | Template for reject-modal extraction pattern (3c + 3d will mirror this) |
| 4 | `src/modals/AdminRequestModal.jsx` | No | Imported by any panel with a request modal |
| 5 | `~/.claude/plans/lovely-launching-marble.md` | No | S39.3c/d still actionable as written; S39.4 remains deferred (see decisions.md) |

## Anti-Patterns (Don't Retry)

- **Executing S39.4 per the plan file** (since S36) — conflicts with decisions.md 2026-02-10. `isMobileAdmin` branch reads 30+ App-scope state vars via closure. Revisit only after state refactor.
- **Asking JR "which plan step next?"** (since S35) — the plan is the answer. Exception: flagging a genuine decisions.md conflict.
- **Trusting `result.success` from `chunkedBatchSave`** (since S34) — callers must read `data.{totalChunks, failedChunks}` on `success: false`.
- **Top-level use of imported symbols in `src/pdf/generate.js` / `src/email/build.js` / `src/panels/*.jsx`** (since S34) — circular imports with `../App` are safe ONLY inside function bodies.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs v2.15 deploy | JR manual | Harmless but open |
| Email sender upgrade | JR providing sender email | Pre-existing |
| S35 browser verify | JR / Chrome-ext Claude | CLI has no browser tool |
| S39.4 mobile admin extract | Admin state → Context refactor | See 2026-04-12 decision |
| Payroll aggregator design | Sarvi answering 4 discovery Qs | JR emailing |
| Consecutive-days warning | (deferred post-demo; spec complete) | — |
| Meetings+PK shift types | (deferred post-demo; spec complete) | — |

## Key Context

- **S39.3c extraction template** (mirror S39.3a):
  1. Panel uses `AdminRequestModal` + 2 reject-flow modals → both carry with the panel.
  2. Imports: `THEME`/`TYPE` from `../theme`, `REQUEST_STATUS_COLORS`/`ROLES_BY_ID` from `../constants`, `parseLocalDate` from `../utils/format`, `AdminRequestModal` from `../modals/AdminRequestModal`, `CollapsibleSection` from `../App` (if used), lucide icons direct.
  3. Grep-sweep `const AdminShiftOffersPanel` returns 0 hits in App.jsx after extraction. Build + `npm run preview` curl 200 before committing.
  4. Use **explicit `git add <paths>`** — never `-A` or `.` (untracked `Photos/`, `dist/`, `package-lock.json` will contaminate the commit; see lessons.md).
- **Line numbers shifted post-S39.3b** — grep `const AdminShiftOffersPanel` / `const AdminShiftSwapsPanel` in App.jsx to find current positions (were 2870 / 3983 pre-S39.3b, now roughly 2716 / 3829 but confirm).
- **Three post-demo features queued** (specs in todo.md + decisions.md for payroll, project memory for payroll + meetings+pk):
  - Consecutive-days warning: 6+ consecutive work days = row-level badge (admin-only, warning not block, PTO/holiday breaks streak, Meeting/PK don't count as a day-on).
  - Meetings+PK: new shift `type` field (work|meeting|pk) orthogonal to role. 2hr default, overlap-aware union hours, neutral colors, PK bulk-assign+opt-out, Meeting individual.
  - Payroll aggregator: Rainbow bridges Counterpoint → ADP with in-app bonus entry; pending Sarvi discovery.

## Verify On Start

- [ ] `git status` clean on main, 3 untracked (`Photos/`, `dist/`, `package-lock.json`)
- [ ] `git log --oneline -1` top is `437c76a`
- [ ] `npm run build` passes
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` → 200
- [ ] `grep -n "const AdminMyTimeOffPanel" src/App.jsx` returns 0 hits
- [ ] `grep -n "const AdminShiftOffersPanel" src/App.jsx` returns 1 hit (confirm current line number before extraction)
- [ ] `AskUserQuestion` to confirm pre-demo (S35 browser verify) vs continue-extraction (S39.3c) — grounding only
