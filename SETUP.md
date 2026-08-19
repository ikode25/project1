# KEY & DEED — Setup Guide

This guide is written for a landlord or landlady with no coding background. Follow the
steps in order. It takes about 15–20 minutes the first time.

You do **not** need to create a Google Sheet, a Drive folder, or any spreadsheet tabs
yourself — the system builds all of that automatically the first time it runs.

## How the system works, in plain terms

1. Your public site lists every property and room you own — both **Available** and
   already **Rented** — each with photos and a map.
2. A prospective tenant clicks **"Rent this room"**. They're asked to **sign up** (name,
   phone, email, password) or log in if they already have an account.
3. The moment they sign up, they automatically get a **welcome SMS and email** telling
   them to inspect the room and submit payment.
4. The tenant pays you directly (bank transfer, mobile money, or cash), then fills a
   **Booking & Payment form** on the portal and uploads a **screenshot as proof** (or a
   note, for cash).
5. You review the proof in your **Bookings inbox** and click **Approve** (or **Reject**
   with a reason).
6. Approving unlocks the **Tenancy Agreement Form** for that tenant — they fill in their
   personal/guarantor details, sign on-screen, and submit. A signed **PDF agreement** is
   generated automatically, their room is marked **Occupied**, and the payment they
   already made is logged as the first receipt in their ledger.
7. From then on, the tenant can log in any time to download their agreement, view their
   payment history, **message you directly** (in-app or via WhatsApp), and file
   complaints/maintenance requests. You manage and monitor every tenant from your admin
   console.

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
4. Once it finishes, open **View → Logs** (or press Ctrl+Enter) to confirm it succeeded.

5. The default admin account is created automatically with fixed credentials:

   - **Username:** `admin`
   - **Password:** `admin123`

   Use these to log in as an admin in Step 5. **Change this password immediately after
   your first login** from **Settings → My Account**. Because this default is fixed and
   publicly documented here, anyone who knows it could log in before you change it —
   don't leave it as `admin` / `admin123` on a live deployment for longer than it takes
   you to log in and change it.

`setup()` is safe to run again at any time — it repairs missing tabs/columns/Drive
folders instead of duplicating your data. You can also trigger it again later from
**Settings → Rebuild Database**, or from **Health Check → Fix it**.

## Step 4 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `KEY & DEED v1`
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. Copy the **Web app URL** shown — this is the link you will share publicly (tenants
   browse and sign up here) and use yourself to log in as admin.

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

Go to **Settings → My Account**, enter `admin123` as your current password, and set a
new one. Do this before sharing the app's URL with anyone.

## Step 7 — Register an Arkesel Sender ID and add your API key

1. Sign up at **arkesel.com** and top up SMS credit.
2. Register a **Sender ID** (max 11 characters, e.g. `KEYDEED`) — Arkesel/NCA approval
   can take 24–48 hours for a new Sender ID.
3. Copy your **API key** from the Arkesel dashboard.
4. In the app, go to **Settings**, paste the API key and Sender ID, and tick **Enable
   SMS sending**. Save.
5. From **Bulk Messaging**, select a test tenant and use **Send Now** to confirm
   delivery before relying on it for real reminders.

## Step 8 — Add your properties and rooms

1. Go to **Properties → Add Property**. If you have two or more houses/compounds, add
   each one separately, with its region, town, Ghana Post GPS address (used to draw the
   map on the public listing), and a few photos.
2. Go to **Rooms → Add Room**, attach it to the right property, and **name the room or
   balcony clearly** (e.g. "Room 3", "Balcony A", "Self-Contained Annex") — this is how
   you'll know which tenant is in which space once they're occupied. Set the monthly
   rent and minimum advance months, add photos, and tick **Listed Publicly** so it
   appears on the public site.

## Step 9 — Install the daily reminders trigger

Go to **Settings → Install Reminder Trigger** (or **Health Check → Fix it** next to
"Daily Reminders Trigger"). This installs a trigger that runs every morning at 08:00
Africa/Accra time to send rent-advance countdown reminders, agreement-pending nudges,
and notice-to-quit follow-ups automatically.

## Step 10 — Share the public URL

Share the Web App URL from Step 4 with prospective tenants. They browse your rooms,
sign up, pay, and apply — end to end — without you lifting a finger until it's time to
**approve their payment** in your **Bookings** inbox.

---

## Day-to-day: approving a new tenant

1. A tenant signs up, submits a **Booking & Payment** with a screenshot.
2. You get an email notification. Open **Bookings** in your admin console.
3. Check the payment screenshot/reference against your bank/MoMo statement.
4. Click **Approve Payment** — this unlocks their Tenancy Agreement Form and
   automatically logs their payment as the first ledger entry + receipt.
   Click **Reject** with a reason if the payment can't be confirmed — the room is
   released back to "Available" automatically.
5. The tenant fills and signs the Tenancy Agreement Form on their own. Once submitted,
   their room flips to **Occupied** and you'll see them as an **Active** tenancy.

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
Script editor's function dropdown.

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

**A tenant says they can't sign up — "account already exists".**
Each phone number and email can only be tied to one tenant account. If someone lost
access, use **Tenant Portal → Forgot password** (they need their registered phone
number) rather than creating a second account for them.

**The public portal shows "Portal not available".**
Go to **Settings** and make sure **Public portal enabled** is ticked, and confirm at
least one Room has **Listed Publicly: Y**.

**I approved a booking by mistake.**
There's no automatic "un-approve." Use **Bookings** and, once the tenant hasn't yet
signed the agreement, you can still message them via **Messages** to explain; if the
agreement has already been signed, terminate the tenancy from their profile and issue a
refund manually outside the system.

**I forgot the default admin password and never changed it.**
Open the Apps Script editor, run `setup()` again — since a SuperAdmin already exists it
won't create a new one. Instead, ask another SuperAdmin to reset your password from
**Users**, or manually edit the `Users` tab's `PasswordHash`/`Salt` columns to force a
reset (advanced — back up the sheet first).

---

## One-line assumptions made during the build

Where the brief left a detail unspecified, the simplest option for a landlord was
chosen automatically rather than stopping to ask:

- In-app messaging is a simple per-tenant thread (tenant ↔ landlord team), refreshed on
  open/send — not a live/real-time chat. WhatsApp is offered alongside it as a one-tap
  convenience link; Apps Script can't receive inbound WhatsApp messages without a paid
  Business API, so in-app messaging is the system of record.
- The property map is a no-API-key Google Maps embed built from the Ghana Post GPS
  address (or street/town/region if GPS isn't set) — no Google Maps API key needed or
  billed.
- Tenant self-service uses a real account (phone/email + password). The 6-digit SMS
  code is only used for the "forgot password" recovery path, not day-to-day login.
- The admin session token is a random 6-hour-lived token cached server-side via
  `CacheService` (Apps Script has no built-in server session store for anonymous web
  apps).
- Caretaker and Viewer roles have a reduced navigation menu client-side matching their
  server-side permissions (money, bookings approval, bulk messaging, settings and user
  management are hidden from Caretaker/Viewer, not just blocked).
