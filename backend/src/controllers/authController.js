const User = require('../models/User');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

const REFRESH_COOKIE_NAME = 'oakhire_refresh';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

async function register(req, res) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  // The very first account created bootstraps the workspace as super_admin.
  // Every subsequent registration is forced to employee — role is never
  // trusted from the client to prevent privilege escalation. Additional
  // employees/admins should be provisioned by a super_admin afterwards.
  const userCount = await User.countDocuments();
  const role = userCount === 0 ? 'super_admin' : 'employee';

  const user = await User.create({ name, email, password, phone, role });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({ user: user.toSafeObject(), accessToken });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({ user: user.toSafeObject(), accessToken });
}

async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.refreshTokenVersion !== payload.v) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const accessToken = signAccessToken(user);
  res.json({ user: user.toSafeObject(), accessToken });
}

async function logout(req, res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: user.toSafeObject() });
}

module.exports = { register, login, refresh, logout, me };
