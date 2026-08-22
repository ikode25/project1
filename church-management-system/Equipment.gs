/**
 * Equipment.gs
 * Church equipment/asset inventory: status, location, assignment, condition.
 */

function listEquipment() {
  return safeCall_('listEquipment', function () {
    requireRole_('equipment', 'view');
    return readAll_(SHEETS.EQUIPMENT).sort(function (a, b) { return (a.Name || '').localeCompare(b.Name || ''); });
  });
}

function saveEquipment(data) {
  return safeCall_('saveEquipment', function () {
    requireRole_('equipment', 'mutate');
    requireFields_(data, ['Name', 'Category']);
    requireEnum_(data.Status, OPTIONS.EQUIPMENT_STATUS, 'Status');
    requireEnum_(data.Condition, OPTIONS.EQUIPMENT_CONDITION, 'Condition');
    var payload = {
      Name: sanitizeText_(data.Name), Category: sanitizeText_(data.Category),
      SerialNumber: sanitizeText_(data.SerialNumber || ''), Status: data.Status || 'Available',
      Location: sanitizeText_(data.Location || ''), AssignedTo: sanitizeText_(data.AssignedTo || ''),
      PurchaseDate: data.PurchaseDate || '', Condition: data.Condition || 'Good', Notes: sanitizeText_(data.Notes || '')
    };
    var record;
    if (data.ID) {
      record = updateRow_(SHEETS.EQUIPMENT, data.ID, payload);
      logAudit_('UPDATE', 'Equipment', data.ID, 'Updated ' + payload.Name);
    } else {
      payload.CreatedAt = nowIso_();
      record = insertRow_(SHEETS.EQUIPMENT, payload, ID_PREFIX.EQUIPMENT);
      logAudit_('CREATE', 'Equipment', record.ID, 'Added ' + payload.Name);
    }
    return record;
  });
}

function deleteEquipment(id) {
  return safeCall_('deleteEquipment', function () {
    requireRole_('equipment', 'mutate');
    deleteRow_(SHEETS.EQUIPMENT, id);
    logAudit_('DELETE', 'Equipment', id, 'Removed equipment record');
    return { ok: true };
  });
}
