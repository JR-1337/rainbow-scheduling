# s028 -- 2026-04-27 -- LESSONS/DECISIONS archive maintenance + email sender migration prep doc

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: email sender migration plan ready at `docs/email-sender-migration.md`; blocked on JR finishing Sheet + Apps Script ownership transfer to `otr.scheduler@gmail.com`, then I update `API_URL` and smoke a test send.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `cf1b8cc` (s027 handoff). No code commits this session -- maintenance pass only.
- Working tree: `M CONTEXT/DECISIONS.md`, `M CONTEXT/LESSONS.md`, `M CONTEXT/TODO.md`, `M CONTEXT/archive/decisions-archive.md`, `D CONTEXT/handoffs/s024-...md` (stale archive deletion carried from s027), `?? CONTEXT/archive/lessons-archive.md` (new), `?? docs/email-sender-migration.md` (new), `?? .cursor/rules/{blast-radius,ui-ux-design}.mdc` (long-untracked, JR confirmed leave-alone in s022).
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched this session, last HEAD `fc48565` from s027.
- Active focus: ratchet down maintenance debt + prep tomorrow's email-sender migration so it executes cleanly when JR completes the Google account ownership transfers.
- New OTR Gmail captured: `otr.scheduler@gmail.com` (replaces JR's personal Gmail as schedule-distribution sender).
- Working assumption confirmed this session: Apps Script `MailApp.sendEmail` sender is the script project owner, not a value in code. Migration is an account/deployment swap, not a string substitution. Captured in detail in `docs/email-sender-migration.md`.

## This Session

**Three maintenance tasks shipped (no commits yet):**

- **LESSONS.md archive pass** -- 580 -> 570 lines.
  - Archived 2 entries to new `CONTEXT/archive/lessons-archive.md`: trailing-underscore Apps Script editor dropdown (one-shot widener, deleted), AdaptiveModal hot-resize survives (positive observation, not a pitfall).
  - Tightened 3 verbose pitch entries (compressed Context paragraphs to single lines per schema "sentences under 20 words" rule): "Pitch-facing copy uses lawyer voice", "Don't name JR personally in deck", "Carman family doesn't backfill Sarvi".
  - Created `CONTEXT/archive/lessons-archive.md` from inline schema (first archive ever for LESSONS).
  - LESSONS still well over the 150 ceiling. Conservative cut by design -- the file is mostly load-bearing patterns and aggressive archival would lose signal. Schema-defined ceiling target (60% = 90 lines) is unrealistic for this file's current content density without graduating multiple entries to global LESSONS.

- **DECISIONS.md archive pass** -- 183 -> 153 lines.
  - Archived 3 oldest non-superseded PK product entries to `CONTEXT/archive/decisions-archive.md`: PKDetailsPanel sibling panel, bulk-clear PK by day, PKEventModal dual-mode.
  - All 3 shipped + verified at builds `0fe138c` / `63420ce` / `78f02d7`; opportunistic stale moves per the schema's "session-end opportunistic when entries are clearly stale" rule.
  - Updated archive-pointer comment in active `DECISIONS.md` to reflect s028 archival.
  - Still 3 lines over 150 ceiling; matches s027's accepted "deeper cut deferred" position.

- **Email sender migration prep doc** -- `docs/email-sender-migration.md` (~140 lines).
  - Documents Path A (re-own Apps Script + Sheet under `otr.scheduler@gmail.com`, re-deploy Web App "Execute as: Me", swap `API_URL` in `src/utils/api.js:6`) -- recommended.
  - Documents Path B (verify `otr.scheduler@gmail.com` as "Send mail as" alias on current owning account, switch `sendEmail` from `MailApp.sendEmail` to `GmailApp.sendEmail({from})`) -- fallback if URL change unacceptable.
  - Key finding documented: there is NO hard-coded sender in `backend/Code.gs`. `MailApp.sendEmail` always sends from the script-owning account. The only literal `johnrichmond007@gmail.com` at `backend/Code.gs:2280` is seed data for the `emp-owner` employee row, NOT a sender. Naive find-and-replace would not change the sender at all.
  - Includes verification checklist + risk notes + open question about PDF attachment workflow (long-blocked Email upgrade item slot).

**Memory writes:**

- `TODO.md`: 2 new Completed entries (s028 maintenance + email prep doc). Active list updated -- top-priority email item now references the migration doc + new Gmail address; new bullet added for Email upgrade (PDF auto-attach) explicitly flagged as unblocked-after-sender-swap.
- `DECISIONS.md`: archive-pointer comment updated for s028 PK archival. No new decisions this session.
- `LESSONS.md`: 2 entries archived, 3 tightened. No new entries.
- `ARCHITECTURE.md`: untouched.
- Auto-memory: untouched.

**Decanting:**

- Working assumptions: Apps Script `MailApp.sendEmail` sender is project ownership, not a code constant -- confirmed during sender-call-site audit. Captured in `docs/email-sender-migration.md` Path A intro.
- Near-misses: I almost did aggressive LESSONS.md archival to chase the 150 ceiling. Would have destroyed signal -- the file is densely load-bearing. Course-corrected to conservative tightening (10-line cut). Recorded so the next session does not re-tempt the same mistake.
- Naive next move: looking at `johnrichmond007@gmail.com` at `Code.gs:2280` and treating it as the sender to swap. It is seed data for the `emp-owner` employee row, not a sender reference. Documented in the migration doc.

**Audit:**

- Audit ran (CONTEXT/* written before Step 2 + DECISIONS edited).
- Schema-level: clean. All required sections present in TODO/DECISIONS/LESSONS. New `archive/lessons-archive.md` created with full inline schema header.
- DECISIONS.md: 153 lines (was 183). Three lines over ceiling; matches s027's accepted deferred-cut position.
- LESSONS.md: 570 lines (was 580). Still far above 150 ceiling. Schema-defined 60% target (90 lines) requires multi-session graduation work, not a single archive pass. RISK persists; the dedicated maintenance pass JR scheduled in s027 was THIS pass and was deliberately conservative.
- Adapter files: untouched.
- Style soft-warns: pre-existing MD041/MD022/MD032/MD033 noise persists in `CONTEXT/*` and now in `archive/lessons-archive.md` (mirrors `decisions-archive.md` pattern); none introduced at edit sites.

`Audit: 3 DECISIONS entries archived (PKDetailsPanel + bulk-clear PK + PKEventModal dual-mode); 2 LESSONS entries archived + 3 tightened; new lessons-archive.md created from schema; LESSONS 570/150 ceiling intentionally deferred (signal density)`.

## Hot Files

- `docs/email-sender-migration.md` -- READ FIRST next session if email work is on the table. Path A + Path B + verification checklist.
- `backend/Code.gs:2055-2068` -- `sendEmail()` wrapper. The single point of swap if Path B (`GmailApp` alias) is chosen.
- `src/utils/api.js:6` -- `API_URL` constant. Update if Path A (re-own + re-deploy) is chosen.
- `backend/Code.gs:2280` -- `emp-owner` seed row containing literal `johnrichmond007@gmail.com`. NOT a sender. Touch only if JR wants the Owner row's email updated separately.
- `CONTEXT/TODO.md` -- top Active is the email migration item with full context inline.
- `CONTEXT/archive/lessons-archive.md` -- newly created. Future LESSONS archivals prepend here.
- `CONTEXT/archive/decisions-archive.md` -- 3 PK entries prepended at top under `2026-04-27 (s028)` move marker.

## Anti-Patterns (Don't Retry)

- Do NOT replace the literal `johnrichmond007@gmail.com` at `backend/Code.gs:2280` expecting it to swap email senders. It is seed data for the Owner employee row. Sender swap requires Apps Script project ownership transfer (Path A) or `GmailApp` + verified alias (Path B). See `docs/email-sender-migration.md`.
- Do NOT chase the LESSONS.md 150-line ceiling by mass-archiving. The file is densely load-bearing. The right path is graduation of `Affirmations: 2` entries to global LESSONS or to project conventions, not opportunistic archival. Two entries already carry the marker (`Follow approved plan verbatim`, `Pitch-facing lawyer voice`).
- Do NOT delete the OLD Apps Script Web App deployment immediately after Path A re-deploy. Staff PWAs / bookmarks need 5-7 days to cycle through to the new bundle's `API_URL`. Old URL stays alive but routes to old-account-owned script during the gap.
- Do NOT trust that an `Agent(...)` rejection killed the subagent (carried lesson, still active).
- Do NOT replace customer-facing copy that wasn't approved (carried s026 lesson, still active).
- Do NOT ship sub-9px text on mobile cells (carried s027 lesson, still active).
- Do NOT use `table-layout: auto` for fixed-width sticky columns with unbreakable strings (carried s027 lesson, still active).

## Blocked

- Email + distribution overhaul -- migration plan ready at `docs/email-sender-migration.md`; new Gmail captured (`otr.scheduler@gmail.com`); blocked on JR completing Sheet + Apps Script project ownership transfer to that account. Once done, next session executes Path A (re-deploy + `API_URL` swap + smoke test) -- since 2026-02-10, **NEAR-UNBLOCK on next JR action**.
- Email upgrade (PDF auto-attached via MailApp) -- waits on sender migration above. Surface to JR after sender swap verified.
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14.
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14.
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14.
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12.
- Amy ADP rounding rule discovery -- still waiting on Sarvi-asks-Amy. Not pitch-blocking. Since 2026-04-26.
- Mobile eyebrow visual verify -- needs an employee with `emp.title` populated (none in Sheet today).

## Key Context

- This session was an autonomous "while JR slept" maintenance pass. All work was no-shared-state, reversible: archive moves + doc creation + entry tightening. No code, no commits, no pushes.
- Migration sender finding is the load-bearing fact for tomorrow: Apps Script `MailApp.sendEmail` sends from whoever OWNS / DEPLOYED the script project. JR moving the Sheet to the new account is necessary but not sufficient -- the bound script project follows, but the Web App must be RE-DEPLOYED as the new account ("Execute as: Me") for the sender to actually flip.
- Path A vs B tradeoff is captured in the migration doc table; recommendation is Path A (cleanest, no code change to mail logic, costs one URL change + 5-7 day PWA cycling window).
- `CONFIG.ADMIN_EMAIL = 'sarvi@rainbowjeans.com'` at `Code.gs:197` is RECIPIENT, not sender. Unaffected by migration.
- LESSONS.md ceiling is now an explicit two-session deferred item. Schema-prescribed depth (60% = 90 lines) requires multi-pass graduation work, not opportunistic archival. JR may want to schedule a focused graduation review.
- Push to scheduling-app `main` is hook-gated; this handoff commit needs JR's per-session "push yes" or equivalent on resume.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is email logic + schedule distribution wiring (next-session priority). Now references `docs/email-sender-migration.md` + the new Gmail address.
2. Read `docs/email-sender-migration.md` if email work is the resume point. ~140 lines, two paths fully spec'd, verification checklist at end.
3. Read `CONTEXT/DECISIONS.md` -- 153 lines (was 183). Top entries unchanged from s027. Archive pointer at bottom now lists s028 PK move.
4. Read `CONTEXT/LESSONS.md` if pitch-copy framing or mobile UI is in scope -- 570 lines. RISK still flagged on size. Two `Affirmations: 2` candidates ready for graduation review (`Follow approved plan verbatim`, `Pitch-facing lawyer voice`).
5. Auto-memory: unchanged this session.
6. Check git on this repo: `git log --oneline -3` should show `cf1b8cc` at HEAD (no commits this session). Working tree carries the 4 modified CONTEXT files + this handoff + new `docs/email-sender-migration.md` + new `CONTEXT/archive/lessons-archive.md` -- ready for one s028 commit when JR resumes.
7. If JR confirms ownership transfer is done: open `docs/email-sender-migration.md`, follow Path A steps 4-8 (re-deploy Web App as new account -> copy new `/exec` URL -> update `src/utils/api.js:6` -> build + push -> smoke).
8. If switching harnesses: read shared `CONTEXT/*` first; AGENTS.md is canonical -- shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: this session shipped only memory + doc changes; nothing to smoke. Maintenance work is self-verifying via line counts.
- (b) External gates: JR needs to confirm Sheet + Apps Script ownership transfer to `otr.scheduler@gmail.com` is complete before sender migration can execute.
- (c) Top active TODO: email logic + schedule distribution wiring.

Most natural next move: ask JR whether the ownership transfer is done. If yes, execute `docs/email-sender-migration.md` Path A starting at step 4 (re-deploy Web App from the new account, copy the new `/exec` URL, update `src/utils/api.js:6`, build + push + smoke). If no, commit + push the s028 maintenance pass first to clear the working tree, then wait. Either way, surface this session's commit (`docs/email-sender-migration.md` + LESSONS/DECISIONS archival) early so JR can see what happened overnight.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
