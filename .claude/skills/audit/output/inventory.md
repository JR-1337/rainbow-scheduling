## Inventory — generalist

[A — skipped, owned by static]
[B — skipped, owned by static]

---

## C — Code style / consistency

No C findings in scope.

[budget: ~42k used, 17 reads]

---

## D — Performance (filter)

No D findings elevated. `src/MobileEmployeeView.jsx:419` `dayEvents` filter runs 7 times per render (7 dates); below OTR arithmetic gate threshold — demoted to J1.

[budget: ~42k used, 17 reads]

---

## E — Performance (find / some) — s051 refactor miss

**E1** `src/views/EmployeeView.jsx:66` — old: `{visibleEvents.find(ev => ev.type === 'sick')?.note && (` → new: `{sickEvent?.note && (` — direct read

**E2** `src/views/EmployeeView.jsx:67` — old: `title={visibleEvents.find(ev => ev.type === 'sick').note}>` → new: `title={sickEvent?.note}>` — direct read

**E3** `src/views/EmployeeView.jsx:68` — old: `{visibleEvents.find(ev => ev.type === 'sick').note}` → new: `{sickEvent?.note}` — direct read

**E4** `src/views/EmployeeView.jsx:89` — old: `{hasSick && visibleEvents.find(ev => ev.type === 'sick')?.note ? (` → new: `{hasSick && sickEvent?.note ? (` — direct read

**E5** `src/views/EmployeeView.jsx:90` — old: `<span className="text-xs italic truncate block" style={{ color: THEME.text.muted }} title={visibleEvents.find(ev => ev.type === 'sick').note}>` → new: add `title={sickEvent?.note}>` — direct read

**E6** `src/views/EmployeeView.jsx:91` — old: `{visibleEvents.find(ev => ev.type === 'sick').note}` → new: `{sickEvent?.note}` — direct read

**Context for E1-E6:** `EmployeeScheduleCell` (EmployeeView.jsx:36) already uses `hasSick = visibleEvents.some(ev => ev.type === 'sick')` at line 52 but never extracted a `sickEvent` variable. The s051 refactor landed correctly in ScheduleCell.jsx:40, MobileAdminView.jsx:358, and MobileEmployeeView.jsx:288 but missed `EmployeeScheduleCell`. Fix: add `const sickEvent = hasSick ? visibleEvents.find(ev => ev.type === 'sick') : null;` after line 52 and replace all 6 inline `.find()` calls. Multiplier: 14 dates x 35 rows = 490 cells per EmployeeView render; up to 5 `.find()` scans per sick cell currently.

[budget: ~43k used, 17 reads]

---

## F — Performance (inline arrow / render allocation)

No F findings elevated. `src/MobileEmployeeView.jsx:300` conditional inline arrow in 245-cell grid demoted to J2 (no cell-level memo wrapper to pair with).

[budget: ~44k used, 17 reads]

---

[G — skipped, owned by static]

---

## H — Hook correctness

No H findings. `src/MobileAdminView.jsx:465` `useEffect` deps decomposed to primitive fields `[announcement.subject, announcement.message]` — correct, no object-reference trap. `src/MobileEmployeeView.jsx:43` resize effect has cleanup and empty deps — correct. `src/MobileEmployeeView.jsx:673` `onOpened` effect is correct.

[budget: ~44k used, 17 reads]

---

## I — Correctness bugs

**I1** `src/views/EmployeeView.jsx:68` — old: `title={visibleEvents.find(ev => ev.type === 'sick').note}` → new: `title={sickEvent?.note}` — direct read

Unguarded `.note` access: line 68's `title={...}` attribute calls `.find()` without `?.`, so if `visibleEvents.find()` returns undefined (sick event disappears between outer `?.note` check and this eval), this throws `Cannot read properties of undefined (reading 'note')`. Same pattern at line 91. The outer `hasSick &&` guard at line 89 covers the branch entry, but line 68 is inside the `visibleEvents.find(...)?.note &&` conditional that only gates the `<span>` render — the `title` attribute on line 68's inner tag is the naked call. Extracting `sickEvent` (E1-E6) resolves this — `sickEvent?.note` is safe.

[budget: ~44k used, 17 reads]

---

## J — Structural observations

**J1** `src/MobileEmployeeView.jsx:419` — `dayEvents` filter (7 calls per render in employee self-view at 7 dates). Trivial at OTR scale; no action needed. — direct read

**J2** `src/MobileEmployeeView.jsx:300` — conditional inline arrow `onClick` in 35x7=245-cell grid. Allocates up to 245 closures per render. No cell-level memo wrapper; extracting the handler without memoizing the cell row would not help. Observation only. — direct read (marker context)

**J3** Long files — `src/MobileEmployeeView.jsx` (731 lines), `src/views/EmployeeView.jsx` (1057 lines), `src/MobileAdminView.jsx` (617 lines). All contain multiple exported components. Extraction candidates for a future refactor; out of scope for s051. — direct read (marker context)

**J4** `src/MobileAdminView.jsx:533,542` — two `<button>` elements lack `type` attribute. No visible `<form>` wrapper in the announcement panel, so they default to `type="submit"` in most browsers but are effectively standalone. Low risk; add `type="button"` for robustness. — direct read

**J5** `src/MobileEmployeeView.jsx:149` — icon-only close button `<button onClick={onClose}>` lacks `aria-label`. Same pattern as MobileAdminView.jsx:582 (see L1). — direct read (marker context)

[budget: ~45k used, 17 reads]

---

## K — Security

No K findings. `mailto:` links at MobileAdminView.jsx:587, MobileEmployeeView.jsx:100, EmployeeView.jsx:904 are standard contact links rendering staff-provided data — excluded per K exclusions (text-only, not XSS-injectable). — direct read (marker context)

[budget: ~45k used, 17 reads]

---

## L — Accessibility

**L1** `src/MobileAdminView.jsx:582` — old: `<button onClick={onClose} className="p-2 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>` → new: add `aria-label="Close"` and `type="button"` — direct read

**L2** `src/MobileEmployeeView.jsx:149` — old: `<button onClick={onClose} className="p-2 rounded-lg" style={{ color: THEME.text.muted }}><X size={16} /></button>` → new: add `aria-label="Close"` and `type="button"` — direct read

**L3** `src/views/EmployeeView.jsx:377` — old: `<button onClick={() => onPeriodChange && onPeriodChange(periodIndex - 1)} className="p-1 rounded">` → new: add `aria-label="Previous period"` and `type="button"` — direct read (marker context)

**L4** `src/views/EmployeeView.jsx:392` — old: `<button onClick={() => onPeriodChange && onPeriodChange(periodIndex + 1)} className="p-1 rounded">` → new: add `aria-label="Next period"` and `type="button"` — direct read (marker context)

[budget: ~45k used, 17 reads]

---

## Files scanned

4 total:
- `src/components/ScheduleCell.jsx`
- `src/MobileAdminView.jsx`
- `src/MobileEmployeeView.jsx`
- `src/views/EmployeeView.jsx`

---

## Ambiguity / scope drift

1. **Primary s051 miss — E1-E6 / I1 (`EmployeeScheduleCell`):** The sickEvent extraction commit (8647947) correctly landed in ScheduleCell.jsx:40, MobileAdminView.jsx:358, and MobileEmployeeView.jsx:288 (admin grid path). `EmployeeScheduleCell` in EmployeeView.jsx (lines 36-115) was missed. It has `hasSick` via `.some()` (correct) but retains 5-6 inline `.find(ev => ev.type === 'sick')` calls, two of which lack optional-chain protection (I1). Fix is one variable insertion + 6 substitutions, identical to the ScheduleCell.jsx pattern.

2. **No stale `.find()` in MobileAdminView.jsx or MobileEmployeeView.jsx admin grid:** Markers at MobileAdminView.jsx:358 and MobileEmployeeView.jsx:288 confirm the correct post-refactor pattern — `sickEvent` extracted once per cell. Clean.

3. **employees prop fix (d13bc14) — clean:** MobileEmployeeView.jsx:666 correctly destructures `employees = []` in `MobileAlertsSheet`; passes to `PKDetailsPanel` at line 693. EmployeeView.jsx:613 passes `employees={schedulableEmployees}` at the call site. No free-reference issues found in this neighborhood.

4. **MobileEmployeeView.jsx self-view path (lines 415-472) — clean:** `dayEvents` is iterated directly (`ev.note` inline), no stale `.find(ev => ev.type === 'sick')` present.

5. **jscpd 82 clones project-wide:** Static-pass shows 0 clone lines for all in-scope files individually (knip output lists no per-file clone violations against the 4 files). The aggregate 82 reflects the broader src tree — outside session scope.
