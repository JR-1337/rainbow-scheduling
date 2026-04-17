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

- Post-demo capture -- next step: record Sarvi-reported items from 2026-04-15 demo
- CF Worker SWR cache (~1 day) -- next step: design KV cache key from `getAllData` payload; flip `API_URL` in src/App.jsx
- Welcome email on new-employee create -- trigger in EmployeeFormModal create flow, send default emp-XXX password
- Schedule-change notifications to Sarvi -- notify when non-Sarvi-or-JR edits schedule; hook after each Code.gs write handler
- Payroll aggregator path 1 -- blocked by demo go-ahead; see Blocked

## Blocked

- Email upgrade (PDF auto-attached via MailApp) -- waiting on JR sender email -- since 2026-02-10
- S62 2-tab settings split + retroactive-default fix (~4 days) -- waiting on JR green-light "Friday" -- since 2026-04-14
- CF Worker cache -- waiting on JR green-light + Cloudflare hands-on -- since 2026-04-14
- Consecutive-days 6+ warning -- waiting on Sarvi answers (PTO breaks streak? reset on single day? warn or block?) -- since 2026-04-14
- Post-demo Sarvi-reported items -- waiting on 2026-04-15 demo outcome capture -- since 2026-04-15
- Payroll aggregator path 1 -- waiting on Sarvi discovery (Counterpoint export, ADP format, employee ID, bonus logic) -- since 2026-04-12
- S39.4 mobile admin extraction -- blocked by admin state -> context provider refactor -- see DECISIONS 2026-02-10 mobile-admin-branch

## Verification

- Last validated: `npm run build` PASS at commit `4477325` (S65, 2026-04-14); Vercel auto-deployed
- Last validated: HEAD `ee1e542` == origin/main, working tree clean
- Last validated: Apps Script v2.21.0 live (Meetings+PK schema, 2026-04-13/14)
- Missing validation: no automated test suite; manual Playwright smoke only
- Missing validation: 2026-04-15 demo feedback not yet captured
- RISK: demo outcome unknown -- Sarvi reports may reshape Active list
- RISK: CF Worker is post-demo; Apps Script ~7-8s floor persists until then

## Completed

- [2026-04-14] S65 PDF Contact Admin filter (`4477325`) -- verified in generate.js; PRIMARY_CONTACT_EMAIL in src/constants.js
- [2026-04-14] S64 Meetings+PK Stages 6-8 (`4996c5b`, `fc65095`, `4406ae0`) -- offer/swap filters, PDF/email union hours, mobile my-schedule events
- [2026-04-14] S63 Meetings+PK Stage 5 -- PKEventModal bulk create + autofill toolbar 4->3 controls; verified round-trip
- [2026-04-14] S62 Sarvi fixes -- store-hours default 10-18 Mon/Tue/Wed, PDF emoji strip, one-off Apps Script availability migration
- [2026-04-14] S61 Meetings+PK Stages 1-4 -- split-maps, 3-tuple backend key, tabbed ShiftEditorModal, union hours

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
