require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const seedFunnelStages = require('./utils/seedFunnelStages');
const seedCallDispositionTypes = require('./utils/seedCallDispositionTypes');
const seedLeadSources = require('./utils/seedLeadSources');
const { scheduleFollowupCron } = require('./utils/followupCron');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await seedFunnelStages();
  await seedCallDispositionTypes();
  await seedLeadSources();
  scheduleFollowupCron();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`[server] OakHire CRM API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
