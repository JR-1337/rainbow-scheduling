# Rainbow Scheduling App — Current State Snapshot

*Exported April 11, 2026 for pitch deck / business proposal preparation*

---

## 1. Feature Inventory

### Schedule Management (Admin)

| Feature | Users | Description | Mobile |
|---|---|---|---|
| 2-Week Schedule Grid | Admin | Interactive 14-day pay period grid where admins click cells to assign shifts with role, time, and task | Desktop only (read-only on mobile) |
| Shift Editor Modal | Admin | Popup form to set employee, date, role, start/end time, hours, and optional task notes for each shift | Desktop only |
| Auto-Populate (Full Week) | Admin | One-click fills all full-time employees into a selected week based on their default availability | Yes |
| Auto-Populate (Per Employee) | Admin | Fills a single employee's shifts for the week based on their availability template | Desktop only |
| Clear Shifts (Per Employee) | Admin | Removes all shifts for a selected employee in the current period | Desktop only |
| Clear Shifts (Per Week) | Admin | Removes all shifts for all employees in a selected week | Desktop only |
| Store Hours Overrides | Admin | Click any column header date to set custom open/close times (e.g., stat holidays) | Desktop only |
| Staffing Target Overrides | Admin | Set per-date staffing targets; grid shows scheduled vs. target with green/yellow/red color coding | Desktop only |
| Save / Go Live / Edit Workflow | Admin | Three-state publishing: SAVE (draft, blue) → GO LIVE (publish to employees, green) → EDIT (unlock, yellow) | Yes |
| Period Navigation | Both | Navigate forward/backward through 14-day pay periods | Yes |

### Employee Management (Admin)

| Feature | Users | Description | Mobile |
|---|---|---|---|
| Add Employee | Admin | Form with name, email, phone, employment type (full-time/part-time), default availability, role assignments | Desktop only |
| Edit Employee | Admin | Modify any employee's details, availability windows, admin/owner flags, or "show on schedule" toggle | Desktop only |
| Deactivate / Delete Employee | Admin | Soft-delete (can restore) or permanently deactivate employees; inactive employees shown in a separate panel | Desktop only |
| Restore Employee | Admin | Re-activate previously deactivated or deleted employees from the inactive panel | Desktop only |
| Reset Password | Admin | Reset any employee's password back to their default format (emp-XXX) | Desktop only |

### Shift Change Requests (3 Types)

| Feature | Users | Description | Mobile |
|---|---|---|---|
| Request Days Off | Employee | Calendar-based multi-date picker to request time off with optional reason; one pending request at a time | Yes |
| Take My Shift (Offer) | Employee | Give away a scheduled shift to another employee; recipient must accept, then admin approves | Yes |
| Shift Swap | Employee | Propose trading shifts with another employee; partner accepts first, then admin approves | Yes |
| Cancel Pending Request | Employee | Cancel any request still in "pending" or "awaiting" status | Yes |
| Approve / Deny Requests | Admin | Review and approve or deny all three request types with optional admin notes | Yes (view); Desktop (actions) |
| Revoke Approved Requests | Admin | Undo a previously approved request if the affected dates are still in the future | Yes (view); Desktop (actions) |
| Request History | Employee | View all submitted requests grouped by type with status badges (pending/approved/denied/cancelled/revoked) | Yes |
| Received Requests | Employee | View shift offers and swaps received from other employees with accept/decline options | Yes |
| Notification Badges | Both | Red badge counts on collapsed sections indicating unseen requests; auto-clears when expanded | Yes |

### Communications

| Feature | Users | Description | Mobile |
|---|---|---|---|
| Period Announcements | Admin (write), Both (read) | Rich-text announcement per pay period with subject and body; visible to employees only when period is LIVE | Yes |
| Email Schedule | Admin | Send individual or group emails with shift details, total hours, tasks, and announcement text | Desktop only |
| PDF Export | Admin | Generate professional landscape PDF with color-coded roles, hours, staffing targets, logo, and announcement banner | Desktop only |

### Account & Settings

| Feature | Users | Description | Mobile |
|---|---|---|---|
| Email + Password Login | Both | Employees log in with email and password; first login forces password change from default | Yes |
| Change Password | Both | Self-service password change requiring current password verification | Yes |
| Admin Settings Panel | Admin | Configure default staffing targets per day of week | Yes |

### Schedule Viewing (Employee)

| Feature | Users | Description | Mobile |
|---|---|---|---|
| Published Schedule View | Employee | Read-only view of the current LIVE pay period schedule; draft/edit mode shifts are hidden | Yes |
| Availability Shading | Employee | Diagonal stripe pattern on cells where an employee is fully or partially unavailable | Yes |
| Time Off Indicators | Employee | Visual indicator on cells where an approved time off request exists | Yes |
| Hours Color Coding | Both | Employee weekly hours highlighted: cyan (<35h), yellow (35-39h), red (>=40h, Ontario ESA overtime) | Yes |
| Admin Contact Info | Employee | Admin names and email addresses displayed in drawer and throughout the app | Yes |

---

## 2. Tech Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18.2 (single-page app) |
| **Styling** | Tailwind CSS 3.3.6 |
| **Icons** | Lucide React 0.263.1 |
| **Build Tool** | Vite 5.0 |
| **Backend** | Google Apps Script (Code.gs v2.12) |
| **Database** | Google Sheets (5 tabs — Employees, Shifts, Settings, Announcements, ShiftChanges) |
| **Hosting** | Vercel (auto-deploy on push to main) |
| **Backend Hosting** | Google Apps Script Web App (manual deploy) |
| **Authentication** | Custom email + password (stored in Sheets), with first-login forced password change |
| **Email** | Google MailApp sent as "OTR Scheduling" (admin receives all notifications at sarvi@rainbowjeans.com) |
| **API Pattern** | GET with query params (`?action=NAME&payload=JSON`) due to Apps Script POST redirect limitation |

---

## 3. Codebase Metrics

### Lines of Code

| File | Lines | Purpose |
|---|---|---|
| `src/App.jsx` | 8,786 | Main app — all state, views, modals, admin/employee logic |
| `backend/Code.gs` | 1,844 | Backend — API endpoints, Sheets CRUD, email sending |
| `src/MobileAdminView.jsx` | 484 | Admin mobile-optimized schedule view |
| `src/MobileEmployeeView.jsx` | 468 | Employee mobile-optimized schedule view |
| `src/index.css` | 37 | Tailwind base + custom overrides |
| `src/main.jsx` | 10 | React entry point |
| **Total** | **~11,629** | |

### API Endpoints: 36 total

- Authentication: 3 (login, changePassword, resetPassword)
- Time Off Requests: 5 (submit, cancel, approve, deny, revoke)
- Shift Offers: 7 (submit, accept, decline, cancel, approve, reject, revoke)
- Shift Swaps: 7 (submit, accept, decline, cancel, approve, reject, revoke)
- Query Functions: 4 (getEmployeeRequests, getAdminQueue, getIncomingOffers, getIncomingSwaps)
- Data Management: 6 (getEmployees, getShifts, saveShift, saveEmployee, saveLivePeriods, saveStaffingTargets)
- Batch Operations: 2 (batchSaveShifts, getAllData)
- Announcements: 2 (saveAnnouncement, deleteAnnouncement)

### Google Sheets Tabs: 5

| Tab | Columns | Purpose |
|---|---|---|
| Employees | 17 (A-Q) | Staff records — name, email, password, phone, availability, roles, employment type, admin/owner flags |
| Shifts | 9 (A-I) | Individual shift assignments — employee, date, start/end time, role, task |
| Settings | 2 (key-value) | App config — store info, live periods, staffing targets, store hours overrides |
| Announcements | 5 (A-E) | Per-period announcements with subject, message, and timestamp |
| ShiftChanges | 35 (A-AI) | All request types (time off, offers, swaps) with full audit trail and status history |

### UI Components: 30+ modals, panels, and secondary screens

### State Variables: 40+ React state hooks managing the entire application

---

## 4. User Roles and Permissions

### Admin Can:
- View and edit the full schedule grid for any pay period
- Create, modify, and delete shifts for all employees
- Auto-populate shifts based on employee availability
- Publish schedules (Go Live) and unpublish (Edit) pay periods
- Add, edit, deactivate, delete, and restore employees
- Set and override store hours and staffing targets
- Approve, deny, and revoke all three types of shift change requests
- Write per-period announcements visible to all staff
- Export schedules as professional PDFs with branding and color-coded roles
- Send schedule emails (individual or group) to employees
- Reset employee passwords
- Configure default staffing targets
- View all employees' schedules, availability, and request history

### Employees Can:
- View their published (LIVE) schedule only — draft/edit mode is completely hidden
- Navigate between pay periods to see past and future published schedules
- Submit one pending request at a time across three types: days off, shift offer, or shift swap
- Cancel their own pending requests before admin action
- Accept or decline shift offers and swap requests received from coworkers
- View their full request history with status tracking
- Read period announcements when a period is live
- See admin contact information (name and email)
- Change their own password

### Privacy Restrictions:
- Employees never see unpublished/draft schedules
- Employees cannot see other employees' request details
- Employees cannot offer shifts to or swap with admin users
- Only one pending request allowed at a time per employee
- Only future-dated requests can be revoked by admin
- Password data is never returned to the frontend (stripped from API responses)

---

## 5. Current Deployment

| Detail | Value |
|---|---|
| **Live URL** | https://rainbow-scheduling.vercel.app |
| **Frontend Host** | Vercel (auto-deploy on push to main) |
| **Backend Host** | Google Apps Script Web App (manual deploy, execute as owner, access to anyone with Google) |
| **Backend Version** | Code.gs v2.12 (RS-24 — password visibility & first-login fixes) |
| **Active Users** | Sarvi (scheduling admin) + retail staff team at Over the Rainbow / Rainbow Jeans, Ontario |
| **In Production Since** | Late January 2026 (PAY_PERIOD_START = January 26, 2026; ~2.5 months in production) |
| **Current Phase** | Phase 6 — staff user testing and feedback collection with Sarvi's team |
| **Automated Tests** | None (manual testing only) |

---

## 6. Screenshots Description

### Admin Desktop — Schedule View
The main screen is a dark-themed (charcoal navy) full-width grid. The left column lists employee names vertically. Across the top, 7 date columns show the active week (Week 1 or Week 2 of a 14-day period) with day-of-week labels and staffing counters (e.g., "8/10" in green, yellow, or red depending on coverage). Each cell in the grid represents one shift: it displays the start-end time and is color-coded by role (purple for Cashier, light purple for Backup Cashier, blue for Men's, pink for Women's, amber for Floor Monitor, slate for None). A star icon appears on cells with assigned tasks. At the bottom, each employee's row shows total weekly hours, color-coded by overtime thresholds. The top bar has period navigation arrows, a week toggle (Week 1 / Week 2), and the save/publish button (blue SAVE, green GO LIVE, or yellow EDIT depending on state). A tabbed navigation bar offers Schedule, Requests, and Comms tabs. The right side has a "Manage Staff" button opening the employee panel.

### Admin Desktop — Requests Panel
Three sub-panels (Time Off, Shift Offers, Shift Swaps) with filter toggles (Pending / Settled / All). Each request card shows employee name, dates, reason, submission timestamp, and status badge. Approve/Deny buttons with optional admin notes input. Notification badges (red circles with counts) appear on collapsed sections when new requests arrive.

### Admin Desktop — Communications Panel
A text editor area with Subject and Message fields for the current period's announcement. Save, Discard, and Clear buttons. Character count displayed. When the period is LIVE, the editor is locked with a notice that the announcement is published. Preview of how it appears in the PDF export.

### Admin Desktop — PDF Export
Landscape-oriented professional schedule with the RAINBOW logo and brand gradient header. Two-week table with employee names, daily shift times, role color coding, task indicators (stars), and weekly hour totals. A role legend at the bottom maps colors to role names. Announcement banner appears at the top if one exists. Admin contact info in the footer.

### Admin Mobile View
Hamburger menu drawer slides in from the left with: user greeting, "My Shift Changes" link, "Admin Settings" link, and Logout button. The schedule displays as a horizontally-scrollable grid with frozen employee name column on the left. Column headers show dates with mini staffing counters. A banner at the top notes that employee management, PDF export, and drag/drop are available on desktop. The same dark theme applies.

### Employee Mobile View
Clean mobile layout with a hamburger drawer containing: user info, "Shift Changes" button (opens request type selector), request history sections, admin contact info, and Logout. The schedule is a horizontally-scrollable grid showing only LIVE period shifts. An announcement popup appears as a full-screen modal when the employee first views a period with a published announcement. Request modals (Days Off, Take My Shift, Shift Swap) are full-screen forms optimized for touch input with date pickers and employee selectors.

### Notable Modals and Secondary Screens
- **Shift Editor Modal**: Form with employee dropdown, date, role selector (color-coded chips), start/end time pickers, auto-calculated hours, and optional task text field
- **Employee Form Modal**: Multi-section form with personal info, employment type toggle, 7-day availability grid (available/unavailable per day with time windows), role checkboxes, and admin flags
- **Inactive Employees Panel**: Tabbed list of deactivated and deleted employees with Reactivate/Restore buttons
- **Change Password Modal**: Current password, new password, confirm password fields with validation
- **Shift Swap Modal**: Multi-step flow — select your shift, choose swap partner, select their shift, add optional note, confirm

---

## 7. Recent Additions (Phase 5.5+)

These features were added after initial deployment, based on Sarvi's feedback and staff testing:

- **Admin Rejection Modals** — Deny/reject buttons now open a modal with optional reason field, and the reason is included in the email notification to the employee
- **Sort Toggles** — Newest/oldest sort on all 10 shift change history panels (time off, offers, swaps for both admin and employee views)
- **Uniform Tab Labels** — Standardized "Pending" badge labels across all admin request panels
- **Compact Empty States** — Cleaner UI when no requests exist in a category
- **Mobile Admin Auto-Populate** — Auto-fill and clear shift buttons added to mobile admin view with edit mode support
- **Desktop Auto-Populate Per-Week** — Changed from filling both weeks at once to filling only the active week, giving admins more control
- **Admin Settings on Mobile** — Staffing targets configuration added to mobile admin drawer (previously desktop-only)
- **Notification Badges on Desktop** — Red unseen-count badges on collapsed request sections, matching mobile behavior
- **Lighter Dark Theme** — Changed from near-black to charcoal navy background for better readability
- **Password Visibility Toggle** — Eye icon on password fields in login and change-password modals
- **First-Login Password Change** — Forced password change flow when employee logs in with default password
- **Login Label Contrast Fix** — Improved text visibility on dark login screen
- **Task Display in Shift Cells** — Task text now visible directly in schedule grid cells (with star icon)
- **RAINBOW Logo in PDF** — Brand gradient logo header added to PDF exports
- **Code.gs v2.12** — Backend updates for password handling, boolean column safety, and batch save chunking

---

## 8. Planned Features (Not Yet Built)

### Blocked (Waiting on JR)
- **Professional Sender Email** — Replace MailApp default sender with a dedicated Google Workspace account for branded emails (e.g., scheduling@rainbowjeans.com)
- **Backend Email with PDF Attachment** — New `sendScheduleEmail` API endpoint that sends the schedule PDF as an email attachment via MailApp, replacing the current client-side `mailto:` approach

### Planned (Phase 6+)
- **Shared Utils Refactor** — Extract THEME constants, ROLES definitions, and helper functions from the monolithic App.jsx into dedicated utility files
- **Staff User Testing Feedback** — Ongoing collection and implementation of feedback from Sarvi's team during real-world usage
- **POS Integration** (Reserved) — `counterPointId` column exists in the Employees sheet for future CounterPoint POS integration
- **Payroll Integration** (Reserved) — `adpNumber` column exists in the Employees sheet for future ADP payroll integration

---

*End of snapshot. Total app scope: ~11,600 lines of code, 36 API endpoints, 5 database tabs, 30+ UI components, 3 request workflows with full email notification chains, serving a retail team in Ontario with role-based scheduling, shift change management, and Ontario ESA compliance tracking.*
