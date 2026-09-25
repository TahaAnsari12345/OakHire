import api from '../api/axios';

/** POST /api/followups — schedule a follow-up for a candidate or a client. */
export function createFollowup(payload) {
  return api.post('/followups', payload).then(({ data }) => data.followup);
}

/** PUT /api/followups/:id/complete — mark done, optionally chaining the next one. */
export function completeFollowup(id, payload) {
  return api.put(`/followups/${id}/complete`, payload).then(({ data }) => data);
}

/** GET /api/followups */
export function fetchFollowups(params) {
  return api.get('/followups', { params }).then(({ data }) => data);
}
