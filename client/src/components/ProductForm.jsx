/**
 * components/ProductForm.jsx
 * Form tambah/edit produk — reusable untuk modal admin.
 * Gunakan: <ProductForm categories={[]} onSave={fn} onCancel={fn} />
 */
import { useState } from 'react';
import { api } from '../utils/api';

const EMPTY = {
  name: '', description: '', price: '',
  stock_quantity: '', category_id: '',
  care_instructions: '', product_code: '',
};

export default function ProductForm({ categories = [], onSave, onCancel, initial = null }) {
  const [form,    setForm]    = useState(initial ? {
    name:              initial.name              || '',
    description:       initial.description       || '',
    price:             initial.price             || '',
    stock_quantity:    initial.stock_quantity    || '',
    category_id:       initial.category_id       || '',
    care_instructions: initial.care_instructions || '',
    product_code:      initial.product_code      || '',
  } : EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) {
      setError('Nama, harga, dan kategori wajib diisi');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price:          Number(form.price),
        stock_quantity: Number(form.stock_quantity || 0),
        category_id:    Number(form.category_id),
        product_code:   form.product_code.trim() || null,
      };
      if (initial?.id) {
        await api.updateProduct(initial.id, payload);
      } else {
        const res = await api.createProduct(payload);
        payload.id = res.id;
      }
      onSave?.(payload);
    } catch (e) {
      setError(e.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div className="alert alert-danger">⚠ {error}</div>
      )}

      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Nama Produk *</label>
          <input className="input" name="name" required
            placeholder="Anggrek Bulan" value={form.name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Kategori *</label>
          <select className="select" name="category_id" required
            value={form.category_id} onChange={handleChange}>
            <option value="">Pilih kategori</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
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
          <label className="form-label">Stok</label>
          <input className="input" name="stock_quantity" type="number" min="0"
            placeholder="10" value={form.stock_quantity} onChange={handleChange}
            style={{ fontFamily: 'var(--font-mono)' }} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">ID Produk (SKU)</label>
        <input className="input" name="product_code"
          placeholder="Contoh: ANK-001" value={form.product_code} onChange={handleChange}
          style={{ fontFamily: 'var(--font-mono)' }} />
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
          placeholder="Siram 2x seminggu..."
          value={form.care_instructions} onChange={handleChange} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
            Batal
          </button>
        )}
        <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
          {saving ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : '+ Tambah Produk'}
        </button>
      </div>
    </form>
  );
}