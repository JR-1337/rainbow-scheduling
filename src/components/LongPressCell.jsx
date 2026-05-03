import React from 'react';
import { useLongPress } from '../hooks/useLongPress';

export default function LongPressCell({ as: As = 'td', enabled, onLongPress, onClick, children, ...rest }) {
  const { handlers, wasLongPress } = useLongPress(onLongPress || (() => {}));
  const handleClick = (e) => {
    if (wasLongPress()) return;
    onClick?.(e);
  };
  return (
    <As onClick={handleClick} {...(enabled ? handlers : {})} {...rest}>
      {children}
    </As>
  );
}
