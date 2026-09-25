const REJECTION_REASONS = [
  'Client rejected',
  'Candidate declined',
  'No-show',
  'Salary mismatch',
  'Other',
];

// A followup missed by more than this many days escalates to the Super
// Admin via Notification. Kept as a named constant so it's easy to tune.
const MISSED_FOLLOWUP_ESCALATION_DAYS = 2;

module.exports = { REJECTION_REASONS, MISSED_FOLLOWUP_ESCALATION_DAYS };
