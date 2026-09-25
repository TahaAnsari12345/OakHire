import { useCall } from '../context/CallContext';

/** Persistent reminder that a completed call still needs its outcome logged. */
export default function UndisposedCallsBadge() {
  const { undisposedCalls, openLogForm } = useCall();

  if (undisposedCalls.length === 0) return null;

  const count = undisposedCalls.length;

  return (
    <button
      type="button"
      className="undisposed-badge"
      onClick={() => openLogForm(undisposedCalls[0])}
      title="Log the outcome of your most recent unlogged call"
    >
      {count} call{count === 1 ? '' : 's'} need{count === 1 ? 's' : ''} details
    </button>
  );
}
