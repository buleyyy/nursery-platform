import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function CustomerLogin() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useCustomerAuth();
  const from = location.state?.from || '/';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api.customerLogin(form);
      login(res.token, res.customer);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 5% 72px' }}>
      <div className="card">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700,
          color: 'var(--text)', marginBottom: 6,
        }}>Masuk Akun</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginBottom: 24 }}>
          Login untuk berbelanja dan melihat riwayat pesanan
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" name="email" required
              placeholder="email@contoh.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" name="password" required
              placeholder="••••••••" value={form.password} onChange={handleChange} />
          </div>

          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/forgot-password" style={{ fontSize: '12.5px', color: 'var(--green)', fontWeight: 600 }}>
              Lupa password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ height: 48 }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: 20 }}>
          Belum punya akun? <Link to="/register" style={{ color: 'var(--green)', fontWeight: 700 }}>Daftar</Link>
        </p>
      </div>
    </div>
  );
}
