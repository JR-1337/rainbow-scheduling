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
