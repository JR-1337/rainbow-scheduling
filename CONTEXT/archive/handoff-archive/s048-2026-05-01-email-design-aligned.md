# s048 -- 2026-05-01 -- Email design system aligned across all surfaces

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

sfumato. neutralino.

Pass-forward: 3 backend email commits drift on live; await JR paste-deploy in Apps Script.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `c155ed4` on `main` synced with origin pre-handoff (+5 commits this session: `1dfa218` disclaimer, `2f42623` banner + framing, `306bd6f` notification wrapper align, `3b5c02a` stale-request err, `c155ed4` askType+CTA). Working tree dirty before this handoff write with handoff-residue paths only (TODO + DECISIONS + decisions-archive + carried s044 deletion).
- **Apps Script live deployment:** drifts from repo for 3 backend commits (`306bd6f`, `3b5c02a`, `c155ed4`). Frontend (`1dfa218`, `2f42623`) already deployed via Vercel auto-deploy; Sarvi reviewed + approved live.
- **Active focus end-of-session:** email subsystem design overhaul; next iteration is body-copy tweaks per email, gated on paste-deploy landing first.
- **Skills used this session:** `/coding-plan` (1dfa218 disclaimer), `/handoff` (s048 now). Direct edits for 2f42623 / 306bd6f / 3b5c02a / c155ed4 (single-file UI / wrapper changes, not plan-mode candidates).

## This Session

**Continuation theme: email subsystem from disclaimer to fully-aligned design system.**

**Design discussion -- schedule distribution emails:**

- Mapped existing email surface (Group + Individual modes, HTML + plaintext mirrors). 1 schedule-distribution path through frontend `buildBrandedHtml.js`; 19 notification emails through backend `BRANDED_EMAIL_WRAPPER_HTML_`.
- JR-locked: static policy disclaimer (not Settings-driven), disclaimer fine-print styling (not policy block), single source of truth `src/email/policyDisclaimer.js`. Sick-day notification routing: email Sarvi + BCC otr.scheduler (replaces Gellert CC).
- Banner redesign: replaced single-line "RAINBOW" with in-app two-line "OVER THE / RAINBOW" wordmark (CSS, Arial fallback because email clients strip Josefin Sans). Centered, 32/28 padding.
- Schedule-table framing: empty navy bars above + below the table (no column headers -- table self-evident).
- Sarvi reviewed + approved both modes via Playwright preview (Group + Individual on Wk 19+20 May 4-17 where Sarvi has 37.3h scheduled).

**Design discussion -- notification emails (Sarvi's 5):**

- Tightened subjects + leading emoji: `📝 Schedule edited by ${callerName}` / `🌴 Time-off request: ${employee}, ${dateRange}` / `❌ Time-off cancelled: ${employee}` / `🤝 Approve shift transfer: ${offerer} -> ${recipient}` / `🔁 Approve swap: ${initiator} ⇄ ${partner}`.
- `askType` label at top of body (bold accent uppercase): "Schedule change" / "Time-off request" / "Time-off cancelled" / "Shift transfer -- needs approval" / "Shift swap -- needs approval".
- "Open in App" CTA button at bottom (links to `https://rainbow-scheduling.vercel.app`). Dropped redundant "Please review" tail.
- 14 staff lifecycle emails intentionally untouched (pre-launch staff-email allowlist; staff are off-limits until launch).
- Wrapper signature extended to accept `opts = { askType, ctaText, ctaUrl }`; backwards-compatible (old call sites continue to render unchanged).

**Stale-request error fix shipped:**

- `approveTimeOffRequest` and `denyTimeOffRequest` now return state-specific INVALID_STATUS messages: cancelled / approved / denied / other. Sarvi sees "This request has been cancelled by the employee." instead of generic "Request is not pending" if the employee cancelled before she clicks Approve from an older email.

**Commits shipped (5):**

- `1dfa218` -- feat(email): static policy disclaimer at bottom of schedule emails (frontend, /coding-plan executor + smoker)
- `2f42623` -- feat(email): OTR wordmark banner + framing rules around schedule (frontend, direct edit)
- `306bd6f` -- feat(email): align notification wrapper banner with schedule email (backend, awaits paste)
- `3b5c02a` -- fix(timeoff): specific error messages when approve/deny finds stale request (backend, awaits paste)
- `c155ed4` -- feat(notifications): tighten subjects + askType label + CTA on Sarvi's 5 emails (backend, awaits paste)

**Memory writes:**

- `feedback_no_staff_emails_pre_launch.md` (NEW): until app launches, only {Sarvi, JR} may receive any email from the app; warn JR before any smoke that triggers a real send; allowlist is exactly two addresses, no exceptions including admin2/admin1 other than Sarvi, FT/PT staff, test accounts. Retires at launch.
- `feedback_prelaunch_dormant_code.md` (NEW): pre-launch dormant code is not dead code; many paths look unused (multi-admin1 emails, onboarding, migration cutover) but are load-bearing post-launch; never propose deletion.
- `CONTEXT/TODO.md`: anchor `kintsugi predictive coding` -> `sfumato. neutralino.`. Added 2 Completed entries (1dfa218 disclaimer, 2f42623 banner+framing). Added 2 Active items (Onboarding email on new-employee creation; BCC otr.scheduler on schedule distribution emails). Added Verification flag for Apps Script paste-deploy drift.
- `CONTEXT/DECISIONS.md`: prepended s048 entry covering email design system; deep-cut 8 oldest entries to `decisions-archive.md` (26,213 -> 12,694 chars).
- `CONTEXT/LESSONS.md`: untouched (over ceiling 68,794 / 25k carried; no new lesson this session).
- `CONTEXT/ARCHITECTURE.md`: untouched (wrapper signature extension is small; no structural change worth noting).

**Smokes:**

- `1dfa218` disclaimer: `/coding-plan` smoker subagent ran prod smoke; "Sent to 1 person" confirmed for both Group + Individual; 0 console errors. Code structure verified statically (Gmail-inbox visual rendering not Playwright-reachable due to OAuth).
- `2f42623` banner + framing: Playwright driven manually in main session; Group + Individual sends to Sarvi only on Wk 19+20 (where Sarvi has 37.3h shifts); both "Sent to 1 person", 0 console errors. Sarvi reviewed and approved.
- `306bd6f` + `3b5c02a` + `c155ed4`: not smoke-tested live (Apps Script live drifts from repo until paste-deploy). Code structure verified.

**Decanting:**

- **Working assumptions:** pre-launch staff-email allowlist rule shapes ALL future email decisions and is captured in 2 new memory writes. Email-safe HTML constraints carry from frontend wrapper to backend wrapper.
- **Near-misses:** considered scope-extending askType+CTA to all 19 notification emails (rejected to honor JR's "Sarvi's 5" scope). Considered deleting `sendScheduleChangeNotification_` as dead code (JR corrected re: future admin1s).
- **Naive next move:** "while we're tweaking the wrapper let's also tweak the 14 staff lifecycle emails." Wrong now: staff are off-limits to email pre-launch; JR's scope was Sarvi's 5 only. Wrapper supports it (opts are optional everywhere) but JR will scope explicitly when ready.

**Audit (Step 3):**

- Schema-level: clean. TODO + DECISIONS + ARCHITECTURE + LESSONS schema headers present. TODO required sections (Active, Blocked, Verification, Completed) all present.
- Char ceilings: TODO 24,343 / 25k OK; DECISIONS 26,213 -> deep-cut to 12,694 / 25k OK (8 entries graduated to archive); LESSONS 68,794 / 25k STILL OVER (carried, no new write); ARCHITECTURE 9,615 OK.
- Style soft-warns carried: TODO MD041/MD034; DECISIONS MD041/MD012/MD032; archive MD041/MD032. No new drift.
- Adapter files: not modified.

`Audit: clean (DECISIONS deep-cut: 8 entries graduated to archive 26,213 -> 12,694 chars; LESSONS 68,794/25k carried; MD041 + MD012 + MD032 + MD034 style soft-warns carried)`

## Hot Files

- `backend/Code.gs` -- 3 sites changed s048, all awaiting paste-deploy:
  - `BRANDED_EMAIL_WRAPPER_HTML_` signature extended (`content, accentHex, opts`) at ~L2096 + new `APP_URL_` constant at ~L2095 + askType/CTA injection logic.
  - `sendEmail` opts forward (`askType`, `ctaText`, `ctaUrl`) at ~L2126.
  - `approveTimeOffRequest` (~L1007) + `denyTimeOffRequest` (~L1032) status-aware error messages.
  - 5 Sarvi-bound senders (`sendScheduleChangeNotification_`, `sendTimeOffSubmittedEmail`, `sendTimeOffCancelledEmail`, `sendOfferAcceptedEmail`, `sendSwapAcceptedEmail`) at ~L2189-2295 with new subjects + askType + CTA.
- `src/email/policyDisclaimer.js` (NEW) -- single source of truth for the policy text. `POLICY_DISCLAIMER_TEXT` (plaintext) + `POLICY_DISCLAIMER_HTML` (HTML block). Edit here only; the 3 importing files pull from this.
- `src/email/buildBrandedHtml.js` -- frontend wrapper for schedule distribution. Banner (line ~187), framing rules (line ~132 + ~136), disclaimer slot (line ~207), group plaintext stub (line ~86). Mirrors backend wrapper banner styling but with period subtitle vs "OTR Scheduling".
- `src/email/build.js` -- individual-mode plaintext builder. Imports `POLICY_DISCLAIMER_TEXT`; appends before "Over the Rainbow" sign-off (line ~80).
- `src/modals/EmailModal.jsx` -- group/individual mode UI; recipient picker filters at line 12-14; invokes `sendBrandedScheduleEmail` action at line 57. **No bcc field passed yet** -- TODO when JR is at desk.

## Anti-Patterns (Don't Retry)

- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist is exactly {Sarvi, JR}. Any smoke or test that triggers a real send must allowlist exactly those two -- if not possible, mock or stop. Never send to admin2/admin1-other-than-Sarvi, FT/PT staff, or test accounts with real emails. Memory rule `feedback_no_staff_emails_pre_launch.md`. Retires at launch. (s048 origin.)
- **Don't call pre-launch dormant code "dead code".** App is pre-launch; many paths look unused (multi-admin1 emails, onboarding, migration cutover, etc.) but are load-bearing post-launch. Never propose deletion. Memory rule `feedback_prelaunch_dormant_code.md`. (s048 origin: I called `sendScheduleChangeNotification_` dead because today only Sarvi is admin1; JR corrected re: future admin1s.)
- **Don't extend askType + CTA to all 14 staff lifecycle emails as bundled scope creep.** Wrapper supports it (opts optional everywhere) but the 14 staff emails were intentionally left untouched s048. JR will scope explicitly when ready. (s048 near-miss + naive-next-move.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold** (carried s047). Sarvi schedules part-timers above 24h regularly; rule retired by JR direction.
- **Don't extend CacheService to login / getEmployees / other reads without measurement** (carried s046). Cache HIT verified s047 on `getAllData` only -- 7s -> 2.8s.
- **Don't paste-then-deploy Apps Script changes silently** (carried s045). Surface the redeploy step explicitly when `backend/Code.gs` is touched.
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app** (carried s046).
- **Don't add a new column to the Employees / Shifts / Settings / Announcements / ShiftChanges sheet without a deploy + manual-header-write checklist** (carried s046).
- **Don't iterate `Object.values(events)` to summarize events for display** (carried s045). Filter through active employees first.
- **Don't shrink the desktop schedule name column below 160px** (carried s045).

## Blocked

- **Apps Script paste-deploy** -- 3 backend commits (`306bd6f`, `3b5c02a`, `c155ed4`) drift on live. JR pastes Code.gs at desk: open `backend/Code.gs` from repo, copy entire file, paste over Code.gs in script.google.com under `otr.scheduler@gmail.com`, Deploy -> Manage Deployments -> Edit (pencil) -> Version: New version -> Deploy.
- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- CF Worker cache -- retired (DECISIONS s046 supersedes; pre-migration bridge = Apps Script CacheService, verified s047)
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. Bridge cache `Code.gs` ~L429-526 verified s047 (7s -> 2.8s); retires at migration cutover.
- AGENTS.md is canonical post v5.2 bootstrap.
- **Pre-launch staff-email allowlist:** exactly {Sarvi, JR} until launch. Memory: `feedback_no_staff_emails_pre_launch.md`.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `sfumato. neutralino.`. Top Active items: migration research-complete + AWS SES Phase 1 setup + 2 new TODOs (Onboarding email, BCC otr.scheduler).
2. `git log --oneline -7` should show this s048 handoff commit on top of `c155ed4`, `3b5c02a`, `306bd6f`, `2f42623`, `1dfa218`, `002fe90` (s047 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. `grep -n "function BRANDED_EMAIL_WRAPPER_HTML_" backend/Code.gs` should match the new 3-param signature `(content, accentHex, opts)`.
5. `grep -n "APP_URL_" backend/Code.gs` should return at least 6 hits (constant declaration + 5 sender call sites).
6. `ls src/email/policyDisclaimer.js` exists with both exports.
7. **Apps Script live drift check:** the live deployment still has the old 2-param wrapper signature. Live emails render with old single-line "RAINBOW" banner and lack askType + CTA on Sarvi's 5. Verify by sending a test notification AFTER paste-deploy (NB: pre-launch allowlist applies -- only Sarvi or JR in To: field).
8. testguy account state likely unchanged from s047 (no testguy flips this session).
9. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 3 backend commits drift on live until JR pastes Code.gs. Highest-priority next task; pure mechanical action.
- (b) External gates: AWS SES Phase 0 prep still actionable (sandbox -> prod takes 24-48h). Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **JR pastes Code.gs.** Open `backend/Code.gs` from repo -> copy whole file -> script.google.com (otr.scheduler@gmail.com) -> paste over -> Deploy -> Manage Deployments -> Edit (pencil) -> Version: New version -> Deploy. After deploy, the 19 notification emails align to the new banner and Sarvi's 5 carry askType + CTA + emojis.
2. **Notification email body tweaks (post-paste).** Subjects locked s048; bodies open for iteration once Sarvi sees the new format on her next real notification.
3. **JR sets Phase 0 migration ship window.** All pre-conditions closed.
4. **EmailModal v2 PDF attachment.** ~2-3hr feature.
5. **AWS SES account setup.** Pre-stage Phase 1.
6. **BCC otr.scheduler@gmail.com on schedule distribution emails.** Small (~5 lines backend + 1 line frontend, single commit). Frontend `EmailModal.jsx:57` passes `{to, subject, htmlBody, plaintextBody}`; backend `Code.gs:2156` calls MailApp.sendEmail with no bcc. Add bcc, forward through.
7. **Onboarding email on new-employee creation.** Trigger lives in saveEmployee insert path.

Open with: ask JR which to pick up; default if not specified is (1) the paste-deploy.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
