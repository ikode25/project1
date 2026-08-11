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

### 7. Report links still broke in the field — root cause was SMS delivery, not the code
**Code.gs** — `ReportLinks` sheet (new), `createReportLinkToken`, `resolveReportLinkToken`,
`buildPinnedReportUrl`, `doGet`

Fix #1 above (pinning the link to a specific year/term) turned out not to be the whole story.
A real link sent by SMS still showed up with the term cut off — `...&term=Term 3` arrived on the
phone as a link ending in `...&term=Term`, with a stray `3` left dangling outside the hyperlink.
Opening it landed on a report for a term that matched nothing (empty subject table again), and
a separator character (`|`) elsewhere in the same message showed up on the phone as `@`.

Both symptoms have the same explanation: SMS is plain text delivered through carriers/handsets
that don't reliably preserve everything in a long, multi-part message — an un-encoded space isn't
valid in a URL to begin with, and even the correctly percent-encoded form (`Term%203`) isn't
guaranteed to survive concatenated (multi-part) SMS delivery intact. `|` sits in the GSM-7
*extension* table (it needs a 2-byte escape sequence some gateways mishandle), which is
consistent with it arriving as `@` instead.

Rather than trying to out-guess carrier behavior, report links no longer carry the risky data at
all: `?page=report&rid=<10-char token>` resolves server-side (via a new `ReportLinks` sheet
mapping token → student/year/term) to the exact same pinned report — there's nothing left in the
URL for delivery to corrupt. Old-style `?page=report&id=...&year=...&term=...` links (already
sent, or bookmarked) still work unchanged. SMS message bodies were also switched to plain
GSM-7-safe characters throughout (`-` instead of `|`, `GHS` instead of `¢`) as a second line of
defense.

> **This only protects SMS sent *after* redeploying.** A link already sitting in someone's
> messages app was corrupted (or not) at the moment it was delivered — redeploying doesn't
> retroactively fix text already on a phone. Any parent who got a broken link needs it resent
> (Preview Report → select the student → Send Report SMS) once these changes are live; the new
> send will use the token-based link.
>
> The `ReportLinks` sheet is created automatically the first time a report link is generated —
> no manual setup needed, same as the other auto-created sheets in this system.

### 8. Landing page photo carousel (new)
**index.html** (public student portal hero banner), **Code.gs** — `uploadCarouselImage`,
`removeCarouselImage`, `getCarouselImages`, `getPublicSettings`, **admin.html** (Settings →
School Info → "Landing Page Carousel")

The public portal's hero banner (top of the Student Portal / Result Checker landing page) now
cross-fades through photos the admin uploads — school buildings, classrooms, students — instead
of the single fixed stock photo. Admin manages photos from Settings → School Info: upload any
number of images (client-side resized before upload), remove any of them, and the carousel
picks up the change on the next portal page load. No photos uploaded → the original default
banner image is shown, so this is fully backward compatible. Images are stored in a dedicated
"School Carousel Images" Drive folder (same sharing pattern as the school logo/stamp/signature),
with just the list of links kept in Settings (`SCHOOL_CAROUSEL_IMAGES`, a small JSON array) —
`getPublicSettings()` (already unauthenticated, used by the landing page before anyone logs in)
now includes it.

### 9. Admin's chosen font "disappears" on mobile
**admin.html** — `populateSettingsUI`, `applyBrandingFromCache`, `saveSettings`

Root cause was the opposite of what it looked like. `SYSTEM_FONT_FAMILY`/`SIZE`/`WEIGHT` is one
shared, school-wide setting — correctly saved server-side (confirmed by the desktop screenshot
showing the real "Poppins / Medium 500" that had been set). But the code that *applies* a fetched
font to the UI was written to prefer a dedicated `sysTypography` key in **localStorage** over
whatever the server just returned — a leftover guard against a narrower bug (saving a font, then
having a slightly-stale in-flight settings fetch resolve a moment later and silently revert it
back). localStorage has no expiry and is per-device: any phone that had *ever* cached a different
font locally — from before the admin last changed it on another device, or from some earlier
session — would keep re-imposing that stale local value forever, even though the server had since
been correctly updated. That's exactly "admin sets the font, but it doesn't show on mobile": the
phone's own old cached font permanently shadowing the real one.

Fixed by using `window._currentTypography` (in-memory, cleared on every fresh page load, only
ever set by `applyTypography()` running *during the current session*) for that same-session
protection instead of the persistent localStorage cache — so a real cross-device settings change
is no longer at the mercy of whatever a given phone happened to cache at some point in the past.

Separately, `saveSettings()` (the generic "Save Settings" button) was also caching only the
handful of fields *that form* saves, wholesale-replacing the entire cached `schoolSettings`
localStorage blob instead of merging into it — silently dropping the font (and logo/stamp/
signature) from that cache until the next full settings fetch corrected it. Harmless on a fast
connection; on a slow one it could show a brief flash of the wrong/default font on next load.
Fixed to merge instead of replace.

### 10. Landing page carousel — fill the whole screen
**index.html**

The hero (and the carousel behind it) sized itself to its content, which could be shorter than
the viewport. Gave `.landing-hero` `min-height: 100vh` (`100svh` where supported, so it doesn't
jump as a mobile browser's address bar shows/hides) so the photos always cover the full screen —
a true fullscreen slider — while still growing further if content needs more room.

### 11. "Email to Owner" errored
**Code.gs** — `emailOwnerPerformanceReport`, `testMailAppAuthorization` (new)

Sending email from Apps Script needs a permission (`MailApp`/`GmailApp` "send email" scope) that
Google can only prompt for when someone runs a mail-sending function **directly in the Apps
Script editor** and accepts the consent screen — a web app deployed to run "as me" has no way to
trigger that prompt for a visitor, so the very first email send after adding this feature fails
with a permission/authorization error until that one-time consent has been granted.

**Fix on your end (one-time):** open the Apps Script editor → Code.gs → pick
`testMailAppAuthorization` from the function dropdown → **Run** → approve the permission prompt.
It sends a one-line confirmation email to your own account; once you've done this, "Email to
Owner" works from the deployed web app. `emailOwnerPerformanceReport` now also detects this
specific failure and returns that same instruction instead of a raw exception message, and checks
the account's daily email quota first so a used-up quota (100/day on a plain Google account) also
gets a clear, specific message instead of a generic error.

### 12. Result Checker QR code — styled with the school's brand color + logo
**admin.html** — `generatePortalQR`, `compositeQRWithLogo`, `printPortalQR`

The QR (Settings → Result Checker QR) now renders in the school's own report-card brand color
(`REPORT_PRIMARY_COLOR`, set under Settings → Report Options) instead of plain black-on-white,
generated at high error-correction (`ecc=H`) specifically so it tolerates a school logo
composited into the center (client-side, via canvas) without becoming unscannable. If the logo
can't be read back out of a canvas in a given browser (e.g. a CORS restriction on wherever it's
hosted), it falls back to the plain color-themed QR rather than failing outright. The printable
poster's border/logo ring now use the same brand colors instead of a fixed gold.

### 13. Fullscreen carousel covered the Staff Portal button
**index.html**

Follow-up to #10: the fixed carousel/overlay were nested inside `.landing-hero`, which sets its
own `z-index: 0` — that pulls its whole subtree (including a negative-z-index fixed child) into a
layer that CSS stacking rules paint *above* later plain, non-positioned page content (the Staff
Portal button, its caption, the footer), regardless of the child's own z-index or DOM order.
Once the carousel became fixed/full-viewport, that meant it permanently covered the button at
every scroll position — still in the DOM, just hidden underneath. Moved `.hero-carousel` and
`.hero-carousel-overlay` to be direct children of `<body>` (siblings of `.landing-hero`, matching
the existing `.bg-canvas` decoration's placement) so they're no longer trapped inside
`.landing-hero`'s stacking context. Carousel dots stay nested in `.landing-hero` as
`position:absolute` (not fixed) since they only need to show over the initial photo/intro area.

### 14. Student records: page reset on save, Parent Contact column, photo upload race, sort/hide columns
**admin.html** — `loadStudents`, `applyStudentFilters`, `saveStudent`, `editStudent`,
`confirmDeleteStudent`, `STUDENT_COLUMNS`, `renderStudentsHeader`, `sortStudents`,
`toggleStudentColumn`, **Code.gs** — `updateStudent`

- **Editing a student on page 2+ and saving bounced back to page 1.** `loadStudents()`
  unconditionally reset the page to 1 and discarded any active search/class/gender filter on
  every call, including the reload right after a save. It now takes a `preservePage` flag —
  `saveStudent()`/`editStudent()`/`confirmDeleteStudent()` pass `true` so the admin stays on the
  same page, with whatever filter was active re-applied to the fresh data instead of cleared.
- **Parent Contact** (`ParentPhone`) is now a column in the students table and shown on the card
  view — the field already existed on every student record, it just wasn't displayed anywhere in
  the list.
- **Uploaded student photo "didn't appear."** The photo upload to Drive is asynchronous, but the
  modal shows an instant local preview the moment a file is picked — so it looks attached well
  before the real Drive URL has actually come back. Clicking Save in that window saved the
  student with whatever photo URL was there *before* the upload finished (often blank), silently
  dropping the new photo. `saveStudent()` now blocks (with a clear message) while a photo upload
  is still in flight. Separately, `updateStudent()`'s PhotoUrl field used `d.PhotoUrl ||
  <existing>` — since an empty string (from the "remove photo" button) is falsy, `||` silently
  kept the OLD photo instead of clearing it; fixed to match the explicit-vs-undefined pattern
  already used for every other field on that record.
- **Column visibility toggle** — a "Columns" button above the table opens a checklist to
  show/hide any column (ID, Name, Gender, Class, Year, Term, Parent Contact, Photo, Average);
  Actions always stays visible. Persisted in `localStorage` per browser.
- **Sortable columns** — click any sortable column header to sort ascending, click again for
  descending; an indicator arrow shows the active sort.

### 15. Fees & Bills: extra per-student fees, bold-border printing, 2-per-sheet, bill on SMS
**admin.html** — `openExtraFeeModal`, `submitExtraFee`, `removeExtraFeeUI`, `buildBillRowsForStudent`,
`buildBillInvoiceHtml`, `BILL_PRINT_CSS`, `printAllBills`, `printFeeInvoice`, **Code.gs** —
`addExtraFeeToStudent`, `removeExtraFeeFromStudent`, `buildStudentBillHtml`,
`generateStudentBillPdfUrl`

- **Bill one student for something extra.** A "＋ Extra Fee" button on each row in Fees & Bills
  opens a small modal to bill just that student for something that doesn't apply to the rest of
  the class (a damaged textbook, a late fee, an excursion, ...) — without adding a new column
  every other student in the class would also see. Stored per-student as
  `FeeData._extraFees = [{name, amount, addedAt}]` and rolled straight into `NextTermFees`, so it
  automatically flows through everywhere that already reads `NextTermFees`: the row's Total
  Expected, the printed bill, and the "Bill: GHS…" SMS line — those call sites didn't need to
  know `_extraFees` exists. Saves immediately (not part of the "Save Billing Data" batch), since
  it's a deliberate one-off billing action, not a value the admin is still editing.
- **Print styling: bold borders, high-contrast text.** The printable bill/invoice (single print
  and bulk) now uses 2-3px solid borders throughout and solid dark text via a shared
  `BILL_PRINT_CSS` block (plus `-webkit-print-color-adjust:exact` so the header/background colors
  themselves survive a printer's default "background graphics off" setting) — the previous 1px
  light-grey grid is exactly what tends to fade out on real printers/toner-saving modes.
- **1 bill per sheet, or 2 per sheet.** A layout dropdown next to the new "Print All Bills" button
  in Fees & Bills lets the admin choose: one student's bill per A4 page, or two stacked on one
  sheet with a dashed "✂ cut here" divider between them — useful for handing out bills without
  burning a full page per student. The single per-row "Print" button always stays 1-per-sheet
  (reprinting one specific bill), and both share the exact same bold-border builder so the layout
  is never inconsistent between single and bulk printing.
- **Bill attached to the report-card SMS.** SMS can't attach a file directly, so when a student
  has a nonzero Next Term Fees balance, `sendReportSMS`/`getCompiledReportSMS` now generate a PDF
  of their current bill (same line-item breakdown as the printable invoice, including any extra
  fees) and add a "Bill PDF: <link>" line to the message — same Drive-upload-and-link pattern
  already used for Owner Performance Reports. Only generated when there's actually a balance, so
  a zero-balance student's SMS doesn't spend time creating an empty bill. `sendBulkSMS` templates
  can reference the same thing via a new `{BillPDF}` placeholder (only resolved, again, when the
  student owes something *and* the admin's template text actually uses that placeholder — so a
  bulk announcement that doesn't mention bills doesn't generate one for every recipient).

### 16. Dashboard: real fee/reporting tiles + chart; toolbar parity on Teachers/Classes
Requested as "match this other product's dashboard/table design." Rather than copy tiles for
data this system has no source of truth for (a payments log with dated transactions, staff
attendance, incident tickets), this pass adds dashboard tiles/charts backed by data SRMS
actually has, and brings the Students table's search/export/print toolbar pattern to the two
other list views that lacked it. The navy/gold brand palette was kept throughout, matching the
report cards, bill invoices, and QR codes.

- **New Dashboard tiles** — Outstanding Fees (GH¢, sum of Arrears + Next Term Fees across every
  student) and Reports Published (how many report cards are actually live for parents right now)
  join the existing Total Students/Teachers/Classes/etc. tiles. **Code.gs** `getDashboardData`
  now returns `outstandingFees`, `reportsPublished`, `feesByClass`.
- **New chart** — "Outstanding Fees by Class" (`renderFeesBarChart`), a themed bar chart next to
  the existing Class Performance / Term Trend charts, using the same theme-color rotation as the
  gender/class-size KPI charts so it re-colors correctly if the admin changes the theme preset.
- **Teachers table** now has the same search box + Export CSV + Print toolbar the Students table
  already had (`filterTeachers`, `renderTeachersTable`, `exportTeachersCsv`) — previously just a
  raw, unfiltered table.
- **Classes table** gained an Export CSV button (`exportClassesCsv`) alongside its existing
  search/print.

Not done in this pass, flagged for a follow-up if wanted: applying the same toolbar pattern to
every remaining list view (Master Sheet, Archive Explorer, etc.), and a literal sidebar-nav/
color-palette reskin to match the referenced product pixel-for-pixel — the second one touches
shared CSS used by every page in the app and was deliberately scoped down per your answer to
keep the existing navy/gold brand intact.

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
4. **One-time, only needed for "Email to Owner" to work:** in the same editor, pick
   `testMailAppAuthorization` from the function dropdown next to the Run button, click **Run**,
   and approve the permission prompt. See fix #11 above for why.

If you'd rather set this repo up to push straight to Apps Script via `clasp` going forward, that's
a one-time `clasp login` + `clasp clone <scriptId>` (matching this folder as the root) and then
`clasp push` — happy to help wire that up on request.
