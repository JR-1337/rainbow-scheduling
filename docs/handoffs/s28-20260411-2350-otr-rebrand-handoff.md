# Handoff - RAINBOW Scheduling

Session 28. `CLAUDE.md` auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting
JR is reviewing the OTR rebrand visually in the morning. Expect feedback on colors, shadows, or layout. Tuesday demo (2026-04-14) with store owner + ops manager is the deadline. Ask what he thinks of the live site and what needs adjusting.

## State
- Build: PASS (pushed to Vercel `45df2e4`)
- Tests: NONE
- Branch: main
- Last commit: `45df2e4` S28 handoff: tracking files + OTR rebrand handoff
- Live: https://rainbow-scheduling.vercel.app

## This Session
- Full audit (frontend + backend + mobile) identified 13 bug/polish items across 3 tiers
- All audit fixes applied: saveLivePeriods error handling, JSON.parse safety, null checks in approval flows, sendEmail return value, 30+ console.logs removed, mobile UX improvements, React key fixes, Go Live confirmation
- Complete OTR rebrand: dark navy background, rotating 5-color accent system, OTR role colors, accent borders/glow shadows, rainbow sphere loader, luminance-aware button text
- Iterated through 3 design approaches: (1) light mode with terracotta → didn't feel like Rainbow, (2) light bg with gradient blobs → cards looked pasted on, (3) dark navy bg with white cards → final approach

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes | THEME object (lines 12-48), all UI. JR may want color/shadow tweaks |
| 2 | `src/index.css` | Yes | Rainbow sphere + spinner animations, login form colors |
| 3 | `src/MobileEmployeeView.jsx` | Yes | Accent text, drawer width, touch targets |
| 4 | `src/MobileAdminView.jsx` | Yes | Same as above |
| 5 | `backend/Code.gs` | Yes | 4 bug fixes - needs manual deploy to Apps Script |

## Anti-Patterns (Don't Retry)
- **Light mode with OTR terracotta accent** (since S28) - JR rejected: "doesn't say Rainbow to me." The website colors are too muted. Actual brand identity is the 5 bold rainbow colors from bags/tags.
- **Gradient background blobs on schedule page** (since S28) - Didn't work: cards looked pasted on, gradient competed with content. Solid dark navy is the answer.
- **Transparent accent-tinted card backgrounds** (since S28) - `THEME.accent.blue + '10'` on dark bg = invisible. Cards must be solid `THEME.bg.secondary` with accent borders/stripes instead.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs deploy | JR manual action | Edit Code.gs in Apps Script → Deploy → Manage → Edit active |
| Email upgrade | JR providing sender email | PDF auto-attached via MailApp |

## Key Context
- `THEME.bg.primary` = dark navy `#0D0E22`. NEVER use for inner UI elements (inputs, tab bars, cell backgrounds inside white cards). Use `THEME.bg.tertiary` instead. Already fixed ~10 misuses this session.
- `THEME.accent.blue` = rotating accent (not actually blue). Set from `OTR_ACCENT.primary` at module load. `accent.text` = luminance-computed text color for buttons on that accent.
- Accent cycling: localStorage key `otr-accent`, increments 0-4 on each app load. Red→Blue→Orange→Green→Purple.
- OTR brand colors from JR: `#FDFEFC` white, `#0D0E22` navy, `#EC3228` red, `#0453A3` blue, `#F57F20` orange, `#00A84D` green, `#932378` purple.
- Tuesday 2026-04-14 demo: Sarvi presenting to store owner + ops manager. App must be polished. JR gets paid if they adopt it.
- `Photos/` directory still untracked (not committed).

## Verify On Start
- [ ] Build passes
- [ ] Live site loads at https://rainbow-scheduling.vercel.app
- [ ] Accent color visible (try refreshing 2-3 times to see rotation)
- [ ] `docs/todo.md` reflects current state
