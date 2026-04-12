# Google Sheets Schema (5 Tabs)

CRITICAL: These column headers are exact. Do not rename, reorder, or omit fields.

## Employees Tab (19 columns, A-S)

```
id | name | email | password | phone | address | dob | active | isAdmin | isOwner | showOnSchedule | deleted | availability | counterPointId | adpNumber | rateOfPay | employmentType | passwordHash | passwordSalt
```

- `availability`: JSON string - `{ "sunday": { "available": true, "start": "11:00", "end": "18:00" }, ... }`
- `employmentType`: `"full-time"` | `"part-time"` | `""`
- `counterPointId`, `adpNumber`: Reserved for future POS/payroll integration - exist in schema, HIDDEN from UI, do not remove
- `password`: Legacy plaintext column. Sheets may store as number - always use `String()` for comparisons. After S36, populated only for accounts that haven't logged in since the migration OR for admin-reset accounts (so admin UI can display the default). Cleared on any user-initiated password change.
- `passwordHash`: base64url-encoded SHA-256 of `salt + password`. Empty until first post-S36 login or password change.
- `passwordSalt`: per-user UUID salt used with `passwordHash`. Empty until first post-S36 login or password change.

## Shifts Tab (9 columns, A-I)

```
id | employeeId | employeeName | employeeEmail | date | startTime | endTime | role | task
```

- Always store `employeeName` alongside `employeeId` (audit trail)
- `role`: One of `cashier`, `backupCashier`, `mens`, `womens`, `floorMonitor`, `none`
- `task`: Optional free-text task description

## Settings Tab (2 columns: key, value)

```
key | value
```

Known keys: `adminPassword`, `storeName` ("Over the Rainbow"), `storeEmail`, `storeAddress`, `storePhone`, `livePeriods` (JSON array of period start dates), `staffingTargets` (JSON: `{"sunday":15,"monday":8,...}`), `storeHoursOverrides` (JSON: `{"2026-02-14":{"open":"10:00","close":"21:00"},...}`), `staffingTargetOverrides` (JSON: `{"2026-02-14":12,...}`)

## Announcements Tab (5 columns, A-E)

```
id | periodStartDate | subject | message | updatedAt
```

## ShiftChanges Tab (35 columns, A-AI)

```
Common (A-J):     requestId | requestType | employeeName | employeeEmail | status | createdTimestamp | decidedTimestamp | decidedBy | revokedTimestamp | revokedBy
Time Off (K-L):   datesRequested | reason
Offers (M-V):     recipientName | recipientEmail | shiftDate | shiftStart | shiftEnd | shiftRole | recipientNote | recipientRespondedTimestamp | adminNote | cancelledTimestamp
Swaps (W-AI):     partnerName | partnerEmail | initiatorShiftDate | initiatorShiftStart | initiatorShiftEnd | initiatorShiftRole | partnerShiftDate | partnerShiftStart | partnerShiftEnd | partnerShiftRole | partnerNote | partnerRespondedTimestamp | swapAdminNote
```

- `requestType`: `"timeOff"` | `"offer"` | `"swap"`
- `status`: `"pending"` | `"approved"` | `"denied"` | `"cancelled"` | `"revoked"` | `"accepted"` | `"declined"` | `"rejected"`
