const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listNotifications, markNotificationRead } = require('../controllers/notificationController');

const router = express.Router();

router.get('/', asyncHandler(listNotifications));
router.put('/:id/read', asyncHandler(markNotificationRead));

module.exports = router;
