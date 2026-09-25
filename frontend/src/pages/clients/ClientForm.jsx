import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useEmployees from '../../hooks/useEmployees';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

const EMPTY_FORM = {
  companyName: '',
  industry: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  status: 'Active',
  accountOwner: '',
};

function emptyContact() {
  return { name: '', designation: '', phone: '' };
}

export default function ClientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const employees = useEmployees();

  const [form, setForm] = useState(EMPTY_FORM);
  const [additionalContacts, setAdditionalContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useBreadcrumb(form.companyName || null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/clients/${id}`).then(({ data }) => {
      const c = data.client;
      setForm({
        companyName: c.companyName || '',
        industry: c.industry || '',
        contactName: c.contactName || '',
        contactPhone: c.contactPhone || '',
        contactEmail: c.contactEmail || '',
        address: c.address || '',
        status: c.status || 'Active',
        accountOwner: c.accountOwner?._id || c.accountOwner || '',
      });
      setAdditionalContacts((c.additionalContacts || []).map((c2) => ({ ...c2 })));
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load client'))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateContact(index, field, value) {
    setAdditionalContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function removeContact(index) {
    setAdditionalContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = { ...form, additionalContacts: additionalContacts.filter((c) => c.name.trim()) };
    if (!payload.accountOwner) delete payload.accountOwner;

    try {
      if (isEdit) {
        await api.patch(`/clients/${id}`, payload);
        navigate(`/clients/${id}`);
      } else {
        const { data } = await api.post('/clients', payload);
        navigate(`/clients/${data.client._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="form-page">
      <h2>{isEdit ? 'Edit Client' : 'Add Client'}</h2>
      {error && <div className="auth-error">{error}</div>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Company name *
            <input name="companyName" value={form.companyName} onChange={handleChange} required />
          </label>
          <label>
            Industry
            <input name="industry" value={form.industry} onChange={handleChange} />
          </label>
          <label>
            Primary contact name
            <input name="contactName" value={form.contactName} onChange={handleChange} />
          </label>
          <label>
            Primary contact phone
            <input name="contactPhone" value={form.contactPhone} onChange={handleChange} />
          </label>
          <label>
            Contact email
            <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} />
          </label>
          <label>
            Address
            <input name="address" value={form.address} onChange={handleChange} />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          {user?.role === 'super_admin' && (
            <label>
              Account owner
              <select name="accountOwner" value={form.accountOwner} onChange={handleChange}>
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

        <h3 className="form-subheading">Additional contacts</h3>
        <div className="contact-rows">
          {additionalContacts.map((c, i) => (
            <div className="contact-row" key={i}>
              <input placeholder="Name" value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} />
              <input
                placeholder="Designation"
                value={c.designation}
                onChange={(e) => updateContact(i, 'designation', e.target.value)}
              />
              <input placeholder="Phone" value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} />
              <button type="button" className="btn-secondary" onClick={() => removeContact(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => setAdditionalContacts((prev) => [...prev, emptyContact()])}>
            + Add contact
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save client'}
          </button>
        </div>
      </form>
    </div>
  );
}
