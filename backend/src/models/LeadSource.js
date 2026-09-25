const mongoose = require('mongoose');

// Admin-editable master list (CMS). Used by RawLead ingestion (Stage 7)
// and anywhere a lead source dropdown is needed — never hardcoded.
const leadSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('LeadSource', leadSourceSchema);
