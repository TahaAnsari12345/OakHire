const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    location: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    totalExperience: { type: Number, default: 0 },
    currentCompany: { type: String, trim: true },
    currentRole: { type: String, trim: true },
    currentCTC: { type: Number },
    expectedCTC: { type: Number },
    noticePeriod: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    // Free-text, matched against the admin-editable LeadSource CMS list
    // rather than a hardcoded enum — new sources need no backend change.
    source: { type: String, trim: true, default: 'Manual' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Ownership for RBAC filtering; defaults to the creator and is the field
    // the Super Admin's candidate-transfer tool (Stage 5) reassigns.
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

candidateSchema.index({ name: 'text', currentCompany: 'text', skills: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
