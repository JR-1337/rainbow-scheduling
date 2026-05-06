import React, { useRef, useLayoutEffect, useCallback } from 'react';
import { useLongPress } from '../hooks/useLongPress';

export default function LongPressCell({ as: As = 'td', enabled, onLongPress, onClick, children, ...rest }) {
  const { handlers, wasLongPress, setTouchRef } = useLongPress(onLongPress || (() => {}));
  const nodeRef = useRef(null);

  const handleClick = (e) => {
    if (wasLongPress()) return;
    onClick?.(e);
  };

  const { ref: refFromParent, ...restSansRef } = rest;

  const mergedRef = useCallback((node) => {
    nodeRef.current = node;
    if (typeof refFromParent === 'function') refFromParent(node);
    else if (refFromParent != null) refFromParent.current = node;
  }, [refFromParent]);

  useLayoutEffect(() => {
    if (enabled && nodeRef.current) setTouchRef(nodeRef.current);
    else setTouchRef(null);
    return () => setTouchRef(null);
  }, [enabled, setTouchRef]);

  return (
    <As onClick={handleClick} ref={mergedRef} {...(enabled ? handlers : {})} {...restSansRef}>
      {children}
    </As>
  );
}
