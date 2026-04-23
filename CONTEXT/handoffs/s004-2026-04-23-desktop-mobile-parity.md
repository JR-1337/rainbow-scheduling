# s004 -- 2026-04-23 -- Desktop/Mobile Parity Ports + Adversarial Audit

## Session Greeting

Read `CONTEXT/TODO.md` and `CONTEXT/DECISIONS.md`, then scan `State` and `Next Step Prompt` below.

Your first reply must be 1-2 short sentences + a `Pass-forward:` line + exactly 1 direct question about how to proceed. No recap, no summary preamble.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: clean, HEAD `54dfa8d`, main == origin/main (latest commit: CONTEXT sync for parity ports)
- Active focus: parity ports complete; no open code work. Next gate is Sarvi prod smoke OR email overhaul pre-work.
- Apps Script: v2.25.0 LIVE (no backend change this session)

## This Session

- Parity audit: subagent returned 3 candidate gaps; direct code-read narrowed to 2 real ones. Subagent incorrectly claimed Employee Quick View "missing" on desktop and Hidden section "missing" on mobile. Both existed.
- Shipped `f19b5e4`: Change Password menuitem in desktop admin avatar dropdown (between Admin Settings and divider); `ChangePasswordModal` rendered in desktop return. Reuses existing top-level `mobileAdminChangePasswordOpen` state (name is now a misnomer -- deferred cleanup per DECISIONS.md).
- Shipped `bf2a8e3`: per-row Edit3 button on mobile Hidden from Schedule collapsible; exact copy of desktop pattern (`p-1`, size-10, `setEditingEmp + setEmpFormOpen`). `reopenStaffAfterFormRef` NOT set, matching desktop.
- Shipped `54dfa8d`: CONTEXT sync (TODO.md + DECISIONS.md).
- Adversarial audit (text-only): no functional defects in either port. Wire, state, handlers, build, Playwright all clean.
- LESSONS.md: added parity-audit-needs-behavior-verification lesson.
- TODO.md: trimmed Completed from 6 -> 5 items (removed oldest PDF role-encoding entry).
- Decanting: clean. No working assumptions unrecorded. No near-misses. Naive next move would be "continue parity audit" -- nothing left to port.
- Audit: pre-Step-2 CONTEXT writes existed (commit 54dfa8d). CONTEXT drift check: clean. TODO Completed back to 5. No schema violations. Style soft-warn in LESSONS.md headings is pre-existing pattern across the file; not introduced this session.

## Hot Files

- [src/App.jsx](src/App.jsx) -- parity changes: mobile Hidden rows ~line 1577, desktop dropdown ~line 1975, desktop modal render ~line 2403
- [CONTEXT/TODO.md](CONTEXT/TODO.md)
- [CONTEXT/DECISIONS.md](CONTEXT/DECISIONS.md)

## Anti-Patterns (Don't Retry)

- Don't trust component-presence grep for parity claims. Explore subagent missed hover tooltips + conditional renders; got 2/3 gaps wrong. Always code-read the render path.
- Don't rename `mobileAdminChangePasswordOpen` speculatively -- deferred cleanup, add to a refactor only when App.jsx is open for another reason.
- Don't add mobile touch-target bumps when porting desktop patterns -- parity means same behavior; mobile-UX divergence is a separate task.

## Blocked

- Sarvi prod smoke (FT Auto-Fill + favicon confirm) -- waiting Sarvi hands-on
- Email upgrade (PDF auto-attached + dedicated sender) -- waiting JR dedicated Gmail (rainbow-scheduling@gmail.com or similar)
- S62 2-tab settings split -- waiting JR green-light
- CF Worker cache -- waiting JR green-light + Cloudflare hands-on
- Consecutive-days 6+ warning -- waiting Sarvi answers (PTO streak? reset? warn/block?)
- Payroll aggregator path 1 -- waiting Sarvi discovery + demo go-ahead
- S39.4 mobile admin extraction -- blocked by Context provider refactor

## Key Context

- DECISIONS.md 2026-04-23 parity entry has rejected-alternatives rationale for all three candidate gaps
- TODO.md Blocked lists all external gates with "since" dates
- Cross-harness: if switching, read shared CONTEXT first; repair adapters only if stale

## Verify On Start

- `git status` -- expect clean, HEAD `54dfa8d`
- Read TODO.md Active + Blocked for current gates

## Next Step Prompt

Two productive paths, both unblocked on this side:

1. Email overhaul pre-work: audit every `MailApp.sendEmail` call site across `backend/Code.gs`, `src/email/build.js`, and `src/pdf/generate.js`. Catalog from-address, subject convention, and any hardcoded personal email. Pre-work for the overhaul while JR arranges dedicated Gmail sender.

2. Bug 4 (PK default 10am-10am): ask JR which employee + which day so we can repro. `getPKDefaultTimes` only returns Sat 10:00-10:45 or weekday 18:00-20:00; suspect old PK rows in sheet or ShiftEditor seed.

Confirm with JR which to start.

Pass-forward: Parity work is complete and clean; next productive step is email send-site audit (pre-work while Gmail sender gate is open) or Bug 4 repro from JR.
