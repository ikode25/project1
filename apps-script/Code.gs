// ============================================================
// School Fees Management System - Code.gs (Complete Rewrite)
// ============================================================

const SHEET_PREFIX         = "Fees Database";
const USERS_SHEET          = "Users";
const SETTINGS_SHEET       = "Settings";
const FEE_COMPONENTS_SHEET = "Fee Components";
const CLASSES_SHEET        = "Classes";

// NOTE: "isActive" here controls whether a component gets its own column on the
// term sheets (First/Second/Third Term) AND is included in fee totals. Only
// components the admin has actually configured for regular-fee billing should
// default to active. Books/PTA/Cleaning are commonly collected as one-off or
// termly EXTRA fees (see Custom Fee Types) rather than as a fixed regular-fee
// column billed to every student every term, so they default to inactive here
// — the admin can activate them from Settings → Fee Components if their school
// really does want them as a standing regular-fee column for every student.
const DEFAULT_COMPONENTS = [
  {id:"arrears",       name:"Arrears",        defaultAmount:0, isActive:true,  isForNewStudentsOnly:false, order:1},
  {id:"actualFees",    name:"Tuition Fees",   defaultAmount:0, isActive:true,  isForNewStudentsOnly:false, order:2},
  {id:"books",         name:"Books",          defaultAmount:0, isActive:false, isForNewStudentsOnly:false, order:3},
  {id:"pta",           name:"PTA",            defaultAmount:0, isActive:false, isForNewStudentsOnly:false, order:4},
  {id:"cleaning",      name:"Cleaning",       defaultAmount:0, isActive:false, isForNewStudentsOnly:false, order:5},
  {id:"admissionFees", name:"Admission Fees", defaultAmount:0, isActive:true,  isForNewStudentsOnly:true,  order:6}
];

const DEFAULT_CLASSES = [
  "Creche","Nursery 1","Nursery 2","KG 1","KG 2",
  "Basic 1","Basic 2","Basic 3","Basic 4","Basic 5","Basic 6",
  "JHS 1","JHS 2","JHS 3"
];

function doGet(e) {
  try { initializeSpreadsheet(); } catch (err) { Logger.log('doGet initializeSpreadsheet warning: ' + err.message); }
  var page = e && e.parameter && e.parameter.page ? e.parameter.page.toLowerCase() : 'index';
  if (page === 'portal') {
    return HtmlService.createHtmlOutputFromFile('Portal')
      .setTitle('Parent Portal - School Fees')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('School Fees Management')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initializeSpreadsheet() {
  getOrCreateSheet(SETTINGS_SHEET, ["key","value"]);
  getOrCreateFeeComponentsSheet();
  getOrCreateUsersSheet();
  ["First Term","Second Term","Third Term"].forEach(t => getOrCreateTermSheet(t));
  getOrCreateCustomFeeRecordsSheet();
  getOrCreateDiscountHistorySheet();
  getOrCreateClassFeeRatesSheet();
  // NOTE: Uniform Sales / Book Config / Book Sales sheets are intentionally NOT
  // auto-created here — there's no working UI module for them in this system.
  // The underlying functions still create their sheet on demand if ever used.

  cleanAllSheetHeaders();
  return {success: true};
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  try {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
  } catch(e) {
    sheet = ss.getSheetByName(name);
    if (!sheet) throw e;
  }
  return sheet;
}

function getOrCreateUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USERS_SHEET);
  if (sheet) return sheet;
  try {
    sheet = ss.insertSheet(USERS_SHEET);
    sheet.appendRow(["email","name","password","role","lastLogin"]);
    sheet.getRange(1,1,1,5).setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
    sheet.appendRow(["admin@school.com","Administrator","School@Admin2024","admin",""]);
    sheet.appendRow(["owner@school.com","School Owner","Owner@2024","owner",""]);
    sheet.appendRow(["","viewer","View@User2024","viewer",""]);
  } catch(e) {
    sheet = ss.getSheetByName(USERS_SHEET);
    if (!sheet) throw e;
  }
  return sheet;
}

function getOrCreateFeeComponentsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FEE_COMPONENTS_SHEET);
  if (sheet) return sheet;
  try {
    sheet = ss.insertSheet(FEE_COMPONENTS_SHEET);
    sheet.appendRow(["id","name","defaultAmount","isActive","isForNewStudentsOnly","order"]);
    sheet.getRange(1,1,1,6).setBackground('#9333EA').setFontColor('white').setFontWeight('bold');
    DEFAULT_COMPONENTS.forEach(c => sheet.appendRow([c.id, c.name, 0, c.isActive, c.isForNewStudentsOnly, c.order]));
  } catch(e) {
    sheet = ss.getSheetByName(FEE_COMPONENTS_SHEET);
    if (!sheet) throw e;
  }
  return sheet;
}

function getOrCreateTermSheet(term) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const name = SHEET_PREFIX + " - " + term;
  let sheet  = ss.getSheetByName(name);
  if (sheet) {
    // ── Migration: ensure missing fee components, isStopped, paymentMode, and recordedBy columns exist ──
    try {
      var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      
      // Migrate missing fee components — only ACTIVE ones. A component the
      // admin never activated (or deliberately deactivated) must never get a
      // column forced back onto the sheet.
      const comps = getFeeComponentsList().filter(c => c.isActive);
      comps.forEach(c => {
        const cId = String(c.id).trim();
        if (existingHeaders.indexOf(cId) === -1) {
          var insertAfter = existingHeaders.indexOf('academicSession');
          if (insertAfter === -1) insertAfter = 4; // fallback to column 5
          var insertCol = insertAfter + 2;
          sheet.insertColumnAfter(insertAfter + 1);
          sheet.getRange(1, insertCol).setValue(cId)
            .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
          existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
        }
      });

      // Migrate inst7..inst10 (+ their Date columns) if missing — regular
      // school fees were expanded from 6 to 10 installments so admins can
      // collect in more parts. Insert right after inst6Date so the ten
      // installment columns stay grouped together instead of landing at
      // the far end of the sheet.
      if (existingHeaders.indexOf('inst7') === -1) {
        var afterCol = existingHeaders.indexOf('inst6Date');
        if (afterCol === -1) afterCol = existingHeaders.indexOf('totalFees');
        if (afterCol === -1) afterCol = existingHeaders.length - 1;
        var newInstCols = ['inst7','inst7Date','inst8','inst8Date','inst9','inst9Date','inst10','inst10Date'];
        newInstCols.forEach((colName, offset) => {
          sheet.insertColumnAfter(afterCol + 1 + offset);
          sheet.getRange(1, afterCol + 2 + offset).setValue(colName)
            .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        });
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }

      if (existingHeaders.indexOf('isStopped') === -1) {
        var insertAfter = existingHeaders.indexOf('isNewStudent');
        if (insertAfter === -1) insertAfter = existingHeaders.length - 1;
        var insertCol = insertAfter + 2;
        sheet.insertColumnAfter(insertAfter + 1);
        sheet.getRange(1, insertCol).setValue('isStopped')
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }

      if (existingHeaders.indexOf('studentStatus') === -1) {
        var insertAfter = existingHeaders.indexOf('isStopped');
        if (insertAfter === -1) insertAfter = existingHeaders.indexOf('isNewStudent');
        if (insertAfter === -1) insertAfter = existingHeaders.length - 1;
        var insertCol = insertAfter + 2;
        sheet.insertColumnAfter(insertAfter + 1);
        sheet.getRange(1, insertCol).setValue('studentStatus')
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }
      
      // Migrate paymentMode if missing
      if (existingHeaders.indexOf('paymentMode') === -1) {
        var lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        sheet.getRange(1, lastCol + 1).setValue('paymentMode')
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }
      
      // Migrate recordedBy if missing
      if (existingHeaders.indexOf('recordedBy') === -1) {
        var lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        sheet.getRange(1, lastCol + 1).setValue('recordedBy')
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }
      
      // Migrate discount if missing
      if (existingHeaders.indexOf('discount') === -1) {
        var lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        sheet.getRange(1, lastCol + 1).setValue('discount')
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
      }
    } catch(migErr) {
      Logger.log('Header migration info: ' + migErr.message);
    }
    return sheet;
  }
  try {
    const headers = buildHeaders();
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Set phone column to text format so leading zeros are never stripped
    const phoneCol = headers.indexOf('phoneNumber') + 1;
    if (phoneCol > 0) sheet.getRange(2, phoneCol, 1000, 1).setNumberFormat('@STRING@');
  } catch(e) {
    sheet = ss.getSheetByName(name);
    if (!sheet) throw e;
  }
  return sheet;
}

const CUSTOM_FEE_RECORDS_SHEET = "Custom Fee Records";

function getOrCreateCustomFeeRecordsSheet() {
  const targetHeaders = [
    "id", "studentId", "studentName", "grade", "academicSession", "feeTypeName", "amount", 
    "isInstallment", "numInstallments", 
    "inst1", "inst1Date", "inst1Mode", 
    "inst2", "inst2Date", "inst2Mode", 
    "inst3", "inst3Date", "inst3Mode", 
    "inst4", "inst4Date", "inst4Mode", 
    "inst5", "inst5Date", "inst5Mode", 
    "inst6", "inst6Date", "inst6Mode", 
    "totalPaid", "balance", "paymentStatus", "paymentMode", "recordedBy", "createdAt", "updatedAt"
  ];
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CUSTOM_FEE_RECORDS_SHEET);
    sheet.appendRow(targetHeaders);
    sheet.getRange(1, 1, 1, targetHeaders.length).setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
    return sheet;
  }
  
  // Sheet exists: check and append any missing headers dynamically!
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const currentHeaders = range.getValues()[0].map(h => String(h).trim());
  const missingHeaders = targetHeaders.filter(th => !currentHeaders.includes(th));
  
  if (missingHeaders.length > 0) {
    const startCol = currentHeaders.length + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders])
         .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
  }
  
  return sheet;
}

// Reserved/system columns that are never treated as orphaned fee-component columns
const RESERVED_TERM_SHEET_COLUMNS = [
  "id","studentName","phoneNumber","grade","academicSession",
  "isNewStudent","isStopped","studentStatus","discount","totalFees",
  "inst1","inst1Date","inst2","inst2Date","inst3","inst3Date",
  "inst4","inst4Date","inst5","inst5Date","inst6","inst6Date",
  "inst7","inst7Date","inst8","inst8Date","inst9","inst9Date","inst10","inst10Date",
  "totalPaid","balance","paymentStatus","createdAt","updatedAt",
  "paymentMode","recordedBy","isStaffChild","studentPhoto"
];

// Finds columns present in the term sheets that are no longer part of the
// active Fee Components list (e.g. left over after a component was deleted
// from Fee Components). Reports whether each has any real data so the
// caller can warn before deleting.
function findOrphanedFeeColumns() {
  // Only components the admin has actually activated should keep their column.
  // A component that was deleted OR merely deactivated (e.g. Books/PTA/Cleaning
  // left at their default off state) is reported as orphaned so it can be
  // cleaned up from every term sheet in one click.
  const activeIds = getFeeComponentsList().filter(c => c.isActive).map(c => String(c.id).trim());
  const orphans = {}; // name -> hasData
  ["First Term", "Second Term", "Third Term"].forEach(term => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet || sheet.getLastRow() < 1) return;
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    headers.forEach((h, colIdx) => {
      if (!h || activeIds.indexOf(h) !== -1 || RESERVED_TERM_SHEET_COLUMNS.indexOf(h) !== -1) return;
      let hasData = orphans[h] || false;
      for (let i = 1; i < data.length && !hasData; i++) {
        const v = data[i][colIdx];
        if (v !== '' && v !== 0 && v !== null && v !== undefined) hasData = true;
      }
      orphans[h] = hasData;
    });
  });
  return { success: true, orphans: orphans };
}

// Deletes the given orphaned columns from every term sheet. Only call this
// for columns the admin has explicitly confirmed removing.
function removeOrphanedFeeColumns(columnNames) {
  try {
    let removed = 0;
    ["First Term", "Second Term", "Third Term"].forEach(term => {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + " - " + term);
      if (!sheet || sheet.getLastRow() < 1) return;
      columnNames.forEach(name => {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
        const idx = headers.indexOf(name);
        if (idx !== -1) {
          sheet.deleteColumn(idx + 1);
          removed++;
        }
      });
    });
    logActivity('Removed Unused Fee Columns', columnNames.join(', '));
    return { success: true, removed: removed };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function buildHeaders() {
  const comps = getFeeComponentsList().filter(c => c.isActive);
  return [
    "id","studentName","phoneNumber","grade","academicSession",
    ...comps.map(c => c.id),
    "isNewStudent","isStopped","studentStatus","discount","totalFees",
    "inst1","inst1Date","inst2","inst2Date","inst3","inst3Date",
    "inst4","inst4Date","inst5","inst5Date","inst6","inst6Date",
    "inst7","inst7Date","inst8","inst8Date","inst9","inst9Date","inst10","inst10Date",
    "totalPaid","balance","paymentStatus","createdAt","updatedAt",
    "paymentMode","recordedBy"
  ];
}

// ── Fee Components ────────────────────────────────────────────
function getFeeComponentsList() {
  try {
    const compSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FEE_COMPONENTS_SHEET);
    const compDefs  = [];
    if (compSheet) {
      const data = compSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        compDefs.push({
          id:                   String(data[i][0]).trim(),
          name:                 String(data[i][1]).trim(),
          defaultAmount:        parseFloat(data[i][2]) || 0,
          isActive:             String(data[i][3]).toUpperCase() === 'TRUE',
          isForNewStudentsOnly: String(data[i][4]).toUpperCase() === 'TRUE',
          order:                parseInt(data[i][5]) || i
        });
      }
      compDefs.sort((a,b) => a.order - b.order);
    }
    return compDefs.length ? compDefs : DEFAULT_COMPONENTS;
  } catch(e) {
    Logger.log('getFeeComponentsList error: ' + e.message);
    return DEFAULT_COMPONENTS;
  }
}

function getFeeComponents() {
  return {success: true, components: getFeeComponentsList()};
}

function addFeeComponent(data) {
  try {
    const sheet     = getOrCreateFeeComponentsSheet();
    const sheetData = sheet.getDataRange().getValues();
    // Generate stable ID from name (no timestamp) so sheet columns always match
    const baseId = data.name.toLowerCase().replace(/[^a-z0-9]/g,'');
    // Check for duplicates and make unique if needed
    let id = baseId;
    let suffix = 2;
    const existingIds = sheetData.slice(1).map(r => String(r[0]).trim());
    while (existingIds.includes(id)) { id = baseId + suffix; suffix++; }
    sheet.appendRow([id, data.name, 0, true, data.isForNewStudentsOnly || false, sheet.getLastRow()]);
    return {success: true, id: id};
  } catch(e) { return {success: false, message: e.message}; }
}

function deleteFeeComponent(id) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FEE_COMPONENTS_SHEET);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) { sheet.deleteRow(i+1); return {success: true}; }
    }
    return {success: false, message: "Not found"};
  } catch(e) { return {success: false, message: e.message}; }
}

// ── Classes ───────────────────────────────────────────────────
function getClasses() {
  try {
    const ss  = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CLASSES_SHEET);
    if (!sheet) {
      try { sheet = ss.insertSheet(CLASSES_SHEET); }
      catch(e) { sheet = ss.getSheetByName(CLASSES_SHEET); }
      if (sheet) {
        sheet.appendRow(["name"]);
        sheet.getRange(1,1,1,1).setBackground('#7c3aed').setFontColor('white').setFontWeight('bold');
        DEFAULT_CLASSES.forEach(c => sheet.appendRow([c]));
      }
    }
    if (!sheet) return {success: true, classes: DEFAULT_CLASSES};
    const data    = sheet.getDataRange().getValues();
    const classes = [];
    const start   = (data.length > 0 && String(data[0][0]).toLowerCase() === 'name') ? 1 : 0;
    for (let i = start; i < data.length; i++) {
      const val = String(data[i][0]).trim();
      if (val && val.toLowerCase() !== 'name') classes.push(val);
    }
    return {success: true, classes: classes.length ? classes : DEFAULT_CLASSES};
  } catch(e) {
    Logger.log('getClasses error: ' + e.message);
    return {success: true, classes: DEFAULT_CLASSES};
  }
}

function saveClasses(classList) {
  try {
    const ss  = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CLASSES_SHEET);
    if (!sheet) {
      try { sheet = ss.insertSheet(CLASSES_SHEET); }
      catch(e) { sheet = ss.getSheetByName(CLASSES_SHEET); }
    }
    if (!sheet) return {success: false, message: 'Cannot find Classes sheet'};
    if (sheet.getLastRow() < 1 || String(sheet.getRange(1,1).getValue()).toLowerCase() !== 'name') {
      sheet.clearContents();
      sheet.appendRow(["name"]);
      sheet.getRange(1,1,1,1).setBackground('#7c3aed').setFontColor('white').setFontWeight('bold');
    }
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    classList.filter(c => c).forEach(c => sheet.appendRow([String(c).trim()]));
    return {success: true};
  } catch(e) {
    Logger.log('saveClasses error: ' + e.message);
    return {success: false, message: e.message};
  }
}

// Renames a class everywhere it's referenced: the Classes list itself,
// every student record's "grade" across all 3 term sheets, and the
// Class Fee Rates sheet — so an edit here doesn't silently orphan
// students from their (renamed) class.
function renameClass(oldName, newName) {
  try {
    oldName = String(oldName || '').trim();
    newName = String(newName || '').trim();
    if (!oldName || !newName) return {success: false, message: 'Both class names are required'};
    if (oldName === newName) return {success: true, updatedStudents: 0};

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Classes list
    const classesRes = getClasses();
    const list = classesRes.classes.map(c => c === oldName ? newName : c);
    saveClasses(list);

    // 2. Student records across all term sheets
    let updatedStudents = 0;
    ["First Term", "Second Term", "Third Term"].forEach(term => {
      const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
      if (!sheet || sheet.getLastRow() < 2) return;
      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      const gradeIdx = headers.indexOf('grade');
      if (gradeIdx === -1) return;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][gradeIdx]).trim() === oldName) {
          sheet.getRange(i + 1, gradeIdx + 1).setValue(newName);
          updatedStudents++;
        }
      }
    });

    // 3. Class Fee Rates sheet (standard rates keyed by class name)
    try {
      const ratesSheet = ss.getSheetByName(CLASS_FEE_RATES_SHEET);
      if (ratesSheet && ratesSheet.getLastRow() > 1) {
        const rData = ratesSheet.getDataRange().getValues();
        const rHeaders = rData[0].map(h => String(h).trim().toLowerCase());
        const classIdx = rHeaders.indexOf('class');
        if (classIdx !== -1) {
          for (let i = 1; i < rData.length; i++) {
            if (String(rData[i][classIdx]).trim() === oldName) {
              ratesSheet.getRange(i + 1, classIdx + 1).setValue(newName);
            }
          }
        }
      }
    } catch (e) { Logger.log('renameClass: class fee rates update skipped - ' + e.message); }

    logActivity('Renamed Class', oldName + ' → ' + newName + ' (' + updatedStudents + ' student records updated)');
    return {success: true, updatedStudents: updatedStudents};
  } catch (e) {
    return {success: false, message: e.message};
  }
}

// ── Authentication ────────────────────────────────────────────
// Register user heartbeat and get count of active users
function registerHeartbeat(username, role) {
  try {
    const cache = CacheService.getScriptCache();
    const now = Date.now();
    let onlineUsersJson = cache.get("online_users_list");
    let onlineUsers = [];
    if (onlineUsersJson) {
      try {
        onlineUsers = JSON.parse(onlineUsersJson);
      } catch(e) {
        onlineUsers = [];
      }
    }
    
    // Filter out inactive users (older than 2 minutes)
    onlineUsers = onlineUsers.filter(u => (now - u.timestamp) < 120000);
    
    // Add or update current user
    const existingIdx = onlineUsers.findIndex(u => String(u.username).trim().toLowerCase() === String(username).trim().toLowerCase());
    if (existingIdx !== -1) {
      onlineUsers[existingIdx].timestamp = now;
      onlineUsers[existingIdx].role = role;
    } else {
      onlineUsers.push({
        username: username,
        role: role,
        timestamp: now
      });
    }
    
    // Save back to cache (max 6 hours, which is 21600 seconds)
    cache.put("online_users_list", JSON.stringify(onlineUsers), 21600);
    
    return {
      success: true,
      onlineCount: onlineUsers.length,
      users: onlineUsers.map(u => ({ username: u.username, role: u.role }))
    };
  } catch(e) {
    return { success: false, message: e.message, onlineCount: 1, users: [] };
  }
}

function unregisterHeartbeat(username) {
  try {
    const cache = CacheService.getScriptCache();
    let onlineUsersJson = cache.get("online_users_list");
    if (onlineUsersJson) {
      try {
        let onlineUsers = JSON.parse(onlineUsersJson);
        onlineUsers = onlineUsers.filter(u => String(u.username).trim().toLowerCase() !== String(username).trim().toLowerCase());
        cache.put("online_users_list", JSON.stringify(onlineUsers), 21600);
      } catch(e) {}
    }
    return {success: true};
  } catch(e) { return {success: false}; }
}

// ── Authentication ────────────────────────────────────────────
function authenticateUser(email, name, password, auditData) {
  try {
    const sheet = getOrCreateUsersSheet();
    const data  = sheet.getDataRange().getValues();
    const cleanId = String(email || name || '').trim().toLowerCase();
    const cleanPwd = String(password || '').trim();
    for (let i = 1; i < data.length; i++) {
      const dbEmail = String(data[i][0] || '').trim().toLowerCase();
      const dbName  = String(data[i][1] || '').trim().toLowerCase();
      const dbPwd   = String(data[i][2] || '').trim();
      
      const matchEmail = cleanId && dbEmail === cleanId && dbPwd === cleanPwd;
      const matchName  = cleanId && dbName === cleanId && dbPwd === cleanPwd;
      if (matchEmail || matchName) {
        sheet.getRange(i+1, 5).setValue(new Date().toISOString());
        const userObj = {email: data[i][0], name: data[i][1], role: data[i][3]};
        if (auditData) {
          logLoginAudit(userObj.email || userObj.name, userObj.role, auditData);
        }
        return {success: true, user: userObj};
      }
    }
    return {success: false, message: "Invalid credentials"};
  } catch(e) { return {success: false, message: e.message}; }
}

function changePassword(currentPassword, newPassword, newUsername) {
  try {
    const userProps   = PropertiesService.getUserProperties();
    const userJson    = userProps.getProperty('currentUser');
    if (!userJson) return {success: false, message: "Not logged in"};
    const currentUser = JSON.parse(userJson);
    const sheet = getOrCreateUsersSheet();
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const match = (currentUser.email && data[i][0] === currentUser.email) ||
                    (currentUser.name  && data[i][1] === currentUser.name);
      if (match) {
        if (data[i][2] !== currentPassword) return {success: false, message: "Current password incorrect"};
        sheet.getRange(i+1, 3).setValue(newPassword);
        if (newUsername && currentUser.role === 'admin') sheet.getRange(i+1, 2).setValue(newUsername);
        return {success: true};
      }
    }
    return {success: false, message: "User not found"};
  } catch(e) { return {success: false, message: e.message}; }
}

function addUser(email, name, password, role) {
  try {
    getOrCreateUsersSheet().appendRow([email||"", name, password, role, ""]);
    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}

function getUsers() {
  try {
    const data  = getOrCreateUsersSheet().getDataRange().getValues();
    const users = [];
    for (let i = 1; i < data.length; i++) {
      var email = String(data[i][0] || "").trim();
      var name  = String(data[i][1] || "").trim();
      var role  = String(data[i][3] || "").trim();
      var pwd   = String(data[i][2] || "").trim();
      if (!name && !email) continue; // skip completely empty rows
      users.push({email: email, name: name, role: role, password: pwd});
    }
    return {success: true, users: users};
  } catch(e) { return {success: false, message: e.message}; }
}

function deleteUser(email, name) {
  try {
    const sheet = getOrCreateUsersSheet();
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if ((email && data[i][0] === email) || (name && data[i][1] === name)) {
        sheet.deleteRow(i+1); return {success: true};
      }
    }
    return {success: false, message: "Not found"};
  } catch(e) { return {success: false, message: e.message}; }
}

function editUser(oldEmail, oldName, newEmail, newName, newPassword, newRole) {
  try {
    const sheet = getOrCreateUsersSheet();
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const dbEmail = String(data[i][0] || '').trim().toLowerCase();
      const dbName  = String(data[i][1] || '').trim().toLowerCase();
      const matchEmail = oldEmail && dbEmail === String(oldEmail).trim().toLowerCase();
      const matchName  = oldName  && dbName === String(oldName).trim().toLowerCase();
      if (matchEmail || matchName) {
        sheet.getRange(i+1, 1).setValue(newEmail || "");
        sheet.getRange(i+1, 2).setValue(newName);
        sheet.getRange(i+1, 3).setValue(newPassword);
        sheet.getRange(i+1, 4).setValue(newRole);
        
        logActivity('Edited User', oldName + ' -> ' + newName + ' (' + newRole + ')');
        return {success: true};
      }
    }
    return {success: false, message: "User not found"};
  } catch(e) { return {success: false, message: e.message}; }
}

// ── Settings ──────────────────────────────────────────────────
function getSettings() {
  try {
    const sheet = getOrCreateSheet(SETTINGS_SHEET, ["key","value"]);
    const data  = sheet.getDataRange().getValues();
    const s     = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) s[data[i][0]] = data[i][1];
    }
    
    // Load secure script properties
    try {
      const scriptProps = PropertiesService.getScriptProperties();
      const secureProps = scriptProps.getProperties();
      s['schoolApiUrl'] = secureProps['schoolApiUrl'] || '';
      s['schoolApiKey'] = secureProps['schoolApiKey'] ? '••••••••••••••••' : '';
    } catch(propErr) {
      Logger.log('Error reading script properties: ' + propErr.message);
    }
    
    return {success: true, settings: s};
  } catch(e) { return {success: false, message: e.message}; }
}

function saveSettings(settingsData) {
  try {
    const propsToSaveInScript = {};
    const sheetData = {};
    
    Object.keys(settingsData).forEach(key => {
      if (key === 'schoolApiUrl' || key === 'schoolApiKey') {
        propsToSaveInScript[key] = settingsData[key];
      } else {
        sheetData[key] = settingsData[key];
      }
    });

    // Save secure properties in PropertiesService
    if (Object.keys(propsToSaveInScript).length > 0) {
      const scriptProps = PropertiesService.getScriptProperties();
      scriptProps.setProperties(propsToSaveInScript);
    }
    
    // Save other settings in sheet
    if (Object.keys(sheetData).length > 0) {
      const sheet = getOrCreateSheet(SETTINGS_SHEET, ["key","value"]);
      const data  = sheet.getDataRange().getValues();
      Object.keys(sheetData).forEach(key => {
        let found = false;
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === key) {
            sheet.getRange(i+1, 2).setValue(sheetData[key]);
            data[i][1] = sheetData[key];
            found = true; break;
          }
        }
        if (!found) sheet.appendRow([key, sheetData[key]]);
      });
      
      // Auto-schedule or delete daily trigger based on UI toggle parameter.
      // Only touch the trigger when this save actually included the toggle — otherwise
      // an unrelated partial save (e.g. just the theme) would silently disable it.
      if (sheetData.hasOwnProperty('enableAutoDailyEmail')) {
        if (String(sheetData['enableAutoDailyEmail']).toLowerCase() === 'true') {
          try {
            setupDailyAccountingTrigger();
          } catch(e) {
            Logger.log("Failed to setup trigger: " + e.toString());
          }
        } else {
          try {
            deleteDailyAccountingTrigger();
          } catch(e) {
            Logger.log("Failed to delete trigger: " + e.toString());
          }
        }
      }

      // Auto-schedule or delete the automatic outstanding-balance SMS trigger,
      // same guarded pattern as the daily accounting trigger above.
      if (sheetData.hasOwnProperty('enableAutoOutstandingSms')) {
        if (String(sheetData['enableAutoOutstandingSms']).toLowerCase() === 'true') {
          try {
            setupAutoOutstandingSmsTrigger(sheetData['autoOutstandingSmsTime'] || '08:00');
          } catch(e) {
            Logger.log("Failed to setup outstanding SMS trigger: " + e.toString());
          }
        } else {
          try {
            deleteAutoOutstandingSmsTrigger();
          } catch(e) {
            Logger.log("Failed to delete outstanding SMS trigger: " + e.toString());
          }
        }
      }
    }

    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}

function uploadSchoolLogo(base64)  { return saveSettings({schoolLogo:  base64}); }
function uploadSchoolStamp(base64) { return saveSettings({schoolStamp: base64}); }
function uploadSignature(base64)   { return saveSettings({signature:   base64}); }

// ── Parent Portal ────────────────────────────────────────
// Returns school info + student record for the portal (no auth needed)
function getPublicSchoolData(studentIdOrPhone) {
  try {
    try { ensureStudentPhotoColumn(); } catch(e) { Logger.log("ensureStudentPhotoColumn error: " + e.message); }
    const s = getSettings();
    const settings = s.success ? s.settings : {};
    
    let studentId = studentIdOrPhone;
    
    // Detect phone number lookup (starts with +, 0, or digits only, length >= 9)
    const cleanInput = String(studentIdOrPhone).replace(/\D/g, "");
    if (cleanInput.length >= 9) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const terms = ["First Term","Second Term","Third Term"];
      let foundId = "";
      for (const term of terms) {
        const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
        if (!sheet) continue;
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) continue;
        const headers = data[0].map(h => String(h).trim());
        const idIdx = headers.indexOf('id');
        const phoneIdx = headers.indexOf('phoneNumber');
        if (idIdx === -1 || phoneIdx === -1) continue;
        
        for (let i = 1; i < data.length; i++) {
          const rowPhone = String(data[i][phoneIdx] || '').replace(/\D/g, "");
          if (rowPhone && (rowPhone === cleanInput || rowPhone.endsWith(cleanInput) || cleanInput.endsWith(rowPhone))) {
            foundId = String(data[i][idIdx]).trim();
            break;
          }
        }
        if (foundId) break;
      }
      if (foundId) {
        studentId = foundId;
      }
    }

    // Find student record
    let record = null;
    const terms = ["First Term","Second Term","Third Term"];
    for (const term of terms) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet()
                      .getSheetByName(SHEET_PREFIX + " - " + term);
      if (!sheet) continue;
      const data    = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const idIdx   = headers.indexOf('id');
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]).trim().toLowerCase() === studentId.trim().toLowerCase()) {
          const rec = {};
          headers.forEach((h, idx) => {
            const val = data[i][idx];
            if (val instanceof Date)
              rec[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            else rec[h] = val;
          });
          record = rec; break;
        }
      }
      if (record) break;
    }
    
    if (record) {
      let virtualPaymentSum = 0;
      try {
        const notifSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Payment Notifications');
        if (notifSheet) {
          const notifData = notifSheet.getDataRange().getValues();
          if (notifData.length > 1) {
            const notifHeaders = notifData[0].map(h => String(h).trim().toLowerCase());
            const sidIdx = notifHeaders.indexOf('studentid') !== -1 ? notifHeaders.indexOf('studentid') : notifHeaders.indexOf('id');
            const amtIdx = notifHeaders.indexOf('amount');
            const statusIdx = notifHeaders.indexOf('status');
            
            if (sidIdx !== -1 && amtIdx !== -1 && statusIdx !== -1) {
              const targetSid = String(studentId).trim().toLowerCase();
              for (let j = 1; j < notifData.length; j++) {
                const rowSid = String(notifData[j][sidIdx]).trim().toLowerCase();
                const rowStatus = String(notifData[j][statusIdx]).trim();
                const rowAmt = parseFloat(notifData[j][amtIdx]) || 0;
                
                if (rowSid === targetSid && rowStatus === 'Confirmed') {
                  virtualPaymentSum += rowAmt;
                }
              }
            }
          }
        }
      } catch (err) {
        Logger.log('Error adding virtual payments in getPublicSchoolData: ' + err.message);
      }
      
      if (virtualPaymentSum > 0) {
        const originalTotalPaid = parseFloat(record.totalPaid) || 0;
        const originalBalance = parseFloat(record.balance) || 0;
        const originalTotalFees = parseFloat(record.totalFees) || 0;
        
        record.totalPaid = originalTotalPaid + virtualPaymentSum;
        record.balance = Math.max(0, originalBalance - virtualPaymentSum);
        record.paymentStatus = originalTotalFees === 0 ? "No Fees"
                             : record.balance <= 0 ? "Paid"
                             : record.totalPaid > 0 ? "Partially Paid" : "Unpaid";
        
        Logger.log('getPublicSchoolData: Applied virtualPaymentSum of ' + virtualPaymentSum + ' for ' + studentId + '. New totalPaid: ' + record.totalPaid + ', balance: ' + record.balance);
      }
    }

    // Load siblings who share the same parent phone number
    let siblings = [];
    if (record && record.phoneNumber) {
      try {
        const mainPhoneNormalized = String(record.phoneNumber).replace(/\D/g, "");
        if (mainPhoneNormalized && mainPhoneNormalized.length >= 9) {
          const cleanMainPhone = mainPhoneNormalized.startsWith("233") && mainPhoneNormalized.length === 12 ? "0" + mainPhoneNormalized.substring(3) : mainPhoneNormalized;
          
          const terms = ["First Term","Second Term","Third Term"];
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const seenSiblingIds = {};
          seenSiblingIds[String(record.id).trim().toLowerCase()] = true; // skip main student
          
          const activeYr = settings.academicYear || '2025/2026';
          const activeTerm = settings.activeTerm || 'First Term';
          const activeSess = activeYr + ' ' + activeTerm;
          
          // Collect every row across all three term sheets that shares the parent's
          // phone number, then keep ONE record per sibling student — preferring their
          // record for the current active session, but falling back to their latest
          // known record. Previously a sibling with no active-session record yet (not
          // registered for the new term, still on an older/newer term) was silently
          // dropped from the portal entirely even though the phone number matched.
          const candidatesByStudent = {}; // studentId(lower) -> { active: rec|null, latest: rec|null, latestTs: number }
          for (const term of terms) {
            const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
            if (!sheet) continue;
            const data = sheet.getDataRange().getValues();
            if (data.length <= 1) continue;
            const headers = data[0].map(h => String(h).trim());
            const idIdx = headers.indexOf('id');
            const phoneIdx = headers.indexOf('phoneNumber');
            const sessIdx = headers.indexOf('academicSession');

            if (idIdx === -1 || phoneIdx === -1) continue;

            for (let i = 1; i < data.length; i++) {
              const rowId = String(data[i][idIdx] || '').trim();
              const rowPhone = String(data[i][phoneIdx] || '').trim();

              if (!rowId || !rowPhone) continue;
              if (seenSiblingIds[rowId.toLowerCase()]) continue;

              const rowPhoneNormalized = rowPhone.replace(/\D/g, "");
              const cleanRowPhone = rowPhoneNormalized.startsWith("233") && rowPhoneNormalized.length === 12 ? "0" + rowPhoneNormalized.substring(3) : rowPhoneNormalized;
              if (cleanRowPhone !== cleanMainPhone) continue;

              const rowSess = sessIdx !== -1 ? String(data[i][sessIdx] || '').trim() : '';
              const rec = {};
              headers.forEach((h, idx) => {
                const val = data[i][idx];
                if (val instanceof Date)
                  rec[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
                else rec[h] = val;
              });

              const key = rowId.toLowerCase();
              if (!candidatesByStudent[key]) candidatesByStudent[key] = { active: null, latest: null, latestTs: -1 };
              if (rowSess && rowSess.includes(activeSess)) {
                candidatesByStudent[key].active = rec;
              }
              const ts = Date.parse(rec.updatedAt || rec.createdAt || '') || 0;
              if (ts >= candidatesByStudent[key].latestTs) {
                candidatesByStudent[key].latest = rec;
                candidatesByStudent[key].latestTs = ts;
              }
            }
          }

          Object.keys(candidatesByStudent).forEach(key => {
            if (seenSiblingIds[key]) return;
            seenSiblingIds[key] = true;
            const chosen = candidatesByStudent[key].active || candidatesByStudent[key].latest;
            if (!chosen) return;

            // Fetch sibling custom fees
            let sibCustomFees = [];
            const cfRes = getCustomStudentFees(chosen.id);
            if (cfRes.success) {
              sibCustomFees = cfRes.history;
            }

            const sibExtras = getStudentUniformsAndBooks(chosen.id);
            siblings.push({
              record: chosen,
              customFees: sibCustomFees,
              uniforms: sibExtras.uniforms,
              books: sibExtras.books
            });
          });
        }
      } catch (sibErr) {
        Logger.log("Error fetching siblings in getPublicSchoolData: " + sibErr.message);
      }
    }

    // Get classes list for the portal dropdown
    const classesData = getClasses();
    const classesList = classesData.success ? classesData.classes : [];

    let customFees = [];
    if (record) {
      const res = getCustomStudentFees(record.id);
      if (res.success) {
        customFees = res.history;
      }
    }

    const extras = record ? getStudentUniformsAndBooks(record.id) : { uniforms: [], books: [] };
    
    return {
      success: true,
      school: {
        name:      settings.schoolName     || '',
        address:   settings.schoolAddress  || '',
        phone:     settings.schoolPhone    || '',
        email:     settings.schoolEmail    || '',
        motto:     settings.schoolMotto    || '',
        logo:      settings.schoolLogo     || '',
        currency:  settings.currency       || 'GHC',
        academicYear: settings.academicYear || '',
        activeTerm:   settings.activeTerm   || '',
        facebook:  settings.facebook       || '',
        twitter:   settings.twitter        || '',
        instagram: settings.instagram      || '',
        whatsapp:  settings.whatsappLink   || '',
        website:   settings.website        || '',
        momoName:  settings.momoName       || '',
        momoNumber: settings.momoNumber    || '',
        momoNote:  settings.momoNote       || '',
        paymentMethods: settings.paymentMethods || '',
        billFooter: settings.billFooter    || '',
        classes:   classesList,
        rolloverCustomFees: settings.rolloverCustomFees || '',
        nextTermIncludedExtraFees: settings.nextTermIncludedExtraFees || '',
        systemFont: settings.systemFont || 'Inter',
        systemFontSize: settings.systemFontSize || 'normal',
        systemFontWeight: settings.systemFontWeight || '400',
        feeComponents: (function() {
          if (!settings.feeComponents) {
            return [
              { id: 'tuitionFees', name: 'Tuition Fees', isActive: true },
              { id: 'admissionFees', name: 'Admission Fees', isActive: true, isForNewStudentsOnly: true }
            ];
          }
          if (typeof settings.feeComponents === 'string') {
            try { return JSON.parse(settings.feeComponents); } catch(e) { return []; }
          }
          return settings.feeComponents;
        })()
      },
      record: record,
      siblings: siblings,
      customFeeTypes: (function() {
        if (!settings.customFeeTypes) return [];
        if (typeof settings.customFeeTypes === 'string') {
          try { return JSON.parse(settings.customFeeTypes); } catch(e) { return []; }
        }
        if (Array.isArray(settings.customFeeTypes)) return settings.customFeeTypes;
        return [];
      })(),
      customFees: customFees,
      uniforms: extras.uniforms,
      books: extras.books
    };
  } catch(e) {
    Logger.log('getPublicSchoolData error: ' + e.message);
    return {success: false, message: e.message};
  }
}

// Parent submits payment notification with reference ID
function submitPaymentNotification(data) {
  try {
    const sheet = getOrCreateSheet('Payment Notifications',
      ['timestamp','studentId','studentName','amount','reference','momoNumber','note','status','paymentMethodUsed']);
    ensureColumnExists('Payment Notifications', 'paymentMethodUsed', '');
    sheet.appendRow([
      new Date().toISOString(),
      data.studentId   || '',
      data.studentName || '',
      data.amount      || '',
      data.reference   || '',
      data.momoNumber  || '',
      data.note        || '',
      'Pending',
      data.paymentMethodUsed || ''
    ]);
    // Highlight new row in yellow
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, 9).setBackground('#fef9c3');
    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}

// ── Payment Notifications (Parent Portal) ─────────────
function getPaymentNotifications() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
                    .getSheetByName('Payment Notifications');
    if (!sheet || sheet.getLastRow() <= 1) {
      return {success: true, notifications: []};
    }
    const data    = sheet.getDataRange().getValues();
    const headers = data[0]; // timestamp,studentId,studentName,amount,reference,momoNumber,note,status
    const notes   = [];
    for (let i = 1; i < data.length; i++) {
      notes.push({
        row:         i + 1,
        timestamp:   data[i][0] ? (data[i][0] instanceof Date
                       ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
                       : String(data[i][0]).substring(0, 16).replace('T',' '))
                       : '',
        studentId:   String(data[i][1] || ''),
        studentName: String(data[i][2] || ''),
        amount:      data[i][3] || '',
        reference:   String(data[i][4] || ''),
        momoNumber:  String(data[i][5] || ''),
        note:        String(data[i][6] || ''),
        status:      String(data[i][7] || 'Pending'),
        paymentMethodUsed: String(data[i][8] || '')
      });
    }
    // newest first
    notes.reverse();
    return {success: true, notifications: notes};
  } catch(e) {
    Logger.log('getPaymentNotifications error: ' + e.message);
    return {success: false, message: e.message, notifications: []};
  }
}

function updateNotificationStatus(row, status) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
                    .getSheetByName('Payment Notifications');
    if (!sheet) return {success: false, message: 'Sheet not found'};
    sheet.getRange(row, 8).setValue(status);
    // Color by status
    var color = status === 'Confirmed' ? '#dcfce7'
              : status === 'Rejected'  ? '#fee2e2'
              : status === 'Recorded'  ? '#f3f4f6'
              : '#fef9c3';
    sheet.getRange(row, 1, 1, 9).setBackground(color);
    
    let autoRecordMsg = '';
    let updatedRecord = null;
    let updatedCustomRecord = null;
    if (status === 'Confirmed') {
      const rowValues = sheet.getRange(row, 1, 1, 7).getValues()[0];
      const studentId = rowValues[1];
      const amount = parseFloat(rowValues[3]) || 0;
      const reference = rowValues[4];
      const momoNumber = rowValues[5];
      const note = rowValues[6];
      
      const recordRes = recordPaymentAutomatically(studentId, amount, reference, momoNumber, note);
      if (recordRes.success) {
        autoRecordMsg = 'Payment automatically recorded: ' + recordRes.message;
        updatedRecord = recordRes.record;
        updatedCustomRecord = recordRes.customRecord;
      } else {
        autoRecordMsg = 'Could not record automatically: ' + recordRes.message;
      }
    }
    
    return {success: true, autoRecordMsg: autoRecordMsg, record: updatedRecord, customRecord: updatedCustomRecord};
  } catch(e) { return {success: false, message: e.message}; }
}

// Automatically record confirmed payments into the first available student installment slot
function recordPaymentAutomatically(studentId, amount, ref, momo, note) {
  try {
    Logger.log('recordPaymentAutomatically: Starting auto-record for studentId: ' + studentId + ', amount: ' + amount);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if it's a family payment
    if (studentId && String(studentId).indexOf('FAMILY:') === 0) {
      const ids = studentId.substring('FAMILY:\x3a'.length ? 7 : 7).split(',');
      let remaining = amount;
      let lastRecord = null;
      
      // Calculate balances and map student info
      const list = [];
      for (let k = 0; k < ids.length; k++) {
        const id = ids[k].trim();
        const studentInfo = findStudentObj(id, ss);
        if (studentInfo) {
          const totals = calculateStudentTotals(studentInfo);
          list.push({
            id: id,
            balance: totals.balance,
            studentInfo: studentInfo
          });
        }
      }
      
      // Distribute sequentially
      for (let k = 0; k < list.length; k++) {
        const w = list[k];
        if (remaining <= 0) break;
        const pay = Math.min(remaining, w.balance);
        if (pay > 0) {
          const autoRes = recordSingleAutoPayment(w.studentInfo, pay, ref, momo, note);
          if (autoRes.success) {
            lastRecord = autoRes.record;
          }
          remaining -= pay;
        }
      }
      
      // Leftover goes to the first child
      if (remaining > 0 && list.length > 0) {
        const firstWard = findStudentObj(list[0].id, ss);
        if (firstWard) {
          const autoRes = recordSingleAutoPayment(firstWard, remaining, ref, momo, note);
          if (autoRes.success) {
            lastRecord = autoRes.record;
          }
        }
      }
      
      return { success: true, message: 'Distributed family payment among siblings.', record: lastRecord };
    }
    
    // Parse feeTypeName from note
    let feeTypeName = 'regular';
    if (note && note.indexOf('[Fee Type: ') === 0) {
      let closeBracketIdx = note.indexOf(']');
      if (closeBracketIdx !== -1) {
        feeTypeName = note.substring('[Fee Type: '.length, closeBracketIdx).trim();
      }
    }
    
    // First, find the student in regular term sheets to get their basic details (needed for both regular and custom fees)
    let studentObj = null;
    const termSheets = ["First Term", "Second Term", "Third Term"];
    for (let t = 0; t < termSheets.length; t++) {
      const sheetName = SHEET_PREFIX + " - " + termSheets[t];
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIdx = headers.indexOf("id");
      if (idIdx === -1) continue;
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
          studentObj = { rowNum: i + 1, sheetName: sheetName, headers: headers };
          headers.forEach((h, idx) => {
            studentObj[h] = data[i][idx];
          });
          break;
        }
      }
      if (studentObj) break;
    }
    
    if (!studentObj) {
      Logger.log('recordPaymentAutomatically: Student not found in any term sheet.');
      return { success: false, message: 'Student not found in any term sheet.' };
    }
    
    if (feeTypeName === 'regular') {
      // ── Handle Regular School Fees ──
      // Find first empty installment slot
      let instIndex = -1;
      for (let j = 1; j <= 10; j++) {
        const instKey = Object.keys(studentObj).find(k => String(k).trim().toLowerCase() === 'inst' + j);
        const rawVal = instKey ? studentObj[instKey] : '';
        const val = parseFloat(rawVal) || 0;
        if (val === 0) {
          instIndex = j;
          break;
        }
      }
      
      if (instIndex !== -1) {
        const instKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex) || ('inst' + instIndex);
        const dateKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex + 'date') || ('inst' + instIndex + 'Date');
        const modeKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'paymentmode') || 'paymentMode';
        const recByKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'recordedby') || 'recordedBy';
        
        studentObj[instKey] = amount;
        const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        studentObj[dateKey] = formattedDate;
        studentObj[modeKey] = 'Mobile Money';
        studentObj[recByKey] = 'Parent Portal (Auto)';
        
        // Remove helper fields before saving
        const recordData = {};
        studentObj.headers.forEach(h => {
          recordData[h] = studentObj[h];
        });
        
        const saveRes = saveRecord(recordData);
        if (saveRes.success) {
          return { success: true, message: 'Automatically recorded into installment ' + instIndex, record: saveRes.record };
        } else {
          return { success: false, message: 'Failed to save updated record: ' + saveRes.message };
        }
      } else {
        return { success: false, message: 'All 10 installment slots are already filled.' };
      }
      
    } else {
      // ── Handle Custom Fees (e.g. Books, PTA) ──
      const customSheet = getOrCreateCustomFeeRecordsSheet();
      const customHeaders = customSheet.getRange(1, 1, 1, customSheet.getLastColumn()).getValues()[0].map(h => String(h || '').trim());
      const customData = customSheet.getDataRange().getValues();
      
      const stuIdIdx = customHeaders.indexOf('studentId');
      const feeNameIdx = customHeaders.indexOf('feeTypeName');
      const sessionIdx = customHeaders.indexOf('academicSession');
      
      let existingRecord = null;
      let existingRow = -1;
      for (let i = 1; i < customData.length; i++) {
        if (String(customData[i][stuIdIdx]).trim() === String(studentId).trim() && 
            String(customData[i][feeNameIdx]).trim() === feeTypeName &&
            String(customData[i][sessionIdx]).trim() === studentObj.academicSession) {
          existingRow = i + 1;
          existingRecord = {};
          customHeaders.forEach((h, idx) => {
            existingRecord[h] = customData[i][idx];
          });
          break;
        }
      }
      
      // If no custom fee record exists, initialize a new one
      if (!existingRecord) {
        // Load custom fee configuration from settings
        const settingsRes = getSettings();
        let customFeeTypesList = [];
        if (settingsRes.success && settingsRes.settings.customFeeTypes) {
          try {
            customFeeTypesList = JSON.parse(settingsRes.settings.customFeeTypes);
          } catch(e) {}
        }
        
        let configItem = customFeeTypesList.find(cf => cf.name === feeTypeName);
        let feeAmount = 0;
        let numInstallments = 1;
        let isInstallment = false;
        if (configItem) {
          feeAmount = parseFloat(configItem.defaultAmount) || 0;
          if (configItem.classAmounts && configItem.classAmounts[studentObj.grade] !== undefined) {
            feeAmount = parseFloat(configItem.classAmounts[studentObj.grade]) || 0;
          }
          numInstallments = parseInt(configItem.numInstallments) || 1;
          isInstallment = !!configItem.installmentAllowed;
        }
        
        existingRecord = {
          studentId: studentId,
          studentName: studentObj.studentName,
          grade: studentObj.grade,
          academicSession: studentObj.academicSession,
          feeTypeName: feeTypeName,
          amount: feeAmount,
          isInstallment: isInstallment,
          numInstallments: numInstallments,
          inst1: 0, inst1Date: '', inst1Mode: '',
          inst2: 0, inst2Date: '', inst2Mode: '',
          inst3: 0, inst3Date: '', inst3Mode: '',
          inst4: 0, inst4Date: '', inst4Mode: '',
          inst5: 0, inst5Date: '', inst5Mode: '',
          inst6: 0, inst6Date: '', inst6Mode: ''
        };
      }
      
      // Find first empty installment slot in the custom fee record
      let instIndex = -1;
      const allowedInst = parseInt(existingRecord.numInstallments) || 1;
      for (let j = 1; j <= Math.min(allowedInst, 6); j++) {
        const val = parseFloat(existingRecord['inst' + j]) || 0;
        if (val === 0) {
          instIndex = j;
          break;
        }
      }
      
      if (instIndex !== -1) {
        existingRecord['inst' + instIndex] = amount;
        existingRecord['inst' + instIndex + 'Date'] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
        existingRecord['inst' + instIndex + 'Mode'] = 'Mobile Money';
        existingRecord.paymentMode = 'Mobile Money';
        existingRecord.recordedBy = 'Parent Portal (Auto)';
        
        const saveRes = saveCustomFeeRecord(existingRecord);
        if (saveRes.success) {
          return { success: true, message: 'Automatically recorded custom fee into ' + feeTypeName + ', installment ' + instIndex, record: studentObj, customRecord: saveRes.record };
        } else {
          return { success: false, message: 'Failed to save updated custom fee record: ' + saveRes.message };
        }
      } else {
        return { success: false, message: 'All allowed installment slots for this custom fee are already filled.' };
      }
    }
  } catch(e) {
    Logger.log('recordPaymentAutomatically error: ' + e.message);
    return { success: false, message: e.message };
  }
}



// ── Parent-Admin Messaging ────────────────────────────
const MESSAGES_SHEET = 'Messages';

function getOrCreateMessagesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(MESSAGES_SHEET);
  if (sh) return sh;
  try {
    sh = ss.insertSheet(MESSAGES_SHEET);
    sh.appendRow(['id','timestamp','studentId','studentName','sender','type','content','read','adminReply','replyTimestamp']);
    sh.getRange(1,1,1,10).setBackground('#7c3aed').setFontColor('white').setFontWeight('bold');
  } catch(e) {
    sh = ss.getSheetByName(MESSAGES_SHEET);
    if (!sh) throw e;
  }
  return sh;
}

// Parent sends message to admin
function sendParentMessage(data) {
  try {
    const sh  = getOrCreateMessagesSheet();
    const id  = 'MSG' + Date.now();
    const ts  = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([
      id,
      ts,
      data.studentId   || '',
      data.studentName || '',
      'parent',
      data.type        || 'text',   // text | audio
      data.content     || '',
      'false',
      '',
      ''
    ]);
    sh.getRange(sh.getLastRow(), 1, 1, 10).setBackground('#eff6ff');
    return {success: true, id: id};
  } catch(e) { return {success: false, message: e.message}; }
}

// Admin gets all messages
function getAdminMessages() {
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);
    if (!sh || sh.getLastRow() <= 1) return {success: true, messages: [], unread: 0};
    const data = sh.getDataRange().getValues();
    const msgs = [];
    let unread = 0;
    for (let i = 1; i < data.length; i++) {
      const read = String(data[i][7]).toLowerCase() === 'true';
      if (!read) unread++;
      msgs.push({
        row:          i + 1,
        id:           String(data[i][0]),
        timestamp:    String(data[i][1]),
        studentId:    String(data[i][2]),
        studentName:  String(data[i][3]),
        sender:       String(data[i][4]),
        type:         String(data[i][5]),
        content:      String(data[i][6]),
        read:         read,
        adminReply:   String(data[i][8] || ''),
        replyTs:      String(data[i][9] || '')
      });
    }
    msgs.reverse(); // newest first
    return {success: true, messages: msgs, unread: unread};
  } catch(e) { return {success: false, message: e.message, messages: [], unread: 0}; }
}

// Admin replies to a message
function replyToMessage(row, reply) {
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);
    if (!sh) return {success: false, message: 'Messages sheet not found'};
    const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    sh.getRange(row, 8).setValue('true');
    sh.getRange(row, 9).setValue(reply);
    sh.getRange(row, 10).setValue(ts);
    sh.getRange(row, 1, 1, 10).setBackground('#dcfce7');
    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}

// Parent polls for admin reply
function getParentMessages(studentId) {
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);
    if (!sh || sh.getLastRow() <= 1) return {success: true, messages: []};
    const data = sh.getDataRange().getValues();
    const msgs = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim().toLowerCase() !== studentId.trim().toLowerCase()) continue;
      msgs.push({
        id:          String(data[i][0]),
        timestamp:   String(data[i][1]),
        type:        String(data[i][5]),
        content:     String(data[i][6]),
        adminReply:  String(data[i][8] || ''),
        replyTs:     String(data[i][9] || '')
      });
    }
    msgs.reverse();
    return {success: true, messages: msgs};
  } catch(e) { return {success: false, message: e.message, messages: []}; }
}

// Mark messages read
function markMessagesRead(rows) {
  try {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MESSAGES_SHEET);
    if (!sh) return {success: false};
    rows.forEach(function(row) { sh.getRange(row, 8).setValue('true'); });
    return {success: true};
  } catch(e) { return {success: false}; }
}


// ── Arkesel SMS ──────────────────────────────────────────
// NOTE: Arkesel HTTP calls are made CLIENT-SIDE (browser) to avoid
// UrlFetchApp permission issues. These functions only return data.

// Returns Arkesel API key + sender to the admin browser (requires login)
function getArkeselConfig() {
  try {
    const s = getSettings();
    if (!s.success) return {success: false, message: 'Could not load settings'};
    const settings = s.settings;
    return {
      success:   true,
      apiKey:    settings.arkeselApiKey  || '',
      sender:    settings.arkeselSender  || settings.schoolName || 'School',
      currency:  settings.currency       || 'GHC',
      schoolName:settings.schoolName     || 'School'
    };
  } catch(e) { return {success: false, message: e.message}; }
}

// Sends a 6-digit OTP to a parent's phone via Arkesel (server-side) for multi-child portal login
// Falls back to Gmail if no Arkesel API key is configured
function sendParentVerificationCode(phone, otp) {
  try {
    const s = getSettings();
    const settings = s.success ? s.settings : {};
    const schoolName = settings.schoolName || 'School';
    const msg = schoolName + ' Portal Verification Code: ' + otp + '. Valid for 5 minutes. Do not share this code.';

    // Try Arkesel SMS
    const apiKey = settings.arkeselApiKey || '';
    const sender = settings.arkeselSender || schoolName;
    if (apiKey) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const url = 'https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + encodeURIComponent(apiKey) +
                  '&to=' + encodeURIComponent(cleanPhone) +
                  '&from=' + encodeURIComponent(sender.substring(0, 11)) +
                  '&sms=' + encodeURIComponent(msg);
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const body = resp.getContentText();
      const parsed = JSON.parse(body);
      if (parsed && (parsed.status === 'success' || parsed.code === 'ok')) {
        return { success: true };
      }
    }

    // Fallback: Email (admin notification only — no parent email available from phone)
    const adminEmail = settings.adminEmail || '';
    if (adminEmail) {
      GmailApp.sendEmail(adminEmail,
        '[' + schoolName + '] Parent OTP Request',
        'A parent with phone ' + phone + ' requested portal OTP: ' + otp + '. SMS delivery failed. Please relay manually if needed.'
      );
    }

    return { success: false, message: 'SMS could not be delivered. Admin notified.' };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// Returns list of recipients (name + phone + fee data) for bulk SMS
// The browser will call Arkesel directly with this data
function getBulkSmsRecipients(filters) {
  try {
    const records  = getData();
    let   targets  = records;
    const s        = getSettings();
    const settings = s.success ? s.settings : {};
    const currency = settings.currency || 'GHC';

    // Apply filters
    if (filters.term && filters.term !== 'all') {
      targets = targets.filter(r => String(r.academicSession||'').includes(filters.term));
    }
    if (filters.grade && filters.grade !== 'all') {
      targets = targets.filter(r =>
        String(r.grade||'').toLowerCase() === String(filters.grade).toLowerCase());
    }
    if (filters.status && filters.status !== 'all') {
      const status = filters.status.toLowerCase();
      targets = targets.filter(r => {
        const b = parseFloat(r.balance)   || 0;
        const p = parseFloat(r.totalPaid) || 0;
        const f = parseFloat(r.totalFees) || 0;
        if (status === 'unpaid')  return f > 0 && p === 0;
        if (status === 'partial') return p > 0 && b > 0;
        if (status === 'paid')    return f > 0 && b <= 0;
        if (status === 'owing')   return b > 0;
        return true;
      });
    }

    // Keep only those with phone numbers
    targets = targets.filter(r => String(r.phoneNumber||'').replace(/\D/g,'').length >= 9);

    // Deduplicate by phone
    const seen = new Set();
    const unique = [];
    targets.forEach(r => {
      const num = String(r.phoneNumber).replace(/\D/g, '');
      if (!seen.has(num)) { seen.add(num); unique.push(r); }
    });

    // Return only what the browser needs to build messages
    const recipients = unique.map(r => ({
      name:     r.studentName || '',
      id:       r.id          || '',
      grade:    r.grade       || '',
      session:  r.academicSession || '',
      phone:    r.phoneNumber || '',
      fees:     currency + ' ' + (parseFloat(r.totalFees)||0).toFixed(2),
      paid:     currency + ' ' + (parseFloat(r.totalPaid)||0).toFixed(2),
      balance:  currency + ' ' + Math.max(0, parseFloat(r.balance)||0).toFixed(2)
    }));

    return {
      success:    true,
      recipients: recipients,
      total:      recipients.length,
      currency:   currency,
      schoolName: settings.schoolName || 'School'
    };
  } catch(e) {
    Logger.log('getBulkSmsRecipients error: ' + e.message);
    return {success: false, message: e.message, recipients: []};
  }
}

// Log SMS activity to the spreadsheet after browser sends
function logSmsActivity(log) {
  try {
    const sheet = getOrCreateSheet('SMS Log',
      ['timestamp','sent','failed','total','filters','sampleMessage']);
    sheet.appendRow([
      new Date().toISOString(),
      log.sent    || 0,
      log.failed  || 0,
      log.total   || 0,
      log.filters || '',
      (log.sampleMessage || '').substring(0, 100)
    ]);
    return {success: true};
  } catch(e) { return {success: false}; }
}

function getOrCreateSmsHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('SMS History');
  if (sh) return sh;
  try {
    sh = ss.insertSheet('SMS History');
    sh.appendRow(['timestamp', 'recipient', 'phone', 'message', 'status', 'type']);
    sh.getRange(1,1,1,6).setBackground('#4f46e5').setFontColor('white').setFontWeight('bold');
    sh.setFrozenRows(1);
  } catch(e) {
    sh = ss.getSheetByName('SMS History');
    if (!sh) throw e;
  }
  return sh;
}

function logSmsHistory(logs) {
  try {
    const sheet = getOrCreateSmsHistorySheet();
    const rows = logs.map(l => [
      l.timestamp || new Date().toISOString(),
      l.recipient || '',
      l.phone || '',
      l.message || '',
      l.status || '',
      l.type || 'Single'
    ]);
    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
    }
    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}

function getSmsHistory() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SMS History');
    if (!sheet || sheet.getLastRow() <= 1) return {success: true, history: []};
    const data = sheet.getDataRange().getValues();
    const history = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      history.push({
        timestamp: data[i][0] instanceof Date ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(data[i][0]),
        recipient: String(data[i][1] || ''),
        phone: String(data[i][2] || ''),
        message: String(data[i][3] || ''),
        status: String(data[i][4] || ''),
        type: String(data[i][5] || '')
      });
    }
    history.reverse(); // Newest first
    return {success: true, history: history};
  } catch(e) { return {success: false, message: e.message, history: []}; }
}



// ── Records ───────────────────────────────────────────────────
// Helper: read one sheet and return records array
function readSheetRecords(sheet) {
  const records = [];
  try {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return records;
    const headers = data[0].map(h => String(h).trim());
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0] && !data[i][1]) continue;
      const rec = {};
      headers.forEach((h, idx) => {
        const val = data[i][idx];
        if (val === null || val === undefined || val === '') {
          rec[h] = '';
        } else if (val instanceof Date) {
          rec[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else if (typeof val === 'boolean') {
          rec[h] = val;
        } else if (typeof val === 'number') {
          const strFields = ['phoneNumber','studentName','id','grade','academicSession','paymentStatus'];
          rec[h] = strFields.includes(h) ? String(val) : val;
        } else {
          rec[h] = String(val);
        }
      });
      if (rec.id || rec.studentName) records.push(rec);
    }
  } catch(e) { Logger.log('readSheetRecords error: ' + e.message); }
  return records;
}

// Get ALL records from all three terms (used on initial load)
function getData() {
  try {
    const records = [];
    ["First Term","Second Term","Third Term"].forEach(term => {
      try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet()
                        .getSheetByName(SHEET_PREFIX + " - " + term);
        if (!sheet) return;
        records.push(...readSheetRecords(sheet));
      } catch(e) { Logger.log('Error reading ' + term + ': ' + e.message); }
    });
    return records;
  } catch(e) {
    Logger.log('getData error: ' + e.message);
    return [];
  }
}

// Get records for a SINGLE term — much faster than getData()
function getTermData(term) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
                    .getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet) return [];
    return readSheetRecords(sheet);
  } catch(e) {
    Logger.log('getTermData error: ' + e.message);
    return [];
  }
}

// Keep-warm function — set a 5-minute time trigger for this in Apps Script
// This prevents the cold-start delay
function keepWarm() {
  SpreadsheetApp.getActiveSpreadsheet(); // lightweight call to stay warm
}

function getTermFromSession(session) {
  if (!session) return "First Term";
  const s = String(session);
  if (s.includes("Second")) return "Second Term";
  if (s.includes("Third"))  return "Third Term";
  return "First Term";
}

function generateId(term) {
  const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);
  let prefix = null;
  if (settingsSheet) {
    const data = settingsSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'idPrefix' && data[i][1]) { prefix = String(data[i][1]).trim(); break; }
    }
  }
  const code = term.includes("Second") ? "ST" : term.includes("Third") ? "TT" : "FT";
  const base = prefix || ("SFMS-" + code + "-");

  // IMPORTANT: the next ID number must be based on the HIGHEST numeric suffix
  // already in use — never on the current row count. Basing it on row count
  // (the old approach) reuses a number the moment any student has ever been
  // deleted, silently merging a brand-new student under an existing student's
  // ID (shared payment history, wrong totals) — unacceptable in a financial
  // system. Scanning every term sheet (not just this one) also protects
  // against collisions when a custom idPrefix is shared across all terms.
  let maxNum = 0;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ["First Term", "Second Term", "Third Term"].forEach(t => {
    const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + t);
    if (!sheet || sheet.getLastRow() < 2) return;
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idCol = headerRow.indexOf('id');
    if (idCol === -1) return;
    const ids = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1).getValues();
    ids.forEach(row => {
      const idVal = String(row[0] || '').trim();
      if (idVal.indexOf(base) !== 0) return;
      const n = parseInt(idVal.substring(base.length), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    });
  });

  const num = (maxNum + 1).toString().padStart(4, '0');
  return base + num;
}

function getNextIdPreview(term) {
  try   { return {success: true,  nextId: generateId(term || "First Term")}; }
  catch(e) { return {success: false, message: e.message}; }
}

function calculateFields(record) {
  // Normalize the record keys to lowercase for robust lookup
  const normRec = {};
  Object.keys(record).forEach(k => {
    normRec[String(k).trim().toLowerCase()] = record[k];
  });

  const comps = getFeeComponentsList().filter(c => c.isActive);
  let totalFees = 0;

  const discountVal = parseFloat(normRec['discount']) || 0;

  comps.forEach(c => {
    const cId = String(c.id).trim().toLowerCase();
    if (c.isForNewStudentsOnly && !isBoolTrue(normRec['isnewstudent'])) {
      record[c.id] = 0;
      normRec[cId] = 0;
    }
    
    let v = parseFloat(normRec[cId]) || 0;
    if (isNaN(v)) v = 0;

    // Apply discount exclusively to tuition fees ("actualFees")
    if (c.id === 'actualFees') {
      v = Math.max(0, v - discountVal);
    }
    
    totalFees += v;
  });

  record.totalFees     = totalFees;
  
  let totalPaid = 0;
  for (let i = 1; i <= 10; i++) {
    const v = parseFloat(normRec['inst' + i]);
    totalPaid += isNaN(v) ? 0 : v;
  }
  record.totalPaid     = totalPaid;
  record.balance       = totalFees - totalPaid;
  record.paymentStatus = totalFees === 0 ? "No Fees"
                       : record.balance <= 0 ? "Paid"
                       : totalPaid > 0 ? "Partially Paid" : "Unpaid";
}

function saveRecord(recordData) {
  try {
    try { ensureStudentPhotoColumn(); } catch(e) { Logger.log("ensureStudentPhotoColumn error: " + e.message); }
    const term    = getTermFromSession(recordData.academicSession);
    const sheet   = getOrCreateTermSheet(term);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const now     = new Date().toISOString();

    if (recordData.id && String(recordData.id).trim() !== '') {
      const data  = sheet.getDataRange().getValues();
      const idIdx = headers.indexOf("id");
      const discIdx = headers.indexOf("discount");
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(recordData.id)) {
          const oldDiscount = discIdx !== -1 ? (parseFloat(data[i][discIdx]) || 0) : 0;
          
          recordData.updatedAt = now;
          // Ensure phone stored as text (preserve leading zero)
          if (recordData.phoneNumber) recordData.phoneNumber = String(recordData.phoneNumber);
          calculateFields(recordData);
          
          // Normalize recordData keys to lowercase for case-insensitive mapped write back
          const normalizedRecordData = {};
          Object.keys(recordData).forEach(k => {
            normalizedRecordData[String(k).trim().toLowerCase()] = recordData[k];
          });
          
          const updRow = headers.map(h => {
            const normH = String(h || '').trim().toLowerCase();
            return normalizedRecordData[normH] !== undefined ? normalizedRecordData[normH] : '';
          });
          
          const phoneColIdx = headers.indexOf('phoneNumber');
          sheet.getRange(i+1, 1, 1, headers.length).setValues([updRow]);
          if (phoneColIdx >= 0) sheet.getRange(i+1, phoneColIdx+1).setNumberFormat('@STRING@');
          logActivity('Updated Record', recordData.id + ' - ' + (recordData.studentName || '') + ' (' + (recordData.grade || '') + ')');
          
          // Log Discount History if changed
          const newDiscount = parseFloat(recordData.discount) || 0;
          if (oldDiscount !== newDiscount) {
            logDiscountChange(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, newDiscount);
          }
          
          autoMarkNotificationsRecorded(recordData.id, recordData);
          SpreadsheetApp.flush();
          return {success: true, record: sanitizeRecordForClient(recordData)};
        }
      }
    }

    if (!recordData.id || String(recordData.id).trim() === '') {
      recordData.id = generateId(term);
    }
    recordData.createdAt = now;
    recordData.updatedAt = now;
    // Ensure phone stored as text (preserve leading zero)
    if (recordData.phoneNumber) recordData.phoneNumber = String(recordData.phoneNumber);
    calculateFields(recordData);
    
    // Normalize recordData keys to lowercase for case-insensitive mapped write back
    const normalizedRecordData = {};
    Object.keys(recordData).forEach(k => {
      normalizedRecordData[String(k).trim().toLowerCase()] = recordData[k];
    });
    
    const rowData = headers.map(h => {
      const normH = String(h || '').trim().toLowerCase();
      return normalizedRecordData[normH] !== undefined ? normalizedRecordData[normH] : '';
    });
    
    sheet.appendRow(rowData);
    // Force phone column to text format so leading zeros are preserved
    const phoneIdx = headers.indexOf('phoneNumber');
    if (phoneIdx >= 0) {
      sheet.getRange(sheet.getLastRow(), phoneIdx+1).setNumberFormat('@STRING@');
    }
    logActivity('Added Record', recordData.id + ' - ' + (recordData.studentName || '') + ' (' + (recordData.grade || '') + ')');

    // Log Discount History if discount > 0
    const newDiscount = parseFloat(recordData.discount) || 0;
    if (newDiscount > 0) {
      logDiscountChange(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, newDiscount);
    }

    autoMarkNotificationsRecorded(recordData.id, recordData);
    try { autoAssignExtraFeesForStudent(recordData); } catch(e) { Logger.log('autoAssignExtraFeesForStudent error: ' + e.message); }
    SpreadsheetApp.flush();
    return {success: true, record: sanitizeRecordForClient(recordData)};
  } catch(e) { return {success: false, message: e.message}; }
}

// ── Extra Fee Types: auto-billing engine ──────────────────────
// Extra Fee Types (Uniform, Books, Excursion, Graduation, etc.) are
// configured once with a default amount, optional per-class rate
// overrides, and a term rule ("All Terms" or one specific term).
// These helpers turn that configuration into real per-student
// "Custom Fee Records" so the amount actually shows up on the
// student's bill instead of just sitting in the settings catalog.
// They only ever CREATE a record when none exists yet for that
// student+feeType+term — an existing record (which may already have
// payments against it) is never silently overwritten.
function getExtraFeeClassRate(feeType, grade) {
  if (!feeType) return 0;
  var rates = feeType.classAmounts || feeType.classRates;
  if (rates && grade) {
    var cleanGrade = String(grade).trim().toLowerCase();
    for (var c in rates) {
      if (String(c).trim().toLowerCase() === cleanGrade) {
        var amt = parseFloat(rates[c]);
        if (!isNaN(amt)) return amt;
      }
    }
  }
  var def = parseFloat(feeType.defaultAmount !== undefined ? feeType.defaultAmount : feeType.amount);
  return isNaN(def) ? 0 : def;
}

function extraFeeAppliesToTerm(feeType, term) {
  if (!feeType || !feeType.term || feeType.term === 'All Terms') return true;
  return feeType.term === term;
}

function getActiveExtraFeeTypes() {
  var settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);
  if (!settingsSheet) return [];
  var data = settingsSheet.getDataRange().getValues();
  var rawExtra = null, rawCustom = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'extraFeeTypes') rawExtra = data[i][1];
    else if (data[i][0] === 'customFeeTypes') rawCustom = data[i][1];
  }
  // The admin UI has two settings panels that both edit this same concept —
  // "Extra Fee Types Management" (writes extraFeeTypes + customFeeTypes
  // together) and an older "Fee Types" panel (writes ONLY customFeeTypes).
  // Trusting only 'extraFeeTypes' meant a fee type added/edited through the
  // older panel was invisible to auto-billing (new-student assignment, term
  // restrictions, class rollover) even though it showed up fine in the UI.
  // 'customFeeTypes' is the one every settings panel and the rest of the
  // app already writes/reads, so prefer it (falling back to 'extraFeeTypes'
  // only if it was somehow never set) rather than the other way around.
  var raw = rawCustom || rawExtra;
  if (!raw) return [];
  try {
    var list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(function(f) { return f && f.isActive !== false; }) : [];
  } catch (e) { return []; }
}

// Auto-assigns every currently active extra fee type to a single
// newly-created student record (called right after saveRecord adds
// a new row).
function autoAssignExtraFeesForStudent(recordData) {
  var feeTypes = getActiveExtraFeeTypes();
  if (!feeTypes.length) return;
  var term = getTermFromSession(recordData.academicSession);
  feeTypes.forEach(function(ft) {
    if (!extraFeeAppliesToTerm(ft, term)) return;
    var amount = getExtraFeeClassRate(ft, recordData.grade);
    if (amount <= 0) return;
    createCustomFeeRecordIfMissing(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, ft.name, amount, ft);
  });
}

// Backfills a single extra fee type onto every currently active
// student whose class + term match, without touching any student
// who already has a Custom Fee Record for it (called after an Extra
// Fee Type is created/edited in Settings).
function autoAssignExtraFeeToAllStudents(feeType) {
  var billedCount = 0;
  ["First Term","Second Term","Third Term"].forEach(function(term) {
    if (!extraFeeAppliesToTerm(feeType, term)) return;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet || sheet.getLastRow() < 2) return;
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var idIdx = headers.indexOf('id');
    var nameIdx = headers.indexOf('studentname');
    var gradeIdx = headers.indexOf('grade');
    var sessionIdx = headers.indexOf('academicsession');
    var stoppedIdx = headers.indexOf('isstopped');
    for (var i = 1; i < data.length; i++) {
      if (stoppedIdx !== -1 && isBoolTrue(data[i][stoppedIdx])) continue;
      var grade = data[i][gradeIdx];
      var amount = getExtraFeeClassRate(feeType, grade);
      if (amount <= 0) continue;
      var created = createCustomFeeRecordIfMissing(
        data[i][idIdx], data[i][nameIdx], grade, data[i][sessionIdx], feeType.name, amount, feeType
      );
      if (created) billedCount++;
    }
  });
  return billedCount;
}

// Shared upsert-if-missing helper used by both auto-assign paths above.
// `feeType` (optional) is the Extra Fee Type config this record is being
// billed from — when it allows installments, the new record is created with
// that same installment count so the payment modal shows the right number
// of installment rows immediately instead of defaulting to a one-time fee.
function createCustomFeeRecordIfMissing(studentId, studentName, grade, academicSession, feeTypeName, amount, feeType) {
  studentId = String(studentId || '').trim();
  academicSession = String(academicSession || '').trim();
  if (!studentId || !academicSession) return false;

  var sheet = getOrCreateCustomFeeRecordsSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h || '').trim().toLowerCase(); });
  var stuIdIdx = headers.indexOf('studentid');
  var feeNameIdx = headers.indexOf('feetypename');
  var sessionIdx = headers.indexOf('academicsession');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][stuIdIdx]).trim() === studentId &&
        String(data[i][feeNameIdx]).trim() === feeTypeName &&
        String(data[i][sessionIdx]).trim() === academicSession) {
      return false; // already billed — never overwrite an existing record
    }
  }

  var installmentAllowed = !!(feeType && feeType.installmentAllowed);
  var numInstallments = installmentAllowed ? Math.max(1, Math.min(6, parseInt(feeType.numInstallments) || 1)) : 1;

  saveCustomFeeRecord({
    studentId: studentId,
    studentName: studentName || '',
    grade: grade || '',
    academicSession: academicSession,
    feeTypeName: feeTypeName,
    amount: amount,
    isInstallment: installmentAllowed,
    numInstallments: numInstallments
  });
  return true;
}

function deleteRecord(id, session) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const term = getTermFromSession(session);
    const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet) return {success: false, message: "Sheet not found"};
    const data  = sheet.getDataRange().getValues();
    const idIdx = data[0].indexOf("id");
    if (idIdx === -1) return {success: false, message: "ID column not found"};
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) { 
        sheet.deleteRow(i+1); 
        logActivity('Deleted Record', id + ' from ' + term); 
        return {success: true}; 
      }
    }
    return {success: false, message: "Not found"};
  } catch(e) { return {success: false, message: e.message}; }
}

// ── Activity Logs ────────────────────────────────────────────
function logActivity(action, details, user) {
  try {
    const sheet = getOrCreateSheet('Activity Log',
      ['timestamp','action','details','user']);
    sheet.appendRow([
      new Date().toISOString(),
      action || '',
      details || '',
      user || 'System'
    ]);
    // Keep only last 500 entries to avoid sheet bloat
    var lastRow = sheet.getLastRow();
    if (lastRow > 501) {
      sheet.deleteRows(2, lastRow - 501);
    }
  } catch(e) {
    Logger.log('logActivity error: ' + e.message);
  }
}

function getActivityLogs() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Activity Log');
    if (!sheet || sheet.getLastRow() <= 1) {
      return {success: true, logs: []};
    }
    const data = sheet.getDataRange().getValues();
    const logs = [];
    for (let i = 1; i < data.length; i++) {
      logs.push({
        timestamp: data[i][0] ? (data[i][0] instanceof Date
                    ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
                    : String(data[i][0]).substring(0, 19).replace('T',' '))
                    : '',
        action:  String(data[i][1] || ''),
        details: String(data[i][2] || ''),
        user:    String(data[i][3] || '')
      });
    }
    logs.reverse(); // newest first
    return {success: true, logs: logs};
  } catch(e) {
    Logger.log('getActivityLogs error: ' + e.message);
    return {success: false, message: e.message, logs: []};
  }
}

// ── Import / Export ───────────────────────────────────────────
function importBulkRecords(rows) {
  try {
    const comps = getFeeComponentsList().filter(c => c.isActive);
    let ok = 0, fail = 0;
    rows.forEach(row => {
      try {
        const rec = {
          studentName:     row['Student Name']     || row.studentName     || '',
          phoneNumber:     String(row['Phone Number'] || row.phoneNumber  || ''),
          grade:           row['Grade']            || row.grade           || '',
          academicSession: row['Academic Session'] || row.academicSession || '',
          isNewStudent:    String(row['Is New Student']).toUpperCase() === 'TRUE' ||
                           String(row['Is New Student']).toUpperCase() === 'YES'
        };
        comps.forEach(comp => {
          let val = 0;
          for (const key of [comp.name, comp.id, comp.name.toLowerCase()]) {
            if (row[key] !== undefined && row[key] !== '') { val = parseFloat(row[key])||0; break; }
          }
          rec[comp.id] = val;
        });
        for (let i = 1; i <= 10; i++) {
          rec['inst'+i]        = parseFloat(row['Inst '+i] || row['inst'+i]) || 0;
          rec['inst'+i+'Date'] = row['Inst '+i+' Date']   || row['inst'+i+'Date'] || '';
        }
        saveRecord(rec).success ? ok++ : fail++;
      } catch(e) { fail++; Logger.log('Import row error: ' + e.message); }
    });
    return {success: true, message: "Imported " + ok + " records. Failed: " + fail};
  } catch(e) { return {success: false, message: e.message}; }
}

function getImportTemplate() {
  const comps = getFeeComponentsList().filter(c => c.isActive);
  return {success: true, template: {
    headers: ["Student Name","Phone Number","Grade","Academic Session",
              ...comps.map(c => c.name),"Is New Student",
              "Inst 1","Inst 1 Date","Inst 2","Inst 2 Date",
              "Inst 3","Inst 3 Date","Inst 4","Inst 4 Date",
              "Inst 5","Inst 5 Date","Inst 6","Inst 6 Date",
              "Inst 7","Inst 7 Date","Inst 8","Inst 8 Date",
              "Inst 9","Inst 9 Date","Inst 10","Inst 10 Date"],
    feeComponents: comps
  }};
}

// ============================================================
// INCOME & EXPENSES MODULE
// ============================================================
const INCOME_EXPENSE_SHEET = "Income & Expenses";

function getOrCreateIncomeExpensesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(INCOME_EXPENSE_SHEET);
  if (sheet) return sheet;
  try {
    sheet = ss.insertSheet(INCOME_EXPENSE_SHEET);
    const headers = ["id","date","type","category","description","amount","createdAt"];
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length)
      .setBackground('#0891b2').setFontColor('white').setFontWeight('bold');
    sheet.setFrozenRows(1);
  } catch(e) {
    sheet = ss.getSheetByName(INCOME_EXPENSE_SHEET);
    if (!sheet) throw e;
  }
  return sheet;
}

function getIncomeExpenses() {
  try {
    const sheet = getOrCreateIncomeExpensesSheet();
    const data  = sheet.getDataRange().getValues();
    if (data.length < 2) return {success: true, entries: []};
    const hdrs = data[0].map(h => String(h).trim());
    const entries = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      const entry = {};
      hdrs.forEach((h,j) => { entry[h] = data[i][j] !== undefined ? data[i][j] : ''; });
      // Normalise date to string
      if (entry.date instanceof Date) entry.date = Utilities.formatDate(entry.date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      entries.push(entry);
    }
    return {success: true, entries: entries};
  } catch(e) { return {success: false, message: e.message}; }
}

function saveIncomeExpense(data) {
  try {
    const sheet = getOrCreateIncomeExpensesSheet();
    const now   = new Date();
    const id    = 'IE-' + now.getTime();
    sheet.appendRow([id, data.date, data.type, data.category, data.description, parseFloat(data.amount)||0, now.toISOString()]);
    return {success: true, id: id};
  } catch(e) { return {success: false, message: e.message}; }
}

function deleteIncomeExpense(id) {
  try {
    const sheet = getOrCreateIncomeExpensesSheet();
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return {success: true};
      }
    }
    return {success: false, message: 'Entry not found'};
  } catch(e) { return {success: false, message: e.message}; }
}

// ============================================================
// REPORTS MODULE
// ============================================================
function getReportData(filters) {
  try {
    filters = filters || {};
    const comps = getFeeComponentsList().filter(c => c.isActive);
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const terms = ['First Term','Second Term','Third Term'];
    let allRows = [];

    terms.forEach(term => {
      const sheetName = SHEET_PREFIX + ' - ' + term;
      const tSheet = ss.getSheetByName(sheetName);
      if (!tSheet || tSheet.getLastRow() < 2) return;
      const data = tSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0]) continue;
        const row = {};
        hdrs.forEach((h,j) => { row[h] = data[i][j]; });
        // Apply term filter
        if (filters.term && filters.term !== 'all' && !String(row.academicSession || '').includes(filters.term)) return;
        // Apply grade filter
        if (filters.grade && filters.grade !== 'all' && row.grade !== filters.grade) return;
        // Apply year filter
        if (filters.year && filters.year !== 'all' && !String(row.academicSession || '').startsWith(filters.year)) return;
        allRows.push(row);
      }
    });

    // Aggregate totals
    let totalFees = 0, totalPaid = 0, paidCount = 0, partialCount = 0, unpaidCount = 0;
    let dailyCollected = 0, weeklyCollected = 0, termlyCollected = 0;
    
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    // For weekly (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const gradeMap = {};
    const compMap  = {};
    comps.forEach(c => { compMap[c.id] = {name: c.name, total: 0}; });

    const studentMap = {};
    allRows.forEach(r => {
      studentMap[String(r.id) + '_' + String(r.academicSession)] = r;
    });

    allRows.forEach(r => {
      let fees = 0, paid = 0;
      comps.forEach(c => { const v = parseFloat(r[c.id]) || 0; fees += v; compMap[c.id].total += v; });
      for (let i = 1; i <= 10; i++) {
        let amt = parseFloat(r['inst'+i]) || 0;
        paid += amt;
        if (amt > 0) {
            let dStr = String(r['inst'+i+'Date'] || '').trim();
            if (dStr === todayStr) dailyCollected += amt;
            if (dStr) {
                let d = new Date(dStr);
                if (d >= weekAgo && d <= today) weeklyCollected += amt;
            }
            termlyCollected += amt; // Assuming the filters already scoped this to the current term/year
        }
      }
      totalFees += fees; totalPaid += paid;
      const bal = fees - paid;
      if (fees > 0) {
        if (bal <= 0) paidCount++;
        else if (paid > 0) partialCount++;
        else unpaidCount++;
      }
      const g = r.grade || 'Unknown';
      if (!gradeMap[g]) gradeMap[g] = {students: 0, fees: 0, paid: 0};
      gradeMap[g].students++;
      gradeMap[g].fees += fees;
      gradeMap[g].paid += paid;
    });

    // Aggregate custom fee records in report
    try {
      const cfSheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
      if (cfSheet && cfSheet.getLastRow() > 1) {
        const cfData = cfSheet.getDataRange().getValues();
        const cfHdrs = cfData[0].map(h => String(h).trim());
        const stuIdIdx = cfHdrs.indexOf('studentId');
        const sessIdx = cfHdrs.indexOf('academicSession');
        const nameIdx = cfHdrs.indexOf('feeTypeName');
        const amtIdx = cfHdrs.indexOf('amount');
        const paidIdx = cfHdrs.indexOf('totalPaid');
        
        for (let i = 1; i < cfData.length; i++) {
          const row = cfData[i];
          const stuId = String(row[stuIdIdx] || '');
          const sess = String(row[sessIdx] || '');
          const studentKey = stuId + '_' + sess;
          
          const r = studentMap[studentKey];
          if (!r) continue; // Doesn't match our active filters (term, year, grade)
          
          if (filters.term && filters.term !== 'all' && !sess.includes(filters.term)) continue;
          if (filters.year && filters.year !== 'all' && !sess.startsWith(filters.year)) continue;
          if (filters.grade && filters.grade !== 'all' && r.grade !== filters.grade) continue;

          const fAmount = parseFloat(row[amtIdx]) || 0;
          const fPaid = parseFloat(row[paidIdx]) || 0;
          
          totalFees += fAmount;
          totalPaid += fPaid;
          
          for (let j = 1; j <= 6; j++) {
            const instValIdx = cfHdrs.indexOf('inst' + j);
            const instDateIdx = cfHdrs.indexOf('inst' + j + 'Date');
            if (instValIdx !== -1 && instDateIdx !== -1) {
              const amt = parseFloat(row[instValIdx]) || 0;
              if (amt > 0) {
                const dStr = String(row[instDateIdx] || '').trim();
                if (dStr === todayStr) dailyCollected += amt;
                if (dStr) {
                  const d = new Date(dStr);
                  if (d >= weekAgo && d <= today) weeklyCollected += amt;
                }
                termlyCollected += amt;
              }
            }
          }
          
          const g = r.grade || 'Unknown';
          if (gradeMap[g]) {
            gradeMap[g].fees += fAmount;
            gradeMap[g].paid += fPaid;
          }
        }
      }
    } catch (e) {}

    // Get Income & Expenses
    let totalIncome = 0, totalExpense = 0;
    try {
        const ieSheet = ss.getSheetByName('Income & Expenses');
        if (ieSheet && ieSheet.getLastRow() > 1) {
            const ieData = ieSheet.getDataRange().getValues();
            for (let i = 1; i < ieData.length; i++) {
                let r = ieData[i];
                let dStr = String(r[1] || '').trim();
                let type = String(r[2] || '').trim();
                let amt = parseFloat(r[5]) || 0;
                
                // If filtering by term/year, ideally we would filter IE entries too, but they don't have terms.
                // We'll just include them if they fall within the selected year or term loosely, or just return all for the period.
                // For now, return all since we don't have strict date boundaries for terms.
                if (type === 'Income') totalIncome += amt;
                if (type === 'Expense') totalExpense += amt;
            }
        }
    } catch(e) {}

    // Calculate regular school fees billed vs paid
    let regBilled = 0, regPaid = 0;
    allRows.forEach(r => {
      comps.forEach(c => { regBilled += parseFloat(r[c.id]) || 0; });
      for (let i = 1; i <= 10; i++) { regPaid += parseFloat(r['inst'+i]) || 0; }
    });

    const customFeesMap = {};
    let customFeeTypesList = [];
    try {
      const settingsSheet = ss.getSheetByName('Settings');
      if (settingsSheet) {
        const sData = settingsSheet.getDataRange().getValues();
        const customFeeRow = sData.find(row => String(row[0]).trim() === 'customFeeTypes');
        if (customFeeRow && customFeeRow[1]) {
          customFeeTypesList = JSON.parse(customFeeRow[1]);
        }
      }
    } catch(e) {}

    customFeeTypesList.forEach(cf => {
      customFeesMap[cf.name] = { billed: 0, paid: 0 };
    });

    // Populate custom fee collections from records
    try {
      const cfSheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
      if (cfSheet && cfSheet.getLastRow() > 1) {
        const cfData = cfSheet.getDataRange().getValues();
        const cfHdrs = cfData[0].map(h => String(h).trim());
        const stuIdIdx = cfHdrs.indexOf('studentId');
        const sessIdx = cfHdrs.indexOf('academicSession');
        const nameIdx = cfHdrs.indexOf('feeTypeName');
        const amtIdx = cfHdrs.indexOf('amount');
        const paidIdx = cfHdrs.indexOf('totalPaid');
        
        for (let i = 1; i < cfData.length; i++) {
          const row = cfData[i];
          const stuId = String(row[stuIdIdx] || '');
          const sess = String(row[sessIdx] || '');
          const studentKey = stuId + '_' + sess;
          const r = studentMap[studentKey];
          if (!r) continue;

          if (filters.term && filters.term !== 'all' && !sess.includes(filters.term)) continue;
          if (filters.year && filters.year !== 'all' && !sess.startsWith(filters.year)) continue;
          if (filters.grade && filters.grade !== 'all' && r.grade !== filters.grade) continue;

          const name = String(row[nameIdx] || '').trim();
          if (name) {
            if (!customFeesMap[name]) {
              customFeesMap[name] = { billed: 0, paid: 0 };
            }
            customFeesMap[name].billed += parseFloat(row[amtIdx]) || 0;
            customFeesMap[name].paid += parseFloat(row[paidIdx]) || 0;
          }
        }
      }
    } catch(e) {}

    const feeTypeBreakdown = [
      { name: 'Regular School Fees', billed: regBilled, paid: regPaid, balance: regBilled - regPaid }
    ];
    Object.keys(customFeesMap).forEach(k => {
      feeTypeBreakdown.push({
        name: k,
        billed: customFeesMap[k].billed,
        paid: customFeesMap[k].paid,
        balance: customFeesMap[k].billed - customFeesMap[k].paid
      });
    });

    return {
      success:      true,
      totalStudents: allRows.length,
      totalFees:    totalFees,
      totalPaid:    totalPaid,
      balance:      totalFees - totalPaid,
      paidCount:    paidCount,
      partialCount: partialCount,
      unpaidCount:  unpaidCount,
      dailyCollected: dailyCollected,
      weeklyCollected: weeklyCollected,
      termlyCollected: termlyCollected,
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
      gradeBreakdown: Object.entries(gradeMap).map(([g,d]) => ({grade:g, students:d.students, fees:d.fees, paid:d.paid, balance:d.fees-d.paid})),
      feeTypeBreakdown: feeTypeBreakdown,
      compBreakdown:  Object.values(compMap)
    };
  } catch(e) { return {success: false, message: e.message}; }
}

// ── DATA BACKUP ───────────────────────────────────────────
// Creates a snapshot sheet tab in the same spreadsheet.
// opts: { term, year, label }  (term='all' for annual backup)
function createBackup(opts) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var mainSheet = ss.getSheetByName('Records');
    if (!mainSheet) return { success: false, message: 'Records sheet not found.' };

    var term  = opts.term  || 'all';
    var year  = opts.year  || '';
    var label = opts.label || (year + ' ' + term);

    // Build snapshot tab name: "Backup – 2025/2026 First Term (2026-04-27)"
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    var tabName = ('Backup – ' + label + ' (' + dateStr + ')').substring(0, 100);

    // Read all data from Records sheet
    var data = mainSheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: 'No records to backup.' };

    var headers = data[0];
    var rows    = data.slice(1);

    // Filter rows by term / year
    var sessionIdx = headers.indexOf('academicSession');
    if (sessionIdx === -1) sessionIdx = 3; // fallback column index

    var filtered = rows.filter(function(row) {
      var sess = String(row[sessionIdx] || '');
      if (year && !sess.startsWith(year)) return false;
      if (term !== 'all' && !sess.includes(term)) return false;
      return true;
    });

    if (filtered.length === 0) return { success: false, message: 'No matching records for ' + label + '.' };

    // Create new sheet tab
    var backupSheet = ss.insertSheet(tabName);
    backupSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    backupSheet.getRange(2, 1, filtered.length, headers.length).setValues(filtered);
    backupSheet.autoResizeColumns(1, headers.length);

    // Log to Activity Logs if sheet exists
    var logSheet = ss.getSheetByName('ActivityLogs');
    if (logSheet) {
      logSheet.appendRow([new Date(), 'Backup Created', label + ' (' + filtered.length + ' records)', Session.getActiveUser().getEmail() || 'Admin']);
    }

    return { success: true, count: filtered.length, sheetName: tabName };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ============================================================
// LOGIN AUDIT TRAIL MODULE
// ============================================================
function getOrCreateAuditTrailSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Audit Trail");
  if (sheet) return sheet;
  try {
    sheet = ss.insertSheet("Audit Trail");
    sheet.appendRow(["timestamp", "user", "role", "ipAddress", "deviceName", "deviceType", "macAddress"]);
    sheet.getRange(1,1,1,7).setBackground('#E11D48').setFontColor('white').setFontWeight('bold'); // Rose-600 background
    sheet.setFrozenRows(1);
  } catch(e) {
    sheet = ss.getSheetByName("Audit Trail");
    if (!sheet) throw e;
  }
  return sheet;
}

function logLoginAudit(user, role, auditData) {
  try {
    const sheet = getOrCreateAuditTrailSheet();
    const now = new Date().toISOString();
    sheet.appendRow([
      now,
      user || 'Unknown',
      role || 'Unknown',
      auditData.ipAddress || 'Unknown',
      auditData.deviceName || 'Unknown',
      auditData.deviceType || 'Unknown',
      auditData.macAddress || 'Unknown'
    ]);
    
    // Keep only last 1000 entries to avoid sheet bloat
    var lastRow = sheet.getLastRow();
    if (lastRow > 1001) {
      sheet.deleteRows(2, lastRow - 1001);
    }
    return {success: true};
  } catch(e) {
    Logger.log('logLoginAudit error: ' + e.message);
    return {success: false, message: e.message};
  }
}

function getAuditTrailLogs() {
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Audit Trail');
    if (!sheet || sheet.getLastRow() <= 1) {
      return {success: true, logs: []};
    }
    const data = sheet.getDataRange().getValues();
    const logs = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      logs.push({
        timestamp: data[i][0] ? (data[i][0] instanceof Date
                    ? Utilities.formatDate(data[i][0], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
                    : String(data[i][0]).substring(0, 19).replace('T',' '))
                    : '',
        user:    String(data[i][1] || ''),
        role:    String(data[i][2] || ''),
        ipAddress: String(data[i][3] || ''),
        deviceName: String(data[i][4] || ''),
        deviceType: String(data[i][5] || ''),
        macAddress: String(data[i][6] || '')
      });
    }
    logs.reverse(); // newest first
    return {success: true, logs: logs};
  } catch(e) {
    Logger.log('getAuditTrailLogs error: ' + e.message);
    return {success: false, message: e.message, logs: []};
  }
}

// ============================================================
// STUDENT PROMOTION LOGIC
// ============================================================
function promoteStudentToNextTerm(studentId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let studentRecord = null;
    let currentTerm = "";
    
    // 1. Scan terms to find student record
    const terms = ["First Term", "Second Term", "Third Term"];
    for (const term of terms) {
      const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
      if (!sheet) continue;
      const data = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const idIdx = headers.indexOf("id");
      if (idIdx === -1) continue;
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]).trim().toLowerCase() === studentId.trim().toLowerCase()) {
          const rec = {};
          headers.forEach((h, idx) => {
            const val = data[i][idx];
            if (val === null || val === undefined || val === '') {
              rec[h] = '';
            } else if (val instanceof Date) {
              rec[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            } else if (typeof val === 'boolean') {
              rec[h] = val;
            } else {
              rec[h] = val;
            }
          });
          studentRecord = rec;
          currentTerm = term;
          break;
        }
      }
      if (studentRecord) break;
    }
    
    if (!studentRecord) {
      return {success: false, message: "Student record not found in database"};
    }
    
    // 2. Determine next session and term
    const session = String(studentRecord.academicSession || '');
    const yearPart = session.split(' ')[0] || '2025/2026';
    let nextTerm = "";
    let nextYear = yearPart;
    let shouldPromoteGrade = false;
    
    if (session.includes('First Term')) {
      nextTerm = 'Second Term';
    } else if (session.includes('Second Term')) {
      nextTerm = 'Third Term';
    } else {
      // Third Term -> Next Year's First Term
      const parts = yearPart.split('/');
      if (parts.length === 2) {
        const y1 = parseInt(parts[0]) + 1;
        const y2 = parseInt(parts[1]) + 1;
        nextYear = y1 + '/' + y2;
      }
      nextTerm = 'First Term';
      shouldPromoteGrade = true;
    }
    
    const nextSession = nextYear + ' ' + nextTerm;
    
    // 3. Determine Grade (Class Promotion)
    let newGrade = studentRecord.grade || '';
    if (shouldPromoteGrade && newGrade) {
      const classesRes = getClasses();
      const classes = classesRes.success ? classesRes.classes : DEFAULT_CLASSES;
      const idx = classes.findIndex(c => String(c).trim().toLowerCase() === String(newGrade).trim().toLowerCase());
      if (idx !== -1 && idx < classes.length - 1) {
        newGrade = classes[idx + 1];
      }
    }
    
    // 4. Duplicate promotion check
    const targetSheet = ss.getSheetByName(SHEET_PREFIX + " - " + nextTerm);
    if (targetSheet) {
      const nextData = targetSheet.getDataRange().getValues();
      if (nextData.length > 1) {
        const hdrs = nextData[0].map(h => String(h).trim());
        const idCol = hdrs.indexOf("id");
        const sessCol = hdrs.indexOf("academicSession");
        if (idCol !== -1 && sessCol !== -1) {
          for (let i = 1; i < nextData.length; i++) {
            if (String(nextData[i][idCol]).trim().toLowerCase() === String(studentRecord.id).trim().toLowerCase() &&
                String(nextData[i][sessCol]).trim().toLowerCase() === String(nextSession).trim().toLowerCase()) {
              return {success: false, message: "Student '" + studentRecord.studentName + "' is already promoted/enrolled in " + nextSession};
            }
          }
        }
      }
    }
    
    // 5. Build promoted record
    const promotedRecord = {};
    Object.keys(studentRecord).forEach(k => {
      promotedRecord[k] = studentRecord[k];
    });
    
    // Overwrite fields for the new term
    promotedRecord.id = studentRecord.id; // Preserve student ID
    promotedRecord.grade = newGrade;
    promotedRecord.academicSession = nextSession;
    promotedRecord.isNewStudent = false;
    promotedRecord.isStopped = false;
    
    // Carry forward current outstanding balance to arrears
    const currentBalance = parseFloat(studentRecord.balance) || 0;
    promotedRecord.arrears = Math.max(0, currentBalance);
    
    // Clear other payment fields
    for (let i = 1; i <= 10; i++) {
      promotedRecord['inst' + i] = 0;
      promotedRecord['inst' + i + 'Date'] = "";
    }
    
    // Ensure any admission fees are cleared for returning students
    const comps = getFeeComponentsList().filter(c => c.isActive);
    comps.forEach(c => {
      if (c.isForNewStudentsOnly) {
        promotedRecord[c.id] = 0;
      }
    });
    
    // Save the new record
    const saveRes = saveRecord(promotedRecord);
    if (!saveRes.success) {
      return {success: false, message: "Error saving promoted record: " + saveRes.message};
    }
    
    // Log Activity
    logActivity('Promoted Student', studentRecord.studentName + ' (' + studentRecord.grade + ') -> ' + nextSession + ' (' + newGrade + ')');
    var finalId = saveRes.record ? saveRes.record.id : studentRecord.id;
    logPromotion(finalId, studentRecord.studentName, studentRecord.grade, newGrade, studentRecord.academicSession, nextSession);
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: "Student successfully promoted to " + nextSession + " in class " + newGrade,
      record: saveRes.record
    };
  } catch(e) {
    Logger.log("promoteStudentToNextTerm error: " + e.message);
    return {success: false, message: e.message};
  }
}

function promoteAllStudentsToNextTerm(termName, academicYear) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const currentSheetName = SHEET_PREFIX + " - " + termName;
    const currentSheet = ss.getSheetByName(currentSheetName);
    if (!currentSheet) {
      return {success: false, message: "Source term sheet not found."};
    }
    
    const records = readSheetRecords(currentSheet);
    const activeRecords = records.filter(r => 
      !isBoolTrue(r.isStopped) && 
      (academicYear ? String(r.academicSession || '').startsWith(academicYear) : true)
    );
    
    if (activeRecords.length === 0) {
      return {success: false, message: "No active students found in " + termName + " for academic year " + academicYear};
    }
    
    const firstRec = activeRecords[0];
    const session = String(firstRec.academicSession || '');
    const yearPart = session.split(' ')[0] || academicYear;
    let nextTerm = "";
    let nextYear = yearPart;
    let shouldPromoteGrade = false;
    
    if (session.includes('First Term')) {
      nextTerm = 'Second Term';
    } else if (session.includes('Second Term')) {
      nextTerm = 'Third Term';
    } else {
      const parts = yearPart.split('/');
      if (parts.length === 2) {
        const y1 = parseInt(parts[0]) + 1;
        const y2 = parseInt(parts[1]) + 1;
        nextYear = y1 + '/' + y2;
      }
      nextTerm = 'First Term';
      shouldPromoteGrade = true;
    }
    
    const nextSession = nextYear + ' ' + nextTerm;
    const targetSheet = getOrCreateTermSheet(nextTerm);
    
    const nextData = targetSheet.getDataRange().getValues();
    const existingPairs = new Set();
    if (nextData.length > 1) {
      const hdrs = nextData[0].map(h => String(h).trim());
      const idCol = hdrs.indexOf("id");
      const sessCol = hdrs.indexOf("academicSession");
      if (idCol !== -1 && sessCol !== -1) {
        for (let i = 1; i < nextData.length; i++) {
          const idKey = String(nextData[i][idCol]).trim().toLowerCase();
          const sessKey = String(nextData[i][sessCol]).trim().toLowerCase();
          existingPairs.add(idKey + '||' + sessKey);
        }
      }
    }
    
    const classesRes = getClasses();
    const classes = classesRes.success ? classesRes.classes : DEFAULT_CLASSES;
    const comps = getFeeComponentsList().filter(c => c.isActive);
    
    let okCount = 0;
    let skippedCount = 0;
    
    activeRecords.forEach(studentRecord => {
      const idKey = String(studentRecord.id).trim().toLowerCase();
      const sessKey = String(nextSession).trim().toLowerCase();
      
      if (existingPairs.has(idKey + '||' + sessKey)) {
        skippedCount++;
        return;
      }
      
      let newGrade = studentRecord.grade || '';
      if (shouldPromoteGrade && newGrade) {
        const idx = classes.findIndex(c => String(c).trim().toLowerCase() === String(newGrade).trim().toLowerCase());
        if (idx !== -1 && idx < classes.length - 1) {
          newGrade = classes[idx + 1];
        }
      }
      
      const promotedRecord = {};
      Object.keys(studentRecord).forEach(k => {
        promotedRecord[k] = studentRecord[k];
      });
      
      promotedRecord.id = studentRecord.id; // Preserve student ID
      promotedRecord.grade = newGrade;
      promotedRecord.academicSession = nextSession;
      promotedRecord.isNewStudent = false;
      promotedRecord.isStopped = false;

      for (let i = 1; i <= 10; i++) {
        promotedRecord['inst' + i] = 0;
        promotedRecord['inst' + i + 'Date'] = "";
      }
      
      comps.forEach(c => {
        if (c.isForNewStudentsOnly) {
          promotedRecord[c.id] = 0;
        }
      });
      
      const currentBalance = parseFloat(studentRecord.balance) || 0;
      promotedRecord.arrears = Math.max(0, currentBalance);
      
      const saveRes = saveRecord(promotedRecord);
      if (saveRes.success) {
        okCount++;
        var finalId = saveRes.record ? saveRes.record.id : studentRecord.id;
        logPromotion(finalId, studentRecord.studentName, studentRecord.grade, newGrade, studentRecord.academicSession, nextSession);
      }
    });
    
    SpreadsheetApp.flush();
    
    let msg = "Successfully promoted " + okCount + " student(s) to " + nextSession;
    if (skippedCount > 0) {
      msg += " (" + skippedCount + " skipped because they were already promoted).";
    }
    
    logActivity('Promoted All Students', "From " + termName + " (" + academicYear + ") -> " + nextSession + ". Total: " + okCount + ", Skipped: " + skippedCount);
    
    return {success: true, message: msg};
    
  } catch(e) {
    Logger.log("promoteAllStudentsToNextTerm error: " + e.message);
    return {success: false, message: e.message};
  }
}

function isBoolTrue(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === 'boolean') return val;
  var s = String(val).trim().toUpperCase();
  return s === 'TRUE' || s === 'YES' || s === '1';
}

// ════════════════════════════════════════════════════════
// STAFF CHAT BACKEND
// ════════════════════════════════════════════════════════
const STAFF_CHATS_SHEET = "Staff Chats";

function getOrCreateStaffChatsSheet() {
  return getOrCreateSheet(STAFF_CHATS_SHEET, ["id", "timestamp", "role", "username", "sender", "content", "read", "reply", "replyTimestamp"]);
}

function getUserChatHistory(role, username) {
  try {
    const sh = getOrCreateStaffChatsSheet();
    const data = sh.getDataRange().getValues();
    const history = [];
    for (let i = 1; i < data.length; i++) {
      var dbRole = String(data[i][2] || "").trim();
      var dbUser = String(data[i][3] || "").trim();
      if (dbRole.toLowerCase() === String(role).trim().toLowerCase() && dbUser.toLowerCase() === String(username).trim().toLowerCase()) {
        history.push({
          id: String(data[i][0] || ""),
          timestamp: String(data[i][1] || ""),
          role: dbRole,
          username: dbUser,
          sender: String(data[i][4] || ""),
          content: String(data[i][5] || ""),
          read: data[i][6] === true || String(data[i][6]).toUpperCase() === 'TRUE',
          reply: String(data[i][7] || ""),
          replyTimestamp: String(data[i][8] || ""),
          row: i + 1
        });
      }
    }
    return {success: true, history: history};
  } catch(e) {
    return {success: false, message: e.message, history: []};
  }
}

function sendUserChatMessage(role, username, content) {
  try {
    const sh = getOrCreateStaffChatsSheet();
    const id = "UC-" + Date.now();
    const timestamp = new Date().toISOString();
    sh.appendRow([id, timestamp, role, username, role, content, false, "", ""]);
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function getAdminUserChats() {
  try {
    const sh = getOrCreateStaffChatsSheet();
    const data = sh.getDataRange().getValues();
    const chats = [];
    let unread = 0;
    for (let i = 1; i < data.length; i++) {
      var isRead = data[i][6] === true || String(data[i][6]).toUpperCase() === 'TRUE';
      var reply = String(data[i][7] || "").trim();
      if (!isRead && !reply) unread++;
      chats.push({
        id: String(data[i][0] || ""),
        timestamp: String(data[i][1] || ""),
        role: String(data[i][2] || ""),
        username: String(data[i][3] || ""),
        sender: String(data[i][4] || ""),
        content: String(data[i][5] || ""),
        read: isRead,
        reply: reply,
        replyTimestamp: String(data[i][8] || ""),
        row: i + 1
      });
    }
    return {success: true, chats: chats, unread: unread};
  } catch(e) {
    return {success: false, message: e.message, chats: [], unread: 0};
  }
}

function replyToUserChat(row, reply) {
  try {
    const sh = getOrCreateStaffChatsSheet();
    sh.getRange(row, 7).setValue(true); // read = true
    sh.getRange(row, 8).setValue(reply); // reply
    sh.getRange(row, 9).setValue(new Date().toISOString()); // replyTimestamp
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// Automatically trim, clean and normalize all spreadsheet sheet headers to resolve any trailing space anomalies
function cleanAllSheetHeaders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    sheets.forEach(sheet => {
      const name = sheet.getName();
      if (sheet.getLastColumn() > 0) {
        const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
        const headers = range.getValues()[0];
        const cleaned = headers.map(h => {
          var s = String(h || '').trim();
          // Normalize common mismatches to standard buildHeaders strings
          if (s.toLowerCase() === 'id') return 'id';
          if (s.toLowerCase() === 'studentname') return 'studentName';
          if (s.toLowerCase() === 'phonenumber') return 'phoneNumber';
          if (s.toLowerCase() === 'grade') return 'grade';
          if (s.toLowerCase() === 'academicsession') return 'academicSession';
          if (s.toLowerCase() === 'isnewstudent') return 'isNewStudent';
          if (s.toLowerCase() === 'isstopped') return 'isStopped';
          if (s.toLowerCase() === 'studentstatus') return 'studentStatus';
          if (s.toLowerCase() === 'totalfees') return 'totalFees';
          if (s.toLowerCase() === 'totalpaid') return 'totalPaid';
          if (s.toLowerCase() === 'balance') return 'balance';
          if (s.toLowerCase() === 'paymentstatus') return 'paymentStatus';
          if (s.toLowerCase() === 'createdat') return 'createdAt';
          if (s.toLowerCase() === 'updatedat') return 'updatedAt';
          if (s.toLowerCase() === 'paymentmode') return 'paymentMode';
          if (s.toLowerCase() === 'recordedby') return 'recordedBy';
          for (let j = 1; j <= 10; j++) {
            if (s.toLowerCase() === 'inst' + j) return 'inst' + j;
            if (s.toLowerCase() === 'inst' + j + 'date') return 'inst' + j + 'Date';
          }
          return s;
        });
        
        var changed = false;
        for (let i = 0; i < headers.length; i++) {
          if (headers[i] !== cleaned[i]) { changed = true; break; }
        }
        if (changed) {
          range.setValues([cleaned]);
          Logger.log('Cleaned and normalized headers for sheet: ' + name);
        }
      }
    });
  } catch(e) {
    Logger.log('cleanAllSheetHeaders error: ' + e.message);
  }
}

// Automatically transition matching Confirmed payment notifications to 'Recorded' state when manual installments are saved
function autoMarkNotificationsRecorded(studentId, recordData) {
  try {
    if (!studentId) return;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Payment Notifications');
    if (!sheet) return;
    
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    if (data.length <= 1) return;
    
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idIdx = headers.indexOf('studentid') !== -1 ? headers.indexOf('studentid') : headers.indexOf('id');
    const amtIdx = headers.indexOf('amount');
    const statusIdx = headers.indexOf('status');
    if (idIdx === -1 || amtIdx === -1 || statusIdx === -1) return;
    
    // Normalize recordData keys to lowercase
    const normRec = {};
    Object.keys(recordData).forEach(k => {
      normRec[String(k).trim().toLowerCase()] = recordData[k];
    });
    
    // Extract non-zero installments
    const installments = [];
    for (let j = 1; j <= 10; j++) {
      const v = parseFloat(normRec['inst' + j]);
      if (!isNaN(v) && v > 0) {
        installments.push(v);
      }
    }
    
    // Find all 'Confirmed' notifications for this student
    const confirmedNotifs = [];
    const targetSid = String(studentId).trim().toLowerCase();
    for (let i = 1; i < data.length; i++) {
      const rowSid = String(data[i][idIdx]).trim().toLowerCase();
      const rowStatus = String(data[i][statusIdx]).trim();
      const rowAmt = parseFloat(data[i][amtIdx]) || 0;
      
      if (rowSid === targetSid && rowStatus === 'Confirmed') {
        confirmedNotifs.push({
          row: i + 1,
          amount: rowAmt,
          matched: false
        });
      }
    }
    
    if (confirmedNotifs.length === 0 || installments.length === 0) return;
    
    // Match installments to confirmed notifications
    installments.forEach(instAmt => {
      const match = confirmedNotifs.find(n => !n.matched && Math.abs(n.amount - instAmt) < 0.01);
      if (match) {
        match.matched = true;
        // Update the status in the sheet to 'Recorded'
        sheet.getRange(match.row, statusIdx + 1).setValue('Recorded');
        // Set color to light gray
        sheet.getRange(match.row, 1, 1, data[0].length).setBackground('#f3f4f6');
        Logger.log('autoMarkNotificationsRecorded: Automatically marked payment notification row ' + match.row + ' as Recorded. Amount: ' + instAmt);
      }
    });
  } catch(e) {
    Logger.log('autoMarkNotificationsRecorded error: ' + e.message);
  }
}

// ── External School Management System Sync Receiver ────────────────

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'No post data received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.action === 'syncStudents') {
      // Secure check: if a key is stored in script properties, check it
      const configuredKey = PropertiesService.getScriptProperties().getProperty('schoolApiKey') || '';
      if (configuredKey && payload.apiKey !== configuredKey) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unauthorized: Invalid API Key matching target Fees system key.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const result = saveSyncedStudents(payload.students);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Unknown action: ' + payload.action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Sync receiver error: ' + err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveSyncedStudents(students) {
  try {
    if (!students || !Array.isArray(students)) {
      return { success: false, message: 'Invalid students list provided' };
    }
    
    // Retrieve term settings
    const sResult = getSettings();
    const settings = (sResult.success && sResult.settings) ? sResult.settings : {};
    const activeTerm = settings.activeTerm || 'First Term';
    const academicYear = settings.academicYear || '2025/2026';
    const activeSessionVal = academicYear + ' ' + activeTerm;
    
    const sheet = getOrCreateTermSheet(activeTerm);
    if (!sheet) {
      return { success: false, message: 'Unable to open active term sheet: ' + activeTerm };
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1) {
      return { success: false, message: 'Active term sheet has no header row.' };
    }
    
    // Extract headers to map values properly
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('studentName');
    const phoneIdx = headers.indexOf('phoneNumber');
    const gradeIdx = headers.indexOf('grade');
    const sessionIdx = headers.indexOf('academicSession');
    const isNewStudentIdx = headers.indexOf('isNewStudent');
    const isStoppedIdx = headers.indexOf('isStopped');
    const createdAtIdx = headers.indexOf('createdAt');
    const updatedAtIdx = headers.indexOf('updatedAt');
    
    if (idIdx === -1) {
      return { success: false, message: 'ID column not found in term sheet' };
    }
    
    // Read all existing rows to find matches in-memory
    const rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
    
    // Create mapping of student ID -> row index (0-based)
    const existingStudentMap = {};
    for (let i = 0; i < rows.length; i++) {
      const id = String(rows[i][idIdx]).trim();
      if (id) {
        existingStudentMap[id] = i;
      }
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    const nowStr = new Date().toISOString();
    
    // Load active components to initialize default amounts for new students
    const comps = getFeeComponentsList().filter(c => c.isActive);
    
    students.forEach(student => {
      const sId = String(student.id || '').trim();
      if (!sId) return; // Skip students without valid unique IDs
      
      if (existingStudentMap[sId] !== undefined) {
        // --- 1. UPDATE EXISTING STUDENT (Only basic identity columns, preserve payments) ---
        const rowIndex = existingStudentMap[sId];
        const row = rows[rowIndex];
        
        if (nameIdx !== -1) row[nameIdx] = student.name || '';
        if (phoneIdx !== -1) row[phoneIdx] = String(student.parentContact || '');
        if (gradeIdx !== -1) row[gradeIdx] = student.class || '';
        if (sessionIdx !== -1) row[sessionIdx] = activeSessionVal;
        if (updatedAtIdx !== -1) row[updatedAtIdx] = nowStr;
        
        // Recalculate fields safely using calculateFields
        const recordObj = {};
        headers.forEach((h, colIdx) => {
          recordObj[h] = row[colIdx];
        });
        calculateFields(recordObj);
        headers.forEach((h, colIdx) => {
          if (recordObj[h] !== undefined) {
            row[colIdx] = recordObj[h];
          }
        });
        
        updatedCount++;
      } else {
        // --- 2. ADD NEW STUDENT (Initialize all columns with safe defaults) ---
        const recordObj = {};
        headers.forEach(h => {
          recordObj[h] = '';
        });
        
        // Set identities and timestamps
        recordObj.id = sId;
        recordObj.studentName = student.name || '';
        recordObj.phoneNumber = String(student.parentContact || '');
        recordObj.grade = student.class || '';
        recordObj.academicSession = activeSessionVal;
        recordObj.isNewStudent = true;
        recordObj.isStopped = false;
        recordObj.createdAt = nowStr;
        recordObj.updatedAt = nowStr;
        
        // Seed default amounts for active fee components
        comps.forEach(c => {
          recordObj[c.id] = c.defaultAmount || 0;
        });
        
        // Clear payment slots and installment fields
        for (let i = 1; i <= 10; i++) {
          recordObj['inst' + i] = 0;
          recordObj['inst' + i + 'Date'] = '';
        }
        recordObj.totalPaid = 0;
        recordObj.paymentMode = '';
        recordObj.recordedBy = 'System Sync';
        
        // Run standard calculateFields to set totalFees, totalPaid, balance, paymentStatus
        calculateFields(recordObj);
        
        // Build new row aligned with sheet headers
        const newRow = headers.map(h => recordObj[h] !== undefined ? recordObj[h] : '');
        rows.push(newRow);
        
        addedCount++;
      }
    });
    
    // Write the updated/added rows back in one single, high-performance setValues write!
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, lastCol).setValues(rows);
      
      // Ensure phone format is preserved as text
      if (phoneIdx >= 0) {
        sheet.getRange(2, phoneIdx + 1, rows.length, 1).setNumberFormat('@STRING@');
      }
      
      // Log sync activity to Fees Activity Log
      logActivity('School Sync', 'Added ' + addedCount + ', Updated ' + updatedCount + ' students via Master System synchronization.');
      SpreadsheetApp.flush();
    }
    
    return {
      success: true,
      added: addedCount,
      updated: updatedCount,
      message: 'Successfully synchronized ' + (addedCount + updatedCount) + ' student records. (Added: ' + addedCount + ', Updated: ' + updatedCount + ')'
    };
    
    
  } catch (e) {
    return { success: false, message: 'Sync processing failed: ' + e.message };
  }
}

function getCustomStudentFees(studentId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
    if (!sheet) return {success: true, history: []};
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return {success: true, history: []};
    const headers = data[0].map(h => String(h).trim());
    const normHeaders = headers.map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const stuIdIdx = normHeaders.indexOf('studentid');
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const rowStuId = stuIdIdx !== -1 ? String(data[i][stuIdIdx]).trim() : '';
      if (studentId === 'all' || rowStuId.toLowerCase() === String(studentId).toLowerCase()) {
        const rec = {};
        headers.forEach((h, idx) => {
          const val = data[i][idx];
          if (val === null || val === undefined || val === '') {
            rec[h] = '';
          } else if (val instanceof Date) {
            rec[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } else {
            rec[h] = val;
          }
        });
        records.push(rec);
      }
    }
    return {success: true, history: records};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function saveCustomFeeRecord(recordData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateCustomFeeRecordsSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h || '').trim());
    const now = new Date().toISOString();
    
    // Normalize headers and recordData keys to lowercase
    const normHeaders = headers.map(h => h.toLowerCase());
    const normalized = {};
    Object.keys(recordData).forEach(k => {
      normalized[String(k).trim().toLowerCase()] = recordData[k];
    });
    
    const id = recordData.id;
    const studentId = String(recordData.studentId || '').trim();
    const feeTypeName = String(recordData.feeTypeName || '').trim();
    const academicSession = String(recordData.academicSession || '').trim();
    
    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    
    const idIdx = normHeaders.indexOf('id');
    const stuIdIdx = normHeaders.indexOf('studentid');
    const feeNameIdx = normHeaders.indexOf('feetypename');
    const sessionIdx = normHeaders.indexOf('academicsession');
    
    if (id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]).trim() === String(id).trim()) {
          foundRow = i + 1;
          break;
        }
      }
    } else {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][stuIdIdx]).trim() === studentId && 
            String(data[i][feeNameIdx]).trim() === feeTypeName &&
            String(data[i][sessionIdx]).trim() === academicSession) {
          foundRow = i + 1;
          break;
        }
      }
    }
    
    let totalPaid = 0;
    let numInst = parseInt(recordData.numInstallments) || 1;
    const amount = parseFloat(recordData.amount) || 0;

    // SAFETY NET: a client's numInstallments can be stale (its cached copy of
    // the Extra Fee Type config hasn't picked up a later admin change on
    // another device/tab, or the modal simply built its form from an older
    // value) and lower than what this row was ORIGINALLY recorded with. The
    // save handler below zeroes every installment slot past numInstallments
    // — if we trusted the incoming value blindly, real money already
    // recorded in inst4/inst5/etc. would be silently wiped the next time
    // anyone re-opens and re-saves this record. So: if the row already has
    // money in a slot beyond what the client just sent, keep that slot's
    // existing amount/date/mode instead of letting it be cleared, and widen
    // the effective installment count to match.
    if (foundRow !== -1) {
      const existingRow = data[foundRow - 1];
      let maxExistingInst = 0;
      for (let i = 1; i <= 6; i++) {
        const instIdx = normHeaders.indexOf('inst' + i);
        if (instIdx !== -1 && (parseFloat(existingRow[instIdx]) || 0) > 0) maxExistingInst = i;
      }
      if (maxExistingInst > numInst) {
        for (let i = numInst + 1; i <= maxExistingInst; i++) {
          const instIdx = normHeaders.indexOf('inst' + i);
          const dateIdx = normHeaders.indexOf('inst' + i + 'date');
          const modeIdx = normHeaders.indexOf('inst' + i + 'mode');
          recordData['inst' + i]          = instIdx !== -1 ? (parseFloat(existingRow[instIdx]) || 0) : 0;
          recordData['inst' + i + 'Date'] = dateIdx !== -1 ? existingRow[dateIdx] : '';
          recordData['inst' + i + 'Mode'] = modeIdx !== -1 ? existingRow[modeIdx] : '';
        }
        numInst = maxExistingInst;
      }
    }

    for (let i = 1; i <= 6; i++) {
      if (i <= numInst) {
        totalPaid += parseFloat(recordData['inst' + i]) || 0;
      } else {
        recordData['inst' + i] = 0;
        recordData['inst' + i + 'Date'] = '';
        recordData['inst' + i + 'Mode'] = '';
      }
    }
    
    recordData.totalPaid = totalPaid;
    recordData.balance = Math.max(0, amount - totalPaid);
    recordData.paymentStatus = recordData.balance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
    recordData.updatedAt = now;
    
    // Resolve studentName and grade if missing
    let studentName = recordData.studentName || '';
    let grade = recordData.grade || '';
    if (!studentName || !grade) {
      const term = getTermFromSession(academicSession);
      const tSheet = ss.getSheetByName(SHEET_PREFIX + ' - ' + term);
      if (tSheet && tSheet.getLastRow() > 1) {
        const tData = tSheet.getDataRange().getValues();
        const tHdrs = tData[0].map(h => String(h).trim().toLowerCase());
        const tIdIdx = tHdrs.indexOf('id');
        const nameIdx = tHdrs.indexOf('studentname');
        const gradeIdx = tHdrs.indexOf('grade');
        for (let i = 1; i < tData.length; i++) {
          if (String(tData[i][tIdIdx]).trim() === studentId) {
            studentName = String(tData[i][nameIdx] || '').trim();
            grade = String(tData[i][gradeIdx] || '').trim();
            break;
          }
        }
      }
    }
    recordData.studentName = studentName;
    recordData.grade = grade;
    
    // Refresh normalized keys with updated details
    Object.keys(recordData).forEach(k => {
      normalized[String(k).trim().toLowerCase()] = recordData[k];
    });
    
    if (foundRow !== -1) {
      const updRow = headers.map(h => {
        const normH = h.toLowerCase();
        return normalized[normH] !== undefined ? normalized[normH] : data[foundRow-1][headers.indexOf(h)];
      });
      updRow[normHeaders.indexOf('updatedat')] = now;
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([updRow]);
      logActivity('Updated Custom Fee', studentId + ' - ' + feeTypeName + ' (' + academicSession + ')');
      return {success: true, record: recordData};
    } else {
      recordData.id = "CF-" + Utilities.getUuid().substring(0, 8);
      recordData.createdAt = now;
      normalized['id'] = recordData.id;
      normalized['createdat'] = now;
      const newRow = headers.map(h => {
        const normH = h.toLowerCase();
        return normalized[normH] !== undefined ? normalized[normH] : '';
      });
      sheet.appendRow(newRow);
      logActivity('Recorded Custom Fee', studentId + ' - ' + feeTypeName + ' (' + academicSession + ')');
      return {success: true, record: recordData};
    }
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// Removes one student's extra/custom fee record entirely (e.g. a stray or
// mistakenly-billed "Books" charge) from the Custom Fee Records sheet.
// Unlike the Extra Fee Type templates in Settings (which only control what
// NEW fees look like), this is the only way to remove a fee that's already
// been billed to a specific student — deleting a template doesn't touch
// records already created from it.
function deleteCustomFeeRecord(studentId, academicSession, feeTypeName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
    if (!sheet) return { success: false, message: 'Custom Fee Records sheet not found' };
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, message: 'Not found' };
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const stuIdIdx = headers.indexOf('studentid');
    const feeNameIdx = headers.indexOf('feetypename');
    const sessionIdx = headers.indexOf('academicsession');
    if (stuIdIdx === -1 || feeNameIdx === -1) return { success: false, message: 'Sheet columns not found' };

    const targetStu = String(studentId || '').trim().toLowerCase();
    const targetFee = String(feeTypeName || '').trim().toLowerCase();
    const targetSess = String(academicSession || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      const rowStu = String(data[i][stuIdIdx] || '').trim().toLowerCase();
      const rowFee = String(data[i][feeNameIdx] || '').trim().toLowerCase();
      const rowSess = sessionIdx !== -1 ? String(data[i][sessionIdx] || '').trim().toLowerCase() : '';
      if (rowStu === targetStu && rowFee === targetFee && (!targetSess || rowSess === targetSess)) {
        sheet.deleteRow(i + 1);
        logActivity('Deleted Custom Fee', studentId + ' - ' + feeTypeName + ' (' + academicSession + ')');
        return { success: true };
      }
    }
    return { success: false, message: 'Not found' };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// REFUND PAYMENT — admin/collector refund a parent (overpayment or a
// parent-requested refund) from a student's row. Reduces the actual
// recorded installment amounts (working backwards from the most recent
// payment) rather than just leaving a bookkeeping note, so totalPaid/
// balance stay correct everywhere that reads them — the admin table,
// dashboard, and Parent Portal all recompute from the same sheet data.
// ════════════════════════════════════════════════════════
function refundPayment(data) {
  try {
    const amount = parseFloat(data.amount) || 0;
    if (amount <= 0) return { success: false, message: 'Refund amount must be greater than zero' };
    const reason = String(data.reason || '').trim();
    if (reason.length < 3) return { success: false, message: 'Please provide a reason (at least 3 characters)' };

    const feeType = data.feeType || 'regular';
    const result = feeType === 'regular'
      ? refundRegularFee(data.studentId, data.session, amount)
      : refundCustomFee(data.studentId, data.session, feeType, amount);

    if (!result.success) return result;

    try {
      logRefund({
        timestamp: new Date().toISOString(),
        studentId: data.studentId,
        studentName: result.studentName || '',
        feeType: feeType,
        session: data.session || '',
        amount: amount,
        reason: reason,
        processedBy: data.refundedBy || ''
      });
    } catch(logErr) {
      Logger.log('logRefund error: ' + logErr.message);
    }

    return { success: true, record: result.record };
  } catch(e) {
    Logger.log('refundPayment error: ' + e.message);
    return { success: false, message: e.message };
  }
}

// Deducts `amount` from a regular term-fee record's paid installments,
// working backwards from the last installment to inst1 (undoing the most
// recent payments first), then recomputes totalPaid/balance/paymentStatus.
function refundRegularFee(studentId, session, amount) {
  const term = getTermFromSession(session);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + ' - ' + term);
  if (!sheet) return { success: false, message: 'Term sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { success: false, message: 'Invalid sheet' };

  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) { rowIdx = i; break; }
  }
  if (rowIdx === -1) return { success: false, message: 'Student record not found' };

  return applyRefundToInstallments(sheet, headers, rowIdx, amount, 'totalFees');
}

// Same as refundRegularFee but against a row in the Custom Fee Records sheet.
function refundCustomFee(studentId, session, feeTypeName, amount) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
  if (!sheet) return { success: false, message: 'No custom fee records found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const normHeaders = headers.map(h => h.toLowerCase());
  const stuIdIdx = normHeaders.indexOf('studentid');
  const feeNameIdx = normHeaders.indexOf('feetypename');
  const sessIdx = normHeaders.indexOf('academicsession');

  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][stuIdIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase() &&
        String(data[i][feeNameIdx]).trim() === String(feeTypeName).trim() &&
        (!session || String(data[i][sessIdx]).trim() === String(session).trim())) {
      rowIdx = i; break;
    }
  }
  if (rowIdx === -1) return { success: false, message: 'Fee record not found' };

  return applyRefundToInstallments(sheet, headers, rowIdx, amount, 'amount');
}

// Shared installment-refund logic for both regular and custom fee sheets.
// `feesColName` is 'totalFees' for the term sheets, 'amount' for custom fees.
function applyRefundToInstallments(sheet, headers, rowIdx, amount, feesColName) {
  const normHeaders = headers.map(h => h.toLowerCase());
  const instIdx = [];
  // Regular fee sheets now have inst1..inst10; custom fee sheets still only
  // have inst1..inst6 — indexOf just returns -1 (harmlessly skipped below)
  // for whichever slots a given sheet doesn't have.
  for (let n = 1; n <= 10; n++) instIdx.push(normHeaders.indexOf('inst' + n));

  const rowRange = sheet.getRange(rowIdx + 1, 1, 1, headers.length);
  const row = rowRange.getValues()[0];

  let currentPaid = 0;
  instIdx.forEach(idx => { if (idx !== -1) currentPaid += parseFloat(row[idx]) || 0; });
  if (amount > currentPaid + 0.01) {
    return { success: false, message: 'Refund amount exceeds amount paid (' + currentPaid.toFixed(2) + ')' };
  }

  let remaining = amount;
  for (let n = instIdx.length - 1; n >= 0 && remaining > 0.001; n--) {
    const idx = instIdx[n];
    if (idx === -1) continue;
    let val = parseFloat(row[idx]) || 0;
    if (val <= 0) continue;
    const deduct = Math.min(val, remaining);
    row[idx] = val - deduct;
    remaining -= deduct;
  }

  const feesIdx = normHeaders.indexOf(feesColName.toLowerCase());
  const totalPaidIdx = normHeaders.indexOf('totalpaid');
  const balanceIdx = normHeaders.indexOf('balance');
  const statusIdx = normHeaders.indexOf('paymentstatus');
  const updatedAtIdx = normHeaders.indexOf('updatedat');
  const nameIdx = normHeaders.indexOf('studentname');

  const feesTotal = feesIdx !== -1 ? (parseFloat(row[feesIdx]) || 0) : 0;
  let newPaid = 0;
  instIdx.forEach(idx => { if (idx !== -1) newPaid += parseFloat(row[idx]) || 0; });
  const newBalance = Math.max(0, feesTotal - newPaid);
  const newStatus = (newBalance <= 0 && feesTotal > 0) ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');

  if (totalPaidIdx !== -1) row[totalPaidIdx] = newPaid;
  if (balanceIdx !== -1) row[balanceIdx] = newBalance;
  if (statusIdx !== -1) row[statusIdx] = newStatus;
  if (updatedAtIdx !== -1) row[updatedAtIdx] = new Date().toISOString();

  rowRange.setValues([row]);

  const record = {};
  headers.forEach((h, idx) => { record[h] = row[idx]; });
  return { success: true, record: record, studentName: nameIdx !== -1 ? row[nameIdx] : '' };
}

const REFUNDS_SHEET = 'Refunds';

function logRefund(entry) {
  const sheet = getOrCreateSheet(REFUNDS_SHEET, ['timestamp', 'studentId', 'studentName', 'feeType', 'session', 'amount', 'reason', 'processedBy']);
  sheet.appendRow([
    entry.timestamp || new Date().toISOString(),
    entry.studentId || '',
    entry.studentName || '',
    entry.feeType || 'regular',
    entry.session || '',
    entry.amount || 0,
    entry.reason || '',
    entry.processedBy || ''
  ]);
}

function getRefundHistory(studentId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REFUNDS_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, refunds: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const sidIdx = headers.indexOf('studentId');
    const refunds = [];
    for (let i = 1; i < data.length; i++) {
      if (studentId === 'all' || String(data[i][sidIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
        const rec = {};
        headers.forEach((h, idx) => {
          const val = data[i][idx];
          rec[h] = (val instanceof Date) ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : val;
        });
        refunds.push(rec);
      }
    }
    return { success: true, refunds: refunds };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ── Student Promotion History Logs ────────────────────────────
const PROMOTION_HISTORY_SHEET = "Promotion History";

function getOrCreatePromotionHistorySheet() {
  return getOrCreateSheet(PROMOTION_HISTORY_SHEET, [
    "timestamp",
    "studentId",
    "studentName",
    "fromGrade",
    "toGrade",
    "fromSession",
    "toSession",
    "promotedBy"
  ]);
}

function logPromotion(studentId, studentName, fromGrade, toGrade, fromSession, toSession) {
  try {
    const sheet = getOrCreatePromotionHistorySheet();
    const user = Session.getActiveUser().getEmail() || "Admin";
    sheet.appendRow([
      new Date().toISOString(),
      studentId || "",
      studentName || "",
      fromGrade || "",
      toGrade || "",
      fromSession || "",
      toSession || "",
      user
    ]);
  } catch(e) {
    Logger.log("logPromotion error: " + e.message);
  }
}

function getPromotionHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PROMOTION_HISTORY_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, history: [] };
    }
    const data = sheet.getDataRange().getValues();
    const history = [];
    const headers = data[0].map(h => String(h).trim());
    
    const timestampIdx = headers.indexOf("timestamp");
    const idIdx = headers.indexOf("studentId");
    const nameIdx = headers.indexOf("studentName");
    const fromGradeIdx = headers.indexOf("fromGrade");
    const toGradeIdx = headers.indexOf("toGrade");
    const fromSessionIdx = headers.indexOf("fromSession");
    const toSessionIdx = headers.indexOf("toSession");
    const userIdx = headers.indexOf("promotedBy");
    
    for (let i = 1; i < data.length; i++) {
      let tsVal = data[i][timestampIdx];
      let formattedDate = "";
      if (tsVal) {
        if (tsVal instanceof Date) {
          formattedDate = Utilities.formatDate(tsVal, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        } else {
          try {
            var parsed = new Date(tsVal);
            if (!isNaN(parsed.getTime())) {
              formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            } else {
              formattedDate = tsVal;
            }
          } catch(err) {
            formattedDate = tsVal;
          }
        }
      }
      history.push({
        timestamp: formattedDate,
        studentId: data[i][idIdx] || '',
        studentName: data[i][nameIdx] || '',
        fromGrade: data[i][fromGradeIdx] || '',
        toGrade: data[i][toGradeIdx] || '',
        fromSession: data[i][fromSessionIdx] || '',
        toSession: data[i][toSessionIdx] || '',
        promotedBy: data[i][userIdx] || ''
      });
    }
    history.reverse();
    return { success: true, history: history };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// DISCOUNT HISTORY HELPERS
// ════════════════════════════════════════════════════════
const DISCOUNT_HISTORY_SHEET = "Discount History";

function getOrCreateDiscountHistorySheet() {
  return getOrCreateSheet(DISCOUNT_HISTORY_SHEET, [
    "timestamp",
    "studentId",
    "studentName",
    "grade",
    "academicSession",
    "discountAmount",
    "recordedBy"
  ]);
}

function logDiscountChange(studentId, studentName, grade, academicSession, discountAmount) {
  try {
    const sheet = getOrCreateDiscountHistorySheet();
    const user = Session.getActiveUser().getEmail() || "Admin";
    sheet.appendRow([
      new Date().toISOString(),
      studentId || "",
      studentName || "",
      grade || "",
      academicSession || "",
      discountAmount || 0,
      user
    ]);
  } catch(e) {
    Logger.log("logDiscountChange error: " + e.message);
  }
}

function getDiscountHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(DISCOUNT_HISTORY_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, history: [] };
    }
    const data = sheet.getDataRange().getValues();
    const history = [];
    const headers = data[0].map(h => String(h).trim());
    
    const timestampIdx = headers.indexOf("timestamp");
    const idIdx = headers.indexOf("studentId");
    const nameIdx = headers.indexOf("studentName");
    const gradeIdx = headers.indexOf("grade");
    const sessionIdx = headers.indexOf("academicSession");
    const amountIdx = headers.indexOf("discountAmount");
    const userIdx = headers.indexOf("recordedBy");
    
    for (let i = 1; i < data.length; i++) {
      let tsVal = data[i][timestampIdx];
      let formattedDate = "";
      if (tsVal) {
        if (tsVal instanceof Date) {
          formattedDate = Utilities.formatDate(tsVal, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        } else {
          try {
            var parsed = new Date(tsVal);
            if (!isNaN(parsed.getTime())) {
              formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            } else {
              formattedDate = tsVal;
            }
          } catch(err) {
            formattedDate = tsVal;
          }
        }
      }
      history.push({
        timestamp: formattedDate,
        studentId: data[i][idIdx] || '',
        studentName: data[i][nameIdx] || '',
        grade: data[i][gradeIdx] || '',
        academicSession: data[i][sessionIdx] || '',
        discountAmount: parseFloat(data[i][amountIdx]) || 0,
        recordedBy: data[i][userIdx] || ''
      });
    }
    history.reverse();
    return { success: true, history: history };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// UNIFORM SALES HELPERS
// ════════════════════════════════════════════════════════
const UNIFORM_SALES_SHEET = "Uniform Sales";

function getOrCreateUniformSalesSheet() {
  return getOrCreateSheet(UNIFORM_SALES_SHEET, [
    "id",
    "timestamp",
    "studentId",
    "studentName",
    "grade",
    "academicSession",
    "uniformTypes",
    "totalPrice",
    "amountPaid",
    "balance",
    "paymentStatus",
    "status",
    "readyDate",
    "notes",
    "recordedBy"
  ]);
}

function saveUniformSale(saleData) {
  try {
    const sheet = getOrCreateUniformSalesSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const now = new Date().toISOString();
    const user = Session.getActiveUser().getEmail() || "Admin";

    if (!saleData.id || String(saleData.id).trim() === '') {
      saleData.id = "US-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      saleData.createdAt = now;
    }
    
    saleData.timestamp = saleData.timestamp || now;
    saleData.recordedBy = user;
    
    // Calculate balance and paymentStatus
    const tp = parseFloat(saleData.totalPrice) || 0;
    const ap = parseFloat(saleData.amountPaid) || 0;
    saleData.balance = Math.max(0, tp - ap);
    saleData.paymentStatus = saleData.balance <= 0 ? "Paid" : ap > 0 ? "Partially Paid" : "Unpaid";

    // Normalize keys
    const normalized = {};
    Object.keys(saleData).forEach(k => {
      normalized[String(k).trim().toLowerCase()] = saleData[k];
    });

    // Check if updating
    let foundRow = -1;
    if (saleData.id) {
      const data = sheet.getDataRange().getValues();
      const idIdx = headers.indexOf("id");
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(saleData.id)) {
          foundRow = i + 1;
          break;
        }
      }
    }

    const rowVal = headers.map(h => {
      const normH = String(h).toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Uniform Sale', saleData.id + ' - ' + saleData.studentName);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Recorded Uniform Sale', saleData.id + ' - ' + saleData.studentName);
    }

    SpreadsheetApp.flush();
    return { success: true, sale: saleData };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function getUniformSales() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(UNIFORM_SALES_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, sales: [] };
    }
    const data = sheet.getDataRange().getValues();
    const sales = [];
    const headers = data[0].map(h => String(h).trim());
    
    const idIdx = headers.indexOf("id");
    const tsIdx = headers.indexOf("timestamp");
    const stIdIdx = headers.indexOf("studentId");
    const nameIdx = headers.indexOf("studentName");
    const gradeIdx = headers.indexOf("grade");
    const sessIdx = headers.indexOf("academicSession");
    const typesIdx = headers.indexOf("uniformTypes");
    const tpIdx = headers.indexOf("totalPrice");
    const apIdx = headers.indexOf("amountPaid");
    const balIdx = headers.indexOf("balance");
    const payIdx = headers.indexOf("paymentStatus");
    const statusIdx = headers.indexOf("status");
    const readyIdx = headers.indexOf("readyDate");
    const notesIdx = headers.indexOf("notes");
    const recIdx = headers.indexOf("recordedBy");

    for (let i = 1; i < data.length; i++) {
      let tsVal = data[i][tsIdx];
      let formattedDate = "";
      if (tsVal) {
        if (tsVal instanceof Date) {
          formattedDate = Utilities.formatDate(tsVal, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        } else {
          try {
            var parsed = new Date(tsVal);
            if (!isNaN(parsed.getTime())) {
              formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            } else {
              formattedDate = tsVal;
            }
          } catch(err) {
            formattedDate = tsVal;
          }
        }
      }
      sales.push({
        id: data[i][idIdx] || '',
        timestamp: formattedDate,
        studentId: data[i][stIdIdx] || '',
        studentName: data[i][nameIdx] || '',
        grade: data[i][gradeIdx] || '',
        academicSession: data[i][sessIdx] || '',
        uniformTypes: data[i][typesIdx] || '',
        totalPrice: parseFloat(data[i][tpIdx]) || 0,
        amountPaid: parseFloat(data[i][apIdx]) || 0,
        balance: parseFloat(data[i][balIdx]) || 0,
        paymentStatus: data[i][payIdx] || 'Unpaid',
        status: data[i][statusIdx] || 'Pending',
        readyDate: data[i][readyIdx] || '',
        notes: data[i][notesIdx] || '',
        recordedBy: data[i][recIdx] || ''
      });
    }
    sales.reverse();
    return { success: true, sales: sales };
  } catch(e) {
    return { success: false, message: e.message };
  }
}
// ════════════════════════════════════════════════════════
// CLASS FEE RATES HELPERS
// ════════════════════════════════════════════════════════
const CLASS_FEE_RATES_SHEET = "Class Fee Rates";

function getOrCreateClassFeeRatesSheet() {
  return getOrCreateSheet(CLASS_FEE_RATES_SHEET, ["class", "componentId", "amount"]);
}

function getClassFeeRates() {
  try {
    const sheet = getOrCreateClassFeeRatesSheet();
    const data = sheet.getDataRange().getValues();
    const rates = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      rates.push({
        grade: String(data[i][0]).trim(),
        componentId: String(data[i][1]).trim(),
        amount: parseFloat(data[i][2]) || 0
      });
    }
    return { success: true, rates: rates };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function saveClassFeeRates(rates) {
  try {
    const sheet = getOrCreateClassFeeRatesSheet();
    sheet.clearContents();
    sheet.appendRow(["class", "componentId", "amount"]);
    rates.forEach(r => {
      sheet.appendRow([r.grade, r.componentId, parseFloat(r.amount) || 0]);
    });
    SpreadsheetApp.flush();
    return { success: true };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// Backfills Standard Fee Rates (Regular School Fees components like Tuition,
// Admission, etc.) onto every currently active student in the matching class
// who doesn't already have that component billed (value is blank or 0).
// Just like the Extra Fee auto-billing engine, this only ever fills in a
// missing amount — it never overwrites a value an admin already entered or
// edited for a specific student.
function applyClassFeeRatesToExistingStudents(rates) {
  var billedCount = 0;
  var byClass = {};
  rates.forEach(function(r) {
    var amt = parseFloat(r.amount) || 0;
    if (amt <= 0) return;
    if (!byClass[r.grade]) byClass[r.grade] = [];
    byClass[r.grade].push({ componentId: r.componentId, amount: amt });
  });
  if (!Object.keys(byClass).length) return 0;

  // Components flagged "new students only" (e.g. Admission Fees) must never be
  // auto-billed to a continuing/active student — only to rows where isNewStudent
  // is actually true. Build a quick lookup once.
  var newStudentOnlyIds = {};
  getFeeComponentsList().forEach(function(c) {
    if (c.isForNewStudentsOnly) newStudentOnlyIds[String(c.id).trim().toLowerCase()] = true;
  });

  ["First Term", "Second Term", "Third Term"].forEach(function(term) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet || sheet.getLastRow() < 2) return;
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });
    var lowerHeaders = headers.map(function(h) { return h.toLowerCase(); });
    var gradeIdx = lowerHeaders.indexOf('grade');
    var stoppedIdx = lowerHeaders.indexOf('isstopped');
    var newStudentIdx = lowerHeaders.indexOf('isnewstudent');
    var totalFeesIdx = lowerHeaders.indexOf('totalfees');
    var totalPaidIdx = lowerHeaders.indexOf('totalpaid');
    var balanceIdx = lowerHeaders.indexOf('balance');
    var discountIdx = lowerHeaders.indexOf('discount');

    for (var i = 1; i < data.length; i++) {
      if (stoppedIdx !== -1 && isBoolTrue(data[i][stoppedIdx])) continue;
      var grade = data[i][gradeIdx];
      var classRates = byClass[grade];
      if (!classRates || !classRates.length) continue;
      var isNew = newStudentIdx !== -1 && isBoolTrue(data[i][newStudentIdx]);

      var rowChanged = false;
      classRates.forEach(function(cr) {
        // Never bill a "new students only" component (e.g. Admission Fees) to
        // an existing/continuing student — only genuinely new admissions.
        if (newStudentOnlyIds[String(cr.componentId).trim().toLowerCase()] && !isNew) return;
        var colIdx = lowerHeaders.indexOf(String(cr.componentId).toLowerCase());
        if (colIdx === -1) return;
        var current = parseFloat(data[i][colIdx]) || 0;
        if (current > 0) return; // never overwrite an existing amount
        sheet.getRange(i + 1, colIdx + 1).setValue(cr.amount);
        data[i][colIdx] = cr.amount;
        rowChanged = true;
      });

      if (rowChanged) {
        billedCount++;
        // Recompute totalFees/balance for this row using the active fee components
        if (totalFeesIdx !== -1) {
          var comps = getFeeComponentsList().filter(function(c) { return c.isActive; });
          var discountVal = discountIdx !== -1 ? (parseFloat(data[i][discountIdx]) || 0) : 0;
          var totalFees = 0;
          comps.forEach(function(c) {
            var cIdx = lowerHeaders.indexOf(String(c.id).toLowerCase());
            if (cIdx === -1) return;
            var v = parseFloat(data[i][cIdx]) || 0;
            if (c.id === 'actualFees') v = Math.max(0, v - discountVal);
            totalFees += v;
          });
          var totalPaid = totalPaidIdx !== -1 ? (parseFloat(data[i][totalPaidIdx]) || 0) : 0;
          sheet.getRange(i + 1, totalFeesIdx + 1).setValue(totalFees);
          if (balanceIdx !== -1) sheet.getRange(i + 1, balanceIdx + 1).setValue(totalFees - totalPaid);
        }
      }
    }
  });

  return billedCount;
}

// ════════════════════════════════════════════════════════
// BOOK CONFIGURATION HELPERS
// ════════════════════════════════════════════════════════
const BOOK_CONFIG_SHEET = "Book Config";

function getOrCreateBookConfigSheet() {
  return getOrCreateSheet(BOOK_CONFIG_SHEET, ["id", "grade", "bookName", "bookType", "quantity", "price"]);
}

function getBookConfigs() {
  try {
    const sheet = getOrCreateBookConfigSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idIdx = headers.indexOf("id");
    const gradeIdx = headers.indexOf("grade");
    const nameIdx = headers.indexOf("bookname");
    const typeIdx = headers.indexOf("booktype");
    const qtyIdx = headers.indexOf("quantity");
    const priceIdx = headers.indexOf("price");
    
    const configs = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      configs.push({
        id: idIdx !== -1 ? String(data[i][idIdx] || '').trim() : '',
        grade: gradeIdx !== -1 ? String(data[i][gradeIdx] || '').trim() : '',
        bookName: nameIdx !== -1 ? String(data[i][nameIdx] || '').trim() : '',
        bookType: typeIdx !== -1 ? String(data[i][typeIdx] || '').trim() : '',
        quantity: qtyIdx !== -1 ? (parseInt(data[i][qtyIdx]) || 1) : 1,
        price: priceIdx !== -1 ? (parseFloat(data[i][priceIdx]) || 0) : 0
      });
    }
    return { success: true, configs: configs };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function saveBookConfig(configData) {
  try {
    const sheet = getOrCreateBookConfigSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    
    if (!configData.id || String(configData.id).trim() === '') {
      configData.id = "BC-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    }
    
    const normalized = {};
    Object.keys(configData).forEach(k => {
      normalized[String(k).trim().toLowerCase()] = configData[k];
    });

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf("id");
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(configData.id)) {
        foundRow = i + 1;
        break;
      }
    }

    const rowVal = headers.map(h => {
      const normH = String(h).toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
    } else {
      sheet.appendRow(rowVal);
    }
    SpreadsheetApp.flush();
    return { success: true, config: configData };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function deleteBookConfig(id) {
  try {
    const sheet = getOrCreateBookConfigSheet();
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].map(h => String(h).trim()).indexOf("id");
    if (idCol === -1) return { success: false, message: "ID column not found" };
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return { success: true };
      }
    }
    return { success: false, message: "Book config not found" };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// BOOK SALES HELPERS
// ════════════════════════════════════════════════════════
const BOOK_SALES_SHEET = "Book Sales";

function getOrCreateBookSalesSheet() {
  return getOrCreateSheet(BOOK_SALES_SHEET, [
    "id",
    "timestamp",
    "studentId",
    "studentName",
    "grade",
    "academicSession",
    "booksPurchased",
    "booksIssued",
    "totalPrice",
    "amountPaid",
    "balance",
    "paymentStatus",
    "installments",
    "recordedBy"
  ]);
}

function saveBookSale(saleData) {
  try {
    const sheet = getOrCreateBookSalesSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const now = new Date().toISOString();
    const user = Session.getActiveUser().getEmail() || "Admin";

    if (!saleData.id || String(saleData.id).trim() === '') {
      saleData.id = "BS-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      saleData.createdAt = now;
    }
    
    saleData.timestamp = saleData.timestamp || now;
    saleData.recordedBy = user;
    
    const tp = parseFloat(saleData.totalPrice) || 0;
    const ap = parseFloat(saleData.amountPaid) || 0;
    saleData.balance = Math.max(0, tp - ap);
    saleData.paymentStatus = saleData.balance <= 0 ? "Paid" : ap > 0 ? "Partially Paid" : "Unpaid";

    const normalized = {};
    Object.keys(saleData).forEach(k => {
      normalized[String(k).trim().toLowerCase()] = saleData[k];
    });

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.indexOf("id");
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(saleData.id)) {
        foundRow = i + 1;
        break;
      }
    }

    const rowVal = headers.map(h => {
      const normH = String(h).toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Book Sale', saleData.id + ' - ' + saleData.studentName);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Recorded Book Sale', saleData.id + ' - ' + saleData.studentName);
    }

    SpreadsheetApp.flush();
    return { success: true, sale: saleData };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function getBookSales() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(BOOK_SALES_SHEET);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, sales: [] };
    }
    const data = sheet.getDataRange().getValues();
    const sales = [];
    const headers = data[0].map(h => String(h).trim());
    
    const idIdx = headers.indexOf("id");
    const tsIdx = headers.indexOf("timestamp");
    const stIdIdx = headers.indexOf("studentId");
    const nameIdx = headers.indexOf("studentName");
    const gradeIdx = headers.indexOf("grade");
    const sessIdx = headers.indexOf("academicSession");
    const purchasedIdx = headers.indexOf("booksPurchased");
    const issuedIdx = headers.indexOf("booksIssued");
    const tpIdx = headers.indexOf("totalPrice");
    const apIdx = headers.indexOf("amountPaid");
    const balIdx = headers.indexOf("balance");
    const payIdx = headers.indexOf("paymentStatus");
    const recIdx = headers.indexOf("recordedBy");

    const instIdx = headers.indexOf("installments");
    for (let i = 1; i < data.length; i++) {
      let tsVal = data[i][tsIdx];
      let formattedDate = "";
      if (tsVal) {
        if (tsVal instanceof Date) {
          formattedDate = Utilities.formatDate(tsVal, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
        } else {
          try {
            var parsed = new Date(tsVal);
            if (!isNaN(parsed.getTime())) {
              formattedDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            } else {
              formattedDate = tsVal;
            }
          } catch(err) {
            formattedDate = tsVal;
          }
        }
      }
      sales.push({
        id: data[i][idIdx] || '',
        timestamp: formattedDate,
        studentId: data[i][stIdIdx] || '',
        studentName: data[i][nameIdx] || '',
        grade: data[i][gradeIdx] || '',
        academicSession: data[i][sessIdx] || '',
        booksPurchased: data[i][purchasedIdx] || '',
        booksIssued: data[i][issuedIdx] || '',
        totalPrice: parseFloat(data[i][tpIdx]) || 0,
        amountPaid: parseFloat(data[i][apIdx]) || 0,
        balance: parseFloat(data[i][balIdx]) || 0,
        paymentStatus: data[i][payIdx] || 'Unpaid',
        installments: instIdx !== -1 ? (data[i][instIdx] || '[]') : '[]',
        recordedBy: data[i][recIdx] || ''
      });
    }
    sales.reverse();
    return { success: true, sales: sales };
  } catch(e) {
    return { success: false, message: e.message };
  }
}


function ensureColumnExists(sheetName, columnName, defaultValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    if (headers.indexOf(columnName.toLowerCase()) === -1) {
      const newColIndex = headers.length + 1;
      sheet.getRange(1, newColIndex).setValue(columnName)
        .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
      if (data.length > 1) {
        const range = sheet.getRange(2, newColIndex, data.length - 1, 1);
        const vals = [];
        for (let i = 1; i < data.length; i++) {
          vals.push([defaultValue]);
        }
        range.setValues(vals);
      }
      SpreadsheetApp.flush();
    }
  } catch(e) {
    Logger.log("Error in ensureColumnExists: " + e.message);
  }
}


// ── Sibling payments helper routines ────────────────────────
function recordSiblingPayments(wardsPaymentsJson, date, mode) {
  try {
    const list = JSON.parse(wardsPaymentsJson);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const termSheets = ["First Term", "Second Term", "Third Term"];
    const updatedRecords = [];
    
    for (let k = 0; k < list.length; k++) {
      const item = list[k];
      const studentId = item.id;
      const amount = parseFloat(item.amount) || 0;
      if (amount <= 0) continue;
      
      let studentObj = null;
      let foundSheet = null;
      let foundRow = -1;
      let foundHeaders = null;
      
      for (let t = 0; t < termSheets.length; t++) {
        const sheetName = SHEET_PREFIX + " - " + termSheets[t];
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) continue;
        const data = sheet.getDataRange().getValues();
        const headers = data[0].map(h => String(h).trim());
        const idIdx = headers.indexOf('id');
        if (idIdx === -1) continue;
        
        for (let i = 1; i < data.length; i++) {
          if (String(data[i][idIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
            studentObj = {};
            headers.forEach((h, idx) => {
              studentObj[h] = data[i][idx];
            });
            foundSheet = sheet;
            foundRow = i + 1;
            foundHeaders = headers;
            break;
          }
        }
        if (studentObj) break;
      }
      
      if (studentObj) {
        let instIndex = -1;
        for (let j = 1; j <= 10; j++) {
          const rawVal = studentObj['inst' + j];
          const val = parseFloat(rawVal) || 0;
          if (val === 0) {
            instIndex = j;
            break;
          }
        }
        
        if (instIndex !== -1) {
          const instKey = foundHeaders.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex) || ('inst' + instIndex);
          const dateKey = foundHeaders.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex + 'date') || ('inst' + instIndex + 'Date');
          const modeKey = foundHeaders.find(h => String(h).trim().toLowerCase() === 'paymentmode') || 'paymentMode';
          const recByKey = foundHeaders.find(h => String(h).trim().toLowerCase() === 'recordedby') || 'recordedBy';
          
          studentObj[instKey] = amount;
          studentObj[dateKey] = date;
          studentObj[modeKey] = mode;
          studentObj[recByKey] = 'Admin (Family)';
          
          const saveRes = saveRecord(studentObj);
          if (saveRes.success) {
            updatedRecords.push(saveRes.record);
          }
        }
      }
    }
    
    return {success: true, updatedRecords: updatedRecords};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function findStudentObj(studentId, ss) {
  const termSheets = ["First Term", "Second Term", "Third Term"];
  for (let t = 0; t < termSheets.length; t++) {
    const sheetName = SHEET_PREFIX + " - " + termSheets[t];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;
    const headers = data[0].map(h => String(h).trim());
    const idIdx = headers.indexOf("id");
    if (idIdx === -1) continue;
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
        const studentObj = { rowNum: i + 1, sheetName: sheetName, headers: headers };
        headers.forEach((h, idx) => {
          studentObj[h] = data[i][idx];
        });
        return studentObj;
      }
    }
  }
  return null;
}

function calculateStudentTotals(rec) {
  const feeKeys = Object.keys(rec).filter(k => {
    return !['id', 'studentName', 'phoneNumber', 'grade', 'academicSession', 'isNewStudent', 'isStopped', 'isStaffChild', 'discount', 'discountPercent',
        'totalFees', 'totalPaid', 'balance', 'paymentStatus', 'createdAt', 'updatedAt', 'rowNum', 'sheetName', 'headers']
        .includes(k) && !k.startsWith('inst') && parseFloat(rec[k]) > 0;
  });
  let totalFees = 0, totalPaid = 0;
  feeKeys.forEach(k => { totalFees += parseFloat(rec[k]) || 0; });
  for (let i = 1; i <= 10; i++) {
    totalPaid += parseFloat(rec['inst' + i]) || 0;
  }
  if (parseFloat(rec.totalFees) > 0) totalFees = parseFloat(rec.totalFees);
  if (parseFloat(rec.totalPaid) >= 0) totalPaid = parseFloat(rec.totalPaid);
  const balance = Math.max(0, totalFees - totalPaid);
  return { totalFees: totalFees, totalPaid: totalPaid, balance: balance };
}

function recordSingleAutoPayment(studentObj, amount, ref, momo, note) {
  if (amount <= 0) return { success: false, message: 'Amount is 0' };
  
  let instIndex = -1;
  for (let j = 1; j <= 10; j++) {
    const val = parseFloat(studentObj['inst' + j]) || 0;
    if (val === 0) {
      instIndex = j;
      break;
    }
  }

  if (instIndex !== -1) {
    const instKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex) || ('inst' + instIndex);
    const dateKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'inst' + instIndex + 'date') || ('inst' + instIndex + 'Date');
    const modeKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'paymentmode') || 'paymentMode';
    const recByKey = studentObj.headers.find(h => String(h).trim().toLowerCase() === 'recordedby') || 'recordedBy';
    
    studentObj[instKey] = amount;
    const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    studentObj[dateKey] = formattedDate;
    studentObj[modeKey] = 'Mobile Money';
    studentObj[recByKey] = 'Parent Portal (Auto)';
    
    const recordData = {};
    studentObj.headers.forEach(h => {
      recordData[h] = studentObj[h];
    });
    
    const saveRes = saveRecord(recordData);
    if (saveRes.success) {
      return { success: true, message: 'Recorded', record: saveRes.record };
    }
  }
  return { success: false, message: 'No empty slot' };
}

function sanitizeRecordForClient(rec) {
  if (!rec) return rec;
  const clean = {};
  Object.keys(rec).forEach(h => {
    const val = rec[h];
    if (val === null || val === undefined || val === '') {
      clean[h] = '';
    } else if (val instanceof Date) {
      clean[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (typeof val === 'boolean') {
      clean[h] = val;
    } else if (typeof val === 'number') {
      const strFields = ['phoneNumber','studentName','id','grade','academicSession','paymentStatus'];
      clean[h] = strFields.includes(h) ? String(val) : val;
    } else {
      clean[h] = String(val);
    }
  });
  return clean;
}

function saveIdPrefixBackend(newPrefix) {
  try {
    const settingsSheet = getOrCreateSheet(SETTINGS_SHEET, ["key","value"]);
    const settingsData = settingsSheet.getDataRange().getValues();
    let oldPrefix = "";
    for (let i = 1; i < settingsData.length; i++) {
      if (settingsData[i][0] === 'idPrefix') {
        oldPrefix = String(settingsData[i][1]).trim();
        break;
      }
    }
    
    // Save new prefix in Settings
    saveSettings({ idPrefix: newPrefix });
    
    if (oldPrefix && oldPrefix !== newPrefix) {
      // Perform massive replacement of prefixes across all sheets!
      updateStudentPrefixesInSheets(oldPrefix, newPrefix);
    }
    return { success: true, message: "Prefix updated successfully across all student records!" };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function updateStudentPrefixesInSheets(oldPrefix, newPrefix) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // List of sheets and the 0-based column indices that contain student IDs
  const targets = [
    { name: "Regular", cols: [0] }, // Column A is id
    { name: "Custom", cols: [0] },  // Column A is studentId
    { name: "Uniforms", cols: [1] }, // Column B is studentId
    { name: "Books", cols: [1] }     // Column B is studentId
  ];
  
  // Match any letters/numbers prefix and capture trailing digits
  const idRegex = /^(.+?)(\d+)$/;
  
  targets.forEach(target => {
    const sheet = ss.getSheetByName(target.name);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
        const values = range.getValues();
        
        for (let r = 0; r < values.length; r++) {
          target.cols.forEach(c => {
            const val = String(values[r][c]).trim();
            const match = val.match(idRegex);
            if (match) {
              const numericPart = match[2];
              const newId = newPrefix + numericPart;
              sheet.getRange(r + 2, c + 1).setValue(newId);
            }
          });
        }
      }
    }
  });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

// ════════════════════════════════════════════════════════
// DAILY AUTOMATED ACCOUNTING REPORT EMAIL
// ════════════════════════════════════════════════════════
function setupDailyAccountingTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyAccountingReport') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Create daily trigger at 4 PM (16:00) — school closing time
  ScriptApp.newTrigger('sendDailyAccountingReport')
    .timeBased()
    .everyDays(1)
    .atHour(16)
    .create();
}

// Lets admin/collector trigger the daily owner report on demand instead of waiting for 4 PM
function sendDailyReportNow() {
  return sendDailyAccountingReport();
}

function sendDailyAccountingReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = Session.getScriptTimeZone();
    const today = new Date();
    const todayStr = Utilities.formatDate(today, tz, 'yyyy-MM-dd');
    
    // Load Settings
    const settings = {};
    const setSheet = ss.getSheetByName('Settings');
    if (setSheet) {
      const sData = setSheet.getDataRange().getValues();
      for (let i = 1; i < sData.length; i++) {
        if (sData[i][0]) settings[sData[i][0]] = sData[i][1];
      }
    }
    
    const currency = settings.currency || 'GHC';
    const primaryColor = settings.themeColor || '#4f46e5';
    const logoUrl = settings.schoolLogo || '';
    const schoolName = settings.schoolName || 'Our School';
    
    // Compile email recipients — NOTE: do not early-return here just because
    // this is empty. The report can still go out by SMS alone (reportPhone,
    // checked further down); bailing out here with a bare `return` used to
    // (a) skip a school's SMS-only report setup entirely and (b) hand the
    // client an `undefined` result instead of the {success:false, message}
    // object it expects, which threw inside the success handler and made
    // "Send Report Now" look broken/stuck. The real "nothing configured"
    // check already exists below, after SMS is attempted too.
    let recipients = settings.reportEmails || settings.schoolEmail || '';

    let regSum = 0, customSum = 0, uniSum = 0, bookSum = 0, incSum = 0, expSum = 0;
    const transactions = [];
    
    // 1. Regular school fees collections
    const terms = ['First Term','Second Term','Third Term'];
    terms.forEach(term => {
      const tSheet = ss.getSheetByName(SHEET_PREFIX + ' - ' + term);
      if (!tSheet || tSheet.getLastRow() < 2) return;
      const data = tSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const studentName = String(row[hdrs.indexOf('studentName')] || '');
        const grade = String(row[hdrs.indexOf('grade')] || '');

        for (let j = 1; j <= 10; j++) {
          const amtIdx = hdrs.indexOf('inst' + j);
          const dateIdx = hdrs.indexOf('inst' + j + 'Date');
          const modeIdx = hdrs.indexOf('inst' + j + 'Mode');

          if (amtIdx !== -1 && dateIdx !== -1) {
            const amt = parseFloat(row[amtIdx]) || 0;
            const dVal = String(row[dateIdx] || '').trim();
            const mode = modeIdx !== -1 ? String(row[modeIdx] || 'Cash') : 'Cash';
            if (amt > 0 && dVal === todayStr) {
              regSum += amt;
              transactions.push({
                name: studentName,
                grade: grade,
                item: 'School Fees (Inst ' + j + ')',
                amount: amt,
                mode: mode
              });
            }
          }
        }
      }
    });
    
    // 2. Custom fees collections
    const customSheet = ss.getSheetByName(CUSTOM_FEE_RECORDS_SHEET);
    if (customSheet && customSheet.getLastRow() > 1) {
      const data = customSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const studentName = String(row[hdrs.indexOf('studentName')] || '');
        const grade = String(row[hdrs.indexOf('grade')] || '');
        const feeTypeName = String(row[hdrs.indexOf('feeTypeName')] || 'Custom Fee');
        
        for (let j = 1; j <= 6; j++) {
          const amtIdx = hdrs.indexOf('inst' + j);
          const dateIdx = hdrs.indexOf('inst' + j + 'Date');
          const modeIdx = hdrs.indexOf('inst' + j + 'Mode');
          if (amtIdx !== -1 && dateIdx !== -1) {
            const amt = parseFloat(row[amtIdx]) || 0;
            const dVal = String(row[dateIdx] || '').trim();
            const mode = modeIdx !== -1 ? String(row[modeIdx] || 'Cash') : 'Cash';
            if (amt > 0 && dVal === todayStr) {
              customSum += amt;
              transactions.push({
                name: studentName,
                grade: grade,
                item: feeTypeName + ' (Inst ' + j + ')',
                amount: amt,
                mode: mode
              });
            }
          }
        }
      }
    }
    
    // 3. Uniform sales
    const uniSheet = ss.getSheetByName('Uniforms');
    if (uniSheet && uniSheet.getLastRow() > 1) {
      const data = uniSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const studentName = String(row[hdrs.indexOf('studentName')] || '');
        const grade = String(row[hdrs.indexOf('grade')] || '');
        const dVal = String(row[hdrs.indexOf('date')] || '').trim();
        const amt = parseFloat(row[hdrs.indexOf('amountPaid')]) || 0;
        if (amt > 0 && dVal.startsWith(todayStr)) {
          uniSum += amt;
          transactions.push({
            name: studentName,
            grade: grade,
            item: 'Uniform Purchase',
            amount: amt,
            mode: 'Cash/MoMo'
          });
        }
      }
    }
    
    // 4. Book sales
    const bookSheet = ss.getSheetByName('Books');
    if (bookSheet && bookSheet.getLastRow() > 1) {
      const data = bookSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const studentName = String(row[hdrs.indexOf('studentName')] || '');
        const grade = String(row[hdrs.indexOf('grade')] || '');
        const dVal = String(row[hdrs.indexOf('date')] || '').trim();
        const amt = parseFloat(row[hdrs.indexOf('amountPaid')]) || 0;
        if (amt > 0 && dVal.startsWith(todayStr)) {
          bookSum += amt;
          transactions.push({
            name: studentName,
            grade: grade,
            item: 'Book Purchase',
            amount: amt,
            mode: 'Cash/MoMo'
          });
        }
      }
    }
    
    // 5. Income & Expenses
    const ieSheet = ss.getSheetByName('Income & Expenses');
    if (ieSheet && ieSheet.getLastRow() > 1) {
      const data = ieSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const dVal = String(row[1] || '').trim();
        const type = String(row[2] || '').trim();
        const category = String(row[3] || '');
        const desc = String(row[4] || '');
        const amt = parseFloat(row[5]) || 0;
        if (amt > 0 && dVal === todayStr) {
          if (type === 'Income') {
            incSum += amt;
            transactions.push({
              name: 'Misc Operations',
              grade: 'N/A',
              item: 'Income: ' + category + ' (' + desc + ')',
              amount: amt,
              mode: 'Operations'
            });
          } else {
            expSum += amt;
          }
        }
      }
    }
    
    // 6. New admissions today (across all term sheets)
    const newAdmissions = [];
    const activeYr = settings.academicYear || '';
    const activeTerm = settings.activeTerm || 'First Term';
    terms.forEach(term => {
      const tSheet = ss.getSheetByName(SHEET_PREFIX + ' - ' + term);
      if (!tSheet || tSheet.getLastRow() < 2) return;
      const data = tSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      const nameIdx = hdrs.indexOf('studentName');
      const gradeIdx = hdrs.indexOf('grade');
      const newIdx = hdrs.indexOf('isNewStudent');
      const createdIdx = hdrs.indexOf('createdAt');
      if (nameIdx === -1 || newIdx === -1 || createdIdx === -1) return;
      for (let i = 1; i < data.length; i++) {
        const isNew = String(data[i][newIdx]).toUpperCase() === 'TRUE' || data[i][newIdx] === true;
        const created = String(data[i][createdIdx] || '');
        if (isNew && created.startsWith(todayStr)) {
          newAdmissions.push({ name: String(data[i][nameIdx] || ''), grade: String(data[i][gradeIdx] || '') });
        }
      }
    });

    // 7. Total outstanding by fee type (current active term/session — the up-to-date "who still owes" picture)
    const activeSession = (activeYr ? activeYr + ' ' : '') + activeTerm;
    let regOutstanding = 0;
    const classOwing = {}; // grade -> total outstanding (regular + extra)
    const activeTermSheet = ss.getSheetByName(SHEET_PREFIX + ' - ' + activeTerm);
    if (activeTermSheet && activeTermSheet.getLastRow() > 1) {
      const data = activeTermSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      const sessIdx = hdrs.indexOf('academicSession');
      const balIdx = hdrs.indexOf('balance');
      const gradeIdx = hdrs.indexOf('grade');
      if (balIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          const sess = sessIdx !== -1 ? String(data[i][sessIdx] || '') : '';
          if (activeYr && sessIdx !== -1 && !sess.startsWith(activeYr)) continue;
          const bal = Math.max(0, parseFloat(data[i][balIdx]) || 0);
          if (bal > 0) {
            regOutstanding += bal;
            const grade = gradeIdx !== -1 ? String(data[i][gradeIdx] || 'Unassigned') : 'Unassigned';
            classOwing[grade] = (classOwing[grade] || 0) + bal;
          }
        }
      }
    }

    const extraOutstandingByType = {}; // feeTypeName -> total outstanding
    if (customSheet && customSheet.getLastRow() > 1) {
      const data = customSheet.getDataRange().getValues();
      const hdrs = data[0].map(h => String(h).trim());
      const sessIdx = hdrs.indexOf('academicSession');
      const balIdx = hdrs.indexOf('balance');
      const feeNameIdx = hdrs.indexOf('feeTypeName');
      const gradeIdx = hdrs.indexOf('grade');
      if (balIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          const sess = sessIdx !== -1 ? String(data[i][sessIdx] || '') : '';
          if (activeYr && sessIdx !== -1 && !sess.startsWith(activeYr)) continue;
          const bal = Math.max(0, parseFloat(data[i][balIdx]) || 0);
          if (bal > 0) {
            const feeName = feeNameIdx !== -1 ? String(data[i][feeNameIdx] || 'Extra Fee') : 'Extra Fee';
            extraOutstandingByType[feeName] = (extraOutstandingByType[feeName] || 0) + bal;
            const grade = gradeIdx !== -1 ? String(data[i][gradeIdx] || 'Unassigned') : 'Unassigned';
            classOwing[grade] = (classOwing[grade] || 0) + bal;
          }
        }
      }
    }
    const totalExtraOutstanding = Object.keys(extraOutstandingByType).reduce((sum, k) => sum + extraOutstandingByType[k], 0);
    const classOwingList = Object.keys(classOwing).map(g => ({ grade: g, amount: classOwing[g] })).sort((a, b) => b.amount - a.amount);

    // Calculations
    const totalCollected = regSum + customSum + uniSum + bookSum + incSum;
    const netRevenue = totalCollected - expSum;

    // Format HTML Email with School Logo and Themed Colors
    let emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 30px 15px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          
          <!-- Colored Brand Header -->
          <div style="background: linear-gradient(135deg, ${primaryColor}, #3b82f6); padding: 25px; text-align: center; color: #ffffff; position: relative;">
            ${logoUrl ? '<img src="' + logoUrl + '" style="max-height: 70px; border-radius: 10px; margin-bottom: 12px; background: #fff; padding: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">' : ''}
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Daily Accounting Summary</h2>
            <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">${schoolName} &bull; ${today.toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
          </div>
          
          <div style="padding: 25px;">
            <p style="margin-top: 0; font-size: 14px; color: #64748b; line-height: 1.5;">Here is your automated daily financial report summarizing all payments, custom collections, inventory sales, and operations recorded today.</p>
            
            <!-- Revenue Blocks Grid -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="width: 50%; padding-right: 8px;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; border-radius: 10px; padding: 15px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Total Collected</div>
                    <div style="font-size: 18px; font-weight: 800; color: #10b981;">${currency} ${totalCollected.toFixed(2)}</div>
                  </div>
                </td>
                <td style="width: 50%; padding-left: 8px;">
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ef4444; border-radius: 10px; padding: 15px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px;">Total Expenses</div>
                    <div style="font-size: 18px; font-weight: 800; color: #ef4444;">${currency} ${expSum.toFixed(2)}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 12px;">
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 15px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700; margin-bottom: 4px;">Net Revenue</div>
                    <div style="font-size: 22px; font-weight: 800; color: #15803d;">${currency} ${netRevenue.toFixed(2)}</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Category Breakdown Table -->
            <h4 style="color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Collections by Category</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #475569;">
                <td style="padding: 8px 0;">Category Type</td>
                <td style="padding: 8px 0; text-align: right;">Amount (${currency})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Regular School Fees</td>
                <td style="padding: 8px 0; text-align: right;">${regSum.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Custom Fees</td>
                <td style="padding: 8px 0; text-align: right;">${customSum.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Uniforms Revenue</td>
                <td style="padding: 8px 0; text-align: right;">${uniSum.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Books Revenue</td>
                <td style="padding: 8px 0; text-align: right;">${bookSum.toFixed(2)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Other Income (Mics)</td>
                <td style="padding: 8px 0; text-align: right;">${incSum.toFixed(2)}</td>
              </tr>
            </table>

            <!-- New Admissions Today -->
            <h4 style="color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">New Students Admitted Today</h4>
            <div style="margin-bottom: 25px;">
              ${newAdmissions.length === 0 ? '<div style="text-align:center; padding:10px; color:#94a3b8; font-size:13px;">No new admissions today.</div>' : `
              <div style="font-size:13px;">${newAdmissions.map(a => `<div style="padding:6px 0; border-bottom:1px solid #f1f5f9;"><strong>${a.name}</strong> <span style="color:#64748b;">(${a.grade})</span></div>`).join('')}</div>
              `}
            </div>

            <!-- Total Outstanding by Fee Type -->
            <h4 style="color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Money Still Owed, By Fee Type (${activeTerm})</h4>
            <p style="margin: -4px 0 10px; font-size: 12px; color: #94a3b8;">This is what parents still have not paid yet, so far, for the current term.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #cbd5e1; font-weight: 700; color: #475569;">
                <td style="padding: 8px 0;">Fee Type</td>
                <td style="padding: 8px 0; text-align: right;">Amount Still Owed (${currency})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">Regular School Fees</td>
                <td style="padding: 8px 0; text-align: right; color:#dc2626; font-weight:600;">${regOutstanding.toFixed(2)}</td>
              </tr>
              ${Object.keys(extraOutstandingByType).map(name => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0;">${name}</td>
                <td style="padding: 8px 0; text-align: right; color:#dc2626; font-weight:600;">${extraOutstandingByType[name].toFixed(2)}</td>
              </tr>
              `).join('')}
              <tr>
                <td style="padding: 8px 0; font-weight: 800;">Total Still Owed</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 800; color:#dc2626;">${(regOutstanding + totalExtraOutstanding).toFixed(2)}</td>
              </tr>
            </table>

            <!-- Classes Owing -->
            <h4 style="color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Classes With Unpaid Fees</h4>
            <div style="margin-bottom: 25px;">
              ${classOwingList.length === 0 ? '<div style="text-align:center; padding:10px; color:#94a3b8; font-size:13px;">Every class is fully paid up. 🎉</div>' : `
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                ${classOwingList.map(c => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 6px 0;">${c.grade}</td>
                  <td style="padding: 6px 0; text-align: right; color:#dc2626; font-weight:600;">${currency} ${c.amount.toFixed(2)}</td>
                </tr>
                `).join('')}
              </table>
              `}
            </div>

            <!-- Individual Transactions Logs -->
            <h4 style="color: ${primaryColor}; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Today's Transaction Log</h4>
            <div style="overflow-x: auto;">
              ${transactions.length === 0 ? '<div style="text-align:center; padding:15px; color:#94a3b8; font-size:13px;">No transactions recorded today.</div>' : `
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700; text-align: left;">
                    <th style="padding: 8px;">Name</th>
                    <th style="padding: 8px;">Grade</th>
                    <th style="padding: 8px;">Paid For</th>
                    <th style="padding: 8px;">Mode</th>
                    <th style="padding: 8px; text-align: right;">Amt (${currency})</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(t => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px; font-weight: 600;">${t.name}</td>
                      <td style="padding: 8px; color: #64748b;">${t.grade}</td>
                      <td style="padding: 8px;">${t.item}</td>
                      <td style="padding: 8px; color: #64748b;">${t.mode}</td>
                      <td style="padding: 8px; text-align: right; font-weight: 600;">${t.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              `}
            </div>
            
          </div>
          
          <!-- Bottom Brand Footer -->
          <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
            This email is auto-generated by your School Fees Management System. Please do not reply directly to this mail.
          </div>
        </div>
      </div>
    `;
    
    let emailSent = false, smsSent = false, smsError = '';
    if (recipients) {
      MailApp.sendEmail({
        to: recipients,
        subject: "📊 Daily Accounting Report: " + schoolName + " [" + todayStr + "]",
        htmlBody: emailHtml
      });
      emailSent = true;
      Logger.log("Daily accounting report sent successfully to: " + recipients);
    }

    // Plain-text SMS version — kept short and simple for a non-technical reader
    const reportPhone = settings.reportPhone || '';
    if (reportPhone) {
      const smsMsg = schoolName + ' Daily Report (' + todayStr + '):\n' +
        'Collected today: ' + currency + ' ' + totalCollected.toFixed(2) + '\n' +
        'Expenses today: ' + currency + ' ' + expSum.toFixed(2) + '\n' +
        'Net today: ' + currency + ' ' + netRevenue.toFixed(2) + '\n' +
        'New admissions today: ' + newAdmissions.length + '\n' +
        'Total still owed (all fees): ' + currency + ' ' + (regOutstanding + totalExtraOutstanding).toFixed(2) + '\n' +
        'Classes owing: ' + (classOwingList.length ? classOwingList.map(c => c.grade).join(', ') : 'None — all paid up');

      const apiKey = settings.arkeselApiKey || '';
      const sender = settings.arkeselSender || schoolName;
      if (apiKey) {
        try {
          const cleanPhone = String(reportPhone).replace(/\D/g, '');
          const url = 'https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + encodeURIComponent(apiKey) +
                      '&to=' + encodeURIComponent(cleanPhone) +
                      '&from=' + encodeURIComponent(sender.substring(0, 11)) +
                      '&sms=' + encodeURIComponent(smsMsg);
          const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
          const parsed = JSON.parse(resp.getContentText());
          smsSent = !!(parsed && (parsed.status === 'success' || parsed.code === 'ok'));
          if (!smsSent) smsError = 'SMS provider did not confirm delivery';
        } catch(smsErr) {
          smsError = smsErr.message;
        }
      } else {
        smsError = 'No SMS API key configured';
      }
    }

    if (!recipients && !reportPhone) {
      return { success: false, message: 'No Proprietor Report Email or Report Phone Number configured in Settings.' };
    }
    return { success: true, emailSent: emailSent, smsSent: smsSent, smsError: smsError };
  } catch(e) {
    Logger.log("Error sending daily accounting report: " + e.toString());
    return { success: false, message: e.message };
  }
}

// Query uniforms and books sales for a given student
function getStudentUniformsAndBooks(studentId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let uniforms = [];
  let books = [];
  
  try {
    const uniSheet = ss.getSheetByName('Uniforms');
    if (uniSheet && uniSheet.getLastRow() > 1) {
      const data = uniSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const stuIdIdx = headers.indexOf('studentId');
      const balIdx = headers.indexOf('balance');
      const tpIdx = headers.indexOf('totalPrice');
      const apIdx = headers.indexOf('amountPaid');
      const typesIdx = headers.indexOf('uniformTypes');
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][stuIdIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
          uniforms.push({
            uniformTypes: String(data[i][typesIdx] || ''),
            totalPrice: parseFloat(data[i][tpIdx]) || 0,
            amountPaid: parseFloat(data[i][apIdx]) || 0,
            balance: parseFloat(data[i][balIdx]) || 0
          });
        }
      }
    }
  } catch(e) {
    Logger.log("getStudentUniformsAndBooks uniforms query error: " + e.message);
  }
  
  try {
    const bookSheet = ss.getSheetByName('Books');
    if (bookSheet && bookSheet.getLastRow() > 1) {
      const data = bookSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const stuIdIdx = headers.indexOf('studentId');
      const balIdx = headers.indexOf('balance');
      const tpIdx = headers.indexOf('totalPrice');
      const apIdx = headers.indexOf('amountPaid');
      const booksIdx = headers.indexOf('books');
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][stuIdIdx]).trim().toLowerCase() === String(studentId).trim().toLowerCase()) {
          books.push({
            books: String(data[i][booksIdx] || ''),
            totalPrice: parseFloat(data[i][tpIdx]) || 0,
            amountPaid: parseFloat(data[i][apIdx]) || 0,
            balance: parseFloat(data[i][balIdx]) || 0
          });
        }
      }
    }
  } catch(e) {
    Logger.log("getStudentUniformsAndBooks books query error: " + e.message);
  }
  
  return { uniforms: uniforms, books: books };
}


// Creates a public folder for Student Photos inside Google Drive and registers folder ID in settings
//
// NOTE: DriveApp.createFolder() requires the broad Drive scope
// (https://www.googleapis.com/auth/drive). If this throws
// "Specified permissions are not sufficient to call DriveApp.createFolder",
// the project's appsscript.json manifest is pinning a narrower explicit
// oauthScopes list that doesn't include it. Fix: Apps Script editor →
// Project Settings → check "Show appsscript.json manifest file in editor"
// → open appsscript.json → add "https://www.googleapis.com/auth/drive" to
// the oauthScopes array (or remove the oauthScopes array entirely to let
// Apps Script auto-detect scopes from the code) → save → re-run this
// function once from the editor to trigger the new consent screen.
function createStudentPhotosFolder() {
  try {
    const folderName = "School Fees Student Profile Photos";
    const folder = DriveApp.createFolder(folderName);
    
    // Set permissions so photos are publicly viewable by anyone with link
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const folderId = folder.getId();
    
    // Save folder ID in Settings sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(SETTINGS_SHEET, ["key","value"]);
    const data  = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "studentPhotosFolderId") {
        sheet.getRange(i+1, 2).setValue(folderId);
        found = true; break;
      }
    }
    if (!found) sheet.appendRow(["studentPhotosFolderId", folderId]);
    
    return { success: true, folderId: folderId };
  } catch(e) {
    Logger.log("createStudentPhotosFolder error: " + e.message);
    return { success: false, message: describeDriveAuthError(e.message) };
  }
}

// Turns the two Drive-related failures admins actually hit into a message
// that tells them exactly what to fix, instead of Apps Script's raw (and
// fairly cryptic) exception text.
function describeDriveAuthError(rawMessage) {
  var msg = String(rawMessage || '');
  if (/not sufficient|insufficient permission/i.test(msg)) {
    return 'Google Drive access is blocked by this project\'s permission scopes. Fix: in the Apps Script editor, open Project Settings, tick "Show appsscript.json manifest file in editor", open appsscript.json, and either add "https://www.googleapis.com/auth/drive" to the oauthScopes array or delete the oauthScopes array entirely (Apps Script will then auto-detect the scopes the code actually needs). Save, then re-run this from Settings once more so Google shows the new consent screen. (' + msg + ')';
  }
  if (/authorization is required|authorization required/i.test(msg)) {
    return 'This deployment needs a one-time Google authorization for Drive access. Fix: in the Apps Script editor, open this project, run any function once from the editor toolbar (e.g. createStudentPhotosFolder) and approve the Google consent screen when it appears — then re-deploy (Deploy → Manage deployments → Edit → New version) so the live web app picks up the granted permission. (' + msg + ')';
  }
  return msg;
}

// Deletes the daily accounting time-based report trigger if disabled by admin
function deleteDailyAccountingTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendDailyAccountingReport') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

// ════════════════════════════════════════════════════════
// AUTOMATIC OUTSTANDING BALANCE SMS
// Daily, admin-scheduled: texts every parent with an outstanding balance
// (regular term fees and/or extra/custom fees) one message that breaks their
// wards down into "Partially Paid" and "Unpaid" groups. Toggled on/off and
// timed from Settings — see enableAutoOutstandingSms / autoOutstandingSmsTime.
// ════════════════════════════════════════════════════════
function setupAutoOutstandingSmsTrigger(timeStr) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendAutoOutstandingBalanceSms') {
      ScriptApp.deleteTrigger(t);
    }
  });

  const parts  = String(timeStr || '08:00').split(':');
  let   hour   = parseInt(parts[0], 10);
  let   minute = parseInt(parts[1], 10);
  if (isNaN(hour)   || hour   < 0 || hour   > 23) hour   = 8;
  if (isNaN(minute) || minute < 0 || minute > 59) minute = 0;

  ScriptApp.newTrigger('sendAutoOutstandingBalanceSms')
    .timeBased()
    .everyDays(1)
    .atHour(hour)
    .nearMinute(minute)
    .create();
}

function deleteAutoOutstandingSmsTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'sendAutoOutstandingBalanceSms') {
      ScriptApp.deleteTrigger(t);
    }
  });
}

// Lets the admin run the outstanding-balance SMS batch on demand (e.g. a "Send Now"
// test button in Settings) instead of waiting for the scheduled time.
function sendOutstandingSmsNow() {
  return sendAutoOutstandingBalanceSms();
}

// Builds one SMS per parent phone number breaking their outstanding balance down
// into "Partially Paid" and "Unpaid" wards (covering both regular term fees and
// extra/custom fees), then sends it via whichever SMS provider is configured in
// Settings. Runs server-side so it works from a time-driven trigger with no browser.
function sendAutoOutstandingBalanceSms() {
  const result = { success: true, sent: 0, failed: 0, recipients: 0, errors: [] };
  try {
    const s        = getSettings();
    const settings = s.success ? s.settings : {};
    const currency   = settings.currency   || 'GHC';
    const schoolName = settings.schoolName || 'School';

    // Regular term-fee balances (all terms)
    const regular = getData();

    // Extra/custom fee balances
    const customRes = getCustomStudentFees('all');
    const custom     = (customRes.success ? customRes.history : []) || [];

    // Map studentId -> phone from regular records, for custom fee rows that don't carry one
    const phoneByStudentId = {};
    regular.forEach(r => { if (r.id && r.phoneNumber) phoneByStudentId[r.id] = r.phoneNumber; });

    // Group every outstanding line by parent phone number -> ward
    const byPhone = {}; // cleanPhone -> { phone, wards: { studentId: {name, grade, regular:[], extra:[]} } }

    const ensureWard = function(phoneClean, phoneRaw, studentId, name, grade) {
      if (!byPhone[phoneClean]) byPhone[phoneClean] = { phone: phoneRaw, wards: {} };
      if (!byPhone[phoneClean].wards[studentId]) {
        byPhone[phoneClean].wards[studentId] = { name: name || 'Ward', grade: grade || '', regular: [], extra: [] };
      }
      return byPhone[phoneClean].wards[studentId];
    };

    regular.forEach(r => {
      const bal = parseFloat(r.balance) || 0;
      if (bal <= 0) return;
      const phoneClean = String(r.phoneNumber || '').replace(/\D/g, '');
      if (phoneClean.length < 9) return;
      const ward = ensureWard(phoneClean, r.phoneNumber, r.id, r.studentName, r.grade);
      ward.regular.push({
        session:   r.academicSession || '',
        totalPaid: parseFloat(r.totalPaid) || 0,
        balance:   bal
      });
    });

    custom.forEach(cf => {
      const bal = parseFloat(cf.balance) || 0;
      if (bal <= 0) return;
      const phoneRaw   = phoneByStudentId[cf.studentId] || cf.phoneNumber || '';
      const phoneClean = String(phoneRaw).replace(/\D/g, '');
      if (phoneClean.length < 9) return;
      const ward = ensureWard(phoneClean, phoneRaw, cf.studentId, cf.studentName, cf.grade);
      ward.extra.push({
        feeTypeName: cf.feeTypeName || 'Extra Fee',
        totalPaid:   parseFloat(cf.totalPaid) || 0,
        balance:     bal
      });
    });

    const phones = Object.keys(byPhone);
    result.recipients = phones.length;
    if (!phones.length) {
      Logger.log('sendAutoOutstandingBalanceSms: no outstanding balances to notify.');
      return result;
    }

    const wardLine = function(w) {
      const parts = [];
      w.regular.forEach(x => parts.push((x.session ? x.session + ' ' : '') + 'Fees Bal: ' + currency + ' ' + x.balance.toFixed(2)));
      w.extra.forEach(x   => parts.push(x.feeTypeName + ' Bal: ' + currency + ' ' + x.balance.toFixed(2)));
      return '- ' + w.name + (w.grade ? ' (' + w.grade + ')' : '') + ': ' + parts.join(', ');
    };

    const historyLogs = [];
    phones.forEach(phoneClean => {
      const entry = byPhone[phoneClean];
      const wards = Object.keys(entry.wards).map(k => entry.wards[k]);

      const partial = [], unpaid = [];
      wards.forEach(w => {
        const anyPaid = w.regular.some(x => x.totalPaid > 0) || w.extra.some(x => x.totalPaid > 0);
        (anyPaid ? partial : unpaid).push(w);
      });

      let total = 0;
      wards.forEach(w => {
        w.regular.forEach(x => total += x.balance);
        w.extra.forEach(x   => total += x.balance);
      });

      const lines = ['Dear Parent, ' + schoolName + ' outstanding balance notice:'];
      if (partial.length) { lines.push('PARTIALLY PAID:'); partial.forEach(w => lines.push(wardLine(w))); }
      if (unpaid.length)  { lines.push('UNPAID:');         unpaid.forEach(w  => lines.push(wardLine(w))); }
      lines.push('Total Outstanding: ' + currency + ' ' + total.toFixed(2) + '. Kindly settle at your earliest convenience. Thank you.');
      const message = lines.join('\n');

      const sendRes = sendServerSms(settings, entry.phone, message);

      historyLogs.push({
        timestamp: new Date().toISOString(),
        recipient: wards.map(w => w.name).join(', '),
        phone:     entry.phone,
        message:   message,
        status:    sendRes.success ? 'Sent' : ('Failed: ' + (sendRes.error || '')),
        type:      'Auto Outstanding Balance'
      });

      if (sendRes.success) result.sent++;
      else { result.failed++; result.errors.push(entry.phone + ': ' + (sendRes.error || 'unknown error')); }
    });

    try { logSmsHistory(historyLogs); } catch(e) { Logger.log('logSmsHistory error: ' + e.message); }
    try {
      logSmsActivity({
        sent: result.sent, failed: result.failed, total: phones.length,
        filters: 'Automatic Outstanding Balance SMS',
        sampleMessage: historyLogs.length ? historyLogs[0].message : ''
      });
    } catch(e) {}

    Logger.log('sendAutoOutstandingBalanceSms: sent=' + result.sent + ' failed=' + result.failed + ' of ' + phones.length);
    return result;
  } catch(e) {
    Logger.log('sendAutoOutstandingBalanceSms error: ' + e.message);
    return { success: false, message: e.message };
  }
}

// Server-side SMS dispatch — mirrors the browser's multi-provider sender (used for
// manual/bulk SMS) but via UrlFetchApp, for use from a time-driven trigger where
// no browser is present to make the request.
function sendServerSms(settings, phone, message) {
  try {
    const provider = settings.smsProvider || 'arkesel';
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.indexOf('0') === 0) cleanPhone = '233' + cleanPhone.substring(1);
    if (cleanPhone.indexOf('233') !== 0) cleanPhone = '233' + cleanPhone;

    if (provider === 'arkesel') {
      const apiKey = settings.arkeselApiKey || '';
      const sender = (settings.arkeselSender || settings.schoolName || 'School').substring(0, 11);
      if (!apiKey) return { success: false, error: 'Arkesel API key not configured' };
      const url = 'https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + encodeURIComponent(apiKey) +
                  '&to=' + encodeURIComponent(cleanPhone) +
                  '&from=' + encodeURIComponent(sender) +
                  '&sms=' + encodeURIComponent(message);
      const resp   = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const parsed = JSON.parse(resp.getContentText());
      return { success: !!(parsed && (parsed.status === 'success' || parsed.code === 'ok')), data: parsed };
    }

    if (provider === 'hubtel') {
      const key    = settings.hubtelApiKey || '';
      const secret = settings.hubtelSecret || '';
      const from   = settings.hubtelFrom   || 'School';
      if (!key || !secret) return { success: false, error: 'Hubtel credentials not configured' };
      const resp = UrlFetchApp.fetch('https://api.hubtel.com/v1/messages/send', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'Basic ' + Utilities.base64Encode(key + ':' + secret) },
        payload: JSON.stringify({ From: from, To: cleanPhone, Content: message }),
        muteHttpExceptions: true
      });
      const d = JSON.parse(resp.getContentText());
      return { success: (d.Status === '0' || d.status === 'Success'), data: d };
    }

    if (provider === 'infobip') {
      const apiKey  = settings.infobipApiKey  || '';
      const baseUrl = settings.infobipBaseUrl || '';
      const sender  = settings.infobipSender  || 'School';
      if (!apiKey || !baseUrl) return { success: false, error: 'Infobip credentials not configured' };
      const resp = UrlFetchApp.fetch('https://' + baseUrl + '.api.infobip.com/sms/2/text/advanced', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'Authorization': 'App ' + apiKey },
        payload: JSON.stringify({ messages: [{ from: sender, destinations: [{ to: cleanPhone }], text: message }] }),
        muteHttpExceptions: true
      });
      const d = JSON.parse(resp.getContentText());
      return { success: !!d.messages, data: d };
    }

    if (provider === 'termii') {
      const tKey  = settings.termiiApiKey || '';
      const tFrom = settings.termiiSender || 'School';
      if (!tKey) return { success: false, error: 'Termii API key not configured' };
      const resp = UrlFetchApp.fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ to: cleanPhone, from: tFrom, sms: message, type: 'plain', channel: 'generic', api_key: tKey }),
        muteHttpExceptions: true
      });
      const d = JSON.parse(resp.getContentText());
      return { success: !!(d.message_id || d.message === 'Successfully Sent'), data: d };
    }

    if (provider === 'custom') {
      const curl = settings.customSmsUrl || '';
      if (!curl) return { success: false, error: 'Custom SMS URL not configured' };
      const method  = (settings.customSmsMethod || 'POST').toLowerCase();
      let   headers = {};
      try { headers = JSON.parse(settings.customSmsHeaders || '{}'); } catch(e) {}
      const bodyTpl = settings.customSmsBody || '{"to":"{phone}","message":"{message}"}';
      const body    = bodyTpl.replace('{phone}', cleanPhone).replace('{message}', message.replace(/"/g, '\\"'));
      const options = { method: method, headers: headers, muteHttpExceptions: true };
      if (method !== 'get') { options.contentType = 'application/json'; options.payload = body; }
      const resp = UrlFetchApp.fetch(curl, options);
      return { success: resp.getResponseCode() < 400, data: resp.getContentText() };
    }

    return { success: false, error: 'Unknown SMS provider: ' + provider };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// Uploads student photo image file to Google Drive and returns a viewable direct source URL
function uploadStudentPhoto(studentId, base64Data, fileName) {
  try {
    const s = getSettings();
    const settings = s.success ? s.settings : {};
    let folderId = settings.studentPhotosFolderId || "";

    // No folder configured yet — create one automatically instead of making
    // the admin do it manually first.
    if (!folderId) {
      const created = createStudentPhotosFolder();
      if (!created.success) {
        return { success: false, message: "Could not create the student photos folder automatically: " + created.message };
      }
      folderId = created.folderId;
    }

    const folder = DriveApp.getFolderById(folderId);
    
    // Clean up any old image records for this student
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith(studentId + "_") || file.getName() === studentId) {
        file.setTrashed(true);
      }
    }
    
    // Decode base64 upload and write to file
    const decoded = Utilities.base64Decode(base64Data);
    let extension = "jpg";
    if (fileName.indexOf(".") !== -1) {
      extension = fileName.split(".").pop();
    }
    const blob = Utilities.newBlob(decoded, "image/" + extension, studentId + "_" + Date.now() + "." + extension);
    const newFile = folder.createFile(blob);
    
    // Set view permissions
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Construct web view link
    const viewUrl = "https://lh3.googleusercontent.com/d/" + newFile.getId();
    return { success: true, url: viewUrl, fileId: newFile.getId() };
  } catch(e) {
    Logger.log("uploadStudentPhoto error: " + e.message);
    return { success: false, message: e.message };
  }
}

// Automatically verifies and appends a "studentPhoto" header column to all active term sheets
function ensureStudentPhotoColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const terms = ["First Term","Second Term","Third Term"];
  for (const term of terms) {
    const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
    if (!sheet) continue;
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) continue;
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || '').trim());
    if (headers.indexOf("studentPhoto") === -1) {
      sheet.insertColumnAfter(lastCol);
      sheet.getRange(1, lastCol + 1).setValue("studentPhoto");
    }
  }
}

function reactivateStudentBackend(studentId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const terms = ["First Term", "Second Term", "Third Term"];
    for (const term of terms) {
      const sheet = ss.getSheetByName(SHEET_PREFIX + " - " + term);
      if (!sheet) continue;
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) continue;
      const headers = data[0].map(h => String(h || '').trim());
      const idIdx = headers.indexOf("id");
      const stoppedIdx = headers.indexOf("isStopped");
      if (idIdx === -1 || stoppedIdx === -1) continue;
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(studentId)) {
          sheet.getRange(i + 1, stoppedIdx + 1).setValue(false);
        }
      }
    }
    return { success: true, message: "Student reactivated successfully!" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// INVENTORY / POS (POINT OF SALE) / STOCK TRANSACTIONS / VENDORS
// Lets the school sell uniforms, books, stationery, and other
// items to students or walk-in customers, tracks stock levels,
// and feeds the daily/weekly/monthly/termly sales reports.
// ════════════════════════════════════════════════════════
const INVENTORY_SHEET = "Inventory";
const VENDORS_SHEET   = "Vendors";
const STOCK_TXN_SHEET  = "Stock Transactions";

function round2_(n) {
  return Math.round((parseFloat(n) || 0) * 100) / 100;
}

// ── INVENTORY ──
function getOrCreateInventorySheet() {
  const sheet = getOrCreateSheet(INVENTORY_SHEET, [
    "id", "name", "category", "icon", "sku", "unit", "price", "cost",
    "stock", "reorderLevel", "isActive", "notes", "createdAt", "updatedAt"
  ]);
  // Migration: add the "icon" column to a sheet created before it existed.
  try {
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    if (existingHeaders.indexOf('icon') === -1) {
      const lastCol = sheet.getLastColumn();
      sheet.insertColumnAfter(lastCol);
      sheet.getRange(1, lastCol + 1).setValue('icon')
        .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
    }
  } catch (migErr) {
    Logger.log('Inventory sheet icon migration info: ' + migErr.message);
  }
  return sheet;
}

function getInventoryItems() {
  try {
    const sheet = getOrCreateInventorySheet();
    if (sheet.getLastRow() <= 1) return { success: true, items: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const items = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][idx.id]) continue;
      items.push({
        id: data[i][idx.id],
        name: data[i][idx.name] || '',
        category: data[i][idx.category] || 'Other',
        icon: (idx.icon !== undefined ? data[i][idx.icon] : '') || '',
        sku: data[i][idx.sku] || '',
        unit: data[i][idx.unit] || 'pc',
        price: parseFloat(data[i][idx.price]) || 0,
        cost: parseFloat(data[i][idx.cost]) || 0,
        stock: parseFloat(data[i][idx.stock]) || 0,
        reorderLevel: parseFloat(data[i][idx.reorderlevel]) || 0,
        isActive: idx.isactive !== undefined ? (data[i][idx.isactive] === '' || data[i][idx.isactive] === undefined ? true : isBoolTrue(data[i][idx.isactive])) : true,
        notes: data[i][idx.notes] || ''
      });
    }
    items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { success: true, items: items };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function saveInventoryItem(item) {
  try {
    const sheet = getOrCreateInventorySheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const now = new Date().toISOString();

    if (!item.id || String(item.id).trim() === '') {
      item.id = "ITM-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      item.createdAt = now;
    }
    item.updatedAt = now;
    item.isActive = item.isActive === false ? false : true;
    item.price = parseFloat(item.price) || 0;
    item.cost = parseFloat(item.cost) || 0;
    item.stock = parseFloat(item.stock) || 0;
    item.reorderLevel = parseFloat(item.reorderLevel) || 0;

    const normalized = {};
    Object.keys(item).forEach(k => normalized[String(k).trim().toLowerCase()] = item[k]);

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.map(h => h.toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(item.id)) { foundRow = i + 1; break; }
    }

    const rowVal = headers.map(h => {
      const normH = h.toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Inventory Item', item.name);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Added Inventory Item', item.name);
    }
    SpreadsheetApp.flush();
    return { success: true, item: item };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteInventoryItem(id) {
  try {
    const sheet = getOrCreateInventorySheet();
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].map(h => String(h).trim().toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        logActivity('Deleted Inventory Item', id);
        return { success: true };
      }
    }
    return { success: false, message: 'Item not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Internal helper (trailing underscore keeps it off the client-callable
// surface) — adjusts an item's stock by a signed delta.
function adjustInventoryStock_(itemId, delta) {
  if (!itemId || !delta) return null;
  const sheet = getOrCreateInventorySheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  const stockIdx = headers.indexOf('stock');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(itemId)) {
      const newStock = round2_((parseFloat(data[i][stockIdx]) || 0) + delta);
      sheet.getRange(i + 1, stockIdx + 1).setValue(newStock);
      return newStock;
    }
  }
  return null;
}

// ── VENDORS ──
function getOrCreateVendorsSheet() {
  return getOrCreateSheet(VENDORS_SHEET, [
    "id", "name", "contactPerson", "phone", "email", "address", "notes", "createdAt"
  ]);
}

function getVendors() {
  try {
    const sheet = getOrCreateVendorsSheet();
    if (sheet.getLastRow() <= 1) return { success: true, vendors: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const vendors = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][idx.id]) continue;
      vendors.push({
        id: data[i][idx.id],
        name: data[i][idx.name] || '',
        contactPerson: data[i][idx.contactperson] || '',
        phone: data[i][idx.phone] || '',
        email: data[i][idx.email] || '',
        address: data[i][idx.address] || '',
        notes: data[i][idx.notes] || ''
      });
    }
    vendors.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { success: true, vendors: vendors };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function saveVendor(vendor) {
  try {
    const sheet = getOrCreateVendorsSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const now = new Date().toISOString();

    if (!vendor.id || String(vendor.id).trim() === '') {
      vendor.id = "VND-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      vendor.createdAt = now;
    }

    const normalized = {};
    Object.keys(vendor).forEach(k => normalized[String(k).trim().toLowerCase()] = vendor[k]);

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.map(h => h.toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(vendor.id)) { foundRow = i + 1; break; }
    }

    const rowVal = headers.map(h => {
      const normH = h.toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Vendor', vendor.name);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Added Vendor', vendor.name);
    }
    SpreadsheetApp.flush();
    return { success: true, vendor: vendor };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteVendor(id) {
  try {
    const sheet = getOrCreateVendorsSheet();
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].map(h => String(h).trim().toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        logActivity('Deleted Vendor', id);
        return { success: true };
      }
    }
    return { success: false, message: 'Vendor not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── STOCK TRANSACTIONS ──
function getOrCreateStockTransactionsSheet() {
  return getOrCreateSheet(STOCK_TXN_SHEET, [
    "id", "saleId", "date", "type", "itemId", "itemName", "quantity", "unitPrice",
    "discount", "tax", "netTotal", "party", "customerType", "studentId",
    "paymentStatus", "amountPaid", "balance", "isReturn", "academicSession",
    "notes", "recordedBy", "createdAt"
  ]);
}

// Internal helper — returns the signed stock delta a transaction causes.
// Sale = stock out, Purchase = stock in, Adjustment defaults to stock in.
// isReturn flips the direction (a sales return puts stock back, a purchase
// return sends it back to the vendor, and for Adjustment it doubles as a
// Stock In / Stock Out switch).
function stockEffect_(type, qty, isReturn) {
  qty = parseFloat(qty) || 0;
  var sign = (type === 'Purchase') ? 1 : (type === 'Sale' ? -1 : 1);
  if (isReturn) sign = -sign;
  return sign * qty;
}

function saveStockTransaction(txn) {
  try {
    const sheet = getOrCreateStockTransactionsSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const now = new Date().toISOString();
    const user = Session.getActiveUser().getEmail() || 'Admin';

    const qty = parseFloat(txn.quantity) || 0;
    const price = parseFloat(txn.unitPrice) || 0;
    const discount = parseFloat(txn.discount) || 0;
    const tax = parseFloat(txn.tax) || 0;
    txn.netTotal = round2_(Math.max(0, (qty * price) - discount + tax));
    txn.amountPaid = txn.paymentStatus === 'Paid' ? txn.netTotal
      : (txn.paymentStatus === 'Unpaid' ? 0 : round2_(parseFloat(txn.amountPaid) || 0));
    txn.balance = round2_(Math.max(0, txn.netTotal - txn.amountPaid));
    txn.isReturn = (txn.isReturn === true || txn.isReturn === 'Yes' || txn.isReturn === 'true');
    txn.recordedBy = user;
    txn.date = txn.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (!txn.academicSession) {
      const s = getSettings();
      const st = (s && s.settings) || {};
      txn.academicSession = ((st.academicYear || '') + ' - ' + (st.activeTerm || '')).trim();
    }

    const data = sheet.getDataRange().getValues();
    const idIdx = lowerHeaders.indexOf('id');
    let foundRow = -1;
    let oldRow = null;
    if (txn.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(txn.id)) { foundRow = i + 1; oldRow = data[i]; break; }
      }
    }
    if (!txn.id) {
      txn.id = "STX-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      txn.createdAt = now;
    }

    // Reverse the old stock effect first (editing a transaction), then
    // apply the new one — keeps Inventory stock accurate across edits.
    if (oldRow) {
      const oldType = oldRow[lowerHeaders.indexOf('type')];
      const oldQty = oldRow[lowerHeaders.indexOf('quantity')];
      const oldReturn = isBoolTrue(oldRow[lowerHeaders.indexOf('isreturn')]);
      const oldItemId = oldRow[lowerHeaders.indexOf('itemid')];
      adjustInventoryStock_(oldItemId, -stockEffect_(oldType, oldQty, oldReturn));
    }
    adjustInventoryStock_(txn.itemId, stockEffect_(txn.type, qty, txn.isReturn));

    const normalized = {};
    Object.keys(txn).forEach(k => normalized[String(k).trim().toLowerCase()] = txn[k]);
    const rowVal = headers.map(h => {
      const nh = h.toLowerCase();
      return normalized[nh] !== undefined ? normalized[nh] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Stock Transaction', txn.type + ' - ' + txn.itemName);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Recorded Stock Transaction', txn.type + ' - ' + txn.itemName);
    }
    SpreadsheetApp.flush();
    return { success: true, txn: txn };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getStockTransactions() {
  try {
    const sheet = getOrCreateStockTransactionsSheet();
    if (sheet.getLastRow() <= 1) return { success: true, transactions: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const tz = Session.getScriptTimeZone();
    const txns = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][idx.id]) continue;
      let dateVal = data[i][idx.date];
      let dateStr = dateVal;
      if (dateVal instanceof Date) dateStr = Utilities.formatDate(dateVal, tz, 'yyyy-MM-dd');
      txns.push({
        id: data[i][idx.id],
        saleId: data[i][idx.saleid] || '',
        date: dateStr || '',
        type: data[i][idx.type] || '',
        itemId: data[i][idx.itemid] || '',
        itemName: data[i][idx.itemname] || '',
        quantity: parseFloat(data[i][idx.quantity]) || 0,
        unitPrice: parseFloat(data[i][idx.unitprice]) || 0,
        discount: parseFloat(data[i][idx.discount]) || 0,
        tax: parseFloat(data[i][idx.tax]) || 0,
        netTotal: parseFloat(data[i][idx.nettotal]) || 0,
        party: data[i][idx.party] || '',
        customerType: data[i][idx.customertype] || '',
        studentId: data[i][idx.studentid] || '',
        paymentStatus: data[i][idx.paymentstatus] || 'Paid',
        amountPaid: parseFloat(data[i][idx.amountpaid]) || 0,
        balance: parseFloat(data[i][idx.balance]) || 0,
        isReturn: isBoolTrue(data[i][idx.isreturn]),
        academicSession: data[i][idx.academicsession] || '',
        notes: data[i][idx.notes] || '',
        recordedBy: data[i][idx.recordedby] || ''
      });
    }
    txns.reverse();
    return { success: true, transactions: txns };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteStockTransaction(id) {
  try {
    const sheet = getOrCreateStockTransactionsSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idIdx = headers.indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) {
        const type = data[i][headers.indexOf('type')];
        const qty = data[i][headers.indexOf('quantity')];
        const isReturn = isBoolTrue(data[i][headers.indexOf('isreturn')]);
        const itemId = data[i][headers.indexOf('itemid')];
        adjustInventoryStock_(itemId, -stockEffect_(type, qty, isReturn));
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        logActivity('Deleted Stock Transaction', id);
        return { success: true };
      }
    }
    return { success: false, message: 'Transaction not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Records an additional payment against a Partially Paid / Unpaid stock
// transaction (e.g. a student or walk-in customer settling their balance
// later) without touching inventory stock — only the payment fields change.
function collectStockTransactionBalance(id, amount) {
  try {
    const pay = round2_(parseFloat(amount) || 0);
    if (pay <= 0) return { success: false, message: 'Enter an amount greater than zero' };

    const sheet = getOrCreateStockTransactionsSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idIdx = headers.indexOf('id');
    const netIdx = headers.indexOf('nettotal');
    const paidIdx = headers.indexOf('amountpaid');
    const balIdx = headers.indexOf('balance');
    const statusIdx = headers.indexOf('paymentstatus');

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) !== String(id)) continue;
      const net = parseFloat(data[i][netIdx]) || 0;
      const currentPaid = parseFloat(data[i][paidIdx]) || 0;
      const currentBalance = Math.max(0, net - currentPaid);
      if (pay > currentBalance + 0.009) {
        return { success: false, message: 'Amount exceeds the outstanding balance of ' + currentBalance.toFixed(2) };
      }
      const newPaid = round2_(currentPaid + pay);
      const newBalance = round2_(Math.max(0, net - newPaid));
      const newStatus = newBalance <= 0.009 ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');

      sheet.getRange(i + 1, paidIdx + 1).setValue(newPaid);
      sheet.getRange(i + 1, balIdx + 1).setValue(newBalance);
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      SpreadsheetApp.flush();
      logActivity('Collected Stock Transaction Balance', id + ' - ' + pay.toFixed(2));
      return { success: true, amountPaid: newPaid, balance: newBalance, paymentStatus: newStatus };
    }
    return { success: false, message: 'Transaction not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── POS / SELL ──
// Completes a point-of-sale checkout: one cart can contain several items,
// each becomes its own "Sale" Stock Transaction row (sharing a saleId so
// they print as one receipt and roll up as one sale in reports), and each
// line's stock is decremented via saveStockTransaction -> adjustInventoryStock_.
function completeSale(sale) {
  try {
    if (!sale || !Array.isArray(sale.items) || !sale.items.length) {
      return { success: false, message: 'Cart is empty' };
    }
    const items = sale.items.map(function (it) {
      return { itemId: it.itemId, itemName: it.itemName, qty: parseFloat(it.qty) || 0, unitPrice: parseFloat(it.unitPrice) || 0 };
    }).filter(function (it) { return it.itemId && it.qty > 0; });
    if (!items.length) return { success: false, message: 'Cart is empty' };

    // Verify stock availability up front so a checkout doesn't partially apply.
    const invRes = getInventoryItems();
    if (!invRes.success) return { success: false, message: invRes.message };
    const invById = {};
    (invRes.items || []).forEach(function (i) { invById[i.id] = i; });
    for (let k = 0; k < items.length; k++) {
      const inv = invById[items[k].itemId];
      if (!inv) return { success: false, message: 'Item not found: ' + items[k].itemName };
      if (inv.stock < items[k].qty) return { success: false, message: 'Not enough stock for ' + inv.name + ' (available: ' + inv.stock + ')' };
    }

    const subtotal = items.reduce(function (s, it) { return s + it.qty * it.unitPrice; }, 0);
    const discount = Math.max(0, parseFloat(sale.discount) || 0);
    const tax = Math.max(0, parseFloat(sale.tax) || 0);
    const grandTotal = round2_(Math.max(0, subtotal - discount + tax));

    const paymentStatus = sale.paymentStatus || 'Paid';
    const amountPaid = paymentStatus === 'Paid' ? grandTotal
      : (paymentStatus === 'Unpaid' ? 0 : round2_(parseFloat(sale.amountPaid) || 0));

    const saleId = 'SALE-' + Utilities.getUuid().substring(0, 8).toUpperCase();
    const dateStr = sale.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const customerType = sale.customerType === 'student' ? 'Student' : 'Walk-in';
    const party = customerType === 'Student'
      ? (sale.studentName || 'Student')
      : ((sale.walkInName && String(sale.walkInName).trim()) || 'Walk-in Customer');

    const results = [];
    let paidRemaining = amountPaid;
    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      const lineSubtotal = it.qty * it.unitPrice;
      const share = subtotal > 0 ? (lineSubtotal / subtotal) : (1 / items.length);
      const lineDiscount = discount * share;
      const lineTax = tax * share;
      const lineNet = round2_(Math.max(0, lineSubtotal - lineDiscount + lineTax));
      const linePaid = round2_(Math.min(lineNet, Math.max(0, paidRemaining)));
      paidRemaining -= linePaid;

      const txn = {
        saleId: saleId,
        date: dateStr,
        type: 'Sale',
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: it.qty,
        unitPrice: it.unitPrice,
        discount: round2_(lineDiscount),
        tax: round2_(lineTax),
        party: party,
        customerType: customerType,
        studentId: customerType === 'Student' ? (sale.studentId || '') : '',
        paymentStatus: paymentStatus,
        amountPaid: linePaid,
        isReturn: false,
        notes: sale.notes || ''
      };
      const r = saveStockTransaction(txn);
      if (!r.success) return { success: false, message: r.message };
      results.push(r.txn);
    }

    logActivity('POS Sale', saleId + ' - ' + party + ' (' + items.length + ' item(s))');
    return {
      success: true,
      saleId: saleId,
      items: results,
      subtotal: round2_(subtotal),
      discount: round2_(discount),
      tax: round2_(tax),
      total: grandTotal,
      amountPaid: round2_(amountPaid),
      balance: round2_(Math.max(0, grandTotal - amountPaid)),
      party: party,
      date: dateStr
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Unique, currently-enrolled students from the active term's Fees Database
// sheet — used to populate the POS customer search and other "pick a
// student" combo boxes without depending on the client-side records cache.
function getActiveStudentsList() {
  try {
    const settingsRes = getSettings();
    const activeTerm = (settingsRes.settings && settingsRes.settings.activeTerm) || 'First Term';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PREFIX + " - " + activeTerm);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, students: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const idIdx = headers.indexOf('id');
    const nameIdx = headers.indexOf('studentName');
    const gradeIdx = headers.indexOf('grade');
    const stoppedIdx = headers.indexOf('isStopped');
    const seen = {};
    const students = [];
    for (let i = 1; i < data.length; i++) {
      const id = data[i][idIdx];
      if (!id || seen[id]) continue;
      if (stoppedIdx !== -1 && isBoolTrue(data[i][stoppedIdx])) continue;
      seen[id] = true;
      students.push({ id: id, name: data[i][nameIdx] || '', grade: data[i][gradeIdx] || '' });
    }
    students.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { success: true, students: students };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ════════════════════════════════════════════════════════
// SALARIES — Staff directory + monthly payroll for Teaching and
// Non-Teaching Staff, with printable/emailable/WhatsApp-able payslips.
// ════════════════════════════════════════════════════════
const STAFF_SHEET = "Staff";
const SALARY_PAYMENTS_SHEET = "Salary Payments";

// ── STAFF DIRECTORY ──
function getOrCreateStaffSheet() {
  const sheet = getOrCreateSheet(STAFF_SHEET, [
    "id", "name", "staffType", "position", "department", "phone", "email",
    "baseSalary", "bankName", "bankBranch", "accountNumber", "ssnitNumber",
    "ghanaCardNo", "employeeId", "isActive", "notes", "createdAt"
  ]);
  // Migration: add columns introduced after the sheet was first created.
  try {
    const newCols = ["department", "bankBranch", "ssnitNumber", "ghanaCardNo", "employeeId"];
    let existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    newCols.forEach(col => {
      if (existingHeaders.indexOf(col) === -1) {
        const lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        sheet.getRange(1, lastCol + 1).setValue(col)
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }
    });
  } catch (migErr) {
    Logger.log('Staff sheet migration info: ' + migErr.message);
  }
  return sheet;
}

function getStaffList() {
  try {
    const sheet = getOrCreateStaffSheet();
    if (sheet.getLastRow() <= 1) return { success: true, staff: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const staff = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][idx.id]) continue;
      staff.push({
        id: data[i][idx.id],
        employeeId: (idx.employeeid !== undefined ? data[i][idx.employeeid] : '') || '',
        name: data[i][idx.name] || '',
        staffType: data[i][idx.stafftype] || 'Teaching',
        position: data[i][idx.position] || '',
        department: (idx.department !== undefined ? data[i][idx.department] : '') || '',
        phone: data[i][idx.phone] || '',
        email: data[i][idx.email] || '',
        baseSalary: parseFloat(data[i][idx.basesalary]) || 0,
        bankName: data[i][idx.bankname] || '',
        bankBranch: (idx.bankbranch !== undefined ? data[i][idx.bankbranch] : '') || '',
        accountNumber: data[i][idx.accountnumber] || '',
        ssnitNumber: (idx.ssnitnumber !== undefined ? data[i][idx.ssnitnumber] : '') || '',
        ghanaCardNo: (idx.ghanacardno !== undefined ? data[i][idx.ghanacardno] : '') || '',
        isActive: data[i][idx.isactive] === '' || data[i][idx.isactive] === undefined ? true : isBoolTrue(data[i][idx.isactive]),
        notes: data[i][idx.notes] || ''
      });
    }
    staff.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return { success: true, staff: staff };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function saveStaffMember(person) {
  try {
    const sheet = getOrCreateStaffSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const now = new Date().toISOString();

    if (!person.id || String(person.id).trim() === '') {
      person.id = "STF-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      person.createdAt = now;
    }
    person.isActive = person.isActive === false ? false : true;
    person.baseSalary = parseFloat(person.baseSalary) || 0;

    const normalized = {};
    Object.keys(person).forEach(k => normalized[String(k).trim().toLowerCase()] = person[k]);

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = headers.map(h => h.toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(person.id)) { foundRow = i + 1; break; }
    }

    const rowVal = headers.map(h => {
      const normH = h.toLowerCase();
      return normalized[normH] !== undefined ? normalized[normH] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Staff Member', person.name);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Added Staff Member', person.name);
    }
    SpreadsheetApp.flush();
    return { success: true, person: person };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteStaffMember(id) {
  try {
    const sheet = getOrCreateStaffSheet();
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].map(h => String(h).trim().toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        logActivity('Deleted Staff Member', id);
        return { success: true };
      }
    }
    return { success: false, message: 'Staff member not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── MONTHLY SALARY PAYMENTS ──
// Earnings and deductions are each an itemized list of {name, amount} —
// e.g. Basic Pay / House Rent Allowance on the earnings side, SSNIT /
// Income Tax / Union Dues on the deductions side — stored as JSON so a
// payslip can show named line items instead of one lump sum.
function getOrCreateSalaryPaymentsSheet() {
  const sheet = getOrCreateSheet(SALARY_PAYMENTS_SHEET, [
    "id", "staffId", "staffName", "staffType", "position", "department",
    "month", "monthLabel", "daysWorked", "daysAbsent", "weekdayOtHours", "holidayOtHours",
    "baseSalary", "earningsJson", "deductionsJson", "totalEarnings", "totalDeductions", "netPay",
    "paymentStatus", "paymentDate", "paymentMethod", "notes", "recordedBy", "createdAt"
  ]);
  // Migration: add columns introduced after the sheet was first created —
  // and drop the old flat allowances/deductions numbers in favor of the
  // itemized JSON columns above (their data isn't recoverable as named
  // lines, so existing rows simply show no line items until re-saved).
  try {
    const newCols = ["department", "daysWorked", "daysAbsent", "weekdayOtHours", "holidayOtHours", "earningsJson", "deductionsJson", "totalEarnings", "totalDeductions"];
    let existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    newCols.forEach(col => {
      if (existingHeaders.indexOf(col) === -1) {
        const lastCol = sheet.getLastColumn();
        sheet.insertColumnAfter(lastCol);
        sheet.getRange(1, lastCol + 1).setValue(col)
          .setBackground('#4285F4').setFontColor('white').setFontWeight('bold');
        existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
      }
    });
  } catch (migErr) {
    Logger.log('Salary Payments sheet migration info: ' + migErr.message);
  }
  return sheet;
}

// Parses a stored line-items JSON cell back into an array, tolerating
// blank/legacy/corrupt values.
function parseSalaryLines_(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(l => ({ name: String(l.name || ''), amount: parseFloat(l.amount) || 0 })) : [];
  } catch (e) {
    return [];
  }
}

function getSalaryPayments() {
  try {
    const sheet = getOrCreateSalaryPaymentsSheet();
    if (sheet.getLastRow() <= 1) return { success: true, payments: [] };
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const idx = {};
    headers.forEach((h, i) => idx[h] = i);
    const tz = Session.getScriptTimeZone();
    const payments = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][idx.id]) continue;
      let payDate = data[i][idx.paymentdate];
      if (payDate instanceof Date) payDate = Utilities.formatDate(payDate, tz, 'yyyy-MM-dd');
      const earnings = parseSalaryLines_(data[i][idx.earningsjson]);
      const deductions = parseSalaryLines_(data[i][idx.deductionsjson]);
      payments.push({
        id: data[i][idx.id],
        staffId: data[i][idx.staffid] || '',
        staffName: data[i][idx.staffname] || '',
        staffType: data[i][idx.stafftype] || '',
        position: data[i][idx.position] || '',
        department: (idx.department !== undefined ? data[i][idx.department] : '') || '',
        month: data[i][idx.month] || '',
        monthLabel: data[i][idx.monthlabel] || '',
        daysWorked: parseFloat(data[i][idx.daysworked]) || 0,
        daysAbsent: parseFloat(data[i][idx.daysabsent]) || 0,
        weekdayOtHours: parseFloat(data[i][idx.weekdayothours]) || 0,
        holidayOtHours: parseFloat(data[i][idx.holidayothours]) || 0,
        baseSalary: parseFloat(data[i][idx.basesalary]) || 0,
        earnings: earnings,
        deductions: deductions,
        totalEarnings: parseFloat(data[i][idx.totalearnings]) || 0,
        totalDeductions: parseFloat(data[i][idx.totaldeductions]) || 0,
        netPay: parseFloat(data[i][idx.netpay]) || 0,
        paymentStatus: data[i][idx.paymentstatus] || 'Pending',
        paymentDate: payDate || '',
        paymentMethod: data[i][idx.paymentmethod] || '',
        notes: data[i][idx.notes] || '',
        recordedBy: data[i][idx.recordedby] || ''
      });
    }
    payments.reverse();
    return { success: true, payments: payments };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function saveSalaryPayment(payment) {
  try {
    const sheet = getOrCreateSalaryPaymentsSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const lowerHeaders = headers.map(h => h.toLowerCase());
    const now = new Date().toISOString();
    const user = Session.getActiveUser().getEmail() || 'Admin';

    const earnings = Array.isArray(payment.earnings) ? payment.earnings
      .map(l => ({ name: String(l.name || '').trim(), amount: parseFloat(l.amount) || 0 }))
      .filter(l => l.name) : [];
    const deductions = Array.isArray(payment.deductions) ? payment.deductions
      .map(l => ({ name: String(l.name || '').trim(), amount: parseFloat(l.amount) || 0 }))
      .filter(l => l.name) : [];
    const totalEarnings = round2_(earnings.reduce((s, l) => s + l.amount, 0));
    const totalDeductions = round2_(deductions.reduce((s, l) => s + l.amount, 0));

    payment.earningsJson = JSON.stringify(earnings);
    payment.deductionsJson = JSON.stringify(deductions);
    payment.totalEarnings = totalEarnings;
    payment.totalDeductions = totalDeductions;
    payment.netPay = round2_(Math.max(0, totalEarnings - totalDeductions));
    payment.recordedBy = user;
    if (payment.paymentStatus === 'Paid' && !payment.paymentDate) {
      payment.paymentDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }

    let foundRow = -1;
    const data = sheet.getDataRange().getValues();
    const idIdx = lowerHeaders.indexOf('id');
    if (payment.id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][idIdx]) === String(payment.id)) { foundRow = i + 1; break; }
      }
    }
    if (!payment.id) {
      payment.id = "SAL-" + Utilities.getUuid().substring(0, 8).toUpperCase();
      payment.createdAt = now;
    }

    const normalized = {};
    Object.keys(payment).forEach(k => normalized[String(k).trim().toLowerCase()] = payment[k]);
    const rowVal = headers.map(h => {
      const nh = h.toLowerCase();
      return normalized[nh] !== undefined ? normalized[nh] : '';
    });

    if (foundRow !== -1) {
      sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowVal]);
      logActivity('Updated Salary Payment', payment.staffName + ' - ' + payment.monthLabel);
    } else {
      sheet.appendRow(rowVal);
      logActivity('Recorded Salary Payment', payment.staffName + ' - ' + payment.monthLabel);
    }
    SpreadsheetApp.flush();
    // Return the fully-parsed shape (earnings/deductions as arrays, not
    // JSON strings) so the client can use the response directly.
    payment.earnings = earnings;
    payment.deductions = deductions;
    return { success: true, payment: payment };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteSalaryPayment(id) {
  try {
    const sheet = getOrCreateSalaryPaymentsSheet();
    const data = sheet.getDataRange().getValues();
    const idCol = data[0].map(h => String(h).trim().toLowerCase()).indexOf('id');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        logActivity('Deleted Salary Payment', id);
        return { success: true };
      }
    }
    return { success: false, message: 'Payment not found' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// Emails a payslip (HTML, styled like the printed/on-screen one — bordered
// box, two-column employee details, itemized Earnings/Deductions tables,
// no logo) to the staff member's own email address on file.
function sendPayslipEmail(paymentId) {
  try {
    const res = getSalaryPayments();
    if (!res.success) return { success: false, message: res.message };
    const payment = res.payments.find(p => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment not found' };

    const staffRes = getStaffList();
    const person = (staffRes.staff || []).find(s => String(s.id) === String(payment.staffId));
    const email = person && person.email ? String(person.email).trim() : '';
    if (!email) return { success: false, message: 'This staff member has no email address on file' };

    const settingsRes = getSettings();
    const st = (settingsRes && settingsRes.settings) || {};
    const schoolName = st.schoolName || 'School';
    const schoolAddress = st.schoolAddress || '';
    const currency = st.currency || 'GHC';
    const currencyName = currency === 'GHC' ? 'Ghana Cedis' : currency;
    const f2 = n => (parseFloat(n) || 0).toFixed(2);
    const bankLine = [person && person.bankName, person && person.bankBranch].filter(Boolean).join(', ');

    const infoRow = (label, value) => `<tr><td style="padding:3px 6px 3px 0;color:#1e1b4b;white-space:nowrap;">${label}</td><td style="padding:3px 0;color:#1e1b4b;">: ${value || '-'}</td></tr>`;
    const lineRows = (lines) => lines.length
      ? lines.map(l => `<tr><td style="padding:4px 6px;color:#1e1b4b;">${l.name}</td><td style="padding:4px 6px;text-align:right;color:#1e1b4b;">${f2(l.amount)}</td></tr>`).join('')
      : `<tr><td colspan="2" style="padding:4px 6px;color:#94a3b8;">&mdash;</td></tr>`;

    const html = `
      <div style="font-family:'Times New Roman',Times,serif;max-width:640px;margin:0 auto;border:2px solid #1e1b4b;padding:18px 22px;color:#1e1b4b;">
        <div style="text-align:center;margin-bottom:10px;">
          <div style="font-size:20px;font-weight:700;">${schoolName}</div>
          ${schoolAddress ? `<div style="font-size:12px;">${schoolAddress}</div>` : ''}
        </div>
        <div style="text-align:center;font-weight:700;font-size:14px;margin-bottom:14px;">Payslip for the period of ${payment.monthLabel}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:12px;">
          <tr>
            <td style="vertical-align:top;width:50%;"><table style="border-collapse:collapse;">
              ${infoRow('Employee Id', person && person.employeeId ? person.employeeId : payment.staffId)}
              ${infoRow('Department', payment.department)}
              ${infoRow('Days Worked', f2(payment.daysWorked))}
              ${infoRow('Bank Name, Branch', bankLine)}
              ${infoRow('Weekday OT Hours', f2(payment.weekdayOtHours))}
              ${infoRow('SSNIT Number', person ? person.ssnitNumber : '')}
            </table></td>
            <td style="vertical-align:top;width:50%;"><table style="border-collapse:collapse;">
              ${infoRow('Name', payment.staffName)}
              ${infoRow('Designation', payment.position)}
              ${infoRow('Days Absent', f2(payment.daysAbsent))}
              ${infoRow('Bank Acct/Cheque Number', person ? person.accountNumber : '')}
              ${infoRow('Holiday OT Hours', f2(payment.holidayOtHours))}
              ${infoRow('Ghana Card No', person ? person.ghanaCardNo : '')}
            </table></td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;border-top:1.5px solid #1e1b4b;border-bottom:1.5px solid #1e1b4b;font-size:12.5px;">
          <tr>
            <td style="width:50%;vertical-align:top;border-right:1px solid #cbd5e1;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:5px 6px;font-weight:700;">Earnings</td><td style="padding:5px 6px;text-align:right;font-weight:700;">Amount</td></tr>
                ${lineRows(payment.earnings)}
              </table>
            </td>
            <td style="width:50%;vertical-align:top;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:5px 6px;font-weight:700;">Deductions</td><td style="padding:5px 6px;text-align:right;font-weight:700;">Amount</td></tr>
                ${lineRows(payment.deductions)}
              </table>
            </td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;border-bottom:1.5px solid #1e1b4b;">
          <tr>
            <td style="width:50%;padding:5px 6px;font-weight:700;border-right:1px solid #cbd5e1;">Total Earnings (Rounded)</td>
            <td style="width:auto;padding:5px 6px;text-align:right;font-weight:700;border-right:1px solid #cbd5e1;">${f2(payment.totalEarnings)}</td>
            <td style="width:50%;padding:5px 6px;font-weight:700;">Total Deductions (Rounded)</td>
            <td style="padding:5px 6px;text-align:right;font-weight:700;">${f2(payment.totalDeductions)}</td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 6px;font-weight:700;">Net Pay (Rounded)</td><td style="padding:8px 6px;text-align:right;font-weight:700;">${f2(payment.netPay)}</td></tr>
        </table>
        <div style="text-align:center;font-size:11.5px;font-style:italic;margin:10px 0;">(All figures in ${currencyName})</div>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:20px;">
          <tr>
            <td style="width:45%;border-top:1px solid #1e1b4b;text-align:center;padding-top:4px;">Employer's Signature</td>
            <td style="width:10%;"></td>
            <td style="width:45%;border-top:1px solid #1e1b4b;text-align:center;padding-top:4px;">Employee's Signature</td>
          </tr>
        </table>
      </div>`;

    MailApp.sendEmail({
      to: email,
      subject: schoolName + ' — Payslip for ' + payment.monthLabel,
      htmlBody: html
    });
    logActivity('Emailed Payslip', payment.staffName + ' - ' + payment.monthLabel);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

