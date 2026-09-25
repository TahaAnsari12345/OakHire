const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listJobRequirements,
  getJobRequirement,
  createJobRequirement,
  updateJobRequirement,
  deleteJobRequirement,
} = require('../controllers/jobRequirementController');

const router = express.Router();

router.get('/', asyncHandler(listJobRequirements));
router.post('/', asyncHandler(createJobRequirement));
router.get('/:id', asyncHandler(getJobRequirement));
router.patch('/:id', asyncHandler(updateJobRequirement));
router.delete('/:id', asyncHandler(deleteJobRequirement));

module.exports = router;
