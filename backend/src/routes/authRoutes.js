const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/auth');
const { register, login, refresh, logout, me } = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

module.exports = router;
