/**
 * KEY & DEED — Ghana Tenancy Management System
 * Single Google Apps Script Web App backend.
 *
 * The real-world flow this system encodes:
 *   1. Public site lists every property/room (available AND rented, clearly badged).
 *   2. A prospective tenant clicks "Rent this room" -> signs up / logs in (real account).
 *   3. On signup the tenant automatically gets a welcome SMS + email telling them to
 *      inspect the room and submit payment.
 *   4. Tenant fills a Booking & Payment form: pays by bank/cash/mobile money and
 *      uploads a screenshot as proof (or a note, for cash).
 *   5. Landlord (admin) reviews the proof in the Bookings inbox and approves/rejects.
 *   6. Only once approved does the Tenancy Agreement Form unlock for that tenant —
 *      they fill in duration/payment/personal/guarantor details, sign, submit -> a
 *      PDF is generated, the tenancy goes Active, and the room flips to Occupied.
 *   7. The tenant portal lets them download the agreement, see their ledger, file
 *      complaints (maintenance tickets), and message the landlord in-app or via
 *      WhatsApp. The landlord's admin console manages/monitors every tenant.
 *
 * File layout:
 *   Code.gs      - this file (server logic, organised in //region blocks below)
 *   index.html   - SPA shell, includes Styles.html + Scripts.html
 *   Styles.html  - all CSS
 *   Scripts.html - all client JS (router, state, renderers)
 *
 * Data flow: browser <-> google.script.run <-> functions in this file <-> single
 * Google Sheet ("KEY & DEED — Database") + Drive folder tree, both auto-provisioned
 * on first run by setup(). Every privileged read/write goes through the generic
 * Data Access Layer (readTable_/appendRow_/updateById_/findBy_) which batches
 * getValues()/setValues() and caches hot tables in CacheService.
 */

// =====================================================================================
// region: Configuration & Constants
// =====================================================================================

var APP_DEFAULT_NAME = 'KEY & DEED';
var DB_FILE_NAME = 'KEY & DEED — Database';
var ROOT_FOLDER_NAME = 'KEY & DEED';
var SUBFOLDERS = ['Signatures', 'Agreements', 'Property Photos', 'Tenant Documents', 'Receipts', 'Notices', 'Payment Proofs'];

var PROP_KEY = {
  SS_ID: 'SS_ID',
  FOLDER_ROOT: 'FOLDER_ROOT',
  FOLDER_PREFIX: 'FOLDER_', // + subfolder name, spaces->_
  SETUP_DONE: 'SETUP_DONE'
};

var CACHE_TTL_SEC = 360; // 6 minutes
var CACHE_PREFIX = 'kd_';

// Sheet tab names
var SHEETS = {
  SETTINGS: 'Settings',
  PROPERTIES: 'Properties',
  ROOMS: 'Rooms',
  TENANTS: 'Tenants',
  TENANCIES: 'Tenancies',
  BOOKINGS: 'Bookings',
  FORM_SCHEMA: 'FormSchema',
  PAYMENTS: 'Payments',
  REMINDERS: 'Reminders',
  NOTICES: 'Notices',
  MAINTENANCE: 'Maintenance',
  MESSAGES: 'Messages',
  USERS: 'Users',
  AUDIT: 'AuditLog'
};

// Column definitions per tab, in order. ID/CreatedAt/UpdatedAt are implicit on every
// data tab except Settings (key/value) — they are added automatically in ensureDatabase_.
var SCHEMA = {};
SCHEMA[SHEETS.SETTINGS] = ['Key', 'Value'];
SCHEMA[SHEETS.PROPERTIES] = ['ID', 'PropertyName', 'PropertyType', 'Region', 'Town', 'GhanaPostGPS',
  'StreetAddress', 'Landmark', 'Description', 'TotalRooms', 'CaretakerName', 'CaretakerPhone',
  'PhotoFileIds', 'Status', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.ROOMS] = ['ID', 'PropertyID', 'RoomLabel', 'RoomType', 'SizeSqM', 'Bedrooms', 'Bathrooms',
  'Furnished', 'MonthlyRent', 'MinAdvanceMonths', 'Deposit', 'UtilitiesIncluded', 'Amenities',
  'PhotoFileIds', 'Status', 'AvailableFrom', 'ListedPublicly', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.TENANTS] = ['ID', 'FullName', 'Phone', 'AltPhone', 'Email', 'GhanaCardNumber', 'DateOfBirth',
  'Gender', 'MaritalStatus', 'Occupation', 'Employer', 'EmployerPhone', 'NextOfKinName', 'NextOfKinPhone',
  'GuarantorName', 'GuarantorPhone', 'GuarantorGhanaCard', 'PhotoFileId', 'IdDocFileId',
  'PasswordHash', 'Salt', 'Status', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.TENANCIES] = ['ID', 'TenantID', 'PropertyID', 'RoomID', 'BookingID', 'StartDate', 'AdvanceMonths',
  'AdvanceAmount', 'MonthlyRent', 'Deposit', 'EndDate', 'PaymentMode', 'Status', 'AgreementPdfFileId',
  'SignatureFileId', 'SignedAt', 'RenewalCount', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.BOOKINGS] = ['ID', 'TenantID', 'PropertyID', 'RoomID', 'RequestedAt', 'PaymentMethod', 'AmountGHS',
  'ProofFileId', 'ProofNotes', 'Status', 'ReviewedBy', 'ReviewNotes', 'ReviewedAt', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.FORM_SCHEMA] = ['ID', 'Section', 'Label', 'FieldKey', 'Type', 'Options', 'Required',
  'Placeholder', 'HelpText', 'Validation', 'SortOrder', 'Visible', 'Version', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.PAYMENTS] = ['ID', 'TenancyID', 'TenantID', 'AmountGHS', 'PaymentDate', 'Channel',
  'Reference', 'PeriodCoveredFrom', 'PeriodCoveredTo', 'ReceiptPdfFileId', 'RecordedBy', 'Notes',
  'ReceiptNumber', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.REMINDERS] = ['ID', 'TenancyID', 'TenantID', 'Type', 'ScheduledFor', 'SentAt', 'ChannelsUsed',
  'SmsStatus', 'EmailStatus', 'MessageBody', 'Attempts', 'ErrorText', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.NOTICES] = ['ID', 'TenancyID', 'Type', 'IssuedOn', 'EffectiveDate', 'Reason', 'PdfFileId',
  'DeliveredVia', 'AcknowledgedAt', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.MAINTENANCE] = ['ID', 'PropertyID', 'RoomID', 'TenantID', 'ReportedAt', 'Category',
  'Description', 'PhotoFileIds', 'Priority', 'Status', 'AssignedTo', 'CostGHS', 'ResolvedAt',
  'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.MESSAGES] = ['ID', 'TenantID', 'SenderRole', 'SenderName', 'Body', 'SentAt',
  'ReadByAdmin', 'ReadByTenant', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.USERS] = ['ID', 'Name', 'Email', 'Phone', 'Role', 'PasswordHash', 'Salt', 'Active',
  'LastLoginAt', 'CreatedAt', 'UpdatedAt'];
SCHEMA[SHEETS.AUDIT] = ['ID', 'Timestamp', 'Actor', 'Action', 'Entity', 'EntityID', 'Details', 'IpHint'];

var GHANA_REGIONS = ['Greater Accra', 'Ashanti', 'Western', 'Western North', 'Central', 'Eastern', 'Volta',
  'Oti', 'Northern', 'Savannah', 'North East', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo'];

var PROPERTY_TYPES = ['Single Room', 'Chamber and Hall', 'Self-Contained', '1-Bedroom Apartment',
  '2-Bedroom Apartment', '3-Bedroom Apartment', '4-Bedroom Apartment', 'Compound House Room',
  "Boys' Quarters", 'Townhouse', 'Detached House', 'Store/Shop', 'Office Space', 'Warehouse'];

var PAYMENT_CHANNELS = ['MTN MoMo', 'Telecel Cash', 'AT Money', 'Bank Transfer', 'Cheque', 'Cash'];

// Ghanaian mobile prefixes by network, used for phone validation.
var GHANA_PREFIXES = {
  MTN: ['024', '054', '055', '059'],
  TELECEL: ['020', '050'],
  AIRTELTIGO: ['026', '056', '027', '057']
};

var DEFAULT_SETTINGS = {
  AppName: APP_DEFAULT_NAME,
  LandlordName: 'Landlord/Landlady',
  LandlordPhone: '+233240000000',
  LandlordEmail: '',
  BusinessLogoFileId: '',
  DefaultCurrency: 'GHS',
  ArkeselApiKey: '',
  ArkeselSenderId: 'KEYDEED',
  SmsEnabled: 'N',
  EmailEnabled: 'Y',
  ReminderWindowsDays: '30,7,1',
  AdminEmails: '',
  PdfFooterText: 'Generated by KEY & DEED Tenancy Management System.',
  RentControlDisclaimer: 'This document is provided for administrative convenience and does not constitute legal advice. Parties are encouraged to confirm terms with the Rent Control Division, Ministry of Works and Housing, under the Rent Act, 1963 (Act 220).',
  Theme: 'light',
  PublicPortalEnabled: 'Y',
  OnboardingDone: 'N',
  ReceiptPrefix: 'KD',
  SmsRatePerSegment: '0.03',
  WelcomeSmsTemplate: 'Welcome to {{AppName}}, {{TenantName}}! Please inspect {{RoomLabel}} at {{PropertyName}} and submit your payment on the portal to secure it. - {{LandlordName}} ({{LandlordPhone}})',
  WelcomeEmailTemplate: 'Dear {{TenantName}}, thank you for signing up. Please arrange to inspect {{RoomLabel}} at {{PropertyName}}, then submit your payment (bank transfer, mobile money, or cash) with proof through the portal so {{LandlordName}} can confirm and unlock your Tenancy Agreement Form.',
  BookingApprovedTemplate: 'Good news {{TenantName}}! Your payment for {{RoomLabel}} at {{PropertyName}} has been confirmed. Please log in to the portal to complete your Tenancy Agreement Form. - {{LandlordName}} ({{LandlordPhone}})',
  BookingRejectedTemplate: 'Dear {{TenantName}}, we could not confirm your payment for {{RoomLabel}}: {{Reason}}. Please contact {{LandlordName}} on {{LandlordPhone}}.',
  AgreementPendingTemplate: 'Dear {{TenantName}}, your payment for {{RoomLabel}} was confirmed but your Tenancy Agreement Form is still incomplete. Please log in to the portal to finish it and secure your room.',
  MessageTemplateRent1Month: 'Dear {{TenantName}}, your rent advance for {{RoomLabel}} at {{PropertyName}} expires on {{DueDate}} ({{DaysLeft}} days left). Please contact {{LandlordName}} on {{LandlordPhone}} to renew. - KEY & DEED',
  MessageTemplateRent1Week: 'Dear {{TenantName}}, reminder: your rent advance for {{RoomLabel}} expires on {{DueDate}}, just {{DaysLeft}} days away. Kindly arrange renewal with {{LandlordName}} ({{LandlordPhone}}).',
  MessageTemplateRent1Day: 'Dear {{TenantName}}, your rent advance for {{RoomLabel}} expires TOMORROW ({{DueDate}}). Please contact {{LandlordName}} ({{LandlordPhone}}) urgently.',
  MessageTemplateOverdue: 'Dear {{TenantName}}, your rent advance for {{RoomLabel}} expired on {{DueDate}} and is now overdue. Please contact {{LandlordName}} ({{LandlordPhone}}) as a matter of urgency.',
  MessageTemplateNotice3Month: 'Dear {{TenantName}}, this is formal notice that your tenancy of {{RoomLabel}} at {{PropertyName}} will end on {{DueDate}}. A full notice letter has been sent to your email. Contact {{LandlordName}} ({{LandlordPhone}}) with questions.'
};

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Utilities (phone normalisation, GHS formatting, date maths, escaping, IDs)
// =====================================================================================

/** Generates a short, readable ID like "PRP-7F2A". */
function generateId_(prefix) {
  var raw = Utilities.getUuid().replace(/-/g, '').toUpperCase();
  return prefix + '-' + raw.substring(0, 4);
}

/** Escapes a string for safe embedding in HTML/PDF output. */
function escapeHtml_(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Formats a number as Ghana Cedi, e.g. "GH₵ 1,250.00". */
function formatGHS_(amount) {
  var n = Number(amount) || 0;
  var fixed = n.toFixed(2);
  var parts = fixed.split('.');
  var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return 'GH₵ ' + intPart + '.' + parts[1];
}

/** Formats a Date (or ISO string) as dd/MM/yyyy in Africa/Accra timezone. */
function formatDate_(date) {
  if (!date) return '';
  var d = (date instanceof Date) ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Africa/Accra', 'dd/MM/yyyy');
}

/** Adds a number of whole calendar months to a date, returning a new Date. */
function addMonths_(date, months) {
  var d = (date instanceof Date) ? new Date(date.getTime()) : new Date(date);
  var day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + Number(months));
  var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

/** Whole-day difference between two dates (b - a), ignoring time of day. */
function daysBetween_(a, b) {
  var A = new Date(a); var B = new Date(b);
  var ms = Date.UTC(B.getFullYear(), B.getMonth(), B.getDate()) - Date.UTC(A.getFullYear(), A.getMonth(), A.getDate());
  return Math.round(ms / 86400000);
}

/**
 * Normalises a Ghanaian mobile number to E.164 (+233XXXXXXXXX).
 * Accepts 024..., 054..., +233 24..., 00233... and strips whitespace/dashes.
 * Returns null if the result doesn't look like a valid Ghanaian mobile number.
 */
function normalizePhoneGh_(raw) {
  if (!raw) return null;
  var s = String(raw).replace(/[\s\-()]/g, '');
  if (s.indexOf('+') === 0) s = s.substring(1);
  if (s.indexOf('00233') === 0) s = s.substring(2); // 00233 -> 233
  if (s.indexOf('233') === 0) {
    s = s.substring(3);
  } else if (s.indexOf('0') === 0) {
    s = s.substring(1);
  } else {
    return null;
  }
  // s should now be 9 digits, e.g. 244123456
  if (!/^\d{9}$/.test(s)) return null;
  var prefix = '0' + s.substring(0, 2);
  var allPrefixes = GHANA_PREFIXES.MTN.concat(GHANA_PREFIXES.TELECEL, GHANA_PREFIXES.AIRTELTIGO);
  if (allPrefixes.indexOf(prefix) === -1) return null;
  return '+233' + s;
}

/** Returns which Ghanaian network a normalised +233 number belongs to, or 'Unknown'. */
function detectNetwork_(e164) {
  if (!e164) return 'Unknown';
  var local = '0' + e164.substring(4, 6);
  if (GHANA_PREFIXES.MTN.indexOf(local) !== -1) return 'MTN';
  if (GHANA_PREFIXES.TELECEL.indexOf(local) !== -1) return 'Telecel';
  if (GHANA_PREFIXES.AIRTELTIGO.indexOf(local) !== -1) return 'AirtelTigo';
  return 'Unknown';
}

/** Counts SMS segments for a message (GSM-7 160/153 rule, ignoring unicode edge cases). */
function smsSegmentCount_(message) {
  var len = (message || '').length;
  if (len === 0) return 0;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

/** Replaces {{Token}} merge fields in a template string. */
function mergeTokens_(template, tokens) {
  var out = template || '';
  Object.keys(tokens || {}).forEach(function (key) {
    var re = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
    out = out.replace(re, tokens[key] === undefined || tokens[key] === null ? '' : String(tokens[key]));
  });
  return out;
}

/** Success envelope for client responses. */
function ok_(data) {
  return { ok: true, data: data };
}

/** Failure envelope for client responses — never leaks stack traces. */
function fail_(message) {
  return { ok: false, error: String(message) };
}

/** Wraps a server function body in try/catch + audit log, per the security requirements. */
function safeCall_(actionName, fn) {
  try {
    var result = fn();
    return ok_(result);
  } catch (err) {
    try { logAudit_('SYSTEM', 'ERROR', actionName, '', String(err && err.message || err)); } catch (e2) { /* swallow logging errors */ }
    return fail_((err && err.message) ? err.message : String(err));
  }
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Sheet Data Access Layer
// =====================================================================================
// Generic helpers so no calling code ever touches getRange()/getValue() in a loop.
// All reads are batched with getValues() and cached; all writes batch setValues()
// and bust the relevant cache entry.

function getSS_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(PROP_KEY.SS_ID);
  if (!ssId) throw new Error('Database not provisioned yet. Run setup() first.');
  return SpreadsheetApp.openById(ssId);
}

function getSheet_(sheetName) {
  var ss = getSS_();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet tab missing: ' + sheetName + '. Run setup() to repair.');
  return sh;
}

function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function cacheKey_(sheetName) {
  return CACHE_PREFIX + sheetName;
}

function invalidateCache_(sheetName) {
  CacheService.getScriptCache().remove(cacheKey_(sheetName));
}

/**
 * Reads an entire tab into an array of plain objects keyed by header name.
 * Cached in CacheService for CACHE_TTL_SEC; callers that need fresh data after a
 * write should rely on the automatic cache-bust performed by appendRow_/updateById_.
 */
function readTable_(sheetName, opts) {
  opts = opts || {};
  var cache = CacheService.getScriptCache();
  var key = cacheKey_(sheetName);
  if (!opts.skipCache) {
    var cached = cache.get(key);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { /* fall through to re-read */ }
    }
  }
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  var headers = getHeaders_(sh);
  var values = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rows = values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
  try {
    var json = JSON.stringify(rows);
    // CacheService caps individual values at 100KB; skip caching oversized tables.
    if (json.length < 95000) cache.put(key, json, CACHE_TTL_SEC);
  } catch (e) { /* non-fatal */ }
  return rows;
}

/** Appends a new row built from `obj` (missing columns left blank). Adds ID/CreatedAt/UpdatedAt. */
function appendRow_(sheetName, obj, idPrefix) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_(sheetName);
    var headers = getHeaders_(sh);
    var now = new Date();
    var record = {};
    headers.forEach(function (h) { record[h] = ''; });
    Object.keys(obj || {}).forEach(function (k) { record[k] = obj[k]; });
    if (headers.indexOf('ID') !== -1 && !record.ID) record.ID = generateId_(idPrefix || sheetName.substring(0, 3).toUpperCase());
    if (headers.indexOf('CreatedAt') !== -1 && !record.CreatedAt) record.CreatedAt = now;
    if (headers.indexOf('UpdatedAt') !== -1) record.UpdatedAt = now;
    var row = headers.map(function (h) { return record[h] !== undefined ? record[h] : ''; });
    sh.appendRow(row);
    invalidateCache_(sheetName);
    return record;
  } finally {
    lock.releaseLock();
  }
}

/** Finds the row index (1-based, including header) for a given ID using TextFinder. */
function findRowIndexById_(sheet, id) {
  var headers = getHeaders_(sheet);
  var idCol = headers.indexOf('ID') + 1;
  if (idCol === 0) throw new Error('Sheet has no ID column: ' + sheet.getName());
  var finder = sheet.getRange(2, idCol, Math.max(sheet.getLastRow() - 1, 1), 1).createTextFinder(id).matchEntireCell(true);
  var match = finder.findNext();
  return match ? match.getRow() : -1;
}

/** Patches an existing row identified by ID with the given field/value pairs. */
function updateById_(sheetName, id, patch) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_(sheetName);
    var headers = getHeaders_(sh);
    var rowIdx = findRowIndexById_(sh, id);
    if (rowIdx === -1) throw new Error('Record not found: ' + id + ' in ' + sheetName);
    var range = sh.getRange(rowIdx, 1, 1, headers.length);
    var values = range.getValues()[0];
    Object.keys(patch || {}).forEach(function (k) {
      var col = headers.indexOf(k);
      if (col !== -1) values[col] = patch[k];
    });
    var updCol = headers.indexOf('UpdatedAt');
    if (updCol !== -1) values[updCol] = new Date();
    range.setValues([values]);
    invalidateCache_(sheetName);
    var result = {};
    headers.forEach(function (h, i) { result[h] = values[i]; });
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** Returns all rows where row[key] === value (in-memory filter over the cached table). */
function findBy_(sheetName, key, value) {
  return readTable_(sheetName).filter(function (row) { return row[key] === value; });
}

/** Returns the first row where row[key] === value, or null. */
function findOneBy_(sheetName, key, value) {
  var rows = findBy_(sheetName, key, value);
  return rows.length ? rows[0] : null;
}

/** Returns the row with the given ID, or null. */
function getById_(sheetName, id) {
  return findOneBy_(sheetName, 'ID', id);
}

/** Deletes the row with the given ID. Used sparingly (most entities are soft-deleted via Status). */
function deleteById_(sheetName, id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_(sheetName);
    var rowIdx = findRowIndexById_(sh, id);
    if (rowIdx === -1) return false;
    sh.deleteRow(rowIdx);
    invalidateCache_(sheetName);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/** Builds an in-memory index map of a table keyed by ID, for O(1) joins in report code. */
function indexById_(rows) {
  var map = {};
  rows.forEach(function (r) { map[r.ID] = r; });
  return map;
}

// ---- Settings (key/value tab) -------------------------------------------------------

function getSettings_() {
  var cache = CacheService.getScriptCache();
  var key = cacheKey_('SETTINGS_MAP');
  var cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { /* fall through */ }
  }
  var rows = readTable_(SHEETS.SETTINGS);
  var map = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { map[k] = DEFAULT_SETTINGS[k]; });
  rows.forEach(function (r) { map[r.Key] = r.Value; });
  cache.put(key, JSON.stringify(map), CACHE_TTL_SEC);
  return map;
}

function setSetting_(key, value) {
  var sh = getSheet_(SHEETS.SETTINGS);
  var rowIdx = -1;
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1) {
    sh.appendRow([key, value]);
  } else {
    sh.getRange(rowIdx, 2).setValue(value);
  }
  invalidateCache_(SHEETS.SETTINGS);
  CacheService.getScriptCache().remove(cacheKey_('SETTINGS_MAP'));
}

function setSettingsBulk_(patchMap) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sh = getSheet_(SHEETS.SETTINGS);
    var data = sh.getDataRange().getValues();
    var existingKeys = {};
    for (var i = 1; i < data.length; i++) existingKeys[data[i][0]] = i + 1;
    var toAppend = [];
    Object.keys(patchMap).forEach(function (k) {
      if (existingKeys[k]) {
        sh.getRange(existingKeys[k], 2).setValue(patchMap[k]);
      } else {
        toAppend.push([k, patchMap[k]]);
      }
    });
    if (toAppend.length) {
      sh.getRange(sh.getLastRow() + 1, 1, toAppend.length, 2).setValues(toAppend);
    }
    invalidateCache_(SHEETS.SETTINGS);
    CacheService.getScriptCache().remove(cacheKey_('SETTINGS_MAP'));
  } finally {
    lock.releaseLock();
  }
}

// ---- Audit log ------------------------------------------------------------------------

function logAudit_(actor, action, entity, entityId, details) {
  try {
    var sh = getSheet_(SHEETS.AUDIT);
    sh.appendRow([generateId_('LOG'), new Date(), actor || 'SYSTEM', action, entity, entityId || '',
      details ? String(details).substring(0, 500) : '', '']);
    invalidateCache_(SHEETS.AUDIT);
  } catch (e) {
    // Audit logging must never break the calling operation.
  }
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Setup / Auto-Provisioning
// =====================================================================================
// Nothing in this system ever asks a landlord to create a Sheet, tab, or header row by
// hand. setup() is idempotent: safe to re-run any time (e.g. from the Health Check
// screen's "Fix it" buttons) — it repairs missing tabs/columns/folders rather than
// duplicating them.

/**
 * Entry point run once from the Apps Script editor (or triggered automatically by
 * doGet/health check) to provision the whole system: spreadsheet, tabs, headers,
 * validation, Drive folders, default settings, default admin user, default form schema.
 */
function setup() {
  var ss = ensureSpreadsheet_();
  ensureAllSheets_(ss);
  ensureFolders_();
  ensureDefaultSettings_();
  var admin = ensureDefaultAdmin_();
  ensureDefaultFormSchema_();
  PropertiesService.getScriptProperties().setProperty(PROP_KEY.SETUP_DONE, 'Y');
  logAudit_('SYSTEM', 'SETUP', 'System', '', 'setup() completed');
  var msg = 'Setup complete. Spreadsheet: ' + ss.getUrl();
  if (admin && admin.tempPassword) {
    msg += '\nDefault admin login -> Username: ' + admin.email + '  Password: ' + admin.tempPassword +
      '\nChange this password immediately after first login (Settings > My Account).';
  }
  Logger.log(msg);
  return msg;
}

function ensureSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty(PROP_KEY.SS_ID);
  if (ssId) {
    try {
      return SpreadsheetApp.openById(ssId);
    } catch (e) {
      // Stored ID no longer resolves (e.g. file trashed) — fall through and recreate.
    }
  }
  var ss = SpreadsheetApp.create(DB_FILE_NAME);
  props.setProperty(PROP_KEY.SS_ID, ss.getId());
  return ss;
}

function ensureAllSheets_(ss) {
  Object.keys(SCHEMA).forEach(function (sheetName) {
    var expectedHeaders = SCHEMA[sheetName];
    var sh = ss.getSheetByName(sheetName);
    if (!sh) {
      sh = ss.insertSheet(sheetName);
    }
    var lastCol = sh.getLastColumn();
    var currentHeaders = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    var needsHeaderWrite = currentHeaders.length === 0;
    if (!needsHeaderWrite) {
      // Repair: append any missing columns at the end rather than reordering existing data.
      var missing = expectedHeaders.filter(function (h) { return currentHeaders.indexOf(h) === -1; });
      if (missing.length) {
        sh.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
        currentHeaders = currentHeaders.concat(missing);
      }
    } else {
      sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      currentHeaders = expectedHeaders;
    }
    sh.setFrozenRows(1);
    var headerRange = sh.getRange(1, 1, 1, currentHeaders.length);
    headerRange.setFontWeight('bold').setBackground('#111827').setFontColor('#FFFFFF');
    sh.setColumnWidths(1, currentHeaders.length, 140);
    applyColumnFormats_(sh, sheetName, currentHeaders);
  });
  // Remove the default blank "Sheet1" if Apps Script created one alongside our tabs.
  var blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);
}

/** Applies number/date formats and dropdown validation appropriate to each tab. */
function applyColumnFormats_(sh, sheetName, headers) {
  var maxRows = 1000;
  function colLetter(name) {
    var idx = headers.indexOf(name);
    return idx === -1 ? null : idx + 1;
  }
  function setValidation(colName, list) {
    var col = colLetter(colName);
    if (!col) return;
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(true).build();
    sh.getRange(2, col, maxRows, 1).setDataValidation(rule);
  }
  function setDateFmt(colName) {
    var col = colLetter(colName);
    if (col) sh.getRange(2, col, maxRows, 1).setNumberFormat('dd/MM/yyyy');
  }
  function setMoneyFmt(colName) {
    var col = colLetter(colName);
    if (col) sh.getRange(2, col, maxRows, 1).setNumberFormat('#,##0.00');
  }
  if (sheetName === SHEETS.PROPERTIES) {
    setValidation('PropertyType', PROPERTY_TYPES);
    setValidation('Region', GHANA_REGIONS);
    setValidation('Status', ['Active', 'Inactive']);
  }
  if (sheetName === SHEETS.ROOMS) {
    setValidation('Status', ['Vacant', 'Reserved', 'Occupied', 'Maintenance']);
    setValidation('Furnished', ['Y', 'N']);
    setValidation('ListedPublicly', ['Y', 'N']);
    setMoneyFmt('MonthlyRent');
    setMoneyFmt('Deposit');
    setDateFmt('AvailableFrom');
  }
  if (sheetName === SHEETS.TENANTS) {
    setValidation('Status', ['New', 'AwaitingPayment', 'AwaitingApproval', 'AwaitingAgreement', 'Active', 'Notice', 'Vacated', 'Rejected']);
    setValidation('Gender', ['Male', 'Female']);
    setDateFmt('DateOfBirth');
  }
  if (sheetName === SHEETS.TENANCIES) {
    setValidation('PaymentMode', ['Advance', 'Monthly']);
    setValidation('Status', ['AwaitingAgreement', 'Active', 'ExpiringSoon', 'Expired', 'Notice', 'Terminated']);
    setDateFmt('StartDate'); setDateFmt('EndDate'); setDateFmt('SignedAt');
    setMoneyFmt('AdvanceAmount'); setMoneyFmt('MonthlyRent'); setMoneyFmt('Deposit');
  }
  if (sheetName === SHEETS.BOOKINGS) {
    setValidation('PaymentMethod', ['Bank Transfer', 'Mobile Money', 'Cash']);
    setValidation('Status', ['Submitted', 'Approved', 'Rejected']);
    setDateFmt('RequestedAt'); setDateFmt('ReviewedAt');
    setMoneyFmt('AmountGHS');
  }
  if (sheetName === SHEETS.FORM_SCHEMA) {
    setValidation('Type', ['text', 'tel', 'email', 'number', 'date', 'select', 'radio', 'checkbox',
      'textarea', 'file', 'signature', 'heading', 'divider']);
    setValidation('Required', ['Y', 'N']);
    setValidation('Visible', ['Y', 'N']);
  }
  if (sheetName === SHEETS.PAYMENTS) {
    setValidation('Channel', PAYMENT_CHANNELS);
    setDateFmt('PaymentDate'); setDateFmt('PeriodCoveredFrom'); setDateFmt('PeriodCoveredTo');
    setMoneyFmt('AmountGHS');
  }
  if (sheetName === SHEETS.REMINDERS) {
    setValidation('Type', ['Rent-1Month', 'Rent-1Week', 'Rent-1Day', 'Rent-Overdue', 'Notice-3Month',
      'Notice-2Month', 'Notice-1Month', 'Notice-1Week', 'Notice-1Day', 'AgreementPending', 'Custom']);
    setDateFmt('ScheduledFor'); setDateFmt('SentAt');
  }
  if (sheetName === SHEETS.NOTICES) {
    setValidation('Type', ['NoticeToQuit3Month', 'RenewalOffer', 'RentIncrease', 'Warning']);
    setDateFmt('IssuedOn'); setDateFmt('EffectiveDate');
  }
  if (sheetName === SHEETS.MAINTENANCE) {
    setValidation('Priority', ['Low', 'Medium', 'High', 'Urgent']);
    setValidation('Status', ['Open', 'In Progress', 'Resolved']);
    setMoneyFmt('CostGHS');
  }
  if (sheetName === SHEETS.MESSAGES) {
    setValidation('SenderRole', ['Tenant', 'Admin']);
    setValidation('ReadByAdmin', ['Y', 'N']);
    setValidation('ReadByTenant', ['Y', 'N']);
    setDateFmt('SentAt');
  }
  if (sheetName === SHEETS.USERS) {
    setValidation('Role', ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    setValidation('Active', ['Y', 'N']);
  }
}

function ensureFolders_() {
  var props = PropertiesService.getScriptProperties();
  var rootId = props.getProperty(PROP_KEY.FOLDER_ROOT);
  var root;
  if (rootId) {
    try { root = DriveApp.getFolderById(rootId); } catch (e) { root = null; }
  }
  if (!root) {
    var existing = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    root = existing.hasNext() ? existing.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
    props.setProperty(PROP_KEY.FOLDER_ROOT, root.getId());
  }
  SUBFOLDERS.forEach(function (name) {
    var propKey = PROP_KEY.FOLDER_PREFIX + name.replace(/\s+/g, '_');
    var subId = props.getProperty(propKey);
    var sub;
    if (subId) {
      try { sub = DriveApp.getFolderById(subId); } catch (e) { sub = null; }
    }
    if (!sub) {
      var subs = root.getFoldersByName(name);
      sub = subs.hasNext() ? subs.next() : root.createFolder(name);
      props.setProperty(propKey, sub.getId());
    }
  });
  return root;
}

function getFolder_(name) {
  var props = PropertiesService.getScriptProperties();
  var key = PROP_KEY.FOLDER_PREFIX + name.replace(/\s+/g, '_');
  var id = props.getProperty(key);
  if (!id) {
    ensureFolders_();
    id = props.getProperty(key);
  }
  return DriveApp.getFolderById(id);
}

function ensureDefaultSettings_() {
  var existing = readTable_(SHEETS.SETTINGS, { skipCache: true });
  var existingKeys = {};
  existing.forEach(function (r) { existingKeys[r.Key] = true; });
  var missing = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
    if (!existingKeys[k]) missing[k] = DEFAULT_SETTINGS[k];
  });
  if (Object.keys(missing).length) setSettingsBulk_(missing);
}

/** Seeds a default SuperAdmin user (idempotent) and returns credentials only when newly created. */
// Fixed, memorable default admin credentials, per explicit landlord request (this is a
// single-landlord deployment they control end to end). This is weaker than a random
// temp password — change it immediately after first login from Settings, or run
// resetDefaultAdminPassword() below for a different fixed value.
var DEFAULT_ADMIN_USERNAME = 'admin';
var DEFAULT_ADMIN_PASSWORD = 'admin123';

function ensureDefaultAdmin_() {
  var users = readTable_(SHEETS.USERS, { skipCache: true });
  var hasSuperAdmin = users.some(function (u) { return u.Role === 'SuperAdmin'; });
  if (hasSuperAdmin) return null;
  var salt = Utilities.getUuid();
  appendRow_(SHEETS.USERS, {
    Name: 'Default Admin',
    Email: DEFAULT_ADMIN_USERNAME,
    Phone: '',
    Role: 'SuperAdmin',
    PasswordHash: hashPassword_(DEFAULT_ADMIN_PASSWORD, salt),
    Salt: salt,
    Active: 'Y',
    LastLoginAt: ''
  }, 'USR');
  return { email: DEFAULT_ADMIN_USERNAME, tempPassword: DEFAULT_ADMIN_PASSWORD };
}

/**
 * Seeds the default Tenancy Agreement Form schema so the form is never empty on first
 * run. This is the form a tenant fills AFTER their booking payment is approved — it
 * captures personal/guarantor details and the signature; term/payment figures are
 * shown read-only (pulled from the Room and the approved Booking), not re-typed.
 */
function ensureDefaultFormSchema_() {
  var existing = readTable_(SHEETS.FORM_SCHEMA, { skipCache: true });
  if (existing.length) return;
  var defs = [
    ['Personal Details', 'Full Name', 'FullName', 'text', '', 'Y', 'e.g. Kwame Mensah', '', '', 1],
    ['Personal Details', 'Ghana Card Number', 'GhanaCardNumber', 'text', '', 'Y', 'GHA-XXXXXXXXX-X', '', '^GHA-\\d{9}-\\d$', 2],
    ['Personal Details', 'Date of Birth', 'DateOfBirth', 'date', '', 'Y', '', '', '', 3],
    ['Personal Details', 'Gender', 'Gender', 'select', 'Male,Female', 'Y', '', '', '', 4],
    ['Personal Details', 'Marital Status', 'MaritalStatus', 'select', 'Single,Married,Divorced,Widowed', 'N', '', '', '', 5],
    ['Employment & Guarantor', 'Occupation', 'Occupation', 'text', '', 'Y', 'e.g. Trader, Teacher', '', '', 6],
    ['Employment & Guarantor', 'Employer', 'Employer', 'text', '', 'N', '', '', '', 7],
    ['Employment & Guarantor', 'Employer Phone', 'EmployerPhone', 'tel', '', 'N', '', '', '', 8],
    ['Employment & Guarantor', 'Next of Kin Name', 'NextOfKinName', 'text', '', 'Y', '', '', '', 9],
    ['Employment & Guarantor', 'Next of Kin Phone', 'NextOfKinPhone', 'tel', '', 'Y', '', '', '', 10],
    ['Employment & Guarantor', 'Guarantor Name', 'GuarantorName', 'text', '', 'Y', '', '', '', 11],
    ['Employment & Guarantor', 'Guarantor Phone', 'GuarantorPhone', 'tel', '', 'Y', '', '', '', 12],
    ['Employment & Guarantor', 'Guarantor Ghana Card', 'GuarantorGhanaCard', 'text', '', 'N', 'GHA-XXXXXXXXX-X', '', '', 13],
    ['Documents', 'Passport Photo', 'PhotoFile', 'file', '', 'N', '', 'Max 5MB', '', 14],
    ['Documents', 'Ghana Card Scan', 'IdDocFile', 'file', '', 'Y', '', 'Front and back, max 5MB', '', 15],
    ['Declaration & Signature', 'I confirm the information above is accurate', 'Declaration', 'checkbox', '', 'Y', '', '', '', 16],
    ['Declaration & Signature', 'Signature', 'Signature', 'signature', '', 'Y', '', 'Draw or upload your signature', '', 17]
  ];
  defs.forEach(function (d) {
    appendRow_(SHEETS.FORM_SCHEMA, {
      Section: d[0], Label: d[1], FieldKey: d[2], Type: d[3], Options: d[4], Required: d[5],
      Placeholder: d[6], HelpText: d[7], Validation: d[8], SortOrder: d[9], Visible: 'Y', Version: 1
    }, 'FLD');
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Web App Entry Point
// =====================================================================================

/** Serves the SPA shell. Auto-provisions the database on the very first hit. */
function doGet(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    if (props.getProperty(PROP_KEY.SETUP_DONE) !== 'Y') {
      setup();
    }
  } catch (err) {
    return HtmlService.createHtmlOutput(
      '<pre style="font-family:monospace;padding:24px;white-space:pre-wrap;">Setup error: ' +
      escapeHtml_(err && err.message ? err.message : err) +
      '\n\nOpen the Apps Script editor and run setup() manually, then reload this page.</pre>'
    );
  }
  var settings = getSettings_();
  var tmpl = HtmlService.createTemplateFromFile('index');
  tmpl.appName = settings.AppName || APP_DEFAULT_NAME;
  return tmpl.evaluate()
    .setTitle(settings.AppName || APP_DEFAULT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Include helper used by index.html to pull in Styles.html / Scripts.html. */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Auth & Roles
// =====================================================================================
// Apps Script has no built-in session concept for anonymous web apps, and every
// google.script.run function is technically publicly callable — so every privileged
// function below calls requireRole_() as its first line, checking a signed session
// token issued at login and cached server-side (CacheService), not just trusted from
// the client.

var SESSION_TTL_SEC = 21600; // 6 hours
var LOGIN_RATE_LIMIT = 6; // attempts
var LOGIN_RATE_WINDOW_SEC = 600;

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + '::' + salt);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function makeSessionToken_() {
  return Utilities.getUuid() + '.' + Utilities.getUuid();
}

function rateLimitKey_(bucket, identity) {
  return CACHE_PREFIX + 'rl_' + bucket + '_' + identity;
}

/** Throws if `identity` has exceeded LOGIN_RATE_LIMIT attempts for `bucket` within the window. */
function checkRateLimit_(bucket, identity) {
  var cache = CacheService.getScriptCache();
  var key = rateLimitKey_(bucket, identity);
  var count = Number(cache.get(key) || 0);
  if (count >= LOGIN_RATE_LIMIT) {
    throw new Error('Too many attempts. Please wait a few minutes and try again.');
  }
  cache.put(key, String(count + 1), LOGIN_RATE_WINDOW_SEC);
}

function clearRateLimit_(bucket, identity) {
  CacheService.getScriptCache().remove(rateLimitKey_(bucket, identity));
}

/** Admin/staff login with email + password. Returns a session token on success. */
function adminLogin(email, password) {
  return safeCall_('adminLogin', function () {
    if (!email || !password) throw new Error('Email and password are required.');
    checkRateLimit_('login', String(email).toLowerCase());
    var user = findOneBy_(SHEETS.USERS, 'Email', String(email).toLowerCase().trim());
    if (!user) user = findOneBy_(SHEETS.USERS, 'Email', email); // tolerate case as originally stored
    if (!user || user.Active !== 'Y') throw new Error('Invalid email or password.');
    var hash = hashPassword_(password, user.Salt);
    if (hash !== user.PasswordHash) throw new Error('Invalid email or password.');
    clearRateLimit_('login', String(email).toLowerCase());
    var token = makeSessionToken_();
    var session = { userId: user.ID, name: user.Name, role: user.Role, email: user.Email };
    CacheService.getScriptCache().put(CACHE_PREFIX + 'sess_' + token, JSON.stringify(session), SESSION_TTL_SEC);
    updateById_(SHEETS.USERS, user.ID, { LastLoginAt: new Date() });
    logAudit_(user.Name, 'LOGIN', 'User', user.ID, 'Admin login');
    return { token: token, user: session, onboardingDone: getSettings_().OnboardingDone === 'Y' };
  });
}

function getSession_(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get(CACHE_PREFIX + 'sess_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function adminLogout(token) {
  return safeCall_('adminLogout', function () {
    if (token) CacheService.getScriptCache().remove(CACHE_PREFIX + 'sess_' + token);
    return true;
  });
}

/** Throws unless the session token resolves to a user holding one of the allowed roles. */
function requireRole_(token, allowedRoles) {
  var session = getSession_(token);
  if (!session) throw new Error('Session expired. Please log in again.');
  if (allowedRoles && allowedRoles.indexOf(session.role) === -1) {
    throw new Error('You do not have permission to perform this action.');
  }
  return session;
}

function whoAmI(token) {
  return safeCall_('whoAmI', function () {
    var session = getSession_(token);
    if (!session) throw new Error('Not logged in.');
    return session;
  });
}

// ---- Tenant self-service: real signup/login accounts ---------------------------------
// The tenant portal uses a real account (name/phone/email/password), not a one-time
// code — matching "tenant will have a portal to sign up and login". A 6-digit SMS code
// is still used, but only as the "forgot password" recovery path (see below).

function requireTenant_(token) {
  var session = getSession_(token);
  if (!session || session.role !== 'Tenant') throw new Error('Please log in to your tenant portal first.');
  return session;
}

function tenantSessionFor_(tenant) {
  return { tenantId: tenant.ID, name: tenant.FullName, role: 'Tenant', phone: tenant.Phone, email: tenant.Email };
}

function issueTenantSession_(tenant) {
  var token = makeSessionToken_();
  var session = tenantSessionFor_(tenant);
  CacheService.getScriptCache().put(CACHE_PREFIX + 'sess_' + token, JSON.stringify(session), SESSION_TTL_SEC);
  return { token: token, tenant: session };
}

/**
 * Tenant self-signup. Creates the tenant account, then automatically sends the
 * welcome SMS + email telling them to inspect the room and submit payment. If
 * `roomId` is supplied (tenant arrived via "Rent this room"), the welcome message
 * names that specific room/property.
 */
function tenantSignup(data) {
  return safeCall_('tenantSignup', function () {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      if (!data.fullName || !data.password) throw new Error('Name and password are required.');
      if (String(data.password).length < 6) throw new Error('Password must be at least 6 characters.');
      var phone = normalizePhoneGh_(data.phone);
      if (!phone) throw new Error('Enter a valid Ghanaian mobile number.');
      if (findOneBy_(SHEETS.TENANTS, 'Phone', phone)) throw new Error('An account with this phone number already exists. Please log in instead.');
      if (data.email) {
        var existingEmail = findOneBy_(SHEETS.TENANTS, 'Email', data.email.toLowerCase().trim());
        if (existingEmail) throw new Error('An account with this email already exists. Please log in instead.');
      }
      var salt = Utilities.getUuid();
      var tenant = appendRow_(SHEETS.TENANTS, {
        FullName: data.fullName, Phone: phone, Email: (data.email || '').toLowerCase().trim(),
        PasswordHash: hashPassword_(data.password, salt), Salt: salt, Status: 'New'
      }, 'TNT');

      var settings = getSettings_();
      var room = data.roomId ? getById_(SHEETS.ROOMS, data.roomId) : null;
      var property = room ? getById_(SHEETS.PROPERTIES, room.PropertyID) : null;
      var tokens = {
        AppName: settings.AppName, TenantName: tenant.FullName,
        RoomLabel: room ? room.RoomLabel : 'your chosen room', PropertyName: property ? property.PropertyName : 'the property',
        LandlordName: settings.LandlordName, LandlordPhone: settings.LandlordPhone
      };
      if (settings.SmsEnabled === 'Y') SmsService.send([phone], mergeTokens_(settings.WelcomeSmsTemplate, tokens));
      if (settings.EmailEnabled === 'Y' && tenant.Email) {
        EmailService.send(tenant.Email, 'Welcome to ' + settings.AppName,
          '<p>' + escapeHtml_(mergeTokens_(settings.WelcomeEmailTemplate, tokens)) + '</p>', []);
      }
      logAudit_(tenant.FullName, 'SIGNUP', 'Tenant', tenant.ID, 'Self-signup');
      return issueTenantSession_(tenant);
    } finally {
      lock.releaseLock();
    }
  });
}

/** Tenant login with phone or email + password. */
function tenantLogin(identifier, password) {
  return safeCall_('tenantLogin', function () {
    if (!identifier || !password) throw new Error('Enter your phone/email and password.');
    checkRateLimit_('tenant_login', String(identifier).toLowerCase());
    var phone = normalizePhoneGh_(identifier);
    var tenant = phone ? findOneBy_(SHEETS.TENANTS, 'Phone', phone) : findOneBy_(SHEETS.TENANTS, 'Email', String(identifier).toLowerCase().trim());
    if (!tenant || !tenant.PasswordHash) throw new Error('Invalid login details.');
    if (hashPassword_(password, tenant.Salt) !== tenant.PasswordHash) throw new Error('Invalid login details.');
    clearRateLimit_('tenant_login', String(identifier).toLowerCase());
    logAudit_(tenant.FullName, 'LOGIN', 'Tenant', tenant.ID, 'Portal login');
    return issueTenantSession_(tenant);
  });
}

/** Forgot-password recovery: sends a 6-digit SMS code, 10-minute expiry, rate-limited. */
function tenantRequestPasswordReset(phoneRaw) {
  return safeCall_('tenantRequestPasswordReset', function () {
    var phone = normalizePhoneGh_(phoneRaw);
    if (!phone) throw new Error('Enter a valid Ghanaian mobile number.');
    checkRateLimit_('tenant_reset', phone);
    var tenant = findOneBy_(SHEETS.TENANTS, 'Phone', phone);
    if (!tenant) throw new Error('No account found for that phone number.');
    var code = String(Math.floor(100000 + Math.random() * 900000));
    var salt = Utilities.getUuid();
    CacheService.getScriptCache().put(CACHE_PREFIX + 'reset_' + phone, JSON.stringify({
      hash: hashPassword_(code, salt), salt: salt, tenantId: tenant.ID
    }), 600);
    SmsService.send([phone], 'Your KEY & DEED password reset code is ' + code + '. Valid for 10 minutes.');
    return { sent: true };
  });
}

function tenantResetPassword(phoneRaw, code, newPassword) {
  return safeCall_('tenantResetPassword', function () {
    var phone = normalizePhoneGh_(phoneRaw);
    var raw = CacheService.getScriptCache().get(CACHE_PREFIX + 'reset_' + phone);
    if (!raw) throw new Error('Code expired. Please request a new one.');
    var record = JSON.parse(raw);
    if (hashPassword_(code, record.salt) !== record.hash) throw new Error('Incorrect code.');
    if (String(newPassword).length < 6) throw new Error('Password must be at least 6 characters.');
    CacheService.getScriptCache().remove(CACHE_PREFIX + 'reset_' + phone);
    var newSalt = Utilities.getUuid();
    updateById_(SHEETS.TENANTS, record.tenantId, { PasswordHash: hashPassword_(newPassword, newSalt), Salt: newSalt });
    logAudit_('SYSTEM', 'PASSWORD_RESET', 'Tenant', record.tenantId, '');
    return { reset: true };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Public Portal API
// =====================================================================================
// One consolidated payload per screen — the public portal loads its entire catalogue
// in a single call and filters client-side, per the speed requirements. Every room is
// shown — vacant ("Available") and occupied ("Rented") alike — so a prospective tenant
// can see the full picture of a landlord's portfolio, not just the vacancies.

/** Builds a no-API-key Google Maps embed URL from a property's address fields. */
function mapEmbedUrl_(property) {
  var query = property.GhanaPostGPS || (property.StreetAddress + ', ' + property.Town + ', ' + property.Region + ', Ghana');
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&output=embed';
}
function mapDirectionsUrl_(property) {
  var query = property.GhanaPostGPS || (property.Town + ' ' + property.Region + ', Ghana');
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}

function getPublicListings() {
  return safeCall_('getPublicListings', function () {
    var settings = getSettings_();
    if (settings.PublicPortalEnabled !== 'Y') return { enabled: false, rooms: [], properties: [] };
    var properties = readTable_(SHEETS.PROPERTIES).filter(function (p) { return p.Status === 'Active'; });
    var propMap = indexById_(properties);
    var rooms = readTable_(SHEETS.ROOMS).filter(function (r) { return r.ListedPublicly === 'Y' && propMap[r.PropertyID]; });
    var listings = rooms.map(function (r) {
      var p = propMap[r.PropertyID];
      var availability = r.Status === 'Vacant' ? 'Available' : (r.Status === 'Maintenance' ? 'Unavailable' : 'Rented');
      return {
        roomId: r.ID, propertyId: p.ID, propertyName: p.PropertyName, propertyType: p.PropertyType,
        region: p.Region, town: p.Town, ghanaPostGPS: p.GhanaPostGPS,
        roomLabel: r.RoomLabel, roomType: r.RoomType, bedrooms: r.Bedrooms, bathrooms: r.Bathrooms,
        furnished: r.Furnished, monthlyRent: r.MonthlyRent, minAdvanceMonths: r.MinAdvanceMonths,
        deposit: r.Deposit, amenities: (r.Amenities || '').split(',').filter(Boolean),
        photoFileIds: (r.PhotoFileIds || '').split(',').filter(Boolean),
        propertyPhotoFileIds: (p.PhotoFileIds || '').split(',').filter(Boolean),
        availableFrom: formatDate_(r.AvailableFrom), rentFormatted: formatGHS_(r.MonthlyRent),
        availability: availability, status: r.Status
      };
    });
    return {
      enabled: true, rooms: listings, regions: GHANA_REGIONS,
      landlordPhone: settings.LandlordPhone, appName: settings.AppName
    };
  });
}

function getRoomDetail(roomId) {
  return safeCall_('getRoomDetail', function () {
    var room = getById_(SHEETS.ROOMS, roomId);
    if (!room) throw new Error('Room not found.');
    var property = getById_(SHEETS.PROPERTIES, room.PropertyID);
    var settings = getSettings_();
    var availability = room.Status === 'Vacant' ? 'Available' : (room.Status === 'Maintenance' ? 'Unavailable' : 'Rented');
    return {
      room: room, property: property, availability: availability,
      photoFileIds: (room.PhotoFileIds || '').split(',').filter(Boolean),
      propertyPhotoFileIds: (property.PhotoFileIds || '').split(',').filter(Boolean),
      amenities: (room.Amenities || '').split(',').filter(Boolean),
      rentFormatted: formatGHS_(room.MonthlyRent),
      depositFormatted: formatGHS_(room.Deposit),
      mapEmbedUrl: mapEmbedUrl_(property), mapDirectionsUrl: mapDirectionsUrl_(property),
      landlordPhone: settings.LandlordPhone, appName: settings.AppName
    };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Form Schema API
// =====================================================================================
// Drives the Tenancy Agreement Form (the form a tenant fills after their booking
// payment is approved) — never hard-coded, always rendered from this table.

function getFormSchema() {
  return safeCall_('getFormSchema', function () {
    var fields = readTable_(SHEETS.FORM_SCHEMA)
      .filter(function (f) { return f.Visible === 'Y'; })
      .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
    return { fields: fields };
  });
}

function getFormSchemaAdmin(token) {
  return safeCall_('getFormSchemaAdmin', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    var fields = readTable_(SHEETS.FORM_SCHEMA).sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
    return { fields: fields };
  });
}

var CORE_FIELD_KEYS = ['FullName', 'GhanaCardNumber', 'Signature'];

function saveFormField(token, field) {
  return safeCall_('saveFormField', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    if (!field.Label || !field.FieldKey || !field.Type) throw new Error('Label, field key and type are required.');
    if (field.ID) {
      var existing = getById_(SHEETS.FORM_SCHEMA, field.ID);
      if (existing && CORE_FIELD_KEYS.indexOf(existing.FieldKey) !== -1 && field.FieldKey !== existing.FieldKey) {
        throw new Error('Core field keys cannot be renamed: ' + existing.FieldKey);
      }
      var updated = updateById_(SHEETS.FORM_SCHEMA, field.ID, field);
      logAudit_(session.name, 'UPDATE', 'FormField', field.ID, field.Label);
      return updated;
    }
    var created = appendRow_(SHEETS.FORM_SCHEMA, field, 'FLD');
    logAudit_(session.name, 'CREATE', 'FormField', created.ID, field.Label);
    return created;
  });
}

function deleteFormField(token, fieldId) {
  return safeCall_('deleteFormField', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var field = getById_(SHEETS.FORM_SCHEMA, fieldId);
    if (!field) throw new Error('Field not found.');
    if (CORE_FIELD_KEYS.indexOf(field.FieldKey) !== -1) throw new Error('Core fields cannot be deleted, only relabelled or hidden.');
    deleteById_(SHEETS.FORM_SCHEMA, fieldId);
    logAudit_(session.name, 'DELETE', 'FormField', fieldId, field.Label);
    return true;
  });
}

function reorderFormFields(token, orderedIds) {
  return safeCall_('reorderFormFields', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    orderedIds.forEach(function (id, i) { updateById_(SHEETS.FORM_SCHEMA, id, { SortOrder: i + 1 }); });
    logAudit_(session.name, 'REORDER', 'FormSchema', '', orderedIds.length + ' fields');
    return true;
  });
}

/** Bumps every visible field's Version by 1 so historic submissions still render against their original schema. */
function publishFormSchema(token) {
  return safeCall_('publishFormSchema', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var fields = readTable_(SHEETS.FORM_SCHEMA, { skipCache: true });
    var nextVersion = 1 + fields.reduce(function (max, f) { return Math.max(max, Number(f.Version) || 1); }, 1);
    fields.forEach(function (f) { updateById_(SHEETS.FORM_SCHEMA, f.ID, { Version: nextVersion }); });
    logAudit_(session.name, 'PUBLISH', 'FormSchema', '', 'v' + nextVersion);
    return { version: nextVersion };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: File & Signature Handling
// =====================================================================================

var MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB client-side guard mirrored server-side

/**
 * Saves a base64 data-URI (or raw base64) payload to the given Drive subfolder.
 * Returns the Drive file ID. Used for signatures, ID scans, photos, payment proofs
 * and generated PDFs.
 */
function saveBase64File_(base64Data, mimeType, folderName, filenameHint) {
  var cleaned = base64Data.indexOf(',') !== -1 ? base64Data.split(',')[1] : base64Data;
  var bytes = Utilities.base64Decode(cleaned);
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error('File exceeds 5MB limit.');
  var blob = Utilities.newBlob(bytes, mimeType, filenameHint || ('file_' + Date.now()));
  var folder = getFolder_(folderName);
  var file = folder.createFile(blob);
  return file.getId();
}

/** Public-facing wrapper for tenant signature/document/payment-proof uploads. */
function uploadFile(payload) {
  return safeCall_('uploadFile', function () {
    var kind = payload.kind; // 'signature' | 'idDoc' | 'photo' | 'ticketPhoto' | 'proof' | 'propertyPhoto'
    var folderMap = {
      signature: 'Signatures', idDoc: 'Tenant Documents', photo: 'Tenant Documents',
      ticketPhoto: 'Tenant Documents', propertyPhoto: 'Property Photos', proof: 'Payment Proofs'
    };
    var folder = folderMap[kind] || 'Tenant Documents';
    var fileId = saveBase64File_(payload.base64, payload.mimeType, folder, payload.filename);
    return { fileId: fileId };
  });
}

/** Returns a direct-viewable/downloadable URL for a Drive file ID (used by <img>/links client-side). */
function getFileUrl(fileId) {
  return safeCall_('getFileUrl', function () {
    if (!fileId) return { url: '' };
    return { url: 'https://drive.google.com/uc?export=view&id=' + fileId };
  });
}

/** Returns a lower-resolution thumbnail URL for gallery grids (speed requirement: no full-res in lists). */
function getThumbUrl(fileId, size) {
  return safeCall_('getThumbUrl', function () {
    if (!fileId) return { url: '' };
    return { url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w' + (size || 400) };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: PDF Generation
// =====================================================================================
// All documents share one HTML->PDF engine (Utilities.newBlob(...).getAs(MimeType.PDF)).
// Signature and logo images are embedded as inline <img> data URIs pulled from Drive.

function fileToDataUri_(fileId) {
  if (!fileId) return '';
  try {
    var blob = DriveApp.getFileById(fileId).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return '';
  }
}

function pdfDocStyles_() {
  return '<style>' +
    'body{font-family:"Helvetica Neue",Arial,sans-serif;color:#111827;font-size:12px;line-height:1.5;margin:32px;}' +
    'h1{font-size:20px;margin:0 0 4px;} h2{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #E5E7EB;padding-bottom:4px;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:8px;} td{padding:3px 6px;vertical-align:top;}' +
    '.label{color:#6B7280;width:38%;} .header{display:flex;justify-content:space-between;margin-bottom:16px;}' +
    '.logo{max-height:48px;} .sig{max-height:60px;border-bottom:1px solid #111827;}' +
    '.footer{margin-top:24px;font-size:9px;color:#6B7280;border-top:1px solid #E5E7EB;padding-top:8px;}' +
    '.badge{display:inline-block;padding:2px 8px;border:1px solid #0B7A4B;color:#0B7A4B;border-radius:10px;font-size:10px;}' +
    '</style>';
}

function pdfHeader_(title, settings) {
  var logo = settings.BusinessLogoFileId ? '<img class="logo" src="' + fileToDataUri_(settings.BusinessLogoFileId) + '"/>' : '<strong>' + escapeHtml_(settings.AppName) + '</strong>';
  return '<div class="header"><div>' + logo + '</div><div style="text-align:right;"><h1>' + escapeHtml_(title) + '</h1>' +
    '<div>' + escapeHtml_(settings.LandlordName) + ' &middot; ' + escapeHtml_(settings.LandlordPhone) + '</div></div></div>';
}

function pdfFooter_(settings) {
  return '<div class="footer">' + escapeHtml_(settings.PdfFooterText) + '<br/>' + escapeHtml_(settings.RentControlDisclaimer) + '</div>';
}

function htmlToPdfBlob_(html, filename) {
  return Utilities.newBlob(html, MimeType.HTML, filename + '.html').getAs(MimeType.PDF).setName(filename + '.pdf');
}

/**
 * Builds and saves the full Ghanaian tenancy agreement PDF, once a booking payment has
 * been approved and the tenant has filled and signed the form. `ctx.booking` (optional)
 * carries the confirmed payment method/amount/date so the agreement documents exactly
 * what was paid, not just what's owed. Returns the Drive file ID.
 */
function generateAgreementPdf_(ctx) {
  var settings = getSettings_();
  var tenant = ctx.tenant, property = ctx.property, room = ctx.room, booking = ctx.booking;
  var startDate = ctx.startDate instanceof Date ? ctx.startDate : new Date(ctx.startDate);
  var advanceMonths = Number(ctx.advanceMonths) || 12;
  var endDate = addMonths_(startDate, advanceMonths);
  var advanceAmount = Number(ctx.advanceAmount) || 0;
  var sigDataUri = ctx.signatureFileId ? fileToDataUri_(ctx.signatureFileId) : '';
  var advisory = advanceMonths > 6 ?
    '<p style="color:#B45309;"><em>Advisory: Act 220 (Rent Act, 1963) caps residential rent advance at 6 months. This agreement records ' +
    advanceMonths + ' months as actually agreed by both parties.</em></p>' : '';
  var paymentConfirmation = booking ?
    '<h2>5. Payment Confirmation</h2><table>' +
    '<tr><td class="label">Amount Paid</td><td>' + formatGHS_(booking.AmountGHS) + '</td></tr>' +
    '<tr><td class="label">Payment Method</td><td>' + escapeHtml_(booking.PaymentMethod) + '</td></tr>' +
    '<tr><td class="label">Date Confirmed</td><td>' + formatDate_(booking.ReviewedAt) + '</td></tr>' +
    '<tr><td class="label">Confirmed By</td><td>' + escapeHtml_(booking.ReviewedBy) + '</td></tr></table>' : '';

  var html = '<html><head>' + pdfDocStyles_() + '</head><body>' +
    pdfHeader_((ctx.draft ? 'DRAFT — ' : '') + 'Tenancy Agreement', settings) +
    '<span class="badge">' + escapeHtml_(property.PropertyName) + ' &middot; ' + escapeHtml_(room.RoomLabel) + '</span>' +
    '<h2>1. Parties</h2>' +
    '<table><tr><td class="label">Landlord/Landlady</td><td>' + escapeHtml_(settings.LandlordName) + ' (' + escapeHtml_(settings.LandlordPhone) + ')</td></tr>' +
    '<tr><td class="label">Tenant</td><td>' + escapeHtml_(tenant.FullName) + ' (' + escapeHtml_(tenant.Phone) + ')</td></tr>' +
    '<tr><td class="label">Ghana Card</td><td>' + escapeHtml_(tenant.GhanaCardNumber) + '</td></tr>' +
    '<tr><td class="label">Guarantor</td><td>' + escapeHtml_(tenant.GuarantorName) + ' (' + escapeHtml_(tenant.GuarantorPhone) + ')</td></tr></table>' +
    '<h2>2. Premises</h2>' +
    '<table><tr><td class="label">Property</td><td>' + escapeHtml_(property.PropertyName) + ', ' + escapeHtml_(property.PropertyType) + '</td></tr>' +
    '<tr><td class="label">Room</td><td>' + escapeHtml_(room.RoomLabel) + ' (' + escapeHtml_(room.RoomType) + ')</td></tr>' +
    '<tr><td class="label">Address</td><td>' + escapeHtml_(property.StreetAddress) + ', ' + escapeHtml_(property.Town) + ', ' + escapeHtml_(property.Region) + '</td></tr>' +
    '<tr><td class="label">Ghana Post GPS</td><td>' + escapeHtml_(property.GhanaPostGPS) + '</td></tr></table>' +
    '<h2>3. Term (Duration)</h2>' +
    '<table><tr><td class="label">Start Date</td><td>' + formatDate_(startDate) + '</td></tr>' +
    '<tr><td class="label">End Date</td><td>' + formatDate_(endDate) + '</td></tr>' +
    '<tr><td class="label">Duration</td><td>' + advanceMonths + ' months</td></tr></table>' +
    '<h2>4. Rent & Advance</h2>' + advisory +
    '<table><tr><td class="label">Monthly Rent</td><td>' + formatGHS_(room.MonthlyRent) + '</td></tr>' +
    '<tr><td class="label">Advance Paid</td><td>' + formatGHS_(advanceAmount) + ' (' + advanceMonths + ' months)</td></tr>' +
    '<tr><td class="label">Deposit</td><td>' + formatGHS_(room.Deposit) + '</td></tr></table>' +
    paymentConfirmation +
    '<h2>6. Utilities & Levies</h2>' +
    '<p>' + escapeHtml_(room.UtilitiesIncluded || 'As agreed between the parties: electricity, water, waste collection, security levy and caretaker fee responsibilities to be confirmed in writing.') + '</p>' +
    '<h2>7. Tenant Covenants</h2>' +
    '<p>The Tenant shall pay rent as agreed, use the premises for residential purposes only, keep the premises in good repair (fair wear and tear excepted), not sublet without written consent, and give the required notice before vacating.</p>' +
    '<h2>8. Landlord Covenants</h2>' +
    '<p>The Landlord/Landlady shall ensure quiet enjoyment of the premises, keep the structure in good repair, and give the required notice before requiring the Tenant to vacate.</p>' +
    '<h2>9. Repairs</h2><p>Structural repairs are the Landlord\'s responsibility; minor/day-to-day repairs arising from tenant use are the Tenant\'s responsibility, unless otherwise agreed.</p>' +
    '<h2>10. Assignment & Subletting</h2><p>The Tenant shall not assign or sublet the premises without the Landlord\'s prior written consent.</p>' +
    '<h2>11. Termination & Notice</h2><p>Either party may terminate this tenancy by giving the other not less than three (3) months\' written notice, or as otherwise required by the Rent Act, 1963 (Act 220).</p>' +
    '<h2>12. Dispute Resolution</h2><p>Disputes arising from this agreement should first be referred to the Rent Control Division, Ministry of Works and Housing, before recourse to the courts.</p>' +
    '<h2>13. Signatures & Witnesses</h2>' +
    '<table><tr><td style="width:50%;">Tenant Signature:<br/>' +
    (sigDataUri ? '<img class="sig" src="' + sigDataUri + '"/>' : '<div style="height:60px;border-bottom:1px solid #111827;"></div>') +
    '<br/>' + escapeHtml_(tenant.FullName) + ' &middot; ' + formatDate_(new Date()) + '</td>' +
    '<td>Landlord/Landlady Signature:<br/><div style="height:60px;border-bottom:1px solid #111827;"></div><br/>' +
    escapeHtml_(settings.LandlordName) + '</td></tr></table>' +
    pdfFooter_(settings) + '</body></html>';

  var blob = htmlToPdfBlob_(html, 'Agreement_' + tenant.FullName.replace(/\s+/g, '_'));
  var folder = getFolder_('Agreements');
  return folder.createFile(blob).getId();
}

/** Generates a numbered rent receipt PDF. */
function generateReceiptPdf_(payment, tenant, property, room) {
  var settings = getSettings_();
  var html = '<html><head>' + pdfDocStyles_() + '</head><body>' +
    pdfHeader_('Rent Receipt', settings) +
    '<span class="badge">' + escapeHtml_(payment.ReceiptNumber) + '</span>' +
    '<h2>Receipt Details</h2>' +
    '<table>' +
    '<tr><td class="label">Received From</td><td>' + escapeHtml_(tenant.FullName) + '</td></tr>' +
    '<tr><td class="label">Property / Room</td><td>' + escapeHtml_(property.PropertyName) + ' — ' + escapeHtml_(room.RoomLabel) + '</td></tr>' +
    '<tr><td class="label">Amount</td><td>' + formatGHS_(payment.AmountGHS) + '</td></tr>' +
    '<tr><td class="label">Payment Date</td><td>' + formatDate_(payment.PaymentDate) + '</td></tr>' +
    '<tr><td class="label">Channel</td><td>' + escapeHtml_(payment.Channel) + '</td></tr>' +
    '<tr><td class="label">Reference</td><td>' + escapeHtml_(payment.Reference) + '</td></tr>' +
    '<tr><td class="label">Period Covered</td><td>' + formatDate_(payment.PeriodCoveredFrom) + ' — ' + formatDate_(payment.PeriodCoveredTo) + '</td></tr>' +
    '<tr><td class="label">Notes</td><td>' + escapeHtml_(payment.Notes) + '</td></tr>' +
    '</table>' + pdfFooter_(settings) + '</body></html>';
  var blob = htmlToPdfBlob_(html, 'Receipt_' + payment.ReceiptNumber.replace(/\//g, '-'));
  return getFolder_('Receipts').createFile(blob).getId();
}

/** Generates the 3-month Notice to Quit / Notice of Non-Renewal PDF. */
function generateNoticePdf_(notice, tenancy, tenant, property, room, reasonText) {
  var settings = getSettings_();
  var html = '<html><head>' + pdfDocStyles_() + '</head><body>' +
    pdfHeader_('Notice to Quit', settings) +
    '<p>' + formatDate_(notice.IssuedOn) + '</p>' +
    '<p>To: ' + escapeHtml_(tenant.FullName) + '<br/>' + escapeHtml_(property.StreetAddress) + ', ' + escapeHtml_(property.Town) + '<br/>' +
    'Ghana Post GPS: ' + escapeHtml_(property.GhanaPostGPS) + '</p>' +
    '<h2>Notice to Quit / Notice of Non-Renewal of Tenancy</h2>' +
    '<p>Dear ' + escapeHtml_(tenant.FullName) + ',</p>' +
    '<p>This letter serves as formal notice, in accordance with the Rent Act, 1963 (Act 220), that your tenancy of ' +
    '<strong>' + escapeHtml_(room.RoomLabel) + '</strong> at <strong>' + escapeHtml_(property.PropertyName) + '</strong>, ' +
    escapeHtml_(property.StreetAddress) + ', ' + escapeHtml_(property.Town) + ', ' + escapeHtml_(property.Region) +
    ' (Ghana Post GPS: ' + escapeHtml_(property.GhanaPostGPS) + ') will end on <strong>' + formatDate_(notice.EffectiveDate) + '</strong>.</p>' +
    '<p><strong>Reason:</strong> ' + escapeHtml_(reasonText) + '</p>' +
    '<p>You are kindly required to vacate the premises, settle any outstanding balances, and hand over keys and access items on or before the effective date stated above.</p>' +
    '<p>Should you have any queries, please contact ' + escapeHtml_(settings.LandlordName) + ' on ' + escapeHtml_(settings.LandlordPhone) + '.</p>' +
    '<h2>Signatures</h2>' +
    '<table><tr><td style="width:50%;">Landlord/Landlady:<br/><div style="height:60px;border-bottom:1px solid #111827;"></div>' + escapeHtml_(settings.LandlordName) + '</td>' +
    '<td>Date: ' + formatDate_(notice.IssuedOn) + '</td></tr></table>' +
    pdfFooter_(settings) + '</body></html>';
  var blob = htmlToPdfBlob_(html, 'NoticeToQuit_' + tenant.FullName.replace(/\s+/g, '_'));
  return getFolder_('Notices').createFile(blob).getId();
}

/** Generates a yearly (or full-history) statement of account PDF for one tenancy. */
function generateStatementPdf_(tenancy, tenant, property, room, payments) {
  var settings = getSettings_();
  var rows = payments.map(function (p) {
    return '<tr><td>' + formatDate_(p.PaymentDate) + '</td><td>' + escapeHtml_(p.Channel) + '</td><td>' +
      escapeHtml_(p.Reference) + '</td><td style="text-align:right;">' + formatGHS_(p.AmountGHS) + '</td></tr>';
  }).join('');
  var total = payments.reduce(function (s, p) { return s + (Number(p.AmountGHS) || 0); }, 0);
  var html = '<html><head>' + pdfDocStyles_() + '</head><body>' +
    pdfHeader_('Statement of Account', settings) +
    '<table><tr><td class="label">Tenant</td><td>' + escapeHtml_(tenant.FullName) + '</td></tr>' +
    '<tr><td class="label">Property / Room</td><td>' + escapeHtml_(property.PropertyName) + ' — ' + escapeHtml_(room.RoomLabel) + '</td></tr>' +
    '<tr><td class="label">Tenancy Period</td><td>' + formatDate_(tenancy.StartDate) + ' — ' + formatDate_(tenancy.EndDate) + '</td></tr></table>' +
    '<h2>Payment History</h2><table><tr><td class="label">Date</td><td class="label">Channel</td><td class="label">Reference</td><td class="label" style="text-align:right;">Amount</td></tr>' +
    rows + '<tr><td colspan="3" style="text-align:right;font-weight:bold;">Total Paid</td><td style="text-align:right;font-weight:bold;">' + formatGHS_(total) + '</td></tr></table>' +
    pdfFooter_(settings) + '</body></html>';
  var blob = htmlToPdfBlob_(html, 'Statement_' + tenant.FullName.replace(/\s+/g, '_'));
  return getFolder_('Receipts').createFile(blob).getId();
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Bookings (Room Booking & Payment) — Stage 1 of the tenancy pipeline
// =====================================================================================
// A logged-in tenant chooses a room, pays by bank/mobile money/cash outside the system,
// then submits this form with proof (a screenshot for bank/MoMo, a note for cash). The
// room is held as "Reserved" while the landlord reviews. Only once the landlord
// approves does the Tenancy Agreement Form unlock (see next region).

/** Tenant submits a booking + payment proof for a room. */
function submitBooking(token, data) {
  return safeCall_('submitBooking', function () {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var session = requireTenant_(token);
      var room = getById_(SHEETS.ROOMS, data.roomId);
      if (!room) throw new Error('Room not found.');
      if (room.Status !== 'Vacant') throw new Error('Sorry, this room is no longer available.');
      if (!data.paymentMethod) throw new Error('Select how you paid.');
      if (!data.amountGHS || Number(data.amountGHS) <= 0) throw new Error('Enter the amount you paid.');
      if (data.paymentMethod !== 'Cash' && !data.proofFileId) throw new Error('Please upload a screenshot of your payment as proof.');

      // Prevent duplicate live bookings by the same tenant for the same room.
      var already = findBy_(SHEETS.BOOKINGS, 'TenantID', session.tenantId)
        .filter(function (b) { return b.RoomID === data.roomId && b.Status === 'Submitted'; });
      if (already.length) throw new Error('You already have a booking submitted for this room, awaiting review.');

      var property = getById_(SHEETS.PROPERTIES, room.PropertyID);
      var booking = appendRow_(SHEETS.BOOKINGS, {
        TenantID: session.tenantId, PropertyID: property.ID, RoomID: room.ID, RequestedAt: new Date(),
        PaymentMethod: data.paymentMethod, AmountGHS: Number(data.amountGHS), ProofFileId: data.proofFileId || '',
        ProofNotes: data.proofNotes || '', Status: 'Submitted'
      }, 'BKG');

      updateById_(SHEETS.ROOMS, room.ID, { Status: 'Reserved' });
      updateById_(SHEETS.TENANTS, session.tenantId, { Status: 'AwaitingApproval' });

      var settings = getSettings_();
      var tenant = getById_(SHEETS.TENANTS, session.tenantId);
      var adminEmails = (settings.AdminEmails || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      adminEmails.forEach(function (addr) {
        EmailService.send(addr, 'New Booking Payment Submitted — ' + tenant.FullName,
          '<p><strong>' + escapeHtml_(tenant.FullName) + '</strong> (' + escapeHtml_(tenant.Phone) + ') submitted ' +
          formatGHS_(booking.AmountGHS) + ' via ' + escapeHtml_(booking.PaymentMethod) + ' for ' + escapeHtml_(room.RoomLabel) +
          ' at ' + escapeHtml_(property.PropertyName) + '. Please review in the Bookings inbox.</p>', []);
      });
      logAudit_(tenant.FullName, 'BOOKING_SUBMITTED', 'Booking', booking.ID, formatGHS_(booking.AmountGHS));
      return { booking: booking };
    } finally {
      lock.releaseLock();
    }
  });
}

/** Tenant-side: my current/past bookings, so the portal can show status. */
function getMyBookings(token) {
  return safeCall_('getMyBookings', function () {
    var session = requireTenant_(token);
    var bookings = findBy_(SHEETS.BOOKINGS, 'TenantID', session.tenantId)
      .sort(function (a, b) { return new Date(b.RequestedAt) - new Date(a.RequestedAt); });
    var rooms = indexById_(readTable_(SHEETS.ROOMS));
    var properties = indexById_(readTable_(SHEETS.PROPERTIES));
    return { bookings: bookings.map(function (b) {
      return Object.assign({}, b, {
        roomLabel: (rooms[b.RoomID] || {}).RoomLabel || '', propertyName: (properties[b.PropertyID] || {}).PropertyName || ''
      });
    }) };
  });
}

function listBookingsAdmin(token) {
  return safeCall_('listBookingsAdmin', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    var bookings = readTable_(SHEETS.BOOKINGS).sort(function (a, b) { return new Date(b.RequestedAt) - new Date(a.RequestedAt); });
    var tenants = indexById_(readTable_(SHEETS.TENANTS));
    var rooms = indexById_(readTable_(SHEETS.ROOMS));
    var properties = indexById_(readTable_(SHEETS.PROPERTIES));
    return { bookings: bookings.map(function (b) {
      return Object.assign({}, b, {
        tenantName: (tenants[b.TenantID] || {}).FullName || '', tenantPhone: (tenants[b.TenantID] || {}).Phone || '',
        roomLabel: (rooms[b.RoomID] || {}).RoomLabel || '', propertyName: (properties[b.PropertyID] || {}).PropertyName || ''
      });
    }) };
  });
}

/**
 * Landlord confirms the payment proof is genuine. This unlocks the Tenancy Agreement
 * Form for the tenant (creates a Tenancy stub in AwaitingAgreement status) and records
 * the payment already made as the first ledger entry + receipt.
 */
function approveBooking(token, bookingId) {
  return safeCall_('approveBooking', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var booking = getById_(SHEETS.BOOKINGS, bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.Status !== 'Submitted') throw new Error('This booking has already been reviewed.');
    var tenant = getById_(SHEETS.TENANTS, booking.TenantID);
    var room = getById_(SHEETS.ROOMS, booking.RoomID);
    var property = getById_(SHEETS.PROPERTIES, booking.PropertyID);

    updateById_(SHEETS.BOOKINGS, bookingId, { Status: 'Approved', ReviewedBy: session.name, ReviewedAt: new Date() });
    updateById_(SHEETS.TENANTS, tenant.ID, { Status: 'AwaitingAgreement' });

    var tenancy = appendRow_(SHEETS.TENANCIES, {
      TenantID: tenant.ID, PropertyID: property.ID, RoomID: room.ID, BookingID: booking.ID,
      MonthlyRent: room.MonthlyRent, Deposit: room.Deposit, PaymentMode: 'Advance', Status: 'AwaitingAgreement'
    }, 'TCY');

    // The payment already made is real money in hand — log it to the ledger immediately.
    var receiptNumber = nextReceiptNumber_();
    var payment = appendRow_(SHEETS.PAYMENTS, {
      TenancyID: tenancy.ID, TenantID: tenant.ID, AmountGHS: booking.AmountGHS, PaymentDate: booking.RequestedAt,
      Channel: booking.PaymentMethod, Reference: 'Booking ' + booking.ID, RecordedBy: session.name,
      Notes: 'Initial payment confirmed at booking approval.', ReceiptNumber: receiptNumber
    }, 'PMT');
    var receiptPdfId = generateReceiptPdf_(payment, tenant, property, room);
    updateById_(SHEETS.PAYMENTS, payment.ID, { ReceiptPdfFileId: receiptPdfId });

    var settings = getSettings_();
    var tokens = { TenantName: tenant.FullName, RoomLabel: room.RoomLabel, PropertyName: property.PropertyName,
      LandlordName: settings.LandlordName, LandlordPhone: settings.LandlordPhone };
    if (settings.SmsEnabled === 'Y') SmsService.send([tenant.Phone], mergeTokens_(settings.BookingApprovedTemplate, tokens));
    if (settings.EmailEnabled === 'Y' && tenant.Email) {
      EmailService.send(tenant.Email, 'Payment Confirmed — Complete Your Tenancy Agreement',
        '<p>' + escapeHtml_(mergeTokens_(settings.BookingApprovedTemplate, tokens)) + '</p>', []);
    }
    logAudit_(session.name, 'BOOKING_APPROVED', 'Booking', bookingId, 'Tenancy ' + tenancy.ID);
    return { tenancy: tenancy, payment: payment };
  });
}

function rejectBooking(token, bookingId, reason) {
  return safeCall_('rejectBooking', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var booking = getById_(SHEETS.BOOKINGS, bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.Status !== 'Submitted') throw new Error('This booking has already been reviewed.');
    var tenant = getById_(SHEETS.TENANTS, booking.TenantID);
    var room = getById_(SHEETS.ROOMS, booking.RoomID);
    var property = getById_(SHEETS.PROPERTIES, booking.PropertyID);

    updateById_(SHEETS.BOOKINGS, bookingId, { Status: 'Rejected', ReviewedBy: session.name, ReviewedAt: new Date(), ReviewNotes: reason });
    updateById_(SHEETS.ROOMS, room.ID, { Status: 'Vacant' }); // release the room back to the market
    updateById_(SHEETS.TENANTS, tenant.ID, { Status: 'Rejected' });

    var settings = getSettings_();
    var tokens = { TenantName: tenant.FullName, RoomLabel: room.RoomLabel, PropertyName: property.PropertyName,
      Reason: reason, LandlordName: settings.LandlordName, LandlordPhone: settings.LandlordPhone };
    if (settings.SmsEnabled === 'Y') SmsService.send([tenant.Phone], mergeTokens_(settings.BookingRejectedTemplate, tokens));
    if (settings.EmailEnabled === 'Y' && tenant.Email) {
      EmailService.send(tenant.Email, 'Booking Payment Not Confirmed',
        '<p>' + escapeHtml_(mergeTokens_(settings.BookingRejectedTemplate, tokens)) + '</p>', []);
    }
    logAudit_(session.name, 'BOOKING_REJECTED', 'Booking', bookingId, reason);
    return true;
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Tenancy Agreement — Stage 2 of the tenancy pipeline
// =====================================================================================
// Unlocked only once a Booking has been approved (a Tenancy row exists in
// AwaitingAgreement status for the logged-in tenant). Rendered from FormSchema.

/** Returns the tenant's pending agreement task (room/property/booking context) or null. */
function getMyAgreementTask(token) {
  return safeCall_('getMyAgreementTask', function () {
    var session = requireTenant_(token);
    var pending = findBy_(SHEETS.TENANCIES, 'TenantID', session.tenantId).find(function (t) { return t.Status === 'AwaitingAgreement'; });
    if (!pending) return { pending: false };
    var room = getById_(SHEETS.ROOMS, pending.RoomID);
    var property = getById_(SHEETS.PROPERTIES, pending.PropertyID);
    var booking = getById_(SHEETS.BOOKINGS, pending.BookingID);
    return { pending: true, tenancy: pending, room: room, property: property, booking: booking };
  });
}

/** Tenant submits the completed, signed Tenancy Agreement Form. Generates the PDF and activates the tenancy. */
function submitTenancyAgreement(token, answers) {
  return safeCall_('submitTenancyAgreement', function () {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      var session = requireTenant_(token);
      var pending = findBy_(SHEETS.TENANCIES, 'TenantID', session.tenantId).find(function (t) { return t.Status === 'AwaitingAgreement'; });
      if (!pending) throw new Error('No tenancy agreement is currently awaiting your signature.');

      var schema = readTable_(SHEETS.FORM_SCHEMA).filter(function (f) { return f.Visible === 'Y'; });
      schema.forEach(function (f) {
        if (f.Type === 'heading' || f.Type === 'divider') return;
        var val = answers[f.FieldKey];
        if (f.Required === 'Y' && (val === undefined || val === null || val === '')) {
          throw new Error('Missing required field: ' + f.Label);
        }
        if (f.Validation && val) {
          var re = new RegExp(f.Validation);
          if (!re.test(val)) throw new Error(f.Label + ' is not in the expected format.');
        }
      });

      var tenant = getById_(SHEETS.TENANTS, session.tenantId);
      var room = getById_(SHEETS.ROOMS, pending.RoomID);
      var property = getById_(SHEETS.PROPERTIES, pending.PropertyID);
      var booking = getById_(SHEETS.BOOKINGS, pending.BookingID);

      var tenantPatch = {
        FullName: answers.FullName || tenant.FullName, GhanaCardNumber: answers.GhanaCardNumber || '',
        DateOfBirth: answers.DateOfBirth || '', Gender: answers.Gender || '', MaritalStatus: answers.MaritalStatus || '',
        Occupation: answers.Occupation || '', Employer: answers.Employer || '', EmployerPhone: answers.EmployerPhone || '',
        NextOfKinName: answers.NextOfKinName || '', NextOfKinPhone: answers.NextOfKinPhone || '',
        GuarantorName: answers.GuarantorName || '', GuarantorPhone: answers.GuarantorPhone || '',
        GuarantorGhanaCard: answers.GuarantorGhanaCard || '', PhotoFileId: answers.PhotoFile || tenant.PhotoFileId,
        IdDocFileId: answers.IdDocFile || tenant.IdDocFileId
      };
      tenant = updateById_(SHEETS.TENANTS, tenant.ID, tenantPatch);

      var advanceMonths = Number(room.MinAdvanceMonths) || 12;
      var startDate = new Date();
      var endDate = addMonths_(startDate, advanceMonths);
      var signatureFileId = answers.Signature || '';

      var pdfId = generateAgreementPdf_({
        tenant: tenant, property: property, room: room, booking: booking, advanceMonths: advanceMonths,
        advanceAmount: booking.AmountGHS, startDate: startDate, signatureFileId: signatureFileId, draft: false
      });

      var tenancy = updateById_(SHEETS.TENANCIES, pending.ID, {
        StartDate: startDate, EndDate: endDate, AdvanceMonths: advanceMonths, AdvanceAmount: booking.AmountGHS,
        Status: 'Active', AgreementPdfFileId: pdfId, SignatureFileId: signatureFileId, SignedAt: new Date()
      });
      updateById_(SHEETS.ROOMS, room.ID, { Status: 'Occupied' });
      updateById_(SHEETS.TENANTS, tenant.ID, { Status: 'Active' });

      var settings = getSettings_();
      var pdfBlob = DriveApp.getFileById(pdfId).getBlob();
      if (tenant.Email && settings.EmailEnabled === 'Y') {
        EmailService.send(tenant.Email, 'Your Signed Tenancy Agreement — ' + settings.AppName,
          '<p>Dear ' + escapeHtml_(tenant.FullName) + ', congratulations — your tenancy for ' + escapeHtml_(room.RoomLabel) +
          ' at ' + escapeHtml_(property.PropertyName) + ' is now active. Your signed agreement is attached.</p>', [pdfBlob]);
      }
      var adminEmails = (settings.AdminEmails || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      adminEmails.forEach(function (addr) {
        EmailService.send(addr, 'Tenancy Agreement Signed — ' + tenant.FullName,
          '<p>' + escapeHtml_(tenant.FullName) + ' signed the tenancy agreement for ' + escapeHtml_(room.RoomLabel) + '.</p>', [pdfBlob]);
      });
      logAudit_(tenant.FullName, 'AGREEMENT_SIGNED', 'Tenancy', tenancy.ID, room.RoomLabel);
      return { tenancy: tenancy, pdfFileId: pdfId, downloadUrl: 'https://drive.google.com/uc?export=download&id=' + pdfId };
    } finally {
      lock.releaseLock();
    }
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Payments & Receipts (ongoing payments recorded by admin after the tenancy is active)
// =====================================================================================

function nextReceiptNumber_() {
  var settings = getSettings_();
  var prefix = settings.ReceiptPrefix || 'KD';
  var year = Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy');
  var payments = readTable_(SHEETS.PAYMENTS, { skipCache: true });
  var countThisYear = payments.filter(function (p) {
    return String(p.ReceiptNumber || '').indexOf(prefix + '/' + year + '/') === 0;
  }).length;
  var seq = String(countThisYear + 1).padStart(4, '0');
  return prefix + '/' + year + '/' + seq;
}

function recordPayment(token, payment) {
  return safeCall_('recordPayment', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var tenancy = getById_(SHEETS.TENANCIES, payment.TenancyID);
    if (!tenancy) throw new Error('Tenancy not found.');
    var tenant = getById_(SHEETS.TENANTS, tenancy.TenantID);
    var property = getById_(SHEETS.PROPERTIES, tenancy.PropertyID);
    var room = getById_(SHEETS.ROOMS, tenancy.RoomID);
    var receiptNumber = nextReceiptNumber_();
    var record = appendRow_(SHEETS.PAYMENTS, {
      TenancyID: tenancy.ID, TenantID: tenant.ID, AmountGHS: Number(payment.AmountGHS) || 0,
      PaymentDate: payment.PaymentDate ? new Date(payment.PaymentDate) : new Date(),
      Channel: payment.Channel, Reference: payment.Reference || '', PeriodCoveredFrom: payment.PeriodCoveredFrom || '',
      PeriodCoveredTo: payment.PeriodCoveredTo || '', RecordedBy: session.name, Notes: payment.Notes || '',
      ReceiptNumber: receiptNumber
    }, 'PMT');
    var pdfId = generateReceiptPdf_(record, tenant, property, room);
    updateById_(SHEETS.PAYMENTS, record.ID, { ReceiptPdfFileId: pdfId });
    var settings = getSettings_();
    if (settings.EmailEnabled === 'Y' && tenant.Email) {
      var blob = DriveApp.getFileById(pdfId).getBlob();
      EmailService.send(tenant.Email, 'Rent Receipt ' + receiptNumber, buildReceiptEmailHtml_(record, tenant, settings), [blob]);
    }
    if (settings.SmsEnabled === 'Y' && tenant.Phone) {
      SmsService.send([tenant.Phone], 'Receipt ' + receiptNumber + ' for ' + formatGHS_(record.AmountGHS) + ' recorded. Thank you. - ' + settings.LandlordName);
    }
    logAudit_(session.name, 'PAYMENT', 'Payment', record.ID, formatGHS_(record.AmountGHS));
    return { payment: record, pdfFileId: pdfId };
  });
}

function buildReceiptEmailHtml_(payment, tenant, settings) {
  return '<table style="font-family:Arial,sans-serif;color:#111827;max-width:560px;"><tr><td>' +
    '<h2>Payment received</h2><p>Dear ' + escapeHtml_(tenant.FullName) + ', we confirm receipt of ' +
    formatGHS_(payment.AmountGHS) + ' (Receipt ' + escapeHtml_(payment.ReceiptNumber) + '). PDF attached.</p>' +
    '<p style="color:#6B7280;font-size:12px;">' + escapeHtml_(settings.PdfFooterText) + '</p></td></tr></table>';
}

function getLedger(token, tenancyId) {
  return safeCall_('getLedger', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer', 'Tenant']);
    if (session.role === 'Tenant') {
      var owned = getById_(SHEETS.TENANCIES, tenancyId);
      if (!owned || owned.TenantID !== session.tenantId) throw new Error('Not authorised to view this ledger.');
    }
    var payments = findBy_(SHEETS.PAYMENTS, 'TenancyID', tenancyId)
      .sort(function (a, b) { return new Date(b.PaymentDate) - new Date(a.PaymentDate); });
    var tenancy = getById_(SHEETS.TENANCIES, tenancyId);
    var totalPaid = payments.reduce(function (s, p) { return s + (Number(p.AmountGHS) || 0); }, 0);
    var expected = tenancy.PaymentMode === 'Monthly'
      ? Number(tenancy.MonthlyRent) * Math.max(1, daysBetween_(tenancy.StartDate, new Date()) / 30)
      : Number(tenancy.AdvanceAmount);
    return { payments: payments, totalPaid: totalPaid, arrears: Math.max(0, expected - totalPaid) };
  });
}

/** Arrears ageing report across all active/overdue tenancies, bucketed 0-30/31-60/61-90/90+ days. */
function getArrearsAgeing_() {
  var tenancies = readTable_(SHEETS.TENANCIES).filter(function (t) { return t.Status === 'Active' || t.Status === 'ExpiringSoon' || t.Status === 'Expired'; });
  var payments = readTable_(SHEETS.PAYMENTS);
  var buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  var today = new Date();
  tenancies.forEach(function (t) {
    var paid = payments.filter(function (p) { return p.TenancyID === t.ID; }).reduce(function (s, p) { return s + (Number(p.AmountGHS) || 0); }, 0);
    var expected = t.PaymentMode === 'Monthly' ? Number(t.MonthlyRent) : Number(t.AdvanceAmount);
    var arrears = expected - paid;
    if (arrears <= 0) return;
    var overdueDays = daysBetween_(t.EndDate, today);
    if (overdueDays <= 30) buckets['0-30'] += arrears;
    else if (overdueDays <= 60) buckets['31-60'] += arrears;
    else if (overdueDays <= 90) buckets['61-90'] += arrears;
    else buckets['90+'] += arrears;
  });
  return buckets;
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: SMS Service (Arkesel)
// =====================================================================================
// Wrapped in a single object with one send() method so another SMS gateway can be
// swapped in later by editing only this region.

var SmsService = {
  /**
   * Sends an SMS to one or more +233 recipients via Arkesel's v2 SMS endpoint.
   * Retries once on transient (non-4xx) failure. Returns {success, statusCode, body}.
   */
  send: function (recipients, message) {
    var settings = getSettings_();
    if (settings.SmsEnabled !== 'Y') {
      return { success: false, statusCode: 0, body: 'SMS disabled in Settings.' };
    }
    if (!settings.ArkeselApiKey) {
      return { success: false, statusCode: 0, body: 'Arkesel API key not configured.' };
    }
    var url = 'https://sms.arkesel.com/api/v2/sms/send';
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'api-key': settings.ArkeselApiKey },
      payload: JSON.stringify({ sender: settings.ArkeselSenderId, message: message, recipients: recipients }),
      muteHttpExceptions: true
    };
    var attempt = function () { return UrlFetchApp.fetch(url, options); };
    var response;
    try {
      response = attempt();
      if (response.getResponseCode() >= 500) response = attempt(); // one retry on transient server error
    } catch (e) {
      try { response = attempt(); } catch (e2) {
        return { success: false, statusCode: 0, body: String(e2) };
      }
    }
    var code = response.getResponseCode();
    var body = response.getContentText();
    return { success: code >= 200 && code < 300, statusCode: code, body: body };
  }
};

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Email Service
// =====================================================================================

var EmailService = {
  /** Sends a clean, table-based HTML email (no emoji, mobile-safe) with optional PDF attachments. */
  send: function (to, subject, htmlBody, attachments) {
    var settings = getSettings_();
    if (settings.EmailEnabled !== 'Y' || !to) return false;
    try {
      var quota = MailApp.getRemainingDailyQuota();
      if (quota <= 0) return false;
      MailApp.sendEmail({
        to: to, subject: subject, htmlBody: htmlBody,
        attachments: attachments || [], name: settings.AppName
      });
      return true;
    } catch (e) {
      logAudit_('SYSTEM', 'EMAIL_ERROR', 'Email', to, String(e));
      return false;
    }
  }
};

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Reminders Engine
// =====================================================================================
// Runs daily at 08:00 Africa/Accra via a time-driven trigger (see Triggers region).
// Idempotency: before sending, checks Reminders for an existing row of the same
// Type + TenancyID so a tenant is never reminded twice for the same milestone.

function reminderAlreadySent_(tenancyId, type) {
  return readTable_(SHEETS.REMINDERS).some(function (r) { return r.TenancyID === tenancyId && r.Type === type && r.SentAt; });
}

function buildReminderTokens_(tenant, property, room, tenancy, daysLeft, settings) {
  return {
    TenantName: tenant.FullName, PropertyName: property.PropertyName, RoomLabel: room.RoomLabel,
    Amount: formatGHS_(tenancy.PaymentMode === 'Monthly' ? tenancy.MonthlyRent : tenancy.AdvanceAmount),
    DueDate: formatDate_(tenancy.EndDate), DaysLeft: daysLeft,
    LandlordName: settings.LandlordName, LandlordPhone: settings.LandlordPhone
  };
}

function sendReminder_(tenancy, tenant, property, room, type, templateKey, daysLeft) {
  var settings = getSettings_();
  if (reminderAlreadySent_(tenancy.ID, type)) return;
  var tokens = buildReminderTokens_(tenant, property, room, tenancy, daysLeft, settings);
  var message = mergeTokens_(settings[templateKey] || '', tokens);
  var reminder = appendRow_(SHEETS.REMINDERS, {
    TenancyID: tenancy.ID, TenantID: tenant.ID, Type: type, ScheduledFor: new Date(),
    ChannelsUsed: '', SmsStatus: '', EmailStatus: '', MessageBody: message, Attempts: 1
  }, 'RMD');
  var channelsUsed = [];
  var smsStatus = '', emailStatus = '', errorText = '';
  if (settings.SmsEnabled === 'Y' && tenant.Phone) {
    var smsResult = SmsService.send([tenant.Phone], message);
    smsStatus = smsResult.success ? 'Sent' : 'Failed: ' + smsResult.body;
    if (smsResult.success) channelsUsed.push('SMS'); else errorText += smsStatus + ' ';
  }
  if (settings.EmailEnabled === 'Y' && tenant.Email) {
    var emailOk = EmailService.send(tenant.Email, 'Tenancy Reminder — ' + property.PropertyName,
      '<p>' + escapeHtml_(message) + '</p>', []);
    emailStatus = emailOk ? 'Sent' : 'Failed';
    if (emailOk) channelsUsed.push('Email'); else errorText += emailStatus;
  }
  updateById_(SHEETS.REMINDERS, reminder.ID, {
    SentAt: new Date(), ChannelsUsed: channelsUsed.join('/') || 'None', SmsStatus: smsStatus,
    EmailStatus: emailStatus, ErrorText: errorText
  });
}

/**
 * Scans all tenancies each morning and fires:
 *  - a nudge for tenancies stuck in AwaitingAgreement for 3+ days (payment confirmed
 *    but the tenant hasn't come back to sign the agreement yet);
 *  - the rent-advance countdown reminders (1 month / 1 week / 1 day before expiry);
 *  - overdue escalations at +1/+7/+30 days past expiry;
 *  - notice-to-quit follow-ups.
 */
function runDailyReminders() {
  var allTenancies = readTable_(SHEETS.TENANCIES, { skipCache: true });
  var tenants = indexById_(readTable_(SHEETS.TENANTS));
  var properties = indexById_(readTable_(SHEETS.PROPERTIES));
  var rooms = indexById_(readTable_(SHEETS.ROOMS));
  var today = new Date();
  var settings = getSettings_();

  // Agreement-pending nudge (one-time, at 3+ days waiting).
  allTenancies.filter(function (t) { return t.Status === 'AwaitingAgreement'; }).forEach(function (t) {
    var tenant = tenants[t.TenantID], property = properties[t.PropertyID], room = rooms[t.RoomID];
    if (!tenant || !property || !room) return;
    var waitingDays = daysBetween_(t.CreatedAt, today);
    if (waitingDays < 3 || reminderAlreadySent_(t.ID, 'AgreementPending')) return;
    try {
      var message = mergeTokens_(settings.AgreementPendingTemplate, {
        TenantName: tenant.FullName, RoomLabel: room.RoomLabel, PropertyName: property.PropertyName
      });
      var reminder = appendRow_(SHEETS.REMINDERS, {
        TenancyID: t.ID, TenantID: tenant.ID, Type: 'AgreementPending', ScheduledFor: today, MessageBody: message, Attempts: 1
      }, 'RMD');
      var channels = [];
      if (settings.SmsEnabled === 'Y' && tenant.Phone && SmsService.send([tenant.Phone], message).success) channels.push('SMS');
      if (settings.EmailEnabled === 'Y' && tenant.Email && EmailService.send(tenant.Email, 'Complete Your Tenancy Agreement', '<p>' + escapeHtml_(message) + '</p>', [])) channels.push('Email');
      updateById_(SHEETS.REMINDERS, reminder.ID, { SentAt: today, ChannelsUsed: channels.join('/') || 'None' });
    } catch (e) { logAudit_('SYSTEM', 'REMINDER_ERROR', 'Tenancy', t.ID, String(e)); }
  });

  // Rent-advance countdown + overdue escalation for active tenancies.
  var activeTenancies = allTenancies.filter(function (t) { return t.Status === 'Active' || t.Status === 'ExpiringSoon' || t.Status === 'Expired'; });
  activeTenancies.forEach(function (t) {
    var tenant = tenants[t.TenantID], property = properties[t.PropertyID], room = rooms[t.RoomID];
    if (!tenant || !property || !room || !t.EndDate) return;
    var daysLeft = daysBetween_(today, t.EndDate); // positive = future expiry, negative = overdue
    try {
      if (daysLeft === 30) sendReminder_(t, tenant, property, room, 'Rent-1Month', 'MessageTemplateRent1Month', daysLeft);
      else if (daysLeft === 7) sendReminder_(t, tenant, property, room, 'Rent-1Week', 'MessageTemplateRent1Week', daysLeft);
      else if (daysLeft === 1) sendReminder_(t, tenant, property, room, 'Rent-1Day', 'MessageTemplateRent1Day', daysLeft);
      else if (daysLeft === -1 || daysLeft === -7 || daysLeft === -30) {
        sendReminder_(t, tenant, property, room, 'Rent-Overdue-' + Math.abs(daysLeft), 'MessageTemplateOverdue', daysLeft);
      }
      // Keep tenancy Status in sync with the countdown so dashboards/Kanban reflect reality.
      var newStatus = t.Status;
      if (daysLeft < 0) newStatus = 'Expired';
      else if (daysLeft <= 90) newStatus = 'ExpiringSoon';
      else newStatus = 'Active';
      if (newStatus !== t.Status) updateById_(SHEETS.TENANCIES, t.ID, { Status: newStatus });
    } catch (e) {
      logAudit_('SYSTEM', 'REMINDER_ERROR', 'Tenancy', t.ID, String(e));
    }
  });

  // Notice-to-quit follow-up reminders (2 months / 1 month / 1 week / 1 day before vacate date).
  var notices = readTable_(SHEETS.NOTICES, { skipCache: true }).filter(function (n) { return n.Type === 'NoticeToQuit3Month'; });
  notices.forEach(function (n) {
    var tenancy = getById_(SHEETS.TENANCIES, n.TenancyID);
    if (!tenancy) return;
    var tenant = tenants[tenancy.TenantID], property = properties[tenancy.PropertyID], room = rooms[tenancy.RoomID];
    if (!tenant || !property || !room) return;
    var daysLeft = daysBetween_(today, n.EffectiveDate);
    try {
      if (daysLeft === 60) sendReminder_(tenancy, tenant, property, room, 'Notice-2Month', 'MessageTemplateNotice3Month', daysLeft);
      else if (daysLeft === 30) sendReminder_(tenancy, tenant, property, room, 'Notice-1Month', 'MessageTemplateNotice3Month', daysLeft);
      else if (daysLeft === 7) sendReminder_(tenancy, tenant, property, room, 'Notice-1Week', 'MessageTemplateNotice3Month', daysLeft);
      else if (daysLeft === 1) sendReminder_(tenancy, tenant, property, room, 'Notice-1Day', 'MessageTemplateNotice3Month', daysLeft);
    } catch (e) {
      logAudit_('SYSTEM', 'REMINDER_ERROR', 'Notice', n.ID, String(e));
    }
  });
  logAudit_('SYSTEM', 'DAILY_REMINDERS', 'System', '', allTenancies.length + ' tenancies scanned');
}

/** Manual "Send now / Test" trigger from the admin UI, and ad-hoc bulk messaging. */
function sendManualMessage(token, tenantIds, message, channels) {
  return safeCall_('sendManualMessage', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var settings = getSettings_();
    var tenants = readTable_(SHEETS.TENANTS).filter(function (t) { return tenantIds.indexOf(t.ID) !== -1; });
    var results = tenants.map(function (t) {
      var out = { tenantId: t.ID, name: t.FullName, sms: null, email: null };
      if (channels.indexOf('SMS') !== -1 && t.Phone) out.sms = SmsService.send([t.Phone], message);
      if (channels.indexOf('Email') !== -1 && t.Email) out.email = EmailService.send(t.Email, settings.AppName + ' — Message', '<p>' + escapeHtml_(message) + '</p>', []);
      return out;
    });
    logAudit_(session.name, 'BULK_MESSAGE', 'Tenants', '', tenants.length + ' recipients');
    return { results: results };
  });
}

/** Cost estimate shown before a bulk send: recipients x segments x per-segment rate. */
function estimateSmsCost(token, tenantIds, message) {
  return safeCall_('estimateSmsCost', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    var settings = getSettings_();
    var segments = smsSegmentCount_(message);
    var rate = Number(settings.SmsRatePerSegment) || 0;
    var recipients = tenantIds.length;
    return { recipients: recipients, segments: segments, estimatedCostGHS: recipients * segments * rate };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Notices Engine
// =====================================================================================

var NOTICE_REASON_TEXT = {
  'non-renewal': 'Non-renewal of tenancy at the Landlord/Landlady\'s discretion.',
  'landlord-occupation': 'The Landlord/Landlady requires the premises for personal occupation.',
  'redevelopment': 'The premises are required for redevelopment or major renovation.',
  'breach': 'Breach of tenancy covenants by the Tenant.',
  'other': 'As stated by the Landlord/Landlady.'
};

/** Issues the flagship 3-month Notice to Quit: computes the effective date, generates the
 * PDF, sends SMS + email, logs to Notices, and moves the tenancy to Notice status. */
function issueNoticeToQuit(token, tenancyId, reasonKey, customReason) {
  return safeCall_('issueNoticeToQuit', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var tenancy = getById_(SHEETS.TENANCIES, tenancyId);
    if (!tenancy) throw new Error('Tenancy not found.');
    var tenant = getById_(SHEETS.TENANTS, tenancy.TenantID);
    var property = getById_(SHEETS.PROPERTIES, tenancy.PropertyID);
    var room = getById_(SHEETS.ROOMS, tenancy.RoomID);
    var issuedOn = new Date();
    var effectiveDate = addMonths_(issuedOn, 3);
    var reasonText = reasonKey === 'other' ? (customReason || NOTICE_REASON_TEXT.other) : (NOTICE_REASON_TEXT[reasonKey] || NOTICE_REASON_TEXT.other);

    var notice = appendRow_(SHEETS.NOTICES, {
      TenancyID: tenancy.ID, Type: 'NoticeToQuit3Month', IssuedOn: issuedOn, EffectiveDate: effectiveDate,
      Reason: reasonText, DeliveredVia: ''
    }, 'NTC');
    var pdfId = generateNoticePdf_(notice, tenancy, tenant, property, room, reasonText);
    updateById_(SHEETS.NOTICES, notice.ID, { PdfFileId: pdfId });

    var settings = getSettings_();
    var delivered = [];
    var tokens = { TenantName: tenant.FullName, PropertyName: property.PropertyName, RoomLabel: room.RoomLabel,
      DueDate: formatDate_(effectiveDate), LandlordName: settings.LandlordName, LandlordPhone: settings.LandlordPhone };
    var smsText = mergeTokens_(settings.MessageTemplateNotice3Month, tokens);
    if (settings.SmsEnabled === 'Y' && tenant.Phone) {
      var smsResult = SmsService.send([tenant.Phone], smsText);
      if (smsResult.success) delivered.push('SMS');
    }
    if (settings.EmailEnabled === 'Y' && tenant.Email) {
      var blob = DriveApp.getFileById(pdfId).getBlob();
      var ok = EmailService.send(tenant.Email, 'Notice to Quit — ' + property.PropertyName,
        '<p>' + escapeHtml_(smsText) + '</p><p>Please see the attached formal notice letter.</p>', [blob]);
      if (ok) delivered.push('Email');
    }
    updateById_(SHEETS.NOTICES, notice.ID, { DeliveredVia: delivered.join('/') });
    updateById_(SHEETS.TENANCIES, tenancy.ID, { Status: 'Notice' });
    logAudit_(session.name, 'NOTICE_ISSUED', 'Tenancy', tenancy.ID, reasonText);
    return { notice: notice, pdfFileId: pdfId, effectiveDate: formatDate_(effectiveDate) };
  });
}

function getNotices(token, tenancyId) {
  return safeCall_('getNotices', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    return { notices: findBy_(SHEETS.NOTICES, 'TenancyID', tenancyId) };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Messaging (in-app tenant <-> landlord chat, plus WhatsApp deep links client-side)
// =====================================================================================
// One thread per tenant (tenant <-> the landlord/admin team). Simple and sufficient for
// a single-landlord portfolio: no polling/websockets, the client re-fetches on open and
// after sending. WhatsApp is offered client-side as a one-tap alternative — Apps Script
// cannot receive inbound WhatsApp messages without a paid Business API integration, so
// in-app messaging is the system of record and WhatsApp is a convenience link.

function sendMessageAsTenant(token, body) {
  return safeCall_('sendMessageAsTenant', function () {
    var session = requireTenant_(token);
    if (!body || !body.trim()) throw new Error('Message cannot be empty.');
    var tenant = getById_(SHEETS.TENANTS, session.tenantId);
    var msg = appendRow_(SHEETS.MESSAGES, {
      TenantID: session.tenantId, SenderRole: 'Tenant', SenderName: tenant.FullName, Body: body.trim(),
      SentAt: new Date(), ReadByAdmin: 'N', ReadByTenant: 'Y'
    }, 'MSG');
    var settings = getSettings_();
    var adminEmails = (settings.AdminEmails || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    adminEmails.forEach(function (addr) {
      EmailService.send(addr, 'New message from ' + tenant.FullName,
        '<p>' + escapeHtml_(body) + '</p><p class="muted">Reply from the Messages screen in your admin console.</p>', []);
    });
    return { message: msg };
  });
}

function sendMessageAsAdmin(token, tenantId, body) {
  return safeCall_('sendMessageAsAdmin', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker']);
    if (!body || !body.trim()) throw new Error('Message cannot be empty.');
    var tenant = getById_(SHEETS.TENANTS, tenantId);
    if (!tenant) throw new Error('Tenant not found.');
    var msg = appendRow_(SHEETS.MESSAGES, {
      TenantID: tenantId, SenderRole: 'Admin', SenderName: session.name, Body: body.trim(),
      SentAt: new Date(), ReadByAdmin: 'Y', ReadByTenant: 'N'
    }, 'MSG');
    var settings = getSettings_();
    if (settings.EmailEnabled === 'Y' && tenant.Email) {
      EmailService.send(tenant.Email, 'New message from ' + settings.LandlordName,
        '<p>' + escapeHtml_(body) + '</p><p class="muted">Reply from your tenant portal.</p>', []);
    }
    return { message: msg };
  });
}

/** Tenant view of their own thread; marks admin messages as read by the tenant. */
function getMyMessageThread(token) {
  return safeCall_('getMyMessageThread', function () {
    var session = requireTenant_(token);
    var thread = findBy_(SHEETS.MESSAGES, 'TenantID', session.tenantId).sort(function (a, b) { return new Date(a.SentAt) - new Date(b.SentAt); });
    thread.filter(function (m) { return m.SenderRole === 'Admin' && m.ReadByTenant !== 'Y'; })
      .forEach(function (m) { updateById_(SHEETS.MESSAGES, m.ID, { ReadByTenant: 'Y' }); });
    return { thread: thread };
  });
}

/** Admin view of one tenant's thread; marks tenant messages as read by admin. */
function getMessageThreadAdmin(token, tenantId) {
  return safeCall_('getMessageThreadAdmin', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker']);
    var thread = findBy_(SHEETS.MESSAGES, 'TenantID', tenantId).sort(function (a, b) { return new Date(a.SentAt) - new Date(b.SentAt); });
    thread.filter(function (m) { return m.SenderRole === 'Tenant' && m.ReadByAdmin !== 'Y'; })
      .forEach(function (m) { updateById_(SHEETS.MESSAGES, m.ID, { ReadByAdmin: 'Y' }); });
    return { thread: thread };
  });
}

/** Admin inbox: one row per tenant who has ever messaged, with last message + unread count. */
function listMessageThreadsAdmin(token) {
  return safeCall_('listMessageThreadsAdmin', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker']);
    var messages = readTable_(SHEETS.MESSAGES);
    var tenants = indexById_(readTable_(SHEETS.TENANTS));
    var byTenant = {};
    messages.forEach(function (m) {
      if (!byTenant[m.TenantID]) byTenant[m.TenantID] = [];
      byTenant[m.TenantID].push(m);
    });
    var threads = Object.keys(byTenant).map(function (tenantId) {
      var msgs = byTenant[tenantId].sort(function (a, b) { return new Date(b.SentAt) - new Date(a.SentAt); });
      var unread = msgs.filter(function (m) { return m.SenderRole === 'Tenant' && m.ReadByAdmin !== 'Y'; }).length;
      var tenant = tenants[tenantId] || {};
      return { tenantId: tenantId, tenantName: tenant.FullName || 'Unknown', tenantPhone: tenant.Phone || '',
        lastMessage: msgs[0].Body, lastAt: msgs[0].SentAt, unread: unread };
    }).sort(function (a, b) { return new Date(b.lastAt) - new Date(a.lastAt); });
    return { threads: threads };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Admin APIs
// =====================================================================================

// ---- Dashboard -------------------------------------------------------------------------

function getDashboard(token) {
  return safeCall_('getDashboard', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    var properties = readTable_(SHEETS.PROPERTIES);
    var rooms = readTable_(SHEETS.ROOMS);
    var tenancies = readTable_(SHEETS.TENANCIES);
    var payments = readTable_(SHEETS.PAYMENTS);
    var maintenance = readTable_(SHEETS.MAINTENANCE);
    var bookings = readTable_(SHEETS.BOOKINGS);
    var totalRooms = rooms.length;
    var occupied = rooms.filter(function (r) { return r.Status === 'Occupied'; }).length;
    var vacant = rooms.filter(function (r) { return r.Status === 'Vacant'; }).length;
    var activeTenancies = tenancies.filter(function (t) { return t.Status === 'Active' || t.Status === 'ExpiringSoon'; }).length;
    var expiring30 = tenancies.filter(function (t) {
      var d = daysBetween_(new Date(), t.EndDate);
      return d >= 0 && d <= 30 && (t.Status === 'Active' || t.Status === 'ExpiringSoon');
    }).length;
    var thisYear = new Date().getFullYear();
    var collectedThisYear = payments.filter(function (p) { return new Date(p.PaymentDate).getFullYear() === thisYear; })
      .reduce(function (s, p) { return s + (Number(p.AmountGHS) || 0); }, 0);
    var ageing = getArrearsAgeing_();
    var outstanding = ageing['0-30'] + ageing['31-60'] + ageing['61-90'] + ageing['90+'];
    var openTickets = maintenance.filter(function (m) { return m.Status !== 'Resolved'; }).length;
    var pendingBookings = bookings.filter(function (b) { return b.Status === 'Submitted'; }).length;
    var awaitingAgreement = tenancies.filter(function (t) { return t.Status === 'AwaitingAgreement'; }).length;

    // Monthly collections for the last 12 months (bar chart data).
    var monthly = [];
    for (var i = 11; i >= 0; i--) {
      var d = new Date(); d.setMonth(d.getMonth() - i);
      var label = Utilities.formatDate(d, 'Africa/Accra', 'MMM');
      var sum = payments.filter(function (p) {
        var pd = new Date(p.PaymentDate);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).reduce(function (s, p) { return s + (Number(p.AmountGHS) || 0); }, 0);
      monthly.push({ label: label, value: sum });
    }

    // Expiry timeline for the next 12 months (count of tenancies ending in each month).
    var expiryTimeline = [];
    for (var j = 0; j < 12; j++) {
      var md = new Date(); md.setMonth(md.getMonth() + j);
      var label2 = Utilities.formatDate(md, 'Africa/Accra', 'MMM yyyy');
      var count = tenancies.filter(function (t) {
        if (!t.EndDate) return false;
        var ed = new Date(t.EndDate);
        return ed.getMonth() === md.getMonth() && ed.getFullYear() === md.getFullYear();
      }).length;
      expiryTimeline.push({ label: label2, value: count });
    }

    return {
      kpis: {
        totalProperties: properties.length, totalRooms: totalRooms, occupied: occupied, vacant: vacant,
        occupancyPct: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
        activeTenancies: activeTenancies, expiring30: expiring30,
        collectedThisYear: collectedThisYear, collectedThisYearFormatted: formatGHS_(collectedThisYear),
        outstanding: outstanding, outstandingFormatted: formatGHS_(outstanding), openTickets: openTickets,
        pendingBookings: pendingBookings, awaitingAgreement: awaitingAgreement
      },
      charts: { monthlyCollections: monthly, expiryTimeline: expiryTimeline, ageing: ageing },
      rentCountdown: getRentCountdown_(tenancies, properties, rooms)
    };
  });
}

/** The rent-advance countdown widget: days remaining per active tenancy, soonest first. */
function getRentCountdown_(tenancies, properties, rooms) {
  var propMap = indexById_(properties), roomMap = indexById_(rooms);
  var tenants = indexById_(readTable_(SHEETS.TENANTS));
  return tenancies.filter(function (t) { return t.Status === 'Active' || t.Status === 'ExpiringSoon'; })
    .map(function (t) {
      var tenant = tenants[t.TenantID] || {};
      return {
        tenancyId: t.ID, tenantName: tenant.FullName || '', propertyName: (propMap[t.PropertyID] || {}).PropertyName || '',
        roomLabel: (roomMap[t.RoomID] || {}).RoomLabel || '', endDate: formatDate_(t.EndDate),
        daysLeft: daysBetween_(new Date(), t.EndDate)
      };
    }).sort(function (a, b) { return a.daysLeft - b.daysLeft; }).slice(0, 20);
}

// ---- Properties & Rooms ---------------------------------------------------------------

function listProperties(token) {
  return safeCall_('listProperties', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    return { properties: readTable_(SHEETS.PROPERTIES) };
  });
}

function saveProperty(token, property) {
  return safeCall_('saveProperty', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var result = property.ID ? updateById_(SHEETS.PROPERTIES, property.ID, property) : appendRow_(SHEETS.PROPERTIES, property, 'PRP');
    logAudit_(session.name, property.ID ? 'UPDATE' : 'CREATE', 'Property', result.ID, property.PropertyName);
    return result;
  });
}

function listRooms(token, propertyId) {
  return safeCall_('listRooms', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    var rooms = propertyId ? findBy_(SHEETS.ROOMS, 'PropertyID', propertyId) : readTable_(SHEETS.ROOMS);
    return { rooms: rooms };
  });
}

function saveRoom(token, room) {
  return safeCall_('saveRoom', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var result = room.ID ? updateById_(SHEETS.ROOMS, room.ID, room) : appendRow_(SHEETS.ROOMS, room, 'RM');
    logAudit_(session.name, room.ID ? 'UPDATE' : 'CREATE', 'Room', result.ID, room.RoomLabel);
    return result;
  });
}

function toggleRoomVacancy(token, roomId, status) {
  return safeCall_('toggleRoomVacancy', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var result = updateById_(SHEETS.ROOMS, roomId, { Status: status });
    logAudit_(session.name, 'STATUS_CHANGE', 'Room', roomId, status);
    return result;
  });
}

/** Generates a shareable, image-light HTML/PDF "vacancy flyer" for a room, sized for WhatsApp status. */
function generateVacancyFlyer(token, roomId) {
  return safeCall_('generateVacancyFlyer', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker']);
    var room = getById_(SHEETS.ROOMS, roomId);
    var property = getById_(SHEETS.PROPERTIES, room.PropertyID);
    var settings = getSettings_();
    var html = '<html><head><style>' +
      'body{font-family:Arial,sans-serif;width:640px;height:800px;margin:0;padding:40px;background:#0B7A4B;color:#fff;box-sizing:border-box;}' +
      '.card{background:#fff;color:#111827;border-radius:16px;padding:32px;height:100%;box-sizing:border-box;}' +
      'h1{margin:0 0 4px;font-size:26px;} .rent{font-size:32px;color:#0B7A4B;font-weight:bold;margin:16px 0;}' +
      '.row{margin:6px 0;} .label{color:#6B7280;font-size:12px;} .cta{margin-top:24px;padding:12px;background:#111827;color:#fff;text-align:center;border-radius:8px;}' +
      '</style></head><body><div class="card">' +
      '<div class="label">TO LET</div><h1>' + escapeHtml_(room.RoomLabel) + ' — ' + escapeHtml_(property.PropertyName) + '</h1>' +
      '<div class="row">' + escapeHtml_(property.Town) + ', ' + escapeHtml_(property.Region) + '</div>' +
      '<div class="rent">' + formatGHS_(room.MonthlyRent) + ' / month</div>' +
      '<div class="row">Minimum advance: ' + escapeHtml_(String(room.MinAdvanceMonths)) + ' months</div>' +
      '<div class="row">' + escapeHtml_(room.RoomType) + ' &middot; ' + escapeHtml_(String(room.Bedrooms)) + ' bed &middot; ' + escapeHtml_(String(room.Bathrooms)) + ' bath</div>' +
      '<div class="row">Amenities: ' + escapeHtml_(room.Amenities) + '</div>' +
      '<div class="cta">Call/WhatsApp ' + escapeHtml_(settings.LandlordPhone) + '</div>' +
      '</div></body></html>';
    var blob = htmlToPdfBlob_(html, 'Flyer_' + room.RoomLabel.replace(/\s+/g, '_'));
    var fileId = getFolder_('Property Photos').createFile(blob).getId();
    return { fileId: fileId, url: 'https://drive.google.com/uc?export=download&id=' + fileId };
  });
}

// ---- Tenants ----------------------------------------------------------------------------

function listTenants(token) {
  return safeCall_('listTenants', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    return { tenants: readTable_(SHEETS.TENANTS) };
  });
}

function getTenantProfile(token, tenantId) {
  return safeCall_('getTenantProfile', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer', 'Tenant']);
    if (session.role === 'Tenant' && session.tenantId !== tenantId) throw new Error('Not authorised to view this profile.');
    var tenant = getById_(SHEETS.TENANTS, tenantId);
    if (!tenant) throw new Error('Tenant not found.');
    var tenancies = findBy_(SHEETS.TENANCIES, 'TenantID', tenantId);
    var payments = findBy_(SHEETS.PAYMENTS, 'TenantID', tenantId);
    var bookings = findBy_(SHEETS.BOOKINGS, 'TenantID', tenantId);
    var notices = [];
    tenancies.forEach(function (t) { notices = notices.concat(findBy_(SHEETS.NOTICES, 'TenancyID', t.ID)); });
    var tickets = findBy_(SHEETS.MAINTENANCE, 'TenantID', tenantId);
    return { tenant: tenant, tenancies: tenancies, payments: payments, notices: notices, tickets: tickets, bookings: bookings };
  });
}

function saveTenant(token, tenant) {
  return safeCall_('saveTenant', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    if (tenant.Phone) {
      var normalized = normalizePhoneGh_(tenant.Phone);
      if (!normalized) throw new Error('Invalid Ghanaian phone number.');
      tenant.Phone = normalized;
    }
    var result = tenant.ID ? updateById_(SHEETS.TENANTS, tenant.ID, tenant) : appendRow_(SHEETS.TENANTS, tenant, 'TNT');
    logAudit_(session.name, tenant.ID ? 'UPDATE' : 'CREATE', 'Tenant', result.ID, tenant.FullName);
    return result;
  });
}

// ---- Tenancies: expiry board & renewal pipeline ------------------------------------------

function getExpiryBoard(token) {
  return safeCall_('getExpiryBoard', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    var tenancies = readTable_(SHEETS.TENANCIES).filter(function (t) { return t.Status !== 'Terminated' && t.Status !== 'AwaitingAgreement'; });
    var tenants = indexById_(readTable_(SHEETS.TENANTS));
    var properties = indexById_(readTable_(SHEETS.PROPERTIES));
    var rooms = indexById_(readTable_(SHEETS.ROOMS));
    var today = new Date();
    var board = { d30: [], d60: [], d90: [], overdue: [] };
    tenancies.forEach(function (t) {
      var days = daysBetween_(today, t.EndDate);
      var card = {
        tenancyId: t.ID, tenantName: (tenants[t.TenantID] || {}).FullName || '',
        propertyName: (properties[t.PropertyID] || {}).PropertyName || '', roomLabel: (rooms[t.RoomID] || {}).RoomLabel || '',
        endDate: formatDate_(t.EndDate), daysLeft: days
      };
      if (days < 0) board.overdue.push(card);
      else if (days <= 30) board.d30.push(card);
      else if (days <= 60) board.d60.push(card);
      else if (days <= 90) board.d90.push(card);
    });
    return { board: board };
  });
}

/** Renews a tenancy for another advance period: fresh agreement PDF, reset countdown. */
function renewTenancy(token, tenancyId, terms) {
  return safeCall_('renewTenancy', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var tenancy = getById_(SHEETS.TENANCIES, tenancyId);
    if (!tenancy) throw new Error('Tenancy not found.');
    var tenant = getById_(SHEETS.TENANTS, tenancy.TenantID);
    var property = getById_(SHEETS.PROPERTIES, tenancy.PropertyID);
    var room = getById_(SHEETS.ROOMS, tenancy.RoomID);
    var newStart = new Date(tenancy.EndDate);
    var advanceMonths = Number(terms.advanceMonths) || Number(tenancy.AdvanceMonths) || 12;
    var advanceAmount = tenancy.PaymentMode === 'Monthly' ? 0 : (Number(room.MonthlyRent) * advanceMonths);
    var newEnd = addMonths_(newStart, advanceMonths);
    var pdfId = generateAgreementPdf_({
      tenant: tenant, property: property, room: room, advanceMonths: advanceMonths, advanceAmount: advanceAmount,
      startDate: newStart, signatureFileId: tenancy.SignatureFileId, draft: false
    });
    var updated = updateById_(SHEETS.TENANCIES, tenancyId, {
      StartDate: newStart, EndDate: newEnd, AdvanceMonths: advanceMonths, AdvanceAmount: advanceAmount,
      Status: 'Active', AgreementPdfFileId: pdfId, RenewalCount: (Number(tenancy.RenewalCount) || 0) + 1
    });
    logAudit_(session.name, 'RENEW', 'Tenancy', tenancyId, 'New end ' + formatDate_(newEnd));
    return { tenancy: updated, pdfFileId: pdfId };
  });
}

function terminateTenancy(token, tenancyId) {
  return safeCall_('terminateTenancy', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    var tenancy = getById_(SHEETS.TENANCIES, tenancyId);
    updateById_(SHEETS.TENANCIES, tenancyId, { Status: 'Terminated' });
    updateById_(SHEETS.ROOMS, tenancy.RoomID, { Status: 'Vacant' });
    updateById_(SHEETS.TENANTS, tenancy.TenantID, { Status: 'Vacated' });
    logAudit_(session.name, 'TERMINATE', 'Tenancy', tenancyId, '');
    return true;
  });
}

function getYearlyStatement(token, tenancyId) {
  return safeCall_('getYearlyStatement', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Viewer']);
    var tenancy = getById_(SHEETS.TENANCIES, tenancyId);
    var tenant = getById_(SHEETS.TENANTS, tenancy.TenantID);
    var property = getById_(SHEETS.PROPERTIES, tenancy.PropertyID);
    var room = getById_(SHEETS.ROOMS, tenancy.RoomID);
    var payments = findBy_(SHEETS.PAYMENTS, 'TenancyID', tenancyId);
    var pdfId = generateStatementPdf_(tenancy, tenant, property, room, payments);
    return { fileId: pdfId, url: 'https://drive.google.com/uc?export=download&id=' + pdfId };
  });
}

// ---- Maintenance tickets (complaints) -------------------------------------------------

function listMaintenance(token) {
  return safeCall_('listMaintenance', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    return { tickets: readTable_(SHEETS.MAINTENANCE) };
  });
}

function saveMaintenanceTicket(token, ticket) {
  return safeCall_('saveMaintenanceTicket', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker']);
    if (!ticket.ID) ticket.ReportedAt = new Date();
    var result = ticket.ID ? updateById_(SHEETS.MAINTENANCE, ticket.ID, ticket) : appendRow_(SHEETS.MAINTENANCE, ticket, 'TKT');
    logAudit_(session.name, ticket.ID ? 'UPDATE' : 'CREATE', 'Maintenance', result.ID, ticket.Category || '');
    return result;
  });
}

/** Tenant-portal version: a logged-in tenant files their own complaint/maintenance ticket. */
function tenantSaveMaintenanceTicket(token, ticket) {
  return safeCall_('tenantSaveMaintenanceTicket', function () {
    var session = requireTenant_(token);
    ticket.TenantID = session.tenantId;
    ticket.ReportedAt = new Date();
    ticket.Status = 'Open';
    var result = appendRow_(SHEETS.MAINTENANCE, ticket, 'TKT');
    var settings = getSettings_();
    var adminEmails = (settings.AdminEmails || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    adminEmails.forEach(function (addr) {
      EmailService.send(addr, 'New Complaint — ' + session.name,
        '<p>' + escapeHtml_(session.name) + ' filed a ' + escapeHtml_(ticket.Category) + ' complaint: ' + escapeHtml_(ticket.Description) + '</p>', []);
    });
    logAudit_(session.name, 'CREATE', 'Maintenance', result.ID, 'Self-reported');
    return result;
  });
}

// ---- Users & Settings -----------------------------------------------------------------

function listUsers(token) {
  return safeCall_('listUsers', function () {
    requireRole_(token, ['SuperAdmin']);
    return { users: readTable_(SHEETS.USERS).map(function (u) { var c = Object.assign({}, u); delete c.PasswordHash; delete c.Salt; return c; }) };
  });
}

function saveUser(token, user) {
  return safeCall_('saveUser', function () {
    var session = requireRole_(token, ['SuperAdmin']);
    if (user.NewPassword) {
      var salt = Utilities.getUuid();
      user.Salt = salt;
      user.PasswordHash = hashPassword_(user.NewPassword, salt);
      delete user.NewPassword;
    }
    var result = user.ID ? updateById_(SHEETS.USERS, user.ID, user) : appendRow_(SHEETS.USERS, user, 'USR');
    logAudit_(session.name, user.ID ? 'UPDATE' : 'CREATE', 'User', result.ID, user.Email || '');
    var clean = Object.assign({}, result); delete clean.PasswordHash; delete clean.Salt;
    return clean;
  });
}

function changeMyPassword(token, oldPassword, newPassword) {
  return safeCall_('changeMyPassword', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord', 'Caretaker', 'Viewer']);
    var user = getById_(SHEETS.USERS, session.userId);
    if (hashPassword_(oldPassword, user.Salt) !== user.PasswordHash) throw new Error('Current password is incorrect.');
    var salt = Utilities.getUuid();
    updateById_(SHEETS.USERS, user.ID, { PasswordHash: hashPassword_(newPassword, salt), Salt: salt });
    logAudit_(session.name, 'PASSWORD_CHANGE', 'User', user.ID, '');
    return true;
  });
}

/**
 * RECOVERY TOOL — not called from the web app. Run this manually from the Apps Script
 * editor's function dropdown if you're locked out (lost the temporary password from
 * setup() and its execution log has expired). It force-resets the first SuperAdmin
 * account's password. Only someone with edit access to this script project can run it,
 * since it requires opening the editor directly — the web app never exposes it.
 *
 * Usage: change RESET_PASSWORD below to whatever you want to log in with, select
 * resetDefaultAdminPassword from the function dropdown, click Run, then log in with
 * username "admin" and that password. Change it again from Settings afterwards.
 */
function resetDefaultAdminPassword() {
  var RESET_USERNAME = 'admin'; // edit if you want a different username
  var RESET_PASSWORD = 'admin123'; // edit this line before running
  var users = readTable_(SHEETS.USERS, { skipCache: true });
  var admin = users.find(function (u) { return u.Role === 'SuperAdmin'; });
  if (!admin) throw new Error('No SuperAdmin account found — run setup() instead.');
  var salt = Utilities.getUuid();
  updateById_(SHEETS.USERS, admin.ID, { Email: RESET_USERNAME, PasswordHash: hashPassword_(RESET_PASSWORD, salt), Salt: salt, Active: 'Y' });
  logAudit_('SYSTEM', 'PASSWORD_RESET', 'User', admin.ID, 'Manual recovery via resetDefaultAdminPassword()');
  Logger.log('Reset done. Log in with username: ' + RESET_USERNAME + '  password: ' + RESET_PASSWORD);
  return 'Done. Username: ' + RESET_USERNAME;
}

function getSettingsAdmin(token) {
  return safeCall_('getSettingsAdmin', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    return { settings: getSettings_() };
  });
}

function saveSettings(token, patch) {
  return safeCall_('saveSettings', function () {
    var session = requireRole_(token, ['SuperAdmin', 'Landlord']);
    setSettingsBulk_(patch);
    logAudit_(session.name, 'SETTINGS_UPDATE', 'Settings', '', Object.keys(patch).join(','));
    return { settings: getSettings_() };
  });
}

/** Onboarding wizard: landlord identity + first property, all in one call. */
function completeOnboarding(token, data) {
  return safeCall_('completeOnboarding', function () {
    var session = requireRole_(token, ['SuperAdmin']);
    setSettingsBulk_({
      AppName: data.appName || DEFAULT_SETTINGS.AppName, LandlordName: data.landlordName,
      LandlordPhone: normalizePhoneGh_(data.landlordPhone) || data.landlordPhone,
      LandlordEmail: data.landlordEmail, ArkeselApiKey: data.arkeselApiKey || '', ArkeselSenderId: data.arkeselSenderId || 'KEYDEED',
      SmsEnabled: data.arkeselApiKey ? 'Y' : 'N', OnboardingDone: 'Y'
    });
    var property = null;
    if (data.firstProperty && data.firstProperty.PropertyName) {
      property = appendRow_(SHEETS.PROPERTIES, Object.assign({ Status: 'Active' }, data.firstProperty), 'PRP');
    }
    logAudit_(session.name, 'ONBOARDING', 'System', '', 'Completed');
    return { settings: getSettings_(), property: property };
  });
}

// ---- Exports & backup -------------------------------------------------------------------

function exportTableCsv(token, sheetName) {
  return safeCall_('exportTableCsv', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    if (Object.keys(SCHEMA).indexOf(sheetName) === -1) throw new Error('Unknown table.');
    var sh = getSheet_(sheetName);
    var data = sh.getDataRange().getValues();
    var csv = data.map(function (row) {
      return row.map(function (cell) {
        var v = cell instanceof Date ? formatDate_(cell) : String(cell === null || cell === undefined ? '' : cell);
        if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1) {
          v = '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(',');
    }).join('\n');
    return { csv: csv, filename: sheetName + '_' + Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyyMMdd') + '.csv' };
  });
}

function backupDatabase(token) {
  return safeCall_('backupDatabase', function () {
    var session = requireRole_(token, ['SuperAdmin']);
    var ss = getSS_();
    var file = DriveApp.getFileById(ss.getId());
    var stamp = Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyyMMdd_HHmm');
    var copy = file.makeCopy(DB_FILE_NAME + ' — Backup ' + stamp);
    logAudit_(session.name, 'BACKUP', 'System', '', copy.getId());
    return { fileId: copy.getId(), url: copy.getUrl() };
  });
}

function getAuditLog(token, limit) {
  return safeCall_('getAuditLog', function () {
    requireRole_(token, ['SuperAdmin']);
    var rows = readTable_(SHEETS.AUDIT).sort(function (a, b) { return new Date(b.Timestamp) - new Date(a.Timestamp); });
    return { logs: rows.slice(0, limit || 200) };
  });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Triggers
// =====================================================================================

/** Installs the daily reminders trigger (idempotent — removes any duplicates first). */
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runDailyReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runDailyReminders').timeBased().atHour(8).everyDays(1).inTimezone('Africa/Accra').create();
  logAudit_('SYSTEM', 'TRIGGER_INSTALL', 'System', '', 'runDailyReminders @ 08:00 Africa/Accra');
  return true;
}

function installTriggersAdmin(token) {
  return safeCall_('installTriggersAdmin', function () {
    requireRole_(token, ['SuperAdmin']);
    return installTriggers();
  });
}

function triggersInstalled_() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'runDailyReminders'; });
}

// =====================================================================================
// endregion
// =====================================================================================

// =====================================================================================
// region: Health Check
// =====================================================================================
// Powers the admin Health Check screen: database, Drive folders, triggers, SMS
// credentials and email quota, each with a boolean status the client can render as
// pass/fail plus a "Fix it" action.

function healthCheck(token) {
  return safeCall_('healthCheck', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    var checks = [];

    // Database
    var dbOk = false, dbDetail = '';
    try {
      var ss = getSS_();
      var missingTabs = Object.keys(SCHEMA).filter(function (name) { return !ss.getSheetByName(name); });
      dbOk = missingTabs.length === 0;
      dbDetail = dbOk ? ss.getUrl() : 'Missing tabs: ' + missingTabs.join(', ');
    } catch (e) { dbDetail = String(e); }
    checks.push({ key: 'database', label: 'Database (Google Sheet)', ok: dbOk, detail: dbDetail, fixable: true });

    // Drive folders
    var foldersOk = false, folderDetail = '';
    try {
      var props = PropertiesService.getScriptProperties();
      var missing = SUBFOLDERS.filter(function (name) {
        var id = props.getProperty(PROP_KEY.FOLDER_PREFIX + name.replace(/\s+/g, '_'));
        if (!id) return true;
        try { DriveApp.getFolderById(id); return false; } catch (e) { return true; }
      });
      foldersOk = missing.length === 0;
      folderDetail = foldersOk ? 'All folders present' : 'Missing: ' + missing.join(', ');
    } catch (e) { folderDetail = String(e); }
    checks.push({ key: 'folders', label: 'Drive Folder Tree', ok: foldersOk, detail: folderDetail, fixable: true });

    // Triggers
    var trigOk = triggersInstalled_();
    checks.push({ key: 'triggers', label: 'Daily Reminders Trigger', ok: trigOk, detail: trigOk ? 'Installed (08:00 Africa/Accra)' : 'Not installed', fixable: true });

    // SMS credentials
    var settings = getSettings_();
    var smsOk = !!settings.ArkeselApiKey && settings.SmsEnabled === 'Y';
    checks.push({ key: 'sms', label: 'SMS (Arkesel) Credentials', ok: smsOk,
      detail: smsOk ? 'Configured, Sender ID ' + settings.ArkeselSenderId : 'Not configured — add API key in Settings', fixable: false });

    // Email quota
    var quota = 0, emailOk = false;
    try { quota = MailApp.getRemainingDailyQuota(); emailOk = quota > 0; } catch (e) { /* n/a */ }
    checks.push({ key: 'email', label: 'Email Send Quota', ok: emailOk, detail: 'Remaining today: ' + quota, fixable: false });

    return { checks: checks, allOk: checks.every(function (c) { return c.ok; }) };
  });
}

function healthCheckFix(token, key) {
  return safeCall_('healthCheckFix', function () {
    requireRole_(token, ['SuperAdmin', 'Landlord']);
    if (key === 'database') { setup(); return { fixed: true }; }
    if (key === 'folders') { ensureFolders_(); return { fixed: true }; }
    if (key === 'triggers') { installTriggers(); return { fixed: true }; }
    throw new Error('No automatic fix available for: ' + key);
  });
}

// =====================================================================================
// endregion
// =====================================================================================
