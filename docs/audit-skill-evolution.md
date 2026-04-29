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
