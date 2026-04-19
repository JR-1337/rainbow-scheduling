// PDF GENERATION - Printer-friendly light theme
import {
  ROLES,
  ROLES_BY_ID,
  isStatHoliday,
  hasApprovedTimeOffForDate,
} from '../App';
import { toDateKey, getWeekNumber, getDayNameShort, formatDate, formatMonthWord, formatTimeShort } from '../utils/date';
import { EVENT_TYPES, PRIMARY_CONTACT_EMAIL } from '../constants';
import { computeDayUnionHours } from '../utils/timemath';
import { escapeHtml, stripEmoji } from '../utils/format';

const cleanText = (s) => escapeHtml(stripEmoji(s));

// Greyscale-redundant encoding: break-room printer is B&W. Role, OT, holiday,
// and announcement each gain a non-hue channel (letter glyph, border style,
// font weight, typographic marker) so information survives the grayscale
// reduction. Colors remain for color printers — this is pure redundancy, not
// replacement. See plan 2026-04-18 Item 6 for rationale.
const ROLE_GLYPHS = {
  cashier: 'C',
  backupCashier: 'B',
  mens: 'M',
  womens: 'W',
  floorMonitor: 'F',
  none: '',
};
const ROLE_BORDERS = {
  cashier: { style: 'solid', width: '3px' },
  backupCashier: { style: 'dashed', width: '3px' },
  mens: { style: 'solid', width: '2px' },
  womens: { style: 'dashed', width: '2px' },
  floorMonitor: { style: 'dotted', width: '2.5px' },
  none: { style: 'solid', width: '2px' },
};

// S64 Stage 7 — events carry meeting/PK entries per `${empId}-${date}` key.
// Hours are union-counted (9-5 work + 3-5 PK = 8h). OT threshold uses totalHours
// because all paid time counts under Ontario ESA.
export const generateSchedulePDF = (employees, shifts, dates, periodInfo, announcement = null, timeOffRequests = [], events = {}) => {
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]);
  const weekNum2 = getWeekNumber(week2[0]);

  // Filter schedulable employees (exclude owner, exclude admins unless showOnSchedule)
  const schedulable = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);

  // PDF contact row shows the primary store contact only (Sarvi). If her record
  // isn't found, fall back to any active non-owner admin so the PDF still lists
  // a human to contact.
  const primaryContact = employees.find(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted);
  const adminContacts = primaryContact
    ? [primaryContact]
    : employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);

  const calcWeekHours = (empId, weekDates) => {
    let workHours = 0;
    let totalHours = 0;
    weekDates.forEach(d => {
      const k = `${empId}-${toDateKey(d)}`;
      const s = shifts[k];
      const evs = (events[k] || []).filter(ev => EVENT_TYPES[ev.type]);
      if (s) workHours += s.hours || 0;
      const combined = [s, ...evs].filter(Boolean);
      if (combined.length > 0) totalHours += computeDayUnionHours(combined);
    });
    return { workHours, totalHours };
  };

  // Announcement: italic body + "[!]" prefix + double top border. Reads as
  // distinct from shift rows even after color drops to grey.
  const announcementHtml = (announcement && announcement.message) ? `
    <div style="margin:15px 0;padding:15px;background:#faf7fb;border-radius:8px;border-left:4px solid #932378;border-top:3px double #932378;">
      ${announcement.subject ? `<h3 style="margin:0 0 10px;color:#932378;font-size:13px;font-weight:700;letter-spacing:0.5px;">[!] ${cleanText(announcement.subject)}</h3>` : '<h3 style="margin:0 0 10px;color:#932378;font-size:13px;font-weight:700;">[!] Announcement</h3>'}
      <div style="color:#0D0E22;font-size:11px;line-height:1.6;white-space:pre-wrap;font-style:italic;">${cleanText(announcement.message)}</div>
    </div>
  ` : '';

  const makeWeekTable = (weekDates, weekNum) => {
    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      // Holiday: heavy black top border + "HOL" caption in addition to yellow bg,
      // so the marker survives greyscale printing.
      return `<th style="padding:8px 4px;border:1px solid #cbd5e1;${hol ? 'border-top:3px solid #000;' : ''}background:${hol ? '#fef3c7' : '#f1f5f9'};font-size:11px;text-align:center;width:11%;">
        ${hol ? `<div style="font-size:7px;font-weight:700;color:#000;letter-spacing:1px;">HOL</div>` : ''}
        <div style="font-weight:600;color:${hol ? '#92400e' : '#334155'};text-transform:uppercase;font-size:9px;">${getDayNameShort(d)}</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${d.getDate()}</div>
      </th>`;
    }).join('');

    const eventBadgeHtml = (evs) => evs.map(ev => {
      const et = EVENT_TYPES[ev.type];
      if (!et) return '';
      return `<div style="font-size:7px;color:#475569;margin-top:2px;line-height:1.3;"><strong style="color:#1F2937;">${et.shortLabel}</strong> ${formatTimeShort(ev.startTime)}-${formatTimeShort(ev.endTime)}${ev.note ? ` · ${cleanText(ev.note)}` : ''}</div>`;
    }).join('');

    const rows = schedulable.map(emp => {
      const cells = weekDates.map(date => {
        const dateStr = toDateKey(date);
        const shift = shifts[`${emp.id}-${dateStr}`];
        const dayEvents = (events[`${emp.id}-${dateStr}`] || []).filter(ev => EVENT_TYPES[ev.type]);
        // Approved time-off wins over events — an employee on time-off shouldn't
        // show a meeting/PK card even if one was scheduled before the request was approved.
        if (!shift && hasApprovedTimeOffForDate(emp.email, dateStr, timeOffRequests)) {
          return `<td style="padding:6px;border:1px dashed #94a3b8;background:#ffffff;text-align:center;">
            <div style="font-size:9px;font-weight:700;color:#475569;letter-spacing:1px;">OFF</div>
            <div style="font-size:7px;color:#64748b;">approved</div>
          </td>`;
        }
        if (!shift && dayEvents.length === 0) {
          return '<td style="padding:6px;border:1px solid #cbd5e1;background:#ffffff;"></td>';
        }
        if (!shift) {
          // Event-only day — neutral grey card.
          return `<td style="padding:5px;border:2px solid #9CA3AF;background:#F3F4F6;text-align:center;">
            ${eventBadgeHtml(dayEvents)}
          </td>`;
        }
        const role = ROLES_BY_ID[shift.role];
        const roleName = role?.name || 'Shift';
        // Whitelist color to hex-only so CSS injection is impossible even if a role color is ever sourced from user input.
        const rawColor = role?.color || '#64748b';
        const roleColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#64748b';
        const roleBorder = ROLE_BORDERS[shift.role] || ROLE_BORDERS.none;
        const glyph = ROLE_GLYPHS[shift.role] || '';
        const glyphPrefix = glyph ? `${glyph}: ` : '';
        return `<td style="padding:5px;border:${roleBorder.width} ${roleBorder.style} ${roleColor};background:#ffffff;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:${roleColor};margin-bottom:2px;">${glyphPrefix}${roleName}</div>
          <div style="font-size:9px;color:#0D0E22;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</div>
          <div style="font-size:8px;color:#475569;">${shift.hours}h</div>
          ${shift.task ? `<div style="font-size:7px;color:#d97706;margin-top:2px;line-height:1.3;word-break:break-word;">★ ${cleanText(shift.task)}</div>` : ''}
          ${eventBadgeHtml(dayEvents)}
        </td>`;
      }).join('');

      const { workHours, totalHours } = calcWeekHours(emp.id, weekDates);
      // Ontario ESA: OT kicks in at 44h. All paid time counts, so use totalHours for coloring.
      const hoursColor = totalHours >= 44 ? '#ef4444' : totalHours >= 40 ? '#d97706' : '#475569';
      // Greyscale redundancy: OT (>=44) is bold + trailing asterisk; near-OT (40-43) is bold.
      const isOT = totalHours >= 44;
      const isNearOT = totalHours >= 40 && totalHours < 44;
      const hoursWeight = (isOT || isNearOT) ? '800' : '600';
      const otMarker = isOT ? '*' : '';
      const hasExtras = totalHours > workHours + 0.01;
      const hoursDisplay = totalHours > 0
        ? (hasExtras ? `${totalHours.toFixed(1)}h${otMarker} <span style="font-size:8px;color:#64748b;font-weight:500;">(${workHours.toFixed(1)} work)</span>` : `${totalHours.toFixed(1)}h${otMarker}`)
        : '—';

      return `<tr style="page-break-inside:avoid;">
        <td style="padding:8px;border:1px solid #cbd5e1;background:#ffffff;">
          <div style="font-weight:600;font-size:11px;color:#0D0E22;">${cleanText(emp.name)}</div>
          <div style="font-size:10px;color:${hoursColor};font-weight:${hoursWeight};">${hoursDisplay}</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');

    const headcountCells = weekDates.map(date => {
      const dateStr = toDateKey(date);
      const count = schedulable.reduce((n, emp) => n + (shifts[`${emp.id}-${dateStr}`] ? 1 : 0), 0);
      return `<td style="padding:6px;border:1px solid #cbd5e1;background:#f8fafc;text-align:center;font-size:13px;font-weight:700;color:#0D0E22;">${count}</td>`;
    }).join('');
    const headcountRow = `<tr style="page-break-inside:avoid;">
      <td style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;font-size:9px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:1px;">Scheduled</td>
      ${headcountCells}
    </tr>`;

    return `
      <div class="wk-block" style="margin-bottom:25px;">
        <div style="background:#0D0E22;padding:10px 15px;border-radius:8px 8px 0 0;">
          <h3 style="margin:0;color:#ffffff;font-size:14px;font-weight:600;">Week ${weekNum}</h3>
          <p style="margin:2px 0 0;color:rgba(255,255,255,0.8);font-size:11px;">${formatDate(weekDates[0])} — ${formatDate(weekDates[6])}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;font-family:'Inter',Arial,sans-serif;">
          <thead style="display:table-header-group;"><tr><th style="padding:8px;border:1px solid #cbd5e1;background:#f1f5f9;width:15%;font-size:10px;text-align:left;color:#475569;text-transform:uppercase;">Employee</th>${headers}</tr></thead>
          <tbody>${rows}${headcountRow}</tbody>
        </table>
      </div>
    `;
  };

  // Legend shows the letter glyph alongside the color swatch so B&W readers can
  // map M:/W:/C:/B:/F: prefixes back to role names.
  const legendItems = ROLES.filter(r => r.id !== 'none').map(r => {
    const c = /^#[0-9a-fA-F]{3,8}$/.test(r.color) ? r.color : '#64748b';
    const g = ROLE_GLYPHS[r.id] || '';
    return `<span style="margin-right:15px;font-size:10px;display:inline-flex;align-items:center;gap:5px;">
      <span style="display:inline-block;width:14px;height:14px;background:${c};border-radius:3px;color:#fff;font-weight:700;font-size:9px;text-align:center;line-height:14px;">${g}</span>
      <span style="color:#334155;">${escapeHtml(r.fullName)}</span>
    </span>`;
  }).join('');

  const adminContactsHtml = adminContacts.length > 0 ? `
    <div style="margin-top:12px;padding:10px 15px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-weight:600;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Contact Admin</div>
      ${adminContacts.map(a => `<span style="margin-right:20px;font-size:11px;color:#334155;">${cleanText(a.name)}: <span style="color:#0369a1;">${cleanText(a.email)}</span></span>`).join('')}
    </div>
  ` : '';

  const printedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Rainbow Schedule - Week ${weekNum1} & ${weekNum2}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Josefin+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @page { margin: 0.3in; size: landscape; }
      .no-print { display: none !important; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
    }
    body { font-family: 'Inter', Arial, sans-serif; padding: 20px; margin: 0 auto; max-width: 1100px; background: #ffffff; }
    .print-btn { background: #0D0E22; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: #1a1c3d; }
  </style>
</head>
<body style="background:#ffffff;">
  <div class="no-print" style="position:sticky;top:0;background:#ffffff;padding:10px 0;margin-bottom:10px;border-bottom:1px solid #e2e8f0;text-align:right;z-index:10;">
    <button class="print-btn" onclick="window.print()">Print Schedule</button>
    <span style="margin-left:15px;color:#64748b;font-size:11px;">Review the preview below, then click Print.</span>
  </div>
  <div style="text-align:center;margin-bottom:25px;padding-bottom:15px;border-bottom:2px solid #0D0E22;">
    <div style="font-family:'Josefin Sans',sans-serif;margin-bottom:5px;">
      <span style="color:#475569;font-size:10px;letter-spacing:3px;">OVER THE</span><br>
      <span style="color:#932378;font-size:24px;letter-spacing:4px;font-weight:600;">RAINBOW</span>
    </div>
    <p style="margin:8px 0 0;font-size:12px;"><span style="color:#0D0E22;font-weight:600;">Staff Schedule</span></p>
    <p style="margin:5px 0 0;color:#475569;font-size:11px;">Week ${weekNum1} & ${weekNum2} • ${formatMonthWord(periodInfo.startDate)} ${periodInfo.startDate.getDate()} — ${formatMonthWord(periodInfo.endDate)} ${periodInfo.endDate.getDate()}, ${periodInfo.startDate.getFullYear()}</p>
  </div>

  ${announcementHtml}
  ${makeWeekTable(week1, weekNum1)}
  ${makeWeekTable(week2, weekNum2)}

  <div style="margin-top:20px;padding:12px 15px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
    <div style="margin-bottom:6px;font-weight:600;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Legend</div>
    <div>${legendItems}<span style="font-size:10px;display:inline-flex;align-items:center;gap:5px;margin-right:15px;"><span style="color:#d97706;">★</span><span style="color:#334155;">Has Task</span></span><span style="font-size:10px;display:inline-flex;align-items:center;gap:5px;"><span style="display:inline-block;padding:1px 6px;border:1px dashed #94a3b8;font-weight:700;color:#475569;font-size:8px;letter-spacing:1px;">OFF</span><span style="color:#334155;">Approved Time Off</span></span></div>
  </div>
  ${adminContactsHtml}
  <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:9px;color:#94a3b8;">
    Printed ${printedAt} • This is a snapshot — live schedule at rainbow-scheduling.vercel.app
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank', 'width=1100,height=750');
  if (!printWindow) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rainbow-Schedule-Week${weekNum1}-${weekNum2}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
