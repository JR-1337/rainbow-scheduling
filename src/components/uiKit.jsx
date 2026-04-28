import { useState, useEffect, useRef } from 'react';
import { DESKTOP_SCHEDULE_GRID_TEMPLATE } from '../constants';
import { THEME } from '../theme';
import { OVERTIME_THRESHOLDS } from '../utils/timemath';

// P4.5 - Haptic feedback (progressive enhancement - no-op on desktop)
export const haptic = (ms = 10) => { try { navigator?.vibrate?.(ms); } catch {} };

// P4.3 - Kinetic animated number (counts up/down smoothly, highlights overtime)
export const AnimatedNumber = ({ value, decimals = 0, suffix = '', className, style, overtimeThreshold = OVERTIME_THRESHOLDS.OVER_RED }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current === value) return;
    const start = prevRef.current, diff = value - start;
    const duration = 400;
    const factor = Math.pow(10, decimals);
    let startTime;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round((start + diff * eased) * factor) / factor);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevRef.current = value;
  }, [value, decimals]);
  const isOvertime = typeof value === 'number' && value >= overtimeThreshold;
  const formatted = decimals > 0 ? Number(display).toFixed(decimals) : display;
  return (
    <span
      className={className}
      style={{ ...style, ...(isOvertime ? { textShadow: '0 0 8px rgba(248,113,113,0.45)' } : {}) }}
    >{formatted}{suffix}</span>
  );
};

// P3.4 - Staffing progress bar (visual complement to "3/5" text)
export const StaffingBar = ({ scheduled, target }) => {
  if (!target) return null;
  const pct = Math.min((scheduled / target) * 100, 100);
  const color = pct >= 100 ? '#34D399' : pct >= 75 ? '#FBBF24' : '#F87171';
  return (
    <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.1)', marginTop: 2 }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, backgroundColor: color, transition: 'width 300ms ease-out' }} />
    </div>
  );
};

// Fix 6 - Skeleton loading grid
export const ScheduleSkeleton = () => (
  <div className="p-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <div className="flex gap-2 mb-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton-pulse h-8 flex-1" />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: DESKTOP_SCHEDULE_GRID_TEMPLATE, gap: '2px' }}>
      <div className="skeleton-pulse h-10" />
      {[...Array(7)].map((_, i) => <div key={`h-${i}`} className="skeleton-pulse h-10" />)}
      {[...Array(56)].map((_, i) => <div key={`c-${i}`} className="skeleton-pulse h-[4.5rem]" />)}
    </div>
  </div>
);

export const TaskStarTooltip = ({ task, show, triggerRef }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 150) });
    }
  }, [show, triggerRef]);
  if (!show) return null;
  return (
    <div className="fixed p-2 rounded-lg text-xs shadow-xl" style={{ top: pos.top, left: pos.left, maxWidth: 140, backgroundColor: THEME.tooltip.bg, border: `1px solid ${THEME.task}`, color: THEME.text.primary, zIndex: 99999 }}>
      {task}
    </div>
  );
};

// GRADIENT BACKGROUND - FlutterFlow style (static)
export const GradientBackground = () => (
  <div className="fixed inset-0 -z-10" style={{ backgroundColor: THEME.bg.primary }} />
);

// LOGO COMPONENT - Matching font style
export const Logo = () => (
  <div className="flex flex-col items-center leading-none" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
    <span className="text-xs tracking-[0.25em] font-light" style={{ color: THEME.text.primary }}>OVER THE</span>
    <span className="text-lg tracking-[0.15em] font-semibold -mt-0.5" style={{ color: THEME.text.primary }}>RAINBOW</span>
  </div>
);
