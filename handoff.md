# Handoff — RAINBOW Scheduling App

Session 24. `CLAUDE.md` is auto-loaded by Claude Code. Read `PLAN.md` for full progress.

## State
- Build: PASS — Vercel auto-deployed, live at https://rainbow-scheduling.vercel.app
- Tests: NONE (manual testing only)
- Branch: main
- Last commit: `6e86a4a` Update Code.gs version comment to v2.12
- Backend: Code.gs v2.12 deployed by JR as v2.21

## CLAUDE.md Changes
- **Tech Stack**: `Code.gs v2.10` → `v2.12`
- **Repository Structure**: Added `backend/Code.gs` to file table; updated git workflow note re: backend/ folder
- **Session Workflow**: New section added — 3-file system rules + JR deployment versioning note

## This Session
- RS-24: Printer-friendly PDF (white bg, gradient RAINBOW logo, task text in cells), employee initial password (emp-XXX suggested), email validation, lighter text, GO EDIT rename, admin password visibility with eye toggle, first-login changePassword bug fix, show new password on success screen
- Created `backend/` folder — Code.gs now tracked in repo at `backend/Code.gs`; user copies full file to Apps Script editor to deploy

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `src/App.jsx` | Yes | All RS-24 frontend changes; next session will edit for email upgrade |
| 2 | `backend/Code.gs` | Yes | v2.12 changes; next session will add email-send endpoint |

## Anti-Patterns (Don't Retry)
- **webkit-line-clamp in PDF HTML** (since S24) — Causes text to be invisible in print popup window; use `word-break:break-word` with no height clamping instead

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Email upgrade (backend-sent publish email with PDF attached) | JR providing new sender email address | Will replace client-side `mailto:` links; use Code.gs `MailApp` with PDF as base64 attachment; see PLAN.md Future Items |

## Execution Rounds

> **Before starting any round:** Present the full task list with model tags. Tell the user which model the first group needs. **STOP and wait** for confirmation before starting work.

No Opus tasks this phase.

### Round 1 — Sonnet (batch)
_Once JR provides the new sender email:_

| # | Task | Files Touched | Depends On | Done? |
|---|------|--------------|-----------|-------|
| 1 | Add `sendScheduleEmail` endpoint to Code.gs — accepts schedule HTML + recipient list, sends via MailApp with PDF base64 attachment | `backend/Code.gs` | — | [ ] |
| 2 | Replace `buildEmailContent` / `mailto:` publish flow with API call to new endpoint | `src/App.jsx` | R1.1 | [ ] |
| 3 | Update Code.gs version comment to v2.13 | `backend/Code.gs` | R1.1 | [ ] |

No Haiku tasks this phase.

## Verify On Start
- [ ] App loads at https://rainbow-scheduling.vercel.app
- [ ] Admin can add employee — Initial Password field shows emp-00X
- [ ] Admin edit employee — password field visible with eye toggle
- [ ] Admin reset password — toast shows actual emp-XXX value, field updates
- [ ] PDF export — white background, RAINBOW shows gradient, task text visible in cells with tasks

## User Preferences
- JR calls backend deployments by his own version numbers (v2.2, v2.21) — different from Code.gs internal version comments; don't confuse them (since S24)
- No emojis in responses (since S23)
- Concise responses, no padding (since S21)
- When making Code.gs changes, always update the version comment and changelog at top of file (since S24)
