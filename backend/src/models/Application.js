const mongoose = require('mongoose');

const STATUSES = ['Active', 'Joined', 'Rejected'];

// The join of Candidate x JobRequirement. Funnel stage lives HERE, not on
// Candidate, because a candidate can be at different stages on different
// job requirements simultaneously.
const applicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    jobRequirement: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', required: true, index: true },
    funnelStage: { type: mongoose.Schema.Types.ObjectId, ref: 'FunnelStage', required: true },
    // Denormalized from jobRequirement.assignedTo at creation so employee
    // ownership filtering doesn't require a join on every list query.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
    // Terminal flag set by the stage-change endpoint (Stage 3). 'Active'
    // until the Application reaches a terminal funnel stage.
    status: { type: String, enum: STATUSES, default: 'Active' },
    rejectionReason: { type: String, trim: true },
    joiningDate: { type: Date },
  },
  { timestamps: true }
);

applicationSchema.index({ candidate: 1, jobRequirement: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;
