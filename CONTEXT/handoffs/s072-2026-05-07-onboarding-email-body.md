# s072 -- 2026-05-07 -- Onboarding email body matches schedule branded shell

vermilion. chunking.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: v2.33.2 paste-deployed; email-formatting smoke parked at `docs/smoke/email-formatting-smoke-2026-05-07.md` for s073 to run against v2.33.2-live.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`. Localhost dev server (Vite at `http://localhost:5173/`) hits the same Apps Script + Sheet as prod -- no separate dev data plane.
- **Git:** `main` clean (post-handoff-commit), in sync with `origin/main`. Three feature commits this session: `8f9c812` (R1-R4 + admin form), `505b005` (v2.33.1 onboarding email static block), `1e2ac7e` (v2.33.2 branded shell match).
- **Active focus end-of-session:** s072 R1-R4 + admin-form bundle shipped via /coding-plan; two follow-on commits closed the welcome-email-body gap surfaced when JR opened the v2.33.0 email and saw it empty. JR paste-deployed v2.33.2 mid-session (post-handoff-request). Email-formatting smoke parked for s073.
- **Working assumption (verified s072):** the `LAUNCH_LIVE_=false` recipient rewrite gate in `Code.gs` ONLY applies to the `sendOnboardingEmail` path. All time-off / shift-offer / shift-swap email paths send directly to whatever address the workflow targets -- no rewrite. This is operationally critical for the parked smoke: emails to plus-addressed fixtures (T2 / TA) DON'T reach JR's primary inbox on those paths. Captured in `docs/smoke/email-formatting-smoke-2026-05-07.md` Pre-flight section.

## This Session

**Shipped-but-unverified:** Email-formatting smoke (the full chain) is parked for s073. Plan at `docs/smoke/email-formatting-smoke-2026-05-07.md` -- 6 in-scope flows, cleanup checklist, opt-in workarounds for the ~14 skipped variants documented inline.

**External ops:** v2.33.2 paste-deployed by JR to otr.scheduler-owned Apps Script editor 2026-05-07 session-end (covers v2.33.1 + v2.33.2 in one paste since v2.33.1 wasn't deployed before).

**Audit:** clean (13 LESSONS atomicity soft-warns carried + slot-count soft-warns; no schema fails, no em-dashes, no adapter bloat). Step 2 ceiling-driven archive: 7 oldest DECISIONS entries (~13.9k chars) moved to `decisions-archive.md`; active dropped 26.1k -> 12.2k.

**Memory writes:** TODO + DECISIONS (+1, +archive pass) + LESSONS (+1, lessons_pre=28 lessons_post=29, no cadence trigger). DECISIONS entry: `2026-05-07 -- Onboarding email body matches schedule-distribution branded shell (v2.33.0 -> v2.33.1 -> v2.33.2)`. LESSONS entry: `[PROJECT] -- Verify the actual delivery surface before treating an audit-spec symbol pointer as unambiguous`.

**Prune:** Anti-Patterns: 1 dropped (s071 "wait for guide format pick" -- JR picked Option C this session, lesson resolved), 0 graduated, 2 kept (s069 useCallback-without-memo, s068 subagent-vs-frontend-pattern), 1 net-new s072 (parallel-shell-vs-wrapper-opts caution). Hot Files: 4 dropped (s071 LoginScreen post-R2-ship; s069 MobileAdmin/EmployeeView; s069 EmployeeRow/ColumnHeaderCell; s068 employeeSort+constants -- all pure-perf or shipped, less hot for next session's email focus), 2 added s072, 6 kept (3 bumped).

## Hot Files

- `docs/smoke/email-formatting-smoke-2026-05-07.md` -- s072->s073 parked smoke plan: 6 in-scope email flows, cleanup checklist, opt-in workarounds for ~14 skipped variants. Read FIRST in s073. (origin: s072)
- `backend/Code.gs` -- v2.33.2 live. Static block at `ONBOARDING_EMAIL_STATIC_BLOCK_HTML_` (~line 488); branded wrapper opts at `BRANDED_EMAIL_WRAPPER_HTML_` (`headerEyebrow`, `greetingHtml`, `trustedHtmlAfter`); `sendOnboardingEmail` composes the shell. New-User Guide URL gets added to the static block when guide page exists. (origin: s071, bumped s072)
- `src/email/buildBrandedHtml.js` -- frontend gold-standard branded shell (schedule-distribution email). Reference for the "match this look" comparison done in v2.33.2. (origin: s072)
- `src/App.jsx` -- `saveEmployee` Bug 3 fix shipped (guard reads `e.isAdmin`, not `editingEmp.isAdmin`); reject paths return `{ error: msg }` for inline banner. (origin: s069, bumped s072)
- `src/modals/EmployeeFormModal.jsx` -- inline error banner (`errors.form`) above bottom button row; mirrors existing email-collision pattern. (origin: s071)
- `src/modals/ChangePasswordModal.jsx` -- R3 hint shipped ("Min 4 characters."). R5 (echo default password) still deferred. (origin: s071)
- `docs/audit/new-user-experience-2026-05-07.md` -- audit findings. Section 5 R5/R6/R8/R9 still deferred. (origin: s071)
- `CONTEXT/DECISIONS.md` -- archive cycle ran s072 (7 entries -> archive). Active now 12.2k, well under ceiling. (origin: s064, bumped s071, bumped s072)

## Anti-Patterns (Don't Retry)

- **Don't build a parallel email shell when `BRANDED_EMAIL_WRAPPER_HTML_` can be extended with backwards-compatible opts.** s072 considered a parallel onboarding shell to avoid touching the wrapper used by ~10 notification emails (time-off, swap, offer, etc.). Picked the wrapper-extension path with safe defaults (`headerEyebrow='OTR Scheduling'`, `greetingHtml=''`, `trustedHtmlAfter=''`) so existing callers stay unchanged. Future: when a new email type needs different chrome, extend the wrapper with a new opt; do NOT fork the shell. Parallel shells diverge over time and double the visual-regression surface. (origin: s072, near-miss caution)
- **Don't add `useCallback` wraps to inline handlers passed into a child unless the child is already wrapped in `React.memo`.** Premature optimization: desktop branch was fully `useCallback`'d when audited s069, and mobile inline handlers are no-op until the receiving component is memo-wrapped. Verify the consumer's memo state before chasing handler stability. (origin: s069)
- **Don't dispatch a research subagent when the user-reported symptom matches a known frontend pattern.** Sarvi's "long-ass error that disappears" was the Vite chunk-load family; the agent's run found "no code bug" because the bug class was environmental (stale chunk hash). (origin: s068)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked.

## Key Context

- **Localhost = prod data plane.** Vite dev server connects to the same Apps Script + Sheet as prod. Test-only workflows must keep test accounts Inactive + showOnSchedule=false to avoid Sarvi's grid; rename + Inactive ops persist live.
- **Pre-launch email allowlist** (`feedback_no_staff_emails_pre_launch.md`) -- only Sarvi + JR + `john@johnrichmond.ca` may receive any email. `LAUNCH_LIVE_=false` rewrite ONLY covers `sendOnboardingEmail`; time-off / swap / offer paths have no rewrite. Smoke fixture choice is what controls visibility (smoke plan doc Pre-flight has the routing matrix).
- **Test fixtures locked s071** (passwords confirmed s072 in `reference_smoke_logins.md`): Test Employee1 / Test Employee2 / Test Admin all Staff-at-rest, all Inactive. Default passwords `TestE` / `TestE2` / `TestA`.
- **Smoke window 3 months ahead:** Aug 3-9 / 10-16 / 17-23 / 24-30 2026 -- well outside Sarvi's typical period view. Write test shifts there + clear in same session.
- **Apps Script live = v2.33.2** (paste-deployed s072 by JR session-end). v2.33.0 = R1 in welcome PDF; v2.33.1 = onboarding email body static block; v2.33.2 = branded shell match (NEW EMPLOYEE WELCOME header eyebrow, greeting row, accent-bordered Get Started card).
- **New-User Guide format = C (static webpage), URL deferred.** Add to `ONBOARDING_EMAIL_STATIC_BLOCK_HTML_` when guide page exists.

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `vermilion. chunking.` near top of `## Active`; new top entry is the parked email smoke + reference to `docs/smoke/email-formatting-smoke-2026-05-07.md`.
2. `git log --oneline -10` -- expect this run's handoff commit on top, then `1e2ac7e` (v2.33.2), `505b005` (v2.33.1), `8f9c812` (R1-R4 + admin form), `1f27823` (s071 handoff), `216b875` (s070 handoff), `7788ac8` (kit upgrade), `db23608` (s069 handoff), `0703fbf`, `ffeafd6`.
3. `git status -s` -- clean.
4. Apps Script live version = v2.33.2 per `Code.gs` header. If smoke shows old behavior (empty welcome email body), JR may not have paste-deployed; surface and confirm before re-running.
5. If JR opens the smoke, read `docs/smoke/email-formatting-smoke-2026-05-07.md` IN FULL before triggering anything; the doc covers all 6 flows + recipient routing matrix + cleanup.

## Next Step Prompt

Default falls (a) -> (b) -> (c):

- (a) **Shipped-but-unverified:** parked email-formatting smoke -- 6 in-scope flows. Plan at `docs/smoke/email-formatting-smoke-2026-05-07.md`. Pre-confirm with JR he's ready to receive emails before triggering, then run end-to-end with cleanup.
- (b) **External gates:** none currently blocking JR; smoke is JR-go-ahead, not external-gated.
- (c) **Top non-blocked Active TODOs:** New-User Guide URL pending guide page; R5/R6/R8/R9 audit fixes still deferred per JR.

**Caution (naive next move):** smoking before confirming JR is at his inbox. The smoke fires real emails to JR's primary inbox + Sarvi's inbox (which Sarvi forwards to JR per the plan). If JR is mid-something and not watching, the captures get lost / pile up.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical -- shims rarely need repair.
