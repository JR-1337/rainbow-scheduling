<!-- SCHEMA: lessons-archive.md
Version: 1
Purpose: retired lesson entries moved out of active LESSONS.md when
  the lesson is one-shot, the underlying code path was deleted, or
  the entry is a positive observation rather than a pitfall.
  Distinct from CONTEXT/archive/YYYY-MM-{slug}.md time-bucket retirements.

Write mode: prepend each moved entry at the top (newest first, mirrors
  active LESSONS.md ordering). Never edit moved entries in place; if
  a moved entry is later re-litigated, write a fresh entry to active
  LESSONS.md.

Move triggers:
  (1) one-shot fix where the code path was deleted
  (2) positive observation ("X works") rather than a pitfall to avoid
  (3) superseded by a newer entry that covers the same ground
  (4) opportunistic stale review at maintenance pass

Both files newest-at-top. Moved entries keep all fields intact and
gain a `Moved: YYYY-MM-DD (sNNN) -- <reason>` line at the bottom.
-->

## [PROJECT] -- Trailing-underscore functions are hidden from Apps Script editor dropdown
Lesson: Apps Script functions ending with `_` are filtered out of the editor's function-name dropdown in the new editor UI. For one-shot migrations that need to be picked from the dropdown, provide a public wrapper (no underscore) that calls the underscore version.
Context: 2026-04-19 -- `widenAvailabilityForPK_` invisible in dropdown; added `runWidenAvailabilityForPK` wrapper. Both deleted after the one-shot ran.
Affirmations: 0
Moved: 2026-04-27 (s028) -- one-shot migration; wrapper function deleted; pattern unlikely to recur in active code paths.

## [PROJECT] -- AdaptiveModal hot-resize survives mid-modal without remount
Lesson: `useIsMobile()` resize listener triggers a re-render but React reconciles children; internal modal state (selected step, form fields) survives the bottom-sheet <-> centered-card switch. Worth trusting when rolling new AdaptiveModal call sites.
Context: Playwright smoke 2026-04-18 hot-resized 390->1280 mid-RequestTimeOffModal; modal transformed without closing or losing state.
Affirmations: 0
Moved: 2026-04-27 (s028) -- positive observation, not a pitfall; behaviour is now well-trusted across multiple modal sites.
