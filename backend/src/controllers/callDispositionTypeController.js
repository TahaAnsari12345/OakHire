const CallDispositionType = require('../models/CallDispositionType');

async function listCallDispositionTypes(req, res) {
  // Any authenticated user can read the list (needed to populate the "Log
  // a Call" dropdown); only super_admin can mutate it (enforced in routes).
  const filter = req.user.role === 'super_admin' ? {} : { isActive: true };
  const dispositionTypes = await CallDispositionType.find(filter).sort({ order: 1 });
  res.json({ dispositionTypes });
}

async function createCallDispositionType(req, res) {
  const { name, order, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
  const dispositionType = await CallDispositionType.create({ name, order, isActive });
  res.status(201).json({ dispositionType });
}

async function updateCallDispositionType(req, res) {
  const dispositionType = await CallDispositionType.findById(req.params.id);
  if (!dispositionType) {
    return res.status(404).json({ message: 'Call disposition type not found' });
  }

  const updatable = ['name', 'order', 'isActive'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) dispositionType[field] = req.body[field];
  });

  await dispositionType.save();
  res.json({ dispositionType });
}

async function deleteCallDispositionType(req, res) {
  const dispositionType = await CallDispositionType.findByIdAndDelete(req.params.id);
  if (!dispositionType) {
    return res.status(404).json({ message: 'Call disposition type not found' });
  }
  res.status(204).send();
}

module.exports = {
  listCallDispositionTypes,
  createCallDispositionType,
  updateCallDispositionType,
  deleteCallDispositionType,
};
