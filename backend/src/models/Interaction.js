const mongoose = require('mongoose');

const TYPES = ['Email', 'Meeting', 'WhatsApp', 'SMS', 'Note'];
const CALLEE_TYPES = ['Candidate', 'Client'];

const interactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true, index: true },
    calleeType: { type: String, enum: CALLEE_TYPES, required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', index: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', index: true },
    jobRequirement: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', index: true },
    subject: { type: String, trim: true },
    notes: { type: String, trim: true, required: true },
    outcome: { type: String, trim: true },
    direction: { type: String, enum: ['Sent', 'Received'] },
    meetingDate: { type: Date },
    durationMinutes: { type: Number },
    mode: { type: String, enum: ['In person', 'Video', 'Phone'] },
    attendees: { type: String, trim: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

interactionSchema.pre('validate', function validateOwnerAndType() {
  if (Boolean(this.candidate) === Boolean(this.client)) {
    this.invalidate('candidate', 'An interaction must belong to exactly one of a candidate or a client');
  }
  if (this.calleeType === 'Candidate' && (!this.candidate || this.client)) {
    this.invalidate('candidate', 'A candidate interaction requires only a candidate');
  }
  if (this.calleeType === 'Client' && (!this.client || this.candidate)) {
    this.invalidate('client', 'A client interaction requires only a client');
  }
  if (['Email', 'Meeting'].includes(this.type) && !this.subject) {
    this.invalidate('subject', 'Subject is required for email and meeting interactions');
  }
});

module.exports = mongoose.model('Interaction', interactionSchema);
module.exports.TYPES = TYPES;
