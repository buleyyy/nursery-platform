import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, rupiah, statusLabel, statusBadge } from '../utils/api';

const STEPS = [
  { key: 'pending',    icon: '◎', label: 'Pesanan Diterima',   desc: 'Pesanan berhasil dibuat' },
  { key: 'confirmed',  icon: '◉', label: 'Dikonfirmasi',       desc: 'Pembayaran dikonfirmasi admin' },
  { key: 'processing', icon: '◈', label: 'Diproses',           desc: 'Pesanan sedang dikemas' },
  { key: 'shipped',    icon: '◐', label: 'Dikirim',            desc: 'Dalam perjalanan ke alamatmu' },
  { key: 'delivered',  icon: '●', label: 'Selesai',            desc: 'Pesanan telah diterima' },
];

const stepIndex = (status) => STEPS.findIndex(s => s.key === status);

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    orderNumber: searchParams.get('orderNumber') || '',
    phone: '',
  });
  const [orders,   setOrders]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [searchBy, setSearchBy] = useState('orderNumber');

  useEffect(() => {
    const on = searchParams.get('orderNumber');
    if (on) handleSearch(null, on);
  }, []);

  const handleSearch = async (e, prefilled) => {
    if (e) e.preventDefault();
    setLoading(true); setError(null); setOrders(null);

    const orderNum = prefilled || form.orderNumber.trim();
    const phone    = form.phone.trim();

    try {
      const params = searchBy === 'orderNumber' && orderNum
        ? `orderNumber=${orderNum}`
        : `phone=${phone}`;
      const res = await api.trackOrder(params);
      setOrders(Array.isArray(res.data) ? res.data : [res.data]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '44px 5% 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem', marginBottom: 6,
        }}>Lacak Pesanan</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
          Masukkan nomor pesanan atau nomor HP untuk melihat status pesanan.
        </p>
      </div>

      {/* Search Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="filter-tabs" style={{ marginBottom: 14 }}>
          <button
            className={`filter-tab ${searchBy === 'orderNumber' ? 'active' : ''}`}
            onClick={() => setSearchBy('orderNumber')}
          >Nomor Pesanan</button>
          <button
            className={`filter-tab ${searchBy === 'phone' ? 'active' : ''}`}
            onClick={() => setSearchBy('phone')}
          >Nomor HP</button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder={
              searchBy === 'orderNumber'
                ? 'ORD-20260424-ABC123'
                : '08123456789'
            }
            value={searchBy === 'orderNumber' ? form.orderNumber : form.phone}
            onChange={(e) => setForm(f => ({
              ...f,
              [searchBy === 'orderNumber' ? 'orderNumber' : 'phone']: e.target.value,
            }))}
            required
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flexShrink: 0 }}
          >
            {loading
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : 'Cari'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Results */}
      {orders && orders.map(order => (
        <div key={order.id} className="card" style={{ marginBottom: 16 }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: 10,
            marginBottom: 22, paddingBottom: 18,
            borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 500, fontSize: '15px',
                color: 'var(--green)', marginBottom: 3,
              }}>
                {order.order_number}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {new Date(order.order_date).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={statusBadge(order.order_status)}>
                {statusLabel[order.order_status] || order.order_status}
              </span>
              <span className={statusBadge(order.payment_status)}>
                {statusLabel[order.payment_status] || order.payment_status}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {order.order_status !== 'cancelled' ? (
            <div className="timeline" style={{ marginBottom: 22 }}>
              {STEPS.map((step, i) => {
                const current = stepIndex(order.order_status);
                const state   = i < current ? 'done' : i === current ? 'current' : 'pending';
                const isLast  = i === STEPS.length - 1;
                return (
                  <div key={step.key} className="timeline-item">
                    {!isLast && (
                      <div className={`timeline-line ${i < current ? 'done' : ''}`} />
                    )}
                    <div className={`timeline-dot ${state}`} style={{ fontSize: '13px' }}>
                      {step.icon}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-label" style={{
                        color: state === 'done'    ? 'var(--green-2)'
                             : state === 'current' ? 'var(--text)'
                             : 'var(--muted)',
                      }}>{step.label}</div>
                      {state !== 'pending' && (
                        <div className="timeline-desc">{step.desc}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <span>✕</span> Pesanan ini telah dibatalkan.
            </div>
          )}

          {/* Items */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Item Pesanan</div>
            {(order.items || []).map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '13.5px',
              }}>
                <span style={{ color: 'var(--text-2)' }}>
                  {item.image_emoji} {item.product_name} × {item.quantity}
                </span>
                <span style={{ fontWeight: 600 }}>{rupiah(item.subtotal)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 12, fontWeight: 700,
            }}>
              <span>Total</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem', color: 'var(--green)',
              }}>{rupiah(order.total_price)}</span>
            </div>
          </div>

          {order.payment_status === 'pending' && order.order_status !== 'cancelled' && (
            <div className="alert alert-warn" style={{ marginTop: 14 }}>
              <span>⏳</span>
              Menunggu konfirmasi pembayaran dari admin. Sudah transfer? Hubungi admin via WhatsApp.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
