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
var SCHEMA_VERSION = '4';

// ---------------------------------------------------------------------------
// Sheet schema — single source of truth for headers used by the generic
// object <-> row helpers below. Add a new sheet by adding an entry here;
// add a column simply by appending its header to an existing list.
// ---------------------------------------------------------------------------
var SHEETS = {
  Settings:       ['Key', 'Value'],
  Businesses:     ['BusinessID', 'Name', 'Description', 'LogoURL', 'WhatsAppNumber', 'Active', 'SortOrder', 'CreatedAt'],
  Products:       ['ProductID', 'BusinessID', 'ImageURL', 'Name', 'Description', 'Category', 'Price', 'Stock', 'IsService', 'EnquireOnWhatsApp', 'Active', 'CreatedAt', 'RequiresRecipient', 'RecipientLabel', 'ConfirmationNote', 'InStock', 'ShowWhatsApp'],
  Customers:      ['CustomerID', 'Name', 'Address', 'Phone', 'Username', 'PasswordHash', 'CreatedAt'],
  Admins:         ['AdminID', 'Username', 'PasswordHash', 'Name', 'Role', 'CreatedAt'],
  Orders:         ['OrderID', 'OrderType', 'Username', 'CustomerName', 'Phone', 'Address', 'Subtotal', 'DiscountAmount', 'Total', 'PaymentMethodID', 'PaymentMethodLabel', 'PayerNumber', 'TransactionID', 'PaymentStatus', 'OrderStatus', 'Notes', 'CreatedAt', 'UpdatedAt'],
  OrderItems:     ['OrderItemID', 'OrderID', 'ProductID', 'BusinessID', 'ProductName', 'BusinessName', 'Category', 'Qty', 'UnitPrice', 'LineDiscount', 'Subtotal', 'RecipientNumber'],
  PaymentMethods: ['PaymentMethodID', 'Type', 'Label', 'AccountName', 'AccountNumber', 'Provider', 'Instructions', 'Active', 'SortOrder'],
  Banners:        ['BannerID', 'ImageURL', 'Title', 'LinkURL', 'Active', 'SortOrder'],
  Discounts:      ['DiscountID', 'Label', 'Scope', 'TargetID', 'Type', 'Value', 'StartDate', 'EndDate', 'Active'],
  Expenses:       ['ExpenseID', 'Date', 'BusinessID', 'Category', 'Description', 'Amount', 'AddedBy', 'CreatedAt']
};

var LOW_STOCK_THRESHOLD = 5;
var ADMIN_TOKEN_TTL_SECONDS = 21600; // 6 hours (CacheService max)

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

  var siteName = 'My Multi-Business Store';
  try { siteName = getSettingValue_('SiteName', siteName); } catch (err) { /* not set up yet */ }

  return HtmlService.createTemplateFromFile(page)
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5')
    .setTitle(page === 'admin' ? ('Admin Portal - ' + siteName) : siteName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// The pages run inside a sandboxed iframe, so links between the storefront and
// the admin portal need the real deployment URL plus target="_top".
function getWebAppUrl() {
  var props = PropertiesService.getScriptProperties();
  var cached = props.getProperty('WEB_APP_URL');
  if (cached) return cached;
  try {
    var url = ScriptApp.getService().getUrl() || '';
    if (url) props.setProperty('WEB_APP_URL', url);
    return url;
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
    BundleDisclaimer: DEFAULT_BUNDLE_DISCLAIMER
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
var STOREFRONT_CACHE_KEY = 'storefront_v4';
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
    .map(function (b) { return { id: String(b.BannerID), image: String(b.ImageURL || ''), title: String(b.Title || ''), link: String(b.LinkURL || '') }; });

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
    adminUrl: getWebAppUrl()
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
      Notes: payload.notes || '', CreatedAt: now, UpdatedAt: now
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

function adminLogin(username, password) {
  username = String(username || '').trim().toLowerCase();
  var hash = hashPassword_(String(password || ''));
  var match = sheetToObjects_('Admins').filter(function (a) {
    return String(a.Username).toLowerCase() === username && a.PasswordHash === hash;
  })[0];
  if (!match) return null;

  var token = Utilities.getUuid();
  var session = { adminId: match.AdminID, username: match.Username, name: match.Name, role: match.Role };
  CacheService.getScriptCache().put('admtok_' + token, JSON.stringify(session), ADMIN_TOKEN_TTL_SECONDS);
  return { token: token, name: String(match.Name || ''), role: String(match.Role || ''), username: String(match.Username || '') };
}

function adminLogout(token) {
  if (token) CacheService.getScriptCache().remove('admtok_' + token);
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
    Name: data.name, Role: data.role || 'staff', CreatedAt: new Date()
  });
  return { success: true };
}

function adminGetAdmins(token) {
  requireAdmin_(token);
  return sheetToObjects_('Admins').map(function (a) {
    return { id: String(a.AdminID), username: String(a.Username || ''), name: String(a.Name || ''), role: String(a.Role || ''), createdAt: isoDate_(a.CreatedAt) };
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
        LinkURL: String(b.LinkURL || ''), Active: toBool_(b.Active), SortOrder: toNum_(b.SortOrder, 1)
      };
    });
}

function adminSaveBanner(token, b) {
  requireAdmin_(token);
  if (!b.ImageURL) return { success: false, message: 'Banner image is required.' };
  var data = { ImageURL: b.ImageURL, Title: b.Title || '', LinkURL: b.LinkURL || '', Active: !!b.Active, SortOrder: toNum_(b.SortOrder, 1) };
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
