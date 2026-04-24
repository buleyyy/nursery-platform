// Centralized API helper — semua request lewat sini
const BASE = 'http://localhost:3006/api';

const getAdminToken = () => localStorage.getItem('adminToken') || '';

const req = async (method, path, body, auth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getAdminToken()}`;

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
  getProducts:     (params = '') => req('GET', `/products${params}`),
  getProduct:      (id)          => req('GET', `/products/${id}`),
  createOrder:     (body)        => req('POST', '/orders', body),
  trackOrder:      (params)      => req('GET', `/orders/track?${params}`),

  // Auth
  login:           (body)        => req('POST', '/auth/login', body),

  // Admin (protected)
  dashboard:       ()            => req('GET', '/admin/dashboard', null, true),
  adminOrders:     (params = '') => req('GET', `/admin/orders${params}`, null, true),
  adminOrderDetail:(id)          => req('GET', `/admin/orders/${id}`, null, true),
  updateStatus:    (id, body)    => req('PUT', `/admin/orders/${id}/status`, body, true),
  confirmPayment:  (id, body)    => req('PUT', `/admin/orders/${id}/payment`, body, true),
  adminProducts:   ()            => req('GET', '/admin/products', null, true),
  adminCategories: ()            => req('GET', '/admin/categories', null, true),
  createProduct:   (body)        => req('POST', '/admin/products', body, true),
  updateProduct:   (id, body)    => req('PUT', `/admin/products/${id}`, body, true),
  deleteProduct:   (id)          => req('DELETE', `/admin/products/${id}`, null, true),
};

// Cart helpers (localStorage)
export const cart = {
  get:    () => JSON.parse(localStorage.getItem('cart') || '[]'),
  save:   (items) => localStorage.setItem('cart', JSON.stringify(items)),
  clear:  () => localStorage.removeItem('cart'),
  count:  () => cart.get().reduce((sum, i) => sum + i.quantity, 0),

  add: (product, quantity = 1) => {
    const items = cart.get();
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
    } else {
      items.push({ product_id: product.id, name: product.name, price: product.price,
                   image_emoji: product.image_emoji, quantity });
    }
    cart.save(items);
    return items;
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
export const rupiah = (num) =>
  'Rp ' + Number(num).toLocaleString('id-ID');

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
