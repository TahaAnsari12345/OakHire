const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { initiateCallSchema } = require('../validators/callSchemas');
const { initiateCall, getActiveCall, endCall, listUndisposedCalls } = require('../controllers/callController');

const router = express.Router();

router.post('/initiate', validate(initiateCallSchema), asyncHandler(initiateCall));
router.get('/active', asyncHandler(getActiveCall));
router.get('/undisposed', asyncHandler(listUndisposedCalls));
router.post('/:id/end', asyncHandler(endCall));

module.exports = router;
