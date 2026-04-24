import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cart, rupiah } from '../utils/api';

export default function UserHome() {
  const [products,       setProducts]       = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [search,         setSearch]         = useState('');
  const [toast,          setToast]          = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      const data = res.data || [];
      setProducts(data);
      const cats = [...new Map(
        data.map(p => [p.category_id, { id: p.category_id, name: p.category_name }])
      ).values()];
      setCategories(cats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock_quantity === 0) return;
    cart.add(product);
    showToast(`${product.image_emoji || '🌿'} ${product.name} ditambahkan`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = products.filter(p => {
    const matchCat    = !activeCategory || String(p.category_id) === String(activeCategory);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span>Memuat koleksi tanaman...</span>
    </div>
  );

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        padding: '80px 6% 68px',
        background: 'linear-gradient(180deg, #071209 0%, var(--bg) 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse at center top, rgba(82,214,138,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 560, position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--green-dim)',
            border: '1px solid rgba(82,214,138,0.2)',
            borderRadius: 999, padding: '4px 13px',
            fontSize: '11px', fontWeight: 600,
            color: 'var(--green-2)',
            marginBottom: 20,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <span>✦</span> Tanaman Hias Premium
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 5vw, 3.2rem)',
            fontWeight: 600, lineHeight: 1.1,
            marginBottom: 16, letterSpacing: '-0.3px',
          }}>
            Hadirkan Alam<br />
            <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>ke Rumahmu</em>
          </h1>

          <p style={{
            color: 'var(--text-2)', fontSize: '15px',
            lineHeight: 1.75, marginBottom: 30, maxWidth: 440,
          }}>
            Koleksi tanaman hias pilihan — anggrek, bonsai, sukulen, dan banyak lagi.
            Pemesanan mudah, pengiriman terpercaya.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Katalog
            </button>
            <button
              className="btn btn-ghost btn-lg"
              onClick={() => navigate('/track')}
            >
              Lacak Pesanan
            </button>
          </div>
        </div>
      </section>

      {/* ── Katalog ── */}
      <section id="katalog" style={{ padding: '0 6% 80px' }}>
        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          flexWrap: 'wrap', padding: '16px 0',
          borderBottom: '1px solid var(--border)',
          marginBottom: 28,
          position: 'sticky', top: 58, zIndex: 10,
          background: 'rgba(8,15,11,0.96)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 190 }}>
            <span className="search-bar-icon">⌕</span>
            <input
              className="input"
              placeholder="Cari tanaman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory('')}
            >Semua</button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-tab ${String(activeCategory) === String(cat.id) ? 'active' : ''}`}
                onClick={() => setActiveCategory(String(cat.id))}
              >{cat.name}</button>
            ))}
          </div>

          <span style={{
            color: 'var(--muted)', fontSize: '12px',
            fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
          }}>
            {filtered.length} produk
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            <span>⚠</span> {error}
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={loadProducts}>
              Coba lagi
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⊘</div>
            <h3>Tidak ada produk ditemukan</h3>
            <p>Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(product => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="product-card-img">
                  {product.image_emoji || '🌿'}
                </div>
                <div className="product-card-body">
                  <div className="product-card-cat">{product.category_name}</div>
                  <div className="product-card-name">{product.name}</div>
                  <div className={`product-card-stock ${
                    product.stock_quantity === 0 ? 'out'
                    : product.stock_quantity <= 3 ? 'low' : ''
                  }`}>
                    {product.stock_quantity === 0
                      ? '✕ Stok habis'
                      : product.stock_quantity <= 3
                      ? `⚠ Sisa ${product.stock_quantity}`
                      : `Stok: ${product.stock_quantity}`}
                  </div>
                  <div className="product-card-price">{rupiah(product.price)}</div>
                  <button
                    className={`btn btn-sm btn-full ${product.stock_quantity === 0 ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ marginTop: 6 }}
                    disabled={product.stock_quantity === 0}
                    onClick={(e) => handleAddToCart(e, product)}
                  >
                    {product.stock_quantity === 0 ? 'Stok Habis' : '+ Keranjang'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Toast ── */}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}
