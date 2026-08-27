# Apps Script source

This folder holds the Google Apps Script source for the MySchool web app that the
root `index.html` embeds via iframe (`Code.gs` = server-side, `index.html` = the
React/DataTables front end served by `doGet`). It's kept here for version control;
deploying a change still means pasting the updated file(s) into the Apps Script
editor (Extensions → Apps Script) and re-publishing the web app deployment.
