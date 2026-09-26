const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { disposeCallSchema } = require('../validators/callSchemas');
const { listCallLogs, disposeCall } = require('../controllers/callLogController');

const router = express.Router();

router.get('/', asyncHandler(listCallLogs));
router.put('/:id', validate(disposeCallSchema), asyncHandler(disposeCall));

module.exports = router;
