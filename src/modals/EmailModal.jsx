import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { THEME } from '../theme';
import { buildEmailContent } from '../email/build';
import { Modal, GradientButton, Checkbox, toDateKey, getWeekNumber, formatMonthWord } from '../App';

export const EmailModal = ({ isOpen, onClose, employees, shifts, events = {}, dates, periodInfo, announcement, onComplete }) => {
  const emailableEmps = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);

  const adminContacts = employees.filter(e => e.isAdmin && !e.isOwner && e.active && !e.deleted);

  const [selected, setSelected] = useState(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: true }), {}));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [results, setResults] = useState([]);
  const [emailMode, setEmailMode] = useState('group');

  const toggle = id => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => { const all = Object.values(selected).every(Boolean); setSelected(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: !all }), {})); };

  const handleSend = () => {
    setSending(true);
    const selectedEmps = emailableEmps.filter(e => selected[e.id]);
    const emailResults = [];

    const weekNum1 = getWeekNumber(dates[0]);
    const weekNum2 = getWeekNumber(dates[7]);
    const year = periodInfo.startDate.getFullYear();
    const startMonth = formatMonthWord(periodInfo.startDate);
    const startDayNum = periodInfo.startDate.getDate();
    const endMonth = formatMonthWord(periodInfo.endDate);
    const endDayNum = periodInfo.endDate.getDate();

    const adminLine = adminContacts.length > 0
      ? `Contact: ${adminContacts.map(a => `${a.name} (${a.email})`).join(', ')}`
      : '';

    const announcementSection = (announcement && announcement.message) ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 ${announcement.subject || 'ANNOUNCEMENT'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${announcement.message}

` : '';

    if (emailMode === 'group') {
      const emails = selectedEmps.map(e => e.email).join(',');
      const subject = `New Schedule Published 🌈 Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;

      const body = `Hi Team! 🌈

OVER THE RAINBOW - Staff Schedule
Week ${weekNum1} & ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}, ${year}
${announcementSection}
📎 Full schedule PDF attached

Please check your shifts and contact admin if you have any questions.

${adminLine}

Over the Rainbow 🌈
www.rainbowjeans.com`;

      const mailtoLink = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');

      selectedEmps.forEach(emp => emailResults.push({ emp, status: 'included' }));
      setResults(emailResults);
      setTimeout(() => { setSending(false); setSent(true); }, 800);

    } else {
      selectedEmps.forEach((emp, i) => {
        const { subject, body, hasShifts } = buildEmailContent(emp, shifts, dates, periodInfo, adminContacts, announcement, events);
        if (!hasShifts) { emailResults.push({ emp, status: 'skipped', reason: 'No shifts' }); return; }
        const mailtoLink = `mailto:${emp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        emailResults.push({ emp, status: 'sent' });
        setTimeout(() => window.open(mailtoLink, '_blank'), i * 600);
      });

      setResults(emailResults);
      setTimeout(() => { setSending(false); setSent(true); }, selectedEmps.length * 600 + 500);
    }
  };

  const handleClose = () => { setSent(false); setSending(false); setResults([]); onComplete(); onClose(); };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Publish Schedule" size="md">
      {!sent ? (
        <>
          <div className="flex gap-1 p-1 rounded-lg mb-3" style={{ backgroundColor: THEME.bg.tertiary }}>
            <button
              onClick={() => setEmailMode('group')}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: emailMode === 'group' ? THEME.accent.purple : 'transparent',
                color: emailMode === 'group' ? '#fff' : THEME.text.muted
              }}>
              📧 One Email (Group)
            </button>
            <button
              onClick={() => setEmailMode('individual')}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: emailMode === 'individual' ? THEME.accent.purple : 'transparent',
                color: emailMode === 'individual' ? '#fff' : THEME.text.muted
              }}>
              📬 Individual Emails
            </button>
          </div>

          <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: emailMode === 'group' ? THEME.status.success + '15' : THEME.status.warning + '15', border: `1px solid ${emailMode === 'group' ? THEME.status.success + '30' : THEME.status.warning + '30'}` }}>
            {emailMode === 'group' ? (
              <p style={{ color: THEME.status.success }}>✓ One email to all — attach PDF once!</p>
            ) : (
              <p style={{ color: THEME.status.warning }}>⚠ Opens separate email for each person — attach PDF to each</p>
            )}
          </div>

          {announcement && announcement.message && (
            <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: THEME.accent.blue + '15', border: `1px solid ${THEME.accent.blue}30` }}>
              <p style={{ color: THEME.accent.blue }}>
                📢 <strong>{announcement.subject || 'Announcement'}</strong> will be included in {emailMode === 'group' ? 'email' : 'all emails'}
              </p>
            </div>
          )}

          <p className="text-xs mb-2" style={{ color: THEME.text.secondary }}>Select recipients ({selectedCount}):</p>
          <div className="mb-2"><Checkbox checked={Object.values(selected).every(Boolean)} onChange={toggleAll} label="Select All" /></div>
          <div className="space-y-1 max-h-32 overflow-y-auto p-2 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
            {emailableEmps.map(e => {
              const hasShifts = dates.some(d => shifts[`${e.id}-${toDateKey(d)}`]);
              return (
                <div key={e.id} className="flex items-center justify-between">
                  <Checkbox checked={selected[e.id]} onChange={() => toggle(e.id)} label={e.name} />
                  {!hasShifts && <span className="text-xs" style={{ color: THEME.text.muted }}>(no shifts)</span>}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={handleClose}>Cancel</GradientButton>
            <GradientButton small onClick={handleSend} disabled={sending || selectedCount === 0}>
              {sending ? '...' : <><Send size={10} />{emailMode === 'group' ? 'Open Email' : `Send ${selectedCount}`}</>}
            </GradientButton>
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.success + '20' }}>
            <Check size={20} style={{ color: THEME.status.success }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>
            {emailMode === 'group' ? 'Email Ready!' : 'Emails Opened!'}
          </h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>
            {emailMode === 'group'
              ? 'Attach the PDF and click Send in your email app.'
              : 'Attach the PDF to each email and send.'}
          </p>
          <div className="text-left p-2 rounded-lg mb-3 max-h-28 overflow-y-auto" style={{ backgroundColor: THEME.bg.tertiary }}>
            {results.map((r, i) => (
              <div key={r.emp.email || i} className="flex items-center justify-between py-0.5 text-xs">
                <span style={{ color: THEME.text.primary }}>{r.emp.name}</span>
                <span style={{ color: r.status === 'skipped' ? THEME.text.muted : THEME.status.success }}>
                  {r.status === 'skipped' ? r.reason : '✓'}
                </span>
              </div>
            ))}
          </div>
          <GradientButton small onClick={handleClose}>Done</GradientButton>
        </div>
      )}
    </Modal>
  );
};
