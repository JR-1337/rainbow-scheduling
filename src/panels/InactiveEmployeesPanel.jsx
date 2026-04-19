import { UserCheck, UserX, Trash2 } from 'lucide-react';
import { THEME } from '../theme';
import { Modal } from '../App';

export const InactiveEmployeesPanel = ({ isOpen, onClose, employees, onReactivate, onDelete }) => {
  const inactiveEmps = employees.filter(e => !e.active && !e.deleted && !e.isOwner);
  const deletedEmps = employees.filter(e => e.deleted && !e.isOwner);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Staff" size="md">
      {inactiveEmps.length === 0 && deletedEmps.length === 0 ? (
        <div className="text-center py-6">
          <UserCheck size={32} style={{ color: THEME.text.muted }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: THEME.text.secondary }}>All employees are active!</p>
        </div>
      ) : (
        <>
          {inactiveEmps.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: THEME.status.warning }}>
                <UserX size={12} /> Inactive ({inactiveEmps.length})
              </h3>
              <div className="space-y-1">
                {inactiveEmps.map(emp => (
                  <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: THEME.text.primary }}>{emp.name}</p>
                        <p className="text-xs" style={{ color: THEME.text.muted }}>{emp.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => onReactivate(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success }}>Reactivate</button>
                      <button onClick={() => onDelete(emp.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deletedEmps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: THEME.text.muted }}>
                <Trash2 size={12} /> Removed - History Only ({deletedEmps.length})
              </h3>
              <p className="text-xs mb-2" style={{ color: THEME.text.muted }}>These employees' past shifts are preserved on the schedule.</p>
              <div className="space-y-1">
                {deletedEmps.map(emp => (
                  <div key={emp.id} className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: THEME.bg.tertiary }}>
                    {/* Opacity is applied to the identity region only so the Restore
                        button does not read as disabled (opacity on the parent row
                        attenuates interactive affordance -- see plan Item 10). */}
                    <div className="flex items-center gap-2 opacity-60">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.muted }}>{emp.name.charAt(0)}</div>
                      <p className="text-xs" style={{ color: THEME.text.muted }}>{emp.name}</p>
                    </div>
                    {/* Restore is a recoverable administrative action: tonal OTR brand
                        blue (not green 'go', not red 'danger'). Full opacity so it
                        reads clearly as clickable on the attenuated row. */}
                    <button
                      onClick={() => onReactivate(emp.id)}
                      className="px-2 py-1 rounded text-xs font-medium hover:opacity-80"
                      style={{ backgroundColor: THEME.action.recoverable.bg, color: THEME.action.recoverable.fg, border: `1px solid ${THEME.action.recoverable.border}` }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
