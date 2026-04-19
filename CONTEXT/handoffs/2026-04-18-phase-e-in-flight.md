<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Phase E sub-areas 1 and 3 shipped; test-employee scrub mid-flight

## Session Greeting

This session shipped adversarial-audit Phase E sub-area 1 (unused-import sweep, commit `45bf7fa`) and closed sub-area 3 (PDF XSS sweep -- verified already clean, commit `51ea778`), then added editor-only `listTestEmployees` + `purgeTestEmployees` admin functions to `backend/Code.gs` (commit `2b4e5d4`) for a one-time test-account scrub Sarvi requested. The scrub is not yet executed -- JR must run `listTestEmployees` from the Apps Script editor, review the log, then run `purgeTestEmployees`. Read in this order: `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top 2 entries are this session), this file.

First reply: 1-2 short sentences, `Pass-forward:` with only essential carryover, exactly one direct question about how to proceed. Default next step is executing the test-employee scrub.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `2b4e5d4` == origin/main (0 ahead, 0 behind)
- Working tree: handoff ceremony writes only
- Prod: LIVE at https://rainbow-scheduling.vercel.app on bundle `index-BsP3clNm.js` (local build hash; Vercel redeploy after commits `45bf7fa` / `51ea778` / `2b4e5d4` should be complete -- JR to hard-refresh)
- Apps Script: v2.22.0 deployed; editor-only purge functions NOT deployed yet (no HTTP impact; editor-only, so a new deployment is not required to run them)
- Build: `npm run build` PASS on `45bf7fa` (465.06 kB, byte-identical to pre-unused-import-sweep -- Vite was already tree-shaking these)
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- sub-areas 1 and 3 closed; sub-areas 2 (plaintext password removal) and 4 (App.jsx extraction multi-session) remain

## This Session

1. **Phase E sub-area 1 (`45bf7fa`)**: Unused-import sweep. Programmatic detector at `/tmp/unused-imports.mjs` (AST-free regex scan) identified 42 candidates. Manual cross-check per-candidate. 27 stray `import React` removed (Vite auto-JSX-runtime via `@vitejs/plugin-react@4` -- grep for `React.*` confirmed those 27 files never use the namespace). 15 dead named imports removed from `src/App.jsx` (`MobileMenuDrawer/MobileAnnouncementPopup/MobileScheduleGrid/MobileBottomNav`, `buildEmailContent`, `OTR_ACCENT`, `REQUEST_STATUS_COLORS`, `AdminRequestModal`, 5 Panel imports, `OfferShiftModal`, `SwapShiftModal`). Each verified: App.jsx state-var `adminRequestModalOpen` matches the literal name fragment but drives `<RequestTimeOffModal>` not the imported `AdminRequestModal` component. Features still alive via `src/views/EmployeeView.jsx` + 4 Panel files that import their own copies. 28 files changed; bundle byte-identical.
2. **Phase E sub-area 3 (`51ea778`)**: PDF XSS sweep closed as already-complete. Audited every `${...}` in `src/pdf/generate.js`. All 7 user-writable interpolations wrapped in `cleanText` (== `escapeHtml(stripEmoji(s))`): `announcement.subject`, `announcement.message`, `ev.note`, `shift.task`, `emp.name`, `r.fullName`, `a.name`, `a.email`. Role color has explicit regex hex whitelist at `generate.js:131`. `src/email/build.js` emits plain-text mail. LESSONS note "only 5 sites escaped" was stale; prior commit had expanded the sweep before this session.
3. **Test-employee scrub groundwork (`2b4e5d4`)**: Sarvi reports her deleted test accounts still appear in Managed Staff + schedule history. Added two functions to `backend/Code.gs` (after `clearAllData` at line 2338):
   - `listTestEmployees()` -- read-only; finds rows with `@example.com` email in Employees sheet; logs id/name/email/active plus cross-sheet match counts for Shifts and ShiftChanges.
   - `purgeTestEmployees()` -- destructive; deletes bottom-up from Shifts (match on `employeeEmail` or `employeeId`), ShiftChanges (match on `employeeEmail`, `recipientEmail`, or `partnerEmail`), then Employees.
   - Neither is wired to `handleRequest` dispatch. Editor-only invocation. Same pattern as `clearAllData`.
4. **Drive MCP auth**: Attempted `mcp__claude_ai_Google_Drive__authenticate` so I could read the live Sheet directly. JR authed on claude.ai web, but MCP still shows only the `authenticate` stub -- claude.ai-managed connector auth does NOT carry into the Claude Code CLI session. JR suspects a VS Code restart might help. Fallback path: JR runs `listTestEmployees` in Apps Script editor, pastes the log back, I confirm the list, he runs `purgeTestEmployees`.
5. **CONTEXT syncs**: TODO.md Active trimmed (Phase E sub-area 1 and 3 notes updated). TODO.md Completed gained 2 entries. DECISIONS.md gained 2 entries at top (editor-only admin functions; PDF XSS closed). LESSONS.md unchanged. ARCHITECTURE.md unchanged.
6. **Audit**: CONTEXT TODO.md was edited twice before Step 2 of the handoff ceremony (commits `45bf7fa` and `51ea778` both synced TODO in-flight). Ran bloat/drift pass. Audit: clean. No rationale leaked into TODO, no architecture leaked into DECISIONS, no task state leaked into LESSONS, no adapter files touched.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `backend/Code.gs` (lines 2346-end) | `listTestEmployees` / `purgeTestEmployees` -- JR runs from Apps Script editor |
| 2 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke (still blocked on Monday) |
| 3 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Phase E sub-areas 2 (plaintext password) + 4 (App.jsx extraction) remaining |
| 4 | `src/App.jsx` | 15 dead imports removed; file still 4147 lines, Phase E sub-area 4 target |
| 5 | `docs/schemas/sheets-schema.md` | Authoritative column map used by the purge functions (Employees, Shifts, ShiftChanges) |

## Anti-Patterns (Don't Retry)

- Do NOT hand-sweep unused imports in App.jsx without a programmatic cross-check. S40.3 white-screen precedent still applies. (this session: regex scan + per-candidate manual verification, not eyeball)
- Do NOT treat claude.ai web MCP auth as equivalent to Claude Code CLI MCP auth. They are separate contexts; CLI needs its own auth flow. (since 2026-04-18)
- Do NOT wire destructive one-time scrubs to HTTP handlers. Editor-only invocation (like `clearAllData` at Code.gs:2338) is the established pattern. (since 2026-04-18 -- see DECISIONS)
- Do NOT claim Phase E sub-area X "needs work" without re-verifying against the current code. The PDF XSS claim was stale at audit-plan-write time. (since 2026-04-18)
- Do NOT `rm -rf` any `.cache/ms-playwright/mcp-chrome-*/SingletonLock`. Permission denial is the harness telling you to quit the running browser properly. (since 2026-04-18)
- Prior session anti-patterns still in force -- see prior handoff (now deleted) or DECISIONS.md 2026-04-18 entries.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- waiting on Sarvi Monday 2026-04-19
- Drive MCP auth from Claude Code CLI -- VS Code restart pending; fallback is JR paste
- Test-employee purge -- blocked by JR running `listTestEmployees` in Apps Script editor first
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery

## Key Context

- "Test employees" scope chosen by JR: identify by `@example.com` email pattern; scrub Employees + Shifts + ShiftChanges (full union -- includes requests where a test account was recipient or swap partner).
- JR's executor-stopping-points cadence: A+B -> verify -> C -> verify -> D -> verify -> E. Phase E is piecemeal; each sub-area shipped individually with commit-per-area and review gate. Sub-areas 1 and 3 done; 2 (plaintext password removal) and 4 (App.jsx extraction) pending.
- Phase E sub-area 2 (plaintext password removal) pre-req: audit every row in the live Employees sheet to confirm `passwordHash` is populated. If any row has plaintext but no hash, the branch removal locks that user out. The new `listTestEmployees` pattern (editor-only read of the sheet) could be extended to an `auditPasswordHashes()` utility.
- Phase E sub-area 4 (App.jsx extraction) is explicitly multi-session, own branch, own review. 4147 lines after this session; still the biggest file.
- "Promo" at OTR == commission payments tracked in a physical receipt box (NOT promotional staffing).
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

- `git status` -- expect clean-ish (handoff ceremony write may be in-flight)
- `git log --oneline -6` -- top should be handoff commit, then `2b4e5d4`, `51ea778`, `45bf7fa`, `fc5fe97`, `b0851f8`
- `git rev-list --left-right --count origin/main...HEAD` -- `0 0` confirms synced
- `npm run build` -- should PASS (~465 kB)
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect `index-BsP3clNm.js` or newer after Vercel redeploy of `2b4e5d4`
- Confirm with JR whether Drive MCP auth now works after VS Code restart, OR whether to proceed via Apps Script editor log paste

## Next Step Prompt

Default: execute the test-employee scrub.

- If Drive MCP auth is live: read the Employees sheet directly, list `@example.com` rows, confirm with JR, then he runs `purgeTestEmployees` in Apps Script editor.
- If Drive MCP auth still inaccessible: ask JR to run `listTestEmployees` in Apps Script editor and paste the log. Verify the list. Then he runs `purgeTestEmployees`.

If JR opens a new topic instead, follow him. Possible next thread directions: Phase E sub-area 2 (plaintext password removal with pre-audit), Phase E sub-area 4 (App.jsx extraction -- multi-session, own branch), Welcome email on new-employee create, Schedule-change notifications to Sarvi, or holding for Sarvi Monday smoke.
