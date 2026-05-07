# Canonical File Templates (Version 6.4)
<!-- Kit Version: 6.4 -->

This file holds the exact schema headers and content templates that `drivers/PROJECT_MEMORY_BOOTSTRAP.md` writes into each canonical file on initialization or refresh. The bootstrap prompt defers to this file so the bootstrap's framing prose (when to write, ownership rules, upgrade semantics) is decoupled from the template payloads.

Each canonical file gets a schema header at the top and a template at the bottom. These are HTML comments -- invisible in rendered markdown, fully visible to any agent reading the raw file. Preserve existing content between header and template when refreshing.

**Read order:** BOOTSTRAP Step 3 ("File Header Generation" pointer) sends the agent here; BOOTSTRAP Step 10 (Upgrade Mode schema replace) also reads this for current versions.

**Scope of this file:** per-file schema + template pairs for `CONTEXT/*` and `CONTEXT/archive/`, optional `DATA/catalog.md` (project data plane; required before `LOOP/<mode>/` unless cold-start opt-out per drivers/LOOP_CREATION.md), plus the root adapter templates for Claude Code and Cursor (Codex reads `AGENTS.md` natively and needs no shim). The `observations.md` schema (lives under `LOOP/<mode>/`, not `CONTEXT/`) is defined in drivers/LOOP_CREATION.md Step 3 and is not repeated here. **Loop mode folder name** (`{MODE}`) and **mutable filename** (`{MUTABLE_FILE}`) rules live in drivers/LOOP_CREATION.md **Post-gate naming** only; agents derive proposals after the Pre-Scaffold Gate, humans confirm in Step 1 Q1/Q2.

---

## `TODO.md` header

```
<!-- SCHEMA: TODO.md
Version: 6.4
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Concision via shape, not word count -- match the example structure.
- ASCII operators only (see Operator Legend in the Telegraphic Memory Style section of specs/BOOTSTRAP_REFERENCE.md).
- If you catch yourself writing rationale, move it to DECISIONS.md.
- If you catch yourself writing architecture notes, move them to ARCHITECTURE.md.
- If you catch yourself writing preferences, move them to LESSONS.md.
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->
```

## `TODO.md` template

```
<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
```

## `DECISIONS.md` header

```
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
```

## `DECISIONS.md` template

```
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
```

## `ARCHITECTURE.md` header

```
<!-- SCHEMA: ARCHITECTURE.md
Version: 6.4
Purpose: current structure, boundaries, flows, and integrations.
Write mode: overwrite the snapshot each time. This file is a current-state view; rationale history belongs in DECISIONS.md.

Rules:
- Snapshot of the system as it is now. Not a log of how it got here.
- Concise enough to rescan quickly. Long details belong in reference docs.
- Describe components, flows, integrations, and boundaries.
- If you catch yourself writing task state, move it to TODO.md. Rationale
  history belongs in DECISIONS.md; preferences belong in LESSONS.md.
- Concision via shape, not word count -- match the example structure.
- ASCII operators only.
- Update on structural change, not on routine progress.
-->
```

## `ARCHITECTURE.md` template

```
<!-- TEMPLATE
## Overview
- [one line stating what this system is]

## Components
- [component] -- [purpose] -- [key files or dirs]
- [component] -- [purpose] -- [key files or dirs]

## Flows
- [flow name]: [start] -> [middle] -> [end]

## Integrations
- [external system] -- [how we talk to it] -- [owned by us or them]

## Boundaries
- In scope: [what this system owns]
- Out of scope: [what it does not]
-->
```

## `LESSONS.md` header

```
<!-- SCHEMA: LESSONS.md
Version: 6.4
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
```

The block above is the SHORT pointer that BOOTSTRAP byte-deploys into each consumer's `CONTEXT/LESSONS.md`. The full schema body lives in the next section and is sidecar content (NOT byte-deployed). Why split: pre-v6.2 the schema header was 5,074 chars (~34% of the active file's 15,000-char post-archive target). Sidecar reclaims ~4,060 chars of write budget per consumer (measured: 5,074c old header -> 1,016c new pointer block = 4,058c delta). Originating incident: 2026-05-04 (s051) -- RAINBOW Scheduling consumer's active LESSONS.md hit 68,794 chars (2.75x ceiling) and the post-archive trim landed at 14,670c with only ~10,500c of actual entry content under the 4k header tax.

## `LESSONS.md schema body`

The full reference for the LESSONS.md schema. The deployed pointer above directs writers here. This section is sidecar content; only the pointer block above is byte-deployed into consumers. Why: consumers carry the live LESSONS.md and need the writer-facing critical numbers inline; the rules/vocabulary/archive-flow detail is changeable from a single canonical location (here) without re-deploying every consumer.

### Slot structure (per entry)

- Rule: (required) imperative single-clause stating what to do or avoid.
- Trigger: (required) when this rule fires -- one clause.
- Why: (required) mechanism -> consequence in <=2 sentences.
- Provenance: (required) date -- commit -- 1-line incident description.
- Wrong way: (optional) concrete anti-pattern only: code snippet, named function, or named pattern with a name. Omit if fuzzy.
- Tags: (required) 1 controlled surface: tag + 1 controlled concern: tag; optional free-form tags appended.
- Affirmations: N (carry over from v3; starts at 0 for new entries).
- [Confidence: / Graduated: / Graduation: due / Source: / Origin:] (optional; same semantics as v3 plus v6.2 `Graduation: due`).
  - `Graduation: due YYYY-MM-DD` (NEW in v6.2) -- auto-written when Affirmations reaches 2; HANDOFF Step 2 (next session) audits and prompts user to finalize the graduation (writes the kit prompt / root adapter / canonical CONTEXT edit and converts `Graduation: due` -> `Graduated:`). Optional like the rest of this bracket: cleared by the `drop` audit option, absent until the auto-mark fires.

### Per-slot sentence frames

- Rule: <verb-imperative> <object> <when/where>. (one clause, one period)
- Trigger: When <condition or workflow step>. (one clause, one period)
- Why: <mechanism>. <consequence if rule omitted>. (two sentences max)
- Provenance: <YYYY-MM-DD> -- <commit-or-session> -- <1-line incident>.
- Wrong way: <named pattern or code snippet>. (concrete; omit if fuzzy)

### Atomicity and per-entry char cap

Atomicity rule (replaces word/sentence caps): one rule, one trigger, one why per entry. If your draft fuses multiple lessons, split into N entries.

Per-entry char cap (NEW in v6.2): 500 chars per entry, measured from the entry's `## ` heading line to the next `## ` heading line (or EOF). Overflow splits per the atomicity rule. HANDOFF Step 3 emits a soft-warn for any entry over cap.

Wrong way slot guard: `Wrong way:` is filled only when the anti-pattern is concrete: a code snippet, a named function call, a specific pattern with a name. Fuzzy anti-patterns ("don't be sloppy", "avoid bad code") conflict with other rules; omit the slot when the anti-pattern is fuzzy.

### Tags controlled vocabulary (starter set)

- surface: [react, css, html-pdf, sheets, apps-script, vercel, neon, deploy, ci, schema, prompt-kit, harness, build]
- concern: [type-coercion, auth, perf, layout, render, data-shape, migration, ux, error-handling, observability, dependency, naming]
- Consumers may extend their per-project vocab; document the extension in the consumer's own LESSONS.md sidecar pointer prose (above the SCHEMA block) during BOOTSTRAP migration.

### Rules

- Each entry scoped with [GLOBAL], [PROJECT], or [MODULE: {module-name}].
- Before appending a new entry, grep this file for existing entries with a similar title (case-insensitive, substring match on the main noun phrase). If a match exists, increment its Affirmations counter instead of creating a duplicate. Duplicates dilute the graduation signal.
- Increment Affirmations when the user restates the lesson or the same correction recurs in a later session.
- Graduation auto-mark (NEW in v6.2): when an Affirmations increment reaches 2, the same edit also writes `Graduation: due YYYY-MM-DD` on the entry. The agent does NOT execute the graduation in the same step -- the field is a flag for next-session review.
- HANDOFF Step 2 audit (NEW in v6.2): every `Graduation: due` entry **carried in from a prior session** surfaces via `AskUserQuestion` with options to finalize (write the kit prompt / root adapter / canonical CONTEXT edit and convert `Graduation: due` to `Graduated: YYYY-MM-DD to <target>`), defer (carry the field forward), or drop (clear the field; the lesson stays at Affirmations: 2 without graduation). Same-session auto-marks (entries that hit Affirmations: 2 in this session) are NOT audited in the same session -- they ride forward and surface at the next session's Step 2. Reason: separates the auto-mark edit from the graduation decision, gives the writer one session of distance, and keeps Step 2 focused on the durable carry-forward queue.
- Once an entry carries `Graduated: YYYY-MM-DD to <target>`, the next archive pass is eligible to move it under the priority rules below.
- Confidence level only when the lesson is inferred rather than explicitly stated by the user. Same H/M/L scale as DECISIONS.md (same grammar).
- Optional Evidence field when the lesson came from auto-loop observation. Format: <mode>/<tag> (<metric>: <value>). Reference only.
- Optional Source field: graduated-from-project (cross-project graduation) or meta-agent-ratified (auto-loop observation). Default human (omit).
- Optional Origin field: short name(s) of the project(s) the lesson originated in. Used on globally-graduated entries to preserve provenance.
- Skip one-off chat trivia. The graduation signal stays load-bearing only when entries earn their place.
- If you catch yourself duplicating state from TODO.md or DECISIONS.md, remove the duplicate.
- ASCII operators only.

### Archive behavior

- Active file ceiling: 25,000 chars. Above ceiling, move oldest entries to CONTEXT/archive/lessons-archive.md until char count is at or below 60 percent of ceiling (15,000 chars). Cut deep on each pass so the next trigger is not immediate.
- Move triggers (in order of priority):
  1. Entry gains a `Graduated: YYYY-MM-DD to <target>` field.
  2. Ceiling crossed (forced).
  3. Session-end opportunistic when entries are clearly stale (lesson references files no longer in the project, or the cited failure class can no longer occur).
  4. Archive cadence (NEW in v6.2): HANDOFF Step 3 runs an opportunistic archive pass when this session added 3+ new entries to LESSONS.md, even if under ceiling. The pass uses the same priority order; if no `Graduated:` entries exist, drop the oldest non-graduated until the file is back near its post-archive target. Why: spreads archive work across many small passes vs. one disruptive 75-entry pass at ceiling-cross.
- Move priority: graduated entries first (oldest first), then oldest non-graduated by entry order. Never move the top 5 newest entries.
- Both files newest-at-top. Moved entries keep all fields intact, including Affirmations counter and Graduated note.
- On first move, create CONTEXT/archive/lessons-archive.md from its schema (see lessons-archive.md header below) if absent.

### Cross-project graduation flow

Cross-project graduation flow is separate and unchanged: `[GLOBAL]`-tagged lessons hitting 2+ cross-project affirmations move to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md` per HANDOFF graduation flow, NOT to the per-project archive. The archive holds project-scoped graduated and stale entries only.

## `LESSONS.md` template

```
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
```

## handoff file header

Handoff files get a schema header only. No template; the handoff prompt defines the full shape.

```
<!-- SCHEMA: handoff
Version: 6.4
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time via atomic rename (write .tmp then mv).
             Retention governed by drivers/HANDOFF.md Step 6.

Rules:
- Filename: sNNN-YYYY-MM-DD-{short-slug}.md where NNN is the next three-digit session index (see drivers/HANDOFF.md Terminology).
- Required sections defined in drivers/HANDOFF.md (loop projects also include the LOOP-ONLY `Auto-loop state` section).
- Reference TODO.md and DECISIONS.md by name. The handoff carries continuity, not duplicated state.
- Routing and adapter content stays in AGENTS.md (root or module). The handoff is a session-continuity note, not a second adapter layer.
- Formatting rules (bold lead-ins, nested bullets, structural grouping, inline code, blank-line groups) defined in drivers/HANDOFF.md Step 5 "Formatting (scannability)" block.
- ASCII operators only.
-->
```

### Worked example: `This Session` formatting (v6.3)

The single most prose-heavy section of a handoff -- and the one most likely to bloat with process narration. Bold lead-ins are one line each (no multi-bullet shells under each lead-in). Compressed audit lines collapse the per-entry trail to one summary. Use this shape inside `This Session` and apply the same discipline to `Key Context` and `Next Step Prompt`. See `drivers/HANDOFF.md` Step 5 formatting block for the full default lead-in list, the forbidden defaults, and the rationale for each.

```markdown
## This Session

**Shipped-but-unverified:**

- <one-line: thing shipped + what verification remains owed>
- <one-line: thing shipped + what verification remains owed>

**External ops:**

- <one-line: paste-deploy / manual op outside git that next session should know about>

**Audit:** clean | clean (N style soft-warns) | <short list of relocations>

**Memory writes:** TODO + LESSONS (+1 entry, lessons_pre=23 lessons_post=24, no cadence trigger)

**Prune:** Anti-Patterns: <N> dropped (<reasons>), <M> graduated -> <targets>, <K> net-new added; Hot Files: <N> dropped (<reasons>), <M> added sNNN, <K> kept

**Graduation audit:** <N> finalized -> <targets>, <M> deferred, <K> dropped
```

Skip any default lead-in whose content is empty -- do NOT write a `**X:**` shell with no children. If `**Shipped-but-unverified:**` has nothing, omit the lead-in entirely. The single most common shape for a light session is one or two lead-ins total; for a moderate session, three to five.

Forbidden defaults (recoverable from elsewhere; do NOT include): `**Commits shipped:**` (-> `git log --oneline {prior}..HEAD`), `**Continuation theme:**` (recoverable from `Pass-forward` + commit subjects), `**Decanting:**` block (outputs already routed to `State` + `Anti-Patterns` by Step 2a), `**Design discussion:**` (durable decisions belong in `DECISIONS.md` with Confidence; preferences in `LESSONS.md`).

Keep one-line bullets at ~15 words. Anti-pattern: a bullet that is itself a paragraph. Anti-pattern: a bold lead-in followed by a single sub-bullet that could have been the lead-in's right-hand side (collapse into a one-liner instead).

## `archive/README.md` header (created lazily on first archival)

Rule: when the Ongoing Write flow first archives a doc into `CONTEXT/archive/`, also write `CONTEXT/archive/README.md` from this template if absent. This avoids a specified-but-unwritten artifact.

```
<!-- SCHEMA: archive/
Version: 6.4
Purpose: historical routing, integration, or decision docs with learning value.
Write mode: write once, do not update.

Rules:
- Filename: YYYY-MM-{short-slug}.md (month prefix, not full date)
- Delete pure redundancy instead of archiving.
- Archived docs are not active memory. The agent reads them only when
  history is directly relevant to a current question.
-->
```

## `decisions-archive.md` header (created lazily on first DECISIONS.md move)

Rule: when the active `CONTEXT/DECISIONS.md` first moves an entry under the Archive behavior rules in the `DECISIONS.md` header above, also write `CONTEXT/archive/decisions-archive.md` from this template if absent. Entries copy the `DECISIONS.md` template shape verbatim (date heading, Decision, Rationale, Confidence, optional Source, Evidence, Superseded fields). No separate `<!-- TEMPLATE -->` block here.

```
<!-- SCHEMA: decisions-archive.md
Version: 6.4
Purpose: retired decision entries moved out of active DECISIONS.md when
  the 25,000-char ceiling is crossed, on `Superseded by:` link, or on
  opportunistic stale review. Distinct from CONTEXT/archive/YYYY-MM-{slug}.md
  time-bucket retirements: this is a single growing file.

Write mode: prepend each moved entry at the top (newest first, mirrors
  active DECISIONS.md ordering). Never edit moved entries in place; if
  a moved entry is later re-litigated, write a fresh entry to active
  DECISIONS.md and reference the archived one by date heading.

Rules:
- Entries copy the DECISIONS.md template shape (see DECISIONS.md header
  above for fields and Confidence grammar). No new fields here.
- Newest at top, both this file and active DECISIONS.md.
- File born from this header on first move. No template block; the
  shape comes from DECISIONS.md.
- Optional synthesized entries (theme condensation, 4+ merged) live
  in active DECISIONS.md, NOT here. This file holds raw moved entries
  only. Synthesized entries reference the moved entries by date heading.
- ASCII operators only.
-->
```

## `lessons-archive.md` header (created lazily on first LESSONS.md move)

Rule: when the active `CONTEXT/LESSONS.md` first moves an entry under the Archive behavior rules in the `LESSONS.md` header above, also write `CONTEXT/archive/lessons-archive.md` from this template if absent. Entries copy the `LESSONS.md` template shape verbatim (scope tag, Lesson, Context, Affirmations, optional Confidence, Evidence, Source, Origin, Graduated fields). No separate `<!-- TEMPLATE -->` block here.

```
<!-- SCHEMA: lessons-archive.md
Version: 6.4
Purpose: retired LESSONS entries moved out of active LESSONS.md when
  the 25,000-char ceiling is crossed, on `Graduated: YYYY-MM-DD to <target>`
  marker, or on opportunistic stale review. Distinct from
  CONTEXT/archive/YYYY-MM-{slug}.md time-bucket retirements: this is
  a single growing file.

Write mode: prepend each moved entry at the top (newest first, mirrors
  active LESSONS.md ordering). Never edit moved entries in place; if
  a moved lesson recurs and earns new affirmations, write a fresh entry
  to active LESSONS.md and reference the archived one by title.

Rules:
- Entries copy the LESSONS.md template shape (see LESSONS.md header
  above for fields including Affirmations and Graduated). No new fields here.
- Newest at top, both this file and active LESSONS.md.
- File born from this header on first move. No template block; the
  shape comes from LESSONS.md.
- Cross-project graduations go to `{GLOBAL_ROOT}/CONTEXT/LESSONS.md`,
  NOT here. This file holds project-scoped retirements only.
- ASCII operators only.
-->
```

## `CONTEXT/drift-reports/drift-YYYY-MM-DD.md` header (written by /drift-scan cron)

Used when the per-consumer `/drift-scan` RemoteTrigger fires. Born lazily on first run by `drivers/DRIFT_CHECK.md` Step 3. Files live under `{PROJECT_ROOT}/CONTEXT/drift-reports/` as `drift-YYYY-MM-DD.md`. Rolling 5 (oldest deleted on each new write); committed + pushed on write; observation-only (never auto-fix, never auto-edit other `CONTEXT/*` files). Remediation happens at next interactive `/bootstrap`.

```
<!-- SCHEMA: CONTEXT/drift-reports/drift-YYYY-MM-DD.md
Version: 6.4
Purpose: scheduled drift-detection report from the per-consumer
  /drift-scan cron. One file per fire date; rolling 5 retained,
  oldest pruned on each new write. Observation-only -- the file is
  data for the next /bootstrap to act on, never an actor itself.

Write mode: written by drivers/DRIFT_CHECK.md Step 3 in a fresh remote
  Claude Code session triggered by the consumer's RemoteTrigger
  (registered in PROJECT_MEMORY_BOOTSTRAP Step 5b / UPGRADE Step 12b).
  Committed + pushed to main with message "drift-scan: YYYY-MM-DD
  (N signals)" -- N is the count of non-clean status keys.
  Never hand-edited.

Status keys (all 7 always present in the order below; "clean" stays
one line, non-clean lines expand inline with file:line citations):
- agents-md-body-drift -- AGENTS.md byte-diff vs kit's TEMPLATES.md
  AGENTS.md template (with {project-name} substituted).
- schema-headers-drift -- per-CONTEXT/* file, byte-diff of the
  <!-- SCHEMA: ... --> block against TEMPLATES.md canonical.
- char-ceilings -- files at or above 80 percent of their per-file
  ceiling (see drivers/PROJECT_MEMORY_BOOTSTRAP.md Verification),
  plus the latest handoff's Anti-Patterns and Hot Files sections
  at or above 80 percent of their 1,500-char per-section cap.
- operator-legend -- non-ASCII operator hits across CONTEXT/*
  (em/en-dash, smart quotes, Unicode math, box-drawing).
- pre-version-N-markers -- schemas or kit-version stamps below the
  current kit Version observed in the cloned kit snapshot.
- unknown-commit-provenance -- "<unknown commit>" residue across
  CONTEXT/* (audit-trail weakness).
- stale-snapshot-dir -- CONTEXT/.upgrade-snapshot/ present without
  RETAIN marker, mtime older than 7 days.

Rules:
- Status keys appear in the order above; missing a key is a malformed report.
- Header lines (Run, Kit version, Kit commit, Project commit) are
  required; the report is unverifiable without them.
- Never mutate other CONTEXT/* files from the cron's session.
  Remediation belongs to the next interactive /bootstrap.
- Rolling-5 retention is enforced by drivers/DRIFT_CHECK.md Step 4
  (sort by filename DESC, delete from index 5 onwards).
- ASCII operators only.
-->
```

## `CONTEXT/drift-reports/drift-YYYY-MM-DD.md` template

```
<!-- TEMPLATE
# Drift report -- {YYYY-MM-DD}

- Run: {UTC ISO timestamp}
- Kit version observed: {N}
- Kit commit: {short-sha from cloned kit snapshot}
- Project commit: {short-sha at scan time}

## agents-md-body-drift
clean

## schema-headers-drift
clean

## char-ceilings
clean

## operator-legend
clean

## pre-version-N-markers
clean

## unknown-commit-provenance
clean

## stale-snapshot-dir
clean

## Summary
0 drift signals detected.
-->
```

## `CONTEXT/projects.md` header (kit-side consumer registry, written by /bootstrap)

Used when `drivers/PROJECT_MEMORY_BOOTSTRAP.md` Step 5d (Fresh Init) or `specs/BOOTSTRAP_UPGRADE_REFERENCE.md` Step 12d (Upgrade) registers a consumer's GitHub origin URL with the kit. Lives at `~/context-system/CONTEXT/projects.md`. Read by `drivers/AGGREGATE_DRIFT.md` Step 1 (parse) and Step 3 (prune + last-seen update).

```
<!-- SCHEMA: CONTEXT/projects.md
Version: 6.4
Purpose: kit-side registry of consumer GitHub origins. The
  /aggregate-drift cron uses it to know which consumers to clone
  and summarize. Path-coordination only -- never a state ledger.

Write mode: upserted by drivers/PROJECT_MEMORY_BOOTSTRAP.md Step 5d
  (Fresh Init) and specs/BOOTSTRAP_UPGRADE_REFERENCE.md Step 12d
  (Upgrade), each carried out from the kit chat against a consumer.
  last-seen field updated and stale entries pruned by
  drivers/AGGREGATE_DRIFT.md Step 3. Never hand-edited.

Format: one entry per line in the form
  - {github-url} -- registered {YYYY-MM-DD}[, last-seen {YYYY-MM-DD}]
The github-url is the dedup key. Insertion order is fine; reverse
chronological is not required. Lines outside this shape (header,
comments) are ignored by the parser.

Rules:
- One entry per consumer (deduplicated by github-url).
- Skip registration for consumers without a github.com origin
  remote -- the aggregator cron cannot clone them. The kit-side
  /bootstrap surfaces a "registry skipped" line in that case.
- Prune is two-condition (entry registered >30 days ago AND
  drift-reports/ absent on the run). Aggregator never prunes on a
  one-off clone failure; that path keeps the entry and records
  clone-fail in the report.
- ASCII operators only.
-->
```

## `CONTEXT/projects.md` template

```
<!-- TEMPLATE
- {github-url} -- registered {YYYY-MM-DD}
- {github-url} -- registered {YYYY-MM-DD}, last-seen {YYYY-MM-DD}
-->
```

## `CONTEXT/project-reports/report-YYYY-MM-DD.md` header (written by /aggregate-drift cron)

Used when the kit-side `kit-aggregate-drift` RemoteTrigger fires. Born lazily on first run by `drivers/AGGREGATE_DRIFT.md` Step 4. Files live under `~/context-system/CONTEXT/project-reports/` as `report-YYYY-MM-DD.md`. Rolling 5 (oldest deleted on each new write); committed + pushed on write to the kit's main; observation-only (never modifies consumer repos, never auto-fixes drift on the kit).

```
<!-- SCHEMA: CONTEXT/project-reports/report-YYYY-MM-DD.md
Version: 6.4
Purpose: scheduled cross-consumer drift aggregate from the kit-side
  /aggregate-drift cron. One file per fire date; rolling 5
  retained, oldest pruned on each new write. Observation-only -- a
  human read surface for noticing fleet-wide drift patterns
  between interactive /bootstrap runs.

Write mode: written by drivers/AGGREGATE_DRIFT.md Step 4 in a fresh
  remote Claude Code session triggered by the kit-side
  kit-aggregate-drift RemoteTrigger. Committed + pushed to the
  kit's main with message "aggregate-drift: YYYY-MM-DD (M/N
  aggregated, P pruned)". Never hand-edited.

Header lines (all 7 always present in the order below):
- Run: UTC ISO timestamp
- Kit commit: short-sha from the cron's kit clone
- Registered consumers: count of entries parsed from projects.md
- Aggregated: count of consumers whose latest drift report parsed cleanly
- Skipped (no reports): clone OK, drift-reports/ absent or empty
- Skipped (clone fail): git clone failed (auth, quota, network)
- Pruned this run: entries removed from projects.md by Step 3

Per-consumer block (one ### {basename} block per consumer in the
registry at scan start, in registry order):
- url: full github-url from projects.md
- status: aggregated | no-reports | clone-fail
- registered: YYYY-MM-DD from projects.md
- (aggregated only) latest-report: YYYY-MM-DD from latest drift-* file
- (aggregated only) summary: the "N drift signals detected" line verbatim
- (aggregated only) non-clean keys: comma-list of drift status keys whose
  body did not begin with "clean", or "(all clean)" if none
- (no-reports only, age > 30 days) prune-candidate: "{N}d since
  registered, no reports" -- the entry will be removed by Step 3

Rules:
- Per-consumer block count must equal Registered consumers count.
- Status values are bounded to the three above; any other value is malformed.
- Never modify consumer files; cloned consumer working trees are read-only.
- Rolling-5 retention is enforced by drivers/AGGREGATE_DRIFT.md Step 5.
- ASCII operators only.
-->
```

## `CONTEXT/project-reports/report-YYYY-MM-DD.md` template

```
<!-- TEMPLATE
# Aggregate drift report -- {YYYY-MM-DD}

- Run: {UTC ISO timestamp}
- Kit commit: {short-sha from kit clone}
- Registered consumers: {N}
- Aggregated: {M}
- Skipped (no reports): {S1}
- Skipped (clone fail): {S2}
- Pruned this run: {P}

## Per-consumer

### {basename}
- url: {github-url}
- status: aggregated
- registered: {YYYY-MM-DD}
- latest-report: {YYYY-MM-DD}
- summary: {N drift signals detected}
- non-clean keys: {comma-list or "(all clean)"}

### {basename}
- url: {github-url}
- status: no-reports
- registered: {YYYY-MM-DD}
- prune-candidate: {N}d since registered, no reports   # only present when age > 30 days

### {basename}
- url: {github-url}
- status: clone-fail
- registered: {YYYY-MM-DD}

## Summary
{M} of {N} consumers aggregated; {S1+S2} skipped; {P} pruned.
-->
```

## `.claude/settings.json` hook block (installed by /bootstrap Phase 3)

Used when `drivers/PROJECT_MEMORY_BOOTSTRAP.md` Step 5c (Fresh Init) or `specs/BOOTSTRAP_UPGRADE_REFERENCE.md` Step 12c (Upgrade) installs the per-consumer hooks. The hook scripts themselves ship from the kit's `hooks/` directory and are copied verbatim into `{PROJECT_ROOT}/.claude/hooks/`. The settings block below is merged into the consumer's `.claude/settings.json` by `command` path (entries whose `command` starts with `.claude/hooks/` are kit-shipped and replaced on each install; idempotent re-install). The block lives in `settings.json` (committed) -- not `settings.local.json` (gitignored) -- so cloud sessions on a fresh clone (claude.ai/code) and any other machine cloning the consumer repo inherit the hook registration. Per-machine bypass remains available via `CONTEXT_HOOKS_DISABLED=1` env var.

The block is JSON, not a SCHEMA-headered markdown file -- Claude Code reads it directly. Comment-style schema documentation lives here in TEMPLATES.md instead.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/check-snapshot-required.sh" },
          { "type": "command", "command": ".claude/hooks/check-no-emdash.sh" },
          { "type": "command", "command": ".claude/hooks/check-agents-size.sh" }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/block-rm-rf-context.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/validate-schema-header.sh" }
        ]
      }
    ]
  }
}
```

Rules:
- Idempotent re-install: Step 12c reads existing `settings.json`, removes any existing entries whose `command` starts with `.claude/hooks/` (kit-shipped namespace), then merges the kit's current block. Other hooks the user added are preserved. Step 12c also purges any kit-shipped entries from `settings.local.json` left over from pre-fix installs (when this hook block previously lived there), so post-fix consumers don't fire hooks twice -- once from each file. User-added hooks in `settings.local.json` (commands not under `.claude/hooks/`) are preserved.
- Hook scripts in `.claude/hooks/` are kit-canonical copies; the kit-side `hooks/` directory is the source of truth. Updates propagate via `/bootstrap` upgrade re-run.
- Bypass: `export CONTEXT_HOOKS_DISABLED=1` in the parent shell BEFORE launching the harness (Claude Code spawns hook subprocesses with their own env, so inline-prefix on a single tool command does NOT reach the hook). See `hooks/README.md` Bypass section for caveats (systemd / wrapped launchers / `find -delete` alternative). Document the reason in `CONTEXT/DECISIONS.md` if the bypass touches durable content.
- Hook scripts must stay under 100 lines each so consumer auditing is cheap; logic that doesn't fit belongs in a kit driver, not a hook.

## `.claude/.upgrade-in-progress` marker (transient, written by /bootstrap upgrade)

Used by `specs/BOOTSTRAP_UPGRADE_REFERENCE.md` Step 7 (writes marker before snapshot capture) and Step 14 (deletes marker on verification success). The marker file is empty; its existence alone is the signal. The `check-snapshot-required.sh` hook reads it to decide whether to block CONTEXT/* writes.

```
(empty file at {PROJECT_ROOT}/.claude/.upgrade-in-progress)
```

Rules:
- Created at the start of UPGRADE_REFERENCE Step 7, before snapshot capture, so the hook covers any agent that skips ahead.
- Deleted by Step 14 (Verification + Snapshot Cleanup) once the upgrade run completes successfully.
- A stale marker (left by a crashed run) blocks CONTEXT/* writes legitimately. Resolution: re-run `/bootstrap` (which re-snapshots and clears) or manually delete after confirming snapshot integrity.
- Not in git (`.gitignore` covers `.claude/.upgrade-in-progress` per BOOTSTRAP Fresh Init Step 5).
- ASCII operators not applicable (file is empty).

## `DATA/catalog.md` header (optional project data plane)

Used when `drivers/DATA_CAPTURE_BOOTSTRAP.md` creates or upgrades `{PROJECT_ROOT}/DATA/catalog.md`. Not part of `CONTEXT/*`; lives beside `CONTEXT/` and `LOOP/`. `drivers/PROJECT_MEMORY_BOOTSTRAP.md` does not create this file; the data bootstrap does.

```
<!-- SCHEMA: DATA/catalog.md
Version: 6.4
Purpose: inventory of durable artifacts under DATA/ for loop scoring, gold sets,
  rubrics, and governance. Single source of truth for which paths automated
  score.sh may read (loop_use).

Write mode: append or edit rows when promoting files into DATA/. Every file
  under DATA/ except README.md and this file must appear as a catalog entry
  (path field). Staging may hold unpromoted blobs; validator may warn on orphans.

Entry fields (each entry is a markdown section ## id or a table row -- agent
  must keep path + loop_use + sensitivity present):

- id: stable slug (ASCII, kebab-case)
- path: relative path from DATA/ (e.g. fixtures/foo.json)
- kind: fixture | trace | rubric | export | other
- sensitivity: public | internal | pii | phi
- loop_use: score_input | gold_only | human_review | forbidden_in_automated_score
- hash_or_version: optional
- notes: one line

Rules:
- Scorers read only paths with loop_use == score_input unless human override.
- phi | pii rows require human review before score_input.
- ASCII operators only in notes.
-->
```

## `DATA/catalog.md` template

```
<!-- TEMPLATE
## fx-example-id
- id: fx-example-id
- path: fixtures/example.json
- kind: fixture
- sensitivity: public
- loop_use: score_input
- hash_or_version:
- notes: replace with real entry after promotion

| id | path | kind | sensitivity | loop_use | notes |
|----|------|------|-------------|----------|-------|
| ... | ... | ... | ... | ... | ... |
-->
```

## `DATA/routing-index.md` header (project-wide pointer map)

Used when `drivers/DATA_CAPTURE_BOOTSTRAP.md` creates or refreshes `{PROJECT_ROOT}/DATA/routing-index.md`. Sibling of `DATA/catalog.md` at the top of `DATA/`. Catalog inventories files under `DATA/`; routing-index points OUT of `DATA/` to authoritative sources elsewhere in the repo and to external integrations. Both are required deliverables of `/data-capture` (cold-start and refresh).

```
<!-- SCHEMA: DATA/routing-index.md
Version: 6.4
Purpose: routing index for project-authoritative sources that live outside DATA/.
  Answers "where does this project keep its gold?" -- points at in-tree files
  (knowledge, schemas, rubrics, fixtures, traces, lineage snapshots) and
  external truth sources (vendor APIs, model versions, integration endpoints).
  Distinct from DATA/catalog.md, which inventories files INSIDE DATA/.

Write mode: written by drivers/DATA_CAPTURE_BOOTSTRAP.md Step 5 from the Step 3
  subagent scan. Refreshed by re-running /data-capture (refresh mode). Entries
  are append-or-edit; do not silently drop entries on refresh -- if a path no
  longer exists, mark `status: removed` rather than deleting the row.

Organizing axis: by the eight baseline capture categories (cls 1-8). Categories
  are classification labels (purpose), not folder names (location). One file may
  appear in multiple categories; emit one entry per (path, category) pair.

Entry fields (markdown bullet under a `### Category N: <name>` heading):
- path: repo-relative path or external integration name
- sensitivity: public | internal | pii | phi
- role: 1-clause sentence on what this source authoritatively provides
- notes: optional free-form -- use for anything that does not fit the above
  (version pins, retention policy, gitignore status, cross-references)

Required sections in the active file (in order):
1. Per-category map (### Category 1 ... ### Category 8). Categories with zero
   observable artifacts get a single `- (no observable artifacts; gap noted)` bullet.
2. ## External integrations -- vendor APIs, model versions, third-party
   endpoints. One bullet per integration. Distinct from in-tree paths.
3. ## Governance summary -- 3-5 lines on PHI/PII boundary, retention policy,
   tool-boundary doc location. Per-entry sensitivity is canonical; this section
   summarizes the policy, does not duplicate row-level flags.
4. ## Gaps -- which of the 8 categories returned zero artifacts. Forward-looking
   note only; not a TODO.

Refresh triggers (run /data-capture refresh when):
- New top-level directory added to the project
- New SKILL / PK / knowledge file family added
- Major schema change to a primary contract file (e.g. extraction schemas, DB)
- New external integration (replacement vendor or new API surface)
- Annual review (catch silent drift)

Rules:
- ASCII operators only.
- Emit one entry per (path, category) pair. A file appearing in multiple
  categories produces multiple entries; the per-category map is the primary
  navigation axis, so keep them separate.
- `role` is one clause; verbose explanations belong in `notes`.
- Refresh never silently deletes; mark status: removed instead.
- This file is human-and-agent readable; not parsed by validate-data-catalog.sh.
-->
```

## `DATA/routing-index.md` template

```
<!-- TEMPLATE
# Data Routing Index -- {project-name}

Purpose: pointer map to project-authoritative sources outside DATA/. Refreshed YYYY-MM-DD via /data-capture.

## Per-category map

### Category 1: Ground truth and rubrics
- path: tests/ground_truth.md
  sensitivity: internal
  role: extraction scoring baseline against held-out fixtures.
  notes: optional.

### Category 2: Representative inputs (fixtures / slices)
- path: tests/sample_transcript.txt
  sensitivity: internal
  role: representative input fixture for pipeline tests.

### Category 3: Behavioral / production traces
- (no observable artifacts; gap noted)

### Category 4: Metric bridge
- path: dashboard/metrics-spec.md
  sensitivity: internal
  role: maps tracked scalars to client-facing dashboards.

### Category 5: Lineage (snapshots, API/doc versions)
- path: data/db-backup-vN.sql
  sensitivity: phi
  role: versioned DB snapshot pre-migration.
  notes: gitignored.

### Category 6: Cost / latency / reliability side signals
- (no observable artifacts; gap noted)

### Category 7: Governance (PII/PHI, retention, tool boundaries)
- path: .gitignore
  sensitivity: public
  role: declares PHI exclusions and retention boundaries.

### Category 8: Negative and gaming probes
- path: tests/adversarial_inputs.txt
  sensitivity: internal
  role: stress-tests degenerate or adversarial inputs.

## External integrations

- Anthropic Claude Opus 4.7 -- extraction (tool_use, temp=0.0).
- Vendor API X -- description; API version pin.

## Governance summary

PHI: clients/{slug}/ and data/db.* (gitignored, off-repo retention at <path>). PII:
named-fixture content in tests/ (in-repo, see CONTEXT/TODO if cleanup queued).
Tool boundaries: docs/tool-policy.md or equivalent. Sensitivity flags on each
entry are canonical; this section summarizes the policy.

## Gaps

- Category 3, 6 -- no observable artifacts. Forward-looking: drop a path here when
  the project starts capturing behavioral traces or cost/latency scalars.
-->
```

## Root adapter templates

The canonical adapter is `AGENTS.md`. The two per-tool files (`CLAUDE.md`, `.cursor/rules/context-system.mdc`) are minimal shims that point back to it. Codex reads `AGENTS.md` natively and gets no shim. BOOTSTRAP Step 3 (fresh init) creates all three (AGENTS.md + two shims); Step 10 (upgrade) handles legacy three-file projects via the v2.8 -> v2.9 consolidation path. (Kimi was removed from the kit on 2026-04-26; pre-removal language said "three per-tool files" / "all four" -- only two shims are current.)

`AGENTS.md` carries `<!-- AGENTS_SCHEMA_V1 -->` and `<!-- LOOP_ACCESS_RULES_V1 -->` markers so Upgrade Mode can detect state. Shims do not carry markers (they are stable text; their presence is verified by their existence + a pointer-string grep).

### `AGENTS.md` template

```markdown
# {project-name} -- Agent Adapter (canonical)

<!-- AGENTS_SCHEMA_V1 -->
<!-- LOOP_ACCESS_RULES_V1 -->

## Purpose

Thin routing layer for any coding agent (Claude Code, Cursor, Codex, Aider, Windsurf, Copilot, Amp, RooCode, etc.) working in this project. Canonical mutable memory lives in `CONTEXT/*`. This file is intentionally stable; update only when routing, ownership, or read/write behavior changes.

## Canonical Memory

All durable project state lives under `CONTEXT/`:
- `CONTEXT/TODO.md` -- current worklist, blockers, verification, recent completions
- `CONTEXT/DECISIONS.md` -- durable decisions with confidence and rationale
- `CONTEXT/ARCHITECTURE.md` -- current structure snapshot
- `CONTEXT/LESSONS.md` -- durable preferences, pitfalls, corrections
- `CONTEXT/handoffs/*.md` -- up to 3 recent handoffs; older archived per drivers/HANDOFF.md Step 6
- `CONTEXT/drift-reports/drift-YYYY-MM-DD.md` -- rolling 5; written by the per-consumer `/drift-scan` cron (registered at /bootstrap; reads kit machinery from local `.claude/kit/` snapshot, no kit clone), observation-only

Cross-project lessons live in `~/.context-system/CONTEXT/LESSONS.md` and are read only when `[GLOBAL]`-scoped context is relevant.

Optional project data plane: `DATA/catalog.md` inventories files INSIDE `DATA/`; `DATA/routing-index.md` is the pointer map to authoritative sources OUTSIDE `DATA/` (knowledge files, schemas, vendor APIs). Both are required deliverables of `/data-capture`. Required before any `LOOP/<mode>/` unless cold-start opt-out per `drivers/LOOP_CREATION.md`. Read `DATA/*` only for LOOP work, `drivers/DATA_CAPTURE_BOOTSTRAP.md`, or explicit `CONTEXT/TODO`.

## Ownership

Non-overlapping by design. If you catch yourself writing rationale in TODO, stop and move it to DECISIONS. If you catch yourself writing task state in ARCHITECTURE, stop and move it to TODO. If you catch yourself writing preferences in DECISIONS, stop and move them to LESSONS.

## Read And Write Rules

At session start: read `CONTEXT/TODO.md` only. The user's first prompt drives further `CONTEXT/*` reads on demand. Read `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, or `CONTEXT/LESSONS.md` when the topic surfaces or scope shifts. Read the latest handoff in `CONTEXT/handoffs/` only when resuming continuity.

Re-read any memory file when it changed, when scope shifts, when a contradiction surfaces, or before edits that depend on current plan / decisions / architecture.

PreToolUse and PostToolUse hooks installed by `/bootstrap` enforce the operator legend on `CONTEXT/*` writes, the AGENTS.md size cap (12K root / 8K module), the snapshot-before-write guarantee during upgrade, and the `rm -rf CONTEXT/` block. See `.claude/hooks/` for the manifest. Bypass: `export CONTEXT_HOOKS_DISABLED=1` in the parent shell before launching the harness; inline-prefix on a single tool command does NOT propagate to the hook subprocess. See `hooks/README.md` Bypass section for caveats (systemd / wrapped launchers / `find -delete` alternative).

Position-aware writes: in any file you write or update, place binding constraints at the top, pointers / background in the middle, and currently-active state at the bottom. Lost-in-the-middle attention rot is real; the middle is where the model's attention drops. Critical content goes top or bottom.

Write `CONTEXT/*` during normal work. Update `TODO.md` on status change. Update `DECISIONS.md` on durable direction change. Update `ARCHITECTURE.md` on structural change. Update `LESSONS.md` on durable preference or repeated pitfall. Write handoffs only on end-of-session request, atomically (`.tmp` then `mv`).

Confidence format on DECISIONS and inferred LESSONS entries:
`Confidence: H(-holdout)? -- <source>, verified YYYY-MM-DD` or `Confidence: M` or `Confidence: L -- <what would verify>`.

## Read Order

When multiple project context files exist (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*.mdc`), `AGENTS.md` is canonical. Harness shims (`CLAUDE.md`, `.cursor/rules/context-system.mdc`) point at `AGENTS.md` -- they do not duplicate routing content. First-match-wins applies WITHIN a tier (one canonical project-context file: AGENTS.md); additive applies ACROSS tiers (project AGENTS.md + global `~/.claude/CLAUDE.md` + global `~/.claude/USER.md` + global `~/.claude/rules/*`).

Tier A (always-loaded): global `CLAUDE.md`, global `USER.md`, global `rules/*`, project `CLAUDE.md` shim, harness auto-memory index. Tier B (on-demand): project `AGENTS.md`, `CONTEXT/{ARCHITECTURE,DECISIONS,LESSONS}.md`, cross-project `~/.context-system/CONTEXT/LESSONS.md`. Tier B' (session-start narrow): `CONTEXT/TODO.md` only. Tier C (paths-fired or hook-fired): rules with `paths:` frontmatter, skills like `/auto-memory`, SessionStart memory-relay.

The session anchor (two cross-domain words generated by `/handoff` Step 2) appears at the top of `CONTEXT/TODO.md` Active section and in the handoff `Pass-forward:` line. It is a fingerprint and anti-skim anchor; do not strip it.

## Shipping

After completing a coherent task with shippable changes, commit and push without re-asking, then signal `Shipped! ✅`. Coherent task means a logical unit ready for smoke test, not per-Edit. If mid-multi-step, wait. Surface and stop on broken or unverified work; ship only what passes the bar. Defer if the user said "draft only" or "don't push yet".

Commit message: short, imperative, scoped to the work just completed. Push authorization is implicit in this rule. Staging-branch projects override the destination, not the trigger.

Per-task ships complement HANDOFF Step 7, which still bundles handoff residue at session end.

## Announcements

When a multi-step kit flow finishes (BOOTSTRAP, `/handoff`, similar end-of-flow), deliver the summary as a **big announcement**: a double-line ASCII border above and below a title line that names the flow with a leading rocket emoji (e.g. `🚀  BOOTSTRAP COMPLETE`, `🚀  HANDOFF COMPLETE`), followed by the summary content.

When a flow reaches a planned stoppage where the user must make a decision, deliver the prompt as a **medium announcement**: a dashed leading line with `🟡 DECISION POINT` heading, 2-3 lines stating what needs deciding, an explicit choice cue (e.g. `Approve / redirect / abort`), and a closing dashed line.

Standing rule: use these shapes by default. The user signals explicitly when a departure is wanted.

## Module Adapters

Create `{module-name}/AGENTS.md` only when the subtree has distinct runtime, conventions, or an external integration. Per AGENTS.md spec, nested files take precedence (nearest wins). Keep module adapters under 8,000 chars. Module adapters own local purpose, key files, conventions, boundaries -- nothing project-wide.

When `{module-name}/AGENTS.md` exists, BOOTSTRAP Step 10b auto-deploys two sibling shims under the same nearest-wins discipline:
- `{module-name}/CLAUDE.md` -- so Claude Code's directory walk picks up module routing
- `{module-name}/.cursor/rules/{module-name}.mdc` -- so Cursor's nested `.cursor/rules/` discovery picks up module routing

Codex reads AGENTS.md natively and needs no shim. Module shims stay under 1,500 chars and only point back to the module's AGENTS.md.

## Boundaries

In scope: routing between any coding agent and `CONTEXT/*`.

Out of scope: storing live task state, handoff text, decision history, dated session notes. The per-tool shim files (project-root `CLAUDE.md`, `.cursor/rules/context-system.mdc`, plus any `{module}/CLAUDE.md` and `{module}/.cursor/rules/*.mdc` deployed by Step 10b) carry only harness-specific glue and a pointer back to their canonical AGENTS.md (root or module). If you find yourself adding routing rules to a shim, the rule belongs in the AGENTS.md instead.

## Loop Access Rules

If this project contains `LOOP/<mode>/` directories, they are machine-owned territory for auto-loop ratchet experiments. Routine human work does not read or write `LOOP/*` except:
- `LOOP/<mode>/observations.md` during graduation review (tick `- [x]` to approve, delete entry to reject)

The meta-agent (the coding agent running the loop) owns `LOOP/<mode>/*` during loop runs. Graduation from `observations.md` Candidates to `CONTEXT/LESSONS.md` or `CONTEXT/DECISIONS.md` happens via the handoff flow, human-ratified only.

Leave `program.md` alone during active sessions (it is the meta-agent's directive; edit only when redirecting the loop). Leave `results.tsv`, `jobs/*`, and task files alone during experiments.
```

### `CLAUDE.md` shim template

```markdown
# {project-name} -- Claude Code shim

Canonical routing lives in `./AGENTS.md`. Read that first.

This file exists because Claude Code auto-loads `CLAUDE.md` at session start and does not yet auto-discover `AGENTS.md`. Keeping this stub ensures the canonical routing in `AGENTS.md` is reached even before Claude Code adds native support.
```

### `.cursor/rules/context-system.mdc` shim template

```markdown
---
description: Canonical project memory routing for Cursor. Always applied.
alwaysApply: true
---

# {project-name} -- Cursor shim

Canonical routing lives in `../../AGENTS.md`. Read that first.

This file exists because Cursor's `.cursor/rules/*.mdc` mechanism with `alwaysApply: true` guarantees this rule loads at every session start regardless of how Cursor's AGENTS.md auto-load behaves; the shim hands routing back to the canonical adapter.

Cursor module adapters: nested `{module-name}/AGENTS.md` per the AGENTS.md spec (nearest wins) is the canonical module adapter. BOOTSTRAP Step 10b auto-deploys a sibling `{module-name}/.cursor/rules/{module-name}.mdc` shim so Cursor's nested `.cursor/rules/` discovery picks up the module routing. See the `{module-name}/.cursor/rules/{module-name}.mdc` module shim template below.
```

### `{module-name}/CLAUDE.md` module shim template

Created by BOOTSTRAP Step 10b auto-shim deploy when `{module-name}/AGENTS.md` exists. Same shim pattern as the project-root CLAUDE.md, scoped to the module. Imports the local AGENTS.md so Claude Code's directory walk picks up module-specific routing.

```markdown
# {module-name} -- Claude Code shim (module)

Canonical module routing lives in `./AGENTS.md`. Read that first.

This file exists because Claude Code does not auto-discover `AGENTS.md`. Claude Code's directory walk loads `CLAUDE.md` files going up the tree, so a sibling `CLAUDE.md` ensures the module-level `AGENTS.md` is reached when working under this subtree.

@./AGENTS.md
```

### `{module-name}/.cursor/rules/{module-name}.mdc` module shim template

Created by BOOTSTRAP Step 10b auto-shim deploy when `{module-name}/AGENTS.md` exists. Cursor reads `.mdc` files from `.cursor/rules/` folders; nested folders apply to the subtree. This shim ensures Cursor sees the module's AGENTS.md when editing files under the module.

```markdown
---
description: {module-name} module routing -- delegates to module-local AGENTS.md
alwaysApply: true
---

# {module-name} -- Cursor shim (module)

Canonical module routing lives in `../../AGENTS.md` (resolved from this rule file at `{module-name}/.cursor/rules/{module-name}.mdc` up to `{module-name}/AGENTS.md`). Read that first.

This file exists because Cursor's nested `.cursor/rules/` folder applies its `.mdc` rules within the containing subtree. The shim hands routing back to the module's canonical adapter.
```
