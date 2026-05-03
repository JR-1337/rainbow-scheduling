/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RAINBOW SCHEDULING APP - GOOGLE APPS SCRIPT BACKEND
 * ═══════════════════════════════════════════════════════════════════════════════
 * Version: 2.30.2 (Refactor: batchSaveShifts uses withDocumentLock_ helper)
 *
 * Changes in v2.30.2:
 * - batchSaveShifts now wraps its body in withDocumentLock_('saving the schedule')
 *   instead of calling LockService.getDocumentLock() + tryLock(10000) inline.
 *   Single source of truth for the lock + timeout + CONCURRENT_EDIT response shape.
 *   Behavior unchanged: same instance, same 10s timeout, clean error on contention.
 *
 * Version: 2.30.1 (Hotfix: align withDocumentLock_ timeout with batchSaveShifts)
 *
 * Changes in v2.30.1:
 * - withDocumentLock_ tryLock 5000ms -> 10000ms. Both this helper and
 *   batchSaveShifts grab LockService.getDocumentLock() (same instance), so
 *   asymmetric timeouts meant a 5-10s bulk save would always starve a
 *   concurrent approve. Symmetric 10s removes that edge case.
 *
 * Version: 2.30.0 (Batch 3: TOCTOU concurrency hardening)
 *
 * Changes in v2.30.0 (Batch 3 of audit-fixes-2026-05-02):
 * - withDocumentLock_(fn, errorContext) helper wraps fn() in a document
 *   lock with 10s tryLock. Returns CONCURRENT_EDIT cleanly on contention.
 * - 16 state-mutating request handlers (time-off / shift-offer / shift-swap
 *   approve / deny / revoke / cancel / accept / decline / reject) now wrap
 *   their read+check+write blocks in withDocumentLock_. Re-fetch happens
 *   inside the lock to defeat stale snapshots. Two admins clicking
 *   approve+deny on the same request within the same window: one wins,
 *   the loser sees CONCURRENT_EDIT or INVALID_STATUS.
 *
 * Version: 2.29.1 (Hotfix: changePassword case-fold for default-password users)
 *
 * Changes in v2.29.1 (hotfix between Batch 2 and Batch 3):
 * - changePassword (self-path): mirror login's [lowercased, original] candidate
 *   array when employee.passwordChanged is false. Closes the Set-Your-Password
 *   modal blocker -- resetPassword stores hash(salt, default.toLowerCase()) so
 *   the cased typed value never matched and every first-login was stuck.
 *
 * Version: 2.29.0 (Batch 2: data correctness + email case-insensitivity)
 *
 * Changes in v2.29.0 (Batch 2 of audit-fixes-2026-05-02):
 * - approveShiftOffer / revokeShiftOffer / approveSwapRequest / revokeSwapRequest:
 *   shift-row lookup now filters by type='work' to prevent meetings/PK rows
 *   getting reassigned during a transfer/swap.
 * - batchSaveShifts: bustSheetCache_(SHIFTS) called after the bulk update;
 *   stale-cache window between save and other-admin re-read closed.
 * - approveShiftOffer: validates recipient before writing approved status;
 *   avoids state where SHIFT_CHANGES says approved but no shift transfer occurred.
 * - login + getEmployeeByEmail + changePassword + resetPassword: email
 *   compares lowercased on both sides; rows with mixed-case email values
 *   become loggable. Storage is never normalized -- Sarvi@... and sarvi@...
 *   are equivalent at every read boundary, transparently.
 *
 * Version: 2.28.0 (Batch 1: data exposure + privilege escalation hardening)
 *
 * Changes in v2.28.0 (Batch 1 of audit-fixes-2026-05-02):
 * - getAllData + getEmployees: per-caller-role employee shape via
 *   safeEmployeeForCaller_. Non-admins no longer see passwordHash, passwordSalt,
 *   plaintext password column, or PII (phone, address, dob, rateOfPay,
 *   adpNumber, counterPointId). Admins still get the full safe shape.
 * - saveEmployee: explicit field allowlist (SAVE_EMPLOYEE_FIELDS_). Owner-only
 *   fields (isAdmin, isOwner, adminTier) require caller.isOwner === true.
 *   passwordHash / passwordSalt / password / passwordChanged silently dropped
 *   from incoming payload -- those have dedicated handlers.
 * - resetPassword: only the owner can reset the owner or any admin1 user.
 *   Other admin callers can still reset admin2 and non-admin targets.
 *
 * Version: 2.27.0 (FirstnameL default-password pattern + case-insensitive default login)
 *
 * Changes in v2.27.0:
 * - resetPassword + saveEmployee: default password switches from emp-XXX (row-based)
 *   to FirstnameL (first name + last initial), e.g. "John Richmond" -> JohnR.
 *   Single-word names use the whole word; hyphenated last names take the first
 *   segment's initial; collisions append a digit (JohnR -> JohnR2 -> JohnR3).
 *   Garbage/empty names fall back to emp-XXX.
 * - login: when passwordChanged === false, the typed password is lowercased
 *   before hashing so phone autocorrect (which capitalizes first letters)
 *   doesn't lock employees out on day one. User-chosen passwords stay strict.
 * - usingDefaultPassword regex extended to also detect FirstnameL-style strings
 *   when the passwordChanged flag is missing (back-compat for legacy rows).
 *
 * Changes in v2.26.0:
 * - Employees tab gains two columns: `adminTier` (col W, '' | 'admin1' | 'admin2') and
 *   `title` (col X, freeform one-word label like 'Manager'). `createEmployeesTab` headers
 *   list extended. `saveEmployee` is header-driven, no row-mapper change needed.
 * - createToken_: JWT payload now carries `t: employee.adminTier || ''`. verifyToken_
 *   returns `adminTier`. No permission change: admin2 rows have `isAdmin=FALSE`, so
 *   the existing `requiredAdmin` gate in `verifyAuth` rejects their writes automatically
 *   and the frontend routes them to EmployeeView via the `!currentUser.isAdmin` check.
 * - Manual step (one-time, live Sheet): add headers `adminTier` (col W) and `title`
 *   (col X) to the Employees tab. Existing rows left blank are fine.
 *
 * Changes in v2.25.0:
 * - `sendScheduleChangeNotification_(caller, summary)`: emails CONFIG.ADMIN_EMAIL when
 *   a non-owner admin other than Sarvi saves a shift or runs a bulk schedule save.
 *   Short-circuits if caller is Sarvi (email match) or the Owner (isOwner === true),
 *   so Sarvi and JR's own edits stay silent. Called at the success tail of
 *   `saveShift` and `batchSaveShifts`. PK bulk + announcement + live-periods edits
 *   stay silent per scope decision.
 *
 * Changes in v2.24.0:
 * - Employees tab gains column N: `defaultShift` (JSON per-day {start,end}). Auto-Fill prefers
 *   defaultShift; falls back to availability when the day entry is missing. Decouples default
 *   booked hours from availability so widening availability for PK eligibility no longer
 *   changes what Auto-Fill produces. `saveEmployee` is header-driven — no row-mapper change.
 * - Editor-only `widenAvailabilityForPK_()`: widens Sat start to 10:00 and M–F end to 20:00
 *   on already-available days so PK windows (Sat 10:00–10:45, weekday 18:00–20:00) pass the
 *   existing `availabilityCoversWindow` eligibility gate. Sunday untouched. Never turns an
 *   off-day on. NOT registered in handleRequest; run from the Apps Script editor, then the
 *   function gets removed in a follow-up commit (mirror of `backfillPasswordHashes` hygiene).
 * - Manual step (one-time, live Sheet): add header `defaultShift` to column N of Employees tab
 *   (existing columns N–U shift one right). Frontend tolerates missing column.
 *
 * Changes in v2.23.0:
 * - login: hash-only authentication. Plaintext fallback + on-login migrate path
 *   removed. All 24 active rows backfilled to hash 2026-04-18 via the one-time
 *   editor-only `backfillPasswordHashes` (subsequently deleted). New rows missing
 *   `passwordHash`/`passwordSalt` return AUTH_FAILED.
 * - changePassword: hash-only check for currentPassword. Removed plaintext +
 *   ID-as-default fallback paths.
 * - resetPassword: now writes hash + salt directly (alongside the plaintext
 *   column kept for admin "default password" display). Previously cleared the
 *   hash and relied on the next login to re-migrate; that path no longer
 *   exists, so the reset would otherwise lock the user out.
 * - saveEmployee: new-hire path computes hash + salt for the default password
 *   so first login works without going through migration.
 * - Plaintext `password` column kept on Employees for admin display only;
 *   never read by the auth path. Future hardening: drop the column entirely
 *   once admin UI displays the password from the resetPassword response only.
 *
 * Changes in v2.22.0:
 * - Employees tab gains column U: `defaultSection` (values mens|womens|cashier|backupCashier|backupCash|floorSupervisor|floorMonitor|none, default 'none').
 *   Frontend autofill's `createShiftFromAvailability` uses `employee.defaultSection || 'none'`
 *   instead of hardcoding 'none'. Backend changes: `createEmployeesTab` headers array updated;
 *   `saveEmployee` is header-driven so no row-mapper change needed. Back-compat: missing
 *   column falls through to 'none'.
 * - Manual step (one-time, live Sheet): add header `defaultSection` to column U of Employees tab.
 *   Done on live Sheet 2026-04-18 per JR; redeployed as v2.22.
 *
 * Changes in v2.21.0:
 * - Shifts tab gains two new columns: `type` ('work' | 'meeting' | 'pk') and `note`.
 *   `createShiftsTab` appends them; existing rows read as `type: 'work'` via normalization
 *   in getAllData/getShifts (empty string → 'work'). No data migration needed.
 * - Shift-row uniqueness key in saveShift + batchSaveShifts is now
 *   `${employeeId}-${date}-${type}` so work + meeting + pk can coexist on the same day.
 *   `allShiftKeys` from the frontend follows the 3-tuple form.
 * - submitShiftOffer + submitSwapRequest reject with error code INVALID_SHIFT_TYPE
 *   when the selected shift is not type='work'. Meetings and PK events are not
 *   transferable.
 * - Manual step (one-time, Sarvi's live Sheet): add headers `type` (column J) and
 *   `note` (column K) to the Shifts tab. Existing rows left blank are fine.
 *
 * Changes in v2.20.1:
 * - batchSaveShifts: reverted the v2.20 adaptive fast path. Playwright measurement
 *   showed Apps Script web-app calls have a ~7-8s fixed overhead per request (auth +
 *   302 redirect + minimal work). A no-op save with {shifts:[], periodDates:[]} still
 *   costs ~7-8s. The v2.20 per-row fast path saved only ~1s of actual Sheet work,
 *   which is drowned out by that overhead. Not worth the code complexity.
 *   Back to the v2.19.2 single-call Sheets.Spreadsheets.Values.update for all saves.
 *   The structural answer to save latency is leaving Apps Script (CF Worker proxy for
 *   reads is cheap; writes stay bound until migration).
 *
 * Changes in v2.20 (superseded):
 * - Adaptive fast path in batchSaveShifts. Added complexity, no measurable win vs v2.19.2.
 *
 * Changes in v2.19.2:
 * - getAllData: REVERTED to the proven 5-call getSheetData path. The batchGet read
 *   path (v2.19, v2.19.1) tripped over Sheets API render-mode mismatches with native
 *   getDataRange().getValues() (booleans as strings, dates as locale-dependent strings).
 *   Workarounds added maintenance debt without an elegant fix. Frontend changes
 *   (preconnect, min-delay removal, immutable cache headers) already give the bulk of
 *   the login speedup; backend read time was a smaller share than estimated.
 * - batchSaveShifts: KEPT the single Sheets.Spreadsheets.Values.update call. This is
 *   pure-write, no read-shape ambiguity, and delivers the actual demo-transforming
 *   win (~20s → ~2-3s on big saves).
 * - batchSaveShifts: valueInputOption=USER_ENTERED matches legacy appendRow/setValue
 *   auto-parse semantics, so cell types stay consistent with what Sarvi sees in the sheet.
 * - batchSaveShifts: waitLock -> tryLock with a clean CONCURRENT_EDIT error code on
 *   collision instead of a bare Apps Script throw.
 *
 * Changes in v2.19 / v2.19.1 (superseded above):
 * - Attempted Sheets.Spreadsheets.Values.batchGet for getAllData. v2.19 returned
 *   booleans as "TRUE"/"FALSE" strings (broke schedule). v2.19.1's FORMATTED_STRING
 *   fix was locale-dependent. Both reverted in v2.19.2.
 *
 * Changes in v2.18:
 * - submitTimeOffRequest: overlap filter now includes status=='approved' (was
 *   pending-only). Prevents duplicate time-off bookings for days the user has
 *   already been granted off. Error code: ALREADY_SCHEDULED_OFF.
 *
 * Changes in v2.17:
 * - New optional Employees column: passwordChanged (TRUE/FALSE). Set to TRUE
 *   when a user changes their own password, FALSE when an admin resets it.
 *   login reads it as the source of truth for usingDefaultPassword; falls back
 *   to the emp-XXX regex only when the field is missing (back-compat).
 *   Fixes the S36/S37 bug where a user who chose a new password matching the
 *   emp-XXX default pattern kept getting re-prompted to change it.
 *   Manual step: add "passwordChanged" column T to Employees sheet; leave
 *   blank for existing users — will auto-populate on their next change.
 *
 * Changes in v2.16:
 * - All protected handlers: dropped `callerEmail` from payload destructure and
 *   derive it from `auth.employee.email` after verifyAuth succeeds. Fixes the
 *   S37 regression where frontend stripped payload.callerEmail, leaving handlers
 *   with undefined ownership/filter fields (broke request submit/approve/deny/
 *   revoke/cancel across time-off, offers, swaps + getMyRequests/incoming*).
 * - changePassword: now calls verifyAuth(payload) up front (previously relied
 *   on manual caller-email derivation). Same behaviour, gated on a valid token.
 * - verifyAuth's payload.callerEmail fallback kept for the legacy test harness
 *   at the bottom of this file; can be removed once that test is deleted.
 *
 * Changes in v2.15:
 * - Removed setupAuth() and the "Run Auth Setup" menu item (setup is done; keeping
 *   them around would risk an accidental re-run).
 * - onOpen() still installs a "Rainbow Admin" menu, but it only exposes the emergency
 *   "Rotate HMAC Secret" action now.
 *
 * Changes in v2.13:
 * - verifyAuth:     now accepts the full payload (preferring payload.token, falling back to payload.callerEmail)
 *                   so we can roll out HMAC tokens without breaking the legacy trust-the-client path
 * - login:          issues a signed token (12h TTL) and migrates plaintext passwords to salted SHA-256 on use
 * - changePassword: writes salted SHA-256 hash and clears the plaintext column
 * - resetPassword:  keeps plaintext fallback (admin UI shows it) and clears any hash so next login re-migrates
 * - New Script Property REQUIRED: HMAC_SECRET (32 random bytes, base64). App throws on first token op without it.
 * - New Employees columns: passwordHash, passwordSalt (append to end; getSheetData picks them up from headers)
 *
 * Changes in v2.12:
 * - login:         includes defaultPassword in response when usingDefaultPassword
 * - changePassword: accepts employee ID as valid current password for default-format
 *                  accounts — fixes first-login bug with emp-XXX passwords
 * - resetPassword: returns newPassword in response data so admin UI can display it
 *
 * Changes in v2.11:
 * - resetPassword: now resets to emp-XXX format (row-based) instead of employee ID
 * - saveEmployee:  uses provided password for new employees; never overwrites
 *                  password on existing employee updates
 * - login:         usingDefaultPassword flag now detects both old ID-based passwords
 *                  AND new emp-XXX format passwords
 *
 * Deploy as Web App:
 * 1. Extensions > Apps Script
 * 2. Deploy > New deployment
 * 3. Type: Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone (or Anyone with Google Account)
 * 6. Copy the Web App URL for React integration
 *
 * Sheet Structure Required:
 * - Tab 1: Employees (columns A-Q)
 * - Tab 2: Shifts (columns A-I)
 * - Tab 3: Settings (columns A-B)
 * - Tab 4: Announcements (columns A-E)
 * - Tab 5: ShiftChanges (columns A-AI) - CREATE THIS TAB
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SPREADSHEET_ID: '', // ADD YOUR SPREADSHEET ID HERE
  TABS: {
    EMPLOYEES: 'Employees',
    SHIFTS: 'Shifts',
    SETTINGS: 'Settings',
    ANNOUNCEMENTS: 'Announcements',
    SHIFT_CHANGES: 'ShiftChanges'
  },
  ADMIN_EMAIL: 'sarvi@rainbowjeans.com' // Primary admin for notifications
};

// v2.28: explicit field allowlist for saveEmployee writes.
// Adding a new Employees column does NOT auto-make it admin-writable;
// extend SAVE_EMPLOYEE_FIELDS_ explicitly.
const SAVE_EMPLOYEE_FIELDS_ = [
  'id', 'name', 'email', 'phone', 'address', 'dob', 'active',
  'showOnSchedule', 'availability', 'defaultShift', 'counterPointId',
  'adpNumber', 'rateOfPay', 'employmentType', 'defaultSection', 'title'
];
const SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_ = ['isAdmin', 'isOwner', 'adminTier'];

// ═══════════════════════════════════════════════════════════════════════════════
// WEB APP ENTRY POINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle GET requests - handles all API calls via query params
 * Workaround for POST issues with Apps Script web apps
 */
function doGet(e) {
  if (!e.parameter.action) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Rainbow Scheduling API is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter.action;
  let payload = {};

  if (e.parameter.payload) {
    try {
      payload = JSON.parse(e.parameter.payload);
    } catch (err) {
      payload = { ...e.parameter };
      delete payload.action;
    }
  } else {
    payload = { ...e.parameter };
    delete payload.action;
  }

  return handleRequest(action, payload);
}

/**
 * Handle POST requests - main API router
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, payload } = request;
    return handleRequest(action, payload);
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return jsonResponse({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.toString() }
    });
  }
}

/**
 * Shared request handler for both GET and POST
 */
function handleRequest(action, payload) {
  try {
    const handlers = {
      // Authentication
      'login': () => login(payload),
      'changePassword': () => changePassword(payload),
      'resetPassword': () => resetPassword(payload),

      // Time Off
      'submitTimeOffRequest': () => submitTimeOffRequest(payload),
      'cancelTimeOffRequest': () => cancelTimeOffRequest(payload),
      'approveTimeOffRequest': () => approveTimeOffRequest(payload),
      'denyTimeOffRequest': () => denyTimeOffRequest(payload),
      'revokeTimeOffRequest': () => revokeTimeOffRequest(payload),

      // Shift Offers
      'submitShiftOffer': () => submitShiftOffer(payload),
      'acceptShiftOffer': () => acceptShiftOffer(payload),
      'declineShiftOffer': () => declineShiftOffer(payload),
      'cancelShiftOffer': () => cancelShiftOffer(payload),
      'approveShiftOffer': () => approveShiftOffer(payload),
      'rejectShiftOffer': () => rejectShiftOffer(payload),
      'revokeShiftOffer': () => revokeShiftOffer(payload),

      // Shift Swaps
      'submitSwapRequest': () => submitSwapRequest(payload),
      'acceptSwapRequest': () => acceptSwapRequest(payload),
      'declineSwapRequest': () => declineSwapRequest(payload),
      'cancelSwapRequest': () => cancelSwapRequest(payload),
      'approveSwapRequest': () => approveSwapRequest(payload),
      'rejectSwapRequest': () => rejectSwapRequest(payload),
      'revokeSwapRequest': () => revokeSwapRequest(payload),

      // Queries
      'getEmployeeRequests': () => getEmployeeRequests(payload),
      'getAdminQueue': () => getAdminQueue(payload),
      'getIncomingOffers': () => getIncomingOffers(payload),
      'getIncomingSwaps': () => getIncomingSwaps(payload),
      'getAllData': () => getAllData(payload),

      // Data Management
      'getEmployees': () => getEmployees(payload),
      'getShifts': () => getShifts(payload),
      'saveShift': () => saveShift(payload),
      'saveEmployee': () => saveEmployee(payload),
      'saveLivePeriods': () => saveLivePeriods(payload),
      'saveStaffingTargets': () => saveStaffingTargets(payload),
      'saveSetting': () => saveSetting(payload),
      'batchSaveShifts': () => batchSaveShifts(payload),

      // Announcements
      'saveAnnouncement': () => saveAnnouncement(payload),
      'deleteAnnouncement': () => deleteAnnouncement(payload),

      // Email
      'sendBrandedScheduleEmail': () => sendBrandedScheduleEmail(payload)
    };

    if (!handlers[action]) {
      return jsonResponse({ success: false, error: { code: 'INVALID_ACTION', message: `Unknown action: ${action}` } });
    }

    const result = handlers[action]();
    return jsonResponse(result);

  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.toString());
    return jsonResponse({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.toString() }
    });
  }
}

/**
 * Helper to create JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET ACCESS UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(tabName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  if (!sheet && tabName === CONFIG.TABS.SHIFT_CHANGES) {
    sheet = createShiftChangesTab(ss);
  }
  return sheet;
}

// Parse a 2D values array (from sheet.getDataRange().getValues()) into
// [{header: value, ..., _rowIndex}]. Date objects in date-typed cells are
// formatted to 'yyyy-MM-dd' (or 'HH:mm' for time-only cells, year=1899).
function parseSheetValues_(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    headers.forEach((header, j) => {
      let value = values[i][j];
      if (value instanceof Date && !isNaN(value.getTime())) {
        const year = value.getFullYear();
        if (year === 1899) {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
        } else {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
      }
      row[header] = value;
    });
    row._rowIndex = i + 1;
    rows.push(row);
  }
  return rows;
}

// v2.28: per-caller-role employee shape.
// Always strips: _rowIndex, password, passwordHash, passwordSalt.
// Admins (isAdmin OR isOwner) get the full safe shape including PII.
// Non-admins get the schedule-only shape (no phone/address/dob/wage/payroll IDs).
function safeEmployeeForCaller_(employee, callerIsAdmin) {
  const { _rowIndex, password, passwordHash, passwordSalt, ...rest } = employee;
  if (callerIsAdmin) return rest;
  // Non-admin shape: only the fields needed by schedule grid / Mine view / staff list.
  const {
    phone, address, dob, rateOfPay, adpNumber, counterPointId,
    passwordChanged, // backend-tracked; non-admins shouldn't see anyone's flag state
    ...nonAdminSafe
  } = rest;
  return nonAdminSafe;
}

function getSheetData(tabName) {
  const sheet = getSheet(tabName);
  if (!sheet) return [];
  return parseSheetValues_(sheet.getDataRange().getValues());
}

function updateCell(tabName, rowIndex, columnName, value) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(columnName) + 1;
  if (colIndex > 0) {
    sheet.getRange(rowIndex, colIndex).setValue(value);
    bustSheetCache_(tabName);
  }
}

function updateRow(tabName, rowIndex, updates) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const dropped = [];
  Object.entries(updates).forEach(([columnName, value]) => {
    const colIndex = headers.indexOf(columnName) + 1;
    if (colIndex > 0) {
      sheet.getRange(rowIndex, colIndex).setValue(value);
    } else {
      dropped.push(columnName);
    }
  });
  if (dropped.length > 0) {
    Logger.log('updateRow DROPPED fields on tab=' + tabName + ' row=' + rowIndex + ': ' + JSON.stringify(dropped) + ' (sheet missing matching headers)');
  }
  bustSheetCache_(tabName);
  return dropped;
}

function appendRow(tabName, rowData) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headerSet = new Set(headers);
  const dropped = Object.keys(rowData).filter(k => !headerSet.has(k));
  if (dropped.length > 0) {
    Logger.log('appendRow DROPPED fields on tab=' + tabName + ': ' + JSON.stringify(dropped) + ' (sheet missing matching headers)');
  }
  const rowArray = headers.map(header => {
    const value = rowData[header];
    return value !== undefined && value !== null ? value : '';
  });
  sheet.appendRow(rowArray);
  bustSheetCache_(tabName);
  return sheet.getLastRow();
}

// ═══ CACHE LAYER ═══

const CACHE_VERSION_ = 'v1';
const CACHE_TTL_SEC_ = 600;
const CACHE_CHUNK_BYTES_ = 90 * 1024;

function cacheKey_(tabName) { return 'sheet_' + CACHE_VERSION_ + '_' + tabName; }
function cacheMetaKey_(tabName) { return cacheKey_(tabName) + '_meta'; }

function cacheGet_(tabName) {
  try {
    const cache = CacheService.getScriptCache();
    const meta = cache.get(cacheMetaKey_(tabName));
    if (!meta) return null;
    const { chunks } = JSON.parse(meta);
    if (!chunks || chunks < 1) return null;
    if (chunks === 1) {
      const raw = cache.get(cacheKey_(tabName));
      if (!raw) return null;
      return JSON.parse(raw);
    }
    const keys = [];
    for (let i = 0; i < chunks; i++) keys.push(cacheKey_(tabName) + '_' + i);
    const got = cache.getAll(keys);
    let combined = '';
    for (let i = 0; i < chunks; i++) {
      const part = got[cacheKey_(tabName) + '_' + i];
      if (!part) return null;
      combined += part;
    }
    return JSON.parse(combined);
  } catch (e) {
    Logger.log('cacheGet_ error tab=' + tabName + ': ' + e);
    return null;
  }
}

function cachePut_(tabName, data) {
  try {
    const cache = CacheService.getScriptCache();
    const json = JSON.stringify(data);
    const bytes = json.length;
    if (bytes <= CACHE_CHUNK_BYTES_) {
      cache.put(cacheKey_(tabName), json, CACHE_TTL_SEC_);
      cache.put(cacheMetaKey_(tabName), JSON.stringify({ chunks: 1 }), CACHE_TTL_SEC_);
      Logger.log('cachePut_ tab=' + tabName + ' bytes=' + bytes + ' chunks=1');
      return;
    }
    const chunks = Math.ceil(bytes / CACHE_CHUNK_BYTES_);
    const map = {};
    for (let i = 0; i < chunks; i++) {
      map[cacheKey_(tabName) + '_' + i] = json.substr(i * CACHE_CHUNK_BYTES_, CACHE_CHUNK_BYTES_);
    }
    cache.putAll(map, CACHE_TTL_SEC_);
    cache.put(cacheMetaKey_(tabName), JSON.stringify({ chunks }), CACHE_TTL_SEC_);
    Logger.log('cachePut_ tab=' + tabName + ' bytes=' + bytes + ' chunks=' + chunks);
  } catch (e) {
    Logger.log('cachePut_ error tab=' + tabName + ': ' + e);
  }
}

function bustSheetCache_(tabName) {
  try {
    const cache = CacheService.getScriptCache();
    const meta = cache.get(cacheMetaKey_(tabName));
    const keys = [cacheKey_(tabName), cacheMetaKey_(tabName)];
    if (meta) {
      try {
        const { chunks } = JSON.parse(meta);
        if (chunks > 1) {
          for (let i = 0; i < chunks; i++) keys.push(cacheKey_(tabName) + '_' + i);
        }
      } catch (e) {}
    }
    cache.removeAll(keys);
    Logger.log('bustSheetCache_ tab=' + tabName);
  } catch (e) {
    Logger.log('bustSheetCache_ error tab=' + tabName + ': ' + e);
  }
}

// v2.30: TOCTOU guard for state-mutating handlers. Wraps fn() in a document
// lock with a 10s tryLock; clean CONCURRENT_EDIT response on contention.
// fn() is expected to return either {success: true, ...} or {success: false, ...}.
// verifyAuth() must be called OUTSIDE this wrapper (it's a read-only check and
// putting it inside increases lock hold time unnecessarily).
// LockService.getDocumentLock() is non-reentrant -- never call withDocumentLock_
// from inside a fn that is already inside withDocumentLock_.
// v2.30.1: 5000ms -> 10000ms so the helper waits as long as batchSaveShifts'
// own tryLock. Both grab the same LockService.getDocumentLock() instance, so
// matching the budget removes the asymmetric-timeout edge case where a long
// bulk save would always starve a concurrent approve.
function withDocumentLock_(fn, errorContext) {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(10000)) {
    return {
      success: false,
      error: {
        code: 'CONCURRENT_EDIT',
        message: `Another action is in progress${errorContext ? ` (${errorContext})` : ''}. Please wait a moment and try again.`
      }
    };
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function getCachedSheetData_(tabName) {
  const cached = cacheGet_(tabName);
  if (cached !== null) {
    Logger.log('cache HIT tab=' + tabName);
    return cached;
  }
  Logger.log('cache MISS tab=' + tabName);
  const fresh = getSheetData(tabName);
  cachePut_(tabName, fresh);
  return fresh;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & AUTHORIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function getEmployeeByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  return employees.find(e =>
    String(e.email || '').trim().toLowerCase() === normalizedEmail && e.active
  );
}

function isAdminUser(email) {
  const employee = getEmployeeByEmail(email);
  return employee && (employee.isAdmin || employee.isOwner);
}

// S36: verifyAuth accepts either a payload object (preferred — will read `token` first,
// then legacy `callerEmail`) OR a bare email string (during frontend migration).
// Once S37 removes all `callerEmail` sites and auto-attaches `token`, the string-arg
// and payload.callerEmail branches become dead code and can be deleted.
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

  if (!email) {
    return { authorized: false, error: { code: 'AUTH_REQUIRED', message: 'Please log in to continue' } };
  }

  const employee = getEmployeeByEmail(email);
  if (!employee) {
    return { authorized: false, error: { code: 'AUTH_REQUIRED', message: 'Employee not found or inactive' } };
  }

  if (requiredAdmin && !employee.isAdmin && !employee.isOwner) {
    return { authorized: false, error: { code: 'AUTH_FORBIDDEN', message: "You don't have permission for this action" } };
  }

  return { authorized: true, employee, viaToken };
}

// ───────────────────────────────────────────────────────────────────────────────
// S36 — Crypto helpers (HMAC tokens + SHA-256 password hashing)
// ───────────────────────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getHmacSecret_() {
  const secret = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
  if (!secret) {
    throw new Error('HMAC_SECRET not configured. Apps Script > Project Settings > Script Properties; set HMAC_SECRET to 32 random bytes base64.');
  }
  return secret;
}

function base64UrlEncodeBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function base64UrlEncodeString_(str) {
  return base64UrlEncodeBytes_(Utilities.newBlob(str).getBytes());
}

function base64UrlDecodeToString_(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(s + pad)).getDataAsString();
}

function hmacSign_(message) {
  const secret = getHmacSecret_();
  const sigBytes = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256, message, secret
  );
  return base64UrlEncodeBytes_(sigBytes);
}

function constantTimeEq_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function createToken_(employee) {
  const payload = {
    e: employee.email,
    exp: Date.now() + TOKEN_TTL_MS,
    a: employee.isAdmin === true,
    o: employee.isOwner === true,
    t: typeof employee.adminTier === 'string' ? employee.adminTier : ''
  };
  const payloadB64 = base64UrlEncodeString_(JSON.stringify(payload));
  const sig = hmacSign_(payloadB64);
  return payloadB64 + '.' + sig;
}

function verifyToken_(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) {
    return { valid: false, error: { code: 'AUTH_INVALID', message: 'Invalid session token' } };
  }
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: { code: 'AUTH_INVALID', message: 'Invalid session token' } };
  }
  const [payloadB64, sig] = parts;
  const expectedSig = hmacSign_(payloadB64);
  if (!constantTimeEq_(sig, expectedSig)) {
    return { valid: false, error: { code: 'AUTH_INVALID', message: 'Session signature mismatch' } };
  }
  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToString_(payloadB64));
  } catch (err) {
    return { valid: false, error: { code: 'AUTH_INVALID', message: 'Malformed session token' } };
  }
  if (!payload.exp || payload.exp < Date.now()) {
    return { valid: false, error: { code: 'AUTH_EXPIRED', message: 'Session expired, please log in again' } };
  }
  return { valid: true, email: payload.e, isAdmin: payload.a === true, isOwner: payload.o === true, adminTier: typeof payload.t === 'string' ? payload.t : '' };
}

function generateSalt_() {
  return Utilities.getUuid();
}

function hashPassword_(salt, password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(salt) + String(password)
  );
  return base64UrlEncodeBytes_(bytes);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHEET MENU
// ═══════════════════════════════════════════════════════════════════════════════

// Installs a "Rainbow Admin" menu in the spreadsheet on open.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Rainbow Admin')
    .addItem('Rotate HMAC Secret (force log out all users)', 'rotateHmacSecret')
    .addToUi();
}

// Emergency-use: change the signing secret so every token out in the wild becomes invalid.
// Every currently-signed-in user is bounced to the login screen on their next action.
function rotateHmacSecret() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Rotate HMAC Secret?',
    'Every logged-in user (including you) will be bounced to the login screen on their next action. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const raw = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  PropertiesService.getScriptProperties().setProperty('HMAC_SECRET', Utilities.base64Encode(bytes));

  ui.alert('Done. All active sessions have been invalidated.');
}

/**
 * Login - verify email and password
 * Returns employee data (without password) if successful
 */
function login(payload) {
  const { email, password } = payload;

  if (!email || !password) {
    return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Email and password are required' } };
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const employee = employees.find(e => String(e.email || '').trim().toLowerCase() === normalizedEmail);

  if (!employee) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } };
  }

  if (!employee.active) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Account is inactive. Please contact your administrator.' } };
  }

  // S67: hash-only auth. Backfill 2026-04-18 ensured every active row has
  // passwordHash + passwordSalt. New employees and admin resets write the
  // hash directly. Plaintext fallback removed.
  const pwStr = String(password);

  if (!employee.passwordHash || !employee.passwordSalt) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } };
  }

  // v2.27: when the row is still on its default password, hash the lowercased
  // input so phone autocorrect (auto-capitalized first letter) still matches.
  // User-chosen passwords stay strict.
  const isOnDefault = (
    employee.passwordChanged === false ||
    String(employee.passwordChanged).toUpperCase() === 'FALSE' ||
    employee.passwordChanged === undefined ||
    employee.passwordChanged === ''
  );
  const candidates = isOnDefault ? [pwStr.toLowerCase(), pwStr] : [pwStr];
  const authOk = candidates.some(cand => constantTimeEq_(
    hashPassword_(String(employee.passwordSalt), cand),
    String(employee.passwordHash)
  ));

  if (!authOk) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } };
  }

  const token = createToken_(employee);

  const { password: _pw, passwordHash: _ph, passwordSalt: _ps, _rowIndex, ...safeEmployee } = employee;

  // S41.3: passwordChanged flag is authoritative when present. Otherwise fall
  // back to the pattern-based check so sheets without the column still work.
  // v2.27: pattern check now also matches FirstnameL-style strings (letters,
  // optional trailing collision digit) in addition to legacy emp-XXX.
  let usingDefaultPassword;
  if (employee.passwordChanged === true || String(employee.passwordChanged).toUpperCase() === 'TRUE') {
    usingDefaultPassword = false;
  } else if (employee.passwordChanged === false || String(employee.passwordChanged).toUpperCase() === 'FALSE') {
    usingDefaultPassword = true;
  } else {
    usingDefaultPassword = String(employee.id) === pwStr || /^emp-\d{3}$/.test(pwStr) || /^[A-Za-z]+\d*$/.test(pwStr);
  }

  return {
    success: true,
    data: {
      employee: safeEmployee,
      token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
      usingDefaultPassword,
      // Include the actual default password so the first-login modal can show it to the employee
      ...(usingDefaultPassword ? { defaultPassword: pwStr } : {})
    }
  };
}

/**
 * Change password
 */
function changePassword(payload) {
  const { targetEmail, currentPassword, newPassword } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 4 characters' } };
  }

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const emailToChange = targetEmail || callerEmail;
  const normalizedTarget = String(emailToChange || '').trim().toLowerCase();
  const employee = employees.find(e => String(e.email || '').trim().toLowerCase() === normalizedTarget);

  if (!employee) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } };
  }

  if (emailToChange === callerEmail) {
    // S67: hash-only check for current password.
    if (!employee.passwordHash || !employee.passwordSalt) {
      return { success: false, error: { code: 'AUTH_FAILED', message: 'Current password is incorrect' } };
    }
    // v2.29.1: mirror login's case-insensitive default-password match. resetPassword
    // stores hash(salt, default.toLowerCase()), so a passwordChanged=false employee
    // cannot complete the Set-Your-Password modal unless we accept the lowercased
    // currentPassword as well. Strict once they've changed it.
    const currentStr = String(currentPassword);
    const isOnDefault = (
      employee.passwordChanged === false ||
      String(employee.passwordChanged).toUpperCase() === 'FALSE' ||
      employee.passwordChanged === undefined ||
      employee.passwordChanged === ''
    );
    const currentCandidates = isOnDefault ? [currentStr.toLowerCase(), currentStr] : [currentStr];
    const currentOk = currentCandidates.some(cand => constantTimeEq_(
      hashPassword_(String(employee.passwordSalt), cand),
      String(employee.passwordHash)
    ));
    if (!currentOk) {
      return { success: false, error: { code: 'AUTH_FAILED', message: 'Current password is incorrect' } };
    }
  } else {
    const normalizedCaller = String(callerEmail || '').trim().toLowerCase();
    const caller = employees.find(e => String(e.email || '').trim().toLowerCase() === normalizedCaller);
    if (!caller || (!caller.isAdmin && !caller.isOwner)) {
      return { success: false, error: { code: 'AUTH_FORBIDDEN', message: "Only administrators can change other users' passwords" } };
    }
  }

  // S36: store hash + salt for the new password and clear the plaintext column.
  // S41.3: mark passwordChanged=true when the user changes their OWN password so
  // login stops showing the default-password prompt even if the chosen password
  // happens to match the emp-XXX pattern.
  const salt = generateSalt_();
  const hash = hashPassword_(salt, String(newPassword));
  const updates = {
    password: '',
    passwordHash: hash,
    passwordSalt: salt
  };
  if (emailToChange === callerEmail) updates.passwordChanged = true;
  updateRow(CONFIG.TABS.EMPLOYEES, employee._rowIndex, updates);

  return { success: true, data: { message: 'Password changed successfully' } };
}

// Compute a FirstnameL default password from an employee's name, with
// collision handling against the existing roster. Excludes the row at
// excludeRowIndex (used by resetPassword so the target's current password
// doesn't count as a collision against itself).
function computeDefaultPassword_(name, employees, excludeRowIndex) {
  const cleaned = String(name || '').trim();
  if (!cleaned) {
    const seq = (employees ? employees.length + 1 : 1);
    return `emp-${String(seq).padStart(3, '0')}`;
  }
  const words = cleaned.split(/\s+/);
  let base;
  if (words.length === 1) {
    base = words[0];
  } else {
    const first = words[0];
    const last = words[words.length - 1];
    const lastInitial = last.split('-')[0].charAt(0);
    base = first + lastInitial;
  }
  const taken = (employees || [])
    .filter(e => !e.deleted && e._rowIndex !== excludeRowIndex)
    .map(e => String(e.password || '').toLowerCase());
  if (!taken.includes(base.toLowerCase())) return base;
  let i = 2;
  while (taken.includes(`${base}${i}`.toLowerCase())) i++;
  return `${base}${i}`;
}

function resetPassword(payload) {
  const { targetEmail } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const normalizedTarget = String(targetEmail || '').trim().toLowerCase();
  const employee = employees.find(e => String(e.email || '').trim().toLowerCase() === normalizedTarget);

  if (!employee) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } };
  }

  // v2.28: only the owner can reset the owner or any admin1.
  const callerIsOwner = !!auth.employee.isOwner;
  if (employee.isOwner === true && !callerIsOwner) {
    return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Only the owner can reset the owner password' } };
  }
  if (employee.adminTier === 'admin1' && !callerIsOwner) {
    return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'Only the owner can reset an admin1 password' } };
  }

  const newPassword = computeDefaultPassword_(employee.name, employees, employee._rowIndex);

  // Default-password hashes are computed from the lowercased value so login
  // accepts any casing (case-insensitive default-password match).
  const salt = generateSalt_();
  const hash = hashPassword_(salt, newPassword.toLowerCase());
  updateRow(CONFIG.TABS.EMPLOYEES, employee._rowIndex, {
    password: newPassword,
    passwordHash: hash,
    passwordSalt: salt,
    passwordChanged: false
  });

  return { success: true, data: { message: `Password reset to ${newPassword} for ${employee.name}`, newPassword } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateRequestId(prefix) {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function getTodayISO() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function isDateInPast(dateStr) {
  return dateStr < getTodayISO();
}

function anyDateInFuture(dates) {
  const today = getTodayISO();
  return dates.some(d => d >= today);
}

function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(dates) {
  if (!dates || dates.length === 0) return '';
  const sorted = [...dates].sort();
  const first = new Date(sorted[0] + 'T12:00:00');
  const last = new Date(sorted[sorted.length - 1] + 'T12:00:00');
  const monthFirst = first.toLocaleDateString('en-US', { month: 'short' });
  const monthLast = last.toLocaleDateString('en-US', { month: 'short' });
  const year = first.getFullYear();
  if (sorted.length === 1) return `${monthFirst} ${first.getDate()}, ${year}`;
  if (monthFirst === monthLast) return `${monthFirst} ${first.getDate()}-${last.getDate()}, ${year}`;
  return `${monthFirst} ${first.getDate()} - ${monthLast} ${last.getDate()}, ${year}`;
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF REQUESTS
// ═══════════════════════════════════════════════════════════════════════════════

function submitTimeOffRequest(payload) {
  const { dates, reason } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  if (dates.some(d => isDateInPast(d))) {
    return { success: false, error: { code: 'PAST_DATE', message: 'Cannot request time off for dates that have already passed' } };
  }

  // S41.5: block overlap against BOTH pending and approved requests. Pending
  // is the "one at a time" guard; approved catches re-requesting days the user
  // already has off.
  const existingRequests = getSheetData(CONFIG.TABS.SHIFT_CHANGES)
    .filter(r => r.requestType === 'time_off' && r.employeeEmail === callerEmail && ['pending', 'approved'].includes(r.status));

  for (const req of existingRequests) {
    const existingDates = req.datesRequested.split(',');
    const overlap = dates.some(d => existingDates.includes(d));
    if (overlap) {
      if (req.status === 'approved') {
        return { success: false, error: { code: 'ALREADY_SCHEDULED_OFF', message: 'You already have approved time off for one or more of these dates' } };
      }
      return { success: false, error: { code: 'ALREADY_PENDING', message: 'You already have a pending request for one or more of these dates' } };
    }
  }

  const requestId = generateRequestId('TOR');
  const now = new Date().toISOString();

  appendRow(CONFIG.TABS.SHIFT_CHANGES, {
    requestId,
    requestType: 'time_off',
    employeeName: auth.employee.name,
    employeeEmail: callerEmail,
    status: 'pending',
    createdTimestamp: now,
    datesRequested: dates.join(','),
    reason: reason || ''
  });

  sendTimeOffSubmittedEmail(auth.employee.name, dates, reason);

  return { success: true, data: { requestId, status: 'pending', createdTimestamp: now } };
}

function cancelTimeOffRequest(payload) {
  const { requestId } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };

    if (request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)) {
      return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You can only cancel your own requests' } };
    }

    if (request.status !== 'pending') {
      return { success: false, error: { code: 'INVALID_STATUS', message: `Cannot cancel a request that is already ${request.status}` } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'cancelled',
      decidedTimestamp: now,
      decidedBy: callerEmail
    });

    sendTimeOffCancelledEmail(request.employeeName, request.datesRequested.split(','));

    return { success: true, data: { requestId, status: 'cancelled' } };
  }, 'time-off cancel');
}

function approveTimeOffRequest(payload) {
  const { requestId } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    if (request.status !== 'pending') {
      const staleMsg = request.status === 'cancelled' ? 'This request has been cancelled by the employee.' :
                       request.status === 'approved' ? 'This request has already been approved.' :
                       request.status === 'denied' ? 'This request has already been denied.' :
                       'This request is no longer pending (status: ' + request.status + ').';
      return { success: false, error: { code: 'INVALID_STATUS', message: staleMsg } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'approved',
      decidedTimestamp: now,
      decidedBy: callerEmail
    });

    sendTimeOffApprovedEmail(request.employeeEmail, request.employeeName, request.datesRequested.split(','), auth.employee.name);

    return { success: true, data: { requestId, status: 'approved', decidedTimestamp: now } };
  }, 'time-off approve');
}

function denyTimeOffRequest(payload) {
  const { requestId, reason } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    if (request.status !== 'pending') {
      const staleMsg = request.status === 'cancelled' ? 'This request has been cancelled by the employee.' :
                       request.status === 'approved' ? 'This request has already been approved.' :
                       request.status === 'denied' ? 'This request has already been denied.' :
                       'This request is no longer pending (status: ' + request.status + ').';
      return { success: false, error: { code: 'INVALID_STATUS', message: staleMsg } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'denied',
      decidedTimestamp: now,
      decidedBy: callerEmail,
      reason: reason || ''
    });

    sendTimeOffDeniedEmail(request.employeeEmail, request.employeeName, request.datesRequested.split(','), reason);

    return { success: true, data: { requestId, status: 'denied', decidedTimestamp: now } };
  }, 'time-off deny');
}

function revokeTimeOffRequest(payload) {
  const { requestId, reason } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
    if (request.status !== 'approved') return { success: false, error: { code: 'INVALID_STATUS', message: 'Can only revoke approved requests' } };

    const dates = request.datesRequested.split(',');
    if (!anyDateInFuture(dates)) {
      return { success: false, error: { code: 'CANNOT_REVOKE_PAST', message: 'Cannot revoke - all dates have already passed' } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'revoked',
      revokedTimestamp: now,
      revokedBy: callerEmail,
      reason: reason || ''
    });

    sendTimeOffRevokedEmail(request.employeeEmail, request.employeeName, dates, reason, auth.employee.name);

    return { success: true, data: { requestId, status: 'revoked' } };
  }, 'time-off revoke');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT OFFERS
// ═══════════════════════════════════════════════════════════════════════════════

function submitShiftOffer(payload) {
  const { recipientEmail, shiftDate, shiftStart, shiftEnd, shiftRole } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  if (callerEmail === recipientEmail) {
    return { success: false, error: { code: 'SELF_REQUEST', message: 'Cannot offer a shift to yourself' } };
  }

  if (isDateInPast(shiftDate)) {
    return { success: false, error: { code: 'PAST_DATE', message: 'Cannot offer a shift that has already passed' } };
  }

  const recipient = getEmployeeByEmail(recipientEmail);
  if (!recipient) return { success: false, error: { code: 'NOT_FOUND', message: 'Recipient not found or inactive' } };

  if (recipient.isAdmin || recipient.isOwner) {
    return { success: false, error: { code: 'RECIPIENT_UNAVAILABLE', message: 'Cannot offer shifts to administrators' } };
  }

  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  // v2.21.0: only work shifts are transferable. A day with only a meeting/pk
  // has no offerable shift; a recipient with only a meeting/pk is still free.
  const offererShift = shifts.find(s => s.employeeEmail === callerEmail && s.date === shiftDate && (s.type || 'work') === 'work');
  if (!offererShift) {
    const anyShift = shifts.find(s => s.employeeEmail === callerEmail && s.date === shiftDate);
    if (anyShift) {
      return { success: false, error: { code: 'INVALID_SHIFT_TYPE', message: 'Only work shifts can be offered. Meetings and PK events are not transferable.' } };
    }
    return { success: false, error: { code: 'NOT_YOUR_SHIFT', message: 'You do not have a shift on this date' } };
  }

  const recipientShift = shifts.find(s => s.employeeEmail === recipientEmail && s.date === shiftDate && (s.type || 'work') === 'work');
  if (recipientShift) {
    return { success: false, error: { code: 'RECIPIENT_UNAVAILABLE', message: `${recipient.name} is already scheduled on this date` } };
  }

  const requestId = generateRequestId('OFFER');
  const now = new Date().toISOString();

  appendRow(CONFIG.TABS.SHIFT_CHANGES, {
    requestId,
    requestType: 'shift_offer',
    employeeName: auth.employee.name,
    employeeEmail: callerEmail,
    status: 'awaiting_recipient',
    createdTimestamp: now,
    recipientName: recipient.name,
    recipientEmail,
    shiftDate,
    shiftStart,
    shiftEnd,
    shiftRole
  });

  sendOfferSubmittedEmail(recipientEmail, recipient.name, auth.employee.name, shiftDate, shiftStart, shiftEnd, shiftRole);

  return { success: true, data: { requestId, status: 'awaiting_recipient', createdTimestamp: now } };
}

function acceptShiftOffer(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
    if (request.recipientEmail !== callerEmail) return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You are not the recipient of this offer' } };
    if (request.status !== 'awaiting_recipient') return { success: false, error: { code: 'INVALID_STATUS', message: 'This offer is no longer awaiting your response' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'awaiting_admin',
      recipientNote: note || '',
      recipientRespondedTimestamp: now
    });

    sendOfferAcceptedEmail(request.employeeName, request.recipientName, request.shiftDate, request.shiftStart, request.shiftEnd, request.shiftRole);

    return { success: true, data: { requestId, status: 'awaiting_admin' } };
  }, 'shift-offer accept');
}

function declineShiftOffer(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
    if (request.recipientEmail !== callerEmail) return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You are not the recipient of this offer' } };
    if (request.status !== 'awaiting_recipient') return { success: false, error: { code: 'INVALID_STATUS', message: 'This offer is no longer awaiting your response' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'recipient_rejected',
      recipientNote: note || '',
      recipientRespondedTimestamp: now
    });

    sendOfferDeclinedEmail(request.employeeEmail, request.employeeName, request.recipientName, request.shiftDate, note);

    return { success: true, data: { requestId, status: 'recipient_rejected' } };
  }, 'shift-offer decline');
}

function cancelShiftOffer(payload) {
  const { requestId } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };

    if (request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)) {
      return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You can only cancel your own offers' } };
    }

    if (!['awaiting_recipient', 'awaiting_admin'].includes(request.status)) {
      return { success: false, error: { code: 'INVALID_STATUS', message: 'This offer can no longer be cancelled' } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'cancelled',
      cancelledTimestamp: now
    });

    if (request.status === 'awaiting_recipient') {
      sendOfferCancelledEmail(request.recipientEmail, request.recipientName, request.employeeName, request.shiftDate);
    }

    return { success: true, data: { requestId, status: 'cancelled' } };
  }, 'shift-offer cancel');
}

function approveShiftOffer(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
    if (request.status !== 'awaiting_admin') return { success: false, error: { code: 'INVALID_STATUS', message: 'Offer is not awaiting admin approval' } };

    // v2.29: validate recipient + shift BEFORE writing status. Avoids state where
    // SHIFT_CHANGES says "approved" but no shift transfer happened.
    const recipient = getEmployeeByEmail(request.recipientEmail);
    if (!recipient) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Recipient employee not found or no longer active' } };
    }

    const shifts = getSheetData(CONFIG.TABS.SHIFTS);
    const shiftRow = shifts.find(s =>
      s.employeeEmail === request.employeeEmail &&
      s.date === request.shiftDate &&
      (s.type || 'work') === 'work'
    );
    // Note: shiftRow may legitimately be missing if the shift was already deleted;
    // approval still proceeds (the request stays in the log) but no shift transfer
    // occurs. This matches existing behavior in the "if (shiftRow)" branch below.

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'approved',
      decidedTimestamp: now,
      decidedBy: callerEmail,
      adminNote: note || ''
    });

    if (shiftRow) {
      updateRow(CONFIG.TABS.SHIFTS, shiftRow._rowIndex, {
        employeeId: recipient.id,
        employeeName: recipient.name,
        employeeEmail: recipient.email
      });
    }

    sendOfferApprovedEmail(request.employeeEmail, request.recipientEmail, request.employeeName, request.recipientName, request.shiftDate, request.shiftStart, request.shiftEnd, request.shiftRole);

    return { success: true, data: { requestId, status: 'approved', decidedTimestamp: now } };
  }, 'shift-offer approve');
}

function rejectShiftOffer(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
    if (request.status !== 'awaiting_admin') return { success: false, error: { code: 'INVALID_STATUS', message: 'Offer is not awaiting admin approval' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'rejected',
      decidedTimestamp: now,
      decidedBy: callerEmail,
      adminNote: note || ''
    });

    sendOfferRejectedEmail(request.employeeEmail, request.recipientEmail, request.employeeName, request.recipientName, request.shiftDate, note);

    return { success: true, data: { requestId, status: 'rejected', decidedTimestamp: now } };
  }, 'shift-offer reject');
}

function revokeShiftOffer(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
    if (request.status !== 'approved') return { success: false, error: { code: 'INVALID_STATUS', message: 'Can only revoke approved offers' } };

    if (isDateInPast(request.shiftDate)) {
      return { success: false, error: { code: 'CANNOT_REVOKE_PAST', message: 'Cannot revoke - shift date has already passed' } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'revoked',
      revokedTimestamp: now,
      revokedBy: callerEmail,
      adminNote: note || ''
    });

    const shifts = getSheetData(CONFIG.TABS.SHIFTS);
    const shiftRow = shifts.find(s =>
      s.employeeEmail === request.recipientEmail &&
      s.date === request.shiftDate &&
      (s.type || 'work') === 'work'
    );

    if (shiftRow) {
      const offerer = getEmployeeByEmail(request.employeeEmail);
      if (!offerer) return { success: false, error: { code: 'NOT_FOUND', message: 'Original employee not found' } };
      updateRow(CONFIG.TABS.SHIFTS, shiftRow._rowIndex, {
        employeeId: offerer.id,
        employeeName: offerer.name,
        employeeEmail: offerer.email
      });
    }

    sendOfferRevokedEmail(request.employeeEmail, request.recipientEmail, request.employeeName, request.recipientName, request.shiftDate, request.shiftStart, request.shiftEnd, note);

    return { success: true, data: { requestId, status: 'revoked' } };
  }, 'shift-offer revoke');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT SWAPS
// ═══════════════════════════════════════════════════════════════════════════════

function submitSwapRequest(payload) {
  const { partnerEmail, initiatorShift, partnerShift } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  if (callerEmail === partnerEmail) {
    return { success: false, error: { code: 'SELF_REQUEST', message: 'Cannot swap shifts with yourself' } };
  }

  if (isDateInPast(initiatorShift.date) || isDateInPast(partnerShift.date)) {
    return { success: false, error: { code: 'PAST_DATE', message: 'Cannot swap shifts that have already passed' } };
  }

  const partner = getEmployeeByEmail(partnerEmail);
  if (!partner) return { success: false, error: { code: 'NOT_FOUND', message: 'Partner not found or inactive' } };

  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  // v2.21.0: only work shifts are swappable. Meetings and PK are mandatory.
  const initiatorOwnedShift = shifts.find(s => s.employeeEmail === callerEmail && s.date === initiatorShift.date && (s.type || 'work') === 'work');
  const partnerOwnedShift = shifts.find(s => s.employeeEmail === partnerEmail && s.date === partnerShift.date && (s.type || 'work') === 'work');

  if (!initiatorOwnedShift) {
    const anyInitiator = shifts.find(s => s.employeeEmail === callerEmail && s.date === initiatorShift.date);
    if (anyInitiator) return { success: false, error: { code: 'INVALID_SHIFT_TYPE', message: 'Only work shifts can be swapped. Meetings and PK events are not transferable.' } };
    return { success: false, error: { code: 'NOT_YOUR_SHIFT', message: `You don't have a shift on ${initiatorShift.date}` } };
  }
  if (!partnerOwnedShift) {
    const anyPartner = shifts.find(s => s.employeeEmail === partnerEmail && s.date === partnerShift.date);
    if (anyPartner) return { success: false, error: { code: 'INVALID_SHIFT_TYPE', message: `${partner.name}'s entry on that date is not a work shift and cannot be swapped.` } };
    return { success: false, error: { code: 'INVALID_SHIFTS', message: `${partner.name} doesn't have a shift on ${partnerShift.date}` } };
  }

  const requestId = generateRequestId('SWAP');
  const now = new Date().toISOString();

  appendRow(CONFIG.TABS.SHIFT_CHANGES, {
    requestId,
    requestType: 'shift_swap',
    employeeName: auth.employee.name,
    employeeEmail: callerEmail,
    status: 'awaiting_partner',
    createdTimestamp: now,
    partnerName: partner.name,
    partnerEmail,
    initiatorShiftDate: initiatorShift.date,
    initiatorShiftStart: initiatorShift.start,
    initiatorShiftEnd: initiatorShift.end,
    initiatorShiftRole: initiatorShift.role,
    partnerShiftDate: partnerShift.date,
    partnerShiftStart: partnerShift.start,
    partnerShiftEnd: partnerShift.end,
    partnerShiftRole: partnerShift.role
  });

  sendSwapSubmittedEmail(partnerEmail, partner.name, auth.employee.name, initiatorShift, partnerShift);

  return { success: true, data: { requestId, status: 'awaiting_partner', createdTimestamp: now } };
}

function acceptSwapRequest(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };
    if (request.partnerEmail !== callerEmail) return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You are not the partner in this swap' } };
    if (request.status !== 'awaiting_partner') return { success: false, error: { code: 'INVALID_STATUS', message: 'This swap is no longer awaiting your response' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'awaiting_admin',
      partnerNote: note || '',
      partnerRespondedTimestamp: now
    });

    sendSwapAcceptedEmail(request.employeeName, request.partnerName, request);

    return { success: true, data: { requestId, status: 'awaiting_admin' } };
  }, 'shift-swap accept');
}

function declineSwapRequest(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };
    if (request.partnerEmail !== callerEmail) return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You are not the partner in this swap' } };
    if (request.status !== 'awaiting_partner') return { success: false, error: { code: 'INVALID_STATUS', message: 'This swap is no longer awaiting your response' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'partner_rejected',
      partnerNote: note || '',
      partnerRespondedTimestamp: now
    });

    sendSwapDeclinedEmail(request.employeeEmail, request.employeeName, request.partnerName, note);

    return { success: true, data: { requestId, status: 'partner_rejected' } };
  }, 'shift-swap decline');
}

function cancelSwapRequest(payload) {
  const { requestId } = payload;

  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };

    if (request.employeeEmail !== callerEmail && !isAdminUser(callerEmail)) {
      return { success: false, error: { code: 'AUTH_FORBIDDEN', message: 'You can only cancel your own swap requests' } };
    }

    if (!['awaiting_partner', 'awaiting_admin'].includes(request.status)) {
      return { success: false, error: { code: 'INVALID_STATUS', message: 'This swap can no longer be cancelled' } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'cancelled',
      cancelledTimestamp: now
    });

    sendSwapCancelledEmail(request.partnerEmail, request.partnerName, request.employeeName);

    return { success: true, data: { requestId, status: 'cancelled' } };
  }, 'shift-swap cancel');
}

function approveSwapRequest(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };
    if (request.status !== 'awaiting_admin') return { success: false, error: { code: 'INVALID_STATUS', message: 'Swap is not awaiting admin approval' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'approved',
      decidedTimestamp: now,
      decidedBy: callerEmail,
      swapAdminNote: note || ''
    });

    const shifts = getSheetData(CONFIG.TABS.SHIFTS);
    const initiatorShiftRow = shifts.find(s =>
      s.employeeEmail === request.employeeEmail &&
      s.date === request.initiatorShiftDate &&
      (s.type || 'work') === 'work'
    );
    const partnerShiftRow = shifts.find(s =>
      s.employeeEmail === request.partnerEmail &&
      s.date === request.partnerShiftDate &&
      (s.type || 'work') === 'work'
    );
    const initiator = getEmployeeByEmail(request.employeeEmail);
    const partner = getEmployeeByEmail(request.partnerEmail);

    if (initiatorShiftRow && partnerShiftRow && initiator && partner) {
      updateRow(CONFIG.TABS.SHIFTS, initiatorShiftRow._rowIndex, {
        employeeId: partner.id, employeeName: partner.name, employeeEmail: partner.email
      });
      updateRow(CONFIG.TABS.SHIFTS, partnerShiftRow._rowIndex, {
        employeeId: initiator.id, employeeName: initiator.name, employeeEmail: initiator.email
      });
    }

    sendSwapApprovedEmail(request.employeeEmail, request.partnerEmail, request.employeeName, request.partnerName, request);

    return { success: true, data: { requestId, status: 'approved', decidedTimestamp: now } };
  }, 'shift-swap approve');
}

function rejectSwapRequest(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };
    if (request.status !== 'awaiting_admin') return { success: false, error: { code: 'INVALID_STATUS', message: 'Swap is not awaiting admin approval' } };

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'rejected',
      decidedTimestamp: now,
      decidedBy: callerEmail,
      swapAdminNote: note || ''
    });

    sendSwapRejectedEmail(request.employeeEmail, request.partnerEmail, request.employeeName, request.partnerName, note);

    return { success: true, data: { requestId, status: 'rejected', decidedTimestamp: now } };
  }, 'shift-swap reject');
}

function revokeSwapRequest(payload) {
  const { requestId, note } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  return withDocumentLock_(() => {
    const callerEmail = auth.employee.email;

    // Re-fetch inside the lock to defeat stale snapshots.
    const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
    const request = requests.find(r => r.requestId === requestId);

    if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Swap request not found' } };
    if (request.status !== 'approved') return { success: false, error: { code: 'INVALID_STATUS', message: 'Can only revoke approved swaps' } };

    if (isDateInPast(request.initiatorShiftDate) || isDateInPast(request.partnerShiftDate)) {
      return { success: false, error: { code: 'CANNOT_REVOKE_PAST', message: 'Cannot revoke - one or both shift dates have already passed' } };
    }

    const now = new Date().toISOString();
    updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
      status: 'revoked',
      revokedTimestamp: now,
      revokedBy: callerEmail,
      swapAdminNote: note || ''
    });

    const shifts = getSheetData(CONFIG.TABS.SHIFTS);
    const initiatorNowOnPartnerDate = shifts.find(s =>
      s.employeeEmail === request.employeeEmail &&
      s.date === request.partnerShiftDate &&
      (s.type || 'work') === 'work'
    );
    const partnerNowOnInitiatorDate = shifts.find(s =>
      s.employeeEmail === request.partnerEmail &&
      s.date === request.initiatorShiftDate &&
      (s.type || 'work') === 'work'
    );
    const initiator = getEmployeeByEmail(request.employeeEmail);
    const partner = getEmployeeByEmail(request.partnerEmail);

    if (initiatorNowOnPartnerDate && partnerNowOnInitiatorDate && initiator && partner) {
      updateRow(CONFIG.TABS.SHIFTS, initiatorNowOnPartnerDate._rowIndex, {
        employeeId: partner.id, employeeName: partner.name, employeeEmail: partner.email
      });
      updateRow(CONFIG.TABS.SHIFTS, partnerNowOnInitiatorDate._rowIndex, {
        employeeId: initiator.id, employeeName: initiator.name, employeeEmail: initiator.email
      });
    }

    sendSwapRevokedEmail(request.employeeEmail, request.partnerEmail, request.employeeName, request.partnerName, note);

    return { success: true, data: { requestId, status: 'revoked' } };
  }, 'shift-swap revoke');
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getEmployeeRequests(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  const allRequests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const myRequests = allRequests.filter(r =>
    r.employeeEmail === callerEmail ||
    r.recipientEmail === callerEmail ||
    r.partnerEmail === callerEmail
  );

  return { success: true, data: { requests: myRequests } };
}

function getAdminQueue(payload) {
  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const allRequests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);

  return {
    success: true,
    data: {
      timeOff: allRequests.filter(r => r.requestType === 'time_off' && r.status === 'pending'),
      offers: allRequests.filter(r => r.requestType === 'shift_offer' && r.status === 'awaiting_admin'),
      swaps: allRequests.filter(r => r.requestType === 'shift_swap' && r.status === 'awaiting_admin')
    }
  };
}

function getIncomingOffers(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  const offers = getSheetData(CONFIG.TABS.SHIFT_CHANGES).filter(r =>
    r.requestType === 'shift_offer' &&
    r.recipientEmail === callerEmail &&
    r.status === 'awaiting_recipient'
  );

  return { success: true, data: { offers } };
}

function getIncomingSwaps(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerEmail = auth.employee.email;

  const swaps = getSheetData(CONFIG.TABS.SHIFT_CHANGES).filter(r =>
    r.requestType === 'shift_swap' &&
    r.partnerEmail === callerEmail &&
    r.status === 'awaiting_partner'
  );

  return { success: true, data: { swaps } };
}

function getAllData(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getCachedSheetData_(CONFIG.TABS.EMPLOYEES);
  const shifts = getCachedSheetData_(CONFIG.TABS.SHIFTS);
  const settings = getCachedSheetData_(CONFIG.TABS.SETTINGS);
  const announcements = getCachedSheetData_(CONFIG.TABS.ANNOUNCEMENTS);
  const requests = getCachedSheetData_(CONFIG.TABS.SHIFT_CHANGES);

  const livePeriodsRow = settings.find(s => s.key === 'livePeriods');
  const livePeriods = livePeriodsRow && livePeriodsRow.value
    ? String(livePeriodsRow.value).split(',').filter(p => p !== '').map(p => parseInt(p, 10))
    : [];

  const staffingTargetsRow = settings.find(s => s.key === 'staffingTargets');
  let staffingTargets = null;
  if (staffingTargetsRow && staffingTargetsRow.value) {
    try { staffingTargets = JSON.parse(staffingTargetsRow.value); } catch (e) {}
  }

  const hoursOverridesRow = settings.find(s => s.key === 'storeHoursOverrides');
  let storeHoursOverrides = null;
  if (hoursOverridesRow && hoursOverridesRow.value) {
    try { storeHoursOverrides = JSON.parse(hoursOverridesRow.value); } catch (e) {}
  }

  const targetOverridesRow = settings.find(s => s.key === 'staffingTargetOverrides');
  let staffingTargetOverrides = null;
  if (targetOverridesRow && targetOverridesRow.value) {
    try { staffingTargetOverrides = JSON.parse(targetOverridesRow.value); } catch (e) {}
  }

  const callerIsAdmin = !!(auth.employee.isAdmin || auth.employee.isOwner);
  return {
    success: true,
    data: {
      employees: employees.map(e => safeEmployeeForCaller_(e, callerIsAdmin)),
      shifts: shifts.map(s => { const { _rowIndex, ...rest } = s; return { ...rest, type: rest.type || 'work', note: rest.note || '' }; }),
      settings,
      announcements,
      requests: requests.map(r => { const { _rowIndex, ...rest } = r; return rest; }),
      livePeriods,
      staffingTargets,
      storeHoursOverrides,
      staffingTargetOverrides
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function getEmployees(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const callerIsAdmin = !!(auth.employee.isAdmin || auth.employee.isOwner);
  const employees = getSheetData(CONFIG.TABS.EMPLOYEES).map(e => safeEmployeeForCaller_(e, callerIsAdmin));
  return { success: true, data: { employees } };
}

function getShifts(payload) {
  const auth = verifyAuth(payload);
  if (!auth.authorized) return { success: false, error: auth.error };
  const shifts = getSheetData(CONFIG.TABS.SHIFTS).map(s => ({ ...s, type: s.type || 'work', note: s.note || '' }));
  return { success: true, data: { shifts } };
}

function saveShift(payload) {
  const { shift } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d);
  };

  const shiftDate = normalizeDate(shift.date);
  const shiftType = shift.type || 'work';
  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  const existingShift = shifts.find(s =>
    s.employeeId === shift.employeeId &&
    normalizeDate(s.date) === shiftDate &&
    (s.type || 'work') === shiftType
  );

  if (shift.deleted) {
    if (existingShift) {
      getSheet(CONFIG.TABS.SHIFTS).deleteRow(existingShift._rowIndex);
      bustSheetCache_(CONFIG.TABS.SHIFTS);
      return { success: true, data: { deleted: true } };
    }
    return { success: true, data: { deleted: false, message: 'No matching shift found' } };
  }

  if (existingShift) {
    updateRow(CONFIG.TABS.SHIFTS, existingShift._rowIndex, shift);
  } else {
    appendRow(CONFIG.TABS.SHIFTS, shift);
  }

  sendScheduleChangeNotification_(auth.employee,
    `Single shift save: employee ${shift.employeeId} on ${shiftDate} (${shift.start || ''}-${shift.end || ''}).`);

  return { success: true, data: { shift } };
}

/**
 * ★ RS-24: Save/update an employee
 * - New employees: use provided password (emp-XXX format from frontend), fall back to employee ID
 * - Existing employees: NEVER overwrite the password column
 */
function saveEmployee(payload) {
  const { employee } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);

  const normalizedEmail = String(employee.email || '').trim().toLowerCase();
  if (normalizedEmail) {
    const existing = employees.find(e =>
      !e.deleted &&
      e.id !== employee.id &&
      String(e.email || '').trim().toLowerCase() === normalizedEmail
    );
    if (existing) {
      return { success: false, error: { code: 'DUPLICATE_EMAIL', message: `Email already used by ${existing.name}` } };
    }
  }

  // v2.28: filter incoming employee to allowlist. Owner-only fields require
  // caller to be owner; protected credential fields are silently dropped.
  const callerIsOwner = !!auth.employee.isOwner;
  const filtered = {};
  for (const key of SAVE_EMPLOYEE_FIELDS_) {
    if (employee[key] !== undefined) filtered[key] = employee[key];
  }
  for (const key of SAVE_EMPLOYEE_OWNER_ONLY_FIELDS_) {
    if (employee[key] !== undefined) {
      if (!callerIsOwner) {
        return { success: false, error: { code: 'AUTH_FORBIDDEN', message: `Only the owner can change ${key}` } };
      }
      filtered[key] = employee[key];
    }
  }

  const existingEmployee = employees.find(e => e.id === employee.id);

  if (existingEmployee) {
    updateRow(CONFIG.TABS.EMPLOYEES, existingEmployee._rowIndex, filtered);
  } else {
    // New employee. If admin didn't supply an explicit password, compute the
    // FirstnameL default from the name. Default-password hashes are computed
    // from the lowercased value so login accepts any casing.
    // employee.password may be admin-supplied (initial password override).
    // Prefer it but fall through to computeDefaultPassword_ if missing.
    const plaintextPw = employee.password || computeDefaultPassword_(filtered.name, employees);
    const salt = generateSalt_();
    const hash = hashPassword_(salt, String(plaintextPw).toLowerCase());
    const employeeToSave = {
      ...filtered,
      password: plaintextPw,
      passwordHash: hash,
      passwordSalt: salt,
      passwordChanged: false
    };
    appendRow(CONFIG.TABS.EMPLOYEES, employeeToSave);
  }

  return { success: true, data: { employee } };
}

function saveLivePeriods(payload) {
  const { livePeriods } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const livePeriodsStr = Array.isArray(livePeriods) ? livePeriods.join(',') : String(livePeriods);
  const settings = getSheetData(CONFIG.TABS.SETTINGS);
  const existing = settings.find(s => s.key === 'livePeriods');

  if (existing) {
    updateCell(CONFIG.TABS.SETTINGS, existing._rowIndex, 'value', livePeriodsStr);
  } else {
    appendRow(CONFIG.TABS.SETTINGS, { key: 'livePeriods', value: livePeriodsStr });
  }

  return { success: true, data: { livePeriods: livePeriodsStr } };
}

function saveStaffingTargets(payload) {
  const { staffingTargets } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (!staffingTargets || typeof staffingTargets !== 'object') {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'staffingTargets must be an object' } };
  }

  const targetsStr = JSON.stringify(staffingTargets);
  const settings = getSheetData(CONFIG.TABS.SETTINGS);
  const existing = settings.find(s => s.key === 'staffingTargets');

  if (existing) {
    updateCell(CONFIG.TABS.SETTINGS, existing._rowIndex, 'value', targetsStr);
  } else {
    appendRow(CONFIG.TABS.SETTINGS, { key: 'staffingTargets', value: targetsStr });
  }

  return { success: true, data: { staffingTargets } };
}

function saveSetting(payload) {
  const { key, value } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (!key) return { success: false, error: { code: 'VALIDATION_ERROR', message: 'key is required' } };

  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const settings = getSheetData(CONFIG.TABS.SETTINGS);
  const existing = settings.find(s => s.key === key);

  if (existing) {
    updateCell(CONFIG.TABS.SETTINGS, existing._rowIndex, 'value', valueStr);
  } else {
    appendRow(CONFIG.TABS.SETTINGS, { key, value: valueStr });
  }

  return { success: true, data: { key, value } };
}

function columnLetter_(n) {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function batchSaveShifts(payload) {
  const { shifts, periodDates, allShiftKeys } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d);
  };

  // v2.19 perf: single Sheets.Spreadsheets.Values.update() replaces the N*deleteRow + N*updateRow/appendRow
  // loop. One round trip to Sheets API instead of hundreds. v2.30.2: lock acquisition delegated to
  // withDocumentLock_ so the timeout (10s) and CONCURRENT_EDIT contract are owned by one helper.
  return withDocumentLock_(() => {
    const sheet = getSheet(CONFIG.TABS.SHIFTS);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existingValues = sheet.getDataRange().getValues();
    const existing = parseSheetValues_(existingValues);

    // v2.26.0: meetings allow N per (empId, date) — keyed by row id so multiple
    // meetings on the same day each get their own row. Singular types (work, sick,
    // pk) keep the 3-tuple key so the singular invariant holds. Back-compat:
    // missing type falls back to 'work'. Missing id on a meeting (e.g. legacy row
    // pre-N-meetings) is given a synthetic id derived from 3-tuple — preserves the
    // legacy row's identity so it isn't accidentally appended-as-new.
    const SINGULAR_TYPES_ = { work: 1, sick: 1, pk: 1 };
    const keyOf = (s) => {
      const t = s.type || 'work';
      const d = normalizeDate(s.date);
      if (SINGULAR_TYPES_[t]) return `${s.employeeId}-${d}-${t}`;
      return s.id ? String(s.id) : `${t.toUpperCase()}-${s.employeeId}-${d}`;
    };

    const keepKeys = new Set();
    if (allShiftKeys && allShiftKeys.length > 0) {
      allShiftKeys.forEach(k => keepKeys.add(k));
    } else {
      shifts.forEach(s => keepKeys.add(keyOf(s)));
    }
    const periodSet = new Set(periodDates || []);

    // Preserve original row order: keep survivors (not in period, or in period-and-kept).
    const survivors = [];
    const survivorIdx = new Map();
    existing.forEach(row => {
      const d = normalizeDate(row.date);
      const key = keyOf(row);
      if (!periodSet.has(d) || keepKeys.has(key)) {
        survivorIdx.set(key, survivors.length);
        survivors.push(row);
      }
    });

    // Overlay updates from shifts[] — update in place if key already a survivor, else append.
    const updates = new Map();
    shifts.forEach(s => { updates.set(keyOf(s), s); });
    updates.forEach((s, key) => {
      if (survivorIdx.has(key)) survivors[survivorIdx.get(key)] = s;
      else survivors.push(s);
    });

    const deletedCount = existing.length - (survivors.length - shifts.filter(s => !existing.some(e => keyOf(e) === keyOf(s))).length);

    const newRows = survivors.map(row =>
      headers.map(h => row[h] !== undefined && row[h] !== null ? row[h] : '')
    );

    // Pad to the max of old/new length so stale rows below get wiped.
    const numCols = headers.length;
    const targetRows = Math.max(existing.length, newRows.length);
    while (newRows.length < targetRows) {
      newRows.push(new Array(numCols).fill(''));
    }

    if (targetRows > 0) {
      const lastCol = columnLetter_(numCols);
      const range = `${CONFIG.TABS.SHIFTS}!A2:${lastCol}${1 + targetRows}`;
      // USER_ENTERED matches the legacy appendRow/setValue behavior (Sheets auto-parses date strings,
      // time strings, booleans, etc.) so cell types stay consistent with what's already in the sheet.
      Sheets.Spreadsheets.Values.update(
        { values: newRows },
        getSpreadsheet().getId(),
        range,
        { valueInputOption: 'USER_ENTERED' }
      );
      bustSheetCache_(CONFIG.TABS.SHIFTS);
    }

    const savedCount = shifts.length;
    const deletedCountSafe = Math.max(0, deletedCount);
    sendScheduleChangeNotification_(auth.employee,
      `Bulk schedule save: ${savedCount} shift(s) written, ${deletedCountSafe} removed.`);

    return { success: true, data: { savedCount, deletedCount: deletedCountSafe } };
  }, 'saving the schedule');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function saveAnnouncement(payload) {
  const { periodStartDate, subject, message } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (!periodStartDate) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'periodStartDate is required' } };
  }

  const normalizedDate = String(periodStartDate).split('T')[0];
  const announcements = getSheetData(CONFIG.TABS.ANNOUNCEMENTS);
  const existing = announcements.find(a => String(a.periodStartDate || '').split('T')[0] === normalizedDate);
  const now = new Date().toISOString();

  if (existing) {
    updateCell(CONFIG.TABS.ANNOUNCEMENTS, existing._rowIndex, 'subject', subject || '');
    updateCell(CONFIG.TABS.ANNOUNCEMENTS, existing._rowIndex, 'message', message || '');
    updateCell(CONFIG.TABS.ANNOUNCEMENTS, existing._rowIndex, 'updatedAt', now);
    return { success: true, data: { announcement: { id: existing.id, periodStartDate: normalizedDate, subject: subject || '', message: message || '', updatedAt: now } } };
  } else {
    const id = 'ANN-' + Utilities.getUuid().substring(0, 8);
    appendRow(CONFIG.TABS.ANNOUNCEMENTS, { id, periodStartDate: normalizedDate, subject: subject || '', message: message || '', updatedAt: now });
    return { success: true, data: { announcement: { id, periodStartDate: normalizedDate, subject: subject || '', message: message || '', updatedAt: now } } };
  }
}

function deleteAnnouncement(payload) {
  const { periodStartDate } = payload;

  const auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (!periodStartDate) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'periodStartDate is required' } };
  }

  const normalizedDate = String(periodStartDate).split('T')[0];
  const announcements = getSheetData(CONFIG.TABS.ANNOUNCEMENTS);
  const existing = announcements.find(a => String(a.periodStartDate || '').split('T')[0] === normalizedDate);

  if (!existing) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'No announcement found for this period' } };
  }

  getSheet(CONFIG.TABS.ANNOUNCEMENTS).deleteRow(existing._rowIndex);
  bustSheetCache_(CONFIG.TABS.ANNOUNCEMENTS);

  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Expire stale pending requests where the shift date has passed
 * Set up a daily time-driven trigger to run this automatically
 */
function checkExpiredRequests() {
  const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const today = getTodayISO();

  requests.forEach(request => {
    let shouldExpire = false;

    if (request.requestType === 'shift_offer' && ['awaiting_recipient', 'awaiting_admin'].includes(request.status)) {
      shouldExpire = request.shiftDate < today;
    }

    if (request.requestType === 'shift_swap' && ['awaiting_partner', 'awaiting_admin'].includes(request.status)) {
      shouldExpire = request.initiatorShiftDate < today || request.partnerShiftDate < today;
    }

    if (shouldExpire) {
      updateCell(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, 'status', 'expired');
    }
  });

  Logger.log('Expired requests check completed');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Backend-side branded HTML wrapper for notification emails.
// Mirrors the frontend buildBrandedHtml.js template; they drift independently
// (no shared config infra) which is acceptable per plan Decision 8.
// Default accent = OTR Blue (#0453A3). Does NOT import frontend modules.
var OTR_NAVY_ = '#0D0E22';
var OTR_WHITE_ = '#FDFEFC';
var OTR_ACCENT_DEFAULT_ = '#0453A3';
var APP_URL_ = 'https://rainbow-scheduling.vercel.app';

function BRANDED_EMAIL_WRAPPER_HTML_(content, accentHex, opts) {
  var accent = accentHex || OTR_ACCENT_DEFAULT_;
  opts = opts || {};
  var askType = opts.askType || '';
  var ctaText = opts.ctaText || '';
  var ctaUrl = opts.ctaUrl || '';
  // Escape HTML entities in content string before injecting.
  // content is already a formatted plaintext body; convert newlines to <br>.
  var escapeHtml_ = function (s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  var safeContent = escapeHtml_(content).replace(/\n/g, '<br>');
  var askTypeHtml = askType
    ? '<div style="font-size:11px;font-weight:700;color:' + accent + ';letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">' + escapeHtml_(askType) + '</div>'
    : '';
  var ctaHtml = (ctaText && ctaUrl)
    ? '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr>' +
      '<td style="background-color:' + accent + ';border-radius:6px;padding:10px 22px;">' +
      '<a href="' + ctaUrl + '" style="color:#FFFFFF;text-decoration:none;font-weight:600;font-size:13px;display:inline-block;">' + escapeHtml_(ctaText) + '</a>' +
      '</td></tr></table>'
    : '';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>' +
    '<body style="margin:0;padding:0;background-color:' + OTR_WHITE_ + ';font-family:Arial,Helvetica,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + OTR_WHITE_ + '" style="background-color:' + OTR_WHITE_ + ';">' +
    '<tr><td align="center" style="padding:24px 12px;">' +
    '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-top:2px solid ' + accent + ';">' +
    '<tr><td style="background-color:' + OTR_NAVY_ + ';padding:32px 24px 28px 24px;text-align:center;">' +
    '<div style="line-height:1;color:' + OTR_WHITE_ + ';">' +
    '<div style="font-size:12px;font-weight:300;letter-spacing:3px;text-transform:uppercase;">OVER THE</div>' +
    '<div style="font-size:18px;font-weight:600;letter-spacing:2.7px;text-transform:uppercase;margin-top:2px;">RAINBOW</div>' +
    '</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:18px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">OTR Scheduling</div>' +
    '</td></tr>' +
    '<tr><td style="padding:20px 24px;background-color:#FFFFFF;">' +
    askTypeHtml +
    '<div style="font-size:14px;color:' + OTR_NAVY_ + ';line-height:1.6;">' + safeContent + '</div>' +
    ctaHtml +
    '</td></tr>' +
    '<tr><td style="padding:16px 24px;background-color:#F5F3F0;border-top:1px solid #E5E7EB;">' +
    '<div style="font-size:12px;color:#8B8580;text-align:center;">Over the Rainbow &bull; <a href="https://www.rainbowjeans.com" style="color:#8B8580;">www.rainbowjeans.com</a></div>' +
    '<div style="font-size:11px;color:#ABABAB;text-align:center;margin-top:4px;">This is an automated message from the OTR Scheduling App.</div>' +
    '</td></tr>' +
    '</table></td></tr></table>' +
    '</body></html>';
}

function sendEmail(to, subject, body, options) {
  try {
    var opts = options || {};
    var mailParams = { to: to, subject: subject, body: body, name: 'OTR Scheduling' };
    if (opts.html === true) {
      mailParams.htmlBody = BRANDED_EMAIL_WRAPPER_HTML_(body, opts.accentHex, {
        askType: opts.askType,
        ctaText: opts.ctaText,
        ctaUrl: opts.ctaUrl,
      });
    }
    MailApp.sendEmail(mailParams);
    Logger.log('Email sent to ' + to + ': ' + subject);
    return { success: true };
  } catch (error) {
    Logger.log('Failed to send email to ' + to + ': ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Send a fully-formed branded schedule email built by the frontend.
// Accepts { to, subject, htmlBody, plaintextBody } from the frontend EmailModal.
// Auth gate: any logged-in admin (same pattern as saveAnnouncement).
function sendBrandedScheduleEmail(payload) {
  var auth = verifyAuth(payload, true);
  if (!auth.authorized) return { success: false, error: auth.error };
  var to = payload.to;
  var subject = payload.subject;
  var htmlBody = payload.htmlBody;
  var plaintextBody = payload.plaintextBody;
  var bcc = payload.bcc;
  if (!to || !subject || !htmlBody) {
    return { success: false, error: { code: 'INVALID_PARAMS', message: 'Missing required fields: to, subject, htmlBody.' } };
  }
  try {
    var mailParams = { to: to, subject: subject, body: plaintextBody || '', htmlBody: htmlBody, name: 'OTR Scheduling' };
    if (bcc) mailParams.bcc = bcc;
    MailApp.sendEmail(mailParams);
    Logger.log('Branded schedule email sent to ' + to + (bcc ? ' (bcc ' + bcc + ')' : '') + ': ' + subject);
    return { success: true };
  } catch (error) {
    Logger.log('Failed to send branded schedule email to ' + to + ': ' + error.toString());
    return { success: false, error: { code: 'SEND_FAILED', message: error.toString() } };
  }
}

// v2.25.0: Notify Sarvi when a non-owner admin other than herself edits the
// schedule. Skips silently for Sarvi (email match) and the Owner (JR).
function sendScheduleChangeNotification_(caller, summary) {
  if (!caller) return;
  const callerEmail = String(caller.email || '').toLowerCase();
  const adminEmail = String(CONFIG.ADMIN_EMAIL || '').toLowerCase();
  if (callerEmail && callerEmail === adminEmail) return;
  if (caller.isOwner === true) return;
  const callerName = caller.name || caller.email || 'Unknown admin';
  sendEmail(CONFIG.ADMIN_EMAIL,
    `📝 Schedule edited by ${callerName}`,
    `${callerName} edited the schedule.\n\n${summary}`,
    { html: true, askType: 'Schedule change', ctaText: 'Open in App', ctaUrl: APP_URL_ }
  );
}

// ----- TIME OFF -----

function sendTimeOffSubmittedEmail(employeeName, dates, reason) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `🌴 Time-off request: ${employeeName}, ${formatDateRange(dates)}`,
    `From: ${employeeName}\nDates: ${formatDateRange(dates)}\nReason: ${reason || 'Not provided'}`,
    { html: true, askType: 'Time-off request', ctaText: 'Open in App', ctaUrl: APP_URL_ }
  );
}

function sendTimeOffApprovedEmail(employeeEmail, employeeName, dates, adminName) {
  sendEmail(employeeEmail,
    `Time Off Approved - ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nYour time off request has been approved!\n\nDates: ${formatDateRange(dates)}\nApproved by: ${adminName}\n\nYou are not scheduled to work on these dates.`,
    { html: true }
  );
}

function sendTimeOffDeniedEmail(employeeEmail, employeeName, dates, reason) {
  sendEmail(employeeEmail,
    `Time Off Request Denied - ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nUnfortunately, your time off request could not be approved.\n\nDates requested: ${formatDateRange(dates)}\nReason: ${reason || 'No reason provided'}\n\nIf you have questions, please speak with your manager.`,
    { html: true }
  );
}

function sendTimeOffCancelledEmail(employeeName, dates) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `❌ Time-off cancelled: ${employeeName}`,
    `${employeeName} withdrew their pending request for ${formatDateRange(dates)}.\n\nNo action needed.`,
    { html: true, askType: 'Time-off cancelled', ctaText: 'Open in App', ctaUrl: APP_URL_ }
  );
}

function sendTimeOffRevokedEmail(employeeEmail, employeeName, dates, reason, adminName) {
  sendEmail(employeeEmail,
    `Time Off Revoked - ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nYour previously approved time off has been revoked.\n\nDates: ${formatDateRange(dates)}\nReason: ${reason || 'No reason provided'}\nRevoked by: ${adminName}\n\nPlease check the schedule -- you may now be expected to work on these dates.`,
    { html: true }
  );
}

// ----- SHIFT OFFERS -----

function sendOfferSubmittedEmail(recipientEmail, recipientName, offererName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  sendEmail(recipientEmail,
    `${offererName} wants to give you their shift on ${formatDateDisplay(shiftDate)}`,
    `Hi ${recipientName},\n\n${offererName} would like to give you their shift:\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} - ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}\n\nPlease log into the scheduling app to accept or decline.`,
    { html: true }
  );
}

function sendOfferAcceptedEmail(offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `🤝 Approve shift transfer: ${offererName} → ${recipientName}`,
    `From: ${offererName}\nTo: ${recipientName}\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} - ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}`,
    { html: true, askType: 'Shift transfer — needs approval', ctaText: 'Open in App', ctaUrl: APP_URL_ }
  );
}

function sendOfferDeclinedEmail(offererEmail, offererName, recipientName, shiftDate, note) {
  sendEmail(offererEmail,
    `${recipientName} declined your shift offer`,
    `Hi ${offererName},\n\n${recipientName} has declined your shift offer for ${formatDateDisplay(shiftDate)}.\n\nTheir note: ${note || 'No note provided'}\n\nYou are still scheduled to work this shift.`,
    { html: true }
  );
}

function sendOfferCancelledEmail(recipientEmail, recipientName, offererName, shiftDate) {
  sendEmail(recipientEmail,
    `${offererName} cancelled their shift offer`,
    `Hi ${recipientName},\n\n${offererName} has cancelled their offer to give you their shift on ${formatDateDisplay(shiftDate)}.\n\nNo action needed.`,
    { html: true }
  );
}

function sendOfferApprovedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  const subject = `Shift transfer approved - ${formatDateDisplay(shiftDate)}`;
  const body = `The shift transfer has been approved!\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} - ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}\n\nPreviously: ${offererName}\nNow assigned to: ${recipientName}\n\nThe schedule has been updated.`;
  sendEmail(offererEmail, subject, body, { html: true });
  sendEmail(recipientEmail, subject, body, { html: true });
}

function sendOfferRejectedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, note) {
  const subject = `Shift transfer rejected`;
  const body = `The shift transfer request has been rejected by management.\n\nDate: ${formatDateDisplay(shiftDate)}\nOriginal holder: ${offererName}\nWould-be recipient: ${recipientName}\n\nAdmin note: ${note || 'No reason provided'}\n\n${offererName} remains assigned to this shift.`;
  sendEmail(offererEmail, subject, body, { html: true });
  sendEmail(recipientEmail, subject, body, { html: true });
}

function sendOfferRevokedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, note) {
  const subject = `Shift transfer revoked`;
  const body = `A previously approved shift transfer has been revoked.\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} - ${formatTimeDisplay(shiftEnd)}\nReason: ${note || 'No reason provided'}\n\nThe shift has been returned to ${offererName}.`;
  sendEmail(offererEmail, subject, body, { html: true });
  sendEmail(recipientEmail, subject, body, { html: true });
}

// ----- SHIFT SWAPS -----

function sendSwapSubmittedEmail(partnerEmail, partnerName, initiatorName, initiatorShift, partnerShift) {
  sendEmail(partnerEmail,
    `${initiatorName} wants to swap shifts with you`,
    `Hi ${partnerName},\n\n${initiatorName} would like to swap shifts with you.\n\nThey're offering: ${formatDateDisplay(initiatorShift.date)}, ${formatTimeDisplay(initiatorShift.start)} - ${formatTimeDisplay(initiatorShift.end)} (${initiatorShift.role})\nThey want yours: ${formatDateDisplay(partnerShift.date)}, ${formatTimeDisplay(partnerShift.start)} - ${formatTimeDisplay(partnerShift.end)} (${partnerShift.role})\n\nPlease log into the scheduling app to accept or decline.`,
    { html: true }
  );
}

function sendSwapAcceptedEmail(initiatorName, partnerName, request) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `🔁 Approve swap: ${initiatorName} ⇄ ${partnerName}`,
    `${initiatorName}'s shift: ${formatDateDisplay(request.initiatorShiftDate)}, ${formatTimeDisplay(request.initiatorShiftStart)} - ${formatTimeDisplay(request.initiatorShiftEnd)} (${request.initiatorShiftRole})\n${partnerName}'s shift: ${formatDateDisplay(request.partnerShiftDate)}, ${formatTimeDisplay(request.partnerShiftStart)} - ${formatTimeDisplay(request.partnerShiftEnd)} (${request.partnerShiftRole})`,
    { html: true, askType: 'Shift swap — needs approval', ctaText: 'Open in App', ctaUrl: APP_URL_ }
  );
}

function sendSwapDeclinedEmail(initiatorEmail, initiatorName, partnerName, note) {
  sendEmail(initiatorEmail,
    `${partnerName} declined your swap request`,
    `Hi ${initiatorName},\n\n${partnerName} has declined your shift swap request.\n\nTheir note: ${note || 'No note provided'}\n\nYour shifts remain unchanged.`,
    { html: true }
  );
}

function sendSwapCancelledEmail(partnerEmail, partnerName, initiatorName) {
  sendEmail(partnerEmail,
    `${initiatorName} cancelled their swap request`,
    `Hi ${partnerName},\n\n${initiatorName} has cancelled their swap request.\n\nNo action needed -- your schedule is unchanged.`,
    { html: true }
  );
}

function sendSwapApprovedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, request) {
  const subject = `Shift swap approved`;
  const body = `Your shift swap has been approved!\n\n${initiatorName} now works: ${formatDateDisplay(request.partnerShiftDate)}, ${formatTimeDisplay(request.partnerShiftStart)} - ${formatTimeDisplay(request.partnerShiftEnd)} (${request.partnerShiftRole})\n${partnerName} now works: ${formatDateDisplay(request.initiatorShiftDate)}, ${formatTimeDisplay(request.initiatorShiftStart)} - ${formatTimeDisplay(request.initiatorShiftEnd)} (${request.initiatorShiftRole})\n\nThe schedule has been updated.`;
  sendEmail(initiatorEmail, subject, body, { html: true });
  sendEmail(partnerEmail, subject, body, { html: true });
}

function sendSwapRejectedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, note) {
  const subject = `Shift swap rejected`;
  const body = `Your shift swap request has been rejected by management.\n\nAdmin note: ${note || 'No reason provided'}\n\nBoth employees keep their original shifts.`;
  sendEmail(initiatorEmail, subject, body, { html: true });
  sendEmail(partnerEmail, subject, body, { html: true });
}

function sendSwapRevokedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, note) {
  const subject = `Shift swap revoked`;
  const body = `A previously approved shift swap has been revoked.\n\nReason: ${note || 'No reason provided'}\n\nBoth shifts have been returned to their original owners. Please check the schedule.`;
  sendEmail(initiatorEmail, subject, body, { html: true });
  sendEmail(partnerEmail, subject, body, { html: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⭐ INITIAL SETUP — RUN THIS FIRST!
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ RUN THIS FUNCTION FIRST ⭐
 * Creates all 5 tabs with proper headers and initial data.
 * Safe to run multiple times — won't overwrite existing data.
 *
 * How to run:
 * 1. Open this script in Apps Script editor
 * 2. Select "setupSpreadsheet" from the function dropdown
 * 3. Click Run (play button)
 * 4. Grant permissions when prompted
 * 5. Check the Execution Log for results
 */
function setupSpreadsheet() {
  const ss = getSpreadsheet();
  Logger.log('Setting up Rainbow Scheduling Database: ' + ss.getName());

  createEmployeesTab(ss);
  createShiftsTab(ss);
  createSettingsTab(ss);
  createAnnouncementsTab(ss);
  createShiftChangesTab(ss);

  try {
    const sheet1 = ss.getSheetByName('Sheet1');
    if (sheet1 && sheet1.getLastRow() <= 1 && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet1);
    }
  } catch (e) {}

  Logger.log('✅ SETUP COMPLETE!');
}

function createEmployeesTab(ss) {
  const TAB_NAME = CONFIG.TABS.EMPLOYEES;
  let sheet = ss.getSheetByName(TAB_NAME);
  if (sheet && sheet.getLastRow() > 1) { Logger.log('⏭️ Employees: Already has data — skipping'); return; }
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  sheet.clear();

  const headers = ['id', 'name', 'email', 'password', 'phone', 'address', 'dob', 'active', 'isAdmin', 'isOwner', 'showOnSchedule', 'deleted', 'availability', 'defaultShift', 'counterPointId', 'adpNumber', 'rateOfPay', 'employmentType', 'passwordHash', 'passwordSalt', 'passwordChanged', 'defaultSection', 'adminTier', 'title'];
  const avail = JSON.stringify({
    sunday:    { available: true, start: '06:00', end: '22:00' },
    monday:    { available: true, start: '06:00', end: '22:00' },
    tuesday:   { available: true, start: '06:00', end: '22:00' },
    wednesday: { available: true, start: '06:00', end: '22:00' },
    thursday:  { available: true, start: '06:00', end: '22:00' },
    friday:    { available: true, start: '06:00', end: '22:00' },
    saturday:  { available: true, start: '06:00', end: '22:00' }
  });

  const data = [
    headers,
    ['emp-owner', 'JR', 'johnrichmond007@gmail.com', 'emp-owner', '', '', '', true, true, true, false, false, avail, '', '', '', '', '', '', '', '', '', '', ''],
    ['emp-admin-1', 'Sarvi', 'sarvi@rainbowjeans.com', 'emp-admin-1', '', '', '', true, true, false, false, false, avail, '', '', '', 'full-time', '', '', '', '', '', 'admin1', '']
  ];

  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  formatTab(sheet, headers.length);
  Logger.log('✅ Employees: Created with ' + (data.length - 1) + ' records');
}

function createShiftsTab(ss) {
  const TAB_NAME = CONFIG.TABS.SHIFTS;
  let sheet = ss.getSheetByName(TAB_NAME);
  if (sheet && sheet.getLastRow() > 1) { Logger.log('⏭️ Shifts: Already has data — skipping'); return; }
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  sheet.clear();
  const headers = ['id', 'employeeId', 'employeeName', 'employeeEmail', 'date', 'startTime', 'endTime', 'role', 'task', 'type', 'note'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatTab(sheet, headers.length);
  Logger.log('✅ Shifts: Created');
}

function createSettingsTab(ss) {
  const TAB_NAME = CONFIG.TABS.SETTINGS;
  let sheet = ss.getSheetByName(TAB_NAME);
  if (sheet && sheet.getLastRow() > 1) { Logger.log('⏭️ Settings: Already has data — skipping'); return; }
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  sheet.clear();
  const data = [
    ['key', 'value'],
    ['adminPassword', '1337'],
    ['storeName', 'Over the Rainbow'],
    ['storeEmail', 'sarvi@rainbowjeans.com'],
    ['storeAddress', ''],
    ['storePhone', '']
  ];
  sheet.getRange(1, 1, data.length, 2).setValues(data);
  formatTab(sheet, 2);
  Logger.log('✅ Settings: Created');
}

function createAnnouncementsTab(ss) {
  const TAB_NAME = CONFIG.TABS.ANNOUNCEMENTS;
  let sheet = ss.getSheetByName(TAB_NAME);
  if (sheet && sheet.getLastRow() > 1) { Logger.log('⏭️ Announcements: Already has data — skipping'); return; }
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  sheet.clear();
  const headers = ['id', 'periodStartDate', 'subject', 'message', 'updatedAt'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatTab(sheet, headers.length);
  Logger.log('✅ Announcements: Created');
}

function createShiftChangesTab(ss) {
  const TAB_NAME = CONFIG.TABS.SHIFT_CHANGES;
  let sheet = ss.getSheetByName(TAB_NAME);
  if (sheet && sheet.getLastRow() > 1) { Logger.log('⏭️ ShiftChanges: Already has data — skipping'); return sheet; }
  if (!sheet) sheet = ss.insertSheet(TAB_NAME);
  sheet.clear();
  const headers = [
    'requestId', 'requestType', 'employeeName', 'employeeEmail', 'status',
    'createdTimestamp', 'decidedTimestamp', 'decidedBy', 'revokedTimestamp', 'revokedBy',
    'datesRequested', 'reason',
    'recipientName', 'recipientEmail', 'shiftDate', 'shiftStart', 'shiftEnd', 'shiftRole',
    'recipientNote', 'recipientRespondedTimestamp', 'adminNote', 'cancelledTimestamp',
    'partnerName', 'partnerEmail', 'initiatorShiftDate', 'initiatorShiftStart', 'initiatorShiftEnd',
    'initiatorShiftRole', 'partnerShiftDate', 'partnerShiftStart', 'partnerShiftEnd',
    'partnerShiftRole', 'partnerNote', 'partnerRespondedTimestamp', 'swapAdminNote'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatTab(sheet, headers.length);
  Logger.log('✅ ShiftChanges: Created with ' + headers.length + ' columns');
  return sheet;
}

function formatTab(sheet, numColumns) {
  sheet.setFrozenRows(1);
  const headerRange = sheet.getRange(1, 1, 1, numColumns);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1e293b');
  headerRange.setFontColor('#f1f5f9');
  for (let i = 1; i <= numColumns; i++) {
    sheet.autoResizeColumn(i);
    if (sheet.getColumnWidth(i) > 200) sheet.setColumnWidth(i, 200);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function testSetup() {
  Logger.log('Testing Rainbow Scheduling Backend...');
  const ss = getSpreadsheet();
  Logger.log('Spreadsheet: ' + ss.getName());
  ss.getSheets().forEach(sheet => {
    const rows = sheet.getLastRow();
    Logger.log((rows > 1 ? '✅' : '⚠️ (empty)') + ' ' + sheet.getName() + ': ' + rows + ' rows');
  });
}

function testAPI() {
  const result = getAllData({ callerEmail: 'sarvi@rainbowjeans.com' });
  if (result.success) {
    Logger.log('✅ API working!');
    Logger.log('  Employees: ' + result.data.employees.length);
    Logger.log('  Shifts: ' + result.data.shifts.length);
    Logger.log('  Requests: ' + result.data.requests.length);
  } else {
    Logger.log('❌ API error: ' + result.error.message);
  }
}

/**
 * Clear all shift and request data (keeps Employees and Settings)
 * ⚠️ DESTRUCTIVE — use carefully
 */
function clearAllData() {
  const ss = getSpreadsheet();
  const shifts = ss.getSheetByName(CONFIG.TABS.SHIFTS);
  const changes = ss.getSheetByName(CONFIG.TABS.SHIFT_CHANGES);
  if (shifts && shifts.getLastRow() > 1) { shifts.deleteRows(2, shifts.getLastRow() - 1); Logger.log('Cleared Shifts'); }
  if (changes && changes.getLastRow() > 1) { changes.deleteRows(2, changes.getLastRow() - 1); Logger.log('Cleared ShiftChanges'); }
  Logger.log('Data cleared. Employees and Settings preserved.');
}
