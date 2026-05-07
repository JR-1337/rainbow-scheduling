# s071 -- 2026-05-07 -- New-user UX audit + test-fixture rename

cinnabar. predictive coding.

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: new-user audit shipped at `docs/audit/new-user-experience-2026-05-07.md`; JR to pick R1-R4 fix bundle + New-User Guide format (A/B/C). Four admin-form bugs queued for the same fix bundle.

## State

- **Project:** RAINBOW Scheduling APP at `~/APPS/RAINBOW Scheduling APP/`. Localhost dev server (Vite at `http://localhost:5173/`) hits the same Apps Script + Sheet as prod -- no separate dev data plane.
- **Git:** `main` clean except for this run's handoff residue, in sync with `origin/main`.
- **Active focus end-of-session:** new-user audit + test-fixture rename complete; awaiting JR review of audit findings doc to pick fix bundle for next session.
- **Working assumption (verified s071):** the frontend Edit Employee form has multiple silent failure modes (Save click fires no fetch on certain field combinations; admin-deactivation toast renders behind dialog; `editingEmp.isAdmin` is a stale closure in `App.jsx:891` so demote-then-deactivate needs 2 saves). Direct `saveEmployee` API call via `fetch` to the Apps Script URL with the cached `otr-auth-token` bypasses all of these and is the workaround for fixture management. Captured in LESSONS s071.

## This Session

**Shipped-but-unverified:** none gating. Audit findings doc + LESSONS/DECISIONS entries are observation-only; no code shipped.

**External ops:** Test fixture identities renamed in the live Sheet via direct API call (form Save was no-op'ing). Final state: Test Employee1/Staff/`TestE`, Test Employee2/Staff/`TestE2`, Test Admin/Staff/`TestA`, all Inactive (Active 35 / Inactive 5 / Archive 2). Sarvi will see new names if she opens Inactive tab; no schedule-grid impact.

**Audit:** clean (38 LESSONS atomicity soft-warns, mostly carried; 1 net-new from this session's `Switch to direct API` Rule line).

**Memory writes:** TODO + LESSONS + DECISIONS. `lessons_pre=23 lessons_post=24` -- no cadence trigger. LESSONS entry: `[PROJECT] Switch to direct API when admin form Save no-ops`. DECISIONS entry: `2026-05-07 Test fixtures standardized; admin fixtures rest at Staff tier`. Auto-memory `reference_smoke_logins.md` needs update next session (rotation reset from `TestG2` to new fixture set).

**Prune:** Anti-Patterns: 1 dropped (s066 optimistic-UI-as-persistence -- 5-session age, did not surface), 0 graduated, 2 kept (s068 subagent-vs-frontend-pattern, s069 useCallback-without-memo), 0 net-new. Hot Files: 1 dropped (`buildBrandedHtml.js` -- not relevant to audit-fix bundle), 5 added s071, 4 kept (some bumped).

## Hot Files

- `docs/audit/new-user-experience-2026-05-07.md` -- new-user UX findings doc. Section 4 ranks 10 gaps G1-G10; Section 5 lists 9 fixes R1-R9 with effort estimates; Section 6 outlines New-User Guide mini-project. Read first when picking the next fix bundle. (origin: s071)
- `src/modals/EmployeeFormModal.jsx` -- admin Edit Employee form. Four bugs surfaced s071: Save silent no-op, hidden toast (z-index), stale `editingEmp.isAdmin` closure interaction with `App.jsx:891`, no clean admin1 resting-Inactive state. All R-bundle candidates. (origin: s071)
- `src/components/LoginScreen.jsx` -- R2 candidate. Line 130 hint "First time? Your default password is your first name and last initial..." is unconditional; needs to be format-agnostic. (origin: s071)
- `src/modals/ChangePasswordModal.jsx` -- R3 candidate (4-char min hint), R5 candidate (echo default password). Currently shows generic "Welcome! Please set a personal password" with no recap of what default they typed. (origin: s071)
- `backend/Code.gs` -- R1 lives here at lines 404-476 (`WELCOME_TEMPLATE_HTML_`). Welcome PDF body lacks app URL + default password line; 1-line edit + paste-deploy. Login-modal trigger predicate at lines 1089-1096 is the underlying bug class (unconditional `usingDefaultPassword` from `passwordChanged=false`). (origin: s071)
- `src/MobileAdminView.jsx` + `src/MobileEmployeeView.jsx` -- mobile grids with extracted memoized cell components per s069 A6. Future cell-behavior changes thread through the cell prop API. (origin: s069)
- `src/components/EmployeeRow.jsx` + `src/components/ColumnHeaderCell.jsx` -- desktop perf hot path; A4 dropped `AnimatedNumber` here. Modal `AnimatedNumber` preserved at `ShiftEditorModal.jsx:687,693,703`. (origin: s069)
- `src/App.jsx` -- perf cluster (s069) + `saveEmployee` guard at line 880-893 (s071-relevant). The guard rejects deactivating any admin account; this is the structural constraint behind Test Admin's resting-Staff state. (origin: s069, bumped s071)
- `src/utils/employeeSort.js` + `src/constants.js` -- 4-bucket schedule sort + name-rank constant. (origin: s068)
- `CONTEXT/DECISIONS.md` -- 24.2KB, archive cycle imminent when next entry crosses 25KB. (re-hot s064, bumped s071)

## Anti-Patterns (Don't Retry)

- **Don't add `useCallback` wraps to inline handlers passed into a child unless the child is already wrapped in `React.memo`.** Premature optimization: desktop branch was fully `useCallback`'d when audited s069, and mobile inline handlers are no-op until the receiving component is memo-wrapped. Verify the consumer's memo state before chasing handler stability. (origin: s069)
- **Don't dispatch a research subagent when the user-reported symptom matches a known frontend pattern.** Sarvi's "long-ass error that disappears" was the Vite chunk-load family; the agent's run found "no code bug" because the bug class was environmental (stale chunk hash). (origin: s068)
- **Don't draft New-User Guide content before JR picks format A/B/C.** The audit doc Section 6 lists three options (in-app help panel, PDF attachment, static webpage) with different effort profiles. Drafting content first locks in a format implicitly and will get rewritten when JR picks. Wait for the format pick. (origin: s071, naive-next-move caution)

## Blocked

- See `CONTEXT/TODO.md` ## Blocked.

## Key Context

- **Localhost = prod data plane.** Vite dev server connects to the same Apps Script + Sheet as prod. Test-only workflows must keep test accounts Inactive + showOnSchedule=false to avoid Sarvi's grid; rename + Inactive ops persist live. The `feedback_no_staff_emails_pre_launch.md` allowlist gate (Sarvi + JR + `john@johnrichmond.ca`) still applies for any send-trigger smokes.
- **Test fixtures locked s071:** Test Employee1 / Test Employee2 / Test Admin (all Staff at rest, all Inactive). Default passwords `TestE`, `TestE2`, `TestA`. To exercise admin tier, promote Test Admin to Admin in form, save, test, demote back. Multi-step roundtrip per session; 4 admin-form bugs (in TODO Active) make this fragile until R-bundle ships.
- **For shift-switch testing 3 months out:** Aug 2026 weeks (Aug 3-9 / 10-16 / 17-23 / 24-30) -- well outside Sarvi's typical period view. Write test shifts there + clear in same session.
- **Apps Script live = v2.32.5** (paste-deployed s066). No backend writes this session.
- **Auto-memory `reference_smoke_logins.md` is stale** -- still says `TestG2` rotation, should be the new fixture set. Update on next-session entry. Also memory `reference_default_passwords.md` is stale (says `emp-XXX`; current default is FirstnameL via `Code.gs:1183-1211`).
- **Audit doc Section 6 New-User Guide outline** is the seed for a separate mini-project (6 topics: login, schedule, time off, swap, take-my-shift, sick). Built from agent-browser screenshots; some captured already in `~/.claude/scratch/audit-onboarding-2026-05-07/`, more needed (Days Off / Shift Swap / Take My Shift end-to-end flows, populated schedule).

## Verify On Start

1. `CONTEXT/TODO.md` -- anchor `cinnabar. predictive coding.` near top; new top entries are audit-shipped + admin-form-bugs + fixtures-renamed.
2. `git log --oneline -10` -- expect this run's handoff commit on top, then `216b875` (s070 handoff), `7788ac8` (kit upgrade), `db23608` (s069 handoff), `0703fbf`, `ffeafd6`, `62d992c`, `c7c3406`, `137c909`, `1c1b0f4`.
3. `git status -s` -- clean.
4. If JR brings up any New-User Guide drafting, confirm the format pick (A/B/C from audit doc Section 6) before writing content; do not start drafting cold.
5. If JR opens an admin-form fix, the four queued bugs are listed in TODO Active and detailed in `docs/audit/new-user-experience-2026-05-07.md` Section 4 (gaps) + Section 5 (recommended fixes).

## Next Step Prompt

Default falls (a) -> (b) -> (c):

- (a) **Shipped-but-unverified:** none gating.
- (b) **External gates:** JR review of `docs/audit/new-user-experience-2026-05-07.md` to pick (1) which R-fix bundle to ship next (R1-R4 is the recommended starter pack covering blockers G1+G2 and headline UX bug G3), and (2) which New-User Guide format (A/B/C in Section 6).
- (c) **Top non-blocked Active TODOs:** the audit fix bundle once JR picks; the four admin-form bugs in the same bundle.

**Caution (naive next move):** drafting New-User Guide content cold. The format choice (in-app help panel vs PDF attachment vs static webpage) drives the content shape; drafting before the pick gets rewritten. Wait for JR's format selection.

If switching harnesses, read shared `CONTEXT/` first; `AGENTS.md` is canonical -- shims rarely need repair.
