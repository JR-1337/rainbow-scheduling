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

## 2026-05-07 -- Onboarding email body matches schedule-distribution branded shell (v2.33.0 -> v2.33.1 -> v2.33.2)

Decision: Onboarding emails (`sendOnboardingEmail`) render the full branded HTML shell on every send -- navy header with **NEW EMPLOYEE WELCOME** eyebrow, **Hi {firstName},** greeting row, admin's typed message body (escaped) wrapped in the shell, accent-bordered **GET STARTED** card containing sign-in URL + default-password format + first-login note. The card always renders; admin's typed message renders ABOVE it. Empty typed body -> email shows just the shell + greeting + GET STARTED card. New-User Guide URL deferred -- assume the app is intuitive enough to ship without a guide; add the guide URL to `ONBOARDING_EMAIL_STATIC_BLOCK_HTML_` when the guide page exists. Format pick locked: Option C (static webpage) per audit doc Section 6.

Rationale: v2.33.0 followed the literal R1 audit-spec pointer (`WELCOME_TEMPLATE_HTML_`) and only landed the URL + default-password paragraph in the welcome PDF attachment, leaving the email body empty when admin didn't type a message. JR flagged it: "there's no body MSG in the email." v2.33.1 added the always-on static block in the email body via `BRANDED_EMAIL_WRAPPER_HTML_`'s new `trustedHtmlAfter` opt; v2.33.2 added `headerEyebrow` + `greetingHtml` opts so the onboarding shell visually matches the schedule-distribution email JR pointed at as the gold standard. Both new opts default to existing values so other notification callers (time-off, swap, offer, schedule-change) render unchanged.

Confidence: M -- shipped commits `8f9c812` (R1 PDF) + `505b005` (v2.33.1 static block) + `1e2ac7e` (v2.33.2 branded shell match); paste-deployed v2.33.2 by JR 2026-05-07 session-end. Email-formatting smoke parked for s073 to verify visual rendering against v2.33.2-live. Welcome PDF paragraph + email body block kept in sync by hand (no shared constant -- two source-of-truth surfaces).

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



<!-- Older entries graduated to CONTEXT/archive/decisions-archive.md across multiple sessions: s022 (2026-04-26), s024 (2026-04-26), s028 (2026-04-27 -- 3 PK entries), s042 (2026-04-29 -- Migration must-preserve-direct-edit superseded; Apps Script floor; Pitch pricing $1500+$497; Pitch chatbot v4; Pitch deck evidence-thread; Spec.jsx §6 ADP claim retirement; Post-trial month-to-month), s048 (2026-05-01 -- DATA plane scaffolded; Kit BOOTSTRAP v5.2; Migration shape; /audit single-mode; Mobile name col 60px; Cornell ILR; Recurring fee operational care; Supabase ca-central), s064 (2026-05-04 -- ceiling-driven cut: s055 internal-trust waiver + s055 FirstnameL passwords + s049 /audit v5 + s048 Email design + s047 24h cap retired + s046 CacheService bridge + s044 Migration vendor pricing + s043 Supabase schema), s072 (2026-05-07 -- ceiling-driven cut: s064 Pitch deck v2 ship-over-patch + s063 competitive position + s063 force structure + s061 Employee lifecycle UX + s060 Past-period edit lock + 2026-05-06 Employees lists Deleted retired + 2026-05-06 Weekly OT bucket). -->


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
