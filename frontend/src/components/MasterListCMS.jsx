import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from './common/Modal';

function emptyValues(fields) {
  const values = {};
  fields.forEach((f) => {
    values[f.name] = f.type === 'checkbox' ? false : f.type === 'number' ? 0 : '';
  });
  return values;
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-row">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  return (
    <label>
      {field.label}
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        required={field.required}
      />
    </label>
  );
}

export default function MasterListCMS({ title, description, endpoint, listKey, fields }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState(emptyValues(fields));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(endpoint);
      setItems(data[listKey]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load list');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, listKey]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingItem(null);
    setFormValues(emptyValues(fields));
    setShowModal(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    const values = {};
    fields.forEach((f) => {
      values[f.name] = item[f.name] ?? (f.type === 'checkbox' ? false : '');
    });
    setFormValues(values);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      if (editingItem) {
        await api.put(`${endpoint}/${editingItem._id}`, formValues);
      } else {
        await api.post(endpoint, formValues);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`${endpoint}/${item._id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <div>
          <h2>{title}</h2>
          {description && <p className="candidate-header-sub">{description}</p>}
        </div>
        <button type="button" onClick={openAdd}>
          + Add
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.name}>{f.label}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={fields.length + 1}>Loading…</td>
            </tr>
          )}
          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={fields.length + 1}>Nothing here yet.</td>
            </tr>
          )}
          {items.map((item) => (
            <tr key={item._id}>
              {fields.map((f) => (
                <td key={f.name} data-label={f.label}>
                  {f.type === 'checkbox' ? (item[f.name] ? 'Yes' : 'No') : item[f.name]}
                </td>
              ))}
              <td data-label="">
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="btn-danger" onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <Modal title={editingItem ? `Edit ${title}` : `Add ${title}`} onClose={() => setShowModal(false)}>
          <form className="entity-form" onSubmit={handleSubmit}>
            {fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={formValues[f.name]}
                onChange={(v) => setFormValues({ ...formValues, [f.name]: v })}
              />
            ))}
            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
