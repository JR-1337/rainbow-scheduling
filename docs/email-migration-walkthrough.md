# Email Migration Walkthrough -- Step by Step

**What you're doing:** Right now, schedule emails from the Rainbow app go out from John's personal Gmail. After this walkthrough, they'll go out from the dedicated `otr.scheduler@gmail.com` instead. Everyone on staff sees a cleaner sender; John's inbox stops getting bounce-backs and reply-alls.

**Time:** ~30-45 minutes. Most of it is waiting for Google to think.

**You'll need:**
- Login to John's personal Gmail (the current owner of the spreadsheet + script).
- Login to `otr.scheduler@gmail.com` (the new dedicated account).
- The phrase "Apps Script" doesn't have to make sense to you yet -- it's just a piece of code attached to the spreadsheet. Treat it like a sibling of the Sheet.

**What CAN go wrong:** very little. If something looks off at any step, **stop and text John before clicking further**. Nothing in this walkthrough deletes data.

---

## Part 1 -- Make sure you're signed into both Google accounts

1. Open a fresh Chrome window.
2. Top-right corner: click the round profile icon. If you see only one account, click "Add another account" and sign in to **`otr.scheduler@gmail.com`**.
3. Click the profile icon again and switch to **John's personal Gmail** (`johnrichmond007@gmail.com`). Everything in Parts 2 and 3 happens from John's account first; you'll switch later.

You should now have **both accounts active in the same browser**, with John's personal as the one currently selected.

---

## Part 2 -- Transfer the Spreadsheet

The Rainbow Scheduling app reads and writes one Google Sheet. We're going to hand that Sheet over to the new account.

1. Open Google Drive (drive.google.com), still signed in as John's personal.
2. Find the Rainbow scheduling spreadsheet. (John can drop you the exact name -- it's the one with employees, shifts, and time-off requests on its tabs.)
3. **Right-click** the file -> **Share** -> **Share** again.
4. In the "Add people and groups" box, type `otr.scheduler@gmail.com` and pick **Editor** access. Click **Send**.
5. Wait ~10 seconds. Refresh.
6. **Right-click** the file again -> **Share** -> **Share**. The `otr.scheduler@gmail.com` row is now visible.
7. Click the dropdown next to that row and choose **Transfer ownership**. Click **Send Invitation**.
8. Now switch browser profile to **`otr.scheduler@gmail.com`** (top-right profile icon).
9. In Drive (still as the new account), open the spreadsheet's Share dialog. There will be a banner: **"Accept ownership."** Click it.
10. Done -- the spreadsheet now belongs to `otr.scheduler@gmail.com`.

**Sanity check:** Right-click the spreadsheet -> File information -> "Owner" should read `otr.scheduler@gmail.com`.

---

## Part 3 -- Transfer the Apps Script

The "Apps Script" is the code attached to the spreadsheet. Because it's bound to the Sheet, transferring the Sheet usually transfers the Script too -- but we're going to make sure.

1. Still signed in as **`otr.scheduler@gmail.com`**, open the spreadsheet.
2. Top menu: **Extensions** -> **Apps Script**. A new tab opens with the script editor.
3. Top-left of that tab: click the **gear icon (Project settings)** in the left sidebar.
4. Look at "Owner". If it says `otr.scheduler@gmail.com`, you're done with Part 3 -- skip to Part 4.
5. If it still says `johnrichmond007@gmail.com`:
   - Click **Share** (top-right of the Apps Script editor).
   - Add `otr.scheduler@gmail.com` as Editor.
   - Click the dropdown next to that row -> **Transfer ownership** -> confirm.
   - Switch back to the new account if prompted, accept ownership.
   - Refresh Project Settings; Owner should now read `otr.scheduler@gmail.com`.

**Sanity check:** Project Settings -> Owner = `otr.scheduler@gmail.com`. If not, **stop and text John.**

---

## Part 4 -- Re-publish the script (this is the lever that flips the sender)

This is the step that actually changes who emails come from. Before this, even though the new account "owns" the script, the *deployed copy* of the script that the live app talks to was deployed by John's account -- so emails still come from John's address. We're going to publish a new copy of the script *as the new account*.

1. Still in the Apps Script tab, signed in as `otr.scheduler@gmail.com`.
2. Top-right of the editor: blue **Deploy** button -> **New deployment**.
3. A panel opens. Click the **gear icon** at the top-left of that panel and select **Web app**.
4. Fill in the fields:
   - **Description:** type `OTR Scheduling -- otr.scheduler ownership` (or anything; this is just a label).
   - **Execute as:** **Me (`otr.scheduler@gmail.com`)** -- this is the critical setting. Confirm it reads the new account.
   - **Who has access:** **Anyone**.
5. Click **Deploy**.
6. Google will prompt you to authorize. Click through:
   - **Authorize access** -> select `otr.scheduler@gmail.com`.
   - You'll see "Google hasn't verified this app." Click **Advanced** -> **Go to (unsafe)**. This is a known Apps Script quirk; the app is yours, it's safe.
   - Tick all the checkboxes Google asks for (Sheets, Gmail, Drive). Click **Allow**.
7. After authorization, Google shows you a green "Deployment successfully updated" panel. **Copy the URL** under "Web app". It looks like:
   `https://script.google.com/macros/s/AKfycby...long-string.../exec`
8. **Save that URL somewhere John can grab it** -- text it to him, or paste into a shared note. He needs it for Part 5.

**Done!** From this moment on, anyone who runs the app against the *new* URL will send mail from `otr.scheduler@gmail.com`. But the live app at `rainbow-scheduling.vercel.app` is still pointing at John's old script URL. Part 5 fixes that.

---

## Part 5 -- John updates the app and pushes (developer step)

This part requires John. Hand him the new URL from Part 4 step 7. He'll:

1. Open `src/utils/api.js` in the codebase.
2. Replace the value of `API_URL` (line 6) with the new `/exec` URL.
3. Run `npm run build` to bundle the change.
4. `git add src/utils/api.js && git commit -m "config(api): swap API_URL to otr.scheduler-owned Apps Script deployment"` and push.
5. Vercel auto-deploys within ~60 seconds.
6. While he's at it, he'll also clean up dead `callerEmail` branches in `backend/Code.gs` (audit item A-7) since they touch the same backend deploy moment.

---

## Part 6 -- Test that emails actually come from the new address

**Goal:** prove that publishing a schedule sends an email *from* `otr.scheduler@gmail.com`, not from John's personal Gmail.

1. Wait 60-90 seconds after John pushes (Vercel deploy time).
2. Open `https://rainbow-scheduling.vercel.app` and **hard-refresh** (Ctrl+Shift+R, or hold Shift while clicking refresh).
3. Sign in as Sarvi or John (any admin account).
4. Pick a quiet test target -- ideally a single test employee, or the dummy "TEST-ADMIN1-SMOKE" row.
5. Submit a small action that triggers an email -- the simplest is to **approve a time-off request** if any are pending, OR publish a new schedule period for a test employee.
6. Check John's inbox AND `otr.scheduler@gmail.com` inbox.
7. Open whichever inbox got the test email. Click the email.
8. **Click the three-dot menu next to the timestamp -> "Show original"** (Gmail). A new tab opens.
9. At the top of that page, look for the line `From:`. It should read:
   `From: OTR Scheduling <otr.scheduler@gmail.com>`
10. If it does -- **migration complete. Mark this checklist done in `CONTEXT/TODO.md`.**
11. If it still says `johnrichmond007@gmail.com` -- **stop, text John.** It usually means the old URL got cached in the browser; he'll know how to verify.

---

## What to watch for over the next 7 days

- **Old bookmarks / pinned tabs:** anyone who has the old script URL bookmarked will still hit John's old script for a few days until they hard-refresh. The old URL is still alive (we did not delete it) so nothing breaks; emails from those clicks will go from John's account. As staff cycle through, they'll all land on the new URL automatically.
- **Don't delete the old deployment** for at least 7 days. After that, John can safely remove it.
- **Daily email quota:** the new account starts fresh at 100 emails/day. Sarvi's typical Friday blast (35 staff) fits well under that.

---

## If something goes wrong

- **At any step before Part 5:** nothing has changed for live users yet. Roll back is simply "stop, text John, don't click further." Even if Parts 2-4 are half-done, they don't affect the live app -- the live app still points at the old URL.
- **After Part 5 push:** if test emails fail or come from the wrong sender, John can revert one commit (`git revert`) and re-push. The old deployment is still alive; the app falls back to it instantly.
- **If the spreadsheet looks weird after the transfer:** stop and text John. Do not edit cells manually to "fix" it -- the data is intact, the visual quirk is usually a permission cache.

---

## Quick reference -- who does what

| Part | Who | Time |
|---|---|---|
| 1 -- Sign into both Gmails | Anyone | 2 min |
| 2 -- Transfer Sheet | Anyone (handles Drive UI) | 5 min |
| 3 -- Confirm Apps Script ownership | Anyone | 3 min |
| 4 -- Re-publish Web App as new account | Anyone (handles Apps Script Deploy UI) | 10 min |
| 5 -- Update `API_URL` + push | **John** | 5 min |
| 6 -- Test a real email | Anyone | 5 min |
| 7 -- Watch over 7 days | John | passive |
