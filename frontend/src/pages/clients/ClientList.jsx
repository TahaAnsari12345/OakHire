import { Link } from 'react-router-dom';
import useApiList from '../../hooks/useApiList';
import Pagination from '../../components/common/Pagination';

export default function ClientList() {
  const { data, pagination, page, setPage, filters, updateFilters, isLoading, error } = useApiList('/clients');

  function handleFilterChange(e) {
    updateFilters({ ...filters, [e.target.name]: e.target.value });
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h2>Clients</h2>
        <Link to="/clients/new" className="btn-link">
          + Add Client
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          name="search"
          placeholder="Search company name…"
          value={filters.search || ''}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status || ''} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Industry</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5}>Loading…</td>
            </tr>
          )}
          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={5}>No clients found.</td>
            </tr>
          )}
          {data.map((client) => (
            <tr key={client._id}>
              <td data-label="Company">
                <Link to={`/clients/${client._id}`}>{client.companyName}</Link>
              </td>
              <td data-label="Industry">{client.industry || '—'}</td>
              <td data-label="Contact">{client.contactName || '—'}</td>
              <td data-label="Status">{client.status}</td>
              <td data-label="Owner">{client.accountOwner?.name || '—'}</td>
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
