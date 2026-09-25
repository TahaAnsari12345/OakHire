const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
