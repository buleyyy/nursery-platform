import { useState, useEffect } from 'react';
import { api, rupiah } from '../utils/api';

const EMPTY_FORM = {
  name: '', description: '', price: '',
  stock_quantity: '', category_id: '', image_emoji: '',
  care_instructions: '',
};

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | 'add' | 'edit'
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.adminProducts(),
        api.adminCategories(),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
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
      image_emoji:       product.image_emoji || '',
      care_instructions: product.care_instructions || '',
    });
    setSelected(product);
    setError(null);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError(null);
  };

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        price:          Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        category_id:    Number(form.category_id),
      };
      if (modal === 'add') {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(selected.id, payload);
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
    if (!window.confirm(`Hapus produk "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (e) {
      alert('Gagal hapus: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const EMOJIS = ['🌿', '🌱', '🌺', '🌸', '🌼', '🌻', '🍀', '🎋', '🎍', '🌾', '🪴', '🌵', '🌴', '🌲', '🌳'];

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.7rem', fontWeight: 600, marginBottom: 3,
          }}>Manajemen Produk</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            {products.length} produk terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-bar-icon">⌕</span>
        <input
          className="input"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">🌱</div>
          <h3>Belum ada produk</h3>
          <p>Tambahkan produk pertama kamu.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}>
            + Tambah Produk
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
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
                        <span style={{ fontSize: '1.6rem' }}>{product.image_emoji || '🌿'}</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '13.5px' }}>{product.name}</div>
                          {product.description && (
                            <div style={{
                              fontSize: '12px', color: 'var(--muted)',
                              maxWidth: 260,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '11.5px', color: 'var(--green-2)',
                        fontWeight: 600,
                      }}>{product.category_name}</span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600, fontSize: '14px',
                      }}>{rupiah(product.price)}</span>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: stockOut ? 'var(--danger)' : stockLow ? 'var(--warn)' : 'var(--text-2)',
                        fontWeight: stockOut || stockLow ? 600 : 400,
                      }}>
                        {product.stock_quantity}
                        {stockLow && ' ⚠'}
                        {stockOut && ' ✕'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(product)}
                        >Edit</button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deleting === product.id}
                          onClick={() => handleDelete(product.id, product.name)}
                        >
                          {deleting === product.id ? '...' : 'Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20,
            }}>
              <h2 style={{ fontSize: '1.05rem' }}>
                {modal === 'add' ? 'Tambah Produk Baru' : `Edit — ${selected?.name}`}
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '16px' }}
                onClick={closeModal}
              >×</button>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: 14 }}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Emoji picker */}
              <div className="form-group">
                <label className="form-label">Emoji Produk</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMOJIS.map(em => (
                    <button
                      key={em} type="button"
                      onClick={() => setForm(f => ({ ...f, image_emoji: em }))}
                      style={{
                        width: 36, height: 36, fontSize: '1.3rem',
                        background: form.image_emoji === em ? 'var(--green-dim)' : 'var(--elevated)',
                        border: form.image_emoji === em
                          ? '1.5px solid rgba(82,214,138,0.5)'
                          : '1px solid var(--border)',
                        borderRadius: 7, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{em}</button>
                  ))}
                </div>
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
                    placeholder="75000"
                    value={form.price} onChange={handleChange}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok *</label>
                  <input className="input" name="stock_quantity" required type="number" min="0"
                    placeholder="10"
                    value={form.stock_quantity} onChange={handleChange}
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
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
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }}
                  onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}
                  disabled={saving}>
                  {saving
                    ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Menyimpan...</>
                    : modal === 'add' ? '+ Tambah Produk' : '✓ Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
