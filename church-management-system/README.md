# ChurchMS — Advanced Church Management System

A complete Google Apps Script web app: `Code.gs` + service-layer `.gs` modules
for the backend, `Index.html` + HTML partials for the frontend, and Google
Sheets as the datastore. Theme: gradient green/black on a white base, with
hand-authored SVG line icons (no emoji, no icon fonts).

## What's included

**Backend (`.gs`)**
- `Config.gs` — sheet schema, roles/permissions, ID prefixes, dropdown options, default Settings
- `SheetService.gs` — generic CRUD wrapper over `SpreadsheetApp` (get/insert/update/delete, ID generation, Settings key/value store)
- `Utils.gs` — server-side input validation, sanitization, rate limiting, error logging
- `Auth.gs` — session identity, role-based access control, audit logging, Users/Roles management
- `Setup.gs` — one-time bootstrap: creates the spreadsheet, tabs, headers, data validation, seeds Settings + first SuperAdmin, installs triggers
- `Code.gs` — `doGet` router (admin app / public check-in / public prayer request) + `include()` helper
- `Members.gs`, `Dashboard.gs`, `Visitors.gs`, `Attendance.gs`, `Finance.gs`, `SMS.gs`, `Equipment.gs`, `Reports.gs`, `ClusterFollowUp.gs`, `Communication.gs` (prayer requests + internal messaging), `Notifications.gs`, `Triggers.gs`, `Settings.gs` — one file per module, each exposing the functions its frontend view calls via `google.script.run`

**Frontend (`.html`)**
- `Index.html` — app shell (sidebar, topbar, content area, view router)
- `Styles.html` — the whole green/black/white gradient design system (cards, tables, badges, forms, modals, toasts)
- `Icons.html` — one inline SVG sprite of hand-drawn line icons
- `ClientCore.html` — shared client JS: `google.script.run` promise wrapper, router, toast/modal/loader, generic data-table + form-field builders, Google Charts loader
- `Dashboard.html`, `Members.html`, `Visitors.html`, `Attendance.html`, `Finance.html`, `Communication.html`, `Equipment.html`, `Reports.html`, `SettingsView.html`, `ClusterFollowUp.html` — one partial per sidebar module, each self-mounting into `Church.views`
- `AccessDenied.html`, `CheckIn.html`, `PrayerPublic.html` — standalone pages for unprovisioned users, the public QR check-in flow, and the public prayer request form

## Deploying

1. Create a new Apps Script project at [script.google.com](https://script.google.com) (or `clasp create`).
2. Copy every file in this folder into the project, keeping filenames and extensions exactly as-is (`Code.gs`, `Members.gs`, `Index.html`, …).
3. In the Apps Script editor, select `runInitialSetup` from the function dropdown (in `Setup.gs`) and click **Run**. This:
   - creates the backing spreadsheet ("ChurchMS Database") and stores its ID in Script Properties
   - creates every sheet tab with its header row and dropdown data validation
   - seeds default Settings (edit these later from the Settings module)
   - registers **you** (the account running the script) as the first `SuperAdmin` in the Users sheet
   - creates a Drive folder for attachments (photos, documents, receipts) and one for backups
   - installs the time-driven triggers (daily notifications digest, hourly scheduled-SMS processor, weekly backup)
4. **Deploy → New deployment → Web app**. Execute as "Me", access "Anyone within [your domain]" (or "Anyone" if you need the public check-in/prayer links to work for non-Google visitors — see note below).
5. Open the deployed URL. You should land on the Dashboard as SuperAdmin.
6. Under **Settings → Users**, add your team with the right roles (`Admin`, `FinanceOfficer`, `ClusterLeader`, `CommunicationOfficer`, `Viewer`). Only emails listed there — and marked Active — can sign in.
7. Under **Settings → SMS Providers**, pick Arkesel, Hubtel, or a custom REST gateway and enter credentials.

### Public pages

- Check-in: `<web app URL>?page=checkin` (or `&id=<MemberID>` from a QR code — generated per member in **Attendance → QR Codes**)
- Prayer requests: `<web app URL>?page=prayer` (link also shown in **Bulk SMS → Prayer Requests**)

Both are rate-limited server-side and don't require the visitor to be a provisioned ChurchMS user. If your deployment access is restricted to your Google Workspace domain, these pages will still ask Drive/Sheets-adjacent visitors to sign in — set the deployment's access to "Anyone" if the public should never see a Google sign-in prompt.

## Roles

| Role | Typical access |
|---|---|
| `SuperAdmin` | everything, including Settings → Users and backups |
| `Admin` | Members, Visitors, Attendance, Equipment, Reports, Settings (view) |
| `FinanceOfficer` | Finance module (giving, pledges, expenses, reports) |
| `ClusterLeader` | Members (view), Visitors, Attendance, Cluster Follow-up |
| `CommunicationOfficer` | Bulk SMS, Prayer Requests, Messaging |
| `Viewer` | Dashboard only |

Every privileged backend function calls `requireRole_(module, 'view'|'mutate')` itself — the sidebar hiding a menu item is a UX nicety, not the enforcement.

## Notes

- SMS: `SMS.gs` isolates the actual HTTP call behind `dispatchSms_()`, with `sendViaArkesel_`, `sendViaHubtel_`, and `sendViaCustomProvider_` (endpoint/method/field names all configurable from Settings, so any REST SMS gateway works without touching calling code).
- Custom Member fields (admin-defined) are configured under **Settings → Custom Fields** and rendered dynamically on every member's profile.
- Donor statements are generated as Google Docs, exported to PDF, and saved to the attachments Drive folder.
- All create/update/delete operations are written to `AuditLog`; failed/denied access attempts are logged there too.
