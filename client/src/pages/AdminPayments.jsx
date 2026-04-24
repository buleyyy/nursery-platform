import { useState, useEffect } from 'react';
import { api, rupiah, statusLabel, statusBadge } from '../utils/api';

export default function AdminPayments() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [form, setForm] = useState({ payment_method: 'transfer', notes: '' });

  useEffect(() => { loadPending(); }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.adminOrders('?payment=pending&limit=50');
      setOrders(res.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setConfirming(true);
    try {
      await api.confirmPayment(selected.id, form);
      setSelected(null);
      loadPending();
    } catch (e) {
      alert('Gagal konfirmasi: ' + e.message);
    } finally {
      setConfirming(false);
    }
  };

  const openConfirm = (order) => {
    setSelected(order);
    setForm({ payment_method: 'transfer', notes: '' });
  };

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.7rem', fontWeight: 600, marginBottom: 3,
        }}>Konfirmasi Pembayaran</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
          Pesanan yang menunggu konfirmasi pembayaran
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '64px 20px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 14, opacity: 0.5 }}>◎</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>
            Semua pembayaran sudah dikonfirmasi
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
            Tidak ada pesanan yang menunggu konfirmasi.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status Pesanan</th>
                <th>Tanggal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--green)', fontWeight: 500,
                      fontSize: '12.5px',
                    }}>
                      {order.order_number}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '13.5px' }}>
                      {order.customer_name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                      {order.phone_number}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600, fontSize: '14px', color: 'var(--green)',
                    }}>
                      {rupiah(order.total_price)}
                    </span>
                  </td>
                  <td>
                    <span className={statusBadge(order.order_status)}>
                      {statusLabel[order.order_status]}
                    </span>
                  </td>
                  <td style={{
                    fontSize: '12px', color: 'var(--muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {new Date(order.order_date).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openConfirm(order)}
                    >
                      Konfirmasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 20,
            }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', marginBottom: 3 }}>
                  Konfirmasi Pembayaran
                </h2>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                  {selected.order_number}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '16px' }}
                onClick={() => setSelected(null)}
              >×</button>
            </div>

            {/* Amount highlight */}
            <div style={{
              background: 'var(--green-dim)',
              border: '1px solid rgba(82,214,138,0.2)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 18,
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Pelanggan
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selected.customer_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Jumlah
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600, fontSize: '1.2rem', color: 'var(--green)',
                }}>
                  {rupiah(selected.total_price)}
                </div>
              </div>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Metode Pembayaran</label>
                <select
                  className="select"
                  value={form.payment_method}
                  onChange={(e) => setForm(f => ({ ...f, payment_method: e.target.value }))}
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Catatan (opsional)</label>
                <input
                  className="input"
                  placeholder="Contoh: Transfer via BCA jam 10:30"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setSelected(null)}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={confirming}
                onClick={handleConfirm}
              >
                {confirming
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Menyimpan...</>
                  : '✓ Konfirmasi Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
