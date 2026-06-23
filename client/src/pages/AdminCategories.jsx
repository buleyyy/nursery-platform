import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const EMPTY_FORM = { name: '', description: '', icon: '' };

// Sketchy hand-drawn SVG icons — stored as key in DB
const CATEGORY_ICONS = [
  {
    key: 'plant',
    label: 'tanaman',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20c0 0-.5-7 0-10" strokeDasharray="1 0.5"/>
        <path d="M12 14c-1.5-3-5-4-5-2 1 1 3 2 5 2z" strokeDasharray="1 0.3"/>
        <path d="M12 11c1.5-3 5-4 5-2-1 1-3 2-5 2z" strokeDasharray="1 0.3"/>
        <path d="M9 20h6" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'flower',
    label: 'bunga',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="2.5" strokeDasharray="1 0.4"/>
        <path d="M12 7.5c0-2-1.5-3.5-1.5-3.5s-1.5 1.5-1.5 3.5" strokeDasharray="1 0.4"/>
        <path d="M12 7.5c0-2 1.5-3.5 1.5-3.5s1.5 1.5 1.5 3.5" strokeDasharray="1 0.4"/>
        <path d="M9.5 10c-2 0-3.5-1.5-3.5-1.5s1.5-1.5 3.5-1.5" strokeDasharray="1 0.4"/>
        <path d="M14.5 10c2 0 3.5-1.5 3.5-1.5s-1.5-1.5-3.5-1.5" strokeDasharray="1 0.4"/>
        <path d="M12 12.5c0 2-1.5 3.5-1.5 3.5s-1.5-1.5-1.5-3.5" strokeDasharray="1 0.4"/>
        <path d="M12 12.5c0 2 1.5 3.5 1.5 3.5s1.5-1.5 1.5-3.5" strokeDasharray="1 0.4"/>
        <path d="M12 16v4" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'leaf',
    label: 'daun',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21V9c0 0-6-1-7 5 0 4 4 7 7 7z" strokeDasharray="1 0.4"/>
        <path d="M12 12c1.5-3 5.5-5 6-3-1 2-3.5 4-6 3" strokeDasharray="1 0.3"/>
        <path d="M7 16c1-1 3-1 4 0" strokeDasharray="1 0.5" strokeOpacity="0.6"/>
      </svg>
    ),
  },
  {
    key: 'cactus',
    label: 'kaktus',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V6" strokeDasharray="1 0.5"/>
        <path d="M12 10c0 0-3 0-3-3V5" strokeDasharray="1 0.4"/>
        <path d="M12 13c0 0 3 0 3-3V8" strokeDasharray="1 0.4"/>
        <path d="M9 20h6" strokeDasharray="1 0.5"/>
        <path d="M11 7l.5-.5M13 9l.5-.5M10 12l-.5.3" strokeDasharray="1 0.3" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    key: 'tree',
    label: 'pohon',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V12" strokeDasharray="1 0.5"/>
        <path d="M7 14c0-4 8-5 8-1-2.5 0-5.5 1-6 3" strokeDasharray="1 0.4"/>
        <path d="M9 10c0-4 6-5 6-1-2 0-4.5 1-5 3" strokeDasharray="1 0.4"/>
        <path d="M9 20h6" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'pot',
    label: 'pot',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 20h8M10 20v-3c0-1.5 1-3 2-3s2 1.5 2 3v3" strokeDasharray="1 0.4"/>
        <path d="M7 14c0-3 2-5 5-5s5 2 5 5" strokeDasharray="1 0.4"/>
        <path d="M9 10c1-2 5-2 6 0" strokeDasharray="1 0.3" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    key: 'droplet',
    label: 'air',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4c0 0-6 5-6 10a6 6 0 0 0 12 0c0-5-6-10-6-10z" strokeDasharray="1 0.4"/>
        <path d="M10 16c1 1 3 1 4 0" strokeDasharray="1 0.4" strokeOpacity="0.6"/>
      </svg>
    ),
  },
  {
    key: 'sun',
    label: 'outdoor',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" strokeDasharray="1 0.4"/>
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeDasharray="1 0.5"/>
        <path d="M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'sprout',
    label: 'bibit',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" strokeDasharray="1 0.5"/>
        <path d="M9 13c0-4 6-5 6-1-2 0-4 1-4 3" strokeDasharray="1 0.4"/>
        <path d="M15 10c0-4-6-5-6-1 2 0 4 1 4 3" strokeDasharray="1 0.4"/>
        <path d="M9 20h6" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'palm',
    label: 'palem',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" strokeDasharray="1 0.5"/>
        <path d="M12 10c0 0-4-1-5-4 2 0 4 1 5 4z" strokeDasharray="1 0.4"/>
        <path d="M12 10c0 0 4-1 5-4-2 0-4 1-5 4z" strokeDasharray="1 0.4"/>
        <path d="M12 13c0 0-3 0-4-3 2 0 3 1 4 3z" strokeDasharray="1 0.4"/>
        <path d="M12 13c0 0 3 0 4-3-2 0-3 1-4 3z" strokeDasharray="1 0.4"/>
        <path d="M10 20h4" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'bamboo',
    label: 'bambu',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 20V4" strokeDasharray="1 0.5"/>
        <path d="M14 20V7" strokeDasharray="1 0.5"/>
        <path d="M10 7h4" strokeDasharray="1 0.4"/>
        <path d="M10 12h4" strokeDasharray="1 0.4"/>
        <path d="M10 17h4" strokeDasharray="1 0.4"/>
        <path d="M10 5c-1.5-1-2-1.5-1-2" strokeDasharray="1 0.4"/>
        <path d="M14 8c1.5-1 2-1.5 1-2" strokeDasharray="1 0.4"/>
      </svg>
    ),
  },
  {
    key: 'herb',
    label: 'herbal',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V8" strokeDasharray="1 0.5"/>
        <path d="M8 12c0 0 1-5 4-4" strokeDasharray="1 0.4"/>
        <path d="M16 10c0 0-1-5-4-4" strokeDasharray="1 0.4"/>
        <path d="M7 16c0 0 2-4 5-3" strokeDasharray="1 0.4"/>
        <path d="M17 15c0 0-2-4-5-3" strokeDasharray="1 0.4"/>
        <path d="M10 20h4" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'rose',
    label: 'mawar',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5c0 0-3 2-3 4s2 3 3 3 3-1 3-3-3-4-3-4z" strokeDasharray="1 0.4"/>
        <path d="M9 9c-2 0-3 2-2 4s3 2 5 2" strokeDasharray="1 0.4"/>
        <path d="M15 9c2 0 3 2 2 4s-3 2-5 2" strokeDasharray="1 0.4"/>
        <path d="M12 15v5" strokeDasharray="1 0.5"/>
        <path d="M10 17l-1 1" strokeDasharray="1 0.4" strokeOpacity="0.6"/>
      </svg>
    ),
  },
  {
    key: 'vine',
    label: 'merambat',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 20c2-3 5-5 7-8" strokeDasharray="1 0.4"/>
        <path d="M12 12c0 0 2-3 5-3" strokeDasharray="1 0.4"/>
        <path d="M12 12c0 0-2-3 0-6" strokeDasharray="1 0.4"/>
        <path d="M9 16c0 0-3 0-3-3" strokeDasharray="1 0.4"/>
        <circle cx="17" cy="9" r="1.5" strokeDasharray="1 0.4"/>
        <circle cx="12" cy="6" r="1" strokeDasharray="1 0.4"/>
      </svg>
    ),
  },
  {
    key: 'fruit',
    label: 'buah',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 7c-3 0-5 2.5-5 6s2 6 5 6 5-2.5 5-6-2-6-5-6z" strokeDasharray="1 0.4"/>
        <path d="M12 7c0 0 1-3 3-3" strokeDasharray="1 0.4"/>
        <path d="M9 14c1 1.5 5 1.5 6 0" strokeDasharray="1 0.4" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    key: 'orchid',
    label: 'anggrek',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="10" rx="2" ry="3" strokeDasharray="1 0.4"/>
        <path d="M10 8c-1.5-2-4-2-4-2s0 2.5 2 3.5" strokeDasharray="1 0.4"/>
        <path d="M14 8c1.5-2 4-2 4-2s0 2.5-2 3.5" strokeDasharray="1 0.4"/>
        <path d="M10 12c-1 2-3 3-3 3s1.5-2.5 3-3" strokeDasharray="1 0.4"/>
        <path d="M14 12c1 2 3 3 3 3s-1.5-2.5-3-3" strokeDasharray="1 0.4"/>
        <path d="M12 13v7" strokeDasharray="1 0.5"/>
        <path d="M10 20h4" strokeDasharray="1 0.5"/>
      </svg>
    ),
  },
  {
    key: 'fern',
    label: 'pakis',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V7" strokeDasharray="1 0.5"/>
        <path d="M12 9c0 0-3-1-3-4" strokeDasharray="1 0.4"/>
        <path d="M12 9c0 0 3-1 3-4" strokeDasharray="1 0.4"/>
        <path d="M12 13c0 0-3-1-4-3" strokeDasharray="1 0.4"/>
        <path d="M12 13c0 0 3-1 4-3" strokeDasharray="1 0.4"/>
        <path d="M12 17c0 0-2-1-3-2" strokeDasharray="1 0.4"/>
        <path d="M12 17c0 0 2-1 3-2" strokeDasharray="1 0.4"/>
      </svg>
    ),
  },
  {
    key: 'indoor',
    label: 'indoor',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16M6 20V10M18 20V10M4 10l8-6 8 6" strokeDasharray="1 0.4"/>
        <path d="M10 20v-5h4v5" strokeDasharray="1 0.4"/>
        <path d="M12 15v-3c-1.5 0-2.5-1-2-2.5" strokeDasharray="1 0.4"/>
      </svg>
    ),
  },
  {
    key: 'garden',
    label: 'taman',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20h18" strokeDasharray="1 0.4"/>
        <path d="M7 20v-4c0 0 2-3 5-3s5 3 5 3v4" strokeDasharray="1 0.4"/>
        <path d="M12 13V8" strokeDasharray="1 0.5"/>
        <path d="M9 10c1-3 6-3 6 0" strokeDasharray="1 0.4"/>
        <path d="M5 20v-3c1-1 3-1 3 0" strokeDasharray="1 0.4"/>
        <path d="M19 20v-3c-1-1-3-1-3 0" strokeDasharray="1 0.4"/>
      </svg>
    ),
  },
  {
    key: 'seed',
    label: 'benih',
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V14" strokeDasharray="1 0.5"/>
        <path d="M8 17c0-4 8-5 8-1-3 0-5 1-5 3" strokeDasharray="1 0.4"/>
        <ellipse cx="12" cy="10" rx="4" ry="5" strokeDasharray="1 0.4"/>
        <path d="M10 8c1-1 3-1 4 0" strokeDasharray="1 0.3" strokeOpacity="0.5"/>
        <path d="M11 11c0 1 2 1 2 0" strokeDasharray="1 0.3" strokeOpacity="0.5"/>
      </svg>
    ),
  },
];

// Render icon by key — fallback to tag icon
function CategoryIcon({ iconKey, size = 22, color = 'currentColor' }) {
  const found = CATEGORY_ICONS.find(i => i.key === iconKey);
  if (!found) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" strokeDasharray="1 0.4"/>
        <path d="M7 12h.01M12 12h.01M17 12h.01" strokeDasharray="1 0.4"/>
      </svg>
    );
  }
  // Clone SVG with custom size & color
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {found.svg.props.children}
    </svg>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
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
                    flexShrink: 0,
                    color: 'var(--green-2)',
                  }}>
                    <CategoryIcon iconKey={cat.icon} size={26} />
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
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(cat)}>Edit</button>
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
                          <span style={{ color: 'var(--green-2)', display: 'flex' }}>
                            <CategoryIcon iconKey={cat.icon} size={20} />
                          </span>
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
                  {CATEGORY_ICONS.map(ic => {
                    const isSelected = form.icon === ic.key;
                    return (
                      <button
                        key={ic.key}
                        type="button"
                        title={ic.label}
                        onClick={() => setForm(f => ({ ...f, icon: ic.key }))}
                        style={{
                          width: 38, height: 38,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isSelected ? 'var(--green-dim)' : 'var(--elevated)',
                          border: isSelected
                            ? '1.5px solid rgba(82,214,138,0.5)'
                            : '1px solid var(--border)',
                          borderRadius: 8, cursor: 'pointer',
                          transition: 'all 0.15s',
                          color: isSelected ? 'var(--green-2)' : 'var(--text-2)',
                        }}
                      >
                        {ic.svg}
                      </button>
                    );
                  })}
                </div>
                {form.icon && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--green-2)' }}>
                      <CategoryIcon iconKey={form.icon} size={16} />
                    </span>
                    Dipilih: <strong>{CATEGORY_ICONS.find(i => i.key === form.icon)?.label ?? form.icon}</strong>
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
