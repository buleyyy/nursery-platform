import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, rupiah, statusLabel, statusBadge, productImageUrl } from '../utils/api';

export default function OrderHistory() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.myOrders()
      .then(res => setOrders(res.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 5% 72px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700,
        color: 'var(--text)', marginBottom: 24,
      }}>Riwayat Pesanan</h1>

      {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

      {orders.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Belum ada pesanan.</p>
          <Link to="/" className="btn btn-primary">Mulai Belanja</Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orders.map(order => (
          <div key={order.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                  {order.order_number}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 2 }}>
                  {new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={statusBadge(order.order_status)}>{statusLabel[order.order_status] || order.order_status}</span>
                <span className={statusBadge(order.payment_status)}>{statusLabel[order.payment_status] || order.payment_status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {item.image_emoji || '🌿'}
                  </div>
                  <span style={{ flex: 1, color: 'var(--text-2)' }}>{item.product_name} × {item.quantity}</span>
                  <span style={{ color: 'var(--muted)' }}>{rupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-2)', fontSize: '13px', fontWeight: 600 }}>Total</span>
              <span style={{ fontWeight: 700, color: 'var(--green)' }}>{rupiah(order.total_price)}</span>
            </div>

            {order.payment_status !== 'paid' && (
              <Link to={`/payment/${order.order_number}`} className="btn btn-sm" style={{ marginTop: 12 }}>
                Lihat Pembayaran
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
