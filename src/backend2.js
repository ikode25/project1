/* Part 2: students & fee records, promotion, extra-fee auto-billing, custom fees, class fee rates */
(function (global) {
  'use strict';
  var I = global.__BACKEND_INTERNAL__;
  var db = I.db, once = I.once, toArray = I.toArray, uid = I.uid, nowIso = I.nowIso, isBoolTrue = I.isBoolTrue,
      getTermFromSession = I.getTermFromSession, err = I.err, getFeeComponentsList = I.getFeeComponentsList,
      TERMS = I.TERMS, DEFAULT_CLASSES = I.DEFAULT_CLASSES;
  var BACKEND = global.__BACKEND__;

  // ── ID generation (RTDB transaction-based atomic counter) ──
  function generateId(term) {
    return once('settings/idPrefix').then(function (prefix) {
      return db.ref('idCounters/' + term).transaction(function (cur) { return (cur || 0) + 1; }).then(function (res) {
        var num = String(res.snapshot.val()).padStart(4, '0');
        if (prefix) return prefix + num;
        var code = term.indexOf("Second") !== -1 ? "ST" : term.indexOf("Third") !== -1 ? "TT" : "FT";
        return "SFMS-" + code + "-" + num;
      });
    });
  }
  BACKEND.getNextIdPreview = function (term) {
    // Preview only — doesn't consume the counter, just reads current+1
    return once('idCounters/' + (term || "First Term")).then(function (cur) {
      return once('settings/idPrefix').then(function (prefix) {
        var num = String((cur || 0) + 1).padStart(4, '0');
        var t = term || "First Term";
        var code = t.indexOf("Second") !== -1 ? "ST" : t.indexOf("Third") !== -1 ? "TT" : "FT";
        return { success: true, nextId: prefix ? prefix + num : "SFMS-" + code + "-" + num };
      });
    }).catch(err);
  };

  function calculateFields(record, comps) {
    var normRec = {};
    Object.keys(record).forEach(function (k) { normRec[String(k).trim().toLowerCase()] = record[k]; });
    var totalFees = 0;
    var discountVal = parseFloat(normRec['discount']) || 0;
    comps.filter(function (c) { return c.isActive; }).forEach(function (c) {
      var cId = String(c.id).trim().toLowerCase();
      if (c.isForNewStudentsOnly && !isBoolTrue(normRec['isnewstudent'])) {
        record[c.id] = 0; normRec[cId] = 0;
      }
      var v = parseFloat(normRec[cId]) || 0;
      if (c.id === 'actualFees') v = Math.max(0, v - discountVal);
      totalFees += v;
    });
    record.totalFees = totalFees;
    var totalPaid = 0;
    for (var i = 1; i <= 6; i++) { var v2 = parseFloat(normRec['inst' + i]); totalPaid += isNaN(v2) ? 0 : v2; }
    record.totalPaid = totalPaid;
    record.balance = totalFees - totalPaid;
    record.paymentStatus = totalFees === 0 ? "No Fees" : record.balance <= 0 ? "Paid" : totalPaid > 0 ? "Partially Paid" : "Unpaid";
  }

  function findStudentTerm(studentId) {
    var target = String(studentId).trim().toLowerCase();
    return Promise.all(TERMS.map(function (term) {
      return once('students/' + term + '/' + encodeKey(studentId)).then(function (rec) { return rec ? { term: term, record: rec } : null; });
    })).then(function (results) {
      var found = results.find(Boolean);
      if (found) return found;
      // fall back to scanning (in case of key casing differences)
      return Promise.all(TERMS.map(function (term) {
        return once('students/' + term).then(function (raw) {
          var students = raw || {};
          var key = Object.keys(students).find(function (k) { return k.toLowerCase() === target; });
          return key ? { term: term, record: students[key], key: key } : null;
        });
      })).then(function (r2) { return r2.find(Boolean) || null; });
    });
  }

  function encodeKey(id) {
    // RTDB keys can't contain . # $ [ ] / — sanitize while staying human-readable
    return String(id).trim().replace(/[.#$\[\]\/]/g, '_');
  }

  BACKEND.saveRecord = function (recordData) {
    return getFeeComponentsList().then(function (comps) {
      var term = getTermFromSession(recordData.academicSession);
      var now = nowIso();
      var idKey = recordData.id ? encodeKey(recordData.id) : null;
      var isUpdate = !!idKey;
      var work = idKey ? once('students/' + term + '/' + idKey) : Promise.resolve(null);
      return work.then(function (existing) {
        var oldDiscount = existing ? (parseFloat(existing.discount) || 0) : 0;
        var chain;
        if (existing) {
          recordData.updatedAt = now;
          if (recordData.phoneNumber) recordData.phoneNumber = String(recordData.phoneNumber);
          calculateFields(recordData, comps);
          chain = db.ref('students/' + term + '/' + idKey).set(recordData).then(function () {
            BACKEND.logActivity('Updated Record', recordData.id + ' - ' + (recordData.studentName || '') + ' (' + (recordData.grade || '') + ')');
            var newDiscount = parseFloat(recordData.discount) || 0;
            if (oldDiscount !== newDiscount) BACKEND.logDiscountChange(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, newDiscount);
            return BACKEND.autoMarkNotificationsRecorded(recordData.id, recordData);
          });
        } else {
          chain = (recordData.id ? Promise.resolve(recordData.id) : generateId(term)).then(function (newId) {
            recordData.id = newId;
            recordData.createdAt = now; recordData.updatedAt = now;
            if (recordData.phoneNumber) recordData.phoneNumber = String(recordData.phoneNumber);
            calculateFields(recordData, comps);
            return db.ref('students/' + term + '/' + encodeKey(newId)).set(recordData).then(function () {
              BACKEND.logActivity('Added Record', recordData.id + ' - ' + (recordData.studentName || '') + ' (' + (recordData.grade || '') + ')');
              var newDiscount = parseFloat(recordData.discount) || 0;
              if (newDiscount > 0) BACKEND.logDiscountChange(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, newDiscount);
              return BACKEND.autoMarkNotificationsRecorded(recordData.id, recordData).then(function () {
                return BACKEND.autoAssignExtraFeesForStudent(recordData);
              });
            });
          });
        }
        return chain.then(function () { return { success: true, record: recordData }; });
      });
    }).catch(err);
  };

  BACKEND.deleteRecord = function (id, session) {
    var term = getTermFromSession(session);
    return db.ref('students/' + term + '/' + encodeKey(id)).remove().then(function () {
      BACKEND.logActivity('Deleted Record', id + ' from ' + term);
      return { success: true };
    }).catch(err);
  };

  BACKEND.getData = function () {
    return Promise.all(TERMS.map(function (term) { return once('students/' + term); }))
      .then(function (results) {
        var records = [];
        results.forEach(function (raw) { records = records.concat(toArray(raw)); });
        return records;
      }).catch(function () { return []; });
  };

  BACKEND.getTermData = function (term) {
    return once('students/' + term).then(toArray).catch(function () { return []; });
  };

  BACKEND.reactivateStudentBackend = function (studentId) {
    return findStudentTerm(studentId).then(function (found) {
      if (!found) return { success: true, message: "Student reactivated successfully!" };
      var key = found.key || encodeKey(studentId);
      return db.ref('students/' + found.term + '/' + key + '/isStopped').set(false)
        .then(function () { return { success: true, message: "Student reactivated successfully!" }; });
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // PROMOTION
  // ════════════════════════════════════════════════════════
  function computeNextSession(session) {
    var yearPart = session.split(' ')[0] || '2025/2026';
    var nextTerm, nextYear = yearPart, shouldPromoteGrade = false;
    if (session.indexOf('First Term') !== -1) nextTerm = 'Second Term';
    else if (session.indexOf('Second Term') !== -1) nextTerm = 'Third Term';
    else {
      var parts = yearPart.split('/');
      if (parts.length === 2) nextYear = (parseInt(parts[0]) + 1) + '/' + (parseInt(parts[1]) + 1);
      nextTerm = 'First Term'; shouldPromoteGrade = true;
    }
    return { nextTerm: nextTerm, nextSession: nextYear + ' ' + nextTerm, shouldPromoteGrade: shouldPromoteGrade };
  }

  function buildPromotedRecord(studentRecord, comps, classes) {
    var next = computeNextSession(String(studentRecord.academicSession || ''));
    var newGrade = studentRecord.grade || '';
    if (next.shouldPromoteGrade && newGrade) {
      var idx = classes.findIndex(function (c) { return String(c).trim().toLowerCase() === String(newGrade).trim().toLowerCase(); });
      if (idx !== -1 && idx < classes.length - 1) newGrade = classes[idx + 1];
    }
    var promoted = Object.assign({}, studentRecord);
    promoted.id = studentRecord.id; promoted.grade = newGrade; promoted.academicSession = next.nextSession;
    promoted.isNewStudent = false; promoted.isStopped = false;
    promoted.arrears = Math.max(0, parseFloat(studentRecord.balance) || 0);
    for (var i = 1; i <= 6; i++) { promoted['inst' + i] = 0; promoted['inst' + i + 'Date'] = ""; }
    comps.forEach(function (c) { if (c.isForNewStudentsOnly) promoted[c.id] = 0; });
    return { promoted: promoted, next: next, newGrade: newGrade };
  }

  BACKEND.promoteStudentToNextTerm = function (studentId) {
    return findStudentTerm(studentId).then(function (found) {
      if (!found) return { success: false, message: "Student record not found in database" };
      var studentRecord = found.record;
      return Promise.all([getFeeComponentsList(), BACKEND.getClasses()]).then(function (r) {
        var comps = r[0], classes = r[1].classes || DEFAULT_CLASSES;
        var built = buildPromotedRecord(studentRecord, comps, classes);
        return once('students/' + built.next.nextTerm + '/' + encodeKey(studentRecord.id)).then(function (existing) {
          if (existing && String(existing.academicSession || '').trim().toLowerCase() === built.next.nextSession.trim().toLowerCase()) {
            return { success: false, message: "Student '" + studentRecord.studentName + "' is already promoted/enrolled in " + built.next.nextSession };
          }
          return BACKEND.saveRecord(built.promoted).then(function (saveRes) {
            if (!saveRes.success) return { success: false, message: "Error saving promoted record: " + saveRes.message };
            BACKEND.logActivity('Promoted Student', studentRecord.studentName + ' (' + studentRecord.grade + ') -> ' + built.next.nextSession + ' (' + built.newGrade + ')');
            BACKEND.logPromotion(saveRes.record.id, studentRecord.studentName, studentRecord.grade, built.newGrade, studentRecord.academicSession, built.next.nextSession);
            return { success: true, message: "Student successfully promoted to " + built.next.nextSession + " in class " + built.newGrade, record: saveRes.record };
          });
        });
      });
    }).catch(err);
  };

  BACKEND.promoteAllStudentsToNextTerm = function (termName, academicYear) {
    return once('students/' + termName).then(function (raw) {
      var records = toArray(raw).filter(function (r) { return !isBoolTrue(r.isStopped) && (academicYear ? String(r.academicSession || '').indexOf(academicYear) === 0 : true); });
      if (!records.length) return { success: false, message: "No active students found in " + termName + " for academic year " + academicYear };
      return Promise.all([getFeeComponentsList(), BACKEND.getClasses()]).then(function (r) {
        var comps = r[0], classes = r[1].classes || DEFAULT_CLASSES;
        var next = computeNextSession(String(records[0].academicSession || '') || academicYear + ' ' + termName);
        return once('students/' + next.nextTerm).then(function (nextRaw) {
          var existingPairs = {};
          Object.keys(nextRaw || {}).forEach(function (k) {
            var rec = nextRaw[k];
            existingPairs[String(rec.id).trim().toLowerCase() + '||' + String(rec.academicSession).trim().toLowerCase()] = true;
          });
          var ok = 0, skipped = 0;
          var work = records.map(function (studentRecord) {
            var pairKey = String(studentRecord.id).trim().toLowerCase() + '||' + next.nextSession.trim().toLowerCase();
            if (existingPairs[pairKey]) { skipped++; return Promise.resolve(); }
            var built = buildPromotedRecord(studentRecord, comps, classes);
            return BACKEND.saveRecord(built.promoted).then(function (saveRes) {
              if (saveRes.success) {
                ok++;
                BACKEND.logPromotion(saveRes.record.id, studentRecord.studentName, studentRecord.grade, built.newGrade, studentRecord.academicSession, next.nextSession);
              }
            });
          });
          return Promise.all(work).then(function () {
            var msg = "Successfully promoted " + ok + " student(s) to " + next.nextSession;
            if (skipped > 0) msg += " (" + skipped + " skipped because they were already promoted).";
            BACKEND.logActivity('Promoted All Students', "From " + termName + " (" + academicYear + ") -> " + next.nextSession + ". Total: " + ok + ", Skipped: " + skipped);
            return { success: true, message: msg };
          });
        });
      });
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // EXTRA FEE AUTO-BILLING ENGINE
  // ════════════════════════════════════════════════════════
  function getExtraFeeClassRate(feeType, grade) {
    if (!feeType) return 0;
    var rates = feeType.classAmounts || feeType.classRates;
    if (rates && grade) {
      var cleanGrade = String(grade).trim().toLowerCase();
      for (var c in rates) {
        if (String(c).trim().toLowerCase() === cleanGrade) { var amt = parseFloat(rates[c]); if (!isNaN(amt)) return amt; }
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
    return once('settings/extraFeeTypes').then(function (raw) {
      if (!raw) return [];
      try {
        var list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(list) ? list.filter(function (f) { return f && f.isActive !== false; }) : [];
      } catch (e) { return []; }
    }).catch(function () { return []; });
  }

  BACKEND.createCustomFeeRecordIfMissing = function (studentId, studentName, grade, academicSession, feeTypeName, amount) {
    studentId = String(studentId || '').trim(); academicSession = String(academicSession || '').trim();
    if (!studentId || !academicSession) return Promise.resolve(false);
    return once('customFeeRecords').then(function (raw) {
      var list = toArray(raw);
      var exists = list.some(function (r) { return String(r.studentId).trim() === studentId && String(r.feeTypeName).trim() === feeTypeName && String(r.academicSession).trim() === academicSession; });
      if (exists) return false;
      return BACKEND.saveCustomFeeRecord({
        studentId: studentId, studentName: studentName || '', grade: grade || '', academicSession: academicSession,
        feeTypeName: feeTypeName, amount: amount, isInstallment: false, numInstallments: 1
      }).then(function () { return true; });
    });
  };

  BACKEND.autoAssignExtraFeesForStudent = function (recordData) {
    return getActiveExtraFeeTypes().then(function (feeTypes) {
      if (!feeTypes.length) return;
      var term = getTermFromSession(recordData.academicSession);
      return Promise.all(feeTypes.map(function (ft) {
        if (!extraFeeAppliesToTerm(ft, term)) return;
        var amount = getExtraFeeClassRate(ft, recordData.grade);
        if (amount <= 0) return;
        return BACKEND.createCustomFeeRecordIfMissing(recordData.id, recordData.studentName, recordData.grade, recordData.academicSession, ft.name, amount);
      }));
    }).catch(function (e) { console.warn('autoAssignExtraFeesForStudent error', e); });
  };

  BACKEND.autoAssignExtraFeeToAllStudents = function (feeType) {
    var billedCount = 0;
    return Promise.all(TERMS.map(function (term) {
      if (!extraFeeAppliesToTerm(feeType, term)) return;
      return once('students/' + term).then(function (raw) {
        var students = toArray(raw).filter(function (r) { return !isBoolTrue(r.isStopped); });
        return Promise.all(students.map(function (r) {
          var amount = getExtraFeeClassRate(feeType, r.grade);
          if (amount <= 0) return;
          return BACKEND.createCustomFeeRecordIfMissing(r.id, r.studentName, r.grade, r.academicSession, feeType.name, amount)
            .then(function (created) { if (created) billedCount++; });
        }));
      });
    })).then(function () { return billedCount; }).catch(function () { return billedCount; });
  };

  // ════════════════════════════════════════════════════════
  // CUSTOM FEE RECORDS
  // ════════════════════════════════════════════════════════
  BACKEND.getCustomStudentFees = function (studentId) {
    return once('customFeeRecords').then(function (raw) {
      var list = toArray(raw);
      if (studentId !== 'all') list = list.filter(function (r) { return String(r.studentId).trim().toLowerCase() === String(studentId).toLowerCase(); });
      return { success: true, history: list };
    }).catch(err);
  };

  BACKEND.saveCustomFeeRecord = function (recordData) {
    var studentId = String(recordData.studentId || '').trim();
    var feeTypeName = String(recordData.feeTypeName || '').trim();
    var academicSession = String(recordData.academicSession || '').trim();
    var now = nowIso();

    var totalPaid = 0;
    var numInst = parseInt(recordData.numInstallments) || 1;
    var amount = parseFloat(recordData.amount) || 0;
    for (var i = 1; i <= 6; i++) {
      if (i <= numInst) totalPaid += parseFloat(recordData['inst' + i]) || 0;
      else { recordData['inst' + i] = 0; recordData['inst' + i + 'Date'] = ''; recordData['inst' + i + 'Mode'] = ''; }
    }
    recordData.totalPaid = totalPaid;
    recordData.balance = Math.max(0, amount - totalPaid);
    recordData.paymentStatus = recordData.balance <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
    recordData.updatedAt = now;

    return once('customFeeRecords').then(function (raw) {
      var list = toArray(raw);
      var found = recordData.id
        ? list.find(function (r) { return String(r.id).trim() === String(recordData.id).trim(); })
        : list.find(function (r) { return String(r.studentId).trim() === studentId && String(r.feeTypeName).trim() === feeTypeName && String(r.academicSession).trim() === academicSession; });

      function resolveNameGrade() {
        if (recordData.studentName && recordData.grade) return Promise.resolve();
        var term = getTermFromSession(academicSession);
        return once('students/' + term + '/' + encodeKey(studentId)).then(function (rec) {
          if (rec) { recordData.studentName = recordData.studentName || rec.studentName; recordData.grade = recordData.grade || rec.grade; }
        }).catch(function () {});
      }

      return resolveNameGrade().then(function () {
        if (found) {
          var merged = Object.assign({}, found, recordData, { id: found.id, updatedAt: now });
          return db.ref('customFeeRecords/' + found._key).set(merged).then(function () {
            BACKEND.logActivity('Updated Custom Fee', studentId + ' - ' + feeTypeName + ' (' + academicSession + ')');
            return { success: true, record: merged };
          });
        } else {
          recordData.id = recordData.id || uid('CF');
          recordData.createdAt = now;
          return db.ref('customFeeRecords').push(recordData).then(function () {
            BACKEND.logActivity('Recorded Custom Fee', studentId + ' - ' + feeTypeName + ' (' + academicSession + ')');
            return { success: true, record: recordData };
          });
        }
      });
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // CLASS FEE RATES
  // ════════════════════════════════════════════════════════
  BACKEND.getClassFeeRates = function () {
    return once('classFeeRates').then(function (raw) {
      var rates = toArray(raw).map(function (r) { return { grade: r.grade, componentId: r.componentId, amount: parseFloat(r.amount) || 0 }; });
      return { success: true, rates: rates };
    }).catch(err);
  };

  BACKEND.saveClassFeeRates = function (rates) {
    var obj = {};
    (rates || []).forEach(function (r) { obj[uid('CFR')] = { grade: r.grade, componentId: r.componentId, amount: parseFloat(r.amount) || 0 }; });
    return db.ref('classFeeRates').set(obj).then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.applyClassFeeRatesToExistingStudents = function (rates) {
    var byClass = {};
    (rates || []).forEach(function (r) {
      var amt = parseFloat(r.amount) || 0; if (amt <= 0) return;
      (byClass[r.grade] = byClass[r.grade] || []).push({ componentId: r.componentId, amount: amt });
    });
    if (!Object.keys(byClass).length) return Promise.resolve(0);
    var billedCount = 0;
    return getFeeComponentsList().then(function (comps) {
      return Promise.all(TERMS.map(function (term) {
        return once('students/' + term).then(function (raw) {
          var students = raw || {};
          var work = [];
          Object.keys(students).forEach(function (key) {
            var rec = students[key];
            if (isBoolTrue(rec.isStopped)) return;
            var classRates = byClass[rec.grade];
            if (!classRates || !classRates.length) return;
            var rowChanged = false;
            classRates.forEach(function (cr) {
              var current = parseFloat(rec[cr.componentId]) || 0;
              if (current > 0) return;
              rec[cr.componentId] = cr.amount; rowChanged = true;
            });
            if (rowChanged) {
              billedCount++;
              var discountVal = parseFloat(rec.discount) || 0;
              var totalFees = 0;
              comps.filter(function (c) { return c.isActive; }).forEach(function (c) {
                var v = parseFloat(rec[c.id]) || 0;
                if (c.id === 'actualFees') v = Math.max(0, v - discountVal);
                totalFees += v;
              });
              rec.totalFees = totalFees;
              rec.balance = totalFees - (parseFloat(rec.totalPaid) || 0);
              work.push(db.ref('students/' + term + '/' + key).set(rec));
            }
          });
          return Promise.all(work);
        });
      })).then(function () { return billedCount; });
    }).catch(function () { return billedCount; });
  };
})(window);
