/**
 * Finance.gs
 * Giving records, campaigns, pledges (with computed progress), expense
 * approval workflow, and PDF donor statements.
 */

/* ---------- Giving / Donations ---------- */

function listFinance(filters) {
  return safeCall_('listFinance', function () {
    requireRole_('finance', 'view');
    var rows = readAll_(SHEETS.FINANCE);
    filters = filters || {};
    if (filters.from) rows = rows.filter(function (r) { return r.Date >= filters.from; });
    if (filters.to) rows = rows.filter(function (r) { return r.Date <= filters.to; });
    if (filters.type) rows = rows.filter(function (r) { return r.Type === filters.type; });
    if (filters.memberId) rows = rows.filter(function (r) { return r.DonorMemberID === filters.memberId; });
    return rows.sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  });
}

function saveFinanceRecord(data) {
  return safeCall_('saveFinanceRecord', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['Type', 'Amount', 'PaymentMethod', 'Date']);
    if (!isNumber_(data.Amount) || Number(data.Amount) <= 0) throw new Error('Amount must be a positive number.');
    requireEnum_(data.Type, OPTIONS.FINANCE_TYPE, 'Type');
    requireEnum_(data.PaymentMethod, OPTIONS.PAYMENT_METHOD, 'Payment method');
    if (!isValidDate_(data.Date)) throw new Error('Enter a valid date.');

    var donorName = data.DonorName;
    if (data.DonorMemberID) {
      var m = getById_(SHEETS.MEMBERS, data.DonorMemberID);
      if (m) donorName = m.FirstName + ' ' + m.LastName;
    }

    var payload = {
      Type: data.Type,
      DonorMemberID: data.DonorMemberID || '',
      DonorName: sanitizeText_(donorName || 'Anonymous'),
      Amount: Number(data.Amount),
      PaymentMethod: data.PaymentMethod,
      CampaignID: data.CampaignID || '',
      Recurring: data.Recurring ? 'TRUE' : 'FALSE',
      Date: data.Date,
      ReceiptNumber: data.ReceiptNumber || ('RCT-' + Date.now()),
      RecordedBy: user.Email,
      Notes: sanitizeText_(data.Notes || '')
    };

    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.FINANCE, data.ID, payload);
      logAudit_('UPDATE', 'Finance', data.ID, 'Updated giving record');
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.FINANCE, payload, ID_PREFIX.FINANCE);
      logAudit_('CREATE', 'Finance', record.ID, payload.Type + ' of ' + payload.Amount + ' from ' + payload.DonorName);
      if (data.PledgeID) applyPaymentToPledge_(data.PledgeID, Number(data.Amount));
    }
    return record;
  });
}

function deleteFinanceRecord(id) {
  return safeCall_('deleteFinanceRecord', function () {
    requireRole_('finance', 'mutate');
    deleteRow_(SHEETS.FINANCE, id);
    logAudit_('DELETE', 'Finance', id, 'Removed giving record');
    return { ok: true };
  });
}

/* ---------- Campaigns ---------- */

function listCampaigns() {
  return safeCall_('listCampaigns', function () {
    requireRole_('finance', 'view');
    return readAll_(SHEETS.CAMPAIGNS);
  });
}

function saveCampaign(data) {
  return safeCall_('saveCampaign', function () {
    requireRole_('finance', 'mutate');
    requireFields_(data, ['Name', 'Goal']);
    if (!isNumber_(data.Goal)) throw new Error('Goal must be a number.');
    var payload = { Name: sanitizeText_(data.Name), Goal: Number(data.Goal), StartDate: data.StartDate || '', EndDate: data.EndDate || '', Status: data.Status || 'Active' };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CAMPAIGNS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CAMPAIGNS, payload, ID_PREFIX.CAMPAIGNS);
    }
    logAudit_('UPDATE', 'Campaigns', record.ID, 'Saved campaign ' + payload.Name);
    return record;
  });
}

/* ---------- Pledges ---------- */

function listPledges() {
  return safeCall_('listPledges', function () {
    requireRole_('finance', 'view');
    var pledges = readAll_(SHEETS.PLEDGES);
    var finance = readAll_(SHEETS.FINANCE);
    return pledges.map(function (p) {
      var paid = finance.filter(function (f) { return f.CampaignID === p.CampaignID && f.DonorMemberID === p.MemberID; })
        .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
      return Object.assign({}, p, { PaidAmount: paid, Balance: Math.max(0, Number(p.PledgedAmount) - paid), PercentPaid: p.PledgedAmount ? Math.min(100, Math.round(paid / Number(p.PledgedAmount) * 100)) : 0 });
    });
  });
}

function savePledge(data) {
  return safeCall_('savePledge', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['MemberID', 'CampaignID', 'PledgedAmount']);
    if (!isNumber_(data.PledgedAmount) || Number(data.PledgedAmount) <= 0) throw new Error('Pledged amount must be positive.');
    var m = getById_(SHEETS.MEMBERS, data.MemberID);
    var c = getById_(SHEETS.CAMPAIGNS, data.CampaignID);
    if (!m) throw new Error('Member not found.');
    if (!c) throw new Error('Campaign not found.');
    requireEnum_(data.Status, OPTIONS.PLEDGE_STATUS, 'Status');

    var payload = {
      MemberID: data.MemberID, MemberName: m.FirstName + ' ' + m.LastName,
      CampaignID: data.CampaignID, CampaignName: c.Name,
      PledgedAmount: Number(data.PledgedAmount), StartDate: data.StartDate || '', EndDate: data.EndDate || '',
      Status: data.Status || 'Active', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.PLEDGES, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_(); payload.CreatedBy = user.Email;
      record = insertRow_(SHEETS.PLEDGES, payload, ID_PREFIX.PLEDGES);
    }
    logAudit_('UPDATE', 'Pledges', record.ID, 'Saved pledge for ' + payload.MemberName);
    return record;
  });
}

function applyPaymentToPledge_(pledgeId, amount) {
  var p = getById_(SHEETS.PLEDGES, pledgeId);
  if (!p) return;
  var finance = readAll_(SHEETS.FINANCE);
  var paid = finance.filter(function (f) { return f.CampaignID === p.CampaignID && f.DonorMemberID === p.MemberID; })
    .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
  if (paid >= Number(p.PledgedAmount) && p.Status !== 'Fulfilled') {
    updateRow_(SHEETS.PLEDGES, pledgeId, { Status: 'Fulfilled' });
  }
}

/* ---------- Expenses (approval workflow) ---------- */

function listExpenses() {
  return safeCall_('listExpenses', function () {
    requireRole_('finance', 'view');
    return readAll_(SHEETS.EXPENSES).sort(function (a, b) { return new Date(b.Date) - new Date(a.Date); });
  });
}

function saveExpense(data) {
  return safeCall_('saveExpense', function () {
    var user = requireRole_('finance', 'mutate');
    requireFields_(data, ['Category', 'Description', 'Amount', 'Date']);
    if (!isNumber_(data.Amount) || Number(data.Amount) <= 0) throw new Error('Amount must be a positive number.');

    var payload = {
      Category: sanitizeText_(data.Category), Department: sanitizeText_(data.Department || ''),
      Description: sanitizeText_(data.Description), Amount: Number(data.Amount), Date: data.Date,
      BudgetLine: sanitizeText_(data.BudgetLine || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.EXPENSES, data.ID, payload);
    } else {
      payload.Status = 'Pending'; payload.RequestedBy = user.Email; payload.ApprovedBy = '';
      payload.ReceiptFileId = ''; payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.EXPENSES, payload, ID_PREFIX.EXPENSES);
    }
    logAudit_('UPDATE', 'Expenses', record.ID, 'Saved expense claim: ' + payload.Description);
    return record;
  });
}

function decideExpense(id, decision) {
  return safeCall_('decideExpense', function () {
    var user = requireRole_('finance', 'mutate');
    requireEnum_(decision, ['Approved', 'Rejected'], 'Decision');
    var record = updateRow_(SHEETS.EXPENSES, id, { Status: decision, ApprovedBy: user.Email });
    logAudit_('UPDATE', 'Expenses', id, decision + ' by ' + user.Email);
    return record;
  });
}

function uploadExpenseReceipt(id, base64Data, mimeType, filename) {
  return safeCall_('uploadExpenseReceipt', function () {
    requireRole_('finance', 'mutate');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    updateRow_(SHEETS.EXPENSES, id, { ReceiptFileId: file.getId() });
    return { fileId: file.getId() };
  });
}

/* ---------- Reporting ---------- */

function getFinanceSummary(from, to) {
  return safeCall_('getFinanceSummary', function () {
    requireRole_('finance', 'view');
    var finance = readAll_(SHEETS.FINANCE).filter(inRange_(from, to, 'Date'));
    var expenses = readAll_(SHEETS.EXPENSES).filter(function (e) { return e.Status === 'Approved'; }).filter(inRange_(from, to, 'Date'));
    var totalGiving = finance.reduce(function (s, f) { return s + Number(f.Amount || 0); }, 0);
    var totalExpense = expenses.reduce(function (s, e) { return s + Number(e.Amount || 0); }, 0);
    var byType = {};
    finance.forEach(function (f) { byType[f.Type] = (byType[f.Type] || 0) + Number(f.Amount || 0); });
    var byCategory = {};
    expenses.forEach(function (e) { byCategory[e.Category] = (byCategory[e.Category] || 0) + Number(e.Amount || 0); });
    var byDept = {};
    expenses.forEach(function (e) { var d = e.Department || 'Unassigned'; byDept[d] = (byDept[d] || 0) + Number(e.Amount || 0); });
    return {
      totalGiving: totalGiving, totalExpense: totalExpense, net: totalGiving - totalExpense,
      byType: byType, byCategory: byCategory, byDepartment: byDept,
      givingCount: finance.length, expenseCount: expenses.length
    };
  });
}

function inRange_(from, to, field) {
  return function (row) {
    if (from && row[field] < from) return false;
    if (to && row[field] > to) return false;
    return true;
  };
}

/** Generates a donor statement PDF (via Google Docs template render) and returns a Drive download URL. */
function generateDonorStatement(memberId, from, to) {
  return safeCall_('generateDonorStatement', function () {
    requireRole_('finance', 'view');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var rows = readAll_(SHEETS.FINANCE).filter(function (f) { return f.DonorMemberID === memberId; }).filter(inRange_(from, to, 'Date'))
      .sort(function (a, b) { return new Date(a.Date) - new Date(b.Date); });
    var total = rows.reduce(function (s, r) { return s + Number(r.Amount || 0); }, 0);

    var doc = DocumentApp.create('Donor Statement - ' + m.FirstName + ' ' + m.LastName + ' - ' + new Date().getTime());
    var body = doc.getBody();
    body.appendParagraph(getSetting_('OrgName', APP_NAME)).setHeading(DocumentApp.ParagraphHeading.TITLE);
    body.appendParagraph('Donor Statement').setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('Donor: ' + m.FirstName + ' ' + m.LastName);
    body.appendParagraph('Period: ' + (from || 'all time') + ' to ' + (to || 'present'));
    body.appendParagraph('Generated: ' + new Date().toDateString());
    body.appendParagraph('');
    var table = [['Date', 'Type', 'Method', 'Amount', 'Receipt #']];
    rows.forEach(function (r) { table.push([r.Date, r.Type, r.PaymentMethod, formatMoney_(r.Amount), r.ReceiptNumber]); });
    table.push(['', '', 'Total', formatMoney_(total), '']);
    body.appendTable(table);
    doc.saveAndClose();

    var file = DriveApp.getFileById(doc.getId());
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    file.moveTo(folder);
    var pdfBlob = file.getAs('application/pdf');
    var pdfFile = folder.createFile(pdfBlob);
    file.setTrashed(true); // keep only the PDF
    pdfFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    logAudit_('CREATE', 'Finance', memberId, 'Generated donor statement PDF');
    return { fileId: pdfFile.getId(), url: pdfFile.getUrl(), total: total, count: rows.length };
  });
}
