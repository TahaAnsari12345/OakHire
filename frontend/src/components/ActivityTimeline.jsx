import { useMemo, useState } from 'react';
import { formatRelativeTime, formatFullDateTime } from '../utils/formatRelativeTime';

const FILTERS = ['All', 'Calls', 'Follow-ups'];

function stageWordClass(name) {
  if (/joined/i.test(name || '')) return 'text-success';
  if (/reject|drop/i.test(name || '')) return 'text-closed';
  return '';
}

function CallRow({ event }) {
  const toneClass = event.disposition ? `dot-tone-${event.disposition.tone}` : 'dot-tone-neutral';
  return (
    <li className="timeline-item">
      <span className={`timeline-dot dot-call ${toneClass}`} />
      <div className="timeline-header">
        <span className="timeline-label label-call">Call{event.calleeType === 'Client' ? ' · Client' : ''}</span>
        <span className="timeline-time" title={formatFullDateTime(event.timestamp)}>
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>
      <div className="timeline-body">
        <p>
          {event.employee || 'Someone'}
          {event.undisposed ? (
            <span className="badge badge-due-today" style={{ marginLeft: 8 }}>
              Undisposed
            </span>
          ) : (
            <>
              {' — '}
              <strong>{event.disposition?.name}</strong>
            </>
          )}
          {event.durationSeconds ? ` (${event.durationSeconds}s)` : ''}
        </p>
        {event.notes && <p className="timeline-notes">{event.notes}</p>}
      </div>
    </li>
  );
}

function FollowupRow({ event }) {
  return (
    <li className="timeline-item">
      <span className={`timeline-dot dot-followup ${event.isOverdue ? 'dot-tone-danger' : ''}`} />
      <div className="timeline-header">
        <span className="timeline-label label-followup">Follow-up</span>
        <span className="timeline-time" title={formatFullDateTime(event.timestamp)}>
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>
      <div className="timeline-body">
        <p>
          {event.followupType} — <strong>{event.status}</strong>
          {event.dueDate && ` (due ${new Date(event.dueDate).toLocaleDateString()})`}
        </p>
        {(event.outcomeNotes || event.notes) && <p className="timeline-notes">{event.outcomeNotes || event.notes}</p>}
      </div>
    </li>
  );
}

function StageChangeRow({ event }) {
  const toClass = stageWordClass(event.to);
  return (
    <li className="timeline-item">
      <span className={`timeline-dot dot-stage ${toClass === 'text-success' ? 'dot-tone-success' : toClass === 'text-closed' ? 'dot-tone-closed' : ''}`} />
      <div className="timeline-header">
        <span className="timeline-label label-stage">Stage change</span>
        <span className="timeline-time" title={formatFullDateTime(event.timestamp)}>
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>
      <div className="timeline-body">
        <p>
          {event.actor || 'Someone'} moved this from {event.from || '—'} to <span className={toClass}>{event.to || '—'}</span>
        </p>
      </div>
    </li>
  );
}

export default function ActivityTimeline({ events }) {
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    if (filter === 'Calls') return events.filter((e) => e.type === 'call');
    if (filter === 'Follow-ups') return events.filter((e) => e.type === 'followup');
    return events;
  }, [events, filter]);

  return (
    <div>
      <div className="timeline-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={f === filter ? '' : 'btn-secondary'}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="timeline-empty">No activity yet — calls and follow-ups will appear here.</p>}

      {filtered.length > 0 && (
        <ul className="timeline-list">
          {filtered.map((event) => {
            if (event.type === 'call') return <CallRow key={event.id} event={event} />;
            if (event.type === 'followup') return <FollowupRow key={event.id} event={event} />;
            return <StageChangeRow key={event.id} event={event} />;
          })}
        </ul>
      )}
    </div>
  );
}
