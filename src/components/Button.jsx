import React from 'react';
import { THEME } from '../theme';

// 5 variants x 3 sizes. Mobile-first: md = 44px min touch target.
// Variants:
//   primary      — brand gradient, white text. Top-of-hierarchy actions.
//   secondary    — tertiary bg + subtle border. Neutral actions.
//   ghost        — transparent bg. Text-only / close buttons.
//   recoverable  — tonal blue (THEME.action.recoverable). Restore / undo.
//   destructive        — tonal red (THEME.action.destructiveTonal). Remove / delete.
//   destructiveOutline — transparent bg with error-colored text + subtle border.
// Sizes: sm = 36px, md = 44px, lg = 48px.

const SIZES = {
  sm: { minHeight: 36, padX: 12, fontSize: 12, iconSize: 14, gap: 6 },
  md: { minHeight: 44, padX: 16, fontSize: 13, iconSize: 16, gap: 8 },
  lg: { minHeight: 48, padX: 20, fontSize: 14, iconSize: 18, gap: 8 },
};

const variantStyle = (variant) => {
  switch (variant) {
    case 'primary':
      return {
        background: `linear-gradient(135deg, ${THEME.accent.blue}, ${THEME.accent.purple})`,
        color: THEME.accent.text,
        border: 'none',
      };
    case 'secondary':
      return {
        backgroundColor: THEME.bg.tertiary,
        color: THEME.text.secondary,
        border: `1px solid ${THEME.border.default}`,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: THEME.text.secondary,
        border: 'none',
      };
    case 'recoverable':
      return {
        backgroundColor: THEME.action.recoverable.bg,
        color: THEME.action.recoverable.fg,
        border: `1px solid ${THEME.action.recoverable.border}`,
      };
    case 'destructive':
      return {
        backgroundColor: THEME.action.destructiveTonal.bg,
        color: THEME.action.destructiveTonal.fg,
        border: `1px solid ${THEME.action.destructiveTonal.border}`,
      };
    case 'destructiveOutline':
      return {
        backgroundColor: THEME.bg.tertiary,
        color: THEME.status.error,
        border: `1px solid ${THEME.status.error}30`,
      };
    default:
      return {};
  }
};

export const Button = React.forwardRef(({
  variant = 'secondary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconSize,
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  style = {},
  type = 'button',
  ...rest
}, ref) => {
  const s = SIZES[size] || SIZES.md;
  const base = variantStyle(variant);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`rounded-lg font-medium flex items-center justify-center ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        ...base,
        minHeight: s.minHeight,
        paddingLeft: s.padX,
        paddingRight: s.padX,
        fontSize: s.fontSize,
        gap: s.gap,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {LeftIcon && <LeftIcon size={iconSize || s.iconSize} />}
      {children}
      {RightIcon && <RightIcon size={iconSize || s.iconSize} />}
    </button>
  );
});

Button.displayName = 'Button';
