const mongoose = require('mongoose');

const STATUSES = ['Active', 'Inactive'];

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: true }
);

const clientSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    industry: { type: String, trim: true },
    // Primary contact — additionalContacts holds everyone else an employee
    // might call (the call flow lets them pick which one).
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    additionalContacts: [contactSchema],
    address: { type: String, trim: true },
    accountOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'Active' },
  },
  { timestamps: true }
);

/** All dialable contacts: the primary contact first, then any extras. */
clientSchema.methods.callableContacts = function callableContacts() {
  const contacts = [];
  if (this.contactPhone) {
    contacts.push({ name: this.contactName || this.companyName, phone: this.contactPhone, isPrimary: true });
  }
  (this.additionalContacts || []).forEach((c) => {
    if (c.phone) contacts.push({ name: c.name, phone: c.phone, designation: c.designation, isPrimary: false });
  });
  return contacts;
};

module.exports = mongoose.model('Client', clientSchema);
module.exports.STATUSES = STATUSES;
