// EMAIL BUILDER - Individual employee emails (plaintext body sent via MailApp)
import {
  ROLES_BY_ID,
  toDateKey,
  getWeekNumber,
  formatMonthWord,
  formatDateLong,
  formatTimeDisplay,
} from '../App';

export const buildEmailContent = (emp, shifts, dates, periodInfo, adminContacts = [], announcement = null) => {
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
    const shift = shifts[`${emp.id}-${toDateKey(date)}`];
    if (shift) {
      const role = ROLES_BY_ID[shift.role];
      const dayStr = formatDateLong(date);
      const timeStr = `${formatTimeDisplay(shift.startTime)} - ${formatTimeDisplay(shift.endTime)}`;

      let line = `  ${dayStr}`;
      line += `\n  ${timeStr} • ${shift.hours}h • ${role?.fullName || 'No Role'}`;
      if (shift.task) line += `\n  ⭐ Task: ${shift.task}`;
      scheduleLines.push(line);
      totalHours += shift.hours || 0;
    }
  });

  if (scheduleLines.length === 0) return { subject, body: '', hasShifts: false };

  const adminLine = adminContacts.length > 0
    ? `Contact: ${adminContacts.map(a => `${a.name} (${a.email})`).join(', ')}`
    : '';

  const announcementSection = (announcement && announcement.message) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 ${announcement.subject || 'ANNOUNCEMENT'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${announcement.message}

` : '';

  const body = `Hi ${emp.name.split(' ')[0]}! 🌈

OVER THE RAINBOW - Staff Schedule
Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}
${announcementSection}
YOUR SHIFTS
───────────────────────────────────

${scheduleLines.join('\n\n')}

───────────────────────────────────
Total Hours: ${totalHours.toFixed(1)}h
───────────────────────────────────

📎 Full schedule PDF attached

${adminLine}

Over the Rainbow 🌈
www.rainbowjeans.com`;

  return { subject, body, hasShifts: true };
};
