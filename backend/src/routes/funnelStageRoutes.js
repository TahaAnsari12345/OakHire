const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireRole = require('../middleware/role');
const {
  listFunnelStages,
  createFunnelStage,
  updateFunnelStage,
  deleteFunnelStage,
} = require('../controllers/funnelStageController');

const router = express.Router();

router.get('/', asyncHandler(listFunnelStages));
router.post('/', requireRole('super_admin'), asyncHandler(createFunnelStage));
router.put('/:id', requireRole('super_admin'), asyncHandler(updateFunnelStage));
router.delete('/:id', requireRole('super_admin'), asyncHandler(deleteFunnelStage));

module.exports = router;
