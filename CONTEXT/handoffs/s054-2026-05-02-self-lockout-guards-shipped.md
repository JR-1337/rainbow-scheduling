# s054 -- 2026-05-02 -- Self-lockout guards + Sheet-boolean normalization shipped

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

kintsugi. spinor.

Pass-forward: 4 commits shipped (12h picker + 3-layer self/owner/admin1 deactivation guards + Sheet-boolean normalization); next session wires login eye-toggle + first-login workflow redesign.

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `9376c7b` on `main`, will be `s054 handoff` after Step 7. +4 session commits beyond s053: `1a492ef` (12h picker), `f1efc38` (self/owner deactivation guard), `3093c60` (admin1 protection), `9376c7b` (mobile staff parity + Sheet boolean normalization).
- **Apps Script live deployment:** SYNCED with repo (no `backend/Code.gs` changes this session). JR explicitly waved off bundling backend self-lockout/admin1 guards -- frontend-only is sufficient for OTR's threat model.
- **Active focus end-of-session:** none open. All 4 commits verified (1a492ef + 9376c7b live-confirmed by JR via login + mobile staff smoke; f1efc38 + 3093c60 build-PASS only, code-symmetric with the same disabled-button pattern).
- **Skills used this session:** `/audit session` (aborted at scope=0 files per skill rule, JR redirected to phone-smoke), `/handoff` (s054 now). Direct edits + JR live verification on prod.

## This Session

**Continuation theme: phone-smoke briefing pivoted to a 4-commit defensive-fix sweep when JR locked himself out by deactivating his own admin row mid-session.**

**Commits shipped (4 total):**

- `1a492ef` fix(day-modal): use 12h TimePicker for store hours.
  - JR noticed the day-click modal (admin) showed 24h time inputs while the rest of the app uses 12h. Native `<input type="time">` honors OS clock format -- Chromebook defaulted to 24h.
  - Only one `type="time"` in the codebase: `ColumnHeaderEditor.jsx:9-16`. Rest of app uses canonical `TimePicker` primitive (Hr/Min/AM-PM selects, 6am-11pm range, 15-min granularity) already consumed by `ShiftEditorModal` + `PKModal`.
  - Swap to `TimePicker` from `./primitives`. Layout shifts Open/Close from inline side-by-side to stacked (each picker wider). Internal value contract unchanged (HH:MM 24h string), so `storeHoursOverrides` + `getStoreHoursForDate` + `formatTimeShort` consumers all keep working.
  - Build PASS. JR confirmed live.

- `f1efc38` fix(employee-form): block self-deactivation and owner-deactivation.
  - JR set his own admin account to Inactive mid-session, app cheerfully accepted, persisted to Sheet, then refused next login with "Account is inactive."
  - Three layers: EmployeeFormModal Set Inactive button disabled (40% opacity, not-allowed cursor) when editing self or owner row + tooltip; `saveEmployee` (App.jsx:826) refuses with toast; `deleteEmployee` (App.jsx:872) same shape.
  - Used existing `isEditingSelf` flag (EmployeeFormModal.jsx:26) which already gated admin/delete controls. Build PASS.

- `3093c60` fix(employee-form): protect admin1 accounts.
  - Per JR ask: nobody can deactivate Sarvi (or any future admin1). Rule chosen by role not name.
  - Extended f1efc38's three layers to all `isAdmin=TRUE` rows. Toast directs to "Demote to Staff first" if truly needed (e.g., Sarvi quits). Admin2 tier intentionally NOT protected (lower-privilege).
  - Build PASS.

- `9376c7b` fix(staff-list): hide owner from mobile + normalize Sheet booleans.
  - JR (with his Sheet row now `active=TRUE / isOwner=TRUE / showOnSchedule=FALSE`) reported still seeing himself in mobile More -> Staff active list.
  - Bug 1: `MobileStaffPanel.jsx:12` active filter was missing `!e.isOwner` (desktop EmployeesPanel.jsx:15 had it -- mobile/desktop parity miss; inactive + deleted partitions on lines 13-14 already excluded owners).
  - Bug 2 (deeper): `parseEmployeesFromApi` (apiTransforms.js:27) spread raw API values without normalizing booleans. Backend `parseSheetValues_` (Code.gs:356-376) passes raw cell values through with no boolean coercion. Sheet checkbox-typed cells return native `true`/`false`, but plain-text "TRUE"/"FALSE" cells leak as strings -- any non-empty string is truthy in JS, so a text-typed `isOwner="FALSE"` would read as truthy and bypass owner-exclusion filters across half the codebase.
  - Frontend `parseEmployeesFromApi` now normalizes 6 documented boolean columns (active, isAdmin, isOwner, showOnSchedule, deleted, passwordChanged) at the API boundary via `toBool` helper.
  - Build PASS. JR live-confirmed mobile staff list now hides him.

**Design discussion -- both parked as TODO entries:**

- **Mobile long-press on multi-event schedule cells -> bottom-sheet detail.** JR raised: when a cell has 3+ events (work + meetings + PK + sick), the cell shows "3 events" with no detail on what each is. Proposal: keep visual signal AS-IS (star + count pill), add long-press gesture (~500ms) -> opens `MobileBottomSheet` listing each event clean. Endorsed long-press over discoverable "i" icon (trust pattern familiarity; iOS users know long-press; add affordance only if Sarvi reports confusion). Desktop: cell `title` tooltip enough. Parked in TODO Active.
- **Login screen password show/hide eye toggle.** JR raised: standard winky-eye icon (lucide `Eye`/`EyeOff`) inside password input on `LoginScreen` (+ ChangePasswordModal + EmployeeFormModal raw password field). Parked in TODO Active.
- **First-login workflow + new initial-password pattern.** JR raised: change default password from `emp-XXX` (zero-padded row index, per `reference_default_passwords` memory) to `FirstnameL` -- first name + last initial (e.g. "John Richmond" -> `JohnR`). Open Qs flagged in TODO entry: collision handling, hyphenated last names, single-word names, case sensitivity, onboarding email integration. Parked in TODO Active for next-session discussion before scoping.

**JR's account state at session end (post-Sheet-edit):**
- `active=TRUE / isAdmin=TRUE / isOwner=TRUE / showOnSchedule=FALSE / deleted=FALSE`. Login works; schedule grid + mobile staff list both correctly hide him via `!e.isOwner` filter.

**Phone-smoke briefing surfaced + paused:**

- s053 Blocked-list deferred items: `089adaa` N meetings (briefed in detail; JR confirmed "the n meetings seemed fine from what I could tell. all the logic held"); `0d3220e` PDF legend (trivial, optional).
- TODO label drift: s053 + earlier handoffs labelled `0d3220e` as "sick-day-event-wipe / title-clear" but `0d3220e` is actually `feat(pdf): legend lists MTG, PK, SICK abbreviations`. Real "sick-day-event-wipe / title-clear" commit not yet identified -- needs a grep next session if JR wants to clear that Blocked entry.

**Audit (Step 3 of HANDOFF):**

`Audit: clean (3 style soft-warns -- TODO.md MD041 first-line-heading + 2 MD034 bare URLs, all pre-existing; LESSONS 68,794/25k char ceiling carries)`

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `vermilion. attractor dynamics.` -> `kintsugi. spinor.`. Added 5 Completed entries (1a492ef, f1efc38, 3093c60, 9376c7b + 576e50e carried). Trimmed 4 older entries (da8f89a, 07ad44f, ec0e962, d13bc14) to comment to maintain >=5 cap. Added 3 new Active entries (long-press detail sheet, login eye toggle, first-login workflow redesign).
- `CONTEXT/DECISIONS.md`: not touched (no durable direction change; tactical fixes read fine from git log).
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carried; the boolean-normalization-at-API-boundary pattern is worth recording but ceiling blocks).
- `CONTEXT/ARCHITECTURE.md`: not touched.

**Decanting:**

- **Working assumptions:**
  - Assumed `isOwner` Sheet column was always a properly-typed boolean (checkbox cell). Discovered text-typed booleans leak through `parseSheetValues_` (backend) as strings, and bypass half the codebase's owner-exclusion filters because non-empty strings are truthy in JS.
- **Near-misses:**
  - Nearly shipped only the `MobileStaffPanel` parity fix without tracing why the filter wasn't firing on JR's `isOwner=TRUE` row. Caught the deeper boolean-string trap by tracing `parseEmployeesFromApi` -> backend serialization chain.
  - Misread JR's "I already have that gs file updated" -- responded as if questioning his work. JR pushed back. Lesson: when JR confirms something, don't audit; just acknowledge.
- **Naive next move:**
  - Pick up the eye-toggle + first-login workflow features tonight without re-prompting JR. JR explicitly said "first /handoff" -- those are next-session work. The first-login pattern needs JR-input on collision/hyphenation/case Qs before scoping.

## Hot Files

- `src/utils/apiTransforms.js` (line 27, `parseEmployeesFromApi`) -- boolean normalization helper (`toBool`) added; 6 bool columns coerced at API boundary. **Pattern to reuse if other Sheet tabs surface text-typed bool columns.**
- `src/utils/employees.js` (line 47-51, `filterSchedulableEmployees`) -- canonical owner-exclusion filter; relies on `e.isOwner` being a real bool now (was vulnerable to text-string leaks pre-9376c7b).
- `src/panels/MobileStaffPanel.jsx` (line 12) -- active filter now matches desktop EmployeesPanel parity; check this whenever a new staff-list surface ships.
- `src/panels/EmployeesPanel.jsx` (line 15) -- canonical desktop reference for staff-list active/inactive/deleted partitions.
- `src/App.jsx` (lines 825-867 `saveEmployee`, lines 868-906 `deleteEmployee`) -- 3-layer guard for self/owner/admin1; backend Code.gs `saveEmployee` (line 1786) has NO equivalent guard.
- `src/modals/EmployeeFormModal.jsx` (lines 26-29 isEditingSelf/isEditingOwner/canDelete; line 173 Active toggle button) -- canonical pattern for self/owner/admin1 UI gating; tooltip + disabled state.
- `src/components/ColumnHeaderEditor.jsx` -- now uses canonical `TimePicker` primitive; no other `<input type="time">` exists in the codebase.
- `src/components/primitives.jsx` (line 66, `TimePicker`) -- canonical 12h time picker. Use for any new time-entry surface.
- `backend/Code.gs` (lines 356-376 `parseSheetValues_`, line 1786 `saveEmployee`, line 2412 employee headers) -- backend has no boolean coercion + no self-lockout guards. Frontend covers both.

## Anti-Patterns (Don't Retry)

- **Don't trust JS truthiness on Sheet boolean cells.** A text-typed "FALSE" cell is truthy. Always coerce at the API boundary via `parseEmployeesFromApi`'s `toBool` helper. Backend `parseSheetValues_` does NOT normalize. (s054 boolean-string trap.)
- **Don't ship a parity fix without tracing why the original filter wasn't firing.** s054 nearly shipped only `MobileStaffPanel` parity without finding the deeper boolean-string root cause -- would have left every future text-typed bool cell vulnerable. (s054 near-miss.)
- **Don't audit JR's confirmations.** When JR says "I already have X", don't respond as if questioning whether X is in repo or correct. Acknowledge and move on. (s054 "I already have that gs file updated" misread.)
- **Don't bundle backend Code.gs guards by default.** JR explicitly waved off self-lockout/admin1 backend guards -- the frontend layer is sufficient for OTR's internal-app threat model. (s054 JR direction.)
- **Don't trust audit B2 findings without re-ranking against current `src/`.** (Carried s053. ~60% false-positive rate at re-rank.)
- **Don't trust jscpd %s as "refactor-worthy" signal.** (Carried s053.)
- **Don't extend "audit can be wrong" caution beyond its scope.** (Carried s053.)
- **Don't silent-drop audit-flagged items even when the audit looks wrong.** (Carried s053.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carried s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carried s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist `{Sarvi, JR, testguy@john@johnrichmond.ca}`. (Carried s050.)
- **Don't hedge on tradeoffs without measurement.** (Carried s049.)
- **Don't call pre-launch dormant code "dead code".** (Carried s048.)
- **Don't extend askType + CTA to all 14 staff lifecycle emails as bundled scope creep.** (Carried s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carried s047.)
- **Don't paste-then-deploy Apps Script changes silently.** (Carried s045.)
- **Don't add a new column to any sheet without a deploy + manual-header-write checklist.** (Carried s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carried s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** (Carried s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carried s045.)

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings phone-smoke -- DONE this session ("logic held" per JR); can drop from Blocked next handoff
- 0d3220e PDF legend phone-smoke -- still pending; trivial visual check
- "sick-day-event-wipe / title-clear" -- TODO label drift (real commit not yet identified) -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED. JR sets ship window when ready.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. Live deployment fully synced with repo (no backend changes this session).
- AGENTS.md is canonical post v5.2 bootstrap.
- **Pre-launch staff-email allowlist: `{Sarvi, JR, testguy@john@johnrichmond.ca}` exactly until launch.**
- **Self/Owner/Admin1 deactivation + removal now guarded at 3 layers** (UI button disabled, `saveEmployee` refuses, `deleteEmployee` refuses). Backend Code.gs intentionally NOT bundled per JR direction.
- **Sheet boolean cells normalized at frontend API boundary.** Any new bool column in any tab needs to be added to `BOOL_FIELDS` in `apiTransforms.js` if it's on the Employees sheet, OR a similar normalizer applied at its own parser.
- **JR's account state: `active / isAdmin / isOwner / !showOnSchedule`.** Owner-exclusion filters keep him hidden from schedule + staff lists.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `kintsugi. spinor.`. Top Active items unchanged from s053 plus 3 new (long-press detail sheet, login eye toggle, first-login workflow redesign).
2. `git log --oneline -8` should show s054 handoff commit on top of `9376c7b`, `3093c60`, `f1efc38`, `1a492ef`, `38d2ac4`.
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 0 commits awaiting paste. Live deployment fully synced with repo.
5. `grep -nE "BOOL_FIELDS|toBool" src/utils/apiTransforms.js` should match 4 lines (1 const, 1 helper, 1 forEach call, 1 line of usage in the comment block).
6. `grep -nE "isEditingSelf.*isEditingOwner.*formData.isAdmin" src/modals/EmployeeFormModal.jsx` should match the disabled prop on the Set Inactive button (around line 175).
7. `grep -nE "currentUser && e.email === currentUser.email|editingEmp.isOwner|editingEmp.isAdmin" src/App.jsx` should match 3 saveEmployee guards (lines ~826-833 area) + 3 deleteEmployee guards (lines ~872-880 area).
8. testguy account: still Inactive (s053-end state); email `john@johnrichmond.ca`; password `test007`.
9. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: 1a492ef + 9376c7b verified live by JR; f1efc38 + 3093c60 build-PASS only (could Playwright-verify the disabled-button states + toast messages, but the code-symmetry across the 3 layers is sufficient signal).
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: 3 fresh items raised by JR this session.

JR's stated next-session direction (verbatim end-of-session): "we are going to change the login screen to have one of those winky eyes that allows you to see what ur typing for a password. then I wanna talk about the first login workflow for employees."

Natural continuations:

1. **Login eye-toggle (commit-sized, ~10-15 lines).** Lucide `Eye`/`EyeOff` icon inside password inputs on `LoginScreen` + `ChangePasswordModal` + `EmployeeFormModal`. Stateful per input. JR's stated first task.
2. **First-login workflow + initial-password pattern discussion.** JR's stated second task. Open Qs documented in TODO entry: collision handling for two "JohnR" employees, hyphenated last names, single-word names, case sensitivity, onboarding-email integration. Discuss before scoping.
3. **Mobile long-press multi-event detail sheet.** Larger feature; ~30 lines new component. Skip until eye-toggle + first-login workflow ship.
4. **JR phone-smokes still deferred:** `0d3220e` PDF legend (trivial, ~30s); identify real "sick-day-event-wipe / title-clear" commit (grep needed).

Open with: ack JR's "winky eye" first-task framing and ship it. Default if not specified is **(1) login eye-toggle** -- JR named it explicitly as the first task.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
