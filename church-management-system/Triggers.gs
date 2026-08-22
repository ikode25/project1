/**
 * Triggers.gs
 * Entry points for installable time-driven triggers (installed by
 * Setup.installTriggers_). Kept thin — real logic lives in each module.
 */

function churchMsTrigger_dailyDigest() {
  try { runDailyNotifications_(); } catch (e) { logError_('churchMsTrigger_dailyDigest', e); }
}

function churchMsTrigger_processScheduledSms() {
  try { processScheduledSms_(); } catch (e) { logError_('churchMsTrigger_processScheduledSms', e); }
}

function churchMsTrigger_weeklyBackup() {
  try { runScheduledBackup_(); } catch (e) { logError_('churchMsTrigger_weeklyBackup', e); }
}

/** Optional simple guardrail: block edits to AuditLog/Errors made directly in the Sheet UI (defense in depth only). */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var name = e.range.getSheet().getName();
    if (name === SHEETS.AUDIT_LOG || name === SHEETS.ERRORS) {
      SpreadsheetApp.getActiveSpreadsheet().toast('This sheet is system-managed. Manual edits are not recommended.', 'Warning');
    }
  } catch (err) {
    // onEdit must never throw
  }
}
