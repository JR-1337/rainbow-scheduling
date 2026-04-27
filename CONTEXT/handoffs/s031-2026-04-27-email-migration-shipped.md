# s031 -- 2026-04-27 -- email sender migration complete via nuke-and-pave Option A

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md` (only if preferences may affect approach), then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Email sender migration is DONE -- auto-notifications now send from `otr.scheduler@gmail.com`; top active TODO is now the EmailModal `mailto:` -> backend POST conversion to enable PDF auto-attach + branded body.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `d4c82b1` on `main`. Clean against upstream. 2 commits this session: `33afa4b` (API_URL swap) + `d4c82b1` (CONTEXT writes). Working tree carries 2 long-untracked cursor rules (carry from prior session, not session work).
- Sibling repo `~/APPS/RAINBOW-PITCH/`: untouched this session.
- Active focus: email sender migration shipped end-to-end. Frontend points at otr-owned `/exec`; backend sends as otr.scheduler. Smoke PASS by JR (`From: otr.scheduler@gmail.com` confirmed in Show Original).
- New canonical Sheet + Apps Script: both otr-owned natively (Drive Make-a-copy from inception, no transfer-ghost). Old John-bound deployment + sheet retained ~7 days as fallback before deletion.

**Working assumption:** the new sheet + script are now THE canonical data store. Any edits made on the original John-owned sheet between the moment of copy and the API_URL swap are stranded (JR confirmed acceptable -- only JR + Sarvi use the app, no real users to disrupt).

## This Session

**Commits shipped (2):**

- `33afa4b` -- swap `src/utils/api.js:6` from old otr-but-John-bound `AKfycbznGQ...` URL to fresh `AKfycbxk8FBvUhwWa...` URL on the nuke-and-pave deployment.
- `d4c82b1` -- CONTEXT writes: TODO active item replaced (sender migration -> Completed; new top item is EmailModal `mailto:` conversion); LESSONS rewritten from "transferred but broken" framing to "ownership transfer is a dead end; nuke-and-pave is the working path" with gotchas (Script Properties don't copy; data snapshot at copy time).

**Migration walkthrough (Option A):**

- otr.scheduler in Drive (incognito, single-account session) -> Make a copy of the original Rainbow Sheet -> new sheet + freshly-bound Apps Script project, both otr-owned from inception.
- Opened new sheet's bound script -> Run `sendEmail` from editor -> auth popup appeared correctly (the missing piece on prior attempts) -> granted all scopes to otr.
- Deploy -> New deployment (`otr v1`) -> Execute as Me -> Anyone -> Deploy. New `/exec` URL: `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu9UbXvSXddI0xy-5hQl8kkfpSSQ`.
- Swapped `src/utils/api.js:6` -> `npm run build` PASS -> push.

**Post-deploy script-properties fix:**

- Login on prod returned `HMAC_SECRET not configured` -- Make-a-copy doesn't carry Script Properties (project-level, not file-level).
- JR didn't want to fight session preservation; opted for fresh HMAC + JR-and-Sarvi re-login (only 2 active sessions exist).
- Generated random base64 32-byte string, pasted into new script's Project Settings -> Script Properties -> `HMAC_SECRET`. Save.
- Login worked first try. Passwords carried through with the copied Employees sheet (HMAC signs session tokens, not passwords).

**Smoke result:**

- JR triggered an email on prod -> Show original -> `From:` reads `otr.scheduler@gmail.com`. Confirmed.
- Old John-deployed `/exec` URL retained (don't delete for ~7 days per long-standing carry-forward).

**Mid-session clarification (button vs auto-notification):**

- JR clicked an Email button mid-walkthrough; opened his personal Gmail with no PDF attachment.
- Investigation: that's `src/modals/EmailModal.jsx:68` `mailto:` -- pure browser handoff, never touches Apps Script. Migration didn't apply to it.
- Two distinct email paths confirmed: (a) `mailto:` button (UI only, opens local mail handler, can't attach files by spec), (b) backend `MailApp.sendEmail` for request/schedule-change auto-notifications (the actual migration target).
- JR's pain was conflating the two. Migration still warranted because Sarvi receives request notifications via path (b). Path (a) is the next logical task -- now top of TODO Active.

**Memory writes:**

- `LESSONS.md`: existing entry "Apps Script versioned deployments bind to original deployer" (line 104) rewritten to lead with the WORKING SOLUTION (nuke-and-pave via Drive Make-a-copy), with documented gotchas. Counter incremented to `Affirmations: 1` since this session affirmed the underlying constraint plus shipped the workaround. Line count 590 -> 588.
- `TODO.md`: 3 redundant email-related lines collapsed into 1 unblocked top-Active item (`Email upgrade (PDF auto-attached + branded body via MailApp)`). Migration entry archived to Completed with full root-cause + step summary.
- `DECISIONS.md`: untouched. Nuke-and-pave isn't a durable direction change; it's a discovered constraint already captured in LESSONS.
- `ARCHITECTURE.md`: untouched.

**Decanting:**

- Working assumptions: new sheet is canonical data store from cutover moment; original orphaned (captured in `State`).
- Near-misses: copying old `HMAC_SECRET` value verbatim to preserve sessions was offered; JR rejected (only 2 active sessions exist, fresh HMAC is simpler). Captured as a tradeoff conversation, not durable -- if a similar migration ever happens with real users, the value-copy path is the one to default to.
- Naive next move: clicking the Email button to test migration. Doesn't test it -- `mailto:` never hits Apps Script. Use a path that triggers `MailApp.sendEmail` server-side (request submission, schedule edit on a published period). Captured in Anti-Patterns.

**Audit (Step 3):**

- Schema-level: clean. TODO has Active + Blocked + Verification + Completed. DECISIONS + LESSONS + ARCHITECTURE all have headers.
- DECISIONS.md: 153 lines. Under 200 ceiling.
- LESSONS.md: 588 lines (was 590; -2 net from the rewrite). Over 200 ceiling. RISK carried forward (multi-session graduation effort, not a single archival pass; aggressive archival would lose signal per s028 + s029 + s030 carry-forward).
- TODO.md: 105 lines, ARCHITECTURE.md: 160 lines. Both clean.
- Style soft-warns: pre-existing MD022/MD031/MD032/MD034/MD041 noise across `docs/` and `CONTEXT/`; none introduced this session.
- Adapter files: untouched.

`Audit: clean (LESSONS 588/200 ceiling carried; pre-existing style soft-warns persist)`.

## Hot Files

- `src/utils/api.js:6` -- now points at `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu9UbXvSXddI0xy-5hQl8kkfpSSQ`. otr-owned + otr-deployed from inception.
- `src/modals/EmailModal.jsx:68` -- TOP NEXT: convert `mailto:` to backend POST. Branded HTML body + PDF base64 attachment.
- `backend/Code.gs:2059` -- `sendEmail` function. Will need a sibling endpoint (or extension) that accepts a PDF base64 + HTML body for the EmailModal conversion. A-7 dead `callerEmail` branch cleanup also still pending.
- `docs/email-migration-investigation.md` -- 4-loop investigation from s030. Now retain as historical artifact; the LESSONS entry supersedes its "what to try next" content.
- `docs/email-migration-walkthrough.md` -- Parts 1-7 click-by-click. Now stale (Option A nuke-and-pave path was different from the Parts-1-3 ownership-transfer attempt). Optional cleanup: rewrite to reflect what actually shipped, or archive.
- `CONTEXT/LESSONS.md` line 104 -- new canonical "ownership transfer is a dead end; nuke-and-pave works" entry. Consult before any future Apps Script ownership move.

## Anti-Patterns (Don't Retry)

- Do NOT test email migration by clicking the EmailModal "Email" button. That's `mailto:`, opens the local mail handler, never touches Apps Script. Test via a path that triggers `MailApp.sendEmail` server-side: time-off / offer / swap request submission, or admin schedule edit on a published period.
- Do NOT attempt Apps Script ownership transfer for sender migration. Versioned deployments cannot transfer ownership (Google docs). The "Execute as: Me" panel after transfer is viewer-contextual UI, not the actual binding. If you need a different sender, do Drive Make-a-copy of the source sheet from the target account, force fresh OAuth via editor Run, deploy new.
- Do NOT forget Script Properties when nuke-and-paving. They are project-level and don't copy with the sheet. `HMAC_SECRET` (and any future properties added to `backend/Code.gs`) must be re-added manually on the new script. Copy old value verbatim to preserve sessions, or set fresh value to bounce all sessions to login.
- Do NOT attempt `mailto:` with a PDF attachment. Browser spec doesn't support it; no `mailto:` parameter can attach files. The path forward is backend POST -> MailApp HTML body + base64 PDF blob.
- Do NOT delete the OLD John-bound `/exec` deployment or the original Sheet for ~7 days; staff bookmarks + fallback safety. Carry-forward from s030.
- Do NOT use `git add -A` when committing handoff residue. Stage by name only (`CONTEXT/*` paths). Carry-forward.
- Do NOT skip git hooks (`--no-verify`). Carry-forward.

## Blocked

- A-7 dead `callerEmail` branches in `Code.gs` -- still bundled to land with future Apps Script edit. Cleanup item, not urgent.
- iPad print preview side-by-side -- since 2026-04-26 (s023, carried).
- JR to delete 22 stale PK on Sat May 9 from prior smoke -- since 2026-04-26.
- JR to manually delete `TEST-ADMIN1-SMOKE` from Employees sheet (now on the NEW sheet, since data was copied) -- since 2026-04-25.
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes still need JR phone-smoke -- since 2026-04-25.
- s028 + s029 + s030 commits still need JR phone-smoke (sick parity, Unavailable, meeting reorder, mobile shift-detail role, schedule consolidation, F10 week2 stabilization) -- carried.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14.
- CF Worker SWR cache -- since 2026-04-14.
- Consecutive-days 6+ warning -- since 2026-04-14.
- Payroll aggregator path 1 -- since 2026-04-12.
- Amy ADP rounding rule discovery -- since 2026-04-26.
- Mobile eyebrow visual verify -- needs an employee with `emp.title` populated.

## Key Context

- Sender migration is fully closed: `33afa4b` (URL swap) + `d4c82b1` (canonical memory). Smoke PASS by JR.
- New canonical Apps Script project owns its own deployment lineage; future redeploys from this script will execute as otr without further surgery.
- The EmailModal conversion is the customer-visible improvement -- branded body + PDF attached. JR's actual pain point (the Email button opens his Gmail with nothing useful in it) becomes solvable now that the backend sender is correct.
- Open design question (~2 days old): generate PDF in Apps Script vs accept frontend base64 blob. The frontend already generates PDFs via `src/pdf/generate.js`; sending the rendered base64 to a new backend action is the lower-friction path. Apps-Script-side PDF generation would need full grid re-render server-side -- bigger lift.
- Pricing locked s026: $1,500 implementation + $497/mo + applicable HST; 3-month fitting trial; month-to-month after trial; new features fixed-price; OTR pays all hosting providers directly.
- Sarvi is the scheduling admin and gets all request notifications. Now correctly comes from `otr.scheduler@gmail.com`.
- Push to scheduling-app `main` is hook-gated. JR's `/handoff` invocation authorizes the handoff commit + push per project memory.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- top Active is the EmailModal `mailto:` -> backend POST conversion (PDF auto-attach + branded body), now unblocked.
2. Read `CONTEXT/LESSONS.md` if preferences may affect approach -- entry at line 104 ("Apps Script ownership transfer is a dead end; nuke-and-pave via Drive Make-a-copy works") is now H-confidence + working solution. Consult before any Apps Script ownership work.
3. Check git: `git log --oneline -5` shows `d4c82b1` handoff-residue commit on top of `33afa4b` API swap. Working tree should only carry 2 untracked cursor rules.
4. If picking up EmailModal conversion: read `src/modals/EmailModal.jsx` end-to-end (current `mailto:` flow handles individuals + bulk-send via staggered `setTimeout`); read `backend/Code.gs:2059` (existing `sendEmail` function); read `src/pdf/generate.js` (frontend PDF generation for base64 capture).
5. Open design question to surface to JR: server-side PDF generation in Apps Script vs frontend base64 blob. Recommend the latter (existing PDF pipeline already works; smaller lift).
6. If switching harnesses, read shared `CONTEXT/*` first; AGENTS.md is canonical -- shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `33afa4b` smoke PASS by JR this session (verified). `d4c82b1` is canonical memory writes only, no smoke needed. Prior-session commits (s028 + s029 + s030) still pending JR phone-smoke -- not blocking.
- (b) External gates: none for the active migration (it's done). EmailModal conversion has one open design question (PDF source) but JR can answer it inline.
- (c) Top active TODO: EmailModal `mailto:` -> backend POST conversion. Branded HTML body + PDF auto-attach.

(c) is the natural continuation. Most natural next move: ask JR (1) ready to scope the EmailModal conversion? Recommend frontend-generates-PDF-base64 path (existing pipeline at `src/pdf/generate.js` already works, smallest lift) over Apps-Script-side PDF generation. Plan would cover: new backend action accepting `{to, subject, htmlBody, pdfBase64, pdfFilename}`, branded HTML body template (logo + period header + announcement section), `EmailModal.jsx` rewrite to call `apiCall('sendBrandedEmail', ...)` instead of `mailto:`, batch-send progress UX preserved.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
