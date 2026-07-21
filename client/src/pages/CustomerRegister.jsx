import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export default function CustomerRegister() {
  const navigate  = useNavigate();
  const { login } = useCustomerAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone_number: '', address: '',
  });
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await api.customerRegister(form);
      login(res.token, res.customer);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '60px auto', padding: '0 5% 72px' }}>
      <div className="card">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700,
          color: 'var(--text)', marginBottom: 6,
        }}>Buat Akun</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginBottom: 24 }}>
          Daftar untuk mulai belanja tanaman hias
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className="input" name="name" required
              placeholder="Budi Santoso" value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="input" type="email" name="email" required
              placeholder="email@contoh.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="input" type="password" name="password" required minLength={6}
              placeholder="Minimal 6 karakter" value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp</label>
            <input className="input" type="tel" name="phone_number"
              placeholder="08123456789" value={form.phone_number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Alamat</label>
            <textarea className="textarea" name="address" rows={2}
              placeholder="Jl. Contoh No. 10, ..." value={form.address} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ height: 48, marginTop: 4 }}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: 20 }}>
          Sudah punya akun? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>Masuk</Link>
        </p>
      </div>
    </div>
  );
}
