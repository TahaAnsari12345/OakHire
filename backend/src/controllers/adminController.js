const User = require('../models/User');
const Candidate = require('../models/Candidate');
const JobRequirement = require('../models/JobRequirement');
const Application = require('../models/Application');
const Followup = require('../models/Followup');
const CallLog = require('../models/CallLog');
const ActivityLog = require('../models/ActivityLog');
const generateTempPassword = require('../utils/tempPassword');
const logActivity = require('../utils/activityLog');

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function getDashboardSummary(req, res) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [totalActiveCandidates, totalOpenJobRequirements, joiningsThisWeek, overdueFollowups, leaderboardAgg] =
    await Promise.all([
      Candidate.countDocuments({}),
      JobRequirement.countDocuments({ status: 'Open' }),
      Application.countDocuments({ status: 'Joined', joiningDate: { $gte: weekStart } }),
      Followup.countDocuments({ status: { $in: ['Pending', 'Missed'] }, dueDate: { $lt: now } }),
      Application.aggregate([
        { $match: { status: 'Joined', joiningDate: { $gte: monthStart } } },
        { $group: { _id: '$assignedTo', joinings: { $sum: 1 } } },
        { $sort: { joinings: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const employeeIds = leaderboardAgg.map((row) => row._id);
  const employees = await User.find({ _id: { $in: employeeIds } }).select('name email');
  const employeeById = new Map(employees.map((e) => [e._id.toString(), e]));

  const leaderboard = leaderboardAgg.map((row) => ({
    employee: employeeById.get(row._id?.toString()) || null,
    joinings: row.joinings,
  }));

  res.json({
    totalActiveCandidates,
    totalOpenJobRequirements,
    joiningsThisWeek,
    overdueFollowups,
    leaderboard,
  });
}

async function listEmployees(req, res) {
  const employees = await User.find({ role: 'employee' }).sort({ name: 1 });

  const rows = await Promise.all(
    employees.map(async (employee) => {
      const [assignedCandidates, activeApplications, pendingFollowups] = await Promise.all([
        Candidate.countDocuments({ assignedTo: employee._id }),
        Application.countDocuments({ assignedTo: employee._id, status: 'Active' }),
        Followup.countDocuments({ assignedTo: employee._id, status: 'Pending' }),
      ]);
      return {
        employee: employee.toSafeObject(),
        assignedCandidates,
        activeApplications,
        pendingFollowups,
      };
    })
  );

  res.json({ rows });
}

async function createEmployee(req, res) {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'name and email are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const tempPassword = generateTempPassword();
  const employee = await User.create({ name, email, phone, password: tempPassword, role: 'employee' });

  await logActivity({
    actor: req.user.id,
    action: 'create_employee',
    entityType: 'User',
    entityId: employee._id,
  });

  res.status(201).json({ employee: employee.toSafeObject(), tempPassword });
}

async function updateEmployee(req, res) {
  const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const updatable = ['name', 'phone', 'isActive'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) employee[field] = req.body[field];
  });

  await employee.save();
  res.json({ employee: employee.toSafeObject() });
}

async function getEmployeeProfile(req, res) {
  const employee = await User.findOne({ _id: req.params.id, role: 'employee' });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const [candidates, callsMade, followupsDueInRange, jobRequirements] = await Promise.all([
    Candidate.find({ assignedTo: employee._id }).select('name phone email source createdAt').sort({ createdAt: -1 }).limit(50),
    CallLog.countDocuments({ employee: employee._id }),
    Followup.find({ assignedTo: employee._id, dueDate: { $lte: new Date() } }).select('status dueDate updatedAt'),
    JobRequirement.countDocuments({ assignedTo: employee._id, status: 'Open' }),
  ]);

  const totalDue = followupsDueInRange.length;
  const completedOnTime = followupsDueInRange.filter((f) => f.status === 'Done' && f.updatedAt <= f.dueDate).length;
  const followupCompliancePercent = totalDue === 0 ? null : Math.round((completedOnTime / totalDue) * 100);

  res.json({
    employee: employee.toSafeObject(),
    assignedCandidates: candidates,
    callsMade,
    openJobRequirements: jobRequirements,
    followupCompliancePercent,
    // Target vs achieved needs the Target model (Stage 6) — stubbed until then.
    targets: [],
  });
}

async function transferApplications(req, res) {
  const { applicationIds, fromEmployee, toEmployee } = req.body;

  if (!fromEmployee || !toEmployee) {
    return res.status(400).json({ message: 'fromEmployee and toEmployee are required' });
  }
  if (fromEmployee === toEmployee) {
    return res.status(400).json({ message: 'fromEmployee and toEmployee must be different' });
  }

  const [fromUser, toUser] = await Promise.all([
    User.findOne({ _id: fromEmployee, role: 'employee' }),
    User.findOne({ _id: toEmployee, role: 'employee' }),
  ]);
  if (!fromUser || !toUser) {
    return res.status(400).json({ message: 'Both fromEmployee and toEmployee must be valid employee accounts' });
  }

  const filter =
    Array.isArray(applicationIds) && applicationIds.length > 0
      ? { _id: { $in: applicationIds }, assignedTo: fromEmployee }
      : { assignedTo: fromEmployee };

  const applications = await Application.find(filter).select('_id candidate');
  if (applications.length === 0) {
    return res.json({ transferredCount: 0 });
  }

  const applicationIdList = applications.map((a) => a._id);
  const candidateIdList = [...new Set(applications.map((a) => a.candidate.toString()))];

  await Application.updateMany({ _id: { $in: applicationIdList } }, { assignedTo: toEmployee });
  await Candidate.updateMany({ _id: { $in: candidateIdList } }, { assignedTo: toEmployee });
  // Keep open follow-ups with the record they belong to, not the employee
  // who's leaving — otherwise the new owner's dashboard shows nothing.
  await Followup.updateMany(
    { application: { $in: applicationIdList }, status: { $in: ['Pending', 'Missed'] } },
    { assignedTo: toEmployee }
  );

  await ActivityLog.insertMany(
    applicationIdList.map((id) => ({
      actor: req.user.id,
      action: 'transfer',
      entityType: 'Application',
      entityId: id,
      meta: { from: fromEmployee, to: toEmployee },
    }))
  );

  res.json({ transferredCount: applicationIdList.length });
}

module.exports = {
  getDashboardSummary,
  listEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeProfile,
  transferApplications,
};
