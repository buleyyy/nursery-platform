import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState(null);
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await api.customerResetPassword({ email, token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 5% 72px' }}>
        <div className="alert alert-danger">Link reset password tidak valid.</div>
        <p style={{ marginTop: 16 }}><Link to="/forgot-password" style={{ color: 'var(--green)', fontWeight: 700 }}>Minta link baru</Link></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 5% 72px' }}>
      <div className="card">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
          color: 'var(--text)', marginBottom: 6,
        }}>Reset Password</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginBottom: 24 }}>
          Akun: {email}
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

        {done ? (
          <div className="alert alert-info">Password berhasil direset. Mengalihkan ke login...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input className="input" type="password" required minLength={6}
                placeholder="Minimal 6 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ height: 48 }}>
              {loading ? 'Memproses...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
