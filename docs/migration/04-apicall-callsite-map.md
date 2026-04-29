# API Call Site Inventory & Callsite Map

**Last refreshed:** 2026-04-29

**Purpose:** Complete inventory of every frontend-to-backend API call for Apps Script → Supabase migration planning. This document defines the entire surface area that must remain working through cutover.

---

## Executive Summary

- **Total unique apiCall actions:** 24
- **Total callsites across codebase:** 47 distinct invocations
- **API infrastructure:** `src/utils/api.js` (defines `apiCall` function + chunking logic)
- **Auth pattern:** Token auto-attachment to every payload (S37); centralized error handling in `handleAuthError`
- **POST fallback:** URL length > 6000 chars triggers POST attempt, then chunked GET for `batchSaveShifts`, then `URL_TOO_LONG` error
- **Chunking:** `batchSaveShifts` only; chunk size = 15 shifts; one-shot per chunk with progress callback

---

## API Infrastructure

### `src/utils/api.js`

**Function signature:**
```javascript
export const apiCall = async (action, payload = {}, onProgress) => { ... }
```

**Behavior:**
- **Token injection (S37):** Reads `getAuthToken()`, auto-injects as `payload.token` if present
- **Payload encoding:** `JSON.stringify(authedPayload)` → URLSearchParams or POST body
- **URL length check:** If `url.length > 6000`:
  - Attempt POST (Content-Type: text/plain, body: JSON)
  - On POST failure OR empty result: fall back to chunked GET for `batchSaveShifts` only
  - If neither succeeds: return `{ success: false, error: { code: 'URL_TOO_LONG', message: '...' } }`
- **Chunking (POST fallback):** Function `chunkedBatchSave()` breaks shifts into chunks of 15; each chunk is a separate GET request with progress callback
- **Response contract:**
  - Success: `{ success: true, data: {...} }`
  - Error: `{ success: false, error: { code: 'ERROR_CODE', message: '...' } }`
  - Parse error: `{ success: false, error: { code: 'PARSE_ERROR', message: '...' } }`
  - Network error: `{ success: false, error: { code: 'NETWORK_ERROR', message: '...' } }`
- **Auth failure handling:** If `result.success === false && result.error?.code` is set, calls `handleAuthError(code)` for centralized bounce-to-login logic

**Backend handler:** `Code.gs:doGet()` and `doPost()` → `handleRequest(action, payload)` → dispatcher map at Code.gs:255

---

## Action-By-Action Inventory

### 1. `login` 

**Callsites (C = codebase cite):**
- **C:** src/components/LoginScreen.jsx:30

**Payload shape:**
- `email` (string, from user input, lowercased + trimmed)
- `password` (string, from user input)

**Response fields read:**
- `result.success` (boolean)
- `result.data.token` (string, JWT for session)
- `result.data.employee` (object, full employee record)
- `result.data.usingDefaultPassword` (boolean, flags first-login flow)
- `result.data.defaultPassword` (string, employee's default pwd if first login)

**UX:** Direct error toast on failure; on success either logs in immediately or shows ChangePasswordModal for first-login password reset.

**Backend handler:** `Code.gs:login()` (validates email + password hash, issues token)

---

### 2. `changePassword`

**Callsites (C):**
- **C:** src/modals/ChangePasswordModal.jsx:45 (user self-service)
- **C:** src/modals/AdminSettingsModal.jsx:71 (admin self-service)

**Payload shape:**
- `newPassword` (string, from form)
- `currentPassword` (string, from form or defaults to `defaultPassword || currentUser.id` on first login)
- `callerEmail` (string, currentUser.email; optional per code but included)
- `token` (auto-injected by apiCall)

**Response fields read:**
- `result.success` (boolean)

**UX:** 
- Success: 1.2s success toast + modal close
- Failure: error message toast

**Optimistic update:** No; state updated only after success response.

**Backend handler:** `Code.gs:changePassword()` (verifies current pwd hash, writes new hash + salt)

---

### 3. `resetPassword`

**Callsites (C):**
- **C:** src/modals/EmployeeFormModal.jsx:273 (admin resets employee password inline)

**Payload shape:**
- `targetEmail` (string, the employee whose password is being reset)
- `token` (auto-injected)

**Response fields read:**
- `result.data.newPassword` (string, display-only for admin to share)

**UX:** Toast shows new password; admin copies and communicates to employee.

**Optimistic update:** No; updates state only on success.

**Backend handler:** `Code.gs:resetPassword()` (generates new hash + salt, returns plaintext for display)

---

### 4. `saveStaffingTargets`

**Callsites (C):**
- **C:** src/modals/AdminSettingsModal.jsx:50

**Payload shape:**
- `staffingTargets` (object, `{ sunday: N, monday: N, ... }` from form inputs)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast on success/failure; form disables Save button during request.

**Optimistic update:** Local state updated BEFORE await (AdminSettingsModal:56); if request fails, form retains edited values but shows error. Not strict revert-on-failure, but acceptable UX (admin can retry).

**Backend handler:** `Code.gs:saveStaffingTargets()`

---

### 5. `saveSetting` (key variants: storeHoursOverrides, staffingTargetOverrides)

**Callsites (C):**
- **C:** src/App.jsx:525 (storeHoursOverrides)
- **C:** src/App.jsx:529 (staffingTargetOverrides)
  - Both called in **parallel** via Promise.all() at App.jsx:524–533

**Payload shape (per call):**
- `key` (string, 'storeHoursOverrides' or 'staffingTargetOverrides')
- `value` (object, full override map `{ "2026-02-14": {...} }`)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean per call)

**UX:** Combined toast "Day settings saved" on both success, "Failed to save day settings" on either failure.

**Optimistic update:** Local state (setStoreHoursOverrides, setStaffingTargetOverrides) updated BEFORE awaiting Promise.all() at App.jsx:512–521. On failure, state is NOT reverted — settings remain in local state even if backend save fails. **FLAG:** User can retry later, but inconsistency is possible.

**Backend handler:** `Code.gs:saveSetting()` (generic key-value saver)

---

### 6. `batchSaveShifts`

**Callsites (C):**
- **C:** src/App.jsx:396 (go LIVE — saves shifts for current period)
- **C:** src/App.jsx:481 (save in edit mode — no publish)
- Both via `collectPeriodShiftsForSave()` helper

**Payload shape:**
- `shifts` (array of shift objects, each with `employeeId`, `date`, `start`, `end`, `type`, `note`, `deleted`, `id`)
- `periodDates` (array of ISO date strings for the pay period, used to wipe old rows)
- `allShiftKeys` (array of synthetic keys used to identify rows to delete — only on last chunk)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.data.savedCount` (number, actual rows saved)
- `result.data.totalChunks` (number, if chunked)
- `result.data.failedChunks` (number, if chunked)

**URL length:** Likely exceeds 6000 on any real period (14 days × ~20 employees = 280 shifts @ ~100 bytes each = ~28KB JSON); triggers POST → chunked GET fallback.

**Chunking:** `chunkedBatchSave()` in api.js splits shifts into 15-shift chunks; onProgress callback fires per chunk (App.jsx:399–401, 484–486).

**Optimistic update:**
- **saveLive path (App.jsx:396–427):** publishedShifts map updated locally BEFORE awaiting save (App.jsx:415–427). On failure, state is NOT reverted; user retries via Publish button again.
- **saveSchedule path (App.jsx:481–500):** No optimistic update; state unchanged until success.

**UX:**
- Toast "Saving X shifts..." during request; updates per chunk
- Success: "Saved N shifts" or (chunked) "Schedule save incomplete: M of K batches saved. Please retry."
- Failure: error toast or chunked partial-save message

**Backend handler:** `Code.gs:batchSaveShifts()` (Sheets.Spreadsheets.Values.update single call; s028 key logic mirrors frontend)

---

### 7. `saveLivePeriods`

**Callsites (C):**
- **C:** src/App.jsx:438 (after shift save on go-LIVE)
- **C:** src/App.jsx:461 (after edit mode toggle back from LIVE)

**Payload shape:**
- `livePeriods` (array of period indexes that are LIVE, e.g., `[0, 2]`)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Schedule is now LIVE!" or "Failed to publish schedule. Please try again."

**Optimistic update:** editModeByPeriod state updated locally BEFORE save (App.jsx:431, 454). On failure, state is NOT reverted. User must retry toggle again.

**Backend handler:** `Code.gs:saveLivePeriods()`

---

### 8. `saveEmployee`

**Callsites (C):**
- **C:** src/App.jsx:847 (new or edit, awaited in handleSaveEmployee)
- **C:** src/App.jsx:880 (delete/mark deleted)
- **C:** src/App.jsx:906 (reactivate)

**Payload shape:**
- `employee` (object, serialized by `serializeEmployeeForApi(e)`, includes `id`, `name`, `email`, `availability`, `password` if set for new hires, `active`, `deleted`, etc.)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "N added/updated/removed/reactivated" or error.

**Optimistic update:**
- **Add/edit (App.jsx:838):** employees state updated locally (line 838) BEFORE await. On failure, reverted (line 858) — **proper pattern**.
- **Delete (App.jsx:875):** employees state updated locally BEFORE await. On failure, reverted (line 888) — **proper pattern**.
- **Reactivate (App.jsx:901):** employees state updated locally BEFORE await. On failure, reverted (line 914) — **proper pattern**.

**Backend handler:** `Code.gs:saveEmployee()` (header-driven Employees tab writer)

---

### 9. `saveAnnouncement`

**Callsites (C):**
- **C:** src/hooks/useAnnouncements.js:27

**Payload shape:**
- `periodStartDate` (string, ISO date of the pay period start)
- `subject` (string, from form)
- `message` (string, from form)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.data.announcement` (object, returned record for state sync)

**UX:** On error, alert() popup (not toast). On success, state updates from response.

**Optimistic update:** No; only updates on success response.

**Backend handler:** `Code.gs:saveAnnouncement()`

---

### 10. `deleteAnnouncement`

**Callsites (C):**
- **C:** src/hooks/useAnnouncements.js:15

**Payload shape:**
- `periodStartDate` (string)
- `token` (auto-injected)

**Response fields read:**
- (none; no response data parsed)

**UX:** No explicit feedback; announcement state cleared locally (line 17) regardless of success.

**Optimistic update:** Local state cleared immediately (line 17) before/during await, with no revert on failure. **FLAG:** Dangling delete if network fails.

**Backend handler:** `Code.gs:deleteAnnouncement()`

---

### 11. `sendBrandedScheduleEmail`

**Callsites (C):**
- **C:** src/modals/EmailModal.jsx:56 (group send, one call)
- **C:** src/modals/EmailModal.jsx:94 (individual sends, looped calls)

**Payload shape:**
- `to` (string, email address or comma-separated for group)
- `subject` (string, generated subject line)
- `htmlBody` (string, branded HTML email built by `buildBrandedScheduleHtml()`)
- `plaintextBody` (string, plaintext fallback)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.error?.message` (string, on failure)

**UX:**
- Group mode: all-or-nothing single call; results array shows sent/failed status per employee.
- Individual mode: sequential calls; shows in-flight count during loop; results accumulated per email.

**Optimistic update:** No; local results array updated only after each call completes.

**Payload size:** HTML email bodies can easily exceed 50KB for a full period schedule; plan for POST + chunking if HTML is large. **FLAG:** Monitor payload size in production.

**Backend handler:** `Code.gs:sendBrandedScheduleEmail()` (uses GmailApp to send)

---

### 12. `submitTimeOffRequest`

**Callsites (C):**
- **C:** src/App.jsx:968 (in guardedMutation guard)

**Payload shape:**
- `dates` (array of ISO date strings, from `request.datesRequested.split(',')`)
- `reason` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.data.requestId` (string, server-generated)
- `result.data.createdTimestamp` (string, ISO datetime)

**UX:** Toast "Request sent — Sarvi has been notified" or error.

**Optimistic update:** No; only adds to timeOffRequests on success.

**Guard:** Wrapped in `guardedMutation()` to prevent double-click (S41.2).

**Backend handler:** `Code.gs:submitTimeOffRequest()` (validates dates, checks overlap, writes ShiftChanges tab)

---

### 13. `cancelTimeOffRequest`

**Callsites (C):**
- **C:** src/App.jsx:947 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Request cancelled" or error.

**Optimistic update:** No; only updates request status on success.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:cancelTimeOffRequest()` (marks status='cancelled')

---

### 14. `approveTimeOffRequest`

**Callsites (C):**
- **C:** src/App.jsx:1388 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Approved — moved to Settled history" or error.

**Optimistic update:** No; updates timeOffRequests on success.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:approveTimeOffRequest()` (writes status='approved', sends notification)

---

### 15. `denyTimeOffRequest`

**Callsites (C):**
- **C:** src/App.jsx:1410 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `reason` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Denied — moved to Settled history" or error.

**Optimistic update:** No; updates on success.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:denyTimeOffRequest()` (marks status='denied')

---

### 16. `revokeTimeOffRequest`

**Callsites (C):**
- **C:** src/App.jsx:1446 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Approval revoked" or error.

**Optimistic update:** No; updates on success.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:revokeTimeOffRequest()` (marks status='revoked' for future dates only)

---

### 17. `submitShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:995 (in guardedMutation guard)

**Payload shape:**
- `recipientEmail` (string, target employee)
- `shiftDate` (string, ISO date)
- `shiftStart` (string, HH:mm)
- `shiftEnd` (string, HH:mm)
- `shiftRole` (string, role name)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.data.requestId` (string)
- `result.data.createdTimestamp` (string)

**UX:** Toast "Offer sent — waiting for recipient response" or error.

**Optimistic update:** No; adds to shiftOffers on success.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:submitShiftOffer()` (rejects if shift type != 'work', writes ShiftChanges tab)

---

### 18. `cancelShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1024 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer cancelled" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:cancelShiftOffer()` (marks status='cancelled')

---

### 19. `acceptShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1045 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer accepted - awaiting admin approval" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:acceptShiftOffer()` (moves status to 'awaiting_admin')

---

### 20. `declineShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1066 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer declined" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:declineShiftOffer()` (marks status='recipient_rejected')

---

### 21. `approveShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1090 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer approved — moved to Settled history" or error.

**Optimistic update:** No explicit await state mutation; shifts are reassigned locally by `transferShiftBetweenEmployees()` if employees are found in state.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:approveShiftOffer()` (moves shift to recipient, marks status='approved')

---

### 22. `rejectShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1116 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer rejected — moved to Settled history" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:rejectShiftOffer()` (marks status='rejected')

---

### 23. `revokeShiftOffer`

**Callsites (C):**
- **C:** src/App.jsx:1149 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Offer approval revoked" or error.

**Optimistic update:** Shifts reassigned back via `transferShiftBetweenEmployees()` if employees found.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:revokeShiftOffer()` (reverses shift, marks status='revoked')

---

### 24. `submitSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1179 (in guardedMutation guard)

**Payload shape:**
- `partnerEmail` (string)
- `initiatorShift` (object: `{ date, start, end, role }`)
- `partnerShift` (object: `{ date, start, end, role }`)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)
- `result.data.requestId` (string)
- `result.data.createdTimestamp` (string)

**UX:** Toast "Swap sent to N — waiting for response" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:submitSwapRequest()` (rejects if shift type != 'work')

---

### 25. `cancelSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1216 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap request cancelled" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:cancelSwapRequest()` (marks status='cancelled')

---

### 26. `acceptSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1237 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap accepted - awaiting admin approval" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:acceptSwapRequest()` (moves status to 'awaiting_admin')

---

### 27. `declineSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1258 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap request declined" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:declineSwapRequest()` (marks status='partner_rejected')

---

### 28. `approveSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1282 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap approved — moved to Settled history" or error.

**Optimistic update:** Shifts swapped locally via `swapShiftsBetweenEmployees()` if employees found.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:approveSwapRequest()` (swaps both shifts, marks status='approved')

---

### 29. `rejectSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1309 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `note` (string, from form or '')
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap rejected — moved to Settled history" or error.

**Optimistic update:** No.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:rejectSwapRequest()` (marks status='rejected')

---

### 30. `revokeSwapRequest`

**Callsites (C):**
- **C:** src/App.jsx:1344 (in guardedMutation guard)

**Payload shape:**
- `requestId` (string)
- `token` (auto-injected)

**Response fields read:**
- `result.success` (boolean)

**UX:** Toast "Swap approval revoked" or error.

**Optimistic update:** Shifts swapped back via `swapShiftsBetweenEmployees()` if employees found.

**Guard:** Wrapped in `guardedMutation()`.

**Backend handler:** `Code.gs:revokeSwapRequest()` (reverses swap, marks status='revoked')

---

### 31. `getAllData`

**Callsites (C):**
- **C:** src/App.jsx:304 (boot-time load after login)

**Payload shape:**
- (empty object `{}`)
- `token` (auto-injected)

**Response fields read:**
- `result.data.employees` (array)
- `result.data.shifts` (array)
- `result.data.requests` (array, includes time off / offers / swaps)
- `result.data.livePeriods` (array of period indexes)
- `result.data.announcements` (array)
- `result.data.staffingTargets` (object)
- `result.data.storeHoursOverrides` (object)
- `result.data.staffingTargetOverrides` (object)

**UX:** Loading spinner during fetch; ErrorScreen on failure; on success, app populates all state and renders schedule.

**Optimistic update:** No; state is only updated on success.

**Boot path:** Called immediately after handleLogin() completes; after currentUser is set and auth token is available.

**Backend handler:** `Code.gs:getAllData()` (5-call getSheetData, per v2.19.2 notes)

---

## Payload Size Analysis

**Large payloads (potential for >30KB):**

1. **batchSaveShifts** (App.jsx:396, 481)
   - Shifts: 14 days × 20 employees = 280 shifts
   - Per-shift JSON: `{id,employeeId,date,start,end,role,type,note,deleted}` ≈ 80–120 bytes
   - Total: ~24–36 KB
   - **Mitigation:** POST fallback + chunked GET (15-shift chunks) in api.js
   - **Flag:** If chunking fails, entire save fails with URL_TOO_LONG error

2. **sendBrandedScheduleEmail** (EmailModal.jsx:56, 94)
   - HTML body can be 20–50 KB depending on period length and complexity
   - **Mitigation:** POST fallback (api.js will attempt POST for URL > 6000)
   - **Flag:** Monitor actual HTML size in production; if POST fails, no fallback

3. **getAllData response** (not a POST payload, but worth noting)
   - Employees + shifts + requests: typically 50–150 KB JSON
   - Handled by GET, which has no length limit

---

## Boot-Time Sequence

**Critical path for app startup after login:**

1. User enters email + password
2. **apiCall('login', { email, password })** → LoginScreen.jsx:30
3. On success: currentUser set, token stored
4. **handleLogin(employee)** called (App.jsx:356)
5. **loadDataFromBackend(userEmail)** called (App.jsx:300)
6. **apiCall('getAllData', {})** → App.jsx:304
7. On success: all state populated (employees, shifts, events, requests, announcements, staffingTargets, overrides)
8. Render schedule grid

**Latency:** login ≈ 2s, getAllData ≈ 5–8s (per v2.19.2 notes). Total ≈ 7–10s from login to first render.

**Single points of failure:**
- Login fails → error toast, stay on LoginScreen
- getAllData fails → ErrorScreen with retry button

---

## Background-to-Foreground Sequences

**Calls triggered by route change / modal open / tab switch (vs explicit user action):**

1. **Boot-time load:** getAllData (App.jsx:304) on every app load + login
   - Trigger: useEffect[] (App.jsx:290–297) after currentUser + token available
   - No explicit user action; automatic on component mount

2. **Announcements sync:** setAnnouncements from getAllData response (App.jsx:329–332)
   - Trigger: Boot-time data fetch
   - Lazy-loaded from API response, not separate call

3. **Period toggle:** batchSaveShifts + saveLivePeriods triggered by toggleEditMode (App.jsx:383)
   - Trigger: User clicks "Publish" button (explicit action, not background)
   - But **modal close** or **tab switch** does NOT re-trigger these

4. **Email modal close:** No API call; modal just closes

5. **No prefetch / lazy load:** Schedule is not refetched on period navigation or tab switch; all data from boot-time getAllData

**Implication:** Most background calls are one-time at boot; no polling or periodic syncs. Exception: PK event modal can trigger batchSaveShifts on close (App.jsx:287).

---

## Auth & Error Handling

**Token injection (S37):**
- Every apiCall automatically adds `token` to payload if `getAuthToken()` returns a value
- No caller needs to pass `token` explicitly
- Backend verifies token in verifyAuth() at start of protected handlers

**Error responses handled by:**
- `handleAuthError(code)` in api.js (line 60) for code='AUTH_INVALID', 'AUTH_EXPIRED', 'AUTH_FORBIDDEN', 'AUTH_REQUIRED'
- Bounces user back to LoginScreen
- All other errors: caller's responsibility to show toast or handle

**Response shape guarantee (Code.gs:331):**
```json
{ "success": true/false, "data": {...}, "error": {"code": "...", "message": "..."} }
```

---

## Critical Implementation Notes for Migration

1. **POST vs GET fallback:** api.js tries POST first for large payloads, then falls back to chunked GET for batchSaveShifts only. Supabase endpoint must handle both POST and GET gracefully.

2. **Chunk size:** batchSaveShifts chunks at 15 shifts per request. Each chunk is a separate call with onProgress callback. Supabase handler must accept partial shifts and return savedCount.

3. **allShiftKeys:** On the last chunk only, apiCall passes `allShiftKeys` array (synthetic keys of all shifts, per s028 logic). Backend uses this to identify old rows to delete. **Must replicate this logic in Supabase function.**

4. **Token format:** 12-hour JWT (base64url.base64url format). Supabase function must decode and validate. No refresh tokens currently; expired token → user bounces to login on next action.

5. **Optimistic updates:** Many mutations update local state BEFORE awaiting response, with or without revert-on-failure. Migration must preserve this pattern for UX parity.

6. **guardedMutation guard:** Request handlers wrap long operations in guard to prevent double-click. Must still work with Supabase; guard is frontend-only.

7. **Transaction atomicity:** batchSaveShifts + saveLivePeriods are two separate calls; must complete in sequence for go-LIVE to work. Supabase should not introduce implicit atomicity if not present in Apps Script (currently only batchSaveShifts is one transaction; saveLivePeriods is separate).

---

## Checklist for Cutover

- [ ] All 31 actions mapped to Supabase handlers (1:1 parity)
- [ ] Login + token generation + 12h TTL working
- [ ] getAllData returns all 8 fields with correct schemas
- [ ] batchSaveShifts handles both POST and chunked GET paths
- [ ] Chunking returns progress data (savedCount, totalChunks, failedChunks)
- [ ] allShiftKeys logic matches s028 keyOfShift in Code.gs:1806
- [ ] All request handlers (offers, swaps, time off) validate shift type != 'work' where required
- [ ] deleteAnnouncement must be atomic with local state clear
- [ ] saveSetting can be called in parallel (both storeHoursOverrides + staffingTargetOverrides)
- [ ] sendBrandedScheduleEmail handles large HTML payloads (50KB+)
- [ ] Error responses always include code + message for errorMsg() helper

---

## Flags for Migration Team

**1. Ambiguous spec:** 
- deleteAnnouncement has no response data parsing; frontend assumes success and clears state. If delete fails server-side, local state will be inconsistent. Should migration add explicit success ack?

**2. Unintended scope drift:**
- saveSetting is a generic key-value store; frontend only uses it for storeHoursOverrides + staffingTargetOverrides, but backend accepts any key. Supabase migration should restrict keys or document the contract.

**3. Revert-on-failure:**
- saveEmployee, deleteEmployee, reactivateEmployee all properly capture prevEmployees and revert on failure (good pattern).
- But saveSetting, saveLivePeriods, batchSaveShifts do NOT revert local state on failure. This is accepted UX but is fragile. Consider whether Supabase should be more strict (e.g., return partial failure details for saveSetting, not just boolean).

**4. Large payloads:**
- batchSaveShifts can exceed 30KB; POST fallback only works if Supabase function accepts POST to the same endpoint. If endpoint routing differs, chunking may fail.
- sendBrandedScheduleEmail HTML bodies can be 50KB+; monitor in production.

**5. Missing handler:**
- Code.gs has a `bulkCreatePKEvent` handler (Code.gs:302, visible in dispatch map) but NO frontend callsite found in codebase. **Verify:** Is bulkCreatePKEvent dead code, or is there a missing feature?

**6. Token TTL:**
- 12-hour expiry is frontend assumption only. If Supabase token TTL differs, update will break silent next-login.

---

**Document auto-generated 2026-04-29. Source: src/utils/api.js, src/App.jsx, src/modals/*.jsx, src/hooks/*.js. Backend handlers cross-referenced against Code.gs:255–310 dispatch map.**

