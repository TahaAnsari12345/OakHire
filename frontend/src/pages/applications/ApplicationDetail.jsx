import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { useFunnelStageOptions } from '../../hooks/useOptions';
import StageChangeModal from '../../components/StageChangeModal';
import CallButton from '../../components/CallButton';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function stageBadgeClass(stage) {
  if (!stage?.isTerminal) return 'stage-badge';
  if (/joined/i.test(stage.name)) return 'stage-badge stage-terminal stage-joined';
  if (/reject|drop/i.test(stage.name)) return 'stage-badge stage-terminal stage-rejected';
  return 'stage-badge stage-terminal';
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stages = useFunnelStageOptions();

  const [application, setApplication] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStageModal, setShowStageModal] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [{ data: appData }, { data: followupData }, { data: callLogData }] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get('/followups', { params: { application: id, limit: 50 } }),
        api.get('/call-logs', { params: { application: id, limit: 50 } }),
      ]);
      setApplication(appData.application);
      setFollowups(followupData.data);
      setCallLogs(callLogData.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useBreadcrumb(application?.candidate?.name);

  useEffect(() => {
    window.addEventListener('oakhire:call-logged', load);
    return () => window.removeEventListener('oakhire:call-logged', load);
  }, [load]);

  async function handleDelete() {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    try {
      await api.delete(`/applications/${id}`);
      navigate('/applications');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application');
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!application) return null;

  const isTerminal = application.status !== 'Active';

  return (
    <div className="detail-page">
      <div className="list-header">
        <h2>{application.candidate?.name}</h2>
        <div className="form-actions">
          <CallButton
            calleeType="Candidate"
            candidateId={application.candidate?._id}
            candidatePhone={application.candidate?.phone}
            applicationId={application._id}
          />
          {!isTerminal && (
            <button type="button" className="btn-secondary" onClick={() => setShowStageModal(true)}>
              Move to next stage
            </button>
          )}
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Application</h3>
          <dl>
            <dt>Job requirement</dt>
            <dd>
              <Link to={`/job-requirements/${application.jobRequirement?._id}`}>
                {application.jobRequirement?.title}
              </Link>
              {application.jobRequirement?.client?.companyName && ` — ${application.jobRequirement.client.companyName}`}
            </dd>
            <dt>Current stage</dt>
            <dd>
              <span className={stageBadgeClass(application.funnelStage)}>{application.funnelStage?.name}</span>
            </dd>
            <dt>Status</dt>
            <dd>{application.status}</dd>
            {application.rejectionReason && (
              <>
                <dt>Rejection reason</dt>
                <dd>{application.rejectionReason}</dd>
              </>
            )}
            {application.joiningDate && (
              <>
                <dt>Joining date</dt>
                <dd>{formatDate(application.joiningDate)}</dd>
              </>
            )}
            <dt>Owner</dt>
            <dd>{application.assignedTo?.name}</dd>
            <dt>Notes</dt>
            <dd>{application.notes || '—'}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Candidate</h3>
          <dl>
            <dt>Phone</dt>
            <dd>{application.candidate?.phone}</dd>
            <dt>Email</dt>
            <dd>{application.candidate?.email || '—'}</dd>
            <dt>Experience</dt>
            <dd>{application.candidate?.totalExperience ?? 0} yrs</dd>
          </dl>
        </div>
      </div>

      <div className="detail-card">
        <h3>Follow-up history</h3>
        {followups.length === 0 && <p className="form-hint">No follow-ups yet.</p>}
        {followups.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Due date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((f) => (
                <tr key={f._id}>
                  <td data-label="Due date">{formatDate(f.dueDate)}</td>
                  <td data-label="Type">{f.type}</td>
                  <td data-label="Status">{f.status}</td>
                  <td data-label="Notes">{f.outcomeNotes || f.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="detail-card">
        <h3>Call history</h3>
        {callLogs.length === 0 && <p className="form-hint">No calls logged yet.</p>}
        {callLogs.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Disposition</th>
                <th>Duration</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map((c) => (
                <tr key={c._id}>
                  <td data-label="Date">{formatDate(c.createdAt)}</td>
                  <td data-label="Employee">{c.employee?.name || '—'}</td>
                  <td data-label="Disposition">{c.disposition?.name || (c.callStatus === 'completed' ? 'Undisposed' : '—')}</td>
                  <td data-label="Duration">{c.durationSeconds || 0}s</td>
                  <td data-label="Notes">{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showStageModal && (
        <StageChangeModal
          application={application}
          stages={stages}
          onClose={() => setShowStageModal(false)}
          onChanged={() => {
            setShowStageModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
