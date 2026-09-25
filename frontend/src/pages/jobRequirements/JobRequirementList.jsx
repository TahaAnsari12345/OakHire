import { Link } from 'react-router-dom';
import useApiList from '../../hooks/useApiList';
import Pagination from '../../components/common/Pagination';

export default function JobRequirementList() {
  const { data, pagination, page, setPage, filters, updateFilters, isLoading, error } = useApiList('/job-requirements');

  function handleFilterChange(e) {
    updateFilters({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Job Requirements</h2>
        <Link to="/job-requirements/new" className="btn-link">
          + Add Requirement
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          placeholder="Search title, skills…"
          value={filters.search || ''}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status || ''} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="Open">Open</option>
          <option value="On-hold">On-hold</option>
          <option value="Closed">Closed</option>
        </select>
        <select name="priority" value={filters.priority || ''} onChange={handleFilterChange}>
          <option value="">All priorities</option>
          <option value="Hot">Hot</option>
          <option value="Warm">Warm</option>
          <option value="Cold">Cold</option>
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Client</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Openings</th>
            <th>Owner</th>
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
              <td colSpan={6}>No job requirements found.</td>
            </tr>
          )}
          {data.map((jr) => (
            <tr key={jr._id}>
              <td data-label="Title">
                <Link to={`/job-requirements/${jr._id}`}>{jr.title}</Link>
              </td>
              <td data-label="Client">{jr.client?.companyName || '—'}</td>
              <td data-label="Priority">{jr.priority}</td>
              <td data-label="Status">{jr.status}</td>
              <td data-label="Openings" className="mono">
                {jr.openings}
              </td>
              <td data-label="Owner">{jr.assignedTo?.name || '—'}</td>
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
