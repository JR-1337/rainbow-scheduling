# Audit Report — full sweep — 2026-05-01 (s049)

## Verdict

**Needs Attention** — B2 contains two perf-at-OTR-scale findings (D1 sick-event triple-find at 490 cells/render desktop + 245/245 on mobile admin/employee views) and a keyboard-gap on backdrop dismiss across 5+ modal surfaces.

## Health trend (vs. prior audit)

FIRST_RUN for slug `full` (prior reports were `deferred` / `session-*` / `s042`). No diff baseline. Subsequent runs will compare against this report.

## Fixed autonomously (this audit)

Commit `0ff2c7d` — 4 mechanical edits:

- `src/App.jsx:224` — deleted stale "moved to hooks/" comment
- `src/App.jsx:1612` — added `aria-label="Previous pay period"` to prev nav button
- `src/App.jsx:1621` — added `aria-label="Next pay period"` to next nav button
- `src/MobileAdminView.jsx:511` — added `aria-label="Announcement subject"` to subject input

5th B1 entry (clarifying `// fires on login and logout` comment on useEffect dep) skipped — global no-redundant-comments rule. Demoted to non-finding.

## Deferred — ranked

Full triage with self-contained Fix Prompts at `.claude/skills/audit/output/triage.md`. Top items:

### Correctness bugs (I)

1. **I-A — `src/components/ScheduleCell.jsx:113-115`** — sick event walked 3× via separate `.find()` calls; line 115 uses `.note` bare while 114 uses `?.note`. Currently guarded by `hasSick &&`, but inconsistency is a latent throw on next refactor. **Fix collapses D1 in same edit.**
2. **I-B — `src/App.jsx:290-294`** — `didBootstrapRef.current = true` set before `await loadDataFromBackend()` resolves. State setters can fire on unmounted tree under fast login/logout cycling.

### Perf — needs measurement (D / E / F)

3. D1 — sick-event triple-find ScheduleCell 35 × 14 = 490 cells/render (resolved by I-A fix)
4. D2 — same pattern MobileAdminView 35 × 7 = 245 cells/render
5. D3 — same pattern MobileEmployeeView 35 × 7 = 245 cells/render
6. E1 — EmailModal `emailableEmps` filter chain in render body, no `useMemo` (rebuilds each open)
7. E2 — EmailModal `adminContacts` same pattern

### A11y gaps (L)

8. L4 — `ColumnHeaderEditor` backdrop `<div onClick={close}>` lacks Escape key handler (single file)
9. L5 — backdrop dismiss without Escape across 4+ mobile/modal files (parity scope; separate commit from L4)

### Structural observations (J)

9 J entries (top: J3 `MySwapsPanel` 95.88% clone of `ReceivedSwapsHistoryPanel` per jscpd — new since prior audits). Full list in `triage.md`.

### Security flags (K)

0 findings. Clean (per K exclusions: Apps Script `/exec` URL is not-a-secret per JR direction 2026-04-29).

## Non-findings confirmed

8 entries inspected and cleared. See `triage.md` § Non-findings. Notable: pre-launch dormant code paths (multi-admin1 email branches, onboarding triggers, migration cutover stubs) intentionally retained per memory rule `feedback_prelaunch_dormant_code.md`.

## Tally

Bucket 1: 5 (4 shipped, 1 demoted) | Bucket 2: 15 (2 I, 5 D/E, 2 L, 9 J, 0 K) | Non-findings: 8

## Audit scope skipped

- `backend/Code.gs` — out of scope per skill constraint (manual Apps Script paste-deploy required; backend findings would route to B2 with manual-redeploy prefix). No backend findings surfaced this pass.

## Cost

- Stage 0.5 map: build (cache miss after augmented `marker_index` ship); ~0.5s
- Stage 1 static: knip + jscpd available; no findings re-found by LLM
- Stage 2 inventory: 70,163 tokens, 52 tool uses, 14.4 KB inventory.md, ~25 findings
- Stage 3 triage: ~34k tokens, 19 reads (6 triage + 13 inventory carryover), 17.8 KB triage.md
- Stage 7 ship: 4 edits, 1 commit, build PASS, push to `main`
- Total LLM tokens: ~104k
- Wall-clock: inventory ~12 min; triage ~7 min; ship ~2 min
