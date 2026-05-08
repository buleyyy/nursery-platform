import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const EMPTY_FORM = { name: '', description: '', icon: '' };

const CATEGORY_ICONS = [
  '🌺', '🌸', '🌼', '🌻', '🌹', '🌷',
  '🌿', '🍀', '🌱', '🪴', '🌵', '🎋',
  '🎍', '🌴', '🌲', '🌳', '🍃', '🌾',
  '🪷', '🌙', '⭐', '🏡', '🎑', '🫚',
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | 'add' | 'edit'
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [error,      setError]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const [search,     setSearch]     = useState('');

  useEffect(() => { loadData(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.adminCategories();
      setCategories(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSelected(null);
    setError(null);
    setModal('add');
  };

  const openEdit = (cat) => {
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      icon:        cat.icon        || '',
    });
    setSelected(cat);
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
    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (modal === 'add') {
        await api.createCategory(form);
        showToast('Kategori berhasil ditambahkan');
      } else {
        await api.updateCategory(selected.id, form);
        showToast('Kategori berhasil diupdate');
      }
      closeModal();
      loadData();
    } catch (e) {
      setError(e.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus kategori "${name}"?\n\nPastikan tidak ada produk yang menggunakan kategori ini.`)) return;
    setDeleting(id);
    try {
      await api.deleteCategory(id);
      showToast('Kategori berhasil dihapus');
      loadData();
    } catch (e) {
      showToast('Gagal hapus: ' + (e.message || 'Error'), 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '28px 28px 64px' }}>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--green-3)',
        }}>
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.7rem', fontWeight: 600, marginBottom: 3,
          }}>Manajemen Kategori</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            {categories.length} kategori terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Tambah Kategori
        </button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-bar-icon">⌕</span>
        <input
          className="input"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">🏷️</div>
          <h3>Belum ada kategori</h3>
          <p>Tambahkan kategori produk pertama kamu.</p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={openAdd}>
            + Tambah Kategori
          </button>
        </div>
      ) : (
        <>
          {/* Category Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            {filtered.map(cat => (
              <div key={cat.id} className="card" style={{
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--green)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,140,78,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}>
                {/* Top */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--green-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', flexShrink: 0,
                  }}>
                    {cat.icon || '🏷️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14.5px', marginBottom: 2 }}>
                      {cat.name}
                    </div>
                    {cat.product_count !== undefined && (
                      <div style={{
                        fontSize: '11.5px', color: 'var(--green-2)',
                        fontWeight: 600,
                      }}>
                        {cat.product_count} produk
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(cat)}
                    >Edit</button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={deleting === cat.id}
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      {deleting === cat.id ? '...' : 'Hapus'}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {cat.description && (
                  <p style={{
                    fontSize: '12.5px', color: 'var(--muted)',
                    lineHeight: 1.55, margin: 0,
                  }}>
                    {cat.description}
                  </p>
                )}

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  paddingTop: 10, borderTop: '1px solid var(--border)',
                  gap: 6,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10.5px', color: 'var(--muted)',
                  }}>
                    ID #{cat.id}
                  </span>
                  {cat.created_at && (
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>
                      {new Date(cat.created_at).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table view */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                Semua Kategori ({filtered.length})
              </h3>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Kategori</th>
                    <th>Deskripsi</th>
                    <th>Produk</th>
                    <th>Dibuat</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cat => (
                    <tr key={cat.id}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11.5px', color: 'var(--muted)',
                        }}>#{cat.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ fontSize: '1.3rem' }}>{cat.icon || '🏷️'}</span>
                          <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{cat.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '12.5px', color: 'var(--muted)',
                          maxWidth: 200, display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {cat.description || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px', fontWeight: 600, color: 'var(--green-2)',
                        }}>
                          {cat.product_count ?? '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {cat.created_at ? new Date(cat.created_at).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={deleting === cat.id}
                            onClick={() => handleDelete(cat.id, cat.name)}
                          >
                            {deleting === cat.id ? '...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Add / Edit */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20,
            }}>
              <h2 style={{ fontSize: '1.05rem' }}>
                {modal === 'add' ? '+ Tambah Kategori' : `Edit — ${selected?.name}`}
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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Icon picker */}
              <div className="form-group">
                <label className="form-label">Icon Kategori</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORY_ICONS.map(ic => (
                    <button
                      key={ic} type="button"
                      onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{
                        width: 36, height: 36, fontSize: '1.25rem',
                        background: form.icon === ic ? 'var(--green-dim)' : 'var(--elevated)',
                        border: form.icon === ic
                          ? '1.5px solid rgba(82,214,138,0.5)'
                          : '1px solid var(--border)',
                        borderRadius: 7, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{ic}</button>
                  ))}
                </div>
                {form.icon && (
                  <div style={{ marginTop: 6, fontSize: '12px', color: 'var(--muted)' }}>
                    Dipilih: {form.icon}
                  </div>
                )}
              </div>

              {/* Nama */}
              <div className="form-group">
                <label className="form-label">Nama Kategori *</label>
                <input
                  className="input" name="name" required
                  placeholder="mis. Tanaman Hias, Kaktus, Anggrek..."
                  value={form.name} onChange={handleChange}
                />
              </div>

              {/* Deskripsi */}
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="textarea" name="description" rows={3}
                  placeholder="Deskripsi singkat kategori ini..."
                  value={form.description} onChange={handleChange}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }}
                  onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}
                  disabled={saving}>
                  {saving
                    ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Menyimpan...</>
                    : modal === 'add' ? '+ Tambah Kategori' : '✓ Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
