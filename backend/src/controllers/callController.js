/*
 * Call bridge — UI + API contract stub.
 *
 * No real telephony is wired up yet. Today the employee dials on their own
 * phone while this API tracks the call's lifecycle. The future Android
 * SIM-bridge companion app will plug into the same contract:
 *   1. POST /api/calls/initiate  → app receives the CallLog id and places
 *      the call on the SIM (tel: intent or a push payload it listens for).
 *   2. POST /api/calls/:id/end   → app reports hang-up; the server stamps
 *      endedAt and computes durationSeconds from startedAt.
 *   3. The employee then logs the outcome via PUT /api/call-logs/:id.
 * Duration is always computed server-side so it can't be spoofed by the UI.
 */
const CallLog = require('../models/CallLog');
const HttpError = require('../utils/httpError');
const { resolveCallee } = require('../services/callService');

const CALL_POPULATE = [
  { path: 'candidate', select: 'name phone' },
  { path: 'client', select: 'companyName contactName contactPhone' },
  { path: 'application', select: 'jobRequirement' },
  { path: 'jobRequirement', select: 'title' },
];

/**
 * POST /api/calls/initiate — starts a call. Only one active call per
 * employee: a second initiate returns 409 with the existing call so the UI
 * can resume it instead.
 */
async function initiateCall(req, res) {
  const existing = await CallLog.findOne({ employee: req.user.id, callStatus: 'initiated' }).populate(CALL_POPULATE);
  if (existing) {
    return res.status(409).json({ message: 'You already have a call in progress', call: existing });
  }

  const { calleeType, candidateId, clientId, applicationId, jobRequirementId, contactPhone } = req.body;
  const refs = await resolveCallee(req, { calleeType, candidateId, clientId, applicationId, jobRequirementId });

  let contact;
  if (calleeType === 'Candidate') {
    if (!refs.candidate.phone) throw new HttpError(400, 'This candidate has no phone number on file');
    contact = { name: refs.candidate.name, phone: refs.candidate.phone };
  } else {
    const contacts = refs.client.callableContacts();
    if (contacts.length === 0) throw new HttpError(400, 'This client has no contact phone number on file');
    contact = contactPhone ? contacts.find((c) => c.phone === contactPhone) : contacts[0];
    if (!contact) throw new HttpError(400, 'That phone number is not one of this client’s contacts');
  }

  const call = await CallLog.create({
    calleeType,
    candidate: refs.candidate?._id,
    client: refs.client?._id,
    application: refs.application?._id,
    jobRequirement: refs.jobRequirement?._id,
    contactName: contact.name,
    contactPhone: contact.phone,
    employee: req.user.id,
    callStatus: 'initiated',
    startedAt: new Date(),
  });

  await call.populate(CALL_POPULATE);
  res.status(201).json({ call });
}

/** GET /api/calls/active — the employee's in-progress call, if any (used to restore after refresh). */
async function getActiveCall(req, res) {
  const call = await CallLog.findOne({ employee: req.user.id, callStatus: 'initiated' }).populate(CALL_POPULATE);
  res.json({ call });
}

/** POST /api/calls/:id/end — completes the call and computes duration server-side. */
async function endCall(req, res) {
  const call = await CallLog.findOne({ _id: req.params.id, employee: req.user.id, callStatus: 'initiated' });
  if (!call) throw new HttpError(404, 'No active call found with that id');

  call.endedAt = new Date();
  call.durationSeconds = Math.max(0, Math.round((call.endedAt - call.startedAt) / 1000));
  call.callStatus = 'completed';
  await call.save();

  await call.populate(CALL_POPULATE);
  res.json({ call });
}

/** GET /api/calls/undisposed — completed calls still waiting for an outcome. */
async function listUndisposedCalls(req, res) {
  const calls = await CallLog.find({ employee: req.user.id, callStatus: 'completed', disposition: null })
    .populate(CALL_POPULATE)
    .sort({ endedAt: -1 });
  res.json({ calls });
}

module.exports = { initiateCall, getActiveCall, endCall, listUndisposedCalls, CALL_POPULATE };
