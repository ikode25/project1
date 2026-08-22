/**
 * ChurchMS — Advanced Church Management System
 * Single-file backend: everything Code.gs needs, in one place.
 *
 * Sections below (search for the "======" banners to jump around):
 *   1. Config           — sheet schema, roles/permissions, ID prefixes, options
 *   2. SheetService      — generic data-access layer over SpreadsheetApp
 *   3. Utils             — validation, sanitization, rate limiting, error log
 *   4. Auth              — session identity, RBAC, audit logging
 *   5. Setup             — one-time spreadsheet bootstrap (run runInitialSetup)
 *   6. Routing           — doGet, the single entry point
 *   7. Members / Dashboard / Visitors / Attendance / Finance / SMS /
 *      Equipment / Reports / ClusterFollowUp / Communication /
 *      Notifications / Triggers / Settings — one service module each
 */

/* ============================== 1. CONFIG ============================== */

/**
 * Config.gs
 * Central configuration: sheet schema, roles/permissions, app constants.
 * Nothing here talks to Sheets/Drive directly — SheetService.gs and Setup.gs do that.
 */

var APP_NAME = 'ChurchMS';
var APP_TAGLINE = 'Advanced Church Management System';

// Script Properties keys
var PROP_SPREADSHEET_ID = 'CHURCHMS_SPREADSHEET_ID';
var PROP_BACKUP_FOLDER_ID = 'CHURCHMS_BACKUP_FOLDER_ID';
var PROP_ATTACHMENTS_FOLDER_ID = 'CHURCHMS_ATTACHMENTS_FOLDER_ID';

/** One tab per entity. Header row = schema. First column is always "ID". */
var SHEETS = {
  MEMBERS: 'Members',
  MEMBER_STATUS_HISTORY: 'MemberStatusHistory',
  VISITORS: 'Visitors',
  ATTENDANCE: 'Attendance',
  FINANCE: 'Finance',
  CAMPAIGNS: 'Campaigns',
  PLEDGES: 'Pledges',
  EXPENSES: 'Expenses',
  SMS_LOG: 'SMS_Log',
  SMS_TEMPLATES: 'SMS_Templates',
  EQUIPMENT: 'Equipment',
  PRAYER_REQUESTS: 'PrayerRequests',
  MESSAGE_THREADS: 'MessageThreads',
  MESSAGES: 'Messages',
  CLUSTERS: 'Clusters',
  CLUSTER_FOLLOWUPS: 'ClusterFollowUps',
  USERS: 'Users',
  SESSIONS: 'Sessions',
  AUDIT_LOG: 'AuditLog',
  ERRORS: 'Errors',
  RATE_LIMITS: 'RateLimits',
  SETTINGS: 'Settings'
};

/** How long a signed-in session stays valid before the user must log in again. */
var SESSION_DURATION_HOURS = 12;

/** Header rows per sheet, in column order. Column A is always the record ID. */
var SCHEMA = {};
SCHEMA[SHEETS.MEMBERS] = ['ID', 'FirstName', 'LastName', 'Gender', 'DOB', 'Phone', 'Email', 'Address',
  'MaritalStatus', 'EmergencyContactName', 'EmergencyContactPhone', 'MembershipStatus', 'MembershipDate',
  'MembershipClass', 'Cluster', 'Department', 'PhotoFileId', 'DocumentLinks', 'CustomFields', 'SmsOptOut',
  'Notes', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy'];

SCHEMA[SHEETS.MEMBER_STATUS_HISTORY] = ['ID', 'MemberID', 'MemberName', 'OldStatus', 'NewStatus', 'Reason', 'ChangedBy', 'ChangedAt'];

SCHEMA[SHEETS.VISITORS] = ['ID', 'FirstName', 'LastName', 'Phone', 'Email', 'Address', 'VisitDate', 'HowHeard',
  'Interest', 'FollowUpStatus', 'AssignedTo', 'Notes', 'ConvertedMemberID', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.ATTENDANCE] = ['ID', 'MemberID', 'MemberName', 'ServiceType', 'ServiceDate', 'CheckInTime',
  'CheckInMethod', 'RecordedBy', 'Notes'];

SCHEMA[SHEETS.FINANCE] = ['ID', 'Type', 'DonorMemberID', 'DonorName', 'Amount', 'PaymentMethod', 'CampaignID',
  'Recurring', 'Date', 'ReceiptNumber', 'RecordedBy', 'Notes', 'CreatedAt'];

SCHEMA[SHEETS.CAMPAIGNS] = ['ID', 'Name', 'Goal', 'StartDate', 'EndDate', 'Status', 'CreatedAt'];

SCHEMA[SHEETS.PLEDGES] = ['ID', 'MemberID', 'MemberName', 'CampaignID', 'CampaignName', 'PledgedAmount',
  'StartDate', 'EndDate', 'Status', 'Notes', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.EXPENSES] = ['ID', 'Category', 'Department', 'Description', 'Amount', 'Date', 'Status',
  'RequestedBy', 'ApprovedBy', 'ReceiptFileId', 'BudgetLine', 'CreatedAt'];

SCHEMA[SHEETS.SMS_LOG] = ['ID', 'RecipientPhone', 'RecipientMemberID', 'RecipientName', 'MessageBody', 'Provider',
  'Status', 'SentAt', 'ScheduledFor', 'GroupLabel', 'ErrorDetail', 'CreatedBy'];

SCHEMA[SHEETS.SMS_TEMPLATES] = ['ID', 'Name', 'Body', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.EQUIPMENT] = ['ID', 'Name', 'Category', 'SerialNumber', 'Status', 'Location', 'AssignedTo',
  'PurchaseDate', 'Condition', 'Notes', 'CreatedAt'];

SCHEMA[SHEETS.PRAYER_REQUESTS] = ['ID', 'RequesterName', 'RequesterContact', 'RequestText', 'Visibility',
  'Status', 'AssignedTo', 'ResponseNotes', 'SubmittedAt'];

SCHEMA[SHEETS.MESSAGE_THREADS] = ['ID', 'Type', 'Name', 'Participants', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.MESSAGES] = ['ID', 'ThreadID', 'FromUser', 'Body', 'Attachments', 'SentAt', 'ReadBy'];

SCHEMA[SHEETS.CLUSTERS] = ['ID', 'Name', 'LeaderMemberID', 'LeaderName', 'MeetingDay', 'Location', 'Status',
  'Notes', 'CreatedAt'];

SCHEMA[SHEETS.CLUSTER_FOLLOWUPS] = ['ID', 'ClusterID', 'ClusterName', 'MemberID', 'MemberName', 'FollowUpDate',
  'Type', 'Notes', 'Outcome', 'FollowedUpBy', 'CreatedAt'];

SCHEMA[SHEETS.USERS] = ['ID', 'Username', 'PasswordHash', 'PasswordSalt', 'Email', 'FullName', 'Role', 'Active',
  'Phone', 'CreatedAt', 'LastLogin'];

SCHEMA[SHEETS.SESSIONS] = ['ID', 'Token', 'UserID', 'CreatedAt', 'ExpiresAt'];

SCHEMA[SHEETS.AUDIT_LOG] = ['ID', 'Timestamp', 'UserEmail', 'Action', 'Entity', 'RecordID', 'Details'];

SCHEMA[SHEETS.ERRORS] = ['ID', 'Timestamp', 'FunctionName', 'Message', 'Stack'];

SCHEMA[SHEETS.RATE_LIMITS] = ['ID', 'Bucket', 'Timestamp'];

SCHEMA[SHEETS.SETTINGS] = ['Key', 'Value', 'Description'];

/** Roles */
var ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  FINANCE_OFFICER: 'FinanceOfficer',
  CLUSTER_LEADER: 'ClusterLeader',
  COMMUNICATION_OFFICER: 'CommunicationOfficer',
  VIEWER: 'Viewer'
};
var ALL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER, ROLES.CLUSTER_LEADER,
  ROLES.COMMUNICATION_OFFICER, ROLES.VIEWER];

/** Which roles may access (view) and mutate (create/update/delete) each module. SuperAdmin always has full access. */
var MODULE_PERMISSIONS = {
  dashboard: { view: ALL_ROLES, mutate: [] },
  members: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  visitors: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] },
  attendance: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] },
  finance: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER], mutate: [ROLES.SUPER_ADMIN, ROLES.FINANCE_OFFICER] },
  sms: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMMUNICATION_OFFICER], mutate: [ROLES.SUPER_ADMIN, ROLES.COMMUNICATION_OFFICER] },
  equipment: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  reports: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER], mutate: [] },
  settings: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN], mutate: [ROLES.SUPER_ADMIN] },
  cluster: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] }
};

/** ID prefixes per entity */
var ID_PREFIX = {
  MEMBERS: 'MEM', MEMBER_STATUS_HISTORY: 'MSH', VISITORS: 'VIS', ATTENDANCE: 'ATT', FINANCE: 'FIN',
  CAMPAIGNS: 'CMP', PLEDGES: 'PLG', EXPENSES: 'EXP', SMS_LOG: 'SMS', SMS_TEMPLATES: 'TPL', EQUIPMENT: 'EQP',
  PRAYER_REQUESTS: 'PRY', MESSAGE_THREADS: 'THR', MESSAGES: 'MSG', CLUSTERS: 'CLU', CLUSTER_FOLLOWUPS: 'FUP',
  USERS: 'USR', SESSIONS: 'SES'
};

/** Default Settings sheet seed values */
var DEFAULT_SETTINGS = [
  ['OrgName', 'Grace Community Church', 'Name shown in sidebar and reports'],
  ['OrgLogoFileId', '', 'Google Drive file ID of the org logo'],
  ['ThemeMode', 'green', 'UI theme palette key'],
  ['SmsProvider', 'arkesel', 'arkesel | hubtel | custom'],
  ['Sms_Arkesel_ApiKey', '', 'Arkesel API key'],
  ['Sms_Arkesel_SenderId', 'ChurchMS', 'Arkesel approved sender ID'],
  ['Sms_Hubtel_ClientId', '', 'Hubtel client ID'],
  ['Sms_Hubtel_ClientSecret', '', 'Hubtel client secret'],
  ['Sms_Hubtel_SenderId', 'ChurchMS', 'Hubtel approved sender ID'],
  ['Sms_Hubtel_From', '', 'Hubtel account "from" number if required'],
  ['Sms_Custom_Endpoint', '', 'Custom SMS provider HTTP endpoint'],
  ['Sms_Custom_Method', 'POST', 'HTTP method for custom provider'],
  ['Sms_Custom_ApiKey', '', 'Custom provider API key / bearer token'],
  ['Sms_Custom_PhoneField', 'to', 'JSON field name the custom provider expects for phone number'],
  ['Sms_Custom_MessageField', 'message', 'JSON field name the custom provider expects for message body'],
  ['AbsenceThresholdWeeks', '3', 'Consecutive missed Sundays before an absence notification fires'],
  ['CustomFieldsConfig', '[]', 'JSON array of admin-defined extra Member fields'],
  ['BackupFolderId', '', 'Drive folder ID for scheduled spreadsheet backups'],
  ['RetentionYears', '7', 'Years to retain archived records before purge eligibility'],
  ['CheckInWindowMinutes', '180', 'Minutes a check-in QR/link stays valid for a given service']
];

/** Dropdown option lists used for data validation + frontend selects */
var OPTIONS = {
  GENDER: ['Male', 'Female'],
  MARITAL_STATUS: ['Single', 'Married', 'Divorced', 'Widowed'],
  MEMBERSHIP_STATUS: ['New', 'Active', 'Inactive', 'Transferred', 'Deceased'],
  FOLLOW_UP_STATUS: ['New', 'Contacted', 'Converted', 'Closed'],
  SERVICE_TYPE: ['Sunday Service', 'Midweek Service', 'Prayer Meeting', 'Youth Service', 'Special Event'],
  CHECKIN_METHOD: ['QR', 'Manual'],
  PAYMENT_METHOD: ['Cash', 'Mobile Money', 'Bank Transfer', 'Card', 'Cheque'],
  FINANCE_TYPE: ['Tithe', 'Offering', 'Donation', 'Pledge Payment'],
  PLEDGE_STATUS: ['Active', 'Fulfilled', 'Overdue', 'Cancelled'],
  EXPENSE_STATUS: ['Pending', 'Approved', 'Rejected'],
  EQUIPMENT_STATUS: ['Available', 'In Use', 'Maintenance', 'Retired'],
  EQUIPMENT_CONDITION: ['Excellent', 'Good', 'Fair', 'Poor'],
  PRAYER_VISIBILITY: ['Private', 'Prayer Team', 'Public'],
  PRAYER_STATUS: ['New', 'In Progress', 'Answered', 'Closed'],
  SMS_STATUS: ['Sent', 'Failed', 'Pending', 'Scheduled'],
  CLUSTER_STATUS: ['Active', 'Inactive'],
  FOLLOWUP_TYPE: ['Visit', 'Call', 'Message']
};

/* ============================ 2. SHEET SERVICE ============================ */

/**
 * SheetService.gs
 * Thin data-access layer wrapping SpreadsheetApp so no other module touches
 * Range/Sheet objects directly. Rows are read/written as plain objects keyed
 * by the header row (see SCHEMA in Config.gs).
 */

function getDb_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_SPREADSHEET_ID);
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* fall through and rebuild */ }
  }
  return runInitialSetup().spreadsheet;
}

function getSheet_(name) {
  var db = getDb_();
  var sheet = db.getSheetByName(name);
  if (!sheet) {
    sheet = db.insertSheet(name);
    var headers = SCHEMA[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

/** Reads the full sheet into an array of plain objects, using row 1 as keys. */
function readAll_(name) {
  var sheet = getSheet_(name);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (row.join('') === '') continue; // skip fully blank rows
    var obj = { _row: r + 2 };
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = normalizeCell_(row[c]);
    }
    out.push(obj);
  }
  return out;
}

function normalizeCell_(v) {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function findRowIndexById_(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

/** Fetch one record by ID, or null. */
function getById_(name, id) {
  var sheet = getSheet_(name);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx === -1) return null;
  var headers = SCHEMA[name];
  var values = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
  var obj = { _row: rowIdx };
  for (var c = 0; c < headers.length; c++) obj[headers[c]] = normalizeCell_(values[c]);
  return obj;
}

/** Insert a record. `data` keys matching schema headers are used; ID is auto-generated if omitted. */
function insertRow_(name, data, idPrefix) {
  var sheet = getSheet_(name);
  var headers = SCHEMA[name];
  if (headers.indexOf('ID') === 0 && !data.ID) {
    data.ID = generateId_(name, idPrefix);
  }
  var row = headers.map(function (h) { return data.hasOwnProperty(h) ? data[h] : ''; });
  sheet.appendRow(row);
  return getById_(name, data.ID);
}

/** Update fields of an existing record by ID. Only keys present in `data` are changed. */
function updateRow_(name, id, data) {
  var sheet = getSheet_(name);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx === -1) throw new Error('Record not found: ' + id);
  var headers = SCHEMA[name];
  var current = sheet.getRange(rowIdx, 1, 1, headers.length).getValues()[0];
  for (var c = 0; c < headers.length; c++) {
    if (data.hasOwnProperty(headers[c])) current[c] = data[headers[c]];
  }
  sheet.getRange(rowIdx, 1, 1, headers.length).setValues([current]);
  return getById_(name, id);
}

function deleteRow_(name, id) {
  var sheet = getSheet_(name);
  var rowIdx = findRowIndexById_(sheet, id);
  if (rowIdx === -1) return false;
  sheet.deleteRow(rowIdx);
  return true;
}

/** Generates a sequential, zero-padded ID like MEM-000123, safe under concurrent writers. */
function generateId_(name, prefix) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_(name);
    var lastRow = sheet.getLastRow();
    var max = 0;
    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        var m = String(ids[i][0]).match(/(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
    }
    var next = max + 1;
    return prefix + '-' + ('000000' + next).slice(-6);
  } finally {
    lock.releaseLock();
  }
}

/** ----- Settings (key/value tab) ----- */
function getSetting_(key, fallback) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('setting_' + key);
  if (cached !== null) return cached;
  var rows = readAll_(SHEETS.SETTINGS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Key === key) {
      var val = rows[i].Value === '' || rows[i].Value == null ? fallback : rows[i].Value;
      cache.put('setting_' + key, String(val), 300);
      return val;
    }
  }
  return fallback;
}

function setSetting_(key, value) {
  var sheet = getSheet_(SHEETS.SETTINGS);
  var lastRow = sheet.getLastRow();
  var rowIdx = -1;
  if (lastRow >= 2) {
    var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i][0] === key) { rowIdx = i + 2; break; }
    }
  }
  if (rowIdx === -1) {
    sheet.appendRow([key, value, '']);
  } else {
    sheet.getRange(rowIdx, 2).setValue(value);
  }
  CacheService.getScriptCache().remove('setting_' + key);
}

function getAllSettings_() {
  var rows = readAll_(SHEETS.SETTINGS);
  var out = {};
  rows.forEach(function (r) { out[r.Key] = r.Value; });
  return out;
}

/* =============================== 3. UTILS =============================== */

/**
 * Utils.gs
 * Small, dependency-free helpers used across modules. Server-side input
 * validation lives here so every .gs function can call it before writing.
 */

function nowIso_() {
  return new Date().toISOString();
}

/** Identity string for audit/attribution — the signed-in user's Username, set per-request by api(). */
function currentUserEmail_() {
  return __CTX_USER ? __CTX_USER.Username : 'public';
}

/** Strips tags/script content so any user text that gets echoed back into HTML can't inject markup. */
function sanitizeText_(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

function isBlank_(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

function requireFields_(data, fields) {
  var missing = fields.filter(function (f) { return isBlank_(data[f]); });
  if (missing.length) throw new Error('Missing required field(s): ' + missing.join(', '));
}

function isValidEmail_(email) {
  if (isBlank_(email)) return true; // email is usually optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone_(phone) {
  if (isBlank_(phone)) return false;
  return /^[+0-9][0-9\s\-]{6,17}$/.test(String(phone).trim());
}

function normalizePhone_(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function isValidDate_(d) {
  if (isBlank_(d)) return true;
  var t = new Date(d);
  return !isNaN(t.getTime());
}

function isNumber_(n) {
  return typeof n === 'number' ? !isNaN(n) : !isNaN(parseFloat(n)) && isFinite(n);
}

function requireEnum_(value, allowed, fieldName) {
  if (isBlank_(value)) return;
  if (allowed.indexOf(value) === -1) {
    throw new Error(fieldName + ' must be one of: ' + allowed.join(', '));
  }
}

function toBool_(v) {
  return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
}

/** Simple per-bucket rate limiter backed by the RateLimits sheet — for public-facing endpoints. */
function checkRateLimit_(bucket, maxHits, windowSeconds) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet_(SHEETS.RATE_LIMITS);
    var rows = readAll_(SHEETS.RATE_LIMITS);
    var cutoff = Date.now() - windowSeconds * 1000;
    var recent = rows.filter(function (r) {
      return r.Bucket === bucket && new Date(r.Timestamp).getTime() > cutoff;
    });
    if (recent.length >= maxHits) {
      throw new Error('Too many requests. Please try again in a moment.');
    }
    insertRow_(SHEETS.RATE_LIMITS, { Bucket: bucket, Timestamp: nowIso_() }, 'RL');
    // opportunistic cleanup so the sheet doesn't grow unbounded
    if (rows.length > 500) {
      var keep = rows.filter(function (r) { return new Date(r.Timestamp).getTime() > cutoff; });
      sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 3).clearContent();
      keep.forEach(function (r) { sheet.appendRow([r.ID, r.Bucket, r.Timestamp]); });
    }
  } finally {
    lock.releaseLock();
  }
}

function logError_(functionName, err) {
  try {
    insertRow_(SHEETS.ERRORS, {
      Timestamp: nowIso_(),
      FunctionName: functionName,
      Message: err && err.message ? err.message : String(err),
      Stack: err && err.stack ? err.stack : ''
    }, 'ERR');
  } catch (e) {
    console.error('logError_ failed', e);
  }
}

/** Wraps a service function so thrown errors are logged and re-thrown with a clean message for the client. */
function safeCall_(functionName, fn) {
  try {
    return fn();
  } catch (err) {
    logError_(functionName, err);
    throw new Error(err && err.message ? err.message : 'Something went wrong. Please try again.');
  }
}

function calcAge_(dob) {
  if (isBlank_(dob)) return null;
  var birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  var diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function formatMoney_(n) {
  n = Number(n) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ================================ 4. AUTH ================================ */

/**
 * Auth.gs
 * Session identity, role-based access control, and audit logging.
 * Every privileged backend function must call requireRole_() itself —
 * a hidden frontend button is never sufficient enforcement.
 */

/**
 * Username/password authentication — no Google account required. login()
 * mints a random session token (persisted in the Sessions sheet and cached);
 * the client keeps it in localStorage and passes it to every call. api() is
 * the single dispatcher for authenticated calls: it validates the token,
 * sets the request-scoped __CTX_USER below, then invokes the requested
 * function from a fixed whitelist (API_REGISTRY, defined further down) —
 * never an arbitrary global reached by string name.
 */
var __CTX_USER = null; // set by api() for the duration of one request only; never persists across calls

/** Returns the current request's signed-in Users-sheet record, or null if there isn't one. */
function getCurrentUserRecord_() {
  return __CTX_USER;
}

function roleCan_(role, moduleKey, action) {
  if (role === ROLES.SUPER_ADMIN) return true;
  var perms = MODULE_PERMISSIONS[moduleKey];
  if (!perms) return false;
  return perms[action].indexOf(role) !== -1;
}

/** Throws if the caller's role can't perform `action` ('view'|'mutate') on `moduleKey'. Returns the user record. */
function requireRole_(moduleKey, action) {
  var user = getCurrentUserRecord_();
  if (!user) {
    logAudit_('ACCESS_DENIED', moduleKey, 'anonymous', 'Unauthenticated request attempted ' + action);
    throw new Error('Access denied: please sign in.');
  }
  if (!roleCan_(user.Role, moduleKey, action)) {
    logAudit_('ACCESS_DENIED', moduleKey, user.ID, user.Username + ' (' + user.Role + ') attempted ' + action);
    throw new Error('Access denied: your role (' + user.Role + ') cannot ' + action + ' ' + moduleKey + '.');
  }
  return user;
}

function requireSuperAdmin_() {
  var user = getCurrentUserRecord_();
  if (!user || user.Role !== ROLES.SUPER_ADMIN) {
    logAudit_('ACCESS_DENIED', 'settings', user ? user.ID : 'anonymous', 'Non-SuperAdmin attempted a SuperAdmin-only action');
    throw new Error('Access denied: this action requires the SuperAdmin role.');
  }
  return user;
}

/** Turns a plaintext password into a salted SHA-256 hex digest — no external crypto library needed. */
function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, '');
}
function hashPassword_(password, salt) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + String(salt));
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

/** Mints a session token for a just-authenticated user: one row in Sessions + a fast-path cache entry. */
function createSession_(userId) {
  var token = Utilities.getUuid();
  var expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 3600 * 1000).toISOString();
  insertRow_(SHEETS.SESSIONS, { Token: token, UserID: userId, CreatedAt: nowIso_(), ExpiresAt: expiresAt }, 'SES');
  CacheService.getScriptCache().put('sess_' + token, JSON.stringify({ userId: userId, expiresAt: expiresAt }), 21600);
  return { token: token, expiresAt: expiresAt };
}

/** Validates a session token (cache first, Sessions sheet fallback) and returns the signed-in user. Throws if invalid/expired. */
function requireSession_(token) {
  if (isBlank_(token)) throw new Error('Your session has expired. Please sign in again.');
  var cache = CacheService.getScriptCache();
  var cached = cache.get('sess_' + token);
  var session = null;
  if (cached) {
    session = JSON.parse(cached);
  } else {
    var row = readAll_(SHEETS.SESSIONS).filter(function (r) { return r.Token === token; })[0];
    if (row) session = { userId: row.UserID, expiresAt: row.ExpiresAt };
  }
  if (!session || new Date(session.expiresAt) < new Date()) {
    destroySession_(token);
    throw new Error('Your session has expired. Please sign in again.');
  }
  var user = getById_(SHEETS.USERS, session.userId);
  if (!user || !toBool_(user.Active)) throw new Error('Your account is no longer active.');
  return user;
}

function destroySession_(token) {
  CacheService.getScriptCache().remove('sess_' + token);
  var row = readAll_(SHEETS.SESSIONS).filter(function (r) { return r.Token === token; })[0];
  if (row) deleteRow_(SHEETS.SESSIONS, row.ID);
}

function modulePermissionsFor_(role) {
  var modules = {};
  Object.keys(MODULE_PERMISSIONS).forEach(function (key) { modules[key] = roleCan_(role, key, 'view'); });
  return modules;
}

function logAudit_(action, entity, recordId, details) {
  try {
    insertRow_(SHEETS.AUDIT_LOG, {
      Timestamp: nowIso_(),
      UserEmail: currentUserEmail_(),
      Action: action,
      Entity: entity,
      RecordID: recordId || '',
      Details: sanitizeText_(details || '')
    }, 'AUD');
  } catch (e) {
    console.error('logAudit_ failed', e);
  }
}

/** Client-callable, no session required: authenticates a username/password and mints a session token. */
function login(username, password) {
  return safeCall_('login', function () {
    checkRateLimit_('login_' + String(username || '').toLowerCase(), 8, 300);
    requireFields_({ username: username, password: password }, ['username', 'password']);
    var match = readAll_(SHEETS.USERS).filter(function (u) {
      return String(u.Username || '').toLowerCase() === String(username).toLowerCase();
    })[0];
    if (!match || !toBool_(match.Active) || hashPassword_(password, match.PasswordSalt) !== match.PasswordHash) {
      logAudit_('LOGIN_FAILED', 'Session', match ? match.ID : 'unknown', 'Failed login attempt for "' + sanitizeText_(username) + '"');
      throw new Error('Invalid username or password.');
    }
    var session = createSession_(match.ID);
    updateRow_(SHEETS.USERS, match.ID, { LastLogin: nowIso_() });
    __CTX_USER = match; // briefly, so logAudit_'s "who did this" column reads the right username
    logAudit_('LOGIN', 'Session', match.ID, match.Username + ' signed in');
    __CTX_USER = null;
    return {
      token: session.token, expiresAt: session.expiresAt, username: match.Username, fullName: match.FullName,
      role: match.Role, orgName: getSetting_('OrgName', APP_NAME), modules: modulePermissionsFor_(match.Role)
    };
  });
}

/** Client-callable, no session required: invalidates a token so the next page load shows the login screen. */
function logout(token) {
  return safeCall_('logout', function () {
    if (!isBlank_(token)) destroySession_(token);
    return { ok: true };
  });
}

/** Client-callable, called with the token as an explicit argument (not via api()): re-hydrates the shell after a page reload. */
function getSessionInfo(token) {
  return safeCall_('getSessionInfo', function () {
    var user = requireSession_(token);
    return {
      token: token, username: user.Username, fullName: user.FullName, role: user.Role,
      orgName: getSetting_('OrgName', APP_NAME), modules: modulePermissionsFor_(user.Role)
    };
  });
}

/**
 * Whitelist of every function reachable from the browser through api().
 * Nothing outside this map is callable by name from the client — internal
 * `_`-suffixed helpers and raw sheet access stay server-only.
 */
var API_REGISTRY = {
  listMembers: listMembers, getMember: getMember, saveMember: saveMember, deleteMember: deleteMember,
  transferMember: transferMember, uploadMemberPhoto: uploadMemberPhoto, uploadMemberDocument: uploadMemberDocument,
  removeMemberDocument: removeMemberDocument, getCustomFieldsConfig: getCustomFieldsConfig,
  saveCustomFieldsConfig: saveCustomFieldsConfig,
  getDashboardData: getDashboardData,
  listVisitors: listVisitors, saveVisitor: saveVisitor, deleteVisitor: deleteVisitor,
  convertVisitorToMember: convertVisitorToMember,
  listAttendance: listAttendance, getMemberQrUrl: getMemberQrUrl, recordAttendance: recordAttendance,
  deleteAttendance: deleteAttendance,
  listFinance: listFinance, saveFinanceRecord: saveFinanceRecord, deleteFinanceRecord: deleteFinanceRecord,
  listCampaigns: listCampaigns, saveCampaign: saveCampaign, listPledges: listPledges, savePledge: savePledge,
  listExpenses: listExpenses, saveExpense: saveExpense, decideExpense: decideExpense,
  uploadExpenseReceipt: uploadExpenseReceipt, getFinanceSummary: getFinanceSummary,
  generateDonorStatement: generateDonorStatement,
  listSmsTemplates: listSmsTemplates, saveSmsTemplate: saveSmsTemplate, deleteSmsTemplate: deleteSmsTemplate,
  getSmsGroupOptions: getSmsGroupOptions, sendBulkSms: sendBulkSms, sendSingleSms: sendSingleSms,
  listSmsLog: listSmsLog, toggleMemberSmsOptOut: toggleMemberSmsOptOut,
  listEquipment: listEquipment, saveEquipment: saveEquipment, deleteEquipment: deleteEquipment,
  getAttendanceReport: getAttendanceReport, getGrowthReport: getGrowthReport,
  getClusterEffectivenessReport: getClusterEffectivenessReport, getMemberEngagementReport: getMemberEngagementReport,
  exportSheetCsv: exportSheetCsv,
  listClusters: listClusters, saveCluster: saveCluster, deleteCluster: deleteCluster,
  listClusterFollowUps: listClusterFollowUps, saveClusterFollowUp: saveClusterFollowUp,
  deleteClusterFollowUp: deleteClusterFollowUp,
  listPrayerRequests: listPrayerRequests, updatePrayerRequest: updatePrayerRequest,
  listMessageThreads: listMessageThreads, createMessageThread: createMessageThread,
  listThreadMessages: listThreadMessages, sendMessage: sendMessage, listMessagingContacts: listMessagingContacts,
  sendCustomEventReminder: sendCustomEventReminder,
  getSettings: getSettings, saveSettings: saveSettings, runBackupNow: runBackupNow,
  archiveOldRecords: archiveOldRecords, listUsers: listUsers, saveUser: saveUser, deleteUser: deleteUser,
  changeMyPassword: changeMyPassword, getAuditLog: getAuditLog,
  getWebAppUrl: getWebAppUrl
};

/**
 * Single dispatcher for every authenticated client call:
 * google.script.run.api(token, 'listMembers', [...args]). login(), logout(),
 * getSessionInfo(), publicCheckIn() and submitPrayerRequest() are called
 * directly by the client and are not routed through here.
 */
function api(token, fnName, args) {
  return safeCall_('api:' + fnName, function () {
    var user = requireSession_(token);
    var fn = API_REGISTRY[fnName];
    if (!fn) throw new Error('Unknown function: ' + fnName);
    __CTX_USER = user;
    try {
      return fn.apply(null, args || []);
    } finally {
      __CTX_USER = null;
    }
  });
}

/** Client-callable, SuperAdmin/Admin only: list + manage the Users/Roles sheet. Password hash/salt never leave the server. */
function listUsers() {
  return safeCall_('listUsers', function () {
    requireRole_('settings', 'view');
    return readAll_(SHEETS.USERS).map(function (u) {
      var copy = {};
      Object.keys(u).forEach(function (k) { if (k !== 'PasswordHash' && k !== 'PasswordSalt') copy[k] = u[k]; });
      return copy;
    });
  });
}

/** Creates or updates a user. `data.Password` is required when creating, optional on edit (set only to change it). */
function saveUser(data) {
  return safeCall_('saveUser', function () {
    requireRole_('settings', 'mutate');
    requireFields_(data, ['Username', 'FullName', 'Role']);
    requireEnum_(data.Role, ALL_ROLES, 'Role');
    if (!isValidEmail_(data.Email)) throw new Error('Invalid email address.');
    var username = sanitizeText_(data.Username).toLowerCase().replace(/\s+/g, '');
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('Username must be 3-40 characters: letters, numbers, dot, dash or underscore.');
    var dupe = readAll_(SHEETS.USERS).filter(function (u) { return u.Username.toLowerCase() === username && u.ID !== data.ID; })[0];
    if (dupe) throw new Error('That username is already taken.');

    var payload = {
      Username: username,
      FullName: sanitizeText_(data.FullName),
      Role: data.Role,
      Active: data.Active === false ? 'FALSE' : 'TRUE',
      Phone: sanitizeText_(data.Phone || ''),
      Email: sanitizeText_(data.Email || '')
    };
    if (data.Password) {
      if (String(data.Password).length < 8) throw new Error('Password must be at least 8 characters.');
      var salt = generateSalt_();
      payload.PasswordSalt = salt;
      payload.PasswordHash = hashPassword_(data.Password, salt);
    }

    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.USERS, data.ID, payload);
      logAudit_('UPDATE', 'Users', data.ID, 'Updated user ' + payload.Username);
    } else {
      if (!data.Password) throw new Error('A password is required for new users.');
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.USERS, payload, ID_PREFIX.USERS);
      logAudit_('CREATE', 'Users', record.ID, 'Added user ' + payload.Username + ' as ' + payload.Role);
    }
    delete record.PasswordHash; delete record.PasswordSalt;
    return record;
  });
}

function deleteUser(id) {
  return safeCall_('deleteUser', function () {
    requireSuperAdmin_();
    deleteRow_(SHEETS.USERS, id);
    logAudit_('DELETE', 'Users', id, 'Removed user');
    return { ok: true };
  });
}

/** Client-callable: the signed-in user changes their own password. */
function changeMyPassword(oldPassword, newPassword) {
  return safeCall_('changeMyPassword', function () {
    var user = getCurrentUserRecord_();
    if (!user) throw new Error('Access denied: please sign in.');
    if (hashPassword_(oldPassword, user.PasswordSalt) !== user.PasswordHash) throw new Error('Current password is incorrect.');
    if (String(newPassword || '').length < 8) throw new Error('New password must be at least 8 characters.');
    var salt = generateSalt_();
    updateRow_(SHEETS.USERS, user.ID, { PasswordSalt: salt, PasswordHash: hashPassword_(newPassword, salt) });
    logAudit_('UPDATE', 'Users', user.ID, 'Changed own password');
    return { ok: true };
  });
}

/** Client-callable: recent audit trail, most recent first. */
function getAuditLog(limit) {
  return safeCall_('getAuditLog', function () {
    requireRole_('settings', 'view');
    var rows = readAll_(SHEETS.AUDIT_LOG);
    rows.reverse();
    return rows.slice(0, limit || 200);
  });
}

/* =============================== 5. SETUP =============================== */

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
  var seededCredentials = seedSuperAdmin_();
  ensureAttachmentsFolder_();
  installTriggers_();

  if (seededCredentials) {
    Logger.log('ChurchMS: first SuperAdmin login created — username: "%s"  password: "%s". ' +
      'This is a default password, not a secret — sign in and change it immediately from your account menu (or Settings → Users).',
      seededCredentials.username, seededCredentials.password);
  }

  return { spreadsheet: ss, url: ss.getUrl(), seededCredentials: seededCredentials };
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

/** Seeds the first login (username: admin) only if the Users sheet is empty. Returns the one-time password, or null if a SuperAdmin already exists. */
function seedSuperAdmin_() {
  var users = readAll_(SHEETS.USERS);
  if (users.length > 0) return null;
  var tempPassword = 'admin123';
  var salt = generateSalt_();
  insertRow_(SHEETS.USERS, {
    Username: 'admin',
    PasswordHash: hashPassword_(tempPassword, salt),
    PasswordSalt: salt,
    Email: '',
    FullName: 'System Administrator',
    Role: ROLES.SUPER_ADMIN,
    Active: 'TRUE',
    Phone: '',
    CreatedAt: nowIso_()
  }, ID_PREFIX.USERS);
  return { username: 'admin', password: tempPassword };
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

/* ============================== 6. ROUTING ============================== */

/**
 * doGet — the single entry point. `pageMode` (passed into the Index
 * template) decides which section of Index.html renders:
 *   app     -> the app shell, holding both the login form and the admin
 *              dashboard; client-side JS picks between them based on
 *              whether a valid session token is stored in the browser
 *   checkin -> public, mobile-friendly attendance check-in (QR link target)
 *   prayer  -> public prayer request submission form
 * Authentication is username/password (see login()/api() below), not a
 * Google account — doGet itself never checks identity.
 */
function doGet(e) {
  try {
    var page = (e && e.parameter && e.parameter.page) || 'app';
    var tmpl = HtmlService.createTemplateFromFile('Index');
    tmpl.orgName = getSetting_('OrgName', APP_NAME);
    tmpl.memberId = (e && e.parameter && e.parameter.id) || '';
    // 'app' always renders the same shell — it holds both the login form and the
    // dashboard; client-side JS (a stored session token) decides which one shows.
    tmpl.pageMode = (page === 'checkin') ? 'checkin' : (page === 'prayer') ? 'prayer' : 'app';

    return tmpl.evaluate()
      .setTitle(getSetting_('OrgName', APP_NAME) + ' | ' + APP_TAGLINE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    logError_('doGet', err);
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center;color:#333">' +
      '<h2>Something went wrong</h2><p>' + sanitizeText_(err.message) + '</p></div>'
    );
  }
}

/** Client-callable convenience so the frontend can build check-in / prayer links without hardcoding the URL. */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/* ============================ MEMBERS ============================ */

/**
 * Members.gs
 * Member profile CRUD, admin-defined custom fields, Drive-backed photo/document
 * attachments, and the append-only status-history log.
 */

function listMembers() {
  return safeCall_('listMembers', function () {
    requireRole_('members', 'view');
    return readAll_(SHEETS.MEMBERS).sort(function (a, b) {
      return (a.LastName || '').localeCompare(b.LastName || '');
    });
  });
}

function getMember(id) {
  return safeCall_('getMember', function () {
    requireRole_('members', 'view');
    var m = getById_(SHEETS.MEMBERS, id);
    if (!m) throw new Error('Member not found.');
    m.History = readAll_(SHEETS.MEMBER_STATUS_HISTORY).filter(function (h) { return h.MemberID === id; });
    return m;
  });
}

function validateMemberPayload_(data) {
  requireFields_(data, ['FirstName', 'LastName', 'Phone']);
  if (!isValidPhone_(data.Phone)) throw new Error('Enter a valid phone number.');
  if (!isValidEmail_(data.Email)) throw new Error('Enter a valid email address.');
  if (!isValidDate_(data.DOB)) throw new Error('Enter a valid date of birth.');
  requireEnum_(data.Gender, OPTIONS.GENDER, 'Gender');
  requireEnum_(data.MaritalStatus, OPTIONS.MARITAL_STATUS, 'Marital status');
  requireEnum_(data.MembershipStatus, OPTIONS.MEMBERSHIP_STATUS, 'Membership status');
}

/** Create or update a member. `data.CustomFieldValues` (object) is stringified into the CustomFields column. */
function saveMember(data) {
  return safeCall_('saveMember', function () {
    var actingUser = requireRole_('members', 'mutate');
    validateMemberPayload_(data);

    var payload = {
      FirstName: sanitizeText_(data.FirstName),
      LastName: sanitizeText_(data.LastName),
      Gender: data.Gender || '',
      DOB: data.DOB || '',
      Phone: normalizePhone_(data.Phone),
      Email: sanitizeText_(data.Email || ''),
      Address: sanitizeText_(data.Address || ''),
      MaritalStatus: data.MaritalStatus || '',
      EmergencyContactName: sanitizeText_(data.EmergencyContactName || ''),
      EmergencyContactPhone: normalizePhone_(data.EmergencyContactPhone || ''),
      MembershipDate: data.MembershipDate || '',
      MembershipClass: sanitizeText_(data.MembershipClass || ''),
      Cluster: sanitizeText_(data.Cluster || ''),
      Department: sanitizeText_(data.Department || ''),
      CustomFields: JSON.stringify(data.CustomFieldValues || {}),
      SmsOptOut: data.SmsOptOut ? 'TRUE' : 'FALSE',
      Notes: sanitizeText_(data.Notes || ''),
      UpdatedAt: nowIso_(),
      UpdatedBy: actingUser.Username
    };

    var record;
    if (data.ID) {
      var existing = getById_(SHEETS.MEMBERS, data.ID);
      if (!existing) throw new Error('Member not found.');
      var newStatus = data.MembershipStatus || existing.MembershipStatus;
      if (newStatus !== existing.MembershipStatus) {
        recordStatusChange_(data.ID, existing.FirstName + ' ' + existing.LastName, existing.MembershipStatus, newStatus, data.StatusChangeReason || '');
      }
      payload.MembershipStatus = newStatus;
      record = updateRow_(SHEETS.MEMBERS, data.ID, payload);
      logAudit_('UPDATE', 'Members', data.ID, 'Updated member ' + payload.FirstName + ' ' + payload.LastName);
    } else {
      payload.MembershipStatus = data.MembershipStatus || 'New';
      payload.PhotoFileId = '';
      payload.DocumentLinks = '[]';
      payload.CreatedAt = nowIso_();
      payload.CreatedBy = actingUser.Username;
      record = insertRow_(SHEETS.MEMBERS, payload, ID_PREFIX.MEMBERS);
      recordStatusChange_(record.ID, payload.FirstName + ' ' + payload.LastName, '', payload.MembershipStatus, 'Onboarded');
      logAudit_('CREATE', 'Members', record.ID, 'Added member ' + payload.FirstName + ' ' + payload.LastName);
    }
    return record;
  });
}

function recordStatusChange_(memberId, memberName, oldStatus, newStatus, reason) {
  insertRow_(SHEETS.MEMBER_STATUS_HISTORY, {
    MemberID: memberId,
    MemberName: memberName,
    OldStatus: oldStatus,
    NewStatus: newStatus,
    Reason: sanitizeText_(reason || ''),
    ChangedBy: currentUserEmail_(),
    ChangedAt: nowIso_()
  }, ID_PREFIX.MEMBER_STATUS_HISTORY);
}

function deleteMember(id) {
  return safeCall_('deleteMember', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, id);
    deleteRow_(SHEETS.MEMBERS, id);
    logAudit_('DELETE', 'Members', id, 'Removed member ' + (m ? m.FirstName + ' ' + m.LastName : id));
    return { ok: true };
  });
}

/** Transfer a member: logs the transfer as a status change and marks them Transferred. */
function transferMember(id, destination, reason) {
  return safeCall_('transferMember', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, id);
    if (!m) throw new Error('Member not found.');
    recordStatusChange_(id, m.FirstName + ' ' + m.LastName, m.MembershipStatus, 'Transferred', 'To: ' + sanitizeText_(destination) + '. ' + sanitizeText_(reason || ''));
    var record = updateRow_(SHEETS.MEMBERS, id, { MembershipStatus: 'Transferred', UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', id, 'Transferred to ' + destination);
    return record;
  });
}

/** Uploads a base64-encoded photo to Drive and links it on the member record. */
function uploadMemberPhoto(memberId, base64Data, mimeType, filename) {
  return safeCall_('uploadMemberPhoto', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    if (m.PhotoFileId) {
      try { DriveApp.getFileById(m.PhotoFileId).setTrashed(true); } catch (e) { /* already gone */ }
    }
    updateRow_(SHEETS.MEMBERS, memberId, { PhotoFileId: file.getId(), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', memberId, 'Uploaded profile photo');
    return { fileId: file.getId(), url: 'https://drive.google.com/uc?id=' + file.getId() };
  });
}

/** Uploads a base64-encoded document (baptism cert, etc.) and appends it to the member's DocumentLinks JSON array. */
function uploadMemberDocument(memberId, base64Data, mimeType, filename, label) {
  return safeCall_('uploadMemberDocument', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    var docs = [];
    try { docs = JSON.parse(m.DocumentLinks || '[]'); } catch (e) { docs = []; }
    docs.push({ fileId: file.getId(), name: filename, label: label || filename, uploadedAt: nowIso_() });
    updateRow_(SHEETS.MEMBERS, memberId, { DocumentLinks: JSON.stringify(docs), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', memberId, 'Uploaded document: ' + (label || filename));
    return docs;
  });
}

function removeMemberDocument(memberId, fileId) {
  return safeCall_('removeMemberDocument', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var docs = [];
    try { docs = JSON.parse(m.DocumentLinks || '[]'); } catch (e) { docs = []; }
    docs = docs.filter(function (d) { return d.fileId !== fileId; });
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* already gone */ }
    updateRow_(SHEETS.MEMBERS, memberId, { DocumentLinks: JSON.stringify(docs), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    return docs;
  });
}

/** Admin-defined extra Member columns, stored as JSON in the Settings sheet. */
function getCustomFieldsConfig() {
  return safeCall_('getCustomFieldsConfig', function () {
    requireRole_('members', 'view');
    try { return JSON.parse(getSetting_('CustomFieldsConfig', '[]')); } catch (e) { return []; }
  });
}

function saveCustomFieldsConfig(fields) {
  return safeCall_('saveCustomFieldsConfig', function () {
    requireRole_('settings', 'mutate');
    if (!Array.isArray(fields)) throw new Error('Invalid custom fields payload.');
    fields.forEach(function (f) { requireFields_(f, ['key', 'label', 'type']); });
    setSetting_('CustomFieldsConfig', JSON.stringify(fields));
    logAudit_('UPDATE', 'Settings', 'CustomFieldsConfig', 'Updated member custom fields (' + fields.length + ')');
    return fields;
  });
}

/** Simple, rule-based engagement score used by the dashboard/reports: attendance + giving + activity. */
function computeMemberEngagementScore_(memberId) {
  var attendance = readAll_(SHEETS.ATTENDANCE).filter(function (a) { return a.MemberID === memberId; });
  var giving = readAll_(SHEETS.FINANCE).filter(function (f) { return f.DonorMemberID === memberId; });
  var recentCutoff = Date.now() - 90 * 24 * 3600 * 1000;
  var recentAttendance = attendance.filter(function (a) { return new Date(a.ServiceDate).getTime() > recentCutoff; }).length;
  var recentGiving = giving.filter(function (f) { return new Date(f.Date).getTime() > recentCutoff; }).length;
  var score = Math.min(60, recentAttendance * 5) + Math.min(30, recentGiving * 6) + (attendance.length > 0 ? 10 : 0);
  return Math.round(score);
}

/* ============================ DASHBOARD ============================ */

/**
 * Dashboard.gs
 * Aggregation functions feeding the dashboard's KPI cards, Google Charts,
 * alerts panel and birthday/anniversary widget. Read-only.
 */

function getDashboardData() {
  return safeCall_('getDashboardData', function () {
    requireRole_('dashboard', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    var visitors = readAll_(SHEETS.VISITORS);
    var attendance = readAll_(SHEETS.ATTENDANCE);
    var finance = readAll_(SHEETS.FINANCE);
    var pledges = readAll_(SHEETS.PLEDGES);
    var expenses = readAll_(SHEETS.EXPENSES);
    var prayer = readAll_(SHEETS.PRAYER_REQUESTS);

    var activeMembers = members.filter(function (m) { return m.MembershipStatus === 'Active' || m.MembershipStatus === 'New'; });
    var thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0);
    var newThisMonth = members.filter(function (m) { return m.CreatedAt && new Date(m.CreatedAt) >= thisMonthStart; }).length;

    var last8Sundays = attendanceTrend_(attendance, 8);
    var givingTrend = givingTrend_(finance, 6);
    var memberGrowth = memberGrowth_(members, 6);

    var totalGivingThisMonth = finance.filter(function (f) { return f.Date && new Date(f.Date) >= thisMonthStart; })
      .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
    var pendingExpenses = expenses.filter(function (e) { return e.Status === 'Pending'; });
    var openPrayerRequests = prayer.filter(function (p) { return p.Status === 'New' || p.Status === 'In Progress'; });

    return {
      kpis: {
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        newThisMonth: newThisMonth,
        visitorsThisMonth: visitors.filter(function (v) { return v.CreatedAt && new Date(v.CreatedAt) >= thisMonthStart; }).length,
        lastServiceAttendance: last8Sundays.length ? last8Sundays[last8Sundays.length - 1].count : 0,
        givingThisMonth: totalGivingThisMonth,
        pendingExpenses: pendingExpenses.length,
        openPrayerRequests: openPrayerRequests.length
      },
      charts: {
        attendanceTrend: last8Sundays,
        givingTrend: givingTrend,
        memberGrowth: memberGrowth,
        statusBreakdown: statusBreakdown_(members)
      },
      alerts: buildAlerts_(pendingExpenses, openPrayerRequests, pledges, members),
      birthdays: upcomingBirthdays_(members, 14),
      anniversaries: upcomingAnniversaries_(members, 14)
    };
  });
}

function attendanceTrend_(attendance, weeks) {
  var byDate = {};
  attendance.forEach(function (a) {
    var d = (a.ServiceDate || '').split('T')[0];
    if (!d) return;
    byDate[d] = (byDate[d] || 0) + 1;
  });
  var dates = Object.keys(byDate).sort();
  var recent = dates.slice(-weeks);
  return recent.map(function (d) { return { date: d, count: byDate[d] }; });
}

function givingTrend_(finance, months) {
  var byMonth = {};
  finance.forEach(function (f) {
    if (!f.Date) return;
    var m = String(f.Date).slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + (Number(f.Amount) || 0);
  });
  var keys = Object.keys(byMonth).sort();
  var recent = keys.slice(-months);
  return recent.map(function (k) { return { month: k, amount: byMonth[k] }; });
}

function memberGrowth_(members, months) {
  var byMonth = {};
  members.forEach(function (m) {
    if (!m.CreatedAt) return;
    var k = String(m.CreatedAt).slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + 1;
  });
  var keys = Object.keys(byMonth).sort();
  var recent = keys.slice(-months);
  var running = 0;
  var before = keys.slice(0, Math.max(keys.length - months, 0)).reduce(function (s, k) { return s + byMonth[k]; }, 0);
  running = before;
  return recent.map(function (k) { running += byMonth[k]; return { month: k, total: running, added: byMonth[k] }; });
}

function statusBreakdown_(members) {
  var counts = {};
  OPTIONS.MEMBERSHIP_STATUS.forEach(function (s) { counts[s] = 0; });
  members.forEach(function (m) { counts[m.MembershipStatus] = (counts[m.MembershipStatus] || 0) + 1; });
  return Object.keys(counts).map(function (k) { return { status: k, count: counts[k] }; });
}

function buildAlerts_(pendingExpenses, openPrayerRequests, pledges, members) {
  var alerts = [];
  if (pendingExpenses.length) {
    alerts.push({ level: 'orange', text: pendingExpenses.length + ' expense claim(s) awaiting approval', link: 'finance' });
  }
  if (openPrayerRequests.length) {
    alerts.push({ level: 'blue', text: openPrayerRequests.length + ' open prayer request(s) need a response', link: 'communication' });
  }
  var overdue = pledges.filter(function (p) { return p.Status === 'Overdue'; });
  if (overdue.length) {
    alerts.push({ level: 'red', text: overdue.length + ' pledge(s) overdue', link: 'finance' });
  }
  var missingContact = members.filter(function (m) { return (m.MembershipStatus === 'Active' || m.MembershipStatus === 'New') && isBlank_(m.Phone) && isBlank_(m.Email); });
  if (missingContact.length) {
    alerts.push({ level: 'amber', text: missingContact.length + ' active member(s) have no phone or email on file', link: 'members' });
  }
  if (!alerts.length) alerts.push({ level: 'green', text: 'All caught up — no outstanding items right now.', link: '' });
  return alerts;
}

function upcomingBirthdays_(members, withinDays) {
  var today = new Date();
  return members.filter(function (m) { return !isBlank_(m.DOB); }).map(function (m) {
    var dob = new Date(m.DOB);
    var next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < stripTime_(today)) next.setFullYear(today.getFullYear() + 1);
    var days = Math.round((next - stripTime_(today)) / 86400000);
    return { id: m.ID, name: m.FirstName + ' ' + m.LastName, date: next.toISOString().split('T')[0], daysAway: days, turning: next.getFullYear() - dob.getFullYear() };
  }).filter(function (x) { return x.daysAway >= 0 && x.daysAway <= withinDays; })
    .sort(function (a, b) { return a.daysAway - b.daysAway; });
}

function upcomingAnniversaries_(members, withinDays) {
  var today = new Date();
  return members.filter(function (m) { return !isBlank_(m.MembershipDate); }).map(function (m) {
    var start = new Date(m.MembershipDate);
    var next = new Date(today.getFullYear(), start.getMonth(), start.getDate());
    if (next < stripTime_(today)) next.setFullYear(today.getFullYear() + 1);
    var days = Math.round((next - stripTime_(today)) / 86400000);
    return { id: m.ID, name: m.FirstName + ' ' + m.LastName, date: next.toISOString().split('T')[0], daysAway: days, years: next.getFullYear() - start.getFullYear() };
  }).filter(function (x) { return x.daysAway >= 0 && x.daysAway <= withinDays && x.years > 0; })
    .sort(function (a, b) { return a.daysAway - b.daysAway; });
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* ============================ VISITORS ============================ */

/**
 * Visitors.gs
 * First-time/returning visitor tracking and conversion into full Members.
 */

function listVisitors() {
  return safeCall_('listVisitors', function () {
    requireRole_('visitors', 'view');
    return readAll_(SHEETS.VISITORS).sort(function (a, b) { return new Date(b.VisitDate) - new Date(a.VisitDate); });
  });
}

function saveVisitor(data) {
  return safeCall_('saveVisitor', function () {
    var user = requireRole_('visitors', 'mutate');
    requireFields_(data, ['FirstName', 'LastName', 'VisitDate']);
    if (!isValidEmail_(data.Email)) throw new Error('Enter a valid email address.');
    if (!isValidDate_(data.VisitDate)) throw new Error('Enter a valid visit date.');
    requireEnum_(data.FollowUpStatus, OPTIONS.FOLLOW_UP_STATUS, 'Follow-up status');

    var payload = {
      FirstName: sanitizeText_(data.FirstName),
      LastName: sanitizeText_(data.LastName),
      Phone: normalizePhone_(data.Phone || ''),
      Email: sanitizeText_(data.Email || ''),
      Address: sanitizeText_(data.Address || ''),
      VisitDate: data.VisitDate,
      HowHeard: sanitizeText_(data.HowHeard || ''),
      Interest: sanitizeText_(data.Interest || ''),
      FollowUpStatus: data.FollowUpStatus || 'New',
      AssignedTo: sanitizeText_(data.AssignedTo || ''),
      Notes: sanitizeText_(data.Notes || '')
    };

    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.VISITORS, data.ID, payload);
      logAudit_('UPDATE', 'Visitors', data.ID, 'Updated visitor ' + payload.FirstName + ' ' + payload.LastName);
    } else {
      payload.CreatedAt = nowIso_();
      payload.CreatedBy = user.Username;
      payload.ConvertedMemberID = '';
      record = insertRow_(SHEETS.VISITORS, payload, ID_PREFIX.VISITORS);
      logAudit_('CREATE', 'Visitors', record.ID, 'Logged visitor ' + payload.FirstName + ' ' + payload.LastName);
    }
    return record;
  });
}

function deleteVisitor(id) {
  return safeCall_('deleteVisitor', function () {
    requireRole_('visitors', 'mutate');
    deleteRow_(SHEETS.VISITORS, id);
    logAudit_('DELETE', 'Visitors', id, 'Removed visitor record');
    return { ok: true };
  });
}

/** Converts a visitor into a full Member record and marks the visitor row Converted. */
function convertVisitorToMember(visitorId, extra) {
  return safeCall_('convertVisitorToMember', function () {
    var user = requireRole_('members', 'mutate');
    var v = getById_(SHEETS.VISITORS, visitorId);
    if (!v) throw new Error('Visitor not found.');
    if (v.ConvertedMemberID) throw new Error('This visitor has already been converted.');

    var memberPayload = Object.assign({
      FirstName: v.FirstName,
      LastName: v.LastName,
      Phone: v.Phone,
      Email: v.Email,
      Address: v.Address,
      MembershipStatus: 'New',
      MembershipDate: new Date().toISOString().split('T')[0],
      Gender: '', MaritalStatus: '', CustomFieldValues: {}
    }, extra || {});
    var member = saveMember(memberPayload);

    updateRow_(SHEETS.VISITORS, visitorId, { FollowUpStatus: 'Converted', ConvertedMemberID: member.ID });
    logAudit_('UPDATE', 'Visitors', visitorId, 'Converted to member ' + member.ID);
    return member;
  });
}

/* ============================ ATTENDANCE ============================ */

/**
 * Attendance.gs
 * QR/manual check-in, service-type tracking, per-member history, and the
 * consecutive-absence detector used by the daily notification job.
 */

function listAttendance(filters) {
  return safeCall_('listAttendance', function () {
    requireRole_('attendance', 'view');
    var rows = readAll_(SHEETS.ATTENDANCE);
    filters = filters || {};
    if (filters.serviceDate) rows = rows.filter(function (r) { return (r.ServiceDate || '').indexOf(filters.serviceDate) === 0; });
    if (filters.serviceType) rows = rows.filter(function (r) { return r.ServiceType === filters.serviceType; });
    if (filters.memberId) rows = rows.filter(function (r) { return r.MemberID === filters.memberId; });
    return rows.sort(function (a, b) { return new Date(b.CheckInTime) - new Date(a.CheckInTime); });
  });
}

/** Returns a Google Chart QR-code image URL encoding this member's check-in link. */
function getMemberQrUrl(memberId) {
  return safeCall_('getMemberQrUrl', function () {
    requireRole_('attendance', 'view');
    var url = ScriptApp.getService().getUrl() + '?page=checkin&id=' + encodeURIComponent(memberId);
    return 'https://chart.googleapis.com/chart?cht=qr&chs=260x260&chld=M|2&chl=' + encodeURIComponent(url);
  });
}

/** Admin-side manual check-in (used from the Attendance module, not the public QR page). */
function recordAttendance(data) {
  return safeCall_('recordAttendance', function () {
    var user = requireRole_('attendance', 'mutate');
    return checkInMember_(data.MemberID, data.ServiceType, data.ServiceDate, 'Manual', user.Username, data.Notes);
  });
}

/** Public check-in used by the QR/self-service page. Rate-limited; no role required (kiosk/mobile use). */
function publicCheckIn(memberId, serviceType) {
  return safeCall_('publicCheckIn', function () {
    checkRateLimit_('checkin_' + memberId, 5, 60);
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('We could not find that member ID. Please see an usher for help.');
    var today = new Date().toISOString().split('T')[0];
    return checkInMember_(memberId, serviceType || OPTIONS.SERVICE_TYPE[0], today, 'QR', 'self-service', '');
  });
}

function checkInMember_(memberId, serviceType, serviceDate, method, recordedBy, notes) {
  requireFields_({ memberId: memberId, serviceType: serviceType, serviceDate: serviceDate }, ['memberId', 'serviceType', 'serviceDate']);
  requireEnum_(serviceType, OPTIONS.SERVICE_TYPE, 'Service type');
  var m = getById_(SHEETS.MEMBERS, memberId);
  if (!m) throw new Error('Member not found.');

  var already = readAll_(SHEETS.ATTENDANCE).some(function (a) {
    return a.MemberID === memberId && a.ServiceType === serviceType && (a.ServiceDate || '').indexOf(serviceDate) === 0;
  });
  if (already) throw new Error(m.FirstName + ' is already checked in for this service.');

  var record = insertRow_(SHEETS.ATTENDANCE, {
    MemberID: memberId,
    MemberName: m.FirstName + ' ' + m.LastName,
    ServiceType: serviceType,
    ServiceDate: serviceDate,
    CheckInTime: nowIso_(),
    CheckInMethod: method,
    RecordedBy: recordedBy,
    Notes: sanitizeText_(notes || '')
  }, ID_PREFIX.ATTENDANCE);
  logAudit_('CREATE', 'Attendance', record.ID, m.FirstName + ' ' + m.LastName + ' checked in (' + method + ') for ' + serviceType);
  return record;
}

function deleteAttendance(id) {
  return safeCall_('deleteAttendance', function () {
    requireRole_('attendance', 'mutate');
    deleteRow_(SHEETS.ATTENDANCE, id);
    logAudit_('DELETE', 'Attendance', id, 'Removed attendance record');
    return { ok: true };
  });
}

/** Members who have zero attendance in the last N Sundays — used by Notifications.gs for absence alerts. */
function findAbsentMembers_(consecutiveWeeks) {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var attendance = readAll_(SHEETS.ATTENDANCE);
  var cutoff = Date.now() - consecutiveWeeks * 7 * 24 * 3600 * 1000;
  return members.filter(function (m) {
    var recent = attendance.some(function (a) { return a.MemberID === m.ID && new Date(a.ServiceDate).getTime() > cutoff; });
    return !recent;
  });
}

/* ============================ FINANCE ============================ */

/**
 * Finance.gs
 * Giving records, campaigns, pledges (with computed progress), expense
 * approval workflow, and PDF donor statements.
 */

/* ---------- Giving / Donations ---------- */

function listFinance(filters) {
  return safeCall_('listFinance', function () {
    requireRole_('finance', 'view');
    var rows = readAll_(SHEETS.FINANCE);
    filters = filters || {};
    if (filters.from) rows = rows.filter(function (r) { return r.Date >= filters.from; });
    if (filters.to) rows = rows.filter(function (r) { return r.Date <= filters.to; });
    if (filters.type) rows = rows.filter(function (r) { return r.Type === filters.type; });
    if (filters.memberId) rows = rows.filter(function (r) { return r.DonorMemberID === filters.memberId; });
    return rows.sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  });
}

function saveFinanceRecord(data) {
  return safeCall_('saveFinanceRecord', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['Type', 'Amount', 'PaymentMethod', 'Date']);
    if (!isNumber_(data.Amount) || Number(data.Amount) <= 0) throw new Error('Amount must be a positive number.');
    requireEnum_(data.Type, OPTIONS.FINANCE_TYPE, 'Type');
    requireEnum_(data.PaymentMethod, OPTIONS.PAYMENT_METHOD, 'Payment method');
    if (!isValidDate_(data.Date)) throw new Error('Enter a valid date.');

    var donorName = data.DonorName;
    if (data.DonorMemberID) {
      var m = getById_(SHEETS.MEMBERS, data.DonorMemberID);
      if (m) donorName = m.FirstName + ' ' + m.LastName;
    }

    var payload = {
      Type: data.Type,
      DonorMemberID: data.DonorMemberID || '',
      DonorName: sanitizeText_(donorName || 'Anonymous'),
      Amount: Number(data.Amount),
      PaymentMethod: data.PaymentMethod,
      CampaignID: data.CampaignID || '',
      Recurring: data.Recurring ? 'TRUE' : 'FALSE',
      Date: data.Date,
      ReceiptNumber: data.ReceiptNumber || ('RCT-' + Date.now()),
      RecordedBy: user.Username,
      Notes: sanitizeText_(data.Notes || '')
    };

    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.FINANCE, data.ID, payload);
      logAudit_('UPDATE', 'Finance', data.ID, 'Updated giving record');
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.FINANCE, payload, ID_PREFIX.FINANCE);
      logAudit_('CREATE', 'Finance', record.ID, payload.Type + ' of ' + payload.Amount + ' from ' + payload.DonorName);
      if (data.PledgeID) applyPaymentToPledge_(data.PledgeID, Number(data.Amount));
    }
    return record;
  });
}

function deleteFinanceRecord(id) {
  return safeCall_('deleteFinanceRecord', function () {
    requireRole_('finance', 'mutate');
    deleteRow_(SHEETS.FINANCE, id);
    logAudit_('DELETE', 'Finance', id, 'Removed giving record');
    return { ok: true };
  });
}

/* ---------- Campaigns ---------- */

function listCampaigns() {
  return safeCall_('listCampaigns', function () {
    requireRole_('finance', 'view');
    return readAll_(SHEETS.CAMPAIGNS);
  });
}

function saveCampaign(data) {
  return safeCall_('saveCampaign', function () {
    requireRole_('finance', 'mutate');
    requireFields_(data, ['Name', 'Goal']);
    if (!isNumber_(data.Goal)) throw new Error('Goal must be a number.');
    var payload = { Name: sanitizeText_(data.Name), Goal: Number(data.Goal), StartDate: data.StartDate || '', EndDate: data.EndDate || '', Status: data.Status || 'Active' };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CAMPAIGNS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CAMPAIGNS, payload, ID_PREFIX.CAMPAIGNS);
    }
    logAudit_('UPDATE', 'Campaigns', record.ID, 'Saved campaign ' + payload.Name);
    return record;
  });
}

/* ---------- Pledges ---------- */

function listPledges() {
  return safeCall_('listPledges', function () {
    requireRole_('finance', 'view');
    var pledges = readAll_(SHEETS.PLEDGES);
    var finance = readAll_(SHEETS.FINANCE);
    return pledges.map(function (p) {
      var paid = finance.filter(function (f) { return f.CampaignID === p.CampaignID && f.DonorMemberID === p.MemberID; })
        .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
      return Object.assign({}, p, { PaidAmount: paid, Balance: Math.max(0, Number(p.PledgedAmount) - paid), PercentPaid: p.PledgedAmount ? Math.min(100, Math.round(paid / Number(p.PledgedAmount) * 100)) : 0 });
    });
  });
}

function savePledge(data) {
  return safeCall_('savePledge', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['MemberID', 'CampaignID', 'PledgedAmount']);
    if (!isNumber_(data.PledgedAmount) || Number(data.PledgedAmount) <= 0) throw new Error('Pledged amount must be positive.');
    var m = getById_(SHEETS.MEMBERS, data.MemberID);
    var c = getById_(SHEETS.CAMPAIGNS, data.CampaignID);
    if (!m) throw new Error('Member not found.');
    if (!c) throw new Error('Campaign not found.');
    requireEnum_(data.Status, OPTIONS.PLEDGE_STATUS, 'Status');

    var payload = {
      MemberID: data.MemberID, MemberName: m.FirstName + ' ' + m.LastName,
      CampaignID: data.CampaignID, CampaignName: c.Name,
      PledgedAmount: Number(data.PledgedAmount), StartDate: data.StartDate || '', EndDate: data.EndDate || '',
      Status: data.Status || 'Active', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.PLEDGES, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_(); payload.CreatedBy = user.Username;
      record = insertRow_(SHEETS.PLEDGES, payload, ID_PREFIX.PLEDGES);
    }
    logAudit_('UPDATE', 'Pledges', record.ID, 'Saved pledge for ' + payload.MemberName);
    return record;
  });
}

function applyPaymentToPledge_(pledgeId, amount) {
  var p = getById_(SHEETS.PLEDGES, pledgeId);
  if (!p) return;
  var finance = readAll_(SHEETS.FINANCE);
  var paid = finance.filter(function (f) { return f.CampaignID === p.CampaignID && f.DonorMemberID === p.MemberID; })
    .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
  if (paid >= Number(p.PledgedAmount) && p.Status !== 'Fulfilled') {
    updateRow_(SHEETS.PLEDGES, pledgeId, { Status: 'Fulfilled' });
  }
}

/* ---------- Expenses (approval workflow) ---------- */

function listExpenses() {
  return safeCall_('listExpenses', function () {
    requireRole_('finance', 'view');
    return readAll_(SHEETS.EXPENSES).sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  });
}

function saveExpense(data) {
  return safeCall_('saveExpense', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['Category', 'Description', 'Amount', 'Date']);
    if (!isNumber_(data.Amount) || Number(data.Amount) <= 0) throw new Error('Amount must be a positive number.');

    var payload = {
      Category: sanitizeText_(data.Category), Department: sanitizeText_(data.Department || ''),
      Description: sanitizeText_(data.Description), Amount: Number(data.Amount), Date: data.Date,
      BudgetLine: sanitizeText_(data.BudgetLine || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.EXPENSES, data.ID, payload);
    } else {
      payload.Status = 'Pending'; payload.RequestedBy = user.Username; payload.ApprovedBy = '';
      payload.ReceiptFileId = ''; payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.EXPENSES, payload, ID_PREFIX.EXPENSES);
    }
    logAudit_('UPDATE', 'Expenses', record.ID, 'Saved expense claim: ' + payload.Description);
    return record;
  });
}

function decideExpense(id, decision) {
  return safeCall_('decideExpense', function () {
    var user = requireRole_('finance', 'mutate');
    requireEnum_(decision, ['Approved', 'Rejected'], 'Decision');
    var record = updateRow_(SHEETS.EXPENSES, id, { Status: decision, ApprovedBy: user.Username });
    logAudit_('UPDATE', 'Expenses', id, decision + ' by ' + user.Username);
    return record;
  });
}

function uploadExpenseReceipt(id, base64Data, mimeType, filename) {
  return safeCall_('uploadExpenseReceipt', function () {
    requireRole_('finance', 'mutate');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    updateRow_(SHEETS.EXPENSES, id, { ReceiptFileId: file.getId() });
    return { fileId: file.getId() };
  });
}

/* ---------- Reporting ---------- */

function getFinanceSummary(from, to) {
  return safeCall_('getFinanceSummary', function () {
    requireRole_('finance', 'view');
    var finance = readAll_(SHEETS.FINANCE).filter(inRange_(from, to, 'Date'));
    var expenses = readAll_(SHEETS.EXPENSES).filter(function (e) { return e.Status === 'Approved'; }).filter(inRange_(from, to, 'Date'));
    var totalGiving = finance.reduce(function (s, f) { return s + Number(f.Amount || 0); }, 0);
    var totalExpense = expenses.reduce(function (s, e) { return s + Number(e.Amount || 0); }, 0);
    var byType = {};
    finance.forEach(function (f) { byType[f.Type] = (byType[f.Type] || 0) + Number(f.Amount || 0); });
    var byCategory = {};
    expenses.forEach(function (e) { byCategory[e.Category] = (byCategory[e.Category] || 0) + Number(e.Amount || 0); });
    var byDept = {};
    expenses.forEach(function (e) { var d = e.Department || 'Unassigned'; byDept[d] = (byDept[d] || 0) + Number(e.Amount || 0); });
    return {
      totalGiving: totalGiving, totalExpense: totalExpense, net: totalGiving - totalExpense,
      byType: byType, byCategory: byCategory, byDepartment: byDept,
      givingCount: finance.length, expenseCount: expenses.length
    };
  });
}

function inRange_(from, to, field) {
  return function (row) {
    if (from && row[field] < from) return false;
    if (to && row[field] > to) return false;
    return true;
  };
}

/** Generates a donor statement PDF (via Google Docs template render) and returns a Drive download URL. */
function generateDonorStatement(memberId, from, to) {
  return safeCall_('generateDonorStatement', function () {
    requireRole_('finance', 'view');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var rows = readAll_(SHEETS.FINANCE).filter(function (f) { return f.DonorMemberID === memberId; }).filter(inRange_(from, to, 'Date'))
      .sort(function (a, b) { return new Date(a.Date) - new Date(b.Date); });
    var total = rows.reduce(function (s, r) { return s + Number(r.Amount || 0); }, 0);

    var doc = DocumentApp.create('Donor Statement - ' + m.FirstName + ' ' + m.LastName + ' - ' + new Date().getTime());
    var body = doc.getBody();
    body.appendParagraph(getSetting_('OrgName', APP_NAME)).setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph('Donor Statement').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('Donor: ' + m.FirstName + ' ' + m.LastName);
    body.appendParagraph('Period: ' + (from || 'all time') + ' to ' + (to || 'present'));
    body.appendParagraph('Generated: ' + new Date().toDateString());
    body.appendParagraph('');
    var table = [['Date', 'Type', 'Method', 'Amount', 'Receipt #']];
    rows.forEach(function (r) { table.push([r.Date, r.Type, r.PaymentMethod, formatMoney_(r.Amount), r.ReceiptNumber]); });
    table.push(['', '', 'Total', formatMoney_(total), '']);
    body.appendTable(table);
    doc.saveAndClose();

    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    file.moveTo(folder);
    var pdfBlob = file.getAs('application/pdf');
    var pdfFile = folder.createFile(pdfBlob);
    file.setTrashed(true); // keep only the PDF
    pdfFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    logAudit_('CREATE', 'Finance', memberId, 'Generated donor statement PDF');
    return { fileId: pdfFile.getId(), url: pdfFile.getUrl(), total: total, count: rows.length };
  });
}

/* ============================ SMS ============================ */

/**
 * SMS.gs
 * Provider-agnostic bulk SMS: group messaging, templates, scheduling,
 * delivery logging and opt-out enforcement. The actual `UrlFetchApp` call is
 * isolated per provider (Arkesel, Hubtel, or a configurable custom gateway)
 * behind sendViaProvider_() so switching providers never touches callers.
 */

/* ---------- Templates ---------- */

function listSmsTemplates() {
  return safeCall_('listSmsTemplates', function () {
    requireRole_('sms', 'view');
    return readAll_(SHEETS.SMS_TEMPLATES);
  });
}

function saveSmsTemplate(data) {
  return safeCall_('saveSmsTemplate', function () {
    var user = requireRole_('sms', 'mutate');
    requireFields_(data, ['Name', 'Body']);
    var payload = { Name: sanitizeText_(data.Name), Body: sanitizeText_(data.Body) };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.SMS_TEMPLATES, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_(); payload.CreatedBy = user.Username;
      record = insertRow_(SHEETS.SMS_TEMPLATES, payload, ID_PREFIX.SMS_TEMPLATES);
    }
    return record;
  });
}

function deleteSmsTemplate(id) {
  return safeCall_('deleteSmsTemplate', function () {
    requireRole_('sms', 'mutate');
    deleteRow_(SHEETS.SMS_TEMPLATES, id);
    return { ok: true };
  });
}

/* ---------- Recipient resolution ---------- */

/** group: 'all' | 'active' | 'new' | 'visitors' | 'cluster:<name>' | 'department:<name>' */
function resolveSmsRecipients_(group) {
  var members = readAll_(SHEETS.MEMBERS);
  var pool;
  if (group === 'visitors') {
    pool = readAll_(SHEETS.VISITORS).map(function (v) { return { ID: v.ID, FirstName: v.FirstName, LastName: v.LastName, Phone: v.Phone, SmsOptOut: 'FALSE' }; });
  } else if (group === 'active') {
    pool = members.filter(function (m) { return m.MembershipStatus === 'Active'; });
  } else if (group === 'new') {
    pool = members.filter(function (m) { return m.MembershipStatus === 'New'; });
  } else if (group && group.indexOf('cluster:') === 0) {
    var clusterName = group.slice(8);
    pool = members.filter(function (m) { return m.Cluster === clusterName; });
  } else if (group && group.indexOf('department:') === 0) {
    var dept = group.slice(11);
    pool = members.filter(function (m) { return m.Department === dept; });
  } else {
    pool = members;
  }
  return pool.filter(function (m) { return isValidPhone_(m.Phone) && !toBool_(m.SmsOptOut); });
}

function getSmsGroupOptions() {
  return safeCall_('getSmsGroupOptions', function () {
    requireRole_('sms', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    var clusters = uniq_(members.map(function (m) { return m.Cluster; }).filter(Boolean));
    var departments = uniq_(members.map(function (m) { return m.Department; }).filter(Boolean));
    return { clusters: clusters, departments: departments };
  });
}

function uniq_(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

/* ---------- Send / schedule ---------- */

function sendBulkSms(group, message, scheduledFor) {
  return safeCall_('sendBulkSms', function () {
    var user = requireRole_('sms', 'mutate');
    if (isBlank_(message)) throw new Error('Message body is required.');
    var recipients = resolveSmsRecipients_(group);
    if (!recipients.length) throw new Error('No opted-in recipients match that group.');

    var results = { sent: 0, failed: 0, scheduled: 0 };
    recipients.forEach(function (r) {
      var name = (r.FirstName || '') + ' ' + (r.LastName || '');
      var personalized = message.replace(/\{name\}/gi, (r.FirstName || '').trim() || 'friend');
      if (scheduledFor) {
        insertRow_(SHEETS.SMS_LOG, {
          RecipientPhone: normalizePhone_(r.Phone), RecipientMemberID: r.ID || '', RecipientName: name.trim(),
          MessageBody: personalized, Provider: getSetting_('SmsProvider', 'arkesel'), Status: 'Scheduled',
          SentAt: '', ScheduledFor: scheduledFor, GroupLabel: group, ErrorDetail: '', CreatedBy: user.Username
        }, ID_PREFIX.SMS_LOG);
        results.scheduled++;
        return;
      }
      var outcome = dispatchSms_(normalizePhone_(r.Phone), personalized);
      insertRow_(SHEETS.SMS_LOG, {
        RecipientPhone: normalizePhone_(r.Phone), RecipientMemberID: r.ID || '', RecipientName: name.trim(),
        MessageBody: personalized, Provider: outcome.provider, Status: outcome.ok ? 'Sent' : 'Failed',
        SentAt: nowIso_(), ScheduledFor: '', GroupLabel: group, ErrorDetail: outcome.ok ? '' : outcome.error, CreatedBy: user.Username
      }, ID_PREFIX.SMS_LOG);
      if (outcome.ok) results.sent++; else results.failed++;
    });
    logAudit_('CREATE', 'SMS_Log', '', 'Bulk SMS to "' + group + '": ' + JSON.stringify(results));
    return results;
  });
}

/** Sends to a single ad-hoc phone number (e.g. from a member profile), bypassing group resolution. */
function sendSingleSms(phone, message, memberId) {
  return safeCall_('sendSingleSms', function () {
    var user = requireRole_('sms', 'mutate');
    if (!isValidPhone_(phone)) throw new Error('Invalid phone number.');
    if (isBlank_(message)) throw new Error('Message body is required.');
    var outcome = dispatchSms_(normalizePhone_(phone), message);
    insertRow_(SHEETS.SMS_LOG, {
      RecipientPhone: normalizePhone_(phone), RecipientMemberID: memberId || '', RecipientName: '',
      MessageBody: message, Provider: outcome.provider, Status: outcome.ok ? 'Sent' : 'Failed',
      SentAt: nowIso_(), ScheduledFor: '', GroupLabel: 'direct', ErrorDetail: outcome.ok ? '' : outcome.error, CreatedBy: user.Username
    }, ID_PREFIX.SMS_LOG);
    return outcome;
  });
}

function listSmsLog(limit) {
  return safeCall_('listSmsLog', function () {
    requireRole_('sms', 'view');
    var rows = readAll_(SHEETS.SMS_LOG);
    rows.reverse();
    return rows.slice(0, limit || 300);
  });
}

function toggleMemberSmsOptOut(memberId, optOut) {
  return safeCall_('toggleMemberSmsOptOut', function () {
    requireRole_('sms', 'mutate');
    updateRow_(SHEETS.MEMBERS, memberId, { SmsOptOut: optOut ? 'TRUE' : 'FALSE' });
    logAudit_('UPDATE', 'Members', memberId, (optOut ? 'Opted out of' : 'Opted into') + ' SMS');
    return { ok: true };
  });
}

/** Called hourly by a time-driven trigger; sends anything whose ScheduledFor has arrived. */
function processScheduledSms_() {
  var rows = readAll_(SHEETS.SMS_LOG).filter(function (r) { return r.Status === 'Scheduled' && r.ScheduledFor && new Date(r.ScheduledFor) <= new Date(); });
  rows.forEach(function (r) {
    var outcome = dispatchSms_(r.RecipientPhone, r.MessageBody);
    updateRow_(SHEETS.SMS_LOG, r.ID, {
      Status: outcome.ok ? 'Sent' : 'Failed', SentAt: nowIso_(), Provider: outcome.provider,
      ErrorDetail: outcome.ok ? '' : outcome.error
    });
  });
  return rows.length;
}

/* ---------- Provider dispatch (swap-friendly) ---------- */

function dispatchSms_(phone, message) {
  var provider = getSetting_('SmsProvider', 'arkesel');
  try {
    if (provider === 'hubtel') return sendViaHubtel_(phone, message);
    if (provider === 'custom') return sendViaCustomProvider_(phone, message);
    return sendViaArkesel_(phone, message);
  } catch (err) {
    logError_('dispatchSms_', err);
    return { ok: false, provider: provider, error: err.message };
  }
}

function sendViaArkesel_(phone, message) {
  var apiKey = getSetting_('Sms_Arkesel_ApiKey', '');
  var senderId = getSetting_('Sms_Arkesel_SenderId', 'ChurchMS');
  if (!apiKey) return { ok: false, provider: 'arkesel', error: 'Arkesel API key not configured in Settings.' };
  var resp = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': apiKey },
    payload: JSON.stringify({ sender: senderId, message: message, recipients: [phone] }),
    muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var body = safeJson_(resp.getContentText());
  var ok = code >= 200 && code < 300 && body && (body.status === 'success' || body.code === 'ok');
  return { ok: ok, provider: 'arkesel', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

function sendViaHubtel_(phone, message) {
  var clientId = getSetting_('Sms_Hubtel_ClientId', '');
  var clientSecret = getSetting_('Sms_Hubtel_ClientSecret', '');
  var senderId = getSetting_('Sms_Hubtel_SenderId', 'ChurchMS');
  if (!clientId || !clientSecret) return { ok: false, provider: 'hubtel', error: 'Hubtel credentials not configured in Settings.' };
  var url = 'https://sms.hubtel.com/v1/messages/send'
    + '?clientid=' + encodeURIComponent(clientId)
    + '&clientsecret=' + encodeURIComponent(clientSecret)
    + '&from=' + encodeURIComponent(senderId)
    + '&to=' + encodeURIComponent(phone)
    + '&content=' + encodeURIComponent(message);
  var resp = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  var code = resp.getResponseCode();
  var ok = code >= 200 && code < 300;
  return { ok: ok, provider: 'hubtel', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

/** Generic custom provider: endpoint/method/field names/API key all come from Settings, so any REST SMS gateway works. */
function sendViaCustomProvider_(phone, message) {
  var endpoint = getSetting_('Sms_Custom_Endpoint', '');
  var method = (getSetting_('Sms_Custom_Method', 'POST') || 'POST').toLowerCase();
  var apiKey = getSetting_('Sms_Custom_ApiKey', '');
  var phoneField = getSetting_('Sms_Custom_PhoneField', 'to');
  var msgField = getSetting_('Sms_Custom_MessageField', 'message');
  if (!endpoint) return { ok: false, provider: 'custom', error: 'Custom SMS endpoint not configured in Settings.' };

  var payload = {};
  payload[phoneField] = phone;
  payload[msgField] = message;
  var options = { method: method, muteHttpExceptions: true, headers: {} };
  if (apiKey) options.headers['Authorization'] = 'Bearer ' + apiKey;

  var url = endpoint;
  if (method === 'get') {
    var qs = Object.keys(payload).map(function (k) { return k + '=' + encodeURIComponent(payload[k]); }).join('&');
    url += (endpoint.indexOf('?') === -1 ? '?' : '&') + qs;
  } else {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  var resp = UrlFetchApp.fetch(url, options);
  var code = resp.getResponseCode();
  var ok = code >= 200 && code < 300;
  return { ok: ok, provider: 'custom', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

function safeJson_(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}

/* ============================ EQUIPMENT ============================ */

/**
 * Equipment.gs
 * Church equipment/asset inventory: status, location, assignment, condition.
 */

function listEquipment() {
  return safeCall_('listEquipment', function () {
    requireRole_('equipment', 'view');
    return readAll_(SHEETS.EQUIPMENT).sort(function (a, b) { return (a.Name || '').localeCompare(b.Name || ''); });
  });
}

function saveEquipment(data) {
  return safeCall_('saveEquipment', function () {
    requireRole_('equipment', 'mutate');
    requireFields_(data, ['Name', 'Category']);
    requireEnum_(data.Status, OPTIONS.EQUIPMENT_STATUS, 'Status');
    requireEnum_(data.Condition, OPTIONS.EQUIPMENT_CONDITION, 'Condition');
    var payload = {
      Name: sanitizeText_(data.Name), Category: sanitizeText_(data.Category),
      SerialNumber: sanitizeText_(data.SerialNumber || ''), Status: data.Status || 'Available',
      Location: sanitizeText_(data.Location || ''), AssignedTo: sanitizeText_(data.AssignedTo || ''),
      PurchaseDate: data.PurchaseDate || '', Condition: data.Condition || 'Good', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.EQUIPMENT, data.ID, payload);
      logAudit_('UPDATE', 'Equipment', data.ID, 'Updated ' + payload.Name);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.EQUIPMENT, payload, ID_PREFIX.EQUIPMENT);
      logAudit_('CREATE', 'Equipment', record.ID, 'Added ' + payload.Name);
    }
    return record;
  });
}

function deleteEquipment(id) {
  return safeCall_('deleteEquipment', function () {
    requireRole_('equipment', 'mutate');
    deleteRow_(SHEETS.EQUIPMENT, id);
    logAudit_('DELETE', 'Equipment', id, 'Removed equipment record');
    return { ok: true };
  });
}

/* ============================ REPORTS ============================ */

/**
 * Reports.gs
 * Cross-module analytics: attendance patterns, financial trends, growth
 * metrics, cluster effectiveness, and member engagement scoring. Also
 * exposes CSV export for any of the underlying record sets.
 */

function getAttendanceReport(from, to) {
  return safeCall_('getAttendanceReport', function () {
    requireRole_('reports', 'view');
    var rows = readAll_(SHEETS.ATTENDANCE).filter(inRange_(from, to, 'ServiceDate'));
    var byService = {};
    rows.forEach(function (r) { byService[r.ServiceType] = (byService[r.ServiceType] || 0) + 1; });
    var byDate = {};
    rows.forEach(function (r) { var d = (r.ServiceDate || '').split('T')[0]; byDate[d] = (byDate[d] || 0) + 1; });
    var series = Object.keys(byDate).sort().map(function (d) { return { date: d, count: byDate[d] }; });
    return { total: rows.length, byService: byService, series: series };
  });
}

function getGrowthReport(months) {
  return safeCall_('getGrowthReport', function () {
    requireRole_('reports', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    return { memberGrowth: memberGrowth_(members, months || 12), statusBreakdown: statusBreakdown_(members) };
  });
}

function getClusterEffectivenessReport() {
  return safeCall_('getClusterEffectivenessReport', function () {
    requireRole_('reports', 'view');
    var clusters = readAll_(SHEETS.CLUSTERS);
    var members = readAll_(SHEETS.MEMBERS);
    var followups = readAll_(SHEETS.CLUSTER_FOLLOWUPS);
    var attendance = readAll_(SHEETS.ATTENDANCE);
    return clusters.map(function (c) {
      var clusterMembers = members.filter(function (m) { return m.Cluster === c.Name; });
      var memberIds = clusterMembers.map(function (m) { return m.ID; });
      var attendanceCount = attendance.filter(function (a) { return memberIds.indexOf(a.MemberID) !== -1; }).length;
      var followupCount = followups.filter(function (f) { return f.ClusterID === c.ID; }).length;
      return {
        cluster: c.Name, leader: c.LeaderName, memberCount: clusterMembers.length,
        avgAttendancePerMember: clusterMembers.length ? Math.round((attendanceCount / clusterMembers.length) * 10) / 10 : 0,
        followUps: followupCount
      };
    });
  });
}

function getMemberEngagementReport() {
  return safeCall_('getMemberEngagementReport', function () {
    requireRole_('reports', 'view');
    var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active' || m.MembershipStatus === 'New'; });
    return members.map(function (m) {
      return { id: m.ID, name: m.FirstName + ' ' + m.LastName, score: computeMemberEngagementScore_(m.ID) };
    }).sort(function (a, b) { return b.score - a.score; });
  });
}

/** Returns CSV text for one of the core sheets, for the frontend to trigger a download of. */
function exportSheetCsv(sheetKey) {
  return safeCall_('exportSheetCsv', function () {
    requireRole_('reports', 'view');
    var name = SHEETS[sheetKey];
    if (!name) throw new Error('Unknown export target.');
    var headers = SCHEMA[name];
    var rows = readAll_(name);
    var lines = [headers.join(',')];
    rows.forEach(function (r) {
      lines.push(headers.map(function (h) { return csvEscape_(r[h]); }).join(','));
    });
    return lines.join('\n');
  });
}

function csvEscape_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/* ============================ CLUSTERFOLLOWUP ============================ */

/**
 * ClusterFollowUp.gs
 * Small-group ("cluster") management and per-member follow-up logging,
 * used to track ministry/cluster effectiveness.
 */

function listClusters() {
  return safeCall_('listClusters', function () {
    requireRole_('cluster', 'view');
    var clusters = readAll_(SHEETS.CLUSTERS);
    var members = readAll_(SHEETS.MEMBERS);
    return clusters.map(function (c) {
      var count = members.filter(function (m) { return m.Cluster === c.Name; }).length;
      return Object.assign({}, c, { MemberCount: count });
    });
  });
}

function saveCluster(data) {
  return safeCall_('saveCluster', function () {
    requireRole_('cluster', 'mutate');
    requireFields_(data, ['Name']);
    var leaderName = data.LeaderName || '';
    if (data.LeaderMemberID) {
      var m = getById_(SHEETS.MEMBERS, data.LeaderMemberID);
      if (m) leaderName = m.FirstName + ' ' + m.LastName;
    }
    var payload = {
      Name: sanitizeText_(data.Name), LeaderMemberID: data.LeaderMemberID || '', LeaderName: sanitizeText_(leaderName),
      MeetingDay: sanitizeText_(data.MeetingDay || ''), Location: sanitizeText_(data.Location || ''),
      Status: data.Status || 'Active', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CLUSTERS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CLUSTERS, payload, ID_PREFIX.CLUSTERS);
    }
    logAudit_('UPDATE', 'Clusters', record.ID, 'Saved cluster ' + payload.Name);
    return record;
  });
}

function deleteCluster(id) {
  return safeCall_('deleteCluster', function () {
    requireRole_('cluster', 'mutate');
    deleteRow_(SHEETS.CLUSTERS, id);
    logAudit_('DELETE', 'Clusters', id, 'Removed cluster');
    return { ok: true };
  });
}

function listClusterFollowUps(clusterId) {
  return safeCall_('listClusterFollowUps', function () {
    requireRole_('cluster', 'view');
    var rows = readAll_(SHEETS.CLUSTER_FOLLOWUPS);
    if (clusterId) rows = rows.filter(function (r) { return r.ClusterID === clusterId; });
    return rows.sort(function (a, b) { return new Date(b.FollowUpDate) - new Date(a.FollowUpDate); });
  });
}

function saveClusterFollowUp(data) {
  return safeCall_('saveClusterFollowUp', function () {
    var user = requireRole_('cluster', 'mutate');
    requireFields_(data, ['ClusterID', 'MemberID', 'FollowUpDate', 'Type']);
    requireEnum_(data.Type, OPTIONS.FOLLOWUP_TYPE, 'Type');
    var cluster = getById_(SHEETS.CLUSTERS, data.ClusterID);
    var member = getById_(SHEETS.MEMBERS, data.MemberID);
    if (!cluster) throw new Error('Cluster not found.');
    if (!member) throw new Error('Member not found.');
    var payload = {
      ClusterID: data.ClusterID, ClusterName: cluster.Name, MemberID: data.MemberID,
      MemberName: member.FirstName + ' ' + member.LastName, FollowUpDate: data.FollowUpDate, Type: data.Type,
      Notes: sanitizeText_(data.Notes || ''), Outcome: sanitizeText_(data.Outcome || ''), FollowedUpBy: user.Username
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CLUSTER_FOLLOWUPS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CLUSTER_FOLLOWUPS, payload, ID_PREFIX.CLUSTER_FOLLOWUPS);
    }
    logAudit_('UPDATE', 'ClusterFollowUps', record.ID, 'Logged follow-up for ' + payload.MemberName);
    return record;
  });
}

function deleteClusterFollowUp(id) {
  return safeCall_('deleteClusterFollowUp', function () {
    requireRole_('cluster', 'mutate');
    deleteRow_(SHEETS.CLUSTER_FOLLOWUPS, id);
    return { ok: true };
  });
}

/* ============================ COMMUNICATION ============================ */

/**
 * Communication.gs
 * Prayer Request system (public submission + admin prayer-chain workflow)
 * and internal messaging between admin users (direct + group threads).
 */

/* ---------- Prayer Requests ---------- */

/** Public, rate-limited: anyone with the ?page=prayer link can submit — no login required. */
function submitPrayerRequest(data) {
  return safeCall_('submitPrayerRequest', function () {
    checkRateLimit_('prayer_submit_' + (data.RequesterContact || 'anon'), 3, 300);
    requireFields_(data, ['RequestText']);
    requireEnum_(data.Visibility, OPTIONS.PRAYER_VISIBILITY, 'Visibility');
    var record = insertRow_(SHEETS.PRAYER_REQUESTS, {
      RequesterName: sanitizeText_(data.RequesterName || 'Anonymous'),
      RequesterContact: sanitizeText_(data.RequesterContact || ''),
      RequestText: sanitizeText_(data.RequestText),
      Visibility: data.Visibility || 'Private',
      Status: 'New', AssignedTo: '', ResponseNotes: '', SubmittedAt: nowIso_()
    }, ID_PREFIX.PRAYER_REQUESTS);
    return { ok: true, id: record.ID };
  });
}

function listPrayerRequests() {
  return safeCall_('listPrayerRequests', function () {
    requireRole_('sms', 'view'); // communication hub shares the SMS/comms permission set
    var rows = readAll_(SHEETS.PRAYER_REQUESTS);
    return rows.sort(function (a, b) { return new Date(b.SubmittedAt) - new Date(a.SubmittedAt); });
  });
}

function updatePrayerRequest(data) {
  return safeCall_('updatePrayerRequest', function () {
    var user = requireRole_('sms', 'mutate');
    requireEnum_(data.Status, OPTIONS.PRAYER_STATUS, 'Status');
    var record = updateRow_(SHEETS.PRAYER_REQUESTS, data.ID, {
      Status: data.Status, AssignedTo: sanitizeText_(data.AssignedTo || user.Username),
      ResponseNotes: sanitizeText_(data.ResponseNotes || '')
    });
    logAudit_('UPDATE', 'PrayerRequests', data.ID, 'Set status to ' + data.Status);
    return record;
  });
}

/* ---------- Internal Messaging ---------- */

function listMessageThreads() {
  return safeCall_('listMessageThreads', function () {
    var user = requireRole_('sms', 'view');
    var threads = readAll_(SHEETS.MESSAGE_THREADS).filter(function (t) {
      var participants = safeJson_(t.Participants) || [];
      return participants.indexOf(user.Username) !== -1;
    });
    var messages = readAll_(SHEETS.MESSAGES);
    return threads.map(function (t) {
      var msgs = messages.filter(function (m) { return m.ThreadID === t.ID; });
      var last = msgs[msgs.length - 1];
      return Object.assign({}, t, { LastMessage: last ? last.Body : '', LastAt: last ? last.SentAt : t.CreatedAt, MessageCount: msgs.length });
    }).sort(function (a, b) { return new Date(b.LastAt) - new Date(a.LastAt); });
  });
}

function createMessageThread(name, participantUsernames, type) {
  return safeCall_('createMessageThread', function () {
    var user = requireRole_('sms', 'view');
    if (!Array.isArray(participantUsernames) || !participantUsernames.length) throw new Error('Select at least one participant.');
    var participants = uniq_(participantUsernames.concat([user.Username]));
    var record = insertRow_(SHEETS.MESSAGE_THREADS, {
      Type: type === 'Group' ? 'Group' : 'Direct', Name: sanitizeText_(name || participants.join(', ')),
      Participants: JSON.stringify(participants), CreatedAt: nowIso_(), CreatedBy: user.Username
    }, ID_PREFIX.MESSAGE_THREADS);
    return record;
  });
}

function listThreadMessages(threadId) {
  return safeCall_('listThreadMessages', function () {
    var user = requireRole_('sms', 'view');
    assertThreadMember_(threadId, user.Username);
    var messages = readAll_(SHEETS.MESSAGES).filter(function (m) { return m.ThreadID === threadId; })
      .sort(function (a, b) { return new Date(a.SentAt) - new Date(b.SentAt); });
    messages.forEach(function (m) {
      var readBy = safeJson_(m.ReadBy) || [];
      if (readBy.indexOf(user.Username) === -1) {
        readBy.push(user.Username);
        updateRow_(SHEETS.MESSAGES, m.ID, { ReadBy: JSON.stringify(readBy) });
      }
    });
    return messages;
  });
}

function sendMessage(threadId, body, attachmentDriveUrl) {
  return safeCall_('sendMessage', function () {
    var user = requireRole_('sms', 'view');
    assertThreadMember_(threadId, user.Username);
    if (isBlank_(body)) throw new Error('Message cannot be empty.');
    var record = insertRow_(SHEETS.MESSAGES, {
      ThreadID: threadId, FromUser: user.Username, Body: sanitizeText_(body),
      Attachments: attachmentDriveUrl || '', SentAt: nowIso_(), ReadBy: JSON.stringify([user.Username])
    }, ID_PREFIX.MESSAGES);
    return record;
  });
}

function assertThreadMember_(threadId, username) {
  var thread = getById_(SHEETS.MESSAGE_THREADS, threadId);
  if (!thread) throw new Error('Conversation not found.');
  var participants = safeJson_(thread.Participants) || [];
  if (participants.indexOf(username) === -1) throw new Error('Access denied: not a participant in this conversation.');
  return thread;
}

/** Directory of active admin users for the "new message" participant picker. */
function listMessagingContacts() {
  return safeCall_('listMessagingContacts', function () {
    var user = requireRole_('sms', 'view');
    return readAll_(SHEETS.USERS).filter(function (u) { return toBool_(u.Active) && u.Username !== user.Username; })
      .map(function (u) { return { username: u.Username, name: u.FullName, role: u.Role }; });
  });
}

/* ============================ NOTIFICATIONS ============================ */

/**
 * Notifications.gs
 * Automated notifications driven by time-based triggers (see Triggers.gs):
 * birthdays, anniversaries, membership milestones, absence follow-up, and
 * admin-defined custom event reminders. Sent via MailApp (email) and, where
 * a phone number is on file and the member hasn't opted out, SMS.
 */

function runDailyNotifications_() {
  sendBirthdayReminders_();
  sendAnniversaryReminders_();
  sendAbsenceNotifications_();
  return { ok: true, ranAt: nowIso_() };
}

function sendBirthdayReminders_() {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var todays = upcomingBirthdays_(members, 0);
  todays.forEach(function (b) {
    var m = getById_(SHEETS.MEMBERS, b.id);
    if (!m || isBlank_(m.Email)) return;
    try {
      MailApp.sendEmail({
        to: m.Email,
        subject: 'Happy Birthday from ' + getSetting_('OrgName', APP_NAME) + '!',
        body: 'Dear ' + m.FirstName + ',\n\nWishing you a joyful birthday and a year full of God\'s blessings!\n\n- ' + getSetting_('OrgName', APP_NAME)
      });
    } catch (e) { logError_('sendBirthdayReminders_', e); }
  });
}

function sendAnniversaryReminders_() {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var todays = upcomingAnniversaries_(members, 0);
  todays.forEach(function (a) {
    var m = getById_(SHEETS.MEMBERS, a.id);
    if (!m || isBlank_(m.Email)) return;
    try {
      MailApp.sendEmail({
        to: m.Email,
        subject: 'Celebrating ' + a.years + ' Year(s) With Us!',
        body: 'Dear ' + m.FirstName + ',\n\nToday marks ' + a.years + ' year(s) since you joined ' + getSetting_('OrgName', APP_NAME) + '. Thank you for being part of our family!\n\n- ' + getSetting_('OrgName', APP_NAME)
      });
    } catch (e) { logError_('sendAnniversaryReminders_', e); }
  });
}

function sendAbsenceNotifications_() {
  var weeks = Number(getSetting_('AbsenceThresholdWeeks', '3')) || 3;
  var absentees = findAbsentMembers_(weeks);
  var adminEmails = readAll_(SHEETS.USERS).filter(function (u) {
    return toBool_(u.Active) && !isBlank_(u.Email) && (u.Role === ROLES.SUPER_ADMIN || u.Role === ROLES.ADMIN || u.Role === ROLES.CLUSTER_LEADER);
  }).map(function (u) { return u.Email; });
  if (!absentees.length || !adminEmails.length) return;
  var body = 'The following active members have not checked in for ' + weeks + '+ weeks:\n\n'
    + absentees.map(function (m) { return '- ' + m.FirstName + ' ' + m.LastName + ' (' + (m.Phone || 'no phone') + ')'; }).join('\n');
  try {
    MailApp.sendEmail({ to: adminEmails.join(','), subject: 'Absence Follow-Up — ' + absentees.length + ' member(s)', body: body });
  } catch (e) { logError_('sendAbsenceNotifications_', e); }
}

/** Client-callable: admin can trigger a one-off custom reminder to a member group. */
function sendCustomEventReminder(subject, body, group) {
  return safeCall_('sendCustomEventReminder', function () {
    requireRole_('sms', 'mutate');
    var recipients = resolveSmsRecipients_(group).filter(function (m) { return !isBlank_(m.Email); });
    recipients.forEach(function (m) {
      try { MailApp.sendEmail({ to: m.Email, subject: subject, body: body.replace(/\{name\}/gi, m.FirstName || '') }); } catch (e) { logError_('sendCustomEventReminder', e); }
    });
    logAudit_('CREATE', 'Notifications', '', 'Custom reminder "' + subject + '" sent to ' + recipients.length + ' member(s)');
    return { sent: recipients.length };
  });
}

/* ============================ TRIGGERS ============================ */

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

/* ============================ SETTINGS ============================ */

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
