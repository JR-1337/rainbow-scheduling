# Audit: New-User First-Login Experience

**Date:** 2026-05-07 (s071)
**Driver:** localhost dev server (Vite at http://localhost:5173) against shared production Apps Script backend
**Method:** agent-browser walkthrough as Test Guy `john@johnrichmond.ca` after fresh password reset, plus code-read of welcome email template and login response shape
**Test fixture state at audit-end:** Test Guy = Inactive, password = `TestG`, `passwordChanged=false`

---

## 1. Owner-row diagnosis (Part A)

JR reported: "for me it tells me it's my first time logging in and that my password is my first and last name but that's not true my pw is admin1."

**Live state of JR's row at audit time** (read from cached user payload via `localStorage.getItem('otr-auth-user')`):

```
"passwordChanged": true
```

So **at audit time, JR's row has `passwordChanged=true`** and the modal does **not** fire on his account. When I logged in as JR with `admin1`, I went straight to the schedule view with no modal. This means whatever JR saw earlier was from a prior session in which his row had `passwordChanged=false` (likely because someone or something ran `resetPassword` on his row, or the row was originally seeded that way and never had the flag flipped).

**The structural UX bug is still real and affects future cases:** the trigger predicate at `backend/Code.gs:1089-1096` returns `usingDefaultPassword=true` purely from `passwordChanged=false`/empty/undefined, regardless of what the typed password actually was. The frontend then renders the "Set Your Password" modal AND the login screen shows an unconditional FirstnameL hint at `src/components/LoginScreen.jsx:130`. So any account whose default-password format is NOT FirstnameL (legacy seed `admin1`, manually-set passwords, etc.) will see misleading copy if the row ever returns to `passwordChanged=false`. The owner row in `Code.gs:3443` is seeded with `'emp-owner'` as the default password (NOT `admin1` and NOT FirstnameL) — so any owner-row reset would re-establish that mismatch. This is the bug-class JR experienced and it can recur.

Additionally: **the login regex fallback** at `Code.gs:1095` (`/^[A-Za-z]+\d*$/.test(pwStr)`) matches `admin1` (letters+digits). That fallback only fires when `passwordChanged` is missing/undefined/empty (not when it's explicitly `false`), so it's the secondary path. Either way the modal-trigger branch is the issue, not the password format itself.

---

## 2. Employee-journey walkthrough (Part B)

### State 1 — Login screen

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/01-login-screen.png`

Verbatim copy:
- Header: "OVER THE / RAINBOW / Staff Scheduling"
- Email field — placeholder `your.email@example.com`
- Password field — placeholder shows masked dots; eye-toggle icon for show/hide
- **Hint paragraph:** "First time? Your default password is your first name and last initial with no space, e.g. JohnR"
- Button: "Sign In"

Note: the hint is rendered unconditionally for every visitor — it cannot adapt to the row's actual default-password format because the row hasn't been resolved yet.

### State 2 — "Set Your Password" modal (first-login modal)

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/02-first-login-modal.png`

Verbatim copy:
- Title: "Set Your Password"
- Body banner (light-blue background): "Welcome! Please set a personal password before continuing."
- Field 1 label: "New Password" — placeholder "Enter new password" — eye-toggle
- Field 2 label: "Confirm Password" — placeholder "Confirm new password" — eye-toggle
- Button: "Set Password" (with key icon)
- Modal has a close-X but the modal is functionally trapped (per `ChangePasswordModal.jsx:60` `handleClose=undefined` when `isFirstLogin=true`).

Notable absences:
- No mention of WHAT the default password was (the user already typed it but no echo).
- No password-complexity guidance (4-char minimum is enforced silently and surfaces only as an error after submit).
- No "why am I seeing this?" explanation — a non-technical employee may wonder if something is wrong.

### State 3 — Saving / "Loading your schedule" transition

Screenshots: `02-first-login-modal.png` -> intermediate "Saving your password — this can take a moment." (in same modal) -> `03-password-updated.png` (which captured the "Loading your schedule... This can take a moment on first sign-in." centered card on a skeleton grid).

The explore reports said `ChangePasswordModal.jsx:80-82` shows a "Password Updated!" + monospace password preview success screen for ~1200 ms before redirect. **I did not capture that frame** — the screenshots show the saving state and then the post-redirect loading state, with the success-flash too brief to land on the agent-browser screenshot timing. This is consistent with the code path. (For a real employee using a slow phone, the success flash will be visible.)

### State 4 — First post-login app view

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/04-first-app-view.png`

What an employee sees on first arrival, no published schedule for current period:
- Top left: OTR logo. Top middle: period-nav arrows + "May 4 – May 17 / Current Period" text + yellow "Updates Pending" pill. Top right: blue "Shift Changes" button + "TG Test Guy / 0 shifts" profile chip.
- Tab strip: "Week 19 May 4–May 10" (selected), "Week 20 May 11–May 17"
- Yellow banner: "☆ Shift assignments for this period haven't been published yet. Availability and time off are shown below."
- Schedule grid below: every employee row visible with empty cells (only Unavailable / time-off cells shaded grey).

There is **no welcome splash, no first-time tooltip, no "what's next" card, no help button, no orientation flow**. The schedule grid is the entire surface. An employee seeing this for the first time is left to discover everything else by clicking around.

### State 5 — Employee profile menu

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/05-employee-nav.png`

When Test Guy clicks the "TG Test Guy" chip, the menu shows three items only:
1. My Schedule
2. Change Password
3. Sign Out

For comparison, the admin (JR) menu has six items: My Schedule, Add Employee, Employees (5 inactive), Admin Settings, Change Password, Sign Out. So the employee surface is much narrower — but importantly there is **no help / FAQ / guide / how-to-use link** of any kind.

### State 6 — Logout

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/06b-after-logout.png`

Clicking Sign Out returns to the bare login screen — no goodbye/banner, no "see you later" flash. The login screen color theme shifts to blue accents (versus red for first-arrival), but no explicit logout confirmation.

### State 7 — Second login (no modal expected)

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/07-second-login.png`

Logging in again as Test Guy with the newly-set `AuditPass1` lands directly on the schedule view. The "Set Your Password" modal does NOT appear. This confirms the trigger predicate fires once and only once — `passwordChanged=true` after first password change disables it permanently.

### Bonus — Shift Changes picker

Screenshot: `~/.claude/scratch/audit-onboarding-2026-05-07/08-shift-changes-empty.png`

Captured for the New-User Guide follow-up. Clicking the top-right "Shift Changes" button opens a picker:
- "Days Off — Request specific days or a block of time off"
- "Shift Swap — Trade a shift with another employee"
- "Take My Shift — Give away your shift to someone else"

These are the three shift-change paths available to staff. The guide can document each end-to-end with screenshots.

---

## 3. Welcome email content

Source: `backend/Code.gs:404-476` (`WELCOME_TEMPLATE_HTML_`) — rendered as a PDF and attached to the welcome email along with two TD1 forms.

### Header
- "OVER THE / RAINBOW" lockup on dark navy background
- Eyebrow: "NEW EMPLOYEE WELCOME"

### Address block
"123 - 55 Bloor St West. Toronto, Ontario. M4W 1A5
Phone: (416) 967-7448 | Fax: (416) 968-2457"

### Date + Salutation
"Date: {{dateSent}}"
"Dear {{firstName}},"

### Body paragraphs (verbatim)
1. "Welcome to Over the Rainbow Ltd. Please print the attached documents:"
2. "Employee Employment Contract. Please read this document and bring a signed copy with you on your first day of work or prior to."
3. "TD1 Federal and Ontario. These are personal tax credit forms that must be filled out and brought with you on your first day of work or prior to. Please note on page 2 "Total income less than total claim amount" – this box needs to be checked IF it pertains to you. Otherwise, please leave it blank."
4. "Please be sure to include apartment numbers, and postal codes on the above."
5. "Please write your email contact information on the top of one of the TD1 forms when you submit them."
6. "On your first day, please bring a void cheque for our payroll direct deposit."
7. "If you do not have a chequing account, please ask your bank for the direct deposit information. It is your responsibility to provide accurate information."
8. "If these forms are not signed and completed before your first shift, you will not be permitted to begin your shift."
9. "Please acknowledge receipt of this email."
10. "Sincerely, / Sarvi Ghahremanpour"

### Footer
"Over the Rainbow • www.rainbowjeans.com
This is an automated message from the OTR Scheduling App."

### Attachments (default)
- Welcome PDF (rendered from above template)
- Federal TD1 (Drive file ID `WELCOME_FED_TD1_ID_`)
- Ontario TD1 (Drive file ID `WELCOME_ON_TD1_ID_`)

### What is missing from the welcome email
- **No app URL / login link.** The only link is to the company website `www.rainbowjeans.com`, not to the scheduling app.
- **No mention of the password.** Admin must communicate the default password out-of-band (verbal, SMS, separate email).
- **No mention of the email being the login identifier.**
- **No basic-features summary.** Nothing about how to view the schedule, how to mark unavailability, how to request time off, how to swap shifts, how to mark sick.
- **No expected-actions checklist.** "On first login, you will be asked to set a personal password" is implied but not stated.

---

## 4. Ranked gaps

### BLOCKING for launch (employee cannot complete onboarding without external coordination)

**G1. Welcome email contains no app URL.** New employee gets the email and has no link to click. Admin must tell them the URL via SMS/verbal. Trivial to fix — add one line + button to the welcome email.

**G2. Welcome email contains no default password.** New employee gets the email and has no password. Admin must communicate the default password separately. Trivial to fix — show the computed default in the email body, or tell the employee what their default-password format is so they can self-derive ("Your default password is your first name and last initial without spaces, e.g. JohnR").

### CONFUSING for launch (employee can complete it but with friction)

**G3. Login-screen hint is hardcoded to FirstnameL format.** `LoginScreen.jsx:130`: "First time? Your default password is your first name and last initial with no space, e.g. JohnR" — shown unconditionally. Wrong for any account whose default isn't FirstnameL (legacy seeds, owner row's `emp-owner`, manually-set passwords). This is the bug class JR experienced. Fix is either (a) make it conditional on the row's actual default format (requires knowing the row before the user has authenticated — not trivial), or (b) soften the hint to "Use the password your manager gave you. If you haven't received one, contact your manager." Option (b) is one-line and works for every default-password format.

**G4. "Set Your Password" modal does not echo or remind of the default password.** Employee just typed it, the modal opens; no recap. Adds momentary "wait, did I just type it right?" friction. Low effort to fix (the backend already returns `defaultPassword` in `result.data.defaultPassword` per the explore findings).

**G5. No password-strength guidance in the modal.** 4-char minimum is silently enforced. New employee may try a 3-char password, get a generic error, retry. One-line fix: show "Min 4 characters" under the New Password field.

**G6. No first-time orientation surface after password is set.** Employee lands on the schedule grid with no welcome, no tour, no "here's what you can do." The "Updates Pending" yellow pill and the "Shift Changes" button at the top right are the only affordances; an employee who has never used the app won't know what either does. This is the highest-ROI place to add the New-User Guide affordance (see Section 6).

**G7. Owner-row resets re-introduce the modal mismatch JR experienced.** If an owner ever runs `resetPassword` on the owner row, the row goes back to `passwordChanged=false`, the default plaintext is computed anew (FirstnameL: `JR`), and the next login fires the modal — including for owners. There is no `isOwner` bypass in the trigger predicate. Decision needed: should owner-row login skip the first-login modal entirely (since owner identity is implicit), or stay consistent? See Section 5 recommendation.

### COSMETIC

**G8. Login-screen color shifts between sessions.** First-arrival shows red accents; post-logout shows blue accents. Possibly intentional theme rotation, but unexplained. Not a launch blocker.

**G9. ARCHITECTURE.md still documents the old `emp-XXX` default-password pattern.** Misleading for any future contributor. One-line update.

**G10. Second-login transition still says "This can take a moment on first sign-in" even on second+ logins.** The "Loading your schedule…" card uses the same copy regardless of whether it's truly the first sign-in.

---

## 5. Recommended UX-smoothing changes

Ranked by impact-per-effort. Each item names what to change, why, and rough effort.

### High impact, low effort (ship first)

**R1. Add app URL + default-password-format line to welcome email body.** Closes G1+G2 (both blocking). Two lines added to `WELCOME_TEMPLATE_HTML_` near the top:
> "Schedule app: https://rainbow-scheduling.vercel.app
> Your login is your email address. Your default password is your first name and last initial with no space (e.g. JohnR). On first login you'll be asked to set a personal password."

Rough effort: 30 minutes (edit, paste-deploy, smoke).

**R2. Soften the login-screen hint to be format-agnostic.** Closes G3. Change `LoginScreen.jsx:130` from "First time? Your default password is your first name and last initial with no space, e.g. JohnR" to:
> "First time? Use the password your manager gave you. If you haven't received one, ask them."

Rough effort: 15 minutes (edit, smoke).

**R3. Add "Min 4 characters" hint under the New Password field in `ChangePasswordModal`.** Closes G5. Rough effort: 10 minutes.

**R4. Update ARCHITECTURE.md to reflect FirstnameL as the current default-password pattern.** Closes G9. Rough effort: 5 minutes.

### Medium impact, medium effort

**R5. Echo the default password in the "Set Your Password" modal banner.** Closes G4. The backend already returns `defaultPassword` in `result.data.defaultPassword`; pass it through `LoginScreen.jsx -> ChangePasswordModal` and render in a "You logged in with `XXX`. Now choose your own password." banner. Rough effort: 1 hour.

**R6. Owner-row first-login modal bypass.** Closes G7. Add an `employee.isOwner === true` short-circuit in `Code.gs:1089-1096` so the owner never sees `usingDefaultPassword=true`. Owner is implicitly trusted; no UX value in forcing them through the modal. Rough effort: 30 minutes (1-line backend change + smoke).

### High impact, high effort (separate mini-project — see Section 6)

**R7. New-User Guide.** A short in-app help surface or PDF guide covering basic features. Detailed scope in Section 6.

### Low priority

**R8. Distinguish login-screen accent color rotation logic OR pin it to a single brand color.** Closes G8. Rough effort: 30 minutes if intentional theme rotation is to be removed; longer if it's load-bearing.

**R9. Conditional copy on "Loading your schedule…" — drop "first sign-in" framing on subsequent logins.** Closes G10. Rough effort: 15 minutes.

---

## 6. Follow-up mini-project: New-User Guide

Out of scope for this audit but enabled by the screenshots captured here. Goal: a short user-facing guide so a new employee can self-onboard without verbal coordination.

### Suggested guide outline (~6 topics)
1. **Logging in** — how to find the URL, what the default password is, the "Set Your Password" first-login modal.
2. **Reading the schedule** — week tabs, period navigation, what coloured cells mean (work, time off, unavailable, sick), the "Updates Pending" pill.
3. **Marking yourself unavailable / submitting time off** — using the "Shift Changes -> Days Off" path.
4. **Swapping a shift with a coworker** — "Shift Changes -> Shift Swap" path; how the request is routed and what happens when accepted.
5. **Giving away a shift** — "Shift Changes -> Take My Shift" path; how it's posted and accepted.
6. **What to do if you're sick** — interim policy + how it shows up on the schedule.

### Format options for JR to choose from
- **A. In-app help panel** — accessible from the employee profile menu ("Help / Guide"). Lives inside the app, always up to date with the current UI. Highest discoverability. Highest effort.
- **B. PDF attachment to welcome email** — bundled with the existing TD1 forms. Lowest friction to ship; static so it can drift from the UI. Medium effort.
- **C. Static webpage at a stable URL** — linked from welcome email + footer. Easy to update. Medium effort.

### Screenshot inventory needed for the guide
Most of these can come from a future agent-browser session against the same dev server. Already captured (in `~/.claude/scratch/audit-onboarding-2026-05-07/`):
- Login screen
- First-login modal
- Schedule grid (employee view)
- Profile menu (employee surface)
- Shift Changes picker (3 paths)

Still to capture:
- Days Off form (after clicking that path)
- Shift Swap picker (which coworker, which shift)
- Take My Shift posting flow
- "Updates Pending" pill expanded
- A populated schedule (current period has no published shifts on dev)

This mini-project is queued behind JR's review of this audit. Recommended sequence:
1. JR reads this findings doc.
2. JR picks which gaps to fix (R1–R6 are likely wins).
3. JR picks the guide format (A / B / C).
4. Separate /coding-plan ships R1–R6 in one batch.
5. Separate content-only plan drafts the New-User Guide and captures the remaining screenshots.

---

## Audit cleanup state

- Test Guy: Inactive, password=`TestG`, `passwordChanged=false`. Ready for next first-login smoke without any pre-step.
- The `reference_smoke_logins.md` memory previously listed `TestG2` as Test Guy's rotating password; it is now `TestG` again. Update at handoff.
- No code changes shipped this session. No commits. No deployments.
