// EMAIL BUILDER - Individual employee emails (plaintext body sent via MailApp)
import { ROLES_BY_ID } from '../App';
import { toDateKey, getWeekNumber, formatMonthWord, formatDateLong, formatTimeDisplay } from '../utils/date';
import { EVENT_TYPES } from '../constants';
import { computeDayUnionHours } from '../utils/timemath';

// S64 Stage 7 — emails list meeting/PK entries as separate bullets; weekly total
// uses union hours so a 9-5 work + 3-5 PK day totals 8h, not 10h.
export const buildEmailContent = (emp, shifts, dates, periodInfo, adminContacts = [], announcement = null, events = {}) => {
  const weekNum1 = getWeekNumber(dates[0]);
  const weekNum2 = getWeekNumber(dates[7]);
  const year = periodInfo.startDate.getFullYear();

  const startMonth = formatMonthWord(periodInfo.startDate);
  const startDayNum = periodInfo.startDate.getDate();
  const endMonth = formatMonthWord(periodInfo.endDate);
  const endDayNum = periodInfo.endDate.getDate();

  const subject = `New Schedule Published 🌈 Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;

  const scheduleLines = [];
  let totalHours = 0;

  dates.forEach(date => {
    const k = `${emp.id}-${toDateKey(date)}`;
    const shift = shifts[k];
    const dayEvents = (events[k] || []).filter(ev => EVENT_TYPES[ev.type]);
    if (!shift && dayEvents.length === 0) return;
    const hasSick = dayEvents.some(e => e.type === 'sick');

    const dayStr = formatDateLong(date);
    let line = `  ${dayStr}`;

    if (shift && !hasSick) {
      const role = ROLES_BY_ID[shift.role];
      const timeStr = `${formatTimeDisplay(shift.startTime)} - ${formatTimeDisplay(shift.endTime)}`;
      line += `\n  ${timeStr} • ${shift.hours}h • ${role?.fullName || 'No Role'}`;
      if (shift.task) line += `\n  ⭐ Task: ${shift.task}`;
    }
    dayEvents.forEach(ev => {
      const et = EVENT_TYPES[ev.type];
      const timeStr = `${formatTimeDisplay(ev.startTime)} - ${formatTimeDisplay(ev.endTime)}`;
      line += `\n  • ${et.label} ${timeStr}${ev.note ? ` — ${ev.note}` : ''}`;
    });

    scheduleLines.push(line);
    totalHours += computeDayUnionHours([shift, ...dayEvents].filter(Boolean));
  });

  if (scheduleLines.length === 0) return { subject, body: '', hasShifts: false };

  const adminLine = adminContacts.length > 0
    ? `Contact: ${adminContacts.map(a => `${a.name || 'Admin'} (${a.email || ''})`).join(', ')}`
    : '';

  const announcementSection = (announcement && announcement.message) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 ${announcement.subject || 'ANNOUNCEMENT'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${announcement.message}

` : '';

  const firstName = (emp.name || 'Team').split(' ')[0];
  const body = `Hi ${firstName}! 🌈

OVER THE RAINBOW - Staff Schedule
Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}
${announcementSection}
YOUR SHIFTS
───────────────────────────────────

${scheduleLines.join('\n\n')}

───────────────────────────────────
Total Hours: ${totalHours.toFixed(1)}h
───────────────────────────────────

Full schedule rendered above. Contact admin with any questions.

${adminLine}

Over the Rainbow 🌈
www.rainbowjeans.com`;

  return { subject, body, hasShifts: true };
};
