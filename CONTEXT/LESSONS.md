<!-- SCHEMA: LESSONS.md
Version: 6.2
Purpose: durable user preferences, repeated pitfalls, and workflow corrections.
Write mode: append. Increment Affirmations counter on recurrence.

Schema body (slot definitions, sentence frames, tags vocabulary, rules, archive behavior, graduation flow):
~/context-system/specs/TEMPLATES.md, section `LESSONS.md schema body`. Read it before writing any entry.

Critical numbers (inline so a writer can write defensively without the sidecar read):
- Per-entry char cap: 500c. Overflow -> split per atomicity rule (one rule, one trigger, one why per entry).
- Active file ceiling: 25,000c. On cross, archive oldest to CONTEXT/archive/lessons-archive.md until <=15,000c (60%).
- Graduation auto-mark: when Affirmations reaches 2, write `Graduation: due YYYY-MM-DD` on the entry. HANDOFF Step 2 audits these and prompts review.
- Archive cadence: HANDOFF Step 3 runs an opportunistic archive pass when this session added 3+ entries, even if under ceiling.

ASCII operators only.
-->

<!-- 2026-05-04 (s061) archive pass: 78 entries moved to CONTEXT/archive/lessons-archive.md to bring active under 60%-of-ceiling target (15k chars). Carry from s059 + s060. Archive holds full preserved entries. Future entries: append at top per "newest at top" rule. -->

## [PROJECT] -- Adversarial line-level critique must precede plan-lock for content artifacts

Rule: Before locking a content-revision plan that a subagent will execute, run an adversarial line-level critique pass against the existing source AND the planned new content. Structural audits (argument tiers, repositioning, stat corrections) catch a different class of issue than line-level audits (claim provenance, math correctness, citation completeness, comparison-undermining specifics).
Trigger: When writing a content-revision plan (pitch deck, marketing copy, any text artifact) that will be executed by a subagent.
Why: A plan that passes a structural audit will still ship line-level errors a careful reader catches. Caught at execute-time means a follow-on patch round; caught at plan-time means the plan itself is corrected. The s063 -> s064 sequence shipped 10 plan-locked commits, then needed 3 follow-on commits to fix items (Alternatives growth-tax framing, page nav padding, Today annotation count) a VC-perspective critique surfaced.
Provenance: 2026-05-04 (s064) -- VC subagent `a61594357d92ba9de` caught chart math conflation, "pays for itself before it begins" math error, walk-away cap floor/ceiling ambiguity, growth-tax against a maintaining business, and competitor-pricing surfaces undermining "argue fit not price" thesis.
Tags: surface: prompt-kit, concern: workflow
Affirmations: 0

## [PROJECT] -- Pitch deck strategy "argue fit, not price" forbids surfacing competitor numbers Rainbow loses on

Rule: When the pitch deck deliberately avoids price comparison, audit every per-card competitor bullet for specific dollar amounts (per-user pricing, implementation fees, monthly minimums, headline plan prices). If a quoted number is lower than Rainbow's equivalent, strip it. High numbers that establish wrong-fit (e.g., "chains of 50-500 employees", "thousands of small businesses") stay.
Trigger: When writing or reviewing pitch deck competitor cards / Alternatives slide content.
Why: The "argue fit not price" thesis (DECISIONS s063) breaks the moment a calculator comes out. Quoting Deputy's $2,730 USD/yr or Agendrix's $3.25/user/mo invites the comparison Rainbow loses (Rainbow Y1 = $7,464 CAD, ~2x competitors). Bullets stay structural ("USD billing on a Canadian customer", "built for multi-location chains") and avoid surfacing specific competitor pricing. JR's principle: "yes keep the numbers out. unless they are high."
Provenance: 2026-05-04 (s064) -- JR-caught + fixed via Alternatives.jsx rewrite (commit `b71d79b`).
Tags: surface: pitch-deck, concern: ux
Affirmations: 0

## [PROJECT] -- OTR is maintaining at 35 employees, not expanding -- growth-assumption arguments are invalid

Rule: Do not write deck or marketing copy that assumes OTR is growing. OTR's stable-state is 35 employees with no expansion plans (JR-stated 2026-05-04). Per-user pricing critiques must be reframed around present-tense structural problems (vendor revenue uncoupled from value, line-item-per-employee regardless of fit), not future growth tax. "Per-user creep", "scales as OTR grows", "more headcount means more vendor revenue alongside expansion" all assume facts not in evidence.
Trigger: When writing deck competitor critiques, ROI projections, feature-comparison rows, or any forward-looking financial framing involving OTR's headcount.
Why: A growth-tax argument is hypothetical for a maintaining business; the buyer (Joel + family) doesn't share the assumption. The per-user critique still has teeth without growth (vendor revenue tied to roster regardless of value delivered), but the "as OTR grows" framing should be dropped wherever it appears. Caught + fixed across Alternatives.jsx Deputy bullet 2 + Agendrix bullet 3 + feature comparison table row 6 ("no per-user creep" parenthetical removed).
Provenance: 2026-05-04 (s064) -- JR direct correction.
Tags: surface: pitch-deck, concern: domain
Affirmations: 0

## [PROJECT] -- Inventory mobile-parallel render surfaces in every plan touching admin UI

Rule: Any plan that renames a button, changes a confirm copy, mounts a modal, or alters a panel render path on the admin side must inventory every mobile-parallel surface (App.jsx mobile branch, MobileStaffPanel, MobileAdminView, mobile modal mounts) and patch them in the same commit set.
Trigger: Pre-implementation plan inventory for any admin-side UI change in src/App.jsx, src/panels/, or src/modals/.
Why: App.jsx splits early into a mobile-admin branch and a desktop branch. Each branch has its own modal mounts and panel renders. Touching one branch ships a half-mounted feature into production. Hit twice in two sessions: s061 missed MobileStaffPanel on the Archive button rename; s062 missed mounting OnboardingEmailModal in the mobile admin branch (the EmployeeFormModal had the trigger but the target modal was only in the desktop tree).
Provenance: 2026-05-04 (s061 + s062) -- graduated from Anti-Patterns after second incident in same session window.
Tags: surface: react, concern: ux
Affirmations: 0

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



<!-- TEMPLATE
## [PROJECT] -- [Lesson title]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: prompt-kit, concern: migration
Affirmations: 0

## [GLOBAL] -- [Lesson title]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: schema, concern: naming
Affirmations: 1
(Graduates to root adapter at Affirmations: 2)

## [MODULE: auth] -- [Lesson title, inferred]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: harness, concern: auth
Confidence: M -- [what would verify]
Affirmations: 0

## [PROJECT] -- [Lesson ratified from auto-loop]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Wrong way: [named pattern or code snippet.]
Tags: surface: ci, concern: observability
Affirmations: 0
Source: meta-agent-ratified
Evidence: <mode>/<tag> (<metric>: <value>)

## [GLOBAL] -- [Lesson graduated from cross-project pattern]
Rule: [verb-imperative object when/where.]
Trigger: When [condition or workflow step.]
Why: [mechanism.] [consequence if rule omitted.]
Provenance: YYYY-MM-DD -- [commit-or-session] -- [1-line incident].
Tags: surface: prompt-kit, concern: migration
Affirmations: 0
Source: graduated-from-project
Origin: [project-a, project-b]
Graduated: YYYY-MM-DD to [target file or step]
-->
