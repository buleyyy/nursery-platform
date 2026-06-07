import { useState, useEffect, useRef } from 'react';
import { api, rupiah } from '../utils/api';

// Gambar produk — cukup path relatif (proxy Vite menghandle /api/*)
const EMPTY_FORM = {
  name: '', description: '', price: '',
  stock_quantity: '', category_id: '',
  care_instructions: '', product_code: '',
};

// ─── Badge colours per category ───────────────────────────────────────────────
const BADGE_PALETTE = [
  { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' }, // purple
  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }, // blue
  { bg: '#fef3c7', color: '#b45309', border: '#fde68a' }, // amber
  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }, // green
  { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' }, // rose
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }, // orange
  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }, // emerald
  { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' }, // sky
];
const getBadgeColor = (categoryId) => BADGE_PALETTE[(Math.max(0, Number(categoryId) - 1)) % BADGE_PALETTE.length];

// Helper: tampilkan gambar produk (foto atau fallback daun SVG)
export function ProductImage({ product, size = 40, style = {} }) {
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', display: 'block', ...style }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'var(--green-dim)', color: 'var(--green)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <svg viewBox="0 0 24 24" fill="none" width={size * 0.55} height={size * 0.55}>
        <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor" opacity=".7"/>
        <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [imageFile,  setImageFile]  = useState(null);   // File object untuk upload
  const [imagePreview, setImagePreview] = useState(null); // URL preview lokal
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch produk dan kategori secara terpisah agar error satu tidak memblokir yang lain
      const [prodRes, catRes] = await Promise.allSettled([
        api.adminProducts(),
        api.adminCategories(),
      ]);

      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value.data || []);
      } else {
        console.error('Gagal load produk:', prodRes.reason?.message);
        setError(prodRes.reason?.message || 'Gagal memuat produk');
      }

      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value.data || []);
      } else {
        console.error('Gagal load kategori:', catRes.reason?.message);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setModal('add');
  };

  const openEdit = (product) => {
    setForm({
      name:              product.name || '',
      description:       product.description || '',
      price:             product.price || '',
      stock_quantity:    product.stock_quantity || '',
      category_id:       product.category_id || '',
      care_instructions: product.care_instructions || '',
      product_code:      product.product_code || '',
    });
    setSelected(product);
    setImageFile(null);
    setImagePreview(product.image_url || null);
    setError(null);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB');
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        price:          Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        category_id:    Number(form.category_id),
        product_code:   form.product_code.trim() || null,
      };

      let productId = selected?.id;

      if (modal === 'add') {
        const res = await api.createProduct(payload);
        productId = res.id;
      } else {
        await api.updateProduct(selected.id, payload);
      }

      // Upload foto kalau ada file baru
      if (imageFile && productId) {
        await api.uploadProductImage(productId, imageFile);
      }

      closeModal();
      loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus produk "${name}"?\nProduk tidak akan muncul lagi di katalog.`)) return;
    setDeleting(id);
    try {
      const res = await api.deleteProduct(id);
      if (!res.success) throw new Error(res.message || 'Gagal hapus');
      // Reload dari server — satu-satunya sumber kebenaran
      await loadData();
    } catch (e) {
      alert('Gagal hapus: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 600, marginBottom: 3 }}>
            Manajemen Produk
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>{products.length} produk terdaftar</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Produk</button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-bar-icon">⌕</span>
        <input
          className="input" placeholder="Cari produk..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error banner (produk gagal load tapi kategori tetap bisa dipakai) */}
      {error && !loading && (
        <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚠ {error}</span>
          <button className="btn btn-sm btn-ghost" onClick={loadData}>Coba lagi</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon" style={{ color: 'var(--green)', opacity: 0.4 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor"/>
                    <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
          <h3>Belum ada produk</h3>
          <p>Tambahkan produk pertama kamu.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}>+ Tambah Produk</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>ID Produk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const stockLow = product.stock_quantity <= 3 && product.stock_quantity > 0;
                const stockOut = product.stock_quantity === 0;
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductImage product={product} size={40} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '13.5px' }}>{product.name}</div>
                          {product.description && (
                            <div style={{
                              fontSize: '12px', color: 'var(--muted)',
                              maxWidth: 260, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{product.description}</div>
                          )}
                          {/* Stock badge */}
                          <div style={{ marginTop: 3 }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, fontFamily: 'var(--font-mono)',
                              padding: '1px 6px', borderRadius: 4,
                              color: stockOut ? 'var(--danger)' : stockLow ? 'var(--warn)' : 'var(--muted)',
                              background: stockOut ? 'var(--danger-dim)' : stockLow ? 'var(--warn-dim)' : 'var(--elevated)',
                            }}>
                              📦 {product.stock_quantity} unit
                              {stockOut && ' · Habis'}
                              {!stockOut && stockLow && ' · Hampir habis'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: 'var(--green-2)', fontWeight: 600 }}>
                        {product.category_name}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px' }}>
                        {rupiah(product.price)}
                      </span>
                    </td>
                    <td>
                      {/* Colored ID badge */}
                      {(() => {
                        const badge = getBadgeColor(product.category_id);
                        const code = product.product_code || `#${String(product.id).padStart(3,'0')}`;
                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: 999,
                            fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            background: badge.bg, color: badge.color,
                            border: `1px solid ${badge.border}`,
                            letterSpacing: '0.03em',
                          }}>{code}</span>
                        );
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(product)}>Edit</button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === product.id}
                          onClick={() => handleDelete(product.id, product.name)}
                        >{deleting === product.id ? '...' : 'Hapus'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.05rem' }}>
                {modal === 'add' ? 'Tambah Produk Baru' : `Edit — ${selected?.name}`}
              </h2>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={closeModal}>×</button>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Foto Produk */}
              <div className="form-group">
                <label className="form-label">Foto Produk</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 10,
                    padding: imagePreview ? 0 : '20px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                    background: 'var(--elevated)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: '0.15s',
                        color: '#fff', fontSize: '13px', fontWeight: 600,
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                      >
                        Ganti Foto
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--muted)' }}>
                      <div style={{ marginBottom: 6 }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', opacity: 0.4 }}>
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M3 16l5-4 4 3.5 3-2.5 6 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>Klik untuk upload foto</div>
                      <div style={{ fontSize: '11px', marginTop: 3 }}>JPG, PNG — maks. 5 MB</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImagePick}
                />
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Nama Produk *</label>
                  <input className="input" name="name" required
                    placeholder="Anggrek Bulan"
                    value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori *</label>
                  <select className="select" name="category_id" required
                    value={form.category_id} onChange={handleChange}>
                    <option value="">Pilih kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Harga (Rp) *</label>
                  <input className="input" name="price" required type="number" min="0"
                    placeholder="75000" value={form.price} onChange={handleChange}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    ID Produk
                    {form.product_code && (() => {
                      const b = getBadgeColor(form.category_id);
                      return (
                        <span style={{
                          padding: '1px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: b.bg, color: b.color, border: `1px solid ${b.border}`,
                        }}>{form.product_code}</span>
                      );
                    })()}
                  </label>
                  <input className="input" name="product_code"
                    placeholder="Contoh: ANK-001, BONSAI-02"
                    value={form.product_code} onChange={handleChange}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Kode unik produk (opsional)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stok *</label>
                <input className="input" name="stock_quantity" required type="number" min="0"
                  placeholder="10" value={form.stock_quantity} onChange={handleChange}
                  style={{ fontFamily: 'var(--font-mono)', maxWidth: 180 }} />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="textarea" name="description" rows={2}
                  placeholder="Deskripsi singkat produk..."
                  value={form.description} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Cara Perawatan</label>
                <textarea className="textarea" name="care_instructions" rows={2}
                  placeholder="Contoh: Siram 2x seminggu, hindari sinar matahari langsung..."
                  value={form.care_instructions} onChange={handleChange} />
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Menyimpan...' : modal === 'add' ? '+ Tambah Produk' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
