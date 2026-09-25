const { z } = require('zod');
const { TYPES } = require('../models/Followup');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid id');
const optionalId = z.preprocess((v) => (v === '' || v === null ? undefined : v), objectId.optional());

const createFollowupSchema = z
  .object({
    candidateId: optionalId,
    clientId: optionalId,
    applicationId: optionalId,
    jobRequirementId: optionalId,
    assignedTo: optionalId,
    dueDate: z.coerce.date(),
    type: z.enum(TYPES).default('Call'),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.candidateId) === Boolean(value.clientId)) {
      ctx.addIssue({ code: 'custom', path: ['candidateId'], message: 'exactly one of candidateId or clientId is required' });
    }
    if (value.clientId && value.applicationId) {
      ctx.addIssue({ code: 'custom', path: ['applicationId'], message: 'cannot be set on a client follow-up' });
    }
    if (value.candidateId && value.jobRequirementId) {
      ctx.addIssue({ code: 'custom', path: ['jobRequirementId'], message: 'use applicationId for candidate follow-ups' });
    }
  });

const completeFollowupSchema = z.object({
  outcomeNotes: z.string().trim().min(1, 'is required').max(2000),
  nextFollowup: z.preprocess(
    (v) => (v === null || v === '' ? undefined : v),
    z
      .object({
        dueDate: z.coerce.date(),
        type: z.enum(TYPES).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
      .optional()
  ),
});

module.exports = { createFollowupSchema, completeFollowupSchema };
