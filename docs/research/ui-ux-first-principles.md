# UI/UX First Principles

Distilled from NNGroup, Material Design 3, Apple HIG, Refactoring UI, Laws of UX, Baymard Institute. April 2026.

---

## Visual Hierarchy

Three levers, in order of power:
1. **Size** - Larger = seen first. Always.
2. **Contrast** - High contrast against surroundings draws the eye
3. **Proximity** - Close together = perceived as related (Gestalt)

Rules:
- One primary action per screen. Two "primaries" = zero.
- Squint test: blur eyes at screen. Hierarchy should survive.
- Heading scale: ~1.25x stepping minimum (Major Third). E.g., 12 > 15 > 19 > 24.
- Three text levels for scanability: primary (bold/large), secondary (regular/medium), tertiary (muted/small). More than 3 = noise.

## Color Theory for UI

**60-30-10 Rule:**
- 60% dominant (backgrounds, surfaces)
- 30% secondary (cards, panels, nav)
- 10% accent (buttons, highlights, status)

**Relationships:**
- Complementary (opposite on wheel): maximum contrast. Good for CTAs, dangerous for surfaces.
- Analogous (adjacent): calm, cohesive. Good for role palettes.
- Simultaneous contrast: same gray looks different on navy vs white. Always test colors in context.
- Chromatic adaptation: eyes adjust to dominant hue over time. After minutes on navy, neutral grays appear warm.

**Numbers:**
- Max hues per view: 5-7. Beyond that = cognitive overload.
- WCAG AA text contrast: 4.5:1 normal text, 3:1 large text (18pt+ or 14pt+ bold)
- WCAG AA UI components: 3:1 against adjacent colors
- Never rely on color alone. Always pair with text, icon, or pattern.

## Gestalt Principles

How the visual cortex groups information (not suggestions - hardwired):

1. **Proximity** - Near = grouped. #1 layout tool. More powerful than borders or color.
2. **Similarity** - Same color/shape/size = same category.
3. **Enclosure** - Borders/backgrounds create groups. Cards work because of this.
4. **Continuity** - Eyes follow lines and curves. Grid lines guide scanning.
5. **Figure/Ground** - Foreground separates from background instantly. Dark bg + white cards = strong.
6. **Common Fate** - Things moving together are grouped.

## Cognitive Load

**Hick's Law**: Decision time increases logarithmically with options. 2 = fast. 7 = slow. 12 = paralysis.

**Miller's Law**: Working memory holds 7 +/- 2 chunks. Schedule grid with 7 columns = at the limit. More dimensions push past it.

**Fitts's Law**: Time to target = distance / size. Larger buttons closer to cursor/thumb = faster.

**Jakob's Law**: Users expect your interface to work like ones they already know. Convention over invention for core patterns.

## Typography

- **Minimum body text**: 16px desktop, 18px mobile (NNGroup)
- **Typographic scale**: Use 6-8 sizes from a mathematical ratio, not ad-hoc
- **Line height**: 1.4-1.6x font size for body
- **Line length**: 50-75 characters (66 ideal). Mobile: 30-50.
- **Font weights in dark mode**: Use 500-600 for body (vs 400 in light mode)
- **I-L-1 test**: Typeface must distinguish I, L, 1 for data tables

## Spacing

- **8pt grid**: All dimensions in multiples of 8 (8, 16, 24, 32, 40, 48...). Material Design standard.
- **4pt grid**: For fine control (icons, small text blocks)
- Internal padding <= external margin (elements breathe outward)
- Consistent gaps between same-level groups (Gestalt proximity)
- 64px between sections communicates "new topic" better than any divider line

## Touch Targets

- WCAG 2.2 AA: 24x24px minimum
- Apple HIG: 44x44 points
- Material Design: 48x48 dp
- Spacing between targets: 12-48px for clear separation
- 60% of users operate phones one-handed

## Forms

- **Labels**: Top-aligned > floating > side-aligned. Top is fastest completion, best accessibility.
- **Placeholders**: Never as sole label. They disappear on focus.
- **Input width**: Should hint at expected length
- **One primary button per view.** Secondary = outlined or ghost.
- **Error messages**: Explain what went wrong AND how to fix it.
- **Single-column forms**: 15.4 seconds faster than multi-column.

## Loading & Feedback

- **Skeleton screens**: 20-30% faster perceived load than spinners. Show layout shape with shimmer.
- **Animation duration**: 200-500ms. Task interfaces: 200-300ms.
- **Easing**: ease-in-out standard. Spring physics (stiffness, damping) feels more natural than duration-based.
- **prefers-reduced-motion**: Respect it. Reduce != eliminate. Keep essential feedback.
- **Toast notifications**: Auto-dismiss ~7s. Success=green, Error=red, Warning=yellow, Info=blue.

## Data-Ink Ratio (Tufte)

Every pixel of ink should represent data. Borders, decorations, chrome that don't carry information should be minimized or eliminated. The best interfaces are the ones that remove the most while losing nothing.

## Progressive Disclosure

Show only what's needed now. Reveal complexity on demand. The shift from "feature-complete dashboard" to "calm interface that deepens" is the dominant direction.

## Accessibility Beyond Compliance

- Focus trap in modals (Tab cycles within modal only)
- aria-live regions for dynamic content updates
- Skip-to-content link for keyboard users
- Color + secondary indicator (icon, text, pattern) for all status communication
- Focus rings: 2px+ solid outline, offset from element, on :focus-visible
- Native HTML elements before ARIA. role="dialog" + aria-modal on all modals.
