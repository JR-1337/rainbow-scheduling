# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

## 2026-04-12 - callerEmail Regression Fixed Backend-Side (Not Frontend Shim)

**Decided:** S41.1 rewrites every protected Code.gs handler to derive `callerEmail` from `auth.employee.email` after `verifyAuth(payload)` instead of destructuring from the payload. Code.gs bumped to v2.16. Frontend unchanged.
**Alternatives:** Frontend shim auto-injecting `callerEmail: getCachedUser()?.email` in `apiCall` (rejected — perpetuates trust-the-client, and the token is already the authoritative identity; shim would paper over the real S37 gap). Keep S40.2's per-site back-compat pattern (rejected — ~30 sites, fragile, next regression would hit the same class again).
**Rationale:** Token is authoritative. Handlers that read `callerEmail` off the payload were reading attacker-controlled data post-S37 anyway (payload could be spoofed; the token can't). Deriving from `auth.employee.email` aligns with the S36 token-first model and closes the whole class. Requires one Apps Script deploy; no frontend ship needed.
**Revisit if:** A future handler needs to act on behalf of a different user (e.g. admin impersonation flow) — then `targetEmail` stays in the payload explicitly, but `callerEmail` (the actor) always comes from auth.

## 2026-04-12 - Payroll Aggregator = Path 1 (Rainbow as Bridge, Not Replacement)

**Decided:** Post-demo, build Rainbow into the aggregator between Counterpoint (clock-in actuals) and ADP (payroll). Rainbow ingests Counterpoint actuals, shows scheduled-vs-actual reconciliation + PTO + OT flags, admin enters bonuses in-app, Rainbow emits an ADP-ready export file. Counterpoint + ADP stay as-is. Pending demo go-ahead + discovery answers from Sarvi (Counterpoint export format, ADP upload format, employee ID consistency, bonus logic).
**Alternatives:** Replace Counterpoint clock with Rainbow punch-in/out (rejected for v1 — fights Counterpoint's POS-register tie-in, higher risk). Full API↔API orchestration with Rainbow middle (rejected for v1 — depends on both vendors' APIs existing and being usable; discover later).
**Rationale:** Owner's pain is re-typing between 3 systems every 2 weeks plus separate bonus workflow. Path 1 is additive (nothing existing breaks), reuses what Rainbow already knows (employees, schedule, PTO, ESA OT), and the bonus-entry UI is a small standalone feature. Full replacement or full API is a v2 conversation after the aggregator proves value.
**Revisit if:** Discovery reveals Counterpoint has no usable export (printed PDF only) — then path 1 is blocked and path 2 becomes cheaper by comparison. Or if owner prefers a full replacement after seeing the aggregator working.

## 2026-04-12 - S39.4 Mobile Admin Extraction Deferred (Honors Prior Decision)

**Decided:** The `if (isMobileAdmin) { return (...) }` branch in App.jsx stays inline. Plan file `lovely-launching-marble.md` listed S39.4 as "extract to `src/MobileAdminView/index.jsx`" but that directly conflicts with the 2026-02-10 "Mobile Admin as If-Branch" decision below. No architectural precondition (state context provider or state library) has been met, so the original rationale still holds. S39.3b/c/d (remaining admin panels) are also deferred post-demo to keep the demo window safe — those extractions are low-risk and can land in a future session.
**Alternatives:** Execute S39.4 anyway via prop drilling (rejected — revives the exact pattern 2026-02-10 rejected, introduces a 30+ prop maintenance burden). Refactor admin state into a context provider first, then extract (rejected for this window — days of work, well outside S39 scope, 2 days from demo).
**Rationale:** Plan was written without cross-checking decisions.md. Following the plan verbatim would have silently overridden a prior decision. Flagging + deferring is the correct move per global rule "Hits something immutable → flag conflict with stakes."
**Revisit if:** Admin state is refactored into a React Context or state library (same revisit condition as the 2026-02-10 decision). At that point S39.4 becomes cheap.

## 2026-04-12 - S36 HMAC Session Tokens + SHA-256 Password Hashing (Stateless)

**Decided:** Login issues `base64url(payload).base64url(HMAC_SHA_256(payload, HMAC_SECRET))` tokens with 12h TTL. Payload = `{e: email, exp: ms, a: isAdmin, o: isOwner}`. `verifyToken_` uses constant-time comparison. Passwords stored as `base64url(SHA_256(uuidSalt + password))` in new `passwordHash`/`passwordSalt` columns. Dual-check on login: hash first, plaintext fallback, migrate plaintext → hash on successful fallback. Admin `resetPassword` writes plaintext so admin UI can display the default; next login re-migrates. `verifyAuth(authArg)` accepts payload object (prefers token, falls back to `callerEmail`) or bare string for legacy callers — unblocks S37 migration without breaking deployed frontend.
**Alternatives:** Stateful session table with rotation + revocation (rejected for pre-demo window — larger sheet surface + extra round trip; revisit after owner meeting). Bcrypt (rejected — no native Apps Script primitive, polyfill overhead). Clear plaintext column immediately on migration (rejected — plan defers removal to S40 after monitoring window confirms migration completion).
**Rationale:** HMAC tokens eliminate trust-the-client. Stateless means no sheet write per request. SHA-256 with per-user salt is native to Apps Script (`Utilities.computeDigest`). Dual-check is non-breaking for users who haven't logged in since deploy. Rotating `HMAC_SECRET` = force-logout-all (documented as the ops path).
**Revisit if:** Owner meeting surfaces a need for revocation/rotation (then add stateful token table). MFA becomes a requirement. Or if S40 confirms migration complete and plaintext fallback can be removed.

## 2026-04-12 - Email Body Not HTML-Escaped (Plaintext Via MailApp)

**Decided:** `buildEmailContent` returns a plaintext body. `MailApp.sendEmail({ to, subject, body, name })` in `backend/Code.gs:1516` sends as plaintext (no `htmlBody`). S34.2 XSS escape applied to the 5 PDF HTML interpolation sites only, not the email builder's 7 candidate sites.
**Alternatives:** Escape email body anyway for defence-in-depth (rejected — would render `&amp;` as literal characters to recipients, breaking legible content). Upgrade email to HTML with `htmlBody` then escape (rejected — out of S34 scope, pre-existing "professional sender email" blocker would also need resolution first).
**Rationale:** HTML escaping only protects HTML contexts. Plaintext email is not an HTML XSS vector. Escaping user-controlled strings there actively harms readability.
**Revisit if:** Email delivery is upgraded to `htmlBody` (then every interpolation in `src/email/build.js` needs `escapeHtml` applied in the same pass).

## 2026-04-12 - PDF + Email Builders Extracted, Circular ESM Imports

**Decided:** `generateSchedulePDF` → `src/pdf/generate.js`, `buildEmailContent` → `src/email/build.js`, `parseLocalDate` + `escapeHtml` → `src/utils/format.js`. New modules import constants (`ROLES`, `ROLES_BY_ID`, `isStatHoliday`, `formatTimeShort`, etc.) directly from `../App`, while `App.jsx` imports the functions back. Relies on ESM live bindings — references inside function bodies resolve at call-time, not at module-eval.
**Alternatives:** Move all shared constants to `src/theme.js` + `src/constants.js` first to break the circle (rejected — much larger diff, pre-demo). Pass constants as function arguments (rejected — noisy call sites, defeats the point of extraction).
**Rationale:** App.jsx shrank -262 lines with surgical risk. Build + smoke-served clean. Circular imports between App.jsx and these extracted modules work because every use of imported symbols happens inside function bodies invoked after module-graph evaluation completes.
**Revisit if:** Module-eval-time use of these constants is ever introduced in the new files (would break circle). Or if S39 extraction moves constants out of App.jsx and eliminates the cycle naturally.

## 2026-04-12 - Chunked-Save Partial Failure = Hard Failure

**Decided:** `chunkedBatchSave` returns `{ success: false, error, data: { savedCount, totalChunks, failedChunks } }` whenever any chunk fails (even if others succeeded). Previously returned `success: true` with a `warning` field, which callers never read.
**Alternatives:** Keep `success: true` with stronger warning plumbing (rejected — two success tiers is a footgun; every caller needs per-caller reasoning about when warning matters). Succeed only if every chunk saved (same behavior, different framing).
**Rationale:** The only safe default is "any lost write = retry required." Callers retain unsaved flag so the user can hit Save again. Matches how users actually understand save operations.
**Revisit if:** A specific caller legitimately wants partial-success semantics (then define an explicit second API, don't overload `chunkedBatchSave`).

## 2026-04-12 - Schedule-Context Toolbar Hides on Non-Schedule Destinations

**Decided:** Mobile admin Row-3 action buttons (Edit/Save/Go Live/Publish) and Row-4 status banner (Edit Mode + Fill/Clear Wk) only render when `mobileAdminTab === 'schedule' || 'mine'`. Hidden entirely on requests/comms.
**Alternatives:** Grey them out / disable them (rejected - greying implies "unavailable right now" but the action isn't unavailable, it's irrelevant to the current destination; teaches users to ignore the toolbar). Keep visible (rejected - clutter, nonsensical context like "Clear Week 1" while reading announcements).
**Rationale:** Same pattern already established for Wk1/Wk2/Mine filing tabs (Row 5). Toolbar items belong to their destination. Reclaims vertical space on mobile.
**Revisit if:** User feedback wants a persistent "Edit" shortcut from any destination (unlikely — bottom nav + tap into schedule is 2 taps).

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
