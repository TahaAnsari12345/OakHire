import api from '../api/axios';

/** GET /api/call-disposition-types, optionally filtered by who they apply to. */
export function fetchDispositionTypes(appliesTo) {
  return api.get('/call-disposition-types').then(({ data }) =>
    appliesTo ? data.dispositionTypes.filter((d) => d.appliesTo === appliesTo || d.appliesTo === 'Both') : data.dispositionTypes
  );
}

/** PUT /api/call-logs/:id — log the outcome of a call made through the call bridge. */
export function disposeCallLog(callId, payload) {
  return api.put(`/call-logs/${callId}`, payload).then(({ data }) => data);
}

/** GET /api/call-logs — paginated call history, filterable. */
export function fetchCallLogs(params) {
  return api.get('/call-logs', { params }).then(({ data }) => data);
}
