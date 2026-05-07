# DRIFT CHECK
<!-- Kit Version: 6.4 -->

Telos: scan a consumer project for the seven drift status keys defined in the kit's `specs/TEMPLATES.md` (`CONTEXT/drift-reports/drift-YYYY-MM-DD.md` schema), write one observation-only drift report, prune to rolling-5, commit + push. Runs in a fresh remote Claude Code session triggered by the per-consumer `/drift-scan` RemoteTrigger registered at `/bootstrap`.

This file is the bundle for per-consumer scheduled checks. Today it carries one section (drift-scan); future scheduled checks slot in as additional sections under the same canonical filename. Both this driver and the kit's `specs/TEMPLATES.md` are installed verbatim into `{PROJECT_ROOT}/.claude/kit/` by `/bootstrap` Step 5e (Fresh Init) / Step 12f (Upgrade), so the cron reads locally without needing kit-repo auth. See the `.claude/kit/` entry under Canonical File Contracts in `specs/BOOTSTRAP_REFERENCE.md`.

Schema definition lives in the local install at `.claude/kit/TEMPLATES.md` (byte-identical copy of the kit's `specs/TEMPLATES.md`) under `CONTEXT/drift-reports/drift-YYYY-MM-DD.md header`. Read it from the local install before writing the report. This driver is the executable procedure; the schema is the contract.

## Skill Invocation Discipline

This driver is invoked via the `/drift-scan` slash command (skill at `~/context-system/skills/drift-scan/`, symlinked into `~/.claude/skills/drift-scan/` so Claude Code finds it globally). The skill is a thin wrapper that points here; this file is the source of truth. Required behavior on every run:

1. **Read this driver in full before executing any step.** Why: the working memory of "what /drift-scan usually does" drifts from the file across runs; the file is canonical.
2. **Walk every numbered step in order.** After each step, post `Report: Step N done -- <one-line summary>`. The lines are the audit trail when a human reviews a remote-fired run.
3. **Read `.claude/kit/TEMPLATES.md` before writing the report.** Step 3 directs you there; the local install is the byte-identical copy of the kit's canonical schema, recollection is not.
4. **Observation-only.** Never edit `CONTEXT/*` files outside `CONTEXT/drift-reports/`. Never auto-fix detected drift. Why: remediation belongs to the next interactive `/bootstrap` where the user is present; auto-fix from a cron breaks the "kit publishes, consumer observes" boundary.
5. **Bail rather than guess.** If a check is ambiguous (e.g. local kit-machinery files missing, schema header byte-extraction fails), record `<key>: indeterminate -- <reason>` in the report rather than reporting `clean`. False-clean is worse than visible-uncertain.
6. **Final self-check** runs verbatim at end with each box ticked or marked `(N/A: <reason>)`.

## Cannot Proceed Unless

- The cron's working directory is the cloned consumer repo (the trigger's `git_repository.url` is the consumer, not the kit).
- The consumer repo has `CONTEXT/` (ELSE: this consumer was never bootstrapped; report `Bootstrap absent` and exit cleanly without writing a drift report).
- `git` and `bash` are available in the session's allowed tools.
- The local kit-machinery snapshot is present at `.claude/kit/TEMPLATES.md` and `.claude/kit/DRIFT_CHECK.md` (installed by `/bootstrap` Step 5e / Step 12f). ELSE: bail with `agents-md-body-drift: indeterminate -- kit machinery absent`, `schema-headers-drift: indeterminate -- kit machinery absent`, `pre-version-N-markers: indeterminate -- kit machinery absent`; remaining keys still scan; surface in Summary that consumer needs `/bootstrap` re-run.

## Default Scope

- `{PROJECT_ROOT}` is the cloned consumer repo (cwd at session start).
- `{KIT_LOCAL}` is `{PROJECT_ROOT}/.claude/kit/` -- the kit-machinery snapshot installed by `/bootstrap`. Holds `DRIFT_CHECK.md` (this driver, byte-identical) and `TEMPLATES.md` (byte-identical copy of the kit's `specs/TEMPLATES.md`).
- `{TODAY}` is the UTC date when the cron fires, in `YYYY-MM-DD` form.
- `{REPORT_PATH}` is `{PROJECT_ROOT}/CONTEXT/drift-reports/drift-{TODAY}.md`.
- The report writes to `main`; the trigger session pushes to `origin/main` per the consumer's GitHub config.

## Drift Scan Steps

### Step 1 -- Resolve local kit machinery + capture session metadata

The kit's canonical templates and Version stamp are read from the local install at `.claude/kit/`, not from a clone. The install is byte-identical to the kit at the consumer's last `/bootstrap` run; staleness vs current kit canon is its own observation (status condition `kit-machinery-stale-snapshot`, surfaced via the `pre-version-N-markers` scan).

```bash
KIT_LOCAL=.claude/kit
KIT_LOCAL_TEMPLATES="$KIT_LOCAL/TEMPLATES.md"
KIT_LOCAL_DRIVER="$KIT_LOCAL/DRIFT_CHECK.md"
if [ -f "$KIT_LOCAL_TEMPLATES" ] && [ -f "$KIT_LOCAL_DRIVER" ]; then
    # Local snapshot Version is the kit version this consumer was bootstrapped at.
    KIT_VERSION=$(grep -m1 '<!-- Kit Version:' "$KIT_LOCAL_DRIVER" | grep -oE '[0-9]+(\.[0-9]+)?')
    [ -z "$KIT_VERSION" ] && KIT_VERSION=unknown
    KIT_COMMIT="local-snapshot"
else
    KIT_LOCAL_TEMPLATES=""
    KIT_LOCAL_DRIVER=""
    KIT_COMMIT=unreachable
    KIT_VERSION=unknown
fi
PROJECT_COMMIT=$(git -C . rev-parse --short HEAD)
RUN_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TODAY=$(date -u +%Y-%m-%d)
mkdir -p CONTEXT/drift-reports
```

If the local install is missing, `KIT_LOCAL_TEMPLATES=""`, `KIT_COMMIT=unreachable`, `KIT_VERSION=unknown`. Steps 2.1, 2.2, and 2.5 use these signals to record `indeterminate` rather than `clean`. The Summary line surfaces a remediation pointer ("`/bootstrap` re-run needed -- kit machinery absent at .claude/kit/").

Report: Step 1 done -- kit machinery at $KIT_LOCAL (Version $KIT_VERSION), project at $PROJECT_COMMIT, run-ts $RUN_TS.

### Step 2 -- Run the seven status-key scans

Each sub-step records its result into a shell variable; Step 3 composes the report. Run each scan even if a prior one bailed (the report carries all seven keys regardless of whether others succeeded).

#### 2.1 -- agents-md-body-drift

Compare consumer's `AGENTS.md` against the kit's canonical AGENTS.md template (with `{project-name}` substituted to the consumer's project name).

```bash
if [ -z "$KIT_LOCAL_TEMPLATES" ] || [ ! -f "$KIT_LOCAL_TEMPLATES" ]; then
    AGENTS_DRIFT="indeterminate -- kit machinery absent at .claude/kit/"
elif [ ! -f AGENTS.md ]; then
    AGENTS_DRIFT="missing -- consumer has no AGENTS.md"
else
    # Derive PROJECT_NAME from AGENTS.md H1 itself; the canonical shape is
    # `# {project-name} -- Agent Adapter (canonical)`. Why not
    # `basename "$PWD"`: directory basename can diverge from the
    # project's stylized name (e.g. TIMER vs CYBER_TIMER), producing
    # false-clean reports when the H1 has actually drifted. s041 audit
    # 2026-05-02 caught a TIMER H1 regression that this check would have
    # masked under the prior basename-derived substitution.
    PROJECT_NAME=$(awk 'NR==1 && /^# .* -- Agent Adapter/{
        sub(/^# /, ""); sub(/ -- Agent Adapter.*/, ""); print; exit
    }' AGENTS.md)
    if [ -z "$PROJECT_NAME" ]; then
        AGENTS_DRIFT="drift detected -- AGENTS.md H1 missing or malformed (expected '# {name} -- Agent Adapter (canonical)' on line 1)"
    else
        # Extract the AGENTS.md template body from local TEMPLATES.md (between
        # the ```markdown fence and its closing fence).
        awk '/^### `AGENTS\.md` template/{f=1; next} f && /^```markdown/{g=1; next} f && g && /^```$/{exit} f && g' \
            "$KIT_LOCAL_TEMPLATES" \
            | sed "s/{project-name}/$PROJECT_NAME/g" > /tmp/canonical-agents.md
        # Strip the optional `<!-- Kit Version: N -->` line from both sides
        # before comparing. The kit's own AGENTS.md (when this consumer IS
        # the kit) carries that stamp per drivers-march policy; downstream
        # consumers do not. Stripping both sides makes the diff identical
        # for either case without false-flagging the stamp itself as drift.
        sed '/^<!-- Kit Version:/d' AGENTS.md > /tmp/consumer-agents.md
        sed -i '/^<!-- Kit Version:/d' /tmp/canonical-agents.md
        if diff -q /tmp/consumer-agents.md /tmp/canonical-agents.md > /dev/null 2>&1; then
            AGENTS_DRIFT="clean"
        else
            DIFF_HUNKS=$(diff -u /tmp/consumer-agents.md /tmp/canonical-agents.md | grep -c '^@@')
            AGENTS_DRIFT="drift detected -- $DIFF_HUNKS hunks vs kit template (local snapshot Version $KIT_VERSION)"
        fi
        rm -f /tmp/consumer-agents.md /tmp/canonical-agents.md
    fi
fi
```

#### 2.2 -- schema-headers-drift

For each `CONTEXT/*.md` file with a `<!-- SCHEMA: ... -->` block, byte-compare its schema block against the corresponding block in the kit's `specs/TEMPLATES.md`.

```bash
SCHEMA_DRIFT_LIST=""
SCHEMA_DRIFT_COUNT=0
if [ -z "$KIT_LOCAL_TEMPLATES" ] || [ ! -f "$KIT_LOCAL_TEMPLATES" ]; then
    SCHEMA_DRIFT="indeterminate -- kit machinery absent at .claude/kit/"
else
    # extract_schema: $1 = file, $2 = exact schema-name marker token
    # (the literal text that follows "<!-- SCHEMA: " in the file). Uses
    # `index($0, "...")` for an exact substring match (no regex escaping
    # surprises) and ANCHORS the match to position 1 to avoid mid-line
    # collisions (e.g. an earlier line referencing the marker by quote).
    extract_schema() {
        awk -v marker="<!-- SCHEMA: $2" '
            !f && index($0, marker) == 1 { f=1 }
            f { print }
            f && /^-->$/ { exit }
        ' "$1"
    }
    # Pairs: consumer-file-path , canonical-schema-marker (must match the
    # exact name token in specs/TEMPLATES.md). Mismatches here produce
    # silent false-clean: both sides extract empty bytes and compare equal.
    PAIRS=$(cat <<'PAIR_EOF'
CONTEXT/TODO.md|TODO.md
CONTEXT/DECISIONS.md|DECISIONS.md
CONTEXT/ARCHITECTURE.md|ARCHITECTURE.md
CONTEXT/LESSONS.md|LESSONS.md
CONTEXT/archive/README.md|archive/
CONTEXT/archive/decisions-archive.md|decisions-archive.md
CONTEXT/archive/lessons-archive.md|lessons-archive.md
DATA/catalog.md|DATA/catalog.md
DATA/routing-index.md|DATA/routing-index.md
PAIR_EOF
)
    while IFS='|' read -r file marker; do
        [ -f "$file" ] || continue
        consumer=$(extract_schema "$file" "$marker")
        canonical=$(extract_schema "$KIT_LOCAL_TEMPLATES" "$marker")
        # Defensive: if either side is empty, treat as indeterminate
        # rather than clean (false-clean is the worst outcome here).
        if [ -z "$consumer" ] || [ -z "$canonical" ]; then
            SCHEMA_DRIFT_COUNT=$((SCHEMA_DRIFT_COUNT + 1))
            SCHEMA_DRIFT_LIST="${SCHEMA_DRIFT_LIST}- ${file} (extract returned empty; marker '${marker}' may have moved)\n"
        elif [ "$consumer" != "$canonical" ]; then
            SCHEMA_DRIFT_COUNT=$((SCHEMA_DRIFT_COUNT + 1))
            SCHEMA_DRIFT_LIST="${SCHEMA_DRIFT_LIST}- ${file} (Version may match; bytes differ)\n"
        fi
    done <<< "$PAIRS"
    if [ "$SCHEMA_DRIFT_COUNT" -eq 0 ]; then
        SCHEMA_DRIFT="clean"
    else
        SCHEMA_DRIFT="${SCHEMA_DRIFT_COUNT} headers drifted (local snapshot Version $KIT_VERSION):\n${SCHEMA_DRIFT_LIST%\\n}"
    fi
fi
```

#### 2.3 -- char-ceilings

Per-file caps from `drivers/PROJECT_MEMORY_BOOTSTRAP.md` Verification + the canonical schemas, plus per-section caps for the latest handoff's Anti-Patterns and Hot Files sections (per `drivers/HANDOFF.md` Step 5 section intent). Default warn-at: >=80 percent of cap. Exception (NEW v6.2): `CONTEXT/LESSONS.md` warns at 17,000 (68 percent of cap, ~2,000c above the post-archive 15,000c target). Why: the LESSONS post-archive target (60% of ceiling per the schema) is 15,000c; warning at 80% leaves no preventive headroom (a single normal session crosses the cap before the warn ever fires). The lower threshold gives the `kit-bounded-sections` cadence trigger room to fire before ceiling-cross.

| File | Cap | Warn at |
|---|---|---|
| `CONTEXT/DECISIONS.md` | 25,000 | 20,000 |
| `CONTEXT/LESSONS.md` | 25,000 | 17,000 |
| `AGENTS.md` | 12,000 | 9,600 |
| `CLAUDE.md` | 1,500 | 1,200 |
| `.cursor/rules/context-system.mdc` | 1,500 | 1,200 |
| `{module}/AGENTS.md` (each) | 8,000 | 6,400 |
| `{module}/CLAUDE.md` (each) | 1,500 | 1,200 |
| `{module}/.cursor/rules/{module}.mdc` (each) | 1,500 | 1,200 |
| latest `CONTEXT/handoffs/sNNN-*.md` Anti-Patterns section | 1,500 | 1,200 |
| latest `CONTEXT/handoffs/sNNN-*.md` Hot Files section | 1,500 | 1,200 |

```bash
CEIL_HITS=""
CEIL_COUNT=0
check_cap() {
    local file="$1"; local warn="$2"; local cap="$3"
    [ -f "$file" ] || return 0
    local size; size=$(wc -c < "$file")
    if [ "$size" -ge "$warn" ]; then
        CEIL_COUNT=$((CEIL_COUNT + 1))
        local pct=$(( size * 100 / cap ))
        CEIL_HITS="${CEIL_HITS}- ${file}: ${size}c / ${cap}c cap (${pct}%)\n"
    fi
}
check_cap CONTEXT/DECISIONS.md 20000 25000
check_cap CONTEXT/LESSONS.md 17000 25000
check_cap AGENTS.md 9600 12000
check_cap CLAUDE.md 1200 1500
check_cap .cursor/rules/context-system.mdc 1200 1500
# Module adapters (nearest-wins; recursive find under PROJECT_ROOT)
while IFS= read -r mod_agents; do
    check_cap "$mod_agents" 6400 8000
    mod_dir=$(dirname "$mod_agents")
    mod_name=$(basename "$mod_dir")
    check_cap "${mod_dir}/CLAUDE.md" 1200 1500
    check_cap "${mod_dir}/.cursor/rules/${mod_name}.mdc" 1200 1500
done < <(find . -mindepth 2 -name AGENTS.md \
    -not -path './archive/*' -not -path './.cursor/*' \
    -not -path './node_modules/*' -not -path './.git/*' \
    -not -path './CONTEXT/*' -not -path './**/.upgrade-snapshot/*')
# Latest handoff section caps -- Anti-Patterns and Hot Files.
# Bounded sections per drivers/HANDOFF.md Step 5 section intent;
# observation-only here, enforcement happens at /handoff write time.
LATEST_HANDOFF=$(ls -1 CONTEXT/handoffs/*.md 2>/dev/null | sort -r | head -n 1)
if [ -n "$LATEST_HANDOFF" ] && [ -f "$LATEST_HANDOFF" ]; then
    AP_BODY=$(awk '/^## Anti-Patterns/{f=1; next} f && /^## /{exit} f' "$LATEST_HANDOFF")
    HF_BODY=$(awk '/^## Hot Files/{f=1; next} f && /^## /{exit} f' "$LATEST_HANDOFF")
    AP_SIZE=$(printf '%s' "$AP_BODY" | wc -c)
    HF_SIZE=$(printf '%s' "$HF_BODY" | wc -c)
    if [ "$AP_SIZE" -ge 1200 ]; then
        CEIL_COUNT=$((CEIL_COUNT + 1))
        pct=$(( AP_SIZE * 100 / 1500 ))
        CEIL_HITS="${CEIL_HITS}- ${LATEST_HANDOFF} (Anti-Patterns section): ${AP_SIZE}c / 1500c cap (${pct}%)\n"
    fi
    if [ "$HF_SIZE" -ge 1200 ]; then
        CEIL_COUNT=$((CEIL_COUNT + 1))
        pct=$(( HF_SIZE * 100 / 1500 ))
        CEIL_HITS="${CEIL_HITS}- ${LATEST_HANDOFF} (Hot Files section): ${HF_SIZE}c / 1500c cap (${pct}%)\n"
    fi
fi
if [ "$CEIL_COUNT" -eq 0 ]; then
    CEIL_RESULT="clean"
else
    CEIL_RESULT="${CEIL_COUNT} files at >=80% of cap:\n${CEIL_HITS%\\n}"
fi
```

#### 2.4 -- operator-legend

Grep `CONTEXT/*.md` for non-ASCII operators that the Telegraphic Memory Style rules forbid (em-dash, en-dash, smart quotes, Unicode math, box-drawing). Each hit is one line in the report.

```bash
# Pattern includes: em-dash, en-dash, smart quotes (4 forms), Unicode math
# operators (multiplication, division, less/greater-equal, arrows, set
# membership, logical, ellipsis), box-drawing.
PATTERN=$'[—–‘’“”×÷≤≥→⇒∈∉¬∧∨…─-╿]'
OP_HITS=$(grep -rnP "$PATTERN" CONTEXT/ 2>/dev/null \
    --include='*.md' \
    --exclude-dir=drift-reports \
    --exclude-dir=.upgrade-snapshot \
    --exclude-dir=archive | head -50)
OP_COUNT=$(printf '%s\n' "$OP_HITS" | grep -c . 2>/dev/null || echo 0)
if [ -z "$OP_HITS" ] || [ "$OP_COUNT" -eq 0 ]; then
    OP_RESULT="clean"
else
    OP_RESULT="${OP_COUNT} non-ASCII operator hits (first 50):\n${OP_HITS}"
fi
```

`drift-reports/` and `.upgrade-snapshot/` are excluded (drift-reports may carry drift quotes verbatim; snapshots are byte-frozen). `archive/` is excluded -- archive policy forbids editing in place, so flagging there would only churn.

Environment assumption: the cron's CCR sandbox is Linux with GNU `grep` supporting `-P` (PCRE). If a future executor lacks PCRE, this scan returns empty and reports `clean` -- a false-clean. The kit's existing `kit-drift-check` trigger has been firing in the same environment since 2026-04-28 with the same assumption; if that ever breaks, both routines need a non-PCRE rewrite.

#### 2.5 -- pre-version-N-markers

Walk consumer schema headers and any kit-version stamps. Flag any below the local-snapshot Version (`$KIT_VERSION` from Step 1, read from `.claude/kit/DRIFT_CHECK.md`'s stamp). Note: this check measures drift between consumer files and the consumer's own local kit snapshot, not between consumer and current kit canon. A consumer that has not re-run `/bootstrap` after a kit version bump will not detect the drift between its files and the new kit; that staleness is observed kit-side via `kit-aggregate-drift` and surfaced as a `kit-machinery-stale-snapshot` condition (out of scope for this driver as of v6.4 first ship).

```bash
VERSION_HITS=""
VERSION_COUNT=0
if [ "$KIT_VERSION" = "unknown" ]; then
    VERSION_RESULT="indeterminate -- kit version unknown"
else
    # Schema Version: lines in CONTEXT/* (excluding drift-reports + snapshots)
    while IFS=: read -r file line content; do
        ver=$(printf '%s' "$content" | grep -oE 'Version: [0-9]+(\.[0-9]+)?' | grep -oE '[0-9]+(\.[0-9]+)?')
        [ -z "$ver" ] && continue
        if awk -v a="$ver" -v b="$KIT_VERSION" 'BEGIN{exit !(a < b)}'; then
            VERSION_COUNT=$((VERSION_COUNT + 1))
            VERSION_HITS="${VERSION_HITS}- ${file}:${line} Version ${ver} < kit ${KIT_VERSION}\n"
        fi
    done < <(grep -rn '^Version: [0-9]' CONTEXT/ 2>/dev/null \
        --include='*.md' \
        --exclude-dir=drift-reports \
        --exclude-dir=.upgrade-snapshot)
    # Kit Version stamps in any consumer-side driver copies (rare; guards
    # against accidental kit-content duplication into the consumer).
    while IFS=: read -r file line content; do
        ver=$(printf '%s' "$content" | grep -oE 'Kit Version: [0-9]+(\.[0-9]+)?' | grep -oE '[0-9]+(\.[0-9]+)?')
        [ -z "$ver" ] && continue
        if awk -v a="$ver" -v b="$KIT_VERSION" 'BEGIN{exit !(a < b)}'; then
            VERSION_COUNT=$((VERSION_COUNT + 1))
            VERSION_HITS="${VERSION_HITS}- ${file}:${line} Kit Version ${ver} < kit ${KIT_VERSION}\n"
        fi
    done < <(grep -rn '<!-- Kit Version: [0-9]' . 2>/dev/null \
        --include='*.md' \
        --exclude-dir=.git \
        --exclude-dir=node_modules \
        --exclude-dir=drift-reports)
    if [ "$VERSION_COUNT" -eq 0 ]; then
        VERSION_RESULT="clean"
    else
        VERSION_RESULT="${VERSION_COUNT} stale version stamps (kit ${KIT_VERSION}):\n${VERSION_HITS%\\n}"
    fi
fi
```

#### 2.6 -- unknown-commit-provenance

Grep `<unknown commit>` across `CONTEXT/*` (LESSONS.md is the typical surface; carry-forward attribution from migrations parks the placeholder).

```bash
PROV_HITS=$(grep -rnF '<unknown commit>' CONTEXT/ 2>/dev/null \
    --include='*.md' \
    --exclude-dir=drift-reports \
    --exclude-dir=.upgrade-snapshot \
    --exclude-dir=archive | head -50)
PROV_COUNT=$(printf '%s\n' "$PROV_HITS" | grep -c . 2>/dev/null || echo 0)
if [ -z "$PROV_HITS" ] || [ "$PROV_COUNT" -eq 0 ]; then
    PROV_RESULT="clean"
else
    PROV_RESULT="${PROV_COUNT} unknown-commit provenance entries (first 50):\n${PROV_HITS}"
fi
```

#### 2.7 -- stale-snapshot-dir

Check whether `CONTEXT/.upgrade-snapshot/` lingers. If present without a `RETAIN` marker (which signals deliberate retention by `BOOTSTRAP` Step 10e/10f/10g for next-run fact-migration verification), and mtime > 7 days, flag as stale residue.

```bash
SNAP_DIR=CONTEXT/.upgrade-snapshot
if [ ! -d "$SNAP_DIR" ]; then
    SNAP_RESULT="clean"
else
    AGE_DAYS=$(( ( $(date +%s) - $(stat -c %Y "$SNAP_DIR") ) / 86400 ))
    if [ -f "$SNAP_DIR/RETAIN" ]; then
        if [ "$AGE_DAYS" -le 30 ]; then
            SNAP_RESULT="clean -- snapshot retained for next-run fact-migration verification (age ${AGE_DAYS}d, within 30d grace)"
        else
            SNAP_RESULT="RETAIN-marked snapshot age ${AGE_DAYS}d > 30d -- next /bootstrap should clear RETAIN and verify clean (manual cleanup: rm -rf ${SNAP_DIR})"
        fi
    elif [ "$AGE_DAYS" -le 7 ]; then
        SNAP_RESULT="clean -- snapshot present (age ${AGE_DAYS}d, within 7d grace)"
    else
        SNAP_RESULT="snapshot present without RETAIN marker, age ${AGE_DAYS}d (manual cleanup: rm -rf ${SNAP_DIR})"
    fi
fi
```

Report: Step 2 done -- 7 scans complete; `<N>` non-clean keys.

### Step 3 -- Compose drift report

The heredoc below IS the canonical drift-report body. The schema doc and template block in `.claude/kit/TEMPLATES.md` (`CONTEXT/drift-reports/drift-YYYY-MM-DD.md` section) document the same shape for human reference; if they ever diverge, this driver wins, and the next BOOTSTRAP version bump aligns the schema doc back. Why this is safe: the seven status keys + four header lines + Summary line are a fixed contract; any change to that contract is a kit version bump and re-aligns both sides. The unique heredoc delimiter (`DRIFT_REPORT_BODY_EOF_v52`) prevents collision with any scan result that happens to contain a bare `EOF` token.

`REPORT_PATH=CONTEXT/drift-reports/drift-${TODAY}.md`. Compute `NONCLEAN` as the count of non-clean status keys (any result that does not begin with the literal `clean`).

```bash
REPORT_PATH="CONTEXT/drift-reports/drift-${TODAY}.md"
NONCLEAN=0
for result in "$AGENTS_DRIFT" "$SCHEMA_DRIFT" "$CEIL_RESULT" "$OP_RESULT" "$VERSION_RESULT" "$PROV_RESULT" "$SNAP_RESULT"; do
    case "$result" in
        clean*) ;;
        *) NONCLEAN=$((NONCLEAN + 1)) ;;
    esac
done

cat > "$REPORT_PATH" <<DRIFT_REPORT_BODY_EOF_v52
# Drift report -- $TODAY

- Run: $RUN_TS
- Kit version observed: $KIT_VERSION
- Kit commit: $KIT_COMMIT
- Project commit: $PROJECT_COMMIT

## agents-md-body-drift
$(printf '%b' "$AGENTS_DRIFT")

## schema-headers-drift
$(printf '%b' "$SCHEMA_DRIFT")

## char-ceilings
$(printf '%b' "$CEIL_RESULT")

## operator-legend
$(printf '%b' "$OP_RESULT")

## pre-version-N-markers
$(printf '%b' "$VERSION_RESULT")

## unknown-commit-provenance
$(printf '%b' "$PROV_RESULT")

## stale-snapshot-dir
$(printf '%b' "$SNAP_RESULT")

## Summary
$NONCLEAN drift signals detected.
DRIFT_REPORT_BODY_EOF_v52
```

Report: Step 3 done -- wrote `$REPORT_PATH` (`$NONCLEAN` non-clean signals).

### Step 4 -- Apply rolling-5 retention

Sort `CONTEXT/drift-reports/drift-*.md` by filename (ISO date sorts lexically), keep the newest 5, delete the rest. The just-written file is in the newest 5 by definition.

```bash
cd CONTEXT/drift-reports
ls -1 drift-*.md 2>/dev/null | sort -r | tail -n +6 | while read -r old; do
    git rm -f "$old"
done
cd - > /dev/null
```

If fewer than 5 reports exist, this is a no-op.

Report: Step 4 done -- rolling-5 retention applied (`<N>` reports retained, `<M>` removed).

### Step 5 -- Commit + push

Stage the new report and any rolled-off deletions; commit with the canonical message; push to `origin/main`.

```bash
git add CONTEXT/drift-reports/
if git diff --cached --quiet; then
    echo "No changes to commit (idempotent re-run on same date)."
else
    git -c commit.gpgsign=false -c user.email='drift-scan@context-system' \
        -c user.name='drift-scan' \
        commit -m "drift-scan: $TODAY ($NONCLEAN signals)"
    git push origin main
fi
```

If push fails (auth, conflict, network), exit with the failure visible in the trigger log; the report remains committed locally on the cron's working tree, but the next run will retry. Do not retry destructively.

Report: Step 5 done -- committed + pushed (or no-op idempotent).

## Verification

Pass only if:
- `CONTEXT/drift-reports/drift-{TODAY}.md` exists.
- The report carries all four header lines (Run, Kit version, Kit commit, Project commit).
- The report carries all seven status-key sections in the canonical order.
- Each status-key section contains either `clean` (with optional one-line modifier) OR a non-clean body that includes file:line citations.
- No `CONTEXT/*` file outside `CONTEXT/drift-reports/` was modified by this run.
- `CONTEXT/drift-reports/` contains at most 5 `drift-*.md` files after retention.
- Commit message follows the form `drift-scan: YYYY-MM-DD (N signals)`.
- No write touched `.claude/kit/` (the local kit-machinery snapshot is read-only to this driver; refresh happens at `/bootstrap`).

## Model Self-Check

Before returning, confirm:
1. Did all seven sub-step scans run, even if one or more bailed with `indeterminate`?
2. Did Step 3 write the report by substituting into the canonical template body from `.claude/kit/TEMPLATES.md`, not from recollection?
3. Did Step 4 leave at most 5 reports in `CONTEXT/drift-reports/`?
4. Did Step 5 push only `CONTEXT/drift-reports/*` changes? If `git status --porcelain` shows any other modified file, that is a discipline failure -- this driver is observation-only.
5. Did the run leave `.claude/kit/` untouched? Any modification to local kit-machinery files indicates the driver wandered outside its observation-only scope.
