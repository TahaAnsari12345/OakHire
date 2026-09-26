const Interaction = require('../models/Interaction');
const HttpError = require('../utils/httpError');
const { getPagination, buildPaginatedResponse } = require('../utils/queryHelpers');
const { resolveCallee, createFollowupForCall } = require('../services/callService');

const POPULATE = [
  { path: 'candidate', select: 'name phone' },
  { path: 'client', select: 'companyName' },
  { path: 'application', select: 'jobRequirement' },
  { path: 'jobRequirement', select: 'title' },
  { path: 'employee', select: 'name email' },
];

async function listInteractions(req, res) {
  const { candidate, client, type } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (candidate) filter.candidate = candidate;
  if (client) filter.client = client;
  if (type) filter.type = type;
  if (req.user.role !== 'super_admin') filter.employee = req.user.id;

  const [data, total] = await Promise.all([
    Interaction.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Interaction.countDocuments(filter),
  ]);
  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

async function createInteraction(req, res) {
  const { type, calleeType, candidateId, clientId, applicationId, jobRequirementId, nextFollowup, ...fields } = req.body;
  const refs = await resolveCallee(req, { calleeType, candidateId, clientId, applicationId, jobRequirementId });
  const interaction = await Interaction.create({
    type,
    calleeType,
    candidate: refs.candidate?._id,
    client: refs.client?._id,
    application: refs.application?._id,
    jobRequirement: refs.jobRequirement?._id,
    ...fields,
    employee: req.user.id,
  });
  const followup = nextFollowup ? await createFollowupForCall({ refs, nextFollowup, userId: req.user.id }) : null;
  await interaction.populate(POPULATE);
  res.status(201).json({ interaction, followup });
}

async function updateInteraction(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'super_admin') filter.employee = req.user.id;
  const interaction = await Interaction.findOne(filter);
  if (!interaction) throw new HttpError(404, 'Interaction not found');
  const fields = ['subject', 'notes', 'outcome', 'direction', 'meetingDate', 'durationMinutes', 'mode', 'attendees'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) interaction[field] = req.body[field];
  });
  await interaction.save();
  await interaction.populate(POPULATE);
  res.json({ interaction });
}

async function deleteInteraction(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'super_admin') filter.employee = req.user.id;
  const interaction = await Interaction.findOneAndDelete(filter);
  if (!interaction) throw new HttpError(404, 'Interaction not found');
  res.status(204).send();
}

module.exports = { listInteractions, createInteraction, updateInteraction, deleteInteraction };
