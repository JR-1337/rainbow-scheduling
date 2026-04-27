# s025 -- 2026-04-26 -- Pitch deck voice pass shipped + smoked on prod

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: pitch deck voice pass complete + prod-smoked PASS; next is Price.jsx + Spec.jsx review (JR parked both for the other side of /handoff).

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `3e49ed1` (drift-cleanup commit -- DECISIONS.md L102 + LESSONS.md L291/L340 sweep of 35/14/$30,452 numbers). Up to date with origin. Working tree dirty: only the 2 long-untracked cursor rules JR confirmed leave-alone in s022. After this s025 handoff commit, working tree returns to those 2 untracked files.
- Sibling repo `~/APPS/RAINBOW-PITCH/`: HEAD `2c7cfb7` deployed to prod 2026-04-26 by JR (`vercel deploy --prod --yes`). Bundle `index-B-0MzfeS.js` confirmed on prod via Playwright. 7 commits this session: `f1fbcd1` (Ripple Card 2 + chatbot FACT #12 + Phase2 Counterpoint), `a059458` (Today Card 2 + kitchen door), `98c40ae` (Alternatives all 4 vendors), `342cf4c` (Proposal subhead + cards), `6eb0a06` (Phase2 voice + footer), `2a2f628` (Cost Card 1/3/4 + Tuesday-payroll fix), `2c7cfb7` (Cover thesis role-reversal). Working tree clean.
- Active focus: pitch-artifact polish for Carman family demo. Deck slides done; price + spec sheets are next.

## This Session

**Two threads:** RAINBOW-PITCH deck voice pass + on-the-side OTR-fact / drift cleanup.

**Thread 1 -- Deck voice pass complete on all 7 prose-heavy slides.** JR drove voice picks per card (mostly Voice A straight or Voice B lawyer; mixed within slides). Order in which slides were tackled this session:

1. **Ripple.jsx** (`f1fbcd1`) -- Card 2 reframed to "The cost of forgetting" (Counterpoint + paper sheet + Sarvi reconstruction). Card 3 lawyer voice. Cards 1 + 4 unchanged. Same commit added FACT #12 (THE TIMEKEEPING CATCH-SYSTEM) to chatbot system prompt and rewrote Phase2.jsx Counterpoint replacement direction with the new framing.

2. **Today.jsx** (`a059458`) -- Card 2 lawyer voice ("The mistake gets caught while the schedule is still a draft"). Card 4 factual fix: "whiteboard" + "breakroom wall" -> "kitchen door" (JR direct correction; printed schedule at OTR posts on the kitchen door). ESA single-mention preserved in Card 2 body.

3. **Alternatives.jsx** (`98c40ae`) -- All 4 vendor cards rewritten with research-sourced ammo. Two parallel general-purpose research subagents returned facts-only (no recommendations) per the global subagent-delegation rule. New angles: ADP Essential Time mobile-add-on requirement + 1-3yr contract with auto-renew; TimeForge App Store reviews showing one-shift-only mobile + manager-message-crash bug; Deputy Australian-headquartered + AU/UK/US data hosting only (PIPEDA cross-border-transfer disclosure burden on customer); Agendrix add-on pricing stack + buggy mobile reviews. Voice mix: ADP + TimeForge lawyer, Deputy + Agendrix straight. Removed prior "Onboarding is a signed contract" claim about TimeForge (vendor explicitly says no contract required -- was a fabrication risk).

4. **Proposal.jsx** (`342cf4c`) -- Subhead removed banned "earns your trust" SaaS-hero phrase ("Rainbow proves the fit by adapting to OTR's actual operation, not the other way around"). Cards 1, 2 lawyer; Card 3 lawyer + drops "John" personal-name reference per new naming rule; Cards 4, 5 straight voice.

5. **Phase2.jsx** (`6eb0a06`) -- Direction 3 lawyer voice. Direction 5 lawyer voice + drops "John" reference ("authored alongside OTR and maintained by Rainbow"). Direction 4 unchanged. Italic footer removed banned "earns the trust" -> "The current app proves the fit. Phase 2 is what that fit makes possible." (echoes Proposal subhead).

6. **Cost.jsx** (`2a2f628`) -- Card 1 minor tighten (comma-separated enumeration). Card 3 lawyer voice. Card 4 factual fix: removed "or land in payroll on Tuesday" (same wrong framing fixed in Ripple Card 2 earlier; JR clarification: payroll runs Monday by accounting + Amy reviews/submits Tuesday on already-clean numbers).

7. **Cover.jsx** (`2c7cfb7`) -- Thesis line role-reversal: "Sarvi spends 14 hours a week building a schedule" -> "OTR's schedule takes 14 hours of Sarvi's week. Every week." Two fixes in one rewrite: broadens from grid-writing to full envelope (LESSONS rule), and reframes the schedule as the consuming agent (lawyer-voice). "Every week." beat echoes Cost Card 1.

AskRainbow.jsx not voice-rewritten; existing copy was already lawyer-shaped + functional UX text.

**Thread 2 -- Prod smoke + drift cleanup.**

- **Playwright smoke PASS** at `2c7cfb7`: desktop walk (1280x900) + Cover/Today mobile (390x844). 8-slide content checks all PASS, console 0 errors, deck-body John refs = 0, banned phrases = 0, deck-total ESA mentions = 1 (Today only). AskRainbow live round-trip on payroll question pulled FACT #12 cleanly: Counterpoint + paper sheet + Sarvi reconstruction + Monday close + Amy Tuesday review + Phase 2 distinction. No preamble; lawyer voice landed. (One screenshot anomaly: first Cover-mobile screenshot showed rainbow color blocks cropping the viewport. DOM check confirmed clean render; second screenshot was correct. Concluded: screenshot-tool render-race, not a real bug.)
- **Drift cleanup** (`3e49ed1`) -- swept stale OTR pitch numbers across CONTEXT + auto-memory: 24/16/$29,120 (S47) -> 34/14/$25,480 (S48) -> 35/14/$30,452 (s024). Fixed:
  - DECISIONS.md L102 ($25,480 -> $30,452, $91,356-3yr added)
  - LESSONS.md L291 ("Echo user-stated facts" lesson now records all three corrections)
  - LESSONS.md L340 ("No fabricated stats" lesson updated 34 -> 35 staff + $30,452/yr anchor)
  - Auto-memory: project_otr_facts.md fully rewritten; feedback_cost_of_doing_nothing.md $29,120 -> $30,452; MEMORY.md index updated

**Memory updates:**
- DECISIONS.md: no new entries this session.
- LESSONS.md:
  - "Pitch-facing copy uses lawyer-with-charm voice" Affirmations: 0 -> 1 (affirmed across all 7 deck slides). Banned phrases list also gained "earns your trust" / "earns the trust" since JR caught two cases this session.
  - NEW [PROJECT]: "Don't name JR personally in pitch DECK slides; spec/price body + footer + chatbot exempt" (Affirmations: 0).
- Auto-memory NEW this session: project_otr_timekeeping.md (Counterpoint + paper sheet + Sarvi reconstruction + payroll cadence); project_otr_schedule_posting.md (kitchen door); feedback_no_personal_naming_in_deck.md (naming-rule scope). Auto-memory updated: project_otr_facts.md (rewritten); feedback_cost_of_doing_nothing.md; MEMORY.md (4 new index lines + 1 description update).

**Decanting:**
- Working assumptions:
  - Lawyer-with-charm voice is now the canonical register across all 8 deck slides. Future deck copy edits default to this voice unless JR overrides per-element.
  - OTR timekeeping reality is locked: Counterpoint = system of record (works fine), paper sheet at cash = human-error backstop (staff forget to punch), Sarvi reconstructs gaps. NOT "Counterpoint is unreliable." Phase 2 wedge is in-app phone punch + formatted payroll report.
  - OTR printed schedule physically posts on the kitchen door. Staff photograph it on the way out.
  - 35 staff / 14 hr/wk / $30,452 yr / $91,356 3yr is canonical across deck + chatbot + spec + price + CONTEXT/* + auto-memory.
  - Naming rule: deck slides use "Rainbow" or "the developer," never "John." Spec/price body + footer attributions + chatbot prompt exempt.
- Near-misses:
  - I drafted "Two systems for one number / redundancy = system fails" for Ripple Card 2 before JR corrected: "counterpoint is enough. the problem is human error." Don't reframe Counterpoint as unreliable.
  - I missed the "earns the trust" SaaS-hero footer on Phase2 in the first pass; JR caught it on second look at the same file.
  - One mobile screenshot showed rainbow color blocks cropping the Cover viewport. DOM check confirmed it was a screenshot tool render-race artifact, not a real bug. Don't auto-roll-back on screenshot anomalies; verify DOM first.
- Naive next move:
  - Auto-applying lawyer voice + naming-rule sweep to Spec.jsx + Price.jsx without surfacing them. JR explicitly parked both for next session ("we'll work on that on the other side of /handoff"). Do NOT pre-emptively rewrite either; show options + let JR drive picks per element as he did across the deck.

**Audit (Step 3) ran** (CONTEXT/* writes happened pre-Step-2: drift-cleanup edits to DECISIONS L102 + LESSONS L291/L340 mid-session before sync).
- DECISIONS.md still at 161 lines (over 150 ceiling). Top 5 newest dated 2026-04-26 (protected). Movable entries also 2026-04-26. Same defer rationale as s024 -- carrying overage organically until decisions age.
- LESSONS.md at 575 lines (was 567 in s024; +8 lines for new entry + affirmation update). Schema does not define Archive behavior; defer until LESSONS schema gains an archive section.
- TODO.md at ~99 lines. Fine.
- ARCHITECTURE.md untouched.
- Style soft-warns: pre-existing MD041/MD022/MD032/MD033 patterns flagged by IDE diagnostics on edited files. None introduced this session.

Audit result: clean (over-ceiling on DECISIONS + LESSONS deferred per s024 carry-over reasoning; pre-existing style soft-warns).

## Hot Files

- `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` -- TOP next-session target. JR parked for review. Voice + factual sweep needed; should mirror the deck's lawyer-with-charm register and use 35 staff + $1,500 setup + $497/mo open retainer + 12-mo continuity option + Supabase ca-central. JR also dislikes the layout itself -- voice review first, layout work second.
- `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` -- second next-session target. Already aligned to current truth in s024 (Supabase ca-central, $497 open retainer, PIPEDA, 5+yr retention, Continuity §12, Roadmap §13). Voice pass + light sweep. Naming-rule exemption: keep "John" in body continuity paragraph + footer attribution.
- `~/APPS/RAINBOW-PITCH/api/ask-rainbow.js` -- system prompt v4 plus FACT #12 (TIMEKEEPING CATCH-SYSTEM). Read before iterating bot facts further.
- `~/APPS/RAINBOW-PITCH/src/slides/*.jsx` -- all 8 slides voice-rewritten this session. All on prod at HEAD `2c7cfb7`.
- `~/APPS/RAINBOW-PITCH/src/Deck.jsx` -- swipe disabled; nav buttons 52x52 with pill backdrop; keyboard nav ignores INPUT/TEXTAREA/SELECT focus.
- `CONTEXT/LESSONS.md` -- two updated/new entries this session: lawyer-with-charm Affirmations now 1 (graduate at 2); naming-rule new [PROJECT] entry.
- Auto-memory: project_otr_timekeeping.md, project_otr_schedule_posting.md, feedback_no_personal_naming_in_deck.md (all new), project_otr_facts.md (rewritten), MEMORY.md (index updated).

## Anti-Patterns (Don't Retry)

- Do NOT pre-emptively rewrite Spec.jsx or Price.jsx in lawyer voice before surfacing options to JR. He parked both for next session and wants to drive voice picks per element, as he did across the deck this session.
- Do NOT frame Counterpoint as unreliable or broken in any pitch artifact. Counterpoint is the system of record and works -- the failure mode is purely human (staff forget to punch). The paper sheet exists to catch that. Phase 2 wedge is in-app phone-based punch + properly formatted payroll report.
- Do NOT name "John" personally in any pitch DECK slide (`src/slides/*.jsx`). Use "Rainbow" or "the developer." Scoped exemptions: Spec.jsx body continuity paragraph + Spec/Price footer attributions + chatbot system prompt.
- Do NOT use "earns your trust" / "earns the trust" / "we've got you covered" / "let's prove it together" / similar SaaS-hero phrases anywhere in pitch artifacts. Banned per LESSONS.
- Do NOT write "whiteboard," "breakroom wall," or "bulletin board" when describing where OTR posts the printed schedule. It's the kitchen door. Generic "digital whiteboard" as a competitor-app metaphor is fine.
- Do NOT cite "Onboarding is a signed contract" or any contract-lock-in claim against TimeForge. Vendor explicitly states no contract required. Lead with implementation/customization fee stacking + dated mobile + algorithmic-forecasting-replaces-judgment.
- Do NOT touch the Spec.jsx body continuity paragraph or the Spec/Price footer attributions when applying the deck-naming sweep. JR confirmed those exempt.
- Do NOT auto-roll-back on a single screenshot anomaly. Verify DOM via `evaluate` before reshooting or reverting code.
- Do NOT spawn 3+ parallel research subagents on similar prompts (memory says they hit org token limits last session). Two parallel was the working ceiling this session.
- Do NOT trust an `Agent(...)` rejection as proof a subagent stopped (carried lesson, still active).

## Blocked

- RAINBOW-PITCH GitHub -> Vercel auto-deploy not firing -- since 2026-04-26 (s024). Manual `vercel deploy --prod --yes` after every push. Permanent fix: reconnect GitHub integration on Vercel rainbow-pitch project. Workaround: JR runs the CLI; for me to run it requires a Bash permission rule in `~/APPS/RAINBOW-PITCH/.claude/settings.local.json` (`"Bash(vercel deploy:*)"`).
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- still waiting on Sarvi-asks-Amy. Lower priority since JR removed all rounding language from pitch artifacts; not blocking demo. Since 2026-04-26.

## Key Context

- This session was 100% RAINBOW-PITCH (sibling repo) work + a small CONTEXT/* + auto-memory drift sweep on the main repo. The scheduling-app code did not change.
- Pitch deck production-deployed at HEAD `2c7cfb7`. Prod URL: https://rainbow-pitch.vercel.app/. Chatbot URL: same domain `/api/ask-rainbow`. Bundle hash on prod: `index-B-0MzfeS.js`.
- ANTHROPIC_API_KEY is live in Vercel rainbow-pitch project (Production scope). Bot uses Claude Sonnet 4.6 with extended thinking budget 2048. Gemini fallback dormant.
- Family tree (canonical): Joel (owner+father), Amy (his daughter, payroll review/submit Tuesday), Dan (his son, helps run), Scott (ops manager). Sarvi is GM (NOT family).
- OTR canonical numbers: 35 staff, 14 hr/wk Sarvi schedule envelope, $30,452/yr cost-of-doing-nothing, $91,356 3-yr, ~$42/hr implied GM rate (not surfaced in pitch).
- OTR timekeeping: Counterpoint = clock-in/out system of record; paper sheet at cash = human-error backstop; Sarvi reconstructs gaps when both forgotten; payroll runs Monday by accounting; Amy reviews + submits Tuesday on clean numbers Sarvi prepared before Monday.
- OTR schedule posting: prints to kitchen door. Staff photograph it on the way out.
- Naming rule: "John" only in Spec.jsx body continuity + Spec/Price footer + chatbot prompt. Everywhere else in deck slides -> "Rainbow" or "the developer."
- Pitch demo with Carman family is the gating event for many parked items (S62 / consecutive-days / aggregator path 1 / mobile admin context provider). Date is not yet set.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top 3 Active items: JR vercel-deploy permission rule (carried), Price.jsx voice + factual review (next-session top), Spec.jsx voice review (next-session second).
2. Read `CONTEXT/DECISIONS.md` -- still 161 lines (deferred); top 4 entries unchanged from s024 (chatbot v4 + Supabase Phase 1 + $497 open retainer + Pricing $1,500).
3. Read `CONTEXT/LESSONS.md` if pitch-copy framing is in scope -- two updates this session: lawyer-with-charm Affirmations 0 -> 1 (graduate at 2); new [PROJECT] naming rule.
4. Auto-memory references: project_otr_timekeeping, project_otr_schedule_posting, feedback_no_personal_naming_in_deck (all new this session); project_otr_facts (rewritten).
5. Check git on this repo: `git log --oneline -3` should show `3e49ed1`, `bab406c`, `e33707f`. After s025 handoff commit lands, top of log will be the s025 commit.
6. Check git on sibling: `cd ~/APPS/RAINBOW-PITCH && git log --oneline -8` should show `2c7cfb7`, `2a2f628`, `6eb0a06`, `342cf4c`, `98c40ae`, `a059458`, `f1fbcd1`, `8eca952`. Working tree clean. Bundle on prod: `index-B-0MzfeS.js`.
7. If picking up Price.jsx voice work: read it first; mirror Spec.jsx §9-12 structure (open retainer scope, PIPEDA posture, continuity, roadmap); 35 staff; lawyer-with-charm voice register; preserve "John Richmond" only in footer attribution. JR also dislikes the layout -- voice first, layout second.
8. If picking up Spec.jsx voice work: read it first; lawyer voice + minor sweeps; preserve "John" in body continuity paragraph + footer attribution per scope.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: prod is at HEAD `2c7cfb7` with full Playwright smoke PASS this session (deck walk + AskRainbow round-trip + console clean + ESA grep + mobile pass). All deck work verified.
- (b) External gates: JR-action top-of-list -- adding the Bash permission rule for `vercel deploy:*`. Other carried gates from prior sessions still pending.
- (c) Top active TODO after JR's permission action: **RAINBOW-PITCH Price.jsx + Spec.jsx voice + factual review.** JR parked both explicitly for "the other side of /handoff."

Most natural next move: ask JR which to tackle first. Suggest Price.jsx first since it is the more out-of-date artifact (voice + numbers + layout dissatisfaction); voice work will surface layout decisions for the Spec pass that follows. Drive voice picks per element as JR did across the deck this session.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
