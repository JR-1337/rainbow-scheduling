import { useState, useCallback, useRef } from 'react';

// Delayed hide lets the cursor traverse the gap between trigger and tooltip card
// without the tooltip disappearing, so users can click links inside it.
export function useTooltip() {
  const [tooltipData, setTooltipData] = useState(null);
  const hideTimerRef = useRef(null);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const handleShowTooltip = useCallback((employee, hours, triggerRef, isDeleted) => {
    cancelHide();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.right + 8;
      if (left + 240 > window.innerWidth - 20) left = rect.left - 248;
      let top = rect.top;
      if (top < 10) top = 10;
      if (top + 120 > window.innerHeight) top = window.innerHeight - 130;
      setTooltipData({ employee, hours, isDeleted, pos: { top, left } });
    }
  }, [cancelHide]);

  const handleHideTooltip = useCallback(() => {
    cancelHide();
    hideTimerRef.current = setTimeout(() => setTooltipData(null), 180);
  }, [cancelHide]);

  return { tooltipData, handleShowTooltip, handleHideTooltip, handleTooltipEnter: cancelHide, handleTooltipLeave: handleHideTooltip };
}
