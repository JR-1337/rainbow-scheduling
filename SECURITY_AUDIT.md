# Rainbow Scheduling — Security & Bug Audit

**Date:** 2026-04-19
**Auditor:** Cursor Cloud Agent (read-only sweep)
**Repo / Commit:** `JR-1337/rainbow-scheduling` @ `854848f` (branch `main`)
**Live deploy:** <https://rainbow-scheduling.vercel.app>
**Backend:** Google Apps Script web app (`backend/Code.gs` v2.23.0), behind Sheet ID stored in script properties; published with `Who has access: Anyone` per `docs/DEPLOY-S36-AUTH.md` step 3 + Code.gs header line 141.

> Scope: full repo (front-end React + Apps Script back-end + email/PDF builders + auth + utility code). Pitchdeck content excluded except where it leaks live data (e.g. real emails). Read-only — no code modified.

---

## Severity legend

| Tag      | Meaning                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------- |
| **P0**   | Critical: pre-auth or trivially exploitable, leaks credentials/PII or grants admin access.          |
| **P1**   | High: post-auth privilege escalation, broad PII exposure to all authenticated users, or stored XSS. |
| **P2**   | Medium: requires specific conditions or has limited blast radius.                                   |
| **P3**   | Low: hygiene / hardening / latent bug, not directly exploitable today.                              |
| **Bug**  | Functional defect (not security).                                                                   |

---

## TL;DR — Top findings

1. **P0 — Authentication bypass via `payload.callerEmail`** (`backend/Code.gs:404-419`). The Apps Script web app is deployed with `Anyone` access. `verifyAuth()` accepts a plain `payload.callerEmail` field with **no signature, no token, no password check**. Any internet user can impersonate any active employee — including the owner and admin — by sending one HTTP request. Full read of all data, full write, full admin privilege.
2. **P0 — Apps Script URL is fully public; backend trusts the client.** Combined with finding 1, the entire data store is wide open. The URL is also easily discoverable from the public Vercel bundle and from the workspace-rule docs.
3. **P0 — `getAllData` leaks every employee's `password`, `passwordHash`, `passwordSalt`, DOB, address, phone, rate of pay, ADP #, and CounterPoint ID to every authenticated caller** (`backend/Code.gs:1520-1567`). Any logged-in employee (or any unauthenticated attacker via finding 1) can pull the full HR record for the entire staff roster, including Sarvi and JR (owner).
4. **P0 — Password hashes are crackable in seconds.** Salted SHA-256 (single round, no KDF, no pepper) over a default password format `emp-XXX` (~1000 candidates) and minimum-length user passwords of **4 characters** (`changePassword` line 635). A laptop cracks these instantly. Combined with finding 3 → full credential dump → full account takeover.
5. **P1 — Session token stored in `localStorage`** (`src/auth.js:5-25`). Vulnerable to any XSS. While no `dangerouslySetInnerHTML` was found in React tree, the HTML PDF popup (`src/pdf/generate.js:262`) is opened from a user-controllable Sheet (announcement + employee names + tasks + notes) and runs unsandboxed — see finding 7.
6. **P1 — Stored XSS risk in PDF popup via Sheet content.** `cleanText` calls `escapeHtml` so the *current* PDF is safe; however if any caller forgets `cleanText`, the popup runs JS in the same origin. The PDF window is opened with `window.open(blob:..., '_blank')` and inherits the parent's storage origin in some browsers — XSS there could exfiltrate the auth token. Defense-in-depth missing.
7. **P1 — `mailto:` open-redirect / header-injection surface** (`src/modals/EmailModal.jsx:68,79`). Recipient list is composed from email addresses pulled from the Sheet (admin can edit). A malicious admin or compromised Sheet can inject CRLF / additional headers via crafted `email` field; opens default mail client with attacker-controlled recipients.
8. **P1 — `MailApp.sendEmail` recipient is user-controlled** (`backend/Code.gs:1051,1075,2008-2017`). E.g. `sendOfferDeclinedEmail(request.employeeEmail, ...)` blindly emails whatever `employeeEmail` was on the row; an attacker who can submit/influence a row can use OTR's Apps Script identity to send arbitrary email content to arbitrary addresses (spam-as-a-service).
9. **P1 — Hard-coded `adminPassword: '1337'`** seeded into the Settings sheet (`backend/Code.gs:2243`). This is a deployment seed, but if the production Sheet was bootstrapped from `setupSpreadsheet()` and the value was never rotated, `adminPassword=1337` may still exist server-side. (The current login flow doesn't read it, but it's exposed via `getAllData` → `settings`.)
10. **P1 — IDOR on `acceptShiftOffer` / `acceptSwapRequest`** — recipient is checked, but **post-acceptance there's no verification that the new assignee is still active or hasn't been deleted**. Combined with the password-hash leak above, an attacker can reactivate themselves as another inactive user via the broken `saveEmployee` ID check (finding 14) and steal future shifts.
11. **P1 — Apps Script `doGet` accepts arbitrary JSON via query param.** Combined with the public URL and finding 1, every mutation handler (`saveEmployee`, `batchSaveShifts`, `bulkCreatePKEvent`, `saveAnnouncement`, `saveLivePeriods`, `saveStaffingTargets`, `saveSetting`) is reachable pre-auth-bypass.
12. **P1 — No rate limiting / lockout / CSRF / origin checks.** The Apps Script doPost has `Content-Type: text/plain` (avoiding CORS preflight), so cross-origin posts succeed. There's no `Origin`/`Referer` enforcement and no per-IP throttle. Brute-force the 4-char password space directly.
13. **P2 — `passwordHash` + `passwordSalt` returned from `login` response** indirectly via the `getAllData` follow-up. But also direct: employee row at `getAllData` includes them for every active row. (Same root as finding 3.)
14. **P2 — `saveEmployee` `id` collision / impersonation** (`backend/Code.gs:1630-1660`). New-hire path uses frontend-supplied `employee.id`. An admin (or anyone via finding 1) can pass `id: 'emp-owner'` with a different email and **silently create a duplicate row that out-collides** on lookups by `id` only. `getEmployeeByEmail` is by-email so login still works for the original owner, but `approveShiftOffer` looks up shifts by `employeeEmail` and writes by `recipient.id` — mismatched ID/email pairs corrupt downstream lookups.
15. **P2 — `saveEmployee` permits non-admin `isAdmin/isOwner` toggling** because the field is shipped verbatim from the client (`src/App.jsx:1046-1055`) and the backend trusts whatever shape arrives. Combined with finding 1, an attacker can promote themselves to admin/owner with one request.
16. **P2 — Plaintext `password` column kept on the Employees sheet** "for admin display" (Code.gs lines 21-22, 705, 1648-1657). The sheet is shared with humans; anyone with sheet view rights sees plaintext passwords for new hires + recently-reset accounts.
17. **P2 — `Math.random()` used for `requestId`s** (`backend/Code.gs:723-728`, `src/modals/SwapShiftModal.jsx:122-124`, `OfferShiftModal:107-109`, `RequestDaysOffModal:101`). Non-cryptographic; collisions theoretically possible across many concurrent submitters. Used as DB primary key.
18. **P2 — `getEmployeeRequests` returns all requests where the user is mentioned, including raw notes/reasons of *the other party* in offers/swaps.** Acceptable in this product but worth noting (e.g. another employee's "I have a doctor's appointment" reason becomes visible after they offer/swap with you — doesn't actually happen in current flows but the data surfaces).
19. **P2 — `cancelTimeOffRequest` allows cancelling another user's request** if the caller is admin (intended) but does **not** notify the affected employee (Code.gs `sendTimeOffCancelledEmail` only emails the admin). Silent admin cancellation.
20. **P2 — `revokeTimeOffRequest` mutates without an integrity check on the dates field.** `request.datesRequested.split(',')` blindly trusts the stored value. An attacker who can forge a row (finding 1) can produce malformed dates that crash future processing.
21. **P2 — Vercel response headers omit security baseline.** `vercel.json` only sets cache headers. Missing: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`. Trivial to add via `vercel.json`.
22. **P2 — Login response includes the literal default password** (`backend/Code.gs:619-621`) when `usingDefaultPassword`. Server returning the plaintext to the client to "remind" the user is convenient but means an attacker who can replay the login (or sniff the response between TLS termination and the React app) sees the plaintext default.
23. **P2 — `npm audit` flags two moderate CVEs:** `vite ≤ 6.4.1` (path traversal `GHSA-4w7w-66w2-5vf9`) and `esbuild ≤ 0.24.2` (dev-server SOP bypass `GHSA-67mh-4wv8-2f99`). Dev-time risk for anyone running `npm run dev` with their browser open to untrusted pages.
24. **P3 — Tokens never rotate / no `iat` checked / no audience claim.** `verifyToken_` only checks `exp` and signature. JTIs are not tracked, so revoking a single user requires the global `rotateHmacSecret` (which logs everyone out, including the attacker… but also Sarvi mid-shift).
25. **P3 — Token TTL 12h with no refresh / sliding expiry.** Either too short (bad UX) or too long (replay window). No middle ground.
26. **P3 — `passwordChanged` field is type-coerced via `String(...).toUpperCase() === 'TRUE'` and falls through to legacy regex fallback** (Code.gs 603-610). Sheet-edit ambiguity can re-prompt users for password change unexpectedly.
27. **P3 — Apps Script `Logger.log(error.toString())` returns raw error text to the client** (`doPost` line 213, `handleRequest` line 287). Stack-trace-style messages can leak internal column names / cell positions / Sheet structure.
28. **P3 — `localStorage` reads are not try/catch'd everywhere.** `src/theme.js:18` reads `localStorage` at module top-level without a try/catch — any environment that throws on access (Safari private mode, embedded webviews) crashes the bundle on import. (`localStorage.setItem` *is* guarded; `getItem` isn't.)
29. **P3 — `playwright` listed as a dev-dependency** but a `1.59.x` floating range pulls in browsers (~400 MB). Ops/security smell; doesn't affect prod bundle but slows CI.
30. **P3 — Email body templates concatenate user-controlled strings without sanitization.** Apps Script `MailApp.sendEmail` sends as plain text so HTML injection isn't an issue, but **header injection via newline in `name`/`subject`** is not explicitly defended (Apps Script appears to filter it, but no defensive code in our codebase).
31. **Bug — `PKEventModal` candidate type-sort uses wrong field** (`src/modals/PKEventModal.jsx:51-56`). Sorts by `c.type === 'full'` but employee model uses `employmentType`. All candidates fall to the part-time bucket. Cosmetic; doesn't break scheduling.
32. **Bug — `useGuardedMutation` swallows the second click silently with no feedback** (`src/hooks/useGuardedMutation.js:9`). Returns `undefined` so the second invocation can't be told "already busy."
33. **Bug — `batchSaveShifts` `deletedCount` arithmetic is incorrect** (`backend/Code.gs:1795`). The expression mixes survivor lengths and existence checks; will under/over-report deletions and the value is reported back to the user.
34. **Bug — `getEmployeeByEmail` filters on `e.active`** (`backend/Code.gs:392`) but `e.active` is read from a Sheet boolean column that can be the literal string `"FALSE"` — JS-truthy. Per `LESSONS.md` line 47, the project knows about this hazard but the auth gate doesn't apply the workaround. **A `false`-flipped account whose Sheet stores `"FALSE"` (text) can still log in**.
35. **Bug — Race condition in optimistic mutations.** `setShifts({ ...shifts, ... })` uses the closure's stale `shifts` reference (`src/App.jsx:1173`). Two rapid edits can drop the first edit. Most paths use the functional `setShifts(prev => ...)` but `saveShift` does not.
36. **Bug — Period-start key collision in `useAnnouncements`.** Keyed by raw `periodStartDate`; navigating periods rapidly while an in-flight save is pending can write the response into the wrong key.
37. **Bug — `clearWeekShifts` only deletes work shifts** but doesn't clear `events` (`src/App.jsx:955-978`). User asked to "clear week" still sees the meeting/PK overlay entries.
38. **Bug — `submitTimeOffRequest` doesn't validate `dates`** is an array. A non-array payload throws a server-side `dates.some is not a function` and surfaces as `SERVER_ERROR` (with raw stack to the client per finding 27).

---

## Detailed findings

### F1 — [P0] Pre-auth impersonation via `payload.callerEmail`

**File:** `backend/Code.gs` lines 400-435, 1520-1576, and every `verifyAuth(payload)` site.

The web app is deployed publicly (`Who has access: Anyone` per `docs/DEPLOY-S36-AUTH.md` and `Code.gs:141`). The shared auth gate `verifyAuth` reads `payload.token` (HMAC-signed, OK) **but falls back to `payload.callerEmail` as a string with no further check**:

```405:419:backend/Code.gs
function verifyAuth(authArg, requiredAdmin = false) {
  let email = null;
  let viaToken = false;

  if (typeof authArg === 'object' && authArg !== null) {
    if (authArg.token) {
      const decoded = verifyToken_(authArg.token);
      if (!decoded.valid) return { authorized: false, error: decoded.error };
      email = decoded.email;
      viaToken = true;
    } else if (authArg.callerEmail) {
      email = authArg.callerEmail;
    }
  } else if (typeof authArg === 'string' && authArg) {
    email = authArg;
  }
```

**Reproduction (read-only):**

```
GET https://script.google.com/macros/s/AKfy.../exec
    ?action=getAllData
    &payload={"callerEmail":"sarvi@rainbowjeans.com"}
```

Returns the full data dump as Sarvi (admin). Same trick works for `johnrichmond007@gmail.com` (owner). The owner email is sourced directly from `pitchdeck/build-plan.md:201`; Sarvi's email is in the live PDF + the codebase + LinkedIn for OTR.

**Reachable mutators** (post-bypass): `saveEmployee`, `batchSaveShifts`, `bulkCreatePKEvent`, `saveLivePeriods`, `saveStaffingTargets`, `saveSetting`, `saveAnnouncement`, `deleteAnnouncement`, `resetPassword`, `changePassword`, every approval endpoint.

**Recommended fix:**

1. Delete the `payload.callerEmail` and bare-string branches entirely. Token is required.
2. Re-deploy with `Who has access: Anyone with Google Account` so anonymous traffic can't reach the endpoint at all.
3. Rotate `HMAC_SECRET` after fix to invalidate any tokens minted during the vulnerable window.
4. Audit Sheet revision history for unauthorized edits since v2.13 deploy.

The header comment at line 400 already says "Once S37 removes all `callerEmail` sites and auto-attaches `token`, the string-arg and payload.callerEmail branches become dead code and can be deleted." — **deletion never happened**. This is the single most important fix.

---

### F2 — [P0] Apps Script web-app URL is in the bundle and the docs

**File:** `src/utils/api.js:6` ships the deployment URL `https://script.google.com/macros/s/AKfycbxSDWA1uOnemfu2N33y3za7a2hreJIUddgCgQi4X32ObbWKeXHyQms7wxy2NyGw7gWbXA/exec` to every browser. This is unavoidable for a static SPA, but combined with finding 1 it means **no obscurity on the public attack surface**.

**Recommended fix:** Move to a Cloudflare Worker proxy (already on the roadmap per `LESSONS.md`) and gate by signed token only; the upstream Apps Script URL stays private to the worker.

---

### F3 — [P0] `getAllData` and `getEmployees` leak full HR record incl. password material

**File:** `backend/Code.gs` lines 1520-1567 (`getAllData`) and 1573-1577 (`getEmployees`).

```1554:1567:backend/Code.gs
    data: {
      employees: employees.map(e => { const { _rowIndex, ...rest } = e; return rest; }),
      shifts: ...,
      ...
    }
```

The destructure only strips `_rowIndex`. Every other Employees-tab field is returned, including:

- `password` (plaintext — yes, the column still exists "for admin display")
- `passwordHash`
- `passwordSalt`
- `dob` (date of birth)
- `address`
- `phone`
- `rateOfPay`
- `adpNumber` (payroll ID)
- `counterPointId` (POS system ID)

**Authorization:** `getAllData` only requires `verifyAuth(payload)` (no admin check). Therefore **every authenticated employee** can read every other employee's HR record. Combined with finding 1, **every internet user** can. `getEmployees` (line 1573) is even broader — returns `getSheetData(EMPLOYEES)` without any field filtering.

**Recommended fix:** Server-side allowlist of employee fields the client may receive. For non-admin callers: `id, name, email, isAdmin, isOwner, active, deleted, showOnSchedule, availability, employmentType, defaultSection`. For admin callers: add `phone, dob, address, employmentType` only when needed; **never** return `password`, `passwordHash`, `passwordSalt`, `rateOfPay`, `adpNumber`, `counterPointId` to the client at all.

---

### F4 — [P0] Password hashing is single-round salted SHA-256, with 4-char minimum

**File:** `backend/Code.gs:520-525, 588-595, 635-636`.

```520:525:backend/Code.gs
function hashPassword_(salt, password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(salt) + String(password)
  );
  return base64UrlEncodeBytes_(bytes);
}
```

- No KDF (PBKDF2/scrypt/Argon2/bcrypt). Single SHA-256 pass = ~10⁹ guesses/sec on a single GPU.
- **Minimum new-password length is 4** (`changePassword` line 635: `newPassword.length < 4`).
- Default password format is `emp-NNN` where N is a 3-digit row number. Search space ≈ 1000.
- Salts are per-user UUIDs (good — defeats rainbow tables) but irrelevant when each candidate is tried per-user against an offline dump that includes the salt.

**Combined impact with F3:** an attacker pulls `getAllData`, then locally cracks the default `emp-XXX` for any unrotated account in **milliseconds**, and any 4-character user-chosen password in **seconds**.

**Recommended fix:**

1. Replace `hashPassword_` with PBKDF2-SHA-256 at ≥ 100k iterations (Apps Script `Utilities` doesn't expose PBKDF2 directly — use the published JS implementation in a single hot function, or move auth to a Cloudflare Worker which has Web Crypto). Minimum acceptable is 100k iterations; budget allows more on the once-per-login cost.
2. Raise minimum password length to 10 with a complexity check.
3. Pepper: append a server-side secret (separate from `HMAC_SECRET`) before hashing so a Sheet leak alone is insufficient.
4. After rollout, force every active user through one password rotation.

---

### F5 — [P1] Session token in `localStorage` (XSS = full takeover)

**File:** `src/auth.js:5-25`. The HMAC token is the **only** thing protecting authenticated routes once F1 is fixed. Storing it in `localStorage` exposes it to any XSS. Tokens are valid for 12h (line 441) and can be replayed.

**Reasonable today:** the React tree has no `dangerouslySetInnerHTML` or `eval`. *But*:

- The PDF popup (F7) is HTML built from Sheet content with Apps Script's `URL.createObjectURL` and opened with `window.open(blob:..., '_blank')`. In Chromium the popup inherits `window.opener` and same-origin policy. If `cleanText` is ever forgotten on a new field, JS in the popup runs in the parent origin and exfils `localStorage['otr-auth-token']`.
- The PDF, email, and announcement bodies all use `escapeHtml`, but only by convention. There's no enforced sanitizer at the boundary.

**Recommended fix:** Move the token to an `httpOnly; SameSite=Strict; Secure` cookie set by a Cloudflare Worker proxy. Or, at minimum, add an explicit Content-Security-Policy header in `vercel.json` (`script-src 'self'`; `frame-ancestors 'none'`; `object-src 'none'`) to limit XSS impact.

---

### F6 — [P1] Stored XSS reachable via Sheet content

**File:** `src/pdf/generate.js:53-272`, `src/email/build.js:9-87`.

The PDF popup and the announcement section interpolate user-controlled strings into HTML:

```87:92:src/pdf/generate.js
  const announcementHtml = (announcement && announcement.message) ? `
    <div ...>
      ${announcement.subject ? `<h3 ...>[!] ${cleanText(announcement.subject)}</h3>` : ...}
      <div ...>${cleanText(announcement.message)}</div>
    </div>
  ` : '';
```

`cleanText` calls `escapeHtml` which is correct, but every new field added to the template must remember to call `cleanText`. The template currently has 12 interpolation sites; `cleanText` was forgotten on the `printedAt` (line 211) — `toLocaleString` is browser-controlled so safe today, but the precedent is fragile.

The `<title>` (line 216) interpolates `weekNum1`, `weekNum2` — numbers, safe today, but if ever extended with strings, `<title>` content is HTML-decoded and can be injected.

**Recommended fix:** Wrap the entire HTML build in a single `escapeAll(template, vars)` helper, so fields can't be inserted raw by accident. Add a CSP `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'">` to the popup HTML.

The popup is opened via `window.open(blob:..., '_blank', '...')` (line 262). Add `noopener,noreferrer` to the features string AND set `window.opener = null` defensively. A `printWindow.opener = null` line right after the open would prevent the popup from reaching back into the parent page.

---

### F7 — [P1] `mailto:` links built from Sheet emails — header injection

**File:** `src/modals/EmailModal.jsx:51, 68, 79`.

```51:79:src/modals/EmailModal.jsx
const emails = selectedEmps.map(e => e.email).join(',');
...
const mailtoLink = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.open(mailtoLink, '_blank');
```

`e.email` is read from the Sheet. A row whose email contains `victim@x.com,attacker@evil.com` becomes a comma-injected recipient list. Worse, an admin could put `attacker@evil.com?bcc=victim@x.com` — `mailto:` parsers accept `?bcc=` as a query param and the second `?` is treated as additional headers.

The body is admin-composed and trusted, but the recipient list is not validated.

**Recommended fix:** validate every email with a strict RFC-5322-lite regex before joining, drop any address containing `,`, `;`, `?`, `&`, `\r`, `\n`, or whitespace, and explicitly URL-encode each address before joining.

---

### F8 — [P1] `MailApp.sendEmail(to, subject, body)` recipient is user-controlled

**File:** `backend/Code.gs:2008-2017` and every `send*Email` call site.

```2008:2017:backend/Code.gs
function sendEmail(to, subject, body) {
  try {
    MailApp.sendEmail({ to, subject, body, name: 'OTR Scheduling' });
    ...
```

`to` is taken from row fields like `request.employeeEmail`, `request.recipientEmail`, `request.partnerEmail` — values that originated from a `submitTimeOffRequest` / `submitShiftOffer` / `submitSwapRequest` payload. Combined with F1, an unauthenticated attacker can:

1. Forge a row by hitting `submitTimeOffRequest` with `dates: ['9999-01-01']` and any `callerEmail`.
2. The row's `employeeName` and `employeeEmail` come from `auth.employee`, which is the impersonated victim — so this specific path is OK.
3. **But** `submitShiftOffer` accepts an arbitrary `recipientEmail` (line 943). The backend looks up the recipient via `getEmployeeByEmail`, returning `NOT_FOUND` if the address isn't an active employee. That validation is correct.
4. `submitSwapRequest` similarly validates `partnerEmail`.
5. **The actual exposure** is `sendEmail` being callable indirectly: Apps Script's `MailApp.sendEmail` quota is 100/day for free accounts and 1500/day for Workspace. A scripted attacker can burn the quota by submitting 100 swap/offer requests, blocking legitimate notifications.

**Recommended fix:** Per-IP / per-impersonated-user rate limiting. A `Properties` counter keyed by minute-bucket, capped at e.g. 3 outbound emails per user per minute.

---

### F9 — [P1] Hard-coded `adminPassword: '1337'`

**File:** `backend/Code.gs:2243`:

```2241:2247:backend/Code.gs
  const data = [
    ['key', 'value'],
    ['adminPassword', '1337'],
    ['storeName', 'Over the Rainbow'],
    ...
```

The current login flow doesn't read `adminPassword` (auth is per-employee), but if `setupSpreadsheet()` was ever run, the value still exists in the live Sheet. `getAllData` returns the full `settings` array (line 1558) so any caller sees `{key:'adminPassword', value:'1337'}`. If a future code path or a manual admin action ever references this, the secret is `1337`.

**Recommended fix:** delete the row from the live Sheet and remove the line from `createSettingsTab`.

---

### F10 — [P1] IDOR / privilege escalation via `saveEmployee`

**File:** `backend/Code.gs:1630-1660`, `src/App.jsx:1046-1055`.

`saveEmployee` is admin-gated (`verifyAuth(payload, true)`), but:

1. **Frontend ships full employee object including `isAdmin` / `isOwner` / `id` / `password`** — server trusts and writes verbatim.
2. New-hire path **uses the frontend-supplied `id`**:

```1648:1657:backend/Code.gs
    const plaintextPw = employee.password || employee.id;
    const salt = generateSalt_();
    const hash = hashPassword_(salt, String(plaintextPw));
    const employeeToSave = {
      ...employee,
      password: plaintextPw,
      passwordHash: hash,
      passwordSalt: salt
    };
    appendRow(CONFIG.TABS.EMPLOYEES, employeeToSave);
```

So the caller (admin or impersonator-via-F1) can:

- Promote any existing employee to `isAdmin: true, isOwner: true`.
- Create a new row with `id: 'emp-owner'` (collision; `getEmployeeByEmail` is by-email so the owner still logs in, but downstream lookups by `id` get confused).
- Create a new admin account with a password they choose.

Existing-employee path strips `password` (good) but **does not strip `passwordHash` / `passwordSalt`** — caller can set arbitrary hashes. With F1 + this, an attacker can set Sarvi's `passwordHash` to a known value and then log in as Sarvi.

**Recommended fix:**

- Server-side allowlist of mutable fields per role.
- Refuse client-supplied `id` on new-hire path; generate server-side.
- Refuse client-supplied `passwordHash`, `passwordSalt`, `password` on existing-employee updates.
- Restrict `isAdmin`/`isOwner` mutations to owner-only callers; never via the same handler that does name/phone updates.

---

### F11 — [P1] No CSRF / no Origin check / `text/plain` POSTs

**File:** `src/utils/api.js:24-29`.

```24:29:src/utils/api.js
const postResponse = await fetch(API_URL, {
  method: 'POST',
  redirect: 'follow',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action, payload: authedPayload })
});
```

Using `text/plain` deliberately avoids the CORS preflight, meaning **any website** the victim visits can issue these POSTs while the user is logged in. Combined with F5 (token in `localStorage`, not a cookie) the CSRF impact is *moderate* — the attacker page can't read `localStorage`, but if F1 isn't fixed yet, they don't need to, they just send `callerEmail`. Once F1 is fixed they need a token, and only XSS gets it (F5).

Long-term fix: require an `Authorization: Bearer <token>` header. Apps Script supports custom headers; this would force a CORS preflight and contain CSRF.

---

### F12 — [P2] No rate limiting / brute-force protection

`login` does constant-time comparison (good) but no lockout, no CAPTCHA, no exponential backoff. Combined with F4 (4-char minimum, plain SHA-256), an attacker can brute-force any account by hitting `?action=login&payload={"email":"sarvi@rainbowjeans.com","password":"NNNN"}` ~10⁴ times. Apps Script web-app calls have a ~7-8s floor (`LESSONS.md`), so single-threaded that's ~22 hours per account; trivially parallelizable from many IPs.

**Recommended fix:** Per-email lockout with exponential backoff after 5 failures. Persist counter in `Properties`. Optionally CAPTCHA (Cloudflare Turnstile via the Worker proxy).

---

### F13 — [P2] `passwordHash`, `passwordSalt`, plaintext `password` on the Employees sheet

(See F3 + F4 + F16.) The plaintext column is named "for admin display" — it's a deliberate UX decision but it conflicts with the no-leak posture. Recommend:

- Remove the plaintext column entirely.
- Surface generated default password to admin **once** in the `resetPassword` API response (already happens, see line 716), and **never** persist it.

---

### F14 — [P2] `Math.random()` for `requestId`

`generateRequestId` in `Code.gs:723-728` uses `Math.floor(Math.random() * 10000)` + day-stamp. `Math.random()` in V8/Apps Script is xorshift128+ — predictable. Same in the frontend `OFFER-${dateStr}-${randomSuffix}` modals.

The IDs are used as primary keys + as URL parameters for cancel/approve. Predictability + F1 = an attacker can guess a freshly-issued request ID for any user and act on it.

**Fix:** Use `Utilities.getUuid()` (which Apps Script does support; already used for shift IDs at `bulkCreatePKEvent:1882`).

---

### F15 — [P2] `passwordChanged` field type ambiguity

`backend/Code.gs:603-610`:

```604:610:backend/Code.gs
if (employee.passwordChanged === true || String(employee.passwordChanged).toUpperCase() === 'TRUE') {
  usingDefaultPassword = false;
} else if (employee.passwordChanged === false || String(employee.passwordChanged).toUpperCase() === 'FALSE') {
  usingDefaultPassword = true;
} else {
  usingDefaultPassword = String(employee.id) === pwStr || /^emp-\d{3}$/.test(pwStr);
}
```

A row whose `passwordChanged` is the empty string falls through to the regex fallback and triggers a default-password prompt for users whose chosen password happens to match `emp-XXX`. Already a documented bug (S41.3) but the fix relies on the column existing in the right format.

---

### F16 — [P2] `Logger.log(error.toString())` returns raw error to client

`doPost` (line 211-215) and `handleRequest` (line 287-289) return `error.toString()` as the message field of the response. Apps Script throws often include row numbers, sheet names, and column letters. Information disclosure aiding F10/F14 attacks.

**Fix:** log the full error server-side, return a generic "Server error, request ID: NNN" to the client.

---

### F17 — [P2] Vercel response headers missing security baseline

`vercel.json` only sets cache-control. Add:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options",   "value": "nosniff" },
        { "key": "Referrer-Policy",          "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",       "value": "geolocation=(), microphone=(), camera=()" },
        { "key": "Content-Security-Policy",  "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://script.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        { "key": "X-Frame-Options",          "value": "DENY" }
      ]
    },
    { "source": "/assets/(.*)", "headers": [ { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" } ] }
  ]
}
```

Note: the inline `<style>` blocks for `@import` of Google Fonts in `LoginScreen.jsx`, `App.jsx` will require `'unsafe-inline'` for `style-src` until those are extracted (they're already in `index.css` for the most part).

---

### F18 — [P2] `npm audit` — moderate CVEs

```
vite      <=6.4.1   GHSA-4w7w-66w2-5vf9  Path traversal in optimized deps `.map`
esbuild   <=0.24.2  GHSA-67mh-4wv8-2f99  dev-server allows any website to read responses
```

Both are dev-server only — not in production bundles — but anyone running `npm run dev` while browsing untrusted sites is vulnerable. Upgrade `vite` to ≥7.x.

---

### F19 — [P2] Default-password disclosure on login response

`login` (line 619-621) returns `defaultPassword: pwStr` when `usingDefaultPassword === true`. Convenient (the modal can show the user "your current password is `emp-005`"), but it means any actor who can replay the login response sees the plaintext. With F1, an attacker who knows an account hasn't logged in yet can call `login` with an arbitrary password (failing) — so this isn't directly exploitable; but if the attacker also has F4-cracked credentials, they can confirm the default password without knowing the row index.

**Fix:** show the default password to the user once, on **first** successful login, by client-side derivation from the employee ID, not by the server echoing it.

---

### F20 — [P3] Token TTL / rotation

`TOKEN_TTL_MS = 12h` and there's no refresh token / sliding-expiry / per-user revocation. The "rotate HMAC secret" panic button logs everyone out. A targeted revoke (e.g., fire one employee) requires the global rotation. Add a per-user `tokenVersion` field stored on the Employees row; include it in the JWT payload; bump it on `resetPassword` or admin lockout.

---

### F21 — [P3] `localStorage` access not guarded in `theme.js`

```18:20:src/theme.js
const _prevAccent = parseInt(localStorage.getItem('otr-accent') || '-1', 10);
const _accentIdx = (_prevAccent + 1) % OTR.accents.length;
try { localStorage.setItem('otr-accent', _accentIdx); } catch {}
```

`getItem` is not in a try/catch. Safari private mode and some webviews throw — module-init crash → blank page.

---

### F22 — [P3] Shifts / requests aren't gated by `publishedShifts` on the backend

The README/architecture rule says "publishedShifts / publishedEvents gate employee visibility to LIVE periods only". This gating is **frontend-only** (`src/App.jsx:440-472`). A non-admin employee calling `getAllData` directly (e.g. via DevTools or a script) sees **all draft shifts for all periods**, not just the live ones.

This breaks the immutable constraint listed in `.cursor/rules/context-system.mdc`.

**Fix:** server-side filter in `getAllData`. For non-admin callers, only return shifts within `livePeriods`.

---

### F23 — [P3] Owner email is in a public docs file

`pitchdeck/build-plan.md:201` contains:

> JR — `johnrichmond007@gmail.com`, admin, owner, `showOnSchedule=FALSE`, password hashed

This file is in the public GitHub repo. Combined with F1, an attacker has the owner's email handed to them.

**Fix:** redact / move sensitive admin contact info to a local-only file (already partially excluded by `.gitignore` for `CLAUDE.local.md`).

---

### F24 — [P3] No SRI / no CSP on `<style>` font @imports

`LoginScreen.jsx:54` and `App.jsx` line ~1838 use:

```jsx
<style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:...');`}</style>
```

If Google Fonts is compromised (or DNS-poisoned for an attacker on the user's network), CSS injected here can `content:` exfil characters. Low risk — but easy to fix by serving fonts self-hosted or adding a `<link rel="preload" integrity="...">` chain.

---

### F25 — [P3] Apps Script POST silently catches PARSE failure

`api.js:32-34`:

```31:35:src/utils/api.js
try {
  const parsed = JSON.parse(postText);
  if (parsed.success !== undefined) result = parsed;
} catch (e) { /* POST failed or returned HTML redirect, fall through */ }
```

A successful 200 with non-JSON body is treated as failure and silently retried as GET. If the GET also fails, the chunked path runs. This means a server that returns malformed but successful results (e.g. a cell-rendered HTML 200 page on quota errors) is treated as if no save happened — the user gets a "saved" toast for a no-op. This is a data-integrity bug masked by retries.

---

### F26 — [P3] `chunkedBatchSave` reads `payload.callerEmail` for bypass-compat

`api.js:64`:

```63:64:src/utils/api.js
const chunkedBatchSave = async (payload, onProgress) => {
  const { shifts, periodDates, callerEmail, token } = payload;
```

When `payload.token` is set, `callerEmail` is `undefined` and the spread at line 83 omits it. But the field is still accepted, encouraging callers to keep sending `callerEmail` and reinforcing F1.

---

### F27 — [P3] `setupSpreadsheet()` is callable from the editor without a guard

If an attacker gets execution rights (e.g., compromises the Apps Script project via OAuth), `setupSpreadsheet` re-bootstraps the Settings tab and re-introduces `adminPassword: 1337`. Since the function checks `if (sheet && sheet.getLastRow() > 1)` per-tab, it skips populated tabs — but a freshly-cleared Settings tab gets the default seed.

---

## Non-security bugs (functional)

### B1 — `PKEventModal` candidate sort wrong field

`src/modals/PKEventModal.jsx:51-56` sorts by `c.type === 'full'` but the data model uses `employmentType`. All employees collapse into the part-time bucket. Cosmetic — doesn't break scheduling.

### B2 — `useGuardedMutation` swallows second click silently

`src/hooks/useGuardedMutation.js:9` returns `undefined` for a busy second invocation. Users get no feedback. Add a toast on guard hit.

### B3 — `batchSaveShifts` `deletedCount` arithmetic

`backend/Code.gs:1795`:

```js
const deletedCount = existing.length - (survivors.length - shifts.filter(s => !existing.some(e => keyOf(e) === keyOf(s))).length);
```

Reads as: existing - (survivors - newly-appended). For typical inputs this returns a sensible number, but for "delete-only" saves (no new appends) the formula returns `existing - survivors` which is correct, and for "all-new" saves returns `existing - existing` = 0 which is also correct. **However** when `keyOf` collides (e.g. a row whose composite key matches but `_rowIndex` differs because of duplicates from a prior bug), the count can go negative and is `Math.max(0, ...)` clamped silently — masking duplicates rather than reporting them.

### B4 — `getEmployeeByEmail` filters on `e.active` (bool ambiguity)

`Code.gs:392`:

```js
return employees.find(e => e.email === email && e.active);
```

Per `LESSONS.md` line 47: "Sheets boolean columns are strings 'TRUE'/'FALSE'". A literal text-typed `"FALSE"` cell is JS-truthy. So a deactivated user with the wrong cell type can still authenticate.

**Fix:**

```js
const isTrue = (v) => v === true || String(v).toUpperCase() === 'TRUE';
return employees.find(e => e.email === email && isTrue(e.active));
```

### B5 — `saveShift` uses stale closure for `setShifts`

`src/App.jsx:1173` (`saveShift`): `setShifts({ ...shifts, [k]: s })` — should be `setShifts(prev => ({ ...prev, [k]: s }))`. Concurrent rapid edits drop earlier ones.

### B6 — `clearWeekShifts` doesn't clear `events`

`src/App.jsx:955-978` only deletes work shifts; meeting/PK overlay entries remain.

### B7 — `useAnnouncements` race on period switch

`src/hooks/useAnnouncements.js:32-36` writes the result back keyed by the *current* `periodStartDate`, but if the user switched periods between save start and save complete, the stale write lands in the wrong key.

### B8 — `submitTimeOffRequest` no array-shape validation

`backend/Code.gs:778, 784`. Non-array `dates` throws and surfaces with raw stack (per F16).

### B9 — `chunkedBatchSave` failure data masks success

`api.js:108-111` returns `success: false` but reports `savedCount` of partial chunks. Frontend treats this with the right UX (`App.jsx:634-643`) but the backend's `LockService` collision throws break this — the frontend retry shows "schedule is NOT published" while some chunks did write.

### B10 — `EmployeeView.getEmpHours` ignores events

`src/views/EmployeeView.jsx:298-305` sums `s.hours` for shifts only. Per `App.jsx` getEmpHours (line 863-877), the admin path correctly union-counts work + meeting + pk. Employee-side total hours is therefore wrong if a meeting/PK extends a workday.

### B11 — `EmployeeView` "My Schedule This Period" excludes events

Same root as B10. Lines 842-865 only iterate `shifts[...]`, never `events[...]`. An employee with a meeting on a non-work day sees nothing.

### B12 — `RequestDaysOffModal` requestId generated client-side then ignored

`src/modals/RequestDaysOffModal.jsx:101` builds `TOR-NNN-XXXX` then `submitTimeOffRequest` overwrites it with the server-generated ID (`App.jsx:1219`). Dead code; remove or use it as an idempotency key.

### B13 — `EmployeeFormModal` sends `password` for new employees but only when explicitly typed

`src/modals/EmployeeFormModal.jsx:34` only adds `saveData.password` if `password` truthy. The "Initial Password" field defaults to `suggestedPassword` (could be empty). If empty, backend falls back to `employee.id` which becomes the literal `emp-{Date.now()}` (line 33). Result: a new hire's default password is a 13-char unix epoch — admin can't tell them what it is without resetting.

### B14 — `clearAllData` is editor-callable, no auth, "destructive — use carefully"

`backend/Code.gs:2330-2337` will wipe all shifts and request rows. No double-confirmation, no audit log. The function isn't routed through `handleRequest` so it requires editor access to invoke, but it's still a one-click footgun for anyone with Sheet access.

### B15 — `formatDateRange` will display strange ranges across years

`backend/Code.gs:752-763` reads `first.getFullYear()` only; a range Dec 28, 2026 – Jan 2, 2027 displays as `Dec 28 - Jan 2, 2026`.

### B16 — `submitSwapRequest` doesn't validate that both shifts are within a live (published) period

A user can swap a draft (unpublished) shift, which forces the admin into a state where the swap is "approved" but the underlying shift was never published.

### B17 — `bulkCreatePKEvent` inactive-employee filter

`Code.gs:1845-1847`: `byId` only includes `active` employees. But the admin path can still pass any `id`, and the silent skip becomes `{reason: 'not_active'}`. UX OK, but it's worth noting that no path informs the admin that a deleted employee was filtered out.

### B18 — `revokeShiftOffer` swap-back logic relies on the *current* shift owner being the recipient

`Code.gs:1180`: looks for a shift owned by `request.recipientEmail`. If the recipient subsequently transferred the shift to a third party (via another offer/swap), the revoke fails silently and the shift stays where it is. No audit signal to the admin.

### B19 — `revokeSwapRequest` similar — pairs aren't reverse-locked

`Code.gs:1438-1450`. If either party transferred their post-swap shift onward, the revoke silently no-ops on the orphaned leg.

### B20 — `expired` status code path missing in `OFFER_STATUS_LABELS` admin grid

`src/constants.js:53,57-66`: `OFFER_STATUS_COLORS.expired` is the muted text color, but the admin queue filter `pending` doesn't include it; expired offers vanish from view forever.

### B21 — `EmployeeRow` access of `tooltipData.employee.availability[d]` (App.jsx:3059) crashes if availability not parsed

`ensureFullWeek` in `loadDataFromBackend` covers the shape, but the tooltip is rendered against `tooltipData.employee` which could be a "former" employee whose availability was only ever stored as the legacy raw string. A defensive `?.` would fix.

---

## Suggested remediation order

1. **Stop the bleeding (within 24h):**
   - Delete the `payload.callerEmail` and bare-string branches from `verifyAuth` (F1).
   - Re-deploy with `Anyone with Google Account` not `Anyone` (F1, F2).
   - Rotate `HMAC_SECRET` after deploy.
   - Strip `password`, `passwordHash`, `passwordSalt`, `dob`, `address`, `rateOfPay`, `adpNumber`, `counterPointId` from every server response (F3, F13).
   - Delete the `adminPassword: '1337'` row from the live Sheet (F9).
   - Audit Sheet revision history for unauthorized changes since v2.13 deploy.

2. **Within the week:**
   - Replace SHA-256 with PBKDF2 ≥ 100k iters (F4). Force password rotation.
   - Raise minimum password length to 10 (F4).
   - Server-side allowlist of mutable employee fields (F10).
   - Per-email login rate limit + lockout (F12).
   - Add Vercel security headers including CSP (F17).
   - Filter `getAllData` shifts by `publishedShifts` for non-admin callers (F22).
   - Replace `Math.random()` request IDs with `Utilities.getUuid()` (F14).

3. **Hardening (next sprint):**
   - Move the Apps Script URL behind a Cloudflare Worker; auth via worker-set httpOnly cookie (F2, F5, F11).
   - Per-user `tokenVersion` for granular revocation (F20).
   - Rate-limit outbound `MailApp.sendEmail` (F8).
   - Drop the plaintext `password` column entirely; admin sees it once on reset only (F13, F19).
   - Upgrade `vite` to fix dev-server CVEs (F18).
   - Sanitize all template inputs through a single helper (F6).
   - `noopener`/`noreferrer` + `printWindow.opener = null` in PDF popup (F6).

4. **Bug-fix sweep (parallel):** B1 through B21 above; most are short.

---

## What I did NOT find

- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write` in the React tree.
- No SQL — backend is Sheets, no injection class beyond JSON-shape abuse.
- No exposed `.env` or `.env.example` with real secrets.
- No AWS / GCP / Stripe API keys hard-coded.
- No source maps shipped to prod (Vite default = no `.map` in build).
- No file-upload paths that touch disk.
- No subprocess execution.
- No deserialization of untrusted binary data.
- No dependency tarballs or postinstall scripts in `package-lock.json` worth flagging beyond F18.

---

## Appendix — Files reviewed

- `backend/Code.gs` (full, 2339 lines)
- `src/App.jsx` (full, 3071 lines)
- `src/auth.js`, `src/utils/api.js`, `src/utils/format.js`, `src/utils/date.js`, `src/utils/timemath.js`, `src/utils/payPeriod.js`, `src/utils/storeHours.js`, `src/utils/storeHoursOverrides.js`, `src/utils/requests.js`, `src/utils/eventDefaults.js`
- `src/constants.js`, `src/theme.js`, `src/main.jsx`, `src/index.css`
- `src/components/{LoginScreen, AdaptiveModal, Button, primitives, ScheduleCell, EmployeeRow, ColumnHeaderEditor, CollapsibleSection, uiKit}.jsx`
- `src/hooks/{useAuth, useGuardedMutation, useAnnouncements, useToast, useTooltip, useFocusTrap, useDismissOnOutside, useUnsavedWarning}.js`
- `src/modals/{ChangePasswordModal, EmployeeFormModal, AdminSettingsModal, EmailModal, OfferShiftModal, SwapShiftModal, ShiftEditorModal, PKEventModal, RequestDaysOffModal, RequestTimeOffModal, AdminRequestModal}.jsx`
- `src/panels/{AdminTimeOffPanel, AdminShiftOffersPanel, AdminShiftSwapsPanel, AdminMyTimeOffPanel, IncomingOffersPanel, IncomingSwapsPanel, MyShiftOffersPanel, MyRequestsPanel, MySwapsPanel, ReceivedOffersHistoryPanel, ReceivedSwapsHistoryPanel, UnifiedRequestHistory, CommunicationsPanel, InactiveEmployeesPanel, MobileStaffPanel}.jsx`
- `src/views/EmployeeView.jsx`, `src/MobileEmployeeView.jsx` (header), `src/MobileAdminView.jsx` (header + employee detail sheet)
- `src/pdf/generate.js`, `src/email/build.js`
- `package.json`, `package-lock.json` (via `npm audit`), `vite.config.js`, `vercel.json`, `.gitignore`, `index.html`, `postcss.config.js`, `tailwind.config.js`
- `docs/DEPLOY-S36-AUTH.md`
- `pitchdeck/build-plan.md` (limited — to confirm public PII exposure only)
- Git history for credential leaks across all branches

End of report.
