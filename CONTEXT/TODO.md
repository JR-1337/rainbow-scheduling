<!-- SCHEMA: TODO.md
Version: 1
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test save/delete failure paths on phone; edit-modal must stay on "Edit" (not "Add"), state must revert on failure (post-commit 7a13cab LIVE)
- Adversarial audit Phase E -- next: pause or pick a concrete motivation. Cuts 1-15 shipped across two sessions; App.jsx 3044 -> 2526 (-518, -17%). Latest session added `utils/requests.js` helpers (matchesOfferId/matchesSwapId/errorMsg DRY across 26 sites) and `components/ScheduleStateButton.jsx` (unified mobile + desktop three-state Save/GoLive/Edit). JR said "good on code and bug fixes" -- further cuts should wait on a feature motivation. Sub-area 6 (Context provider) still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Could not reproduce via Playwright; getPKDefaultTimes only returns Sat 10:00-10:45 or 18:00-20:00; suspect old PK rows in spreadsheet OR ShiftEditor seed for cell-click PK. Ask JR which employee + which day.
- Bug 5 (top-nav PK saves to sheet but doesn't show in UI) -- next: handleBulkPK calls loadDataFromBackend on success; events flow through eventsObj keyed `${employeeId}-${dateStr}`. Need JR repro: which week was active, which employees, did they appear after page hard-refresh?
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Email + distribution overhaul -- next: JR creates dedicated Gmail (e.g. rainbow-scheduling@gmail.com) to replace his personal account as sender; then revisit sender identity across MailApp calls, schedule PDF distribution, announcement emails, welcome email on new-employee create (emp-XXX default pw), Sarvi admin notifications, and any other external comms. Scope: audit every send site, standardize from-address, subject conventions, and deliverability (SPF/DKIM if custom domain later)
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- move Fill Wk / Clear Wk / PK-week controls into each employee's "Staff" cell on the schedule; add a dropdown of all staff so admin can bulk-book or clear an entire week for one picked employee from that menu. Also investigate current Fill Wk / Clear Wk behavior -- JR wants full-fill to cover everyone. Raised 2026-04-18, explore later, do not ask

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS at HEAD `1bdde4e` pushed to origin/main; modern bundle 472.88 kB, legacy 490.05 kB + polyfills emitted
- Last validated: 12/12 `createShiftFromAvailability` unit cases PASS via Playwright browser `import('/src/utils/scheduleOps.js')` (FT wide/tight/unavailable/clamp-degenerate, PT keeps availability-width, per-employee `defaultShift` override still wins)
- Last validated: favicon assets favicon.png (48x48) + apple-touch-icon.png (180x180) + favicon.svg all 200 in dev; link tags wired in index.html; zero console errors on login
- Last validated: 4-bucket sort + dividers PASS localhost Playwright at 1280px (admin grid, 2 dividers), 768px (same), 390px (mobile admin); PDF fixture shows 3 transitions x 2 weeks = 6 dividers
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Last validated: 3 decouple smokes PASS on prod 2026-04-19 (Auto-Fill defaultShift precedence, PK Select-eligible 19/24, mobile 502x800 form render)
- Missing validation: FT Auto-Fill + cell-click prefill not interactively smoked on prod with live 24-employee data (unit tests cover the logic; await Sarvi test)
- Missing validation: favicon not yet confirmed on prod (rainbow-scheduling.vercel.app) after Vercel redeploy; dev-only verification
- Missing validation: cut 8 (applyShiftMutation) + cut 10 (shift transfer/swap helpers) live admin-action paths not exercised -- offer/swap approve/revoke need live-test
- Missing validation: cut 13 (errorMsg/matchesOfferId/matchesSwapId across offer+swap handlers) live admin-action paths not exercised
- Missing validation: Sarvi iPad white-screen fixes not retested (theme.js localStorage guard + plugin-legacy)
- Missing validation: new Backup Cash role not smoked on prod (ShiftEditorModal picker, EmployeeFormModal defaultSection, PDF legend glyph 'B')
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad
- Missing validation: PDF role-encoding system not smoked on prod
- Missing validation: Sarvi-batch 10 items not yet hands-on tested by JR + Sarvi
- Missing validation: no automated test suite; manual Playwright smoke only

## Completed

- [2026-04-23] Logo nav: RAINBOW logo (desktop header + mobile admin header) wrapped in `<a href="/">` (`2812631`). Clicking reloads app from root. Build PASS, pushed.
- [2026-04-23] Desktop/mobile admin parity ports: Change Password on desktop (`f19b5e4`) + per-row Edit on mobile Hidden section (`bf2a8e3`). Change Password menuitem added between Admin Settings and Sign Out in desktop avatar dropdown; `ChangePasswordModal` rendered in desktop return. Mobile Hidden from Schedule collapsible gains inline Edit3 button per row (identical styling to desktop pattern). Two other audit-flagged "gaps" rejected after investigation: desktop already exceeds `MobileEmployeeQuickView` via hover tooltip showing email + phone + full availability (App.jsx:2482-2513); Hidden section itself already existed on both branches. Playwright smoke PASS desktop 1280px + mobile 390px, zero console errors.
- [2026-04-23] FT default shift fallback + rainbowjeans.com favicon (`1bdde4e`). New `FT_DEFAULT_SHIFT` constant in `src/utils/storeHours.js` (Mon-Wed 10-18, Thu-Sat 10:30-19, Sun 10:30-18). `createShiftFromAvailability` fallback: per-employee `defaultShift` -> FT pattern (FT only) -> availability (PT); always clamped to availability; degenerate clamp -> null. Same branch in `ShiftEditorModal.getDefaultBookingTimes` for empty-cell prefill. Favicon + apple-touch from rainbowjeans.com OTR50.png, favicon.svg kept as tertiary fallback. 12/12 unit cases PASS via Playwright browser import; build PASS; zero console errors.
- [2026-04-20] Schedule sort: 4-bucket order (Sarvi, other admins alpha, FT alpha, PT alpha) + bucket-transition dividers (`10c3980`). New `src/utils/employeeSort.js` centralizes logic across 5 render sites: desktop admin, desktop employee, mobile admin, mobile employee, PDF. Dividers skip empty buckets. Localhost Playwright PASS at 1280/768/390px + PDF fixture shows 6 dividers.
- [2026-04-19] Phase E cuts 13-15 shipped (App.jsx 2606 -> 2526, -80). Cut 13 `d9c5377` added matchesOfferId/matchesSwapId/errorMsg helpers + DRY'd 26 sites. Cut 14 `d6e8811` extracted ScheduleStateButton desktop. Cut 15 `3d271a3` unified mobile + desktop onto one ScheduleStateButton with middle-ground sizing. Playwright smoke PASS at 1280px + 390px.
<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
