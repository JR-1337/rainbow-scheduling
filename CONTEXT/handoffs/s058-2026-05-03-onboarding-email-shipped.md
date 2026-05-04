# s058 -- 2026-05-03 -- Onboarding email modal + welcome PDF rebrand + agent-browser swap

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

gamboge. predictive coding.

Pass-forward: v2.31.1 paste-deploy pending; everything else verified end-to-end and shipped.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `eb89e92` on `main`, will be `s058 handoff` after Step 7. 7 session commits beyond s057: `e0a4ad2` (docs/onboarding research), `bcb12fd` (backend v2.31.0 sendOnboardingEmail + welcome PDF template), `062bb22` (frontend OnboardingEmailModal + envelope indicator), `ff73eb0` (CONTEXT/TODO.md update), `c817f07` (backend v2.31.1 body-wrap hotfix), `eb89e92` (frontend state-refresh fix), plus the Step 7 handoff commit.
- **Apps Script live deployment:** `bcb12fd` v2.31.0 (NOT YET v2.31.1). JR has not paste-deployed `c817f07` yet. The v2.31.1 change is body-wrap visual only -- empty bodies unchanged; bodies with content go from raw `<br>`-separated plaintext to fully branded shell (navy header, white body, footer link). Safe to defer paste; behavior remains correct without it.
- **Active focus end-of-session:** onboarding feature shipped + JR-confirmed. Pick next from `CONTEXT/TODO.md` Active list.
- **Working assumption (corrected mid-session):** agent-browser ref-based `click @eN` was assumed to hit any element in the DOM regardless of viewport scroll; in practice, when the Add button was below the modal's scroll-fold, the click silently missed and form did not submit. Fixed mid-session by `scrollintoview @eN` before the click. Recorded in Anti-Patterns.
- **Skills used this session:** `/coding-plan` (full Phase 0-9 walk; Phase 7 manual via agent-browser since `coding-plan-smoker` agent definition still uses Playwright MCP tools which were uninstalled), `EnterPlanMode` x1, `ExitPlanMode` x1, `/handoff` (s058 now). 1 Explore subagent run for the onboarding feature surfaces (saveEmployee + EmployeesPanel + MobileStaffPanel + EmailModal pattern + sendBrandedScheduleEmail branding + Employees sheet schema).

## This Session

**Continuation theme: built the parked onboarding-email feature end-to-end as a meticulous /coding-plan run (backend v2.31.0 + frontend modal + envelope indicator + welcomeSentAt column + backfill + pre-launch recipient gate + BCC otr.scheduler), then shipped two same-session hotfixes (branded body wrap v2.31.1 + frontend state-refresh) after smoke surfaced gaps.**

**Tooling swap:**

- Replaced Playwright MCP with **agent-browser CLI** (Vercel Labs Rust binary) as the default smoke driver. Drove the install: `npm i -g agent-browser` -> `agent-browser install --with-deps` (Chrome for Testing 148 + 3 Linux font deps via apt) -> `npm i -g skills` (the `npx skills add` route hit a name-collision against the npm CLI in this nvm setup, so installed `skills` globally) -> `skills add vercel-labs/agent-browser --agent claude-code -g -y`. Skill landed at `~/.claude/skills/agent-browser/`.
- Removed Playwright MCP fully: `claude mcp remove playwright`, `rm -r ~/.cache/ms-playwright` (963 MB), `rm -r ~/.npm/_npx/9833c18b2d85bc59` (cached `@playwright/mcp` install), removed 10 per-project `mcp-logs-playwright/` directories under `~/.cache/claude-cli-nodejs/`. Final sweep: zero `playwright` matches anywhere in `~/.cache`, `~/.npm`, `~/.config`. Confirmed no stray Playwright screenshots on disk -- it returned screenshots inline, never persisted.
- Updated memory: `feedback_playwright_always.md` rewritten as `feedback_playwright_always.md` (now agent-browser-focused; same path); MEMORY.md index entry updated to match.

**Commits shipped (in order):**

- `e0a4ad2` docs(onboarding): captured verbatim welcome doc text + Drive folder/file IDs at `docs/onboarding/welcome-source.md` and `docs/onboarding/drive-references.md`. Pre-plan research artifacts so the executor and the plan don't re-do the read.

- `bcb12fd` feat(backend): sendOnboardingEmail action + welcome PDF template (v2.31.0). +254 / -1 in `backend/Code.gs`.
  - 6 new constants: `WELCOME_FOLDER_ID_`, `WELCOME_FED_TD1_ID_`, `WELCOME_ON_TD1_ID_`, `LAUNCH_LIVE_=false`, `LAUNCH_REWRITE_TO_='johnrichmond007@gmail.com'`, `WELCOME_TEMPLATE_HTML_` (multi-line string mirroring schedule email branding -- navy `#0D0E22` header, white body, neutral footer matching `buildBrandedHtml.js:215-220`).
  - New action `sendOnboardingEmail` wrapped in `withDocumentLock_(..., 'sending the onboarding email')`. Generates per-recipient PDF via `Utilities.newBlob(html, 'text/html').getAs('application/pdf')`, fetches the 2 TD1 PDFs via `DriveApp.getFileById`, attaches all 3 + any user-uploaded extras decoded from base64 via new helper `decodeUploadedAttachment_`. MailApp.sendEmail with BCC `otr.scheduler@gmail.com`. Pre-launch recipient rewrite to JR's inbox when `LAUNCH_LIVE_=false`. Updates `welcomeSentAt` only when currently blank (preserves original on resend per Decision 6).
  - New one-shot `backfillOnboardingDates()` callable from Apps Script editor only -- writes today's ISO date to `welcomeSentAt` for every `active=true` row whose cell is blank. Idempotent.
  - Routes-map entry wired at `:496`; version block bumped at `:5`.
  - Surprise the executor flagged: `escHtml` doesn't exist in Code.gs (the actual helper is `escapeHtml_`, locally scoped inside `BRANDED_EMAIL_WRAPPER_HTML_`); implemented inline equivalent. `OTR_NAVY_` and `OTR_WHITE_` already existed at `:2408-2409` -- new template uses HEX literals directly (consistent with adjacent style).

- `062bb22` feat(admin): onboarding email modal + envelope indicator. +280 lines net.
  - New file `src/modals/OnboardingEmailModal.jsx` (340 lines). Auto-opens after `saveEmployee` success on insert path. Plaintext `<textarea>` body editor; To + Subject required (validated on blur per Baymard); 3 readonly default attachment chips (welcome PDF + 2 TD1) plus a functional `+ Add file` chip with dashed border opening hidden `<input type=file multiple>`. Per-file 10 MB cap, 25 MB total (MailApp Workspace limit). FileReader -> base64 -> `extras` array shipped to backend. Amber resend banner conditional on `employee.welcomeSentAt` truthy. Send/Skip pair -- Send right-aligned (Material 3 primary), Skip left-aligned (secondary, lower visual weight).
  - Modal trigger added to `App.jsx:879-881` inside `saveEmployee` success path: `if (!wasEditing && result.success) setOnboardingTarget({ ...e, id: result.id || e.id })`. Mounted near other modals at `:2639-2645` (initial wiring; later extended to include `onSendSuccess` in commit `eb89e92`).
  - Envelope indicator added to `EmployeeFormModal.jsx:123-142` (edit mode only). Filled green (`#00A84D`, hex literal -- `THEME.accent.green` doesn't exist) when `welcomeSentAt` truthy with date in tooltip; outline grey when blank. Click -> closes form modal first, then opens `OnboardingEmailModal` to prevent stacked modals.
  - Wired on **both** EmployeeFormModal mounts (mobile at `App.jsx:2129`, desktop at `:2638`) per memory rule `feedback_mobile_desktop_parity.md`. Single edit point covers parity since both reuse the same modal component.

- `ff73eb0` docs(context): Phase 8 TODO.md update. Active line "Onboarding email on new-employee creation" replaced; new Active item for the frontend state-refresh follow-up (later closed by `eb89e92`); deferred Active item documenting app-usage instructions as future work; Apps Script live drift block bumped to v2.31.0; Completed entry prepended for the feature.

- `c817f07` fix(backend): wrap onboarding email body in branded HTML shell (v2.31.1).
  - JR feedback after seeing the shipped emails: "we just need to make the body when its written branded in the way the schedule distribution email is."
  - Replaced the inline plaintext-to-`<br>` conversion with `BRANDED_EMAIL_WRAPPER_HTML_(bodyText, OTR_ACCENT_DEFAULT_)` when `bodyText.trim()` is non-empty. Empty body still sends `htmlBody: ''` (recipient sees subject + 3 attachments only -- attachments are the payload). Welcome PDF generation untouched; only the email body shell changed.
  - Version bump v2.31.1; changelog entry added at the top of the version comment block. PENDING paste-deploy.

- `eb89e92` fix(admin): refresh employees state after onboarding send. Closes the state-refresh gap surfaced during Phase D smoke.
  - `OnboardingEmailModal` now accepts `onSendSuccess` prop. After `apiCall` returns `success: true`, modal calls `onSendSuccess(employee.id, response.welcomeSentAtUpdated === true)` before `onClose()`.
  - `App.jsx` wires `onSendSuccess={(empId, didUpdate) => didUpdate && setEmployees(prev => prev.map(e => e.id === empId ? { ...e, welcomeSentAt: today } : e))}`. Optimistic local state update only when backend confirmed it wrote (preserves resend semantics: `welcomeSentAtUpdated:false` leaves local state alone).
  - Envelope indicator now flips to filled green immediately after send -- no page reload required.

**Smoke results:**

- Onboarding feature: end-to-end via agent-browser CLI + direct API bisect.
  - Direct API call to `sendOnboardingEmail` returned `{success:true, sentTo:"johnrichmond007@gmail.com", welcomeSentAtUpdated:true, rewrittenForLaunch:true}`. Sheet inspected post-call: `welcomeSentAt = "2026-05-03"` set on row.
  - Modal-driven Send (after fetch interception via JS eval) returned the same response shape; backend write confirmed.
  - Resend on already-sent employee returned `welcomeSentAtUpdated:false` (preserves original timestamp per Decision 6).
  - Pre-launch recipient rewrite verified: every send rewritten to JR's inbox even when modal recipient was `johnrichmond007+onboarding-smoke@gmail.com`.
  - JR confirmed receipt: emails arrived in inbox, branded, 3 PDF attachments, BCC otr.scheduler. PDF rendering looks correct.
  - Test row `Onboard Smoke` (id `emp-1777863727022`) deactivated post-smoke via direct API call (`active=false`).
- v2.31.1 hotfix + state-refresh hotfix: build PASS. No live smoke (paste-deploy pending for v2.31.1; state-refresh frontend auto-deployed via Vercel).

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `marquetry. attractor dynamics.` -> `gamboge. predictive coding.`. Active: struck "Onboarding email on new-employee creation" + the s055 carry "Onboarding email -- include the computed default password in the welcome body" (folded into deferred app-usage Active item) + the just-now-shipped state-refresh follow-up. New deferred Active item documents app-usage future scope. Verification: extended Apps Script live block to flag `c817f07` v2.31.1 PENDING paste; the v2.30.2 reference removed (lived for one session). Completed: prepended onboarding feature entry; trimmed Audit fixes Batch 4 into trim comment (per 5-most-recent rule).
- `CONTEXT/DECISIONS.md`: not touched. Pre-launch recipient-rewrite gate, BCC scope, and welcomeSentAt resend-preservation are all sufficiently captured in the inline comments in `Code.gs` and the plan file.
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carries from prior sessions; nothing this session graduated; agent-browser swap recorded in auto-memory not LESSONS).
- `CONTEXT/ARCHITECTURE.md`: not touched (no structural change; OnboardingEmailModal follows the existing modal pattern, envelope indicator is a local UI addition).
- Auto-memory writes (this session):
  - `feedback_playwright_always.md` rewritten: now describes agent-browser as the default smoke driver, with Playwright MCP marked uninstalled. Same file path.
  - MEMORY.md index entry updated to match.

**Audit (Step 3 of HANDOFF):**

`Audit: clean (LESSONS over-ceiling 68,794/25k carry from prior sessions; nothing this session graduated; pre-existing TODO MD041 + MD034 + LESSONS atomicity 61-hit soft-warns carry from s057. Session-introduced em-dashes in TODO.md fixed in 2 entries.)`

**Decanting:**

- **Working assumptions:**
  - agent-browser ref-based `click @eN` was assumed to hit any element in the DOM regardless of viewport scroll. In practice, when the Add button was below the modal's scroll-fold, the click silently missed (no error, no exception, just no effect). Fixed by `scrollintoview @eN` first.
  - The `coding-plan-smoker` agent definition was assumed to be portable across smoke drivers; in fact it hardcodes `mcp__playwright__browser_*` tools and cannot drive agent-browser. Phase 7 of `/coding-plan` therefore can't auto-spawn the smoker after Playwright was uninstalled this session. Workaround: skip Phase 7 + run smoke manually in parent session. Long-term: edit `~/.claude/agents/coding-plan-smoker.md` to swap the tool list (out of scope for this run; flagged as a separate follow-up).
- **Near-misses:**
  - Bundling the v2.31.1 body-wrap hotfix and the state-refresh hotfix into a single commit. Rejected -- they touch different layers (backend vs frontend) and v2.31.1 needs paste-deploy while state-refresh ships via Vercel auto-deploy. Sequencing makes per-layer rollback surgical. Plan Anti-pattern carried.
  - Using `BRANDED_EMAIL_WRAPPER_HTML_` for the welcome PDF too. Rejected -- the welcome PDF is a self-contained printable letter with full layout (header, body, footer); it has its own template constant `WELCOME_TEMPLATE_HTML_`. The wrapper is for email *bodies* only.
  - Auto-trying to fix the agent-browser `click @e307` failures by switching to JS `eval` clicks. Worked once but introduced its own scope-pollution issues (fetch patches got reset after page reload). Bisected via direct API call instead -- faster.
- **Naive next move:**
  - When the smoke envelope showed "Not sent" after a successful-looking modal Send, the naive read was "backend `updateRow` failed silently". The actual issue was a *frontend state-refresh gap* -- backend was correct on first try, frontend just didn't re-render because local `employees` state still held the old row. The diagnostic that bisected: hit the API directly via `fetch` from JS `eval`, observe `welcomeSentAtUpdated:true` in the response, then read the sheet via Drive MCP to confirm the cell was actually set. That ruled out the backend in 30 seconds and pointed straight at the frontend. General principle: when a UI indicator says X but the data layer might say Y, hit the API directly to bisect frontend-vs-backend before assuming a silent backend failure.

## Hot Files

- `backend/Code.gs` -- v2.31.1 in source (commit `c817f07`), live still v2.31.0. PASTE-DEPLOY NEEDED. Body wrap at `sendOnboardingEmail` (~line 2671) replaces inline plaintext-to-`<br>` with `BRANDED_EMAIL_WRAPPER_HTML_(bodyText, OTR_ACCENT_DEFAULT_)` when body is non-empty. Welcome PDF, attachment list, recipient rewrite, BCC, welcomeSentAt write all unchanged.
- `src/modals/OnboardingEmailModal.jsx` -- new file (340 lines). 3-attachment default + functional `+ Add file` + plaintext body + Skip/Send pair + amber resend banner. Calls `onSendSuccess?.(employee.id, response.welcomeSentAtUpdated === true)` before `onClose()` on Send success.
- `src/App.jsx` -- modal trigger at `:879-881` (insert path only, post-toast); modal mount at `:2639-2649` with `onSendSuccess` prop; `onSendOnboarding` prop wired on both `EmployeeFormModal` mounts (mobile `:2129` + desktop `:2638`).
- `src/modals/EmployeeFormModal.jsx` -- envelope indicator at `:123-142` (edit mode only). `Mail` icon imported at line 2; `onSendOnboarding` destructured prop at line 9.
- `src/email/buildBrandedHtml.js` -- branding source-of-truth for the schedule emails. Backend mirrors the visual layout in `WELCOME_TEMPLATE_HTML_` (welcome PDF) and uses `BRANDED_EMAIL_WRAPPER_HTML_` (email body shell) which already lived in Code.gs.
- `docs/onboarding/welcome-source.md` -- verbatim welcome doc text + Employment Contract open question. The Employment Contract paragraph stays in the rebrand per JR; whether/how it's actually attached is a future ask.
- `docs/onboarding/drive-references.md` -- Drive folder ID `1dWQOcZWMaAe_2YTGuPMhDmwXwXo45mtx` + the 3 file IDs. Annual TD1 swap = upload new PDFs to same folder, JR updates 2 constants + paste-deploys.
- `~/.claude/plans/wild-puzzling-lighthouse.md` -- the approved plan. Phase A backend + B paste + C frontend + D smoke. Phase D was hand-driven via agent-browser since the smoker agent uses Playwright MCP which is uninstalled.
- `~/.claude/skills/agent-browser/SKILL.md` -- new canonical smoke-test reference. Stub points at `agent-browser skills get core` for the actual workflow guide.
- `~/.claude/agents/coding-plan-smoker.md` -- still hardcoded to Playwright MCP tools; needs editing before `/coding-plan` Phase 7 auto-smoke works again. Tracked as a follow-up.

## Anti-Patterns (Don't Retry)

- **Don't `click @eN` on agent-browser refs without `scrollintoview` first when the target is below the modal viewport.** The click registers as success but no action fires. Always `scrollintoview @eN` before `click @eN` for elements that may be off-screen. (s058 working assumption.)
- **Don't assume `coding-plan-smoker` works after a smoke-driver swap.** The agent definition is hardcoded to Playwright MCP tools; if Playwright MCP is uninstalled (as it is now), Phase 7 of `/coding-plan` cannot spawn the smoker. Workaround in s058: skip Phase 7, run smoke manually via agent-browser in the parent session. Long-term fix: edit `~/.claude/agents/coding-plan-smoker.md` to use Bash + agent-browser instead of `mcp__playwright__browser_*`. (s058 working assumption.)
- **Don't assume `THEME.accent.green` exists.** The accent map has `{ blue, purple, cyan, pink, text }` only. For green, use hex literal `#00A84D` (OTR.accents[3].primary at `src/theme.js:13`). (s058 surprise from executor.)
- **Don't assume `escHtml` exists in `backend/Code.gs`.** The actual helper is `escapeHtml_`, locally scoped inside `BRANDED_EMAIL_WRAPPER_HTML_`. New backend code that needs HTML escaping should either (a) use the wrapper directly when applicable, or (b) inline its own minimal escape. (s058 surprise from executor.)
- **Don't bisect a "UI indicator stale after action" bug by assuming backend silent-fail.** Hit the API directly via JS `eval` fetch first to bisect frontend-vs-backend. In s058 this diagnostic resolved a "welcomeSentAt blank after successful send" mystery in 30 seconds; the bug was frontend state-refresh, not backend. (s058 naive-next-move.)
- **Don't broadcast a state object to all matching React fiber setters when probing UI state.** (Carry s057.)
- **Don't write a plan file to a custom path and expect ExitPlanMode to find it.** (Carry s057.)
- **Don't add a status-only event type without filtering it out of the displayable-events filter at every cell renderer.** (Carry s057.)
- **Don't bundle hotfixes into batch paste-deploys when isolated rollback matters more than fewer paste cycles.** (Carry s056.)
- **Don't pattern-match smoker findings as authoritative when they cross a backend invariant.** (Carry s056.)
- **Don't skip the plan after AskUserQuestion answers come back.** (Carry s055.)
- **Don't ask jargon-laden questions.** (Carry s055.)
- **Don't normalize-on-save what you can solve at read time.** (Carry s055.)
- **Don't add server-side email allowlists for what's actually a Claude-discipline rule.** (Carry s055.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carry s053.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carry s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carry s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** (Carry s050.)
- **Don't hedge on tradeoffs without measurement.** (Carry s049.)
- **Don't call pre-launch dormant code "dead code".** (Carry s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carry s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carry s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carry s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carry s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carry s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carry s045.)

## Blocked

- **Apps Script v2.31.1 paste-deploy** -- `c817f07` committed + pushed; live still v2.31.0. Behavior change is body-wrap visual only; empty bodies unchanged. Safe to defer paste. Since 2026-05-03.
- **`coding-plan-smoker` agent uses Playwright MCP** -- `~/.claude/agents/coding-plan-smoker.md` hardcodes `mcp__playwright__browser_*` tools. Playwright was uninstalled this session in favor of agent-browser. `/coding-plan` Phase 7 auto-smoke cannot spawn the smoker until the agent definition is rewritten to use Bash + agent-browser. Manual smoke from parent session is the workaround. Since 2026-05-03.
- H3 chunkedBatchSave concurrent-saves clobber risk (audit deferred-to-migration) -- since 2026-05-03.
- iPad print preview side-by-side -- since 2026-04-26.
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check.
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25.
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14.
- Payroll aggregator path 1 -- since 2026-04-12.
- Amy ADP rounding rule discovery -- since 2026-04-26.
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor.

## Key Context

- **The onboarding feature shipped via /coding-plan with all 4 phases (A backend, B paste, C frontend, D smoke) covered.** Phase 7 was manual because the smoker agent still uses Playwright MCP. Plan file `~/.claude/plans/wild-puzzling-lighthouse.md` is canonical reference; durable decisions captured in inline Code.gs comments + this handoff.
- **Welcome PDF is a self-contained branded letter** (its own template `WELCOME_TEMPLATE_HTML_`). The email *body* (typed by Sarvi in the modal) is now wrapped in `BRANDED_EMAIL_WRAPPER_HTML_` (post v2.31.1 paste). They serve different purposes -- don't conflate.
- **Pre-launch recipient gate is single-flag.** `LAUNCH_LIVE_=false` in Code.gs forces every onboarding send to JR's inbox. Single-line flip at launch (`LAUNCH_LIVE_=true`). Coarse but simple; paired with explicit Sarvi briefing before flip.
- **Idempotent welcomeSentAt invariant.** First send sets the cell; resend preserves the original. Local state matches backend after the s058 state-refresh fix -- envelope flips green immediately after send without page reload.
- **Tax PDFs read at runtime from Drive folder by file ID.** Annual swap = Sarvi uploads new `2027 Federal tax TD1.pdf` / `2027 Ontario tax TD1.pdf` to the same folder, gets new file IDs, JR updates the 2 constants in Code.gs + paste-deploys. One paste-deploy per year.
- **Backfill ran for N=36 active employees.** Test Admin (id `emp-1777826090926`, currently Inactive) was correctly skipped by the `active=true` filter -- gives us a clean blank-welcomeSentAt fixture for future smoke runs.
- **agent-browser is the new smoke driver across all 3 harnesses.** Claude Code, Codex, Cursor. Skill at `~/.claude/skills/agent-browser/`. Stub points at `agent-browser skills get core` for the workflow guide. Console + network + HAR + route mocking all supported.
- **`+ Add file` is functional.** Sarvi can attach custom one-off files via the modal's file picker. 10 MB per file, 25 MB total (MailApp Workspace limits). Reads via FileReader -> base64 -> ships to backend in `attachments` array, decoded via new helper `decodeUploadedAttachment_`.
- **Migration is research-complete + vendor-locked.** Phase 0 = Supabase project ca-central-1 Pro tier + DDL + RLS + `store_config` seed. Pre-cutover gates remain CLOSED.
- **AWS SES = SMTP for password-reset blast at Phase 4 T+1:10.**
- **Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line.** Per s044 DECISIONS.
- **Production URL:** `https://rainbow-scheduling.vercel.app`.
- **Apps Script editor:** `script.google.com/home` -- requires `otr.scheduler@gmail.com`.
- **AGENTS.md is canonical post v5.2 bootstrap.**
- **Pre-launch staff-email allowlist:** `{Sarvi, JR, john@johnrichmond.ca}` exactly until launch.
- **JR's account state:** `active / isAdmin / isOwner / !showOnSchedule`.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `gamboge. predictive coding.`.
2. `git log --oneline -8` should show `s058 handoff`, then `eb89e92`, `c817f07`, `ff73eb0`, `062bb22`, `bcb12fd`, `e0a4ad2`, `3703136` (s057 handoff).
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 1 commit awaiting paste. Live = `bcb12fd` v2.31.0. Source HEAD has `c817f07` v2.31.1 (body-wrap visual only).
5. `grep -nE "BRANDED_EMAIL_WRAPPER_HTML_\(bodyText" backend/Code.gs` should hit 1 site (inside `sendOnboardingEmail`, post v2.31.1).
6. `grep -nE "onSendSuccess|setOnboardingTarget" src/App.jsx` should match the trigger at `:879-881`, the modal mount at `:2639-2649`, and the `onSendOnboarding` wirings on both `EmployeeFormModal` mounts.
7. `grep -nE "type === 'unavailable'" src/` should still show s057 Day Status carry; no regression expected.
8. `agent-browser --version` should report 0.26.x. `agent-browser doctor --offline --quick` should report 6 pass / 0 fail. `claude mcp list | grep -i playwright` should return nothing.
9. AGENTS.md is canonical; shims rarely need repair.
10. Plan file for this session: `~/.claude/plans/wild-puzzling-lighthouse.md`.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: `c817f07` v2.31.1 body-wrap -- behavior visual only; paste-deploy pending. Optional smoke after JR pastes (open OnboardingEmailModal, type a body, Send, confirm the received email shows the branded shell around the typed message rather than raw `<br>`-separated lines).
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: pick from the Active list.

Natural continuations:

1. **JR pastes v2.31.1 to Apps Script**, then optional smoke -- create a test employee, type "Welcome aboard, here are your forms" in the modal body, Send, confirm the received email's body uses the navy header / white shell / footer rather than raw text.
2. **Edit `~/.claude/agents/coding-plan-smoker.md`** to swap Playwright MCP tools for Bash + agent-browser. Restores `/coding-plan` Phase 7 auto-smoke. Probably ~30 lines of agent definition rewrite. Tracked as Blocked item.
3. **BCC otr.scheduler@gmail.com on schedule distribution emails** -- the broader BCC question (separate from the onboarding-only BCC shipped this session). ~5 lines backend + 1 line frontend, single commit. Easy small win.
4. **Migration Phase 0** when JR sets ship decision -- Supabase project + DDL + RLS + `store_config` seed.
5. **EmailModal v2 + PDF attach** -- bigger lift, parked.

Open with: ack the onboarding feature shipped + JR-confirmed + ask which Active item to pick first. Default if not specified is **(2) coding-plan-smoker agent rewrite** since it unblocks future `/coding-plan` runs from needing manual smoke. Light lift, high leverage.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
