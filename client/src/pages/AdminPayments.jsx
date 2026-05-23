import { useState, useEffect } from 'react';
import { api, rupiah, statusLabel, statusBadge, proofUrl } from '../utils/api';

const REJECT_REASONS = [
  'Nominal transfer tidak sesuai',
  'Bukti transfer tidak valid / tidak terbaca',
  'Rekening tujuan tidak sesuai',
  'Transfer sudah expired (lebih dari 24 jam)',
  'Bukti transfer duplikat / sudah dipakai',
  'Lainnya',
];

// ─── Modal Preview Bukti ──────────────────────────────────────────────────────
function ProofModal({ url, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--card)', borderRadius: 'var(--radius-xl)',
        padding: 12, maxWidth: 520, width: '95%',
        boxShadow: '0 24px 64px rgba(0,40,0,0.22)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px' }}>Bukti Transfer</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <img src={url} alt="Bukti transfer" style={{
          width: '100%', borderRadius: 10, maxHeight: '75vh',
          objectFit: 'contain', display: 'block', background: '#f5f9f5',
        }} />
        <a href={url} download target="_blank" rel="noreferrer"
          className="btn btn-outline btn-sm btn-full"
          style={{ marginTop: 10, textDecoration: 'none' }}>
          ⬇ Unduh Gambar
        </a>
      </div>
    </div>
  );
}

// ─── Modal Konfirmasi Terima ──────────────────────────────────────────────────
function ConfirmModal({ order, proof, onConfirm, onClose, onPreview }) {
  const [form,      setForm]      = useState({ payment_method: 'transfer', notes: '' });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      await onConfirm(order.id, form);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const imgUrl = proofUrl(proof);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', marginBottom: 3 }}> Konfirmasi Pembayaran</h2>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{order.order_number}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={onClose}>✕</button>
        </div>

        {/* Bukti preview */}
        {imgUrl ? (
          <div style={{ marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Bukti Transfer Customer</div>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1.5px solid var(--green)', cursor: 'pointer' }}
              onClick={() => onPreview(imgUrl)}>
              <img src={imgUrl} alt="Bukti" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block', background: '#f5f9f5' }} />
            </div>
            <div className="alert alert-success" style={{ marginTop: 8, padding: '7px 12px', fontSize: '12.5px' }}>
              Bukti sudah diupload customer — klik gambar untuk perbesar
            </div>
          </div>
        ) : (
          <div className="alert alert-warn" style={{ marginBottom: 14, fontSize: '12.5px' }}>
            ⚠ Belum ada bukti transfer. Pastikan sudah verifikasi manual sebelum konfirmasi.
          </div>
        )}

        {/* Summary */}
        <div style={{
          background: 'var(--green-dim)', border: '1px solid var(--green)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pelanggan</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.customer_name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)' }}>
              {rupiah(order.total_price)}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: 12, fontSize: '13px' }}>⚠ {error}</div>}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div className="form-group">
            <label className="form-label">Metode Pembayaran</label>
            <select className="select" value={form.payment_method}
              onChange={(e) => setForm(f => ({ ...f, payment_method: e.target.value }))}>
              <option value="transfer">Transfer Bank</option>
              <option value="cash">Tunai</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Catatan (opsional)</label>
            <input className="input" placeholder="Contoh: Transfer via BCA jam 10:30"
              value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={loading} onClick={handleSubmit}>
            {loading
              ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Menyimpan...</>
              : '✓ Konfirmasi Lunas'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Tolak Pembayaran ───────────────────────────────────────────────────
function RejectModal({ order, proof, onReject, onClose, onPreview }) {
  const [reason,     setReason]    = useState(REJECT_REASONS[0]);
  const [customNote, setCustomNote]= useState('');
  const [step,       setStep]      = useState(1); // 1=isi alasan, 2=konfirmasi
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState(null);

  const finalReason = reason === 'Lainnya'
    ? (customNote.trim() || 'Pembayaran ditolak oleh admin')
    : reason + (customNote.trim() ? ` — ${customNote.trim()}` : '');

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      await onReject(order.id, { reason: finalReason });
    } catch (e) {
      setError(e.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const imgUrl = proofUrl(proof);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>

        {step === 1 ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', marginBottom: 3, color: 'var(--danger)' }}>
                  Tolak Pembayaran
                </h2>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{order.order_number}</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '16px' }} onClick={onClose}>✕</button>
            </div>

            {/* Bukti preview jika ada */}
            {imgUrl && (
              <div style={{ marginBottom: 14 }}>
                <div className="section-label" style={{ marginBottom: 8 }}>Bukti Transfer Customer</div>
                <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1.5px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => onPreview(imgUrl)}>
                  <img src={imgUrl} alt="Bukti" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', display: 'block', background: '#f5f9f5' }} />
                </div>
              </div>
            )}

            {/* Info order */}
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 'var(--radius)', padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18,
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pelanggan</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{order.customer_name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--danger)' }}>
                  {rupiah(order.total_price)}
                </div>
              </div>
            </div>

            {/* Form alasan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div className="form-group">
                <label className="form-label">Alasan Penolakan *</label>
                <select className="select" value={reason}
                  onChange={(e) => { setReason(e.target.value); setCustomNote(''); }}
                  style={{ borderColor: 'var(--danger)', '--focus-color': 'var(--danger)' }}>
                  {REJECT_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {reason === 'Lainnya' ? 'Tulis alasan *' : 'Keterangan tambahan (opsional)'}
                </label>
                <textarea className="textarea" rows={2}
                  placeholder={reason === 'Lainnya' ? 'Tulis alasan penolakan...' : 'Detail tambahan untuk customer...'}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)} />
              </div>
            </div>

            <div className="alert" style={{
              marginBottom: 16, padding: '10px 13px', fontSize: '12.5px',
              background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca',
            }}>
              ⚠ Stok produk akan dikembalikan dan pesanan dibatalkan otomatis.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Batal</button>
              <button
                className="btn btn-sm"
                style={{
                  flex: 2, background: 'var(--danger)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius)',
                  padding: '8px 18px', fontWeight: 700, cursor: 'pointer',
                  fontSize: '13.5px', fontFamily: 'var(--font-body)',
                  opacity: (reason === 'Lainnya' && !customNote.trim()) ? 0.4 : 1,
                }}
                disabled={reason === 'Lainnya' && !customNote.trim()}
                onClick={() => setStep(2)}
              >
                Lanjut →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Konfirmasi akhir */}
            <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
              <div style={{
                width: 56, height: 56, margin: '0 auto 14px',
                background: '#fee2e2', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>❌</div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--danger)' }}>Yakin ingin menolak?</h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: 16, lineHeight: 1.6 }}>
                Pembayaran <strong style={{ color: 'var(--text)' }}>{order.order_number}</strong> akan ditolak
                dan pesanan akan <strong style={{ color: 'var(--danger)' }}>dibatalkan otomatis</strong>.
              </p>

              {/* Ringkasan alasan */}
              <div style={{
                background: '#fff5f5', border: '1px solid #fecaca',
                borderRadius: 'var(--radius)', padding: '11px 14px',
                fontSize: '13px', textAlign: 'left', marginBottom: 18,
              }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  Alasan Penolakan
                </div>
                <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{finalReason}</div>
              </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: 12, fontSize: '13px' }}>⚠ {error}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Kembali</button>
              <button
                style={{
                  flex: 2, background: 'var(--danger)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius)',
                  padding: '10px 18px', fontWeight: 700, cursor: 'pointer',
                  fontSize: '13.5px', fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Memproses...</>
                  : '❌ Ya, Tolak Pembayaran'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPayments() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [confirmOrder,setConfirmOrder]= useState(null); // modal konfirmasi
  const [rejectOrder, setRejectOrder] = useState(null); // modal tolak
  const [previewUrl,  setPreviewUrl]  = useState(null); // modal gambar
  const [proofMap,    setProofMap]    = useState({});
  const [toast,       setToast]       = useState(null);

  useEffect(() => { loadPending(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.adminOrders('?payment=pending&limit=50');
      const list = res.data || [];
      setOrders(list);

      const map = {};
      await Promise.all(list.map(async (o) => {
        try {
          const detail = await api.adminOrderDetail(o.id);
          map[o.id] = detail.data?.payment?.payment_proof || null;
        } catch {
          map[o.id] = null;
        }
      }));
      setProofMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, form) => {
    await api.confirmPayment(id, form);
    setConfirmOrder(null);
    showToast('Pembayaran berhasil dikonfirmasi');
    loadPending();
  };

  const handleReject = async (id, body) => {
    await api.rejectPayment(id, body);
    setRejectOrder(null);
    showToast('Pembayaran ditolak dan pesanan dibatalkan', 'danger');
    loadPending();
  };

  return (
    <div style={{ padding: '28px 28px 64px' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, marginBottom: 3 }}>
              Verifikasi Pembayaran
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Konfirmasi atau tolak pembayaran customer · {orders.length} pending
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={loadPending}>↻ Refresh</button>
        </div>
      </div>

      {/* ── Legend badge ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          ['✅', 'Konfirmasi — pembayaran valid', '#d1fae5', '#047857', '#a7f3d0'],
          ['❌', 'Tolak — pembayaran bermasalah', '#fee2e2', '#b91c1c', '#fecaca'],
          ['⏳', 'Belum ada bukti transfer',      '#fef3c7', '#b45309', '#fde68a'],
        ].map(([icon, label, bg, color, border]) => (
          <div key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: bg, color, border: `1px solid ${border}`,
            borderRadius: 999, padding: '4px 12px', fontSize: '12px', fontWeight: 600,
          }}>
            <span>{icon}</span>{label}
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: 300 }}>
          <div className="spinner" /><span>Memuat data...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="empty-icon"></div>
          <h3 style={{ marginBottom: 6 }}>Tidak ada yang perlu diverifikasi</h3>
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Semua pembayaran sudah ditangani.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Status Order</th>
                <th style={{ textAlign: 'center' }}>Bukti Transfer</th>
                <th>Tanggal</th>
                <th style={{ textAlign: 'center', minWidth: 200 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const proof  = proofMap[order.id];
                const imgUrl = proofUrl(proof);

                return (
                  <tr key={order.id}>
                    {/* No. Pesanan */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 600, fontSize: '12.5px' }}>
                        {order.order_number}
                      </span>
                    </td>

                    {/* Pelanggan */}
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        {order.phone_number}
                      </div>
                    </td>

                    {/* Total */}
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--green)' }}>
                        {rupiah(order.total_price)}
                      </span>
                    </td>

                    {/* Status order */}
                    <td>
                      <span className={statusBadge(order.order_status)}>
                        {statusLabel[order.order_status]}
                      </span>
                    </td>

                    {/* Bukti Transfer */}
                    <td style={{ textAlign: 'center' }}>
                      {proof === undefined ? (
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, margin: '0 auto' }} />
                      ) : imgUrl ? (
                        <button
                          onClick={() => setPreviewUrl(imgUrl)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: '0 auto', display: 'block' }}
                          title="Lihat bukti transfer"
                        >
                          <img src={imgUrl} alt="Bukti" style={{
                            width: 48, height: 48, objectFit: 'cover',
                            borderRadius: 8, border: '2px solid var(--green)',
                            boxShadow: '0 2px 8px rgba(45,140,78,0.2)',
                            transition: 'transform 0.15s',
                          }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        </button>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11.5px', color: 'var(--warn)', fontWeight: 600 }}>
                          Belum
                        </span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(order.order_date).toLocaleDateString('id-ID')}
                    </td>

                    {/* Aksi — dua tombol */}
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setConfirmOrder(order)}
                          title="Konfirmasi pembayaran lunas"
                        >
                          ✓ Terima
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            background: 'var(--danger-dim)', color: 'var(--danger)',
                            border: '1px solid rgba(192,57,43,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 12px', fontWeight: 600,
                            cursor: 'pointer', fontSize: '12.5px',
                            fontFamily: 'var(--font-body)',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,57,43,0.16)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--danger-dim)'; }}
                          onClick={() => setRejectOrder(order)}
                          title="Tolak pembayaran"
                        >
                          ✕ Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Konfirmasi Terima ── */}
      {confirmOrder && (
        <ConfirmModal
          order={confirmOrder}
          proof={proofMap[confirmOrder.id]}
          onConfirm={handleConfirm}
          onClose={() => setConfirmOrder(null)}
          onPreview={setPreviewUrl}
        />
      )}

      {/* ── Modal Tolak Pembayaran ── */}
      {rejectOrder && (
        <RejectModal
          order={rejectOrder}
          proof={proofMap[rejectOrder.id]}
          onReject={handleReject}
          onClose={() => setRejectOrder(null)}
          onPreview={setPreviewUrl}
        />
      )}

      {/* ── Modal Preview Gambar ── */}
      {previewUrl && (
        <ProofModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {/* ── Toast notifikasi ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'danger' ? 'var(--danger)' : 'var(--green)',
          color: '#fff', padding: '11px 24px', borderRadius: 999,
          fontWeight: 600, fontSize: '13.5px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 999, whiteSpace: 'nowrap',
          animation: 'toastIn 0.2s var(--ease)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
