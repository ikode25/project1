# Advance Tailor — Management System

A complete Google Apps Script web application for a bespoke tailoring
business in Ghana: a public marketing/booking website plus a secured
admin dashboard, backed entirely by a single Google Sheet (no external
database). Built on the same blueprint/architecture as a barber & salon
management system, re-modeled end-to-end for a tailoring house.

## What it does

**Public website**
- Branded homepage: hero carousel, about, services, team, portfolio
  gallery, videos, testimonials
- Online booking wizard for fittings/consultations (service → tailor →
  date/time → details → optional mobile-money deposit → confirmation)
- **Track My Order** — customers look up a bespoke garment order's live
  production stage (Order Received → Measuring → Cutting → Sewing →
  Fitting → Finishing → Ready for Pickup → Delivered) by reference or
  phone number, with no login required
- Booking lookup/cancel by reference or phone, contact form, WhatsApp
  click-to-chat, Google Maps embed

**Admin dashboard** (role-gated: Owner / Manager / Staff / Receptionist)
- Dashboard overview: revenue, orders by production stage, today's
  appointments, orders due soon, low-stock alerts
- **Orders** — bespoke garment production tracking (kanban + table),
  fabric source/details, deposits & balance payments, design reference
  photo upload, linked measurement profile
- **Customers & Measurements** — CRM with loyalty points and per-customer
  measurement profiles (flexible key/value fields, with quick-fill
  templates for common garments: shirts, suits, kaba & slit, agbada,
  kids wear)
- **Appointments** — fittings/consultations table + kanban, availability
  slot blocking calendar
- **Point of Sale** — over-the-counter sales of fabric (by the yard),
  accessories and ready-to-wear pieces, with receipts and loyalty points
- **Inventory** — fabric & accessories stock with reorder alerts
- **Staff, Expenses, Reviews, Portfolio Gallery, Hero Slides, Videos,
  Users, Reports (with charts & CSV/PDF export), SMS log, Trash/recovery**
- Full branding & payments settings (colors, logo, Ghana mobile money
  numbers, bank transfer, tax rate, loyalty rules, SMS provider)

All money is in Ghana Cedis (GH₵); dates/times use the Africa/Accra
timezone.

## Files

- `Code.gs` — backend: schema, sheet-backed data access, auth, all
  business logic and API endpoints called from the client
- `index.html` — frontend: the entire public site + admin dashboard as
  one HTML/CSS/JS single-page app
- `appsscript.json` — project manifest (timezone, web app config)

## Deploying

1. Create a new Google Sheet, then **Extensions → Apps Script**.
2. Replace the default `Code.gs` with this repo's `Code.gs`, and add a
   new HTML file named `index` with this repo's `index.html` content
   (or use `clasp push` with this repo as-is — the manifest is already
   named `appsscript.json`).
3. Run `setupSheets` once from the Apps Script editor (Run ▶) and
   authorize the requested permissions. This creates every sheet tab,
   formats it, and seeds sample data — including a default login:
   - **Username:** `admin`
   - **Password:** `admin123`

   (Change this password immediately from *My Account* after first
   login.) If you skip this step, opening the deployed web app once
   will auto-provision everything on first load.
4. **Deploy → New deployment → Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Open the deployed `/exec` URL — that's your live site. Staff and
   admins log in from the "Staff Login" link in the site's nav bar or
   footer (routes to `#admin`).

### Optional: SMS delivery

By default, `Settings → SMS Provider` is set to **Simulate**, which logs
messages to the `Notifications` sheet instead of sending them — useful
for testing without a paid SMS account. Switch to **Arkesel** or
**Hubtel** and enter an API key in Settings to send real SMS in Ghana.

### Optional: daily reminders

To send customers a reminder SMS the day before their fitting, open
**Triggers** in the Apps Script editor and add a time-driven trigger
for `sendUpcomingAppointmentReminders`, running daily.

## Notes

- The app is designed for a single shop location (the `Branches` sheet
  intentionally holds exactly one row) — this keeps the data model
  simple while still supporting per-day opening hours.
- Uploaded images (staff photos, service/product photos, gallery,
  hero slides, design references, logo) are stored in a Google Drive
  folder named `AdvanceTailor_Uploads`, created automatically on first
  run, and served back through the app's own URL rather than hot-linked
  from Drive directly (for cross-browser reliability).
