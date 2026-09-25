const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginatedResponse({ data, total, page, limit }) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

// Employees only ever see records they own; Super Admin sees everything.
// Called at the top of every list/detail/update/delete controller — never
// trust the frontend to hide out-of-scope records.
function applyOwnershipFilter(req, filter, ownerField = 'assignedTo') {
  if (req.user.role === 'super_admin') return filter;
  return { ...filter, [ownerField]: req.user.id };
}

module.exports = { getPagination, buildPaginatedResponse, applyOwnershipFilter };
