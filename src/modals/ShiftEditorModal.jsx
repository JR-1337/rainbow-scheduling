import React, { useState, useEffect } from 'react';
import { Star, Trash2, Check, AlertTriangle } from 'lucide-react';
import { THEME } from '../theme';
import { ROLES } from '../constants';
import { toDateKey, isStatHoliday, getStoreHoursForDate, formatDateLong, Modal, TimePicker, GradientButton, AnimatedNumber, calculateHours } from '../App';

const getDefaultBookingTimes = (date) => {
  const storeHours = getStoreHoursForDate(date);
  return { start: storeHours.open, end: storeHours.close };
};

export const ShiftEditorModal = ({ isOpen, onClose, onSave, employee, date, existingShift, totalPeriodHours, availability, hasApprovedTimeOff = false }) => {
  const storeHours = getStoreHoursForDate(date);
  const isHoliday = isStatHoliday(date);
  const defaultTimes = getDefaultBookingTimes(date);
  const [shiftData, setShiftData] = useState({ startTime: existingShift?.startTime || defaultTimes.start, endTime: existingShift?.endTime || defaultTimes.end, role: existingShift?.role || 'none', task: existingShift?.task || '' });

  useEffect(() => {
    const dt = getDefaultBookingTimes(date);
    setShiftData({ startTime: existingShift?.startTime || dt.start, endTime: existingShift?.endTime || dt.end, role: existingShift?.role || 'none', task: existingShift?.task || '' });
  }, [existingShift, date]);

  const shiftHours = calculateHours(shiftData.startTime, shiftData.endTime);
  const projectedTotal = totalPeriodHours - (existingShift?.hours || 0) + shiftHours;

  const handleSave = () => { onSave({ employeeId: employee.id, employeeName: employee.name, date: toDateKey(date), ...shiftData, hours: shiftHours }); onClose(); };
  const handleDelete = () => { onSave({ employeeId: employee.id, date: toDateKey(date), deleted: true }); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Shift" size="sm">
      {(hasApprovedTimeOff || (availability && availability.available === false)) && (
        <div className="p-2 rounded-lg mb-2 flex items-start gap-2" style={{ backgroundColor: THEME.status.warning + '20', border: `1px solid ${THEME.status.warning}` }}>
          <AlertTriangle size={14} style={{ color: THEME.status.warning, marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: THEME.text.primary }}>
            {hasApprovedTimeOff
              ? <><strong>{employee.name}</strong> has approved time off for this date.</>
              : <><strong>{employee.name}</strong> is marked unavailable on {formatDateLong(date).split(',')[0]}s.</>}
            <span style={{ color: THEME.text.secondary }}> You can still schedule them, but double-check first.</span>
          </p>
        </div>
      )}

      <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: 'white' }}>{employee.name.charAt(0)}</div>
          <div>
            <p className="font-medium text-xs" style={{ color: THEME.text.primary }}>{employee.name}</p>
            <p className="text-xs" style={{ color: THEME.text.secondary }}>{formatDateLong(date)} {isHoliday && <span style={{ color: THEME.status.warning }}>• Hol</span>}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TimePicker label="Start" value={shiftData.startTime} onChange={t => setShiftData({ ...shiftData, startTime: t })} />
        <TimePicker label="End" value={shiftData.endTime} onChange={t => setShiftData({ ...shiftData, endTime: t })} />
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-1" style={{ color: THEME.text.secondary }}>Role</label>
        <div className="grid grid-cols-3 gap-1">
          {ROLES.map(r => <button key={r.id} onClick={() => setShiftData({ ...shiftData, role: r.id })} className="px-1.5 py-1 rounded text-xs font-medium" style={{ backgroundColor: shiftData.role === r.id ? r.color : THEME.bg.elevated, color: shiftData.role === r.id ? 'white' : THEME.text.primary, border: `1px solid ${shiftData.role === r.id ? r.color : THEME.border.default}` }}>{r.name}</button>)}
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-medium mb-0.5" style={{ color: THEME.text.secondary }}>Task <Star size={8} fill={THEME.task} color={THEME.task} className="inline" /></label>
        <input value={shiftData.task} onChange={e => setShiftData({ ...shiftData, task: e.target.value })} placeholder="Optional..." className="w-full px-2 py-1.5 rounded-lg outline-none text-sm" style={{ backgroundColor: THEME.bg.elevated, border: `1px solid ${THEME.border.default}`, color: THEME.text.primary }} />
      </div>

      <div className="p-2 rounded-lg mb-3 grid grid-cols-2 gap-2 text-center" style={{ backgroundColor: THEME.bg.tertiary }}>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>SHIFT</span><p className="text-lg font-bold" style={{ color: THEME.accent.cyan }}><AnimatedNumber value={shiftHours} decimals={1} suffix="h" /></p></div>
        <div><span className="text-xs" style={{ color: THEME.text.muted }}>PERIOD</span><p className="text-lg font-bold" style={{ color: projectedTotal >= 44 ? THEME.status.error : projectedTotal >= 40 ? THEME.status.warning : THEME.accent.cyan }}><AnimatedNumber value={projectedTotal} decimals={1} suffix="h" /></p></div>
      </div>

      <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
        {existingShift && <GradientButton danger small onClick={handleDelete} ariaLabel="Remove shift"><Trash2 size={10} /></GradientButton>}
        <div className="flex gap-2 ml-auto">
          <GradientButton variant="secondary" small onClick={onClose}>Cancel</GradientButton>
          <GradientButton small onClick={handleSave}><Check size={12} />Save</GradientButton>
        </div>
      </div>
    </Modal>
  );
};
