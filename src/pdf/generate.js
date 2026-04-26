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
import { hasTitle } from '../utils/employeeRender';

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
  floorMonitor: 'F',
  none: '',
};
// Monogram + typography system. Cell perimeter stays uniform 1px grey (the
// grid). Role signal lives entirely in the content: a large letter glyph
// stamped at top-left, plus a family-scoped type treatment on the role name.
// cash (C / 2 / B):      BOLD UPPERCASE
// section (M / W):       Medium Title Case
// monitor (F):           Italic
// none:                  plain
const ROLE_FAMILY = {
  cashier: 'cash',
  backupCashier: 'cash',
  backupCash: 'cash',
  mens: 'section',
  womens: 'section',
  floorSupervisor: 'monitor',
  floorMonitor: 'monitor',
  none: 'none',
};
const roleNameStyle = (family) => {
  if (family === 'cash')    return 'font-weight:800;text-transform:uppercase;letter-spacing:0.5px;';
  if (family === 'section') return 'font-weight:600;';
  if (family === 'monitor') return 'font-weight:500;font-style:italic;';
  return 'font-weight:500;';
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
  // Sort: Sarvi, other admins (alpha), full-time (alpha), part-time (alpha).
  const schedulable = sortBySarviAdminsFTPT(
    employees
      .filter(e => e.active && !e.deleted && !e.isOwner)
      .filter(e => !e.isAdmin || e.showOnSchedule)
  );

  // PDF contact row shows the primary store contact only (Sarvi). If her record
  // isn't found, fall back to any active non-owner admin so the PDF still lists
  // a human to contact.
  const primaryContact = employees.find(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted);
  const adminContacts = primaryContact
    ? [primaryContact]
    : employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);

  // Announcement: italic body + "[!]" prefix + heavy left bar + double top border.
  const announcementHtml = (announcement && announcement.message) ? `
    <div style="margin:15px 0;padding:15px;background:${G.fillZebra};border-radius:4px;border-left:6px solid ${G.ink};border-top:3px double ${G.ink};">
      ${announcement.subject ? `<h3 style="margin:0 0 10px;color:${G.ink};font-size:13px;font-weight:800;letter-spacing:0.5px;">[!] ${cleanText(announcement.subject)}</h3>` : `<h3 style="margin:0 0 10px;color:${G.ink};font-size:13px;font-weight:800;">[!] Announcement</h3>`}
      <div style="color:${G.text};font-size:11px;line-height:1.6;white-space:pre-wrap;font-style:italic;">${cleanText(announcement.message)}</div>
    </div>
  ` : '';

  const makeWeekTable = (weekDates, weekNum) => {
    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      // Holiday: heavy black top border + "HOL" caption in addition to yellow bg,
      // so the marker survives greyscale printing.
      return `<th style="height:52px;max-height:52px;padding:4px;border:1px solid ${G.border};${hol ? `border-top:3px solid ${G.ink};` : ''}background:${hol ? G.fillZebra : G.fillZebra};font-size:11px;text-align:center;vertical-align:middle;overflow:hidden;box-sizing:border-box;">
        ${hol ? `<div style="font-size:7px;font-weight:800;color:${G.ink};letter-spacing:1px;line-height:1;">HOL</div>` : ''}
        <div style="font-weight:700;color:${G.text};text-transform:uppercase;font-size:9px;line-height:1.1;">${getDayNameShort(d)}</div>
        <div style="font-size:15px;font-weight:700;color:${G.ink};line-height:1.1;">${d.getDate()}</div>
      </th>`;
    }).join('');

    // Events: one wrapped line per item so nothing is ellipsis-clipped; row height
    // follows the tallest cell in that table row (all day columns stay aligned).
    const eventBadgeHtml = (evs) => {
      if (!evs.length) return '';
      const lines = evs.map((ev) => {
        const et = EVENT_TYPES[ev.type];
        if (!et) return '';
        const detailNote = ev.note && ev.type !== 'meeting' && ev.type !== 'pk' ? ` ${cleanText(ev.note)}` : '';
        return `<div style="font-size:6px;line-height:1.25;color:${G.textMuted};word-break:break-word;hyphens:auto;margin-top:1px;"><strong style="color:${G.ink};">${et.shortLabel}</strong> ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${detailNote}</div>`;
      }).filter(Boolean);
      if (!lines.length) return '';
      return `<div style="margin-top:2px;">${lines.join('')}</div>`;
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
          return `<td style="padding:4px;border:1px dashed ${G.border};background:${G.fill};text-align:center;vertical-align:middle;">
            <div class="pdf-cell-inner" style="min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
              <div style="font-size:9px;font-weight:800;color:${G.ink};letter-spacing:1px;line-height:1.1;">OFF</div>
              <div style="font-size:7px;color:${G.textFaint};line-height:1.1;">approved</div>
            </div>
          </td>`;
        }
        if (!shift && dayEvents.length === 0) {
          return `<td style="padding:4px;border:1px solid ${G.border};background:${G.fill};vertical-align:top;"><div class="pdf-cell-inner" style="min-height:52px;"></div></td>`;
        }
        if (!shift) {
          return `<td style="padding:4px;border:2px solid ${G.ink};background:${G.fillZebra};text-align:left;vertical-align:top;">
            <div class="pdf-cell-inner" style="min-height:52px;display:flex;flex-direction:column;justify-content:flex-start;">
              ${eventBadgeHtml(dayEvents)}
            </div>
          </td>`;
        }
        const isTitled = hasTitle(emp);
        const role = ROLES_BY_ID[shift.role];
        const roleName = role?.name || 'Shift';
        const family = isTitled ? 'none' : (ROLE_FAMILY[shift.role] || 'none');
        const glyph = isTitled ? '' : (ROLE_GLYPHS[shift.role] || '');
        // Supervisory roles "own" their perimeter: 2px ink border wins over the
        // surrounding 1px grey grid via border-collapse thickness rules.
        // Titled admins always use the standard 1px grey border (no role-based override).
        const cellBorder = (!isTitled && (shift.role === 'floorMonitor' || shift.role === 'floorSupervisor'))
          ? `border:2px solid ${G.ink};`
          : `border:1px solid ${G.border};`;
        const roleTitleLine = !isTitled
          ? `<div style="font-size:7px;color:${G.ink};line-height:1.2;margin-bottom:1px;word-break:break-word;${roleNameStyle(family)}">${cleanText(roleName)}</div>`
          : '';
        const shiftCellFill = isTitled ? G.fillZebra : G.fill;
        const glyphPad = glyph ? 'padding-left:12px;' : '';
        return `<td style="padding:4px;${cellBorder}background:${shiftCellFill};text-align:left;vertical-align:top;">
          <div class="pdf-cell-inner" style="position:relative;min-height:52px;${glyphPad}">
            ${glyph ? `<span style="position:absolute;top:0;left:0;font-size:8px;font-weight:800;color:${G.ink};line-height:1;letter-spacing:-0.5px;">${glyph}</span>` : ''}
            ${roleTitleLine}
            <div style="font-size:8px;color:${G.text};line-height:1.2;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</div>
            <div style="font-size:7px;color:${G.textMuted};line-height:1.2;">${shift.hours}h${shift.task ? ` <span style="color:${G.ink};font-weight:800;">★</span>` : ''}</div>
            ${eventBadgeHtml(dayEvents)}
          </div>
        </td>`;
      }).join('');

      const titleStr = hasTitle(emp) && (emp.title || '').trim() ? cleanText(emp.title.trim()) : '';
      return `${showDivider ? dividerRow : ''}<tr class="schedule-row" style="page-break-inside:avoid;">
        <td style="padding:4px;border:1px solid ${G.border};background:${G.fill};width:22%;min-width:120px;vertical-align:top;">
          <div class="pdf-cell-inner" style="min-height:52px;display:flex;flex-direction:column;justify-content:center;gap:2px;">
            <div style="font-weight:700;font-size:9px;color:${G.ink};line-height:1.2;word-break:break-word;">${cleanText(emp.name)}</div>
            ${titleStr ? `<div style="font-size:7px;color:${G.textMuted};line-height:1.2;word-break:break-word;">${titleStr}</div>` : ''}
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
      return `<td style="padding:4px;border:1px solid ${G.border};background:${G.fillZebra};text-align:center;vertical-align:middle;">
        <div class="pdf-cell-inner" style="min-height:52px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${G.ink};">${count}</div>
      </td>`;
    }).join('');
    const headcountRow = `<tr class="schedule-row" style="page-break-inside:avoid;">
      <td style="padding:4px;border:1px solid ${G.border};background:${G.fillZebra};width:22%;min-width:120px;vertical-align:middle;">
        <div class="pdf-cell-inner" style="min-height:52px;display:flex;align-items:center;font-size:9px;font-weight:700;color:${G.text};text-transform:uppercase;letter-spacing:1px;">Scheduled</div>
      </td>
      ${headcountCells}
    </tr>`;

    return `
      <div class="wk-block" style="margin-bottom:25px;">
        <div style="background:${G.ink};padding:10px 15px;border-radius:4px 4px 0 0;">
          <h3 style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">Week ${weekNum}</h3>
          <p style="margin:2px 0 0;color:#dddddd;font-size:11px;">${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}</p>
        </div>
        <table class="schedule-grid" style="width:100%;table-layout:fixed;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;">
          <thead style="display:table-header-group;"><tr><th style="height:52px;max-height:52px;padding:6px;border:1px solid ${G.border};background:${G.fillZebra};width:22%;min-width:120px;font-size:10px;text-align:left;color:${G.text};text-transform:uppercase;vertical-align:middle;overflow:hidden;box-sizing:border-box;">Employee</th>${headers}</tr></thead>
          <tbody>${rows}${headcountRow}</tbody>
        </table>
      </div>
    `;
  };

  // Legend: monogram glyph + family-typed role name, matching cell treatment.
  const legendItems = ROLES.filter(r => r.id !== 'none').map(r => {
    const g = ROLE_GLYPHS[r.id] || '';
    const family = ROLE_FAMILY[r.id] || 'none';
    return `<span style="margin-right:15px;font-size:10px;display:inline-flex;align-items:center;gap:5px;">
      <span style="display:inline-block;min-width:18px;font-weight:800;font-size:11px;color:${G.ink};text-align:center;letter-spacing:-0.5px;">${g}</span>
      <span style="color:${G.text};${roleNameStyle(family)}">${escapeHtml(r.fullName)}</span>
    </span>`;
  }).join('');

  const eventLegendItems = ['meeting', 'pk', 'sick'].map((key) => {
    const et = EVENT_TYPES[key];
    if (!et) return '';
    return `<span style="margin-right:15px;font-size:10px;display:inline-flex;align-items:center;gap:5px;">
      <span style="font-weight:800;font-size:10px;color:${G.ink};letter-spacing:0.3px;">${et.shortLabel}</span>
      <span style="color:${G.text};">${escapeHtml(et.label)}</span>
    </span>`;
  }).join('');

  const adminContactsHtml = adminContacts.length > 0 ? `
    <div style="margin-top:12px;padding:10px 15px;background:${G.fillZebra};border-radius:4px;border:1px solid ${G.border};">
      <div style="font-weight:700;font-size:9px;color:${G.textMuted};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Contact Admin</div>
      ${adminContacts.map(a => `<span style="margin-right:20px;font-size:11px;color:${G.text};">${cleanText(a.name)}: <span style="color:${G.ink};font-weight:600;">${cleanText(a.email)}</span></span>`).join('')}
    </div>
  ` : '';

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
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { margin: 0.3in; size: landscape; }
      .no-print { display: none !important; }
      /* One pay-period week per sheet: never split a week across pages; week 2 starts fresh. */
      .wk-block {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .wk-block + .wk-block {
        break-before: page;
        page-break-before: always;
      }
      tr { page-break-inside: avoid; break-inside: avoid; }
      thead { display: table-header-group; }
    }
    body { font-family: 'Inter', Arial, sans-serif; padding: 20px; margin: 0 auto; max-width: 1100px; background: #ffffff; color: ${G.text}; }
    .print-btn { background: ${G.ink}; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: ${G.text}; }
    /* Row height follows the tallest cell in that row (table layout); min-height
       keeps sparse rows from collapsing. No ellipsis — content wraps inside cells. */
    .schedule-grid tbody tr.schedule-row td {
      min-height: 60px;
      vertical-align: top;
      box-sizing: border-box;
    }
    .schedule-grid .pdf-cell-inner {
      box-sizing: border-box;
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
  <div style="text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid ${G.ink};">
    <div style="font-family:'Josefin Sans',sans-serif;margin-bottom:5px;">
      <span style="color:${G.textMuted};font-size:10px;letter-spacing:3px;">OVER THE</span><br>
      <span style="color:${G.ink};font-size:24px;letter-spacing:4px;font-weight:700;">RAINBOW</span>
    </div>
    <p style="margin:8px 0 0;font-size:12px;"><span style="color:${G.ink};font-weight:700;">Staff Schedule</span></p>
    <p style="margin:5px 0 0;color:${G.textMuted};font-size:11px;">Week ${weekNum1} & ${weekNum2} • ${formatMonthWord(periodInfo.startDate)} ${periodInfo.startDate.getDate()} - ${formatMonthWord(periodInfo.endDate)} ${periodInfo.endDate.getDate()}, ${periodInfo.startDate.getFullYear()}</p>
  </div>

  ${announcementHtml}
  ${makeWeekTable(week1, weekNum1)}
  ${makeWeekTable(week2, weekNum2)}

  <div style="margin-top:20px;padding:12px 15px;background:${G.fillZebra};border-radius:4px;border:1px solid ${G.border};">
    <div style="margin-bottom:6px;font-weight:700;font-size:9px;color:${G.textMuted};text-transform:uppercase;letter-spacing:1px;">Legend</div>
    <div>${legendItems}${eventLegendItems}<span style="font-size:10px;display:inline-flex;align-items:center;gap:5px;margin-right:15px;"><span style="color:${G.ink};font-weight:700;">★</span><span style="color:${G.text};">Has Task</span></span><span style="font-size:10px;display:inline-flex;align-items:center;gap:5px;margin-right:15px;"><span style="display:inline-block;padding:1px 6px;border:1px dashed ${G.border};font-weight:800;color:${G.ink};font-size:8px;letter-spacing:1px;">OFF</span><span style="color:${G.text};">Approved Time Off</span></span></div>
  </div>
  ${adminContactsHtml}
  <div style="margin-top:20px;padding-top:12px;border-top:1px solid ${G.border};text-align:center;font-size:9px;color:${G.textFaint};">
    Printed ${printedAt} • This is a snapshot - live schedule at rainbow-scheduling.vercel.app
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
