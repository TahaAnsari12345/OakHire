import { useEffect, useState } from 'react';
import api from '../../api/axios';
import KpiCard from '../../components/KpiCard';
import LeaderboardWidget from '../../components/LeaderboardWidget';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard-summary')
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!summary) return null;

  const leaderboardRows = summary.leaderboard
    .filter((row) => row.employee)
    .map((row) => ({ id: row.employee.id, name: row.employee.name, value: row.joinings }));

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Company overview</h2>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Active candidates" value={summary.totalActiveCandidates} to="/candidates" />
        <KpiCard label="Open job requirements" value={summary.totalOpenJobRequirements} to="/job-requirements" />
        <KpiCard label="Joinings this week" value={summary.joiningsThisWeek} tone="success" />
        <KpiCard
          label="Overdue follow-ups"
          value={summary.overdueFollowups}
          tone={summary.overdueFollowups > 0 ? 'overdue' : 'neutral'}
        />
      </div>

      <LeaderboardWidget title="Top employees — joinings this month" rows={leaderboardRows} valueLabel="joinings" />
    </div>
  );
}
