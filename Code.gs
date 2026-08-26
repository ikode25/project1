/**
 * ============================================================================
 *  BARBER & SALON ENTERPRISE MANAGEMENT SYSTEM (Ghana)
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
 *    3. Sheet setup / seeding
 *    4. Generic sheet data-access helpers
 *    5. Auth & session management
 *    6. Public-facing functions (website + booking)
 *    7. Branches / Services / Staff CRUD
 *    8. Customers / CRM / Loyalty
 *    9. Appointments
 *   10. Point of Sale (POS) / Sales
 *   11. Products / Inventory
 *   12. Expenses
 *   13. Users management
 *   14. Reviews
 *   15. Settings / Theme / Branding
 *   16. Hero carousel & image uploads
 *   17. Reports & exports
 *   18. Notifications (SMS + Email)
 *   19. Trash / recovery (Customers + Appointments)
 *   20. Utilities (currency, phone, dates, ids)
 * ============================================================================
 */

/* ============================================================================
 * 1. CONFIGURATION & SCHEMA
 * ==========================================================================*/

var TIMEZONE = 'Africa/Accra';
var CURRENCY_SYMBOL = 'GH₵';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 hours
var UPLOAD_FOLDER_NAME = 'SalonSystem_Uploads';
// Bump this whenever a fix needs to force-run against an EXISTING spreadsheet
// (e.g. a cell-formatting or data-repair migration) even though its sheet
// headers already match SCHEMA and would otherwise skip setupSheets().
var SETUP_VERSION = 4;

// Column schema for every tab. Order matters — it defines the sheet column order.
var SCHEMA = {
  Branches:      ['BranchID', 'Name', 'Location', 'Phone', 'OpeningHours', 'WeeklyHours'],
  Services:      ['ServiceID', 'Name', 'Category', 'Description', 'DurationMinutes', 'Price', 'BranchID', 'Active', 'ImageURL'],
  Staff:         ['StaffID', 'Name', 'Role', 'BranchID', 'Phone', 'Specialties', 'PhotoURL', 'Active', 'CommissionRate', 'WorkDays'],
  Customers:     ['CustomerID', 'Name', 'Phone', 'Email', 'DateJoined', 'LoyaltyPoints', 'Notes'],
  Appointments:  ['AppointmentID', 'Reference', 'CustomerID', 'StaffID', 'ServiceID', 'BranchID', 'Date', 'TimeSlot', 'Status', 'CreatedAt', 'Notes', 'PaymentMethod', 'PaymentStatus', 'PaymentProofURL'],
  Sales:         ['SaleID', 'Date', 'BranchID', 'CustomerID', 'StaffID', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethod', 'PaymentStatus'],
  Products:      ['ProductID', 'Name', 'Category', 'CostPrice', 'SellingPrice', 'QuantityInStock', 'ReorderLevel', 'BranchID', 'ImageURL'],
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
  // A "cleared" Customer/Appointment record's entire original row, kept as
  // JSON so it can be restored exactly as it was — see section 19, TRASH.
  Trash:         ['TrashID', 'RecordType', 'RecordID', 'Data', 'DeletedAt', 'DeletedBy']
};

var ID_PREFIX = {
  Branches: 'BR', Services: 'SV', Staff: 'ST', Customers: 'CU', Appointments: 'AP',
  Sales: 'SL', Products: 'PR', Expenses: 'EX', Reviews: 'RV', HeroSlides: 'HS', Gallery: 'GL',
  Notifications: 'NT', BlockedSlots: 'BL', Videos: 'VD', Visits: 'VS', StaffLeave: 'LV', Trash: 'TR'
};

/** Which sheets support "Clear" (soft-delete to Trash, recoverable) instead of/alongside a permanent Delete. Also used by nextId_() below to keep a cleared record's ID reserved while it sits in Trash. */
var TRASH_RECORD_TYPES = { Customers: true, Appointments: true };

var ROLES = ['Owner', 'Manager', 'Staff', 'Receptionist'];

var DEFAULT_SETTINGS = {
  BusinessName: 'Golden Clippers Barber & Salon',
  Tagline: 'Sharp Fades. Fresh Styles. Real Confidence.',
  LogoURL: '',
  PrimaryColor: '#1a1a1a',
  SecondaryColor: '#c9a227',
  AccentColor: '#c9a227',
  BackgroundColor: '#f7f5f2',
  TextColor: '#1a1a1a',
  FontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  WhatsAppNumber: '233241234567',
  ContactPhone: '0241234567',
  ContactEmail: 'info@goldenclippers.com.gh',
  MapEmbedURL: 'https://www.google.com/maps?q=Accra,Ghana&output=embed',
  TaxRatePercent: '0',
  LoyaltyPointsPerCedi: '1',
  LoyaltyRedeemRate: '100', // points needed for GH₵1 discount
  SmsProvider: 'simulate', // 'simulate' | 'arkesel' | 'hubtel'
  SmsApiKey: '',
  SmsSenderId: 'SALON',
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
  // Ghana, so each gets its own number+name rather than sharing one field
  // — a customer can't send Vodafone Cash to an MTN number. MomoNumber/
  // MomoName (kept under their original name for backward compatibility)
  // are specifically the MTN MoMo details.
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
  // Comma-separated subset of PAYMENT_METHODS that customers are actually
  // offered at checkout — lets the Owner hide networks/methods they don't
  // support instead of showing all six to every customer. Note a method
  // only actually shows if BOTH this list includes it AND its own
  // number/account details below are filled in — see paymentMethodDetailsFilled_().
  ActivePaymentMethods: 'Cash,MTN MoMo,Vodafone Cash,Telecel Cash,AirtelTigo Money,Bank Transfer',
  // Comma-separated list of service categories the Owner has defined — the
  // Services admin page picks from this instead of retyping a category
  // name (and risking "Haircut" vs "Haircuts" splitting the price list).
  ServiceCategories: 'Haircut,Shave,Braids,Manicure,Facial',
  // 'Y'/'N' toggles for optional public-site sections.
  ShowGreetingBanner: 'Y',
  ShowTeamSection: 'Y',
  // 'Y'/'N' toggles for the automatic SMS/Email a customer gets the moment
  // they book an appointment (the "Booking Received — pending confirmation"
  // message). Default 'Y' preserves the app's existing always-on behavior.
  // WhatsApp is deliberately not included here — there's no WhatsApp
  // Business API integration in this app, only the existing click-to-chat
  // link, so there's nothing to automate/toggle.
  NotifyBookingSms: 'Y',
  NotifyBookingEmail: 'Y',
  // Appointments module housekeeping — see clearFinishedAppointments_().
  // 'N' by default: nothing auto-clears until the Owner turns it on.
  AutoClearAppointmentsDaily: 'N',
  // A customer is auto-flagged as a "Favourite" once they've visited (a
  // completed appointment or a POS sale) at least this many times within
  // the trailing FavouriteWindowDays days — see computeCustomerVisitCounts_().
  FavouriteVisitThreshold: '3',
  FavouriteWindowDays: '90'
};

var PAYMENT_METHODS = ['Cash', 'MTN MoMo', 'Vodafone Cash', 'Telecel Cash', 'AirtelTigo Money', 'Bank Transfer'];

/** Whether a payment method's own number/account details are actually filled in — mirrors the client-side gating so a method can't be paid into even by a direct API call if nothing was ever entered for it. */
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
  if (endMin <= startMin) endMin = startMin; // malformed — treat as a zero-length window rather than wrapping past midnight
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

/** Whether "open now" (Africa/Accra time) plus today's/every day's hours label, given an already-parsed WeeklyHours object. Works the same for the single global schedule or one branch's own schedule. */
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

/**
 * Collapses a WeeklyHours object into a short human-readable summary by
 * grouping consecutive days that share the exact same hours, e.g.
 * "Mon-Sat 8:00 AM – 7:00 PM, Sun 12:00 PM – 5:00 PM". Auto-computed from
 * the structured per-day editor so there's never a separate free-text
 * "opening hours" value to keep in sync by hand.
 */
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

  // Direct link to an uploaded file's raw bytes (?img=<fileId>) — used for
  // "open this in a new tab" links (e.g. viewing a payment-proof screenshot
  // full-size). A plain top-level navigation to the web app's own /exec URL
  // like this works fine; it's specifically loading it as an <img> inside
  // the app's own already-open page that turned out to be unreliable (see
  // imageUrlToDataUri_ below for how actual on-page images are handled).
  if (e && e.parameter && e.parameter.img) {
    return serveUploadedImage_(e.parameter.img);
  }

  var page = (e && e.parameter && e.parameter.page) || 'app';
  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.initialPage = page;
  return tpl.evaluate()
    .setTitle('Salon & Barber Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Streams an uploaded file's bytes straight from Drive. A missing/bad file ID falls back to a blank transparent pixel instead of throwing, so a stale URL degrades to an empty image rather than a page error. */
function serveUploadedImage_(fileId) {
  try {
    return DriveApp.getFileById(fileId).getBlob();
  } catch (err) {
    return Utilities.newBlob(Utilities.base64Decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='), 'image/gif', 'blank.gif');
  }
}

/** The current web app's own /exec URL — uploaded images are linked back through this same origin (see doGet's ?img= handler) rather than hotlinked from Drive directly. */
function getAppUrl_() {
  return ScriptApp.getService().getUrl();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ----------------------------------------------------------------------
 * Uploaded-image delivery.
 *
 * Every attempt at hotlinking an uploaded photo — `uc?export=view`,
 * `drive.google.com/thumbnail`, `lh3.googleusercontent.com/d/...`, and
 * even this app's own doGet ?img= endpoint used directly as an <img src>
 * — turned out unreliable for one browser or another, or (in the ?img=
 * case) for ALL browsers at once. The common thread: all of those load
 * the image as a separate resource fetched by the browser, and an <img>
 * tag inside this app's own HtmlService-sandboxed page fetching from the
 * app's own script.google.com address hits Google's redirect/consent
 * handling for that flow inconsistently — it is not just a Safari quirk.
 *
 * The fix is to stop asking the browser to fetch the image as a separate
 * resource at all. Every endpoint that hands image data to the browser
 * (getPublicData, getServices, getStaff, getProducts, getGallery,
 * getHeroSlides, getSettings, updateSettings) now converts a Drive-backed
 * image reference into a `data:` URI — the actual image bytes, read
 * server-side and embedded straight into the same google.script.run
 * response already carrying everything else that page needs. That's the
 * one delivery path already proven to work identically in every browser,
 * because the rest of the app's data already relies on it.
 * ------------------------------------------------------------------- */

/**
 * Recognizes a Drive-uploaded image reference in any format this app has
 * ever generated — the current same-origin `?img=` link, or either of the
 * two external Drive-hotlink formats used before it — and pulls out the
 * file ID. Returns null for anything else (an external URL, e.g. a seeded
 * Unsplash sample photo, or an empty value), which callers treat as
 * "nothing to convert, use it as-is."
 */
function extractDriveFileId_(url) {
  var s = String(url || '');
  var m = s.match(/[?&]img=([a-zA-Z0-9_-]{15,})/) ||
    s.match(/drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]{15,})/) ||
    s.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/);
  return m ? m[1] : null;
}

/**
 * Resolves a batch of possibly-Drive-backed image references into their
 * `data:` URI form in as few round trips as possible.
 *
 * The very first version of this fetched and base64-encoded each image
 * with its own `DriveApp.getFileById(id).getBlob()` call, one at a time —
 * completely sequential, so a page with a dozen photos meant a dozen live
 * Drive round trips back to back before that response could even start
 * assembling. CacheService (added afterward) helps once an image has been
 * seen before, but the very first load of any page — and every load right
 * after a redeploy, when the cache is empty — still paid that full serial
 * cost, which is what made every page feel slow, not just the ones with
 * obviously many photos: `getPublicData()` alone touches the logo, every
 * service, every staff photo, every gallery photo, and every hero slide
 * in one response.
 *
 * `UrlFetchApp.fetchAll()` sends every still-uncached image's request in
 * a single batched call instead, which Apps Script executes with real
 * concurrency — so N images that were N sequential round trips become
 * effectively one. This is the one function every image-resolving call
 * in the file now goes through; a non-Drive URL (an external photo, or
 * blank) passes straight through unchanged, and a Drive file that's since
 * been deleted or had sharing revoked degrades to '' for just that one
 * entry rather than breaking the whole response.
 */
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
      responses = []; // whole batch failed to even dispatch — every entry below degrades to ''
    }
    var dataUriByFileId = {};
    uncachedFileIds.forEach(function (fileId, i) {
      var res = responses[i];
      if (!res || res.getResponseCode() !== 200) { dataUriByFileId[fileId] = ''; return; }
      var blob = res.getBlob();
      var dataUri = 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
      dataUriByFileId[fileId] = dataUri;
      // CacheService rejects values over 100KB — a larger photo just isn't
      // cached, which only means that one keeps paying the live-fetch cost
      // on future loads; everything else still benefits.
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
 * 3. SHEET SETUP / SEEDING
 * ==========================================================================*/

/**
 * Creates every tab with the correct headers if it does not already exist,
 * and seeds sample data on first run. Safe to run multiple times.
 */
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
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#ffffff');
    }
    // Force every data cell to Plain Text format. Without this, Google
    // Sheets silently "smart-formats" values that look like numbers or
    // times — e.g. a phone number "0247123456" loses its leading zero,
    // and a TimeSlot like "09:00" gets converted into an actual time
    // value — which then breaks exact-string matches (phone lookups,
    // slot-availability checks) elsewhere in this file. This must be set
    // BEFORE data is written; it cannot recover a value already mangled.
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 3000), headers.length).setNumberFormat('@');
  });

  // Remove the default "Sheet1" if it is empty and unused
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }

  // Created up front rather than lazily on first upload, so the folder
  // that will hold every uploaded photo (logo, staff, services, products,
  // gallery, hero slides, payment proofs) exists from the very first run,
  // not just after someone happens to upload something.
  getOrCreateUploadFolder_();

  seedIfEmpty_();
  repairPhoneColumns_();
  repairTimeSlotColumns_();
  repairImageUrlColumns_();
  mergeToSingleBranch_();
  return 'Setup complete';
}

/**
 * One-time data repair: this app now runs for exactly one shop, so the
 * Branches sheet should hold exactly one row — not a list an Owner adds
 * to or deletes from. A spreadsheet from before this change (including
 * the sample data, which used to seed two branches for demo purposes)
 * can still have more than one. This collapses down to the first branch
 * row, reassigning every other sheet's BranchID references that pointed
 * at any of the removed branches over to the surviving one first — so no
 * service, staff member, product, expense, appointment, sale, blocked
 * slot, gallery photo, or user account is silently orphaned — and only
 * then deletes the extra branch rows. Idempotent: a spreadsheet already
 * down to one branch (or zero, before first seed) is left untouched.
 */
function mergeToSingleBranch_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var branchSheet = ss.getSheetByName('Branches');
  if (!branchSheet) return;
  var lastRow = branchSheet.getLastRow();
  if (lastRow < 3) return; // 0 or 1 data row already — nothing to merge
  var idCol = SCHEMA.Branches.indexOf('BranchID');
  var rows = branchSheet.getRange(2, 1, lastRow - 1, SCHEMA.Branches.length).getValues();
  var canonicalId = rows[0][idCol];
  var extraIds = rows.slice(1).map(function (r) { return r[idCol]; });

  ['Services', 'Staff', 'Products', 'Expenses', 'Appointments', 'Sales', 'BlockedSlots', 'Gallery', 'Users'].forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var col = SCHEMA[sheetName].indexOf('BranchID') + 1;
    if (!col) return;
    var n = sheet.getLastRow();
    if (n < 2) return;
    var range = sheet.getRange(2, col, n - 1, 1);
    var values = range.getValues();
    var changed = false;
    var fixed = values.map(function (row) {
      if (extraIds.indexOf(row[0]) > -1) { changed = true; return [canonicalId]; }
      return row;
    });
    if (changed) range.setValues(fixed);
  });

  // Bottom-up so deleting one row never shifts the index of the next one to delete.
  for (var r = lastRow; r >= 3; r--) branchSheet.deleteRow(r);
}

/**
 * One-time data repair: images uploaded under either of the two earlier
 * Drive-hotlink URL formats (`drive.google.com/thumbnail?id=...` and
 * `lh3.googleusercontent.com/d/...`) are rewritten to the current
 * same-origin `?img=<fileId>` format served by doGet/serveUploadedImage_.
 * Both old formats embed the Drive file ID in a recognizable spot, so the
 * ID can be recovered and the URL rebuilt without losing anything — a
 * logo, staff photo, service photo, etc. that never displayed in Safari
 * before this fix now does, without the Owner having to re-upload it.
 * Anything already using the new format, or an external (non-Drive) URL
 * like the seeded Unsplash sample photos, is left untouched.
 */
function repairImageUrlColumns_() {
  var appUrl = getAppUrl_();
  var oldFormat = /(?:drive\.google\.com\/thumbnail\?id=|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]{15,})/;
  var targets = [
    { sheet: 'Services', col: 'ImageURL' },
    { sheet: 'Staff', col: 'PhotoURL' },
    { sheet: 'Products', col: 'ImageURL' },
    { sheet: 'HeroSlides', col: 'ImageURL' },
    { sheet: 'Gallery', col: 'ImageURL' },
    { sheet: 'Appointments', col: 'PaymentProofURL' }
  ];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  targets.forEach(function (t) {
    var sheet = ss.getSheetByName(t.sheet);
    if (!sheet) return;
    var col = SCHEMA[t.sheet].indexOf(t.col) + 1;
    if (!col) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var range = sheet.getRange(2, col, lastRow - 1, 1);
    var values = range.getValues();
    var changed = false;
    var fixed = values.map(function (row) {
      var v = String(row[0] || '');
      var m = v.match(oldFormat);
      if (!m) return [row[0]];
      changed = true;
      return [appUrl + '?img=' + m[1]];
    });
    if (changed) range.setValues(fixed);
  });

  // Settings.LogoURL lives in the Key/Value Settings sheet, not a fixed column.
  var settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet) {
    var lastRow = settingsSheet.getLastRow();
    if (lastRow >= 2) {
      var rows = settingsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      var changed = false;
      rows.forEach(function (row) {
        if (row[0] === 'LogoURL') {
          var m = String(row[1] || '').match(oldFormat);
          if (m) { row[1] = appUrl + '?img=' + m[1]; changed = true; }
        }
      });
      if (changed) settingsSheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
  }
}

/**
 * One-time data repair: a TimeSlot value like "09:00" or "02:00" reads
 * exactly like a clock time, so before the Plain Text format above took
 * effect, Sheets silently stored it as a real Time value. normalizeCellValue_
 * then reads that back as a Date anchored at the Sheets time epoch
 * (1899-12-30) and formats it as a full ISO datetime string instead of
 * "HH:mm" — so it can never again match a plain "HH:mm" lookup key. That
 * silently broke slot-blocking (a blocked slot's color wouldn't survive a
 * reload) and could affect availability checks. Any TimeSlot cell still
 * holding a raw Date is unambiguous and safe to convert back to "HH:mm".
 */
function repairTimeSlotColumns_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Appointments', 'BlockedSlots'].forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var headers = SCHEMA[sheetName];
    var col = headers.indexOf('TimeSlot') + 1;
    if (!col) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var range = sheet.getRange(2, col, lastRow - 1, 1);
    var values = range.getValues();
    var changed = false;
    var fixed = values.map(function (row) {
      var v = row[0];
      if (v instanceof Date) {
        changed = true;
        var h = v.getHours(), m = v.getMinutes();
        return [(h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m];
      }
      return [v];
    });
    if (changed) range.setValues(fixed);
  });
}

/**
 * One-time data repair: earlier deployments could write a phone number
 * before the Plain Text cell format above was in effect, so Sheets
 * "smart-formatted" it into a number and silently dropped the leading
 * zero (e.g. "0247123456" -> 247123456). Any 9-digit value left in a
 * Phone column is unambiguously a Ghana mobile number missing that zero,
 * so it's safe to restore automatically. Idempotent — already-correct
 * 10-digit numbers are left untouched.
 */
function repairPhoneColumns_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Customers', 'Staff', 'Users', 'Branches'].forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var headers = SCHEMA[sheetName];
    var phoneCol = headers.indexOf('Phone') + 1;
    if (!phoneCol) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    var range = sheet.getRange(2, phoneCol, lastRow - 1, 1);
    var values = range.getValues();
    var changed = false;
    var fixed = values.map(function (row) {
      var v = row[0];
      var digits = typeof v === 'number' ? String(Math.round(v)) : String(v || '').trim();
      if (/^\d{9}$/.test(digits)) { changed = true; return ['0' + digits]; }
      return [typeof v === 'number' ? digits : v];
    });
    if (changed) range.setValues(fixed);
  });
}

/**
 * Self-healing check, but only actually performed once per cache window:
 * verifying every sheet's headers is 13+ extra Sheets API calls, so doing
 * it on literally every request (as an earlier version of this function
 * did) made every page load and every save noticeably slower. The result
 * is now cached for an hour — most requests take the fast path (a single
 * cheap CacheService read) and skip the verification entirely; it quietly
 * re-checks itself within an hour of any future schema change.
 *
 * Header-matching alone isn't enough to decide whether setupSheets() can
 * be skipped, though: a sheet created by an older deployment can already
 * have the right headers while still missing a later fix that setupSheets()
 * itself carries (Plain Text cell formatting, phone-column repair, etc).
 * SETUP_VERSION is stored durably (PropertiesService, not the 1-hour
 * cache) so any such fix is guaranteed to actually run at least once
 * against every existing spreadsheet, no matter how old its headers are.
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
  var settings = readAll_('Settings');
  if (settings.length === 0) {
    Object.keys(DEFAULT_SETTINGS).forEach(function (k) {
      appendRow_('Settings', { Key: k, Value: DEFAULT_SETTINGS[k] });
    });
  }

  // Branches
  if (readAll_('Branches').length === 0) {
    var osuHours = { Sun: { open: true, is24: false, start: '12:00', end: '17:00' }, Mon: { open: true, is24: false, start: '08:00', end: '19:00' }, Tue: { open: true, is24: false, start: '08:00', end: '19:00' }, Wed: { open: true, is24: false, start: '08:00', end: '19:00' }, Thu: { open: true, is24: false, start: '08:00', end: '19:00' }, Fri: { open: true, is24: false, start: '08:00', end: '19:00' }, Sat: { open: true, is24: false, start: '08:00', end: '19:00' } };
    var elHours = { Sun: { open: false, is24: false, start: '08:00', end: '20:00' }, Mon: { open: true, is24: false, start: '08:00', end: '20:00' }, Tue: { open: true, is24: false, start: '08:00', end: '20:00' }, Wed: { open: true, is24: false, start: '08:00', end: '20:00' }, Thu: { open: true, is24: false, start: '08:00', end: '20:00' }, Fri: { open: true, is24: false, start: '08:00', end: '20:00' }, Sat: { open: true, is24: false, start: '08:00', end: '20:00' } };
    appendRow_('Branches', { BranchID: 'BR-0001', Name: 'Osu Main Branch', Location: 'Oxford Street, Osu, Accra', Phone: '0241234567', OpeningHours: summarizeWeeklyHours_(osuHours), WeeklyHours: JSON.stringify(osuHours) });
    appendRow_('Branches', { BranchID: 'BR-0002', Name: 'East Legon Branch', Location: 'American House Rd, East Legon, Accra', Phone: '0209876543', OpeningHours: summarizeWeeklyHours_(elHours), WeeklyHours: JSON.stringify(elHours) });
  }

  // Services
  if (readAll_('Services').length === 0) {
    var svc = [
      ['Skin Fade', 'Haircut', 'Precision skin fade with clean lineup', 40, 40, 'BR-0001', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop'],
      ['Classic Haircut', 'Haircut', 'Standard haircut & styling', 30, 25, 'BR-0001', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop'],
      ['Beard Trim & Shape', 'Shave', 'Beard shaping with hot towel', 20, 20, 'BR-0001', 'https://images.unsplash.com/photo-1622286346003-c5c7e63ff123?q=80&w=800&auto=format&fit=crop'],
      ['Hot Towel Shave', 'Shave', 'Traditional straight razor shave', 30, 30, 'BR-0001', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop'],
      ['Box Braids', 'Braids', 'Medium box braids, shoulder length', 180, 150, 'BR-0001', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=800&auto=format&fit=crop'],
      ['Cornrows', 'Braids', 'Classic cornrow styling', 90, 80, 'BR-0001', 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?q=80&w=800&auto=format&fit=crop'],
      ['Manicure', 'Manicure', 'Full manicure with polish', 45, 60, 'BR-0002', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'],
      ['Pedicure', 'Manicure', 'Full pedicure with polish', 50, 70, 'BR-0002', 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop'],
      ['Facial Treatment', 'Facial', 'Deep cleanse & moisturising facial', 60, 90, 'BR-0002', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=800&auto=format&fit=crop'],
      ['Kids Haircut', 'Haircut', 'Haircut for children under 12', 25, 20, 'BR-0002', '']
    ];
    svc.forEach(function (s, i) {
      appendRow_('Services', {
        ServiceID: 'SV-' + String(i + 1).padStart(4, '0'), Name: s[0], Category: s[1], Description: s[2],
        DurationMinutes: s[3], Price: s[4], BranchID: s[5], Active: 'Y', ImageURL: s[6]
      });
    });
  }

  // Staff — WorkDays is a comma-separated list of weekday abbreviations (Mon..Sun)
  // used to drive stylist availability in the public booking wizard.
  if (readAll_('Staff').length === 0) {
    var staff = [
      ['Kwame Mensah', 'Barber', 'BR-0001', '0244001122', 'Fades, Lineups', 'Y', 10, 'Mon,Tue,Wed,Thu,Fri,Sat'],
      ['Kofi Asante', 'Barber', 'BR-0001', '0244002233', 'Braids, Shaves', 'Y', 10, 'Mon,Wed,Thu,Fri,Sat'],
      ['Ama Owusu', 'Stylist', 'BR-0002', '0244003344', 'Manicure, Pedicure', 'Y', 12, 'Mon,Tue,Thu,Fri,Sat'],
      ['Efua Boateng', 'Stylist', 'BR-0002', '0244004455', 'Facials, Skincare', 'Y', 12, 'Tue,Wed,Fri,Sat,Sun'],
      ['Yaw Darko', 'Manager', 'BR-0001', '0244005566', 'Operations', 'Y', 5, 'Mon,Tue,Wed,Thu,Fri']
    ];
    staff.forEach(function (s, i) {
      appendRow_('Staff', {
        StaffID: 'ST-' + String(i + 1).padStart(4, '0'), Name: s[0], Role: s[1], BranchID: s[2], Phone: s[3],
        Specialties: s[4], PhotoURL: '', Active: s[5], CommissionRate: s[6], WorkDays: s[7]
      });
    });
  }

  // Products
  if (readAll_('Products').length === 0) {
    var prod = [
      ['Pomade - Matte Finish', 'Hair Products', 15, 30, 25, 5, 'BR-0001', 'https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=800&auto=format&fit=crop'],
      ['Beard Oil', 'Grooming', 12, 25, 20, 5, 'BR-0001', 'https://images.unsplash.com/photo-1621607150430-9c3f9c3e6d5b?q=80&w=800&auto=format&fit=crop'],
      ['Hair Relaxer Kit', 'Hair Products', 20, 45, 15, 4, 'BR-0002', ''],
      ['Nail Polish Set', 'Nail Products', 10, 22, 30, 6, 'BR-0002', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop']
    ];
    prod.forEach(function (p, i) {
      appendRow_('Products', {
        ProductID: 'PR-' + String(i + 1).padStart(4, '0'), Name: p[0], Category: p[1], CostPrice: p[2],
        SellingPrice: p[3], QuantityInStock: p[4], ReorderLevel: p[5], BranchID: p[6], ImageURL: p[7]
      });
    });
  }

  // Hero slides
  if (readAll_('HeroSlides').length === 0) {
    appendRow_('HeroSlides', { SlideID: 'HS-0001', ImageURL: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1600&auto=format&fit=crop', Title: 'Sharp Fades. Fresh Styles.', Subtitle: 'Book your next cut at Ghana\'s top-rated barbershop.', ButtonText: 'Book Now', ButtonLink: '#booking', SortOrder: 1, Active: 'Y' });
    appendRow_('HeroSlides', { SlideID: 'HS-0002', ImageURL: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1600&auto=format&fit=crop', Title: 'Braids, Facials & More', Subtitle: 'Full-service salon care across two branches.', ButtonText: 'View Services', ButtonLink: '#services', SortOrder: 2, Active: 'Y' });
  }

  // Gallery — showcase work samples on the public site (admin-manageable)
  if (readAll_('Gallery').length === 0) {
    var gallery = [
      ['https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop', 'Precision skin fade', 'Haircuts', 'BR-0001'],
      ['https://images.unsplash.com/photo-1622286346003-c5c7e63ff123?q=80&w=1000&auto=format&fit=crop', 'Clean beard sculpting', 'Shaves', 'BR-0001'],
      ['https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=1000&auto=format&fit=crop', 'Box braids finished look', 'Braids', 'BR-0001'],
      ['https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop', 'Fresh manicure set', 'Manicure', 'BR-0002'],
      ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=1000&auto=format&fit=crop', 'Glow facial treatment', 'Facials', 'BR-0002'],
      ['https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1000&auto=format&fit=crop', 'Our Osu branch interior', 'Our Shop', 'BR-0001']
    ];
    gallery.forEach(function (g, i) {
      appendRow_('Gallery', {
        GalleryID: 'GL-' + String(i + 1).padStart(4, '0'), ImageURL: g[0], Caption: g[1], Category: g[2],
        BranchID: g[3], SortOrder: i + 1, Active: 'Y'
      });
    });
  }

  // Sample customers + reviews, so the site looks credible on first launch.
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
        DateJoined: nowIso_(), LoyaltyPoints: [120, 45, 300, 80, 15][i], Notes: ''
      });
    });
  }
  if (readAll_('Reviews').length === 0) {
    var sampleReviews = [
      ['CU-0001', 'ST-0001', 5, 'Kwame gave me the cleanest skin fade I\'ve had in Accra. Sharp lineup, no wait time. My go-to spot now!'],
      ['CU-0002', 'ST-0003', 5, 'Ama\'s manicure lasted almost three weeks. The salon is spotless and the staff are so friendly.'],
      ['CU-0003', 'ST-0002', 4, 'Great braids work from Kofi, took a bit longer than expected but the result was worth it.'],
      ['CU-0004', 'ST-0004', 5, 'Efua\'s facial treatment left my skin glowing for my sister\'s wedding. Highly recommend booking ahead.'],
      ['CU-0005', 'ST-0001', 5, 'Booked online in two minutes and got an SMS confirmation right away. Very professional service.'],
      ['CU-0001', 'ST-0005', 5, 'Yaw runs a tight ship — the East Legon branch is always on time and the loyalty points are a nice touch.'],
      ['CU-0002', 'ST-0001', 5, 'Been coming here for a year. Consistent quality every single time, never disappointed.'],
      ['CU-0003', 'ST-0003', 4, 'Lovely pedicure experience, will definitely be back before my next event.']
    ];
    sampleReviews.forEach(function (r, i) {
      appendRow_('Reviews', {
        ReviewID: 'RV-' + String(i + 1).padStart(4, '0'), CustomerID: r[0], StaffID: r[1], Rating: r[2], Comment: r[3],
        Date: nowIso_()
      });
    });
  }

  // Default admin user
  if (readAll_('Users').length === 0) {
    var salt = Utilities.getUuid();
    appendRow_('Users', {
      Username: 'admin', PasswordHash: hashPassword_('admin123', salt), Salt: salt,
      Role: 'Owner', BranchID: 'ALL', Active: 'Y', StaffID: '', Email: 'owner@goldenclippers.com.gh', Phone: '0241234567'
    });
  }
}

/* ============================================================================
 * 4. GENERIC SHEET DATA-ACCESS HELPERS
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
 * Google Sheets auto-detects date/time-looking strings (like the ones
 * nowIso_() writes) and silently stores them as real Date values. Reading
 * such a cell back then returns a native Date object instead of a string —
 * and google.script.run has no way to serialize a Date inside a returned
 * object, so it silently delivers `null` to the client instead of throwing.
 * Every cell value is normalized back to a plain string/number/boolean here,
 * at the single point all sheet reads pass through, so nothing downstream
 * (internal string comparisons like `a.Date === '2026-01-01'`, or the JSON
 * sent back to the browser) can ever see a raw Date again.
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
      // skip fully blank rows
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
  // A cleared Customer/Appointment still "owns" its ID while it sits in
  // Trash — without this, a brand-new record created while the old one is
  // trashed could be handed that exact same ID, and restoring the trashed
  // record afterward would silently collide with (and corrupt) the new one.
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
 * 5. AUTH & SESSION MANAGEMENT
 * ==========================================================================*/

function hashPassword_(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + '::' + salt);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

/**
 * Authenticates a user against the Users sheet and returns a session token.
 */
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
  return {
    token: token,
    user: sessionData
  };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('session_' + token);
  return true;
}

/**
 * Public, unauthenticated self-registration from the Staff Login screen.
 * For security, a self-registered account is never granted an elevated
 * role or branch access automatically: it is created as an inactive
 * 'Staff' account with no branch assigned. An Owner must review it and
 * assign a role/branch/active status from the Users admin page before it
 * can log in — this prevents anyone who finds the login page from
 * creating themselves a privileged account.
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

  return { message: 'Account created! An admin will review your details and activate your access before you can log in.' };
}

function requireAuth_(token) {
  if (!token) throw new Error('Not authenticated. Please log in.');
  var raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) throw new Error('Session expired. Please log in again.');
  return JSON.parse(raw);
}

function requireRole_(user, allowedRoles) {
  if (allowedRoles.indexOf(user.role) === -1) {
    throw new Error('You do not have permission to perform this action.');
  }
}

/** Returns the effective branch filter for a user: their own branch, or null for Owner (= all branches). */
function scopeBranch_(user, requestedBranchId) {
  if (user.role === 'Owner') {
    return requestedBranchId && requestedBranchId !== 'ALL' ? requestedBranchId : null;
  }
  return user.branchId;
}

function getCurrentUser(token) {
  return requireAuth_(token);
}

/* ============================================================================
 * 6. PUBLIC-FACING FUNCTIONS (WEBSITE + BOOKING)
 * ==========================================================================*/

/** Single aggregated call the public site uses on load — keeps things light on mobile data. */
function getPublicData() {
  var settings = getSettingsMap_();
  // This app runs for exactly one shop — the Branches sheet always holds
  // exactly one row for it (mergeToSingleBranch_ guarantees that even for
  // a spreadsheet that once had more). Defensive slice in case a row ever
  // slips in some other way; there's never a branch picker to show either way.
  var branches = readAll_('Branches').slice(0, 1);
  var services = readAll_('Services').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  var staff = readAll_('Staff').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  var heroSlides = readAll_('HeroSlides')
    .filter(function (h) { return String(h.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  var gallery = readAll_('Gallery')
    .filter(function (g) { return String(g.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  var videos = readAll_('Videos')
    .filter(function (v) { return String(v.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  var reviewRows = readAll_('Reviews');
  var customersMap = keyBy_(readAll_('Customers'), 'CustomerID');
  var staffMapForReviews = keyBy_(readAll_('Staff'), 'StaffID');
  var reviews = reviewRows.slice(-16).reverse().map(function (r) {
    var o = stripRow_(r);
    o.CustomerName = customersMap[r.CustomerID] ? firstNameOnly_(customersMap[r.CustomerID].Name) : 'Customer';
    o.StaffName = staffMapForReviews[r.StaffID] ? staffMapForReviews[r.StaffID].Name : '';
    return o;
  });

  var shopStatus = branches[0] ? computeShopStatus_(parseBranchWeeklyHours_(branches[0])) : null;

  var servicesRows = services.map(stripRow_);
  var staffRows = staff.map(function (s) { return stripRow_(sanitizeStaff_(s)); });
  var heroRows = heroSlides.map(stripRow_);
  var galleryRows = gallery.map(stripRow_);

  // This call touches more photos than any other in the app — logo,
  // every active service, every active staff member, every hero slide,
  // every gallery photo — so they're all resolved in one single batched
  // round trip (see batchResolveImageUrls_) instead of five separate ones.
  var imgUrls = [settings.LogoURL]
    .concat(servicesRows.map(function (s) { return s.ImageURL; }))
    .concat(staffRows.map(function (s) { return s.PhotoURL; }))
    .concat(heroRows.map(function (h) { return h.ImageURL; }))
    .concat(galleryRows.map(function (g) { return g.ImageURL; }));
  var resolved = batchResolveImageUrls_(imgUrls);
  var idx = 0;
  if (settings.LogoURL) settings.LogoURL = resolved[idx];
  idx++;
  servicesRows.forEach(function (s) { if (s.ImageURL) s.ImageURL = resolved[idx]; idx++; });
  staffRows.forEach(function (s) { if (s.PhotoURL) s.PhotoURL = resolved[idx]; idx++; });
  heroRows.forEach(function (h) { if (h.ImageURL) h.ImageURL = resolved[idx]; idx++; });
  galleryRows.forEach(function (g) { if (g.ImageURL) g.ImageURL = resolved[idx]; idx++; });

  return {
    settings: settings,
    branches: branches.map(stripRow_),
    services: servicesRows,
    staff: staffRows,
    heroSlides: heroRows,
    gallery: galleryRows,
    videos: videos.map(stripRow_),
    reviews: reviews,
    shopStatus: shopStatus
  };
}

function sanitizeStaff_(s) {
  return { StaffID: s.StaffID, Name: s.Name, Role: s.Role, BranchID: s.BranchID, Specialties: s.Specialties, PhotoURL: s.PhotoURL, WorkDays: s.WorkDays, Active: s.Active };
}

function firstNameOnly_(fullName) {
  var parts = String(fullName || '').trim().split(/\s+/);
  return parts[0] + (parts[1] ? ' ' + parts[1].charAt(0) + '.' : '');
}

function stripRow_(obj) {
  var copy = {};
  Object.keys(obj).forEach(function (k) { if (k !== '_row') copy[k] = obj[k]; });
  return copy;
}

/**
 * Public booking submission. All prices are resolved server-side; the client
 * never dictates a price. Returns a booking reference.
 */
function createAppointment(data) {
  data = data || {};
  var name = String(data.name || '').trim();
  var phoneRaw = String(data.phone || '').trim();
  var branchId = String(data.branchId || '').trim();
  var serviceId = String(data.serviceId || '').trim();
  var staffId = String(data.staffId || '').trim(); // may be '' = any available
  var date = String(data.date || '').trim();
  var timeSlot = String(data.timeSlot || '').trim();
  var email = String(data.email || '').trim();

  if (!name) throw new Error('Please enter your name.');
  var phone = normalizeGhanaPhone_(phoneRaw);
  if (!phone) throw new Error('Please enter a valid Ghana phone number, e.g. 024XXXXXXX or +233XXXXXXXXX.');
  if (!branchId) throw new Error('Please select a branch.');
  if (!serviceId) throw new Error('Please select a service.');
  if (!date || !timeSlot) throw new Error('Please choose a date and time.');

  var service = readAll_('Services').find(function (s) { return s.ServiceID === serviceId; });
  if (!service || String(service.Active).toUpperCase() !== 'Y') throw new Error('The selected service is not available.');

  var branch = readAll_('Branches').find(function (b) { return b.BranchID === branchId; });
  if (!branch) throw new Error('The selected branch was not found.');

  if (staffId) {
    var staffMember = readAll_('Staff').find(function (s) { return s.StaffID === staffId; });
    if (!staffMember || String(staffMember.Active).toUpperCase() !== 'Y') throw new Error('The selected staff member is not available.');
  }

  if (!isSlotAvailable_(branchId, staffId, date, timeSlot)) {
    throw new Error('Sorry, that time slot was just taken. Please go back and choose another time.');
  }

  // Find or create the customer by phone number
  var customer = findOrCreateCustomerByPhone_(name, phone, email);

  var paySettings = getSettingsMap_();
  var activeMethods = String(paySettings.ActivePaymentMethods || '').split(',').map(function (m) { return m.trim(); }).filter(Boolean);
  if (!activeMethods.length) activeMethods = PAYMENT_METHODS.slice();
  var paymentMethod = (activeMethods.indexOf(data.paymentMethod) > -1 && paymentMethodDetailsFilled_(paySettings, data.paymentMethod)) ? data.paymentMethod : 'Cash';
  var paymentProofURL = String(data.paymentProofURL || '').trim();
  var paymentStatus = paymentMethod === 'Cash' ? 'Pay at Shop' : (paymentProofURL ? 'Pending Verification' : 'Awaiting Payment');

  var appointmentId = nextId_('Appointments', 'AppointmentID');
  var reference = 'BOOK-' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + appointmentId.split('-')[1];

  var appt = appendRow_('Appointments', {
    AppointmentID: appointmentId,
    Reference: reference,
    CustomerID: customer.CustomerID,
    StaffID: staffId,
    ServiceID: serviceId,
    BranchID: branchId,
    Date: date,
    TimeSlot: timeSlot,
    Status: 'Pending',
    CreatedAt: nowIso_(),
    Notes: String(data.notes || ''),
    PaymentMethod: paymentMethod,
    PaymentStatus: paymentStatus,
    PaymentProofURL: paymentProofURL
  });

  sendAppointmentConfirmation_(appt, customer, service, branch);

  return {
    reference: reference,
    appointmentId: appointmentId,
    message: 'Your booking request has been received! We will confirm shortly by SMS/Email.'
  };
}

function submitReview(data) {
  data = data || {};
  var rating = Number(data.rating);
  if (!rating || rating < 1 || rating > 5) throw new Error('Please provide a rating between 1 and 5.');
  var customerId = data.customerId || '';
  if (!customerId && data.name && data.phone) {
    var phone = normalizeGhanaPhone_(data.phone);
    if (phone) customerId = findOrCreateCustomerByPhone_(data.name, phone, '').CustomerID;
  }
  var review = appendRow_('Reviews', {
    ReviewID: nextId_('Reviews', 'ReviewID'),
    CustomerID: customerId,
    StaffID: data.staffId || '',
    Rating: rating,
    Comment: String(data.comment || '').trim(),
    Date: nowIso_()
  });
  return stripRow_(review);
}

/** The shop's own weekly schedule (edited from the Shop Info page), for the one branch this app runs for. */
function getEffectiveWeeklyHours_(branchId) {
  var branch = readAll_('Branches').find(function (b) { return b.BranchID === branchId; });
  return parseBranchWeeklyHours_(branch);
}

/**
 * Returns bookable time slots for a branch/date, optionally scoped to one
 * stylist ("Anyone" when staffId is ''). Used by the public booking wizard
 * to render a live availability grid, and defensively by createAppointment()
 * to prevent double-booking.
 */
function getAvailableSlots(branchId, staffId, date) {
  if (!branchId || !date) return { slots: [], dayAvailable: true };
  var settings = getSettingsMap_();
  var interval = Number(settings.SlotIntervalMinutes) || 30;
  var weekday = Utilities.formatDate(new Date(date + 'T00:00:00'), TIMEZONE, 'EEE');
  var window = dayWindowMinutes_(getEffectiveWeeklyHours_(branchId)[weekday]);

  var branchStaff = readAll_('Staff').filter(function (s) {
    return s.BranchID === branchId && String(s.Active).toUpperCase() === 'Y';
  });

  // A specific date the staff member has taken off (StaffLeave) — checked
  // alongside their regular weekly WorkDays pattern, so a one-off absence
  // doesn't require touching their permanent schedule.
  var staffOnLeaveToday = {};
  readAll_('StaffLeave').filter(function (l) { return l.Date === date; }).forEach(function (l) { staffOnLeaveToday[l.StaffID] = true; });
  function staffWorksToday_(s) { return worksOnDay_(s, weekday) && !staffOnLeaveToday[s.StaffID]; }

  // The shop's own weekly hours gate the day first — no staff schedule can
  // open a day the shop itself is closed on.
  var dayAvailable = window.open;
  var candidateStaff = branchStaff;
  if (dayAvailable) {
    if (staffId) {
      var chosen = branchStaff.find(function (s) { return s.StaffID === staffId; });
      if (!chosen) return { slots: [], dayAvailable: false };
      dayAvailable = staffWorksToday_(chosen);
      candidateStaff = [chosen];
    } else {
      dayAvailable = branchStaff.some(staffWorksToday_);
    }
  }

  var existing = readAll_('Appointments').filter(function (a) {
    return a.BranchID === branchId && a.Date === date && a.Status !== 'Cancelled' && a.Status !== 'No-show';
  });
  var blocked = readAll_('BlockedSlots').filter(function (b) { return b.BranchID === branchId && b.Date === date; });
  var blockedTimes = {};
  blocked.forEach(function (b) { blockedTimes[b.TimeSlot] = true; });

  var slots = [];
  if (window.open) {
    for (var mins = window.startMin; mins < window.endMin; mins += interval) {
      var h = Math.floor(mins / 60), m = mins % 60;
      var label = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      var available = dayAvailable && !blockedTimes[label] && candidateStaff.some(function (s) {
        if (!staffWorksToday_(s)) return false;
        return !existing.some(function (a) { return a.StaffID === s.StaffID && a.TimeSlot === label; });
      });
      slots.push({ time: label, available: available, blocked: !!blockedTimes[label] });
    }
  }
  return { slots: slots, dayAvailable: dayAvailable };
}

/* ---------- Manual slot blocking ("Admin can set slots") ---------- */

/** Returns every bookable slot for a branch/date plus whether it's admin-blocked, for the Manage Slots admin page. */
function getSlotsForAdmin(token, branchId, date) {
  requireAuth_(token);
  var settings = getSettingsMap_();
  var interval = Number(settings.SlotIntervalMinutes) || 30;
  var weekday = Utilities.formatDate(new Date(date + 'T00:00:00'), TIMEZONE, 'EEE');
  var window = dayWindowMinutes_(getEffectiveWeeklyHours_(branchId)[weekday]);
  var blocked = readAll_('BlockedSlots').filter(function (b) { return b.BranchID === branchId && b.Date === date; });
  var blockedTimes = {};
  blocked.forEach(function (b) { blockedTimes[b.TimeSlot] = true; });
  var existing = readAll_('Appointments').filter(function (a) {
    return a.BranchID === branchId && a.Date === date && a.Status !== 'Cancelled' && a.Status !== 'No-show';
  });
  var bookedTimes = {};
  existing.forEach(function (a) { bookedTimes[a.TimeSlot] = (bookedTimes[a.TimeSlot] || 0) + 1; });

  var slots = [];
  if (window.open) {
    for (var mins = window.startMin; mins < window.endMin; mins += interval) {
      var h = Math.floor(mins / 60), m = mins % 60;
      var label = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
      slots.push({ time: label, blocked: !!blockedTimes[label], bookedCount: bookedTimes[label] || 0 });
    }
  }
  return { dayOpen: window.open, slots: slots };
}

/** Toggles a slot between blocked/open for every stylist at a branch on a given date. */
function toggleBlockedSlot(token, branchId, date, timeSlot) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var rows = readAll_('BlockedSlots');
  var existing = rows.find(function (b) { return b.BranchID === branchId && b.Date === date && b.TimeSlot === timeSlot; });
  if (existing) {
    deleteById_('BlockedSlots', 'BlockedSlotID', existing.BlockedSlotID);
    return { blocked: false };
  }
  appendRow_('BlockedSlots', { BlockedSlotID: nextId_('BlockedSlots', 'BlockedSlotID'), BranchID: branchId, Date: date, TimeSlot: timeSlot });
  return { blocked: true };
}

function worksOnDay_(staffMember, weekday) {
  var days = String(staffMember.WorkDays || '').split(',').map(function (d) { return d.trim(); }).filter(Boolean);
  return days.length === 0 || days.indexOf(weekday) > -1;
}

function isSlotAvailable_(branchId, staffId, date, timeSlot) {
  var result = getAvailableSlots(branchId, staffId, date);
  if (!result.dayAvailable) return false; // shop/staff closed that day — never valid, regardless of the specific time
  var slot = result.slots.find(function (s) { return s.time === timeSlot; });
  return !slot || slot.available; // an off-grid custom time within an open day is not blocked
}

/* ---------- Gallery (public showcase + admin management) ---------- */

function getGallery(token) {
  requireAuth_(token);
  var rows = readAll_('Gallery').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); }).map(stripRow_);
  return withImageDataUris_(rows, 'ImageURL');
}

function saveGalleryItem(token, item) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  item.SortOrder = Number(item.SortOrder) || 1;
  item.Active = item.Active === 'N' ? 'N' : 'Y';
  if (item.GalleryID) return stripRow_(updateById_('Gallery', 'GalleryID', item.GalleryID, item));
  item.GalleryID = nextId_('Gallery', 'GalleryID');
  return stripRow_(appendRow_('Gallery', item));
}

function deleteGalleryItem(token, galleryId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Gallery', 'GalleryID', galleryId);
}

/* ---------- Videos (public showcase + admin management) ----------
 * Admin pastes a video URL (YouTube, Vimeo, or a direct .mp4 link) —
 * no large file upload through Apps Script, which would be slow and
 * hit execution/size limits. */

function getVideos(token) {
  requireAuth_(token);
  return readAll_('Videos').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); }).map(stripRow_);
}

function saveVideo(token, item) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  if (!item.VideoURL) throw new Error('Please enter a video URL.');
  item.SortOrder = Number(item.SortOrder) || 1;
  item.Active = item.Active === 'N' ? 'N' : 'Y';
  if (item.VideoID) return stripRow_(updateById_('Videos', 'VideoID', item.VideoID, item));
  item.VideoID = nextId_('Videos', 'VideoID');
  return stripRow_(appendRow_('Videos', item));
}

function deleteVideo(token, videoId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Videos', 'VideoID', videoId);
}

/* ============================================================================
 * 7. BRANCHES / SERVICES / STAFF CRUD (admin)
 * ==========================================================================*/

/**
 * This app runs for exactly one shop, so "Branches" is really just a single
 * record — its name, location, phone, and working hours — not a list to
 * add to or delete from. getShopInfo/saveShopInfo read and write that one
 * row directly; there is no delete, because there must always be exactly
 * one (mergeToSingleBranch_ guarantees that on setup, even for a
 * spreadsheet that once had more than one branch).
 */
function getShopInfo(token) {
  requireAuth_(token);
  var branch = readAll_('Branches')[0];
  if (!branch) return null;
  var info = stripRow_(branch);
  // Included so the admin dashboard's boot sequence can show the live
  // Open Now/Closed Now badge from this one lightweight call, instead of
  // needing the full (image-heavy) getPublicData() bundle just to render
  // the topbar.
  info.status = computeShopStatus_(parseBranchWeeklyHours_(branch));
  return info;
}

function saveShopInfo(token, info) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  // OpeningHours is never typed by hand — it's auto-derived from the
  // structured per-day WeeklyHours editor so there's only one place
  // (WeeklyHours) that can ever go out of sync with what's displayed.
  if (info.WeeklyHours) info.OpeningHours = summarizeWeeklyHours_(parseBranchWeeklyHours_(info));
  var existing = readAll_('Branches')[0];
  if (existing) return stripRow_(updateById_('Branches', 'BranchID', existing.BranchID, info));
  info.BranchID = nextId_('Branches', 'BranchID');
  return stripRow_(appendRow_('Branches', info));
}

function getServices(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var rows = readAll_('Services');
  if (scoped) rows = rows.filter(function (s) { return s.BranchID === scoped; });
  return withImageDataUris_(rows.map(stripRow_), 'ImageURL');
}

function saveService(token, service) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  service.Price = Number(service.Price) || 0;
  service.DurationMinutes = Number(service.DurationMinutes) || 0;
  service.Active = service.Active === 'N' ? 'N' : 'Y';
  if (service.ServiceID) {
    return stripRow_(updateById_('Services', 'ServiceID', service.ServiceID, service));
  }
  service.ServiceID = nextId_('Services', 'ServiceID');
  return stripRow_(appendRow_('Services', service));
}

function deleteService(token, serviceId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Services', 'ServiceID', serviceId);
}

function getStaff(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var rows = readAll_('Staff');
  if (scoped) rows = rows.filter(function (s) { return s.BranchID === scoped; });
  return withImageDataUris_(rows.map(stripRow_), 'PhotoURL');
}

function saveStaff(token, staff) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  staff.CommissionRate = Number(staff.CommissionRate) || 0;
  staff.Active = staff.Active === 'N' ? 'N' : 'Y';
  if (staff.StaffID) {
    return stripRow_(updateById_('Staff', 'StaffID', staff.StaffID, staff));
  }
  staff.StaffID = nextId_('Staff', 'StaffID');
  return stripRow_(appendRow_('Staff', staff));
}

function deleteStaff(token, staffId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Staff', 'StaffID', staffId);
}

/* ---------- Staff time off (one-off absences, separate from the permanent weekly WorkDays schedule) ---------- */

function getStaffLeave(token, staffId) {
  requireAuth_(token);
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  return readAll_('StaffLeave')
    .filter(function (l) { return l.StaffID === staffId && l.Date >= today; })
    .sort(function (a, b) { return a.Date.localeCompare(b.Date); })
    .map(stripRow_);
}

function addStaffLeave(token, staffId, date, reason) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var already = readAll_('StaffLeave').find(function (l) { return l.StaffID === staffId && l.Date === date; });
  if (already) return stripRow_(already); // idempotent — adding the same day off twice is a no-op, not a duplicate
  return stripRow_(appendRow_('StaffLeave', { LeaveID: nextId_('StaffLeave', 'LeaveID'), StaffID: staffId, Date: date, Reason: String(reason || '').trim() }));
}

function removeStaffLeave(token, leaveId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('StaffLeave', 'LeaveID', leaveId);
}

/* ============================================================================
 * 8. CUSTOMERS / CRM / LOYALTY
 * ==========================================================================*/

function findOrCreateCustomerByPhone_(name, phone, email) {
  var customers = readAll_('Customers');
  var existing = customers.find(function (c) { return normalizeGhanaPhone_(c.Phone) === phone; });
  if (existing) {
    if (email && !existing.Email) updateById_('Customers', 'CustomerID', existing.CustomerID, { Email: email });
    return existing;
  }
  var customer = appendRow_('Customers', {
    CustomerID: nextId_('Customers', 'CustomerID'),
    Name: name,
    Phone: phone,
    Email: email || '',
    DateJoined: nowIso_(),
    LoyaltyPoints: 0,
    Notes: ''
  });
  return customer;
}

function getCustomers(token, search) {
  requireAuth_(token);
  var rows = readAll_('Customers');
  if (search) {
    var q = String(search).toLowerCase();
    rows = rows.filter(function (c) {
      return String(c.Name).toLowerCase().indexOf(q) > -1 || String(c.Phone).indexOf(q) > -1;
    });
  }
  var settings = getSettingsMap_();
  var threshold = Number(settings.FavouriteVisitThreshold) || 3;
  var counts = computeCustomerVisitCounts_(Number(settings.FavouriteWindowDays) || 90);
  return rows.map(function (c) {
    var o = stripRow_(c);
    o.RecentVisits = counts[c.CustomerID] || 0;
    o.IsFavourite = o.RecentVisits >= threshold;
    return o;
  });
}

/**
 * How many times each customer has visited (a completed appointment, or a
 * POS sale) in the trailing `windowDays` days — the basis for auto-flagging
 * "Favourite" regulars in the Customers list, so the Owner can spot who's
 * worth a discount/promo without having to dig through each profile by hand.
 */
function computeCustomerVisitCounts_(windowDays) {
  var cutoff = windowDays ? addDays_(Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd'), -windowDays) : null;
  var counts = {};
  readAll_('Appointments').forEach(function (a) {
    if (a.Status !== 'Completed' || !a.CustomerID) return;
    if (cutoff && a.Date < cutoff) return;
    counts[a.CustomerID] = (counts[a.CustomerID] || 0) + 1;
  });
  readAll_('Sales').forEach(function (s) {
    if (!s.CustomerID) return;
    if (cutoff && String(s.Date).slice(0, 10) < cutoff) return;
    counts[s.CustomerID] = (counts[s.CustomerID] || 0) + 1;
  });
  return counts;
}

function getCustomerProfile(token, customerId) {
  requireAuth_(token);
  var customer = readAll_('Customers').find(function (c) { return c.CustomerID === customerId; });
  if (!customer) throw new Error('Customer not found.');
  var appts = readAll_('Appointments').filter(function (a) { return a.CustomerID === customerId; });
  var sales = readAll_('Sales').filter(function (s) { return s.CustomerID === customerId; });
  var reviews = readAll_('Reviews').filter(function (r) { return r.CustomerID === customerId; });
  return {
    customer: stripRow_(customer),
    appointments: appts.map(stripRow_),
    sales: sales.map(function (s) { return stripRow_(withParsedItems_(s)); }),
    reviews: reviews.map(stripRow_)
  };
}

function saveCustomer(token, customer) {
  requireAuth_(token);
  if (customer.Phone) {
    var normalized = normalizeGhanaPhone_(customer.Phone);
    if (!normalized) throw new Error('Invalid Ghana phone number.');
    customer.Phone = normalized;
  }
  if (customer.CustomerID) {
    return stripRow_(updateById_('Customers', 'CustomerID', customer.CustomerID, customer));
  }
  customer.CustomerID = nextId_('Customers', 'CustomerID');
  customer.DateJoined = customer.DateJoined || nowIso_();
  customer.LoyaltyPoints = customer.LoyaltyPoints || 0;
  return stripRow_(appendRow_('Customers', customer));
}

/* ============================================================================
 * 9. APPOINTMENTS
 * ==========================================================================*/

function getAppointments(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var scoped = scopeBranch_(user, filters.branchId);
  var rows = readAll_('Appointments');
  if (scoped) rows = rows.filter(function (a) { return a.BranchID === scoped; });
  if (filters.date) rows = rows.filter(function (a) { return a.Date === filters.date; });
  if (filters.status) rows = rows.filter(function (a) { return a.Status === filters.status; });
  if (filters.staffId) rows = rows.filter(function (a) { return a.StaffID === filters.staffId; });
  if (user.role === 'Staff' && user.staffId) rows = rows.filter(function (a) { return a.StaffID === user.staffId; });

  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');

  return rows
    .sort(function (a, b) { return (a.Date + a.TimeSlot).localeCompare(b.Date + b.TimeSlot); })
    .map(function (a) {
      var o = stripRow_(a);
      o.CustomerName = customers[a.CustomerID] ? customers[a.CustomerID].Name : 'Walk-in';
      o.CustomerPhone = customers[a.CustomerID] ? customers[a.CustomerID].Phone : '';
      o.ServiceName = services[a.ServiceID] ? services[a.ServiceID].Name : '';
      o.ServicePrice = services[a.ServiceID] ? services[a.ServiceID].Price : 0;
      o.StaffName = staffMap[a.StaffID] ? staffMap[a.StaffID].Name : 'Any available';
      return o;
    });
}

function updateAppointmentStatus(token, appointmentId, status) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist', 'Staff']);
  var valid = ['Pending', 'Confirmed', 'Completed', 'No-show', 'Cancelled'];
  if (valid.indexOf(status) === -1) throw new Error('Invalid status.');

  var appt = updateById_('Appointments', 'AppointmentID', appointmentId, { Status: status });

  if (status === 'Completed') {
    var customer = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
    var service = readAll_('Services').find(function (s) { return s.ServiceID === appt.ServiceID; });
    if (customer && service) {
      var settings = getSettingsMap_();
      var pointsPerCedi = Number(settings.LoyaltyPointsPerCedi) || 1;
      var earned = Math.round(Number(service.Price) * pointsPerCedi);
      updateById_('Customers', 'CustomerID', customer.CustomerID, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + earned });
      sendCompletionThankYou_(appt, customer, service, earned);
    }
  } else if (status === 'Confirmed') {
    var cust2 = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
    if (cust2) sendAppointmentStatusUpdate_(appt, cust2, 'confirmed');
  } else if (status === 'Cancelled') {
    var cust3 = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
    if (cust3) sendAppointmentStatusUpdate_(appt, cust3, 'cancelled');
  }

  return stripRow_(appt);
}

function rescheduleAppointment(token, appointmentId, date, timeSlot) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var appt = updateById_('Appointments', 'AppointmentID', appointmentId, { Date: date, TimeSlot: timeSlot, Status: 'Pending' });
  var customer = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
  if (customer) sendAppointmentStatusUpdate_(appt, customer, 'rescheduled to ' + date + ' ' + timeSlot);
  return stripRow_(appt);
}

/** Owner/Manager/Receptionist marks a manually-verified mobile money/bank payment as confirmed. */
function verifyAppointmentPayment(token, appointmentId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var updated = updateById_('Appointments', 'AppointmentID', appointmentId, { PaymentStatus: 'Paid' });
  return stripRow_(updated);
}

function createAppointmentAdmin(token, data) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var result = createAppointment(data);
  if (data.status && data.status !== 'Pending') {
    updateAppointmentStatus(token, result.appointmentId, data.status);
  }
  return result;
}

/* ============================================================================
 * 10. POINT OF SALE (POS) / SALES
 * ==========================================================================*/

/**
 * Creates a sale. The client sends only IDs and quantities — all prices are
 * looked up server-side to prevent tampering.
 */
function createSale(token, sale) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Staff', 'Receptionist']);
  sale = sale || {};

  var branchId = sale.branchId || user.branchId;
  if (user.role !== 'Owner' && branchId !== user.branchId) branchId = user.branchId;
  if (!branchId) throw new Error('Branch is required.');
  if (!sale.items || !sale.items.length) throw new Error('Add at least one item to the sale.');

  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var products = keyBy_(readAll_('Products'), 'ProductID');
  var lineItems = [];
  var subtotal = 0;

  sale.items.forEach(function (item) {
    var qty = Math.max(1, Number(item.qty) || 1);
    if (item.type === 'service') {
      var s = services[item.id];
      if (!s) throw new Error('Service not found: ' + item.id);
      var lineTotal = Number(s.Price) * qty;
      subtotal += lineTotal;
      lineItems.push({ type: 'service', id: s.ServiceID, name: s.Name, qty: qty, unitPrice: Number(s.Price), lineTotal: lineTotal });
    } else if (item.type === 'product') {
      var p = products[item.id];
      if (!p) throw new Error('Product not found: ' + item.id);
      if (Number(p.QuantityInStock) < qty) throw new Error('Insufficient stock for ' + p.Name + '.');
      var lineTotal2 = Number(p.SellingPrice) * qty;
      subtotal += lineTotal2;
      lineItems.push({ type: 'product', id: p.ProductID, name: p.Name, qty: qty, unitPrice: Number(p.SellingPrice), lineTotal: lineTotal2 });
    } else {
      throw new Error('Unknown item type.');
    }
  });

  var settings = getSettingsMap_();
  var discount = Math.max(0, Math.min(Number(sale.discount) || 0, subtotal));
  var taxRate = Number(settings.TaxRatePercent) || 0;
  var taxable = subtotal - discount;
  var tax = round2_(taxable * (taxRate / 100));
  var total = round2_(taxable + tax);

  var validPayments = ['Cash', 'MoMo', 'MTN MoMo', 'Vodafone Cash', 'Telecel Cash', 'AirtelTigo Money', 'Card'];
  var paymentMethod = validPayments.indexOf(sale.paymentMethod) > -1 ? sale.paymentMethod : 'Cash';

  var customerId = sale.customerId || '';
  if (!customerId && sale.customerName && sale.customerPhone) {
    var cust = findOrCreateCustomerByPhone_(sale.customerName, sale.customerPhone, sale.customerEmail || '');
    customerId = cust.CustomerID;
  }

  var record = appendRow_('Sales', {
    SaleID: nextId_('Sales', 'SaleID'),
    Date: nowIso_(),
    BranchID: branchId,
    CustomerID: customerId,
    StaffID: sale.staffId || user.staffId || '',
    Items: JSON.stringify(lineItems),
    Subtotal: round2_(subtotal),
    Discount: round2_(discount),
    Tax: tax,
    Total: total,
    PaymentMethod: paymentMethod,
    PaymentStatus: sale.paymentStatus === 'Pending' ? 'Pending' : 'Paid'
  });

  // Decrement stock for products sold
  lineItems.forEach(function (li) {
    if (li.type === 'product') {
      var p = products[li.id];
      updateById_('Products', 'ProductID', li.id, { QuantityInStock: Number(p.QuantityInStock) - li.qty });
    }
  });

  // Loyalty points + receipt
  if (customerId) {
    var customer = readAll_('Customers').find(function (c) { return c.CustomerID === customerId; });
    if (customer) {
      var pointsPerCedi = Number(settings.LoyaltyPointsPerCedi) || 1;
      var earned = Math.round(total * pointsPerCedi);
      updateById_('Customers', 'CustomerID', customerId, { LoyaltyPoints: Number(customer.LoyaltyPoints || 0) + earned });
      sendSaleReceipt_(record, customer, lineItems, earned);
    }
  }

  return withParsedItems_(record);
}

function getSales(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var scoped = scopeBranch_(user, filters.branchId);
  var rows = readAll_('Sales');
  if (scoped) rows = rows.filter(function (s) { return s.BranchID === scoped; });
  if (filters.startDate) rows = rows.filter(function (s) { return s.Date >= filters.startDate; });
  if (filters.endDate) rows = rows.filter(function (s) { return s.Date <= filters.endDate + 'T23:59:59'; });
  rows.sort(function (a, b) { return b.Date.localeCompare(a.Date); });
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  return rows.map(function (s) {
    var o = withParsedItems_(s);
    o.CustomerName = customers[s.CustomerID] ? customers[s.CustomerID].Name : 'Walk-in';
    o.StaffName = staffMap[s.StaffID] ? staffMap[s.StaffID].Name : '';
    return o;
  });
}

function withParsedItems_(saleRow) {
  var o = stripRow_(saleRow);
  try { o.Items = JSON.parse(o.Items || '[]'); } catch (e) { o.Items = []; }
  return o;
}

/* ============================================================================
 * 11. PRODUCTS / INVENTORY
 * ==========================================================================*/

function getProducts(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var rows = readAll_('Products');
  if (scoped) rows = rows.filter(function (p) { return p.BranchID === scoped; });
  return withImageDataUris_(rows.map(stripRow_), 'ImageURL');
}

function saveProduct(token, product) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  product.CostPrice = Number(product.CostPrice) || 0;
  product.SellingPrice = Number(product.SellingPrice) || 0;
  product.QuantityInStock = Number(product.QuantityInStock) || 0;
  product.ReorderLevel = Number(product.ReorderLevel) || 0;
  if (product.ProductID) {
    return stripRow_(updateById_('Products', 'ProductID', product.ProductID, product));
  }
  product.ProductID = nextId_('Products', 'ProductID');
  return stripRow_(appendRow_('Products', product));
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
  var newQty = Number(product.QuantityInStock) + Math.max(0, Number(qty) || 0);
  return stripRow_(updateById_('Products', 'ProductID', productId, { QuantityInStock: newQty }));
}

function getLowStockProducts(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var rows = readAll_('Products');
  if (scoped) rows = rows.filter(function (p) { return p.BranchID === scoped; });
  return rows.filter(function (p) { return Number(p.QuantityInStock) <= Number(p.ReorderLevel); }).map(stripRow_);
}

/* ============================================================================
 * 12. EXPENSES
 * ==========================================================================*/

/**
 * Income & Expenses summary. Income is never manually entered — it's
 * derived automatically from every completed POS sale in the Sales
 * sheet (which is already recorded the moment a checkout happens), so
 * "the system records daily income automatically" just means reading
 * Sales instead of asking the admin to log it a second time. Expenses
 * are still the existing manually-logged Expenses sheet.
 */
function getIncomeExpenseSummary(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var scoped = scopeBranch_(user, filters.branchId);
  var startDate = filters.startDate || Utilities.formatDate(addDaysDate_(new Date(), -30), TIMEZONE, 'yyyy-MM-dd');
  var endDate = filters.endDate || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  var sales = readAll_('Sales');
  if (scoped) sales = sales.filter(function (s) { return s.BranchID === scoped; });
  sales = sales.filter(function (s) { var d = String(s.Date).slice(0, 10); return d >= startDate && d <= endDate; });

  var expenses = readAll_('Expenses');
  if (scoped) expenses = expenses.filter(function (e) { return e.BranchID === scoped; });
  expenses = expenses.filter(function (e) { return e.Date >= startDate && e.Date <= endDate; });

  var byDate = {};
  function dayRow(d) { if (!byDate[d]) byDate[d] = { date: d, income: 0, expense: 0 }; return byDate[d]; }
  sales.forEach(function (s) { dayRow(String(s.Date).slice(0, 10)).income += Number(s.Total) || 0; });
  expenses.forEach(function (e) { dayRow(e.Date).expense += Number(e.Amount) || 0; });

  var days = Object.keys(byDate).sort().reverse().map(function (d) {
    var row = byDate[d];
    return { date: row.date, income: round2_(row.income), expense: round2_(row.expense), net: round2_(row.income - row.expense) };
  });

  var totalIncome = sales.reduce(function (sum, s) { return sum + (Number(s.Total) || 0); }, 0);
  var totalExpense = expenses.reduce(function (sum, e) { return sum + (Number(e.Amount) || 0); }, 0);

  return { days: days, totalIncome: round2_(totalIncome), totalExpense: round2_(totalExpense), net: round2_(totalIncome - totalExpense) };
}

function getExpenses(token, filters) {
  var user = requireAuth_(token);
  filters = filters || {};
  var scoped = scopeBranch_(user, filters.branchId);
  var rows = readAll_('Expenses');
  if (scoped) rows = rows.filter(function (e) { return e.BranchID === scoped; });
  if (filters.startDate) rows = rows.filter(function (e) { return e.Date >= filters.startDate; });
  if (filters.endDate) rows = rows.filter(function (e) { return e.Date <= filters.endDate; });
  rows.sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); });
  return rows.map(stripRow_);
}

function saveExpense(token, expense) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  expense.Amount = Number(expense.Amount) || 0;
  expense.BranchID = expense.BranchID || user.branchId;
  if (expense.ExpenseID) {
    return stripRow_(updateById_('Expenses', 'ExpenseID', expense.ExpenseID, expense));
  }
  expense.ExpenseID = nextId_('Expenses', 'ExpenseID');
  expense.Date = expense.Date || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  return stripRow_(appendRow_('Expenses', expense));
}

function deleteExpense(token, expenseId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Expenses', 'ExpenseID', expenseId);
}

/* ============================================================================
 * 13. USERS MANAGEMENT
 * ==========================================================================*/

function getUsers(token) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return readAll_('Users').map(function (u) {
    return { Username: u.Username, Role: u.Role, BranchID: u.BranchID, Active: u.Active, StaffID: u.StaffID, Email: u.Email, Phone: u.Phone, FullName: u.FullName };
  });
}

function saveUser(token, userData) {
  var current = requireAuth_(token);
  requireRole_(current, ['Owner']);
  if (ROLES.indexOf(userData.Role) === -1) throw new Error('Invalid role.');

  var existing = readAll_('Users').find(function (u) { return u.Username === userData.Username; });
  if (existing) {
    var updates = { Role: userData.Role, BranchID: userData.BranchID, Active: userData.Active, StaffID: userData.StaffID || '', Email: userData.Email || '', Phone: userData.Phone || '', FullName: userData.FullName || existing.FullName || '' };
    if (userData.Password) {
      var salt = Utilities.getUuid();
      updates.Salt = salt;
      updates.PasswordHash = hashPassword_(userData.Password, salt);
    }
    updateById_('Users', 'Username', userData.Username, updates);
    return { success: true };
  }

  if (!userData.Password) throw new Error('Password is required for a new user.');
  var newSalt = Utilities.getUuid();
  appendRow_('Users', {
    Username: userData.Username,
    PasswordHash: hashPassword_(userData.Password, newSalt),
    Salt: newSalt,
    Role: userData.Role,
    BranchID: userData.BranchID || '',
    Active: userData.Active === 'N' ? 'N' : 'Y',
    StaffID: userData.StaffID || '',
    Email: userData.Email || '',
    Phone: userData.Phone || '',
    FullName: userData.FullName || ''
  });
  return { success: true };
}

function deleteUser(token, username) {
  var current = requireAuth_(token);
  requireRole_(current, ['Owner']);
  if (username === current.username) throw new Error('You cannot delete your own account.');
  return deleteById_('Users', 'Username', username);
}

function changeOwnPassword(token, oldPassword, newPassword) {
  var current = requireAuth_(token);
  var record = readAll_('Users').find(function (u) { return u.Username === current.username; });
  if (!record) throw new Error('User not found.');
  if (hashPassword_(oldPassword, record.Salt) !== record.PasswordHash) throw new Error('Current password is incorrect.');
  if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters.');
  var salt = Utilities.getUuid();
  updateById_('Users', 'Username', current.username, { Salt: salt, PasswordHash: hashPassword_(newPassword, salt) });
  return { success: true };
}

/* ============================================================================
 * 14. REVIEWS
 * ==========================================================================*/

function getReviews(token) {
  requireAuth_(token);
  var reviews = readAll_('Reviews');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  return reviews.sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); }).map(function (r) {
    var o = stripRow_(r);
    o.StaffName = staffMap[r.StaffID] ? staffMap[r.StaffID].Name : '';
    o.CustomerName = customers[r.CustomerID] ? customers[r.CustomerID].Name : 'Anonymous';
    return o;
  });
}

/* ============================================================================
 * 15. SETTINGS / THEME / BRANDING
 * ==========================================================================*/

function getSettingsMap_() {
  var rows = readAll_('Settings');
  var map = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (k) { map[k] = DEFAULT_SETTINGS[k]; });
  rows.forEach(function (r) { map[r.Key] = r.Value; });
  return map;
}

function getSettings(token) {
  requireAuth_(token);
  var settings = getSettingsMap_();
  if (settings.LogoURL) settings.LogoURL = imageUrlToDataUri_(settings.LogoURL);
  return settings;
}

/**
 * Saving settings used to call findRowIndexById_/updateById_/appendRow_ per
 * key — each one its own getValues()/setValues() round trip — so saving
 * ~30 settings at once meant ~30+ separate Sheets API calls in serial,
 * which was the actual cause of "Save All Settings" feeling slow. This
 * reads the whole (small) Settings sheet once, updates everything in
 * memory, then writes existing rows back in a single setValues() call and
 * appends any brand-new keys in one appendRows-style batch.
 */
function updateSettings(token, settingsObj) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  var sheet = getSheet_('Settings');
  var lastRow = sheet.getLastRow();
  var existing = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];
  var rowIndexByKey = {};
  existing.forEach(function (row, i) { rowIndexByKey[row[0]] = i; });

  var newRows = [];
  Object.keys(settingsObj).forEach(function (key) {
    if (!DEFAULT_SETTINGS.hasOwnProperty(key)) return;
    if (rowIndexByKey.hasOwnProperty(key)) {
      existing[rowIndexByKey[key]][1] = settingsObj[key];
    } else {
      newRows.push([key, settingsObj[key]]);
    }
  });

  if (existing.length) sheet.getRange(2, 1, existing.length, 2).setValues(existing);
  if (newRows.length) sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 2).setValues(newRows);

  var settings = getSettingsMap_();
  if (settings.LogoURL) settings.LogoURL = imageUrlToDataUri_(settings.LogoURL);
  return settings;
}

/* ============================================================================
 * 16. HERO CAROUSEL & IMAGE UPLOADS
 * ==========================================================================*/

function getHeroSlides(token) {
  requireAuth_(token);
  var rows = readAll_('HeroSlides').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); }).map(stripRow_);
  return withImageDataUris_(rows, 'ImageURL');
}

function saveHeroSlide(token, slide) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  slide.SortOrder = Number(slide.SortOrder) || 1;
  slide.Active = slide.Active === 'N' ? 'N' : 'Y';
  if (slide.SlideID) {
    return stripRow_(updateById_('HeroSlides', 'SlideID', slide.SlideID, slide));
  }
  slide.SlideID = nextId_('HeroSlides', 'SlideID');
  return stripRow_(appendRow_('HeroSlides', slide));
}

function deleteHeroSlide(token, slideId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('HeroSlides', 'SlideID', slideId);
}

/**
 * Uploads a base64-encoded image to Google Drive and returns a hotlinkable URL.
 * Used for hero carousel images, staff photos, and the business logo.
 */
function uploadImage(token, base64Data, filename, mimeType) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return uploadImageToDrive_(base64Data, filename, mimeType);
}

/**
 * Public, unauthenticated upload used only for a customer's mobile
 * money/bank payment-proof screenshot at booking time — same low-risk
 * profile as the public booking submission itself (it only ever adds an
 * image to Drive, tied to one specific booking, and is not used for any
 * of the site's own branding/content).
 */
function uploadPaymentProof(base64Data, filename, mimeType) {
  return uploadImageToDrive_(base64Data, filename, mimeType);
}

function uploadImageToDrive_(base64Data, filename, mimeType) {
  if (!base64Data) throw new Error('No image data received.');
  var folder = getOrCreateUploadFolder_();
  var bytes = Utilities.base64Decode(base64Data.split(',').pop());
  var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || ('upload_' + Date.now()));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    // Two Drive hotlink URL tricks were tried before this and both left a
    // cross-browser gap: `uc?export=view` can serve an interstitial "can't
    // scan for viruses" HTML page instead of image bytes, and both
    // `drive.google.com/thumbnail` and `lh3.googleusercontent.com/d/...`
    // are undocumented, reverse-engineered CDN redirects that Chrome
    // tolerates but Safari was reported to fail on entirely. Rather than
    // trying a fourth guess at a Drive URL format, the image is now
    // streamed back through this very web app instead — doGet(e) serves
    // the file's bytes directly when called with ?img=<fileId> (see
    // serveUploadedImage_), so the browser is just fetching same-origin
    // content, with no external host or redirect involved at all. That
    // makes it behave identically in every browser by construction.
    url: getAppUrl_() + '?img=' + file.getId(),
    fileId: file.getId()
  };
}

function getOrCreateUploadFolder_() {
  var it = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

/** Lets the Owner open the one Drive folder every uploaded photo lands in, straight from Branding & Theme settings. */
function getUploadFolderUrl(token) {
  requireAuth_(token);
  return getOrCreateUploadFolder_().getUrl();
}

/* ============================================================================
 * 17. REPORTS & EXPORTS
 * ==========================================================================*/

function getDashboardOverview(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  var appts = readAll_('Appointments');
  if (scoped) appts = appts.filter(function (a) { return a.BranchID === scoped; });
  var todayAppts = appts.filter(function (a) { return a.Date === today; });
  var upcoming = appts.filter(function (a) { return a.Date > today && a.Date <= addDays_(today, 7) && a.Status !== 'Cancelled'; });

  var sales = readAll_('Sales');
  if (scoped) sales = sales.filter(function (s) { return s.BranchID === scoped; });
  var todaySales = sales.filter(function (s) { return String(s.Date).slice(0, 10) === today; });
  var todayRevenue = todaySales.reduce(function (sum, s) { return sum + Number(s.Total); }, 0);

  var products = readAll_('Products');
  if (scoped) products = products.filter(function (p) { return p.BranchID === scoped; });
  var lowStock = products.filter(function (p) { return Number(p.QuantityInStock) <= Number(p.ReorderLevel); });

  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');

  var tomorrow = addDays_(today, 1);
  var weekStart = mondayOf_(today);
  var weekEnd = addDays_(weekStart, 6);
  var nextWeekStart = addDays_(weekStart, 7);
  var nextWeekEnd = addDays_(weekStart, 13);
  var monthPrefix = today.slice(0, 7);
  var notCancelled = appts.filter(function (a) { return a.Status !== 'Cancelled'; });

  return {
    todayAppointments: todayAppts.map(function (a) {
      var o = stripRow_(a);
      o.CustomerName = customers[a.CustomerID] ? customers[a.CustomerID].Name : 'Walk-in';
      o.ServiceName = services[a.ServiceID] ? services[a.ServiceID].Name : '';
      o.StaffName = staffMap[a.StaffID] ? staffMap[a.StaffID].Name : 'Any available';
      return o;
    }),
    // A hairstylist (Staff) works for the owner and doesn't handle the
    // money side of the business — the owner explicitly doesn't want
    // revenue visible to them, so it's withheld here (not just hidden in
    // the UI) rather than trusting the client to hide a number it already has.
    todayRevenue: user.role === 'Staff' ? null : round2_(todayRevenue),
    // Per-sale payment detail for today, so the admin can see (and drill into)
    // exactly who paid via Cash/Mobile Money/Card today — withheld from Staff
    // for the same reason todayRevenue is (Staff don't handle the money side).
    todaySalesDetail: user.role === 'Staff' ? null : todaySales.map(function (s) {
      return {
        SaleID: s.SaleID,
        Time: String(s.Date).slice(11, 16),
        PaymentMethod: s.PaymentMethod,
        CustomerName: s.CustomerID && customers[s.CustomerID] ? customers[s.CustomerID].Name : 'Walk-in',
        Total: round2_(Number(s.Total))
      };
    }).sort(function (a, b) { return a.Time.localeCompare(b.Time); }),
    todaySalesCount: todaySales.length,
    upcomingCount: upcoming.length,
    lowStock: lowStock.map(stripRow_),
    pendingCount: appts.filter(function (a) { return a.Status === 'Pending'; }).length,
    bookingsTomorrow: notCancelled.filter(function (a) { return a.Date === tomorrow; }).length,
    bookingsThisWeek: notCancelled.filter(function (a) { return a.Date >= weekStart && a.Date <= weekEnd; }).length,
    bookingsNextWeek: notCancelled.filter(function (a) { return a.Date >= nextWeekStart && a.Date <= nextWeekEnd; }).length,
    bookingsThisMonth: notCancelled.filter(function (a) { return a.Date.slice(0, 7) === monthPrefix; }).length
  };
}

function mondayOf_(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  var day = d.getDay();
  var diff = (day === 0 ? -6 : 1 - day);
  return addDays_(dateStr, diff);
}

/** Lightweight counts for the admin topbar notification bell — new/pending bookings. */
function getNotificationBell(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var appts = readAll_('Appointments').filter(function (a) { return a.Status === 'Pending'; });
  if (scoped) appts = appts.filter(function (a) { return a.BranchID === scoped; });
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  appts.sort(function (a, b) { return String(b.CreatedAt).localeCompare(String(a.CreatedAt)); });
  return {
    pendingCount: appts.length,
    recent: appts.slice(0, 6).map(function (a) {
      return {
        Reference: a.Reference, AppointmentID: a.AppointmentID, Date: a.Date, TimeSlot: a.TimeSlot,
        CustomerName: customers[a.CustomerID] ? customers[a.CustomerID].Name : 'Walk-in',
        ServiceName: services[a.ServiceID] ? services[a.ServiceID].Name : ''
      };
    })
  };
}

function getReports(token, params) {
  var user = requireAuth_(token);
  params = params || {};
  var scoped = scopeBranch_(user, params.branchId);
  var startDate = params.startDate || Utilities.formatDate(addDaysDate_(new Date(), -30), TIMEZONE, 'yyyy-MM-dd');
  var endDate = params.endDate || Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  var sales = readAll_('Sales').filter(function (s) {
    var d = String(s.Date).slice(0, 10);
    return d >= startDate && d <= endDate && (!scoped || s.BranchID === scoped);
  });
  var expenses = readAll_('Expenses').filter(function (e) {
    return e.Date >= startDate && e.Date <= endDate && (!scoped || e.BranchID === scoped);
  });

  var totalRevenue = round2_(sales.reduce(function (s, r) { return s + Number(r.Total); }, 0));
  var totalExpenses = round2_(expenses.reduce(function (s, r) { return s + Number(r.Amount); }, 0));

  // Revenue by day
  var byDay = {};
  sales.forEach(function (s) {
    var d = String(s.Date).slice(0, 10);
    byDay[d] = (byDay[d] || 0) + Number(s.Total);
  });
  var revenueByDay = Object.keys(byDay).sort().map(function (d) { return { date: d, revenue: round2_(byDay[d]) }; });

  // Best selling services
  var serviceCounts = {};
  sales.forEach(function (s) {
    var items = [];
    try { items = JSON.parse(s.Items || '[]'); } catch (e) {}
    items.forEach(function (it) {
      if (it.type !== 'service') return;
      if (!serviceCounts[it.name]) serviceCounts[it.name] = { name: it.name, qty: 0, revenue: 0 };
      serviceCounts[it.name].qty += it.qty;
      serviceCounts[it.name].revenue += it.lineTotal;
    });
  });
  var bestSellers = Object.values(serviceCounts).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 10);

  // Staff performance (commission based on completed sales attributed to staff)
  var staffAll = keyBy_(readAll_('Staff'), 'StaffID');
  var staffPerf = {};
  sales.forEach(function (s) {
    if (!s.StaffID) return;
    if (!staffPerf[s.StaffID]) {
      var st = staffAll[s.StaffID];
      staffPerf[s.StaffID] = { staffId: s.StaffID, name: st ? st.Name : s.StaffID, salesCount: 0, revenue: 0, commission: 0, rate: st ? Number(st.CommissionRate) : 0 };
    }
    staffPerf[s.StaffID].salesCount += 1;
    staffPerf[s.StaffID].revenue += Number(s.Total);
  });
  Object.keys(staffPerf).forEach(function (id) {
    staffPerf[id].commission = round2_(staffPerf[id].revenue * (staffPerf[id].rate / 100));
    staffPerf[id].revenue = round2_(staffPerf[id].revenue);
  });

  return {
    startDate: startDate,
    endDate: endDate,
    totalRevenue: totalRevenue,
    totalExpenses: totalExpenses,
    netProfit: round2_(totalRevenue - totalExpenses),
    salesCount: sales.length,
    revenueByDay: revenueByDay,
    bestSellers: bestSellers,
    staffPerformance: Object.values(staffPerf).sort(function (a, b) { return b.revenue - a.revenue; }),
    paymentBreakdown: paymentBreakdown_(sales)
  };
}

function paymentBreakdown_(sales) {
  var totals = {}, counts = {};
  sales.forEach(function (s) {
    totals[s.PaymentMethod] = (totals[s.PaymentMethod] || 0) + Number(s.Total);
    counts[s.PaymentMethod] = (counts[s.PaymentMethod] || 0) + 1;
  });
  return Object.keys(totals).map(function (k) { return { method: k, total: round2_(totals[k]), count: counts[k] }; });
}

function exportSalesCsv(token, params) {
  requireAuth_(token);
  var sales = getSales(token, params);
  var headers = ['SaleID', 'Date', 'BranchID', 'CustomerName', 'StaffName', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethod', 'PaymentStatus'];
  var lines = [headers.join(',')];
  sales.forEach(function (s) {
    lines.push(headers.map(function (h) { return csvEscape_(s[h]); }).join(','));
  });
  return lines.join('\n');
}

function exportExpensesCsv(token, filters) {
  requireAuth_(token);
  var expenses = getExpenses(token, filters);
  var headers = ['ExpenseID', 'Date', 'BranchID', 'Category', 'Amount', 'Description'];
  var lines = [headers.join(',')];
  expenses.forEach(function (e) {
    lines.push(headers.map(function (h) { return csvEscape_(e[h]); }).join(','));
  });
  return lines.join('\n');
}

function csvEscape_(val) {
  var s = String(val === undefined || val === null ? '' : val);
  if (s.indexOf(',') > -1 || s.indexOf('"') > -1 || s.indexOf('\n') > -1) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Renders a simple HTML report to a PDF and returns it base64-encoded so the
 * client can trigger a download (used for the "Export to PDF" report button).
 */
function exportReportPdf(token, params) {
  requireAuth_(token);
  var report = getReports(token, params);
  var settings = getSettingsMap_();
  var html = '<html><body style="font-family:Arial,sans-serif;padding:20px;">' +
    '<h2>' + settings.BusinessName + ' — Report</h2>' +
    '<p>' + report.startDate + ' to ' + report.endDate + '</p>' +
    '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">' +
    '<tr><td><b>Total Revenue</b></td><td>' + CURRENCY_SYMBOL + report.totalRevenue.toFixed(2) + '</td></tr>' +
    '<tr><td><b>Total Expenses</b></td><td>' + CURRENCY_SYMBOL + report.totalExpenses.toFixed(2) + '</td></tr>' +
    '<tr><td><b>Net Profit</b></td><td>' + CURRENCY_SYMBOL + report.netProfit.toFixed(2) + '</td></tr>' +
    '<tr><td><b>Number of Sales</b></td><td>' + report.salesCount + '</td></tr>' +
    '</table><h3>Best Selling Services</h3><table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;">' +
    '<tr><th>Service</th><th>Qty Sold</th><th>Revenue</th></tr>' +
    report.bestSellers.map(function (b) { return '<tr><td>' + b.name + '</td><td>' + b.qty + '</td><td>' + CURRENCY_SYMBOL + b.revenue.toFixed(2) + '</td></tr>'; }).join('') +
    '</table></body></html>';

  var blob = Utilities.newBlob(html, 'text/html', 'report.html').getAs('application/pdf');
  return {
    filename: 'report_' + report.startDate + '_to_' + report.endDate + '.pdf',
    base64: Utilities.base64Encode(blob.getBytes())
  };
}

/* ============================================================================
 * 18. NOTIFICATIONS (SMS + EMAIL)
 * ==========================================================================*/

function logNotification_(type, recipient, message, status) {
  appendRow_('Notifications', {
    NotificationID: nextId_('Notifications', 'NotificationID'),
    Type: type, Recipient: recipient, Message: message, Status: status, Date: nowIso_()
  });
}

/**
 * SMS module: sent/failed/simulated counts, recent history, and — for
 * Arkesel accounts with an API key configured — the live account balance.
 */
function getSmsStats(token) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var rows = readAll_('Notifications').filter(function (n) { return n.Type === 'SMS'; });
  rows.sort(function (a, b) { return String(b.Date).localeCompare(String(a.Date)); });

  var sent = 0, failed = 0, simulated = 0;
  rows.forEach(function (n) {
    var status = String(n.Status || '');
    if (status.indexOf('Failed') === 0) failed++;
    else if (status.indexOf('Simulated') === 0) simulated++;
    else sent++;
  });

  return {
    total: rows.length, sent: sent, failed: failed, simulated: simulated,
    history: rows.slice(0, 100).map(stripRow_),
    balance: getSmsBalance_()
  };
}

function getSmsBalance_() {
  var settings = getSettingsMap_();
  if (settings.SmsProvider === 'arkesel' && settings.SmsApiKey) {
    try {
      var res = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/clients/balance-details', {
        headers: { 'api-key': settings.SmsApiKey }, muteHttpExceptions: true
      });
      var data = JSON.parse(res.getContentText());
      if (data && data.data) return { provider: 'Arkesel', balance: data.data.sms_balance, currency: 'credits', available: true };
      return { provider: 'Arkesel', available: false, message: 'Could not read balance from Arkesel.' };
    } catch (e) {
      return { provider: 'Arkesel', available: false, message: e.message };
    }
  }
  return { provider: settings.SmsProvider || 'simulate', available: false, message: 'Balance lookup is only supported for Arkesel right now.' };
}

/** Owner/Manager broadcast — send an SMS to one or more staff members' phones. */
function sendStaffSms(token, staffIds, message) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  message = String(message || '').trim();
  if (!message) throw new Error('Please enter a message.');
  if (!staffIds || !staffIds.length) throw new Error('Please select at least one staff member.');

  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var sentCount = 0;
  staffIds.forEach(function (id) {
    var s = staffMap[id];
    if (s && s.Phone) { sendSms_(s.Phone, message); sentCount++; }
  });
  return { sentCount: sentCount };
}

/* ---------- "My Bookings" — public self-service lookup ---------- */

/** Public: a customer looks up their own bookings by the phone number they booked with. */
function lookupMyBookings(phone) {
  var normalized = normalizeGhanaPhone_(phone);
  if (!normalized) throw new Error('Please enter a valid Ghana phone number, e.g. 024XXXXXXX or +233XXXXXXXXX.');
  var customer = readAll_('Customers').find(function (c) { return normalizeGhanaPhone_(c.Phone) === normalized; });
  if (!customer) return [];

  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var branches = keyBy_(readAll_('Branches'), 'BranchID');
  var appts = readAll_('Appointments').filter(function (a) { return a.CustomerID === customer.CustomerID; });
  appts.sort(function (a, b) { return (b.Date + b.TimeSlot).localeCompare(a.Date + a.TimeSlot); });

  return appts.map(function (a) { return bookingSummary_(a, services, staffMap, branches); });
}

/** Public: look up a single booking by its reference code (e.g. BOOK-260818-0002) — no phone needed. */
function lookupBookingByReference(reference) {
  reference = String(reference || '').trim().toUpperCase();
  if (!reference) throw new Error('Please enter a booking reference.');
  var appt = readAll_('Appointments').find(function (a) { return String(a.Reference).toUpperCase() === reference; });
  if (!appt) return null;
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  var branches = keyBy_(readAll_('Branches'), 'BranchID');
  return bookingSummary_(appt, services, staffMap, branches);
}

function bookingSummary_(a, services, staffMap, branches) {
  return {
    AppointmentID: a.AppointmentID, Reference: a.Reference, Date: a.Date, TimeSlot: a.TimeSlot, Status: a.Status,
    ServiceName: services[a.ServiceID] ? services[a.ServiceID].Name : '',
    ServicePrice: services[a.ServiceID] ? services[a.ServiceID].Price : 0,
    StaffName: staffMap[a.StaffID] ? staffMap[a.StaffID].Name : 'Any available',
    BranchName: branches[a.BranchID] ? branches[a.BranchID].Name : ''
  };
}

/** Public: lets a customer cancel their own upcoming booking, verified by matching phone number. */
function cancelMyAppointment(phone, appointmentId) {
  var normalized = normalizeGhanaPhone_(phone);
  if (!normalized) throw new Error('Please enter a valid Ghana phone number.');
  var customer = readAll_('Customers').find(function (c) { return normalizeGhanaPhone_(c.Phone) === normalized; });
  if (!customer) throw new Error('No bookings found for that phone number.');

  var appt = readAll_('Appointments').find(function (a) { return a.AppointmentID === appointmentId; });
  if (!appt || appt.CustomerID !== customer.CustomerID) throw new Error('That booking was not found for this phone number.');
  if (appt.Status === 'Completed' || appt.Status === 'Cancelled') throw new Error('This booking can no longer be cancelled.');

  var updated = updateById_('Appointments', 'AppointmentID', appointmentId, { Status: 'Cancelled' });
  sendAppointmentStatusUpdate_(updated, customer, 'cancelled at your request');
  return { success: true };
}

/** Public: cancel a booking using only its reference code (no phone number needed). */
function cancelBookingByReference(reference) {
  reference = String(reference || '').trim().toUpperCase();
  var appt = readAll_('Appointments').find(function (a) { return String(a.Reference).toUpperCase() === reference; });
  if (!appt) throw new Error('Booking reference not found.');
  if (appt.Status === 'Completed' || appt.Status === 'Cancelled') throw new Error('This booking can no longer be cancelled.');

  var customer = readAll_('Customers').find(function (c) { return c.CustomerID === appt.CustomerID; });
  var updated = updateById_('Appointments', 'AppointmentID', appt.AppointmentID, { Status: 'Cancelled' });
  if (customer) sendAppointmentStatusUpdate_(updated, customer, 'cancelled at your request');
  return { success: true };
}

/**
 * Public: records one website visit, at most once per (day, visitorKey)
 * pair — the client generates and persists visitorKey itself (a random
 * id in localStorage) and only calls this once per calendar day, but the
 * server-side dedupe here is what actually keeps a "Visitors Today" count
 * honest even if the client calls it more than once.
 */
function trackVisit(visitorKey) {
  visitorKey = String(visitorKey || '').trim();
  if (!visitorKey) return { success: false };
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var already = readAll_('Visits').some(function (v) { return v.Date === today && v.VisitorKey === visitorKey; });
  if (!already) {
    appendRow_('Visits', { VisitID: nextId_('Visits', 'VisitID'), Date: today, Timestamp: nowIso_(), VisitorKey: visitorKey });
  }
  return { success: true };
}

/** Admin: visitor counts for today and the last 7 days (unique VisitorKey per day). */
function getVisitorStats(token) {
  requireAuth_(token);
  var rows = readAll_('Visits');
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var byDay = {};
  rows.forEach(function (v) {
    if (!byDay[v.Date]) byDay[v.Date] = {};
    byDay[v.Date][v.VisitorKey] = true;
  });
  var trend = [];
  for (var i = 6; i >= 0; i--) {
    var d = addDays_(today, -i);
    trend.push({ date: d, visitors: byDay[d] ? Object.keys(byDay[d]).length : 0 });
  }
  return {
    today: byDay[today] ? Object.keys(byDay[today]).length : 0,
    last7Days: trend.reduce(function (sum, t) { return sum + t.visitors; }, 0),
    trend: trend,
    allTimeUnique: Object.keys(rows.reduce(function (acc, v) { acc[v.VisitorKey] = true; return acc; }, {})).length
  };
}

/** Public: a website visitor's "Contact Us" message, emailed straight to the business's ContactEmail. */
function sendContactMessage(data) {
  data = data || {};
  var name = String(data.name || '').trim();
  var email = String(data.email || '').trim();
  var phone = String(data.phone || '').trim();
  var message = String(data.message || '').trim();
  if (!name) throw new Error('Please enter your name.');
  if (!message) throw new Error('Please enter a message.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (!email && !phone) throw new Error('Please leave an email or phone number so we can reply to you.');

  var settings = getSettingsMap_();
  var to = settings.ContactEmail;
  if (!to) throw new Error('This site has not set up a contact email yet — please call or WhatsApp us instead.');

  var bodyHtml = '<p><b>From:</b> ' + esc_(name) + '</p>' +
    (phone ? '<p><b>Phone:</b> ' + esc_(phone) + '</p>' : '') +
    (email ? '<p><b>Email:</b> ' + esc_(email) + '</p>' : '') +
    '<p style="white-space:pre-wrap;background:#f7f5f2;padding:14px;border-radius:8px;margin-top:10px;">' + esc_(message) + '</p>';
  var html = buildEmailHtml_('New Website Message', bodyHtml);
  var plain = 'New message from ' + name + (phone ? ' (' + phone + ')' : '') + (email ? ' <' + email + '>' : '') + ':\n\n' + message;
  sendEmail_(to, 'New website message from ' + name, plain, html);
  return { success: true };
}

/**
 * Sends an email. `plainBody` is always required (used as the fallback for
 * clients that don't render HTML); `htmlBody`, when provided, is the
 * branded HTML version built with buildEmailHtml_() and is what most
 * customers will actually see.
 */
function sendEmail_(email, subject, plainBody, htmlBody) {
  if (!email) return;
  try {
    var settings = getSettingsMap_();
    var options = { name: settings.BusinessName };
    if (htmlBody) options.htmlBody = htmlBody;
    MailApp.sendEmail(email, subject, plainBody, options);
    logNotification_('Email', email, subject, 'Sent');
  } catch (err) {
    logNotification_('Email', email, subject, 'Failed: ' + err.message);
  }
}

function esc_(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function getWebAppUrl_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

function formatNiceDateServer_(dateStr) {
  if (!dateStr) return '';
  try { return Utilities.formatDate(new Date(dateStr + 'T00:00:00'), TIMEZONE, 'EEEE, MMMM d, yyyy'); }
  catch (e) { return dateStr; }
}

/** A clean [label, value] details table used inside branded emails. */
function emailDetailTable_(rows) {
  return '<table style="width:100%;border-collapse:collapse;margin:14px 0;">' +
    rows.map(function (r) {
      return '<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#888;font-size:13px;">' + esc_(r[0]) + '</td>' +
        '<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;font-size:13px;">' + esc_(r[1]) + '</td></tr>';
    }).join('') + '</table>';
}

/**
 * Wraps a message in a branded HTML email shell — business logo, name, and
 * tagline in a header banner colored with the salon's own theme, the message
 * body, an optional call-to-action button, and a footer with contact info —
 * so notification emails read as a professional, legitimate business email
 * rather than plain text.
 */
function buildEmailHtml_(headline, bodyHtml, ctaText, ctaLink) {
  var s = getSettingsMap_();
  var primary = s.PrimaryColor || '#1a1a1a';
  var accent = s.AccentColor || '#c9a227';
  // Embedded as the actual image bytes (a data: URI), not linked to this
  // app's own URL — a remote-hosted <img src> in an email depends on the
  // recipient's mail client choosing to fetch it, which most (Gmail,
  // Outlook, etc.) don't do automatically for images from an unfamiliar
  // sender; the customer would only ever see the logo after manually
  // clicking "Display images below". An inline data: URI has no fetch to
  // block — the bytes are already part of the email. Skipped (not
  // embedded, not linked) if it comes out unusually large, since Gmail
  // clips a whole message over ~102KB and the email's actual content
  // matters more than its logo.
  var logoDataUri = s.LogoURL ? imageUrlToDataUri_(s.LogoURL) : '';
  var logoImg = (logoDataUri && logoDataUri.length < 60000)
    ? '<img src="' + logoDataUri + '" alt="' + esc_(s.BusinessName) + '" style="height:46px;border-radius:8px;margin-bottom:12px;display:inline-block;">' : '';
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f3f1;padding:24px 12px;">' +
    '<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">' +
    '<div style="background:' + primary + ';padding:28px 30px;text-align:center;color:#ffffff;">' + logoImg +
    '<div style="font-size:20px;font-weight:800;">' + esc_(s.BusinessName) + '</div>' +
    (s.Tagline ? '<div style="opacity:.75;font-size:12px;margin-top:4px;">' + esc_(s.Tagline) + '</div>' : '') +
    '</div>' +
    '<div style="padding:30px;color:#1a1a1a;">' +
    '<h2 style="margin:0 0 14px;color:' + primary + ';font-size:19px;">' + esc_(headline) + '</h2>' +
    bodyHtml +
    (ctaText && ctaLink ? '<div style="text-align:center;margin-top:26px;"><a href="' + esc_(ctaLink) + '" style="background:' + accent + ';color:#1a1a1a;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">' + esc_(ctaText) + '</a></div>' : '') +
    '</div>' +
    '<div style="background:#f7f5f2;padding:18px 30px;text-align:center;font-size:12px;color:#888;">' +
    esc_(s.ContactPhone || '') + (s.WhatsAppNumber ? ' &middot; WhatsApp: ' + esc_(s.WhatsAppNumber) : '') + '<br>' +
    '&copy; ' + new Date().getFullYear() + ' ' + esc_(s.BusinessName) +
    '</div></div></div>';
}

/**
 * Sends an SMS via the configured gateway (Arkesel or Hubtel — popular in
 * Ghana), or logs a simulated send if no provider is configured yet.
 */
function sendSms_(phone, message) {
  if (!phone) return;
  var settings = getSettingsMap_();
  var provider = settings.SmsProvider || 'simulate';
  try {
    if (provider === 'arkesel' && settings.SmsApiKey) {
      var res = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'api-key': settings.SmsApiKey },
        payload: JSON.stringify({ sender: settings.SmsSenderId || 'SALON', message: message, recipients: [phone] }),
        muteHttpExceptions: true
      });
      logNotification_('SMS', phone, message, 'Sent (Arkesel ' + res.getResponseCode() + ')');
    } else if (provider === 'hubtel' && settings.HubtelClientId) {
      var url = 'https://smsc.hubtel.com/v1/messages/send'
        + '?clientid=' + encodeURIComponent(settings.HubtelClientId)
        + '&clientsecret=' + encodeURIComponent(settings.HubtelClientSecret)
        + '&from=' + encodeURIComponent(settings.SmsSenderId || 'SALON')
        + '&to=' + encodeURIComponent(phone)
        + '&content=' + encodeURIComponent(message);
      var res2 = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      logNotification_('SMS', phone, message, 'Sent (Hubtel ' + res2.getResponseCode() + ')');
    } else {
      // No gateway configured yet — log as simulated so the flow still completes.
      logNotification_('SMS', phone, message, 'Simulated (no SMS provider configured in Settings)');
    }
  } catch (err) {
    logNotification_('SMS', phone, message, 'Failed: ' + err.message);
  }
}

function sendAppointmentConfirmation_(appt, customer, service, branch) {
  var settings = getSettingsMap_();
  var msg = 'Hi ' + customer.Name + ', your booking (' + appt.Reference + ') for ' + service.Name +
    ' at ' + branch.Name + ' on ' + appt.Date + ' ' + appt.TimeSlot + ' is received and PENDING confirmation. ' +
    '- ' + settings.BusinessName;
  // Booking notifications are the one message type the Owner can switch off
  // per-channel (Settings → Notifications) — every other automatic message
  // (status updates, receipts, reminders) still always sends.
  if (settings.NotifyBookingSms !== 'N') sendSms_(customer.Phone, msg);
  if (settings.NotifyBookingEmail !== 'N' && customer.Email) {
    var bodyHtml = '<p>Hi ' + esc_(customer.Name) + ',</p>' +
      '<p>Thank you for booking with us! Your appointment request has been received and is <b>pending confirmation</b>. Here are the details:</p>' +
      emailDetailTable_([
        ['Reference', appt.Reference], ['Service', service.Name], ['Branch', branch.Name],
        ['Date', formatNiceDateServer_(appt.Date)], ['Time', appt.TimeSlot]
      ]) +
      '<p>We\'ll confirm your appointment shortly by SMS/Email. Need to make changes? Just reply to this email or give us a call.</p>';
    sendEmail_(customer.Email, 'Booking Received — ' + appt.Reference,
      msg + '\n\nWe will confirm your appointment shortly. Thank you for choosing ' + settings.BusinessName + '.',
      buildEmailHtml_('Booking Received!', bodyHtml, 'Visit Our Website', getWebAppUrl_()));
  }
}

function sendAppointmentStatusUpdate_(appt, customer, statusText) {
  var settings = getSettingsMap_();
  var msg = 'Hi ' + customer.Name + ', your appointment (' + appt.Reference + ') has been ' + statusText + '. - ' + settings.BusinessName;
  sendSms_(customer.Phone, msg);
  if (customer.Email) {
    var bodyHtml = '<p>Hi ' + esc_(customer.Name) + ',</p><p>Your appointment <b>' + esc_(appt.Reference) + '</b> has been <b>' + esc_(statusText) + '</b>.</p>';
    sendEmail_(customer.Email, 'Appointment Update — ' + appt.Reference, msg, buildEmailHtml_('Appointment Update', bodyHtml));
  }
}

function sendCompletionThankYou_(appt, customer, service, pointsEarned) {
  var settings = getSettingsMap_();
  var msg = 'Thank you for visiting ' + settings.BusinessName + ', ' + customer.Name + '! Your ' + service.Name +
    ' is complete. You earned ' + pointsEarned + ' loyalty points (total: ' + customer.LoyaltyPoints + '). See you again soon!';
  sendSms_(customer.Phone, msg);
  if (customer.Email) {
    var bodyHtml = '<p>Hi ' + esc_(customer.Name) + ',</p><p>Thank you for visiting us! Your <b>' + esc_(service.Name) + '</b> service is complete.</p>' +
      emailDetailTable_([['Loyalty Points Earned', '+' + pointsEarned], ['Total Points Balance', customer.LoyaltyPoints]]) +
      '<p>We hope to see you again soon!</p>';
    sendEmail_(customer.Email, 'Thank You For Visiting ' + settings.BusinessName, msg,
      buildEmailHtml_('Thank You!', bodyHtml, 'Book Your Next Visit', getWebAppUrl_()));
  }
}

function sendSaleReceipt_(sale, customer, lineItems, pointsEarned) {
  var settings = getSettingsMap_();
  var itemLines = lineItems.map(function (li) { return li.name + ' x' + li.qty + ' — ' + CURRENCY_SYMBOL + li.lineTotal.toFixed(2); }).join('\n');
  var msg = 'Receipt ' + sale.SaleID + ' — Total ' + CURRENCY_SYMBOL + Number(sale.Total).toFixed(2) +
    ' paid via ' + sale.PaymentMethod + '. You earned ' + pointsEarned + ' loyalty points. Thank you for visiting ' + settings.BusinessName + '!';
  sendSms_(customer.Phone, msg);
  if (customer.Email) {
    var itemsHtml = '<table style="width:100%;border-collapse:collapse;margin:14px 0;">' +
      lineItems.map(function (li) {
        return '<tr><td style="padding:6px 0;border-bottom:1px solid #eee;font-size:13px;">' + esc_(li.name) + ' x' + li.qty + '</td>' +
          '<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;">' + CURRENCY_SYMBOL + li.lineTotal.toFixed(2) + '</td></tr>';
      }).join('') + '</table>';
    var bodyHtml = '<p>Hi ' + esc_(customer.Name) + ',</p><p>Thank you for your purchase! Here is your receipt:</p>' + itemsHtml +
      emailDetailTable_([
        ['Subtotal', CURRENCY_SYMBOL + Number(sale.Subtotal).toFixed(2)],
        ['Discount', '-' + CURRENCY_SYMBOL + Number(sale.Discount).toFixed(2)],
        ['Tax', CURRENCY_SYMBOL + Number(sale.Tax).toFixed(2)],
        ['Total', CURRENCY_SYMBOL + Number(sale.Total).toFixed(2)],
        ['Payment Method', sale.PaymentMethod],
        ['Loyalty Points Earned', '+' + pointsEarned]
      ]);
    sendEmail_(customer.Email, 'Your Receipt — ' + sale.SaleID,
      'Thank you for visiting ' + settings.BusinessName + '!\n\n' + itemLines +
      '\n\nSubtotal: ' + CURRENCY_SYMBOL + Number(sale.Subtotal).toFixed(2) +
      '\nDiscount: ' + CURRENCY_SYMBOL + Number(sale.Discount).toFixed(2) +
      '\nTax: ' + CURRENCY_SYMBOL + Number(sale.Tax).toFixed(2) +
      '\nTotal: ' + CURRENCY_SYMBOL + Number(sale.Total).toFixed(2) +
      '\nPayment Method: ' + sale.PaymentMethod +
      '\n\nLoyalty points earned: ' + pointsEarned +
      '\n\nSee you again soon!',
      buildEmailHtml_('Payment Receipt', bodyHtml));
  }
}

/**
 * Sends birthday/anniversary or generic reminder SMS/emails. Can be wired to
 * a time-based trigger (Apps Script > Triggers > Time-driven) to run daily.
 */
function sendUpcomingAppointmentReminders() {
  var settings = getSettingsMap_();
  var tomorrow = Utilities.formatDate(addDaysDate_(new Date(), 1), TIMEZONE, 'yyyy-MM-dd');
  var appts = readAll_('Appointments').filter(function (a) { return a.Date === tomorrow && (a.Status === 'Confirmed' || a.Status === 'Pending'); });
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  appts.forEach(function (a) {
    var c = customers[a.CustomerID];
    var s = services[a.ServiceID];
    if (!c) return;
    var msg = 'Reminder: Hi ' + c.Name + ', you have a ' + (s ? s.Name : 'appointment') + ' booked tomorrow (' + a.Date + ' ' + a.TimeSlot + ') at ' + settings.BusinessName + '. See you then!';
    sendSms_(c.Phone, msg);
    if (c.Email) {
      var bodyHtml = '<p>Hi ' + esc_(c.Name) + ',</p><p>This is a friendly reminder that you have a <b>' + esc_(s ? s.Name : 'appointment') + '</b> booked for tomorrow.</p>' +
        emailDetailTable_([['Date', formatNiceDateServer_(a.Date)], ['Time', a.TimeSlot]]);
      sendEmail_(c.Email, 'Appointment Reminder — Tomorrow', msg, buildEmailHtml_('See You Tomorrow!', bodyHtml));
    }
  });
  return appts.length + ' reminder(s) sent.';
}

/* ============================================================================
 * 19. TRASH / RECOVERY (Customers + Appointments)
 *
 * "Clear" is a soft delete: the record's full row is copied into the Trash
 * sheet as JSON, then removed from its own sheet. Nothing here permanently
 * destroys data — a cleared record just moves out of the main list and into
 * Trash, where it can be restored (back to its own sheet, same ID) or, if
 * the Owner/Manager is sure, permanently deleted from there. Only Customers
 * and Appointments go through this path (TRASH_RECORD_TYPES); every other
 * record type keeps its existing plain Delete button, unchanged.
 * ==========================================================================*/

/**
 * Moves one record out of `sheetName` and into Trash. `preloadedRecord`
 * lets a bulk caller that already has the full row (from its own single
 * readAll_() pass) skip re-reading the sheet for every single record.
 */
function moveToTrash_(sheetName, idField, id, deletedBy, preloadedRecord) {
  var record = preloadedRecord || readAll_(sheetName).find(function (r) { return r[idField] === id; });
  if (!record) return false;
  appendRow_('Trash', {
    TrashID: nextId_('Trash', 'TrashID'),
    RecordType: sheetName,
    RecordID: id,
    Data: JSON.stringify(stripRow_(record)),
    DeletedAt: nowIso_(),
    DeletedBy: deletedBy || ''
  });
  deleteById_(sheetName, idField, id);
  return true;
}

function clearCustomers(token, customerIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var ids = Array.isArray(customerIds) ? customerIds : [customerIds];
  var idSet = {}; ids.forEach(function (id) { idSet[id] = true; });
  var rows = readAll_('Customers').filter(function (r) { return idSet[r.CustomerID]; });
  var deletedBy = user.fullName || user.username || user.role;
  var n = 0;
  rows.forEach(function (r) { if (moveToTrash_('Customers', 'CustomerID', r.CustomerID, deletedBy, r)) n++; });
  return { cleared: n };
}

function clearAppointments(token, appointmentIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  var ids = Array.isArray(appointmentIds) ? appointmentIds : [appointmentIds];
  var idSet = {}; ids.forEach(function (id) { idSet[id] = true; });
  var rows = readAll_('Appointments').filter(function (r) { return idSet[r.AppointmentID]; });
  var deletedBy = user.fullName || user.username || user.role;
  var n = 0;
  rows.forEach(function (r) { if (moveToTrash_('Appointments', 'AppointmentID', r.AppointmentID, deletedBy, r)) n++; });
  return { cleared: n };
}

/**
 * The actual "clear finished appointments" sweep — shared by the manual
 * "Clear Old Appointments Now" button and the daily auto-clear trigger.
 * Clears anything already Completed/Cancelled/No-show (regardless of
 * date), plus any Pending/Confirmed appointment whose date has already
 * passed. Today's and every future still-pending/confirmed booking is
 * never touched, so nothing is ever wiped out from under a customer.
 */
function clearFinishedAppointments_() {
  var today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  var finishedStatuses = { Completed: true, Cancelled: true, 'No-show': true };
  var rows = readAll_('Appointments');
  var toClear = rows.filter(function (a) { return finishedStatuses[a.Status] || a.Date < today; });
  toClear.forEach(function (a) { moveToTrash_('Appointments', 'AppointmentID', a.AppointmentID, 'Auto-clear', a); });
  return toClear.length;
}

/**
 * Wire this up as a daily time-driven trigger in the Apps Script editor
 * (Triggers → Add Trigger → this function → Time-driven → Day timer),
 * exactly like sendUpcomingAppointmentReminders — see the README. It only
 * actually clears anything once the Owner has switched "Auto-clear
 * finished appointments daily" on (Appointments page or Settings), so the
 * trigger is safe to leave installed even while the setting is off.
 */
function autoClearOldAppointments_() {
  var settings = getSettingsMap_();
  if (settings.AutoClearAppointmentsDaily !== 'Y') return 0;
  return clearFinishedAppointments_();
}

/** The Appointments page's "Clear Old Appointments Now" button — runs the same sweep on demand, regardless of the daily-auto-clear setting. */
function clearOldAppointmentsNow(token) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager', 'Receptionist']);
  return { cleared: clearFinishedAppointments_() };
}

/** The Trash list itself, optionally filtered to one RecordType, newest-cleared first — each row's stored Data is parsed and, where possible, enriched with the same friendly names (customer/service/staff) the live admin tables show. */
function getTrash(token, recordType) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var rows = readAll_('Trash');
  if (recordType) rows = rows.filter(function (t) { return t.RecordType === recordType; });
  rows.sort(function (a, b) { return String(b.DeletedAt).localeCompare(String(a.DeletedAt)); });
  var customers = keyBy_(readAll_('Customers'), 'CustomerID');
  var services = keyBy_(readAll_('Services'), 'ServiceID');
  var staffMap = keyBy_(readAll_('Staff'), 'StaffID');
  return rows.map(function (t) {
    var o = stripRow_(t);
    var rec = {};
    try { rec = JSON.parse(o.Data || '{}'); } catch (e) {}
    delete o.Data; // already parsed into Summary/rec below — no need to send the raw JSON string too
    if (o.RecordType === 'Customers') {
      o.Summary = { Name: rec.Name, Phone: rec.Phone, Email: rec.Email, LoyaltyPoints: rec.LoyaltyPoints };
    } else if (o.RecordType === 'Appointments') {
      o.Summary = {
        Reference: rec.Reference,
        CustomerName: customers[rec.CustomerID] ? customers[rec.CustomerID].Name : (rec.CustomerID ? 'Cleared customer' : 'Walk-in'),
        ServiceName: services[rec.ServiceID] ? services[rec.ServiceID].Name : '',
        StaffName: staffMap[rec.StaffID] ? staffMap[rec.StaffID].Name : 'Any available',
        Date: rec.Date, TimeSlot: rec.TimeSlot, Status: rec.Status
      };
    }
    return o;
  });
}

function restoreTrashItems(token, trashIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var ids = Array.isArray(trashIds) ? trashIds : [trashIds];
  var trashRows = readAll_('Trash');
  var n = 0;
  ids.forEach(function (trashId) {
    var t = trashRows.find(function (r) { return r.TrashID === trashId; });
    if (!t) return;
    var rec;
    try { rec = JSON.parse(t.Data || '{}'); } catch (e) { rec = null; }
    if (!rec) return;
    appendRow_(t.RecordType, rec);
    deleteById_('Trash', 'TrashID', trashId);
    n++;
  });
  return { restored: n };
}

function permanentlyDeleteTrash(token, trashIds) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var ids = Array.isArray(trashIds) ? trashIds : [trashIds];
  var n = 0;
  ids.forEach(function (trashId) {
    try { deleteById_('Trash', 'TrashID', trashId); n++; } catch (e) { /* already gone — ignore */ }
  });
  return { deleted: n };
}

/** "Empty Trash" — permanently deletes every trashed record, or just one RecordType's if given. */
function emptyTrash(token, recordType) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  var rows = readAll_('Trash');
  if (recordType) rows = rows.filter(function (t) { return t.RecordType === recordType; });
  var n = 0;
  rows.forEach(function (t) { try { deleteById_('Trash', 'TrashID', t.TrashID); n++; } catch (e) { /* already gone — ignore */ } });
  return { deleted: n };
}

/* ============================================================================
 * 20. UTILITIES
 * ==========================================================================*/

function nowIso_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}

function round2_(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function addDays_(dateStr, days) {
  var d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd');
}

function addDaysDate_(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function keyBy_(rows, field) {
  var map = {};
  rows.forEach(function (r) { map[r[field]] = r; });
  return map;
}

/**
 * Validates and normalizes a Ghana phone number to the 0XXXXXXXXX format.
 * Accepts 0XXXXXXXXX (10 digits) or +233XXXXXXXXX / 233XXXXXXXXX.
 * Returns the normalized number, or null if invalid.
 */
function normalizeGhanaPhone_(phone) {
  if (!phone) return null;
  var digits = String(phone).replace(/[\s\-()]/g, '');
  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^\+233\d{9}$/.test(digits)) return '0' + digits.slice(4);
  if (/^233\d{9}$/.test(digits)) return '0' + digits.slice(3);
  return null;
}

function formatCurrency_(amount) {
  return CURRENCY_SYMBOL + Number(amount || 0).toFixed(2);
}
