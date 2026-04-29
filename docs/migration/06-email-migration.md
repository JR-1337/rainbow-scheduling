# Email Migration Plan -- MailApp -> Third-Party Vendor

**Last refreshed: 2026-04-29**

Scope: research-only. No code change. Replaces all `MailApp.sendEmail` callsites in `backend/Code.gs` with a transactional email vendor when the Apps Script -> Supabase migration runs.

Source-class legend:
- **C** = codebase (path:line)
- **VD** = vendor docs (URL)
- **VM** = vendor marketing (URL, flagged)
- **IM** = independent measurement / third-party publication

---

## 1. Current Email Surface (factual)

### 1.1 Sender identity

- `MailApp.sendEmail` runs as the executing Apps Script account, which per the Memory index is **otr.scheduler@gmail.com** (the Drive owner of both the bound Sheet and the script). [C: `~/.claude/projects/.../memory/reference_apps_script_topology.md`; runtime fact]
- Display name override on every send: `name: 'OTR Scheduling'`. [C: backend/Code.gs:2128, 2159]
- The actual envelope sender on recipients' inboxes is therefore `otr.scheduler@gmail.com` regardless of the friendly `name`. There is no `replyTo` set in any sendEmail call. [C: backend/Code.gs:2128, 2159 -- `mailParams` has no replyTo key]
- `CONFIG.ADMIN_EMAIL = 'sarvi@rainbowjeans.com'` is the recipient for admin-notification mails (not the sender). [C: backend/Code.gs:197]

### 1.2 MailApp daily quota (today)

- Consumer Gmail accounts: **100 recipients/day**. Workspace accounts: **1,500 recipients/day**. [VD: https://developers.google.com/apps-script/guides/services/quotas]
- `otr.scheduler@gmail.com` -- name suggests consumer Gmail, not Workspace; if so the script is on the **100/day** ceiling. **Flag for verification: confirm whether otr.scheduler@gmail.com is Workspace or consumer.**
- Quota is per recipient address, not per send call. A single `sendEmail` to two recipients counts as 2.

### 1.3 Branding (currently embedded in HTML wrapper)

- Wrapper function `BRANDED_EMAIL_WRAPPER_HTML_(content, accentHex)`. [C: backend/Code.gs:2095-2123]
- Brand colors hardcoded:
  - `OTR_NAVY_ = '#0D0E22'` (header background) [C: backend/Code.gs:2091]
  - `OTR_WHITE_ = '#FDFEFC'` (page background) [C: backend/Code.gs:2092]
  - `OTR_ACCENT_DEFAULT_ = '#0453A3'` (accent / top border) [C: backend/Code.gs:2093]
- Footer text: `Over the Rainbow • <a href="https://www.rainbowjeans.com">www.rainbowjeans.com</a>` plus `This is an automated message from the OTR Scheduling App.` [C: backend/Code.gs:2118-2119]
- Header: text-only `RAINBOW` wordmark + `OTR Scheduling` subtitle. **No logo image** is referenced in the wrapper. [C: backend/Code.gs:2110-2113]
- Wrapper is plaintext-in -> HTML-out. Caller passes a plain string body; wrapper escapes `&`, `<`, `>`, converts `\n` to `<br>`, then injects into a `<table>`-based 600px max-width layout. [C: backend/Code.gs:2099-2122]
- A **frontend-built** branded HTML pipeline also exists at `src/email/buildBrandedHtml.js` (used by EmailModal -> `sendBrandedScheduleEmail`). It is the only path that ships HTML-not-just-wrapped-plaintext. [C: src/email/buildBrandedHtml.js (10.3K); src/email/build.js:1-83]

### 1.4 Email types in production today

| # | Function | Trigger | To | Subject template | Body class | Code |
|---|----------|---------|----|------------------|------------|------|
| 1 | sendBrandedScheduleEmail | Admin clicks Send in EmailModal | Per-employee from EmailModal payload | Caller-supplied | Frontend-built HTML (full schedule) | C: 2144-2166 |
| 2 | sendScheduleChangeNotification_ | saveShift / batchSaveShifts by non-Sarvi non-Owner admin | CONFIG.ADMIN_EMAIL (sarvi@rainbowjeans.com) | `Schedule edited by ${callerName}` | Plaintext + wrapper | C: 2170-2182, 1670, 1897 |
| 3 | sendTimeOffSubmittedEmail | submitTimeOffRequest | CONFIG.ADMIN_EMAIL | `${employeeName} requested time off: ${range}` | Plaintext + wrapper | C: 2186-2192, 867 |
| 4 | sendTimeOffApprovedEmail | approveTimeOffRequest | employeeEmail | `Time Off Approved - ${range}` | Plaintext + wrapper | C: 2194-2200, 924 |
| 5 | sendTimeOffDeniedEmail | denyTimeOffRequest | employeeEmail | `Time Off Request Denied - ${range}` | Plaintext + wrapper | C: 2202-2208, 950 |
| 6 | sendTimeOffCancelledEmail | (defined; **not invoked** -- see flag) | CONFIG.ADMIN_EMAIL | `${employeeName} cancelled their time off request` | Plaintext + wrapper | C: 2210-2216 |
| 7 | sendTimeOffRevokedEmail | revokeTimeOffRequest | employeeEmail | `Time Off Revoked - ${range}` | Plaintext + wrapper | C: 2218-2224, 981 |
| 8 | sendOfferSubmittedEmail | submitShiftOffer | recipientEmail | `${offerer} wants to give you their shift on ${date}` | Plaintext + wrapper | C: 2228-2234, 1047 |
| 9 | sendOfferAcceptedEmail | acceptShiftOffer | CONFIG.ADMIN_EMAIL | `${recipient} accepted shift from ${offerer} - needs your approval` | Plaintext + wrapper | C: 2236-2242, 1073 |
| 10 | sendOfferDeclinedEmail | declineShiftOffer | offererEmail | `${recipient} declined your shift offer` | Plaintext + wrapper | C: 2244-2250, 1099 |
| 11 | sendOfferCancelledEmail | cancelShiftOffer | recipientEmail | `${offerer} cancelled their shift offer` | Plaintext + wrapper | C: 2252-2258, 1131 |
| 12 | sendOfferApprovedEmail | approveShiftOffer | offererEmail AND recipientEmail (2 sends) | `Shift transfer approved - ${date}` | Plaintext + wrapper | C: 2260-2265, 1171 |
| 13 | sendOfferRejectedEmail | rejectShiftOffer | offererEmail AND recipientEmail (2 sends) | `Shift transfer rejected` | Plaintext + wrapper | C: 2267-2272, 1197 |
| 14 | sendOfferRevokedEmail | revokeShiftOffer | offererEmail AND recipientEmail (2 sends) | `Shift transfer revoked` | Plaintext + wrapper | C: 2274-2279, 1240 |
| 15 | sendSwapSubmittedEmail | submitSwapRequest | partnerEmail | `${initiator} wants to swap shifts with you` | Plaintext + wrapper | C: 2283-2289, 1305 |
| 16 | sendSwapAcceptedEmail | acceptSwapRequest | CONFIG.ADMIN_EMAIL | `${partner} accepted swap from ${initiator} - needs your approval` | Plaintext + wrapper | C: 2291-2297, 1331 |
| 17 | sendSwapDeclinedEmail | declineSwapRequest | initiatorEmail | `${partner} declined your swap request` | Plaintext + wrapper | C: 2299-2305, 1357 |
| 18 | sendSwapCancelledEmail | cancelSwapRequest | partnerEmail | `${initiator} cancelled their swap request` | Plaintext + wrapper | C: 2307-2313, 1388 |
| 19 | sendSwapApprovedEmail | approveSwapRequest | initiatorEmail AND partnerEmail (2 sends) | `Shift swap approved` | Plaintext + wrapper | C: 2315-2320, 1429 |
| 20 | sendSwapRejectedEmail | rejectSwapRequest | initiatorEmail AND partnerEmail (2 sends) | `Shift swap rejected` | Plaintext + wrapper | C: 2322-2327, 1455 |
| 21 | sendSwapRevokedEmail | revokeSwapRequest | initiatorEmail AND partnerEmail (2 sends) | `Shift swap revoked` | Plaintext + wrapper | C: 2329-2334, 1500 |

**Helpers** (counted in inventory 03 as part of the 24-function class but not actual senders): `sendEmail` wrapper [C: 2125-2139], `BRANDED_EMAIL_WRAPPER_HTML_` [C: 2095-2123], `formatDateDisplay` [C: 795-798], `formatDateRange` [C: 800-811], `formatTimeDisplay` [C: 813-819] -- these are template helpers, not new email surfaces. 21 distinct trigger -> email mappings + 3 helpers + the wrapper = 24, matching the inventory count.

**Cc / Bcc:** No `cc` or `bcc` keys are set on any `MailApp.sendEmail` call. [C: backend/Code.gs:2125-2334 -- grep for `cc:` and `bcc:` returns zero hits inside email functions]

### 1.5 Attachments

No attachments are sent today. Schedules are rendered as branded HTML inline (sendBrandedScheduleEmail), not attached. PDF generation is in the frontend (`buildBrandedHtml.js` -> printable HTML opened in a new tab, per Lessons:91-93) and is **never** sent through MailApp. [C: backend/Code.gs grep for `attachments:` -> zero hits]

### 1.6 Volume estimate (OTR scale, observed)

Conservative arithmetic based on the 21 trigger points and OTR's 35 staff:

- Schedule publish (sendBrandedScheduleEmail): 35 emails per pay period; biweekly publish cadence -> ~70/month.
- Schedule-edit notifications to Sarvi: ~5-10/month (admin saves outside of bulk publish).
- Time-off submit + approve/deny: ~10 round trips/month -> ~20 emails.
- Shift offers (submit + accept + approve): est. 5 round trips/month -> ~20 emails (approve sends 2).
- Shift swaps: est. 2 round trips/month -> ~10 emails.
- **Floor: ~125/month. Peak (week of holiday schedule + heavy swap activity): ~200/month.**

**Flag: this is an estimate. Actual volume should be measured from `MailApp.getRemainingDailyQuota()` logs over a 30-day window before pricing is committed.**

### 1.7 The auth-gate bug in sendBrandedScheduleEmail

`verifyAuth` returns `{authorized: bool, employee, error?}` (the canonical contract used by every other admin-gated function). [C: backend/Code.gs:451-482 -- function literally returns `{authorized: false, ...}` and `{authorized: true, ...}`]

But `sendBrandedScheduleEmail` checks `authResult.success` and reads `authResult.data`:

```
function sendBrandedScheduleEmail(payload) {
  var authResult = verifyAuth(payload);
  if (!authResult.success) return authResult;     // <-- always falsy, returns the verifyAuth shape
  var caller = authResult.data;                    // <-- always undefined
  if (!caller || !caller.isAdmin) {
    return { success: false, error: { code: 'FORBIDDEN', ... } };
  }
  ...
}
```
[C: backend/Code.gs:2144-2150]

Behavior: `authResult.success` is `undefined` -> the `if (!authResult.success)` branch fires for every call -> the function returns the raw verifyAuth result (`{authorized: true, employee: ...}` for legitimate admins, `{authorized: false, error: ...}` for non-admins) **without ever sending the email**. Inventory 03's flag #2 is correct: this endpoint is currently broken and silently no-ops on every invocation. EmailModal callers (frontend `EmailModal.jsx:56, 94`) receive a non-error response that lacks `success: true`, so the UI may or may not show success depending on its own truthiness check. [C: docs/migration/03-appscript-inventory.md:725-727]

**Implication for migration:** the replacement Edge Function must use `verifyAuth`'s real `{authorized, employee}` shape, not the bogus `{success, data}` shape. This bug is the reason JR may not have noticed real failures -- nobody is exercising the admin-side schedule-publish path through EmailModal in production.

---

## 2. Vendor Comparison Matrix

Volumes assumed: 200 emails/month peak (section 1.6). All free tiers cover OTR comfortably; paid tiers matter only for Phase 2 multi-tenant (10x-50x).

| Vendor | Free tier | Lowest paid tier | Attachment limit | Region options | SDKs | SOC2 / GDPR / Canada |
|--------|-----------|------------------|------------------|----------------|------|---------------------|
| **Resend** | 3,000/mo, **100/day cap** | Pro $20/mo for 50,000/mo | 40 MB after base64 | us-east-1, us-west-2, eu-west-1 (Ireland), sa-east-1, ap-northeast-1; account data always in US | Node, PHP, Python, Ruby, Go, Rust, Java, .NET; **npm:resend works in Deno on Supabase Edge Functions** | SOC 2 Type II; GDPR via SCCs (account data US-only); no Canadian residency option |
| **SendGrid (Twilio)** | **60-day trial only**, 100/day during trial; no permanent free tier as of 2025 | Essentials $19.95/mo for 100,000/mo | 30 MB total message size | EU subuser available on Pro tier+; subuser feature gated to Pro on consolidation | Node, Python, PHP, Ruby, Java, Go, C#; works in Deno via npm: specifier (no native Deno SDK) | SOC 2 Type II; ISO 27001; GDPR; no Canadian residency |
| **AWS SES** | 3,000 messages/mo first 12 months for new AWS accounts (then $0.10/1000) | $0.10 per 1,000 emails + $0.12/GB attachments; ~$0.02/mo at OTR scale | 40 MB (v2/SMTP), 10 MB (v1) | **ca-central-1 (Canada Central) and ca-west-1 (Calgary) both available**, plus eu-west-1, us-east-1, etc. | AWS SDK v3 for Node; Deno-compatible via npm: specifier; signing complexity higher | SOC 2 Type II via AWS; GDPR; PIPEDA-aligned via Canadian region |
| **Postmark (ActiveCampaign)** | 100/mo (testing only) | Basic $15/mo for 10,000/mo | 50 MB batch payload incl. attachments; per-message limit not published | **US-only**; no EU / Canadian region; data stored at Deft datacenter outside Chicago + AWS | Node, Ruby, Python, PHP, .NET, Go, Java | SOC 2 Type II (via ActiveCampaign parent); GDPR via SCCs; no data residency outside US |
| **Mailgun** | **100/day** on Free plan (~3,000/mo) | Basic $15/mo for 10,000/mo | 25 MB per message including attachments | **US or EU region per account** (account-level toggle, not per-send) | Node, Python, PHP, Ruby, Go, Java, C# | ISO 27001, GDPR, CSA Star; SOC 2 status not prominently published; no Canadian region |

Sources:
- Resend pricing: VM https://resend.com/pricing (free + Pro tiers); VD https://resend.com/docs/api-reference/emails/send-email (40 MB, 50 recipients); VD https://resend.com/docs/dashboard/domains/regions; VD https://resend.com/security/gdpr (US data residency)
- Resend on Supabase: VD https://resend.com/docs/send-with-supabase-edge-functions; VD https://github.com/resend/resend-supabase-edge-functions-example
- SendGrid pricing: IM https://www.sender.net/reviews/sendgrid/pricing/ ($19.95 Essentials, 60-day trial replaced free); IM https://www.stackscored.com/pricing/transactional-email/sendgrid/ (same)
- AWS SES pricing: VD https://aws.amazon.com/ses/pricing/ ($0.10/1000); VD https://docs.aws.amazon.com/ses/latest/dg/quotas.html (40 MB v2, 10 MB v1, sandbox 200/day at 1/sec)
- AWS SES regions: VD https://docs.aws.amazon.com/general/latest/gr/ses.html (ca-central-1 and ca-west-1 listed)
- Postmark: VM https://postmarkapp.com/pricing ($15 Basic, 10K/mo); VD https://postmarkapp.com/developer/api/email-api (50 MB batch, 50 recipients/field); IM https://postmarkapp.com/support/article/1168-postmarks-gdpr-compliance (US-only servers, SCCs in DPA)
- Mailgun: VM https://www.mailgun.com/pricing/ ($15 Basic, 100/day free, US/EU regions); IM https://feedback.mailgun.com/forums/156243-feature-requests/suggestions/49292069 (25 MB ceiling)
- Apps Script quota: VD https://developers.google.com/apps-script/guides/services/quotas (100 consumer / 1500 Workspace)

**VM-flagged claims (vendor marketing):** Resend pricing page, Mailgun pricing page, Postmark pricing page. All confirmed cross-referenced against secondary IM sources where available.

---

## 3. Integration Architecture Options

The migration plan target is Supabase Postgres + Vercel-hosted React frontend. Email sends can originate from any of three locations.

### 3.1 Send from Supabase Edge Function (Deno)

- Runtime: Deno on Supabase managed infra; secrets via `Deno.env.get('RESEND_API_KEY')` stored in Supabase Edge Function Secrets. [VD: https://resend.com/docs/send-with-supabase-edge-functions]
- Cold-start latency: Supabase Edge Functions document <100 ms cold start in most regions; first invocation in a fresh deploy can be higher. [VM: supabase.com/docs/guides/functions -- not measured here]
- Observability: Supabase dashboard logs + `console.log` captured. No native trace propagation to vendor side; correlate via custom request IDs.
- Pattern fit: every email function in Code.gs is called from inside a transactional handler (submitTimeOffRequest, approveSwapRequest, etc). Those handlers are also moving to Edge Functions per inventory 03's edge-function class. Sending email in the same Deno function keeps the email->DB-write coupling tight (single try/catch).
- Resend has documented support: `npm:resend` SDK or direct POST to `https://api.resend.com/emails`. [VD: https://resend.com/docs/send-with-supabase-edge-functions; VD: https://github.com/resend/resend-supabase-edge-functions-example]
- AWS SES from Deno: works via `npm:@aws-sdk/client-sesv2`, but signing v4 requests adds boilerplate.
- SendGrid / Mailgun / Postmark: all have Node SDKs that work via Deno's `npm:` specifier; no native Deno SDKs.

### 3.2 Send from Vercel serverless (Node 20 runtime)

- Runtime: Node.js on Vercel; secrets via Vercel Environment Variables (encrypted at rest). [VD: vercel.com/docs/projects/environment-variables]
- Cold-start latency: Vercel reports ~300 ms p50 for Node functions on first invocation in a region. Higher than Supabase Edge for trivial workloads.
- Observability: Vercel function logs, Sentry/Datadog integrations standard.
- Pattern fit: makes sense if mutation logic stays in Supabase RLS-direct-from-frontend and email is dispatched as a side effect from a webhook (Supabase Database Webhook -> Vercel function). Adds one network hop vs option 3.1.

### 3.3 Send from Vercel cron (scheduled)

- For `checkExpiredRequests` (currently a time-driven Apps Script trigger, [C: backend/Code.gs:2060]) and any future "remind 24h before shift" feature.
- Vercel cron + serverless function -> vendor API. Not relevant for the 21 user-action-triggered emails.

### 3.4 Comparison

| Dimension | Supabase Edge Function | Vercel serverless | Vercel cron |
|-----------|-----------------------|-------------------|-------------|
| Cold start | ~100 ms claimed | ~300 ms typical | N/A (scheduled) |
| Co-located with DB write | Yes (same Deno function) | No (extra hop) | N/A |
| Secret store | Supabase Secrets | Vercel Env Vars | Vercel Env Vars |
| Best for | submit/approve/etc. handlers (sections 1.4 #3-21) | sendBrandedScheduleEmail bulk fan-out from EmailModal | checkExpiredRequests, future reminders |

---

## 4. Template Strategy

### 4.1 Hard-coded HTML strings in code (current pattern)

[C: backend/Code.gs:2095-2334] -- 200 lines of string-concat HTML wrapper + 21 plaintext bodies fed through it.
- Pros: no extra deps; what you read is what ships.
- Cons: edits require code deploy; no preview; copy changes need a developer.

### 4.2 React Email templates

Component-based JSX rendered to HTML via `@react-email/render`. Emits Outlook-safe table layouts. [VD: https://react.email/docs]
- Pros: type-safe props; preview server (`react-email dev`); shares React skill set with the rest of the codebase; works in Deno via `npm:` specifier.
- Cons: render step adds ~50 ms to email path; templates live in the frontend repo (or shared package), requires build pipeline.
- Supabase officially documents this pattern with Resend. [VD: https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend]

### 4.3 Vendor-stored templates

- **Resend Templates / Broadcasts**: limited to broadcast/marketing; transactional sends typically still ship inline HTML.
- **SendGrid Dynamic Templates**: full templating with Handlebars-style placeholders, edited in dashboard, referenced by template_id at send time. [VD: docs.sendgrid.com -- dynamic templates]
- **Postmark Templates**: similar -- MJML-based, edited in dashboard, sent via `templateId`. [VD: postmarkapp.com/email-templates]
- **Mailgun Templates**: stored Handlebars templates, versioned, sent via API param.

Tradeoffs:
| Strategy | Edit without deploy | Vendor lock-in | Preview tooling | Type safety |
|----------|--------------------|----|-----|---|
| Hard-coded strings | No | None | None | None |
| React Email | No (deploy required) | None | Yes (`react-email dev`) | Yes |
| Vendor templates | Yes (dashboard) | High (template IDs vendor-specific) | Vendor preview UI | No |

---

## 5. Domain Authentication

### 5.1 Current sender domain

- Today's sends originate from `otr.scheduler@gmail.com` via MailApp. Sender domain = `gmail.com`. [C: backend/Code.gs:2128, 2159; runtime fact per memory `reference_apps_script_topology.md`]
- Recipients see `OTR Scheduling <otr.scheduler@gmail.com>`. SPF/DKIM/DMARC for the message are Google's, not OTR's. Reputation is Gmail-pooled.

### 5.2 Where DNS lives today

- App is hosted at `https://rainbow-scheduling.vercel.app`. [C: CONTEXT/ARCHITECTURE.md:22]
- `rainbow-scheduling.vercel.app` is a Vercel-managed subdomain; DNS for `.vercel.app` is owned by Vercel; cannot be used as a sending domain (Vercel does not delegate DKIM/SPF on the shared parent domain).
- `rainbowjeans.com` is OTR's storefront / marketing domain (referenced in CONFIG.ADMIN_EMAIL `sarvi@rainbowjeans.com` and footer URL [C: backend/Code.gs:197, 2118]). DNS host for `rainbowjeans.com` is **not visible from the codebase** -- Shopify, GoDaddy, Cloudflare, and Google Domains all surface as common possibilities. **Flag: confirm DNS host for rainbowjeans.com before vendor selection.**

### 5.3 DNS records the chosen vendor will require

All 5 vendors require SPF + DKIM at minimum; DMARC is operator-recommended.

**Resend** (using subdomain `mail.rainbowjeans.com` or similar per VD recommendation):
- MX: `feedback-smtp.us-east-1.amazonses.com` (or the chosen region) priority 10 -- bounce/complaint feedback
- TXT (SPF): `v=spf1 include:amazonses.com ~all`
- TXT (DKIM): `resend._domainkey.<subdomain>` with provided public key
- TXT (DMARC, optional): `_dmarc.<subdomain>` -> `v=DMARC1; p=none; rua=mailto:dmarc@rainbowjeans.com`
[VD: https://resend.com/docs/dashboard/domains/introduction]

**SendGrid**: 3 CNAME records (`s1._domainkey`, `s2._domainkey`, `<id>.<domain>`) plus reverse-DNS link domain CNAME. [VD: docs.sendgrid.com domain-authentication]

**AWS SES**: 3 CNAME DKIM records (Easy DKIM) + optional MX for receiving + custom MAIL FROM domain (recommended) requires MX + SPF on subdomain. [VD: docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html]

**Postmark**: 1 TXT (SPF) + 1 TXT (DKIM with provided selector) + optional DMARC + optional Return-Path CNAME. [VD: postmarkapp.com/support/article/1047]

**Mailgun**: 2 TXT (SPF + DKIM) + 2 MX (for inbound, optional for outbound-only) + 1 CNAME for tracking. [VD: documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain]

### 5.4 Subdomain choice

All vendor docs recommend a sending **subdomain** (e.g., `mail.rainbowjeans.com` or `notify.rainbowjeans.com`) rather than the apex `rainbowjeans.com`. Reason: sender reputation isolation -- transactional bounces should not affect marketing/storefront mail reputation on the apex. [VD: https://resend.com/docs/dashboard/domains/introduction explicitly says "use a subdomain"]

---

## 6. Deliverability Checklist

### 6.1 DMARC policy

- Recommended starting policy: `v=DMARC1; p=none; rua=mailto:dmarc-reports@rainbowjeans.com; pct=100`. `p=none` collects reports without quarantining; once SPF+DKIM aligned for 2-4 weeks, raise to `p=quarantine` then `p=reject`.
- All 5 vendors document this progression. [VD: e.g., https://postmarkapp.com/support/article/1145-dmarc-explained]

### 6.2 Bounce + complaint handling

| Vendor | Bounce webhook | Complaint webhook | Suppression list auto-managed |
|--------|----------------|-------------------|------------------------------|
| Resend | Yes (Webhooks: email.bounced) | Yes (email.complained) | Yes (auto-suppressed after hard bounce) |
| SendGrid | Yes (Event Webhook) | Yes | Yes (suppression groups) |
| AWS SES | Yes (SNS topic) | Yes (SNS topic) | Yes (account-level + config-set suppression) |
| Postmark | Yes (Webhooks) | Yes | Yes (auto-inactivated) |
| Mailgun | Yes (Webhooks) | Yes | Yes |

[VD: each vendor's docs section on webhooks/events; Resend https://resend.com/docs/dashboard/webhooks/introduction]

### 6.3 Suppression management

- All 5 vendors auto-suppress after a hard bounce. Soft-bounce thresholds vary.
- For OTR's 35-employee directory, explicit unsubscribe is **not required** for transactional shift emails (CASL business-relationship exemption applies; PIPEDA does not require opt-in for employer-employee shift notifications). **Flag: confirm with JR/legal -- this doc does not constitute legal advice.**
- If an employee leaves and their email hard-bounces, the vendor will block resends; the migration plan should include "remove inactive employee from `to:` list" logic in the edge function (read `employees.active` flag).

---

## 7. Cutover Risks

### 7.1 Sender reputation cold start

New sending domain (`mail.rainbowjeans.com` say) has zero reputation. Industry guidance: warm up by sending <50/day for the first week, ramping over 4 weeks. [IM: https://blog.postmarkapp.com/ip-warmup-strategies and similar SES/SendGrid guides]
- OTR peak 200/mo = ~7/day, well under any warm-up curve. Risk is low for OTR alone. **Flag for Phase 2 multi-tenant: warm-up matters at 10+ stores.**

### 7.2 From-address change shock

- Today: `otr.scheduler@gmail.com`. Recipients (35 employees + sarvi@rainbowjeans.com) have likely whitelisted or trained Gmail to deliver this address to inbox.
- After migration: `noreply@mail.rainbowjeans.com` (or chosen). Recipients' Gmail tabs may classify the first sends as Promotions or Spam.
- Mitigation: announce the change in the last MailApp send before cutover; ask employees to add the new address to contacts; first post-cutover send should be the schedule-publish (highest-engagement) so recipients open and train Gmail's classifier.

### 7.3 Apple Mail (iPad / iOS) HTML rendering

- Sarvi reads on iPad (Safari + Apple Mail) per memory `feedback_mobile_desktop_parity.md`.
- Lessons #91-93 (`CONTEXT/LESSONS.md:91-93`) flagged that iPad Safari historically fell back to Latin-1 on Blob HTML when charset meta missing, rendering em-dash and bullet glyphs as garbage. **Same risk applies to email HTML.**
- The current `BRANDED_EMAIL_WRAPPER_HTML_` does set `<meta charset="UTF-8">` [C: backend/Code.gs:2105], and `src/email/build.js` uses bullet `•` (line 35) and em-dash `—` (line 41). All five vendors send email body as UTF-8 with proper Content-Type by default, so the LESSONS PDF-blob bug does not directly carry over. **However:** keep an em-dash-free + ASCII-only fallback plan in the plaintextBody field (`src/email/build.js` already uses ASCII hyphens in the plaintext body except for `•` and `—` mentioned). Audit `buildBrandedHtml.js` and `build.js` for non-ASCII glyphs the moment a vendor is chosen and confirm `Content-Type: text/html; charset=UTF-8` in vendor's send response.
- Outlook desktop (still 2007-vintage Word rendering engine) does not handle CSS positioning, flex, or grid. The current wrapper uses `<table>` layout, which is Outlook-safe. Any React Email migration must preserve table layout (React Email's default components do).

### 7.4 Schema / config gaps

- `CONFIG.ADMIN_EMAIL` (Code.gs:197) is hardcoded. Migration must move to Supabase env / Vercel env. [C: docs/migration/03-appscript-inventory.md:695]
- `sendTimeOffCancelledEmail` is defined but never called (inventory 03 flag #1). Decide before cutover: implement in cancelTimeOffRequest, or delete dead code.
- `sendBrandedScheduleEmail` auth-gate bug (section 1.7) -- decide whether to fix in Apps Script before cutover (one-line patch) or only fix in the Edge Function replacement.

---

## 8. Flag for the main session to double-check

1. **otr.scheduler@gmail.com Workspace status.** This document assumes consumer Gmail (100/day MailApp quota). If it's a Workspace account, the urgency framing of "MailApp quota is a real risk" weakens. Confirm at https://admin.google.com/ when signed into otr.scheduler.

2. **DNS host for `rainbowjeans.com`.** Vendor selection details (CNAME vs TXT preference, Cloudflare proxy collision, Google Domains migration) depend on this. Run `dig NS rainbowjeans.com` or check the registrar dashboard. **This is the single highest-leverage missing fact.**

3. **Volume estimate vs reality.** Section 1.6's 125-200/mo is a model, not a measurement. Add `Logger.log(MailApp.getRemainingDailyQuota())` to `sendEmail` for 30 days before pricing commitment. If real volume is <50/mo, every vendor's free tier covers OTR forever; if it's >2,000/mo, Resend $20 Pro vs SES $0.20/mo arithmetic shifts.

4. **Canadian data residency requirement.** OTR is a Canadian retailer. PIPEDA does **not** require Canadian-soil storage of email logs, but if OTR's privacy posture promises it, only **AWS SES (ca-central-1 / ca-west-1)** offers Canadian residency among the 5. Resend, SendGrid, Postmark, Mailgun all store account data in US (or US+EU for Mailgun). Confirm whether residency is a hard requirement.

5. **CASL / PIPEDA opt-out applicability.** This doc assumes employer-employee transactional emails are exempt from explicit unsubscribe under CASL section 6(6)(a). If the deck or contract represents otherwise, an unsubscribe footer becomes mandatory and changes the wrapper.

6. **sendBrandedScheduleEmail authentication bug.** Section 1.7 documents a silent-no-op bug. Inventory 03 flag #2 noted it. **Confirm whether EmailModal is currently used in production at all** -- if Sarvi still publishes the schedule via the Apps-Script-flavored "Email Schedule" path, she has been hitting a no-op every Sunday. Smoke test before assuming the path is dead.

7. **Plaintext body coverage.** `src/email/build.js` builds a plaintext body; backend `BRANDED_EMAIL_WRAPPER_HTML_` does NOT separate plain-vs-html (same string fed to both). Recipient mail clients without HTML rendering see escaped HTML or raw markup. After vendor migration, ensure every send has a real `text:` field (vendor APIs accept both `html` and `text`).

8. **"Reply" expectations.** No `replyTo` is set today. Recipients hitting Reply in Gmail send to `otr.scheduler@gmail.com`, which is a real inbox someone monitors (or doesn't?). After migration, replies to `noreply@mail.rainbowjeans.com` will bounce or land in `/dev/null`. Decide: route replies to `sarvi@rainbowjeans.com` via vendor's reply-to header, or accept the loss.

9. **React Email vs hardcoded strings.** This doc presents both as facts; the 21-template surface is small enough that hardcoded HTML in TS/JS files is viable. JR may have a strong preference -- not surfaced here.

10. **Vendor lock-in via templates.** If vendor templates (SendGrid Dynamic, Postmark Templates) are chosen, switching vendors later requires re-creating all templates. React Email or hardcoded HTML keeps templates portable.

---
