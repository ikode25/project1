/**
 * Members.gs
 * Member profile CRUD, admin-defined custom fields, Drive-backed photo/document
 * attachments, and the append-only status-history log.
 */

function listMembers() {
  return safeCall_('listMembers', function () {
    requireRole_('members', 'view');
    return readAll_(SHEETS.MEMBERS).sort(function (a, b) {
      return (a.LastName || '').localeCompare(b.LastName || '');
    });
  });
}

function getMember(id) {
  return safeCall_('getMember', function () {
    requireRole_('members', 'view');
    var m = getById_(SHEETS.MEMBERS, id);
    if (!m) throw new Error('Member not found.');
    m.History = readAll_(SHEETS.MEMBER_STATUS_HISTORY).filter(function (h) { return h.MemberID === id; });
    return m;
  });
}

function validateMemberPayload_(data) {
  requireFields_(data, ['FirstName', 'LastName', 'Phone']);
  if (!isValidPhone_(data.Phone)) throw new Error('Enter a valid phone number.');
  if (!isValidEmail_(data.Email)) throw new Error('Enter a valid email address.');
  if (!isValidDate_(data.DOB)) throw new Error('Enter a valid date of birth.');
  requireEnum_(data.Gender, OPTIONS.GENDER, 'Gender');
  requireEnum_(data.MaritalStatus, OPTIONS.MARITAL_STATUS, 'Marital status');
  requireEnum_(data.MembershipStatus, OPTIONS.MEMBERSHIP_STATUS, 'Membership status');
}

/** Create or update a member. `data.CustomFieldValues` (object) is stringified into the CustomFields column. */
function saveMember(data) {
  return safeCall_('saveMember', function () {
    var actingUser = requireRole_('members', 'mutate');
    validateMemberPayload_(data);

    var payload = {
      FirstName: sanitizeText_(data.FirstName),
      LastName: sanitizeText_(data.LastName),
      Gender: data.Gender || '',
      DOB: data.DOB || '',
      Phone: normalizePhone_(data.Phone),
      Email: sanitizeText_(data.Email || ''),
      Address: sanitizeText_(data.Address || ''),
      MaritalStatus: data.MaritalStatus || '',
      EmergencyContactName: sanitizeText_(data.EmergencyContactName || ''),
      EmergencyContactPhone: normalizePhone_(data.EmergencyContactPhone || ''),
      MembershipDate: data.MembershipDate || '',
      MembershipClass: sanitizeText_(data.MembershipClass || ''),
      Cluster: sanitizeText_(data.Cluster || ''),
      Department: sanitizeText_(data.Department || ''),
      CustomFields: JSON.stringify(data.CustomFieldValues || {}),
      SmsOptOut: data.SmsOptOut ? 'TRUE' : 'FALSE',
      Notes: sanitizeText_(data.Notes || ''),
      UpdatedAt: nowIso_(),
      UpdatedBy: actingUser.Email
    };

    var record;
    if (data.ID) {
      var existing = getById_(SHEETS.MEMBERS, data.ID);
      if (!existing) throw new Error('Member not found.');
      var newStatus = data.MembershipStatus || existing.MembershipStatus;
      if (newStatus !== existing.MembershipStatus) {
        recordStatusChange_(data.ID, existing.FirstName + ' ' + existing.LastName, existing.MembershipStatus, newStatus, data.StatusChangeReason || '');
      }
      payload.MembershipStatus = newStatus;
      record = updateRow_(SHEETS.MEMBERS, data.ID, payload);
      logAudit_('UPDATE', 'Members', data.ID, 'Updated member ' + payload.FirstName + ' ' + payload.LastName);
    } else {
      payload.MembershipStatus = data.MembershipStatus || 'New';
      payload.PhotoFileId = '';
      payload.DocumentLinks = '[]';
      payload.CreatedAt = nowIso_();
      payload.CreatedBy = actingUser.Email;
      record = insertRow_(SHEETS.MEMBERS, payload, ID_PREFIX.MEMBERS);
      recordStatusChange_(record.ID, payload.FirstName + ' ' + payload.LastName, '', payload.MembershipStatus, 'Onboarded');
      logAudit_('CREATE', 'Members', record.ID, 'Added member ' + payload.FirstName + ' ' + payload.LastName);
    }
    return record;
  });
}

function recordStatusChange_(memberId, memberName, oldStatus, newStatus, reason) {
  insertRow_(SHEETS.MEMBER_STATUS_HISTORY, {
    MemberID: memberId,
    MemberName: memberName,
    OldStatus: oldStatus,
    NewStatus: newStatus,
    Reason: sanitizeText_(reason || ''),
    ChangedBy: currentUserEmail_(),
    ChangedAt: nowIso_()
  }, ID_PREFIX.MEMBER_STATUS_HISTORY);
}

function deleteMember(id) {
  return safeCall_('deleteMember', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, id);
    deleteRow_(SHEETS.MEMBERS, id);
    logAudit_('DELETE', 'Members', id, 'Removed member ' + (m ? m.FirstName + ' ' + m.LastName : id));
    return { ok: true };
  });
}

/** Transfer a member: logs the transfer as a status change and marks them Transferred. */
function transferMember(id, destination, reason) {
  return safeCall_('transferMember', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, id);
    if (!m) throw new Error('Member not found.');
    recordStatusChange_(id, m.FirstName + ' ' + m.LastName, m.MembershipStatus, 'Transferred', 'To: ' + sanitizeText_(destination) + '. ' + sanitizeText_(reason || ''));
    var record = updateRow_(SHEETS.MEMBERS, id, { MembershipStatus: 'Transferred', UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', id, 'Transferred to ' + destination);
    return record;
  });
}

/** Uploads a base64-encoded photo to Drive and links it on the member record. */
function uploadMemberPhoto(memberId, base64Data, mimeType, filename) {
  return safeCall_('uploadMemberPhoto', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    if (m.PhotoFileId) {
      try { DriveApp.getFileById(m.PhotoFileId).setTrashed(true); } catch (e) { /* already gone */ }
    }
    updateRow_(SHEETS.MEMBERS, memberId, { PhotoFileId: file.getId(), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', memberId, 'Uploaded profile photo');
    return { fileId: file.getId(), url: 'https://drive.google.com/uc?id=' + file.getId() };
  });
}

/** Uploads a base64-encoded document (baptism cert, etc.) and appends it to the member's DocumentLinks JSON array. */
function uploadMemberDocument(memberId, base64Data, mimeType, filename, label) {
  return safeCall_('uploadMemberDocument', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var folder = DriveApp.getFolderById(ensureAttachmentsFolder_());
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    var docs = [];
    try { docs = JSON.parse(m.DocumentLinks || '[]'); } catch (e) { docs = []; }
    docs.push({ fileId: file.getId(), name: filename, label: label || filename, uploadedAt: nowIso_() });
    updateRow_(SHEETS.MEMBERS, memberId, { DocumentLinks: JSON.stringify(docs), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    logAudit_('UPDATE', 'Members', memberId, 'Uploaded document: ' + (label || filename));
    return docs;
  });
}

function removeMemberDocument(memberId, fileId) {
  return safeCall_('removeMemberDocument', function () {
    requireRole_('members', 'mutate');
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('Member not found.');
    var docs = [];
    try { docs = JSON.parse(m.DocumentLinks || '[]'); } catch (e) { docs = []; }
    docs = docs.filter(function (d) { return d.fileId !== fileId; });
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { /* already gone */ }
    updateRow_(SHEETS.MEMBERS, memberId, { DocumentLinks: JSON.stringify(docs), UpdatedAt: nowIso_(), UpdatedBy: currentUserEmail_() });
    return docs;
  });
}

/** Admin-defined extra Member columns, stored as JSON in the Settings sheet. */
function getCustomFieldsConfig() {
  return safeCall_('getCustomFieldsConfig', function () {
    requireRole_('members', 'view');
    try { return JSON.parse(getSetting_('CustomFieldsConfig', '[]')); } catch (e) { return []; }
  });
}

function saveCustomFieldsConfig(fields) {
  return safeCall_('saveCustomFieldsConfig', function () {
    requireRole_('settings', 'mutate');
    if (!Array.isArray(fields)) throw new Error('Invalid custom fields payload.');
    fields.forEach(function (f) { requireFields_(f, ['key', 'label', 'type']); });
    setSetting_('CustomFieldsConfig', JSON.stringify(fields));
    logAudit_('UPDATE', 'Settings', 'CustomFieldsConfig', 'Updated member custom fields (' + fields.length + ')');
    return fields;
  });
}

/** Simple, rule-based engagement score used by the dashboard/reports: attendance + giving + activity. */
function computeMemberEngagementScore_(memberId) {
  var attendance = readAll_(SHEETS.ATTENDANCE).filter(function (a) { return a.MemberID === memberId; });
  var giving = readAll_(SHEETS.FINANCE).filter(function (f) { return f.DonorMemberID === memberId; });
  var recentCutoff = Date.now() - 90 * 24 * 3600 * 1000;
  var recentAttendance = attendance.filter(function (a) { return new Date(a.ServiceDate).getTime() > recentCutoff; }).length;
  var recentGiving = giving.filter(function (f) { return new Date(f.Date).getTime() > recentCutoff; }).length;
  var score = Math.min(60, recentAttendance * 5) + Math.min(30, recentGiving * 6) + (attendance.length > 0 ? 10 : 0);
  return Math.round(score);
}
