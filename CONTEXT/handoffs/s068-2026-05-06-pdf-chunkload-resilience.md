# s068 -- 2026-05-06 -- schedule sort 4-bucket restored + PDF chunk-load resilience

mizugumo. holography.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: PDF chunk-load self-heal shipped (`d4a1bf7`); smoke gates on Sarvi hard-refresh + retry on her desktop.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`. Cross-repo touch: one-line `~/APPS/RAINBOW-PITCH/` Ripple.jsx footer rewrite earlier in the session (commit `0a289d2`) per Sarvi's feedback that the prior copy implied she works unpaid; not load-bearing for next session.
- **Git:** `main` at `d4a1bf7` (PDF chunk-load auto-reload), 4 session commits pushed to `origin/main`. Step 7 commits + pushes this handoff on top.
- **Active focus end-of-session:** PDF Export resilience shipped, awaiting Sarvi's hard-refresh + retry as the smoke gate. Schedule grid sort 4-bucket restoration locally smoked via agent-browser; mobile + PDF surfaces inherit unchecked.
- **Working assumption (this session, durable for the open smoke only):** Sarvi's "long-ass error that disappears too fast" on Export PDF was the Vite chunk-load family ("failed to fetch dynamically imported module ..."), produced when her tab's main bundle references a chunk hash that no longer exists on the CDN after auto-deploy. JR's tab does not see it because his tab is fresher. The fix targets that family (auto-reload). If the symptom is something else, the persistent error modal she gets after one hard-refresh will surface the actual text.

## This Session

**Shipped-but-unverified:**
- Schedule grid sort restored to 4-bucket Sarvi/Admin/FT/PT (`f58670d` + `b1c8ae0`). Cursor's `db3e893` had collapsed to a flat name-rank list, mixing admin2 staff into the alpha tail. New `scheduleBucket` is a single internal helper shared by sort + dividers; admin bucket combines `isAdmin or adminTier eq 'admin2' or isOwner`; FT and PT split out by `employmentType`. `SCHEDULE_ROW_FIRST_NAME_ORDER` aligned to Sheet first names (`Daniel`->`Dan`, `Jessica`->`Jess`, `Anjali`->`Anejli`). `employeeBucket` left at its 5-value shape for AutofillClearModal. Localhost agent-browser smoke verified the live row order; mobile + PDF surfaces inherit but were not separately exercised.
- PDF Export chunk-load resilience (`3b5380e` + `d4a1bf7`). `3b5380e` swaps the auto-dismiss toast for a persistent modal with a Copy-to-clipboard button + writes the error to `localStorage['pdf-export-last-error']`. `d4a1bf7` adds a chunk-load detector in the catch arm: matches the cross-browser wording variants and triggers `window.location.reload()` instead of showing the modal. Sarvi must hard-refresh once on her desktop to pick up the new bundle, then retry Export PDF.

**External ops:** none.

**Audit:** clean (5 pre-existing LESSONS atomicity soft-warns, none new this session).

**Memory writes:** `CONTEXT/TODO.md` (anchor swap to `mizugumo. holography.`, top-of-Active s068 ship items, Verification updates, Completed +1 with one trim to keep 5). `lessons_pre=25 lessons_post=25`, no cadence trigger.

**Prune:** Anti-Patterns: 2 dropped (s063 entries outside the 5-session window, did not re-surface), 0 graduated, 4 kept, 1 net-new s068; Hot Files: 1 dropped (RAINBOW-PITCH slide trio s064/s065 outside window and untouched), 2 added s068, 2 kept (re-tagged).

## Hot Files

- `src/utils/employeeSort.js` + `src/constants.js` -- 4-bucket schedule sort + name-rank constant. If a new admin's first name is not in `SCHEDULE_ROW_FIRST_NAME_ORDER` they alpha-tail; if Sheet first-name spelling drifts again, rebalance the constant. (origin: s068)
- `src/App.jsx:1651-` -- `handleExportPDF` click handler with the chunk-load self-heal regex + persistent error modal. If a future Vite or browser version changes the dynamic-import error wording, update the regex. (origin: s068)
- `backend/Code.gs` + `src/App.jsx` + `src/modals/EmployeeFormModal.jsx` -- tier authority stack at v2.32.5 / `d6010f4`. (origin: s066, re-touched s068 for App.jsx PDF handler)
- `CONTEXT/DECISIONS.md` -- 22.6KB, archive cycle expected when next entry crosses 25k chars. (re-hot s064)

## Anti-Patterns (Don't Retry)

- **Don't dispatch a research subagent when the user-reported symptom matches a known frontend pattern.** Sarvi's "failed to fetch dynamically imported module" is the Vite chunk-load family; first-line response is hard-refresh + a self-heal regex in the catch arm, not a deep-source investigation. The agent's run found "no code bug" because the bug class is environmental (stale chunk hash); the time would have been better spent shipping the auto-reload directly. (origin: s068)
- **Don't spawn ad-hoc triage subagents when an installed skill already defines the workflow.** (origin: s065)
- **Don't override JR's "good enough" calibration with model-driven completionism on deferred deck items.** (origin: s064)
- **Don't fix tier persistence by Sheet `isOwner` edits alone while `App.jsx` still strips `isAdmin`/`adminTier` for every non-owner.** (origin: s066)
- **Don't treat optimistic UI as proof of persistence** before `saveEmployee` payload still carries tier fields for admin1 callers. (origin: s066)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked.

## Key Context

- **Schedule sort = single `scheduleBucket` helper in `src/utils/employeeSort.js`.** 0=Sarvi (pinned by first-name match), 1=Admin = `isAdmin or adminTier eq 'admin2' or isOwner` (employmentType ignored), 2=FT = `employmentType eq 'full-time'` AND not admin, 3=PT/other. Admin bucket sorts by `SCHEDULE_FIRST_NAME_RANK` then alpha; FT and PT pure alpha. Dividers render between buckets via `scheduleDisplayDividerGroup` (alias of `scheduleBucket`). All 4 grid views + PDF inherit through shared call sites.
- **PDF dynamic-import resilience = catch-arm regex in `handleExportPDF`.** Matches cross-browser chunk-load wording, calls `window.location.reload()`, returns. Non-chunk errors fall through to the persistent modal with Copy-to-clipboard button and `localStorage['pdf-export-last-error']` persistence. The modal is the diagnostic surface for non-chunk failures.
- **Apps Script live = v2.32.5 (paste-deployed s066).** No backend writes this session.
- **Sarvi is now `isOwner=true`** per JR mid-session. Same tier as JR; the JR-vs-Sarvi gap on Export PDF is environmental (browser/cache), not data.

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `mizugumo. holography.`; top of Active is the s068 PDF chunk-load smoke gate.
2. `git log --oneline -5` -- expect this run's handoff commit on top, then `d4a1bf7`, `3b5380e`, `b1c8ae0`, `f58670d`.
3. `git status -s` -- clean.
4. If JR reports Sarvi's PDF Export still failing after her hard-refresh, ask her to tap **Copy error to clipboard** in the modal and paste the full text. Do NOT speculate further until that text is in hand.

## Next Step Prompt

Default falls (a) -> (b) -> (c):

- (a) **Sarvi PDF smoke (gating).** After Vercel auto-deploy of `d4a1bf7` lands and Sarvi does one hard-refresh, her next Export PDF tap either silently reloads (chunk-load self-heal) or pops the persistent modal. Wait for JR's read-back. Caution: if her hard-refresh works, do NOT pre-diagnose deeper; the cause was environmental and the auto-reload is the durable fix. If she still fails after refresh, the modal text is the only ground-truth -- act on that, not a code re-read.
- (b) **External gates:** long-press phone-smoke (s059 instrumentation in `useLongPress.js`); Sarvi using app this week may surface code-side TODOs.
- (c) **Top active TODO:** the schedule grid sort smoke is closed locally but mobile + PDF surfaces remain unverified by JR -- worth a one-tap confirmation when convenient.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical.
