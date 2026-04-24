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
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛒</div>
      <h2>Keranjang Kosong</h2>
      <p style={{ color: 'var(--text-2)', marginTop: 8, marginBottom: 24 }}>
        Tambahkan tanaman ke keranjang dulu ya.
      </p>
      <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
        Lihat Katalog
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 5% 60px' }}>
      <h1 style={{ marginBottom: 24 }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* ── Order Summary ── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Ringkasan Pesanan</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.product_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '2rem' }}>{item.image_emoji || '🌿'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '13px' }}>{rupiah(item.price)} / item</div>
                </div>
                <div className="qty-control" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                  <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', minWidth: 90, textAlign: 'right' }}>
                  {rupiah(item.price * item.quantity)}
                </div>
                <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px' }}
                  onClick={() => removeItem(item.product_id)}>✕</button>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-2)' }}>Total Pesanan</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>
              {rupiah(total)}
            </span>
          </div>

          <div className="alert alert-info" style={{ marginTop: 16 }}>
            💳 Pembayaran dilakukan via transfer bank setelah pesanan dikonfirmasi admin.
          </div>
        </div>

        {/* ── Customer Form ── */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Data Pemesan</h3>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                placeholder="Catatan untuk penjual, misalnya waktu pengiriman..."
                value={form.notes} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={loading} style={{ marginTop: 4 }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Memproses...</>
                : '✓ Buat Pesanan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
