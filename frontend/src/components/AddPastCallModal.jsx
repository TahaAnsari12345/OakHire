import { useState } from 'react';
import Modal from './common/Modal';
import { createPastCallLog } from '../services/callLogs';
import DispositionFields, { emptyDispositionValue, buildNextFollowupPayload } from './DispositionFields';

/**
 * Secondary path for logging a call that happened outside the app (no
 * timer, manual duration). Same disposition rules apply.
 */
export default function AddPastCallModal({ calleeType, candidateId, clientId, related, onClose, onLogged }) {
  const [value, setValue] = useState({ ...emptyDispositionValue(), relatedId: '' });
  const [durationMinutes, setDurationMinutes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!value.disposition) {
      setError('Select a disposition.');
      return;
    }
    if (!durationMinutes || Number(durationMinutes) < 0) {
      setError('Enter how long the call lasted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        calleeType,
        candidateId: calleeType === 'Candidate' ? candidateId : undefined,
        clientId: calleeType === 'Client' ? clientId : undefined,
        applicationId: calleeType === 'Candidate' ? value.relatedId || undefined : undefined,
        jobRequirementId: calleeType === 'Client' ? value.relatedId || undefined : undefined,
        disposition: value.disposition,
        durationSeconds: Math.round(Number(durationMinutes) * 60),
        notes: value.notes,
        nextFollowup: buildNextFollowupPayload(value),
      };
      await createPastCallLog(payload);
      onLogged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save the call');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Add a past call" onClose={onClose}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <label>
          Duration (minutes) *
          <input
            type="number"
            min="0"
            step="0.5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />
        </label>

        {related?.length > 0 && (
          <label>
            {calleeType === 'Candidate' ? 'Related application' : 'Related job requirement'}
            <select value={value.relatedId} onChange={(e) => setValue({ ...value, relatedId: e.target.value })}>
              <option value="">None</option>
              {related.map((r) => (
                <option key={r._id} value={r._id}>
                  {calleeType === 'Candidate' ? r.jobRequirement?.title : r.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <DispositionFields calleeType={calleeType} value={value} onChange={setValue} />

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save call'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
