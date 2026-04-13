# Handoff — RAINBOW Scheduling

Session 42. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

## Session Greeting

Resuming right before the Tuesday 2026-04-14 demo. S42 shipped the polish pass + welcome sweep + toolbar refactor; Sarvi loved the sweep. Next session's job is a **READ-ONLY** full functional-test sweep of every feature in the live deploy, culminating in an audit report of bugs/rough edges + proposed fixes for JR to rule on in the morning.

## READ-ONLY CONTRACT (HARD RULE)

**Do NOT edit any code this session.** No `Edit`, `Write`, or commit-generating work on anything in `src/`, `backend/`, or any project source. Only:
- Browser drives (Playwright MCP)
- File reads (`Read`, `Grep`, `Glob`)
- Appending findings to `docs/audits/s42-functional-test.md` (you create that ONE file, then only append to it)
- Bash commands that don't mutate source (curl, git status, git log, ls, npm run build only if JR asks)

If you spot an obvious 10-second fix during testing: record it in the audit report with a proposed fix. **Do not ship it.** JR evaluates + rules in the morning. This is non-negotiable.

## Email-Safe Testing — READ THIS

Any **Publish** or **Email Schedules** action during the functional test MUST be limited to 2 recipients only: `john@richmondathletica.com` and `sarvi@rainbowjeans.com`. The EmailModal (at [src/modals/EmailModal.jsx](src/modals/EmailModal.jsx)) has per-recipient checkboxes — uncheck every employee except those two before hitting Send. Do NOT trigger a Publish flow without first inspecting the recipient list. Natasha in particular has asked not to receive more test emails.

## State

- Build: **PASS** (last verified commit 8a80a14)
- Branch: `main`, up-to-date with origin (after you push the handoff commit)
- Last commit: `8a80a14` S42.1 welcome sweep + polish refinements
- Live: https://rainbow-scheduling.vercel.app (Vercel auto-deployed from push)
- Apps Script: **v2.18** (no backend changes this session)

## This Session (S42 + S42.1)

- Polish pass: density toggle ripped · mobile admin header now "OVER THE RAINBOW" (was just "RAINBOW") · login lands on CURRENT_PERIOD_INDEX (was hardcoded 0) · admin "Shift Changes" button → "My Requests" · admin desktop toolbar 7 buttons → 4 (Export + Publish + My Requests + avatar dropdown).
- EmployeeFormModal: employment type toggle now renders on create (not just edit).
- Welcome sweep: full-screen 5-stripe rainbow pass on login, 900ms, fits inside existing 1s login min-delay. JR + Sarvi approved.
- Publish text hardcoded white over rotating accent. Inactive-employee yellow badge dropped (now subtle "N inactive" in avatar menu).
- Dead `.rainbow-sphere` CSS purged (~34 lines).

## Functional Test Plan — S42.2

Drive each with Playwright MCP (or fall back to manual if MCP misbehaves). For each feature, capture: **works/broken/rough**, and if broken/rough, a concrete proposed fix.

### Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin (owner) | `sarvi@rainbowjeans.com` | `admin1` |
| Employee test | `john@richmondathletica.com` | `13371337` |

(Credentials are session-scoped; not saved to memory or files.)

### Test matrix

Desktop admin (Sarvi):
- [ ] Login → welcome sweep plays → lands on current period (Apr 6-19)
- [ ] Avatar menu opens, all 4 items clickable (Add Employee, Manage Staff, Admin Settings, Sign Out)
- [ ] "N inactive" muted text renders correctly inside Manage Staff menuitem
- [ ] Add Employee: new employee flow, employment-type toggle present on create, defaults part-time
- [ ] Manage Staff panel: reactivate inactive employee round-trip
- [ ] Admin Settings opens, all fields editable
- [ ] My Requests button opens admin's own submit-request modal
- [ ] Edit mode → schedule cell → create a shift → Save → Go Live → Publish (**email only the 2 test addresses**)
- [ ] Period nav prev/next, week tabs, Announcements tab, Shift Changes tab all work
- [ ] Shift Changes admin panel: approve a pending request (if any; if not, skip)
- [ ] Export PDF button generates PDF preview
- [ ] Auto-Fill / Clear All FT Week 1/2 buttons

Mobile admin (Sarvi, 390px viewport):
- [ ] Header shows "OVER THE RAINBOW" (not just "RAINBOW")
- [ ] Bottom nav: Schedule | Requests | Comms | More
- [ ] Row-3/Row-4 toolbar hides on non-schedule destinations
- [ ] Edit Mode + Fill/Clear Week buttons
- [ ] Mobile Publish flow (**restrict recipients**)

Desktop employee (JR test account):
- [ ] Login → welcome sweep → lands on current period
- [ ] Schedule view, "Mine" tab
- [ ] Shift Changes → Days Off → submit a request for a future date → `guardedMutation` saving toast → success toast
- [ ] Shift Changes → Shift Swap / Take My Shift (if future shifts exist)
- [ ] My Time Off Requests panel: cancel a pending request
- [ ] Change Password flow

Mobile employee (JR test account, 390px):
- [ ] Header shows "OVER THE RAINBOW"
- [ ] Bottom nav: Schedule | Requests | Alerts | More
- [ ] Alerts bottom sheet: opens, feed entries present, badge dot clears on close
- [ ] Days-off modal: graying of already-approved dates (green dot + legend)
- [ ] Submit day off → approve from admin side (separate session window as Sarvi) → Alerts feed updates

Cross-cutting:
- [ ] Accent rotation visible (reload the page a few times — each reload cycles red → blue → orange → green → purple)
- [ ] Publish button text readable on every accent rotation (esp. green — known WCAG-fail but JR accepted; confirm it's legible in practice)
- [ ] Focus rings on keyboard nav
- [ ] Escape closes all modals + the avatar dropdown

### Consistency audit against project conventions

Beyond pass/fail on individual features, compare what you observe against the rules we've codified for this project. These are concrete pass/fail checks (unlike raw research, which would invite ambiguous interpretation):

- [.claude/rules/conventions.md](.claude/rules/conventions.md) — React, data, backend, password/auth, mutations + feedback, display rules
- [docs/decisions.md](docs/decisions.md) — non-trivial decisions w/ "Revisit if" gates. Active visual conventions to check at a minimum:
  - 2026-04-12 Admin desktop header: 4 visible actions + avatar dropdown
  - 2026-04-12 Welcome sweep on login (full-screen 5-stripe, 900ms)
  - 2026-04-12 Publish button: hardcoded white text (rotating gradient)
  - 2026-04-12 Schedule-context toolbar hides on non-schedule destinations
  - 2026-04-12 Mobile bottom nav active state derived from modal/drawer state
  - 2026-04-12 OTR accent colors are immutable (5 brand colors only)
  - 2026-04-12 WCAG contrast via proper calculation (white-vs-navy auto-pick)
  - 2026-04-12 Card shadows = accent-color halos (no dark drop-shadows)
- [docs/lessons.md](docs/lessons.md) — correction patterns; any UI element violating one of these is a finding
- [CLAUDE.md](CLAUDE.md) "Boundaries" — Sheets headers immutable, draft shifts private, ESA compliance

Record convention-violations as their own audit rows (separate from broken/rough). Reference the specific rule.

### Optional: research audit (only if conventions audit comes back clean)

If the convention audit yields few findings and there's time, do ONE pass through [docs/research/](docs/research/) (5 files) and write a separate `docs/audits/s42-research-gap.md` flagging any principle from the research that the codified conventions DON'T cover but probably should. This is for JR to decide whether to add to conventions, not for shipping fixes. Skip if conventions audit is already long.

### Report format

Collect into `docs/audits/s42-functional-test.md` (create the `docs/audits/` directory). Structure:

```markdown
# S42 Functional Test Audit — 2026-04-13

## Summary
[N total checks · X passed · Y broken · Z rough]

## Broken (fix before demo)
| # | Area | Problem | Proposed fix | Effort |
|---|------|---------|--------------|--------|

## Rough (consider before demo)
[same table]

## Works (no action)
[bullet list]
```

Do NOT ship fixes during the test. Collect findings, propose fixes, present to JR in the morning for rulings.

## Hot Files

| Priority | File | Changed this session? | Why next session needs it |
|---|---|---|---|
| 1 | [src/App.jsx](src/App.jsx) | Yes — S42/S42.1 | Admin toolbar refactor, welcome sweep state, login period fix |
| 2 | [src/modals/EmailModal.jsx](src/modals/EmailModal.jsx) | No | Recipient checkbox surface for email-safe testing |
| 3 | [src/index.css](src/index.css) | Yes — S42.1 | `.welcome-sweep` keyframes + reduced-motion handling |
| 4 | [src/modals/EmployeeFormModal.jsx](src/modals/EmployeeFormModal.jsx) | Yes — S42 | Employment-type toggle now renders on create |
| 5 | [src/theme.js](src/theme.js) | No | `OTR_ACCENT` rotates per page load — inspect to understand accent-rotation testing |
| 6 | [backend/Code.gs](backend/Code.gs) | No | v2.18 live; only touch if a backend fix is proposed |

## Anti-Patterns (Don't Retry)

- **Hardcoding a text color on a rotating-accent gradient without inspecting all 5 rotations** (since S42) — `THEME.accent.blue/purple` are aliases for OTR_ACCENT.primary/.dark; they rotate. White-on-green fails WCAG. Already graduated to `docs/lessons.md` this session.
- **Testing UI claims without actually driving the browser** — Playwright MCP is registered and working; use it. Don't self-report green on things you haven't clicked.
- **Sending real Publish/Email batches during testing** — Natasha and other real employees will get spammed. Always scope recipients to the 2 test addresses before Send.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Email sender upgrade (professional Google Workspace) | JR providing sender address | Pre-existing |
| Per-button spinner (vs global actionBusyRef) | Post-demo | MVP is ref-guard + 'saving' toast. Fine for demo. |
| Concurrent-admin edit coordination | Post-demo | `docs/todo.md` has options |
| New-employee welcome email | Post-demo (ask Sarvi re: handbook to attach) | Added to todo.md this session |
| Payroll aggregator discovery | Post-demo | Discovery email to Sarvi pending |

## Key Context

- **Accent rotation = per page reload.** Every reload increments `localStorage['otr-accent']`. To force a specific accent for testing, set that key manually in DevTools: `localStorage.setItem('otr-accent', '0')` for red, 1 blue, 2 orange, 3 green, 4 purple. Then reload.
- **Welcome sweep only plays on login** (not on refresh when token is still valid). To see it again, sign out first.
- **Local dev preview:** `npm run preview -- --port 4173` runs from `dist/`; must `npm run build` first for changes to show. Background-run it and check localhost:4173.
- **Playwright MCP is globally registered** (`~/.claude.json` mcpServers). First session may auto-download Chromium (~250MB). Use `/mcp` to enable.
- **RTK hook active** on all Bash calls (global). `rtk gain` to inspect token savings.
- **Test account password** for `john@richmondathletica.com` is `13371337` (JR picked it; session-scoped only, not persisted).

## Verify On Start

- [ ] `git status` clean on main, in sync with origin
- [ ] `git log --oneline -1` → matches the handoff commit
- [ ] `npm run build` passes
- [ ] `curl -I https://rainbow-scheduling.vercel.app/` returns 200
- [ ] `/mcp` shows Playwright active (enable if not)
- [ ] Ask JR: "Resume S42.2 functional-test sweep against live deploy, email-safe mode (only john@richmondathletica.com + sarvi@rainbowjeans.com)?"
