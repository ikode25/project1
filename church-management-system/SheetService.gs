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
