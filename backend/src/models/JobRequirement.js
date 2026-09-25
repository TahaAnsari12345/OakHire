const mongoose = require('mongoose');

const PRIORITIES = ['Hot', 'Warm', 'Cold'];
const ENGAGEMENT_TYPES = ['Direct', 'Vendor'];
const STATUSES = ['Open', 'On-hold', 'Closed'];

const jobRequirementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    skills: [{ type: String, trim: true }],
    experienceMin: { type: Number, default: 0 },
    experienceMax: { type: Number },
    ctcMin: { type: Number },
    ctcMax: { type: Number },
    openings: { type: Number, default: 1 },
    location: { type: String, trim: true },
    priority: { type: String, enum: PRIORITIES, default: 'Warm' },
    engagementType: { type: String, enum: ENGAGEMENT_TYPES, default: 'Direct' },
    status: { type: String, enum: STATUSES, default: 'Open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobRequirementSchema.index({ title: 'text', skills: 'text' });

module.exports = mongoose.model('JobRequirement', jobRequirementSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.ENGAGEMENT_TYPES = ENGAGEMENT_TYPES;
module.exports.STATUSES = STATUSES;
