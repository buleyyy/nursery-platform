import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, cart, rupiah } from '../utils/api';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate  = useNavigate();
  const [product,  setProduct]  = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const res = await api.getProduct(id);
      setProduct(res.data);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    cart.add(product, quantity);
    setToast('Ditambahkan ke keranjang!');
    setTimeout(() => setToast(null), 2200);
  };

  const handleOrderNow = () => {
    cart.add(product, quantity);
    navigate('/checkout');
  };

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!product) return (
    <div style={{ padding: '80px 5%', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌵</div>
      <h2>Produk tidak ditemukan</h2>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
        Kembali ke Katalog
      </button>
    </div>
  );

  const stockStatus = product.stock_quantity === 0
    ? { label: 'Stok Habis',       color: 'var(--danger)',  bg: 'var(--danger-dim)' }
    : product.stock_quantity <= 3
    ? { label: `Sisa ${product.stock_quantity}`, color: 'var(--warn)', bg: 'var(--warn-dim)' }
    : { label: `${product.stock_quantity} tersedia`, color: 'var(--green-2)', bg: 'var(--green-dim)' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 5%' }}>
      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate('/')}>
        ← Kembali
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Image */}
        <div style={{
          background: 'linear-gradient(135deg, var(--elevated), var(--surface))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          height: 380,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '8rem',
        }}>
          {product.image_emoji || '🌿'}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{
            display: 'inline-block', width: 'fit-content',
            background: 'var(--green-dim)', color: 'var(--green-2)',
            padding: '4px 12px', borderRadius: 999,
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px',
          }}>
            {product.category_name}
          </span>

          <h1 style={{ fontSize: '1.7rem', lineHeight: 1.2 }}>{product.name}</h1>

          {product.description && (
            <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '14px' }}>
              {product.description}
            </p>
          )}

          {product.care_instructions && (
            <div style={{
              background: 'var(--info-dim)', border: '1px solid rgba(96,165,250,0.25)',
              borderRadius: 'var(--radius)', padding: '12px 16px',
            }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--info)', marginBottom: 4 }}>
                💡 Cara Perawatan
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {product.care_instructions}
              </p>
            </div>
          )}

          <hr className="divider" style={{ margin: '4px 0' }} />

          {/* Price & Stock */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--green)' }}>
              {rupiah(product.price)}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: 600, padding: '3px 10px',
              borderRadius: 999, background: stockStatus.bg, color: stockStatus.color,
            }}>
              {stockStatus.label}
            </span>
          </div>

          {product.stock_quantity > 0 && (
            <>
              {/* Qty control */}
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Jumlah</div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <span className="qty-val">{quantity}</span>
                  <button className="qty-btn"
                    onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}>+</button>
                </div>
              </div>

              {/* Subtotal */}
              <div style={{
                background: 'var(--elevated)', borderRadius: 'var(--radius)',
                padding: '10px 14px', fontSize: '14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>
                  {rupiah(product.price * quantity)}
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleAddToCart}>
                  🛒 + Keranjang
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleOrderNow}>
                  Pesan Sekarang
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--elevated)', border: '1px solid var(--green)',
          padding: '12px 24px', borderRadius: 999,
          color: 'var(--text)', fontSize: '14px', fontWeight: 500,
          boxShadow: 'var(--shadow)', zIndex: 999,
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
