<!-- SCHEMA: handoff
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time. Prior handoff deleted when new one is written.

Rules:
- Filename: YYYY-MM-DD-{short-slug}.md
- Required sections defined in HANDOFF_PROMPT.md.
- Do not duplicate full TODO.md or DECISIONS.md content; reference them.
- Do not restate adapter content. Do not become another adapter layer.
- ASCII operators only.
-->

# Handoff -- 2026-04-18 -- Sarvi batch shipped, awaiting deploy + test

## Session Greeting

Sarvi's post-demo 10-item batch was implemented this session against plan `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md`. Build is green. Nothing deployed to Rainbow prod yet; pitch deck fix IS live. The next session is about deploy + JR/Sarvi smoke test.

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md` (7 new entries dated 2026-04-18), and the plan file before touching code. `CONTEXT/LESSONS.md` has no new entries -- updates were all durable decisions.

First reply: 1-2 short sentences, a `Pass-forward:` line with only essential carryover, and exactly 1 direct question about how to proceed.

## State

- Project root: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: main, HEAD `1f073d7` == origin/main
- Working tree: DIRTY. Modified files span Sarvi-batch fixes across frontend + schema + 1 backend line:
  - `src/App.jsx` (items 1, 3, 5 autofill, 7, 8)
  - `src/modals/EmployeeFormModal.jsx` (item 5 UI)
  - `src/modals/ShiftEditorModal.jsx` (items 2, 12)
  - `src/modals/PKEventModal.jsx` (items 2, 12)
  - `src/panels/InactiveEmployeesPanel.jsx` (item 10)
  - `src/pdf/generate.js` (item 6)
  - `backend/Code.gs` (item 5 headers array)
  - `docs/schemas/sheets-schema.md` (item 5 doc)
  - `CONTEXT/TODO.md` + `CONTEXT/DECISIONS.md` + this handoff
- New file: `src/utils/eventDefaults.js` (shared `getPKDefaultTimes` helper)
- Build state: `npm run build` PASS (2026-04-18, uncommitted working tree)
- Pitch deck: LIVE at https://rainbow-pitch.vercel.app (2026-04-18 deploy; `three weeks` -> `two weeks` on Cost slide).
- Rainbow prod: NOT yet deployed. Apps Script still v2.21.x.
- Plan file: `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md` (approved by JR, edited slightly). Good to re-read for verification steps.

## This Session

- Shipped Sarvi batch 10 items per plan. 7 new DECISIONS entries cover durable choices.
- Pitch deck hotfix deployed (only cross-repo deploy this session).
- Item 11 (pitch): shipped + deployed.
- Item 5 (defaultSection): frontend + backend-headers + schema-doc + form UI. Manual Sheet column add + Apps Script redeploy required before go-live.
- Items 2+12 (PK Saturday): new `src/utils/eventDefaults.js::getPKDefaultTimes` used by both modals. PKEventModal tracks `timesUserSet` so manual overrides aren't stomped.
- Item 3 (Autofill PK Week): secondary toolbar button, sequential `bulkCreatePKEvent` per day, availability-filtered. Frontend-only (no backend change needed). ~50s worst-case for 7 days due to Apps Script ~7-8s floor.
- Item 6 (PDF greyscale): `ROLE_GLYPHS` prefix + `ROLE_BORDERS` style/width + OT bold+asterisk + Holiday "HOL" caption + Announcement italic+`[!]` + double border. Colors kept for color printers.
- Item 10 (Restore button): opacity-60 moved off parent row onto identity region only. Button re-skinned tonal-blue (`rgba(4,83,163,0.20)` bg, `#60A5FA` text, `rgba(4,83,163,0.40)` border).
- Item 8 (Hidden from Schedule): wrapped in existing `CollapsibleSection` with count badge + `defaultOpen={false}`.
- Item 7 (Former Staff): block removed from schedule grid entirely. Records preserved in backend. `deletedWithShifts` useMemo at `App.jsx:1845` is now dead code (flagged, not deleted per no-silent-removal rule).
- Item 9 (Dan/Scott): resolves from 7+8. No code changed specifically for them.
- Item 1 (autofill feedback): enhanced success toast to include week context + "click SAVE to persist" cue. Save button already had strong dirty visual (bright gradient + glow) -- left alone.

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `CONTEXT/TODO.md` | Active worklist: deploy, test, backup-cash clarification |
| 2 | `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md` | Plan with verification smoke steps |
| 3 | `CONTEXT/DECISIONS.md` | 7 new 2026-04-18 entries for the batch |
| 4 | `src/App.jsx` | Bulk of frontend edits; re-read before any change |
| 5 | `backend/Code.gs` | Only 1 line diff (headers array); still needs Apps Script deploy |
| 6 | `src/utils/eventDefaults.js` | New helper; cited by both modals + App.jsx |
| 7 | `docs/schemas/sheets-schema.md` | Employees tab now 21 cols (A-U) -- not yet reflected in live Sheet |

## Anti-Patterns (Don't Retry)

- Do not add a "backup cash" ROLE entry. Plan explicitly deferred pending Sarvi clarification with JR. Existing `backupCashier` stays.
- Do not re-inject deleted employees into the schedule grid. Sarvi 2026-04-18 explicitly wants them hidden even if they hold shifts.
- Do not hardcode `role: 'none'` in autofill paths. Use `employee.defaultSection || 'none'`.
- Do not use `THEME.accent.blue` for the Restore button -- that slot rotates daily. Brand blue `#0453A3` via literal hex is intentional for "recoverable administrative" signal.
- Do not touch adapters (`CLAUDE.md`, `.cursor/rules/context-system.mdc`) during this work.
- Do not fold "Autofill PK Week" into the same button as "Schedule PK". Per `applied-component-patterns.md` SS 2 they're primary vs secondary variants -- separate buttons.
- Do not strip color from the PDF. The greyscale encoding is redundant, not replacement.
- Do not delete `deletedWithShifts` useMemo at `src/App.jsx:1845` without JR confirmation. It's dead code post-Item-7 but removal is a separate cleanup.

## Blocked

See `CONTEXT/TODO.md` Blocked section. Top-of-mind: backup-cash role intent (Sarvi), Sheet column T header add + Apps Script redeploy (JR), Rainbow prod deploy (JR).

## Key Context

- Today is 2026-04-18. Demo was 2026-04-15.
- `defaultSection` writes before the Apps Script redeploy go through `updateRow` which tolerates extra fields -- but they won't persist unless the header exists. So: column header MUST be added before the frontend is used in anger.
- Sarvi uses the B&W break-room printer. All greyscale encoding in the PDF is designed around that. Don't let a future "simplify the legend" PR drop the letter glyphs.
- Item 1's fix is speculative (Sarvi's wording was ambiguous). If she reports "autofill still doesn't reflect" after deploy, get a concrete repro (screen recording, which button, which week) before guessing again.
- Plan is at `~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md` (not in repo).
- Creative-Partner KB at `~/APPS/Creative-Partner/reference/` informed design choices. The 5 files cited in plan Context block are worth re-reading before any further UI change.

## Verify On Start

- `git status` -- dirty, ~9 tracked + 1 new untracked (`src/utils/eventDefaults.js`); confirm before operating
- `git log --oneline -1` -- should show `1f073d7`
- `npm run build` -- should still PASS (last green 2026-04-18)
- Re-read `CONTEXT/TODO.md` Active section for next step ordering
- Confirm no additional Sarvi items arrived since 2026-04-18 (ask JR)

## Next Step Prompt

Ask JR whether to:
(a) Commit the Sarvi batch as one commit (explicit paths, no `-A`) and push,
(b) Split into per-item commits first (heavier but easier to revert one item),
(c) Wait until JR has done the manual Sheet column add + Apps Script redeploy so the commit covers a known-good state, or
(d) Deploy Rainbow frontend now (`vercel --prod --yes`) so Sarvi can smoke on real data while JR handles Sheet + Apps Script.

Recommended default: (a) commit now, then (d) deploy. Manual Sheet + Apps Script can happen before or after the commit -- they don't depend on commit state.

If JR wants a full state sanity pass first:
```
git status
git diff --stat
npm run build
cat ~/.claude/plans/so-sarvi-gave-me-quizzical-perlis.md | head -40
```
