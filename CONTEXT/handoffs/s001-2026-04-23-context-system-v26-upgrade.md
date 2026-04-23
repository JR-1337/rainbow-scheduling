<!-- SCHEMA: handoff
Version: 1
Purpose: session continuity for the next chat. Ephemeral.
Write mode: one file at a time via atomic rename (write .tmp then mv).
             Retention governed by HANDOFF.md / HANDOFF-LOOP.md Step 6.

Rules:
- Filename: sNNN-YYYY-MM-DD-{short-slug}.md where NNN is the next three-digit session index (see HANDOFF.md / HANDOFF-LOOP.md Terminology).
- Required sections defined in HANDOFF.md (lite) or HANDOFF-LOOP.md (full).
- Do not duplicate full TODO.md or DECISIONS.md content; reference them.
- Do not restate adapter content. Do not become another adapter layer.
- ASCII operators only.
-->

# Handoff -- s001 -- 2026-04-23 -- Context system v2.6 upgrade

## Session Greeting

Read `CONTEXT/TODO.md`, `CONTEXT/DECISIONS.md`, `CONTEXT/ARCHITECTURE.md`, then this file. Read `CONTEXT/LESSONS.md` if workflow corrections may affect approach. The prior handoff `2026-04-19-phase-e-cuts-13-15-email-pivot.md` carries the active-focus state (code paused, email overhaul next, external gate on JR's dedicated Gmail) -- read it to recover that thread.

First reply: 1-2 short sentences plus a one-line `Pass-forward:` and exactly 1 direct question about how to proceed. No preamble.

## State

- Project path: `/home/johnrichmond007/APPS/RAINBOW Scheduling APP/`
- Branch: `main`. In sync with origin on commits (`0 0`). HEAD `9fe372d`.
- Uncommitted: 9 modified (all CONTEXT/* + both adapters + .gitignore) + 1 new (`KIMI.md`) -- the v2.6 upgrade diff, not yet staged.
- `CONTEXT/.upgrade-snapshot/` present but gitignored. Retained at JR's request (denied auto-delete).
- Active focus unchanged from prior handoff: code/refactor paused; email + distribution overhaul is the declared next initiative, blocked on JR creating a dedicated sender Gmail.

## This Session

Ran `PROJECT_MEMORY_BOOTSTRAP.md` in Upgrade Mode. Project detected as pre-v1 (no `Version:` on any schema, no `ADAPTER_SCHEMA_V1` / `LOOP_ACCESS_RULES_V1` markers on adapters, `KIMI.md` absent, `.gitignore` missing upgrade-snapshot entry). JR approved full-template replacement (option B) for adapters after being asked the A/B question.

Changes shipped this session:
- `CONTEXT/TODO.md`, `CONTEXT/ARCHITECTURE.md`: schema headers -> `Version: 1`. No user content touched.
- `CONTEXT/DECISIONS.md`, `CONTEXT/LESSONS.md`: schema headers -> `Version: 1` + template blocks refreshed with new optional fields (Source, Evidence, Origin, H-holdout variant).
- `CONTEXT/archive/README.md`, `CONTEXT/handoffs/2026-04-19-...md`: schema headers -> `Version: 1`.
- `CLAUDE.md` (114 -> 87 lines), `.cursor/rules/context-system.mdc` (92 -> 95 lines): full template replacement. `<!-- ADAPTER_SCHEMA_V1 -->` + `<!-- LOOP_ACCESS_RULES_V1 -->` markers added. Customizations re-incorporated: Immutable Constraints (OTR brand colors, ESA 44-hr, publishedShifts gate, Sheets schema), Reference Material paths, Sibling Project pointer, module-adapter candidate boundaries.
- `KIMI.md`: created from v2.6 template (87 lines) with same customizations.
- `.gitignore`: added `CONTEXT/.upgrade-snapshot/`.
- Step 13 verification: diff-vs-snapshot awk filter returned zero drift across all 6 `CONTEXT/*` files. User content preserved byte-for-byte between schema header and template block.

JR flagged post-upgrade: should the pre-v2 handoff `2026-04-19-...md` be renamed to `sNNN-` prefix? Per bootstrap Non-Destructive Guarantee, Upgrade Mode "will NEVER modify handoff files"; I updated its schema header only (the one deterministic exception) and left the filename. Consulted HANDOFF.md Terminology (rule: scan for `^s([0-9]{3})-`, M=0 -> next is `s001`). JR has not approved a retroactive rename, so this new handoff is `s001-...` and the prior retains legacy naming. Lexical sort works in practice because digits (`2`) sort before letters (`s`) -- but relying on modtime tiebreak long-term is fragile.

Decanting check:
- Working assumptions: (a) Full-template replacement was correct for pre-v2 adapters because the custom sections (Immutable Constraints, Reference Material, Sibling Project) mapped cleanly onto the v2.6 template's own sections; minimal append (option A) would have left boundary/ownership wording inconsistent with v2.6 spec. (b) Snapshot retention is a cautious cleanup choice, not a failure mode -- gitignore keeps it out of commits.
- Near-misses: briefly considered option A before JR explicitly chose B. Did not propose retroactive handoff rename unprompted -- that was JR's post-hoc question, still open.
- Naive next move: picking up email-overhaul work without closing the dangling snapshot + rename questions. These are housekeeping, not blockers, but should be resolved before a code commit touches the same surfaces.

Audit (Step 3): clean. Adapters 87/95/87 lines (all < 160). No module adapters. No LaTeX/Unicode/em-dashes introduced this session (pre-existing markdown lint soft-warns in CONTEXT/* user content predate the upgrade and are unchanged). Upgrade writes are drift-free by Step 13 verification.

Git sync (Step 4): dirty working tree (10 files, upgrade diff only). In sync with origin on commits (no push needed; JR decides whether to commit the upgrade as its own cut).

## Hot Files

| Priority | File | Why |
|----------|------|-----|
| 1 | `CONTEXT/.upgrade-snapshot/` | Pre-upgrade copy of all 10 touched files + sha256 hashes. Safe to `rm -rf` once JR is satisfied with the new state; auto-delete was denied at verification step. |
| 2 | `CLAUDE.md`, `.cursor/rules/context-system.mdc`, `KIMI.md` | v2.6 adapters with both markers + project customizations. Re-read before editing any adapter; do not hand-edit during routine work per the new rules. |
| 3 | `CONTEXT/handoffs/2026-04-19-phase-e-cuts-13-15-email-pivot.md` | Carries the active project focus (email overhaul). Also the legacy-named handoff; JR's open question is whether to rename to `s???-...` retroactively. |
| 4 | `~/context-system/TEMPLATES.md` | v2.6 canonical templates. Consult before any future Upgrade Mode run or adapter repair. |
| 5 | `backend/Code.gs`, `src/email/build.js`, `src/pdf/generate.js` | Next session's targets once email overhaul unblocks. Audit surface listed in prior handoff's `Next Step Prompt`. |

## Anti-Patterns (Don't Retry)

- Do not touch adapter content during routine handoff runs. HANDOFF.md Step 2 explicitly excludes adapter writes; they are Upgrade-Mode or explicit drift-repair activity only.
- Do not re-run `PROJECT_MEMORY_BOOTSTRAP.md` unless schemas drift again. Re-running in no-op mode is harmless but wasteful; re-running with user-edited adapters can force the "upgrade plan" flow over cleanly customized files.
- Do not rename old handoff files as a side effect of unrelated work. Bootstrap Non-Destructive Guarantee forbids it; HANDOFF.md does not require it. Retroactive renames need an explicit JR ask with session-index reasoning.
- Do not delete `CONTEXT/.upgrade-snapshot/` without JR's say-so. Auto-delete was already denied this session.
- Do not commit `KIMI.md` without confirming JR actually uses Kimi CLI in this project. The file was created because bootstrap mandates three adapters, but if Kimi is never used here the file is inert -- harmless but a JR-visible artifact.

## Blocked

See `CONTEXT/TODO.md#Blocked`. No new blockers introduced this session. Top-of-mind carrying forward from prior handoff:

- Email + distribution overhaul -- blocked by JR creating dedicated Gmail sender
- Sarvi iPad retest (3 shipped fixes: white-screen, PDF ae glyph + `.blob`, PDF role-encoding)
- Sarvi-batch + Phase A+B+C save-failure smoke -- JR + Sarvi
- Bug 4 (PK 10am-10am) + Bug 5 (top-nav PK UI no-show) -- waiting on JR repro
- Sarvi defaultShift + Counterpoint/ADP discovery
- S62 2-tab settings split + CF Worker SWR cache -- waiting on JR green-light

## Key Context

- Bootstrap is now v2.6-compliant on this project. Subsequent runs should detect as `no-op` unless the spec bumps.
- The upgrade snapshot (`CONTEXT/.upgrade-snapshot/`) is gitignored via the entry added this session; committing the rest is safe.
- Auto-memory at `~/.claude/projects/-home-johnrichmond007-APPS-RAINBOW-Scheduling-APP/memory/` is independent of the bootstrap; unchanged this session.
- Sibling project `~/APPS/RAINBOW-PITCH/` is not governed by this project's adapters. If context-system upgrade is wanted there too, run `PROJECT_MEMORY_BOOTSTRAP.md` from its root; v2.6 templates live at `~/context-system/TEMPLATES.md`.
- Cross-harness: if switching to Cursor or Kimi, read shared `CONTEXT/*` first; repair adapters only if stale. All three adapters now point to the same canonical memory.

## Verify On Start

- `git status` -- expect 9 modified + 1 new (`KIMI.md`) from this upgrade, nothing code-related. `CONTEXT/.upgrade-snapshot/` should NOT appear (gitignored).
- `git log --oneline -3` -- top should still be `9fe372d` (no new commits this session).
- `grep -cE "ADAPTER_SCHEMA_V1|LOOP_ACCESS_RULES_V1" CLAUDE.md .cursor/rules/context-system.mdc KIMI.md` -- expect `2` for each file.
- `grep -l "Version: 1" CONTEXT/TODO.md CONTEXT/DECISIONS.md CONTEXT/ARCHITECTURE.md CONTEXT/LESSONS.md CONTEXT/archive/README.md` -- expect all five to match.
- `wc -l CLAUDE.md .cursor/rules/context-system.mdc KIMI.md` -- expect 87 / 95 / 87 (all under 160).
- Ask JR: (a) delete `CONTEXT/.upgrade-snapshot/` now that new state is verified? (b) retroactively rename `CONTEXT/handoffs/2026-04-19-...md` to `s00X-...` (and if yes, bump THIS handoff accordingly)? (c) commit the upgrade as its own cut before resuming email-overhaul work?

## Next Step Prompt

No (a) shipped-but-unverified code work this session -- the upgrade itself was verified by Step 13 diff-vs-snapshot (zero drift). (b) external gates still dominate the blocker list (JR dedicated Gmail for email overhaul; Sarvi repro / discovery; JR green-lights on S62 and CF Worker).

Productive next moves, in JR's picking order:
1. Resolve snapshot retention decision -- keep, delete, or leave for a week as a rollback buffer.
2. Resolve handoff-rename decision -- retroactively rename `2026-04-19-...` to `s001-...` and bump this handoff to `s002-...`, OR accept legacy-naming coexistence.
3. Commit the CONTEXT v2.6 upgrade as its own cut (`CONTEXT system: upgrade to bootstrap v2.6` or similar). Keep separate from any code work so the diff is purely infrastructure.
4. If email overhaul gate clears (dedicated Gmail created): start the send-site audit from prior handoff's Productive Pre-Work list (audit `MailApp.sendEmail` sites across `backend/Code.gs` + `src/email/build.js` + `src/pdf/generate.js`; review plaintext-vs-HTML stance; sketch welcome-email copy).
5. Otherwise resume any Blocked item that has become unblocked.

If switching harnesses, read shared `CONTEXT/*` first; repair adapters only if stale.

Pass-forward: CONTEXT system is now v2.6-compliant; snapshot retention and handoff-rename are housekeeping decisions waiting on JR before the next code or email-overhaul cut.
