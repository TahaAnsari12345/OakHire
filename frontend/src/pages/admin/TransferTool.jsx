import { useEffect, useState } from 'react';
import api from '../../api/axios';
import useEmployees from '../../hooks/useEmployees';

export default function TransferTool() {
  const employees = useEmployees();

  const [fromEmployee, setFromEmployee] = useState('');
  const [toEmployee, setToEmployee] = useState('');
  const [applications, setApplications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!fromEmployee) {
      setApplications([]);
      return;
    }
    setIsLoading(true);
    setMessage('');
    api
      .get('/applications', { params: { assignedTo: fromEmployee, limit: 100 } })
      .then(({ data }) => {
        setApplications(data.data);
        setSelectedIds([]);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load applications'))
      .finally(() => setIsLoading(false));
  }, [fromEmployee]);

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleTransferSelected() {
    if (selectedIds.length === 0) return;
    await runTransfer(selectedIds);
  }

  async function handleTransferAll() {
    if (!window.confirm(`Transfer ALL of this employee's applications to the selected employee?`)) return;
    await runTransfer(null);
  }

  async function runTransfer(applicationIds) {
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const payload = { fromEmployee, toEmployee };
      if (applicationIds) payload.applicationIds = applicationIds;
      const { data } = await api.post('/admin/transfer', payload);
      setMessage(`Transferred ${data.transferredCount} application(s).`);
      const { data: refreshed } = await api.get('/applications', { params: { assignedTo: fromEmployee, limit: 100 } });
      setApplications(refreshed.data);
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const otherEmployees = employees.filter((e) => e._id !== fromEmployee);

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Transfer candidates</h2>
      </div>

      <div className="filter-bar">
        <select value={fromEmployee} onChange={(e) => setFromEmployee(e.target.value)}>
          <option value="">— From employee —</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
        <select value={toEmployee} onChange={(e) => setToEmployee(e.target.value)} disabled={!fromEmployee}>
          <option value="">— To employee —</option>
          {otherEmployees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleTransferAll}
          disabled={!fromEmployee || !toEmployee || applications.length === 0 || isSubmitting}
        >
          Transfer all
        </button>
        <button type="button" onClick={handleTransferSelected} disabled={!toEmployee || selectedIds.length === 0 || isSubmitting}>
          Transfer selected ({selectedIds.length})
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="form-hint">{message}</div>}

      {!fromEmployee && <p className="form-hint">Pick an employee to see their applications.</p>}

      {fromEmployee && (
        <table className="data-table">
          <thead>
            <tr>
              <th />
              <th>Candidate</th>
              <th>Job requirement</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4}>Loading…</td>
              </tr>
            )}
            {!isLoading && applications.length === 0 && (
              <tr>
                <td colSpan={4}>No applications for this employee.</td>
              </tr>
            )}
            {applications.map((a) => (
              <tr key={a._id}>
                <td data-label="">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a._id)}
                    onChange={() => toggleSelected(a._id)}
                  />
                </td>
                <td data-label="Candidate">{a.candidate?.name}</td>
                <td data-label="Job requirement">{a.jobRequirement?.title}</td>
                <td data-label="Stage">{a.funnelStage?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
