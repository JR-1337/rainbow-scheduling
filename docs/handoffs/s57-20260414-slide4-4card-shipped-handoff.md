# Handoff - RAINBOW Scheduling App

Session 57. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

S57 shipped the full Slide 4 restructure: 4 cards (ADP / TimeForge / Deputy / Agendrix) + horizontal sweep strip, with sub-headline rewritten to "Each one was built first and shopped to customers second. Rainbow App was built alongside Sarvi, to solve for her specific issues. And it looks great too." No closing line per JR. Slide 4 is locked. Pre-demo runway: rest of today + Wed morning. Demo tomorrow 13:00.

Greet with: "Slide 4 locked. Want to move to Slide 3 (11hr→8hr + whole-card review) or Apps Script v2.20.1 verify first?"

## State

- Build (RAINBOW app): PASS, HEAD `1c65437` (unchanged since S56 wrap)
- Build (RAINBOW-PITCH): PASS, local HEAD bumped this session (multiple Slide 4 deploys); no git remote
- Branch: main (both repos)
- Pitch live: https://rainbow-pitch.vercel.app — Slide 4 updated and verified live
- Apps Script: v2.20.1 — live status still unclear, re-verify before demo
- Demo: Wed 2026-04-15 13:00 (tomorrow)

## This Session

- **Slide 4 (Alternatives.jsx): full restructure.** 3-col → 4-card + horizontal sweep strip. Cards: ADP Essential Time / TimeForge / Deputy / Agendrix. Sweep strip categorises rest-of-market (punch clocks / hospitality / enterprise / digital-whiteboards-outgrown). Headline unchanged ("None of them fit OTR"); sub-headline rewritten three times before landing on JR's final copy: "Each one was built first and shopped to customers second. Rainbow App was built alongside Sarvi, to solve for her specific issues. And it looks great too." No closing footer per JR's final call.
- **Bullet scrub rounds:** (1) initial draft leaned on Ontario/ESA/compliance on TimeForge + Deputy — banned by JR twice (logged). (2) Agendrix card sold instead of knocked ("4.9★, bilingual, Ontario-aware") — scrubbed to template-based / Sarvi reshapes process / ticket-queue. (3) Role-system repetition across TimeForge + Deputy + Agendrix — kept on Agendrix only. (4) "US hours" on TimeForge — swapped to industrial/dated-interface angle. (5) "Canadian SMBs love" (Agendrix tag) → "Canadian small-business default" (neutral, no jargon after JR flagged SMB).
- **Em dashes swept to hyphens** across all Slide 4 prose + the bullet marker decoration.
- **Rainbow-wedges card DROPPED:** I initially added a 5th "What Rainbow does that none of them do" card at the bottom naming trial + training + concierge + bug fixes. JR rejected — wedges must be implicit in each competitor's bullet, not stated separately. Each card's bullet 3 now carries a different Rainbow contrast: ADP→concierge support ("no one person owns OTR's account"), TimeForge→Sarvi's judgment preserved ("replaces that judgment, doesn't build on it"), Deputy→adapts-to-Sarvi, Agendrix→direct-line-to-developer.
- **"Commissioned by OTR" framing REJECTED:** JR clarified Rainbow wasn't paid-commissioned. He built it with Sarvi to replace her pen-and-paper. Sub-headline now honours that origin.
- **Lessons.md: 3 new entries** (competitor-flaws-Rainbow-also-has, praise-in-detractor-bullets, compliance-as-fallback-crutch).
- **Decisions.md: 1 new entry** for the 4-card restructure.

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | No (still stale) | **Slide 3 review is the next pre-demo must-land.** Body cites "11-hour rest" — Ontario ESA is 8hr. JR wants whole-card review, not just the fix. |
| 2 | `backend/Code.gs` (local) vs Apps Script deploy | Unknown | v2.20.1 live-deploy verification pending before demo. |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | Yes | Reference for final 4-card structure; treat as locked unless Dan/Scott feedback during demo. |
| 4 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. Plan's original Slide 4 spec (3-col with Counterpoint/ADP/SaaS) is now superseded by the 4-card restructure — plan itself is stale on that slide but decisions.md S57 entry is the source of truth. |

## Anti-Patterns (Don't Retry)

- **Leaning on Ontario / ESA / compliance anywhere on Slide 4** (forbidden in S57) — JR had to tell me twice in one session, once with "STOP WITH THE ONTARIO RULES... I forbid you from bringing it up again." Check every new Slide 4 bullet or headline against this filter before shipping. Already logged in lessons.md.
- **Citing a competitor flaw Rainbow also has today** (since S57) — "Deputy has no NCR connector" / "Agendrix ADP sync is CSV-only" both fail the "does Rainbow beat this today?" test. Phase 2 doesn't count. Also logged.
- **Filling detractor bullets with praise** (since S57) — Agendrix "4.9★, bilingual support, Ontario-aware" on a KNOCK slide is a sell. Before shipping any competitor bullet: does it make the audience LESS likely to pick them, or MORE? If the latter, scrap it. Also logged.
- **Duplicating role-system / apparel-floor bullets across multiple cards** (since S57) — reserved for Agendrix only. Any other card citing "cashier/backup/mens/womens/monitor" in the same surface is repetitive. Not yet in lessons.md; graduate if it recurs.
- **Industry jargon in customer-facing copy** (since S57) — JR caught "SMB" and "WFM" in a single Slide 4 pass. Audience is a family retail business. No acronyms unless they're in Dan's vocabulary (NCR, ADP, PDF, ESA on other surfaces — Slide 4 has none).
- **Over-leading with ESA on every slide/doc** (since S54) — capped at one mention per surface, never headline. Slide 4 now has zero ESA mentions. Monitor drift on Slide 3 review.
- **Proposing copy and not shipping until a second sign-off** (since S53) — edit + build + deploy in one move when JR directs.
- **Mis-interpreting OTR domain terms** (since S55) — "promo" = commissions, not sale-period staffing.
- **Framing pricing claims that don't survive math** (since S56) — $125/hr is NOT "upper end" of $100-170 band.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Slide 3 body 11hr→8hr + whole-card review | JR wants whole card reviewed | MUST land before demo if Slide 3 stays. Ontario ESA = 8hr. |
| Apps Script v2.20.1 live-deploy verification | JR paste → Apps Script → Deploy | Re-verify before demo. |
| Phase 2 build | Sarvi discovery | Post-demo. |
| Demo outcome capture | 2026-04-15 13:00 meeting | Log in decisions.md after demo. |

## Key Context

- **S58 priority order:** (1) Slide 3 full-card review (11hr→8hr + whole card), (2) Apps Script verify, (3) any final Slide 4/5/2/1 passes Dan requests.
- **Slide 4 sub-headline is JR's copy verbatim** — do not re-edit "And it looks great too." That's his voice, he approved it. Same for the Agendrix tag "The Canadian small-business default" (neutral discovery-channel pattern matching the other three tags).
- **Slide 4 wedges are implicit-per-card, not a separate block.** If a future session thinks "we should list Rainbow's advantages on Slide 4," re-read the bullet-3 pattern first — each card already carries one wedge. Adding a separate block was explicitly rejected.
- **Research file on disk:** `pitchdeck/Retail Scheduling App Alternatives Analysis.md` (54K, untracked). Now used. Still uncommitted; leave as-is unless JR wants it in the repo.
- **RAINBOW-PITCH has no git remote.** All commits local-only. Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **Math I quoted JR this session on competitor pricing:** Deputy ~$6-8 CAD/user/mo × 34 = $210-270/mo. Agendrix $2.93-5.25/user × 34 = $100-180/mo. TimeForge custom-quoted, not public. Rainbow $497/mo is higher on sticker than all three. JR's reaction: "forget the price." Keep it off Slide 4 permanently.
- **JR contact:** John Richmond · john@johnrichmond.ca.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app shows S57 handoff commit at HEAD
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` shows S57 Slide 4 restructure commit at HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app/ → Slide 4 shows 4 equal cards in a row (ADP / TimeForge / Deputy / Agendrix), horizontal sweep strip below, sub-headline ending "...And it looks great too.", NO closing footer line
- [ ] Read `docs/lessons.md` entries 63-65 (this session's additions) before touching any pitch copy
- [ ] Confirm with JR: Slide 3 whole-card review is the S58 target, or has priority shifted?
