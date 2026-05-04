import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2, AlertTriangle, Loader, X } from 'lucide-react';
import { THEME } from '../theme';
import { Modal, GradientButton, Input } from '../components/primitives';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const FIVE_YEARS_MS = 5 * 365 * MS_PER_DAY;

function daysUntilPurgeEligible(archivedAt) {
  if (!archivedAt) return null;
  const archived = new Date(archivedAt);
  const eligible = new Date(archived.getTime() + FIVE_YEARS_MS);
  const now = new Date();
  const diff = Math.ceil((eligible - now) / MS_PER_DAY);
  return diff; // negative = already eligible
}

function resolveArchivedBy(archivedById, employees, archivedList) {
  if (!archivedById) return 'Unknown';
  const found = [...(employees || []), ...(archivedList || [])].find(e => e.id === archivedById);
  return found ? found.name : archivedById;
}

/**
 * v2.32.0: Owner-only panel listing EmployeesArchive rows.
 * Props: isOpen, onClose, archivedEmployees, employees (live list for name resolution),
 *        onRestore, onHardDelete.
 */
export const ArchivedEmployeesPanel = ({ isOpen, onClose, archivedEmployees = [], employees = [], onRestore, onHardDelete }) => {
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [hardDeleteConfirmName, setHardDeleteConfirmName] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handleRestore = async (row) => {
    setIsBusy(true);
    await onRestore(row.id);
    setIsBusy(false);
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setIsBusy(true);
    const success = await onHardDelete(hardDeleteTarget.id, hardDeleteConfirmName);
    setIsBusy(false);
    if (success !== false) {
      setHardDeleteTarget(null);
      setHardDeleteConfirmName('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Archived Employees" size="md">
      {hardDeleteTarget ? (
        <div className="py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: THEME.status.error + '20' }}>
            <Trash2 size={20} style={{ color: THEME.status.error }} />
          </div>
          <h3 className="text-sm font-semibold mb-1 text-center" style={{ color: THEME.text.primary }}>Permanently delete {hardDeleteTarget.name}?</h3>
          <p className="text-xs mb-3 text-center" style={{ color: THEME.text.secondary }}>This cannot be undone. 5-year retention confirmed.</p>
          <p className="text-xs mb-1" style={{ color: THEME.text.muted }}>Type <strong style={{ color: THEME.text.primary }}>{hardDeleteTarget.name}</strong> to confirm</p>
          <Input
            value={hardDeleteConfirmName}
            onChange={e => setHardDeleteConfirmName(e.target.value)}
            placeholder={`Type ${hardDeleteTarget.name} to confirm`}
            className="mb-3"
            autoFocus
          />
          <div className="flex justify-center gap-2">
            <GradientButton variant="secondary" small onClick={() => { setHardDeleteTarget(null); setHardDeleteConfirmName(''); }}>Cancel</GradientButton>
            <GradientButton danger small disabled={isBusy || hardDeleteConfirmName.trim() !== hardDeleteTarget.name.trim()} onClick={handleHardDelete}>
              {isBusy ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {isBusy ? 'Deleting...' : 'Delete forever'}
            </GradientButton>
          </div>
        </div>
      ) : (
        <>
          {archivedEmployees.length === 0 ? (
            <div className="py-6 text-center">
              <Archive size={32} className="mx-auto mb-2" style={{ color: THEME.text.muted }} />
              <p className="text-sm" style={{ color: THEME.text.muted }}>No archived employees.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {archivedEmployees.map(row => {
                const daysLeft = daysUntilPurgeEligible(row.archivedAt);
                const isPurgeEligible = daysLeft !== null && daysLeft <= 0;
                const archivedByName = resolveArchivedBy(row.archivedBy, employees, archivedEmployees);
                return (
                  <div key={row.id} className="p-3 rounded-lg flex items-center justify-between gap-3" style={{ backgroundColor: THEME.bg.tertiary, border: `1px solid ${THEME.border.subtle}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: THEME.text.primary }}>{row.name}</p>
                      <p className="text-xs" style={{ color: THEME.text.muted }}>
                        Archived {row.archivedAt || 'unknown date'} by {archivedByName}
                      </p>
                      {isPurgeEligible ? (
                        <span className="inline-flex items-center gap-1 text-xs mt-0.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: THEME.status.error + '20', color: THEME.status.error }}>
                          <AlertTriangle size={10} />
                          Purge eligible
                        </span>
                      ) : daysLeft !== null ? (
                        <p className="text-xs mt-0.5" style={{ color: THEME.text.muted }}>Purge eligible in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        title="Restore to Employees (Inactive)"
                        disabled={isBusy}
                        onClick={() => handleRestore(row)}
                        className="p-1.5 rounded hover:scale-110 disabled:opacity-50"
                        style={{ backgroundColor: THEME.bg.elevated }}
                      >
                        <ArchiveRestore size={14} style={{ color: THEME.accent.cyan }} />
                      </button>
                      {isPurgeEligible && (
                        <button
                          title="Hard delete (5-year retention met)"
                          disabled={isBusy}
                          onClick={() => { setHardDeleteTarget(row); setHardDeleteConfirmName(''); }}
                          className="p-1.5 rounded hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: THEME.bg.elevated }}
                        >
                          <Trash2 size={14} style={{ color: THEME.status.error }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex justify-end mt-3 pt-2" style={{ borderTop: `1px solid ${THEME.border.subtle}` }}>
            <GradientButton variant="secondary" small onClick={onClose}>Close</GradientButton>
          </div>
        </>
      )}
    </Modal>
  );
};
