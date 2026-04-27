import { useState, useMemo } from 'react';
import { UserCheck, Shield, Edit3, Trash2 } from 'lucide-react';
import { THEME } from '../theme';
import { Modal } from '../components/primitives';

// Desktop Manage Staff panel. Mirrors mobile MobileStaffPanel chip filter so
// admins can browse Active / Inactive / Deleted from one panel on desktop too.
export const InactiveEmployeesPanel = ({ isOpen, onClose, employees, onEdit, onReactivate, onDelete }) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Staff" size="md">
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
                  <button onClick={() => onEdit(emp)} className="px-2 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.primary, border: `1px solid ${THEME.border.subtle}` }}>
                    <Edit3 size={10} />Edit
                  </button>
                )}
                {filter === 'active' && (
                  <button onClick={() => setConfirmDelete(emp)} className="px-2 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: THEME.action.destructiveTonal.bg, color: THEME.action.destructiveTonal.fg, border: `1px solid ${THEME.action.destructiveTonal.border}` }}>
                    <Trash2 size={10} />Delete
                  </button>
                )}
                {filter === 'inactive' && (
                  <>
                    <button onClick={() => onReactivate(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}>Reactivate</button>
                    <button onClick={() => onDelete(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>Remove</button>
                  </>
                )}
                {filter === 'deleted' && (
                  <button
                    onClick={() => onReactivate(emp.id)}
                    className="px-2 py-1 rounded text-xs font-medium hover:opacity-80"
                    style={{ backgroundColor: THEME.action.recoverable.bg, color: THEME.action.recoverable.fg, border: `1px solid ${THEME.action.recoverable.border}` }}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmDelete(null)}>
          <div className="rounded-xl p-4 max-w-sm w-full" style={{ backgroundColor: THEME.bg.secondary, border: `1px solid ${THEME.border.default}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: THEME.status.error }}>
              <Trash2 size={14} />Delete {confirmDelete.name}?
            </h3>
            <p className="text-xs mb-3" style={{ color: THEME.text.secondary }}>This removes {confirmDelete.name} from the active roster. Their past shifts stay on the schedule. You can restore from the Deleted tab.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: THEME.bg.tertiary, color: THEME.text.primary }}>Cancel</button>
              <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} className="px-3 py-1.5 rounded text-xs font-medium" style={{ backgroundColor: THEME.status.error, color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
