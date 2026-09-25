import { useState } from 'react';
import Modal from './common/Modal';
import api from '../api/axios';

export default function AddEmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/admin/employees', form);
      setCreated(data);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (created) {
    return (
      <Modal title="Employee created" onClose={onClose}>
        <p className="form-hint">
          Share these credentials with {created.employee.name} — the temporary password is shown once and won't be
          retrievable after you close this dialog.
        </p>
        <div className="credential-box">
          <div>
            <span>Email</span>
            <strong className="mono">{created.employee.email}</strong>
          </div>
          <div>
            <span>Temporary password</span>
            <strong className="mono">{created.tempPassword}</strong>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Add employee" onClose={onClose}>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Full name *
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email *
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
