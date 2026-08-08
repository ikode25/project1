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

### 2. Printed report cards — text too faint to read

**Root cause** (`report.html` and the duplicate report-card renderer in
`index.html`): several bars on the report card (school name banner, "End of
Term Examinations" strip, position/aggregate bars, grade-key header, grand
total row) use light/white text on a dark navy or gold background — an
on-screen-only design choice. Browsers commonly print with **background
colors turned off by default** (and some printers/toner-saving modes fade
them further even when on); when that happens, that light text sits directly
on white paper and is unreadable — the report doesn't just look "faint," the
text is effectively gone.

**Fix**: added a print-only stylesheet that (a) asks the browser not to
desaturate colors it does print (`print-color-adjust: exact`), and more
importantly (b) gives every such bar a print-safe fallback — white background,
solid dark navy text, a border — so the report stays fully legible on paper
no matter what the printer/browser does with background colors. Also darkened
the lighter grey label/body text used throughout the table and remarks
section for better contrast on lower-quality printers. This was fixed in both
`report.html` (the standalone report-card page) and `index.html` (the
student/parent portal's own report-card print view), since both had their own
copy of the same CSS.

## Files touched
- `Code.gs` — `batchUpdateRemarks`, `batchUpdateFeesBills`
- `admin.html` — `saveAllRemarks()`, `saveFeesBills()`
- `report.html` — `@media print` block
- `index.html` — `@media print` block

`index.html`'s script content and `admin.html`'s other tabs are unchanged.
