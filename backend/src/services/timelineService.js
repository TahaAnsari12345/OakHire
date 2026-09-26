const CallLog = require('../models/CallLog');
const Followup = require('../models/Followup');
const ActivityLog = require('../models/ActivityLog');
const Interaction = require('../models/Interaction');
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

function interactionEvent(i) {
  return {
    id: i._id,
    type: 'interaction',
    activityType: i.type,
    timestamp: i.createdAt,
    employee: i.employee?.name,
    subject: i.subject,
    notes: i.notes,
    outcome: i.outcome,
    direction: i.direction,
    meetingDate: i.meetingDate,
    durationMinutes: i.durationMinutes,
    mode: i.mode,
    attendees: i.attendees,
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

/** Calls + follow-ups + interactions + stage changes for one candidate, newest first. */
async function buildCandidateTimeline(candidateId, applicationIds) {
  const now = new Date();
  const [callLogs, followups, interactions, activityLogs, funnelStages] = await Promise.all([
    CallLog.find({ candidate: candidateId, callStatus: 'completed' }).populate(CALL_FIELDS),
    Followup.find({ candidate: candidateId }),
    Interaction.find({ candidate: candidateId }).populate('employee', 'name'),
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
    ...interactions.map(interactionEvent),
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

/** Calls + follow-ups + interactions for one client, newest first. */
async function buildClientTimeline(clientId) {
  const now = new Date();
  const [callLogs, followups, interactions] = await Promise.all([
    CallLog.find({ client: clientId, callStatus: 'completed' }).populate(CALL_FIELDS),
    Followup.find({ client: clientId }),
    Interaction.find({ client: clientId }).populate('employee', 'name'),
  ]);
  return [...callLogs.map(callEvent), ...followups.map((f) => followupEvent(f, now)), ...interactions.map(interactionEvent)].sort(newestFirst);
}

module.exports = { buildCandidateTimeline, buildClientTimeline };
