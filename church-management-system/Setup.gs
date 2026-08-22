/**
 * Setup.gs
 * One-time (and safely re-runnable) bootstrap: creates the backing
 * spreadsheet, all tabs with header rows + data validation, seeds Settings
 * and the first SuperAdmin user, and installs time-driven triggers.
 *
 * Run `runInitialSetup` once from the Apps Script editor (select it in the
 * function dropdown and click Run) before deploying the web app.
 */

function runInitialSetup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_SPREADSHEET_ID);
  var ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(APP_NAME + ' Database');
    props.setProperty(PROP_SPREADSHEET_ID, ss.getId());
  }

  Object.keys(SCHEMA).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    var headers = SCHEMA[name];
    var existing = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
    var needsHeaders = headers.some(function (h, i) { return existing[i] !== h; });
    if (needsHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0b3d2e').setFontColor('#ffffff');
    }
  });

  // Drop the default "Sheet1" if it's empty and unused
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

  applyDataValidation_(ss);
  seedSettings_();
  seedSuperAdmin_();
  ensureAttachmentsFolder_();
  installTriggers_();

  return { spreadsheet: ss, url: ss.getUrl() };
}

function applyDataValidation_(ss) {
  dv_(ss, SHEETS.MEMBERS, 'Gender', OPTIONS.GENDER);
  dv_(ss, SHEETS.MEMBERS, 'MaritalStatus', OPTIONS.MARITAL_STATUS);
  dv_(ss, SHEETS.MEMBERS, 'MembershipStatus', OPTIONS.MEMBERSHIP_STATUS);
  dv_(ss, SHEETS.VISITORS, 'FollowUpStatus', OPTIONS.FOLLOW_UP_STATUS);
  dv_(ss, SHEETS.ATTENDANCE, 'ServiceType', OPTIONS.SERVICE_TYPE);
  dv_(ss, SHEETS.ATTENDANCE, 'CheckInMethod', OPTIONS.CHECKIN_METHOD);
  dv_(ss, SHEETS.FINANCE, 'Type', OPTIONS.FINANCE_TYPE);
  dv_(ss, SHEETS.FINANCE, 'PaymentMethod', OPTIONS.PAYMENT_METHOD);
  dv_(ss, SHEETS.PLEDGES, 'Status', OPTIONS.PLEDGE_STATUS);
  dv_(ss, SHEETS.EXPENSES, 'Status', OPTIONS.EXPENSE_STATUS);
  dv_(ss, SHEETS.EQUIPMENT, 'Status', OPTIONS.EQUIPMENT_STATUS);
  dv_(ss, SHEETS.EQUIPMENT, 'Condition', OPTIONS.EQUIPMENT_CONDITION);
  dv_(ss, SHEETS.PRAYER_REQUESTS, 'Visibility', OPTIONS.PRAYER_VISIBILITY);
  dv_(ss, SHEETS.PRAYER_REQUESTS, 'Status', OPTIONS.PRAYER_STATUS);
  dv_(ss, SHEETS.SMS_LOG, 'Status', OPTIONS.SMS_STATUS);
  dv_(ss, SHEETS.CLUSTERS, 'Status', OPTIONS.CLUSTER_STATUS);
  dv_(ss, SHEETS.CLUSTER_FOLLOWUPS, 'Type', OPTIONS.FOLLOWUP_TYPE);
  dv_(ss, SHEETS.USERS, 'Role', ALL_ROLES);
}

function dv_(ss, sheetName, headerName, options) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var headers = SCHEMA[sheetName];
  var col = headers.indexOf(headerName) + 1;
  if (col < 1) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(options, true).setAllowInvalid(true).build();
  sheet.getRange(2, col, Math.max(sheet.getMaxRows() - 1, 1000), 1).setDataValidation(rule);
}

function seedSettings_() {
  var existing = readAll_(SHEETS.SETTINGS);
  var existingKeys = existing.map(function (r) { return r.Key; });
  DEFAULT_SETTINGS.forEach(function (row) {
    if (existingKeys.indexOf(row[0]) === -1) {
      getSheet_(SHEETS.SETTINGS).appendRow(row);
    }
  });
}

function seedSuperAdmin_() {
  var users = readAll_(SHEETS.USERS);
  if (users.length > 0) return;
  var email = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();
  if (!email) return;
  insertRow_(SHEETS.USERS, {
    Email: email.toLowerCase(),
    FullName: 'System Administrator',
    Role: ROLES.SUPER_ADMIN,
    Active: 'TRUE',
    Phone: '',
    CreatedAt: nowIso_()
  }, ID_PREFIX.USERS);
}

function ensureAttachmentsFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_ATTACHMENTS_FOLDER_ID);
  if (id) {
    try { DriveApp.getFolderById(id); return id; } catch (e) { /* recreate */ }
  }
  var folder = DriveApp.createFolder(APP_NAME + ' Attachments');
  props.setProperty(PROP_ATTACHMENTS_FOLDER_ID, folder.getId());
  return folder.getId();
}

function installTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction().indexOf('churchMsTrigger_') === 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('churchMsTrigger_dailyDigest').timeBased().everyDays(1).atHour(6).create();
  ScriptApp.newTrigger('churchMsTrigger_processScheduledSms').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('churchMsTrigger_weeklyBackup').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(23).create();
}
