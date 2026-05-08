import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, rupiah, proofUrl } from '../utils/api';

const BANK_DETAILS = [
  { bank: 'BCA',     norek: '1234567890', atas: 'Ali Nursery' },
  { bank: 'Mandiri', norek: '0987654321', atas: 'Ali Nursery' },
  { bank: 'BRI',     norek: '1122334455', atas: 'Ali Nursery' },
];

// ─── Upload Box Component ─────────────────────────────────────────────────────
function UploadProof({ orderNumber, existingProof, onSuccess }) {
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(existingProof ? proofUrl(existingProof) : null);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(!!existingProof);
  const [drag,       setDrag]       = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Ukuran file maksimal 5 MB'); return; }
    if (!['image/jpeg','image/png','image/webp','image/jpg'].includes(f.type)) {
      setError('Hanya file JPG / PNG / WEBP'); return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      await api.uploadProof(orderNumber, file);
      setSuccess(true);
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--green)' : success ? 'var(--green)' : 'var(--border-2)'}`,
          borderRadius: 'var(--radius-lg)',
          background: drag ? 'var(--green-dim)' : success ? '#f0fdf4' : 'var(--elevated)',
          padding: preview ? '12px' : '28px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {preview ? (
          /* Preview image */
          <div style={{ position: 'relative' }}>
            <img
              src={preview}
              alt="Bukti transfer"
              style={{
                width: '100%', maxHeight: 280,
                objectFit: 'contain',
                borderRadius: 8,
                display: 'block',
              }}
            />
            {success && (
              <div style={{
                position: 'absolute', top: 8, right: 8,
                background: 'var(--green)', color: '#fff',
                borderRadius: 999, padding: '3px 10px',
                fontSize: '11.5px', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                ✓ Terupload
              </div>
            )}
            <div style={{
              marginTop: 10, fontSize: '12px', color: 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <span>📷</span> Klik atau seret untuk ganti foto
            </div>
          </div>
        ) : (
          /* Empty state */
          <div>
            <div style={{
              width: 52, height: 52, margin: '0 auto 12px',
              background: 'var(--green-dim)',
              border: '1.5px dashed var(--green)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem',
            }}>📤</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: 5 }}>
              Upload Bukti Transfer
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Seret foto ke sini, atau <span style={{ color: 'var(--green)', fontWeight: 600 }}>pilih file</span>
              <br />JPG / PNG / WEBP · Maks 5 MB
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger" style={{ marginTop: 10, fontSize: '13px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Upload button */}
      {file && !success && (
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 10, height: 44 }}
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading
            ? <><span className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Mengunggah...</>
            : '📤 Upload Bukti Sekarang'}
        </button>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginTop: 10, fontSize: '13px' }}>
          ✅ Bukti transfer berhasil dikirim! Admin akan memverifikasi dalam 1×24 jam.
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentInfo() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(null);

  useEffect(() => { loadOrder(); }, [orderNumber]);

  const loadOrder = async () => {
    try {
      const res = await api.trackOrder(`orderNumber=${orderNumber}`);
      setOrder(res.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="loading-page"><div className="spinner" /></div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '80px 5%' }}>
      <div style={{ fontSize: '3rem', marginBottom: 14, opacity: 0.4 }}>🔍</div>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Pesanan tidak ditemukan</h2>
      <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
        Kembali ke Home
      </button>
    </div>
  );

  const isPaid    = order.payment_status === 'paid';
  const hasProof  = !!order.payment?.payment_proof;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '36px 5% 80px' }}>

      {/* ── Success header ── */}
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{
          width: 64, height: 64, margin: '0 auto 14px',
          background: isPaid ? 'var(--green-dim)' : '#fef9c3',
          border: `1.5px solid ${isPaid ? 'var(--green)' : '#fde047'}`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem',
        }}>
          {isPaid ? '✅' : '🧾'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem', fontWeight: 700, marginBottom: 6,
          color: 'var(--text)',
        }}>
          {isPaid ? 'Pembayaran Lunas!' : 'Selesaikan Pembayaran'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
          {isPaid
            ? 'Pesananmu sedang diproses. Terima kasih!'
            : 'Transfer ke rekening di bawah dan upload bukti transfermu.'}
        </p>
      </div>

      {/* ── Order summary card ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 3 }}>No. Pesanan</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '14px', color: 'var(--green)' }}>
              {order.order_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="section-label" style={{ marginBottom: 3 }}>Total Tagihan</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--green)' }}>
              {rupiah(order.total_price)}
            </div>
          </div>
        </div>
        <hr className="divider" />
        <div style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div><span style={{ color: 'var(--muted)' }}>Pembeli: </span><span style={{ fontWeight: 500 }}>{order.customer_name}</span></div>
          <div><span style={{ color: 'var(--muted)' }}>Telp: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{order.phone_number}</span></div>
          <div><span style={{ color: 'var(--muted)' }}>Alamat: </span><span style={{ color: 'var(--text-2)' }}>{order.shipping_address}</span></div>
        </div>
      </div>

      {/* ── Item list ── */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>Item Pesanan</div>
        {(order.items || []).map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: '13.5px',
          }}>
            <span style={{ color: 'var(--text-2)' }}>
              {item.image_emoji} {item.product_name} × {item.quantity}
            </span>
            <span style={{ fontWeight: 600 }}>{rupiah(item.subtotal)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontWeight: 700 }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)', fontSize: '1.05rem' }}>
            {rupiah(order.total_price)}
          </span>
        </div>
      </div>

      {/* ── Rekening bank ── */}
      {!isPaid && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>
            Rekening Tujuan Transfer
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BANK_DETAILS.map(b => (
              <div key={b.bank} style={{
                background: 'var(--elevated)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '13px 15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--green-2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>
                    Bank {b.bank}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '15px', letterSpacing: '1.5px' }}>
                    {b.norek}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 2 }}>a.n. {b.atas}</div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => copyText(b.norek, b.bank)}
                  style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                >
                  {copied === b.bank ? '✓ Disalin' : 'Salin'}
                </button>
              </div>
            ))}
          </div>

          <div className="alert alert-warn" style={{ marginTop: 12 }}>
            ⚠ Transfer nominal tepat sesuai tagihan. Jangan ada angka lebih/kurang.
          </div>
        </div>
      )}

      {/* ── Upload bukti transfer ── */}
      {!isPaid && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--green-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', flexShrink: 0,
            }}>📋</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Upload Bukti Transfer</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {hasProof ? 'Bukti sudah dikirim — bisa diganti' : 'Upload screenshot/foto bukti transfer kamu'}
              </div>
            </div>
          </div>

          <UploadProof
            orderNumber={order.order_number}
            existingProof={order.payment?.payment_proof || null}
            onSuccess={loadOrder}
          />
        </div>
      )}

      {/* ── Paid state ── */}
      {isPaid && (
        <div className="alert alert-success" style={{ marginBottom: 12, padding: '16px' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>✅ Pembayaran dikonfirmasi</div>
            <div style={{ fontSize: '12.5px' }}>
              Pesananmu sudah diverifikasi admin dan sedang diproses.
            </div>
          </div>
        </div>
      )}

      {/* ── CTA buttons ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {!isPaid && (
          <a
            href={`https://wa.me/6285724467159?text=Halo%2C%20saya%20sudah%20transfer%20untuk%20pesanan%20${order.order_number}%20sebesar%20${rupiah(order.total_price)}`}
            target="_blank" rel="noreferrer"
            className="btn btn-primary btn-lg"
            style={{ flex: 2, textDecoration: 'none' }}
          >
            💬 Konfirmasi via WA
          </a>
        )}
        <button
          className={`btn btn-lg ${isPaid ? 'btn-primary btn-full' : 'btn-outline'}`}
          style={{ flex: isPaid ? undefined : 1 }}
          onClick={() => navigate(`/track?orderNumber=${order.order_number}`)}
        >
          📦 Lacak Pesanan
        </button>
      </div>
    </div>
  );
}
