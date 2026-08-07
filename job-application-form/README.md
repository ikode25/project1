# Job Application Form (Google Apps Script)

This folder holds the source for the Google Apps Script (GAS) web app that the
root `index.html` in this repo iframes (`doGet()` in `Code.gs` serves `index.html`
from here as the deployed web app).

## Files

- `index.html` - the full front end (React, loaded via CDN, transpiled in-browser
  with Babel standalone). Renders both the public application form and the admin
  dashboard.
- `Code.gs` - the Apps Script backend: Sheets-backed storage, auth, email, and SMS.

## Deploying

Apps Script projects aren't deployed straight from this git repo. To publish a
change made here:

1. Open the bound Apps Script project (Extensions > Apps Script from the Google
   Sheet that backs the form).
2. Copy the contents of `Code.gs` and `index.html` into the corresponding files
   in the Apps Script editor (or push with [`clasp`](https://github.com/google/clasp)
   if the project is clasp-linked - `appsscript.json` is included here too so
   `clasp push` carries the OAuth scopes below along with it).
3. Deploy a new version (Deploy > Manage deployments > Edit > New version).

### Fixing "You do not have permission to call UrlFetchApp.fetch"

SMS sending is the first feature in this project to call an external HTTP API
(`UrlFetchApp`), so the script needs a new OAuth scope
(`.../auth/script.external_request`) that it never needed before. Apps Script
computes the scope set at **authorization time**, not automatically on every
save, so adding this code doesn't retroactively grant it - you'll see exactly
the error in the screenshot until you do this once:

1. In the Apps Script editor, open `Code.gs`, pick any function from the
   function dropdown (e.g. `getSmsBalance`), and click **Run**.
2. You'll get an **"Authorization required"** prompt - click **Review
   permissions**, choose your account, click **Advanced** > **Go to
   [project] (unsafe)** if Google shows the unverified-app warning (expected
   for a script you own that hasn't been submitted for verification), then
   **Allow**.
3. Go to **Deploy > Manage deployments**, click the pencil icon on the active
   deployment, and choose **New version** > **Deploy**. (Re-authorizing alone
   isn't enough - the live web app keeps running the old authorized version
   until you deploy a new one.)

If `appsscript.json` above is present in the project (paste it in via the
editor's gear icon > "Show `appsscript.json`"), Apps Script lists the scopes
up front instead of inferring them, which makes this consent screen show up
more reliably the first time.

One more thing to check while you're in there: **Deploy > Manage deployments
> Edit > Execute as** should be **"Me"**, not "User accessing the web app".
Since applicants and SMS never authenticate, "User accessing the web app"
has no identity to authorize against and every restricted call (UrlFetchApp,
MailApp, etc.) fails the same way for anonymous visitors.

### WhatsApp (Admin > Settings > WhatsApp)

No WhatsApp Business API, no credentials, no setup. Clicking "WhatsApp"
(bulk actions bar, or a candidate's own button) opens a
[wa.me click-to-chat link](https://faq.whatsapp.com/425247423114725) for
that applicant's number in a new browser tab - WhatsApp Web or the desktop/
mobile app opens with the message pre-filled, and the admin presses **Send**
themselves. That's the entire mechanism: no server-side sending, no API
calls, nothing to authorize.

Admin > Settings > WhatsApp only has two small things to configure:
- **Default Country Code** (digits only, e.g. `233`) - fills in the country
  code on numbers applicants typed with a leading `0` (so `024...` becomes
  `233024...` without it, but `233244...` with it set).
- The same four message templates as SMS (Confirmation/Shortlist/Interview/
  Rejection) - this text is what pre-fills the WhatsApp message.

Like SMS, WhatsApp is **admin-triggered only** - nothing sends
automatically on submission or interview scheduling. Because it's just a
pre-filled text link (not an API), it can't attach a PDF or any file the way
email can.

## What's new in this update

- **Appearance settings** (Admin > Settings > Appearance): pick one of six
  preset color themes or build a custom one from two base colors, plus an
  optional doodle pattern (dots/waves/blobs) on the header. Stored as
  `THEME_CONFIG` in the `Settings` sheet and applied via CSS custom properties,
  so it reflects on both the public form and the admin dashboard.
- **SMS**: configure Arkesel, Hubtel, or any custom HTTP SMS API under
  Admin > Settings > SMS, plus four SMS templates (Confirmation, Shortlist,
  Interview Invitation, Rejection). Confirmation and Interview Invitation SMS
  send automatically alongside the existing emails; Shortlist/Rejection SMS
  send from the bulk actions bar, mirroring the existing bulk email flow.
  Delivery attempts are logged to a new `SmsLog` sheet.
- **Header banner**: upload a photo or GIF (Admin > Settings > Header Banner)
  to replace the plain gradient behind the application form's title.
- **Social links**: set Facebook/Twitter (X)/Instagram/LinkedIn URLs (Admin >
  Settings > Social Media Links); any that are filled in show as icons on the
  form header.
- **Applicant form**: the SSC/HSC "Board" fields were removed, an optional HND
  (Higher National Diploma) section was added alongside Bachelor's and
  Postgraduate, and the Bachelor's fields are no longer required - so
  applicants whose highest qualification is an HND and/or a Master's can
  apply without needing to enter a Bachelor's degree.
- **Admin entry point**: the header "Admin" button is now icon-only (no label,
  no box) and still opens the same login modal.
- **Login**: the password field has a show/hide (eye) toggle.
- **Toast notifications**: saving/updating/deleting records (theme, banner,
  social links, SMS settings/templates, job description, email templates,
  applications, interviews, bulk email/SMS) now shows an animated toast card
  in the corner instead of a blocking `alert()`.
- **SMS balance badge**: when SMS is enabled, the dashboard header shows a
  blinking balance badge (Arkesel is fully supported; Hubtel is best-effort
  since its balance API/response shape varies by account; it's hidden
  automatically for custom providers or if the balance can't be read).
- **Animated doodles**: the header/dashboard-header doodle pattern now drifts
  slowly instead of sitting static (respects `prefers-reduced-motion`).
- **Experience**: the "End Date" field is no longer required, even when
  "Currently working here" isn't checked.
- **Passport photo, cover letter, and per-education certificates**: applicants
  can upload a passport-style photo (camera or file picker), an optional
  cover letter, and a certificate for each education level they fill in
  (SSC/HSC/Bachelor/HND/Postgraduate) - required whenever that certificate
  field is visible. Admin controls which of these show on the form under
  Settings > Form Fields, same as any other field group.
- **Company Info + branded emails**: set your company name, description,
  website, address, phone, and email under Settings > General; all of it
  (plus your social links) now shows in the footer of every outgoing email,
  and a PDF summary of the application is attached to the confirmation email.
- **Dashboard title**: the admin dashboard heading is editable under
  Settings > General > Dashboard Title (defaults to "Candidate Management
  System" if left blank).
- **WhatsApp**: a no-API fallback channel to SMS (Admin > Settings >
  WhatsApp) - see details above. Clicking "WhatsApp" from the bulk actions
  bar or a candidate's own button opens a pre-filled WhatsApp chat with
  that applicant in a new tab (same four template types as SMS); the admin
  presses Send themselves. Admin-triggered only, no automatic sending.

All of the above is additive and stored in the same spreadsheet used today
(new rows in `Settings`, and new `SmsTemplates`/`SmsLog`/`WhatsappTemplates`
sheets are created automatically the first time they're needed) - no
manual sheet setup required.
