# Handoff — RAINBOW Scheduling

Session 41 (continued). JR closed VSCode at 2145 ET 2026-04-12 to reload Claude Code so the newly-registered Playwright MCP picks up.

## Session Greeting

Mid-session handoff across a VSCode restart. Everything below is already shipped + deployed; the restart is ONLY to load Playwright MCP so we can drive the browser from the next session.

## State

- Build: PASS (last build this session)
- Branch: `main`, clean, up-to-date with origin
- Last commit: `6025f42` S41.5: Code.gs v2.18 overlap-check + submit-feedback toasts
- Apps Script live: **v2.18** (JR deployed mid-session)
- Employees sheet: column T `passwordChanged` header added by JR (blank cells for back-compat fallback)
- Live: https://rainbow-scheduling.vercel.app — Vercel auto-deployed the frontend
- App.jsx: 3664 + a handful of lines from S41.2/5 wraps
- Demo: **2 days out — 2026-04-14**

## What Shipped This Session (S41.1 → S41.5)

- **S41.1 (a511060)** Code.gs v2.16: every protected handler drops `callerEmail` from payload destructure and derives it from `auth.employee.email`. Fixes S37 regression that silently broke submit/approve/deny/revoke/cancel across time-off, offers, swaps.
- **S41.2 (c2b754a)** Request-modal nav clearance (all 4 modals get paddingBottom with safe-area), admin approve/deny/revoke double-submit guard via `actionBusyRef` + `guardedMutation`, destination-aware success toasts, unified offer/swap submit gradient.
- **S41.3 (8f9df27)** Code.gs v2.17: `passwordChanged` flag replaces emp-XXX regex for `usingDefaultPassword` detection. New Mobile Alerts bottom sheet (`MobileAlertsSheet` + `computeAlertItems` in MobileEmployeeView.jsx), wired into EmployeeView.jsx; Alerts tab in bottom-nav now always opens it (previously silent).
- **S41.5 (6025f42)** Code.gs v2.18: time-off overlap filter now covers BOTH pending+approved (error `ALREADY_SCHEDULED_OFF`). Frontend RequestDaysOffModal calendar grays out approved-off days (green dot + legend). All 3 employee submit handlers wrapped with `guardedMutation` for instant feedback.

## MCPs Installed This Session (user-scope / global)

- **RTK 0.35.0** (`~/.local/bin/rtk`). Hook at `~/.claude/hooks/rtk-rewrite.sh` wired into `~/.claude/settings.json` PreToolUse matcher `Bash`. Always on. Global.
- **Playwright MCP** registered in `~/.claude.json` mcpServers. Global. Command: `npx @playwright/mcp@latest`. First use will download Chromium (~250MB). Toggle per-session with `/mcp`.

## Hot Files

| Priority | File | State | Why |
|---|---|---|---|
| 1 | `src/App.jsx` | `guardedMutation` helper at ~L1194; wraps ~12 mutation handlers | Do NOT unwrap without a replacement double-submit guard |
| 2 | `src/MobileEmployeeView.jsx` | exports `MobileAlertsSheet`, `computeAlertItems` | New component, don't relocate without updating EmployeeView.jsx import |
| 3 | `src/views/EmployeeView.jsx` | `mobileAlertsOpen` + `alertsLastSeenAt` state; localStorage key `otr-alerts-last-seen-<email>` | |
| 4 | `src/modals/RequestDaysOffModal.jsx` | Calendar grays approved-off dates via `hasApprovedTimeOffForDate` | |
| 5 | `backend/Code.gs` | **v2.18 deployed** | passwordChanged flag writes on self-change; overlap check includes approved |
| 6 | `.claude/rules/conventions.md` | Updated w/ S41 patterns (git-ignored; local-only) | |
| 7 | `~/.claude/settings.json` | New PreToolUse entry for RTK Bash matcher | |

## Anti-Patterns (Don't Retry)

- **Testing UI claims via "you'll see it when you approve" without the browser.** Past sessions this led to spending time on UX changes that were never verified. Next session: use Playwright MCP to drive the smoke-test. `/mcp` to enable it first.
- **Listing post-demo deferrals in next-task options.** 2 days to meeting; only surface pre-demo items.
- **Wrapping existing handlers inline without re-reading the surrounding block.** guardedMutation wraps have `async () => { ... });` closer — easy to drop a closing `)` or `;` and only find it at build time.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Per-button spinner (vs global actionBusyRef) | Post-demo | Current MVP is a ref-guard + 'saving' toast. Good enough for demo. Full per-button spinner plumbing deferred. |
| Email sender upgrade | JR providing sender | Pre-existing |
| Concurrent-admin edit coordination | Post-demo | See `docs/todo.md` for mitigation options. |
| Field #5 phantom alerts bell | Solved via S41.3 alerts sheet | |

## Key Context

- **Sarvi's column T is still blank** because she hasn't changed her password yet. Login falls back to the emp-XXX regex. Her current password doesn't match the regex, so she's (correctly) not prompted. To force her into the new flow, admin-reset her password; she'll be prompted on next login and T populates.
- **Plaintext password column D is blank after `changePassword`** — intentional. Hash lives in column R, salt in column S. Security-forward by design.
- **JR's smoke-test covered:** Natasha login+password-change+time-off submit+approve roundtrip, Alerts bell+sheet+history. All working. Bugs he reported already fixed in S41.5.
- **Outstanding per-JR report:** nothing red. He wanted "fix these + plan + audit" — done and committed.

## Verify On Start

- [ ] `git status` clean on main, not ahead of origin
- [ ] `git log --oneline -1` → `6025f42`
- [ ] `wc -l src/App.jsx` → ~3680 range
- [ ] `npm run build` passes
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` → 200
- [ ] `/mcp` to see Playwright MCP listed (enable if doing browser testing)
- [ ] `which rtk` → `~/.local/bin/rtk` (RTK hook is already active if listed in settings.json)
- [ ] `AskUserQuestion` to confirm: resume Playwright-driven smoke test, or pivot to demo polish?

## Session stopping point

JR typed: "ok so im gonna close this now and reopen it. i hope you know what were doing when i get back" — then likely closed the CLI. Everything that can be shipped is shipped. Next session's opener is to enable `/mcp playwright` (if doing testing) and drive the browser through the smoke-test list: Natasha login → time-off submit (check for saving→success toast sequence), Sarvi approve (watch saving toast, confirm destination copy), Natasha alerts bell feedback loop, attempt a duplicate time-off for already-approved dates (frontend should gray out, backend should reject with ALREADY_SCHEDULED_OFF).
