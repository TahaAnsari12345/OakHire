import { useEffect, useMemo, useState } from 'react';
import { fetchDispositionTypes } from '../services/callLogs';
import { TYPES as FOLLOWUP_TYPES } from '../constants/followup';

/**
 * Disposition dropdown (filtered by calleeType) + notes + the conditional
 * next-follow-up block. Shared by the dispose-call flow and "Add past call".
 * Lifts its state up via onChange so the parent form owns submission.
 */
export default function DispositionFields({ calleeType, value, onChange }) {
  const [dispositionTypes, setDispositionTypes] = useState([]);

  useEffect(() => {
    fetchDispositionTypes(calleeType).then(setDispositionTypes);
  }, [calleeType]);

  const selected = useMemo(
    () => dispositionTypes.find((d) => d._id === value.disposition),
    [dispositionTypes, value.disposition]
  );
  const requiresFollowup = Boolean(selected?.requiresFollowup);

  function set(field, val) {
    onChange({ ...value, [field]: val });
  }

  return (
    <>
      <label>
        Disposition *
        <select value={value.disposition} onChange={(e) => set('disposition', e.target.value)} required>
          <option value="">— Select disposition —</option>
          {dispositionTypes.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Notes
        <textarea value={value.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
      </label>

      {requiresFollowup && (
        <>
          <p className="form-hint">&ldquo;{selected.name}&rdquo; requires a next follow-up.</p>
          <label>
            Next follow-up date *
            <input
              type="date"
              value={value.nextFollowupDate}
              onChange={(e) => set('nextFollowupDate', e.target.value)}
              required
            />
          </label>
          <label>
            Follow-up type
            <select value={value.nextFollowupType} onChange={(e) => set('nextFollowupType', e.target.value)}>
              {FOLLOWUP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            Follow-up notes
            <input value={value.nextFollowupNotes} onChange={(e) => set('nextFollowupNotes', e.target.value)} />
          </label>
        </>
      )}
    </>
  );
}

export function emptyDispositionValue() {
  return {
    disposition: '',
    notes: '',
    nextFollowupDate: '',
    nextFollowupType: 'Call',
    nextFollowupNotes: '',
  };
}

export function buildNextFollowupPayload(value) {
  if (!value.nextFollowupDate) return undefined;
  return { dueDate: value.nextFollowupDate, type: value.nextFollowupType, notes: value.nextFollowupNotes };
}
