import { useState, useCallback } from 'react';

// Positioned tooltip state + handlers. handleShowTooltip computes a viewport-safe
// position relative to the triggerRef's bounding rect and stores it with the tooltip payload.
export function useTooltip() {
  const [tooltipData, setTooltipData] = useState(null);

  const handleShowTooltip = useCallback((employee, hours, triggerRef, isDeleted) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.right + 8;
      if (left + 240 > window.innerWidth - 20) left = rect.left - 248;
      let top = rect.top;
      if (top < 10) top = 10;
      if (top + 250 > window.innerHeight) top = window.innerHeight - 260;
      setTooltipData({ employee, hours, isDeleted, pos: { top, left } });
    }
  }, []);

  const handleHideTooltip = useCallback(() => setTooltipData(null), []);

  return { tooltipData, handleShowTooltip, handleHideTooltip };
}
