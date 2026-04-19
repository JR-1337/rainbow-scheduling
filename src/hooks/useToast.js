import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (type, message, duration = 3000) => {
    setToast({ type, message });
    const announcer = typeof document !== 'undefined' && document.getElementById('status-announcer');
    if (announcer) announcer.textContent = message;
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
}
