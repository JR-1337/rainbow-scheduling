# s064 -- 2026-05-04 -- Pitch deck v2 shipped + pushed; ship-over-patch on remaining VC critique items

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

cinnabar. holography.

Pass-forward: pitch deck v2 is live on `origin/main` of `~/APPS/RAINBOW-PITCH/` at `37ba459` (post-merge accounting-not-Sarvi fix); RAINBOW Scheduling APP TODOs are unblocked for next pickup; AskRainbow chatbot raised an "Unexpected end of JSON input" error post-ship -- triage owed.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`. This session also worked in `~/APPS/RAINBOW-PITCH/` (deck source) but no scheduling-app code touched.
- **Git (RAINBOW Scheduling APP):** HEAD pre-handoff at `2622dd3` on `main`, in sync with origin. Untracked `.claude/skills/`. Step 7 commits CONTEXT/* edits + pushes.
- **Git (RAINBOW-PITCH):** HEAD `37ba459` on `main`, pushed. Branch `pitch-revision-2026-05-04` retained locally for reference (history preserved via fast-forward).
- **Active focus end-of-session:** pitch deck shipped; AskRainbow chatbot JSON-parse error reported by JR right at handoff time -- triage owed next session.
- **Working assumption (this session, durable):** Buyer profile (Joel = slow + cheap family operator who personally trusts JR) dampens marginal returns from line-level perfectionism on the deck. Drove ship-over-patch on 2 VC-flagged items (DECISIONS s064 + Blocked entries). Codified in LESSONS [PROJECT] entries this session.

## This Session

**Shipped-but-unverified:**
- Pitch deck v2 on `origin/main` of `~/APPS/RAINBOW-PITCH/` at `37ba459` -- 13 commits from session + 1 post-merge fix (Phase2.jsx accounting/Sarvi correction). Vercel auto-deploy in flight at handoff time.
- AskRainbow chatbot error reported by JR post-ship: `Failed to execute 'json' on 'Response': Unexpected end of JSON input`. Means the chatbot endpoint returned an empty or non-JSON body. Likely backend handler error or response truncation. Investigation owed next session: check chatbot route, network tab for actual response body, server logs.

**External ops:**
- None this session (no paste-deploys, no manual Sheet ops). All session work was pitch-repo + CONTEXT/* edits.

**Audit:**
- DECISIONS archive (ceiling trigger at 29,754c >25K): 8 entries moved s055-s043 to `CONTEXT/archive/decisions-archive.md`. Active now 16,661c -- above 15K target but top-5-newest protection (s064 + 2 s063 + s061 + s060) prevents deeper cut. Will re-trigger when next entry pushes back over 25K; expected 2-3 sessions.
- LESSONS cadence archive (3 new entries this session triggered +3 rule): 4 oldest entries moved (`verifyAuth() server-side`, `useIsMobile() at 768px`, `Top-level ../App symbols`, `Apps Script POST returns HTML redirect`). Empty `## React, perf, and refactor hazards` section header removed. Active now 14,828c, under 15K target.

**Memory writes:**
- TODO (anchor + s063 to Completed + Proposal A/B to Blocked) + DECISIONS (s064 entry prepended; archive comment updated) + LESSONS (+3 entries: lessons_pre=22 lessons_post=25, cadence triggered).
- Auto-memory: `project_otr_timekeeping.md` corrected (Sarvi -> accounting reconstructs forgotten-punch hours, JR-corrected post-merge).

**Prune:**
- Anti-Patterns: 1 dropped (untagged meta-pointer to prior handoffs), 0 graduated, 1 net-new added s064.
- Hot Files: 8 dropped (pitch source files shipped + on main, no longer hot), 0 graduated, 2 added s064 (Proposal.jsx + Alternatives.jsx for any post-launch tweaks), 1 kept (DECISIONS re-hot).

## Hot Files

- `~/APPS/RAINBOW-PITCH/src/slides/AskRainbow.jsx` + the chatbot API route (path TBD; not yet inspected this session) -- triage the JSON-parse error here. (origin: s064)
- `~/APPS/RAINBOW-PITCH/src/slides/Proposal.jsx` -- 2 deferred VC-flagged items live in TODO Blocked (chart caption math error, walk-away cap floor/ceiling); revisit only on Joel/family flag. (origin: s064)
- `~/APPS/RAINBOW-PITCH/src/slides/Alternatives.jsx` -- per-card competitor bullets recently rewritten for fit-not-price discipline; if Joel/family pushes on a bullet, this is the file. (origin: s064)
- `~/APPS/RAINBOW Scheduling APP/CONTEXT/DECISIONS.md` -- s064 ship-over-patch decision at top; archive cycle on 2-3 session horizon. (re-hot s064)

## Anti-Patterns (Don't Retry)

- **Don't override JR's "good enough" calibration with model-driven completionism.** When JR has shipped or said "i actually really like it and want to ignore most of your issues", surfacing the dropped issues unprompted next session is regression. Drafted A1/B1 wording for Proposal fixes lives in this session's conversation if JR ever returns to it; do NOT re-surface unprompted. (origin: s064)
- **Don't pivot a deck argument's spine without verifying the underlying premise first.** s063 almost shipped a competitor-pricing comparison argument that would have lost the math (Rainbow is not cheapest at 35 employees). Future plan-writes that lean on a load-bearing factual claim must verify the claim before baking it in. (origin: s063)
- **Don't write handoffs that narrate process instead of orienting the next session.** Forward-facing orientation > backward-facing audit trail; the audit trail lives in git, DECISIONS, and the plan files. (origin: s063)

## Blocked

- **Pitch deck Proposal slide micro-fixes** -- deferred per ship-over-patch (DECISIONS s064). (1) Chart caption "pays for itself before it begins" mathematically false at month 0. (2) Walk-away cap floor/ceiling ambiguity ($2,991 ceiling, $1,500-$2,494 floor). Drafted wording in s064 conversation if needed. Revisit only if Joel/family flag in person. -- since 2026-05-04
- **Sarvi using the app this week; her feedback may surface RAINBOW code-side TODOs.** External gate for the scheduling app, not for the pitch deck. -- since 2026-05-04
- **JR phone-smoke of long-press regression on multi-event mobile cells** -- still owed. -- since 2026-05-04
- **JR Test Admin manual cleanup (s061 carry)** -- still uncleaned at end of s063 unless done off-session. Not blocking.
- **JR paste of LESSONS-schema-fix prompt + HANDOFF-rewrite prompt into context-system session (s061/s063 carry)** -- self-contained prompts drafted; await JR's hand-off.
- H3 chunkedBatchSave concurrent-saves clobber risk (deferred to migration). Since 2026-05-03.
- iPad print preview side-by-side. Since 2026-04-26.
- 089adaa N meetings + 0d3220e PDF legend phone-smoke. Since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix. Since 2026-04-14.
- CF Worker SWR cache. Since 2026-04-14.
- Payroll aggregator path 1. Since 2026-04-12.
- Amy ADP rounding rule discovery (Sarvi-asks-Amy). Since 2026-04-26.
- S39.4 mobile admin extraction (blocked by admin state to context provider refactor).

## Key Context

- **Pitch deck shipped state (locked s064):** `~/APPS/RAINBOW-PITCH/` `origin/main` HEAD `37ba459` = 13 plan + follow-on commits + 1 post-merge accounting-correction. VC critique subagent ID `a61594357d92ba9de` retained for line-level objection inventory if revisiting.
- **OTR is maintaining at 35 employees, not expanding** (JR-stated 2026-05-04 s064). Locks all per-user-pricing critiques to present-tense framing; "growth tax" / "scales as OTR grows" is forbidden in deck or marketing copy. Per LESSONS this session.
- **OTR timekeeping reality (corrected s064):** when staff forget both Counterpoint clock-in AND paper sign-in, **accounting** reconstructs the hours, not Sarvi. Auto-memory corrected. Phase2.jsx body updated.
- **Argument tier framework (locked s063):** T1 (relationship asymmetry, custom-built, cost-of-forgetting, Mani 2015, OTR ownership, bug fixes always, quick-turn dev, $2,991 trial cap). T2 (peer-reviewed corroborators). T3 (supporting). Force from inevitability, not insistence. Tone measured, no insults of competitors.
- **Carman family decision profile** -- see auto-memory `project_carman_family_profile.md`. Joel personally trusts JR; single-developer risk excluded from deck per JR direct instruction.
- **Apps Script live = `59d25c1` (v2.32.1).** Past-period edit lock + Employees archive backend. No paste-deploy this session.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor `cinnabar. holography.`. Active list is uncluttered (s063 pitch active item closed); pick from existing items.
2. `cd ~/APPS/RAINBOW-PITCH && git log --oneline -3` should show `37ba459` at top.
3. `cd ~/APPS/RAINBOW Scheduling APP && git log --oneline -5` should show this session's handoff commit + prior s060-s063 handoff commits.
4. AskRainbow chatbot triage: open the deployed pitch on Vercel, exercise AskRainbow input, capture the actual response body in network tab + any server-side logs. Likely candidates: empty response, non-JSON response, response truncation.
5. Optional: confirm Vercel auto-deploy of `pitch-revision-2026-05-04` reached production. JR usually does this himself.
6. Skip re-reading `~/.claude/plans/rainbow-pitch-revision-2026-05-04.md` and the inventory file unless revisiting deck content -- both shipped.

## Next Step Prompt

Default falls through (a) -> (b) -> (c):
- (a) shipped-but-unverified: AskRainbow chatbot JSON-parse error -- highest priority since it broke a shipped feature. Reproduce + diagnose + fix.
- (b) external gates: Sarvi using app this week (RAINBOW Scheduling code-side feedback inbound), JR phone-smoke of long-press regression, JR Test Admin manual cleanup.
- (c) top active TODO: long-press regression instrumentation diagnosis (phone-smoke owed), then audit Stage 3 triage (deferred from s056 plan), then payroll aggregator path 1.

If JR opens a fresh session, surface the chatbot error first (it is the only shipped-but-broken item). Do NOT default to pitch follow-on copy edits without his cue -- the deck content is shipped and surfacing dropped VC items would violate the s064 ship-over-patch decision.
