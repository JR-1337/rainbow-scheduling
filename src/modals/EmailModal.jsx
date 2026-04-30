import { useState } from 'react';
import { Send, Check, X } from 'lucide-react';
import { THEME } from '../theme';
import { OTR_ACCENT } from '../theme';
import { buildBrandedScheduleHtml } from '../email/buildBrandedHtml';
import { apiCall } from '../utils/api';
import { Modal, GradientButton, Checkbox } from '../components/primitives';
import { toDateKey, getWeekNumber, formatMonthWord } from '../utils/date';
import { PRIMARY_CONTACT_EMAIL } from '../constants';

export const EmailModal = ({ isOpen, onClose, employees, shifts, events = {}, dates, periodInfo, announcement, onComplete }) => {
  const emailableEmps = employees
    .filter(e => e.active && !e.deleted && !e.isOwner)
    .filter(e => !e.isAdmin || e.showOnSchedule);

  const adminContacts = employees.filter(e => e.email === PRIMARY_CONTACT_EMAIL && e.active && !e.deleted);

  const [selected, setSelected] = useState(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: true }), {}));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [results, setResults] = useState([]);
  const [emailMode, setEmailMode] = useState('group');
  const [inFlight, setInFlight] = useState({ current: 0, total: 0 });

  const toggle = id => setSelected(p => ({ ...p, [id]: !p[id] }));
  const toggleAll = () => { const all = Object.values(selected).every(Boolean); setSelected(emailableEmps.reduce((a, e) => ({ ...a, [e.id]: !all }), {})); };

  const handleSend = async () => {
    setSending(true);
    const selectedEmps = emailableEmps.filter(e => selected[e.id]);

    const weekNum1 = getWeekNumber(dates[0]);
    const weekNum2 = getWeekNumber(dates[7]);
    const startMonth = formatMonthWord(periodInfo.startDate);
    const startDayNum = periodInfo.startDate.getDate();
    const endMonth = formatMonthWord(periodInfo.endDate);
    const endDayNum = periodInfo.endDate.getDate();
    const subject = `New Schedule Published Wk ${weekNum1}, ${weekNum2} | ${startMonth} ${startDayNum} - ${endMonth} ${endDayNum}`;

    const accent = OTR_ACCENT.primary;

    if (emailMode === 'group') {
      const emails = selectedEmps.map(e => e.email).join(',');

      // Build group HTML body (emp=null -> announcement + period header only, no inline shift table)
      const { html: htmlBody, plaintext: plaintextBody } = buildBrandedScheduleHtml({
        emp: null,
        shifts,
        dates,
        periodInfo,
        adminContacts,
        announcement,
        events,
        accent,
      });

      const res = await apiCall('sendBrandedScheduleEmail', { to: emails, subject, htmlBody, plaintextBody });

      const emailResults = selectedEmps.map(emp => ({
        emp,
        status: res && res.success ? 'sent' : 'failed',
        reason: res && !res.success ? (res.error?.message || 'Send failed') : undefined,
      }));

      setResults(emailResults);
      setSending(false);
      setSent(true);

    } else {
      // Individual mode: sequential sends, one per employee, skip if no shifts
      const emailResults = [];
      setInFlight({ current: 0, total: selectedEmps.length });

      for (let i = 0; i < selectedEmps.length; i++) {
        const emp = selectedEmps[i];
        setInFlight({ current: i + 1, total: selectedEmps.length });

        const built = buildBrandedScheduleHtml({
          emp,
          shifts,
          dates,
          periodInfo,
          adminContacts,
          announcement,
          events,
          accent,
        });

        if (!built.hasShifts) {
          emailResults.push({ emp, status: 'skipped', reason: 'No shifts' });
          setResults([...emailResults]);
          continue;
        }

        const res = await apiCall('sendBrandedScheduleEmail', {
          to: emp.email,
          subject: built.subject,
          htmlBody: built.html,
          plaintextBody: built.plaintext,
        });

        if (res && res.success) {
          emailResults.push({ emp, status: 'sent' });
        } else {
          emailResults.push({ emp, status: 'failed', reason: res?.error?.message || 'Send failed' });
        }
        setResults([...emailResults]);
      }

      setSending(false);
      setSent(true);
      setInFlight({ current: 0, total: 0 });
    }
  };

  const handleClose = () => {
    const finishedEmailStep = sent;
    setSent(false);
    setSending(false);
    setResults([]);
    setInFlight({ current: 0, total: 0 });
    if (finishedEmailStep) onComplete?.();
    onClose();
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Outcome summary for sent state
  const sentCount = results.filter(r => r.status === 'sent').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const allSuccess = failedCount === 0 && sentCount > 0;
  const allFailed = sentCount === 0 && failedCount > 0;

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
              One Email (Group)
            </button>
            <button
              onClick={() => setEmailMode('individual')}
              className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: emailMode === 'individual' ? THEME.accent.purple : 'transparent',
                color: emailMode === 'individual' ? '#fff' : THEME.text.muted
              }}>
              Individual Emails
            </button>
          </div>

          <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: emailMode === 'group' ? THEME.status.success + '15' : THEME.status.warning + '15', border: `1px solid ${emailMode === 'group' ? THEME.status.success + '30' : THEME.status.warning + '30'}` }}>
            {emailMode === 'group' ? (
              <p style={{ color: THEME.status.success }}>One branded email to all selected — announcement + period header inline.</p>
            ) : (
              <p style={{ color: THEME.status.warning }}>Each person gets their own email with their shifts rendered inline.</p>
            )}
          </div>

          {announcement && announcement.message && (
            <div className="p-2 rounded-lg mb-3 text-xs" style={{ backgroundColor: THEME.accent.blue + '15', border: `1px solid ${THEME.accent.blue}30` }}>
              <p style={{ color: THEME.accent.blue }}>
                <strong>{announcement.subject || 'Announcement'}</strong> will be included in {emailMode === 'group' ? 'the email' : 'all emails'}
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

          {sending && emailMode === 'individual' && inFlight.total > 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: THEME.text.muted }}>
              Sending {inFlight.current} of {inFlight.total}...
            </p>
          )}

          <div className="flex justify-end gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={handleClose}>Cancel</GradientButton>
            <GradientButton small onClick={handleSend} disabled={sending || selectedCount === 0}>
              {sending ? '...' : <><Send size={10} />{emailMode === 'group' ? 'Send Email' : `Send ${selectedCount}`}</>}
            </GradientButton>
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
            style={{ backgroundColor: allFailed ? THEME.status.error + '20' : THEME.status.success + '20' }}>
            {allFailed
              ? <X size={20} style={{ color: THEME.status.error }} />
              : <Check size={20} style={{ color: THEME.status.success }} />}
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>
            {allFailed
              ? 'Send failed'
              : allSuccess
                ? `Sent to ${sentCount} ${sentCount === 1 ? 'person' : 'people'}`
                : `Sent to ${sentCount} of ${sentCount + failedCount}`}
          </h3>
          {!allSuccess && !allFailed && (
            <p className="text-xs mb-1" style={{ color: THEME.status.warning }}>See details below</p>
          )}
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>
            Schedule rendered in the email body.
          </p>
          <div className="text-left p-2 rounded-lg mb-3 max-h-28 overflow-y-auto" style={{ backgroundColor: THEME.bg.tertiary }}>
            {results.map((r, i) => (
              <div key={r.emp.email || i} className="flex items-center justify-between py-0.5 text-xs">
                <span style={{ color: THEME.text.primary }}>{r.emp.name}</span>
                <span style={{
                  color: r.status === 'skipped'
                    ? THEME.text.muted
                    : r.status === 'failed'
                      ? THEME.status.error
                      : THEME.status.success
                }}>
                  {r.status === 'skipped'
                    ? '(no shifts)'
                    : r.status === 'failed'
                      ? `Failed${r.reason ? ': ' + r.reason.slice(0, 30) : ''}`
                      : 'Sent'}
                </span>
              </div>
            ))}
          </div>
          {allFailed ? (
            <GradientButton small onClick={() => { setSent(false); setSending(false); setResults([]); }}>Retry</GradientButton>
          ) : (
            <GradientButton small onClick={handleClose}>Done</GradientButton>
          )}
        </div>
      )}
    </Modal>
  );
};
