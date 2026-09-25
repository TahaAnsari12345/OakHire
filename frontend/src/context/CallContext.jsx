import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CallContext = createContext(null);

/** Broadcasts so any open page (candidate/client detail) can refetch its timeline. */
function broadcastCallLogged() {
  window.dispatchEvent(new CustomEvent('oakhire:call-logged'));
}

export function CallProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeCall, setActiveCall] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [inCallNotes, setInCallNotes] = useState('');
  const [pendingLogCall, setPendingLogCall] = useState(null);
  const [undisposedCalls, setUndisposedCalls] = useState([]);
  const tickRef = useRef(null);

  const refreshUndisposed = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/calls/undisposed');
      setUndisposedCalls(data.calls);
    } catch {
      // Non-critical — badge just stays at its last known count.
    }
  }, [user]);

  // Restore an in-progress call after a page refresh; the timer is always
  // computed from the server's startedAt, never from client-side state.
  useEffect(() => {
    if (!user) return;
    api
      .get('/calls/active')
      .then(({ data }) => {
        if (data.call) setActiveCall(data.call);
      })
      .catch(() => {});
    refreshUndisposed();
  }, [user, refreshUndisposed]);

  useEffect(() => {
    if (!activeCall) {
      setElapsedSeconds(0);
      return undefined;
    }
    function tick() {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(activeCall.startedAt).getTime()) / 1000)));
    }
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [activeCall]);

  /** @param {{calleeType: 'Candidate'|'Client', candidateId?, clientId?, applicationId?, jobRequirementId?, contactPhone?}} payload */
  async function startCall(payload) {
    try {
      const { data } = await api.post('/calls/initiate', payload);
      setActiveCall(data.call);
      setInCallNotes('');
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.call) {
        setActiveCall(err.response.data.call);
        showToast('Resumed your call already in progress', { tone: 'neutral' });
        return;
      }
      showToast(err.response?.data?.message || 'Could not start the call', { tone: 'danger' });
      throw err;
    }
  }

  async function endCall() {
    if (!activeCall) return;
    try {
      const { data } = await api.post(`/calls/${activeCall._id}/end`);
      setActiveCall(null);
      setPendingLogCall({ ...data.call, draftNotes: inCallNotes });
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not end the call', { tone: 'danger' });
    }
  }

  function openLogForm(call) {
    setPendingLogCall(call);
  }

  function closeLogForm() {
    // The CallLog stays completed-but-undisposed; nothing is deleted.
    setPendingLogCall(null);
    refreshUndisposed();
  }

  async function disposeCall(callId, payload) {
    const { data } = await api.put(`/call-logs/${callId}`, payload);
    setPendingLogCall(null);
    refreshUndisposed();
    broadcastCallLogged();
    showToast(data.followup ? 'Call logged — follow-up scheduled' : 'Call logged', { tone: 'success' });
    return data;
  }

  const value = {
    activeCall,
    elapsedSeconds,
    inCallNotes,
    setInCallNotes,
    startCall,
    endCall,
    pendingLogCall,
    openLogForm,
    closeLogForm,
    disposeCall,
    undisposedCalls,
    refreshUndisposed,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}
