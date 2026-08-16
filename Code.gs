// ============================================================================
// Code.gs — Multi-Business E-Commerce Platform (Google Apps Script backend)
//
// One Google Sheet acts as the database for MANY businesses grouped under a
// single storefront (e.g. Data Bundles, Picture Frames, School Sirens,
// Source Code / Scripts, ...). Customers can browse and check out as guests
// or as registered accounts. Admins manage everything from a separate
// Admin Portal page (?page=admin).
//
// See SETUP.md for how to wire this up to a Google Sheet and deploy it.
// ============================================================================

// Bump when SHEETS changes so ensureSetup_ re-runs and adds new columns to
// spreadsheets created by an older version of this script.
var SCHEMA_VERSION = '5';

// Shown in the storefront footer and admin sidebar. If this doesn't match the
// file you pasted, the deployment is still serving an older version.
var BUILD_VERSION = '2026.08.16-8';

// ---------------------------------------------------------------------------
// Sheet schema — single source of truth for headers used by the generic
// object <-> row helpers below. Add a new sheet by adding an entry here;
// add a column simply by appending its header to an existing list.
// ---------------------------------------------------------------------------
var SHEETS = {
  Settings:       ['Key', 'Value'],
  Businesses:     ['BusinessID', 'Name', 'Description', 'LogoURL', 'WhatsAppNumber', 'Active', 'SortOrder', 'CreatedAt'],
  Products:       ['ProductID', 'BusinessID', 'ImageURL', 'Name', 'Description', 'Category', 'Price', 'Stock', 'IsService', 'EnquireOnWhatsApp', 'Active', 'CreatedAt', 'RequiresRecipient', 'RecipientLabel', 'ConfirmationNote', 'InStock', 'ShowWhatsApp'],
  Customers:      ['CustomerID', 'Name', 'Address', 'Phone', 'Username', 'PasswordHash', 'CreatedAt', 'Email', 'AuthProvider'],
  Admins:         ['AdminID', 'Username', 'PasswordHash', 'Name', 'Role', 'CreatedAt', 'Email', 'RememberHash', 'RememberExpires'],
  Orders:         ['OrderID', 'OrderType', 'Username', 'CustomerName', 'Phone', 'Address', 'Subtotal', 'DiscountAmount', 'Total', 'PaymentMethodID', 'PaymentMethodLabel', 'PayerNumber', 'TransactionID', 'PaymentStatus', 'OrderStatus', 'Notes', 'CreatedAt', 'UpdatedAt', 'CustomerEmail'],
  OrderItems:     ['OrderItemID', 'OrderID', 'ProductID', 'BusinessID', 'ProductName', 'BusinessName', 'Category', 'Qty', 'UnitPrice', 'LineDiscount', 'Subtotal', 'RecipientNumber'],
  PaymentMethods: ['PaymentMethodID', 'Type', 'Label', 'AccountName', 'AccountNumber', 'Provider', 'Instructions', 'Active', 'SortOrder'],
  Banners:        ['BannerID', 'ImageURL', 'Title', 'LinkURL', 'Active', 'SortOrder', 'MediaType'],
  Discounts:      ['DiscountID', 'Label', 'Scope', 'TargetID', 'Type', 'Value', 'StartDate', 'EndDate', 'Active'],
  Expenses:       ['ExpenseID', 'Date', 'BusinessID', 'Category', 'Description', 'Amount', 'AddedBy', 'CreatedAt'],
  SmsProviders:   ['ProviderID', 'Name', 'Type', 'SenderID', 'BaseURL', 'ExtraConfig', 'Active', 'SortOrder', 'CreatedAt'],
  SmsLog:         ['SmsID', 'CreatedAt', 'Phone', 'Message', 'ProviderID', 'ProviderName', 'Status', 'Response', 'Campaign', 'SentBy'],
  EmailLog:       ['EmailID', 'CreatedAt', 'ToEmail', 'Subject', 'Status', 'Response', 'Campaign', 'SentBy'],
  Messages:       ['MessageID', 'CreatedAt', 'Name', 'Phone', 'Email', 'Subject', 'Body', 'Status', 'Reply', 'RepliedAt', 'RepliedBy']
};

var LOW_STOCK_THRESHOLD = 5;
var ADMIN_TOKEN_TTL_SECONDS = 21600; // 6 hours (CacheService max)
var ADMIN_REMEMBER_DAYS = 30;        // lifetime of an opt-in "keep me signed in" token

var DEFAULT_BUNDLE_DISCLAIMER =
  'This bundle does not apply to Turbo net SIM, WiFi SIM, Merchant Sim, Wrong numbers or MiFi SIM. ' +
  'No refund will be provided if you attempt to load on these SIMs.';

// ---------------------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------------------
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page === 'admin') ? 'admin' : 'index';

  // Builds/repairs the spreadsheet on first visit so there is no manual setup
  // step. Never let a setup hiccup block the page from rendering.
  try { ensureSetup_(); } catch (err) { Logger.log('ensureSetup_ failed: ' + err); }
  // One-time purge of a URL an older build cached permanently in Script
  // Properties (shared across every deployment) — see getWebAppUrl().
  try {
    var _props = PropertiesService.getScriptProperties();
    if (_props.getProperty('WEB_APP_URL')) _props.deleteProperty('WEB_APP_URL');
  } catch (err) { /* non-fatal */ }

  var siteName = 'My Multi-Business Store';
  try { siteName = getSettingValue_('SiteName', siteName); } catch (err) { /* not set up yet */ }

  var out = HtmlService.createTemplateFromFile(page)
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5')
    .setTitle(page === 'admin' ? ('Admin Portal - ' + siteName) : siteName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  // Warn loudly, on the page itself, when a file is out of date.
  try {
    var stale = staleFiles_();
    if (stale.length) {
      var banner = staleBannerHtml_(stale);
      var html = out.getContent();
      out.setContent(html.indexOf('</body>') !== -1 ? html.replace('</body>', banner + '</body>') : html + banner);
    }
  } catch (err) {
    Logger.log('stale check failed: ' + err);
  }

  return out;
}

// Each HTML file embeds MB_BUILD:<version>. Comparing that against
// BUILD_VERSION tells us if a file was missed when the code was pasted in,
// which is otherwise very easy to miss and looks like "the feature didn't ship".
function fileBuild_(filename) {
  try {
    var content = HtmlService.createHtmlOutputFromFile(filename).getContent();
    // Matched from either the leading comment or the body attribute, so the
    // check can't produce a false "out of date" if comments are ever stripped.
    var m = content.match(/MB_BUILD:([0-9.\-]+)/) || content.match(/data-mb-build="([0-9.\-]+)"/);
    return m ? m[1] : null;
  } catch (err) {
    return null;
  }
}

function staleFiles_() {
  var stale = [];
  ['index', 'admin'].forEach(function (f) {
    var v = fileBuild_(f);
    if (v !== BUILD_VERSION) stale.push({ file: f, found: v || 'no version marker', expected: BUILD_VERSION });
  });
  return stale;
}

function staleBannerHtml_(stale) {
  var rows = stale.map(function (s) {
    return '<li><b>' + s.file + '</b> file is on <code>' + s.found + '</code>, expected <code>' + s.expected + '</code></li>';
  }).join('');
  return '<div id="mbStaleBanner" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#b91c1c;color:#fff;' +
    'padding:12px 44px 12px 16px;font:14px/1.5 Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3)">' +
    '<b>Some files were not updated.</b> Code.gs is on <code>' + BUILD_VERSION + '</code> but:' +
    '<ul style="margin:6px 0 0 18px;padding:0">' + rows + '</ul>' +
    '<div style="margin-top:8px;font-size:13px;opacity:.95">This is why features are missing: the SMS/Email/Messages tabs, ' +
    'the tabbed Settings screen, "Keep me signed in" and the video upload option all live in these files.</div>' +
    '<div style="margin-top:8px;font-size:13px;opacity:.95">Open the Apps Script editor, click into that file, press <b>Ctrl+A</b> then <b>Delete</b>, paste the new file, <b>Ctrl+S</b>, then Deploy &rarr; Manage deployments &rarr; pencil &rarr; New version.</div>' +
    '<button onclick="document.getElementById(\'mbStaleBanner\').remove()" ' +
    'style="position:absolute;top:8px;right:10px;background:transparent;border:0;color:#fff;font-size:20px;cursor:pointer">&times;</button>' +
    '</div>';
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// The pages run inside a sandboxed iframe, so links between the storefront and
// the admin portal need the real deployment URL plus target="_top".
function getWebAppUrl() {
  // Deliberately NOT cached. Script Properties are shared by every deployment
  // of this project, so caching this once meant every deployment — including
  // ones created later — kept reading back whichever URL happened to be saved
  // first, even after that deployment was archived. ScriptApp.getService()
  // already returns the URL of whichever deployment served THIS request, and
  // costs nothing (no sheet access), so there is nothing to cache.
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (err) {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Spreadsheet access — works whether the script is bound to the Sheet or
// deployed standalone with a SPREADSHEET_ID script property.
// ---------------------------------------------------------------------------
function getSS_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('No spreadsheet bound to this script. Set SPREADSHEET_ID in Script Properties.');
  return SpreadsheetApp.openById(id);
}

// Sheet-name uniqueness in Google Sheets is case-insensitive, but
// getSheetByName() is case-sensitive — and a stray leading/trailing space in a
// hand-created tab hides it too. Either case makes a lookup miss while
// insertSheet() still refuses with "a sheet with that name already exists", so
// always fall back to a normalized scan before creating anything.
function normalizeSheetName_(name) {
  return String(name == null ? '' : name).trim().toLowerCase();
}

function findSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  var target = normalizeSheetName_(name);
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (normalizeSheetName_(all[i].getName()) === target) return all[i];
  }
  return null;
}

// create === false makes this a pure lookup (returns null when absent) so that
// read paths can never fail or mutate the spreadsheet.
function getSheet_(name, create) {
  var ss = getSS_();
  var sheet = findSheet_(ss, name);
  if (sheet) {
    if (create !== false) ensureHeaders_(sheet, name);
    return sheet;
  }
  if (create === false) return null;

  try {
    sheet = ss.insertSheet(name);
  } catch (err) {
    // Lost a race, or the tab exists under a name the scan didn't match.
    // Re-scan rather than letting the whole request fail.
    sheet = findSheet_(ss, name);
    if (!sheet) throw err;
  }
  ensureHeaders_(sheet, name);
  return sheet;
}

function ensureHeaders_(sheet, name) {
  var headers = SHEETS[name];
  if (!headers) return sheet;
  var width = Math.max(sheet.getLastColumn(), headers.length);
  var firstRow = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (firstRow.join('') !== '') return sheet; // already has a header row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

// Adds any header this version of the script expects but the sheet doesn't
// have yet, so existing stores pick up new features without losing data.
function ensureColumns_(name) {
  var sheet = getSheet_(name, false);
  if (!sheet) return;
  var headers = SHEETS[name];
  var width = sheet.getLastColumn();
  var current = width ? sheet.getRange(1, 1, 1, width).getValues()[0] : [];
  while (current.length && String(current[current.length - 1]).trim() === '') current.pop();

  var missing = headers.filter(function (h) { return current.indexOf(h) === -1; });
  if (!missing.length) return;
  sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
}

// ---------------------------------------------------------------------------
// Locking. Apps Script locks are not re-entrant: a second waitLock() inside the
// same execution blocks until it times out. Track depth so nested writes (a
// seed routine calling appendRowObject_, say) reuse the lock already held.
// ---------------------------------------------------------------------------
var _lockDepth = 0;

function withLock_(fn) {
  if (_lockDepth > 0) return fn();
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  _lockDepth++;
  try {
    return fn();
  } finally {
    _lockDepth--;
    try { lock.releaseLock(); } catch (err) { /* already released */ }
  }
}

// ---------------------------------------------------------------------------
// Setup runs itself. Every page load calls ensureSetup_(), which creates any
// missing sheet with its headers and seeds defaults, so a fresh spreadsheet
// becomes a working store with no manual step. It is idempotent and skips
// seeding anything that already has rows, so it never clobbers real data.
// ---------------------------------------------------------------------------
function ensureSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SETUP_VERSION') === SCHEMA_VERSION) return;
  withLock_(function () {
    if (props.getProperty('SETUP_VERSION') === SCHEMA_VERSION) return;
    Object.keys(SHEETS).forEach(function (name) {
      getSheet_(name);
      ensureColumns_(name);
    });
    seedDefaultSettings_();
    seedDefaultPaymentMethod_();
    seedSampleCatalog_();
    props.setProperty('SETUP_VERSION', SCHEMA_VERSION);
    // A version change means cached payloads are stale by definition.
    invalidateRead_();
    bustStorefrontCache_();
  });
}

// Manual entry point, kept for running from the Apps Script editor. Repairs
// missing sheets/headers even after the auto-setup flag has been set.
function setupSheets() {
  PropertiesService.getScriptProperties().deleteProperty('SETUP_VERSION');
  ensureSetup_();
  return 'Setup complete. Open the web app with ?page=admin to create your admin account.';
}

// Seeds any setting key that isn't present yet. Runs per-key (rather than
// bailing out when the sheet is non-empty) so new settings introduced by a
// later version appear in existing stores without overwriting customized ones.
function seedDefaultSettings_() {
  // Generic out of the box — the first-run wizard replaces these with the
  // store owner's own details, so a fresh copy of this project carries no
  // previous owner's data.
  var defaults = {
    SiteName: 'My Multi-Business Store',
    Currency: 'GHS',
    CurrencySymbol: 'GHS ',
    WhatsAppNumber: '',
    WhatsAppGreeting: 'Hello! I would like to ask about your products.',
    ChatbotEnabled: 'TRUE',
    ChatbotGreeting: "Hi! I'm your shopping assistant. Ask me about orders, payment, delivery or products.",
    NewsTicker: 'Welcome to our store! Fast delivery and great prices on all our products.',
    NewsTickerEnabled: 'TRUE',
    PrimaryColor: '#2563eb',
    AccentColor: '#dc2626',
    ThemeMode: 'light',
    ContactPhone: '',
    ContactEmail: '',
    ContactAddress: '',
    FacebookURL: '',
    InstagramURL: '',
    TwitterURL: '',
    TikTokURL: '',
    YouTubeURL: '',
    LinkedInURL: '',
    MapEmbedURL: '',
    BundleDisclaimer: DEFAULT_BUNDLE_DISCLAIMER,
    SiteLogoURL: '',
    GoogleClientId: '',
    SmsCountryCode: '233',
    OrderEmailEnabled: 'TRUE',
    OrderSmsEnabled: 'FALSE',
    ContactFormEnabled: 'TRUE',
    VideoAdvertURL: '',
    VideoAdvertTitle: '',
    VideoAdvertEnabled: 'FALSE'
  };

  var existing = {};
  sheetToObjects_('Settings').forEach(function (r) { existing[r.Key] = true; });
  Object.keys(defaults).forEach(function (key) {
    if (existing[key]) return;
    appendRowObject_('Settings', { Key: key, Value: defaults[key] });
  });
}

// No admin account is seeded with a default/generated password — there would be
// no safe way to hand it to you. Instead the admin page shows a one-time
// "create your admin account" form while the Admins sheet is empty; see
// adminNeedsFirstAccount() / adminCreateFirstAccount() below.

function seedDefaultPaymentMethod_() {
  if (sheetToObjects_('PaymentMethods').length) return;
  appendRowObject_('PaymentMethods', {
    PaymentMethodID: genId_('PM'),
    Type: 'Mobile Money',
    Label: 'Mobile Money',
    AccountName: '',
    AccountNumber: '',
    Provider: 'MTN/Vodafone/AirtelTigo Mobile Money',
    Instructions: 'Send the exact amount to this Mobile Money number, then enter the number you paid from and the Transaction ID below to confirm your payment.',
    Active: true,
    SortOrder: 1
  });
}

// Seeds sample businesses that don't already exist (matched by name), so a
// store created on an older version picks up newly added samples on upgrade
// without duplicating what's already there. Runs once per SCHEMA_VERSION.
function seedSampleCatalog_() {
  var businesses = [
    { key: 'databundles', Name: 'Data Bundles', Description: 'Affordable mobile data bundles for all networks.', SortOrder: 1 },
    { key: 'electronics', Name: 'Electronics & Gadgets', Description: 'Quality electronics, accessories and gadgets.', SortOrder: 2 },
    { key: 'frames', Name: 'Picture Frames & Gifts', Description: 'Custom picture frames and gift items.', SortOrder: 3 },
    { key: 'security', Name: 'Security & Alarm Systems', Description: 'School sirens, smart bells and alarm systems, supplied and installed.', SortOrder: 4 },
    { key: 'code', Name: 'Scripts & Source Code', Description: 'Ready-made Google Apps Script and PHP project source code.', SortOrder: 5 }
  ];

  var existingByName = {};
  sheetToObjects_('Businesses').forEach(function (b) {
    existingByName[String(b.Name).trim().toLowerCase()] = String(b.BusinessID);
  });

  var ids = {}, created = {};
  businesses.forEach(function (b) {
    var key = b.Name.trim().toLowerCase();
    if (existingByName[key]) { ids[b.key] = existingByName[key]; return; }
    var id = genId_('BIZ');
    ids[b.key] = id;
    created[b.key] = true;
    appendRowObject_('Businesses', {
      BusinessID: id, Name: b.Name, Description: b.Description, LogoURL: '',
      WhatsAppNumber: '', Active: true, SortOrder: b.SortOrder, CreatedAt: new Date()
    });
  });

  var products = [
    { biz: 'databundles', Name: 'MTN 5GB Data Bundle', Description: 'MTN data bundle valid for 30 days. Delivered to any MTN number you provide at checkout.', Category: 'Data Bundles', Price: 30, Stock: '', IsService: true, RequiresRecipient: true },
    { biz: 'databundles', Name: 'Telecel 10GB Data Bundle', Description: 'Telecel data bundle valid for 30 days. Delivered to any Telecel number you provide at checkout.', Category: 'Data Bundles', Price: 55, Stock: '', IsService: true, RequiresRecipient: true },
    { biz: 'electronics', Name: 'Bluetooth Speaker', Description: 'Portable wireless Bluetooth speaker with deep bass, USB/SD playback and up to 8 hours of battery life.', Category: 'Audio', Price: 180, Stock: 12, ShowWhatsApp: true },
    { biz: 'electronics', Name: 'Wireless Earbuds', Description: 'True wireless earbuds with charging case, touch controls and noise isolation.', Category: 'Audio', Price: 120, Stock: 15, ShowWhatsApp: true },
    { biz: 'electronics', Name: 'Extension Board with Surge Protection', Description: 'Four-socket extension board with USB ports and built-in surge protection for your electronics.', Category: 'Accessories', Price: 85, Stock: 25 },
    { biz: 'electronics', Name: 'Rechargeable LED Standing Fan', Description: 'Rechargeable standing fan with built-in LED light — keeps running through power cuts.', Category: 'Home Appliances', Price: 450, Stock: 6, ShowWhatsApp: true },
    { biz: 'frames', Name: 'A4 Wooden Picture Frame', Description: 'Elegant wooden frame, holds one A4 photo. Custom sizes available on request.', Category: 'Picture Frames', Price: 45, Stock: 20 },
    { biz: 'security', Name: 'School Siren / Smart Bell', Description: 'Loud programmable electronic school bell and siren system. Rings automatically to your timetable, with manual override and an emergency alarm tone. Price covers the unit; installation and wiring are quoted separately based on your school size — message us on WhatsApp for a site-specific quote.', Category: 'Alarm Systems', Price: 1800, Stock: '', IsService: false, ShowWhatsApp: true },
    { biz: 'code', Name: 'Google Apps Script E-Commerce Source Code', Description: 'Full source code license for a Google Sheet-powered multi-business e-commerce site like this one. Includes the storefront, admin portal, setup guide and free installation support. Message us on WhatsApp if you have questions before buying.', Category: 'Source Code', Price: 250, Stock: '', IsService: true, ShowWhatsApp: true }
  ];

  products.forEach(function (p) {
    // Only seed products for businesses this run actually created, so sample
    // items never reappear inside a business the owner has been curating.
    if (!created[p.biz]) return;
    appendRowObject_('Products', {
      ProductID: genId_('PRD'), BusinessID: ids[p.biz], ImageURL: '', Name: p.Name, Description: p.Description,
      Category: p.Category, Price: p.Price, Stock: p.Stock, IsService: !!p.IsService,
      EnquireOnWhatsApp: !!p.EnquireOnWhatsApp, Active: true, CreatedAt: new Date(),
      RequiresRecipient: !!p.RequiresRecipient,
      RecipientLabel: p.RequiresRecipient ? 'Phone number to receive the bundle' : '',
      ConfirmationNote: p.RequiresRecipient ? DEFAULT_BUNDLE_DISCLAIMER : '',
      InStock: true, ShowWhatsApp: !!p.ShowWhatsApp
    });
  });
}

// ---------------------------------------------------------------------------
// Generic sheet <-> object helpers (header-driven, order independent)
// ---------------------------------------------------------------------------
// Sheet reads dominate request time in Apps Script, and a single request used
// to read Businesses/Products/Discounts several times over. Memoize per
// execution; writes drop the affected entry.
var _readCache = {};

function invalidateRead_(name) {
  if (name) delete _readCache[name];
  else _readCache = {};
}

function sheetToObjects_(name) {
  if (_readCache[name]) return _readCache[name];
  var out = readSheetObjects_(name);
  _readCache[name] = out;
  return out;
}

function readSheetObjects_(name) {
  // Reads never create or repair a sheet — a missing tab yields an empty list
  // instead of taking the whole page down.
  var sheet = getSheet_(name, false);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var obj = { _row: r + 2 };
    for (var c = 0; c < headers.length; c++) {
      if (headers[c]) obj[headers[c]] = values[r][c];
    }
    out.push(obj);
  }
  return out;
}

function appendRowObject_(name, obj) {
  invalidateRead_(name);
  bustStorefrontCache_();
  return withLock_(function () {
    var sheet = getSheet_(name);
    // Write against the sheet's own header row, not the in-code list, so a
    // sheet whose columns were reordered by hand still lands values correctly.
    var lastCol = Math.max(sheet.getLastColumn(), SHEETS[name].length);
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var key = headers[i];
      var v = (key && obj[key] !== undefined && obj[key] !== null) ? obj[key] : '';
      row.push(v);
    }
    sheet.appendRow(row);
    return obj;
  });
}

function updateRowById_(name, idField, idValue, patch) {
  invalidateRead_(name);
  bustStorefrontCache_();
  return withLock_(function () {
    var sheet = getSheet_(name);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return false;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headers.indexOf(idField);
    if (idCol === -1) return false;
    var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(idValue)) {
        var rowNum = i + 2;
        Object.keys(patch).forEach(function (key) {
          var col = headers.indexOf(key);
          if (col !== -1) sheet.getRange(rowNum, col + 1).setValue(patch[key]);
        });
        return true;
      }
    }
    return false;
  });
}

function deleteRowById_(name, idField, idValue) {
  invalidateRead_(name);
  bustStorefrontCache_();
  return withLock_(function () {
    var sheet = getSheet_(name);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return false;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var idCol = headers.indexOf(idField);
    if (idCol === -1) return false;
    var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(idValue)) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  });
}

function genId_(prefix) {
  return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
}

function hashPassword_(plain) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(plain), Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function toBool_(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  var s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

// Treats a blank cell as true — so a column added by a schema upgrade (InStock)
// doesn't silently switch every existing row off.
function toBoolDefaultTrue_(v) {
  if (v === '' || v === null || v === undefined) return true;
  return toBool_(v);
}

function toNum_(v, fallback) {
  var n = parseFloat(v);
  return isNaN(n) ? (fallback === undefined ? 0 : fallback) : n;
}

function round2_(n) { return Math.round((toNum_(n) + Number.EPSILON) * 100) / 100; }

// google.script.run has to serialize everything it returns. Dates inside nested
// structures are the usual source of silent breakage, so every payload sent to
// the client goes through here and comes back as plain strings/numbers.
function isoDate_(v) {
  if (!v) return '';
  try {
    var d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toISOString();
  } catch (err) {
    return String(v);
  }
}

function plain_(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return isoDate_(v);
  return v;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function getSettingValue_(key, fallback) {
  var rows = sheetToObjects_('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Key === key) return rows[i].Value;
  }
  return fallback;
}

function getPublicSettings_() {
  var rows = sheetToObjects_('Settings');
  var out = {};
  rows.forEach(function (r) { if (r.Key) out[r.Key] = plain_(r.Value); });
  return out;
}

// ---------------------------------------------------------------------------
// Discounts — computed pricing helpers
// ---------------------------------------------------------------------------
function getActiveDiscounts_() {
  var today = new Date();
  return sheetToObjects_('Discounts').filter(function (d) {
    if (!toBool_(d.Active)) return false;
    if (d.StartDate && new Date(d.StartDate) > today) return false;
    if (d.EndDate) {
      var end = new Date(d.EndDate);
      end.setHours(23, 59, 59, 999);
      if (end < today) return false;
    }
    return true;
  });
}

function bestDiscountFor_(product, discounts) {
  var best = null;
  discounts.forEach(function (d) {
    var applies =
      (d.Scope === 'global') ||
      (d.Scope === 'business' && String(d.TargetID) === String(product.BusinessID)) ||
      (d.Scope === 'product' && String(d.TargetID) === String(product.ProductID));
    if (!applies) return;
    var amount = d.Type === 'percent' ? (toNum_(product.Price) * toNum_(d.Value) / 100) : toNum_(d.Value);
    if (!best || amount > best.amount) {
      best = { amount: amount, label: d.Label || (d.Type === 'percent' ? (d.Value + '% off') : 'Discount'), type: d.Type, value: toNum_(d.Value) };
    }
  });
  return best;
}

// ---------------------------------------------------------------------------
// Storefront (public) API
// ---------------------------------------------------------------------------
// Keyed by schema version: upgrading the code can never serve a payload cached
// by the previous build (which is missing the new fields).
var STOREFRONT_CACHE_KEY = 'storefront_v' + SCHEMA_VERSION;
var STOREFRONT_CACHE_TTL = 300; // seconds

function bustStorefrontCache_() {
  try { CacheService.getScriptCache().remove(STOREFRONT_CACHE_KEY); } catch (err) { /* non-fatal */ }
}

// The catalog changes rarely but is read on every visit, and each sheet read
// costs a second or more. Serve shoppers from a short-lived cache; any admin
// write busts it, so edits still show up immediately.
function getStorefrontData(force) {
  var cache = null;
  try { cache = CacheService.getScriptCache(); } catch (err) { cache = null; }

  if (cache && !force) {
    try {
      var hit = cache.get(STOREFRONT_CACHE_KEY);
      if (hit) {
        var parsed = JSON.parse(hit);
        parsed.cached = true;
        return parsed;
      }
    } catch (err) { /* fall through to a fresh build */ }
  }

  // A broken/empty sheet should degrade to an empty store, never to an error
  // dialog over the whole page.
  try {
    var data = buildStorefrontData_();
    if (cache) {
      try {
        var json = JSON.stringify(data);
        // CacheService rejects values over 100KB; a large catalog just skips it.
        if (json.length < 95000) cache.put(STOREFRONT_CACHE_KEY, json, STOREFRONT_CACHE_TTL);
      } catch (err) { /* caching is best-effort */ }
    }
    return data;
  } catch (err) {
    Logger.log('getStorefrontData failed: ' + err);
    return {
      businesses: [], products: [], banners: [], paymentMethods: [],
      settings: { SiteName: 'My Multi-Business Store', CurrencySymbol: 'GHS ' },
      adminUrl: getWebAppUrl(),
      loadError: String(err && err.message ? err.message : err)
    };
  }
}

function buildStorefrontData_() {
  var allBusinesses = sheetToObjects_('Businesses');
  var bizById = {};
  allBusinesses.forEach(function (b) { bizById[b.BusinessID] = b; });

  var businesses = allBusinesses.filter(function (b) { return toBool_(b.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) {
      return {
        id: String(b.BusinessID), name: String(b.Name || ''), description: String(b.Description || ''),
        logo: String(b.LogoURL || ''), whatsapp: String(b.WhatsAppNumber || '')
      };
    });

  var discounts = getActiveDiscounts_();
  var settings = getPublicSettings_();

  var products = sheetToObjects_('Products').filter(function (p) { return toBool_(p.Active); }).map(function (p) {
    var biz = bizById[p.BusinessID] || {};
    var price = toNum_(p.Price);
    var discount = bestDiscountFor_(p, discounts);
    var finalPrice = discount ? Math.max(0, price - discount.amount) : price;
    var stock = (p.Stock === '' || p.Stock === null || p.Stock === undefined) ? null : toNum_(p.Stock);
    var requiresRecipient = toBool_(p.RequiresRecipient);
    return {
      id: String(p.ProductID),
      businessId: String(p.BusinessID || ''),
      businessName: String(biz.Name || 'General'),
      image: String(p.ImageURL || ''),
      name: String(p.Name || ''),
      description: String(p.Description || ''),
      category: String(p.Category || 'General'),
      price: round2_(finalPrice),
      originalPrice: round2_(price),
      onSale: !!discount,
      discountLabel: discount ? String(discount.label) : '',
      stock: stock,
      // Admin can force an item out of stock regardless of the counter.
      inStock: toBoolDefaultTrue_(p.InStock) && !(stock !== null && stock <= 0),
      isService: toBool_(p.IsService),
      // enquireOnWhatsApp replaces the buy control; showWhatsApp adds a
      // secondary enquiry button alongside it.
      enquireOnWhatsApp: toBool_(p.EnquireOnWhatsApp),
      showWhatsApp: toBool_(p.ShowWhatsApp),
      requiresRecipient: requiresRecipient,
      recipientLabel: String(p.RecipientLabel || 'Phone number to receive this'),
      confirmationNote: String(p.ConfirmationNote || (requiresRecipient ? (settings.BundleDisclaimer || DEFAULT_BUNDLE_DISCLAIMER) : ''))
    };
  });

  var banners = sheetToObjects_('Banners').filter(function (b) { return toBool_(b.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) {
      return {
        id: String(b.BannerID), image: String(b.ImageURL || ''), title: String(b.Title || ''),
        link: String(b.LinkURL || ''), mediaType: String(b.MediaType || 'image').toLowerCase()
      };
    });

  var paymentMethods = sheetToObjects_('PaymentMethods').filter(function (p) { return toBool_(p.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (p) {
      return {
        id: String(p.PaymentMethodID), type: String(p.Type || ''), label: String(p.Label || ''),
        accountName: String(p.AccountName || ''), accountNumber: String(p.AccountNumber || ''),
        provider: String(p.Provider || ''), instructions: String(p.Instructions || '')
      };
    });

  return {
    businesses: businesses,
    products: products,
    banners: banners,
    paymentMethods: paymentMethods,
    settings: settings,
    adminUrl: getWebAppUrl(),
    build: BUILD_VERSION
  };
}

// ---------------------------------------------------------------------------
// Customer accounts (optional — guest checkout is always available)
// ---------------------------------------------------------------------------
function registerCustomer(name, address, phone, username, password) {
  name = String(name || '').trim();
  address = String(address || '').trim();
  phone = String(phone || '').trim();
  username = String(username || '').trim().toLowerCase();
  password = String(password || '');

  if (!name || !address || !phone || !username || !password) return { success: false, message: 'Please fill in all fields.' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

  var existing = sheetToObjects_('Customers').filter(function (c) { return String(c.Username).toLowerCase() === username; });
  if (existing.length) return { success: false, message: 'Username already exists. Please choose a different one.' };

  appendRowObject_('Customers', {
    CustomerID: genId_('CUS'), Name: name, Address: address, Phone: phone,
    Username: username, PasswordHash: hashPassword_(password), CreatedAt: new Date()
  });
  return { success: true };
}

function loginCustomer(username, password) {
  username = String(username || '').trim().toLowerCase();
  var hash = hashPassword_(String(password || ''));
  var match = sheetToObjects_('Customers').filter(function (c) {
    return String(c.Username).toLowerCase() === username && c.PasswordHash === hash;
  })[0];
  if (!match) return null;
  return {
    username: String(match.Username), name: String(match.Name || ''),
    address: String(match.Address || ''), phone: String(match.Phone || '')
  };
}

// ---------------------------------------------------------------------------
// Orders — placed by guests or logged-in customers. Prices/stock are
// recalculated server-side from the product catalog (never trust client
// submitted prices).
// ---------------------------------------------------------------------------
function placeOrder(payload) {
  try {
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    var customerName = String(payload.customerName || '').trim();
    var phone = String(payload.phone || '').trim();
    var address = String(payload.address || '').trim();
    if (!customerName || !phone || !address) {
      return { success: false, message: 'Please provide your name, phone number and address.' };
    }
    if (!payload.paymentMethodId) return { success: false, message: 'Please select a payment method.' };
    var payerNumber = String(payload.payerNumber || '').trim();
    var transactionId = String(payload.transactionId || '').trim();
    if (!payerNumber || !transactionId) {
      return { success: false, message: 'Please enter the Mobile Money number used to pay and the Transaction ID.' };
    }

    var paymentMethod = sheetToObjects_('PaymentMethods').filter(function (p) { return p.PaymentMethodID === payload.paymentMethodId; })[0];
    if (!paymentMethod) return { success: false, message: 'Selected payment method is no longer available.' };

    var productsById = {};
    sheetToObjects_('Products').forEach(function (p) { productsById[p.ProductID] = p; });
    var businessById = {};
    sheetToObjects_('Businesses').forEach(function (b) { businessById[b.BusinessID] = b; });
    var discounts = getActiveDiscounts_();

    var lineItems = [];
    var subtotal = 0, discountTotal = 0;
    // The same product can appear on several lines (e.g. the same bundle for
    // different phone numbers), so stock is tracked cumulatively across lines.
    var qtyByProduct = {};

    for (var i = 0; i < payload.items.length; i++) {
      var reqItem = payload.items[i];
      var product = productsById[reqItem.productId];
      if (!product || !toBool_(product.Active)) {
        return { success: false, message: 'One of the items in your cart is no longer available. Please refresh and try again.' };
      }
      var stock = (product.Stock === '' || product.Stock === null || product.Stock === undefined) ? null : toNum_(product.Stock);
      if (!toBoolDefaultTrue_(product.InStock) || (stock !== null && stock <= 0)) {
        return { success: false, message: '"' + product.Name + '" is out of stock.' };
      }

      var recipient = String(reqItem.recipient || '').trim();
      if (toBool_(product.RequiresRecipient) && !recipient) {
        return { success: false, message: 'Please provide the phone number for "' + product.Name + '".' };
      }

      var qty = Math.max(1, Math.floor(toNum_(reqItem.qty, 1)));
      qtyByProduct[product.ProductID] = (qtyByProduct[product.ProductID] || 0) + qty;
      if (stock !== null && qtyByProduct[product.ProductID] > stock) {
        return { success: false, message: '"' + product.Name + '" only has ' + stock + ' in stock.' };
      }

      var unitPrice = toNum_(product.Price);
      var discount = bestDiscountFor_(product, discounts);
      var finalUnitPrice = discount ? Math.max(0, unitPrice - discount.amount) : unitPrice;

      subtotal += unitPrice * qty;
      discountTotal += (unitPrice - finalUnitPrice) * qty;

      lineItems.push({
        product: product, qty: qty, unitPrice: finalUnitPrice, recipient: recipient,
        lineDiscount: (unitPrice - finalUnitPrice) * qty, subtotal: finalUnitPrice * qty
      });
    }

    var total = subtotal - discountTotal;
    var orderId = genId_('ORD');
    var now = new Date();

    appendRowObject_('Orders', {
      OrderID: orderId,
      OrderType: payload.isGuest === false ? 'customer' : 'guest',
      Username: payload.username ? String(payload.username).toLowerCase() : '',
      CustomerName: customerName, Phone: phone, Address: address,
      Subtotal: round2_(subtotal), DiscountAmount: round2_(discountTotal), Total: round2_(total),
      PaymentMethodID: paymentMethod.PaymentMethodID, PaymentMethodLabel: paymentMethod.Label,
      PayerNumber: payerNumber, TransactionID: transactionId,
      PaymentStatus: 'Pending Verification', OrderStatus: 'Pending',
      Notes: payload.notes || '', CreatedAt: now, UpdatedAt: now,
      CustomerEmail: String(payload.email || '').trim().toLowerCase()
    });

    lineItems.forEach(function (li) {
      var biz = businessById[li.product.BusinessID] || {};
      appendRowObject_('OrderItems', {
        OrderItemID: genId_('OI'), OrderID: orderId, ProductID: li.product.ProductID,
        BusinessID: li.product.BusinessID, ProductName: li.product.Name, BusinessName: biz.Name || '',
        Category: li.product.Category, Qty: li.qty, UnitPrice: round2_(li.unitPrice),
        LineDiscount: round2_(li.lineDiscount), Subtotal: round2_(li.subtotal),
        RecipientNumber: li.recipient
      });
    });

    // Decrement tracked inventory once per product, after all lines are known.
    Object.keys(qtyByProduct).forEach(function (productId) {
      var p = productsById[productId];
      var stock = (p.Stock === '' || p.Stock === null || p.Stock === undefined) ? null : toNum_(p.Stock);
      if (stock === null) return;
      updateRowById_('Products', 'ProductID', productId, { Stock: Math.max(0, stock - qtyByProduct[productId]) });
    });

    // Best-effort: the order is already saved, so a mail/SMS failure must not
    // turn a successful checkout into an error for the customer.
    notifyOrderPlaced_(orderId);

    return { success: true, orderId: orderId, total: round2_(total) };
  } catch (err) {
    return { success: false, message: 'Something went wrong placing your order: ' + err.message };
  }
}

function getOrderHistory(username) {
  username = String(username || '').trim().toLowerCase();
  if (!username) return [];
  var orders = sheetToObjects_('Orders').filter(function (o) { return String(o.Username).toLowerCase() === username; });
  return attachItemsToOrders_(orders).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
}

function trackOrder(orderId, phone) {
  orderId = String(orderId || '').trim();
  phone = String(phone || '').trim();
  if (!orderId || !phone) return null;
  var digits = phone.replace(/\D/g, '');
  var order = sheetToObjects_('Orders').filter(function (o) {
    return String(o.OrderID).trim().toLowerCase() === orderId.toLowerCase() &&
      String(o.Phone).replace(/\D/g, '') === digits;
  })[0];
  if (!order) return null;
  return attachItemsToOrders_([order])[0];
}

// Everything here is flattened to strings/numbers: google.script.run silently
// drops payloads it cannot serialize, and raw Date values nested inside the
// items array were doing exactly that — the admin Orders table came back empty
// while the dashboard (which only counts rows) looked fine.
function attachItemsToOrders_(orders) {
  var allItems = sheetToObjects_('OrderItems');
  var itemsByOrder = {};
  allItems.forEach(function (i) {
    var key = String(i.OrderID);
    if (!itemsByOrder[key]) itemsByOrder[key] = [];
    itemsByOrder[key].push({
      productName: String(i.ProductName || ''),
      businessName: String(i.BusinessName || ''),
      category: String(i.Category || ''),
      recipient: String(i.RecipientNumber || ''),
      qty: toNum_(i.Qty),
      unitPrice: round2_(i.UnitPrice),
      subtotal: round2_(i.Subtotal)
    });
  });

  return orders.map(function (o) {
    return {
      orderId: String(o.OrderID || ''),
      customerName: String(o.CustomerName || ''),
      phone: String(o.Phone || ''),
      address: String(o.Address || ''),
      subtotal: round2_(o.Subtotal),
      discountAmount: round2_(o.DiscountAmount),
      total: round2_(o.Total),
      paymentMethod: String(o.PaymentMethodLabel || ''),
      payerNumber: String(o.PayerNumber || ''),
      transactionId: String(o.TransactionID || ''),
      paymentStatus: String(o.PaymentStatus || ''),
      orderStatus: String(o.OrderStatus || ''),
      notes: String(o.Notes || ''),
      createdAt: isoDate_(o.CreatedAt),
      updatedAt: isoDate_(o.UpdatedAt),
      items: itemsByOrder[String(o.OrderID)] || []
    };
  });
}

// ============================================================================
// ADMIN PORTAL API — every function below (except adminLogin and the first-run
// helpers) requires a valid session token returned by adminLogin().
// ============================================================================
function requireAdmin_(token) {
  var cache = CacheService.getScriptCache();
  var raw = token ? cache.get('admtok_' + token) : null;
  if (!raw) throw new Error('Your admin session has expired. Please log in again.');
  return JSON.parse(raw);
}

// True while the Admins sheet is empty — the admin page then shows a "create
// your account" form instead of a login form.
function adminNeedsFirstAccount() {
  try { ensureSetup_(); } catch (err) { Logger.log('ensureSetup_ failed: ' + err); }
  return sheetToObjects_('Admins').length === 0;
}

// Deliberately unauthenticated, but only ever succeeds while no admin exists,
// so it closes permanently the moment the first account is created. `store` is
// optional onboarding data (store name, currency, WhatsApp, payment details)
// captured by the same wizard, so a new owner is trading immediately.
function adminCreateFirstAccount(name, username, password, store) {
  try { ensureSetup_(); } catch (err) { Logger.log('ensureSetup_ failed: ' + err); }

  name = String(name || '').trim();
  username = String(username || '').trim().toLowerCase();
  password = String(password || '');

  if (!name || !username || !password) return { success: false, message: 'Please fill in all fields.' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

  return withLock_(function () {
    if (sheetToObjects_('Admins').length > 0) {
      return { success: false, message: 'An admin account already exists. Please log in instead.' };
    }
    appendRowObject_('Admins', {
      AdminID: genId_('ADM'), Username: username, PasswordHash: hashPassword_(password),
      Name: name, Role: 'owner', CreatedAt: new Date()
    });

    if (store) {
      var settings = {};
      if (store.siteName) settings.SiteName = String(store.siteName).trim();
      if (store.currencySymbol) settings.CurrencySymbol = String(store.currencySymbol);
      if (store.currency) settings.Currency = String(store.currency).trim();
      if (store.whatsapp) { settings.WhatsAppNumber = String(store.whatsapp).trim(); settings.ContactPhone = String(store.whatsapp).trim(); }
      applySettings_(settings);

      // Fill in the placeholder payment method rather than adding a second one.
      if (store.momoName || store.momoNumber) {
        var pm = sheetToObjects_('PaymentMethods')[0];
        var patch = {
          AccountName: String(store.momoName || '').trim(),
          AccountNumber: String(store.momoNumber || '').trim()
        };
        if (pm) updateRowById_('PaymentMethods', 'PaymentMethodID', pm.PaymentMethodID, patch);
      }
    }
    return { success: true };
  });
}

// Shared by the onboarding wizard and the Settings screen.
function applySettings_(settingsObj) {
  var existing = {};
  sheetToObjects_('Settings').forEach(function (s) { existing[s.Key] = true; });
  Object.keys(settingsObj).forEach(function (key) {
    if (existing[key]) updateRowById_('Settings', 'Key', key, { Value: settingsObj[key] });
    else appendRowObject_('Settings', { Key: key, Value: settingsObj[key] });
  });
}

// Lets a new owner wipe the demo catalog in one click once they've added their
// own. Only touches businesses/products whose names match what we seeded.
function adminClearSampleData(token) {
  requireAdmin_(token);
  var sampleBusinesses = ['data bundles', 'electronics & gadgets', 'picture frames & gifts', 'security & alarm systems', 'scripts & source code'];
  var removedBiz = 0, removedProducts = 0;

  var businesses = sheetToObjects_('Businesses').filter(function (b) {
    return sampleBusinesses.indexOf(String(b.Name).trim().toLowerCase()) !== -1;
  });
  var ids = {};
  businesses.forEach(function (b) { ids[String(b.BusinessID)] = true; });

  sheetToObjects_('Products').forEach(function (p) {
    if (ids[String(p.BusinessID)]) {
      deleteRowById_('Products', 'ProductID', p.ProductID);
      removedProducts++;
    }
  });
  businesses.forEach(function (b) {
    deleteRowById_('Businesses', 'BusinessID', b.BusinessID);
    removedBiz++;
  });

  return { success: true, removedBusinesses: removedBiz, removedProducts: removedProducts };
}

function startAdminSession_(admin, remember) {
  var token = Utilities.getUuid();
  var session = { adminId: admin.AdminID, username: admin.Username, name: admin.Name, role: admin.Role };
  CacheService.getScriptCache().put('admtok_' + token, JSON.stringify(session), ADMIN_TOKEN_TTL_SECONDS);

  var out = {
    token: token, name: String(admin.Name || ''), role: String(admin.Role || ''),
    username: String(admin.Username || '')
  };

  // "Keep me signed in" is opt-in. Only then do we mint a long-lived token,
  // stored hashed so a leaked spreadsheet can't be replayed as a login.
  if (remember) {
    var rememberToken = Utilities.getUuid() + Utilities.getUuid();
    var expires = new Date();
    expires.setDate(expires.getDate() + ADMIN_REMEMBER_DAYS);
    updateRowById_('Admins', 'AdminID', admin.AdminID, {
      RememberHash: hashPassword_(rememberToken), RememberExpires: expires
    });
    out.rememberToken = rememberToken;
  }
  return out;
}

function adminLogin(username, password, remember) {
  username = String(username || '').trim().toLowerCase();
  var hash = hashPassword_(String(password || ''));
  var match = sheetToObjects_('Admins').filter(function (a) {
    return String(a.Username).toLowerCase() === username && a.PasswordHash === hash;
  })[0];
  if (!match) return null;
  return startAdminSession_(match, !!remember);
}

// Only called when the admin ticked "Keep me signed in"; a plain revisit always
// lands on the login form, so a customer tapping the admin icon sees nothing.
function adminResumeSession(rememberToken) {
  rememberToken = String(rememberToken || '');
  if (!rememberToken) return null;
  var hash = hashPassword_(rememberToken);
  var match = sheetToObjects_('Admins').filter(function (a) { return a.RememberHash && a.RememberHash === hash; })[0];
  if (!match) return null;
  if (!match.RememberExpires || new Date(match.RememberExpires) < new Date()) {
    updateRowById_('Admins', 'AdminID', match.AdminID, { RememberHash: '', RememberExpires: '' });
    return null;
  }
  return startAdminSession_(match, false);
}

function adminLogout(token, rememberToken) {
  if (token) {
    try {
      var session = requireAdmin_(token);
      // Clear the long-lived token too, so "log out" really logs out.
      updateRowById_('Admins', 'AdminID', session.adminId, { RememberHash: '', RememberExpires: '' });
    } catch (err) { /* session already gone */ }
    CacheService.getScriptCache().remove('admtok_' + token);
  }
  if (rememberToken) {
    var hash = hashPassword_(String(rememberToken));
    var match = sheetToObjects_('Admins').filter(function (a) { return a.RememberHash === hash; })[0];
    if (match) updateRowById_('Admins', 'AdminID', match.AdminID, { RememberHash: '', RememberExpires: '' });
  }
  return true;
}

function adminChangePassword(token, currentPassword, newPassword) {
  var admin = requireAdmin_(token);
  var row = sheetToObjects_('Admins').filter(function (a) { return a.AdminID === admin.adminId; })[0];
  if (!row || row.PasswordHash !== hashPassword_(currentPassword)) {
    return { success: false, message: 'Current password is incorrect.' };
  }
  if (String(newPassword || '').length < 6) return { success: false, message: 'New password must be at least 6 characters.' };
  updateRowById_('Admins', 'AdminID', admin.adminId, { PasswordHash: hashPassword_(newPassword) });
  return { success: true };
}

function adminAddAdmin(token, data) {
  requireAdmin_(token);
  var username = String(data.username || '').trim().toLowerCase();
  if (!username || !data.password || !data.name) return { success: false, message: 'Name, username and password are required.' };
  if (String(data.password).length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
  var exists = sheetToObjects_('Admins').some(function (a) { return String(a.Username).toLowerCase() === username; });
  if (exists) return { success: false, message: 'That admin username already exists.' };
  appendRowObject_('Admins', {
    AdminID: genId_('ADM'), Username: username, PasswordHash: hashPassword_(data.password),
    Name: data.name, Role: data.role || 'staff', CreatedAt: new Date(),
    Email: String(data.email || '').trim().toLowerCase()
  });
  return { success: true };
}

function adminGetAdmins(token) {
  requireAdmin_(token);
  return sheetToObjects_('Admins').map(function (a) {
    return {
      id: String(a.AdminID), username: String(a.Username || ''), name: String(a.Name || ''),
      role: String(a.Role || ''), email: String(a.Email || ''), createdAt: isoDate_(a.CreatedAt)
    };
  });
}

// --- Dashboard -------------------------------------------------------------
function adminGetDashboard(token) {
  requireAdmin_(token);
  var orders = sheetToObjects_('Orders');
  var items = sheetToObjects_('OrderItems');
  var expenses = sheetToObjects_('Expenses');
  var products = sheetToObjects_('Products');
  var businesses = sheetToObjects_('Businesses');

  var confirmedOrders = orders.filter(function (o) { return o.PaymentStatus === 'Confirmed'; });
  var totalIncome = confirmedOrders.reduce(function (s, o) { return s + toNum_(o.Total); }, 0);
  var totalExpenses = expenses.reduce(function (s, e) { return s + toNum_(e.Amount); }, 0);
  var pendingPayments = orders.filter(function (o) { return o.PaymentStatus === 'Pending Verification'; }).length;

  var tz = Session.getScriptTimeZone() || 'Etc/UTC';
  var days = [];
  for (var i = 13; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: Utilities.formatDate(d, tz, 'd MMM'), key: Utilities.formatDate(d, tz, 'yyyy-MM-dd'), total: 0 });
  }
  var dayIndex = {};
  days.forEach(function (d, idx) { dayIndex[d.key] = idx; });
  confirmedOrders.forEach(function (o) {
    if (!o.CreatedAt) return;
    try {
      var key = Utilities.formatDate(new Date(o.CreatedAt), tz, 'yyyy-MM-dd');
      if (dayIndex.hasOwnProperty(key)) days[dayIndex[key]].total += toNum_(o.Total);
    } catch (err) { /* unparseable date, skip */ }
  });
  days.forEach(function (d) { d.total = round2_(d.total); });

  var confirmedOrderIds = {};
  confirmedOrders.forEach(function (o) { confirmedOrderIds[o.OrderID] = true; });
  var bizTotals = {}, productQty = {};
  items.forEach(function (it) {
    if (!confirmedOrderIds[it.OrderID]) return;
    var bn = String(it.BusinessName || 'General');
    bizTotals[bn] = (bizTotals[bn] || 0) + toNum_(it.Subtotal);
    var pn = String(it.ProductName || '');
    productQty[pn] = (productQty[pn] || 0) + toNum_(it.Qty);
  });
  var businessBreakdown = Object.keys(bizTotals).map(function (k) { return { business: k, total: round2_(bizTotals[k]) }; })
    .sort(function (a, b) { return b.total - a.total; });
  var topProducts = Object.keys(productQty).map(function (k) { return { product: k, qty: productQty[k] }; })
    .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

  var lowStock = products.filter(function (p) {
    if (p.Stock === '' || p.Stock === null || p.Stock === undefined) return false;
    return toBool_(p.Active) && toNum_(p.Stock) <= LOW_STOCK_THRESHOLD;
  }).map(function (p) { return { id: String(p.ProductID), name: String(p.Name || ''), stock: toNum_(p.Stock) }; });

  return {
    totalOrders: orders.length,
    confirmedOrders: confirmedOrders.length,
    pendingPayments: pendingPayments,
    totalIncome: round2_(totalIncome),
    totalExpenses: round2_(totalExpenses),
    netProfit: round2_(totalIncome - totalExpenses),
    businessCount: businesses.filter(function (b) { return toBool_(b.Active); }).length,
    productCount: products.filter(function (p) { return toBool_(p.Active); }).length,
    salesByDay: days,
    businessBreakdown: businessBreakdown,
    topProducts: topProducts,
    lowStock: lowStock
  };
}

// --- Orders ------------------------------------------------------------
function adminGetOrders(token, filters) {
  requireAdmin_(token);
  filters = filters || {};
  var orders = sheetToObjects_('Orders');
  if (filters.paymentStatus) orders = orders.filter(function (o) { return String(o.PaymentStatus) === filters.paymentStatus; });
  if (filters.orderStatus) orders = orders.filter(function (o) { return String(o.OrderStatus) === filters.orderStatus; });
  if (filters.search) {
    var q = String(filters.search).toLowerCase();
    orders = orders.filter(function (o) {
      return String(o.OrderID).toLowerCase().indexOf(q) !== -1 ||
        String(o.CustomerName).toLowerCase().indexOf(q) !== -1 ||
        String(o.Phone).toLowerCase().indexOf(q) !== -1;
    });
  }
  orders.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
  return attachItemsToOrders_(orders);
}

function adminConfirmPayment(token, orderId, confirmed) {
  requireAdmin_(token);
  var status = confirmed ? 'Confirmed' : 'Rejected';
  updateRowById_('Orders', 'OrderID', orderId, { PaymentStatus: status, UpdatedAt: new Date() });
  return { success: true };
}

function adminUpdateOrderStatus(token, orderId, orderStatus) {
  requireAdmin_(token);
  updateRowById_('Orders', 'OrderID', orderId, { OrderStatus: orderStatus, UpdatedAt: new Date() });
  return { success: true };
}

function adminExportOrdersCsv(token) {
  requireAdmin_(token);
  var orders = attachItemsToOrders_(sheetToObjects_('Orders'));
  var header = ['OrderID', 'Date', 'Customer', 'Phone', 'Items', 'Recipients', 'Total', 'PaymentMethod', 'PayerNumber', 'TransactionID', 'PaymentStatus', 'OrderStatus'];
  var lines = [header.join(',')];
  orders.forEach(function (o) {
    var itemsText = o.items.map(function (i) { return i.qty + 'x ' + i.productName; }).join(' | ');
    var recipients = o.items.map(function (i) { return i.recipient; }).filter(Boolean).join(' | ');
    var row = [o.orderId, o.createdAt, o.customerName, o.phone, itemsText, recipients, o.total, o.paymentMethod, o.payerNumber, o.transactionId, o.paymentStatus, o.orderStatus]
      .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; });
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

// --- Businesses ----------------------------------------------------------
function adminGetBusinesses(token) {
  requireAdmin_(token);
  return sheetToObjects_('Businesses')
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) {
      return {
        BusinessID: String(b.BusinessID), Name: String(b.Name || ''), Description: String(b.Description || ''),
        LogoURL: String(b.LogoURL || ''), WhatsAppNumber: String(b.WhatsAppNumber || ''),
        Active: toBool_(b.Active), SortOrder: toNum_(b.SortOrder, 1), CreatedAt: isoDate_(b.CreatedAt)
      };
    });
}

function adminSaveBusiness(token, biz) {
  requireAdmin_(token);
  if (!biz.Name) return { success: false, message: 'Business name is required.' };
  var data = {
    Name: biz.Name, Description: biz.Description || '', LogoURL: biz.LogoURL || '',
    WhatsAppNumber: biz.WhatsAppNumber || '', Active: !!biz.Active, SortOrder: toNum_(biz.SortOrder, 1)
  };
  if (biz.BusinessID) {
    updateRowById_('Businesses', 'BusinessID', biz.BusinessID, data);
    return { success: true, id: biz.BusinessID };
  }
  var id = genId_('BIZ');
  data.BusinessID = id;
  data.CreatedAt = new Date();
  appendRowObject_('Businesses', data);
  return { success: true, id: id };
}

function adminDeleteBusiness(token, businessId) {
  requireAdmin_(token);
  deleteRowById_('Businesses', 'BusinessID', businessId);
  return { success: true };
}

// --- Products --------------------------------------------------------------
function adminGetProducts(token) {
  requireAdmin_(token);
  return sheetToObjects_('Products').map(function (p) {
    return {
      ProductID: String(p.ProductID), BusinessID: String(p.BusinessID || ''), ImageURL: String(p.ImageURL || ''),
      Name: String(p.Name || ''), Description: String(p.Description || ''), Category: String(p.Category || ''),
      Price: toNum_(p.Price), Stock: (p.Stock === '' || p.Stock === null || p.Stock === undefined) ? '' : toNum_(p.Stock),
      IsService: toBool_(p.IsService), EnquireOnWhatsApp: toBool_(p.EnquireOnWhatsApp),
      ShowWhatsApp: toBool_(p.ShowWhatsApp), Active: toBool_(p.Active),
      RequiresRecipient: toBool_(p.RequiresRecipient), RecipientLabel: String(p.RecipientLabel || ''),
      ConfirmationNote: String(p.ConfirmationNote || ''), InStock: toBoolDefaultTrue_(p.InStock),
      CreatedAt: isoDate_(p.CreatedAt)
    };
  });
}

function adminSaveProduct(token, p) {
  requireAdmin_(token);
  if (!p.Name || !p.BusinessID) return { success: false, message: 'Product name and business are required.' };
  var data = {
    BusinessID: p.BusinessID, ImageURL: p.ImageURL || '', Name: p.Name, Description: p.Description || '',
    Category: p.Category || 'General', Price: toNum_(p.Price, 0),
    Stock: (p.Stock === '' || p.Stock === null || p.Stock === undefined) ? '' : toNum_(p.Stock, 0),
    IsService: !!p.IsService, EnquireOnWhatsApp: !!p.EnquireOnWhatsApp, ShowWhatsApp: !!p.ShowWhatsApp,
    Active: p.Active !== false,
    RequiresRecipient: !!p.RequiresRecipient, RecipientLabel: p.RecipientLabel || '',
    ConfirmationNote: p.ConfirmationNote || '', InStock: p.InStock !== false
  };
  if (p.ProductID) {
    updateRowById_('Products', 'ProductID', p.ProductID, data);
    return { success: true, id: p.ProductID };
  }
  var id = genId_('PRD');
  data.ProductID = id;
  data.CreatedAt = new Date();
  appendRowObject_('Products', data);
  return { success: true, id: id };
}

// Quick in-stock / out-of-stock switch used by the toggle in the products table.
function adminSetProductStock(token, productId, inStock) {
  requireAdmin_(token);
  updateRowById_('Products', 'ProductID', productId, { InStock: !!inStock });
  return { success: true };
}

function adminDeleteProduct(token, productId) {
  requireAdmin_(token);
  deleteRowById_('Products', 'ProductID', productId);
  return { success: true };
}

// --- Banners ---------------------------------------------------------------
function adminGetBanners(token) {
  requireAdmin_(token);
  return sheetToObjects_('Banners')
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) {
      return {
        BannerID: String(b.BannerID), ImageURL: String(b.ImageURL || ''), Title: String(b.Title || ''),
        LinkURL: String(b.LinkURL || ''), Active: toBool_(b.Active), SortOrder: toNum_(b.SortOrder, 1),
        MediaType: String(b.MediaType || 'image').toLowerCase()
      };
    });
}

function adminSaveBanner(token, b) {
  requireAdmin_(token);
  if (!b.ImageURL) return { success: false, message: 'Banner image is required.' };
  var data = {
    ImageURL: b.ImageURL, Title: b.Title || '', LinkURL: b.LinkURL || '',
    Active: !!b.Active, SortOrder: toNum_(b.SortOrder, 1),
    MediaType: String(b.MediaType || 'image').toLowerCase()
  };
  if (b.BannerID) {
    updateRowById_('Banners', 'BannerID', b.BannerID, data);
    return { success: true, id: b.BannerID };
  }
  var id = genId_('BAN');
  data.BannerID = id;
  appendRowObject_('Banners', data);
  return { success: true, id: id };
}

function adminDeleteBanner(token, bannerId) {
  requireAdmin_(token);
  deleteRowById_('Banners', 'BannerID', bannerId);
  return { success: true };
}

// --- Payment Methods -------------------------------------------------------
function adminGetPaymentMethods(token) {
  requireAdmin_(token);
  return sheetToObjects_('PaymentMethods')
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (p) {
      return {
        PaymentMethodID: String(p.PaymentMethodID), Type: String(p.Type || ''), Label: String(p.Label || ''),
        AccountName: String(p.AccountName || ''), AccountNumber: String(p.AccountNumber || ''),
        Provider: String(p.Provider || ''), Instructions: String(p.Instructions || ''),
        Active: toBool_(p.Active), SortOrder: toNum_(p.SortOrder, 1)
      };
    });
}

function adminSavePaymentMethod(token, pm) {
  requireAdmin_(token);
  if (!pm.Label || !pm.AccountNumber) return { success: false, message: 'Label and account number are required.' };
  var data = {
    Type: pm.Type || 'Mobile Money', Label: pm.Label, AccountName: pm.AccountName || '', AccountNumber: pm.AccountNumber,
    Provider: pm.Provider || '', Instructions: pm.Instructions || '', Active: !!pm.Active, SortOrder: toNum_(pm.SortOrder, 1)
  };
  if (pm.PaymentMethodID) {
    updateRowById_('PaymentMethods', 'PaymentMethodID', pm.PaymentMethodID, data);
    return { success: true, id: pm.PaymentMethodID };
  }
  var id = genId_('PM');
  data.PaymentMethodID = id;
  appendRowObject_('PaymentMethods', data);
  return { success: true, id: id };
}

function adminDeletePaymentMethod(token, id) {
  requireAdmin_(token);
  deleteRowById_('PaymentMethods', 'PaymentMethodID', id);
  return { success: true };
}

// --- Discounts -------------------------------------------------------------
function adminGetDiscounts(token) {
  requireAdmin_(token);
  return sheetToObjects_('Discounts').map(function (d) {
    return {
      DiscountID: String(d.DiscountID), Label: String(d.Label || ''), Scope: String(d.Scope || 'global'),
      TargetID: String(d.TargetID || ''), Type: String(d.Type || 'percent'), Value: toNum_(d.Value),
      StartDate: d.StartDate ? isoDate_(d.StartDate).slice(0, 10) : '',
      EndDate: d.EndDate ? isoDate_(d.EndDate).slice(0, 10) : '',
      Active: toBool_(d.Active)
    };
  });
}

function adminSaveDiscount(token, d) {
  requireAdmin_(token);
  if (!d.Scope || !d.Type || d.Value === undefined || d.Value === '') return { success: false, message: 'Scope, type and value are required.' };
  var data = {
    Label: d.Label || '', Scope: d.Scope, TargetID: d.TargetID || '', Type: d.Type, Value: toNum_(d.Value, 0),
    StartDate: d.StartDate || '', EndDate: d.EndDate || '', Active: !!d.Active
  };
  if (d.DiscountID) {
    updateRowById_('Discounts', 'DiscountID', d.DiscountID, data);
    return { success: true, id: d.DiscountID };
  }
  var id = genId_('DSC');
  data.DiscountID = id;
  appendRowObject_('Discounts', data);
  return { success: true, id: id };
}

function adminDeleteDiscount(token, id) {
  requireAdmin_(token);
  deleteRowById_('Discounts', 'DiscountID', id);
  return { success: true };
}

// --- Expenses --------------------------------------------------------------
function adminGetExpenses(token) {
  requireAdmin_(token);
  return sheetToObjects_('Expenses')
    .sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); })
    .map(function (e) {
      return {
        ExpenseID: String(e.ExpenseID), Date: isoDate_(e.Date), BusinessID: String(e.BusinessID || ''),
        Category: String(e.Category || ''), Description: String(e.Description || ''),
        Amount: toNum_(e.Amount), AddedBy: String(e.AddedBy || '')
      };
    });
}

function adminAddExpense(token, e) {
  var admin = requireAdmin_(token);
  if (!e.Amount || !e.Category) return { success: false, message: 'Amount and category are required.' };
  var id = genId_('EXP');
  appendRowObject_('Expenses', {
    ExpenseID: id, Date: e.Date || new Date(), BusinessID: e.BusinessID || '', Category: e.Category,
    Description: e.Description || '', Amount: toNum_(e.Amount, 0), AddedBy: admin.name, CreatedAt: new Date()
  });
  return { success: true, id: id };
}

function adminDeleteExpense(token, id) {
  requireAdmin_(token);
  deleteRowById_('Expenses', 'ExpenseID', id);
  return { success: true };
}

// --- Customers (read-only view) --------------------------------------------
function adminGetCustomers(token) {
  requireAdmin_(token);
  return sheetToObjects_('Customers').map(function (c) {
    return {
      id: String(c.CustomerID), name: String(c.Name || ''), address: String(c.Address || ''),
      phone: String(c.Phone || ''), username: String(c.Username || ''), createdAt: isoDate_(c.CreatedAt)
    };
  });
}

// --- Settings --------------------------------------------------------------
function adminGetSettings(token) {
  requireAdmin_(token);
  return getPublicSettings_();
}

function adminSaveSettings(token, settingsObj) {
  requireAdmin_(token);
  applySettings_(settingsObj);
  return { success: true };
}

// --- Image upload (Drive-backed) -------------------------------------------
function adminUploadImage(token, base64Data, filename, mimeType) {
  requireAdmin_(token);
  try {
    var folder = getOrCreateUploadFolder_();
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType || 'image/png', filename || ('upload-' + Date.now()));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    // lh3 serves the image bytes directly; the older /uc?export=view endpoint
    // now redirects to an HTML page that won't render inside an <img> tag.
    return { success: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId() };
  } catch (err) {
    var msg = String(err && err.message ? err.message : err);
    if (msg.indexOf('permission') !== -1 || msg.indexOf('Drive') !== -1 || msg.indexOf('authoriz') !== -1) {
      return {
        success: false,
        needsAuth: true,
        message: 'This deployment has not been granted Google Drive access yet, which is needed to store uploaded images. ' +
          'Open the Apps Script editor, run the function "authorizeDrive" once and accept the permission prompt, ' +
          'then redeploy (Deploy > Manage deployments > Edit > New version). ' +
          'You can paste an image URL into the field instead in the meantime.'
      };
    }
    return { success: false, message: 'Upload failed: ' + msg };
  }
}

// Run this once from the Apps Script editor to trigger the Drive consent
// prompt. Uploading images needs Drive access, and Apps Script only asks for
// scopes when a function that uses them actually runs.
function authorizeDrive() {
  var folder = getOrCreateUploadFolder_();
  return 'Drive authorized. Uploads will be stored in: ' + folder.getName();
}

function getOrCreateUploadFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty('UPLOAD_FOLDER_ID');
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (err) { /* fall through and recreate */ }
  }
  var folders = DriveApp.getFoldersByName('MultiBiz Store Uploads');
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('MultiBiz Store Uploads');
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
  return folder;
}

// ============================================================================
// SMS — pluggable providers (Arkesel, Hubtel, or any custom HTTP endpoint)
//
// Credentials never go in the spreadsheet: the SmsProviders sheet holds only
// non-secret config, while API keys/secrets live in Script Properties under
// SMS_KEY_<ProviderID> / SMS_SECRET_<ProviderID>.
// ============================================================================
function smsSecretKey_(providerId) { return 'SMS_KEY_' + providerId; }
function smsSecretSecret_(providerId) { return 'SMS_SECRET_' + providerId; }

function getSmsCreds_(providerId) {
  var props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty(smsSecretKey_(providerId)) || '',
    apiSecret: props.getProperty(smsSecretSecret_(providerId)) || ''
  };
}

function activeSmsProvider_() {
  var list = sheetToObjects_('SmsProviders').filter(function (p) { return toBool_(p.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); });
  return list[0] || null;
}

// Ghana numbers are stored locally (0XXXXXXXXX) but every gateway wants
// international format.
function toInternational_(phone, countryCode) {
  var digits = String(phone || '').replace(/\D/g, '');
  var cc = String(countryCode || '233').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.indexOf(cc) === 0 && digits.length > 9) return digits;
  if (digits.charAt(0) === '0') return cc + digits.slice(1);
  return digits;
}

function sendOneSms_(provider, creds, phone, message) {
  var to = toInternational_(phone, getSettingValue_('SmsCountryCode', '233'));
  if (!to) return { ok: false, response: 'Invalid phone number' };

  var type = String(provider.Type || '').toLowerCase();
  var options, url, res, body;

  try {
    if (type === 'arkesel') {
      url = (provider.BaseURL || 'https://sms.arkesel.com/api/v2/sms/send');
      options = {
        method: 'post', contentType: 'application/json',
        headers: { 'api-key': creds.apiKey },
        payload: JSON.stringify({ sender: provider.SenderID || 'Store', message: message, recipients: [to] }),
        muteHttpExceptions: true
      };
    } else if (type === 'hubtel') {
      url = (provider.BaseURL || 'https://smsc.hubtel.com/v1/messages/send') +
        '?clientid=' + encodeURIComponent(creds.apiKey) +
        '&clientsecret=' + encodeURIComponent(creds.apiSecret) +
        '&from=' + encodeURIComponent(provider.SenderID || 'Store') +
        '&to=' + encodeURIComponent(to) +
        '&content=' + encodeURIComponent(message);
      options = { method: 'get', muteHttpExceptions: true };
    } else {
      // Custom: BaseURL is a template. Supported placeholders:
      // {to} {message} {sender} {apikey} {apisecret}
      var template = String(provider.BaseURL || '');
      if (!template) return { ok: false, response: 'No endpoint configured for this provider' };
      var filled = template
        .replace(/\{to\}/g, encodeURIComponent(to))
        .replace(/\{message\}/g, encodeURIComponent(message))
        .replace(/\{sender\}/g, encodeURIComponent(provider.SenderID || ''))
        .replace(/\{apikey\}/g, encodeURIComponent(creds.apiKey))
        .replace(/\{apisecret\}/g, encodeURIComponent(creds.apiSecret));

      var extra = {};
      try { extra = provider.ExtraConfig ? JSON.parse(provider.ExtraConfig) : {}; } catch (e) { extra = {}; }
      var method = String(extra.method || 'get').toLowerCase();
      options = { method: method, muteHttpExceptions: true };
      if (extra.headers) options.headers = extra.headers;
      if (method === 'post') {
        options.contentType = extra.contentType || 'application/json';
        var payload = String(extra.payload || '{"to":"{to}","message":"{message}"}')
          .replace(/\{to\}/g, to)
          .replace(/\{message\}/g, String(message).replace(/"/g, '\\"'))
          .replace(/\{sender\}/g, provider.SenderID || '')
          .replace(/\{apikey\}/g, creds.apiKey)
          .replace(/\{apisecret\}/g, creds.apiSecret);
        options.payload = payload;
      }
      url = filled;
    }

    res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    body = res.getContentText();
    // Gateways signal failure in the body as often as in the status code.
    var looksFailed = /"?(status)"?\s*[:=]\s*"?(failed|error)/i.test(body);
    return { ok: code >= 200 && code < 300 && !looksFailed, response: (body || '').slice(0, 400) };
  } catch (err) {
    return { ok: false, response: String(err && err.message ? err.message : err) };
  }
}

function logSms_(phone, message, provider, result, campaign, sentBy) {
  appendRowObject_('SmsLog', {
    SmsID: genId_('SMS'), CreatedAt: new Date(), Phone: phone, Message: message,
    ProviderID: provider ? provider.ProviderID : '', ProviderName: provider ? provider.Name : '',
    Status: result.ok ? 'Sent' : 'Failed', Response: result.response, Campaign: campaign || '', SentBy: sentBy || 'system'
  });
}

// Used both by the admin SMS console and by automatic order notifications.
function sendSmsBatch_(recipients, message, campaign, sentBy) {
  var provider = activeSmsProvider_();
  if (!provider) return { success: false, message: 'No active SMS provider configured. Add one under Admin -> SMS.' };
  var creds = getSmsCreds_(provider.ProviderID);
  if (!creds.apiKey) return { success: false, message: 'No API key saved for "' + provider.Name + '". Open Admin -> SMS and save your key.' };

  var sent = 0, failed = 0, errors = [];
  recipients.forEach(function (phone) {
    if (!phone) return;
    var result = sendOneSms_(provider, creds, phone, message);
    logSms_(phone, message, provider, result, campaign, sentBy);
    if (result.ok) sent++;
    else { failed++; if (errors.length < 3) errors.push(phone + ': ' + result.response); }
  });
  return { success: true, sent: sent, failed: failed, errors: errors };
}

function adminSendSms(token, payload) {
  var admin = requireAdmin_(token);
  payload = payload || {};
  var message = String(payload.message || '').trim();
  if (!message) return { success: false, message: 'Please write a message.' };

  var recipients = resolveSmsRecipients_(payload);
  if (!recipients.length) return { success: false, message: 'No recipients matched your selection.' };

  var res = sendSmsBatch_(recipients, message, payload.campaign || 'manual', admin.name);
  if (!res.success) return res;
  return { success: true, sent: res.sent, failed: res.failed, total: recipients.length, errors: res.errors };
}

function resolveSmsRecipients_(payload) {
  var audience = String(payload.audience || 'manual');
  var numbers = [];

  if (audience === 'manual') {
    numbers = String(payload.numbers || '').split(/[\s,;\n]+/).filter(Boolean);
  } else if (audience === 'customers') {
    numbers = sheetToObjects_('Customers').map(function (c) { return String(c.Phone || ''); });
  } else if (audience === 'buyers') {
    numbers = sheetToObjects_('Orders').map(function (o) { return String(o.Phone || ''); });
  } else if (audience === 'confirmed') {
    numbers = sheetToObjects_('Orders').filter(function (o) { return o.PaymentStatus === 'Confirmed'; })
      .map(function (o) { return String(o.Phone || ''); });
  } else if (audience === 'order') {
    var order = sheetToObjects_('Orders').filter(function (o) { return String(o.OrderID) === String(payload.orderId); })[0];
    numbers = order ? [String(order.Phone || '')] : [];
  }

  // One person shouldn't get the same promo twice because they ordered twice.
  var seen = {}, unique = [];
  numbers.forEach(function (n) {
    var key = String(n).replace(/\D/g, '');
    if (!key || seen[key]) return;
    seen[key] = true;
    unique.push(n);
  });
  return unique;
}

function adminGetSmsProviders(token) {
  requireAdmin_(token);
  return sheetToObjects_('SmsProviders').map(function (p) {
    var creds = getSmsCreds_(p.ProviderID);
    return {
      ProviderID: String(p.ProviderID), Name: String(p.Name || ''), Type: String(p.Type || ''),
      SenderID: String(p.SenderID || ''), BaseURL: String(p.BaseURL || ''),
      ExtraConfig: String(p.ExtraConfig || ''), Active: toBool_(p.Active), SortOrder: toNum_(p.SortOrder, 1),
      // Never send the key back to the browser — just say whether one is set.
      hasApiKey: !!creds.apiKey, hasApiSecret: !!creds.apiSecret
    };
  }).sort(function (a, b) { return a.SortOrder - b.SortOrder; });
}

function adminSaveSmsProvider(token, p) {
  requireAdmin_(token);
  if (!p.Name || !p.Type) return { success: false, message: 'Provider name and type are required.' };
  var data = {
    Name: p.Name, Type: String(p.Type).toLowerCase(), SenderID: p.SenderID || '',
    BaseURL: p.BaseURL || '', ExtraConfig: p.ExtraConfig || '',
    Active: !!p.Active, SortOrder: toNum_(p.SortOrder, 1)
  };
  var id = p.ProviderID;
  if (id) {
    updateRowById_('SmsProviders', 'ProviderID', id, data);
  } else {
    id = genId_('SMSP');
    data.ProviderID = id;
    data.CreatedAt = new Date();
    appendRowObject_('SmsProviders', data);
  }

  // Blank means "leave the stored key alone", so editing a provider doesn't
  // wipe credentials the admin didn't retype.
  var props = PropertiesService.getScriptProperties();
  if (p.ApiKey) props.setProperty(smsSecretKey_(id), String(p.ApiKey));
  if (p.ApiSecret) props.setProperty(smsSecretSecret_(id), String(p.ApiSecret));
  return { success: true, id: id };
}

function adminDeleteSmsProvider(token, providerId) {
  requireAdmin_(token);
  deleteRowById_('SmsProviders', 'ProviderID', providerId);
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty(smsSecretKey_(providerId));
  props.deleteProperty(smsSecretSecret_(providerId));
  return { success: true };
}

// Balance lookup differs per gateway and is best-effort: a provider that
// doesn't expose one shouldn't look like an error.
function adminGetSmsBalance(token) {
  requireAdmin_(token);
  var provider = activeSmsProvider_();
  if (!provider) return { available: false, message: 'No active SMS provider.' };
  var creds = getSmsCreds_(provider.ProviderID);
  if (!creds.apiKey) return { available: false, message: 'No API key saved for ' + provider.Name + '.' };

  var type = String(provider.Type || '').toLowerCase();
  try {
    if (type === 'arkesel') {
      var res = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/clients/balance-details',
        { method: 'get', headers: { 'api-key': creds.apiKey }, muteHttpExceptions: true });
      var json = JSON.parse(res.getContentText());
      var d = json.data || {};
      return { available: true, provider: provider.Name, balance: d.sms_balance || d.balance || d.main_balance || '—', raw: String(res.getContentText()).slice(0, 200) };
    }
    if (type === 'hubtel') {
      var hres = UrlFetchApp.fetch('https://smsc.hubtel.com/v1/account/balance',
        { method: 'get', headers: { Authorization: 'Basic ' + Utilities.base64Encode(creds.apiKey + ':' + creds.apiSecret) }, muteHttpExceptions: true });
      var hjson = JSON.parse(hres.getContentText());
      return { available: true, provider: provider.Name, balance: (hjson.data && (hjson.data.balance || hjson.data.Balance)) || '—', raw: String(hres.getContentText()).slice(0, 200) };
    }
    return { available: false, provider: provider.Name, message: 'Balance lookup is not supported for custom providers.' };
  } catch (err) {
    return { available: false, provider: provider.Name, message: 'Could not read balance: ' + err.message };
  }
}

function adminGetSmsStats(token) {
  requireAdmin_(token);
  var log = sheetToObjects_('SmsLog');
  var sent = 0, failed = 0;
  log.forEach(function (r) { if (String(r.Status) === 'Sent') sent++; else failed++; });
  return { sent: sent, failed: failed, total: log.length };
}

function adminGetSmsLog(token, limit) {
  requireAdmin_(token);
  var log = sheetToObjects_('SmsLog').sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
  return log.slice(0, limit || 200).map(function (r) {
    return {
      id: String(r.SmsID), createdAt: isoDate_(r.CreatedAt), phone: String(r.Phone || ''),
      message: String(r.Message || ''), provider: String(r.ProviderName || ''),
      status: String(r.Status || ''), response: String(r.Response || ''),
      campaign: String(r.Campaign || ''), sentBy: String(r.SentBy || '')
    };
  });
}

// ============================================================================
// EMAIL — branded HTML built from the store's own colors, logo and details
// ============================================================================
function buildEmailHtml_(title, bodyHtml, opts) {
  opts = opts || {};
  var s = getPublicSettings_();
  var primary = s.PrimaryColor || '#2563eb';
  var siteName = s.SiteName || 'Our Store';
  var logo = s.SiteLogoURL || '';

  var contactBits = [];
  if (s.ContactPhone) contactBits.push(escapeHtml_(s.ContactPhone));
  if (s.ContactEmail) contactBits.push(escapeHtml_(s.ContactEmail));
  if (s.ContactAddress) contactBits.push(escapeHtml_(s.ContactAddress));

  var socials = [];
  [['FacebookURL', 'Facebook'], ['InstagramURL', 'Instagram'], ['TwitterURL', 'X'], ['TikTokURL', 'TikTok'], ['YouTubeURL', 'YouTube']]
    .forEach(function (pair) {
      if (s[pair[0]]) socials.push('<a href="' + escapeHtml_(s[pair[0]]) + '" style="color:' + primary + ';text-decoration:none;margin:0 6px">' + pair[1] + '</a>');
    });

  return '' +
  '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">' +
      '<tr><td align="center">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">' +
          '<tr><td style="background:' + primary + ';padding:24px;text-align:center;">' +
            (logo ? '<img src="' + escapeHtml_(logo) + '" alt="' + escapeHtml_(siteName) + '" style="max-height:56px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;">' : '') +
            '<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">' + escapeHtml_(siteName) + '</h1>' +
            (title ? '<p style="margin:6px 0 0;color:rgba(255,255,255,.9);font-size:15px;">' + escapeHtml_(title) + '</p>' : '') +
          '</td></tr>' +
          '<tr><td style="padding:28px 24px;color:#0f172a;font-size:15px;line-height:1.6;">' + bodyHtml + '</td></tr>' +
          '<tr><td style="background:#f8fafc;padding:20px 24px;text-align:center;color:#64748b;font-size:12px;line-height:1.6;border-top:1px solid #e2e8f0;">' +
            (contactBits.length ? '<p style="margin:0 0 6px;">' + contactBits.join(' &nbsp;•&nbsp; ') + '</p>' : '') +
            (socials.length ? '<p style="margin:0 0 6px;">' + socials.join('') + '</p>' : '') +
            '<p style="margin:0;">&copy; ' + new Date().getFullYear() + ' ' + escapeHtml_(siteName) + '. All rights reserved.</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</body></html>';
}

function escapeHtml_(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function sendEmail_(to, subject, bodyHtml, title, campaign, sentBy) {
  to = String(to || '').trim();
  if (!to || to.indexOf('@') === -1) return { ok: false, response: 'Invalid email address' };
  try {
    var siteName = getSettingValue_('SiteName', 'Our Store');
    MailApp.sendEmail({
      to: to, subject: subject, name: siteName,
      htmlBody: buildEmailHtml_(title, bodyHtml),
      body: String(bodyHtml).replace(/<[^>]+>/g, ' ') // plain-text fallback
    });
    appendRowObject_('EmailLog', {
      EmailID: genId_('EML'), CreatedAt: new Date(), ToEmail: to, Subject: subject,
      Status: 'Sent', Response: '', Campaign: campaign || '', SentBy: sentBy || 'system'
    });
    return { ok: true, response: '' };
  } catch (err) {
    var msg = String(err && err.message ? err.message : err);
    appendRowObject_('EmailLog', {
      EmailID: genId_('EML'), CreatedAt: new Date(), ToEmail: to, Subject: subject,
      Status: 'Failed', Response: msg, Campaign: campaign || '', SentBy: sentBy || 'system'
    });
    return { ok: false, response: msg };
  }
}

function orderConfirmationHtml_(order, items) {
  var s = getPublicSettings_();
  var sym = s.CurrencySymbol || 'GHS ';
  var rows = items.map(function (i) {
    return '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0;">' + escapeHtml_(i.ProductName) +
        (i.RecipientNumber ? '<br><span style="color:#64748b;font-size:12px;">For: ' + escapeHtml_(i.RecipientNumber) + '</span>' : '') +
      '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">' + i.Qty + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">' + sym + Number(i.Subtotal).toFixed(2) + '</td>' +
    '</tr>';
  }).join('');

  return '<p>Hi ' + escapeHtml_(order.CustomerName) + ',</p>' +
    '<p>Thank you for your order! We have received it and are verifying your payment.</p>' +
    '<p style="background:#f1f5f9;padding:12px;border-radius:8px;"><strong>Order ID:</strong> ' + escapeHtml_(order.OrderID) + '<br>' +
    '<strong>Payment status:</strong> ' + escapeHtml_(order.PaymentStatus) + '</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">' +
      '<tr style="background:#f8fafc;"><th align="left" style="padding:8px;">Item</th><th style="padding:8px;">Qty</th><th align="right" style="padding:8px;">Amount</th></tr>' +
      rows +
      '<tr><td colspan="2" style="padding:10px;text-align:right;font-weight:700;">Total</td>' +
      '<td style="padding:10px;text-align:right;font-weight:700;">' + sym + Number(order.Total).toFixed(2) + '</td></tr>' +
    '</table>' +
    '<p>You can track your order any time using your Order ID and phone number.</p>' +
    '<p>We appreciate your business!</p>';
}

// Fired after checkout. Wrapped so a mail/SMS problem can never fail an order
// that has already been recorded.
function notifyOrderPlaced_(orderId) {
  try {
    var order = sheetToObjects_('Orders').filter(function (o) { return String(o.OrderID) === String(orderId); })[0];
    if (!order) return;
    var items = sheetToObjects_('OrderItems').filter(function (i) { return String(i.OrderID) === String(orderId); });
    var s = getPublicSettings_();

    if (String(s.OrderEmailEnabled).toUpperCase() !== 'FALSE' && order.CustomerEmail) {
      sendEmail_(order.CustomerEmail, 'Order ' + order.OrderID + ' received',
        orderConfirmationHtml_(order, items), 'Order Confirmation', 'order-confirmation', 'system');
    }
    if (String(s.OrderSmsEnabled).toUpperCase() === 'TRUE' && order.Phone) {
      var sym = s.CurrencySymbol || 'GHS ';
      var msg = (s.SiteName || 'Store') + ': Thank you ' + order.CustomerName + '! Order ' + order.OrderID +
        ' for ' + sym + Number(order.Total).toFixed(2) + ' received. We are verifying your payment.';
      sendSmsBatch_([order.Phone], msg, 'order-confirmation', 'system');
    }
  } catch (err) {
    Logger.log('notifyOrderPlaced_ failed: ' + err);
  }
}

function adminSendEmail(token, payload) {
  var admin = requireAdmin_(token);
  payload = payload || {};
  var subject = String(payload.subject || '').trim();
  var body = String(payload.body || '').trim();
  if (!subject || !body) return { success: false, message: 'Subject and message are required.' };

  var recipients = resolveEmailRecipients_(payload);
  if (!recipients.length) return { success: false, message: 'No email addresses matched your selection.' };

  var quota = MailApp.getRemainingDailyQuota();
  if (recipients.length > quota) {
    return { success: false, message: 'You can only send ' + quota + ' more emails today (Gmail daily limit). Reduce your audience and try again.' };
  }

  var bodyHtml = '<p>' + escapeHtml_(body).replace(/\n/g, '<br>') + '</p>';
  var sent = 0, failed = 0;
  recipients.forEach(function (email) {
    var res = sendEmail_(email, subject, bodyHtml, payload.title || '', payload.campaign || 'manual', admin.name);
    if (res.ok) sent++; else failed++;
  });
  return { success: true, sent: sent, failed: failed, total: recipients.length };
}

function resolveEmailRecipients_(payload) {
  var audience = String(payload.audience || 'manual');
  var emails = [];
  if (audience === 'manual') {
    emails = String(payload.emails || '').split(/[\s,;\n]+/).filter(Boolean);
  } else if (audience === 'customers') {
    emails = sheetToObjects_('Customers').map(function (c) { return String(c.Email || ''); });
  } else if (audience === 'buyers') {
    emails = sheetToObjects_('Orders').map(function (o) { return String(o.CustomerEmail || ''); });
  } else if (audience === 'confirmed') {
    emails = sheetToObjects_('Orders').filter(function (o) { return o.PaymentStatus === 'Confirmed'; })
      .map(function (o) { return String(o.CustomerEmail || ''); });
  }
  var seen = {}, unique = [];
  emails.forEach(function (e) {
    var key = String(e).trim().toLowerCase();
    if (!key || key.indexOf('@') === -1 || seen[key]) return;
    seen[key] = true;
    unique.push(key);
  });
  return unique;
}

function adminGetEmailStats(token) {
  requireAdmin_(token);
  var log = sheetToObjects_('EmailLog');
  var sent = 0, failed = 0;
  log.forEach(function (r) { if (String(r.Status) === 'Sent') sent++; else failed++; });
  var quota = 0;
  try { quota = MailApp.getRemainingDailyQuota(); } catch (err) { quota = -1; }
  return { sent: sent, failed: failed, total: log.length, remainingQuota: quota };
}

function adminGetEmailLog(token, limit) {
  requireAdmin_(token);
  return sheetToObjects_('EmailLog')
    .sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); })
    .slice(0, limit || 200)
    .map(function (r) {
      return {
        id: String(r.EmailID), createdAt: isoDate_(r.CreatedAt), to: String(r.ToEmail || ''),
        subject: String(r.Subject || ''), status: String(r.Status || ''),
        response: String(r.Response || ''), campaign: String(r.Campaign || ''), sentBy: String(r.SentBy || '')
      };
    });
}

// ============================================================================
// CUSTOMER MESSAGES — storefront contact form + admin replies
// ============================================================================
function submitCustomerMessage(payload) {
  payload = payload || {};
  var name = String(payload.name || '').trim();
  var body = String(payload.body || '').trim();
  if (!name || !body) return { success: false, message: 'Please enter your name and a message.' };
  if (!payload.phone && !payload.email) return { success: false, message: 'Please leave a phone number or email so we can reply.' };

  appendRowObject_('Messages', {
    MessageID: genId_('MSG'), CreatedAt: new Date(), Name: name,
    Phone: String(payload.phone || '').trim(), Email: String(payload.email || '').trim().toLowerCase(),
    Subject: String(payload.subject || 'General enquiry').trim(), Body: body,
    Status: 'New', Reply: '', RepliedAt: '', RepliedBy: ''
  });
  return { success: true };
}

function adminGetMessages(token) {
  requireAdmin_(token);
  return sheetToObjects_('Messages')
    .sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); })
    .map(function (m) {
      return {
        id: String(m.MessageID), createdAt: isoDate_(m.CreatedAt), name: String(m.Name || ''),
        phone: String(m.Phone || ''), email: String(m.Email || ''), subject: String(m.Subject || ''),
        body: String(m.Body || ''), status: String(m.Status || 'New'), reply: String(m.Reply || ''),
        repliedAt: isoDate_(m.RepliedAt), repliedBy: String(m.RepliedBy || '')
      };
    });
}

// Replies go out by email when we have one, otherwise by SMS.
function adminReplyToMessage(token, messageId, reply, channel) {
  var admin = requireAdmin_(token);
  reply = String(reply || '').trim();
  if (!reply) return { success: false, message: 'Please write a reply.' };

  var msg = sheetToObjects_('Messages').filter(function (m) { return String(m.MessageID) === String(messageId); })[0];
  if (!msg) return { success: false, message: 'Message not found.' };

  var delivered = false, how = '', problem = '';
  channel = channel || (msg.Email ? 'email' : 'sms');

  if (channel === 'email' && msg.Email) {
    var html = '<p>Hi ' + escapeHtml_(msg.Name) + ',</p>' +
      '<p>' + escapeHtml_(reply).replace(/\n/g, '<br>') + '</p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0;">' +
      '<p style="color:#64748b;font-size:13px;"><strong>Your message:</strong><br>' + escapeHtml_(msg.Body).replace(/\n/g, '<br>') + '</p>';
    var r = sendEmail_(msg.Email, 'Re: ' + (msg.Subject || 'Your enquiry'), html, 'Reply from our team', 'message-reply', admin.name);
    delivered = r.ok; how = 'email'; problem = r.response;
  } else if (msg.Phone) {
    var sres = sendSmsBatch_([msg.Phone], reply, 'message-reply', admin.name);
    delivered = sres.success && sres.sent > 0;
    how = 'SMS';
    problem = sres.message || (sres.errors || []).join('; ');
  } else {
    return { success: false, message: 'This message has no email or phone number to reply to.' };
  }

  updateRowById_('Messages', 'MessageID', messageId, {
    Reply: reply, Status: delivered ? 'Replied' : 'Reply failed',
    RepliedAt: new Date(), RepliedBy: admin.name
  });
  return delivered
    ? { success: true, channel: how }
    : { success: false, message: 'Saved your reply, but sending by ' + how + ' failed: ' + problem };
}

function adminUpdateMessageStatus(token, messageId, status) {
  requireAdmin_(token);
  updateRowById_('Messages', 'MessageID', messageId, { Status: status });
  return { success: true };
}

function adminDeleteMessage(token, messageId) {
  requireAdmin_(token);
  deleteRowById_('Messages', 'MessageID', messageId);
  return { success: true };
}

// ============================================================================
// GOOGLE SIGN-IN — verifies the ID token Google Identity Services returns
// ============================================================================
function verifyGoogleIdToken_(idToken) {
  var clientId = getSettingValue_('GoogleClientId', '');
  if (!clientId) return { ok: false, message: 'Google sign-in is not configured for this store.' };
  try {
    var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return { ok: false, message: 'Google could not verify that sign-in.' };
    var info = JSON.parse(res.getContentText());
    // Confirm the token was minted for THIS store, not some other app.
    if (String(info.aud) !== String(clientId)) return { ok: false, message: 'This sign-in was issued for a different application.' };
    if (String(info.email_verified) !== 'true' && info.email_verified !== true) return { ok: false, message: 'Your Google email is not verified.' };
    if (info.exp && (Number(info.exp) * 1000) < Date.now()) return { ok: false, message: 'That sign-in has expired, please try again.' };
    return { ok: true, email: String(info.email).toLowerCase(), name: String(info.name || info.email) };
  } catch (err) {
    return { ok: false, message: 'Could not verify Google sign-in: ' + err.message };
  }
}

// Signs a shopper in, creating a lightweight account on first use.
function customerGoogleLogin(idToken) {
  var v = verifyGoogleIdToken_(idToken);
  if (!v.ok) return { success: false, message: v.message };

  var existing = sheetToObjects_('Customers').filter(function (c) {
    return String(c.Email || '').toLowerCase() === v.email;
  })[0];

  if (!existing) {
    var username = v.email.split('@')[0].replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 900 + 100);
    appendRowObject_('Customers', {
      CustomerID: genId_('CUS'), Name: v.name, Address: '', Phone: '',
      Username: username, PasswordHash: '', CreatedAt: new Date(),
      Email: v.email, AuthProvider: 'google'
    });
    existing = sheetToObjects_('Customers').filter(function (c) { return String(c.Username) === username; })[0];
  }

  return {
    success: true,
    user: {
      username: String(existing.Username), name: String(existing.Name || ''),
      address: String(existing.Address || ''), phone: String(existing.Phone || ''),
      email: String(existing.Email || '')
    }
  };
}

// Admin Google sign-in is allow-list only: the email must already belong to an
// admin account, so nobody can self-provision access to the portal.
function adminGoogleLogin(idToken, remember) {
  var v = verifyGoogleIdToken_(idToken);
  if (!v.ok) return { success: false, message: v.message };

  var admin = sheetToObjects_('Admins').filter(function (a) {
    return String(a.Email || '').toLowerCase() === v.email;
  })[0];
  if (!admin) {
    return { success: false, message: 'No admin account is linked to ' + v.email + '. An existing admin must add that address under Admin Users first.' };
  }
  return { success: true, session: startAdminSession_(admin, !!remember) };
}

function adminSetAdminEmail(token, adminId, email) {
  requireAdmin_(token);
  email = String(email || '').trim().toLowerCase();
  if (email && email.indexOf('@') === -1) return { success: false, message: 'That does not look like an email address.' };
  var clash = sheetToObjects_('Admins').filter(function (a) {
    return String(a.Email || '').toLowerCase() === email && String(a.AdminID) !== String(adminId);
  })[0];
  if (email && clash) return { success: false, message: 'Another admin already uses that email.' };
  updateRowById_('Admins', 'AdminID', adminId, { Email: email });
  return { success: true };
}

// Lets the customer save a delivery address/phone captured at checkout back
// onto a Google-created account, which starts with neither.
function updateCustomerProfile(username, profile) {
  username = String(username || '').trim().toLowerCase();
  if (!username) return { success: false };
  var c = sheetToObjects_('Customers').filter(function (x) { return String(x.Username).toLowerCase() === username; })[0];
  if (!c) return { success: false };
  var patch = {};
  if (profile.name) patch.Name = String(profile.name).trim();
  if (profile.phone) patch.Phone = String(profile.phone).trim();
  if (profile.address) patch.Address = String(profile.address).trim();
  if (profile.email) patch.Email = String(profile.email).trim().toLowerCase();
  if (Object.keys(patch).length) updateRowById_('Customers', 'CustomerID', c.CustomerID, patch);
  return { success: true };
}

// Lets either page prove which deployment it is talking to.
function getBuildInfo() {
  return {
    build: BUILD_VERSION,
    indexFile: fileBuild_('index') || 'no marker',
    adminFile: fileBuild_('admin') || 'no marker',
    schema: SCHEMA_VERSION,
    setupVersion: PropertiesService.getScriptProperties().getProperty('SETUP_VERSION') || '(not run yet)',
    serverTime: new Date().toISOString()
  };
}

// Public: the admin login page needs the Client ID before any session exists.
// A Google OAuth client ID is not a secret.
function getGoogleClientId() {
  try { return getSettingValue_('GoogleClientId', '') || ''; } catch (err) { return ''; }
}
