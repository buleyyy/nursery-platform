import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.customerForgotPassword({ email });
      setSent(true);
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
          fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
          color: 'var(--text)', marginBottom: 6,
        }}>Lupa Password</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginBottom: 24 }}>
          Masukkan email akunmu, kami kirim link reset password
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

        {sent ? (
          <div className="alert alert-info">
            Jika email terdaftar, link reset password sudah dikirim. Cek inbox (dan folder spam) ya.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" required
                placeholder="email@contoh.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ height: 48 }}>
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: 20 }}>
          <Link to="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>← Kembali ke Login</Link>
        </p>
      </div>
    </div>
  );
}
