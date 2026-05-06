import { useRef, useCallback, useMemo } from 'react';

export function useLongPress(onLongPress, { ms = 500, moveThreshold: moveThresholdOpt } = {}) {
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches;
  const moveThreshold = moveThresholdOpt ?? (coarse ? 28 : 10);

  const timerRef = useRef(null);
  const startPosRef = useRef(null);
  const firedRef = useRef(false);
  const scrollLockRef = useRef(false);
  const touchElRef = useRef(null);

  // Native non-passive touchmove + preventDefault while the long-press timer is armed
  // stops the surrounding overflow-scroll view from stealing the gesture on Android
  // (small touchmove deltas were clearing the 10px threshold before 500ms).
  const blockScrollListener = useCallback((e) => {
    if (scrollLockRef.current) e.preventDefault();
  }, []);

  const setTouchRef = useCallback((el) => {
    const prev = touchElRef.current;
    if (prev === el) return;
    if (prev) prev.removeEventListener('touchmove', blockScrollListener);
    touchElRef.current = el;
    if (el) el.addEventListener('touchmove', blockScrollListener, { passive: false });
  }, [blockScrollListener]);

  const start = useCallback((e) => {
    firedRef.current = false;
    scrollLockRef.current = true;
    const t = e.touches?.[0];
    startPosRef.current = t ? { x: t.clientX, y: t.clientY } : null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      scrollLockRef.current = false;
      onLongPress(e);
    }, ms);
  }, [onLongPress, ms, moveThreshold]);

  const cancel = useCallback(() => {
    scrollLockRef.current = false;
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

  const handlers = useMemo(() => ({
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: move,
    onTouchCancel: cancel,
  }), [start, move, cancel]);

  return { handlers, wasLongPress, setTouchRef };
}
