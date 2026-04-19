<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Phase E sub-areas 5 (hash-only auth) and 3 (date utils) shipped; test-employee scrub closed

## Session Greeting

This session closed three Phase E items: test-employee scrub executed (20 employees + 50 shifts deleted from live Sheet, code residue removed), sub-area 5 (hash-only auth in `backend/Code.gs` v2.23.0), and the date-helpers extract (`src/utils/date.js`, 21 import sites migrated off `./App`). All four commits pushed to origin/main. **JR still must paste new `backend/Code.gs` into the live Apps Script editor and create a new deployment so v2.23 hash-only auth goes live -- until that step the live web app is still on v2.22 with the plaintext fallback intact.** Read in this order: `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (top 3 entries are this session), this file.

First reply: 1-2 short sentences, `Pass-forward:` with only essential carryover, exactly one direct question about how to proceed. Default next step is App.jsx extraction (sub-area 4) on its own branch.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `23ab319` == origin/main (0 ahead, 0 behind)
- Working tree: clean
- Prod: LIVE at https://rainbow-scheduling.vercel.app on bundle `index-DHYUEC7h.js` (built locally; Vercel will redeploy automatically)
- Apps Script: v2.22.0 deployed to live web app. v2.23.0 sits in `backend/Code.gs` (commit `4458f75`) but is NOT yet pasted into the editor or redeployed. Until that happens, login still accepts plaintext.
- Build: `npm run build` PASS on `23ab319` (465.08 kB; +20 bytes vs pre-extract due to one extra import line in App.jsx, modules 1289 -> 1290)
- Audit plan: `~/.claude/plans/adversarial-audit-fix-plan.md` -- sub-areas 1, 3 (PDF XSS), 3 (date utils), and 5 closed; sub-area 4 (App.jsx extraction) remains; 6 (module-level refs code smell) parked.

## This Session

1. **Test-employee scrub executed** (`c65f0c7`). JR ran `purgeTestEmployees()` from the Apps Script editor (after pasting from commit `2b4e5d4`). Drive MCP verify post-purge: 24 employees, 79 shifts, 0 `@example.com` rows. `listTestEmployees` / `purgeTestEmployees` / `_findTestEmployees_` removed from `backend/Code.gs` and from the live editor. `backend/seed-demo-data.gs` deleted. 5 legacy Emma/Liam/Olivia/Noah/Ava seed rows scrubbed from `createEmployeesTab`. Stale Alex Kim smoke-pattern lesson removed from LESSONS.md. JR also manually deleted the lone stale `TOR-20260418-8200` time-off request row from the ShiftChanges tab.
2. **Phase E sub-area 5 backfill** (`f774c77`). Pre-audit via Drive MCP `getAllData` found 19/24 active rows lacked `passwordHash` (never logged in -- login auto-migrates plaintext on first login, but these accounts hadn't triggered it). Wrote one-time editor-only `backfillPasswordHashes()`. JR pasted, ran, deleted from editor. Drive MCP re-verified: 24/24 rows now have hash + salt.
3. **Phase E sub-area 5 hash-only auth** (`4458f75`, v2.23.0). Removed plaintext fallback + on-login migrate path from `login`. Removed plaintext + ID-as-default fallback paths from `changePassword`. `resetPassword` now writes hash + salt directly (was: cleared hash, relied on next-login migration which no longer exists). `saveEmployee` new-hire path computes hash + salt for the default password. Plaintext `password` column kept on Employees for admin "default password" display only; auth path never reads it. Version header bumped to 2.23.0 with full changelog.
4. **Phase E sub-area 3 date-utils extract** (`23ab319`). Created `src/utils/date.js` with 11 pure date/time helpers (toDateKey, getDayName, getDayNameShort, formatDate, formatDateLong, formatMonthWord, getWeekNumber, formatTimeDisplay, formatTimeShort, calculateHours + private parseTime). Migrated 21 import sites off `./App` onto `./utils/date`. App.jsx no longer re-exports any date helpers. `isStatHoliday` and `getStoreHoursForDate` deliberately stayed in App.jsx -- they read module-level mutable refs (`_storeHoursOverrides`, `_staffingTargetOverrides`), part of audit item 6 parked refactor. Build green, bundle byte-identical pre/post (Vite tree-shaking already handled the indirection).
5. **Drive MCP write capability**: confirmed read-only. Available tools: `search_files`, `list_recent_files`, `read_file_content`, `download_file_content`, `get_file_metadata`, `get_file_permissions`, `create_file`. No `update_file`, no `delete_file`, no Sheets values.update / batchUpdate. Even if claude.ai connector permissions enable write/delete on the user side, the MCP server doesn't surface those tools to Claude Code CLI. For Sheet edits the editor-paste-and-run pattern (purge + backfill this session) is the working path.
6. **CONTEXT syncs**: TODO.md Active updated (Phase E line: sub-areas 1, 3, 5, 3-extract DONE; sub-area 4 next; v2.23 deploy pending). TODO.md Completed gained 3 entries. DECISIONS.md gained 3 entries at top (test-employee scrub, hash-only auth, date utils). LESSONS.md lost 1 stale entry (Alex Kim smoke pattern). ARCHITECTURE.md untouched.
7. **New global rule**: Added `~/.claude/rules/complete-the-operation.md` per JR direction. Binding across all projects per his global Rule Supremacy. Says: "Finish what you start -- if an action leaves residue, removing that residue is part of the action. Scope is strict, only residue from the current operation."
8. **Audit**: ran. CONTEXT TODO.md edited 3 times before Step 2 (commits `c65f0c7` synced TODO; `4458f75` did not touch CONTEXT; `23ab319` synced TODO + DECISIONS in-flight). Drift pass: clean. No rationale leaked into TODO, no architecture into DECISIONS, no task state into LESSONS, no adapter files touched.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `backend/Code.gs` | v2.23.0 NOT YET DEPLOYED to live Apps Script. JR must paste + new deployment before any login works on v2.23 logic. |
| 2 | `src/utils/date.js` | New file. 11 pure date helpers. Reference for any future utility extractions. |
| 3 | `src/App.jsx` | Still 4147 lines (sub-area 4 target). `isStatHoliday` + `getStoreHoursForDate` still here. |
| 4 | `~/.claude/plans/adversarial-audit-fix-plan.md` | Sub-area 4 (App.jsx extraction) is the only remaining substantive Phase E item. |
| 5 | `CONTEXT/TODO.md` | Top Active: Sarvi-batch + Phase A+B+C save-failure smoke (still blocked on Sarvi Monday). |

## Anti-Patterns (Don't Retry)

- Do NOT remove plaintext-password fallback before backfilling every active row's passwordHash. Pre-audit (Drive MCP read of Employees) is the safety net. Without it, accounts that never triggered the on-login migrate path get locked out the moment auth goes hash-only.
- Do NOT use the editor-paste-and-run pattern for routine work. It's only correct for one-time cross-sheet ops where the alternative is wiring destructive HTTP handlers. For everything else, normal HTTP routes via `handleRequest` dispatch.
- Do NOT assume claude.ai Drive connector "write/delete" permission toggles imply Claude Code CLI gets write/delete tools. Tool surface is independent of OAuth scope. Confirmed 2026-04-18.
- Do NOT batch-extract entangled helpers in the same pass as pure helpers. `getStoreHoursForDate` reads module-level mutable refs; moving it without addressing the refs is just hiding the smell. Pure-only extraction kept this clean.
- Prior session anti-patterns still in force -- see prior handoff (now deleted) or DECISIONS.md 2026-04-18 entries.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind:

- Sarvi-batch + Phase A+B+C save-failure smoke -- waiting on Sarvi Monday 2026-04-19
- Apps Script v2.23 deploy -- blocked by JR paste + new-version deployment in editor
- Payroll aggregator -- waiting on Sarvi Counterpoint / ADP discovery

## Key Context

- Drive MCP is read-capable (search_files / read_file_content / etc.) but NOT write-capable from Claude Code CLI. For Sheet mutation, use the editor-paste pattern (paste function, save, run, paste log back, verify via Drive MCP read).
- Editor-paste pattern flow: write function in repo + commit -> paste function into Apps Script editor (bottom of `Code.gs`) -> save (Ctrl+S) -> select function in toolbar dropdown -> Run -> paste Execution Log back -> verify -> remove function from editor + repo.
- `passwordChanged` flag (S41.3) is the source of truth for "is this user still on the default password." Hash-only auth doesn't change that logic.
- Plaintext `password` column on Employees is kept ONLY for admin "default password" display in the admin UI. Auth path never reads it. Future hardening: drop the column entirely once admin UI displays the password from the resetPassword response only (not from the column).
- "Promo" at OTR == commission payments tracked in a physical receipt box (NOT promotional staffing).
- New global rule `~/.claude/rules/complete-the-operation.md` is binding across projects per JR's global Rule Supremacy.
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

- `git status` -- expect clean (handoff write may be in flight)
- `git log --oneline -6` -- top should be handoff commit, then `23ab319`, `4458f75`, `f774c77`, `c65f0c7`, `baced83`
- `git rev-list --left-right --count origin/main...HEAD` -- `0 0` confirms synced
- `npm run build` -- should PASS (~465 kB)
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- expect `index-DHYUEC7h.js` or newer
- Confirm with JR whether Apps Script v2.23 has been pasted into the editor and a new version deployed. If not, his login on the live site is still on v2.22 plaintext-fallback logic.

## Next Step Prompt

Default: Phase E sub-area 4 (App.jsx extraction). Multi-session, own branch.

- Pre-flight: read `~/.claude/plans/adversarial-audit-fix-plan.md` Phase E section.
- Suggested first cut: extract `src/utils/storeHours.js` with `STAT_HOLIDAYS_2026`, `STAT_HOLIDAY_HOURS`, `STORE_HOURS`, `isStatHoliday`, and a refactored `getStoreHoursForDate` that takes overrides as a parameter (eliminating the module-level `_storeHoursOverrides` ref). That closes audit item 6 in the same pass.
- Then carve panels / views off App.jsx one boundary at a time. New branch (`phase-e-app-extract`), own PR per cut.

If JR opens a new topic instead, follow him. Possible next thread directions: deploy v2.23 verification (smoke login as JR + a non-admin), Welcome email on new-employee create, Schedule-change notifications to Sarvi, or hold for Sarvi Monday smoke.
