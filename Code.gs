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
 *   19. Utilities (currency, phone, dates, ids)
 * ============================================================================
 */

/* ============================================================================
 * 1. CONFIGURATION & SCHEMA
 * ==========================================================================*/

var TIMEZONE = 'Africa/Accra';
var CURRENCY_SYMBOL = 'GH₵';
var SESSION_TTL_SECONDS = 6 * 60 * 60; // 6 hours
var UPLOAD_FOLDER_NAME = 'SalonSystem_Uploads';

// Column schema for every tab. Order matters — it defines the sheet column order.
var SCHEMA = {
  Branches:      ['BranchID', 'Name', 'Location', 'Phone', 'OpeningHours'],
  Services:      ['ServiceID', 'Name', 'Category', 'Description', 'DurationMinutes', 'Price', 'BranchID', 'Active'],
  Staff:         ['StaffID', 'Name', 'Role', 'BranchID', 'Phone', 'Specialties', 'PhotoURL', 'Active', 'CommissionRate', 'WorkDays'],
  Customers:     ['CustomerID', 'Name', 'Phone', 'Email', 'DateJoined', 'LoyaltyPoints', 'Notes'],
  Appointments:  ['AppointmentID', 'Reference', 'CustomerID', 'StaffID', 'ServiceID', 'BranchID', 'Date', 'TimeSlot', 'Status', 'CreatedAt', 'Notes'],
  Sales:         ['SaleID', 'Date', 'BranchID', 'CustomerID', 'StaffID', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'PaymentMethod', 'PaymentStatus'],
  Products:      ['ProductID', 'Name', 'Category', 'CostPrice', 'SellingPrice', 'QuantityInStock', 'ReorderLevel', 'BranchID'],
  Expenses:      ['ExpenseID', 'Date', 'BranchID', 'Category', 'Amount', 'Description'],
  Users:         ['Username', 'PasswordHash', 'Salt', 'Role', 'BranchID', 'Active', 'StaffID', 'Email', 'Phone'],
  Reviews:       ['ReviewID', 'CustomerID', 'StaffID', 'Rating', 'Comment', 'Date'],
  Settings:      ['Key', 'Value'],
  HeroSlides:    ['SlideID', 'ImageURL', 'Title', 'Subtitle', 'ButtonText', 'ButtonLink', 'SortOrder', 'Active'],
  Gallery:       ['GalleryID', 'ImageURL', 'Caption', 'Category', 'BranchID', 'SortOrder', 'Active'],
  Notifications: ['NotificationID', 'Type', 'Recipient', 'Message', 'Status', 'Date']
};

var ID_PREFIX = {
  Branches: 'BR', Services: 'SV', Staff: 'ST', Customers: 'CU', Appointments: 'AP',
  Sales: 'SL', Products: 'PR', Expenses: 'EX', Reviews: 'RV', HeroSlides: 'HS', Gallery: 'GL', Notifications: 'NT'
};

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
  BookingStartHour: '9',
  BookingEndHour: '18',
  SlotIntervalMinutes: '30'
};

/* ============================================================================
 * 2. WEB APP ENTRY POINT
 * ==========================================================================*/

function doGet(e) {
  ensureSetup_();
  var page = (e && e.parameter && e.parameter.page) || 'app';
  var tpl = HtmlService.createTemplateFromFile('index');
  tpl.initialPage = page;
  return tpl.evaluate()
    .setTitle('Salon & Barber Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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
  });

  // Remove the default "Sheet1" if it is empty and unused
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(def);
  }

  seedIfEmpty_();
  return 'Setup complete';
}

function ensureSetup_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SETUP_DONE') === 'true') return;
  setupSheets();
  props.setProperty('SETUP_DONE', 'true');
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
    appendRow_('Branches', { BranchID: 'BR-0001', Name: 'Osu Main Branch', Location: 'Oxford Street, Osu, Accra', Phone: '0241234567', OpeningHours: 'Mon-Sat 8:00am-7:00pm, Sun 12pm-5pm' });
    appendRow_('Branches', { BranchID: 'BR-0002', Name: 'East Legon Branch', Location: 'American House Rd, East Legon, Accra', Phone: '0209876543', OpeningHours: 'Mon-Sat 8:00am-8:00pm' });
  }

  // Services
  if (readAll_('Services').length === 0) {
    var svc = [
      ['Skin Fade', 'Haircut', 'Precision skin fade with clean lineup', 40, 40, 'BR-0001'],
      ['Classic Haircut', 'Haircut', 'Standard haircut & styling', 30, 25, 'BR-0001'],
      ['Beard Trim & Shape', 'Shave', 'Beard shaping with hot towel', 20, 20, 'BR-0001'],
      ['Hot Towel Shave', 'Shave', 'Traditional straight razor shave', 30, 30, 'BR-0001'],
      ['Box Braids', 'Braids', 'Medium box braids, shoulder length', 180, 150, 'BR-0001'],
      ['Cornrows', 'Braids', 'Classic cornrow styling', 90, 80, 'BR-0001'],
      ['Manicure', 'Manicure', 'Full manicure with polish', 45, 60, 'BR-0002'],
      ['Pedicure', 'Manicure', 'Full pedicure with polish', 50, 70, 'BR-0002'],
      ['Facial Treatment', 'Facial', 'Deep cleanse & moisturising facial', 60, 90, 'BR-0002'],
      ['Kids Haircut', 'Haircut', 'Haircut for children under 12', 25, 20, 'BR-0002']
    ];
    svc.forEach(function (s, i) {
      appendRow_('Services', {
        ServiceID: 'SV-' + String(i + 1).padStart(4, '0'), Name: s[0], Category: s[1], Description: s[2],
        DurationMinutes: s[3], Price: s[4], BranchID: s[5], Active: 'Y'
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
      ['Pomade - Matte Finish', 'Hair Products', 15, 30, 25, 5, 'BR-0001'],
      ['Beard Oil', 'Grooming', 12, 25, 20, 5, 'BR-0001'],
      ['Hair Relaxer Kit', 'Hair Products', 20, 45, 15, 4, 'BR-0002'],
      ['Nail Polish Set', 'Nail Products', 10, 22, 30, 6, 'BR-0002']
    ];
    prod.forEach(function (p, i) {
      appendRow_('Products', {
        ProductID: 'PR-' + String(i + 1).padStart(4, '0'), Name: p[0], Category: p[1], CostPrice: p[2],
        SellingPrice: p[3], QuantityInStock: p[4], ReorderLevel: p[5], BranchID: p[6]
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
      headers.forEach(function (h, i) { obj[h] = row[i]; });
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
  headers.forEach(function (h, i) { result[h] = current[i]; });
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
    staffId: user.StaffID, email: user.Email
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
  var branches = readAll_('Branches');
  var services = readAll_('Services').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  var staff = readAll_('Staff').filter(function (s) { return String(s.Active).toUpperCase() === 'Y'; });
  var heroSlides = readAll_('HeroSlides')
    .filter(function (h) { return String(h.Active).toUpperCase() === 'Y'; })
    .sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); });
  var gallery = readAll_('Gallery')
    .filter(function (g) { return String(g.Active).toUpperCase() === 'Y'; })
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

  return {
    settings: settings,
    branches: branches.map(stripRow_),
    services: services.map(stripRow_),
    staff: staff.map(function (s) { return stripRow_(sanitizeStaff_(s)); }),
    heroSlides: heroSlides.map(stripRow_),
    gallery: gallery.map(stripRow_),
    reviews: reviews
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
    Notes: String(data.notes || '')
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

/**
 * Returns bookable time slots for a branch/date, optionally scoped to one
 * stylist ("Anyone" when staffId is ''). Used by the public booking wizard
 * to render a live availability grid, and defensively by createAppointment()
 * to prevent double-booking.
 */
function getAvailableSlots(branchId, staffId, date) {
  if (!branchId || !date) return { slots: [], dayAvailable: true };
  var settings = getSettingsMap_();
  var startHour = Number(settings.BookingStartHour) || 9;
  var endHour = Number(settings.BookingEndHour) || 18;
  var interval = Number(settings.SlotIntervalMinutes) || 30;

  var branchStaff = readAll_('Staff').filter(function (s) {
    return s.BranchID === branchId && String(s.Active).toUpperCase() === 'Y';
  });
  var weekday = Utilities.formatDate(new Date(date + 'T00:00:00'), TIMEZONE, 'EEE');

  var dayAvailable = true;
  var candidateStaff = branchStaff;
  if (staffId) {
    var chosen = branchStaff.find(function (s) { return s.StaffID === staffId; });
    if (!chosen) return { slots: [], dayAvailable: false };
    dayAvailable = worksOnDay_(chosen, weekday);
    candidateStaff = [chosen];
  } else {
    dayAvailable = branchStaff.some(function (s) { return worksOnDay_(s, weekday); });
  }

  var existing = readAll_('Appointments').filter(function (a) {
    return a.BranchID === branchId && a.Date === date && a.Status !== 'Cancelled' && a.Status !== 'No-show';
  });

  var slots = [];
  for (var mins = startHour * 60; mins < endHour * 60; mins += interval) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var label = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    var available = dayAvailable && candidateStaff.some(function (s) {
      if (!worksOnDay_(s, weekday)) return false;
      return !existing.some(function (a) { return a.StaffID === s.StaffID && a.TimeSlot === label; });
    });
    slots.push({ time: label, available: available });
  }
  return { slots: slots, dayAvailable: dayAvailable };
}

function worksOnDay_(staffMember, weekday) {
  var days = String(staffMember.WorkDays || '').split(',').map(function (d) { return d.trim(); }).filter(Boolean);
  return days.length === 0 || days.indexOf(weekday) > -1;
}

function isSlotAvailable_(branchId, staffId, date, timeSlot) {
  var result = getAvailableSlots(branchId, staffId, date);
  var slot = result.slots.find(function (s) { return s.time === timeSlot; });
  return !slot || slot.available; // an off-grid custom time is not blocked
}

/* ---------- Gallery (public showcase + admin management) ---------- */

function getGallery(token) {
  requireAuth_(token);
  return readAll_('Gallery').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); }).map(stripRow_);
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

/* ============================================================================
 * 7. BRANCHES / SERVICES / STAFF CRUD (admin)
 * ==========================================================================*/

function getBranches(token) {
  requireAuth_(token);
  return readAll_('Branches').map(stripRow_);
}

function saveBranch(token, branch) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  if (branch.BranchID) {
    return stripRow_(updateById_('Branches', 'BranchID', branch.BranchID, branch));
  }
  branch.BranchID = nextId_('Branches', 'BranchID');
  return stripRow_(appendRow_('Branches', branch));
}

function deleteBranch(token, branchId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  return deleteById_('Branches', 'BranchID', branchId);
}

function getServices(token, branchId) {
  var user = requireAuth_(token);
  var scoped = scopeBranch_(user, branchId);
  var rows = readAll_('Services');
  if (scoped) rows = rows.filter(function (s) { return s.BranchID === scoped; });
  return rows.map(stripRow_);
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
  return rows.map(stripRow_);
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
  return rows.map(stripRow_);
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

function deleteCustomer(token, customerId) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner', 'Manager']);
  return deleteById_('Customers', 'CustomerID', customerId);
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
  return rows.map(stripRow_);
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
    return { Username: u.Username, Role: u.Role, BranchID: u.BranchID, Active: u.Active, StaffID: u.StaffID, Email: u.Email, Phone: u.Phone };
  });
}

function saveUser(token, userData) {
  var current = requireAuth_(token);
  requireRole_(current, ['Owner']);
  if (ROLES.indexOf(userData.Role) === -1) throw new Error('Invalid role.');

  var existing = readAll_('Users').find(function (u) { return u.Username === userData.Username; });
  if (existing) {
    var updates = { Role: userData.Role, BranchID: userData.BranchID, Active: userData.Active, StaffID: userData.StaffID || '', Email: userData.Email || '', Phone: userData.Phone || '' };
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
    Phone: userData.Phone || ''
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
  return getSettingsMap_();
}

function updateSettings(token, settingsObj) {
  var user = requireAuth_(token);
  requireRole_(user, ['Owner']);
  Object.keys(settingsObj).forEach(function (key) {
    if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
      var rowIndex = findRowIndexById_('Settings', 'Key', key);
      if (rowIndex === -1) {
        appendRow_('Settings', { Key: key, Value: settingsObj[key] });
      } else {
        updateById_('Settings', 'Key', key, { Value: settingsObj[key] });
      }
    }
  });
  return getSettingsMap_();
}

/* ============================================================================
 * 16. HERO CAROUSEL & IMAGE UPLOADS
 * ==========================================================================*/

function getHeroSlides(token) {
  requireAuth_(token);
  return readAll_('HeroSlides').sort(function (a, b) { return Number(a.SortOrder) - Number(b.SortOrder); }).map(stripRow_);
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
  if (!base64Data) throw new Error('No image data received.');

  var folder = getOrCreateUploadFolder_();
  var bytes = Utilities.base64Decode(base64Data.split(',').pop());
  var blob = Utilities.newBlob(bytes, mimeType || 'image/jpeg', filename || ('upload_' + Date.now()));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
    fileId: file.getId()
  };
}

function getOrCreateUploadFolder_() {
  var it = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
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

  return {
    todayAppointments: todayAppts.map(function (a) {
      var o = stripRow_(a);
      o.CustomerName = customers[a.CustomerID] ? customers[a.CustomerID].Name : 'Walk-in';
      o.ServiceName = services[a.ServiceID] ? services[a.ServiceID].Name : '';
      o.StaffName = staffMap[a.StaffID] ? staffMap[a.StaffID].Name : 'Any available';
      return o;
    }),
    todayRevenue: round2_(todayRevenue),
    todaySalesCount: todaySales.length,
    upcomingCount: upcoming.length,
    lowStock: lowStock.map(stripRow_),
    pendingCount: appts.filter(function (a) { return a.Status === 'Pending'; }).length
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
  var map = {};
  sales.forEach(function (s) {
    map[s.PaymentMethod] = (map[s.PaymentMethod] || 0) + Number(s.Total);
  });
  return Object.keys(map).map(function (k) { return { method: k, total: round2_(map[k]) }; });
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

function sendEmail_(email, subject, body) {
  if (!email) return;
  try {
    MailApp.sendEmail(email, subject, body);
    logNotification_('Email', email, subject, 'Sent');
  } catch (err) {
    logNotification_('Email', email, subject, 'Failed: ' + err.message);
  }
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
  sendSms_(customer.Phone, msg);
  if (customer.Email) {
    sendEmail_(customer.Email, 'Booking Received — ' + appt.Reference,
      msg + '\n\nWe will confirm your appointment shortly. Thank you for choosing ' + settings.BusinessName + '.');
  }
}

function sendAppointmentStatusUpdate_(appt, customer, statusText) {
  var settings = getSettingsMap_();
  var msg = 'Hi ' + customer.Name + ', your appointment (' + appt.Reference + ') has been ' + statusText + '. - ' + settings.BusinessName;
  sendSms_(customer.Phone, msg);
  if (customer.Email) sendEmail_(customer.Email, 'Appointment Update — ' + appt.Reference, msg);
}

function sendCompletionThankYou_(appt, customer, service, pointsEarned) {
  var settings = getSettingsMap_();
  var msg = 'Thank you for visiting ' + settings.BusinessName + ', ' + customer.Name + '! Your ' + service.Name +
    ' is complete. You earned ' + pointsEarned + ' loyalty points (total: ' + customer.LoyaltyPoints + '). See you again soon!';
  sendSms_(customer.Phone, msg);
  if (customer.Email) sendEmail_(customer.Email, 'Thank You For Visiting ' + settings.BusinessName, msg);
}

function sendSaleReceipt_(sale, customer, lineItems, pointsEarned) {
  var settings = getSettingsMap_();
  var itemLines = lineItems.map(function (li) { return li.name + ' x' + li.qty + ' — ' + CURRENCY_SYMBOL + li.lineTotal.toFixed(2); }).join('\n');
  var msg = 'Receipt ' + sale.SaleID + ' — Total ' + CURRENCY_SYMBOL + Number(sale.Total).toFixed(2) +
    ' paid via ' + sale.PaymentMethod + '. You earned ' + pointsEarned + ' loyalty points. Thank you for visiting ' + settings.BusinessName + '!';
  sendSms_(customer.Phone, msg);
  if (customer.Email) {
    sendEmail_(customer.Email, 'Your Receipt — ' + sale.SaleID,
      'Thank you for visiting ' + settings.BusinessName + '!\n\n' + itemLines +
      '\n\nSubtotal: ' + CURRENCY_SYMBOL + Number(sale.Subtotal).toFixed(2) +
      '\nDiscount: ' + CURRENCY_SYMBOL + Number(sale.Discount).toFixed(2) +
      '\nTax: ' + CURRENCY_SYMBOL + Number(sale.Tax).toFixed(2) +
      '\nTotal: ' + CURRENCY_SYMBOL + Number(sale.Total).toFixed(2) +
      '\nPayment Method: ' + sale.PaymentMethod +
      '\n\nLoyalty points earned: ' + pointsEarned +
      '\n\nSee you again soon!');
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
    if (c.Email) sendEmail_(c.Email, 'Appointment Reminder — Tomorrow', msg);
  });
  return appts.length + ' reminder(s) sent.';
}

/* ============================================================================
 * 19. UTILITIES
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
