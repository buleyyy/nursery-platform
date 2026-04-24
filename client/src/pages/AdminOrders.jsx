import { useState, useEffect, useCallback } from 'react';
import { api, rupiah, statusLabel, statusBadge } from '../utils/api';

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null); // detail modal
  const [filters,  setFilters]  = useState({ status: '', payment: '', search: '', page: 1 });
  const [updating, setUpdating] = useState(null); // order id being updated

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { status, payment, search, page } = filters;
      const q = new URLSearchParams({ page, limit: 20 });
      if (status)  q.set('status',  status);
      if (payment) q.set('payment', payment);
      if (search)  q.set('search',  search);
      const res = await api.adminOrders('?' + q.toString());
      setOrders(res.data || []);
      setTotal(res.total || 0);
    } catch {}
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const openDetail = async (id) => {
    try {
      const res = await api.adminOrderDetail(id);
      setSelected(res.data);
    } catch {}
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.updateStatus(orderId, { order_status: newStatus });
      loadOrders();
      if (selected?.id === orderId) {
        setSelected(s => ({ ...s, order_status: newStatus }));
      }
    } catch (e) {
      alert('Gagal update: ' + e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filterBy = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));

  return (
    <div style={{ padding: '28px 28px 60px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Manajemen Pesanan</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          {total} total pesanan
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <span className="search-bar-icon">🔍</span>
          <input className="input"
            placeholder="Cari no. pesanan, nama, HP..."
            value={filters.search}
            onChange={(e) => filterBy('search', e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 160 }}
          value={filters.status} onChange={(e) => filterBy('status', e.target.value)}>
          <option value="">Semua Status</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
        <select className="select" style={{ width: 160 }}
          value={filters.payment} onChange={(e) => filterBy('payment', e.target.value)}>
          <option value="">Semua Pembayaran</option>
          <option value="pending">Pending</option>
          <option value="paid">Lunas</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">📋</div>
          <h3>Tidak ada pesanan</h3>
          <p>Coba ubah filter pencarian</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status Pesanan</th>
                <th>Pembayaran</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <button style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--green)', fontWeight: 700, fontSize: '13px', padding: 0,
                    }}
                    onClick={() => openDetail(order.id)}>
                      {order.order_number}
                    </button>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{order.customer_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{order.phone_number}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{rupiah(order.total_price)}</td>
                  <td>
                    <select
                      className="select" style={{ width: 140, padding: '5px 8px', fontSize: '12px' }}
                      value={order.order_status}
                      disabled={updating === order.id}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{statusLabel[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={statusBadge(order.payment_status)}>
                      {statusLabel[order.payment_status]}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {new Date(order.order_date).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => openDetail(order.id)}>
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>{selected.order_number}</h2>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: 2 }}>
                  {new Date(selected.order_date).toLocaleString('id-ID')}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Customer */}
            <div className="card card-sm" style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--muted)', marginBottom: 8 }}>
                DATA PELANGGAN
              </div>
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span style={{ color: 'var(--muted)' }}>Nama: </span>{selected.customer_name}</div>
                <div><span style={{ color: 'var(--muted)' }}>HP: </span>{selected.phone_number}</div>
                <div><span style={{ color: 'var(--muted)' }}>Alamat: </span>{selected.shipping_address}</div>
                {selected.notes && <div><span style={{ color: 'var(--muted)' }}>Catatan: </span>{selected.notes}</div>}
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--muted)', marginBottom: 8 }}>
                ITEM PESANAN
              </div>
              {(selected.items || []).map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '7px 0',
                  borderBottom: '1px solid var(--border)', fontSize: '14px',
                }}>
                  <span>{item.image_emoji} {item.product_name} × {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{rupiah(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--green)' }}>{rupiah(selected.total_price)}</span>
              </div>
            </div>

            {/* Status update */}
            <div className="form-group">
              <label className="form-label">Update Status Pesanan</label>
              <select className="select"
                value={selected.order_status}
                onChange={(e) => handleUpdateStatus(selected.id, e.target.value)}>
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
