const ActivityLog = require('../models/ActivityLog');

function logActivity({ actor = null, action, entityType, entityId, meta }) {
  return ActivityLog.create({ actor, action, entityType, entityId, meta });
}

module.exports = logActivity;
