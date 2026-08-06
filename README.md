# MySchool Job Application

This repo has two parts:

- **`job-application-form/`** - the actual application (React + Google Apps
  Script). This is what applicants and admins use day to day. See
  [`job-application-form/README.md`](job-application-form/README.md) for how
  to deploy changes there.
- **Root files** (`index.html`, `manifest.json`, `sw.js`, `icons/`) - a small
  installable PWA wrapper that iframes the deployed Apps Script app. This is
  what makes "Add to Home Screen" on a phone open a real full-screen app
  instead of a browser tab. It is entirely optional - the Apps Script app
  works fine on its own without it - but it's the only way to get the
  no-browser-chrome "real app" feel.

## Hosting the PWA wrapper

The root files are plain static files (no build step). Deploy them with
whichever of these you already use:

### Netlify

`netlify.toml` is already set up (publish directory is the repo root, plus
cache headers for the service worker/manifest/icons).

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import
   an existing project** → pick this repo.
2. Build command: leave blank. Publish directory: `.` (repo root) - Netlify
   picks this up automatically from `netlify.toml`.
3. Deploy. Your app is now at `https://<your-site-name>.netlify.app`.

### Firebase Hosting

`firebase.json` is already set up (serves the repo root, excludes
`job-application-form/`, sets the same cache headers).

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # pick "Use an existing project" or create one;
                         # when it asks to overwrite firebase.json, say No
firebase deploy --only hosting
```

This generates a `.firebaserc` tied to your project (not committed here
since it's project-specific) and your app is now at
`https://<your-project-id>.web.app`.

### GitHub Pages (also available)

`.github/workflows/pages.yml` deploys the same root files automatically on
every push to `main`. To turn it on: repo **Settings → Pages → Source: GitHub
Actions**. Your app is then at `https://<you>.github.io/<repo>/`.

### After deploying, on your phone

Open whichever URL you deployed to (not the `script.google.com` link) →
browser menu → **Add to Home Screen**. It launches from your home screen
with its own icon and no browser address bar.

## Why the raw `script.google.com` link never looks like a "real app"

Opening the Apps Script `/exec` URL directly always shows normal browser
chrome (address bar, tabs) - that's true of any website opened as a plain
tab, PWA or not. The form itself is fully mobile-responsive at that URL (try
it - it should fit your screen properly with no zooming or horizontal
scrolling needed), but the browser-app feel (no address bar, home-screen
icon) only happens through the installable wrapper above.

Google also shows its own "This application was created by a Google Apps
Script user" disclosure banner at the top of unverified public Apps Script
web apps. That's injected by Google, not this code, and there's no supported
way to remove it short of Google Workspace Marketplace app verification.
