const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { listUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/', asyncHandler(listUsers));

module.exports = router;
