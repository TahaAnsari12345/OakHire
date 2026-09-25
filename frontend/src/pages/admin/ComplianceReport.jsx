import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function ComplianceReport() {
  const [period, setPeriod] = useState('week');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    api
      .get('/followups/compliance', { params: { period } })
      .then(({ data }) => {
        if (!cancelled) setRows(data.rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load compliance report');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  async function handleRunCron() {
    setIsRunningCron(true);
    setCronResult(null);
    try {
      const { data } = await api.post('/admin/run-followup-check');
      setCronResult(data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run follow-up check');
    } finally {
      setIsRunningCron(false);
    }
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Follow-up Compliance</h2>
        <div className="form-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <button type="button" onClick={handleRunCron} disabled={isRunningCron}>
            {isRunningCron ? 'Running…' : 'Run follow-up check now'}
          </button>
        </div>
      </div>

      {cronResult && (
        <div className="form-hint">
          Cron run complete — {cronResult.missedCount} follow-up(s) marked Missed, {cronResult.escalatedCount} escalated
          to admin notifications.
        </div>
      )}
      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Due this {period}</th>
            <th>Completed on time</th>
            <th>Compliance %</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4}>Loading…</td>
            </tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={4}>No employees found.</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.employee.id}>
              <td data-label="Employee">{row.employee.name}</td>
              <td data-label={`Due this week`} className="mono">
                {row.totalDue}
              </td>
              <td data-label="Completed on time" className="mono">
                {row.completedOnTime}
              </td>
              <td data-label="Compliance %" className="mono">
                {row.percentage === null ? '—' : `${row.percentage}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
