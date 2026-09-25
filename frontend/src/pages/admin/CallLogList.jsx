import useApiList from '../../hooks/useApiList';
import Pagination from '../../components/common/Pagination';
import { useDispositionOptions } from '../../hooks/useOptions';
import useEmployees from '../../hooks/useEmployees';

function calleeName(row) {
  return row.candidate?.name || row.client?.companyName || '—';
}

function toCsv(rows) {
  const header = ['Date', 'Callee', 'Type', 'Employee', 'Disposition', 'Duration (s)', 'Notes'];
  const lines = rows.map((r) =>
    [
      new Date(r.startedAt || r.createdAt).toLocaleString(),
      calleeName(r),
      r.calleeType,
      r.employee?.name || '',
      r.disposition?.name || 'Undisposed',
      r.durationSeconds || 0,
      (r.notes || '').replace(/"/g, '""'),
    ]
      .map((v) => `"${v}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

export default function CallLogList() {
  const { data, pagination, page, setPage, filters, updateFilters, isLoading, error } = useApiList('/call-logs');
  const dispositionTypes = useDispositionOptions();
  const employees = useEmployees();

  function handleFilterChange(e) {
    updateFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function handleExport() {
    // Client-side export of the current page for now — a proper
    // server-streamed CSV across the full filtered set arrives in Stage 9.
    const csv = toCsv(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'call-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Call Logs</h2>
        <button type="button" onClick={handleExport} disabled={data.length === 0}>
          Export CSV (this page)
        </button>
      </div>

      <div className="filter-bar">
        <select name="employee" value={filters.employee || ''} onChange={handleFilterChange}>
          <option value="">All employees</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
        <select name="calleeType" value={filters.calleeType || ''} onChange={handleFilterChange}>
          <option value="">Candidates + Clients</option>
          <option value="Candidate">Candidates only</option>
          <option value="Client">Clients only</option>
        </select>
        <select name="disposition" value={filters.disposition || ''} onChange={handleFilterChange}>
          <option value="">All dispositions</option>
          {dispositionTypes.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <input type="date" name="from" value={filters.from || ''} onChange={handleFilterChange} />
        <input type="date" name="to" value={filters.to || ''} onChange={handleFilterChange} />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Callee</th>
            <th>Employee</th>
            <th>Disposition</th>
            <th>Duration</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6}>Loading…</td>
            </tr>
          )}
          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={6}>No call logs found.</td>
            </tr>
          )}
          {data.map((c) => (
            <tr key={c._id}>
              <td data-label="Date">{new Date(c.startedAt || c.createdAt).toLocaleString()}</td>
              <td data-label="Callee">
                {calleeName(c)} <span className="candidate-header-sub">({c.calleeType})</span>
              </td>
              <td data-label="Employee">{c.employee?.name || '—'}</td>
              <td data-label="Disposition">
                {c.disposition?.name || <span className="badge badge-due-today">Undisposed</span>}
              </td>
              <td data-label="Duration" className="mono">
                {c.durationSeconds || 0}s
              </td>
              <td data-label="Notes">{c.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
