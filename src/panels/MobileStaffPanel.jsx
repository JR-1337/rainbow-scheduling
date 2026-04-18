import React, { useState, useMemo } from 'react';
import { UserCheck, UserX, Trash2, Plus, Edit3, Shield } from 'lucide-react';
import { THEME, Modal } from '../App';

export const MobileStaffPanel = ({ isOpen, onClose, employees, onEdit, onAdd, onReactivate, onDelete }) => {
  const [filter, setFilter] = useState('active');

  const { active, inactive, deleted } = useMemo(() => ({
    active: employees.filter(e => e.active && !e.deleted),
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
          minHeight: 36,
        }}
      >
        {label}
        <span className="px-1.5 rounded-full" style={{ backgroundColor: isActive ? color + '30' : THEME.bg.elevated, color: isActive ? color : THEME.text.muted, fontSize: 10 }}>{counts[id]}</span>
      </button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff" size="lg">
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
        <div className="space-y-2 pb-16">
          {list.map(emp => (
            <div key={emp.id} className="p-2.5 rounded-lg flex items-center justify-between gap-2" style={{ backgroundColor: THEME.bg.tertiary }}>
              <div className={`flex items-center gap-2 flex-1 min-w-0 ${filter === 'deleted' ? 'opacity-60' : ''}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: emp.isAdmin ? THEME.accent.purple + '30' : THEME.bg.elevated, color: emp.isAdmin ? THEME.accent.purple : THEME.text.muted }}>
                  {emp.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate flex items-center gap-1" style={{ color: THEME.text.primary }}>
                    {emp.name}
                    {emp.isAdmin && <Shield size={10} style={{ color: THEME.accent.purple, flexShrink: 0 }} />}
                  </p>
                  <p className="text-xs truncate" style={{ color: THEME.text.muted }}>{emp.email}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {filter === 'active' && (
                  <button
                    onClick={() => onEdit(emp)}
                    className="px-2.5 py-2 rounded-lg flex items-center gap-1 text-xs font-medium"
                    style={{ backgroundColor: THEME.bg.elevated, color: THEME.text.secondary, border: `1px solid ${THEME.border.default}`, minHeight: 36 }}
                    aria-label={`Edit ${emp.name}`}
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>
                )}
                {filter === 'inactive' && (
                  <>
                    <button
                      onClick={() => onReactivate(emp.id)}
                      className="px-2.5 py-2 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: THEME.status.success + '20', color: THEME.status.success, minHeight: 36 }}
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={() => onDelete(emp.id)}
                      className="px-2.5 py-2 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error, minHeight: 36 }}
                    >
                      Remove
                    </button>
                  </>
                )}
                {filter === 'deleted' && (
                  <button
                    onClick={() => onReactivate(emp.id)}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'rgba(4, 83, 163, 0.20)', color: '#60A5FA', border: '1px solid rgba(4, 83, 163, 0.40)', minHeight: 36 }}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filter === 'active' && (
        <div className="sticky bottom-0 pt-2" style={{ backgroundColor: THEME.bg.secondary }}>
          <button
            onClick={onAdd}
            className="w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`, color: THEME.accent.text }}
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      )}
    </Modal>
  );
};
