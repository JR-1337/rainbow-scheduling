# Tasks — Phase 6 (started 2026-02-10)

<!-- Protocol: ~/.claude/rules/todo.md -->

### In Progress
- UX overhaul: Phase 3 (deferred items) + Phases 4-10 (plan at `~/.claude/plans/unified-soaring-gray.md`)

### Up Next
- Phase 3 deferred: haptic wire-up on save/GoLive/publish, row hover on EmployeeRow/EmployeeViewRow, aria-live status message handler wiring, broader typography sweep (form inputs, badges, cells), spacing normalization
- Phase 4: MobileEmployeeView (bottom tab bar, bottom sheet, typography, touch targets)
- Phase 5: MobileAdminView (bottom tab bar, bottom sheet, typography, touch targets)
- Phase 6: App.jsx mobile integration (wire bottom tabs, move header tabs to bottom)
- Phase 7: Kinetic numbers wiring (projected hours in editor, total hours in row, column counts)
- Phase 8: Staffing progress bars wiring (admin/employee column headers, mobile grid day headers)
- Phase 9: Density toggle (adminDensity state, toggle button, conditional cell heights/fonts)
- Phase 10: Mobile bottom sheets (shift detail, quick approve/deny, time off details)
- Code.gs deploy (manual - paste updated Code.gs to Apps Script)
- Shared utils refactor (extract THEME, ROLES, helpers into dedicated files)
- Professional sender email (dedicated Google Workspace account)

### Done

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
