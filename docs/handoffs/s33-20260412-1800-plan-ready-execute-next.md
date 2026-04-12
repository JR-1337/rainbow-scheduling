# Handoff — RAINBOW Scheduling

Session 33. `CLAUDE.md` auto-loaded. Read `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, and the plan file at `~/.claude/plans/lovely-launching-marble.md` at session start.

## Session Greeting

S33 shipped a hotfix + PDF pass + mobile toolbar gating, then pivoted into a full adversarial audit. The audit surfaced real debt (broken backend auth, plaintext passwords, XSS, silent partial save, timezone bug, missing focus trap). **JR reviewed the audit, made 4 scoping decisions, and approved a plan.** The plan chunks the work into S33.5 → S40 across pre-demo and post-demo phases. **Demo is Tuesday 2026-04-14 — ~40 hours from handoff write time.**

**Your job next session: execute the plan starting at S33.5.** Do not re-plan. Do not re-audit. The plan is signed off.

## State

- Build: PASS (commit `fe51a03`)
- Tests: NONE
- Branch: main, all pushed
- Last 3 commits: `fe51a03` demo-critical PDF + mobile toolbar gate | `ddd40ab` PDF printer-friendly pass | `c65dbe7` stoDateKey hotfix
- Live: https://rainbow-scheduling.vercel.app (on `fe51a03`, Vercel redeployed)
- Untracked: `dist/`, `Photos/`, `package-lock.json` — S33.5 handles these

## This Session (what S33 actually did)

1. Fixed white-screen prod outage from `stoDateKey` typo at App.jsx:6451 (S33 perf-pass leftover). Built, committed, pushed as `c65dbe7`.
2. Printer-friendly PDF pass (role-colored outlines instead of fills, OTR navy header, +accent). Committed as `ddd40ab`.
3. Adversarial audit of PDF → 6 demo-critical fixes landed: timestamp footer, auto-print removed + sticky Print button, PTO `OFF` markers (needs `timeOffRequests` plumbing), Ontario ESA OT thresholds (amber ≥40, red ≥44), daily headcount row, `page-break-inside:avoid` + `thead` repeat, role/color fallbacks, `—` for unscheduled employees, PTO swatch in legend.
4. Mobile admin Row-3 (Edit/Save/Go Live/Publish) + Row-4 (Edit Mode banner + Fill/Clear Wk) gated on `mobileAdminTab === 'schedule' || 'mine'`. Requests/Comms now clean. Committed `fe51a03`.
5. Full-app adversarial audit → 21 findings (P0-P3). Presented to JR.
6. Plan approved after 4 clarifying questions. Plan file at `~/.claude/plans/lovely-launching-marble.md`.

## Hot Files

| Priority | File | Changed? | Why |
|----------|------|----------|-----|
| 1 | `~/.claude/plans/lovely-launching-marble.md` | New | **The plan.** Read first next session. Signed off by JR. |
| 2 | `src/App.jsx` | Yes | PDF generator at 485-651, mobile admin Row-3/4 gates at ~7967-8074, stoDateKey fix at 6451. S34 targets here. |
| 3 | `backend/Code.gs` | No | S36 target (post-demo). verifyAuth at 281-296, login at 302-338. |
| 4 | `src/MobileEmployeeView.jsx` | No | `MobileBottomSheet` at 531 needs focus trap in S38. |
| 5 | `docs/todo.md` | Yes | Up Next now references plan + session chunks. |

## Key Context

- **The plan is signed off.** Don't re-scope. If something surprises you during S34, note it and stay on plan. Escalate to JR only if the plan is provably wrong.
- **4 scoping decisions already made by JR (in plan Context section):**
  1. Auth: HMAC now, full session-tokens after owner meeting
  2. Demo cut: only user-visible bugs pre-demo, security rebuild post-demo
  3. Refactor: extract-as-we-fix, not a dedicated phase
  4. Repo hygiene: fix now
- **S34 is demo-blocking.** It must ship before Tuesday.
- **S33.5 is a warm-up** — 20-min repo hygiene before S34. Ask JR about `Photos/` (commit / gitignore / move elsewhere).
- **Smoke-load the built bundle, not just `npm run build`.** S33's typo passed build and white-screened prod. `vite preview` + click the affected flows before push.
- **Never parallel-Edit App.jsx.** Re-read before each edit.
- **Audit findings not in the plan** (deferred explicitly): phone numbers in PDF, FT/PT badges, QR code, staffing target indicator, drag-to-dismiss, OKLCH. Don't implement.

## Anti-Patterns (Don't Retry)

- **Inline `fixed inset-0 z-[100] modal-backdrop` for admin request modals** (since S32) — use `AdminRequestModal` helper at App.jsx:2843
- **Trusting `result.success` from `chunkedBatchSave`** (since S33) — partial saves currently return success. S34.4 fixes it; until landed, chunked-save callers cannot rely on success flag.

Graduated this session: "Rainbow brand = multiple colors" → `docs/lessons.md:18`. "No permission asks mid-execution" → auto-memory. "Bulk search/replace without smoke-load" → `docs/lessons.md:23`.

## Blocked

| Item | Blocked By | Notes |
|------|-----------|-------|
| Code.gs deploy | JR manual action | S36 will need this. Edit Code.gs in Apps Script → Deploy → Manage → Edit active. |
| HMAC_SECRET provisioning | JR manual action | S36 needs 32-byte base64 secret in Apps Script → Project Settings → Script Properties → `HMAC_SECRET`. |
| Email upgrade | JR providing sender email | Pre-existing blocker, not plan scope. |
| Browser verify | JR or Chrome-extension Claude | S35 task — CLI has no browser tool. |

## Verify On Start

- [ ] `git status` — clean on main, 3 untracked files listed (dist/, Photos/, package-lock.json)
- [ ] `git log --oneline -3` — top commit is `fe51a03`
- [ ] `npm run build` passes
- [ ] Read `~/.claude/plans/lovely-launching-marble.md` end-to-end
- [ ] Read `docs/todo.md` Up Next — references plan sessions S33.5 → S40
- [ ] Confirm demo date still 2026-04-14 (2 days out from handoff write)
- [ ] Confirm plan has not been edited by JR since approval (`ls -la ~/.claude/plans/lovely-launching-marble.md`)
- [ ] Before any Edit/Write: use `AskUserQuestion` to confirm "start S33.5 repo hygiene" OR whatever JR prefers to pick up on

## Stopping Point

Plan file written, approved, ready to execute. No code changes pending beyond `fe51a03`. Next session picks up at S33.5 (repo hygiene, ~20 min) and flows into S34 (demo-critical bugs, ~2-3 hrs). Both MUST ship before Tuesday.

## Forward-Looking

After S35 ships and demo clears: S36 + S37 are the big security rebuild. S38 + S39 can run in parallel. S40 closes the loop. Full dependency graph in plan file. Estimated total remaining work: ~13 hours across 6 sessions.
