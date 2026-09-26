import { useState } from 'react';
import Modal from './common/Modal';
import { createInteraction } from '../services/interactions';
import { useToast } from '../context/ToastContext';

const TYPES = ['Email', 'Meeting', 'WhatsApp', 'SMS', 'Note'];
const FOLLOWUP_TYPES = ['Call', 'Email', 'Meeting', 'Interview Reminder', 'Document Collection'];

export default function LogActivityModal({ calleeType, entityId, related = [], onClose, onLogged }) {
  const { showToast } = useToast();
  const [type, setType] = useState('Email');
  const [value, setValue] = useState({ subject: '', notes: '', outcome: '', direction: 'Sent', relatedId: '' });
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followup, setFollowup] = useState({ dueDate: '', type: 'Call' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field, next) {
    setValue((current) => ({ ...current, [field]: next }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        type,
        calleeType,
        candidateId: calleeType === 'Candidate' ? entityId : undefined,
        clientId: calleeType === 'Client' ? entityId : undefined,
        applicationId: calleeType === 'Candidate' ? value.relatedId || undefined : undefined,
        jobRequirementId: calleeType === 'Client' ? value.relatedId || undefined : undefined,
        subject: value.subject || undefined,
        notes: value.notes,
        outcome: value.outcome || undefined,
        direction: type === 'Email' ? value.direction : undefined,
        meetingDate: type === 'Meeting' ? value.meetingDate || undefined : undefined,
        durationMinutes: type === 'Meeting' && value.durationMinutes ? Number(value.durationMinutes) : undefined,
        mode: type === 'Meeting' ? value.mode || undefined : undefined,
        attendees: type === 'Meeting' ? value.attendees || undefined : undefined,
        nextFollowup: scheduleFollowup ? { dueDate: followup.dueDate, type: followup.type } : undefined,
      };
      await createInteraction(payload);
      showToast('Activity logged', { tone: 'success' });
      onLogged();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log activity');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Log activity" onClose={onClose}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        {related.length > 0 && (
          <label>
            {calleeType === 'Candidate' ? 'Related application' : 'Related job requirement'}
            <select value={value.relatedId} onChange={(e) => update('relatedId', e.target.value)}>
              <option value="">None</option>
              {related.map((item) => <option key={item._id} value={item._id}>{calleeType === 'Candidate' ? item.jobRequirement?.title : item.title}</option>)}
            </select>
          </label>
        )}
        {(type === 'Email' || type === 'Meeting') && (
          <label>
            Subject *
            <input value={value.subject} onChange={(e) => update('subject', e.target.value)} required maxLength="200" />
          </label>
        )}
        {type === 'Email' && (
          <label>
            Direction
            <select value={value.direction} onChange={(e) => update('direction', e.target.value)}>
              <option>Sent</option><option>Received</option>
            </select>
          </label>
        )}
        {type === 'Meeting' && (
          <>
            <label>Meeting date<input type="datetime-local" value={value.meetingDate || ''} onChange={(e) => update('meetingDate', e.target.value)} /></label>
            <label>Duration (minutes)<input type="number" min="0" value={value.durationMinutes || ''} onChange={(e) => update('durationMinutes', e.target.value)} /></label>
            <label>Mode<select value={value.mode || ''} onChange={(e) => update('mode', e.target.value)}><option value="">Select mode</option><option>In person</option><option>Video</option><option>Phone</option></select></label>
            <label>Attendees<input value={value.attendees || ''} onChange={(e) => update('attendees', e.target.value)} /></label>
          </>
        )}
        <label>Notes *<textarea value={value.notes} onChange={(e) => update('notes', e.target.value)} required maxLength="2000" /></label>
        <label>Outcome<input value={value.outcome} onChange={(e) => update('outcome', e.target.value)} maxLength="1000" /></label>
        <label>
          <span><input type="checkbox" checked={scheduleFollowup} onChange={(e) => setScheduleFollowup(e.target.checked)} /> Schedule next follow-up</span>
        </label>
        {scheduleFollowup && (
          <>
            <label>Follow-up date and time<input type="datetime-local" value={followup.dueDate} onChange={(e) => setFollowup({ ...followup, dueDate: e.target.value })} required /></label>
            <label>Follow-up type<select value={followup.type} onChange={(e) => setFollowup({ ...followup, type: e.target.value })}>{FOLLOWUP_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
          </>
        )}
        <div className="form-actions"><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save activity'}</button></div>
      </form>
    </Modal>
  );
}
