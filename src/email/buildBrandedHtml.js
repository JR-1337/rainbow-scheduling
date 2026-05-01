// EMAIL HTML BUILDER — Branded schedule email body
//
// Email-safe rules (enforced throughout this file):
//   - No <style> blocks or <link> tags — clients strip them (Outlook, etc.)
//   - All styles inline on each element
//   - No position/flex/grid — table-based layout only
//   - No background images
//   - Widths fixed in pixels, not percentages (600px content card)
//   - Tables nested max one level inside content card
//   - Emoji only in subject + plaintext — many HTML email clients strip them

import { OTR, OTR_ACCENT } from '../theme';
import { buildEmailContent } from './build';
import { toDateKey, getWeekNumber, formatMonthWord, formatDateLong, formatTimeDisplay } from '../utils/date';
import { ROLES_BY_ID } from '../App';
import { EVENT_TYPES } from '../constants';
import { POLICY_DISCLAIMER_HTML, POLICY_DISCLAIMER_TEXT } from './policyDisclaimer';

// Escape HTML entities so plaintext content injected into HTML is safe.
const escHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Convert newlines to <br> and escape HTML entities for inline HTML blocks.
const nlToBr = (str) => escHtml(str).replace(/\n/g, '<br>');

/**
 * buildBrandedScheduleHtml({ emp, shifts, dates, periodInfo, adminContacts,
 *                             announcement, events, accent })
 *
 * emp:           employee object, or null for group-send mode
 * shifts:        flat shifts map keyed "empId-YYYY-MM-DD"
 * dates:         array of Date objects (14 days)
 * periodInfo:    { startDate, endDate }
 * adminContacts: array of admin employee objects
 * announcement:  { subject, message } or null
 * events:        events map keyed "empId-YYYY-MM-DD"
 * accent:        hex string (defaults to OTR_ACCENT.primary)
 *
 * Returns { subject, html, plaintext, hasShifts }
 */
export const buildBrandedScheduleHtml = ({
  emp,
  shifts,
  dates,
  periodInfo,
  adminContacts = [],
  announcement = null,
  events = {},
  accent = OTR_ACCENT.primary,
}) => {
  const navy = OTR.navy;
  const white = OTR.white;
  const accentTint = accent + '15'; // ~8% opacity tint for announcement row bg

  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);
  const year = periodInfo.startDate.getFullYear();
  const startMonth = formatMonthWord(periodInfo.startDate);
  const startDayNum = periodInfo.startDate.getDate();
  const endMonth = formatMonthWord(periodInfo.endDate);
  const endDayNum = periodInfo.endDate.getDate();

  const subject = `New Schedule Published Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;
  const periodLabel = `Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}`;

  // ── Plaintext fallback ──────────────────────────────────────────────────────
  let plaintext;
  let hasShifts = true;

  if (emp) {
    // Individual mode: reuse build.js plaintext (includes shift table)
    const built = buildEmailContent(emp, shifts, dates, periodInfo, adminContacts, announcement, events);
    plaintext = built.body;
    hasShifts = built.hasShifts;
    if (!hasShifts) return { subject, html: '', plaintext: '', hasShifts: false };
  } else {
    // Group mode: minimal body — no full team schedule inline (too wide for email)
    const adminLine = adminContacts.length > 0
      ? `Contact: ${adminContacts.map(a => `${a.name} (${a.email})`).join(', ')}`
      : '';
    const announceLine = (announcement && announcement.message)
      ? `\n${announcement.subject || 'ANNOUNCEMENT'}\n${announcement.message}\n`
      : '';
    plaintext = `Hi Team!\n\nOVER THE RAINBOW - Staff Schedule\n${periodLabel}\n${announceLine}\nSchedule rendered in the email body. Please check your shifts and contact admin with questions.\n\n${adminLine}\n\n---\n${POLICY_DISCLAIMER_TEXT}\n---\n\nOver the Rainbow\nwww.rainbowjeans.com`;
    hasShifts = true;
  }

  // ── HTML schedule rows (individual mode only) ───────────────────────────────
  let scheduleTableRows = '';
  if (emp) {
    const scheduleLines = [];
    dates.forEach((date, idx) => {
      const k = `${emp.id}-${toDateKey(date)}`;
      const shift = shifts[k];
      const dayEvents = (events[k] || []).filter(ev => EVENT_TYPES[ev.type]);
      if (!shift && dayEvents.length === 0) return;
      const hasSick = dayEvents.some(e => e.type === 'sick');
      const rowBg = idx % 2 === 0 ? '#F5F3F0' : '#FFFFFF';
      const dayStr = escHtml(formatDateLong(date));

      let shiftContent = '';
      if (shift && !hasSick) {
        const role = ROLES_BY_ID[shift.role];
        const timeStr = `${formatTimeDisplay(shift.startTime)} - ${formatTimeDisplay(shift.endTime)}`;
        shiftContent += `<div style="font-size:13px;color:#1a1a2e;">${escHtml(timeStr)} &bull; ${escHtml(role?.fullName || 'No Role')}</div>`;
        if (shift.task) shiftContent += `<div style="font-size:12px;color:#D97706;margin-top:2px;">Task: ${escHtml(shift.task)}</div>`;
      }
      dayEvents.forEach(ev => {
        const et = EVENT_TYPES[ev.type];
        const timeStr = `${formatTimeDisplay(ev.startTime)} - ${formatTimeDisplay(ev.endTime)}`;
        shiftContent += `<div style="font-size:12px;color:#5C5C5C;margin-top:2px;">${escHtml(et?.label || ev.type)} ${escHtml(timeStr)}${ev.note ? ` &mdash; ${escHtml(ev.note)}` : ''}</div>`;
      });

      scheduleLines.push(`
        <tr style="background-color:${rowBg};">
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;vertical-align:top;width:140px;">
            <div style="font-size:13px;font-weight:600;color:${navy};">${dayStr}</div>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;vertical-align:top;">
            ${shiftContent || `<div style="font-size:13px;color:#8B8580;">Sick / Off</div>`}
          </td>
        </tr>`);
    });

    if (scheduleLines.length > 0) {
      scheduleTableRows = `
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
            <tr style="background-color:${navy};">
              <td colspan="2" style="padding:8px 12px;">
                <span style="font-size:12px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;">Your Shifts</span>
              </td>
            </tr>
            ${scheduleLines.join('')}
          </table>
        </td>
      </tr>`;
    }
  }

  // ── Announcement row ─────────────────────────────────────────────────────────
  let announcementRow = '';
  if (announcement && announcement.message) {
    announcementRow = `
      <tr>
        <td style="padding:16px 24px;background-color:${accentTint};border-left:4px solid ${accent};">
          <div style="font-size:13px;font-weight:700;color:${navy};margin-bottom:4px;">${escHtml(announcement.subject || 'Announcement')}</div>
          <div style="font-size:13px;color:#3a3a4a;line-height:1.5;">${nlToBr(announcement.message)}</div>
        </td>
      </tr>`;
  }

  // ── Admin contacts row ───────────────────────────────────────────────────────
  let adminRow = '';
  if (adminContacts.length > 0) {
    const contactStr = adminContacts.map(a => `${escHtml(a.name)} (${escHtml(a.email)})`).join(', ');
    adminRow = `
      <tr>
        <td style="padding:12px 24px;">
          <div style="font-size:12px;color:#5C5C5C;">Questions? Contact: ${contactStr}</div>
        </td>
      </tr>`;
  }

  // ── Greeting row ─────────────────────────────────────────────────────────────
  const firstName = emp ? escHtml((emp.name || 'Team').split(' ')[0]) : 'Team';
  const greetingText = emp
    ? `Hi ${firstName}, your schedule is ready.`
    : `Hi Team, the new schedule has been published.`;

  // ── Full HTML assembly ───────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${white};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${white}" style="background-color:${white};">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <!-- Content card: 600px max, centered -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-top:2px solid ${accent};">

          <!-- Header -->
          <tr>
            <td style="background-color:${navy};padding:20px 24px;">
              <div style="font-size:22px;font-weight:900;color:${white};letter-spacing:2px;text-transform:uppercase;">RAINBOW</div>
              <div style="font-size:12px;color:${accent};margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${escHtml(periodLabel)}</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:16px 24px 8px 24px;background-color:#FFFFFF;">
              <div style="font-size:14px;color:${navy};">${greetingText}</div>
            </td>
          </tr>

          ${announcementRow}

          ${scheduleTableRows}

          ${adminRow}

          ${POLICY_DISCLAIMER_HTML}

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background-color:#F5F3F0;border-top:1px solid #E5E7EB;">
              <div style="font-size:12px;color:#8B8580;text-align:center;">Over the Rainbow &bull; <a href="https://www.rainbowjeans.com" style="color:#8B8580;">www.rainbowjeans.com</a></div>
              <div style="font-size:11px;color:#ABABAB;text-align:center;margin-top:4px;">This is an automated message from the OTR Scheduling App.</div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, plaintext, hasShifts };
};
