import { useEffect } from 'react';

export function useUnsavedWarning(unsaved) {
  useEffect(() => {
    if (!unsaved) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [unsaved]);
}
