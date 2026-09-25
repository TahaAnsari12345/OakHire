const CallLog = require('../models/CallLog');
const Followup = require('../models/Followup');
const ActivityLog = require('../models/ActivityLog');
const FunnelStage = require('../models/FunnelStage');

function callEvent(c) {
  return {
    id: c._id,
    type: 'call',
    timestamp: c.startedAt || c.createdAt,
    calleeType: c.calleeType,
    contactName: c.contactName,
    employee: c.employee?.name,
    disposition: c.disposition ? { name: c.disposition.name, tone: c.disposition.tone } : null,
    undisposed: !c.disposition,
    durationSeconds: c.durationSeconds,
    notes: c.notes,
    jobRequirement: c.jobRequirement?.title || null,
  };
}

function followupEvent(f, now) {
  return {
    id: f._id,
    type: 'followup',
    timestamp: f.updatedAt,
    status: f.status,
    isOverdue: f.status === 'Pending' && f.dueDate < now,
    followupType: f.type,
    dueDate: f.dueDate,
    notes: f.notes,
    outcomeNotes: f.outcomeNotes,
  };
}

function newestFirst(a, b) {
  return new Date(b.timestamp) - new Date(a.timestamp);
}

const CALL_FIELDS = [
  { path: 'employee', select: 'name' },
  { path: 'disposition', select: 'name tone' },
  { path: 'jobRequirement', select: 'title' },
];

/** Calls + follow-ups + stage changes for one candidate, newest first. */
async function buildCandidateTimeline(candidateId, applicationIds) {
  const now = new Date();
  const [callLogs, followups, activityLogs, funnelStages] = await Promise.all([
    CallLog.find({ candidate: candidateId, callStatus: 'completed' }).populate(CALL_FIELDS),
    Followup.find({ candidate: candidateId }),
    ActivityLog.find({ entityType: 'Application', action: 'stage_change', entityId: { $in: applicationIds } }).populate(
      'actor',
      'name'
    ),
    FunnelStage.find().select('name'),
  ]);

  const stageNameById = new Map(funnelStages.map((s) => [s._id.toString(), s.name]));

  return [
    ...callLogs.map(callEvent),
    ...followups.map((f) => followupEvent(f, now)),
    ...activityLogs.map((a) => ({
      id: a._id,
      type: 'stage_change',
      timestamp: a.createdAt,
      actor: a.actor?.name,
      from: stageNameById.get(a.meta?.from?.toString()) || null,
      to: stageNameById.get(a.meta?.to?.toString()) || null,
    })),
  ].sort(newestFirst);
}

/** Calls + follow-ups for one client, newest first. */
async function buildClientTimeline(clientId) {
  const now = new Date();
  const [callLogs, followups] = await Promise.all([
    CallLog.find({ client: clientId, callStatus: 'completed' }).populate(CALL_FIELDS),
    Followup.find({ client: clientId }),
  ]);
  return [...callLogs.map(callEvent), ...followups.map((f) => followupEvent(f, now))].sort(newestFirst);
}

module.exports = { buildCandidateTimeline, buildClientTimeline };
