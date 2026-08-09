# SRMS Apps Script source — bug fixes

This folder holds the Google Apps Script source for the School Management System
(the app that `index.html` at the repo root iframes via its deployed
`script.google.com/macros/...` URL). It isn't normally tracked here — the live
system is a **Google Apps Script project**, not this GitHub repo — but the four
files were exported so the reported bugs could be diagnosed and fixed in a
reviewable, version-controlled way.

**To apply these fixes**, open the Apps Script project (script.google.com), and
for each file below paste the fixed content over the existing file of the same
name, save, and re-deploy (Deploy → Manage deployments → Edit → New version).
`Code.gs` keeps its `.gs` extension in Apps Script; the three `.html` files stay
`.html` there too.

## Bugs fixed

### 1. Conduct / Interest & Talent / Attitude / Class Teacher's & Headmaster's Remarks — saved, then later changed or disappeared, and showed up on some students' report cards but not others

**Root cause** (`Code.gs`, `batchUpdateRemarks`): the Students sheet holds one
row per student **per academic year/term** (a student re-appears in a new row
each time they're rolled into a new term). The save function matched which row
to update by **Student ID alone**, so whichever row for that ID happened to be
last in the sheet silently won — a save intended for one term's roster could
land on a completely different term's row. On top of that, the archived
snapshot (`RemarksArchive`, which the report card reads from) was always filed
under the school's global "current term" **setting**, not the year/term the
admin/teacher actually had open — so if that setting hadn't been flipped yet
(a very common order of operations: enter next term's remarks, then later mark
it active), the save was archived under the wrong period. A later save for
whatever term *was* marked active would then overwrite that archive row —
exactly the "saved, then later changed/cleared" symptom — and the report card
lookup (which matches student+year+term exactly) would find nothing for the
period being viewed, or the wrong data, depending on the student's row order —
explaining why it was inconsistent from student to student.

**Fix**: the client (`admin.html`, `saveAllRemarks()`) now sends each item's
actual `Class`/`Year`/`Term`. The server now keys rows and archive entries by
`StudentID + Year + Term`, so a save always hits the exact record intended,
regardless of sheet row order or the global "active term" setting. The same
defect existed in `batchUpdateFeesBills` (Fees & Bills tab) and was fixed the
same way. Both functions also now clear the short-lived report cache for any
student they touch, so a report viewed right after saving reflects the new
values instead of a stale cached copy.

### 2. A student's Conduct/remarks are correctly filled in on the Remarks & Conduct tab, but still show as blank ("—") on their report card

This is the deeper, more common cause of "showed up for some students, not
others" — found after the first round of fixes, by reproducing it on a real
student (Adjei Enam, ROA0080) whose Remarks & Conduct tab showed all fields
filled in, but whose Preview Report still showed every field as "—".

**Root cause** (`Code.gs`, `getStudentReport`): the report builder reads the
student's base record from the Students sheet (correct, current), but then
unconditionally overwrites it with whatever sits in the `RemarksArchive` sheet
for that same student/year/term — *including blank fields*. If a
`RemarksArchive` row for that exact period had already been created earlier
with some fields still blank (e.g. an early save that only touched attendance
or promotion status, before the actual remarks were typed in), that old blank
snapshot would permanently mask the correct, non-blank values sitting right
there on the Students sheet — every time the report was generated, forever,
regardless of how many times the Remarks tab was resaved afterward with real
values into the *Students sheet* — because bug #1 above (before it was fixed)
often filed the resave under a different archive key than the one the report
was reading.

**Fix**: this whole block is now skipped for the student's current/live term —
the Students sheet is trusted directly, since that's exactly what the Remarks
& Conduct tab reads and writes. The archive is only consulted for a genuinely
historical report view (a past term whose Students-sheet row has since been
overwritten by a rollover into a newer term — see bug #4 below for why that
happens). This is also the fix for **"Out Of (School Days) was set to 67 but
the report still shows 75"**, and the same class of bug for Attendance,
Conduct, Interest/Talent, Attitude, and both remarks fields: whatever was
freshly saved on the Students sheet for the current term could never again be
shadowed by an older archive snapshot. This fix alone should make
already-entered data reappear on report cards immediately after redeploying —
no re-entering required, since the correct values were sitting on the
Students sheet the whole time.

### 3. Remarks/conduct/attendance silently reset to blank after someone edits a student's name, class, or photo

**Root cause** (`Code.gs`, `updateStudent`): the "Edit Student" modal only
collects Name/Gender/Class/LevelGroup/Year/Term/ParentPhone/PhotoUrl — it has
no fields for Attendance, Interest, Conduct, Attitude, Class Teacher's Remark,
or Headmaster's Remark. `updateStudent` wrote all 18 columns of the student's
row on every save, and for every column the edit form doesn't send, it wrote
`0` or `''` instead of keeping what was already there. So simply correcting a
misspelled name or uploading a student's photo — routine admin tasks — quietly
wiped that student's attendance and every remarks field, even weeks after they
had been carefully entered. This is very likely the single biggest source of
"entered and saved, then later cleared."

**Fix**: `updateStudent` now only changes a field when the caller actually
sends a value for it, and otherwise keeps the existing value (the same
pattern the code already used for TotalScore/Average/PhotoUrl — just not
consistently applied to every field). It also now matches the exact
Year/Term row being edited instead of just the first row with that Student
ID, for the same reason described in bug #1.

**Note on data already lost to this bug**: this fix stops it from happening
again, but it can't bring back a value that was already overwritten with a
blank before the fix was deployed — the old value is gone from the sheet. If
a student's remarks are still blank *everywhere* (both the Remarks tab and
the report) after redeploying, that student's data was likely already wiped
by this bug and will need to be re-entered once. Bug #2's fix will recover
any student where the Remarks tab already shows the correct values but the
report didn't — no re-entry needed for those.

### 4. A term-ending action (Activate Term / Academic Rollover / Automatic Promotions) can permanently erase a term's remarks/fees if no one happened to save them first

**Root cause** (`Code.gs`, `executeAcademicRollover`, `activateAcademicTerm`,
`executeAutomaticPromotions`): these are the admin actions that move the whole
school into a new term/year — they mutate every student's row on the Students
sheet in place: Class/Year/Term get overwritten for the new period, and
Attendance/OutOf/Interest/Conduct/Attitude/both remarks fields/fees get reset
to 0/blank/default "for the new term." None of the three ever took a snapshot
of the term that was ending before wiping it. Combined with bug #2's fix (the
report now trusts the archive for historical terms), that means a past term
is only recoverable if someone had explicitly pressed "Save" on the Remarks &
Conduct or Fees & Bills tab for every student before the term rolled over —
otherwise that term's data is simply gone, with no way for a historical
report to reconstruct it.

**Fix**: added `archiveOutgoingTermSnapshot()`, called at the start of all
three functions, right before they start overwriting rows. It snapshots every
student's current (about-to-be-overwritten) row into `RemarksArchive`/
`FeesArchive` under that row's own current Year/Term, so the term that's
ending is always recoverable via a historical report lookup afterward,
whether or not staff happened to save it first.

### 5. Printed report cards — text too faint to read (including Bulk Print's own preview)

**Root cause**: several bars on the report card (school name banner, "End of
Term Examinations" strip, position/aggregate bars, grade-key header, grand
total row) use light/white text on a dark navy or gold background — an
on-screen-only design choice. Browsers commonly print with **background
colors turned off by default** (and some printers/toner-saving modes fade
them further even when on, which is exactly what the browser's own print
preview simulates when "Color: Black and white" is selected); when that
happens, that light text sits directly on white paper and is unreadable — the
report doesn't just look "faint," the text is effectively gone. This exists
in **three separate copies** of the report-card renderer/stylesheet:
`report.html`, the student/parent portal's own report view in `index.html`,
and — found from the Bulk Print screenshot — **`admin.html`'s own renderer**
(`buildRC()`, used by both the "Preview Report" and "Bulk Print" tabs), which
had a `@media print` rule that made this actively worse by *force-setting*
`.rcsn, .rcsc, .rctw tfoot tr td { color:#fff !important; font-weight:800 }` —
guaranteeing invisible text the moment the background doesn't render.

**Fix**: every one of the three stylesheets now (a) asks the browser not to
desaturate colors it does print (`print-color-adjust: exact`), and more
importantly (b) gives every such bar a print-safe fallback — white/no
background, solid dark navy text, a border — so the report stays fully
legible on paper no matter what the printer/browser does with background
colors, and removed the rule that was forcing white text. Also darkened the
lighter grey label/body text used throughout the table and remarks section
for better contrast on lower-quality or black-and-white printers.

## Files touched (bugfix round)
- `Code.gs` — `batchUpdateRemarks`, `batchUpdateFeesBills`, `getStudentReport`,
  `updateStudent`, `executeAcademicRollover`, `activateAcademicTerm`,
  `executeAutomaticPromotions`, new `archiveOutgoingTermSnapshot()`
- `admin.html` — `saveAllRemarks()`, `saveFeesBills()`, `@media print` block
  (used by Preview Report and Bulk Print)
- `report.html` — `@media print` block
- `index.html` — `@media print` block

---

## Feature: admin-set report card colors (replaces the 3-template picker)

The Preview Report tab used to offer three fixed color presets ("Classic Navy",
"Royal Purple", "Forest Green"). That's been replaced with two color pickers —
**Header/Primary Color** and **Accent Color** — saved as
`Settings.REPORT_PRIMARY_COLOR` / `REPORT_ACCENT_COLOR` (defaults `#0d1b4b` /
`#f0c020`, i.e. the old "Classic Navy" look, so nothing changes for a school
that hasn't touched the picker). A change saves automatically and applies
everywhere a report card is rendered:
- `admin.html` — Preview Report and Bulk Print (`buildRC()`, via
  `deriveReportTheme(primary, accent)` — replaces `tplVars(templateNumber)`)
- `report.html` — the standalone report-card page parents/students open
- `index.html` — the student/parent portal's own report view

`report.html`/`index.html` apply the two colors as CSS custom properties
(`--rc-primary`, `--rc-accent`, plus a lighter shade of each for gradients,
computed in JS) on `<html>`, and the stylesheet's themed rules reference
`var(--rc-primary, #0d1b4b)` etc., so a page that hasn't loaded the settings
yet still renders with the original colors.

**Printed reports intentionally do NOT use the custom colors** — the
`@media print` fallback added in the previous round (dark navy text on white,
regardless of theme) stays pinned to a known-safe color rather than
inheriting whatever the admin picked, so a poorly-contrasting color choice
can never reproduce the original "faint print" bug. On-screen and PDF/print-
preview rendering (where backgrounds do show) does use the chosen colors.

Only the "structural" surfaces (header bar, title/sub strips, position/
aggregate bars, ID badge, table header, grade-key header, footer strip, and
their borders) are themed — this matches exactly what the old 3-preset system
actually varied; per-cell data colors (grade in red, total score in navy,
etc.) were never part of the template system and are unchanged.

Files touched: `Code.gs` (`populateSampleData` default settings),
`admin.html` (`buildRC()`, template picker UI → color picker UI, all
`REPORT_TEMPLATE` read/write sites), `report.html`, `index.html`.

---

## Promotion flow review ("promote students from one class to another")

Reviewed `executeAutomaticPromotions` (wired to the "Promote Students & Term
Rollover" button — the only promotion path the UI actually calls) and the
unused `executeAcademicRollover`. Two real gaps found and fixed:

1. **Nothing stopped running it twice against the same target.** Each run
   bumps every non-Repeated/Graduated/Withdrawn student up one class
   (Basic 4 → Basic 5, etc.). A double-click, a resubmitted request, or an
   admin re-running it "just to be sure" would silently promote everyone a
   *second* class (Basic 4 → Basic 6) with no warning. Fixed: the server now
   checks the school's active year/term before doing anything, and refuses
   with a clear message if the target already matches it (i.e. promotion for
   that period has almost certainly already run).
2. **The Target Year dropdown allowed picking the currently active year.**
   Since this action always bumps every student to their *next class*,
   targeting the year the school is already in would promote everyone a
   class level mid-year — never actually intended, only ever a misclick.
   Fixed: the current active year is now excluded from that dropdown.

Also confirmed as correct / not touched: `Repeated` students correctly stay
in their current class; `Graduated`/`Withdrawn` students correctly move to
`Graduated / Alumni` and `getNextClass()` correctly leaves them there on any
future run (no re-promotion of alumni); `PromotionStatus` is correctly reset
to blank for the new period on every student, including alumni. The unused
`executeAcademicRollover` was left in place (in case some other caller
depends on its admin-supplied class-name map) but is now commented to flag
that — unlike the function the UI actually uses — it does **not** sync
`Settings.CURRENT_YEAR`/`CURRENT_TERM` to the new period, so it shouldn't be
substituted for the "Promote Students & Term Rollover" button without also
fixing that.

**Known limitation, not changed:** class progression beyond JHS 3 only
recognizes `Basic N` and `JHS N` naming; a school also running Senior High
(SHS 1–3) classes would need that added to `getNextClass()` in `Code.gs`, or
those students will silently stay in place on promotion (no error, no
class-name match). Flagging this since it wasn't part of the reported
symptom and the sample data here only goes up to JHS, so I didn't want to
guess at SHS naming without confirming the school actually needs it.

Files touched: `Code.gs` (`executeAutomaticPromotions`), `admin.html`
(`openPromotionsModal()`).

`index.html`'s script content (other than `buildReportCard`/theme helpers)
and `admin.html`'s other tabs are unchanged.
