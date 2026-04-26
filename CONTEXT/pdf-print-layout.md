<!-- SCHEMA: pdf-print-layout.md
Purpose: Problem registry for staff schedule PDF (HTML -> browser print).
Audience: Claude Code / any agent touching src/pdf/generate.js
Read trigger: before redesigning PDF layout, row geometry, or export pipeline.
-->

# PDF schedule print -- problem registry

## Output path today

- `src/pdf/generate.js` -- `generateSchedulePDF` builds HTML string, Blob URL, navigates print tab.
- `src/App.jsx` -- opens `about:blank` **synchronously** on button click, then `import('./pdf/generate')`, then passes that tab to `generateSchedulePDF` (popup blockers fire if `window.open` runs only after `await`).
- Grayscale only (break-room B&W printer); role = glyph + typography, not hue.
- `@page { size: landscape; margin: 0.3in; }` in embedded `<style>`.
- Data: same schedulable employees + two week blocks as in-app (sort, buckets, dividers).

## Competing goals (why this is not a one-line fix)

1. **Row height** -- JR: rows must not look "random" per cell; table rows should align across Mon-Sun.
2. **No clipping** -- JR: do not hide text with ellipsis / overflow cut; content should be readable.
3. **Dense grid** -- many employees x 7 days x 2 weeks; landscape has finite vertical space.
4. **Print fidelity** -- WebKit/Chrome print preview != on-paper; flex/line-clamp varies.
5. **Single artifact** -- one printable doc per export, not a separate "admin detail" app (unless we choose that).

Goals 1 and 2 conflict if "same height" means **fixed px** and "no clip" means **arbitrary note length**.
Current compromise (after 2026-04-25): `min-height` on cells, content **wraps**, **row height grows** to tallest cell in that employee row (standard HTML table). Uniform **across columns** within a row; **not** uniform across all employees.

## Approaches already tried (brief)

- Fixed inner box (~64px) + `overflow:hidden` + ellipsis on events -- uniform but clipped; rejected by JR.
- Single-line events joined with ` · ` + nowrap -- clipped; rejected.
- Taller fixed row + wrap -- still risks clip if max-height enforced; moving away from hard max.

## Solutions NOT fully explored (candidates for future work)

**Layout / CSS**

- **Continuation row** -- if cell content exceeds N lines, emit a second `<tr>` for same employee (merged name col) so no ellipsis; row count increases but nothing hidden.
- **Per-week font scale** -- measure max text length per column (client-side) or estimate from char count; apply one `font-size` for whole table for that export.
- **Narrower day columns + taller page** -- `size: landscape` + margin tweaks; or legal/ledger if printer supports.
- **Split table** -- week1 on page 1, week 2 page 2 already; could split **employees** across pages with repeated header (print thead per chunk via `display: table-header-group` + manual chunking).
- **Rotate to portrait** for schedule-only export (more vertical room, fewer employees per sheet).

**Structural**

- **Legend + codes in cells** -- e.g. `M1` for meeting type + footnote; frees horizontal space (JR must accept abbreviation).
- **Drop long notes in PDF** -- show times + type only; full note "see app" (policy call; conflicts with "all visible" unless app is explicit).
- **Second PDF page** -- "Detail" appendix listing `(emp, date, full note)` for cells with overflow risk only.

**Tech swap**

- **jsPDF / pdf-lib / Puppeteer** -- vector PDF with explicit layout engine; more control, more deps, different deploy story.
- **Server render** -- Apps Script or small API generates PDF; same layout problems but one canonical renderer.

**Process**

- **Print CSS separate from preview HTML** -- `@media print` block that tightens padding/font only for print, looser on screen (reduces "preview lies").

## Verification checklist (when changing PDF)

- [ ] Chrome print preview: empty cell, work-only, work+task, meeting-only, multi-meeting, PK, sick, OFF, stat holiday column.
- [ ] Longest real employee name + title; long meeting note; many events one day.
- [ ] Headcount row aligns with body rows; bucket divider not stretched.
- [ ] Grayscale: role glyphs + borders still distinguish roles.

## Related code

- `collectPeriodShiftsForSave` / sick + meeting rules -- PDF reads same `shifts` + `events` as grid.
- `employeeSort.js` -- `employeeBucket`, dividers must match app.

## Ownership

- JR decides tradeoff between uniform global row height vs wrap vs abbrev vs appendix.
- Update this file when a new approach ships or is ruled out (append to "tried" or DECISIONS).
