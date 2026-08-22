/**
 * Dashboard.gs
 * Aggregation functions feeding the dashboard's KPI cards, Google Charts,
 * alerts panel and birthday/anniversary widget. Read-only.
 */

function getDashboardData() {
  return safeCall_('getDashboardData', function () {
    requireRole_('dashboard', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    var visitors = readAll_(SHEETS.VISITORS);
    var attendance = readAll_(SHEETS.ATTENDANCE);
    var finance = readAll_(SHEETS.FINANCE);
    var pledges = readAll_(SHEETS.PLEDGES);
    var expenses = readAll_(SHEETS.EXPENSES);
    var prayer = readAll_(SHEETS.PRAYER_REQUESTS);

    var activeMembers = members.filter(function (m) { return m.MembershipStatus === 'Active' || m.MembershipStatus === 'New'; });
    var thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0, 0, 0, 0);
    var newThisMonth = members.filter(function (m) { return m.CreatedAt && new Date(m.CreatedAt) >= thisMonthStart; }).length;

    var last8Sundays = attendanceTrend_(attendance, 8);
    var givingTrend = givingTrend_(finance, 6);
    var memberGrowth = memberGrowth_(members, 6);

    var totalGivingThisMonth = finance.filter(function (f) { return f.Date && new Date(f.Date) >= thisMonthStart; })
      .reduce(function (s, f) { return s + (Number(f.Amount) || 0); }, 0);
    var pendingExpenses = expenses.filter(function (e) { return e.Status === 'Pending'; });
    var openPrayerRequests = prayer.filter(function (p) { return p.Status === 'New' || p.Status === 'In Progress'; });

    return {
      kpis: {
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        newThisMonth: newThisMonth,
        visitorsThisMonth: visitors.filter(function (v) { return v.CreatedAt && new Date(v.CreatedAt) >= thisMonthStart; }).length,
        lastServiceAttendance: last8Sundays.length ? last8Sundays[last8Sundays.length - 1].count : 0,
        givingThisMonth: totalGivingThisMonth,
        pendingExpenses: pendingExpenses.length,
        openPrayerRequests: openPrayerRequests.length
      },
      charts: {
        attendanceTrend: last8Sundays,
        givingTrend: givingTrend,
        memberGrowth: memberGrowth,
        statusBreakdown: statusBreakdown_(members)
      },
      alerts: buildAlerts_(pendingExpenses, openPrayerRequests, pledges, members),
      birthdays: upcomingBirthdays_(members, 14),
      anniversaries: upcomingAnniversaries_(members, 14)
    };
  });
}

function attendanceTrend_(attendance, weeks) {
  var byDate = {};
  attendance.forEach(function (a) {
    var d = (a.ServiceDate || '').split('T')[0];
    if (!d) return;
    byDate[d] = (byDate[d] || 0) + 1;
  });
  var dates = Object.keys(byDate).sort();
  var recent = dates.slice(-weeks);
  return recent.map(function (d) { return { date: d, count: byDate[d] }; });
}

function givingTrend_(finance, months) {
  var byMonth = {};
  finance.forEach(function (f) {
    if (!f.Date) return;
    var m = String(f.Date).slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + (Number(f.Amount) || 0);
  });
  var keys = Object.keys(byMonth).sort();
  var recent = keys.slice(-months);
  return recent.map(function (k) { return { month: k, amount: byMonth[k] }; });
}

function memberGrowth_(members, months) {
  var byMonth = {};
  members.forEach(function (m) {
    if (!m.CreatedAt) return;
    var k = String(m.CreatedAt).slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + 1;
  });
  var keys = Object.keys(byMonth).sort();
  var recent = keys.slice(-months);
  var running = 0;
  var before = keys.slice(0, Math.max(keys.length - months, 0)).reduce(function (s, k) { return s + byMonth[k]; }, 0);
  running = before;
  return recent.map(function (k) { running += byMonth[k]; return { month: k, total: running, added: byMonth[k] }; });
}

function statusBreakdown_(members) {
  var counts = {};
  OPTIONS.MEMBERSHIP_STATUS.forEach(function (s) { counts[s] = 0; });
  members.forEach(function (m) { counts[m.MembershipStatus] = (counts[m.MembershipStatus] || 0) + 1; });
  return Object.keys(counts).map(function (k) { return { status: k, count: counts[k] }; });
}

function buildAlerts_(pendingExpenses, openPrayerRequests, pledges, members) {
  var alerts = [];
  if (pendingExpenses.length) {
    alerts.push({ level: 'orange', text: pendingExpenses.length + ' expense claim(s) awaiting approval', link: 'finance' });
  }
  if (openPrayerRequests.length) {
    alerts.push({ level: 'blue', text: openPrayerRequests.length + ' open prayer request(s) need a response', link: 'communication' });
  }
  var overdue = pledges.filter(function (p) { return p.Status === 'Overdue'; });
  if (overdue.length) {
    alerts.push({ level: 'red', text: overdue.length + ' pledge(s) overdue', link: 'finance' });
  }
  var missingContact = members.filter(function (m) { return (m.MembershipStatus === 'Active' || m.MembershipStatus === 'New') && isBlank_(m.Phone) && isBlank_(m.Email); });
  if (missingContact.length) {
    alerts.push({ level: 'amber', text: missingContact.length + ' active member(s) have no phone or email on file', link: 'members' });
  }
  if (!alerts.length) alerts.push({ level: 'green', text: 'All caught up — no outstanding items right now.', link: '' });
  return alerts;
}

function upcomingBirthdays_(members, withinDays) {
  var today = new Date();
  return members.filter(function (m) { return !isBlank_(m.DOB); }).map(function (m) {
    var dob = new Date(m.DOB);
    var next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < stripTime_(today)) next.setFullYear(today.getFullYear() + 1);
    var days = Math.round((next - stripTime_(today)) / 86400000);
    return { id: m.ID, name: m.FirstName + ' ' + m.LastName, date: next.toISOString().split('T')[0], daysAway: days, turning: next.getFullYear() - dob.getFullYear() };
  }).filter(function (x) { return x.daysAway >= 0 && x.daysAway <= withinDays; })
    .sort(function (a, b) { return a.daysAway - b.daysAway; });
}

function upcomingAnniversaries_(members, withinDays) {
  var today = new Date();
  return members.filter(function (m) { return !isBlank_(m.MembershipDate); }).map(function (m) {
    var start = new Date(m.MembershipDate);
    var next = new Date(today.getFullYear(), start.getMonth(), start.getDate());
    if (next < stripTime_(today)) next.setFullYear(today.getFullYear() + 1);
    var days = Math.round((next - stripTime_(today)) / 86400000);
    return { id: m.ID, name: m.FirstName + ' ' + m.LastName, date: next.toISOString().split('T')[0], daysAway: days, years: next.getFullYear() - start.getFullYear() };
  }).filter(function (x) { return x.daysAway >= 0 && x.daysAway <= withinDays && x.years > 0; })
    .sort(function (a, b) { return a.daysAway - b.daysAway; });
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
