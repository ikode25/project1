/**
 * Attendance.gs
 * QR/manual check-in, service-type tracking, per-member history, and the
 * consecutive-absence detector used by the daily notification job.
 */

function listAttendance(filters) {
  return safeCall_('listAttendance', function () {
    requireRole_('attendance', 'view');
    var rows = readAll_(SHEETS.ATTENDANCE);
    filters = filters || {};
    if (filters.serviceDate) rows = rows.filter(function (r) { return (r.ServiceDate || '').indexOf(filters.serviceDate) === 0; });
    if (filters.serviceType) rows = rows.filter(function (r) { return r.ServiceType === filters.serviceType; });
    if (filters.memberId) rows = rows.filter(function (r) { return r.MemberID === filters.memberId; });
    return rows.sort(function (a, b) { return new Date(b.CheckInTime) - new Date(a.CheckInTime); });
  });
}

/** Returns a Google Chart QR-code image URL encoding this member's check-in link. */
function getMemberQrUrl(memberId) {
  return safeCall_('getMemberQrUrl', function () {
    requireRole_('attendance', 'view');
    var url = ScriptApp.getService().getUrl() + '?page=checkin&id=' + encodeURIComponent(memberId);
    return 'https://chart.googleapis.com/chart?cht=qr&chs=260x260&chld=M|2&chl=' + encodeURIComponent(url);
  });
}

/** Admin-side manual check-in (used from the Attendance module, not the public QR page). */
function recordAttendance(data) {
  return safeCall_('recordAttendance', function () {
    var user = requireRole_('attendance', 'mutate');
    return checkInMember_(data.MemberID, data.ServiceType, data.ServiceDate, 'Manual', user.Email, data.Notes);
  });
}

/** Public check-in used by the QR/self-service page. Rate-limited; no role required (kiosk/mobile use). */
function publicCheckIn(memberId, serviceType) {
  return safeCall_('publicCheckIn', function () {
    checkRateLimit_('checkin_' + memberId, 5, 60);
    var m = getById_(SHEETS.MEMBERS, memberId);
    if (!m) throw new Error('We could not find that member ID. Please see an usher for help.');
    var today = new Date().toISOString().split('T')[0];
    return checkInMember_(memberId, serviceType || OPTIONS.SERVICE_TYPE[0], today, 'QR', 'self-service', '');
  });
}

function checkInMember_(memberId, serviceType, serviceDate, method, recordedBy, notes) {
  requireFields_({ memberId: memberId, serviceType: serviceType, serviceDate: serviceDate }, ['memberId', 'serviceType', 'serviceDate']);
  requireEnum_(serviceType, OPTIONS.SERVICE_TYPE, 'Service type');
  var m = getById_(SHEETS.MEMBERS, memberId);
  if (!m) throw new Error('Member not found.');

  var already = readAll_(SHEETS.ATTENDANCE).some(function (a) {
    return a.MemberID === memberId && a.ServiceType === serviceType && (a.ServiceDate || '').indexOf(serviceDate) === 0;
  });
  if (already) throw new Error(m.FirstName + ' is already checked in for this service.');

  var record = insertRow_(SHEETS.ATTENDANCE, {
    MemberID: memberId,
    MemberName: m.FirstName + ' ' + m.LastName,
    ServiceType: serviceType,
    ServiceDate: serviceDate,
    CheckInTime: nowIso_(),
    CheckInMethod: method,
    RecordedBy: recordedBy,
    Notes: sanitizeText_(notes || '')
  }, ID_PREFIX.ATTENDANCE);
  logAudit_('CREATE', 'Attendance', record.ID, m.FirstName + ' ' + m.LastName + ' checked in (' + method + ') for ' + serviceType);
  return record;
}

function deleteAttendance(id) {
  return safeCall_('deleteAttendance', function () {
    requireRole_('attendance', 'mutate');
    deleteRow_(SHEETS.ATTENDANCE, id);
    logAudit_('DELETE', 'Attendance', id, 'Removed attendance record');
    return { ok: true };
  });
}

/** Members who have zero attendance in the last N Sundays — used by Notifications.gs for absence alerts. */
function findAbsentMembers_(consecutiveWeeks) {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var attendance = readAll_(SHEETS.ATTENDANCE);
  var cutoff = Date.now() - consecutiveWeeks * 7 * 24 * 3600 * 1000;
  return members.filter(function (m) {
    var recent = attendance.some(function (a) { return a.MemberID === m.ID && new Date(a.ServiceDate).getTime() > cutoff; });
    return !recent;
  });
}
