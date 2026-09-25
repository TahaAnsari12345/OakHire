const mongoose = require('mongoose');

const APPLIES_TO = ['Candidate', 'Client', 'Both'];
const TONES = ['success', 'warning', 'danger', 'neutral'];

// Admin-editable master list (CMS) — never hardcode disposition values in
// the frontend; everything reads this list live.
const callDispositionTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    appliesTo: { type: String, enum: APPLIES_TO, default: 'Candidate' },
    // When true, logging a call with this disposition must schedule a next
    // follow-up — enforced server-side in the call-log controller.
    requiresFollowup: { type: Boolean, default: false },
    // Maps onto the shared status color tokens so admin-added dispositions
    // still render with a meaningful color.
    tone: { type: String, enum: TONES, default: 'neutral' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('CallDispositionType', callDispositionTypeSchema);
module.exports.APPLIES_TO = APPLIES_TO;
module.exports.TONES = TONES;
