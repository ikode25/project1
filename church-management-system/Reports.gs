/**
 * Reports.gs
 * Cross-module analytics: attendance patterns, financial trends, growth
 * metrics, cluster effectiveness, and member engagement scoring. Also
 * exposes CSV export for any of the underlying record sets.
 */

function getAttendanceReport(from, to) {
  return safeCall_('getAttendanceReport', function () {
    requireRole_('reports', 'view');
    var rows = readAll_(SHEETS.ATTENDANCE).filter(inRange_(from, to, 'ServiceDate'));
    var byService = {};
    rows.forEach(function (r) { byService[r.ServiceType] = (byService[r.ServiceType] || 0) + 1; });
    var byDate = {};
    rows.forEach(function (r) { var d = (r.ServiceDate || '').split('T')[0]; byDate[d] = (byDate[d] || 0) + 1; });
    var series = Object.keys(byDate).sort().map(function (d) { return { date: d, count: byDate[d] }; });
    return { total: rows.length, byService: byService, series: series };
  });
}

function getGrowthReport(months) {
  return safeCall_('getGrowthReport', function () {
    requireRole_('reports', 'view');
    var members = readAll_(SHEETS.MEMBERS);
    return { memberGrowth: memberGrowth_(members, months || 12), statusBreakdown: statusBreakdown_(members) };
  });
}

function getClusterEffectivenessReport() {
  return safeCall_('getClusterEffectivenessReport', function () {
    requireRole_('reports', 'view');
    var clusters = readAll_(SHEETS.CLUSTERS);
    var members = readAll_(SHEETS.MEMBERS);
    var followups = readAll_(SHEETS.CLUSTER_FOLLOWUPS);
    var attendance = readAll_(SHEETS.ATTENDANCE);
    return clusters.map(function (c) {
      var clusterMembers = members.filter(function (m) { return m.Cluster === c.Name; });
      var memberIds = clusterMembers.map(function (m) { return m.ID; });
      var attendanceCount = attendance.filter(function (a) { return memberIds.indexOf(a.MemberID) !== -1; }).length;
      var followupCount = followups.filter(function (f) { return f.ClusterID === c.ID; }).length;
      return {
        cluster: c.Name, leader: c.LeaderName, memberCount: clusterMembers.length,
        avgAttendancePerMember: clusterMembers.length ? Math.round((attendanceCount / clusterMembers.length) * 10) / 10 : 0,
        followUps: followupCount
      };
    });
  });
}

function getMemberEngagementReport() {
  return safeCall_('getMemberEngagementReport', function () {
    requireRole_('reports', 'view');
    var members = readAll_(SHEETS.MEMBERS).filter(function (m) { return m.MembershipStatus === 'Active' || m.MembershipStatus === 'New'; });
    return members.map(function (m) {
      return { id: m.ID, name: m.FirstName + ' ' + m.LastName, score: computeMemberEngagementScore_(m.ID) };
    }).sort(function (a, b) { return b.score - a.score; });
  });
}

/** Returns CSV text for one of the core sheets, for the frontend to trigger a download of. */
function exportSheetCsv(sheetKey) {
  return safeCall_('exportSheetCsv', function () {
    requireRole_('reports', 'view');
    var name = SHEETS[sheetKey];
    if (!name) throw new Error('Unknown export target.');
    var headers = SCHEMA[name];
    var rows = readAll_(name);
    var lines = [headers.join(',')];
    rows.forEach(function (r) {
      lines.push(headers.map(function (h) { return csvEscape_(r[h]); }).join(','));
    });
    return lines.join('\n');
  });
}

function csvEscape_(v) {
  if (v === null || v === undefined) return '';
  var s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
