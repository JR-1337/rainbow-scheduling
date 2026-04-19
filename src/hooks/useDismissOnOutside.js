import { useEffect } from 'react';

export function useDismissOnOutside(ref, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onDismiss(); };
    const onKey = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, ref, onDismiss]);
}
