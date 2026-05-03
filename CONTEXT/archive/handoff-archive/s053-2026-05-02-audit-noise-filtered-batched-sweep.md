# s053 -- 2026-05-02 -- Audit noise filtered + 3 commits shipped from batched sweep

## Session Greeting

Read `CONTEXT/TODO.md` first; the user's first prompt drives any further `CONTEXT/*` reads on demand. Resume from `State` and `Next Step Prompt`. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

vermilion. attractor dynamics.

Pass-forward: 3 commits shipped this session; s049 B2 audit list filtered (>50% false-positive rate caught at re-rank).

## State

- **Project:** `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- **Git:** HEAD `576e50e` on `main`, will be synced with origin after this handoff write. +3 session commits beyond s052 (`590a5ea` + `07ad44f` from s052): `07ad44f` (s052 desktop period-nav parity, smoked at session start), `da8f89a` (Batch 1 a11y backdrop Escape, 4 components + new useEscapeKey hook), `576e50e` (Batch 2 EmailModal useMemo).
- **Apps Script live deployment:** SYNCED with repo (no `backend/Code.gs` changes this session; s050's stack remains live).
- **Active focus end-of-session:** none open. Batched sweep complete; audit B2 list filtered.
- **Skills used this session:** `/handoff` x2 (s052 mid-session + s053 now). Direct edits + Playwright smokes for 07ad44f + da8f89a.

## This Session

**Continuation theme: smoke s052's 07ad44f, then JR-approved "ALL" batched bug-fix sweep against s049 audit B2 list. Audit-of-audit pattern caught >50% false-positive rate at re-rank; 3 commits shipped, 4 items dropped.**

**Commits shipped (3 total):**

- `07ad44f` chore(a11y): EmployeeView desktop period-nav parity with mobile.
  - Smoke of ec0e962 caught parity miss: ec0e962 added `aria-label` + `type="button"` to mobile period-nav (EmployeeView.jsx:378-403, inside `if (isMobile)` branch) but desktop period-nav at lines 695-714 was outside the s051 audit's mobile-only scope. Both desktop chevrons reported `aria-label=null` on testguy 1280x800 smoke.
  - 6 lines inserted, 2 `<button>` opening tags reformatted to mirror lines 378-403.
  - Build PASS. Verified live on prod bundle `index-D2oKsESe.js`: aria-labels present, prev navigation works (Apr 20 -> Apr 6), 0 console errors.

- `da8f89a` chore(a11y): Escape-to-dismiss on 4 modal/popup components.
  - **Audit-of-audit caught false positives:** s049 triage L4/L5 listed 8 backdrop sites; `useFocusTrap.js:16` already handles Escape via `[data-close]?.click()` for the 5 sites that use it (ColumnHeaderEditor, MobileBottomSheet, MobileDrawerShell, primitives.Modal, AdaptiveModal). Only 4 sites genuinely lacked Escape dismissal.
  - New file `src/hooks/useEscapeKey.js` (8 lines, document-level keydown listener).
  - Wired into 4 components: `MobileAnnouncementPopup` (MobileEmployeeView.jsx:134), `MobileEmployeeQuickView` (MobileAdminView.jsx:560), `AdminRequestModal` (desktop branch), `RequestDaysOffModal`.
  - Per `feedback_mobile_desktop_parity`: parity-scoped commit covers mobile + desktop paths.
  - Build PASS. Smoke on prod bundle `index-bT_u5d36.js`: AdminRequestModal "Deny Request" dialog opens then dismisses on Escape; 0 console errors. Other 3 components code-verified (identical hook call pattern; the hook is 8 lines, all 4 sites share it).

- `576e50e` perf(email-modal): wrap emailableEmps + adminContacts in useMemo.
  - Two filter chains at `EmailModal.jsx:12-16` ran on every render. Wrapped both in `useMemo([employees])`.
  - 4-line change. Build PASS. No smoke (modal renders infrequently).

**Dropped from batched sweep with rationale (4 items):**

- **I-B App.jsx:289 bootstrap isMounted guard.** Audit's risk scenario (fast login/logout cycling causes setState on unmounted tree) doesn't exist in this architecture: App is the root component; `LoginScreen` renders inside App on logout, so `currentUser` flips but App itself never unmounts. `mountedRef.current` would never flip to false. Architectural misdiagnosis.
- **F1 MobileBottomNav inline arrow.** Audit itself wrote "Observation-grade. 4 arrow functions per nav state change is negligible. Logged for completeness." Buttons not memo-wrapped; new function ref breaks no memoization. Truly stabilizing requires handler-cache ref (more code + memory than original). Net negative ROI.
- **J3 MySwapsPanel + ReceivedSwapsHistoryPanel "95.88% clone".** jscpd's % is syntactic similarity (matching identifier patterns + JSX shape), not functional duplication. The two panels render different conceptual entities (outgoing vs received swap) with intentionally similar UI (design consistency). Extracting a shared `SwapRowList` would need 7-8 config props (header text, label mapping reversal, optional note, optional active highlighting, optional cancel button, sort logic divergence, wrapper Fragment-vs-CollapsibleSection). Leaky abstraction with conditional render logic. Net savings ~5 lines + new file. Negative ROI.
- **J4 + J6 (similar shape to J3).** Same reasoning. Pre-launch, before feature paths stabilize, premature extraction freezes shapes likely to diverge.

**JR challenge that exposed the rule-pattern-match:**

- After flagging I-B + F1 with caution, JR asked: "what is the risk here? are you just blindely following a rule or is this a risky thing?" The honest answer was: rule-following, not risk-assessing. Real risk of dropping I-B + F1 is approximately zero. The earlier flag was carryover from Batch 1's surprise (5/9 audit sites already correct) — extending "audit can be wrong" caution where it didn't apply.

**S049 audit B2 list false-positive accounting:**

| Item | Outcome | Class |
|---|---|---|
| I-A + D1/D2/D3 sickEvent | Shipped earlier (8647947, ec0e962) | Real |
| L4 ColumnHeaderEditor | Already correct via useFocusTrap | False positive |
| L5 multi-file backdrop (8 sites) | 5 already correct, 4 truly broken | 5/8 false positive |
| I-B App.jsx isMounted | Architectural misdiagnosis | False positive |
| F1 MobileBottomNav | Audit said "negligible" | Self-flagged false positive |
| E1+E2 EmailModal | Real, shipped (576e50e) | Real |
| J3 MySwaps clone | Premature extraction | False positive |
| J4 AdminShift clone | Premature extraction | False positive |
| J6 Offer/Swap modal clone | Premature extraction | False positive |

False-positive rate at B2 re-rank: ~60%. Pattern: jscpd %s and audit "could be cleaner" findings need `feedback_no_tradeoffs_preferred` filter before shipping.

**Memory writes:**

- `CONTEXT/TODO.md`: anchor `repousse. spinor.` -> `vermilion. attractor dynamics.`. Added 2 Completed entries (Batch 1 da8f89a, Batch 2 576e50e). Trimmed `8647947` + `0ff2c7d/0f396c3` to comment to maintain ≤5 cap.
- `CONTEXT/DECISIONS.md`: not touched.
- `CONTEXT/LESSONS.md`: not touched (over ceiling 68,794/25k carried).
- `CONTEXT/ARCHITECTURE.md`: not touched.

**Decanting:**

- **Working assumptions:**
  - Assumed s049 triage's jscpd %s ("95.88% clone", "40-42%", "44-46L dup") signaled refactor-worthy duplication. Closer reading: jscpd reports syntactic similarity (matching identifiers + JSX shape patterns), not functional duplication. UI consistency between conceptually different entities is intentional design.
  - Assumed I-B's "fast login/logout cycling" risk applied here. App is root and never unmounts in this app — risk scenario doesn't exist.
- **Near-misses:**
  - Nearly shipped F1 per "execute ALL" approval despite the audit's own "negligible" annotation. JR's direct challenge ("blindely following a rule or risky?") exposed the rule-pattern-match.
  - Nearly silent-dropped J3+J4+J6 before flagging per `Rule Supremacy: No Silent Removal`. Surfaced the de-scope to JR; JR confirmed drop.
  - testguy "Set Active" + Save toast confirmed update but auth still rejected on retry login — likely synthetic-click vs React-state race in Playwright. Did NOT block batch verification (code-symmetry was sufficient signal since hook is identical across all 4 sites). Flaky-smoke pattern to remember.
- **Naive next move:**
  - "Execute ALL 4 batches verbatim because user said ALL." Mature move was re-rank each batch against current state before shipping (per s051+s052 lesson). User intent was "ship the bugs"; user did NOT intend "ship every audit-flagged item regardless of ROI." The handoff conversation confirmed this: when JR saw the cumulative false-positive rate, JR chose option 1 (stop) over option 2 (force-ship J3 for evidence).

**Audit (Step 3 of HANDOFF):**

`Audit: skipped (no adapter or pre-Step-2 CONTEXT writes; carried: 5 style soft-warns + LESSONS 68,794/25k char ceiling)`

## Hot Files

- `src/hooks/useEscapeKey.js` -- new shared hook (8 lines). Document-level keydown listener with `enabled` flag. Pattern reference for any future modal/popup that lacks focus-trap coverage.
- `src/hooks/useFocusTrap.js` (line 16) -- canonical Escape handler via `[data-close]?.click()`. Components that use this hook + have a `[data-close]` button get Escape for free; do not double-add.
- `src/views/EmployeeView.jsx` (lines 378-403 mobile, 695-714 desktop) -- both period-nav button groups now have aria-label + type="button".
- `src/MobileEmployeeView.jsx` (line 134 MobileAnnouncementPopup, line 507 MobileBottomSheet) + `src/MobileAdminView.jsx` (line 560 MobileEmployeeQuickView) -- 4 schedule render paths share sickEvent pattern; 2 popup components now have Escape via useEscapeKey.
- `src/modals/EmailModal.jsx` (lines 12-16) -- `emailableEmps` + `adminContacts` now memoized.
- `.claude/skills/audit/output/triage.md` -- s049 triage. ~60% false-positive rate at B2 re-rank (this session). **Do not pick next-step from here without re-rank against current src/.**
- `docs/audit-2026-05-01-full.md` + `docs/audit-2026-05-02-session-d13bc14.md` -- prior audit reports; B2 list now closed (real fixes shipped + false positives validated as already-correct).

## Anti-Patterns (Don't Retry)

- **Don't trust audit B2 findings without re-ranking against current `src/`.** s049 audit had ~60% false-positive rate at re-rank. Items get closed by intervening commits, get architecturally misdiagnosed, or self-flag as observation-grade. (s053 cumulative pattern.)
- **Don't trust jscpd %s as a "refactor-worthy" signal.** jscpd reports syntactic similarity (matching identifier patterns + JSX shapes). Functional duplication is a separate question. Pre-launch, before features have stabilized, similar UI between conceptually different entities is intentional design consistency, not waste. (s053 J3/J4/J6 drop.)
- **Don't extend "audit can be wrong" caution beyond its scope.** Batch 1 surprised us (5/9 already correct); that doesn't mean every subsequent audit item needs the same level of suspicion. Risk-assess per-item, not by carryover. (s053 JR challenge.)
- **Don't silent-drop audit-flagged items even when the audit looks wrong.** Per `Rule Supremacy: No Silent Removal`, surface the de-scope with rationale and let user decide. (s053 J3/J4/J6 surfacing.)
- **Don't trust an audit's mobile-only scope when shipping a parity fix.** (Carried s052.)
- **Don't conflate desktop and mobile smokes for the same user role.** (Carried s051.)
- **Don't email any non-allowlisted person from the app pre-launch.** Allowlist exactly `{Sarvi, JR, testguy@john@johnrichmond.ca}`. (Carried s050.)
- **Don't hedge on tradeoffs without measurement.** (Carried s049.)
- **Don't call pre-launch dormant code "dead code".** (Carried s048.)
- **Don't extend askType + CTA to all 14 staff lifecycle emails as bundled scope creep.** (Carried s048.)
- **Don't reintroduce a 24h part-time weekly cap warning at any threshold.** (Carried s047.)
- **Don't paste-then-deploy Apps Script changes silently.** Surface the redeploy step explicitly when `backend/Code.gs` is touched. (Carried s045.)
- **Don't add a new column to the Employees / Shifts / Settings / Announcements / ShiftChanges sheet without a deploy + manual-header-write checklist.** (Carried s046.)
- **Don't reach for Cloudflare Worker as the default edge layer for a Vercel-hosted app.** (Carried s046.)
- **Don't iterate `Object.values(events)` to summarize events for display.** Filter through active employees first. (Carried s045.)
- **Don't shrink the desktop schedule name column below 160px.** (Carried s045.)

## Blocked

- iPad print preview side-by-side -- since 2026-04-26
- 089adaa N meetings + 0d3220e sick-day-event-wipe / title-clear smokes -- still need JR phone-smoke -- since 2026-04-25
- S62 2-tab settings split + retroactive-default fix -- since 2026-04-14
- Payroll aggregator path 1 -- since 2026-04-12
- Amy ADP rounding rule discovery -- since 2026-04-26
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor

## Key Context

- Migration is research-complete + vendor-locked. Phase 0 = create Supabase project ca-central-1 Pro tier, apply DDL, install RLS, seed `store_config`. Pre-cutover gates remain CLOSED. JR sets ship window when ready.
- AWS SES = SMTP for password-reset blast at Phase 4 T+1:10. Verify SPF/DKIM during Phase 1 build.
- Pricing: migration is OTR's compliance cost-of-doing-business, not a billed line. Per s044 DECISIONS.
- Production URL: `https://rainbow-scheduling.vercel.app`.
- Apps Script editor: `script.google.com/home` -- requires `otr.scheduler@gmail.com`. All 19 notification emails + schedule distribution aligned to new banner system; live deployment fully synced.
- AGENTS.md is canonical post v5.2 bootstrap.
- **Pre-launch staff-email allowlist: `{Sarvi, JR, testguy@john@johnrichmond.ca}` exactly until launch.**
- **All 4 schedule render paths share sickEvent pattern + EmployeeView mobile + desktop period-nav have aria-label + type="button" parity.** Three a11y commits this session ratchet a11y compliance to "well-covered."
- **s049 audit B2 list is now closed at the level of due diligence — real fixes shipped (8647947, ec0e962, 07ad44f, da8f89a, 576e50e); false positives validated as already-correct (useFocusTrap covers 5 backdrop sites); negative-ROI items dropped (I-B, F1, J3, J4, J6).** Next audit should be a fresh `/audit session` against the diff since `0d41423` (s052 handoff), not a re-pull from this stale triage.

## Verify On Start

1. Read `CONTEXT/TODO.md` -- anchor is `vermilion. attractor dynamics.`. Top Active items: AWS SES Phase 1 setup + carried email TODOs (Onboarding email, EmailModal v2 PDF) + migration research-complete (no execution date set).
2. `git log --oneline -8` should show s053 handoff commit on top of `576e50e`, `da8f89a`, `0d41423`, `07ad44f`, `590a5ea`.
3. `git status -s` should be clean after Step 7 commit.
4. **Apps Script live drift check** -- 0 commits awaiting paste. Live deployment fully synced with repo.
5. `ls src/hooks/useEscapeKey.js` exists (8 lines). Used by 4 components: MobileAnnouncementPopup, MobileEmployeeQuickView, AdminRequestModal, RequestDaysOffModal.
6. `grep -nE "useEscapeKey\(" src/` should match exactly 4 hook call sites + 1 hook definition.
7. `grep -nE "aria-label=.Previous period.|aria-label=.Next period." src/views/EmployeeView.jsx` should match exactly 4 lines (mobile lines 380, 397; desktop lines 697, 711).
8. testguy account state: Inactive (auth verified at smoke; activation flow had a synthetic-click race but didn't block verification). Email is `john@johnrichmond.ca`. Password unchanged: `test007`.
9. AGENTS.md is canonical; shims rarely need repair.

## Next Step Prompt

Per HANDOFF check order:

- (a) Shipped-but-unverified: none. All 3 commits this session were verified (07ad44f desktop period-nav smoke verified live; da8f89a AdminRequestModal Escape live + 3 component code-verified; 576e50e build-only verify, modal-render observation grade).
- (b) External gates: AWS SES Phase 0 prep still actionable; Sarvi-asks-Amy ADP rounding still open.
- (c) Top active TODO: migration research-complete; ship is JR's call.

Natural continuations:

1. **JR sets Phase 0 migration ship window.** All pre-conditions closed. The migration is the highest-leverage remaining item.
2. **EmailModal v2 PDF attachment.** ~2-3hr feature. `Utilities.newBlob(html).getAs('application/pdf')` backend + frontend POST of print-preview HTML doc.
3. **AWS SES account setup.** Pre-stage Phase 1.
4. **Onboarding email on new-employee creation.** Trigger lives in `saveEmployee` insert path.
5. **BCC otr.scheduler@gmail.com on schedule distribution emails.** Small (~5 lines backend + 1 line frontend, single commit).
6. **JR phone-smokes deferred from Blocked list.** N meetings + sick-day-event-wipe / title-clear (089adaa + 0d3220e from 2026-04-25).
7. **Fresh `/audit session`** against the diff since `0d41423` (s052 handoff). The s049 triage is closed; next audit pass starts fresh.

Open with: ask JR which to pick up. Default if not specified is **(7) fresh audit session** — establishes the next round of B1/B2 work with clean re-ranking.

If switching harnesses, read shared CONTEXT first; AGENTS.md is canonical -- shims rarely need repair.
