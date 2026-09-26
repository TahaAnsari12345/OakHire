const { z } = require('zod');
const { TYPES: FOLLOWUP_TYPES } = require('../models/Followup');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid id');
// Forms send '' or null for "not selected" — treat both as absent.
const optionalId = z.preprocess((v) => (v === '' || v === null ? undefined : v), objectId.optional());
// On update: undefined = keep the current value, null/'' = clear it.
const clearableId = z.preprocess((v) => (v === '' ? null : v), objectId.nullable().optional());

const nextFollowupSchema = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  z
    .object({
      dueDate: z.coerce.date(),
      type: z.enum(FOLLOWUP_TYPES).optional(),
      notes: z.string().trim().max(1000).optional(),
    })
    .optional()
);

const calleeFields = {
  calleeType: z.enum(['Candidate', 'Client']),
  candidateId: optionalId,
  clientId: optionalId,
  applicationId: optionalId,
  jobRequirementId: optionalId,
  contactPhone: z.string().trim().max(30).optional(),
};

function requireMatchingCallee(value, ctx) {
  if (value.calleeType === 'Candidate') {
    if (!value.candidateId) ctx.addIssue({ code: 'custom', path: ['candidateId'], message: 'is required for candidate calls' });
    if (value.clientId || value.jobRequirementId) {
      ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'must not be set on a candidate call' });
    }
  } else {
    if (!value.clientId) ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'is required for client calls' });
    if (value.candidateId || value.applicationId) {
      ctx.addIssue({ code: 'custom', path: ['candidateId'], message: 'must not be set on a client call' });
    }
  }
}

const initiateCallSchema = z.object(calleeFields).superRefine(requireMatchingCallee);

// Logging the outcome of a call made through the call bridge (PUT).
const disposeCallSchema = z.object({
  disposition: objectId,
  notes: z.string().trim().max(2000).optional(),
  applicationId: clearableId,
  jobRequirementId: clearableId,
  nextFollowup: nextFollowupSchema,
});

module.exports = { initiateCallSchema, disposeCallSchema };
