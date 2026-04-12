# Tasks — Phase 6 (started 2026-02-10)

<!-- Protocol: ~/.claude/rules/todo.md -->

### In Progress
- Demo prep + post-demo cleanup (Phases 1-10 core landed)

### Up Next

**Active plan:** `~/.claude/plans/lovely-launching-marble.md` — audit-driven security + bugfix + refactor chunked into S33.5 → S40.

Pre-demo (before 2026-04-14):
- S33.5 repo hygiene (.gitignore dist/, commit package-lock.json, Photos/ decision) — deferred, JR requested S34 first
- S35 browser verify live + demo polish

Manual deploy steps (required before post-demo security code runs in prod):
- Add `passwordHash` + `passwordSalt` columns (R + S) to Employees sheet
- Set `HMAC_SECRET` (32 random bytes base64) in Apps Script > Project Settings > Script Properties
- Paste backend/Code.gs v2.13 into Apps Script editor + Deploy > New Deployment (replace current active URL or keep URL via "Manage Deployments > Edit")

Post-demo (code landed; awaits manual deploy above):
- S39.3c AdminShiftOffersPanel → `src/panels/` (carries 2 reject-flow modals)
- S39.3d AdminShiftSwapsPanel → `src/panels/` (carries 2 reject-flow modals)
- S39.4 DEFERRED: mobile admin branch extraction conflicts with decisions.md 2026-02-10. Unblocks only after admin state moves to a Context provider. See 2026-04-12 decision entry.
- S40 persistence-file sweep + forward handoff

Post-demo payroll aggregator (path 1, pending demo go-ahead):
- Discovery (JR emailing Sarvi): Counterpoint export format? ADP upload format? Employee ID consistency across 3 systems? Bonus logic (formulaic vs ad-hoc)?
- Feature: pay-period reconciliation view (scheduled vs actual, PTO lines, OT flags at ESA 40/44hr)
- Feature: bonus entry UI per employee per period
- Feature: ADP-ready export (format TBD from discovery)
- Counterpoint actuals ingestion (format TBD from discovery)

Existing up-next preserved:
- Post-demo: revisit density toggle CSS scope — broad `.density-compact .grid` selector may catch unintended grids
- Post-demo: evaluate mobile bottom nav active states on deep-linked URLs if introduced
- Code.gs deploy (manual - paste updated Code.gs to Apps Script) — required for S36
- Professional sender email (dedicated Google Workspace account)

### Done

- [2026-04-12] S39.3b Extract `AdminMyTimeOffPanel` → `src/panels/AdminMyTimeOffPanel.jsx`. Exported `CollapsibleSection` from App.jsx so panel can import it (circular-safe: referenced inside function body only). App.jsx 8436 → 8282 (-154). Build PASS, preview 200.
- [2026-04-12] S39.3a Extract `AdminTimeOffPanel` → `src/panels/AdminTimeOffPanel.jsx` (carries Deny + Revoke reject modals). `REQUEST_STATUS_COLORS` moved to `src/constants.js` (imports THEME). App.jsx 8736 → 8436 (-300). Build PASS.
- [2026-04-12] S39.2 Extract `AdminRequestModal` → `src/modals/AdminRequestModal.jsx`. Thin wrapper: `MobileBottomSheet` on mobile, centered modal on desktop. 6 reject-flow modals still inline inside their panels (move with S39.3). App.jsx 8757 → 8736 (-21). Build PASS.
- [2026-04-12] S39.1 Extract THEME + TYPE + OTR to `src/theme.js`, ROLES + ROLES_BY_ID to `src/constants.js`. App.jsx 8839 → 8757 (-82). App.jsx re-exports THEME/TYPE/ROLES/ROLES_BY_ID for backward compat with consumers that import from `./App` (mobile views, pdf/generate, email/build). Module-init side effects (localStorage accent rotation, CSS var writes on `<html>`) preserved in theme.js. Build PASS, `vite preview` 200.
- [2026-04-12] S38 mobile bottom sheet a11y: `MobileBottomSheet` now wires `useFocusTrap(dialogRef, isOpen)` so Tab cycles inside the sheet and Escape fires `[data-close]` → onClose. Ref + hook declared before the early-return so hook order stays stable across open/close toggles. `useFocusTrap` imported from `./App` (no new module needed — existing hook already handled both cases).
- [2026-04-12] S37 frontend auth wiring (post-demo track): new `src/auth.js` owns the module-level session token + cached user + auth-failure callback. `apiCall` auto-attaches `token` on every request and wipes state on `AUTH_EXPIRED`/`AUTH_INVALID`. Login stores `{ token, employee }` in localStorage; App mounts restored-signed-in if both survived the refresh (first protected call re-validates). 34 `callerEmail: currentUser.email,` sites removed from App.jsx; `loadDataFromBackend` now calls `apiCall('getAllData', {})`. All 3 logout sites call `clearAuth()`. `chunkedBatchSave` reads `token` from payload (apiCall already injected it) and conditionally forwards legacy `callerEmail` for back-compat.
- [2026-04-12] S36 HMAC auth rebuild backend (post-demo track, BLOCKED on JR deploy + `HMAC_SECRET` provisioning): Code.gs v2.13 adds `createToken_`/`verifyToken_` using `Utilities.computeHmacSignature(HMAC_SHA_256)` with 12h TTL + constant-time comparison; adds `hashPassword_`/`generateSalt_` for per-user salted SHA-256. `verifyAuth` now accepts the full payload (prefers `token`, falls back to `callerEmail` during S37 rollout). `login` dual-checks hash → plaintext, migrates plaintext → hash on successful login, returns token. `changePassword` writes hash + clears plaintext column. `resetPassword` keeps plaintext fallback (admin UI displays it) and clears hash so next login re-migrates. Sheet schema gains `passwordHash` + `passwordSalt` columns (R + S) — JR must add to live sheet before deploy.
- [2026-04-12] S34 demo-critical bugs (single commit): `parseLocalDate(str)` helper eliminates Ontario TZ shift (fix @ App.jsx:2265, 42 other `+ 'T12:00:00'` sites swept to the helper). `escapeHtml` applied at 5 PDF HTML interpolation sites (announcement subject/message, shift.task, emp.name, admin contacts). PDF + email builders extracted to `src/pdf/generate.js` + `src/email/build.js`; shared helpers to `src/utils/format.js` (App.jsx -262 lines). `chunkedBatchSave` now returns `success:false` with `{savedCount, totalChunks, failedChunks}` when any chunk fails; both callers surface "X of Y batches saved" toast and retain unsaved flag. Email body kept unescaped (plaintext via `MailApp.sendEmail({body})` — not an HTML XSS vector).
- [2026-04-12] PDF demo-critical six: "Printed on" timestamp footer + live-app URL pointer. Removed auto-print; added sticky Print button in preview. `OFF — approved` marker on PTO cells (new timeOffRequests param + `hasApprovedTimeOffForDate` check). OT thresholds shifted to Ontario ESA (amber ≥40h, red ≥44h). Daily headcount row per week. `page-break-inside:avoid` on rows + `thead` repeats on page break. Role/color fallbacks for deleted role IDs. Hides "0.0h" for unscheduled employees. Legend gains PTO swatch.
- [2026-04-12] Mobile admin toolbar hides on non-schedule destinations: Row-3 action buttons (Edit/Save/Go Live/Publish) + Row-4 status banner (Edit Mode + Fill/Clear Wk) gated on `mobileAdminTab === 'schedule' || 'mine'`. Requests/Comms destinations show just logo + period nav. Matches existing filing-tab gating pattern.
- [2026-04-12] PDF export printer-friendly pass: scheduled cells now render as 2.5px role-colored outlines on white (was filled tint), thicker than 1px grid for distinctiveness. Header gradient → solid OTR navy. Title border + announcement accent → OTR purple #932378. Hours color under-35h cyan → slate (prints cleaner).
- [2026-04-12] S33 hotfix: `stoDateKey(d)` typo at App.jsx:6451 was white-screening prod. Fixed to `toDateKey(sd)`.
- [2026-04-12] Phase 10 extension: Admin quick approve/deny bottom sheets. `AdminRequestModal` helper renders `MobileBottomSheet` on mobile and centered modal on desktop. All 6 admin/recipient reject-flow modals migrated (time-off deny/revoke, offer reject, take-my-shift decline, swap decline, swap reject). Bundle -4.3KB from dedup.
- [2026-04-12] Perf pass: `ROLES_BY_ID` O(1) lookup map + `toDateKey(date)` helper replace `.toISOString().split('T')[0]` in ~40 hot-path call sites; `React.memo` on `ScheduleCell`, `EmployeeRow`, `EmployeeViewRow`, `EmployeeScheduleCell`; `useCallback` on `handleCellClick`, `handleEditEmployee`, `handleShowTooltip`, `handleHideTooltip`, `getEmpHours`, `getPeriodHours`, `getScheduledCount`; `useMemo` for `currentDateStrs`, `allDateStrs`, `todayStr`; dropped `JSON.stringify` equality check in `handleTargetChange`. Build still passes.
- [2026-04-12] UX Phase 10 (minimal): Employee shift detail bottom sheet. Tapping a shift in MobileScheduleGrid opens `MobileBottomSheet` with role, time, hours, task. Admin-side quick approve/deny sheets deferred post-demo.
- [2026-04-12] Mobile header prune (redundancy cleanup): dropped hamburger + bell from mobile employee header; dropped hamburger + Requests/Comms filing tabs from mobile admin header. Bottom nav owns those destinations. Filing tabs (Wk1/Wk2/Mine) only render when on schedule/mine destination.
- [2026-04-12] UX Phase 9: Density toggle (admin desktop) — `adminDensity` state with localStorage persistence, two-icon pill toggle near Settings button, CSS rules in `.density-compact` shrink cell padding + text inside `.grid`
- [2026-04-12] UX Phase 3 deferred: aria-live wired in `showToast` (writes to `#status-announcer`); haptic on `toggleEditMode`/`saveSchedule`/Publish button; row hover via `.schedule-row::after` overlay on EmployeeRow + EmployeeViewRow; input typography text-xs→text-sm (8 input strings + 5 select strings); spacing normalization N/A (no inline gap/padding values in codebase)
- [2026-04-12] UX Phase 4: `MobileBottomNav` + `MobileBottomSheet` exported from `MobileEmployeeView.jsx` (44px touch targets, env safe-area, accent-aware active state, badge dot)
- [2026-04-12] UX Phase 5: `MobileAdminBottomNav` exported from `MobileAdminView.jsx` (4-tab Schedule|Requests|Comms|More with pendingCount badge)
- [2026-04-12] UX Phase 6: Bottom navs wired into App.jsx mobile employee + admin views; `pb-20` clearance added to main; activeTab derived from existing modal/drawer state
- [2026-04-12] UX Phase 7: `AnimatedNumber` rebuilt with `decimals` + `suffix` + `overtimeThreshold` props; wired into shift editor SHIFT/PERIOD displays, EmployeeRow hours, EmployeeViewRow hours, admin column scheduled count
- [2026-04-12] UX Phase 8: `StaffingBar` wired below scheduled/target text in admin desktop column headers (4px height, color-coded by % to target)
- [2026-04-12] Shadow rework: `THEME.shadow.card` and `THEME.shadow.cardSm` switched from dark drop-shadow to accent-color halo (research/dark-mode-guidelines.md: "Shadows are nearly invisible against dark backgrounds")
- [2026-04-12] UX Phase 1: CSS foundation (focus rings, modal transitions + glassmorphism, reduced motion, skeleton shimmer, scroll indicator, ambient glow, bottom sheet, scroll-driven animations, sr-only)
- [2026-04-12] UX Phase 2: THEME object (WCAG contrast calc, desaturated status colors, color temperature, --accent-color CSS var, TYPE scale with clamp)
- [2026-04-12] UX Phase 3 core: focus trap hook, haptic util, AnimatedNumber, StaffingBar, ScheduleSkeleton components; all 12 modals get role="dialog" + aria-modal + aria-label + modal-backdrop/content transitions + 44px touch targets; period nav + month nav touch targets bumped; rainbow sphere replaced with ScheduleSkeleton on main loading; skip-to-content link added (employee + admin desktop); aria-live #status-announcer region added; ambient-pending class wired on admin header
- [2026-04-11] UI/UX research + app audit + improvement proposals (session 29)
- [2026-04-11] Research files saved to docs/research/ (4 files: first principles, dark mode, scheduling UX, 2025 trends)
- [2026-04-11] Audit bug fixes: saveLivePeriods error handling, JSON.parse try-catch, null checks in approval flows, sendEmail return value
- [2026-04-11] Console.log cleanup (30+ statements removed from production)
- [2026-04-11] Mobile UX: touch targets, announcement max-height, grid text size, drawer width
- [2026-04-11] React key fixes (7 index-based keys replaced with meaningful composites)
- [2026-04-11] Go Live confirmation dialog added
- [2026-04-11] OTR rebrand: dark navy bg, rotating 5-color accent system, OTR role colors, accent borders/shadows, rainbow sphere loader
- [2026-02-10] Admin rejection modals for swap/offer (optional reason, shown on settled items)
- [2026-02-10] Sort toggles (newest/oldest) on all 10 shift change history panels
- [2026-02-10] Uniform tab labels: "Needs Approval" → "Pending" on offers/swaps admin panels
- [2026-02-10] Uniform empty states across all admin request panels
- [2026-02-10] Compact empty state styling (removed oversized icons/double padding)
- [2026-02-10] Mobile admin auto-populate: Auto-Fill/Clear in edit mode banner
- [2026-02-10] Desktop auto-fill → per-week (was both weeks)
- [2026-02-10] AdminTimeOffPanel double border fixed
- [2026-02-10] Feature parity: Admin Settings on mobile drawer, notification badge on desktop employee

### Blocked
- Email upgrade (PDF auto-attached via MailApp) → blocked on JR providing sender email address
