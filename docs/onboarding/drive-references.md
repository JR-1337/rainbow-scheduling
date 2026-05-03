# Onboarding files — Drive references

All three live in otr.scheduler@gmail.com Drive, folder **"New Employee Files"** (folder ID `1dWQOcZWMaAe_2YTGuPMhDmwXwXo45mtx`). Apps Script under that account can read them directly via `DriveApp.getFileById(...)` at send-time.

| Role in onboarding | Drive title | File ID | MIME |
|---|---|---|---|
| Welcome letter (template — facelift planned, sent as branded PDF) | `Owen Bradbury.doc` (template instance) | `1AcXsOr6i3fASdiyHpPCHw1uVjO0mYWHV` | `application/msword` |
| Federal tax form | `2026 Federal tax TD1.pdf` | `1w6KMoyOZLESx4nmcUaSaPIf0T6my8Brj` | `application/pdf` |
| Ontario tax form | `2026 Ontario tax TD1.pdf` | `1Iu9dHa0FX_ya8osiPMWXkV0ld8U9kW29` | `application/pdf` |

## Notes

- **Welcome letter source-of-truth:** the verbatim text lives at `welcome-source.md` in this directory. The rebranded HTML template lives in `backend/welcome-onboarding-template.html` (to be created in the implementation plan); it does **not** read from the `.doc` file at runtime. The `.doc` is preserved in Drive only as historical reference.
- **Tax form lookup at runtime:** lookup by file ID, not by title. Title-based lookup is fragile — Sarvi may rename files.
- **Annual tax-form swap:** Sarvi uploads new `2027 Federal tax TD1.pdf` / `2027 Ontario tax TD1.pdf` to the same folder, gets new file IDs, and JR updates the two file-ID constants in `backend/Code.gs`. One paste-deploy per year. No DDL change.
- **Permissions:** the Apps Script is bound to a Sheet owned by otr.scheduler@gmail.com (per `reference_apps_script_topology.md`), so DriveApp runs with otr.scheduler authority and can read these files without additional sharing.
