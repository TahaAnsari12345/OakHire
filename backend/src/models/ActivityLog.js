const mongoose = require('mongoose');

// Every admin-visible action (stage changes, transfers, deletes) is logged
// here for accountability. `actor` is null for system-generated entries
// (e.g. the nightly cron sweep).
const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
