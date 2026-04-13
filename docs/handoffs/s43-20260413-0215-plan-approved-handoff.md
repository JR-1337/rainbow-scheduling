# Handoff — RAINBOW Scheduling

Session 43. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

This session (S43) only planned. It approved an 86-check functional-test plan at `~/.claude/plans/elegant-purring-kahn.md`. Your job (S44, run on **Sonnet 4.6** not Opus) is to execute that plan top-to-bottom against the live deploy, logging every check into `docs/audits/s42-functional-test.md`. Resume at **Group D check 33** (already half-done — see Key Context). The Tuesday 2026-04-14 demo is ~36h away.

## State

- Build: **PASS** (commit a78f100)
- Branch: `main`, pushed
- Last commit: `a78f100` S43 plan session: bootstrap audit file + approved 86-check plan
- Apps Script: v2.18 (unchanged)
- Live: https://rainbow-scheduling.vercel.app

## This Session

- Approved 86-check plan saved to `~/.claude/plans/elegant-purring-kahn.md`
- `docs/audits/s42-functional-test.md` bootstrapped with initial-load observations (JR desktop employee view, accent=blue index 1, initial name-data flags for "Natash Myles" and "sarvnaz" capitalization)
- `.claude/settings.local.json` created with 19 `mcp__playwright__*` entries pre-approved (gitignored) — **MUST be deleted at end of S44**
- One live Apr 21 time-off request submitted as JR during warm-up (status: pending) — must be cancelled during D34 or flagged

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `~/.claude/plans/elegant-purring-kahn.md` | Yes (S43) | The plan. Read first, execute top-to-bottom. |
| 2 | `docs/audits/s42-functional-test.md` | Yes (S43) | Audit destination. Append-only, do not overwrite. |
| 3 | `.claude/settings.local.json` | Yes (S43) | Playwright allowlist. Delete at end of S44. |
| 4 | `src/modals/EmailModal.jsx` | No | Inspect recipient checkboxes before any Publish send |
| 5 | `src/App.jsx` | No (last S42) | Reference only — admin toolbar, welcome sweep, login period |

## Key Context

- **Resume at D check 33 — already in flight:** JR's Apr 21 day-off submit was run during warm-up. Sidebar showed "My Time Off Requests 1" confirming success. Mark D33 pass. Then D34 (cancel it) cleans up the live test state in one step.
- **Session order per plan:** D (already warm) → F → sign out → A/B/C → E → G. Do NOT start with A — the existing logged-in JR session saves you one login round trip.
- **Welcome sweep only plays on fresh login.** To test A1/A4 you must sign out first (clears `otr-auth-token`). Do not test welcome sweep with a restored session — false negative.
- **Accent rotation is per page-reload.** For deterministic G51 coverage: `localStorage.setItem('otr-accent', N)` + reload for each of 0–4 (red/blue/orange/green/purple). Organic cycling wastes attempts.
- **Playwright browser lock happened this session.** If `browser_navigate` errors "Browser is already in use", run `pkill -f 'user-data-dir=/home/johnrichmond007/.cache/ms-playwright/mcp-chrome'` then retry.
- **MCP allowlist auto-approves all 19 Playwright tools** — you should see zero permission prompts. If you do, the file was deleted or scope is wrong. Re-check `.claude/settings.local.json`.
- **Apps Script may throttle** if you fire >30 mutating calls in 10 min. Back off 60s on error.
- **Before any Publish flow:** screenshot the EmailModal recipient list. Uncheck all except john@richmondathletica.com + sarvi@rainbowjeans.com. Never Send without verifying. Natasha explicitly opted out of test emails.
- **Name data observations (not code bugs):** "Natash Myles" reads like a typo (Natasha?). "sarvnaz" is lowercase where others are capitalized. Surface to JR via audit, let him confirm with Sarvi.
- **"Updates Pending" banner** was live during warm-up — Sarvi has an active draft on current period. Be aware when testing B20 (Save/Go Live); you'll be interacting with her draft, not a clean slate.

## Anti-Patterns (Don't Retry)

- **Asking JR to click Allow on each Playwright tool** (since S43) — allowlist at `.claude/settings.local.json` handles it. Don't drop the allowlist mid-session.
- **Testing welcome sweep without signing out first** (since S43) — token persists across reloads, sweep only fires on fresh `handleLogin`. False negative if you reload an authenticated session.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Final audit report delivery | S44 execution | Plan approved, execution pending |
| Post-demo roadmap items | 2026-04-14 demo outcome | See todo.md Post-demo section |

## Verify On Start

- [ ] `git status` clean on main, in sync with origin (commit a78f100)
- [ ] `git log --oneline -1` → `a78f100 S43 plan session: bootstrap audit file + approved 86-check plan`
- [ ] Read `~/.claude/plans/elegant-purring-kahn.md` end-to-end before first tool call
- [ ] Read `docs/audits/s42-functional-test.md` "Run log" to confirm what S43 already logged (don't duplicate)
- [ ] Confirm `.claude/settings.local.json` exists with 19 Playwright entries
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` returns 200
- [ ] Confirm model is **Sonnet 4.6** (not Opus) — plan recommends Sonnet for cost/fit
- [ ] Ask JR: "Resume S44 execution of the 86-check plan, starting Group D at check 33 (mark 33 pass, cancel the Apr 21 request for check 34), email-safe mode?"
