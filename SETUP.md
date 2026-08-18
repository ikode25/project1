# KEY & DEED — Setup Guide

This guide is written for a landlord or landlady with no coding background. Follow the
steps in order. It takes about 15–20 minutes the first time.

You do **not** need to create a Google Sheet, a Drive folder, or any spreadsheet tabs
yourself — the system builds all of that automatically the first time it runs.

---

## What you need before you start

- A Google account (a regular Gmail account is fine).
- (Optional, for text message reminders) An account with **Arkesel** (arkesel.com), a
  Ghanaian SMS gateway. You can add this later — the system works without it, it just
  won't send SMS until you do.

---

## Step 1 — Create the Apps Script project

1. Go to **script.google.com** and sign in with your Google account.
2. Click **New project**.
3. Click the project name at the top ("Untitled project") and rename it to
   **KEY & DEED**.

## Step 2 — Paste in the files

The project starts with one empty file called `Code.gs`. You need to end up with these
five files in the project, each with the matching content from this delivery:

| File in this delivery | What to do in the Apps Script editor |
|---|---|
| `appsscript.json` | Click the gear icon (Project Settings) on the left, tick **"Show appsscript.json manifest file in editor"**, then open it from the file list and replace its contents. |
| `Code.gs` | Already exists — delete everything in it and paste in the contents of `Code.gs`. |
| `index.html` | Click the **+** next to Files → **HTML** → name it exactly `index` → paste in the contents of `index.html`. |
| `Styles.html` | Same as above, name it exactly `Styles` → paste in the contents of `Styles.html`. |
| `Scripts.html` | Same as above, name it exactly `Scripts` → paste in the contents of `Scripts.html`. |

File names matter: `index`, `Styles`, `Scripts` (no `.html` typed into the name box —
Apps Script adds that automatically). Save the project (Ctrl/Cmd+S).

## Step 3 — Run setup() once

1. At the top of the editor, use the function dropdown (next to the "Debug" button) and
   select **setup**.
2. Click **Run**.
3. The first time, Google will ask you to authorise the script. Click **Review
   permissions**, choose your Google account, click **Advanced** → **Go to KEY & DEED
   (unsafe)** → **Allow**. This warning appears because the script isn't published on
   the Google marketplace — it's normal for a private script you wrote/pasted yourself.
4. Once it finishes, open **View → Logs** (or press Ctrl+Enter). You'll see a message
   like:

   ```
   Setup complete. Spreadsheet: https://docs.google.com/spreadsheets/d/xxxxx
   Default admin login -> Email: admin@keydeed.local  Password: Change-Me-4821
   Change this password immediately after first login (Settings > My Account).
   ```

5. **Write down that email and password.** You'll use it to log in as an admin in Step
   5, and you should change it immediately afterwards.

`setup()` is safe to run again at any time — it repairs missing sheet tabs or Drive
folders instead of duplicating your data. You can also trigger it again later from
**Settings → Rebuild Database** inside the app, or from **Health Check → Fix it**.

## Step 4 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `KEY & DEED v1`
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. Copy the **Web app URL** shown — this is the link you will share publicly (for the
   tenant portal and property listings) and use yourself to log in as admin.

Every time you change the code and want the live app to reflect it, use **Deploy →
Manage deployments → Edit (pencil) → New version → Deploy**. Simply saving the files
does not update the live URL.

## Step 5 — Log in and finish onboarding

1. Open the Web App URL from Step 4.
2. Scroll down and click **Landlord / Admin login**.
3. Log in with the email and temporary password from Step 3.
4. You'll land on the **Onboarding** screen. Fill in your name, phone number, email,
   and (if you have it) your Arkesel API key and Sender ID. Add your first property if
   you're ready — you can also do this later from **Properties**.
5. Click **Finish Setup**.

## Step 6 — Change your password

Log in, go to **Settings**, and change your password from the temporary one immediately.
(If you don't see a "My Account" section, use **Users** as a SuperAdmin to reset the
default admin's password from there.)

## Step 7 — Register an Arkesel Sender ID and add your API key

1. Sign up at **arkesel.com** and top up SMS credit.
2. Register a **Sender ID** (max 11 characters, e.g. `KEYDEED`) — Arkesel/NCA approval
   can take 24–48 hours for a new Sender ID.
3. Copy your **API key** from the Arkesel dashboard.
4. In the app, go to **Settings**, paste the API key and Sender ID, and tick **Enable
   SMS sending**. Save.
5. From **Messaging**, select a test tenant and use **Send Now** to confirm delivery
   before relying on it for real reminders.

## Step 8 — Add your first property and rooms

1. Go to **Properties → Add Property**. Fill in the region, town, Ghana Post GPS
   address, and upload a few photos.
2. Go to **Rooms → Add Room**, attach it to the property, set the monthly rent and
   minimum advance months, add photos, and tick **Listed Publicly** if you want it to
   appear on the public portal.

## Step 9 — Install the daily reminders trigger

Go to **Settings → Install Reminder Trigger** (or **Health Check → Fix it** next to
"Daily Reminders Trigger"). This installs a trigger that runs every morning at 08:00
Africa/Accra time to send rent-advance and notice-to-quit reminders automatically.

## Step 10 — Share the public URL

Share the Web App URL from Step 4 with prospective tenants. They can browse vacant
rooms and apply without logging in. Existing tenants use the same URL and click
**Tenant portal login** to view their tenancy with their phone number.

---

## Health Check

Use the **Health Check** screen (admin) at any time to confirm the database, Drive
folders, the daily trigger, SMS credentials, and your email sending quota are all
working. Each failing check has a **Fix it** button where an automatic fix is possible.

---

## Troubleshooting

**"Authorization required" keeps appearing every time I open the script.**
This is normal the first few times you run a new function from the editor (e.g. after
adding `installTriggers`). Click through the same Review Permissions → Advanced →
Go to KEY & DEED (unsafe) → Allow flow each time a *new* permission is requested.

**The daily reminder trigger doesn't seem to be firing.**
Time-driven triggers only run on deployed/authorised projects, not simply by having the
code present. Confirm via **Health Check** that the trigger shows "Installed". If not,
click its **Fix it** button, or run `installTriggers` manually once from the Apps
Script editor's function dropdown. Also check **Triggers** (clock icon) in the left
sidebar of the Apps Script editor for any error notifications Google emailed you.

**SMS says "rejected" or never arrives.**
A brand-new Arkesel Sender ID needs approval from the network operators (can take a
day or two) before messages using it will deliver. Until then, use "GENERIC" or a
default Arkesel-provided sender ID for testing, or check the Arkesel dashboard's
delivery reports for the exact rejection reason. Also confirm you have SMS credit and
that **Settings → Enable SMS sending** is ticked.

**Emails stop sending partway through the day.**
Gmail consumer accounts (@gmail.com) have a daily sending quota of **100 emails/day**;
Google Workspace accounts get **1,500/day**. The **Health Check** screen shows your
remaining quota. If you hit the limit, sending resumes automatically after the daily
quota resets (roughly 24 hours after your first send that day).

**I ran `setup()` again and I'm worried it duplicated my data.**
It doesn't. `setup()` only creates a tab, folder, or default row if one doesn't already
exist — existing property, tenant, and payment data is left untouched.

**The public portal shows "Portal not available".**
Go to **Settings** and make sure **Public portal enabled** is ticked, and confirm at
least one Room has **Status: Vacant** and **Listed Publicly: Y**.

**I forgot the default admin password and never changed it.**
Open the Apps Script editor, run `setup()` again — since a SuperAdmin already exists it
won't create a new one. Instead, ask another SuperAdmin to reset your password from
**Users**, or manually edit the `Users` tab's `PasswordHash`/`Salt` columns to force a
reset (advanced — back up the sheet first).

---

## One-line assumptions made during the build

Where the brief left a detail unspecified, the simplest option for a landlord was
chosen automatically rather than stopping to ask:

- The "Property & Terms" wizard step is presented as a read-only summary of the chosen
  room plus a single "desired advance months" field, since detailed term negotiation
  happens between landlord and tenant, not purely through form fields.
- Tenant self-service login uses a 6-digit SMS code with a 10-minute expiry and a
  6-attempt rate limit per phone number.
- The admin session token is a random 6-hour-lived token cached server-side via
  `CacheService` (Apps Script has no built-in server session store for anonymous web
  apps).
- Caretaker and Viewer roles have a reduced navigation menu client-side matching their
  server-side permissions (money, notices, messaging, settings and user management are
  hidden from Caretaker/Viewer, not just blocked).
