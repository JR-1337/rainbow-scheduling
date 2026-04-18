<!-- SCHEMA: TODO.md
Purpose: current worklist, blockers, verification state, recent completions.
Write mode: overwrite in place as status changes. Not append-only.

Sections (in order):
- Active: ordered list of current work. Top item is the next step.
- Blocked: items waiting on external dependencies or user input.
- Verification: what has been validated, what is missing, known risks.
- Completed: up to 5 most recent completed items. Older items drop off.

Rules:
- Bullets under 12 words, sentences under 20 words, no paragraphs.
- ASCII operators only (see Operator Legend in PROJECT_MEMORY_BOOTSTRAP.md).
- Do not store rationale (use DECISIONS.md), architecture (use ARCHITECTURE.md),
  or preferences (use LESSONS.md).
- Items graduate to Completed when done and verified. Durable rationale
  moves to DECISIONS.md.
-->

## Active

- Test Sarvi-batch end-to-end -- next: JR + Sarvi smoke 10 items per plan verification section (frontend LIVE, Apps Script v2.22 LIVE)
- Mobile admin parity smoke -- next: JR phone smoke the 7-item checklist from mobile-parity deploy (`dc2866f`)
- Adversarial audit Phase C smoke -- next: JR phone smoke bottom-sheet staff panel, 44px targets, column-header Edit3 affordance (post-commit f1a5397)
- Adversarial audit Phase D -- next: Button.jsx variants, AdaptiveModal primitive, icon-scale sweep (risky; defer until after Phase C smoke)
- Backup-cash role clarification -- next: JR asks Sarvi whether she wants a NEW role vs existing `backupCashier`
- CF Worker SWR cache -- next: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Welcome email on new-employee create -- trigger in EmployeeFormModal create flow, send default emp-XXX password
- Schedule-change notifications to Sarvi -- notify when non-Sarvi-or-JR edits schedule; hook after each Code.gs write handler
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Backup-cash role -- waiting on Sarvi confirmation of intent (new role vs existing) -- since 2026-04-18
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS (2026-04-18)
- Last validated: HEAD `68615fe` pushed to origin/main; Rainbow prod LIVE at https://rainbow-scheduling.vercel.app
- Last validated: pitch deck "two weeks" fix live at https://rainbow-pitch.vercel.app (2026-04-18)
- Last validated: Apps Script v2.22 deployed + Employees column U `defaultSection` added to live Sheet (2026-04-18 per JR)
- Missing validation: Sarvi-batch 10 items not yet hands-on tested by JR + Sarvi
- Missing validation: no automated test suite; manual Playwright smoke only
- RISK: `defaultSection` column on live Sheet must be added before fresh employee saves lose the field (fallback to `'none'` is safe, so backward-compatible)
- RISK: Apps Script v2.21.x still live; new `defaultSection` writes ignored until new deployment published

## Completed

- [2026-04-18] Sarvi batch 10 items shipped (plan `so-sarvi-gave-me-quizzical-perlis.md`) -- pitch deck 3-wk typo fix (LIVE), PK Saturday 10-10:45 default, bulk Autofill PK Week button, employee defaultSection field, PDF greyscale redundant encoding (glyph + border style + bold/asterisk), Restore button tonal-blue fix, Hidden-from-Schedule collapsed by default, Former Staff removed from grid, autofill toast enhanced with week context
- [2026-04-17] CONTEXT migration committed (`1f073d7`) -- docs/* -> CONTEXT/*, thin Claude + Cursor adapters
- [2026-04-14] S65 PDF Contact Admin filter (`4477325`) -- verified in generate.js; PRIMARY_CONTACT_EMAIL in src/constants.js
- [2026-04-14] S64 Meetings+PK Stages 6-8 (`4996c5b`, `fc65095`, `4406ae0`) -- offer/swap filters, PDF/email union hours, mobile my-schedule events
- [2026-04-14] S63 Meetings+PK Stage 5 -- PKEventModal bulk create + autofill toolbar 4->3 controls; verified round-trip

<!-- TEMPLATE
## Active
- [task] -- next step: [concrete action]
- [task] -- blocked by [item in Blocked]

## Blocked
- [task] -- waiting on [external or user] -- since [YYYY-MM-DD]

## Verification
- Last validated: [what was checked, how, date]
- Missing validation: [what still needs checking]
- RISK: [known risk, impact]

## Completed
- [YYYY-MM-DD] [task] -- verified by [test or user confirmation]
-->
