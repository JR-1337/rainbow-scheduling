import { useState, useMemo } from 'react';
import { UserCheck, Trash2, Plus, Edit3, Shield } from 'lucide-react';
import { THEME } from '../App';
import { MobileBottomSheet } from '../MobileEmployeeView';
import { Button } from '../components/Button';

export const MobileStaffPanel = ({ isOpen, onClose, employees, onEdit, onAdd, onReactivate, onDelete }) => {
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
        className="px-3 rounded-full text-xs font-medium flex items-center gap-1.5"
        style={{
          backgroundColor: isActive ? color + '25' : THEME.bg.tertiary,
          color: isActive ? color : THEME.text.muted,
          border: `1px solid ${isActive ? color + '60' : THEME.border.subtle}`,
          minHeight: 44,
        }}
      >
        {label}
        <span className="px-1.5 rounded-full" style={{ backgroundColor: isActive ? color + '30' : THEME.bg.elevated, color: isActive ? color : THEME.text.muted, fontSize: 10 }}>{counts[id]}</span>
      </button>
    );
  };

  if (confirmDelete) {
    return (
      <MobileBottomSheet isOpen={isOpen} onClose={() => setConfirmDelete(null)} title="Remove employee?">
        <div className="py-2">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: THEME.status.error }}>
            <Trash2 size={14} />Remove {confirmDelete.name}?
          </h3>
          <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>This removes {confirmDelete.name} from the active roster. Their past shifts stay on the schedule. You can restore from the Deleted tab.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" size="md" leftIcon={Trash2} iconSize={14} onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} style={{ backgroundColor: THEME.status.error, color: '#fff' }}>Remove</Button>
          </div>
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} title="Staff">
      <div className="flex gap-2 mb-3 sticky top-0 z-10 pb-2" style={{ backgroundColor: THEME.bg.secondary }}>
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
        <div
          className="space-y-2"
          style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom))' }}
        >
          {list.map(emp => (
            <div key={emp.id} className="p-2.5 rounded-lg flex items-center justify-between gap-2" style={{ backgroundColor: THEME.bg.tertiary }}>
              <div className={`flex items-center gap-2 flex-1 min-w-0 ${filter === 'deleted' ? 'opacity-60' : ''}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: emp.isAdmin ? THEME.accent.purple + '30' : THEME.bg.elevated, color: emp.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                  {emp.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate flex items-center gap-1" style={{ color: THEME.text.primary }}>
                    {emp.name}
                    {emp.isAdmin && <Shield size={12} style={{ color: THEME.accent.purple, flexShrink: 0 }} />}
                  </p>
                  <p className="text-xs truncate" style={{ color: THEME.text.muted }}>{emp.email}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {filter === 'active' && (
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={Edit3}
                    iconSize={14}
                    onClick={() => onEdit(emp)}
                    aria-label={`Edit ${emp.name}`}
                    style={{ backgroundColor: THEME.bg.elevated }}
                  >
                    Edit
                  </Button>
                )}
                {filter === 'inactive' && (
                  <>
                    <Button
                      variant="recoverable"
                      size="md"
                      onClick={() => onReactivate(emp.id)}
                      style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success, border: 'none' }}
                    >
                      Reactivate
                    </Button>
                    <Button
                      variant="destructive"
                      size="md"
                      leftIcon={Trash2}
                      iconSize={14}
                      onClick={() => setConfirmDelete(emp)}
                      aria-label={`Remove ${emp.name}`}
                      style={{ backgroundColor: THEME.status.error + '20', border: 'none' }}
                    >
                      Remove
                    </Button>
                  </>
                )}
                {filter === 'deleted' && (
                  <Button
                    variant="recoverable"
                    size="md"
                    onClick={() => onReactivate(emp.id)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filter === 'active' && (
        <div
          className="sticky bottom-0 pt-2"
          style={{
            backgroundColor: THEME.bg.secondary,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <Button
            variant="primary"
            size="lg"
            leftIcon={Plus}
            fullWidth
            onClick={onAdd}
            style={{ fontWeight: 600 }}
          >
            Add Employee
          </Button>
        </div>
      )}
    </MobileBottomSheet>
  );
};
