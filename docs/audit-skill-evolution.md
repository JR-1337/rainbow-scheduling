# /audit skill — evolution log

Same scope across all four runs: `src/utils/` + `src/hooks/` + `src/components/` (43 files).

| Run | Pipeline | Stage 2 model | Tokens (Stage 2) | B1 actionable | B1 false-positive rate | B2 ranked? | Caught the canonical bugs? |
|---|---|---|---|---|---|---|---|
| **v1** | mono prompt + Poirot persona | 1× Opus 4.7 | ~50k | 2 | 75% | flat list | partial |
| **v2** | Opus inventory → Sonnet triage | 1× Opus + 1× Sonnet | ~95k | 3 | 0% | sub-grouped | partial |
| **v3** | 5 parallel specialists | 5× Opus 4.7 | ~347k | 3 | 0% | sub-grouped + ranked | most |
| **v4-cheap** | map → static → 1 Sonnet → triage | 1× Sonnet 4.6 | ~66k | TBD (Stage 4 not run) | n/a | n/a (Stage 2 only) | most + 3 new |

## Bug-for-bug coverage

Canonical bugs surfaced by at least one run, scored across the four:

| Bug | v1 | v2 | v3 | v4-cheap |
|---|---|---|---|---|
| `EmployeeRow.jsx:63` — admin grid skipped s038 D fix | ✗ | ✓ | ✓ | ✓ (with arithmetic) |
| `requests.js:21` — `datesRequested.split` no `?.` | ✓ | ✓ | ✓ | ✗ |
| `api.js:37` — silent 414 fall-through | ✗ | ✓ | ✓ | ✗ |
| `api.js:105` — `\|\|` swallows savedCount=0 | ✗ | ✗ | ✓ | ✗ |
| `scheduleOps.js:109` — unreachable `s.id == null` | ✗ | ✗ | ✓ | ✗ |
| Stale comments storeHours.js + date.js | ✓ | ✓ | ✓ | ✓ (3 found vs 2) |
| 5 knip dead exports | partial | partial | ✓ (with grep) | ✓ (with grep) |
| jscpd duplicates verified | n/a | n/a | said false-positive | said real |
| `EventOnlyCell.jsx:30` array-index key | ✗ | ✗ | ✗ | ✓ |
| `scheduleCellStyles.js:34` null-guard on firstEventType | ✗ | ✗ | ✗ | ✓ |
| `CollapsibleSection.jsx:19` no `aria-expanded` | ✗ | ✗ | ✗ | ✓ |
| `AdaptiveModal.jsx` no focus trap | ✗ | ✓ | ✓ | partial |
| Modal Escape handlers missing | ✗ | ✗ | ✓ | partial |
| Icon-only buttons no `aria-label` (Edit3, X) | ✓ | ✓ | ✓ | partial |
| Form-input label association gaps | ✗ | ✗ | ✓ | ✗ |

## Cost-per-finding

Approximate findings counted (Bucket 1 + Bucket 2, deduplicated):

| Run | Findings | Tokens | Tokens/finding |
|---|---|---|---|
| v1 | ~24 (incl. 6 disclaimed) | 50k | ~2.1k |
| v2 | ~21 | 95k | ~4.5k |
| v3 | ~25 | 347k | ~13.9k |
| v4-cheap | ~22 | 66k | ~3.0k |

## Notable behaviour changes

### v4-cheap caught what others missed
- `EventOnlyCell.jsx:30` array-index key collision under reorder.
- `scheduleCellStyles.js:34` `firstEventType.bg` with no null guard if event type unrecognized.
- `CollapsibleSection.jsx:19` button missing `aria-expanded`.
- Verified jscpd's `ColumnHeaderEditor.jsx:46↔57` duplicate as REAL (v3 had dismissed as false positive).
- Hit 35×14 = 490 cells/render multiplier (v3 said 35×7=245 — both valid depending on which surface; v4 noted EmployeeView's 2-week render).

### v4-cheap missed what v3 caught
- `requests.js:21` `datesRequested?.split(...)` — silent crash if `datesRequested` ever omitted. v3 caught, v4 missed.
- `api.js:105` `||` vs `??` on savedCount=0. v3 caught, v4 missed.
- `scheduleOps.js:109` unreachable conditional. v3 caught, v4 missed.
- `LoginScreen` form-label `htmlFor` association gaps. v3 caught, v4 missed.

Net miss-rate: 3 correctness bugs out of ~10 known correctness findings. Sonnet's lower judgment depth shows up here exactly where the design predicted.

### Why v4-cheap also caught new things
- The codebase map gave the Sonnet generalist scaffolding it didn't have to derive (which files import which, where memoized children live). With less time burned on file enumeration, more time on judgment.
- jscpd's 32-line claim was passed in as ground truth so the LLM verified by reading both ends instead of skipping.
- Marker-routing meant the Sonnet read 39 files instead of 43 — saved tokens, no judgment lost.

### Token budget breach

v4-cheap landed at 66k vs 60k hard cap. Slight breach (10%). Two ways to address:
1. Raise cap to 75k. Realistic given full pipeline plus triage will land around ~95k.
2. Tighten Stage 2 prompt to skip categories with empty marker lists more aggressively.

## Verdict — shipped 2026-04-29

**v4-cheap is the only mode.** Full and hybrid modes were considered and rejected — JR direction: keep it simple, one audit skill. Trade-off accepted: ~3 correctness bugs missed per audit pass vs ~5× cost reduction. Diff-vs-prior surfaces persistent bugs across runs, so most missed I findings are caught on a subsequent sweep.

Locked decisions:
- Stage 2 cap raised 60k → 75k after the v4 breach at 66k.
- Apps Script `/exec` URL in `src/utils/api.js:6` confirmed not-a-secret per JR (auth lives in payload token; URL ships in every customer bundle). Baked into the K-exclusion list.
- No `--full`, no `--hybrid`. Single Sonnet generalist + Sonnet triage, end of story.

The v1/v2/v3 columns above are kept as a record of why the skill is shaped this way. Future-you reading this: don't add the specialists back without measurement evidence that the missed bugs cost more than the 5× token spend.

---

## v5 — caps raised + augmented marker_index + read discipline (s048 2026-05-01)

### Trigger

`/audit` full sweep at 86 files (codebase had grown ~75 -> 86 since v4) breached at 127k vs the v4 cap of 75k. Output got truncated; agent had no place to write inventory; partial findings only. Same root cause as v4 breach (file enumeration via Read), worse magnitude.

Evidence: agent stats from the failed run -- 27 file Reads at ~2-3k tokens each = ~60-80k just on Reads, before output composition. Operating rule "Read only files material to your finding" was being ignored: the agent treated marker-routed file lists as a Read list rather than a routing hint.

### Three coordinated changes

1. **Caps raised.** Inventory 50k/75k -> 100k/150k. Triage 30k/50k -> 40k/60k. The codebase grew; the cap had to.

2. **Augmented `marker_index`** (`build-map.sh`). Each marker hit now carries `{ path, line, context }` where context is ~3 lines around the hit, capped 200 chars. Cap of 5 hits per marker per file. Map size 161 KB -> 523 KB. The agent composes `old: <quote>` evidence directly from the map for ~70% of cases without a Read.

3. **Read Discipline rules** (binding, in Stage 2 Operating rules):
   - No full-file Reads -- offset+limit anchored to a marker line, limit 5-15 typical, never >30
   - 30 Reads max per inventory pass; 1 Read per file maximum
   - Demote to J observation when evidence requires Read budget unavailable
   - Self-throttle: report `[budget: Nk used, M reads]` after each major category; finalize at 80% of soft cap
   - Parent extracts marker_index slices via `jq` before invoking the agent (agent never reads the full ~500 KB map)

### Expected impact

Each Read drops from ~2-3k tokens to ~200-500 tokens (offset+limit on marker line vs full file). At 30-Read cap, total Read cost ~6-15k vs today's ~60-80k. Should land typical inventory at 50-80k (well under the 100k soft cap), with headroom for follow-up Reads when cross-file flow matters.

Recall trade -- expected slight improvement, NOT regression. Argument: focused looking + map-data-first evidence gives the agent stronger signal per investigation step, where today's run wandered through unrelated files. The "demote to J when uncertain" rule provides honest fallback rather than fishing across files.

### Verdict — pending re-test

Next `/audit` run measures whether v5 stays under cap. If breach repeats:
- Reduce hits-per-file cap from 5 to 3
- Reduce context per hit from 200 chars to 120 chars (single line)
- Or: split inventory into 2 passes by category cluster (security+correctness vs perf+a11y+structural)

### Why no specialists

The v4 verdict (single Sonnet generalist, no `--full` / `--hybrid`) stands. v5 keeps the same architecture; only the cost model changed.
