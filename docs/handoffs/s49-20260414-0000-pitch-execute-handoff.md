# Handoff - RAINBOW Scheduling App

Session 49. `CLAUDE.md` is auto-loaded. Read `docs/todo.md` for tasks, `docs/decisions.md` before proposing changes, `docs/lessons.md` at session start.

**Authoritative build plan: `pitchdeck/build-plan.md` (also at `~/.claude/plans/hidden-baking-papert.md`) — read end-to-end FIRST.**

## Session Greeting

Demo is **today (2026-04-14)**. S48 finalized the pitch-build plan + ran the demo-data reset. JR's directive going in: **execute the plan from Build Order step 2 onward** (step 1 demo-reset is DONE). Greet with: "Plan execution session — ready to run Playwright capture (step 2). Confirm and I'll start the script." Do NOT re-litigate the plan; JR explicitly closed Q&A at end of S48.

## State

- Build (RAINBOW app): PASS, untouched since S45
- Demo-data reset: COMPLETE (Sheet wiped + reseeded; `seedDemoData()` ran successfully)
- Branch: main, pushed clean
- Last commit: `5e52891` S48 pitch-build plan refined + demo-data reset shipped
- Apps Script: v2.20.1 deployed (unchanged)
- Pitch app repo: NOT YET CREATED — `~/APPS/RAINBOW-PITCH/` created during Build Order step 3

## This Session

- Plan refined to S48-final (corrected Sarvi numbers, 6-slide self-narrating shape, working cover spec, throughline alignment table, dependency-correct build order)
- `backend/seed-demo-data.gs` written + JR ran it → live Sheet now has Sarvi/Dan/Scott/JR + 20 `@example.com` synthetics + current-period shifts + empty next period
- Plan duplicated to `pitchdeck/build-plan.md` for git-tracked safety; pitchdeck/ source files committed

## Hot Files

| Priority | File | Changed? | Why |
|---|---|---|---|
| 1 | `pitchdeck/build-plan.md` (or `~/.claude/plans/hidden-baking-papert.md`) | Yes | THE plan. Build order, slide specs, locked copy, throughline table |
| 2 | `backend/seed-demo-data.gs` | Yes (new) | Re-runnable demo reset. Don't re-run unless data needs reset again |
| 3 | `src/theme.js` | No | Source for RAINBOW-PITCH's copied theme |
| 4 | `pitchdeck/Competitive Scheduling App Analysis.md` | No | Slide 4 + tech spec §5 source (Counterpoint-no-native-scheduler citation lines 55–61) |
| 5 | `pitchdeck/rainbow app product reference.md` | No | Slide 3 + tech spec source |

## Anti-Patterns (Don't Retry)

- **Re-asking questions whose answers are explicit in the plan** (since S48) — JR closed S48 Q&A explicitly. The plan has the answers. See `docs/lessons.md` newest entries.
- **Recording user-stated facts to memory without echo-back** (since S48) — S47's wrong Sarvi numbers (24/16/$29,120) propagated through plan + decisions before JR caught them in S48. See `docs/lessons.md` newest entries.
- **Sarvi-narrated deck framing** (since S48) — superseded. Deck is self-narrating. Sarvi is host, not performer.
- **Predicting savings on slide 2** (since S47) — cost-of-doing-nothing only ($25,480/yr). See plan §"Slide 2".
- **Stacking Phase 2 savings into current ROI** (since S47) — Phase 2 = roadmap-only on slide 5.
- **Cheesy / SaaS-hero copy** (since S47) — drop "let's prove it together" etc.
- **Treating "scheduling time" as just grid-writing** (since S47) — full envelope: building + management talks + time-off + swaps + sick-call + push + off-hours.

## Blocked

| Item | Blocked By | Notes |
|---|---|---|
| Phase 2 (payroll bridge) build | Sarvi discovery answers | Pitch proceeds without — Phase 2 = slide 5 roadmap |

## Key Context

- **Demo TODAY 2026-04-14** — time-critical
- **Sarvi creds for Playwright capture (runtime only, NOT to commit):** `sarvi@rainbowjeans.com` / `admin1`
- **Other admin logins now live (do not surface in commits/files):** `dan@rainbowjeans.com` / `daniel`, `scott@rainbowjeans.com` / `scott`. Both off-grid (`showOnSchedule=FALSE`) so they don't appear in grid views.
- **Synthetics use `@example.com` (RFC 2606)** — guaranteed non-deliverable, zero email-leak risk during testing
- **Current pay period has shifts; next pay period is intentionally empty** for Playwright auto-populate capture
- **Build Order step numbering:** 1=reset (DONE), 2=Playwright capture, 3=scaffold + asset placement, 4=slides 1–6, 5=throughline audit checkpoint, 6=price sheet, 7=tech spec, 8=deploy
- **Per-slide review gate:** plan says "each slide paused for JR review before next" — JR may want to relax this to "build all 6, then review" for speed; ask before assuming
- **Headed Playwright** — script runs visible so JR can watch and abort

## Verify On Start

- [ ] `git log --oneline -3` — confirm `5e52891` HEAD
- [ ] Read `pitchdeck/build-plan.md` end-to-end (it's 233 lines but every section matters)
- [ ] Read newest 2 entries in `docs/lessons.md`
- [ ] Confirm with JR: ready to run Playwright capture (step 2), or different direction first?
- [ ] Confirm: keep per-slide review gate or batch-build all 6 then review?
