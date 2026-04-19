<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.
Rules: filename YYYY-MM-DD-{short-slug}.md; required sections per HANDOFF_PROMPT.md; do not restate adapter content; ASCII operators only.
-->

# Handoff -- 2026-04-19 -- PDF role-encoding redesign + iOS export fixes

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, then this file. If LESSONS matters for the next move, read `CONTEXT/LESSONS.md` too. Resume from `State` and `Next Step Prompt`.

First reply: 1-2 short sentences plus a one-line `Pass-forward:` and exactly 1 direct question about how to proceed. No preamble.

## State

- Project path: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: `main`, HEAD `9f8ada2`, clean, in sync with origin (everything pushed)
- Prod frontend: Vercel deploying `9f8ada2`; local build bundle `index-ByNp5-5W.js`
- Apps Script: v2.25.0 LIVE (no backend redeploy this session)
- `src/App.jsx`: 3044 lines. `backend/Code.gs`: 2382 lines. Build: `npm run build` PASS
- Active focus: Sarvi retest (iPad white-screen fixes + PDF encoding + PDF role encoding) -> welcome-email wiring / audit Phase E / bug repros

## This Session

1. Shipped PDF iOS Safari encoding fixes (`c002046`): `<meta charset="utf-8">` + `text/html;charset=utf-8` Blob MIME (root cause of the "ae"-looking glyph Sarvi saw); all em-dashes swept to ASCII hyphens (belt-and-braces); popup-blocked fallback no longer uses `<a download>` because iOS Safari ignores the attr on blob URLs and saves them as `*.blob`. Fallback now navigates the current tab to the blob URL (HTML has its own in-page Print button).
2. Removed employee hours + OT asterisks from the PDF (`e7bc416`). ESA OT flag lives in the admin web UI, not the employee-facing printout. `calcWeekHours`, `computeDayUnionHours` import, `* / **` legend entry all dropped.
3. Shipped iPad white-screen fixes (`35288f5`, `2362575`): theme.js L18 unguarded `localStorage.getItem` at module-init wrapped in try/catch (Safari Private Browsing throws SecurityError -> blank React mount); added `@vitejs/plugin-legacy@5` targeting iOS 11+ / Safari 11+ with `modernPolyfills: true`. Modern bundle unchanged; legacy bundle + polyfills lazy-loaded via nomodule on old Safari only.
4. Added new `Backup Cash` role + renamed existing `backupCashier` display to "Cashier 2" (`b0c5704`). ROLES in `src/constants.js` now 7 entries; all 3 pickers (ShiftEditorModal cell-tap, EmployeeFormModal defaultSection, PDF legend) are data-driven.
5. Fixed EmployeeFormModal mobile overlapping rows (`8a517bf`). Employment Type, Active/Inactive, Admin pills all stack label-above-control at <640px via `flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0`. Active+Admin pair also stacks vertically on mobile.
6. Changed default store hours Mon/Tue/Wed open 10:00 -> 11:00 (`9f8ada2`). Close stays 18:00; Thu-Sat and Sun unchanged. Safe now that Auto-Fill reads per-employee `defaultShift` -- store hours no longer affect booked hours on those days. `src/utils/storeHours.js` STORE_HOURS const only.
7. Iterated 4 PDF role-encoding designs with JR (`b189db5` -> `3e735d9` -> `2480a61` -> `d2414eb`). Landed on System 2: uniform 1px grey grid; monogram glyph at top-left (absolute-position span); role name styled by family (cash = BOLD UPPERCASE letter-spaced; section = medium title case; monitor = italic); Floor Monitor is the only role with a 2px ink perimeter so it visibly "owns" its cell edges under border-collapse. Glyphs locked to C1 / C2 / B / M / W / F.
8. Decanting check:
   - Working assumption: table `border-collapse: collapse` is the default for this PDF. Any per-cell border styling competes with neighbors; thicker wins. Future role-designs that want to use perimeter styling must account for this, or use inset decoration instead.
   - Near-miss: Tried a 3-family border-style system (solid/dashed/dotted) across cash roles; JR rejected -- they read as three separate visual categories. Tried an inset left-stripe system; JR rejected -- didn't like the left bar.
   - Naive next move caution: do not reintroduce border styles (dashed/dotted) on any cash role. Family grouping now lives in typography only. Cash family is visually unified via BOLD UPPERCASE, not via stroke patterns.
9. Audit: skipped (no adapter writes; TODO + LESSONS writes were after Step 2 per the spec's skip rule).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/pdf/generate.js` | New monogram + typography role system + UTF-8 + iOS blob fallback. ROLE_GLYPHS, ROLE_FAMILY, roleNameStyle() + per-cell absolute-positioned glyph span. Floor Monitor cell has 2px ink border override. Do not reintroduce em-dashes or `<a download>` fallback. |
| 2 | `src/constants.js` | ROLES now 7 entries; `backupCash` id must stay in sync with pdf/generate.js glyph + family maps. |
| 3 | `vite.config.js` | `@vitejs/plugin-legacy@5` active for iOS 11+. Do not remove while Sarvi's iPad is still in the field. |
| 4 | `src/theme.js` | L18 localStorage.getItem try/catch wrapped. Any new top-level localStorage reads elsewhere must also be guarded -- Safari Private Browsing is the failure mode. |
| 5 | `src/modals/EmployeeFormModal.jsx` | Mobile layout pattern `flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0` -- reuse for new label+control pills. |

## Anti-Patterns (Don't Retry)

- Do not use dashed/dotted border styles as the primary channel to distinguish cash roles. JR rejected this twice. Family = typography; within-family = letter glyph.
- Do not put role signal on a cell's perimeter border. `border-collapse` makes neighbors fight; thicker-wins rules are fragile. Floor Monitor's 2px border is the ONE deliberate exception, because it's the only role using that channel.
- Do not fall back to `<a download="...html">.click()` for PDF export. iOS Safari ignores the download attr on blob URLs and saves as `*.blob`.
- Do not introduce em-dashes into `src/pdf/generate.js`. ASCII hyphens only. Charset issues surface on Sarvi's Safari.
- Do not add perimeter strokes, hatch fills, or inset stripes to cash roles. Cash = BOLD UPPERCASE name + C1 / C2 / B glyph. That is the whole system.
- Do not retry viewport-range repros for the iPad white screen. Chromium at every tablet width renders clean; the issue is Safari-specific.
- Do not assume ESA OT flag belongs in the PDF. It lives in the admin web UI. Employee PDF shows schedule only.
- Do not re-confirm decisions JR already answered earlier in the same flow (`feedback_no_redundant_confirms.md`).

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind carrying forward:

- Sarvi iPad retest covers 3 shipped fixes at once: white-screen, PDF "ae" glyph + `.blob` export, new PDF role-encoding
- Sarvi-batch + Phase A+B+C save-failure smoke -- JR+Sarvi
- Bug 4 (PK 10am-10am) + Bug 5 (top-nav PK UI no-show) -- waiting on JR repro
- Sarvi discovery for per-day real `defaultShift` values
- Payroll aggregator path 1 -- waiting on Sarvi Counterpoint / ADP discovery
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light "Friday"
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on
- Consecutive-days 6+ warning -- Sarvi answers

## Key Context

- PDF role-encoding system: families (cash/section/monitor) are typographic, not decorative. Glyphs are the per-role key. Floor Monitor's 2px ink border is the single perimeter-style exception because it's the only role that uses that channel.
- iOS Safari is the primary customer browser (Sarvi's iPad). Treat all PDF HTML and bundle code as running on potentially old Safari. Guard localStorage, declare charset, avoid `<a download>` on blob URLs.
- Apps Script v2.25.0 LIVE, no redeploy pending.
- Auto-memory `feedback_no_redundant_confirms.md`, `feedback_playwright_always.md` still in force.
- Test employee `testguy@testing.com` / `test007`. JR admin `johnrichmond007@gmail.com` / `admin1`.

## Verify On Start

- `git status` -- expect clean
- `git log --oneline -8` -- top should be `9f8ada2`, `7401202`, `d2414eb`, `2480a61`, `3e735d9`, `b189db5`, `80d805f`, `c002046`
- `git rev-list --left-right --count origin/main...HEAD` -- expect `0 0` (synced)
- `npm run build` -- PASS; modern bundle ~477 kB, legacy bundle ~495 kB, polyfills ~83 kB
- `wc -l src/App.jsx backend/Code.gs` -- expect 3044 and 2382
- `curl -s https://rainbow-scheduling.vercel.app/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'` -- check bundle hash; expect `index-ByNp5-5W.js` or newer post-deploy
- Ask JR: Sarvi retest results from iPad (white-screen + PDF export + role encoding)? Then welcome-email or audit Phase E?

## Next Step Prompt

Highest priority: external gate -- confirm Sarvi retest. Three fixes all ride on the same iPad test: (a) white-screen resolution, (b) PDF opens without the "ae" glyph and without saving as `.blob`, (c) new PDF role encoding reads correctly (C1/C2/B glyphs, BOLD UPPERCASE cash names, M/W sections, F monitor with thicker border).

If retest passes, pick from:
- Welcome email on new-employee create (actionable now; wire MailApp in Code.gs `saveEmployee` to send emp-XXX default password). Requires Apps Script redeploy after.
- Smoke new Backup Cash role on prod via Playwright (set defaultSection to backupCash, verify it renders + saves + shows 'B' glyph in PDF legend).
- Audit Phase E continuation (sub-area 6 parked on Context provider refactor; smaller cuts available in App() body).

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.
