const mongoose = require('mongoose');

const CALLEE_TYPES = ['Candidate', 'Client'];
const CALL_STATUSES = ['initiated', 'completed'];

// Exactly one of `candidate` / `client` is set, matching `calleeType` —
// enforced by the zod schemas in the calls/call-log controllers.
// `application` and `jobRequirement` are always optional context.
const callLogSchema = new mongoose.Schema(
  {
    calleeType: { type: String, enum: CALLEE_TYPES, required: true, default: 'Candidate', index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    jobRequirement: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', index: true },
    // Snapshot of who was actually dialed (a client can have several contacts).
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Empty until the employee logs the outcome — a completed call with no
    // disposition is "undisposed" and surfaces in the top-bar badge.
    disposition: { type: mongoose.Schema.Types.ObjectId, ref: 'CallDispositionType' },
    durationSeconds: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    callStatus: { type: String, enum: CALL_STATUSES, default: 'completed', index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CallLog', callLogSchema);
module.exports.CALLEE_TYPES = CALLEE_TYPES;
module.exports.CALL_STATUSES = CALL_STATUSES;
