import { useState, useMemo } from 'react';
import { UserCheck, Shield, Edit3, Archive, FolderArchive } from 'lucide-react';
import { THEME } from '../theme';
import { Modal, GradientButton } from '../components/primitives';

// Desktop Employees panel. Mirrors mobile Staff sheet: Active / Inactive /
// Archive (opens EmployeesArchive for owner; admins see chip, tap shows toast if not owner).
// Archive workflow: EmployeeFormModal or Inactive list → Archive button + confirm.
export const EmployeesPanel = ({
  isOpen,
  onClose,
  employees,
  onEdit,
  onReactivate,
  onArchive,
  showArchivedEntry = false,
  archivedCount = 0,
  onOpenArchived,
}) => {
  const [filter, setFilter] = useState('active');
  const [confirmArchive, setConfirmArchive] = useState(null);

  const { active, inactive } = useMemo(() => ({
    active: employees.filter(e => e.active && !e.deleted && !e.isOwner),
    inactive: employees.filter(e => !e.active && !e.isOwner),
  }), [employees]);

  const counts = { active: active.length, inactive: inactive.length };
  const list = filter === 'active' ? active : inactive;

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
      {confirmArchive ? (
        <div className="py-2">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: THEME.status.error }}>
            <Archive size={14} />Archive {confirmArchive.name}?
          </h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>Archive {confirmArchive.name}? Their past shifts stay on the schedule for payroll. Owners can restore from Archived Employees within 5 years.</p>
          <div className="flex justify-end gap-2">
            <GradientButton variant="secondary" small onClick={() => setConfirmArchive(null)}>Cancel</GradientButton>
            <GradientButton danger small onClick={() => { onArchive(confirmArchive.id); setConfirmArchive(null); }}><Archive size={10} />Archive</GradientButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            {chip('active', 'Active', THEME.status.success)}
            {chip('inactive', 'Inactive', THEME.status.warning)}
            {showArchivedEntry && onOpenArchived && (
              <button
                type="button"
                onClick={() => onOpenArchived()}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
                style={{
                  backgroundColor: THEME.bg.tertiary,
                  color: THEME.text.muted,
                  border: `1px solid ${THEME.border.subtle}`,
                }}
              >
                <FolderArchive size={12} style={{ color: THEME.accent.cyan }} aria-hidden />
                Archive
                <span className="px-1.5 rounded-full" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted, fontSize: 10 }}>{archivedCount}</span>
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="text-center py-6">
              <UserCheck size={32} style={{ color: THEME.text.muted }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: THEME.text.secondary }}>No {filter} employees.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {list.map(emp => (
                <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                  <div className={`flex items-center gap-2 flex-1 min-w-0 ${emp.deleted ? 'opacity-70' : ''}`}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium flex items-center gap-1" style={{ color: THEME.text.primary }}>
                        {emp.name}
                        {emp.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple }} />}
                      </p>
                      <p className="text-xs truncate" style={{ color: THEME.text.muted }}>
                        {emp.email}
                        {emp.deleted ? <span className="ml-1 opacity-80">(legacy removed)</span> : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {filter === 'active' && onEdit && (
                      <GradientButton variant="secondary" small onClick={() => onEdit(emp)}><Edit3 size={10} />Edit</GradientButton>
                    )}
                    {filter === 'inactive' && (
                      <>
                        <GradientButton variant="secondary" small onClick={() => onReactivate(emp.id)}>Reactivate</GradientButton>
                        {!emp.deleted && (
                          <GradientButton danger small onClick={() => setConfirmArchive(emp)}><Archive size={10} />Archive</GradientButton>
                        )}
                      </>
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
