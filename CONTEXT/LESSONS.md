<!-- SCHEMA: LESSONS.md
Version: 5.2
Purpose: durable user preferences, repeated pitfalls, and workflow corrections; structured for machine-detectable findings extraction.
Write mode: append new entries. Update Affirmations counter on recurrence.

Slot structure (per entry):
- Rule: (required) imperative single-clause stating what to do or avoid.
- Trigger: (required) when this rule fires -- one clause.
- Why: (required) mechanism -> consequence in <=2 sentences.
- Provenance: (required) date -- commit -- 1-line incident description.
- Wrong way: (optional) concrete anti-pattern only: code snippet, named function, or named pattern with a name. Omit if fuzzy.
- Tags: (required) 1 controlled surface: tag + 1 controlled concern: tag; optional free-form tags appended.
- Affirmations: N (carry over from v3; starts at 0 for new entries).
- [Confidence: / Graduated: / Source: / Origin:] (optional; same semantics as v3).

Per-slot sentence frames:
- Rule: <verb-imperative> <object> <when/where>. (one clause, one period)
- Trigger: When <condition or workflow step>. (one clause, one period)
- Why: <mechanism>. <consequence if rule omitted>. (two sentences max)
- Provenance: <YYYY-MM-DD> -- <commit-or-session> -- <1-line incident>.
- Wrong way: <named pattern or code snippet>. (concrete; omit if fuzzy)

Atomicity rule (replaces word/sentence caps): one rule, one trigger, one why per entry. If your draft fuses multiple lessons, split into N entries.

Wrong way slot guard: `Wrong way:` is filled only when the anti-pattern is concrete: a code snippet, a named function call, a specific pattern with a name. Fuzzy anti-patterns ("don't be sloppy", "avoid bad code") conflict with other rules; omit the slot when the anti-pattern is fuzzy.

Tags controlled vocabulary (starter set):
- surface: [react, css, html-pdf, sheets, apps-script, vercel, neon, deploy, ci, schema, prompt-kit, harness, build]
- concern: [type-coercion, auth, perf, layout, render, data-shape, migration, ux, error-handling, observability, dependency, naming]
- Consumers may extend their per-project vocab in their own LESSONS schema header during BOOTSTRAP migration.

Rules:
- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Before appending a new entry, grep this file for existing entries with a
  similar title (case-insensitive, substring match on the main noun phrase).
  If a match exists, increment its Affirmations counter instead of creating
  a duplicate. Duplicates dilute the graduation signal.
- Increment Affirmations when the user restates the lesson or the same
  correction recurs in a later session.
- Graduate to the root adapter (or kit prompt) when Affirmations reaches 2,
  OR when its absence caused a repeated failure class that cost real time.
  When a lesson is folded into a kit prompt, root adapter, or canonical
  CONTEXT file, mark the entry with `Graduated: YYYY-MM-DD to <target>` so
  future sessions do not re-fold and the archive flow can move it under
  ceiling pressure.
- Confidence level only when the lesson is inferred rather than explicitly
  stated by the user. Same H/M/L scale as DECISIONS.md (same grammar).
- Optional Evidence field when the lesson came from auto-loop observation.
  Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation)
  or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated
  in. Used on globally-graduated entries to preserve provenance.
- Do not log one-off chat trivia.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md,
  remove the duplicate.
- ASCII operators only.

Archive behavior:
- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries
  to CONTEXT/archive/lessons-archive.md until char count is at or below
  60 percent of ceiling (15,000 chars for the 25,000-char ceiling). Cut deep
  on each pass so the next trigger is not immediate.
- Move triggers: (1) entry gains a `Graduated: YYYY-MM-DD to <target>` field;
  (2) ceiling crossed (forced); (3) session-end opportunistic when
  entries are clearly stale (lesson references files no longer in the
  project, or the cited failure class can no longer occur).
- Move priority: graduated entries first, oldest first; then oldest
  non-graduated by entry order. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact,
  including Affirmations counter and Graduated note.
- On first move, create CONTEXT/archive/lessons-archive.md from
  its schema (see lessons-archive.md header below) if absent.
- Cross-project graduation flow is separate and unchanged:
  `[GLOBAL]`-tagged lessons hitting 2+ cross-project affirmations move to
  `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` per HANDOFF graduation flow, NOT to
  the per-project archive. The archive holds project-scoped graduated
  and stale entries only.
-->

<!-- 2026-05-04 (s061) archive pass: 78 entries moved to CONTEXT/archive/lessons-archive.md to bring active under 60%-of-ceiling target (15k chars). Carry from s059 + s060. Archive holds full preserved entries. Future entries: append at top per "newest at top" rule. -->

## [PROJECT] -- OTR 5 brand accent colors immutable

Rule: Use only the OTR 5 brand accent hex codes (#EC3228 red, #0453A3 blue, #F57F20 orange, #00A84D green, #932378 purple) for non-functional accents; do not introduce additional accents or modify these without explicit JR approval.
Trigger: When adding or modifying any UI accent color across scheduler / pitch / PDF / email surfaces.
Why: Brand identity for Over The Rainbow / Rainbow Jeans depends on this exact 5-color palette. Drift fragments visual identity across surfaces.
Provenance: 2026-04-28 -- BOOTSTRAP -- graduated from CLAUDE.md / Cursor adapter Immutable Constraints during v1 -> v5 consolidation; brand colors were the only adapter-immutable rule not already canonical in CONTEXT/*.
Tags: surface: react, concern: ux
Affirmations: 0

## [PROJECT] -- PDF HTML must declare UTF-8 charset
Rule: Ship PDF Blob HTML with `<meta charset="utf-8">` and Blob `type: 'text/html;charset=utf-8'`.
Trigger: When generating PDF / printable HTML opened via Blob URL.
Why: Old Safari (Sarvi's iPad) falls back to Latin-1 without an explicit charset, mojibake-ing multi-byte UTF-8 (em-dash, bullet) into glyphs like "ae". Missing the charset corrupts user-visible output.
Provenance: 2026-04-19 -- c002046 -- Sarvi reported "ae" glyph in PDF banner; root cause was missing charset meta.
Tags: surface: html-pdf, concern: render

## [PROJECT] -- Keep em-dashes out of PDF source
Rule: Use ASCII hyphens, never em-dashes, in PDF HTML source.
Trigger: When writing copy or banners that flow into the PDF generator.
Why: Belt-and-braces against any charset regression in iOS Safari. ASCII hyphens cannot mojibake even if the charset declaration breaks again.
Provenance: 2026-04-19 -- c002046 -- em-dash in dateline rendered as garbage on Sarvi's iPad.
Tags: surface: html-pdf, concern: render

## [PROJECT] -- iOS Safari blob download fallback navigates the current tab
Rule: On iOS Safari blob exports, navigate the current tab to the blob URL when a popup is blocked; do not rely on `<a download>`.
Trigger: When wiring a blob-URL export path that may run on iOS Safari.
Why: iOS Safari ignores `<a download>` on blob URLs and saves the raw blob as `*.blob`. Forcing a download leaves the user with an unopenable file.
Provenance: 2026-04-19 -- c002046 -- exports were saving as `.blob` on Sarvi's iPad.
Wrong way: `<a download>` fallback on a blob URL in iOS Safari.
Tags: surface: html-pdf, concern: ux

## [PROJECT] -- Hardcoded <option> ranges silently truncate widened data
Rule: Size form `<select>` option ranges to cover migration-widened data with headroom.
Trigger: When a `<select>` option list is built from a fixed `Array.from` length over numeric range.
Why: Values outside the option range fall back to the first option on render and re-save as the wrong value, silently truncating the data. Without headroom, future widening repeats the bug.
Provenance: 2026-04-19 -- <unknown commit> -- EmployeeFormModal availability/defaultShift dropdowns capped at 19:00; v2.24.0 widener wrote 20:00 to Mon-Fri end; Playwright smoke showed Sadie's Mon end as 06:00; fix extended range to 22:00 (length 17).
Tags: surface: react, concern: data-shape
Affirmations: 0

## Apps Script and Sheets platform

## [PROJECT] -- Sheets stores numeric-looking passwords as numbers
Rule: Apply `String()` on both sides of password comparisons in Code.gs.
Trigger: When comparing a password read from Sheets column D in Code.gs.
Why: Sheets coerces numeric-looking passwords to numbers; strict comparison against a string fails. Without coercion, valid logins are rejected.
Provenance: <unknown commit> -- Apps Script / Sheets type-coercion pitfall on Employees column D.
Tags: surface: sheets, concern: type-coercion
Affirmations: 0

## [PROJECT] -- Sheets boolean columns: use `!!` truthy in this codebase
Rule: Use `!!` truthy coercion (or `=== true` only if value origin is a verified native boolean) when reading isOwner / isAdmin / active / deleted from the Employees tab; the codebase convention is `!!` widespread.
Trigger: When reading boolean columns from the Employees tab in Code.gs.
Why: Sheets checkbox cells store native booleans in the Employees tab, not strings "TRUE"/"FALSE". `!!` coerces both natively-boolean and string-typed values correctly. The earlier strict-eq `=== true` rule (pre-s060) no longer matches the codebase pattern at Code.gs:1181/2147/2148/2178/2336 and v2.32.1's `canEditShiftDate_`.
Provenance: 2026-05-04 -- s060 audit + s061 reconciliation -- v2.32.1 audit caught the conflict; codebase reaffirmed `!!` as the convention; rule rewritten to track reality.
Tags: surface: sheets, concern: type-coercion
Affirmations: 1

## [PROJECT] -- Apps Script web-app calls have ~7-8s floor
Rule: Do not design UX assuming a fast Apps Script round-trip; only a CF Worker or full migration removes the floor.
Trigger: When proposing a UX optimization that depends on Apps Script round-trip time.
Why: A no-op save takes ~7-8s on Apps Script web apps; per-row vs bulk distinctions are drowned out below that floor. Optimizing inside the floor delivers no observable win.
Provenance: <unknown commit> -- measured Apps Script web-app latency floor.
Tags: surface: apps-script, concern: perf
Affirmations: 0

## [PROJECT] -- Apps Script POST returns HTML redirect instead of JSON
Rule: Use GET-with-params for `apiCall(action, payload)` routes; try POST first for large payloads, fall back to chunked GET.
Trigger: When wiring a new `apiCall(action, payload)` route to Apps Script.
Why: Apps Script POST responses are returned as HTML redirects, not JSON, breaking `response.json()` parse. GET-with-params is the working contract.
Provenance: <unknown commit> -- Apps Script POST/redirect pitfall.
Tags: surface: apps-script, concern: data-shape
Affirmations: 0

## React, perf, and refactor hazards

## [PROJECT] -- Top-level use of `../App` symbols breaks circular imports
Rule: Keep all `../App` references inside function bodies in `src/pdf/generate.js`, `src/email/build.js`, `src/panels/*`, `src/modals/*`.
Trigger: When importing symbols from `../App` in any of those files.
Why: ESM live bindings resolve at call-time, so the cycle works only if all uses are deferred. Top-level reads break the cycle and crash on load.
Provenance: <unknown commit> -- circular-import constraint between App.jsx and its consumers.
Wrong way: `import { ROLES } from '../App'` at module top level in `src/panels/*`.
Tags: surface: react, concern: dependency
Affirmations: 0

## Workflow and process

## [PROJECT] -- Follow approved plan verbatim
Rule: Do not ask "bundle or split?" or "what's next?" mid-execution; if ambiguous, re-read the plan file instead of re-asking JR.
Trigger: When mid-execution on an approved plan and a sub-decision feels ambiguous.
Why: Plan sign-off removes decisions from the loop. Re-asking wastes context and erodes trust.
Provenance: <unknown commit> -- repeated correction; flagged for graduation to root adapter at next audit.
Tags: surface: harness, concern: naming
Affirmations: 2

## [PROJECT] -- Topics JR has explicitly closed stay closed
Rule: After JR explicitly closes a topic ("do not mention X again", "stop pushing X"), drop X from every downstream artifact (plan sections, audit findings, AskUserQuestion options, clarifications) for the rest of the session; surface again only if an external constraint forces it.
Trigger: When JR closes a topic in-session.
Why: Relitigating a closed topic costs time and trust. The "again" is the close, not a preference.
Provenance: 2026-04-26 -- ESA-placement close -- JR said "do not push esa more", then "ESA is mentioned once how i said last time and no more", then "your obsession with the esa rules must end" across three messages.
Tags: surface: prompt-kit, concern: ux
Affirmations: 0

## React conventions (from legacy conventions.md)

## [PROJECT] -- `useIsMobile()` at 768px breakpoint
Rule: Branch mobile vs desktop rendering with `useIsMobile()` at the 768px breakpoint.
Trigger: When implementing any device-split surface.
Why: 768px is the project's mobile/desktop boundary; ad-hoc breakpoints break parity audits across surfaces.
Provenance: <unknown commit> -- legacy conventions.md.
Tags: surface: react, concern: layout
Affirmations: 0

## [PROJECT] -- `verifyAuth(payload, requiredAdmin)` server-side on all protected endpoints
Rule: Call `verifyAuth(payload, requiredAdmin)` server-side on every protected endpoint; read `payload.token` (preferred) or legacy `payload.callerEmail`, and derive `callerEmail` from `auth.employee.email` (never destructure from payload).
Trigger: When adding or editing a protected endpoint in backend Code.gs.
Why: Destructuring `callerEmail` directly from payload bypasses the auth check. The S41.1 rule fixes the derivation point.
Provenance: S41.1 -- backend Code.gs auth rule.
Tags: surface: apps-script, concern: auth
Affirmations: 0

<!-- TEMPLATE (canonical -- substitute [PROJECT] with [GLOBAL] or [MODULE: name] as needed; add Confidence/Source/Origin/Graduated fields per schema header)
## [PROJECT] -- [Lesson title]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: <controlled>, concern: <controlled>
Affirmations: 0
-->
