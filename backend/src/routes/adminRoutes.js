const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { runFollowupCheck } = require('../utils/followupCron');
const {
  getDashboardSummary,
  listEmployees,
  createEmployee,
  updateEmployee,
  getEmployeeProfile,
  transferApplications,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard-summary', asyncHandler(getDashboardSummary));
router.get('/employees', asyncHandler(listEmployees));
router.post('/employees', asyncHandler(createEmployee));
router.get('/employees/:id', asyncHandler(getEmployeeProfile));
router.put('/employees/:id', asyncHandler(updateEmployee));
router.post('/transfer', asyncHandler(transferApplications));

// Manual trigger for the nightly follow-up sweep (Stage 3) — lets the
// acceptance check be verified on demand instead of waiting for midnight.
router.post(
  '/run-followup-check',
  asyncHandler(async (req, res) => {
    const summary = await runFollowupCheck();
    res.json({ summary });
  })
);

module.exports = router;
