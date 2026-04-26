<!-- SCHEMA: TODO.md
Version: 1
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

- **JR to add Bash permission rule for `vercel deploy --prod` on RAINBOW-PITCH.** Without this, every prod deploy requires JR running the CLI manually. Path: `~/APPS/RAINBOW-PITCH/.claude/settings.local.json`. Add to `permissions.allow` an entry like `"Bash(vercel deploy:*)"`. One-time setup; after that I can ship deploys directly when JR approves the work. Captured 2026-04-26.
- **RAINBOW-PITCH side-by-side tone-style sample (1 page).** JR explicit ask 2026-04-26: pick one slide, render two versions side-by-side -- current copy vs system-prompt-style lawyer-with-charm copy. Show both before applying tone style across the whole deck. Path: `~/APPS/RAINBOW-PITCH/src/slides/`. Top of next session.
- **RAINBOW-PITCH update Price.jsx to current understanding.** Spec.jsx aligned this session (Supabase ca-central post-fitting, $497 open retainer, PIPEDA posture, 12-mo continuity contract option, 35-seat data model, SOP/KB Phase 2 entry). Price.jsx still needs a parallel pass: $1,500 + $497/mo from month 1, 35 staff, no rounding language, no Amy reference, Supabase mention if appropriate. JR also dislikes the Price.jsx layout itself but is deferring the redesign until after the tone-style sample review.
- **Wire up chatbot query capture (Apps Script -> Google Sheet).** Append each `/api/ask-rainbow` POST as a row (timestamp, truncated IP, question, answer length, latency, provider). ~15 lines added to `api/ask-rainbow.js` + ~10 lines Apps Script. Fire-and-forget sink. Deferred until tone-style sample done per JR 2026-04-26.
- **Verify Price/Tech spec CTAs on Proposal bottom.** JR flagged both as missing 2026-04-26 mid-session; my Playwright walk earlier in s024 showed both rendering correctly on prod desktop. Possible mobile-only or device-specific rendering bug. Re-check on iPad / actual device before declaring closed.
- Apply tone-style across deck slides -- blocked on side-by-side sample review (top item).
- Desktop name column (240px, splitNameForSchedule) on Vercel -- next: JR prod-smoke grid alignment, long/short names, hover full name
- JR to manually delete `TEST-ADMIN1-SMOKE` employee from Employees tab -- Playwright smoke test data left on prod when smoke hung at cleanup step
- Future-proofing audit -- research doc shipped 2026-04-26 at `docs/research/scaling-migration-options-2026-04-26.md`. Decision-axes captured (CF Worker SWR / Supabase ca-central-1 / Neon / D1 / self-hosted). Apps Script 7-8s floor identified as the highest-impact lever, not DB choice. Next: JR picks motivation OR ships CF Worker cache (already in Blocked) to defer the cliff
- Perf + professional-app audit -- (a) wave 1 shipped 2026-04-25: ScheduleCell memo at parent callsite (`feb094b`) + PDF lazy-load (`3cf6b09`); wave 2 shipped 2026-04-25: ColumnHeaderCell extract + scheduledByDate lookup (`1d0ccb1`); audit doc at `docs/perf-audit-app-jsx-2026-04-25.md`; next: prod phone-smoke wave 1+2; (b) evaluate database + hosting upgrades beyond Sheets+AppsScript for professional security posture if OTR decides to buy the app
- JR to delete `Employees_backup_20260424_1343` tab from Sheet once satisfied with widen result -- optional cleanup
- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Phase A+B+C save-failure smoke -- next: JR Wi-Fi-off test save/delete failure paths on phone; edit-modal must stay on "Edit" (not "Add"), state must revert on failure (post-commit 7a13cab LIVE)
- Adversarial audit Phase E -- pause or pick concrete motivation. Cuts 1-15 shipped; App.jsx 3044 -> 2526 (-518, -17%). Sub-area 6 (Context provider) still parked.
- Bug 4 (PK default 10am-10am for some people) -- next: JR repro steps needed. Sheet inspection 2026-04-24 found zero PK rows with 10-10 times.
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Email + distribution overhaul -- next: JR creates dedicated Gmail to replace personal account as sender
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked
- [PARKED, do not surface] Staff-cell action menu -- raised 2026-04-18, explore later, do not ask

## Blocked

- RAINBOW-PITCH GitHub -> Vercel auto-deploy not firing -- since 2026-04-26. Manual `vercel deploy --prod --yes` required after each push. Permanent fix: reconnect GitHub integration on Vercel rainbow-pitch project. Workaround captured in DECISIONS 2026-04-26.
- iPad print preview side-by-side -- JR compares prior PDF export vs new at HEAD `1d26daf` to confirm ~20-27px logo-to-table gap reduction -- since 2026-04-26
- JR to delete 22 stale PK on Sat May 9 left from prior smoke -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke; require live mutation -- since 2026-04-25
- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Amy ADP rounding rule discovery -- waiting on Sarvi-asks-Amy. Pre-requisite for Phase 2 Counterpoint replacement bridge but JR has now removed all rounding language from pitch artifacts -- not blocking pitch demo. Since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: RAINBOW-PITCH prod deployed to HEAD `8eca952` 2026-04-26 (JR ran `vercel deploy --prod --yes` at end of s024). Bundle 291.11 kB / gzip 90.88 kB. Full prod smoke at HEAD `8eca952` still pending.
- Last validated: RAINBOW-PITCH AskRainbow live API on prod returned HTTP 200 with provider=anthropic, no preamble, multi-evidence answer (Homebase question pulled FACT #4 + #3 + #1 + #6). Probe 2026-04-26 against bundle `index-B_LQwVzi.js` (pre `851c793`/`8eca952`).
- Last validated: AskRainbow desktop + mobile UI Playwright smoke PASS 2026-04-26. Quick-question buttons stack 1-col mobile / 2x2 grid sm+, full-width 56px min-height, button text centered. Em-dash count across deck = 0.
- Last validated: Today.jsx Paper trail card desktop + mobile Playwright smoke PASS 2026-04-26 at `8eca952`. Grid pivots 4-up -> 3-up; 5th card spans 2 cols at md+; mobile stacks 5 cards single-column.
- Last validated: Deck.jsx nav buttons 52x52 + pill backdrop + nowrap counter Playwright smoke PASS mobile 390x844 2026-04-26. Touch swipe disabled (no longer hijacks horizontal scroll inside parity grid + cumulative cost chart).
- Missing validation: RAINBOW-PITCH prod smoke at HEAD `8eca952` (after re-deploy) -- ESA grep, console capture, full slide walk, AskRainbow rate-limit, AskRainbow Phase 2 leak NOT recurring (was the bug fix in `09648f6`).
- Missing validation: Spec.jsx new sections (Recurring fee scope / Compliance posture / Continuity / Roadmap) not visually smoked at full print size (only Read-time review). JR may want to print preview.
- Missing validation: prod phone-smoke of N meetings per day + multi-event eventOnly render (`089adaa` + `651712d`) -- pending JR phone-test
- Missing validation: prod smoke of sick-mark end-to-end / Floor Supervisor role / sick-flow polish / opaque day-header / part-time Clear / unified warning / logo-as-home-button -- all pending JR phone-smoke
- Missing validation: favicon prod confirmation; FT Auto-Fill cell-click prefill prod smoke; cuts 8/10/13 live admin-action paths; Sarvi iPad white-screen retest
- Missing validation: PDF UTF-8 charset + em-dash sweep + iOS `.blob` download fix not retested on Sarvi's iPad
- Last validated: Apps Script v2.25.0 LIVE; schedule-change notifications fire for non-Sarvi/non-JR admin edits
- Missing validation: no automated test suite; manual Playwright smoke only
- Partial validation: PDF logo gap `1d26daf` -- structural fix verified live; ~20-27px iPad-render delta still needs JR side-by-side eyeball
- Last validated: PKDetailsPanel + bulk-clear PK + PKEventModal + PDF Export + cell density + ColumnHeaderCell -- s023 prod Playwright PASS 2026-04-26. See archived s023 handoff for details.

## Completed

- [2026-04-26] **RAINBOW-PITCH restructure original plan complete** -- 4 phase-commits shipped: `088c223` pricing rewrite ($1,500 + $497/mo, 3-yr strip $91,356 / $19,392 / $71,964, cumulative-cost SVG), `c8f2bd7` ESA single-mention + Cornell ILR turnover + Gap stable-scheduling stat + 6-row feature parity grid, `1fd951a` Phase2 narrative restructure, `54597ea` AskRainbow chatbot slide + serverless function. Phase E memory + DECISIONS edits committed in this s024 handoff. Spawned by Sonnet 4.6 executor against `~/.claude/plans/rainbow-pitch-restructure-2026-04-26.md`. Bundle delta: +11.87 KB raw / +2.89 KB gzip. ESA grep returns exactly 1 (Today Safety net body, as planned).
- [2026-04-26] **AskRainbow chatbot v4 shipped + iterated heavily** -- 14 follow-up commits across this session driving from Haiku 4.5 default to Sonnet 4.6 + extended thinking. New FACTS #9 OPERATIONAL BAND, #10 COMPLIANCE+DATA, #11 CONTINUITY GUARANTEE, #8 PAPER TRAIL. New WHAT FITTING ACTUALLY MEANS block (12 bullets, broadened scope from fee-only to engagement-wide). New WHAT THE APP DOES NOT DO TODAY block (Phase 2 leak fix). 14-hour defense paragraph. JR-original TONE block restored verbatim at bottom. NO PREAMBLE rule. 35-staff canonical. Promo / SOP-KB Phase 2 entries added. Live on prod with provider=anthropic; user-confirmed "works great" after mobile UI overhaul.
- [2026-04-26] **Spec.jsx aligned to current truth** -- §3 Data model -> Supabase Postgres ca-central post-fitting (Sarvi direct-edit preserved via admin-grid OR mirrored-Sheets export per fitting choice). §9 Recurring fee scope -> $497/mo open retainer details. §10 Compliance posture (PIPEDA-defensible, SOC 2 Type II, 5+ yr retention configurable). §11 Performance ≤500ms post-Supabase (was 7-8s). §12 NEW Continuity + lock-in (escrow + 12-mo contract + multi-location not 1:1). §13 Roadmap governance updated for SOP/KB entry.
- [2026-04-26] **Deck UX hardening** -- Deck.jsx swipe disabled (was hijacking horizontal scroll inside parity grid + cost chart) + nav buttons 52x52 + pill backdrop + nowrap counter. Today.jsx mobile lightbox removed (popup modal didn't render well on phones; photo now displays inline). Today.jsx Paper trail card added as 5th feature (grid 4-up -> 3-up + 5th spans 2 cols). Today.jsx wrong "Same colors as the wall" annotation fixed -> "Color-coded by role". Ripple.jsx first card replaced ("THE INVISIBLE BILL") + footer rewritten lawyer-with-charm voice.
- [2026-04-26] **Em-dash sweep + 35-staff canonical + global cleanups** -- 60 em-dashes across 10 files replaced with hyphens. Staff count canonicalized to 35 (was 24 in bot, 34 in spec + Alternatives slide). Phase2.jsx rounding language removed (per JR). AskRainbow mobile UI rewritten (uniform 56px buttons, full-width on mobile, centered Ask button text, 12px radius unified). Proposal.jsx 5-point grid 5th card spans 2 cols (no empty hole). 19 commits total this session on RAINBOW-PITCH main.

<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
