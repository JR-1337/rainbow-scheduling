<!-- SCHEMA: DECISIONS.md
Version: 1
Purpose: durable product, architecture, and workflow decisions with rationale.
Write mode: append new entries at the top. Reverse chronological.

Rules:
- Newest entries at the top.
- Every entry has: date heading, decision title, rationale, Confidence level.
- Confidence scale: H (high), M (medium), L (low).
- Confidence grammar (regex-enforceable):
    Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD
    Confidence: M( -- <verification hint>)?
    Confidence: L -- <what would verify>
- Confidence: H-holdout is used on entries graduated from auto-loop with
  held-out task scoring passing. Use plain H if the mode predates holdout
  retrofit or the Candidate was promoted without holdout scoring.
- Confidence: M is the default when verification is absent or stale.
- Optional Source field: human (default, omit) or meta-agent-ratified.
  Used when the decision came from auto-loop observation rather than direct human choice.
  Unratified proposals live in LOOP/<mode>/observations.md Candidates, not here.
- Optional Evidence field: <mode>/<tag> (<metric>: <value>). Reference only.
  Links a decision to the run that produced the signal.
- Invalidated entries get marked `Superseded` but stay in the file. Do not erase.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only.
-->

## 2026-04-25 -- Perf-fix wave 1: ScheduleCell memo at parent callsite + PDF lazy-load
Decision: Two scoped commits triaged from `docs/perf-audit-app-jsx-2026-04-25.md` ship together as wave 1. (1) ScheduleCell memo restoration (`feb094b`) -- the fix lives at the parent callsite in `src/components/EmployeeRow.jsx`, not inside ScheduleCell. Module-level frozen sentinel `EMPTY_EVENTS = Object.freeze([])` replaces `events[key] || []`; ScheduleCell prop renamed `onClick` -> `onCellClick`, internal closure constructs `() => onCellClick(employee, date, shift)` per render. (2) PDF lazy-load (`3cf6b09`) -- removed static import at App.jsx:34; added `handleExportPDF` useCallback wrapper using `await import('./pdf/generate')` on demand; both call sites (mobile drawer line 1754, desktop button line 1976) invoke the wrapper.
Rationale: Audit's HIGH on ScheduleCell misdiagnosed the cause -- claimed internal `style={{...}}` on lines 49-52 broke memo, but `React.memo` only compares incoming props, never internal JSX. Real busters lived at parent: fresh `[]` allocation for empty-events case (very common) + inline arrow onClick. Fix at parent is smaller blast radius and addresses the actual cause. PDF lazy-load on-demand (not preload-on-admin-mount) preserves the bundle savings the lazy-load was meant to capture; first-click ~200ms stall is acceptable for an action Sarvi runs ~once per 2-week period.
Confidence: H -- verified 2026-04-25 build PASS at `3cf6b09` (modern 472.30 kB / gzip 118.46 kB, -10.33 raw / -2.70 gzip vs baseline; legacy 492.84 / 119.95, -7.43 raw / -2.81 gzip; new `generate-*.js` chunk emitted) + localhost Playwright PASS at 1400px desktop (cell click row 0 + row 2 opened ShiftEditorModal with correct context) + 390x844 mobile (drawer Export Schedule PDF generated real blob "Rainbow Schedule - Week 17 & 18"); zero console errors. Prod phone-smoke pending after push.
Rejected alternatives:
- Audit's "pass cellBgColor + cellBorderColor as separate props" -- rejected, those values are computed from 6+ inputs (hasSick, shift, isTitled, role, eventOnly, firstEventType, THEME); moving computation upstream forces every consumer to re-derive. Internal computation is correct; memo issue lives at parent.
- `useMemo` the style object inside ScheduleCell -- rejected, style is internal, memo never sees it; only saves a single object allocation, cheap.
- Pre-load PDF chunk on admin mount via `useEffect` -- rejected, PDF export is rare (once per 2 weeks per Sarvi); pre-loading wastes the bundle savings the lazy-load was meant to capture.
- Bundle into one commit -- rejected, the two fixes are independent (one render-perf, one bundle-size) and should be revertable separately.
- Ship ColumnHeader extract in same wave -- deferred per JR triage (~30 line surgery, separate session for clean attribution).

## 2026-04-25 -- Admin Tier 1 inherits the title field (DRY render via hasTitle helper)
Decision: Admin (Tier 1) employees now use the same `title` rendering pattern as admin2 -- title input + validation in EmployeeFormModal, neutral cell render (text.primary on bg.tertiary, default border), no PDF glyph or 2px border, static Title chip in ShiftEditorModal, self-view shows title in EmployeeView and MobileEmployeeView, tooltip shows Title line. Shipped via shared predicate `hasTitle(emp) = !!emp && (emp.isAdmin || emp.adminTier === 'admin2')` at `src/utils/employeeRender.js`. Replaces every `adminTier === 'admin2'` render branch with the helper across 8 files (ScheduleCell, MobileAdminView, pdf/generate, ShiftEditorModal, EmployeeView, MobileEmployeeView, App.jsx tooltip, EmployeeFormModal). Tooltip Shield color stays per-tier (admin1 purple, admin2 blue) -- the only visual divergence between tiers.
Rationale: JR ask 2026-04-25 -- "i need admin1 to have the same title functionality as the admin2. admin1 gets titles instead of roles." Concrete reason: at OTR, "Admin" (Tier 1) is also a leader (asst manager, lead buyer) who doesn't man a role section -- they need an identity label, same as admin2. Tiers differ only on (a) write permissions and (b) accent color, NOT on schedule cell render. Single helper avoids the next 8-file shotgun edit when admin3 lands.
Confidence: H -- verified 2026-04-25 build PASS at HEAD `303e4c5`. Bundle delta -0.03 kB gzip. Playwright smoke partially complete (steps 1-9 advanced; killed at step 10 cleanup hang); JR phone-smoke pending.
Rejected alternatives:
- Inline `(adminTier === 'admin1' || adminTier === 'admin2')` at every callsite -- rejected, defeats the DRY motivation. Future tier add would re-shotgun.
- Force-clear `defaultSection` to `'none'` on Admin picker click -- rejected per JR's orthogonality rule (1 click = 1 field). Render layer ignores defaultSection for hasTitle employees, so leaving it is harmless metadata.
- Force-clear `title: ''` on Staff picker click -- rejected, persists silently across tier transitions; render layer never reads it for non-titled employees.
- Exempt Owner from hasTitle -- rejected, owner has `isAdmin: true` and is treated as admin everywhere else; uniform treatment.

## 2026-04-25 -- Picker buttons obey orthogonality (1 click = 1 field)
Decision: Tier picker buttons (Staff / Admin / Admin 2) in EmployeeFormModal now write only `isAdmin` and `adminTier`. Prior implementation (admin2 Phase 2) bundled `showOnSchedule`, `defaultSection: 'none'`, and `title: ''` writes per click. Stripped to minimum. Saved as auto-memory directive (one-time inline correction, not a separate memory file per JR ask).
Rationale: JR caught two regressions caused by bundled writes -- (a) toggling to Admin force-hid the employee from the schedule grid (`showOnSchedule: false` write), patched in `5fece50`; (b) JR's general principle re-stated: "any employee of any level's visibility persists independently of them moving levels or roles. or anything. i changed 1 setting not two. thats simple logic." Rule: a UI control mutates only the field(s) it nominally owns. Adjacent fields stay untouched.
Confidence: H -- direct user instruction, durable rule. Verified at HEAD `5fece50` (showOnSchedule fix) and HEAD `303e4c5` (admin1-title commit, which carries the broader picker cleanup).
Rejected alternatives:
- Keep `defaultSection: 'none'` write on Admin/Admin 2 buttons "for data-model cleanliness" -- rejected, render layer ignores defaultSection for titled employees so the cleanup was cosmetic and violated orthogonality.
- Keep `title: ''` clear on Staff button "to avoid stale data" -- rejected, title persists silently and is harmless for staff (no UI surface reads it).

## 2026-04-25 -- Clear dropdown covers part-timers; Auto-Fill stays FT-only
Decision: Clear gained "All Part-Timers" + per-PT individual rows on both desktop admin (App.jsx Clear `<select>`) and mobile admin (MobileScheduleActionSheet level=`clear`). Backend wiring added a `clear-all-pt` handler branch that calls `clearWeekShifts(weekDates, partTimeEmployees)`. Auto-Fill remains full-time-only because PT default-shift logic is per-employee and Sarvi already books PT manually (decision preserved from S60-era design). One `partTimeEmployees` memo derived from `schedulableEmployees` mirrors `fullTimeEmployees`.
Rationale: JR flagged that there was no way to clear a part-timer's week — every other clear operation existed for FT but not PT. Mirroring the FT structure (All + individuals) gives Sarvi the same precision for both groups while preserving the intentional Auto-Fill asymmetry.
Confidence: H -- verified 2026-04-25 build PASS at HEAD `d678948`. Prod smoke pending.

## 2026-04-25 -- All UI fixes apply to mobile AND desktop in one commit
Decision: Saved as auto-memory `feedback_mobile_desktop_parity.md`. Whenever a UI bug fix or styling pattern is patched, audit ALL four schedule render paths (App.jsx desktop admin, EmployeeView desktop employee, MobileAdminView, MobileEmployeeView) plus shared components (ScheduleCell, ShiftEditorModal, etc.) and ship to every applicable surface in one commit.
Rationale: 2026-04 had two bugs that recurred because a fix landed on only one of the four surfaces — translucent sticky day-header (`39ca4a5` fixed only MobileEmployeeView; MobileAdminView stayed broken until `daa4bbb`); and the broader pattern of asymmetric mobile/desktop UI behavior. JR explicit ask 2026-04-25: "we need to make sure all the fixes we apply are applied to both mobile and desktop if applicable."
Confidence: H -- direct user instruction, durable rule.

## 2026-04-25 -- Schedule day-header opacity: layered linear-gradient over bg.tertiary
Decision: All four schedule grid headers (App.jsx desktop admin, EmployeeView desktop employee, MobileAdminView, MobileEmployeeView) use `background: linear-gradient(${tint}, ${tint}), ${THEME.bg.tertiary}` for today/holiday cells. The gradient is solid translucent tint, layered over an opaque bg.tertiary base. Net effect: cell looks tinted purple/amber, but is opaque — scrolling body cannot show through on sticky headers.
Rationale: Hex-alpha shorthand (`THEME.accent.purple + '20'`) made the cell genuinely transparent; on `position: sticky` mobile headers the scrolling table body bled through. Prior commit `39ca4a5` solved this on MobileEmployeeView only; this session extended the pattern to the other three views.
Confidence: H -- verified build PASS + visual logic at HEAD `daa4bbb`.

## 2026-04-25 -- Sick reason in-cell render (admin views): italic muted, replaces struck time/hours
Decision: When a sick event has a non-empty `note`, the desktop ScheduleCell and MobileAdminView day cell render the note as a single-line `font-style: italic` `THEME.text.muted` truncated span IN PLACE OF the struck time/hours row. Empty reason → falls back to the original struck time/hours + 0h treatment. Hover-`title` carries full text for long reasons. Sick toggle Save button no longer disabled; `handleSave` now flushes any pending `sickNote` so tap-Save-without-blur persists. Employee views unchanged (MobileEmployeeView already rendered inline; desktop employee + admin keep tooltip-only as scope decision).
Rationale: Reason was captured but invisible to admins on touch (HTML `title` doesn't show on tap). Sarvi's primary device is iPad/phone. Design synthesized from Creative-Partner UX research files (L0-05 gestalt, L0-06 visual hierarchy, L1-06 applied UI/UX): replace the time/hours row (semantically dead when struck + 0h) instead of stacking a third row (Prägnanz / proximity). Italic differentiates as supporting metadata via STYLE not weight/color (the amber bg + red diagonal + struck text already saturate the cell's color budget). Same `text.muted` color as the struck role above keeps hierarchy: role first, reason second.
Confidence: H -- verified 2026-04-25 localhost Playwright at HEAD `4504990` (Save-without-blur persisted reason; italic muted span rendered rgb(139,133,128); empty-reason fallback shows struck time/hours).
Rejected alternatives:
- Reason as a third row -- rejected, cell already 56-66px tall, would crowd.
- Replace the role row -- rejected, audit trail loss.
- Bold or colored reason -- rejected, competes with the struck role + amber + red stripe focal point.
- Icon prefix (speech bubble, sticky note) -- rejected, italic alone is sufficient single differentiator.
- THEME.text.secondary (#5C5C5C, 6:1 contrast) -- rejected, would make reason DARKER than struck role above, inverting hierarchy. Stayed muted (3.4:1, passes AA Large for italic supporting text).

## 2026-04-25 -- Floor Supervisor role added (OTR green, FS glyph)
Decision: New role `floorSupervisor` between `womens` and `floorMonitor` in ROLES order. Short label `Supervisor` (was `Super` initially; renamed per Sarvi feedback at `39c2d62`). Full label `Floor Supervisor`. OTR green `#00A84D` from THEME.roles. PDF glyph `FS` in `monitor` family (italic Medium typography). 2px ink cell border extended to both supervisory roles in PDF. Employee form's "Default Section" label renamed to "Default Role" (field stays `defaultSection` in code + Sheet — pure copy change).
Rationale: TODO Item 2 backlog. Per-role behavior is mostly data-driven (ROLES + ROLES_BY_ID maps), so add-a-role is mechanical: one entry in constants.js, one color in theme.js, one glyph + family + cellBorder branch in pdf/generate.js, comment update in backend/Code.gs. Floor Supervisor is treated as a peer to Floor Monitor (both supervisory, both 2px ink border) but visually distinct via OTR-green color.
Confidence: H -- verified 2026-04-25 localhost Playwright at HEAD `98920d3` then `39c2d62` (dropdown lists 8 roles with Floor Supervisor present, ShiftEditorModal role picker shows Supervisor button, selected fills rgb(0,168,77), grid cell role text renders OTR green). Prod smoke pending.

## 2026-04-24 -- ShiftEditorModal redesign (absence toggle + peer activity toggles)
Decision: Shipped the sick shift type, then iterated the modal through JR feedback into a toggle-based design that separates absence from activity. SUPERSEDES the earlier sick-as-tab design (commit d6a83b2 DECISIONS entry) which stacked sick as a peer tab next to work/meeting/pk.

Final shape (HEAD c012e1d):
- **Absence section** (top, admin-only): amber-bordered container with Thermometer icon + "Mark as sick"/"Called in sick" label + switch. Switch persists immediately (tap = save/delete). Reason input commits on blur. Amber palette (sickBg #FEF3EC / sickText #9A3412 / sickBorder #F59E0B) — deliberate pattern-interrupt vs the blue scheduled activities below.
- **Scheduled toggles** (middle): three peer buttons Work / Meeting / PK in a unified blue palette (gestalt similarity — they're all "scheduled activity"). Tap-always-toggles: unlit tap books with type defaults (immediate save), lit tap unbooks (immediate save). No focus/select intermediate step. Each booked type renders its own inline edit form (stacked) with its time pickers + type-specific fields (role/task for work; note for meeting/pk) — no single-focus `activeType` gate.
- **Hours cards**: TODAY + PERIOD; sick zeroes TODAY.
- **Footer**: red trash (clearDay) wipes work + all events + sick in one pass; Cancel closes; Save persists all booked drafts.
- **Cell treatment**: when sick is present, cell bg flips to amber sickBg, role/time/hours text renders struck-through + muted, AND a thin red diagonal stripe (#DC2626, red-600, NOT OTR brand red) runs bottom-left-to-top-right. Three cues stacked = unmistakable "not here" even at a glance across a dense grid. Applied in ScheduleCell (desktop admin) + MobileAdminView.
- **Unified warning**: one amber box above the toggles. Fires when the employee is marked unavailable / has approved time off for ANY scheduled activity (work/meeting/pk, not just work), and/or when a work booking would put them on a 5+ consecutive-day streak. One reason → inline line; multiple → bulleted list with specific parts bolded (weekday name, ordinal, "unavailable", "approved time off", "Nth consecutive").

Compliance layer (unchanged from first sick-mark pass): `computeDayUnionHours` short-circuits to 0 on any sick entry; `getEmpHours` fast path skips sick days; `computeConsecutiveWorkDayStreak` takes optional `sickLookup` to break the streak; `getScheduledCount` (App.jsx) + PDF headcount reducer (src/pdf/generate.js) both drop sick-day employees. ESA 44hr flag auto-picks up because it reads `totalPeriodHours={getEmpHours(...)}`.

Backend unchanged (generic on `type` column). Admin gate on Absence section + backend `verifyAuth(true)` on all shift writes = belt-and-suspenders.

Stack: 13 commits ec184df..c012e1d.

Rationale:
- JR rejected sick-as-tab: "the buttons for work meeting or pk is one thing. sick is another thing. it's listed as if it's the same and the whole type of work looks sloppy UI." Gestalt similarity (Creative-Partner L0-05) says same-function items should look alike; sick is different-function so it needs pattern-interrupt.
- JR rejected focus-before-toggle: "the first press acts as a selector and only once selected it acts as a toggle. if pk is highlighted, I have to select meeting and then click again to delete the pk." Fix was to remove the focus gate and show each booked type's form inline simultaneously.
- JR rejected the faint sick badge: "the sick doesn't say sick anymore. maybe a thin line diagonal through the card in a specific red shade?" Red diagonal stripe is additive to the amber bg + struck work text = three redundant cues.
- Work row preservation keeps "who was originally scheduled" for payroll/audit; hours zero-out via compute-layer override, not by mutating the row.

Bugs found and fixed during iteration (captured for next session's anti-patterns):
- `projectedTotal` double-subtracted work hours when sick was already saved (totalPeriodHours already excluded the day via getEmpHours sick-guard) → PERIOD showed "-8h" for an 8h-only employee. Fix: check `sickAlreadyPresent` before subtracting.
- `activeType` useEffect reset clobbered user's tap intent on book (book PK → effect saw work first → activeType reset to 'work' → second tap on PK focused instead of unbooked). Fix: remove setActiveType from the data-change effect; initialize once via useState initializer. Later: removed `activeType` entirely when stacking forms.
- `existingShift` was passed as `editingShift.shift` (frozen snapshot captured on cell click) — Meeting/PK read live `events[...]` so they toggled; Work read the frozen snapshot so taps had no effect ("can't deselect"). Fix: both modal call sites now read live from `shifts[${empId}-${date}]`.

Confidence: H -- verified 2026-04-24 localhost Playwright at each stage (book meeting, unbook meeting, book work, unbook work, toggle sick on, toggle sick off, red diagonal renders, warnings consolidate). Prod smoke pending JR phone-test on latest HEAD c012e1d.

Rejected alternatives along the way:
- Sick as a tab peer to work/meeting/pk -- rejected by JR (gestalt category error).
- × remove button on each activity tab -- rejected by JR ("no x. make the button a toggle").
- Tap to focus / double-tap to unbook -- rejected by JR (selector-then-toggle surprise).
- Per-tab lit palette (blue for work, grey for meeting, darker grey for pk) -- rejected; use unified accent.blue for all three (similarity within the group, differentiation via label only).
- Delete the work shift when sick -- rejected; loses audit trail.
- Zero the work row's `hours` field -- rejected; computeDayUnionHours uses intervals not `hours`, would require a second flag anyway.
- Employee self-report sick in v1 -- deferred to Sick v2 (needs request/approve flow).
- Stale `<a href="/">` logo that full-reloads -- rejected in favor of stateful `goHome` button that resets view/period/week without blowing away in-flight work.

## 2026-04-24 -- Widen existing employees' availability (preserve day-off)
Decision: After `backfillAvailabilityDryRun` showed 0 rewrites and 23 CUSTOM out of 26 rows (Sarvi had customized every employee's availability beyond the two encoded old-default shapes), shipped a second one-shot `widenAvailabilityToMaxHoursDryRun`/`Live` in `7d64893`. For each day: `available: false` stays off (preserves day-off intent); `available: true` or malformed gets overwritten to `06:00-22:00`. Ran live 2026-04-24 13:43 -- 26/26 widened, backup tab `Employees_backup_20260424_1343` created, day-off flags preserved (Sarvi Sun, Lauren/Christina Sun-only, Matt/Emily/Nancy weekends-only, etc.). All four backfill code blocks removed from Code.gs in `0d2c2bd` (-273 lines) after successful run.
Rationale: Narrow exact-match backfill is the safe default (never wipe customized values) but matches nothing when Sarvi has edited every row. Widen-with-day-off-preserved walks the right line: widens the start/end to the canonical 06-22 window while respecting intentional unavailability. One-shots deleted post-run because editor-only script pollution grows Code.gs unbounded.
Confidence: H -- verified 2026-04-24 13:43 via live Execution log (26 widen, 0 skip).
Rejected alternatives:
- Full overwrite to 7-days-available 06-22 -- rejected (option B); would wipe legitimate day-off marks (Lauren Sun-only, weekend-only PTs).
- Keep the one-shots in Code.gs for re-use -- rejected; file hygiene wins over hypothetical future need. Git history preserves the code if needed.
- Narrow backfill via a third old-default shape grep -- rejected; no consistent third shape exists across 23 customized rows.

## 2026-04-24 -- formatTimeShort renders minutes when non-zero
Decision: `src/utils/date.js:30` `formatTimeShort(t)` now returns `10:30a` for half-hour starts/ends and keeps the compact `10a` form for on-the-hour. Prior implementation read only the hour, rendering 10:30-19:00 as `10-7` on the schedule grid. All 35 call sites (ScheduleCell, MobileAdminView, MobileEmployeeView, etc.) pick up the fix via the shared util.
Rationale: JR 2026-04-24: "it renders the hour but not the minute ... so it looks wrong." Bug surfaced after PT default shifts unified to `DEFAULT_SHIFT` which uses 10:30 on Sun + Thu-Sat. Fix is minimal: one-line change to the util, no caller changes.
Confidence: H -- verified 2026-04-24: build PASS at `06f0027` on origin/main. Prod render by JR to be spot-confirmed.

## 2026-04-24 -- Unified workday default DEFAULT_SHIFT (FT + PT) + meeting lock 14:00-16:00
Decision: `FT_DEFAULT_SHIFT` renamed to `DEFAULT_SHIFT` in `src/utils/storeHours.js`. Both FT and PT now use the same per-day defaults (Sun 10:30-18, Mon-Wed 10-18, Thu-Sat 10:30-19) when a per-employee `defaultShift` is absent. `ShiftEditorModal.getDefaultBookingTimes` drops the FT/PT branch and the `STORE_HOURS` fallback; `employee` parameter removed. `createShiftFromAvailability` in scheduleOps.js drops the `isFT` branch; both employment types fall through to `DEFAULT_SHIFT[day]`; `STORE_HOURS` import dropped from that file. New constant `MEETING_DEFAULT_TIMES = { start: '14:00', end: '16:00' }` in `src/utils/eventDefaults.js`; `getDefaultEventTimes` meeting branch returns it (dropped "next full hour from now" dynamic logic); PK branch unchanged.
Rationale: JR locked the canonical defaults 2026-04-24: workday = current FT_DEFAULT_SHIFT values for both FT and PT, PK unchanged, meeting fixed to a specific pair. The rename stops lying about scope. Unifying PT removes the store-hours prefill that was making Sarvi book PT at 11:00. Static meeting default matches JR's "very specific" preference and aligns with the 14:00-16:00 start.
Confidence: H -- verified 2026-04-24: build PASS at `c7cd101`; grep `FT_DEFAULT_SHIFT` in src/ zero hits. Prod smoke pending (PT click-to-book + meeting prefill + autofill).
Rejected alternatives:
- Per-employee migration to set `defaultShift` individually -- rejected; a shared constant is one source of truth.
- Keep PT on availability width -- rejected; causes Sarvi to manually correct every PT click-to-book.
- Keep meeting as dynamic "next full hour" -- rejected; JR wants deterministic prefill.

## 2026-04-24 -- Availability default 06:00-22:00 + one-shot backfills (editor-only Apps Script)
Decision: Default availability for a newly-created employee is now `{ available: true, start: '06:00', end: '22:00' }` for all 7 days. Set in 3 places: `src/modals/EmployeeFormModal.jsx` primary (dropped `PK_FRIENDLY_DEFAULTS` + `STORE_HOURS` import), `src/utils/apiTransforms.js` `DEFAULT_AVAILABILITY` fallback, `backend/Code.gs:2246-2254` seed template (inert for live sheets but aligned). Two new editor-only Apps Script functions in `backend/Code.gs`: `backfillAvailabilityDryRun` / `backfillAvailabilityLive` (rewrite availability for rows matching one of two known old default shapes -- v2.24-modal Mon-Fri 10-20/Sat 10-19/Sun 11-18, apiTransforms-seed Sun-Wed 11-18/Thu-Sat 11-19 -- to the new 06-22 shape; customized rows skipped). `backfillShiftStartsDryRun` / `backfillShiftStartsLive` (future-dated work-type shifts where `startTime === '11:00'` -> `_WORKDAY_DEFAULTS[day].start` 10:00/10:30; ends unchanged; past shifts and meeting/PK rows skipped). Both pairs back up the source tab as `<Tab>_backup_YYYYMMDD_HHmm` via `SpreadsheetApp.copyTo` before writing.
Rationale: Availability is the outer eligibility window, not the booking window. Widest reasonable default means Sarvi only narrows when a real constraint exists; booking hours stay controlled by `DEFAULT_SHIFT` / per-employee `defaultShift`. Backfills needed because existing employees still carry old default shapes and their booked shifts start at 11:00 from the pre-unify PT prefill. Exact-match classification leaves customized rows alone.
Confidence: H -- verified 2026-04-24: build PASS at `4bd9310` (code-side) + `06507ab` + `6782f6b` (Apps Script appends, brace-balanced). Backfills not yet run by JR -- dry-run log will confirm shape detection before live run.
Rejected alternatives:
- Helper text under the availability grid explaining "widest by default" -- rejected; modal stays clean (JR).
- Bulk-overwrite all rows regardless of current value -- rejected; customized rows would lose intentional narrowing.
- End-time backfill on existing shifts -- rejected for this pass; starts-only keeps hours-math predictable.

## 2026-04-24 -- Employee hover tooltip trimmed to name + mailto email
Decision: Desktop employee-name hover tooltip (App.jsx ~line 2491) shows only name (+ admin shield, Former badge) and a single email row wrapped in `<a href="mailto:...">` with `target="_blank" rel="noopener noreferrer"`. Dropped: hours badge, phone row, admin-access text row, 7-day availability grid. `useTooltip` hook (src/hooks/useTooltip.js) gains 180ms delayed hide plus `handleTooltipEnter` / `handleTooltipLeave` exports so the card's own onMouseEnter/onMouseLeave can cancel the pending hide while cursor traverses from row into the card. Email uses length-based font-size step-down (12px default, 1px smaller per ~3 chars beyond 32, floor 9px) and `whiteSpace: nowrap` so long addresses shrink to fit the 240px card on one line.
Rationale: JR 2026-04-24: "doesnt need to show their availability... just the name and the email which you should be able to scroll to and click if you keep your mouse over the tooltip card." Availability visible on the grid + edit view; phone + admin-access row redundant. Wrap-on-overflow (tried first, `f9fedef`) looked messy; shrink-to-fit font keeps single-line read. target=_blank so the mail client opens without navigating the app tab.
Confidence: H -- verified 2026-04-24: build PASS at `06ef00c` on origin/main; prod render by JR to be spot-confirmed.
Rejected alternatives:
- word-break wrap for long emails -- tried in `f9fedef`, reverted in `96467fc`; JR "does that look good?" called it out as ugly.
- Keep hours badge on tooltip -- redundant with EmployeeRow row-left hours display.

## 2026-04-24 -- PK/MTG badge relocation from absolute overlay to inline flex row
Decision: Event badges (PK, MTG, "N events" rollup) moved out of `absolute bottom-0 right-0` positioning in the shift-cell branch of three files: `src/components/ScheduleCell.jsx`, `src/MobileAdminView.jsx`, `src/MobileEmployeeView.jsx`. Each `shift ? (...)` branch now wraps the role-name span and badge-list div in a new `<div className="flex items-start justify-between gap-1">` at the top of the cell; the badge list keeps its existing span JSX, `EVENT_TYPES` styling, `title` hover tooltips, and the `>=3` rollup pill. `pr-3` dropped from desktop role-name span; `relative` dropped on wrappers with no remaining absolute child (kept on ScheduleCell which still has an absolute star).
Rationale: JR flagged that PK indicators visibly covered the hours + task-star row on prod. Absolute overlays on 56-66px cells cannot avoid collision. In-flow layout is zero-overlap by construction; role name truncates if badges crowd it. Reuses existing badge markup and `EVENT_TYPES` colors; no new component.
Confidence: H -- verified 2026-04-24: build PASS at `a6200cc` on origin/main; desktop admin 1280px + mobile admin 390px Playwright smoke PASS on Alex Fowler Sun 2026-04-19 cell; prod smoke PASS after Vercel redeploy. Employee viewport unsmoked because `testguy@testing.com` is inactive on prod; code path is structurally identical.
Rejected alternatives:
- Badge row above role name as dedicated top line -- rejected; would force cell height bump or smaller role-name font. Inline with role name reuses existing flex row.
- Left-edge colored stripe -- rejected; loses `shortLabel` text, less explicit for admins skimming the grid.

## 2026-04-23 -- Desktop/mobile admin parity ports (Change Password + Hidden row Edit)
Decision: Two small parity ports after 2026-04-23 audit. (1) Desktop admin avatar dropdown gains a "Change Password" menuitem (between Admin Settings and Sign Out divider) and renders `ChangePasswordModal` in the desktop return; reuses existing top-level `mobileAdminChangePasswordOpen` state. (2) Mobile Hidden from Schedule collapsible gains a per-row Edit3 button matching desktop's inline edit affordance; opens `EmployeeFormModal`. No other ports pursued.
Rationale: Parity audit identified three candidate gaps; deeper investigation showed only two were real. Employee Quick View was called "missing on desktop" but desktop already has an equivalent (hover tooltip at App.jsx:2482-2513) that shows MORE info -- email + phone + full 7-day availability -- than `MobileEmployeeQuickView`. Hidden from Schedule was called "missing on mobile" but the collapsible section already existed on both; the only gap was desktop's per-row Edit button. Change Password WAS genuinely desktop-missing (mobile-only drawer button). Scope kept minimal: 5 lines for Change Password, 8 lines for the Hidden-row Edit.
Confidence: H -- verified 2026-04-23. Change Password smoke at 1280px: menu opens, Key icon visible, modal opens with 3 fields + Cancel/Update, zero console errors. Hidden-row Edit smoke at 390px: 4 Edit buttons render, click opens Edit Employee dialog, zero console errors. Build PASS for both. HEADs `f19b5e4` + `bf2a8e3` on origin/main.
Rejected alternatives:
- Port `MobileEmployeeQuickView` to desktop as hover popover or click modal -- rejected; desktop already exceeds mobile's capability via existing hover tooltip. Would duplicate.
- Add minWidth/minHeight touch-target bump to mobile Edit button -- rejected mid-edit; JR explicit goal was parity with desktop, not a mobile-UX divergence. Same `p-1` + size-10 icon as desktop.
- Rename `mobileAdminChangePasswordOpen` -> `changePasswordOpen` -- deferred; local misnomer but renaming adds diff surface with no functional gain. Revisit on next App.jsx refactor touching the state.
Audit correction: the initial Explore-subagent audit overstated both deferred gaps. Lesson recorded: a code-read parity audit needs verification against actual rendered behavior, not just component presence grep. Hover tooltips and conditional renders are easy to miss in pure-search exploration.

## 2026-04-23 -- FT default shift fallback (Mon-Wed 10-18, Thu-Sat 10:30-19, Sun 10:30-18) + favicon swap
Decision: New `FT_DEFAULT_SHIFT` constant in `src/utils/storeHours.js` holds per-day FT shift defaults. `createShiftFromAvailability` fallback order: per-employee `defaultShift[day]` -> `FT_DEFAULT_SHIFT[day]` for FT only -> availability.start/end for PT. Result clamped to availability window (max(fbStart, avail.start), min(fbEnd, avail.end)); degenerate clamp returns null. `getDefaultBookingTimes` in `ShiftEditorModal` branches the same way for empty-cell pre-fill. Favicon swapped to rainbowjeans.com's OTR50.png (48x48 favicon + 180x180 apple-touch-icon); existing `favicon.svg` kept as tertiary fallback link.
Rationale: Sarvi's Auto-Fill was booking 06:00-22:00 shifts because most FT rows have no per-day `defaultShift` set and `availability` was widened by `widenAvailabilityForPK_` or legacy test data. Store-pattern FT default as fallback plus availability-clamp decouples "how wide is availability" from "what hours do we book by default" without a per-row migration. Favicon swap per JR: brand alignment with rainbowjeans.com main site.
Confidence: H -- verified 2026-04-23: 12/12 `createShiftFromAvailability` unit cases PASS in browser via Playwright `await import('/src/utils/scheduleOps.js')` (FT wide/narrow/unavailable/clamp-degenerate, PT keeps availability-width, per-employee `defaultShift` still wins); build PASS; favicon assets 200 in dev; zero console errors on login. HEAD `1bdde4e` on origin/main.
Rejected alternatives:
- Per-row `defaultShift` migration script -- rejected; would need re-running on any store-hour change. Fallback constant does not.
- Apply FT pattern to PT -- rejected; JR explicit: PT stays availability-width so student schedules respect their windows directly.
- Replace `favicon.svg` entirely -- rejected; kept as tertiary fallback for zero-risk rollout.

## 2026-04-20 -- Schedule display: 4-bucket sort (Sarvi, admins, FT, PT) with bucket-transition dividers
Decision: New `src/utils/employeeSort.js` exports `employeeBucket` (0=Sarvi, 1=other admins, 2=FT non-admin, 3=PT non-admin), `sortBySarviAdminsFTPT` (alpha within bucket), `computeDividerIndices` (transitions only, skips empty buckets). Five render sites migrated: desktop admin grid (App.jsx), desktop employee view (views/EmployeeView.jsx), mobile admin (MobileAdminView.jsx), mobile employee (MobileEmployeeView.jsx), and PDF (pdf/generate.js now sorts; it previously rendered in Sheet order with no divider). PDF emits a divider `<tr>` with `colspan=weekDates.length+1` on transitions; both weeks share the same map.
Rationale: Prior 3-bucket sort (Sarvi → FT → PT) lumped other admins into FT/PT by their employmentType. JR wants admins grouped between Sarvi and FT with a discreet divider, matching the existing FT→PT divider style. Centralizing kills the four duplicate inline sort bodies + divider predicates that had already drifted (each file had its own `isFirstPT`/`ptStartIndex` variant).
Confidence: H -- `npm run build` PASS, localhost Playwright PASS at 1280/768/390px (2 dividers each at Sarvi→FT and FT→PT because Dan+Scott are admins with showOnSchedule=false → bucket-1 empty, no spurious line), PDF fixture with 4 employees across all 4 buckets emits 3 transition dividers × 2 weeks = 6 total.
Rejected alternatives:
- Per-file inline bucket predicate -- rejected, kept drifting (pre-change the four files had subtly different Sarvi/FT/PT logic).
- Separate "hide divider if only Sarvi in bucket 0" -- rejected, JR explicit: divider still renders below Sarvi even when she's the only admin on schedule.
Supersedes: 2026-02-10 "Sarvi first, then full-time alpha, then part-time alpha" lesson in LESSONS.md (rewritten with 4-bucket rule on 2026-04-20).

## 2026-04-19 -- Phase E cuts 13-15 + ScheduleStateButton unified sizing
Decision: Three further cuts shipped same day. Cut 13 added `matchesOfferId`, `matchesSwapId`, `errorMsg` helpers to `src/utils/requests.js` (no App.jsx line change; DRY'd 26 request/offer/swap sites so future handlers cannot miss the dual-key branch). Cut 14 extracted desktop three-state Save/GoLive/Edit button into `src/components/ScheduleStateButton.jsx` (App.jsx -41). Cut 15 unified mobile + desktop onto the same component with middle-ground sizing: `px-2.5 py-1`, `text-xs`, icon 11, title-case labels. Mobile Publish stays inline as sibling (composition); row wraps via `flex-wrap`.
Rationale: Two-copy drift hazard on mobile vs desktop button was real -- mobile block was 22px tall (under 44px touch floor). JR rejected size-prop split; asked for unified design. Middle sizing reads cleanly both viewports without requiring per-viewport knobs. Same pattern Button.jsx sets: one component, variants for meaning not for size where possible.
Confidence: M -- build + Playwright smoke PASS 1280px + 390px, zero console errors. H on cuts 13 + 14 pure extractions; M on cut 15 admin-action paths (Save / Go Live / Go Edit) not exercised interactively.
Carryover: Further Phase E cuts paused. JR explicit: "good on code and bug fixes now. i wanna work on the email features." Next work should motivate by external-comms overhaul (dedicated sender Gmail, welcome email, announcement emails, admin notifications), not another refactor cut.

## 2026-04-19 -- Phase E cut-by-cut extraction cadence (App.jsx 3044 -> 2606)
Decision: Continued Phase E audit with 12 ship-merge-verify cuts. Each cut = extract one pure helper or component, build, Playwright smoke (login + schedule render + zero console errors), commit, push. New modules: `src/utils/apiTransforms.js` (5 getAllData response transforms), `src/utils/employees.js` (future-shifts guard + API serializer), `src/utils/scheduleOps.js` (createShiftFromAvailability + applyShiftMutation + collectPeriodShiftsForSave + transferShift/swapShift between employees), `src/modals/AutoPopulateConfirmModal.jsx`, `src/components/LoadingScreen.jsx` (Loading + Error).
Rationale: Same cadence JR validated 2026-04-18. Pure functions mean no dep-threading -- setters and async flow stay in App.jsx; only compute moves. Playwright localhost smoke (login to schedule render) catches import/init breakage but not interactive paths like shift edit, offer approve, swap approve. Cuts 8 + 10 flagged in TODO verification because those live admin paths aren't render-smoke-covered.
Confidence: M -- build + render-smoke PASS for all 12 cuts; HEAD `2d8b6b1` pushed. H on cuts 1-7, 9, 11, 12 (pure transforms with no admin-path touch). M on cuts 8 + 10 until JR exercises shift-edit + offer-approve + swap-approve in prod.
Carryover: Remaining App.jsx surface is harder (3-state Save/GoLive/Edit button, request/offer/swap handler DRY via hook pattern, Context provider refactor for sub-area 6). Each cut now has lower yield. Consider pausing extractions until a hook or context refactor is justified by a concrete feature need.

## 2026-04-19 -- Per-day defaultShift decouples Auto-Fill from availability (v2.24.0)
Decision: New Employees column N `defaultShift` (JSON per-day `{start,end}`). Auto-Fill (`createShiftFromAvailability`) reads defaultShift first; missing day falls back to `availability`. `availability.available` stays the gate. One-shot editor-only `widenAvailabilityForPK_()` widened Sat start to 10:00 and M-F end to 20:00 on already-available days so PK windows pass `availabilityCoversWindow`; Sunday untouched; never turned off-days on. Also: EmployeeFormModal's new-employee default availability widened to match (Mon-Fri 10:00-20:00, Sat 10:00-19:00, Sun store hours) so future hires are PK-eligible without re-running the widener.
Rationale: JR's three-concept model (store hours vs availability vs default booked hours) was collapsed into two in the code -- Auto-Fill read availability for its shift hours, so widening availability for PK eligibility also changed what Auto-Fill booked. Decouple solves that without breaking the eligibility gate. Feature-flag deploy: frontend tolerates missing column, so backend redeploy was not gating.
Confidence: H -- widener ran 2026-04-19 on live sheet: scanned 24, changedEmployees 20, changedDayEntries 94. Dan + Scott skipped (no availability stored). Build PASS at HEAD `3460c69`; v2.24.0 deployed live.
Rejected alternatives:
- Backend enforcement that defaultShift subset-of availability -- JR wants UI hints, not backend rejects. saveEmployee stays permissive.
- Widening Sunday -- no Sunday PK windows; JR explicit.
- Turning off-days on during widening -- never.

## 2026-04-18 -- App.jsx hook-extract cuts 15-17 + 3 latent missing-import fixes
Decision: Continued sub-area 4 into App() body via custom hooks. Extracted `useUnsavedWarning`, `useDismissOnOutside(ref, isOpen, onDismiss)`, `useAuth(showToast)` to `src/hooks/`. useAuth bundles currentUser state + AUTH_EXPIRED auto-bounce effect; showToast captured via ref so effect deps stay []. App.jsx 3228 -> 3207 (-21). Mid-session, three latent missing-import bugs surfaced (PAY_PERIOD_START, Logo, StaffingBar) -- all from prior Phase E sub-area 4 cuts (1-7), not from cuts 15-17. Fixed each in a single import-line patch.
Rationale: Hooks extract effect/state pairs cleanly without prop-threading through giant trees. The useAuth showToast-via-ref pattern dodges the useState-setter dependency problem. The latent bugs reveal that `npm run build` PASS does NOT prove runtime safety -- Vite/ESBuild treats undefined identifiers as global lookups; ReferenceError only fires on rendered code paths. Mobile-only smoke missed both desktop-only references (Logo header, StaffingBar in admin grid).
Confidence: H -- verified 2026-04-18: HEAD `5c8272a` on origin/main, build PASS, bundle index-D5G7145f.js LIVE, JR confirmed mobile + desktop working.
Carryover: Cuts 18 (useToast) + 19 (useAnnouncements) were drafted, shipped, then reverted during the white-screen panic. They are recoverable from git history (`f9ded92`, `9910851`) if next session wants to retry. New rules to apply going forward: (a) ask for browser console error BEFORE rolling back, (b) smoke desktop AND mobile after extraction cuts, (c) grep App.jsx for orphaned references after every "moved to" extraction.

## 2026-04-18 -- App.jsx component carve-out phase shipped (cuts 8-14)
Decision: Continued sub-area 4 with 7 more ship-merge-verify cuts on main. Extracted real components (LoginScreen, ColumnHeaderEditor, TooltipButton, ScheduleCell+getAvailabilityShading, EmployeeRow) plus relocated the parked `getStoreHoursForDate` + override refs to `src/utils/storeHoursOverrides.js` (re-exported from App.jsx so 6 legacy importers keep working). Dead `REQUEST_STATUS` + `OFFER_STATUS` enums dropped. App.jsx 3702 -> 3228 lines.
Rationale: Standalone top-of-file extraction surface fully exhausted with this batch. The override-ref relocation is mechanical (no behavior change) but unblocks EmployeeRow extraction and isolates the parked smell to one file -- the sub-area-6 Context refactor now has a single owner module to replace.
Confidence: H -- verified 2026-04-18: HEAD `6c2f562` on origin/main, build PASS, bundle stable at 464.79-464.80 kB (re-export in cut 13 added 1 byte).
Carryover: Cracking open the main App() body is the next surface, but qualitatively different work -- each subsection needs prop/state-threading decisions.

## 2026-04-18 -- App.jsx pure-extract phase shipped via ship-merge-verify cadence
Decision: Phase E sub-area 4 split into 7 small cuts, each commit-merge-push to main individually rather than stacked on a feature branch. Modules created: `src/utils/{storeHours,payPeriod,requests,api}.js`, `src/components/{primitives,uiKit,CollapsibleSection}.jsx`, `src/hooks/useFocusTrap.js`. Status maps appended to existing `src/constants.js`. App.jsx 4147 -> 3702 lines.
Rationale: Stacked cuts widen the gap between repo and prod -- if a regression appears in cut N, blame is ambiguous across cuts 1..N. JR raised this mid-session after we had already shipped cut 1 + cut 2 to a branch. Adopted ship-merge-verify per cut going forward; cuts 3-7 followed the new rhythm directly on main. Saved as global rule `~/.claude/rules/plan-time-knowledge.md`: "Plan-time knowledge does not survive to execution time."
Confidence: H -- verified 2026-04-18: HEAD `eba776f` on origin/main, build PASS, JR live-smoked cuts 1+2 (clean). Cuts 3-7 are import-path-only moves; rollup catches any unresolved import at build time, so functional risk is low.

## 2026-04-18 -- Date helpers extracted to src/utils/date.js
Decision: Created `src/utils/date.js` with 11 pure date/time helpers (toDateKey, getDayName, getDayNameShort, formatDate, formatDateLong, formatMonthWord, getWeekNumber, formatTimeDisplay, formatTimeShort, calculateHours + private parseTime). Migrated 21 import sites off `./App` onto `./utils/date`. App.jsx no longer re-exports any date helpers. `isStatHoliday` and `getStoreHoursForDate` deliberately stayed in App.jsx because they read module-level mutable refs (`_storeHoursOverrides`, `_staffingTargetOverrides`) that are part of a separate parked refactor (audit item 6).
Rationale: Phase E audit item 28 — strip the App.jsx barrel role for utility code so the eventual App.jsx extraction has less surface to negotiate. Functions chosen by purity (no closures over module state). Bundle byte-identical confirms tree-shaking already handled the indirection.
Confidence: H -- verified 2026-04-18 build PASS, bundle 465.08 kB unchanged.

## 2026-04-18 -- Hash-only auth (S67, v2.23.0)
Decision: Removed plaintext-password fallback from `login` and `changePassword` in `backend/Code.gs`. Hash check is the only path. `resetPassword` and `saveEmployee` now write `passwordHash` + `passwordSalt` directly so newly created/reset accounts can log in immediately (previously they relied on next-login migration which no longer exists). Plaintext `password` column kept for admin "default password" display only; auth path never reads it.
Rationale: Phase E audit item 30. Pre-audit via Drive MCP found 19/24 active rows lacked `passwordHash` (never logged in). Used the same one-shot editor-paste pattern as the test-employee scrub: wrote `backfillPasswordHashes`, JR ran it, all 24 rows backfilled, then removed both the function and the plaintext fallback branches.
Confidence: H -- verified 2026-04-18 via Drive MCP read: 24/24 rows have passwordHash + passwordSalt.
Pending: JR must paste new Code.gs into live Apps Script editor and bump deployment to v2.23 for the change to take effect on the live web app.

## 2026-04-18 -- Test-employee scrub executed; purge functions removed
Decision: Ran `purgeTestEmployees` from Apps Script editor. 20 `@example.com` employees + 50 shifts deleted from the live Sheet. Then removed `listTestEmployees` / `purgeTestEmployees` / `_findTestEmployees_` from `backend/Code.gs` and from the live editor. Also deleted `backend/seed-demo-data.gs` and scrubbed the 5 legacy Emma/Liam/Olivia/Noah/Ava seed rows from `createEmployeesTab`. Stale Alex Kim smoke-pattern lesson removed from LESSONS.md.
Rationale: One-time cleanup per Sarvi request. Keeping the purge functions around invites accidental re-run. `clearAllData` stays because it has general utility; this one didn't.
Confidence: H -- verified 2026-04-18 via Drive MCP `getAllData` read: 24 employees, 79 shifts, 0 `@example.com` rows.

## 2026-04-18 -- One-time data scrubs ship as editor-only functions in Code.gs
Decision: `listTestEmployees` + `purgeTestEmployees` lived in `backend/Code.gs` as editor-only functions (not wired to `handleRequest`). Superseded by removal entry above after the one-time scrub completed. Same pattern as existing `clearAllData` at Code.gs:2338.
Rationale: Destructive cross-sheet ops (Employees + Shifts + ShiftChanges) should require Apps-Script-editor access, not an HTTP handler. Editor access is already limited to JR/Sarvi; HTTP handler would require admin-auth-plus-confirmation plumbing for a one-time job. Version control via git preserves audit trail without expanding the attack surface.
Confidence: H -- verified 2026-04-18: `listTestEmployees` not registered in `handleRequest` action map (grep); only invocable from editor.

## 2026-04-18 -- PDF XSS sweep is complete; no further action needed
Decision: Item 10 in `~/.claude/plans/adversarial-audit-fix-plan.md` ("Partial PDF XSS surface remains") is closed. All 7 user-writable interpolations in `src/pdf/generate.js` already wrapped in `cleanText` (== `escapeHtml(stripEmoji(s))`). Role color has regex hex whitelist at generate.js:131. `src/email/build.js` emits plain text mail (no HTML parse).
Rationale: LESSONS note "escape applied to only 5 sites" was stale at the time of the audit -- a prior commit had already expanded the sweep. Verified by grepping every `${...}` in generate.js and classifying each as user-writable / code-controlled.
Confidence: H -- verified 2026-04-18 by exhaustive grep audit; commit `51ea778` documents the audit in CONTEXT/TODO.md Completed.

## 2026-04-18 -- Request modals use fixed (non-rotating) identity colors
Decision: `src/theme.js` exports `THEME.modal.swap.accent = '#7C3AED'` (violet) and `THEME.modal.offer.accent = '#EC4899'` (pink). `SwapShiftModal` + `OfferShiftModal` use these instead of `THEME.accent.purple` / `THEME.accent.pink` (which are aliased to rotating `OTR_ACCENT`). Submit-button brand gradient (blue -> rotating purple) preserved as primary-action convention.
Rationale: Playwright smoke 2026-04-18 revealed modal headers lost their visual identity on rotation days (e.g. "pink" offer modal rendered orange when OTR accent rotated to orange). Fixed modal identity colors are orthogonal to the daily brand rotation.
Confidence: H -- verified 2026-04-18 on prod b0851f8 with OTR rotated to Orange: Offer header stayed pink, Swap header stayed violet. Screenshots in .playwright-mcp/reverify-05/06.
Rejected alternative: recolor `THEME.accent.pink` / `THEME.accent.purple` to break their alias to `OTR_ACCENT`. Rejected because those tokens are also used for non-modal UI (e.g. isAdmin avatar + Shield icon) where rotation IS desired.

## 2026-04-18 -- Offer/Swap filter includes today, not strictly tomorrow
Decision: `src/modals/OfferShiftModal.jsx` + `src/modals/SwapShiftModal.jsx` filter `shiftDate >= today` (midnight-anchored). Dropped the `tomorrow` local variable.
Rationale: Original filter `>= tomorrow` excluded today's not-yet-started shifts. Staff can reasonably want to give away or swap a shift they realized this morning they can't work. Current-day exclusion added friction without protection.
Confidence: M -- verified build green + empty-state still shows correctly when no future shifts (Alex had no Apr 18+ shifts). Not hands-tested with a today-shift scenario; behaves correctly per code.
Revisit if: post-submit window enforcement is needed (e.g. no offers within 2hrs of shift start).

## 2026-04-18 -- Admin-blocked request types are hidden, not disabled
Decision: `src/modals/RequestTimeOffModal.jsx` filters the `requestTypes` array via `!isAdmin && { ... }` followed by `.filter(Boolean)`. Admins see a single "Days Off" card; non-admins see all three.
Rationale: Showing disabled "Employees Only" cards to admins was informational noise. One-card UI is cleaner.
Confidence: H -- Playwright-verified on prod b0851f8 as JR (admin) sees only Days Off, as Alex (employee) sees all three.

## 2026-04-18 -- Button.jsx destructiveOutline variant replaces inline override
Decision: `src/components/Button.jsx` adds 6th variant `destructiveOutline` (bg.tertiary + status.error text + status.error@30% border). `MobileAdminDrawer` Sign Out button now uses `variant="destructiveOutline"` instead of `variant="secondary"` + a style-override for color/border.
Rationale: Style-override on a variant defeats tokenization. Codifying the pattern as a named variant keeps all destructive-action affordances within the Button primitive.
Confidence: H -- Playwright-verified 2026-04-18 on prod b0851f8.

## 2026-04-18 -- Button.jsx primitive replaces 13 inline button sites
Decision: `src/components/Button.jsx` -- 5 variants (primary, secondary, ghost, recoverable, destructive) + 1 follow-up (destructiveOutline) x 3 sizes (sm 36 / md 44 / lg 48). Accepts `leftIcon` / `rightIcon` (lucide components) + `iconSize`, `fullWidth`, `disabled`, plus passthrough for `className`, `style`, `aria-*`. Uses `React.forwardRef` so refs land on the underlying `<button>`.
Rationale: Audit Phase D item 18. Thirteen ad-hoc inline buttons across `MobileStaffPanel` (chip filters, Edit, Reactivate, Remove, Restore, Add Employee) and `MobileAdminDrawer` (7 drawer actions) had drift on sizes, paddings, and tonal color mappings. Primitive centralizes the mapping to THEME tokens and preserves the 44px mobile touch floor.
Confidence: H -- Playwright-smoked on prod ab1cb58 + b0851f8.

## 2026-04-18 -- AdaptiveModal primitive branches on useIsMobile
Decision: `src/components/AdaptiveModal.jsx` -- mobile (`window.innerWidth < 768`) renders via `MobileBottomSheet` (z-150, pill tap-to-close, 70vh scroll). Desktop renders centered overlay card (max-w-md default, max-h-85vh, flex column with scrollable body + sticky footer). Hot-resize via `useIsMobile` resize listener re-renders without remount -- verified mid-modal resize preserves internal state.
Props: `isOpen`, `onClose`, `children` required; `title`, `icon` (lucide) + `iconColor`, `headerGradient`, `maxWidth`, `headerExtra`, `footer`, `ariaLabel`, `bodyClassName`.
Rationale: Audit Phase D item 21. `OfferShiftModal`, `SwapShiftModal`, `RequestTimeOffModal` had no mobile-specific rendering -- all used a centered card pattern on small screens. Unifying them via `AdaptiveModal` gets them the bottom-sheet pattern JR already picked for `MobileStaffPanel`. The `footer` slot lands sticky on desktop and at sheet-bottom on mobile.
Confidence: H -- Playwright-smoked on prod e64838b + b0851f8, both viewports, all three modals. Empty states render correctly.
Revisit if: step-indicator in `SwapShiftModal` should move to `headerExtra` slot instead of body.

## 2026-04-18 -- MobileStaffPanel is a bottom-sheet, not a centered Modal
Decision: `src/panels/MobileStaffPanel.jsx` renders via `MobileBottomSheet` (imported directly from `./MobileEmployeeView`, not App re-export). Z-150 anchored to bottom. 44px min touch targets on chips + action buttons. Safe-area-inset-bottom applied to list padding and sticky Add button.
Rationale: Audit item #14. Z-hack to raise EmployeeFormModal above a centered staff modal was rejected in favor of a proper mobile pattern. Sheet conversion + later drawer-close + form-reopen-on-close combo yields correct stacking without z-games.
Confidence: H - JR phone-smoked on 7a13cab LIVE (2026-04-18)

## 2026-04-18 -- MobileAdminDrawer auto-closes on any action tap
Decision: `src/App.jsx:3233+` every drawer handler (`onOpenStaff`, `onOpenSettings`, `onOpenOwnRequests`, `onOpenPK`, `onOpenChangePassword`, `onExportPDF`, `onLogout`) first calls `setMobileAdminDrawerOpen(false)` before triggering its action.
Rationale: Drawer is z-200 (top of stack). Leaving it open blocked the z-150 staff sheet and z-100 form behind it; taps fell through to the drawer. Auto-close is standard mobile nav pattern and removes the stacking concern entirely.
Confidence: H - JR phone-confirmed 2026-04-18

## 2026-04-18 -- EmployeeFormModal reopens Staff bottom-sheet via ref+effect, not state flag
Decision: `src/App.jsx:1255+` uses `reopenStaffAfterFormRef = useRef(false)` set true in `onEdit`/`onAdd`, watched by `useEffect` on `empFormOpen`. When form closes, effect fires, flag clears, sheet reopens.
Rationale: Initial state-flag approach (`reopenStaffAfterForm` + inline onClose) did not reliably fire after the close-commit. Ref+effect decouples from setState batching and inline-closure timing.
Confidence: H - JR phone-confirmed "works" on 7a13cab (2026-04-18)

## 2026-04-18 -- save/delete/reactivate employee revert optimistic state on API failure
Decision: `saveEmployee`, `deleteEmployee`, `reactivateEmployee` capture `prevEmployees = employees` before the optimistic `setEmployees`. On `!result.success`, revert via `setEmployees(prevEmployees)`, return `false`. Also: `setEditingEmp(null)` only runs on success, so EmployeeFormModal stays labelled "Edit Employee" while user retries.
Rationale: Prior code showed error toast but kept the optimistic UI change, giving the user a false "it worked" signal. Also flipped modal title to "Add Employee" on save-failure retry. Both confirmed by JR phone-smoke.
Confidence: H - JR phone-confirmed revert behavior on 7a13cab (2026-04-18)

## 2026-04-18 -- THEME.action.recoverable and THEME.action.destructiveTonal tokens
Decision: `src/theme.js` adds `action: { recoverable: {bg, fg, border}, destructiveTonal: {bg, fg, border} }`. Recoverable = brand-blue tonal (OTR primary at 20%/40% + `#60A5FA` text). DestructiveTonal = status.error tonal.
Rationale: Restore-button color was inlined as hardcoded `rgba(4,83,163,0.20)` / `#60A5FA` in two panels. Token unifies the "recoverable administrative" affordance per DECISIONS 2026-04-18 Restore button tonal-blue + opacity restructure. Destructive tonal added for future unification of the Remove pattern.
Confidence: H - migrated in `MobileStaffPanel.jsx` + `InactiveEmployeesPanel.jsx` on f1a5397 (2026-04-18)

## 2026-04-18 -- MobileBottomSheet pill handle is tap-to-close (not drag-to-dismiss)
Decision: `src/MobileEmployeeView.jsx:610+` pill handle is wrapped in a 48x20 button that fires `onClose` on tap. Visual pill unchanged (40x4 rounded bar, muted at 40% alpha).
Rationale: Pill suggests drag-to-dismiss affordance. JR noticed the mismatch; drag-gesture is non-trivial and not currently needed. Tap-to-close matches the visual cue without adding gesture code. X-in-corner still works as secondary close.
Confidence: H - JR phone-confirmed (2026-04-18)

## 2026-04-18 -- Pull-to-refresh stays native; do NOT suppress overscroll-behavior
Decision: `src/index.css` carries no `overscroll-behavior` or `touch-action` lock on html/body/#root. Native Chrome pull-to-refresh stays enabled.
Rationale: Suppression was introduced then reverted same session (commits `e01c2e5` -> `ea4b81c`). JR confirmed the refresh prompt was not interfering with any intentional gesture; killing it removed useful behavior.
Confidence: H - reverted and re-confirmed 2026-04-18

## 2026-04-18 -- PDF greyscale redundant encoding for B&W break-room printer
Decision: `src/pdf/generate.js` encodes role/OT/holiday/announcement on a non-hue channel in addition to color. Role: letter-glyph prefix (`C:`, `B:`, `M:`, `W:`, `F:`) + per-role border style (solid/dashed/dotted, 2-3px). OT (>=44h): bold + trailing `*`. Near-OT (40-43h): bold. Holiday: heavy black top border + "HOL" caption. Announcement: italic body + `[!]` glyph + double top border.
Rationale: Break-room printer is B&W; hue-only encoding collapses into indistinguishable grey. Per `color.md` §8 "contrast > specific hue" + `applied-accessibility.md` §2 "make it right in black and white" + WCAG 1.4.1. Colors retained for color printers -- pure redundancy.
Confidence: H - shipped 2026-04-18, `npm run build` PASS

## 2026-04-18 -- PK default times branch on day-of-week
Decision: `src/utils/eventDefaults.js` exports `getPKDefaultTimes(dateInput)`. Saturday returns `{10:00, 10:45}` (pre-open briefing). Other days return `{18:00, 20:00}` (post-close training). Used by `ShiftEditorModal`, `PKEventModal`, and bulk-week autofill.
Rationale: Sarvi confirmed Saturday PK is always 10-10:45 pre-open. Hardcoded 18:00-20:00 was wrong 1 day of 7; friction compounded weekly.
Confidence: H - shipped 2026-04-18

## 2026-04-18 -- Employee `defaultSection` field added to schema
Decision: New column U `defaultSection` on Employees sheet (values `mens|womens|cashier|backupCashier|floorMonitor|none`, default `none`). Autofill's `createShiftFromAvailability` uses `employee.defaultSection || 'none'` instead of hardcoded `'none'`. UI surface in `EmployeeFormModal`. Backend via header-driven `getSheetData`/`appendRow` -- no row-mapper changes needed.
Rationale: Autofill was stamping `role:'none'` on every shift, forcing Sarvi to re-assign sections manually. System already knows the employee's usual section; sensible default reduces input work per `applied-component-patterns.md` SS 8.
Confidence: H - shipped 2026-04-18; backward-compatible (missing column falls back to 'none')
Revisit if: Sarvi wants per-day section override (e.g. backupCashier Mon/Tue, mens Wed-Sat).

## 2026-04-18 -- Bulk "Autofill PK Week" -- REJECTED (never shipped; PK is day-specific, not weekly)
Decision: Reverted / never shipped. Source contains only single-day "Schedule PK" modal (App.jsx:2139); no "Autofill Wk N" button exists. 2026-04-24 prod Playwright smoke confirmed absence.
Rationale: PK sessions are scheduled for specific days (Saturday pre-open briefing, other-day post-close training), not on a 7-day sweep basis. A week-wide autofill would create PK events on days they don't belong. JR (2026-04-24): "PK's are for specific days."
Confidence: H -- verified 2026-04-24 via source grep + prod smoke.

## 2026-04-18 -- Former Staff with shifts removed from schedule grid entirely
Decision: `src/App.jsx` deletes the inline "Former Staff (History)" block inside the schedule grid. Deleted employees no longer appear on the schedule view even if they hold shifts in the displayed period. Backend records + shift rows preserved for audit/payroll. Restore via Manage Staff > Restore.
Rationale: Sarvi feedback 2026-04-18. Per `visual-hierarchy.md` §6 squint test -- former staff intermixed with current roster is a false signal. Records stay; visibility doesn't.
Confidence: H - shipped 2026-04-18
Note: `deletedWithShifts` useMemo at App.jsx:1845 is now dead code; flagged for future cleanup.

## 2026-04-18 -- Restore button tonal-blue + opacity restructure
Decision: `src/panels/InactiveEmployeesPanel.jsx` -- opacity-60 moved from parent row to the identity region only (avatar + name). Restore button skinned as tonal brand-blue `rgba(4, 83, 163, 0.20)` bg + `#60A5FA` text + `rgba(4, 83, 163, 0.40)` border. Full opacity so it reads as clickable.
Rationale: Previous button inherited parent opacity (reads "disabled" per `applied-dark-theme.md` SS 4) AND used disabled-coded token pair (`bg.elevated` + `text.secondary`). Per `applied-accessibility.md` §1 disabled vs enabled must differ by >=3:1 contrast, not opacity alone. Tonal blue signals "recoverable administrative" (not green "go", not red "danger").
Confidence: H - shipped 2026-04-18

## 2026-04-18 -- Hidden from Schedule section collapsed by default
Decision: `src/App.jsx:3683+` wrap "Hidden from Schedule" in existing `CollapsibleSection` component with `defaultOpen={false}` and a count badge.
Rationale: Tertiary info (admins-not-on-schedule, inactive) was competing with primary grid for attention. Per `visual-hierarchy.md` SS 2 three-levels-max + `applied-component-patterns.md` SS 7 progressive disclosure. Reuses existing component, zero new infra.
Confidence: H - shipped 2026-04-18

## 2026-04-17 -- Project memory migrated to CONTEXT/* with thin adapters
Decision: Canonical mutable memory lives in `CONTEXT/TODO.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `LESSONS.md`. Adapters `CLAUDE.md` + `.cursor/rules/context-system.mdc` stay thin (under 150 lines) and route to CONTEXT/*. Legacy `docs/todo.md`, `docs/decisions.md`, `docs/lessons.md`, `docs/handoffs/`, `docs/audits/`, `.claude/rules/conventions.md` deleted. Reference docs retained at `docs/schemas/`, `docs/research/`, `docs/DEPLOY-S36-AUTH.md`.
Rationale: Standardizes memory ownership across Claude + Cursor harnesses; decouples canonical state from adapters; ASCII-only telegraphic style preserves meaning while shrinking token footprint. Recovery backup at `.migration-recovery/2026-04-17-0043/` (gitignored).
Confidence: H - migration verified 2026-04-17: sweep clean, ASCII audit clean, both adapters under 150 lines, all canonical files carry SCHEMA headers.

## 2026-04-14 -- PDF Contact Admin filter to PRIMARY_CONTACT_EMAIL
Decision: src/pdf/generate.js narrows adminContacts to Sarvi via new PRIMARY_CONTACT_EMAIL constant; falls back to active non-owner admins if Sarvi row missing.
Rationale: Employees should see one point of contact, not a list; matches backend CONFIG.ADMIN_EMAIL.
Confidence: H - S65 ship verified `4477325`, non-ASCII audit cleared

## 2026-04-14 -- PK bulk modal auto-check by availability-window overlap
Decision: PKEventModal auto-checks employees whose availability window encloses the PK window; others greyed with reason, admin can override.
Rationale: Time-window match flags real conflicts before they happen; soft exclusion preserves admin agency.
Confidence: H - S63 browser-verified round-trip with Alex Fowler

## 2026-04-14 -- Autofill toolbar collapsed 4 -> 3 controls via dropdown top option
Decision: Auto-Fill dropdown + Clear dropdown + Schedule PK button; each dropdown's top option "All Full-Timers" triggers bulk via `value === '__all__'` branch.
Rationale: Fewer controls; consistent interaction pattern; bold + optgroup separator gives hierarchy.
Confidence: H - shipped S63

## 2026-04-14 -- Meetings + PK: split-maps over nested-array
Decision: `shifts[key]` stays work-only; new parallel `events[key]` array map for meeting/pk; backend 3-tuple key `${empId}-${date}-${type}`.
Rationale: 25+ call sites treat shifts[key] as scalar; nested would require migrating all. Split-maps is zero-touch on hot path.
Confidence: H - S61 shipped Stages 1-9, 2026-04-14
Revisit if: 3rd or 4th orthogonal entry type added (then reconsider composite key).

## 2026-04-14 -- Offers + swaps blocked for non-work shift types
Decision: Only `type='work'` is transferable. Frontend filters + backend `INVALID_SHIFT_TYPE` rejection.
Rationale: Meetings/PK are mandatory admin-scheduled commitments; delegation is nonsensical.
Confidence: H - shipped S61 + S64

## 2026-04-14 -- Hours: union-count overlaps across work + meeting + pk
Decision: `computeDayUnionHours` merges intervals then sums; fast-path uses stored `shift.hours` when no events present.
Rationale: ESA 44hr is "worked" time; overlapping paid time must not double-count. Matches payroll treatment.
Confidence: H - shipped S61

## 2026-04-14 -- Meeting + PK skip 5-consecutive-days streak
Decision: Consecutive-days warning counts only `type='work'` days.
Rationale: ESA consecutive-days rule is about shop-floor fatigue; training does not carry same load.
Confidence: H - shipped Stage 8 informational banner

## 2026-04-14 -- Swap/Offer cutoff is "tomorrow midnight"
Decision: SwapShiftModal + OfferShiftModal filter eligibility to `shiftDate >= tomorrow midnight`.
Rationale: Matches user mental model of "tomorrow"; admin gates short-notice approvals server-side.
Confidence: H - shipped S60

## 2026-04-14 -- Defensive availability parse at login handler
Decision: App.jsx handleLogin (line 1408) wraps `user.availability` JSON parse in try/catch with empty-string short-circuit.
Rationale: Same class as S50 getAllData bug; empty Sheet field -> `JSON.parse('')` throws -> stuck spinner. Inline fix is smallest safe diff.
Confidence: H - S52 shipped `ff54544`, browser-verified

## 2026-04-14 -- Defensive `ensureFullWeek()` for availability in getAllData
Decision: Always returns fully-populated 7-day object overlaying parsed data on DEFAULT_AVAILABILITY. Empty/malformed/null all resolve to complete shape.
Rationale: Enforces shape at one boundary; downstream readers can trust `employee.availability[day].available`.
Confidence: H - S50 shipped `7f3021c`, demo-critical bug cleared

## 2026-04-13 -- Save path: batchUpdate-only; adaptive fast path rejected
Decision: `batchSaveShifts` uses single `Sheets.Spreadsheets.Values.update` rewriting whole Shifts range; USER_ENTERED input; LockService.tryLock(10000) with CONCURRENT_EDIT error code.
Rationale: Playwright measured Apps Script floor ~7-8s/request; per-row optimization drowned out by per-call overhead.
Confidence: H - measured 2026-04-13

## 2026-04-13 -- CF Worker proxy as next structural step (post-demo)
Decision: Worker proxies frontend -> Apps Script, SWR cache on `getAllData` via Workers KV (60s TTL). Writes pass through uncached. Flip `API_URL` to enable/disable.
Rationale: Only path to sub-5s login while Apps Script remains. Free tier covers ~5k req/day usage.
Confidence: M - design complete, not yet implemented
Revisit if: Real-time push or audit log becomes hard requirement -> jump to Supabase.

## 2026-04-13 -- Welcome sweep as top-level fragment-child-0 overlay
Decision: Welcome sweep rendered first child of each post-login return fragment; plays 900ms independently via position:fixed + z-index 200. Removed 1000ms `minDelay` in handleLogin.
Rationale: Fragment-child-0 stability lets React keep DOM node across branch swaps; min-delay was floor not ceiling.
Confidence: H - S45 browser-verified

## 2026-04-13 -- PROJECT-ROUTING retired for RAINBOW
Decision: Deleted `docs/PROJECT-ROUTING.md`; removed RAINBOW row from `~/APPS/BridgingFiles/ROUTING-MASTER.md`; gated handoff command Step 3c to "file exists only".
Rationale: RAINBOW has no cross-project flow; file was dead weight.
Confidence: H - verified S45

## 2026-04-12 -- Backend callerEmail derived from `auth.employee.email`
Decision: Every protected Code.gs handler derives `callerEmail` from `auth.employee.email` after verifyAuth, not from payload. Code.gs v2.16.
Rationale: Token is authoritative; payload-sourced callerEmail was attacker-controlled post-S37.
Confidence: H - shipped S41.1, requires Apps Script manual deploy (done)

## 2026-04-12 -- HMAC session tokens + salted SHA-256 passwords (S36)
Decision: Login issues `base64url(payload).base64url(HMAC_SHA_256(payload, HMAC_SECRET))` with 12h TTL. Passwords stored as `base64url(SHA_256(uuidSalt + password))`. Dual-check on login migrates plaintext -> hash.
Rationale: Eliminates trust-the-client; stateless; no per-request sheet write. SHA-256 native to Apps Script via Utilities.computeDigest.
Confidence: H - deployed v2.13+, HMAC_SECRET Script Property set

## 2026-04-12 -- Payroll aggregator = path 1 (bridge, not replacement)
Decision: Post-demo, Rainbow ingests Counterpoint actuals, renders reconciliation + OT flags, admin enters bonuses, Rainbow emits ADP-ready export. Counterpoint + ADP stay as-is.
Rationale: Additive (nothing breaks), reuses existing knowledge; full replacement/full API is v2.
Confidence: L - pending demo go-ahead + Sarvi discovery answers

## 2026-04-12 -- S39.4 mobile admin extraction deferred
Decision: `if (isMobileAdmin)` branch in App.jsx stays inline; S39.4 defer post-demo.
Rationale: Conflicts with 2026-02-10 "mobile admin as if-branch" decision; no context provider yet.
Confidence: H - plan file flagged, skipped correctly

## 2026-04-12 -- Email body plaintext via MailApp (not HTML)
Decision: `buildEmailContent` returns plaintext; MailApp.sendEmail sends without `htmlBody`. XSS escape applied only to 5 PDF HTML sites.
Rationale: Plaintext not an HTML XSS vector; escaping there would render `&amp;` literally.
Confidence: H

## 2026-04-12 -- PDF + email builders extracted with circular imports
Decision: `generateSchedulePDF` -> src/pdf/generate.js; `buildEmailContent` -> src/email/build.js; shared helpers -> src/utils/format.js. New modules import constants from `../App`; circle works because refs resolve at call-time.
Rationale: ESM live bindings allow circles when all uses are inside function bodies. App.jsx shrank 262 lines.
Confidence: H - build + smoke clean
Revisit if: Module-eval-time use of these constants introduced -> breaks circle.

## 2026-04-12 -- Chunked-save partial failure = hard failure
Decision: `chunkedBatchSave` returns `success:false` with `{savedCount, totalChunks, failedChunks}` if any chunk fails.
Rationale: Two success tiers is footgun; callers need simple retry semantics.
Confidence: H

## 2026-04-12 -- Schedule toolbar hides on non-schedule destinations (mobile admin)
Decision: Mobile admin Row-3 action buttons + Row-4 status banner only render when `mobileAdminTab === 'schedule' || 'mine'`.
Rationale: Toolbar belongs to its destination; matches Wk1/Wk2/Mine filing-tab pattern.
Confidence: H

## 2026-04-12 -- Perf: ROLES_BY_ID + toDateKey + React.memo on grid cells
Decision: O(1) ROLES_BY_ID map; `toDateKey(date)` no-alloc helper; React.memo on ScheduleCell/EmployeeRow/EmployeeViewRow/EmployeeScheduleCell; useCallback on grid handlers; useMemo for date strings.
Rationale: 280 cells re-rendering on every state change because inline arrow handlers kept new refs. Stable refs + memo eliminates churn.
Confidence: H

## 2026-04-12 -- Card shadows use accent-color halos
Decision: `THEME.shadow.card` / `cardSm` are rotating-accent halos; dark `rgba(0,0,0,0.6)` drop component removed.
Rationale: Dark drop-shadows invisible on navy per `docs/research/dark-mode-guidelines.md`. Accent halos reinforce OTR rotation identity.
Confidence: H

## 2026-04-12 -- Mobile bottom nav active state from modal/drawer state
Decision: `activeTab` computed from which modal/drawer is open (e.g. `mobileMenuOpen ? 'more' : ...`).
Rationale: No duplicate state; tapping tab opens the relevant modal; closing returns to 'schedule' automatically.
Confidence: H

## 2026-04-12 -- Admin desktop header: 4 actions + avatar dropdown
Decision: Export PDF, Publish, My Requests visible; avatar dropdown holds Add Employee, Manage Staff, Admin Settings, Sign Out.
Rationale: Sarvi daily actions one click away; low-freq account actions behind dropdown; preserves OTR rotating-accent ring.
Confidence: H - S42

## 2026-04-12 -- Welcome sweep on login (full-screen 5-stripe rainbow)
Decision: 900ms cubic-bezier translateX sweep across 5 OTR accent stripes; respects prefers-reduced-motion.
Rationale: Store is literally "Over the Rainbow"; color sweep is the brand door chime.
Confidence: H - Sarvi approved

## 2026-04-12 -- Publish button: hardcoded white text, not auto-contrast
Decision: TooltipButton variant="primary" uses hardcoded `color: '#FFFFFF'` over rotating accent gradient.
Rationale: JR chose visual consistency over WCAG AA on green rotation (3.1:1); documented trade-off.
Confidence: H
Revisit if: Accessibility audit flags or Sarvi reports green-day readability issues.

## 2026-04-12 -- AnimatedNumber supports decimal precision
Decision: Accepts `decimals`, `suffix`, `overtimeThreshold` props. Hours display "12.5h" not "13".
Rationale: Hours in this app are .5-precision; rounding broke display.
Confidence: H

## 2026-04-12 -- WCAG contrast via proper calculation
Decision: Replace simple luminance `0.299r + 0.587g + 0.114b` with WCAG relative luminance + contrast ratio; pick white vs navy per accent.
Rationale: Green 0.421 and Red 0.410 too close for threshold; proper calc auto-adapts to any future accent.
Confidence: H

## 2026-04-11 -- OTR dark navy + rotating rainbow accents
Decision: `#0D0E22` page bg; white content cards; 5 OTR brand colors cycle via localStorage index; role colors mapped to OTR palette (non-rotating).
Rationale: Dark matches store aesthetic (stone/copper/wood); rotating embodies "Over the Rainbow".
Confidence: H

## 2026-04-11 -- OTR accent colors immutable
Decision: 5 accents fixed: Red `#EC3228`, Blue `#0453A3`, Orange `#F57F20`, Green `#00A84D`, Purple `#932378`. Other colors adapt around them.
Rationale: Literal brand colors from OTR bags/tags/signage.
Confidence: H

## 2026-02-10 -- Mobile admin as if-branch in App.jsx
Decision: `if (isMobileAdmin)` branch inline; not a separate component.
Rationale: 30+ state pieces avoid prop drilling without adding state library.
Confidence: H
Revisit if: State library adopted or admin state refactored into React Context.

## 2026-02-10 -- Desktop-only features excluded from mobile admin
Decision: Employee mgmt, per-employee auto-populate, PDF export excluded from mobile admin.
Rationale: Infrequent tasks; complexity unjustified.
Confidence: H
Revisit if: Sarvi requests mobile or mobile becomes primary admin device.

## 2026-02-10 -- GET-with-params over POST
Decision: All API via `GET ?action=NAME&payload=JSON` through `apiCall(action, payload)`.
Rationale: Apps Script POST returns HTML redirect (not JSON) causing CORS/parsing failures.
Confidence: H

## 2026-02-10 -- Chunked batch save (15-shift groups)
Decision: Large saves split into 15-shift chunks.
Rationale: Apps Script GET URL ~8KB limit; chunk size leaves headroom for long names.
Confidence: H
Revisit if: Backend migrates off Apps Script GET, or POST becomes reliable.

## Superseded

## 2026-04-13 -- Pitch deck decisions (deck finalized S65) (Superseded by completion)
Decision: Multiple pitch-related decisions (slide 1-5 layouts, pricing structure, footers, Phase 2 folding, cost-of-doing-nothing framing, 4-card Slide 4, Build Investment Fee, IP retention, typography baseline, photo system) shipped during S46-S65.
Rationale: Pitch deck lives in sibling project `~/APPS/RAINBOW-PITCH/`; 2026-04-15 demo marked these decisions done.
Confidence: H - deck finalized per JR S65

## Rejected

- jsPDF font subset / jsPDF emoji cleanup -- PDF uses HTML + browser print, not jsPDF; jsPDF entries stale.
- batchGet via Sheets.Spreadsheets.Values -- FORMATTED_VALUE returns booleans as strings; SERIAL_NUMBER needs hardcoded column list. Maintenance debt; reverted in v2.19/v2.19.1.
- Adaptive per-row fast path on batchSaveShifts -- Apps Script ~7-8s floor dominates; reverted.
- Tonight-shippable login wins (loginWithData combined endpoint, CacheService pre-warm) -- redundant once CF Worker ships.

<!-- TEMPLATE
## YYYY-MM-DD -- [Decision title]
Decision: [one sentence statement of what was decided]
Rationale: [one to three sentences on why]
Confidence: H -- [source], verified YYYY-MM-DD
(or Confidence: M)
(or Confidence: L -- [what would verify])

Rejected alternatives (optional):
- [alternative] -- rejected because [reason]

## YYYY-MM-DD -- [Older decision, still valid]
...

## YYYY-MM-DD -- [Decision ratified from auto-loop observation]
Decision: [one sentence statement]
Rationale: [one to three sentences]
Confidence: H-holdout -- ratified from <mode>/<tag>, verified YYYY-MM-DD
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## YYYY-MM-DD -- [Old decision] (Superseded by YYYY-MM-DD)
...
-->
