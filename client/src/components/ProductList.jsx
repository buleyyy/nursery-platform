/**
 * components/ProductList.jsx
 * Komponen reusable daftar produk — dipakai di halaman publik maupun admin.
 * Mendukung mode grid (user) dan mode tabel (admin).
 */
import { rupiah } from '../utils/api';

// Gambar produk dengan fallback SVG
function ProductImage({ product, size = 48 }) {
  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: 'var(--green-dim)', color: 'var(--green)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 24 24" fill="none" width={size * 0.55} height={size * 0.55}>
        <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor" opacity=".7"/>
        <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

/**
 * mode: 'grid' (default) | 'table'
 * onSelect: callback saat produk diklik/dipilih
 * onDelete: callback saat tombol hapus diklik (mode table, admin only)
 */
export default function ProductList({
  products = [],
  mode = 'grid',
  onSelect,
  onDelete,
  loading = false,
}) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        Memuat produk...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon" style={{ color: 'var(--green)', opacity: 0.35 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C12 3 6 8 6 13.5a6 6 0 0012 0C18 8 12 3 12 3z" fill="currentColor"/>
            <path d="M12 13.5V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3>Belum ada produk</h3>
        <p>Produk yang ditambahkan akan muncul di sini.</p>
      </div>
    );
  }

  if (mode === 'table') {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              {onDelete && <th></th>}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}
                style={{ cursor: onSelect ? 'pointer' : 'default' }}
                onClick={() => onSelect?.(p)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProductImage product={p} size={36} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{p.name}</div>
                      {p.description && (
                        <div style={{
                          fontSize: '12px', color: 'var(--muted)',
                          maxWidth: 240, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{p.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '12.5px', color: 'var(--green-2)', fontWeight: 600 }}>
                  {p.category_name}
                </td>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {rupiah(p.price)}
                </td>
                <td>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                    color: p.stock_quantity === 0 ? 'var(--danger)'
                         : p.stock_quantity <= 3  ? 'var(--warn)'
                         : 'var(--muted)',
                  }}>
                    {p.stock_quantity} unit
                  </span>
                </td>
                {onDelete && (
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(p.id, p.name)}
                    >
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // mode === 'grid'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {products.map(p => (
        <div
          key={p.id}
          className="product-card"
          onClick={() => onSelect?.(p)}
          style={{ cursor: onSelect ? 'pointer' : 'default' }}
        >
          <div className="product-card-img">
            <ProductImage product={p} size={80} />
          </div>
          <div className="product-card-body">
            <div className="product-card-cat">{p.category_name}</div>
            <div className="product-card-name">{p.name}</div>
            <div className={`product-card-stock ${
              p.stock_quantity === 0 ? 'out' : p.stock_quantity <= 3 ? 'low' : ''
            }`}>
              {p.stock_quantity === 0 ? 'Stok habis'
                : p.stock_quantity <= 3 ? `Sisa ${p.stock_quantity}`
                : `Stok: ${p.stock_quantity}`}
            </div>
            <div className="product-card-price">{rupiah(p.price)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}