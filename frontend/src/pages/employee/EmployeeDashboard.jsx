import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import FollowupCompleteModal from '../../components/FollowupCompleteModal';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function groupFollowups(followups) {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = { overdue: [], dueToday: [], upcoming: [] };
  followups.forEach((f) => {
    const due = startOfDay(f.dueDate);
    if (due < today) groups.overdue.push(f);
    else if (due < tomorrow) groups.dueToday.push(f);
    else groups.upcoming.push(f);
  });
  groups.overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  groups.upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return groups;
}

function dueLabel(dueDate) {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return '1 day overdue';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function followupLinkAndLabel(followup) {
  if (followup.application) return { to: `/applications/${followup.application._id}`, label: followup.candidate?.name };
  if (followup.candidate) return { to: `/candidates/${followup.candidate._id}`, label: followup.candidate.name };
  if (followup.client) return { to: `/clients/${followup.client._id}`, label: `${followup.client.companyName} (client)` };
  return { to: '#', label: 'Unknown' };
}

function FollowupCard({ followup, tone, onMarkDone }) {
  const { to, label } = followupLinkAndLabel(followup);
  return (
    <div className={`followup-card tone-${tone}`}>
      <span className="followup-card-due mono">{dueLabel(followup.dueDate)}</span>
      <div className="followup-card-main">
        <Link to={to} className="followup-card-candidate">
          {label}
        </Link>
        <div className="followup-card-meta">
          <span>{followup.type}</span>
          {followup.notes && <span>· {followup.notes}</span>}
        </div>
      </div>
      {tone === 'overdue' && <span className="badge badge-overdue">Overdue</span>}
      <button type="button" onClick={() => onMarkDone(followup)}>
        Mark done
      </button>
    </div>
  );
}

function FollowupGroup({ title, rows, tone, onMarkDone }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="followup-group-header">
        <span className="followup-group-title">{title}</span>
        <span className="followup-group-count mono">{rows.length}</span>
      </div>
      <div className="followup-cards">
        {rows.map((f) => (
          <FollowupCard key={f._id} followup={f} tone={tone} onMarkDone={onMarkDone} />
        ))}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [followups, setFollowups] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFollowup, setActiveFollowup] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [{ data }, { data: summaryData }] = await Promise.all([
        api.get('/followups', { params: { status: 'Pending', limit: 100 } }),
        api.get('/app/dashboard-summary'),
      ]);
      setFollowups(data.data);
      setSummary(summaryData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupFollowups(followups);

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Today's Follow-ups</h2>
      </div>

      {summary && (
        <div className="stat-strip">
          <span>
            <strong className="mono">{summary.callsMadeToday}</strong> calls made today
          </span>
          <span>
            <strong className="mono">{summary.candidatesAssigned}</strong> candidates assigned
          </span>
          <span>
            <strong className="mono">{summary.interviewsThisWeek}</strong> interviews this week
          </span>
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}
      {isLoading && <div className="page-loading">Loading…</div>}

      {!isLoading && followups.length === 0 && (
        <div className="empty-state">
          <h2>All caught up</h2>
          <p>You have no pending follow-ups right now. New ones appear here as soon as they're scheduled.</p>
        </div>
      )}

      {!isLoading && followups.length > 0 && (
        <div className="followup-groups">
          <FollowupGroup title="Overdue" rows={groups.overdue} tone="overdue" onMarkDone={setActiveFollowup} />
          <FollowupGroup title="Due today" rows={groups.dueToday} tone="today" onMarkDone={setActiveFollowup} />
          <FollowupGroup title="Upcoming" rows={groups.upcoming} tone="upcoming" onMarkDone={setActiveFollowup} />
        </div>
      )}

      {activeFollowup && (
        <FollowupCompleteModal
          followup={activeFollowup}
          onClose={() => setActiveFollowup(null)}
          onCompleted={() => {
            setActiveFollowup(null);
            load();
          }}
        />
      )}
    </div>
  );
}
