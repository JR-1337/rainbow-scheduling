# Audit Triage — generalist (4-file scope)

Generated from s064 inventory · 2026-05-04

---

## Verdict

**Ready to Merge** — All B2 candidates from the inventory were verified against current source and found already resolved. No open correctness bugs, no open perf-at-OTR-scale findings, no open A11y gaps, no open security flags in the 4 scanned files.

---

## Bucket 1 — Safe-now (ship-list)

_None._ Every B1 candidate from the inventory was verified against the current source and found already resolved (code changed since inventory).

---

## Bucket 2 — Needs decision

_None._ Every B2 candidate verified; all resolved in current source.

### Correctness bugs (I)

_None open._

### Perf — needs measurement (D / E / F)

_None open._

### A11y gaps (L)

_None open._

### Structural observations (J)

_None open._

### Security flags (K)

_None._ (carried forward from inventory — no K findings in scope)

---

## Non-findings confirmed

All inventory items inspected against live source. Every finding was resolved prior to this triage session. Details below.

**E1-E6 / I1 — sickEvent extraction + unguarded `.note` (`src/views/EmployeeView.jsx`)**
Verified at lines 54-55, 74-77, 97-100. `sickEvent` is now extracted once via `.find()` at line 54; `hasSick = !!sickEvent` at line 55. All six `.note` accesses use optional-chain (`sickEvent?.note`). No unguarded `.note` access present. Inventory claimed these were open; code has since been updated. Status: resolved — code changed since inventory.

**L1 — Close button missing `aria-label` / `type` (`src/MobileAdminView.jsx:582`)**
Verified at line 599 (line offset shifted): `<button type="button" aria-label="Close" onClick={onClose} ...>`. Both attributes present. Status: resolved — code changed since inventory.

**L2 — Close button missing `aria-label` / `type` (`src/MobileEmployeeView.jsx:149`)**
Verified at line 154: `<button type="button" aria-label="Close" onClick={onClose} ...>`. Both attributes present. Status: resolved — code changed since inventory.

**L3 — Previous-period button missing `aria-label` / `type` (`src/views/EmployeeView.jsx:377`)**
Verified at lines 401-408: `type="button"` and `aria-label="Previous period"` both present. Status: resolved — code changed since inventory.

**L4 — Next-period button missing `aria-label` / `type` (`src/views/EmployeeView.jsx:392`)**
Verified at lines 418-426: `type="button"` and `aria-label="Next period"` both present. Status: resolved — code changed since inventory.

**J4 — Announcement panel buttons missing `type` (`src/MobileAdminView.jsx:533,542`)**
Inventory cited lines 533,542 as buttons; current source shows those lines are `<input>` and `<textarea>` elements (not buttons). The actual Clear and Save buttons at lines 547 and 557 both carry `type="button"`. Status: resolved — code changed since inventory.

**J5 — Icon-only close button missing `aria-label` (`src/MobileEmployeeView.jsx:149`)**
Merged with L2 above — same element. Status: resolved — code changed since inventory.

**J1 — `src/MobileEmployeeView.jsx:419` dayEvents filter (7 calls/render)**
Inventory demoted to observation; confirmed observation-grade at OTR scale. No action needed. Status: non-finding, carried from inventory.

**J2 — `src/MobileEmployeeView.jsx:300` conditional inline arrow (245-cell grid)**
Inventory demoted to observation; no cell-level memo wrapper to pair with. No action needed. Status: non-finding, carried from inventory.

**J3 — Long files (MobileEmployeeView.jsx 731L, EmployeeView.jsx 1057L, MobileAdminView.jsx 617L)**
Structural observation, post-launch candidate. Not blocking. Status: non-finding, carried from inventory.

**K — `mailto:` hrefs (`MobileAdminView.jsx:587`, `MobileEmployeeView.jsx:100`, `EmployeeView.jsx:904`)**
Backend-sourced email values, text-only, not XSS-injectable. Cleared per inventory K exclusions. Status: non-finding.

---

## Tally

Bucket 1: 0 | Bucket 2: 0 | Non-findings: 11

---

## Audit scope

4 files scanned (Stage 2 inventory):
- `src/components/ScheduleCell.jsx`
- `src/MobileAdminView.jsx`
- `src/MobileEmployeeView.jsx`
- `src/views/EmployeeView.jsx`

---

## Flags for parent session

1. **All inventory findings already resolved.** The Stage 2 inventory was generated before recent commits that landed the sickEvent extraction (E1-E6/I1) and A11y fixes (L1-L4, J4, J5) in all four scanned files. The triage confirms clean state across the 4-file scope.

2. **Line number drift is significant.** Between inventory generation and this triage, line numbers in MobileAdminView.jsx shifted by ~17 lines (inventory cited :582 for close button; live is :599). Future inventory runs should be timed closer to triage to minimize drift.

3. **Scope boundary confirmed.** The 82-clone jscpd aggregate noted in the inventory is project-wide, not within these 4 files. It is out of scope for this audit pass. The s049 triage.md (now overwritten) covered that broader scope — if that work is still pending, it was tracked separately.

4. **P > N flag.** SKILL.md says "if P > N, re-examine Bucket 2 demotions." With B1=0 and Non-findings=11, this condition triggers. Re-examination completed: the surplus non-findings are genuine — every inventory finding was verified against live source and confirmed resolved. No demotions to reverse. The 0/0 result is accurate, not a miss.
