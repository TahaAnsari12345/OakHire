const cron = require('node-cron');
const Followup = require('../models/Followup');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logActivity = require('./activityLog');
const { MISSED_FOLLOWUP_ESCALATION_DAYS } = require('./constants');

async function runFollowupCheck() {
  const now = new Date();

  const missedResult = await Followup.updateMany(
    { status: 'Pending', dueDate: { $lt: now } },
    { status: 'Missed' }
  );

  const escalationCutoff = new Date(now.getTime() - MISSED_FOLLOWUP_ESCALATION_DAYS * 24 * 60 * 60 * 1000);
  const toEscalate = await Followup.find({
    status: 'Missed',
    adminNotified: false,
    dueDate: { $lt: escalationCutoff },
  })
    .populate('candidate', 'name')
    .populate('assignedTo', 'name');

  let escalatedCount = 0;
  if (toEscalate.length > 0) {
    const admins = await User.find({ role: 'super_admin', isActive: true }).select('_id');

    const notifications = [];
    for (const followup of toEscalate) {
      for (const admin of admins) {
        notifications.push({
          user: admin._id,
          type: 'followup_missed_escalation',
          message: `Follow-up for ${followup.candidate?.name || 'a candidate'} assigned to ${followup.assignedTo?.name || 'an employee'} has been missed for over ${MISSED_FOLLOWUP_ESCALATION_DAYS} days.`,
          relatedEntity: { entityType: 'Followup', entityId: followup._id },
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await Followup.updateMany(
      { _id: { $in: toEscalate.map((f) => f._id) } },
      { adminNotified: true }
    );
    escalatedCount = toEscalate.length;
  }

  const summary = { missedCount: missedResult.modifiedCount, escalatedCount };
  console.log('[cron] Follow-up check complete:', summary);

  await logActivity({
    actor: null,
    action: 'cron_followup_check',
    entityType: 'Followup',
    entityId: null,
    meta: summary,
  });

  return summary;
}

function scheduleFollowupCron() {
  // Runs once daily at midnight server time.
  cron.schedule('0 0 * * *', () => {
    runFollowupCheck().catch((err) => console.error('[cron] Follow-up check failed:', err));
  });
}

module.exports = { runFollowupCheck, scheduleFollowupCron };
