const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireRole = require('../middleware/role');
const {
  listLeadSources,
  createLeadSource,
  updateLeadSource,
  deleteLeadSource,
} = require('../controllers/leadSourceController');

const router = express.Router();

router.get('/', asyncHandler(listLeadSources));
router.post('/', requireRole('super_admin'), asyncHandler(createLeadSource));
router.put('/:id', requireRole('super_admin'), asyncHandler(updateLeadSource));
router.delete('/:id', requireRole('super_admin'), asyncHandler(deleteLeadSource));

module.exports = router;
