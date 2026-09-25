const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Followup = require('../models/Followup');
const { getPagination, buildPaginatedResponse, applyOwnershipFilter } = require('../utils/queryHelpers');
const { buildCandidateTimeline } = require('../services/timelineService');

async function listCandidates(req, res) {
  const { search, source, location, minExperience, maxExperience } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};
  if (search) filter.$text = { $search: search };
  if (source) filter.source = source;
  if (location) filter.location = new RegExp(location, 'i');
  if (minExperience || maxExperience) {
    filter.totalExperience = {};
    if (minExperience) filter.totalExperience.$gte = Number(minExperience);
    if (maxExperience) filter.totalExperience.$lte = Number(maxExperience);
  }

  filter = applyOwnershipFilter(req, filter);

  const [data, total] = await Promise.all([
    Candidate.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Candidate.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

async function getCandidate(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const candidate = await Candidate.findOne(filter).populate('assignedTo', 'name email');

  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  res.json({ candidate });
}

async function createCandidate(req, res) {
  const { name, phone, email, location, skills, totalExperience, currentCompany, currentRole, currentCTC, expectedCTC, noticePeriod, resumeUrl, source, assignedTo } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'name and phone are required' });
  }

  // Only a super_admin may assign a candidate to someone else on creation;
  // an employee always creates candidates owned by themselves.
  const ownerId = req.user.role === 'super_admin' && assignedTo ? assignedTo : req.user.id;

  const candidate = await Candidate.create({
    name,
    phone,
    email,
    location,
    skills,
    totalExperience,
    currentCompany,
    currentRole,
    currentCTC,
    expectedCTC,
    noticePeriod,
    resumeUrl,
    source,
    createdBy: req.user.id,
    assignedTo: ownerId,
  });

  res.status(201).json({ candidate });
}

async function updateCandidate(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const candidate = await Candidate.findOne(filter);

  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const updatable = ['name', 'phone', 'email', 'location', 'skills', 'totalExperience', 'currentCompany', 'currentRole', 'currentCTC', 'expectedCTC', 'noticePeriod', 'resumeUrl', 'source'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) candidate[field] = req.body[field];
  });

  // Reassignment is a Super Admin-only action (candidate transfer tool).
  if (req.user.role === 'super_admin' && req.body.assignedTo) {
    candidate.assignedTo = req.body.assignedTo;
  }

  await candidate.save();
  res.json({ candidate });
}

async function deleteCandidate(req, res) {
  const filter = applyOwnershipFilter(req, { _id: req.params.id });
  const candidate = await Candidate.findOneAndDelete(filter);

  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  res.status(204).send();
}

async function getCandidateTimeline(req, res) {
  // Candidate ownership is checked first — the timeline reaches into
  // CallLog/Followup/ActivityLog directly (not through their own
  // ownership-filtered endpoints), so this gate is what keeps an
  // employee from reading another employee's activity.
  const candidate = await Candidate.findOne(applyOwnershipFilter(req, { _id: req.params.id }));
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }

  const [applications, openFollowups] = await Promise.all([
    Application.find({ candidate: candidate._id }).select('_id status'),
    Followup.countDocuments({ candidate: candidate._id, status: 'Pending' }),
  ]);
  const events = await buildCandidateTimeline(
    candidate._id,
    applications.map((a) => a._id)
  );

  // A candidate is only "done" once every application reached a terminal
  // stage; one with no applications yet is still being worked.
  const isTerminal = applications.length > 0 && applications.every((a) => a.status !== 'Active');

  res.json({ events, needsFollowup: !isTerminal && openFollowups === 0 });
}

module.exports = {
  listCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidateTimeline,
};
