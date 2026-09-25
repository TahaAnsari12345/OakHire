import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useEmployees from '../../hooks/useEmployees';
import useClientOptions from '../../hooks/useClientOptions';
import CallButton from '../../components/CallButton';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { callableContacts } from '../../utils/clientContacts';

const EMPTY_FORM = {
  title: '',
  client: '',
  skills: '',
  experienceMin: '',
  experienceMax: '',
  ctcMin: '',
  ctcMax: '',
  openings: 1,
  location: '',
  priority: 'Warm',
  engagementType: 'Direct',
  status: 'Open',
  assignedTo: '',
};

export default function JobRequirementForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const employees = useEmployees();
  const clients = useClientOptions();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState(null);

  useBreadcrumb(form.title || null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/job-requirements/${id}`).then(({ data }) => {
      const jr = data.jobRequirement;
      if (jr.client?._id) {
        api.get(`/clients/${jr.client._id}`).then(({ data: clientData }) => setClient(clientData.client));
      }
      setForm({
        title: jr.title || '',
        client: jr.client?._id || jr.client || '',
        skills: (jr.skills || []).join(', '),
        experienceMin: jr.experienceMin ?? '',
        experienceMax: jr.experienceMax ?? '',
        ctcMin: jr.ctcMin ?? '',
        ctcMax: jr.ctcMax ?? '',
        openings: jr.openings ?? 1,
        location: jr.location || '',
        priority: jr.priority || 'Warm',
        engagementType: jr.engagementType || 'Direct',
        status: jr.status || 'Open',
        assignedTo: jr.assignedTo?._id || jr.assignedTo || '',
      });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load job requirement'))
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
      experienceMin: form.experienceMin === '' ? undefined : Number(form.experienceMin),
      experienceMax: form.experienceMax === '' ? undefined : Number(form.experienceMax),
      ctcMin: form.ctcMin === '' ? undefined : Number(form.ctcMin),
      ctcMax: form.ctcMax === '' ? undefined : Number(form.ctcMax),
      openings: Number(form.openings) || 1,
    };
    if (!payload.assignedTo) delete payload.assignedTo;

    try {
      if (isEdit) {
        await api.patch(`/job-requirements/${id}`, payload);
      } else {
        await api.post('/job-requirements', payload);
      }
      navigate('/job-requirements');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job requirement');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job requirement? This cannot be undone.')) return;
    try {
      await api.delete(`/job-requirements/${id}`);
      navigate('/job-requirements');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job requirement');
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="form-page">
      <div className="list-header">
        <h2>{isEdit ? 'Edit Job Requirement' : 'Add Job Requirement'}</h2>
        {isEdit && client && (
          <CallButton calleeType="Client" clientId={client._id} clientContacts={callableContacts(client)} jobRequirementId={id} label="Call client about this role" />
        )}
      </div>
      {error && <div className="auth-error">{error}</div>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Title *
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>
          <label>
            Client *
            <select name="client" value={form.client} onChange={handleChange} required>
              <option value="">— Select client —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Skills (comma separated)
            <input name="skills" value={form.skills} onChange={handleChange} />
          </label>
          <label>
            Experience min (yrs)
            <input type="number" min="0" name="experienceMin" value={form.experienceMin} onChange={handleChange} />
          </label>
          <label>
            Experience max (yrs)
            <input type="number" min="0" name="experienceMax" value={form.experienceMax} onChange={handleChange} />
          </label>
          <label>
            CTC min
            <input type="number" min="0" name="ctcMin" value={form.ctcMin} onChange={handleChange} />
          </label>
          <label>
            CTC max
            <input type="number" min="0" name="ctcMax" value={form.ctcMax} onChange={handleChange} />
          </label>
          <label>
            Openings
            <input type="number" min="1" name="openings" value={form.openings} onChange={handleChange} />
          </label>
          <label>
            Location
            <input name="location" value={form.location} onChange={handleChange} />
          </label>
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </label>
          <label>
            Engagement type
            <select name="engagementType" value={form.engagementType} onChange={handleChange}>
              <option value="Direct">Direct</option>
              <option value="Vendor">Vendor</option>
            </select>
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Open">Open</option>
              <option value="On-hold">On-hold</option>
              <option value="Closed">Closed</option>
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
            {isSubmitting ? 'Saving…' : 'Save requirement'}
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
