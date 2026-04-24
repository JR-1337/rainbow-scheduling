# s007 -- 2026-04-24 -- PK/MTG badge relocation + tooltip trim

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, and `CONTEXT/LESSONS.md`, then resume from `State` and `Next Step Prompt` below. First reply: 1-2 short sentences, a `Pass-forward:` line, and exactly 1 direct question about how to proceed.

## State

- Project: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP`
- Git: clean, HEAD `06ef00c` pushed to origin/main
- Branch: main, no divergence
- Sibling `~/APPS/RAINBOW-PITCH` untouched this session
- Active focus: frontend polish + bug-triage wrapped; next natural pulls are external-gated (sender Gmail, CF Worker, Sarvi discovery)

## This Session

Entered investigating Bug 5 ("top-nav PK saves but doesn't show in UI"). Drive MCP read of the Sheet showed 4 PK rows + 1 meeting in live data; JR confirmed on prod the PK indicator WAS rendering. Real bug: the absolute-positioned `bottom-0 right-0` event-badge overlay was covering the shift's hours + task-star row. Re-scoped mid-session to a visual-overlap fix; wrote plan `/home/johnrichmond007/.claude/plans/swift-orbiting-mango.md`; Sonnet 4.6 sub-agent executed per the "Opus plans, Sonnet executes" lesson.

**Shipped (5 commits)**
- `a6200cc` -- PK/MTG badge relocated from absolute overlay to in-flow flex row inline with role name across `src/components/ScheduleCell.jsx`, `src/MobileAdminView.jsx`, `src/MobileEmployeeView.jsx`. Kept `EVENT_TYPES` styling, title tooltips, `>=3` rollup pill. Dropped `pr-3` on desktop role-name span. Dropped `relative` on wrappers with no remaining absolute child.
- `616d3d2` -- Desktop employee-name hover tooltip trimmed to name + mailto email. Dropped hours / phone / admin-access / 7-day availability. Added 180ms delayed hide + card onMouseEnter/onMouseLeave so cursor can traverse row -> card to click email.
- `f9fedef` -- first pass: wrap long emails with `word-break: break-all`. JR rejected: looked messy.
- `96467fc` -- replaced wrap with length-based font shrink (12px default, step-down 1px per ~3 chars beyond 32, floor 9px) + `whiteSpace: nowrap`.
- `06ef00c` -- added `target="_blank" rel="noopener noreferrer"` on the mailto anchor so click does not navigate the app tab.

**Verification**
- Badge relocation: build PASS; localhost Playwright PASS desktop 1280px admin + mobile 390px admin on Alex Fowler Sun 2026-04-19 cell; prod smoke PASS after Vercel redeploy. Employee viewport not smoked; `testguy@testing.com` inactive on prod; same code path.
- Tooltip: build PASS. Prod render by JR not yet spot-confirmed for the final `06ef00c` iteration.

**Writes to canonical memory**
- `CONTEXT/TODO.md`: Bug 5 removed from Active; Bug 4 narrowed to "Sheet showed no 10-10 rows, may be stale"; two Last-validated lines added; two Completed entries added; oldest Completed trimmed (5-item ceiling).
- `CONTEXT/DECISIONS.md`: 2 new entries at top (tooltip trim + badge relocation) with Confidence: H, rejected-alternatives recorded.
- `CONTEXT/LESSONS.md`: 2 new [PROJECT] lessons. (1) Check for visual obstruction before re-chasing a "doesn't render" bug. (2) Absolute-positioned cell overlays collide on small schedule cells.
- No ARCHITECTURE writes.

**Decanting: mostly clean**
- Working assumption that collapsed: "handoff's Bug 5 framing was accurate." It was not -- PK DID render; overlap was the real issue. Lesson captured.
- Near-miss: `word-break: break-all` wrap on the email (shipped in `f9fedef`, reverted). Recorded in DECISIONS as rejected alternative.
- Naive next move: reading only the handoff, next session could try to fix "Bug 5" as a re-render bug. TODO.md now reflects it is closed as visual-overlap; Anti-Patterns below calls it out.

**Audit: clean (style soft-warns only)**
- CONTEXT writes happened; audit ran. No adapter changes. CONTEXT ownership held: TODO took status + verification, DECISIONS took rationale + rejected alternatives, LESSONS took durable preferences. Pre-existing markdownlint MD022/MD032/MD041 warnings across DECISIONS.md and LESSONS.md stayed within their existing pattern; not introduced this session.

## Hot Files

- `src/components/ScheduleCell.jsx`, `src/MobileAdminView.jsx`, `src/MobileEmployeeView.jsx` -- badge layout recently relocated; do not re-introduce absolute overlays on shift cells.
- `src/App.jsx` ~line 2491 -- tooltip JSX; keep card-level onMouseEnter/onMouseLeave if touching.
- `src/hooks/useTooltip.js` -- 180ms delayed hide + `handleTooltipEnter`/`handleTooltipLeave` exports.
- `/home/johnrichmond007/.claude/plans/swift-orbiting-mango.md` -- executed plan; retained for audit trail, do not re-execute.

## Anti-Patterns (Don't Retry)

- Do NOT file "PK doesn't render" as a render-layer bug without first confirming via DOM/Playwright that the node is actually missing. 2026-04-24 evidence: PK badges were rendering; visual overlap masked them.
- Do NOT re-introduce `absolute bottom-0 right-0` event badges on schedule cells. Overlap is structural at 56-66px cell height.
- Do NOT word-break-wrap the tooltip email (tried `f9fedef`, rejected). Shrink-to-fit font is the chosen solution.
- Bug 4 (PK 10am-10am) still flagged but Sheet inspection 2026-04-24 found zero 10-10 rows. Do NOT plan a code fix without fresh repro from JR; may already be resolved by 2026-04-18 day-of-week PK defaults.

## Blocked

- Email + distribution overhaul -- waiting on JR dedicated Gmail sender -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix -- waiting on JR green-light -- since 2026-04-14
- CF Worker SWR cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers -- since 2026-04-14
- Payroll aggregator path 1 -- waiting on Sarvi discovery -- since 2026-04-12
- Backup Cash live-shift end-to-end smoke -- awaits Sarvi real use
- Mobile 390px Hidden section (per-row Edit shipped 2026-04-23) + employee-viewport smoke of PK badge relocation + tooltip trim -- both small, unvalidated

## Key Context

- `CONTEXT/TODO.md` Verification is the canonical smoke ledger
- `CONTEXT/DECISIONS.md` top 2 entries (2026-04-24) are this session's product decisions
- `CONTEXT/LESSONS.md` "Follow approved plan verbatim" still at Affirmations: 2 -- graduate to root adapter at next non-trivial plan session
- Memory: `reference_smoke_logins.md` has `johnrichmond007@gmail.com/admin1` + `testguy@testing.com/test007`; testguy is inactive on prod as of 2026-04-24
- Memory: `feedback_no_tradeoffs_preferred.md` applied this session: JR rejected wrap, moved to font-shrink
- If switching harnesses, read shared CONTEXT first; repair adapters only if stale.

## Verify On Start

1. Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/LESSONS.md`
2. Check git: `git log --oneline -3` -- HEAD should be `06ef00c` or later, clean on origin/main
3. If JR asks about Bug 5, point to the 2026-04-24 closure (PK renders, overlap was the bug, fixed in `a6200cc`)
4. Two small unverified items exist: employee-viewport smoke of PK badge relocation + tooltip trim on prod. Mention before opening new work.

## Next Step Prompt

Shipped-but-unverified from this session: employee-viewport (desktop + mobile 390px) smoke of PK/MTG badge relocation + the trimmed tooltip. Needs an active non-admin login; `testguy@testing.com` is inactive on prod. Either activate a test account or wait for JR to hand-confirm on his phone.

External gates dominate the rest: JR dedicated sender Gmail (email overhaul), Sarvi discovery for payroll aggregator, JR green-light for CF Worker + S62 settings split, JR fresh repro for Bug 4.

Default next move: ask JR (a) whether he hand-confirmed the tooltip + badge fix on prod, and (b) which gate he wants to unlock first.

Pass-forward: badge relocation + tooltip trim shipped to prod, Bug 5 reclassified and closed as visual-overlap (not missing-render); employee-viewport smoke still pending.
