<!-- SCHEMA: handoff
Version: 1
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time via atomic rename (write .tmp then mv).
             Retention governed by HANDOFF.md / HANDOFF-LOOP.md Step 6.

Rules:
- Filename: sNNN-YYYY-MM-DD-{short-slug}.md where NNN is the next three-digit session index (see HANDOFF.md / HANDOFF-LOOP.md Terminology).
- Required sections defined in HANDOFF.md (lite) or HANDOFF-LOOP.md (full).
- Do not duplicate full TODO.md or DECISIONS.md content; reference them.
- Do not restate adapter content. Do not become another adapter layer.
- ASCII operators only.
-->

# Handoff -- 2026-04-19 -- Phase E cuts 13-15 then pivot to email features

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, then this file. If LESSONS matters for the next move, read `CONTEXT/LESSONS.md` too. Resume from `State` and `Next Step Prompt`.

First reply: 1-2 short sentences plus a one-line `Pass-forward:` and exactly 1 direct question about how to proceed. No preamble.

## State

- Project path: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: `main`, HEAD `3d271a3`, 2 files modified locally (`CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` from Step 2 sync + this handoff). In sync with origin on commits.
- Prod frontend: Vercel deploying `3d271a3`; local build bundle `index-C8kCUKAS.js`
- Apps Script: v2.25.0 LIVE (no backend redeploy this session)
- `src/App.jsx`: 2526 lines (was 2606 at start, -80 this session). `backend/Code.gs`: 2382 lines. Build: `npm run build` PASS
- Active focus: pivoting off code/refactor work; next work is external-comms overhaul (dedicated sender Gmail, welcome email, announcement emails). JR quote: "good on code and bug fixes now. i wanna work on the email features."

## This Session

Continued Phase E with JR's direction "you choose. i you understand the implications better than me. but remember do them all and smoke test with playwrite commit and then continue to the next." Three cuts shipped; one target (handleAutoPopulateConfirm) rejected honestly mid-plan on anti-pattern grounds.

1. Cut 13 `d9c5377`: added `matchesOfferId(offer, id)`, `matchesSwapId(swap, id)`, `errorMsg(result, fallback)` to `src/utils/requests.js`. DRY'd 26 request/offer/swap sites in App.jsx. No line change (all inline expressions); win is DRY-correctness -- future handlers cannot miss a branch of the dual-key `offerId||requestId` check. Playwright smoke PASS.
2. Cut 14 `d6e8811`: extracted desktop Save/GoLive/Edit three-state button into `src/components/ScheduleStateButton.jsx`. App.jsx 2606 -> 2565 (-41). Pure presentational, parent owns handlers + state flags.
3. Cut 15 `3d271a3`: unified mobile + desktop onto one ScheduleStateButton with middle-ground sizing (`px-2.5 py-1`, `text-xs`, icon 11, title-case labels). Mobile inline three-state block deleted; Publish stays inline as sibling with `flex-wrap` on the row. App.jsx 2565 -> 2526 (-39). Smoked at 1280px AND 390px.

JR then said done with refactor work. Added email+distribution overhaul to TODO. Scope: JR creating dedicated Gmail (e.g. `rainbow-scheduling@gmail.com`) to replace his personal account as sender, then revisit every send site (schedule PDF, announcement emails, welcome email on create, Sarvi admin notifications), standardize from-address + subject conventions + deliverability.

Rejected target (not retry-worthy): `handleAutoPopulateConfirm` dispatcher. Initial Plan-time assessment was "self-contained 30 lines"; on read it needed 4-6 App-scoped deps threaded for a 25-line handler -- fell right on the anti-pattern boundary from prior handoff. Skipped.

Design conversation re-shaped cut 15. First pass extracted desktop-only. JR pushed back asking whether the system wants mobile+desktop unified; then asked for a middle sizing rather than full unification at desktop size. Middle-ground spec emerged from that dialog.

Decanting check:
- Working assumptions: (a) Playwright render-smoke on both 1280 and 390 viewports is the right gate whenever a mobile path changes -- 390px specifically, because the Edit + Publish pair only renders together in the LIVE state and can wrap on narrow screens. (b) `flex-wrap` on the mobile action row is safe insurance; doesn't affect layout unless the row actually overflows.
- Near-misses: `handleAutoPopulateConfirm` attempted extraction aborted before writing any code. Was going to happen; re-read of the handler exposed the 5-dep threading cost. Decided correctly to skip.
- Naive next move: obvious continuation is "keep doing Phase E cuts." JR explicitly rejected this. Next work must be motivated by feature/comms, not by more extraction.

Audit: Step 3 audit ran (CONTEXT writes occurred in Step 2). TODO.md updated in place (Active item for email overhaul; Phase E active line revised to reflect pause; Verification + Completed entries added for cuts 13-15). DECISIONS.md prepended with session entry. No adapter writes. No drift between files (rationale stayed in DECISIONS, task state in TODO). Audit: clean (no relocations).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `src/utils/requests.js` | New helpers `matchesOfferId` / `matchesSwapId` / `errorMsg` plus existing `hasApprovedTimeOffForDate`. Any new request/offer/swap handler in App.jsx should use these, not re-inline the dual-key check. |
| 2 | `src/components/ScheduleStateButton.jsx` | Unified three-state button (Save / Go Live / Go Edit), rendered in both desktop header and mobile action row. Middle-ground sizing. Do not split into size variants without a concrete motivation. |
| 3 | `src/App.jsx` | 2526 lines. Mobile action row at ~1463, desktop three-state mount at ~1969. Offer/swap handlers at 885-1285 use the new helpers. |
| 4 | `backend/Code.gs` | Untouched this session but becomes hot next session: `saveEmployee` welcome-email trigger, MailApp.sendEmail sender identity, role-based distribution. Check `CONFIG.ADMIN_EMAIL` and `PRIMARY_CONTACT_EMAIL` conventions before adding new send sites. |
| 5 | `src/email/build.js` + `src/pdf/generate.js` | Email body + PDF generator. Part of the email overhaul surface. PDF already uses `PRIMARY_CONTACT_EMAIL` as the single point of contact. |

## Anti-Patterns (Don't Retry)

- Do not extract `handleAutoPopulateConfirm` without a concrete motivation. 4-6 App-scoped deps (week1, week2, autoPopulateWeek, clearWeekShifts, showToast) threaded for ~25 handler lines. Re-evaluated and rejected this session.
- Do not split `ScheduleStateButton` into `size="sm" | "md"` variants. JR explicitly chose unified over per-viewport. Middle-ground sizing is the design; mobile + desktop drift is the failure mode it prevents.
- Do not start a fresh Phase E cut unless a feature or readability motivation justifies it. JR called "good on code and bug fixes now." Continued extraction without a driver = churn, not win.
- Do not add any new email send site without first settling the sender-identity question. JR is creating a dedicated Gmail. Adding a `MailApp.sendEmail` using his personal account now means rewriting it soon.
- Do not smoke mobile-touching changes at desktop viewport only. Cut 15 specifically required 390px verification because Edit + Publish pair renders inline and could wrap.

## Blocked

See `CONTEXT/TODO.md#Blocked`. Top-of-mind carrying forward:

- Email + distribution overhaul -- blocked by JR creating dedicated Gmail sender account (then audit every MailApp.sendEmail site)
- Sarvi iPad retest covers 3 shipped fixes (white-screen, PDF "ae" glyph + `.blob` export, PDF role-encoding)
- Sarvi-batch + Phase A+B+C save-failure smoke -- JR+Sarvi
- Bug 4 (PK 10am-10am) + Bug 5 (top-nav PK UI no-show) -- waiting on JR repro
- Sarvi discovery for per-day real `defaultShift` values
- Payroll aggregator path 1 -- waiting on Sarvi Counterpoint / ADP discovery
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light "Friday"
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on
- Consecutive-days 6+ warning -- Sarvi answers

## Key Context

- Auto-memory `feedback_playwright_always.md` in force (default to Playwright MCP; do not ask "you or me").
- Auto-memory `feedback_no_redundant_confirms.md` in force (don't re-ask once JR answered).
- Ship-merge-verify rule stays: one cut per commit on main.
- Test employee `testguy@testing.com` / `test007`. JR admin `johnrichmond007@gmail.com` / `admin1`.
- PDF already has `PRIMARY_CONTACT_EMAIL` (Sarvi) narrowing convention -- future email-overhaul work should align with that pattern, not re-design from scratch (see `DECISIONS 2026-04-14 PDF Contact Admin filter`).
- Mobile viewport `useIsMobile()` breakpoint = 768px. 390px (iPhone 12/13/14/15 regular) is the smoke target for tight-row layouts.

## Verify On Start

- `git status` -- expect two local edits: `CONTEXT/TODO.md` + `CONTEXT/DECISIONS.md` (Step 2 sync) plus the new handoff file. If JR ran the ceremony commit, expect clean.
- `git log --oneline -5` -- top should include `3d271a3` (cut 15 unify), `d6e8811` (cut 14), `d9c5377` (cut 13), then `f334aa5` (prior handoff)
- `git rev-list --left-right --count origin/main...HEAD` -- expect `0 0`
- `npm run build` -- PASS; modern bundle ~475 kB (index-C8kCUKAS.js), legacy bundle + polyfills stable
- `wc -l src/App.jsx` -- expect 2526
- `ls src/components/` -- should include new `ScheduleStateButton.jsx`
- `ls src/utils/` -- `requests.js` now exports `matchesOfferId`, `matchesSwapId`, `errorMsg` in addition to prior `hasApprovedTimeOffForDate`
- Ask JR: has the dedicated sender Gmail been created yet? Kicks off the email-overhaul scope work.

## Next Step Prompt

Active focus this session was the pivot: code/refactor work paused; email + distribution overhaul is the declared next initiative.

External gate: JR is creating a dedicated Gmail (e.g. `rainbow-scheduling@gmail.com`) to replace his personal account as sender. Until that exists, cannot change `MailApp.sendEmail` sender identity cleanly.

Productive pre-work achievable now (even without the new Gmail yet):
(a) Audit every `MailApp.sendEmail` / email send site across `backend/Code.gs` + `src/email/build.js` + `src/pdf/generate.js`. Produce a list: which events trigger emails, who receives them, what subject/body conventions exist today, which sites currently hardcode JR's email vs read from CONFIG, which sites are missing (welcome email on create is the known gap).
(b) Review `src/email/build.js` plaintext-only convention (`DECISIONS 2026-04-12 Email body plaintext via MailApp`). Decide whether announcement emails or welcome emails should stay plaintext or move to HTML (with XSS sweep; see `LESSONS Keep escape applied to only 5 PDF HTML sites`).
(c) Sketch welcome-email copy + subject line. Default password is `emp-XXX` (see auto-memory `reference_default_passwords.md`); email should explain how to log in on first visit and prompt password change.

External gates still pending (do not bundle with email work unless JR pulls them in): Sarvi iPad retest, Bug 4/5 repros, Sarvi defaultShift + Counterpoint/ADP discovery.

If switching harnesses, read shared CONTEXT first; repair adapters only if stale.
