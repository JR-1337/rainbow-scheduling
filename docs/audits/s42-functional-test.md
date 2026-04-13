# S42 Functional Test Audit — 2026-04-13

Read-only sweep of live deploy (https://rainbow-scheduling.vercel.app) driven via Playwright MCP. Email-safe: any Publish flow restricted to `john@richmondathletica.com` + `sarvi@rainbowjeans.com`. Apps Script v2.18.

## Summary
_(filled in at end)_

## Broken (fix before demo)
| # | Area | Problem | Proposed fix | Effort |
|---|------|---------|--------------|--------|

## Rough (consider before demo)
| # | Area | Problem | Proposed fix | Effort |
|---|------|---------|--------------|--------|

## Convention / Decision violations
| # | Rule | Observation | Proposed fix | Effort |
|---|------|-------------|--------------|--------|

## Works (no action)
_(bullet list)_

## Run log

### Initial load (desktop employee, accent=blue index 1)
- URL https://rainbow-scheduling.vercel.app/ returned 200, page title "Rainbow Scheduling - Over the Rainbow"
- Session restored from localStorage (JR/john@richmondathletica.com). Welcome sweep did NOT play (token still valid; expected per handoff note)
- Header: "OVER THE / RAINBOW" split title, period nav shows "Apr 6 – Apr 19 / Current Period" ✓ (landed on current period)
- "Updates Pending" banner visible → admin is editing period (Sarvi has an active draft)
- Employee roster: Sarvi, Charmaine, Domenica, Gellert, JR (You), Natash Myles, Nona, Savannah, sarvnaz
- Sort order observed: Sarvi first (correct — full-time admin/owner by convention), then alpha: Charmaine, Domenica, Gellert, JR, Natash, Nona, Savannah, sarvnaz. Sarvi pinned first ✓
- Roles legend visible: Cash · Cash2 · Men's · Women's · Monitor + Your Task star
- "Your Schedule This Period: No shifts scheduled" card renders
- Contact Admin panel shows Sarvi's email

### Name data observations (not code bugs — data)
- "Natash Myles" — likely meant "Natasha Myles" (missing trailing 'a'). Data entry; flag with Sarvi.
- "sarvnaz" — lowercase, first name only. All other names are properly capitalized. Flag with Sarvi.


