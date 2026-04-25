# s014 -- 2026-04-25 -- Perf-fix wave 1 shipped (ScheduleCell memo + PDF lazy)

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md`, then resume from `State` and `Next Step Prompt` below. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: HEAD `7940284` pushed to origin/main. New stack `feb094b` (perf grid) and `3cf6b09` (perf bundle) and `7940284` (CONTEXT tail) on top of `66dae73`.
- Branch: main, tree clean.
- Active focus: perf wave 1 shipped + localhost-smoked, awaiting JR prod phone-smoke after Vercel redeploy. Wave 2 candidate is ColumnHeader extract + scheduledByDate useMemo (still HIGH per audit). Planning-skill build still deferred per s012/s013.
- Sibling repo: `~/APPS/RAINBOW-PITCH` -- no changes this session.

## This Session

Two threads.

**Thread 1 -- Perf-fix wave 1 (`feb094b` + `3cf6b09`)**

JR triaged the s013 perf audit and picked "Bundle ScheduleCell + PDF lazy" -- two scoped commits in one session. Workflow: plan-mode -> ExitPlanMode -> Sonnet executor (general-purpose, sonnet model).

Plan at `~/.claude/plans/swift-beaming-treehouse.md`.

Commit `feb094b` -- ScheduleCell memo restored at parent callsite. Module-level `EMPTY_EVENTS = Object.freeze([])` sentinel in `src/components/EmployeeRow.jsx` replaces `events[key] || []` (was allocating fresh `[]` per render). ScheduleCell prop renamed `onClick` -> `onCellClick`; the bound closure now constructs internally inside the JSX (`onClick={isClickable ? () => onCellClick(employee, date, shift) : undefined}`). Bundle delta +0.02 kB (identity-only).

Commit `3cf6b09` -- PDF lazy-load. Removed `import { generateSchedulePDF } from './pdf/generate'` at App.jsx:34. Added `handleExportPDF` useCallback wrapper near other callbacks (around line 1385) using `await import('./pdf/generate')` on demand. Both call sites (mobile drawer 1754 + desktop button 1976) call `handleExportPDF()`. Bundle delta modern -10.33 kB raw / -2.70 kB gzip; legacy -7.43 / -2.81. New `generate-Bj_J3QUY.js` chunk 11.77 kB modern / 10.12 kB legacy emitted.

Localhost Playwright smoke PASS:

- Desktop 1400x900: clicked empty cell row 0 + row 2; both opened ShiftEditorModal with correct (employee, date) tuple ("Edit Shift / Alex Fowler / Thursday, April 23"). Escape closed cleanly.
- Mobile 390x844: opened More drawer -> tapped "Export Schedule PDF"; drawer closed and a real PDF blob "Rainbow Schedule - Week 17 & 18" generated.
- Network: `pdf/generate.js` ABSENT on initial admin boot; only fetched after explicit dynamic import call. Confirmed lazy contract.
- Console: 0 errors, 0 warnings across full smoke session.

Tail commit `7940284` carries CONTEXT writes (TODO.md updates + the combined DECISIONS.md entry for both fixes).

**Thread 2 -- Audit correction (durable lesson worth carrying forward)**

The s013 perf audit's HIGH on ScheduleCell **misdiagnosed the cause**. It cited `style={{...}}` literals at `src/components/ScheduleCell.jsx:49-52` as the memo-buster. Wrong: those styles are *internal* JSX expressions; `React.memo` only inspects incoming props, never internal expressions or rendered DOM attributes. The real busters lived at the parent callsite ([src/components/EmployeeRow.jsx:47](src/components/EmployeeRow.jsx#L47)):

- `events={cellEvents}` where `cellEvents = events[key] || []` allocated a fresh `[]` for the (very common) empty-events case.
- `onClick={() => !isDeleted && !isLocked && onCellClick(...)}` allocated a fresh closure for every cell.

Re-verification confirmed all upstream EmployeeRow callsite props were already stable (handlers `useCallback`-wrapped at App.jsx:1376/1381 with `[]` deps; tooltip handlers in `src/hooks/useTooltip.js`; `currentDates` ternary over memoized refs; `getStoreHoursForDate` returns refs from constants). So the parent fix is the only fix needed.

I flagged the misdiagnosis to JR before plan-mode. JR confirmed proceeding with corrected scope.

**Writes to canonical memory this session**

- `TODO.md`: Updated Item 3 (perf audit) to record wave 1 shipped + ColumnHeader queued for wave 2. Added 2 Verification entries (build at `3cf6b09` + Playwright PASS desktop+mobile). Added 1 Missing-validation entry (prod phone-smoke pending). Added Completed entry covering both fix commits with the audit-correction context.
- `DECISIONS.md`: Added one combined entry "2026-04-25 -- Perf-fix wave 1: ScheduleCell memo at parent callsite + PDF lazy-load" with rationale (audit misdiagnosis + lazy-on-demand vs preload tradeoff) and 5 rejected alternatives. Confidence H verified 2026-04-25.
- `ARCHITECTURE.md`: no change. Memoization correctness is implementation detail, not architecture.
- `LESSONS.md`: no change. The "audit findings are starting maps not gospel" rule is already captured by the audit doc's own framing (`Treat as a starting map, not gospel; verify each finding by re-reading the cited lines before acting.`) and is now reified in this handoff's Anti-Patterns. Promote to LESSONS only if it recurs.

Decanting: clean (working assumption -> DECISIONS rationale; near-misses -> DECISIONS rejected alternatives; naive-next-move -> Anti-Patterns).

Audit: clean (style soft-warns are pre-existing schema artifacts; my newly-added CONTEXT lines verified ASCII-clean via `git show 7940284`).

## Hot Files

- [src/components/EmployeeRow.jsx](src/components/EmployeeRow.jsx) -- the actual perf fix lives here (line 8 sentinel; line 43 cellEvents; line 47 ScheduleCell props).
- [src/components/ScheduleCell.jsx:21,48](src/components/ScheduleCell.jsx#L21) -- prop rename `onClick` -> `onCellClick`, internal closure construction.
- [src/App.jsx](src/App.jsx) -- import line removed (was 34); handleExportPDF wrapper near 1385; call sites at 1754 + 1976.
- `docs/perf-audit-app-jsx-2026-04-25.md` -- audit doc unchanged. Remaining wave 2 / 3 candidates: HIGH ColumnHeader extract + scheduledByDate useMemo, MED getScheduledCount O(n^2) (ties to ColumnHeader work), MED EmployeeFormModal monolithic state, 2 LOWs (todayStr useMemo, inline column-header onClick).
- `~/.claude/plans/swift-beaming-treehouse.md` -- this session's executed plan.
- `~/.claude/skill-drafts/coding-plan-skill-spec.md` -- still queued for the planning-skill build chat.

## Anti-Patterns (Don't Retry)

- Do NOT trust audit cause-of-finding without verifying. The s013 audit's HIGH on ScheduleCell misdiagnosed the cause (internal `style={{...}}` is invisible to React.memo). Always re-read the cited file:line and walk the upstream callsite chain BEFORE scoping any memo-related fix. React.memo only inspects incoming props.
- Do NOT auto-bundle the remaining audit findings as "wave 2". JR triages each individually. ColumnHeader extract is the natural next candidate but requires a fresh JR pick. MEDs (EmployeeFormModal monolithic state, getScheduledCount) and LOWs wait for explicit motivation.
- Do NOT pre-load the PDF chunk on admin mount via `useEffect`. Defeats the bundle savings the lazy-load was meant to capture. First-click ~200ms stall is acceptable for ~once-per-period action.
- Do NOT propose passing cellBgColor + cellBorderColor as separate string props (the audit's original suggestion). The color logic uses 6+ inputs (hasSick, shift, isTitled, role, eventOnly, firstEventType, THEME); moving upstream forces every consumer to re-derive.
- Do NOT useMemo the style object inside ScheduleCell. Memo never sees internal style; only saves a single object allocation per render.
- Do NOT spawn a Sonnet executor to implement the planning skill before JR walks through it interactively. Restated from s013 -- still binding.
- Do NOT delete `TEST-ADMIN1-SMOKE` programmatically. JR's manual job. Restated from s012/s013.

## Blocked

- JR to phone-smoke perf wave 1 on prod (`feb094b` + `3cf6b09`) after Vercel redeploy -- since 2026-04-25
- JR to manually delete `TEST-ADMIN1-SMOKE` employee from Employees sheet -- since 2026-04-25
- JR to triage perf wave 2 -- ColumnHeader extract + scheduledByDate useMemo is the next candidate; MEDs and LOWs wait on motivation -- since 2026-04-25
- Planning-skill creation walkthrough -- deferred to next chat per JR -- since 2026-04-25
- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12

## Key Context

- New build baseline: HEAD `3cf6b09`, modern 472.30 kB / gzip 118.46 kB; legacy 492.84 / gzip 119.95. PDF chunk emitted separately at 11.77 kB modern / 10.12 kB legacy. Re-baseline from this point before any future perf work.
- Memo correctness rule: React.memo compares INCOMING props by shallow equality. Internal JSX (style objects, inline closures, computed expressions) is invisible to memo. Memo-busting must be diagnosed and fixed at the PARENT callsite, never inside the memoized component itself.
- Module-level `Object.freeze([])` is the canonical "stable empty array sentinel" pattern for memo-friendly default props. Use the same pattern for default-empty objects (`Object.freeze({})`).
- The audit doc at `docs/perf-audit-app-jsx-2026-04-25.md` itself is read-only and unchanged. Wave 1 fixes shipped; remaining findings still listed there for future triage.
- Today's date: 2026-04-25.

## Verify On Start

1. Read `CONTEXT/TODO.md` (now records perf wave 1 shipped + new bundle baseline + missing prod phone-smoke), `CONTEXT/DECISIONS.md` (top entry is the wave 1 combined decision with rationale), `CONTEXT/LESSONS.md` (unchanged this session).
2. Check git: `git log --oneline -5` should show `7940284`, `3cf6b09`, `feb094b`, `66dae73`, `21ce873`. `git status` should be clean.
3. If JR confirms prod phone-smoke PASS: move "Missing validation: prod phone-smoke of perf wave 1" entry from Verification to Last-validated; close the loop.
4. If JR pivots to perf wave 2: read `docs/perf-audit-app-jsx-2026-04-25.md` ColumnHeader finding fresh + verify cited file:line BEFORE scoping any fix (lesson from this session re: audit misdiagnosis).
5. If JR pivots to planning-skill build: read `~/.claude/skill-drafts/coding-plan-skill-spec.md` first, then ask which of the 7 open spec questions to settle first.
6. Reminder JR if not yet done: delete `TEST-ADMIN1-SMOKE` from Employees sheet.

## Next Step Prompt

Default per HANDOFF check order: (a) shipped-but-unverified work needs validation = perf wave 1 prod phone-smoke pending, so this is top.

Three natural next moves; JR picks:

- (a) **Confirm prod phone-smoke of perf wave 1** -- JR taps a cell on phone (should open ShiftEditorModal as before) + taps Export Schedule PDF from More drawer (first tap stalls ~200ms while chunk loads, then PDF arrives; subsequent taps instant). On PASS: update TODO Verification, close the loop, move to (b).
- (b) **Perf wave 2 -- ColumnHeader extract.** Read audit doc fresh, verify the cited App.jsx:2211-2240 + getScheduledCount at App.jsx:617-624 callsites BEFORE scoping. The fix is bigger surgery (~30 line component extract + scheduledByDate useMemo). Plan-mode -> ExitPlanMode -> Sonnet executor. Same workflow JR validated for wave 1.
- (c) **Planning-skill build (still deferred).** Walk JR through skill anatomy + SKILL.md frontmatter + tools list + when-to-trigger heuristics. Input: `~/.claude/skill-drafts/coding-plan-skill-spec.md`. Settle the 7 open spec questions first, then write `~/.claude/skills/<name>/SKILL.md`. JR explicit ask: go slow, dogfood plan-mode for the skill itself.

Pass-forward: perf wave 1 (ScheduleCell memo + PDF lazy) pushed to origin/main awaiting JR prod phone-smoke; next decision is wave 2 ColumnHeader extract or planning-skill build.
