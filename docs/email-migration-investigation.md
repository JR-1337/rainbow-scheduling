# Email Migration Investigation -- 2026-04-27

**Status:** UNRESOLVED. Frontend swap complete and live (`8b64f4e`), but emails still send from `johnrichmond007@gmail.com` instead of `otr.scheduler@gmail.com`. 4 investigation loops run; 2 fully, 2 partially before pause.

## Symptom

After completing all of Parts 1-5 of `docs/email-migration-walkthrough.md`:
- Sheet ownership = `otr.scheduler@gmail.com` (verified in Drive file details).
- Apps Script project ownership = `otr.scheduler@gmail.com` (verified in dashboard owner column showing "Over the Rainbow").
- Web App deployment exists at `https://script.google.com/macros/s/AKfycbznGQ-pC1r48r1VDscs7Oqs0_jMZN3X3eB7h_L9ZsIXS8sYNSLEj0lUK8s1PtG5So5XoA/exec`.
- Deployment "Execute as" panel shows `Me (otr.scheduler@gmail.com)`.
- `src/utils/api.js:6` updated to new URL, built, pushed at `8b64f4e`. Vercel deployed `index-C7ld0zvI.js` confirmed live, confirmed contains the new `/exec` URL.

Email triggered at 2:05 PM (well after bundle landed at 1:45 PM) -- `From:` header still reads `johnrichmond007@gmail.com`.

## Loops run

### Loop 1 -- Code-level sender determination -- NULL

Findings:
- `backend/` contains only `Code.gs` (1 file).
- Single `sendEmail` function at `backend/Code.gs:2059`:
  ```javascript
  function sendEmail(to, subject, body) {
    try {
      MailApp.sendEmail({ to, subject, body, name: 'OTR Scheduling' });
      ...
  ```
- No `from:` parameter. No `getActiveUser`. No `getEffectiveUser`. No alias config. No conditional sender selection.
- The `name:` parameter is documented as display-name only; cannot affect address.
- The literal `"From: ..."` at `Code.gs:2134` is body text in an email message, not a header field.
- No `appsscript.json` manifest in repo. The deployed script may have one on Google's side but manifests cannot override sender identity per Google's spec.

Verdict: **The code in this repo cannot produce a sender other than the executing account.** JR confirmed deployed code matches repo (paste of `sendEmail` + `sendScheduleChangeNotification_` matches verbatim).

### Loop 2 -- Apps Script execution model -- PARTIAL FINDING

Sources:
- [Apps Script Web Apps docs](https://developers.google.com/apps-script/guides/web)
- [Apps Script Deployment docs](https://developers.google.com/apps-script/concepts/deployments)
- [Container-bound Scripts](https://developers.google.com/apps-script/guides/bound)

Findings:
- "Execute as Me" runs as "the owner of the script, no matter who accesses the web app."
- BUT the docs are explicitly silent on which "owner" applies when ownership has transferred -- the original deployer or the current script project owner.
- Documented hard rule: **"You cannot transfer ownership of versioned deployments. If you transfer ownership of a script project, the owner of the existing versioned deployments doesn't change."**
- Logical inference: "Execute as Me" of a deployment created by John, when the script later transfers to otr.scheduler, still resolves to John -- because the deployment's identity didn't transfer.

Verdict: **Strong evidence the deployment's `Execute as` is bound to original deployer, not to the current script owner.** The UI shows "Me (otr.scheduler@gmail.com)" because that's what otr would see if otr were the deployer; but if the deployment row was originally created by John (or the OAuth grant during JR's "new deployment" attempt fell back on John's existing scope grants when the auth popup errored), the actual execution identity remains John.

### Loop 3 -- OAuth/session state + UI lying -- CONFIRMS LOOP 2

Sources: [Apps Script Web Apps docs](https://developers.google.com/apps-script/guides/web), authorization for services.

Findings:
- "Execute as Me" semantics are NOT viewer-contextual. The setting says "the script always executes as you, the owner of the script" -- but in deployment context, "you" resolves to **the user that deployed the version**, not the current script-project owner.
- Direct quote: "When a web app in a shared drive is deployed, choosing to 'execute as you' causes the web app to execute under the authority of the user that deployed it (since there is no script owner)." Same logic applies post-ownership-transfer: the deployer's identity is what runs.
- The "Manage deployments" panel showing `Me (otr.scheduler@gmail.com)` to the otr-viewer is a viewer-contextual label, not the actual binding.
- Diagnostic: open Manage deployments as John's personal Gmail. If the same deployment row shows `Me (johnrichmond007@gmail.com)`, panel is viewer-contextual and doesn't tell you which identity actually executes.

Verdict: **Confirms Loop 2.** Existing deployment runs as John regardless of what the panel shows otr.

### Loop 4 -- External Gmail / alias rewriting -- NULL

Sources: Google Workspace DKIM/DMARC docs, MailApp vs GmailApp comparisons.

Findings:
- Gmail's "Send mail as" alias only rewrites OUTBOUND mail FROM the alias-owning account using the alias address. Cannot rewrite an outbound email from one Gmail account to appear as another.
- No documented Gmail forwarding rule or Workspace policy can rewrite the `From:` header of mail sent via Apps Script `MailApp`.
- DKIM `d=gmail.com` for both `johnrichmond007@gmail.com` and `otr.scheduler@gmail.com` -- DKIM signing-domain alone cannot distinguish the two. Useless for diagnosis here.
- However: **`Return-Path:` and `Received: from`** headers DO identify which Gmail mailbox actually processed the outbound. Diagnostic worth running -- if `Return-Path:` reads `johnrichmond007@gmail.com`, that's authoritative confirmation that John's account processed the send.

Verdict: **NULL.** No external rewriting mechanism could explain the symptom. The `Return-Path:` check would be a confirming diagnostic, not a separate cause.

## Working hypothesis

The deployment with URL `AKfycbznGQ...` is bound to John's identity for execution purposes, despite the Apps Script panel showing "Me (otr.scheduler@gmail.com)" to the otr-viewer. This is consistent with [Google's documented behavior](https://developers.google.com/apps-script/concepts/deployments) that versioned deployments don't transfer when script ownership transfers.

When JR did "Manage deployments -> edit -> new version" earlier, that bumped the version on John's deployment but didn't switch its identity. When JR did "Deploy -> New deployment" earlier with an auth popup that errored, the new deployment may have inherited John's existing OAuth grants on the script (because the popup's authorization step failed, fell back to the script's already-granted scopes -- John's).

## Recommended fix path (try first thing next session)

### Path A: True fresh deployment with explicit re-auth

Order matters. In incognito, signed in **only** as `otr.scheduler@gmail.com`:

1. Open Apps Script editor for the Rainbow project.
2. **Manage deployments** -> **Archive** the existing `AKfycbznGQ...` deployment.
3. In the editor's code area, select function `sendEmail` (or any function) from the dropdown.
4. Click the **Run** button (▶).
5. **Auth popup must appear here.** This is the missing step. Click through:
   - Choose `otr.scheduler@gmail.com`.
   - Advanced -> Go to (unsafe) -> Allow ALL scopes (Gmail, Sheets, Drive).
6. Function may fail (no args) -- that's fine, what mattered was the OAuth grant being attached to otr.
7. Now **Deploy -> New deployment** -> gear -> Web app -> Execute as Me -> Anyone -> Deploy.
8. Copy the new `/exec` URL (will be different from current).
9. Update `src/utils/api.js:6` -> build -> push.
10. Trigger a fresh email -> Show original -> verify `From:` reads `otr.scheduler@gmail.com`.

### Path B: Fall back to GmailApp + alias

If Path A also fails, switch the implementation per `docs/email-migration-walkthrough.md` original Path B (in the technical migration doc): change `MailApp.sendEmail({...})` to `GmailApp.sendEmail(to, subject, body, { from: 'otr.scheduler@gmail.com', name: 'OTR Scheduling' })`. This requires `otr.scheduler@gmail.com` to be set up as a verified "Send mail as" alias on whichever account owns the deployment. One-line code change in `Code.gs`, push to Apps Script.

### Diagnostic checks to run before either path

1. **DKIM / Return-Path check**: open one of the failing test emails -> three-dot menu -> Show original. Read me:
   - `Return-Path:` value
   - `DKIM-Signature: d=` value
   - `From:` value
   If `d=` differs from `From:`, that's a third interpretation.
2. **Cross-account panel check**: open Manage deployments **as John's personal Gmail**. Look at the same deployment row's "Execute as" field. If it shows "Me (johnrichmond007@gmail.com)" while otr's view showed "Me (otr.scheduler@gmail.com)" -- panel is viewer-contextual, doesn't tell us actual execution identity.
3. **Quota check**: in Apps Script editor as otr, run a dummy script that calls `MailApp.getRemainingDailyQuota()`. If it returns the expected fresh-account quota (~100), otr's quota IS being consumed -- inconsistent with the John-sender hypothesis. If it returns John's depleted-or-cached quota, that confirms John's identity is in play.

## What was already done this session

- `8b64f4e` -- swapped `src/utils/api.js:6` to new URL. Frontend confirmed pointing at new URL on prod.
- `docs/email-migration-walkthrough.md` -- non-technical step-by-step (Parts 1-7). Used during this session.
- `docs/email-migration-investigation.md` -- this file.

## Reverting

To revert, change `src/utils/api.js:6` back to:
```
const API_URL = 'https://script.google.com/macros/s/AKfycbxSDWA1uOnemfu2N33y3za7a2hreJIUddgCgQi4X32ObbWKeXHyQms7wxy2NyGw7gWbXA/exec';
```
That URL is the original John-deployed deployment; should still work. Build + push. Sender behavior returns to pre-migration baseline (John).
