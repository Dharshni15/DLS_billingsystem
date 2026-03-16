// Advanced search and filtering utilities

export const buildSearchQuery = (query, fields) => {
  if (!query) return {};
  
  const searchRegex = { $regex: query, $options: 'i' };
  const orConditions = fields.map(field => ({ [field]: searchRegex }));
  
  return { $or: orConditions };
};

export const buildDateRangeQuery = (startDate, endDate, dateField = 'createdAt') => {
  const query = {};
  
  if (startDate) {
    query[dateField] = { ...query[dateField], $gte: new Date(startDate) };
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query[dateField] = { ...query[dateField], $lte: end };
  }
  
  return query;
};

export const buildPriceRangeQuery = (minPrice, maxPrice) => {
  const query = {};
  
  if (minPrice !== undefined && minPrice !== null) {
    query.price = { ...query.price, $gte: minPrice };
  }
  
  if (maxPrice !== undefined && maxPrice !== null) {
    query.price = { ...query.price, $lte: maxPrice };
  }
  
  return query;
};

export const buildCategoryFilter = (categories) => {
  if (!categories || categories.length === 0) return {};
  
  return { category: { $in: Array.isArray(categories) ? categories : [categories] } };
};

export const buildStatusFilter = (statuses) => {
  if (!statuses || statuses.length === 0) return {};
  
  return { status: { $in: Array.isArray(statuses) ? statuses : [statuses] } };
};

export const buildPaymentStatusFilter = (paymentStatus) => {
  if (!paymentStatus) return {};
  
  return { paymentStatus: { $in: Array.isArray(paymentStatus) ? paymentStatus : [paymentStatus] } };
};

export const combineFilters = (...filterObjects) => {
  return filterObjects.reduce((combined, filter) => {
    return { ...combined, ...filter };
  }, {});
};

export const getPaginationParams = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;
  
  return { skip, limit: limitNum, page: pageNum };
};

export const getSortParams = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

export default {
  buildSearchQuery,
  buildDateRangeQuery,
  buildPriceRangeQuery,
  buildCategoryFilter,
  buildStatusFilter,
  buildPaymentStatusFilter,
  combineFilters,
  getPaginationParams,
  getSortParams
};
