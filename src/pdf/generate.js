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

// S64 Stage 7 - events carry meeting/PK entries per `${empId}-${date}` key.
// `targetWindow`: optional tab opened synchronously from the click handler (before
// dynamic import). Browsers block window.open() after await; App passes a blank tab.
export const generateSchedulePDF = (employees, shifts, dates, periodInfo, announcement = null, timeOffRequests = [], events = {}, targetWindow = null) => {
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]);
  const weekNum2 = getWeekNumber(week2[0]);

  // Filter schedulable employees (exclude owner, exclude admins unless showOnSchedule).
  // Split: staff pages (1+2) get Sarvi + non-admins; page 3 gets all other admins.
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const schedulableAll = sortBySarviAdminsFTPT(filterSchedulableEmployees(employees));
  const schedulableMain = schedulableAll.filter(e => !e.isAdmin || e.email === PRIMARY_CONTACT_EMAIL);
  const schedulableAdmins = schedulableAll.filter(e => e.isAdmin && e.email !== PRIMARY_CONTACT_EMAIL);

  // PDF contact row shows the primary store contact only (Sarvi). If her record
  // isn't found, fall back to any active non-owner admin so the PDF still lists
  // a human to contact.
  const primaryContact = employees.find(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted);
  const adminContacts = primaryContact
    ? [primaryContact]
    : employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);

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

  const makeWeekTable = (weekDates, weekNum, rowEmployees = schedulableMain, blockClass = 'wk-block staff') => {
    const schedulable = rowEmployees;
    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      // Holiday: heavy black top border + "HOL" caption in addition to yellow bg,
      // so the marker survives greyscale printing.
      return `<th style="height:10mm;padding:1mm;border:1px solid ${G.border};${hol ? `border-top:3px solid ${G.ink};` : ''}background:${hol ? G.fillZebra : G.fillZebra};font-size:11px;text-align:center;vertical-align:middle;overflow:hidden;box-sizing:border-box;">
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
        return `<div style="font-size:5pt;line-height:1.1;color:${G.textMuted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:0.5px;"><strong style="color:${G.ink};">${et.shortLabel}</strong>${timeStr}</div>`;
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
          return `<td style="padding:1mm;border:1px dashed ${G.border};background:${G.fill};text-align:center;vertical-align:middle;">
            <div class="pdf-cell-inner" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
              <div style="font-size:7pt;font-weight:800;color:${G.ink};letter-spacing:1px;line-height:1.1;">OFF</div>
              <div style="font-size:5pt;color:${G.textFaint};line-height:1.1;">approved</div>
            </div>
          </td>`;
        }
        if (!shift && dayEvents.length === 0) {
          return `<td style="padding:1mm;border:1px solid ${G.border};background:${G.fill};vertical-align:top;"><div class="pdf-cell-inner"></div></td>`;
        }
        if (!shift) {
          return `<td style="padding:1mm;border:1px solid ${G.border};background:${G.fillZebra};text-align:left;vertical-align:top;">
            <div class="pdf-cell-inner" style="display:flex;flex-direction:column;justify-content:flex-start;">
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
        // Glyph absolute at top-left; time range on first line; events below.
        // Role spell-out line DROPPED. Hours "Nh" line DROPPED.
        return `<td style="padding:1mm;${cellBorder}background:${shiftCellFill};text-align:left;vertical-align:top;">
          <div class="pdf-cell-inner" style="position:relative;${glyph ? 'padding-left:5mm;' : ''}">
            ${glyph ? `<span style="position:absolute;top:0;left:0;font-size:8pt;font-weight:800;color:${G.ink};line-height:1;letter-spacing:-0.5px;">${glyph}</span>` : ''}
            ${shift.task ? `<span style="position:absolute;top:0;right:0;font-size:7pt;font-weight:800;color:${G.ink};line-height:1;">★</span>` : ''}
            <div style="font-size:8.5pt;font-weight:600;color:${G.ink};line-height:1.15;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</div>
            ${eventBadgeHtml(dayEvents)}
          </div>
        </td>`;
      }).join('');

      const titleStr = hasTitle(emp) && (emp.title || '').trim() ? cleanText(emp.title.trim()) : '';
      const { first: nameFirst, rest: nameRest } = splitNameForSchedule(emp.name);
      return `${showDivider ? dividerRow : ''}<tr class="schedule-row" style="page-break-inside:avoid;">
        <td style="padding:1mm;border:1px solid ${G.border};background:${G.fill};width:22mm;vertical-align:top;">
          <div class="pdf-cell-inner" style="display:flex;flex-direction:column;justify-content:center;">
            <div style="font-weight:700;font-size:10pt;line-height:1.05;color:${G.ink};word-break:break-word;hyphens:auto;">${cleanText(nameFirst)}</div>
            ${nameRest ? `<div style="font-weight:700;font-size:10pt;line-height:1.05;color:${G.ink};word-break:break-word;hyphens:auto;">${cleanText(nameRest)}</div>` : ''}
            ${titleStr ? `<div style="font-size:5.5pt;color:${G.textMuted};line-height:1.1;font-style:italic;word-break:break-word;">${titleStr}</div>` : ''}
          </div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    const headcountCells = weekDates.map(date => {
      const dateStr = toDateKey(date);
      const count = schedulable.reduce((n, emp) => {
        if (!shifts[`${emp.id}-${dateStr}`]) return n;
        const evs = events[`${emp.id}-${dateStr}`];
        if (evs && evs.some(e => e.type === 'sick')) return n;
        return n + 1;
      }, 0);
      return `<td style="padding:1mm;border:1px solid ${G.border};background:${G.fillZebra};text-align:center;vertical-align:middle;">
        <div class="pdf-cell-inner" style="display:flex;align-items:center;justify-content:center;font-size:11pt;font-weight:700;color:${G.ink};">${count}</div>
      </td>`;
    }).join('');
    const headcountRow = `<tr class="schedule-row" style="page-break-inside:avoid;">
      <td style="padding:1mm;border:1px solid ${G.border};background:${G.fillZebra};width:22mm;vertical-align:middle;">
        <div class="pdf-cell-inner" style="display:flex;align-items:center;font-size:7pt;font-weight:700;color:${G.text};text-transform:uppercase;letter-spacing:1px;">Scheduled</div>
      </td>
      ${headcountCells}
    </tr>`;

    return `
      <div class="${blockClass}" style="margin-bottom:10px;">
        <div style="background:${G.ink};padding:2mm 4mm;border-radius:4px 4px 0 0;display:flex;align-items:baseline;gap:4mm;">
          <h3 style="margin:0;color:#ffffff;font-size:11pt;font-weight:700;line-height:1;">Week ${weekNum}</h3>
          <span style="color:#dddddd;font-size:8pt;line-height:1;">${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}</span>
        </div>
        <table class="schedule-grid" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;">
          <thead style="display:table-header-group;"><tr><th style="height:10mm;padding:1mm;border:1px solid ${G.border};background:${G.fillZebra};width:22mm;font-size:7pt;text-align:left;color:${G.text};text-transform:uppercase;vertical-align:middle;overflow:hidden;box-sizing:border-box;">Employee</th>${headers}</tr></thead>
          <tbody>${rows}${headcountRow}</tbody>
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
      tr { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
    }
    body { font-family: 'Inter', Arial, sans-serif; padding: 0; margin: 0 auto; max-width: 200mm; background: #ffffff; color: ${G.text}; }
    .print-btn { background: ${G.ink}; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: ${G.text}; }
    /* Fixed cell height enforces consistent grid. overflow:hidden clips any
       implausible edge-case (5+ events) without growing the row. */
    .schedule-grid tbody tr.schedule-row td {
      height: 8.5mm;
      vertical-align: top;
      overflow: hidden;
      box-sizing: border-box;
    }
    .schedule-grid .pdf-cell-inner {
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }
    @media print {
      .schedule-grid tbody tr.schedule-row td {
        height: 8.5mm;
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

  ${makeWeekTable(week1, weekNum1)}
  ${makeWeekTable(week2, weekNum2)}

  <div class="page-3">
    ${schedulableAdmins.length > 0 ? `
      ${makeWeekTable(week1, weekNum1, schedulableAdmins, 'wk-block admin')}
      ${makeWeekTable(week2, weekNum2, schedulableAdmins, 'wk-block admin')}
    ` : ''}

    ${announcementHtml}

    <div style="margin-top:6mm;padding:2mm 3mm;background:${G.fillZebra};border-radius:4px;border:1px solid ${G.border};">
      <div style="margin-bottom:2px;font-weight:700;font-size:7pt;color:${G.textMuted};text-transform:uppercase;letter-spacing:1px;">Legend</div>
      <div style="display:flex;flex-wrap:wrap;gap:2mm;align-items:center;">${legendItems}${eventLegendItems}<span style="font-size:8pt;display:inline-flex;align-items:center;gap:3px;"><span style="color:${G.ink};font-weight:700;">★</span><span style="color:${G.text};">Has Task</span></span><span style="font-size:8pt;display:inline-flex;align-items:center;gap:3px;"><span style="display:inline-block;padding:0 4px;border:1px dashed ${G.border};font-weight:800;color:${G.ink};font-size:7pt;letter-spacing:1px;">OFF</span><span style="color:${G.text};">Approved Time Off</span></span></div>
    </div>
    ${adminContactsHtml}
    <div style="margin-top:4mm;padding-top:2mm;border-top:1px solid ${G.border};text-align:center;font-size:6pt;color:${G.textFaint};">
      Printed ${printedAt} • This is a snapshot - live schedule at rainbow-scheduling.vercel.app
    </div>
  </div>
</body>
</html>`;

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
