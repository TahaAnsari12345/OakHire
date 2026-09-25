const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireRole = require('../middleware/role');
const validate = require('../middleware/validate');
const { createFollowupSchema, completeFollowupSchema } = require('../validators/followupSchemas');
const {
  listFollowups,
  createFollowup,
  completeFollowup,
  getComplianceReport,
} = require('../controllers/followupController');

const router = express.Router();

router.get('/compliance', requireRole('super_admin'), asyncHandler(getComplianceReport));
router.get('/', asyncHandler(listFollowups));
router.post('/', validate(createFollowupSchema), asyncHandler(createFollowup));
router.put('/:id/complete', validate(completeFollowupSchema), asyncHandler(completeFollowup));

module.exports = router;
