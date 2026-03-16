import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://dls-billingsystem.onrender.com'

export const api = axios.create({ baseURL: `${API_BASE}/api` })

// Role header management (used by legacy role guards on backend)
let currentRole = ''
api.defaults.headers.common['x-role'] = currentRole
export const setRole = (role) => {
  currentRole = role || ''
  api.defaults.headers.common['x-role'] = currentRole
}

// Products
export const createProduct = (data) => api.post('/products', data).then(r => r.data)
export const listProducts = (params) => api.get('/products', { params }).then(r => r.data)
export const lookupProduct = (code) => api.get(`/products/lookup/by-code/${encodeURIComponent(code)}`).then(r => r.data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data)

// Stock utils
export const listLowStock = (params) => api.get('/products/utils/low-stock', { params }).then(r => r.data)

// Export products as Excel (returns Blob)
export const exportProductsExcel = async (params) => {
  const res = await api.get('/products/export', { params, responseType: 'blob' })
  return res.data // Blob
}

// Customers
export const createCustomer = (data) => api.post('/customers', data).then(r => r.data)
export const listCustomers = (params) => api.get('/customers', { params }).then(r => r.data)
export const getCustomer = (id) => api.get(`/customers/${id}`).then(r => r.data)
export const listTopCustomers = (params) => api.get('/customers/utils/top', { params }).then(r => r.data)

// Invoices
export const createInvoice = (data) => api.post('/invoices', data).then(r => r.data)
export const listInvoices = (params) => api.get('/invoices', { params }).then(r => r.data)
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(r => r.data)

// Online Orders
export const createOnlineOrder = (data) => api.post('/online-orders', data).then(r => r.data)
export const listOnlineOrders = (params) => api.get('/online-orders', { params }).then(r => r.data)
export const updateOnlineOrderStatus = (id, status) => api.put(`/online-orders/${id}/status`, { status }).then(r => r.data)

// Favorites
export const listFavorites = () => api.get('/favorites').then(r => r.data)
export const toggleFavorite = (productId) => api.post(`/favorites/${productId}`).then(r => r.data)


// Roles
export const listRoles = () => api.get('/roles').then(r => r.data)
export const getRole = (id) => api.get(`/roles/${id}`).then(r => r.data)
export const createRole = (data) => api.post('/roles', data).then(r => r.data)
export const updateRole = (id, data) => api.put(`/roles/${id}`, data).then(r => r.data)
export const deleteRole = (id) => api.delete(`/roles/${id}`).then(r => r.data)

// Discounts & Promotions
export const listDiscounts = (params) => api.get('/discounts', { params }).then(r => r.data)
export const validateDiscountCode = (data) => api.post('/discounts/validate', data).then(r => r.data)
export const createDiscount = (data) => api.post('/discounts', data).then(r => r.data)
export const updateDiscount = (id, data) => api.put(`/discounts/${id}`, data).then(r => r.data)
export const deleteDiscount = (id) => api.delete(`/discounts/${id}`).then(r => r.data)

// Inventory Management
export const listInventory = (params) => api.get('/inventory', { params }).then(r => r.data)
export const getLowStockItems = () => api.get('/inventory/low-stock').then(r => r.data)
export const getInventoryByProduct = (productId) => api.get(`/inventory/product/${productId}`).then(r => r.data)
export const updateInventory = (id, data) => api.put(`/inventory/${id}`, data).then(r => r.data)
export const reserveInventory = (id, quantity) => api.post(`/inventory/${id}/reserve`, { quantity }).then(r => r.data)



// Analytics & Dashboard
export const getDashboardMetrics = () => api.get('/analytics/dashboard').then(r => r.data)
export const getAnalyticsRange = (params) => api.get('/analytics/range', { params }).then(r => r.data)
export const getSalesTrends = (params) => api.get('/analytics/trends', { params }).then(r => r.data)
export const getCategoryBreakdown = () => api.get('/analytics/categories').then(r => r.data)

// Import/Export
export const exportProducts = async () => {
  const res = await api.get('/import-export/products/export', { responseType: 'blob' })
  return res.data
}
export const exportCustomers = async () => {
  const res = await api.get('/import-export/customers/export', { responseType: 'blob' })
  return res.data
}
export const exportInvoices = async () => {
  const res = await api.get('/import-export/invoices/export', { responseType: 'blob' })
  return res.data
}

// Payments
export const createPaymentIntent = (data) => api.post('/payments/create-payment-intent', data).then(r => r.data)
export const confirmPaymentIntent = (paymentIntentId) => api.post(`/payments/confirm-payment-intent/${paymentIntentId}`).then(r => r.data)
