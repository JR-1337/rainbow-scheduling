# Scheduling App UX Patterns

Competitor analysis + industry patterns. Sources: When I Work, Deputy, Homebase, 7shifts, Sling, NNGroup, Behance/Dribbble case studies. April 2026.

---

## Calendar/Grid Patterns

**Multi-view system (industry standard):**
- Monthly calendar for overview
- Weekly grid for detailed scheduling (dominant view)
- Daily timeline for hour-by-hour detail
- Toggle between views quickly

**Grid structure:**
- Employee names as rows, dates as columns
- Card-based shifts inside grid cells
- Color-coding by role or shift type
- Drag-and-drop for reassignment (admin)

**Headers:**
- Sticky headers (dates visible during vertical scroll)
- Frozen first column (employee names visible during horizontal scroll)
- Both critical for 20+ employee teams

**Row height:** 48-52px comfortable, 36-40px dense (offer toggle)

## Shift Display

- Role abbreviation or icon (always visible, not color-only)
- Time range (compact: 9a-5p format)
- Hours worked
- Optional indicators: task, notes, overtime warning
- Background: role color at low opacity (25%), border at medium opacity (50%)

## Status Color Conventions (Widely Adopted)

| Status | Color (light mode) | Color (dark mode, desaturated) |
|--------|-------------------|-------------------------------|
| On schedule / Approved | Green #22C55E | #48BB78 |
| Pending / Review needed | Yellow #EAB308 | #FDB022 |
| Conflict / Denied | Red #EF4444 | #FC8181 |
| Warning / Understaffing | Orange #F97316 | #FB923C |
| Completed / Past | Blue #3B82F6 | #60A5FA |
| Disabled / Inactive | Gray #9CA3AF | #9CA3AF at 50% opacity |

Always use color + icon (not color alone). 8% of males are colorblind.

## Conflict & Alert Patterns

**Types detected automatically:**
- Schedule overlaps (same employee, overlapping times)
- Availability conflicts
- Time-off request conflicts
- Labor law violations (overtime, break requirements)
- Skill/role coverage gaps
- Understaffing per shift

**Visual indicators:**
- Inline: red border/outline on conflicting cell
- Header: warning icon + count in column header
- Sidebar: prioritized alert list
- Real-time validation: prevent invalid before save

**Smart patterns from leading apps:**
- Real-time validation as shifts are added
- Predictive alerts (identify issues weeks ahead)
- Context-aware notifications (adjust by user role)

## Request Management Flows

**Time off:** Employee submits (date + reason) -> pending state shown -> admin approves/denies -> notification sent -> schedule updates

**Shift swap:** Employee selects shift -> targets coworker (or open offer) -> system checks availability -> recipient accepts/declines -> admin approves -> both schedules update

**Best practices:**
- One-tap access from employee dashboard
- Clear visual states: pending, approved, denied, expired, cancelled
- Mobile-optimized (bottom sheets for actions)
- Confirmation for destructive actions only
- 2-3 steps max for any request

## Admin vs Employee View

**Employee (read-only + limited actions):**
- "My Shifts" default view (1-2 weeks ahead)
- Actions: request time off, swap shifts, update availability, pick up open shifts
- No access to labor costs, compliance reports, or other employees' details
- Simplified, card-based, mobile-first
- Quick schedule checks (10-second visit)

**Admin (full control):**
- Full team view (4+ week horizon)
- Drag-and-drop scheduling
- Color-coded by role, status, shift type
- Labor cost + overtime monitoring
- Request approval queue
- Export/report generation
- Denser layout (more data visible)

## Navigation Patterns

**Mobile employee:** Bottom tab bar (Schedule | Requests | Alerts | Profile). 3-5 items in thumb zone. 60% one-handed operation.

**Mobile admin:** Bottom bar for primary + hamburger/drawer for secondary/settings.

**Desktop:** Sidebar or top nav. Period selector prominent. Tab switching for week views.

**Critical:** Hamburger menus reduce discoverability. Reserve for secondary items only.

## Notification Patterns

**Tiers:**
1. Critical (conflicts, overtime): Dashboard alert + push notification
2. Workflow (requests, approvals): In-app badge + optional push
3. Informational (schedule published, reminders): In-app only

**Anti-pattern:** Notifying everything equally. Priority-based filtering is essential.

## Empty States

Required elements:
1. Headline: what's empty
2. Description: context + next steps
3. Icon/illustration: context-aware
4. CTA: button to create first item

Pro pattern: pre-filled sample data to reduce time to first value.

## Print/Export

- CSV for payroll
- PDF formatted report (white bg, override dark mode)
- iCal for employee personal calendars
- Print stylesheet: hide interactive elements, add metadata, logical page breaks
