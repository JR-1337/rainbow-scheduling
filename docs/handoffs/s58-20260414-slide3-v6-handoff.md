# Handoff - RAINBOW Scheduling App

Session 58. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S58 landed Slide 3 **content** (subheader rewrite, Card 2 zero-ESA rewrite, Card 4 full rewrite, raised cards, italic footer, 4 fresh screenshots) AND fixed /price + /spec mobile formatting. But Slide 3 **photo layout** went through 6 iterations (v1-v6), all rejected by JR ("terrible", "don't fit the frames", "you're throwing pics in a frame"). JR's plan for next session: take his own screenshots + consult a design-theory content partner + return with concrete direction. Until then, do NOT iterate further on the current Slide 3 photos.

Demo is **tomorrow 2026-04-15 13:00**. Apps Script v2.20.1 live-deploy STILL unverified - must verify before demo.

Greet with: "Slide 3 content is locked, layout awaits your fresh screenshots + design brief. Want to start there, or verify Apps Script v2.20.1 first?"

## State

- Build (RAINBOW app): PASS, HEAD `ac1efcd` (no RAINBOW app commits this session)
- Build (RAINBOW-PITCH): PASS, v6 live. **RAINBOW-PITCH has uncommitted work** - see "Blocked" for commit status.
- Branch: main (both repos)
- Pitch live: <https://rainbow-pitch.vercel.app> - Slide 3 shows v6 (browser-chrome hero + triptych)
- Apps Script: v2.20.1 - **STILL UNVERIFIED**, must verify before demo
- Demo: **2026-04-15 13:00**

## This Session

- **Slide 3 content fully rewritten** (content side is locked per JR):
  - Subheader: "Your floor positions, special tasks, announcements, meetings and product knowledge training."
  - Card 2: ZERO ESA mentions now ("Catches problems before you publish" - amber/red overtime + double-booking flag wording, no statutory numbers, no "Ontario"). Two rewrites this session - JR said "STOP WITH THE ESA i dont want it in this card at all."
  - Card 4 FULLY REWRITTEN: was "ESA-aware hour totals \u2192 ADP" (rejected - hours live in Counterpoint, app can't do that claim). New: "Published to every phone. Printed for the wall." - PDF email to all staff + breakroom poster, replaces the phone-photo-of-whiteboard routine. No ADP claim, no hours claim.
  - Cards 1 + 3 unchanged per JR.
  - All 4 cards wrapped in raised `.card` tiles with labels (Auto-fill / Safety net / Self-serve / Distribution).
  - Italic footer added: "Built around Sarvi's process, not a template."
- **4 fresh screenshots captured** via Playwright MCP (logged in as Sarvi admin): admin grid (Week 16 auto-filled, cropped to action-center 1400\u00d7720), Add Employee dialog (pixel-detected to edge-to-edge white modal 574\u00d7546 via Python PIL luminance jump), Shift Changes request-type modal (384\u00d7334, same technique), mobile "My Schedule" tab (400\u00d7670).
- **Six Slide 3 layout iterations shipped, all rejected by JR.** v1 (tiles in dark cards, forced 4:3), v2 (matched-height flex row), v3 (tinted well asymmetric), v4 (items-end max-height), v5 (browser-chrome hero + row 2 modals, saved as backup), v6 (browser-chrome hero + triptych + mobile-phone-hero-led mobile layout, live now). See Anti-Patterns.
- **Deep research delegated** to a subagent on ad-agency software-screenshot embedding. Key rules applied across v3-v6: tinted gradient well kills sticker effect, single large soft shadow `0 30px 60px -20px rgba(0,0,0,0.55)`, border-radius matches OS (10px web, 28-32px mobile), `filter: saturate(0.92)`, matched baseline (items-end) with natural heights. Full output in conversation history; applied-in-code is the artifact.
- **/price + /spec mobile formatting fixed.** /price had `gridTemplateColumns: '180px 1fr'` that squeezed value text into a narrow right column on mobile \u2192 swapped to `grid-cols-1 md:grid-cols-[180px_1fr]`. Both routes had heavy inline `padding: '48px 56px'` eating mobile width \u2192 swapped to `px-6 py-8 md:px-14 md:py-12`. Verified at 390px viewport.
- **JR asked: add categories to price/spec sheets?** Recommendation: skip. Price at 9 rows scans fine flat, categories read as filler. Spec at 12 sections has §1-12 numbering + bold titles doing the scan work; natural groupings (Architecture/Workflow/Ops/Future) are boilerplate. JR agreed.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | Yes (v6 live) | Slide 3 current. Layout awaits JR's fresh screenshots + design brief. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Today.v5-backup.jsx` | Yes (backup) | v5 state - browser-chrome hero + modals-below layout. Revert target if JR prefers it to v6. |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Today.v3-backup.jsx` | Yes (backup) | v3 state - tinted well + flex asymmetric. Older revert target. |
| 4 | `backend/Code.gs` (local) vs Apps Script deploy | No | v2.20.1 **live-deploy STILL unverified.** MUST verify before demo 13:00. |
| 5 | `~/APPS/RAINBOW-PITCH/public/assets/slide3-{grid,employee,shiftchanges,mobile-new}.png` | Yes (fresh captures) | 4 new screenshots. Modal PNGs are pixel-detected edge-to-edge. Old `slide3-admin-mobile.png` / `slide3-admin-wide.png` / `slide3-requests.png` are orphaned but left in place. |
| 6 | `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` | Yes | Mobile-responsive grid + padding. |
| 7 | `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` | Yes | Mobile-responsive padding. |

## Anti-Patterns (Don't Retry)

- **Leaning on Ontario / ESA / compliance on Slide 3** (since S58) - Card 2 had 11hr fabrication + "enforced" overclaim + "3-hour minimum call-in" (not in app). JR: "STOP WITH THE ESA i dont want it in this card at all." Card 4 v1 ("ESA-aware hour totals") also rejected. Slide 3 now has ZERO ESA mentions. Don't backslide. Already in lessons.md (entry 64 for Alternatives, newly covered for Today).
- **Claiming app features that aren't built TODAY** (since S58) - Card 4 v1 said hours \u2192 ADP but hours live in Counterpoint. Every Slide 3 bullet MUST survive "does the app actually do this TODAY?" Phase 2 doesn't count. Same class as lessons 39, 46, 62.
- **Iterating on photo-framing layout past 3 rejected passes** (since S58) - burned six Slide 3 iterations without converging. JR called the approach itself: "do you even have a UI design skill?" Already graduated to `docs/lessons.md`. Don't tweak v6 further without fresh brief.
- **Browser-window chrome mockup at mobile viewport widths** (since S58) - chrome is a desktop signal. On phone, it miniaturizes and reads as visual noise. v6 fallback drops chrome for mobile; keep that.
- **Guessing ffmpeg crop offsets for modal bounds** (since S58) - use Python PIL luminance-jump detection: `lum > 190` count > N threshold, scan inward from each edge. One-shot accurate bounds. Already in lessons.md.
- **Matching photo HEIGHT instead of BASELINE in a row of varied-aspect photos** (since S58) - forced matched heights flatten variety. Use `items-end` with natural heights for editorial rhythm.
- **Responsive CSS encoded as inline `style={{ padding: '48px 56px' }}`** (since S58) - inline styles can't respond to breakpoints. Use Tailwind responsive classes (`px-6 md:px-14`) or `grid-cols-1 md:grid-cols-[...]`. /price + /spec hit this; check other routes before demo if time allows.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Slide 3 layout v7 | JR fresh screenshots + design brief | Don't iterate further without it. |
| Apps Script v2.20.1 live-deploy verification | JR paste \u2192 Apps Script \u2192 Deploy \u2192 verify | **MUST land before demo at 13:00.** |
| RAINBOW-PITCH commit | Handoff step - will commit as part of this handoff | Has uncommitted Today.jsx + backups + 4 new PNGs + Price.jsx + Spec.jsx. |
| Phase 2 build | Sarvi discovery | Post-demo. |
| Demo outcome capture | 2026-04-15 13:00 meeting | Log in decisions.md after demo. |

## Key Context

- **All 6 Slide 3 iterations preserved** so JR can A/B: v3 at `Today.v3-backup.jsx`, v5 at `Today.v5-backup.jsx`, v6 is live. v1/v2/v4 are in git history of RAINBOW-PITCH (no named backups).
- **Comparison screenshots** saved in the RAINBOW Scheduling APP root: `slide3-live-v3.png`, `slide3-live-v4.png`, `slide3-live-v5.png`, `slide3-live-v6.png`, `slide3-live-v6-mobile.png`. Not tracked in git (scratch artifacts).
- **RAINBOW-PITCH has no git remote** per S57 handoff - all commits local. Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **Current v6 desktop structure**: Row 1 = hero grid in macOS browser-chrome mockup (92% width centered), Row 2 = triptych (Employee modal | Mobile phone 360h center anchor | Shift Changes modal, matched baseline). Tinted gradient well wraps both rows. Feature cards below.
- **Current v6 mobile structure**: Mobile phone photo centered at top (70% width, readers ARE on phones), grid photo full-width no chrome, two modals paired 2-up, feature cards stacked. Deliberately different from desktop.
- **JR's morning critique** was first "looks like shit on mobile" (pre-modal-crops). After modal crops + v6 redesign, updated critique: "lol its all terrible. dont you have a ui design skill?" \u2192 plan is take fresh screenshots himself + consult content partner for design theory + return with direction.
- **JR contact:** John Richmond \u00b7 john@johnrichmond.ca.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app shows S58 handoff commit at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` shows S58 slide3 v6 + mobile fixes commit at HEAD
- [ ] Hard-refresh <https://rainbow-pitch.vercel.app/?slide=3> \u2192 Slide 3 shows subheader ending "product knowledge training", browser-chrome hero centered, triptych below (Add Employee | phone-bezeled mobile | Shift Changes), 4 raised feature cards (2x2), italic footer "not a template"
- [ ] Hard-refresh <https://rainbow-pitch.vercel.app/price> at mobile width \u2192 rows stack label-over-value, no narrow right column
- [ ] Hard-refresh <https://rainbow-pitch.vercel.app/spec> at mobile width \u2192 content has breathing padding but not suffocated
- [ ] Read `docs/lessons.md` entries 65-67 (this session's additions) before touching pitch photo layouts
- [ ] Confirm with JR: Slide 3 layout waiting for his screenshots + brief, or pivot to Apps Script verify?
