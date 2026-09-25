const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Followup = require('../models/Followup');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

// Auto-scoped to the logged-in employee — never accepts an id param.
async function getDashboardSummary(req, res) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = startOfWeek(now);

  const [overdueFollowups, dueTodayFollowups, callsMadeToday, candidatesAssigned, interviewsThisWeek] =
    await Promise.all([
      Followup.countDocuments({ assignedTo: req.user.id, status: 'Pending', dueDate: { $lt: todayStart } }),
      Followup.countDocuments({
        assignedTo: req.user.id,
        status: 'Pending',
        dueDate: { $gte: todayStart, $lt: tomorrowStart },
      }),
      CallLog.countDocuments({ employee: req.user.id, createdAt: { $gte: todayStart } }),
      Candidate.countDocuments({ assignedTo: req.user.id }),
      Followup.countDocuments({
        assignedTo: req.user.id,
        type: 'Interview Reminder',
        dueDate: { $gte: weekStart },
      }),
    ]);

  res.json({
    overdueFollowups,
    dueTodayFollowups,
    callsMadeToday,
    candidatesAssigned,
    interviewsThisWeek,
  });
}

module.exports = { getDashboardSummary };
