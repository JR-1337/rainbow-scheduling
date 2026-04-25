import React from 'react';
import { Trash2, Zap } from 'lucide-react';
import { Modal, GradientButton } from '../components/primitives';
import { THEME } from '../theme';

export function AutoPopulateConfirmModal({ state, onClose, onConfirm }) {
  if (!state) return null;
  const isClear = state.type.includes('clear');
  const isPopulate = state.type.includes('populate');

  return (
    <Modal isOpen onClose={onClose} title="Confirm Action" size="sm">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: isClear ? THEME.status.error + '20' : THEME.accent.blue + '20' }}>
          {isClear
            ? <Trash2 size={24} style={{ color: THEME.status.error }} />
            : <Zap size={24} style={{ color: THEME.accent.blue }} />}
        </div>

        <p className="text-sm font-medium mb-2" style={{ color: THEME.text.primary }}>
          {state.type === 'populate-all' && `Auto-Fill All Full-Time for Week ${state.week}?`}
          {state.type === 'populate-week' && `Auto-Fill Week ${state.week} for ${state.employee?.name}?`}
          {state.type === 'clear-week' && `Clear Week ${state.week} for ${state.employee?.name}?`}
          {state.type === 'clear-all' && `Clear All Full-Time Shifts for Week ${state.week}?`}
          {state.type === 'clear-all-pt' && `Clear All Part-Time Shifts for Week ${state.week}?`}
        </p>

        <p className="text-xs mb-4" style={{ color: THEME.text.secondary }}>
          {isPopulate
            ? 'Some shifts already exist and will be preserved. Only empty days will be filled based on availability.'
            : 'This will remove the selected shifts. You can undo by not saving changes.'}
        </p>

        <div className="flex justify-center gap-2">
          <GradientButton variant="secondary" small onClick={onClose}>
            Cancel
          </GradientButton>
          <GradientButton small danger={isClear} onClick={onConfirm}>
            {isClear ? 'Clear Shifts' : 'Auto-Fill'}
          </GradientButton>
        </div>
      </div>
    </Modal>
  );
}
