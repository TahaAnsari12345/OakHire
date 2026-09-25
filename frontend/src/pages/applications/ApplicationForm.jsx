import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCandidateOptions, useJobRequirementOptions, useFunnelStageOptions } from '../../hooks/useOptions';

export default function ApplicationForm() {
  const navigate = useNavigate();

  const candidates = useCandidateOptions();
  const jobRequirements = useJobRequirementOptions();
  const stages = useFunnelStageOptions();

  const [form, setForm] = useState({ candidate: '', jobRequirement: '', funnelStage: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = { candidate: form.candidate, jobRequirement: form.jobRequirement, notes: form.notes };
      if (form.funnelStage) payload.funnelStage = form.funnelStage;
      const { data } = await api.post('/applications', payload);
      navigate(`/applications/${data.application._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <h2>Add Application</h2>
      {error && <div className="auth-error">{error}</div>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Candidate *
            <select name="candidate" value={form.candidate} onChange={handleChange} required>
              <option value="">— Select candidate —</option>
              {candidates.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </label>
          <label>
            Job requirement *
            <select name="jobRequirement" value={form.jobRequirement} onChange={handleChange} required>
              <option value="">— Select job requirement —</option>
              {jobRequirements.map((jr) => (
                <option key={jr._id} value={jr._id}>
                  {jr.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Funnel stage
            <select name="funnelStage" value={form.funnelStage} onChange={handleChange}>
              <option value="">Default (first stage)</option>
              {stages.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-grid-full">
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save application'}
          </button>
        </div>
      </form>
    </div>
  );
}
