import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function EmployeeProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/employees/${id}`);
      setProfile(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employee');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive() {
    setIsSaving(true);
    try {
      await api.put(`/admin/employees/${id}`, { isActive: !profile.employee.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!profile) return null;

  const { employee, assignedCandidates, callsMade, openJobRequirements, followupCompliancePercent } = profile;

  return (
    <div className="detail-page">
      <div className="list-header">
        <div className="candidate-header">
          <div className="avatar-circle">
            {employee.name
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="candidate-header-meta">
            <h2>{employee.name}</h2>
            <span className="candidate-header-sub">{employee.email}</span>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={toggleActive} disabled={isSaving}>
            {employee.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Open job requirements</span>
          <span className="kpi-value mono">{openJobRequirements}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Calls made (all time)</span>
          <span className="kpi-value mono">{callsMade}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Follow-up compliance</span>
          <span className="kpi-value mono">{followupCompliancePercent === null ? '—' : `${followupCompliancePercent}%`}</span>
        </div>
      </div>

      <div className="detail-card">
        <h3>Assigned candidates</h3>
        {assignedCandidates.length === 0 && <p className="form-hint">No candidates assigned yet.</p>}
        {assignedCandidates.length > 0 && (
          <ul className="plain-list">
            {assignedCandidates.map((c) => (
              <li key={c._id} className="app-row">
                <Link to={`/candidates/${c._id}`}>{c.name}</Link>
                <span className="candidate-header-sub">{c.source}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
