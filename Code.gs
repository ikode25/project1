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

// ---------------------------------------------------------------------------
// Sheet schema — single source of truth for headers used by the generic
// object <-> row helpers below. Add a new sheet by adding an entry here.
// ---------------------------------------------------------------------------
var SHEETS = {
  Settings:       ['Key', 'Value'],
  Businesses:     ['BusinessID', 'Name', 'Description', 'LogoURL', 'WhatsAppNumber', 'Active', 'SortOrder', 'CreatedAt'],
  Products:       ['ProductID', 'BusinessID', 'ImageURL', 'Name', 'Description', 'Category', 'Price', 'Stock', 'IsService', 'EnquireOnWhatsApp', 'Active', 'CreatedAt'],
  Customers:      ['CustomerID', 'Name', 'Address', 'Phone', 'Username', 'PasswordHash', 'CreatedAt'],
  Admins:         ['AdminID', 'Username', 'PasswordHash', 'Name', 'Role', 'CreatedAt'],
  Orders:         ['OrderID', 'OrderType', 'Username', 'CustomerName', 'Phone', 'Address', 'Subtotal', 'DiscountAmount', 'Total', 'PaymentMethodID', 'PaymentMethodLabel', 'PayerNumber', 'TransactionID', 'PaymentStatus', 'OrderStatus', 'Notes', 'CreatedAt', 'UpdatedAt'],
  OrderItems:     ['OrderItemID', 'OrderID', 'ProductID', 'BusinessID', 'ProductName', 'BusinessName', 'Category', 'Qty', 'UnitPrice', 'LineDiscount', 'Subtotal'],
  PaymentMethods: ['PaymentMethodID', 'Type', 'Label', 'AccountName', 'AccountNumber', 'Provider', 'Instructions', 'Active', 'SortOrder'],
  Banners:        ['BannerID', 'ImageURL', 'Title', 'LinkURL', 'Active', 'SortOrder'],
  Discounts:      ['DiscountID', 'Label', 'Scope', 'TargetID', 'Type', 'Value', 'StartDate', 'EndDate', 'Active'],
  Expenses:       ['ExpenseID', 'Date', 'BusinessID', 'Category', 'Description', 'Amount', 'AddedBy', 'CreatedAt']
};

var LOW_STOCK_THRESHOLD = 5;
var ADMIN_TOKEN_TTL_SECONDS = 21600; // 6 hours (CacheService max)

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
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle(page === 'admin' ? ('Admin Portal - ' + siteName) : siteName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// The pages run inside a sandboxed iframe, so links between the storefront and
// the admin portal need the real deployment URL plus target="_top".
function getWebAppUrl() {
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
  if (props.getProperty('SETUP_COMPLETE') === 'true') return;
  withLock_(function () {
    if (props.getProperty('SETUP_COMPLETE') === 'true') return;
    Object.keys(SHEETS).forEach(function (name) { getSheet_(name); });
    seedDefaultSettings_();
    seedDefaultPaymentMethod_();
    seedSampleCatalog_();
    props.setProperty('SETUP_COMPLETE', 'true');
  });
}

// Manual entry point, kept for running from the Apps Script editor. Repairs
// missing sheets/headers even after the auto-setup flag has been set.
function setupSheets() {
  PropertiesService.getScriptProperties().deleteProperty('SETUP_COMPLETE');
  ensureSetup_();
  return 'Setup complete. Open the web app with ?page=admin to create your admin account.';
}

function seedDefaultSettings_() {
  var sheet = getSheet_('Settings');
  if (sheet.getLastRow() > 1) return; // already seeded
  var defaults = [
    ['SiteName', 'My Multi-Business Store'],
    ['Currency', 'GHS'],
    ['CurrencySymbol', 'GHS '],
    ['WhatsAppNumber', '233547359015'],
    ['WhatsAppGreeting', 'Hello! I would like to ask about your products.'],
    ['ChatbotEnabled', 'TRUE'],
    ['ChatbotGreeting', "Hi! I'm your shopping assistant. Ask me about orders, payment, delivery or products."],
    ['DriveFolderId', '']
  ];
  defaults.forEach(function (row) {
    sheet.appendRow(row);
  });
}

// No admin account is seeded with a default/generated password — there would be
// no safe way to hand it to you. Instead the admin page shows a one-time
// "create your admin account" form while the Admins sheet is empty; see
// adminNeedsFirstAccount() / adminCreateFirstAccount() below.

function seedDefaultPaymentMethod_() {
  var sheet = getSheet_('PaymentMethods');
  if (sheet.getLastRow() > 1) return;
  appendRowObject_('PaymentMethods', {
    PaymentMethodID: genId_('PM'),
    Type: 'Mobile Money',
    Label: 'Mobile Money',
    AccountName: 'Emmanuel Darkoh',
    AccountNumber: '0547359015',
    Provider: 'MTN/Vodafone/AirtelTigo Mobile Money',
    Instructions: 'Send the exact amount to this Mobile Money number, then enter the number you paid from and the Transaction ID below to confirm your payment.',
    Active: true,
    SortOrder: 1
  });
}

function seedSampleCatalog_() {
  var bizSheet = getSheet_('Businesses');
  if (bizSheet.getLastRow() > 1) return; // don't overwrite real data
  var businesses = [
    { key: 'databundles', Name: 'Data Bundles', Description: 'Affordable mobile data bundles for all networks.', LogoURL: '', WhatsAppNumber: '', Active: true, SortOrder: 1 },
    { key: 'frames', Name: 'Picture Frames & Gifts', Description: 'Custom picture frames and gift items.', LogoURL: '', WhatsAppNumber: '', Active: true, SortOrder: 2 },
    { key: 'security', Name: 'Security & Alarm Systems', Description: 'School sirens, smart bells and alarm systems — custom installs, enquire on WhatsApp.', LogoURL: '', WhatsAppNumber: '', Active: true, SortOrder: 3 },
    { key: 'code', Name: 'Scripts & Source Code', Description: 'Ready-made Google Apps Script and PHP project source code.', LogoURL: '', WhatsAppNumber: '', Active: true, SortOrder: 4 }
  ];
  var ids = {};
  businesses.forEach(function (b) {
    var id = genId_('BIZ');
    ids[b.key] = id;
    appendRowObject_('Businesses', {
      BusinessID: id, Name: b.Name, Description: b.Description, LogoURL: b.LogoURL,
      WhatsAppNumber: b.WhatsAppNumber, Active: b.Active, SortOrder: b.SortOrder, CreatedAt: new Date()
    });
  });

  var products = [
    { biz: 'databundles', Name: 'MTN 5GB Data Bundle', Description: 'Valid for 30 days.', Category: 'Data Bundles', Price: 30, Stock: '', IsService: true, EnquireOnWhatsApp: false },
    { biz: 'databundles', Name: 'Telecel 10GB Data Bundle', Description: 'Valid for 30 days.', Category: 'Data Bundles', Price: 55, Stock: '', IsService: true, EnquireOnWhatsApp: false },
    { biz: 'frames', Name: 'A4 Wooden Picture Frame', Description: 'Elegant wooden frame, holds one A4 photo.', Category: 'Picture Frames', Price: 45, Stock: 20, IsService: false, EnquireOnWhatsApp: false },
    { biz: 'security', Name: 'School Siren / Smart Bell', Description: 'Loud electronic school bell/siren with programmable schedule. Installation available. Chat with us to discuss your requirements and get a quote.', Category: 'Alarm Systems', Price: 0, Stock: '', IsService: true, EnquireOnWhatsApp: true },
    { biz: 'code', Name: 'Google Apps Script E-Commerce Source Code', Description: 'Full source code license for a Sheet-powered e-commerce site like this one.', Category: 'Source Code', Price: 250, Stock: '', IsService: true, EnquireOnWhatsApp: false }
  ];
  products.forEach(function (p) {
    appendRowObject_('Products', {
      ProductID: genId_('PRD'), BusinessID: ids[p.biz], ImageURL: '', Name: p.Name, Description: p.Description,
      Category: p.Category, Price: p.Price, Stock: p.Stock, IsService: p.IsService, EnquireOnWhatsApp: p.EnquireOnWhatsApp,
      Active: true, CreatedAt: new Date()
    });
  });
}

// ---------------------------------------------------------------------------
// Generic sheet <-> object helpers (header-driven, order independent)
// ---------------------------------------------------------------------------
function sheetToObjects_(name) {
  // Reads never create or repair a sheet — a missing tab yields an empty list
  // instead of taking the whole page down.
  var sheet = getSheet_(name, false);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
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
  return withLock_(function () {
    var sheet = getSheet_(name);
    var headers = SHEETS[name];
    var row = headers.map(function (h) {
      var v = obj[h];
      return (v === undefined || v === null) ? '' : v;
    });
    sheet.appendRow(row);
    return obj;
  });
}

function updateRowById_(name, idField, idValue, patch) {
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

function toNum_(v, fallback) {
  var n = parseFloat(v);
  return isNaN(n) ? (fallback === undefined ? 0 : fallback) : n;
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
  rows.forEach(function (r) { out[r.Key] = r.Value; });
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
function getStorefrontData() {
  // A broken/empty sheet should degrade to an empty store, never to an error
  // dialog over the whole page.
  try {
    return buildStorefrontData_();
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
  var businesses = sheetToObjects_('Businesses').filter(function (b) { return toBool_(b.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) {
      return { id: b.BusinessID, name: b.Name, description: b.Description, logo: b.LogoURL, whatsapp: b.WhatsAppNumber };
    });

  var bizById = {};
  sheetToObjects_('Businesses').forEach(function (b) { bizById[b.BusinessID] = b; });

  var discounts = getActiveDiscounts_();

  var products = sheetToObjects_('Products').filter(function (p) { return toBool_(p.Active); }).map(function (p) {
    var biz = bizById[p.BusinessID] || {};
    var price = toNum_(p.Price);
    var discount = bestDiscountFor_(p, discounts);
    var finalPrice = discount ? Math.max(0, price - discount.amount) : price;
    return {
      id: p.ProductID,
      businessId: p.BusinessID,
      businessName: biz.Name || 'General',
      image: p.ImageURL,
      name: p.Name,
      description: p.Description,
      category: p.Category,
      price: finalPrice,
      originalPrice: price,
      onSale: !!discount,
      discountLabel: discount ? discount.label : null,
      stock: (p.Stock === '' || p.Stock === null || p.Stock === undefined) ? null : toNum_(p.Stock),
      isService: toBool_(p.IsService),
      enquireOnWhatsApp: toBool_(p.EnquireOnWhatsApp)
    };
  });

  var banners = sheetToObjects_('Banners').filter(function (b) { return toBool_(b.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (b) { return { id: b.BannerID, image: b.ImageURL, title: b.Title, link: b.LinkURL }; });

  var paymentMethods = sheetToObjects_('PaymentMethods').filter(function (p) { return toBool_(p.Active); })
    .sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); })
    .map(function (p) {
      return { id: p.PaymentMethodID, type: p.Type, label: p.Label, accountName: p.AccountName, accountNumber: p.AccountNumber, provider: p.Provider, instructions: p.Instructions };
    });

  return {
    businesses: businesses,
    products: products,
    banners: banners,
    paymentMethods: paymentMethods,
    settings: getPublicSettings_(),
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
  return { username: match.Username, name: match.Name, address: match.Address, phone: match.Phone };
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

    for (var i = 0; i < payload.items.length; i++) {
      var reqItem = payload.items[i];
      var product = productsById[reqItem.productId];
      if (!product || !toBool_(product.Active)) {
        return { success: false, message: 'One of the items in your cart is no longer available. Please refresh and try again.' };
      }
      var qty = Math.max(1, Math.floor(toNum_(reqItem.qty, 1)));
      var stock = (product.Stock === '' || product.Stock === null || product.Stock === undefined) ? null : toNum_(product.Stock);
      if (stock !== null && qty > stock) {
        return { success: false, message: '"' + product.Name + '" only has ' + stock + ' in stock.' };
      }
      var unitPrice = toNum_(product.Price);
      var discount = bestDiscountFor_(product, discounts);
      var finalUnitPrice = discount ? Math.max(0, unitPrice - discount.amount) : unitPrice;
      var lineSubtotal = finalUnitPrice * qty;
      subtotal += unitPrice * qty;
      discountTotal += (unitPrice - finalUnitPrice) * qty;

      lineItems.push({
        product: product, qty: qty, unitPrice: finalUnitPrice,
        lineDiscount: (unitPrice - finalUnitPrice) * qty, subtotal: lineSubtotal, stock: stock
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
        LineDiscount: round2_(li.lineDiscount), Subtotal: round2_(li.subtotal)
      });
      // Decrement stock for tracked (non-unlimited) inventory.
      if (li.stock !== null) {
        updateRowById_('Products', 'ProductID', li.product.ProductID, { Stock: Math.max(0, li.stock - li.qty) });
      }
    });

    return { success: true, orderId: orderId, total: round2_(total) };
  } catch (err) {
    return { success: false, message: 'Something went wrong placing your order: ' + err.message };
  }
}

function round2_(n) { return Math.round((toNum_(n) + Number.EPSILON) * 100) / 100; }

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
  var order = sheetToObjects_('Orders').filter(function (o) {
    return String(o.OrderID) === orderId && String(o.Phone).replace(/\D/g, '') === phone.replace(/\D/g, '');
  })[0];
  if (!order) return null;
  return attachItemsToOrders_([order])[0];
}

function attachItemsToOrders_(orders) {
  var allItems = sheetToObjects_('OrderItems');
  return orders.map(function (o) {
    var items = allItems.filter(function (i) { return i.OrderID === o.OrderID; }).map(function (i) {
      return { productName: i.ProductName, businessName: i.BusinessName, category: i.Category, qty: i.Qty, unitPrice: i.UnitPrice, subtotal: i.Subtotal };
    });
    return {
      orderId: o.OrderID, customerName: o.CustomerName, phone: o.Phone, address: o.Address,
      subtotal: o.Subtotal, discountAmount: o.DiscountAmount, total: o.Total,
      paymentMethod: o.PaymentMethodLabel, paymentStatus: o.PaymentStatus, orderStatus: o.OrderStatus,
      createdAt: o.CreatedAt, updatedAt: o.UpdatedAt, items: items
    };
  });
}

// ============================================================================
// ADMIN PORTAL API — every function below (except adminLogin) requires a
// valid session token returned by adminLogin().
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
// so it closes permanently the moment the first account is created.
function adminCreateFirstAccount(name, username, password) {
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
    return { success: true };
  });
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
  return { token: token, name: match.Name, role: match.Role, username: match.Username };
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
  return sheetToObjects_('Admins').map(function (a) { return { id: a.AdminID, username: a.Username, name: a.Name, role: a.Role, createdAt: a.CreatedAt }; });
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

  // Sales for the last 14 days (confirmed orders only)
  var days = [];
  for (var i = 13; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: Utilities.formatDate(d, Session.getScriptTimeZone() || 'Etc/UTC', 'MMM d'), key: Utilities.formatDate(d, Session.getScriptTimeZone() || 'Etc/UTC', 'yyyy-MM-dd'), total: 0 });
  }
  var dayIndex = {};
  days.forEach(function (d, idx) { dayIndex[d.key] = idx; });
  confirmedOrders.forEach(function (o) {
    if (!o.CreatedAt) return;
    var key = Utilities.formatDate(new Date(o.CreatedAt), Session.getScriptTimeZone() || 'Etc/UTC', 'yyyy-MM-dd');
    if (dayIndex.hasOwnProperty(key)) days[dayIndex[key]].total += toNum_(o.Total);
  });

  // Business breakdown (confirmed order items)
  var confirmedOrderIds = {};
  confirmedOrders.forEach(function (o) { confirmedOrderIds[o.OrderID] = true; });
  var bizTotals = {};
  var productQty = {};
  items.forEach(function (it) {
    if (!confirmedOrderIds[it.OrderID]) return;
    bizTotals[it.BusinessName || 'General'] = (bizTotals[it.BusinessName || 'General'] || 0) + toNum_(it.Subtotal);
    productQty[it.ProductName] = (productQty[it.ProductName] || 0) + toNum_(it.Qty);
  });
  var businessBreakdown = Object.keys(bizTotals).map(function (k) { return { business: k, total: round2_(bizTotals[k]) }; })
    .sort(function (a, b) { return b.total - a.total; });
  var topProducts = Object.keys(productQty).map(function (k) { return { product: k, qty: productQty[k] }; })
    .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

  var lowStock = products.filter(function (p) {
    if (p.Stock === '' || p.Stock === null || p.Stock === undefined) return false;
    return toBool_(p.Active) && toNum_(p.Stock) <= LOW_STOCK_THRESHOLD;
  }).map(function (p) { return { id: p.ProductID, name: p.Name, stock: toNum_(p.Stock) }; });

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
  if (filters.paymentStatus) orders = orders.filter(function (o) { return o.PaymentStatus === filters.paymentStatus; });
  if (filters.orderStatus) orders = orders.filter(function (o) { return o.OrderStatus === filters.orderStatus; });
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
  var orders = sheetToObjects_('Orders');
  var header = ['OrderID', 'Date', 'Customer', 'Phone', 'Total', 'PaymentMethod', 'PaymentStatus', 'OrderStatus'];
  var lines = [header.join(',')];
  orders.forEach(function (o) {
    var row = [o.OrderID, o.CreatedAt, o.CustomerName, o.Phone, o.Total, o.PaymentMethodLabel, o.PaymentStatus, o.OrderStatus]
      .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; });
    lines.push(row.join(','));
  });
  return lines.join('\n');
}

// --- Businesses ----------------------------------------------------------
function adminGetBusinesses(token) {
  requireAdmin_(token);
  return sheetToObjects_('Businesses').sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); });
}

function adminSaveBusiness(token, biz) {
  requireAdmin_(token);
  if (!biz.Name) return { success: false, message: 'Business name is required.' };
  if (biz.BusinessID) {
    updateRowById_('Businesses', 'BusinessID', biz.BusinessID, {
      Name: biz.Name, Description: biz.Description || '', LogoURL: biz.LogoURL || '',
      WhatsAppNumber: biz.WhatsAppNumber || '', Active: !!biz.Active, SortOrder: toNum_(biz.SortOrder, 1)
    });
    return { success: true, id: biz.BusinessID };
  }
  var id = genId_('BIZ');
  appendRowObject_('Businesses', {
    BusinessID: id, Name: biz.Name, Description: biz.Description || '', LogoURL: biz.LogoURL || '',
    WhatsAppNumber: biz.WhatsAppNumber || '', Active: biz.Active !== false, SortOrder: toNum_(biz.SortOrder, 1), CreatedAt: new Date()
  });
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
  return sheetToObjects_('Products');
}

function adminSaveProduct(token, p) {
  requireAdmin_(token);
  if (!p.Name || !p.BusinessID) return { success: false, message: 'Product name and business are required.' };
  var data = {
    BusinessID: p.BusinessID, ImageURL: p.ImageURL || '', Name: p.Name, Description: p.Description || '',
    Category: p.Category || 'General', Price: toNum_(p.Price, 0), Stock: p.Stock === '' || p.Stock === null || p.Stock === undefined ? '' : toNum_(p.Stock, 0),
    IsService: !!p.IsService, EnquireOnWhatsApp: !!p.EnquireOnWhatsApp, Active: p.Active !== false
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

function adminDeleteProduct(token, productId) {
  requireAdmin_(token);
  deleteRowById_('Products', 'ProductID', productId);
  return { success: true };
}

// --- Banners ---------------------------------------------------------------
function adminGetBanners(token) {
  requireAdmin_(token);
  return sheetToObjects_('Banners').sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); });
}

function adminSaveBanner(token, b) {
  requireAdmin_(token);
  if (!b.ImageURL) return { success: false, message: 'Banner image is required.' };
  if (b.BannerID) {
    updateRowById_('Banners', 'BannerID', b.BannerID, {
      ImageURL: b.ImageURL, Title: b.Title || '', LinkURL: b.LinkURL || '', Active: !!b.Active, SortOrder: toNum_(b.SortOrder, 1)
    });
    return { success: true, id: b.BannerID };
  }
  var id = genId_('BAN');
  appendRowObject_('Banners', { BannerID: id, ImageURL: b.ImageURL, Title: b.Title || '', LinkURL: b.LinkURL || '', Active: b.Active !== false, SortOrder: toNum_(b.SortOrder, 1) });
  return { success: true, id: id };
}

function adminDeleteBanner(token, bannerId) {
  requireAdmin_(token);
  deleteRowById_('Banners', 'BannerID', bannerId);
  return { success: true };
}

// --- Payment Methods ---------------------------------------------------------------
function adminGetPaymentMethods(token) {
  requireAdmin_(token);
  return sheetToObjects_('PaymentMethods').sort(function (a, b) { return toNum_(a.SortOrder) - toNum_(b.SortOrder); });
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

// --- Discounts ---------------------------------------------------------------
function adminGetDiscounts(token) {
  requireAdmin_(token);
  return sheetToObjects_('Discounts');
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

// --- Expenses ---------------------------------------------------------------
function adminGetExpenses(token) {
  var admin = requireAdmin_(token);
  return sheetToObjects_('Expenses').sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
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

// --- Customers (read-only view) ---------------------------------------------
function adminGetCustomers(token) {
  requireAdmin_(token);
  return sheetToObjects_('Customers').map(function (c) {
    return { id: c.CustomerID, name: c.Name, address: c.Address, phone: c.Phone, username: c.Username, createdAt: c.CreatedAt };
  });
}

// --- Settings ---------------------------------------------------------------
function adminGetSettings(token) {
  requireAdmin_(token);
  return getPublicSettings_();
}

function adminSaveSettings(token, settingsObj) {
  requireAdmin_(token);
  Object.keys(settingsObj).forEach(function (key) {
    var existing = sheetToObjects_('Settings').filter(function (s) { return s.Key === key; })[0];
    if (existing) {
      updateRowById_('Settings', 'Key', key, { Value: settingsObj[key] });
    } else {
      appendRowObject_('Settings', { Key: key, Value: settingsObj[key] });
    }
  });
  return { success: true };
}

// --- Image upload (Drive-backed) ---------------------------------------------
function adminUploadImage(token, base64Data, filename, mimeType) {
  requireAdmin_(token);
  var folder = getOrCreateUploadFolder_();
  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType || 'image/png', filename || ('upload-' + Date.now()));
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { success: true, url: 'https://drive.google.com/uc?export=view&id=' + file.getId() };
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
