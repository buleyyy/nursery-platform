// Centralized API helper — semua request lewat sini
// Dev  : VITE_API_URL tidak di-set → BASE = '/api' → proxy Vite ke localhost:3006
// Prod : VITE_API_URL = 'https://your-backend.up.railway.app' → fetch langsung ke Railway
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

const getAdminToken    = () => localStorage.getItem('adminToken') || '';
const getCustomerToken = () => localStorage.getItem('customerToken') || '';

const req = async (method, path, body, authType = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authType === 'admin')    headers['Authorization'] = `Bearer ${getAdminToken()}`;
  if (authType === 'customer') headers['Authorization'] = `Bearer ${getCustomerToken()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request gagal');
  return data;
};

export const api = {
  // Public
  getProducts:      (params = '')  => req('GET', `/products${params}`),
  getProduct:       (id)           => req('GET', `/products/${id}`),
  trackOrder:       (params)       => req('GET', `/orders/track?${params}`),

  // Customer-auth-protected
  createOrder:      (body)         => req('POST', '/orders', body, 'customer'),
  myOrders:         ()             => req('GET', '/orders/my', null, 'customer'),

  // Upload bukti transfer — kirim FormData, bukan JSON
  uploadProof: async (orderNumber, file) => {
    const fd = new FormData();
    fd.append('order_number', orderNumber);
    fd.append('proof', file);

    const res = await fetch(`${BASE}/orders/upload-proof`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload gagal');
    return data;
  },

  // Admin auth
  login:            (body)         => req('POST', '/auth/login', body),

  // Customer auth
  customerRegister:      (body) => req('POST', '/customer-auth/register', body),
  customerLogin:          (body) => req('POST', '/customer-auth/login', body),
  customerForgotPassword: (body) => req('POST', '/customer-auth/forgot-password', body),
  customerResetPassword:  (body) => req('POST', '/customer-auth/reset-password', body),
  customerMe:              ()    => req('GET', '/customer-auth/me', null, 'customer'),

  // Admin (protected)
  dashboard:        ()             => req('GET', '/admin/dashboard', null, 'admin'),
  adminOrders:      (params = '')  => req('GET', `/admin/orders${params}`, null, 'admin'),
  adminOrderDetail: (id)           => req('GET', `/admin/orders/${id}`, null, 'admin'),
  updateStatus:     (id, body)     => req('PUT', `/admin/orders/${id}/status`, body, 'admin'),
  confirmPayment:   (id, body)     => req('PUT', `/admin/orders/${id}/payment`, body, 'admin'),
  rejectPayment:    (id, body)     => req('PUT', `/admin/orders/${id}/reject`,  body, 'admin'),
  adminProducts:    ()             => req('GET', '/admin/products', null, 'admin'),
  adminCategories:  ()             => req('GET', '/admin/categories', null, 'admin'),
  createCategory:   (body)         => req('POST', '/admin/categories', body, 'admin'),
  updateCategory:   (id, body)     => req('PUT', `/admin/categories/${id}`, body, 'admin'),
  deleteCategory:   (id)           => req('DELETE', `/admin/categories/${id}`, null, 'admin'),
  createProduct:    (body)         => req('POST', '/admin/products', body, 'admin'),
  updateProduct:    (id, body)     => req('PUT', `/admin/products/${id}`, body, 'admin'),
  deleteProduct:    (id)           => req('DELETE', `/admin/products/${id}`, null, 'admin'),

  // Upload foto produk — FormData
  uploadProductImage: async (productId, file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch(`${BASE}/admin/products/${productId}/image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAdminToken()}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload foto gagal');
    return data;
  },
  salesReport: (year, period = 'monthly') => req('GET', `/admin/sales-report?year=${year}&period=${period}`, null, 'admin'),
};

// Cart helpers (localStorage)
export const cart = {
  get:    () => JSON.parse(localStorage.getItem('cart') || '[]'),
  save:   (items) => localStorage.setItem('cart', JSON.stringify(items)),
  clear:  () => localStorage.removeItem('cart'),
  count:  () => cart.get().reduce((sum, i) => sum + i.quantity, 0),

  add: (product, quantity = 1) => {
    const items    = cart.get();
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
    } else {
      items.push({
        product_id: product.id, name: product.name,
        price: product.price, image_url: product.image_url,
        image_emoji: product.image_emoji, quantity,
      });
    }
    cart.save(items); return items;
  },

  remove: (productId) => {
    const items = cart.get().filter(i => i.product_id !== productId);
    cart.save(items); return items;
  },

  update: (productId, quantity) => {
    const items = cart.get().map(i => i.product_id === productId ? { ...i, quantity } : i);
    cart.save(items); return items;
  },

  total: () => cart.get().reduce((sum, i) => sum + i.price * i.quantity, 0),
};

// Format currency
export const rupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

// Status labels & badge class
export const statusLabel = {
  pending:    'Menunggu',
  confirmed:  'Dikonfirmasi',
  processing: 'Diproses',
  shipped:    'Dikirim',
  delivered:  'Selesai',
  cancelled:  'Dibatalkan',
  paid:       'Lunas',
  failed:     'Gagal',
  refunded:   'Dikembalikan',
};

export const statusBadge = (s) => `badge badge-${s}`;

// URL helpers — dev: relative path, prod: absolute ke Railway backend
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

export const proofUrl = (proofPath) => {
  if (!proofPath) return null;
  const filename = proofPath.split('/').pop();
  return `${API_ORIGIN}/api/proof/${filename}`;
};

export const productImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const filename = imagePath.split('/').pop();
  return `${API_ORIGIN}/api/product-images/${filename}`;
};
