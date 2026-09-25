const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getDashboardSummary } = require('../controllers/appController');

const router = express.Router();

router.get('/dashboard-summary', asyncHandler(getDashboardSummary));

module.exports = router;
