# Handoff — RAINBOW Scheduling App

Session 25. `CLAUDE.md` is auto-loaded by Claude Code. Read `PLAN.md` for full progress.

## State
- Build: PASS — `21f6db3` deployed, live at https://rainbow-scheduling.vercel.app
- Tests: NONE (manual testing only)
- Branch: main
- Last commit: `21f6db3` Lighten dark theme — charcoal navy instead of near-black
- Backend: Code.gs v2.12 deployed by JR as v2.21 (unchanged this session)

## CLAUDE.md Changes
- **Known Gotchas**: Added #2 — boolean columns from Sheets are strings; always use `=== true`/`=== false`
- **Deployment / Frontend (Vercel)**: Added "If auto-deploy breaks" recovery steps + CLI fallback commands

## This Session
- Fixed Vercel auto-deploy: GitHub App repo access was hidden, 19 commits were undeployed for 10 days; restored via GitHub App settings + `vercel link` CLI; auto-deploy confirmed working
- Deployed all RS-25 fixes: login label contrast (index.css), pencil always visible, PDF logo solid color, admin password plaintext (`=== true` Sheets boolean fix), lighter dark theme (THEME.bg tokens)

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes | THEME.bg tokens updated; EmployeeRow pencil; EmployeeFormModal password section |
| 2 | `src/index.css` | Yes | Login label/placeholder CSS added |
| 3 | `backend/Code.gs` | No | Next session will modify for email upgrade |

## Anti-Patterns (Don't Retry)
- **webkit-line-clamp in PDF HTML** (since S24) — invisible in print popup; use `word-break:break-word`, no height clamping
- **Tailwind `placeholder:` JIT in component `<style>` tags** (since S25) — unreliable for pseudo-elements; put in `src/index.css` with `!important` instead
- **Truthy check on Sheets boolean columns** (since S25) — `isOwner`, `isAdmin` etc. are strings "TRUE"/"FALSE"; always `=== true`, never just `if (employee.isOwner)`

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Email upgrade (backend-sent publish email with PDF attached) | JR providing new sender email address | Replace client-side mailto: with Code.gs MailApp; see PLAN.md Future Items |

## Execution Rounds

> **Before starting any round:** Present the full task list with model tags. Tell the user which model to switch to. **STOP and wait** for confirmation before starting work.

No Opus tasks this phase.

### Round 1 — Sonnet (batch)
_Once JR provides the new sender email:_

| # | Task | Files Touched | Depends On | Done? |
|---|------|--------------|-----------|-------|
| 1 | Add `sendScheduleEmail` endpoint to Code.gs — accepts HTML + recipient list, sends via MailApp | `backend/Code.gs` | — | [ ] |
| 2 | Replace `buildEmailContent` / `mailto:` publish flow with API call to new endpoint | `src/App.jsx` | R1.1 | [ ] |
| 3 | Update Code.gs version comment to v2.13 | `backend/Code.gs` | R1.1 | [ ] |

No Haiku tasks this phase.

## Verify On Start
- [ ] App loads at https://rainbow-scheduling.vercel.app
- [ ] Login labels ("Email", "Password") visibly lighter than placeholder ghost text
- [ ] Edit employee modal (pencil icon, non-self non-owner employee) shows plaintext password value
- [ ] PDF export — RAINBOW logo shows in solid purple, not invisible

## User Preferences
- No emojis in responses (since S23)
- Concise responses, no padding (since S21)
- Fix one issue at a time, confirm before moving to next (since S25)
- JR's backend version numbers (v2.21) differ from Code.gs internal version comments (v2.12) — don't conflate (since S24)
