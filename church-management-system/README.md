# ChurchMS — Advanced Church Management System

A complete Google Apps Script web app in exactly **two files**:

- **`Code.gs`** — every backend function (routing, data access, auth, and all service modules)
- **`Index.html`** — the entire frontend (styles, icons, client JS, and every view), serving three things from one template:
  - the admin app shell (`?` — default), which itself holds both a **username/password login form** and the dashboard — client-side JS picks between them
  - the public QR check-in page (`?page=checkin`)
  - the public prayer request form (`?page=prayer`)

  A `pageMode` variable set server-side in `doGet` picks which section of the single template renders — see the `<? if (pageMode == ...) { ?>` block near the top of the file.

Theme: gradient green/black on a white base, with hand-authored SVG line icons (no emoji, no icon fonts).

**Login is username/password, not a Google account.** Signing in doesn't touch `Session.getActiveUser()` at all — `login()` checks a username/password against the `Users` sheet (SHA-256 + per-user salt) and mints a random session token, which the browser keeps in `localStorage` and sends back on every call. Everything privileged is routed through one dispatcher, `api(token, functionName, args)`, which validates the token and only ever calls a function from an explicit whitelist (`API_REGISTRY`). Clicking **Sign Out** invalidates the token server-side, clears it from the browser, and reloads straight back to the login form.

## What's inside `Code.gs`

Organized top-to-bottom with `======` banner comments — search for these section names:

1. **Config** — sheet schema, roles/permissions, ID prefixes, dropdown options, default Settings
2. **SheetService** — generic CRUD over `SpreadsheetApp` (get/insert/update/delete, ID generation, Settings key/value store)
3. **Utils** — server-side input validation, sanitization, rate limiting, error logging
4. **Auth** — username/password login, session tokens (`Sessions` sheet + cache), the `api()` dispatcher and `API_REGISTRY` whitelist, role-based access control, audit logging, Users/Roles management
5. **Setup** — one-time bootstrap: creates the spreadsheet, tabs, headers, data validation, seeds Settings + the first SuperAdmin, installs triggers
6. **Routing** — `doGet(e)`, the single entry point
7. One section each for **Members, Dashboard, Visitors, Attendance, Finance, SMS, Equipment, Reports, ClusterFollowUp, Communication** (prayer requests + internal messaging), **Notifications, Triggers, Settings** — every function the frontend calls via `google.script.run`

## What's inside `Index.html`

- Shared `<style>` block — the whole green/black/white gradient design system (cards, tables, badges, forms, modals, toasts)
- One inline SVG `<symbol>` sprite — hand-drawn line icons, referenced everywhere as `<use href="#ic-...">`
- The `pageMode` branch for `checkin` / `prayer` / the full `app` shell
- Inside the `app` branch: a login screen (`#login-screen`) plus the whole dashboard shell (`#app-shell`, hidden until sign-in) — sidebar + topbar + one `<div class="view">…</div>` + `<script>` pair per module (Dashboard, Members, Visitors, Attendance, Finance, Communication, Equipment, Reports, Settings, Cluster Follow-up), each self-mounting into a shared `Church.views` registry
- A shared client-side `Church` namespace (near the bottom): a `google.script.run` promise wrapper that transparently routes everything through `api(token, ...)`, the view router, toast/modal/loader helpers, generic data-table + form-field builders, and the Google Charts loader

## Deploying

You can run ChurchMS either as a **standalone** script project or **bound to a Google Sheet** (Extensions → Apps Script from inside a spreadsheet) — the same two files work for both. If bound, it uses that Sheet as its database; if standalone, it creates its own dedicated spreadsheet the first time it runs. You don't need to configure which — `runInitialSetup` detects it automatically.

1. **Standalone**: create a new project at [script.google.com](https://script.google.com). **Bound to a Sheet**: open (or create) a Google Sheet → Extensions → Apps Script.
2. In the editor, replace the default `Code.gs` content with this project's `Code.gs`. Then add a new HTML file (File → New → HTML) named exactly `Index` and paste this project's `Index.html` into it. Save (Ctrl+S / Cmd+S).
3. Select `runInitialSetup` from the function dropdown at the top of the editor and click **Run**. First run asks you to authorize the script (Review permissions → your account → Advanced → Go to project (unsafe) → Allow — this warning is normal for your own unpublished script). This:
   - uses the Sheet you're bound to as the database (or creates a dedicated "ChurchMS Database" spreadsheet if standalone), and stores its ID in Script Properties
   - creates every sheet tab with its header row and dropdown data validation
   - seeds default Settings (edit these later from the Settings module)
   - creates the first login — username **`admin`**, password **`admin123`** — a fixed default, not a secret, and only created if the Users sheet is still empty (see **Resetting the admin password** below if you've already run this once)
   - creates a Drive folder for attachments (photos, documents, receipts) and one for backups
   - installs the time-driven triggers (daily notifications digest, hourly scheduled-SMS processor, weekly backup)
4. **Deploy → New deployment → Web app**. Execute as "Me", access "Anyone" (the app no longer relies on the visitor's Google identity — access is username/password — so "Anyone" is the normal choice; a domain-restricted deployment also works and simply adds a Google sign-in step in front of ChurchMS's own login).
5. Open the deployed URL and sign in with `admin` / `admin123`, then **immediately** set a new password from your account menu (click your name in the sidebar → Change Password) — anyone who finds your web app URL can otherwise sign in with this well-known default.
6. Under **Settings → Users**, add your team: pick a username, a temporary password, and a role (`Admin`, `FinanceOfficer`, `ClusterLeader`, `CommunicationOfficer`, `Viewer`). Only users listed there — and marked Active — can sign in; each person should change their password after their first login.
7. Under **Settings → SMS Providers**, pick Arkesel, Hubtel, or a custom REST gateway and enter credentials.

### Redeploying after you change the code

A web app's `/exec` URL serves a **fixed snapshot**, not your latest saved code — editing `Code.gs`/`Index.html` again doesn't update it by itself. After any change: **Deploy → Manage deployments** → pencil icon on the active deployment → Version: **New version** → **Deploy**. (The same `/exec` URL keeps working; only its content updates.)

### Resetting the admin password

`runInitialSetup` only seeds `admin` / `admin123` when the Users sheet is completely empty — running it again later won't touch an existing account. If you're locked out (wrong password, forgot it, or it was seeded before you knew the default), select **`resetAdminPassword`** from the function dropdown and click **Run**. It force-resets (or creates, if missing) the `admin` login back to `admin123`, no matter what's currently in the sheet. It's intentionally left out of the app's own function whitelist, so it's only reachable from the Apps Script editor — never from the web app itself.

### Public pages

- Check-in: `<web app URL>?page=checkin` (or `&id=<MemberID>` from a QR code — generated per member in **Attendance → QR Codes**)
- Prayer requests: `<web app URL>?page=prayer` (link also shown in **Bulk SMS → Prayer Requests**)

Both are public and rate-limited server-side — no ChurchMS login and no Google account needed to use them.

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

- **Auth model**: no Google account is required to use ChurchMS itself. `login(username, password)` checks the `Users` sheet (SHA-256 password hash + per-user random salt, no plaintext ever stored) and returns a random session token good for 12 hours (`SESSION_DURATION_HOURS`), tracked in the `Sessions` sheet and cached. The browser keeps the token in `localStorage` and every subsequent call goes through `api(token, fnName, args)`, which re-validates the token on every single request and only dispatches to functions listed in `API_REGISTRY` — internal `_`-suffixed helpers are never reachable from the client. Signing out calls `logout(token)` (deletes the session server-side) and reloads the page, which lands back on the login form since the stored token is gone.
- SMS: the Communication section isolates the actual HTTP call behind `dispatchSms_()`, with `sendViaArkesel_`, `sendViaHubtel_`, and `sendViaCustomProvider_` (endpoint/method/field names all configurable from Settings, so any REST SMS gateway works without touching calling code).
- Custom Member fields (admin-defined) are configured under **Settings → Custom Fields** and rendered dynamically on every member's profile.
- Donor statements are generated as Google Docs, exported to PDF, and saved to the attachments Drive folder.
- All create/update/delete operations are written to `AuditLog`; failed/denied access attempts and failed logins are logged there too.
- Why one file each: Apps Script doesn't require a `.gs`/`.html` per module — this is the same system as the original multi-file build, just flattened into `Code.gs` (~2,400 lines) and `Index.html` (~2,700 lines) with `======` banner comments marking each section so it's still easy to navigate.
