import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cart } from '../utils/api';

export default function UserLayout({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { setCartCount(cart.count()); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%',
        background: scrolled ? 'rgba(8,15,11,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--green-dim)',
            border: '1px solid rgba(82,214,138,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>🌿</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '1.05rem',
            color: 'var(--text)', letterSpacing: '-0.2px',
          }}>Ali Nursery</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { to: '/',       label: 'Katalog' },
            { to: '/track',  label: 'Lacak Pesanan' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: isActive(to) ? 'var(--text)' : 'var(--text-2)',
              fontSize: '13.5px', fontWeight: 500,
              textDecoration: 'none',
              padding: '5px 12px',
              borderRadius: 6,
              background: isActive(to) ? 'var(--elevated)' : 'transparent',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => !isActive(to) && (e.target.style.color = 'var(--text)')}
            onMouseLeave={e => !isActive(to) && (e.target.style.color = 'var(--text-2)')}
            >{label}</Link>
          ))}
        </div>

        {/* Cart button */}
        <button
          onClick={() => navigate('/checkout')}
          className="btn btn-outline btn-sm"
          style={{ gap: 7, paddingLeft: 12 }}
        >
          <span className="cart-badge">
            <span style={{ fontSize: '15px' }}>🛒</span>
            {cartCount > 0 && (
              <span className="cart-badge-count">{cartCount}</span>
            )}
          </span>
          <span style={{ fontSize: '13px', color: cartCount > 0 ? 'var(--text)' : 'var(--text-2)' }}>
            {cartCount > 0 ? `${cartCount} item` : 'Keranjang'}
          </span>
        </button>
      </nav>

      <main>{children}</main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '28px 6%',
        marginTop: 80,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '13px' }}>🌿</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '0.95rem',
            color: 'var(--text-2)',
          }}>Ali Nursery</span>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
          © 2026 Ali Nursery · Tanaman hias premium
        </p>

        <div style={{ display: 'flex', gap: 18 }}>
          <Link to="/"      style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Katalog</Link>
          <Link to="/track" style={{ color: 'var(--muted)', fontSize: '12.5px' }}>Lacak Pesanan</Link>
        </div>
      </footer>
    </>
  );
}
