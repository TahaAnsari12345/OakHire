const FunnelStage = require('../models/FunnelStage');

const DEFAULT_STAGES = [
  { name: 'Sourced', order: 1, isTerminal: false },
  { name: 'Screening', order: 2, isTerminal: false },
  { name: 'Interview Scheduled', order: 3, isTerminal: false },
  { name: 'Interview Done', order: 4, isTerminal: false },
  { name: 'Offer', order: 5, isTerminal: false },
  { name: 'Joined', order: 6, isTerminal: true },
  { name: 'Rejected', order: 7, isTerminal: true },
  { name: 'On Hold', order: 8, isTerminal: false },
];

async function seedFunnelStages() {
  const count = await FunnelStage.countDocuments();
  if (count > 0) return;

  await FunnelStage.insertMany(DEFAULT_STAGES);
  console.log('[seed] Default funnel stages created');
}

module.exports = seedFunnelStages;
