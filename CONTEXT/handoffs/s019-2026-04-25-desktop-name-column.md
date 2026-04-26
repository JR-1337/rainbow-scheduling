# s019 -- 2026-04-25 -- Desktop name column: fixed grid + mobile-style first/rest

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/ARCHITECTURE.md` first, then resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, one `Pass-forward:` line, and exactly 1 direct question about how to proceed.

Pass-forward: Shipped name-column work is on `main` at `a07ab98` -- next gate is JR prod check after Vercel + hard-refresh.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP` (owns `CONTEXT/`).
- Git: branch `main`, clean working tree, `HEAD` `a07ab98`, in sync with `origin/main` (pushed 2026-04-25). No `LOOP/` in this repo (use default handoff, not HANDOFF-LOOP).
- Active focus: desktop admin + employee schedule **name column** UX. Shipped in two commits: `c622d97` (wide column + shared `DESKTOP_SCHEDULE_GRID_TEMPLATE`), `a07ab98` (fixed 240px, `splitNameForSchedule`, first line + rest line like mobile, `truncate`, `title`). Vercel deploy follows push; JR must hard-refresh to see new bundle.
- If switching harnesses: read `CONTEXT/*` first; repair adapters only if routing is stale.

## This Session

**Work (code, already on `main`):**

- Problem: 140px + `truncate` hid names; later `max-content` per separate row grid misaligned day columns; line-clamp alone still looked uneven vs mobile.
- Fix: `DESKTOP_SCHEDULE_NAME_COL_PX` 240 + one template string for App header, `EmployeeRow`, `EmployeeView` grids, `ScheduleSkeleton`. `splitNameForSchedule` in `employeeRender.js`. Admin: first (semibold), rest (muted `text-[10px]`), hours third. Employee desktop: `(You)` on first line with first name.
- `npm run build` PASS before push. User required explicit `git push` for Vercel; session ended with push to `origin/main`.

**Memory sync (this handoff run):** `TODO.md` (Active + Verification + Completed), new `DECISIONS.md` entry 2026-04-25 desktop name column, `ARCHITECTURE.md` key files, `LESSONS.md` increment on "Push and confirm deploy" (`Affirmations` 0 -> 1).

## Hot Files

- `src/constants.js` -- `DESKTOP_SCHEDULE_GRID_TEMPLATE`, `DESKTOP_SCHEDULE_NAME_COL_PX`
- `src/components/EmployeeRow.jsx` -- admin desktop name cell
- `src/views/EmployeeView.jsx` -- `EmployeeViewRow` name cell; `getEmployeeHours` removed from row props (unused)
- `src/utils/employeeRender.js` -- `hasTitle`, `splitNameForSchedule`
- `src/App.jsx` -- header row grid (imports template)
- `src/components/uiKit.jsx` -- `ScheduleSkeleton` grid

## Anti-Patterns (Don't Retry)

- **max-content** on column 1 of desktop schedule when header + each `EmployeeRow` is its own CSS Grid -- each grid resolves a different width, day column edges drift.
- **Widen only** without the same `gridTemplateColumns` on header and every body row.
- **Naive next move:** extract shared `NameCell` before JR confirms prod smoke on current markup -- scope creep; optional later per DECISIONS rejected line.

**Decanting (Step 2a):**

- **Working assumptions:** Desktop uses **multiple sibling grids** (one header, N row grids), not one `<table>`. Column 1 must be **fixed** px, not auto max-content, for alignment. Recorded in `DECISIONS.md` and this handoff; `ARCHITECTURE.md` key files updated.
- **Near-misses:** `line-clamp-2` on full name; `minmax(200px, max-content)` on col1 in isolated rows.
- **Naive next move:** see above (widen or max-content without grid invariant).

## Blocked

- None on this handoff. Same long-standing `Blocked` in `TODO.md` (email, S62, CF cache, etc.).

## Key Context

- Durable entry: `CONTEXT/DECISIONS.md` -- `2026-04-25 -- Desktop schedule name column: fixed 240px + first/rest split (match mobile)`.
- Sibling: `~/APPS/RAINBOW-PITCH` -- not touched.
- OTR invariants (Sheets headers, `publishedShifts` gate, ESA 44h flag, brand colors) unchanged this session.

## Verify On Start

- Read `git log -1` and confirm `a07ab98` if resuming this thread.
- If `DECISIONS.md` is near 600+ lines, consider archive pass per schema (oldest to `archive/decisions-archive.md`); this handoff did not run a bulk archive.
- Next model: confirm Vercel finished deploy, then `view-source` or network tab for new `index-*.js` if JR says "old UI".

## Next Step Prompt

1. **(a) Shipped-unverified:** JR **prod** phone-smoke or desktop check: name column 240px, day lines align under header, long first+last names, `title` hover, employee desktop `(You)`.
2. (b) If JR reports misalignment, compare computed first column width (header vs first body row); `gridTemplateColumns` must match in `App.jsx` and `EmployeeRow`.
