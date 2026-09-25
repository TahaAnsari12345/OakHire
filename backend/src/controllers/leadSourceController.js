const LeadSource = require('../models/LeadSource');

async function listLeadSources(req, res) {
  const filter = req.user.role === 'super_admin' ? {} : { isActive: true };
  const leadSources = await LeadSource.find(filter).sort({ name: 1 });
  res.json({ leadSources });
}

async function createLeadSource(req, res) {
  const { name, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
  const leadSource = await LeadSource.create({ name, isActive });
  res.status(201).json({ leadSource });
}

async function updateLeadSource(req, res) {
  const leadSource = await LeadSource.findById(req.params.id);
  if (!leadSource) {
    return res.status(404).json({ message: 'Lead source not found' });
  }

  const updatable = ['name', 'isActive'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) leadSource[field] = req.body[field];
  });

  await leadSource.save();
  res.json({ leadSource });
}

async function deleteLeadSource(req, res) {
  const leadSource = await LeadSource.findByIdAndDelete(req.params.id);
  if (!leadSource) {
    return res.status(404).json({ message: 'Lead source not found' });
  }
  res.status(204).send();
}

module.exports = { listLeadSources, createLeadSource, updateLeadSource, deleteLeadSource };
