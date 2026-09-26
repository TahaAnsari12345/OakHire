const { z } = require('zod');
const { TYPES } = require('../models/Interaction');
const { TYPES: FOLLOWUP_TYPES } = require('../models/Followup');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid id');
const optionalId = z.preprocess((v) => (v === '' || v === null ? undefined : v), objectId.optional());
const nextFollowup = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  z.object({
    dueDate: z.coerce.date(),
    type: z.enum(FOLLOWUP_TYPES).optional(),
    notes: z.string().trim().max(1000).optional(),
  }).optional()
);

const interactionFields = {
  type: z.enum(TYPES),
  calleeType: z.enum(['Candidate', 'Client']),
  candidateId: optionalId,
  clientId: optionalId,
  applicationId: optionalId,
  jobRequirementId: optionalId,
  subject: z.string().trim().max(200).optional(),
  notes: z.string().trim().min(1).max(2000),
  outcome: z.string().trim().max(1000).optional(),
  direction: z.enum(['Sent', 'Received']).optional(),
  meetingDate: z.coerce.date().optional(),
  durationMinutes: z.coerce.number().min(0).max(1440).optional(),
  mode: z.enum(['In person', 'Video', 'Phone']).optional(),
  attendees: z.string().trim().max(1000).optional(),
  nextFollowup,
};

const interactionSchema = z.object(interactionFields).superRefine((value, ctx) => {
  if (value.calleeType === 'Candidate') {
    if (!value.candidateId) ctx.addIssue({ code: 'custom', path: ['candidateId'], message: 'is required for candidate interactions' });
    if (value.clientId || value.jobRequirementId) ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'must not be set for candidate interactions' });
  } else {
    if (!value.clientId) ctx.addIssue({ code: 'custom', path: ['clientId'], message: 'is required for client interactions' });
    if (value.candidateId || value.applicationId) ctx.addIssue({ code: 'custom', path: ['candidateId'], message: 'must not be set for client interactions' });
  }
  if (['Email', 'Meeting'].includes(value.type) && !value.subject?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['subject'], message: 'is required for email and meeting interactions' });
  }
  if (value.type === 'Email' && !value.direction) {
    ctx.addIssue({ code: 'custom', path: ['direction'], message: 'is required for email interactions' });
  }
});

const interactionUpdateSchema = z.object({
  subject: interactionFields.subject,
  notes: interactionFields.notes.optional(),
  outcome: interactionFields.outcome,
  direction: interactionFields.direction,
  meetingDate: interactionFields.meetingDate,
  durationMinutes: interactionFields.durationMinutes,
  mode: interactionFields.mode,
  attendees: interactionFields.attendees,
}).partial();

module.exports = { interactionSchema, interactionUpdateSchema };
