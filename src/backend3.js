/* Part 3: payment notifications, auto-payment recording, sibling/family payments, messaging, staff chats */
(function (global) {
  'use strict';
  var I = global.__BACKEND_INTERNAL__;
  var db = I.db, once = I.once, toArray = I.toArray, uid = I.uid, nowIso = I.nowIso, todayStr = I.todayStr,
      isBoolTrue = I.isBoolTrue, getTermFromSession = I.getTermFromSession, err = I.err, TERMS = I.TERMS;
  var BACKEND = global.__BACKEND__;

  function encodeKey(id) { return String(id).trim().replace(/[.#$\[\]\/]/g, '_'); }

  // ════════════════════════════════════════════════════════
  // PAYMENT NOTIFICATIONS (parent claims a MoMo payment)
  // ════════════════════════════════════════════════════════
  BACKEND.submitPaymentNotification = function (data) {
    return db.ref('paymentNotifications').push({
      timestamp: nowIso(), studentId: data.studentId || '', studentName: data.studentName || '',
      amount: data.amount || '', reference: data.reference || '', momoNumber: data.momoNumber || '',
      note: data.note || '', status: 'Pending', paymentMethodUsed: data.paymentMethodUsed || ''
    }).then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.getPaymentNotifications = function () {
    return once('paymentNotifications').then(function (raw) {
      var list = toArray(raw).map(function (n) { return Object.assign({}, n, { row: n._key }); });
      return { success: true, notifications: list };
    }).catch(err);
  };

  BACKEND.updateNotificationStatus = function (row, status) {
    return db.ref('paymentNotifications/' + row + '/status').set(status).then(function () {
      return { success: true };
    }).catch(err);
  };

  BACKEND.autoMarkNotificationsRecorded = function (studentId, recordData) {
    if (!studentId) return Promise.resolve();
    var normRec = {};
    Object.keys(recordData).forEach(function (k) { normRec[String(k).trim().toLowerCase()] = recordData[k]; });
    var installments = [];
    for (var j = 1; j <= 6; j++) { var v = parseFloat(normRec['inst' + j]); if (!isNaN(v) && v > 0) installments.push(v); }
    if (!installments.length) return Promise.resolve();
    return once('paymentNotifications').then(function (raw) {
      var target = String(studentId).trim().toLowerCase();
      var confirmed = toArray(raw).filter(function (n) { return String(n.studentId).trim().toLowerCase() === target && String(n.status).trim() === 'Confirmed'; });
      var work = [];
      installments.forEach(function (instAmt) {
        var match = confirmed.find(function (n) { return !n._matched && Math.abs((parseFloat(n.amount) || 0) - instAmt) < 0.01; });
        if (match) { match._matched = true; work.push(db.ref('paymentNotifications/' + match._key + '/status').set('Recorded')); }
      });
      return Promise.all(work);
    }).catch(function (e) { console.warn('autoMarkNotificationsRecorded error', e); });
  };

  // ════════════════════════════════════════════════════════
  // AUTO-RECORD A CONFIRMED PAYMENT (single student or family)
  // ════════════════════════════════════════════════════════
  function findStudentObj(studentId) {
    var target = String(studentId).trim().toLowerCase();
    return Promise.all(TERMS.map(function (term) {
      return once('students/' + term).then(function (raw) {
        var students = raw || {};
        var key = Object.keys(students).find(function (k) { return String(students[k].id).trim().toLowerCase() === target; });
        return key ? { term: term, key: key, record: students[key] } : null;
      });
    })).then(function (results) { return results.find(Boolean) || null; });
  }

  function calculateStudentTotals(rec) {
    var totalFees = parseFloat(rec.totalFees) || 0;
    var totalPaid = parseFloat(rec.totalPaid) || 0;
    return { totalFees: totalFees, totalPaid: totalPaid, balance: Math.max(0, totalFees - totalPaid) };
  }

  function recordSingleAutoPayment(found, amount, ref, momo, note) {
    if (amount <= 0) return Promise.resolve({ success: false, message: 'Amount is 0' });
    var rec = found.record;
    var instIndex = -1;
    for (var j = 1; j <= 6; j++) { if ((parseFloat(rec['inst' + j]) || 0) === 0) { instIndex = j; break; } }
    if (instIndex === -1) return Promise.resolve({ success: false, message: 'No empty slot' });
    rec['inst' + instIndex] = amount;
    rec['inst' + instIndex + 'Date'] = todayStr();
    rec.paymentMode = 'Mobile Money';
    rec.recordedBy = 'Parent Portal (Auto)';
    return BACKEND.saveRecord(rec).then(function (saveRes) {
      return saveRes.success ? { success: true, message: 'Recorded', record: saveRes.record } : { success: false, message: saveRes.message };
    });
  }

  BACKEND.recordPaymentAutomatically = function (studentId, amount, ref, momo, note) {
    if (studentId && String(studentId).indexOf('FAMILY:') === 0) {
      var ids = studentId.substring(7).split(',');
      return Promise.all(ids.map(function (id) { return findStudentObj(id.trim()); }))
        .then(function (founds) {
          var list = founds.filter(Boolean).map(function (f) { return { found: f, balance: calculateStudentTotals(f.record).balance }; });
          var remaining = amount, lastRecord = null;
          function step(i) {
            if (i >= list.length || remaining <= 0) return Promise.resolve();
            var w = list[i];
            var pay = Math.min(remaining, w.balance);
            if (pay <= 0) return step(i + 1);
            return recordSingleAutoPayment(w.found, pay, ref, momo, note).then(function (res) {
              if (res.success) lastRecord = res.record;
              remaining -= pay;
              return step(i + 1);
            });
          }
          return step(0).then(function () {
            if (remaining > 0 && list.length > 0) {
              return recordSingleAutoPayment(list[0].found, remaining, ref, momo, note).then(function (res) {
                if (res.success) lastRecord = res.record;
                return { success: true, message: 'Distributed family payment among siblings.', record: lastRecord };
              });
            }
            return { success: true, message: 'Distributed family payment among siblings.', record: lastRecord };
          });
        }).catch(err);
    }

    var feeTypeName = 'regular';
    if (note && note.indexOf('[Fee Type: ') === 0) {
      var closeIdx = note.indexOf(']');
      if (closeIdx !== -1) feeTypeName = note.substring('[Fee Type: '.length, closeIdx).trim();
    }

    return findStudentObj(studentId).then(function (found) {
      if (!found) return { success: false, message: 'Student not found in any term sheet.' };

      if (feeTypeName === 'regular') {
        return recordSingleAutoPayment(found, amount, ref, momo, note).then(function (res) {
          return res.success ? { success: true, message: 'Automatically recorded into installment', record: res.record } : res;
        });
      }

      return once('customFeeRecords').then(function (raw) {
        var list = toArray(raw);
        var existing = list.find(function (r) { return String(r.studentId).trim() === String(studentId).trim() && String(r.feeTypeName).trim() === feeTypeName && String(r.academicSession).trim() === String(found.record.academicSession).trim(); });
        return once('settings/customFeeTypes').then(function (raw2) {
          var record = existing;
          if (!record) {
            var cfList = []; try { cfList = raw2 ? (typeof raw2 === 'string' ? JSON.parse(raw2) : raw2) : []; } catch (e) {}
            var configItem = cfList.find(function (cf) { return cf.name === feeTypeName; });
            var feeAmount = 0, numInstallments = 1;
            if (configItem) {
              feeAmount = parseFloat(configItem.defaultAmount) || 0;
              if (configItem.classAmounts && configItem.classAmounts[found.record.grade] !== undefined) feeAmount = parseFloat(configItem.classAmounts[found.record.grade]) || 0;
              numInstallments = parseInt(configItem.numInstallments) || 1;
            }
            record = {
              studentId: studentId, studentName: found.record.studentName, grade: found.record.grade,
              academicSession: found.record.academicSession, feeTypeName: feeTypeName, amount: feeAmount,
              isInstallment: numInstallments > 1, numInstallments: numInstallments
            };
            for (var i = 1; i <= 6; i++) { record['inst' + i] = 0; record['inst' + i + 'Date'] = ''; record['inst' + i + 'Mode'] = ''; }
          }
          var instIndex = -1;
          var allowedInst = parseInt(record.numInstallments) || 1;
          for (var j = 1; j <= Math.min(allowedInst, 6); j++) { if ((parseFloat(record['inst' + j]) || 0) === 0) { instIndex = j; break; } }
          if (instIndex === -1) return { success: false, message: 'All allowed installment slots for this custom fee are already filled.' };
          record['inst' + instIndex] = amount;
          record['inst' + instIndex + 'Date'] = todayStr();
          record['inst' + instIndex + 'Mode'] = 'Mobile Money';
          record.paymentMode = 'Mobile Money';
          record.recordedBy = 'Parent Portal (Auto)';
          return BACKEND.saveCustomFeeRecord(record).then(function (saveRes) {
            return saveRes.success
              ? { success: true, message: 'Automatically recorded custom fee into ' + feeTypeName, record: found.record, customRecord: saveRes.record }
              : { success: false, message: 'Failed to save updated custom fee record: ' + saveRes.message };
          });
        });
      });
    }).catch(err);
  };

  BACKEND.recordSiblingPayments = function (wardsPaymentsJson, date, mode) {
    var list;
    try { list = JSON.parse(wardsPaymentsJson); } catch (e) { return Promise.resolve({ success: false, message: 'Invalid payload' }); }
    var updated = [];
    function step(i) {
      if (i >= list.length) return Promise.resolve();
      var item = list[i];
      var amount = parseFloat(item.amount) || 0;
      if (amount <= 0) return step(i + 1);
      return findStudentObj(item.id).then(function (found) {
        if (!found) return step(i + 1);
        var rec = found.record;
        var instIndex = -1;
        for (var j = 1; j <= 6; j++) { if ((parseFloat(rec['inst' + j]) || 0) === 0) { instIndex = j; break; } }
        if (instIndex === -1) return step(i + 1);
        rec['inst' + instIndex] = amount;
        rec['inst' + instIndex + 'Date'] = date;
        rec.paymentMode = mode;
        rec.recordedBy = 'Admin (Family)';
        return BACKEND.saveRecord(rec).then(function (saveRes) {
          if (saveRes.success) updated.push(saveRes.record);
          return step(i + 1);
        });
      });
    }
    return step(0).then(function () { return { success: true, updatedRecords: updated }; }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // PARENT ↔ ADMIN MESSAGING
  // ════════════════════════════════════════════════════════
  BACKEND.sendParentMessage = function (data) {
    var id = 'MSG' + Date.now();
    return db.ref('messages').push({
      id: id, timestamp: I.fmtDateTime(new Date()), studentId: data.studentId || '', studentName: data.studentName || '',
      sender: 'parent', type: data.type || 'text', content: data.content || '', read: false, adminReply: '', replyTimestamp: ''
    }).then(function () { return { success: true, id: id }; }).catch(err);
  };

  BACKEND.getAdminMessages = function () {
    return once('messages').then(function (raw) {
      var list = toArray(raw);
      var unread = list.filter(function (m) { return !isBoolTrue(m.read); }).length;
      var msgs = list.map(function (m) { return Object.assign({}, m, { row: m._key, replyTs: m.replyTimestamp || '' }); }).reverse();
      return { success: true, messages: msgs, unread: unread };
    }).catch(err);
  };

  BACKEND.replyToMessage = function (row, reply) {
    return db.ref('messages/' + row).update({ read: true, adminReply: reply, replyTimestamp: I.fmtDateTime(new Date()) })
      .then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.getParentMessages = function (studentId) {
    return once('messages').then(function (raw) {
      var target = studentId.trim().toLowerCase();
      var msgs = toArray(raw).filter(function (m) { return String(m.studentId).trim().toLowerCase() === target; })
        .map(function (m) { return { id: m.id, timestamp: m.timestamp, type: m.type, content: m.content, adminReply: m.adminReply || '', replyTs: m.replyTimestamp || '' }; })
        .reverse();
      return { success: true, messages: msgs };
    }).catch(err);
  };

  BACKEND.markMessagesRead = function (rows) {
    return Promise.all((rows || []).map(function (row) { return db.ref('messages/' + row + '/read').set(true); }))
      .then(function () { return { success: true }; }).catch(function () { return { success: false }; });
  };

  // ════════════════════════════════════════════════════════
  // STAFF CHATS
  // ════════════════════════════════════════════════════════
  BACKEND.getUserChatHistory = function (role, username) {
    return once('staffChats').then(function (raw) {
      var history = toArray(raw).filter(function (c) {
        return String(c.role).trim().toLowerCase() === String(role).trim().toLowerCase() && String(c.username).trim().toLowerCase() === String(username).trim().toLowerCase();
      }).map(function (c) { return Object.assign({}, c, { row: c._key }); });
      return { success: true, history: history };
    }).catch(function (e) { return { success: false, message: e.message, history: [] }; });
  };

  BACKEND.sendUserChatMessage = function (role, username, content) {
    var id = "UC-" + Date.now();
    return db.ref('staffChats').push({ id: id, timestamp: nowIso(), role: role, username: username, sender: role, content: content, read: false, reply: "", replyTimestamp: "" })
      .then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.getAdminUserChats = function () {
    return once('staffChats').then(function (raw) {
      var list = toArray(raw);
      var unread = list.filter(function (c) { return !isBoolTrue(c.read) && !String(c.reply || '').trim(); }).length;
      var chats = list.map(function (c) { return Object.assign({}, c, { row: c._key }); });
      return { success: true, chats: chats, unread: unread };
    }).catch(function (e) { return { success: false, message: e.message, chats: [], unread: 0 }; });
  };

  BACKEND.replyToUserChat = function (row, reply) {
    return db.ref('staffChats/' + row).update({ read: true, reply: reply, replyTimestamp: nowIso() })
      .then(function () { return { success: true }; }).catch(err);
  };
})(window);
