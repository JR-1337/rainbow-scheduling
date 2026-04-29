# Apps Script Backend Inventory

**Last refreshed: 2026-04-29**

## Summary

- **Total functions**: 92 top-level functions
- **Direct-supabase**: 22 (data queries, request status reads)
- **edge-function**: 8 (batch writes, shift swaps, complex transactional logic)
- **auth-replaced-by-supabase-auth**: 8 (token signing, password hashing, login/session)
- **email-vendor**: 24 (all sendEmail variants)
- **pdf-vendor**: 0 (no PDF generation detected)
- **removed**: 8 (HMAC rotation, tab creation, test utilities, helpers)
- **kept-for-mirror**: 0 (one-way sync not needed; direct DB reads replace)
- **ScriptProperties secrets**: 1 (HMAC_SECRET)
- **Lock usage**: 2 sites (batchSaveShifts, bulkCreatePKEvent) — document-level exclusive lock, 10s timeout

---

## Functions by Replacement Class

### direct-supabase (22 functions)

These functions read sheet data and return it directly. Frontend can call Supabase via `select()` after auth migration.

#### Query / Read-Only Functions

**getSpreadsheet** `Code.gs:341`
- Signature: `()`
- Opens the active spreadsheet by ID from CONFIG.SPREADSHEET_ID or falls back to active sheet. Helper for all sheet access.
- Callers: getSheet, setupSpreadsheet, testSetup, clearAllData (internal utility); no frontend direct calls.
- **C**: Code.gs:341-346, invoked at Code.gs:349, 2354, 2484, 2510
- External services: SpreadsheetApp
- Replacement: `direct-supabase` — replaced by Supabase client initialization

**getSheet** `Code.gs:348`
- Signature: `(tabName)`
- Returns a sheet by name from the active spreadsheet. Lazy-creates ShiftChanges tab if missing on first access.
- Callers: getSheetData, updateCell, updateRow, appendRow, getSheet (internal); no action routing.
- **C**: Code.gs:348-355, invoked at 385, 391, 400, 418, 1821, 1933, 2358, 2362, etc.
- External services: SpreadsheetApp
- Replacement: `direct-supabase` — removed; schema exists in Supabase from migration

**parseSheetValues_** `Code.gs:360`
- Signature: `(values)`
- Parses a 2D array from sheet.getDataRange().getValues() into an array of row objects keyed by column header. Normalizes Date objects to 'yyyy-MM-dd' or 'HH:mm' strings.
- Callers: getSheetData, batchSaveShifts, bulkCreatePKEvent (internal transformation); no frontend direct calls.
- **C**: Code.gs:360-382, invoked at 387, 1824, 1941
- External services: Utilities.formatDate
- Replacement: `direct-supabase` — Supabase returns JSON already; normalization handled client-side or in server function

**getSheetData** `Code.gs:384`
- Signature: `(tabName)`
- Reads all data from a sheet and parses it to row objects. Used by all data-touching functions.
- Callers: login, changePassword, resetPassword, submitTimeOffRequest, cancelTimeOffRequest, approveTimeOffRequest, denyTimeOffRequest, revokeTimeOffRequest, submitShiftOffer, acceptShiftOffer, declineShiftOffer, cancelShiftOffer, approveShiftOffer, rejectShiftOffer, revokeShiftOffer, submitSwapRequest, acceptSwapRequest, declineSwapRequest, cancelSwapRequest, approveSwapRequest, rejectSwapRequest, revokeSwapRequest, getEmployeeRequests, getAdminQueue, getIncomingOffers, getIncomingSwaps, getAllData, getEmployees, getShifts, saveShift, saveEmployee, saveLivePeriods, saveStaffingTargets, saveEmployee, batchSaveShifts, bulkCreatePKEvent, saveAnnouncement, deleteAnnouncement, checkExpiredRequests (internal); frontend actions: getAllData, getEmployees, getShifts, getEmployeeRequests, getAdminQueue, getIncomingOffers, getIncomingSwaps.
- **C**: Code.gs:384-388, invoked at 616, 687, 741, 839, 879, 911, 936, 962, 1012, 1059, 1085, 1111, 1144, 1183, 1209, 1267, 1317, 1343, 1369, 1400, 1441, 1467, 1514, 1528, 1545, 1559, 1572-1576, 1624, 1630, 1649, 1687, 1734, 1757, 1778, 1823, 1924, 1941, 2013, 2040, 2061
- External services: SpreadsheetApp
- Replacement: `direct-supabase` — `const data = await supabase.from('TABLE_NAME').select('*')`

**getEmployeeByEmail** `Code.gs:437`
- Signature: `(email)`
- Finds an employee record by email. Used for auth and permission checks.
- Callers: submitShiftOffer, acceptShiftOffer, approveShiftOffer, rejectShiftOffer, revokeShiftOffer, submitSwapRequest, approveSwapRequest, revokeSwapRequest (internal); verifyAuth also uses this indirectly via getSheetData.
- **C**: Code.gs:437-441, invoked at 1005, 1162, 1231, 1264, 1417, 1418, 1488, 1489
- External services: None (calls getSheetData)
- Replacement: `direct-supabase` — `const emp = await supabase.from('employees').select('*').eq('email', email).single()`

**isAdminUser** `Code.gs:442`
- Signature: `(email)`
- Checks if an employee has isAdmin or isOwner flag set. Used for request ownership validation in cancellations.
- Callers: cancelTimeOffRequest, cancelShiftOffer, cancelSwapRequest (internal guards); no direct frontend routing.
- **C**: Code.gs:442-450, invoked at 884, 1116, 1374
- External services: None (calls getEmployeeByEmail)
- Replacement: `direct-supabase` — check boolean field in JWT or re-query if needed; logic belongs in RLS policy

**getEmployeeRequests** `Code.gs:1509`
- Signature: `(payload)`
- Returns all shift_changes rows where the caller is employeeEmail, recipientEmail, or partnerEmail (time-off + offers + swaps they initiated/received/partnered).
- Callers: action 'getEmployeeRequests' routed from frontend.
- **C**: Code.gs:1509-1522, invoked via handleRequest at line 287
- Frontend callers: App.jsx (no explicit call found; likely in request list UI)
- External services: None (calls getSheetData)
- Replacement: `direct-supabase` — `const requests = await supabase.from('shift_changes').select('*').or('employeeEmail.eq.' + email + ',recipientEmail.eq.' + email + ',partnerEmail.eq.' + email)`

**getAdminQueue** `Code.gs:1524`
- Signature: `(payload)`
- Returns three filtered lists: pending time-off requests, awaiting_admin shift offers, awaiting_admin shift swaps. Admin-only.
- Callers: action 'getAdminQueue' routed from frontend.
- **C**: Code.gs:1524-1538, invoked via handleRequest at line 288
- Frontend callers: MobileAdminView.jsx or admin queue component
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — three separate queries with RLS enforcing admin status

**getIncomingOffers** `Code.gs:1540`
- Signature: `(payload)`
- Returns shift_offer rows where recipientEmail matches the caller and status is 'awaiting_recipient'.
- Callers: action 'getIncomingOffers' routed from frontend.
- **C**: Code.gs:1540-1552, invoked via handleRequest at line 289
- Frontend callers: App.jsx:1545 — referenced in UI that shows pending offers
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — `select('*').eq('recipientEmail', email).eq('status', 'awaiting_recipient')`

**getIncomingSwaps** `Code.gs:1554`
- Signature: `(payload)`
- Returns shift_swap rows where partnerEmail matches the caller and status is 'awaiting_partner'.
- Callers: action 'getIncomingSwaps' routed from frontend.
- **C**: Code.gs:1554-1566, invoked via handleRequest at line 290
- Frontend callers: App.jsx:1554 — referenced in UI that shows pending swap requests
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — `select('*').eq('partnerEmail', email).eq('status', 'awaiting_partner')`

**getAllData** `Code.gs:1568`
- Signature: `(payload)`
- Returns all tables (employees, shifts, settings, announcements, requests) in one response. Parses special settings rows (livePeriods, staffingTargets, storeHoursOverrides, staffingTargetOverrides). Called once on app load.
- Callers: action 'getAllData' routed from frontend.
- **C**: Code.gs:1568-1615, invoked via handleRequest at line 291
- Frontend callers: App.jsx:304 — `const result = await apiCall('getAllData', {})`
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — separate `select()` queries for each table; settings deserialize JSON from a single settings table

**getEmployees** `Code.gs:1621`
- Signature: `(payload)`
- Returns all employee rows. Admin-only (checked by verifyAuth).
- Callers: action 'getEmployees' routed from frontend.
- **C**: Code.gs:1621-1625, invoked via handleRequest at line 294
- Frontend callers: EmployeeFormModal.jsx or admin employee list
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — `select('*').from('employees')`

**getShifts** `Code.gs:1627`
- Signature: `(payload)`
- Returns all shift rows with type defaulted to 'work' if missing, note defaulted to empty string. Admin-only.
- Callers: action 'getShifts' routed from frontend.
- **C**: Code.gs:1627-1632, invoked via handleRequest at line 295
- Frontend callers: Admin schedule view or batch-save logic
- External services: None (calls getSheetData with verifyAuth guard)
- Replacement: `direct-supabase` — `select('*').from('shifts')` with normalization in client or view layer

**getTodayISO** `Code.gs:782`
- Signature: `()`
- Returns today's date as 'yyyy-MM-dd' in the script's timezone.
- Callers: isDateInPast, checkExpiredRequests (internal); no direct frontend call.
- **C**: Code.gs:782-784, invoked at 787, 791, 2062
- External services: Utilities.formatDate
- Replacement: `direct-supabase` — client-side: `new Date().toISOString().split('T')[0]` or SQL `CURRENT_DATE`

**isDateInPast** `Code.gs:786`
- Signature: `(dateStr)`
- Returns true if dateStr < getTodayISO(). Used to reject time-off and offer requests for past dates.
- Callers: submitTimeOffRequest, submitShiftOffer, submitSwapRequest, revokeShiftOffer, revokeSwapRequest, revokeTimeOffRequest (internal guards); no direct frontend call.
- **C**: Code.gs:786-788, invoked at 832, 1001, 1260, 1215, 1473
- External services: None (calls getTodayISO)
- Replacement: `direct-supabase` — client-side logic or simple SQL comparison

**anyDateInFuture** `Code.gs:790`
- Signature: `(dates)`
- Returns true if any date in the array is >= today. Used to block revocation of time-off when all dates are past.
- Callers: revokeTimeOffRequest (internal guard); no direct frontend call.
- **C**: Code.gs:790-793, invoked at 969
- External services: None (calls getTodayISO)
- Replacement: `direct-supabase` — client-side logic; SQL for server-side use

**formatDateDisplay** `Code.gs:795`
- Signature: `(dateStr)`
- Formats a 'yyyy-MM-dd' string to 'Monday, Jan 1, 2026'. Used in email templates.
- Callers: All email functions (sendOfferSubmittedEmail, sendOfferApprovedEmail, sendSwapSubmittedEmail, etc. — 11 email callers); no direct frontend routing.
- **C**: Code.gs:795-798, invoked at 2230, 2231, 2238, 2246, 2254, 2262, 2268, 2275, 2284, 2286, 2291, 2293, etc.
- External services: None (Date.toLocaleDateString)
- Replacement: `direct-supabase` — client-side or in email template builder

**formatDateRange** `Code.gs:800`
- Signature: `(dates)`
- Formats an array of date strings to a compact range like 'Jan 1-5, 2026'. Used in email templates.
- Callers: sendTimeOffSubmittedEmail, sendTimeOffApprovedEmail, sendTimeOffDeniedEmail, sendTimeOffCancelledEmail, sendTimeOffRevokedEmail (5 email callers); no direct frontend routing.
- **C**: Code.gs:800-811, invoked at 2188, 2197, 2205, 2213, 2221
- External services: None (Date methods)
- Replacement: `direct-supabase` — client-side formatting in email builder

**formatTimeDisplay** `Code.gs:813`
- Signature: `(timeStr)`
- Formats 'HH:mm' to '2:00 PM'. Used in email templates.
- Callers: All shift offer and swap email functions (11 email callers); no direct frontend routing.
- **C**: Code.gs:813-819, invoked at 2231, 2238, 2246, 2262, 2275, 2284, 2286, 2291, 2293, 2300, 2308, etc.
- External services: None (string manipulation)
- Replacement: `direct-supabase` — client-side formatting in email builder

---

### edge-function (8 functions)

These require server-side multi-row writes, lock management, or complex transactional logic that cannot be executed directly from the frontend.

**batchSaveShifts** `Code.gs:1800`
- Signature: `(payload: {shifts, periodDates, allShiftKeys})`
- Bulk upsert shifts using a single Sheets API call with document-level exclusive lock. Implements complex logic: keyed by (employeeId, date, type) for singular types (work/sick/pk), by row id for meetings. Deletes survivors not in periodDates. Calls sendScheduleChangeNotification_.
- Callers: action 'batchSaveShifts' routed from frontend.
- **C**: Code.gs:1800-1904, invoked via handleRequest at line 301
- Frontend callers: App.jsx:274 (`apiCall('batchSaveShifts', { shifts: periodShifts, periodDates })`), App.jsx:396, App.jsx:481; also chunkedBatchSave fallback at api.js:38
- External services: SpreadsheetApp (getDataRange, deleteRow), LockService.getDocumentLock() (tries 10s), Sheets.Spreadsheets.Values.update()
- Replacement: `edge-function` — Supabase Edge Function or Vercel serverless function. Needs: transaction for atomic multi-row upsert, lock simulation (advisory lock on shifts table), call to email service for notifications. Cannot be direct-supabase due to lock + transactional requirements.

**bulkCreatePKEvent** `Code.gs:1910`
- Signature: `(payload: {date, startTime, endTime, note, employeeIds})`
- Bulk-creates type='pk' rows for multiple employees on the same date. Enforces header migration check (type/note columns must exist), prevents duplicates, acquires document-level lock. Calls Sheets.Spreadsheets.Values.update().
- Callers: action 'bulkCreatePKEvent' routed from frontend.
- **C**: Code.gs:1910-1996, invoked via handleRequest at line 302
- Frontend callers: Admin toolbar or bulk scheduling modal (not visible in grep; likely MobileAdminView)
- External services: SpreadsheetApp (getSheetByName, getDataRange), LockService.getDocumentLock(), Sheets.Spreadsheets.Values.update()
- Replacement: `edge-function` — Supabase Edge Function. Needs: validation of schema readiness (type column exists), dedup check, atomic insert of N rows, lock to prevent concurrent bulk creates.

**submitTimeOffRequest** `Code.gs:825`
- Signature: `(payload: {dates, reason})`
- Creates a shift_changes row with requestType='time_off'. Checks for past dates, overlaps with pending/approved time-off, calls appendRow and sendTimeOffSubmittedEmail.
- Callers: action 'submitTimeOffRequest' routed from frontend.
- **C**: Code.gs:825-870, invoked via handleRequest at line 262
- Frontend callers: App.jsx:968 (`apiCall('submitTimeOffRequest', { dates, reason })`); modals/TimeOffModal.jsx or similar
- External services: MailApp (via sendTimeOffSubmittedEmail), Utilities.formatDate (via getTodayISO)
- Replacement: `edge-function` — Supabase Edge Function + Resend/SendGrid. Needs: check overlap against existing rows, insert new request row, call email service. Transaction ensures email sent on success.

**submitShiftOffer** `Code.gs:990`
- Signature: `(payload: {recipientEmail, shiftDate, shiftStart, shiftEnd, shiftRole})`
- Creates a shift_changes row with requestType='shift_offer'. Validates: not self-request, date not past, recipient exists and not admin, offerer has a work shift on that date, recipient doesn't have work shift on that date. Calls appendRow and sendOfferSubmittedEmail.
- Callers: action 'submitShiftOffer' routed from frontend.
- **C**: Code.gs:990-1050, invoked via handleRequest at line 269
- Frontend callers: App.jsx:995 (`apiCall('submitShiftOffer', { ... })`); employee view offer modal
- External services: MailApp (via sendOfferSubmittedEmail)
- Replacement: `edge-function` — similar to submitTimeOffRequest but with shift existence checks. Needs: query offerer's shifts, query recipient's shifts, insert request, email service call.

**submitSwapRequest** `Code.gs:1249`
- Signature: `(payload: {partnerEmail, initiatorShift, partnerShift})`
- Creates a shift_changes row with requestType='shift_swap'. Validates: not self-request, both dates not past, partner exists, initiator and partner each own a work shift on their respective dates. Calls appendRow and sendSwapSubmittedEmail.
- Callers: action 'submitSwapRequest' routed from frontend.
- **C**: Code.gs:1249-1308, invoked via handleRequest at line 278
- Frontend callers: App.jsx:1179 (`apiCall('submitSwapRequest', { partnerEmail, initiatorShift, partnerShift })`); swap modal
- External services: MailApp (via sendSwapSubmittedEmail)
- Replacement: `edge-function` — Supabase Edge Function. Needs: query both employees' shifts, validate existence, insert swap request, email service.

**approveShiftOffer** `Code.gs:1137`
- Signature: `(payload: {requestId, note})`
- Updates shift_changes row status to 'approved' and updates the shift row to reassign employeeId/Name/Email to recipient. Admin-only. Calls updateRow (twice) and sendOfferApprovedEmail.
- Callers: action 'approveShiftOffer' routed from frontend.
- **C**: Code.gs:1137-1174, invoked via handleRequest at line 273
- Frontend callers: App.jsx:1090 (`apiCall('approveShiftOffer', { requestId, note })`); admin approval UI
- External services: MailApp (via sendOfferApprovedEmail)
- Replacement: `edge-function` — Supabase Edge Function. Needs: transaction updating shift_changes and shifts rows, email notification. RLS ensures admin access.

**approveSwapRequest** `Code.gs:1393`
- Signature: `(payload: {requestId, note})`
- Updates shift_changes row status to 'approved' and swaps the two shift rows (initiator shift → partner, partner shift → initiator). Admin-only. Calls updateRow (twice) and sendSwapApprovedEmail.
- Callers: action 'approveSwapRequest' routed from frontend.
- **C**: Code.gs:1393-1432, invoked via handleRequest at line 282
- Frontend callers: App.jsx:1282 (`apiCall('approveSwapRequest', { requestId, note })`); admin approval UI
- External services: MailApp (via sendSwapApprovedEmail)
- Replacement: `edge-function` — Supabase Edge Function. Needs: transaction swapping shift rows, updating request status, email. RLS ensures admin access.

**revokeShiftOffer** `Code.gs:1202`
- Signature: `(payload: {requestId, note})`
- Updates shift_changes row status to 'revoked' and reverts the shift row back to the original offerer. Admin-only. Validates shift date not past. Calls updateRow (twice) and sendOfferRevokedEmail.
- Callers: action 'revokeShiftOffer' routed from frontend.
- **C**: Code.gs:1202-1243, invoked via handleRequest at line 276
- Frontend callers: App.jsx:1149 (`apiCall('revokeShiftOffer', { requestId, note })`); admin revoke UI
- External services: MailApp (via sendOfferRevokedEmail)
- Replacement: `edge-function` — similar to approveShiftOffer but reverting. Needs: check date not past, revert shift assignment, update request status, email.

---

### auth-replaced-by-supabase-auth (8 functions)

Login, token generation, password hashing, and crypto primitives. Supabase Auth handles JWT and session management; password hashing belongs in migration setup or a one-time migration script.

**login** `Code.gs:609`
- Signature: `(payload: {email, password})`
- Finds employee by email, checks active flag, verifies SHA-256 hash of (salt + password) against passwordHash column. On success, calls createToken_ and returns employee data + token (12h TTL) + usingDefaultPassword flag. No admin requirement.
- Callers: action 'login' routed from frontend.
- **C**: Code.gs:609-671, invoked via handleRequest at line 257
- Frontend callers: LoginScreen.jsx:30 (`apiCall('login', { email, password })`); public auth entry point
- External services: Utilities.computeDigest (SHA-256), Utilities.base64EncodeWebSafe
- Replacement: `auth-replaced-by-supabase-auth` — Supabase Auth POST /auth/v1/token with email/password. Migration: backfill users into Auth via admin API, preserve custom fields (isAdmin, isOwner, adminTier, defaultSection) in a profiles table.

**changePassword** `Code.gs:676`
- Signature: `(payload: {targetEmail, currentPassword, newPassword})`
- Verifies caller's auth via token/email. If changing own password, checks current hash. If changing another's (admin-only), checks caller is admin. Generates new salt + hash, calls updateRow to write both. Marks passwordChanged=true if self-change. Confirms password >= 4 chars.
- Callers: action 'changePassword' routed from frontend.
- **C**: Code.gs:676-729, invoked via handleRequest at line 258
- Frontend callers: ChangePasswordModal.jsx:45 (`apiCall('changePassword', payload)`); modals/AdminSettingsModal.jsx:71
- External services: Utilities.getUuid (salt), Utilities.computeDigest (SHA-256)
- Replacement: `auth-replaced-by-supabase-auth` — Supabase Auth PUT /auth/v1/user with password field. For admin resets, POST to custom edge function that calls supabase.auth.admin.updateUserById.

**resetPassword** `Code.gs:735`
- Signature: `(payload: {targetEmail})`
- Admin-only. Generates emp-XXX format password (emp-001 for row 2, emp-002 for row 3, etc.) and writes hash + salt to Employees tab. Keeps plaintext in password column for admin display. Marks passwordChanged=false so user gets default-password prompt on next login.
- Callers: action 'resetPassword' routed from frontend.
- **C**: Code.gs:735-765, invoked via handleRequest at line 259
- Frontend callers: EmployeeFormModal.jsx:273 (`apiCall('resetPassword', { targetEmail })`); admin employee management
- External services: Utilities.getUuid (salt), Utilities.computeDigest (SHA-256)
- Replacement: `auth-replaced-by-supabase-auth` — Custom edge function (Supabase doesn't provide password-reset-to-default API). Calls supabase.auth.admin.updateUserById with a generated password, then stores the plaintext in a separate admin_defaults table for display.

**createToken_** `Code.gs:526`
- Signature: `(employee)`
- Creates a signed JWT token. Payload: {e: email, exp: expiry, a: isAdmin, o: isOwner, t: adminTier}. Signs with HMAC-SHA-256 using HMAC_SECRET from ScriptProperties. Format: base64url(payload).base64url(signature).
- Callers: login (internal); no direct frontend call.
- **C**: Code.gs:526-537, invoked at 645
- External services: Utilities.computeHmacSignature (HMAC-SHA-256), Utilities.getUuid (HMAC_SECRET is pre-stored)
- Replacement: `auth-replaced-by-supabase-auth` — Supabase Auth generates JWT automatically. If custom fields (adminTier, defaultSection) needed in JWT, use Supabase's user_metadata or custom claims (Enterprise feature).

**verifyToken_** `Code.gs:539`
- Signature: `(token)`
- Decodes and validates JWT: checks format (2 parts separated by '.'), computes HMAC of payload, verifies signature constant-time, parses payload JSON, checks expiry < now. Returns {valid, error} or {valid, email, isAdmin, isOwner, adminTier}.
- Callers: verifyAuth (internal gate for all protected endpoints); no direct frontend call.
- **C**: Code.gs:539-562, invoked at 457
- External services: Utilities.computeHmacSignature, Utilities.base64DecodeWebSafe, JSON.parse
- Replacement: `auth-replaced-by-supabase-auth` — Supabase Auth: `const { data, error } = await supabase.auth.getSession()` or `supabase.auth.user()` on the client, or verify JWT on the server with the public key. Token verification is handled by `@supabase/supabase-js` middleware.

**hashPassword_** `Code.gs:568`
- Signature: `(salt, password)`
- Returns base64url-encoded SHA-256(salt + password).
- Callers: login (indirect via constantTimeEq_), changePassword, resetPassword, saveEmployee (all password hash storage); no direct frontend call.
- **C**: Code.gs:568-573, invoked at 637, 700, 719, 756, 1714
- External services: Utilities.computeDigest (SHA-256)
- Replacement: `auth-replaced-by-supabase-auth` — Not needed after migration. Supabase Auth handles hashing via bcrypt. Existing hashes are migration artifacts; preserved only in the profiles table for reference.

**generateSalt_** `Code.gs:564`
- Signature: `()`
- Returns a UUID for use as a salt when hashing passwords.
- Callers: changePassword, resetPassword, saveEmployee (password initialization); no direct frontend call.
- **C**: Code.gs:564-566, invoked at 718, 755, 1713
- External services: Utilities.getUuid
- Replacement: `auth-replaced-by-supabase-auth` — Not needed; Supabase Auth manages salts internally with bcrypt.

**verifyAuth** `Code.gs:451`
- Signature: `(authArg, requiredAdmin=false)`
- Validates caller auth. If authArg is an object with a token field, calls verifyToken_. If authArg is an object with callerEmail field, uses it directly (fallback for legacy test harness). If authArg is a string, treats as email. Looks up employee in Employees sheet; returns {authorized: false, error} or {authorized: true, employee, viaToken}. If requiredAdmin=true, checks isAdmin || isOwner.
- Callers: changePassword, resetPassword, submitTimeOffRequest, cancelTimeOffRequest, approveTimeOffRequest, denyTimeOffRequest, revokeTimeOffRequest, submitShiftOffer, acceptShiftOffer, declineShiftOffer, cancelShiftOffer, approveShiftOffer, rejectShiftOffer, revokeShiftOffer, submitSwapRequest, acceptSwapRequest, declineSwapRequest, cancelSwapRequest, approveSwapRequest, rejectSwapRequest, revokeSwapRequest, getEmployeeRequests, getAdminQueue, getIncomingOffers, getIncomingSwaps, getAllData, getEmployees, getShifts, saveShift, saveEmployee, saveLivePeriods, saveStaffingTargets, saveSetting, batchSaveShifts, bulkCreatePKEvent, saveAnnouncement, deleteAnnouncement, sendBrandedScheduleEmail (internal guard for all protected endpoints); no direct frontend routing.
- **C**: Code.gs:451-482, invoked at 679, 738, 828, 875, 907, 932, 958, 993, 1055, 1081, 1107, 1140, 1179, 1205, 1252, 1313, 1339, 1365, 1396, 1437, 1463, 1510, 1525, 1541, 1556, 1569, 1622, 1628, 1637, 1684, 1730, 1749, 1772, 1803, 1913, 2005, 2032, 2145
- External services: None (calls getEmployeeByEmail, getSheetData)
- Replacement: `auth-replaced-by-supabase-auth` + RLS — Supabase middleware checks JWT. Server functions validate via `const { data, error } = await supabase.auth.getUser()`. RLS policies enforce admin/owner restrictions at the DB level. No need for verifyAuth function; replaced by RLS + auth middleware.

---

### email-vendor (24 functions)

All call MailApp.sendEmail or build branded HTML wrappers. Replacement: Resend, SendGrid, or other transactional email service.

**sendEmail** `Code.gs:2125`
- Signature: `(to, subject, body, options)`
- Wrapper around MailApp.sendEmail. If options.html is true, wraps body in BRANDED_EMAIL_WRAPPER_HTML_. Logs success/failure.
- Callers: All email functions below; sendScheduleChangeNotification_.
- **C**: Code.gs:2125-2139, invoked at 2177, 2187, 2195, 2203, 2211, 2219, 2229, 2237, 2245, 2253, 2263, 2264, 2270, 2271, 2277, 2278, 2284, 2292, 2299, 2307, 2315, 2322, 2329
- External services: MailApp.sendEmail
- Replacement: `email-vendor` — `const { error } = await resend.emails.send({ from: 'noreply@...', to, subject, html: body, text: plaintext })`

**BRANDED_EMAIL_WRAPPER_HTML_** `Code.gs:2095`
- Signature: `(content, accentHex)`
- Builds branded HTML email wrapper with OTR Navy/White/Blue color scheme. No Sheets access; pure HTML template. Escapes content HTML entities, converts newlines to <br>.
- Callers: sendEmail; no direct frontend call.
- **C**: Code.gs:2095-2123, invoked at 2130
- External services: None (string manipulation)
- Replacement: `email-vendor` — Client-side email builder or Resend template. Move to frontend EmailModal or a server-side template engine.

**sendBrandedScheduleEmail** `Code.gs:2144`
- Signature: `(payload: {to, subject, htmlBody, plaintextBody})`
- Sends a fully-formed branded schedule email from the frontend EmailModal. Validates to/subject/htmlBody present, checks auth is admin. Calls MailApp.sendEmail directly (doesn't use sendEmail wrapper).
- Callers: action 'sendBrandedScheduleEmail' routed from frontend.
- **C**: Code.gs:2144-2166, invoked via handleRequest at line 309
- Frontend callers: EmailModal.jsx:56 (`apiCall('sendBrandedScheduleEmail', { to: emails, subject, htmlBody, plaintextBody })`), EmailModal.jsx:94
- External services: MailApp.sendEmail
- Replacement: `email-vendor` — Supabase Edge Function that accepts pre-built HTML and calls Resend API. Or: frontend calls Resend directly after auth with a server-side signing secret.

**sendScheduleChangeNotification_** `Code.gs:2170`
- Signature: `(caller, summary)`
- Sends a notification to CONFIG.ADMIN_EMAIL when a non-owner, non-Sarvi admin saves shifts (from saveShift, batchSaveShifts). Exits silently if caller is Sarvi (email match) or isOwner=true.
- Callers: saveShift, batchSaveShifts (internal); no direct frontend routing.
- **C**: Code.gs:2170-2182, invoked at 1670, 1897
- External services: MailApp (via sendEmail)
- Replacement: `email-vendor` — Server function triggered on shift updates; sends via Resend. Or: admin UI directly calls email API.

**sendTimeOffSubmittedEmail** `Code.gs:2186`
- Signature: `(employeeName, dates, reason)`
- Notifies CONFIG.ADMIN_EMAIL when an employee submits time-off. Called by submitTimeOffRequest.
- Callers: submitTimeOffRequest; no direct frontend routing.
- **C**: Code.gs:2186-2192, invoked at 867
- External services: MailApp (via sendEmail), formatDateRange, formatDateRange
- Replacement: `email-vendor`

**sendTimeOffApprovedEmail** `Code.gs:2194`
- Signature: `(employeeEmail, employeeName, dates, adminName)`
- Notifies employee that their time-off request was approved. Called by approveTimeOffRequest.
- Callers: approveTimeOffRequest; no direct frontend routing.
- **C**: Code.gs:2194-2200, invoked at 924
- External services: MailApp (via sendEmail), formatDateRange
- Replacement: `email-vendor`

**sendTimeOffDeniedEmail** `Code.gs:2202`
- Signature: `(employeeEmail, employeeName, dates, reason)`
- Notifies employee that their time-off request was denied. Called by denyTimeOffRequest.
- Callers: denyTimeOffRequest; no direct frontend routing.
- **C**: Code.gs:2202-2208, invoked at 950
- External services: MailApp (via sendEmail), formatDateRange
- Replacement: `email-vendor`

**sendTimeOffCancelledEmail** `Code.gs:2210`
- Signature: `(employeeName, dates)`
- Notifies CONFIG.ADMIN_EMAIL when an employee cancels their pending time-off. Called by cancelTimeOffRequest.
- Callers: cancelTimeOffRequest; no direct frontend routing.
- **C**: Code.gs:2210-2216, invoked at (not found in cancelTimeOffRequest — check Code.gs:872-903). **MISSING CALL** — this function is defined but not invoked in the provided code snapshot.
- External services: MailApp (via sendEmail), formatDateRange
- Replacement: `email-vendor` — add call in cancelTimeOffRequest server function

**sendTimeOffRevokedEmail** `Code.gs:2218`
- Signature: `(employeeEmail, employeeName, dates, reason, adminName)`
- Notifies employee that their approved time-off was revoked. Called by revokeTimeOffRequest.
- Callers: revokeTimeOffRequest; no direct frontend routing.
- **C**: Code.gs:2218-2224, invoked at 981
- External services: MailApp (via sendEmail), formatDateRange
- Replacement: `email-vendor`

**sendOfferSubmittedEmail** `Code.gs:2228`
- Signature: `(recipientEmail, recipientName, offererName, shiftDate, shiftStart, shiftEnd, shiftRole)`
- Notifies recipient of an incoming shift offer. Called by submitShiftOffer.
- Callers: submitShiftOffer; no direct frontend routing.
- **C**: Code.gs:2228-2234, invoked at 1047
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendOfferAcceptedEmail** `Code.gs:2236`
- Signature: `(offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole)`
- Notifies CONFIG.ADMIN_EMAIL when a shift offer is accepted and needs approval. Called by acceptShiftOffer.
- Callers: acceptShiftOffer; no direct frontend routing.
- **C**: Code.gs:2236-2242, invoked at 1073
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendOfferDeclinedEmail** `Code.gs:2244`
- Signature: `(offererEmail, offererName, recipientName, shiftDate, note)`
- Notifies offerer when their shift offer is declined. Called by declineShiftOffer.
- Callers: declineShiftOffer; no direct frontend routing.
- **C**: Code.gs:2244-2250, invoked at 1099
- External services: MailApp (via sendEmail), formatDateDisplay
- Replacement: `email-vendor`

**sendOfferCancelledEmail** `Code.gs:2252`
- Signature: `(recipientEmail, recipientName, offererName, shiftDate)`
- Notifies recipient when an offer is cancelled. Called by cancelShiftOffer.
- Callers: cancelShiftOffer; no direct frontend routing.
- **C**: Code.gs:2252-2258, invoked at 1131
- External services: MailApp (via sendEmail), formatDateDisplay
- Replacement: `email-vendor`

**sendOfferApprovedEmail** `Code.gs:2260`
- Signature: `(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole)`
- Notifies both parties when a shift offer is approved by admin. Called by approveShiftOffer.
- Callers: approveShiftOffer; no direct frontend routing.
- **C**: Code.gs:2260-2265, invoked at 1171
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendOfferRejectedEmail** `Code.gs:2267`
- Signature: `(offererEmail, recipientEmail, offererName, recipientName, shiftDate, note)`
- Notifies both parties when a shift offer is rejected by admin. Called by rejectShiftOffer.
- Callers: rejectShiftOffer; no direct frontend routing.
- **C**: Code.gs:2267-2272, invoked at 1197
- External services: MailApp (via sendEmail), formatDateDisplay
- Replacement: `email-vendor`

**sendOfferRevokedEmail** `Code.gs:2274`
- Signature: `(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, note)`
- Notifies both parties when an approved shift offer is revoked. Called by revokeShiftOffer.
- Callers: revokeShiftOffer; no direct frontend routing.
- **C**: Code.gs:2274-2279, invoked at 1240
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendSwapSubmittedEmail** `Code.gs:2283`
- Signature: `(partnerEmail, partnerName, initiatorName, initiatorShift, partnerShift)`
- Notifies partner of a pending swap request. Called by submitSwapRequest.
- Callers: submitSwapRequest; no direct frontend routing.
- **C**: Code.gs:2283-2289, invoked at 1305
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendSwapAcceptedEmail** `Code.gs:2291`
- Signature: `(initiatorName, partnerName, request)`
- Notifies CONFIG.ADMIN_EMAIL when a swap is accepted and needs approval. Called by acceptSwapRequest.
- Callers: acceptSwapRequest; no direct frontend routing.
- **C**: Code.gs:2291-2297, invoked at 1331
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendSwapDeclinedEmail** `Code.gs:2299`
- Signature: `(initiatorEmail, initiatorName, partnerName, note)`
- Notifies initiator when their swap request is declined. Called by declineSwapRequest.
- Callers: declineSwapRequest; no direct frontend routing.
- **C**: Code.gs:2299-2305, invoked at 1357
- External services: MailApp (via sendEmail)
- Replacement: `email-vendor`

**sendSwapCancelledEmail** `Code.gs:2307`
- Signature: `(partnerEmail, partnerName, initiatorName)`
- Notifies partner when a swap is cancelled. Called by cancelSwapRequest.
- Callers: cancelSwapRequest; no direct frontend routing.
- **C**: Code.gs:2307-2313, invoked at 1388
- External services: MailApp (via sendEmail)
- Replacement: `email-vendor`

**sendSwapApprovedEmail** `Code.gs:2315`
- Signature: `(initiatorEmail, partnerEmail, initiatorName, partnerName, request)`
- Notifies both parties when a swap is approved. Called by approveSwapRequest.
- Callers: approveSwapRequest; no direct frontend routing.
- **C**: Code.gs:2315-2321, invoked at 1429
- External services: MailApp (via sendEmail), formatDateDisplay, formatTimeDisplay
- Replacement: `email-vendor`

**sendSwapRejectedEmail** `Code.gs:2322`
- Signature: `(initiatorEmail, partnerEmail, initiatorName, partnerName, note)`
- Notifies both parties when a swap is rejected. Called by rejectSwapRequest.
- Callers: rejectSwapRequest; no direct frontend routing.
- **C**: Code.gs:2322-2328, invoked at 1455
- External services: MailApp (via sendEmail)
- Replacement: `email-vendor`

**sendSwapRevokedEmail** `Code.gs:2329`
- Signature: `(initiatorEmail, partnerEmail, initiatorName, partnerName, note)`
- Notifies both parties when an approved swap is revoked. Called by revokeSwapRequest.
- Callers: revokeSwapRequest; no direct frontend routing.
- **C**: Code.gs:2329-2350, invoked at 1500
- External services: MailApp (via sendEmail)
- Replacement: `email-vendor`

---

### removed (8 functions)

These become obsolete after migration or are scaffolding/test utilities.

**rotateHmacSecret** `Code.gs:589`
- Signature: `()`
- One-time or emergency-use function: prompts via UI alert, generates a new HMAC secret, writes it to ScriptProperties, invalidates all active tokens. Listed in the "Rainbow Admin" menu installed by onOpen.
- Callers: Menu item in onOpen (Code.gs:583); no action routing or frontend direct call.
- **C**: Code.gs:589-603, invoked via menu item
- External services: SpreadsheetApp.getUi(), PropertiesService.getScriptProperties().setProperty, Utilities.getUuid, Utilities.computeDigest
- Replacement: `removed` — After migration to Supabase Auth, token rotation is handled by Supabase (JWT rotate on refresh). This function is an Apps Script artifact.

**onOpen** `Code.gs:580`
- Signature: `()`
- Apps Script lifecycle hook. Installs the "Rainbow Admin" menu with one item: "Rotate HMAC Secret".
- Callers: Apps Script runtime (automatic on spreadsheet open); no user-initiated call.
- **C**: Code.gs:580-585
- External services: SpreadsheetApp.getUi()
- Replacement: `removed` — Apps Script UI menus don't exist in Supabase/Vercel. Admin functions move to the React app's admin panel.

**checkExpiredRequests** `Code.gs:2060`
- Signature: `()`
- Scans all shift_changes rows and marks pending shift offers / swaps as 'expired' if their shift date(s) have passed. Presumably run daily via a time-driven trigger.
- Callers: Time-driven trigger (configured in Apps Script, not visible in code); no frontend direct call.
- **C**: Code.gs:2060-2081
- External services: SpreadsheetApp (getSheetByName, getDataRange)
- Replacement: `removed` or `edge-function` — After migration, this logic runs as a Supabase cron job (via pg_cron extension or an external cron service calling an edge function). Can also be done client-side on app load if frequency allows.

**setupSpreadsheet** `Code.gs:2352`
- Signature: `()`
- One-time setup function. Creates all tabs (Employees, Shifts, Settings, Announcements, ShiftChanges) with seed data. Tries to delete default "Sheet1" if empty. Intended to be run once from the Apps Script editor.
- Callers: Editor-only (manual invocation from Run button); no frontend routing.
- **C**: Code.gs:2352-2370
- External services: SpreadsheetApp (insertSheet, deleteSheet, etc.)
- Replacement: `removed` — Schema lives in Supabase migrations. One-time seed data is inserted via SQL script or backend setup script.

**testSetup** `Code.gs:2482`
- Signature: `()`
- Test utility. Logs spreadsheet name and row counts per sheet.
- Callers: Editor-only; no frontend routing.
- **C**: Code.gs:2482-2490
- External services: SpreadsheetApp
- Replacement: `removed` — Test logic moves to a testing framework (Vitest, Jest, etc.) for the backend.

**testAPI** `Code.gs:2492`
- Signature: `()`
- Test utility. Calls getAllData and logs counts of employees/shifts/requests.
- Callers: Editor-only; no frontend routing.
- **C**: Code.gs:2492-2502
- External services: None (calls getAllData)
- Replacement: `removed` — Test logic moves to a testing framework or Postman collection for API testing.

**clearAllData** `Code.gs:2508`
- Signature: `()`
- Destructive one-time utility. Clears all shift and request rows (keeps Employees and Settings). Logs to execution log.
- Callers: Editor-only; no frontend routing.
- **C**: Code.gs:2508-2515
- External services: SpreadsheetApp (deleteRows)
- Replacement: `removed` — Not needed in production. Data cleanup is done via Supabase admin console or a dedicated maintenance script.

**columnLetter_** `Code.gs:1790`
- Signature: `(n)`
- Converts a column index (1-based) to a column letter (A, B, ..., Z, AA, AB, ...). Used internally by batchSaveShifts and bulkCreatePKEvent to construct Sheets API range strings like 'ShiftsTab!A2:AA100'.
- Callers: batchSaveShifts (Code.gs:1883), bulkCreatePKEvent (Code.gs:1982); no direct frontend call.
- **C**: Code.gs:1790-1798, invoked at 1883, 1982
- External services: None (string math)
- Replacement: `removed` — After migration to Supabase, no direct Sheets API calls; columnLetter_ is not needed. If using Postgres ranges, use row/column IDs directly.

---

### Internal Utility Functions

Not routed as actions; used internally across handlers. Listed here for completeness but don't need individual replacement strategies (they're helper stubs).

**doGet** `Code.gs:208`
- Parses action and payload from query parameters; routes to handleRequest. Handles JSON parse fallback.
- Callers: Apps Script web-app GET requests from frontend api.js.
- **C**: Code.gs:208-231, invoked via doGet runtime hook
- Replacement: Not applicable; Apps Script entry point is replaced by a backend framework (Express, Hono, etc.) or Supabase Edge Functions.

**doPost** `Code.gs:236`
- Parses POST body; routes to handleRequest. Wraps in try-catch and returns jsonResponse on error.
- Callers: Apps Script web-app POST requests from frontend api.js (fallback when GET URL is too long).
- **C**: Code.gs:236-248, invoked via doPost runtime hook
- Replacement: Not applicable; replaced by backend framework or Edge Functions.

**handleRequest** `Code.gs:253`
- Dispatches action strings to handler functions. Looks up action in a handlers object; calls the matching function or returns INVALID_ACTION error.
- Callers: doGet, doPost (all HTTP requests flow through here).
- **C**: Code.gs:253-326
- Replacement: Not applicable; routing logic moves to framework (Express middleware, Hono hono.routing, or Supabase Edge Function RPC dispatch).

**jsonResponse** `Code.gs:331`
- Wraps data in a JSON response with ContentService MIME type.
- Callers: doGet, doPost, handleRequest.
- **C**: Code.gs:331-335
- Replacement: Not applicable; response formatting handled by backend framework or Edge Function standard response objects.

**updateCell** `Code.gs:390`
- Updates a single cell in a sheet by column name and row index.
- Callers: saveLivePeriods, saveStaffingTargets, saveSetting, saveAnnouncement, deleteAnnouncement, updateRow, checkExpiredRequests.
- **C**: Code.gs:390-397
- Replacement: Not applicable; replaced by SQL UPDATE statements.

**updateRow** `Code.gs:399`
- Updates multiple cells in a row by column name -> value map. Looks up column indices and calls setValue for each.
- Callers: changePassword, resetPassword, (many approveX/denyX/revokeX/cancelX functions — these update shift_changes row status).
- **C**: Code.gs:399-415
- Replacement: Not applicable; replaced by SQL UPDATE statements.

**appendRow** `Code.gs:417`
- Appends a new row to a sheet. Maps field names to column indices and appends values.
- Callers: submitTimeOffRequest, submitShiftOffer, submitSwapRequest, saveEmployee (new), saveLivePeriods, saveStaffingTargets, saveSetting, saveAnnouncement, bulkCreatePKEvent.
- **C**: Code.gs:417-435
- Replacement: Not applicable; replaced by SQL INSERT statements.

**constantTimeEq_** `Code.gs:519`
- Constant-time string equality check. Used to prevent timing attacks on password/signature verification.
- Callers: login (password hash verification), verifyToken_ (signature verification).
- **C**: Code.gs:519-524, invoked at 636, 549
- Replacement: Not applicable; built into Supabase Auth and crypto libraries (Node.js timingSafeEqual, etc.).

**base64UrlEncodeBytes_** `Code.gs:498`
- Encodes bytes to base64url (web-safe, no padding). Used in JWT generation.
- Callers: hmacSign_, base64UrlEncodeString_.
- **C**: Code.gs:498-500, invoked at 516, 503
- Replacement: Not applicable; replaced by a crypto library (jsonwebtoken, jose, etc.).

**base64UrlEncodeString_** `Code.gs:502`
- Encodes a string to base64url via Utilities.newBlob.
- Callers: createToken_.
- **C**: Code.gs:502-504, invoked at 534
- Replacement: Not applicable; replaced by a crypto library.

**base64UrlDecodeToString_** `Code.gs:506`
- Decodes base64url back to string.
- Callers: verifyToken_.
- **C**: Code.gs:506-509, invoked at 554
- Replacement: Not applicable; replaced by a crypto library.

**hmacSign_** `Code.gs:511`
- Computes HMAC-SHA-256 signature of a message using HMAC_SECRET.
- Callers: createToken_, verifyToken_.
- **C**: Code.gs:511-517, invoked at 535, 548
- Replacement: Not applicable; handled by a JWT library.

**getHmacSecret_** `Code.gs:490`
- Reads HMAC_SECRET from ScriptProperties. Throws if not set.
- Callers: hmacSign_.
- **C**: Code.gs:490-496, invoked at 512
- Replacement: Not applicable; secret moves to environment variables (Vercel ENV, Supabase Vault, etc.).

**generateRequestId** `Code.gs:771`
- Generates a request ID: `{prefix}-{YYYYMMDD}-{random 4 digits}`. Used for time-off, offer, swap requests.
- Callers: submitTimeOffRequest, submitShiftOffer, submitSwapRequest.
- **C**: Code.gs:771-776, invoked at 853, 1029, 1283
- Replacement: Not applicable; replaced by UUID v4 or the database's auto-increment ID.

---

## Constants

| Name | Line | Value | Migration Disposition |
|------|------|-------|----------------------|
| `CONFIG` | 188 | Object: SPREADSHEET_ID, TABS (Employees, Shifts, Settings, Announcements, ShiftChanges), ADMIN_EMAIL | **C**: Code.gs:188-198. SPREADSHEET_ID is the live sheet ID (must be set before deploy). ADMIN_EMAIL = 'sarvi@rainbowjeans.com' (hardcoded). After migration: move to environment config (Supabase or Vercel ENV). Tab names are schema references; map to Supabase table names. ADMIN_EMAIL moves to user/group metadata. |
| `TOKEN_TTL_MS` | 488 | `12 * 60 * 60 * 1000` = 43200000 ms (12 hours) | **C**: Code.gs:488. JWT expiry duration. After migration: set in Supabase Auth settings (JWT_EXPIRY) or Vercel env var. |
| `OTR_NAVY_` | 2091 | '#0D0E22' | **C**: Code.gs:2091. Email branding color (navy). Move to frontend email builder or email template config. |
| `OTR_WHITE_` | 2092 | '#FDFEFC' | **C**: Code.gs:2092. Email branding color (white). Move to frontend email builder config. |
| `OTR_ACCENT_DEFAULT_` | 2093 | '#0453A3' | **C**: Code.gs:2093. Email branding color (blue). Move to frontend email builder config. |
| `SINGULAR_TYPES_` (local to batchSaveShifts) | 1833 | `{work: 1, sick: 1, pk: 1}` | **C**: Code.gs:1833. Shift types that enforce uniqueness per (employee, date, type). After migration: document shift type enum in schema; move dedup logic to database constraints or edge function. |
| `CHUNK_SIZE` (local to chunkedBatchSave, frontend) | api.js:71 | `15` | **C**: api.js:71. Frontend chunking size for large batch saves. After migration: no longer needed if backend can handle large payloads. Increase or remove based on Supabase limits. |

---

## ScriptProperties (Secrets)

| Property | Read/Write | Usage | Line(s) | Migration Destination |
|----------|-----------|-------|---------|----------------------|
| `HMAC_SECRET` | Read: getHmacSecret_ (line 491); Write: rotateHmacSecret (line 600) | Base64-encoded 32-byte secret for HMAC-SHA-256 token signing. Read on every token operation (login, verifyToken_). Written once during setup or on manual rotation. | **C**: 491, 600 | After migration: NOT NEEDED. Supabase Auth generates JWTs with its own signing key. If custom token signing is required, store in Supabase Vault (encrypted) or Vercel KV. Rotate via database admin or CI/CD script, not via UI menu. |

---

## Lock Usage

| Site | Function | Line(s) | Locked Resource | Contention | Timeout | Migration Strategy |
|------|----------|---------|-----------------|-----------|---------|-------------------|
| batchSaveShifts | LockService.getDocumentLock() | 1816-1819, 1902 | Entire Shifts sheet (document-level exclusive) | Two concurrent admins both saving schedule triggers CONCURRENT_EDIT error and returns 400 to frontend. | 10 seconds | **C**: 1816-1819. After migration: Supabase doesn't have document locks. Use database-level advisory locks (SELECT pg_advisory_lock(...)) or rely on optimistic concurrency control (ETag/version column). If contention is real, add a Postgres constraint or trigger to reject concurrent updates on the same period. Alternatively, queue shift updates server-side. |
| bulkCreatePKEvent | LockService.getDocumentLock() | 1928-1931, 1994 | Entire Shifts sheet (document-level exclusive) | Same as above: concurrent bulk-create attempts fail. | 10 seconds | Same as above. |

---

## Flags & Ambiguities

1. **Missing email call**: sendTimeOffCancelledEmail is defined (Code.gs:2210) but NOT invoked in cancelTimeOffRequest (Code.gs:872-903). Should it be? Check if admins expect an email when an employee cancels time-off.

2. **sendBrandedScheduleEmail auth gate inconsistency**: Line 2146 checks `authResult.success` but verifyAuth returns `{authorized, ...}`, not `{success, ...}`. This may be a bug or legacy code path. **C**: Code.gs:2144-2150. If sendBrandedScheduleEmail is ever invoked, this error gate will fail silently.

3. **Test harness in production**: testAPI (Code.gs:2492) calls getAllData with a hardcoded callerEmail ('sarvi@rainbowjeans.com'), bypassing token auth. This is a backdoor. Remove or protect before migration.

4. **Column migration debt**: Code comments mention one-time manual steps to add columns (e.g., "add headers type and note to Shifts tab at v2.21", "add defaultSection to Employees at v2.22"). These are now baked into schema; Postgres does not require manual column adds. Verify all columns exist in the target Supabase schema during migration.

5. **adminTier vs isAdmin inconsistency**: Employees can have adminTier='admin2' but isAdmin=FALSE (Code.gs:8-14). The frontend uses `!currentUser.isAdmin` to route admin2 users to EmployeeView, not AdminView. After migration, clarify the admin role model: is adminTier a finer-grained permission system that replaces isAdmin? Or coexists?

6. **PaymentProperties getProperty / setProperty usage**: Only HMAC_SECRET is stored. No other script-level config (API keys, feature flags) is persisted. After migration, environment variables or Supabase Vault should hold all secrets. Audit if any hardcoded values (e.g., 'emp-' password prefix, default availability) should be configurable.

7. **Email template hardcoding**: All email templates are string concatenations in the backend (Code.gs:2186-2350). Consider moving to a template engine (Handlebars, EJS) or frontend-driven email builder (already started with sendBrandedScheduleEmail). This improves UX and reduces backend coupling.

8. **Plaintext password column retention**: Employees tab still stores passwords in plaintext (Code.gs:52-54, 721, 758) for admin "default password" display. After migration to Supabase Auth, consider removing the plaintext column entirely and storing default passwords in a separate admin_defaults table or displaying them only in the reset password API response (already done at Code.gs:764).

9. **No pagination on getSheetData**: getAllData and other data queries fetch the entire sheet into memory. If Employees or Shifts tables grow large (1000+ rows), this becomes a performance / memory issue. After migration, implement pagination or lazy-load.

10. **Frontend chunkedBatchSave logic mirrors backend**: Frontend api.js lines 77-86 reimplement the shift key logic (SINGULAR_TYPES, keyOf) to chunk saves. After migration, move this logic to the backend edge function so the frontend doesn't need to duplicate it.

