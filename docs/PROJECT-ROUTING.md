# PROJECT-ROUTING — RAINBOW Scheduling

## Offers
Scheduling UI (React): `src/App.jsx`, `src/MobileEmployeeView.jsx`, `src/MobileAdminView.jsx`
Apps Script backend: `backend/Code.gs` | Sheets schema: `docs/schemas/sheets-schema.md` | Bug patterns: `docs/lessons.md`

## Needs From Others
Design/color/typography → Creative-Partner: `reference/layer-0/color.md`, `reference/layer-1/applied-component-patterns.md`
Brand → BridgingFiles: `Brand/richmond-athletica-brand-v4.md`

## Internal Routing
Schedule grid/shift logic → `src/App.jsx` (shift state) + `backend/Code.gs` (saveShift, batchSaveShifts)
Request workflow → `src/App.jsx` (request state/panels) + `backend/Code.gs` (submit/approve/deny/revoke)
Mobile employee → `src/MobileEmployeeView.jsx` + `src/App.jsx` (shared exports)
Mobile admin → `src/App.jsx` (isMobileAdmin branch) + `src/MobileAdminView.jsx`
Sheets schema changes → `docs/schemas/sheets-schema.md` (read first) + `backend/Code.gs`
Deploy issues → `CLAUDE.md` Deploy section | New API endpoint → `backend/Code.gs` (doGet dispatcher)
Decisions → `docs/decisions.md` | Bug patterns → `docs/lessons.md`
