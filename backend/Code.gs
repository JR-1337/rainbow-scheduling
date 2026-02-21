/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RAINBOW SCHEDULING APP - GOOGLE APPS SCRIPT BACKEND
 * ═══════════════════════════════════════════════════════════════════════════════
 * Version: 2.11 (RS-24 — emp-XXX password format)
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
      'deleteAnnouncement': () => deleteAnnouncement(payload)
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

function getSheetData(tabName) {
  const sheet = getSheet(tabName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, j) => {
      let value = data[i][j];
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

function updateCell(tabName, rowIndex, columnName, value) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(columnName) + 1;
  if (colIndex > 0) {
    sheet.getRange(rowIndex, colIndex).setValue(value);
  }
}

function updateRow(tabName, rowIndex, updates) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.entries(updates).forEach(([columnName, value]) => {
    const colIndex = headers.indexOf(columnName) + 1;
    if (colIndex > 0) {
      sheet.getRange(rowIndex, colIndex).setValue(value);
    }
  });
}

function appendRow(tabName, rowData) {
  const sheet = getSheet(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowArray = headers.map(header => {
    const value = rowData[header];
    return value !== undefined && value !== null ? value : '';
  });
  sheet.appendRow(rowArray);
  return sheet.getLastRow();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION & AUTHORIZATION
// ═══════════════════════════════════════════════════════════════════════════════

function getEmployeeByEmail(email) {
  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  return employees.find(e => e.email === email && e.active);
}

function isAdminUser(email) {
  const employee = getEmployeeByEmail(email);
  return employee && (employee.isAdmin || employee.isOwner);
}

function verifyAuth(callerEmail, requiredAdmin = false) {
  if (!callerEmail) {
    return { authorized: false, error: { code: 'AUTH_REQUIRED', message: 'Please log in to continue' } };
  }

  const employee = getEmployeeByEmail(callerEmail);
  if (!employee) {
    return { authorized: false, error: { code: 'AUTH_REQUIRED', message: 'Employee not found or inactive' } };
  }

  if (requiredAdmin && !employee.isAdmin && !employee.isOwner) {
    return { authorized: false, error: { code: 'AUTH_FORBIDDEN', message: "You don't have permission for this action" } };
  }

  return { authorized: true, employee };
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

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const employee = employees.find(e => e.email === email);

  if (!employee) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } };
  }

  if (!employee.active) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Account is inactive. Please contact your administrator.' } };
  }

  if (String(employee.password) !== String(password)) {
    return { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid email or password' } };
  }

  const { password: _, _rowIndex, ...safeEmployee } = employee;

  return {
    success: true,
    data: {
      employee: safeEmployee,
      // ★ RS-24: detect both old ID-based passwords AND new emp-XXX format passwords
      usingDefaultPassword: String(employee.password) === String(employee.id) ||
                            /^emp-\d{3}$/.test(String(employee.password))
    }
  };
}

/**
 * Change password
 */
function changePassword(payload) {
  const { callerEmail, targetEmail, currentPassword, newPassword } = payload;

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 4 characters' } };
  }

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const emailToChange = targetEmail || callerEmail;
  const employee = employees.find(e => e.email === emailToChange);

  if (!employee) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } };
  }

  if (emailToChange === callerEmail) {
    if (String(employee.password) !== String(currentPassword)) {
      return { success: false, error: { code: 'AUTH_FAILED', message: 'Current password is incorrect' } };
    }
  } else {
    const caller = employees.find(e => e.email === callerEmail);
    if (!caller || (!caller.isAdmin && !caller.isOwner)) {
      return { success: false, error: { code: 'AUTH_FORBIDDEN', message: "Only administrators can change other users' passwords" } };
    }
  }

  updateCell(CONFIG.TABS.EMPLOYEES, employee._rowIndex, 'password', String(newPassword));

  return { success: true, data: { message: 'Password changed successfully' } };
}

/**
 * ★ RS-24: Reset password to emp-XXX format (row-based) — Admin only
 * Row 2 = emp-001, Row 3 = emp-002, etc.
 */
function resetPassword(payload) {
  const { callerEmail, targetEmail } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const employee = employees.find(e => e.email === targetEmail);

  if (!employee) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } };
  }

  // _rowIndex is 1-based (row 1 = header), so row 2 = emp-001, row 3 = emp-002, etc.
  const sequenceNum = employee._rowIndex - 1;
  const newPassword = `emp-${String(sequenceNum).padStart(3, '0')}`;

  updateCell(CONFIG.TABS.EMPLOYEES, employee._rowIndex, 'password', newPassword);

  return { success: true, data: { message: `Password reset to ${newPassword} for ${employee.name}` } };
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
  const { callerEmail, dates, reason } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (dates.some(d => isDateInPast(d))) {
    return { success: false, error: { code: 'PAST_DATE', message: 'Cannot request time off for dates that have already passed' } };
  }

  const existingRequests = getSheetData(CONFIG.TABS.SHIFT_CHANGES)
    .filter(r => r.requestType === 'time_off' && r.employeeEmail === callerEmail && r.status === 'pending');

  for (const req of existingRequests) {
    const existingDates = req.datesRequested.split(',');
    if (dates.some(d => existingDates.includes(d))) {
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
  const { callerEmail, requestId } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function approveTimeOffRequest(payload) {
  const { callerEmail, requestId } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const request = requests.find(r => r.requestId === requestId);

  if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
  if (request.status !== 'pending') return { success: false, error: { code: 'INVALID_STATUS', message: 'Request is not pending' } };

  const now = new Date().toISOString();
  updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
    status: 'approved',
    decidedTimestamp: now,
    decidedBy: callerEmail
  });

  sendTimeOffApprovedEmail(request.employeeEmail, request.employeeName, request.datesRequested.split(','), auth.employee.name);

  return { success: true, data: { requestId, status: 'approved', decidedTimestamp: now } };
}

function denyTimeOffRequest(payload) {
  const { callerEmail, requestId, reason } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const request = requests.find(r => r.requestId === requestId);

  if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } };
  if (request.status !== 'pending') return { success: false, error: { code: 'INVALID_STATUS', message: 'Request is not pending' } };

  const now = new Date().toISOString();
  updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
    status: 'denied',
    decidedTimestamp: now,
    decidedBy: callerEmail,
    reason: reason || ''
  });

  sendTimeOffDeniedEmail(request.employeeEmail, request.employeeName, request.datesRequested.split(','), reason);

  return { success: true, data: { requestId, status: 'denied', decidedTimestamp: now } };
}

function revokeTimeOffRequest(payload) {
  const { callerEmail, requestId, reason } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT OFFERS
// ═══════════════════════════════════════════════════════════════════════════════

function submitShiftOffer(payload) {
  const { callerEmail, recipientEmail, shiftDate, shiftStart, shiftEnd, shiftRole } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
  const offererShift = shifts.find(s => s.employeeEmail === callerEmail && s.date === shiftDate);
  if (!offererShift) return { success: false, error: { code: 'NOT_YOUR_SHIFT', message: 'You do not have a shift on this date' } };

  const recipientShift = shifts.find(s => s.employeeEmail === recipientEmail && s.date === shiftDate);
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
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function declineShiftOffer(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function cancelShiftOffer(payload) {
  const { callerEmail, requestId } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function approveShiftOffer(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const request = requests.find(r => r.requestId === requestId);

  if (!request) return { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } };
  if (request.status !== 'awaiting_admin') return { success: false, error: { code: 'INVALID_STATUS', message: 'Offer is not awaiting admin approval' } };

  const now = new Date().toISOString();
  updateRow(CONFIG.TABS.SHIFT_CHANGES, request._rowIndex, {
    status: 'approved',
    decidedTimestamp: now,
    decidedBy: callerEmail,
    adminNote: note || ''
  });

  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  const shiftRow = shifts.find(s => s.employeeEmail === request.employeeEmail && s.date === request.shiftDate);

  if (shiftRow) {
    const recipient = getEmployeeByEmail(request.recipientEmail);
    updateRow(CONFIG.TABS.SHIFTS, shiftRow._rowIndex, {
      employeeId: recipient.id,
      employeeName: recipient.name,
      employeeEmail: recipient.email
    });
  }

  sendOfferApprovedEmail(request.employeeEmail, request.recipientEmail, request.employeeName, request.recipientName, request.shiftDate, request.shiftStart, request.shiftEnd, request.shiftRole);

  return { success: true, data: { requestId, status: 'approved', decidedTimestamp: now } };
}

function rejectShiftOffer(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function revokeShiftOffer(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
  const shiftRow = shifts.find(s => s.employeeEmail === request.recipientEmail && s.date === request.shiftDate);

  if (shiftRow) {
    const offerer = getEmployeeByEmail(request.employeeEmail);
    updateRow(CONFIG.TABS.SHIFTS, shiftRow._rowIndex, {
      employeeId: offerer.id,
      employeeName: offerer.name,
      employeeEmail: offerer.email
    });
  }

  sendOfferRevokedEmail(request.employeeEmail, request.recipientEmail, request.employeeName, request.recipientName, request.shiftDate, request.shiftStart, request.shiftEnd, note);

  return { success: true, data: { requestId, status: 'revoked' } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHIFT SWAPS
// ═══════════════════════════════════════════════════════════════════════════════

function submitSwapRequest(payload) {
  const { callerEmail, partnerEmail, initiatorShift, partnerShift } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  if (callerEmail === partnerEmail) {
    return { success: false, error: { code: 'SELF_REQUEST', message: 'Cannot swap shifts with yourself' } };
  }

  if (isDateInPast(initiatorShift.date) || isDateInPast(partnerShift.date)) {
    return { success: false, error: { code: 'PAST_DATE', message: 'Cannot swap shifts that have already passed' } };
  }

  const partner = getEmployeeByEmail(partnerEmail);
  if (!partner) return { success: false, error: { code: 'NOT_FOUND', message: 'Partner not found or inactive' } };

  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  const initiatorOwnedShift = shifts.find(s => s.employeeEmail === callerEmail && s.date === initiatorShift.date);
  const partnerOwnedShift = shifts.find(s => s.employeeEmail === partnerEmail && s.date === partnerShift.date);

  if (!initiatorOwnedShift) return { success: false, error: { code: 'NOT_YOUR_SHIFT', message: `You don't have a shift on ${initiatorShift.date}` } };
  if (!partnerOwnedShift) return { success: false, error: { code: 'INVALID_SHIFTS', message: `${partner.name} doesn't have a shift on ${partnerShift.date}` } };

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
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function declineSwapRequest(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function cancelSwapRequest(payload) {
  const { callerEmail, requestId } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function approveSwapRequest(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
  const initiatorShiftRow = shifts.find(s => s.employeeEmail === request.employeeEmail && s.date === request.initiatorShiftDate);
  const partnerShiftRow = shifts.find(s => s.employeeEmail === request.partnerEmail && s.date === request.partnerShiftDate);
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
}

function rejectSwapRequest(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
}

function revokeSwapRequest(payload) {
  const { callerEmail, requestId, note } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

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
  const initiatorNowOnPartnerDate = shifts.find(s => s.employeeEmail === request.employeeEmail && s.date === request.partnerShiftDate);
  const partnerNowOnInitiatorDate = shifts.find(s => s.employeeEmail === request.partnerEmail && s.date === request.initiatorShiftDate);
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getEmployeeRequests(payload) {
  const { callerEmail } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  const allRequests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);
  const myRequests = allRequests.filter(r =>
    r.employeeEmail === callerEmail ||
    r.recipientEmail === callerEmail ||
    r.partnerEmail === callerEmail
  );

  return { success: true, data: { requests: myRequests } };
}

function getAdminQueue(payload) {
  const { callerEmail } = payload;

  const auth = verifyAuth(callerEmail, true);
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
  const { callerEmail } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  const offers = getSheetData(CONFIG.TABS.SHIFT_CHANGES).filter(r =>
    r.requestType === 'shift_offer' &&
    r.recipientEmail === callerEmail &&
    r.status === 'awaiting_recipient'
  );

  return { success: true, data: { offers } };
}

function getIncomingSwaps(payload) {
  const { callerEmail } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  const swaps = getSheetData(CONFIG.TABS.SHIFT_CHANGES).filter(r =>
    r.requestType === 'shift_swap' &&
    r.partnerEmail === callerEmail &&
    r.status === 'awaiting_partner'
  );

  return { success: true, data: { swaps } };
}

function getAllData(payload) {
  const { callerEmail } = payload;

  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  const settings = getSheetData(CONFIG.TABS.SETTINGS);
  const announcements = getSheetData(CONFIG.TABS.ANNOUNCEMENTS);
  const requests = getSheetData(CONFIG.TABS.SHIFT_CHANGES);

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

  return {
    success: true,
    data: {
      employees: employees.map(e => { const { _rowIndex, ...rest } = e; return rest; }),
      shifts: shifts.map(s => { const { _rowIndex, ...rest } = s; return rest; }),
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
  const { callerEmail } = payload;
  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };
  return { success: true, data: { employees: getSheetData(CONFIG.TABS.EMPLOYEES) } };
}

function getShifts(payload) {
  const { callerEmail } = payload;
  const auth = verifyAuth(callerEmail);
  if (!auth.authorized) return { success: false, error: auth.error };
  return { success: true, data: { shifts: getSheetData(CONFIG.TABS.SHIFTS) } };
}

function saveShift(payload) {
  const { callerEmail, shift } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d);
  };

  const shiftDate = normalizeDate(shift.date);
  const shifts = getSheetData(CONFIG.TABS.SHIFTS);
  const existingShift = shifts.find(s =>
    s.employeeId === shift.employeeId && normalizeDate(s.date) === shiftDate
  );

  if (shift.deleted) {
    if (existingShift) {
      getSheet(CONFIG.TABS.SHIFTS).deleteRow(existingShift._rowIndex);
      return { success: true, data: { deleted: true } };
    }
    return { success: true, data: { deleted: false, message: 'No matching shift found' } };
  }

  if (existingShift) {
    updateRow(CONFIG.TABS.SHIFTS, existingShift._rowIndex, shift);
  } else {
    appendRow(CONFIG.TABS.SHIFTS, shift);
  }

  return { success: true, data: { shift } };
}

/**
 * ★ RS-24: Save/update an employee
 * - New employees: use provided password (emp-XXX format from frontend), fall back to employee ID
 * - Existing employees: NEVER overwrite the password column
 */
function saveEmployee(payload) {
  const { callerEmail, employee } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const employees = getSheetData(CONFIG.TABS.EMPLOYEES);
  const existingEmployee = employees.find(e => e.id === employee.id);

  if (existingEmployee) {
    // Update existing — strip password so we never overwrite it here
    const { password, _rowIndex, ...updateFields } = employee;
    updateRow(CONFIG.TABS.EMPLOYEES, existingEmployee._rowIndex, updateFields);
  } else {
    // New employee — use provided password or fall back to employee ID
    const employeeToSave = {
      ...employee,
      password: employee.password || employee.id
    };
    appendRow(CONFIG.TABS.EMPLOYEES, employeeToSave);
  }

  return { success: true, data: { employee } };
}

function saveLivePeriods(payload) {
  const { callerEmail, livePeriods } = payload;

  const auth = verifyAuth(callerEmail, true);
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
  const { callerEmail, staffingTargets } = payload;

  const auth = verifyAuth(callerEmail, true);
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
  const { callerEmail, key, value } = payload;

  const auth = verifyAuth(callerEmail, true);
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

function batchSaveShifts(payload) {
  const { callerEmail, shifts, periodDates, allShiftKeys } = payload;

  const auth = verifyAuth(callerEmail, true);
  if (!auth.authorized) return { success: false, error: auth.error };

  const normalizeDate = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return String(d);
  };

  const existingShifts = getSheetData(CONFIG.TABS.SHIFTS);
  const sheet = getSheet(CONFIG.TABS.SHIFTS);
  let savedCount = 0;
  let deletedCount = 0;

  const keepShiftKeys = new Set();
  if (allShiftKeys && allShiftKeys.length > 0) {
    allShiftKeys.forEach(key => keepShiftKeys.add(key));
  } else {
    shifts.forEach(shift => keepShiftKeys.add(`${shift.employeeId}-${normalizeDate(shift.date)}`));
  }

  if (periodDates && periodDates.length > 0) {
    const rowsToDelete = [];
    existingShifts.forEach(existing => {
      const existingDate = normalizeDate(existing.date);
      const existingKey = `${existing.employeeId}-${existingDate}`;
      if (periodDates.includes(existingDate) && !keepShiftKeys.has(existingKey)) {
        rowsToDelete.push(existing._rowIndex);
      }
    });
    rowsToDelete.sort((a, b) => b - a).forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
      deletedCount++;
    });
  }

  const updatedExistingShifts = getSheetData(CONFIG.TABS.SHIFTS);

  shifts.forEach(shift => {
    const shiftDate = normalizeDate(shift.date);
    const existing = updatedExistingShifts.find(s =>
      s.employeeId === shift.employeeId && normalizeDate(s.date) === shiftDate
    );
    if (existing) {
      updateRow(CONFIG.TABS.SHIFTS, existing._rowIndex, shift);
    } else {
      appendRow(CONFIG.TABS.SHIFTS, shift);
    }
    savedCount++;
  });

  return { success: true, data: { savedCount, deletedCount } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

function saveAnnouncement(payload) {
  const { callerEmail, periodStartDate, subject, message } = payload;

  const auth = verifyAuth(callerEmail, true);
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
  const { callerEmail, periodStartDate } = payload;

  const auth = verifyAuth(callerEmail, true);
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

function sendEmail(to, subject, body) {
  try {
    MailApp.sendEmail({ to, subject, body, name: 'OTR Scheduling' });
    Logger.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    Logger.log(`Failed to send email to ${to}: ${error.toString()}`);
  }
}

// ----- TIME OFF -----

function sendTimeOffSubmittedEmail(employeeName, dates, reason) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `${employeeName} requested time off: ${formatDateRange(dates)}`,
    `${employeeName} has submitted a time off request.\n\nDates: ${formatDateRange(dates)}\nReason: ${reason || 'Not provided'}\n\nPlease review in the scheduling app.`
  );
}

function sendTimeOffApprovedEmail(employeeEmail, employeeName, dates, adminName) {
  sendEmail(employeeEmail,
    `✅ Time Off Approved — ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nYour time off request has been approved!\n\nDates: ${formatDateRange(dates)}\nApproved by: ${adminName}\n\nYou are not scheduled to work on these dates.`
  );
}

function sendTimeOffDeniedEmail(employeeEmail, employeeName, dates, reason) {
  sendEmail(employeeEmail,
    `Time Off Request Denied — ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nUnfortunately, your time off request could not be approved.\n\nDates requested: ${formatDateRange(dates)}\nReason: ${reason || 'No reason provided'}\n\nIf you have questions, please speak with your manager.`
  );
}

function sendTimeOffCancelledEmail(employeeName, dates) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `${employeeName} cancelled their time off request`,
    `${employeeName} has cancelled their pending time off request.\n\nOriginally requested: ${formatDateRange(dates)}\n\nNo action needed.`
  );
}

function sendTimeOffRevokedEmail(employeeEmail, employeeName, dates, reason, adminName) {
  sendEmail(employeeEmail,
    `⚠️ Time Off Revoked — ${formatDateRange(dates)}`,
    `Hi ${employeeName},\n\nYour previously approved time off has been revoked.\n\nDates: ${formatDateRange(dates)}\nReason: ${reason || 'No reason provided'}\nRevoked by: ${adminName}\n\nPlease check the schedule — you may now be expected to work on these dates.`
  );
}

// ----- SHIFT OFFERS -----

function sendOfferSubmittedEmail(recipientEmail, recipientName, offererName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  sendEmail(recipientEmail,
    `${offererName} wants to give you their shift on ${formatDateDisplay(shiftDate)}`,
    `Hi ${recipientName},\n\n${offererName} would like to give you their shift:\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} – ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}\n\nPlease log into the scheduling app to accept or decline.`
  );
}

function sendOfferAcceptedEmail(offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `${recipientName} accepted shift from ${offererName} — needs your approval`,
    `A shift offer has been accepted and needs your approval.\n\nFrom: ${offererName}\nTo: ${recipientName}\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} – ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}\n\nPlease review in the scheduling app.`
  );
}

function sendOfferDeclinedEmail(offererEmail, offererName, recipientName, shiftDate, note) {
  sendEmail(offererEmail,
    `${recipientName} declined your shift offer`,
    `Hi ${offererName},\n\n${recipientName} has declined your shift offer for ${formatDateDisplay(shiftDate)}.\n\nTheir note: ${note || 'No note provided'}\n\nYou are still scheduled to work this shift.`
  );
}

function sendOfferCancelledEmail(recipientEmail, recipientName, offererName, shiftDate) {
  sendEmail(recipientEmail,
    `${offererName} cancelled their shift offer`,
    `Hi ${recipientName},\n\n${offererName} has cancelled their offer to give you their shift on ${formatDateDisplay(shiftDate)}.\n\nNo action needed.`
  );
}

function sendOfferApprovedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, shiftRole) {
  const subject = `✅ Shift transfer approved — ${formatDateDisplay(shiftDate)}`;
  const body = `The shift transfer has been approved!\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} – ${formatTimeDisplay(shiftEnd)}\nRole: ${shiftRole}\n\nPreviously: ${offererName}\nNow assigned to: ${recipientName}\n\nThe schedule has been updated.`;
  sendEmail(offererEmail, subject, body);
  sendEmail(recipientEmail, subject, body);
}

function sendOfferRejectedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, note) {
  const subject = `Shift transfer rejected`;
  const body = `The shift transfer request has been rejected by management.\n\nDate: ${formatDateDisplay(shiftDate)}\nOriginal holder: ${offererName}\nWould-be recipient: ${recipientName}\n\nAdmin note: ${note || 'No reason provided'}\n\n${offererName} remains assigned to this shift.`;
  sendEmail(offererEmail, subject, body);
  sendEmail(recipientEmail, subject, body);
}

function sendOfferRevokedEmail(offererEmail, recipientEmail, offererName, recipientName, shiftDate, shiftStart, shiftEnd, note) {
  const subject = `⚠️ Shift transfer revoked`;
  const body = `A previously approved shift transfer has been revoked.\n\nDate: ${formatDateDisplay(shiftDate)}\nTime: ${formatTimeDisplay(shiftStart)} – ${formatTimeDisplay(shiftEnd)}\nReason: ${note || 'No reason provided'}\n\nThe shift has been returned to ${offererName}.`;
  sendEmail(offererEmail, subject, body);
  sendEmail(recipientEmail, subject, body);
}

// ----- SHIFT SWAPS -----

function sendSwapSubmittedEmail(partnerEmail, partnerName, initiatorName, initiatorShift, partnerShift) {
  sendEmail(partnerEmail,
    `${initiatorName} wants to swap shifts with you`,
    `Hi ${partnerName},\n\n${initiatorName} would like to swap shifts with you.\n\nThey're offering: ${formatDateDisplay(initiatorShift.date)}, ${formatTimeDisplay(initiatorShift.start)} – ${formatTimeDisplay(initiatorShift.end)} (${initiatorShift.role})\nThey want yours: ${formatDateDisplay(partnerShift.date)}, ${formatTimeDisplay(partnerShift.start)} – ${formatTimeDisplay(partnerShift.end)} (${partnerShift.role})\n\nPlease log into the scheduling app to accept or decline.`
  );
}

function sendSwapAcceptedEmail(initiatorName, partnerName, request) {
  sendEmail(CONFIG.ADMIN_EMAIL,
    `${partnerName} accepted swap from ${initiatorName} — needs your approval`,
    `A shift swap has been accepted and needs your approval.\n\n${initiatorName}'s shift: ${formatDateDisplay(request.initiatorShiftDate)}, ${formatTimeDisplay(request.initiatorShiftStart)} – ${formatTimeDisplay(request.initiatorShiftEnd)} (${request.initiatorShiftRole})\n${partnerName}'s shift: ${formatDateDisplay(request.partnerShiftDate)}, ${formatTimeDisplay(request.partnerShiftStart)} – ${formatTimeDisplay(request.partnerShiftEnd)} (${request.partnerShiftRole})\n\nBoth employees have agreed. Please review in the scheduling app.`
  );
}

function sendSwapDeclinedEmail(initiatorEmail, initiatorName, partnerName, note) {
  sendEmail(initiatorEmail,
    `${partnerName} declined your swap request`,
    `Hi ${initiatorName},\n\n${partnerName} has declined your shift swap request.\n\nTheir note: ${note || 'No note provided'}\n\nYour shifts remain unchanged.`
  );
}

function sendSwapCancelledEmail(partnerEmail, partnerName, initiatorName) {
  sendEmail(partnerEmail,
    `${initiatorName} cancelled their swap request`,
    `Hi ${partnerName},\n\n${initiatorName} has cancelled their swap request.\n\nNo action needed — your schedule is unchanged.`
  );
}

function sendSwapApprovedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, request) {
  const subject = `✅ Shift swap approved`;
  const body = `Your shift swap has been approved!\n\n${initiatorName} now works: ${formatDateDisplay(request.partnerShiftDate)}, ${formatTimeDisplay(request.partnerShiftStart)} – ${formatTimeDisplay(request.partnerShiftEnd)} (${request.partnerShiftRole})\n${partnerName} now works: ${formatDateDisplay(request.initiatorShiftDate)}, ${formatTimeDisplay(request.initiatorShiftStart)} – ${formatTimeDisplay(request.initiatorShiftEnd)} (${request.initiatorShiftRole})\n\nThe schedule has been updated.`;
  sendEmail(initiatorEmail, subject, body);
  sendEmail(partnerEmail, subject, body);
}

function sendSwapRejectedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, note) {
  const subject = `Shift swap rejected`;
  const body = `Your shift swap request has been rejected by management.\n\nAdmin note: ${note || 'No reason provided'}\n\nBoth employees keep their original shifts.`;
  sendEmail(initiatorEmail, subject, body);
  sendEmail(partnerEmail, subject, body);
}

function sendSwapRevokedEmail(initiatorEmail, partnerEmail, initiatorName, partnerName, note) {
  const subject = `⚠️ Shift swap revoked`;
  const body = `A previously approved shift swap has been revoked.\n\nReason: ${note || 'No reason provided'}\n\nBoth shifts have been returned to their original owners. Please check the schedule.`;
  sendEmail(initiatorEmail, subject, body);
  sendEmail(partnerEmail, subject, body);
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

  const headers = ['id', 'name', 'email', 'password', 'phone', 'address', 'dob', 'active', 'isAdmin', 'isOwner', 'showOnSchedule', 'deleted', 'availability', 'counterPointId', 'adpNumber', 'rateOfPay', 'employmentType'];
  const avail = JSON.stringify({
    sunday: { available: true, start: '11:00', end: '18:00' },
    monday: { available: true, start: '11:00', end: '18:00' },
    tuesday: { available: true, start: '11:00', end: '18:00' },
    wednesday: { available: true, start: '11:00', end: '18:00' },
    thursday: { available: true, start: '11:00', end: '19:00' },
    friday: { available: true, start: '11:00', end: '19:00' },
    saturday: { available: true, start: '11:00', end: '19:00' }
  });

  const data = [
    headers,
    ['emp-owner', 'JR', 'johnrichmond007@gmail.com', 'emp-owner', '', '', '', true, true, true, false, false, avail, '', '', '', ''],
    ['emp-admin-1', 'Sarvi', 'sarvi@rainbowjeans.com', 'emp-admin-1', '', '', '', true, true, false, false, false, avail, '', '', '', 'full-time'],
    ['emp-1', 'Emma Wilson', 'emma@example.com', 'emp-1', '', '', '', false, false, false, true, false, avail, '', '', '17.50', 'part-time'],
    ['emp-2', 'Liam Chen', 'liam@example.com', 'emp-2', '', '', '', false, false, false, true, false, avail, '', '', '17.50', 'part-time'],
    ['emp-3', 'Olivia Martinez', 'olivia@example.com', 'emp-3', '', '', '', false, false, false, true, false, avail, '', '', '17.50', 'part-time'],
    ['emp-4', 'Noah Patel', 'noah@example.com', 'emp-4', '', '', '', false, false, false, true, false, avail, '', '', '17.50', 'part-time'],
    ['emp-5', 'Ava Thompson', 'ava@example.com', 'emp-5', '', '', '', false, false, false, true, false, avail, '', '', '17.50', 'part-time']
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
  const headers = ['id', 'employeeId', 'employeeName', 'employeeEmail', 'date', 'startTime', 'endTime', 'role', 'task'];
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
