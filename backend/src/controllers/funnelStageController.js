const FunnelStage = require('../models/FunnelStage');

async function listFunnelStages(req, res) {
  // Any authenticated user can read (populates stage dropdowns); only
  // super_admin sees inactive stages (CMS) or can mutate the list.
  const filter = req.user.role === 'super_admin' ? {} : { isActive: true };
  const stages = await FunnelStage.find(filter).sort({ order: 1 });
  res.json({ stages });
}

async function createFunnelStage(req, res) {
  const { name, order, isTerminal, isActive } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
  const stage = await FunnelStage.create({ name, order, isTerminal, isActive });
  res.status(201).json({ stage });
}

async function updateFunnelStage(req, res) {
  const stage = await FunnelStage.findById(req.params.id);
  if (!stage) {
    return res.status(404).json({ message: 'Funnel stage not found' });
  }

  const updatable = ['name', 'order', 'isTerminal', 'isActive'];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) stage[field] = req.body[field];
  });

  await stage.save();
  res.json({ stage });
}

async function deleteFunnelStage(req, res) {
  const stage = await FunnelStage.findByIdAndDelete(req.params.id);
  if (!stage) {
    return res.status(404).json({ message: 'Funnel stage not found' });
  }
  res.status(204).send();
}

module.exports = { listFunnelStages, createFunnelStage, updateFunnelStage, deleteFunnelStage };
