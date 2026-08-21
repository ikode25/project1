/* Part 4: SMS, logs, income/expenses, reports, backup, promotion/discount history,
   uniform & book sales, import/export, parent portal lookup, misc bridges */
(function (global) {
  'use strict';
  var I = global.__BACKEND_INTERNAL__;
  var db = I.db, once = I.once, toArray = I.toArray, uid = I.uid, nowIso = I.nowIso, todayStr = I.todayStr,
      fmtDateTime = I.fmtDateTime, isBoolTrue = I.isBoolTrue, getTermFromSession = I.getTermFromSession, err = I.err,
      getFeeComponentsList = I.getFeeComponentsList, callAppsScript = I.callAppsScript, TERMS = I.TERMS;
  var BACKEND = global.__BACKEND__;

  function encodeKey(id) { return String(id).trim().replace(/[.#$\[\]\/]/g, '_'); }
  function push(path, obj) { return db.ref(path).push(obj); }
  function simpleList(path, mapFn) {
    return once(path).then(function (raw) { return { success: true, list: toArray(raw).map(mapFn || function (x) { return x; }) }; }).catch(err);
  }

  // ════════════════════════════════════════════════════════
  // SMS (Arkesel) — bulk sends stay client-side (as in the original),
  // OTP send is bridged to Apps Script since it must work for anonymous
  // parent-portal visitors without exposing the API key to them.
  // ════════════════════════════════════════════════════════
  BACKEND.getArkeselConfig = function () {
    return BACKEND.getSettings().then(function (s) {
      var settings = s.settings || {};
      return { success: true, apiKey: settings.arkeselApiKey || '', sender: settings.arkeselSender || settings.schoolName || 'School',
               currency: settings.currency || 'GHC', schoolName: settings.schoolName || 'School' };
    }).catch(err);
  };

  BACKEND.sendParentVerificationCode = function (phone, otp) {
    return callAppsScript('sendParentVerificationCode', { phone: phone, otp: otp });
  };

  BACKEND.getBulkSmsRecipients = function (filters) {
    filters = filters || {};
    return Promise.all([BACKEND.getData(), BACKEND.getSettings()]).then(function (r) {
      var records = r[0], settings = r[1].settings || {};
      var currency = settings.currency || 'GHC';
      var targets = records;
      if (filters.term && filters.term !== 'all') targets = targets.filter(function (x) { return String(x.academicSession || '').indexOf(filters.term) !== -1; });
      if (filters.grade && filters.grade !== 'all') targets = targets.filter(function (x) { return String(x.grade || '').toLowerCase() === String(filters.grade).toLowerCase(); });
      if (filters.status && filters.status !== 'all') {
        var status = filters.status.toLowerCase();
        targets = targets.filter(function (x) {
          var b = parseFloat(x.balance) || 0, p = parseFloat(x.totalPaid) || 0, f = parseFloat(x.totalFees) || 0;
          if (status === 'unpaid') return f > 0 && p === 0;
          if (status === 'partial') return p > 0 && b > 0;
          if (status === 'paid') return f > 0 && b <= 0;
          if (status === 'owing') return b > 0;
          return true;
        });
      }
      targets = targets.filter(function (x) { return String(x.phoneNumber || '').replace(/\D/g, '').length >= 9; });
      var seen = {}, unique = [];
      targets.forEach(function (r2) { var num = String(r2.phoneNumber).replace(/\D/g, ''); if (!seen[num]) { seen[num] = true; unique.push(r2); } });
      var recipients = unique.map(function (r2) {
        return {
          name: r2.studentName || '', id: r2.id || '', grade: r2.grade || '', session: r2.academicSession || '', phone: r2.phoneNumber || '',
          fees: currency + ' ' + (parseFloat(r2.totalFees) || 0).toFixed(2), paid: currency + ' ' + (parseFloat(r2.totalPaid) || 0).toFixed(2),
          balance: currency + ' ' + Math.max(0, parseFloat(r2.balance) || 0).toFixed(2)
        };
      });
      return { success: true, recipients: recipients, total: recipients.length, currency: currency, schoolName: settings.schoolName || 'School' };
    }).catch(err);
  };

  BACKEND.logSmsActivity = function (log) {
    return push('smsLog', { timestamp: nowIso(), sent: log.sent || 0, failed: log.failed || 0, total: log.total || 0, filters: log.filters || '', sampleMessage: (log.sampleMessage || '').substring(0, 100) })
      .then(function () { return { success: true }; }).catch(function () { return { success: false }; });
  };

  BACKEND.logSmsHistory = function (logs) {
    return Promise.all((logs || []).map(function (l) {
      return push('smsHistory', { timestamp: l.timestamp || nowIso(), recipient: l.recipient || '', phone: l.phone || '', message: l.message || '', status: l.status || '', type: l.type || 'Single' });
    })).then(function () { return { success: true }; }).catch(err);
  };

  BACKEND.getSmsHistory = function () {
    return once('smsHistory').then(function (raw) { return { success: true, history: toArray(raw).reverse() }; }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // ACTIVITY / AUDIT LOGS
  // ════════════════════════════════════════════════════════
  BACKEND.logActivity = function (action, details, user) {
    return push('activityLog', { timestamp: nowIso(), action: action || '', details: details || '', user: user || 'System' }).catch(function () {});
  };

  BACKEND.getActivityLogs = function () {
    return once('activityLog').then(function (raw) {
      var logs = toArray(raw).map(function (l) { return { timestamp: (l.timestamp || '').substring(0, 19).replace('T', ' '), action: l.action || '', details: l.details || '', user: l.user || '' }; }).reverse();
      return { success: true, logs: logs };
    }).catch(function (e) { return { success: false, message: e.message, logs: [] }; });
  };

  BACKEND.logLoginAudit = function (user, role, auditData) {
    auditData = auditData || {};
    return push('auditTrail', {
      timestamp: nowIso(), user: user || 'Unknown', role: role || 'Unknown', ipAddress: auditData.ipAddress || 'Unknown',
      deviceName: auditData.deviceName || 'Unknown', deviceType: auditData.deviceType || 'Unknown', macAddress: auditData.macAddress || 'Unknown'
    }).then(function () { return { success: true }; }).catch(function (e) { return { success: false, message: e.message }; });
  };

  BACKEND.getAuditTrailLogs = function () {
    return once('auditTrail').then(function (raw) {
      var logs = toArray(raw).map(function (l) { return Object.assign({}, l, { timestamp: (l.timestamp || '').substring(0, 19).replace('T', ' ') }); }).reverse();
      return { success: true, logs: logs };
    }).catch(function (e) { return { success: false, message: e.message, logs: [] }; });
  };

  // ════════════════════════════════════════════════════════
  // INCOME & EXPENSES
  // ════════════════════════════════════════════════════════
  BACKEND.getIncomeExpenses = function () {
    return once('incomeExpenses').then(function (raw) { return { success: true, entries: toArray(raw) }; }).catch(err);
  };
  BACKEND.saveIncomeExpense = function (data) {
    var id = 'IE-' + Date.now();
    return db.ref('incomeExpenses/' + id).set({ id: id, date: data.date, type: data.type, category: data.category, description: data.description, amount: parseFloat(data.amount) || 0, createdAt: nowIso() })
      .then(function () { return { success: true, id: id }; }).catch(err);
  };
  BACKEND.deleteIncomeExpense = function (id) {
    return once('incomeExpenses').then(function (raw) {
      var list = toArray(raw);
      var match = list.find(function (e2) { return String(e2.id) === String(id); });
      if (!match) return { success: false, message: 'Entry not found' };
      return db.ref('incomeExpenses/' + match._key).remove().then(function () { return { success: true }; });
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // REPORTS
  // ════════════════════════════════════════════════════════
  BACKEND.getReportData = function (filters) {
    filters = filters || {};
    return Promise.all([getFeeComponentsList(), BACKEND.getData(), once('customFeeRecords'), once('settings/customFeeTypes'), once('incomeExpenses')])
      .then(function (r) {
        var comps = r[0].filter(function (c) { return c.isActive; });
        var allRowsRaw = r[1];
        var cfRaw = r[2] || {};
        var customFeeTypesList = []; try { customFeeTypesList = r[3] ? (typeof r[3] === 'string' ? JSON.parse(r[3]) : r[3]) : []; } catch (e) {}
        var ieList = toArray(r[4]);

        var allRows = allRowsRaw.filter(function (row) {
          if (filters.term && filters.term !== 'all' && String(row.academicSession || '').indexOf(filters.term) === -1) return false;
          if (filters.grade && filters.grade !== 'all' && row.grade !== filters.grade) return false;
          if (filters.year && filters.year !== 'all' && String(row.academicSession || '').indexOf(filters.year) !== 0) return false;
          return true;
        });

        var totalFees = 0, totalPaid = 0, paidCount = 0, partialCount = 0, unpaidCount = 0;
        var dailyCollected = 0, weeklyCollected = 0, termlyCollected = 0;
        var todayS = todayStr();
        var today = new Date(); var weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
        var gradeMap = {}, compMap = {};
        comps.forEach(function (c) { compMap[c.id] = { name: c.name, total: 0 }; });
        var studentMap = {};
        allRows.forEach(function (r2) { studentMap[String(r2.id) + '_' + String(r2.academicSession)] = r2; });

        allRows.forEach(function (r2) {
          var fees = 0, paid = 0;
          comps.forEach(function (c) { var v = parseFloat(r2[c.id]) || 0; fees += v; compMap[c.id].total += v; });
          for (var i = 1; i <= 6; i++) {
            var amt = parseFloat(r2['inst' + i]) || 0; paid += amt;
            if (amt > 0) {
              var dStr = String(r2['inst' + i + 'Date'] || '').trim();
              if (dStr === todayS) dailyCollected += amt;
              if (dStr) { var d = new Date(dStr); if (d >= weekAgo && d <= today) weeklyCollected += amt; }
              termlyCollected += amt;
            }
          }
          totalFees += fees; totalPaid += paid;
          var bal = fees - paid;
          if (fees > 0) { if (bal <= 0) paidCount++; else if (paid > 0) partialCount++; else unpaidCount++; }
          var g = r2.grade || 'Unknown';
          if (!gradeMap[g]) gradeMap[g] = { students: 0, fees: 0, paid: 0 };
          gradeMap[g].students++; gradeMap[g].fees += fees; gradeMap[g].paid += paid;
        });

        var customFeesMap = {};
        customFeeTypesList.forEach(function (cf) { customFeesMap[cf.name] = { billed: 0, paid: 0 }; });
        Object.keys(cfRaw).forEach(function (k) {
          var row = cfRaw[k];
          var studentKey = String(row.studentId || '') + '_' + String(row.academicSession || '');
          var r2 = studentMap[studentKey];
          if (!r2) return;
          var sess = String(row.academicSession || '');
          if (filters.term && filters.term !== 'all' && sess.indexOf(filters.term) === -1) return;
          if (filters.year && filters.year !== 'all' && sess.indexOf(filters.year) !== 0) return;
          if (filters.grade && filters.grade !== 'all' && r2.grade !== filters.grade) return;
          var fAmount = parseFloat(row.amount) || 0, fPaid = parseFloat(row.totalPaid) || 0;
          totalFees += fAmount; totalPaid += fPaid;
          for (var j = 1; j <= 6; j++) {
            var amt2 = parseFloat(row['inst' + j]) || 0;
            if (amt2 > 0) {
              var dStr2 = String(row['inst' + j + 'Date'] || '').trim();
              if (dStr2 === todayS) dailyCollected += amt2;
              if (dStr2) { var d2 = new Date(dStr2); if (d2 >= weekAgo && d2 <= today) weeklyCollected += amt2; }
              termlyCollected += amt2;
            }
          }
          var g2 = r2.grade || 'Unknown';
          if (gradeMap[g2]) { gradeMap[g2].fees += fAmount; gradeMap[g2].paid += fPaid; }
          var name = String(row.feeTypeName || '').trim();
          if (name) { if (!customFeesMap[name]) customFeesMap[name] = { billed: 0, paid: 0 }; customFeesMap[name].billed += fAmount; customFeesMap[name].paid += fPaid; }
        });

        var totalIncome = 0, totalExpense = 0;
        ieList.forEach(function (r2) { if (r2.type === 'Income') totalIncome += parseFloat(r2.amount) || 0; if (r2.type === 'Expense') totalExpense += parseFloat(r2.amount) || 0; });

        var regBilled = 0, regPaid = 0;
        allRows.forEach(function (r2) { comps.forEach(function (c) { regBilled += parseFloat(r2[c.id]) || 0; }); for (var i2 = 1; i2 <= 6; i2++) regPaid += parseFloat(r2['inst' + i2]) || 0; });

        var feeTypeBreakdown = [{ name: 'Regular School Fees', billed: regBilled, paid: regPaid, balance: regBilled - regPaid }];
        Object.keys(customFeesMap).forEach(function (k) { feeTypeBreakdown.push({ name: k, billed: customFeesMap[k].billed, paid: customFeesMap[k].paid, balance: customFeesMap[k].billed - customFeesMap[k].paid }); });

        return {
          success: true, totalStudents: allRows.length, totalFees: totalFees, totalPaid: totalPaid, balance: totalFees - totalPaid,
          paidCount: paidCount, partialCount: partialCount, unpaidCount: unpaidCount,
          dailyCollected: dailyCollected, weeklyCollected: weeklyCollected, termlyCollected: termlyCollected,
          totalIncome: totalIncome, totalExpense: totalExpense,
          collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
          gradeBreakdown: Object.keys(gradeMap).map(function (g) { return { grade: g, students: gradeMap[g].students, fees: gradeMap[g].fees, paid: gradeMap[g].paid, balance: gradeMap[g].fees - gradeMap[g].paid }; }),
          feeTypeBreakdown: feeTypeBreakdown, compBreakdown: Object.keys(compMap).map(function (k) { return compMap[k]; })
        };
      }).catch(err);
  };

  // Original createBackup targeted a non-existent "Records" sheet (dead code in
  // Code.gs). Replaced with a full RTDB export the browser downloads directly —
  // simpler, always accurate, and needs no Apps Script round-trip.
  BACKEND.createBackup = function () {
    return once('/').then(function (all) {
      return { success: true, data: all || {}, exportedAt: nowIso() };
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // PROMOTION / DISCOUNT HISTORY
  // ════════════════════════════════════════════════════════
  BACKEND.logPromotion = function (studentId, studentName, fromGrade, toGrade, fromSession, toSession) {
    var user = (I.getSessionUser() && (I.getSessionUser().email || I.getSessionUser().name)) || 'Admin';
    return push('promotionHistory', { timestamp: nowIso(), studentId: studentId || '', studentName: studentName || '', fromGrade: fromGrade || '', toGrade: toGrade || '', fromSession: fromSession || '', toSession: toSession || '', promotedBy: user }).catch(function () {});
  };
  BACKEND.getPromotionHistory = function () {
    return once('promotionHistory').then(function (raw) {
      return { success: true, history: toArray(raw).map(function (h) { return Object.assign({}, h, { timestamp: fmtDateTime(new Date(h.timestamp)) }); }).reverse() };
    }).catch(err);
  };
  BACKEND.logDiscountChange = function (studentId, studentName, grade, academicSession, discountAmount) {
    var user = (I.getSessionUser() && (I.getSessionUser().email || I.getSessionUser().name)) || 'Admin';
    return push('discountHistory', { timestamp: nowIso(), studentId: studentId || '', studentName: studentName || '', grade: grade || '', academicSession: academicSession || '', discountAmount: discountAmount || 0, recordedBy: user }).catch(function () {});
  };
  BACKEND.getDiscountHistory = function () {
    return once('discountHistory').then(function (raw) {
      return { success: true, history: toArray(raw).map(function (h) { return Object.assign({}, h, { timestamp: fmtDateTime(new Date(h.timestamp)), discountAmount: parseFloat(h.discountAmount) || 0 }); }).reverse() };
    }).catch(err);
  };

  // ════════════════════════════════════════════════════════
  // UNIFORM SALES
  // ════════════════════════════════════════════════════════
  function upsertSale(path, saleData, prefix) {
    var now = nowIso();
    var user = (I.getSessionUser() && (I.getSessionUser().email || I.getSessionUser().name)) || 'Admin';
    saleData.timestamp = saleData.timestamp || now;
    saleData.recordedBy = user;
    var tp = parseFloat(saleData.totalPrice) || 0, ap = parseFloat(saleData.amountPaid) || 0;
    saleData.balance = Math.max(0, tp - ap);
    saleData.paymentStatus = saleData.balance <= 0 ? "Paid" : ap > 0 ? "Partially Paid" : "Unpaid";
    return once(path).then(function (raw) {
      var list = toArray(raw);
      var found = saleData.id ? list.find(function (s) { return String(s.id) === String(saleData.id); }) : null;
      if (found) {
        return db.ref(path + '/' + found._key).set(saleData).then(function () { return { success: true, sale: saleData }; });
      }
      saleData.id = saleData.id || uid(prefix);
      saleData.createdAt = now;
      return db.ref(path).push(saleData).then(function () { return { success: true, sale: saleData }; });
    }).catch(err);
  }

  BACKEND.saveUniformSale = function (saleData) {
    return upsertSale('uniformSales', saleData, 'US').then(function (r) {
      if (r.success) BACKEND.logActivity((saleData.createdAt === saleData.timestamp ? 'Recorded' : 'Updated') + ' Uniform Sale', saleData.id + ' - ' + saleData.studentName);
      return r;
    });
  };
  BACKEND.getUniformSales = function () { return once('uniformSales').then(function (raw) { return { success: true, sales: toArray(raw).reverse() }; }).catch(err); };

  // ════════════════════════════════════════════════════════
  // BOOK CONFIG / SALES
  // ════════════════════════════════════════════════════════
  BACKEND.getBookConfigs = function () { return once('bookConfig').then(function (raw) { return { success: true, configs: toArray(raw) }; }).catch(err); };
  BACKEND.saveBookConfig = function (configData) {
    return once('bookConfig').then(function (raw) {
      var list = toArray(raw);
      var found = configData.id ? list.find(function (c) { return String(c.id) === String(configData.id); }) : null;
      if (found) return db.ref('bookConfig/' + found._key).set(configData).then(function () { return { success: true, config: configData }; });
      configData.id = configData.id || uid('BC');
      return db.ref('bookConfig').push(configData).then(function () { return { success: true, config: configData }; });
    }).catch(err);
  };
  BACKEND.deleteBookConfig = function (id) {
    return once('bookConfig').then(function (raw) {
      var found = toArray(raw).find(function (c) { return String(c.id) === String(id); });
      if (!found) return { success: false, message: 'Book config not found' };
      return db.ref('bookConfig/' + found._key).remove().then(function () { return { success: true }; });
    }).catch(err);
  };
  BACKEND.saveBookSale = function (saleData) {
    return upsertSale('bookSales', saleData, 'BS').then(function (r) {
      if (r.success) BACKEND.logActivity((saleData.createdAt === saleData.timestamp ? 'Recorded' : 'Updated') + ' Book Sale', saleData.id + ' - ' + saleData.studentName);
      return r;
    });
  };
  BACKEND.getBookSales = function () { return once('bookSales').then(function (raw) { return { success: true, sales: toArray(raw).reverse() }; }).catch(err); };

  BACKEND.getStudentUniformsAndBooks = function (studentId) {
    var target = String(studentId).trim().toLowerCase();
    return Promise.all([once('uniformSales'), once('bookSales')]).then(function (r) {
      var uniforms = toArray(r[0]).filter(function (u) { return String(u.studentId).trim().toLowerCase() === target; })
        .map(function (u) { return { uniformTypes: u.uniformTypes || '', totalPrice: parseFloat(u.totalPrice) || 0, amountPaid: parseFloat(u.amountPaid) || 0, balance: parseFloat(u.balance) || 0 }; });
      var books = toArray(r[1]).filter(function (b) { return String(b.studentId).trim().toLowerCase() === target; })
        .map(function (b) { return { books: b.booksPurchased || b.books || '', totalPrice: parseFloat(b.totalPrice) || 0, amountPaid: parseFloat(b.amountPaid) || 0, balance: parseFloat(b.balance) || 0 }; });
      return { uniforms: uniforms, books: books };
    }).catch(function () { return { uniforms: [], books: [] }; });
  };

  // ════════════════════════════════════════════════════════
  // IMPORT / EXPORT
  // ════════════════════════════════════════════════════════
  BACKEND.importBulkRecords = function (rows) {
    return getFeeComponentsList().then(function (allComps) {
      var comps = allComps.filter(function (c) { return c.isActive; });
      var ok = 0, fail = 0;
      function step(i) {
        if (i >= rows.length) return Promise.resolve();
        var row = rows[i];
        try {
          var rec = {
            studentName: row['Student Name'] || row.studentName || '',
            phoneNumber: String(row['Phone Number'] || row.phoneNumber || ''),
            grade: row['Grade'] || row.grade || '',
            academicSession: row['Academic Session'] || row.academicSession || '',
            isNewStudent: String(row['Is New Student']).toUpperCase() === 'TRUE' || String(row['Is New Student']).toUpperCase() === 'YES'
          };
          comps.forEach(function (comp) {
            var val = 0;
            [comp.name, comp.id, comp.name.toLowerCase()].some(function (key) {
              if (row[key] !== undefined && row[key] !== '') { val = parseFloat(row[key]) || 0; return true; }
              return false;
            });
            rec[comp.id] = val;
          });
          for (var i2 = 1; i2 <= 6; i2++) { rec['inst' + i2] = parseFloat(row['Inst ' + i2] || row['inst' + i2]) || 0; rec['inst' + i2 + 'Date'] = row['Inst ' + i2 + ' Date'] || row['inst' + i2 + 'Date'] || ''; }
          return BACKEND.saveRecord(rec).then(function (r) { r.success ? ok++ : fail++; return step(i + 1); });
        } catch (e) { fail++; return step(i + 1); }
      }
      return step(0).then(function () { return { success: true, message: "Imported " + ok + " records. Failed: " + fail }; });
    }).catch(err);
  };

  BACKEND.getImportTemplate = function () {
    return getFeeComponentsList().then(function (allComps) {
      var comps = allComps.filter(function (c) { return c.isActive; });
      return { success: true, template: {
        headers: ["Student Name", "Phone Number", "Grade", "Academic Session", ...comps.map(function (c) { return c.name; }), "Is New Student",
          "Inst 1", "Inst 1 Date", "Inst 2", "Inst 2 Date", "Inst 3", "Inst 3 Date", "Inst 4", "Inst 4 Date", "Inst 5", "Inst 5 Date", "Inst 6", "Inst 6 Date"],
        feeComponents: comps
      } };
    }).catch(err);
  };

  BACKEND.saveIdPrefixBackend = function (newPrefix) {
    return once('settings/idPrefix').then(function (oldPrefix) {
      return BACKEND.saveSettings({ idPrefix: newPrefix }).then(function () {
        return { success: true, message: "Prefix updated successfully! (Existing student IDs are kept as-is; only new IDs use the new prefix.)" };
      });
    }).catch(function (e) { return { success: false, message: e.message }; });
  };

  // ════════════════════════════════════════════════════════
  // PARENT PORTAL
  // ════════════════════════════════════════════════════════
  BACKEND.getPublicSchoolData = function (studentIdOrPhone) {
    return BACKEND.getSettings().then(function (s) {
      var settings = s.settings || {};
      var cleanInput = String(studentIdOrPhone).replace(/\D/g, '');
      var lookupById = function (id) {
        return Promise.all(TERMS.map(function (term) {
          return once('students/' + term).then(function (raw) {
            var students = raw || {};
            var key = Object.keys(students).find(function (k) { return String(students[k].id).trim().toLowerCase() === id.trim().toLowerCase(); });
            return key ? students[key] : null;
          });
        })).then(function (results) { return results.find(Boolean) || null; });
      };
      var findByPhone = function (phone) {
        return Promise.all(TERMS.map(function (term) {
          return once('students/' + term).then(function (raw) {
            var students = toArray(raw);
            var match = students.find(function (r) {
              var rowPhone = String(r.phoneNumber || '').replace(/\D/g, '');
              return rowPhone && (rowPhone === phone || rowPhone.endsWith(phone) || phone.endsWith(rowPhone));
            });
            return match ? match.id : null;
          });
        })).then(function (results) { return results.find(Boolean) || null; });
      };

      var idPromise = cleanInput.length >= 9 ? findByPhone(cleanInput).then(function (found) { return found || studentIdOrPhone; }) : Promise.resolve(studentIdOrPhone);

      return idPromise.then(function (studentId) {
        return lookupById(studentId).then(function (record) {
          var afterVirtual = record ? applyVirtualPayments(record, studentId) : Promise.resolve(record);
          return afterVirtual.then(function (record2) {
            var siblingsPromise = (record2 && record2.phoneNumber) ? findSiblings(record2, settings) : Promise.resolve([]);
            var classesPromise = BACKEND.getClasses();
            var customFeesPromise = record2 ? BACKEND.getCustomStudentFees(record2.id) : Promise.resolve({ success: true, history: [] });
            var extrasPromise = record2 ? BACKEND.getStudentUniformsAndBooks(record2.id) : Promise.resolve({ uniforms: [], books: [] });
            return Promise.all([siblingsPromise, classesPromise, customFeesPromise, extrasPromise]).then(function (r) {
              var siblings = r[0], classesList = (r[1].success ? r[1].classes : []), customFees = r[2].success ? r[2].history : [], extras = r[3];
              var parseMaybe = function (v, fallback) { if (!v) return fallback; try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { return fallback; } };
              return {
                success: true,
                school: {
                  name: settings.schoolName || '', address: settings.schoolAddress || '', phone: settings.schoolPhone || '', email: settings.schoolEmail || '',
                  motto: settings.schoolMotto || '', logo: settings.schoolLogo || '', currency: settings.currency || 'GHC',
                  facebook: settings.facebook || '', twitter: settings.twitter || '', instagram: settings.instagram || '', whatsapp: settings.whatsappLink || '',
                  website: settings.website || '', momoName: settings.momoName || '', momoNumber: settings.momoNumber || '', momoNote: settings.momoNote || '',
                  paymentMethods: settings.paymentMethods || '', billFooter: settings.billFooter || '', classes: classesList,
                  rolloverCustomFees: settings.rolloverCustomFees || '', nextTermIncludedExtraFees: settings.nextTermIncludedExtraFees || '',
                  systemFont: settings.systemFont || 'Inter', systemFontSize: settings.systemFontSize || 'normal', systemFontWeight: settings.systemFontWeight || '400',
                  feeComponents: parseMaybe(settings.feeComponents, [{ id: 'tuitionFees', name: 'Tuition Fees', isActive: true }, { id: 'admissionFees', name: 'Admission Fees', isActive: true, isForNewStudentsOnly: true }])
                },
                record: record2, siblings: siblings, customFeeTypes: parseMaybe(settings.customFeeTypes, []),
                customFees: customFees, uniforms: extras.uniforms, books: extras.books
              };
            });
          });
        });
      });
    }).catch(err);
  };

  function applyVirtualPayments(record, studentId) {
    return once('paymentNotifications').then(function (raw) {
      var target = String(studentId).trim().toLowerCase();
      var sum = toArray(raw).filter(function (n) { return String(n.studentId).trim().toLowerCase() === target && String(n.status).trim() === 'Confirmed'; })
        .reduce(function (acc, n) { return acc + (parseFloat(n.amount) || 0); }, 0);
      if (sum > 0) {
        var originalTotalPaid = parseFloat(record.totalPaid) || 0, originalBalance = parseFloat(record.balance) || 0, originalTotalFees = parseFloat(record.totalFees) || 0;
        record = Object.assign({}, record);
        record.totalPaid = originalTotalPaid + sum;
        record.balance = Math.max(0, originalBalance - sum);
        record.paymentStatus = originalTotalFees === 0 ? "No Fees" : record.balance <= 0 ? "Paid" : record.totalPaid > 0 ? "Partially Paid" : "Unpaid";
      }
      return record;
    }).catch(function () { return record; });
  }

  function findSiblings(record, settings) {
    var mainPhone = String(record.phoneNumber).replace(/\D/g, '');
    if (!mainPhone || mainPhone.length < 9) return Promise.resolve([]);
    var cleanMainPhone = (mainPhone.indexOf('233') === 0 && mainPhone.length === 12) ? '0' + mainPhone.substring(3) : mainPhone;
    var activeYr = settings.academicYear || '2025/2026', activeTerm = settings.activeTerm || 'First Term';
    var activeSess = activeYr + ' ' + activeTerm;
    var seen = {}; seen[String(record.id).trim().toLowerCase()] = true;
    return Promise.all(TERMS.map(function (term) {
      return once('students/' + term).then(function (raw) {
        return toArray(raw).filter(function (r) {
          if (!r.id || !r.phoneNumber) return false;
          if (seen[String(r.id).trim().toLowerCase()]) return false;
          var sess = String(r.academicSession || '');
          if (sess && sess.indexOf(activeSess) === -1) return false;
          var rowPhone = String(r.phoneNumber).replace(/\D/g, '');
          var cleanRowPhone = (rowPhone.indexOf('233') === 0 && rowPhone.length === 12) ? '0' + rowPhone.substring(3) : rowPhone;
          return cleanRowPhone === cleanMainPhone;
        });
      });
    })).then(function (results) {
      var flat = [];
      results.forEach(function (list) { list.forEach(function (r) { if (!seen[String(r.id).trim().toLowerCase()]) { seen[String(r.id).trim().toLowerCase()] = true; flat.push(r); } }); });
      return Promise.all(flat.map(function (rec) {
        return Promise.all([BACKEND.getCustomStudentFees(rec.id), BACKEND.getStudentUniformsAndBooks(rec.id)]).then(function (r2) {
          return { record: rec, customFees: r2[0].success ? r2[0].history : [], uniforms: r2[1].uniforms, books: r2[1].books };
        });
      }));
    });
  }

  // ════════════════════════════════════════════════════════
  // Apps Script bridges: student photo upload, daily report
  // ════════════════════════════════════════════════════════
  BACKEND.uploadStudentPhoto = function (studentId, base64Data, fileName) {
    return callAppsScript('uploadStudentPhoto', { studentId: studentId, base64Data: base64Data, fileName: fileName }).then(function (res) {
      if (!res || !res.success) return res;
      return Promise.all(TERMS.map(function (term) {
        return once('students/' + term).then(function (raw) {
          var students = raw || {};
          var key = Object.keys(students).find(function (k) { return String(students[k].id).trim().toLowerCase() === String(studentId).trim().toLowerCase(); });
          return key ? db.ref('students/' + term + '/' + key + '/studentPhoto').set(res.url) : null;
        });
      })).then(function () { return res; });
    });
  };
  BACKEND.sendDailyReportNow = function () { return callAppsScript('sendDailyReportNow', {}); };

  // ════════════════════════════════════════════════════════
  // No-ops kept for backward compatibility with UI calls
  // (schema/column maintenance only made sense for the old Sheets model —
  // Firebase records don't have fixed columns to migrate)
  // ════════════════════════════════════════════════════════
  BACKEND.keepWarm = function () { return Promise.resolve(); };
  BACKEND.cleanAllSheetHeaders = function () { return Promise.resolve({ success: true }); };
  BACKEND.ensureColumnExists = function () { return Promise.resolve(); };
  BACKEND.ensureStudentPhotoColumn = function () { return Promise.resolve(); };

  BACKEND.findOrphanedFeeColumns = function () {
    return Promise.all([getFeeComponentsList(), BACKEND.getData()]).then(function (r) {
      var activeIds = r[0].map(function (c) { return String(c.id).trim(); });
      var reserved = ["id", "studentName", "phoneNumber", "grade", "academicSession", "isNewStudent", "isStopped", "studentStatus",
        "discount", "totalFees", "totalPaid", "balance", "paymentStatus", "createdAt", "updatedAt", "paymentMode", "recordedBy", "isStaffChild", "studentPhoto", "arrears"];
      var orphans = {};
      r[1].forEach(function (row) {
        Object.keys(row).forEach(function (h) {
          if (!h || activeIds.indexOf(h) !== -1 || reserved.indexOf(h) !== -1 || h.indexOf('inst') === 0 || h === '_key') return;
          var v = row[h];
          var hasData = orphans[h] || (v !== '' && v !== 0 && v !== null && v !== undefined);
          orphans[h] = hasData;
        });
      });
      return { success: true, orphans: orphans };
    }).catch(err);
  };

  BACKEND.removeOrphanedFeeColumns = function (columnNames) {
    return BACKEND.getData().then(function () {
      var removed = 0;
      return Promise.all(TERMS.map(function (term) {
        return once('students/' + term).then(function (raw) {
          var students = raw || {};
          var work = [];
          Object.keys(students).forEach(function (key) {
            columnNames.forEach(function (name) {
              if (students[key][name] !== undefined) { work.push(db.ref('students/' + term + '/' + key + '/' + name).remove()); removed++; }
            });
          });
          return Promise.all(work);
        });
      })).then(function () {
        BACKEND.logActivity('Removed Unused Fee Columns', columnNames.join(', '));
        return { success: true, removed: removed };
      });
    }).catch(err);
  };
})(window);
