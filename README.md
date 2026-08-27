# Tenancy Agreement Portal

A landlord-branded tenancy agreement system built on the same blueprint as the
School Management System this project was modelled on: **Google Sheets as the
database + Google Apps Script as the API + a single web page as the whole
front end**, with a tokenised public link so tenants never need an account.

## What it does

- **The deployed web app URL opens straight into a public Tenancy Application
  Form** — no login, no link needed — the same way a job application page
  works: a prospective tenant lands on it directly, fills in their name,
  contact details, what they're interested in, and submits. It shows up on
  the landlord's dashboard as a **New Application**. A small lock icon in the
  corner of that page is the landlord's way in — click it to reach the admin
  login.
- **Landlord (admin)** logs in via that icon, reviews new applications (or
  starts an agreement from scratch), fills in the deal terms (property, rent,
  deposit, dates, bank details), and sends the tenant a unique signing link by
  email (or copies it to send however they like). Reviewing an application and
  saving it with all the required fields filled in automatically promotes it
  from "New Application" to "Draft", ready to send — no separate convert step.
- **Tenant** opens the link — no account needed — and walks through:
  1. Review the full agreement (parties, premises, rent, dates, deposit).
  2. Read the Terms & Conditions — the "I agree" checkbox only unlocks once
     they've scrolled to the end.
  3. Sign with a typed signature.
  4. Review everything one more time and submit.
  5. Download their own signed PDF copy (also emailed automatically to both
     tenant and landlord).
  6. Tenants can decline instead, with an optional reason — the landlord is
     notified either way.
- **Landlord dashboard** tracks every agreement — draft, sent, viewed, signed,
  declined, expired — with search/filter, resend, copy-link, and PDF download.
- **Renewal reminders**: a daily trigger emails tenants whose signed tenancy is
  coming up for renewal (configurable lead times, e.g. 60/30/7 days out). The
  reminder email has "Yes, I'd like to renew" / "No, I'll be vacating" buttons
  — the tenant's answer shows up on the landlord's dashboard so they know
  exactly who to follow up with and who to draft a new agreement for.
- Every login, send, view, sign, decline and reminder is written to an
  **Activity Log** sheet for a full audit trail.

## Files

- [`gas/Code.gs`](gas/Code.gs) — the Apps Script backend (data model, auth,
  PDF generation, email, reminders).
- [`gas/Index.html`](gas/Index.html) — the whole front end (landlord login +
  dashboard, and the public tenant-signing flow), plain HTML/CSS/JS.
- `index.html` (repo root) — a thin wrapper that iframes your deployed web
  app, matching how this repo was already set up.

## Setup

1. Go to [sheets.new](https://sheets.new) to create a blank Google Sheet —
   this becomes your database. Name it something like "Tenancy Agreements".
2. **Extensions → Apps Script**. Delete the placeholder `Code.gs` content and
   paste in the contents of [`gas/Code.gs`](gas/Code.gs).
3. In the Apps Script editor, add a new HTML file named exactly **`Index`**
   (File → New → HTML) and paste in the contents of
   [`gas/Index.html`](gas/Index.html).
4. From the toolbar function dropdown, select **`setup`** and click ▶ Run.
   Approve the permission prompts (it needs access to this Sheet, Drive, and
   Gmail-sending on your behalf). This creates the `Users`, `Settings`,
   `Agreements` and `Logs` sheets, and a default admin login.
5. **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone** (tenants need to open their link without a
     Google account)
   - Click Deploy, and copy the `.../exec` URL it gives you.
6. Run **`installDailyReminderTrigger`** once (same toolbar dropdown) to turn
   on automatic renewal reminders. You can also do this later from the
   spreadsheet's **🏠 Tenancy Portal** menu (reload the Sheet tab to see it).
7. Open the `.../exec` URL — you'll see the public Tenancy Application Form.
   Click the lock icon (top-right) to log in with `admin` / `admin123`, and:
   - Go to **Settings** and change your password immediately.
   - Fill in your landlord name, address, phone, email, bank details, and
     review the Terms & Conditions text (already pre-filled from a standard
     Ghanaian tenancy agreement template — edit it to suit your own).
8. (Optional) Update the `src` in the root [`index.html`](index.html) of this
   repo to your new `.../exec` URL if you want to keep using this repo as a
   simple redirect/embed page, the same way it pointed at the previous
   Apps Script deployment.

## Re-deploying after future edits

Apps Script web apps are versioned: editing `Code.gs`/`Index.html` in the
script editor does **not** change what `.../exec` serves until you go to
**Deploy → Manage deployments → (pencil icon) → New version → Deploy**.

## Recovering admin access

If the admin password is lost, open the Apps Script editor, select
**`resetAdminPassword`** from the function dropdown, and run it. It resets
(or recreates) the `admin` account to `admin / admin123`.

## Notes on the data model

Everything lives in one Google Sheet with four tabs:

- **Users** — landlord/admin logins.
- **Settings** — one row of landlord defaults (name, bank details, currency,
  default term/notice period, reminder lead days, the T&C template).
- **Agreements** — one row per tenancy agreement, including its unique
  sharing token, every field on the printed agreement, its status, and the
  renewal chain (`RenewalOfId` / `RenewedToId`) if it was renewed.
- **Logs** — a flat audit trail (timestamp, user, action, details).

Renewing a signed agreement doesn't edit it in place — it creates a *new* row
linked back to the original, so the original signed record (and its PDF) is
never altered after the tenant has signed it.
