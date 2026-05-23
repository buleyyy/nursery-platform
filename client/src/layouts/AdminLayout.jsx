import { Link, useNavigate, useLocation } from 'react-router-dom';

// SVG icons — simple & consistent, no emoji
const icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".6"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".6"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/></svg>,
  report:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12L5.5 8l3 3L14 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  orders:    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  payment:   <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 7h13" stroke="currentColor" strokeWidth="1.5"/><rect x="4" y="9.5" width="3" height="1.5" rx=".5" fill="currentColor"/></svg>,
  products:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14 5v6L8 14.5 2 11V5L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 1.5v13M2 5l6 3.5L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  category:  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
};

const navItems = [
  { path: '/admin',              icon: icons.dashboard, label: 'Dashboard' },
  { path: '/admin/sales-report', icon: icons.report,    label: 'Laporan' },
  { path: '/admin/orders',       icon: icons.orders,    label: 'Pesanan' },
  { path: '/admin/payments',     icon: icons.payment,   label: 'Pembayaran' },
  { path: '/admin/products',     icon: icons.products,  label: 'Produk' },
  { path: '/admin/categories',   icon: icons.category,  label: 'Kategori' },
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 218, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1.5px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '2px 0 12px rgba(0,60,20,0.05)',
      }}>
        {/* Brand */}
        <div style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(45,140,78,0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C9 2 4 6 4 10.5a5 5 0 0010 0C14 6 9 2 9 2z" fill="white" opacity=".9"/>
                <path d="M9 10.5V16" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: '1rem',
                color: 'var(--text)',
              }}>H. Ali Nursery</div>
              <div style={{
                fontSize: '10px', color: 'var(--muted)',
                fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{
            fontSize: '10px', color: 'var(--muted)',
            fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '8px 8px 6px',
          }}>Navigasi</div>

          {navItems.map(({ path, icon, label }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 9,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: '13.5px', fontWeight: active ? 700 : 500,
                color:      active ? 'var(--green)'     : 'var(--text-2)',
                background: active ? 'var(--green-dim)' : 'transparent',
                transition: 'all 0.15s',
                borderLeft: active ? '3px solid var(--green)' : '3px solid transparent',
              }}>
                <span style={{ opacity: active ? 1 : 0.5, display: 'flex' }}>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: '12px 10px',
          borderTop: '1px solid var(--border)',
          background: '#fafdf9',
        }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 8,
            background: 'transparent', border: 'none',
            color: 'var(--muted)', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fee2e2';
            e.currentTarget.style.color = '#b91c1c';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--muted)';
          }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{flexShrink:0}}><path d="M6 3L2 7.5L6 12M2 7.5h11V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
