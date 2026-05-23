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
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'var(--surface)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: '1.5px solid var(--border)',
        boxShadow: scrolled ? '0 2px 16px rgba(0,60,20,0.08)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(45,140,78,0.28)',
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C9 2 4 6 4 10.5a5 5 0 0010 0C14 6 9 2 9 2z" fill="white" opacity=".9"/>
              <path d="M9 10.5V16" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: '1.1rem',
            color: 'var(--text)', letterSpacing: '-0.2px',
          }}>H. Ali Nursery</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { to: '/',       label: 'Katalog' },
            { to: '/track',  label: 'Lacak Pesanan' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: isActive(to) ? 'var(--green)' : 'var(--text-2)',
              fontSize: '13.5px', fontWeight: isActive(to) ? 700 : 500,
              textDecoration: 'none',
              padding: '5px 13px',
              borderRadius: 7,
              background: isActive(to) ? 'var(--green-light)' : 'transparent',
              transition: 'all 0.18s',
            }}>{label}</Link>
          ))}
        </div>

        {/* Cart button — keranjang + jumlah + "item", tanpa bubble */}
        <button
          onClick={() => navigate('/checkout')}
          className="btn btn-sm"
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            paddingLeft: 13, paddingRight: 14,
            background: cartCount > 0 ? 'var(--green)' : 'var(--elevated)',
            color: cartCount > 0 ? '#fff' : 'var(--text-2)',
            border: '1.5px solid',
            borderColor: cartCount > 0 ? 'var(--green)' : 'var(--border)',
            boxShadow: cartCount > 0 ? '0 2px 8px rgba(45,140,78,0.25)' : 'none',
          }}
        >
          {/* Icon keranjang */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 1.5h2.2l2.1 7.5h6.5l1.7-5.2H5.2" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="7.2" cy="13" r="1.1" fill="currentColor"/>
            <circle cx="12" cy="13" r="1.1" fill="currentColor"/>
          </svg>

          {/* Jumlah + label — menyamping, tidak ada bubble */}
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.1px' }}>
            {cartCount > 0 ? `${cartCount} item` : 'Keranjang'}
          </span>
        </button>
      </nav>

      <main>{children}</main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1.5px solid var(--border)',
        padding: '28px 6%',
        marginTop: 80,
        background: 'var(--elevated)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6,
            background: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M9 2C9 2 4 6 4 10.5a5 5 0 0010 0C14 6 9 2 9 2z" fill="white" opacity=".9"/>
              <path d="M9 10.5V16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: '0.95rem',
            color: 'var(--text)',
          }}>H. Ali Nursery</span>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
          © 2026 H. Ali Nursery · Tanaman hias premium
        </p>

        <div style={{ display: 'flex', gap: 18 }}>
          <Link to="/"      style={{ color: 'var(--muted)', fontSize: '12.5px', fontWeight: 500 }}>Katalog</Link>
          <Link to="/track" style={{ color: 'var(--muted)', fontSize: '12.5px', fontWeight: 500 }}>Lacak Pesanan</Link>
        </div>
      </footer>
    </>
  );
}
