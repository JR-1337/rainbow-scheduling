// PDF GENERATION - Printer-friendly light theme
import {
  ROLES,
  ROLES_BY_ID,
  toDateKey,
  getWeekNumber,
  getDayNameShort,
  formatDate,
  formatMonthWord,
  formatTimeShort,
  isStatHoliday,
  hasApprovedTimeOffForDate,
} from '../App';
import { escapeHtml, stripEmoji } from '../utils/format';

const cleanText = (s) => escapeHtml(stripEmoji(s));

export const generateSchedulePDF = (employees, shifts, dates, periodInfo, announcement = null, timeOffRequests = []) => {
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekNum1 = getWeekNumber(week1[0]);
  const weekNum2 = getWeekNumber(week2[0]);

  // Filter schedulable employees (exclude owner, exclude admins unless showOnSchedule)
  const schedulable = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);

  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);

  const calcWeekHours = (empId, weekDates) => {
    let t = 0;
    weekDates.forEach(d => { const s = shifts[`${empId}-${toDateKey(d)}`]; if (s) t += s.hours || 0; });
    return t;
  };

  const announcementHtml = (announcement && announcement.message) ? `
    <div style="margin:15px 0;padding:15px;background:#faf7fb;border-radius:8px;border-left:4px solid #932378;">
      ${announcement.subject ? `<h3 style="margin:0 0 10px;color:#932378;font-size:13px;font-weight:700;letter-spacing:0.5px;">${cleanText(announcement.subject)}</h3>` : '<h3 style="margin:0 0 10px;color:#932378;font-size:13px;font-weight:700;">Announcement</h3>'}
      <div style="color:#0D0E22;font-size:11px;line-height:1.6;white-space:pre-wrap;">${cleanText(announcement.message)}</div>
    </div>
  ` : '';

  const makeWeekTable = (weekDates, weekNum) => {
    const headers = weekDates.map(d => {
      const hol = isStatHoliday(d);
      return `<th style="padding:8px 4px;border:1px solid #cbd5e1;background:${hol ? '#fef3c7' : '#f1f5f9'};font-size:11px;text-align:center;width:11%;">
        <div style="font-weight:600;color:${hol ? '#92400e' : '#334155'};text-transform:uppercase;font-size:9px;">${getDayNameShort(d)}</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;">${d.getDate()}</div>
      </th>`;
    }).join('');

    const rows = schedulable.map(emp => {
      const cells = weekDates.map(date => {
        const dateStr = toDateKey(date);
        const shift = shifts[`${emp.id}-${dateStr}`];
        if (!shift) {
          if (hasApprovedTimeOffForDate(emp.email, dateStr, timeOffRequests)) {
            return `<td style="padding:6px;border:1px dashed #94a3b8;background:#ffffff;text-align:center;">
              <div style="font-size:9px;font-weight:700;color:#475569;letter-spacing:1px;">OFF</div>
              <div style="font-size:7px;color:#64748b;">approved</div>
            </td>`;
          }
          return '<td style="padding:6px;border:1px solid #cbd5e1;background:#ffffff;"></td>';
        }
        const role = ROLES_BY_ID[shift.role];
        const roleName = role?.name || 'Shift';
        // Whitelist color to hex-only so CSS injection is impossible even if a role color is ever sourced from user input.
        const rawColor = role?.color || '#64748b';
        const roleColor = /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#64748b';
        return `<td style="padding:5px;border:2.5px solid ${roleColor};background:#ffffff;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:${roleColor};margin-bottom:2px;">${roleName}</div>
          <div style="font-size:9px;color:#0D0E22;">${formatTimeShort(shift.startTime)}-${formatTimeShort(shift.endTime)}</div>
          <div style="font-size:8px;color:#475569;">${shift.hours}h</div>
          ${shift.task ? `<div style="font-size:7px;color:#d97706;margin-top:2px;line-height:1.3;word-break:break-word;">★ ${cleanText(shift.task)}</div>` : ''}
        </td>`;
      }).join('');

      const hours = calcWeekHours(emp.id, weekDates);
      // Ontario ESA: OT kicks in at 44h. Amber warns approaching, red flags at/over threshold.
      const hoursColor = hours >= 44 ? '#ef4444' : hours >= 40 ? '#d97706' : '#475569';
      const hoursDisplay = hours > 0 ? `${hours.toFixed(1)}h` : '—';

      return `<tr style="page-break-inside:avoid;">
        <td style="padding:8px;border:1px solid #cbd5e1;background:#ffffff;">
          <div style="font-weight:600;font-size:11px;color:#0D0E22;">${cleanText(emp.name)}</div>
          <div style="font-size:10px;color:${hoursColor};font-weight:600;">${hoursDisplay}</div>
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

  const legendItems = ROLES.filter(r => r.id !== 'none').map(r => {
    const c = /^#[0-9a-fA-F]{3,8}$/.test(r.color) ? r.color : '#64748b';
    return `<span style="margin-right:15px;font-size:10px;display:inline-flex;align-items:center;gap:5px;">
      <span style="display:inline-block;width:12px;height:12px;background:${c};border-radius:3px;"></span>
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
