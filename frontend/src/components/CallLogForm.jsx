import { useEffect, useState } from 'react';
import Modal from './common/Modal';
import api from '../api/axios';
import { useCall } from '../context/CallContext';
import DispositionFields, { emptyDispositionValue, buildNextFollowupPayload } from './DispositionFields';

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Opens automatically after "End call" (call.pendingLogCall from
 * CallContext) to log the outcome. Updates the SAME CallLog record via
 * PUT — never creates a second one. Closing without saving leaves the
 * call "undisposed"; it reopens from the top-bar badge.
 */
export default function CallLogForm() {
  const { pendingLogCall, closeLogForm, disposeCall } = useCall();
  const [related, setRelated] = useState([]);
  const [value, setValue] = useState({ ...emptyDispositionValue(), relatedId: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pendingLogCall) return;
    setValue({ ...emptyDispositionValue(), notes: pendingLogCall.draftNotes || '', relatedId: '' });
    setError('');

    if (pendingLogCall.calleeType === 'Candidate') {
      const candidateId = pendingLogCall.candidate?._id || pendingLogCall.candidate;
      api.get('/applications', { params: { candidate: candidateId, limit: 50 } }).then(({ data }) => setRelated(data.data));
    } else {
      const clientId = pendingLogCall.client?._id || pendingLogCall.client;
      api.get('/job-requirements', { params: { client: clientId, limit: 50 } }).then(({ data }) => setRelated(data.data));
    }
  }, [pendingLogCall]);

  if (!pendingLogCall) return null;

  const isCandidate = pendingLogCall.calleeType === 'Candidate';
  const name = pendingLogCall.contactName || pendingLogCall.candidate?.name || pendingLogCall.client?.companyName;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!value.disposition) {
      setError('Select a disposition.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        disposition: value.disposition,
        notes: value.notes,
        nextFollowup: buildNextFollowupPayload(value),
      };
      if (isCandidate) payload.applicationId = value.relatedId || null;
      else payload.jobRequirementId = value.relatedId || null;

      await disposeCall(pendingLogCall._id, payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log the call');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Log call — ${name}`} onClose={closeLogForm}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <p className="form-hint">Duration: {formatDuration(pendingLogCall.durationSeconds)}</p>

        {related.length > 0 && (
          <label>
            {isCandidate ? 'Related application' : 'Related job requirement'}
            <select value={value.relatedId} onChange={(e) => setValue({ ...value, relatedId: e.target.value })}>
              <option value="">None</option>
              {related.map((r) => (
                <option key={r._id} value={r._id}>
                  {isCandidate ? r.jobRequirement?.title : r.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <DispositionFields calleeType={pendingLogCall.calleeType} value={value} onChange={setValue} />

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save call log'}
          </button>
          <button type="button" className="btn-secondary" onClick={closeLogForm}>
            Log later
          </button>
        </div>
      </form>
    </Modal>
  );
}
