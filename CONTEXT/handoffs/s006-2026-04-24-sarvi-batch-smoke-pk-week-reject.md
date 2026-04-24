# s006 -- 2026-04-24 -- Sarvi-batch prod smoke + PK-week rejection

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md`, then resume from `State` and `Next Step Prompt` below. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: clean, HEAD `f4e83c5` pushed to origin/main
- Branch: main, no divergence
- Sibling `~/APPS/RAINBOW-PITCH` untouched this session (last at `1cc90c0`, S65)
- Active focus: Scheduling App verification work wrapped; next natural pulls are email overhaul (awaiting JR sender Gmail) or Bug 4/5 repro (awaiting JR steps)

## This Session

Single activity: ran Sarvi-batch end-to-end Playwright smoke on prod via Sonnet 4.6 sub-agent (per 2026-04-23 "Opus plans, Sonnet executes" lesson). Results committed as `f4e83c5`.

**Smoke results (prod https://rainbow-scheduling.vercel.app)**
- 8 PASS: items 1 (autofill toast), 2 (PK Sat 10:00/10:45 + non-Sat 18:00/20:00), 5 (defaultSection round-trip), 6 (PDF B&W with role glyphs + legend C1/C2/B/M/W/F), 7 (Former Staff hidden from grid + badge bump), 8 (Hidden collapsible collapsed-by-default + count badge), 9 (Dan/Scott/Amy all render only in Hidden section), 10 (Reactivate button full-opacity tonal green, not the blue the plan text claimed)
- 3 SKIP per plan: items 3/4/11. Item 3 turned out to be a never-shipped feature (see below). Item 11 is sibling pitch project.
- 0 FAIL, 0 console errors
- State clean: Owen Bradbury (smoke target) reactivated, defaultSection reverted to No Role

**Key finding: "Autofill PK Week" was a ghost decision**
- 2026-04-18 DECISIONS entry claimed the "Autofill Wk N" outline button shipped next to "Schedule PK".
- Source grep confirmed no such button exists (App.jsx only has single-day "Schedule PK" modal at 2139). Smoke sub-agent independently confirmed absence.
- JR direction 2026-04-24: "remove... it's not even a feature. PK's are for specific days."
- Fix: rewrote the 2026-04-18 DECISIONS entry as REJECTED with Confidence: H (verified 2026-04-24 via grep + smoke); removed "PK-week" mention from the parked Staff-cell-action-menu TODO bullet.

**Writes to canonical memory**
- `CONTEXT/TODO.md`: sub-agent wrote the Sarvi-batch Last-validated line + narrowed the Backup Cash Missing-validation line. I removed "PK-week controls" from the parked Staff-cell-action-menu bullet.
- `CONTEXT/DECISIONS.md`: 2026-04-18 "Autofill PK Week" entry rewritten as Rejected with 2026-04-24 evidence.
- No ARCHITECTURE or LESSONS writes this session.

**Validation of the writes**
- `git diff` reviewed before commit; diff scope matched intent (2 files, +7/-9).
- No build run; no code changes.

**Decanting: mostly clean**
- Working assumption that collapsed: "every item in the Sarvi-batch plan's Verification section reflects shipped code." Item 3 broke that. Lesson candidate: verify plan-verification items against source before treating a feature as smoke-testable. Captured in Anti-Patterns below rather than LESSONS because it is not yet an affirmed pattern.
- Near-misses: none.
- Naive next move: the plan at `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md` still lists Item 3 as shippable. A next session reading only that plan may try to implement it. Flagged below.

**Audit: clean**
- Session wrote CONTEXT/* before Step 2, so the audit ran. No adapter changes. CONTEXT files stayed within their ownership (TODO kept task state, DECISIONS kept durable direction + rationale, no cross-contamination). No style warnings on the new content. No relocations needed.

## Hot Files

- `CONTEXT/DECISIONS.md` -- 2026-04-18 "Autofill PK Week" now Rejected; do not resurrect
- `CONTEXT/TODO.md` -- Sarvi-batch shows 8/8 Last validated 2026-04-24; parked Staff-cell-action-menu no longer mentions PK
- `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md` -- historical plan; its Item 3 is stale, do not re-execute
- `.playwright-mcp/sarvi-batch-*.png` -- smoke evidence screenshots (desktop-only set)

## Anti-Patterns (Don't Retry)

- Do NOT re-execute "Autofill PK Week" from the Sarvi-batch plan. PKs are day-specific (Sat pre-open, other days post-close); a 7-day sweep would seed wrong-day events. REJECTED decision on 2026-04-24.
- Do NOT treat a DECISION's "Confidence: H - shipped" line as proof the feature exists. 2026-04-18 Autofill-PK-Week decision claimed shipped but source had no button. Grep source before assuming verification scope.
- Do NOT smoke the Sarvi-batch at mobile 390px without separate screenshots. Sub-agent ran desktop 1280 only; mobile is still unvalidated for items 7/8 (Hidden section had per-row Edit added 2026-04-23 for mobile).

## Blocked

- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Bug 4 (PK 10am-10am) + Bug 5 (top-nav PK not in UI) -- waiting on JR repro steps
- Backup Cash live-shift end-to-end smoke -- no employee currently assigned backupCashier; awaits Sarvi real use

## Key Context

- `CONTEXT/TODO.md` Verification section is the canonical smoke ledger
- `CONTEXT/DECISIONS.md` pricing lock at $497/mo + 3-mo trial + $2K handover (2026-04 decisions sequence)
- `CONTEXT/LESSONS.md` "Follow approved plan verbatim" at Affirmations 2 -- still flagged for graduation to root adapter at next non-trivial plan session
- `CONTEXT/LESSONS.md` "Opus 4.7 plans, Sonnet 4.6 executes" -- applied this session (sub-agent smoke); pattern held
- Memory: `reference_smoke_logins.md` has `johnrichmond007@gmail.com/admin1` + `testguy@testing.com/test007`; use these, do not guess emp-XXX
- Memory: `project_pricing_locked.md`, `project_carman_family_profile.md`
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

1. Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/LESSONS.md`
2. Check git: `git log --oneline -3` -- HEAD should be `f4e83c5` or later, clean on origin/main
3. If JR asks about PK-week autofill, point to the 2026-04-18 Rejected DECISION; do not re-plan it
4. "Follow approved plan verbatim" at Affirmations 2 -- propose graduation to root adapter CLAUDE.md at start of next non-trivial plan session

## Next Step Prompt

Shipped-but-unverified from this session: mobile 390px smoke of Hidden section (desktop PASS only; mobile per-row Edit button from 2026-04-23 still unvalidated at 390px) and Backup Cash live-shift end-to-end (defaultSection picker + PDF legend B confirmed; no live shift currently assigned). Both are small.

External gates dominate the rest: JR dedicated sender Gmail (email overhaul), JR repro for Bug 4/5, Sarvi discovery for payroll aggregator, JR green-light for CF Worker + S62 settings split.

Default next move: ask JR which gate he wants to clear first (sender Gmail creation is the lowest-friction unlock) or run the two small mobile/Backup Cash smokes if he wants more verification checked off before opening new work.

Pass-forward: Sarvi-batch 8/8 PASS on prod desktop; PK-week feature rejected as never-real; no code work pending, next moves gated on JR inputs.
