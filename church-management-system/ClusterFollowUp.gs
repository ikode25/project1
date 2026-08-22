/**
 * ClusterFollowUp.gs
 * Small-group ("cluster") management and per-member follow-up logging,
 * used to track ministry/cluster effectiveness.
 */

function listClusters() {
  return safeCall_('listClusters', function () {
    requireRole_('cluster', 'view');
    var clusters = readAll_(SHEETS.CLUSTERS);
    var members = readAll_(SHEETS.MEMBERS);
    return clusters.map(function (c) {
      var count = members.filter(function (m) { return m.Cluster === c.Name; }).length;
      return Object.assign({}, c, { MemberCount: count });
    });
  });
}

function saveCluster(data) {
  return safeCall_('saveCluster', function () {
    requireRole_('cluster', 'mutate');
    requireFields_(data, ['Name']);
    var leaderName = data.LeaderName || '';
    if (data.LeaderMemberID) {
      var m = getById_(SHEETS.MEMBERS, data.LeaderMemberID);
      if (m) leaderName = m.FirstName + ' ' + m.LastName;
    }
    var payload = {
      Name: sanitizeText_(data.Name), LeaderMemberID: data.LeaderMemberID || '', LeaderName: sanitizeText_(leaderName),
      MeetingDay: sanitizeText_(data.MeetingDay || ''), Location: sanitizeText_(data.Location || ''),
      Status: data.Status || 'Active', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CLUSTERS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CLUSTERS, payload, ID_PREFIX.CLUSTERS);
    }
    logAudit_('UPDATE', 'Clusters', record.ID, 'Saved cluster ' + payload.Name);
    return record;
  });
}

function deleteCluster(id) {
  return safeCall_('deleteCluster', function () {
    requireRole_('cluster', 'mutate');
    deleteRow_(SHEETS.CLUSTERS, id);
    logAudit_('DELETE', 'Clusters', id, 'Removed cluster');
    return { ok: true };
  });
}

function listClusterFollowUps(clusterId) {
  return safeCall_('listClusterFollowUps', function () {
    requireRole_('cluster', 'view');
    var rows = readAll_(SHEETS.CLUSTER_FOLLOWUPS);
    if (clusterId) rows = rows.filter(function (r) { return r.ClusterID === clusterId; });
    return rows.sort(function (a, b) { return new Date(b.FollowUpDate) - new Date(a.FollowUpDate); });
  });
}

function saveClusterFollowUp(data) {
  return safeCall_('saveClusterFollowUp', function () {
    var user = requireRole_('cluster', 'mutate');
    requireFields_(data, ['ClusterID', 'MemberID', 'FollowUpDate', 'Type']);
    requireEnum_(data.Type, OPTIONS.FOLLOWUP_TYPE, 'Type');
    var cluster = getById_(SHEETS.CLUSTERS, data.ClusterID);
    var member = getById_(SHEETS.MEMBERS, data.MemberID);
    if (!cluster) throw new Error('Cluster not found.');
    if (!member) throw new Error('Member not found.');
    var payload = {
      ClusterID: data.ClusterID, ClusterName: cluster.Name, MemberID: data.MemberID,
      MemberName: member.FirstName + ' ' + member.LastName, FollowUpDate: data.FollowUpDate, Type: data.Type,
      Notes: sanitizeText_(data.Notes || ''), Outcome: sanitizeText_(data.Outcome || ''), FollowedUpBy: user.Email
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.CLUSTER_FOLLOWUPS, data.ID, payload);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.CLUSTER_FOLLOWUPS, payload, ID_PREFIX.CLUSTER_FOLLOWUPS);
    }
    logAudit_('UPDATE', 'ClusterFollowUps', record.ID, 'Logged follow-up for ' + payload.MemberName);
    return record;
  });
}

function deleteClusterFollowUp(id) {
  return safeCall_('deleteClusterFollowUp', function () {
    requireRole_('cluster', 'mutate');
    deleteRow_(SHEETS.CLUSTER_FOLLOWUPS, id);
    return { ok: true };
  });
}
