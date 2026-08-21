# School Fees Management — Firebase edition

This app now runs as a single static file, `index.html`, backed by a
**Firebase Realtime Database** instead of Google Sheets + Apps Script. The
admin dashboard and parent portal are both bundled into that one file
(`?page=portal` shows the portal, same as the old `doGet(page)` routing).

A tiny Apps Script Web App (`Code.gs`) still runs alongside it — only for the
handful of things a static HTML file can't safely do on its own: send the
parent OTP SMS / daily accounting email, and upload student photos to Google
Drive. Everything else (students, fees, payments, messaging, reports, SMS
history, etc.) reads and writes Firebase directly from the browser.

## Project layout

- `index.html` — **the deliverable.** Build output, single self-contained file.
- `src/admin.html`, `src/portal.html` — the original UI, unmodified.
- `src/backend.js` … `src/backend4.js`, `src/shim.js` — the Firebase-backed
  replacement for `Code.gs`'s ~130 functions, plus a `google.script.run`
  compatibility shim so the original UI code didn't need to change.
- `build.py` — assembles `index.html` from the files above. Run `python3
  build.py` after editing anything in `src/`.
- `Code.gs` — the trimmed Apps Script bridge (OTP SMS, daily email, photo
  upload, secure settings, external sync receiver).
- `migrate.gs` — one-time script to copy your existing Sheets data into
  Firebase. See instructions inside.
- `firebase-rules.json` — Realtime Database security rules.

## One-time setup

1. **Enable Anonymous sign-in.** Firebase console → Authentication →
   Sign-in method → enable **Anonymous**. The app silently identifies itself
   this way on load (no password prompt, invisible to users) so the database
   rules below can require a real Firebase identity on writes.

2. **Realtime Database rules.** Firebase console → Realtime Database →
   Rules, paste in `firebase-rules.json` and publish. It's currently
   locked (`.read`/`.write: false`), so nothing works until you do this.

   Reads stay open (`.read: true`) — that matches how the parent portal
   already worked, looking up fee balances without logging in. Writes
   require `auth != null`, i.e. only the app itself (and `Code.gs`, which
   signs itself in the same way) can write — a script or stranger hitting the
   database URL directly gets rejected. The app still keeps your original
   custom email/password login for its own UI, not Firebase Authentication,
   so this doesn't check *who* is writing — just that it's coming through the
   real app rather than a random request. For real per-user access control
   later, that needs Firebase Authentication wired into the login flow
   itself.

3. **Redeploy Code.gs.** In your Apps Script project, replace the contents
   with the new `Code.gs` in this repo, then Deploy → Manage deployments →
   edit the existing deployment → New version → Deploy. Keep the same Web
   App URL (`index.html`'s `APPS_SCRIPT_URL` already points at it).

4. **Migrate existing data (only if you have an old spreadsheet).** Follow
   the instructions at the top of `migrate.gs` to copy your current
   students/fees/settings/etc. into Firebase. Run it once. Skip this
   entirely if you're starting fresh.

5. **Host `index.html`.** Your Firebase project already has a Hosting site
   linked (`skul-fees`). From this repo:
   ```
   npm install -g firebase-tools   # if not already installed
   firebase login
   firebase deploy --only hosting
   ```
   (add a `firebase.json` pointing `public` at this repo's root, and a
   `.firebaserc` with your project id `fees-1f58a`, if not already present).
   Any static host works too (GitHub Pages, Netlify, etc.) — it's just one
   HTML file.

## Making changes later

Edit `src/admin.html`, `src/portal.html`, or the `src/backend*.js` /
`src/shim.js` files, then run:

```
python3 build.py
```

to regenerate `index.html`. Don't hand-edit `index.html` directly — it's a
build artifact and your changes will be lost on the next build.
