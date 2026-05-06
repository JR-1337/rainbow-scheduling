# s063 -- 2026-05-04 -- Pitch deck revision: argument inventory + executable plan written; ready for executor session

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

scumble. attractor dynamics.

Pass-forward: the pitch deck revision plan is written, granular, and ready for a Sonnet executor against a fork branch. Next session's job is execution + verification + fork surface, not more planning.

## State

- **Project:** primarily `~/APPS/RAINBOW-PITCH/` (deck source) with substance lookups in `~/APPS/RAINBOW Scheduling APP/CONTEXT/*` and auto-memory.
- **Git (RAINBOW Scheduling APP):** HEAD `dba4b78` on `main` pre-handoff. CONTEXT files dirty from this session: `TODO.md` + `DECISIONS.md` + this handoff file. Commit + push as part of session close per `feedback_handoff_auto_push.md`.
- **Git (RAINBOW-PITCH):** HEAD `fc48565` on `main`, working tree clean. No branch created yet -- that's the next session's first move per plan § 5.1.
- **Plan files written this session (live in `~/.claude/plans/`, not in this git repo):**
  - `rainbow-pitch-argument-inventory-2026-05-04.md` -- foundation analysis (~10KB). T1/T2/T3 argument tiers, escape-route-closure structure, research findings + flag-outs. Read for rationale; not strictly required for execution.
  - `rainbow-pitch-revision-2026-05-04.md` -- executable plan (~129KB / 2,061 lines). § 0 preamble + § 1 cross-cutting visual rules + § 2.1-2.10 per-slide changes (every edit specifies file path, "Old string", "New string", verification, commit message) + § 3 verification gates + § 4 commit plan + § 5 branch + executor handoff with the verbatim Sonnet briefing prompt.
- **Research subagent ID:** `aac87f5a3cc6b9df0`. Caught a parent-side strategic-premise error mid-task ("Rainbow is the cheapest at 35 employees" -- it isn't; Agendrix Essential is ~$2,176 CAD/yr vs Rainbow's $7,464). The plan was revised in-flight to argue fit not price, supported by competitor research as ammunition for the existing thesis.
- **Active focus end-of-session:** plan complete, awaiting executor session.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `scumble. attractor dynamics.`. Top item is the s063 pitch-deck revision (status: plan complete, ready for executor).
2. Read the executable plan: `~/.claude/plans/rainbow-pitch-revision-2026-05-04.md`. Foundation analysis at `~/.claude/plans/rainbow-pitch-argument-inventory-2026-05-04.md` is optional context.
3. `cd ~/APPS/RAINBOW-PITCH && git status` should be clean. `git log --oneline -1` should show `fc48565` (or whatever main has moved to since 2026-05-04).
4. `cd ~/APPS/RAINBOW Scheduling APP && git status -s` after this handoff commits should be clean.
5. If `~/APPS/RAINBOW-PITCH/main` has moved past `fc48565`: surface to JR. The plan's "current state excerpt" sections may need spot-verification before executor runs; most edits will still apply if the underlying lines are unchanged.

## Next Step Prompt

The plan is the artifact. Next session's job is execution. Per § 5 of the plan:

1. Confirm with JR: "ready to execute the plan?" If yes:
2. `cd ~/APPS/RAINBOW-PITCH && git checkout -b pitch-revision-2026-05-04` (off `main`).
3. Spawn a Sonnet 4.6 subagent (`coding-plan-executor` if available, else `general-purpose` with `model: sonnet`) using the briefing prompt verbatim from § 5.2 of the plan file. Run in background.
4. While the executor runs, do nothing else on this branch. Wait for completion notification.
5. After executor returns: review per § 5.3 of the plan -- confirm 10 commits, skim diff, open screenshots in `/tmp/pitch-revision-screenshots/`, spot-check 2-3 source files manually against the plan's "New string" specifications.
6. Surface the fork to JR with: commit list, screenshot folder location, any divergences flagged by the executor, command for JR to view diff (`git diff main..pitch-revision-2026-05-04`).
7. JR decides: adopt (merge to main + push), edit further, or revert.

Do NOT push the branch yourself. JR pushes after review.
Do NOT modify backend, API, or the chatbot system prompt. Out of scope.
Do NOT re-plan. The plan is locked. If a slide's source diverges from the plan's "Old string", surface and stop on that slide -- do not guess.

## Hot Files

(origin tags: sNNN = first appearance; (re-hot sNNN) = bumped this session)

- `~/.claude/plans/rainbow-pitch-revision-2026-05-04.md` -- the executable plan. Read before executor spawn. (origin: s063)
- `~/.claude/plans/rainbow-pitch-argument-inventory-2026-05-04.md` -- foundation analysis (optional context). (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Cost.jsx` -- biggest restructure on the deck (Mani Lead + turnover card + cross-cutting hover CSS lands here). (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Ripple.jsx` -- cost-of-forgetting Lead + 4 cards to 3 cards + stat corrections. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` -- largest single section in the plan; 5-point grid split + $2,991 cap + three-year strip rebuild + CostChart savings pill. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` -- per-card distinct-angle reassignment with research-derived facts. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Phase2.jsx` -- 5 directions to 4 mini-cards + close-on-trial-echo. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/slides/Cover.jsx` + `AskRainbow.jsx` + `Today.jsx` -- small/single-line edits per plan § 2.1, § 2.2, § 2.3. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/routes/Price.jsx` -- footer task-language + bolded $2,991 cap + Cost-of-doing-nothing label. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/routes/Spec.jsx` -- payroll-owner phrasing + Policy KB drop. (origin: s063)
- `~/APPS/RAINBOW-PITCH/src/index.css` -- cross-cutting card hover CSS lands inside the Cost.jsx commit (#4 in plan § 4.2). (origin: s063)
- `~/APPS/RAINBOW Scheduling APP/CONTEXT/DECISIONS.md` -- two new s063 entries at top: argue-fit-not-price + argument-tier framework. (re-hot s063)

## Anti-Patterns (Don't Retry)

- **Don't pivot a deck argument's spine without verifying the underlying premise first.** This session almost shipped a competitor-pricing comparison that would have lost the math (Rainbow is not cheapest at 35 employees). The research subagent's flag-out caught it. Future plan-writes that lean on a load-bearing factual claim must verify the claim before baking it in. (origin: s063)
- **Don't write handoffs that narrate process instead of orienting the next session.** This handoff deliberately omits This-Session prose, prune narration, decanting paragraphs, and Key Context overlap with `CONTEXT/*`. The next session needs forward-facing orientation; the audit trail lives in git, DECISIONS, and the plan files. (origin: s063, captured live during JR critique of s062 handoff bloat)
- Earlier rules carried from s062 + s061 + s060 + s058 + s059 -- still in force. See prior handoffs for the full list.

## Blocked

- **Sarvi using the app this week; her feedback may surface RAINBOW code-side TODOs.** External gate for the scheduling app, not for the pitch deck. Since 2026-05-04.
- **JR phone-smoke of long-press regression on multi-event mobile cells** -- still owed. Since 2026-05-04.
- **JR Test Admin manual cleanup (s061 carry)** -- still uncleaned at end of s062 unless done off-session. Not blocking.
- **JR paste of LESSONS-schema-fix prompt into context-system session (s061 carry)** -- self-contained prompt drafted s061; awaits JR's hand-off.
- **JR paste of HANDOFF-rewrite prompt into context-system session (s063 raised)** -- self-contained prompt drafted earlier this session, asking the kit to slim the handoff driver. Not blocking.
- **`~/APPS/RAINBOW-PITCH/main` HEAD movement check** -- if main moved past `fc48565` since 2026-05-04, plan's "current state excerpts" need spot-verification before executor runs.
- H3 chunkedBatchSave concurrent-saves clobber risk (deferred to migration). Since 2026-05-03.
- iPad print preview side-by-side. Since 2026-04-26.
- 0d3220e PDF legend phone-smoke. Since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix. Since 2026-04-14.
- Payroll aggregator path 1. Since 2026-04-12.
- Amy ADP rounding rule discovery (Sarvi-asks-Amy). Since 2026-04-26.
- S39.4 mobile admin extraction (blocked by admin state to context provider refactor).

## Key Context

- **Pitch-deck argument tiers (locked in DECISIONS s063):** T1 unrelenting (relationship asymmetry, custom-built demo, cost-of-forgetting, Mani 2015, OTR ownership, bug fixes always, quick-turn dev, capped trial spend). T2 corroborators (Gap study, Choper 2022, HBS 28M timecards, hidden pricing, per-user growth tax). T3 supporting. Plan amplifies T1 by repositioning visually + sequentially.
- **Pitch-deck pricing reality (locked in DECISIONS s063):** Rainbow is NOT the cheapest at 35 employees. Year-1 CAD: Rainbow $7,464; Agendrix Essential $2,176; Agendrix Plus $2,932; Deputy Core $3,740 ($2,730 USD); Deputy Core+HR+Analytics $5,750 ($4,200 USD); ADP + TimeForge quote-only. Argue fit, not price. Hidden pricing on quote-only vendors + per-user growth tax + USD billing land as ammunition for the existing fit-not-price thesis.
- **Stat corrections landed in plan:** Mercer 25.9% (2024) becomes 21.0% (2025); Choper "21-35% more likely to leave" rephrased to "35% turnover with under-1-wk notice vs 26% with 2+ weeks; 50% relative increase under maximum instability"; MIT Sloan "1% payroll cut = 4% revenue" REMOVED (unverifiable in primary sources).
- **ESA stays at one mention only** (Today.jsx Safety Net card) -- per `feedback_esa_not_a_selling_point.md`, re-affirmed twice in this session. Do not propagate.
- **Single-developer risk excluded from deck slides** -- per JR direct instruction (Joel personally trusts JR; not a worry he holds). Source-code escrow + perpetual licence + 12-month service contract live in Spec route §12 for Scott; do not promote to deck.
- **Sarvi's $30,452 stays on Cost.jsx only** -- not propagated to other slides. Diversification corroborator on Cost itself (turnover card NEW per plan § 2.4). Three-year math on Proposal ($91,356 / $19,392 / $71,964) is mathematically derived from Sarvi's number but uses different magnitudes -- JR-locked OK.
- **Trial walk-away cap = $2,991** ($1,500 plus $497 x 3). Made explicit on Proposal slide trial card + Proposal lead body + Price sheet green-box max-spend line. Replaces the misleading "only paid for what was used" framing.
- **Brand fidelity:** dark navy ground, 5-color OTR palette (Red `#EC3228`, Blue `#0453A3`, Orange `#F57F20`, Green `#00A84D`, Purple `#932378`), Josefin Sans display, accent-top-border card pattern. No new palette colors. No green/red status colors. `#EC3228` stays at full saturation despite dark-theme guidance to desaturate -- brand fidelity overrides.
- **Memory correction made this session:** `project_carman_family_profile.md` -- removed "Amy distrusts automation" claim per JR direct correction (Amy is control-protective, not anti-automation). Memory file timestamped 2026-05-04 with the correction noted inline.
