// ============================================================
// ONE-TIME MIGRATION: copies data from the old Google Sheet
// ("Fees Database" / whatever your original spreadsheet is
// called) into the new Firebase Realtime Database.
//
// HOW TO USE:
//  1. Open the OLD spreadsheet that the original Code.gs used.
//  2. Extensions → Apps Script. Make sure the OLD Code.gs is
//     still the one bound here (don't paste the new Code.gs into
//     this project — this migration needs the OLD sheet-reading
//     functions like getOrCreateSheet, SHEET_PREFIX, etc. still
//     present).
//  3. Add a new script file, paste this whole file in.
//  4. Firebase rules must temporarily allow writes (the default
//     firebase-rules.json here already does).
//  5. Run migrateToFirebase() once from the Apps Script editor
//     (Run ▸ Run function ▸ migrateToFirebase). Authorize when
//     prompted. Check the execution log for a summary.
//  6. Open the app's index.html and confirm your students, fees,
//     and settings all show up correctly.
// ============================================================

const MIGRATE_DB_URL = "https://fees-1f58a-default-rtdb.firebaseio.com";
const MIGRATE_FIREBASE_API_KEY = "AIzaSyC_W__0g7E0Lg1qDKM9CNHn_dS6_K7l26A"; // public web API key

// Database writes require "auth != null" (see firebase-rules.json), so this
// signs in anonymously first and attaches the token to the import request.
// Make sure Anonymous sign-in is enabled: Firebase console -> Authentication
// -> Sign-in method -> Anonymous -> Enable.
function migrateGetFirebaseIdToken() {
  const resp = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + MIGRATE_FIREBASE_API_KEY,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ returnSecureToken: true }), muteHttpExceptions: true }
  );
  const data = JSON.parse(resp.getContentText());
  if (!data.idToken) throw new Error('Could not sign in to Firebase — is Anonymous sign-in enabled? Response: ' + resp.getContentText());
  return data.idToken;
}

function migrateToFirebase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = {};

  // Settings (flat key/value — skip the two secret keys, those stay in
  // this Apps Script project's Properties and get picked up automatically
  // by the new Code.gs bridge)
  out.settings = {};
  const settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet) {
    const data = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) out.settings[data[i][0]] = data[i][1];
    }
  }

  // Fee components
  out.feeComponents = {};
  const compSheet = ss.getSheetByName('Fee Components');
  if (compSheet) {
    const data = compSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const id = String(data[i][0]).trim();
      out.feeComponents[id] = { id: id, name: data[i][1], defaultAmount: parseFloat(data[i][2]) || 0,
        isActive: String(data[i][3]).toUpperCase() === 'TRUE', isForNewStudentsOnly: String(data[i][4]).toUpperCase() === 'TRUE', order: parseInt(data[i][5]) || i };
    }
  }

  // Classes
  const classSheet = ss.getSheetByName('Classes');
  out.classes = [];
  if (classSheet) {
    const data = classSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) { if (data[i][0]) out.classes.push(String(data[i][0]).trim()); }
  }

  // Users
  out.users = {};
  const usersSheet = ss.getSheetByName('Users');
  if (usersSheet) {
    const data = usersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (!data[i][1] && !data[i][0]) continue;
      out.users['u' + i] = { email: data[i][0] || '', name: data[i][1] || '', password: data[i][2] || '', role: data[i][3] || '', lastLogin: data[i][4] || '' };
    }
  }

  // Students per term
  out.students = {};
  ['First Term', 'Second Term', 'Third Term'].forEach(function (term) {
    const sheet = ss.getSheetByName('Fees Database - ' + term);
    out.students[term] = {};
    if (!sheet || sheet.getLastRow() < 2) return;
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(function (h) { return String(h).trim(); });
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const rec = {};
      headers.forEach(function (h, idx) {
        const val = data[i][idx];
        rec[h] = val instanceof Date ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd') : val;
      });
      const key = String(rec.id).trim().replace(/[.#$\[\]\/]/g, '_');
      out.students[term][key] = rec;
    }
  });

  // Generic "array of rows, each becomes its own pushed entry" sheets
  function dumpSheet(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    const result = {};
    if (!sheet || sheet.getLastRow() < 2) return result;
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(function (h) { return String(h).trim(); });
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const rec = {};
      headers.forEach(function (h, idx) {
        const val = data[i][idx];
        rec[h] = val instanceof Date ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd') : val;
      });
      result['r' + i] = rec;
    }
    return result;
  }

  out.customFeeRecords = dumpSheet('Custom Fee Records');
  out.paymentNotifications = dumpSheet('Payment Notifications');
  out.messages = dumpSheet('Messages');
  out.staffChats = dumpSheet('Staff Chats');
  out.smsHistory = dumpSheet('SMS History');
  out.activityLog = dumpSheet('Activity Log');
  out.auditTrail = dumpSheet('Audit Trail');
  out.incomeExpenses = dumpSheet('Income & Expenses');
  out.promotionHistory = dumpSheet('Promotion History');
  out.discountHistory = dumpSheet('Discount History');
  out.uniformSales = dumpSheet('Uniform Sales');
  out.bookConfig = dumpSheet('Book Config');
  out.bookSales = dumpSheet('Book Sales');
  out.classFeeRates = dumpSheet('Class Fee Rates');

  // Push the whole tree in one shot. PUT at root REPLACES everything —
  // only run this once, against an empty/fresh database.
  const idToken = migrateGetFirebaseIdToken();
  const resp = UrlFetchApp.fetch(MIGRATE_DB_URL + '/.json?auth=' + encodeURIComponent(idToken), {
    method: 'put', contentType: 'application/json', payload: JSON.stringify(out), muteHttpExceptions: true
  });

  const studentCounts = Object.keys(out.students).map(function (t) { return t + ': ' + Object.keys(out.students[t]).length; }).join(', ');
  Logger.log('Migration response code: ' + resp.getResponseCode());
  Logger.log('Students migrated — ' + studentCounts);
  Logger.log('Users: ' + Object.keys(out.users).length + ', Fee components: ' + Object.keys(out.feeComponents).length + ', Classes: ' + out.classes.length);
  if (resp.getResponseCode() !== 200) {
    Logger.log('Migration FAILED. Response body: ' + resp.getContentText());
  } else {
    Logger.log('Migration complete. Open the app and verify your data.');
  }
}
