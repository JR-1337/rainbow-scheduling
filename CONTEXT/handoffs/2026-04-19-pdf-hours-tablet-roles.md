<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-19 -- PDF hours stripped; iPad + mobile-form + Backup Cash role shipped

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, then this file. If LESSONS matters for the next move, read `CONTEXT/LESSONS.md` too. Resume from `State` and `Next Step Prompt`.

First reply: 1-2 short sentences plus a one-line `Pass-forward:` and exactly 1 direct question about how to proceed. No preamble.

## State

- Project path: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: `main`, HEAD `e7bc416`, clean, in sync with origin (all 5 session commits pushed)
- Prod frontend: Vercel deploying `e7bc416`; at write time bundle `index-rQvJ-mut.js` per local build
- Apps Script: v2.25.0 LIVE (no backend redeploy needed this session)
- `src/App.jsx`: 3044 lines. `backend/Code.gs`: 2382 lines. Build: `npm run build` PASS
- Active focus: awaiting Sarvi iPad retest; then welcome-email on new-hire + audit Phase E continuation

## This Session

1. Pushed last session's `2258bd6` to origin (was staged ahead).
2. Fixed "Sarvi cannot see new roles on mobile when scheduling" -- scope was a schema ask, not a viewport bug. Added new role `backupCash` (short "Backup", full "Backup Cash", color `#D08BC3` cash-family purple); renamed existing `backupCashier` fullName `Backup Cashier` -> `Cashier 2` (short `Cash2` unchanged). PDF glyph reshuffle: backupCashier 'B' -> '2', new backupCash 'B' + dotted 3px border. Code.gs defaultSection enum comment extended. All three pickers (ShiftEditor cell-tap, EmployeeFormModal defaultSection, PDF legend) are data-driven off ROLES so zero extra wiring. Shipped `b0c5704`.
3. Fixed EmployeeFormModal mobile overlap: Employment Type row, Active/Inactive pill, and Admin pill all used horizontal `justify-between` that didn't fit narrow viewports. Switched to `flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0` so label stacks above control at <640px. Active+Admin pair also stacks vertically on mobile. Shipped `8a517bf`.
4. iPad white-screen: could not reproduce in Chrome Playwright at 640/768/1024 widths. Root-caused as Safari-specific. Two fixes shipped: (a) `theme.js` L18 unguarded `localStorage.getItem` at module-init throws `SecurityError` in Safari Private Browsing, preventing React mount -> wrapped in try/catch (`35288f5`). (b) Added `@vitejs/plugin-legacy@5` with `targets: ['ios >= 11', 'safari >= 11', 'defaults', 'not IE 11']` and `modernPolyfills: true` (`2362575`). Modern bundle unchanged 477 kB; legacy bundle 495 kB + 83 kB polyfills lazy-loaded via nomodule on old Safari. JR confirmed Sarvi is on an "old" iPad. Pending retest.
5. PDF employee-facing hours stripped per JR direction (`e7bc416`): ESA OT flag lives in admin web UI, not the employee-facing printout. Removed hours div under name, `calcWeekHours`, `computeDayUnionHours` import, and `* / **` legend entry. Left column now shows employee name only.
6. Decanting check:
   - Working assumption added: ROLES in constants.js is data-driven everywhere (ShiftEditor, EmployeeForm, PDF). Next session: do not add hardcoded role lists anywhere new.
   - Near-miss: initially misread "ESA warning" intent -- tried to flag hours removal as an immutable-constraint violation. JR clarified ESA flag is admin-only; PDF is employee-only. Admin web UI is the ESA surface. Don't conflate.
   - Naive next move caution: do not retry viewport-range repros for Sarvi's white screen. Chromium at every tablet width renders clean. If fixes fail, next debug step is the iPadOS version + Safari version (remote inspect from Mac, which JR lacks -- so ask her to check Settings -> General -> About).
7. Audit: skipped (no adapter writes; Step 2 was the only CONTEXT write this session).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/constants.js` | ROLES array now 7 entries; new `backupCash` id must stay in sync with theme.js + pdf/generate.js + Code.gs defaultSection comment. |
| 2 | `vite.config.js` | `@vitejs/plugin-legacy` active. Do not remove without checking Sarvi iPad status. Legacy bundle adds ~83 kB polyfills on old Safari only. |
| 3 | `src/theme.js` | L18 now try/catch wrapped. `auth.js` was already guarded. If any other module adds a new top-level `localStorage.getItem`, it must also be guarded. |
| 4 | `src/pdf/generate.js` | Employee-facing artifact. No hours, no OT asterisks, no ESA surface. Keep it that way. |
| 5 | `src/modals/EmployeeFormModal.jsx` | Mobile layout pattern: `flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0` -- reuse this shape for any new label+control pill row. |

## Anti-Patterns (Don't Retry)

- Do not retry viewport-range repros for Sarvi's iPad white screen. Chromium at 640/768/1024 renders clean; it is Safari-specific. If the shipped fixes fail, get iPadOS version from Sarvi (Settings -> General -> About) before guessing.
- Do not treat the PDF as an ESA OT surface. Admin web view owns the 44h warning. Employee PDF shows schedule only -- no hours, no asterisks.
- Do not add a hardcoded role array anywhere. ROLES in `src/constants.js` is the single source; three consumers flow off it.
- Do not re-confirm decisions JR already answered earlier in the same flow (see `feedback_no_redundant_confirms.md`).
- Do not push Apps Script redeploy -- nothing backend-touching shipped this session.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind carrying forward:

- Sarvi iPad white-screen retest -- shipped two fixes, awaiting verification
- New Backup Cash role smoke on prod -- ShiftEditor picker, EmployeeForm defaultSection, PDF legend 'B' glyph
- PDF hours-removal smoke on prod -- print a test PDF, confirm left column is name-only
- Sarvi-batch + Phase A+B+C save-failure smoke -- JR+Sarvi
- Bug 4 (PK 10am-10am) + Bug 5 (top-nav PK UI no-show) -- waiting on JR repro
- Sarvi discovery for per-day real `defaultShift` values
- Payroll aggregator path 1 -- waiting on Sarvi Counterpoint / ADP discovery
- S62 2-tab settings split + retroactive-default fix
- CF Worker SWR cache
- Consecutive-days 6+ warning -- Sarvi answers
- Backup-cash role: BLOCK RETIRED -- shipped this session as `backupCash` role

## Key Context

- "Backup Cash" is a genuine new role, distinct from `backupCashier` (now displayed as "Cashier 2"). Sheet defaultSection enum expanded to include `backupCash`. No migration needed -- existing rows keep their current values.
- PDF is employee-facing. Admin ESA signal lives in the web admin view. Do not mirror hours/OT/warnings back into the PDF without JR say-so.
- `@vitejs/plugin-legacy` emits dual bundles. Modern browsers hit the nomodule-less bundle unchanged; old Safari (iOS <14) gets the legacy bundle + polyfills. Treat the legacy path as invisible unless Sarvi reports issues.
- Auto-memory `feedback_no_redundant_confirms.md` saved this session: do not re-ask what JR already answered.
- Test employee `testguy@testing.com` / `test007`. JR admin `johnrichmond007@gmail.com` / `admin1`.

## Verify On Start

- `git status` -- expect clean
- `git log --oneline -6` -- top should be `e7bc416` (PDF hours removed), `2362575` (plugin-legacy), `35288f5` (theme.js guard), `8a517bf` (mobile form stack), `b0c5704` (Backup Cash role), `2258bd6`
- `git rev-list --left-right --count origin/main...HEAD` -- expect `0 0` (synced)
- `npm run build` -- PASS; expect modern bundle ~477 kB + legacy bundle ~495 kB + polyfills ~83 kB
- `wc -l src/App.jsx backend/Code.gs` -- expect 3044 and 2382
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- check bundle hash matches HEAD (expect `index-rQvJ-mut.js` or newer post-deploy)
- Ask JR: Sarvi iPad retest result? And which Active item next -- welcome email or audit Phase E?

## Next Step Prompt

Highest priority: confirm Sarvi iPad retest (external gate). If retest fails, ask her iPadOS version and iterate.

If retest passes (or pending and JR wants to move on), choose from:
- Welcome email on new-employee create (actionable now; wire MailApp in Code.gs `saveEmployee` to send emp-XXX default password). Requires an Apps Script redeploy after.
- Smoke new Backup Cash role on prod via Playwright (set an employee's defaultSection to backupCash, verify it renders in ShiftEditor, saves roundtrip, and shows 'B' glyph in PDF legend).
- Audit Phase E continuation (sub-area 6 parked on Context provider refactor; smaller cuts available in App() body).

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.
