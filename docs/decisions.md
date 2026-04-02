# Decision Log

<!-- Protocol: ~/.claude/rules/decisions.md -->

## 2026-02-10 - Mobile Admin as If-Branch

**Decided:** `if(isMobileAdmin)` branch in App.jsx | **Over:** separate component (rejected → 30+ state pieces need prop drilling or state library) | **Revisit:** state management library adopted or admin state refactored into context provider

## 2026-02-10 - Desktop-Only Features Exclusion

**Decided:** Employee mgmt, per-employee auto-populate, PDF export excluded from mobile admin | **Over:** full mobile parity (rejected → infrequent tasks, complexity unjustified) | **Revisit:** Sarvi requests on mobile or mobile becomes primary admin device

## 2026-02-10 - GET-with-Params Over POST

**Decided:** All API via GET `?action=NAME&payload=JSON` | **Over:** POST (rejected → Apps Script returns HTML redirect, CORS/parsing failures) | **Revisit:** Google fixes Apps Script POST or backend migrates off Apps Script

## 2026-02-10 - Chunked Batch Save (15-Shift Groups)

**Decided:** Large saves split into 15-shift chunks | **Over:** single request (fails ~8KB URL limit), larger chunks (risk with long names) | **Revisit:** backend migrates off Apps Script GET or POST becomes reliable
