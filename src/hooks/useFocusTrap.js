import { useEffect } from 'react';

export const useFocusTrap = (ref, isActive) => {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0], last = focusable[focusable.length - 1];
    const prevFocused = document.activeElement;
    first?.focus();
    const trap = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
      if (e.key === 'Escape') el.querySelector('[data-close]')?.click();
    };
    el.addEventListener('keydown', trap);
    return () => { el.removeEventListener('keydown', trap); prevFocused?.focus?.(); };
  }, [isActive, ref]);
};
