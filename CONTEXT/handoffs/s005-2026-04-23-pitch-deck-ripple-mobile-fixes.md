# s005 -- 2026-04-23 -- pitch deck: Ripple slide + mobile fixes

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/LESSONS.md`, then resume from `State` and `Next Step Prompt` below. First reply: 2 short sentences, a `Pass-forward:` line, and exactly 1 question about how to proceed.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP` (Scheduling App) + sibling `/home/johnrichmond007/APPS/RAINBOW-PITCH` (pitch deck)
- Scheduling App git: clean, HEAD `5bc1844` (logo nav), on main, pushed to origin/main
- RAINBOW-PITCH git: clean, HEAD `1cc90c0` (S65 safety net fix + mobile photos), no GitHub remote -- deploy via `vercel deploy --prod`
- Active focus this session: RAINBOW-PITCH only; Scheduling App untouched
- Pitch meeting: 2026-04-14 already happened (Carman family). No hard next-meeting date established.

## This Session

All work on RAINBOW-PITCH sibling project. Six sessions of changes (S61-S65) shipped and deployed.

**S61 -- Deck copy overhaul**
- Cover: problem-first thesis ("Sarvi spends 14 hours a week building a schedule. / Rainbow gives that time back.")
- Alternatives: subhead -> "Sarvi didn't adapt to it. It adapted to her."
- Proposal: 3-year arithmetic strip added ($91,356 status quo | $19,892 Rainbow | $71,464 difference)
- Price: 74% green box moved to top; "Not a subscription." removed from H1; footer expanded
- Spec: "Not a subscription." removed from H1

**S62 -- Mobile layout fixes**
- `index.css`: `padding-bottom: 88px` on `.slide` to clear fixed nav bar
- `Deck.jsx`: scroll-to-top `useEffect` keyed on slide index
- `Today.jsx`: lightbox image `maxWidth: 92vw` / `maxHeight: 88vh` (removed container padding)
- `Today.jsx`: 5 annotation copy rewrites (Go Live, Their own schedule, Same branding, Times/roles/tasks, Time off)
- `Alternatives.jsx` + `Proposal.jsx`: reformatted run-on bottom cards into `<ul>` lists (word-jumble fix)

**S63 -- Proposal headline**
- "Three months to change your mind." -> "Three months. Then decide." (accent color on "decide")

**S64 -- New Ripple slide (slide 3: Who Carries the Cost)**
- `src/slides/Ripple.jsx` created; inserted at `SLIDES[2]` in Deck.jsx
- 4 unnamed-but-recognizable cards: "The GM's week" / "Tuesday morning" / "A busy Saturday" / "The staff"
- Stats: 79% hourly workers say schedule affects retention (UChicago/HBR 2026 framing)
- Price footer expanded (payroll reconciliation paragraph added)
- TITLES updated: ['Cover', 'Cost of today', 'Who carries it', 'What Rainbow does', 'Why alternatives fail', 'Proposal']

**S65 -- Safety net overlap fix + Today mobile photo layout**
- `Cost.jsx` safety net body: removed Amy/payroll-reconciliation phrasing (now owned by Ripple "Tuesday morning")
- `Today.jsx` mobile section: switched from `grid grid-cols-2` to `flex flex-col` full-width stack
- `Today.jsx` MobilePhotoCard: added `imgStyle` prop; PHOTOS[0] gets `minHeight: 180px / objectFit: cover / objectPosition: top left`

**Lessons / corrections this session:**
- "Follow approved plan verbatim" -- Affirmations incremented to 2 (ready to graduate); JR was explicit multiple times ("WRITE THE CHANGES TO A PLAN", "if you had made a fkn plan...")
- New lesson added: Opus 4.7 plans, Sonnet 4.6 executes (explicit JR preference stated 2026-04-23)
- EnterPlanMode tool exists and must be used -- writing markdown plan text in chat is not sufficient

**Validation:**
- `npm run build` PASS at each S61-S65 commit
- `vercel deploy --prod` executed at 1cc90c0 -- confirmed deployed
- Mobile phone verification by JR: NOT YET CONFIRMED for S65 changes (landscape banner + full-width portrait cards)

**Decanting: clean** -- no working assumptions, near-misses, or naive-next-moves beyond what's in LESSONS.md and TODO.md

**Audit: skipped (no adapter or pre-Step-2 CONTEXT writes)**

## Hot Files

- `~/APPS/RAINBOW-PITCH/src/slides/Ripple.jsx` -- new slide, may need copy tweaks after JR phone-tests
- `~/APPS/RAINBOW-PITCH/src/slides/Today.jsx` -- mobile photo layout changed in S65; verify on phone
- `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` -- safety net card rewritten
- `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` -- 3-year strip + Phase 2 list
- `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` -- 74% box at top, footer expanded
- `CONTEXT/LESSONS.md` -- "Follow approved plan verbatim" at Affirmations 2 (graduate to root adapter)

## Anti-Patterns (Don't Retry)

- Do NOT write plans in chat text when EnterPlanMode is available -- JR corrected this twice this session
- Do NOT name Amy, Joel, Scott, or Sarvi directly in Ripple card bodies -- speak to the role/situation, not the person
- Do NOT predict savings beyond arithmetic on Sarvi-confirmed current-state cost
- Do NOT use "three months to change your mind" framing -- too aggressive/conditional per JR
- Do NOT iterate a rejected UI approach 3+ times -- propose a workflow change instead (lesson already logged)

## Blocked

- RAINBOW-PITCH has no GitHub remote -- deploy only via `vercel deploy --prod`
- Scheduling App email overhaul -- waiting on JR to create dedicated Gmail sender (rainbow-scheduling@gmail.com or similar)
- S62 2-tab settings split -- waiting on JR green-light
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on
- Consecutive-days 6+ warning -- waiting on Sarvi answers
- Payroll aggregator path 1 -- waiting on Sarvi discovery

## Key Context

- `CONTEXT/TODO.md` -- Scheduling App active work (Sarvi-batch smoke, Phase A+B+C save-failure, Bug 4/5)
- `CONTEXT/DECISIONS.md` -- durable decisions including pricing lock at $497/mo + 3-mo trial + $2K handover
- `CONTEXT/LESSONS.md` -- pitch lessons in "Pitch work" section; "Follow approved plan verbatim" at graduation threshold
- Memory: `project_pricing_locked.md` -- $497/mo pricing confirmed
- Memory: `project_carman_family_profile.md` -- Dan/Amy/Joel/Scott decision dynamics
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

1. Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/LESSONS.md`
2. Check `~/APPS/RAINBOW-PITCH` git: `git log --oneline -3` -- HEAD should be `1cc90c0`
3. If JR reports mobile issues: open `Today.jsx` mobile block (lines ~316-334) and verify `flex flex-col` + imgStyle on PHOTOS[0]
4. "Follow approved plan verbatim" at Affirmations 2 -- propose graduation to root adapter CLAUDE.md at start of next non-trivial plan session

## Next Step Prompt

S65 changes deployed but not yet phone-verified by JR. Immediate ask: has JR tested `rainbow-pitch.vercel.app` on mobile since S65 deployed? Specifically: (a) Today slide -- does the desktop screenshot render as a legible banner (not a thin strip)? (b) Are the two portrait phone screenshots full-width and readable? (c) Does tapping any photo open the lightbox correctly?

If verified clean: no pending RAINBOW-PITCH work unless JR identifies new copy or layout issues. Next natural task is Scheduling App: Sarvi-batch smoke (10 items, see TODO.md active list).

Pass-forward: RAINBOW-PITCH S65 deployed and unverified on JR's phone -- landscape banner crop + full-width portrait cards are the risk.
