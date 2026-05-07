<!-- SCHEMA: DECISIONS.md
Version: 6.4
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
- Mark invalidated entries `Superseded` and retain them in the file. The audit trail depends on superseded entries staying readable.
- Rejected alternatives may be noted under the decision when they are likely to
  resurface or when the rejection rationale saves future re-litigation.
- If you catch yourself writing temporary plans, open questions, or task
  checklists, move them to TODO.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries
  to CONTEXT/archive/decisions-archive.md until char count is at or
  below 60 percent of ceiling (15,000 chars for the 25,000-char ceiling). Cut
  deep on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains `Superseded by: <link>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale.
- Move priority: superseded with link first, oldest first; then
  superseded no link, oldest first; then oldest non-superseded by
  date heading. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact.
- On first move, create CONTEXT/archive/decisions-archive.md from
  its schema (see decisions-archive.md header below) if absent.
- Optional theme condensation: when 4 or more archived entries share
  a theme and oldest > 3 months, propose a synthesized entry in the
  active file with backlinks to the merged entries. Confidence on
  the synthesized entry equals the lowest of the merged set, with
  note `Synthesized from N entries, lowest input confidence M`.
  User must approve before write.
-->

## 2026-05-07 -- Test fixtures standardized; admin fixtures rest at Staff tier

Decision: Test fixtures renamed to **Test Employee1** (`john@johnrichmond.ca`, password `TestE`), **Test Employee2** (`johnrichmond007+onboarding-smoke@gmail.com`, password `TestE2`), **Test Admin** (`johnrichmond007+testadmin@gmail.com`, password `TestA`). All three Inactive at session end. **Test Admin's resting tier is Staff, not admin1** -- the frontend guard at `App.jsx:880-893` blocks deactivating any admin account; system requires demote-to-Staff before deactivate. To exercise admin1 paths during testing: Reactivate -> set Admin tier -> save -> test -> demote to Staff -> set Inactive -> save (multi-step roundtrip per session).

Rationale: JR asked for unified fixture names ahead of shift-switch testing 3 months out (target window: Aug 2026 schedule weeks). Standardized names eliminate the ambiguity of legacy "Test Guy" / "Onboard Smoke". Resting-Staff state for the admin fixture honors the "Inactive when not testing" rule despite the system's admin-deactivation guard. Localhost dev server hits the same Sheet as prod, so showOnSchedule=false on Test Admin and Inactive on the others keeps Sarvi's grid clean.

Confidence: M -- shipped via direct `saveEmployee` API call (form's Save button silently no-op'd on the admin demote-then-deactivate combination, surfaced as 4 separate UX bugs in `docs/audit/new-user-experience-2026-05-07.md`); persistence verified by Active 35 / Inactive 5 / Archive 2 final counts.

## 2026-05-06 -- Schedule PDF + grid: hierarchy row order, brand on info sheet, name columns, Week 1 print inset

Decision: **Schedule row order** (desktop admin + employee grids, mobile admin/employee, PDF tables, AutofillClearModal list order) uses `sortSchedulableByHierarchy` in `src/utils/employeeSort.js`: Sarvi by first-name pin, then names in `SCHEDULE_ROW_FIRST_NAME_ORDER` (`src/constants.js`), then everyone else alphabetically by full `name`. **`employeeBucket` (admin1/admin2/FT/PT) remains only for AutofillClearModal bucket presets**, not for ordering. **PDF/UI divider `<tr>` / chrome** follows `scheduleDisplayDividerGroup` (Sarvi vs listed-first-names vs tail), not FT/PT buckets. **PDF brand:** OVER THE / RAINBOW lockup prints **only** atop `page3InfoFooterHtml` (final sheet when admins exist; lone `.page-3` sheet when staff-only) via `.pdf-brand-lockup*` -- enlarged vs the legacy mini header; **removed** from above Staff Week 1 for wall-post workflows. **`@media print`:** `.no-print + .wk-block.staff { padding-top: 5mm }` matches Week 2 page-top inset. **Name columns:** desktop name track via `DESKTOP_SCHEDULE_NAME_COL_PX` (172); mobile frozen column `MOBILE_SCHEDULE_NAME_COL_PX` (84); PDF employee col 24mm; PDF first-name cell nowrap + ellipsis instead of `word-break`.

Rationale: Business hierarchy order decouples from admin1/admin2 permissions; wall display pins the info sheet at top so branding belongs there; wider columns prevent mid-token wraps on long first names.

Confidence: M -- shipped `db3e893`..`3ba199a`; JR session-close OK without formal print checklist.

## 2026-05-06 -- Schedule UI: `isOwner` does not remove grid rows; `showOnSchedule` + optional never-list strip hide

Decision: **Schedule grid / PDF / emailable set** use `filterSchedulableEmployees`: active, not deleted; staff (non-admin and not admin2) always; `isAdmin` or `admin2` only if `showOnSchedule`. **`isOwner` is not a hide flag** so co-owners who work the floor (e.g. Sarvi) stay on the grid when that bit is true and Show on schedule is on. **Remote / off-floor co-owner** stays off the grid via `showOnSchedule` false. **`SCHEDULE_UI_NEVER_LIST_EMAILS`** in `src/constants.js` (lowercase login emails) additionally drops matching rows from the **hidden staff** strip below the admin grid so JR does not appear there either; edit the list if the Employees-tab email differs.

Rationale: Prior code excluded every `isOwner` row from schedulable sets; making Sarvi co-owner hid her from the schedule. Visibility is a product choice: floor presence lives in Show on schedule; strip suppression is a tiny explicit allowlist for non-floor owner accounts.

Confidence: H -- shipped `74f78fc` (co-owner on grid) + `7606c66` (never-list strip); JR confirmed.

## 2026-05-06 -- saveEmployee privilege matrix (v2.32.5): admin1 tier writes, owner row immutability, no self tier edits

Decision: `saveEmployee` enforces explicit rules instead of the v2.32.1 "non-owner silent-drop owner-only fields" loop. **Admin1** caller = `isOwner` or (`isAdmin` and `adminTier` neq `admin2`). Admin1 may set `isAdmin` and `adminTier` on targets that are not owner rows. **Owner rows** (`isOwner` on target): no in-app changes to `isAdmin`, `adminTier`, `isOwner`, or deactivation (`active` true->false). **Self:** caller cannot change own `isAdmin` or `adminTier`. **`isOwner` column:** only caller with `isOwner` may change the flag on any row. Non-admin1 callers get `AUTH_FORBIDDEN` on tier deltas (defense in depth; admin2 cannot pass `verifyAuth` save path today). Frontend `App.jsx` strips `isAdmin`/`adminTier` from the payload only when caller is not admin1 tier (not only when not owner), so non-owner admin1s persist tier edits. `EmployeeFormModal` greys Staff/Admin/Admin2 when `currentUser.adminTier === 'admin2'`.

Rationale: v2.32.1 client strip dropped `isAdmin`/`adminTier` for every non-owner, so Sarvi (admin1, not owner) saw success toasts while the Sheet never updated; reload reverted. Co-owner Sheet fix alone does not help other admin1s. Backend must match product: owners are immutable for privilege in-app; admin2 stays view-limited.

Confidence: H -- shipped commit `d6010f4` (frontend) + JR paste-deploy backend v2.32.5 labeled in repo `backend/Code.gs` header.

## 2026-05-06 -- Employees lists: Deleted filter retired; Archive chip + EmployeesArchive panel owns archival UX

Decision: Desktop Employees modal (`EmployeesPanel`) and mobile Staff sheet (`MobileStaffPanel`) expose Active / Inactive / Archive (third chip, FolderArchive icon) for all admins. Opening `ArchivedEmployeesPanel` runs through `openArchivedEmployeesPanel`: owner proceeds (closes Employees or Staff, opens archive modal); non-owner gets informational toast. Desktop header admin dropdown no longer lists a separate Archive... menu row (duplicate removed). Legacy Sheets `deleted` flag rows appear under Inactive with "(legacy removed)" hint and skip Archive button on row actions. `ArchivedEmployeesPanel` uses `AdaptiveModal` so mobile gets bottom-sheet parity.

Rationale: Product vocabulary standardized on Archive vs EmployeesArchive; Deleted tab duplicated a deprecated sheet semantic and competed with the archive sheet workflow.

Confidence: H -- shipped commit `fbb8568`, pushed `origin/main`.

## 2026-05-06 -- Weekly overtime violations bucket net hours per Monday-start week inside pay period

Decision: `allViolations` passes each employee-week aggregate computed only over dates in the active pay period that share the same Monday-start calendar week as the evaluated grid date (`mondayOfLocalWeek`, `filterDatesSameMondayWeek` in `src/utils/date.js`). Shift editor receives distinct totals via `getEmpHoursFullPeriod` vs `getEmpHoursForWeekContaining`.

Rationale: Summing all 14 pay-period days compared weekly thresholds produced hundreds of false weekly-over violations.

Confidence: H -- shipped commit `0b83189`; JR localhost verified before ship.

## 2026-05-04 (s064) -- Pitch deck v2 shipped with VC-flagged soft spots accepted; ship-over-patch when buyer profile dampens line-level perfectionism

Decision: `pitch-revision-2026-05-04` branch shipped to `origin/main` HEAD `b71d79b` (13 commits = 10 plan-locked from coding-plan-executor + 3 JR-driven follow-on) without addressing two VC-critique-flagged items: (1) Proposal chart caption "pays for itself before it begins" is mathematically false at month 0 (Rainbow at $1,500 implementation, status quo at $0; status quo catches up at ~month 0.6); (2) walk-away cap floor/ceiling ambiguity ($2,991 ceiling, $1,500-$2,494 floor depending on walk-month, never disambiguated). Both tracked in TODO.md Blocked. The chart math conflation (Sarvi-time-cost vs cash-saved on Proposal three-year strip) was acknowledged-true and retained intentionally because the time-freed-for-higher-value-work argument holds independently. Growth-tax framing removed across Alternatives.jsx + feature comparison table because OTR is maintaining at 35 employees, not expanding.
Rationale: JR-stated "i actually really like it and want to ignore most of your issues." The structural inventory items shipped clean (Mani lead, cost-of-forgetting Lead, MIT Sloan removed, Mercer corrected, $2,991 cap explicit, ESA single-mention, per-card distinct angles, growth-tax stripped, page nav padding fixed, Today.jsx 5th annotation added). Buyer profile (Joel = slow + cheap family operator who personally trusts JR) dampens marginal returns from line-level perfectionism; closing the remaining VC items would have shifted the deck from "argues fit; soft spots exist" to "argues fit; soft spots closed" -- a marginal not transformative improvement against this specific buyer.
Confidence: H -- JR explicit ship instruction 2026-05-04, pushed to `origin/main`, fast-forward from `fc48565`.
Evidence: 13 commits 8b3996a..b71d79b on branch `pitch-revision-2026-05-04`, fast-forwarded to main; diff stat 11 files / +254 / -119; VC critique subagent ID `a61594357d92ba9de` retained for line-level objection inventory.

## 2026-05-04 (s063) -- Pitch deck competitive position: argue fit, not price; Rainbow loses on sticker at 35 employees

Decision: The Rainbow pitch deck does not lead with a price-comparison argument against named competitors. At 35 employees, Year-1 Rainbow ($7,464 CAD = $1,500 implementation + $497 x 12) is more expensive than Agendrix Essential ($2,176), Agendrix Plus ($2,932), Deputy Core ($3,740 CAD = $2,730 USD), and Deputy Core+HR+Analytics ($5,750 CAD = $4,200 USD); ADP Essential Time + TimeForge are quote-only and cannot be priced from public data. The deck's persuasion stays on the existing thesis -- custom-built to OTR's workflow, relationship asymmetry ("each was built first and shopped to customers second; Rainbow was built alongside Sarvi"), and the structural buyer-comfort edge (flat published pricing vs. quote-only sales walls; CAD vs. USD; no per-user growth tax; source-code escrow + ownership at trial-end). Competitor research findings land as ammunition for those existing arguments -- one new fact per Alternatives card -- not as a new pricing-comparison spine.
Rationale: Original plan-draft attempted to pivot the Proposal three-year strip onto a competitor-pricing comparison; research subagent's flag-out caught the parent-side strategic-premise error before it shipped. The deck's existing argument structure is correct; a sticker-price comparison would have lost the math and undermined the deck. Buyer (Joel Carman) is slow + cheap but personally trusts JR; the pitch's job is closing escape routes, not winning a side-by-side dollar table.
Confidence: H -- research-verified 2026-05-04 (subagent ID aac87f5a3cc6b9df0); JR-locked 2026-05-04 across multi-round dialogue.
Evidence: research output captured at `~/.claude/plans/rainbow-pitch-argument-inventory-2026-05-04.md` Research findings section; competitor pricing sources are vendor pricing pages (Deputy, Agendrix, ADP Canada, TimeForge), independent third-party reviews (Jibble, Tarmack, Zenbooks), all URL-cited in the subagent task output file `/tmp/claude-1000/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/bdb15a0e-8213-49ec-8473-f3a2bb18e705/tasks/aac87f5a3cc6b9df0.output`.

## 2026-05-04 (s063) -- Pitch deck force structure: argument-tier framework + escape-route-closure

Decision: The pitch deck's arguments are organized by force into three tiers, and every revision amplifies (not replaces) Tier 1 logic. T1 (unrelenting -- relationship asymmetry, custom-built demonstration, cost-of-forgetting card, Mani 2015 lost-sales, OTR ownership of source/data, bug fixes always included, quick-turn custom dev, capped trial spend $2,991). T2 (peer-reviewed corroborators -- Gap study 7% sales lift, Choper 2022 ILR Review, HBS 28M timecards, hidden-pricing buyer-side friction, per-user growth tax). T3 (supporting -- Sarvi's $30,452, AskRainbow chatbot existence, Phase 2 directions, market sweep). The deck closes every reasonable buyer escape route ("what if cost is wrong / fit is off / I'm locked in / it breaks / it can't change / what about the alternatives / can't I just wait") via a fact in some slide; the revision's job is to make those answers impossible to miss through visual hierarchy + sequencing. Force comes from inevitability (every alternative path closed by a fact), not from insistence. Tone stays measured -- describe the alternatives' published behaviors, never insult them.
Rationale: Several T1 arguments are currently buried in the deck (cost-of-forgetting at Ripple card 2 of 4; Mani 2015 at Cost card 5 of 5; OTR-ownership + bug-fixes-always + quick-turn-dev as Proposal points 3-5 in a 5-point grid behind two trial-restating points). Repositioning these to lead-altitude amplifies persuasion without inventing arguments. ESA stays at one mention (Today.jsx Safety Net), single-developer risk is explicitly excluded from deck slides per JR direct instruction (Joel doesn't hold this worry), and Sarvi's $30,452 stays on Cost slide only (diversification corroborator on the same slide; not the spine of every slide).
Confidence: H -- JR-locked 2026-05-04 across multi-round dialogue; foundation analysis at `~/.claude/plans/rainbow-pitch-argument-inventory-2026-05-04.md`.
Evidence: argument-inventory file; deck source at `~/APPS/RAINBOW-PITCH/src/` HEAD `fc48565` on `main`; tier framework derived from full slide-by-slide reading of Cover/Cost/Ripple/Today/Alternatives/Proposal/AskRainbow/Phase2 + Price + Spec.

## 2026-05-04 (s061) -- Employee lifecycle UX: single Archive button per entry point; auto-clear future shifts/events on every "remove from active" transition

Decision: Both delete-like surfaces in the app collapse to a single Archive button. EmployeeFormModal: `Erase` button + `Remove` button + `showDeleteConfirm` block all replaced with one Archive button (admin1+ tier, type-to-confirm name match). EmployeesPanel + MobileStaffPanel: `Remove` button on Inactive list rows renamed to `Archive` (same icon/label/confirm-copy across desktop and mobile). Both entry points call the same `archiveEmployee` backend action. Concurrently, every Active->Inactive, Active->Archive, and Inactive->Archive transition auto-clears future shifts + future events; the prior "warns but won't proceed" guard at App.jsx:860-869 (saveEmployee deactivation block) is retired entirely. Past shifts continue to receive the v2.32.0 snapshot (employeeName + employeeEmail backfill). Inactive remains the parking-lot state (still appears at the bottom of the desktop schedule); Archive remains the legal-retention exit (5-yr timer, owner-only restore). Backend `saveEmployee` wraps in `withDocumentLock_` so the deactivate transition is atomic with the future-clearing. Legacy `deleteEmployee` action stays one release as rollback hatch with 0 UI wires; drops next session.
Rationale: The s060 archive feature shipped a working backend but left two delete-like buttons in the edit modal (`Remove` for legacy soft-delete, `Erase` for the new archive). Sarvi has no way to know which to use, and the legacy soft-delete path silently leaves rows in the Employees sheet. The "warns but won't proceed" pattern was hit in-session when JR tried to deactivate Sadie -- the silent block makes the path unusable for the very employees who most need archiving. Auto-clear is the consistent answer across both transitions: deactivation and archive both mean "this person is gone for now or forever," and neither outcome is helped by preserving future shifts that someone else has to clear manually first. The single-Archive choice eliminates the dual-button confusion.
Confidence: H -- JR-stated 2026-05-04 across in-session design discussion; backend v2.32.2 paste-deployed; smoke 8/8 effective PASS at production via agent-browser CLI; 4 commits shipped (91b2976 backend + a02f7c4 EmployeeFormModal + 4e73a26 EmployeesPanel/App.jsx + 5c0d99c MobileStaffPanel addendum).
Evidence: plan `~/.claude/plans/tidy-mixing-beaver.md`; commits 91b2976 + a02f7c4 + 4e73a26 + 5c0d99c + d72b8c2 (TODO log); production smoke confirmed "Archive Test Admin? This will clear 2 future shifts and 0 future events..." dialog + post-archive grid update.

## 2026-05-04 (s060) -- Past-period edit lock: identity-keyed grace, not tier-keyed; 3-state employee lifecycle with archive sheet

Decision: Past-period writes (`saveShift` / `batchSaveShifts`) gated by a per-employee `pastPeriodGraceDays` numeric field. Owner (`isOwner=true`) bypasses entirely; everyone else gated -- Sarvi gets 7, default 0 for everyone else. New `EmployeesArchive` sheet holds erased rows with `archivedAt` + `archivedBy` columns; the existing soft-delete via `deleted=true` flag is deprecated for new flows but retained for back-compat reads. Three coexisting employee states: Active (`active=true, deleted=false`), Inactive (`active=false`), Archived (row in `EmployeesArchive`). Permission tiers: archive = admin1 (`isOwner || (isAdmin && adminTier !== 'admin2')`); unarchive + hard-delete = owner only; hard-delete additionally gated on 5-yr `archivedAt` retention plus type-to-confirm name match. No auto-purge (manual click on "Purge eligible" badge in owner-only Archived Employees panel).
Rationale: Three flavors weighed in-session. (1) Owner-only past-period edit is cleanest for compliance but Sarvi loses retroactive-fix authority. (2) Admin1-tier (JR + Sarvi) keeps Sarvi's authority but is brittle to future admin1 hires. (3) Time-window grace is most common in payroll-grade software but pure tier-keyed leaks authority to all admin1s. Final shape collapses (3) onto a per-employee field so the rule isn't a tier expansion -- only the explicitly granted employee gets grace, regardless of tier. Sarvi's 7-day grace is set by Sheet edit, not by code; future grants land the same way (no paste-deploy needed). Archive sheet vs. soft-delete-flag chosen because (a) row count keeps growing under flag (clutters Sheet at 5-yr retention scale), (b) Sarvi explicitly does not want to see fired employees in the app at all, and (c) compliance retention (Ontario ESA = 5 yr for some payroll records) needs a discrete retention timer keyed on `archivedAt`. Snapshot-on-archive backfills `employeeName`/`employeeEmail` into shift rows missing them so schedule history renders without an archive lookup -- the orphan-shift defensive filter idea (s058) is retired in favor of the snapshot path. Owner-only unarchive (with no time limit) covers mistake-recovery for Sarvi accidentally erasing a real employee.
Confidence: H -- JR-stated 2026-05-04 after weighing 3 flavors in-session; backend v2.32.1 paste-deployed by JR (deployment v2.33); Playwright smoke 7/7 PASS at production via agent-browser CLI; adversarial audit found 1 CRITICAL + 2 HIGH + 1 MED + 3 LOW + 1 pre-existing-bug-surfaced; all 7 actionable fixes shipped in commits 59d25c1 + 942481d.
Evidence: plan `~/.claude/plans/velvet-mixing-ripple.md`; commits 7fb3417 + 6850ca3 + 4f2cabf + 8f6d204 + 59d25c1 + 942481d; smoke artifacts in `/tmp/velvet-*.png`; v2.32.1 source in `backend/Code.gs` header; new files `src/utils/canEditShiftDate.js`, `src/modals/ArchivedEmployeesPanel.jsx`.


<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md across multiple sessions: s022 (2026-04-26), s024 (2026-04-26), s028 (2026-04-27 -- 3 PK entries), s042 (2026-04-29 -- Migration must-preserve-direct-edit superseded; Apps Script floor; Pitch pricing $1500+$497; Pitch chatbot v4; Pitch deck evidence-thread; Spec.jsx §6 ADP claim retirement; Post-trial month-to-month), s048 (2026-05-01 -- DATA plane scaffolded; Kit BOOTSTRAP v5.2; Migration shape; /audit single-mode; Mobile name col 60px; Cornell ILR; Recurring fee operational care; Supabase ca-central), s064 (2026-05-04 -- ceiling-driven cut: s055 internal-trust waiver + s055 FirstnameL passwords + s049 /audit v5 + s048 Email design + s047 24h cap retired + s046 CacheService bridge + s044 Migration vendor pricing + s043 Supabase schema). -->


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
