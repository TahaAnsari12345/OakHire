import api from '../api/axios';

export function createInteraction(payload) {
  return api.post('/interactions', payload).then(({ data }) => data);
}

export function fetchInteractions(params) {
  return api.get('/interactions', { params }).then(({ data }) => data);
}

export function updateInteraction(id, payload) {
  return api.put(`/interactions/${id}`, payload).then(({ data }) => data);
}

export function deleteInteraction(id) {
  return api.delete(`/interactions/${id}`);
}
