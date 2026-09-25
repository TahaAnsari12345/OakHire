import { useState } from 'react';
import { useCall } from '../context/CallContext';

/**
 * The primary "Call" action, reused on candidate, client and job
 * requirement pages. Never silently disables — if a call can't be
 * started, it stays visible with a short inline reason instead.
 */
export default function CallButton({
  calleeType,
  candidateId,
  candidatePhone,
  clientId,
  clientContacts = [],
  applicationId,
  jobRequirementId,
  label = 'Call',
}) {
  const { activeCall, startCall } = useCall();
  const [selectedPhone, setSelectedPhone] = useState(clientContacts[0]?.phone || '');
  const [isStarting, setIsStarting] = useState(false);

  const blockedReason = (() => {
    if (activeCall) return 'Finish your current call first';
    if (calleeType === 'Candidate' && !candidatePhone) return 'No phone number on file';
    if (calleeType === 'Client' && clientContacts.length === 0) return 'No contact phone number on file';
    return null;
  })();

  async function handleClick() {
    setIsStarting(true);
    try {
      await startCall({
        calleeType,
        candidateId,
        clientId,
        applicationId,
        jobRequirementId,
        contactPhone: calleeType === 'Client' ? selectedPhone : undefined,
      });
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="call-button-group">
      {calleeType === 'Client' && clientContacts.length > 1 && (
        <select
          value={selectedPhone}
          onChange={(e) => setSelectedPhone(e.target.value)}
          aria-label="Contact to call"
          disabled={Boolean(blockedReason)}
        >
          {clientContacts.map((c) => (
            <option key={c.phone} value={c.phone}>
              {c.name} {c.designation ? `(${c.designation})` : ''}
            </option>
          ))}
        </select>
      )}
      <button type="button" className="call-button" onClick={handleClick} disabled={Boolean(blockedReason) || isStarting}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z" />
        </svg>
        {isStarting ? 'Starting…' : label}
      </button>
      {blockedReason && <span className="call-button-reason">{blockedReason}</span>}
    </div>
  );
}
