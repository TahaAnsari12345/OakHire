import { Link } from 'react-router-dom';
import useApiList from '../../hooks/useApiList';
import Pagination from '../../components/common/Pagination';
import { useLeadSourceOptions } from '../../hooks/useOptions';

export default function CandidateList() {
  const { data, pagination, page, setPage, filters, updateFilters, isLoading, error } = useApiList('/candidates');
  const leadSources = useLeadSourceOptions();

  function handleFilterChange(e) {
    updateFilters({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Candidates</h2>
        <Link to="/candidates/new" className="btn-link">
          + Add Candidate
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          placeholder="Search name, company, skills…"
          value={filters.search || ''}
          onChange={handleFilterChange}
        />
        <select name="source" value={filters.source || ''} onChange={handleFilterChange}>
          <option value="">All sources</option>
          {leadSources.map((s) => (
            <option key={s._id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={filters.location || ''}
          onChange={handleFilterChange}
        />
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Experience</th>
            <th>Source</th>
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
              <td colSpan={6}>No candidates found.</td>
            </tr>
          )}
          {data.map((candidate) => (
            <tr key={candidate._id}>
              <td data-label="Name">
                <Link to={`/candidates/${candidate._id}`}>{candidate.name}</Link>
              </td>
              <td data-label="Phone">{candidate.phone}</td>
              <td data-label="Location">{candidate.location || '—'}</td>
              <td data-label="Experience" className="mono">
                {candidate.totalExperience ?? 0} yrs
              </td>
              <td data-label="Source">{candidate.source}</td>
              <td data-label="Owner">{candidate.assignedTo?.name || '—'}</td>
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
