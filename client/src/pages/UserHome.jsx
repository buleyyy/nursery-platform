import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cart, rupiah } from '../utils/api';

// Gambar produk — pakai proxy Vite sehingga cukup path relatif
function PlantImage({ product }) {
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" width="52" height="52" style={{ opacity: 0.35 }}>
      <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor"/>
      <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

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
    setToast(`${product.name} ditambahkan ke keranjang`);
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
      {/* Hero */}
      <section style={{
        padding: '72px 6% 64px',
        background: 'linear-gradient(160deg, #e8f5e9 0%, #f0fdf4 50%, #f5f9f5 100%)',
        position: 'relative', overflow: 'hidden',
        borderBottom: '1.5px solid var(--border)',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '8%',
          width: 340, height: 340, borderRadius: '50%',
          background: 'rgba(45,140,78,0.07)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 580, position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#dcfce7', border: '1.5px solid #bbf7d0',
            borderRadius: 999, padding: '5px 14px',
            fontSize: '11px', fontWeight: 700,
            color: 'var(--green-2)', marginBottom: 22,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="5,0 6.5,3.5 10,3.5 7.5,5.8 8.5,9 5,7 1.5,9 2.5,5.8 0,3.5 3.5,3.5"/></svg>
            Tanaman Hias Premium
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 700, lineHeight: 1.1,
            marginBottom: 18, letterSpacing: '-0.5px', color: 'var(--text)',
          }}>
            Hadirkan Alam<br />
            <em style={{ color: 'var(--green)', fontStyle: 'italic' }}>ke Rumahmu</em>
          </h1>

          <p style={{ color: 'var(--text-2)', fontSize: '15.5px', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
            Koleksi tanaman hias pilihan — anggrek, bonsai, sukulen, dan banyak lagi.
            Pemesanan mudah, pengiriman terpercaya.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => document.getElementById('katalog').scrollIntoView({ behavior: 'smooth' })}
              style={{ paddingLeft: 28, paddingRight: 28 }}
            >
              Lihat Katalog
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/track')}>
              Lacak Pesanan
            </button>
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
            {[['10+', 'Jenis Tanaman'], ['5', 'Kategori'], ['100%', 'Kualitas Terjamin']].map(([num, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--green)' }}>{num}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Katalog */}
      <section id="katalog" style={{ padding: '0 6% 80px' }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          flexWrap: 'wrap', padding: '16px 0',
          borderBottom: '1.5px solid var(--border)', marginBottom: 28,
          position: 'sticky', top: 60, zIndex: 10,
          background: 'rgba(245,249,245,0.97)', backdropFilter: 'blur(12px)',
        }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 190 }}>
            <span className="search-bar-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </span>
            <input className="input" placeholder="Cari tanaman..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="filter-tabs">
            <button className={`filter-tab ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory('')}>Semua</button>
            {categories.map(cat => (
              <button key={cat.id}
                className={`filter-tab ${String(activeCategory) === String(cat.id) ? 'active' : ''}`}
                onClick={() => setActiveCategory(String(cat.id))}>{cat.name}</button>
            ))}
          </div>

          <span style={{ color: 'var(--muted)', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {filtered.length} produk
          </span>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            <span>Gagal memuat.</span>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={loadProducts}>Coba lagi</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" style={{ opacity: 0.3, color: 'var(--green)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Tidak ada produk ditemukan</h3>
            <p>Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 }}>
            {filtered.map(product => (
              <div key={product.id} className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
                <div className="product-card-img" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', color: 'var(--green)',
                }}>
                  <PlantImage product={product} />
                </div>
                <div className="product-card-body">
                  <div className="product-card-cat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: '10px', fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)', background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      padding: '1px 5px', borderRadius: 4, lineHeight: 1.6,
                    }}>#{product.id}</span>
                    {product.category_name}
                  </div>
                  <div className="product-card-name">{product.name}</div>
                  <div className={`product-card-stock ${
                    product.stock_quantity === 0 ? 'out' : product.stock_quantity <= 3 ? 'low' : ''
                  }`}>
                    {product.stock_quantity === 0 ? 'Stok habis'
                      : product.stock_quantity <= 3 ? `Sisa ${product.stock_quantity}`
                      : `Stok: ${product.stock_quantity}`}
                  </div>
                  <div className="product-card-price">{rupiah(product.price)}</div>
                  <button
                    className={`btn btn-sm btn-full ${product.stock_quantity === 0 ? 'btn-outline' : 'btn-primary'}`}
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

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
