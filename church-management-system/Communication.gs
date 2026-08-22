/**
 * Communication.gs
 * Prayer Request system (public submission + admin prayer-chain workflow)
 * and internal messaging between admin users (direct + group threads).
 */

/* ---------- Prayer Requests ---------- */

/** Public, rate-limited: anyone with the ?page=prayer link can submit — no login required. */
function submitPrayerRequest(data) {
  return safeCall_('submitPrayerRequest', function () {
    checkRateLimit_('prayer_submit_' + (data.RequesterContact || 'anon'), 3, 300);
    requireFields_(data, ['RequestText']);
    requireEnum_(data.Visibility, OPTIONS.PRAYER_VISIBILITY, 'Visibility');
    var record = insertRow_(SHEETS.PRAYER_REQUESTS, {
      RequesterName: sanitizeText_(data.RequesterName || 'Anonymous'),
      RequesterContact: sanitizeText_(data.RequesterContact || ''),
      RequestText: sanitizeText_(data.RequestText),
      Visibility: data.Visibility || 'Private',
      Status: 'New', AssignedTo: '', ResponseNotes: '', SubmittedAt: nowIso_()
    }, ID_PREFIX.PRAYER_REQUESTS);
    return { ok: true, id: record.ID };
  });
}

function listPrayerRequests() {
  return safeCall_('listPrayerRequests', function () {
    requireRole_('sms', 'view'); // communication hub shares the SMS/comms permission set
    var rows = readAll_(SHEETS.PRAYER_REQUESTS);
    return rows.sort(function (a, b) { return new Date(b.SubmittedAt) - new Date(a.SubmittedAt); });
  });
}

function updatePrayerRequest(data) {
  return safeCall_('updatePrayerRequest', function () {
    var user = requireRole_('sms', 'mutate');
    requireEnum_(data.Status, OPTIONS.PRAYER_STATUS, 'Status');
    var record = updateRow_(SHEETS.PRAYER_REQUESTS, data.ID, {
      Status: data.Status, AssignedTo: sanitizeText_(data.AssignedTo || user.Email),
      ResponseNotes: sanitizeText_(data.ResponseNotes || '')
    });
    logAudit_('UPDATE', 'PrayerRequests', data.ID, 'Set status to ' + data.Status);
    return record;
  });
}

/* ---------- Internal Messaging ---------- */

function listMessageThreads() {
  return safeCall_('listMessageThreads', function () {
    var user = requireRole_('sms', 'view');
    var threads = readAll_(SHEETS.MESSAGE_THREADS).filter(function (t) {
      var participants = safeJson_(t.Participants) || [];
      return participants.indexOf(user.Email) !== -1;
    });
    var messages = readAll_(SHEETS.MESSAGES);
    return threads.map(function (t) {
      var msgs = messages.filter(function (m) { return m.ThreadID === t.ID; });
      var last = msgs[msgs.length - 1];
      return Object.assign({}, t, { LastMessage: last ? last.Body : '', LastAt: last ? last.SentAt : t.CreatedAt, MessageCount: msgs.length });
    }).sort(function (a, b) { return new Date(b.LastAt) - new Date(a.LastAt); });
  });
}

function createMessageThread(name, participantEmails, type) {
  return safeCall_('createMessageThread', function () {
    var user = requireRole_('sms', 'view');
    if (!Array.isArray(participantEmails) || !participantEmails.length) throw new Error('Select at least one participant.');
    var participants = uniq_(participantEmails.concat([user.Email]));
    var record = insertRow_(SHEETS.MESSAGE_THREADS, {
      Type: type === 'Group' ? 'Group' : 'Direct', Name: sanitizeText_(name || participants.join(', ')),
      Participants: JSON.stringify(participants), CreatedAt: nowIso_(), CreatedBy: user.Email
    }, ID_PREFIX.MESSAGE_THREADS);
    return record;
  });
}

function listThreadMessages(threadId) {
  return safeCall_('listThreadMessages', function () {
    var user = requireRole_('sms', 'view');
    assertThreadMember_(threadId, user.Email);
    var messages = readAll_(SHEETS.MESSAGES).filter(function (m) { return m.ThreadID === threadId; })
      .sort(function (a, b) { return new Date(a.SentAt) - new Date(b.SentAt); });
    messages.forEach(function (m) {
      var readBy = safeJson_(m.ReadBy) || [];
      if (readBy.indexOf(user.Email) === -1) {
        readBy.push(user.Email);
        updateRow_(SHEETS.MESSAGES, m.ID, { ReadBy: JSON.stringify(readBy) });
      }
    });
    return messages;
  });
}

function sendMessage(threadId, body, attachmentDriveUrl) {
  return safeCall_('sendMessage', function () {
    var user = requireRole_('sms', 'view');
    assertThreadMember_(threadId, user.Email);
    if (isBlank_(body)) throw new Error('Message cannot be empty.');
    var record = insertRow_(SHEETS.MESSAGES, {
      ThreadID: threadId, FromUser: user.Email, Body: sanitizeText_(body),
      Attachments: attachmentDriveUrl || '', SentAt: nowIso_(), ReadBy: JSON.stringify([user.Email])
    }, ID_PREFIX.MESSAGES);
    return record;
  });
}

function assertThreadMember_(threadId, email) {
  var thread = getById_(SHEETS.MESSAGE_THREADS, threadId);
  if (!thread) throw new Error('Conversation not found.');
  var participants = safeJson_(thread.Participants) || [];
  if (participants.indexOf(email) === -1) throw new Error('Access denied: not a participant in this conversation.');
  return thread;
}

/** Directory of active admin users for the "new message" participant picker. */
function listMessagingContacts() {
  return safeCall_('listMessagingContacts', function () {
    var user = requireRole_('sms', 'view');
    return readAll_(SHEETS.USERS).filter(function (u) { return toBool_(u.Active) && u.Email !== user.Email; })
      .map(function (u) { return { email: u.Email, name: u.FullName, role: u.Role }; });
  });
}
