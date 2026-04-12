# Tasks — Phase 6 (started 2026-02-10)

<!-- Protocol: ~/.claude/rules/todo.md -->

### In Progress
- OTR rebrand visual QA (JR reviewing in morning, may need color/shadow adjustments)

### Up Next
- Push to Vercel for live demo review
- Code.gs deploy (manual - paste updated Code.gs to Apps Script)
- Shared utils refactor (extract THEME, ROLES, helpers into dedicated files)
- Professional sender email (dedicated Google Workspace account)

### Done
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
