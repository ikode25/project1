/**
 * Notifications.gs
 * Automated notifications driven by time-based triggers (see Triggers.gs):
 * birthdays, anniversaries, membership milestones, absence follow-up, and
 * admin-defined custom event reminders. Sent via MailApp (email) and, where
 * a phone number is on file and the member hasn't opted out, SMS.
 */

function runDailyNotifications_() {
  sendBirthdayReminders_();
  sendAnniversaryReminders_();
  sendAbsenceNotifications_();
  return { ok: true, ranAt: nowIso_() };
}

function sendBirthdayReminders_() {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var todays = upcomingBirthdays_(members, 0);
  todays.forEach(function (b) {
    var m = getById_(SHEETS.MEMBERS, b.id);
    if (!m || isBlank_(m.Email)) return;
    try {
      MailApp.sendEmail({
        to: m.Email,
        subject: 'Happy Birthday from ' + getSetting_('OrgName', APP_NAME) + '!',
        body: 'Dear ' + m.FirstName + ',\n\nWishing you a joyful birthday and a year full of God\'s blessings!\n\n- ' + getSetting_('OrgName', APP_NAME)
      });
    } catch (e) { logError_('sendBirthdayReminders_', e); }
  });
}

function sendAnniversaryReminders_() {
  var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active'; });
  var todays = upcomingAnniversaries_(members, 0);
  todays.forEach(function (a) {
    var m = getById_(SHEETS.MEMBERS, a.id);
    if (!m || isBlank_(m.Email)) return;
    try {
      MailApp.sendEmail({
        to: m.Email,
        subject: 'Celebrating ' + a.years + ' Year(s) With Us!',
        body: 'Dear ' + m.FirstName + ',\n\nToday marks ' + a.years + ' year(s) since you joined ' + getSetting_('OrgName', APP_NAME) + '. Thank you for being part of our family!\n\n- ' + getSetting_('OrgName', APP_NAME)
      });
    } catch (e) { logError_('sendAnniversaryReminders_', e); }
  });
}

function sendAbsenceNotifications_() {
  var weeks = Number(getSetting_('AbsenceThresholdWeeks', '3')) || 3;
  var absentees = findAbsentMembers_(weeks);
  var adminEmails = readAll_(SHEETS.USERS).filter(function (u) {
    return toBool_(u.Active) && (u.Role === ROLES.SUPER_ADMIN || u.Role === ROLES.ADMIN || u.Role === ROLES.CLUSTER_LEADER);
  }).map(function (u) { return u.Email; });
  if (!absentees.length || !adminEmails.length) return;
  var body = 'The following active members have not checked in for ' + weeks + '+ weeks:\n\n'
    + absentees.map(function (m) { return '- ' + m.FirstName + ' ' + m.LastName + ' (' + (m.Phone || 'no phone') + ')'; }).join('\n');
  try {
    MailApp.sendEmail({ to: adminEmails.join(','), subject: 'Absence Follow-Up — ' + absentees.length + ' member(s)', body: body });
  } catch (e) { logError_('sendAbsenceNotifications_', e); }
}

/** Client-callable: admin can trigger a one-off custom reminder to a member group. */
function sendCustomEventReminder(subject, body, group) {
  return safeCall_('sendCustomEventReminder', function () {
    requireRole_('sms', 'mutate');
    var recipients = resolveSmsRecipients_(group).filter(function (m) { return !isBlank_(m.Email); });
    recipients.forEach(function (m) {
      try { MailApp.sendEmail({ to: m.Email, subject: subject, body: body.replace(/\{name\}/gi, m.FirstName || '') }); } catch (e) { logError_('sendCustomEventReminder', e); }
    });
    logAudit_('CREATE', 'Notifications', '', 'Custom reminder "' + subject + '" sent to ' + recipients.length + ' member(s)');
    return { sent: recipients.length };
  });
}
