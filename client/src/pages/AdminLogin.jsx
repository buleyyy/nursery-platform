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
      background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 40%, #f5f9f5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background leaf decoration */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'rgba(45,140,78,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: 240, height: 240,
        borderRadius: '50%',
        background: 'rgba(45,140,78,0.05)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, margin: '0 auto 16px',
            background: 'var(--green)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem',
            boxShadow: '0 6px 24px rgba(45,140,78,0.3)',
          }}>🌿</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem', fontWeight: 700,
            color: 'var(--text)', marginBottom: 6,
          }}>Ali Nursery</h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 500 }}>
            Masuk ke panel admin
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1.5px solid var(--border)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 8px 40px rgba(0,60,20,0.10)',
        }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 18, fontSize: '13px' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              style={{ marginTop: 4, height: 46 }}
            >
              {loading
                ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Masuk...</>
                : '🔐 Masuk'}
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
