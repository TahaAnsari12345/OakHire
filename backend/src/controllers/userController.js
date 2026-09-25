const User = require('../models/User');

// Minimal listing used to populate "assign to employee" dropdowns.
// Full employee management (create/deactivate/edit) arrives in Stage 5.
async function listUsers(req, res) {
  const { role } = req.query;
  const filter = { isActive: true };
  if (role) filter.role = role;

  const users = await User.find(filter).select('name email role').sort({ name: 1 });
  res.json({ users });
}

module.exports = { listUsers };
