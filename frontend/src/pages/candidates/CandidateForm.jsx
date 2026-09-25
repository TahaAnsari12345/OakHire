import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useEmployees from '../../hooks/useEmployees';
import { useLeadSourceOptions } from '../../hooks/useOptions';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  location: '',
  skills: '',
  totalExperience: '',
  currentCompany: '',
  currentRole: '',
  currentCTC: '',
  expectedCTC: '',
  noticePeriod: '',
  resumeUrl: '',
  source: 'Manual',
  assignedTo: '',
};

export default function CandidateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const employees = useEmployees();
  const leadSources = useLeadSourceOptions();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBreadcrumb(isEdit ? form.name || null : null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/candidates/${id}`).then(({ data }) => {
      const c = data.candidate;
      setForm({
        name: c.name || '',
        phone: c.phone || '',
        email: c.email || '',
        location: c.location || '',
        skills: (c.skills || []).join(', '),
        totalExperience: c.totalExperience ?? '',
        currentCompany: c.currentCompany || '',
        currentRole: c.currentRole || '',
        currentCTC: c.currentCTC ?? '',
        expectedCTC: c.expectedCTC ?? '',
        noticePeriod: c.noticePeriod || '',
        resumeUrl: c.resumeUrl || '',
        source: c.source || 'Manual',
        assignedTo: c.assignedTo?._id || c.assignedTo || '',
      });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load candidate'))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      ...form,
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      totalExperience: form.totalExperience === '' ? undefined : Number(form.totalExperience),
      currentCTC: form.currentCTC === '' ? undefined : Number(form.currentCTC),
      expectedCTC: form.expectedCTC === '' ? undefined : Number(form.expectedCTC),
    };
    if (!payload.assignedTo) delete payload.assignedTo;

    try {
      if (isEdit) {
        await api.patch(`/candidates/${id}`, payload);
        navigate(`/candidates/${id}`);
      } else {
        const { data } = await api.post('/candidates', payload);
        navigate(`/candidates/${data.candidate._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save candidate');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this candidate? This cannot be undone.')) return;
    try {
      await api.delete(`/candidates/${id}`);
      navigate('/candidates');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete candidate');
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="form-page">
      <h2>{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h2>
      {error && <div className="auth-error">{error}</div>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Name *
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Phone *
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <label>
            Skills (comma separated)
            <input name="skills" value={form.skills} onChange={handleChange} />
          </label>
          <label>
            Total experience (yrs)
            <input type="number" min="0" step="0.5" name="totalExperience" value={form.totalExperience} onChange={handleChange} />
          </label>
          <label>
            Current company
            <input name="currentCompany" value={form.currentCompany} onChange={handleChange} />
          </label>
          <label>
            Current role
            <input name="currentRole" value={form.currentRole} onChange={handleChange} />
          </label>
          <label>
            Current CTC
            <input type="number" min="0" name="currentCTC" value={form.currentCTC} onChange={handleChange} />
          </label>
          <label>
            Expected CTC
            <input type="number" min="0" name="expectedCTC" value={form.expectedCTC} onChange={handleChange} />
          </label>
          <label>
            Notice period
            <input name="noticePeriod" value={form.noticePeriod} onChange={handleChange} />
          </label>
          <label>
            Resume URL
            <input name="resumeUrl" value={form.resumeUrl} onChange={handleChange} />
          </label>
          <label>
            Source
            <select name="source" value={form.source} onChange={handleChange}>
              {leadSources.map((s) => (
                <option key={s._id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {user?.role === 'super_admin' && (
            <label>
              Assigned to
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange}>
                <option value="">— Select employee —</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save candidate'}
          </button>
          {isEdit && (
            <button type="button" className="btn-danger" onClick={handleDelete}>
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
