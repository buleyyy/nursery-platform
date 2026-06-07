import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, rupiah, statusLabel, statusBadge } from '../utils/api';

// SVG icons untuk stat cards
const IC = {
  orders:   <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 6h8M5 9h8M5 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  revenue:  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 8h15" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="11" width="4" height="2" rx=".8" fill="currentColor"/></svg>,
  pending:  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  done:     <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9l2.5 2.5L12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plant:    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C9 2 4.5 6 4.5 10.5a4.5 4.5 0 009 0C13.5 6 9 2 9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 10.5V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  warn:     <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L16 15H2L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 8v3M9 13v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  unpaid:   <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 8h15" stroke="currentColor" strokeWidth="1.5"/><path d="M12 11.5h2M10 11.5h.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  cancel:   <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// StatCard — shortcut button dengan layout bersih
const StatCard = ({ icon, label, value, color, bg, accent, onClick, isRupiah }) => (
  <div
    className="stat-card"
    onClick={onClick}
    style={{
      borderLeft: `3px solid ${accent || 'transparent'}`,
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
      position: 'relative',
      flexDirection: isRupiah ? 'row' : 'row',
      alignItems: isRupiah ? 'center' : 'center',
    }}
    onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.09)'; }}}
    onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}}
  >
    {/* Icon box */}
    <div className="stat-icon" style={{ background: bg, color, flexShrink: 0 }}>{icon}</div>

    {isRupiah ? (
      /* Rupiah: label di atas, nominal di bawah — stacked, tapi compact */
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 700,
          color,
          lineHeight: 1.2,
          marginTop: 2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{value}</div>
      </div>
    ) : (
      /* Angka biasa: label + angka besar */
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
      </div>
    )}

    {/* Arrow hint */}
    {onClick && (
      <div style={{ color: 'var(--muted)', opacity: 0.5, flexShrink: 0, paddingLeft: 4 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    )}
  </div>
);

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dashboard();
      setData(res.data);
    } catch (e) {
      if (e.message?.includes('Unauthorized') || e.message?.includes('Forbidden')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      setError(e.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-page"><div className="spinner" /><span>Memuat dashboard...</span></div>
  );

  if (error) return (
    <div className="loading-page">
      <p style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>
      <button className="btn btn-primary btn-sm" onClick={loadStats}>Coba Lagi</button>
    </div>
  );

  if (!data) return (
    <div className="loading-page">
      <p style={{ color: 'var(--danger)' }}>Data tidak tersedia.</p>
      <button className="btn btn-outline btn-sm" onClick={loadStats}>Refresh</button>
    </div>
  );

  const o = data.orderStats   || {};
  const p = data.productStats || {};
  const recentOrders = data.recentOrders || [];
  const topProducts  = data.topProducts  || [];
  const safeNum = (v) => Number(v) || 0;
  const totalOrders = safeNum(o.total_orders);

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 26, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 3 }}>
              Dashboard
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Ringkasan operasional H. Ali Nursery</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadStats}>↻ Refresh</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 26 }}>
        <StatCard icon={IC.orders}  label="Total Pesanan" value={safeNum(o.total_orders)}      color="var(--text)"   bg="var(--elevated)"   accent="var(--border-2)" onClick={() => navigate('/admin/orders')} />
        <StatCard icon={IC.revenue} label="Total Revenue"  value={rupiah(o.total_revenue || 0)} color="var(--green)"  bg="var(--green-dim)"  accent="var(--green-2)" onClick={() => navigate('/admin/orders?payment=paid')} isRupiah />
        <StatCard icon={IC.pending} label="Menunggu"        value={safeNum(o.pending)}           color="var(--warn)"   bg="var(--warn-dim)"   accent="var(--warn)"    onClick={() => navigate('/admin/orders?status=pending')} />
        <StatCard icon={IC.done}    label="Selesai"          value={safeNum(o.delivered)}         color="var(--green)"  bg="var(--green-dim)"  accent="var(--green)"   onClick={() => navigate('/admin/orders?status=delivered')} />
        <StatCard icon={IC.plant}   label="Total Produk"    value={safeNum(p.total_products)}    color="var(--text)"   bg="var(--elevated)"   accent="var(--border-2)" onClick={() => navigate('/admin/products')} />
        <StatCard icon={IC.warn}    label="Stok Menipis"    value={safeNum(p.low_stock)}         color="var(--warn)"   bg="var(--warn-dim)"   accent="var(--warn)"    onClick={() => navigate('/admin/products')} />
        <StatCard icon={IC.unpaid}  label="Belum Dibayar"   value={rupiah(o.pending_payment||0)} color="var(--warn)"   bg="var(--warn-dim)"   accent="var(--warn)"    onClick={() => navigate('/admin/orders?payment=pending')} isRupiah />
        <StatCard icon={IC.cancel}  label="Dibatalkan"      value={safeNum(o.cancelled)}         color="var(--danger)" bg="var(--danger-dim)" accent="var(--danger)"  onClick={() => navigate('/admin/orders?status=cancelled')} />
      </div>

      {/* Mid section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Pipeline */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Pipeline Pesanan</h3>
          {[
            ['confirmed',  safeNum(o.confirmed),  'var(--info)'],
            ['processing', safeNum(o.processing), 'var(--purple)'],
            ['shipped',    safeNum(o.shipped),    'var(--green)'],
          ].map(([status, count, color]) => (
            <div key={status} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-2)' }}>{statusLabel[status]}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{count}</span>
              </div>
              <div style={{ height: 6, background: 'var(--elevated)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: color,
                  width: totalOrders > 0 ? `${Math.round((count / totalOrders) * 100)}%` : '0%',
                  transition: 'width 0.6s var(--ease)',
                }} />
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 10 }}
            onClick={() => navigate('/admin/orders')}>Lihat Semua Pesanan →</button>
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Produk Terlaris</h3>
          {topProducts.length === 0 ? (
            <div className="empty" style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 8 }}>{IC.plant}</div>
              <p style={{ fontSize: '13px' }}>Belum ada data penjualan</p>
            </div>
          ) : topProducts.map((prod, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0',
              borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: '11px', width: 14 }}>{i + 1}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', flexShrink: 0 }}>
                {prod.image_url
                  ? <img src={prod.image_url} alt={prod.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} onError={e => { e.target.style.display='none'; }} />
                  : IC.plant
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{prod.total_sold} terjual</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                {rupiah(prod.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3>Pesanan Terbaru</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/orders')}>Lihat semua →</button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty"><p>Belum ada pesanan masuk</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Pesanan</th><th>Pelanggan</th><th>Total</th>
                  <th>Status</th><th>Pembayaran</th><th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/orders')}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 600, fontSize: '12.5px' }}>{order.order_number}</span></td>
                    <td>
                      <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{order.customer_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{order.phone_number || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>{rupiah(order.total_price)}</td>
                    <td><span className={statusBadge(order.order_status)}>{statusLabel[order.order_status]}</span></td>
                    <td><span className={statusBadge(order.payment_status)}>{statusLabel[order.payment_status]}</span></td>
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
