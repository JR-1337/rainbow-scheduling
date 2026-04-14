# Handoff - RAINBOW Scheduling App

Session 60. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S60 wrapped a heavy round across both repos. RAINBOW app: shipped the swap/offer numeric-id fix, mobile employee polish, contacts filter, Mine-tab cleanup, and loading reassurance overlay. RAINBOW-PITCH: rebuilt slide 3 with a 3-card photo system + click-to-zoom lightbox + per-photo numbered annotations, and overhauled global typography for 10ft / 50" TV viewing distance. JR ended on "great. i think were done." No demo date in scope (memory deliberately erased per S60 — JR doesn't want the timeline constraining decisions). Open with: "Both repos shipped at S60. What's the priority — eyes-on verification of the live app/deck, post-demo backlog, or something new?"

## State

- Build (RAINBOW app): PASS, HEAD `687d03f`. Auto-deployed to https://rainbow-scheduling.vercel.app
- Build (RAINBOW-PITCH): PASS, HEAD `1a6d4e5`. Live at https://rainbow-pitch.vercel.app (no git remote — local commits, deploy via `vercel --prod --yes`)
- Branch: main (both repos)
- Apps Script: v2.20.1 — STILL UNVERIFIED (carried from S58)

## This Session

**RAINBOW app:**
- `716f8a5` UX trio: persistent rainbow-spinner overlay during data load + password-modal "saving…" hint + admin schedule cell now uses "Unavailable" text label (drops S59 hatching) + swap/offer cutoff "tomorrow noon" → "tomorrow midnight"
- `eb61532` Mobile employee polish: `(You)` row highlight on schedule grid (3px purple bar + cyan badge + faint cell tint), `N/A` → `Unavailable` mobile, employee-facing contacts filtered to Sarvi only (admin views unaffected)
- `d528399` Mine tab: hide all hours, show per-week shift count instead of period total
- `8fbe285` **Bug fix:** numeric employee IDs (Sheets returns `id` as Number) broke strict `!==` in swap/offer key parsing; coerce both sides with `String()`. Alex Kim (id=101) saw "no shifts to swap" despite future shifts existing
- `687d03f` Docs sync (lessons + decisions)

**RAINBOW-PITCH (`1a6d4e5`):**
- Slide 3 fully rebuilt: 3 independent cards (hero schedule + 2 phone shots), each with accent top border, click-to-zoom Lightbox modal, 4 numbered annotations per photo. Desktop: hero has flank annotations, phone cards have annotations beside photo centered as flex unit. Mobile: per-card "i" toggle reveals inline numbered list (the two phone toggles paired so opening one expands both)
- New screenshots: `slide3-grid.png` (1166×503, includes nav + announcement per JR), `slide3-mobile.png` (My Schedule), `slide3-request.png` (request modal). Old screenshots deleted from `public/assets/`
- Global typography overhaul for 10ft / 50" TV viewing: clamp ladder applied across `index.css` globals AND every inline `fontSize` in every slide. Hierarchy locked: display 96 > subhead 26 > card title 22-24 > card body 19-20 > label 17 > footer 17. `.slide-content` 1180 → `min(1500, 94vw)`. Side padding cap 80 → 56
- Accent top/left borders applied to ALL slide cards earlier in session (matches Slide 4 pattern)
- Backups preserved: `src/slides/Today.s60-stable-backup.jsx` + `.backup-s60-typography/` (Cost/Cover/Alternatives/Phase2/Proposal/index.css)

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | Yes | Current slide 3 implementation. Lightbox + Annotation + MobilePhotoCard helpers all here. Single file, no extraction yet |
| 2 | `~/APPS/RAINBOW-PITCH/src/index.css` | Yes | Global typography clamps + slide-content max-width. Source of truth for the new TV-distance baseline |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/{Cost,Alternatives,Phase2,Proposal}.jsx` | Yes | Inline fontSize swept to clamp; verify each scales sanely if JR opens them on the TV |
| 4 | `src/modals/SwapShiftModal.jsx` + `src/modals/OfferShiftModal.jsx` | Yes | String() coercion at line 72 / 67 — sweep similar split-key comparisons elsewhere if they show up |
| 5 | `src/MobileEmployeeView.jsx` | Yes | `(You)` row highlight, paired phone-card "i" pattern in MobilePhotoCard if reused |
| 6 | `backend/Code.gs` (local) vs Apps Script deploy | No | v2.20.1 STILL unverified. Pre-demo verification carried from S58 |

## Anti-Patterns (Don't Retry)

- **Strict `!==` between a Number id and a string-parsed key half** (since S60) — coerce with `String()` at the boundary. Sheets returns numeric employee IDs as JS Numbers; key splits return strings. Already in lessons.md
- **Bumping global typography without sweeping inline `fontSize` overrides** (since S60) — hierarchy collapses (e.g., card title visually equals page subhead). When changing typography for a new viewing distance, ALL inline sizes get the clamp treatment in the same pass. Already in lessons.md
- **Iterating on slide 3 photo layout without a fresh visual brief** (graduated S58 → still binding) — current state is JR-approved with click-to-zoom lightbox covering any "too small" concern. Don't tweak photo arrangement without explicit ask
- **Pre-demo countdown framing** (since S60) — JR explicitly asked memory of the demo date be erased ("forget about the timeline. it constrains your decisions"). Don't reintroduce demo-day urgency in greetings or planning unless JR brings it up first

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Apps Script v2.20.1 live-deploy verification | JR paste → Apps Script → Deploy → verify | Carried from S58. Not currently time-critical (no demo date) |
| Phase 2 builds (payroll bridge, meetings/PK, consecutive-days warning) | Sarvi discovery | Post-demo per todo.md |

## Key Context

- **RAINBOW-PITCH has no git remote** — local commits, deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`. Don't try to push that repo
- **Slide 3 backup files** in `~/APPS/RAINBOW-PITCH/src/slides/`: `Today.s60-stable-backup.jsx` (current good state, last revertible), `Today.v3-backup.jsx` and `Today.v5-backup.jsx` (S58 deprecated layouts)
- **Typography backup** at `~/APPS/RAINBOW-PITCH/.backup-s60-typography/` — full pre-S60 state of each slide + index.css. Restore by `cp -r` if hierarchy needs rolling back
- **Lightbox component** lives inline in `Today.jsx` as `Lightbox({photo, onClose})` — reusable if other slides ever need click-to-zoom on screenshots
- **JR's design-research source** at `~/APPS/Creative-Partner/research/` and `skill/principles.md` — load before any pitch-deck visual work. Slide 3 photo system was built against rules from L0-04, L0-09, L1-06, L1-07, principles.md, checklists.md
- **Annotation copy on slide 3** is in `PHOTOS` array at top of `Today.jsx` — each photo has its own `annotations: [{n, label, sub}]` array. Edit there to change what each numbered call-out says
- **Cached user storage** in localStorage uses key `otr-auth-user` (NOT `cachedUser`). `localStorage.getItem('otr-auth-user')` then `JSON.parse` to inspect the logged-in user object. Useful for diagnostics like the swap-shift bug

## Verify On Start

- [ ] `git log --oneline -5` in RAINBOW app shows `687d03f` at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` shows `1a6d4e5` at HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app/?slide=3 → desktop shows hero with 4 flank annotations + 2 phone cards with annotations beside photos centered as units; click any photo opens lightbox
- [ ] Hard-refresh same URL on mobile viewport → 3 cards stacked, each has "i" toggle; tapping either phone card's "i" expands both phone cards' annotation lists
- [ ] Hard-refresh https://rainbow-scheduling.vercel.app, log in as Alex Kim → Mine tab shows "N shifts" per week, no hours; mobile schedule grid highlights Alex's row with purple bar + (You) badge
- [ ] In Alex Kim session, open Swap Shift or Take My Shift → future shifts visible (no longer "no shifts available")
- [ ] Read `docs/lessons.md` entries 68-70 (this session's additions) before any swap/offer or pitch-typography work
