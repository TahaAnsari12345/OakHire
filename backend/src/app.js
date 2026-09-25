const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const clientRoutes = require('./routes/clientRoutes');
const jobRequirementRoutes = require('./routes/jobRequirementRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const userRoutes = require('./routes/userRoutes');
const funnelStageRoutes = require('./routes/funnelStageRoutes');
const followupRoutes = require('./routes/followupRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const callLogRoutes = require('./routes/callLogRoutes');
const callRoutes = require('./routes/callRoutes');
const callDispositionTypeRoutes = require('./routes/callDispositionTypeRoutes');
const leadSourceRoutes = require('./routes/leadSourceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const appRoutes = require('./routes/appRoutes');
const requireAuth = require('./middleware/auth');
const requireRole = require('./middleware/role');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Vite auto-increments the port (5173, 5174, ...) if one's already taken,
// so allowed origins always include the common dev range, plus CLIENT_URL
// on top for production/custom setups — never one replacing the other.
const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
const allowedOrigins = [...new Set([...devOrigins, process.env.CLIENT_URL].filter(Boolean))];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.use('/api/candidates', requireAuth, candidateRoutes);
app.use('/api/clients', requireAuth, clientRoutes);
app.use('/api/job-requirements', requireAuth, jobRequirementRoutes);
app.use('/api/applications', requireAuth, applicationRoutes);
app.use('/api/funnel-stages', requireAuth, funnelStageRoutes);
app.use('/api/followups', requireAuth, followupRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);
app.use('/api/call-logs', requireAuth, callLogRoutes);
app.use('/api/calls', requireAuth, callRoutes);
app.use('/api/call-disposition-types', requireAuth, callDispositionTypeRoutes);
app.use('/api/lead-sources', requireAuth, leadSourceRoutes);
app.use('/api/users', requireAuth, requireRole('super_admin'), userRoutes);
app.use('/api/admin', requireAuth, requireRole('super_admin'), adminRoutes);
app.use('/api/app', requireAuth, requireRole('employee'), appRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
