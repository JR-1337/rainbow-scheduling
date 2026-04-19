import { useRef } from 'react';

// S41.2: guard against double-submit on admin approve/deny/revoke/cancel actions.
// Apps Script round-trip is 2-3s; impatient users click twice, second click hits
// backend after status already moved and gets a misleading red error toast.
export function useGuardedMutation(showToast) {
  const actionBusyRef = useRef(false);
  const guardedMutation = async (label, fn) => {
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    showToast('saving', `${label}…`, 30000);
    try {
      await fn();
    } finally {
      actionBusyRef.current = false;
    }
  };
  return guardedMutation;
}
