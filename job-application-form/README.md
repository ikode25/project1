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
   if the project is clasp-linked).
3. Deploy a new version (Deploy > Manage deployments > Edit > New version).

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

All of the above is additive and stored in the same spreadsheet used today
(new rows in `Settings`, and new `SmsTemplates`/`SmsLog` sheets are created
automatically the first time they're needed) - no manual sheet setup required.
