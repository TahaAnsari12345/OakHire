import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import CallButton from '../../components/CallButton';
import ActivityTimeline from '../../components/ActivityTimeline';
import LogActivityModal from '../../components/LogActivityModal';
import OverflowMenu from '../../components/common/OverflowMenu';
import CopyablePhone from '../../components/common/CopyablePhone';
import { useBreadcrumb } from '../../context/BreadcrumbContext';

import { callableContacts } from '../../utils/clientContacts';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [jobRequirements, setJobRequirements] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [{ data: clientData }, { data: jrData }, { data: timelineData }] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get('/job-requirements', { params: { client: id, limit: 50 } }),
        api.get(`/clients/${id}/timeline`),
      ]);
      setClient(clientData.client);
      setJobRequirements(jrData.data);
      setEvents(timelineData.events);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load client');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useBreadcrumb(client?.companyName);

  useEffect(() => {
    window.addEventListener('oakhire:call-logged', load);
    return () => window.removeEventListener('oakhire:call-logged', load);
  }, [load]);

  async function handleDelete() {
    if (!window.confirm('Delete this client? This cannot be undone.')) return;
    try {
      await api.delete(`/clients/${id}`);
      navigate('/clients');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client');
    }
  }

  if (isLoading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="auth-error">{error}</div>;
  if (!client) return null;

  const contacts = callableContacts(client);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="candidate-header">
          <div className="avatar-circle avatar-lg">{initials(client.companyName)}</div>
          <div className="candidate-header-meta">
            <h2>{client.companyName}</h2>
            <div className="candidate-header-facts">
              <CopyablePhone phone={client.contactPhone} />
              <span>{client.contactName || 'no primary contact'}</span>
              <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-closed'}`}>{client.status}</span>
            </div>
          </div>
        </div>
        <div className="detail-header-actions">
          <CallButton calleeType="Client" clientId={client._id} clientContacts={contacts} />
          <button type="button" className="btn-secondary" onClick={() => setShowActivityModal(true)}>Log activity</button>
          <Link to={`/clients/${id}/edit`} className="btn-link">
            Edit
          </Link>
          <OverflowMenu
            items={[
              { label: 'Delete client', danger: true, onClick: handleDelete },
            ]}
          />
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Profile</h3>
          <dl>
            <dt>Industry</dt>
            <dd>{client.industry || '—'}</dd>
            <dt>Address</dt>
            <dd>{client.address || '—'}</dd>
            <dt>Owner</dt>
            <dd>{client.accountOwner?.name || '—'}</dd>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Contacts</h3>
          <ul className="plain-list">
            {contacts.length === 0 && <p className="form-hint">No contact phone numbers on file.</p>}
            {contacts.map((c) => (
              <li key={c.phone} className="app-row">
                <span>
                  {c.name} {c.designation && `· ${c.designation}`}
                </span>
                <span className="mono">{c.phone}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="detail-card">
          <h3>Job Requirements</h3>
          {jobRequirements.length === 0 && <p className="form-hint">No open requirements yet.</p>}
          {jobRequirements.length > 0 && (
            <ul className="plain-list">
              {jobRequirements.map((jr) => (
                <li key={jr._id} className="app-row">
                  <Link to={`/job-requirements/${jr._id}`}>{jr.title}</Link>
                  <span className="badge badge-neutral">{jr.status}</span>
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

      {showActivityModal && (
        <LogActivityModal
          calleeType="Client"
          entityId={client._id}
          related={jobRequirements}
          onClose={() => setShowActivityModal(false)}
          onLogged={() => {
            setShowActivityModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
