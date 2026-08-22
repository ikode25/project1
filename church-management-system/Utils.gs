/**
 * Utils.gs
 * Small, dependency-free helpers used across modules. Server-side input
 * validation lives here so every .gs function can call it before writing.
 */

function nowIso_() {
  return new Date().toISOString();
}

function currentUserEmail_() {
  var email = Session.getActiveUser().getEmail();
  return email || Session.getEffectiveUser().getEmail() || 'unknown';
}

/** Strips tags/script content so any user text that gets echoed back into HTML can't inject markup. */
function sanitizeText_(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

function isBlank_(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

function requireFields_(data, fields) {
  var missing = fields.filter(function (f) { return isBlank_(data[f]); });
  if (missing.length) throw new Error('Missing required field(s): ' + missing.join(', '));
}

function isValidEmail_(email) {
  if (isBlank_(email)) return true; // email is usually optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone_(phone) {
  if (isBlank_(phone)) return false;
  return /^[+0-9][0-9\s\-]{6,17}$/.test(String(phone).trim());
}

function normalizePhone_(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function isValidDate_(d) {
  if (isBlank_(d)) return true;
  var t = new Date(d);
  return !isNaN(t.getTime());
}

function isNumber_(n) {
  return typeof n === 'number' ? !isNaN(n) : !isNaN(parseFloat(n)) && isFinite(n);
}

function requireEnum_(value, allowed, fieldName) {
  if (isBlank_(value)) return;
  if (allowed.indexOf(value) === -1) {
    throw new Error(fieldName + ' must be one of: ' + allowed.join(', '));
  }
}

function toBool_(v) {
  return v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';
}

/** Simple per-bucket rate limiter backed by the RateLimits sheet — for public-facing endpoints. */
function checkRateLimit_(bucket, maxHits, windowSeconds) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet_(SHEETS.RATE_LIMITS);
    var rows = readAll_(SHEETS.RATE_LIMITS);
    var cutoff = Date.now() - windowSeconds * 1000;
    var recent = rows.filter(function (r) {
      return r.Bucket === bucket && new Date(r.Timestamp).getTime() > cutoff;
    });
    if (recent.length >= maxHits) {
      throw new Error('Too many requests. Please try again in a moment.');
    }
    insertRow_(SHEETS.RATE_LIMITS, { Bucket: bucket, Timestamp: nowIso_() }, 'RL');
    // opportunistic cleanup so the sheet doesn't grow unbounded
    if (rows.length > 500) {
      var keep = rows.filter(function (r) { return new Date(r.Timestamp).getTime() > cutoff; });
      sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 3).clearContent();
      keep.forEach(function (r) { sheet.appendRow([r.ID, r.Bucket, r.Timestamp]); });
    }
  } finally {
    lock.releaseLock();
  }
}

function logError_(functionName, err) {
  try {
    insertRow_(SHEETS.ERRORS, {
      Timestamp: nowIso_(),
      FunctionName: functionName,
      Message: err && err.message ? err.message : String(err),
      Stack: err && err.stack ? err.stack : ''
    }, 'ERR');
  } catch (e) {
    console.error('logError_ failed', e);
  }
}

/** Wraps a service function so thrown errors are logged and re-thrown with a clean message for the client. */
function safeCall_(functionName, fn) {
  try {
    return fn();
  } catch (err) {
    logError_(functionName, err);
    throw new Error(err && err.message ? err.message : 'Something went wrong. Please try again.');
  }
}

function calcAge_(dob) {
  if (isBlank_(dob)) return null;
  var birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  var diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function formatMoney_(n) {
  n = Number(n) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
