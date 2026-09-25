import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import CallButton from '../../components/CallButton';
import ActivityTimeline from '../../components/ActivityTimeline';
import AddPastCallModal from '../../components/AddPastCallModal';
import OverflowMenu from '../../components/common/OverflowMenu';
import CopyablePhone from '../../components/common/CopyablePhone';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [needsFollowup, setNeedsFollowup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPastCallModal, setShowPastCallModal] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [{ data: candidateData }, { data: applicationData }, { data: timelineData }] = await Promise.all([
        api.get(`/candidates/${id}`),
        api.get('/applications', { params: { candidate: id, limit: 50 } }),
        api.get(`/candidates/${id}/timeline`),
      ]);
      setCandidate(candidateData.candidate);
      setApplications(applicationData.data);
      setEvents(timelineData.events);
      setNeedsFollowup(timelineData.needsFollowup);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useBreadcrumb(candidate?.name);

  // A call logged from the global call panel (which may have been opened
  // from a different page) should refresh this timeline too.
  useEffect(() => {
    window.addEventListener('oakhire:call-logged', load);
    return () => window.removeEventListener('oakhire:call-logged', load);
  }, [load]);

  async function handleDelete() {
    if (!window.confirm('Delete this candidate? This cannot be undone.')) return;
    try {
      await api.delete(`/candidates/${id}`);
      navigate('/candidates');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete candidate');
    }
  }

  if (isLoading) return <DetailSkeleton />;
  if (error) return <div className="auth-error">{error}</div>;
  if (!candidate) return null;

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="candidate-header">
          <div className="avatar-circle avatar-lg">{initials(candidate.name)}</div>
          <div className="candidate-header-meta">
            <h2>{candidate.name}</h2>
            <div className="candidate-header-facts">
              <CopyablePhone phone={candidate.phone} />
              <span>{candidate.email || 'no email'}</span>
              <span>{candidate.assignedTo?.name || 'Unassigned'}</span>
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <CallButton calleeType="Candidate" candidateId={candidate._id} candidatePhone={candidate.phone} />
          <Link to={`/candidates/${id}/edit`} className="btn-link">
            Edit
          </Link>
          <OverflowMenu
            items={[
              { label: 'Add past call', onClick: () => setShowPastCallModal(true) },
              { label: 'Delete candidate', danger: true, onClick: handleDelete },
            ]}
          />
        </div>
      </div>

      {needsFollowup && (
        <div className="warning-banner">
          <span>No next follow-up scheduled for this candidate.</span>
          <Link to="/app" className="btn-link">
            Schedule follow-up
          </Link>
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Profile</h3>
          <dl>
            <dt>Location</dt>
            <dd>{candidate.location || '—'}</dd>
            <dt>Experience</dt>
            <dd className="mono">{candidate.totalExperience ?? 0} yrs</dd>
            <dt>Current company</dt>
            <dd>{candidate.currentCompany || '—'}</dd>
            <dt>Skills</dt>
            <dd>{(candidate.skills || []).join(', ') || '—'}</dd>
            <dt>Source</dt>
            <dd>{candidate.source}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Applications</h3>
          {applications.length === 0 && <p className="form-hint">Not linked to any job requirement yet.</p>}
          {applications.length > 0 && (
            <ul className="plain-list">
              {applications.map((a) => (
                <li key={a._id} className="app-row">
                  <Link to={`/applications/${a._id}`}>{a.jobRequirement?.title}</Link>
                  <span className="badge badge-neutral">{a.funnelStage?.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="detail-card">
        <h3>Timeline</h3>
        <ActivityTimeline events={events} />
      </div>

      {showPastCallModal && (
        <AddPastCallModal
          calleeType="Candidate"
          candidateId={candidate._id}
          related={applications}
          onClose={() => setShowPastCallModal(false)}
          onLogged={() => {
            setShowPastCallModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail-page">
      <div className="skeleton skeleton-header" />
      <div className="detail-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
      <div className="skeleton skeleton-card" />
    </div>
  );
}
