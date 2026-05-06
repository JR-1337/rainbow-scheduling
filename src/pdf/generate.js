// PDF GENERATION - Pure-grayscale output. Rainbow's break-room printer is B&W,
// so every channel carries info without hue: role = letter glyph + border style,
// Holiday = "HOL" + heavy black border, announcement =
// double border + italic. No hex hues anywhere - only black/white/grey shades.
import { toDateKey, getWeekNumber, getDayNameShort, formatDate, formatMonthWord, formatTimeShort } from '../utils/date';
import { isStatHoliday } from '../utils/storeHours';
import { hasApprovedTimeOffForDate } from '../utils/requests';
import { ROLES, ROLES_BY_ID, EVENT_TYPES, PRIMARY_CONTACT_EMAIL } from '../constants';
import { escapeHtml, stripEmoji } from '../utils/format';
import { sortBySarviAdminsFTPT, employeeBucket } from '../utils/employeeSort';
import { hasTitle, splitNameForSchedule } from '../utils/employeeRender';
import { filterSchedulableEmployees } from '../utils/employees';

const cleanText = (s) => escapeHtml(stripEmoji(s));

// Grayscale palette. One scale, no hues.
const G = {
  ink: '#000000',          // primary text, key markers
  text: '#111111',          // body text
  textMuted: '#3f3f3f',     // secondary text
  textFaint: '#6b6b6b',     // tertiary text, footnote
  rule: '#000000',          // strong rules / borders that must survive print
  border: '#9a9a9a',        // standard cell border
  borderSoft: '#c8c8c8',    // subtle divider
  fillZebra: '#f2f2f2',     // header / banded background
  fill: '#ffffff',          // cell fill
};

const ROLE_GLYPHS = {
  cashier: 'C1',
  backupCashier: 'C2',
  backupCash: 'B',
  mens: 'M',
  womens: 'W',
  floorSupervisor: 'FS',
  floorMonitor: 'FM',
  none: '',
};
// Short labels for the legend. Cells use glyph only (no spell-out).
const ROLE_LEGEND_LABEL = {
  cashier: 'Cashier 1',
  backupCashier: 'Cashier 2',
  backupCash: 'Backup Cash',
  mens: "Men's",
  womens: "Women's",
  floorSupervisor: 'Floor Sup',
  floorMonitor: 'Floor Monitor',
};

/*
  PDF schedule constraints (keep in sync when editing this file):
  - B&W / greyscale only; role = glyph + borders; no last name in grid (first name + optional title).
  - Sarvi (PRIMARY_CONTACT_EMAIL) on main staff weeks; other admin1 + admin2 on **page 3 only** (both admin weeks on that page).
  - No “Scheduled” headcount row.
  - Equal day column widths (colgroup). Uniform row height within a week table (no taller “Axl” rows).
  - Staff weeks: week 1 vs later week use different usable tbody mm; **admin page (3) is tables only**; announcement,
    legend, and contact start on the **following** page when admins exist.
  - Tune: PDF_LEGAL_INNER_MM, PDF_STAFF_WEEK*_ABOVE_TBODY_MM, PDF_ADMIN_TBODY_USABLE_MM, MIN/MAX_PDF_ROW_MM.
*/

/** Inner printable height (mm) for legal portrait with @page margin ~5mm each side ≈ 335mm. */
const PDF_LEGAL_INNER_MM = 335;
/** Chrome above tbody: OTR wordmark + week strip + thead + breathing room (staff week 1). */
const PDF_STAFF_WEEK1_ABOVE_TBODY_MM = 62;
/** Chrome above tbody: week strip + thead — staff week 2+ on a fresh page. */
const PDF_STAFF_WEEK_N_ABOVE_TBODY_MM = 28;
/** Admin page: two week grids only (no announcement on that page). Per-table tbody budget (mm) for row-mm math. */
const PDF_ADMIN_TBODY_USABLE_MM = 142;

const MIN_PDF_ROW_MM = 7;
const MAX_PDF_ROW_MM = 16;
const PDF_DIVIDER_EST_MM = 1.2;

/** Uniform row height so one week’s tbody fits usable vertical space. */
const pdfRowMmForEmployeeCount = (employeeCount, dividerCount, usableTbodyMm) => {
  if (employeeCount <= 0) return 12;
  const net = Math.max(0, usableTbodyMm - dividerCount * PDF_DIVIDER_EST_MM);
  const raw = Math.floor(net / employeeCount);
  return Math.max(MIN_PDF_ROW_MM, Math.min(MAX_PDF_ROW_MM, raw));
};

const countPdfBucketDividers = (list) => {
  let n = 0;
  for (let i = 1; i < list.length; i++) {
    if (employeeBucket(list[i]) !== employeeBucket(list[i - 1])) n++;
  }
  return n;
};

// S64 Stage 7 - events carry meeting/PK entries per `${empId}-${date}` key.
// Pure builder: returns the full print-preview HTML string. No DOM/Blob side
// effects so it can also feed the EmailModal PDF-attachment payload.
export const buildScheduleHtml = (employees, shifts, dates, periodInfo, announcement = null, timeOffRequests = [], events = {}) => {
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]);
  const weekNum2 = getWeekNumber(week2[0]);

  // Schedulable employees (admins + admin2 unless showOnSchedule; staff always).
  // Split: pages 1–2 = primary contact (Sarvi) + non-admin staff; page 3 = admin1 and admin2.
  // Admin2 uses isAdmin: false, so routing must key off adminTier === 'admin2' as well.
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const pdfIsPrimaryStoreContact = (e) => e.email === PRIMARY_CONTACT_EMAIL;
  const pdfGoesOnAdminOnlyPage = (e) =>
    (e.isAdmin || e.adminTier === 'admin2') && !pdfIsPrimaryStoreContact(e);
  const schedulableAll = sortBySarviAdminsFTPT(filterSchedulableEmployees(employees));
  const schedulableMain = schedulableAll.filter((e) => !pdfGoesOnAdminOnlyPage(e));
  const schedulableAdmins = schedulableAll.filter(pdfGoesOnAdminOnlyPage);

  // PDF contact row shows the primary store contact only (Sarvi). If her record
  // isn't found, fall back to any active admin so the PDF still lists a human.
  const primaryContact = employees.find(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted);
  const adminContacts = primaryContact
    ? [primaryContact]
    : employees.filter(e => e.isAdmin && e.active && !e.deleted);

  // Announcements: italic body + "[!]" prefix + heavy left bar + double top border.
  // Lives on page 3 (info page). When empty, box still renders so admins can pen-
  // mark notes on the printed schedule. ~3x the prior page-1 footprint per JR
  // direction, since page 3 has room.
  const announcementHtml = (announcement && announcement.message) ? `
    <div style="margin:6mm 0;padding:8mm;background:${G.fillZebra};border-radius:4px;border-left:6px solid ${G.ink};border-top:3px double ${G.ink};">
      ${announcement.subject ? `<h3 style="margin:0 0 5mm;color:${G.ink};font-size:16pt;font-weight:800;letter-spacing:0.5px;">[!] ${cleanText(announcement.subject)}</h3>` : `<h3 style="margin:0 0 5mm;color:${G.ink};font-size:16pt;font-weight:800;">[!] Announcements</h3>`}
      <div style="color:${G.text};font-size:12pt;line-height:1.6;white-space:pre-wrap;font-style:italic;">${cleanText(announcement.message)}</div>
    </div>
  ` : `
    <div style="margin:6mm 0;padding:6mm 8mm;background:#ffffff;border-radius:4px;border-left:6px solid ${G.borderSoft};border-top:3px double ${G.borderSoft};min-height:25mm;">
      <h3 style="margin:0 0 3mm;color:${G.textFaint};font-size:13pt;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Announcements</h3>
    </div>
  `;

  const makeWeekTable = (weekDates, weekNum, rowEmployees = schedulableMain, blockClass = 'wk-block staff', usableTbodyMm = PDF_LEGAL_INNER_MM - PDF_STAFF_WEEK_N_ABOVE_TBODY_MM) => {
    const schedulable = rowEmployees;
    const dividerN = countPdfBucketDividers(schedulable);
    const rowMm = pdfRowMmForEmployeeCount(schedulable.length, dividerN, usableTbodyMm);

    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      // Holiday: heavy black top border + "HOL" caption in addition to yellow bg,
      // so the marker survives greyscale printing.
      return `<th style="height:9mm;padding:1mm;border:1px solid ${G.border};${hol ? `border-top:3px solid ${G.ink};` : ''}background:${hol ? G.fillZebra : G.fillZebra};font-size:11px;text-align:center;vertical-align:middle;overflow:hidden;box-sizing:border-box;">
        ${hol ? `<div style="font-size:5pt;font-weight:800;color:${G.ink};letter-spacing:1px;line-height:1;">HOL</div>` : ''}
        <div style="font-weight:700;color:${G.text};text-transform:uppercase;font-size:7pt;line-height:1.1;">${getDayNameShort(d)}</div>
        <div style="font-size:11pt;font-weight:700;color:${G.ink};line-height:1.1;">${d.getDate()}</div>
      </th>`;
    }).join('');

    // Events: one line per item, truncated with ellipsis for portrait density.
    // detail note dropped for density (ev.note not rendered in cell body).
    // Meeting + PK don't show times (just the glyph) since their times are
    // typically the same store-wide and aren't actionable info per-cell. Sick
    // keeps its time so partial-day sick is readable.
    const eventBadgeHtml = (evs) => {
      if (!evs.length) return '';
      const lines = evs.map((ev) => {
        const et = EVENT_TYPES[ev.type];
        if (!et) return '';
        const hideTime = ev.type === 'meeting' || ev.type === 'pk';
        const timeStr = hideTime ? '' : ` ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}`;
        return `<div style="font-size:5pt;line-height:1.2;color:${G.textMuted};word-break:break-word;overflow-wrap:anywhere;margin-top:0.5px;"><strong style="color:${G.ink};">${et.shortLabel}</strong>${timeStr}</div>`;
      }).filter(Boolean);
      if (!lines.length) return '';
      return `<div style="margin-top:1px;">${lines.join('')}</div>`;
    };

    const dividerColspan = weekDates.length + 1;
    const dividerRow = `<tr class="pdf-divider"><td colspan="${dividerColspan}" style="padding:0;border:0;background:${G.fill};"><div style="height:1px;background:${G.border};margin:3px 8px;"></div></td></tr>`;
    const rows = schedulable.map((emp, i) => {
      const showDivider = i > 0 && employeeBucket(emp) !== employeeBucket(schedulable[i - 1]);
      const cells = weekDates.map(date => {
        const dateStr = toDateKey(date);
        const shift = shifts[`${emp.id}-${dateStr}`];
        const dayEvents = (events[`${emp.id}-${dateStr}`] || []).filter(ev => EVENT_TYPES[ev.type]);
        // Approved time-off wins over events - an employee on time-off shouldn't
        // show a meeting/PK card even if one was scheduled before the request was approved.
        if (!shift && hasApprovedTimeOffForDate(emp.email, dateStr, timeOffRequests)) {
          return `<td class="pdf-grid-cell" style="border:1px dashed ${G.border};background:${G.fill};text-align:center;vertical-align:top;">
            <div class="pdf-cell-inner pdf-cell-inner--fill" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
              <div style="font-size:7pt;font-weight:800;color:${G.ink};letter-spacing:1px;line-height:1.1;">OFF</div>
              <div style="font-size:5pt;color:${G.textFaint};line-height:1.1;">approved</div>
            </div>
          </td>`;
        }
        if (!shift && dayEvents.length === 0) {
          return `<td class="pdf-grid-cell" style="border:1px solid ${G.border};background:${G.fill};vertical-align:top;"><div class="pdf-cell-inner pdf-cell-inner--fill"></div></td>`;
        }
        if (!shift) {
          return `<td class="pdf-grid-cell" style="border:1px solid ${G.border};background:${G.fillZebra};text-align:left;vertical-align:top;">
            <div class="pdf-cell-inner pdf-cell-inner--fill" style="display:flex;flex-direction:column;justify-content:flex-start;">
              ${eventBadgeHtml(dayEvents)}
            </div>
          </td>`;
        }
        const isTitled = hasTitle(emp);
        const glyph = isTitled ? '' : (ROLE_GLYPHS[shift.role] || '');
        // Uniform 1px grey border for all shift cells. Role signal lives in the
        // glyph (FS / FM / etc.), not in border weight.
        const cellBorder = `border:1px solid ${G.border};`;
        const shiftCellFill = G.fillZebra;
        // Glyph + time + events: flex row so nothing is absolutely positioned
        // on top of wrapped MTG/PK/SICK lines.
        return `<td class="pdf-grid-cell" style="${cellBorder}background:${shiftCellFill};text-align:left;vertical-align:top;">
          <div class="pdf-cell-inner pdf-cell-inner--fill pdf-cell-shift" style="display:flex;align-items:flex-start;gap:0.8mm;">
            ${glyph ? `<span style="flex:0 0 auto;font-size:8pt;font-weight:800;color:${G.ink};line-height:1.1;letter-spacing:-0.5px;">${glyph}</span>` : ''}
            <div style="flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:0;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5mm;min-width:0;">
                <span style="font-size:8.5pt;font-weight:600;color:${G.ink};line-height:1.15;word-break:break-word;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</span>
                ${shift.task ? `<span style="font-size:7pt;font-weight:800;color:${G.ink};line-height:1;flex-shrink:0;">★</span>` : ''}
              </div>
              ${eventBadgeHtml(dayEvents)}
            </div>
          </div>
        </td>`;
      }).join('');

      const titleStr = hasTitle(emp) && (emp.title || '').trim() ? cleanText(emp.title.trim()) : '';
      const { first: nameFirst } = splitNameForSchedule(emp.name);
      return `${showDivider ? dividerRow : ''}<tr class="schedule-row" style="page-break-inside:avoid;">
        <td class="pdf-grid-cell" style="border:1px solid ${G.border};background:${G.fill};vertical-align:top;">
          <div class="pdf-cell-inner pdf-cell-inner--fill" style="display:flex;flex-direction:column;justify-content:flex-start;gap:0.5mm;">
            <div style="font-weight:700;font-size:10pt;line-height:1.05;color:${G.ink};word-break:break-word;hyphens:auto;">${cleanText(nameFirst)}</div>
            ${titleStr ? `<div style="font-size:5.5pt;color:${G.textMuted};line-height:1.1;font-style:italic;word-break:break-word;">${titleStr}</div>` : ''}
          </div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    return `
      <div class="${blockClass} pdf-week-wrap" style="margin-bottom:10px;">
        <div style="background:${G.ink};padding:2mm 4mm;border-radius:4px 4px 0 0;display:flex;align-items:baseline;gap:4mm;">
          <h3 style="margin:0;color:#ffffff;font-size:11pt;font-weight:700;line-height:1;">Week ${weekNum}</h3>
          <span style="color:#dddddd;font-size:8pt;line-height:1;">${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}</span>
        </div>
        <table class="schedule-grid" style="--pdf-row-mm:${rowMm}mm;width:100%;table-layout:fixed;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;">
          <colgroup>
            <col class="pdf-col-employee" />
            <col class="pdf-col-day" /><col class="pdf-col-day" /><col class="pdf-col-day" /><col class="pdf-col-day" /><col class="pdf-col-day" /><col class="pdf-col-day" /><col class="pdf-col-day" />
          </colgroup>
          <thead style="display:table-header-group;"><tr><th class="pdf-employee-th" style="height:10mm;min-height:10mm;padding:1mm;border:1px solid ${G.border};background:${G.fillZebra};font-size:7pt;text-align:left;color:${G.text};text-transform:uppercase;vertical-align:middle;overflow:hidden;box-sizing:border-box;">Employee</th>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  // Legend: glyph + short label only. Role spell-out removed from cells; legend is the canonical reference.
  const legendItems = ROLES.filter(r => r.id !== 'none').map(r => {
    const g = ROLE_GLYPHS[r.id] || '';
    const label = ROLE_LEGEND_LABEL[r.id] || escapeHtml(r.fullName);
    return `<span style="margin-right:8px;font-size:8pt;display:inline-flex;align-items:center;gap:3px;">
      <span style="display:inline-block;min-width:14px;font-weight:800;font-size:8pt;color:${G.ink};text-align:center;letter-spacing:-0.5px;">${g}</span>
      <span style="color:${G.text};">${label}</span>
    </span>`;
  }).join('');

  const eventLegendItems = ['meeting', 'pk', 'sick'].map((key) => {
    const et = EVENT_TYPES[key];
    if (!et) return '';
    return `<span style="margin-right:8px;font-size:8pt;display:inline-flex;align-items:center;gap:3px;">
      <span style="font-weight:800;font-size:8pt;color:${G.ink};letter-spacing:0.3px;">${et.shortLabel}</span>
      <span style="color:${G.text};">${escapeHtml(et.label)}</span>
    </span>`;
  }).join('');

  const adminContactsHtml = adminContacts.length > 0
    ? `<div style="margin-top:3mm;font-size:7pt;color:${G.text};">Contact: ${adminContacts.map(a => `${cleanText(a.name)} <span style="color:${G.ink};font-weight:600;">${cleanText(a.email)}</span>`).join(' &nbsp;·&nbsp; ')}</div>`
    : '';

  const printedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const staffTbodyUsableWeek1 = PDF_LEGAL_INNER_MM - PDF_STAFF_WEEK1_ABOVE_TBODY_MM;
  const staffTbodyUsableWeekN = PDF_LEGAL_INNER_MM - PDF_STAFF_WEEK_N_ABOVE_TBODY_MM;
  const adminTbodyUsable = PDF_ADMIN_TBODY_USABLE_MM;

  const page3InfoFooterHtml = `
    ${announcementHtml}
    <div style="margin-top:6mm;padding:2mm 3mm;background:${G.fillZebra};border-radius:4px;border:1px solid ${G.border};">
      <div style="margin-bottom:2px;font-weight:700;font-size:7pt;color:${G.textMuted};text-transform:uppercase;letter-spacing:1px;">Legend</div>
      <div style="display:flex;flex-wrap:wrap;gap:2mm;align-items:center;">${legendItems}${eventLegendItems}<span style="font-size:8pt;display:inline-flex;align-items:center;gap:3px;"><span style="color:${G.ink};font-weight:700;">★</span><span style="color:${G.text};">Has Task</span></span><span style="font-size:8pt;display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;padding:0 4px;border:1px dashed ${G.border};font-weight:800;color:${G.ink};font-size:7pt;letter-spacing:1px;">OFF</span><span style="color:${G.text};">Approved Time Off</span></span></div>
    </div>
    ${adminContactsHtml}
    <div style="margin-top:4mm;padding-top:2mm;border-top:1px solid ${G.border};text-align:center;font-size:6pt;color:${G.textFaint};">
      Printed ${printedAt} • This is a snapshot - live schedule at rainbow-scheduling.vercel.app
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rainbow Schedule - Week ${weekNum1} & ${weekNum2}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0; }
      @page { size: legal portrait; margin: 5mm; }
      .no-print { display: none !important; }
      /* Week 2 always starts a fresh page. Week 1 flows naturally below the
         header instead of being pushed whole to page 2 when the 14-row block
         can't fit alongside the header (caused the big page-1 gap). Row-level
         break protection (tr rule below) still keeps individual rows intact. */
      .wk-block.staff + .wk-block.staff {
        break-before: page;
        page-break-before: always;
        padding-top: 5mm;
      }
      .page-3 {
        break-before: page;
        page-break-before: always;
        padding-top: 5mm;
      }
      .page-3-info {
        break-before: page;
        page-break-before: always;
        padding-top: 5mm;
      }
      tr { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
    }
    body { font-family: 'Inter', Arial, sans-serif; padding: 0; margin: 0 auto; max-width: 200mm; background: #ffffff; color: ${G.text}; }
    .print-btn { background: ${G.ink}; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: ${G.text}; }
    .wk-block,
    .pdf-week-wrap {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .schedule-grid col.pdf-col-employee { width: 22mm; }
    /* Seven day columns share the rest of the row equally (table-layout: fixed). */
    .schedule-grid col.pdf-col-day { width: auto; }
    /* --pdf-row-mm set per table from employee count vs usable tbody height (one week per page). */
    .schedule-grid tbody tr.schedule-row {
      height: var(--pdf-row-mm, 12mm);
      max-height: var(--pdf-row-mm, 12mm);
    }
    .schedule-grid tbody tr.schedule-row td.pdf-grid-cell {
      height: var(--pdf-row-mm, 12mm) !important;
      min-height: var(--pdf-row-mm, 12mm) !important;
      max-height: var(--pdf-row-mm, 12mm) !important;
      padding: 1.5mm !important;
      vertical-align: top;
      overflow: hidden;
      box-sizing: border-box;
    }
    .schedule-grid tbody tr.schedule-row .pdf-cell-inner--fill {
      height: 100%;
      max-height: 100%;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }
    .schedule-grid tbody tr.schedule-row .pdf-cell-shift {
      min-height: 0;
    }
    .schedule-grid .pdf-cell-inner {
      box-sizing: border-box;
    }
    @media print {
      .wk-block,
      .pdf-week-wrap {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .schedule-grid tbody tr.schedule-row {
        height: var(--pdf-row-mm, 12mm);
        max-height: var(--pdf-row-mm, 12mm);
      }
      .schedule-grid tbody tr.schedule-row td.pdf-grid-cell {
        height: var(--pdf-row-mm, 12mm) !important;
        min-height: var(--pdf-row-mm, 12mm) !important;
        max-height: var(--pdf-row-mm, 12mm) !important;
        overflow: hidden;
      }
    }
    .schedule-grid tbody tr.pdf-divider td {
      height: auto !important;
      max-height: 10px !important;
      overflow: visible !important;
      padding: 0 !important;
      line-height: 0 !important;
    }
  </style>
</head>
<body style="background:#ffffff;">
  <div class="no-print" style="position:sticky;top:0;background:#ffffff;padding:10px 0;margin-bottom:10px;border-bottom:1px solid ${G.border};text-align:right;z-index:10;">
    <button class="print-btn" onclick="window.print()">Print Schedule</button>
    <span style="margin-left:15px;color:${G.textFaint};font-size:11px;">Review the preview below, then click Print.</span>
  </div>
  <div style="text-align:center;margin-bottom:3mm;padding-bottom:2mm;border-bottom:2px solid ${G.ink};">
    <div style="font-family:'Josefin Sans',sans-serif;line-height:1;">
      <span style="color:${G.textMuted};font-size:8px;letter-spacing:3px;">OVER THE</span><br>
      <span style="color:${G.ink};font-size:18px;letter-spacing:4px;font-weight:700;">RAINBOW</span>
    </div>
  </div>

  ${makeWeekTable(week1, weekNum1, schedulableMain, 'wk-block staff', staffTbodyUsableWeek1)}
  ${makeWeekTable(week2, weekNum2, schedulableMain, 'wk-block staff', staffTbodyUsableWeekN)}

  <div class="page-3">
    ${schedulableAdmins.length > 0 ? `
      ${makeWeekTable(week1, weekNum1, schedulableAdmins, 'wk-block admin', adminTbodyUsable)}
      ${makeWeekTable(week2, weekNum2, schedulableAdmins, 'wk-block admin', adminTbodyUsable)}
    ` : page3InfoFooterHtml}
  </div>
  ${schedulableAdmins.length > 0 ? `<div class="page-3-info">${page3InfoFooterHtml}</div>` : ''}
</body>
</html>`;

  return html;
};

// `targetWindow`: optional tab opened synchronously from the click handler (before
// dynamic import). Browsers block window.open() after await; App passes a blank tab.
export const generateSchedulePDF = (employees, shifts, dates, periodInfo, announcement = null, timeOffRequests = [], events = {}, targetWindow = null) => {
  const html = buildScheduleHtml(employees, shifts, dates, periodInfo, announcement, timeOffRequests, events);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  if (targetWindow) {
    try {
      targetWindow.opener = null;
    } catch (_) { /* noop */ }
    targetWindow.location.href = url;
  } else {
    const printWindow = window.open(url, '_blank', 'width=1100,height=750');
    if (!printWindow) {
      // iOS Safari popup-blocked path. Do NOT fall back to <a download>:
      // Safari iOS ignores the download attr on blob URLs and saves the
      // raw blob as "*.blob". Navigate the current tab instead -- the
      // document has its own in-page Print button.
      window.location.href = url;
    }
  }
  // Do not revoke quickly: some browsers unload blob documents when the URL is revoked.
  setTimeout(() => URL.revokeObjectURL(url), 600000);
};
