import { useState, useMemo } from 'react';
import { UserCheck, Shield, Edit3, Trash2 } from 'lucide-react';
import { THEME } from '../theme';
import { Modal, GradientButton } from '../components/primitives';

// Desktop Employees panel. Mirrors mobile MobileStaffPanel chip filter so
// admins can browse Active / Inactive / Deleted from one panel on desktop too.
// Delete itself happens inside EmployeeFormModal (Edit -> Remove with built-in
// confirm at EmployeeFormModal:80) so we don't duplicate that flow here.
export const EmployeesPanel = ({ isOpen, onClose, employees, onEdit, onReactivate, onDelete }) => {
  const [filter, setFilter] = useState('active');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { active, inactive, deleted } = useMemo(() => ({
    active: employees.filter(e => e.active && !e.deleted && !e.isOwner),
    inactive: employees.filter(e => !e.active && !e.deleted && !e.isOwner),
    deleted: employees.filter(e => e.deleted && !e.isOwner),
  }), [employees]);

  const counts = { active: active.length, inactive: inactive.length, deleted: deleted.length };
  const list = filter === 'active' ? active : filter === 'inactive' ? inactive : deleted;

  if (!isOpen) return null;

  const chip = (id, label, color) => {
    const isActive = filter === id;
    return (
      <button
        key={id}
        onClick={() => setFilter(id)}
        className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
        style={{
          backgroundColor: isActive ? color + '25' : THEME.bg.tertiary,
          color: isActive ? color : THEME.text.muted,
          border: `1px solid ${isActive ? color + '60' : THEME.border.subtle}`,
        }}
      >
        {label}
        <span className="px-1.5 rounded-full" style={{ backgroundColor: isActive ? color + '30' : THEME.bg.elevated, color: isActive ? color : THEME.text.muted, fontSize: 10 }}>{counts[id]}</span>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employees" size="md">
      {confirmDelete ? (
        <div className="py-2">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: THEME.status.error }}>
            <Trash2 size={14} />Remove {confirmDelete.name}?
          </h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>This removes {confirmDelete.name} from the active roster. Their past shifts stay on the schedule. You can restore from the Deleted tab.</p>
          <div className="flex justify-end gap-2">
            <GradientButton variant="secondary" small onClick={() => setConfirmDelete(null)}>Cancel</GradientButton>
            <GradientButton danger small onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}><Trash2 size={10} />Remove</GradientButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            {chip('active', 'Active', THEME.status.success)}
            {chip('inactive', 'Inactive', THEME.status.warning)}
            {chip('deleted', 'Deleted', THEME.text.muted)}
          </div>

          {list.length === 0 ? (
            <div className="text-center py-6">
              <UserCheck size={32} style={{ color: THEME.text.muted }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: THEME.text.secondary }}>No {filter} employees.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filter === 'deleted' && (
                <p className="text-xs mb-2" style={{ color: THEME.text.muted }}>These employees' past shifts are preserved on the schedule.</p>
              )}
              {list.map(emp => (
                <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <div className={`flex items-center gap-2 flex-1 min-w-0 ${filter === 'deleted' ? 'opacity-60' : ''}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                        {emp.name}
                        {emp.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                      </p>
                      <p className="text-xs truncate" style={{ color: THEME.text.muted }}>{emp.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {filter === 'active' && onEdit && (
                      <GradientButton variant="secondary" small onClick={() => onEdit(emp)}><Edit3 size={10} />Edit</GradientButton>
                    )}
                    {filter === 'inactive' && (
                      <>
                        <GradientButton variant="secondary" small onClick={() => onReactivate(emp.id)}>Reactivate</GradientButton>
                        <GradientButton danger small onClick={() => setConfirmDelete(emp)}><Trash2 size={10} />Remove</GradientButton>
                      </>
                    )}
                    {filter === 'deleted' && (
                      <GradientButton variant="secondary" small onClick={() => onReactivate(emp.id)}>Restore</GradientButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
