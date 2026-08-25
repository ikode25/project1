# Apps Script Source

This folder is a version-controlled mirror of the Google Apps Script project that
powers the live app (the root `index.html` in this repo is just a full-screen
iframe pointing at the deployed Apps Script web app URL — it isn't the app itself).

- `Index.html` — the frontend (UI, styles, client-side JS).
- `Code.gs` — the backend (server-side JS: sheet access, settings, SMS, triggers, etc).

## Deploying changes

Editing these files in this repo does **not** update the live app by itself.
To publish a change, copy the updated file(s) into the Apps Script editor
(script.google.com) for this project — or push with
[`clasp`](https://github.com/google/clasp) if this project is clasp-linked —
and re-deploy the web app (**Deploy → Manage deployments → Edit → New version**).

## What changed in this update

- Removed the mobile bottom navigation bar (MENU / DASHBOARD / SETTINGS / ACCOUNT).
  Those actions remain reachable via the topbar hamburger menu, sidebar, and the
  topbar user dropdown (Change Password) — nothing lost, just the floating dock
  is gone.
- Restyled the Admin Dashboard's top summary into a 12-card KPI layout (info
  cards + circular-progress rings) matching the requested reference design.
  The other existing stats (New Students, Inactive Students, System Users,
  Parents with 2+ Wards, Pending Notifications, Classes, Scholarship Students)
  were kept, just moved into a compact "More Stats" strip below the KPI grid.
- Added **Automatic Outstanding Balance SMS**: a daily, admin-scheduled job
  (Settings → General) that texts every parent with an outstanding balance one
  SMS breaking their wards down into "Partially Paid" and "Unpaid" — covering
  both regular term fees and extra/custom fees. Admin sets the daily send time,
  can flip it on/off, and can trigger an immediate test run ("Send Now").
  Sends via whichever SMS provider is already configured in Settings
  (Arkesel / Hubtel / Infobip / Termii / Custom).
- Added a **Monthly Collection Target** setting, used by the new "Monthly
  Target" dashboard card to track this month's collections against it.
