import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api.login(form);
      localStorage.setItem('adminToken', res.token);
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(82,214,138,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 16px',
            background: 'var(--green-dim)',
            border: '1px solid rgba(82,214,138,0.2)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.7rem',
          }}>🌿</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem', fontWeight: 600,
            color: 'var(--text)', marginBottom: 5,
          }}>Ali Nursery</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Masuk ke panel admin
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 26px',
        }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 18, fontSize: '13px' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 6, height: 44 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} /> Masuk...</>
                : 'Masuk'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', color: 'var(--muted)',
          fontSize: '11.5px', marginTop: 18,
          fontFamily: 'var(--font-mono)',
        }}>
          default: admin / admin123
        </p>
      </div>
    </div>
  );
}
