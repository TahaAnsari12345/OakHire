const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  changeApplicationStage,
} = require('../controllers/applicationController');

const router = express.Router();

router.get('/', asyncHandler(listApplications));
router.post('/', asyncHandler(createApplication));
router.get('/:id', asyncHandler(getApplication));
router.patch('/:id', asyncHandler(updateApplication));
router.delete('/:id', asyncHandler(deleteApplication));
router.put('/:id/stage', asyncHandler(changeApplicationStage));

module.exports = router;
