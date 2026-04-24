import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, rupiah, statusLabel, statusBadge } from '../utils/api';

const StatCard = ({ icon, label, value, color, bg }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: bg }}>{icon}</div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await api.dashboard();
      setData(res.data);
    } catch (e) {
      if (e.message.includes('Unauthorized') || e.message.includes('Forbidden')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
    </div>
  );

  if (!data) return (
    <div className="loading-page">
      <p style={{ color: 'var(--danger)' }}>Gagal memuat data.</p>
      <button className="btn btn-outline btn-sm" onClick={loadStats}>Coba Lagi</button>
    </div>
  );

  const { orderStats: o, productStats: p, recentOrders, topProducts } = data;

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 26, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.7rem', fontWeight: 600, marginBottom: 3,
        }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Ringkasan operasional Ali Nursery
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: 12, marginBottom: 26,
      }}>
        <StatCard icon="📋" label="Total Pesanan"   value={o.total_orders}
          color="var(--text)"   bg="var(--elevated)" />
        <StatCard icon="💰" label="Total Revenue"   value={rupiah(o.total_revenue)}
          color="var(--green)"  bg="var(--green-dim)" />
        <StatCard icon="⏳" label="Menunggu"         value={o.pending}
          color="var(--warn)"   bg="var(--warn-dim)" />
        <StatCard icon="✓"  label="Selesai"          value={o.delivered}
          color="var(--green)"  bg="var(--green-dim)" />
        <StatCard icon="🌿" label="Total Produk"     value={p.total_products}
          color="var(--text)"   bg="var(--elevated)" />
        <StatCard icon="⚠"  label="Stok Menipis"    value={p.low_stock}
          color="var(--warn)"   bg="var(--warn-dim)" />
        <StatCard icon="💳" label="Belum Dibayar"   value={rupiah(o.pending_payment)}
          color="var(--warn)"   bg="var(--warn-dim)" />
        <StatCard icon="✕"  label="Dibatalkan"       value={o.cancelled}
          color="var(--danger)" bg="var(--danger-dim)" />
      </div>

      {/* Mid section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Pipeline */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Pipeline Pesanan</h3>
          {[
            ['confirmed',  o.confirmed,  'var(--info)'],
            ['processing', o.processing, 'var(--purple)'],
            ['shipped',    o.shipped,    'var(--green)'],
          ].map(([status, count, color]) => (
            <div key={status} style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginBottom: 5,
              }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>
                  {statusLabel[status]}
                </span>
                <span style={{
                  fontSize: '12.5px', fontWeight: 600,
                  fontFamily: 'var(--font-mono)', color,
                }}>{count}</span>
              </div>
              <div style={{
                height: 4, background: 'var(--elevated)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: color,
                  width: o.total_orders > 0
                    ? `${Math.round((count / o.total_orders) * 100)}%`
                    : '0%',
                  transition: 'width 0.6s var(--ease)',
                }} />
              </div>
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm btn-full"
            style={{ marginTop: 10 }}
            onClick={() => navigate('/admin/orders')}
          >
            Lihat Semua Pesanan →
          </button>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Produk Terlaris</h3>
          {topProducts.length === 0 ? (
            <div className="empty" style={{ padding: '20px 0' }}>
              <p>Belum ada data penjualan</p>
            </div>
          ) : topProducts.map((prod, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0',
              borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--muted)', fontSize: '11px', width: 14,
              }}>{i + 1}</span>
              <span style={{ fontSize: '1.3rem' }}>{prod.image_emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{prod.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  {prod.total_sold} terjual
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px', fontWeight: 600,
                color: 'var(--green)', flexShrink: 0,
              }}>
                {rupiah(prod.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 18,
        }}>
          <h3>Pesanan Terbaru</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/orders')}>
            Lihat semua →
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty"><p>Belum ada pesanan masuk</p></div>
        ) : (
          <div className="table-wrap" style={{ borderRadius: 10, border: '1px solid var(--border)' }}>
            <table>
              <thead>
                <tr>
                  <th>No. Pesanan</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Pembayaran</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr
                    key={order.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/admin/orders')}
                  >
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--green)', fontWeight: 500,
                        fontSize: '12.5px',
                      }}>
                        {order.order_number}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{order.phone_number}</div>
                    </td>
                    <td style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600, fontSize: '14px',
                    }}>{rupiah(order.total_price)}</td>
                    <td>
                      <span className={statusBadge(order.order_status)}>
                        {statusLabel[order.order_status]}
                      </span>
                    </td>
                    <td>
                      <span className={statusBadge(order.payment_status)}>
                        {statusLabel[order.payment_status]}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(order.order_date).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
