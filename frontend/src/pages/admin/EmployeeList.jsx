import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import AddEmployeeModal from '../../components/AddEmployeeModal';

export default function EmployeeList() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/employees');
      setRows(data.rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Employees</h2>
        <button type="button" onClick={() => setShowAddModal(true)}>
          + Add employee
        </button>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Candidates</th>
            <th>Active applications</th>
            <th>Pending follow-ups</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6}>Loading…</td>
            </tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={6}>No employees yet.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.employee.id}>
              <td data-label="Name">
                <Link to={`/admin/employees/${row.employee.id}`}>{row.employee.name}</Link>
              </td>
              <td data-label="Email">{row.employee.email}</td>
              <td data-label="Candidates" className="mono">
                {row.assignedCandidates}
              </td>
              <td data-label="Active applications" className="mono">
                {row.activeApplications}
              </td>
              <td data-label="Pending follow-ups" className="mono">
                {row.pendingFollowups}
              </td>
              <td data-label="Status">
                <span className={`badge ${row.employee.isActive ? 'badge-success' : 'badge-closed'}`}>
                  {row.employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            load();
          }}
        />
      )}
    </div>
  );
}
