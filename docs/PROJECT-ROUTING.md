# PROJECT-ROUTING — RAINBOW Scheduling

## Offers
Scheduling UI (React): `src/App.jsx` (~6400L, shrinking per S39 extraction), `src/MobileEmployeeView.jsx`, `src/MobileAdminView.jsx`
Extracted panels: `src/panels/*.jsx` (14 files — admin + employee request panels, communications, inactive-employees, unified history)
Extracted modals: `src/modals/*.jsx` (3 files — AdminRequestModal, ShiftEditorModal, RequestTimeOffModal)
Extracted utils: `src/pdf/generate.js`, `src/email/build.js`, `src/utils/format.js`, `src/theme.js`, `src/constants.js`, `src/auth.js`
Apps Script backend: `backend/Code.gs` | Sheets schema: `docs/schemas/sheets-schema.md` | Bug patterns: `docs/lessons.md`

## Needs From Others
Design/color/typography → Creative-Partner: `reference/layer-0/color.md`, `reference/layer-1/applied-component-patterns.md`
Brand → BridgingFiles: `Brand/richmond-athletica-brand-v4.md`

## Internal Routing
Schedule grid/shift logic → `src/App.jsx` (shift state) + `backend/Code.gs` (saveShift, batchSaveShifts)
Request workflow → `src/App.jsx` (request state/panels) + `backend/Code.gs` (submit/approve/deny/revoke)
Mobile employee → `src/MobileEmployeeView.jsx` + `src/App.jsx` (shared exports)
Mobile admin → `src/App.jsx` (isMobileAdmin branch) + `src/MobileAdminView.jsx`
Extracting inline App.jsx component → `src/panels/` (if stateful panel) or `src/modals/` (if modal); import symbols from `../App` INSIDE function bodies only (see lessons.md circular-import entry)
Sheets schema changes → `docs/schemas/sheets-schema.md` (read first) + `backend/Code.gs`
Deploy issues → `CLAUDE.md` Deploy section | New API endpoint → `backend/Code.gs` (doGet dispatcher)
Decisions → `docs/decisions.md` | Bug patterns → `docs/lessons.md`
