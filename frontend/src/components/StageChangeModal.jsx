import { useMemo, useState } from 'react';
import Modal from './common/Modal';
import api from '../api/axios';
import { TYPES } from '../constants/followup';
import { REJECTION_REASONS } from '../constants/application';

export default function StageChangeModal({ application, stages, onClose, onChanged }) {
  const currentStageId = application.funnelStage?._id || application.funnelStage;
  const availableStages = stages.filter((s) => s._id !== currentStageId);

  const [funnelStage, setFunnelStage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupType, setNextFollowupType] = useState('Call');
  const [nextFollowupNotes, setNextFollowupNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStage = useMemo(
    () => availableStages.find((s) => s._id === funnelStage),
    [availableStages, funnelStage]
  );
  const isRejection = selectedStage?.isTerminal && /reject|drop/i.test(selectedStage.name);
  const isJoined = selectedStage?.isTerminal && /joined/i.test(selectedStage.name);
  const isOtherTerminal = selectedStage?.isTerminal && !isRejection && !isJoined;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!funnelStage) {
      setError('Select a stage to move to.');
      return;
    }
    if (isRejection && !rejectionReason) {
      setError('A rejection reason is required.');
      return;
    }
    if (isJoined && !joiningDate) {
      setError('A joining date is required.');
      return;
    }
    if (!selectedStage?.isTerminal && !nextFollowupDate) {
      setError('A next follow-up date is required unless the stage is terminal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { funnelStage };
      if (isRejection) payload.rejectionReason = rejectionReason;
      if (isJoined) payload.joiningDate = joiningDate;
      if (!selectedStage?.isTerminal) {
        payload.nextFollowupDate = nextFollowupDate;
        payload.nextFollowupType = nextFollowupType;
        payload.nextFollowupNotes = nextFollowupNotes;
      }
      await api.put(`/applications/${application._id}/stage`, payload);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change stage');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Move to next stage" onClose={onClose}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <label>
          New stage *
          <select value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)} required>
            <option value="">— Select stage —</option>
            {availableStages.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {isRejection && (
          <label>
            Rejection reason *
            <select value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} required>
              <option value="">— Select reason —</option>
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        )}

        {isJoined && (
          <label>
            Joining date *
            <input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
          </label>
        )}

        {isOtherTerminal && (
          <p className="form-hint">This is a terminal stage — no next follow-up is required.</p>
        )}

        {selectedStage && !selectedStage.isTerminal && (
          <>
            <label>
              Next follow-up date *
              <input type="date" value={nextFollowupDate} onChange={(e) => setNextFollowupDate(e.target.value)} required />
            </label>
            <label>
              Next follow-up type
              <select value={nextFollowupType} onChange={(e) => setNextFollowupType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Next follow-up notes
              <input value={nextFollowupNotes} onChange={(e) => setNextFollowupNotes(e.target.value)} />
            </label>
          </>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Confirm stage change'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
