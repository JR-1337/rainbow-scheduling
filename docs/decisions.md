# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

## 2026-04-12 - Perf: ROLES_BY_ID + toDateKey + React.memo on Grid Cells

**Decided:** Introduced `ROLES_BY_ID` (O(1) lookup map), `toDateKey(date)` (no ISO allocation, no regex split), `React.memo` on `ScheduleCell`/`EmployeeRow`/`EmployeeViewRow`/`EmployeeScheduleCell`, `useCallback` on all handlers passed to grid rows, and `useMemo` for `currentDateStrs`/`allDateStrs`/`todayStr`.
**Alternatives:** Virtualize the grid with react-window (rejected - 14×20 = 280 cells is small enough that memo is sufficient; virtualization adds complexity). Move schedule state to Zustand/Redux to avoid prop drilling (rejected - larger refactor, scope not justified pre-demo).
**Rationale:** The grid was re-rendering all 280 cells on every state change because handlers were inline arrow functions (new ref every render, memo useless). With stable refs + memo, only cells whose inputs actually change re-render. `ROLES.find()` happened in 4-5 hot paths × 280 cells = ~1400 O(n) scans per full render. Date ISO allocations happened ~700 times per render.
**Revisit if:** Schedule grows to 40+ employees or 4+ weeks (280 cells → 1120+, virtualization may win). Or if React Compiler lands and makes manual memoization redundant.

## 2026-04-12 - Card Shadows Use Accent-Color Halos, Not Dark Drop-Shadows

**Decided:** `THEME.shadow.card`/`cardSm` are pure rotating-accent halos around white cards on the dark navy page. Removed the dark `rgba(0,0,0,0.6)` drop-shadow component.
**Alternatives:** Tonal elevation via lighter surface colors (rejected - cards are already maximum-light white). Heavier border (already at 50% accent opacity, can't push further without losing card edge cleanliness). Stronger backdrop blur on cards (rejected - blur is reserved for modals to keep visual hierarchy).
**Rationale:** Per `docs/research/dark-mode-guidelines.md`, dark drop-shadows are nearly invisible on dark backgrounds. Accent-color halos read clearly against navy and reinforce the OTR rotating-accent identity (each session's accent color radiates from cards).
**Revisit if:** Sarvi/owner say cards "float too much" in demo, or if a particular accent (orange/green) reads as too garish.

## 2026-04-12 - Mobile Bottom Nav Active State Derived From Modal/Drawer State

**Decided:** Bottom-nav `activeTab` is computed from which modal/drawer is open (e.g. `mobileMenuOpen ? 'more' : ...`) rather than its own state field.
**Alternatives:** Separate `mobileBottomNavTab` state synced to modal opens via effects (rejected - two sources of truth, easy to drift).
**Rationale:** No new state to keep in sync; tapping a tab just opens the relevant existing modal, and the active highlight follows naturally. Closing the modal automatically returns active to 'schedule'.
**Revisit if:** Bottom nav grows tabs that don't map to a modal (then a real state field is justified).

## 2026-04-12 - AnimatedNumber Supports Decimal Precision

**Decided:** `AnimatedNumber` accepts `decimals`, `suffix`, and `overtimeThreshold` props. Hours display as `12.5h` not rounded `13`.
**Alternatives:** Wrap the int-only version with a parent that splits whole vs fractional parts (rejected - more code, worse animation).
**Rationale:** Hours in this app are .5-precision. Rounding broke the display. The factor-based rounding inside the rAF loop preserves smooth easing at the chosen precision.
**Revisit if:** A consumer needs scientific notation or thousands separators (would need bigger refactor).

## 2026-04-12 - UX Overhaul: 10-Phase Plan

**Decided:** 9 fix categories + 12 improvement proposals executed across 10 phases. CSS foundation first, then THEME, then App.jsx sweep, then mobile views, then integration phases. 4 proposals deferred (smart defaults, container queries, view transitions, OKLCH).
**Alternatives:** Cherry-pick only the quick wins before demo (rejected - JR wants the full overhaul). Separate sessions per phase (rejected - plan is detailed enough to execute sequentially).
**Rationale:** Tuesday demo needs polish. The plan has specific line numbers and code snippets for every change. Execution is mostly mechanical with this level of detail.
**Revisit if:** Demo feedback contradicts any changes (especially bottom nav, glassmorphism, or density toggle). Deferred proposals revisit after demo.

## 2026-04-12 - OTR Accent Colors Are Immutable

**Decided:** The 5 OTR accent colors (Red #EC3228, Blue #0453A3, Orange #F57F20, Green #00A84D, Purple #932378) cannot be changed. Other colors (status indicators, text colors, backgrounds) can adapt around them.
**Alternatives:** Darkening green for contrast (rejected - brand color). Shifting cashier purple (rejected - mapped to brand purple intentionally). Desaturating role colors (rejected - Rainbow brand IS vibrant colors).
**Rationale:** These are literal brand colors from OTR's bags/tags/store signage. The app embodies the brand, not the other way around.
**Revisit if:** OTR rebrands or adds new brand colors.

## 2026-04-12 - WCAG Contrast via Proper Calculation (Not Simple Luminance)

**Decided:** Replace simple luminance formula (`0.299*r + 0.587*g + 0.114*b`) with proper WCAG relative luminance + contrast ratio calculation. Compare white vs navy contrast against each accent, pick higher.
**Alternatives:** Lower luminance threshold (rejected - Red 0.410 and Green 0.421 too close, threshold can't split them). Per-color override map (rejected - fragile, breaks if new colors added).
**Rationale:** Green accent gets navy text (6.1:1) instead of white (3.1:1 - fails WCAG AA). All other accents unchanged. Mathematically correct, adapts automatically to any future accent colors.
**Revisit if:** New accent colors added to rotation.

## 2026-04-11 - OTR Dark Navy + Rotating Rainbow Accents

**Decided:** Dark navy `#0D0E22` page background with white `#FFFFFF` content cards. 5 OTR brand colors (red/blue/orange/green/purple) cycle as accent on each app load via localStorage index. Role colors mapped to OTR palette permanently (not rotating).
**Alternatives:** Light mode with terracotta accent (tried first - didn't feel like Rainbow). Full white with rotating accents (tried - gradient background didn't work, cards looked pasted on).
**Rationale:** Dark background matches OTR's actual store aesthetic (stone/copper/wood). Rotating accents literally embody "Over the Rainbow." White cards float on dark with accent-colored glow shadows and borders.
**Revisit if:** Sarvi/owner feedback from Tuesday demo says it's too dark, or if accent rotation confuses users (consider letting user pick their color).

## 2026-04-11 - Luminance-Based Button Text Color

**Decided:** Auto-detect white vs dark navy text on accent-colored buttons using luminance threshold (0.55). Orange gets dark text, all others get white.
**Alternatives:** Always white text (failed WCAG on orange/green), always dark text (bad on blue/purple).
**Rationale:** Only orange accent exceeds luminance threshold. Ensures readability across all 5 accent rotations without manual per-color overrides.
**Revisit if:** New accent colors added to rotation.

## 2026-02-10 - Mobile Admin as If-Branch

**Decided:** `if(isMobileAdmin)` branch in App.jsx | **Over:** separate component (rejected - 30+ state pieces need prop drilling or state library) | **Revisit:** state management library adopted or admin state refactored into context provider

## 2026-02-10 - Desktop-Only Features Exclusion

**Decided:** Employee mgmt, per-employee auto-populate, PDF export excluded from mobile admin | **Over:** full mobile parity (rejected - infrequent tasks, complexity unjustified) | **Revisit:** Sarvi requests on mobile or mobile becomes primary admin device

## 2026-02-10 - GET-with-Params Over POST

**Decided:** All API via GET `?action=NAME&payload=JSON` | **Over:** POST (rejected - Apps Script returns HTML redirect, CORS/parsing failures) | **Revisit:** Google fixes Apps Script POST or backend migrates off Apps Script

## 2026-02-10 - Chunked Batch Save (15-Shift Groups)

**Decided:** Large saves split into 15-shift chunks | **Over:** single request (fails ~8KB URL limit), larger chunks (risk with long names) | **Revisit:** backend migrates off Apps Script GET or POST becomes reliable
