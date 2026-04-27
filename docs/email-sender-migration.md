# Email Sender Migration -- Personal Gmail -> otr.scheduler@gmail.com

Drafted 2026-04-27 (s028) for execution next session. New OTR-dedicated Gmail: **`otr.scheduler@gmail.com`**.

## TL;DR

The sender of all `MailApp.sendEmail` calls in `backend/Code.gs` is whichever Google account owns / deployed the Apps Script project -- not a value in code. Today that account is JR's personal Gmail. To swap senders, transfer the Apps Script project (and the bound Sheet) to `otr.scheduler@gmail.com` and re-deploy the Web App as that account; then update one URL constant in the frontend.

There is no string to find-and-replace in `backend/Code.gs` for the sender. The only literal `johnrichmond007@gmail.com` in the file is at [Code.gs:2280](../backend/Code.gs#L2280) -- it's seed data for the `emp-owner` employee row, NOT a sender. Leave it alone unless JR wants the Owner row's email updated separately.

## What sends mail today

- All outbound mail funnels through `sendEmail(to, subject, body)` at [backend/Code.gs:2059](../backend/Code.gs#L2059):
  ```javascript
  MailApp.sendEmail({ to, subject, body, name: 'OTR Scheduling' });
  ```
- No `from:` parameter. Apps Script `MailApp` always sends from the script-owning account.
- `name: 'OTR Scheduling'` only sets the display name; the underlying address is the script owner.
- 22 call sites under `// EMAIL NOTIFICATIONS` (line 2055+) cover: time-off submit/approve/deny/revoke/cancel, offer submit/accept/decline/cancel, swap initiate/accept/decline/cancel, schedule-change admin notification.
- `CONFIG.ADMIN_EMAIL = 'sarvi@rainbowjeans.com'` at [Code.gs:197](../backend/Code.gs#L197) is the recipient for admin notifications, not a sender. Unchanged.

## Path A (recommended) -- Re-own the Apps Script + Sheet under the new Gmail

Cleanest, no code change to mail logic. Costs: one-time deployment URL change + everyone re-grants OAuth on first call.

### Steps (do in this order)

1. **Move the bound Sheet to `otr.scheduler@gmail.com` Drive.** Either Drive-share with full access then transfer ownership, or download + re-upload as the new account. JR's stated plan is the migration path here.
2. **Open the bound Apps Script project** (Extensions -> Apps Script from the Sheet, OR script.google.com directly). The script is bound to the Sheet so it follows.
3. **Confirm ownership transferred** -- File -> Project properties -> "Info" tab should show `otr.scheduler@gmail.com` as owner. If not, Share -> transfer ownership explicitly.
4. **Re-deploy as Web App from the new account.** Deploy -> New deployment -> Web app:
   - Execute as: **Me** (`otr.scheduler@gmail.com`) -- this is the lever that switches the sender.
   - Who has access: **Anyone** (matches current).
   - Click Deploy. Authorize all scopes when prompted (Sheets, Gmail, Drive).
   - Copy the new `/exec` URL.
5. **Update frontend `API_URL`** in [src/utils/api.js:6](../src/utils/api.js#L6) to the new `/exec` URL.
6. **Build + push** -- `npm run build` then `git push origin main` (hook-gated; needs JR's per-session "push yes").
7. **Smoke-send a test schedule** -- use admin account on prod to publish a small period; confirm a real test email lands in JR's personal inbox **from `otr.scheduler@gmail.com`** (not from the personal Gmail).
8. **Verify quota reset** -- new account starts at 100 emails/day fresh quota. Sarvi's typical Friday publish blast (35 staff) fits comfortably.

### Risks + watch-outs

- **Deployment URL changes.** Every staff member's saved bookmark / installed PWA will hit the OLD `/exec` URL until they reload the new bundle. Bundle change in step 6 forces them onto the new URL on next visit; the OLD URL still resolves but reads/writes go to JR's personal-account-owned script. Plan: don't delete the old deployment for ~7 days; let staff cycle through.
- **OAuth re-grant.** First time any user triggers a backend call, the `Authorization required` flow may re-prompt. Apps Script Web Apps deployed "Execute as: Me" do NOT prompt end users -- only the deploying account authorizes. Should be invisible to staff.
- **Triggers.** Any time-driven triggers on the script need to be re-installed under the new owner -- `Triggers` view in Apps Script editor; recreate any that show "Owner: <old>".
- **Bound vs standalone.** If the Apps Script is *standalone* (not bound to the Sheet), Sheet ownership transfer alone won't move it -- need to transfer the script project separately.

## Path B (fallback) -- GmailApp with "Send mail as" alias

Use only if Path A blocked (e.g. deployment URL change is unacceptable mid-week). One-line code change; keeps current deployment URL.

### Steps

1. On the current owning Google account (JR's personal), open Gmail -> Settings -> Accounts and Import -> "Send mail as" -> Add another email address.
2. Add `otr.scheduler@gmail.com`. Google sends a verification code to that mailbox; paste it back. Treats it as a verified alias.
3. Edit `sendEmail` in [backend/Code.gs:2059](../backend/Code.gs#L2059):
   ```javascript
   function sendEmail(to, subject, body) {
     try {
       GmailApp.sendEmail(to, subject, body, {
         from: 'otr.scheduler@gmail.com',
         name: 'OTR Scheduling'
       });
       Logger.log(`Email sent to ${to}: ${subject}`);
       return { success: true };
     } catch (error) {
       Logger.log(`Failed to send email to ${to}: ${error.toString()}`);
       return { success: false, error: error.toString() };
     }
   }
   ```
4. **Re-authorize Gmail scope.** `MailApp` and `GmailApp` use different OAuth scopes. Open the Apps Script editor, run any function once to trigger the auth prompt, accept the broader Gmail scope.
5. Deploy a new version of the Web App (manage deployments -> edit -> new version). Same `/exec` URL preserved.
6. Smoke-send to verify `From:` header reads `otr.scheduler@gmail.com`.

### Risks + watch-outs

- **Quota stays the same** -- 100 emails/day on the underlying owning account, regardless of `from:` alias.
- **`GmailApp` daily quota counts against the alias-owning account, not the alias.** No multiplier benefit.
- **Spam-filter risk** -- some receiving servers downgrade trust on alias-sent mail. Worth one Gmail + one non-Gmail test (e.g. a `@rainbowjeans.com` recipient) to verify deliverability.
- **Reverts on alias removal** -- if the alias gets removed from the owning account, `GmailApp.sendEmail({from})` throws. Path A has no such failure mode.

## Verification checklist (either path)

- [ ] Test recipient gets the email (subject + body intact).
- [ ] Email's `From:` header reads `OTR Scheduling <otr.scheduler@gmail.com>` (open in Gmail -> Show original).
- [ ] Reply-to lands in `otr.scheduler@gmail.com` inbox, not JR's personal.
- [ ] PDF attachment (when added under the long-blocked Email upgrade item) still attaches.
- [ ] No `Logger.log` errors in Apps Script execution log.
- [ ] On Path A: new bundle hash visible at `https://rainbow-scheduling.vercel.app` view-source after `git push`.

## Open question for JR

PDF auto-attached via MailApp is the long-blocked Email upgrade item (since 2026-02-10). Once sender migration is verified, that work should slot next. It needs `MailApp.sendEmail({attachments: [...]})` (or `GmailApp` equivalent for Path B) plus a path to generate the PDF on the Apps Script side -- or accept it from the frontend as a base64 blob. Decide approach before scoping.
