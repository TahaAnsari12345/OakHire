import { useState } from 'react';
import Modal from './common/Modal';
import api from '../api/axios';
import { TYPES } from '../constants/followup';

export default function FollowupCompleteModal({ followup, onClose, onCompleted }) {
  // A follow-up with no application (candidate-only or client) never
  // forces a next action — only an active application does.
  const canSkip = !followup.application || followup.application.status !== 'Active';
  const name = followup.candidate?.name || followup.client?.companyName || '';

  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [nextType, setNextType] = useState(followup.type || 'Call');
  const [nextNotes, setNextNotes] = useState('');
  const [skipNext, setSkipNext] = useState(canSkip);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!skipNext && !nextDueDate) {
      setError('A next follow-up date is required while the linked application is still active.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { outcomeNotes };
      if (!skipNext) {
        payload.nextFollowup = { dueDate: nextDueDate, type: nextType, notes: nextNotes };
      }
      await api.put(`/followups/${followup._id}/complete`, payload);
      onCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete follow-up');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Complete follow-up — ${name}`} onClose={onClose}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <label>
          Outcome notes *
          <textarea value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} rows={3} required />
        </label>

        {canSkip && (
          <label className="checkbox-row">
            <input type="checkbox" checked={skipNext} onChange={(e) => setSkipNext(e.target.checked)} />
            No next follow-up needed
          </label>
        )}

        {!skipNext && (
          <>
            <label>
              Next follow-up date *
              <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} required={!skipNext} />
            </label>
            <label>
              Next follow-up type
              <select value={nextType} onChange={(e) => setNextType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Next follow-up notes
              <input value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} />
            </label>
          </>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Mark done'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
