const Followup = require('../models/Followup');
const Application = require('../models/Application');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const { getPagination, buildPaginatedResponse } = require('../utils/queryHelpers');
const { resolveCallee, followupOwner } = require('../services/callService');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function listFollowups(req, res) {
  const { status, dueDate, assignedTo, application, candidate, client } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (application) filter.application = application;
  if (candidate) filter.candidate = candidate;
  if (client) filter.client = client;

  if (dueDate === 'today') {
    const start = startOfDay(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.dueDate = { $gte: start, $lt: end };
  } else if (dueDate) {
    const start = startOfDay(dueDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.dueDate = { $gte: start, $lt: end };
  }

  // Employees only ever see their own follow-ups. An admin may narrow to a
  // specific employee via ?assignedTo=, or omit it to see everyone's.
  if (req.user.role === 'super_admin') {
    if (assignedTo) filter.assignedTo = assignedTo;
  } else {
    filter.assignedTo = req.user.id;
  }

  const [data, total] = await Promise.all([
    Followup.find(filter)
      .populate('candidate', 'name phone')
      .populate('client', 'companyName contactName contactPhone')
      .populate('application', 'jobRequirement funnelStage status')
      .populate('jobRequirement', 'title')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit),
    Followup.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse({ data, total, page, limit }));
}

/** POST /api/followups — schedule a follow-up for a candidate or a client. */
async function createFollowup(req, res) {
  const { candidateId, clientId, applicationId, jobRequirementId, assignedTo, dueDate, type, notes } = req.body;

  const refs = await resolveCallee(req, {
    calleeType: candidateId ? 'Candidate' : 'Client',
    candidateId,
    clientId,
    applicationId,
    jobRequirementId,
  });

  const followup = await Followup.create({
    candidate: refs.candidate?._id,
    client: refs.client?._id,
    application: refs.application?._id,
    jobRequirement: refs.jobRequirement?._id,
    assignedTo: req.user.role === 'super_admin' && assignedTo ? assignedTo : followupOwner(refs),
    dueDate,
    type,
    notes,
    createdBy: req.user.id,
  });

  res.status(201).json({ followup });
}

/** PUT /api/followups/:id/complete — mark done, optionally chaining the next one. */
async function completeFollowup(req, res) {
  const { outcomeNotes, nextFollowup } = req.body;

  const filter = { _id: req.params.id };
  if (req.user.role !== 'super_admin') filter.assignedTo = req.user.id;

  const followup = await Followup.findOne(filter);
  if (!followup) throw new HttpError(404, 'Follow-up not found');

  // Mirrors the stage-change rule: a follow-up on a still-active
  // application must always chain to the next action. Candidate-only and
  // client follow-ups may close without one (the candidate page warns
  // when nothing is scheduled).
  if (followup.application && !nextFollowup) {
    const application = await Application.findById(followup.application).select('status');
    if (application?.status === 'Active') {
      throw new HttpError(400, 'nextFollowup.dueDate is required while the linked application is still active');
    }
  }

  followup.status = 'Done';
  followup.outcomeNotes = outcomeNotes;
  await followup.save();

  const created = nextFollowup
    ? await Followup.create({
        candidate: followup.candidate,
        client: followup.client,
        application: followup.application,
        jobRequirement: followup.jobRequirement,
        assignedTo: followup.assignedTo,
        dueDate: nextFollowup.dueDate,
        type: nextFollowup.type || followup.type,
        notes: nextFollowup.notes,
        createdBy: req.user.id,
      })
    : null;

  res.json({ followup, nextFollowup: created });
}

async function getComplianceReport(req, res) {
  const period = req.query.period === 'month' ? 'month' : 'week';
  const now = new Date();
  let start;
  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start = startOfDay(now);
    start.setDate(start.getDate() - diffToMonday);
  }

  const employees = await User.find({ role: 'employee', isActive: true }).select('name email');

  const rows = await Promise.all(
    employees.map(async (employee) => {
      const dueFollowups = await Followup.find({
        assignedTo: employee._id,
        dueDate: { $gte: start, $lte: now },
      }).select('status dueDate updatedAt');

      const totalDue = dueFollowups.length;
      const completedOnTime = dueFollowups.filter(
        (f) => f.status === 'Done' && f.updatedAt <= f.dueDate
      ).length;

      return {
        employee: { id: employee._id, name: employee.name, email: employee.email },
        totalDue,
        completedOnTime,
        percentage: totalDue === 0 ? null : Math.round((completedOnTime / totalDue) * 100),
      };
    })
  );

  res.json({ period, since: start, rows });
}

module.exports = { listFollowups, createFollowup, completeFollowup, getComplianceReport };
