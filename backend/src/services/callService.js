const Candidate = require('../models/Candidate');
const Client = require('../models/Client');
const Application = require('../models/Application');
const JobRequirement = require('../models/JobRequirement');
const CallDispositionType = require('../models/CallDispositionType');
const Followup = require('../models/Followup');
const HttpError = require('../utils/httpError');
const { applyOwnershipFilter } = require('../utils/queryHelpers');

/**
 * Loads and ownership-checks everything a call can reference. An employee
 * can only call candidates/clients they own; super_admin can call anyone.
 * @returns {Promise<{candidate?: object, client?: object, application?: object, jobRequirement?: object}>}
 */
async function resolveCallee(req, { calleeType, candidateId, clientId, applicationId, jobRequirementId }) {
  if (calleeType === 'Candidate') {
    const candidate = await Candidate.findOne(applyOwnershipFilter(req, { _id: candidateId }));
    if (!candidate) throw new HttpError(404, 'Candidate not found');

    let application = null;
    if (applicationId) {
      application = await Application.findOne({ _id: applicationId, candidate: candidate._id });
      if (!application) throw new HttpError(400, 'Application does not belong to this candidate');
    }
    return { candidate, application };
  }

  const client = await Client.findOne(applyOwnershipFilter(req, { _id: clientId }, 'accountOwner'));
  if (!client) throw new HttpError(404, 'Client not found');

  let jobRequirement = null;
  if (jobRequirementId) {
    jobRequirement = await JobRequirement.findOne({ _id: jobRequirementId, client: client._id });
    if (!jobRequirement) throw new HttpError(400, 'Job requirement does not belong to this client');
  }
  return { client, jobRequirement };
}

/**
 * Loads the records an existing call points at, optionally re-pointing its
 * application / job requirement. Authorization here is ownership of the
 * call itself (checked by the caller), so a transferred candidate doesn't
 * block the employee who actually made the call from logging it.
 */
async function loadCallRefs(call, { applicationId, jobRequirementId }) {
  if (call.calleeType === 'Candidate') {
    const candidate = await Candidate.findById(call.candidate);
    if (!candidate) throw new HttpError(404, 'Candidate no longer exists');
    const appId = applicationId === undefined ? call.application : applicationId;
    let application = null;
    if (appId) {
      application = await Application.findOne({ _id: appId, candidate: candidate._id });
      if (!application) throw new HttpError(400, 'Application does not belong to this candidate');
    }
    return { candidate, application };
  }

  const client = await Client.findById(call.client);
  if (!client) throw new HttpError(404, 'Client no longer exists');
  const jrId = jobRequirementId === undefined ? call.jobRequirement : jobRequirementId;
  let jobRequirement = null;
  if (jrId) {
    jobRequirement = await JobRequirement.findOne({ _id: jrId, client: client._id });
    if (!jobRequirement) throw new HttpError(400, 'Job requirement does not belong to this client');
  }
  return { client, jobRequirement };
}

/**
 * Validates a disposition against the callee type and — never trusting the
 * client — enforces `requiresFollowup` server-side.
 */
async function resolveDisposition(dispositionId, calleeType, nextFollowup) {
  const disposition = await CallDispositionType.findById(dispositionId);
  if (!disposition || !disposition.isActive) throw new HttpError(400, 'Invalid disposition');
  if (disposition.appliesTo !== 'Both' && disposition.appliesTo !== calleeType) {
    throw new HttpError(400, `"${disposition.name}" is not a ${calleeType.toLowerCase()} disposition`);
  }
  if (disposition.requiresFollowup && !nextFollowup?.dueDate) {
    throw new HttpError(400, `"${disposition.name}" requires a next follow-up date`);
  }
  return disposition;
}

/** Follow-ups land with the record's owner, not whoever happened to dial. */
function followupOwner({ candidate, client, application }) {
  if (application) return application.assignedTo;
  if (candidate) return candidate.assignedTo;
  return client.accountOwner;
}

/** Creates the next follow-up attached to a call's candidate or client. */
function createFollowupForCall({ refs, nextFollowup, userId }) {
  return Followup.create({
    candidate: refs.candidate?._id,
    client: refs.client?._id,
    application: refs.application?._id,
    jobRequirement: refs.jobRequirement?._id,
    assignedTo: followupOwner(refs),
    dueDate: nextFollowup.dueDate,
    type: nextFollowup.type || 'Call',
    notes: nextFollowup.notes,
    createdBy: userId,
  });
}

module.exports = { resolveCallee, loadCallRefs, resolveDisposition, createFollowupForCall, followupOwner };
