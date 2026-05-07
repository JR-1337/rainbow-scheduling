<!-- SCHEMA: DATA/catalog.md
Version: 6.4
Purpose: inventory of durable artifacts under DATA/ for loop scoring, gold sets,
  rubrics, and governance. Single source of truth for which paths automated
  score.sh may read (loop_use).

Write mode: append or edit rows when promoting files into DATA/. Every file
  under DATA/ except README.md and this file must appear as a catalog entry
  (path field). Staging may hold unpromoted blobs; validator may warn on orphans.

Entry fields (each entry is a markdown section ## id or a table row -- agent
  must keep path + loop_use + sensitivity present):

- id: stable slug (ASCII, kebab-case)
- path: relative path from DATA/ (e.g. fixtures/foo.json)
- kind: fixture | trace | rubric | export | other
- sensitivity: public | internal | pii | phi
- loop_use: score_input | gold_only | human_review | forbidden_in_automated_score
- hash_or_version: optional
- notes: one line

Rules:
- Scorers read only paths with loop_use == score_input unless human override.
- phi | pii rows require human review before score_input.
- ASCII operators only in notes.
-->

## routing-index
- id: routing-index
- path: routing-index.md
- kind: rubric
- sensitivity: public
- loop_use: human_review
- hash_or_version:
- notes: pointer map to project-authoritative sources OUTSIDE DATA/ (in-tree gold + external integrations). Migrated from legacy DATA/rubrics/gold-sources-inventory.md on 2026-05-04 via /data-capture. 8-category schema; carries the Governance summary including the open pitchdeck-PII verification ask.

<!-- TEMPLATE
## fx-example-id
- id: fx-example-id
- path: fixtures/example.json
- kind: fixture
- sensitivity: public
- loop_use: score_input
- hash_or_version:
- notes: replace with real entry after promotion

| id | path | kind | sensitivity | loop_use | notes |
|----|------|------|-------------|----------|-------|
| ... | ... | ... | ... | ... | ... |
-->
