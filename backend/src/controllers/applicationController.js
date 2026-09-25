const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const JobRequirement = require('../models/JobRequirement');
const FunnelStage = require('../models/FunnelStage');
const Followup = require('../models/Followup');
const { getPagination, buildPaginatedResponse, applyOwnershipFilter } = require('../utils/queryHelpers');
const logActivity = require('../utils/activityLog');
const { REJECTION_REASONS } = require('../utils/constants');

async function listApplications(req, res) {
  const { candidate, jobRequirement, funnelStage } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};
  if (candidate) filter.candidate = candidate;
  if (jobRequirement) filter.jobRequirement = jobRequirement;
  if (funnelStage) filter.funnelStage = funnelStage;

  // Only super_admin may target another employee's applications directly
  // (e.g. the transfer tool); applyOwnershipFilter still governs everyone
  // else, so an employee can never widen this beyond their own records.
  if (req.user.role === 'super_admin' && req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  } else {
    filter = applyOwnershipFilter(req, filter);
  }

  const [data, total] = await Promise.all([
    Application.find(filter)
      .populate('candidate', 'name phone email')
      .populate('jobRequirement', 'title')
      .populate('funnelStage', 'name order isTerminal')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

async function getApplication(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const application = await Application.findOne(filter)
    .populate('candidate')
    .populate({ path: 'jobRequirement', populate: { path: 'client', select: 'companyName' } })
    .populate('funnelStage')
    .populate('assignedTo', 'name email');

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  res.json({ application });
}

async function createApplication(req, res) {
  const { candidate: candidateId, jobRequirement: jobRequirementId, funnelStage: funnelStageId, notes } = req.body;

  if (!candidateId || !jobRequirementId) {
    return res.status(400).json({ message: 'candidate and jobRequirement are required' });
  }

  // An employee may only pair a candidate and job requirement they both own
  // — never trust the client to have already checked this.
  const candidate = await Candidate.findOne(applyOwnershipFilter(req, { _id: candidateId }));
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const jobRequirement = await JobRequirement.findOne(applyOwnershipFilter(req, { _id: jobRequirementId }));
  if (!jobRequirement) {
    return res.status(404).json({ message: 'Job requirement not found' });
  }

  let stageId = funnelStageId;
  if (!stageId) {
    const firstStage = await FunnelStage.findOne({ isActive: true }).sort({ order: 1 });
    if (!firstStage) {
      return res.status(400).json({ message: 'No funnel stages configured' });
    }
    stageId = firstStage._id;
  }

  const application = await Application.create({
    candidate: candidateId,
    jobRequirement: jobRequirementId,
    funnelStage: stageId,
    assignedTo: jobRequirement.assignedTo,
    createdBy: req.user.id,
    notes,
  });

  const populated = await application.populate([
    { path: 'candidate', select: 'name phone email' },
    { path: 'jobRequirement', select: 'title' },
    { path: 'funnelStage', select: 'name order isTerminal' },
  ]);

  res.status(201).json({ application: populated });
}

async function updateApplication(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const application = await Application.findOne(filter);

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  // funnelStage is intentionally NOT editable here — it must go through
  // PUT /:id/stage so the "no stage change without a next action" rule
  // (Stage 3) can never be bypassed.
  if (req.body.notes !== undefined) application.notes = req.body.notes;

  if (req.user.role === 'super_admin' && req.body.assignedTo) {
    application.assignedTo = req.body.assignedTo;
  }

  await application.save();
  res.json({ application });
}

async function deleteApplication(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const application = await Application.findOneAndDelete(filter);

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  res.status(204).send();
}

async function changeApplicationStage(req, res) {
  const { funnelStage: newStageId, rejectionReason, joiningDate, nextFollowupDate, nextFollowupType, nextFollowupNotes } = req.body;

  if (!newStageId) {
    return res.status(400).json({ message: 'funnelStage is required' });
  }

  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const application = await Application.findOne(filter);
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  const newStage = await FunnelStage.findById(newStageId);
  if (!newStage) {
    return res.status(400).json({ message: 'Invalid funnelStage' });
  }

  const isRejection = newStage.isTerminal && /reject|drop/i.test(newStage.name);
  const isJoined = newStage.isTerminal && /joined/i.test(newStage.name);

  if (isRejection) {
    if (!rejectionReason || !REJECTION_REASONS.includes(rejectionReason)) {
      return res.status(400).json({
        message: `rejectionReason is required and must be one of: ${REJECTION_REASONS.join(', ')}`,
      });
    }
  }

  if (isJoined && !joiningDate) {
    return res.status(400).json({ message: 'joiningDate is required when moving an application to Joined' });
  }

  // The core "nothing left behind" rule: a non-terminal move must always
  // schedule the next follow-up, or it's rejected outright.
  if (!newStage.isTerminal && !nextFollowupDate) {
    return res.status(400).json({
      message: 'nextFollowupDate is required unless the new stage is terminal (Joined/Rejected)',
    });
  }

  const previousStageId = application.funnelStage;

  application.funnelStage = newStage._id;
  if (newStage.isTerminal) {
    application.status = isJoined ? 'Joined' : isRejection ? 'Rejected' : application.status;
    if (isRejection) application.rejectionReason = rejectionReason;
    if (isJoined) application.joiningDate = joiningDate;

    // Auto-close any open follow-ups for this application.
    await Followup.updateMany(
      { application: application._id, status: 'Pending' },
      { status: 'Done', outcomeNotes: `Auto-closed — application moved to ${newStage.name}.` }
    );
  } else {
    await Followup.create({
      candidate: application.candidate,
      application: application._id,
      assignedTo: application.assignedTo,
      dueDate: nextFollowupDate,
      type: nextFollowupType || 'Call',
      notes: nextFollowupNotes,
      createdBy: req.user.id,
    });
  }

  await application.save();

  await logActivity({
    actor: req.user.id,
    action: 'stage_change',
    entityType: 'Application',
    entityId: application._id,
    meta: { from: previousStageId, to: newStage._id },
  });

  const populated = await application.populate([
    { path: 'candidate', select: 'name phone email' },
    { path: 'jobRequirement', select: 'title' },
    { path: 'funnelStage', select: 'name order isTerminal' },
  ]);

  res.json({ application: populated });
}

module.exports = {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  changeApplicationStage,
};
