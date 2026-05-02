# Audit Report — session-d13bc14 — 2026-05-02

## Verdict
**Needs Attention** — `EmployeeScheduleCell` (EmployeeView.jsx:36-114) is the 4th schedule render path the s051 sickEvent extraction commit (8647947) was supposed to cover. It still walks `visibleEvents.find(ev => ev.type === 'sick')` 6 times per sick cell, including 2 unguarded `.note` accesses (lines 68, 91) — latent throws if the event list mutates between the outer `?.note` check and the inner attribute eval. Memory rule `feedback_mobile_desktop_parity` requires all 4 paths in one commit; 3-of-4 shipped.

## Health trend (vs. prior audit)
FIRST_RUN for slug `session-d13bc14` — no diff baseline.

## Fixed autonomously (this audit)
Will be one commit shipping E1-E6 + I1 + L1-L4 + J4. See **Ship B1** section.

## Deferred — ranked
None. All findings are B1 (mechanical, behavior-equivalent, build PASS qualifies).

## Non-findings confirmed
- **C** — no style/consistency findings in scope.
- **D** — `MobileEmployeeView.jsx:419` `dayEvents` filter (7 calls/render at OTR scale) below the arithmetic gate. Demoted to J1 observation.
- **F** — `MobileEmployeeView.jsx:300` conditional inline arrow in 245-cell grid; no cell-level memo wrapper to break, so observation only. J2.
- **H** — `MobileAdminView.jsx:465` useEffect deps decomposed to primitives, correct. `MobileEmployeeView.jsx:43` resize cleanup correct. `MobileEmployeeView.jsx:673` onOpened correct.
- **K** — `mailto:` links (3 sites) carry backend-sourced employee email; no user-controlled input. Confirmed not-K per K exclusions.
- **J3** — long files (731, 1057, 617 lines) — extraction candidates, post-launch.
- **employees prop fix (d13bc14)** — clean: destructure at MobileEmployeeView.jsx:666, call-site pass at EmployeeView.jsx:613. No free-reference issues in the neighborhood.
- **MobileEmployeeView.jsx self-view path (lines 415-472)** — `dayEvents` iterated directly, no stale `.find(ev => ev.type === 'sick')` present.
- **jscpd 82 clones project-wide** — 0 in-scope file lines duplicated; aggregate reflects broader src tree, outside session scope.

## Tally
Bucket 1: 11 | Bucket 2: 0 | Non-findings: 8

## Ship B1 (one commit)

### Correctness + perf parity (EmployeeView.jsx — `EmployeeScheduleCell`)
- E1 `EmployeeView.jsx:66` — `visibleEvents.find(ev => ev.type === 'sick')?.note` → `sickEvent?.note`
- E2 `EmployeeView.jsx:67` — `title={visibleEvents.find(ev => ev.type === 'sick').note}` → `title={sickEvent?.note}`
- E3 `EmployeeView.jsx:68` — `{visibleEvents.find(ev => ev.type === 'sick').note}` → `{sickEvent?.note}`
- E4 `EmployeeView.jsx:89` — `hasSick && visibleEvents.find(ev => ev.type === 'sick')?.note` → `hasSick && sickEvent?.note`
- E5 `EmployeeView.jsx:90` — `title={visibleEvents.find(ev => ev.type === 'sick').note}` → `title={sickEvent?.note}`
- E6 `EmployeeView.jsx:91` — `{visibleEvents.find(ev => ev.type === 'sick').note}` → `{sickEvent?.note}`
- I1 (collapsed by E2/E5) — unguarded `.note` access in `title` attribute removed by extraction.
- Add `const sickEvent = visibleEvents.find(ev => ev.type === 'sick');` and switch `hasSick` to `!!sickEvent` after line 52.

### A11y (4 file-level mechanical fixes)
- L1 `MobileAdminView.jsx:582` — add `aria-label="Close"` and `type="button"` to icon-only X close button.
- L2 `MobileEmployeeView.jsx:149` — add `aria-label="Close"` and `type="button"` to icon-only X close button.
- L3 `EmployeeView.jsx:377` — add `aria-label="Previous period"` and `type="button"` to prev-period button.
- L4 `EmployeeView.jsx:392` — add `aria-label="Next period"` and `type="button"` to next-period button.

### Robustness (J4)
- J4 `MobileAdminView.jsx:533,542` — add `type="button"` to two announcement-panel buttons (no `<form>` wrapper visible; defensive).

## Audit scope skipped
None. All 4 in-scope files inventoried.

## Cost
- Stage 0.5 map: built (4 files, 16 markers, 1 hot file)
- Stage 1 static: knip + jscpd both available
- Stage 2 + 3 tokens: ~50k total (Sonnet inventory only; triage performed in-session)
- Total wall-clock: ~4 min
