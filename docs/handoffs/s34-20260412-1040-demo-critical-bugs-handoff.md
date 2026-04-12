# Handoff — RAINBOW Scheduling

Session 34. `CLAUDE.md` auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, and the plan file at `~/.claude/plans/lovely-launching-marble.md` at session start.

## Session Greeting

S34 closed. Next up per plan: **S35 — browser verify live site**. Do NOT re-audit, do NOT re-plan, do NOT ask "bundle or split?" — execute the plan verbatim. Demo is 2026-04-14.

## State

- Build: PASS (commit `6d82a54`)
- Tests: NONE
- Branch: main, pushed
- Last commit: `6d82a54` S34 handoff: graduate modal-backdrop anti-pattern
- Live: https://rainbow-scheduling.vercel.app (Vercel auto-deploys from main)

## This Session

- S34.1+S34.2+S34.3+S34.4 landed bundled in `2bbdca4` (JR approved bundling, but plan's default is one commit per sub-step — don't ask again).
- Post-audit hardening in `2609654`: escape `role.fullName`, hex-whitelist `role.color`, null-guard `emp.name`/admin contacts in email builder, publish toast strengthened to "NOT PUBLISHED — ... Click Publish again to retry."

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `~/.claude/plans/lovely-launching-marble.md` | No | Still the plan. S35 is next. |
| 2 | `src/App.jsx` | Yes (-262 lines) | PDF/email/helpers extracted. Circular imports at top of file. |
| 3 | `src/pdf/generate.js` | New | PDF generator. Imports constants from `../App`. |
| 4 | `src/email/build.js` | New | Plaintext email. Null-guarded. NOT HTML-escaped (plaintext context). |
| 5 | `src/utils/format.js` | New | `parseLocalDate`, `escapeHtml`. |

## Anti-Patterns (Don't Retry)

- **Trusting `result.success` from `chunkedBatchSave`** — S34.4 fixed it; callers now must read `data.{totalChunks, failedChunks}` on `success: false`.
- **Top-level use of imported symbols in `src/pdf/generate.js` or `src/email/build.js`** (since S34) — circular imports with `../App` are safe only because every imported symbol is used inside function bodies. Any top-level read breaks.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs deploy | JR manual | S36 needs this. |
| HMAC_SECRET provisioning | JR manual | S36 needs 32-byte base64 in Apps Script Script Properties. |
| Email upgrade | JR providing sender email | Pre-existing. |
| Browser verify | JR / Chrome-ext Claude | S35 — CLI has no browser tool. |

## Key Context

- Plan deviation logged in `docs/decisions.md`: email builder's 2 "XSS" sites from original audit are non-issues — body is plaintext via `MailApp.sendEmail({body})`. Any future switch to `htmlBody` triggers a new escape pass against `src/email/build.js`.
- `chunkedBatchSave` partial-failure now returns `success: false` with `{savedCount, totalChunks, failedChunks}`. Previous `success: true + warning` is gone.
- Repo hygiene (S33.5) still deferred per JR: `Photos/`, `dist/`, `package-lock.json` untracked.

## Verify On Start

- [ ] `git status` — clean on main, 3 untracked (`Photos/`, `dist/`, `package-lock.json`)
- [ ] `git log --oneline -3` — top is `6d82a54`
- [ ] `npm run build` passes
- [ ] `vite preview --port 4173`; `curl -I http://localhost:4173/` returns 200
- [ ] Vercel has `6d82a54` deployed to https://rainbow-scheduling.vercel.app
- [ ] `AskUserQuestion` to confirm "start S35 browser verify" before any Edit/Write
