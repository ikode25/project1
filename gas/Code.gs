/**
 * TENANCY AGREEMENT PORTAL — Google Apps Script backend
 * ------------------------------------------------------
 * Same blueprint as the School Management System this project was modelled on:
 *   Google Sheet as the database + Apps Script (google.script.run) as the API
 *   + a single HtmlService page as the whole front end, with a tokenised
 *   "public" URL mode for people who don't have (and shouldn't need) a login.
 *
 * Flow this implements:
 *   0. The deployed web app URL opens straight into a public Tenancy
 *      Application Form (no login) — exactly like a job application page.
 *      A small lock icon in the corner is the landlord's way in.
 *   1. Landlord logs in (admin, via that icon) and reviews inbound
 *      applications, or starts an agreement from scratch (property, tenant,
 *      rent, deposit, dates, bank details).
 *   2. Landlord sends the tenant a unique link (email + copy-link).
 *   3. Tenant opens the link — no account needed — reads the full agreement,
 *      must scroll through the Terms & Conditions before they can accept,
 *      reviews a summary, signs (typed signature) and submits.
 *   4. A PDF is generated, emailed to both parties, and offered for download.
 *   5. Landlord's dashboard tracks every application and agreement, and its
 *      status.
 *   6. A daily trigger (and a manual button) reminds tenants whose tenancy is
 *      coming up for renewal, and lets the tenant tell the landlord whether
 *      they want to renew.
 *
 * SETUP (see README.md for the full walkthrough):
 *   1. Create a blank Google Sheet, Extensions > Apps Script.
 *   2. Paste this file as Code.gs and Index.html as Index.html.
 *   3. Run `setup` once (Apps Script editor toolbar) to build the sheets.
 *   4. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 *   5. Run `installDailyReminderTrigger` once to turn on renewal reminders.
 *   6. Log in with admin / admin123 and change the password immediately.
 */

// ============== Sheet names & headers ==============
var USERS_SHEET = 'Users';
var SETTINGS_SHEET = 'Settings';
var AGREEMENTS_SHEET = 'Agreements';
var LOGS_SHEET = 'Logs';

var USER_HEADERS = ['ID', 'Username', 'Password', 'FullName', 'Email', 'Phone', 'Role', 'Status', 'IsDeleted', 'CreatedAt', 'UpdatedAt', 'LastLogin'];

var SETTINGS_HEADERS = [
  'ID', 'LandlordName', 'LandlordAddress', 'LandlordPhone', 'LandlordEmail',
  'BankName', 'BankAccountName', 'BankAccountNumber', 'BankBranch',
  'Currency', 'DefaultTermValue', 'DefaultTermUnit', 'DefaultNoticePeriodMonths',
  'ReminderLeadDays', 'TermsTemplate', 'PublicAppBaseURL', 'UpdatedAt'
];

// Wide row, one per agreement — mirrors how the school blueprint keeps one
// entity per sheet with every field as its own column so it's readable
// straight out of the Sheet, no joins needed for the common case.
var AGREEMENT_HEADERS = [
  /*0*/ 'ID', /*1*/ 'Token', /*2*/ 'Status',
  /*3*/ 'LandlordName', /*4*/ 'LandlordAddress', /*5*/ 'LandlordPhone', /*6*/ 'LandlordEmail',
  /*7*/ 'BankName', /*8*/ 'BankAccountName', /*9*/ 'BankAccountNumber', /*10*/ 'BankBranch',
  /*11*/ 'TenantName', /*12*/ 'TenantEmail', /*13*/ 'TenantPhone', /*14*/ 'TenantAddress',
  /*15*/ 'PremisesDescription', /*16*/ 'PremisesAddress', /*17*/ 'Region',
  /*18*/ 'StartDate', /*19*/ 'TermValue', /*20*/ 'TermUnit', /*21*/ 'EndDate',
  /*22*/ 'Currency', /*23*/ 'MonthlyRent', /*24*/ 'RentAdvanceMonths', /*25*/ 'RentAdvanceAmount', /*26*/ 'RentAdvanceInWords',
  /*27*/ 'RetentionDeposit', /*28*/ 'NoticePeriodMonths',
  /*29*/ 'LandlordWitnessName', /*30*/ 'TenantWitnessName',
  /*31*/ 'TermsSnapshot',
  /*32*/ 'CreatedBy', /*33*/ 'CreatedAt', /*34*/ 'UpdatedAt',
  /*35*/ 'SentAt', /*36*/ 'ExpiresAt', /*37*/ 'ViewedAt', /*38*/ 'AcceptedAt',
  /*39*/ 'TenantSignatureName', /*40*/ 'TenantSignatureIP',
  /*41*/ 'DeclinedAt', /*42*/ 'DeclineReason',
  /*43*/ 'PdfFileId', /*44*/ 'PdfUrl',
  /*45*/ 'RenewalOfId', /*46*/ 'RenewedToId', /*47*/ 'RenewalReminderLeadDaysSent',
  /*48*/ 'RenewalResponse', /*49*/ 'RenewalRespondedAt',
  /*50*/ 'IsDeleted', /*51*/ 'Notes'
];
var COL = {}; // name -> 0-based index, built once below
(function buildColMap() { for (var i = 0; i < AGREEMENT_HEADERS.length; i++) COL[AGREEMENT_HEADERS[i]] = i; })();

var LOG_HEADERS = ['Timestamp', 'User', 'Action', 'Details'];

var HEADER_BG = '#0f3d3e'; // deep teal — matches the landlord-portal theme in Index.html
var DEFAULT_REMINDER_LEAD_DAYS = '60,30,7';

var DEFAULT_TERMS_TEMPLATE = [
  'a) To pay the rent in the manner set out in this agreement.',
  'b) To pay all charges for electricity and water supplied to the premises, and for garbage and septic tank clearance from the premises.',
  'c) To keep the premises, including its fixtures and fittings, in good condition.',
  'd) Not to do, or allow to be done, anything in or upon the premises that may be a nuisance, damage, inconvenience or annoyance to the Landlord/Landlady or to occupants of any adjoining premises.',
  'e) Not to assign, sublet or part with possession of the premises or any part of it without the written consent of the Landlord/Landlady.',
  'f) To permit the Landlord/Landlady or their agents, at all reasonable times, to enter the premises to examine its state and condition.',
  'g) To inform the Landlord/Landlady in writing at least {{NoticePeriodMonths}} month(s) ahead if the Tenant does not wish to continue occupying the property.',
  '',
  'The Landlord/Landlady agrees with the Tenant as follows:',
  '• To bear, pay and discharge all rates, taxes, assessments, impositions and outgoings whatsoever which now are, or which at any time hereafter may be, assessed, charged or imposed upon the premises.',
  '• To allow the Tenant to fully and peaceably enjoy the use of the premises as agreed in this document.',
  '• Not to unlawfully withdraw from this agreement once the Tenant has taken up occupancy of the premises.',
  '',
  'Provided always, and it is expressly agreed, that if the rent (or any part of it) is in arrears for three (3) months, or if the Tenant breaches any of the covenants in this agreement, it shall be lawful for the Landlord/Landlady to re-enter the premises, and this agreement shall be deemed terminated on such re-entry.',
  '',
  'Any notice required to be given by either party shall be in writing and shall be deemed duly given when delivered by hand, mail or registered post to the address given by that party in this agreement.',
  '',
  'By signing below, the Tenant confirms that they have read, understood and agree to be bound by every term of this Tenancy Agreement.'
].join('\n');

// ============== Web app entry point ==============
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Tenancy Agreement Portal')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============== Small shared helpers ==============
var _activeSpreadsheetHandle = null;
function getSheet(name) {
  if (!_activeSpreadsheetHandle) _activeSpreadsheetHandle = SpreadsheetApp.getActiveSpreadsheet();
  return _activeSpreadsheetHandle.getSheetByName(name);
}
function nowIso() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function isAdmin(role) { return role && String(role).toLowerCase() === 'admin'; }
function toIso(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString();
  if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v);
  var d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toISOString();
}
function nextRowId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}
function addLog(user, action, details) {
  try {
    var sh = getSheet(LOGS_SHEET);
    if (!sh) return;
    sh.appendRow([nowIso(), user, action, details]);
  } catch (e) {
    Logger.log('Log error: ' + e.toString());
  }
}

// the real public-facing /exec URL — see the school blueprint's identical helper.
// Apps Script web apps render inside a sandboxed googleusercontent.com iframe, so the
// browser's own window.location never reflects the real deployment URL — only this does.
function _webAppBaseUrl() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}
function _resolvePublicBaseUrl(savedOverride) {
  var live = _webAppBaseUrl();
  var saved = String(savedOverride || '').trim();
  if (!saved) return live;
  var looksLikeAppsScriptUrl = /^https?:\/\/script\.google\.com\/macros\//i.test(saved);
  if (looksLikeAppsScriptUrl && saved.replace(/\/+$/, '') !== live.replace(/\/+$/, '')) return live; // stale override — self-heal
  return saved;
}
function _publicLink(queryString) {
  var s = getSettingsRow();
  var base = _resolvePublicBaseUrl(s ? s[COLS_SETTINGS.PublicAppBaseURL] : '');
  return String(base || '').replace(/\/+$/, '') + queryString;
}
var COLS_SETTINGS = {}; // name -> index for the Settings row
(function buildSettingsColMap() { for (var i = 0; i < SETTINGS_HEADERS.length; i++) COLS_SETTINGS[SETTINGS_HEADERS[i]] = i; })();

function addMonths(date, months) {
  var d = new Date(date.getTime());
  var day = d.getDate();
  d.setMonth(d.getMonth() + months);
  // handle month-length overflow (e.g. Jan 31 + 1 month should not become Mar 3)
  if (d.getDate() < day) d.setDate(0);
  return d;
}
function computeEndDate(startIso, termValue, termUnit) {
  var start = new Date(startIso);
  var months = (String(termUnit).toLowerCase() === 'years') ? termValue * 12 : termValue;
  var end = addMonths(start, months);
  end.setDate(end.getDate() - 1); // inclusive end-of-term, e.g. 1-year lease from Jan 1 ends Dec 31
  return end.toISOString().split('T')[0];
}
function daysBetween(aIso, bIso) {
  var a = new Date(String(aIso).split('T')[0]), b = new Date(String(bIso).split('T')[0]);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// ---- number to words, for the "Rent Advance In Words" line on the printed agreement ----
var _ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
var _TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
function _threeDigitsToWords(n) {
  var s = '';
  if (n >= 100) { s += _ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) s += ' '; }
  if (n >= 20) { s += _TENS[Math.floor(n / 10)]; if (n % 10) s += '-' + _ONES[n % 10]; }
  else if (n > 0) { s += _ONES[n]; }
  return s;
}
function numberToWords(num) {
  num = Math.round(Math.abs(Number(num) || 0));
  if (num === 0) return 'Zero';
  var units = ['', ' Thousand', ' Million', ' Billion'];
  var parts = [];
  var i = 0;
  while (num > 0) {
    var chunk = num % 1000;
    if (chunk) parts.unshift(_threeDigitsToWords(chunk) + units[i]);
    num = Math.floor(num / 1000);
    i++;
  }
  return parts.join(' ');
}
function amountToWords(amount, currencyName) {
  var whole = Math.floor(Number(amount) || 0);
  var words = numberToWords(whole) + ' ' + (currencyName || 'Ghana Cedis');
  return words + ' only';
}

// ============== One-time setup (run from the Apps Script editor) ==============
function setup() { return initializeSheets(); }

function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var us = ss.getSheetByName(USERS_SHEET);
  if (!us) {
    us = ss.insertSheet(USERS_SHEET);
    us.appendRow(USER_HEADERS);
    us.getRange(1, 1, 1, USER_HEADERS.length).setBackground(HEADER_BG).setFontColor('white').setFontWeight('bold');
    us.setFrozenRows(1);
    var ts = nowIso(), today = todayStr();
    // default admin — CHANGE THIS PASSWORD after your first login.
    us.appendRow([1, 'admin', 'admin123', 'Property Administrator', 'admin@example.com', '', 'admin', 'active', '0', ts, ts, '']);
  }

  var st = ss.getSheetByName(SETTINGS_SHEET);
  if (!st) {
    st = ss.insertSheet(SETTINGS_SHEET);
    st.appendRow(SETTINGS_HEADERS);
    st.getRange(1, 1, 1, SETTINGS_HEADERS.length).setBackground(HEADER_BG).setFontColor('white').setFontWeight('bold');
    st.setFrozenRows(1);
    st.appendRow([
      1, 'Your Name / Company', '', '', '',
      '', '', '', '',
      'GH₵', 1, 'years', 3,
      DEFAULT_REMINDER_LEAD_DAYS, DEFAULT_TERMS_TEMPLATE, '', nowIso()
    ]);
  }

  var ag = ss.getSheetByName(AGREEMENTS_SHEET);
  if (!ag) {
    ag = ss.insertSheet(AGREEMENTS_SHEET);
    ag.appendRow(AGREEMENT_HEADERS);
    ag.getRange(1, 1, 1, AGREEMENT_HEADERS.length).setBackground(HEADER_BG).setFontColor('white').setFontWeight('bold');
    ag.setFrozenRows(1);
  }

  var lg = ss.getSheetByName(LOGS_SHEET);
  if (!lg) {
    lg = ss.insertSheet(LOGS_SHEET);
    lg.appendRow(LOG_HEADERS);
    lg.getRange(1, 1, 1, LOG_HEADERS.length).setBackground(HEADER_BG).setFontColor('white').setFontWeight('bold');
    lg.setFrozenRows(1);
  }

  return 'Sheets ready. Log in with admin / admin123 and change the password from Settings right away.';
}

// recovery — run manually from the Apps Script editor (Run > resetAdminPassword) if the
// admin password is lost. No UI access required.
function resetAdminPassword() {
  var sh = getSheet(USERS_SHEET);
  if (!sh) throw new Error('Users sheet not found — run setup first');
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() !== 'admin') continue;
    sh.getRange(i + 1, 3).setValue('admin123');
    sh.getRange(i + 1, 8).setValue('active');
    sh.getRange(i + 1, 9).setValue('0');
    sh.getRange(i + 1, 11).setValue(nowIso());
    return 'admin password reset to admin123';
  }
  var ts = nowIso();
  sh.appendRow([nextRowId(sh), 'admin', 'admin123', 'Property Administrator', 'admin@example.com', '', 'admin', 'active', '0', ts, ts, '']);
  return 'admin user created with admin / admin123';
}

// adds a menu to the bound spreadsheet so a non-technical landlord can set things up
// without opening the Apps Script editor beyond the first paste.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏠 Tenancy Portal')
    .addItem('Initialize / repair sheets', 'setup')
    .addItem('Install daily renewal-reminder trigger', 'installDailyReminderTrigger')
    .addItem('Reset admin password', 'resetAdminPassword')
    .addItem('Open web app URL', 'showWebAppUrl')
    .addToUi();
}
function showWebAppUrl() {
  var url = _webAppBaseUrl();
  SpreadsheetApp.getUi().alert(url ? ('Web app URL:\n' + url) : 'Deploy this project as a web app first (Deploy > New deployment).');
}

// ============== Auth ==============
function authenticateUser(username, password) {
  try {
    if (!username || !password) return { success: false, message: 'Username and password required' };
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Not set up yet — run setup() from the Apps Script editor' };
    var data = sh.getDataRange().getValues();
    var key = String(username).trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (String(row[1]).trim().toLowerCase() !== key) continue;
      if (String(row[8]) === '1') { addLog(username, 'Login Failed', 'Account deleted'); return { success: false, message: 'Account no longer exists' }; }
      if (String(row[7]).toLowerCase() !== 'active') { addLog(username, 'Login Failed', 'Status: ' + row[7]); return { success: false, message: 'Account is ' + row[7] }; }
      if (String(password) !== String(row[2])) { addLog(username, 'Login Failed', 'Invalid password'); return { success: false, message: 'Invalid username or password' }; }
      sh.getRange(i + 1, 12).setValue(nowIso());
      addLog(username, 'Login Success', 'Landlord logged in');
      return { success: true, user: { id: row[0], username: row[1], fullName: row[3], email: row[4], phone: row[5], role: row[6] } };
    }
    addLog(username, 'Login Failed', 'No such user');
    return { success: false, message: 'Invalid username or password' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function changePassword(username, currentRole, oldPassword, newPassword) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden' };
    if (!newPassword || String(newPassword).length < 6) return { success: false, message: 'New password must be at least 6 characters' };
    var sh = getSheet(USERS_SHEET);
    var data = sh.getDataRange().getValues();
    var key = String(username).trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() !== key) continue;
      if (String(data[i][2]) !== String(oldPassword)) return { success: false, message: 'Current password is incorrect' };
      sh.getRange(i + 1, 3).setValue(String(newPassword));
      sh.getRange(i + 1, 11).setValue(nowIso());
      addLog(username, 'Password Changed', '');
      return { success: true, message: 'Password updated' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Settings ==============
function getSettingsRow() {
  var sh = getSheet(SETTINGS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  return data.length > 1 ? data[1] : null;
}
function rowToSettings(row) {
  if (!row) return null;
  var o = {};
  for (var i = 0; i < SETTINGS_HEADERS.length; i++) o[SETTINGS_HEADERS[i]] = row[i];
  return o;
}
function getSettings(currentUser, currentRole) {
  try {
    var row = getSettingsRow();
    if (!row) return { success: false, message: 'Not set up yet' };
    return { success: true, data: rowToSettings(row) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}
function updateSettings(settings, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(SETTINGS_SHEET);
    var editable = ['LandlordName', 'LandlordAddress', 'LandlordPhone', 'LandlordEmail', 'BankName', 'BankAccountName',
      'BankAccountNumber', 'BankBranch', 'Currency', 'DefaultTermValue', 'DefaultTermUnit', 'DefaultNoticePeriodMonths',
      'ReminderLeadDays', 'TermsTemplate', 'PublicAppBaseURL'];
    editable.forEach(function (key) {
      if (settings.hasOwnProperty(key)) sh.getRange(2, COLS_SETTINGS[key] + 1).setValue(settings[key]);
    });
    sh.getRange(2, COLS_SETTINGS.UpdatedAt + 1).setValue(nowIso());
    addLog(currentUser, 'Settings Updated', Object.keys(settings).join(', '));
    return { success: true, message: 'Settings saved' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Agreements: row <-> object mapping ==============
function rowToAgreement(row) {
  var o = {};
  for (var i = 0; i < AGREEMENT_HEADERS.length; i++) o[AGREEMENT_HEADERS[i]] = row[i];
  o.DaysToEnd = o.EndDate ? daysBetween(todayStr(), o.EndDate) : null;
  o.EffectiveStatus = computeEffectiveStatus(o);
  return o;
}
function computeEffectiveStatus(o) {
  var s = String(o.Status || '').toLowerCase();
  if ((s === 'sent' || s === 'viewed') && o.ExpiresAt && new Date(o.ExpiresAt) < new Date()) return 'expired';
  return s;
}
function findAgreementRowIndexById(sh, id) {
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (parseInt(data[i][0], 10) === parseInt(id, 10)) return i; // 0-based data index
  return -1;
}
function findAgreementRowIndexByToken(sh, token) {
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) if (String(data[i][COL.Token]) === String(token)) return i;
  return -1;
}

// ============== Admin: CRUD ==============
function getAllAgreements(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues();
    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][COL.IsDeleted]) === '1') continue;
      out.push(rowToAgreement(data[i]));
    }
    out.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function getAgreementById(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    return { success: true, data: rowToAgreement(row) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function _requiredAgreementFields() {
  return ['TenantName', 'TenantEmail', 'PremisesDescription', 'PremisesAddress', 'StartDate', 'TermValue', 'TermUnit', 'MonthlyRent'];
}

function createAgreement(payload, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var missing = _requiredAgreementFields().filter(function (k) { return payload[k] === undefined || payload[k] === null || payload[k] === ''; });
    if (missing.length) return { success: false, message: 'Missing required field(s): ' + missing.join(', ') };

    var settings = rowToSettings(getSettingsRow()) || {};
    var sh = getSheet(AGREEMENTS_SHEET);
    var id = nextRowId(sh);
    var token = Utilities.getUuid().replace(/-/g, '');
    var ts = nowIso();
    var endDate = computeEndDate(payload.StartDate, Number(payload.TermValue), payload.TermUnit);
    var currency = payload.Currency || settings.Currency || 'GH₵';
    var rentAdvanceAmount = payload.RentAdvanceAmount || (Number(payload.MonthlyRent) * Number(payload.RentAdvanceMonths || payload.TermValue || 1));
    var rentAdvanceWords = payload.RentAdvanceInWords || amountToWords(rentAdvanceAmount, currency === 'GH₵' ? 'Ghana Cedis' : currency);

    var row = [];
    row[COL.ID] = id;
    row[COL.Token] = token;
    row[COL.Status] = 'draft';
    row[COL.LandlordName] = payload.LandlordName || settings.LandlordName || '';
    row[COL.LandlordAddress] = payload.LandlordAddress || settings.LandlordAddress || '';
    row[COL.LandlordPhone] = payload.LandlordPhone || settings.LandlordPhone || '';
    row[COL.LandlordEmail] = payload.LandlordEmail || settings.LandlordEmail || '';
    row[COL.BankName] = payload.BankName || settings.BankName || '';
    row[COL.BankAccountName] = payload.BankAccountName || settings.BankAccountName || '';
    row[COL.BankAccountNumber] = payload.BankAccountNumber || settings.BankAccountNumber || '';
    row[COL.BankBranch] = payload.BankBranch || settings.BankBranch || '';
    row[COL.TenantName] = payload.TenantName;
    row[COL.TenantEmail] = payload.TenantEmail;
    row[COL.TenantPhone] = payload.TenantPhone || '';
    row[COL.TenantAddress] = payload.TenantAddress || '';
    row[COL.PremisesDescription] = payload.PremisesDescription;
    row[COL.PremisesAddress] = payload.PremisesAddress;
    row[COL.Region] = payload.Region || '';
    row[COL.StartDate] = payload.StartDate;
    row[COL.TermValue] = Number(payload.TermValue);
    row[COL.TermUnit] = payload.TermUnit;
    row[COL.EndDate] = endDate;
    row[COL.Currency] = currency;
    row[COL.MonthlyRent] = Number(payload.MonthlyRent);
    row[COL.RentAdvanceMonths] = Number(payload.RentAdvanceMonths || payload.TermValue || 1);
    row[COL.RentAdvanceAmount] = Number(rentAdvanceAmount);
    row[COL.RentAdvanceInWords] = rentAdvanceWords;
    row[COL.RetentionDeposit] = Number(payload.RetentionDeposit || 0);
    row[COL.NoticePeriodMonths] = Number(payload.NoticePeriodMonths || settings.DefaultNoticePeriodMonths || 3);
    row[COL.LandlordWitnessName] = payload.LandlordWitnessName || '';
    row[COL.TenantWitnessName] = payload.TenantWitnessName || '';
    row[COL.TermsSnapshot] = settings.TermsTemplate || DEFAULT_TERMS_TEMPLATE;
    row[COL.CreatedBy] = currentUser;
    row[COL.CreatedAt] = ts;
    row[COL.UpdatedAt] = ts;
    row[COL.SentAt] = '';
    row[COL.ExpiresAt] = '';
    row[COL.ViewedAt] = '';
    row[COL.AcceptedAt] = '';
    row[COL.TenantSignatureName] = '';
    row[COL.TenantSignatureIP] = '';
    row[COL.DeclinedAt] = '';
    row[COL.DeclineReason] = '';
    row[COL.PdfFileId] = '';
    row[COL.PdfUrl] = '';
    row[COL.RenewalOfId] = payload.RenewalOfId || '';
    row[COL.RenewedToId] = '';
    row[COL.RenewalReminderLeadDaysSent] = '';
    row[COL.RenewalResponse] = '';
    row[COL.RenewalRespondedAt] = '';
    row[COL.IsDeleted] = '0';
    row[COL.Notes] = payload.Notes || '';

    sh.appendRow(row);
    if (payload.RenewalOfId) {
      var oldIdx = findAgreementRowIndexById(sh, payload.RenewalOfId);
      if (oldIdx > -1) sh.getRange(oldIdx + 1, COL.RenewedToId + 1).setValue(id);
    }
    addLog(currentUser, 'Agreement Created', payload.TenantName + ' — ' + payload.PremisesDescription);
    return { success: true, data: { id: id, token: token } };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateAgreement(id, payload, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    var status = String(row[COL.Status]).toLowerCase();
    if (status === 'accepted') return { success: false, message: 'This agreement is already signed — use "Renew" to create a new one instead of editing a signed record.' };

    var editable = ['LandlordName', 'LandlordAddress', 'LandlordPhone', 'LandlordEmail', 'BankName', 'BankAccountName',
      'BankAccountNumber', 'BankBranch', 'TenantName', 'TenantEmail', 'TenantPhone', 'TenantAddress',
      'PremisesDescription', 'PremisesAddress', 'Region', 'StartDate', 'TermValue', 'TermUnit', 'Currency',
      'MonthlyRent', 'RentAdvanceMonths', 'RentAdvanceAmount', 'RentAdvanceInWords', 'RetentionDeposit',
      'NoticePeriodMonths', 'LandlordWitnessName', 'TenantWitnessName'];
    editable.forEach(function (key) {
      if (payload.hasOwnProperty(key) && payload[key] !== '') sh.getRange(idx + 1, COL[key] + 1).setValue(payload[key]);
    });
    var freshRow = sh.getDataRange().getValues()[idx];
    if (payload.StartDate || payload.TermValue || payload.TermUnit) {
      sh.getRange(idx + 1, COL.EndDate + 1).setValue(computeEndDate(freshRow[COL.StartDate], Number(freshRow[COL.TermValue]), freshRow[COL.TermUnit]));
    }
    // an inbound application (Status='inquiry') graduates into a normal draft agreement the moment
    // the landlord has filled in everything a signable agreement needs — same "Save" button, no
    // separate convert step.
    if (status === 'inquiry') {
      var settings = rowToSettings(getSettingsRow()) || {};
      var checkRow = sh.getDataRange().getValues()[idx];
      var stillMissing = _requiredAgreementFields().some(function (k) { return checkRow[COL[k]] === '' || checkRow[COL[k]] == null; });
      if (!stillMissing) {
        sh.getRange(idx + 1, COL.Status + 1).setValue('draft');
        sh.getRange(idx + 1, COL.TermsSnapshot + 1).setValue(settings.TermsTemplate || DEFAULT_TERMS_TEMPLATE);
      }
    }
    sh.getRange(idx + 1, COL.UpdatedAt + 1).setValue(nowIso());
    addLog(currentUser, 'Agreement Updated', 'ID ' + id);
    return { success: true, message: 'Agreement updated' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteAgreement(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    sh.getRange(idx + 1, COL.IsDeleted + 1).setValue('1');
    sh.getRange(idx + 1, COL.UpdatedAt + 1).setValue(nowIso());
    addLog(currentUser, 'Agreement Deleted', 'ID ' + id);
    return { success: true, message: 'Agreement removed' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Admin: send / resend the tenant link ==============
function _tenantEmailHtml(agreementRow, link, heading, intro) {
  var name = agreementRow[COL.TenantName];
  var landlord = agreementRow[COL.LandlordName] || 'Your landlord';
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">' +
    '<div style="background:#0f3d3e;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0;">' +
    '<h2 style="margin:0;font-size:20px;">' + heading + '</h2></div>' +
    '<div style="border:1px solid #e2e2e2;border-top:none;padding:24px;border-radius:0 0 10px 10px;">' +
    '<p>Dear ' + name + ',</p><p>' + intro + '</p>' +
    '<p style="text-align:center;margin:28px 0;"><a href="' + link + '" style="background:#0f3d3e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Tenancy Agreement</a></p>' +
    '<p style="font-size:12px;color:#777;">If the button doesn\'t work, copy this link into your browser:<br>' + link + '</p>' +
    '<p>Regards,<br>' + landlord + '</p></div></div>';
}

function sendAgreementLink(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    if (String(row[COL.Status]).toLowerCase() === 'accepted') return { success: false, message: 'Already signed — nothing to send' };

    var link = _publicLink('?public=agreement&token=' + row[COL.Token]);
    var expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    sh.getRange(idx + 1, COL.Status + 1).setValue('sent');
    sh.getRange(idx + 1, COL.SentAt + 1).setValue(nowIso());
    sh.getRange(idx + 1, COL.ExpiresAt + 1).setValue(expiresAt);
    sh.getRange(idx + 1, COL.UpdatedAt + 1).setValue(nowIso());

    var html = _tenantEmailHtml(row, link,
      'Your Tenancy Agreement is ready',
      'Please open the link below to review your tenancy agreement for <strong>' + row[COL.PremisesDescription] + '</strong>. Read the terms carefully, then sign and submit — you\'ll be able to download your own copy right after.');
    try { MailApp.sendEmail({ to: row[COL.TenantEmail], subject: 'Tenancy Agreement — please review and sign', htmlBody: html }); } catch (e) { /* still return the link even if email fails */ }

    addLog(currentUser, 'Agreement Link Sent', row[COL.TenantName] + ' <' + row[COL.TenantEmail] + '>');
    return { success: true, message: 'Link sent to ' + row[COL.TenantEmail], link: link };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function resendAgreementLink(id, currentUser, currentRole) {
  return sendAgreementLink(id, currentUser, currentRole);
}

function getShareLink(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    return { success: true, link: _publicLink('?public=agreement&token=' + row[COL.Token]) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Public — tenancy application form (the deployed URL's default landing page) ==============
// No login, no token — this is the "apply directly" front door, the same shape as a public job
// application form: a prospective tenant lands here, submits their interest, and it shows up in
// the landlord's dashboard as a New Application. The landlord reviews it, fills in the missing
// deal terms (rent, dates, deposit, ...) via the normal agreement form, and from there on it's
// exactly the same send-link / sign / track flow as an agreement the landlord started from scratch.
function getPublicLandlordProfile() {
  try {
    var settings = rowToSettings(getSettingsRow()) || {};
    return { success: true, data: { LandlordName: settings.LandlordName || 'Property Management' } };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function submitTenancyApplication(payload) {
  try {
    var name = String((payload && payload.TenantName) || '').trim();
    var email = String((payload && payload.TenantEmail) || '').trim();
    if (!name || !email) return { success: false, message: 'Please provide your name and email.' };

    var settings = rowToSettings(getSettingsRow()) || {};
    var sh = getSheet(AGREEMENTS_SHEET);
    var id = nextRowId(sh);
    var ts = nowIso();

    var row = [];
    row[COL.ID] = id;
    row[COL.Token] = Utilities.getUuid().replace(/-/g, '');
    row[COL.Status] = 'inquiry';
    row[COL.LandlordName] = settings.LandlordName || '';
    row[COL.LandlordAddress] = settings.LandlordAddress || '';
    row[COL.LandlordPhone] = settings.LandlordPhone || '';
    row[COL.LandlordEmail] = settings.LandlordEmail || '';
    row[COL.BankName] = ''; row[COL.BankAccountName] = ''; row[COL.BankAccountNumber] = ''; row[COL.BankBranch] = '';
    row[COL.TenantName] = name;
    row[COL.TenantEmail] = email;
    row[COL.TenantPhone] = payload.TenantPhone || '';
    row[COL.TenantAddress] = '';
    row[COL.PremisesDescription] = payload.PremisesDescription || 'General enquiry';
    row[COL.PremisesAddress] = ''; row[COL.Region] = '';
    row[COL.StartDate] = payload.PreferredStartDate || ''; row[COL.TermValue] = ''; row[COL.TermUnit] = ''; row[COL.EndDate] = '';
    row[COL.Currency] = settings.Currency || 'GH₵';
    row[COL.MonthlyRent] = ''; row[COL.RentAdvanceMonths] = ''; row[COL.RentAdvanceAmount] = ''; row[COL.RentAdvanceInWords] = '';
    row[COL.RetentionDeposit] = ''; row[COL.NoticePeriodMonths] = '';
    row[COL.LandlordWitnessName] = ''; row[COL.TenantWitnessName] = '';
    row[COL.TermsSnapshot] = '';
    row[COL.CreatedBy] = 'public'; row[COL.CreatedAt] = ts; row[COL.UpdatedAt] = ts;
    row[COL.SentAt] = ''; row[COL.ExpiresAt] = ''; row[COL.ViewedAt] = ''; row[COL.AcceptedAt] = '';
    row[COL.TenantSignatureName] = ''; row[COL.TenantSignatureIP] = '';
    row[COL.DeclinedAt] = ''; row[COL.DeclineReason] = '';
    row[COL.PdfFileId] = ''; row[COL.PdfUrl] = '';
    row[COL.RenewalOfId] = ''; row[COL.RenewedToId] = ''; row[COL.RenewalReminderLeadDaysSent] = '';
    row[COL.RenewalResponse] = ''; row[COL.RenewalRespondedAt] = '';
    row[COL.IsDeleted] = '0';
    row[COL.Notes] = payload.Message || '';

    sh.appendRow(row);
    addLog('applicant:' + email, 'Tenancy Application Submitted', name + (payload.PremisesDescription ? ' — ' + payload.PremisesDescription : ''));

    try {
      if (settings.LandlordEmail) {
        var html = '<p>New tenancy application received:</p><ul>' +
          '<li><b>Name:</b> ' + name + '</li><li><b>Email:</b> ' + email + '</li>' +
          (payload.TenantPhone ? '<li><b>Phone:</b> ' + payload.TenantPhone + '</li>' : '') +
          (payload.PremisesDescription ? '<li><b>Interested in:</b> ' + payload.PremisesDescription + '</li>' : '') +
          (payload.PreferredStartDate ? '<li><b>Preferred move-in:</b> ' + payload.PreferredStartDate + '</li>' : '') +
          (payload.Message ? '<li><b>Message:</b> ' + payload.Message + '</li>' : '') +
          '</ul><p>Log in to your dashboard to review it.</p>';
        MailApp.sendEmail({ to: settings.LandlordEmail, subject: 'New tenancy application: ' + name, htmlBody: html });
      }
    } catch (e) { /* the application is saved either way */ }

    return { success: true, message: 'Thanks, ' + name + '! Your application has been received — we\'ll be in touch soon.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Public (tokenised, no login) — tenant side ==============
function _publicAgreementView(row) {
  var o = rowToAgreement(row);
  // strip fields the tenant-facing page has no business seeing
  delete o.TenantSignatureIP;
  return o;
}

function getPublicAgreementByToken(token) {
  try {
    var tok = String(token || '').trim();
    if (!tok) return { success: false, message: 'Invalid link' };
    var sh = getSheet(AGREEMENTS_SHEET);
    if (!sh) return { success: false, message: 'Not set up yet' };
    var idx = findAgreementRowIndexByToken(sh, tok);
    if (idx < 0) return { success: false, message: 'This link is not recognised. Ask your landlord for a new one.' };
    var row = sh.getDataRange().getValues()[idx];
    if (String(row[COL.IsDeleted]) === '1') return { success: false, message: 'This agreement is no longer available.' };

    var status = String(row[COL.Status]).toLowerCase();
    if (status === 'draft') return { success: false, message: 'This agreement has not been sent yet. Ask your landlord to send it.' };
    if ((status === 'sent' || status === 'viewed') && row[COL.ExpiresAt] && new Date(row[COL.ExpiresAt]) < new Date()) {
      return { success: false, expired: true, message: 'This link has expired. Ask your landlord to resend it.' };
    }
    if (status === 'sent') {
      sh.getRange(idx + 1, COL.Status + 1).setValue('viewed');
      sh.getRange(idx + 1, COL.ViewedAt + 1).setValue(nowIso());
      row = sh.getDataRange().getValues()[idx];
      addLog('tenant:' + row[COL.TenantEmail], 'Agreement Viewed', 'ID ' + row[COL.ID]);
    }
    return { success: true, data: _publicAgreementView(row) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function acceptAgreement(token, signatureName, agreed) {
  try {
    var tok = String(token || '').trim();
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexByToken(sh, tok);
    if (idx < 0) return { success: false, message: 'Invalid link' };
    var row = sh.getDataRange().getValues()[idx];
    var status = String(row[COL.Status]).toLowerCase();
    if (status === 'accepted') return { success: false, message: 'This agreement has already been signed.' };
    if (status !== 'sent' && status !== 'viewed') return { success: false, message: 'This agreement can no longer be signed.' };
    if (row[COL.ExpiresAt] && new Date(row[COL.ExpiresAt]) < new Date()) return { success: false, expired: true, message: 'This link has expired. Ask your landlord to resend it.' };
    if (!agreed) return { success: false, message: 'You must confirm you have read and agree to the terms.' };
    var sig = String(signatureName || '').trim();
    if (!sig) return { success: false, message: 'Please type your full name as your signature.' };

    var ts = nowIso();
    sh.getRange(idx + 1, COL.Status + 1).setValue('accepted');
    sh.getRange(idx + 1, COL.AcceptedAt + 1).setValue(ts);
    sh.getRange(idx + 1, COL.TenantSignatureName + 1).setValue(sig);
    sh.getRange(idx + 1, COL.UpdatedAt + 1).setValue(ts);
    row = sh.getDataRange().getValues()[idx];

    var pdfInfo = _generateAgreementPdf(row);
    if (pdfInfo) {
      sh.getRange(idx + 1, COL.PdfFileId + 1).setValue(pdfInfo.fileId);
      sh.getRange(idx + 1, COL.PdfUrl + 1).setValue(pdfInfo.url);
    }
    addLog('tenant:' + row[COL.TenantEmail], 'Agreement Signed', sig + ' — ID ' + row[COL.ID]);

    try {
      var htmlTenant = '<p>Dear ' + row[COL.TenantName] + ',</p><p>Thank you — your tenancy agreement for <strong>' + row[COL.PremisesDescription] + '</strong> has been signed and submitted. A copy is attached for your records.</p><p>Regards,<br>' + row[COL.LandlordName] + '</p>';
      var attachments = pdfInfo ? [pdfInfo.blob] : [];
      MailApp.sendEmail({ to: row[COL.TenantEmail], subject: 'Signed copy — Tenancy Agreement', htmlBody: htmlTenant, attachments: attachments });
      if (row[COL.LandlordEmail]) {
        var htmlLandlord = '<p>' + row[COL.TenantName] + ' has signed the tenancy agreement for <strong>' + row[COL.PremisesDescription] + '</strong> at ' + ts + '.</p>';
        MailApp.sendEmail({ to: row[COL.LandlordEmail], subject: 'Tenant signed: ' + row[COL.TenantName], htmlBody: htmlLandlord, attachments: attachments });
      }
    } catch (e) { /* signing already succeeded even if the email step fails */ }

    return { success: true, data: _publicAgreementView(row), pdfBase64: pdfInfo ? Utilities.base64Encode(pdfInfo.blob.getBytes()) : '', pdfFilename: pdfInfo ? pdfInfo.filename : '' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function declineAgreement(token, reason) {
  try {
    var tok = String(token || '').trim();
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexByToken(sh, tok);
    if (idx < 0) return { success: false, message: 'Invalid link' };
    var row = sh.getDataRange().getValues()[idx];
    var status = String(row[COL.Status]).toLowerCase();
    if (status === 'accepted' || status === 'declined') return { success: false, message: 'No action needed — this agreement is already ' + status + '.' };

    sh.getRange(idx + 1, COL.Status + 1).setValue('declined');
    sh.getRange(idx + 1, COL.DeclinedAt + 1).setValue(nowIso());
    sh.getRange(idx + 1, COL.DeclineReason + 1).setValue(reason || '');
    sh.getRange(idx + 1, COL.UpdatedAt + 1).setValue(nowIso());
    addLog('tenant:' + row[COL.TenantEmail], 'Agreement Declined', reason || '');

    try {
      if (row[COL.LandlordEmail]) {
        MailApp.sendEmail({ to: row[COL.LandlordEmail], subject: 'Tenant declined: ' + row[COL.TenantName], htmlBody: '<p>' + row[COL.TenantName] + ' declined the tenancy agreement for ' + row[COL.PremisesDescription] + '.</p><p>Reason given: ' + (reason || '(none given)') + '</p>' });
      }
    } catch (e) {}
    return { success: true, message: 'We\'ve let your landlord know.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// tenant download button — regenerates on the fly if the stored PDF was ever removed from Drive
function getAgreementPdfBase64(token) {
  try {
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexByToken(sh, String(token || '').trim());
    if (idx < 0) return { success: false, message: 'Invalid link' };
    var row = sh.getDataRange().getValues()[idx];
    if (String(row[COL.Status]).toLowerCase() !== 'accepted') return { success: false, message: 'This agreement has not been signed yet.' };
    return _pdfBase64Response(row);
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}
function getAgreementPdfBase64ForAdmin(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    if (String(row[COL.Status]).toLowerCase() !== 'accepted') return { success: false, message: 'Not signed yet.' };
    return _pdfBase64Response(row);
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}
function _pdfBase64Response(row) {
  var blob;
  if (row[COL.PdfFileId]) {
    try { blob = DriveApp.getFileById(row[COL.PdfFileId]).getBlob(); } catch (e) { blob = null; }
  }
  if (!blob) { var info = _generateAgreementPdf(row); blob = info.blob; }
  return { success: true, base64: Utilities.base64Encode(blob.getBytes()), filename: 'Tenancy Agreement - ' + row[COL.TenantName] + '.pdf' };
}

// ============== PDF generation ==============
function _getOrCreateFolder(name) {
  var it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function _generateAgreementPdf(row) {
  try {
    var o = {}; for (var i = 0; i < AGREEMENT_HEADERS.length; i++) o[AGREEMENT_HEADERS[i]] = row[i];
    var doc = DocumentApp.create('TMP - Tenancy Agreement - ' + o.TenantName + ' - ' + o.ID);
    var body = doc.getBody();
    body.setMarginTop(50).setMarginBottom(50).setMarginLeft(60).setMarginRight(60);

    var title = body.appendParagraph('TENANCY AGREEMENT');
    title.setHeading(DocumentApp.ParagraphHeading.TITLE).setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    body.appendParagraph('BETWEEN').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(o.LandlordName + ' (Landlord/Landlady)').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('AND').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph(o.TenantName + ' (Tenant)').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('');

    var startFmt = Utilities.formatDate(new Date(o.StartDate), Session.getScriptTimeZone() || 'UTC', 'do MMMM yyyy');
    var endFmt = Utilities.formatDate(new Date(o.EndDate), Session.getScriptTimeZone() || 'UTC', 'do MMMM yyyy');
    var termLabel = o.TermValue + ' (' + o.TermValue + ') ' + o.TermUnit;

    body.appendParagraph('This Tenancy Agreement is made between ' + o.LandlordName + (o.LandlordAddress ? ' of ' + o.LandlordAddress : '') +
      ' (hereinafter called the Landlord/Landlady) and ' + o.TenantName + (o.TenantAddress ? ' of ' + o.TenantAddress : '') +
      ' (hereinafter called the Tenant). WHEREAS IT IS AGREED as follows:');

    var clauses = [
      '1. The Landlord/Landlady lets and the Tenant takes the premises described as ' + o.PremisesDescription + ', located at ' + o.PremisesAddress + (o.Region ? ', ' + o.Region : '') + ' (hereinafter called "the premises"), together with all fixtures and fittings, for the term, at the rent, and upon the terms set out below.',
      '2. The premises shall be held by the Tenant from ' + startFmt + ' for a period of ' + termLabel + ', ending ' + endFmt + '.',
      '3. The Tenant shall pay a monthly rent of ' + o.Currency + Number(o.MonthlyRent).toLocaleString() + ', clear of all deductions.',
      '4. Payment of rent shall be made to the Landlord\'s bank account as follows — Bank: ' + (o.BankName || '—') + '; Account Name: ' + (o.BankAccountName || '—') + '; Account Number: ' + (o.BankAccountNumber || '—') + '; Branch: ' + (o.BankBranch || '—') + '.',
      '5. Retention deposit for repairs: ' + o.Currency + Number(o.RetentionDeposit || 0).toLocaleString() + '. This refundable amount is held by the Landlord/Landlady for the duration of the tenancy against any damage to the premises, fixtures or fittings caused by the Tenant, and is refunded in full at the end of the tenancy if no damage is found, or less the cost of repairs if damage is found. Where repair costs exceed this deposit, the Tenant is responsible for the difference.',
      '6. The Landlord/Landlady acknowledges receipt from the Tenant of ' + amountToWordsCap(o.RentAdvanceInWords) + ' (' + o.Currency + Number(o.RentAdvanceAmount).toLocaleString() + ') being ' + o.RentAdvanceMonths + ' month(s) rent advance, and ' + o.Currency + Number(o.RetentionDeposit || 0).toLocaleString() + ' being the refundable retention deposit.'
    ];
    clauses.forEach(function (c) { body.appendParagraph(c); });

    body.appendParagraph('');
    body.appendParagraph('7. Terms & Conditions').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    var termsText = String(o.TermsSnapshot || DEFAULT_TERMS_TEMPLATE).replace(/\{\{NoticePeriodMonths\}\}/g, o.NoticePeriodMonths);
    termsText.split('\n').forEach(function (line) { body.appendParagraph(line); });

    body.appendParagraph('');
    body.appendParagraph('IN WITNESS whereof the parties have set their hands on the day and year written above.');
    body.appendParagraph('');
    body.appendParagraph('Signed by the Landlord/Landlady: ' + o.LandlordName);
    if (o.LandlordWitnessName) body.appendParagraph('In the presence of (witness): ' + o.LandlordWitnessName);
    body.appendParagraph('');
    body.appendParagraph('Signed by the Tenant: ' + o.TenantSignatureName + '   (typed signature, submitted ' +
      Utilities.formatDate(new Date(o.AcceptedAt || new Date()), Session.getScriptTimeZone() || 'UTC', "d MMM yyyy 'at' HH:mm") + ')');
    if (o.TenantWitnessName) body.appendParagraph('In the presence of (witness): ' + o.TenantWitnessName);

    doc.saveAndClose();
    var pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
    var filename = 'Tenancy Agreement - ' + o.TenantName + ' - ' + o.ID + '.pdf';
    pdfBlob.setName(filename);
    var folder = _getOrCreateFolder('Tenancy Agreements');
    var pdfFile = folder.createFile(pdfBlob);
    DriveApp.getFileById(doc.getId()).setTrashed(true); // keep Drive tidy — only the PDF is kept
    return { fileId: pdfFile.getId(), url: pdfFile.getUrl(), blob: pdfBlob, filename: filename };
  } catch (err) {
    Logger.log('PDF generation failed: ' + err.toString());
    return null;
  }
}
function amountToWordsCap(words) {
  words = String(words || '');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
}

// ============== Renewals ==============
// The UI drives a renewal through the same "New Agreement" form (pre-filled from the expiring
// one — see Admin.startRenewal / Admin.formDefaults in Index.html), which calls createAgreement()
// directly with RenewalOfId set. createAgreement() already stamps RenewedToId back onto the old
// row when that's present, so no separate renew-specific endpoint is needed here.

// admin — manual "remind this tenant now" button
function sendRenewalReminder(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexById(sh, id);
    if (idx < 0) return { success: false, message: 'Agreement not found' };
    var row = sh.getDataRange().getValues()[idx];
    if (String(row[COL.Status]).toLowerCase() !== 'accepted') return { success: false, message: 'Only signed, active agreements can get a renewal reminder' };
    _sendOneRenewalReminder(sh, idx, row);
    addLog(currentUser, 'Renewal Reminder Sent (manual)', 'ID ' + id);
    return { success: true, message: 'Reminder sent to ' + row[COL.TenantEmail] };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function _sendOneRenewalReminder(sh, idx, row) {
  var yesLink = _publicLink('?public=renewal&token=' + row[COL.Token] + '&resp=yes');
  var noLink = _publicLink('?public=renewal&token=' + row[COL.Token] + '&resp=no');
  var endFmt = row[COL.EndDate];
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">' +
    '<div style="background:#0f3d3e;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0;"><h2 style="margin:0;font-size:20px;">Your tenancy is coming up for renewal</h2></div>' +
    '<div style="border:1px solid #e2e2e2;border-top:none;padding:24px;border-radius:0 0 10px 10px;">' +
    '<p>Dear ' + row[COL.TenantName] + ',</p>' +
    '<p>Your tenancy agreement for <strong>' + row[COL.PremisesDescription] + '</strong> ends on <strong>' + endFmt + '</strong>. Would you like to renew?</p>' +
    '<p style="text-align:center;margin:24px 0;">' +
    '<a href="' + yesLink + '" style="background:#0f3d3e;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:10px;">Yes, I\'d like to renew</a>' +
    '<a href="' + noLink + '" style="background:#888;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">No, I\'ll be vacating</a></p>' +
    '<p>Regards,<br>' + row[COL.LandlordName] + '</p></div></div>';
  MailApp.sendEmail({ to: row[COL.TenantEmail], subject: 'Renewal reminder — your tenancy ends ' + endFmt, htmlBody: html });
}

// public — tenant clicks Yes/No from the reminder email
function respondToRenewal(token, response) {
  try {
    var sh = getSheet(AGREEMENTS_SHEET);
    var idx = findAgreementRowIndexByToken(sh, String(token || '').trim());
    if (idx < 0) return { success: false, message: 'Invalid link' };
    var row = sh.getDataRange().getValues()[idx];
    var resp = String(response || '').toLowerCase() === 'yes' ? 'yes' : 'no';
    sh.getRange(idx + 1, COL.RenewalResponse + 1).setValue(resp);
    sh.getRange(idx + 1, COL.RenewalRespondedAt + 1).setValue(nowIso());
    addLog('tenant:' + row[COL.TenantEmail], 'Renewal Response', resp);
    try {
      if (row[COL.LandlordEmail]) {
        var msg = row[COL.TenantName] + (resp === 'yes' ? ' would like to renew ' : ' will NOT be renewing ') + 'the tenancy for ' + row[COL.PremisesDescription] + '.';
        MailApp.sendEmail({ to: row[COL.LandlordEmail], subject: 'Renewal response: ' + row[COL.TenantName], htmlBody: '<p>' + msg + '</p>' });
      }
    } catch (e) {}
    return { success: true, response: resp, tenantName: row[COL.TenantName], premises: row[COL.PremisesDescription] };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// time-driven trigger target — checks every accepted agreement's end date against the
// landlord-configured lead days (Settings.ReminderLeadDays, default "60,30,7") and sends
// at most one reminder per lead-day threshold crossed, tracked in RenewalReminderLeadDaysSent
// so re-runs on the same day never double-send.
function checkRenewalReminders() {
  var sh = getSheet(AGREEMENTS_SHEET);
  if (!sh) return;
  var settings = rowToSettings(getSettingsRow()) || {};
  var leadDays = String(settings.ReminderLeadDays || DEFAULT_REMINDER_LEAD_DAYS).split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n); });
  var data = sh.getDataRange().getValues();
  var sentCount = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[COL.IsDeleted]) === '1') continue;
    if (String(row[COL.Status]).toLowerCase() !== 'accepted') continue;
    if (row[COL.RenewedToId]) continue; // already renewed into a new agreement
    var daysLeft = daysBetween(todayStr(), row[COL.EndDate]);
    if (daysLeft < 0) continue;
    var already = String(row[COL.RenewalReminderLeadDaysSent] || '').split(',').filter(function (s) { return s; });
    var threshold = leadDays.filter(function (d) { return daysLeft <= d; }).sort(function (a, b) { return a - b; })[0];
    if (threshold === undefined) continue;
    if (already.indexOf(String(threshold)) > -1) continue;
    try {
      _sendOneRenewalReminder(sh, i, row);
      already.push(String(threshold));
      sh.getRange(i + 1, COL.RenewalReminderLeadDaysSent + 1).setValue(already.join(','));
      sentCount++;
    } catch (e) { Logger.log('Reminder failed for row ' + i + ': ' + e.toString()); }
  }
  addLog('System', 'Renewal Reminder Sweep', sentCount + ' reminder(s) sent');
  return sentCount;
}

function installDailyReminderTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkRenewalReminders') ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('checkRenewalReminders').timeBased().everyDays(1).atHour(8).create();
  return 'Daily renewal-reminder trigger installed (runs around 8am).';
}

// ============== Dashboard summary ==============
function getDashboardStats(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var res = getAllAgreements(currentUser, currentRole);
    if (!res.success) return res;
    var rows = res.data;
    var stats = { total: rows.length, newApplications: 0, awaitingSignature: 0, accepted: 0, declined: 0, expiringSoon: 0, renewalRequests: 0 };
    rows.forEach(function (a) {
      var s = a.EffectiveStatus;
      if (s === 'inquiry') stats.newApplications++;
      if (s === 'sent' || s === 'viewed') stats.awaitingSignature++;
      if (s === 'accepted') { stats.accepted++; if (a.DaysToEnd !== null && a.DaysToEnd <= 30 && a.DaysToEnd >= 0 && !a.RenewedToId) stats.expiringSoon++; }
      if (s === 'declined') stats.declined++;
      if (a.RenewalResponse === 'yes' && !a.RenewedToId) stats.renewalRequests++;
    });
    return { success: true, data: stats };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function getRecentLogs(currentUser, currentRole, limit) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(LOGS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues();
    var rows = data.slice(1).map(function (r) { return { Timestamp: r[0], User: r[1], Action: r[2], Details: r[3] }; });
    rows.reverse();
    return { success: true, data: rows.slice(0, limit || 50) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}
