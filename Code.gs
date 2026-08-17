/**
 * Developed by Quecci Manuel (Manuel Scripts)
 * WhatsApp: https://wa.me/233547359015 (For Custom Projects)
 * YouTube: https://www.youtube.com/@manuelspctips (Subscribe for more!)
 */

/***************************************************
 * GLOBAL CONSTANTS
 ***************************************************/
const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// SHEET NAMES
const LOGIN_SHEET_NAME          = "Login";

// Login Sheet Column Indexes
const LOGIN_USERNAME_COL     = 0;  // Email
const LOGIN_PASSWORD_COL     = 1;
const LOGIN_ROLE_COL         = 2;
const LOGIN_ASSIGNED_ROOMS_COL = 3;
const LOGIN_FULL_NAME_COL    = 4;
const LOGIN_OTP_COL          = 5;  // For password reset OTP
const ROOMS_SHEET_NAME          = "Rooms";
const BOOKINGS_SHEET_NAME       = "Bookings";
const WAITLIST_SHEET_NAME       = "Waitlist";
const LOGS_SHEET_NAME           = "Logs";
const PAYMENT_METHODS_SHEET_NAME = "PaymentMethods";
const TRANSACTIONS_SHEET_NAME    = "Transactions";
const CONTACT_MESSAGES_SHEET_NAME = "ContactMessages";
const FOOD_MENU_SHEET_NAME       = "FoodMenu";
const FOOD_ORDERS_SHEET_NAME     = "FoodOrders";
const CLEANING_REQUESTS_SHEET_NAME = "CleaningRequests";
const QUOTES_SHEET_NAME          = "Quotes";
const QUOTES_DATE_COL            = 0;
const QUOTES_DATA_COL            = 1;
const INVOICES_SHEET_NAME        = "Invoices";
const INVOICES_DATE_COL          = 0;
const INVOICES_DATA_COL          = 1;

// ROOMS sheet columns (0-based)
const ROOM_NO_COL          = 0;
const ROOM_TYPE_COL        = 1;
const ROOM_RATE_COL        = 2;
const ROOM_STATUS_COL      = 3;
const ROOM_DND_COL         = 4;  // Do Not Disturb
const ROOM_IMAGE_COL       = 5;  // Room Image URL

// BOOKINGS sheet columns (0-based) - Updated with new fields
const TICKET_ID_COL        = 0;
const BOOKING_ROOM_NO_COL  = 1;
const GUEST_NAME_COL       = 2;
const PHONE_COL            = 3;
const EMAIL_COL            = 4;
const CITY_COL             = 5;
const MARITAL_STATUS_COL   = 6;
const OCCUPANCY_TYPE_COL   = 7;
const FAMILY_DETAILS_COL   = 8;
const CHECK_IN_COL         = 9;
const CHECK_OUT_COL        = 10;
const BOOKING_STATUS_COL   = 11;
const ROOM_RATE_BOOK_COL   = 12;
const DISCOUNT_COL         = 13;
const TAX_COL              = 14;
const PAYMENT_METHOD_COL   = 15;
const TOTAL_AMOUNT_COL     = 16;
const SPECIAL_REQUESTS_COL = 17;
const EARLY_CHECKIN_COL    = 18;
const LATE_CHECKOUT_COL    = 19;
const EXTRA_CHARGES_COL    = 20;
const GROUP_ID_COL         = 21;
const CREATED_AT_COL       = 22;
const PAYMENT_STATUS_COL   = 23;  // Paid, Not Paid, Partial
const PAID_AMOUNT_COL      = 24;  // Amount paid so far
const ID_CARD_FRONT_COL    = 25;  // National ID Card Front Image URL
const ID_CARD_BACK_COL     = 26;  // National ID Card Back Image URL
const PAYMENT_SCREENSHOT_COL = 27; // Payment screenshot image URL

// Google Drive folder name for assets
const ASSETS_FOLDER_NAME   = "ASSETS";

// SETTINGS sheet - single key/value store for hotel-wide admin settings
const SETTINGS_SHEET_NAME  = "Settings";
const SETTINGS_KEY_COL     = 0;
const SETTINGS_VALUE_COL   = 1;

// Default settings applied when a key hasn't been configured yet
const DEFAULT_SETTINGS = {
  // General
  hotelName: "Hotel Management System",
  tagline: "Your dream stay awaits",
  description: "Experience unparalleled luxury and comfort with us.",
  address: "",
  phone: "",
  email: "",
  website: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  currencySymbol: "$",
  footerText: "",
  // Branding
  logoUrl: "",
  logoFileId: "",
  primaryColor: "#001f3f",
  darkColor: "#001529",
  lightColor: "#003366",
  accentColor: "#0074D9",
  hoverColor: "#002a52",
  successColor: "#34a853",
  warningColor: "#fbbc04",
  dangerColor: "#ea4335",
  // SMS
  smsEnabled: false,
  smsProvider: "none", // none | arkesel | hubtel | custom
  smsSendOnBooking: false,
  arkeselApiKey: "",
  arkeselSenderId: "",
  hubtelClientId: "",
  hubtelClientSecret: "",
  hubtelSenderId: "",
  customSmsUrl: "",
  customSmsMethod: "POST",
  customSmsHeaders: "",     // JSON string of extra headers
  customSmsBodyTemplate: "", // JSON/body string, supports {{phone}} and {{message}}
  // Public page / hero carousel
  heroImages: [],           // [{ fileId, url }]
  heroAutoplay: true,
  heroIntervalSeconds: 6,
  aboutImageUrl: "",
  aboutImageFileId: ""
};

// Keys whose value is JSON (object/array) rather than a plain string/boolean/number
const SETTINGS_JSON_KEYS = ["heroImages"];
const SETTINGS_BOOLEAN_KEYS = ["smsEnabled", "smsSendOnBooking", "heroAutoplay"];
const SETTINGS_NUMBER_KEYS = ["heroIntervalSeconds"];

// PAYMENT METHODS sheet columns (0-based)
const PM_ID_COL            = 0;
const PM_NAME_COL          = 1;
const PM_DESCRIPTION_COL   = 2;
const PM_ACCOUNT_NAME_COL  = 3;   // Account holder name
const PM_BANK_NAME_COL     = 4;   // Bank name
const PM_ACCOUNT_NO_COL    = 5;   // Account number
const PM_QR_CODE_COL       = 6;   // QR code image (Google Drive file ID)
const PM_STATUS_COL        = 7;
const PM_CREATED_AT_COL    = 8;

// TRANSACTIONS sheet columns (0-based) - JSON format per date
const TXN_DATE_COL         = 0;   // Date in full ISO 8601 format (2026-01-26T00:00:00.000Z)
const TXN_DATA_COL         = 1;   // JSON array of transactions for that date (each with full ISO timestamp)

// WAITLIST sheet columns (0-based)
const WL_ID_COL            = 0;
const WL_GUEST_NAME_COL    = 1;
const WL_PHONE_COL         = 2;
const WL_EMAIL_COL         = 3;
const WL_ROOM_TYPE_COL     = 4;
const WL_CHECK_IN_COL      = 5;
const WL_CHECK_OUT_COL     = 6;
const WL_NUM_ROOMS_COL     = 7;
const WL_REQUESTS_COL      = 8;
const WL_STATUS_COL        = 9;
const WL_CREATED_AT_COL    = 10;
const WL_NOTES_COL         = 11;


/***************************************************
 * WEB APP ENTRY POINT
 ***************************************************/
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template
    .evaluate()
    .setTitle('Hotel Management System')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}

/***************************************************
 * SETUP DEMO DATA - Run this once to create sheets and sample data
 * Uses generic names (User 1, User 2, etc.) - no real person data
 ***************************************************/
function setupDemoData() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const now = new Date();

  // Step 1: Create temp sheet (Google Sheets requires at least one sheet)
  const tempSheet = ss.insertSheet('_TEMP_SETUP_');

  // Step 2: Delete all existing sheets except temp
  const allSheets = ss.getSheets();
  for (let i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName() !== '_TEMP_SETUP_') {
      ss.deleteSheet(allSheets[i]);
    }
  }

  // ============================================
  // DATE HELPERS
  // ============================================
  const yesterday = new Date(now.getTime() - 86400000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
  const tomorrow = new Date(now.getTime() + 86400000);
  const twoDaysLater = new Date(now.getTime() + 2 * 86400000);
  const threeDaysLater = new Date(now.getTime() + 3 * 86400000);
  const fiveDaysLater = new Date(now.getTime() + 5 * 86400000);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const tenDaysLater = new Date(now.getTime() + 10 * 86400000);
  const twoWeeksLater = new Date(now.getTime() + 14 * 86400000);
  const nextMonth = new Date(now.getTime() + 30 * 86400000);

  const todayDateISO = now.toISOString().split('T')[0] + 'T00:00:00.000Z';
  const yesterdayDateISO = yesterday.toISOString().split('T')[0] + 'T00:00:00.000Z';
  const twoDaysAgoDateISO = twoDaysAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';

  // Group booking IDs
  const demoGroupId1 = 'GRP' + now.getTime().toString().slice(-6);
  const demoGroupId2 = 'GRP' + (now.getTime() - 100000).toString().slice(-6);

  // ============================================
  // STEP 3: LOGIN SHEET (10 Users - All Roles)
  // ============================================
  let loginSheet = ss.insertSheet(LOGIN_SHEET_NAME);
  loginSheet.appendRow(['Username', 'Password', 'Role', 'Assigned Rooms', 'Full Name', 'OTP']);

  // 2 Admins
  loginSheet.appendRow(['admin1@test.com', 'admin123', 'admin', '', 'Admin 1', '']);
  loginSheet.appendRow(['admin2@test.com', 'admin123', 'admin', '', 'Admin 2', '']);

  // 4 Regular Users (Guests)
  loginSheet.appendRow(['user1@test.com', 'user123', 'user', '', 'User 1', '']);
  loginSheet.appendRow(['user2@test.com', 'user123', 'user', '', 'User 2', '']);
  loginSheet.appendRow(['user3@test.com', 'user123', 'user', '', 'User 3', '']);
  loginSheet.appendRow(['user4@test.com', 'user123', 'user', '', 'User 4', '']);

  // 2 Food Staff (Different room assignments)
  loginSheet.appendRow(['food1@test.com', 'staff123', 'FoodStaff', '101,102,103,104,105,106,107,108,109,110', 'Food Staff 1', '']);
  loginSheet.appendRow(['food2@test.com', 'staff123', 'FoodStaff', '111,112,113,114,115,116,117,118,119,120', 'Food Staff 2', '']);

  // 2 Cleaners (Different room assignments)
  loginSheet.appendRow(['cleaner1@test.com', 'staff123', 'Cleaner', '101,102,103,104,105,106,107,108,109,110', 'Cleaner 1', '']);
  loginSheet.appendRow(['cleaner2@test.com', 'staff123', 'Cleaner', '111,112,113,114,115,116,117,118,119,120', 'Cleaner 2', '']);

  loginSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  loginSheet.setColumnWidths(1, 6, 180);

  // ============================================
  // STEP 4: ROOMS SHEET (20 Rooms - Various Status)
  // ============================================
  let roomsSheet = ss.insertSheet(ROOMS_SHEET_NAME);
  roomsSheet.appendRow(['Room No', 'Type', 'Rate', 'Status', 'DND', 'Image']);

  const roomConfigs = [
    // Floor 1: Standard Rooms (101-105)
    { no: '101', type: 'Standard', rate: 100, status: 'Booked', dnd: 'Yes' },
    { no: '102', type: 'Standard', rate: 100, status: 'Booked', dnd: 'No' },
    { no: '103', type: 'Standard', rate: 100, status: 'Checked In', dnd: 'No' },
    { no: '104', type: 'Standard', rate: 100, status: 'Available', dnd: 'No' },
    { no: '105', type: 'Standard', rate: 100, status: 'Available', dnd: 'No' },
    // Floor 1: Deluxe Rooms (106-110)
    { no: '106', type: 'Deluxe', rate: 150, status: 'Checked In', dnd: 'Yes' },
    { no: '107', type: 'Deluxe', rate: 150, status: 'Booked', dnd: 'No' },
    { no: '108', type: 'Deluxe', rate: 150, status: 'Booked', dnd: 'No' },
    { no: '109', type: 'Deluxe', rate: 150, status: 'Maintenance', dnd: 'No' },
    { no: '110', type: 'Deluxe', rate: 150, status: 'Available', dnd: 'No' },
    // Floor 2: Suite Rooms (111-115)
    { no: '111', type: 'Suite', rate: 250, status: 'Checked In', dnd: 'No' },
    { no: '112', type: 'Suite', rate: 250, status: 'Booked', dnd: 'No' },
    { no: '113', type: 'Suite', rate: 250, status: 'Available', dnd: 'No' },
    { no: '114', type: 'Suite', rate: 250, status: 'Available', dnd: 'No' },
    { no: '115', type: 'Suite', rate: 250, status: 'Maintenance', dnd: 'No' },
    // Floor 2: Executive Rooms (116-120)
    { no: '116', type: 'Executive', rate: 350, status: 'Checked In', dnd: 'Yes' },
    { no: '117', type: 'Executive', rate: 350, status: 'Booked', dnd: 'No' },
    { no: '118', type: 'Executive', rate: 350, status: 'Available', dnd: 'No' },
    { no: '119', type: 'Executive', rate: 350, status: 'Available', dnd: 'No' },
    { no: '120', type: 'Executive', rate: 350, status: 'Available', dnd: 'No' }
  ];

  roomConfigs.forEach(room => {
    roomsSheet.appendRow([room.no, room.type, room.rate, room.status, room.dnd, '']);
  });

  roomsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  roomsSheet.setColumnWidths(1, 6, 120);

  // ============================================
  // STEP 5: BOOKINGS SHEET (15 Bookings - Various Status & Payments)
  // ============================================
  let bookingsSheet = ss.insertSheet(BOOKINGS_SHEET_NAME);
  bookingsSheet.appendRow([
    'Ticket ID', 'Room No', 'Guest Name', 'Phone', 'Email', 'City',
    'Marital Status', 'Occupancy Type', 'Family Details', 'Check In', 'Check Out',
    'Status', 'Room Rate', 'Discount', 'Tax', 'Payment Method', 'Total Amount',
    'Special Requests', 'Early Check-in', 'Late Checkout', 'Extra Charges', 'Group ID', 'Created At',
    'Payment Status', 'Paid Amount', 'ID Card Front', 'ID Card Back', 'Payment Screenshot'
  ]);

  const bookingsData = [
    // User1 Bookings (3 bookings - various statuses)
    ['TKT001', '101', 'User 1', '+1111111111', 'user1@test.com', 'City A', 'Married', 'Family', '2 Adults, 1 Child', now.toISOString(), nextWeek.toISOString(), 'Booked', 100, 10, 13.5, 'Card', 703.5, 'Extra pillows please', 'No', 'No', 0, '', threeDaysAgo.toISOString(), 'Paid', 703.5, '', '', ''],
    ['TKT002', '103', 'User 1', '+1111111111', 'user1@test.com', 'City A', 'Married', 'Couple', '2 Adults', yesterday.toISOString(), threeDaysLater.toISOString(), 'Checked In', 100, 5, 14.25, 'Cash', 509.25, 'Quiet room', 'Yes', 'No', 50, '', twoDaysAgo.toISOString(), 'Paid', 509.25, '', '', ''],
    ['TKT003', '106', 'User 1', '+1111111111', 'user1@test.com', 'City A', 'Married', 'Family', '2 Adults, 2 Kids', twoDaysAgo.toISOString(), yesterday.toISOString(), 'Checked Out', 150, 0, 22.5, 'Card', 172.5, '', 'No', 'Yes', 45, '', threeDaysAgo.toISOString(), 'Paid', 172.5, '', '', ''],

    // User2 Bookings (3 bookings)
    ['TKT004', '102', 'User 2', '+2222222222', 'user2@test.com', 'City B', 'Single', 'Single', '', tomorrow.toISOString(), fiveDaysLater.toISOString(), 'Booked', 100, 0, 15, 'Bank Transfer', 515, '', 'No', 'No', 0, '', now.toISOString(), 'Not Paid', 0, '', '', ''],
    ['TKT005', '111', 'User 2', '+2222222222', 'user2@test.com', 'City B', 'Single', 'Single', '', now.toISOString(), twoDaysLater.toISOString(), 'Checked In', 250, 25, 33.75, 'Card', 508.75, 'High floor', 'No', 'No', 0, '', yesterday.toISOString(), 'Partial', 250, '', '', ''],
    ['TKT006', '116', 'User 2', '+2222222222', 'user2@test.com', 'City B', 'Single', 'Single', '', yesterday.toISOString(), now.toISOString(), 'Checked In', 350, 0, 52.5, 'Cash', 402.5, 'Airport pickup', 'Yes', 'Yes', 90, '', twoDaysAgo.toISOString(), 'Paid', 402.5, '', '', ''],

    // User3 Bookings (2 bookings)
    ['TKT007', '107', 'User 3', '+3333333333', 'user3@test.com', 'City C', 'Married', 'Couple', '2 Adults', twoDaysLater.toISOString(), nextWeek.toISOString(), 'Booked', 150, 15, 20.25, 'Card', 755.25, 'Anniversary celebration', 'No', 'Yes', 45, '', now.toISOString(), 'Paid', 755.25, '', '', ''],
    ['TKT008', '112', 'User 3', '+3333333333', 'user3@test.com', 'City C', 'Married', 'Family', '2 Adults, 1 Child', now.toISOString(), fiveDaysLater.toISOString(), 'Booked', 250, 0, 37.5, 'Bank Transfer', 1287.5, 'Baby cot needed', 'No', 'No', 0, '', yesterday.toISOString(), 'Not Paid', 0, '', '', ''],

    // User4 Bookings (2 bookings)
    ['TKT009', '117', 'User 4', '+4444444444', 'user4@test.com', 'City D', 'Single', 'Single', '', tomorrow.toISOString(), tenDaysLater.toISOString(), 'Booked', 350, 35, 47.25, 'Card', 3162.25, 'Business trip', 'Yes', 'No', 45, '', now.toISOString(), 'Partial', 1500, '', '', ''],
    ['TKT010', '108', 'User 4', '+4444444444', 'user4@test.com', 'City D', 'Single', 'Single', '', threeDaysAgo.toISOString(), yesterday.toISOString(), 'Checked Out', 150, 10, 21, 'Cash', 461, '', 'No', 'No', 0, '', threeDaysAgo.toISOString(), 'Paid', 461, '', '', ''],

    // GROUP BOOKING 1: Corporate Event (3 rooms)
    ['TKT011', '118', 'Corp User 1', '+5555555551', 'corp1@test.com', 'City E', 'Single', 'Single', '', tomorrow.toISOString(), fiveDaysLater.toISOString(), 'Booked', 350, 50, 45, 'Card', 1545, 'Conference room access', 'Yes', 'No', 45, demoGroupId1, now.toISOString(), 'Paid', 1545, '', '', ''],
    ['TKT012', '119', 'Corp User 2', '+5555555552', 'corp2@test.com', 'City E', 'Single', 'Single', '', tomorrow.toISOString(), fiveDaysLater.toISOString(), 'Booked', 350, 50, 45, 'Card', 1545, 'Same floor as team', 'No', 'No', 0, demoGroupId1, now.toISOString(), 'Paid', 1545, '', '', ''],
    ['TKT013', '120', 'Corp User 3', '+5555555553', 'corp3@test.com', 'City E', 'Single', 'Single', '', twoDaysLater.toISOString(), fiveDaysLater.toISOString(), 'Booked', 350, 50, 31.5, 'Card', 1081.5, 'Late arrival', 'No', 'Yes', 45, demoGroupId1, now.toISOString(), 'Paid', 1081.5, '', '', ''],

    // Cancelled booking
    ['TKT014', '104', 'Guest 5', '+6666666666', 'guest5@test.com', 'City F', 'Single', 'Single', '', tomorrow.toISOString(), threeDaysLater.toISOString(), 'Cancelled', 100, 0, 0, 'Card', 0, '', 'No', 'No', 0, '', twoDaysAgo.toISOString(), 'Refunded', 0, '', '', ''],

    // Walk-in booking (no email user)
    ['TKT015', '105', 'Guest 6', '+7777777777', 'guest6@test.com', 'City G', 'Married', 'Couple', '2 Adults', now.toISOString(), tomorrow.toISOString(), 'Booked', 100, 0, 15, 'Cash', 115, 'Last minute booking', 'No', 'No', 0, '', now.toISOString(), 'Paid', 115, '', '', '']
  ];

  bookingsData.forEach(row => bookingsSheet.appendRow(row));
  bookingsSheet.getRange(1, 1, 1, 28).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');

  // ============================================
  // STEP 6: WAITLIST SHEET (8 Entries)
  // ============================================
  let waitlistSheet = ss.insertSheet(WAITLIST_SHEET_NAME);
  waitlistSheet.appendRow([
    'Waitlist ID', 'Guest Name', 'Phone', 'Email', 'Preferred Room Type',
    'Requested Check-in', 'Requested Check-out', 'Number of Rooms',
    'Special Requests', 'Status', 'Created At', 'Notes'
  ]);

  const waitlistData = [
    // User1 waitlist entries
    ['WL001', 'User 1', '+1111111111', 'user1@test.com', 'Suite', nextMonth.toISOString(), new Date(nextMonth.getTime() + 5 * 86400000).toISOString(), 1, 'Birthday celebration', 'Waiting', now.toISOString(), ''],
    ['WL002', 'User 1', '+1111111111', 'user1@test.com', 'Executive', new Date(nextMonth.getTime() + 15 * 86400000).toISOString(), new Date(nextMonth.getTime() + 20 * 86400000).toISOString(), 2, 'Family reunion', 'Waiting', yesterday.toISOString(), ''],

    // User2 waitlist entries
    ['WL003', 'User 2', '+2222222222', 'user2@test.com', 'Deluxe', new Date(nextMonth.getTime() + 7 * 86400000).toISOString(), new Date(nextMonth.getTime() + 10 * 86400000).toISOString(), 1, 'Connecting rooms if possible', 'Contacted', twoDaysAgo.toISOString(), 'Called - will confirm tomorrow'],

    // User3 waitlist entries
    ['WL004', 'User 3', '+3333333333', 'user3@test.com', 'Suite', nextMonth.toISOString(), new Date(nextMonth.getTime() + 3 * 86400000).toISOString(), 1, '', 'Waiting', now.toISOString(), ''],

    // User4 waitlist entries
    ['WL005', 'User 4', '+4444444444', 'user4@test.com', 'Executive', new Date(nextMonth.getTime() + 10 * 86400000).toISOString(), new Date(nextMonth.getTime() + 14 * 86400000).toISOString(), 1, 'Business trip extension', 'Waiting', yesterday.toISOString(), ''],

    // External waitlist entries
    ['WL006', 'External 1', '+8888888881', 'external1@test.com', 'Standard', nextMonth.toISOString(), new Date(nextMonth.getTime() + 2 * 86400000).toISOString(), 3, 'Group of friends', 'Waiting', now.toISOString(), ''],
    ['WL007', 'External 2', '+8888888882', 'external2@test.com', 'Deluxe', new Date(nextMonth.getTime() + 5 * 86400000).toISOString(), new Date(nextMonth.getTime() + 8 * 86400000).toISOString(), 2, 'Honeymoon trip', 'Contacted', threeDaysAgo.toISOString(), 'Sent email with availability'],
    ['WL008', 'External 3', '+8888888883', 'external3@test.com', 'Suite', new Date(nextMonth.getTime() + 20 * 86400000).toISOString(), new Date(nextMonth.getTime() + 25 * 86400000).toISOString(), 1, 'Conference attendance', 'Booked', twoDaysAgo.toISOString(), 'Converted to TKT booking']
  ];

  waitlistData.forEach(row => waitlistSheet.appendRow(row));
  waitlistSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');

  // ============================================
  // STEP 7: LOGS SHEET (20 Activity Entries)
  // ============================================
  let logsSheet = ss.insertSheet(LOGS_SHEET_NAME);
  logsSheet.appendRow(['Timestamp', 'User', 'Action', 'Details']);

  const logsData = [
    [now.toISOString(), 'SYSTEM', 'SETUP', 'Demo data initialized with comprehensive test data'],
    [new Date(now.getTime() - 300000).toISOString(), 'admin1@test.com', 'LOGIN', 'Admin logged in successfully'],
    [new Date(now.getTime() - 600000).toISOString(), 'admin1@test.com', 'GROUP_BOOKING_CREATED', 'Group ID: ' + demoGroupId1 + ', Rooms: 3'],
    [new Date(now.getTime() - 900000).toISOString(), 'user1@test.com', 'LOGIN', 'User logged in successfully'],
    [new Date(now.getTime() - 1200000).toISOString(), 'user1@test.com', 'BOOKING_CREATED', 'Ticket: TKT001, Room: 101'],
    [new Date(now.getTime() - 1500000).toISOString(), 'user1@test.com', 'FOOD_ORDER', 'Order: ORD001, Room: 101, Amount: $45'],
    [new Date(now.getTime() - 1800000).toISOString(), 'user1@test.com', 'CLEANING_REQUESTED', 'Request: CLN001, Room: 101'],
    [new Date(now.getTime() - 2100000).toISOString(), 'food1@test.com', 'LOGIN', 'Food staff logged in'],
    [new Date(now.getTime() - 2400000).toISOString(), 'food1@test.com', 'FOOD_ORDER_COMPLETED', 'Order: ORD002 marked complete'],
    [new Date(now.getTime() - 2700000).toISOString(), 'cleaner1@test.com', 'LOGIN', 'Cleaner logged in'],
    [new Date(now.getTime() - 3000000).toISOString(), 'cleaner1@test.com', 'CLEANING_COMPLETED', 'Request: CLN002 marked complete'],
    [new Date(now.getTime() - 3600000).toISOString(), 'user2@test.com', 'LOGIN', 'User logged in successfully'],
    [new Date(now.getTime() - 4200000).toISOString(), 'user2@test.com', 'BOOKING_CREATED', 'Ticket: TKT004, Room: 102'],
    [new Date(now.getTime() - 4800000).toISOString(), 'admin1@test.com', 'ROOM_STATUS_UPDATE', 'Room 109 set to Maintenance'],
    [new Date(now.getTime() - 5400000).toISOString(), 'admin1@test.com', 'PAYMENT_RECORDED', 'Transaction: TXN001, Amount: $705'],
    [new Date(now.getTime() - 7200000).toISOString(), 'user3@test.com', 'LOGIN', 'User logged in successfully'],
    [new Date(now.getTime() - 10800000).toISOString(), 'user3@test.com', 'WAITLIST_JOINED', 'Waitlist: WL004 created'],
    [new Date(now.getTime() - 14400000).toISOString(), 'admin2@test.com', 'LOGIN', 'Admin 2 logged in'],
    [new Date(now.getTime() - 18000000).toISOString(), 'admin2@test.com', 'USER_CREATED', 'New user: user4@test.com created'],
    [new Date(now.getTime() - 21600000).toISOString(), 'admin1@test.com', 'QUOTE_CREATED', 'Quote created for User 1 - 2 rooms, $772.50'],
    [new Date(now.getTime() - 25200000).toISOString(), 'admin1@test.com', 'QUOTE_CREATED', 'Quote created for User 2 - Suite honeymoon package, $1,682.00'],
    [new Date(now.getTime() - 28800000).toISOString(), 'admin1@test.com', 'QUOTE_CONVERTED', 'Quote converted to Invoice for User 4 - $3,870.00'],
    [new Date(now.getTime() - 32400000).toISOString(), 'admin1@test.com', 'INVOICE_CREATED', 'Invoice created for User 1 - $881.50'],
    [new Date(now.getTime() - 36000000).toISOString(), 'admin1@test.com', 'INVOICE_PAID', 'Invoice paid by External 2 - $1,408.00 via Card'],
    [new Date(now.getTime() - 86400000).toISOString(), 'SYSTEM', 'DAILY_BACKUP', 'Automatic backup completed']
  ];

  logsData.forEach(row => logsSheet.appendRow(row));
  logsSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  logsSheet.setColumnWidths(1, 4, 200);

  // ============================================
  // STEP 8: PAYMENT METHODS SHEET (6 Methods)
  // ============================================
  let paymentMethodsSheet = ss.insertSheet(PAYMENT_METHODS_SHEET_NAME);
  paymentMethodsSheet.appendRow(['ID', 'Method Name', 'Description', 'Account Name', 'Bank Name', 'Account No', 'QR Code', 'Status', 'Created At']);

  const paymentMethodsData = [
    ['PM001', 'Cash', 'Cash payment at front desk', '', '', '', '', 'Active', now.toISOString()],
    ['PM002', 'Credit/Debit Card', 'Visa, MasterCard, Amex accepted', '', '', '', '', 'Active', now.toISOString()],
    ['PM003', 'Bank Transfer', 'Direct bank transfer', 'Grand Hotel LLC', 'First National Bank', '1234567890123', '', 'Active', now.toISOString()],
    ['PM004', 'JazzCash', 'Mobile wallet payment', 'Grand Hotel', 'JazzCash', '03001234567', '', 'Active', now.toISOString()],
    ['PM005', 'EasyPaisa', 'Mobile wallet payment', 'Grand Hotel', 'EasyPaisa', '03009876543', '', 'Active', now.toISOString()],
    ['PM006', 'PayPal', 'Online payment', 'hotel@grandhotel.com', 'PayPal', '', '', 'Inactive', now.toISOString()]
  ];

  paymentMethodsData.forEach(row => paymentMethodsSheet.appendRow(row));
  paymentMethodsSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  paymentMethodsSheet.setColumnWidths(1, 9, 130);

  // ============================================
  // STEP 9: TRANSACTIONS SHEET (15 Transactions across 3 days)
  // ============================================
  let transactionsSheet = ss.insertSheet(TRANSACTIONS_SHEET_NAME);
  transactionsSheet.appendRow(['Date (ISO)', 'Transactions (JSON)']);

  const todayTransactions = [
    { txnId: 'TXN001', ticketId: 'TKT001', guestName: 'User 1', roomNo: '101', amount: 703.5, paymentMethod: 'Card', type: 'Full Payment', notes: 'Booking payment', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 300000).toISOString() },
    { txnId: 'TXN002', ticketId: 'TKT005', guestName: 'User 2', roomNo: '111', amount: 250, paymentMethod: 'Card', type: 'Partial Payment', notes: 'Deposit - 50%', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 1800000).toISOString() },
    { txnId: 'TXN003', ticketId: 'TKT009', guestName: 'User 4', roomNo: '117', amount: 1500, paymentMethod: 'Card', type: 'Partial Payment', notes: 'Advance payment', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 3600000).toISOString() },
    { txnId: 'TXN004', ticketId: 'TKT011', guestName: 'Corp User 1', roomNo: '118', amount: 1545, paymentMethod: 'Card', type: 'Full Payment', notes: 'Corporate booking', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 5400000).toISOString() },
    { txnId: 'TXN005', ticketId: 'TKT015', guestName: 'Guest 6', roomNo: '105', amount: 115, paymentMethod: 'Cash', type: 'Full Payment', notes: 'Walk-in guest', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 7200000).toISOString() },
    { txnId: 'TXN006', ticketId: '', guestName: 'Customer 1', roomNo: '', amount: 85, paymentMethod: 'Cash', type: 'Other', notes: 'Restaurant - non-guest', createdBy: 'admin1@test.com', createdAt: new Date(now.getTime() - 9000000).toISOString() }
  ];

  const yesterdayTransactions = [
    { txnId: 'TXN007', ticketId: 'TKT002', guestName: 'User 1', roomNo: '103', amount: 509.25, paymentMethod: 'Cash', type: 'Full Payment', notes: 'Check-in payment', createdBy: 'admin1@test.com', createdAt: new Date(yesterday.getTime() + 36000000).toISOString() },
    { txnId: 'TXN008', ticketId: 'TKT006', guestName: 'User 2', roomNo: '116', amount: 402.5, paymentMethod: 'Cash', type: 'Full Payment', notes: '', createdBy: 'admin1@test.com', createdAt: new Date(yesterday.getTime() + 43200000).toISOString() },
    { txnId: 'TXN009', ticketId: 'TKT007', guestName: 'User 3', roomNo: '107', amount: 755.25, paymentMethod: 'Card', type: 'Full Payment', notes: 'Anniversary booking', createdBy: 'admin1@test.com', createdAt: new Date(yesterday.getTime() + 50400000).toISOString() },
    { txnId: 'TXN010', ticketId: '', guestName: 'Customer 2', roomNo: '', amount: 120, paymentMethod: 'Card', type: 'Other', notes: 'Spa services - guest', createdBy: 'admin1@test.com', createdAt: new Date(yesterday.getTime() + 54000000).toISOString() }
  ];

  const twoDaysAgoTransactions = [
    { txnId: 'TXN011', ticketId: 'TKT003', guestName: 'User 1', roomNo: '106', amount: 172.5, paymentMethod: 'Card', type: 'Full Payment', notes: '', createdBy: 'admin1@test.com', createdAt: new Date(twoDaysAgo.getTime() + 36000000).toISOString() },
    { txnId: 'TXN012', ticketId: 'TKT010', guestName: 'User 4', roomNo: '108', amount: 461, paymentMethod: 'Cash', type: 'Full Payment', notes: '', createdBy: 'admin2@test.com', createdAt: new Date(twoDaysAgo.getTime() + 43200000).toISOString() },
    { txnId: 'TXN013', ticketId: 'TKT012', guestName: 'Corp User 2', roomNo: '119', amount: 1545, paymentMethod: 'Card', type: 'Full Payment', notes: 'Corporate', createdBy: 'admin1@test.com', createdAt: new Date(twoDaysAgo.getTime() + 50400000).toISOString() },
    { txnId: 'TXN014', ticketId: 'TKT013', guestName: 'Corp User 3', roomNo: '120', amount: 1081.5, paymentMethod: 'Card', type: 'Full Payment', notes: 'Corporate', createdBy: 'admin1@test.com', createdAt: new Date(twoDaysAgo.getTime() + 54000000).toISOString() },
    { txnId: 'TXN015', ticketId: '', guestName: 'Service 1', roomNo: '103', amount: 35, paymentMethod: 'Room Bill', type: 'Other', notes: 'Laundry for Room 103', createdBy: 'admin1@test.com', createdAt: new Date(twoDaysAgo.getTime() + 57600000).toISOString() }
  ];

  transactionsSheet.appendRow([todayDateISO, JSON.stringify(todayTransactions)]);
  transactionsSheet.appendRow([yesterdayDateISO, JSON.stringify(yesterdayTransactions)]);
  transactionsSheet.appendRow([twoDaysAgoDateISO, JSON.stringify(twoDaysAgoTransactions)]);
  transactionsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  transactionsSheet.setColumnWidth(1, 220);
  transactionsSheet.setColumnWidth(2, 800);

  // ============================================
  // STEP 10: FOOD MENU SHEET (12 Items - Various Categories)
  // ============================================
  let foodMenuSheet = ss.insertSheet(FOOD_MENU_SHEET_NAME);
  foodMenuSheet.appendRow(['Item ID', 'Name', 'Description', 'Category', 'Price', 'Image', 'Stock', 'Status', 'Created At']);

  const foodMenuData = [
    // Main Course
    ['FOOD001', 'Grilled Chicken', 'Herb-marinated grilled chicken breast with vegetables', 'Main Course', 18, '', 30, 'Available', now.toISOString()],
    ['FOOD002', 'Beef Steak', 'Premium ribeye steak with mushroom sauce', 'Main Course', 35, '', 20, 'Available', now.toISOString()],
    ['FOOD003', 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 'Main Course', 16, '', 25, 'Available', now.toISOString()],
    ['FOOD004', 'Fish & Chips', 'Beer-battered fish with crispy fries', 'Main Course', 20, '', 15, 'Available', now.toISOString()],
    // Appetizers
    ['FOOD005', 'Caesar Salad', 'Fresh romaine with caesar dressing and croutons', 'Appetizer', 12, '', 40, 'Available', now.toISOString()],
    ['FOOD006', 'Soup of the Day', 'Chef special soup served with bread', 'Appetizer', 8, '', 50, 'Available', now.toISOString()],
    ['FOOD007', 'Spring Rolls', 'Crispy vegetable spring rolls with dipping sauce', 'Appetizer', 10, '', 35, 'Available', now.toISOString()],
    // Desserts
    ['FOOD008', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center', 'Dessert', 9, '', 20, 'Available', now.toISOString()],
    ['FOOD009', 'Ice Cream Sundae', 'Three scoops with toppings and whipped cream', 'Dessert', 7, '', 100, 'Available', now.toISOString()],
    // Beverages
    ['FOOD010', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 'Beverages', 5, '', 80, 'Available', now.toISOString()],
    ['FOOD011', 'Coffee', 'Premium arabica coffee', 'Beverages', 4, '', 200, 'Available', now.toISOString()],
    ['FOOD012', 'Mineral Water', 'Bottled mineral water 500ml', 'Beverages', 2, '', 500, 'Available', now.toISOString()],
    // Out of stock item
    ['FOOD013', 'Lobster Thermidor', 'Classic French lobster dish', 'Main Course', 55, '', 0, 'Out of Stock', now.toISOString()]
  ];

  foodMenuData.forEach(row => foodMenuSheet.appendRow(row));
  foodMenuSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  foodMenuSheet.setColumnWidths(1, 9, 130);

  // ============================================
  // STEP 11: FOOD ORDERS SHEET (15 Orders across 3 days)
  // For FoodStaff: Pending orders to complete
  // For FoodStaff History: Completed orders
  // For User: Their order history
  // ============================================
  let foodOrdersSheet = ss.insertSheet(FOOD_ORDERS_SHEET_NAME);
  foodOrdersSheet.appendRow(['Date', 'Orders JSON']);

  const todayFoodOrders = [
    // PENDING orders for FoodStaff to complete (Floor 1)
    { orderId: 'ORD001', roomNo: '101', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD001', name: 'Grilled Chicken', price: 18, qty: 2 }, { itemId: 'FOOD010', name: 'Fresh Orange Juice', price: 5, qty: 2 }], totalAmount: 46, paymentType: 'Room Bill', status: 'Pending', completedBy: '', completedAt: '', notes: 'No onions please', createdAt: new Date(now.getTime() - 300000).toISOString() },
    { orderId: 'ORD002', roomNo: '103', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD006', name: 'Soup of the Day', price: 8, qty: 1 }, { itemId: 'FOOD003', name: 'Pasta Carbonara', price: 16, qty: 1 }], totalAmount: 24, paymentType: 'Cash', status: 'Pending', completedBy: '', completedAt: '', notes: '', createdAt: new Date(now.getTime() - 900000).toISOString() },
    { orderId: 'ORD003', roomNo: '106', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD011', name: 'Coffee', price: 4, qty: 3 }], totalAmount: 12, paymentType: 'Room Bill', status: 'Pending', completedBy: '', completedAt: '', notes: 'Extra sugar', createdAt: new Date(now.getTime() - 1500000).toISOString() },

    // PENDING orders for FoodStaff2 (Floor 2)
    { orderId: 'ORD004', roomNo: '111', guestName: 'User 2', guestEmail: 'user2@test.com', items: [{ itemId: 'FOOD002', name: 'Beef Steak', price: 35, qty: 1 }, { itemId: 'FOOD005', name: 'Caesar Salad', price: 12, qty: 1 }], totalAmount: 47, paymentType: 'Card', status: 'Pending', completedBy: '', completedAt: '', notes: 'Medium rare steak', createdAt: new Date(now.getTime() - 600000).toISOString() },
    { orderId: 'ORD005', roomNo: '116', guestName: 'User 2', guestEmail: 'user2@test.com', items: [{ itemId: 'FOOD008', name: 'Chocolate Lava Cake', price: 9, qty: 2 }, { itemId: 'FOOD009', name: 'Ice Cream Sundae', price: 7, qty: 2 }], totalAmount: 32, paymentType: 'Room Bill', status: 'Pending', completedBy: '', completedAt: '', notes: '', createdAt: new Date(now.getTime() - 1200000).toISOString() },

    // COMPLETED orders (today)
    { orderId: 'ORD006', roomNo: '102', guestName: 'User 2', guestEmail: 'user2@test.com', items: [{ itemId: 'FOOD004', name: 'Fish & Chips', price: 20, qty: 1 }], totalAmount: 20, paymentType: 'Cash', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(now.getTime() - 3600000).toISOString(), notes: '', createdAt: new Date(now.getTime() - 7200000).toISOString() },
    { orderId: 'ORD007', roomNo: '107', guestName: 'User 3', guestEmail: 'user3@test.com', items: [{ itemId: 'FOOD001', name: 'Grilled Chicken', price: 18, qty: 1 }, { itemId: 'FOOD011', name: 'Coffee', price: 4, qty: 2 }], totalAmount: 26, paymentType: 'Room Bill', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(now.getTime() - 5400000).toISOString(), notes: '', createdAt: new Date(now.getTime() - 9000000).toISOString() }
  ];

  const yesterdayFoodOrders = [
    { orderId: 'ORD008', roomNo: '101', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD003', name: 'Pasta Carbonara', price: 16, qty: 2 }, { itemId: 'FOOD010', name: 'Fresh Orange Juice', price: 5, qty: 2 }], totalAmount: 42, paymentType: 'Room Bill', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(yesterday.getTime() + 45000000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 36000000).toISOString() },
    { orderId: 'ORD009', roomNo: '116', guestName: 'User 2', guestEmail: 'user2@test.com', items: [{ itemId: 'FOOD002', name: 'Beef Steak', price: 35, qty: 1 }], totalAmount: 35, paymentType: 'Cash', status: 'Completed', completedBy: 'food2@test.com', completedAt: new Date(yesterday.getTime() + 50400000).toISOString(), notes: 'Well done', createdAt: new Date(yesterday.getTime() + 43200000).toISOString() },
    { orderId: 'ORD010', roomNo: '111', guestName: 'User 2', guestEmail: 'user2@test.com', items: [{ itemId: 'FOOD007', name: 'Spring Rolls', price: 10, qty: 2 }, { itemId: 'FOOD006', name: 'Soup of the Day', price: 8, qty: 1 }], totalAmount: 28, paymentType: 'Room Bill', status: 'Completed', completedBy: 'food2@test.com', completedAt: new Date(yesterday.getTime() + 54000000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 50400000).toISOString() },
    { orderId: 'ORD011', roomNo: '103', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD008', name: 'Chocolate Lava Cake', price: 9, qty: 1 }, { itemId: 'FOOD011', name: 'Coffee', price: 4, qty: 1 }], totalAmount: 13, paymentType: 'Cash', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(yesterday.getTime() + 61200000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 57600000).toISOString() }
  ];

  const twoDaysAgoFoodOrders = [
    { orderId: 'ORD012', roomNo: '106', guestName: 'User 1', guestEmail: 'user1@test.com', items: [{ itemId: 'FOOD001', name: 'Grilled Chicken', price: 18, qty: 1 }, { itemId: 'FOOD005', name: 'Caesar Salad', price: 12, qty: 1 }], totalAmount: 30, paymentType: 'Room Bill', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(twoDaysAgo.getTime() + 43200000).toISOString(), notes: '', createdAt: new Date(twoDaysAgo.getTime() + 36000000).toISOString() },
    { orderId: 'ORD013', roomNo: '108', guestName: 'User 4', guestEmail: 'user4@test.com', items: [{ itemId: 'FOOD004', name: 'Fish & Chips', price: 20, qty: 1 }, { itemId: 'FOOD012', name: 'Mineral Water', price: 2, qty: 2 }], totalAmount: 24, paymentType: 'Cash', status: 'Completed', completedBy: 'food1@test.com', completedAt: new Date(twoDaysAgo.getTime() + 50400000).toISOString(), notes: '', createdAt: new Date(twoDaysAgo.getTime() + 43200000).toISOString() },
    { orderId: 'ORD014', roomNo: '117', guestName: 'User 4', guestEmail: 'user4@test.com', items: [{ itemId: 'FOOD009', name: 'Ice Cream Sundae', price: 7, qty: 3 }], totalAmount: 21, paymentType: 'Room Bill', status: 'Completed', completedBy: 'food2@test.com', completedAt: new Date(twoDaysAgo.getTime() + 57600000).toISOString(), notes: 'Extra chocolate sauce', createdAt: new Date(twoDaysAgo.getTime() + 54000000).toISOString() }
  ];

  foodOrdersSheet.appendRow([todayDateISO, JSON.stringify(todayFoodOrders)]);
  foodOrdersSheet.appendRow([yesterdayDateISO, JSON.stringify(yesterdayFoodOrders)]);
  foodOrdersSheet.appendRow([twoDaysAgoDateISO, JSON.stringify(twoDaysAgoFoodOrders)]);
  foodOrdersSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  foodOrdersSheet.setColumnWidth(1, 220);
  foodOrdersSheet.setColumnWidth(2, 800);

  // ============================================
  // STEP 12: CLEANING REQUESTS SHEET (15 Requests across 3 days)
  // For Cleaner: Pending requests to complete
  // For Cleaner History: Completed requests
  // For User: Their request history
  // ============================================
  let cleaningRequestsSheet = ss.insertSheet(CLEANING_REQUESTS_SHEET_NAME);
  cleaningRequestsSheet.appendRow(['Date', 'Requests JSON']);

  const todayCleaningRequests = [
    // PENDING requests for Cleaner (Floor 1) - Various priorities
    { requestId: 'CLN001', roomNo: '101', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'General Room Cleaning', priority: 'Normal', status: 'Pending', completedBy: '', completedAt: '', notes: '', createdAt: new Date(now.getTime() - 300000).toISOString() },
    { requestId: 'CLN002', roomNo: '103', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'Change Bed Sheets', priority: 'High', status: 'Pending', completedBy: '', completedAt: '', notes: 'Guest has allergies - use hypoallergenic sheets', createdAt: new Date(now.getTime() - 900000).toISOString() },
    { requestId: 'CLN003', roomNo: '106', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'Bathroom Cleaning', priority: 'Urgent', status: 'Pending', completedBy: '', completedAt: '', notes: 'Water on floor - slip hazard', createdAt: new Date(now.getTime() - 600000).toISOString() },
    { requestId: 'CLN004', roomNo: '102', guestName: 'User 2', guestEmail: 'user2@test.com', reason: 'Change Towels', priority: 'Low', status: 'Pending', completedBy: '', completedAt: '', notes: '', createdAt: new Date(now.getTime() - 1500000).toISOString() },

    // PENDING requests for Cleaner2 (Floor 2)
    { requestId: 'CLN005', roomNo: '111', guestName: 'User 2', guestEmail: 'user2@test.com', reason: 'General Room Cleaning', priority: 'Normal', status: 'Pending', completedBy: '', completedAt: '', notes: '', createdAt: new Date(now.getTime() - 1200000).toISOString() },
    { requestId: 'CLN006', roomNo: '116', guestName: 'User 2', guestEmail: 'user2@test.com', reason: 'Spill Cleanup', priority: 'Urgent', status: 'Pending', completedBy: '', completedAt: '', notes: 'Coffee spill on carpet near desk', createdAt: new Date(now.getTime() - 400000).toISOString() },
    { requestId: 'CLN007', roomNo: '117', guestName: 'User 4', guestEmail: 'user4@test.com', reason: 'Restock Amenities', priority: 'Normal', status: 'Pending', completedBy: '', completedAt: '', notes: 'Need more shampoo and soap', createdAt: new Date(now.getTime() - 1800000).toISOString() },

    // COMPLETED requests (today)
    { requestId: 'CLN008', roomNo: '107', guestName: 'User 3', guestEmail: 'user3@test.com', reason: 'General Room Cleaning', priority: 'Normal', status: 'Completed', completedBy: 'cleaner1@test.com', completedAt: new Date(now.getTime() - 3600000).toISOString(), notes: '', createdAt: new Date(now.getTime() - 7200000).toISOString() },
    { requestId: 'CLN009', roomNo: '112', guestName: 'User 3', guestEmail: 'user3@test.com', reason: 'Change Bed Sheets', priority: 'High', status: 'Completed', completedBy: 'cleaner2@test.com', completedAt: new Date(now.getTime() - 5400000).toISOString(), notes: '', createdAt: new Date(now.getTime() - 9000000).toISOString() }
  ];

  const yesterdayCleaningRequests = [
    { requestId: 'CLN010', roomNo: '101', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'General Room Cleaning', priority: 'Normal', status: 'Completed', completedBy: 'cleaner1@test.com', completedAt: new Date(yesterday.getTime() + 45000000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 36000000).toISOString() },
    { requestId: 'CLN011', roomNo: '103', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'Change Towels', priority: 'Low', status: 'Completed', completedBy: 'cleaner1@test.com', completedAt: new Date(yesterday.getTime() + 50400000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 43200000).toISOString() },
    { requestId: 'CLN012', roomNo: '116', guestName: 'User 2', guestEmail: 'user2@test.com', reason: 'Bathroom Cleaning', priority: 'High', status: 'Completed', completedBy: 'cleaner2@test.com', completedAt: new Date(yesterday.getTime() + 54000000).toISOString(), notes: '', createdAt: new Date(yesterday.getTime() + 50400000).toISOString() },
    { requestId: 'CLN013', roomNo: '111', guestName: 'User 2', guestEmail: 'user2@test.com', reason: 'Restock Amenities', priority: 'Normal', status: 'Completed', completedBy: 'cleaner2@test.com', completedAt: new Date(yesterday.getTime() + 61200000).toISOString(), notes: 'Added extra toiletries', createdAt: new Date(yesterday.getTime() + 57600000).toISOString() }
  ];

  const twoDaysAgoCleaningRequests = [
    { requestId: 'CLN014', roomNo: '106', guestName: 'User 1', guestEmail: 'user1@test.com', reason: 'General Room Cleaning', priority: 'Normal', status: 'Completed', completedBy: 'cleaner1@test.com', completedAt: new Date(twoDaysAgo.getTime() + 43200000).toISOString(), notes: '', createdAt: new Date(twoDaysAgo.getTime() + 36000000).toISOString() },
    { requestId: 'CLN015', roomNo: '108', guestName: 'User 4', guestEmail: 'user4@test.com', reason: 'Spill Cleanup', priority: 'Urgent', status: 'Completed', completedBy: 'cleaner1@test.com', completedAt: new Date(twoDaysAgo.getTime() + 39600000).toISOString(), notes: 'Wine spill on carpet - deep cleaned', createdAt: new Date(twoDaysAgo.getTime() + 37800000).toISOString() },
    { requestId: 'CLN016', roomNo: '117', guestName: 'User 4', guestEmail: 'user4@test.com', reason: 'Change Bed Sheets', priority: 'High', status: 'Completed', completedBy: 'cleaner2@test.com', completedAt: new Date(twoDaysAgo.getTime() + 54000000).toISOString(), notes: '', createdAt: new Date(twoDaysAgo.getTime() + 50400000).toISOString() }
  ];

  cleaningRequestsSheet.appendRow([todayDateISO, JSON.stringify(todayCleaningRequests)]);
  cleaningRequestsSheet.appendRow([yesterdayDateISO, JSON.stringify(yesterdayCleaningRequests)]);
  cleaningRequestsSheet.appendRow([twoDaysAgoDateISO, JSON.stringify(twoDaysAgoCleaningRequests)]);
  cleaningRequestsSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  cleaningRequestsSheet.setColumnWidth(1, 220);
  cleaningRequestsSheet.setColumnWidth(2, 800);

  // ============================================
  // STEP 13: QUOTES SHEET (8 Quotes across 3 days)
  // ============================================
  let quotesSheet = ss.insertSheet(QUOTES_SHEET_NAME);
  quotesSheet.appendRow(['Date', 'Quotes JSON']);

  const todayQuotes = [
    {
      quoteId: 'QT' + (now.getTime() - 100000),
      guestName: 'User 1', guestEmail: 'user1@test.com', guestPhone: '+1111111111',
      rooms: [
        { roomNo: '101', roomType: 'Standard', rate: 100, nights: 3, amount: 300 },
        { roomNo: '102', roomType: 'Standard', rate: 100, nights: 3, amount: 300 }
      ],
      services: [
        { name: 'Airport Pickup', amount: 50 },
        { name: 'Breakfast Package', amount: 75 }
      ],
      subtotal: 725, taxRate: 10, taxAmount: 72.5, discount: 25, totalAmount: 772.5,
      notes: 'Family trip - need adjoining rooms', status: 'Draft',
      validUntil: fiveDaysLater.toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 600000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: ''
    },
    {
      quoteId: 'QT' + (now.getTime() - 200000),
      guestName: 'User 2', guestEmail: 'user2@test.com', guestPhone: '+2222222222',
      rooms: [
        { roomNo: '111', roomType: 'Suite', rate: 250, nights: 5, amount: 1250 }
      ],
      services: [
        { name: 'Spa Package', amount: 200 },
        { name: 'Airport Pickup', amount: 50 },
        { name: 'City Tour', amount: 120 }
      ],
      subtotal: 1620, taxRate: 10, taxAmount: 162, discount: 100, totalAmount: 1682,
      notes: 'VIP guest - honeymoon package', status: 'Sent',
      validUntil: nextWeek.toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 1800000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: ''
    },
    {
      quoteId: 'QT' + (now.getTime() - 300000),
      guestName: 'Corp User 1', guestEmail: 'corp1@test.com', guestPhone: '+5555555551',
      rooms: [
        { roomNo: '118', roomType: 'Executive', rate: 350, nights: 4, amount: 1400 },
        { roomNo: '119', roomType: 'Executive', rate: 350, nights: 4, amount: 1400 },
        { roomNo: '120', roomType: 'Executive', rate: 350, nights: 4, amount: 1400 }
      ],
      services: [
        { name: 'Conference Room (Full Day)', amount: 500 },
        { name: 'Catering Package', amount: 350 }
      ],
      subtotal: 5050, taxRate: 10, taxAmount: 505, discount: 250, totalAmount: 5305,
      notes: 'Corporate retreat - 3 rooms + conference', status: 'Accepted',
      validUntil: tenDaysLater.toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 3600000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: ''
    }
  ];

  const yesterdayQuotes = [
    {
      quoteId: 'QT' + (yesterday.getTime() - 100000),
      guestName: 'User 3', guestEmail: 'user3@test.com', guestPhone: '+3333333333',
      rooms: [
        { roomNo: '107', roomType: 'Deluxe', rate: 150, nights: 7, amount: 1050 }
      ],
      services: [
        { name: 'Late Checkout', amount: 45 },
        { name: 'Breakfast Package', amount: 105 }
      ],
      subtotal: 1200, taxRate: 10, taxAmount: 120, discount: 0, totalAmount: 1320,
      notes: 'Anniversary celebration', status: 'Sent',
      validUntil: nextWeek.toISOString().split('T')[0],
      createdAt: new Date(yesterday.getTime() + 36000000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: ''
    },
    {
      quoteId: 'QT' + (yesterday.getTime() - 200000),
      guestName: 'User 4', guestEmail: 'user4@test.com', guestPhone: '+4444444444',
      rooms: [
        { roomNo: '117', roomType: 'Executive', rate: 350, nights: 10, amount: 3500 }
      ],
      services: [
        { name: 'Airport Pickup', amount: 50 },
        { name: 'Laundry Package', amount: 150 }
      ],
      subtotal: 3700, taxRate: 10, taxAmount: 370, discount: 200, totalAmount: 3870,
      notes: 'Extended business trip', status: 'Converted',
      validUntil: fiveDaysLater.toISOString().split('T')[0],
      createdAt: new Date(yesterday.getTime() + 43200000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: 'INV' + (yesterday.getTime() - 200000)
    }
  ];

  const twoDaysAgoQuotes = [
    {
      quoteId: 'QT' + (twoDaysAgo.getTime() - 100000),
      guestName: 'External 1', guestEmail: 'external1@test.com', guestPhone: '+8888888881',
      rooms: [
        { roomNo: '104', roomType: 'Standard', rate: 100, nights: 2, amount: 200 },
        { roomNo: '105', roomType: 'Standard', rate: 100, nights: 2, amount: 200 },
        { roomNo: '113', roomType: 'Suite', rate: 250, nights: 2, amount: 500 }
      ],
      services: [
        { name: 'BBQ Night', amount: 300 }
      ],
      subtotal: 1200, taxRate: 10, taxAmount: 120, discount: 50, totalAmount: 1270,
      notes: 'Group of friends - weekend getaway', status: 'Draft',
      validUntil: threeDaysLater.toISOString().split('T')[0],
      createdAt: new Date(twoDaysAgo.getTime() + 36000000).toISOString(), createdBy: 'admin2@test.com',
      convertedToInvoice: ''
    },
    {
      quoteId: 'QT' + (twoDaysAgo.getTime() - 200000),
      guestName: 'External 2', guestEmail: 'external2@test.com', guestPhone: '+8888888882',
      rooms: [
        { roomNo: '106', roomType: 'Deluxe', rate: 150, nights: 5, amount: 750 }
      ],
      services: [
        { name: 'Spa Couples Package', amount: 250 },
        { name: 'Airport Pickup & Drop', amount: 100 },
        { name: 'Romantic Dinner', amount: 180 }
      ],
      subtotal: 1280, taxRate: 10, taxAmount: 128, discount: 0, totalAmount: 1408,
      notes: 'Honeymoon package inquiry', status: 'Converted',
      validUntil: tomorrow.toISOString().split('T')[0],
      createdAt: new Date(twoDaysAgo.getTime() + 43200000).toISOString(), createdBy: 'admin1@test.com',
      convertedToInvoice: 'INV' + (twoDaysAgo.getTime() - 200000)
    }
  ];

  quotesSheet.appendRow([todayDateISO, JSON.stringify(todayQuotes)]);
  quotesSheet.appendRow([yesterdayDateISO, JSON.stringify(yesterdayQuotes)]);
  quotesSheet.appendRow([twoDaysAgoDateISO, JSON.stringify(twoDaysAgoQuotes)]);
  quotesSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  quotesSheet.setColumnWidth(1, 220);
  quotesSheet.setColumnWidth(2, 800);

  // ============================================
  // STEP 14: INVOICES SHEET (6 Invoices across 3 days)
  // ============================================
  let invoicesSheet = ss.insertSheet(INVOICES_SHEET_NAME);
  invoicesSheet.appendRow(['Date', 'Invoices JSON']);

  const todayInvoices = [
    {
      invoiceId: 'INV' + (now.getTime() - 100000),
      quoteId: '', guestName: 'User 1', guestEmail: 'user1@test.com', guestPhone: '+1111111111',
      rooms: [
        { roomNo: '101', roomType: 'Standard', rate: 100, nights: 7, amount: 700 }
      ],
      services: [
        { name: 'Extra Pillows', amount: 10 },
        { name: 'Breakfast Package', amount: 105 }
      ],
      subtotal: 815, taxRate: 10, taxAmount: 81.5, discount: 15, totalAmount: 881.5,
      notes: 'Standalone invoice - direct booking', status: 'Unpaid',
      paidAmount: 0, paymentMethod: '', dueDate: fiveDaysLater.toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 600000).toISOString(), createdBy: 'admin1@test.com'
    },
    {
      invoiceId: 'INV' + (now.getTime() - 200000),
      quoteId: '', guestName: 'User 2', guestEmail: 'user2@test.com', guestPhone: '+2222222222',
      rooms: [
        { roomNo: '111', roomType: 'Suite', rate: 250, nights: 2, amount: 500 },
        { roomNo: '116', roomType: 'Executive', rate: 350, nights: 1, amount: 350 }
      ],
      services: [
        { name: 'Airport Pickup', amount: 50 }
      ],
      subtotal: 900, taxRate: 10, taxAmount: 90, discount: 0, totalAmount: 990,
      notes: '', status: 'Partial',
      paidAmount: 500, paymentMethod: 'Card', dueDate: threeDaysLater.toISOString().split('T')[0],
      createdAt: new Date(now.getTime() - 1800000).toISOString(), createdBy: 'admin1@test.com'
    }
  ];

  const yesterdayInvoices = [
    {
      invoiceId: 'INV' + (yesterday.getTime() - 200000),
      quoteId: 'QT' + (yesterday.getTime() - 200000),
      guestName: 'User 4', guestEmail: 'user4@test.com', guestPhone: '+4444444444',
      rooms: [
        { roomNo: '117', roomType: 'Executive', rate: 350, nights: 10, amount: 3500 }
      ],
      services: [
        { name: 'Airport Pickup', amount: 50 },
        { name: 'Laundry Package', amount: 150 }
      ],
      subtotal: 3700, taxRate: 10, taxAmount: 370, discount: 200, totalAmount: 3870,
      notes: 'Converted from quote - extended business trip', status: 'Unpaid',
      paidAmount: 0, paymentMethod: '', dueDate: nextWeek.toISOString().split('T')[0],
      createdAt: new Date(yesterday.getTime() + 50400000).toISOString(), createdBy: 'admin1@test.com'
    },
    {
      invoiceId: 'INV' + (yesterday.getTime() - 300000),
      quoteId: '', guestName: 'User 3', guestEmail: 'user3@test.com', guestPhone: '+3333333333',
      rooms: [
        { roomNo: '112', roomType: 'Suite', rate: 250, nights: 5, amount: 1250 }
      ],
      services: [
        { name: 'Baby Cot', amount: 25 }
      ],
      subtotal: 1275, taxRate: 10, taxAmount: 127.5, discount: 0, totalAmount: 1402.5,
      notes: 'Family booking', status: 'Paid',
      paidAmount: 1402.5, paymentMethod: 'Bank Transfer', dueDate: yesterday.toISOString().split('T')[0],
      createdAt: new Date(yesterday.getTime() + 36000000).toISOString(), createdBy: 'admin1@test.com'
    }
  ];

  const twoDaysAgoInvoices = [
    {
      invoiceId: 'INV' + (twoDaysAgo.getTime() - 200000),
      quoteId: 'QT' + (twoDaysAgo.getTime() - 200000),
      guestName: 'External 2', guestEmail: 'external2@test.com', guestPhone: '+8888888882',
      rooms: [
        { roomNo: '106', roomType: 'Deluxe', rate: 150, nights: 5, amount: 750 }
      ],
      services: [
        { name: 'Spa Couples Package', amount: 250 },
        { name: 'Airport Pickup & Drop', amount: 100 },
        { name: 'Romantic Dinner', amount: 180 }
      ],
      subtotal: 1280, taxRate: 10, taxAmount: 128, discount: 0, totalAmount: 1408,
      notes: 'Converted from quote - honeymoon package', status: 'Paid',
      paidAmount: 1408, paymentMethod: 'Card', dueDate: yesterday.toISOString().split('T')[0],
      createdAt: new Date(twoDaysAgo.getTime() + 50400000).toISOString(), createdBy: 'admin1@test.com'
    },
    {
      invoiceId: 'INV' + (twoDaysAgo.getTime() - 300000),
      quoteId: '', guestName: 'Guest 5', guestEmail: 'guest5@test.com', guestPhone: '+6666666666',
      rooms: [
        { roomNo: '104', roomType: 'Standard', rate: 100, nights: 3, amount: 300 }
      ],
      services: [],
      subtotal: 300, taxRate: 10, taxAmount: 30, discount: 0, totalAmount: 330,
      notes: 'Cancelled due to guest no-show', status: 'Cancelled',
      paidAmount: 0, paymentMethod: '', dueDate: twoDaysAgo.toISOString().split('T')[0],
      createdAt: new Date(twoDaysAgo.getTime() + 36000000).toISOString(), createdBy: 'admin2@test.com'
    }
  ];

  invoicesSheet.appendRow([todayDateISO, JSON.stringify(todayInvoices)]);
  invoicesSheet.appendRow([yesterdayDateISO, JSON.stringify(yesterdayInvoices)]);
  invoicesSheet.appendRow([twoDaysAgoDateISO, JSON.stringify(twoDaysAgoInvoices)]);
  invoicesSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  invoicesSheet.setColumnWidth(1, 220);
  invoicesSheet.setColumnWidth(2, 800);

  // ============================================
  // STEP 15: CONTACT MESSAGES SHEET (8 Messages)
  // ============================================
  let contactMessagesSheet = ss.insertSheet(CONTACT_MESSAGES_SHEET_NAME);
  contactMessagesSheet.appendRow(['Message ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Created At', 'Notes']);

  const contactMessagesData = [
    ['MSG001', 'Contact 1', 'contact1@test.com', '+1234567890', 'Room Availability Inquiry', 'Hi, I am planning to visit next month. Do you have any executive rooms available from 15th to 20th?', 'New', now.toISOString(), ''],
    ['MSG002', 'Contact 2', 'contact2@test.com', '+1234567891', 'Wedding Venue', 'We are looking for a venue for a small wedding reception (50 guests). Do you offer event spaces?', 'Read', new Date(now.getTime() - 43200000).toISOString(), 'Forwarded to events team'],
    ['MSG003', 'Contact 3', 'contact3@test.com', '+1234567892', 'Positive Feedback', 'Just wanted to say thank you for the amazing service during my stay last week. The staff was incredibly helpful!', 'Replied', new Date(now.getTime() - 86400000).toISOString(), 'Sent thank you response'],
    ['MSG004', 'Contact 4', 'contact4@test.com', '+1234567893', 'Complaint - Noise Issue', 'During my stay in room 205, there was constant noise from the construction next door. Very disappointed.', 'In Progress', new Date(now.getTime() - 129600000).toISOString(), 'Offered 20% discount on next stay'],
    ['MSG005', 'Contact 5', 'contact5@test.com', '+1234567894', 'Corporate Rates', 'Our company frequently sends employees to your city. Can you provide information about corporate rates and contracts?', 'Contacted', new Date(now.getTime() - 172800000).toISOString(), 'Sent corporate rate sheet'],
    ['MSG006', 'Contact 6', 'contact6@test.com', '+1234567895', 'Lost Item', 'I think I left my laptop charger in room 108 during my checkout yesterday. Can someone check?', 'New', new Date(now.getTime() - 21600000).toISOString(), ''],
    ['MSG007', 'Contact 7', 'contact7@test.com', '+1234567896', 'Restaurant Menu', 'Do you have a vegetarian menu available at your restaurant? My family has dietary restrictions.', 'Replied', new Date(now.getTime() - 259200000).toISOString(), 'Sent menu with vegetarian options'],
    ['MSG008', 'Contact 8', 'contact8@test.com', '+1234567897', 'Spa Services', 'What spa services do you offer? Looking for couples massage packages.', 'New', new Date(now.getTime() - 3600000).toISOString(), '']
  ];

  contactMessagesData.forEach(row => contactMessagesSheet.appendRow(row));
  contactMessagesSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
  contactMessagesSheet.setColumnWidths(1, 9, 140);

  // ============================================
  // STEP 16: Delete temp sheet
  // ============================================
  ss.deleteSheet(tempSheet);

  SpreadsheetApp.flush();
  return {
    success: true,
    message: 'Demo data setup complete! Created comprehensive test data:\n' +
             '• 10 Users (2 Admin, 4 Guests, 2 FoodStaff, 2 Cleaners)\n' +
             '• 20 Rooms (Various types & statuses)\n' +
             '• 15 Bookings (Various statuses & payment states)\n' +
             '• 8 Waitlist entries\n' +
             '• 20 Activity logs\n' +
             '• 6 Payment methods\n' +
             '• 15 Transactions (3 days)\n' +
             '• 13 Food menu items\n' +
             '• 14 Food orders (Pending + Completed)\n' +
             '• 16 Cleaning requests (Pending + Completed)\n' +
             '• 8 Quotes (Draft, Sent, Accepted, Converted)\n' +
             '• 6 Invoices (Unpaid, Partial, Paid, Cancelled)\n' +
             '• 8 Contact messages'
  };
}

/***************************************************
 * LOGGING FUNCTION
 ***************************************************/
function logActivity(user, action, details) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let logsSheet = ss.getSheetByName(LOGS_SHEET_NAME);
    if (!logsSheet) {
      logsSheet = ss.insertSheet(LOGS_SHEET_NAME);
      logsSheet.appendRow(['Timestamp', 'User', 'Action', 'Details']);
    }
    logsSheet.appendRow([new Date().toISOString(), user, action, details]);
  } catch (e) {
    Logger.log('Logging error: ' + e.toString());
  }
}

/***************************************************
 * LOGIN LOGIC
 ***************************************************/
function checkLogin(username, password) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim();
      let storedPass = (data[i][LOGIN_PASSWORD_COL] || "").toString().trim();
      let storedRole = (data[i][LOGIN_ROLE_COL] || "").toString().trim().toLowerCase();

      if (storedUser === username && storedPass === password) {
        logActivity(username, 'LOGIN', 'User logged in successfully');
        return {
          success: true,
          message: "Login successful",
          role: data[i][LOGIN_ROLE_COL] // Return actual stored role (admin, user, FoodStaff, Cleaner)
        };
      }
    }
    return { success: false, message: "Invalid credentials", role: null };
  } catch (e) {
    return { success: false, message: e.toString(), role: null };
  }
}

function createUserIfNotExists(email, generatedPassword) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    Logger.log('Invalid email format: ' + email);
    return;
  }

  const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
  const data = loginSheet.getDataRange().getValues();

  let userExists = false;
  for (let i = 1; i < data.length; i++) {
    let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim();
    if (storedUser === email.trim()) {
      userExists = true;
      break;
    }
  }

  if (!userExists) {
    loginSheet.appendRow([email.trim(), generatedPassword, "user", '', '', '']); // Include AssignedRooms, FullName, and OTP columns
  }
}

/***************************************************
 * FORGOT PASSWORD - OTP via Email
 ***************************************************/

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to user's email
function sendPasswordResetOTP(email) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return { success: false, message: 'Invalid email format' };
    }

    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    let userRowIndex = -1;
    let userFullName = '';

    // Check if user exists
    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim();
      if (storedUser === email.trim()) {
        userRowIndex = i;
        userFullName = data[i][LOGIN_FULL_NAME_COL] || 'User';
        break;
      }
    }

    if (userRowIndex === -1) {
      return { success: false, message: 'Email not found in our system' };
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to Login sheet
    loginSheet.getRange(userRowIndex + 1, LOGIN_OTP_COL + 1).setValue(otp);
    SpreadsheetApp.flush();

    // Send OTP email
    const subject = 'Password Reset OTP - Hotel Management System';
    const body = `
Hello ${userFullName},

You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed:

OTP: ${otp}

This OTP is valid for one use only. Do not share this code with anyone.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Thank you,
Hotel Management Team
    `;

    MailApp.sendEmail({
      to: email.trim(),
      subject: subject,
      body: body
    });

    logActivity(email, 'PASSWORD_RESET_OTP_SENT', 'OTP sent to email for password reset');

    return {
      success: true,
      message: 'OTP has been sent to your email. Please check your inbox.'
    };
  } catch (e) {
    Logger.log(`Error in sendPasswordResetOTP: ${e.toString()}`);
    return { success: false, message: 'An error occurred: ' + e.message };
  }
}

// Verify OTP entered by user
function verifyPasswordResetOTP(email, otp) {
  try {
    if (!email || !otp) {
      return { success: false, message: 'Email and OTP are required' };
    }

    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    let userRowIndex = -1;
    let storedOTP = '';

    // Find user and get stored OTP
    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim();
      if (storedUser === email.trim()) {
        userRowIndex = i;
        storedOTP = (data[i][LOGIN_OTP_COL] || "").toString().trim();
        break;
      }
    }

    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    if (!storedOTP) {
      return { success: false, message: 'No OTP found. Please request a new OTP.' };
    }

    if (storedOTP !== otp.trim()) {
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    logActivity(email, 'PASSWORD_RESET_OTP_VERIFIED', 'OTP verified successfully');

    return { success: true, message: 'OTP verified successfully' };
  } catch (e) {
    Logger.log(`Error in verifyPasswordResetOTP: ${e.toString()}`);
    return { success: false, message: 'An error occurred: ' + e.message };
  }
}

// Reset password after OTP verification
function resetPassword(email, otp, newPassword) {
  try {
    if (!email || !otp || !newPassword) {
      return { success: false, message: 'Email, OTP, and new password are required' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long' };
    }

    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    let userRowIndex = -1;
    let storedOTP = '';

    // Find user and verify OTP again
    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim();
      if (storedUser === email.trim()) {
        userRowIndex = i;
        storedOTP = (data[i][LOGIN_OTP_COL] || "").toString().trim();
        break;
      }
    }

    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    if (!storedOTP || storedOTP !== otp.trim()) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Update password and clear OTP
    loginSheet.getRange(userRowIndex + 1, LOGIN_PASSWORD_COL + 1).setValue(newPassword);
    loginSheet.getRange(userRowIndex + 1, LOGIN_OTP_COL + 1).setValue(''); // Clear OTP after use
    SpreadsheetApp.flush();

    logActivity(email, 'PASSWORD_RESET_SUCCESS', 'Password reset successfully');

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    };
  } catch (e) {
    Logger.log(`Error in resetPassword: ${e.toString()}`);
    return { success: false, message: 'An error occurred: ' + e.message };
  }
}

/***************************************************
 * CREATE ACCOUNT - Public registration (default role: user)
 ***************************************************/
function createAccount(email, password, confirmPassword, fullName) {
  try {
    // Validate full name
    if (!fullName || !fullName.trim()) {
      return { success: false, message: 'Please enter your full name' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return { success: false, message: 'Please enter a valid email address' };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim().toLowerCase();
      if (storedUser === normalizedEmail) {
        return { success: false, message: 'An account with this email already exists' };
      }
    }

    // Create new user with 'user' role and full name
    // Columns: Username, Password, Role, AssignedRooms, FullName
    loginSheet.appendRow([email.trim(), password, 'user', '', fullName.trim()]);

    logActivity(email.trim(), 'REGISTER', `New user account created: ${fullName.trim()}`);

    return {
      success: true,
      message: 'Account created successfully! You can now login.'
    };
  } catch (e) {
    return { success: false, message: 'Error creating account: ' + e.toString() };
  }
}

/***************************************************
 * HELPER FUNCTIONS
 ***************************************************/
function generateTicketId() {
  const prefix = "TKT";
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${timestamp}${random}`;
}

function generateWaitlistId() {
  const prefix = "WL";
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${timestamp}${random}`;
}

function generateGroupId() {
  const prefix = "GRP";
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${timestamp}${random}`;
}

function daysBetween(d1, d2) {
  let diff = d2.getTime() - d1.getTime();
  let days = Math.ceil(diff / (1000 * 3600 * 24));
  return days;
}

function formatISODate(date) {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return new Date(date).toISOString();
}

/***************************************************
 * GOOGLE DRIVE - ASSETS FOLDER MANAGEMENT
 ***************************************************/
function getOrCreateAssetsFolder() {
  try {
    // Search for existing ASSETS folder
    const folders = DriveApp.getFoldersByName(ASSETS_FOLDER_NAME);

    if (folders.hasNext()) {
      return folders.next();
    }

    // Create ASSETS folder if it doesn't exist
    const newFolder = DriveApp.createFolder(ASSETS_FOLDER_NAME);
    Logger.log('Created ASSETS folder with ID: ' + newFolder.getId());
    return newFolder;
  } catch (e) {
    Logger.log('Error in getOrCreateAssetsFolder: ' + e.toString());
    throw e;
  }
}

function uploadIdCardImage(base64Data, fileName, mimeType) {
  try {
    if (!base64Data || !fileName) {
      return { success: false, message: 'No image data provided' };
    }

    // Get or create ASSETS folder
    const folder = getOrCreateAssetsFolder();

    // Decode base64 data
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);

    // Create file in ASSETS folder
    const file = folder.createFile(blob);

    // Make the file publicly viewable (for displaying in the app)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the direct view URL using proper Drive format
    const fileId = file.getId();
    const viewUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';

    Logger.log('Uploaded image: ' + fileName + ', URL: ' + viewUrl);

    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      viewUrl: viewUrl,
      driveUrl: file.getUrl()
    };
  } catch (e) {
    Logger.log('Error uploading image: ' + e.toString());
    return { success: false, message: 'Error uploading image: ' + e.toString() };
  }
}

function deleteIdCardImage(fileId) {
  try {
    if (!fileId) return { success: true };

    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (fileError) {
      Logger.log('File not found or already deleted: ' + fileId);
      return { success: true, message: 'File not found or already deleted' };
    }

    return { success: true, message: 'Image deleted successfully' };
  } catch (e) {
    Logger.log('Error deleting image: ' + e.toString());
    return { success: false, message: 'Error deleting image: ' + e.toString() };
  }
}

/***************************************************
 * GOOGLE DRIVE - GENERIC ASSET SUBFOLDER UPLOAD
 * Used by branding (logo) and public page (hero carousel)
 ***************************************************/
function getOrCreateSubFolder(parentFolder, name) {
  const existing = parentFolder.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parentFolder.createFolder(name);
}

function uploadBrandAsset(base64Data, fileName, mimeType, subfolder) {
  let stage = 'starting';
  try {
    if (!base64Data || !fileName) {
      return { success: false, message: 'No image data provided' };
    }

    stage = 'accessing the Drive ASSETS folder';
    const assetsFolder = getOrCreateAssetsFolder();
    const folder = subfolder ? getOrCreateSubFolder(assetsFolder, subfolder) : assetsFolder;

    stage = 'decoding the image data';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);

    stage = 'creating the file in Drive';
    const file = folder.createFile(blob);

    stage = 'setting file sharing permissions';
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const viewUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';

    return { success: true, fileId: fileId, fileName: fileName, viewUrl: viewUrl, driveUrl: file.getUrl() };
  } catch (e) {
    const detail = 'Failed while ' + stage + ': ' + (e && e.message ? e.message : e);
    Logger.log('Error in uploadBrandAsset: ' + detail);
    return { success: false, message: detail };
  }
}

/***************************************************
 * SETTINGS - HOTEL BRANDING, SMS & PUBLIC PAGE CONFIG
 ***************************************************/
function getOrCreateSettingsSheet() {
  let ss;
  try {
    ss = SpreadsheetApp.openById(SS_ID);
  } catch (e) {
    throw new Error('Could not open the spreadsheet (SS_ID=' + SS_ID + '): ' + e.toString());
  }

  let sheet;
  try {
    sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  } catch (e) {
    throw new Error('Could not look up the Settings sheet: ' + e.toString());
  }

  if (!sheet) {
    try {
      sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
      sheet.appendRow(['Key', 'Value']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 500);
    } catch (e) {
      throw new Error('Could not create the Settings sheet (check the deploying account has edit access to the spreadsheet): ' + e.toString());
    }
  }
  return sheet;
}

function decodeSettingValue(key, rawValue) {
  if (SETTINGS_JSON_KEYS.indexOf(key) !== -1) {
    try { return rawValue ? JSON.parse(rawValue) : DEFAULT_SETTINGS[key]; }
    catch (e) { return DEFAULT_SETTINGS[key]; }
  }
  if (SETTINGS_BOOLEAN_KEYS.indexOf(key) !== -1) {
    return rawValue === true || rawValue === 'true';
  }
  if (SETTINGS_NUMBER_KEYS.indexOf(key) !== -1) {
    const n = parseFloat(rawValue);
    return isNaN(n) ? DEFAULT_SETTINGS[key] : n;
  }
  return rawValue;
}

function encodeSettingValue(key, value) {
  if (SETTINGS_JSON_KEYS.indexOf(key) !== -1) return JSON.stringify(value || []);
  if (SETTINGS_BOOLEAN_KEYS.indexOf(key) !== -1) return value === true || value === 'true' ? 'true' : 'false';
  return (value === undefined || value === null) ? '' : value.toString();
}

/**
 * Zero-dependency diagnostic: no Sheets/Drive access at all, just proves the
 * client<->server google.script.run bridge is alive and this exact Code.gs
 * is the one actually deployed. If this ever comes back null/empty too, the
 * problem isn't in the settings logic - it's the deployment itself (stale
 * version, missing authorization, etc.) rather than anything saveSettings
 * or addHeroImage do.
 */
function pingSettings() {
  return {
    success: true,
    message: 'pong',
    serverTime: new Date().toString(),
    ssId: (typeof SS_ID !== 'undefined' && SS_ID) ? SS_ID : '(SS_ID not set)'
  };
}

/**
 * Returns the merged settings object (defaults overridden by whatever is stored).
 * Safe to call from the client on every app load.
 */
function getSettings() {
  try {
    const sheet = getOrCreateSettingsSheet();
    const data = sheet.getDataRange().getValues();
    const stored = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][SETTINGS_KEY_COL];
      if (!key) continue;
      stored[key] = decodeSettingValue(key, data[i][SETTINGS_VALUE_COL]);
    }
    const merged = Object.assign({}, DEFAULT_SETTINGS, stored);
    return toSafeResult(migrateLegacyDriveUrls(merged));
  } catch (e) {
    Logger.log('Error in getSettings: ' + e.toString());
    return toSafeResult(DEFAULT_SETTINGS);
  }
}

/**
 * Self-heals settings images that were saved before the switch from the
 * unreliable 'uc?export=view' Drive link format to 'thumbnail' links (which
 * embed far more reliably in <img> tags). Rewrites in place from the stored
 * fileId - no re-upload needed - so older saves pick up the fix automatically.
 */
function migrateLegacyDriveUrls(settings) {
  const isLegacy = (url) => url && url.indexOf('uc?export=view') !== -1;
  const thumb = (fileId) => 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';

  if (isLegacy(settings.logoUrl) && settings.logoFileId) settings.logoUrl = thumb(settings.logoFileId);
  if (isLegacy(settings.aboutImageUrl) && settings.aboutImageFileId) settings.aboutImageUrl = thumb(settings.aboutImageFileId);
  if (Array.isArray(settings.heroImages)) {
    settings.heroImages = settings.heroImages.map(img =>
      (img && isLegacy(img.url) && img.fileId) ? Object.assign({}, img, { url: thumb(img.fileId) }) : img
    );
  }
  return settings;
}

/**
 * Guarantees whatever this returns to the client is a plain, JSON-safe
 * object and never bare null/undefined - google.script.run's success
 * handler is only ever seen to fire with `null` when the return value
 * couldn't be delivered as-is (e.g. it wasn't valid JSON), so round-
 * tripping through JSON here defends against that even if something
 * upstream sneaks a non-plain value (Date, etc.) into the result.
 */
function toSafeResult(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (e) {
    Logger.log('toSafeResult: value was not JSON-safe: ' + e.toString());
    return { success: false, message: 'Server produced a non-serializable result: ' + e.toString() };
  }
}

/**
 * Upserts a partial settings object (only the keys provided are changed).
 * Returns the freshly merged settings object.
 *
 * This is a thin, bulletproof wrapper around doSaveSettings(): whatever
 * happens inside, it always returns a plain JSON-safe object (see
 * toSafeResult), and every stage is logged via Logger.log so the Apps
 * Script Executions panel shows exactly how far execution got even if
 * the client only ever sees "null".
 */
function saveSettings(partialSettings) {
  Logger.log('saveSettings: called with keys = ' + Object.keys(partialSettings || {}).join(', '));
  let result;
  try {
    result = doSaveSettings(partialSettings);
  } catch (e) {
    Logger.log('saveSettings: doSaveSettings threw: ' + e.toString());
    result = { success: false, message: 'Unhandled error in saveSettings: ' + (e && e.message ? e.message : e) };
  }
  Logger.log('saveSettings: returning ' + JSON.stringify(result).slice(0, 500));
  return toSafeResult(result);
}

function doSaveSettings(partialSettings) {
  // Each stage is caught separately so a failure always reports exactly
  // which step broke, instead of a generic/empty message.
  let stage = 'starting';
  try {
    const keys = Object.keys(partialSettings || {});
    if (keys.length === 0) return { success: true, message: 'Nothing to save', settings: getSettings() };

    stage = 'opening the Settings sheet';
    Logger.log('doSaveSettings: ' + stage);
    const sheet = getOrCreateSettingsSheet();

    stage = 'reading existing settings rows';
    Logger.log('doSaveSettings: ' + stage);
    const lastRow = sheet.getLastRow();
    const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 2).getValues() : [];
    const rowByKey = {};
    data.forEach((row, i) => { if (row[SETTINGS_KEY_COL]) rowByKey[row[SETTINGS_KEY_COL]] = i + 2; }); // 1-based sheet row
    Logger.log('doSaveSettings: found ' + data.length + ' existing rows, ' + Object.keys(rowByKey).length + ' with keys');

    // Batch every brand-new key into a single appended range instead of one
    // appendRow() call per key - keeps a first-time save (30+ keys) to ~1-2
    // Sheets API calls instead of dozens, which is both faster and avoids
    // hitting per-second write quotas.
    stage = 'encoding values';
    Logger.log('doSaveSettings: ' + stage);
    const newRows = [];
    const updates = [];
    keys.forEach(key => {
      const encoded = encodeSettingValue(key, partialSettings[key]);
      if (rowByKey[key]) {
        updates.push([rowByKey[key], encoded]);
      } else {
        newRows.push([key, encoded]);
      }
    });
    Logger.log('doSaveSettings: ' + updates.length + ' updates, ' + newRows.length + ' new rows');

    stage = 'updating existing rows';
    updates.forEach(([rowNum, encoded]) => {
      sheet.getRange(rowNum, SETTINGS_VALUE_COL + 1).setValue(encoded);
    });

    if (newRows.length > 0) {
      stage = 'appending new setting rows';
      Logger.log('doSaveSettings: ' + stage);
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 2).setValues(newRows);
    }

    try { logActivity('admin', 'SETTINGS_UPDATED', 'Keys: ' + keys.join(', ')); }
    catch (logErr) { Logger.log('doSaveSettings: activity log failed (non-fatal): ' + logErr.toString()); }

    stage = 'reloading merged settings';
    Logger.log('doSaveSettings: ' + stage);
    const merged = getSettings();

    stage = 'done';
    Logger.log('doSaveSettings: done, returning success');
    return { success: true, message: 'Settings saved successfully', settings: merged };
  } catch (e) {
    const detail = 'Failed while ' + stage + ': ' + (e && e.message ? e.message : e);
    Logger.log('Error in doSaveSettings: ' + detail);
    return { success: false, message: detail };
  }
}

/**
 * Uploads a new hotel logo to Drive and stores it as the active branding logo.
 */
function saveLogo(base64Data, fileName, mimeType) {
  try {
    const result = uploadBrandAsset(base64Data, 'LOGO_' + Date.now() + '_' + fileName, mimeType, 'Branding');
    if (!result.success) return result;
    return saveSettings({ logoUrl: result.viewUrl, logoFileId: result.fileId });
  } catch (e) {
    return { success: false, message: 'Error saving logo: ' + e.toString() };
  }
}

/**
 * Adds one image to the public page hero carousel (uploaded to Google Drive).
 */
function addHeroImage(base64Data, fileName, mimeType) {
  try {
    const result = uploadBrandAsset(base64Data, 'HERO_' + Date.now() + '_' + fileName, mimeType, 'HeroCarousel');
    if (!result.success) return result;

    const settings = getSettings();
    const heroImages = settings.heroImages || [];
    heroImages.push({ fileId: result.fileId, url: result.viewUrl });

    return saveSettings({ heroImages: heroImages });
  } catch (e) {
    return { success: false, message: 'Error uploading hero image: ' + e.toString() };
  }
}

/**
 * Removes a hero carousel image (trashes the Drive file and updates settings).
 */
function deleteHeroImage(fileId) {
  try {
    if (fileId) {
      try { DriveApp.getFileById(fileId).setTrashed(true); }
      catch (fileError) { Logger.log('Hero image file not found: ' + fileId); }
    }
    const settings = getSettings();
    const heroImages = (settings.heroImages || []).filter(img => img.fileId !== fileId);
    return saveSettings({ heroImages: heroImages });
  } catch (e) {
    return { success: false, message: 'Error removing hero image: ' + e.toString() };
  }
}

/**
 * Uploads a new "About" section photo for the public website.
 */
function saveAboutImage(base64Data, fileName, mimeType) {
  try {
    const result = uploadBrandAsset(base64Data, 'ABOUT_' + Date.now() + '_' + fileName, mimeType, 'AboutPhoto');
    if (!result.success) return result;
    return saveSettings({ aboutImageUrl: result.viewUrl, aboutImageFileId: result.fileId });
  } catch (e) {
    return { success: false, message: 'Error saving about photo: ' + e.toString() };
  }
}

/**
 * Uploads a food menu item photo to Drive. Used by the admin Food Menu
 * form's image picker instead of a raw pasted URL.
 */
function uploadFoodImage(base64Data, fileName, mimeType) {
  return uploadBrandAsset(base64Data, 'FOOD_' + Date.now() + '_' + fileName, mimeType, 'FoodMenu');
}

/**
 * Reorders the hero carousel to match the given array of file IDs.
 */
function reorderHeroImages(orderedFileIds) {
  try {
    const settings = getSettings();
    const byId = {};
    (settings.heroImages || []).forEach(img => { byId[img.fileId] = img; });
    const reordered = orderedFileIds.map(id => byId[id]).filter(Boolean);
    return saveSettings({ heroImages: reordered });
  } catch (e) {
    return { success: false, message: 'Error reordering hero images: ' + e.toString() };
  }
}

/***************************************************
 * SMS INTEGRATION - Arkesel, Hubtel & Custom Provider
 ***************************************************/
function normalizePhoneForSms(phone) {
  if (!phone) return '';
  return phone.toString().replace(/[^\d+]/g, '');
}

function sendSmsViaArkesel(config, phone, message) {
  const url = 'https://sms.arkesel.com/api/v2/sms/send';
  const payload = {
    sender: config.arkeselSenderId || 'Hotel',
    message: message,
    recipients: [normalizePhoneForSms(phone)]
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': config.arkeselApiKey || '' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  return { code: response.getResponseCode(), body: response.getContentText() };
}

function sendSmsViaHubtel(config, phone, message) {
  const url = 'https://sms.hubtel.com/v1/messages/send';
  const params = {
    clientid: config.hubtelClientId || '',
    clientsecret: config.hubtelClientSecret || '',
    from: config.hubtelSenderId || 'Hotel',
    to: normalizePhoneForSms(phone),
    content: message
  };
  const query = Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  const response = UrlFetchApp.fetch(url + '?' + query, { method: 'get', muteHttpExceptions: true });
  return { code: response.getResponseCode(), body: response.getContentText() };
}

function sendSmsViaCustomProvider(config, phone, message) {
  if (!config.customSmsUrl) throw new Error('Custom SMS URL is not configured');

  let headers = {};
  if (config.customSmsHeaders) {
    try { headers = JSON.parse(config.customSmsHeaders); } catch (e) { /* ignore malformed headers */ }
  }

  const fill = (tpl) => (tpl || '')
    .replace(/{{\s*phone\s*}}/g, normalizePhoneForSms(phone))
    .replace(/{{\s*message\s*}}/g, message);

  const method = (config.customSmsMethod || 'POST').toLowerCase();
  const url = fill(config.customSmsUrl);
  const options = { method: method, headers: headers, muteHttpExceptions: true };

  if (method === 'post' && config.customSmsBodyTemplate) {
    const body = fill(config.customSmsBodyTemplate);
    options.contentType = headers['Content-Type'] || headers['content-type'] || 'application/json';
    options.payload = body;
  }

  const response = UrlFetchApp.fetch(url, options);
  return { code: response.getResponseCode(), body: response.getContentText() };
}

/**
 * Sends a test SMS using the currently configured (or preview) provider settings.
 * Called from the admin Settings > SMS tab "Send Test SMS" button.
 */
function sendTestSms(config, testPhone) {
  try {
    if (!testPhone) return { success: false, message: 'Please provide a phone number to test with' };
    const provider = (config && config.smsProvider) || 'none';
    const message = 'This is a test message from your Hotel Management System SMS setup.';

    let result;
    if (provider === 'arkesel') result = sendSmsViaArkesel(config, testPhone, message);
    else if (provider === 'hubtel') result = sendSmsViaHubtel(config, testPhone, message);
    else if (provider === 'custom') result = sendSmsViaCustomProvider(config, testPhone, message);
    else return { success: false, message: 'Select an SMS provider first' };

    const ok = result.code >= 200 && result.code < 300;
    return {
      success: ok,
      message: ok ? 'Test SMS sent successfully' : ('Provider responded with status ' + result.code),
      responseCode: result.code,
      responseBody: result.body
    };
  } catch (e) {
    Logger.log('Error in sendTestSms: ' + e.toString());
    return { success: false, message: 'Error sending test SMS: ' + e.toString() };
  }
}

/**
 * Best-effort SMS notification helper. Never throws - failures are logged and swallowed
 * so SMS configuration issues can never break a booking.
 */
function sendSmsNotification(phone, message) {
  try {
    const settings = getSettings();
    if (!settings.smsEnabled || !settings.smsSendOnBooking || !phone) return { success: false, skipped: true };

    let result;
    if (settings.smsProvider === 'arkesel') result = sendSmsViaArkesel(settings, phone, message);
    else if (settings.smsProvider === 'hubtel') result = sendSmsViaHubtel(settings, phone, message);
    else if (settings.smsProvider === 'custom') result = sendSmsViaCustomProvider(settings, phone, message);
    else return { success: false, skipped: true };

    return { success: result.code >= 200 && result.code < 300 };
  } catch (e) {
    Logger.log('sendSmsNotification failed silently: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/***************************************************
 * BOOK ROOM - Updated with new fields
 ***************************************************/
function bookRoom(bookingDetails) {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const bookingsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const roomsData = roomsSheet.getDataRange().getValues();

    // Admin bookings go directly to "Booked", guest bookings go to "Pending"
    const isAdminBooking = bookingDetails.isAdminBooking === true;
    const bookingStatus = isAdminBooking ? "Booked" : "Pending";

    let roomRowIndex = -1;
    let foundAvailable = false;
    let selectedRoomRate = 0;

    for (let i = 1; i < roomsData.length; i++) {
      let rowRoomNo = (roomsData[i][ROOM_NO_COL] || "").toString();
      if (rowRoomNo === bookingDetails.roomNo) {
        roomRowIndex = i;
        let status = (roomsData[i][ROOM_STATUS_COL] || "").toString().toLowerCase();
        if (status === 'available') {
          foundAvailable = true;
          selectedRoomRate = parseFloat(roomsData[i][ROOM_RATE_COL]) || 0;
        }
        break;
      }
    }

    if (roomRowIndex === -1) {
      return { success: false, message: `Room ${bookingDetails.roomNo} not found.` };
    }
    if (!foundAvailable) {
      return { success: false, message: `Room ${bookingDetails.roomNo} is not available.` };
    }

    const ticketId = generateTicketId();
    const checkInDate = new Date(bookingDetails.checkIn);
    const checkOutDate = new Date(bookingDetails.checkOut);
    const createdAt = new Date().toISOString();

    let discount = parseFloat(bookingDetails.discount || "0") || 0;
    let tax = parseFloat(bookingDetails.tax || "0") || 0;
    let extraCharges = parseFloat(bookingDetails.extraCharges || "0") || 0;
    let paymentMethod = bookingDetails.paymentMethod || "Cash";

    // Calculate extra charges for early check-in / late checkout
    if (bookingDetails.earlyCheckin === 'Yes') {
      extraCharges += selectedRoomRate * 0.3; // 30% extra for early check-in
    }
    if (bookingDetails.lateCheckout === 'Yes') {
      extraCharges += selectedRoomRate * 0.3; // 30% extra for late checkout
    }

    let nights = daysBetween(checkInDate, checkOutDate);
    if (nights < 1) nights = 1;

    let baseAmount = selectedRoomRate * nights;
    let discounted = baseAmount - discount;
    let finalAmount = discounted + tax + extraCharges;

    // Payment status handling
    let paymentStatus = bookingDetails.paymentStatus || 'Not Paid';
    let paidAmount = parseFloat(bookingDetails.paidAmount || 0) || 0;

    // Handle ID Card image uploads
    let idCardFrontUrl = '';
    let idCardBackUrl = '';

    if (bookingDetails.idCardFrontData) {
      const frontResult = uploadIdCardImage(
        bookingDetails.idCardFrontData,
        `${ticketId}_ID_FRONT_${Date.now()}.${bookingDetails.idCardFrontExt || 'jpg'}`,
        bookingDetails.idCardFrontMime || 'image/jpeg'
      );
      if (frontResult.success) {
        idCardFrontUrl = frontResult.viewUrl;
      }
    }

    if (bookingDetails.idCardBackData) {
      const backResult = uploadIdCardImage(
        bookingDetails.idCardBackData,
        `${ticketId}_ID_BACK_${Date.now()}.${bookingDetails.idCardBackExt || 'jpg'}`,
        bookingDetails.idCardBackMime || 'image/jpeg'
      );
      if (backResult.success) {
        idCardBackUrl = backResult.viewUrl;
      }
    }

    // Handle Payment Screenshot upload
    let paymentScreenshotUrl = '';
    if (bookingDetails.paymentScreenshotData) {
      const screenshotResult = uploadIdCardImage(
        bookingDetails.paymentScreenshotData,
        `${ticketId}_PAYMENT_${Date.now()}.${bookingDetails.paymentScreenshotExt || 'jpg'}`,
        bookingDetails.paymentScreenshotMime || 'image/jpeg'
      );
      if (screenshotResult.success) {
        paymentScreenshotUrl = screenshotResult.viewUrl;
      }
    }

    bookingsSheet.appendRow([
      ticketId,
      bookingDetails.roomNo,
      bookingDetails.guestName,
      bookingDetails.phone,
      bookingDetails.email,
      bookingDetails.city,
      bookingDetails.maritalStatus,
      bookingDetails.occupancyType,
      bookingDetails.familyDetails || '',
      formatISODate(checkInDate),
      formatISODate(checkOutDate),
      bookingStatus,
      selectedRoomRate,
      discount,
      tax,
      paymentMethod,
      finalAmount,
      bookingDetails.specialRequests || '',
      bookingDetails.earlyCheckin || 'No',
      bookingDetails.lateCheckout || 'No',
      extraCharges,
      bookingDetails.groupId || '',
      createdAt,
      paymentStatus,
      paidAmount,
      idCardFrontUrl,
      idCardBackUrl,
      paymentScreenshotUrl
    ]);

    // Auto-create transaction and mark room only for admin bookings (guest bookings need approval first)
    if (isAdminBooking) {
      if (paidAmount > 0) {
        addTransaction({
          ticketId: ticketId,
          guestName: bookingDetails.guestName,
          roomNo: bookingDetails.roomNo,
          amount: paidAmount,
          paymentMethod: paymentMethod,
          type: paymentStatus === 'Paid' ? 'Full Payment' : 'Partial Payment',
          notes: 'Payment during booking'
        }, bookingDetails.email);
      }
      roomsSheet.getRange(roomRowIndex + 1, ROOM_STATUS_COL + 1).setValue("Booked");
    }

    let autoGeneratedPass = "guest" + new Date().getTime().toString().slice(-3);
    createUserIfNotExists(bookingDetails.email, autoGeneratedPass);

    // Send styled HTML confirmation email
    let bookingTableRows = [
      { label: 'Ticket ID', value: ticketId },
      { label: 'Room No.', value: bookingDetails.roomNo },
      { label: 'Check-in', value: checkInDate.toDateString() },
      { label: 'Check-out', value: checkOutDate.toDateString() },
      { label: 'Nights', value: nights },
      { label: 'Room Rate', value: '$' + selectedRoomRate + '/night' },
      { label: 'Discount', value: '$' + (parseFloat(bookingDetails.discount) || 0).toFixed(2) },
      { label: 'Tax', value: '$' + (parseFloat(bookingDetails.tax) || 0).toFixed(2) },
      { label: 'Extra Charges', value: '$' + (parseFloat(bookingDetails.extraCharges) || 0).toFixed(2) },
      { label: 'Total Amount', value: '$' + finalAmount.toFixed(2) }
    ];
    if (bookingDetails.specialRequests) {
      bookingTableRows.push({ label: 'Special Requests', value: bookingDetails.specialRequests });
    }
    if (bookingDetails.earlyCheckin === 'Yes') {
      bookingTableRows.push({ label: 'Early Check-in', value: 'Yes' });
    }
    if (bookingDetails.lateCheckout === 'Yes') {
      bookingTableRows.push({ label: 'Late Checkout', value: 'Yes' });
    }

    let credentialsHtml = `<div style="margin-top:16px;padding:14px;background:#f0f4ff;border:1px solid #e0e0e0;border-radius:4px;">
      <p style="margin:0 0 6px 0;font-size:13px;font-weight:600;color:#001f3f;">Your Login Credentials</p>
      <p style="margin:0;font-size:13px;color:#555;">Username: <strong>${bookingDetails.email}</strong></p>
      <p style="margin:0;font-size:13px;color:#555;">Password: <strong>${autoGeneratedPass}</strong></p>
    </div>`;

    let emailTitle = isAdminBooking ? 'Booking Confirmation' : 'Booking Request Received';
    let emailIntro = isAdminBooking
      ? 'Thank you for your reservation. Your booking has been confirmed successfully.'
      : 'Thank you for your reservation request. Your booking is pending admin approval. You will be notified via email once it is approved.';
    let emailFooter = isAdminBooking ? 'We look forward to your stay!' : 'You will receive a confirmation email once your booking is approved.';

    let bookingEmailHtml = generateEmailHtml({
      title: emailTitle,
      greeting: 'Hello ' + bookingDetails.guestName + ',',
      introText: emailIntro,
      tableRows: bookingTableRows,
      footerText: emailFooter,
      extraHtml: credentialsHtml
    });

    let subject = isAdminBooking
      ? `Booking Confirmation - Ticket ${ticketId}`
      : `Booking Request Received - Ticket ${ticketId}`;
    let bodyText = isAdminBooking
      ? `Hello ${bookingDetails.guestName},\n\nYour booking for Room #${bookingDetails.roomNo} has been confirmed.\nTicket ID: ${ticketId}\nCheck-in: ${checkInDate.toDateString()}\nCheck-out: ${checkOutDate.toDateString()}\nTotal: $${finalAmount.toFixed(2)}\n\nLogin: ${bookingDetails.email} / ${autoGeneratedPass}\n\n- Hotel Management`
      : `Hello ${bookingDetails.guestName},\n\nYour booking request for Room #${bookingDetails.roomNo} has been received and is pending approval.\nTicket ID: ${ticketId}\nCheck-in: ${checkInDate.toDateString()}\nCheck-out: ${checkOutDate.toDateString()}\nTotal: $${finalAmount.toFixed(2)}\n\nLogin: ${bookingDetails.email} / ${autoGeneratedPass}\n\n- Hotel Management`;
    MailApp.sendEmail({ to: bookingDetails.email, subject, body: bodyText, htmlBody: bookingEmailHtml });

    // Best-effort SMS confirmation (never blocks/fails the booking if SMS isn't configured)
    sendSmsNotification(bookingDetails.phone, `Booking confirmed! Ticket ${ticketId}, Room ${bookingDetails.roomNo}, ${checkInDate.toDateString()} - ${checkOutDate.toDateString()}. Total: $${finalAmount.toFixed(2)}.`);

    logActivity(bookingDetails.email, isAdminBooking ? 'BOOKING_CREATED' : 'BOOKING_REQUESTED', `Ticket: ${ticketId}, Room: ${bookingDetails.roomNo}`);
    SpreadsheetApp.flush();

    let successMsg = isAdminBooking
      ? `Room ${bookingDetails.roomNo} booked successfully. Ticket ID: ${ticketId}`
      : `Your booking request has been submitted. Ticket ID: ${ticketId}. Awaiting admin approval.`;

    return {
      success: true,
      message: successMsg,
      ticketId
    };
  } catch (e) {
    Logger.log(`Error in bookRoom: ${e.toString()}`);
    return { success: false, message: `An error occurred: ${e.message}` };
  }
}

/***************************************************
 * APPROVE BOOKING - Admin approves a pending booking
 ***************************************************/
function approveBooking(ticketId, adminUser) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    const roomsSheet = ss.getSheetByName(ROOMS_SHEET_NAME);
    const bookingsData = bookingsSheet.getDataRange().getValues();
    const roomsData = roomsSheet.getDataRange().getValues();

    let bookingRowIndex = -1;
    let roomNo = '';
    let guestName = '';
    let email = '';
    let ticketIdStr = '';

    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][TICKET_ID_COL].toString() === ticketId.toString()) {
        let status = (bookingsData[i][BOOKING_STATUS_COL] || '').toString().toLowerCase();
        if (status !== 'pending') {
          return { success: false, message: 'This booking is not in Pending status. Current status: ' + bookingsData[i][BOOKING_STATUS_COL] };
        }
        bookingRowIndex = i;
        roomNo = bookingsData[i][BOOKING_ROOM_NO_COL].toString();
        guestName = bookingsData[i][GUEST_NAME_COL];
        email = bookingsData[i][EMAIL_COL];
        ticketIdStr = bookingsData[i][TICKET_ID_COL].toString();
        break;
      }
    }

    if (bookingRowIndex === -1) {
      return { success: false, message: 'Booking not found with Ticket ID: ' + ticketId };
    }

    // Check room availability before approving
    let roomRowIndex = -1;
    for (let j = 1; j < roomsData.length; j++) {
      if ((roomsData[j][ROOM_NO_COL] || '').toString() === roomNo) {
        roomRowIndex = j;
        let roomStatus = (roomsData[j][ROOM_STATUS_COL] || '').toString().toLowerCase();
        if (roomStatus !== 'available') {
          return { success: false, message: 'Room ' + roomNo + ' is no longer available (Status: ' + roomsData[j][ROOM_STATUS_COL] + '). Cannot approve.' };
        }
        break;
      }
    }

    if (roomRowIndex === -1) {
      return { success: false, message: 'Room ' + roomNo + ' not found.' };
    }

    // Update booking status to "Booked"
    bookingsSheet.getRange(bookingRowIndex + 1, BOOKING_STATUS_COL + 1).setValue("Booked");

    // Mark room as "Booked"
    roomsSheet.getRange(roomRowIndex + 1, ROOM_STATUS_COL + 1).setValue("Booked");

    // Create transaction if payment was made during booking
    const paidAmount = parseFloat(bookingsData[bookingRowIndex][PAID_AMOUNT_COL]) || 0;
    const paymentMethod = bookingsData[bookingRowIndex][PAYMENT_METHOD_COL] || 'Cash';
    const paymentStatus = (bookingsData[bookingRowIndex][PAYMENT_STATUS_COL] || 'Not Paid').toString();

    if (paidAmount > 0) {
      addTransaction({
        ticketId: ticketIdStr,
        guestName: guestName,
        roomNo: roomNo,
        amount: paidAmount,
        paymentMethod: paymentMethod,
        type: paymentStatus === 'Paid' ? 'Full Payment' : 'Partial Payment',
        notes: 'Payment recorded on approval'
      }, email);
    }

    SpreadsheetApp.flush();

    // Send approval email
    let approvalEmailHtml = generateEmailHtml({
      title: 'Booking Approved',
      greeting: 'Hello ' + guestName + ',',
      introText: 'Great news! Your booking request has been approved.',
      tableRows: [
        { label: 'Ticket ID', value: ticketIdStr },
        { label: 'Room No.', value: roomNo },
        { label: 'Check-In', value: new Date(bookingsData[bookingRowIndex][CHECK_IN_COL]).toDateString() },
        { label: 'Check-Out', value: new Date(bookingsData[bookingRowIndex][CHECK_OUT_COL]).toDateString() },
        { label: 'Total Amount', value: '$' + (parseFloat(bookingsData[bookingRowIndex][TOTAL_AMOUNT_COL]) || 0).toFixed(2) },
        { label: 'Status', value: 'Confirmed' }
      ],
      footerText: 'We look forward to your stay!'
    });

    MailApp.sendEmail({
      to: email,
      subject: 'Booking Approved - Ticket ' + ticketIdStr,
      body: 'Hello ' + guestName + ', your booking (Ticket: ' + ticketIdStr + ') has been approved.',
      htmlBody: approvalEmailHtml
    });

    logActivity(adminUser || 'Admin', 'BOOKING_APPROVED', 'Ticket: ' + ticketIdStr + ', Room: ' + roomNo);

    return { success: true, message: 'Booking ' + ticketIdStr + ' approved successfully. Room ' + roomNo + ' marked as Booked.' };
  } catch (e) {
    Logger.log('Error in approveBooking: ' + e.toString());
    return { success: false, message: 'An error occurred: ' + e.message };
  }
}

/***************************************************
 * REJECT BOOKING - Admin rejects a pending booking
 ***************************************************/
function rejectBooking(ticketId, rejectionReason, adminUser) {
  try {
    const bookingsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const bookingsData = bookingsSheet.getDataRange().getValues();

    let bookingRowIndex = -1;
    let guestName = '';
    let email = '';
    let roomNo = '';

    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][TICKET_ID_COL].toString() === ticketId.toString()) {
        let status = (bookingsData[i][BOOKING_STATUS_COL] || '').toString().toLowerCase();
        if (status !== 'pending') {
          return { success: false, message: 'This booking is not in Pending status.' };
        }
        bookingRowIndex = i;
        guestName = bookingsData[i][GUEST_NAME_COL];
        email = bookingsData[i][EMAIL_COL];
        roomNo = bookingsData[i][BOOKING_ROOM_NO_COL].toString();
        break;
      }
    }

    if (bookingRowIndex === -1) {
      return { success: false, message: 'Booking not found.' };
    }

    // Set status to "Rejected"
    bookingsSheet.getRange(bookingRowIndex + 1, BOOKING_STATUS_COL + 1).setValue("Rejected");

    SpreadsheetApp.flush();

    // Send rejection email
    let reason = rejectionReason || 'No specific reason provided.';
    let rejectionEmailHtml = generateEmailHtml({
      title: 'Booking Update',
      greeting: 'Hello ' + guestName + ',',
      introText: 'We regret to inform you that your booking request could not be approved.',
      tableRows: [
        { label: 'Ticket ID', value: ticketId.toString() },
        { label: 'Room No.', value: roomNo },
        { label: 'Status', value: 'Rejected' },
        { label: 'Reason', value: reason }
      ],
      footerText: 'Please contact us if you have any questions.'
    });

    MailApp.sendEmail({
      to: email,
      subject: 'Booking Update - Ticket ' + ticketId,
      body: 'Hello ' + guestName + ', your booking request (Ticket: ' + ticketId + ') was not approved. Reason: ' + reason,
      htmlBody: rejectionEmailHtml
    });

    logActivity(adminUser || 'Admin', 'BOOKING_REJECTED', 'Ticket: ' + ticketId + ', Room: ' + roomNo + ', Reason: ' + reason);

    return { success: true, message: 'Booking ' + ticketId + ' has been rejected.' };
  } catch (e) {
    Logger.log('Error in rejectBooking: ' + e.toString());
    return { success: false, message: 'An error occurred: ' + e.message };
  }
}

/***************************************************
 * GROUP BOOKING - Book multiple rooms with individual guest details
 * Each guest can have different check-in/check-out dates
 ***************************************************/
function createGroupBooking(groupDetails) {
  try {
    const groupId = generateGroupId();
    const results = [];
    const guests = groupDetails.guests; // Array of guest objects with individual details
    // National ID upload is optional for admin bookings - guests may provide it if available,
    // but it is no longer required to complete a booking.

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];

      // Create booking details for each guest with their individual information
      const bookingDetails = {
        roomNo: guest.roomNo,
        guestName: guest.guestName,
        phone: guest.phone,
        email: guest.email,
        city: guest.city || groupDetails.city || '',
        maritalStatus: guest.maritalStatus || groupDetails.maritalStatus || 'Married',
        occupancyType: guest.occupancyType || groupDetails.occupancyType || 'Single',
        familyDetails: guest.familyDetails || groupDetails.familyDetails || '',
        checkIn: guest.checkIn,
        checkOut: guest.checkOut,
        discount: groupDetails.discount || '0',
        tax: groupDetails.tax || '0',
        paymentMethod: groupDetails.paymentMethod || 'Cash',
        specialRequests: guest.specialRequests || groupDetails.specialRequests || '',
        earlyCheckin: guest.earlyCheckin || 'No',
        lateCheckout: guest.lateCheckout || 'No',
        paymentStatus: groupDetails.paymentStatus || 'Not Paid',
        paidAmount: '0', // Individual payment amounts handled separately
        groupId: groupId,
        // National ID card images (optional)
        idCardFrontData: guest.idCardFrontData,
        idCardFrontMime: guest.idCardFrontMime,
        idCardFrontExt: guest.idCardFrontExt,
        idCardBackData: guest.idCardBackData,
        idCardBackMime: guest.idCardBackMime,
        idCardBackExt: guest.idCardBackExt,
        isAdminBooking: true
      };

      const result = bookRoom(bookingDetails);
      results.push({
        roomNo: guest.roomNo,
        guestName: guest.guestName,
        success: result.success,
        message: result.message,
        ticketId: result.ticketId
      });
    }

    const successCount = results.filter(r => r.success).length;
    const primaryEmail = guests.length > 0 ? guests[0].email : '';
    logActivity(primaryEmail, 'GROUP_BOOKING_CREATED', `Group ID: ${groupId}, Rooms: ${successCount}/${guests.length}`);

    return {
      success: successCount > 0,
      message: `Group booking created. ${successCount} of ${guests.length} rooms booked successfully.`,
      groupId: groupId,
      results: results
    };
  } catch (e) {
    Logger.log(`Error in createGroupBooking: ${e.toString()}`);
    return { success: false, message: `An error occurred: ${e.message}` };
  }
}

/***************************************************
 * CHECKOUT ROOM - Updated
 ***************************************************/
function checkoutRoom(ticketId, lateCheckoutActual) {
  try {
    const bookingsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const bookingsData = bookingsSheet.getDataRange().getValues();
    const roomsData = roomsSheet.getDataRange().getValues();

    let bookingRowIndex = -1;
    let roomNoToCheckout = "";
    let guestName = "";
    let email = "";
    let checkInDate, checkOutDate;
    let roomRate, discount, tax, extraCharges;

    for (let i = 1; i < bookingsData.length; i++) {
      if (bookingsData[i][TICKET_ID_COL].toString() === ticketId.toString()) {
        let status = (bookingsData[i][BOOKING_STATUS_COL] || "").toString().toLowerCase();
        if (status === "completed" || status === "checked out") {
          return { success: false, message: `Ticket ID ${ticketId} has already been checked out.` };
        }
        if (status === "pending" || status === "rejected") {
          return { success: false, message: `Ticket ID ${ticketId} cannot be checked out (Status: ${bookingsData[i][BOOKING_STATUS_COL]}).` };
        }
        bookingRowIndex = i;
        roomNoToCheckout = bookingsData[i][BOOKING_ROOM_NO_COL];
        guestName = bookingsData[i][GUEST_NAME_COL];
        email = bookingsData[i][EMAIL_COL];
        checkInDate = new Date(bookingsData[i][CHECK_IN_COL]);
        checkOutDate = new Date(bookingsData[i][CHECK_OUT_COL]);
        roomRate = parseFloat(bookingsData[i][ROOM_RATE_BOOK_COL]) || 0;
        discount = parseFloat(bookingsData[i][DISCOUNT_COL]) || 0;
        tax = parseFloat(bookingsData[i][TAX_COL]) || 0;
        extraCharges = parseFloat(bookingsData[i][EXTRA_CHARGES_COL]) || 0;
        break;
      }
    }

    if (bookingRowIndex === -1) {
      return { success: false, message: `Ticket ID ${ticketId} not found.` };
    }

    let actualCheckOut = new Date();

    // Check if late checkout and add extra charges
    if (lateCheckoutActual === 'Yes') {
      extraCharges += roomRate * 0.3; // 30% extra
      bookingsSheet.getRange(bookingRowIndex + 1, EXTRA_CHARGES_COL + 1).setValue(extraCharges);
      bookingsSheet.getRange(bookingRowIndex + 1, LATE_CHECKOUT_COL + 1).setValue('Yes');
    }

    let nights = daysBetween(checkInDate, actualCheckOut);
    if (nights < 1) nights = 1;
    let baseAmount = roomRate * nights;
    let finalAmount = (baseAmount - discount) + tax + extraCharges;

    bookingsSheet.getRange(bookingRowIndex + 1, CHECK_OUT_COL + 1).setValue(actualCheckOut.toISOString());
    bookingsSheet.getRange(bookingRowIndex + 1, BOOKING_STATUS_COL + 1).setValue("Checked Out");
    bookingsSheet.getRange(bookingRowIndex + 1, TOTAL_AMOUNT_COL + 1).setValue(finalAmount);

    // Set Room => Available and reset DND
    let roomRowIndex = -1;
    for (let j = 1; j < roomsData.length; j++) {
      let rowRoomNo = (roomsData[j][ROOM_NO_COL] || "").toString();
      if (rowRoomNo === roomNoToCheckout.toString()) {
        roomRowIndex = j;
        break;
      }
    }
    if (roomRowIndex !== -1) {
      roomsSheet.getRange(roomRowIndex + 1, ROOM_STATUS_COL + 1).setValue("Available");
      roomsSheet.getRange(roomRowIndex + 1, ROOM_DND_COL + 1).setValue("No");
    }

    SpreadsheetApp.flush();

    let invoiceHtml = generateInvoiceHtml({
      ticketId,
      occupantName: guestName,
      email,
      roomNo: roomNoToCheckout,
      checkIn: checkInDate,
      checkOut: actualCheckOut,
      nights,
      roomRate,
      discount,
      tax,
      extraCharges,
      finalAmount
    });

    let subject = `Invoice for your stay: Ticket ${ticketId}`;
    let bodyText = `Hello ${guestName},\n\nThank you for staying with us. Total: $${finalAmount.toFixed(2)}\n\nSafe travels!`;
    MailApp.sendEmail({ to: email, subject, body: bodyText, htmlBody: invoiceHtml });

    logActivity(email, 'CHECKOUT', `Ticket: ${ticketId}, Room: ${roomNoToCheckout}, Amount: $${finalAmount.toFixed(2)}`);

    return { success: true, message: `Room ${roomNoToCheckout} (Ticket: ${ticketId}) checked out successfully.`, invoiceHtml };
  } catch (e) {
    Logger.log(`Error in checkoutRoom: ${e.toString()}`);
    return { success: false, message: `An error occurred during checkout: ${e.message}` };
  }
}

/***************************************************
 * INVOICE GENERATION - Updated
 ***************************************************/
function generateInvoiceHtml(invoiceData) {
  let {
    ticketId, occupantName, email, roomNo, checkIn, checkOut,
    nights, roomRate, discount, tax, extraCharges, finalAmount
  } = invoiceData;

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .invoice-container { max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 4px; }
          .header { background: #001f3f; color: white; padding: 20px; text-align: center; margin: -30px -30px 30px -30px; }
          h2 { margin: 0; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px 14px; border: 1px solid #e0e0e0; text-align: left; }
          th { background: #001f3f; color: white; }
          .right { text-align: right; }
          .total-row { background: #001f3f; color: white; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h2>Hotel Invoice</h2>
          </div>
          <p><strong>Ticket ID:</strong> ${ticketId}</p>
          <p><strong>Guest Name:</strong> ${occupantName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Room #:</strong> ${roomNo}</p>
          <p><strong>Check-in:</strong> ${checkIn.toISOString().split('T')[0]}</p>
          <p><strong>Check-out:</strong> ${checkOut.toISOString().split('T')[0]}</p>
          <p><strong>Nights Stayed:</strong> ${nights}</p>
          <hr>
          <table>
            <tr><th>Description</th><th class="right">Amount</th></tr>
            <tr><td>Room Rate (${nights} nights @ $${roomRate})</td><td class="right">$${(roomRate * nights).toFixed(2)}</td></tr>
            <tr><td>Discount</td><td class="right">-$${discount.toFixed(2)}</td></tr>
            <tr><td>Tax</td><td class="right">$${tax.toFixed(2)}</td></tr>
            <tr><td>Extra Charges (Early/Late)</td><td class="right">$${(extraCharges || 0).toFixed(2)}</td></tr>
            <tr class="total-row"><td>Total Amount</td><td class="right">$${finalAmount.toFixed(2)}</td></tr>
          </table>
          <div class="footer">
            <p>Thank you for staying with us!</p>
            <p>Developed by Manuel Scripts | WhatsApp: +233547359015</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Returns an <img> tag for the configured hotel logo, or a monogram badge
 * built from the hotel name's first letter when no logo has been uploaded yet.
 */
function getBrandLogoHtml(settings, sizePx, borderColor) {
  const size = sizePx || 50;
  const border = borderColor || 'white';
  if (settings.logoUrl) {
    return '<img src="' + settings.logoUrl + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px solid ' + border + ';object-fit:cover;" alt="Logo">';
  }
  const initial = (settings.hotelName || 'H').trim().charAt(0).toUpperCase() || 'H';
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;border:2px solid ' + border + ';background:#ffd700;color:' + (settings.primaryColor || '#001f3f') + ';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:' + Math.round(size * 0.4) + 'px;">' + initial + '</div>';
}

// Manuel Scripts - Reusable HTML Email Template (Navy Blue Theme)
function generateEmailHtml(options) {
  const { title, greeting, introText, tableRows, footerText, extraHtml } = options;
  const settings = getSettings();
  const hotelName = settings.hotelName || 'Hotel Management';
  const brandColor = settings.primaryColor || '#001f3f';
  const logoImgHtml = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="${hotelName}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:10px;border:2px solid rgba(255,255,255,0.6);">`
    : '';

  let tableHtml = '';
  if (tableRows && tableRows.length > 0) {
    let rowsHtml = '';
    tableRows.forEach(function(row, idx) {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f9f9f9';
      rowsHtml += `<tr style="background:${bgColor};">
        <td style="padding:10px 14px;border:1px solid #e0e0e0;font-weight:600;color:#333;width:40%;">${row.label}</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0;color:#555;">${row.value}</td>
      </tr>`;
    });
    tableHtml = `
      <table style="width:100%;border-collapse:collapse;margin-top:20px;margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;background:#001f3f;color:white;text-align:left;width:40%;">Detail</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;background:#001f3f;color:white;text-align:left;">Information</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
  }

  return `<html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; color: #333; }
      </style>
    </head>
    <body>
      <div style="max-width:600px;margin:20px auto;background:white;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;">
        <div style="background:${brandColor};color:white;padding:20px 30px;text-align:center;">
          <h2 style="margin:0;font-size:20px;font-weight:700;">${logoImgHtml}${title}</h2>
        </div>
        <div style="padding:24px 30px;">
          <p style="font-size:15px;color:#333;margin:0 0 10px 0;">${greeting}</p>
          <p style="font-size:14px;color:#555;margin:0 0 16px 0;">${introText}</p>
          ${tableHtml}
          ${extraHtml || ''}
        </div>
        <div style="padding:16px 30px;text-align:center;border-top:1px solid #e0e0e0;background:#f9f9f9;">
          <p style="margin:0 0 4px 0;font-size:13px;color:#666;">${footerText || 'Thank you for choosing us.'}</p>
          <p style="margin:0;font-size:11px;color:#999;">${hotelName} | Developed by Manuel Scripts</p>
        </div>
      </div>
    </body>
  </html>`;
}

/***************************************************
 * DASHBOARD DATA
 ***************************************************/
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);

    // Room Stats
    const roomsSheet = ss.getSheetByName(ROOMS_SHEET_NAME);
    const roomsData = roomsSheet.getDataRange().getValues();
    roomsData.shift();

    let totalRooms = roomsData.length;
    let bookedCount = 0;
    let availableCount = 0;
    let checkedInCount = 0;
    let maintenanceCount = 0;
    let dndCount = 0;
    let allRoomsDetails = [];
    let roomTypeStats = { total: [0, 0, 0, 0], occupied: [0, 0, 0, 0] };
    const typeIndex = { 'Standard': 0, 'Deluxe': 1, 'Suite': 2, 'Executive': 3 };

    roomsData.forEach(row => {
      let roomNo = (row[ROOM_NO_COL] || "").toString();
      let type = (row[ROOM_TYPE_COL] || "").toString();
      let rate = parseFloat(row[ROOM_RATE_COL]) || 0;
      let status = (row[ROOM_STATUS_COL] || "").toString().toLowerCase();
      let dnd = (row[ROOM_DND_COL] || "No").toString();

      allRoomsDetails.push({ roomNo, type, rate, status: row[ROOM_STATUS_COL], dnd });

      if (typeIndex[type] !== undefined) {
        roomTypeStats.total[typeIndex[type]]++;
        if (status === 'booked' || status === 'checked in') {
          roomTypeStats.occupied[typeIndex[type]]++;
        }
      }

      if (status === 'booked') bookedCount++;
      else if (status === 'available') availableCount++;
      else if (status === 'checked in') checkedInCount++;
      else if (status === 'maintenance') maintenanceCount++;

      if (dnd.toLowerCase() === 'yes') dndCount++;
    });

    // Booking Stats
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    const bookingsData = bookingsSheet ? bookingsSheet.getDataRange().getValues() : [];
    if (bookingsData.length > 0) bookingsData.shift();

    let bookingStats = { pending: 0, booked: 0, checkedIn: 0, checkedOut: 0, cancelled: 0, rejected: 0 };
    let paymentStats = { paid: 0, partial: 0, notPaid: 0 };

    bookingsData.forEach(row => {
      const status = (row[BOOKING_STATUS_COL] || '').toString().toLowerCase();
      const paymentStatus = (row[PAYMENT_STATUS_COL] || '').toString().toLowerCase();

      if (status === 'pending') bookingStats.pending++;
      else if (status === 'booked') bookingStats.booked++;
      else if (status === 'checked in') bookingStats.checkedIn++;
      else if (status === 'checked out') bookingStats.checkedOut++;
      else if (status === 'cancelled') bookingStats.cancelled++;
      else if (status === 'rejected') bookingStats.rejected++;

      if (paymentStatus === 'paid') paymentStats.paid++;
      else if (paymentStatus === 'partial') paymentStats.partial++;
      else if (paymentStatus === 'not paid') paymentStats.notPaid++;
    });

    // Food Orders Count
    let foodOrdersCount = 0;
    const foodOrdersSheet = ss.getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (foodOrdersSheet) {
      const foodData = foodOrdersSheet.getDataRange().getValues();
      for (let i = 1; i < foodData.length; i++) {
        const orders = JSON.parse(foodData[i][1] || '[]');
        foodOrdersCount += orders.filter(o => o.status === 'Pending').length;
      }
    }

    // Cleaning Requests Count
    let cleaningRequestsCount = 0;
    const cleaningSheet = ss.getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
    if (cleaningSheet) {
      const cleaningData = cleaningSheet.getDataRange().getValues();
      for (let i = 1; i < cleaningData.length; i++) {
        const requests = JSON.parse(cleaningData[i][1] || '[]');
        cleaningRequestsCount += requests.filter(r => r.status === 'Pending').length;
      }
    }

    // Waitlist Count
    let waitlistCount = 0;
    const waitlistSheet = ss.getSheetByName(WAITLIST_SHEET_NAME);
    if (waitlistSheet) {
      const waitlistData = waitlistSheet.getDataRange().getValues();
      waitlistCount = waitlistData.length > 1 ? waitlistData.length - 1 : 0;
    }

    // Users Count
    let totalUsers = 0;
    const loginSheet = ss.getSheetByName(LOGIN_SHEET_NAME);
    if (loginSheet) {
      const loginData = loginSheet.getDataRange().getValues();
      totalUsers = loginData.length > 1 ? loginData.length - 1 : 0;
    }

    // Messages Count
    let messagesCount = 0;
    const messagesSheet = ss.getSheetByName(CONTACT_MESSAGES_SHEET_NAME);
    if (messagesSheet) {
      const messagesData = messagesSheet.getDataRange().getValues();
      messagesCount = messagesData.length > 1 ? messagesData.length - 1 : 0;
    }

    // Transactions Count & Today Revenue
    let transactionsCount = 0;
    let todayRevenue = 0;
    const today = new Date().toISOString().split('T')[0];
    const transactionsSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (transactionsSheet) {
      const txnData = transactionsSheet.getDataRange().getValues();
      for (let i = 1; i < txnData.length; i++) {
        const transactions = JSON.parse(txnData[i][1] || '[]');
        transactionsCount += transactions.length;
        if (txnData[i][0] && txnData[i][0].toString().startsWith(today)) {
          transactions.forEach(t => { todayRevenue += parseFloat(t.amount) || 0; });
        }
      }
    }

    // Weekly data (simplified)
    const weeklyBookings = [3, 5, 4, 6, 8, bookingStats.booked, bookingStats.checkedIn];
    const weeklyRevenue = [450, 780, 620, 890, 1200, todayRevenue || 500, 980];

    return {
      totalRooms,
      bookedRooms: bookedCount,
      availableRooms: availableCount,
      checkedInRooms: checkedInCount,
      maintenanceRooms: maintenanceCount,
      dndRooms: dndCount,
      allRoomsDetails,
      bookingStats,
      paymentStats,
      roomTypeStats,
      foodOrdersCount,
      cleaningRequestsCount,
      waitlistCount,
      totalUsers,
      messagesCount,
      transactionsCount,
      todayRevenue,
      weeklyBookings,
      weeklyRevenue
    };
  } catch (e) {
    Logger.log(`Error in getDashboardData: ${e.toString()}`);
    return { error: e.message };
  }
}

/***************************************************
 * GET AVAILABLE ROOM NUMBERS
 ***************************************************/
function getAvailableRoomNumbers() {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    data.shift();
    let availableRooms = [];
    data.forEach(row => {
      let status = (row[ROOM_STATUS_COL] || "").toString().toLowerCase();
      if (status === "available") {
        availableRooms.push({
          roomNo: (row[ROOM_NO_COL] || "").toString(),
          type: (row[ROOM_TYPE_COL] || "").toString(),
          rate: parseFloat(row[ROOM_RATE_COL]) || 0
        });
      }
    });
    return availableRooms;
  } catch (e) {
    Logger.log(`Error in getAvailableRoomNumbers: ${e.toString()}`);
    return [];
  }
}

/***************************************************
 * GET ALL ROOMS WITH STATUS (For booking modal)
 ***************************************************/
function getAllRoomsWithStatus() {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    data.shift();
    let allRooms = [];
    data.forEach(row => {
      let status = (row[ROOM_STATUS_COL] || "Available").toString();
      let imageFileId = (row[ROOM_IMAGE_COL] || "").toString();
      let imageUrl = imageFileId ? 'https://lh3.google.com/u/0/d/' + imageFileId : '';
      allRooms.push({
        roomNo: (row[ROOM_NO_COL] || "").toString(),
        type: (row[ROOM_TYPE_COL] || "").toString(),
        rate: parseFloat(row[ROOM_RATE_COL]) || 0,
        status: status,
        isAvailable: status.toLowerCase() === "available",
        dnd: (row[ROOM_DND_COL] || "No").toString(),
        image: imageUrl
      });
    });
    return allRooms;
  } catch (e) {
    Logger.log(`Error in getAllRoomsWithStatus: ${e.toString()}`);
    return [];
  }
}

/***************************************************
 * GET PUBLIC ROOM TYPES (For website display)
 * Returns unique room types with their rates and images
 ***************************************************/
function getPublicRoomTypes() {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    data.shift(); // Remove header

    // Group rooms by type and get one image per type
    const roomTypeMap = {};
    data.forEach(row => {
      const type = (row[ROOM_TYPE_COL] || "").toString();
      const rate = parseFloat(row[ROOM_RATE_COL]) || 0;
      const imageFileId = (row[ROOM_IMAGE_COL] || "").toString();
      const imageUrl = imageFileId ? 'https://drive.google.com/thumbnail?id=' + imageFileId + '&sz=w2000' : '';
      const status = (row[ROOM_STATUS_COL] || "Available").toString().toLowerCase();

      if (!roomTypeMap[type]) {
        roomTypeMap[type] = {
          type: type,
          pricePerNight: rate,
          pricePerWeek: Math.round(rate * 7 * 0.9), // 10% discount for weekly
          pricePerMonth: Math.round(rate * 30 * 0.8), // 20% discount for monthly
          image: imageUrl,
          totalRooms: 0,
          availableRooms: 0
        };
      }

      roomTypeMap[type].totalRooms++;
      if (status === 'available') {
        roomTypeMap[type].availableRooms++;
      }

      // If this room has an image and the current type doesn't, use it
      if (imageUrl && !roomTypeMap[type].image) {
        roomTypeMap[type].image = imageUrl;
      }
    });

    // Convert to array
    const roomTypes = Object.values(roomTypeMap);

    return { success: true, data: roomTypes };
  } catch (e) {
    Logger.log(`Error in getPublicRoomTypes: ${e.toString()}`);
    return { success: false, message: e.toString(), data: [] };
  }
}

/***************************************************
 * UPLOAD ROOM IMAGE
 * Uploads an image for a specific room and saves to Google Drive
 ***************************************************/
function uploadRoomImage(roomNo, base64Data, fileName, mimeType) {
  try {
    if (!base64Data || !fileName || !roomNo) {
      return { success: false, message: 'Missing required data' };
    }

    // Get or create ASSETS folder
    const folder = getOrCreateAssetsFolder();

    // Decode base64 data
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);

    // Create file in ASSETS folder
    const file = folder.createFile(blob);

    // Make the file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the file ID (not the full URL - we store just the ID)
    const fileId = file.getId();
    const viewUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';

    // Update the room's image in the sheet
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][ROOM_NO_COL].toString() === roomNo.toString()) {
        roomsSheet.getRange(i + 1, ROOM_IMAGE_COL + 1).setValue(fileId);
        break;
      }
    }

    Logger.log('Uploaded room image: ' + fileName + ', URL: ' + viewUrl);

    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      viewUrl: viewUrl,
      message: 'Room image uploaded successfully'
    };
  } catch (e) {
    Logger.log('Error uploading room image: ' + e.toString());
    return { success: false, message: 'Error uploading image: ' + e.toString() };
  }
}

/***************************************************
 * UPDATE ROOM IMAGE BY TYPE
 * Updates image for all rooms of a specific type
 ***************************************************/
function updateRoomTypeImage(roomType, base64Data, fileName, mimeType) {
  try {
    if (!base64Data || !fileName || !roomType) {
      return { success: false, message: 'Missing required data' };
    }

    // Get or create ASSETS folder
    const folder = getOrCreateAssetsFolder();

    // Decode base64 data
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);

    // Create file in ASSETS folder
    const file = folder.createFile(blob);

    // Make the file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Get the file ID
    const fileId = file.getId();
    const viewUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w2000';

    // Update all rooms of this type with the new image
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();
    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][ROOM_TYPE_COL].toString().toLowerCase() === roomType.toLowerCase()) {
        roomsSheet.getRange(i + 1, ROOM_IMAGE_COL + 1).setValue(fileId);
        updatedCount++;
      }
    }

    Logger.log('Updated ' + updatedCount + ' rooms of type ' + roomType + ' with image: ' + viewUrl);

    return {
      success: true,
      fileId: fileId,
      fileName: fileName,
      viewUrl: viewUrl,
      updatedRooms: updatedCount,
      message: 'Updated ' + updatedCount + ' rooms with new image'
    };
  } catch (e) {
    Logger.log('Error updating room type image: ' + e.toString());
    return { success: false, message: 'Error uploading image: ' + e.toString() };
  }
}

/***************************************************
 * GET CURRENT BOOKINGS
 ***************************************************/
function getCurrentBookings() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift();

    let allBookings = data.map((row, index) => {
      return {
        rowIndex: index + 2,
        TicketID: row[TICKET_ID_COL],
        RoomNo: row[BOOKING_ROOM_NO_COL],
        GuestName: row[GUEST_NAME_COL],
        Phone: row[PHONE_COL],
        Email: row[EMAIL_COL],
        City: row[CITY_COL],
        MaritalStatus: row[MARITAL_STATUS_COL],
        OccupancyType: row[OCCUPANCY_TYPE_COL],
        FamilyDetails: row[FAMILY_DETAILS_COL],
        CheckIn: row[CHECK_IN_COL],
        CheckOut: row[CHECK_OUT_COL],
        Status: row[BOOKING_STATUS_COL],
        RoomRate: row[ROOM_RATE_BOOK_COL],
        Discount: row[DISCOUNT_COL],
        Tax: row[TAX_COL],
        PaymentMethod: row[PAYMENT_METHOD_COL],
        TotalAmount: row[TOTAL_AMOUNT_COL],
        SpecialRequests: row[SPECIAL_REQUESTS_COL],
        EarlyCheckin: row[EARLY_CHECKIN_COL],
        LateCheckout: row[LATE_CHECKOUT_COL],
        ExtraCharges: row[EXTRA_CHARGES_COL],
        GroupID: row[GROUP_ID_COL],
        CreatedAt: row[CREATED_AT_COL],
        PaymentStatus: row[PAYMENT_STATUS_COL] || 'Not Paid',
        PaidAmount: row[PAID_AMOUNT_COL] || 0,
        IdCardFront: row[ID_CARD_FRONT_COL] || '',
        IdCardBack: row[ID_CARD_BACK_COL] || '',
        PaymentScreenshot: row[PAYMENT_SCREENSHOT_COL] || ''
      };
    });

    let active = allBookings.filter(b => {
      let s = (b.Status || '').toString().toLowerCase();
      return s === 'booked' || s === 'pending';
    });

    return active;
  } catch (e) {
    Logger.log(`Error in getCurrentBookings: ${e.toString()}`);
    return { error: e.message };
  }
}

/***************************************************
 * GET ALL BOOKINGS (Including history)
 ***************************************************/
function getAllBookings() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    data.shift();

    let allBookings = data.map((row, index) => {
      return {
        rowIndex: index + 2,
        TicketID: row[TICKET_ID_COL],
        RoomNo: row[BOOKING_ROOM_NO_COL],
        GuestName: row[GUEST_NAME_COL],
        Phone: row[PHONE_COL],
        Email: row[EMAIL_COL],
        CheckIn: row[CHECK_IN_COL],
        CheckOut: row[CHECK_OUT_COL],
        Status: row[BOOKING_STATUS_COL],
        PaymentMethod: row[PAYMENT_METHOD_COL],
        TotalAmount: row[TOTAL_AMOUNT_COL],
        SpecialRequests: row[SPECIAL_REQUESTS_COL],
        GroupID: row[GROUP_ID_COL],
        CreatedAt: row[CREATED_AT_COL],
        PaymentStatus: row[PAYMENT_STATUS_COL] || 'Not Paid',
        PaidAmount: row[PAID_AMOUNT_COL] || 0,
        IdCardFront: row[ID_CARD_FRONT_COL] || '',
        IdCardBack: row[ID_CARD_BACK_COL] || '',
        PaymentScreenshot: row[PAYMENT_SCREENSHOT_COL] || ''
      };
    });

    return allBookings;
  } catch (e) {
    Logger.log(`Error in getAllBookings: ${e.toString()}`);
    return { error: e.message };
  }
}

/***************************************************
 * CALENDAR DATA - Get bookings for calendar view
 ***************************************************/
function getCalendarData(startDate, endDate) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    data.shift();

    const start = new Date(startDate);
    const end = new Date(endDate);

    let events = [];
    data.forEach(row => {
      const checkIn = new Date(row[CHECK_IN_COL]);
      const checkOut = new Date(row[CHECK_OUT_COL]);
      const status = (row[BOOKING_STATUS_COL] || "").toString().toLowerCase();

      // Include if booking overlaps with the requested range
      if (checkIn <= end && checkOut >= start) {
        events.push({
          id: row[TICKET_ID_COL],
          title: `Room ${row[BOOKING_ROOM_NO_COL]} - ${row[GUEST_NAME_COL]}`,
          roomNo: row[BOOKING_ROOM_NO_COL],
          guestName: row[GUEST_NAME_COL],
          start: checkIn.toISOString(),
          end: checkOut.toISOString(),
          status: row[BOOKING_STATUS_COL],
          color: status === 'booked' ? '#001f3f' : (status === 'checked out' ? '#34a853' : '#6c757d')
        });
      }
    });

    return events;
  } catch (e) {
    Logger.log(`Error in getCalendarData: ${e.toString()}`);
    return { error: e.message };
  }
}

/***************************************************
 * DO NOT DISTURB - Toggle DND status
 ***************************************************/
function toggleDND(roomNo, dndStatus) {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][ROOM_NO_COL].toString() === roomNo.toString()) {
        roomsSheet.getRange(i + 1, ROOM_DND_COL + 1).setValue(dndStatus);
        logActivity('System', 'DND_TOGGLE', `Room ${roomNo} DND set to ${dndStatus}`);
        return { success: true, message: `Room ${roomNo} DND status updated to ${dndStatus}` };
      }
    }
    return { success: false, message: `Room ${roomNo} not found` };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * WAITLIST MANAGEMENT
 ***************************************************/
function addToWaitlist(waitlistData) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(WAITLIST_SHEET_NAME);
    if (!sheet) {
      return { success: false, message: 'Waitlist sheet not found. Run setupDemoData first.' };
    }

    const waitlistId = generateWaitlistId();
    const createdAt = new Date().toISOString();

    sheet.appendRow([
      waitlistId,
      waitlistData.guestName,
      waitlistData.phone,
      waitlistData.email,
      waitlistData.preferredRoomType || '',
      formatISODate(waitlistData.checkIn),
      formatISODate(waitlistData.checkOut),
      parseInt(waitlistData.numRooms) || 1,
      waitlistData.specialRequests || '',
      'Waiting',
      createdAt,
      ''
    ]);

    // Send confirmation email
    MailApp.sendEmail({
      to: waitlistData.email,
      subject: `Waitlist Confirmation - ${waitlistId}`,
      body: `Hello ${waitlistData.guestName},\n\nYou have been added to our waitlist.\n\nWaitlist ID: ${waitlistId}\nRequested Dates: ${waitlistData.checkIn} to ${waitlistData.checkOut}\nRooms Needed: ${waitlistData.numRooms}\n\nWe will contact you when a room becomes available.\n\n- Hotel Management`
    });

    logActivity(waitlistData.email, 'WAITLIST_ADDED', `Waitlist ID: ${waitlistId}`);

    return { success: true, message: `Added to waitlist. Your ID: ${waitlistId}`, waitlistId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getWaitlist() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(WAITLIST_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift();

    return data.map((row, index) => ({
      rowIndex: index + 2,
      WaitlistID: row[WL_ID_COL],
      GuestName: row[WL_GUEST_NAME_COL],
      Phone: row[WL_PHONE_COL],
      Email: row[WL_EMAIL_COL],
      PreferredRoomType: row[WL_ROOM_TYPE_COL],
      CheckIn: row[WL_CHECK_IN_COL],
      CheckOut: row[WL_CHECK_OUT_COL],
      NumRooms: row[WL_NUM_ROOMS_COL],
      SpecialRequests: row[WL_REQUESTS_COL],
      Status: row[WL_STATUS_COL],
      CreatedAt: row[WL_CREATED_AT_COL],
      Notes: row[WL_NOTES_COL]
    }));
  } catch (e) {
    return { error: e.message };
  }
}

function updateWaitlistStatus(rowIndex, status, notes) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(WAITLIST_SHEET_NAME);
    sheet.getRange(rowIndex, WL_STATUS_COL + 1).setValue(status);
    if (notes) {
      sheet.getRange(rowIndex, WL_NOTES_COL + 1).setValue(notes);
    }
    return { success: true, message: 'Waitlist status updated' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteWaitlistEntry(rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(WAITLIST_SHEET_NAME);
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Waitlist entry deleted' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * USER MANAGEMENT
 ***************************************************/
function getAllUsers() {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();
    let users = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      users.push({
        rowIndex: i + 1,
        username: row[LOGIN_USERNAME_COL],
        password: row[LOGIN_PASSWORD_COL],
        role: row[LOGIN_ROLE_COL],
        assignedRooms: row[LOGIN_ASSIGNED_ROOMS_COL] || '',
        fullName: row[LOGIN_FULL_NAME_COL] || ''
      });
    }
    return users;
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Get user profile (name, etc.) from Login sheet
 */
function getUserProfile(userEmail) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][LOGIN_USERNAME_COL].toString().toLowerCase() === userEmail.toLowerCase()) {
        return {
          email: data[i][LOGIN_USERNAME_COL],
          role: data[i][LOGIN_ROLE_COL],
          fullName: data[i][LOGIN_FULL_NAME_COL] || '',
          assignedRooms: data[i][LOGIN_ASSIGNED_ROOMS_COL] || ''
        };
      }
    }
    return { fullName: '', email: userEmail, role: '', assignedRooms: '' };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get user's active bookings (Checked In or Booked)
 */
function getUserBookings(userEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
    if (!bookingsSheet) return [];

    // Load Rooms data to look up room types
    const roomsSheet = ss.getSheetByName(ROOMS_SHEET_NAME);
    const roomsData = roomsSheet ? roomsSheet.getDataRange().getValues() : [];

    // Build a map of roomNo -> roomType for quick lookup
    const roomTypeMap = {};
    for (let r = 1; r < roomsData.length; r++) {
      const roomNo = (roomsData[r][ROOM_NO_COL] || '').toString();
      const roomType = (roomsData[r][ROOM_TYPE_COL] || '').toString();
      if (roomNo) {
        roomTypeMap[roomNo] = roomType;
      }
    }

    const data = bookingsSheet.getDataRange().getValues();
    let bookings = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const email = (row[EMAIL_COL] || '').toString().toLowerCase();
      const status = (row[BOOKING_STATUS_COL] || '').toString().trim();

      // Return active bookings (Booked or Checked In) for this user
      // Also check for partial email match (in case of capitalization differences)
      if (email === userEmail.toLowerCase() && (status === 'Booked' || status === 'Checked In')) {
        const roomNo = (row[BOOKING_ROOM_NO_COL] || '').toString();
        bookings.push({
          ticketId: row[TICKET_ID_COL],
          roomNo: roomNo,
          guestName: row[GUEST_NAME_COL],
          phone: row[PHONE_COL],
          email: row[EMAIL_COL],
          checkIn: row[CHECK_IN_COL],
          checkOut: row[CHECK_OUT_COL],
          status: status,
          roomType: roomTypeMap[roomNo] || '' // Look up room type from Rooms sheet
        });
      }
    }

    return bookings;
  } catch (e) {
    Logger.log('Error in getUserBookings: ' + e.toString());
    return { error: e.message };
  }
}

function addUser(username, password, role, assignedRooms, fullName) {
  try {
    if (!username || !password || !role) {
      return { success: false, message: "Missing required fields." };
    }

    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      let storedUser = (data[i][LOGIN_USERNAME_COL] || "").toString().trim().toLowerCase();
      if (storedUser === username.toLowerCase()) {
        return { success: false, message: "User already exists." };
      }
    }

    // For FoodStaff or Cleaner, save assignedRooms; for others leave empty
    const rooms = (role === 'FoodStaff' || role === 'Cleaner') ? (assignedRooms || '').trim() : '';
    const name = (fullName || '').trim();
    loginSheet.appendRow([username.trim(), password.trim(), role.trim(), rooms, name]);
    logActivity('Admin', 'USER_ADDED', `User: ${username}, Role: ${role}${rooms ? ', Rooms: ' + rooms : ''}`);
    return { success: true, message: "User added successfully!" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateUser(rowIndex, newPassword, newRole, assignedRooms, fullName) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    if (rowIndex <= 1) {
      return { success: false, message: "Invalid row index." };
    }

    if (newPassword) {
      loginSheet.getRange(rowIndex, LOGIN_PASSWORD_COL + 1).setValue(newPassword);
    }
    if (newRole) {
      loginSheet.getRange(rowIndex, LOGIN_ROLE_COL + 1).setValue(newRole);
    }
    // Update assigned rooms (for FoodStaff or Cleaner)
    const rooms = (newRole === 'FoodStaff' || newRole === 'Cleaner') ? (assignedRooms || '').trim() : '';
    loginSheet.getRange(rowIndex, LOGIN_ASSIGNED_ROOMS_COL + 1).setValue(rooms);

    // Update full name
    if (fullName !== undefined) {
      loginSheet.getRange(rowIndex, LOGIN_FULL_NAME_COL + 1).setValue((fullName || '').trim());
    }

    return { success: true, message: "User updated successfully." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteUser(rowIndex) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    if (rowIndex <= 1) {
      return { success: false, message: "Cannot delete the header row." };
    }
    loginSheet.deleteRow(rowIndex);
    logActivity('Admin', 'USER_DELETED', `Row: ${rowIndex}`);
    return { success: true, message: "User deleted successfully." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Update user's own password
 */
function updateUserPassword(userEmail, currentPassword, newPassword) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][LOGIN_USERNAME_COL].toString().toLowerCase() === userEmail.toLowerCase()) {
        // Verify current password
        if (data[i][LOGIN_PASSWORD_COL] !== currentPassword) {
          return { success: false, message: 'Current password is incorrect' };
        }

        // Update password
        loginSheet.getRange(i + 1, LOGIN_PASSWORD_COL + 1).setValue(newPassword);
        logActivity(userEmail, 'PASSWORD_CHANGED', 'User changed their password');

        return { success: true, message: 'Password updated successfully' };
      }
    }

    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/***************************************************
 * ROOM MANAGEMENT
 ***************************************************/
function getAllRooms() {
  try {
    const roomsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = roomsSheet.getDataRange().getValues();
    let rooms = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      let imageFileId = (row[ROOM_IMAGE_COL] || "").toString();
      let imageUrl = imageFileId ? 'https://drive.google.com/thumbnail?id=' + imageFileId + '&sz=w2000' : '';
      rooms.push({
        rowIndex: i + 1,
        roomNo: row[ROOM_NO_COL],
        roomType: row[ROOM_TYPE_COL],
        roomRate: row[ROOM_RATE_COL],
        roomStatus: row[ROOM_STATUS_COL],
        dnd: row[ROOM_DND_COL] || 'No',
        image: imageUrl
      });
    }
    return rooms;
  } catch (err) {
    return { error: err.message };
  }
}

function addRoom(roomNo, roomType, roomRate, roomStatus) {
  try {
    if (!roomNo) {
      return { success: false, message: "Room No is required." };
    }

    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      let existingRoomNo = (data[i][ROOM_NO_COL] || "").toString().trim().toLowerCase();
      if (existingRoomNo === roomNo.toString().toLowerCase()) {
        return { success: false, message: "A room with this number already exists." };
      }
    }

    sheet.appendRow([
      roomNo.trim(),
      (roomType || "").trim(),
      parseFloat(roomRate) || 0,
      (roomStatus || "Available").trim(),
      "No",
      ""  // Image column - empty by default
    ]);

    logActivity('Admin', 'ROOM_ADDED', `Room: ${roomNo}, Type: ${roomType}`);
    return { success: true, message: "Room added successfully!" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateRoom(rowIndex, roomNo, roomType, roomRate, roomStatus) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    if (rowIndex <= 1) {
      return { success: false, message: "Invalid row index." };
    }

    const currentValue = sheet.getRange(rowIndex, ROOM_NO_COL + 1).getValue();
    if (roomNo && roomNo.toString().trim().toLowerCase() !== (currentValue || "").toString().trim().toLowerCase()) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (i + 1 === rowIndex) continue;
        let existingNo = (data[i][ROOM_NO_COL] || "").toString().toLowerCase();
        if (existingNo === roomNo.toString().toLowerCase()) {
          return { success: false, message: "Another room with this number already exists." };
        }
      }
    }

    if (roomNo) sheet.getRange(rowIndex, ROOM_NO_COL + 1).setValue(roomNo);
    if (roomType !== undefined) sheet.getRange(rowIndex, ROOM_TYPE_COL + 1).setValue(roomType);
    if (roomRate !== undefined) sheet.getRange(rowIndex, ROOM_RATE_COL + 1).setValue(parseFloat(roomRate) || 0);
    if (roomStatus !== undefined) sheet.getRange(rowIndex, ROOM_STATUS_COL + 1).setValue(roomStatus);

    return { success: true, message: "Room updated successfully." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateRoomStatus(roomNo, newStatus) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if ((data[i][ROOM_NO_COL] || "").toString().trim() === roomNo.toString().trim()) {
        sheet.getRange(i + 1, ROOM_STATUS_COL + 1).setValue(newStatus);
        logActivity('System', 'ROOM_STATUS', 'Room ' + roomNo + ' status changed to ' + newStatus);
        return { success: true, message: "Room " + roomNo + " status updated to " + newStatus + "." };
      }
    }
    return { success: false, message: "Room not found." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getActiveBookingByRoom(roomNo) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const bRoomNo = (data[i][BOOKING_ROOM_NO_COL] || "").toString().trim();
      const status = (data[i][BOOKING_STATUS_COL] || "").toString().toLowerCase();
      if (bRoomNo === roomNo.toString().trim() && (status === 'booked' || status === 'checked in')) {
        return {
          rowIndex: i + 1,
          TicketID: (data[i][TICKET_ID_COL] || "").toString(),
          RoomNo: bRoomNo,
          GuestName: (data[i][GUEST_NAME_COL] || "").toString(),
          Phone: (data[i][PHONE_COL] || "").toString(),
          Email: (data[i][EMAIL_COL] || "").toString(),
          City: (data[i][CITY_COL] || "").toString(),
          CheckIn: data[i][CHECK_IN_COL],
          CheckOut: data[i][CHECK_OUT_COL],
          Status: (data[i][BOOKING_STATUS_COL] || "").toString(),
          RoomRate: parseFloat(data[i][ROOM_RATE_BOOK_COL]) || 0,
          Discount: parseFloat(data[i][DISCOUNT_COL]) || 0,
          Tax: parseFloat(data[i][TAX_COL]) || 0,
          TotalAmount: parseFloat(data[i][TOTAL_AMOUNT_COL]) || 0,
          SpecialRequests: (data[i][SPECIAL_REQUESTS_COL] || "").toString(),
          EarlyCheckin: (data[i][EARLY_CHECKIN_COL] || "No").toString(),
          LateCheckout: (data[i][LATE_CHECKOUT_COL] || "No").toString(),
          ExtraCharges: parseFloat(data[i][EXTRA_CHARGES_COL]) || 0,
          PaymentStatus: (data[i][PAYMENT_STATUS_COL] || "Not Paid").toString(),
          PaidAmount: parseFloat(data[i][PAID_AMOUNT_COL]) || 0,
          PaymentMethod: (data[i][PAYMENT_METHOD_COL] || "").toString()
        };
      }
    }
    return null;
  } catch (e) {
    return { error: e.message };
  }
}

function deleteRoom(rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(ROOMS_SHEET_NAME);
    if (rowIndex <= 1) {
      return { success: false, message: "Cannot delete header row." };
    }
    sheet.deleteRow(rowIndex);
    logActivity('Admin', 'ROOM_DELETED', `Row: ${rowIndex}`);
    return { success: true, message: "Room deleted successfully." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/***************************************************
 * ACTIVITY LOGS
 ***************************************************/
function getActivityLogs(limit) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift();

    let logs = data.map((row, index) => ({
      rowIndex: index + 2,
      Timestamp: row[0],
      User: row[1],
      Action: row[2],
      Details: row[3]
    }));

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    // Limit results
    if (limit) {
      logs = logs.slice(0, limit);
    }

    return logs;
  } catch (e) {
    return { error: e.message };
  }
}

/***************************************************
 * PAYMENT METHODS MANAGEMENT
 ***************************************************/
function generatePaymentMethodId() {
  const prefix = "PM";
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${timestamp}${random}`;
}

function getPaymentMethods() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(PAYMENT_METHODS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    return data.map((row, index) => {
      const qrFileId = (row[PM_QR_CODE_COL] || '').toString();
      const qrCodeUrl = qrFileId ? 'https://drive.google.com/thumbnail?id=' + qrFileId + '&sz=w2000' : '';
      return {
        rowIndex: index + 2,
        id: row[PM_ID_COL],
        name: row[PM_NAME_COL],
        description: row[PM_DESCRIPTION_COL],
        accountName: row[PM_ACCOUNT_NAME_COL] || '',
        bankName: row[PM_BANK_NAME_COL] || '',
        accountNo: row[PM_ACCOUNT_NO_COL] || '',
        qrCode: qrCodeUrl,
        qrCodeFileId: qrFileId,
        status: row[PM_STATUS_COL],
        createdAt: row[PM_CREATED_AT_COL]
      };
    });
  } catch (e) {
    return { error: e.message };
  }
}

// Get only active payment methods for user booking
function getActivePaymentMethods() {
  try {
    const methods = getPaymentMethods();
    if (methods.error) return methods;
    return methods.filter(m => m.status === 'Active');
  } catch (e) {
    return { error: e.message };
  }
}

function addPaymentMethod(name, description, accountName, bankName, accountNo, qrCodeData, qrCodeFileName, qrCodeMimeType) {
  try {
    if (!name) return { success: false, message: 'Payment method name is required' };

    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(PAYMENT_METHODS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Payment Methods sheet not found' };

    // Check for duplicate name
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][PM_NAME_COL].toString().toLowerCase() === name.toLowerCase()) {
        return { success: false, message: 'Payment method with this name already exists' };
      }
    }

    // Upload QR code if provided
    let qrCodeFileId = '';
    if (qrCodeData && qrCodeFileName) {
      const uploadResult = uploadIdCardImage(qrCodeData, qrCodeFileName, qrCodeMimeType || 'image/png');
      if (uploadResult.success) {
        qrCodeFileId = uploadResult.fileId;
      }
    }

    const pmId = generatePaymentMethodId();
    sheet.appendRow([
      pmId,
      name,
      description || '',
      accountName || '',
      bankName || '',
      accountNo || '',
      qrCodeFileId,
      'Active',
      new Date().toISOString()
    ]);

    logActivity('Admin', 'PAYMENT_METHOD_ADDED', `Name: ${name}`);
    return { success: true, message: 'Payment method added successfully', id: pmId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updatePaymentMethod(rowIndex, name, description, accountName, bankName, accountNo, qrCodeData, qrCodeFileName, qrCodeMimeType, status) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(PAYMENT_METHODS_SHEET_NAME);
    if (rowIndex <= 1) return { success: false, message: 'Invalid row index' };

    if (name) sheet.getRange(rowIndex, PM_NAME_COL + 1).setValue(name);
    if (description !== undefined) sheet.getRange(rowIndex, PM_DESCRIPTION_COL + 1).setValue(description);
    if (accountName !== undefined) sheet.getRange(rowIndex, PM_ACCOUNT_NAME_COL + 1).setValue(accountName);
    if (bankName !== undefined) sheet.getRange(rowIndex, PM_BANK_NAME_COL + 1).setValue(bankName);
    if (accountNo !== undefined) sheet.getRange(rowIndex, PM_ACCOUNT_NO_COL + 1).setValue(accountNo);

    // Upload new QR code if provided
    if (qrCodeData && qrCodeFileName) {
      const uploadResult = uploadIdCardImage(qrCodeData, qrCodeFileName, qrCodeMimeType || 'image/png');
      if (uploadResult.success) {
        sheet.getRange(rowIndex, PM_QR_CODE_COL + 1).setValue(uploadResult.fileId);
      }
    }

    if (status) sheet.getRange(rowIndex, PM_STATUS_COL + 1).setValue(status);

    return { success: true, message: 'Payment method updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deletePaymentMethod(rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(PAYMENT_METHODS_SHEET_NAME);
    if (rowIndex <= 1) return { success: false, message: 'Cannot delete header row' };

    sheet.deleteRow(rowIndex);
    logActivity('Admin', 'PAYMENT_METHOD_DELETED', `Row: ${rowIndex}`);
    return { success: true, message: 'Payment method deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * TRANSACTIONS MANAGEMENT (JSON Format Per Date)
 ***************************************************/
function generateTransactionId() {
  const prefix = "TXN";
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${timestamp}${random}`;
}

function getDateString(date) {
  // Returns full ISO 8601 format for the start of the day (midnight UTC)
  const d = date instanceof Date ? date : new Date(date);
  // Get just the date part and create a midnight UTC timestamp
  const dateOnly = d.toISOString().split('T')[0];
  return dateOnly + 'T00:00:00.000Z';
}

function getTransactions(dateFrom, dateTo) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    let allTransactions = [];

    data.forEach((row, index) => {
      const rowDate = row[TXN_DATE_COL];
      const rowDateObj = new Date(rowDate);

      // Filter by date range if provided
      if (fromDate && rowDateObj < fromDate) return;
      if (toDate && rowDateObj > toDate) return;

      try {
        const transactions = JSON.parse(row[TXN_DATA_COL] || '[]');
        transactions.forEach(txn => {
          allTransactions.push({
            ...txn,
            // Keep date as row key for update/delete operations (full ISO format)
            date: rowDate,
            // Ensure createdAt is always ISO format
            createdAt: txn.createdAt || rowDate,
            sheetRowIndex: index + 2
          });
        });
      } catch (parseError) {
        Logger.log('Error parsing transactions for date ' + rowDate + ': ' + parseError);
      }
    });

    // Sort by createdAt descending
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return allTransactions;
  } catch (e) {
    return { error: e.message };
  }
}

function getTransactionsByDate(date) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (!sheet) return [];

    const dateStr = getDateString(date);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      // Compare dates by converting both to the same format
      const rowDateStr = getDateString(data[i][TXN_DATE_COL]);
      if (rowDateStr === dateStr) {
        try {
          return JSON.parse(data[i][TXN_DATA_COL] || '[]');
        } catch {
          return [];
        }
      }
    }
    return [];
  } catch (e) {
    return { error: e.message };
  }
}

function addTransaction(transactionData, user) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Transactions sheet not found' };

    const txnId = generateTransactionId();
    const now = new Date();
    const dateStr = getDateString(now); // Full ISO format: 2026-01-26T00:00:00.000Z

    const newTransaction = {
      txnId: txnId,
      ticketId: transactionData.ticketId || '',
      guestName: transactionData.guestName || '',
      roomNo: transactionData.roomNo || '',
      amount: parseFloat(transactionData.amount) || 0,
      paymentMethod: transactionData.paymentMethod || 'Cash',
      type: transactionData.type || 'Payment',
      notes: transactionData.notes || '',
      createdBy: user || 'System',
      createdAt: now.toISOString()
    };

    // Find if row for today exists
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      // Compare dates by converting both to the same format
      const rowDateStr = getDateString(data[i][TXN_DATE_COL]);
      if (rowDateStr === dateStr) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // Append to existing JSON array for today
      let existingTransactions = [];
      try {
        existingTransactions = JSON.parse(data[rowIndex - 1][TXN_DATA_COL] || '[]');
      } catch {
        existingTransactions = [];
      }
      existingTransactions.push(newTransaction);
      sheet.getRange(rowIndex, TXN_DATA_COL + 1).setValue(JSON.stringify(existingTransactions));
    } else {
      // Create new row for today with full ISO date
      sheet.appendRow([dateStr, JSON.stringify([newTransaction])]);
    }

    logActivity(user || 'System', 'TRANSACTION_ADDED', `TxnID: ${txnId}, Amount: ${newTransaction.amount}, Method: ${newTransaction.paymentMethod}`);

    return { success: true, message: 'Transaction recorded successfully', txnId: txnId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteTransaction(date, txnId) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Transactions sheet not found' };

    const dateStr = getDateString(date);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      // Compare dates by converting both to the same format
      const rowDateStr = getDateString(data[i][TXN_DATE_COL]);
      if (rowDateStr === dateStr) {
        let transactions = [];
        try {
          transactions = JSON.parse(data[i][TXN_DATA_COL] || '[]');
        } catch {
          return { success: false, message: 'Error parsing transactions' };
        }

        const filteredTransactions = transactions.filter(t => t.txnId !== txnId);

        if (filteredTransactions.length === transactions.length) {
          return { success: false, message: 'Transaction not found' };
        }

        if (filteredTransactions.length === 0) {
          // Delete the entire row if no transactions left
          sheet.deleteRow(i + 1);
        } else {
          sheet.getRange(i + 1, TXN_DATA_COL + 1).setValue(JSON.stringify(filteredTransactions));
        }

        logActivity('Admin', 'TRANSACTION_DELETED', `TxnID: ${txnId}`);
        return { success: true, message: 'Transaction deleted successfully' };
      }
    }

    return { success: false, message: 'Date not found in transactions' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * BOOKING PAYMENT STATUS MANAGEMENT
 ***************************************************/
function updateBookingPaymentStatus(ticketId, paymentStatus, paidAmount, paymentMethod, user, autoCreateTransaction) {
  try {
    const bookingsSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    const data = bookingsSheet.getDataRange().getValues();

    let bookingRowIndex = -1;
    let bookingData = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][TICKET_ID_COL].toString() === ticketId.toString()) {
        bookingRowIndex = i + 1;
        bookingData = {
          ticketId: data[i][TICKET_ID_COL],
          roomNo: data[i][BOOKING_ROOM_NO_COL],
          guestName: data[i][GUEST_NAME_COL],
          totalAmount: data[i][TOTAL_AMOUNT_COL],
          currentPaidAmount: parseFloat(data[i][PAID_AMOUNT_COL]) || 0
        };
        break;
      }
    }

    if (bookingRowIndex === -1) {
      return { success: false, message: 'Booking not found' };
    }

    const newPaidAmount = parseFloat(paidAmount) || 0;
    const totalAmount = parseFloat(bookingData.totalAmount) || 0;

    // Update payment status and paid amount
    bookingsSheet.getRange(bookingRowIndex, PAYMENT_STATUS_COL + 1).setValue(paymentStatus);
    bookingsSheet.getRange(bookingRowIndex, PAID_AMOUNT_COL + 1).setValue(newPaidAmount);

    // If payment method provided, update it too
    if (paymentMethod) {
      bookingsSheet.getRange(bookingRowIndex, PAYMENT_METHOD_COL + 1).setValue(paymentMethod);
    }

    // Auto-create transaction if requested and there's an amount difference
    if (autoCreateTransaction && newPaidAmount > bookingData.currentPaidAmount) {
      const transactionAmount = newPaidAmount - bookingData.currentPaidAmount;
      addTransaction({
        ticketId: bookingData.ticketId,
        guestName: bookingData.guestName,
        roomNo: bookingData.roomNo,
        amount: transactionAmount,
        paymentMethod: paymentMethod || 'Cash',
        type: paymentStatus === 'Paid' ? 'Full Payment' : 'Partial Payment',
        notes: `Payment for booking ${ticketId}`
      }, user);
    }

    logActivity(user || 'System', 'PAYMENT_STATUS_UPDATED', `Ticket: ${ticketId}, Status: ${paymentStatus}, Amount: ${newPaidAmount}`);

    return { success: true, message: 'Payment status updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getTransactionStats() {
  try {
    const transactions = getTransactions();
    if (transactions.error) return transactions;

    const stats = {};
    let totalAmount = 0;
    let totalCount = 0;

    transactions.forEach(txn => {
      const method = txn.paymentMethod || 'Unknown';
      if (!stats[method]) {
        stats[method] = { count: 0, amount: 0 };
      }
      stats[method].count++;
      stats[method].amount += parseFloat(txn.amount) || 0;
      totalAmount += parseFloat(txn.amount) || 0;
      totalCount++;
    });

    return {
      byMethod: stats,
      totalAmount: totalAmount,
      totalCount: totalCount
    };
  } catch (e) {
    return { error: e.message };
  }
}

/***************************************************
 * GET BOOKINGS FOR DROPDOWN (Searchable)
 * Returns all bookings (current + past) for transaction linking
 ***************************************************/
function getBookingsForDropdown() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(BOOKINGS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    data.shift(); // Remove header
    let bookings = [];

    data.forEach((row, index) => {
      const ticketId = (row[TICKET_ID_COL] || '').toString();
      const guestName = (row[GUEST_NAME_COL] || '').toString();
      const roomNo = (row[BOOKING_ROOM_NO_COL] || '').toString();
      const status = (row[BOOKING_STATUS_COL] || '').toString();
      const checkIn = row[CHECK_IN_COL];
      const checkOut = row[CHECK_OUT_COL];
      const totalAmount = parseFloat(row[TOTAL_AMOUNT_COL]) || 0;
      const paidAmount = parseFloat(row[PAID_AMOUNT_COL]) || 0;
      const paymentStatus = row[PAYMENT_STATUS_COL] || 'Not Paid';
      const phone = (row[PHONE_COL] || '').toString();
      const email = (row[EMAIL_COL] || '').toString();

      if (ticketId && guestName) {
        bookings.push({
          ticketId: ticketId,
          guestName: guestName,
          roomNo: roomNo,
          phone: phone,
          email: email,
          status: status,
          checkIn: checkIn ? new Date(checkIn).toISOString() : '',
          checkOut: checkOut ? new Date(checkOut).toISOString() : '',
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          balance: totalAmount - paidAmount,
          paymentStatus: paymentStatus,
          displayText: `${guestName} - Room ${roomNo} (${ticketId})`,
          rowIndex: index + 2
        });
      }
    });

    // Sort by check-in date descending (most recent first)
    bookings.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

    return bookings;
  } catch (e) {
    Logger.log('Error in getBookingsForDropdown: ' + e.toString());
    return { error: e.message };
  }
}

/***************************************************
 * UPDATE TRANSACTION
 ***************************************************/
function updateTransaction(date, txnId, updatedData, user) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(TRANSACTIONS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Transactions sheet not found' };

    const dateStr = getDateString(date);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      // Compare dates by converting both to the same format
      const rowDateStr = getDateString(data[i][TXN_DATE_COL]);
      if (rowDateStr === dateStr) {
        let transactions = [];
        try {
          transactions = JSON.parse(data[i][TXN_DATA_COL] || '[]');
        } catch {
          return { success: false, message: 'Error parsing transactions' };
        }

        const txnIndex = transactions.findIndex(t => t.txnId === txnId);
        if (txnIndex === -1) {
          return { success: false, message: 'Transaction not found' };
        }

        // Update the transaction while preserving original creation info
        transactions[txnIndex] = {
          ...transactions[txnIndex],
          ticketId: updatedData.ticketId || transactions[txnIndex].ticketId,
          guestName: updatedData.guestName || transactions[txnIndex].guestName,
          roomNo: updatedData.roomNo || transactions[txnIndex].roomNo,
          amount: parseFloat(updatedData.amount) || transactions[txnIndex].amount,
          paymentMethod: updatedData.paymentMethod || transactions[txnIndex].paymentMethod,
          type: updatedData.type || transactions[txnIndex].type,
          notes: updatedData.notes !== undefined ? updatedData.notes : transactions[txnIndex].notes,
          updatedBy: user || 'System',
          updatedAt: new Date().toISOString()
        };

        sheet.getRange(i + 1, TXN_DATA_COL + 1).setValue(JSON.stringify(transactions));
        logActivity(user || 'System', 'TRANSACTION_UPDATED', `TxnID: ${txnId}, Amount: ${updatedData.amount}`);

        return { success: true, message: 'Transaction updated successfully' };
      }
    }

    return { success: false, message: 'Transaction date not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================
// CONTACT MESSAGES
// ============================================

/**
 * Save contact message from website form to Google Sheet
 */
function saveContactMessage(formData) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(CONTACT_MESSAGES_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(CONTACT_MESSAGES_SHEET_NAME);
      sheet.appendRow(['Message ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Created At', 'Replied At', 'Notes']);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
    }

    // Generate message ID
    const msgId = 'MSG' + Date.now().toString().slice(-8);
    const now = new Date().toISOString();

    // Append the message
    sheet.appendRow([
      msgId,
      formData.name || '',
      formData.email || '',
      formData.phone || '',
      formData.subject || 'No Subject',
      formData.message || '',
      'New',
      now,
      '',
      ''
    ]);

    // Log the activity
    logActivity('Website Visitor', 'CONTACT_MESSAGE', `New message from ${formData.name} (${formData.email})`);

    return { success: true, message: 'Message sent successfully', messageId: msgId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get all contact messages (Admin only)
 */
function getContactMessages() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CONTACT_MESSAGES_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    return data.map((row, index) => ({
      rowIndex: index + 2,
      messageId: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      subject: row[4],
      message: row[5],
      status: row[6],
      createdAt: row[7],
      repliedAt: row[8],
      notes: row[9]
    }));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Update contact message status
 */
function updateContactMessageStatus(rowIndex, status, notes) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CONTACT_MESSAGES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    sheet.getRange(rowIndex, 7).setValue(status); // Status column
    if (notes) sheet.getRange(rowIndex, 10).setValue(notes); // Notes column
    if (status === 'Replied') {
      sheet.getRange(rowIndex, 9).setValue(new Date().toISOString()); // Replied At
    }

    return { success: true, message: 'Status updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============================================
// FOOD ORDERING SYSTEM
// ============================================

// Food Menu columns (0-based)
const FOOD_ID_COL = 0;
const FOOD_NAME_COL = 1;
const FOOD_DESC_COL = 2;
const FOOD_CATEGORY_COL = 3;
const FOOD_PRICE_COL = 4;
const FOOD_IMAGE_COL = 5;
const FOOD_STOCK_COL = 6;
const FOOD_STATUS_COL = 7; // Available, Out of Stock, Cooking
const FOOD_CREATED_COL = 8;

// Food Orders columns (date-based storage like transactions)
const FOOD_ORDER_DATE_COL = 0;
const FOOD_ORDER_DATA_COL = 1;

/**
 * Get food menu items (for users - only available items with stock)
 */
function getFoodMenu() {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(FOOD_MENU_SHEET_NAME);

    // Create sheet with demo data if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(FOOD_MENU_SHEET_NAME);
      sheet.appendRow(['Item ID', 'Name', 'Description', 'Category', 'Price', 'Image', 'Stock', 'Status', 'Created At']);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);

      // Add demo food items with stock
      const now = new Date().toISOString();
      const demoItems = [
        ['FOOD001', 'Chicken Biryani', 'Aromatic basmati rice with tender chicken pieces', 'Main Course', 12.99, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 50, 'Available', now],
        ['FOOD002', 'Beef Burger', 'Juicy beef patty with fresh vegetables', 'Fast Food', 8.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 30, 'Available', now],
        ['FOOD003', 'Caesar Salad', 'Fresh romaine lettuce with caesar dressing', 'Salads', 6.99, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', 25, 'Available', now],
        ['FOOD004', 'Margherita Pizza', 'Classic pizza with tomato and mozzarella', 'Pizza', 14.99, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', 20, 'Available', now],
        ['FOOD005', 'Grilled Salmon', 'Fresh salmon with herbs and lemon', 'Seafood', 18.99, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', 15, 'Available', now],
        ['FOOD006', 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 'Pasta', 11.99, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', 25, 'Available', now],
        ['FOOD007', 'French Fries', 'Crispy golden fries with dipping sauce', 'Sides', 4.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', 100, 'Available', now],
        ['FOOD008', 'Chocolate Cake', 'Rich chocolate layer cake', 'Desserts', 5.99, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', 20, 'Available', now],
        ['FOOD009', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 'Beverages', 3.99, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', 50, 'Available', now],
        ['FOOD010', 'Coffee', 'Premium arabica coffee', 'Beverages', 2.99, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400', 100, 'Available', now],
        ['FOOD011', 'Club Sandwich', 'Triple-decker sandwich with chicken and bacon', 'Sandwiches', 9.99, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', 30, 'Available', now],
        ['FOOD012', 'Mango Smoothie', 'Fresh mango blended with yogurt', 'Beverages', 4.99, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', 40, 'Available', now]
      ];
      demoItems.forEach(item => sheet.appendRow(item));
    }

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    return data.filter(row => {
      const stock = parseInt(row[FOOD_STOCK_COL]);
      return row[FOOD_STATUS_COL] === 'Available' && !isNaN(stock) && stock > 0;
    }).map(row => ({
      itemId: row[FOOD_ID_COL],
      name: row[FOOD_NAME_COL],
      description: row[FOOD_DESC_COL],
      category: row[FOOD_CATEGORY_COL],
      price: parseFloat(row[FOOD_PRICE_COL]) || 0,
      image: row[FOOD_IMAGE_COL],
      stock: parseInt(row[FOOD_STOCK_COL]) || 0,
      status: row[FOOD_STATUS_COL]
    }));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get all food menu items (for admin - including out of stock)
 */
function getAllFoodMenuItems() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_MENU_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift();

    return data.map((row, index) => ({
      rowIndex: index + 2,
      itemId: row[FOOD_ID_COL],
      name: row[FOOD_NAME_COL],
      description: row[FOOD_DESC_COL],
      category: row[FOOD_CATEGORY_COL],
      price: parseFloat(row[FOOD_PRICE_COL]) || 0,
      image: row[FOOD_IMAGE_COL],
      stock: parseInt(row[FOOD_STOCK_COL]) || 0,
      status: row[FOOD_STATUS_COL],
      createdAt: row[FOOD_CREATED_COL]
    }));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Add food item (Admin)
 */
function addFoodItem(itemData) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_MENU_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const itemId = 'FOOD' + Date.now().toString().slice(-6);
    const now = new Date().toISOString();

    sheet.appendRow([
      itemId,
      itemData.name || '',
      itemData.description || '',
      itemData.category || 'Other',
      parseFloat(itemData.price) || 0,
      itemData.image || '',
      parseInt(itemData.stock) || 0,
      itemData.status || 'Available',
      now
    ]);

    logActivity('Admin', 'FOOD_ITEM_ADDED', `${itemData.name} (${itemId})`);
    return { success: true, message: 'Food item added successfully', itemId: itemId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Update food item (Admin)
 */
function updateFoodItem(rowIndex, itemData) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_MENU_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    sheet.getRange(rowIndex, FOOD_NAME_COL + 1).setValue(itemData.name);
    sheet.getRange(rowIndex, FOOD_DESC_COL + 1).setValue(itemData.description);
    sheet.getRange(rowIndex, FOOD_CATEGORY_COL + 1).setValue(itemData.category);
    sheet.getRange(rowIndex, FOOD_PRICE_COL + 1).setValue(parseFloat(itemData.price) || 0);
    sheet.getRange(rowIndex, FOOD_IMAGE_COL + 1).setValue(itemData.image);
    sheet.getRange(rowIndex, FOOD_STOCK_COL + 1).setValue(parseInt(itemData.stock) || 0);
    sheet.getRange(rowIndex, FOOD_STATUS_COL + 1).setValue(itemData.status);

    logActivity('Admin', 'FOOD_ITEM_UPDATED', itemData.name);
    return { success: true, message: 'Food item updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Delete food item (Admin)
 */
function deleteFoodItem(rowIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_MENU_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const itemName = sheet.getRange(rowIndex, FOOD_NAME_COL + 1).getValue();
    sheet.deleteRow(rowIndex);

    logActivity('Admin', 'FOOD_ITEM_DELETED', itemName);
    return { success: true, message: 'Food item deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Update food stock quantity
 */
function updateFoodStock(rowIndex, newStock) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_MENU_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    sheet.getRange(rowIndex, FOOD_STOCK_COL + 1).setValue(parseInt(newStock) || 0);

    // Auto-update status based on stock
    if (parseInt(newStock) <= 0) {
      sheet.getRange(rowIndex, FOOD_STATUS_COL + 1).setValue('Out of Stock');
    }

    return { success: true, message: 'Stock updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Place a food order (Date-based storage like transactions)
 */
function placeFoodOrder(orderData) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(FOOD_ORDERS_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(FOOD_ORDERS_SHEET_NAME);
      sheet.appendRow(['Date', 'Orders JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
    }

    const orderId = 'ORD' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z'; // Full ISO format

    // Handle Payment Screenshot upload (if Pay Now)
    let paymentScreenshotUrl = '';
    if (orderData.paymentScreenshotData) {
      const screenshotResult = uploadIdCardImage(
        orderData.paymentScreenshotData,
        `${orderId}_FOOD_PAYMENT_${Date.now()}.${orderData.paymentScreenshotExt || 'jpg'}`,
        orderData.paymentScreenshotMime || 'image/jpeg'
      );
      if (screenshotResult.success) {
        paymentScreenshotUrl = screenshotResult.viewUrl;
      }
    }

    const newOrder = {
      orderId: orderId,
      roomNo: orderData.roomNo || '',
      guestName: orderData.guestName || '',
      guestEmail: orderData.guestEmail || '',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      paymentType: orderData.paymentType || 'Add to Bill',
      paymentMethod: orderData.paymentMethod || '',
      transactionId: orderData.transactionId || '',
      paymentScreenshotUrl: paymentScreenshotUrl,
      paymentStatus: orderData.paymentType === 'Pay Now' ? 'Paid' : 'Unpaid',
      status: orderData.isAdminOrder ? 'Pending' : 'Awaiting Approval',
      notes: orderData.notes || '',
      createdAt: now.toISOString(),
      completedAt: '',
      completedBy: ''
    };

    // Find or create date row
    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][FOOD_ORDER_DATE_COL] === dateKey) {
        dateRowIndex = i + 1;
        break;
      }
    }

    if (dateRowIndex > 0) {
      // Add to existing date's orders
      const existingOrders = JSON.parse(data[dateRowIndex - 1][FOOD_ORDER_DATA_COL] || '[]');
      existingOrders.push(newOrder);
      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(existingOrders));
    } else {
      // Create new date row
      sheet.appendRow([dateKey, JSON.stringify([newOrder])]);
    }

    // Validate stock availability BEFORE placing order
    const menuSheet = ss.getSheetByName(FOOD_MENU_SHEET_NAME);
    if (menuSheet) {
      const menuData = menuSheet.getDataRange().getValues();

      // First, check if all items have sufficient stock
      for (const item of orderData.items) {
        let stockAvailable = false;
        for (let i = 1; i < menuData.length; i++) {
          if (menuData[i][FOOD_ID_COL] === item.itemId) {
            const currentStock = parseInt(menuData[i][FOOD_STOCK_COL]) || 0;
            if (currentStock < item.qty) {
              return { success: false, message: `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.qty}` };
            }
            stockAvailable = true;
            break;
          }
        }
        if (!stockAvailable) {
          return { success: false, message: `Item ${item.name} not found in menu` };
        }
      }

      // Now decrease stock for ordered items
      for (const item of orderData.items) {
        for (let i = 1; i < menuData.length; i++) {
          if (menuData[i][FOOD_ID_COL] === item.itemId) {
            const currentStock = parseInt(menuData[i][FOOD_STOCK_COL]) || 0;
            const newStock = Math.max(0, currentStock - item.qty);
            menuSheet.getRange(i + 1, FOOD_STOCK_COL + 1).setValue(newStock);
            if (newStock <= 0) {
              menuSheet.getRange(i + 1, FOOD_STATUS_COL + 1).setValue('Out of Stock');
            }
            break;
          }
        }
      }
    }

    logActivity(orderData.guestEmail || 'Guest', 'FOOD_ORDER_PLACED', `Order ${orderId} - $${orderData.totalAmount}`);

    // Auto-create transaction for Pay Now food orders
    if (orderData.paymentType === 'Pay Now' && orderData.totalAmount > 0) {
      addTransaction({
        ticketId: orderId,
        guestName: orderData.guestName || 'Guest',
        roomNo: orderData.roomNo || '',
        amount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod || 'Unknown',
        type: 'Food Order Payment',
        notes: 'Food order ' + orderId + (orderData.transactionId ? ' | TxnID: ' + orderData.transactionId : '')
      }, orderData.guestEmail || 'Guest');
    }

    // Send food order confirmation email
    if (orderData.guestEmail) {
      try {
        const itemsList = (orderData.items || []).map(function(item) {
          return item.name + ' x ' + item.qty;
        }).join(', ');

        const foodTableRows = [
          { label: 'Order ID', value: orderId },
          { label: 'Room No.', value: orderData.roomNo || 'N/A' },
          { label: 'Items', value: itemsList || 'N/A' },
          { label: 'Total Amount', value: '$' + (parseFloat(orderData.totalAmount) || 0).toFixed(2) },
          { label: 'Payment Type', value: orderData.paymentType || 'Add to Bill' },
          { label: 'Order Time', value: now.toDateString() + ' ' + now.toLocaleTimeString() }
        ];
        if (orderData.paymentType === 'Pay Now' && orderData.paymentMethod) {
          foodTableRows.push({ label: 'Payment Method', value: orderData.paymentMethod });
          if (orderData.transactionId) {
            foodTableRows.push({ label: 'Transaction ID', value: orderData.transactionId });
          }
        }
        if (orderData.notes) {
          foodTableRows.push({ label: 'Notes', value: orderData.notes });
        }

        const isAdminOrder = orderData.isAdminOrder === true;
        const emailTitle = isAdminOrder ? 'Food Order Confirmation' : 'Food Order Received';
        const emailIntro = isAdminOrder
          ? 'Your food order has been placed successfully and is being prepared.'
          : 'Your food order has been received and is awaiting admin approval. You will be notified once it is approved.';
        const emailFooter = isAdminOrder ? 'Your order is being prepared. Thank you!' : 'You will receive a notification once your order is approved.';

        const foodEmailHtml = generateEmailHtml({
          title: emailTitle,
          greeting: 'Hello ' + (orderData.guestName || 'Guest') + ',',
          introText: emailIntro,
          tableRows: foodTableRows,
          footerText: emailFooter
        });

        const foodPlainText = 'Hello ' + (orderData.guestName || 'Guest') + ',\n\nYour food order ' + orderId + ' has been placed.\nItems: ' + itemsList + '\nTotal: $' + (parseFloat(orderData.totalAmount) || 0).toFixed(2) + '\n\n- Hotel Management';
        MailApp.sendEmail({ to: orderData.guestEmail, subject: 'Food Order Confirmation - ' + orderId, body: foodPlainText, htmlBody: foodEmailHtml });
      } catch (emailErr) {
        Logger.log('Food order email error: ' + emailErr.message);
      }
    }

    const successMsg = orderData.isAdminOrder
      ? 'Order placed successfully!'
      : 'Order submitted! Awaiting admin approval.';
    return { success: true, message: successMsg, orderId: orderId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get staff's assigned rooms
 */
function getStaffAssignedRooms(staffEmail) {
  try {
    const loginSheet = SpreadsheetApp.openById(SS_ID).getSheetByName(LOGIN_SHEET_NAME);
    const data = loginSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][LOGIN_USERNAME_COL].toString().toLowerCase() === staffEmail.toLowerCase()) {
        const assignedRooms = (data[i][LOGIN_ASSIGNED_ROOMS_COL] || '').toString().trim();
        if (assignedRooms) {
          return assignedRooms.split(',').map(r => r.trim());
        }
        return []; // No rooms assigned means all rooms
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Get all orders from date-based storage
 */
function getAllFoodOrdersFromStorage() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    let allOrders = [];
    data.forEach((row, dateIndex) => {
      const orders = JSON.parse(row[FOOD_ORDER_DATA_COL] || '[]');
      orders.forEach((order, orderIndex) => {
        allOrders.push({
          ...order,
          dateKey: row[FOOD_ORDER_DATE_COL],
          dateRowIndex: dateIndex + 2,
          orderIndex: orderIndex
        });
      });
    });

    return allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get food orders for staff (Pending orders - filtered by assigned rooms)
 */
function getPendingFoodOrders(staffEmail) {
  try {
    const allOrders = getAllFoodOrdersFromStorage();
    if (allOrders.error) return allOrders;

    const assignedRooms = getStaffAssignedRooms(staffEmail);

    return allOrders
      .filter(order => {
        // Filter by pending status
        if (order.status !== 'Pending') return false;

        // If no rooms assigned, show all orders
        if (assignedRooms.length === 0) return true;

        // Filter by assigned rooms
        return assignedRooms.includes(order.roomNo.toString());
      });
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get all food orders (for admin/history)
 */
function getAllFoodOrders() {
  try {
    return getAllFoodOrdersFromStorage();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get food orders filtered by staff's assigned rooms (for FoodStaff history)
 */
function getStaffFoodOrders(staffEmail) {
  try {
    const allOrders = getAllFoodOrdersFromStorage();
    if (allOrders.error) return allOrders;

    const assignedRooms = getStaffAssignedRooms(staffEmail);
    if (assignedRooms.length === 0) return allOrders;

    return allOrders.filter(order => assignedRooms.includes(order.roomNo.toString()));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Mark food order as complete
 */
function completeFoodOrder(dateRowIndex, orderIndex, staffEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const ordersJson = sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).getValue();
    const orders = JSON.parse(ordersJson || '[]');

    if (orderIndex >= 0 && orderIndex < orders.length) {
      if (orders[orderIndex].status === 'Completed') {
        return { success: false, message: 'Order is already completed' };
      }
      orders[orderIndex].status = 'Completed';
      orders[orderIndex].completedAt = new Date().toISOString();
      orders[orderIndex].completedBy = staffEmail;

      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(orders));

      logActivity(staffEmail, 'FOOD_ORDER_COMPLETED', `Order ${orders[orderIndex].orderId} marked as completed`);

      return { success: true, message: 'Order marked as completed' };
    }

    return { success: false, message: 'Order not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Approve food order - Admin approves, order goes to food staff
 */
function approveFoodOrder(dateRowIndex, orderIndex, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const ordersJson = sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).getValue();
    const orders = JSON.parse(ordersJson || '[]');

    if (orderIndex >= 0 && orderIndex < orders.length) {
      if (orders[orderIndex].status !== 'Awaiting Approval') {
        return { success: false, message: 'This order is not awaiting approval. Current status: ' + orders[orderIndex].status };
      }
      orders[orderIndex].status = 'Pending';
      orders[orderIndex].approvedBy = adminEmail;
      orders[orderIndex].approvedAt = new Date().toISOString();

      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(orders));

      logActivity(adminEmail, 'FOOD_ORDER_APPROVED', 'Order ' + orders[orderIndex].orderId + ' approved for Room ' + orders[orderIndex].roomNo);

      return { success: true, message: 'Order ' + orders[orderIndex].orderId + ' approved and sent to kitchen.' };
    }

    return { success: false, message: 'Order not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Reject food order - Admin rejects the order
 */
function rejectFoodOrder(dateRowIndex, orderIndex, rejectionReason, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const ordersJson = sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).getValue();
    const orders = JSON.parse(ordersJson || '[]');

    if (orderIndex >= 0 && orderIndex < orders.length) {
      if (orders[orderIndex].status !== 'Awaiting Approval') {
        return { success: false, message: 'This order is not awaiting approval. Current status: ' + orders[orderIndex].status };
      }
      orders[orderIndex].status = 'Rejected';
      orders[orderIndex].rejectedBy = adminEmail;
      orders[orderIndex].rejectedAt = new Date().toISOString();
      orders[orderIndex].rejectionReason = rejectionReason || '';

      // Restore stock for rejected food orders
      const ss = SpreadsheetApp.openById(SS_ID);
      const menuSheet = ss.getSheetByName(FOOD_MENU_SHEET_NAME);
      if (menuSheet) {
        const menuData = menuSheet.getDataRange().getValues();
        for (const item of orders[orderIndex].items) {
          for (let i = 1; i < menuData.length; i++) {
            if (menuData[i][FOOD_ID_COL] === item.itemId) {
              const currentStock = parseInt(menuData[i][FOOD_STOCK_COL]) || 0;
              menuSheet.getRange(i + 1, FOOD_STOCK_COL + 1).setValue(currentStock + item.qty);
              if (menuData[i][FOOD_STATUS_COL] === 'Out of Stock') {
                menuSheet.getRange(i + 1, FOOD_STATUS_COL + 1).setValue('Available');
              }
              break;
            }
          }
        }
      }

      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(orders));

      logActivity(adminEmail, 'FOOD_ORDER_REJECTED', 'Order ' + orders[orderIndex].orderId + ' rejected. Reason: ' + (rejectionReason || 'N/A'));

      return { success: true, message: 'Order ' + orders[orderIndex].orderId + ' has been rejected.' };
    }

    return { success: false, message: 'Order not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get user's food orders (using date-based storage)
 */
function getUserFoodOrders(userEmail) {
  try {
    const allOrders = getAllFoodOrdersFromStorage();
    if (allOrders.error) return allOrders;

    return allOrders
      .filter(order => order.guestEmail.toLowerCase() === userEmail.toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Delete a food order (admin or user)
 */
function deleteFoodOrder(dateRowIndex, orderIndex, userEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const ordersJson = sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).getValue();
    const orders = JSON.parse(ordersJson || '[]');

    if (orderIndex < 0 || orderIndex >= orders.length) {
      return { success: false, message: 'Order not found' };
    }

    const deletedOrder = orders[orderIndex];
    orders.splice(orderIndex, 1);

    if (orders.length === 0) {
      sheet.deleteRow(dateRowIndex);
    } else {
      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(orders));
    }

    logActivity(userEmail, 'FOOD_ORDER_DELETED', 'Order ' + deletedOrder.orderId + ' for Room ' + deletedOrder.roomNo + ' deleted');

    return { success: true, message: 'Food order deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Edit a food order (admin only)
 */
function editFoodOrder(dateRowIndex, orderIndex, updatedData, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(FOOD_ORDERS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const ordersJson = sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).getValue();
    const orders = JSON.parse(ordersJson || '[]');

    if (orderIndex < 0 || orderIndex >= orders.length) {
      return { success: false, message: 'Order not found' };
    }

    orders[orderIndex].roomNo = updatedData.roomNo || orders[orderIndex].roomNo;
    orders[orderIndex].guestName = updatedData.guestName || orders[orderIndex].guestName;
    orders[orderIndex].guestEmail = updatedData.guestEmail || orders[orderIndex].guestEmail;
    if (updatedData.items && updatedData.items.length > 0) {
      orders[orderIndex].items = updatedData.items;
    }
    if (updatedData.totalAmount !== undefined) {
      orders[orderIndex].totalAmount = parseFloat(updatedData.totalAmount) || orders[orderIndex].totalAmount;
    }
    orders[orderIndex].paymentType = updatedData.paymentType || orders[orderIndex].paymentType;
    orders[orderIndex].notes = updatedData.notes !== undefined ? updatedData.notes : orders[orderIndex].notes;

    if (updatedData.status) {
      orders[orderIndex].status = updatedData.status;
      if (updatedData.status === 'Completed' && !orders[orderIndex].completedAt) {
        orders[orderIndex].completedAt = new Date().toISOString();
        orders[orderIndex].completedBy = adminEmail;
      }
      if (updatedData.status === 'Pending') {
        orders[orderIndex].completedAt = '';
        orders[orderIndex].completedBy = '';
      }
    }

    sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(orders));

    logActivity(adminEmail, 'FOOD_ORDER_EDITED', 'Order ' + orders[orderIndex].orderId + ' edited');

    return { success: true, message: 'Food order updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Admin add a food order (no booking required)
 */
function adminAddFoodOrder(orderData, adminEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(FOOD_ORDERS_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(FOOD_ORDERS_SHEET_NAME);
      sheet.appendRow(['Date', 'Orders JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 800);
    }

    const orderId = 'ORD' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const newOrder = {
      orderId: orderId,
      roomNo: orderData.roomNo || '',
      guestName: orderData.guestName || '',
      guestEmail: orderData.guestEmail || '',
      items: orderData.items || [],
      totalAmount: parseFloat(orderData.totalAmount) || 0,
      paymentType: orderData.paymentType || 'Cash',
      status: 'Pending',
      notes: orderData.notes || '',
      createdAt: now.toISOString(),
      completedAt: '',
      completedBy: ''
    };

    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][FOOD_ORDER_DATE_COL] === dateKey) {
        dateRowIndex = i + 1;
        break;
      }
    }

    if (dateRowIndex > 0) {
      const existingOrders = JSON.parse(data[dateRowIndex - 1][FOOD_ORDER_DATA_COL] || '[]');
      existingOrders.push(newOrder);
      sheet.getRange(dateRowIndex, FOOD_ORDER_DATA_COL + 1).setValue(JSON.stringify(existingOrders));
    } else {
      sheet.appendRow([dateKey, JSON.stringify([newOrder])]);
    }

    logActivity(adminEmail, 'FOOD_ORDER_ADMIN_ADDED', 'Order ' + orderId + ' for Room ' + orderData.roomNo + ' added by admin');

    return { success: true, message: 'Food order added successfully!', orderId: orderId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * CLEANING REQUESTS MANAGEMENT
 ***************************************************/

// Cleaning Requests columns (date-based storage like food orders)
const CLEANING_DATE_COL = 0;
const CLEANING_DATA_COL = 1;

/**
 * Request a cleaner (user)
 */
function requestCleaner(requestData) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(CLEANING_REQUESTS_SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(CLEANING_REQUESTS_SHEET_NAME);
      sheet.appendRow(['Date', 'Requests JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
    }

    const requestId = 'CLN' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z'; // Full ISO format

    const newRequest = {
      requestId: requestId,
      roomNo: requestData.roomNo || '',
      guestName: requestData.guestName || '',
      guestEmail: requestData.guestEmail || '',
      reason: requestData.reason || '',
      priority: requestData.priority || 'Normal',
      status: 'Pending',
      notes: requestData.notes || '',
      createdAt: now.toISOString(),
      completedAt: '',
      completedBy: ''
    };

    // Find or create date row
    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][CLEANING_DATE_COL] === dateKey) {
        dateRowIndex = i + 1;
        break;
      }
    }

    if (dateRowIndex > 0) {
      // Add to existing date's requests
      const existingRequests = JSON.parse(data[dateRowIndex - 1][CLEANING_DATA_COL] || '[]');
      existingRequests.push(newRequest);
      sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).setValue(JSON.stringify(existingRequests));
    } else {
      // Create new date row
      sheet.appendRow([dateKey, JSON.stringify([newRequest])]);
    }

    logActivity(requestData.guestEmail, 'CLEANING_REQUESTED', `Request ${requestId} for Room ${requestData.roomNo}`);

    // Send cleaning request confirmation email
    if (requestData.guestEmail) {
      try {
        const cleaningTableRows = [
          { label: 'Request ID', value: requestId },
          { label: 'Room No.', value: requestData.roomNo || 'N/A' },
          { label: 'Reason', value: requestData.reason || 'General Cleaning' },
          { label: 'Priority', value: requestData.priority || 'Normal' },
          { label: 'Submitted At', value: now.toDateString() + ' ' + now.toLocaleTimeString() }
        ];
        if (requestData.notes) {
          cleaningTableRows.push({ label: 'Notes', value: requestData.notes });
        }

        const cleaningEmailHtml = generateEmailHtml({
          title: 'Cleaning Request Received',
          greeting: 'Hello ' + (requestData.guestName || 'Guest') + ',',
          introText: 'Your cleaning request has been submitted. Our housekeeping team will attend to your room shortly.',
          tableRows: cleaningTableRows,
          footerText: 'Thank you for letting us know!'
        });

        const cleaningPlainText = 'Hello ' + (requestData.guestName || 'Guest') + ',\n\nYour cleaning request ' + requestId + ' for Room ' + requestData.roomNo + ' has been submitted.\nReason: ' + (requestData.reason || 'General Cleaning') + '\nPriority: ' + (requestData.priority || 'Normal') + '\n\nOur team will attend to it shortly.\n\n- Hotel Management';
        MailApp.sendEmail({ to: requestData.guestEmail, subject: 'Cleaning Request Received - ' + requestId, body: cleaningPlainText, htmlBody: cleaningEmailHtml });
      } catch (emailErr) {
        Logger.log('Cleaning request email error: ' + emailErr.message);
      }
    }

    return { success: true, message: 'Cleaning request submitted successfully!', requestId: requestId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get all cleaning requests from storage (helper function)
 */
function getAllCleaningRequestsFromStorage() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift(); // Remove header

    let allRequests = [];
    data.forEach((row, dateIndex) => {
      const requests = JSON.parse(row[CLEANING_DATA_COL] || '[]');
      requests.forEach((request, requestIndex) => {
        allRequests.push({
          ...request,
          dateKey: row[CLEANING_DATE_COL],
          dateRowIndex: dateIndex + 2,
          requestIndex: requestIndex
        });
      });
    });

    return allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get pending cleaning requests for cleaner (filtered by assigned rooms)
 */
function getPendingCleaningRequests(staffEmail) {
  try {
    const allRequests = getAllCleaningRequestsFromStorage();
    if (allRequests.error) return allRequests;

    const assignedRooms = getStaffAssignedRooms(staffEmail);

    return allRequests
      .filter(request => {
        // Filter by pending status
        if (request.status !== 'Pending') return false;

        // If no rooms assigned, show all requests
        if (assignedRooms.length === 0) return true;

        // Filter by assigned rooms
        return assignedRooms.includes(request.roomNo.toString());
      });
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get all cleaning requests (for admin/history)
 */
function getAllCleaningRequests() {
  try {
    return getAllCleaningRequestsFromStorage();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Get cleaning requests filtered by staff's assigned rooms (for Cleaner history)
 */
function getStaffCleaningRequests(staffEmail) {
  try {
    const allRequests = getAllCleaningRequestsFromStorage();
    if (allRequests.error) return allRequests;

    const assignedRooms = getStaffAssignedRooms(staffEmail);
    if (assignedRooms.length === 0) return allRequests;

    return allRequests.filter(request => assignedRooms.includes(request.roomNo.toString()));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Mark cleaning request as complete
 */
function completeCleaningRequest(dateRowIndex, requestIndex, staffEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const requestsJson = sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).getValue();
    const requests = JSON.parse(requestsJson || '[]');

    if (requestIndex >= 0 && requestIndex < requests.length) {
      if (requests[requestIndex].status === 'Completed') {
        return { success: false, message: 'Request is already completed' };
      }
      requests[requestIndex].status = 'Completed';
      requests[requestIndex].completedAt = new Date().toISOString();
      requests[requestIndex].completedBy = staffEmail;

      sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).setValue(JSON.stringify(requests));

      logActivity(staffEmail, 'CLEANING_COMPLETED', `Request ${requests[requestIndex].requestId} marked as completed`);

      return { success: true, message: 'Cleaning request marked as completed' };
    }

    return { success: false, message: 'Request not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Get user's cleaning requests
 */
function getUserCleaningRequests(userEmail) {
  try {
    const allRequests = getAllCleaningRequestsFromStorage();
    if (allRequests.error) return allRequests;

    return allRequests
      .filter(request => request.guestEmail.toLowerCase() === userEmail.toLowerCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Delete a cleaning request (admin or user)
 */
function deleteCleaningRequest(dateRowIndex, requestIndex, userEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const requestsJson = sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).getValue();
    const requests = JSON.parse(requestsJson || '[]');

    if (requestIndex < 0 || requestIndex >= requests.length) {
      return { success: false, message: 'Request not found' };
    }

    const deletedRequest = requests[requestIndex];
    requests.splice(requestIndex, 1);

    if (requests.length === 0) {
      sheet.deleteRow(dateRowIndex);
    } else {
      sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).setValue(JSON.stringify(requests));
    }

    logActivity(userEmail, 'CLEANING_DELETED', 'Request ' + deletedRequest.requestId + ' for Room ' + deletedRequest.roomNo + ' deleted');

    return { success: true, message: 'Cleaning request deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Edit a cleaning request (admin only)
 */
function editCleaningRequest(dateRowIndex, requestIndex, updatedData, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const requestsJson = sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).getValue();
    const requests = JSON.parse(requestsJson || '[]');

    if (requestIndex < 0 || requestIndex >= requests.length) {
      return { success: false, message: 'Request not found' };
    }

    requests[requestIndex].roomNo = updatedData.roomNo || requests[requestIndex].roomNo;
    requests[requestIndex].guestName = updatedData.guestName || requests[requestIndex].guestName;
    requests[requestIndex].guestEmail = updatedData.guestEmail || requests[requestIndex].guestEmail;
    requests[requestIndex].reason = updatedData.reason || requests[requestIndex].reason;
    requests[requestIndex].priority = updatedData.priority || requests[requestIndex].priority;
    requests[requestIndex].notes = updatedData.notes !== undefined ? updatedData.notes : requests[requestIndex].notes;

    if (updatedData.status) {
      requests[requestIndex].status = updatedData.status;
      if (updatedData.status === 'Completed' && !requests[requestIndex].completedAt) {
        requests[requestIndex].completedAt = new Date().toISOString();
        requests[requestIndex].completedBy = adminEmail;
      }
      if (updatedData.status === 'Pending') {
        requests[requestIndex].completedAt = '';
        requests[requestIndex].completedBy = '';
      }
    }

    sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).setValue(JSON.stringify(requests));

    logActivity(adminEmail, 'CLEANING_EDITED', 'Request ' + requests[requestIndex].requestId + ' edited');

    return { success: true, message: 'Cleaning request updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Admin add a cleaning request (no booking required)
 */
function adminAddCleaningRequest(requestData, adminEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(CLEANING_REQUESTS_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(CLEANING_REQUESTS_SHEET_NAME);
      sheet.appendRow(['Date', 'Requests JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 800);
    }

    const requestId = 'CLN' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const newRequest = {
      requestId: requestId,
      roomNo: requestData.roomNo || '',
      guestName: requestData.guestName || '',
      guestEmail: requestData.guestEmail || '',
      reason: requestData.reason || '',
      priority: requestData.priority || 'Normal',
      status: 'Pending',
      notes: requestData.notes || '',
      createdAt: now.toISOString(),
      completedAt: '',
      completedBy: ''
    };

    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][CLEANING_DATE_COL] === dateKey) {
        dateRowIndex = i + 1;
        break;
      }
    }

    if (dateRowIndex > 0) {
      const existingRequests = JSON.parse(data[dateRowIndex - 1][CLEANING_DATA_COL] || '[]');
      existingRequests.push(newRequest);
      sheet.getRange(dateRowIndex, CLEANING_DATA_COL + 1).setValue(JSON.stringify(existingRequests));
    } else {
      sheet.appendRow([dateKey, JSON.stringify([newRequest])]);
    }

    logActivity(adminEmail, 'CLEANING_ADMIN_ADDED', 'Request ' + requestId + ' for Room ' + requestData.roomNo + ' added by admin');

    return { success: true, message: 'Cleaning request added successfully!', requestId: requestId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/***************************************************
 * QUOTE MANAGEMENT
 ***************************************************/

function getAllQuotesFromStorage() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(QUOTES_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift();

    let allQuotes = [];
    data.forEach((row, dateIndex) => {
      const quotes = JSON.parse(row[QUOTES_DATA_COL] || '[]');
      quotes.forEach((quote, quoteIndex) => {
        allQuotes.push({
          ...quote,
          dateKey: row[QUOTES_DATE_COL],
          dateRowIndex: dateIndex + 2,
          quoteIndex: quoteIndex
        });
      });
    });

    return allQuotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

function getAllQuotes() {
  return getAllQuotesFromStorage();
}

function addQuote(quoteData, adminEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(QUOTES_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(QUOTES_SHEET_NAME);
      sheet.appendRow(['Date', 'Quotes JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 800);
    }

    const quoteId = 'QT' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const rooms = quoteData.rooms || [];
    const services = quoteData.services || [];
    const roomsTotal = rooms.reduce(function(s, r) { return s + (parseFloat(r.amount) || 0); }, 0);
    const servicesTotal = services.reduce(function(s, sv) { return s + (parseFloat(sv.amount) || 0); }, 0);
    const subtotal = roomsTotal + servicesTotal;
    const taxRate = parseFloat(quoteData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = parseFloat(quoteData.discount) || 0;
    const totalAmount = subtotal + taxAmount - discount;

    const newQuote = {
      quoteId: quoteId,
      guestName: quoteData.guestName || '',
      guestEmail: quoteData.guestEmail || '',
      guestPhone: quoteData.guestPhone || '',
      rooms: rooms,
      services: services,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discount: discount,
      totalAmount: totalAmount,
      notes: quoteData.notes || '',
      status: 'Draft',
      validUntil: quoteData.validUntil || '',
      createdAt: now.toISOString(),
      createdBy: adminEmail,
      convertedToInvoice: ''
    };

    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][QUOTES_DATE_COL] === dateKey) { dateRowIndex = i + 1; break; }
    }

    if (dateRowIndex > 0) {
      const existing = JSON.parse(data[dateRowIndex - 1][QUOTES_DATA_COL] || '[]');
      existing.push(newQuote);
      sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).setValue(JSON.stringify(existing));
    } else {
      sheet.appendRow([dateKey, JSON.stringify([newQuote])]);
    }

    logActivity(adminEmail, 'QUOTE_CREATED', 'Quote ' + quoteId + ' created for ' + (quoteData.guestName || 'guest'));

    return { success: true, message: 'Quote created successfully!', quoteId: quoteId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function editQuote(dateRowIndex, quoteIndex, updatedData, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(QUOTES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).getValue();
    const quotes = JSON.parse(json || '[]');

    if (quoteIndex < 0 || quoteIndex >= quotes.length) return { success: false, message: 'Quote not found' };

    var q = quotes[quoteIndex];
    q.guestName = updatedData.guestName || q.guestName;
    q.guestEmail = updatedData.guestEmail || q.guestEmail;
    q.guestPhone = updatedData.guestPhone !== undefined ? updatedData.guestPhone : q.guestPhone;
    if (updatedData.rooms && updatedData.rooms.length > 0) q.rooms = updatedData.rooms;
    if (updatedData.services) q.services = updatedData.services;
    q.notes = updatedData.notes !== undefined ? updatedData.notes : q.notes;
    q.validUntil = updatedData.validUntil || q.validUntil;
    if (updatedData.status) q.status = updatedData.status;

    var roomsTotal = q.rooms.reduce(function(s, r) { return s + (parseFloat(r.amount) || 0); }, 0);
    var servicesTotal = q.services.reduce(function(s, sv) { return s + (parseFloat(sv.amount) || 0); }, 0);
    q.subtotal = roomsTotal + servicesTotal;
    q.taxRate = updatedData.taxRate !== undefined ? parseFloat(updatedData.taxRate) : q.taxRate;
    q.taxAmount = (q.subtotal * q.taxRate) / 100;
    q.discount = updatedData.discount !== undefined ? parseFloat(updatedData.discount) : q.discount;
    q.totalAmount = q.subtotal + q.taxAmount - q.discount;

    sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).setValue(JSON.stringify(quotes));
    logActivity(adminEmail, 'QUOTE_EDITED', 'Quote ' + q.quoteId + ' edited');

    return { success: true, message: 'Quote updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteQuote(dateRowIndex, quoteIndex, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(QUOTES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).getValue();
    const quotes = JSON.parse(json || '[]');

    if (quoteIndex < 0 || quoteIndex >= quotes.length) return { success: false, message: 'Quote not found' };

    const deleted = quotes[quoteIndex];
    quotes.splice(quoteIndex, 1);

    if (quotes.length === 0) { sheet.deleteRow(dateRowIndex); }
    else { sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).setValue(JSON.stringify(quotes)); }

    logActivity(adminEmail, 'QUOTE_DELETED', 'Quote ' + deleted.quoteId + ' deleted');
    return { success: true, message: 'Quote deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function sendQuoteEmail(dateRowIndex, quoteIndex, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(QUOTES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).getValue();
    const quotes = JSON.parse(json || '[]');
    if (quoteIndex < 0 || quoteIndex >= quotes.length) return { success: false, message: 'Quote not found' };

    var q = quotes[quoteIndex];
    if (!q.guestEmail) return { success: false, message: 'No guest email address' };

    var html = generateQuotePrintHtml(q);

    MailApp.sendEmail({
      to: q.guestEmail,
      subject: 'Quotation ' + q.quoteId + ' - Hotel Management',
      body: 'Please find your quotation attached. Quote ID: ' + q.quoteId + ', Total: $' + q.totalAmount.toFixed(2),
      htmlBody: html
    });

    if (q.status === 'Draft') {
      q.status = 'Sent';
      sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).setValue(JSON.stringify(quotes));
    }

    logActivity(adminEmail, 'QUOTE_EMAILED', 'Quote ' + q.quoteId + ' emailed to ' + q.guestEmail);
    return { success: true, message: 'Quote emailed to ' + q.guestEmail };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getQuotePrintHtml(dateRowIndex, quoteIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(QUOTES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };
    const json = sheet.getRange(dateRowIndex, QUOTES_DATA_COL + 1).getValue();
    const quotes = JSON.parse(json || '[]');
    if (quoteIndex < 0 || quoteIndex >= quotes.length) return { success: false, message: 'Quote not found' };
    return { success: true, html: generateQuotePrintHtml(quotes[quoteIndex]) };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function generateQuotePrintHtml(q) {
  const settings = getSettings();
  const hotelName = settings.hotelName || 'Hotel Management';
  const brandColor = settings.primaryColor || '#001f3f';
  const logoHtml = getBrandLogoHtml(settings, 50, 'white');

  var roomsRows = '';
  (q.rooms || []).forEach(function(r) {
    roomsRows += '<tr><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (r.roomNo || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (r.roomType || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(r.rate) || 0).toFixed(2) + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:center;">' + (r.nights || 0) + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(r.amount) || 0).toFixed(2) + '</td></tr>';
  });

  var servicesRows = '';
  (q.services || []).forEach(function(s) {
    servicesRows += '<tr><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (s.name || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(s.amount) || 0).toFixed(2) + '</td></tr>';
  });

  var statusColors = { Draft: '#6c757d', Sent: '#0074D9', Accepted: '#34a853', Converted: '#ff9800' };
  var statusColor = statusColors[q.status] || '#6c757d';

  return '<html><head><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;}@media print{body{padding:0;}.no-print{display:none!important;}}</style></head><body>' +
    '<div style="max-width:700px;margin:auto;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;">' +
    '<div style="background:' + brandColor + ';color:white;padding:25px 30px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div style="display:flex;align-items:center;gap:15px;">' + logoHtml + '<div><h2 style="margin:0;font-size:22px;">QUOTATION</h2><p style="margin:4px 0 0;font-size:12px;opacity:0.8;">' + hotelName + '</p></div></div>' +
    '<div style="text-align:right;"><p style="margin:0;font-size:14px;font-weight:700;">' + q.quoteId + '</p><p style="margin:4px 0 0;font-size:12px;opacity:0.8;">' + new Date(q.createdAt).toLocaleDateString() + '</p></div></div>' +
    '<div style="padding:25px 30px;">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:15px;">' +
    '<div><p style="margin:0 0 5px;font-size:12px;color:#666;text-transform:uppercase;">Bill To</p><p style="margin:0;font-weight:700;font-size:16px;">' + (q.guestName || '-') + '</p><p style="margin:3px 0 0;font-size:13px;color:#555;">' + (q.guestEmail || '') + '</p><p style="margin:3px 0 0;font-size:13px;color:#555;">' + (q.guestPhone || '') + '</p></div>' +
    '<div style="text-align:right;"><span style="background:' + statusColor + ';color:white;padding:5px 15px;border-radius:15px;font-size:12px;font-weight:700;">' + q.status + '</span>' +
    (q.validUntil ? '<p style="margin:10px 0 0;font-size:13px;color:#666;">Valid Until: <strong>' + q.validUntil + '</strong></p>' : '') + '</div></div>' +
    (roomsRows ? '<h3 style="color:' + brandColor + ';font-size:14px;margin:20px 0 10px;border-bottom:2px solid ' + brandColor + ';padding-bottom:5px;">Rooms</h3><table style="width:100%;border-collapse:collapse;"><tr><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Room</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Type</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Rate</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:center;">Nights</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Amount</th></tr>' + roomsRows + '</table>' : '') +
    (servicesRows ? '<h3 style="color:' + brandColor + ';font-size:14px;margin:20px 0 10px;border-bottom:2px solid ' + brandColor + ';padding-bottom:5px;">Services</h3><table style="width:100%;border-collapse:collapse;"><tr><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Service</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Amount</th></tr>' + servicesRows + '</table>' : '') +
    '<div style="margin-top:20px;border-top:2px solid ' + brandColor + ';padding-top:15px;">' +
    '<div style="display:flex;justify-content:flex-end;"><div style="width:250px;">' +
    '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;"><span>Subtotal:</span><span>$' + (q.subtotal || 0).toFixed(2) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;"><span>Tax (' + (q.taxRate || 0) + '%):</span><span>$' + (q.taxAmount || 0).toFixed(2) + '</span></div>' +
    (q.discount > 0 ? '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#ea4335;"><span>Discount:</span><span>-$' + q.discount.toFixed(2) + '</span></div>' : '') +
    '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:700;border-top:2px solid ' + brandColor + ';color:' + brandColor + ';"><span>Total:</span><span>$' + (q.totalAmount || 0).toFixed(2) + '</span></div>' +
    '</div></div></div>' +
    (q.notes ? '<div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;"><p style="margin:0 0 5px;font-size:12px;color:#666;font-weight:700;">Notes:</p><p style="margin:0;font-size:13px;color:#555;">' + q.notes + '</p></div>' : '') +
    '</div>' +
    '<div style="padding:15px 30px;text-align:center;border-top:1px solid #e0e0e0;background:#f9f9f9;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#666;">Thank you for your interest!</p>' +
    '<p style="margin:0;font-size:11px;color:#999;">' + hotelName + ' | Developed by Manuel Scripts | WhatsApp: +233547359015</p>' +
    '</div></div></body></html>';
}

/***************************************************
 * INVOICE MANAGEMENT
 ***************************************************/

function getAllInvoicesFromStorage() {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(INVOICES_SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    data.shift();

    let allInvoices = [];
    data.forEach((row, dateIndex) => {
      const invoices = JSON.parse(row[INVOICES_DATA_COL] || '[]');
      invoices.forEach((inv, invIndex) => {
        allInvoices.push({
          ...inv,
          dateKey: row[INVOICES_DATE_COL],
          dateRowIndex: dateIndex + 2,
          invoiceIndex: invIndex
        });
      });
    });

    return allInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    return { error: e.message };
  }
}

function getAllInvoices() {
  return getAllInvoicesFromStorage();
}

function addInvoice(invoiceData, adminEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName(INVOICES_SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(INVOICES_SHEET_NAME);
      sheet.appendRow(['Date', 'Invoices JSON']);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#001f3f').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 220);
      sheet.setColumnWidth(2, 800);
    }

    const invoiceId = 'INV' + Date.now().toString().slice(-8);
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const rooms = invoiceData.rooms || [];
    const services = invoiceData.services || [];
    const roomsTotal = rooms.reduce(function(s, r) { return s + (parseFloat(r.amount) || 0); }, 0);
    const servicesTotal = services.reduce(function(s, sv) { return s + (parseFloat(sv.amount) || 0); }, 0);
    const subtotal = roomsTotal + servicesTotal;
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = parseFloat(invoiceData.discount) || 0;
    const totalAmount = subtotal + taxAmount - discount;

    const newInvoice = {
      invoiceId: invoiceId,
      quoteId: invoiceData.quoteId || '',
      guestName: invoiceData.guestName || '',
      guestEmail: invoiceData.guestEmail || '',
      guestPhone: invoiceData.guestPhone || '',
      rooms: rooms,
      services: services,
      subtotal: subtotal,
      taxRate: taxRate,
      taxAmount: taxAmount,
      discount: discount,
      totalAmount: totalAmount,
      notes: invoiceData.notes || '',
      status: 'Unpaid',
      paidAmount: parseFloat(invoiceData.paidAmount) || 0,
      paymentMethod: invoiceData.paymentMethod || '',
      dueDate: invoiceData.dueDate || '',
      createdAt: now.toISOString(),
      createdBy: adminEmail
    };

    const data = sheet.getDataRange().getValues();
    let dateRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][INVOICES_DATE_COL] === dateKey) { dateRowIndex = i + 1; break; }
    }

    if (dateRowIndex > 0) {
      const existing = JSON.parse(data[dateRowIndex - 1][INVOICES_DATA_COL] || '[]');
      existing.push(newInvoice);
      sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).setValue(JSON.stringify(existing));
    } else {
      sheet.appendRow([dateKey, JSON.stringify([newInvoice])]);
    }

    logActivity(adminEmail, 'INVOICE_CREATED', 'Invoice ' + invoiceId + ' created for ' + (invoiceData.guestName || 'guest'));

    return { success: true, message: 'Invoice created successfully!', invoiceId: invoiceId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function editInvoice(dateRowIndex, invoiceIndex, updatedData, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(INVOICES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).getValue();
    const invoices = JSON.parse(json || '[]');

    if (invoiceIndex < 0 || invoiceIndex >= invoices.length) return { success: false, message: 'Invoice not found' };

    var inv = invoices[invoiceIndex];
    inv.guestName = updatedData.guestName || inv.guestName;
    inv.guestEmail = updatedData.guestEmail || inv.guestEmail;
    inv.guestPhone = updatedData.guestPhone !== undefined ? updatedData.guestPhone : inv.guestPhone;
    if (updatedData.rooms && updatedData.rooms.length > 0) inv.rooms = updatedData.rooms;
    if (updatedData.services) inv.services = updatedData.services;
    inv.notes = updatedData.notes !== undefined ? updatedData.notes : inv.notes;
    inv.dueDate = updatedData.dueDate || inv.dueDate;
    if (updatedData.status) inv.status = updatedData.status;
    if (updatedData.paidAmount !== undefined) inv.paidAmount = parseFloat(updatedData.paidAmount) || 0;
    inv.paymentMethod = updatedData.paymentMethod || inv.paymentMethod;

    var roomsTotal = inv.rooms.reduce(function(s, r) { return s + (parseFloat(r.amount) || 0); }, 0);
    var servicesTotal = inv.services.reduce(function(s, sv) { return s + (parseFloat(sv.amount) || 0); }, 0);
    inv.subtotal = roomsTotal + servicesTotal;
    inv.taxRate = updatedData.taxRate !== undefined ? parseFloat(updatedData.taxRate) : inv.taxRate;
    inv.taxAmount = (inv.subtotal * inv.taxRate) / 100;
    inv.discount = updatedData.discount !== undefined ? parseFloat(updatedData.discount) : inv.discount;
    inv.totalAmount = inv.subtotal + inv.taxAmount - inv.discount;

    sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).setValue(JSON.stringify(invoices));
    logActivity(adminEmail, 'INVOICE_EDITED', 'Invoice ' + inv.invoiceId + ' edited');

    return { success: true, message: 'Invoice updated successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteInvoice(dateRowIndex, invoiceIndex, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(INVOICES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).getValue();
    const invoices = JSON.parse(json || '[]');

    if (invoiceIndex < 0 || invoiceIndex >= invoices.length) return { success: false, message: 'Invoice not found' };

    const deleted = invoices[invoiceIndex];
    invoices.splice(invoiceIndex, 1);

    if (invoices.length === 0) { sheet.deleteRow(dateRowIndex); }
    else { sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).setValue(JSON.stringify(invoices)); }

    logActivity(adminEmail, 'INVOICE_DELETED', 'Invoice ' + deleted.invoiceId + ' deleted');
    return { success: true, message: 'Invoice deleted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function convertQuoteToInvoice(quoteDateRowIndex, quoteIndex, adminEmail) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const quoteSheet = ss.getSheetByName(QUOTES_SHEET_NAME);
    if (!quoteSheet) return { success: false, message: 'Quotes sheet not found' };

    const json = quoteSheet.getRange(quoteDateRowIndex, QUOTES_DATA_COL + 1).getValue();
    const quotes = JSON.parse(json || '[]');
    if (quoteIndex < 0 || quoteIndex >= quotes.length) return { success: false, message: 'Quote not found' };

    var q = quotes[quoteIndex];
    if (q.convertedToInvoice) return { success: false, message: 'Quote already converted to invoice ' + q.convertedToInvoice };

    var invoiceResult = addInvoice({
      quoteId: q.quoteId,
      guestName: q.guestName,
      guestEmail: q.guestEmail,
      guestPhone: q.guestPhone,
      rooms: q.rooms,
      services: q.services,
      taxRate: q.taxRate,
      discount: q.discount,
      notes: q.notes,
      dueDate: q.validUntil
    }, adminEmail);

    if (!invoiceResult.success) return invoiceResult;

    q.status = 'Converted';
    q.convertedToInvoice = invoiceResult.invoiceId;
    quoteSheet.getRange(quoteDateRowIndex, QUOTES_DATA_COL + 1).setValue(JSON.stringify(quotes));

    logActivity(adminEmail, 'QUOTE_CONVERTED', 'Quote ' + q.quoteId + ' converted to Invoice ' + invoiceResult.invoiceId);

    return { success: true, message: 'Quote converted to Invoice ' + invoiceResult.invoiceId, invoiceId: invoiceResult.invoiceId };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function sendInvoiceEmail(dateRowIndex, invoiceIndex, adminEmail) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(INVOICES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };

    const json = sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).getValue();
    const invoices = JSON.parse(json || '[]');
    if (invoiceIndex < 0 || invoiceIndex >= invoices.length) return { success: false, message: 'Invoice not found' };

    var inv = invoices[invoiceIndex];
    if (!inv.guestEmail) return { success: false, message: 'No guest email address' };

    var html = generateInvoicePrintHtml(inv);

    MailApp.sendEmail({
      to: inv.guestEmail,
      subject: 'Invoice ' + inv.invoiceId + ' - Hotel Management',
      body: 'Please find your invoice. Invoice ID: ' + inv.invoiceId + ', Total: $' + inv.totalAmount.toFixed(2),
      htmlBody: html
    });

    logActivity(adminEmail, 'INVOICE_EMAILED', 'Invoice ' + inv.invoiceId + ' emailed to ' + inv.guestEmail);
    return { success: true, message: 'Invoice emailed to ' + inv.guestEmail };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getInvoicePrintHtml(dateRowIndex, invoiceIndex) {
  try {
    const sheet = SpreadsheetApp.openById(SS_ID).getSheetByName(INVOICES_SHEET_NAME);
    if (!sheet) return { success: false, message: 'Sheet not found' };
    const json = sheet.getRange(dateRowIndex, INVOICES_DATA_COL + 1).getValue();
    const invoices = JSON.parse(json || '[]');
    if (invoiceIndex < 0 || invoiceIndex >= invoices.length) return { success: false, message: 'Invoice not found' };
    return { success: true, html: generateInvoicePrintHtml(invoices[invoiceIndex]) };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function generateInvoicePrintHtml(inv) {
  const settings = getSettings();
  const hotelName = settings.hotelName || 'Hotel Management';
  const brandColor = settings.primaryColor || '#001f3f';
  const logoHtml = getBrandLogoHtml(settings, 50, 'white');

  var roomsRows = '';
  (inv.rooms || []).forEach(function(r) {
    roomsRows += '<tr><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (r.roomNo || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (r.roomType || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(r.rate) || 0).toFixed(2) + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:center;">' + (r.nights || 0) + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(r.amount) || 0).toFixed(2) + '</td></tr>';
  });

  var servicesRows = '';
  (inv.services || []).forEach(function(s) {
    servicesRows += '<tr><td style="padding:10px 14px;border:1px solid #e0e0e0;">' + (s.name || '') + '</td><td style="padding:10px 14px;border:1px solid #e0e0e0;text-align:right;">$' + (parseFloat(s.amount) || 0).toFixed(2) + '</td></tr>';
  });

  var statusColors = { Unpaid: '#ea4335', Paid: '#34a853', Partial: '#ff9800', Cancelled: '#6c757d' };
  var statusColor = statusColors[inv.status] || '#6c757d';

  return '<html><head><style>body{font-family:Arial,sans-serif;margin:0;padding:20px;color:#333;}@media print{body{padding:0;}.no-print{display:none!important;}}</style></head><body>' +
    '<div style="max-width:700px;margin:auto;border:1px solid #e0e0e0;border-radius:4px;overflow:hidden;">' +
    '<div style="background:' + brandColor + ';color:white;padding:25px 30px;display:flex;align-items:center;justify-content:space-between;">' +
    '<div style="display:flex;align-items:center;gap:15px;">' + logoHtml + '<div><h2 style="margin:0;font-size:22px;">INVOICE</h2><p style="margin:4px 0 0;font-size:12px;opacity:0.8;">' + hotelName + '</p></div></div>' +
    '<div style="text-align:right;"><p style="margin:0;font-size:14px;font-weight:700;">' + inv.invoiceId + '</p>' + (inv.quoteId ? '<p style="margin:4px 0 0;font-size:11px;opacity:0.7;">Ref: ' + inv.quoteId + '</p>' : '') + '<p style="margin:4px 0 0;font-size:12px;opacity:0.8;">' + new Date(inv.createdAt).toLocaleDateString() + '</p></div></div>' +
    '<div style="padding:25px 30px;">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:15px;">' +
    '<div><p style="margin:0 0 5px;font-size:12px;color:#666;text-transform:uppercase;">Bill To</p><p style="margin:0;font-weight:700;font-size:16px;">' + (inv.guestName || '-') + '</p><p style="margin:3px 0 0;font-size:13px;color:#555;">' + (inv.guestEmail || '') + '</p><p style="margin:3px 0 0;font-size:13px;color:#555;">' + (inv.guestPhone || '') + '</p></div>' +
    '<div style="text-align:right;"><span style="background:' + statusColor + ';color:white;padding:5px 15px;border-radius:15px;font-size:12px;font-weight:700;">' + inv.status + '</span>' +
    (inv.dueDate ? '<p style="margin:10px 0 0;font-size:13px;color:#666;">Due: <strong>' + inv.dueDate + '</strong></p>' : '') + '</div></div>' +
    (roomsRows ? '<h3 style="color:' + brandColor + ';font-size:14px;margin:20px 0 10px;border-bottom:2px solid ' + brandColor + ';padding-bottom:5px;">Rooms</h3><table style="width:100%;border-collapse:collapse;"><tr><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Room</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Type</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Rate</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:center;">Nights</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Amount</th></tr>' + roomsRows + '</table>' : '') +
    (servicesRows ? '<h3 style="color:' + brandColor + ';font-size:14px;margin:20px 0 10px;border-bottom:2px solid ' + brandColor + ';padding-bottom:5px;">Services</h3><table style="width:100%;border-collapse:collapse;"><tr><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:left;">Service</th><th style="padding:10px 14px;border:1px solid #e0e0e0;background:' + brandColor + ';color:white;text-align:right;">Amount</th></tr>' + servicesRows + '</table>' : '') +
    '<div style="margin-top:20px;border-top:2px solid ' + brandColor + ';padding-top:15px;">' +
    '<div style="display:flex;justify-content:flex-end;"><div style="width:250px;">' +
    '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;"><span>Subtotal:</span><span>$' + (inv.subtotal || 0).toFixed(2) + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;"><span>Tax (' + (inv.taxRate || 0) + '%):</span><span>$' + (inv.taxAmount || 0).toFixed(2) + '</span></div>' +
    (inv.discount > 0 ? '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#ea4335;"><span>Discount:</span><span>-$' + inv.discount.toFixed(2) + '</span></div>' : '') +
    '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:700;border-top:2px solid ' + brandColor + ';color:' + brandColor + ';"><span>Total:</span><span>$' + (inv.totalAmount || 0).toFixed(2) + '</span></div>' +
    (inv.paidAmount > 0 ? '<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;color:#34a853;"><span>Paid:</span><span>$' + inv.paidAmount.toFixed(2) + '</span></div><div style="display:flex;justify-content:space-between;padding:5px 0;font-size:14px;font-weight:700;color:#ea4335;"><span>Balance:</span><span>$' + ((inv.totalAmount || 0) - inv.paidAmount).toFixed(2) + '</span></div>' : '') +
    '</div></div></div>' +
    (inv.notes ? '<div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;"><p style="margin:0 0 5px;font-size:12px;color:#666;font-weight:700;">Notes:</p><p style="margin:0;font-size:13px;color:#555;">' + inv.notes + '</p></div>' : '') +
    '</div>' +
    '<div style="padding:15px 30px;text-align:center;border-top:1px solid #e0e0e0;background:#f9f9f9;">' +
    '<p style="margin:0 0 4px;font-size:13px;color:#666;">Thank you for your business!</p>' +
    '<p style="margin:0;font-size:11px;color:#999;">' + hotelName + ' | Developed by Manuel Scripts | WhatsApp: +233547359015</p>' +
    '</div></div></body></html>';
}

/***************************************************
 * AI CHAT ASSISTANT (Gemini)
 ***************************************************/
const GEMINI_API_KEY = '==== YOUR API KEY===';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

/**
 * Collect system data as text context for AI based on role
 */
function getSystemDataForAI(userEmail, role) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);

    if (role === 'admin') {
      // ---- ADMIN: Full system data ----
      let context = '';

      // Rooms summary
      const roomsSheet = ss.getSheetByName(ROOMS_SHEET_NAME);
      const roomsData = roomsSheet ? roomsSheet.getDataRange().getValues() : [];
      if (roomsData.length > 1) {
        roomsData.shift();
        let available = 0, booked = 0, checkedIn = 0, maintenance = 0, dnd = 0;
        let typeCount = {};
        roomsData.forEach(row => {
          const status = (row[ROOM_STATUS_COL] || '').toString().toLowerCase();
          const type = (row[ROOM_TYPE_COL] || '').toString();
          if (status === 'available') available++;
          else if (status === 'booked') booked++;
          else if (status === 'checked in') checkedIn++;
          else if (status === 'maintenance') maintenance++;
          if ((row[ROOM_DND_COL] || '').toString().toLowerCase() === 'yes') dnd++;
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
        context += 'ROOMS SUMMARY:\n';
        context += 'Total Rooms: ' + roomsData.length + ' | Available: ' + available + ' | Booked: ' + booked + ' | Checked In: ' + checkedIn + ' | Maintenance: ' + maintenance + ' | DND: ' + dnd + '\n';
        context += 'Room Types: ' + Object.entries(typeCount).map(([k, v]) => k + '(' + v + ')').join(', ') + '\n';
        context += 'All Rooms:\n';
        roomsData.forEach(row => {
          context += '  Room ' + row[ROOM_NO_COL] + ' | Type: ' + row[ROOM_TYPE_COL] + ' | Rate: ' + row[ROOM_RATE_COL] + ' | Status: ' + row[ROOM_STATUS_COL] + ' | DND: ' + (row[ROOM_DND_COL] || 'No') + '\n';
        });
        context += '\n';
      }

      // Bookings
      const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
      const bookingsData = bookingsSheet ? bookingsSheet.getDataRange().getValues() : [];
      if (bookingsData.length > 1) {
        bookingsData.shift();
        context += 'ALL BOOKINGS (' + bookingsData.length + ' total):\n';
        bookingsData.forEach(row => {
          context += '  Ticket: ' + row[TICKET_ID_COL] + ' | Room: ' + row[BOOKING_ROOM_NO_COL] + ' | Guest: ' + row[GUEST_NAME_COL] + ' | Phone: ' + row[PHONE_COL] + ' | Email: ' + row[EMAIL_COL] + ' | CheckIn: ' + row[CHECK_IN_COL] + ' | CheckOut: ' + row[CHECK_OUT_COL] + ' | Status: ' + row[BOOKING_STATUS_COL] + ' | Amount: ' + row[TOTAL_AMOUNT_COL] + ' | Payment: ' + row[PAYMENT_STATUS_COL] + ' | Paid: ' + row[PAID_AMOUNT_COL] + '\n';
        });
        context += '\n';
      }

      // Transactions
      const txnSheet = ss.getSheetByName(TRANSACTIONS_SHEET_NAME);
      if (txnSheet) {
        const txnData = txnSheet.getDataRange().getValues();
        let allTxns = [];
        for (let i = 1; i < txnData.length; i++) {
          let transactions = [];
          try { transactions = JSON.parse(txnData[i][TXN_DATA_COL] || '[]'); } catch (e) {}
          transactions.forEach(t => { t._date = txnData[i][TXN_DATE_COL]; allTxns.push(t); });
        }
        let totalRevenue = 0;
        allTxns.forEach(t => { totalRevenue += parseFloat(t.amount) || 0; });
        const recent = allTxns.slice(-30);
        context += 'TRANSACTIONS (' + allTxns.length + ' total, Revenue: ' + totalRevenue + '):\n';
        context += 'Recent ' + recent.length + ' transactions:\n';
        recent.forEach(t => {
          context += '  ' + (t.timestamp || t._date || '') + ' | Booking: ' + (t.ticketId || '') + ' | Amount: ' + (t.amount || 0) + ' | Method: ' + (t.paymentMethod || '') + ' | Note: ' + (t.note || '') + '\n';
        });
        context += '\n';
      }

      // Food Orders (pending)
      const foodSheet = ss.getSheetByName(FOOD_ORDERS_SHEET_NAME);
      if (foodSheet) {
        const foodData = foodSheet.getDataRange().getValues();
        let pendingOrders = [];
        for (let i = 1; i < foodData.length; i++) {
          let orders = [];
          try { orders = JSON.parse(foodData[i][FOOD_ORDER_DATA_COL] || '[]'); } catch (e) {}
          orders.forEach(o => { if (o.status === 'Pending') pendingOrders.push(o); });
        }
        context += 'PENDING FOOD ORDERS (' + pendingOrders.length + '):\n';
        pendingOrders.forEach(o => {
          context += '  Room: ' + (o.roomNo || '') + ' | Items: ' + (o.items ? o.items.map(it => it.name + ' x' + it.qty).join(', ') : '') + ' | Total: ' + (o.totalAmount || 0) + ' | Status: ' + o.status + '\n';
        });
        context += '\n';
      }

      // Cleaning Requests (pending)
      const cleanSheet = ss.getSheetByName(CLEANING_REQUESTS_SHEET_NAME);
      if (cleanSheet) {
        const cleanData = cleanSheet.getDataRange().getValues();
        let pendingClean = [];
        for (let i = 1; i < cleanData.length; i++) {
          let requests = [];
          try { requests = JSON.parse(cleanData[i][CLEANING_DATA_COL] || '[]'); } catch (e) {}
          requests.forEach(r => { if (r.status === 'Pending') pendingClean.push(r); });
        }
        context += 'PENDING CLEANING REQUESTS (' + pendingClean.length + '):\n';
        pendingClean.forEach(r => {
          context += '  Room: ' + (r.roomNo || '') + ' | Type: ' + (r.requestType || '') + ' | Note: ' + (r.notes || '') + '\n';
        });
        context += '\n';
      }

      // Waitlist
      const wlSheet = ss.getSheetByName(WAITLIST_SHEET_NAME);
      if (wlSheet) {
        const wlData = wlSheet.getDataRange().getValues();
        if (wlData.length > 1) {
          wlData.shift();
          context += 'WAITLIST (' + wlData.length + ' entries):\n';
          wlData.forEach(row => {
            context += '  Guest: ' + row[WL_GUEST_NAME_COL] + ' | Phone: ' + row[WL_PHONE_COL] + ' | Room Type: ' + row[WL_ROOM_TYPE_COL] + ' | Status: ' + row[WL_STATUS_COL] + '\n';
          });
          context += '\n';
        }
      }

      // Payment Methods
      const pmSheet = ss.getSheetByName(PAYMENT_METHODS_SHEET_NAME);
      if (pmSheet) {
        const pmData = pmSheet.getDataRange().getValues();
        if (pmData.length > 1) {
          pmData.shift();
          context += 'PAYMENT METHODS:\n';
          pmData.forEach(row => {
            context += '  ' + row[PM_NAME_COL] + ' | Bank: ' + (row[PM_BANK_NAME_COL] || '-') + ' | Account: ' + (row[PM_ACCOUNT_NO_COL] || '-') + ' | Status: ' + row[PM_STATUS_COL] + '\n';
          });
          context += '\n';
        }
      }

      // Users count
      const loginSheet = ss.getSheetByName(LOGIN_SHEET_NAME);
      if (loginSheet) {
        const loginData = loginSheet.getDataRange().getValues();
        context += 'USERS: ' + (loginData.length - 1) + ' registered users\n';
      }

      return context;

    } else {
      // ---- REGULAR USER: Only their bookings ----
      const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET_NAME);
      if (!bookingsSheet) return 'No booking data available.';

      const roomsSheet = ss.getSheetByName(ROOMS_SHEET_NAME);
      const roomsData = roomsSheet ? roomsSheet.getDataRange().getValues() : [];
      const roomTypeMap = {};
      for (let r = 1; r < roomsData.length; r++) {
        const roomNo = (roomsData[r][ROOM_NO_COL] || '').toString();
        roomTypeMap[roomNo] = (roomsData[r][ROOM_TYPE_COL] || '').toString();
      }

      const data = bookingsSheet.getDataRange().getValues();
      let context = 'YOUR BOOKINGS:\n';
      let found = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const email = (row[EMAIL_COL] || '').toString().toLowerCase();
        if (email === userEmail.toLowerCase()) {
          found++;
          const roomNo = (row[BOOKING_ROOM_NO_COL] || '').toString();
          context += '  Ticket: ' + row[TICKET_ID_COL] + ' | Room: ' + roomNo + ' | Type: ' + (roomTypeMap[roomNo] || '') + ' | CheckIn: ' + row[CHECK_IN_COL] + ' | CheckOut: ' + row[CHECK_OUT_COL] + ' | Status: ' + row[BOOKING_STATUS_COL] + ' | Amount: ' + row[TOTAL_AMOUNT_COL] + ' | Payment: ' + row[PAYMENT_STATUS_COL] + ' | Special Requests: ' + (row[SPECIAL_REQUESTS_COL] || 'None') + '\n';
        }
      }

      if (found === 0) context += '  No bookings found for your account.\n';
      return context;
    }
  } catch (e) {
    Logger.log('Error in getSystemDataForAI: ' + e.toString());
    return 'Error loading data: ' + e.message;
  }
}

/**
 * Chat with Gemini AI - sends message with system context
 */
function chatWithAI(message, userEmail, role, conversationHistory) {
  try {
    // Get system context based on role
    const systemData = getSystemDataForAI(userEmail, role);

    // Build system instruction
    let systemPrompt = 'You are a helpful AI assistant for a Hotel Management System. Be concise and to the point. Give short, clear answers. Use bullet points for lists. Avoid unnecessary filler text. ';
    if (role === 'admin') {
      systemPrompt += 'The admin is asking you questions. You have access to ALL hotel system data provided below. Answer accurately based on this data. If asked about something not in the data, say so.\n\n';
      systemPrompt += 'CURRENT HOTEL DATA:\n' + systemData;
    } else {
      systemPrompt += 'A hotel guest is asking you questions. You ONLY have access to their personal booking data below. Do NOT reveal any other guest data or system-wide information. Answer based only on their data.\n\n';
      systemPrompt += 'GUEST DATA:\n' + systemData;
    }

    // Build conversation contents
    let contents = [];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add the new user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Build API request payload
    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    // Call Gemini API
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(GEMINI_API_URL, options);
    const result = JSON.parse(response.getContentText());

    if (result.candidates && result.candidates[0] && result.candidates[0].content) {
      const reply = result.candidates[0].content.parts[0].text;
      return { success: true, reply: reply };
    } else if (result.error) {
      return { success: false, message: result.error.message || 'API error occurred' };
    } else {
      return { success: false, message: 'No response from AI' };
    }
  } catch (e) {
    Logger.log('Error in chatWithAI: ' + e.toString());
    return { success: false, message: 'Failed to get AI response: ' + e.message };
  }
}

