# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

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
