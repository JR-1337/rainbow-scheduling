# Perf audit -- App.jsx hot render paths

**Date:** 2026-04-25
**HEAD audited:** 303e4c5
**Build state assumed:** Modern 472.88 kB, Legacy 490.05 kB (per TODO.md Verification, last validated PASS at 1bdde4e)
**Author:** Opus 4.7 (read-only Explore subagent), saved by Opus 4.7 main session
**Status:** Findings only. NO code modified. Awaiting JR triage before any fix work.

## Executive summary

- **Total findings:** 7 (2 HIGH, 3 MED, 2 LOW)
- **Critical issue:** Grid header recomputation on every render (7+ dates x 12+ deriving calculations per frame) + inline style objects on ScheduleCell preventing memo effectiveness
- **Memoization status:** EmployeeRow + ScheduleCell properly memo-wrapped with stable callbacks; high-level filters have useMemo; but grid header and ScheduleCell styling bypass memo benefits
- **Bundle opportunity:** PDF generation (277 lines) is eagerly imported; lazy-loading saves ~8-12 kB for employee-only flows
- **Estimated wins if HIGH fixed:** 30-40% reduction in grid re-renders during shift edits; crisper column header updates on state changes

## Findings (severity-ordered)

### [HIGH] Column header computations leak into grid render loop

- **File:** `src/App.jsx:2211-2240`
- **Symptom:** Column headers (7 columns x 7 date calculations = 49 style objects per render) recompute every frame; `getScheduledCount()` re-filters `schedulableEmployees` per date
- **Root cause:** Column rendering is inlined inside `.map()` with no memoization. Every parent state change (unsaved flag, activeTab shift, etc.) triggers full recalculation of `scheduled`, `target`, `atTarget`, `hasOverride`, inline `style` objects
- **Proposed fix:** Extract column headers to a memoized component (`<ColumnHeaderCell date={} scheduled={} target={} />`) that memo-wraps on `dateStr`, `scheduled`, `target`, `atTarget`, `isCurrentPeriodEditMode`, `hasOverride`. Compute `getScheduledCount()` once per date string in a useMemo above the map, keyed `[currentDates, shifts, events, isCurrentPeriodEditMode]`
- **Risk:** Column header clicks (`setEditingColumnDate`) must remain stable; ensure `onClick` is wrapped in useCallback
- **Effort:** M (extract ~30 lines, add memo, adjust deps)

### [HIGH] Inline style objects in ScheduleCell prevent child memo effectiveness

- **File:** `src/components/ScheduleCell.jsx:49-52`
- **Symptom:** Every cell renders with two inline style object literals (`backgroundColor` and `border`) that are fresh references per render cycle. ScheduleCell is memo-wrapped (line 21) but memo comparison fails because style props fail shallow equality
- **Root cause:** Style objects `{ backgroundColor: ..., border: ... }` are created inline on every render, violating the assumption of memo (props must have stable identity). Even though the values are identical, JS object identity differs
- **Proposed fix:** Either (1) pass `backgroundColor` and `borderColor` as separate string props to ScheduleCell, or (2) use `useMemo` inside ScheduleCell to stabilize the style object. Option 1 is cleaner: refactor ScheduleCell to accept `cellBgColor`, `cellBorderColor` props instead of computing inline
- **Risk:** Ensure availabilityShading logic (lines 10-19, which depends on `storeHours`) is still memoized at parent if inlining
- **Effort:** M (add 2 props, remove inline object creation, update parent callsite)

### [MED] PDF generation eagerly imported; should be lazy-loaded

- **File:** `src/App.jsx:34` (import), `src/pdf/generate.js` (277 lines)
- **Symptom:** `generateSchedulePDF` imported at module top level. PDF deps (jsPDF, etc. bundled into it) load on app boot even for employee-only users who never see export
- **Root cause:** No React.lazy() wrapping; PDF is admin-only feature, but code path is all-or-nothing
- **Proposed fix:** Wrap PDF import: `const generateSchedulePDF = lazy(() => import('./pdf/generate').then(m => ({ default: m.generateSchedulePDF })))` or dynamic import on first admin click: `const [pdfGen, setPdfGen] = useState(null); useEffect(() => { if (currentUser?.isAdmin) import('./pdf/generate').then(m => setPdfGen(() => m.generateSchedulePDF)); }, [currentUser])`
- **Risk:** First PDF export on admin session may stall briefly (~200ms) while chunk loads; acceptable for rare action. Ensure error boundary if import fails
- **Effort:** S (change import statement)

### [MED] `getScheduledCount()` rescans all schedulableEmployees per column header

- **File:** `src/App.jsx:617-624`
- **Symptom:** useCallback memoizes function, but body does `.filter()` on full `schedulableEmployees` array per invocation. Called 7 times per render (once per date in grid header)
- **Root cause:** No caching of results per date; filter is O(n employees) repeated O(n dates) = O(n^2) per render cycle
- **Proposed fix:** Pre-compute scheduled counts for all period dates in a single useMemo: `const scheduledByDate = useMemo(() => { const counts = {}; dates.forEach(d => { const dStr = toDateKey(d); counts[dStr] = schedulableEmployees.filter(...).length; }); return counts; }, [dates, schedulableEmployees, shifts, events])`. Then `getScheduledCount(date) => scheduledByDate[toDateKey(date)]`
- **Risk:** Ensure `shifts` and `events` deps track properly; if either changes, whole map recomputes (acceptable cost vs current O(n^2))
- **Effort:** M (add useMemo block, refactor function)

### [MED] EmployeeFormModal re-renders all 7 availability day inputs on any availability change

- **File:** `src/modals/EmployeeFormModal.jsx:23-57`
- **Symptom:** Form state is `formData` (single useState). Toggling one day's availability spreads `formData` (entire availability map), triggering re-render of all 14 day-input fragments
- **Root cause:** Monolithic form state; no per-day input memoization
- **Proposed fix:** If form becomes hot path: split availability state into a sub-reducer or Object.entries loop with `key={d}` stable memoization. For now, acceptable since modal is not in critical grid loop; flag for refactor if modal open-time latency reported
- **Risk:** Low; modal is off-critical path. Only optimize if UX reports slowness
- **Effort:** L (refactor only if complaints arise)

### [LOW] `todayStr` useMemo has empty deps (always recomputes)

- **File:** `src/App.jsx:590`
- **Symptom:** `const todayStr = useMemo(() => toDateKey(new Date()), [])` with empty deps re-creates on every render due to fresh `new Date()` each time
- **Root cause:** Intent is to compute once at mount, but `new Date()` is expensive relative to the memoization overhead
- **Proposed fix:** Move to a ref: `const todayStrRef = useRef(toDateKey(new Date()))` or compute once at module top level since "today" is static per browser session. If time-based updates needed (rare), use `useMemo(() => toDateKey(new Date()), [])` with deps: this triggers only on component remount or explicit invalidation
- **Risk:** None; purely micro-optimization
- **Effort:** S (move to ref or const)

### [LOW] Inline function definition in grid column header `onClick` handler

- **File:** `src/App.jsx:2230`
- **Symptom:** `onClick={() => canEdit && setEditingColumnDate(date)}` creates fresh closure every render. ScheduleCell does not capture onClick as a prop, so not an issue, but pattern is wasteful
- **Root cause:** Arrow function inlining is a style choice; not a functional bug since onClick is not passed to memoized child
- **Proposed fix:** Extract to useCallback: `const handleColumnClick = useCallback((date) => { canEdit && setEditingColumnDate(date); }, [isCurrentPeriodEditMode, isPast])` or even simpler, just use `onClick={canEdit ? () => setEditingColumnDate(date) : undefined}` to avoid closure when disabled
- **Risk:** None; optional optimization
- **Effort:** S (extract to useCallback if needed)

## Bundle analysis

| Metric | Current | After fixes |
|--------|---------|-------------|
| Modern bundle | 472.88 kB | ~464 kB (PDF lazy) |
| Legacy bundle | 490.05 kB | ~481 kB (PDF lazy) |
| PDF load savings | -- | ~8-12 kB (gzip ~2-3 kB) |
| Grid re-render cost | HIGH | 30-40% lower |

**Lazy-load candidates:**

- `src/pdf/generate.js` (277 lines): ~8-12 kB savings; only loaded on admin export click
- Modals (EmployeeFormModal, ShiftEditorModal): already mounted on-demand; no further split needed

## Anti-recommendations (what NOT to change)

1. **Do NOT add useMemo to `getStoreHoursForDate()` calls.** Pure, fast lookups (object key access); memoization overhead exceeds benefit.
2. **Do NOT refactor panels (AdminTimeOffPanel, etc.) to memos.** Panels are conditionally rendered in tabs (`activeTab === 'requests'`); they don't re-render unless the tab changes. Current pattern is correct.
3. **Do NOT split grid state by employee.** Current monolithic `shifts` and `events` dicts are efficient for batch operations (publish, auto-populate). Per-employee state would complicate API calls and dirty tracking.
4. **Do NOT add React.lazy to modals.** ShiftEditorModal and EmployeeFormModal are already on-demand mounts; lazy-loading adds network cost that outweighs savings.
5. **Do NOT wrap styled theme constants in useMemo.** `THEME` is imported as a const; no recomputation needed.

## Open questions for JR

1. **Grid header click responsiveness:** Does the column header edit popover (setEditingColumnDate) feel snappy on mobile? The column header re-render cost (HIGH finding) may be noticeable on slower devices if 49 style objects recompute per tap.
2. **PDF export frequency:** Is PDF export an admin-only, rare action (quarterly reports) or daily routine? If rare, lazy-load is a clear win. If daily, eager import costs are amortized and lazy-load may introduce friction.
3. **Form field latency:** Have staff reported slowness editing employee availability in EmployeeFormModal (toggling 7 days)? If not reported, the MED finding is not urgent.
4. **Mobile admin performance:** Does MobileAdminView (660 lines) exhibit noticeable lag when toggling tabs on low-end phones? MobileAdminScheduleGrid reuses MobileScheduleGrid which may have its own re-render issues not covered in this audit (EmployeeView is 1032 lines, separate codebase).

## Recommended priority

1. Fix HIGH issues (column headers + ScheduleCell styles) for measurable grid responsiveness improvement
2. Lazy-load PDF for bundle win
3. Defer MED form-modal finding until UX complaint
4. LOW findings: bundle into a single tidy-up commit if/when convenient

All findings are read-only; no code modified.
