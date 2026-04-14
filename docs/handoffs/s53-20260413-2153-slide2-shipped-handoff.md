# Handoff - RAINBOW Scheduling App

Session 53. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` for S53 entries (three new), `docs/lessons.md` for S53 additions (six new deck-copy lessons).

## Session Greeting

S53 was the first of the per-slide-review chats. Slide 1 reviewed (card copy locked per JR, footer added). Slide 2 fully rewritten and shipped to live. Accent-word-per-header shipped on all five slides. Per JR's locked protocol, next session opens Slide 3. Greet with: "Opening Slide 3 (Today) for per-slide review — what's the first thing you want to interrogate?"

## State

- Build (RAINBOW app): PASS, HEAD unchanged since S52 (`dd1b511`)
- Build (RAINBOW-PITCH): PASS, last deploy `1972bbb` (local-only; no git remote)
- Branch: main (both repos)
- Pitch live: https://rainbow-pitch.vercel.app — Slides 1, 2, 3, 4, 5 all carry an accent-colored word in the header now
- Apps Script: v2.20.1, unchanged

## This Session

- Slide 1 (Cover): card copy locked ("perfect, leave alone"). Added italic footer below thesis: "Rainbow Scheduling app: built to order by the one who does the work. Sarvi knows best." Added accent span on "OTR" in thesis line.
- Slide 2 (Cost): full rewrite. Sub-headline → "A year of a GM's attention, rendered in dollars." Card 1 label "The envelope" → "The hidden hours" (body unchanged per JR). Card 2 relabeled "Guardrails", headline "Compliance built into the schedule.", body names 44hr OT + 8hr rest + consecutive-days as product capability; $170K single-fine ceiling DROPPED per JR. Card 3 renamed "The back-and-forth" / "Every request, routed — not relayed." — body pivots from "476 decisions" math to the communication load (texts/calls/group chats to Sarvi) and Rainbow's structured-form + validation + logged-decision answer. Italic footer: "What it takes, today, just to open on time."
- Accent-word-per-header pattern rolled out across all five slides: Slide 1 "OTR", Slide 2 $25,480 (pre-existing), Slide 3 "Custom-built", Slide 4 "fit", Slide 5 "Walk".

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` | Yes (accent only) | S54 target. Known issue: body still says "11-hour daily rest rule" — Ontario ESA is 8 hours, must be corrected. |
| 2 | `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` | Yes (accent only) | ADP + SaaS columns also cite 11-hr rest — same correction needed when that slide comes up. |
| 3 | `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` | Yes (full rewrite) | Reference for the voice/pattern future slides should match. |
| 4 | `~/APPS/RAINBOW-PITCH/src/slides/Cover.jsx` | Yes (footer + accent) | Locked — don't edit card copy. |
| 5 | `pitchdeck/build-plan.md` | No | Authoritative deck plan. RE-READ before any slide change. |

## Anti-Patterns (Don't Retry)

- **Proposing copy for a slide then never shipping it** (S53) — JR explicitly asked for the accent-word-per-header pattern, I proposed 5 words, he moved on, and I didn't ship until he noticed it was missing. Ship the moment JR directs "choose" — do not wait for a second sign-off.
- **Editing slide card copy without grepping the whole file for stale references** (S53) — graduated to `docs/lessons.md`. Rename "envelope" in card label, leave "schedule envelope" in sub-headline, ship, JR finds it on live.
- **Building without deploying when JR expects ship** (S53) — graduated. `npm run build` ≠ live; always chain `vercel --prod --yes` after any slide-level copy change.
- **Fabricated statutory claims on the deck** (S53) — graduated. Current deck (Slides 3 and 4) still cites "11-hour daily rest rule" which is not Ontario ESA (correct figure is 8 hrs). Must be corrected in S54+.
- **Arbitrary derived numbers as persuasion ("476 decisions")** (S53) — graduated.
- **Overclaiming app verbs ("enforced" when the app only flags)** (S53) — graduated.
- **Unverifiable deck copy ("already live on store screens", "figure Rainbow gives back")** (S53) — graduated. No-prediction rule extends to all deck copy, not just headlines.
- **Speculating about backend cause when frontend is producing the visible error** (S52) — in `docs/lessons.md`.
- **Single-site fix when a parser is shared across paths** (S52) — in `docs/lessons.md`.
- **Rainbow-gradient-on-type for "Rainbow" wordmark** (S51) — in `docs/lessons.md`.
- **Fabricating stats** (S51) — in `docs/lessons.md`.
- **Single-point-of-failure framing for Sarvi** (S51) — in `docs/lessons.md`.
- **Shallow / generic feature labels** (S51) — in `docs/lessons.md`.
- **Iterating on deck copy without re-reading the plan** (S51) — in `docs/lessons.md`.
- **Family-relationship assumptions in OTR copy** (S51) — in `docs/lessons.md`. Amy=sister(payroll), Joel=brother(co-owner), Scott=ops, Sarvi=NOT family.
- **Headed Playwright video recording on Chromebook** (S50) — in `docs/lessons.md`.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 build | Sarvi discovery | Receipt-box → ADP bridge, etc. Post-demo. |
| Schedule data re-seed | JR call | Needed if JR wants varied auto-fill patterns in cover screenshots. Deferred per JR S51. |

## Key Context

- **Demo was today (2026-04-14).** Outcome not yet recorded in this session — assume demo either happened or is imminent when S54 opens. Confirm with JR on greeting.
- **JR's per-slide review protocol is strict:** one slide per chat, fresh context per slide, footers + accent-words are now part of the pattern.
- **Verify EVERY statutory claim against ontario.ca before shipping.** Sources that worked this session:
  - [ontario.ca hours-of-work](https://www.ontario.ca/document/your-guide-employment-standards-act-0/hours-work) — 8hr rest between shifts (not 11), 48hr weekly max, 24/48hr weekly rest rule
  - [ontario.ca overtime-pay](https://www.ontario.ca/document/your-guide-employment-standards-act-0/overtime-pay) — 44hr/wk threshold at 1.5×
  - O. Reg. 189/24 multiplier only applies to 3rd+ contravention in 3yr (not single incident)
- **The 44hr OT is FLAGGED in the live app, not ENFORCED.** [App.jsx:70,89](src/App.jsx#L70-L89): `AnimatedNumber` shows amber text + glow at value ≥ overtimeThreshold. No publish gate. Use "flags" / "surfaces" in copy, not "enforces".
- **Slide 2 copy framed ESA suite as product capability (not today's live feature set).** Per JR: 44hr OT is live today; 8hr rest + consecutive-days-off ship during the fitting trial. This is a commitment, honest when stated as "the suite Rainbow watches" rather than "what's in prod this minute."
- **Pitch repo has NO git remote.** Commits are local-only. Deploy via `vercel --prod --yes` from `~/APPS/RAINBOW-PITCH/`.
- **Playwright MCP permissions:** `mcp__playwright__*` wildcard already in `.claude/settings.json` allow list.

## Verify On Start

- [ ] `git log --oneline -3` in RAINBOW app confirms HEAD is a new S53-handoff commit (will be latest after S53 push)
- [ ] `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` confirms `1972bbb` HEAD
- [ ] Hard-refresh https://rainbow-pitch.vercel.app — verify Slide 1 thesis has "OTR" in accent color, Slide 2 shows all three new cards + "A year of a GM's attention..." sub-headline + "What it takes, today..." footer, Slides 3/4/5 each have their accent word
- [ ] Read three new S53 entries at top of `docs/decisions.md`
- [ ] Read S53 additions (six new entries) at end of `docs/lessons.md`
- [ ] Before editing Slide 3 copy: grep `Today.jsx` + `Alternatives.jsx` for "11-hour" and note the correction scope
- [ ] Confirm with JR on greeting: how did the demo go, and is Slide 3 still the next target?
