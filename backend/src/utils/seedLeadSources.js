const LeadSource = require('../models/LeadSource');

const DEFAULT_SOURCES = ['Meta', 'Google', 'Manual', 'Referral', 'Apply Page'];

async function seedLeadSources() {
  const count = await LeadSource.countDocuments();
  if (count > 0) return;

  await LeadSource.insertMany(DEFAULT_SOURCES.map((name) => ({ name })));
  console.log('[seed] Default lead sources created');
}

module.exports = seedLeadSources;
