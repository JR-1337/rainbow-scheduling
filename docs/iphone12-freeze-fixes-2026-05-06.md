# iPhone 12 freeze fixes — candidates 2026-05-06

Sarvi symptom: in iOS Safari, page visible but taps don't register. Exit + re-enter the tab fixes it. Often happens after pressing Save in the schedule.

Diagnosis: the Save flow triggers a synchronous render chain (490-cell rebuild + `allViolations` recompute + `AnimatedNumber` rAF storm) that blocks the main thread on iPhone 12's A14 + Safari per-tab heap budget (~400-450 MB before WebKit's Jetsam tiers fire and force a JS recompile). Tab-switch lets the main thread drain. Not the PWA-after-background bug (she launches from Safari, not Home Screen).

All fixes below are behavior-identical — no features removed.

---

## A-tier — directly address the Save-time freeze

### A1. Memoize `week1` / `week2` / `currentDates` in App.jsx + EmployeeView.jsx
- File:line: `src/App.jsx:391` (`const week1 = dates.slice(0, 7), week2 = dates.slice(7, 14)`); `src/views/EmployeeView.jsx:319-321` (same pattern)
- Mechanism: `slice()` returns a fresh array every render. Passed to `<EmployeeRow dates={currentDates}>` which is `React.memo`'d — shallow `===` fails, every row re-renders anyway.
- Effort: 5 minutes. Wrap in `useMemo`. One commit, two files.
- Expected impact: restores row memoization on all four render paths. Largest single render-cost win for the smallest patch.

### A2. Add `EMPTY_EVENTS` frozen constant to mobile + employee paths
- File:line evidence:
  - Already correct: `src/components/EmployeeRow.jsx:13` (uses `EMPTY_EVENTS`)
  - Missing: `src/views/EmployeeView.jsx:156` (`events[key] || []`)
  - Missing: `src/MobileAdminView.jsx:357` (same)
  - Missing: `src/MobileEmployeeView.jsx:282` (same)
- Mechanism: every render, every empty cell allocates a fresh `[]`. Realistic OTR data is mostly empty cells, so 35 × 14 × ~70% empty = ~340 fresh array allocations per render. Also breaks `ScheduleCell.memo` for cells whose key is missing from the events object.
- Effort: 10 minutes. Mirror the desktop admin pattern.

### A3. Pass a single `today` Date down instead of `new Date()` per cell
- File:line: `src/components/EmployeeRow.jsx:65-66` — `canEditShiftDate(currentUser, date, new Date())` inside `dates.map`
- Mechanism: 490 fresh `Date` objects allocated per render (35 rows × 14 cells). Pure GC pressure.
- Effort: 5 minutes. Hoist `const today = new Date()` to render-time once and pass down.

### A4. Replace `AnimatedNumber` rAF loops with CSS transition or static number
- File:line: `src/components/uiKit.jsx:10-37` (the rAF loop); used at `src/components/EmployeeRow.jsx:50` (per-row hours), `src/components/ColumnHeaderCell.jsx:59-64` (per-column headcount)
- Mechanism: every value change schedules a 400 ms easing rAF chain that calls `setState` per frame. On Save, hours change for the edited employee + scheduledByDate count for the edited day. Worst case (Auto-Fill week): 49 concurrent rAFs all `setState`-ing per frame.
- Effort: 30 minutes. Either remove the animation entirely or replace with a CSS `transition: all 400ms` on a stable element. Animation has no load-bearing UX value — JR confirm before removing.

### A5. Wrap `allViolations` recompute in `useDeferredValue` or `startTransition`
- File:line: `src/App.jsx:664-697`
- Mechanism: ~6,860 hash lookups + per-employee-per-week consecutive-day-streak math, runs synchronously inside the same render that's already rebuilding 490 cells. `useDeferredValue` lets React yield to user input first and recompute violations in a low-priority pass.
- Effort: 15 minutes. Wrap the violations result in `useDeferredValue` and read the deferred value where the violations badge / panel render.
- Note: this is a React 18 concurrent feature; verify no concurrent-mode opt-out is set anywhere.

### A6. Memoize the two mobile grid components + extract memoized cell components
- File:line:
  - `src/MobileAdminView.jsx:174` (`MobileAdminScheduleGrid`, plain function, not memoized)
  - `src/MobileAdminView.jsx:285-468` (490-cell `.map` inline JSX, no `MobileScheduleCell` component to memoize)
  - `src/MobileEmployeeView.jsx:169` (same shape, 245 cells one week at a time)
- Mechanism: every parent re-render rebuilds all 490 cell trees including `LongPressCell` + style computation per cell. Mirroring the desktop `ScheduleCell` + `EmployeeRow` memo pattern would gate cell renders on actual prop change.
- Effort: 2-3 hours. Bigger refactor — extract `MobileScheduleCell` component, lift inline styles to `useMemo`, wrap grid + row in `React.memo` with appropriate comparator.
- Note: only worth doing AFTER A1+A2 ship, because without those, memoization on the grid still gets defeated by `currentDates`/`events` identity churn.

---

## B-tier — reduce baseline memory pressure (lighter app)

### B1. `React.lazy` the 14 modals statically imported in App.jsx
- File:line: `src/App.jsx:51-63` (12 modals) + `src/views/EmployeeView.jsx:28-29` (`OfferShiftModal`, `SwapShiftModal`)
- Combined source weight: ~190 kB raw across 14 modals
- Mechanism: modals only render when opened; loading their code on demand cuts the main bundle parse cost and reduces initial JS heap. Already proven safe — PDF export was code-split in s068.
- Effort: 1-2 hours. Wrap each in `React.lazy(() => import(...))` + `<Suspense fallback={null}>`. Need the same chunk-load self-heal pattern as PDF (already shipped in `App.jsx:1651-` for PDF; can be extracted into a shared util).
- Cost: each modal first-open will fetch its chunk on Sarvi's network. 4G round-trip ~200-400 ms. Tradeoff: smaller initial parse vs first-open delay.

### B2. Add `manualChunks` to vite.config.js for React vendor split
- File:line: `vite.config.js:1-13` (no `build.rollupOptions.output.manualChunks` set)
- Mechanism: currently react + react-dom + all 1344 modules collapse into one 546 kB raw / 140 kB gzip chunk. Splitting React out means cache-hit across deploys (React doesn't change between RAINBOW commits).
- Effort: 10 minutes. Add the manualChunks function.
- Expected impact: Sarvi's repeat visits parse less JS — the React chunk stays cached, only the app chunk re-downloads on deploy.

### B3. Code-split mobile vs desktop view modules
- File:line: `src/App.jsx` imports both `EmployeeView.jsx` (57.8 kB raw) and the mobile views (`MobileAdminView.jsx` 34.2 kB, `MobileEmployeeView.jsx` 42.7 kB) eagerly. Mobile users download desktop view code; desktop users download mobile.
- Effort: 2-3 hours. Bigger refactor — `React.lazy` the view modules, branch on `useIsMobile` at the lazy import.
- Note: harder than B1 because views are the always-rendered surface, not modals. Suspense boundary placement matters.

---

## C-tier — quality-of-life, lower freeze contribution

### C1. Reduce or gate `backdrop-filter: blur(8px)` on modal backdrop
- File:line: `src/index.css:97-98`
- Mechanism: Safari forces a separate compositing layer for `backdrop-filter`. With a 490-cell grid behind it, opening a modal during a save is a heavy compose.
- Effort: 5 minutes. Replace blur with a flat `rgba(0,0,0,0.4)` overlay, or gate via `@media (prefers-reduced-motion)`.

### C2. Clean up `useToast` setTimeout stacking
- File:line: `src/hooks/useToast.js:10`
- Mechanism: each `showToast` queues a `setTimeout` with no cleanup. Rapid toasts (Auto-Fill flow) stack timers; each `setToast(null)` triggers a full App re-render.
- Effort: 10 minutes. Track the pending timer in a ref, clear on new toast.

### C3. Shorten PDF blob URL retention
- File:line: `src/pdf/generate.js:459` (currently 600000ms = 10 minutes)
- Mechanism: each PDF export keeps the full schedule HTML string in memory for 10 minutes. iPhone 12 has a tight per-tab heap budget; multiple exports compound.
- Effort: 2 minutes. Reduce to 30 seconds (enough for the new tab to load the blob), or revoke on the new tab's unload.

### C4. Memoize `EventOnlyCell` and `ShiftCard`
- File:line: `src/components/EventOnlyCell.jsx:14`, `src/components/ShiftCard.jsx:28`
- Mechanism: when `ScheduleCell` re-renders, inner `EventOnlyCell` re-renders unconditionally. Bounded — only matters for cells with PK/meeting events.
- Effort: 5 minutes. Wrap in `React.memo`.

---

## Diagnostic step (zero risk, can run before any fix)

### D1. Add a perf marker around `handleSaveShifts`
- Wrap the Save handler with `performance.mark('save-start')` / `performance.mark('save-end')` and a `performance.measure('save', 'save-start', 'save-end')`. Log the result.
- Sarvi runs Save once, opens Safari Web Inspector via Mac (USB tether or Develop menu), reads the measure.
- Confirms whether the freeze is in the React render path or in the Apps Script round-trip — different fix priorities.
- Effort: 15 minutes. Strip after diagnosis.

---

## Recommended pick order

If picking one quick win: **A1 + A2 + A3** as a single commit. ~20 minutes of work, restores memoization on all four render paths plus eliminates per-cell allocations. Safe to ship without further diagnosis.

If picking one bigger win: **A4** (kill the rAF animation on hours / headcount totals). Most directly addresses the Save-time spike Sarvi described.

If picking a memory-pressure pass: **B1** (lazy-load modals). Bigger refactor but visible reduction in main bundle parse cost on every cold load.

A6 (memoize mobile grids) is high-impact but only worth doing after A1+A2 — A1+A2 first means the memoization actually holds.
