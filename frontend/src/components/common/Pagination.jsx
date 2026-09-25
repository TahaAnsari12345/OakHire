export default function Pagination({ page, totalPages, total, onPageChange }) {
  return (
    <div className="pagination">
      <span className="pagination-info">
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="pagination-controls">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Prev
        </button>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
