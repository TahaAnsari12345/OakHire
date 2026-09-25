const CallDispositionType = require('../models/CallDispositionType');

const CANDIDATE_DISPOSITIONS = [
  { name: 'Connected–Busy', requiresFollowup: true, tone: 'warning' },
  { name: 'Connected–Interested', requiresFollowup: true, tone: 'success' },
  { name: 'Connected–Not Interested', requiresFollowup: false, tone: 'neutral' },
  { name: 'Not Reachable', requiresFollowup: true, tone: 'warning' },
  { name: 'Switched Off', requiresFollowup: true, tone: 'warning' },
  { name: 'Invalid Number', requiresFollowup: false, tone: 'danger' },
  { name: 'Interview Scheduled', requiresFollowup: true, tone: 'success' },
  { name: 'Missed by Candidate', requiresFollowup: true, tone: 'danger' },
].map((d) => ({ ...d, appliesTo: 'Candidate' }));

const CLIENT_DISPOSITIONS = [
  { name: 'Requirement Discussed', requiresFollowup: false, tone: 'success' },
  { name: 'CV Feedback Given', requiresFollowup: false, tone: 'success' },
  { name: 'New Requirement Shared', requiresFollowup: false, tone: 'success' },
  { name: 'Client Unavailable', requiresFollowup: true, tone: 'warning' },
  { name: 'Meeting Scheduled', requiresFollowup: true, tone: 'success' },
  { name: 'Follow-up Requested', requiresFollowup: true, tone: 'warning' },
].map((d) => ({ ...d, appliesTo: 'Client' }));

// Only creates rows that don't exist yet, so anything an admin deleted or
// edited through the CMS isn't resurrected on every server boot — except
// when the list is completely empty (fresh database).
async function seedCallDispositionTypes() {
  const count = await CallDispositionType.countDocuments();
  const all = [...CANDIDATE_DISPOSITIONS, ...CLIENT_DISPOSITIONS];

  if (count === 0) {
    await CallDispositionType.insertMany(all.map((d, i) => ({ ...d, order: i + 1 })));
    console.log('[seed] Default call disposition types created');
    return;
  }

  const hasClientDispositions = await CallDispositionType.exists({ appliesTo: { $in: ['Client', 'Both'] } });
  if (!hasClientDispositions) {
    await CallDispositionType.insertMany(
      CLIENT_DISPOSITIONS.map((d, i) => ({ ...d, order: CANDIDATE_DISPOSITIONS.length + i + 1 }))
    );
    console.log('[seed] Client call disposition types created');
  }
}

module.exports = seedCallDispositionTypes;
