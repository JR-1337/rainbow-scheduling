<!-- SCHEMA: DECISIONS.md
Version: 1
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` (optionally with `Superseded by: <link>`); do not erase. See Archive behavior below for move semantics.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 150 lines. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until under ceiling.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see TEMPLATES.md `decisions-archive.md` header) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
-->

## 2026-04-26 -- PK details surfaced near announcements as a shared sibling panel

Decision: New shared component `src/components/PKDetailsPanel.jsx` aggregates PK events across all employees into unique `{date, startTime, endTime}` slots within the active period. Per slot it shows day label, time range, booked count, employee names (first 3 + `+N more`), and optional note. Returns null when no PK in period (non-invasive guarantee). Mounted as a sibling AFTER the announcement panel on 4 paths: desktop admin grid (`src/App.jsx` ~L2376), mobile admin comms tab (`src/App.jsx` ~L1888), desktop employee grid (`src/views/EmployeeView.jsx` ~L860), mobile employee alerts sheet (`src/MobileEmployeeView.jsx` ~L767). All 4 scoped to full pay period (`dates`, not `currentDates`) to match announcement scope.
Rationale: JR's polish list item — "PK details visible near announcements when PK is booked." Single shared component prevents drift across 4 surfaces (mobile/desktop x admin/employee). Sibling-not-nested keeps announcement components untouched, satisfying "non-invasive." Period-scope (vs week-scope) matches announcement scope so the PK panel always shows what the admin/employee should know about for the period they are viewing.
Confidence: H -- verified 2026-04-26 build PASS at `0fe138c` (modern 488.13 kB / 123.25 kB gzip, +2.46 raw / +0.56 gzip vs `1d26daf`; legacy 508.75 / 124.83). Smoke skipped per JR direction; prod phone-smoke pending.
Rejected alternatives:
- Embed PK summary INSIDE the announcement panel components -- rejected, requires modifying 4 announcement components, breaks the non-invasive rule, couples PK rendering to announcement state.
- Week-scope (`currentDates`) on employee paths -- rejected, would split the source-of-truth between admin (period) and employee (week); employees viewing the schedule for the period should see all PK they may need to attend, not only this-week PK.
- Show only future PK or hide past PK -- rejected, period view is calendar-aligned not now-aligned; PK already booked in earlier-week shows correct context for the whole period.

## 2026-04-26 -- Bulk-clear PK by day from outside the modal (unsaved-mutation pattern)

Decision: New per-day PK clear affordance lives on the Schedule Clear dropdown (desktop) and Clear sheet (mobile). Per-day rows appear ONLY when >=1 PK booking exists on that date in the active week. Tap opens `AutoPopulateConfirmModal` with new `clear-pk-day` variant ("Clear all N PK booking(s) on Day, Month DD?"); confirm fires `clearPKForDate(dateStr)` which mutates `events` state + sets unsaved (matches `clearWeekShifts` pattern). Admin clicks SAVE on schedule to persist via existing `batchSaveShifts` path. New helper `daysWithPKInWeek(weekDates)` (App.jsx, useCallback-wrapped for prop identity stability) is shared between the desktop dropdown and the mobile sheet via prop.
Rationale: JR's polish list item — needed an affordance to clear all PK on a chosen day in one move without opening PKEventModal. Per-day granularity (not all-PK-in-week) gives precise control. Unsaved-mutation pattern matches `clearWeekShifts` semantics so admin can review + undo by not saving (different from inside-modal Save which fires immediate `batchSaveShifts`). This split is intentional: outside-modal = unsaved-with-undo, inside-modal = immediate-save-with-revert-on-failure.
Confidence: H -- verified 2026-04-26 build PASS at `63420ce` (modern 485.67 kB / 122.69 kB gzip, +1.93 raw / +0.68 gzip vs `78f02d7`; legacy 506.33 / 124.34). Smoke skipped per JR direction; prod phone-smoke pending.
Rejected alternatives:
- Always-visible "Clear All PK This Week" entry (no per-day granularity) -- rejected, too coarse; admin often wants to clear one specific day.
- Persist immediately like the modal -- rejected, breaks UX symmetry with `clearWeekShifts` (admin expects unsaved + SAVE step on Schedule grid mutations).
- Backend `bulkDeletePKByDate` handler -- rejected, client-side mutate + existing `batchSaveShifts` is sufficient and avoids manual-deploy friction (same rationale as the 2026-04-26 PKEventModal dual-mode decision).

## 2026-04-26 -- PKEventModal dual-mode (create + edit) via existing-events derivation

Decision: `src/modals/PKEventModal.jsx` accepts a new `events` prop. The modal computes `existingPKBookedIds` for the selected `{date, startTime, endTime}` window. When the set is non-empty (`isEditMode = true`), initial check state mirrors the booked set instead of availability eligibility; Save dirty-state covers adds AND removes (`isDirty = addIds.length + removeIds.length > 0`); Save label reads `Save (+N -M)`. When empty (create mode), the historical eligibility-default UX is preserved. `handleBulkPK` in `src/App.jsx` drops the `bulkCreatePKEvent` API call in favor of the unified period-save path: adds synthesize PK event rows client-side, removes drop matching entries from `events[empId-date]`, both persist atomically via existing `apiCall('batchSaveShifts')`. Reverts state on failure. Saturday quick-pick button gains an active-state visual (filled brand accent + 2px glowing ring + `✓` glyph) and toggle-back behavior (tap-again reverts date + times to today's defaults).
Rationale: Bug JR hit -- deselecting a booked person left Save greyed, modal couldn't edit existing PK. Old modal was create-only; this unifies create + edit on one surface so admin doesn't need a separate "delete PK" path. Single period-save also makes adds + removes atomic from the user's perspective. Saturday button visual: prior outline-only style was insufficient feedback that "save will book on Saturday" -- explicit JR instruction ("more distinct"); toggle-back is the natural inverse.
Confidence: H -- verified 2026-04-26 build PASS at `78f02d7` (modern 483.74 kB / 122.01 kB gzip, +1.77 raw / +0.74 gzip vs `5f5f16f`); localhost Playwright full round-trip PASS (book on Sat May 2 -> reopen edit mode -> deselect -> Save (-1) enabled -> save -> back to create mode), 0 console errors. Prod phone-smoke pending.
Rejected alternatives:
- Add backend `bulkDeletePKEvent` handler symmetric with `bulkCreatePKEvent` -- rejected, requires JR manual deploy + new auth + new audit; client-side mutate plus existing `batchSaveShifts` is sufficient and avoids deploy friction.
- Keep `bulkCreatePKEvent` for adds + add only `bulkDeletePKEvent` for removes -- rejected, splits the save path into two API calls, breaks atomicity from user's perspective.
- Modal `clearWeekShifts`-style pattern (mutate + setUnsaved + admin clicks schedule Save later) -- rejected, modal Save should persist immediately like the prior bulkCreatePKEvent UX did.
- Initial checks default to UNION of `wasBooked or eligible` in edit mode -- rejected, would auto-add eligible-but-unbooked people on every reopen which surprises admins.

## 2026-04-25 -- Sick day event wipe + PDF sync popup + title field + legend events

Decision: (1) `applyShiftMutation` sick upsert clears `events[k]` to `[]` then pushes sick so meetings/PK/legacy rows cannot remain. `collectPeriodShiftsForSave`: if `hasSick`, only emit `ev.type===sick` from `dayEvents`. (2) `handleExportPDF` opens `about:blank` in click handler, then `import('./pdf/generate')`, then `generateSchedulePDF(..., printWindow)` assigns blob URL; `window.open` after `await` was popup-blocked. `revokeObjectURL` delayed 600000ms. (3) `EmployeeFormModal`: titled employees may save empty `title`; space validation only when trimmed non-empty; AlertTriangle strip like ShiftEditor; non-titled save forces `title: ''`. (4) PDF legend adds MTG, PK, SICK from `EVENT_TYPES` after role glyphs.
Rationale: JR sick+meeting persistence, dead PDF button post lazy-load, title backspace save, legend consistency.
Confidence: M -- `npm run build` PASS at `0d3220e` 2026-04-25; prod smoke pending

## 2026-04-25 -- PDF schedule print: problem registry for layout work (read before redesign)

Decision: Canonical write-up is `CONTEXT/pdf-print-layout.md`. Summarizes competing goals (row uniformity vs no clipping vs density), what was tried, and candidate approaches not yet implemented (continuation rows, font scaling, abbrev+codes, appendix page, jsPDF/server PDF, print-only CSS). Agents touching `src/pdf/generate.js` must read it; boot adapters point here.
Rationale: JR asked to surface the design space for Claude Code, not only the latest code state.
Confidence: M -- registry evolves as PDF approach changes; verify when a candidate ships.

## 2026-04-25 -- Desktop schedule name column: fixed 240px + first/rest split (match mobile)

Decision: `DESKTOP_SCHEDULE_NAME_COL_PX` 240, `DESKTOP_SCHEDULE_GRID_TEMPLATE` in `constants.js`, same `gridTemplateColumns` on App header, `EmployeeRow`, `EmployeeView` body+header, `ScheduleSkeleton` (uiKit). `splitNameForSchedule` in `employeeRender.js` returns first word + rest; desktop renders line1 + line2 (muted) like `MobileAdminView` / `MobileEmployeeView`, `truncate` + `title` for overflow; admin adds week hours under. Rejected: `max-content` for col1 when each row is its own grid (header is another grid) => unequal col1 width, day columns misalign. Rejected: `line-clamp-2` on full name without first/rest (uneven name block vs mobile).
Rationale: Full readable names, vertical alignment, parity with mobile name UX.
Confidence: H -- build PASS at `a07ab98` 2026-04-25, JR prod phone-smoke on this work still pending
Rejected alternatives:
- DRY mobile and desktop with one shared `NameCell` component -- not done; low blast, possible later.

## 2026-04-25 -- Type-aware shift dedupe key (meeting allows N per emp-date; work/sick/pk stay singular)

Decision: Both backend (`backend/Code.gs:1801` `keyOf` in `batchSaveShifts`) and frontend (`src/utils/scheduleOps.js` `applyShiftMutation`) split shift dedupe semantics by `type`. Singular set `{work, sick, pk}` keeps the prior 3-tuple key `${empId}-${date}-${type}`. Multi-allowed set `{meeting}` keys on `s.id` (with synthetic fallback `MEETING-{empId}-{date}` for legacy id-less rows). Frontend mirror via `MULTI_TYPES = new Set(['meeting'])`. PK bulk-create at `Code.gs:1872` `bulkCreatePKEvent` is unchanged -- its own `existingPKKeys` set still enforces PK singular invariant on its own write path.
Rationale: The display-side render shipped at `651712d` could render 2+ stacked meetings per cell, but no UI surface could create that state because both backend `keyOf` and frontend `applyShiftMutation` collapsed events by `(empId, date, type)`. Real-world need (Sarvi confirmed): admin books multiple meetings per emp-date (e.g. 9am 1:1 + 2pm vendor call). Work stays singular -- one shift per day is a hard hours-math invariant. Sick stays singular -- one called-in-sick mark per day is the concept. PK stays singular -- bulk-create flow already enforces dedupe on its write path; admin-edited PK uses the modal which has not been extended.
Confidence: H -- verified 2026-04-25 build PASS at `089adaa` (modern 477.64 kB / gzip 119.54 kB, +3.07 raw / +0.68 gzip vs `af09132`; legacy 498.12 / gzip 120.93, +2.99 raw / +0.61 gzip), Apps Script v2.3 deployed by JR, localhost Playwright smoke PASS desktop 1400x900 + mobile 390x844 (2 stacked meetings render, 3+ collapses to "N events", round-trip persistence preserves distinct ids, 0 console errors), prod frontend live (Vercel index-CxWywSqV.js contains `Add another meeting` + `meetingDrafts`). Prod phone-smoke pending.
Rejected alternatives:
- Per-row `id` for ALL non-singular types (treat PK as N-allowed too) -- rejected, would require corresponding `bulkCreatePKEvent` rewrite + modal PK extension; not in scope.
- Backend keyOf using row id for ALL types including work/sick -- rejected, would silently allow duplicate work shifts per emp-date (regression of a hard invariant). Singular set hard-codes the invariant in code.
- Frontend-only fix (add row id sentinel without backend keyOf change) -- rejected, would silently collapse on first save round-trip. Pre-flight read-through of `Code.gs:1801` caught the dependency before scoping.
- Apply backend deploy via clasp automation -- rejected, this repo has no clasp setup; JR's manual paste-and-deploy is the existing pattern.

## 2026-04-25 -- Perf-fix wave 2: ColumnHeaderCell extract + scheduledByDate lookup
Decision: One scoped commit (`1d0ccb1`) closing two tightly-coupled audit findings (HIGH "Column header recomputation in render loop" + MED "getScheduledCount O(n^2)") together. (1) New `src/components/ColumnHeaderCell.jsx` -- `React.memo`-wrapped, receives primitives only (`isToday`, `isHoliday`, `storeOpen`, `storeClose`, `scheduled`, `target`, `hasOverride`, `canEdit`, `isPast`) plus a stable `Date` prop and a stable `onClick` callback, so memo busts only on real state change. Internal style objects + closure stay inside the memo body (allocation only on memo MISS, per s014 lesson that internal JSX is invisible to memo). (2) New `scheduledByDate` useMemo above `getScheduledCount` in `src/App.jsx` pre-computes per-date headcount once per render, deps `[currentDateStrs, schedulableEmployees, shifts, events]`. (3) `getScheduledCount` body becomes `(date) => scheduledByDate[toDateKey(date)] || 0`; `useCallback` wrapper + signature preserved so the prop passed to MobileAdminView at L1595 stays identity-stable (mobile picks up the speedup for free without a separate refactor). (4) Stable `handleColumnHeaderClick` useCallback wraps `setEditingColumnDate` for the new component prop.
Rationale: Audit at `docs/perf-audit-app-jsx-2026-04-25.md` flagged 49 inline style objects per parent re-render in the desktop column header `.map()` (App.jsx:2215-2247) plus `getScheduledCount` filtering all `schedulableEmployees` per-date (App.jsx:616-624) -- O(n_emp * n_dates) per parent state change. Re-verified the cited lines BEFORE scoping (lesson from s014 ScheduleCell misdiagnosis); this time the audit's prescription matched reality. Pre-computed lookup map + memoized cell component cuts re-render work to O(n_dates) lookup + per-cell memo equality checks; cells skip work entirely on parent state changes that don't touch their props.
Confidence: H -- verified 2026-04-25 build PASS at `1d0ccb1` (modern 472.57 kB / gzip 118.64 kB, +0.27 raw / +0.18 gzip vs `3cf6b09`; legacy 493.15 / gzip 120.09, +0.31 raw / +0.14 gzip; expected delta for new memoized component file) + localhost Playwright PASS desktop 1400x900 (column header click on Sat Apr 25 in Edit Mode opened ColumnDayEditModal with correct context; past dates rendered "Past dates cannot be edited" tooltip + no cursor; wave 1 ScheduleCell click-to-edit no regression) + mobile 390x844 (MobileAdminView headers render correct scheduled/target via O(1) lookup; tap on mon-4 opens "Monday, May 4" dialog confirming `getScheduledCount` prop API intact); zero console errors/warnings. Prod phone-smoke pending after Vercel redeploy.
Rejected alternatives:
- Audit's "split styles into `cellBgColor` / `cellBorderColor` separate string props" -- rejected, derived values from `isToday` + `isHoliday` are the same primitives we're already passing; computation inside memo body is correct.
- Pass `today` derived via `new Date()` inside the cell -- rejected, would freeze "today" at first render for that cell. `isToday` boolean from parent map busts memo at midnight crossover for the 2 affected cells only.
- Refactor MobileAdminView column header in same wave -- rejected, separate render path; mobile already gets the lookup-map win for free via the unchanged `getScheduledCount` prop. Defer mobile column-header memoization until motivation surfaces.
- Bundle the LOW audit findings (`todayStr` ref, inline column-header onClick) into wave 2 -- rejected, JR triages each individually; the inline-onClick LOW is now closed by the new stable `handleColumnHeaderClick`, the `todayStr` LOW is unchanged but stale (logic now contained inside ColumnHeaderCell where it cannot leak into the grid render loop).
- Drop the `useCallback` wrapper on `getScheduledCount` since the body is now a one-liner -- rejected, MobileAdminView consumes it as a prop; preserving identity matters for mobile's downstream memos.

<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
