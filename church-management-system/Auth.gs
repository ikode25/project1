/**
 * Auth.gs
 * Session identity, role-based access control, and audit logging.
 * Every privileged backend function must call requireRole_() itself —
 * a hidden frontend button is never sufficient enforcement.
 */

/** Returns the caller's Users-sheet record, or null if they're not provisioned. */
function getCurrentUserRecord_() {
  var email = currentUserEmail_();
  var users = readAll_(SHEETS.USERS);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].Email).toLowerCase() === String(email).toLowerCase() && toBool_(users[i].Active)) {
      return users[i];
    }
  }
  return null;
}

/** Client-callable: bootstraps the shell with the signed-in user's identity + role + permitted modules. */
function getSessionInfo() {
  return safeCall_('getSessionInfo', function () {
    var email = currentUserEmail_();
    var user = getCurrentUserRecord_();
    if (!user) {
      logAudit_('ACCESS_DENIED', 'Session', email, 'No active Users record for ' + email);
      return { authorized: false, email: email, orgName: getSetting_('OrgName', APP_NAME) };
    }
    updateRow_(SHEETS.USERS, user.ID, { LastLogin: nowIso_() });
    logAudit_('LOGIN', 'Session', user.ID, email + ' signed in');
    var modules = {};
    Object.keys(MODULE_PERMISSIONS).forEach(function (key) {
      modules[key] = roleCan_(user.Role, key, 'view');
    });
    return {
      authorized: true,
      email: email,
      fullName: user.FullName,
      role: user.Role,
      orgName: getSetting_('OrgName', APP_NAME),
      modules: modules
    };
  });
}

function roleCan_(role, moduleKey, action) {
  if (role === ROLES.SUPER_ADMIN) return true;
  var perms = MODULE_PERMISSIONS[moduleKey];
  if (!perms) return false;
  return perms[action].indexOf(role) !== -1;
}

/** Throws if the caller's role can't perform `action` ('view'|'mutate') on `moduleKey'. Returns the user record. */
function requireRole_(moduleKey, action) {
  var user = getCurrentUserRecord_();
  if (!user) {
    logAudit_('ACCESS_DENIED', moduleKey, currentUserEmail_(), 'Unprovisioned user attempted ' + action);
    throw new Error('Access denied: your account is not registered in ChurchMS.');
  }
  if (!roleCan_(user.Role, moduleKey, action)) {
    logAudit_('ACCESS_DENIED', moduleKey, user.ID, user.Email + ' (' + user.Role + ') attempted ' + action);
    throw new Error('Access denied: your role (' + user.Role + ') cannot ' + action + ' ' + moduleKey + '.');
  }
  return user;
}

function requireSuperAdmin_() {
  var user = getCurrentUserRecord_();
  if (!user || user.Role !== ROLES.SUPER_ADMIN) {
    logAudit_('ACCESS_DENIED', 'settings', user ? user.ID : currentUserEmail_(), 'Non-SuperAdmin attempted a SuperAdmin-only action');
    throw new Error('Access denied: this action requires the SuperAdmin role.');
  }
  return user;
}

function logAudit_(action, entity, recordId, details) {
  try {
    insertRow_(SHEETS.AUDIT_LOG, {
      Timestamp: nowIso_(),
      UserEmail: currentUserEmail_(),
      Action: action,
      Entity: entity,
      RecordID: recordId || '',
      Details: sanitizeText_(details || '')
    }, 'AUD');
  } catch (e) {
    console.error('logAudit_ failed', e);
  }
}

/** Client-callable, SuperAdmin/Admin only: list + manage the Users/Roles sheet. */
function listUsers() {
  return safeCall_('listUsers', function () {
    requireRole_('settings', 'view');
    return readAll_(SHEETS.USERS);
  });
}

function saveUser(data) {
  return safeCall_('saveUser', function () {
    requireRole_('settings', 'mutate');
    requireFields_(data, ['Email', 'FullName', 'Role']);
    if (!isValidEmail_(data.Email)) throw new Error('Invalid email address.');
    requireEnum_(data.Role, ALL_ROLES, 'Role');
    var payload = {
      Email: sanitizeText_(data.Email).toLowerCase(),
      FullName: sanitizeText_(data.FullName),
      Role: data.Role,
      Active: data.Active === false ? 'FALSE' : 'TRUE',
      Phone: sanitizeText_(data.Phone || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.USERS, data.ID, payload);
      logAudit_('UPDATE', 'Users', data.ID, 'Updated user ' + payload.Email);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.USERS, payload, ID_PREFIX.USERS);
      logAudit_('CREATE', 'Users', record.ID, 'Added user ' + payload.Email + ' as ' + payload.Role);
    }
    return record;
  });
}

function deleteUser(id) {
  return safeCall_('deleteUser', function () {
    requireSuperAdmin_();
    deleteRow_(SHEETS.USERS, id);
    logAudit_('DELETE', 'Users', id, 'Removed user');
    return { ok: true };
  });
}

/** Client-callable: recent audit trail, most recent first. */
function getAuditLog(limit) {
  return safeCall_('getAuditLog', function () {
    requireRole_('settings', 'view');
    var rows = readAll_(SHEETS.AUDIT_LOG);
    rows.reverse();
    return rows.slice(0, limit || 200);
  });
}
