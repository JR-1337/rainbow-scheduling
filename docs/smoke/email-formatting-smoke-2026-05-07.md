# Email-formatting smoke plan -- s072 -> s073

**Date drafted:** 2026-05-07 (s072)
**Session to execute:** s073 (next)
**Purpose:** Visually verify the formatting of all admin-facing + employee-facing emails the system sends. Triggered by JR's request after v2.33.1+v2.33.2 paste-deploy: "smoke it and make sure there's something in the body of the welcome email. I want to see all the emails and see their formatting."

---

## Pre-flight

- Apps Script live = **v2.33.2** (paste-deployed s072 by JR, post-handoff). All branded-shell + onboarding-static-block code paths active.
- Pre-launch recipient gate (`Code.gs`):
  - `LAUNCH_LIVE_ = false` -> `sendOnboardingEmail` rewrites recipient to `LAUNCH_REWRITE_TO_ = johnrichmond007@gmail.com`. Welcome path is gated.
  - **No rewrite gate on time-off / shift-offer / shift-swap paths.** Those emails go directly to whatever address the workflow targets. Fixture choice is what controls visibility.
- Test fixtures (resting state: all Inactive + Staff per `reference_smoke_logins.md`):
  - **Test Employee1** (`john@johnrichmond.ca` / `TestE`) -- emails sent here reach JR directly.
  - **Test Employee2** (`johnrichmond007+onboarding-smoke@gmail.com` / `TestE2`) -- plus-address; does NOT reach JR's primary inbox without the `LAUNCH_REWRITE_TO_` rewrite. Use ONLY for paths that go through the rewrite (welcome).
  - **Test Admin** (`johnrichmond007+testadmin@gmail.com` / `TestA`) -- plus-address; same caveat.
- Sarvi's address `sarvi@rainbowjeans.com` (= `CONFIG.ADMIN_EMAIL`) receives admin-facing emails. JR will ask Sarvi to forward the admin-side captures.
- Working window: **Aug 3-9 / Aug 10-16 2026** -- well outside Sarvi's typical period view, per s071 fixture guidance.

---

## In-scope email flows (6)

Each flow names: who triggers, who receives, how JR sees it, what to capture.

### 1. Welcome / onboarding (`sendOnboardingEmail`)

- **Trigger:** Login as JR (owner). Edit Test Employee2 -> click Sent button (top-right of Edit Employee modal, opens Send Onboarding Email modal) -> Send.
- **Recipient:** `johnrichmond007+onboarding-smoke@gmail.com` rewritten to `johnrichmond007@gmail.com` by `LAUNCH_LIVE_=false` gate.
- **JR sees how:** Direct (rewritten to primary inbox).
- **Capture:** Confirm v2.33.2 branded shell renders -- navy header with **NEW EMPLOYEE WELCOME** eyebrow, **Hi Test,** greeting row, admin's typed body (or empty if blank), accent-bordered **GET STARTED** card containing sign-in URL + default-password format + first-login note. Also: Welcome PDF attachment retains the v2.33.0 paragraph at the top (unchanged this round).

### 2. Schedule distribution (`sendBrandedScheduleEmail`)

- **Trigger:** With Test Employee1 reactivated and 3 shifts on T1 in Aug 3-9 2026, open the Email Schedule UI (admin tools) -> filter to T1 -> Send.
- **Recipient:** `john@johnrichmond.ca`.
- **JR sees how:** Direct.
- **Capture:** Frontend-built branded HTML (`src/email/buildBrandedHtml.js`) -- this is the gold-standard visual JR pointed at. Navy header with period label eyebrow, **Hi Test,** greeting row, schedule table rows, admin contacts row, policy disclaimer block, footer.

### 3. Time-off submitted (`submitTimeOffRequest` -> `sendTimeOffSubmittedEmail`)

- **Trigger:** Logout JR, login as Test Employee1 (`TestE`). Open Shift Changes -> Days Off -> submit a request for 1-2 dates in Aug 2026.
- **Recipient:** Sarvi (`CONFIG.ADMIN_EMAIL` = `sarvi@rainbowjeans.com`).
- **JR sees how:** Sarvi forwards to JR (per JR's plan: "I'll ask sarvi to forward me the request stuff").
- **Capture:** `BRANDED_EMAIL_WRAPPER_HTML_` shell with `askType="Time-off request"` eyebrow inside the body, `ctaText="Open in App"` + `ctaUrl=APP_URL_` button.

### 4. Time-off approved (`approveTimeOffRequest` -> `sendTimeOffApprovedEmail`)

- **Trigger:** Logout T1, login as JR. Open My Requests / Shift Changes admin queue -> approve T1's request.
- **Recipient:** `john@johnrichmond.ca` (T1's email).
- **JR sees how:** Direct.
- **Capture:** Branded shell with NO `askType` eyebrow (employee-facing approvals don't carry the askType label per existing pattern). Body lists dates + admin name.

### 5. Time-off denied (`denyTimeOffRequest` -> `sendTimeOffDeniedEmail`)

- **Trigger:** As T1, submit a SECOND time-off request for different Aug dates. Logout to JR, deny it.
- **Recipient:** T1.
- **JR sees how:** Direct.
- **Capture:** Branded shell, body cites dates + reason (admin's typed denial note).

### 6. Time-off revoked (`revokeTimeOffRequest` -> `sendTimeOffRevokedEmail`)

- **Trigger:** As T1, submit a THIRD time-off request. Logout to JR, approve it. Then revoke the approval.
- **Recipient:** T1.
- **JR sees how:** Direct.
- **Capture:** Branded shell, body cites dates + revocation reason.

---

## Out-of-scope (skip without explicit opt-in)

### Shift offers + shift swaps (~14 email variants)

All 14 variants involve TWO employees (offerer + recipient, or initiator + partner). The recipient/partner side has to be a fixture that JR can read -- which means either Test Employee1 (the only fixture whose email reaches JR directly) OR a plus-addressed fixture (which doesn't reach JR's primary inbox without the `LAUNCH_REWRITE_TO_` rewrite, and these paths have NO rewrite gate).

If JR uses T1 as BOTH parties he can't because the system blocks self-offers / self-swaps (`SELF_REQUEST` error in `submitShiftOffer` + `submitSwapRequest`). And it requires both fixtures to have shifts on different dates so a swap is valid.

**Workaround (opt-in):** Temporarily change a second fixture's email to `john@johnrichmond.ca` (collision check would block; admin would have to first delete or rename the existing T1's email). Or stand up a separate JR-routed alias on a fresh email account. Either way: scope creep beyond the 6 in-scope flows.

If JR wants the 14 variants captured, surface this as a separate task; not s073 scope.

### Schedule change notification (`sendScheduleChangeNotification_`)

Triggered on `saveShift` / `batchSaveShifts` when caller is an admin who is NOT Sarvi and NOT the Owner. Owner (JR) is explicitly skipped, so JR's own schedule edits don't fire it.

To capture: promote Test Admin to admin1 -> log in as Test Admin -> edit a shift -> demote Test Admin back -> deactivate. 5+ extra steps beyond the in-scope flows. Not s073 scope unless JR opts in.

---

## Cleanup at end of smoke

Mandatory before declaring done:

1. **Delete shifts:** Use `saveShift` with `deleted: true` to hard-delete each shift created on T1 in Aug 2026. The handler calls `sheet.deleteRow()` directly. From the UI: open the Edit Shift modal on each cell -> Delete. From a direct API call (bypass UI): `apiCall('saveShift', { token, shift: { ...existingShift, deleted: true } })`.
2. **Cancel pending requests:** For each time-off request still in `pending` status, log in as the requester (T1) and cancel via the Mine view / Shift Changes UI. Approved requests: revoke from admin side. Denied requests: terminal state, no action needed.
3. **Deactivate fixtures:** Set Test Employee1 + Test Employee2 back to Inactive. Test Admin already Inactive at smoke start.
4. **Verify counts:** Active 35 / Inactive 5 / Archive 2 (the s071-locked baseline).

**Note for JR:** Time-off request rows persist in `SHIFT_CHANGES` sheet as historical records (status = `cancelled` / `denied` / `revoked`). The schema has no hard-delete from the UI. If you want them purged, that's a separate one-shot Apps Script function (scope creep -- ask if you want it).

---

## Recipient routing reference

| Email function | Sent to | Shell | askType eyebrow |
|---|---|---|---|
| `sendOnboardingEmail` | recipient (rewritten to JR) | `BRANDED_EMAIL_WRAPPER_HTML_` v2.33.2 (NEW EMPLOYEE WELCOME header eyebrow + greeting + Get Started card) | none |
| `sendBrandedScheduleEmail` | recipient | frontend `buildBrandedHtml.js` (period label eyebrow + greeting + schedule table) | n/a |
| `sendTimeOffSubmittedEmail` | `CONFIG.ADMIN_EMAIL` (Sarvi) | `BRANDED_EMAIL_WRAPPER_HTML_` | "Time-off request" |
| `sendTimeOffApprovedEmail` | employee | `BRANDED_EMAIL_WRAPPER_HTML_` | none |
| `sendTimeOffDeniedEmail` | employee | `BRANDED_EMAIL_WRAPPER_HTML_` | none |
| `sendTimeOffCancelledEmail` | `CONFIG.ADMIN_EMAIL` (Sarvi) | `BRANDED_EMAIL_WRAPPER_HTML_` | "Time-off cancelled" |
| `sendTimeOffRevokedEmail` | employee | `BRANDED_EMAIL_WRAPPER_HTML_` | none |
| `sendScheduleChangeNotification_` | `CONFIG.ADMIN_EMAIL` (Sarvi) | `BRANDED_EMAIL_WRAPPER_HTML_` | "Schedule change" |
| (~14 shift-offer/swap variants) | mix | `BRANDED_EMAIL_WRAPPER_HTML_` | various ("Shift transfer -- needs approval", "Shift swap -- needs approval", others) |

---

## Estimated session time

~30-40 minutes of agent-browser work. Five logout/login cycles, three time-off submissions, three admin actions on those requests, one schedule batch save, one onboarding send.
