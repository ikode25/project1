// ============================================================
// School Fees Management System — Apps Script bridge
// ------------------------------------------------------------
// The app's database and admin/parent UI now live in the single
// index.html file (Firebase Realtime Database as the datastore).
// This script is no longer the app host — it survives only as a
// small JSON API for the handful of things a static HTML file
// can't safely do on its own: hold secrets (Arkesel SMS key),
// send email (Gmail/MailApp), and write to Google Drive (student
// photos). Deploy this as a Web App ("Execute as: me", "Who has
// access: Anyone") at the SAME URL already referenced by
// index.html's APPS_SCRIPT_URL constant.
// ============================================================

const DB_URL = "https://fees-1f58a-default-rtdb.firebaseio.com";
const FIREBASE_API_KEY = "AIzaSyC_W__0g7E0Lg1qDKM9CNHn_dS6_K7l26A"; // public web API key — safe to embed, identifies the project only

// Database writes require "auth != null" (see firebase-rules.json), so this
// script signs itself in anonymously too — same as the browser app does —
// and attaches the resulting token to write requests. Reads stay open and
// need no token.
function getFirebaseIdToken() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('fb_id_token');
  if (cached) return cached;
  const resp = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ returnSecureToken: true }), muteHttpExceptions: true }
  );
  try {
    const data = JSON.parse(resp.getContentText());
    if (data.idToken) { cache.put('fb_id_token', data.idToken, 3000); return data.idToken; }
  } catch (e) { Logger.log('getFirebaseIdToken error: ' + e.message); }
  return null;
}

function dbGet(path) {
  const resp = UrlFetchApp.fetch(DB_URL + path + '.json', { muteHttpExceptions: true });
  try { return JSON.parse(resp.getContentText()); } catch (e) { return null; }
}
function authedUrl(path) {
  const token = getFirebaseIdToken();
  return DB_URL + path + '.json' + (token ? '?auth=' + encodeURIComponent(token) : '');
}
function dbPatch(path, data) {
  return UrlFetchApp.fetch(authedUrl(path), {
    method: 'patch', contentType: 'application/json', payload: JSON.stringify(data), muteHttpExceptions: true
  });
}
function dbPut(path, data) {
  return UrlFetchApp.fetch(authedUrl(path), {
    method: 'put', contentType: 'application/json', payload: JSON.stringify(data), muteHttpExceptions: true
  });
}
function dbPush(path, data) {
  return UrlFetchApp.fetch(authedUrl(path), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(data), muteHttpExceptions: true
  });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<p>This Apps Script is a JSON API bridge for the School Fees Management app — it is not the app itself. ' +
    'Open the app\'s index.html (Firebase Hosting) instead.</p>'
  );
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ success: false, message: 'No post data received' });
    }
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const handlers = {
      getSecureSettings: handleGetSecureSettings,
      saveSecureSettings: handleSaveSecureSettings,
      sendParentVerificationCode: handleSendParentVerificationCode,
      uploadStudentPhoto: handleUploadStudentPhoto,
      sendDailyReportNow: handleSendDailyAccountingReport,
      toggleDailyEmailTrigger: handleToggleDailyEmailTrigger,
      syncStudents: handleSyncStudents
    };
    const fn = handlers[action];
    if (!fn) return jsonOut({ success: false, message: 'Unknown action: ' + action });
    return jsonOut(fn(payload));
  } catch (err) {
    return jsonOut({ success: false, message: 'Bridge error: ' + err.message });
  }
}

// ── Secure settings (kept out of Firebase entirely) ──────────
function handleGetSecureSettings() {
  const props = PropertiesService.getScriptProperties();
  return {
    success: true,
    schoolApiUrl: props.getProperty('schoolApiUrl') || '',
    hasApiKey: !!props.getProperty('schoolApiKey')
  };
}
function handleSaveSecureSettings(payload) {
  const props = PropertiesService.getScriptProperties();
  const toSave = {};
  if (payload.schoolApiUrl !== undefined) toSave.schoolApiUrl = payload.schoolApiUrl;
  if (payload.schoolApiKey !== undefined && payload.schoolApiKey.indexOf('•') === -1) toSave.schoolApiKey = payload.schoolApiKey;
  if (Object.keys(toSave).length) props.setProperties(toSave);
  return { success: true };
}

// ── Parent OTP (Arkesel SMS, falls back to admin email) ──────
function handleSendParentVerificationCode(payload) {
  const phone = payload.phone, otp = payload.otp;
  const settings = dbGet('/settings') || {};
  const schoolName = settings.schoolName || 'School';
  const msg = schoolName + ' Portal Verification Code: ' + otp + '. Valid for 5 minutes. Do not share this code.';

  const apiKey = settings.arkeselApiKey || '';
  const sender = settings.arkeselSender || schoolName;
  if (apiKey) {
    try {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const url = 'https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + encodeURIComponent(apiKey) +
                  '&to=' + encodeURIComponent(cleanPhone) + '&from=' + encodeURIComponent(sender.substring(0, 11)) + '&sms=' + encodeURIComponent(msg);
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const parsed = JSON.parse(resp.getContentText());
      if (parsed && (parsed.status === 'success' || parsed.code === 'ok')) return { success: true };
    } catch (e) { /* fall through to email */ }
  }

  const adminEmail = settings.adminEmail || '';
  if (adminEmail) {
    GmailApp.sendEmail(adminEmail, '[' + schoolName + '] Parent OTP Request',
      'A parent with phone ' + phone + ' requested portal OTP: ' + otp + '. SMS delivery failed. Please relay manually if needed.');
  }
  return { success: false, message: 'SMS could not be delivered. Admin notified.' };
}

// ── Student photo upload → Google Drive ───────────────────────
function handleUploadStudentPhoto(payload) {
  try {
    const studentId = payload.studentId, base64Data = payload.base64Data, fileName = payload.fileName || 'photo.jpg';
    let settings = dbGet('/settings') || {};
    let folderId = settings.studentPhotosFolderId || '';
    if (!folderId) {
      const folder = DriveApp.createFolder('School Fees Student Profile Photos');
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      folderId = folder.getId();
      dbPatch('/settings', { studentPhotosFolderId: folderId });
    }
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().indexOf(studentId + '_') === 0) file.setTrashed(true);
    }
    const decoded = Utilities.base64Decode(base64Data);
    let extension = 'jpg';
    if (fileName.indexOf('.') !== -1) extension = fileName.split('.').pop();
    const blob = Utilities.newBlob(decoded, 'image/' + extension, studentId + '_' + Date.now() + '.' + extension);
    const newFile = folder.createFile(blob);
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const viewUrl = 'https://lh3.googleusercontent.com/d/' + newFile.getId();
    return { success: true, url: viewUrl, fileId: newFile.getId() };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── Daily accounting trigger toggle ───────────────────────────
function handleToggleDailyEmailTrigger(payload) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) { if (t.getHandlerFunction() === 'sendDailyAccountingReportTrigger') ScriptApp.deleteTrigger(t); });
  if (payload.enabled) {
    ScriptApp.newTrigger('sendDailyAccountingReportTrigger').timeBased().everyDays(1).atHour(16).create();
  }
  return { success: true };
}
// Entry point for the time-based trigger (ScriptApp triggers can't call a function that returns a value meaningfully, but this keeps parity)
function sendDailyAccountingReportTrigger() { handleSendDailyAccountingReport({}); }

// ── External sync receiver (unchanged contract, now writes to Firebase) ──
function handleSyncStudents(payload) {
  try {
    const configuredKey = PropertiesService.getScriptProperties().getProperty('schoolApiKey') || '';
    if (configuredKey && payload.apiKey !== configuredKey) {
      return { success: false, message: 'Unauthorized: Invalid API Key matching target Fees system key.' };
    }
    const students = payload.students;
    if (!students || !Array.isArray(students)) return { success: false, message: 'Invalid students list provided' };

    const settings = dbGet('/settings') || {};
    const activeTerm = settings.activeTerm || 'First Term';
    const academicYear = settings.academicYear || '2025/2026';
    const activeSession = academicYear + ' ' + activeTerm;
    const existing = dbGet('/students/' + encodeURIComponent(activeTerm)) || {};
    const comps = Object.values(dbGet('/feeComponents') || {}).filter(function (c) { return c && c.isActive; });

    const existingByStudentId = {};
    Object.keys(existing).forEach(function (key) { existingByStudentId[String(existing[key].id).trim()] = key; });

    let added = 0, updated = 0;
    const now = new Date().toISOString();
    const updates = {}; // path -> value, applied via one PATCH at /students/{term}

    students.forEach(function (student) {
      const sId = String(student.id || '').trim();
      if (!sId) return;
      const existingKey = existingByStudentId[sId];
      if (existingKey) {
        const rec = existing[existingKey];
        rec.studentName = student.name || rec.studentName;
        rec.phoneNumber = String(student.parentContact || rec.phoneNumber || '');
        rec.grade = student.class || rec.grade;
        rec.academicSession = activeSession;
        rec.updatedAt = now;
        recalcTotals(rec, comps);
        updates[existingKey] = rec;
        updated++;
      } else {
        const rec = { id: sId, studentName: student.name || '', phoneNumber: String(student.parentContact || ''), grade: student.class || '',
          academicSession: activeSession, isNewStudent: true, isStopped: false, createdAt: now, updatedAt: now, recordedBy: 'System Sync', paymentMode: '' };
        comps.forEach(function (c) { rec[c.id] = c.defaultAmount || 0; });
        for (let i = 1; i <= 6; i++) { rec['inst' + i] = 0; rec['inst' + i + 'Date'] = ''; }
        recalcTotals(rec, comps);
        const safeKey = sId.replace(/[.#$\[\]\/]/g, '_');
        updates[safeKey] = rec;
        added++;
      }
    });

    dbPatch('/students/' + encodeURIComponent(activeTerm), updates);
    dbPush('/activityLog', { timestamp: now, action: 'School Sync', details: 'Added ' + added + ', Updated ' + updated + ' students via Master System synchronization.', user: 'System' });

    return { success: true, added: added, updated: updated, message: 'Successfully synchronized ' + (added + updated) + ' student records. (Added: ' + added + ', Updated: ' + updated + ')' };
  } catch (e) {
    return { success: false, message: 'Sync processing failed: ' + e.message };
  }
}

function recalcTotals(rec, comps) {
  let totalFees = 0;
  const discount = parseFloat(rec.discount) || 0;
  comps.forEach(function (c) {
    let v = parseFloat(rec[c.id]) || 0;
    if (c.id === 'actualFees') v = Math.max(0, v - discount);
    totalFees += v;
  });
  let totalPaid = 0;
  for (let i = 1; i <= 6; i++) totalPaid += parseFloat(rec['inst' + i]) || 0;
  rec.totalFees = totalFees;
  rec.totalPaid = totalPaid;
  rec.balance = totalFees - totalPaid;
  rec.paymentStatus = totalFees === 0 ? 'No Fees' : rec.balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid';
}

// ── Daily accounting report (email + SMS), reading from Firebase ──
function handleSendDailyAccountingReport() {
  try {
    const tz = Session.getScriptTimeZone() || 'GMT';
    const today = new Date();
    const todayStr = Utilities.formatDate(today, tz, 'yyyy-MM-dd');
    const settings = dbGet('/settings') || {};
    const currency = settings.currency || 'GHC';
    const primaryColor = settings.themeColor || '#4f46e5';
    const logoUrl = settings.schoolLogo || '';
    const schoolName = settings.schoolName || 'Our School';
    const recipients = settings.reportEmails || settings.schoolEmail || '';
    const reportPhone = settings.reportPhone || '';
    if (!recipients && !reportPhone) return { success: false, message: 'No Proprietor Report Email or Report Phone Number configured in Settings.' };

    const studentsByTerm = dbGet('/students') || {};
    const customFeeRecords = Object.values(dbGet('/customFeeRecords') || {});
    const incomeExpenses = Object.values(dbGet('/incomeExpenses') || {});
    const uniformSales = Object.values(dbGet('/uniformSales') || {});
    const bookSales = Object.values(dbGet('/bookSales') || {});

    let regSum = 0, customSum = 0, uniSum = 0, bookSum = 0, incSum = 0, expSum = 0;
    const transactions = [];

    Object.keys(studentsByTerm).forEach(function (term) {
      Object.values(studentsByTerm[term] || {}).forEach(function (row) {
        for (let j = 1; j <= 6; j++) {
          const amt = parseFloat(row['inst' + j]) || 0;
          const dVal = String(row['inst' + j + 'Date'] || '').trim();
          if (amt > 0 && dVal === todayStr) {
            regSum += amt;
            transactions.push({ name: row.studentName || '', grade: row.grade || '', item: 'School Fees (Inst ' + j + ')', amount: amt, mode: row.paymentMode || 'Cash' });
          }
        }
      });
    });

    customFeeRecords.forEach(function (row) {
      for (let j = 1; j <= 6; j++) {
        const amt = parseFloat(row['inst' + j]) || 0;
        const dVal = String(row['inst' + j + 'Date'] || '').trim();
        if (amt > 0 && dVal === todayStr) {
          customSum += amt;
          transactions.push({ name: row.studentName || '', grade: row.grade || '', item: (row.feeTypeName || 'Custom Fee') + ' (Inst ' + j + ')', amount: amt, mode: row['inst' + j + 'Mode'] || 'Cash' });
        }
      }
    });

    uniformSales.forEach(function (row) {
      const dVal = String(row.timestamp || '').trim();
      const amt = parseFloat(row.amountPaid) || 0;
      if (amt > 0 && dVal.indexOf(todayStr) === 0) { uniSum += amt; transactions.push({ name: row.studentName || '', grade: row.grade || '', item: 'Uniform Purchase', amount: amt, mode: 'Cash/MoMo' }); }
    });
    bookSales.forEach(function (row) {
      const dVal = String(row.timestamp || '').trim();
      const amt = parseFloat(row.amountPaid) || 0;
      if (amt > 0 && dVal.indexOf(todayStr) === 0) { bookSum += amt; transactions.push({ name: row.studentName || '', grade: row.grade || '', item: 'Book Purchase', amount: amt, mode: 'Cash/MoMo' }); }
    });
    incomeExpenses.forEach(function (row) {
      const dVal = String(row.date || '').trim();
      const amt = parseFloat(row.amount) || 0;
      if (amt > 0 && dVal === todayStr) {
        if (row.type === 'Income') { incSum += amt; transactions.push({ name: 'Misc Operations', grade: 'N/A', item: 'Income: ' + (row.category || '') + ' (' + (row.description || '') + ')', amount: amt, mode: 'Operations' }); }
        else if (row.type === 'Expense') expSum += amt;
      }
    });

    const newAdmissions = [];
    Object.values(studentsByTerm).forEach(function (termStudents) {
      Object.values(termStudents || {}).forEach(function (row) {
        const isNew = row.isNewStudent === true || String(row.isNewStudent).toUpperCase() === 'TRUE';
        const created = String(row.createdAt || '');
        if (isNew && created.indexOf(todayStr) === 0) newAdmissions.push({ name: row.studentName || '', grade: row.grade || '' });
      });
    });

    const activeYr = settings.academicYear || '', activeTerm = settings.activeTerm || 'First Term';
    let regOutstanding = 0; const classOwing = {};
    Object.values(studentsByTerm[activeTerm] || {}).forEach(function (row) {
      const sess = String(row.academicSession || '');
      if (activeYr && sess.indexOf(activeYr) !== 0) return;
      const bal = Math.max(0, parseFloat(row.balance) || 0);
      if (bal > 0) { regOutstanding += bal; const g = row.grade || 'Unassigned'; classOwing[g] = (classOwing[g] || 0) + bal; }
    });
    const extraOutstandingByType = {};
    customFeeRecords.forEach(function (row) {
      const sess = String(row.academicSession || '');
      if (activeYr && sess.indexOf(activeYr) !== 0) return;
      const bal = Math.max(0, parseFloat(row.balance) || 0);
      if (bal > 0) { const name = row.feeTypeName || 'Extra Fee'; extraOutstandingByType[name] = (extraOutstandingByType[name] || 0) + bal; const g = row.grade || 'Unassigned'; classOwing[g] = (classOwing[g] || 0) + bal; }
    });
    const totalExtraOutstanding = Object.keys(extraOutstandingByType).reduce(function (sum, k) { return sum + extraOutstandingByType[k]; }, 0);
    const classOwingList = Object.keys(classOwing).map(function (g) { return { grade: g, amount: classOwing[g] }; }).sort(function (a, b) { return b.amount - a.amount; });

    const totalCollected = regSum + customSum + uniSum + bookSum + incSum;
    const netRevenue = totalCollected - expSum;

    const emailHtml = '<div style="font-family:\'Segoe UI\',Arial,sans-serif;background:#f1f5f9;padding:30px 15px;color:#1e293b;">' +
      '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,.05);overflow:hidden;border:1px solid #e2e8f0;">' +
      '<div style="background:linear-gradient(135deg,' + primaryColor + ',#3b82f6);padding:25px;text-align:center;color:#fff;">' +
      (logoUrl ? '<img src="' + logoUrl + '" style="max-height:70px;border-radius:10px;margin-bottom:12px;background:#fff;padding:4px;">' : '') +
      '<h2 style="margin:0;font-size:22px;font-weight:800;">Daily Accounting Summary</h2>' +
      '<div style="font-size:13px;opacity:.9;margin-top:4px;">' + schoolName + ' &bull; ' + today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div>' +
      '<div style="padding:25px;">' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:25px;"><tr>' +
      '<td style="width:50%;padding-right:8px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #10b981;border-radius:10px;padding:15px;text-align:center;">' +
      '<div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;">Total Collected</div><div style="font-size:18px;font-weight:800;color:#10b981;">' + currency + ' ' + totalCollected.toFixed(2) + '</div></div></td>' +
      '<td style="width:50%;padding-left:8px;"><div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #ef4444;border-radius:10px;padding:15px;text-align:center;">' +
      '<div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;">Total Expenses</div><div style="font-size:18px;font-weight:800;color:#ef4444;">' + currency + ' ' + expSum.toFixed(2) + '</div></div></td></tr>' +
      '<tr><td colspan="2" style="padding-top:12px;"><div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:15px;text-align:center;">' +
      '<div style="font-size:11px;text-transform:uppercase;color:#166534;font-weight:700;">Net Revenue</div><div style="font-size:22px;font-weight:800;color:#15803d;">' + currency + ' ' + netRevenue.toFixed(2) + '</div></div></td></tr></table>' +
      '<h4 style="color:' + primaryColor + ';border-bottom:2px solid #e2e8f0;padding-bottom:8px;font-size:14px;">Collections by Category</h4>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:25px;font-size:13px;">' +
      '<tr><td style="padding:8px 0;">Regular School Fees</td><td style="padding:8px 0;text-align:right;">' + regSum.toFixed(2) + '</td></tr>' +
      '<tr><td style="padding:8px 0;">Custom Fees</td><td style="padding:8px 0;text-align:right;">' + customSum.toFixed(2) + '</td></tr>' +
      '<tr><td style="padding:8px 0;">Uniforms Revenue</td><td style="padding:8px 0;text-align:right;">' + uniSum.toFixed(2) + '</td></tr>' +
      '<tr><td style="padding:8px 0;">Books Revenue</td><td style="padding:8px 0;text-align:right;">' + bookSum.toFixed(2) + '</td></tr>' +
      '<tr><td style="padding:8px 0;">Other Income (Misc)</td><td style="padding:8px 0;text-align:right;">' + incSum.toFixed(2) + '</td></tr></table>' +
      '<h4 style="color:' + primaryColor + ';border-bottom:2px solid #e2e8f0;padding-bottom:8px;font-size:14px;">New Students Admitted Today</h4>' +
      '<div style="margin-bottom:25px;font-size:13px;">' + (newAdmissions.length === 0 ? '<div style="text-align:center;padding:10px;color:#94a3b8;">No new admissions today.</div>' :
        newAdmissions.map(function (a) { return '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;"><strong>' + a.name + '</strong> <span style="color:#64748b;">(' + a.grade + ')</span></div>'; }).join('')) + '</div>' +
      '<h4 style="color:' + primaryColor + ';border-bottom:2px solid #e2e8f0;padding-bottom:8px;font-size:14px;">Money Still Owed, By Fee Type (' + activeTerm + ')</h4>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:25px;font-size:13px;">' +
      '<tr><td style="padding:8px 0;">Regular School Fees</td><td style="padding:8px 0;text-align:right;color:#dc2626;font-weight:600;">' + regOutstanding.toFixed(2) + '</td></tr>' +
      Object.keys(extraOutstandingByType).map(function (name) { return '<tr><td style="padding:8px 0;">' + name + '</td><td style="padding:8px 0;text-align:right;color:#dc2626;font-weight:600;">' + extraOutstandingByType[name].toFixed(2) + '</td></tr>'; }).join('') +
      '<tr><td style="padding:8px 0;font-weight:800;">Total Still Owed</td><td style="padding:8px 0;text-align:right;font-weight:800;color:#dc2626;">' + (regOutstanding + totalExtraOutstanding).toFixed(2) + '</td></tr></table>' +
      '<h4 style="color:' + primaryColor + ';border-bottom:2px solid #e2e8f0;padding-bottom:8px;font-size:14px;">Classes With Unpaid Fees</h4>' +
      '<div style="margin-bottom:25px;">' + (classOwingList.length === 0 ? '<div style="text-align:center;padding:10px;color:#94a3b8;">Every class is fully paid up. 🎉</div>' :
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' + classOwingList.map(function (c) { return '<tr><td style="padding:6px 0;">' + c.grade + '</td><td style="padding:6px 0;text-align:right;color:#dc2626;font-weight:600;">' + currency + ' ' + c.amount.toFixed(2) + '</td></tr>'; }).join('') + '</table>') + '</div>' +
      '<h4 style="color:' + primaryColor + ';border-bottom:2px solid #e2e8f0;padding-bottom:8px;font-size:14px;">Today\'s Transaction Log</h4>' +
      (transactions.length === 0 ? '<div style="text-align:center;padding:15px;color:#94a3b8;">No transactions recorded today.</div>' :
        '<table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;color:#475569;text-align:left;">' +
        '<th style="padding:8px;">Name</th><th style="padding:8px;">Grade</th><th style="padding:8px;">Paid For</th><th style="padding:8px;">Mode</th><th style="padding:8px;text-align:right;">Amt (' + currency + ')</th></tr></thead><tbody>' +
        transactions.map(function (t) { return '<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px;font-weight:600;">' + t.name + '</td><td style="padding:8px;color:#64748b;">' + t.grade + '</td><td style="padding:8px;">' + t.item + '</td><td style="padding:8px;color:#64748b;">' + t.mode + '</td><td style="padding:8px;text-align:right;font-weight:600;">' + t.amount.toFixed(2) + '</td></tr>'; }).join('') + '</tbody></table>') +
      '</div><div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px;text-align:center;font-size:11px;color:#94a3b8;">This email is auto-generated by your School Fees Management System. Please do not reply directly to this mail.</div></div></div>';

    let emailSent = false, smsSent = false, smsError = '';
    if (recipients) {
      MailApp.sendEmail({ to: recipients, subject: '📊 Daily Accounting Report: ' + schoolName + ' [' + todayStr + ']', htmlBody: emailHtml });
      emailSent = true;
    }
    if (reportPhone) {
      const smsMsg = schoolName + ' Daily Report (' + todayStr + '):\n' +
        'Collected today: ' + currency + ' ' + totalCollected.toFixed(2) + '\n' + 'Expenses today: ' + currency + ' ' + expSum.toFixed(2) + '\n' +
        'Net today: ' + currency + ' ' + netRevenue.toFixed(2) + '\n' + 'New admissions today: ' + newAdmissions.length + '\n' +
        'Total still owed (all fees): ' + currency + ' ' + (regOutstanding + totalExtraOutstanding).toFixed(2) + '\n' +
        'Classes owing: ' + (classOwingList.length ? classOwingList.map(function (c) { return c.grade; }).join(', ') : 'None — all paid up');
      const apiKey = settings.arkeselApiKey || '', sender = settings.arkeselSender || schoolName;
      if (apiKey) {
        try {
          const cleanPhone = String(reportPhone).replace(/\D/g, '');
          const url = 'https://sms.arkesel.com/sms/api?action=send-sms&api_key=' + encodeURIComponent(apiKey) + '&to=' + encodeURIComponent(cleanPhone) + '&from=' + encodeURIComponent(sender.substring(0, 11)) + '&sms=' + encodeURIComponent(smsMsg);
          const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
          const parsed = JSON.parse(resp.getContentText());
          smsSent = !!(parsed && (parsed.status === 'success' || parsed.code === 'ok'));
          if (!smsSent) smsError = 'SMS provider did not confirm delivery';
        } catch (smsErr) { smsError = smsErr.message; }
      } else { smsError = 'No SMS API key configured'; }
    }
    return { success: true, emailSent: emailSent, smsSent: smsSent, smsError: smsError };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
