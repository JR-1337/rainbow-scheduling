# Gold-sources inventory -- RAINBOW Scheduling APP

Telos: forward-looking map for any future `LOOP/<mode>/` scoring pass. Lists where high-value gold content lives in-tree so a meta-agent setting up a loop has a starting reference without re-discovering. No file duplication into `DATA/fixtures/` until a loop actually scores against them (avoids sync drift between in-tree truth and DATA mirror).

PII boundary (governance): live employee / shift / request / announcement data lives in the production Google Sheet `RAINBOW SCHEDULING DATABASE` (owner `otr.scheduler@gmail.com`, file id `1LlhhT9f6ewEfWqdoe0-j5hnVNKiA1pSfEFBAzSo3v8A`). That data is PII and **never** lands in this repo. Loop fixtures synthesize or anonymize before promotion.

## Gold sources -- backend / API surface

- **Apps Script web-app endpoint**
  - In-tree: `backend/Code.gs` (~2503 lines, v2.26.0 as of s034 redeploy).
  - Endpoint shape: `GET /exec?action=NAME&payload=JSON` (see `CONTEXT/ARCHITECTURE.md` Integrations).
  - Future-loop use: API regression scoring (action -> response shape contract); deploy-fingerprint drift detection.
  - Constraint per LESSONS: Apps Script POST returns HTML redirect instead of JSON; web-app calls have ~7-8s floor; `Sheets.Spreadsheets.Values.batchGet` unusable here.

- **Frontend API client**
  - In-tree: `src/utils/api.js` (carries deploy fingerprint at line ~6).
  - Future-loop use: deploy-fingerprint diff trace (catches when `/exec` URL changes).

- **Stateless HMAC session token**
  - In-tree: `src/auth.js`.
  - Future-loop use: auth-flow regression scoring; HMAC_SECRET drift detection (per LESSONS Apps Script ownership transfer rule, HMAC_SECRET re-add is a manual step).

## Gold sources -- data shape

- **Sheets schema reference**
  - In-tree: `docs/schemas/sheets-schema.md` (5 tabs).
  - Future-loop use: schema-regression scoring (column drift, type-coercion pitfalls per LESSONS Sheets-storage rules).
  - PII boundary: schema doc is shape-only; no row data.

- **Frontend constants**
  - In-tree: `src/constants.js` (`ROLES`, `ROLES_BY_ID`, `DESKTOP_SCHEDULE_GRID_TEMPLATE` 240px+7fr, `REQUEST_STATUS_COLORS`, `OFFER`/`SWAP` shapes, `EVENT_TYPES`, `PRIMARY_CONTACT_EMAIL`).
  - Future-loop use: data-shape contract reference for any backend-vs-frontend parity scoring.

- **Theme + brand palette**
  - In-tree: `src/theme.js` (THEME / TYPE / OTR accent palette).
  - Constraint per LESSONS: OTR 5 brand accent colors immutable -- `#EC3228` red, `#0453A3` blue, `#F57F20` orange, `#00A84D` green, `#932378` purple. JR approval required for any palette change.
  - Future-loop use: brand-color regression check; UI-ux scoring against immutable palette.

## Gold sources -- PDF / print

- **PDF generator**
  - In-tree: `src/pdf/generate.js`.
  - Layout problem registry: `CONTEXT/pdf-print-layout.md` (canonical project reference; preserved verbatim in BOOTSTRAP).
  - Constraints per LESSONS: UTF-8 charset meta + Blob `type: 'text/html;charset=utf-8'`; ASCII hyphens (no em-dashes); iOS Safari blob fallback navigates current tab; `-webkit-line-clamp` invisible in PDF print popup; `await import()` must come AFTER print tab opens.
  - Future-loop use: PDF render regression scoring (Safari iPad target, Sarvi's primary device).

## Gold sources -- statutory references

- **Ontario employment law citations**
  - In-tree (per LESSONS): pitch artifacts cite `ontario.ca` authoritative source for statutory claims (44hr OT, ESA references).
  - External canonical source: ontario.ca pages (not in repo; reachable via WebFetch when needed).
  - Future-loop use: statutory-claim source-verification scoring on any pitch artifact change.

## Forward-looking capture targets (not in DATA/ yet)

- **Apps Script API response samples**
  - Status: not captured today; would help action-shape contract scoring.
  - Future capture path: `DATA/traces/api/{action}/{date}.json` once a capture pipeline is built. Anonymize before commit (employee names / emails are PII).

- **PDF render outputs**
  - Status: PDFs generate live in browser print; no stored exemplars.
  - Future capture path: `DATA/exports/pdf-samples/{breakpoint}/{date}.pdf` for visual-regression baselines (use synthetic schedule data, not live Sheets data).

- **Schedule rendering screenshots**
  - Status: Playwright is in devDependencies (`playwright: ^1.59.1`); headed unreliable on Chromebook/Crostini per LESSONS.
  - Future capture path: `DATA/traces/screenshots/{viewport}/{view}/{date}.png` for UI-regression scoring (synthetic data only).

## Governance summary

- **In-repo (public-OK)**: Apps Script source, frontend constants, theme, schema doc, PDF generator, statutory citations.
- **PII (cloud-only, never in repo)**: live Sheets data (employees, shifts, requests, announcements, swap/offer logs).
- **Synthesized fixtures**: any `DATA/fixtures/*` future entries must use synthetic or anonymized data; flag `sensitivity: public` only after PII review.
