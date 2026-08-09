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

**Fix**: each archived field now only overrides the live value when the
archive actually has something non-empty in it. An incomplete/stale archive
snapshot can no longer blank out real data. This fix alone should make
already-entered remarks reappear on report cards immediately after
redeploying — no re-entering of data required, since the correct values were
sitting on the Students sheet the whole time.

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

### 4. Printed report cards — text too faint to read

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
- `Code.gs` — `batchUpdateRemarks`, `batchUpdateFeesBills`, `getStudentReport`, `updateStudent`
- `admin.html` — `saveAllRemarks()`, `saveFeesBills()`
- `report.html` — `@media print` block
- `index.html` — `@media print` block

`index.html`'s script content and `admin.html`'s other tabs are unchanged.
