/**
 * Visitors.gs
 * First-time/returning visitor tracking and conversion into full Members.
 */

function listVisitors() {
  return safeCall_('listVisitors', function () {
    requireRole_('visitors', 'view');
    return readAll_(SHEETS.VISITORS).sort(function (a, b) { return new Date(b.VisitDate) - new Date(a.VisitDate); });
  });
}

function saveVisitor(data) {
  return safeCall_('saveVisitor', function () {
    var user = requireRole_('visitors', 'mutate');
    requireFields_(data, ['FirstName', 'LastName', 'VisitDate']);
    if (!isValidEmail_(data.Email)) throw new Error('Enter a valid email address.');
    if (!isValidDate_(data.VisitDate)) throw new Error('Enter a valid visit date.');
    requireEnum_(data.FollowUpStatus, OPTIONS.FOLLOW_UP_STATUS, 'Follow-up status');

    var payload = {
      FirstName: sanitizeText_(data.FirstName),
      LastName: sanitizeText_(data.LastName),
      Phone: normalizePhone_(data.Phone || ''),
      Email: sanitizeText_(data.Email || ''),
      Address: sanitizeText_(data.Address || ''),
      VisitDate: data.VisitDate,
      HowHeard: sanitizeText_(data.HowHeard || ''),
      Interest: sanitizeText_(data.Interest || ''),
      FollowUpStatus: data.FollowUpStatus || 'New',
      AssignedTo: sanitizeText_(data.AssignedTo || ''),
      Notes: sanitizeText_(data.Notes || '')
    };

    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.VISITORS, data.ID, payload);
      logAudit_('UPDATE', 'Visitors', data.ID, 'Updated visitor ' + payload.FirstName + ' ' + payload.LastName);
    } else {
      payload.CreatedAt = nowIso_();
      payload.CreatedBy = user.Email;
      payload.ConvertedMemberID = '';
      record = insertRow_(SHEETS.VISITORS, payload, ID_PREFIX.VISITORS);
      logAudit_('CREATE', 'Visitors', record.ID, 'Logged visitor ' + payload.FirstName + ' ' + payload.LastName);
    }
    return record;
  });
}

function deleteVisitor(id) {
  return safeCall_('deleteVisitor', function () {
    requireRole_('visitors', 'mutate');
    deleteRow_(SHEETS.VISITORS, id);
    logAudit_('DELETE', 'Visitors', id, 'Removed visitor record');
    return { ok: true };
  });
}

/** Converts a visitor into a full Member record and marks the visitor row Converted. */
function convertVisitorToMember(visitorId, extra) {
  return safeCall_('convertVisitorToMember', function () {
    var user = requireRole_('members', 'mutate');
    var v = getById_(SHEETS.VISITORS, visitorId);
    if (!v) throw new Error('Visitor not found.');
    if (v.ConvertedMemberID) throw new Error('This visitor has already been converted.');

    var memberPayload = Object.assign({
      FirstName: v.FirstName,
      LastName: v.LastName,
      Phone: v.Phone,
      Email: v.Email,
      Address: v.Address,
      MembershipStatus: 'New',
      MembershipDate: new Date().toISOString().split('T')[0],
      Gender: '', MaritalStatus: '', CustomFieldValues: {}
    }, extra || {});
    var member = saveMember(memberPayload);

    updateRow_(SHEETS.VISITORS, visitorId, { FollowUpStatus: 'Converted', ConvertedMemberID: member.ID });
    logAudit_('UPDATE', 'Visitors', visitorId, 'Converted to member ' + member.ID);
    return member;
  });
}
