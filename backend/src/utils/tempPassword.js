const crypto = require('crypto');

// Readable-ish temp password for freshly created employee accounts —
// shown once to the admin, never stored or emailed (keeping this v1 simple
// per the spec: "a temp password shown once is fine for v1").
function generateTempPassword() {
  return crypto.randomBytes(6).toString('base64url') + '!1';
}

module.exports = generateTempPassword;
