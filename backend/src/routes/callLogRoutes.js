const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { pastCallSchema, disposeCallSchema } = require('../validators/callSchemas');
const { listCallLogs, createPastCall, disposeCall } = require('../controllers/callLogController');

const router = express.Router();

router.get('/', asyncHandler(listCallLogs));
router.post('/', validate(pastCallSchema), asyncHandler(createPastCall));
router.put('/:id', validate(disposeCallSchema), asyncHandler(disposeCall));

module.exports = router;
