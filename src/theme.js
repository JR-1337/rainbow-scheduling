// OTR brand identity + derived theme. Module-init side effects:
//   - rotates localStorage 'otr-accent' index on each load
//   - writes --accent-color + --accent-color-40 CSS vars on <html>
// Imported once at app boot via src/App.jsx.

export const OTR = {
  white: '#FDFEFC',
  navy: '#0D0E22',
  accents: [
    { primary: '#EC3228', dark: '#BD2820' },  // Red
    { primary: '#0453A3', dark: '#034282' },  // Blue
    { primary: '#F57F20', dark: '#C4661A' },  // Orange
    { primary: '#00A84D', dark: '#00863E' },  // Green
    { primary: '#932378', dark: '#761C60' },  // Purple
  ],
};

const _prevAccent = parseInt(localStorage.getItem('otr-accent') || '-1', 10);
const _accentIdx = (_prevAccent + 1) % OTR.accents.length;
try { localStorage.setItem('otr-accent', _accentIdx); } catch {}
export const OTR_ACCENT = OTR.accents[_accentIdx];

const _srgbToLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const _relLum = (hex) => {
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  return 0.2126*_srgbToLinear(r) + 0.7152*_srgbToLinear(g) + 0.0722*_srgbToLinear(b);
};
const _contrast = (hex1, hex2) => {
  const l1 = _relLum(hex1), l2 = _relLum(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};
// Brand decision: gradient primary buttons always use white text for OTR consistency
// across all 5 accent colors, even when navy would have higher WCAG contrast (orange/green/red).
const _accentText = '#FFFFFF';
const _ar = parseInt(OTR_ACCENT.primary.slice(1,3),16), _ag = parseInt(OTR_ACCENT.primary.slice(3,5),16), _ab = parseInt(OTR_ACCENT.primary.slice(5,7),16);

const _hour = new Date().getHours();
const _navyBase = (_hour >= 18 || _hour < 6) ? '#111326' : OTR.navy;

export const THEME = {
  bg: { primary: _navyBase, secondary: '#FFFFFF', tertiary: '#F5F3F0', elevated: '#FFFFFF', hover: '#EDECEA' },
  tooltip: { bg: '#FFFFFF', border: OTR_ACCENT.primary + '60' },
  accent: { blue: OTR_ACCENT.primary, purple: OTR_ACCENT.dark, cyan: '#09728C', pink: OTR_ACCENT.primary, text: _accentText },
  text: { primary: OTR.navy, secondary: '#5C5C5C', muted: '#8B8580' },
  roles: { cashier: '#932378', backupCashier: '#B44D9A', mens: '#0453A3', womens: '#EC3228', floorMonitor: '#F57F20', none: '#64748B' },
  border: { subtle: `rgba(${_ar}, ${_ag}, ${_ab}, 0.15)`, default: OTR_ACCENT.primary + '80', bright: OTR_ACCENT.primary },
  status: { success: '#34D399', warning: '#FBBF24', error: '#F87171' },
  task: '#D97706',
  shadow: {
    card: `0 8px 32px -4px rgba(${_ar},${_ag},${_ab},0.55), 0 4px 12px -2px rgba(${_ar},${_ag},${_ab},0.4)`,
    cardSm: `0 4px 16px -2px rgba(${_ar},${_ag},${_ab},0.42)`,
  },
};

if (typeof document !== 'undefined') {
  document.documentElement.style.setProperty('--accent-color', OTR_ACCENT.primary);
  document.documentElement.style.setProperty('--accent-color-40', OTR_ACCENT.primary + '66');
}

export const TYPE = {
  caption: 'clamp(11px, 0.8vw + 8px, 12px)',
  body: 'clamp(13px, 1vw + 9px, 14px)',
  subtitle: 'clamp(14px, 1.1vw + 10px, 16px)',
  title: 'clamp(16px, 1.2vw + 11px, 18px)',
  heading: 'clamp(18px, 1.3vw + 12px, 20px)',
  display: 'clamp(20px, 1.5vw + 14px, 24px)',
};
