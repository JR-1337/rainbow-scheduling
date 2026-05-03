import { useRef, useCallback } from 'react';

export function useLongPress(onLongPress, { ms = 500, moveThreshold = 10 } = {}) {
  const timerRef = useRef(null);
  const startPosRef = useRef(null);
  const firedRef = useRef(false);

  const start = useCallback((e) => {
    firedRef.current = false;
    const t = e.touches?.[0];
    startPosRef.current = t ? { x: t.clientX, y: t.clientY } : null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      onLongPress(e);
    }, ms);
  }, [onLongPress, ms]);

  const cancel = useCallback(() => {
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
    if (dx > moveThreshold || dy > moveThreshold) cancel();
  }, [cancel, moveThreshold]);

  const wasLongPress = useCallback(() => firedRef.current, []);

  return {
    handlers: { onTouchStart: start, onTouchEnd: cancel, onTouchMove: move, onTouchCancel: cancel },
    wasLongPress
  };
}
