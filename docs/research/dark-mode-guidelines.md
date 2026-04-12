# Dark Mode Design Guidelines

Distilled from Material Design 3, Apple HIG, NNGroup, WebAIM. April 2026.

---

## Background Color

- **Never pure black (#000)**. Causes halation - bright text bleeds/glows for ~33% of population (astigmatism).
- Optimal range: 5-15% lightness with slight hue.
- Material Design standard: #121212 (neutral). Navy alternative: #0D0E22 (blue-tinted, ~5% lightness).
- Professional alternatives: #1D2545, #202A44, #14213D.

## Text Color Hierarchy

Not all text is white:
- **Primary**: Off-white #E8E8E8 to #F0F0F0 (85-90% brightness). Reduces halation vs pure #FFFFFF.
- **Secondary**: Medium gray #999999 to #A0A0A0 (60-70% brightness).
- **Disabled/Muted**: #707070 at 50% opacity (~50% brightness).
- All levels must independently meet 4.5:1 contrast against background.

## Color Saturation

- Saturated colors appear more vibrant on dark backgrounds than light.
- Desaturate by 10-20% for dark mode.
- Fully saturated red/yellow/green vibrate and fatigue eyes.
- Desaturated alternatives: Red #F87171, Yellow #FBBF24, Green #34D399 (vs #DC2626, #D97706, #059669).
- Blue-on-black and dark green-on-navy kill legibility.

## Elevation (Shadows Don't Work)

Shadows are nearly invisible against dark backgrounds. Replace with:

**Tonal Elevation (Material Design 3 approach):**
- Lighter surface colors at higher elevations
- Primary color tint applied to surfaces by elevation level
- Limit to 4-5 levels maximum

Example stack:
- Level 0 (page bg): #0D0E22
- Level 1 (cards): #1A1F3A
- Level 2 (elevated/popover): #242F4F
- Level 3 (modal): #2E3A5F

**Alternative approaches:**
- Subtle 1px borders (#475569 or accent at 15-50% opacity)
- Generous spacing (whitespace replaces lost shadow depth)
- Backdrop blur on modals (`backdrop-filter: blur(8px)`)

## Borders & Dividers

- Minimize literal divider lines. Whitespace is preferred.
- Border colors: #475569, #334155, or white at 20-30% opacity.
- Use only in dense data areas where spacing alone fails.
- 64px gaps between sections > any divider line.

## Form Inputs

- Input background: slightly lighter than page bg (#1E293B or #2D3E52 on navy)
- **Focus state**: Colored outline/border (accent color, 4.5:1 contrast). NOT shadow.
- Error state: Desaturated red (#F87171) with messaging. Not just red border.
- Disabled: 40-50% opacity, gray tone.
- Placeholder: Explicit color, must meet 4.5:1 contrast. Browser defaults fail in dark mode.

## Font Weight

Use 500-600 weight for body text in dark mode (vs 400 in light). Improves readability on dark backgrounds. Especially important for secondary text.

## Anti-Patterns

1. **Simple inversion** - Breaks hierarchy, creates harsh contrast, inconsistent states.
2. **Mid-gray text** - Looks elegant, is unreadable. Especially at small sizes.
3. **Lost hierarchy** - Shadows/gradients vanish; interface feels flat.
4. **Thin font weights** - Even harder to read on dark backgrounds.
5. **Pure white text on pure black** - Halation (glow/bleed), problematic for astigmatic users.
6. **Transparent colored backgrounds** - `accent + '10'` on dark = invisible. Use solid surfaces with accent borders.
7. **Same UI element colors for bg and inner elements** - Page-level bg color on inputs/tabs inside cards = invisible.

## Contrast Testing

- Tool: WebAIM Contrast Checker (webaim.org/resources/contrastchecker/)
- Formula: Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
- Test every text color against its actual background (not just the page bg)
- Test all states: default, hover, focus, disabled, error
- Dark mode must independently pass all WCAG checks

## User Statistics

- ~33% use dark mode exclusively
- ~33% use light mode exclusively
- ~33% switch based on time of day
- Both modes must work equally well if offering both
