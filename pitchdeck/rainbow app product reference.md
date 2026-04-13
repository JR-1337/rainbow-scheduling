# RAINBOW Scheduling — Product Reference

*Internal source-of-truth for deck + leave-behind authoring. Names what's built today, what's planned, and the language to use when translating to stakeholder-facing materials.*

Live URL: rainbow-scheduling.vercel.app
Built for: OTR (Over The Rainbow) / Rainbow Jeans — independent retail clothing store, Ontario, Canada
Staff size: ~15–20 employees, mix of full-time and part-time
Replaces: Manual / spreadsheet-based scheduling
Status: Live in production, iteratively refined, branded to OTR, security-hardened, demo-ready 2026-04-14

## Stakeholders

- **Owner (Dan Carman)** — approves adoption. Cares about cost, liability, reliability, brand fit. Slow to decide, price-first.
- **Scott (Operations Manager)** — cares about workflow accuracy, staffing coverage, labour cost control. Expected to raise "ADP and Counterpoint already offer scheduling."
- **Amy Carman (Payroll)** — not in demo room but owns ADP. Will veto anything that reads as taking payroll control away from her.
- **Sarvi (GM)** — daily power user, currently builds every schedule. Co-presenting. The app's immediate beneficiary.

## Brand context

OTR's identity is a literal rainbow palette — Red `#EC3228`, Blue `#0453A3`, Orange `#F57F20`, Green `#00A84D`, Purple `#932378`. These appear on bags, tags, signage. The app embodies this via a dark navy page background with a rotating 5-color accent system that cycles on each app load.

Floor roles: Cashier, Backup Cashier, Men's, Women's, Floor Monitor. Each has an assigned brand color for at-a-glance schedule reading.

---

## 1. What the app is

A custom-built web application that manages retail staff scheduling, shift change requests, and team communications for OTR. It adapts to user role (admin vs. employee) and device (desktop vs. mobile), replacing manual spreadsheet scheduling with a purpose-built system that includes real-time labour-law guardrails, printable schedules, automated email notifications, and a full audit trail.

---

## 2. The four user experiences

The app delivers four distinct experiences based on role and device.

**Admin Desktop (Sarvi's primary tool)**
- Full scheduling cockpit
- Grid-based schedule editor for 2-week pay periods
- Auto-populate tools, employee management, PDF export, email broadcast
- 4-button right-side toolbar (Export, Publish, My Requests, avatar dropdown) — collapsed from earlier 7-button layout

**Admin Mobile**
- On-the-go request approvals, schedule monitoring, announcement posting
- Bottom-nav layout: Schedule / Requests / Comms / More
- Schedule-context toolbar hides on non-schedule destinations

**Employee Desktop**
- Read-only schedule grid
- Request submission sidebar (time off, offers, swaps)
- Announcement feed

**Employee Mobile**
- App-feel bottom-nav experience (Schedule / Requests / Alerts / More)
- Check upcoming shifts, tap for details (role, time, hours, task)
- Submit requests, read announcements, review recent request activity via Alerts bottom sheet

---

## 3. Scheduling workflow

**Pay periods**
- 14-day blocks aligned to OTR's actual pay period start
- Each period tracked independently (one period can be live, another in draft)
- Login lands on the current pay period by default

**Draft → Live → Edit lifecycle**
- **SAVE** (blue) — writes the draft privately. Employees never see drafts.
- **GO LIVE** (green) — publishes the period. Becomes visible to employees; emails trigger. Confirmation dialog before publishing.
- **EDIT** (yellow) — re-opens a live period for modifications.
- Past periods lock to EDIT mode for history preservation.

**Shift editing**
- Inline editing directly on the grid
- Per-cell role, time, hours, and optional task notes
- Color-coded by role at a glance

**Auto-populate**
- One-click fill of a week using each employee's pre-configured default hours
- Per-week and per-employee scope
- Available on both desktop and mobile admin
- Skips past dates automatically

**Staffing visualization**
- Real-time headcount vs. target staffing per role per day
- Color-coded staffing bars under admin desktop column headers
- Visual shortfall/surplus detection

**Visual details**
- Role color-coding on every shift cell
- Stat holiday markers
- Overridden dates (schedule deviates from default) shown in cyan-tinted text
- Past dates show headcount only (no target comparison)
- Sort order: Sarvi first → full-time (alphabetical) → part-time (alphabetical)

---

## 4. Requests system

Four request types, each with a complete lifecycle and automated notifications.

**Time-off requests**
- Employee submits from their device
- Admin approves or denies
- Email sent to employee on decision
- Approved time off renders as "OFF — approved" overlay on schedule grid and printed PDFs
- Employees can cancel pending requests; admin can revoke approved future requests
- Overlap guard blocks booking against already-approved dates (calendar grays out approved-off days)

**Shift offers**
- Employee offers up an assigned shift
- Other eligible employees can claim it
- Admin holds final approval
- Automatic email chain as state transitions

**Shift swaps**
- Employee proposes a swap with a specific coworker
- Recipient accepts or declines
- Admin approves or denies
- Full notification chain

**Take-my-shift**
- Fast-path flow for giving up a shift without targeting a specific person
- Same approval pattern

**Across all request types**
- Pending requests cancellable by submitter
- Approved future requests revocable
- Full audit trail with history panels (sortable newest/oldest)
- Admin rejection modals include optional reason field (shown to employee)
- Email notifications at every state transition
- Submit / approve / deny / revoke / cancel actions show a "saving" toast during the 2–3s server round-trip; double-click is silently dropped so no duplicate mutation lands
- Success toasts name destination ("moved to Settled history", "Sarvi has been notified")

---

## 5. Communications

**In-app announcements**
- Subject + message composed by admin
- Posted in-app with accent-bordered presentation
- Visible on both employee desktop and mobile

**Broadcast email**
- Simultaneous email to every active employee
- Sent under branded sender name "OTR Scheduling"
- Plaintext body for universal deliverability

**Mobile Alerts bottom sheet (employee)**
- Tap Alerts tab → sheet opens with: current announcement + feed of terminal status changes on the employee's own requests in the last 14 days (approved / denied / revoked / rejected / cancelled across all request types)
- Badge on the tab when announcement exists OR new activity since last open; opening the sheet marks the feed as seen

---

## 6. Employee management

Full employee lifecycle handled inside the admin interface — no direct spreadsheet editing required.

- Add new employees (create-flow includes employment-type toggle)
- Edit name, role, default hours, full-time/part-time flag
- Activate / deactivate (inactive employees excluded from all scheduling and views)
- Password reset with admin-visible default
- Per-employee default hours per day of week (used by auto-populate)

---

## 7. Authentication & security

**Login**
- Employee ID + password
- Default passwords are sequential: emp-001, emp-002, etc. (zero-padded by row)
- Users can change their own password

**Session tokens**
- HMAC-signed tokens (SHA-256)
- 12-hour time-to-live
- Stateless (no session table to maintain)
- Constant-time cryptographic verification
- Rotating the server secret force-logs-out every session — operational kill switch

**Password storage**
- Salted SHA-256 hashing, per-user UUID salt
- Plaintext → hash migration on next login (transparent to user, no forced reset)
- Authoritative `passwordChanged` flag prevents users who set a new password matching the default pattern from being stuck in a re-prompt loop

**Server-side enforcement**
- Every protected endpoint verifies the token server-side
- Admin-only endpoints gated by explicit `isAdmin` check
- Every handler derives `callerEmail` from the authenticated token — payload-trust eliminated
- Not trust-the-client

---

## 8. PDF export (printable schedule)

A full printer-optimized schedule export for the back-office posting board.

- Role-colored outlines on white cells (ink-efficient vs. filled tints)
- "Printed on" timestamp footer
- Live app URL printed on footer (so staff can access the live version)
- Daily headcount row per week
- Approved time-off rendered as "OFF — approved" markers
- Ontario ESA overtime thresholds highlighted (amber ≥40h, red ≥44h)
- Page-break safe: rows don't split across pages, header repeats on each page
- Hides "0.0h" for unscheduled employees
- Legend including PTO swatch
- OTR branded: navy header, purple title border + announcement accent
- Sticky print button in preview (no forced auto-print)

---

## 9. Labour law compliance (Ontario ESA)

Built-in guardrails against accidental overtime liability.

- Real-time per-employee per-week hour totals
- **Amber warning at ≥40 hours** (approaching OT)
- **Red warning at ≥44 hours** (Ontario ESA overtime threshold crossed)
- Warnings appear in the live scheduling UI, on admin-desktop column headers, on employee row totals, and on printed PDFs
- Helps prevent accidental wage liability during schedule construction

---

## 10. Mobile experience

**Responsive**
- Breakpoint at 768px
- Distinct mobile codepaths, not just a shrunken desktop

**Navigation**
- Bottom-nav layout (app-like, thumb-reachable)
- Admin: Schedule / Requests / Comms / More
- Employee: Schedule / Requests / Alerts / More

**Native-feel interactions**
- Bottom-sheet modals (slide up from bottom, not centered popups)
- 44px touch targets (WCAG standard)
- Haptic feedback on key actions (save, publish, mode toggle)
- iOS safe-area aware (notches, home indicators)
- Focus-trapped dialogs (Tab cycles within; Escape closes)

**No install**
- Accessed via URL and login
- No App Store process
- No per-device setup

---

## 11. Visual & UX design

**Colors & theme**
- Dark navy page background (`#0D0E22`)
- Bright white content cards
- Rotating 5-color accent system (one brand color per session, cycles per load)
- Accent-color halos around cards (not dark drop-shadows, which disappear on dark backgrounds)
- WCAG contrast-calculated button text: green accent gets navy text for readability, others white

**Animation & feedback**
- **Welcome sweep** — 900ms 5-stripe rainbow sweep across the screen on successful login, respects `prefers-reduced-motion`. Signature brand door chime.
- Animated number transitions on hour/count changes
- Scheduling skeleton loader during data fetches
- Glassmorphism modal backdrops
- Smooth reduced-motion fallbacks for accessibility

**Ergonomics**
- Screen-reader-announced status toasts (aria-live)
- Skip-to-content links for keyboard users

---

## 12. Technical architecture

**Frontend**
- Modern React single-page application
- Responsive across desktop, tablet, and mobile
- Deployed via a continuous-delivery pipeline: every approved code change ships automatically, no downtime

**Backend**
- Dedicated application server handling all business logic
- Every request authenticated server-side with HMAC session tokens
- Hardened for production-grade reliability

**Database**
- Purpose-built scheduling data store
- Separated from the frontend so either layer can evolve independently
- Backed up regularly

**Email**
- Transactional email delivery under a branded "OTR Scheduling" sender
- Automated notifications for every request state change and announcement

**Hosting flexibility**
- Can be hosted on OTR's own infrastructure (business retains full control) or on a managed platform provisioned and maintained on their behalf
- Final arrangement is a business decision; the app is architected to be portable either way

---

## 13. Data ownership & portability

- All scheduling, employee, request, and announcement data belongs to OTR
- Exportable at any time in standard formats (CSV, spreadsheet, JSON)
- No proprietary vendor lock-in — the data model is open and transferable
- If the business decides to change hosting providers, bring the app in-house, or migrate to another platform entirely, the data moves with them
- No third-party SaaS company sitting between OTR and its own scheduling information

---

## 14. Reliability, performance & production readiness

**Hardening roadmap to business-grade standard:**
- Dedicated production database with automated backups and point-in-time recovery
- Monitoring and alerting so issues are caught before staff notice them
- Error tracking with automatic reporting
- Rate limiting and abuse protection
- SSL/TLS encryption on every connection
- Server-side logging and audit trail for compliance and troubleshooting
- Staging environment separate from production (changes tested before staff see them)
- Scheduled security reviews

**Performance today:**
- Grid optimized for real-time responsiveness even with full staff rosters
- Efficient data loading so schedule views open instantly
- Hard-fail on any partial save — the system will never silently lose scheduling data
- Double-submit protection on all write actions (no duplicate mutations from rapid clicks)
- Iteratively performance-tuned based on real usage patterns

---

## 15. Pain points eliminated

| Before | After |
|---|---|
| Hours per pay period in spreadsheets | Minutes via auto-populate |
| Text-message shift swaps lost in chats | Auditable in-app workflow |
| Paper time-off forms lost or forgotten | Digital submission + approval trail |
| Group-text announcements | In-app + email broadcast under OTR branding |
| No overtime visibility | Real-time ESA flags amber/red |
| No schedule history | Every version and every request traceable |
| No single source of truth | Schedule, requests, announcements all in one place |
| Scheduling tied to one device | Access from any phone or computer |

---

## 16. Planned / future development

Listed in likely implementation order, pending owner go-ahead. Each item is scoped; none is in the current build.

### Phase 2 — Payroll bridge (primary post-demo initiative)

Replaces the current manual workflow: Counterpoint timecard printout → Amy's team re-keys hours into ADP → separately, sales receipts tallied from a box and keyed into ADP as bonus adjustments.

- **Counterpoint actuals ingestion** — pull clock-in/out hours from the Counterpoint export
- **Scheduled-vs-actual reconciliation view** — for each pay period: scheduled hours vs. clocked hours, variance flags, PTO lines, ESA OT flags
- **In-app bonus entry** — per-employee bonus entry per period, driven by OTR's $10-per-$750-pre-tax-transaction rule. Kills the receipt box + 2-hour manual tally.
- **ADP-ready CSV export** — Rainbow emits a CSV in ADP Workforce Now's import schema (Employee ID → Hours → Rate Code → adjustments). Amy clicks Import in ADP. Amy keeps full payroll control.

Deliberately **not** built as an API integration. CSV interchange is the architecturally correct answer: zero API tax (ADP API Central charges $2.50/employee/month), zero fragility when ADP updates endpoints, 60-second operational workflow. ADP and Counterpoint both support standardized CSV in/out as first-class features.

Discovery blocking build (not pitch): Counterpoint export format confirmation, ADP Workforce Now upload schema, employee ID consistency across Rainbow/Counterpoint/ADP, bonus formula confirmation.

### Consecutive-days streak warning

Flag any employee scheduled 6+ consecutive days — an ESA-adjacent retail rule Sarvi has been flagged on previously.

- Detection spans week + pay-period boundaries (Sat→Sun continuation counts)
- Cell border warning on 6th+ day + top-of-schedule banner listing offenders (same visual pattern as OT banner)
- Behaviour to confirm with Sarvi: does PTO break streak? does a single day off reset? warning only vs. hard block? (working defaults: yes / yes / warning only)

### Meetings + PK shift types

Shift entries gain a `type` field: `work` | `meeting` | `pk`. A day can hold multiple entries.

- Default duration: 2 hours for meetings + PK, Sarvi sets start time
- PK assignment: bulk-assign to all active, Sarvi opts individuals out per event
- Meeting assignment: individual, targeted per employee
- Hours counting: meetings + PK count toward weekly total + ESA 40/44hr flags. Overlap with a work shift counts only the union (no double-count).
- Consecutive-days streak: PK and meetings do NOT count as a worked day for streak purposes
- Visual: neutral palette (grey/white, not role colors). Designation marker on work-shift card when same-day overlap; standalone neutral-bordered card when event-only day.

### New-employee welcome email

Triggered on EmployeeFormModal create flow. Sends to the employee's address:
- App URL
- Their email as username
- Initial default password (emp-XXX zero-padded)
- Note that they'll be prompted to change it on first login
- Optional onboarding / handbook attachment (pending Sarvi supplying the doc)

### Concurrent-admin edit detection

Two admins editing the same period currently race to last-save. Options to explore:
- Lightweight lock field in settings with admin email + timestamp + banner on other admins' screens ("Sarvi is editing W1")
- Periodic `getAllData` poll every 30-60s on admin view
- Both

Revisit only if a second admin is added to the workflow.

### Professional sender email

Move broadcast email from the current sender to a dedicated Google Workspace account for proper from-address branding and improved deliverability. Unblocks PDF auto-attach on email broadcast.

### Post-demo perf path — Cloudflare Worker proxy

Not user-facing but affects perceived speed. Cloudflare Worker sits between frontend and backend, caches read payloads in Workers KV with stale-while-revalidate (60s TTL). Login reads become ~300ms edge-cached globally. Writes pass through uncached. Free tier. Fully reversible. Addresses the measured ~7–8s backend per-request floor.

---

## 17. Feature list at a glance

### Scheduling
Grid-based 2-week pay period editor · Draft/Live/Edit lifecycle · Auto-populate (per-week, per-employee) · Default hours per employee per day · Role-color-coded shift cells · Real-time headcount vs. target · Staffing bars per role per day · Overtime warnings (amber ≥40h, red ≥44h) · Stat holiday markers · Override-date indicators · Full edit history per period

### Requests
Time-off · Shift offers · Shift swaps · Take-my-shift · Admin approval queues · Rejection modals with optional reason · Cancel pending / revoke approved · Full sortable history · Double-submit protection + saving toasts

### Communications
In-app announcements · Branded email broadcast · Automated notification chain on state changes · Mobile Alerts bottom sheet with 14-day activity feed

### Employee management
Add / edit / deactivate · Default hours configuration · Role and employment-type assignment · Password reset · Authoritative default-password flag

### Output
Printer-optimized PDF export · Sticky print button · Page-break safe · Approved-time-off overlays · ESA threshold highlighting

### Security
HMAC session tokens (12-hour TTL) · Salted SHA-256 password hashing · Server-side auth enforcement · Admin-only endpoint gating · Token-derived caller identity (no payload trust) · Rotating-secret kill switch

### Experience
Four adapted views (role × device) · Mobile bottom-nav navigation · Native-feel bottom-sheet modals · 44px touch targets · Haptic feedback · Animated counters · 900ms welcome sweep on login · Dark navy + rotating rainbow-accent branding · WCAG-calibrated accessibility (contrast, focus traps, reduced motion, screen-reader announcements, skip links)

### Infrastructure
Modern production-grade web stack · Flexible hosting (OTR-owned or managed) · Automated database backups · Encrypted connections (SSL/TLS) · Monitoring, alerting, and error tracking · Staging environment · Full data portability · Continuous-delivery pipeline (zero-downtime updates) · Separate frontend and backend layers for long-term flexibility
