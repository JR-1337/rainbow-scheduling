<!-- SCHEMA: LESSONS.md
Version: 1
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append new entries. Update Affirmations counter on recurrence.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Each entry carries Affirmations: N starting at 0.
- Before appending a new entry, grep this file for existing entries with a
  similar title (case-insensitive, substring match on the main noun phrase).
  If a match exists, increment its Affirmations counter instead of creating
  a duplicate. Duplicates dilute the graduation signal.
- Increment Affirmations when the user restates the lesson or the same
  correction recurs in a later session.
- Graduate to the root adapter when Affirmations reaches 2, OR when its
  absence caused a repeated failure class that cost real time.
- Confidence level only when the lesson is inferred rather than explicitly
  stated by the user. Same H/M/L scale as DECISIONS.md (same grammar).
- Optional Evidence field when the lesson came from auto-loop observation.
  Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation)
  or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated
  in. Used on globally-graduated entries to preserve provenance.
- Do not log one-off chat trivia.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md,
  remove the duplicate.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->

## [PROJECT] -- PDF HTML must declare UTF-8 charset AND avoid em-dashes
Lesson: The PDF printout is consumed in Safari (Sarvi's iPad). Any generated HTML opened via Blob must ship `<meta charset="utf-8">` AND use `type: 'text/html;charset=utf-8'` on the Blob, otherwise old Safari falls back to Latin-1 and multi-byte UTF-8 chars (em-dash, bullet) render as garbage glyphs. Belt-and-braces: keep em-dashes out of PDF source entirely; use ASCII hyphens. Also: iOS Safari ignores `<a download>` on blob URLs and saves the raw blob as `*.blob`. Popup-blocked fallback must navigate the current tab to the blob URL instead of forcing a download.
Context: 2026-04-19 (`c002046`) -- Sarvi reported an "ae" glyph in the PDF banner and exports saving as `.blob` files. Root cause triple: no charset meta + em-dash in dateline + `<a download>` fallback on iOS Safari.
Affirmations: 0

## [PROJECT] -- Hardcoded <option> ranges silently truncate widened data
Lesson: When a form <select> has a fixed Array.from length for options (e.g. hours 6-19), any data value outside that range falls back to the first option on render and re-saves as the wrong value. Always size option lists to cover migration-widened ranges with headroom.
Context: 2026-04-19 -- EmployeeFormModal availability/defaultShift dropdowns capped at 19:00. v2.24.0 widener wrote 20:00 to Mon-Fri end. Playwright smoke showed Sadie's Mon end as 06:00 in the UI even though the sheet had 20:00. Saving would have silently truncated back to 06:00. Fix: extend range to 22:00 (length 17).
Affirmations: 0

## [PROJECT] -- Trailing-underscore functions are hidden from Apps Script editor dropdown
Lesson: Apps Script functions ending with `_` are filtered out of the editor's function-name dropdown in the new editor UI. For one-shot migrations that need to be picked from the dropdown, provide a public wrapper (no underscore) that calls the underscore version.
Context: 2026-04-19 -- `widenAvailabilityForPK_` invisible in dropdown; added `runWidenAvailabilityForPK` wrapper. Both deleted after the one-shot ran.
Affirmations: 0

## [PROJECT] -- Check for visual obstruction before re-chasing a "doesn't render" bug
Lesson: When a bug report says "X saves but doesn't show in UI," verify X is actually missing from the DOM before digging into load/key/state code. Sheet had 4 PK rows that DID render; the real issue was an `absolute bottom-0 right-0` badge layering over the work-shift's hours row, making the PK "disappear" visually while the shift appeared unchanged.
Context: 2026-04-24 Bug 5 investigation. Handoff inherited "top-nav PK doesn't render" framing from a prior session; Sheet inspection via Drive MCP showed the events existed; prod smoke showed PK badge WAS rendered but was obscuring shift content. Shifted scope from "re-render bug" to "visual overlap fix" mid-session.
Affirmations: 0

## [PROJECT] -- Absolute-positioned cell overlays collide on small schedule cells
Lesson: Desktop 56px and mobile 66px grid cells cannot host absolute-positioned overlays AND a multi-row shift payload without collision. Put secondary indicators (PK/MTG badges, icons, flags) in an in-flow flex row with the role name so the browser arbitrates space.
Context: 2026-04-24 PK/MTG badge relocation across ScheduleCell.jsx, MobileAdminView.jsx, MobileEmployeeView.jsx. Same anti-pattern in all three.
Affirmations: 0

## [PROJECT] -- Render shared overlays at App root, not inside branch returns
Lesson: Modals, toasts, action sheets and any other overlay shared between the mobile-admin early-return branch and the desktop return must be defined once (e.g. `const confirmModal = ...` before the branch) and rendered from both branches. If only one branch mounts it, state updates from the other branch silently no-op and the feature reads as broken.
Context: Shipped 2026-04-19: the auto-populate confirm `<Modal>` lived only in the desktop return. Mobile Clear Wk / Fill Wk-with-existing / PK-autofill-confirm all dispatched `setAutoPopulateConfirm({...})` but nothing mounted. Fix 1 extracted the JSX into a shared const referenced from both returns.
Affirmations: 0

## [PROJECT] -- Tokens aliased to OTR_ACCENT rotate daily; modal identity must not use them
Lesson: `THEME.accent.blue/pink/purple` are aliased to `OTR_ACCENT.primary/dark` and rotate. Anything that should carry a fixed visual identity (e.g. per-modal accent) must use a separate static token.
Context: Shipping SwapShiftModal and OfferShiftModal using `THEME.accent.purple/pink` made their headers rotate to blue/orange on non-matching days. Added `THEME.modal.swap.accent` + `THEME.modal.offer.accent` to decouple.
Affirmations: 0

## [PROJECT] -- Style-override on a Button variant is a smell
Lesson: If you find yourself passing `style={{ backgroundColor, color, border }}` into a `<Button variant="...">`, codify it as a new variant instead. The override defeats the tokenization.
Context: Sign Out drawer button shipped as `variant="secondary"` + 3-line style override for error-tone. Introducing `destructiveOutline` variant removed the override entirely.
Affirmations: 0

## [PROJECT] -- AdaptiveModal hot-resize survives mid-modal without remount
Lesson: `useIsMobile()` resize listener triggers a re-render but React reconciles children; internal modal state (selected step, form fields) survives the bottom-sheet <-> centered-card switch. Worth trusting when rolling new AdaptiveModal call sites.
Context: Playwright smoke 2026-04-18 hot-resized 390->1280 mid-RequestTimeOffModal; modal transformed without closing or losing state.
Affirmations: 0

## [PROJECT] -- AdaptiveModal mobile path doesn't render the icon prop
Lesson: On mobile, `AdaptiveModal` defers to `MobileBottomSheet({ title })` which has no icon slot. `icon` + `iconColor` are desktop-only. If per-modal visual identity needs to carry on mobile, either pass identity via `title` prefix (emoji / glyph) or extend `MobileBottomSheet` to accept an icon.
Context: Observed during 2026-04-18 re-verify; fine for current UX but documented so future AdaptiveModal work doesn't assume symmetric props.
Affirmations: 0

## Apps Script and Sheets platform

## [PROJECT] -- Sheets stores numeric-looking passwords as numbers
Lesson: Apply `String()` on both sides of password comparisons in Code.gs.
Context: Any password read from Sheets column D.
Affirmations: 0

## [PROJECT] -- Sheets boolean columns are strings "TRUE"/"FALSE"
Lesson: Compare `=== true` / `=== false`, never truthy/falsy.
Context: `isOwner`, `isAdmin`, `active`, `deleted` columns on Employees tab.
Affirmations: 0

## [PROJECT] -- Sheets Date objects use 1899 epoch for times
Lesson: `getSheetData()` normalizes Date cells to `YYYY-MM-DD`/`HH:mm`. Do not bypass.
Context: Frontend date matching silently fails without normalization.
Affirmations: 0

## [PROJECT] -- Apps Script web-app calls have ~7-8s floor
Lesson: No-op save takes ~7-8s. Per-row vs bulk distinctions drowned out.
Context: Any UX optimization assuming fast round-trip. Only CF Worker or full migration helps.
Affirmations: 0

## [PROJECT] -- Apps Script POST returns HTML redirect instead of JSON
Lesson: Use GET-with-params. POST tried first for large payloads, falls back to chunked GET.
Context: All `apiCall(action, payload)` routes.
Affirmations: 0

## [PROJECT] -- Sheets.Spreadsheets.Values.batchGet unusable here
Lesson: FORMATTED_VALUE returns booleans as "TRUE"/"FALSE" strings; SERIAL_NUMBER needs column-name list. Stick with `getDataRange().getValues()`.
Context: Attempted v2.19 read optimization; reverted.
Affirmations: 0

## [PROJECT] -- formatTime helpers must handle undefined/null
Lesson: `formatTimeDisplay`/`parseTime`/`formatTimeShort` receive empty times during shift creation.
Context: Any new consumer of these helpers.
Affirmations: 0

## CSS, theme, and rendering

## [PROJECT] -- Tailwind JIT `placeholder:` variant unreliable in runtime style blocks
Lesson: Put pseudo-element styles in `index.css` with `!important`.
Context: Dynamic placeholder styling via JSX style tags fails.
Affirmations: 0

## [PROJECT] -- `-webkit-line-clamp` invisible in PDF print popup
Lesson: Use `word-break` CSS in PDF generators.
Context: `src/pdf/generate.js`.
Affirmations: 0

## [PROJECT] -- `THEME.bg.primary` is page-level only
Lesson: Inner UI elements (inputs, tab bars, cells in cards) must use `bg.tertiary` or `bg.secondary`.
Context: Switching `bg.primary` to dark broke ~10 inner elements that assumed it was light.
Affirmations: 0

## [PROJECT] -- Transparent accent-tinted cards invisible on dark
Lesson: Use solid `bg.secondary` with accent border or stripe; avoid `THEME.accent.blue + '10'`.
Context: Cards on dark navy backdrop.
Affirmations: 0

## [PROJECT] -- Card border opacity hex suffix `30` invisible, `80` visible
Lesson: Use `THEME.border.default` (accent at 50%).
Context: Card edges on dark bg.
Affirmations: 0

## [PROJECT] -- Gradient blobs behind cards make cards look pasted on
Lesson: Solid dark bg only.
Context: Dark-mode page backdrops.
Affirmations: 0

## [PROJECT] -- Keep role colors fully saturated
Lesson: Only functional status indicators (warning/error) get desaturated. Rainbow brand IS vibrant colors.
Context: Any "consistency" refactor tempted to mute role colors.
Affirmations: 0

## [PROJECT] -- `THEME.accent.blue` and `.purple` are rotating aliases
Lesson: They point to `OTR_ACCENT.primary`/`.dark` and rotate daily. Hardcoded white on gradient may fail WCAG on green.
Context: Any new gradient using these slots; use `THEME.accent.text` for auto-contrast or `OTR.accents[N]` for fixed color.
Affirmations: 0

## React, perf, and refactor hazards

## [PROJECT] -- Inline arrow functions as props defeat React.memo
Lesson: Use existing `useCallback` handlers (`handleCellClick` etc.) on memoized grid rows.
Context: Hot-path grid cells; new refs each render break memo.
Affirmations: 0

## [PROJECT] -- `.toISOString().split('T')[0]` slow in hot render paths
Lesson: Use `toDateKey(date)` -- ~10x faster, no ISO alloc, no regex split.
Context: Grid renders across 280+ cells.
Affirmations: 0

## [PROJECT] -- Bulk search/replace across hot paths silently mangles
Lesson: After mechanical renames, grep exact new identifier AND smoke-load built bundle before commit. Vite did not catch `stoDateKey(d)` typo.
Context: Any >20-site find/replace.
Affirmations: 0

## [PROJECT] -- Delete inline component AFTER adding import
Lesson: Always add import first, then delete inline block. `npm run build` does NOT catch undefined JSX refs (Vite tree-shakes silently).
Context: Any extraction from App.jsx into `src/panels/` or `src/modals/`.
Affirmations: 0

## [PROJECT] -- Top-level use of `../App` symbols breaks circular imports
Lesson: In `src/pdf/generate.js`, `src/email/build.js`, `src/panels/*`, `src/modals/*`, keep all `../App` references inside function bodies. Top-level reads break the cycle.
Context: ESM live bindings resolve at call-time; cycle works only if all uses deferred.
Affirmations: 0

## [PROJECT] -- "Unused" import lists written by hand are the bug
Lesson: After extraction, programmatically cross-check every exported symbol. S40.3 dropped ROLES by hand; prod white-screened 10 min.
Context: Any `src/views/` or `src/modals/` import cleanup.
Affirmations: 0

## [PROJECT] -- Defensive-filter malformed rows at the boundary
Lesson: `.filter(ev => EVENT_TYPES[ev.type])` at ingress, not at each read site.
Context: Any lookup-by-enum pattern; a typo in a Sheet cell otherwise crashes every consumer.
Affirmations: 0

## [PROJECT] -- Inline modal backdrop class chain duplicates helper
Lesson: Use `AdminRequestModal` at `src/App.jsx` -- renders MobileBottomSheet on mobile, centered modal on desktop.
Context: Any admin request modal. Duplication drifts from helper's a11y/touch-target contract.
Affirmations: 0

## Data shape defensive parsing

## [PROJECT] -- Empty Sheet field -> `JSON.parse('')` throws -> login bounced
Lesson: When adding defensive parser at one entry-point, sweep ALL parse sites for that field. S50 fixed getAllData; S52 had to fix parent handleLogin (line 1408).
Context: Any Sheet-sourced JSON field (availability, storeHours, requests).
Affirmations: 0

## [PROJECT] -- Fallback must return fully-populated shape, not `{}`
Lesson: ScheduleCell reads `availability.available` directly; `{}` -> undefined -> crash. Use `ensureFullWeek()` or equivalent.
Context: Any data-layer fallback for nested shape.
Affirmations: 0

## [PROJECT] -- Number vs string empId in composite-key comparisons
Lesson: Coerce both sides with `String()` at any boundary comparing parsed-key empId to `currentUser.id`. Sheet numeric id (101) against parsed "101" fails `!==`.
Context: SwapShiftModal + OfferShiftModal + any composite-key reader.
Affirmations: 0

## Auth and backend regression

## [PROJECT] -- Frontend auth refactor strip requires backend handler sweep
Lesson: Grep Code.gs for EVERY reader of stripped field; either back-compat-inject in apiCall OR rewrite handlers to derive from `auth.employee.email`. Do not stop at first failing test case.
Context: S37 stripped `callerEmail`; broke ~30 handlers reading payload.callerEmail directly.
Affirmations: 0

## [PROJECT] -- Trusting `result.success` from chunkedBatchSave
Lesson: Also read `data.{totalChunks, failedChunks, savedCount}`. Surface "X of Y batches saved" on partial failure; retain unsaved flag.
Context: Per S34 chunked-save contract.
Affirmations: 0

## [PROJECT] -- Backend 3-tuple key must be mirrored in frontend allShiftKeys
Lesson: When changing backend key format, grep frontend for every site building that key shape BEFORE testing. Mismatch wipes survivor shifts.
Context: S61 `${empId}-${date}-${type}` change; caught by adversarial audit pre-deploy.
Affirmations: 0

## [PROJECT] -- Frontend-only field fix leaves Sheet blank
Lesson: Include derived fields (hours, computed keys) in save payload even if frontend can recompute. Keeps Sheet self-describing for payroll/backups/audits.
Context: Adding meeting/pk events without `hours` in batchSaveShifts payload.
Affirmations: 0

## [PROJECT] -- Opus 4.7 plans, Sonnet 4.6 executes
Lesson: For non-trivial multi-file changes, spawn an Opus 4.7 subagent to produce the detailed plan; spawn a Sonnet 4.6 subagent to execute it. Sonnet does both in the same session only when a model flag prevents spawning Opus (e.g. current session running in Sonnet only mode).
Context: JR stated 2026-04-23 "I'm gonna have opus 4.7 do the thinking and sonnet executing detailed plans" after EnterPlanMode confusion. Explicitly: "opus 4.7 plans the code and does the system 2 thinking and then a sonnet 4.6 sub agent executes the very specific plan."
Affirmations: 0

## Workflow and process

## [PROJECT] -- Push and confirm deploy before handing JR a phone-smoke checklist
Lesson: After any commit JR will phone-test, `git push origin main` AND state "pushed, Vercel redeploys in ~60s, hard-refresh first". Never hand over test steps while prod serves old bundle.
Context: 2026-04-18 -- shipped Phase A+B+C locally, wrote 9-step checklist, JR tested on prod (still old code), results for items 5/8/9 were false negatives, wasted his time and trust.
Affirmations: 0

## [PROJECT] -- Hard-refresh is not always enough; verify bundle hash from view-source
Lesson: When JR reports "not working" after a fresh-looking reload, curl the prod URL for the current `index-*.js` hash and tell him to open `view-source:` on his phone and search for it. If absent, browser cache is the cause; if present, real bug to hunt.
Context: 2026-04-18 -- Staff-reopen fix was deployed and verified live (curl matched local build), but JR's phone still served a cached bundle. Hard-refresh instructions alone did not evict it.
Affirmations: 0

## [PROJECT] -- Optimistic updates must capture prev state and revert on API failure
Lesson: Every `setEmployees(...)` / `setShifts(...)` / `setX(...)` that precedes an `apiCall` must capture `const prevX = X;` before the mutation. On `!result.success`: `setX(prevX)` AND `showToast('error', ...)` AND `return false`. Showing an error toast while leaving the optimistic change in place gives the user a false-positive signal.
Context: Employee save/delete/reactivate flows pre-2026-04-18 showed error but kept UI in post-save state. JR caught this during Wi-Fi-off smoke. Pattern applies to any new mutation path.
Affirmations: 0

## [PROJECT] -- Modal close-handler side effects go in useEffect on open-flag, not inline onClose
Lesson: For "do X when the modal finishes closing" (e.g. reopen parent sheet, reset another piece of state), use `useEffect(() => { if (!open && flagRef.current) { flagRef.current = false; doX(); } }, [open])` with a ref-held flag set when the modal opened. Do NOT put the logic inline in the Modal's onClose alongside the `setOpen(false)` call.
Context: 2026-04-18 -- inline onClose with a state flag for reopening MobileStaffPanel after EmployeeFormModal close did not reliably fire. Ref+effect fixed it. Suspected batched-state / stale-closure timing.
Affirmations: 0

## [PROJECT] -- Follow approved plan verbatim
Lesson: Do not ask "bundle or split?" or "what's next?" mid-execution. If ambiguous, re-read plan file; do not re-ask JR.
Context: Plan sign-off removes decisions from the loop. Re-asking wastes context and erodes trust.
Affirmations: 2
-- GRADUATE to root adapter at next audit --

## [PROJECT] -- One clarifying question per directive
Lesson: Ask at most one, only on the actual unresolved axis. "Audit the file" means audit the file.
Context: Splitting a top-level directive into sub-scope questions signals audit-seeking.
Affirmations: 0

## [PROJECT] -- Echo user-stated facts before saving to memory or plan
Lesson: State the number/fact back verbatim before persisting. S47 saved wrong "24/16/$29,120" via extrapolation; JR corrected to "34/14/$25,480" days later.
Context: Any project-fact save that affects downstream artifacts.
Affirmations: 0

## [PROJECT] -- Do not fresh-audit when categorized audit already drove the plan
Lesson: Reuse the existing P0-P3 categorization. Fresh audits create duplicate findings and imply the chunking is wrong.
Context: Mid-session re-audits on already-planned work.
Affirmations: 0

## [PROJECT] -- Use `git add <explicit paths>`, never `-A` or `.`
Lesson: `git add -A` swept Photos/ + dist/ + package-lock.json into a commit once. Recovery took a soft-reset.
Context: Multi-file commits. Global CLAUDE.md forbids this; trap is the tidiness feeling.
Affirmations: 0

## Research, measurement, and claims

## [PROJECT] -- Research agent estimates are hypotheses, not results
Lesson: Always Playwright-verify before claiming a perf win. S45 batchGet estimated 40% cut; measurement showed render-mode mismatches and no win.
Context: Any perf/UX claim sourced from a subagent.
Affirmations: 0

## [PROJECT] -- Network-level diagnostics first, then narrow
Lesson: When user reports "spinner stops, no toast," fetch actual response (curl + browser console). If JSON is valid, bug is frontend, not backend.
Context: S52 spent two messages speculating at backend issues; actual fix was JSON.parse('') in App.jsx line 1408.
Affirmations: 0

## Pitch work (sibling project lessons, retained for future pitch context)

## [PROJECT] -- No predicted savings in ROI without measurement
Lesson: Claim only (a) confirmed current-state cost, (b) product cost. Trial is the measurement window.
Context: Pitch deck and any future ROI math. Family will shoot at predicted numbers with no defense.
Affirmations: 0

## [PROJECT] -- Cap ESA mentions at one per surface, never headline
Lesson: ESA is real but over-reliance signals monomaniacal framing. Find detractors on different axes (customer sentiment, interface, vertical fit, account ownership).
Context: JR forbade ESA mentions on Slide 4 Alternatives.
Affirmations: 0

## [PROJECT] -- No cheesy/salesy/SaaS-hero copy
Lesson: Drop "let's prove it together," "we've got you covered," exclamation marks, emoji peppering, gradient-on-type wordmarks.
Context: Pitch deck, leave-behinds, family-facing text.
Affirmations: 0

## [PROJECT] -- No fabricated stats for concreteness
Lesson: Only use Sarvi-confirmed (34 staff, 14 hr/wk), statutory (O. Reg. 189/24 $5K), or pure arithmetic from those. Range with "roughly" if not sourced.
Context: "7-10 decisions per person" and "500 cells" got caught.
Affirmations: 0

## [PROJECT] -- Do not frame Sarvi as single-point-of-failure
Lesson: Audience is family; Sarvi is lieutenant, not replacement target. Amy distrusts automation. Better angles: process scale, off-hours spillover, no institutional record.
Context: Any Sarvi-at-risk framing in customer-facing copy.
Affirmations: 0

## [PROJECT] -- Competitor detractor bullets must BE detractors
Lesson: No praise lines. If a bullet makes the audience Google the competitor more favorably, it is a sell not a knock.
Context: Slide 4 alternatives.
Affirmations: 0

## [PROJECT] -- Cite only flaws Rainbow actually beats today
Lesson: Phase 2 capability does not count. "They both lack X" turns into "competitor is comparable."
Context: Alternatives slide; same root as no-predicted-savings.
Affirmations: 0

## [PROJECT] -- Family tree: Amy is Dan's sister, Joel is Dan's brother, Scott is ops mgr, Sarvi is NOT family
Lesson: Check this before any family-framed copy.
Context: Got corrected mid-draft.
Affirmations: 0

## [PROJECT] -- Schedule work = full admin envelope, not just grid-writing
Lesson: Envelope = schedules + management talks + time-off + swaps + sick calls + push + off-hours. Use envelope number in ROI, not grid hours alone.
Context: Slide 2 framing.
Affirmations: 0

## [PROJECT] -- Statutory claims must match ontario.ca authoritative source
Lesson: Verify every legal/compliance claim. Daily rest is 8 hours, not 11.
Context: Pitch compliance card.
Affirmations: 0

## [PROJECT] -- Verb calibration: "enforced" vs "flagged"
Lesson: 44hr OT is an amber visual flag, not a publish-blocker. Use "flags" / "surfaces"; "enforces" overclaims.
Context: Any product-capability description.
Affirmations: 0

## [PROJECT] -- Re-read the plan before EVERY slide change
Lesson: "I don't think ur following the plan" -- three rounds of rework when skipped. Plan is contract.
Context: Pitch build-plan.md iteration.
Affirmations: 0

## [PROJECT] -- When a UI approach gets rejected 3+ times, stop iterating
Lesson: Propose a different workflow (user own screenshots, bring a brief back) instead of tweak-number-four.
Context: S58 burned 6 failed Slide 3 layouts before pivot.
Affirmations: 0

## [PROJECT] -- Build and deploy together when JR says "ship"
Lesson: `npm run build` does not reach rainbow-pitch.vercel.app; chain `vercel --prod --yes` in same move.
Context: RAINBOW-PITCH slide copy changes.
Affirmations: 0

## Visual / tooling

## [PROJECT] -- Headed Playwright unreliable on Chromebook/Crostini
Lesson: MCP playwright is OK for static screenshots. For motion: static photos + ffmpeg, phone screen-record, or CSS animation.
Context: Recorded `pitchdeck/capture/cover-loop.mjs` is a graveyard reference.
Affirmations: 0

## [PROJECT] -- Pixel-detect modal bounds, do not guess ffmpeg offsets
Lesson: Python PIL luminance-jump from each edge bracket on first index where `(r+g+b)/3 > 190` exceeds N.
Context: UI screenshot cropping for pitch.
Affirmations: 0

## [PROJECT] -- Pitch-deck UI screenshots on dark navy: 1px light-gray border, `saturate(0.92)`, no device frames, no browser chrome
Lesson: Dark shadows weak on dark bg; device frames compete with screenshot. Each photo its own `.card` with accent top border.
Context: Slide 3 layout.
Affirmations: 0

## [PROJECT] -- Bumping typography size for new viewing distance needs ladder sweep
Lesson: Raise display/subhead/card title/body/eyebrow together. Inline `fontSize` overrides break hierarchy if skipped.
Context: S60 TV-viewing bump; card fonts ended up larger than subheader.
Affirmations: 0

## React conventions (from legacy conventions.md)

## [PROJECT] -- Functional components + hooks only
Lesson: No class components in this repo.
Context: React style baseline.
Affirmations: 0

## [PROJECT] -- Shared exports route through App.jsx
Lesson: THEME, ROLES, formatDate, formatTimeDisplay, parseTime, formatTimeShort -- single source of truth from `src/App.jsx`.
Context: Mobile files import from `./App` to avoid circular deps.
Affirmations: 0

## [PROJECT] -- `useIsMobile()` at 768px breakpoint
Lesson: Branches mobile vs desktop rendering at that width.
Context: All device-split surfaces.
Affirmations: 0

## [PROJECT] -- `verifyAuth(payload, requiredAdmin)` server-side on all protected endpoints
Lesson: Reads `payload.token` (preferred) or legacy `payload.callerEmail`. Handlers derive `callerEmail` from `auth.employee.email`, never destructure from payload.
Context: Backend Code.gs; S41.1 rule.
Affirmations: 0

## [PROJECT] -- `guardedMutation(label, fn)` wraps admin + employee mutations
Lesson: Shows 'saving' toast during 2-3s Apps Script round-trip; silently drops second-click via `actionBusyRef`.
Context: Admin approve/deny/revoke/cancel and employee submit handlers.
Affirmations: 0

## [PROJECT] -- Success toasts mention destination
Lesson: "moved to Settled history" > "approved." Users see where the row went.
Context: Any guarded mutation success message.
Affirmations: 0

## [PROJECT] -- Parity audit must verify rendered behavior, not component grep
Lesson: A component-presence grep incorrectly reports gaps. Hover tooltips, conditional renders, and richer-desktop equivalents are invisible to grep. Always code-read the actual render path before declaring a gap.
Context: 2026-04-23 parity audit -- Explore subagent misreported 2 of 3 gaps (Employee Quick View "missing" on desktop; Hidden section "missing" on mobile). Both existed; the actual gap was narrower (one missing Edit button). Subagent used keyword search only.
Affirmations: 0

## [PROJECT] -- Display sort: Sarvi, other admins alpha, FT alpha, PT alpha
Lesson: Four buckets in order. Sarvi pinned top; other non-owner admins (with showOnSchedule where the list filters them) next alpha; then full-time non-admins alpha; then part-time non-admins alpha. Two discreet dividers render on bucket transitions. Single source of truth: `src/utils/employeeSort.js` (`sortBySarviAdminsFTPT`, `employeeBucket`, `computeDividerIndices`).
Context: Admin grid (App.jsx), employee view (views/EmployeeView.jsx), mobile admin + mobile employee (MobileAdminView, MobileEmployeeView), PDF (src/pdf/generate.js). Shipped 2026-04-20; supersedes prior 3-bucket rule.
Affirmations: 0

## [PROJECT] -- Past dates: headcount only, no target comparison
Lesson: No color-coding for historical shortfalls; only current/future dates warn.
Context: Admin grid rendering.
Affirmations: 0

## [PROJECT] -- Overridden dates: cyan-tinted text
Lesson: Visual marker for dates with per-date overrides vs defaults.
Context: Admin grid rendering.
Affirmations: 0

## [GLOBAL] -- One UI control = one field write (orthogonality)
Lesson: A picker/toggle/button writes only the field(s) it nominally owns. Do not bundle adjacent-field updates ("atomic" writes of 4-5 fields per click) even when "data-model cleanliness" tempts it. Independent settings stay independent across all transitions.
Context: 2026-04-25 -- the EmployeeFormModal tier picker (Staff/Admin/Admin 2) was writing `{isAdmin, adminTier, title, showOnSchedule, defaultSection}` per click. Two distinct regressions surfaced: (1) Admin click force-wrote `showOnSchedule: false`, hiding admin1s from grid on every tier change; (2) JR re-stated the principle as a rule: "any employee of any level's visibility persists independently of them moving levels or roles. or anything. i changed 1 setting not two. thats simple logic." Fix shipped at `5fece50` then consolidated at `303e4c5`. Helpers like `defaultSection: 'none'` for admin2 were also stripped because the render layer ignores defaultSection for hasTitle employees, making the bundle cosmetic.
Confidence: H -- direct user instruction.
Affirmations: 1

<!-- TEMPLATE
## [GLOBAL] -- [Lesson title]
Lesson: [what to do or avoid, in one sentence]
Context: [when it applies]
Affirmations: 0

## [PROJECT] -- [Lesson title]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 1
(Graduates to root adapter at Affirmations: 2)

## [MODULE: auth] -- [Lesson title, inferred]
Lesson: [what to do or avoid]
Context: [when it applies]
Confidence: M -- [what would verify]
Affirmations: 0

## [PROJECT] -- [Lesson ratified from auto-loop]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## [GLOBAL] -- [Lesson graduated from cross-project pattern]
Lesson: [what to do or avoid]
Context: [when it applies]
Affirmations: 0
Source: graduated-from-project
Origin: [project-a, project-b]
-->
