const mongoose = require('mongoose');

// Admin-editable option list (CMS, Stage 5). Seeded with sane defaults on
// first boot so Application records have somewhere to point from Stage 2
// onward — never hardcode these values in frontend dropdowns.
const funnelStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, required: true, default: 0 },
    isTerminal: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FunnelStage', funnelStageSchema);
