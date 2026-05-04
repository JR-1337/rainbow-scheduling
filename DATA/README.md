# DATA/ -- RAINBOW Scheduling APP project data plane

Durable fixtures, rubrics, traces, and exports for any future `LOOP/<mode>/` scoring.

`catalog.md` is the inventory; every file under `DATA/` except this `README.md` and `catalog.md` must be listed in the catalog (path + `loop_use` + `sensitivity`).

`routing-index.md` is the companion pointer map to authoritative sources OUTSIDE `DATA/` (in-tree gold + external integrations), organized by the 8 baseline capture categories. Both `catalog.md` and `routing-index.md` are required deliverables of `/data-capture`; neither replaces the other.

Run `bash scripts/validate-data-catalog.sh` from the project root in CI to fail on orphan files.

Agents do not read `DATA/*` during normal product work; only loop work, explicit `CONTEXT/TODO`, or this bootstrap.

PII boundary: Sheets-side employee/shift/request data lives in the production Google Sheet (`RAINBOW SCHEDULING DATABASE`, owner `otr.scheduler@gmail.com`); it does NOT belong in this repo. Loop fixtures must be synthesized or anonymized before promotion.
