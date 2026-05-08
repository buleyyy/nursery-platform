import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cart, rupiah } from '../utils/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState(null);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    customer_address: '', notes: '',
  });

  useEffect(() => {
    const c = cart.get();
    setItems(c);
  }, []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeItem(productId); return; }
    const updated = cart.update(productId, qty);
    setItems(updated);
  };

  const removeItem = (productId) => {
    const updated = cart.remove(productId);
    setItems(updated);
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { setError('Keranjang kosong'); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.createOrder({
        ...form,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      cart.clear();
      navigate(`/payment/${res.data.order_number}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 5%' }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>🛒</div>
      <h2 style={{ color: 'var(--text)', marginBottom: 10 }}>Keranjang Kosong</h2>
      <p style={{ color: 'var(--text-2)', marginTop: 8, marginBottom: 28 }}>
        Tambahkan tanaman ke keranjang dulu ya.
      </p>
      <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
        🌿 Lihat Katalog
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 5% 72px' }}>
      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 14, color: 'var(--muted)' }}
          onClick={() => navigate('/')}
        >
          ← Kembali
        </button>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem', fontWeight: 700, color: 'var(--text)',
        }}>Checkout</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: 4 }}>
          Periksa pesanan dan isi data pengiriman
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* ── Order Summary ── */}
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1em' }}>🛒</span> Ringkasan Pesanan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map((item, idx) => (
                <div key={item.product_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 0',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', flexShrink: 0,
                  }}>
                    {item.image_emoji || '🌿'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text)' }}>
                      {item.name}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: 2 }}>
                      {rupiah(item.price)} / item
                    </div>
                  </div>
                  <div className="qty-control" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                    <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', minWidth: 85, textAlign: 'right', color: 'var(--text)' }}>
                    {rupiah(item.price * item.quantity)}
                  </div>
                  <button
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--muted)', fontSize: '15px', padding: '4px 6px',
                      borderRadius: 6, transition: 'all 0.15s',
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
                    onClick={() => removeItem(item.product_id)}
                  >✕</button>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, paddingTop: 16, borderTop: '2px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Total Pesanan</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                {rupiah(total)}
              </span>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 14 }}>
            💳 Pembayaran dilakukan via transfer bank setelah pesanan dikonfirmasi admin.
          </div>
        </div>

        {/* ── Customer Form ── */}
        <div className="card">
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1em' }}>📋</span> Data Pemesan
          </h3>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 18 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap *</label>
              <input className="input" name="customer_name" required
                placeholder="Budi Santoso"
                value={form.customer_name} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp *</label>
              <input className="input" name="customer_phone" required type="tel"
                placeholder="08123456789"
                value={form.customer_phone} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Email (opsional)</label>
              <input className="input" name="customer_email" type="email"
                placeholder="email@contoh.com"
                value={form.customer_email} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Pengiriman *</label>
              <textarea className="textarea" name="customer_address" required rows={3}
                placeholder="Jl. Contoh No. 10, Kecamatan, Kota..."
                value={form.customer_address} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Catatan (opsional)</label>
              <textarea className="textarea" name="notes" rows={2}
                placeholder="Catatan untuk penjual..."
                value={form.notes} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={loading} style={{ marginTop: 4, height: 48 }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Memproses...</>
                : '✓ Buat Pesanan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
