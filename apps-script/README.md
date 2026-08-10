# School Result Management — Apps Script source

This folder holds the source for the actual system (the Google Apps Script web app that
`index.html` at the repo root iframes in). It isn't wired up to auto-deploy — this repo has no
`clasp` project attached, so the previous version of these files only existed inside the Apps
Script editor, not in git. These are now the fixed versions; copy them back into the Apps Script
project to publish the fixes (see **Deploying** below).

## What was fixed

### 1. SMS'd report card links opened blank (no scores, no promotion info)
**Code.gs** — `getReportCardUrl`, `sendReportSMS`, `getCompiledReportSMS`

The report link sent in SMS/WhatsApp (`?page=report&id=...`) often left out `&year=` and
`&term=` — e.g. the SMS panel's "Enter Student ID" quick-send never had them to begin with.
Without them, `report.html` asks the server for "the current report" for that student, which
resolves against the school's *current* active term/year at the moment the parent actually opens
the link — not the term the report was for when it was shared.

That's invisible right up until a promotion/rollover runs (`executeAutomaticPromotions`), which
overwrites the student's `Class`/`Year`/`Term` in place on the `Students` sheet. After that, the
exact same link a parent saved suddenly resolves to the brand-new (still empty) term — no subject
scores, no remarks, and no promotion status, even though the report was correct when sent. That's
the "report card opens but scores/remarks don't show" bug.

**Fix:** every report link is now pinned to the report's actual resolved year/term
(`rep.student.Year`/`Term`) at generation time, so it keeps pointing at the same report
indefinitely — a later rollover can't move the link out from under it. This also lets
`getStudentReport()`'s existing historical-lookup path do its job (it already restores archived
remarks/promotion status for a past term; it just needs a URL that says "past term" instead of a
blank one that silently means "whatever term is active right now").

### 2. Promotion status never showed on the report card
**report.html**

The admin Settings screen has had a "Show Promotion Status" toggle for a while
(`SHOW_PROMOTION_STATUS`), and the admin's own live preview inside `admin.html` already respected
it — but the actual parent/student-facing `report.html` page (the one opened from the SMS link or
QR code) never read that setting or rendered the field at all. Added a Promotion Status row to the
Conduct & Remarks section, shown whenever the setting is on and the student has a value set.

### 3. "Promoted" wasn't mentioned in the SMS
**Code.gs** — `getNextClassName`, `buildPromotionNote`, used in `sendReportSMS`,
`getCompiledReportSMS`, and available as a `{PromotionNote}` placeholder in bulk SMS templates.

When a report is for Term 3 (the final term) and the student already has a Promotion Status set
(`Promoted` / `Repeated` / `Graduated`), the SMS now appends a line such as:

> Congratulations! Ama Owusu has been promoted from Basic 4 to Basic 5 for the next academic year.

using the same class-progression mapping the actual end-of-year rollover
(`executeAutomaticPromotions`) uses, so the wording matches what will really happen when the admin
runs the rollover.

### 4. Font "resets itself" / walkthrough tour reappears on every mobile login
**admin.html**, **Code.gs**

Two related root causes, both boiling down to this app running inside a sandboxed
`script.google.com` iframe, where mobile browsers (Safari in particular) are much more aggressive
about evicting `localStorage` between sessions than desktop browsers:

- **Font:** `SYSTEM_FONT_FAMILY`/`SIZE`/`WEIGHT` are a single school-wide setting (one value in
  the shared `Settings` sheet), but the generic "Save Settings" button (used for school
  name/address/SMS key/etc.) was *also* resending all three font keys on every save, using a
  chain of fallbacks (in-memory → localStorage → cached settings → hardcoded default). On a
  device where none of those fallbacks had anything yet — overwhelmingly a mobile browser with
  evicted `localStorage` — that fallback bottomed out at the hardcoded default and silently reset
  the font **for the entire school, on every device**, the moment any unrelated setting was saved.
  Fix: the generic save no longer touches the font keys at all — the dedicated Typography card
  already has its own save button (`saveTypographySettings()`) that's the only thing that should
  ever write them.
- **Walkthrough:** "has this account seen the tour" was tracked only in `localStorage`
  (`wk_visited_<role>`), which is per-browser — so a wiped mobile browser looked like a fresh
  account and replayed the tour every login. It's now tracked server-side per account
  (`getWalkthroughSeen`/`markWalkthroughSeen` in Code.gs, keyed by role+username), with
  `localStorage` kept only as a same-device fast path. "First time only" now means first time on
  the account, not first time in this particular mobile browser.

### 5. QR code generator for the Result Checker portal
**admin.html** (Settings → **Result Checker QR** tab)

Admins can generate a QR code that opens the Student/Parent Result Checker portal
(`?page=student`), then print a ready-to-post poster (school name/logo + QR code) or download the
QR image directly, so parents/students can scan it with their phone camera instead of typing a web
address.

> First version of this card was added inside the School Info tab's content, but
> `switchSettingsTab()` only shows cards it's explicitly told to show per tab — since the card
> wasn't in that list, it was hidden the instant the page loaded (School Info tab activates by
> default) and never visible. It's now its own tab ("Result Checker QR") with its own entry in
> `switchSettingsTab()`.

### 6. Owner Performance Reports (new)
**admin.html** (Settings → **Owner Reports** tab), **Code.gs** — `buildOwnerPerformanceHtml`,
`generateOwnerPerformancePDF`, `emailOwnerPerformanceReport`, `getClassSummaryData`

Once exam scores are entered and report cards are generated, the admin can compile **one PDF**
covering every selected class: each student's full performance (ID, name, total, average,
position) plus a Top 10 table per class, then send it to the school owner:

- **Generate & Preview PDF** — builds the PDF server-side (HTML → PDF via `Utilities`'s blob
  conversion), saves it to a dedicated "School Performance Reports" Drive folder with link
  sharing on, and shows a preview link.
- **Email to Owner** — sends the PDF as a direct email attachment via `MailApp` to the address
  saved in Owner Contact Details.
- **Send via WhatsApp** — WhatsApp's `wa.me` links can only pre-fill text, not attach a file, so
  this opens a WhatsApp chat with the owner's number pre-filled with a message containing the
  Drive preview link generated in the previous step (same pattern the app already uses for
  texting individual report cards via WhatsApp).

Owner Name/Email/WhatsApp Phone are new settings (`OWNER_NAME`/`OWNER_EMAIL`/`OWNER_PHONE`),
saved independently of the rest of Settings (mirroring the SMS API card) so an unrelated save
elsewhere can never touch them.

## Deploying these changes

This repo isn't connected to the Apps Script project via `clasp`, so the fastest path is manual:

1. Open the Apps Script project (Extensions/Apps Script from the linked Google Sheet, or
   script.google.com → your project).
2. For each file below, select all the existing content and replace it with the matching file
   from this folder, then save (Ctrl/Cmd+S):
   - `Code.gs` → `apps-script/Code.gs`
   - `admin.html` → `apps-script/admin.html`
   - `report.html` → `apps-script/report.html`
   - `index.html` → `apps-script/index.html` (this is the Apps Script web app's own student
     portal page — not the repo-root `index.html`, which is just the iframe wrapper and doesn't
     need any change)
3. Deploy → Manage deployments → edit your existing web app deployment → New version → Deploy.
   (Just saving the files updates the `/dev` URL; you need a new deployment version for the
   `/exec` URL the repo-root `index.html` iframes.)

If you'd rather set this repo up to push straight to Apps Script via `clasp` going forward, that's
a one-time `clasp login` + `clasp clone <scriptId>` (matching this folder as the root) and then
`clasp push` — happy to help wire that up on request.
