const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireRole = require('../middleware/role');
const {
  listCallDispositionTypes,
  createCallDispositionType,
  updateCallDispositionType,
  deleteCallDispositionType,
} = require('../controllers/callDispositionTypeController');

const router = express.Router();

router.get('/', asyncHandler(listCallDispositionTypes));
router.post('/', requireRole('super_admin'), asyncHandler(createCallDispositionType));
router.put('/:id', requireRole('super_admin'), asyncHandler(updateCallDispositionType));
router.delete('/:id', requireRole('super_admin'), asyncHandler(deleteCallDispositionType));

module.exports = router;
