# RAINBOW Scheduling App

Retail scheduling platform for OTR/Rainbow Jeans (Ontario). Employees view shifts, submit requests. Admins build schedules, manage requests, publish announcements. Live: https://rainbow-scheduling.vercel.app
Stakeholders: JR (dev), Sarvi (scheduling admin - gets all request notifications).

## Boundaries
<important>
- Sheets column headers immutable → read `docs/schemas/sheets-schema.md` before modifying backend/data
- Draft shifts private → `publishedShifts` = LIVE periods only. Employees never see unpublished
- Ontario ESA compliance (44hr/week overtime)
</important>

## Stack
Frontend: React 18+, Tailwind, Lucide | Backend: Apps Script (Code.gs v2.18 live as of 2026-04-12), Sheets (5 tabs)
Deploy: Vercel (auto on push) + Apps Script (manual) | Email: MailApp as "OTR Scheduling"
Auth (S36+): stateless HMAC session tokens (12h TTL), salted SHA-256 password hash, Script Property `HMAC_SECRET`, Employees columns `passwordHash` (R), `passwordSalt` (S), `passwordChanged` (T, authoritative for default-pw detection; falls back to emp-XXX regex when blank).

## Files
`src/App.jsx` (~3680) main app, state, shared exports, `guardedMutation` helper | `src/views/EmployeeView.jsx` extracted employee desktop/mobile view | `src/MobileEmployeeView.jsx` mobile components incl. `MobileAlertsSheet`, `computeAlertItems`, `MobileBottomNav`, `MobileBottomSheet` | `src/MobileAdminView.jsx` | `src/theme.js` THEME/TYPE/OTR | `src/constants.js` ROLES/ROLES_BY_ID/status color maps | `src/panels/` admin+employee list panels | `src/modals/` request/offer/swap/settings/password modals | `src/auth.js` session token + cached user + auth-failure callback | `src/pdf/generate.js` | `src/email/build.js` | `src/utils/format.js` | `backend/Code.gs` (~2100) edit here, paste to Apps Script

## Architecture
4 views = role(admin|employee) x device(mobile|desktop @768px):
- Admin Desktop: full grid, inline edit, auto-populate, employee mgmt, PDF, email
- Admin Mobile: `if(isMobileAdmin)` branch in App.jsx (30+ state, avoids prop drilling)
- Employee Desktop: read-only grid + request sidebar
- Employee Mobile: separate `EmployeeView` (only needs published data)

Requests: submit → (recipient accepts for offers/swaps) → admin approves/denies → email. Cancel pending; revoke approved (future only).
Save button: SAVE(blue) → GO LIVE(green) → EDIT(yellow)

## Roles
`cashier`=#8B5CF6 | `backupCashier`=#A78BFA | `mens`=#3B82F6 | `womens`=#F472B6 | `floorMonitor`=#F59E0B | `none`=#475569

## Deploy
Vercel: push → auto-deploy. Broken? GitHub Settings → Apps → Vercel → Configure → unhide repo
Apps Script: edit Code.gs → Deploy → Manage → Edit active. Execute as "Me", access "Anyone w/ Google"
Fallback: `vercel link --scope johnrichmonds-projects-7f62ccc5 --project rainbow-scheduling --yes && vercel --prod --yes`
Config: `API_URL`@App.jsx | `SPREADSHEET_ID`@Code.gs | `ADMIN_EMAIL`@Code.gs=Sarvi | `PAY_PERIOD_START`@App.jsx=2026-01-26

## Active Context
handoffs:`docs/handoffs/` | tasks:`docs/todo.md`(Phase 6) | decisions:`docs/decisions.md` | lessons:`docs/lessons.md` | schema:`docs/schemas/sheets-schema.md` | audit:`docs/audits/s42-functional-test.md`
