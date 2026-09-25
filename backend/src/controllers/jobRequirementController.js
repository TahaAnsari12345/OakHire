const JobRequirement = require('../models/JobRequirement');
const { getPagination, buildPaginatedResponse, applyOwnershipFilter } = require('../utils/queryHelpers');

async function listJobRequirements(req, res) {
  const { search, client, status, priority, engagementType } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};
  if (search) filter.$text = { $search: search };
  if (client) filter.client = client;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (engagementType) filter.engagementType = engagementType;

  filter = applyOwnershipFilter(req, filter);

  const [data, total] = await Promise.all([
    JobRequirement.find(filter)
      .populate('client', 'companyName')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    JobRequirement.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

async function getJobRequirement(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const jobRequirement = await JobRequirement.findOne(filter)
    .populate('client', 'companyName')
    .populate('assignedTo', 'name email');

  if (!jobRequirement) {
    return res.status(404).json({ message: 'Job requirement not found' });
  }
  res.json({ jobRequirement });
}

async function createJobRequirement(req, res) {
  const { title, client, skills, experienceMin, experienceMax, ctcMin, ctcMax, openings, location, priority, engagementType, status, assignedTo } = req.body;

  if (!title || !client) {
    return res.status(400).json({ message: 'title and client are required' });
  }

  const ownerId = req.user.role === 'super_admin' && assignedTo ? assignedTo : req.user.id;

  const jobRequirement = await JobRequirement.create({
    title,
    client,
    skills,
    experienceMin,
    experienceMax,
    ctcMin,
    ctcMax,
    openings,
    location,
    priority,
    engagementType,
    status,
    assignedTo: ownerId,
    createdBy: req.user.id,
  });

  res.status(201).json({ jobRequirement });
}

async function updateJobRequirement(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const jobRequirement = await JobRequirement.findOne(filter);

  if (!jobRequirement) {
    return res.status(404).json({ message: 'Job requirement not found' });
  }

  const updatable = ['title', 'client', 'skills', 'experienceMin', 'experienceMax', 'ctcMin', 'ctcMax', 'openings', 'location', 'priority', 'engagementType', 'status'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) jobRequirement[field] = req.body[field];
  });

  if (req.user.role === 'super_admin' && req.body.assignedTo) {
    jobRequirement.assignedTo = req.body.assignedTo;
  }

  await jobRequirement.save();
  res.json({ jobRequirement });
}

async function deleteJobRequirement(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const jobRequirement = await JobRequirement.findOneAndDelete(filter);

  if (!jobRequirement) {
    return res.status(404).json({ message: 'Job requirement not found' });
  }
  res.status(204).send();
}

module.exports = { listJobRequirements, getJobRequirement, createJobRequirement, updateJobRequirement, deleteJobRequirement };
