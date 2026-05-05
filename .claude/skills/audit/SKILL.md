---
name: audit
description: Cost-controlled codebase audit. Bash builds a cached codebase map (file inventory, import graph, marker index); static analysis surfaces mechanical findings; one Sonnet 4.6 generalist inventories all 12 categories; Sonnet 4.6 triages and ranks; report is diffed against the prior run; safe-now bucket ships as one commit. Each Bucket 2 item ships with a fix prompt.
when_to_use: User asks to "audit", "sweep", "scan", "find dead code / perf wins / vulnerabilities" across a directory or the whole src tree. NOT for reviewing a single PR (use /review) or pending diff only (use /simplify or /security-review).
---

# Audit Skill

A staged pipeline. Cheapest deterministic findings first, judgment narrowed by the map and marker index, ranking and verdict last. Single mode — no flags, no specialists.

## Invocations

| Command | Scope |
|---|---|
| `/audit` | The whole app — everything under `src/` (~80 files). Use for periodic full sweeps. |
| `/audit session` | Files touched since the most recent `sNN handoff:` commit on `main`, plus any uncommitted working-tree changes. Use to vet the work just done. Falls back to "last 24h of commits" if no handoff commit exists. |

No subdirectory scoping. The skill handles directory-level routing internally via the codebase map.

## Pipeline

```
Stage 0    Scope confirm
Stage 0.5  Codebase map (Bash, cached 7d)
Stage 1    Static analysis (knip + jscpd)
Stage 2    Inventory — one Sonnet 4.6 generalist
Stage 3    Sonnet triage (B1 / B2 / Non-findings + fix prompts + verdict)
Stage 4    Diff vs. prior report
Stage 5    Verify B1 entries (main session)
Stage 6    Write dated report
Stage 7    Ship B1
Stage 8    Smoke gate
Stage 9    Log to TODO.md
```

## Token budgets (binding)

| Stage | Budget | Hard cap |
|---|---|---|
| 0.5 map | 0 (Bash) | n/a |
| 1 static | 0 (Bash) | n/a |
| 2 inventory | 100k | 150k |
| 3 triage | 40k | 60k |

If a stage exceeds hard cap, abort that stage and report partial findings + a "budget breach" line in the report.

Caps were raised 2026-05-01 (s048) from 50k/75k inventory + 30k/50k triage after a 127k breach on full sweep at 86 files. The breach was caused by the agent treating marker-routed file lists as a Read list rather than a routing hint -- 27 file Reads at ~2-3k each. The Read Discipline rules below + the augmented `marker_index` (line + 3-line context per hit, embedded in the map) eliminate most Read-driven cost.

---

## Stage 0 — Scope resolve

```bash
bash .claude/skills/audit/scripts/scope-resolver.sh <mode> .claude/skills/audit/output/scope.txt
```

- `mode = full` → all `src/**/*.{js,jsx,ts,tsx}`.
- `mode = session` → files changed since most recent `sNN handoff:` commit + working-tree changes.

Slug for the report filename:
- `full` → `full`
- `session` → `session-<short-hash-of-handoff-or-date>` (e.g. `session-40cf842` or `session-2026-04-29`)

If session mode resolves to 0 files, abort with: "No files changed this session — nothing to audit." Do not run any LLM.

## Stage 0.5 — Codebase map (cached)

```bash
bash .claude/skills/audit/scripts/build-map.sh .claude/skills/audit/output
```

Reads the file list from `output/scope.txt` (produced by Stage 0). Cache key = `git-head | scope-content-hash | dirty-tree-hash`; cache hit on fingerprint match AND age <7d. For `session` mode the file list is small enough that the map adds little value, but build it anyway — uniform pipeline.

Output: `.claude/skills/audit/output/codebase-map.json`. Schema:

```
{
  "fingerprint": "...",
  "files": [{ path, lines, bytes, mtime, exports[], imports[], markers[] }],
  "import_graph":  { path -> [paths it imports] },
  "inverse_graph": { path -> [paths that import it] },
  "hot_files": [...],         // top decile by inverse-degree
  "marker_index": {           // augmented 2026-05-01 (s048)
    marker -> [{ path, line, context }]   // context = ~3 lines around the hit, capped at 200 chars
  }
}
```

The marker_index now carries line numbers + 3-line context per hit so the inventory agent can compose `old: <quote>` evidence directly from the map for most findings, eliminating the file-Read cost. Cap of 5 hits per marker per file prevents map bloat. If a marker fires more than 5 times in one file, surplus hits are dropped (the first 5 are sufficient for finding decisions; if a finding needs the 6th hit, demote to J observation).

Markers route files to categories in Stage 2:
- `security_*` — `dangerouslySetInnerHTML`, `eval`, `new Function`, `target="_blank"`, `mailto:`
- `a11y_*` — `<button`, `<input`, `<select`, `<div onClick`, `role=`, `aria-`
- `perf_*` — `React.memo`, `useMemo`, `useCallback`, `.filter(`, `.some(`, `.find(`, inline-arrow handler
- `correctness_*` — `useEffect`, `?.`
- `structural_long` — files >500 lines

## Stage 1 — Static analysis pre-pass

```bash
bash .claude/skills/audit/scripts/static-pass.sh <scope> .claude/skills/audit/output
```

Runs `knip` (dead exports / unused files / unused deps) and `jscpd` (duplicate code blocks) via `npx --yes`. Tolerates missing tools.

Output: `.claude/skills/audit/output/static-pass.json`. Ground truth for **A** (dead imports), **B** (dead destructures), **G** (no-ops), and **J** dead-export claims. LLM does not re-find these.

## Stage 2 — Inventory (single Sonnet generalist)

ONE `general-purpose` Agent with `model: "sonnet"`. Receives:
- **Per-category marker_index slices** (parent extracts via `jq` before invoking the agent — do NOT hand the agent the whole map JSON; at ~500 KB with augmented context it would consume ~130k tokens just to load).
- The static-pass JSON path (the agent reads it on demand).
- All 12 categories in one prompt.

Slicing pattern (parent runs before invoking agent):

```bash
jq '.marker_index["a11y_button"]' .claude/skills/audit/output/codebase-map.json
jq '.marker_index["perf_filter"]' .claude/skills/audit/output/codebase-map.json
jq '.hot_files' .claude/skills/audit/output/codebase-map.json
```

Embed those slices directly in the agent prompt. The agent never reads the full map.

### Operating rules (binding — include verbatim)

1. **Map-first evidence.** The `marker_index` carries `{ path, line, context }` per hit. Use that context as the primary `old: <quote>` evidence for findings. Reads are last-resort, not first-look.
2. State evidence as a direct quote — from `marker_index` context if available, else from a tightly-scoped Read. Never paraphrase.
3. Decide each finding's category immediately — no "maybe", no "kept; not a finding". If evidence is insufficient, demote to J (observation).
4. Static-pass findings are pre-cleared facts. Do not re-find them; consume as context.
5. If the marker-routed file list for a category is empty, skip that category entirely (do not pad).
6. **Read discipline (binding).** Every Read MUST include `offset` and `limit` parameters. Offset is anchored to a marker line from the map; limit is small (5-15 lines typical, never more than 30). Full-file Reads are forbidden.
7. **Read cap (hard).** Total of 30 file Reads across the whole inventory pass. One Read per file maximum. If you hit 30, work from `marker_index` context alone for the remainder.
8. **Demote when uncertain.** If composing the `old: <quote>` requires Read budget you do not have, demote the finding to J (structural observation). J entries do not require an exact quote; the summary suffices.
9. **Self-throttle.** After each major category (C, D, E, F, H, I, J, K, L), report one line: `[budget: Nk used, M reads]`. If you approach 80% of the soft cap (~80k of 100k), stop opening new categories and finalize the current ones.

### Required output schema

```
[CAT] path:line — old: <exact quote from file> → new: <one-line replacement, or "n/a — needs decision"> — direct read
```

Trailing `— direct read` is mandatory.

### Required output structure

```
## Inventory — generalist

[A — skipped, owned by static]
[B — skipped, owned by static]
[C findings if any]
... through L

## Files scanned
N total — list paths.

## Ambiguity / scope drift
Free-form notes for the parent.
```

### Category K exclusions (NOT a K finding)

- Public deployment URLs (Apps Script `/exec`, Vercel preview, public CDN hrefs). The RAINBOW Apps Script `/exec` URL in `src/utils/api.js:6` is confirmed not-a-secret per JR direction 2026-04-29 (auth lives in payload token; URL ships in every customer bundle).
- Third-party font/script CDNs unless SRI is policy.
- `title` attribute containing user data (text-only, not XSS).
- Public deployment IDs / public route names.

If unsure whether something is a K, demote to J.

### Category D/E/F arithmetic gate (binding)

Every D/E/F finding MUST state the per-render multiplier — e.g. `35 employees × 7 dates = 245 cells per render` for the admin grid, `35 × 14 = 490` for the 2-week employee view. No multiplier → demote to J. At OTR scale, a `.filter()` over a <50-element array called once per save flow is observation, not a perf finding.

## Stage 3 — Sonnet 4.6 triage

Spawn `general-purpose` Agent with `model: "sonnet"`. Inputs: Stage 2 inventory, SKILL.md, Read access for verification.

### Bucket 1 — Safe-now (ship-list)

Each entry is a verbatim line-edit:

```
[CAT] path:line — old: <quote> → new: <replacement> — direct read
```

- One-line mechanical edits only.
- Behavior unchanged. No visual confirm needed.
- No "kept", "verified", or commentary entries — those go to Non-findings.

### Bucket 2 — Needs decision (ranked, sub-grouped, with fix prompts)

Sub-headings in this order:
- `### Correctness bugs (I)`
- `### Perf — needs measurement (D / E / F)`
- `### A11y gaps (L)`
- `### Structural observations (J)`
- `### Security flags (K)`

Within each, rank highest-impact-first. Severity: data-loss > silent-corruption > performance-at-OTR-scale > A11y > observation.

**Each B2 entry ships with a Fix Prompt:**

```
[CAT] path:line — <one-line summary> — <severity rationale> — direct read

Fix prompt:
"<self-contained instruction for a fresh Sonnet agent>
- Files in scope: <paths>
- Current code: <exact quote>
- Constraint: <what must stay unchanged>
- Acceptance: <build PASS + what to confirm>
- Do NOT: <out-of-scope changes>"
```

### Non-findings confirmed

Items inspected and cleared. Below Bucket 2.

### Tally

```
Bucket 1: N | Bucket 2: M | Non-findings: P
```

If `P > N`, re-examine Bucket 2 demotions.

### Verdict line (top of report)

- **Ready to Merge** — Bucket 2 has only structural observations and easy A11y items.
- **Needs Attention** — Bucket 2 has at least one performance-at-OTR-scale finding OR focus-trap/keyboard gap on a primary surface.
- **Needs Work** — Bucket 2 has at least one data-loss or silent-corruption I, or any K that survived exclusions.

## Stage 4 — Diff vs. prior report

```bash
bash .claude/skills/audit/scripts/diff-prior.sh <slug> <findings-keys-file>
```

Output: REGRESSED (new since last run), FIXED (gone since last run), PERSISTING. Logs `FIRST_RUN` if no prior report for the slug.

## Stage 5 — Verify B1 entries

Read each Bucket 1 finding directly before editing. Drop confirmed false positives; promote ambiguous to Bucket 2.

## Stage 6 — Write dated report

Path: `docs/audit-YYYY-MM-DD-<slug>.md`. Sections in order:

```
## Verdict
<Ready to Merge / Needs Attention / Needs Work> — <one-line driver>

## Health trend (vs. prior audit)
- Regressed: N — <list>
- Fixed:     M — <list>
- Persisting: P — <list>

## Fixed autonomously (this audit)
<Bucket 1 entries shipped + commit hash>

## Deferred — ranked
### Correctness bugs (I)
### Perf — needs measurement (D / E / F)
### A11y gaps (L)
### Structural observations (J)
### Security flags (K)

## Non-findings confirmed
## Tally
## Audit scope skipped
## Cost
- Stage 0.5 map: <build|cache-hit, age>
- Stage 1 static: <tools available>
- Stage 2 + 3 tokens
- Total wall-clock
```

Report is written BEFORE the smoke gate.

## Stage 7 — Ship B1

- One commit. List paths in the message body.
- 3+ files: state scope before edits.
- Build gate: `npm run build` PASS before commit.
- Auto-push (per `feedback_handoff_auto_push`).

## Stage 8 — Smoke gate

Ask JR: Playwright smoke now, or defer? Default = smoke on prod once Vercel bundle hash matches new build.

## Stage 9 — Log to TODO.md

Completed entry: sNNN session label, commit hash, one-line summary, link to report.

---

## Constraints (binding)

- **`backend/Code.gs` is hands-off for autonomous fixes.** Backend findings go to Bucket 2 with a Fix Prompt that begins "This requires manual Apps Script redeploy — bundle with next email or auth redeploy."
- **No customer-facing copy changes.** Stays in Bucket 2.
- **Mobile + desktop parity.** UI fixes touching schedule render must patch all 4 paths in one commit.
- **No silent removal.** Static pass clears imports/exports mechanically; everything else needs a flag.
- **Don't touch `.cursor/rules/*.mdc`.**
- **Schema sovereignty.** Don't rename props/exports/component signatures during an audit pass.
- **5 OTR brand accent colors are immutable.**
- **Mandatory caller-grep for J dead-export claims.** Any J dead-export Bucket-2 entry must include `grep <symbol> src/` output in its Fix Prompt.

## Anti-patterns (don't retry)

- **Don't trust audit-doc filepath claims at face value.** Auditors conflate frontend/backend functions of the same name. Always grep the symbol before scoping a fix.
- **Don't ship perf wins without OTR-scale arithmetic.** State the multiplier. No multiplier → finding is observation.
- **Don't bundle audit cuts with feature work.** One commit per audit pass.
- **Don't pad with non-findings.** Bucket 1 is ship-list. Non-findings have their own section.
- **Don't run mono-prompts when the map can route.** Pre-filtering by marker beats asking an LLM to consider 12 categories on every file.

## Categories — full reference

| Code | Category | Owner |
|---|---|---|
| **A** | Dead imports | static (knip) |
| **B** | Dead destructures | static (knip) |
| **C** | Unreachable branches | LLM |
| **D** | Per-cell scans | LLM (with arithmetic gate) |
| **E** | Unmemoized derivations | LLM (with arithmetic gate) |
| **F** | Inline arrows to memoized children | LLM (with arithmetic gate) |
| **G** | No-op transforms | static (else LLM) |
| **H** | Stale comments | LLM |
| **I** | Correctness | LLM |
| **J** | Structural | LLM + static (jscpd, knip) |
| **K** | Security | LLM (skip if marker-routed list empty) |
| **L** | A11y | LLM |

## When NOT to use

- Pending diff only → `/simplify`.
- Single PR → `/review`.
- Security only on current branch → `/security-review`.
- Full backend audit → manual + JR-driven.

---

## Files in this skill

- `SKILL.md` — this file.
- `scripts/build-map.sh` — Stage 0.5 (codebase map, cached).
- `scripts/static-pass.sh` — Stage 1 (knip + jscpd).
- `scripts/diff-prior.sh` — Stage 4 (regressed / fixed / persisting).
- `output/` — gitignored working dir for map + JSON + inventory.
