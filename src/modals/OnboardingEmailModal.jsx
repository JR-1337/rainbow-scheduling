import { useState, useEffect, useRef } from 'react';
import { Mail, Paperclip, X, Loader, Send } from 'lucide-react';
import { THEME } from '../theme';
import { apiCall } from '../utils/api';
import { Modal, GradientButton } from '../components/primitives';

// OTR Green — fixed, not on the accent rotation (formal document palette).
const GREEN = '#00A84D';

// Display size in human-readable form.
const fmtSize = (bytes) => {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
  return bytes + ' B';
};

// Validate email format.
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const DEFAULT_ATTACHMENTS = (employeeName) => [
  { kind: 'welcome', name: 'Welcome - ' + employeeName + '.pdf', size: 'auto', readonly: true },
  { kind: 'fed-td1', name: '2026 Federal tax TD1.pdf', size: '29 KB', readonly: true },
  { kind: 'on-td1', name: '2026 Ontario tax TD1.pdf', size: '24 KB', readonly: true },
];

export const OnboardingEmailModal = ({ isOpen, onClose, employee, currentUser, showToast, onSendSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [recipientError, setRecipientError] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const addFileRef = useRef(null);

  // Seed state whenever modal opens with a new employee.
  useEffect(() => {
    if (!isOpen || !employee) return;
    setRecipient(employee.email || '');
    setSubject('Welcome to Over the Rainbow Ltd.');
    setBodyText('');
    setAttachments(DEFAULT_ATTACHMENTS(employee.name || 'New Employee'));
    setIsSending(false);
    setSendError('');
    setRecipientError('');
    setSubjectError('');
  }, [employee, isOpen]);

  if (!employee) return null;

  const firstName = (employee.name || '').split(' ')[0] || 'there';

  // Validation helpers.
  const validateRecipient = (val) => {
    if (!val.trim()) { setRecipientError('To is required.'); return false; }
    if (!isValidEmail(val.trim())) { setRecipientError('Enter a valid email address.'); return false; }
    setRecipientError('');
    return true;
  };
  const validateSubject = (val) => {
    if (!val.trim()) { setSubjectError('Subject is required.'); return false; }
    setSubjectError('');
    return true;
  };

  const canSend = !isSending && isValidEmail(recipient.trim()) && subject.trim().length > 0;

  // File picker handler: read each file as base64, validate size, push chip.
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const MAX_PER_FILE = 10 * 1024 * 1024; // 10 MB
    const MAX_TOTAL = 25 * 1024 * 1024;    // 25 MB
    const currentExtra = attachments.filter(a => !a.readonly);
    const currentTotalSize = currentExtra.reduce((s, a) => s + (a.bytes || 0), 0);

    files.forEach((file) => {
      if (file.size > MAX_PER_FILE) {
        showToast?.('error', `${file.name} exceeds 10 MB limit and was not added.`);
        return;
      }
      if (currentTotalSize + file.size > MAX_TOTAL) {
        showToast?.('error', `Adding ${file.name} would exceed the 25 MB total limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        // data URL format: data:<mime>;base64,<payload>
        const dataUrl = evt.target.result;
        const base64 = dataUrl.split(',')[1];
        setAttachments(prev => [
          ...prev,
          {
            kind: 'upload',
            name: file.name,
            size: fmtSize(file.size),
            bytes: file.size,
            mimeType: file.type || 'application/octet-stream',
            dataBase64: base64,
            readonly: false,
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be added again if needed.
    if (addFileRef.current) addFileRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    const recipOk = validateRecipient(recipient);
    const subjectOk = validateSubject(subject);
    if (!recipOk || !subjectOk) return;

    setSendError('');
    setIsSending(true);

    const extras = attachments
      .filter(a => !a.readonly)
      .map(a => ({ name: a.name, mimeType: a.mimeType, dataBase64: a.dataBase64 }));

    try {
      const response = await apiCall('sendOnboardingEmail', {
        employeeId: employee.id,
        recipientEmail: recipient.trim(),
        subject: subject.trim(),
        bodyText,
        attachments: extras,
      });

      if (response && response.success) {
        const sentTo = response.sentTo || recipient.trim();
        const baseMsg = `Onboarding email sent to ${sentTo}`;
        const suffix = response.rewrittenForLaunch ? ' (pre-launch: rewritten to JR)' : '';
        showToast?.('success', baseMsg + suffix);
        onSendSuccess?.(employee.id, response.welcomeSentAtUpdated === true);
        onClose();
      } else {
        const msg = response?.error?.message || response?.error || 'Failed to send onboarding email.';
        setSendError(String(msg));
      }
    } catch (err) {
      setSendError(err?.message || 'Unexpected error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Send Onboarding Email" size="md">

      {/* Amber resend banner — shown only when employee was previously onboarded */}
      {employee.welcomeSentAt && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-xs"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
          <Mail size={14} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
          <span>
            Already sent on <strong>{employee.welcomeSentAt}</strong>. Original timestamp preserved.
          </span>
        </div>
      )}

      {/* To field */}
      <div className="mb-2">
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>
          To <span style={{ color: THEME.status.error }}>*</span>
        </label>
        <input
          type="email"
          value={recipient}
          onChange={e => { setRecipient(e.target.value); if (recipientError) setRecipientError(''); }}
          onBlur={() => validateRecipient(recipient)}
          placeholder="employee@example.com"
          className="w-full px-2 py-1.5 rounded text-sm"
          style={{
            backgroundColor: THEME.bg.elevated,
            color: THEME.text.primary,
            border: `1px solid ${recipientError ? THEME.status.error : THEME.border.default}`,
            outline: 'none',
          }}
        />
        {recipientError && (
          <p className="text-xs mt-0.5" style={{ color: THEME.status.error }}>{recipientError}</p>
        )}
      </div>

      {/* Subject field */}
      <div className="mb-2">
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>
          Subject <span style={{ color: THEME.status.error }}>*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={e => { setSubject(e.target.value); if (subjectError) setSubjectError(''); }}
          onBlur={() => validateSubject(subject)}
          placeholder="Welcome to Over the Rainbow Ltd."
          className="w-full px-2 py-1.5 rounded text-sm"
          style={{
            backgroundColor: THEME.bg.elevated,
            color: THEME.text.primary,
            border: `1px solid ${subjectError ? THEME.status.error : THEME.border.default}`,
            outline: 'none',
          }}
        />
        {subjectError && (
          <p className="text-xs mt-0.5" style={{ color: THEME.status.error }}>{subjectError}</p>
        )}
      </div>

      {/* Body textarea — plaintext only per Decision 12 */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>
          Message <span style={{ color: THEME.text.muted }}>(optional)</span>
        </label>
        <textarea
          value={bodyText}
          onChange={e => setBodyText(e.target.value)}
          placeholder={`Type any extra context for ${firstName} (optional)…`}
          rows={4}
          className="w-full px-2 py-1.5 rounded text-sm resize-y"
          style={{
            backgroundColor: THEME.bg.elevated,
            color: THEME.text.primary,
            border: `1px solid ${THEME.border.default}`,
            outline: 'none',
            fontFamily: 'inherit',
            minHeight: 80,
          }}
        />
        {bodyText.length > 5000 && (
          <p className="text-xs mt-0.5" style={{ color: THEME.status.warning }}>
            {bodyText.length} characters — consider trimming for readability.
          </p>
        )}
      </div>

      {/* Attachment chips */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>
          Attachments
        </label>
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
              style={{
                backgroundColor: THEME.bg.tertiary,
                border: `1px solid ${THEME.border.default}`,
                color: THEME.text.secondary,
                minHeight: 32,
              }}>
              <Paperclip size={11} style={{ color: THEME.text.muted, flexShrink: 0 }} />
              <span className="max-w-32 truncate" title={att.name}>{att.name}</span>
              {att.size && att.size !== 'auto' && (
                <span style={{ color: THEME.text.muted }}>({att.size})</span>
              )}
              {!att.readonly && (
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  title="Remove attachment"
                  className="ml-0.5 rounded-full flex items-center justify-center"
                  style={{
                    color: THEME.text.muted,
                    width: 16,
                    height: 16,
                    minWidth: 16,
                  }}>
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* + Add file button */}
          <button
            type="button"
            onClick={() => addFileRef.current?.click()}
            disabled={isSending}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs disabled:opacity-50"
            style={{
              border: `1px dashed ${THEME.border.default}`,
              color: THEME.text.muted,
              backgroundColor: 'transparent',
              minHeight: 32,
            }}>
            <Paperclip size={11} />
            + Add file
          </button>

          {/* Hidden file input */}
          <input
            ref={addFileRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: THEME.text.muted }}>
          Welcome PDF and TD1 forms are generated and attached by the server. Max 10 MB per file, 25 MB total.
        </p>
      </div>

      {/* Inline send error */}
      {sendError && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: THEME.status.error + '15', border: `1px solid ${THEME.status.error}40`, color: THEME.status.error }}>
          {sendError}
        </div>
      )}

      {/* Action row: Skip (left/secondary) + Send (right/primary) per Material 3 */}
      <div
        className="flex items-center justify-between mt-3 pt-2"
        style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        <GradientButton variant="secondary" small onClick={handleSkip} disabled={isSending}>
          Skip
        </GradientButton>
        <GradientButton small onClick={handleSend} disabled={!canSend}>
          {isSending
            ? <><Loader size={12} className="animate-spin" /> Sending…</>
            : <><Send size={12} /> Send</>}
        </GradientButton>
      </div>
    </Modal>
  );
};
