# Audit — 2026-04-29 — session mode (since s038 handoff `40cf842`)

## Verdict

**Needs Attention** — Bucket 2 contains one Correctness bug (I1) on a primary employee surface (request history list).

## Health trend (vs. prior audit)

`FIRST_RUN` — no prior session-mode report for this slug.

## Scope

- Mode: `/audit session`
- Resolved files (1): `src/panels/UnifiedRequestHistory.jsx` (287 lines)
- Session boundary: commits since `40cf842` (s038 handoff) on `main` + working-tree changes
- Files in scope were touched in commit `cdc07f1` ("perf(request-history): memoize sorted list; drop degenerate ternaries in swap render")

## Fixed autonomously (this audit)

None. Bucket 1 was empty — the only one-line candidate (I1) requires changing data-flow semantics (`?.` → `??`-fallback + `.filter(Boolean)`), which fails the mechanical-edit test and demoted to Bucket 2 with a Fix Prompt.

## Deferred — ranked

### Correctness bugs (I)

**[I1]** `src/panels/UnifiedRequestHistory.jsx:236` — incomplete optional-chain guard on `datesRequested`; `.map()` runs on `undefined` when field is absent — silent-crash hides the entire item render — direct read

```
Fix prompt:
"In src/panels/UnifiedRequestHistory.jsx line 236, replace the optional-chain guard on datesRequested with a nullish-coalescing fallback so .map() is never called on undefined.
- Files in scope: src/panels/UnifiedRequestHistory.jsx
- Current code: {item.data.datesRequested?.split(',').map(d => formatShortDate(d)).join(', ')}
- Replacement: {(item.data.datesRequested ?? '').split(',').filter(Boolean).map(d => formatShortDate(d)).join(', ')}
- Constraint: formatShortDate and the surrounding <p> tag must remain unchanged. Do not alter any other line.
- Acceptance: npm run build PASS; confirm rendered output for a timeOff item with datesRequested undefined shows empty string, not a crash; confirm a comma-separated list still renders correctly.
- Do NOT: modify sort logic, memo deps, or any other JSX."
```

**[I2]** `src/panels/UnifiedRequestHistory.jsx:120` — `onCancelTimeOff` / `onCancelOffer` / `onCancelSwap` in `items` memo dep array; if parent doesn't `useCallback` them, memo busts on every parent render — silent-corruption of memo discipline — direct read

```
Fix prompt:
"In the parent file (likely src/views/EmployeeView.jsx — grep for `<UnifiedRequestHistory` to confirm), verify whether onCancelTimeOff/onCancelOffer/onCancelSwap are wrapped in useCallback. If any are not, wrap them.
- Files in scope: src/views/EmployeeView.jsx (or wherever UnifiedRequestHistory is mounted)
- Constraint: callback bodies remain identical. Do not change cancel logic itself.
- Acceptance: npm run build PASS; React DevTools Profiler should show UnifiedRequestHistory.items memo not recomputing on parent renders that do not change underlying request arrays.
- Do NOT: modify UnifiedRequestHistory.jsx. Fix lives entirely in the parent."
```

### Perf — needs measurement (D / E / F)

**[E1]** `src/panels/UnifiedRequestHistory.jsx:132-139` — `typeCounts` (4 `.filter` passes) and `activeCount` (1 `.filter` pass) bare in component body; inconsistent with the existing `useMemo` discipline on `items` (line 33) and `sorted` (line 124) — n ≤ 30 so absolute cost negligible, but pattern-break — direct read

```
Fix prompt:
"In src/panels/UnifiedRequestHistory.jsx, wrap the typeCounts object (lines 132-137) and activeCount (line 139) each in useMemo with [items] dep array, matching the existing memo discipline.
- Files in scope: src/panels/UnifiedRequestHistory.jsx
- Constraint: computed values must remain identical. TYPE_CONFIG (lines 141-145) stays after these two consts.
- Acceptance: npm run build PASS; no visual change to filter pill counts or badge.
- Do NOT: change the sorted memo, items memo, or any JSX."
```

**[F1]** `src/panels/UnifiedRequestHistory.jsx:168` — inline arrow `onClick={() => setTypeFilter(f.key)}` inside `.map()` over 4-element array — perf only matters if `CollapsibleSection` (parent) is `React.memo`-wrapped — direct read

```
Fix prompt:
"Verify src/components/CollapsibleSection.jsx exports a memoized component. If yes, hoist the 4 filter handlers above the return with useCallback. If no, close as non-finding.
- Files in scope: src/components/CollapsibleSection.jsx, src/panels/UnifiedRequestHistory.jsx
- Constraint: visible behavior must remain identical.
- Acceptance: npm run build PASS.
- Do NOT: change F2 in the same pass; keep patches separate."
```

**[F2]** `src/panels/UnifiedRequestHistory.jsx:183` — inline arrow on sort-direction button — same memoization caveat as F1; lower priority (single button) — direct read

```
Fix prompt:
"Address after F1 is resolved. If CollapsibleSection is not memoized, close as non-finding. If it is, add useCallback for the sort-direction toggle alongside the F1 fix.
- Files in scope: src/panels/UnifiedRequestHistory.jsx
- Constraint: toggle direction logic must remain identical (functional updater form must be preserved).
- Acceptance: npm run build PASS; sort direction still toggles correctly.
- Do NOT: bundle with F1 in the same commit."
```

### A11y gaps (L)

**[L1]** `src/panels/UnifiedRequestHistory.jsx:182-186` — sort-direction `<button>` has `title=` only; `title` is not reliably announced by screen readers on interactive elements — keyboard/SR users cannot determine sort state — direct read

```
Fix prompt:
"In src/panels/UnifiedRequestHistory.jsx line 182-190, add aria-label to the sort-direction button that includes the current sort state.
- Files in scope: src/panels/UnifiedRequestHistory.jsx
- Current code: <button onClick={...} ... title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}>
- Replacement: add aria-label={sortDir === 'desc' ? 'Sort: newest first' : 'Sort: oldest first'} alongside the existing title (keep title for tooltip).
- Constraint: title attr stays. No visual change. One attribute added.
- Acceptance: npm run build PASS; axe-core reports no missing accessible name on this button.
- Do NOT: change any other button or any styling."
```

**[L2]** `src/panels/UnifiedRequestHistory.jsx:222-228` — Cancel `<button>` inside `.map()` renders with visible text "Cancel" but no contextual `aria-label`; SR announces "Cancel, Cancel, Cancel..." with no way to distinguish — direct read

```
Fix prompt:
"In src/panels/UnifiedRequestHistory.jsx lines 221-229, add a contextual aria-label to each Cancel button.
- Files in scope: src/panels/UnifiedRequestHistory.jsx
- Current code: <button onClick={item.onCancel} ...><X size={8} /> Cancel</button>
- Replacement: add aria-label={`Cancel ${item.type === 'timeOff' ? 'time-off' : item.type} request`} (label phrasing adjustable; must distinguish per request type at minimum; prefer including date if a stable short date field is available on item.data).
- Constraint: visible 'Cancel' text stays. No layout change. Do not touch onCancel logic.
- Acceptance: npm run build PASS; axe-core reports no duplicate accessible names on Cancel buttons within the same list.
- Do NOT: modify the status badge, the type-filter buttons, or L1's sort button in the same pass."
```

### Structural observations (J)

None.

### Security flags (K)

None. No K-category markers fired on this file (no `dangerouslySetInnerHTML`, no `eval`, no `target="_blank"`, no `mailto:`, no inline secrets).

## Non-findings confirmed

- **I3** — `new Date(item.timestamp)` at line 278 on every render. Pre-existing, n ≤ 30, no regression introduced by `cdc07f1`. Cleared.
- **I4** — `new Date(a/b.timestamp)` in sort comparator at line 127. O(n log n) at n ≤ 30 ≈ ~150 constructions worst case. Below any measurable threshold. Cleared.

## Tally

```
Bucket 1: 0 | Bucket 2: 7 | Non-findings: 2
```

## Audit scope skipped

None — session scope was 1 file; all of it was audited.

## Cost

| Stage | Cost |
|---|---|
| 0 scope-resolve | Bash, ~0.1s |
| 0.5 codebase-map | Bash, ~0.5s (rebuilt from cache miss) |
| 1 static-pass | Reused from earlier this session |
| 2 inventory (Sonnet) | ~24k tokens, ~53s |
| 3 triage (Sonnet) | ~24k tokens, ~56s |
| 4 diff | FIRST_RUN |
| **Total LLM** | **~48k tokens** |
| **Total wall-clock** | **~2 min** |

## What this audit confirms about the session work (`cdc07f1`)

The Stage 2 generalist verified the change directly:

- The `useMemo`-wrap of `filtered`+`sorted` is correct; deps cover the inputs.
- The collapsed swap-render ternaries (lines 259-273) reference the same data fields in both directions, so the collapse is safe (no behavior change).
- No regressions introduced by the commit.

The I1 finding pre-dates `cdc07f1` — the incomplete `?.` guard on `datesRequested.split().map()` was already in the file before the session started. The audit surfaced it because session-mode reads everything in the changed file, not just the diff.
