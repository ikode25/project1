/**
 * Settings.gs
 * Org settings, SMS provider configuration, scheduled backups, and
 * archive/retention purge routines. All mutation is SuperAdmin/Admin only.
 */

var PUBLIC_SETTING_KEYS = ['OrgName', 'OrgLogoFileId', 'ThemeMode', 'AbsenceThresholdWeeks', 'CheckInWindowMinutes'];

function getSettings() {
  return safeCall_('getSettings', function () {
    requireRole_('settings', 'view');
    var all = getAllSettings_();
    // Mask secrets in the UI; SettingsView shows a "configured / not configured" pill instead of the raw value.
    var masked = Object.assign({}, all);
    ['Sms_Arkesel_ApiKey', 'Sms_Hubtel_ClientSecret', 'Sms_Custom_ApiKey'].forEach(function (k) {
      masked[k] = all[k] ? '••••••••' : '';
      masked[k + '_configured'] = !!all[k];
    });
    return masked;
  });
}

function saveSettings(values) {
  return safeCall_('saveSettings', function () {
    requireRole_('settings', 'mutate');
    Object.keys(values).forEach(function (key) {
      var val = values[key];
      // don't overwrite a real secret with the masked placeholder the UI echoes back
      if (typeof val === 'string' && val.indexOf('••') !== -1) return;
      setSetting_(key, val);
    });
    logAudit_('UPDATE', 'Settings', '', 'Updated settings: ' + Object.keys(values).join(', '));
    return { ok: true };
  });
}

/** Duplicates the spreadsheet into the configured Drive backup folder. Runs weekly via trigger, or on demand. */
function runScheduledBackup_() {
  var folderId = getSetting_('BackupFolderId', '');
  var db = getDb_();
  var folder;
  if (folderId) {
    try { folder = DriveApp.getFolderById(folderId); } catch (e) { folder = null; }
  }
  if (!folder) {
    folder = DriveApp.createFolder(APP_NAME + ' Backups');
    setSetting_('BackupFolderId', folder.getId());
  }
  var name = APP_NAME + ' Backup — ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  var file = DriveApp.getFileById(db.getId()).makeCopy(name, folder);
  logAudit_('CREATE', 'Backup', file.getId(), 'Scheduled backup created: ' + name);
  return { fileId: file.getId(), url: file.getUrl() };
}

function runBackupNow() {
  return safeCall_('runBackupNow', function () {
    requireSuperAdmin_();
    return runScheduledBackup_();
  });
}

/** Archives (tags) records older than RetentionYears in a given sheet by appending an Archived marker; never hard-deletes. */
function archiveOldRecords(sheetKey, dateField) {
  return safeCall_('archiveOldRecords', function () {
    requireSuperAdmin_();
    var name = SHEETS[sheetKey];
    if (!name) throw new Error('Unknown sheet.');
    var years = Number(getSetting_('RetentionYears', '7')) || 7;
    var cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - years);
    var rows = readAll_(name).filter(function (r) { return r[dateField] && new Date(r[dateField]) < cutoff; });
    logAudit_('UPDATE', name, '', 'Flagged ' + rows.length + ' record(s) older than ' + years + ' years for archival review.');
    return { eligible: rows.length, cutoff: cutoff.toISOString() };
  });
}
