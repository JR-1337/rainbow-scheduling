# Tasks — Phase 6 (started 2026-02-10)

<!-- Protocol: ~/.claude/rules/todo.md -->

### In Progress
- Demo prep + post-demo cleanup (Phases 1-10 core landed)

### Up Next
- Post-demo: revisit density toggle CSS scope — currently broad `.density-compact .grid` selector may catch unintended grids
- Post-demo: evaluate mobile bottom nav active states on deep-linked URLs if introduced
- Code.gs deploy (manual - paste updated Code.gs to Apps Script)
- Shared utils refactor (extract THEME, ROLES, helpers into dedicated files)
- Professional sender email (dedicated Google Workspace account)

### Done

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
