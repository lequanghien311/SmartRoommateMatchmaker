function getPagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  return { page, limit, offset: (page - 1) * limit };
}

function pageMeta(total, page, limit) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

module.exports = { getPagination, pageMeta };

