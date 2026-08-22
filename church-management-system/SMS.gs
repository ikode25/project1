/**
 * SMS.gs
 * Provider-agnostic bulk SMS: group messaging, templates, scheduling,
 * delivery logging and opt-out enforcement. The actual `UrlFetchApp` call is
 * isolated per provider (Arkesel, Hubtel, or a configurable custom gateway)
 * behind sendViaProvider_() so switching providers never touches callers.
 */

/* ---------- Templates ---------- */

function listSmsTemplates() {
  return safeCall_('listSmsTemplates', function () {
    requireRole_('sms', 'view');
    return readAll_(SHEETS.SMS_TEMPLATES);
  });
}

function saveSmsTemplate(data) {
  return safeCall_('saveSmsTemplate', function () {
    var user = requireRole_('sms', 'mutate');
    requireFields_(data, ['Name', 'Body']);
    var payload = { Name: sanitizeText_(data.Name), Body: sanitizeText_(data.Body) };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.SMS_TEMPLATES, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_(); payload.CreatedBy = user.Email;
      record = insertRow_(SHEETS.SMS_TEMPLATES, payload, ID_PREFIX.SMS_TEMPLATES);
    }
    return record;
  });
}

function deleteSmsTemplate(id) {
  return safeCall_('deleteSmsTemplate', function () {
    requireRole_('sms', 'mutate');
    deleteRow_(SHEETS.SMS_TEMPLATES, id);
    return { ok: true };
  });
}

/* ---------- Recipient resolution ---------- */

/** group: 'all' | 'active' | 'new' | 'visitors' | 'cluster:<name>' | 'department:<name>' */
function resolveSmsRecipients_(group) {
  var members = readAll_(SHEETS.MEMBERS);
  var pool;
  if (group === 'visitors') {
    pool = readAll_(SHEETS.VISITORS).map(function (v) { return { ID: v.ID, FirstName: v.FirstName, LastName: v.LastName, Phone: v.Phone, SmsOptOut: 'FALSE' }; });
  } else if (group === 'active') {
    pool = members.filter(function (m) { return m.MembershipStatus === 'Active'; });
  } else if (group === 'new') {
    pool = members.filter(function (m) { return m.MembershipStatus === 'New'; });
  } else if (group && group.indexOf('cluster:') === 0) {
    var clusterName = group.slice(8);
    pool = members.filter(function (m) { return m.Cluster === clusterName; });
  } else if (group && group.indexOf('department:') === 0) {
    var dept = group.slice(11);
    pool = members.filter(function (m) { return m.Department === dept; });
  } else {
    pool = members;
  }
  return pool.filter(function (m) { return isValidPhone_(m.Phone) && !toBool_(m.SmsOptOut); });
}

function getSmsGroupOptions() {
  return safeCall_('getSmsGroupOptions', function () {
    requireRole_('sms', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    var clusters = uniq_(members.map(function (m) { return m.Cluster; }).filter(Boolean));
    var departments = uniq_(members.map(function (m) { return m.Department; }).filter(Boolean));
    return { clusters: clusters, departments: departments };
  });
}

function uniq_(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }

/* ---------- Send / schedule ---------- */

function sendBulkSms(group, message, scheduledFor) {
  return safeCall_('sendBulkSms', function () {
    var user = requireRole_('sms', 'mutate');
    if (isBlank_(message)) throw new Error('Message body is required.');
    var recipients = resolveSmsRecipients_(group);
    if (!recipients.length) throw new Error('No opted-in recipients match that group.');

    var results = { sent: 0, failed: 0, scheduled: 0 };
    recipients.forEach(function (r) {
      var name = (r.FirstName || '') + ' ' + (r.LastName || '');
      var personalized = message.replace(/\{name\}/gi, (r.FirstName || '').trim() || 'friend');
      if (scheduledFor) {
        insertRow_(SHEETS.SMS_LOG, {
          RecipientPhone: normalizePhone_(r.Phone), RecipientMemberID: r.ID || '', RecipientName: name.trim(),
          MessageBody: personalized, Provider: getSetting_('SmsProvider', 'arkesel'), Status: 'Scheduled',
          SentAt: '', ScheduledFor: scheduledFor, GroupLabel: group, ErrorDetail: '', CreatedBy: user.Email
        }, ID_PREFIX.SMS_LOG);
        results.scheduled++;
        return;
      }
      var outcome = dispatchSms_(normalizePhone_(r.Phone), personalized);
      insertRow_(SHEETS.SMS_LOG, {
        RecipientPhone: normalizePhone_(r.Phone), RecipientMemberID: r.ID || '', RecipientName: name.trim(),
        MessageBody: personalized, Provider: outcome.provider, Status: outcome.ok ? 'Sent' : 'Failed',
        SentAt: nowIso_(), ScheduledFor: '', GroupLabel: group, ErrorDetail: outcome.ok ? '' : outcome.error, CreatedBy: user.Email
      }, ID_PREFIX.SMS_LOG);
      if (outcome.ok) results.sent++; else results.failed++;
    });
    logAudit_('CREATE', 'SMS_Log', '', 'Bulk SMS to "' + group + '": ' + JSON.stringify(results));
    return results;
  });
}

/** Sends to a single ad-hoc phone number (e.g. from a member profile), bypassing group resolution. */
function sendSingleSms(phone, message, memberId) {
  return safeCall_('sendSingleSms', function () {
    var user = requireRole_('sms', 'mutate');
    if (!isValidPhone_(phone)) throw new Error('Invalid phone number.');
    if (isBlank_(message)) throw new Error('Message body is required.');
    var outcome = dispatchSms_(normalizePhone_(phone), message);
    insertRow_(SHEETS.SMS_LOG, {
      RecipientPhone: normalizePhone_(phone), RecipientMemberID: memberId || '', RecipientName: '',
      MessageBody: message, Provider: outcome.provider, Status: outcome.ok ? 'Sent' : 'Failed',
      SentAt: nowIso_(), ScheduledFor: '', GroupLabel: 'direct', ErrorDetail: outcome.ok ? '' : outcome.error, CreatedBy: user.Email
    }, ID_PREFIX.SMS_LOG);
    return outcome;
  });
}

function listSmsLog(limit) {
  return safeCall_('listSmsLog', function () {
    requireRole_('sms', 'view');
    var rows = readAll_(SHEETS.SMS_LOG);
    rows.reverse();
    return rows.slice(0, limit || 300);
  });
}

function toggleMemberSmsOptOut(memberId, optOut) {
  return safeCall_('toggleMemberSmsOptOut', function () {
    requireRole_('sms', 'mutate');
    updateRow_(SHEETS.MEMBERS, memberId, { SmsOptOut: optOut ? 'TRUE' : 'FALSE' });
    logAudit_('UPDATE', 'Members', memberId, (optOut ? 'Opted out of' : 'Opted into') + ' SMS');
    return { ok: true };
  });
}

/** Called hourly by a time-driven trigger; sends anything whose ScheduledFor has arrived. */
function processScheduledSms_() {
  var rows = readAll_(SHEETS.SMS_LOG).filter(function (r) { return r.Status === 'Scheduled' && r.ScheduledFor && new Date(r.ScheduledFor) <= new Date(); });
  rows.forEach(function (r) {
    var outcome = dispatchSms_(r.RecipientPhone, r.MessageBody);
    updateRow_(SHEETS.SMS_LOG, r.ID, {
      Status: outcome.ok ? 'Sent' : 'Failed', SentAt: nowIso_(), Provider: outcome.provider,
      ErrorDetail: outcome.ok ? '' : outcome.error
    });
  });
  return rows.length;
}

/* ---------- Provider dispatch (swap-friendly) ---------- */

function dispatchSms_(phone, message) {
  var provider = getSetting_('SmsProvider', 'arkesel');
  try {
    if (provider === 'hubtel') return sendViaHubtel_(phone, message);
    if (provider === 'custom') return sendViaCustomProvider_(phone, message);
    return sendViaArkesel_(phone, message);
  } catch (err) {
    logError_('dispatchSms_', err);
    return { ok: false, provider: provider, error: err.message };
  }
}

function sendViaArkesel_(phone, message) {
  var apiKey = getSetting_('Sms_Arkesel_ApiKey', '');
  var senderId = getSetting_('Sms_Arkesel_SenderId', 'ChurchMS');
  if (!apiKey) return { ok: false, provider: 'arkesel', error: 'Arkesel API key not configured in Settings.' };
  var resp = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/sms/send', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': apiKey },
    payload: JSON.stringify({ sender: senderId, message: message, recipients: [phone] }),
    muteHttpExceptions: true
  });
  var code = resp.getResponseCode();
  var body = safeJson_(resp.getContentText());
  var ok = code >= 200 && code < 300 && body && (body.status === 'success' || body.code === 'ok');
  return { ok: ok, provider: 'arkesel', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

function sendViaHubtel_(phone, message) {
  var clientId = getSetting_('Sms_Hubtel_ClientId', '');
  var clientSecret = getSetting_('Sms_Hubtel_ClientSecret', '');
  var senderId = getSetting_('Sms_Hubtel_SenderId', 'ChurchMS');
  if (!clientId || !clientSecret) return { ok: false, provider: 'hubtel', error: 'Hubtel credentials not configured in Settings.' };
  var url = 'https://sms.hubtel.com/v1/messages/send'
    + '?clientid=' + encodeURIComponent(clientId)
    + '&clientsecret=' + encodeURIComponent(clientSecret)
    + '&from=' + encodeURIComponent(senderId)
    + '&to=' + encodeURIComponent(phone)
    + '&content=' + encodeURIComponent(message);
  var resp = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  var code = resp.getResponseCode();
  var ok = code >= 200 && code < 300;
  return { ok: ok, provider: 'hubtel', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

/** Generic custom provider: endpoint/method/field names/API key all come from Settings, so any REST SMS gateway works. */
function sendViaCustomProvider_(phone, message) {
  var endpoint = getSetting_('Sms_Custom_Endpoint', '');
  var method = (getSetting_('Sms_Custom_Method', 'POST') || 'POST').toLowerCase();
  var apiKey = getSetting_('Sms_Custom_ApiKey', '');
  var phoneField = getSetting_('Sms_Custom_PhoneField', 'to');
  var msgField = getSetting_('Sms_Custom_MessageField', 'message');
  if (!endpoint) return { ok: false, provider: 'custom', error: 'Custom SMS endpoint not configured in Settings.' };

  var payload = {};
  payload[phoneField] = phone;
  payload[msgField] = message;
  var options = { method: method, muteHttpExceptions: true, headers: {} };
  if (apiKey) options.headers['Authorization'] = 'Bearer ' + apiKey;

  var url = endpoint;
  if (method === 'get') {
    var qs = Object.keys(payload).map(function (k) { return k + '=' + encodeURIComponent(payload[k]); }).join('&');
    url += (endpoint.indexOf('?') === -1 ? '?' : '&') + qs;
  } else {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  var resp = UrlFetchApp.fetch(url, options);
  var code = resp.getResponseCode();
  var ok = code >= 200 && code < 300;
  return { ok: ok, provider: 'custom', error: ok ? '' : (resp.getContentText() || 'HTTP ' + code) };
}

function safeJson_(text) {
  try { return JSON.parse(text); } catch (e) { return null; }
}
