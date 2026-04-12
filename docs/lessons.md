# Lessons

<!-- Correction patterns. Protocol: ~/.claude/rules/lessons.md -->

- Sheets stores numeric-looking passwords as numbers → `String()` on both sides of all password comparisons in Code.gs
- Sheets boolean columns (`isOwner`, `isAdmin`, `active`, `deleted`) are strings `"TRUE"`/`"FALSE"` → compare with `=== true`/`=== false`, never truthy/falsy
- Sheets Date objects use 1899 epoch for times → `getSheetData()` normalizes to `YYYY-MM-DD`/`HH:mm`. Without this, frontend date matching silently fails
- Apps Script GET URL limit ~8KB → chunked save (15-shift groups). Don't bypass
- `formatTimeDisplay`/`parseTime`/`formatTimeShort` → must handle undefined/null (empty times during shift creation)
- Apps Script POST → returns HTML redirect instead of JSON. Use GET-with-params. POST attempted first for large payloads, falls back to chunked GET
- Tailwind JIT `placeholder:` variant unreliable in runtime `<style>` blocks → put pseudo-element styles in `index.css` with `!important`
- `-webkit-line-clamp` invisible in PDF print popup → use `word-break` CSS instead
- `THEME.bg.primary` is page-level background only → inner UI elements (inputs, tab bars, cells inside cards) must use `bg.tertiary` or `bg.secondary`. Switching bg.primary to dark broke ~10 inner elements that assumed it was light.
- Transparent accent-tinted card backgrounds (`THEME.accent.blue + '10'`) invisible on dark backgrounds → use solid `bg.secondary` with accent border/stripe instead
- Card border opacity must be high enough to see: hex suffix `30` (~19%) invisible, `80` (~50%) visible. Use `THEME.border.default` which is accent at 50%
- Light mode + terracotta accent for OTR -> use dark navy bg + rotating 5-color accent - Rainbow is a multi-color brand and light-mode terracotta felt off-brand
- Gradient background blobs behind cards -> solid dark bg only - blobs made cards look pasted on
- Muting/desaturating role colors "for consistency" -> keep role colors fully saturated; only functional status indicators (warning/error) get desaturated - Rainbow brand IS vibrant colors
- Dark drop-shadows (`rgba(0,0,0,0.6)`) on dark bg -> use accent-color halos via `THEME.shadow.card`/`cardSm` - dark shadows nearly invisible on dark bg
- Inline arrow functions as props on memoized grid rows -> use existing useCallback handlers (`handleCellClick` etc.) - inline arrows create new refs each render, defeating React.memo
- `.toISOString().split('T')[0]` in hot render paths -> use `toDateKey(date)` (~10x faster, no ISO alloc/regex split)
- Duplicate mobile entry points for same destination (hamburger + bell + bottom nav all go to same place) -> one canonical path per destination; bottom nav owns drawer/requests/alerts on mobile
- Bulk search/replace across ~40 hot-path call sites silently mangled one line (`sd.toISOString().split('T')[0]` -> `stoDateKey(d)`) and Vite build didn't catch the ReferenceError -> after large mechanical renames, grep for the exact new identifier AND do a smoke-load of the built bundle before committing
- Deviating from an approved plan's chunking/handoff structure by asking "bundle or split?" or "what's next?" mid-execution -> the plan is the answer; execute exactly what it says (one commit per sub-step, handoff between sessions). If a step is ambiguous, re-read the plan file, don't re-ask JR. Reason: the plan was signed off precisely to remove these decisions from the loop. Asking wastes context and erodes trust in the signed-off plan.
- Inline `fixed inset-0 z-[100] modal-backdrop` class chain for admin request modals -> use `AdminRequestModal` helper at `src/App.jsx` (renders `MobileBottomSheet` on mobile, centered modal on desktop). Reason: duplicated styling drifts from the helper's a11y/touch-target contract and wastes ~15 lines per modal.
- Using `git add -A` or `git add .` during multi-file commits -> always `git add <explicit paths>`. Reason: swept untracked `Photos/` (1.2MB binaries), `dist/` (build output), and `package-lock.json` into S39.3a commit before I caught it. Had to soft-reset + unstage + recommit. Global CLAUDE.md explicitly forbids this; the trap is that long commands feel tidy until they pull in ambient untracked state.
- Spinning up a fresh adversarial audit mid-session when the original session already produced a categorized audit (P0-P3) that drove the plan's chunking -> do not re-audit. The categorization exists, the sessions are sized to it. A fresh audit creates duplicate findings and implies the chunking is wrong.
- Trusting `result.success` from `chunkedBatchSave` -> callers must also read `data.{totalChunks, failedChunks}`. Reason: `success: false` now indicates ANY chunk failed (per 2026-04-12 decision), but `savedCount` tells you how much actually landed. Surface "X of Y batches saved" on partial failure and retain the unsaved flag so the user can retry.
- Top-level use of imported symbols from `../App` in `src/pdf/generate.js` / `src/email/build.js` / `src/panels/*.jsx` / `src/modals/*.jsx` -> circular imports with `../App` work ONLY because every imported symbol is used inside function bodies (resolved at call-time, not at module-eval). A top-level read of `THEME.accent.blue` or `ROLES_BY_ID` in one of these files breaks the cycle. Keep everything inside function bodies or pass as a prop.
- Deleting an inline component from App.jsx before adding the import for the extracted file -> always add the import first, then delete the inline block. Reason: `npm run build` does NOT catch undefined JSX refs (vite tree-shakes them silently), so you only discover the crash at runtime when the code path executes. Happened in S39.3g mid-session; only caught because session-start protocol forced a fresh grep + verify.
