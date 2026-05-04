import { useState, useEffect } from 'react';
import { Trash2, Loader, UserCheck, UserX, Shield, Clock, Key, Check, AlertTriangle, Mail } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES } from '../constants';
import { apiCall } from '../utils/api';
import { Modal, GradientButton, Input } from '../components/primitives';
import { hasTitle } from '../utils/employeeRender';
import { computeDefaultPassword } from '../utils/employees';
export const EmployeeFormModal = ({ isOpen, onClose, onSave, onDelete, employee = null, currentUser = null, showToast, suggestedPassword = '', employees = [], onSendOnboarding }) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  // Availability is the outer eligibility window, not the booking window.
  // Default to the widest reasonable bound (06-22) so Sarvi only narrows
  // when an employee has a real constraint. Booking hours come from
  // DEFAULT_SHIFT / per-employee defaultShift via createShiftFromAvailability.
  const defaultAvail = days.reduce(
    (a, d) => ({ ...a, [d]: { available: true, start: '06:00', end: '22:00' } }),
    {}
  );
  const [formData, setFormData] = useState(employee || { name: '', email: '', phone: '', address: '', dob: '', active: true, isAdmin: false, isOwner: false, showOnSchedule: true, employmentType: 'part-time', defaultSection: 'none', adminTier: '', title: '', availability: defaultAvail });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState(suggestedPassword);
  const [pwTouched, setPwTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [displayedPassword, setDisplayedPassword] = useState(employee?.password || '');

  useEffect(() => { setFormData(employee || { name: '', email: '', phone: '', address: '', dob: '', active: true, isAdmin: false, isOwner: false, showOnSchedule: true, employmentType: 'part-time', defaultSection: 'none', adminTier: '', title: '', availability: defaultAvail }); setShowDeleteConfirm(false); setPassword(suggestedPassword); setPwTouched(false); setErrors({}); setDisplayedPassword(employee?.password || ''); }, [employee, isOpen]);

  // Live-preview the default password from the typed name (create mode only,
  // until admin manually edits the password field).
  useEffect(() => {
    if (employee || pwTouched) return;
    setPassword(computeDefaultPassword(formData.name, employees));
  }, [formData.name, employee, pwTouched, employees]);

  const isEditingSelf = employee && currentUser && employee.email === currentUser.email;
  const isEditingOwner = employee?.isOwner === true;
  const canToggleAdmin = !isEditingOwner && !isEditingSelf;
  const canDelete = !isEditingSelf && !isEditingOwner;
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) return;
    if (!formData.email.includes('@')) {
      setErrors({ email: 'Email must include an @ symbol' });
      return;
    }
    if (hasTitle(formData)) {
      const t = (formData.title || '').trim();
      if (t && /\s/.test(t)) {
        setErrors({ title: 'Title must be one word with no spaces (e.g. Manager, not Asst Manager).' });
        return;
      }
    }
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (normalizedEmail) {
      const collision = employees.find(e =>
        !e.deleted &&
        e.id !== formData.id &&
        (e.email || '').trim().toLowerCase() === normalizedEmail
      );
      if (collision) {
        setErrors({ email: `This email is already used by ${collision.name}. Use a different email.` });
        return;
      }
    }
    setIsSaving(true);
    const saveData = { ...formData, id: formData.id || `emp-${Date.now()}` };
    if (hasTitle(formData)) saveData.title = (formData.title || '').trim();
    else saveData.title = '';
    if (!employee && password) saveData.password = password;
    const success = await onSave(saveData);
    setIsSaving(false);
    if (success !== false) onClose();
  };
  const toggleDay = (d) => setFormData({ ...formData, availability: { ...formData.availability, [d]: { ...formData.availability[d], available: !formData.availability[d].available } } });
  const updateTime = (d, f, v) => setFormData({ ...formData, availability: { ...formData.availability, [d]: { ...formData.availability[d], [f]: v } } });

  // v2.24.0: per-day Default Shift (what Auto-Fill books). Decoupled from
  // availability window. Absence → Auto-Fill falls back to availability.
  const getDs = (d) => formData.defaultShift?.[d] || null;
  const updateDefaultTime = (d, f, v) => {
    const cur = formData.defaultShift || {};
    const existing = cur[d] || {};
    // Seed the missing side from availability so saving a single dropdown
    // produces a complete {start,end} pair.
    const av = formData.availability?.[d] || {};
    const next = {
      start: f === 'start' ? v : (existing.start || av.start || '10:00'),
      end: f === 'end' ? v : (existing.end || av.end || '18:00')
    };
    setFormData({ ...formData, defaultShift: { ...cur, [d]: next } });
  };
  const clearDefault = (d) => {
    const cur = { ...(formData.defaultShift || {}) };
    delete cur[d];
    setFormData({ ...formData, defaultShift: Object.keys(cur).length ? cur : null });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add Employee'} size="xl">
      {showDeleteConfirm ? (
        <div className="text-center py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.error + '20' }}>
            <Trash2 size={20} style={{ color: THEME.status.error }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: THEME.text.primary }}>Remove {employee?.name}?</h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>They'll be removed from scheduling but their past shifts will be preserved.</p>
          <div className="flex justify-center gap-2">
            <GradientButton variant="secondary" small onClick={() => setShowDeleteConfirm(false)}>Cancel</GradientButton>
            <GradientButton danger small onClick={async () => {
              setIsSaving(true);
              const success = await onDelete(employee.id);
              setIsSaving(false);
              if (success !== false) onClose();
            }} disabled={isSaving}>
              {isSaving ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {isSaving ? 'Removing...' : 'Remove'}
            </GradientButton>
          </div>
        </div>
      ) : (
        <>
          {employee && onSendOnboarding && (
            <div className="flex items-center justify-end mb-2">
              <button
                type="button"
                onClick={() => onSendOnboarding(employee)}
                title={employee.welcomeSentAt ? `Onboarding sent ${employee.welcomeSentAt}` : 'Onboarding not yet sent'}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                style={{
                  backgroundColor: employee.welcomeSentAt ? '#00A84D15' : THEME.bg.tertiary,
                  border: `1px solid ${employee.welcomeSentAt ? '#00A84D40' : THEME.border.default}`,
                  color: employee.welcomeSentAt ? '#00A84D' : THEME.text.muted,
                  minHeight: 32,
                }}>
                <Mail
                  size={14}
                  fill={employee.welcomeSentAt ? '#00A84D' : 'transparent'}
                  stroke={employee.welcomeSentAt ? '#00A84D' : THEME.text.muted}
                />
                <span>{employee.welcomeSentAt ? `Sent ${employee.welcomeSentAt}` : 'Not sent'}</span>
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <div>
              <Input label="Email" type="email" value={formData.email} onChange={e => { setFormData({ ...formData, email: e.target.value }); setErrors({}); }} required />
              {errors.email && <p className="text-xs mt-0.5" style={{ color: THEME.status.error }}>{errors.email}</p>}
            </div>
            <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="DOB" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
          </div>
          <Input label="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          {!employee && (
            <div>
              <Input label="Initial Password" value={password} onChange={e => { setPassword(e.target.value); setPwTouched(true); }} />
              <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>Auto-fills from name (FirstnameL). Case-insensitive at first login. Employee changes it after.</p>
            </div>
          )}

          {!hasTitle(formData) && (
            <div className="mt-2 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
              <span className="text-xs" style={{ color: THEME.text.secondary }}>Default Role</span>
              <select
                value={formData.defaultSection || 'none'}
                onChange={e => setFormData({ ...formData, defaultSection: e.target.value })}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary, border: `1px solid ${THEME.border.default}` }}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
            </div>
          )}

          <div className="mt-2 p-1.5 rounded-lg flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0" style={{ backgroundColor: formData.employmentType === 'full-time' ? THEME.accent.blue + '15' : THEME.bg.tertiary }}>
            <span className="text-xs flex items-center gap-1" style={{ color: formData.employmentType === 'full-time' ? THEME.accent.blue : THEME.text.secondary }}>
              <Clock size={12} />
              Employment Type
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setFormData({ ...formData, employmentType: 'full-time' })}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: formData.employmentType === 'full-time' ? THEME.accent.blue : THEME.bg.elevated, color: formData.employmentType === 'full-time' ? '#fff' : THEME.text.muted }}>
                Full-Time
              </button>
              <button
                onClick={() => setFormData({ ...formData, employmentType: 'part-time' })}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: formData.employmentType === 'part-time' ? THEME.accent.purple : THEME.bg.elevated, color: formData.employmentType === 'part-time' ? '#fff' : THEME.text.muted }}>
                Part-Time
              </button>
            </div>
          </div>

          {employee && (
            <>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="flex-1 p-1.5 rounded-lg flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0" style={{ backgroundColor: formData.active ? THEME.status.success + '15' : THEME.status.warning + '15' }}>
                  <span className="text-xs flex items-center gap-1" style={{ color: formData.active ? THEME.status.success : THEME.status.warning }}>
                    {formData.active ? <UserCheck size={12} /> : <UserX size={12} />}
                    {formData.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    disabled={formData.active && (isEditingSelf || isEditingOwner || formData.isAdmin)}
                    title={formData.active && isEditingSelf ? 'You cannot deactivate your own account' : formData.active && isEditingOwner ? 'The owner account cannot be deactivated' : formData.active && formData.isAdmin ? 'Admin accounts cannot be deactivated. Demote to Staff first.' : ''}
                    className="text-xs px-2 py-0.5 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary }}>
                    {formData.active ? 'Set Inactive' : 'Set Active'}
                  </button>
                </div>

                <div className="flex-1 p-1.5 rounded-lg flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0" style={{ backgroundColor: formData.isAdmin ? THEME.accent.purple + '15' : formData.adminTier === 'admin2' ? THEME.accent.blue + '15' : THEME.bg.tertiary }}>
                  <span className="text-xs flex items-center gap-1" style={{ color: formData.isAdmin ? THEME.accent.purple : formData.adminTier === 'admin2' ? THEME.accent.blue : THEME.text.muted }}>
                    <Shield size={12} />
                    {formData.isOwner ? 'Owner' : formData.isAdmin ? 'Admin' : formData.adminTier === 'admin2' ? 'Admin 2' : 'Staff'}
                  </span>
                  {!formData.isOwner && canToggleAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setFormData({ ...formData, isAdmin: false, adminTier: '' })}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: !formData.isAdmin && formData.adminTier !== 'admin2' ? THEME.text.muted : THEME.bg.elevated, color: !formData.isAdmin && formData.adminTier !== 'admin2' ? '#fff' : THEME.text.muted }}>
                        Staff
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, isAdmin: true, adminTier: 'admin1' })}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: formData.isAdmin ? THEME.accent.purple : THEME.bg.elevated, color: formData.isAdmin ? '#fff' : THEME.text.muted }}>
                        Admin
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, isAdmin: false, adminTier: 'admin2' })}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: formData.adminTier === 'admin2' ? THEME.accent.blue : THEME.bg.elevated, color: formData.adminTier === 'admin2' ? '#fff' : THEME.text.muted }}>
                        Admin 2
                      </button>
                    </div>
                  )}
                  {!formData.isOwner && !canToggleAdmin && isEditingSelf && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ color: THEME.text.muted }}>
                      Can't change own status
                    </span>
                  )}
                </div>
              </div>

              {hasTitle(formData) && (
                <div className="mt-2">
                  <div className="p-1.5 rounded-lg flex items-center justify-between gap-2" style={{ backgroundColor: THEME.bg.tertiary }}>
                    <label className="text-xs shrink-0" style={{ color: THEME.text.secondary }}>Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => {
                        const title = e.target.value.slice(0, 20);
                        setFormData({ ...formData, title });
                        setErrors(prev => {
                          if (!prev.title) return prev;
                          const next = { ...prev };
                          delete next.title;
                          return next;
                        });
                      }}
                      placeholder="Manager, Buyer, VM..."
                      className="flex-1 px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: THEME.bg.elevated,
                        color: THEME.text.primary,
                        border: `1px solid ${errors.title || /\s/.test(formData.title || '') ? THEME.status.warning : THEME.border.default}`,
                      }} />
                  </div>
                  <p className="text-xs mt-1 ml-0.5" style={{ color: THEME.text.muted }}>
                    Optional. One word only (no spaces). Clear the field to remove the label from the schedule.
                  </p>
                  {(errors.title || /\s/.test(formData.title || '')) && (
                    <div className="p-2 rounded-lg mt-1.5 flex items-start gap-2" style={{ backgroundColor: THEME.status.warning + '20', border: `1px solid ${THEME.status.warning}` }}>
                      <AlertTriangle size={14} style={{ color: THEME.status.warning, flexShrink: 0, marginTop: 2 }} />
                      <p className="text-xs leading-snug" style={{ color: THEME.text.secondary }}>
                        {errors.title || 'Title cannot include spaces. Use one word (e.g. Manager) or hyphenate (e.g. Asst-Manager).'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(formData.isAdmin || formData.adminTier === 'admin2') && !formData.isOwner && (
                <div className="mt-2 p-1.5 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <span className="text-xs" style={{ color: THEME.text.secondary }}>Show on schedule grid?</span>
                  <button
                    onClick={() => setFormData({ ...formData, showOnSchedule: !formData.showOnSchedule })}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: formData.showOnSchedule ? THEME.status.success : THEME.bg.elevated, color: formData.showOnSchedule ? '#fff' : THEME.text.muted }}>
                    {formData.showOnSchedule ? 'Yes' : 'No'}
                  </button>
                </div>
              )}

              {!isEditingSelf && !isEditingOwner && (
                <div className="mt-2 p-1.5 rounded-lg" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs flex items-center gap-1" style={{ color: THEME.text.secondary }}>
                      <Key size={11} />
                      Password
                    </span>
                    <button
                      onClick={async () => {
                        const result = await apiCall('resetPassword', {
                                              targetEmail: formData.email
                        });
                        if (result.success) {
                          const newPwd = result.data?.newPassword || 'emp-XXX';
                          setDisplayedPassword(newPwd);
                          if (showToast) showToast('success', `Password reset to ${newPwd}. Share this with ${formData.name}.`);
                        } else {
                          if (showToast) showToast('error', result.error?.message || 'Failed to reset password');
                        }
                      }}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: THEME.status.warning + '20', color: THEME.status.warning }}>
                      Reset to Default
                    </button>
                  </div>
                  <p className="text-sm font-mono font-semibold" style={{ color: THEME.text.primary }}>
                    {displayedPassword ? String(displayedPassword) : <span style={{ color: THEME.text.muted, fontStyle: 'italic', fontFamily: 'inherit' }}>not set — click Reset to Default</span>}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-3">
            <label className="block text-xs font-medium mb-2" style={{ color: THEME.text.secondary }}>Availability</label>
            <div className="grid grid-cols-7 gap-1">
              {days.map(d => {
                const av = formData.availability[d];
                return (
                  <div key={d} className="text-center">
                    <button onClick={() => toggleDay(d)} className="w-full px-1 py-1 rounded text-xs font-medium mb-1" style={{ backgroundColor: av.available ? THEME.accent.purple : THEME.bg.elevated, color: av.available ? 'white' : THEME.text.muted }}>
                      {d.slice(0, 3)}
                    </button>
                    {av.available ? (
                      <div className="space-y-1">
                        <select value={av.start} onChange={e => updateTime(d, 'start', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, fontSize: '9px' }}>
                          {Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                        </select>
                        <select value={av.end} onChange={e => updateTime(d, 'end', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary, fontSize: '9px' }}>
                          {Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="text-xs py-2" style={{ color: THEME.text.muted }}>Off</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Default shift hours</label>
            <p className="text-xs mb-2" style={{ color: THEME.text.muted }}>Auto-Fill books these hours. Leave blank to use availability.</p>
            <div className="grid grid-cols-7 gap-1">
              {days.map(d => {
                const av = formData.availability[d];
                const ds = getDs(d);
                if (!av?.available) {
                  return (
                    <div key={d} className="text-center">
                      <div className="w-full px-1 py-1 rounded text-xs font-medium mb-1" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{d.slice(0, 3)}</div>
                      <div className="text-xs py-2" style={{ color: THEME.text.muted }}>—</div>
                    </div>
                  );
                }
                const startVal = ds?.start || '';
                const endVal = ds?.end || '';
                return (
                  <div key={d} className="text-center">
                    <div className="w-full px-1 py-1 rounded text-xs font-medium mb-1" style={{ backgroundColor: THEME.accent.blue, color: 'white' }}>{d.slice(0, 3)}</div>
                    <div className="space-y-1">
                      <select value={startVal} onChange={e => updateDefaultTime(d, 'start', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: startVal ? THEME.text.primary : THEME.text.muted, fontSize: '9px' }}>
                        <option value="">—</option>
                        {Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                      </select>
                      <select value={endVal} onChange={e => updateDefaultTime(d, 'end', e.target.value)} className="w-full px-0.5 py-0.5 rounded text-center" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: endVal ? THEME.text.primary : THEME.text.muted, fontSize: '9px' }}>
                        <option value="">—</option>
                        {Array.from({ length: 17 }, (_, i) => i + 6).map(h => <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}</option>)}
                      </select>
                      {ds && (
                        <button onClick={() => clearDefault(d)} className="w-full rounded text-center" style={{ fontSize: '9px', color: THEME.text.muted, backgroundColor: 'transparent' }}>clear</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            {employee && canDelete && <GradientButton danger small onClick={() => setShowDeleteConfirm(true)}><Trash2 size={10} />Remove</GradientButton>}
            {employee && !canDelete && (
              <span className="text-xs py-1" style={{ color: THEME.text.muted }}>
                {isEditingSelf ? "Can't remove yourself" : isEditingOwner ? "Can't remove owner" : ''}
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <GradientButton variant="secondary" small onClick={onClose} disabled={isSaving}>Cancel</GradientButton>
              <GradientButton small onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                {isSaving ? 'Saving...' : (employee ? 'Save' : 'Add')}
              </GradientButton>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
