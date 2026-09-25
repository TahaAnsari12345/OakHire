const CallLog = require('../models/CallLog');
const HttpError = require('../utils/httpError');
const { getPagination, buildPaginatedResponse } = require('../utils/queryHelpers');
const {
  resolveCallee,
  loadCallRefs,
  resolveDisposition,
  createFollowupForCall,
} = require('../services/callService');

const LOG_POPULATE = [
  { path: 'candidate', select: 'name phone' },
  { path: 'client', select: 'companyName' },
  { path: 'jobRequirement', select: 'title' },
  { path: 'application', select: 'jobRequirement' },
  { path: 'employee', select: 'name email' },
  { path: 'disposition', select: 'name tone' },
];

async function listCallLogs(req, res) {
  const { candidate, client, application, jobRequirement, calleeType, disposition, from, to, undisposed } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  // In-progress calls are transient state owned by the call bridge, not
  // history — they never show up in lists.
  const filter = { callStatus: 'completed' };
  if (candidate) filter.candidate = candidate;
  if (client) filter.client = client;
  if (application) filter.application = application;
  if (jobRequirement) filter.jobRequirement = jobRequirement;
  if (calleeType) filter.calleeType = calleeType;
  if (disposition) filter.disposition = disposition;
  if (undisposed === 'true') filter.disposition = null;
  if (from || to) {
    filter.startedAt = {};
    if (from) filter.startedAt.$gte = new Date(from);
    if (to) filter.startedAt.$lte = new Date(to);
  }

  // Employees only ever see their own calls; admin may narrow to a
  // specific employee via ?employee=, or omit it to see everyone's.
  if (req.user.role === 'super_admin') {
    if (req.query.employee) filter.employee = req.query.employee;
  } else {
    filter.employee = req.user.id;
  }

  const [data, total] = await Promise.all([
    CallLog.find(filter).populate(LOG_POPULATE).sort({ startedAt: -1 }).skip(skip).limit(limit),
    CallLog.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

/** POST /api/call-logs — "Add past call": a call made outside the app. */
async function createPastCall(req, res) {
  const {
    calleeType, candidateId, clientId, applicationId, jobRequirementId,
    contactPhone, disposition, durationSeconds, calledAt, notes, nextFollowup,
  } = req.body;

  const refs = await resolveCallee(req, { calleeType, candidateId, clientId, applicationId, jobRequirementId });
  await resolveDisposition(disposition, calleeType, nextFollowup);

  const startedAt = calledAt || new Date(Date.now() - durationSeconds * 1000);
  const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  let contact = null;
  if (refs.candidate) {
    contact = { name: refs.candidate.name, phone: refs.candidate.phone };
  } else {
    const contacts = refs.client.callableContacts();
    contact = contacts.find((c) => c.phone === contactPhone) || contacts[0] || null;
  }

  const callLog = await CallLog.create({
    calleeType,
    candidate: refs.candidate?._id,
    client: refs.client?._id,
    application: refs.application?._id,
    jobRequirement: refs.jobRequirement?._id,
    contactName: contact?.name,
    contactPhone: contact?.phone,
    employee: req.user.id,
    disposition,
    durationSeconds,
    notes,
    callStatus: 'completed',
    startedAt,
    endedAt,
  });

  const followup = nextFollowup ? await createFollowupForCall({ refs, nextFollowup, userId: req.user.id }) : null;

  await callLog.populate(LOG_POPULATE);
  res.status(201).json({ callLog, followup });
}

/**
 * PUT /api/call-logs/:id — logs the outcome of a call made through the call
 * bridge. Updates the same record (never creates a second CallLog) and
 * creates the next follow-up in the same request.
 */
async function disposeCall(req, res) {
  const filter = { _id: req.params.id, callStatus: 'completed' };
  if (req.user.role !== 'super_admin') filter.employee = req.user.id;

  const call = await CallLog.findOne(filter);
  if (!call) throw new HttpError(404, 'Call not found, or it is still in progress');
  if (call.disposition) throw new HttpError(409, 'This call has already been logged');

  const { disposition, notes, applicationId, jobRequirementId, nextFollowup } = req.body;
  const refs = await loadCallRefs(call, { applicationId, jobRequirementId });
  await resolveDisposition(disposition, call.calleeType, nextFollowup);

  call.disposition = disposition;
  call.notes = notes;
  call.application = refs.application?._id;
  call.jobRequirement = refs.jobRequirement?._id;
  await call.save();

  const followup = nextFollowup ? await createFollowupForCall({ refs, nextFollowup, userId: req.user.id }) : null;

  await call.populate(LOG_POPULATE);
  res.json({ callLog: call, followup });
}

module.exports = { listCallLogs, createPastCall, disposeCall };
