import { Link, useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/admin',          icon: '◈',  label: 'Dashboard' },
  { path: '/admin/orders',   icon: '≡',  label: 'Pesanan' },
  { path: '/admin/payments', icon: '◇',  label: 'Pembayaran' },
  { path: '/admin/products', icon: '❋',  label: 'Produk' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 210, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{
          padding: '18px 18px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--green-dim)',
              border: '1px solid rgba(82,214,138,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px',
            }}>🌿</div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600, fontSize: '0.95rem',
              color: 'var(--text)',
            }}>Ali Nursery</span>
          </div>
          <div style={{
            fontSize: '10.5px', color: 'var(--muted)',
            fontWeight: 500, letterSpacing: '0.07em',
            textTransform: 'uppercase', paddingLeft: 35,
          }}>Admin Panel</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 10px', flex: 1 }}>
          <div style={{
            fontSize: '10px', color: 'var(--muted)',
            fontWeight: 600, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '8px 8px 4px',
          }}>Menu</div>

          {navItems.map(({ path, icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px',
                borderRadius: 7,
                marginBottom: 1,
                textDecoration: 'none',
                fontSize: '13.5px', fontWeight: active ? 600 : 400,
                color:      active ? 'var(--green)' : 'var(--text-2)',
                background: active ? 'var(--green-dim)' : 'transparent',
                transition: 'all 0.15s',
                borderLeft: active ? '2px solid var(--green)' : '2px solid transparent',
              }}>
                <span style={{ fontSize: '16px', opacity: active ? 1 : 0.6 }}>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 7,
            background: 'transparent', border: 'none',
            color: 'var(--muted)', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--elevated)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            <span style={{ fontSize: '14px' }}>↩</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  );
}
