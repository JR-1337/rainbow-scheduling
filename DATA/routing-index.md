<!-- SCHEMA: DATA/routing-index.md
Version: 6.4
Purpose: routing index for project-authoritative sources that live outside DATA/.
  Answers "where does this project keep its gold?" -- points at in-tree files
  (knowledge, schemas, rubrics, fixtures, traces, lineage snapshots) and
  external truth sources (vendor APIs, model versions, integration endpoints).
  Distinct from DATA/catalog.md, which inventories files INSIDE DATA/.

Write mode: written by drivers/DATA_CAPTURE_BOOTSTRAP.md Step 5 from the Step 3
  subagent scan. Refreshed by re-running /data-capture (refresh mode). Entries
  are append-or-edit; do not silently drop entries on refresh -- if a path no
  longer exists, mark `status: removed` rather than deleting the row.

Organizing axis: by the eight baseline capture categories (cls 1-8). Categories
  are classification labels (purpose), not folder names (location). One file may
  appear in multiple categories; emit one entry per (path, category) pair.

Entry fields (markdown bullet under a `### Category N: <name>` heading):
- path: repo-relative path or external integration name
- sensitivity: public | internal | pii | phi
- role: 1-clause sentence on what this source authoritatively provides
- notes: optional free-form -- use for anything that does not fit the above
  (version pins, retention policy, gitignore status, cross-references)

Required sections in the active file (in order):
1. Per-category map (### Category 1 ... ### Category 8). Categories with zero
   observable artifacts get a single `- (no observable artifacts; gap noted)` bullet.
2. ## External integrations -- vendor APIs, model versions, third-party
   endpoints. One bullet per integration. Distinct from in-tree paths.
3. ## Governance summary -- 3-5 lines on PHI/PII boundary, retention policy,
   tool-boundary doc location. Per-entry sensitivity is canonical; this section
   summarizes the policy, does not duplicate row-level flags.
4. ## Gaps -- which of the 8 categories returned zero artifacts. Forward-looking
   note only; not a TODO.

Refresh triggers (run /data-capture refresh when):
- New top-level directory added to the project
- New SKILL / PK / knowledge file family added
- Major schema change to a primary contract file (e.g. extraction schemas, DB)
- New external integration (replacement vendor or new API surface)
- Annual review (catch silent drift)

Rules:
- ASCII operators only.
- Emit one entry per (path, category) pair. A file appearing in multiple
  categories produces multiple entries; the per-category map is the primary
  navigation axis, so keep them separate.
- `role` is one clause; verbose explanations belong in `notes`.
- Refresh never silently deletes; mark status: removed instead.
- This file is human-and-agent readable; not parsed by validate-data-catalog.sh.
-->

# Data Routing Index -- RAINBOW Scheduling App

Purpose: pointer map to project-authoritative sources outside DATA/. Refreshed 2026-05-04 via /data-capture (cold-start, migrating legacy `DATA/rubrics/gold-sources-inventory.md`).

## Per-category map

### Category 1: Ground truth and rubrics

- path: CONTEXT/pdf-print-layout.md
  sensitivity: public
  role: PDF problem registry + verification checklist + competing-goal constraints; canonical truth source for any PDF rework.
  notes: declared "Problem registry" with read-trigger and ASCII-only / em-dash rule pre-baked; preserved verbatim through bootstrap.

- path: src/pdf/generate.js
  sensitivity: public
  role: PDF generator source; HTML + window.open + browser print pipeline.
  notes: ARCHITECTURE Key Files; constraints documented in CONTEXT/pdf-print-layout.md (UTF-8 charset; ASCII hyphens only; iOS Safari blob-fallback navigates current tab; -webkit-line-clamp invisible in PDF; await import() must come AFTER print tab opens). Future-loop: PDF render regression scoring on Safari iPad target (Sarvi's primary device).

- path: docs/schemas/sheets-schema.md
  sensitivity: public
  role: declared canonical contract for the 5-tab Google Sheet column shape.
  notes: header text says "These column headers are exact. Do not rename, reorder, or omit fields"; named gold source in ARCHITECTURE Components.

- path: docs/schemas/TEMPLATE-schema.md
  sensitivity: public
  role: schema-authoring template for any new tab-shape doc.
  notes: scaffolding template (template kind in docs/schemas/).

- path: src/constants.js
  sensitivity: public
  role: frontend shape contract -- ROLES / ROLES_BY_ID / DESKTOP_SCHEDULE_GRID_TEMPLATE / EVENT_TYPES / REQUEST_STATUS_COLORS / OFFER + SWAP shapes / PRIMARY_CONTACT_EMAIL.
  notes: ARCHITECTURE Key Files line; LESSONS guards Sheets boolean truthy + numeric-password coercion against this layer.

- path: src/theme.js
  sensitivity: public
  role: brand palette + typography theme (THEME / TYPE / OTR accent colors).
  notes: OTR 5-color palette IMMUTABLE per LESSONS [PROJECT] -- `#EC3228` red, `#0453A3` blue, `#F57F20` orange, `#00A84D` green, `#932378` purple. JR-approval gate on any palette change.

- path: src/auth.js
  sensitivity: public
  role: stateless HMAC session token implementation.
  notes: reference for auth-flow regression scoring; HMAC_SECRET re-add is a manual step on Apps Script ownership transfer (LESSONS).

### Category 2: Representative inputs (fixtures / slices)

- (no observable artifacts; gap noted)

### Category 3: Behavioral / production traces

- path: pitchdeck/capture/cover-loop.mjs
  sensitivity: public
  role: Playwright/automation capture script for pitch-deck cover.
  notes: in-repo capture pipeline driver; not gitignored.

- path: pitchdeck/assets/
  sensitivity: pii
  role: rendered pitch-deck PNGs from the capture pipeline (slide previews + admin views).
  notes: NOT gitignored; committed to repo. PROVISIONAL pii pending JR verification -- some slides (slide3-admin.png and similar admin-view captures) may render real Rainbow Jeans employee names from live admin UI state. If JR confirms synthetic-only data, downgrade to public/internal; if real names rendered, regenerate with synthetic data and overwrite. See Governance summary for the verification ask.

- path: pitchdeck/assets/_video_raw/
  sensitivity: internal
  role: raw video input artifacts; per-machine local cache.
  notes: gitignored via `.gitignore` line `pitchdeck/assets/_video_raw/`.

- path: project-root *.png screenshots (flow*, phone-smoke*, pitch-walk*, period*, smoke*)
  sensitivity: internal
  role: per-machine screenshot cache from manual flow/smoke runs.
  notes: gitignored via `/*.png` root catch-all; not committed.

- path: Photos/
  sensitivity: internal
  role: local photo cache.
  notes: gitignored via `.gitignore` line `Photos/`.

- path: .playwright-mcp/
  sensitivity: internal
  role: Playwright MCP browser-automation artifacts.
  notes: gitignored; "Playwright MCP artifacts" comment in `.gitignore` confirms trace kind.

- path: docs/onboarding/welcome-source.md
  sensitivity: pii
  role: verbatim source captured from Sarvi's production .doc onboarding letter, preserved as text with `{{firstName}}` / `{{dateSent}}` template fields.
  notes: contains a real employee's full legal name (Owen Bradbury) in 4 places + Sarvi's full name; also a real Toronto business address. Committed in-repo. PII boundary should classify this `pii`, not the prior `internal`. JR may want to scrub the real name to a placeholder + commit override; out-of-scope for this /data-capture run, flagged in Governance.

### Category 4: Metric bridge

- (no observable artifacts; gap noted)

### Category 5: Lineage (snapshots, API/doc versions)

- path: backend/Code.gs
  sensitivity: public
  role: Apps Script web-app source; carries deploy lineage via version-stamped header.
  notes: ARCHITECTURE.md line 27 -- "v2.32.2 live as of s061 paste-deploy 2026-05-04"; deploy fingerprint pinned at `src/utils/api.js:6`.

- path: src/utils/api.js
  sensitivity: public
  role: frontend API client carrying the live `/exec` deploy fingerprint.
  notes: ARCHITECTURE.md line 36; deploy-fingerprint diff is the operative cutover signal on Apps Script redeploy.

- path: docs/audit-2026-04-27-deferred.md
  sensitivity: internal
  role: dated audit snapshot of project state.
  notes: may quote real names from app state during audit.

- path: docs/audit-2026-04-29-full-s042.md
  sensitivity: internal
  role: dated audit snapshot of project state.
  notes: may quote real names from app state during audit.

- path: docs/audit-2026-04-29-session-139b056.md
  sensitivity: internal
  role: session-scoped audit snapshot.
  notes: may quote real names from app state during audit.

- path: docs/audit-2026-04-29-session-40cf842.md
  sensitivity: internal
  role: session-scoped audit snapshot.
  notes: may quote real names from app state during audit.

- path: docs/audit-2026-05-01-full.md
  sensitivity: internal
  role: dated audit snapshot of project state.
  notes: may quote real names from app state during audit.

- path: docs/audit-2026-05-02-session-d13bc14.md
  sensitivity: internal
  role: session-scoped audit snapshot.
  notes: may quote real names from app state during audit.

- path: docs/audit-skill-evolution.md
  sensitivity: public
  role: skill-evolution audit (kit-side concern, no project state).
  notes: meta-audit; no employee data.

- path: docs/migration/01-schema-current.md
  sensitivity: public
  role: pre-migration design snapshot -- current schema description.
  notes: Wave 3 synthesis input.

- path: docs/migration/02-appscript-current.md
  sensitivity: public
  role: pre-migration design snapshot -- current Apps Script architecture.
  notes: Wave 3 synthesis input.

- path: docs/migration/03-supabase-target.md
  sensitivity: public
  role: pre-migration design snapshot -- proposed Supabase schema target.
  notes: Wave 3 synthesis input.

- path: docs/migration/04-auth-design.md
  sensitivity: public
  role: pre-migration design snapshot -- auth migration plan.
  notes: Wave 3 synthesis input.

- path: docs/migration/05-email-design.md
  sensitivity: public
  role: pre-migration design snapshot -- email pipeline migration plan.
  notes: Wave 3 synthesis input.

- path: docs/migration/06-pdf-design.md
  sensitivity: public
  role: pre-migration design snapshot -- PDF pipeline migration plan.
  notes: Wave 3 synthesis input.

- path: docs/migration/07-cutover-plan.md
  sensitivity: public
  role: pre-migration design snapshot -- cutover sequence.
  notes: Wave 3 synthesis input.

- path: docs/migration/08-data-migration.md
  sensitivity: public
  role: pre-migration design snapshot -- data migration plan.
  notes: Wave 3 synthesis input.

- path: docs/migration/09-rollback-plan.md
  sensitivity: public
  role: pre-migration design snapshot -- rollback procedure.
  notes: Wave 3 synthesis input.

- path: docs/migration/10-supabase-due-diligence.md
  sensitivity: public
  role: pre-migration design snapshot -- vendor due-diligence findings.
  notes: feeds the s044 vendor + pricing decision in DECISIONS.

- path: docs/DEPLOY-S36-AUTH.md
  sensitivity: public
  role: dated deploy runbook for the s036 auth deployment.
  notes: operational lineage of changes-as-applied.

- path: docs/email-migration-investigation.md
  sensitivity: public
  role: investigation document for email pipeline migration.
  notes: precursor to email-design migration doc.

- path: docs/email-migration-walkthrough.md
  sensitivity: public
  role: walkthrough for email pipeline migration steps.
  notes: operational guide.

- path: docs/perf-audit-app-jsx-2026-04-25.md
  sensitivity: public
  role: dated perf-audit document on App.jsx (latency / render-cost analysis).
  notes: also feeds Category 6.

- path: CONTEXT/handoffs/s059-2026-05-04-archive-feature-shipped.md
  sensitivity: public
  role: session handoff -- archive feature ship.
  notes: kit handoff retention rule -- up to 3 recent.

- path: CONTEXT/handoffs/s060-2026-05-04-employee-lifecycle-redesign.md
  sensitivity: public
  role: session handoff -- employee lifecycle redesign.
  notes: kit handoff retention rule -- up to 3 recent.

- path: CONTEXT/handoffs/s061-2026-05-04-single-archive-button-shipped.md
  sensitivity: public
  role: session handoff -- single archive button ship.
  notes: kit handoff retention rule -- up to 3 recent.

- path: CONTEXT/archive/
  sensitivity: public
  role: graduated decisions/lessons archives + handoff-archive subdir; durable lineage of CONTEXT evolution.
  notes: schema headers bumped to v6.2 in this session; bodies byte-preserved.

### Category 6: Cost / latency / reliability side signals

- path: docs/perf-audit-app-jsx-2026-04-25.md
  sensitivity: public
  role: perf observation document on App.jsx (latency / render-cost analysis).
  notes: dated, point-in-time; single-shot audit not a continuous capture.

- path: docs/research/scaling-migration-options-2026-04-26.md
  sensitivity: public
  role: scaling research document; cost/latency/reliability signal source for migration planning.
  notes: feeds into the s044 migration vendor + pricing decision.

### Category 7: Governance (PII/PHI, retention, tool boundaries)

- path: .gitignore
  sensitivity: public
  role: declares the in-repo PII boundary by exclusion.
  notes: ignores `Photos/`, `.playwright-mcp/`, `/*.png` root catch-all, `pitchdeck/assets/_video_raw/`, `CLAUDE.local.md`, `.context-migration/`, `.migration-recovery/`, `CONTEXT/.upgrade-snapshot/`. Tightened from blanket `.claude/` to 3 specific entries on 2026-05-04 so `.claude/hooks/` + `settings.json` ship in git.

- path: CONTEXT/LESSONS.md
  sensitivity: public
  role: durable preference + pitfall + correction record (governance-class).
  notes: kit canonical mutable memory; v6.2 SHORT pointer schema header.

- path: CONTEXT/DECISIONS.md
  sensitivity: public
  role: durable decision + rationale record (governance-class).
  notes: kit canonical mutable memory; v6.2 schema.

- path: CONTEXT/ARCHITECTURE.md
  sensitivity: public
  role: current structure + boundaries + flows + integrations snapshot.
  notes: kit canonical mutable memory; v6.2 schema.

- path: CONTEXT/TODO.md
  sensitivity: public
  role: current worklist + blockers + verification + recent completions.
  notes: kit canonical mutable memory; v6.2 schema.

- path: AGENTS.md
  sensitivity: public
  role: Read-And-Write Rules + Loop Access Rules + Boundaries (tool-boundary governance for any coding agent).
  notes: kit canonical adapter; v6.2 text-drift refresh applied 2026-05-04.

- path: .claude/hooks/
  sensitivity: public
  role: PreToolUse/PostToolUse hook scripts enforcing operator legend, AGENTS.md size cap, snapshot-before-write, rm -rf CONTEXT/ block, schema-header validator.
  notes: ships in git (committed audit trail) so cloud-session clones inherit hook enforcement.

- path: .claude/settings.json
  sensitivity: public
  role: hook registration block + permissions.
  notes: ships in git; per-machine bypass `export CONTEXT_HOOKS_DISABLED=1` before harness launch.

### Category 8: Negative and gaming probes

- (no observable artifacts; gap noted)

## External integrations

- Google Sheets -- spreadsheet `RAINBOW SCHEDULING DATABASE` (file id `1LlhhT9f6ewEfWqdoe0-j5hnVNKiA1pSfEFBAzSo3v8A`, owner `otr.scheduler@gmail.com`); accessed via `Sheets.Spreadsheets.Values.*` from Apps Script. PII LIVE DATA.
- Google Apps Script web app -- endpoint `GET /exec?action=NAME&payload=JSON`; deploy fingerprint `AKfycbxk8FBvUhwWa1DPbFiDVEhqa1tPzfTGqYqnYPiSmYTu9UbXvSXddI0xy-5hQl8kkfpSSQ` referenced at `src/utils/api.js:6`; ~7-8s call floor (LESSONS).
- Vercel -- frontend hosting at `https://rainbow-scheduling.vercel.app` auto-deploy on push to main; sibling project `https://rainbow-pitch.vercel.app`.
- MailApp / Gmail -- sender identity "OTR Scheduling" via `otr.scheduler@gmail.com`.
- Google Drive -- folder "New Employee Files" id `1dWQOcZWMaAe_2YTGuPMhDmwXwXo45mtx`; files `1AcXsOr6i3fASdiyHpPCHw1uVjO0mYWHV` (welcome doc), `1w6KMoyOZLESx4nmcUaSaPIf0T6my8Brj` (Federal TD1 2026), `1Iu9dHa0FX_ya8osiPMWXkV0ld8U9kW29` (Ontario TD1 2026); accessed via `DriveApp.getFileById`.
- drift-scan RemoteTrigger -- `trig_01FgamZJH8VeTombNpN4CQEg`, weekly Mon 02:07 UTC; writes `CONTEXT/drift-reports/drift-YYYY-MM-DD.md`. Registered 2026-05-04 by /bootstrap Step 12b.
- Ontario.ca -- canonical authoritative source for ESA / 44hr-OT statutory citations referenced in pitch artifacts.
- React 18 + Vite + Tailwind + Lucide -- frontend stack vendor versions (per ARCHITECTURE Components).
- HMAC_SECRET Script Property -- vendor-side secret store within Apps Script; manual re-add required on Apps Script ownership transfer (LESSONS).

## Governance summary

**In-repo (public-or-internal)**: Apps Script source, frontend constants, theme, schema docs, PDF generator, statutory citations, migration design docs, kit memory artifacts, hook manifest.

**PII LIVE DATA (cloud-only, NEVER in repo)**: live employee + shift + request + announcement + offer/swap rows in production Google Sheet `RAINBOW SCHEDULING DATABASE`. Loop fixtures must synthesize or anonymize before any DATA/fixtures/ promotion.

**In-repo PII residue (committed; cleanup ask)**: `docs/onboarding/welcome-source.md` carries Owen Bradbury's full legal name in 4 places + Sarvi's full name. Marked `pii` in row. Action: JR may want to scrub real name to a placeholder (`{{firstName}}` template fields already exist) + override-commit; out-of-scope for this /data-capture run.

**Gitignore-excluded local artifacts (internal)**: `Photos/`, `.playwright-mcp/`, root `*.png` flow/smoke screenshots, `pitchdeck/assets/_video_raw/`, `dist/` build output, `.context-migration/` / `.migration-recovery/` / `CONTEXT/.upgrade-snapshot/` migration scratch.

**VERIFY (open governance question)**: in-repo `pitchdeck/assets/*.png` slide screenshots are NOT gitignored and may render real employee names from admin UI views (slide3-admin.png and similar). Provisionally classified `pii` until verified. Action: JR to confirm slide PNGs use synthetic/test data; if real names rendered, regenerate with synthetic data and overwrite + downgrade row to public/internal. Out-of-scope for this /data-capture run.

**Tool boundaries**: AGENTS.md Read-And-Write Rules + Boundaries; .claude/hooks/ enforce operator legend + size caps + snapshot-before-write; CONTEXT_HOOKS_DISABLED=1 in parent shell for legitimate bypass.

## Gaps

- **Category 2 (Representative inputs / fixtures)**: no fixtures, no test files, no test runner. Forward-looking: drop a path here when fixture capture is added.
- **Category 4 (Metric bridge)**: no scalar-to-signal collector; no LOOP/ tree; no scoring rubric. Forward-looking: drop a path here when a loop is created via drivers/LOOP_CREATION.md.
- **Category 6 (Cost / latency / reliability side signals)**: only two indirect documents (perf-audit + scaling research); no live telemetry capture. Forward-looking: drop a path here when /exec call timing or render-cost capture is added.
- **Category 8 (Negative / gaming probes)**: no adversarial / redteam fixtures. Forward-looking: drop a path here when adversarial inputs are captured.

<!-- TEMPLATE
# Data Routing Index -- {project-name}

Purpose: pointer map to project-authoritative sources outside DATA/. Refreshed YYYY-MM-DD via /data-capture.

## Per-category map

### Category 1: Ground truth and rubrics
- path: tests/ground_truth.md
  sensitivity: internal
  role: extraction scoring baseline against held-out fixtures.
  notes: optional.

### Category 2: Representative inputs (fixtures / slices)
- path: tests/sample_transcript.txt
  sensitivity: internal
  role: representative input fixture for pipeline tests.

### Category 3: Behavioral / production traces
- (no observable artifacts; gap noted)

### Category 4: Metric bridge
- path: dashboard/metrics-spec.md
  sensitivity: internal
  role: maps tracked scalars to client-facing dashboards.

### Category 5: Lineage (snapshots, API/doc versions)
- path: data/db-backup-vN.sql
  sensitivity: phi
  role: versioned DB snapshot pre-migration.
  notes: gitignored.

### Category 6: Cost / latency / reliability side signals
- (no observable artifacts; gap noted)

### Category 7: Governance (PII/PHI, retention, tool boundaries)
- path: .gitignore
  sensitivity: public
  role: declares PHI exclusions and retention boundaries.

### Category 8: Negative and gaming probes
- path: tests/adversarial_inputs.txt
  sensitivity: internal
  role: stress-tests degenerate or adversarial inputs.

## External integrations

- Anthropic Claude Opus 4.7 -- extraction (tool_use, temp=0.0).
- Vendor API X -- description; API version pin.

## Governance summary

PHI: clients/{slug}/ and data/db.* (gitignored, off-repo retention at <path>). PII:
named-fixture content in tests/ (in-repo, see CONTEXT/TODO if cleanup queued).
Tool boundaries: docs/tool-policy.md or equivalent. Sensitivity flags on each
entry are canonical; this section summarizes the policy.

## Gaps

- Category 3, 6 -- no observable artifacts. Forward-looking: drop a path here when
  the project starts capturing behavioral traces or cost/latency scalars.
-->
