const mongoose = require('mongoose');

const TYPES = ['Call', 'Email', 'Meeting', 'Interview Reminder', 'Document Collection'];
const STATUSES = ['Pending', 'Done', 'Missed', 'Rescheduled'];

// A follow-up belongs to exactly one of a candidate or a client.
// `application` / `jobRequirement` are optional context — a candidate who
// isn't linked to any role yet still needs follow-ups.
const followupSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    jobRequirement: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    type: { type: String, enum: TYPES, default: 'Call' },
    status: { type: String, enum: STATUSES, default: 'Pending', index: true },
    notes: { type: String, trim: true },
    outcomeNotes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Prevents the nightly cron from re-notifying the Super Admin about the
    // same overdue followup on every subsequent run.
    adminNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

followupSchema.pre('validate', function requireExactlyOneOwner() {
  if (Boolean(this.candidate) === Boolean(this.client)) {
    this.invalidate('candidate', 'A follow-up must belong to exactly one of a candidate or a client');
  }
});

module.exports = mongoose.model('Followup', followupSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
