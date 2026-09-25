import { useCall } from '../context/CallContext';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveCallPanel() {
  const { activeCall, elapsedSeconds, inCallNotes, setInCallNotes, endCall } = useCall();

  if (!activeCall) return null;

  const name = activeCall.contactName || activeCall.candidate?.name || activeCall.client?.companyName || 'Unknown';
  const phone = activeCall.contactPhone || activeCall.candidate?.phone || '';

  return (
    <div className="call-panel" role="dialog" aria-label={`Active call with ${name}`}>
      <div className="call-panel-main">
        <div className="call-panel-status">
          <span className="call-pulse" aria-hidden="true" />
          <span>Connected</span>
        </div>
        <div className="call-panel-identity">
          <div className="avatar-circle call-panel-avatar">{initials(name)}</div>
          <div>
            <div className="call-panel-name">{name}</div>
            <div className="call-panel-phone mono">{phone}</div>
          </div>
        </div>
        <div className="call-panel-timer mono">{formatTimer(elapsedSeconds)}</div>
      </div>
      <textarea
        className="call-panel-notes"
        placeholder="Jot notes during the call…"
        value={inCallNotes}
        onChange={(e) => setInCallNotes(e.target.value)}
        rows={2}
      />
      <button type="button" className="call-panel-end" onClick={endCall}>
        End call
      </button>
    </div>
  );
}
