// Long-press hook. To debug on phone, run in console: localStorage.setItem('lp_debug', '1') then reload.
// Logs touchstart/move-cancel/cancel/fire/fire-complete events to console.
import { useRef, useCallback } from 'react';

const lpDebug = (...args) => {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('lp_debug') === '1') {
    console.log('[useLongPress]', ...args);
  }
};

export function useLongPress(onLongPress, { ms = 500, moveThreshold = 10 } = {}) {
  const timerRef = useRef(null);
  const startPosRef = useRef(null);
  const firedRef = useRef(false);

  const start = useCallback((e) => {
    firedRef.current = false;
    const t = e.touches?.[0];
    startPosRef.current = t ? { x: t.clientX, y: t.clientY } : null;
    if (timerRef.current) clearTimeout(timerRef.current);
    lpDebug('touchstart', { x: t?.clientX, y: t?.clientY, ms, moveThreshold });
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      lpDebug('fire', { ms });
      onLongPress(e);
      lpDebug('fire-complete');
    }, ms);
  }, [onLongPress, ms]);

  const cancel = useCallback(() => {
    lpDebug('cancel', { firedAlready: firedRef.current, hadTimer: !!timerRef.current });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback((e) => {
    if (!startPosRef.current || !timerRef.current) return;
    const t = e.touches?.[0];
    if (!t) return;
    const dx = Math.abs(t.clientX - startPosRef.current.x);
    const dy = Math.abs(t.clientY - startPosRef.current.y);
    if (dx > moveThreshold || dy > moveThreshold) {
      lpDebug('move-cancel', { dx, dy, threshold: moveThreshold });
      cancel();
    }
  }, [cancel, moveThreshold]);

  const wasLongPress = useCallback(() => firedRef.current, []);

  return {
    handlers: { onTouchStart: start, onTouchEnd: cancel, onTouchMove: move, onTouchCancel: cancel },
    wasLongPress
  };
}
