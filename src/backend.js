/* ============================================================
   Firebase-backed replacement for Code.gs
   ------------------------------------------------------------
   Implements the exact same function names / argument order /
   return shapes as the original Apps Script backend so the
   unmodified admin (admin.html) and parent portal (portal.html)
   UI code keeps working unchanged. Each function is exposed on
   window.__BACKEND__ and dispatched to by the google.script.run
   shim (see shim.js).

   Data lives in Firebase Realtime Database. A handful of
   operations that need real secrets or Google Drive/Gmail
   (parent OTP SMS, the daily accounting email, student photo
   upload, and the two "secure settings" fields) are bridged to
   the existing Apps Script Web App instead — see APPS_SCRIPT_URL.
   ============================================================ */
(function (global) {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyC_W__0g7E0Lg1qDKM9CNHn_dS6_K7l26A",
    authDomain: "fees-1f58a.firebaseapp.com",
    databaseURL: "https://fees-1f58a-default-rtdb.firebaseio.com",
    projectId: "fees-1f58a",
    storageBucket: "fees-1f58a.firebasestorage.app",
    messagingSenderId: "90264723410",
    appId: "1:90264723410:web:d7e4cc9bbdbdbffeed720b",
    measurementId: "G-KYWY1RBN4Y"
  };

  var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbweB2UbaMxFiRbdJ9s71xnKL1C_Ak15HqS9bdLskkxrZzf4YWR5fcX-uOt4mUD8Va8/exec";

  if (!global.firebase.apps || !global.firebase.apps.length) {
    global.firebase.initializeApp(firebaseConfig);
  }
  var db = global.firebase.database();

  // Silently identify this app to Firebase (no password prompt, invisible to
  // the user) so the database rules can require "auth != null" on writes —
  // that blocks anyone hitting the database directly with a script, while
  // every real use of this app keeps working exactly as before.
  var authReady = global.firebase.auth().signInAnonymously()
    .catch(function (e) { console.error('Anonymous sign-in failed — writes will be rejected by Firebase rules:', e); });
  global.__AUTH_READY__ = authReady;

  var TERMS = ["First Term", "Second Term", "Third Term"];
  var DEFAULT_COMPONENTS = [
    { id: "arrears", name: "Arrears", defaultAmount: 0, isActive: true, isForNewStudentsOnly: false, order: 1 },
    { id: "actualFees", name: "Tuition Fees", defaultAmount: 0, isActive: true, isForNewStudentsOnly: false, order: 2 },
    { id: "books", name: "Books", defaultAmount: 0, isActive: true, isForNewStudentsOnly: false, order: 3 },
    { id: "pta", name: "PTA", defaultAmount: 0, isActive: true, isForNewStudentsOnly: false, order: 4 },
    { id: "cleaning", name: "Cleaning", defaultAmount: 0, isActive: true, isForNewStudentsOnly: false, order: 5 },
    { id: "admissionFees", name: "Admission Fees", defaultAmount: 0, isActive: true, isForNewStudentsOnly: true, order: 6 }
  ];
  var DEFAULT_CLASSES = [
    "Creche", "Nursery 1", "Nursery 2", "KG 1", "KG 2",
    "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
    "JHS 1", "JHS 2", "JHS 3"
  ];

  // ── generic helpers ──────────────────────────────────────
  function nowIso() { return new Date().toISOString(); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDateTime(d) {
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function isBoolTrue(val) {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    var s = String(val).trim().toUpperCase();
    return s === 'TRUE' || s === 'YES' || s === '1';
  }
  function escapeRegExp(string) { return String(string).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); }
  function getTermFromSession(session) {
    if (!session) return "First Term";
    var s = String(session);
    if (s.indexOf("Second") !== -1) return "Second Term";
    if (s.indexOf("Third") !== -1) return "Third Term";
    return "First Term";
  }
  function once(path) { return db.ref(path).once('value').then(function (s) { return s.val(); }); }
  function toArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(function (v) { return v !== null && v !== undefined; });
    return Object.keys(val).map(function (k) { return Object.assign({ _key: k }, val[k]); });
  }
  function err(e) { return { success: false, message: (e && e.message) || String(e) }; }

  // Bridge to the Apps Script web app for the few things that need real
  // secrets / Gmail / Drive. Uses no-cors-safe simple POST with JSON body.
  function callAppsScript(action, payload) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify(Object.assign({ action: action }, payload || {}))
    }).then(function (r) { return r.json(); })
      .catch(function (e) { return { success: false, message: 'Apps Script bridge error: ' + e.message }; });
  }

  var BACKEND = {};

  // ── in-memory session (replaces Apps Script UserProperties) ──
  var _sessionUser = null;

  // ════════════════════════════════════════════════════════
  // SETTINGS
  // ════════════════════════════════════════════════════════
  BACKEND.getSettings = function () {
    return once('settings').then(function (raw) {
      var s = raw || {};
      return callAppsScript('getSecureSettings', {}).then(function (secure) {
        if (secure && secure.success) {
          s.schoolApiUrl = secure.schoolApiUrl || '';
          s.schoolApiKey = secure.hasApiKey ? '••••••••••••••••' : '';
        }
        return { success: true, settings: s };
      }).catch(function () { return { success: true, settings: s }; });
    }).catch(err);
  };

  BACKEND.saveSettings = function (settingsData) {
    settingsData = settingsData || {};
    var secure = {}, plain = {};
    Object.keys(settingsData).forEach(function (k) {
      if (k === 'schoolApiUrl' || k === 'schoolApiKey') secure[k] = settingsData[k];
      else plain[k] = settingsData[k];
    });
    var work = [];
    if (Object.keys(secure).length) work.push(callAppsScript('saveSecureSettings', secure));
    if (Object.keys(plain).length) work.push(db.ref('settings').update(plain));
    // Mirror the enableAutoDailyEmail trigger toggle server-side (needs Apps Script trigger APIs)
    if (plain.hasOwnProperty('enableAutoDailyEmail')) {
      work.push(callAppsScript('toggleDailyEmailTrigger', { enabled: isBoolTrue(plain.enableAutoDailyEmail) }));
    }
    return Promise.all(work).then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.uploadSchoolLogo = function (base64) { return BACKEND.saveSettings({ schoolLogo: base64 }); };
  BACKEND.uploadSchoolStamp = function (base64) { return BACKEND.saveSettings({ schoolStamp: base64 }); };
  BACKEND.uploadSignature = function (base64) { return BACKEND.saveSettings({ signature: base64 }); };

  BACKEND.getScriptUrl = function () {
    // This backend runs inside a srcdoc iframe, whose own location is
    // "about:srcdoc" — reach up to the real parent page URL instead so
    // "open portal in a new tab" (?page=portal) links resolve correctly.
    var loc = (global.parent && global.parent !== global) ? global.parent.location : global.location;
    return Promise.resolve(loc.origin + loc.pathname);
  };

  // ════════════════════════════════════════════════════════
  // FEE COMPONENTS
  // ════════════════════════════════════════════════════════
  function getFeeComponentsList() {
    return once('feeComponents').then(function (raw) {
      var list = toArray(raw).map(function (c) {
        return {
          id: String(c.id).trim(), name: String(c.name).trim(),
          defaultAmount: parseFloat(c.defaultAmount) || 0,
          isActive: isBoolTrue(c.isActive), isForNewStudentsOnly: isBoolTrue(c.isForNewStudentsOnly),
          order: parseInt(c.order) || 0
        };
      }).sort(function (a, b) { return a.order - b.order; });
      return list.length ? list : DEFAULT_COMPONENTS;
    });
  }

  BACKEND.getFeeComponents = function () {
    return getFeeComponentsList().then(function (components) { return { success: true, components: components }; }).catch(err);
  };

  BACKEND.addFeeComponent = function (data) {
    return getFeeComponentsList().then(function (list) {
      var baseId = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      var id = baseId, suffix = 2;
      var existing = list.map(function (c) { return c.id; });
      while (existing.indexOf(id) !== -1) { id = baseId + suffix; suffix++; }
      return db.ref('feeComponents/' + id).set({
        id: id, name: data.name, defaultAmount: 0, isActive: true,
        isForNewStudentsOnly: !!data.isForNewStudentsOnly, order: list.length + 1
      }).then(function () { return { success: true, id: id }; });
    }).catch(err);
  };

  BACKEND.deleteFeeComponent = function (id) {
    return db.ref('feeComponents/' + id).remove().then(function () { return { success: true }; }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // CLASSES
  // ════════════════════════════════════════════════════════
  BACKEND.getClasses = function () {
    return once('classes').then(function (raw) {
      var classes = toArray(raw).map(function (c) { return typeof c === 'string' ? c : c.name; }).filter(Boolean);
      return { success: true, classes: classes.length ? classes : DEFAULT_CLASSES };
    }).catch(function () { return { success: true, classes: DEFAULT_CLASSES }; });
  };

  BACKEND.saveClasses = function (classList) {
    var clean = (classList || []).filter(Boolean).map(function (c) { return String(c).trim(); });
    return db.ref('classes').set(clean).then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.renameClass = function (oldName, newName) {
    oldName = String(oldName || '').trim(); newName = String(newName || '').trim();
    if (!oldName || !newName) return Promise.resolve({ success: false, message: 'Both class names are required' });
    if (oldName === newName) return Promise.resolve({ success: true, updatedStudents: 0 });
    return BACKEND.getClasses().then(function (r) {
      var list = r.classes.map(function (c) { return c === oldName ? newName : c; });
      return BACKEND.saveClasses(list);
    }).then(function () {
      var updated = 0;
      return Promise.all(TERMS.map(function (term) {
        return once('students/' + term).then(function (raw) {
          var students = raw || {};
          var work = [];
          Object.keys(students).forEach(function (id) {
            if (String(students[id].grade || '').trim() === oldName) {
              updated++;
              work.push(db.ref('students/' + term + '/' + id + '/grade').set(newName));
            }
          });
          return Promise.all(work);
        });
      })).then(function () {
        return once('classFeeRates').then(function (raw) {
          var rates = raw || {}; var work = [];
          Object.keys(rates).forEach(function (k) {
            if (String(rates[k].grade || '').trim() === oldName) {
              work.push(db.ref('classFeeRates/' + k + '/grade').set(newName));
            }
          });
          return Promise.all(work);
        }).then(function () {
          BACKEND.logActivity('Renamed Class', oldName + ' → ' + newName + ' (' + updated + ' student records updated)');
          return { success: true, updatedStudents: updated };
        });
      });
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // ONLINE PRESENCE (replaces CacheService heartbeat)
  // ════════════════════════════════════════════════════════
  BACKEND.registerHeartbeat = function (username, role) {
    var now = Date.now();
    return db.ref('onlineUsers/' + encodeURIComponent(username)).set({ username: username, role: role, timestamp: now })
      .then(function () { return once('onlineUsers'); })
      .then(function (raw) {
        var users = toArray(raw).filter(function (u) { return (now - u.timestamp) < 120000; });
        return { success: true, onlineCount: users.length, users: users.map(function (u) { return { username: u.username, role: u.role }; }) };
      }).catch(function (e) { return { success: false, message: e.message, onlineCount: 1, users: [] }; });
  };

  BACKEND.unregisterHeartbeat = function (username) {
    return db.ref('onlineUsers/' + encodeURIComponent(username)).remove().then(function () { return { success: true }; }).catch(function () { return { success: false }; });
  };

  // ════════════════════════════════════════════════════════
  // AUTH / USERS
  // ════════════════════════════════════════════════════════
  BACKEND.authenticateUser = function (email, name, password, auditData) {
    return once('users').then(function (raw) {
      var users = toArray(raw);
      var cleanId = String(email || name || '').trim().toLowerCase();
      var cleanPwd = String(password || '').trim();
      var match = users.find(function (u) {
        var dbEmail = String(u.email || '').trim().toLowerCase();
        var dbName = String(u.name || '').trim().toLowerCase();
        var dbPwd = String(u.password || '').trim();
        return (cleanId && dbEmail === cleanId && dbPwd === cleanPwd) ||
               (cleanId && dbName === cleanId && dbPwd === cleanPwd);
      });
      if (!match) return { success: false, message: "Invalid credentials" };
      var userObj = { email: match.email, name: match.name, role: match.role };
      _sessionUser = Object.assign({ _key: match._key }, userObj);
      var work = [db.ref('users/' + match._key + '/lastLogin').set(nowIso())];
      if (auditData) work.push(BACKEND.logLoginAudit(userObj.email || userObj.name, userObj.role, auditData));
      return Promise.all(work).then(function () { return { success: true, user: userObj }; });
    }).catch(err);
  };

  BACKEND.changePassword = function (currentPassword, newPassword, newUsername) {
    return once('users').then(function (raw) {
      var users = toArray(raw);
      var match = null;
      if (_sessionUser) {
        match = users.find(function (u) { return u._key === _sessionUser._key; });
      }
      if (!match) {
        var candidates = users.filter(function (u) { return String(u.password || '').trim() === String(currentPassword || '').trim(); });
        if (candidates.length === 1) match = candidates[0];
      }
      if (!match) return { success: false, message: "Not logged in" };
      if (String(match.password || '').trim() !== String(currentPassword || '').trim()) return { success: false, message: "Current password incorrect" };
      var updates = { password: newPassword };
      if (newUsername && _sessionUser && _sessionUser.role === 'admin') updates.name = newUsername;
      return db.ref('users/' + match._key).update(updates).then(function () {
        if (_sessionUser) { _sessionUser.name = updates.name || _sessionUser.name; }
        return { success: true };
      });
    }).catch(err);
  };

  BACKEND.addUser = function (email, name, password, role) {
    return db.ref('users').push({ email: email || "", name: name, password: password, role: role, lastLogin: "" })
      .then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.getUsers = function () {
    return once('users').then(function (raw) {
      var users = toArray(raw).filter(function (u) { return u.name || u.email; })
        .map(function (u) { return { email: u.email || '', name: u.name || '', role: u.role || '', password: u.password || '' }; });
      return { success: true, users: users };
    }).catch(err);
  };

  function findUserKey(email, name) {
    return once('users').then(function (raw) {
      var users = toArray(raw);
      var match = users.find(function (u) { return (email && u.email === email) || (name && u.name === name); });
      return match ? match._key : null;
    });
  }

  BACKEND.deleteUser = function (email, name) {
    return findUserKey(email, name).then(function (key) {
      if (!key) return { success: false, message: "Not found" };
      return db.ref('users/' + key).remove().then(function () { return { success: true }; });
    }).catch(err);
  };

  BACKEND.editUser = function (oldEmail, oldName, newEmail, newName, newPassword, newRole) {
    return findUserKey(oldEmail, oldName).then(function (key) {
      if (!key) return { success: false, message: "User not found" };
      return db.ref('users/' + key).update({ email: newEmail || "", name: newName, password: newPassword, role: newRole }).then(function () {
        BACKEND.logActivity('Edited User', oldName + ' -> ' + newName + ' (' + newRole + ')');
        return { success: true };
      });
    }).catch(err);
  };

  global.__BACKEND__ = BACKEND;
  global.__BACKEND_INTERNAL__ = {
    db: db, once: once, toArray: toArray, uid: uid, nowIso: nowIso, todayStr: todayStr, fmtDateTime: fmtDateTime,
    isBoolTrue: isBoolTrue, escapeRegExp: escapeRegExp, getTermFromSession: getTermFromSession, err: err,
    callAppsScript: callAppsScript, getFeeComponentsList: getFeeComponentsList, TERMS: TERMS,
    DEFAULT_COMPONENTS: DEFAULT_COMPONENTS, DEFAULT_CLASSES: DEFAULT_CLASSES,
    getSessionUser: function () { return _sessionUser; }
  };
})(window);
