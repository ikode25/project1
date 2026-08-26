/**
 * ============================================================================
 *  ADVANCE TAILOR MANAGEMENT SYSTEM (Ghana)
 *  Backend — Code.gs
 * ============================================================================
 *  A single bound Google Sheet is used as the database. Run setupSheets()
 *  once (Run > setupSheets from the Apps Script editor) before deploying,
 *  or simply open the web app once — doGet() will auto-provision the sheet
 *  if it is empty.
 *
 *  All money is in Ghana Cedis (GH₵). All dates/times are handled in the
 *  Africa/Accra timezone (GMT+0, no daylight saving).
 *
 *  Sections in this file:
 *    1. Configuration & schema
 *    2. Web app entry point (doGet)
 *    3. Uploaded-image delivery helpers
 *    4. Sheet setup / seeding
 *    5. Generic sheet data-access helpers
 *    6. Auth & session management
 *    7. Public-facing functions (website, booking, order tracking)
 *    8. Services / Staff / Shop info CRUD
 *    9. Customers / CRM / Loyalty / Measurements
 *   10. Appointments (fittings & consultations)
 *   11. Orders (bespoke garment production)
 *   12. Point of Sale (POS) / Sales
 *   13. Inventory (fabrics & accessories)
 *   14. Expenses
 *   15. Users management
 *   16. Reviews
 *   17. Settings / Theme / Branding
 *   18. Hero carousel, gallery, videos & image uploads
 *   19. Dashboard, reports & exports
 *   20. Notifications (SMS + Email)
 *   21. Trash / recovery (Customers + Orders)
 *   22. Utilities (currency, phone, dates, ids)
 * ============================================================================
 */

/* ============================================================================
 * 1. CONFIGURATION & SCHEMA
 * ==========================================================================*/

var TIMEZONE = 'Africa/Accra';
var CURRENCY_SYMBOL = 'GH₵';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 hours
var UPLOAD_FOLDER_NAME = 'AdvanceTailor_Uploads';
var SETUP_VERSION = 3;

// Column schema for every tab. Order matters — it defines the sheet column order.
var SCHEMA = {
  Branches:      ['BranchID', 'Name', 'Location', 'Phone', 'OpeningHours', 'WeeklyHours'],
  Services:      ['ServiceID', 'Name', 'Category', 'Description', 'TurnaroundDays', 'Price', 'BranchID', 'Active', 'ImageURL'],
  Staff:         ['StaffID', 'Name', 'Role', 'BranchID', 'Phone', 'Specialties', 'PhotoURL', 'Active', 'CommissionRate', 'WorkDays'],
  Customers:     ['CustomerID', 'Name', 'Phone', 'Email', 'DateJoined', 'LoyaltyPoints', 'Notes'],
  Measurements:  ['MeasurementID', 'CustomerID', 'ProfileName', 'Garment', 'Gender', 'Fields', 'DateTaken', 'TakenBy', 'Notes', 'Active'],
  Appointments:  ['AppointmentID', 'Reference', 'CustomerID', 'StaffID', 'ServiceID', 'BranchID', 'Date', 'TimeSlot', 'Type', 'Status', 'CreatedAt', 'Notes', 'PaymentMethod', 'PaymentStatus', 'PaymentProofURL'],
  Orders:        ['OrderID', 'Reference', 'CustomerID', 'StaffID', 'ServiceID', 'BranchID', 'MeasurementID', 'OrderDate', 'DueDate', 'Status', 'FabricSource', 'FabricDetails', 'Quantity', 'Price', 'DepositAmount', 'AmountPaid', 'PaymentMethod', 'PaymentStatus', 'DesignImageURL', 'Notes', 'DeliveredAt', 'CreatedAt'],
  // Reference/PaymentProofURL/Source/FulfillmentStatus are appended at the
  // end (not interleaved) so a sheet from before online shop orders existed
  // keeps reading its existing columns correctly by position.
  Sales:         ['SaleID', 'Date', 'BranchID', 'CustomerID', 'StaffID', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethod', 'PaymentStatus', 'Reference', 'PaymentProofURL', 'Source', 'FulfillmentStatus'],
  Products:      ['ProductID', 'Name', 'Category', 'Unit', 'CostPrice', 'SellingPrice', 'QuantityInStock', 'ReorderLevel', 'BranchID', 'ImageURL', 'ShowOnWebsite'],
  Expenses:      ['ExpenseID', 'Date', 'BranchID', 'Category', 'Amount', 'Description'],
  Users:         ['Username', 'PasswordHash', 'Salt', 'Role', 'BranchID', 'Active', 'StaffID', 'Email', 'Phone', 'FullName'],
  Reviews:       ['ReviewID', 'CustomerID', 'StaffID', 'Rating', 'Comment', 'Date'],
  Settings:      ['Key', 'Value'],
  HeroSlides:    ['SlideID', 'ImageURL', 'Title', 'Subtitle', 'ButtonText', 'ButtonLink', 'SortOrder', 'Active'],
  Gallery:       ['GalleryID', 'ImageURL', 'Caption', 'Category', 'BranchID', 'SortOrder', 'Active'],
  Notifications: ['NotificationID', 'Type', 'Recipient', 'Message', 'Status', 'Date'],
  BlockedSlots:  ['BlockedSlotID', 'BranchID', 'Date', 'TimeSlot'],
  Videos:        ['VideoID', 'VideoURL', 'Title', 'Caption', 'SortOrder', 'Active'],
  Visits:        ['VisitID', 'Date', 'Timestamp', 'VisitorKey'],
  StaffLeave:    ['LeaveID', 'StaffID', 'Date', 'Reason'],
  // A "cleared" Customer/Order record's entire original row, kept as JSON so
  // it can be restored exactly as it was — see section 21, TRASH.
  Trash:         ['TrashID', 'RecordType', 'RecordID', 'Data', 'DeletedAt', 'DeletedBy']
};

var ID_PREFIX = {
  Branches: 'BR', Services: 'SV', Staff: 'ST', Customers: 'CU', Measurements: 'MS',
  Appointments: 'AP', Orders: 'OR', Sales: 'SL', Products: 'PR', Expenses: 'EX',
  Reviews: 'RV', HeroSlides: 'HS', Gallery: 'GL', Notifications: 'NT', BlockedSlots: 'BL',
  Videos: 'VD', Visits: 'VS', StaffLeave: 'LV', Trash: 'TR'
};

/** Which sheets support "Clear" (soft-delete to Trash, recoverable). Also used by nextId_() to keep a cleared record's ID reserved while it sits in Trash. */
var TRASH_RECORD_TYPES = { Customers: true, Orders: true };

var ROLES = ['Owner', 'Manager', 'Staff', 'Receptionist'];

// Production stages a bespoke garment order moves through.
var ORDER_STATUSES = ['Order Received', 'Measuring', 'Cutting', 'Sewing', 'Fitting', 'Finishing', 'Ready for Pickup', 'Delivered', 'Cancelled'];
var APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'];
var APPOINTMENT_TYPES = ['Consultation', 'Measurement Session', 'Fitting', 'Delivery/Pickup'];
// Fulfillment stages for a ready-to-wear item bought straight from the public Shop (as opposed to a bespoke Order).
var SALE_FULFILLMENT_STATUSES = ['Processing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

// Common measurement fields offered per garment type, purely to speed up
// data entry in the admin UI (a quick-fill button) — the Measurements sheet
// itself stores whatever key/value pairs staff actually enter as free-form
// JSON, so this list is not a rigid schema.
var MEASUREMENT_TEMPLATES = {
  "Men's Shirt": ['Neck', 'Chest', 'Waist', 'Shoulder', 'Sleeve Length', 'Shirt Length', 'Cuff'],
  "Men's Suit / Trouser": ['Chest', 'Waist', 'Hip', 'Shoulder', 'Sleeve Length', 'Jacket Length', 'Trouser Waist', 'Trouser Length', 'Inseam', 'Thigh'],
  "Kaba & Slit / Dress": ['Bust', 'Waist', 'Hip', 'Shoulder', 'Sleeve Length', 'Armhole', 'Dress Length', 'Skirt Length'],
  "Agbada / Native Wear": ['Chest', 'Waist', 'Shoulder', 'Neck', 'Sleeve Length', 'Gown Length', 'Trouser Length'],
  "Kids Wear": ['Chest', 'Waist', 'Shoulder', 'Height', 'Sleeve Length', 'Garment Length'],
  "Custom": []
};

var DEFAULT_SETTINGS = {
  BusinessName: 'Advance Tailor',
  Tagline: 'Bespoke Fashion. Perfect Fit. Every Time.',
  LogoURL: '',
  PrimaryColor: '#16213e',
  SecondaryColor: '#c9a227',
  AccentColor: '#c9a227',
  BackgroundColor: '#f7f5f0',
  TextColor: '#1a1a1a',
  FontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  WhatsAppNumber: '233241234567',
  ContactPhone: '0241234567',
  ContactEmail: 'info@advancetailor.com.gh',
  MapEmbedURL: 'https://www.google.com/maps?q=Accra,Ghana&output=embed',
  TaxRatePercent: '0',
  LoyaltyPointsPerCedi: '1',
  LoyaltyRedeemRate: '100', // points needed for GH₵1 discount
  SmsProvider: 'simulate', // 'simulate' | 'arkesel' | 'hubtel'
  SmsApiKey: '',
  SmsSenderId: 'TAILOR',
  HubtelClientId: '',
  HubtelClientSecret: '',
  Currency: 'GH₵',
  SlotIntervalMinutes: '30',
  SocialFacebook: '',
  SocialInstagram: '',
  SocialTwitter: '',
  SocialTiktok: '',
  SocialYoutube: '',
  // Each mobile money network is a genuinely separate wallet/SIM number in
  // Ghana, so each gets its own number+name rather than sharing one field.
  MomoNumber: '',
  MomoName: '',
  VodafoneCashNumber: '',
  VodafoneCashName: '',
  TelecelCashNumber: '',
  TelecelCashName: '',
  AirtelTigoMoneyNumber: '',
  AirtelTigoMoneyName: '',
  BankName: '',
  BankAccountName: '',
  BankAccountNumber: '',
  ActivePaymentMethods: 'Cash,MTN MoMo,Vodafone Cash,Telecel Cash,AirtelTigo Money,Bank Transfer',
  // Comma-separated list of garment/service categories the Owner has defined.
  ServiceCategories: "Men's Wear,Women's Wear,Kids Wear,Traditional Wear,Uniforms,Alterations,Wedding & Occasion Wear",
  ShowGreetingBanner: 'Y',
  ShowTeamSection: 'Y',
  NotifyBookingSms: 'Y',
  NotifyBookingEmail: 'Y',
  NotifyOrderStatusSms: 'Y',
  NotifyOrderStatusEmail: 'Y',
  // Appointments module housekeeping — see clearFinishedAppointments_().
  AutoClearAppointmentsDaily: 'N',
  // A customer is auto-flagged as a "Regular" once they've had at least
  // this many completed orders/sales within the trailing window days.
  FavouriteVisitThreshold: '3',
  FavouriteWindowDays: '180',
  // Whether new measurements are entered/displayed in inches or centimeters.
  MeasurementUnit: 'inches',
  // Default deposit percentage suggested when creating a new order.
  DepositPercentDefault: '50'
};

var PAYMENT_METHODS = ['Cash', 'MTN MoMo', 'Vodafone Cash', 'Telecel Cash', 'AirtelTigo Money', 'Bank Transfer'];

/** Whether a payment method's own number/account details are actually filled in. */
function paymentMethodDetailsFilled_(settings, method) {
  if (method === 'Cash') return true;
  if (method === 'Bank Transfer') return !!settings.BankAccountNumber;
  var numberKey = { 'MTN MoMo': 'MomoNumber', 'Vodafone Cash': 'VodafoneCashNumber', 'Telecel Cash': 'TelecelCashNumber', 'AirtelTigo Money': 'AirtelTigoMoneyNumber' }[method];
  return !!(numberKey && settings[numberKey]);
}
var WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parses a WeeklyHours JSON string, falling back to every day open start-end if missing/malformed. */
function parseWeeklyHoursJson_(jsonStr, fallbackStart, fallbackEnd) {
  try {
    var parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (e) { /* fall through to the default below */ }
  var fallback = {};
  WEEKDAY_KEYS.forEach(function (d) { fallback[d] = { open: true, is24: false, start: fallbackStart || '09:00', end: fallbackEnd || '18:00' }; });
  return fallback;
}
/** Parses the shop's own WeeklyHours (the single Branches row) — the one source of truth for opening hours. */
function parseBranchWeeklyHours_(branch) {
  return parseWeeklyHoursJson_(branch && branch.WeeklyHours, '09:00', '18:00');
}

/** Converts a WeeklyHours day entry into { open, startMin, endMin } (minutes since midnight), for slot-generation math. */
function dayWindowMinutes_(dayEntry) {
  if (!dayEntry || !dayEntry.open) return { open: false, startMin: 0, endMin: 0 };
  if (dayEntry.is24) return { open: true, startMin: 0, endMin: 24 * 60 };
  var parts1 = String(dayEntry.start || '09:00').split(':');
  var parts2 = String(dayEntry.end || '18:00').split(':');
  var startMin = (parseInt(parts1[0], 10) || 0) * 60 + (parseInt(parts1[1], 10) || 0);
  var endMin = (parseInt(parts2[0], 10) || 0) * 60 + (parseInt(parts2[1], 10) || 0);
  if (endMin <= startMin) endMin = startMin;
  return { open: true, startMin: startMin, endMin: endMin };
}

/** Friendly one-line label for a single day's hours, e.g. "9:00 AM – 6:00 PM", "Open 24 hours", or "Closed". */
function formatDayHoursLabel_(dayEntry) {
  if (!dayEntry || !dayEntry.open) return 'Closed';
  if (dayEntry.is24) return 'Open 24 hours';
  return formatHourMinute12_(dayEntry.start) + ' – ' + formatHourMinute12_(dayEntry.end);
}
function formatHourMinute12_(hhmm) {
  var parts = String(hhmm || '00:00').split(':');
  var h = parseInt(parts[0], 10) || 0, m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12; if (h12 === 0) h12 = 12;
  return h12 + ':' + m + ' ' + ampm;
}

/** Whether "open now" (Africa/Accra time) plus today's/every day's hours label, given an already-parsed WeeklyHours object. */
function computeShopStatus_(weeklyHours) {
  var now = new Date();
  var weekday = Utilities.formatDate(now, TIMEZONE, 'EEE');
  var nowMin = Number(Utilities.formatDate(now, TIMEZONE, 'H')) * 60 + Number(Utilities.formatDate(now, TIMEZONE, 'm'));
  var today = weeklyHours[weekday];
  var window = dayWindowMinutes_(today);
  var open = window.open && nowMin >= window.startMin && nowMin < window.endMin;
  return {
    open: open,
    todayLabel: formatDayHoursLabel_(today),
    weekLabels: WEEKDAY_KEYS.map(function (d) { return { day: d, label: formatDayHoursLabel_(weeklyHours[d]) }; })
  };
}

/** Collapses a WeeklyHours object into a short human-readable summary, e.g. "Mon-Sat 8:00 AM – 7:00 PM, Sun Closed". */
function summarizeWeeklyHours_(weeklyHours) {
  var groups = [];
  WEEKDAY_KEYS.forEach(function (d) {
    var label = formatDayHoursLabel_(weeklyHours[d]);
    var last = groups[groups.length - 1];
    if (last && last.label === label) last.days.push(d);
    else groups.push({ label: label, days: [d] });
  });
  return groups.map(function (g) {
    var dayLabel = g.days.length > 1 ? g.days[0] + '-' + g.days[g.days.length - 1] : g.days[0];
    return dayLabel + ' ' + g.label;
  }).join(', ');
}

/* ============================================================================
 * 2. WEB APP ENTRY POINT
 * ==========================================================================*/

function doGet(e) {
  ensureSetup_();

  if (e && e.parameter && e.parameter.img) {
    return serveUploadedImage_(e.parameter.img);
  }

  var page = (e && e.parameter && e.parameter.page) || 'app';
  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.initialPage = page;
  return tpl.evaluate()
    .setTitle('Advance Tailor — Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Streams an uploaded file's bytes straight from Drive. A missing/bad file ID falls back to a blank transparent pixel instead of throwing. */
function serveUploadedImage_(fileId) {
  try {
    return DriveApp.getFileById(fileId).getBlob();
  } catch (err) {
    return Utilities.newBlob(Utilities.base64Decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='), 'image/gif', 'blank.gif');
  }
}

/** The current web app's own /exec URL. */
function getAppUrl_() {
  return ScriptApp.getService().getUrl();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ============================================================================
 * 3. UPLOADED-IMAGE DELIVERY
 *
 * An <img> tag inside this app's own HtmlService-sandboxed page fetching a
 * separate resource from the app's own script.google.com address is
 * unreliable across browsers. The fix: never ask the browser to fetch the
 * image as a separate resource. Every endpoint that hands image data to the
 * browser converts a Drive-backed image reference into a `data:` URI —
 * embedded straight into the same google.script.run response.
 * ==========================================================================*/

/** Recognizes a Drive-uploaded image reference (current same-origin `?img=` link, or an external Drive-hotlink), and pulls out the file ID. */
function extractDriveFileId_(url) {
  var s = String(url || '');
  var m = s.match(/[?&]img=([a-zA-Z0-9_-]{15,})/) ||
    s.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]{15,})/) ||
    s.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/);
  return m ? m[1] : null;
}

/** Resolves a batch of possibly-Drive-backed image references into their `data:` URI form in as few round trips as possible, using UrlFetchApp.fetchAll() concurrency plus a script cache. */
function batchResolveImageUrls_(urls) {
  var cache = CacheService.getScriptCache();
  var results = new Array(urls.length);
  var fileIdByIndex = {};
  var uncachedFileIds = [];

  urls.forEach(function (url, i) {
    var fileId = extractDriveFileId_(url);
    if (!fileId) { results[i] = url; return; }
    var cached = cache.get('img_' + fileId);
    if (cached !== null) { results[i] = cached; return; }
    fileIdByIndex[i] = fileId;
    if (uncachedFileIds.indexOf(fileId) === -1) uncachedFileIds.push(fileId);
  });

  if (uncachedFileIds.length) {
    var token = ScriptApp.getOAuthToken();
    var requests = uncachedFileIds.map(function (fileId) {
      return {
        url: 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media',
        headers: { Authorization: 'Bearer ' + token },
        muteHttpExceptions: true
      };
    });
    var responses;
    try {
      responses = UrlFetchApp.fetchAll(requests);
    } catch (err) {
      responses = [];
    }
    var dataUriByFileId = {};
    uncachedFileIds.forEach(function (fileId, i) {
      var res = responses[i];
      if (!res || res.getResponseCode() !== 200) { dataUriByFileId[fileId] = ''; return; }
      var blob = res.getBlob();
      var dataUri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      dataUriByFileId[fileId] = dataUri;
      if (dataUri.length < 100000) {
        try { cache.put('img_' + fileId, dataUri, 21600); } catch (cacheErr) { /* fine uncached */ }
      }
    });
    Object.keys(fileIdByIndex).forEach(function (i) {
      results[i] = dataUriByFileId[fileIdByIndex[i]] || '';
    });
  }

  return results;
}

/** Single-URL convenience wrapper around batchResolveImageUrls_ — for a lone field like Settings.LogoURL. */
function imageUrlToDataUri_(url) {
  return batchResolveImageUrls_([url])[0];
}

/** Converts one image field to a data: URI on every item of a list, in place, in one batched round trip. */
function withImageDataUris_(list, field) {
  var resolved = batchResolveImageUrls_(list.map(function (item) { return item[field]; }));
  list.forEach(function (item, i) { if (item[field]) item[field] = resolved[i]; });
  return list;
}

/* ============================================================================
 * 4. SHEET SETUP / SEEDING
 * ==========================================================================*/

/** Creates every tab with the correct headers if it does not already exist, and seeds sample data on first run. Safe to run multiple times. */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    var headers = SCHEMA[name];
    var range = sheet.getRange(1, 1, 1, headers.length);
    var existing = range.getValues()[0];
    var needsHeaders = headers.some(function (h, i) { return existing[i] !== h; });
    if (needsHeaders) {
      range.setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#16213e').setFontColor('#ffffff');
    }
    // Force every data cell to Plain Text format so Sheets never silently
    // "smart-formats" a phone number, TimeSlot, or ID into a number/date —
    // which would break exact-string lookups elsewhere in this file.
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 3000), headers.length).setNumberFormat('@');
  });

  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }

  getOrCreateUploadFolder_();
  seedIfEmpty_();
  repairShowOnWebsiteDefaults_();
  return 'Setup complete';
}

/**
 * One-time data repair for deployments created before the public Shop
 * existed: ShowOnWebsite is a brand-new column, so every Products row that
 * already existed reads back blank rather than 'Y' or 'N' — leaving the
 * Shop section with nothing to show even though the Owner never chose to
 * hide anything. Any row whose ShowOnWebsite cell is still genuinely empty
 * gets a sensible default (Ready-to-Wear items default to shown; raw
 * fabric/notions default to hidden) so the Shop isn't empty on the first
 * load after upgrading. Idempotent — a row already explicitly set to 'Y'
 * or 'N' (including by an Owner turning it off) is never touched again.
 */
function repairShowOnWebsiteDefaults_() {
  var sheet = ss_().getSheetByName('Products');
  if (!sheet) return;
  var col = SCHEMA.Products.indexOf('ShowOnWebsite') + 1;
  var catCol = SCHEMA.Products.indexOf('Category') + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var values = sheet.getRange(2, 1, lastRow - 1, SCHEMA.Products.length).getValues();
  var changed = false;
  values.forEach(function (row) {
    if (row[col - 1] === '' || row[col - 1] === null || row[col - 1] === undefined) {
      row[col - 1] = row[catCol - 1] === 'Ready-to-Wear' ? 'Y' : 'N';
      changed = true;
    }
  });
  if (changed) sheet.getRange(2, 1, values.length, SCHEMA.Products.length).setValues(values);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

/**
 * Self-healing check, cached for an hour so most requests take the fast
 * path (a single cheap CacheService read) instead of re-verifying every
 * sheet's headers on every request.
 */
function ensureSetup_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('setup_verified_v' + SETUP_VERSION) === '1') return;

  var props = PropertiesService.getScriptProperties();
  var storedVersion = Number(props.getProperty('setupVersion') || '0');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsByName = {};
  ss.getSheets().forEach(function (sheet) { sheetsByName[sheet.getName()] = sheet; });
  var needsHeaderSetup = Object.keys(SCHEMA).some(function (name) {
    var sheet = sheetsByName[name];
    if (!sheet) return true;
    var headers = SCHEMA[name];
    var existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    return headers.some(function (h, i) { return existing[i] !== h; });
  });
  if (needsHeaderSetup || storedVersion < SETUP_VERSION) {
    setupSheets();
    props.setProperty('setupVersion', String(SETUP_VERSION));
  }
  cache.put('setup_verified_v' + SETUP_VERSION, '1', 3600);
}

function seedIfEmpty_() {
  // Settings
  if (readAll_('Settings').length === 0) {
    Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
      appendRow_('Settings', { Key: k, Value: DEFAULT_SETTINGS[k] });
    });
  }

  // Branches — a single shop, kept as a sheet (rather than a hardcoded
  // constant) purely so every other table's BranchID foreign key and the
  // existing generic CRUD helpers keep working unchanged.
  if (readAll_('Branches').length === 0) {
    var hours = { Sun: { open: false, is24: false, start: '09:00', end: '18:00' }, Mon: { open: true, is24: false, start: '08:00', end: '19:00' }, Tue: { open: true, is24: false, start: '08:00', end: '19:00' }, Wed: { open: true, is24: false, start: '08:00', end: '19:00' }, Thu: { open: true, is24: false, start: '08:00', end: '19:00' }, Fri: { open: true, is24: false, start: '08:00', end: '19:00' }, Sat: { open: true, is24: false, start: '09:00', end: '17:00' } };
    appendRow_('Branches', { BranchID: 'BR-0001', Name: 'Advance Tailor', Location: 'Spintex Road, Accra', Phone: '0241234567', OpeningHours: summarizeWeeklyHours_(hours), WeeklyHours: JSON.stringify(hours) });
  }

  // Services (garment types / tailoring services)
  if (readAll_('Services').length === 0) {
    var svc = [
      ['Men\'s Suit (Made-to-Measure)', "Men's Wear", 'Two-piece bespoke suit, hand-finished lapels & lining', 14, 850, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop'],
      ['Men\'s Shirt', "Men's Wear", 'Custom-fit dress or casual shirt', 5, 120, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop'],
      ['Kaba & Slit', "Women's Wear", 'Classic two-piece with your choice of style', 7, 350, 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=800&auto=format&fit=crop'],
      ['Wedding Gown', 'Wedding & Occasion Wear', 'Custom bridal gown, fittings included', 30, 2500, 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=800&auto=format&fit=crop'],
      ['Agbada (3-piece)', 'Traditional Wear', 'Grand agbada with cap and trouser', 10, 950, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop'],
      ['School Uniform Set', 'Uniforms', 'Shirt & trouser/skirt per school specification', 5, 150, ''],
      ['Kids Outfit', 'Kids Wear', 'Custom outfit for children up to age 12', 5, 130, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=800&auto=format&fit=crop'],
      ['Garment Alteration', 'Alterations', 'Resize, hem, or repair an existing garment', 3, 40, ''],
      ['Native Trouser & Top', 'Traditional Wear', 'Two-piece native wear set', 6, 300, 'https://images.unsplash.com/photo-1617196701537-7329482cc9fe?q=80&w=800&auto=format&fit=crop']
    ];
    svc.forEach(function (s, i) {
      appendRow_('Services', {
        ServiceID: 'SV-' + String(i + 1).padStart(4, '0'), Name: s[0], Category: s[1], Description: s[2],
        TurnaroundDays: s[3], Price: s[4], BranchID: 'BR-0001', Active: 'Y', ImageURL: s[5]
      });
    });
  }

  // Staff — WorkDays drives availability in the public fitting booking wizard.
  if (readAll_('Staff').length === 0) {
    var staff = [
      ['Nana Kofi Adjei', 'Master Tailor', '0244001122', 'Suits, Agbada', 'Y', 12, 'Mon,Tue,Wed,Thu,Fri,Sat'],
      ['Abena Owusu', 'Seamstress', '0244002233', 'Kaba & Slit, Gowns', 'Y', 12, 'Mon,Tue,Wed,Thu,Fri,Sat'],
      ['Kwesi Boateng', 'Tailor', '0244003344', 'Shirts, Uniforms', 'Y', 10, 'Mon,Wed,Thu,Fri,Sat'],
      ['Efua Mensah', 'Seamstress', '0244004455', 'Bridal, Alterations', 'Y', 10, 'Tue,Wed,Thu,Fri,Sat'],
      ['Yaw Darko', 'Manager', '0244005566', 'Operations, Fittings', 'Y', 5, 'Mon,Tue,Wed,Thu,Fri']
    ];
    staff.forEach(function (s, i) {
      appendRow_('Staff', {
        StaffID: 'ST-' + String(i + 1).padStart(4, '0'), Name: s[0], Role: s[1], BranchID: 'BR-0001', Phone: s[2],
        Specialties: s[3], PhotoURL: '', Active: s[4], CommissionRate: s[5], WorkDays: s[6]
      });
    });
  }

  // Products — fabrics & accessories inventory. Ready-to-Wear items default
  // to ShowOnWebsite='Y' so the public Shop isn't empty on first launch;
  // raw fabric/notions default to 'N' since those aren't sold as-is online.
  if (readAll_('Products').length === 0) {
    var prod = [
      ['Kente Cloth', 'Fabric', 'Yard', 60, 120, 40, 8, 'https://images.unsplash.com/photo-1590736969955-71cc94901144?q=80&w=800&auto=format&fit=crop', 'N'],
      ['Ankara Print', 'Fabric', 'Yard', 20, 40, 80, 15, 'https://images.unsplash.com/photo-1596466596120-2a8e4b5d1b3a?q=80&w=800&auto=format&fit=crop', 'N'],
      ['Suit Lining', 'Fabric', 'Yard', 10, 20, 50, 10, '', 'N'],
      ['Wax Print (GTP)', 'Fabric', 'Yard', 25, 50, 60, 12, '', 'N'],
      ['Buttons (Set)', 'Accessories', 'Set', 3, 8, 100, 20, '', 'N'],
      ['Zipper', 'Notions', 'Piece', 2, 5, 150, 30, '', 'N'],
      ['Ready-made Kids Shirt', 'Ready-to-Wear', 'Piece', 25, 45, 20, 5, 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=800&auto=format&fit=crop', 'Y'],
      ['Ready-made Ankara Dress', 'Ready-to-Wear', 'Piece', 60, 120, 15, 4, 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop', 'Y'],
      ['Ready-made Men\'s Shirt', 'Ready-to-Wear', 'Piece', 40, 85, 18, 5, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop', 'Y']
    ];
    prod.forEach(function (p, i) {
      appendRow_('Products', {
        ProductID: 'PR-' + String(i + 1).padStart(4, '0'), Name: p[0], Category: p[1], Unit: p[2], CostPrice: p[3],
        SellingPrice: p[4], QuantityInStock: p[5], ReorderLevel: p[6], BranchID: 'BR-0001', ImageURL: p[7], ShowOnWebsite: p[8]
      });
    });
  }

  // Hero slides
  if (readAll_('HeroSlides').length === 0) {
    appendRow_('HeroSlides', { SlideID: 'HS-0001', ImageURL: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop', Title: 'Bespoke Fashion, Perfectly Fitted', Subtitle: "Ghana's trusted made-to-measure tailoring house.", ButtonText: 'Book a Fitting', ButtonLink: '#booking', SortOrder: 1, Active: 'Y' });
    appendRow_('HeroSlides', { SlideID: 'HS-0002', ImageURL: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1600&auto=format&fit=crop', Title: 'Suits, Kaba, Agbada & More', Subtitle: 'From consultation to delivery, we handle every stitch.', ButtonText: 'View Services', ButtonLink: '#services', SortOrder: 2, Active: 'Y' });
  }

  // Gallery — portfolio of finished work
  if (readAll_('Gallery').length === 0) {
    var gallery = [
      ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop', 'Two-piece bespoke suit', "Men's Wear", 'BR-0001'],
      ['https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1000&auto=format&fit=crop', 'Kaba & slit finish', "Women's Wear", 'BR-0001'],
      ['https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1000&auto=format&fit=crop', 'Agbada with matching cap', 'Traditional Wear', 'BR-0001'],
      ['https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=1000&auto=format&fit=crop', 'Bridal gown detail', 'Wedding & Occasion Wear', 'BR-0001'],
      ['https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=1000&auto=format&fit=crop', "Children's outfit set", 'Kids Wear', 'BR-0001'],
      ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop', 'Our workshop floor', 'Our Shop', 'BR-0001']
    ];
    gallery.forEach(function (g, i) {
      appendRow_('Gallery', {
        GalleryID: 'GL-' + String(i + 1).padStart(4, '0'), ImageURL: g[0], Caption: g[1], Category: g[2],
        BranchID: g[3], SortOrder: i + 1, Active: 'Y'
      });
    });
  }

  // Sample customers + reviews
  if (readAll_('Customers').length === 0) {
    var sampleCustomers = [
      ['Nana Adjei', '0244112233', 'nana.adjei@gmail.com'],
      ['Abena Serwaa', '0201223344', 'abena.serwaa@gmail.com'],
      ['Kojo Antwi', '0554334455', ''],
      ['Linda Owusu', '0271445566', 'linda.owusu@gmail.com'],
      ['Emmanuel Tetteh', '0501556677', '']
    ];
    sampleCustomers.forEach(function (c, i) {
      appendRow_('Customers', {
        CustomerID: 'CU-' + String(i + 1).padStart(4, '0'), Name: c[0], Phone: c[1], Email: c[2],
        DateJoined: nowIso_(), LoyaltyPoints: [220, 45, 600, 80, 15][i], Notes: ''
      });
    });
  }
  if (readAll_('Reviews').length === 0) {
    var sampleReviews = [
      ['CU-0001', 'ST-0001', 5, 'Nana Kofi made my wedding suit — the fit was flawless and delivered ahead of time.'],
      ['CU-0002', 'ST-0002', 5, 'Abena\'s kaba & slit work is stunning, I get compliments every time I wear it.'],
      ['CU-0003', 'ST-0003', 4, 'Great shirt tailoring, took a little longer than the quoted date but worth it.'],
      ['CU-0004', 'ST-0004', 5, 'My bridal gown fitting sessions were so professional. Highly recommend.'],
      ['CU-0005', 'ST-0001', 5, 'Booked a fitting online in two minutes and got an SMS confirmation right away.'],
      ['CU-0001', 'ST-0005', 5, 'Yaw kept me updated on my order status the whole way — excellent service.'],
      ['CU-0002', 'ST-0001', 5, 'Been a customer for over a year, consistent quality every single time.']
    ];
    sampleReviews.forEach(function (r, i) {
      appendRow_('Reviews', { ReviewID: 'RV-' + String(i + 1).padStart(4, '0'), CustomerID: r[0], StaffID: r[1], Rating: r[2], Comment: r[3], Date: nowIso_() });
    });
  }

  // Default admin user
  if (readAll_('Users').length === 0) {
    var salt = Utilities.getUuid();
    appendRow_('Users', {
      Username: 'admin', PasswordHash: hashPassword_('admin123', salt), Salt: salt,
      Role: 'Owner', BranchID: 'ALL', Active: 'Y', StaffID: '', Email: 'owner@advancetailor.com.gh', Phone: '0241234567', FullName: 'Shop Owner'
    });
  }
}

/* ============================================================================
 * 5. GENERIC SHEET DATA-ACCESS HELPERS
 * ==========================================================================*/

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    ensureSetup_();
    sheet = ss.getSheetByName(name);
  }
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/**
 * Google Sheets auto-detects date/time-looking strings and silently stores
 * them as real Date values, and google.script.run cannot serialize a Date
 * inside a returned object (it silently delivers `null` instead). Every
 * cell value is normalized back to a plain string/number/boolean here.
 */
function normalizeCellValue_(v) {
  if (v instanceof Date) {
    var isMidnight = v.getHours() === 0 && v.getMinutes() === 0 && v.getSeconds() === 0;
    return Utilities.formatDate(v, TIMEZONE, isMidnight ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss");
  }
  return v;
}

function readAll_(sheetName) {
  var sheet = getSheet_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastCol = SCHEMA[sheetName].length;
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var headers = SCHEMA[sheetName];
  return values
    .map(function (row, idx) {
      var obj = { _row: idx + 2 };
      headers.forEach(function (h, i) { obj[h] = normalizeCellValue_(row[i]); });
      return obj;
    })
    .filter(function (obj) {
      return headers.some(function (h) { return obj[h] !== '' && obj[h] !== null && obj[h] !== undefined; });
    });
}

function appendRow_(sheetName, obj) {
  var sheet = getSheet_(sheetName);
  var headers = SCHEMA[sheetName];
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
  return obj;
}

function findRowIndexById_(sheetName, idField, idValue) {
  var sheet = getSheet_(sheetName);
  var headers = SCHEMA[sheetName];
  var idCol = headers.indexOf(idField) + 1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(idValue)) return i + 2;
  }
  return -1;
}

function updateById_(sheetName, idField, idValue, updates) {
  var sheet = getSheet_(sheetName);
  var headers = SCHEMA[sheetName];
  var rowIndex = findRowIndexById_(sheetName, idField, idValue);
  if (rowIndex === -1) throw new Error(sheetName + ' record not found: ' + idValue);
  var current = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  headers.forEach(function (h, i) {
    if (updates.hasOwnProperty(h)) current[i] = updates[h];
  });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([current]);
  var result = {};
  headers.forEach(function (h, i) { result[h] = normalizeCellValue_(current[i]); });
  return result;
}

function deleteById_(sheetName, idField, idValue) {
  var sheet = getSheet_(sheetName);
  var rowIndex = findRowIndexById_(sheetName, idField, idValue);
  if (rowIndex === -1) throw new Error(sheetName + ' record not found: ' + idValue);
  sheet.deleteRow(rowIndex);
  return true;
}

function nextId_(sheetName, idField) {
  var prefix = ID_PREFIX[sheetName] || 'ID';
  var rows = readAll_(sheetName);
  var max = 0;
  rows.forEach(function (r) {
    var raw = String(r[idField] || '');
    var num = parseInt(raw.split('-').pop(), 10);
    if (!isNaN(num) && num > max) max = num;
  });
  if (TRASH_RECORD_TYPES[sheetName]) {
    readAll_('Trash').forEach(function (t) {
      if (t.RecordType !== sheetName) return;
      var raw = String(t.RecordID || '');
      var num = parseInt(raw.split('-').pop(), 10);
      if (!isNaN(num) && num > max) max = num;
    });
  }
  return prefix + '-' + String(max + 1).padStart(4, '0');
}

/* ============================================================================
 * 6. AUTH & SESSION MANAGEMENT
 * ==========================================================================*/

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + '::' + salt);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function login(username, password) {
  if (!username || !password) throw new Error('Username and password are required.');
  var users = readAll_('Users');
  var user = users.find(function (u) { return String(u.Username).toLowerCase() === String(username).toLowerCase(); });
  if (!user) throw new Error('Invalid username or password.');
  if (String(user.Active).toUpperCase() !== 'Y') throw new Error('This account has been deactivated.');
  var hash = hashPassword_(password, user.Salt);
  if (hash !== user.PasswordHash) throw new Error('Invalid username or password.');

  var token = Utilities.getUuid();
  var sessionData = {
    username: user.Username, role: user.Role, branchId: user.BranchID,
    staffId: user.StaffID, email: user.Email, fullName: user.FullName
  };
  CacheService.getScriptCache().put('session_' + token, JSON.stringify(sessionData), SESSION_TTL_SECONDS);
  return { token: token, user: sessionData };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('session_' + token);
  return true;
}

/**
 * Public self-registration. A self-registered account is never granted an
 * elevated role or branch access automatically — it is created inactive
 * with no branch. An Owner must review it from the Users admin page.
 */
function registerAccount(data) {
  data = data || {};
  var name = String(data.name || '').trim();
  var username = String(data.username || '').trim();
  var password = String(data.password || '');

  if (!name) throw new Error('Please enter your full name.');
  if (!username || username.length < 3) throw new Error('Please choose a username of at least 3 characters.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  var existing = readAll_('Users').find(function (u) { return String(u.Username).toLowerCase() === username.toLowerCase(); });
  if (existing) throw new Error('That username is already taken.');

  var phone = '';
  if (data.phone) {
    phone = normalizeGhanaPhone_(data.phone);
    if (!phone) throw new Error('Please enter a valid Ghana phone number, e.g. 024XXXXXXX or +233XXXXXXXXX.');
  }

  var salt = Utilities.getUuid();
  appendRow_('Users', {
    Username: username, PasswordHash: hashPassword_(password, salt), Salt: salt,
    Role: 'Staff', BranchID: '', Active: 'N', StaffID: '', Email: String(data.email || '').trim(), Phone: phone,
    FullName: name
  });
  return { message: 'Account created. An admin must activate it before you can log in.' };
}

function requireAuth_(token) {
  if (!token) throw new Error('Please log in to continue.');
  var raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) throw new Error('Your session has expired. Please log in again.');
  return JSON.parse(raw);
}

function requireRole_(user, allowedRoles) {
  if (allowedRoles.indexOf(user.role) === -1) throw new Error('You do not have permission to perform this action.');
  return user;
}

function scopeBranch_(user, requestedBranchId) {
  if (user.role === 'Owner' || user.branchId === 'ALL') return requestedBranchId || null;
  return user.branchId;
}

function getCurrentUser(token) {
  try { return requireAuth_(token); } catch (e) { return null; }
}

/* ============================================================================
 * 7. PUBLIC-FACING FUNCTIONS (website, booking, order tracking)
 * ==========================================================================*/

function sanitizeStaff_(s) {
  return { StaffID: s.StaffID, Name: s.Name, Role: s.Role, BranchID: s.BranchID, Specialties: s.Specialties, PhotoURL: s.PhotoURL, WorkDays: s.WorkDays };
}
function firstNameOnly_(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'Team member';
}
function stripRow_(obj) {
  var copy = {};
  Object.keys(obj).forEach(function (k) { if (k !== '_row') copy[k] = obj[k]; });
  return copy;
}

/** Everything the public homepage needs, in one round trip. */
function getPublicData() {
  var settings = getSettingsMap_();
  var branch = readAll_('Branches')[0] || {};
  var weeklyHours = parseBranchWeeklyHours_(branch);
  var shopStatus = computeShopStatus_(weeklyHours);

  var services = readAll_('Services').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  withImageDataUris_(services, 'ImageURL');

  var staff = readAll_('Staff').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; }).map(sanitizeStaff_);
  withImageDataUris_(staff, 'PhotoURL');

  var gallery = readAll_('Gallery').filter(function (g) { return String(g.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  withImageDataUris_(gallery, 'ImageURL');

  var videos = readAll_('Videos').filter(function (v) { return String(v.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });

  var heroSlides = readAll_('HeroSlides').filter(function (h) { return String(h.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  withImageDataUris_(heroSlides, 'ImageURL');

  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var staffAll = keyBy_(readAll_('Staff'), 'StaffID');
  var reviews = readAll_('Reviews').sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); }).slice(0, 12).map(function (r) {
    var c = customers[r.CustomerID] || {};
    var st = staffAll[r.StaffID] || {};
    return { ReviewID: r.ReviewID, Rating: r.Rating, Comment: r.Comment, Date: r.Date, CustomerName: firstNameOnly_(c.Name) + (c.Name ? ' ' + String(c.Name).trim().split(/\s+/).slice(-1)[0].charAt(0) + '.' : ''), StaffName: st.Name || '' };
  });

  settings.LogoURL = imageUrlToDataUri_(settings.LogoURL);

  var shopProducts = readAll_('Products').filter(function (p) { return String(p.ShowOnWebsite).toUpperCase() === 'Y'; });
  withImageDataUris_(shopProducts, 'ImageURL');

  return {
    settings: settings,
    branch: { BranchID: branch.BranchID, Name: branch.Name, Location: branch.Location, Phone: branch.Phone },
    shopStatus: shopStatus,
    services: services,
    staff: staff,
    gallery: gallery,
    videos: videos,
    heroSlides: heroSlides,
    reviews: reviews,
    shopProducts: shopProducts,
    serviceCategories: String(settings.ServiceCategories || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean)
  };
}

/** Public booking of a fitting/consultation appointment. */
function createAppointment(data) {
  data = data || {};
  var name = String(data.name || '').trim();
  var phone = normalizeGhanaPhone_(data.phone);
  if (!name) throw new Error('Please enter your name.');
  if (!phone) throw new Error('Please enter a valid Ghana phone number.');
  if (!data.serviceId) throw new Error('Please choose a service.');
  if (!data.date || !data.timeSlot) throw new Error('Please choose a date and time.');

  var branch = readAll_('Branches')[0];
  if (!branch) throw new Error('Shop not configured yet.');

  var staffId = data.staffId;
  if (!staffId || staffId === 'ANY') {
    staffId = pickAnyAvailableStaff_(branch.BranchID, data.date, data.timeSlot);
    if (!staffId) throw new Error('Sorry, no tailors are available at that time. Please choose another slot.');
  } else if (!isSlotAvailable_(branch.BranchID, staffId, data.date, data.timeSlot)) {
    throw new Error('That time slot is no longer available. Please choose another.');
  }

  var customer = findOrCreateCustomerByPhone_(name, phone, data.email);
  var reference = 'BK' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);

  var appt = {
    AppointmentID: nextId_('Appointments', 'AppointmentID'),
    Reference: reference,
    CustomerID: customer.CustomerID,
    StaffID: staffId,
    ServiceID: data.serviceId,
    BranchID: branch.BranchID,
    Date: data.date,
    TimeSlot: data.timeSlot,
    Type: APPOINTMENT_TYPES.indexOf(data.type) > -1 ? data.type : 'Consultation',
    Status: 'Pending',
    CreatedAt: nowIso_(),
    Notes: String(data.notes || ''),
    PaymentMethod: data.paymentMethod || '',
    PaymentStatus: data.paymentMethod && data.paymentMethod !== 'Cash' ? 'Submitted' : 'Pending',
    PaymentProofURL: data.paymentProofUrl || ''
  };
  appendRow_('Appointments', appt);

  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var settings = getSettingsMap_();
  if (String(settings.NotifyBookingSms).toUpperCase() === 'Y' || String(settings.NotifyBookingEmail).toUpperCase() === 'Y') {
    sendAppointmentConfirmation_(appt, customer, services[data.serviceId], branch);
  }
  return { reference: reference, appointmentId: appt.AppointmentID };
}

function submitReview(data) {
  data = data || {};
  var phone = normalizeGhanaPhone_(data.phone);
  if (!phone) throw new Error('Please enter a valid phone number.');
  var rating = Number(data.rating);
  if (!rating || rating < 1 || rating > 5) throw new Error('Please choose a rating between 1 and 5.');
  var comment = String(data.comment || '').trim();
  if (!comment) throw new Error('Please share a few words about your experience.');

  var customer = findOrCreateCustomerByPhone_(data.name, phone, data.email);
  appendRow_('Reviews', {
    ReviewID: nextId_('Reviews', 'ReviewID'), CustomerID: customer.CustomerID, StaffID: data.staffId || '',
    Rating: rating, Comment: comment, Date: nowIso_()
  });
  return { message: 'Thank you for your feedback!' };
}

function getEffectiveWeeklyHours_(branchId) {
  var branch = readAll_('Branches')[0];
  return parseBranchWeeklyHours_(branch);
}

/** Available time slots for a given staff member/date, honoring shop hours, work days, existing appointments, and admin-blocked slots. */
/** Public: 'ANY' (or blank) staffId means "any available tailor" — the union of every active tailor's open slots that day. A specific staffId returns just that tailor's own open slots. */
function getAvailableSlots(branchId, staffId, date) {
  if (!staffId || staffId === 'ANY') return getAvailableSlotsAnyStaff_(branchId, date);
  return getAvailableSlotsForStaff_(branchId, staffId, date);
}

function getAvailableSlotsAnyStaff_(branchId, date) {
  var activeStaff = readAll_('Staff').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  var slotSet = {};
  activeStaff.forEach(function (s) {
    getAvailableSlotsForStaff_(branchId, s.StaffID, date).forEach(function (sl) { slotSet[sl] = true; });
  });
  return Object.keys(slotSet).sort();
}

function getAvailableSlotsForStaff_(branchId, staffId, date) {
  var settings = getSettingsMap_();
  var interval = Number(settings.SlotIntervalMinutes) || 30;
  var weeklyHours = getEffectiveWeeklyHours_(branchId);
  var weekday = Utilities.formatDate(new Date(date + 'T12:00:00'), TIMEZONE, 'EEE');
  var window = dayWindowMinutes_(weeklyHours[weekday]);
  if (!window.open) return [];

  var staffMember = readAll_('Staff').find(function (s) { return s.StaffID === staffId; });
  if (staffMember && !worksOnDay_(staffMember, weekday)) return [];

  var takenSlots = {};
  readAll_('Appointments').forEach(function (a) {
    if (a.StaffID === staffId && a.Date === date && a.Status !== 'Cancelled') takenSlots[a.TimeSlot] = true;
  });
  readAll_('BlockedSlots').forEach(function (b) {
    if (b.BranchID === branchId && b.Date === date) takenSlots[b.TimeSlot] = true;
  });

  var slots = [];
  var todayStr = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var nowMin = Number(Utilities.formatDate(new Date(), TIMEZONE, 'H')) * 60 + Number(Utilities.formatDate(new Date(), TIMEZONE, 'm'));
  for (var m = window.startMin; m < window.endMin; m += interval) {
    if (date === todayStr && m <= nowMin) continue;
    var hh = Math.floor(m / 60), mm = m % 60;
    var slot = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
    if (!takenSlots[slot]) slots.push(slot);
  }
  return slots;
}

/** Resolves 'ANY' to a concrete tailor who is actually free at that exact date/time — picking the first active staff member (in Staff-sheet order) who works that weekday and has no conflicting appointment or blocked slot. */
function pickAnyAvailableStaff_(branchId, date, timeSlot) {
  var weekday = Utilities.formatDate(new Date(date + 'T12:00:00'), TIMEZONE, 'EEE');
  var activeStaff = readAll_('Staff').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  for (var i = 0; i < activeStaff.length; i++) {
    var s = activeStaff[i];
    if (!worksOnDay_(s, weekday)) continue;
    if (isSlotAvailable_(branchId, s.StaffID, date, timeSlot)) return s.StaffID;
  }
  return null;
}

function getSlotsForAdmin(token, branchId, date) {
  var user = requireAuth_(token);
  var settings = getSettingsMap_();
  var interval = Number(settings.SlotIntervalMinutes) || 30;
  var weeklyHours = getEffectiveWeeklyHours_(branchId);
  var weekday = Utilities.formatDate(new Date(date + 'T12:00:00'), TIMEZONE, 'EEE');
  var window = dayWindowMinutes_(weeklyHours[weekday]);
  var appts = readAll_('Appointments').filter(function (a) { return a.Date === date && a.Status !== 'Cancelled'; });
  var blocked = readAll_('BlockedSlots').filter(function (b) { return b.BranchID === branchId && b.Date === date; }).map(function (b) { return b.TimeSlot; });
  var slots = [];
  if (window.open) {
    for (var m = window.startMin; m < window.endMin; m += interval) {
      var hh = Math.floor(m / 60), mm = m % 60;
      slots.push((hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm);
    }
  }
  return { slots: slots, appointments: appts, blocked: blocked };
}

function toggleBlockedSlot(token, branchId, date, timeSlot) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var existing = readAll_('BlockedSlots').find(function (b) { return b.BranchID === branchId && b.Date === date && b.TimeSlot === timeSlot; });
  if (existing) {
    deleteById_('BlockedSlots', 'BlockedSlotID', existing.BlockedSlotID);
    return { blocked: false };
  }
  appendRow_('BlockedSlots', { BlockedSlotID: nextId_('BlockedSlots', 'BlockedSlotID'), BranchID: branchId, Date: date, TimeSlot: timeSlot });
  return { blocked: true };
}

function worksOnDay_(staffMember, weekday) {
  if (!staffMember.WorkDays) return true;
  return String(staffMember.WorkDays).split(',').map(function (d) { return d.trim(); }).indexOf(weekday) > -1;
}

function isSlotAvailable_(branchId, staffId, date, timeSlot) {
  var taken = readAll_('Appointments').some(function (a) { return a.StaffID === staffId && a.Date === date && a.TimeSlot === timeSlot && a.Status !== 'Cancelled'; });
  if (taken) return false;
  var blocked = readAll_('BlockedSlots').some(function (b) { return b.BranchID === branchId && b.Date === date && b.TimeSlot === timeSlot; });
  return !blocked;
}

/** Public order-status lookup by phone number — the "Track My Order" feature. */
/** Public: a customer's bespoke garment Orders AND online Shop purchases, merged and sorted, by phone. */
function lookupMyOrders(phone) {
  var normalized = normalizeGhanaPhone_(phone);
  if (!normalized) throw new Error('Please enter a valid phone number.');
  var customer = readAll_('Customers').find(function (c) { return c.Phone === normalized; });
  if (!customer) return [];
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var orders = readAll_('Orders').filter(function (o) { return o.CustomerID === customer.CustomerID; }).map(function (o) { return orderSummary_(o, services); });
  var purchases = readAll_('Sales').filter(function (s) { return s.CustomerID === customer.CustomerID && s.Source === 'Online'; }).map(saleSummary_);
  return orders.concat(purchases).sort(function (a, b) { return new Date(b.OrderDate) - new Date(a.OrderDate); });
}

function lookupOrderByReference(reference) {
  var order = readAll_('Orders').find(function (o) { return String(o.Reference).toUpperCase() === String(reference || '').trim().toUpperCase(); });
  if (!order) throw new Error('No order found with that reference.');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  return orderSummary_(order, services);
}

/** Public: look up a single online Shop purchase (as opposed to a bespoke Order) by its SHP reference. */
function lookupSaleByReference(reference) {
  var sale = readAll_('Sales').find(function (s) { return s.Source === 'Online' && String(s.Reference).toUpperCase() === String(reference || '').trim().toUpperCase(); });
  if (!sale) throw new Error('No order found with that reference.');
  return saleSummary_(sale);
}

function orderSummary_(o, services) {
  var svc = services[o.ServiceID] || {};
  var stageIndex = ORDER_STATUSES.indexOf(o.Status);
  return {
    Type: 'Order', Reference: o.Reference, Status: o.Status, ServiceName: svc.Name || '', OrderDate: o.OrderDate, DueDate: o.DueDate,
    Price: o.Price, DepositAmount: o.DepositAmount, AmountPaid: o.AmountPaid, PaymentStatus: o.PaymentStatus,
    StageIndex: stageIndex, TotalStages: ORDER_STATUSES.length - 1, DeliveredAt: o.DeliveredAt,
    Stages: ORDER_STATUSES.filter(function (s) { return s !== 'Cancelled'; })
  };
}

/** Same shape as orderSummary_ so the public tracker can render either with one card component. */
function saleSummary_(s) {
  var items;
  try { items = JSON.parse(s.Items || '[]'); } catch (e) { items = []; }
  var itemsLabel = items.map(function (it) { return it.name + ' ×' + it.qty; }).join(', ');
  var stageIndex = SALE_FULFILLMENT_STATUSES.indexOf(s.FulfillmentStatus);
  return {
    Type: 'Purchase', Reference: s.Reference, Status: s.FulfillmentStatus || 'Processing', ServiceName: itemsLabel,
    OrderDate: String(s.Date).slice(0, 10), DueDate: '', Price: s.Total, DepositAmount: 0, AmountPaid: s.PaymentStatus === 'Paid' ? s.Total : 0,
    PaymentStatus: s.PaymentStatus, StageIndex: stageIndex < 0 ? 0 : stageIndex, TotalStages: SALE_FULFILLMENT_STATUSES.length - 1, DeliveredAt: '',
    Stages: SALE_FULFILLMENT_STATUSES
  };
}

/** Public appointment lookup/cancel by phone (kept for fitting bookings, distinct from order tracking above). */
function lookupMyBookings(phone) {
  var normalized = normalizeGhanaPhone_(phone);
  if (!normalized) throw new Error('Please enter a valid phone number.');
  var customer = readAll_('Customers').find(function (c) { return c.Phone === normalized; });
  if (!customer) return [];
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var branches = keyBy_(readAll_('Branches'), 'BranchID');
  return readAll_('Appointments')
    .filter(function (a) { return a.CustomerID === customer.CustomerID; })
    .sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); })
    .map(function (a) { return bookingSummary_(a, services, staffMap, branches); });
}

function lookupBookingByReference(reference) {
  var appt = readAll_('Appointments').find(function (a) { return String(a.Reference).toUpperCase() === String(reference || '').trim().toUpperCase(); });
  if (!appt) throw new Error('No booking found with that reference.');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var branches = keyBy_(readAll_('Branches'), 'BranchID');
  return bookingSummary_(appt, services, staffMap, branches);
}

function bookingSummary_(a, services, staffMap, branches) {
  var svc = services[a.ServiceID] || {};
  var st = staffMap[a.StaffID] || {};
  var br = branches[a.BranchID] || {};
  return {
    AppointmentID: a.AppointmentID, Reference: a.Reference, Date: a.Date, TimeSlot: a.TimeSlot, Type: a.Type,
    Status: a.Status, ServiceName: svc.Name || '', StaffName: st.Name || '', BranchName: br.Name || ''
  };
}

function cancelMyAppointment(phone, appointmentId) {
  var normalized = normalizeGhanaPhone_(phone);
  var customer = readAll_('Customers').find(function (c) { return c.Phone === normalized; });
  var appt = readAll_('Appointments').find(function (a) { return a.AppointmentID === appointmentId; });
  if (!customer || !appt || appt.CustomerID !== customer.CustomerID) throw new Error('Booking not found.');
  if (appt.Status === 'Completed') throw new Error('This booking is already completed and cannot be cancelled.');
  updateById_('Appointments', 'AppointmentID', appointmentId, { Status: 'Cancelled' });
  return { message: 'Booking cancelled.' };
}

function cancelBookingByReference(reference) {
  var appt = readAll_('Appointments').find(function (a) { return String(a.Reference).toUpperCase() === String(reference || '').trim().toUpperCase(); });
  if (!appt) throw new Error('No booking found with that reference.');
  if (appt.Status === 'Completed') throw new Error('This booking is already completed and cannot be cancelled.');
  updateById_('Appointments', 'AppointmentID', appt.AppointmentID, { Status: 'Cancelled' });
  return { message: 'Booking cancelled.' };
}

function trackVisit(visitorKey) {
  try {
    appendRow_('Visits', { VisitID: nextId_('Visits', 'VisitID'), Date: Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'), Timestamp: nowIso_(), VisitorKey: String(visitorKey || '').slice(0, 64) });
  } catch (e) { /* never block page load on analytics */ }
  return true;
}

function sendContactMessage(data) {
  data = data || {};
  var name = String(data.name || '').trim();
  var message = String(data.message || '').trim();
  if (!name || !message) throw new Error('Please enter your name and a message.');
  var settings = getSettingsMap_();
  logNotification_('Contact', settings.ContactEmail, name + ' (' + (data.phone || data.email || '') + '): ' + message, 'Received');
  if (settings.ContactEmail) {
    sendEmail_(settings.ContactEmail, 'New website enquiry from ' + name, message, buildEmailHtml_('New Website Enquiry', '<p><strong>From:</strong> ' + esc_(name) + '</p><p><strong>Contact:</strong> ' + esc_(data.phone || data.email || '') + '</p><p>' + esc_(message).replace(/\n/g, '<br>') + '</p>', '', ''));
  }
  return { message: 'Thanks — we will get back to you shortly.' };
}

/* ============================================================================
 * 8. SERVICES / STAFF / SHOP INFO CRUD
 * ==========================================================================*/

function getShopInfo(token) {
  var user = requireAuth_(token);
  var branch = readAll_('Branches')[0] || {};
  return { branch: branch, weeklyHours: parseBranchWeeklyHours_(branch) };
}

function saveShopInfo(token, info) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var branch = readAll_('Branches')[0];
  var weeklyHours = info.weeklyHours || parseBranchWeeklyHours_(branch);
  var updates = {
    Name: info.Name, Location: info.Location, Phone: normalizeGhanaPhone_(info.Phone) || info.Phone,
    WeeklyHours: JSON.stringify(weeklyHours), OpeningHours: summarizeWeeklyHours_(weeklyHours)
  };
  return updateById_('Branches', 'BranchID', branch.BranchID, updates);
}

function getServices(token, branchId) {
  var user = requireAuth_(token);
  var rows = readAll_('Services');
  withImageDataUris_(rows, 'ImageURL');
  return rows;
}

function saveService(token, service) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (!service.Name) throw new Error('Please enter a service name.');
  var branch = readAll_('Branches')[0];
  service.BranchID = branch.BranchID;
  if (service.ServiceID) {
    return updateById_('Services', 'ServiceID', service.ServiceID, service);
  }
  service.ServiceID = nextId_('Services', 'ServiceID');
  service.Active = service.Active || 'Y';
  return appendRow_('Services', service);
}

function deleteService(token, serviceId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Services', 'ServiceID', serviceId);
}

function getStaff(token, branchId) {
  var user = requireAuth_(token);
  var rows = readAll_('Staff');
  withImageDataUris_(rows, 'PhotoURL');
  return rows;
}

function saveStaff(token, staff) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (!staff.Name) throw new Error('Please enter a name.');
  var branch = readAll_('Branches')[0];
  staff.BranchID = branch.BranchID;
  if (staff.Phone) staff.Phone = normalizeGhanaPhone_(staff.Phone) || staff.Phone;
  if (staff.StaffID) {
    return updateById_('Staff', 'StaffID', staff.StaffID, staff);
  }
  staff.StaffID = nextId_('Staff', 'StaffID');
  staff.Active = staff.Active || 'Y';
  return appendRow_('Staff', staff);
}

function deleteStaff(token, staffId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Staff', 'StaffID', staffId);
}

function getStaffLeave(token, staffId) {
  var user = requireAuth_(token);
  var rows = readAll_('StaffLeave');
  return staffId ? rows.filter(function (l) { return l.StaffID === staffId; }) : rows;
}

function addStaffLeave(token, staffId, date, reason) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return appendRow_('StaffLeave', { LeaveID: nextId_('StaffLeave', 'LeaveID'), StaffID: staffId, Date: date, Reason: reason || '' });
}

function removeStaffLeave(token, leaveId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('StaffLeave', 'LeaveID', leaveId);
}

/* ============================================================================
 * 9. CUSTOMERS / CRM / LOYALTY / MEASUREMENTS
 * ==========================================================================*/

function findOrCreateCustomerByPhone_(name, phone, email) {
  var customers = readAll_('Customers');
  var existing = customers.find(function (c) { return c.Phone === phone; });
  if (existing) {
    if (email && !existing.Email) updateById_('Customers', 'CustomerID', existing.CustomerID, { Email: email });
    if (name && String(name).trim() && existing.Name !== name) updateById_('Customers', 'CustomerID', existing.CustomerID, { Name: name });
    return existing;
  }
  var customer = {
    CustomerID: nextId_('Customers', 'CustomerID'), Name: String(name || 'Guest').trim(), Phone: phone,
    Email: String(email || '').trim(), DateJoined: nowIso_(), LoyaltyPoints: 0, Notes: ''
  };
  appendRow_('Customers', customer);
  return customer;
}

function getCustomers(token, search) {
  var user = requireAuth_(token);
  var rows = readAll_('Customers');
  var visitCounts = computeCustomerVisitCounts_(Number(getSettingsMap_().FavouriteWindowDays) || 180);
  var threshold = Number(getSettingsMap_().FavouriteVisitThreshold) || 3;
  rows.forEach(function (c) { c.IsRegular = (visitCounts[c.CustomerID] || 0) >= threshold; c.VisitCount = visitCounts[c.CustomerID] || 0; });
  if (search) {
    var q = String(search).toLowerCase();
    rows = rows.filter(function (c) { return String(c.Name).toLowerCase().indexOf(q) > -1 || String(c.Phone).indexOf(q) > -1 || String(c.Email).toLowerCase().indexOf(q) > -1; });
  }
  return rows.sort(function (a, b) { return new Date(b.DateJoined) - new Date(a.DateJoined); });
}

/** Counts, per customer, delivered orders + completed sales within the trailing windowDays — drives the "Regular customer" flag. */
function computeCustomerVisitCounts_(windowDays) {
  var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - windowDays);
  var counts = {};
  readAll_('Orders').forEach(function (o) {
    if (o.Status !== 'Delivered' || !o.DeliveredAt) return;
    if (new Date(o.DeliveredAt) < cutoff) return;
    counts[o.CustomerID] = (counts[o.CustomerID] || 0) + 1;
  });
  readAll_('Sales').forEach(function (s) {
    if (!s.CustomerID || new Date(s.Date) < cutoff) return;
    counts[s.CustomerID] = (counts[s.CustomerID] || 0) + 1;
  });
  return counts;
}

function getCustomerProfile(token, customerId) {
  var user = requireAuth_(token);
  var customer = readAll_('Customers').find(function (c) { return c.CustomerID === customerId; });
  if (!customer) throw new Error('Customer not found.');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var orders = readAll_('Orders').filter(function (o) { return o.CustomerID === customerId; })
    .sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); })
    .map(function (o) { var c = stripRow_(o); c.ServiceName = (services[o.ServiceID] || {}).Name || ''; c.StaffName = (staffMap[o.StaffID] || {}).Name || ''; return c; });
  var appointments = readAll_('Appointments').filter(function (a) { return a.CustomerID === customerId; })
    .sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  var sales = readAll_('Sales').filter(function (s) { return s.CustomerID === customerId; })
    .sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  var measurements = readAll_('Measurements').filter(function (m) { return m.CustomerID === customerId && String(m.Active).toUpperCase() !== 'N'; })
    .map(function (m) { var c = stripRow_(m); try { c.FieldsParsed = JSON.parse(m.Fields || '{}'); } catch (e) { c.FieldsParsed = {}; } return c; })
    .sort(function (a, b) { return new Date(b.DateTaken) - new Date(a.DateTaken); });
  var reviews = readAll_('Reviews').filter(function (r) { return r.CustomerID === customerId; });
  return { customer: customer, orders: orders, appointments: appointments, sales: sales, measurements: measurements, reviews: reviews };
}

function saveCustomer(token, customer) {
  var user = requireAuth_(token);
  if (!customer.Name) throw new Error('Please enter a name.');
  if (customer.Phone) {
    var normalized = normalizeGhanaPhone_(customer.Phone);
    if (!normalized) throw new Error('Please enter a valid Ghana phone number.');
    customer.Phone = normalized;
  }
  if (customer.CustomerID) {
    return updateById_('Customers', 'CustomerID', customer.CustomerID, customer);
  }
  customer.CustomerID = nextId_('Customers', 'CustomerID');
  customer.DateJoined = nowIso_();
  customer.LoyaltyPoints = customer.LoyaltyPoints || 0;
  return appendRow_('Customers', customer);
}

/* ---- Measurement profiles ---- */

function getMeasurements(token, customerId) {
  var user = requireAuth_(token);
  var rows = readAll_('Measurements').filter(function (m) { return String(m.Active).toUpperCase() !== 'N' && (!customerId || m.CustomerID === customerId); });
  return rows.map(function (m) { var c = stripRow_(m); try { c.FieldsParsed = JSON.parse(m.Fields || '{}'); } catch (e) { c.FieldsParsed = {}; } return c; });
}

function getMeasurementTemplates() {
  return MEASUREMENT_TEMPLATES;
}

function saveMeasurement(token, measurement) {
  var user = requireAuth_(token);
  if (!measurement.CustomerID) throw new Error('A customer is required.');
  if (!measurement.ProfileName) throw new Error('Please name this measurement profile (e.g. "Wedding Suit").');
  var fields = measurement.Fields;
  if (fields && typeof fields !== 'string') fields = JSON.stringify(fields);
  var record = {
    ProfileName: measurement.ProfileName, Garment: measurement.Garment || '', Gender: measurement.Gender || '',
    Fields: fields || '{}', Notes: measurement.Notes || '', Active: 'Y',
    DateTaken: measurement.DateTaken || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'),
    TakenBy: measurement.TakenBy || user.staffId || user.username
  };
  if (measurement.MeasurementID) {
    return updateById_('Measurements', 'MeasurementID', measurement.MeasurementID, record);
  }
  record.CustomerID = measurement.CustomerID;
  record.MeasurementID = nextId_('Measurements', 'MeasurementID');
  return appendRow_('Measurements', record);
}

function deleteMeasurement(token, measurementId) {
  var user = requireAuth_(token);
  return updateById_('Measurements', 'MeasurementID', measurementId, { Active: 'N' });
}

/* ============================================================================
 * 10. APPOINTMENTS (fittings & consultations)
 * ==========================================================================*/

function getAppointments(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var rows = readAll_('Appointments');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  if (filters.status) rows = rows.filter(function (a) { return a.Status === filters.status; });
  if (filters.staffId) rows = rows.filter(function (a) { return a.StaffID === filters.staffId; });
  if (filters.dateFrom) rows = rows.filter(function (a) { return a.Date >= filters.dateFrom; });
  if (filters.dateTo) rows = rows.filter(function (a) { return a.Date <= filters.dateTo; });
  if (filters.search) {
    var q = String(filters.search).toLowerCase();
    rows = rows.filter(function (a) {
      var c = customers[a.CustomerID] || {};
      return String(c.Name).toLowerCase().indexOf(q) > -1 || String(c.Phone).indexOf(q) > -1 || String(a.Reference).toLowerCase().indexOf(q) > -1;
    });
  }
  return rows.map(function (a) {
    var c = stripRow_(a);
    c.CustomerName = (customers[a.CustomerID] || {}).Name || '';
    c.CustomerPhone = (customers[a.CustomerID] || {}).Phone || '';
    c.ServiceName = (services[a.ServiceID] || {}).Name || '';
    c.StaffName = (staffMap[a.StaffID] || {}).Name || '';
    return c;
  }).sort(function (a, b) { return new Date(b.Date + 'T' + (b.TimeSlot || '00:00')) - new Date(a.Date + 'T' + (a.TimeSlot || '00:00')); });
}

function updateAppointmentStatus(token, appointmentId, status) {
  var user = requireAuth_(token);
  if (APPOINTMENT_STATUSES.indexOf(status) === -1) throw new Error('Invalid status.');
  var appt = updateById_('Appointments', 'AppointmentID', appointmentId, { Status: status });
  if (status === 'Completed') {
    var customer = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
    var service = readAll_('Services').find(function (s) { return s.ServiceID === appt.ServiceID; });
    if (customer && service) {
      var pointsEarned = Math.round(Number(service.Price || 0) * (Number(getSettingsMap_().LoyaltyPointsPerCedi) || 0));
      if (pointsEarned) updateById_('Customers', 'CustomerID', customer.CustomerID, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + pointsEarned });
      sendCompletionThankYou_(appt, customer, service, pointsEarned);
    }
  } else if (status === 'Confirmed' || status === 'Cancelled' || status === 'No-Show') {
    var cust = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
    if (cust) sendAppointmentStatusUpdate_(appt, cust, status);
  }
  return appt;
}

function rescheduleAppointment(token, appointmentId, date, timeSlot) {
  var user = requireAuth_(token);
  var appt = readAll_('Appointments').find(function (a) { return a.AppointmentID === appointmentId; });
  if (!appt) throw new Error('Appointment not found.');
  if (!isSlotAvailable_(appt.BranchID, appt.StaffID, date, timeSlot)) throw new Error('That time slot is not available.');
  return updateById_('Appointments', 'AppointmentID', appointmentId, { Date: date, TimeSlot: timeSlot });
}

function verifyAppointmentPayment(token, appointmentId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  return updateById_('Appointments', 'AppointmentID', appointmentId, { PaymentStatus: 'Verified' });
}

function createAppointmentAdmin(token, data) {
  var user = requireAuth_(token);
  var branch = readAll_('Branches')[0];
  var customer = data.customerId
    ? readAll_('Customers').find(function (c) { return c.CustomerID === data.customerId; })
    : findOrCreateCustomerByPhone_(data.name, normalizeGhanaPhone_(data.phone), data.email);
  if (!customer) throw new Error('Customer not found.');
  var reference = 'BK' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  var appt = {
    AppointmentID: nextId_('Appointments', 'AppointmentID'), Reference: reference, CustomerID: customer.CustomerID,
    StaffID: data.staffId, ServiceID: data.serviceId, BranchID: branch.BranchID, Date: data.date, TimeSlot: data.timeSlot,
    Type: APPOINTMENT_TYPES.indexOf(data.type) > -1 ? data.type : 'Consultation',
    Status: data.status || 'Confirmed', CreatedAt: nowIso_(), Notes: data.notes || '',
    PaymentMethod: data.paymentMethod || '', PaymentStatus: data.paymentStatus || 'Pending', PaymentProofURL: ''
  };
  appendRow_('Appointments', appt);
  return appt;
}

/* ============================================================================
 * 11. ORDERS (bespoke garment production)
 * ==========================================================================*/

function getOrderStatuses() { return ORDER_STATUSES; }

function getOrders(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var rows = readAll_('Orders');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  if (filters.status) rows = rows.filter(function (o) { return o.Status === filters.status; });
  if (filters.staffId) rows = rows.filter(function (o) { return o.StaffID === filters.staffId; });
  if (filters.customerId) rows = rows.filter(function (o) { return o.CustomerID === filters.customerId; });
  if (filters.dateFrom) rows = rows.filter(function (o) { return o.OrderDate >= filters.dateFrom; });
  if (filters.dateTo) rows = rows.filter(function (o) { return o.OrderDate <= filters.dateTo; });
  if (filters.search) {
    var q = String(filters.search).toLowerCase();
    rows = rows.filter(function (o) {
      var c = customers[o.CustomerID] || {};
      return String(c.Name).toLowerCase().indexOf(q) > -1 || String(c.Phone).indexOf(q) > -1 || String(o.Reference).toLowerCase().indexOf(q) > -1;
    });
  }
  return rows.map(function (o) {
    var c = stripRow_(o);
    c.CustomerName = (customers[o.CustomerID] || {}).Name || '';
    c.CustomerPhone = (customers[o.CustomerID] || {}).Phone || '';
    c.ServiceName = (services[o.ServiceID] || {}).Name || '';
    c.StaffName = (staffMap[o.StaffID] || {}).Name || '';
    c.Balance = round2_(Number(o.Price || 0) - Number(o.AmountPaid || 0));
    return c;
  }).sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); });
}

function getOrder(token, orderId) {
  var user = requireAuth_(token);
  var o = readAll_('Orders').find(function (r) { return r.OrderID === orderId; });
  if (!o) throw new Error('Order not found.');
  var measurement = o.MeasurementID ? readAll_('Measurements').find(function (m) { return m.MeasurementID === o.MeasurementID; }) : null;
  return { order: stripRow_(o), measurement: measurement ? stripRow_(measurement) : null };
}

/** Creates or updates a bespoke garment order. Deposit/balance and PaymentStatus are recomputed from Price/AmountPaid. */
function saveOrder(token, order) {
  var user = requireAuth_(token);
  if (!order.CustomerID) throw new Error('Please choose a customer.');
  if (!order.ServiceID) throw new Error('Please choose a garment/service.');
  if (!order.DueDate) throw new Error('Please choose a due date.');
  var branch = readAll_('Branches')[0];
  var price = round2_(Number(order.Price || 0));
  var amountPaid = round2_(Number(order.AmountPaid || 0));
  var record = {
    CustomerID: order.CustomerID, StaffID: order.StaffID || '', ServiceID: order.ServiceID, BranchID: branch.BranchID,
    MeasurementID: order.MeasurementID || '', DueDate: order.DueDate, FabricSource: order.FabricSource || 'Shop-provided',
    FabricDetails: order.FabricDetails || '', Quantity: order.Quantity || 1, Price: price,
    DepositAmount: round2_(Number(order.DepositAmount || 0)), AmountPaid: amountPaid,
    PaymentMethod: order.PaymentMethod || '', DesignImageURL: order.DesignImageURL || '', Notes: order.Notes || '',
    PaymentStatus: amountPaid <= 0 ? 'Unpaid' : (amountPaid >= price ? 'Paid' : 'Partially Paid')
  };
  if (order.OrderID) {
    if (order.Status) record.Status = order.Status;
    return updateById_('Orders', 'OrderID', order.OrderID, record);
  }
  record.OrderID = nextId_('Orders', 'OrderID');
  record.Reference = 'ORD' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  record.OrderDate = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  record.Status = order.Status || 'Order Received';
  record.CreatedAt = nowIso_();
  record.DeliveredAt = '';
  return appendRow_('Orders', record);
}

/** Advances (or reverts) an order's production stage, notifying the customer and awarding loyalty points on delivery. */
function updateOrderStatus(token, orderId, status) {
  var user = requireAuth_(token);
  if (ORDER_STATUSES.indexOf(status) === -1) throw new Error('Invalid order status.');
  var updates = { Status: status };
  if (status === 'Delivered') updates.DeliveredAt = nowIso_();
  var order = updateById_('Orders', 'OrderID', orderId, updates);

  var customer = readAll_('Customers').find(function (c) { return c.CustomerID === order.CustomerID; });
  var service = readAll_('Services').find(function (s) { return s.ServiceID === order.ServiceID; });
  if (customer) {
    if (status === 'Delivered') {
      var pointsEarned = Math.round(Number(order.Price || 0) * (Number(getSettingsMap_().LoyaltyPointsPerCedi) || 0));
      if (pointsEarned) updateById_('Customers', 'CustomerID', customer.CustomerID, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + pointsEarned });
      sendOrderStatusUpdate_(order, customer, service, status, pointsEarned);
    } else {
      sendOrderStatusUpdate_(order, customer, service, status, 0);
    }
  }
  return order;
}

/** Records a payment (deposit or balance) against an order. */
function recordOrderPayment(token, orderId, amount, method) {
  var user = requireAuth_(token);
  var order = readAll_('Orders').find(function (o) { return o.OrderID === orderId; });
  if (!order) throw new Error('Order not found.');
  amount = Number(amount);
  if (!amount || amount <= 0) throw new Error('Please enter a valid payment amount.');
  var newPaid = round2_(Number(order.AmountPaid || 0) + amount);
  var price = Number(order.Price || 0);
  var status = newPaid <= 0 ? 'Unpaid' : (newPaid >= price ? 'Paid' : 'Partially Paid');
  return updateById_('Orders', 'OrderID', orderId, { AmountPaid: newPaid, PaymentMethod: method || order.PaymentMethod, PaymentStatus: status });
}

/* ============================================================================
 * 12. POINT OF SALE (POS) / SALES
 *
 * Used for over-the-counter sales that aren't a bespoke production order —
 * fabric sold by the yard, accessories, notions, or ready-to-wear pieces.
 * ==========================================================================*/

/**
 * Shared core behind both the admin POS (createSale) and the public online
 * Shop checkout (createPublicSale): validates stock, computes totals,
 * writes the Sales row, decrements inventory, and awards loyalty points.
 * `opts.source` is 'POS' or 'Online'; `opts.staffId`/`opts.paymentStatus`/
 * `opts.fulfillmentStatus`/`opts.reference` let each caller fill in the
 * fields only it knows about.
 */
function createSale_(sale, opts) {
  sale = sale || {}; opts = opts || {};
  var items = sale.items || [];
  if (!items.length) throw new Error('Cart is empty.');
  var branch = readAll_('Branches')[0];

  var products = keyBy_(readAll_('Products'), 'ProductID');
  var subtotal = 0;
  items.forEach(function (item) {
    var product = products[item.productId];
    if (!product) throw new Error('Item not found: ' + item.productId);
    var stock = Number(product.QuantityInStock || 0);
    if (stock < item.qty) throw new Error('Not enough stock for ' + product.Name + ' (only ' + stock + ' left).');
    subtotal += Number(product.SellingPrice) * Number(item.qty);
  });

  var settings = getSettingsMap_();
  var discount = round2_(Number(sale.discount || 0));
  var taxRate = Number(settings.TaxRatePercent) || 0;
  var taxable = Math.max(0, subtotal - discount);
  var tax = round2_(taxable * taxRate / 100);
  var total = round2_(taxable + tax);

  var customer = null;
  if (sale.customerId) {
    customer = readAll_('Customers').find(function (c) { return c.CustomerID === sale.customerId; });
  } else if (sale.customerPhone) {
    customer = findOrCreateCustomerByPhone_(sale.customerName, normalizeGhanaPhone_(sale.customerPhone), sale.customerEmail);
  }

  var record = {
    SaleID: nextId_('Sales', 'SaleID'), Date: nowIso_(), BranchID: branch.BranchID,
    CustomerID: customer ? customer.CustomerID : '', StaffID: opts.staffId || '',
    Items: JSON.stringify(items.map(function (item) { var p = products[item.productId]; return { productId: item.productId, name: p.Name, qty: item.qty, price: Number(p.SellingPrice) }; })),
    Subtotal: round2_(subtotal), Discount: discount, Tax: tax, Total: total,
    PaymentMethod: sale.paymentMethod || 'Cash', PaymentStatus: opts.paymentStatus || 'Paid',
    Reference: opts.reference || '', PaymentProofURL: sale.paymentProofUrl || '',
    Source: opts.source || 'POS', FulfillmentStatus: opts.fulfillmentStatus || ''
  };
  appendRow_('Sales', record);

  items.forEach(function (item) {
    var product = products[item.productId];
    updateById_('Products', 'ProductID', item.productId, { QuantityInStock: Number(product.QuantityInStock) - Number(item.qty) });
  });

  var pointsEarned = 0;
  if (customer && record.PaymentStatus === 'Paid') {
    pointsEarned = Math.round(total * (Number(settings.LoyaltyPointsPerCedi) || 0));
    if (pointsEarned) updateById_('Customers', 'CustomerID', customer.CustomerID, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + pointsEarned });
  }

  return { record: record, customer: customer, pointsEarned: pointsEarned, itemsParsed: JSON.parse(record.Items) };
}

/** Admin/staff POS checkout — paid in full immediately, at the counter. */
function createSale(token, sale) {
  var user = requireAuth_(token);
  var result = createSale_(sale, { source: 'POS', staffId: sale.staffId || user.staffId || '', paymentStatus: 'Paid' });
  if (result.customer) sendSaleReceipt_(result.record, result.customer, result.itemsParsed, result.pointsEarned);
  return { sale: result.record, pointsEarned: result.pointsEarned };
}

/**
 * Public online Shop checkout — no login required. Cash orders are marked
 * payable on pickup; mobile money/bank orders start "Awaiting Verification"
 * until staff confirm the payment actually landed (see verifySalePayment),
 * at which point loyalty points are awarded and a receipt is sent.
 */
function createPublicSale(sale) {
  sale = sale || {};
  var name = String(sale.customerName || '').trim();
  var phone = normalizeGhanaPhone_(sale.customerPhone);
  if (!name) throw new Error('Please enter your name.');
  if (!phone) throw new Error('Please enter a valid Ghana phone number.');
  var customer = findOrCreateCustomerByPhone_(name, phone, sale.customerEmail);
  sale.customerId = customer.CustomerID;

  var reference = 'SHP' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  var paymentStatus = (sale.paymentMethod && sale.paymentMethod !== 'Cash') ? 'Awaiting Verification' : 'Pay on Pickup';
  var result = createSale_(sale, { source: 'Online', paymentStatus: paymentStatus, fulfillmentStatus: 'Processing', reference: reference });
  sendShopOrderConfirmation_(result.record, result.customer, result.itemsParsed);
  return { reference: reference, sale: result.record };
}

function getSales(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var rows = readAll_('Sales').map(withParsedItems_);
  if (filters.dateFrom) rows = rows.filter(function (s) { return s.Date >= filters.dateFrom; });
  if (filters.dateTo) rows = rows.filter(function (s) { return s.Date <= filters.dateTo + 'T23:59:59'; });
  if (filters.source) rows = rows.filter(function (s) { return s.Source === filters.source; });
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  rows.forEach(function (s) { s.CustomerName = (customers[s.CustomerID] || {}).Name || 'Walk-in'; s.CustomerPhone = (customers[s.CustomerID] || {}).Phone || ''; s.StaffName = (staffMap[s.StaffID] || {}).Name || ''; });
  return rows.sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
}

/** Admin listing of online Shop orders specifically (as opposed to over-the-counter POS sales). */
function getOnlineSales(token, filters) {
  filters = Object.assign({}, filters || {}, { source: 'Online' });
  return getSales(token, filters);
}

/** Staff confirm a mobile money/bank payment actually arrived (checked manually against the shop's own momo/bank statement). Awards loyalty points and sends the receipt, same as an instantly-paid sale. */
function verifySalePayment(token, saleId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var sale = readAll_('Sales').find(function (s) { return s.SaleID === saleId; });
  if (!sale) throw new Error('Order not found.');
  var updated = updateById_('Sales', 'SaleID', saleId, { PaymentStatus: 'Paid' });
  var customer = sale.CustomerID ? readAll_('Customers').find(function (c) { return c.CustomerID === sale.CustomerID; }) : null;
  var pointsEarned = 0;
  if (customer) {
    var settings = getSettingsMap_();
    pointsEarned = Math.round(Number(sale.Total || 0) * (Number(settings.LoyaltyPointsPerCedi) || 0));
    if (pointsEarned) updateById_('Customers', 'CustomerID', customer.CustomerID, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + pointsEarned });
    sendSaleReceipt_(updated, customer, JSON.parse(updated.Items || '[]'), pointsEarned);
  }
  return updated;
}

/** Advances a Shop order's fulfillment stage and notifies the customer. */
function updateSaleFulfillment(token, saleId, status) {
  var user = requireAuth_(token);
  if (SALE_FULFILLMENT_STATUSES.indexOf(status) === -1) throw new Error('Invalid status.');
  var sale = updateById_('Sales', 'SaleID', saleId, { FulfillmentStatus: status });
  if (sale.CustomerID) {
    var customer = readAll_('Customers').find(function (c) { return c.CustomerID === sale.CustomerID; });
    if (customer) sendShopOrderStatusUpdate_(sale, customer, status);
  }
  return sale;
}

function withParsedItems_(saleRow) {
  var c = stripRow_(saleRow);
  try { c.ItemsParsed = JSON.parse(saleRow.Items || '[]'); } catch (e) { c.ItemsParsed = []; }
  return c;
}

/* ============================================================================
 * 13. INVENTORY (fabrics & accessories)
 * ==========================================================================*/

function getProducts(token, branchId) {
  var user = requireAuth_(token);
  var rows = readAll_('Products');
  withImageDataUris_(rows, 'ImageURL');
  return rows;
}

function saveProduct(token, product) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (!product.Name) throw new Error('Please enter a product name.');
  var branch = readAll_('Branches')[0];
  product.BranchID = branch.BranchID;
  product.ShowOnWebsite = product.ShowOnWebsite === 'Y' ? 'Y' : 'N';
  if (product.ProductID) {
    return updateById_('Products', 'ProductID', product.ProductID, product);
  }
  product.ProductID = nextId_('Products', 'ProductID');
  return appendRow_('Products', product);
}

function deleteProduct(token, productId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Products', 'ProductID', productId);
}

function restockProduct(token, productId, qty) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var product = readAll_('Products').find(function (p) { return p.ProductID === productId; });
  if (!product) throw new Error('Product not found.');
  return updateById_('Products', 'ProductID', productId, { QuantityInStock: Number(product.QuantityInStock || 0) + Number(qty) });
}

function getLowStockProducts(token, branchId) {
  var user = requireAuth_(token);
  return readAll_('Products').filter(function (p) { return Number(p.QuantityInStock) <= Number(p.ReorderLevel); });
}

/** Public: ready-to-wear items the Owner has chosen to sell straight from the website (Products.ShowOnWebsite = 'Y'), in stock. */
function getShopProducts() {
  var rows = readAll_('Products').filter(function (p) { return String(p.ShowOnWebsite).toUpperCase() === 'Y'; });
  withImageDataUris_(rows, 'ImageURL');
  return rows;
}

/* ============================================================================
 * 14. EXPENSES
 * ==========================================================================*/

function getExpenses(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var rows = readAll_('Expenses');
  if (filters.dateFrom) rows = rows.filter(function (e) { return e.Date >= filters.dateFrom; });
  if (filters.dateTo) rows = rows.filter(function (e) { return e.Date <= filters.dateTo; });
  return rows.sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
}

function saveExpense(token, expense) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (!expense.Amount || !expense.Category) throw new Error('Please enter a category and amount.');
  var branch = readAll_('Branches')[0];
  expense.BranchID = branch.BranchID;
  expense.Amount = round2_(Number(expense.Amount));
  if (expense.ExpenseID) return updateById_('Expenses', 'ExpenseID', expense.ExpenseID, expense);
  expense.ExpenseID = nextId_('Expenses', 'ExpenseID');
  expense.Date = expense.Date || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  return appendRow_('Expenses', expense);
}

function deleteExpense(token, expenseId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Expenses', 'ExpenseID', expenseId);
}

/* ============================================================================
 * 15. USERS MANAGEMENT
 * ==========================================================================*/

function getUsers(token) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return readAll_('Users').map(function (u) { var c = stripRow_(u); delete c.PasswordHash; delete c.Salt; return c; });
}

function saveUser(token, userData) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  if (!userData.Username) throw new Error('Please enter a username.');
  if (ROLES.indexOf(userData.Role) === -1) throw new Error('Invalid role.');

  var existing = readAll_('Users').find(function (u) { return u.Username === userData.Username; });
  var record = {
    Role: userData.Role, BranchID: userData.BranchID || 'BR-0001', Active: userData.Active || 'Y',
    StaffID: userData.StaffID || '', Email: userData.Email || '', Phone: userData.Phone ? (normalizeGhanaPhone_(userData.Phone) || userData.Phone) : '',
    FullName: userData.FullName || ''
  };
  if (existing) {
    if (userData.newPassword) {
      var salt = Utilities.getUuid();
      record.PasswordHash = hashPassword_(userData.newPassword, salt);
      record.Salt = salt;
    }
    return updateById_('Users', 'Username', userData.Username, record);
  }
  if (!userData.newPassword || userData.newPassword.length < 6) throw new Error('Please set a password of at least 6 characters.');
  var newSalt = Utilities.getUuid();
  record.Username = userData.Username;
  record.PasswordHash = hashPassword_(userData.newPassword, newSalt);
  record.Salt = newSalt;
  return appendRow_('Users', record);
}

function deleteUser(token, username) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  if (username === user.username) throw new Error('You cannot delete your own account.');
  return deleteById_('Users', 'Username', username);
}

function changeOwnPassword(token, oldPassword, newPassword) {
  var user = requireAuth_(token);
  var record = readAll_('Users').find(function (u) { return u.Username === user.username; });
  if (!record) throw new Error('Account not found.');
  if (hashPassword_(oldPassword, record.Salt) !== record.PasswordHash) throw new Error('Current password is incorrect.');
  if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  var salt = Utilities.getUuid();
  updateById_('Users', 'Username', user.username, { PasswordHash: hashPassword_(newPassword, salt), Salt: salt });
  return { message: 'Password updated.' };
}

/* ============================================================================
 * 16. REVIEWS
 * ==========================================================================*/

function getReviews(token) {
  var user = requireAuth_(token);
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  return readAll_('Reviews').map(function (r) {
    var c = stripRow_(r);
    c.CustomerName = (customers[r.CustomerID] || {}).Name || '';
    c.StaffName = (staffMap[r.StaffID] || {}).Name || '';
    return c;
  }).sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
}

function deleteReview(token, reviewId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Reviews', 'ReviewID', reviewId);
}

/* ============================================================================
 * 17. SETTINGS / THEME / BRANDING
 * ==========================================================================*/

function getSettingsMap_() {
  var rows = readAll_('Settings');
  var map = {};
  rows.forEach(function (r) { map[r.Key] = r.Value; });
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { if (!(k in map)) map[k] = DEFAULT_SETTINGS[k]; });
  return map;
}

function getSettings(token) {
  var user = requireAuth_(token);
  return getSettingsMap_();
}

function updateSettings(token, settingsObj) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var existing = readAll_('Settings');
  var byKey = keyBy_(existing, 'Key');
  Object.keys(settingsObj).forEach(function (key) {
    if (!(key in DEFAULT_SETTINGS)) return;
    var value = settingsObj[key];
    if (byKey[key]) {
      updateById_('Settings', 'Key', key, { Value: value });
    } else {
      appendRow_('Settings', { Key: key, Value: value });
    }
  });
  return getSettingsMap_();
}

/* ============================================================================
 * 18. HERO CAROUSEL, GALLERY, VIDEOS & IMAGE UPLOADS
 * ==========================================================================*/

function getHeroSlides(token) {
  var user = requireAuth_(token);
  var rows = readAll_('HeroSlides').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  withImageDataUris_(rows, 'ImageURL');
  return rows;
}

function saveHeroSlide(token, slide) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (slide.SlideID) return updateById_('HeroSlides', 'SlideID', slide.SlideID, slide);
  slide.SlideID = nextId_('HeroSlides', 'SlideID');
  slide.SortOrder = slide.SortOrder || (readAll_('HeroSlides').length + 1);
  slide.Active = slide.Active || 'Y';
  return appendRow_('HeroSlides', slide);
}

function deleteHeroSlide(token, slideId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('HeroSlides', 'SlideID', slideId);
}

function getGallery(token) {
  var user = requireAuth_(token);
  var rows = readAll_('Gallery').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  withImageDataUris_(rows, 'ImageURL');
  return rows;
}

function saveGalleryItem(token, item) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var branch = readAll_('Branches')[0];
  item.BranchID = branch.BranchID;
  if (item.GalleryID) return updateById_('Gallery', 'GalleryID', item.GalleryID, item);
  item.GalleryID = nextId_('Gallery', 'GalleryID');
  item.SortOrder = item.SortOrder || (readAll_('Gallery').length + 1);
  item.Active = item.Active || 'Y';
  return appendRow_('Gallery', item);
}

function deleteGalleryItem(token, galleryId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Gallery', 'GalleryID', galleryId);
}

function getVideos(token) {
  var user = requireAuth_(token);
  return readAll_('Videos').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
}

function saveVideo(token, item) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (item.VideoID) return updateById_('Videos', 'VideoID', item.VideoID, item);
  item.VideoID = nextId_('Videos', 'VideoID');
  item.SortOrder = item.SortOrder || (readAll_('Videos').length + 1);
  item.Active = item.Active || 'Y';
  return appendRow_('Videos', item);
}

function deleteVideo(token, videoId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Videos', 'VideoID', videoId);
}

/** Authenticated image upload from the admin UI — used for staff photos, service/product/gallery/hero images, logo, and design reference photos. */
function uploadImage(token, base64Data, filename, mimeType) {
  var user = requireAuth_(token);
  return uploadImageToDrive_(base64Data, filename, mimeType);
}

/** Unauthenticated upload used only for a customer-submitted mobile money payment screenshot during public booking. */
function uploadPaymentProof(base64Data, filename, mimeType) {
  return uploadImageToDrive_(base64Data, filename, mimeType);
}

function uploadImageToDrive_(base64Data, filename, mimeType) {
  var folder = getOrCreateUploadFolder_();
  var bytes = Utilities.base64Decode(base64Data.split(',').pop());
  var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || ('upload_' + Date.now()));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: getAppUrl_() + '?img=' + file.getId(), fileId: file.getId() };
}

function getOrCreateUploadFolder_() {
  var folders = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

function getUploadFolderUrl(token) {
  var user = requireAuth_(token);
  return getOrCreateUploadFolder_().getUrl();
}

/* ============================================================================
 * 19. DASHBOARD, REPORTS & EXPORTS
 * ==========================================================================*/

function getDashboardOverview(token, branchId) {
  var user = requireAuth_(token);
  var todayStr = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var monday = mondayOf_(todayStr);
  var monthStart = todayStr.slice(0, 7) + '-01';

  var orders = readAll_('Orders');
  var appointments = readAll_('Appointments');
  var sales = readAll_('Sales');
  var expenses = readAll_('Expenses');
  var products = readAll_('Products');
  var customers = readAll_('Customers');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');

  var ordersByStatus = {};
  ORDER_STATUSES.forEach(function (s) { ordersByStatus[s] = 0; });
  orders.forEach(function (o) { ordersByStatus[o.Status] = (ordersByStatus[o.Status] || 0) + 1; });

  var revenueToday = 0, revenueWeek = 0, revenueMonth = 0;
  sales.forEach(function (s) {
    var d = String(s.Date).slice(0, 10);
    if (d === todayStr) revenueToday += Number(s.Total || 0);
    if (d >= monday) revenueWeek += Number(s.Total || 0);
    if (d >= monthStart) revenueMonth += Number(s.Total || 0);
  });
  // Deposits taken at order creation are counted toward revenue using the
  // order's creation date — an approximation, since a later top-up payment
  // (recordOrderPayment) isn't individually dated in this schema.
  orders.forEach(function (o) {
    var d = String(o.OrderDate).slice(0, 10);
    var amt = Number(o.DepositAmount || 0);
    if (d === todayStr) revenueToday += amt;
    if (d >= monday) revenueWeek += amt;
    if (d >= monthStart) revenueMonth += amt;
  });

  var expenseMonth = 0;
  expenses.forEach(function (e) { if (String(e.Date).slice(0, 10) >= monthStart) expenseMonth += Number(e.Amount || 0); });

  var todaysAppointments = appointments.filter(function (a) { return a.Date === todayStr && a.Status !== 'Cancelled'; })
    .map(function (a) { var c = stripRow_(a); c.ServiceName = (services[a.ServiceID] || {}).Name || ''; c.StaffName = (staffMap[a.StaffID] || {}).Name || ''; return c; })
    .sort(function (a, b) { return a.TimeSlot.localeCompare(b.TimeSlot); });

  var dueSoon = orders.filter(function (o) { return o.Status !== 'Delivered' && o.Status !== 'Cancelled' && o.DueDate && o.DueDate <= addDays_(todayStr, 5); })
    .sort(function (a, b) { return new Date(a.DueDate) - new Date(b.DueDate); })
    .map(function (o) { var c = stripRow_(o); c.ServiceName = (services[o.ServiceID] || {}).Name || ''; return c; });

  var lowStock = products.filter(function (p) { return Number(p.QuantityInStock) <= Number(p.ReorderLevel); });

  var recentOrders = orders.sort(function (a, b) { return new Date(b.CreatedAt) - new Date(a.CreatedAt); }).slice(0, 8)
    .map(function (o) { var c = stripRow_(o); c.ServiceName = (services[o.ServiceID] || {}).Name || ''; var cust = customers.find(function (x) { return x.CustomerID === o.CustomerID; }); c.CustomerName = cust ? cust.Name : ''; return c; });

  return {
    ordersByStatus: ordersByStatus, totalOrders: orders.length, activeOrders: orders.length - (ordersByStatus['Delivered'] || 0) - (ordersByStatus['Cancelled'] || 0),
    revenueToday: round2_(revenueToday), revenueWeek: round2_(revenueWeek), revenueMonth: round2_(revenueMonth),
    expenseMonth: round2_(expenseMonth), netMonth: round2_(revenueMonth - expenseMonth),
    todaysAppointments: todaysAppointments, dueSoon: dueSoon, lowStock: lowStock, recentOrders: recentOrders,
    totalCustomers: customers.length
  };
}

function mondayOf_(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  var day = d.getDay();
  var diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
}

function getNotificationBell(token, branchId) {
  var user = requireAuth_(token);
  var todayStr = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var pendingAppointments = readAll_('Appointments').filter(function (a) { return a.Status === 'Pending'; }).length;
  var dueSoon = readAll_('Orders').filter(function (o) { return o.Status !== 'Delivered' && o.Status !== 'Cancelled' && o.DueDate && o.DueDate <= addDays_(todayStr, 2); }).length;
  var lowStock = readAll_('Products').filter(function (p) { return Number(p.QuantityInStock) <= Number(p.ReorderLevel); }).length;
  return { pendingAppointments: pendingAppointments, dueSoon: dueSoon, lowStock: lowStock, total: pendingAppointments + dueSoon + lowStock };
}

function getIncomeExpenseSummary(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var dateFrom = filters.dateFrom || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-01');
  var dateTo = filters.dateTo || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  var salesTotal = 0;
  readAll_('Sales').forEach(function (s) { var d = String(s.Date).slice(0, 10); if (d >= dateFrom && d <= dateTo) salesTotal += Number(s.Total || 0); });

  var ordersTotal = 0;
  readAll_('Orders').forEach(function (o) { if (o.Status === 'Cancelled') return; var d = String(o.OrderDate).slice(0, 10); if (d >= dateFrom && d <= dateTo) ordersTotal += Number(o.AmountPaid || 0); });

  var expensesTotal = 0;
  readAll_('Expenses').forEach(function (e) { var d = String(e.Date).slice(0, 10); if (d >= dateFrom && d <= dateTo) expensesTotal += Number(e.Amount || 0); });

  return { income: round2_(salesTotal + ordersTotal), salesIncome: round2_(salesTotal), orderIncome: round2_(ordersTotal), expenses: round2_(expensesTotal), net: round2_(salesTotal + ordersTotal - expensesTotal) };
}

function getReports(token, params) {
  var user = requireAuth_(token);
  params = params || {};
  var dateFrom = params.dateFrom || Utilities.formatDate(new Date(new Date().setDate(new Date().getDate() - 30)), TIMEZONE, 'yyyy-MM-dd');
  var dateTo = params.dateTo || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  var sales = readAll_('Sales').filter(function (s) { var d = String(s.Date).slice(0, 10); return d >= dateFrom && d <= dateTo; });
  var orders = readAll_('Orders').filter(function (o) { var d = String(o.OrderDate).slice(0, 10); return d >= dateFrom && d <= dateTo; });
  var expenses = readAll_('Expenses').filter(function (e) { return e.Date >= dateFrom && e.Date <= dateTo; });
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');

  var byDay = {};
  sales.forEach(function (s) { var d = String(s.Date).slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(s.Total || 0); });
  orders.forEach(function (o) { var d = String(o.OrderDate).slice(0, 10); byDay[d] = (byDay[d] || 0) + Number(o.DepositAmount || 0); });
  var revenueByDay = Object.keys(byDay).sort().map(function (d) { return { date: d, amount: round2_(byDay[d]) }; });

  var byService = {};
  orders.forEach(function (o) { var name = (services[o.ServiceID] || {}).Name || 'Other'; byService[name] = (byService[name] || 0) + Number(o.Price || 0); });
  var revenueByService = Object.keys(byService).map(function (k) { return { name: k, amount: round2_(byService[k]) }; }).sort(function (a, b) { return b.amount - a.amount; });

  var byStaff = {};
  orders.forEach(function (o) { var name = (staffMap[o.StaffID] || {}).Name || 'Unassigned'; byStaff[name] = (byStaff[name] || 0) + Number(o.Price || 0); });
  var revenueByStaff = Object.keys(byStaff).map(function (k) { return { name: k, amount: round2_(byStaff[k]) }; }).sort(function (a, b) { return b.amount - a.amount; });

  return {
    dateFrom: dateFrom, dateTo: dateTo,
    totalSalesRevenue: round2_(sales.reduce(function (sum, s) { return sum + Number(s.Total || 0); }, 0)),
    totalOrdersValue: round2_(orders.reduce(function (sum, o) { return o.Status === 'Cancelled' ? sum : sum + Number(o.Price || 0); }, 0)),
    totalOrdersCollected: round2_(orders.reduce(function (sum, o) { return sum + Number(o.AmountPaid || 0); }, 0)),
    totalExpenses: round2_(expenses.reduce(function (sum, e) { return sum + Number(e.Amount || 0); }, 0)),
    ordersCompleted: orders.filter(function (o) { return o.Status === 'Delivered'; }).length,
    ordersCancelled: orders.filter(function (o) { return o.Status === 'Cancelled'; }).length,
    revenueByDay: revenueByDay, revenueByService: revenueByService, revenueByStaff: revenueByStaff,
    paymentBreakdown: paymentBreakdown_(sales)
  };
}

function paymentBreakdown_(sales) {
  var map = {};
  sales.forEach(function (s) { map[s.PaymentMethod] = (map[s.PaymentMethod] || 0) + Number(s.Total || 0); });
  return Object.keys(map).map(function (k) { return { method: k, amount: round2_(map[k]) }; });
}

function exportSalesCsv(token, params) {
  var user = requireAuth_(token);
  var rows = getSales(token, params || {});
  var header = ['SaleID', 'Date', 'Customer', 'Staff', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethod'];
  var lines = [header.join(',')];
  rows.forEach(function (s) { lines.push([s.SaleID, s.Date, s.CustomerName, s.StaffName, s.Subtotal, s.Discount, s.Tax, s.Total, s.PaymentMethod].map(csvEscape_).join(',')); });
  return lines.join('\n');
}

function exportOrdersCsv(token, params) {
  var user = requireAuth_(token);
  var rows = getOrders(token, params || {});
  var header = ['OrderID', 'Reference', 'Customer', 'Service', 'Staff', 'OrderDate', 'DueDate', 'Status', 'Price', 'AmountPaid', 'Balance', 'PaymentStatus'];
  var lines = [header.join(',')];
  rows.forEach(function (o) { lines.push([o.OrderID, o.Reference, o.CustomerName, o.ServiceName, o.StaffName, o.OrderDate, o.DueDate, o.Status, o.Price, o.AmountPaid, o.Balance, o.PaymentStatus].map(csvEscape_).join(',')); });
  return lines.join('\n');
}

function exportExpensesCsv(token, filters) {
  var user = requireAuth_(token);
  var rows = getExpenses(token, filters || {});
  var header = ['ExpenseID', 'Date', 'Category', 'Amount', 'Description'];
  var lines = [header.join(',')];
  rows.forEach(function (e) { lines.push([e.ExpenseID, e.Date, e.Category, e.Amount, e.Description].map(csvEscape_).join(',')); });
  return lines.join('\n');
}

function csvEscape_(val) {
  var s = String(val === undefined || val === null ? '' : val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportReportPdf(token, params) {
  var user = requireAuth_(token);
  var report = getReports(token, params);
  var settings = getSettingsMap_();
  var html = '<html><body style="font-family:Arial,sans-serif;padding:24px;">' +
    '<h1>' + esc_(settings.BusinessName) + ' — Report</h1>' +
    '<p>' + esc_(report.dateFrom) + ' to ' + esc_(report.dateTo) + '</p>' +
    '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;">' +
    '<tr><td>Sales Revenue</td><td>' + CURRENCY_SYMBOL + report.totalSalesRevenue + '</td></tr>' +
    '<tr><td>Orders Value</td><td>' + CURRENCY_SYMBOL + report.totalOrdersValue + '</td></tr>' +
    '<tr><td>Orders Collected</td><td>' + CURRENCY_SYMBOL + report.totalOrdersCollected + '</td></tr>' +
    '<tr><td>Expenses</td><td>' + CURRENCY_SYMBOL + report.totalExpenses + '</td></tr>' +
    '<tr><td>Orders Completed</td><td>' + report.ordersCompleted + '</td></tr>' +
    '</table></body></html>';
  var blob = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf');
  return { base64: Utilities.base64Encode(blob.getBytes()), filename: 'AdvanceTailor_Report_' + report.dateFrom + '_to_' + report.dateTo + '.pdf' };
}

function getVisitorStats(token) {
  var user = requireAuth_(token);
  var visits = readAll_('Visits');
  var byDay = {};
  visits.forEach(function (v) { byDay[v.Date] = (byDay[v.Date] || 0) + 1; });
  return Object.keys(byDay).sort().slice(-30).map(function (d) { return { date: d, count: byDay[d] }; });
}

/* ============================================================================
 * 20. NOTIFICATIONS (SMS + EMAIL)
 * ==========================================================================*/

function logNotification_(type, recipient, message, status) {
  try {
    appendRow_('Notifications', { NotificationID: nextId_('Notifications', 'NotificationID'), Type: type, Recipient: recipient, Message: message, Status: status, Date: nowIso_() });
  } catch (e) { /* never let logging break the caller */ }
}

function getSmsStats(token) {
  var user = requireAuth_(token);
  var rows = readAll_('Notifications');
  var sent = rows.filter(function (n) { return n.Type === 'SMS' && n.Status === 'Sent'; }).length;
  var failed = rows.filter(function (n) { return n.Type === 'SMS' && n.Status === 'Failed'; }).length;
  return { sent: sent, failed: failed, balance: getSmsBalance_(), recent: rows.filter(function (n) { return n.Type === 'SMS'; }).sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); }).slice(0, 50) };
}

function getSmsBalance_() {
  var settings = getSettingsMap_();
  if (settings.SmsProvider === 'simulate' || !settings.SmsApiKey) return null;
  try {
    if (settings.SmsProvider === 'arkesel') {
      var res = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/clients/balance-details', { headers: { 'api-key': settings.SmsApiKey }, muteHttpExceptions: true });
      var body = JSON.parse(res.getContentText());
      return body && body.data ? body.data.sms_balance : null;
    }
  } catch (e) { /* balance display is best-effort */ }
  return null;
}

function sendStaffSms(token, staffIds, message) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var staff = readAll_('Staff').filter(function (s) { return staffIds.indexOf(s.StaffID) > -1; });
  staff.forEach(function (s) { if (s.Phone) sendSms_(s.Phone, message); });
  return { sent: staff.length };
}

function sendEmail_(email, subject, plainBody, htmlBody) {
  if (!email) return;
  try {
    MailApp.sendEmail({ to: email, subject: subject, body: plainBody, htmlBody: htmlBody });
    logNotification_('Email', email, subject, 'Sent');
  } catch (e) {
    logNotification_('Email', email, subject, 'Failed: ' + e.message);
  }
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getWebAppUrl_() { return getAppUrl_(); }

function formatNiceDateServer_(dateStr) {
  try { return Utilities.formatDate(new Date(dateStr + 'T12:00:00'), TIMEZONE, 'EEE, d MMM yyyy'); } catch (e) { return dateStr; }
}

function emailDetailTable_(rows) {
  return '<table style="width:100%;border-collapse:collapse;margin:16px 0;">' + rows.map(function (r) {
    return '<tr><td style="padding:6px 0;color:#777;">' + esc_(r[0]) + '</td><td style="padding:6px 0;font-weight:600;text-align:right;">' + esc_(r[1]) + '</td></tr>';
  }).join('') + '</table>';
}

function buildEmailHtml_(headline, bodyHtml, ctaText, ctaLink) {
  var settings = getSettingsMap_();
  var cta = ctaText && ctaLink ? '<p style="text-align:center;margin:24px 0;"><a href="' + ctaLink + '" style="background:' + (settings.PrimaryColor || '#16213e') + ';color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:700;">' + esc_(ctaText) + '</a></p>' : '';
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;">' +
    '<h2 style="color:' + (settings.PrimaryColor || '#16213e') + ';">' + esc_(settings.BusinessName || 'Advance Tailor') + '</h2>' +
    '<h3>' + esc_(headline) + '</h3>' + bodyHtml + cta +
    '<p style="color:#999;font-size:12px;margin-top:32px;">' + esc_(settings.ContactPhone || '') + ' • ' + esc_(settings.ContactEmail || '') + '</p></div>';
}

function sendSms_(phone, message) {
  var settings = getSettingsMap_();
  var normalized = normalizeGhanaPhone_(phone);
  if (!normalized) return;
  if (settings.SmsProvider === 'simulate' || !settings.SmsApiKey) {
    logNotification_('SMS', normalized, message, 'Sent (simulated)');
    return;
  }
  try {
    if (settings.SmsProvider === 'arkesel') {
      var url = 'https://sms.arkesel.com/api/v2/sms/send';
      var payload = { sender: settings.SmsSenderId || 'TAILOR', message: message, recipients: ['233' + normalized.slice(1)] };
      var res = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'api-key': settings.SmsApiKey }, payload: JSON.stringify(payload), muteHttpExceptions: true });
      logNotification_('SMS', normalized, message, res.getResponseCode() === 200 ? 'Sent' : 'Failed: ' + res.getContentText());
    } else if (settings.SmsProvider === 'hubtel') {
      var hubtelUrl = 'https://smsc.hubtel.com/v1/messages/send?clientid=' + encodeURIComponent(settings.HubtelClientId) + '&clientsecret=' + encodeURIComponent(settings.HubtelClientSecret) + '&from=' + encodeURIComponent(settings.SmsSenderId || 'TAILOR') + '&to=233' + normalized.slice(1) + '&content=' + encodeURIComponent(message);
      var hres = UrlFetchApp.fetch(hubtelUrl, { muteHttpExceptions: true });
      logNotification_('SMS', normalized, message, hres.getResponseCode() === 200 ? 'Sent' : 'Failed: ' + hres.getContentText());
    } else {
      logNotification_('SMS', normalized, message, 'Sent (simulated)');
    }
  } catch (e) {
    logNotification_('SMS', normalized, message, 'Failed: ' + e.message);
  }
}

function sendAppointmentConfirmation_(appt, customer, service, branch) {
  var settings = getSettingsMap_();
  var dateLabel = formatNiceDateServer_(appt.Date);
  if (String(settings.NotifyBookingSms).toUpperCase() === 'Y' && customer.Phone) {
    sendSms_(customer.Phone, settings.BusinessName + ': Booking received for ' + (service ? service.Name : 'your appointment') + ' on ' + dateLabel + ' at ' + appt.TimeSlot + '. Ref: ' + appt.Reference + '. We will confirm shortly.');
  }
  if (String(settings.NotifyBookingEmail).toUpperCase() === 'Y' && customer.Email) {
    var body = emailDetailTable_([['Reference', appt.Reference], ['Service', service ? service.Name : ''], ['Date', dateLabel], ['Time', appt.TimeSlot], ['Location', branch.Location || '']]);
    sendEmail_(customer.Email, 'Booking received — ' + appt.Reference, 'Your booking has been received.', buildEmailHtml_('Booking Received — Pending Confirmation', '<p>Hi ' + esc_(customer.Name) + ', thanks for booking with us!</p>' + body, 'Track My Booking', getWebAppUrl_() + '#track'));
  }
}

function sendAppointmentStatusUpdate_(appt, customer, statusText) {
  var settings = getSettingsMap_();
  var dateLabel = formatNiceDateServer_(appt.Date);
  if (String(settings.NotifyBookingSms).toUpperCase() === 'Y' && customer.Phone) {
    sendSms_(customer.Phone, settings.BusinessName + ': Your booking ' + appt.Reference + ' on ' + dateLabel + ' is now ' + statusText + '.');
  }
  if (String(settings.NotifyBookingEmail).toUpperCase() === 'Y' && customer.Email) {
    sendEmail_(customer.Email, 'Booking update — ' + appt.Reference, 'Your booking is now ' + statusText + '.', buildEmailHtml_('Booking Update', '<p>Hi ' + esc_(customer.Name) + ', your booking <strong>' + esc_(appt.Reference) + '</strong> is now <strong>' + esc_(statusText) + '</strong>.</p>', '', ''));
  }
}

function sendCompletionThankYou_(appt, customer, service, pointsEarned) {
  var settings = getSettingsMap_();
  if (String(settings.NotifyBookingSms).toUpperCase() === 'Y' && customer.Phone) {
    sendSms_(customer.Phone, 'Thank you for visiting ' + settings.BusinessName + '! ' + (pointsEarned ? 'You earned ' + pointsEarned + ' loyalty points.' : 'We hope to see you again soon.'));
  }
}

/** Notifies a customer of a garment order's production-stage change; "Ready for Pickup" and "Delivered" get a dedicated, more prominent message. */
function sendOrderStatusUpdate_(order, customer, service, status, pointsEarned) {
  var settings = getSettingsMap_();
  if (String(settings.NotifyOrderStatusSms).toUpperCase() !== 'Y' && String(settings.NotifyOrderStatusEmail).toUpperCase() !== 'Y') return;
  var serviceName = service ? service.Name : 'your order';
  var smsText, headline, bodyHtml;
  if (status === 'Ready for Pickup') {
    smsText = settings.BusinessName + ': Great news! Your order ' + order.Reference + ' (' + serviceName + ') is ready for pickup.';
    headline = 'Your Order Is Ready!'; bodyHtml = '<p>Hi ' + esc_(customer.Name) + ', your order <strong>' + esc_(order.Reference) + '</strong> (' + esc_(serviceName) + ') is ready for pickup.</p>';
  } else if (status === 'Delivered') {
    smsText = settings.BusinessName + ': Thank you! Order ' + order.Reference + ' has been delivered.' + (pointsEarned ? ' You earned ' + pointsEarned + ' loyalty points.' : '');
    headline = 'Order Delivered — Thank You!'; bodyHtml = '<p>Hi ' + esc_(customer.Name) + ', thank you for choosing us. Order <strong>' + esc_(order.Reference) + '</strong> has been delivered.</p>' + (pointsEarned ? '<p>You earned <strong>' + pointsEarned + ' loyalty points</strong>.</p>' : '');
  } else {
    smsText = settings.BusinessName + ': Order ' + order.Reference + ' (' + serviceName + ') is now ' + status + '.';
    headline = 'Order Update'; bodyHtml = '<p>Hi ' + esc_(customer.Name) + ', order <strong>' + esc_(order.Reference) + '</strong> is now <strong>' + esc_(status) + '</strong>.</p>';
  }
  if (String(settings.NotifyOrderStatusSms).toUpperCase() === 'Y' && customer.Phone) sendSms_(customer.Phone, smsText);
  if (String(settings.NotifyOrderStatusEmail).toUpperCase() === 'Y' && customer.Email) sendEmail_(customer.Email, headline + ' — ' + order.Reference, smsText, buildEmailHtml_(headline, bodyHtml, 'Track My Order', getWebAppUrl_() + '#track'));
}

function sendSaleReceipt_(sale, customer, lineItems, pointsEarned) {
  var settings = getSettingsMap_();
  if (!customer.Email) return;
  var rows = lineItems.map(function (it) { return [it.name + ' × ' + it.qty, CURRENCY_SYMBOL + round2_(it.price * it.qty)]; });
  rows.push(['Subtotal', CURRENCY_SYMBOL + sale.Subtotal]);
  if (Number(sale.Discount)) rows.push(['Discount', '-' + CURRENCY_SYMBOL + sale.Discount]);
  if (Number(sale.Tax)) rows.push(['Tax', CURRENCY_SYMBOL + sale.Tax]);
  rows.push(['Total', CURRENCY_SYMBOL + sale.Total]);
  if (pointsEarned) rows.push(['Loyalty points earned', String(pointsEarned)]);
  sendEmail_(customer.Email, 'Receipt — ' + settings.BusinessName, 'Thank you for your purchase.', buildEmailHtml_('Receipt', '<p>Hi ' + esc_(customer.Name) + ', thank you for your purchase!</p>' + emailDetailTable_(rows), '', ''));
}

/** Confirms a public online Shop order was received, and — for a mobile money/bank payment — that it's pending manual verification against the shop's own statement. */
function sendShopOrderConfirmation_(sale, customer, lineItems) {
  var settings = getSettingsMap_();
  var itemsLabel = lineItems.map(function (it) { return it.name + ' ×' + it.qty; }).join(', ');
  var pendingPayment = sale.PaymentStatus === 'Awaiting Verification';
  var smsText = settings.BusinessName + ': Order ' + sale.Reference + ' received (' + itemsLabel + '), total ' + formatCurrency_(sale.Total) + '.' +
    (pendingPayment ? ' We will confirm your payment shortly.' : ' Please pay on pickup.');
  if (customer.Phone) sendSms_(customer.Phone, smsText);
  if (customer.Email) {
    var rows = [['Reference', sale.Reference], ['Items', itemsLabel], ['Total', formatCurrency_(sale.Total)], ['Payment', sale.PaymentStatus]];
    sendEmail_(customer.Email, 'Order received — ' + sale.Reference, smsText, buildEmailHtml_('Order Received', '<p>Hi ' + esc_(customer.Name) + ', thanks for shopping with us!</p>' + emailDetailTable_(rows), 'Track My Order', getWebAppUrl_() + '#track'));
  }
}

/** Notifies a customer of a Shop order's fulfillment-stage change (Processing → Ready for Pickup / Out for Delivery → Delivered). */
function sendShopOrderStatusUpdate_(sale, customer, status) {
  var settings = getSettingsMap_();
  var smsText = settings.BusinessName + ': Order ' + sale.Reference + ' is now ' + status + '.';
  if (customer.Phone) sendSms_(customer.Phone, smsText);
  if (customer.Email) sendEmail_(customer.Email, 'Order update — ' + sale.Reference, smsText, buildEmailHtml_('Order Update', '<p>Hi ' + esc_(customer.Name) + ', order <strong>' + esc_(sale.Reference) + '</strong> is now <strong>' + esc_(status) + '</strong>.</p>', 'Track My Order', getWebAppUrl_() + '#track'));
}

/** Time-driven trigger (set up manually via Triggers > Add Trigger > sendUpcomingAppointmentReminders, daily). Reminds customers of tomorrow's fitting/consultation. */
function sendUpcomingAppointmentReminders() {
  var settings = getSettingsMap_();
  var tomorrow = addDays_(Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'), 1);
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  readAll_('Appointments').filter(function (a) { return a.Date === tomorrow && (a.Status === 'Confirmed' || a.Status === 'Pending'); }).forEach(function (a) {
    var customer = customers[a.CustomerID];
    if (!customer) return;
    var service = services[a.ServiceID];
    if (customer.Phone) sendSms_(customer.Phone, settings.BusinessName + ' reminder: ' + (service ? service.Name : 'Your appointment') + ' tomorrow at ' + a.TimeSlot + '. Ref: ' + a.Reference);
  });
}

/* ============================================================================
 * 21. TRASH / RECOVERY (Customers + Orders)
 * ==========================================================================*/

function moveToTrash_(sheetName, idField, id, deletedBy, preloadedRecord) {
  var record = preloadedRecord || readAll_(sheetName).find(function (r) { return r[idField] === id; });
  if (!record) throw new Error(sheetName + ' record not found: ' + id);
  appendRow_('Trash', {
    TrashID: nextId_('Trash', 'TrashID'), RecordType: sheetName, RecordID: id,
    Data: JSON.stringify(stripRow_(record)), DeletedAt: nowIso_(), DeletedBy: deletedBy
  });
  deleteById_(sheetName, idField, id);
}

function clearCustomers(token, customerIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  customerIds.forEach(function (id) { moveToTrash_('Customers', 'CustomerID', id, user.username); });
  return { cleared: customerIds.length };
}

function clearOrders(token, orderIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  orderIds.forEach(function (id) { moveToTrash_('Orders', 'OrderID', id, user.username); });
  return { cleared: orderIds.length };
}

/** Housekeeping: cancelled appointments older than 90 days are cleared outright (no trash — they carry no business value once cancelled/expired). Wired to a daily trigger when Settings.AutoClearAppointmentsDaily = 'Y'. */
function clearFinishedAppointments_() {
  var cutoff = addDays_(Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'), -90);
  var sheet = getSheet_('Appointments');
  var rows = readAll_('Appointments');
  var toDelete = rows.filter(function (a) { return a.Status === 'Cancelled' && a.Date < cutoff; }).map(function (a) { return a._row; }).sort(function (a, b) { return b - a; });
  toDelete.forEach(function (r) { sheet.deleteRow(r); });
  return toDelete.length;
}

function autoClearOldAppointments_() {
  var settings = getSettingsMap_();
  if (String(settings.AutoClearAppointmentsDaily).toUpperCase() === 'Y') clearFinishedAppointments_();
}

function clearOldAppointmentsNow(token) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return clearFinishedAppointments_();
}

function getTrash(token, recordType) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var rows = readAll_('Trash');
  if (recordType) rows = rows.filter(function (t) { return t.RecordType === recordType; });
  return rows.map(function (t) { var c = stripRow_(t); try { c.DataParsed = JSON.parse(t.Data || '{}'); } catch (e) { c.DataParsed = {}; } return c; })
    .sort(function (a, b) { return new Date(b.DeletedAt) - new Date(a.DeletedAt); });
}

function restoreTrashItems(token, trashIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var trash = readAll_('Trash');
  var restored = 0;
  trashIds.forEach(function (id) {
    var item = trash.find(function (t) { return t.TrashID === id; });
    if (!item) return;
    var data = JSON.parse(item.Data || '{}');
    appendRow_(item.RecordType, data);
    deleteById_('Trash', 'TrashID', id);
    restored++;
  });
  return { restored: restored };
}

function permanentlyDeleteTrash(token, trashIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  trashIds.forEach(function (id) { deleteById_('Trash', 'TrashID', id); });
  return { deleted: trashIds.length };
}

function emptyTrash(token, recordType) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  var rows = readAll_('Trash').filter(function (t) { return !recordType || t.RecordType === recordType; });
  var ids = rows.map(function (t) { return t.TrashID; });
  ids.forEach(function (id) { deleteById_('Trash', 'TrashID', id); });
  return { deleted: ids.length };
}

/* ============================================================================
 * 22. UTILITIES
 * ==========================================================================*/

function nowIso_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function addDays_(dateStr, days) {
  var d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
}

function addDaysDate_(date, days) {
  var d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function keyBy_(rows, field) {
  var map = {};
  rows.forEach(function (r) { map[r[field]] = r; });
  return map;
}

/** Normalizes a Ghana phone number to the local 0XXXXXXXXX (10-digit) form. Accepts 024..., +233..., 233..., or with spaces/dashes. Returns '' if it can't be recognized as a valid Ghana mobile number. */
function normalizeGhanaPhone_(phone) {
  var digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 10 && digits.charAt(0) === '0') return digits;
  if (digits.length === 12 && digits.indexOf('233') === 0) return '0' + digits.slice(3);
  if (digits.length === 9) return '0' + digits;
  return '';
}

function formatCurrency_(amount) {
  return CURRENCY_SYMBOL + round2_(amount).toFixed(2);
}
