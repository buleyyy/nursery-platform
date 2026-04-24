import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, rupiah } from '../utils/api';

const BANK_DETAILS = [
  { bank: 'BCA',     norek: '1234567890', atas: 'Ali Nursery' },
  { bank: 'Mandiri', norek: '0987654321', atas: 'Ali Nursery' },
  { bank: 'BRI',     norek: '1122334455', atas: 'Ali Nursery' },
];

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
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '80px 5%' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 14, opacity: 0.5 }}>?</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
        Pesanan tidak ditemukan
      </h2>
      <button className="btn btn-primary" style={{ marginTop: 24 }}
        onClick={() => navigate('/')}>Kembali ke Home</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '36px 5% 80px' }}>
      {/* Success header */}
      <div style={{ textAlign: 'center', marginBottom: 34 }}>
        <div style={{
          width: 60, height: 60, margin: '0 auto 16px',
          background: 'var(--green-dim)',
          border: '1.5px solid rgba(82,214,138,0.4)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', color: 'var(--green)',
        }}>✓</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem', fontWeight: 600, marginBottom: 6,
        }}>Pesanan Berhasil Dibuat</h1>
        <p style={{ color: 'var(--text-2)', fontSize: '14px' }}>
          Selesaikan pembayaran untuk memproses pesananmu.
        </p>
      </div>

      {/* Order summary */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>No. Pesanan</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 500, fontSize: '14px', color: 'var(--green)',
            }}>
              {order.order_number}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="section-label" style={{ marginBottom: 4 }}>Total Pembayaran</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600, fontSize: '1.5rem', color: 'var(--green)',
            }}>
              {rupiah(order.total_price)}
            </div>
          </div>
        </div>

        <hr className="divider" />

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 5,
          fontSize: '13.5px',
        }}>
          <div>
            <span style={{ color: 'var(--muted)' }}>Atas nama </span>
            <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
          </div>
          <div>
            <span style={{ color: 'var(--muted)' }}>Telepon </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{order.phone_number}</span>
          </div>
          <div>
            <span style={{ color: 'var(--muted)' }}>Alamat </span>
            <span style={{ color: 'var(--text-2)' }}>{order.shipping_address}</span>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="card" style={{ marginBottom: 14 }}>
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
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 12,
        }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600, fontSize: '1.05rem', color: 'var(--green)',
          }}>{rupiah(order.total_price)}</span>
        </div>
      </div>

      {/* Bank Transfer */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-label" style={{ marginBottom: 14 }}>Transfer ke Salah Satu Rekening</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BANK_DETAILS.map(b => (
            <div key={b.bank} style={{
              background: 'var(--elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '13px 15px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12,
            }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--green-2)',
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3,
                }}>Bank {b.bank}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500, fontSize: '15px', letterSpacing: '1.5px',
                }}>{b.norek}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: 1 }}>
                  a.n. {b.atas}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                onClick={() => copyText(b.norek, b.bank)}
              >
                {copied === b.bank ? '✓ Salin' : 'Salin'}
              </button>
            </div>
          ))}
        </div>

        <div className="alert alert-warn" style={{ marginTop: 14 }}>
          <span>⚠</span>
          Transfer tepat sesuai nominal. Konfirmasi ke WhatsApp admin setelah transfer.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={`https://wa.me/6281234567890?text=Halo%2C%20saya%20sudah%20transfer%20untuk%20pesanan%20${order.order_number}%20sebesar%20${rupiah(order.total_price)}`}
          target="_blank" rel="noreferrer"
          className="btn btn-primary btn-lg"
          style={{ flex: 2, textDecoration: 'none' }}
        >
          Konfirmasi via WhatsApp
        </a>
        <button
          className="btn btn-ghost btn-lg"
          style={{ flex: 1 }}
          onClick={() => navigate(`/track?orderNumber=${order.order_number}`)}
        >
          Lacak
        </button>
      </div>
    </div>
  );
}
