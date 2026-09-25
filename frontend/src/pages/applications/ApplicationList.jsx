import { Link } from 'react-router-dom';
import useApiList from '../../hooks/useApiList';
import Pagination from '../../components/common/Pagination';
import { useFunnelStageOptions } from '../../hooks/useOptions';

export default function ApplicationList() {
  const { data, pagination, page, setPage, filters, updateFilters, isLoading, error } = useApiList('/applications');
  const stages = useFunnelStageOptions();

  function handleFilterChange(e) {
    updateFilters({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Applications</h2>
        <Link to="/applications/new" className="btn-link">
          + Add Application
        </Link>
      </div>

      <div className="filter-bar">
        <select name="funnelStage" value={filters.funnelStage || ''} onChange={handleFilterChange}>
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Job Requirement</th>
            <th>Stage</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={4}>Loading…</td>
            </tr>
          )}
          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={4}>No applications found.</td>
            </tr>
          )}
          {data.map((app) => (
            <tr key={app._id}>
              <td data-label="Candidate">
                <Link to={`/applications/${app._id}`}>{app.candidate?.name || '—'}</Link>
              </td>
              <td data-label="Job requirement">{app.jobRequirement?.title || '—'}</td>
              <td data-label="Stage">{app.funnelStage?.name || '—'}</td>
              <td data-label="Owner">{app.assignedTo?.name || '—'}</td>
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
