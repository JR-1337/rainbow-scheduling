<!-- SCHEMA: DECISIONS.md
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence: H requires inline verification note with source and date.
  Example: `Confidence: H - tests pass 2026-04-16`
- Confidence: M is the default when verification is absent or stale.
- Confidence: L when plausible but unverified; name what would confirm.
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation later.
- Do not store temporary plans, open questions, or task checklists (use TODO.md).
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->

## 2026-04-18 -- Test-employee scrub executed; purge functions removed
Decision: Ran `purgeTestEmployees` from Apps Script editor. 20 `@example.com` employees + 50 shifts deleted from the live Sheet. Then removed `listTestEmployees` / `purgeTestEmployees` / `_findTestEmployees_` from `backend/Code.gs` and from the live editor. Also deleted `backend/seed-demo-data.gs` and scrubbed the 5 legacy Emma/Liam/Olivia/Noah/Ava seed rows from `createEmployeesTab`. Stale Alex Kim smoke-pattern lesson removed from LESSONS.md.
Rationale: One-time cleanup per Sarvi request. Keeping the purge functions around invites accidental re-run. `clearAllData` stays because it has general utility; this one didn't.
Confidence: H -- verified 2026-04-18 via Drive MCP `getAllData` read: 24 employees, 79 shifts, 0 `@example.com` rows.

## 2026-04-18 -- One-time data scrubs ship as editor-only functions in Code.gs
Decision: `listTestEmployees` + `purgeTestEmployees` lived in `backend/Code.gs` as editor-only functions (not wired to `handleRequest`). Superseded by removal entry above after the one-time scrub completed. Same pattern as existing `clearAllData` at Code.gs:2338.
Rationale: Destructive cross-sheet ops (Employees + Shifts + ShiftChanges) should require Apps-Script-editor access, not an HTTP handler. Editor access is already limited to JR/Sarvi; HTTP handler would require admin-auth-plus-confirmation plumbing for a one-time job. Version control via git preserves audit trail without expanding the attack surface.
Confidence: H -- verified 2026-04-18: `listTestEmployees` not registered in `handleRequest` action map (grep); only invocable from editor.

## 2026-04-18 -- PDF XSS sweep is complete; no further action needed
Decision: Item 10 in `~/.claude/plans/adversarial-audit-fix-plan.md` ("Partial PDF XSS surface remains") is closed. All 7 user-writable interpolations in `src/pdf/generate.js` already wrapped in `cleanText` (== `escapeHtml(stripEmoji(s))`). Role color has regex hex whitelist at generate.js:131. `src/email/build.js` emits plain text mail (no HTML parse).
Rationale: LESSONS note "escape applied to only 5 sites" was stale at the time of the audit -- a prior commit had already expanded the sweep. Verified by grepping every `${...}` in generate.js and classifying each as user-writable / code-controlled.
Confidence: H -- verified 2026-04-18 by exhaustive grep audit; commit `51ea778` documents the audit in CONTEXT/TODO.md Completed.

## 2026-04-18 -- Request modals use fixed (non-rotating) identity colors
Decision: `src/theme.js` exports `THEME.modal.swap.accent = '#7C3AED'` (violet) and `THEME.modal.offer.accent = '#EC4899'` (pink). `SwapShiftModal` + `OfferShiftModal` use these instead of `THEME.accent.purple` / `THEME.accent.pink` (which are aliased to rotating `OTR_ACCENT`). Submit-button brand gradient (blue -> rotating purple) preserved as primary-action convention.
Rationale: Playwright smoke 2026-04-18 revealed modal headers lost their visual identity on rotation days (e.g. "pink" offer modal rendered orange when OTR accent rotated to orange). Fixed modal identity colors are orthogonal to the daily brand rotation.
Confidence: H -- verified 2026-04-18 on prod b0851f8 with OTR rotated to Orange: Offer header stayed pink, Swap header stayed violet. Screenshots in .playwright-mcp/reverify-05/06.
Rejected alternative: recolor `THEME.accent.pink` / `THEME.accent.purple` to break their alias to `OTR_ACCENT`. Rejected because those tokens are also used for non-modal UI (e.g. isAdmin avatar + Shield icon) where rotation IS desired.

## 2026-04-18 -- Offer/Swap filter includes today, not strictly tomorrow
Decision: `src/modals/OfferShiftModal.jsx` + `src/modals/SwapShiftModal.jsx` filter `shiftDate >= today` (midnight-anchored). Dropped the `tomorrow` local variable.
Rationale: Original filter `>= tomorrow` excluded today's not-yet-started shifts. Staff can reasonably want to give away or swap a shift they realized this morning they can't work. Current-day exclusion added friction without protection.
Confidence: M -- verified build green + empty-state still shows correctly when no future shifts (Alex had no Apr 18+ shifts). Not hands-tested with a today-shift scenario; behaves correctly per code.
Revisit if: post-submit window enforcement is needed (e.g. no offers within 2hrs of shift start).

## 2026-04-18 -- Admin-blocked request types are hidden, not disabled
Decision: `src/modals/RequestTimeOffModal.jsx` filters the `requestTypes` array via `!isAdmin && { ... }` followed by `.filter(Boolean)`. Admins see a single "Days Off" card; non-admins see all three.
Rationale: Showing disabled "Employees Only" cards to admins was informational noise. One-card UI is cleaner.
Confidence: H -- Playwright-verified on prod b0851f8 as JR (admin) sees only Days Off, as Alex (employee) sees all three.

## 2026-04-18 -- Button.jsx destructiveOutline variant replaces inline override
Decision: `src/components/Button.jsx` adds 6th variant `destructiveOutline` (bg.tertiary + status.error text + status.error@30% border). `MobileAdminDrawer` Sign Out button now uses `variant="destructiveOutline"` instead of `variant="secondary"` + a style-override for color/border.
Rationale: Style-override on a variant defeats tokenization. Codifying the pattern as a named variant keeps all destructive-action affordances within the Button primitive.
Confidence: H -- Playwright-verified 2026-04-18 on prod b0851f8.

## 2026-04-18 -- Button.jsx primitive replaces 13 inline button sites
Decision: `src/components/Button.jsx` -- 5 variants (primary, secondary, ghost, recoverable, destructive) + 1 follow-up (destructiveOutline) x 3 sizes (sm 36 / md 44 / lg 48). Accepts `leftIcon` / `rightIcon` (lucide components) + `iconSize`, `fullWidth`, `disabled`, plus passthrough for `className`, `style`, `aria-*`. Uses `React.forwardRef` so refs land on the underlying `<button>`.
Rationale: Audit Phase D item 18. Thirteen ad-hoc inline buttons across `MobileStaffPanel` (chip filters, Edit, Reactivate, Remove, Restore, Add Employee) and `MobileAdminDrawer` (7 drawer actions) had drift on sizes, paddings, and tonal color mappings. Primitive centralizes the mapping to THEME tokens and preserves the 44px mobile touch floor.
Confidence: H -- Playwright-smoked on prod ab1cb58 + b0851f8.

## 2026-04-18 -- AdaptiveModal primitive branches on useIsMobile
Decision: `src/components/AdaptiveModal.jsx` -- mobile (`window.innerWidth < 768`) renders via `MobileBottomSheet` (z-150, pill tap-to-close, 70vh scroll). Desktop renders centered overlay card (max-w-md default, max-h-85vh, flex column with scrollable body + sticky footer). Hot-resize via `useIsMobile` resize listener re-renders without remount -- verified mid-modal resize preserves internal state.
Props: `isOpen`, `onClose`, `children` required; `title`, `icon` (lucide) + `iconColor`, `headerGradient`, `maxWidth`, `headerExtra`, `footer`, `ariaLabel`, `bodyClassName`.
Rationale: Audit Phase D item 21. `OfferShiftModal`, `SwapShiftModal`, `RequestTimeOffModal` had no mobile-specific rendering -- all used a centered card pattern on small screens. Unifying them via `AdaptiveModal` gets them the bottom-sheet pattern JR already picked for `MobileStaffPanel`. The `footer` slot lands sticky on desktop and at sheet-bottom on mobile.
Confidence: H -- Playwright-smoked on prod e64838b + b0851f8, both viewports, all three modals. Empty states render correctly.
Revisit if: step-indicator in `SwapShiftModal` should move to `headerExtra` slot instead of body.

## 2026-04-18 -- MobileStaffPanel is a bottom-sheet, not a centered Modal
Decision: `src/panels/MobileStaffPanel.jsx` renders via `MobileBottomSheet` (imported directly from `./MobileEmployeeView`, not App re-export). Z-150 anchored to bottom. 44px min touch targets on chips + action buttons. Safe-area-inset-bottom applied to list padding and sticky Add button.
Rationale: Audit item #14. Z-hack to raise EmployeeFormModal above a centered staff modal was rejected in favor of a proper mobile pattern. Sheet conversion + later drawer-close + form-reopen-on-close combo yields correct stacking without z-games.
Confidence: H - JR phone-smoked on 7a13cab LIVE (2026-04-18)

## 2026-04-18 -- MobileAdminDrawer auto-closes on any action tap
Decision: `src/App.jsx:3233+` every drawer handler (`onOpenStaff`, `onOpenSettings`, `onOpenOwnRequests`, `onOpenPK`, `onOpenChangePassword`, `onExportPDF`, `onLogout`) first calls `setMobileAdminDrawerOpen(false)` before triggering its action.
Rationale: Drawer is z-200 (top of stack). Leaving it open blocked the z-150 staff sheet and z-100 form behind it; taps fell through to the drawer. Auto-close is standard mobile nav pattern and removes the stacking concern entirely.
Confidence: H - JR phone-confirmed 2026-04-18

## 2026-04-18 -- EmployeeFormModal reopens Staff bottom-sheet via ref+effect, not state flag
Decision: `src/App.jsx:1255+` uses `reopenStaffAfterFormRef = useRef(false)` set true in `onEdit`/`onAdd`, watched by `useEffect` on `empFormOpen`. When form closes, effect fires, flag clears, sheet reopens.
Rationale: Initial state-flag approach (`reopenStaffAfterForm` + inline onClose) did not reliably fire after the close-commit. Ref+effect decouples from setState batching and inline-closure timing.
Confidence: H - JR phone-confirmed "works" on 7a13cab (2026-04-18)

## 2026-04-18 -- save/delete/reactivate employee revert optimistic state on API failure
Decision: `saveEmployee`, `deleteEmployee`, `reactivateEmployee` capture `prevEmployees = employees` before the optimistic `setEmployees`. On `!result.success`, revert via `setEmployees(prevEmployees)`, return `false`. Also: `setEditingEmp(null)` only runs on success, so EmployeeFormModal stays labelled "Edit Employee" while user retries.
Rationale: Prior code showed error toast but kept the optimistic UI change, giving the user a false "it worked" signal. Also flipped modal title to "Add Employee" on save-failure retry. Both confirmed by JR phone-smoke.
Confidence: H - JR phone-confirmed revert behavior on 7a13cab (2026-04-18)

## 2026-04-18 -- THEME.action.recoverable and THEME.action.destructiveTonal tokens
Decision: `src/theme.js` adds `action: { recoverable: {bg, fg, border}, destructiveTonal: {bg, fg, border} }`. Recoverable = brand-blue tonal (OTR primary at 20%/40% + `#60A5FA` text). DestructiveTonal = status.error tonal.
Rationale: Restore-button color was inlined as hardcoded `rgba(4,83,163,0.20)` / `#60A5FA` in two panels. Token unifies the "recoverable administrative" affordance per DECISIONS 2026-04-18 Restore button tonal-blue + opacity restructure. Destructive tonal added for future unification of the Remove pattern.
Confidence: H - migrated in `MobileStaffPanel.jsx` + `InactiveEmployeesPanel.jsx` on f1a5397 (2026-04-18)

## 2026-04-18 -- MobileBottomSheet pill handle is tap-to-close (not drag-to-dismiss)
Decision: `src/MobileEmployeeView.jsx:610+` pill handle is wrapped in a 48x20 button that fires `onClose` on tap. Visual pill unchanged (40x4 rounded bar, muted at 40% alpha).
Rationale: Pill suggests drag-to-dismiss affordance. JR noticed the mismatch; drag-gesture is non-trivial and not currently needed. Tap-to-close matches the visual cue without adding gesture code. X-in-corner still works as secondary close.
Confidence: H - JR phone-confirmed (2026-04-18)

## 2026-04-18 -- Pull-to-refresh stays native; do NOT suppress overscroll-behavior
Decision: `src/index.css` carries no `overscroll-behavior` or `touch-action` lock on html/body/#root. Native Chrome pull-to-refresh stays enabled.
Rationale: Suppression was introduced then reverted same session (commits `e01c2e5` -> `ea4b81c`). JR confirmed the refresh prompt was not interfering with any intentional gesture; killing it removed useful behavior.
Confidence: H - reverted and re-confirmed 2026-04-18

## 2026-04-18 -- PDF greyscale redundant encoding for B&W break-room printer
Decision: `src/pdf/generate.js` encodes role/OT/holiday/announcement on a non-hue channel in addition to color. Role: letter-glyph prefix (`C:`, `B:`, `M:`, `W:`, `F:`) + per-role border style (solid/dashed/dotted, 2-3px). OT (>=44h): bold + trailing `*`. Near-OT (40-43h): bold. Holiday: heavy black top border + "HOL" caption. Announcement: italic body + `[!]` glyph + double top border.
Rationale: Break-room printer is B&W; hue-only encoding collapses into indistinguishable grey. Per `color.md` §8 "contrast > specific hue" + `applied-accessibility.md` §2 "make it right in black and white" + WCAG 1.4.1. Colors retained for color printers -- pure redundancy.
Confidence: H - shipped 2026-04-18, `npm run build` PASS

## 2026-04-18 -- PK default times branch on day-of-week
Decision: `src/utils/eventDefaults.js` exports `getPKDefaultTimes(dateInput)`. Saturday returns `{10:00, 10:45}` (pre-open briefing). Other days return `{18:00, 20:00}` (post-close training). Used by `ShiftEditorModal`, `PKEventModal`, and bulk-week autofill.
Rationale: Sarvi confirmed Saturday PK is always 10-10:45 pre-open. Hardcoded 18:00-20:00 was wrong 1 day of 7; friction compounded weekly.
Confidence: H - shipped 2026-04-18

## 2026-04-18 -- Employee `defaultSection` field added to schema
Decision: New column U `defaultSection` on Employees sheet (values `mens|womens|cashier|backupCashier|floorMonitor|none`, default `none`). Autofill's `createShiftFromAvailability` uses `employee.defaultSection || 'none'` instead of hardcoded `'none'`. UI surface in `EmployeeFormModal`. Backend via header-driven `getSheetData`/`appendRow` -- no row-mapper changes needed.
Rationale: Autofill was stamping `role:'none'` on every shift, forcing Sarvi to re-assign sections manually. System already knows the employee's usual section; sensible default reduces input work per `applied-component-patterns.md` SS 8.
Confidence: H - shipped 2026-04-18; backward-compatible (missing column falls back to 'none')
Revisit if: Sarvi wants per-day section override (e.g. backupCashier Mon/Tue, mens Wed-Sat).

## 2026-04-18 -- Bulk "Autofill PK Week" added as secondary toolbar button
Decision: New outline button "Autofill Wk N" next to "Schedule PK" in admin toolbar. Loops active week's 7 dates, computes eligible full-timers per day via `availabilityCoversWindow`, calls `bulkCreatePKEvent` sequentially. Day-of-week default times. Skips days with no eligible. Frontend-only loop; no backend change.
Rationale: Plan Item 3. Per-day PK entry was one button at a time; scheduler-friction fix. Secondary (outline) variant keeps it one notch below primary "Schedule PK" per button-hierarchy rule (`applied-component-patterns.md` SS 2).
Confidence: H - shipped 2026-04-18
Revisit if: Apps Script 7-8s/call floor makes the 7-sequence loop too slow (~50s) -- then add backend `bulkCreatePKEventWeek` for single round-trip.

## 2026-04-18 -- Former Staff with shifts removed from schedule grid entirely
Decision: `src/App.jsx` deletes the inline "Former Staff (History)" block inside the schedule grid. Deleted employees no longer appear on the schedule view even if they hold shifts in the displayed period. Backend records + shift rows preserved for audit/payroll. Restore via Manage Staff > Restore.
Rationale: Sarvi feedback 2026-04-18. Per `visual-hierarchy.md` §6 squint test -- former staff intermixed with current roster is a false signal. Records stay; visibility doesn't.
Confidence: H - shipped 2026-04-18
Note: `deletedWithShifts` useMemo at App.jsx:1845 is now dead code; flagged for future cleanup.

## 2026-04-18 -- Restore button tonal-blue + opacity restructure
Decision: `src/panels/InactiveEmployeesPanel.jsx` -- opacity-60 moved from parent row to the identity region only (avatar + name). Restore button skinned as tonal brand-blue `rgba(4, 83, 163, 0.20)` bg + `#60A5FA` text + `rgba(4, 83, 163, 0.40)` border. Full opacity so it reads as clickable.
Rationale: Previous button inherited parent opacity (reads "disabled" per `applied-dark-theme.md` SS 4) AND used disabled-coded token pair (`bg.elevated` + `text.secondary`). Per `applied-accessibility.md` §1 disabled vs enabled must differ by >=3:1 contrast, not opacity alone. Tonal blue signals "recoverable administrative" (not green "go", not red "danger").
Confidence: H - shipped 2026-04-18

## 2026-04-18 -- Hidden from Schedule section collapsed by default
Decision: `src/App.jsx:3683+` wrap "Hidden from Schedule" in existing `CollapsibleSection` component with `defaultOpen={false}` and a count badge.
Rationale: Tertiary info (admins-not-on-schedule, inactive) was competing with primary grid for attention. Per `visual-hierarchy.md` SS 2 three-levels-max + `applied-component-patterns.md` SS 7 progressive disclosure. Reuses existing component, zero new infra.
Confidence: H - shipped 2026-04-18

## 2026-04-17 -- Project memory migrated to CONTEXT/* with thin adapters
Decision: Canonical mutable memory lives in `CONTEXT/TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `LESSONS.md`. Adapters `CLAUDE.md` + `.cursor/rules/context-system.mdc` stay thin (under 150 lines) and route to CONTEXT/*. Legacy `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, `docs/handoffs/`, `docs/audits/`, `.claude/rules/conventions.md` deleted. Reference docs retained at `docs/schemas/`, `docs/research/`, `docs/DEPLOY-S36-AUTH.md`.
Rationale: Standardizes memory ownership across Claude + Cursor harnesses; decouples canonical state from adapters; ASCII-only telegraphic style preserves meaning while shrinking token footprint. Recovery backup at `.migration-recovery/2026-04-17-0043/` (gitignored).
Confidence: H - migration verified 2026-04-17: sweep clean, ASCII audit clean, both adapters under 150 lines, all canonical files carry SCHEMA headers.

## 2026-04-14 -- PDF Contact Admin filter to PRIMARY_CONTACT_EMAIL
Decision: src/pdf/generate.js narrows adminContacts to Sarvi via new PRIMARY_CONTACT_EMAIL constant; falls back to active non-owner admins if Sarvi row missing.
Rationale: Employees should see one point of contact, not a list; matches backend CONFIG.ADMIN_EMAIL.
Confidence: H - S65 ship verified `4477325`, non-ASCII audit cleared

## 2026-04-14 -- PK bulk modal auto-check by availability-window overlap
Decision: PKEventModal auto-checks employees whose availability window encloses the PK window; others greyed with reason, admin can override.
Rationale: Time-window match flags real conflicts before they happen; soft exclusion preserves admin agency.
Confidence: H - S63 browser-verified round-trip with Alex Fowler

## 2026-04-14 -- Autofill toolbar collapsed 4 -> 3 controls via dropdown top option
Decision: Auto-Fill dropdown + Clear dropdown + Schedule PK button; each dropdown's top option "All Full-Timers" triggers bulk via `value === '__all__'` branch.
Rationale: Fewer controls; consistent interaction pattern; bold + optgroup separator gives hierarchy.
Confidence: H - shipped S63

## 2026-04-14 -- Meetings + PK: split-maps over nested-array
Decision: `shifts[key]` stays work-only; new parallel `events[key]` array map for meeting/pk; backend 3-tuple key `${empId}-${date}-${type}`.
Rationale: 25+ call sites treat shifts[key] as scalar; nested would require migrating all. Split-maps is zero-touch on hot path.
Confidence: H - S61 shipped Stages 1-9, 2026-04-14
Revisit if: 3rd or 4th orthogonal entry type added (then reconsider composite key).

## 2026-04-14 -- Offers + swaps blocked for non-work shift types
Decision: Only `type='work'` is transferable. Frontend filters + backend `INVALID_SHIFT_TYPE` rejection.
Rationale: Meetings/PK are mandatory admin-scheduled commitments; delegation is nonsensical.
Confidence: H - shipped S61 + S64

## 2026-04-14 -- Hours: union-count overlaps across work + meeting + pk
Decision: `computeDayUnionHours` merges intervals then sums; fast-path uses stored `shift.hours` when no events present.
Rationale: ESA 44hr is "worked" time; overlapping paid time must not double-count. Matches payroll treatment.
Confidence: H - shipped S61

## 2026-04-14 -- Meeting + PK skip 5-consecutive-days streak
Decision: Consecutive-days warning counts only `type='work'` days.
Rationale: ESA consecutive-days rule is about shop-floor fatigue; training does not carry same load.
Confidence: H - shipped Stage 8 informational banner

## 2026-04-14 -- Swap/Offer cutoff is "tomorrow midnight"
Decision: SwapShiftModal + OfferShiftModal filter eligibility to `shiftDate >= tomorrow midnight`.
Rationale: Matches user mental model of "tomorrow"; admin gates short-notice approvals server-side.
Confidence: H - shipped S60

## 2026-04-14 -- Defensive availability parse at login handler
Decision: App.jsx handleLogin (line 1408) wraps `user.availability` JSON parse in try/catch with empty-string short-circuit.
Rationale: Same class as S50 getAllData bug; empty Sheet field -> `JSON.parse('')` throws -> stuck spinner. Inline fix is smallest safe diff.
Confidence: H - S52 shipped `ff54544`, browser-verified

## 2026-04-14 -- Defensive `ensureFullWeek()` for availability in getAllData
Decision: Always returns fully-populated 7-day object overlaying parsed data on DEFAULT_AVAILABILITY. Empty/malformed/null all resolve to complete shape.
Rationale: Enforces shape at one boundary; downstream readers can trust `employee.availability[day].available`.
Confidence: H - S50 shipped `7f3021c`, demo-critical bug cleared

## 2026-04-13 -- Save path: batchUpdate-only; adaptive fast path rejected
Decision: `batchSaveShifts` uses single `Sheets.Spreadsheets.Values.update` rewriting whole Shifts range; USER_ENTERED input; LockService.tryLock(10000) with CONCURRENT_EDIT error code.
Rationale: Playwright measured Apps Script floor ~7-8s/request; per-row optimization drowned out by per-call overhead.
Confidence: H - measured 2026-04-13

## 2026-04-13 -- CF Worker proxy as next structural step (post-demo)
Decision: Worker proxies frontend -> Apps Script, SWR cache on `getAllData` via Workers KV (60s TTL). Writes pass through uncached. Flip `API_URL` to enable/disable.
Rationale: Only path to sub-5s login while Apps Script remains. Free tier covers ~5k req/day usage.
Confidence: M - design complete, not yet implemented
Revisit if: Real-time push or audit log becomes hard requirement -> jump to Supabase.

## 2026-04-13 -- Welcome sweep as top-level fragment-child-0 overlay
Decision: Welcome sweep rendered first child of each post-login return fragment; plays 900ms independently via position:fixed + z-index 200. Removed 1000ms `minDelay` in handleLogin.
Rationale: Fragment-child-0 stability lets React keep DOM node across branch swaps; min-delay was floor not ceiling.
Confidence: H - S45 browser-verified

## 2026-04-13 -- PROJECT-ROUTING retired for RAINBOW
Decision: Deleted `docs/PROJECT-ROUTING.md`; removed RAINBOW row from `~/APPS/BridgingFiles/ROUTING-MASTER.md`; gated handoff command Step 3c to "file exists only".
Rationale: RAINBOW has no cross-project flow; file was dead weight.
Confidence: H - verified S45

## 2026-04-12 -- Backend callerEmail derived from `auth.employee.email`
Decision: Every protected Code.gs handler derives `callerEmail` from `auth.employee.email` after verifyAuth, not from payload. Code.gs v2.16.
Rationale: Token is authoritative; payload-sourced callerEmail was attacker-controlled post-S37.
Confidence: H - shipped S41.1, requires Apps Script manual deploy (done)

## 2026-04-12 -- HMAC session tokens + salted SHA-256 passwords (S36)
Decision: Login issues `base64url(payload).base64url(HMAC_SHA_256(payload, HMAC_SECRET))` with 12h TTL. Passwords stored as `base64url(SHA_256(uuidSalt + password))`. Dual-check on login migrates plaintext -> hash.
Rationale: Eliminates trust-the-client; stateless; no per-request sheet write. SHA-256 native to Apps Script via Utilities.computeDigest.
Confidence: H - deployed v2.13+, HMAC_SECRET Script Property set

## 2026-04-12 -- Payroll aggregator = path 1 (bridge, not replacement)
Decision: Post-demo, Rainbow ingests Counterpoint actuals, renders reconciliation + OT flags, admin enters bonuses, Rainbow emits ADP-ready export. Counterpoint + ADP stay as-is.
Rationale: Additive (nothing breaks), reuses existing knowledge; full replacement/full API is v2.
Confidence: L - pending demo go-ahead + Sarvi discovery answers

## 2026-04-12 -- S39.4 mobile admin extraction deferred
Decision: `if (isMobileAdmin)` branch in App.jsx stays inline; S39.4 defer post-demo.
Rationale: Conflicts with 2026-02-10 "mobile admin as if-branch" decision; no context provider yet.
Confidence: H - plan file flagged, skipped correctly

## 2026-04-12 -- Email body plaintext via MailApp (not HTML)
Decision: `buildEmailContent` returns plaintext; MailApp.sendEmail sends without `htmlBody`. XSS escape applied only to 5 PDF HTML sites.
Rationale: Plaintext not an HTML XSS vector; escaping there would render `&amp;` literally.
Confidence: H

## 2026-04-12 -- PDF + email builders extracted with circular imports
Decision: `generateSchedulePDF` -> src/pdf/generate.js; `buildEmailContent` -> src/email/build.js; shared helpers -> src/utils/format.js. New modules import constants from `../App`; circle works because refs resolve at call-time.
Rationale: ESM live bindings allow circles when all uses are inside function bodies. App.jsx shrank 262 lines.
Confidence: H - build + smoke clean
Revisit if: Module-eval-time use of these constants introduced -> breaks circle.

## 2026-04-12 -- Chunked-save partial failure = hard failure
Decision: `chunkedBatchSave` returns `success:false` with `{savedCount, totalChunks, failedChunks}` if any chunk fails.
Rationale: Two success tiers is footgun; callers need simple retry semantics.
Confidence: H

## 2026-04-12 -- Schedule toolbar hides on non-schedule destinations (mobile admin)
Decision: Mobile admin Row-3 action buttons + Row-4 status banner only render when `mobileAdminTab === 'schedule' || 'mine'`.
Rationale: Toolbar belongs to its destination; matches Wk1/Wk2/Mine filing-tab pattern.
Confidence: H

## 2026-04-12 -- Perf: ROLES_BY_ID + toDateKey + React.memo on grid cells
Decision: O(1) ROLES_BY_ID map; `toDateKey(date)` no-alloc helper; React.memo on ScheduleCell/EmployeeRow/EmployeeViewRow/EmployeeScheduleCell; useCallback on grid handlers; useMemo for date strings.
Rationale: 280 cells re-rendering on every state change because inline arrow handlers kept new refs. Stable refs + memo eliminates churn.
Confidence: H

## 2026-04-12 -- Card shadows use accent-color halos
Decision: `THEME.shadow.card` / `cardSm` are rotating-accent halos; dark `rgba(0,0,0,0.6)` drop component removed.
Rationale: Dark drop-shadows invisible on navy per `docs/research/dark-mode-guidelines.md`. Accent halos reinforce OTR rotation identity.
Confidence: H

## 2026-04-12 -- Mobile bottom nav active state from modal/drawer state
Decision: `activeTab` computed from which modal/drawer is open (e.g. `mobileMenuOpen ? 'more' : ...`).
Rationale: No duplicate state; tapping tab opens the relevant modal; closing returns to 'schedule' automatically.
Confidence: H

## 2026-04-12 -- Admin desktop header: 4 actions + avatar dropdown
Decision: Export PDF, Publish, My Requests visible; avatar dropdown holds Add Employee, Manage Staff, Admin Settings, Sign Out.
Rationale: Sarvi daily actions one click away; low-freq account actions behind dropdown; preserves OTR rotating-accent ring.
Confidence: H - S42

## 2026-04-12 -- Welcome sweep on login (full-screen 5-stripe rainbow)
Decision: 900ms cubic-bezier translateX sweep across 5 OTR accent stripes; respects prefers-reduced-motion.
Rationale: Store is literally "Over the Rainbow"; color sweep is the brand door chime.
Confidence: H - Sarvi approved

## 2026-04-12 -- Publish button: hardcoded white text, not auto-contrast
Decision: TooltipButton variant="primary" uses hardcoded `color: '#FFFFFF'` over rotating accent gradient.
Rationale: JR chose visual consistency over WCAG AA on green rotation (3.1:1); documented trade-off.
Confidence: H
Revisit if: Accessibility audit flags or Sarvi reports green-day readability issues.

## 2026-04-12 -- AnimatedNumber supports decimal precision
Decision: Accepts `decimals`, `suffix`, `overtimeThreshold` props. Hours display "12.5h" not "13".
Rationale: Hours in this app are .5-precision; rounding broke display.
Confidence: H

## 2026-04-12 -- WCAG contrast via proper calculation
Decision: Replace simple luminance `0.299r + 0.587g + 0.114b` with WCAG relative luminance + contrast ratio; pick white vs navy per accent.
Rationale: Green 0.421 and Red 0.410 too close for threshold; proper calc auto-adapts to any future accent.
Confidence: H

## 2026-04-11 -- OTR dark navy + rotating rainbow accents
Decision: `#0D0E22` page bg; white content cards; 5 OTR brand colors cycle via localStorage index; role colors mapped to OTR palette (non-rotating).
Rationale: Dark matches store aesthetic (stone/copper/wood); rotating embodies "Over the Rainbow".
Confidence: H

## 2026-04-11 -- OTR accent colors immutable
Decision: 5 accents fixed: Red `#EC3228`, Blue `#0453A3`, Orange `#F57F20`, Green `#00A84D`, Purple `#932378`. Other colors adapt around them.
Rationale: Literal brand colors from OTR bags/tags/signage.
Confidence: H

## 2026-02-10 -- Mobile admin as if-branch in App.jsx
Decision: `if (isMobileAdmin)` branch inline; not a separate component.
Rationale: 30+ state pieces avoid prop drilling without adding state library.
Confidence: H
Revisit if: State library adopted or admin state refactored into React Context.

## 2026-02-10 -- Desktop-only features excluded from mobile admin
Decision: Employee mgmt, per-employee auto-populate, PDF export excluded from mobile admin.
Rationale: Infrequent tasks; complexity unjustified.
Confidence: H
Revisit if: Sarvi requests mobile or mobile becomes primary admin device.

## 2026-02-10 -- GET-with-params over POST
Decision: All API via `GET ?action=NAME&payload=JSON` through `apiCall(action, payload)`.
Rationale: Apps Script POST returns HTML redirect (not JSON) causing CORS/parsing failures.
Confidence: H

## 2026-02-10 -- Chunked batch save (15-shift groups)
Decision: Large saves split into 15-shift chunks.
Rationale: Apps Script GET URL ~8KB limit; chunk size leaves headroom for long names.
Confidence: H
Revisit if: Backend migrates off Apps Script GET, or POST becomes reliable.

## Superseded

## 2026-04-13 -- Pitch deck decisions (deck finalized S65) (Superseded by completion)
Decision: Multiple pitch-related decisions (slide 1-5 layouts, pricing structure, footers, Phase 2 folding, cost-of-doing-nothing framing, 4-card Slide 4, Build Investment Fee, IP retention, typography baseline, photo system) shipped during S46-S65.
Rationale: Pitch deck lives in sibling project `~/APPS/RAINBOW-PITCH/`; 2026-04-15 demo marked these decisions done.
Confidence: H - deck finalized per JR S65

## Rejected

- jsPDF font subset / jsPDF emoji cleanup -- PDF uses HTML + browser print, not jsPDF; jsPDF entries stale.
- batchGet via Sheets.Spreadsheets.Values -- FORMATTED_VALUE returns booleans as strings; SERIAL_NUMBER needs hardcoded column list. Maintenance debt; reverted in v2.19/v2.19.1.
- Adaptive per-row fast path on batchSaveShifts -- Apps Script ~7-8s floor dominates; reverted.
- Tonight-shippable login wins (loginWithData combined endpoint, CacheService pre-warm) -- redundant once CF Worker ships.

<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H - [verification source and date]
(or Confidence: M)
(or Confidence: L - [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
