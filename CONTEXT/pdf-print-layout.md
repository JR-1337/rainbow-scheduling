<!-- SCHEMA: pdf-print-layout.md
Purpose: Reference for staff schedule PDF (HTML -> browser print).
Audience: Claude Code / any agent touching src/pdf/generate.js
Read trigger: before redesigning PDF layout, row geometry, pagination, or export pipeline.
-->

# PDF schedule print -- reference

## Output path

- `src/pdf/generate.js` -- `buildScheduleHtml` (pure HTML string), `generateSchedulePDF` (Blob URL + target tab).
- `src/App.jsx` -- opens `about:blank` **synchronously** on Export PDF click, then `import('./pdf/generate')`, passes tab to `generateSchedulePDF` (avoids popup blockers).
- Email attach path reuses `buildScheduleHtml` payload (MailApp PDF path in Apps Script).

## Current layout (2026-05)

- **Page:** Legal **portrait**; `@page { margin: 5mm }`; body `max-width` ~200mm for on-screen preview.
- **Flow:** Staff Week 1 table -> forced page break -> Staff Week 2 -> forced page break -> `.page-3` (either **both admin week tables** when non-primary-contact admins exist, or **info-only** `page3InfoFooterHtml` when none). If admins exist, another break -> `.page-3-info` repeats announcement + legend + footer (same `page3InfoFooterHtml` fragment).
- **Brand lockup:** OVER THE / RAINBOW renders **only** at the top of `page3InfoFooterHtml` (final sheet when admins exist; last sheet when staff-only). Classes `.pdf-brand-lockup`, `__over`, `__wordmark` (Josefin Sans; sized for hierarchy vs announcement/legend). **No** wordmark above Staff Week 1 -- supports wall display when the info sheet is pinned at the top.
- **Week 1 inset:** `@media print` rule `.no-print + .wk-block.staff { padding-top: 5mm }` matches the top inset Staff Week 2 gets via `.wk-block.staff + .wk-block.staff`.
- **Row geometry:** Per-week `--pdf-row-mm` from `pdfRowMmForEmployeeCount(employeeCount, dividerCount, usableTbodyMm)`; dividers counted via `countScheduleDisplayDividers`. Uniform `tr`/`td` heights in print CSS; no variable row growth inside grid.
- **Employee column:** `colgroup` `.pdf-col-employee` **24mm**; first-name cell **nowrap** + ellipsis (avoid `word-break` splitting names).
- **Data parity:** Same schedulable pool + `sortSchedulableByHierarchy` + divider groups as in-app (`employeeSort.js`). PDF splits primary contact (`PRIMARY_CONTACT_EMAIL`) + floor staff vs other admins/admin2 onto staff vs admin pages (unchanged routing).
- **Palette:** Grayscale / glyphs / borders only (break-room B&W printer).

## Related code

- `src/utils/employeeSort.js` -- hierarchy sort + `scheduleDisplayDividerGroup`.
- `src/constants.js` -- `SCHEDULE_ROW_FIRST_NAME_ORDER`, `PRIMARY_CONTACT_EMAIL`.

## Verification checklist (when touching PDF)

- [ ] Chrome print preview: staff-only vs admin-present pagination; lockup **only** on info sheet.
- [ ] Week 1 top margin matches Week 2 when printed.
- [ ] Cells: OFF, holiday strip, events, titled rows, longest realistic first name.
- [ ] Grayscale: role glyphs still distinguish roles.

## Ownership

- JR owns density vs legibility tradeoffs; update this file when pagination or brand placement changes.
